#!/usr/bin/env node
const crypto = require('crypto');
const fs = require('fs');
const http = require('http');
const https = require('https');
const os = require('os');
const path = require('path');
const zlib = require('zlib');
const { spawnSync } = require('child_process');

const projectRoot = path.resolve(__dirname, '../..');
const candidateTool = require('../evidence-candidate-generation/generate-yomitan-evidence-review-candidates.js');

const sourceRegistry = JSON.parse(fs.readFileSync(path.join(__dirname, 'cj2r-edrdg-updater-sources.json'), 'utf8'));
const SOURCES = sourceRegistry.sources;

function parseArgs(argv) {
    const out = { offline: {} };
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg === '--apply') { out.apply = true; continue; }
        if (arg === '--offline') {
            const value = argv[++i];
            if (!value || !value.includes('=')) throw new Error('--offline expects source=/path/to/archive.zip.');
            const [name, ...rest] = value.split('=');
            if (!SOURCES[name]) throw new Error(`Unknown offline source: ${name}`);
            out.offline[name] = rest.join('=');
            continue;
        }
        if (!arg.startsWith('--')) throw new Error(`Unexpected argument: ${arg}`);
        const value = argv[++i];
        if (!value || value.startsWith('--')) throw new Error(`Missing value for ${arg}`);
        out[arg.slice(2)] = value;
    }
    return out;
}

function sha256Bytes(bytes) {
    return crypto.createHash('sha256').update(bytes).digest('hex');
}

function sha256File(filePath) {
    return sha256Bytes(fs.readFileSync(filePath));
}

function safeRel(name) {
    const normal = String(name).replace(/\\/g, '/');
    if (!normal || normal.includes('\0') || normal.startsWith('/') || /^[A-Za-z]:/.test(normal)) throw new Error(`Unsafe ZIP path: ${name}`);
    const parts = normal.split('/').filter(Boolean);
    if (parts.some(part => part === '..' || part === '.')) throw new Error(`Unsafe ZIP path: ${name}`);
    return parts.join('/');
}

let crcTable;
function crc32(buffer) {
    if (!crcTable) {
        crcTable = Array.from({ length: 256 }, (_, n) => {
            let c = n;
            for (let k = 0; k < 8; k += 1) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
            return c >>> 0;
        });
    }
    let crc = 0xffffffff;
    for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
    return (crc ^ 0xffffffff) >>> 0;
}

function extractZip(zipPath, outputDir) {
    const bytes = fs.readFileSync(zipPath);
    const min = Math.max(0, bytes.length - 65557);
    let eocd = -1;
    for (let i = bytes.length - 22; i >= min; i -= 1) {
        if (bytes.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
    }
    if (eocd < 0) throw new Error(`ZIP central directory was not found: ${zipPath}`);
    const count = bytes.readUInt16LE(eocd + 10);
    const centralOffset = bytes.readUInt32LE(eocd + 16);
    let cursor = centralOffset;
    const written = [];
    fs.mkdirSync(outputDir, { recursive: true });
    for (let n = 0; n < count; n += 1) {
        if (bytes.readUInt32LE(cursor) !== 0x02014b50) throw new Error('Invalid ZIP central directory entry.');
        const method = bytes.readUInt16LE(cursor + 10);
        const expectedCrc = bytes.readUInt32LE(cursor + 16);
        const compressedSize = bytes.readUInt32LE(cursor + 20);
        const uncompressedSize = bytes.readUInt32LE(cursor + 24);
        const nameLen = bytes.readUInt16LE(cursor + 28);
        const extraLen = bytes.readUInt16LE(cursor + 30);
        const commentLen = bytes.readUInt16LE(cursor + 32);
        const localOffset = bytes.readUInt32LE(cursor + 42);
        const rawName = bytes.subarray(cursor + 46, cursor + 46 + nameLen).toString('utf8');
        const rel = safeRel(rawName);
        cursor += 46 + nameLen + extraLen + commentLen;
        if (!rel || rawName.endsWith('/')) continue;
        if (bytes.readUInt32LE(localOffset) !== 0x04034b50) throw new Error(`Invalid local ZIP entry for ${rawName}.`);
        const localNameLen = bytes.readUInt16LE(localOffset + 26);
        const localExtraLen = bytes.readUInt16LE(localOffset + 28);
        const dataStart = localOffset + 30 + localNameLen + localExtraLen;
        const compressed = bytes.subarray(dataStart, dataStart + compressedSize);
        let data;
        if (method === 0) data = Buffer.from(compressed);
        else if (method === 8) data = zlib.inflateRawSync(compressed);
        else throw new Error(`Unsupported ZIP compression method ${method} for ${rawName}.`);
        if (data.length !== uncompressedSize) throw new Error(`ZIP size mismatch for ${rawName}.`);
        if (crc32(data) !== expectedCrc) throw new Error(`ZIP CRC mismatch for ${rawName}.`);
        const dest = path.join(outputDir, rel);
        const realRoot = path.resolve(outputDir) + path.sep;
        const realDest = path.resolve(dest);
        if (!realDest.startsWith(realRoot)) throw new Error(`ZIP path escaped staging directory: ${rawName}`);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, data);
        written.push(rel);
    }
    return written.sort();
}

