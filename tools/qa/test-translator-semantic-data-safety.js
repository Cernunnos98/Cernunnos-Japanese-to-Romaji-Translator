const assert = require('assert');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const readJson = relativePath => JSON.parse(fs.readFileSync(path.join(root, relativePath), 'utf8'));
const kana = /^[ぁ-ゖァ-ヺー]+$/u;
const rule0Output = value => Boolean(value)
    && /[\p{Script=Latin}\p{Number}]/u.test(value)
    && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(value)
    && !/[ĀĒĪŌŪāēīōū]/u.test(value);

const nouns = readJson('data/nouns/nouns-term-bank-1.json');
const jmnedict = readJson('data/nouns/jmnedict-bank-1.json');
const reviewed = readJson('data/nouns/reviewed-proper-name-span-evidence.json');

for (const entry of nouns) for (const candidate of entry.readings || []) {
    assert(kana.test(String(candidate.reading || '')), `Invalid proper-noun reading ${entry.surface}: ${candidate.reading}`);
}
for (const entry of jmnedict) assert(kana.test(String(entry[1] || '')), `Invalid JMnedict reading ${entry[0]}: ${entry[1]}`);

const nounBySurface = new Map(nouns.map(entry => [entry.surface, entry]));
assert.strictEqual(nounBySurface.get('大坂城').readings[0].reading, 'おおさかじょう');
assert.strictEqual(nounBySurface.get('高雄駅').readings[0].reading, 'カオシュンえき');
assert.strictEqual(nounBySurface.get('横浜市営地下鉄グリーンライン').readings[0].reading, 'よこはましえいちかてつグリーンライン');
assert.strictEqual(jmnedict.find(entry => entry[0] === '春麗')[1], 'チュンリー');

const reviewedBySurface = new Map(reviewed.map(entry => [entry.surface, entry]));
for (const [surface, expected] of [
    ['大坂城', 'Oosakajou'],
    ['高雄駅', 'Kaohsiung Eki'],
    ['横浜市営地下鉄グリーンライン', 'Yokohama Shiei Chikatetsu Green Line'],
    ['春麗', 'Chun-Li']
]) {
    const entry = reviewedBySurface.get(surface);
    assert(entry, `Missing reviewed span ${surface}`);
    assert(kana.test(entry.reading), `Invalid reviewed reading ${surface}: ${entry.reading}`);
    assert(rule0Output(entry.romaji), `Invalid reviewed Romaji ${surface}: ${entry.romaji}`);
    assert.strictEqual(entry.romaji, expected);
}

function assertNoConflicts(rows, key, value, label) {
    const seen = new Map();
    for (const row of rows) {
        const k = key(row);
        const v = JSON.stringify(value(row));
        if (seen.has(k)) assert.strictEqual(seen.get(k), v, `Conflicting ${label} rows for ${k}`);
        else seen.set(k, v);
    }
}

const generalRaw = readJson('data/general-words/general-words-term-bank-1.json');
const general = Array.isArray(generalRaw) ? generalRaw : generalRaw.entries;
const loanwords = readJson('data/loanwords/loanwords-term-bank-1.json');
const ateji = readJson('data/ateji/ateji-term-bank-1.json');
const commonWords = readJson('data/common-words/common-words-term-bank-1.json');
const compoundWords = readJson('data/compound-words/compound-words-term-bank-1.json');
const particles = readJson('data/grammar/particle-expressions.json');
const counters = readJson('data/grammar/counter-date-reading-evidence.json');
const readingEvidence = readJson('data/reading-evidence/reading-evidence.json');
const reviewedReadingEvidence = readJson('data/reviewed-reading/reviewed-reading-evidence.json');
const titleReadingEvidence = readJson('data/title-readings/title-reading-evidence.json');
const rendaku = readJson('data/rendaku/rendaku-evidence.json');
const historicalRaw = readJson('data/historical-kana/historical-kana-evidence.json');
const historical = Array.isArray(historicalRaw) ? historicalRaw : historicalRaw.entries;

const provenanceClassification = readJson('data/translator-data-provenance-classification.json');
const externalProvenance = readJson('data/external-evidence-source-provenance.json');
const differentialReviewDecisions = readJson('tools/qa/translator-differential-review-decisions.json');

