#!/usr/bin/env node
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const updater = require('./cj2r-edrdg-updater.js');

let passed = 0;
function test(name, fn) {
    Promise.resolve().then(fn).then(() => {
        passed += 1;
        console.log(`ok ${passed} - ${name}`);
    }).catch(error => {
        console.error(`not ok - ${name}`);
        console.error(error.stack || error);
        process.exitCode = 1;
    });
}

function u16(n) { const b = Buffer.alloc(2); b.writeUInt16LE(n >>> 0); return b; }
function u32(n) { const b = Buffer.alloc(4); b.writeUInt32LE(n >>> 0); return b; }

function makeStoredZip(entries) {
    const locals = [];
    const centrals = [];
    let offset = 0;
    for (const [name, content] of entries) {
        const nameBytes = Buffer.from(name, 'utf8');
        const data = Buffer.isBuffer(content) ? content : Buffer.from(content, 'utf8');
        const crc = updater.crc32(data);
        const local = Buffer.concat([
            u32(0x04034b50), u16(20), u16(0), u16(0), u16(0), u16(0),
            u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0),
            nameBytes, data
        ]);
        locals.push(local);
        const central = Buffer.concat([
            u32(0x02014b50), u16(20), u16(20), u16(0), u16(0), u16(0), u16(0),
            u32(crc), u32(data.length), u32(data.length), u16(nameBytes.length), u16(0), u16(0),
            u16(0), u16(0), u32(0), u32(offset), nameBytes
        ]);
        centrals.push(central);
        offset += local.length;
    }
    const centralBytes = Buffer.concat(centrals);
    const eocd = Buffer.concat([
        u32(0x06054b50), u16(0), u16(0), u16(entries.length), u16(entries.length),
        u32(centralBytes.length), u32(offset), u16(0)
    ]);
    return Buffer.concat([...locals, centralBytes, eocd]);
}

function json(value) { return `${JSON.stringify(value)}\n`; }

function currentPairs(root) {
    const out = new Map();
    const add = (surface, reading, score = 0) => {
        const key = `${surface}\u0000${reading}`;
        const old = out.get(key);
        if (!old || score > old.score) out.set(key, { surface, reading, score });
    };
    const generalRaw = JSON.parse(fs.readFileSync(path.join(root, 'data/general-words/general-words-term-bank-1.json'), 'utf8'));
    const generalRows = Array.isArray(generalRaw) ? generalRaw : generalRaw.entries;
    for (const row of generalRows) {
        for (const reading of row[1] || []) add(row[0], reading[0], reading[1]);
    }
    for (const row of JSON.parse(fs.readFileSync(path.join(root, 'data/ateji/ateji-term-bank-1.json'), 'utf8'))) add(row[0], row[1], row[2]);
    for (const item of JSON.parse(fs.readFileSync(path.join(root, 'data/reading-evidence/reading-evidence.json'), 'utf8'))) {
        add(item.surface, item.preferredReading, item.preferredPriority);
        for (const alt of item.alternatives || []) add(item.surface, alt[0], alt[1]);
    }
    return [...out.values()];
}

function yomitanTermRows(pairs) {
    return pairs.map((item, i) => [item.surface, item.reading, '', '', item.score, [], i + 1, '']);
}

function writeFixtureZips(root, dir) {
    const pairs = currentPairs(root);
    const commonIndex = { title: 'Jitendex', format: 3, revision: '2026.08.11.0' };
    fs.writeFileSync(path.join(dir, 'jitendex.zip'), makeStoredZip([
        ['index.json', json(commonIndex)],
        ['term_bank_1.json', json(yomitanTermRows(pairs))]
    ]));
    fs.writeFileSync(path.join(dir, 'jmdict.zip'), makeStoredZip([
        ['index.json', json({ title: 'JMdict', format: 3, revision: '2026.08.11.0' })],
        ['term_bank_1.json', json(yomitanTermRows(pairs))]
    ]));
    const names = JSON.parse(fs.readFileSync(path.join(root, 'data/nouns/jmnedict-bank-1.json'), 'utf8'));
    fs.writeFileSync(path.join(dir, 'jmnedict.zip'), makeStoredZip([
        ['index.json', json({ title: 'JMnedict', format: 3, revision: 'JMnedict.2026-08-10' })],
        ['term_bank_1.json', json(names.map((row, i) => [row[0], row[1], '', '', 0, [], i + 1, '']))]
    ]));
    const meta = JSON.parse(fs.readFileSync(path.join(root, 'data/kanji/kanjidic-source-metadata.json'), 'utf8'));
    const kanjiEntries = [['index.json', json(meta)]];
    for (const name of fs.readdirSync(path.join(root, 'data/kanji')).sort()) {
        let target;
        if (/^kanji-bank-\d+\.json$/.test(name)) target = name.replace(/-/g, '_');
        else if (/^kanji-tag-bank-\d+\.json$/.test(name)) target = name.replace(/^kanji-tag-bank-/, 'tag_bank_');
        if (target) kanjiEntries.push([target, fs.readFileSync(path.join(root, 'data/kanji', name))]);
    }
    fs.writeFileSync(path.join(dir, 'kanjidic.zip'), makeStoredZip(kanjiEntries));
}

const root = path.resolve(__dirname, '../..');

test('rejects path traversal in ZIP names', () => {
    assert.throws(() => updater.safeRel('../escape.json'), /Unsafe ZIP path/);
    assert.throws(() => updater.safeRel('C:\\escape.json'), /Unsafe ZIP path/);
});