function request(url, redirects = 0) {
    if (redirects > 8) return Promise.reject(new Error(`Too many redirects for ${url}`));
    return new Promise((resolve, reject) => {
        const client = url.startsWith('https:') ? https : http;
        const req = client.get(url, { headers: { 'User-Agent': 'CJ2R-EDRDG-Updater/1.0' } }, res => {
            if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
                const next = new URL(res.headers.location, url).toString();
                res.resume();
                request(next, redirects + 1).then(resolve, reject);
                return;
            }
            if (res.statusCode !== 200) {
                res.resume();
                reject(new Error(`Download failed with HTTP ${res.statusCode}: ${url}`));
                return;
            }
            const chunks = [];
            let size = 0;
            res.on('data', chunk => {
                size += chunk.length;
                if (size > 250 * 1024 * 1024) req.destroy(new Error(`Download exceeded 250 MiB: ${url}`));
                else chunks.push(chunk);
            });
            res.on('end', () => resolve({ bytes: Buffer.concat(chunks), finalUrl: url, headers: res.headers }));
        });
        req.setTimeout(60000, () => req.destroy(new Error(`Download timed out: ${url}`)));
        req.on('error', reject);
    });
}

async function obtainArchive(name, source, stagingDir, offlinePath) {
    const downloadDir = path.join(stagingDir, 'downloads');
    fs.mkdirSync(downloadDir, { recursive: true });
    const target = path.join(downloadDir, `${name}.zip`);
    let finalUrl = null;
    if (offlinePath) {
        fs.copyFileSync(path.resolve(offlinePath), target);
    } else {
        const result = await request(source.url);
        fs.writeFileSync(target, result.bytes);
        finalUrl = result.finalUrl;
    }
    return { archivePath: target, archiveSha256: sha256File(target), sourceUrl: source.url, finalUrl };
}

function readIndex(snapshotDir) {
    const indexPath = path.join(snapshotDir, 'index.json');
    if (!fs.existsSync(indexPath)) throw new Error(`Snapshot is missing index.json: ${snapshotDir}`);
    const index = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    if (Number(index.format) !== 3) throw new Error(`Snapshot must use Yomitan format 3: ${snapshotDir}`);
    return index;
}

function snapshotIdentity(index, fallback) {
    const revision = String(index.revision || '').trim() || null;
    const title = String(index.title || '').trim() || fallback;
    let snapshot = null;
    const date = revision && revision.match(/(20\d{2})[.-](\d{2})[.-](\d{2})/);
    if (date) snapshot = `${date[1]}-${date[2]}-${date[3]}`;
    if (!snapshot) {
        const day = title.match(/\[(20\d{2})-(\d{3})\]/);
        if (day) snapshot = `${day[1]}-${day[2]}`;
    }
    return { title, snapshot: snapshot || revision || title, revision };
}

