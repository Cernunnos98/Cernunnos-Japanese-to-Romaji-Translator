#!/usr/bin/env node
const path = require('path');
const { spawnSync } = require('child_process');
const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const tsc = process.env.TSC || 'tsc';
const args = [
    '--allowJs', '--checkJs', '--noEmit', '--strictNullChecks', '--target', 'ES2022', '--lib', 'ES2022,DOM', '--skipLibCheck',
    path.join(root, 'tools/qa/types/cj2r-globals.d.ts'),
    path.join(root, 'translator-engine.js')
];
const result = spawnSync(tsc, args, { stdio: 'inherit' });
if (result.error) {
    console.error(`Unable to run TypeScript static checking: ${result.error.message}`);
    process.exit(2);
}
if (result.status !== 0) process.exit(result.status || 1);
console.log('Translator JSDoc/static type check passed.');
