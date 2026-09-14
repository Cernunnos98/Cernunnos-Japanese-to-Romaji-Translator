const assert = require('assert');
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
const particles = readJson('data/grammar/particle-expressions.json');
const counters = readJson('data/grammar/counter-date-reading-evidence.json');
const readingEvidence = readJson('data/reading-evidence/reading-evidence.json');
const rendaku = readJson('data/rendaku/rendaku-evidence.json');
const historicalRaw = readJson('data/historical-kana/historical-kana-evidence.json');
const historical = Array.isArray(historicalRaw) ? historicalRaw : historicalRaw.entries;

assertNoConflicts(general, row => row[0], row => row[1], 'general-word');
assertNoConflicts(loanwords, row => Array.isArray(row) ? row[0] : row.surface, row => Array.isArray(row) ? row[1] : row.output, 'loanword');
assertNoConflicts(ateji, row => row[0], row => row[1], 'ateji');
assertNoConflicts(reviewed, row => row.surface, row => [row.reading, row.romaji, row.category], 'reviewed proper-name');
assertNoConflicts(particles, row => row.surface, row => row.romaji, 'particle expression');
assertNoConflicts(counters, row => row.surface, row => [row.reading, row.romaji], 'counter/date');
assertNoConflicts(readingEvidence, row => row.surface, row => [row.preferredReading, row.alternatives], 'reading evidence');
assertNoConflicts(rendaku, row => row.surface, row => [row.reading, row.rendaku, row.source], 'Rendaku evidence');
assertNoConflicts(historical, row => row.surface, row => [row.reading, row.pos, row.source], 'historical-kana evidence');


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
