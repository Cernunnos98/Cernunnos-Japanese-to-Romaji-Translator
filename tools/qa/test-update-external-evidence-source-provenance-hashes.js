const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const {
    MANIFEST_RELATIVE_PATH,
    updateManifestHashes,
} = require('./update-external-evidence-source-provenance-hashes.js');

function sha256(data) {
    return crypto.createHash('sha256').update(data).digest('hex');
}

function makeFixture(entries) {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), 'translator-provenance-hash-test-'));
    const manifestPath = path.join(root, ...MANIFEST_RELATIVE_PATH.split('/'));
    fs.mkdirSync(path.dirname(manifestPath), { recursive: true });
    const manifest = {
        _meta: { version: 1, purpose: 'Updater test fixture.' },
        entries,
    };
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    return { root, manifestPath, manifest };
}

function stripHashes(value) {
    const copy = JSON.parse(JSON.stringify(value));
    for (const entry of copy.entries || []) delete entry.sha256;
    return copy;
}

let passed = 0;
function test(name, fn) {
    fn();
    passed += 1;
    console.log(`PASS: ${name}`);
}

const roots = [];
try {
    test('updates only tracked sha256 fields', () => {
        const fixture = makeFixture([
            {
                path: 'data/example/evidence-one.json',
                sha256: '0'.repeat(64),
                sources: [{ name: 'Example source', snapshot: '2026-09-05' }],
                licenceRefs: ['licenses and sources/Example.md'],
                note: 'Keep this metadata unchanged.',
            },
            {
                path: 'data/example/evidence-two.json',
                sha256: '1'.repeat(64),
                sources: [{ name: 'Second source', version: '1.0' }],
                licenceRefs: ['licenses and sources/Second.md'],
            },
        ]);
        roots.push(fixture.root);
        const one = Buffer.from('{"one":1}\n');
        const two = Buffer.from('{"two":2}\n');
        const onePath = path.join(fixture.root, 'data', 'example', 'evidence-one.json');
        const twoPath = path.join(fixture.root, 'data', 'example', 'evidence-two.json');
        fs.mkdirSync(path.dirname(onePath), { recursive: true });
        fs.writeFileSync(onePath, one);
        fs.writeFileSync(twoPath, two);

        const before = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'));
        const result = updateManifestHashes(fixture.root, fixture.manifestPath);
        const after = JSON.parse(fs.readFileSync(fixture.manifestPath, 'utf8'));

        assert.strictEqual(result.changed, 2);
        assert.strictEqual(after.entries[0].sha256, sha256(one));
        assert.strictEqual(after.entries[1].sha256, sha256(two));
        assert.deepStrictEqual(stripHashes(after), stripHashes(before));
    });

    test('check mode reports changes without writing', () => {
        const fixture = makeFixture([{
            path: 'data/example/check-only.json',
            sha256: '0'.repeat(64),
            sources: [{ name: 'Example source' }],
            licenceRefs: ['licenses and sources/Example.md'],
        }]);
        roots.push(fixture.root);
        const target = path.join(fixture.root, 'data', 'example', 'check-only.json');
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, 'changed\n');
        const before = fs.readFileSync(fixture.manifestPath);

        const result = updateManifestHashes(fixture.root, fixture.manifestPath, { write: false });
        assert.strictEqual(result.changed, 1);
        assert.deepStrictEqual(fs.readFileSync(fixture.manifestPath), before);
    });

    test('missing target fails without changing the manifest', () => {
        const fixture = makeFixture([{
            path: 'data/example/missing.json',
            sha256: '0'.repeat(64),
            sources: [{ name: 'Example source' }],
            licenceRefs: ['licenses and sources/Example.md'],
        }]);
        roots.push(fixture.root);
        const before = fs.readFileSync(fixture.manifestPath);

        assert.throws(() => updateManifestHashes(fixture.root, fixture.manifestPath), /missing or is not a file/);
        assert.deepStrictEqual(fs.readFileSync(fixture.manifestPath), before);
    });

    test('unsafe target fails without changing the manifest', () => {
        const fixture = makeFixture([{
            path: '../outside.json',
            sha256: '0'.repeat(64),
            sources: [{ name: 'Example source' }],
            licenceRefs: ['licenses and sources/Example.md'],
        }]);
        roots.push(fixture.root);
        const before = fs.readFileSync(fixture.manifestPath);

        assert.throws(() => updateManifestHashes(fixture.root, fixture.manifestPath), /Unsafe provenance path/);
        assert.deepStrictEqual(fs.readFileSync(fixture.manifestPath), before);
    });

    test('a second update is deterministic and makes no rewrite', () => {
        const fixture = makeFixture([{
            path: 'data/example/stable.json',
            sha256: '0'.repeat(64),
            sources: [{ name: 'Example source' }],
            licenceRefs: ['licenses and sources/Example.md'],
        }]);
        roots.push(fixture.root);
        const target = path.join(fixture.root, 'data', 'example', 'stable.json');
        fs.mkdirSync(path.dirname(target), { recursive: true });
        fs.writeFileSync(target, 'stable\n');

        updateManifestHashes(fixture.root, fixture.manifestPath);
        const beforeSecondRun = fs.readFileSync(fixture.manifestPath);
        const second = updateManifestHashes(fixture.root, fixture.manifestPath);
        assert.strictEqual(second.changed, 0);
        assert.deepStrictEqual(fs.readFileSync(fixture.manifestPath), beforeSecondRun);
    });

    console.log(`External evidence provenance hash updater tests: ${passed}/${passed} passed.`);
} finally {
    for (const root of roots) fs.rmSync(root, { recursive: true, force: true });
}