function termPairMap(snapshotDir) {
    const candidates = candidateTool.generateCandidates(snapshotDir);
    const map = new Map();
    for (const item of candidates) {
        const key = `${item.surface}\u0000${item.reading}`;
        const existing = map.get(key);
        if (!existing || item.score > existing.score) map.set(key, item);
    }
    return map;
}

function buildTermEvidenceIndex(map) {
    const bySurface = new Map();
    const bySequence = new Map();
    for (const item of map.values()) {
        if (!bySurface.has(item.surface)) bySurface.set(item.surface, []);
        bySurface.get(item.surface).push(item);
        for (const sequence of item.sequences || []) {
            if (!bySequence.has(sequence)) bySequence.set(sequence, new Map());
            const surfaces = bySequence.get(sequence);
            if (!surfaces.has(item.surface)) surfaces.set(item.surface, new Set());
            surfaces.get(item.surface).add(item.reading);
        }
    }
    for (const items of bySurface.values()) items.sort((a, b) => b.score - a.score || a.reading.localeCompare(b.reading, 'ja'));
    return { bySurface, bySequence };
}

function readingHasSpellingSpecificApplicability(item, evidenceIndex) {
    for (const sequence of item.sequences || []) {
        const surfaces = evidenceIndex.bySequence.get(sequence);
        if (!surfaces || surfaces.size < 2) continue;
        for (const [surface, readings] of surfaces) {
            if (surface !== item.surface && !readings.has(item.reading)) return true;
        }
    }
    return false;
}

function readGeneralWordBank(file) {
    const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
    if (Array.isArray(raw)) return { _meta: { schemaVersion: 1 }, entries: raw };
    if (!raw || typeof raw !== 'object' || !Array.isArray(raw.entries)) throw new Error('General-word bank has an unsupported shape.');
    return raw;
}

function latestScore(map, surface, reading) {
    return map.get(`${surface}\u0000${reading}`)?.score ?? null;
}

function updateGeneralBank(project, jitendexMap, jmdictMap, report) {
    const file = path.join(project, 'data/general-words/general-words-term-bank-1.json');
    const bank = readGeneralWordBank(file);
    const rows = bank.entries;
    const jitendexEvidence = buildTermEvidenceIndex(jitendexMap);
    const jmdictEvidence = buildTermEvidenceIndex(jmdictMap);
    let scoreChanges = 0;
    let completeSurfaces = 0;
    let filteredSurfaces = 0;
    let spellingSpecificReadings = 0;
    for (const row of rows) {
        const surface = row[0];
        const retainedReadings = new Set();
        for (const readingRow of row[1] || []) {
            const reading = readingRow[0];
            retainedReadings.add(reading);
            const jScore = latestScore(jitendexMap, surface, reading);
            const mScore = latestScore(jmdictMap, surface, reading);
            if (jScore == null) {
                report.blockers.push({ bank: 'general-words', surface, reading, missingFrom: ['Jitendex'] });
                continue;
            }
            if (mScore == null) report.jmdictCrossCheckMissing.push({ bank: 'general-words', surface, reading });
            if (readingRow[1] !== jScore) { report.scoreChanges.push({ bank: 'general-words', surface, reading, from: readingRow[1], to: jScore, semantics: 'popularity-ranking-only' }); readingRow[1] = jScore; scoreChanges += 1; }
        }
        const sourceCandidates = jitendexEvidence.bySurface.get(surface) || [];
        if (!sourceCandidates.length) continue;
        const readingEvidence = sourceCandidates.map(item => {
            const spellingSpecificApplicability = readingHasSpellingSpecificApplicability(item, jitendexEvidence);
            if (spellingSpecificApplicability) spellingSpecificReadings += 1;
            return {
                reading: item.reading,
                retained: retainedReadings.has(item.reading),
                popularityScore: item.score,
                sequences: item.sequences || [],
                spellingSpecificApplicability
            };
        });
        const unretainedCount = readingEvidence.filter(item => !item.retained).length;
        const readingCoverage = unretainedCount ? 'filtered-source-surface' : 'complete-source-surface';
        if (unretainedCount) filteredSurfaces += 1; else completeSurfaces += 1;
        row[3] = {
            readingCoverage,
            sourceReadingCount: readingEvidence.length,
            restrictionStatus: 'surface-pair-evidence',
            readingEvidence
        };
        // Cross-check complete source pairs against JMdict without treating a
        // missing cross-check as proof that the Jitendex pair is invalid.
        for (const item of sourceCandidates) {
            if (!jmdictEvidence.bySurface.get(surface)?.some(candidate => candidate.reading === item.reading)) {
                report.jmdictCrossCheckMissing.push({ bank: 'general-words-source-coverage', surface, reading: item.reading });
            }
        }
    }
    bank._meta = {
        ...(bank._meta || {}),
        schemaVersion: 2,
        scoreSemantics: 'popularity-ranking-only',
        defaultReadingCoverage: 'unknown',
        defaultRestrictionStatus: 'unknown',
        defaultApplicability: 'retained-surface-reading-pair',
        mergeSafeSemantics: 'span-boundary eligibility only; not evidence that one reading is uniquely correct'
    };
    report.updatedCounts.generalWordScores = scoreChanges;
    report.updatedCounts.generalWordCompleteSurfaceCoverage = completeSurfaces;
    report.updatedCounts.generalWordFilteredSurfaceCoverage = filteredSurfaces;
    report.updatedCounts.generalWordSpellingSpecificReadings = spellingSpecificReadings;
    fs.writeFileSync(file, `${JSON.stringify(bank)}\n`);
}

