#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const projectRoot = path.resolve(__dirname, '../..');
const allowedProjectOutputRoot = path.join(projectRoot, 'tools', 'evidence-candidate-generation', 'generated-review-candidates');
const vagueOutputNames = new Set(['candidates.json', 'output.json', 'results.json', 'data.json']);

function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--require-han' || arg === '--overwrite') { args[arg.slice(2)] = true; continue; }
        if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
        const value = argv[++i];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
        args[arg.slice(2)] = value;
    }
    return args;
}

function isInside(parent, child) {
    const rel = path.relative(parent, child);
    return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

function validateOutputPath(outputPath) {
    const resolved = path.resolve(outputPath);
    const basename = path.basename(resolved).toLowerCase();
    if (vagueOutputNames.has(basename)) throw new Error(`Output filename is too vague: ${path.basename(resolved)}`);
    if (isInside(projectRoot, resolved) && !isInside(allowedProjectOutputRoot, resolved)) {
        throw new Error('Project-local candidate output is only allowed under tools/evidence-candidate-generation/generated-review-candidates/.');
    }
    return resolved;
}

function listSnapshotFiles(snapshotDir) {
    const root = path.resolve(snapshotDir);
    if (!fs.statSync(root).isDirectory()) throw new Error('Snapshot path must be a directory.');
    const files = [];
    const walk = current => {
        for (const entry of fs.readdirSync(current, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
            if (entry.name === '.DS_Store') continue;
            const full = path.join(current, entry.name);
            if (entry.isDirectory()) walk(full);
            else if (entry.isFile()) files.push(full);
        }
    };
    walk(root);
    return { root, files };
}

function computeSnapshotSha256(snapshotDir) {
    const { root, files } = listSnapshotFiles(snapshotDir);
    if (!files.length) throw new Error('Snapshot directory is empty.');
    const hash = crypto.createHash('sha256');
    for (const file of files) {
        const rel = path.relative(root, file).split(path.sep).join('/');
        const bytes = fs.readFileSync(file);
        hash.update(Buffer.from(rel, 'utf8'));
        hash.update(Buffer.from([0]));
        hash.update(bytes);
        hash.update(Buffer.from([0]));
    }
    return hash.digest('hex');
}

function splitTags(value) {
    return String(value || '').trim().split(/\s+/).filter(Boolean).sort();
}

function containsHan(value) {
    return /[\p{Script=Han}々〆ヵヶ]/u.test(String(value || ''));
}

function readTermBanks(snapshotDir) {
    const root = path.resolve(snapshotDir);
    const indexPath = path.join(root, 'index.json');
    if (!fs.existsSync(indexPath)) throw new Error('Yomitan snapshot is missing index.json.');
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    if (Number(index?.format) !== 3) throw new Error('Yomitan snapshot index.json must declare format 3.');
    const banks = fs.readdirSync(root)
        .filter(name => /^term_bank_\d+\.json$/i.test(name))
        .sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
    if (!banks.length) throw new Error('Yomitan snapshot has no term_bank_*.json files.');
    return banks.map(name => ({ name, rows: JSON.parse(fs.readFileSync(path.join(root, name), 'utf8')) }));
}

function generateCandidates(snapshotDir, options = {}) {
    const minScore = options.minScore == null ? Number.NEGATIVE_INFINITY : Number(options.minScore);
    if (!Number.isFinite(minScore) && minScore !== Number.NEGATIVE_INFINITY) throw new Error('min-score must be numeric.');
    const merged = new Map();
    for (const bank of readTermBanks(snapshotDir)) {
        if (!Array.isArray(bank.rows)) throw new Error(`${bank.name} must contain an array.`);
        bank.rows.forEach((row, rowIndex) => {
            if (!Array.isArray(row) || row.length !== 8) throw new Error(`${bank.name} row ${rowIndex + 1} does not match Yomitan term-bank v3 shape.`);
            const [surfaceRaw, readingRaw, definitionTagsRaw, rulesRaw, scoreRaw, , sequenceRaw, termTagsRaw] = row;
            const surface = String(surfaceRaw || '').trim();
            const reading = String(readingRaw || '').trim() || surface;
            const score = Number(scoreRaw);
            if (!surface || !reading || !Number.isFinite(score) || score < minScore) return;
            if (options.requireHan && !containsHan(surface)) return;
            const key = `${surface}\u0000${reading}`;
            const current = merged.get(key) || {
                surface,
                reading,
                score,
                definitionTags: [],
                rules: [],
                termTags: [],
                sequences: [],
                sourceRows: []
            };
            current.score = Math.max(current.score, score);
            current.definitionTags = [...new Set([...current.definitionTags, ...splitTags(definitionTagsRaw)])].sort();
            current.rules = [...new Set([...current.rules, ...splitTags(rulesRaw)])].sort();
            current.termTags = [...new Set([...current.termTags, ...splitTags(termTagsRaw)])].sort();
            if (Number.isInteger(sequenceRaw)) current.sequences = [...new Set([...current.sequences, sequenceRaw])].sort((a, b) => a - b);
            current.sourceRows.push({ bank: bank.name, row: rowIndex + 1 });
            current.sourceRows.sort((a, b) => a.bank.localeCompare(b.bank, undefined, { numeric: true }) || a.row - b.row);
            merged.set(key, current);
        });
    }
    return [...merged.values()].sort((a, b) => a.surface.localeCompare(b.surface, 'ja') || a.reading.localeCompare(b.reading, 'ja'));
}

function buildOutput(args) {
    const snapshotDir = path.resolve(args['snapshot-dir'] || '');
    const sourceType = String(args['source-type'] || '').trim();
    const snapshotLabel = String(args['snapshot-label'] || '').trim();
    const expectedSha256 = String(args['expected-sha256'] || '').trim().toLowerCase();
    if (!['jmnedict', 'jitendex', 'yomitan-term-bank'].includes(sourceType)) throw new Error('source-type must be jmnedict, jitendex, or yomitan-term-bank.');
    if (!snapshotLabel) throw new Error('snapshot-label is required.');
    if (!/^[0-9a-f]{64}$/.test(expectedSha256)) throw new Error('expected-sha256 must be a 64-character lowercase SHA-256 value.');
    const actualSha256 = computeSnapshotSha256(snapshotDir);
    if (actualSha256 !== expectedSha256) throw new Error(`Snapshot hash mismatch: expected ${expectedSha256}, got ${actualSha256}.`);
    const candidates = generateCandidates(snapshotDir, {
        minScore: args['min-score'] == null ? Number.NEGATIVE_INFINITY : Number(args['min-score']),
        requireHan: Boolean(args['require-han'])
    });
    return {
        _meta: {
            schemaVersion: 1,
            purpose: 'Review candidates only. This file is not a runtime dictionary and must not be promoted without human review and normal release QA.',
            generator: 'generate-yomitan-evidence-review-candidates.js',
            sourceType,
            snapshotLabel,
            snapshotSha256: actualSha256,
            filters: {
                minScore: args['min-score'] == null ? null : Number(args['min-score']),
                requireHan: Boolean(args['require-han'])
            },
            candidateCount: candidates.length
        },
        candidates
    };
}

function runCli(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    if (!args['snapshot-dir'] || !args.output) throw new Error('snapshot-dir and output are required.');
    const outputPath = validateOutputPath(args.output);
    if (fs.existsSync(outputPath) && !args.overwrite) throw new Error('Output already exists. Use --overwrite to replace a generated candidate file.');
    const output = buildOutput(args);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    console.log(JSON.stringify({ ok: true, output: outputPath, candidates: output.candidates.length, snapshotSha256: output._meta.snapshotSha256 }, null, 2));
}

if (require.main === module) {
    try { runCli(); } catch (error) { console.error(error.message || error); process.exit(2); }
}

module.exports = { buildOutput, computeSnapshotSha256, generateCandidates, runCli, validateOutputPath };
