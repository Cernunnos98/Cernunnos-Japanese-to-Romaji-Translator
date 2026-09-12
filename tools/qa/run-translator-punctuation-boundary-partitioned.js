const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const partitions = Math.max(1, Number.parseInt(process.env.TRANSLATOR_PUNCTUATION_PARTITIONS || '6', 10) || 6);
const runner = path.join(__dirname, 'run-translator-punctuation-boundary-qa.js');
if (!fs.existsSync(runner)) throw new Error(`Missing punctuation QA runner: ${runner}`);

let total = 0;
let passed = 0;
const summaries = [];
for (let partition = 0; partition < partitions; partition += 1) {
    process.stdout.write(`\n=== Punctuation boundary QA partition ${partition + 1}/${partitions} ===\n`);
    const child = spawnSync(process.execPath, [runner, root, '--partitions', String(partitions), '--partition', String(partition)], {
        cwd: root,
        encoding: 'utf8',
        maxBuffer: 16 * 1024 * 1024
    });
    if (child.stdout) process.stdout.write(child.stdout);
    if (child.stderr) process.stderr.write(child.stderr);
    if (child.status !== 0) process.exit(child.status || 2);
    const start = String(child.stdout || '').lastIndexOf('\n{');
    const jsonText = start >= 0 ? child.stdout.slice(start + 1) : child.stdout;
    const summary = JSON.parse(jsonText);
    summaries.push(summary);
    total += summary.selected;
    passed += summary.passed;
}
console.log(`\nPunctuation boundary QA passed: ${passed}/${total} across ${partitions} partitions.`);
