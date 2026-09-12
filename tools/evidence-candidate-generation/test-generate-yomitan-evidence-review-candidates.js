#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    buildOutput,
    computeSnapshotSha256,
    runCli,
    validateOutputPath
} = require('./generate-yomitan-evidence-review-candidates.js');

function fixture() {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translator-yomitan-candidate-test-'));
    const snapshot = path.join(root, 'jmnedict-2026-08-10');
    fs.mkdirSync(snapshot);
    fs.writeFileSync(path.join(snapshot, 'index.json'), JSON.stringify({ title: 'Fixture JMnedict', format: 3, revision: 'fixture' }));
    fs.writeFileSync(path.join(snapshot, 'term_bank_1.json'), JSON.stringify([
        ['織田信長', 'おだのぶなが', 'person', '', 100, ['ignored definition'], 1, 'name'],
        ['織田信長', 'おだのぶなが', 'historical', '', 90, ['ignored duplicate'], 1, 'person'],
        ['ひかり', '', '', '', 10, ['ignored kana'], 2, 'name'],
        ['低頻度', 'ていひんど', '', '', -50, ['ignored low score'], 3, '']
    ]));
    return { root, snapshot };
}

let passed = 0;
function test(name, fn) {
    try { fn(); passed += 1; }
    catch (error) { console.error(`FAIL ${name}: ${error.stack || error}`); process.exitCode = 1; }
}

test('candidate output is deterministic and omits definitions', () => {
    const f = fixture();
    const sha = computeSnapshotSha256(f.snapshot);
    const args = {
        'snapshot-dir': f.snapshot,
        'source-type': 'jmnedict',
        'snapshot-label': '2026-08-10',
        'expected-sha256': sha,
        'min-score': '0',
        'require-han': true
    };
    const first = buildOutput(args);
    const second = buildOutput(args);
    assert.deepStrictEqual(first, second);
    assert.strictEqual(first.candidates.length, 1);
    assert.deepStrictEqual(first.candidates[0].definitionTags, ['historical', 'person']);
    assert.deepStrictEqual(first.candidates[0].termTags, ['name', 'person']);
    assert.ok(!JSON.stringify(first).includes('ignored definition'));
});

test('snapshot mismatch refuses generation', () => {
    const f = fixture();
    assert.throws(() => buildOutput({
        'snapshot-dir': f.snapshot,
        'source-type': 'jmnedict',
        'snapshot-label': '2026-08-10',
        'expected-sha256': '0'.repeat(64)
    }), /Snapshot hash mismatch/);
});

test('project runtime paths are refused', () => {
    assert.throws(() => validateOutputPath(path.join(__dirname, '../../data/generated-review-candidates.json')), /only allowed under/);
});

test('vague output filenames are refused', () => {
    assert.throws(() => validateOutputPath(path.join(os.tmpdir(), 'candidates.json')), /too vague/);
});

test('CLI requires explicit overwrite and preserves deterministic bytes', () => {
    const f = fixture();
    const sha = computeSnapshotSha256(f.snapshot);
    const output = path.join(f.root, 'jmnedict-2026-08-10-review-candidates.json');
    const args = ['--snapshot-dir', f.snapshot, '--source-type', 'jmnedict', '--snapshot-label', '2026-08-10', '--expected-sha256', sha, '--output', output, '--require-han'];
    runCli(args);
    const first = fs.readFileSync(output);
    assert.throws(() => runCli(args), /Use --overwrite/);
    runCli([...args, '--overwrite']);
    assert.deepStrictEqual(fs.readFileSync(output), first);
});

if (!process.exitCode) console.log(`Yomitan evidence review candidate generator tests: ${passed}/${passed} passed.`);
