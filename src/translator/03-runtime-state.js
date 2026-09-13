// Source section: Mutable runtime state and shared runtime coordination.
const fallbackGrammaticalExpressionMap = Object.freeze({ 'て': 'te', 'で': 'de' });

/** @returns {CJ2RRuntimeState} */
function createRuntimeState() {
    return {
        overridesEnabled: true,
        overrides: {},
        contextOverrides: [],
        contextOverrideDictionary: new Map(),
        contextOverridePrefixes: new Set(),
        titleReadingDictionary: new Map(),
        titleReadingPrefixes: new Set(),
        kanjiDictionary: {},
        tokenizer: null,
        commonWordDictionary: new Map(),
        commonWordPrefixes: new Set(),
        commonWordInflectionDictionary: new Map(),
        commonWordInflectionPrefixes: new Set(),
        generalWordDictionary: new Map(),
        generalWordPrefixes: new Set(),
        kanaLexicalReadingDictionary: new Map(),
        kanaLexicalReadingPrefixes: new Set(),
        loanwordDictionary: new Map(),
        loanwordMetadataDictionary: new Map(),
        loanwordPrefixes: new Set(),
        compoundWordDictionary: new Map(),
        atejiDictionary: new Map(),
        atejiPrefixes: new Set(),
        properNounDictionary: new Map(),
        properNounPrefixes: new Set(),
        reviewedProperNameSpanDictionary: new Map(),
        reviewedProperNameSpanPrefixes: new Set(),
        readingEvidenceDictionary: new Map(),
        contextualReadingDictionary: new Map(),
        contextFeatureGroups: new Map(),
        reviewedReadingPreferenceDictionary: new Map(),
        reviewedReadingSpanDictionary: new Map(),
        rendakuEvidenceDictionary: new Map(),
        rendakuEvidencePrefixes: new Set(),
        historicalKanaEvidenceDictionary: new Map(),
        historicalKanaEvidencePrefixes: new Set(),
        counterDateReadingDictionary: new Map(),
        authoritativeSpanDictionary: new Map(),
        authoritativeSpanPrefixes: new Set(),
        generalKanjiVariantDictionary: new Map(),
        nameKanjiVariantDictionary: new Map(),
        japaneseHanScopeDictionary: new Map(),
        resourceWarnings: new Set(),
        developerWarnings: new Set(),
        lifecycleState: 'loading',
        failure: null,
        captureTranslationDiagnostics: false,
        lastTranslationDiagnostics: null,
        conjugationJoinEndings: new Set(['て', 'で', 'た', 'だ', 'って', 'っと', 'ん']),
        auxiliarySpacingSurfaces: new Set(['いる', 'ある', 'ござい', 'です', 'だ', 'だった', 'で', 'よ', 'ね', 'な']),
        auxiliarySpacingBasicForms: new Set(['いる', 'ある', 'ござる', 'です', 'だ']),
        contractedAuxiliaryBasicForms: new Set(['てる', 'でる']),
        capitalizedAuxiliarySurfaces: new Set(['だった']),
        particleExpressions: {},
        grammaticalExpressionDictionary: new Map(Object.entries(fallbackGrammaticalExpressionMap)),
        grammaticalExpressionPrefixes: new Set(Object.keys(fallbackGrammaticalExpressionMap)),
        knownPhrasePrefixes: new Set(Object.keys(fallbackGrammaticalExpressionMap)),
        grammaticalSurfaces: new Set(['ませ', 'ん', 'られ']),
        knownPhraseDictionary: new Map(Object.entries(fallbackGrammaticalExpressionMap))
    };
}


function addSurfacePrefixes(target, surface) {
    const characters = Array.from(String(surface || ''));
    for (let length = 1; length <= characters.length; length += 1) {
        target.add(characters.slice(0, length).join(''));
    }
}

// Mutable translator data is kept in one runtime container. The default public
// API still uses one runtime instance, but state is no longer scattered globally.
const runtimeState = createRuntimeState();

let runtimeDiagnosticsTools = null;
let runtimeDiagnosticsSnapshot = null;
let runtimeDiagnosticsExtras = {};
let runtimeDiagnosticsBridgeValue = null;

function registerRuntimeDiagnosticsTools(tools) {
    if (!tools || typeof tools !== 'object') throw new TypeError('Runtime diagnostics tools must be an object.');
    runtimeDiagnosticsTools = Object.freeze({ ...tools });
    return runtimeDiagnosticsTools;
}

function updateRuntimeDiagnostics(name, value) {
    runtimeDiagnosticsExtras[name] = value;
    if (runtimeDiagnosticsSnapshot) runtimeDiagnosticsSnapshot[name] = value;
    return value;
}

// Keep each evidence source separate. High-confidence sources must not be
// overwritten by broad fallback dictionaries.