function updateAtejiBank(project, jitendexMap, jmdictMap, report) {
    const file = path.join(project, 'data/ateji/ateji-term-bank-1.json');
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changes = 0;
    for (const row of rows) {
        const [surface, reading] = row;
        const jScore = latestScore(jitendexMap, surface, reading);
        const mScore = latestScore(jmdictMap, surface, reading);
        if (jScore == null) {
            report.blockers.push({ bank: 'ateji', surface, reading, missingFrom: ['Jitendex'] });
            continue;
        }
        if (mScore == null) report.jmdictCrossCheckMissing.push({ bank: 'ateji', surface, reading });
        if (row[2] !== jScore) { report.scoreChanges.push({ bank: 'ateji', surface, reading, from: row[2], to: jScore }); row[2] = jScore; changes += 1; }
    }
    report.updatedCounts.atejiScores = changes;
    fs.writeFileSync(file, `${JSON.stringify(rows)}\n`);
}

function updateReadingEvidence(project, jitendexMap, jmdictMap, report) {
    const file = path.join(project, 'data/reading-evidence/reading-evidence.json');
    const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
    let changes = 0;
    for (const item of rows) {
        const pairs = [[item.preferredReading, 'preferredPriority']];
        for (let i = 0; i < (item.alternatives || []).length; i += 1) pairs.push([item.alternatives[i][0], i]);
        for (const [reading, target] of pairs) {
            const jScore = latestScore(jitendexMap, item.surface, reading);
            const mScore = latestScore(jmdictMap, item.surface, reading);
            if (jScore == null) {
                report.blockers.push({ bank: 'reading-evidence', surface: item.surface, reading, missingFrom: ['Jitendex'] });
                continue;
            }
            if (mScore == null) report.jmdictCrossCheckMissing.push({ bank: 'reading-evidence', surface: item.surface, reading });
            if (target === 'preferredPriority') {
                if (item.preferredPriority !== jScore) { report.scoreChanges.push({ bank: 'reading-evidence', surface: item.surface, reading, from: item.preferredPriority, to: jScore }); item.preferredPriority = jScore; changes += 1; }
            } else if (item.alternatives[target][1] !== jScore) {
                report.scoreChanges.push({ bank: 'reading-evidence', surface: item.surface, reading, from: item.alternatives[target][1], to: jScore });
                item.alternatives[target][1] = jScore;
                changes += 1;
            }
        }
    }
    report.updatedCounts.readingEvidenceScores = changes;
    fs.writeFileSync(file, `${JSON.stringify(rows, null, 2)}\n`);
}

