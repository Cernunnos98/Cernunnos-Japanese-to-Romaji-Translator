#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const tsc = process.env.TSC || 'tsc';

function getTypeScriptVersion() {
    const result = spawnSync(tsc, ['--version'], { encoding: 'utf8' });
    if (result.error) {
        console.error(`Unable to run TypeScript static checking: ${result.error.message}`);
        process.exit(2);
    }
    if (result.status !== 0) process.exit(result.status || 1);
    const output = `${result.stdout || ''}${result.stderr || ''}`.trim();
    const match = output.match(/Version\s+(\d+)\.(\d+)\.(\d+)/i);
    if (!match) {
        console.error(`Unable to determine TypeScript version from: ${output || '(no output)'}`);
        process.exit(2);
    }
    const version = { major: Number(match[1]), minor: Number(match[2]), patch: Number(match[3]), text: `${match[1]}.${match[2]}.${match[3]}` };
    const supported = (version.major === 5 && version.minor >= 8) || version.major === 6;
    if (!supported) {
        console.error(`Unsupported TypeScript ${version.text}. CJ2R release QA supports TypeScript >=5.8.0 and <7.0.0.`);
        process.exit(2);
    }
    return version;
}

const version = getTypeScriptVersion();
const args = [
    '--allowJs', '--checkJs', '--noEmit',
    '--strict', 'false', '--noImplicitAny', 'false', '--strictNullChecks', 'true',
    '--target', 'ES2022', '--lib', 'ES2022,DOM', '--skipLibCheck',
    path.join(root, 'tools/qa/types/cj2r-globals.d.ts'),
    path.join(root, 'translator-engine.js')
];
const result = spawnSync(tsc, args, { stdio: 'inherit' });
if (result.error) {
    console.error(`Unable to run TypeScript static checking: ${result.error.message}`);
    process.exit(2);
}
if (result.status !== 0) process.exit(result.status || 1);
console.log(`Translator JSDoc/static type check passed with TypeScript ${version.text}.`);
