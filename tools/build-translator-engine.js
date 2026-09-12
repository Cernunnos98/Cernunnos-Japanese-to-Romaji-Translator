#!/usr/bin/env node
const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const rootArg = args.find(arg => arg !== '--check');
const root = path.resolve(rootArg || path.join(__dirname, '..'));
const sourceDir = path.join(root, 'src', 'translator');
const outputPath = path.join(root, 'translator-engine.js');
const sourceMapPath = `${outputPath}.map`;

const sourceFiles = [
    '00-contracts.js',
    '01-assets-and-schemas.js',
    '02-ui-controls.js',
    '03-runtime-state.js',
    '04-data-and-kanji-loaders.js',
    '05-romaji-core.js',
    '06-lexical-and-evidence-loaders.js',
    '07-token-merging.js',
    '08-reading-resolver.js',
    '09-token-repair-and-grammar.js',
    '10-output-and-translation-pipeline.js',
    '11-public-api-and-bootstrap.js'
];

const missing = sourceFiles.filter(file => !fs.existsSync(path.join(sourceDir, file)));
if (missing.length) {
    console.error(`Translator source is incomplete: ${missing.join(', ')}`);
    process.exit(2);
}

const header = [
    '// Generated browser engine. Edit src/translator/*.js, not this file.',
    '// Rebuild with: node tools/build-translator-engine.js',
    '(function () {',
    "    'use strict';",
    "    const ENGINE_INSTANCE_SYMBOL = Symbol.for('CJ2R.translator.engine.instance');",
    "    const RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL = Symbol.for('CJ2R.translator.runtime-diagnostics.bridge');",
    '    const ENGINE_INSTANCE_TOKEN = Object.freeze({});',
    '    if (window[ENGINE_INSTANCE_SYMBOL]) return;',
    '    window[ENGINE_INSTANCE_SYMBOL] = ENGINE_INSTANCE_TOKEN;',
    '    try {',
    ''
].join('\n');
const footer = [
    '    } catch (error) {',
    '        if (window[ENGINE_INSTANCE_SYMBOL] === ENGINE_INSTANCE_TOKEN) delete window[ENGINE_INSTANCE_SYMBOL];',
    '        throw error;',
    '    }',
    '}());',
    '//# sourceMappingURL=translator-engine.js.map',
    ''
].join('\n');

const sources = sourceFiles.map(file => ({
    file,
    content: fs.readFileSync(path.join(sourceDir, file), 'utf8').trimEnd()
}));
const body = sources.map(source => source.content).join('\n\n');
const generated = `${header}${body}\n${footer}`;

function lineMappings(lineCount, generatedColumn = 0) {
    if (lineCount <= 0) return '';
    const first = generatedColumn === 0 ? 'AAAA' : 'IAAA';
    const next = generatedColumn === 0 ? 'AACA' : 'IACA';
    return [first, ...Array.from({ length: lineCount - 1 }, () => next)].join(';');
}

let generatedLineOffset = header.split('\n').length - 1;
const sections = sources.map((source, index) => {
    const lineCount = source.content.split('\n').length;
    const section = {
        offset: { line: generatedLineOffset, column: 0 },
        map: {
            version: 3,
            sources: [`src/translator/${source.file}`],
            sourcesContent: [source.content],
            names: [],
            mappings: lineMappings(lineCount)
        }
    };
    generatedLineOffset += lineCount + (index < sources.length - 1 ? 2 : 0);
    return section;
});
const generatedMap = `${JSON.stringify({ version: 3, file: path.basename(outputPath), sections })}\n`;

if (checkOnly) {
    const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
    const currentMap = fs.existsSync(sourceMapPath) ? fs.readFileSync(sourceMapPath, 'utf8') : '';
    if (current !== generated || currentMap !== generatedMap) {
        console.error('translator-engine.js or its source map is out of date with src/translator/.');
        console.error('Run: node tools/build-translator-engine.js');
        process.exit(1);
    }
    console.log('Generated engine and source map are up to date.');
    process.exit(0);
}

fs.writeFileSync(outputPath, generated, 'utf8');
fs.writeFileSync(sourceMapPath, generatedMap, 'utf8');
console.log(`Built ${path.relative(root, outputPath)} and source map from ${sourceFiles.length} source sections.`);