function listFilesRecursive(directory, prefix = '') {
    const rows = [];
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
        const relative = prefix ? `${prefix}/${entry.name}` : entry.name;
        const absolute = path.join(directory, entry.name);
        if (entry.isDirectory()) rows.push(...listFilesRecursive(absolute, relative));
        else if (entry.isFile()) rows.push(relative.replace(/\\/gu, '/'));
    }
    return rows;
}

function sha256File(relativePath) {
    return crypto.createHash('sha256').update(fs.readFileSync(path.join(root, relativePath))).digest('hex');
}

assert.strictEqual(provenanceClassification?._meta?.version, 2, 'Unsupported translator-data provenance classification version.');
assert(Array.isArray(provenanceClassification.entries) && provenanceClassification.entries.length > 0, 'Translator-data provenance classification requires entries.');
const classificationByPath = new Map(provenanceClassification.entries.map(entry => [entry.path, entry]));
assert.strictEqual(classificationByPath.size, provenanceClassification.entries.length, 'Translator-data provenance classification contains duplicate paths.');
const maintainedDataFiles = listFilesRecursive(path.join(root, 'data'))
    .map(relative => `data/${relative}`)
    .filter(relative => relative !== 'data/translator-data-provenance-classification.json')
    .sort();
assert.deepStrictEqual([...classificationByPath.keys()].sort(), maintainedDataFiles, 'Every maintained file under data/ must have exactly one provenance classification.');
for (const entry of provenanceClassification.entries) {
    assert(provenanceClassification._meta.categories.includes(entry.classification), `Unknown provenance classification for ${entry.path}: ${entry.classification}`);
    assert(provenanceClassification._meta.statusValues.includes(entry.status), `Unknown provenance status for ${entry.path}: ${entry.status}`);
    assert.strictEqual(entry.status, 'complete', `Incomplete provenance classification is not release-safe: ${entry.path}`);
    assert.notStrictEqual(entry.classification, 'legacy/unknown', `Unknown data lineage is not release-safe: ${entry.path}`);
    assert(Array.isArray(entry.sourceBasis) && entry.sourceBasis.length > 0, `Provenance source basis missing: ${entry.path}`);
    assert(fs.existsSync(path.join(root, entry.path)), `Classified data file is missing: ${entry.path}`);
}

assert.strictEqual(externalProvenance?._meta?.version, 3, 'Unsupported external-evidence provenance version.');
assert(Array.isArray(externalProvenance.entries) && externalProvenance.entries.length > 0, 'External-evidence provenance requires entries.');
const externalProvenanceByPath = new Map(externalProvenance.entries.map(entry => [entry.path, entry]));
assert.strictEqual(externalProvenanceByPath.size, externalProvenance.entries.length, 'External-evidence provenance contains duplicate paths.');
for (const entry of externalProvenance.entries) {
    const classification = classificationByPath.get(entry.path);
    assert(classification, `External provenance target lacks provenance classification: ${entry.path}`);
    assert(['externally-derived', 'mixed'].includes(classification.classification), `External provenance target has incompatible classification: ${entry.path}`);
    assert.strictEqual(classification.role, 'runtime-bank', `External provenance manifest should pin runtime/evidence banks, not ${classification.role}: ${entry.path}`);
    assert.strictEqual(entry.sha256, sha256File(entry.path), `External provenance SHA-256 is stale for ${entry.path}`);
    assert(Array.isArray(entry.sources) && entry.sources.length > 0, `External provenance source list missing: ${entry.path}`);
    assert(Array.isArray(entry.licenceRefs) && entry.licenceRefs.length > 0, `External provenance licence list missing: ${entry.path}`);
    for (const licencePath of entry.licenceRefs) assert(fs.existsSync(path.join(root, licencePath)), `External provenance licence reference is missing: ${entry.path} -> ${licencePath}`);
}

function verifyExternalProvenanceCoverage(classificationEntries, provenanceEntries) {
    const required = classificationEntries
        .filter(entry => entry.role === 'runtime-bank' && ['externally-derived', 'mixed'].includes(entry.classification))
        .map(entry => entry.path)
        .sort();
    const pinned = provenanceEntries.map(entry => entry.path).sort();
    assert.deepStrictEqual(pinned, required, 'Every externally-derived or mixed runtime bank must have exactly one pinned external provenance record.');
}

