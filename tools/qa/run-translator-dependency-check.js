#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const ts = require('typescript');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const verbose = process.argv.includes('--verbose');
const sourceDir = path.join(root, 'src', 'translator');
const files = fs.readdirSync(sourceDir)
    .filter(name => /^\d{2}-.+\.js$/u.test(name))
    .sort()
    .map(name => path.join(sourceDir, name));

if (!files.length) {
    console.error('No numbered translator source sections were found.');
    process.exit(2);
}

const canonical = new Map(files.map(file => [path.resolve(file), path.basename(file)]));
const program = ts.createProgram(files, {
    allowJs: true,
    checkJs: false,
    noEmit: true,
    target: ts.ScriptTarget.ES2022,
    lib: ['lib.es2022.d.ts', 'lib.dom.d.ts']
});
const checker = program.getTypeChecker();

// Track only top-level runtime value symbols. JSDoc property/type symbols and
// ambient globals are deliberately excluded so the graph reflects executable
// source-section coupling rather than shared type vocabulary.
const symbolOwners = new Map();
function recordTopLevelName(name, owner) {
    if (!name || !ts.isIdentifier(name)) return;
    const symbol = checker.getSymbolAtLocation(name);
    if (symbol) symbolOwners.set(symbol, owner);
}

for (const sourceFile of program.getSourceFiles()) {
    const owner = canonical.get(path.resolve(sourceFile.fileName));
    if (!owner) continue;
    for (const statement of sourceFile.statements) {
        if (ts.isFunctionDeclaration(statement) || ts.isClassDeclaration(statement)) {
            recordTopLevelName(statement.name, owner);
        } else if (ts.isVariableStatement(statement)) {
            for (const declaration of statement.declarationList.declarations) {
                recordTopLevelName(declaration.name, owner);
            }
        }
    }
}

const edges = new Map([...canonical.values()].map(name => [name, new Map()]));
for (const sourceFile of program.getSourceFiles()) {
    const from = canonical.get(path.resolve(sourceFile.fileName));
    if (!from) continue;
    const visit = node => {
        if (ts.isIdentifier(node)) {
            const symbol = checker.getSymbolAtLocation(node);
            const to = symbolOwners.get(symbol);
            if (to && to !== from) {
                if (!edges.get(from).has(to)) edges.get(from).set(to, new Set());
                edges.get(from).get(to).add(node.text);
            }
        }
        ts.forEachChild(node, visit);
    };
    visit(sourceFile);
}

let nextIndex = 0;
const indexes = new Map();
const lows = new Map();
const stack = [];
const onStack = new Set();
const components = [];
function strongConnect(node) {
    indexes.set(node, nextIndex);
    lows.set(node, nextIndex);
    nextIndex += 1;
    stack.push(node);
    onStack.add(node);

    for (const target of edges.get(node).keys()) {
        if (!indexes.has(target)) {
            strongConnect(target);
            lows.set(node, Math.min(lows.get(node), lows.get(target)));
        } else if (onStack.has(target)) {
            lows.set(node, Math.min(lows.get(node), indexes.get(target)));
        }
    }

    if (lows.get(node) === indexes.get(node)) {
        const component = [];
        let current;
        do {
            current = stack.pop();
            onStack.delete(current);
            component.push(current);
        } while (current !== node);
        components.push(component);
    }
}
for (const node of edges.keys()) {
    if (!indexes.has(node)) strongConnect(node);
}

const cycles = components
    .filter(component => component.length > 1)
    .map(component => component.sort());

if (verbose) {
    for (const [from, targets] of edges) {
        for (const [to, names] of targets) {
            console.log(`${from} -> ${to}: ${[...names].sort().join(', ')}`);
        }
    }
}

if (cycles.length) {
    console.error('Circular translator source dependencies detected:');
    for (const component of cycles) console.error(`  - ${component.join(' -> ')}`);
    process.exit(1);
}

const edgeCount = [...edges.values()].reduce((total, targets) => total + targets.size, 0);
console.log(`Translator source dependency graph is acyclic (${files.length} sections, ${edgeCount} cross-section edges).`);
