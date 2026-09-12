const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const MANIFEST_RELATIVE_PATH = 'data/external-evidence-source-provenance.json';

function sha256File(filePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(filePath)).digest('hex');
}

function resolveTrackedPath(root, relativePath) {
    if (typeof relativePath !== 'string' || !relativePath.trim()) {
        throw new Error('Every provenance entry must have a non-empty path.');
    }

    const portablePath = relativePath.replace(/\\/g, '/');
    if (portablePath !== path.posix.normalize(portablePath) || portablePath.startsWith('../') || path.isAbsolute(relativePath)) {
        throw new Error(`Unsafe provenance path: ${relativePath}`);
    }
    if (!portablePath.startsWith('data/') || portablePath === MANIFEST_RELATIVE_PATH) {
        throw new Error(`Provenance path must target a data file other than the manifest itself: ${relativePath}`);
    }

    const dataRoot = path.resolve(root, 'data');
    const target = path.resolve(root, ...portablePath.split('/'));
    if (!target.startsWith(`${dataRoot}${path.sep}`)) {
        throw new Error(`Provenance path escapes the data directory: ${relativePath}`);
    }
    if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
        throw new Error(`Provenance target is missing or is not a file: ${relativePath}`);
    }
    return target;
}

function loadManifest(manifestPath) {
    if (!fs.existsSync(manifestPath) || !fs.statSync(manifestPath).isFile()) {
        throw new Error(`Provenance manifest not found: ${manifestPath}`);
    }

    const raw = fs.readFileSync(manifestPath, 'utf8');
    let manifest;
    try {
        manifest = JSON.parse(raw);
    } catch (error) {
        throw new Error(`Provenance manifest is not valid JSON: ${error.message}`);
    }

    if (!manifest || !Array.isArray(manifest.entries) || !manifest.entries.length) {
        throw new Error('Provenance manifest must contain at least one entry.');
    }
    return { raw, manifest };
}

function collectHashUpdates(root, manifest) {
    const seen = new Set();
    const updates = [];

    for (const entry of manifest.entries) {
        if (!entry || typeof entry !== 'object' || Array.isArray(entry)) {
            throw new Error('Every provenance entry must be an object.');
        }
        const relativePath = entry.path;
        if (seen.has(relativePath)) {
            throw new Error(`Duplicate provenance path: ${relativePath}`);
        }
        seen.add(relativePath);

        const target = resolveTrackedPath(root, relativePath);
        const actualHash = sha256File(target);
        if (entry.sha256 !== actualHash) {
            updates.push({ entry, relativePath, previousHash: entry.sha256, actualHash });
        }
    }
    return updates;
}

function updateManifestHashes(root, manifestPath, options = {}) {
    const write = options.write !== false;
    const { raw, manifest } = loadManifest(manifestPath);
    const updates = collectHashUpdates(root, manifest);

    if (!write || !updates.length) {
        return { changed: updates.length, updates, raw, manifest };
    }

    for (const update of updates) update.entry.sha256 = update.actualHash;
    const output = `${JSON.stringify(manifest, null, 2)}\n`;
    const temporaryPath = `${manifestPath}.pending-hash-update-${process.pid}.tmp`;
    try {
        fs.writeFileSync(temporaryPath, output, 'utf8');
        fs.renameSync(temporaryPath, manifestPath);
    } finally {
        if (fs.existsSync(temporaryPath)) fs.rmSync(temporaryPath, { force: true });
    }

    return { changed: updates.length, updates, raw, manifest };
}

function parseArguments(argv) {
    const allowedFlags = new Set(['--check']);
    const unknownFlags = argv.filter(arg => arg.startsWith('--') && !allowedFlags.has(arg));
    if (unknownFlags.length) throw new Error(`Unknown option: ${unknownFlags[0]}`);

    const rootArgs = argv.filter(arg => !arg.startsWith('--'));
    if (rootArgs.length > 1) throw new Error('Provide at most one project root path.');
    return {
        checkOnly: argv.includes('--check'),
        root: path.resolve(rootArgs[0] || path.join(__dirname, '../..')),
    };
}

function runCli(argv = process.argv.slice(2)) {
    const { checkOnly, root } = parseArguments(argv);
    const manifestPath = path.join(root, ...MANIFEST_RELATIVE_PATH.split('/'));
    const result = updateManifestHashes(root, manifestPath, { write: !checkOnly });

    if (!result.changed) {
        console.log(`External evidence provenance hashes are current (${result.manifest.entries.length} entries).`);
        return 0;
    }

    for (const update of result.updates) {
        const action = checkOnly ? 'Outdated' : 'Updated';
        console.log(`${action}: ${update.relativePath}`);
    }
    if (checkOnly) {
        console.error(`${result.changed} provenance hash${result.changed === 1 ? '' : 'es'} need updating.`);
        return 1;
    }

    console.log(`Updated ${result.changed} provenance hash${result.changed === 1 ? '' : 'es'}. Source, snapshot and licence metadata were not changed.`);
    return 0;
}

if (require.main === module) {
    try {
        process.exitCode = runCli();
    } catch (error) {
        console.error(error.stack || error);
        process.exitCode = 1;
    }
}

module.exports = {
    MANIFEST_RELATIVE_PATH,
    collectHashUpdates,
    loadManifest,
    resolveTrackedPath,
    runCli,
    sha256File,
    updateManifestHashes,
};
