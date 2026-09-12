#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const args = process.argv.slice(2);
const checkOnly = args.includes('--check');
const rootArg = args.find(arg => arg !== '--check');
const root = path.resolve(rootArg || path.join(__dirname, '../..'));
const sourceDir = path.join(root, 'tools', 'qa', 'suites');
const outputPath = path.join(root, 'tools', 'qa', 'translator-qa.js');
const sourceMapPath = `${outputPath}.map`;
const sourceFiles = [
    'qa-core.js',
    'romaji-core.js',
    'tokenisation-and-merging.js',
    'tokenisation-mutation.js',
    'numbers-and-counters.js',
    'names-and-loanwords.js',
    'grammar.js',
    'ambiguity-and-audit.js',
    'historical-kana.js',
    'runtime-and-api.js',
    'regression-mechanisms.js',
    'qa-check-order.js',
    'qa-runner.js'
];
const missing = sourceFiles.filter(file => !fs.existsSync(path.join(sourceDir, file)));
if (missing.length) {
    console.error(`Translator QA source is incomplete: ${missing.join(', ')}`);
    process.exit(2);
}
const header = ['(function () {', "    'use strict';", ''].join('\n');
const footer = ['}());', '//# sourceMappingURL=translator-qa.js.map', ''].join('\n');
const sources = sourceFiles.map(file => ({
    file,
    content: fs.readFileSync(path.join(sourceDir, file), 'utf8').trimEnd()
}));
const bodyParts = sources.map(source => source.content.split('\n').map(line => `    ${line}`).join('\n'));
const generated = `${header}${bodyParts.join('\n\n')}\n${footer}`;

function lineMappings(lineCount) {
    if (lineCount <= 0) return '';
    return ['IAAA', ...Array.from({ length: lineCount - 1 }, () => 'IACA')].join(';');
}
let generatedLineOffset = header.split('\n').length - 1;
const sections = sources.map((source, index) => {
    const lineCount = source.content.split('\n').length;
    const section = {
        offset: { line: generatedLineOffset, column: 0 },
        map: {
            version: 3,
            sources: [`suites/${source.file}`],
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
        console.error('translator-qa.js or its source map is out of date with tools/qa/suites/.');
        console.error('Run: node tools/qa/build-translator-qa.js');
        process.exit(1);
    }
    console.log('Generated translator QA bundle and source map are up to date.');
    process.exit(0);
}
fs.writeFileSync(outputPath, generated, 'utf8');
fs.writeFileSync(sourceMapPath, generatedMap, 'utf8');
console.log(`Built ${path.relative(root, outputPath)} and source map from ${sourceFiles.length} QA source sections.`);