test('extracts stored ZIP entries and verifies CRC', () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-zip-test-'));
    try {
        const zipPath = path.join(temp, 'sample.zip');
        fs.writeFileSync(zipPath, makeStoredZip([['index.json', '{"format":3}'], ['term_bank_1.json', '[]']]));
        const out = path.join(temp, 'out');
        const files = updater.extractZip(zipPath, out);
        assert.deepStrictEqual(files, ['index.json', 'term_bank_1.json']);
        assert.strictEqual(fs.readFileSync(path.join(out, 'index.json'), 'utf8'), '{"format":3}');
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('normalises snapshot identity from revision and KANJIDIC title', () => {
    assert.deepStrictEqual(updater.snapshotIdentity({ title: 'Jitendex', revision: '2026.08.11.0' }, 'x'), { title: 'Jitendex', snapshot: '2026-08-11', revision: '2026.08.11.0' });
    assert.deepStrictEqual(updater.snapshotIdentity({ title: 'KANJIDIC [2026-222]', revision: 'kanjidic2.2026-222' }, 'x'), { title: 'KANJIDIC [2026-222]', snapshot: '2026-222', revision: 'kanjidic2.2026-222' });
});

test('general-word evidence index keeps popularity separate from surface applicability', () => {
    const map = new Map([
        ['語\u0000ご', { surface: '語', reading: 'ご', score: 200, sequences: [1] }],
        ['語\u0000ぎょ', { surface: '語', reading: 'ぎょ', score: 20, sequences: [1] }],
        ['言語\u0000ご', { surface: '言語', reading: 'ご', score: 150, sequences: [1] }]
    ]);
    const index = updater.buildTermEvidenceIndex(map);
    assert.strictEqual(index.bySurface.get('語').length, 2);
    assert.strictEqual(updater.readingHasSpellingSpecificApplicability(index.bySurface.get('語').find(item => item.reading === 'ぎょ'), index), true);
    assert.strictEqual(updater.readingHasSpellingSpecificApplicability(index.bySurface.get('語').find(item => item.reading === 'ご'), index), false);
});

test('prepare accepts current evidence when latest snapshots still support it', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-edrdg-test-'));
    try {
        writeFixtureZips(root, temp);
        const stage = path.join(temp, 'stage');
        const result = await updater.prepare({
            projectRoot: root,
            stagingDir: stage,
            offline: {
                jitendex: path.join(temp, 'jitendex.zip'),
                jmdict: path.join(temp, 'jmdict.zip'),
                jmnedict: path.join(temp, 'jmnedict.zip'),
                kanjidic: path.join(temp, 'kanjidic.zip')
            }
        });
        assert.strictEqual(result.report.blockers.length, 0);
        assert.strictEqual(result.report.updatedCounts.jmnedictEntriesRevalidated, 957);
        const candidateGeneral = updater.readGeneralWordBank(path.join(result.candidateProject, 'data/general-words/general-words-term-bank-1.json'));
        assert.strictEqual(candidateGeneral._meta.scoreSemantics, 'popularity-ranking-only');
        assert.ok(candidateGeneral.entries.every(row => ['complete-source-surface', 'filtered-source-surface'].includes(row[3]?.readingCoverage)));
        assert.ok(candidateGeneral.entries.every(row => row[3]?.restrictionStatus === 'surface-pair-evidence'));
        assert.ok(candidateGeneral.entries.every(row => row[3]?.sourceReadingCount === row[3]?.readingEvidence?.length));
        assert.ok(candidateGeneral.entries.every(row => row[3]?.readingEvidence?.every(item => typeof item.retained === 'boolean' && Number.isFinite(item.popularityScore))));
        assert.strictEqual(
            result.report.updatedCounts.generalWordCompleteSurfaceCoverage + result.report.updatedCounts.generalWordFilteredSurfaceCoverage,
            candidateGeneral.entries.length
        );
        assert.match(result.manifestSha256, /^[0-9a-f]{64}$/);
        assert.ok(fs.existsSync(result.manifestPath));
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('prepare stops when a maintained Jitendex-derived reading disappears', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-edrdg-blocker-'));
    try {
        writeFixtureZips(root, temp);
        const broken = makeStoredZip([
            ['index.json', json({ title: 'JMdict', format: 3, revision: '2026.08.11.0' })],
            ['term_bank_1.json', '[]\n']
        ]);
        fs.writeFileSync(path.join(temp, 'jitendex.zip'), broken);
        const result = await updater.prepare({
            projectRoot: root,
            stagingDir: path.join(temp, 'stage'),
            offline: {
                jitendex: path.join(temp, 'jitendex.zip'),
                jmdict: path.join(temp, 'jmdict.zip'),
                jmnedict: path.join(temp, 'jmnedict.zip'),
                kanjidic: path.join(temp, 'kanjidic.zip')
            }
        });
        assert.ok(result.report.blockers.length > 100);
        assert.ok(result.report.blockers.some(item => item.missingFrom?.includes('Jitendex')));
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

test('apply rejects a manifest whose hash was not explicitly approved', async () => {
    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-edrdg-apply-'));
    try {
        fs.writeFileSync(path.join(temp, 'edrdg-update-manifest.json'), '{}\n');
        fs.writeFileSync(path.join(temp, 'edrdg-update-review-report.json'), '{"blockers":[]}\n');
        assert.throws(() => updater.applyPrepared(temp, '0'.repeat(64), { projectRoot: root, skipReleaseQa: true }), /Manifest hash mismatch/);
    } finally { fs.rmSync(temp, { recursive: true, force: true }); }
});

process.on('beforeExit', () => {
    if (!process.exitCode) console.log(JSON.stringify({ ok: true, passed }, null, 2));
});