verifyExternalProvenanceCoverage(provenanceClassification.entries, externalProvenance.entries);
const missingPinnedProvenanceMutation = externalProvenance.entries.filter(entry => entry.path !== 'data/nouns/reviewed-proper-name-span-evidence.json');
assert.throws(
    () => verifyExternalProvenanceCoverage(provenanceClassification.entries, missingPinnedProvenanceMutation),
    /externally-derived or mixed runtime bank/u,
    'External provenance coverage audit failed to detect a mixed runtime bank with no pinned provenance record.'
);

const semanticOraclePath = path.join(root, 'tools/qa/semantic-oracle/loanword-source-truth.json');
const semanticOracleSource = fs.readFileSync(semanticOraclePath, 'utf8');
const semanticOracle = JSON.parse(semanticOracleSource);

for (const forbiddenDependency of ['runtimeState', 'loanwordDictionary', 'translator-engine', 'data/loanwords/loanwords-term-bank-1.json']) {
    assert(!semanticOracleSource.includes(forbiddenDependency), `Semantic oracle must remain independent of production truth tables: ${forbiddenDependency}`);
}
assert.strictEqual(semanticOracle?._meta?.version, 1, 'Unsupported semantic-oracle version.');
assert(Array.isArray(semanticOracle.cases) && semanticOracle.cases.length > 0, 'Semantic oracle requires independently reviewed cases.');
for (const item of semanticOracle.cases) {
    assert(item.id && item.surface && item.kind, `Incomplete semantic-oracle case: ${JSON.stringify(item)}`);
    if (item.kind === 'canonical-output') assert(item.canonicalOutput, `Canonical semantic-oracle case lacks output: ${item.id}`);
    assert(Array.isArray(item.evidence) && item.evidence.length > 0, `Semantic-oracle case lacks independent evidence: ${item.id}`);
    for (const evidence of item.evidence) {
        assert(/^https:\/\//u.test(String(evidence?.url || '')), `Semantic-oracle evidence must use an external HTTPS source: ${item.id}`);
        assert(String(evidence?.authority || '').trim(), `Semantic-oracle evidence authority missing: ${item.id}`);
    }
}

function getLoanwordSurface(row) {
    return String(Array.isArray(row) ? row[0] : row?.surface || '').trim();
}

function getLoanwordOutput(row) {
    return String(Array.isArray(row) ? row[1] : row?.output || '').trim();
}

function getLoanwordRequiresReview(row) {
    return Boolean(!Array.isArray(row) && row?.requiresReview === true);
}

function verifyCountryLanguageScope(bankRows) {
    const objectRows = bankRows.filter(row => !Array.isArray(row));
    const bySurface = new Map(objectRows.map(row => [String(row.surface || '').trim(), row]));
    for (const row of objectRows) {
        if (row.category !== 'country-language') continue;
        const surface = String(row.surface || '').trim();
        const output = String(row.output || '').trim();
        assert(surface.length > 1 && surface.endsWith('語'), `Country-language evidence must cover a complete surface ending in 語: ${surface || '<empty>'}`);
        assert(output.endsWith('-go'), `Country-language output must preserve the reviewed country name plus -go: ${surface} => ${output || '<empty>'}`);
        assert.strictEqual(row.requiresReview === true, false, `Country-language evidence must be authoritative whole-span evidence rather than review-only metadata: ${surface}`);
        const baseSurface = surface.slice(0, -1);
        const countryRow = bySurface.get(baseSurface);
        if (countryRow?.category === 'country-name') {
            assert.strictEqual(output, `${String(countryRow.output || '').trim()}-go`, `Country-language output disagrees with the corresponding reviewed country-name row: ${surface}`);
        }
    }
}

verifyCountryLanguageScope(loanwords);

const malformedCountryLanguageBank = JSON.parse(JSON.stringify(loanwords));
malformedCountryLanguageBank.push({ surface: '架空', output: 'Fiction-go', category: 'country-language' });
assert.throws(() => verifyCountryLanguageScope(malformedCountryLanguageBank), /架空/u, 'Country-language semantic-scope audit failed to reject a category row that does not cover a complete 語 expression.');

const translatedCountryLanguageBank = JSON.parse(JSON.stringify(loanwords));
const translatedCountryLanguageRow = translatedCountryLanguageBank.find(row => !Array.isArray(row) && row.surface === 'ロシア語');
translatedCountryLanguageRow.output = 'Russian';
assert.throws(() => verifyCountryLanguageScope(translatedCountryLanguageBank), /ロシア語/u, 'Country-language semantic-scope audit failed to reject an arbitrary translated language label.');

function verifyLoanwordSemanticOracle(bankRows, oracleCases) {
    const bySurface = new Map(bankRows.map(row => [getLoanwordSurface(row), row]));
    for (const item of oracleCases) {
        const row = bySurface.get(item.surface);
        assert(row, `Semantic oracle surface missing from loanword bank: ${item.surface}`);
        const output = getLoanwordOutput(row);
        if (item.kind === 'canonical-output') {
            assert.strictEqual(output, item.canonicalOutput, `Semantic oracle output mismatch for ${item.surface}`);
            assert.strictEqual(getLoanwordRequiresReview(row), Boolean(item.requiresReview), `Semantic oracle review state mismatch for ${item.surface}`);
        } else if (item.kind === 'review-only') {
            assert(!Array.isArray(row), `Review-only semantic row must carry metadata: ${item.surface}`);
            assert.strictEqual(output, '', `Review-only semantic row must not emit authoritative output for ${item.surface}`);
            assert.strictEqual(getLoanwordRequiresReview(row), true, `Review-only semantic row must remain reviewable for ${item.surface}`);
        } else {
            assert.fail(`Unknown semantic-oracle kind: ${item.kind}`);
        }
        for (const forbidden of item.forbiddenOutputs || []) {
            assert.notStrictEqual(output, forbidden, `Translation/localisation alias leaked into source-spelling output for ${item.surface}`);
        }
    }
}

verifyLoanwordSemanticOracle(loanwords, semanticOracle.cases);

const corruptedStreetFighterBank = JSON.parse(JSON.stringify(loanwords));
const corruptedStreetFighterRow = corruptedStreetFighterBank.find(row => getLoanwordSurface(row) === 'ストリートファイター');
if (Array.isArray(corruptedStreetFighterRow)) corruptedStreetFighterRow[1] = 'Hard Times';
else corruptedStreetFighterRow.output = 'Hard Times';
assert.throws(() => verifyLoanwordSemanticOracle(corruptedStreetFighterBank, semanticOracle.cases), /ストリートファイター/u, 'Semantic oracle failed to detect injected Street Fighter localisation corruption.');

const corruptedMachBank = JSON.parse(JSON.stringify(loanwords));
const corruptedMachRow = corruptedMachBank.find(row => getLoanwordSurface(row) === 'マッハゴーゴーゴー');
if (Array.isArray(corruptedMachRow)) corruptedMachRow[1] = 'Speed Racer';
else corruptedMachRow.output = 'Speed Racer';
assert.throws(() => verifyLoanwordSemanticOracle(corruptedMachBank, semanticOracle.cases), /マッハゴーゴーゴー/u, 'Semantic oracle failed to detect injected translation-alias corruption.');

for (const oracleCase of semanticOracle.cases.filter(item => item.kind === 'canonical-output' && (item.forbiddenOutputs || []).length)) {
    const corruptedBank = JSON.parse(JSON.stringify(loanwords));
    const corruptedRow = corruptedBank.find(row => getLoanwordSurface(row) === oracleCase.surface);
    assert(corruptedRow, `Missing mutation target for semantic oracle: ${oracleCase.surface}`);
    const forbidden = oracleCase.forbiddenOutputs[0];
    if (Array.isArray(corruptedRow)) corruptedRow[1] = forbidden;
    else {
        corruptedRow.output = forbidden;
        corruptedRow.requiresReview = false;
        delete corruptedRow.reviewReason;
    }
    assert.throws(
        () => verifyLoanwordSemanticOracle(corruptedBank, semanticOracle.cases),
        new RegExp(oracleCase.surface, 'u'),
        `Semantic oracle failed to detect a forbidden identity/localisation alias for ${oracleCase.surface}.`
    );
}

const missingOracleRowBank = JSON.parse(JSON.stringify(loanwords)).filter(row => getLoanwordSurface(row) !== 'ストリートファイター');
assert.throws(() => verifyLoanwordSemanticOracle(missingOracleRowBank, semanticOracle.cases), /ストリートファイター/u, 'Semantic oracle failed to detect an authoritative-row deletion.');

const crossBankOraclePath = path.join(root, 'tools/qa/semantic-oracle/cross-bank-conflict-truth.json');
const crossBankOracleSource = fs.readFileSync(crossBankOraclePath, 'utf8');
const crossBankOracle = JSON.parse(crossBankOracleSource);
for (const forbiddenDependency of ['runtimeState', 'translator-engine', 'data/']) {
    assert(!crossBankOracleSource.includes(forbiddenDependency), `Cross-bank semantic oracle must remain independent of production truth tables: ${forbiddenDependency}`);
}
assert.strictEqual(crossBankOracle?._meta?.version, 1, 'Unsupported cross-bank semantic-oracle version.');
assert(Array.isArray(crossBankOracle.cases), 'Cross-bank semantic oracle requires a cases array.');

function collectCrossBankEvidence() {
    const rows = [];
    const add = (bank, surface, reading, romaji = null, scope = 'global') => {
        const cleanSurface = String(surface || '').trim();
        const cleanReading = String(reading || '').trim();
        const cleanRomaji = String(romaji || '').trim();
        if (!cleanSurface || (!cleanReading && !cleanRomaji)) return;
        rows.push({ bank, surface: cleanSurface, reading: cleanReading || null, romaji: cleanRomaji || null, scope });
    };
    for (const row of commonWords) add('common', row.surface, row.reading, null, row.pattern ? 'contextual' : 'global');
    for (const row of compoundWords) add('compound', row[0], row[1]);
    for (const row of ateji) add('ateji', row[0], row[1]);
    for (const row of reviewed) add('proper-reviewed', row.surface, row.reading, row.romaji, 'name');
    for (const row of titleReadingEvidence) add('title', row.surface, row.reading, row.romaji, row.pattern ? 'contextual' : 'title');
    for (const row of counters) add('counter-date', row.surface, row.reading, row.romaji, 'role-specialised');
    for (const row of readingEvidence) add('reading-evidence', row.surface, row.preferredReading);
    for (const row of reviewedReadingEvidence.preferences || []) add('reviewed-preference', row.surface, row.reading, row.romaji);
    for (const row of reviewedReadingEvidence.spans || []) add('reviewed-span', row.surface, row.reading, row.romaji);
    for (const row of historical) add('historical', row.surface, row.reading, null, 'historical');
    for (const row of loanwords) add('loanword', getLoanwordSurface(row), null, getLoanwordOutput(row), 'source-spelling');
    return rows;
}

function findCrossBankReadingConflicts(rows) {
    const grouped = new Map();
    for (const row of rows) {
        if (!row.reading || row.scope === 'contextual') continue;
        if (!grouped.has(row.surface)) grouped.set(row.surface, []);
        grouped.get(row.surface).push(row);
    }
    const conflicts = [];
    for (const [surface, evidenceRows] of grouped) {
        const readings = [...new Set(evidenceRows.map(row => row.reading))].sort();
        const banks = [...new Set(evidenceRows.map(row => row.bank))].sort();
        if (readings.length > 1 && banks.length > 1) conflicts.push({ surface, readings, banks });
    }
    return conflicts.sort((a, b) => a.surface.localeCompare(b.surface, 'ja'));
}

function findCrossBankOutputConflicts(rows) {
    const grouped = new Map();
    for (const row of rows) {
        if (!row.romaji || row.scope === 'contextual') continue;
        if (!grouped.has(row.surface)) grouped.set(row.surface, []);
        grouped.get(row.surface).push(row);
    }
    const conflicts = [];
    for (const [surface, evidenceRows] of grouped) {
        const outputs = [...new Set(evidenceRows.map(row => row.romaji))].sort();
        const banks = [...new Set(evidenceRows.map(row => row.bank))].sort();
        if (outputs.length > 1 && banks.length > 1) conflicts.push({ surface, outputs, banks });
    }
    return conflicts.sort((a, b) => a.surface.localeCompare(b.surface, 'ja'));
}

function verifyCrossBankSemanticOracle(conflicts, oracleCases) {
    const bySurface = new Map(oracleCases.map(item => [item.surface, item]));
    assert.strictEqual(bySurface.size, oracleCases.length, 'Cross-bank semantic oracle contains duplicate surfaces.');
    for (const item of oracleCases) {
        assert(item.id && item.surface && item.kind, `Incomplete cross-bank semantic-oracle case: ${JSON.stringify(item)}`);
        assert(['legitimate-ambiguity', 'semantic-role-split'].includes(item.kind), `Unsupported cross-bank semantic-oracle kind: ${item.kind}`);
        assert(Array.isArray(item.allowedReadings) && item.allowedReadings.length > 1, `Cross-bank oracle case needs multiple allowed readings: ${item.id}`);
        assert(Array.isArray(item.evidenceFamilies) && item.evidenceFamilies.length > 1, `Cross-bank oracle case needs multiple evidence families: ${item.id}`);
        assert(Array.isArray(item.evidence) && item.evidence.length > 0, `Cross-bank oracle case lacks independent evidence: ${item.id}`);
        for (const evidence of item.evidence) {
            assert(/^https:\/\//u.test(String(evidence?.url || '')), `Cross-bank oracle evidence must use an external HTTPS source: ${item.id}`);
            assert(String(evidence?.authority || '').trim(), `Cross-bank oracle evidence authority missing: ${item.id}`);
        }
    }
    for (const conflict of conflicts) {
        const item = bySurface.get(conflict.surface);
        assert(item, `Unadjudicated cross-bank reading conflict: ${conflict.surface} => ${conflict.readings.join(' / ')} (${conflict.banks.join(', ')})`);
        assert.deepStrictEqual([...item.allowedReadings].sort(), conflict.readings, `Cross-bank reading set changed for ${conflict.surface}`);
        for (const bank of conflict.banks) assert(item.evidenceFamilies.includes(bank), `Cross-bank oracle does not cover ${bank} evidence for ${conflict.surface}`);
    }
    for (const item of oracleCases) {
        assert(conflicts.some(conflict => conflict.surface === item.surface), `Stale cross-bank semantic-oracle case: ${item.surface}`);
    }
}

const crossBankEvidence = collectCrossBankEvidence();
const crossBankReadingConflicts = findCrossBankReadingConflicts(crossBankEvidence);
verifyCrossBankSemanticOracle(crossBankReadingConflicts, crossBankOracle.cases);
assert.deepStrictEqual(findCrossBankOutputConflicts(crossBankEvidence), [], 'Unadjudicated cross-bank authoritative Romaji/output conflict detected.');

function verifyTitleEvidenceScope(titleRows) {
    const ordinaryReadings = new Map();
    const addReading = (surface, reading) => {
        const cleanSurface = String(surface || '').trim();
        const cleanReading = String(reading || '').trim();
        if (!cleanSurface || !cleanReading) return;
        if (!ordinaryReadings.has(cleanSurface)) ordinaryReadings.set(cleanSurface, new Set());
        ordinaryReadings.get(cleanSurface).add(cleanReading);
    };
    for (const row of general) for (const candidate of row[1] || []) addReading(row[0], candidate[0]);
    for (const row of commonWords) addReading(row.surface, row.reading);
    for (const row of readingEvidence) {
        addReading(row.surface, row.preferredReading);
        for (const alternate of row.alternatives || []) addReading(row.surface, Array.isArray(alternate) ? alternate[0] : alternate?.reading);
    }
    const loanwordOutputs = new Map(loanwords.map(row => [getLoanwordSurface(row), getLoanwordOutput(row)]));
    for (const row of titleRows) {
        const surface = String(row.surface || '').trim();
        const patternText = String(row.pattern || '').trim();
        assert(surface && patternText, `Title evidence must retain an explicit source scope: ${surface || '<empty>'}`);
        let pattern;
        try { pattern = new RegExp(patternText, 'u'); } catch (error) { assert.fail(`Title evidence has invalid scope pattern for ${surface}: ${error.message}`); }
        const lexicalReadings = ordinaryReadings.get(surface) || new Set();
        const titleReading = String(row.reading || '').trim();
        const readingConflict = Boolean(titleReading && [...lexicalReadings].some(reading => reading !== titleReading));
        const loanwordOutput = loanwordOutputs.get(surface);
        const titleRomaji = String(row.romaji || '').trim();
        const outputConflict = Boolean(loanwordOutput && titleRomaji && loanwordOutput !== titleRomaji);
        if (readingConflict || outputConflict) {
            assert.strictEqual(pattern.test(surface), false, `Title-specific evidence leaks into bare ordinary use for ${surface}`);
        }
    }
}

verifyTitleEvidenceScope(titleReadingEvidence);

function verifyGeneralReadingEvidenceCompatibility(generalRows, readingRows, reviewRows) {
    const generalBySurface = new Map(generalRows.map(row => [String(row[0] || '').trim(), new Set((row[1] || []).map(candidate => String(candidate?.[0] || '').trim()).filter(Boolean))]));
    const reviewByKey = new Map(reviewRows
        .filter(row => row?.sourceType === 'general-word-vs-reading-evidence')
        .map(row => [`${String(row.surface || '').trim()}\u0000${String(row.sourceType || '').trim()}`, row]));
    for (const row of readingRows) {
        const surface = String(row.surface || '').trim();
        const preferred = String(row.preferredReading || '').trim();
        const candidates = generalBySurface.get(surface);
        if (!surface || !preferred || !candidates || candidates.has(preferred)) continue;
        const review = reviewByKey.get(`${surface}\u0000general-word-vs-reading-evidence`);
        assert(review && String(review.decision || '').trim(), `General-word/read-evidence disagreement lacks explicit adjudication: ${surface} => general ${[...candidates].join(' / ')} vs preferred ${preferred}`);
    }
}

verifyGeneralReadingEvidenceCompatibility(general, readingEvidence, differentialReviewDecisions);
const unreviewedGeneralReadingMutation = JSON.parse(JSON.stringify(readingEvidence));
unreviewedGeneralReadingMutation.push({ surface: '安全試験', preferredReading: 'あんぜんためし', alternatives: [] });
const generalWithMutation = general.concat([['安全試験', [['あんぜんしけん', 200]], 1]]);
assert.throws(
    () => verifyGeneralReadingEvidenceCompatibility(generalWithMutation, unreviewedGeneralReadingMutation, differentialReviewDecisions),
    /安全試験/u,
    'General-word/read-evidence semantic audit failed to detect a new unadjudicated cross-evidence disagreement.'
);

const leakedTitleEvidence = JSON.parse(JSON.stringify(titleReadingEvidence));
const leakedTitleRow = leakedTitleEvidence.find(row => row.surface === '空');
assert(leakedTitleRow, 'Missing title-scope mutation target 空.');
leakedTitleRow.pattern = '空';
assert.throws(() => verifyTitleEvidenceScope(leakedTitleEvidence), /空/u, 'Title semantic-scope audit failed to detect a title-specific reading widened to bare lexical use.');

const injectedReadingConflict = crossBankEvidence.concat([
    { bank: 'mutation-a', surface: '安全試験', reading: 'あんぜんしけん', romaji: null, scope: 'global' },
    { bank: 'mutation-b', surface: '安全試験', reading: 'あんぜんためし', romaji: null, scope: 'global' }
]);
assert.throws(
    () => verifyCrossBankSemanticOracle(findCrossBankReadingConflicts(injectedReadingConflict), crossBankOracle.cases),
    /安全試験/u,
    'Cross-bank semantic audit failed to detect an injected unadjudicated reading conflict.'
);
const injectedKnownConflictMutation = crossBankEvidence.concat([
    { bank: 'mutation-c', surface: '一日', reading: 'いちじつ', romaji: null, scope: 'global' }
]);
assert.throws(
    () => verifyCrossBankSemanticOracle(findCrossBankReadingConflicts(injectedKnownConflictMutation), crossBankOracle.cases),
    /一日/u,
    'Cross-bank semantic audit failed to detect a new reading added to an already-adjudicated conflict.'
);
const injectedOutputConflict = crossBankEvidence.concat([
    { bank: 'mutation-output-a', surface: '外来語試験', reading: null, romaji: 'Source Form', scope: 'source-spelling' },
    { bank: 'mutation-output-b', surface: '外来語試験', reading: null, romaji: 'Translated Form', scope: 'global' }
]);
assert(findCrossBankOutputConflicts(injectedOutputConflict).some(item => item.surface === '外来語試験'), 'Cross-bank output audit failed to detect injected output conflict.');

assertNoConflicts(general, row => row[0], row => row[1], 'general-word');
assertNoConflicts(loanwords, row => Array.isArray(row) ? row[0] : row.surface, row => Array.isArray(row) ? row[1] : row.output, 'loanword');
assertNoConflicts(ateji, row => row[0], row => row[1], 'ateji');
assertNoConflicts(reviewed, row => row.surface, row => [row.reading, row.romaji, row.category], 'reviewed proper-name');
assertNoConflicts(particles, row => row.surface, row => row.romaji, 'particle expression');
assertNoConflicts(counters, row => row.surface, row => [row.reading, row.romaji], 'counter/date');
assertNoConflicts(readingEvidence, row => row.surface, row => [row.preferredReading, row.alternatives], 'reading evidence');
assertNoConflicts(rendaku, row => row.surface, row => [row.reading, row.rendaku, row.source], 'Rendaku evidence');
assertNoConflicts(historical, row => row.surface, row => [row.reading, row.pos, row.conjugationClass || null, row.source], 'historical-kana evidence');
assert.strictEqual(historical.find(row => row.surface === 'をかし')?.conjugationClass, 'シク活用', 'Historical をかし evidence must retain its reviewed シク活用 class.');


const assetContext = vm.createContext({
    window: { CJ2R_TRANSLATOR_CONFIG: {} },
    document: { currentScript: null, baseURI: 'https://translator.test/' },
    URL,
    setTimeout,
    clearTimeout,
    console
});
vm.runInContext(fs.readFileSync(path.join(root, 'src/translator/01-assets-and-schemas.js'), 'utf8'), assetContext);
const validateSchema = (schema, data) => vm.runInContext(
    `assetSchemaValidators[${JSON.stringify(schema)}](${JSON.stringify(data)})`,
    assetContext
);
assert.strictEqual(validateSchema('proper-noun-bank-v1', [['大坂城', 'おおさかじょう']]), true);
assert.strictEqual(validateSchema('proper-noun-bank-v1', [['大坂城', '大阪城']]), false);
assert.strictEqual(validateSchema('loanword-bank-v1', [['春麗', 'Chun-Li']]), true);
assert.strictEqual(validateSchema('loanword-bank-v1', [['春麗', '春麗']]), false);
assert.strictEqual(validateSchema('general-word-bank-v2', {
    _meta: { schemaVersion: 2, scoreSemantics: 'popularity-ranking-only', defaultReadingCoverage: 'filtered-positive-priority' },
    entries: [
        ['猫', [['ねこ', 1]], 1],
        ['猫', [['びょう', 1]], 1]
    ]
}), false);
assert.strictEqual(validateSchema('general-word-bank-v2', {
    _meta: { schemaVersion: 2, scoreSemantics: 'popularity-ranking-only', defaultReadingCoverage: 'filtered-positive-priority' },
    entries: [['猫', [['ねこ', 1]], 1, { readingCoverage: 'filtered-positive-priority', restrictionStatus: 'unknown-from-compact-bank' }]]
}), true);

const loaderContext = vm.createContext({
    getAssetPaths: () => [],
    runtimeState: {
        compoundWordDictionary: new Map(),
        particleExpressions: {},
        knownPhraseDictionary: new Map(),
        knownPhrasePrefixes: new Set(),
        grammaticalExpressionDictionary: new Map(),
        grammaticalExpressionPrefixes: new Set()
    },
    fallbackGrammaticalExpressionMap: {},
    addSurfacePrefixes(target, surface) {
        const characters = Array.from(String(surface || ''));
        for (let length = 1; length <= characters.length; length += 1) target.add(characters.slice(0, length).join(''));
    },
    console
});
vm.runInContext(fs.readFileSync(path.join(root, 'src/translator/06-lexical-and-evidence-loaders.js'), 'utf8'), loaderContext);
function buildPhraseSnapshot(compounds, particles, fallback) {
    loaderContext.runtimeState.compoundWordDictionary = new Map(compounds);
    loaderContext.runtimeState.particleExpressions = Object.fromEntries(particles);
    loaderContext.runtimeState.knownPhraseDictionary = new Map();
    loaderContext.fallbackGrammaticalExpressionMap = Object.fromEntries(fallback);
    loaderContext.buildKnownPhraseDictionary();
    return [...loaderContext.runtimeState.knownPhraseDictionary.entries()];
}
const phraseA = buildPhraseSnapshot(
    [['競合', { reading: 'きょうごう', romaji: 'Compound' }], ['語', { reading: 'ご', romaji: 'Go' }]],
    [['競合', 'particle'], ['のみ', 'nomi']],
    [['語', 'Fallback Go'], ['競合', 'fallback']]
);
const phraseB = buildPhraseSnapshot(
    [['語', { reading: 'ご', romaji: 'Go' }], ['競合', { reading: 'きょうごう', romaji: 'Compound' }]],
    [['のみ', 'nomi'], ['競合', 'particle']],
    [['競合', 'fallback'], ['語', 'Fallback Go']]
);
assert.deepStrictEqual(JSON.parse(JSON.stringify(phraseA)), JSON.parse(JSON.stringify(phraseB)));
assert.strictEqual(new Map(phraseA).get('競合'), 'particle');
assert.strictEqual(new Map(phraseA).get('語'), 'Go');

console.log('Semantic data safety checks passed.');