function validateJmnedict(project, jmnedictMap, report) {
    const rows = JSON.parse(fs.readFileSync(path.join(project, 'data/nouns/jmnedict-bank-1.json'), 'utf8'));
    let supported = 0;
    for (const row of rows) {
        if (jmnedictMap.has(`${row[0]}\u0000${row[1]}`)) supported += 1;
        else report.blockers.push({ bank: 'jmnedict', surface: row[0], reading: row[1], missingFrom: ['JMnedict'] });
    }
    report.updatedCounts.jmnedictEntriesRevalidated = supported;
}

function numberedFiles(dir, re) {
    return fs.readdirSync(dir).filter(name => re.test(name)).sort((a, b) => a.localeCompare(b, undefined, { numeric: true }));
}

function refreshKanjidic(project, snapshotDir, index, report) {
    const bankFiles = numberedFiles(snapshotDir, /^kanji_bank_\d+\.json$/i);
    const tagFiles = numberedFiles(snapshotDir, /^(?:kanji_)?tag_bank_\d+\.json$/i);
    if (!bankFiles.length) throw new Error('KANJIDIC snapshot has no kanji_bank_*.json files.');
    if (!tagFiles.length) throw new Error('KANJIDIC snapshot has no tag bank file.');
    const targetDir = path.join(project, 'data/kanji');
    const oldBanks = numberedFiles(targetDir, /^kanji-bank-\d+\.json$/i);
    const oldTags = numberedFiles(targetDir, /^kanji-tag-bank-\d+\.json$/i);
    for (const old of [...oldBanks, ...oldTags]) fs.unlinkSync(path.join(targetDir, old));
    bankFiles.forEach((name, i) => fs.copyFileSync(path.join(snapshotDir, name), path.join(targetDir, `kanji-bank-${i + 1}.json`)));
    tagFiles.forEach((name, i) => fs.copyFileSync(path.join(snapshotDir, name), path.join(targetDir, `kanji-tag-bank-${i + 1}.json`)));
    const oldMetaPath = path.join(targetDir, 'kanjidic-source-metadata.json');
    const oldMeta = fs.existsSync(oldMetaPath) ? JSON.parse(fs.readFileSync(oldMetaPath, 'utf8')) : {};
    const meta = { ...index };
    for (const key of ['isUpdatable', 'indexUrl', 'downloadUrl']) if (meta[key] == null && oldMeta[key] != null) meta[key] = oldMeta[key];
    fs.writeFileSync(oldMetaPath, `${JSON.stringify(meta)}\n`);
    report.updatedCounts.kanjidicBankFiles = bankFiles.length;
    report.updatedCounts.kanjidicTagFiles = tagFiles.length;
}

function replaceSnapshotText(text, section, identity) {
    const sectionRe = new RegExp(`(## ${section}[\\s\\S]*?Snapshot used:\\s*)([^\\n]+)`, 'm');
    if (!sectionRe.test(text)) throw new Error(`Could not find ${section} snapshot line in attribution file.`);
    const value = identity.revision && identity.revision !== identity.snapshot ? `${identity.snapshot}, revision ${identity.revision}.` : `${identity.snapshot}.`;
    return text.replace(sectionRe, `$1${value}`);
}

function updateAttribution(project, identities) {
    const file = path.join(project, 'licenses and sources/Jitendex-Jiten-JMnedict Attribution.md');
    let text = fs.readFileSync(file, 'utf8');
    text = replaceSnapshotText(text, 'Jitendex', identities.jitendex);
    text = replaceSnapshotText(text, 'JMnedict', identities.jmnedict);
    fs.writeFileSync(file, text);
    const kFile = path.join(project, 'licenses and sources/KANJIDIC Attribution.md');
    let kText = fs.readFileSync(kFile, 'utf8');
    kText = kText.replace(/Source metadata retained with the project identifies the reviewed snapshot as `[^`]+`, revision `[^`]+`[^\n]*/, `Source metadata retained with the project identifies the refreshed snapshot as \`${identities.kanjidic.title}\`${identities.kanjidic.revision ? `, revision \`${identities.kanjidic.revision}\`` : ''}, generated through the Yomitan import pipeline.`);
    fs.writeFileSync(kFile, kText);
}

function updateProvenance(project, identities) {
    const provenancePath = path.join(project, 'data/external-evidence-source-provenance.json');
    const provenance = JSON.parse(fs.readFileSync(provenancePath, 'utf8'));
    for (const entry of provenance.entries || []) {
        for (const source of entry.sources || []) {
            if (source.name === 'Jitendex') Object.assign(source, { snapshot: identities.jitendex.snapshot, ...(identities.jitendex.revision ? { revision: identities.jitendex.revision } : {}) });
            if (source.name === 'JMnedict') Object.assign(source, { snapshot: identities.jmnedict.snapshot, ...(identities.jmnedict.revision ? { revision: identities.jmnedict.revision } : {}) });
            if (source.name === 'KANJIDIC2/KANJIDIC') Object.assign(source, { snapshot: identities.kanjidic.snapshot, ...(identities.kanjidic.revision ? { revision: identities.kanjidic.revision } : {}) });
        }
    }
    fs.writeFileSync(provenancePath, `${JSON.stringify(provenance, null, 2)}\n`);

    const classificationPath = path.join(project, 'data/translator-data-provenance-classification.json');
    const classification = JSON.parse(fs.readFileSync(classificationPath, 'utf8'));
    for (const item of classification.entries || classification.classifications || []) {
        if (!Array.isArray(item.sourceBasis)) continue;
        item.sourceBasis = item.sourceBasis.map(line => {
            if (/Jitendex snapshot/.test(line)) return line.replace(/Jitendex snapshot [^ .]+(?: \/ revision [^ .]+)?/, `Jitendex snapshot ${identities.jitendex.snapshot}${identities.jitendex.revision ? ` / revision ${identities.jitendex.revision}` : ''}`);
            if (/JMnedict snapshot/.test(line)) return line.replace(/JMnedict snapshot [^ ]+/, `JMnedict snapshot ${identities.jmnedict.snapshot}`);
            if (/KANJIDIC2\/KANJIDIC snapshot/.test(line)) return line.replace(/KANJIDIC2\/KANJIDIC snapshot [^ ]+ \/ revision [^,]+/, `KANJIDIC2/KANJIDIC snapshot ${identities.kanjidic.snapshot} / revision ${identities.kanjidic.revision || identities.kanjidic.snapshot}`);
            return line;
        });
    }
    fs.writeFileSync(classificationPath, `${JSON.stringify(classification, null, 2)}\n`);
}

function copyTree(src, dst) {
    fs.cpSync(src, dst, { recursive: true, force: true, filter: source => !source.includes(`${path.sep}tools${path.sep}edrdg-update${path.sep}staging${path.sep}`) });
}

function changedFiles(beforeRoot, afterRoot) {
    const result = [];
    const walk = (root, current = '') => {
        const dir = path.join(root, current);
        if (!fs.existsSync(dir)) return [];
        let out = [];
        for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
            const rel = path.join(current, e.name);
            const posix = rel.split(path.sep).join('/');
            if (posix === 'tools/edrdg-update/staging' || posix.startsWith('tools/edrdg-update/staging/')) continue;
            if (e.isDirectory()) out = out.concat(walk(root, rel)); else if (e.isFile()) out.push(rel);
        }
        return out;
    };
    const all = new Set([...walk(beforeRoot), ...walk(afterRoot)]);
    for (const rel of [...all].sort()) {
        const a = path.join(beforeRoot, rel), b = path.join(afterRoot, rel);
        if (!fs.existsSync(a) || !fs.existsSync(b) || sha256File(a) !== sha256File(b)) result.push(rel.split(path.sep).join('/'));
    }
    return result;
}

function runQa(root) {
    const script = path.join(root, 'tools/qa/run-translator-release-qa.js');
    const result = spawnSync(process.execPath, [script, root], { cwd: root, stdio: 'inherit', env: { ...process.env, TERM: process.env.TERM || 'dumb' } });
    if (result.status !== 0) throw new Error(`Release QA failed with exit code ${result.status}.`);
}

function refreshProvenanceHashes(root) {
    const script = path.join(root, 'tools/qa/update-external-evidence-source-provenance-hashes.js');
    const result = spawnSync(process.execPath, [script, root], { cwd: root, stdio: 'inherit' });
    if (result.status !== 0) throw new Error(`Provenance hash refresh failed with exit code ${result.status}.`);
}

async function prepare(options = {}) {
    const root = path.resolve(options.projectRoot || projectRoot);
    const stagingDir = path.resolve(options.stagingDir || path.join(root, 'tools/edrdg-update/staging', new Date().toISOString().replace(/[:.]/g, '-')));
    if (fs.existsSync(stagingDir) && fs.readdirSync(stagingDir).length) throw new Error(`Staging directory is not empty: ${stagingDir}`);
    fs.mkdirSync(stagingDir, { recursive: true });
    const snapshots = {};
    for (const [name, source] of Object.entries(SOURCES)) {
        const archive = await obtainArchive(name, source, stagingDir, options.offline?.[name]);
        const extracted = path.join(stagingDir, 'snapshots', name);
        const files = extractZip(archive.archivePath, extracted);
        const index = readIndex(extracted);
        snapshots[name] = { ...archive, extracted, files, index, identity: snapshotIdentity(index, name), snapshotSha256: candidateTool.computeSnapshotSha256(extracted) };
    }

    const candidateProject = path.join(stagingDir, 'candidate-project');
    copyTree(root, candidateProject);
    const report = { schemaVersion: 1, purpose: 'CJ2R EDRDG update review report', generatedAt: new Date().toISOString(), blockers: [], scoreChanges: [], jmdictCrossCheckMissing: [], updatedCounts: {} };
    const jitendexMap = termPairMap(snapshots.jitendex.extracted);
    const jmdictMap = termPairMap(snapshots.jmdict.extracted);
    const jmnedictMap = termPairMap(snapshots.jmnedict.extracted);
    updateGeneralBank(candidateProject, jitendexMap, jmdictMap, report);
    updateAtejiBank(candidateProject, jitendexMap, jmdictMap, report);
    updateReadingEvidence(candidateProject, jitendexMap, jmdictMap, report);
    validateJmnedict(candidateProject, jmnedictMap, report);
    refreshKanjidic(candidateProject, snapshots.kanjidic.extracted, snapshots.kanjidic.index, report);
    const identities = Object.fromEntries(Object.entries(snapshots).map(([k, v]) => [k, v.identity]));
    updateAttribution(candidateProject, identities);
    updateProvenance(candidateProject, identities);
    if (!report.blockers.length) refreshProvenanceHashes(candidateProject);

    const manifest = {
        schemaVersion: 1,
        purpose: 'Pinned EDRDG update staging manifest. Applying requires this exact manifest hash and zero blockers.',
        generatedAt: report.generatedAt,
        sources: Object.fromEntries(Object.entries(snapshots).map(([name, item]) => [name, {
            requestedUrl: SOURCES[name].url,
            archiveSha256: item.archiveSha256,
            snapshotSha256: item.snapshotSha256,
            title: item.identity.title,
            snapshot: item.identity.snapshot,
            revision: item.identity.revision
        }])),
        blockers: report.blockers.length,
        changedFiles: changedFiles(root, candidateProject)
    };
    const reportPath = path.join(stagingDir, 'edrdg-update-review-report.json');
    const manifestPath = path.join(stagingDir, 'edrdg-update-manifest.json');
    fs.writeFileSync(reportPath, `${JSON.stringify(report, null, 2)}\n`);
    fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
    const manifestSha256 = sha256File(manifestPath);
    fs.writeFileSync(path.join(stagingDir, 'edrdg-update-manifest.sha256'), `${manifestSha256}  edrdg-update-manifest.json\n`);
    return { stagingDir, candidateProject, report, manifest, manifestPath, manifestSha256 };
}

function applyPrepared(stagingDir, expectedManifestSha256, options = {}) {
    const root = path.resolve(options.projectRoot || projectRoot);
    const stage = path.resolve(stagingDir);
    const manifestPath = path.join(stage, 'edrdg-update-manifest.json');
    const reportPath = path.join(stage, 'edrdg-update-review-report.json');
    if (!fs.existsSync(manifestPath) || !fs.existsSync(reportPath)) throw new Error('Staging manifest/report is missing.');
    const actual = sha256File(manifestPath);
    if (!/^[0-9a-f]{64}$/.test(expectedManifestSha256 || '') || actual !== expectedManifestSha256) throw new Error(`Manifest hash mismatch. Expected ${expectedManifestSha256 || '(missing)'}, got ${actual}.`);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    if (manifest.blockers || report.blockers?.length) throw new Error('Update has review blockers. Resolve them and prepare a new manifest before applying.');
    const candidateProject = path.join(stage, 'candidate-project');
    if (!fs.existsSync(candidateProject)) throw new Error('Candidate project is missing.');
    if (!options.skipReleaseQa) runQa(candidateProject);
    const changed = manifest.changedFiles || [];
    const backup = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-edrdg-backup-'));
    try {
        for (const rel of changed) {
            const src = path.join(root, rel), dst = path.join(backup, rel);
            if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
        }
        for (const rel of changed) {
            const src = path.join(candidateProject, rel), dst = path.join(root, rel);
            if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); }
            else if (fs.existsSync(dst)) fs.unlinkSync(dst);
        }
        if (!options.skipReleaseQa) runQa(root);
    } catch (error) {
        for (const rel of changed) {
            const saved = path.join(backup, rel), dst = path.join(root, rel);
            if (fs.existsSync(saved)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(saved, dst); }
            else if (fs.existsSync(dst)) fs.unlinkSync(dst);
        }
        throw error;
    } finally {
        fs.rmSync(backup, { recursive: true, force: true });
    }
    return { changedFiles: changed, manifestSha256: actual };
}

async function runCli(argv = process.argv.slice(2)) {
    const args = parseArgs(argv);
    if (args.apply) {
        if (!args['staging-dir'] || !args['manifest-sha256']) throw new Error('--apply requires --staging-dir and --manifest-sha256.');
        const result = applyPrepared(args['staging-dir'], args['manifest-sha256']);
        console.log(JSON.stringify({ ok: true, applied: true, ...result }, null, 2));
        return;
    }
    const result = await prepare({ stagingDir: args['staging-dir'], offline: args.offline });
    console.log(JSON.stringify({
        ok: result.report.blockers.length === 0,
        applied: false,
        stagingDir: result.stagingDir,
        blockers: result.report.blockers.length,
        changedFiles: result.manifest.changedFiles.length,
        manifestSha256: result.manifestSha256,
        next: result.report.blockers.length ? 'Review edrdg-update-review-report.json and do not apply yet.' : `Review the report, then run with --apply --staging-dir ${JSON.stringify(result.stagingDir)} --manifest-sha256 ${result.manifestSha256}`
    }, null, 2));
    if (result.report.blockers.length) process.exitCode = 3;
}

if (require.main === module) runCli().catch(error => { console.error(error.stack || error); process.exit(2); });

module.exports = {
    SOURCES,
    applyPrepared,
    crc32,
    extractZip,
    parseArgs,
    prepare,
    readIndex,
    safeRel,
    snapshotIdentity,
    termPairMap,
    buildTermEvidenceIndex,
    readingHasSpellingSpecificApplicability,
    readGeneralWordBank
};
