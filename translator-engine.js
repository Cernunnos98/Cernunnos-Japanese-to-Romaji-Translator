// Generated browser engine. Edit src/translator/*.js, not this file.
// Rebuild with: node tools/build-translator-engine.js
(function () {
    'use strict';
    const ENGINE_INSTANCE_SYMBOL = Symbol.for('CJ2R.translator.engine.instance');
    const RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL = Symbol.for('CJ2R.translator.runtime-diagnostics.bridge');
    const ENGINE_INSTANCE_TOKEN = Object.freeze({});
    if (window[ENGINE_INSTANCE_SYMBOL]) return;
    window[ENGINE_INSTANCE_SYMBOL] = ENGINE_INSTANCE_TOKEN;
    try {
// Source section: Shared JSDoc contracts for translator internals.
// This file contains type contracts only and has no runtime behaviour.

/**
 * Token object used throughout the translation pipeline. Kuromoji fields are
 * retained alongside explicit CJ2R annotations added by merge/repair stages.
 * @typedef {{
 *   surface_form: string,
 *   pos?: string, pos_detail_1?: string, pos_detail_2?: string, pos_detail_3?: string,
 *   basic_form?: string, reading?: string|null, pronunciation?: string|null,
 *   conjugated_form?: string, conjugated_type?: string, word_position?: number,
 *   sourceStart?: number, sourceEnd?: number, sourceSurface?: string, sourceGapBefore?: string, derivedSpan?: boolean, semanticAnnotationOwnership?: CJ2RSemanticAnnotationOwnership[],
 *   sourceSpanReconciled?: boolean, sourceSpanReconciliationReason?: string, sourceSpanGrammarBoundary?: boolean, sourceSpanGrammarBoundaryBefore?: boolean, sourceSpanLexicalBoundaryRelease?: boolean,
 *   outputBoundaryBefore?: 'none'|'space'|'join'|'tight'|'apostrophe', outputBoundaryReason?: string, outputBoundaryAuthority?: string, outputBoundaryRequiresReview?: boolean,
 *   value?: string,
 *   particle?: boolean, prefix?: boolean, suffix?: boolean, nominalizer?: boolean, grammatical?: boolean,
 *   fullGrammaticalExpression?: boolean, titleSeparator?: boolean, crossNotationSymbol?: boolean, censorshipMarker?: boolean, nameContinuation?: boolean, nameGivenStart?: boolean, canonicalBoundary?: boolean, hardBoundaryReconstructed?: boolean,
 *   morphologicalJoinLeft?: boolean, morphologicalJoinReason?: string, morphologicalJoinAuthority?: string, joinLeftAfterSokuon?: boolean, startsSeparateAuxiliaryUnit?: boolean, tokenizationRoleBoundaryBefore?: boolean, tokenizationRoleRepair?: string, sourceAuthorityBoundaryBefore?: boolean, sourceAuthorityBoundarySource?: string,
 *   numericExpression?: boolean, ideographicDecimalNotationMatched?: boolean, ideographicDecimalCanonicalDigits?: string,
 *   contextualOverrideMatched?: boolean, contextualRomaji?: string,
 *   titleReadingEvidenceMatched?: boolean, titleReadingEvidenceReading?: string|null, titleReadingEvidenceRomaji?: string|null, titleReadingEvidenceKind?: string, titleReadingEvidenceSource?: string,
 *   sourceSpanLexicalCandidateMatched?: boolean, sourceSpanLexicalCandidateReading?: string|null, sourceSpanLexicalCandidateRomaji?: string|null, sourceSpanLexicalCandidateKind?: string, sourceSpanLexicalCandidateSource?: string, sourceSpanLexicalCandidateConfidence?: number|null, sourceSpanLexicalCandidateReviewRequired?: boolean,
 *   sourceOrthographyEvidenceMatched?: boolean, sourceOrthographyOriginalSurfaces?: string[], sourceOrthographyProperNounCandidates?: CJ2RReadingCandidate[], sourceOrthographyGeneralWordCandidates?: CJ2RReadingCandidate[], sourceOrthographyGeneralWordCoverageIncomplete?: boolean,
 *   sourceOrthographyPersonNameRoleMatched?: boolean, sourceOrthographyEquivalentPersonNameRoleMatched?: boolean,
 *   reviewedProperNameSpanMatched?: boolean, reviewedProperNameSpanRomaji?: string|null, reviewedProperNameLexicalCollision?: boolean, reviewedProperNameLexicalReading?: string|null, sourceOrthographyCanonicalLexicalReviewRequired?: boolean, sourceOrthographyExactFullPersonNameRoleMatched?: boolean, sourceOrthographyCorroboratedVariantFullPersonNameRoleMatched?: boolean,
 *   reviewedNameHonorificMatched?: boolean, reviewedNameHonorificReading?: string|null,
 *   typedTemporalExpressionMatched?: boolean, typedTemporalExpressionType?: string, typedTemporalReading?: string|null, typedTemporalSource?: string, typedTemporalRoleState?: string|null, typedTemporalRoleSource?: string|null, typedTemporalRoleReviewRequired?: boolean, typedTemporalRoleAlternatives?: string[], typedTemporalSpanLexicalCollision?: any, typedTemporalSuffix?: boolean,
 *   typedNumericExpressionMatched?: boolean, typedNumericExpressionType?: string, typedNumericReading?: string|null, typedNumericSource?: string, typedNumericRoleSelected?: boolean, typedNumericRole?: string|null, typedNumericRoleState?: string|null, typedNumericRoleSource?: string|null, typedNumericRoleReviewRequired?: boolean, typedNumericRoleAlternatives?: string[],
 *   structuredFractionRole?: string, structuredFractionReading?: string|null, structuredFractionSource?: string,
 *   orthographicParticleInferred?: boolean, orthographicParticleCanonicalSurface?: string, orthographicParticleEvidenceSource?: string, orthographicParticleReviewRequired?: boolean,
 *   authoritativeSpanMatched?: boolean, authoritativeSpanCategory?: string, authoritativeSpanReading?: string|null, authoritativeSpanRomaji?: string|null, authoritativeSpanSource?: string, authoritativeSpanConfidence?: number, authoritativeSpanReviewRequired?: boolean, authoritativeSpanReviewReason?: string|null, authoritativeSpanReviewFlag?: string|null, authoritativeSpanAlternatives?: string[], authoritativeSpanVariantMappings?: any[],
 *   reviewedNumericAliasMatched?: boolean, reviewedNumericAliasReading?: string|null, reviewedNumericAliasRomaji?: string|null, reviewedNumericAliasSource?: string,
 *   variantProperNounMatched?: boolean, variantCanonicalRetokenized?: boolean, variantOriginalSurface?: string, variantLookupSurface?: string, variantMappings?: any[],
 *   latinPassthroughMatched?: boolean, latinPassthroughOutput?: string,
 *   knownPhraseMatched?: boolean, knownPhraseValue?: string, knownPhraseSource?: string,
 *   loanwordMatched?: boolean, loanwordOutput?: string, suppressLoanwordSourceSpelling?: boolean, countryLanguageReviewRequired?: boolean,
 *   contextualLoanwordEvidenceMatched?: boolean, contextualLoanwordEvidenceOutput?: string|null, contextualLoanwordEvidenceSource?: string, contextualLoanwordEvidenceScore?: number, contextualLoanwordEvidenceMargin?: number, contextualLoanwordEvidenceAmbiguous?: boolean, contextualLoanwordEvidenceCandidates?: CJ2RReadingCandidate[],
 *   commonWordMatched?: boolean, commonWordReading?: string|null, commonWordRomaji?: string|null, reviewedTokenReadingAuthorityMatched?: boolean, reviewedTokenReadingAuthorityReading?: string|null, reviewedTokenReadingAuthoritySurface?: string|null, reviewedTokenReadingAuthoritySource?: string|null,
 *   contextualReadingEvidenceMatched?: boolean, contextualReadingEvidenceReading?: string|null, contextualReadingEvidenceRomaji?: string|null, contextualReadingEvidenceSource?: string, contextualReadingEvidenceScore?: number, contextualReadingEvidenceMargin?: number, contextualReadingEvidenceAmbiguous?: boolean, contextualReadingEvidenceCandidates?: CJ2RReadingCandidate[],
 *   historicalKanaEvidenceMatched?: boolean, historicalKanaEvidenceReading?: string|null,
 *   rendakuEvidenceMatched?: boolean, rendakuEvidenceReading?: string|null, rendakuApplied?: boolean,
 *   exactDictionaryRescueMatched?: boolean, exactDictionaryRescueSource?: string, exactDictionaryRescueConfidence?: number,
 *   kanaLexicalSpanMatched?: boolean, kanaLexicalSpanReading?: string|null, kanaLexicalSpanEvidenceStrength?: 'strong'|'weak',
 *   atejiMatched?: boolean, atejiReading?: string|null,
 *   generalWordMatched?: boolean, generalWordReading?: string|null, generalWordAmbiguous?: boolean, generalWordCoverageIncomplete?: boolean, generalWordCandidates?: CJ2RReadingCandidate[], generalWordVariantMappings?: any[],
 *   ordinaryCompoundReadingMatched?: boolean, ordinaryCompoundReading?: string|null, ordinaryCompoundReadingCandidates?: CJ2RReadingCandidate[],
 *   postCensorshipOrdinaryLexicalMatched?: boolean, postCensorshipOrdinaryLexicalReading?: string|null, postCensorshipOrdinaryLexicalCandidates?: CJ2RReadingCandidate[],
 *   structuralRoleReadingMatched?: boolean, structuralRoleReading?: string|null, structuralRoleReadingCandidates?: CJ2RReadingCandidate[], structuralPrefixRoleMatched?: boolean, structuralSuffixRoleMatched?: boolean,
 *   iterationMarkFallbackMatched?: boolean, iterationMarkFallbackReading?: string|null,
 *   nameContextAmbiguous?: boolean, nameContextSurname?: string, nameContextBase?: string, nameContextStructure?: string, nameContextCandidateSurface?: string, nameContextSourceStart?: number, nameContextSourceEnd?: number, nameContextSourceSurface?: string,
 *   nameHonorificRoleMatched?: boolean, nameHonorificCandidateSurface?: string, locationSuffixRoleMatched?: boolean, locationSuffixContextMatched?: boolean,
 *   readingResolution?: CJ2RReadingResolution,
 *   getReading?: (() => string|null)|undefined
 * }} CJ2RToken
 */
/** @typedef {{annotations: string[], sourceStart: number|null, sourceEnd: number|null, sourceSurface: string|null, evidenceSource: string, semanticRole: string, confidence: number|null, reviewRequired: boolean|null}} CJ2RSemanticAnnotationOwnership */
/** @typedef {{reading?: string, romaji?: string, weight?: number, rank?: number|null, popularityScore?: number, retained?: boolean, categories?: Iterable<string>, sources?: Iterable<string>}} CJ2RReadingCandidate */
/** @typedef {{id: string, sourceStart: number, sourceEnd: number, sourceSurface: string, lookupSurface: string, category: string, kind: string, semanticRole: string, evidenceSource: string, reading: string|null, romaji: string|null, confidence: number|null, reviewRequired: boolean|null, selectionState: 'unselected', alternatives: any[], metadata: Record<string, any>}} CJ2RSourceSpanCandidate */
/** @typedef {{surface: string, reading: string|null, romaji: string|null, source: string, confidence: number, candidates: CJ2RReadingCandidate[], flags: string[], variantMappings: any[], ambiguous: boolean, hanScope?: string|null, scopeEvidence?: any[], reviewSignals: CJ2RReviewSignal[]}} CJ2RReadingResolution */
/** @typedef {'candidate'|'active'|'resolved'|'superseded'|'final-active'} CJ2RReviewSignalState */
/** @typedef {{surface: string, flag: string, reasonCode: string, source: string, evidenceSource: string, confidence: number, category: string, sourceStart: number|null, sourceEnd: number|null, sourceSurface: string|null, policyRequiresReview: boolean, requiresReview: boolean, rationale: string, state: CJ2RReviewSignalState, lifecycle: CJ2RReviewSignalState[], resolutionReason?: string|null, supersededBy?: string|null}} CJ2RReviewSignal */
/** @typedef {{requiresReview: boolean, resolvedOutputRequiresReview: boolean, literalUnresolved: number, hasLiteralUnresolved: boolean, unresolvedJapaneseReadings: number, unresolvedJapaneseHan: number, outOfScopeInput: number, unknownJapaneseScopeStatus: number}} CJ2RAuditStatistics */
/** @typedef {{sourceText: string, normalizedSourceText: string, output: string, readings: any[], sourceCounts: Record<string, number>, redFlags: CJ2RReviewSignal[], sourceSpanCandidates?: CJ2RSourceSpanCandidate[], sourceSpanCandidateCounts?: Record<string, number>, sourceSpanCandidateValidation?: {valid: boolean, violations: any[]}, structuralValidation?: {valid: boolean, violations: any[]}, requiresReview: boolean, statistics: CJ2RAuditStatistics}} CJ2RTranslationDiagnostics */
/** @typedef {{field: Element|string, button: Element|string, output?: Element|string|null, overridesEnabled?: boolean}} CJ2RBindingOptions */

/** @typedef {{tokenize: (text: string) => CJ2RToken[], viterbi_builder?: any, token_info_dictionary?: any}} CJ2RTokenizer */
/** @typedef {{failures?: any[], rule?: string, [key: string]: any}} CJ2RRegressionReport */
/**
 * Mutable state owned by one translator engine instance.
 * @typedef {{
 *   overridesEnabled: boolean, overrides: Record<string, string>, contextOverrides: any[], contextOverrideDictionary: Map<string, any[]>, contextOverridePrefixes: Set<string>,
 *   titleReadingDictionary: Map<string, any>, titleReadingPrefixes: Set<string>, kanjiDictionary: Record<string, {on: string[], kun: string[]}>, tokenizer: CJ2RTokenizer|null,
 *   commonWordDictionary: Map<string, any>, commonWordPrefixes: Set<string>, commonWordInflectionDictionary: Map<string, any>, commonWordInflectionPrefixes: Set<string>,
 *   generalWordDictionary: Map<string, any>, generalWordPrefixes: Set<string>, kanaLexicalReadingDictionary: Map<string, any>, kanaLexicalReadingPrefixes: Set<string>,
 *   loanwordDictionary: Map<string, any>, loanwordMetadataDictionary: Map<string, any>, loanwordPrefixes: Set<string>, compoundWordDictionary: Map<string, any>, compoundWordPrefixes: Set<string>, atejiDictionary: Map<string, any>, atejiPrefixes: Set<string>,
 *   properNounDictionary: Map<string, any>, properNounPrefixes: Set<string>, properNounVariantEvidenceSurfaces: Map<string, Set<string>>, properNounVariantEvidencePrefixes: Set<string>, reviewedProperNameSpanDictionary: Map<string, any>, reviewedProperNameSpanPrefixes: Set<string>,
 *   readingEvidenceDictionary: Map<string, any>, contextualReadingDictionary: Map<string, any>, contextFeatureGroups: Map<string, any>, reviewedReadingPreferenceDictionary: Map<string, any>, reviewedReadingSpanDictionary: Map<string, any>,
 *   rendakuEvidenceDictionary: Map<string, any>, rendakuEvidencePrefixes: Set<string>, historicalKanaEvidenceDictionary: Map<string, any>, historicalKanaEvidencePrefixes: Set<string>, counterDateReadingDictionary: Map<string, any>, counterDateReadingPrefixes: Set<string>,
 *   authoritativeSpanDictionary: Map<string, any>, authoritativeSpanPrefixes: Set<string>, generalKanjiVariantDictionary: Map<string, string>, nameKanjiVariantDictionary: Map<string, string>, japaneseHanScopeDictionary: Map<string, any>,
 *   resourceWarnings: Set<string>, developerWarnings: Set<string>, lifecycleState: 'loading'|'ready'|'failed'|'destroyed', failure: Error|null, captureTranslationDiagnostics: boolean, lastTranslationDiagnostics: CJ2RTranslationDiagnostics|null,
 *   conjugationJoinEndings: Set<string>, auxiliarySpacingSurfaces: Set<string>, auxiliarySpacingBasicForms: Set<string>, contractedAuxiliaryBasicForms: Set<string>, capitalizedAuxiliarySurfaces: Set<string>,
 *   particleExpressions: Record<string, string>, grammaticalExpressionDictionary: Map<string, string>, grammaticalExpressionPrefixes: Set<string>, knownPhrasePrefixes: Set<string>, grammaticalSurfaces: Set<string>, knownPhraseDictionary: Map<string, string>
 * }} CJ2RRuntimeState
 */

// Source section: Asset paths, criticality and schema contracts.
// Rule 0: Romaji Rules is authoritative for every translation decision.
// Data, code and regression expectations must follow the guide rather than redefine it.

const translatorRuntimeConfig = window.CJ2R_TRANSLATOR_CONFIG && typeof window.CJ2R_TRANSLATOR_CONFIG === 'object'
    ? window.CJ2R_TRANSLATOR_CONFIG
    : {};

// Resolve assets from an explicit package base when one is configured.
const engineScriptElement = /** @type {HTMLScriptElement|null} */ (document.currentScript);

function resolveConfiguredAssetBaseUrl(value, baseUrl = document.baseURI) {
    if (typeof value !== 'string' || !value.trim()) return null;
    // The base is trusted deployment configuration, but active schemes, embedded credentials and HTTPS downgrades are never valid asset locations.
    const resolved = new URL(value.trim().replace(/\/?$/, '/'), baseUrl);
    const pageUrl = new URL(baseUrl);
    const allowedProtocol = resolved.protocol === 'https:'
        || resolved.protocol === 'http:'
        || (resolved.protocol === 'file:' && pageUrl.protocol === 'file:');
    if (!allowedProtocol) throw new Error(`Unsupported assetBaseUrl protocol: ${resolved.protocol}`);
    if (resolved.username || resolved.password) throw new Error('assetBaseUrl must not contain embedded credentials.');
    if (pageUrl.protocol === 'https:' && resolved.protocol === 'http:') {
        throw new Error('assetBaseUrl must not downgrade an HTTPS page to HTTP assets.');
    }
    return resolved.href;
}

const configuredAssetBase = resolveConfiguredAssetBaseUrl(translatorRuntimeConfig.assetBaseUrl);
const engineBaseUrl = configuredAssetBase || (engineScriptElement && engineScriptElement.src
    ? new URL('.', engineScriptElement.src).href
    : new URL('.', document.baseURI).href);
const engineScriptNonce = engineScriptElement?.nonce || engineScriptElement?.getAttribute?.('nonce') || '';

function assetUrl(relativePath) {
    return new URL(relativePath, engineBaseUrl).href;
}

function kuromojiDictionaryPath() {
    return assetUrl(getAssetPath('kuromojiDictionary'));
}

// Runtime diagnostics are development-only and must be explicitly enabled by the host.
const ENABLE_RUNTIME_DIAGNOSTICS = translatorRuntimeConfig.runtimeDiagnostics === true;

function runtimeDuration(name, fallback) {
    const value = Number(translatorRuntimeConfig[name]);
    return Number.isFinite(value) && value > 0 ? value : fallback;
}

function runtimeRetryCount(name, fallback, maximum = 3) {
    const value = Number(translatorRuntimeConfig[name]);
    return Number.isInteger(value) && value >= 0 ? Math.min(value, maximum) : fallback;
}

const RUNTIME_FETCH_TIMEOUT_MS = runtimeDuration('assetTimeoutMs', 15000);
const RUNTIME_SCRIPT_TIMEOUT_MS = runtimeDuration('scriptTimeoutMs', 15000);
const RUNTIME_TOKENIZER_TIMEOUT_MS = runtimeDuration('tokenizerTimeoutMs', 60000);
const RUNTIME_RETRY_DELAY_MS = runtimeDuration('retryDelayMs', 250);
const RUNTIME_RETRY_MAX_DELAY_MS = Math.max(RUNTIME_RETRY_DELAY_MS, runtimeDuration('retryMaxDelayMs', 1000));
// Transient retries use bounded exponential backoff so brief network faults recover without turning permanent failures into indefinite startup waits.
const RUNTIME_TRANSIENT_RETRIES = runtimeRetryCount('assetRetryCount', 2);

function runtimeRetryDelay(attempt) {
    return Math.min(RUNTIME_RETRY_DELAY_MS * (2 ** Math.max(0, attempt)), RUNTIME_RETRY_MAX_DELAY_MS);
}

function waitRuntimeDelay(attempt) {
    return new Promise(resolve => setTimeout(resolve, runtimeRetryDelay(attempt)));
}

function isTransientHttpStatus(status) {
    return status === 408 || status === 425 || status === 429 || (status >= 500 && status <= 599);
}

async function fetchAssetResponse(url) {
    let lastError = null;
    for (let attempt = 0; attempt <= RUNTIME_TRANSIENT_RETRIES; attempt += 1) {
        const controller = typeof AbortController === 'function' ? new AbortController() : null;
        let timedOut = false;
        let timer = null;
        const timeout = new Promise((_, reject) => {
            timer = setTimeout(() => {
                timedOut = true;
                if (controller) controller.abort();
                const error = new Error(`Asset request timed out after ${RUNTIME_FETCH_TIMEOUT_MS} ms`);
                error.transient = true;
                reject(error);
            }, RUNTIME_FETCH_TIMEOUT_MS);
        });
        try {
            const request = controller ? fetch(url, { signal: controller.signal }) : fetch(url);
            const response = await Promise.race([request, timeout]);
            if (!response.ok) {
                const error = new Error(`HTTP ${response.status}`);
                error.transient = isTransientHttpStatus(response.status);
                throw error;
            }
            return response;
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));
            if (timedOut) lastError.transient = true;
            else if (typeof lastError.transient !== 'boolean') lastError.transient = true;
            if (!lastError.transient || attempt >= RUNTIME_TRANSIENT_RETRIES) throw lastError;
            await waitRuntimeDelay(attempt);
        } finally {
            if (timer) clearTimeout(timer);
        }
    }
    throw lastError || new Error('Asset request failed.');
}

function loadScriptOnce(url, options = {}) {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        let settled = false;
        /** @param {Error|null} [error] */
        const finish = (error = null) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            script.onload = null;
            script.onerror = null;
            if (error) {
                script.remove();
                reject(error);
            } else resolve(script);
        };
        const timer = setTimeout(() => finish(new Error(`Script load timed out after ${RUNTIME_SCRIPT_TIMEOUT_MS} ms`)), RUNTIME_SCRIPT_TIMEOUT_MS);
        script.src = url;
        if (engineScriptNonce) script.nonce = engineScriptNonce;
        if (options.async) script.async = true;
        script.onload = () => finish();
        script.onerror = () => finish(new Error(`Unable to load script: ${url}`));
        document.head.appendChild(script);
    });
}

async function loadScriptWithRetry(url, options = {}) {
    let lastError = null;
    for (let attempt = 0; attempt <= RUNTIME_TRANSIENT_RETRIES; attempt += 1) {
        try { return await loadScriptOnce(url, options); }
        catch (error) {
            lastError = error;
            if (attempt >= RUNTIME_TRANSIENT_RETRIES) break;
            await waitRuntimeDelay(attempt);
        }
    }
    throw lastError || new Error(`Unable to load script: ${url}`);
}

function validateKuromojiApi(kuromojiApi) {
    if (!kuromojiApi || typeof kuromojiApi.builder !== 'function') {
        throw new Error('Incompatible Kuromoji API: builder() is unavailable.');
    }
    return kuromojiApi;
}

function validateKuromojiTokenizer(tokenizer) {
    const trie = tokenizer?.viterbi_builder?.trie;
    const dictionary = tokenizer?.token_info_dictionary;
    if (typeof tokenizer?.tokenize !== 'function') {
        throw new Error('Incompatible Kuromoji tokenizer: tokenize() is unavailable.');
    }
    if (!trie || typeof trie.lookup !== 'function' || typeof trie.commonPrefixSearch !== 'function') {
        throw new Error('Incompatible Kuromoji tokenizer: dictionary trie lookup/prefix search is unavailable.');
    }
    if (!dictionary || typeof dictionary.getFeatures !== 'function' || !dictionary.target_map || typeof dictionary.target_map !== 'object') {
        throw new Error('Incompatible Kuromoji tokenizer: token dictionary hooks are unavailable.');
    }
    return tokenizer;
}

async function settleStartedJobs(jobs) {
    const results = await Promise.allSettled(jobs);
    const rejected = results.find(result => result.status === 'rejected');
    if (rejected) throw rejected.reason;
    return results.map(result => result.status === 'fulfilled' ? result.value : undefined);
}

const ASSET_CRITICALITY = Object.freeze({
    CRITICAL: 'critical',
    OPTIONAL: 'optional',
    DEVELOPER: 'developer-only'
});

// Runtime assets live here so paths, schema and failure policy stay in one place.
const translatorAssets = Object.freeze({
    kuromojiScript: { paths: ['kuromoji.js'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'script' },
    kuromojiDictionary: { paths: ['data/dict/'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'dictionary-bundle' },
    exactOverrides: { paths: ['data/Overrides/overrides.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'exact-overrides-v1' },
    contextOverrides: { paths: ['data/Overrides/context-overrides.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'context-overrides-v1' },
    titleReadingEvidence: { paths: ['data/title-readings/title-reading-evidence.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'title-reading-evidence-v1' },
    kanjiBanks: { paths: ['data/kanji/kanji-bank-1.json', 'data/kanji/kanji-bank-2.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'kanji-bank-v1' },
    kanjiVariants: { paths: ['data/kanji/kanji-variants.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'kanji-variants-v1' },
    japaneseHanScope: { paths: ['data/kanji/japanese-han-scope.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'japanese-han-scope-v1' },
    commonWords: { paths: ['data/common-words/common-words-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'common-word-bank-v1' },
    generalWords: { paths: ['data/general-words/general-words-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'general-word-bank-v2' },
    loanwords: { paths: ['data/loanwords/loanwords-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'loanword-bank-v2' },
    compoundWords: { paths: ['data/compound-words/compound-words-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'compound-word-bank-v1' },
    ateji: { paths: ['data/ateji/ateji-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'ateji-bank-v1' },
    properNouns: { paths: ['data/nouns/nouns-term-bank-1.json', 'data/nouns/jmnedict-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'proper-noun-bank-v1' },
    reviewedProperNameSpans: { paths: ['data/nouns/reviewed-proper-name-span-evidence.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'reviewed-proper-name-span-evidence-v1' },
    particleExpressions: { paths: ['data/grammar/particle-expressions.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'particle-expressions-v1' },
    conjugationPatterns: { paths: ['data/grammar/conjugation-patterns.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'conjugation-patterns-v1' },
    counterDateEvidence: { paths: ['data/grammar/counter-date-reading-evidence.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'counter-date-reading-evidence-v1' },
    readingEvidence: { paths: ['data/reading-evidence/reading-evidence.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'reading-evidence-v1' },
    contextualReadingEvidence: { paths: ['data/reading-evidence/contextual-reading-evidence.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'contextual-reading-evidence-v1' },
    reviewedReadingEvidence: { paths: ['data/reviewed-reading/reviewed-reading-evidence.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'reviewed-reading-evidence-v1' },
    rendakuEvidence: { paths: ['data/rendaku/rendaku-evidence.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'rendaku-evidence-v1' },
    historicalKanaEvidence: { paths: ['data/historical-kana/historical-kana-evidence.json'], criticality: ASSET_CRITICALITY.OPTIONAL, type: 'json', schema: 'historical-kana-evidence-v1' },
    runtimeDiagnostics: { paths: ['tools/qa/translator-qa.js'], criticality: ASSET_CRITICALITY.DEVELOPER, type: 'script' }
});

function getAssetDefinition(key) {
    const definition = translatorAssets[key];
    if (!definition) throw new Error(`Unknown translator asset: ${key}`);
    return definition;
}

function getAssetPaths(key) { return getAssetDefinition(key).paths; }
function getAssetPath(key, index = 0) { return getAssetPaths(key)[index]; }

function isPlainObject(value) { return Boolean(value) && typeof value === 'object' && !Array.isArray(value); }
function isText(value) { return typeof value === 'string' && Boolean(value.trim()); }
function isTextArray(value) { return Array.isArray(value) && value.length > 0 && value.every(isText); }
function isNonEmptyRowBank(data, validateRow) { return Array.isArray(data) && data.length > 0 && data.every(validateRow); }

function normalizeEvidenceReading(value) {
    return String(value || '').normalize('NFKC').trim();
}

function isSemanticKanaReading(value) {
    const reading = normalizeEvidenceReading(value);
    return Boolean(reading) && /^[ぁ-ゖァ-ヺー]+$/u.test(reading);
}

function normalizeReviewedRomaji(value) {
    return String(value || '').normalize('NFKC').trim().replace(/\s+/gu, ' ');
}

function isRule0RomajiEvidence(value) {
    const output = normalizeReviewedRomaji(value);
    return Boolean(output)
        && /[A-Za-z0-9]/u.test(output)
        && /^[\x20-\x7E]+$/u.test(output)
        && !/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/u.test(output)
        && !/[ĀĒĪŌŪāēīōū]/u.test(output)
        && !/[。、？！「」『』【】〔〕・～〜]/u.test(output)
        && !/[\u0000-\u001F\u007F]/u.test(output)
        && !output.includes('[Unresolved]');
}

function isSafeReviewedPattern(patternText) {
    const text = String(patternText || '').trim();
    if (!text || text.length > 512 || /[\u0000-\u001F\u007F]/u.test(text)) return false;
    // Reviewed patterns do not need unbounded repetition, backreferences or lookbehind.
    if (/(^|[^\\])(?:\\\\)*[+*{}]/u.test(text)) return false;
    if (/\\[1-9]|\\k<|\(\?<=[^)]|\(\?<!/u.test(text)) return false;
    try { new RegExp(text, 'u'); }
    catch (_) { return false; }

    const stack = [];
    let inClass = false;
    let escaped = false;
    for (let index = 0; index < text.length; index += 1) {
        const char = text[index];
        if (escaped) { escaped = false; continue; }
        if (char === '\\') { escaped = true; continue; }
        if (char === '[') { inClass = true; continue; }
        if (char === ']' && inClass) { inClass = false; continue; }
        if (inClass) continue;
        if (char === '(') {
            const special = text.slice(index, index + 3);
            if (text[index + 1] === '?' && !['(?:', '(?='].includes(special)) return false;
            stack.push({ hasQuantifier: false, hasAlternation: false });
            continue;
        }
        if (char === '|') {
            if (stack.length) stack[stack.length - 1].hasAlternation = true;
            continue;
        }
        if (char !== ')') {
            if (char === '?' && stack.length && !['?:', '?='].includes(text.slice(index, index + 2))) {
                stack[stack.length - 1].hasQuantifier = true;
            }
            continue;
        }
        const group = stack.pop();
        if (!group) return false;
        const next = text[index + 1];
        if (next === '?' && (group.hasQuantifier || group.hasAlternation)) return false;
        if (stack.length && (group.hasQuantifier || next === '?')) stack[stack.length - 1].hasQuantifier = true;
    }
    return !stack.length && !inClass && !escaped;
}

function compileReviewedPattern(patternText, flags = '') {
    const text = String(patternText || '').trim();
    if (!isSafeReviewedPattern(text)) throw new Error(`Unsafe reviewed regex pattern: ${text}`);
    return new RegExp(text, flags);
}

function hasNoConflictingRows(data, keySelector, valueSelector) {
    const seen = new Map();
    for (const row of data || []) {
        const key = String(keySelector(row) || '').trim();
        if (!key) continue;
        const value = JSON.stringify(valueSelector(row));
        if (seen.has(key) && seen.get(key) !== value) return false;
        seen.set(key, value);
    }
    return true;
}

function hasUniqueCounterDateKeys(data) {
    const seen = new Set();
    for (const entry of data || []) {
        for (const key of [entry?.surface, ...(entry?.aliases || [])]) {
            const normalized = String(key || '').trim();
            if (!normalized || seen.has(normalized)) return false;
            seen.add(normalized);
        }
    }
    return true;
}

function isWeightedContextTerms(terms) {
    return Array.isArray(terms) && terms.length > 0
        && terms.every(item => isPlainObject(item) && isText(item.term)
            && Number.isFinite(Number(item.weight)) && Number(item.weight) > 0);
}

function isLoanwordAlternate(item) {
    return isPlainObject(item)
        && isRule0RomajiEvidence(item.output)
        && ['incidental', 'material'].includes(String(item.significance || ''));
}

function isLoanwordContextEvidence(context, allowedOutputs) {
    if (!isPlainObject(context)
        || !Number.isInteger(Number(context.window)) || Number(context.window) < 1 || Number(context.window) > 12
        || !Number.isFinite(Number(context.minMargin)) || Number(context.minMargin) < 0
        || !isText(context.source)
        || !Array.isArray(context.candidates) || context.candidates.length < 1) return false;
    const seen = new Set();
    for (const candidate of context.candidates) {
        if (!isPlainObject(candidate) || !isRule0RomajiEvidence(candidate.output)
            || !allowedOutputs.has(normalizeReviewedRomaji(candidate.output))
            || !isWeightedContextTerms(candidate.terms)
            || !Number.isFinite(Number(candidate.minScore)) || Number(candidate.minScore) <= 0) return false;
        const key = normalizeReviewedRomaji(candidate.output);
        if (seen.has(key)) return false;
        seen.add(key);
    }
    return true;
}

function isValidCountryLanguageLoanwordEntry(entry, hasOutput) {
    if (String(entry?.category || '') !== 'country-language') return true;
    return hasOutput
        && String(entry.surface || '').length > 1
        && String(entry.surface || '').endsWith('語')
        && normalizeReviewedRomaji(entry.output).endsWith('-go');
}

function isLoanwordBankEntryV2(entry) {
    if (Array.isArray(entry)) return isText(entry[0]) && isRule0RomajiEvidence(entry[1]);
    if (!isPlainObject(entry) || !isText(entry.surface)) return false;
    const hasOutput = isRule0RomajiEvidence(entry.output);
    const reviewOnly = entry.output == null && entry.requiresReview === true && isText(entry.reviewReason);
    if (!hasOutput && !reviewOnly) return false;
    if (entry.category != null && !isText(entry.category)) return false;
    if (!isValidCountryLanguageLoanwordEntry(entry, hasOutput)) return false;
    if (entry.requiresReview != null && typeof entry.requiresReview !== 'boolean') return false;
    if (entry.reviewReason != null && !isText(entry.reviewReason)) return false;
    if (entry.ambiguitySignificance != null && !['none', 'incidental', 'material'].includes(String(entry.ambiguitySignificance))) return false;
    const alternates = entry.alternates == null ? [] : entry.alternates;
    if (!Array.isArray(alternates) || !alternates.every(isLoanwordAlternate)) return false;
    if (hasOutput) {
        const canonical = normalizeReviewedRomaji(entry.output);
        const seen = new Set([canonical]);
        for (const alternate of alternates) {
            const output = normalizeReviewedRomaji(alternate.output);
            if (seen.has(output)) return false;
            seen.add(output);
        }
        const materialAlternate = alternates.some(item => item.significance === 'material');
        if (materialAlternate && entry.ambiguitySignificance === 'incidental') return false;
        if (entry.requiresReview === true && !isText(entry.reviewReason)) return false;
        if (entry.context != null && !isLoanwordContextEvidence(entry.context, seen)) return false;
    } else if (alternates.length || entry.context != null || entry.ambiguitySignificance != null) {
        return false;
    }
    return true;
}

function isContextualReadingEvidence(data) {
    if (!isPlainObject(data) || data.version !== 1 || !Array.isArray(data.featureGroups) || !Array.isArray(data.entries)) return false;
    const featureIds = new Set();
    for (const group of data.featureGroups) {
        if (!isPlainObject(group) || !isText(group.id) || featureIds.has(group.id) || !Array.isArray(group.terms) || !group.terms.length) return false;
        featureIds.add(group.id);
        if (!group.terms.every(item => isPlainObject(item) && isText(item.term) && Number.isFinite(Number(item.weight)) && Number(item.weight) > 0)) return false;
    }
    return data.entries.length > 0 && data.entries.every(entry => isPlainObject(entry)
        && isText(entry.surface)
        && Number.isInteger(Number(entry.window)) && Number(entry.window) >= 1 && Number(entry.window) <= 12
        && Number.isFinite(Number(entry.minMargin)) && Number(entry.minMargin) >= 0
        && isText(entry.source)
        && Array.isArray(entry.candidates) && entry.candidates.length >= 2
        && entry.candidates.every(candidate => isPlainObject(candidate)
            && isSemanticKanaReading(candidate.reading)
            && Array.isArray(candidate.features) && candidate.features.length > 0
            && candidate.features.every(feature => featureIds.has(feature))
            && Number.isFinite(Number(candidate.minScore)) && Number(candidate.minScore) > 0)
        && new Set(entry.candidates.map(candidate => normalizeEvidenceReading(candidate.reading))).size === entry.candidates.length);
}

const assetSchemaValidators = Object.freeze({
    'exact-overrides-v1': data => isPlainObject(data)
        && Object.entries(data).every(([key, value]) => key.startsWith('_') ? isText(value) : isRule0RomajiEvidence(value)),
    'context-overrides-v1': data => Array.isArray(data)
        && data.every(entry => isPlainObject(entry) && isText(entry.pattern) && isSafeReviewedPattern(entry.pattern) && isText(entry.surface) && isText(entry.romaji)),
    'title-reading-evidence-v1': data => isNonEmptyRowBank(data, entry => isPlainObject(entry)
        && isText(entry.pattern) && isSafeReviewedPattern(entry.pattern) && isText(entry.surface)
        && (entry.reading == null || isSemanticKanaReading(entry.reading))
        && (String(entry.kind || '') === 'title-separator-silent' ? entry.romaji === '' : isRule0RomajiEvidence(entry.romaji))
        && isText(entry.kind) && isText(entry.source)),
    'kanji-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry)
        && Array.from(String(entry[0] || '')).length === 1
        && typeof entry[1] === 'string'
        && typeof entry[2] === 'string'),
    'kanji-variants-v1': data => isPlainObject(data) && isPlainObject(data.general) && isPlainObject(data.names),
    'japanese-han-scope-v1': data => isPlainObject(data) && isPlainObject(data._meta) && Number(data._meta.version) === 1
        && Array.isArray(data.entries) && data.entries.length > 0
        && data.entries.every(entry => isPlainObject(entry)
            && isHanCharacter(entry.character)
            && (entry.reference == null || isHanCharacter(entry.reference))
            && Array.isArray(entry.readings) && entry.readings.length > 0 && entry.readings.every(isSemanticKanaReading)
            && isTextArray(entry.sourceIds) && isText(entry.source))
        && hasNoConflictingRows(data.entries, entry => entry.character, entry => [entry.reference || null, entry.readings, entry.sourceIds]),
    'common-word-bank-v1': data => isNonEmptyRowBank(data, entry => {
        if (Array.isArray(entry)) return isText(entry[0]) && isSemanticKanaReading(entry[1]) && (entry[2] == null || (typeof entry[2] === 'string' && (!entry[2] || isSafeReviewedPattern(entry[2]))));
        return isPlainObject(entry) && isText(entry.surface) && isSemanticKanaReading(entry.reading)
            && (entry.romaji == null || isRule0RomajiEvidence(entry.romaji))
            && (entry.pattern == null || (typeof entry.pattern === 'string' && (!entry.pattern || isSafeReviewedPattern(entry.pattern))))
            && (entry.tokenReadingAuthority == null || typeof entry.tokenReadingAuthority === 'boolean')
            && (entry.conjugationClass == null || ['godan-ra'].includes(String(entry.conjugationClass)))
            && (entry.conjugationClass !== 'godan-ra'
                || (String(entry.surface).endsWith('る') && normalizeEvidenceReading(entry.reading).endsWith('る')))
            && isText(entry.source);
    }),
    'general-word-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry)
        && isText(entry[0])
        && Array.isArray(entry[1])
        && entry[1].length > 0
        && entry[1].every(reading => Array.isArray(reading) && isSemanticKanaReading(reading[0]) && Number.isFinite(Number(reading[1]))))
        && hasNoConflictingRows(data, entry => entry[0], entry => entry[1]),
    'general-word-bank-v2': data => isPlainObject(data)
        && isPlainObject(data._meta)
        && Number(data._meta.schemaVersion) === 2
        && data._meta.scoreSemantics === 'popularity-ranking-only'
        && ['complete-source-surface', 'filtered-positive-priority', 'filtered-source-surface', 'unknown'].includes(String(data._meta.defaultReadingCoverage || 'unknown'))
        && Array.isArray(data.entries) && data.entries.length > 0
        && data.entries.every(entry => Array.isArray(entry)
            && isText(entry[0])
            && Array.isArray(entry[1]) && entry[1].length > 0
            && entry[1].every(reading => Array.isArray(reading) && isSemanticKanaReading(reading[0]) && Number.isFinite(Number(reading[1])))
            && (entry[2] == null || entry[2] === 0 || entry[2] === 1 || typeof entry[2] === 'boolean')
            && (entry[3] == null || (isPlainObject(entry[3])
                && ['complete-source-surface', 'filtered-source-surface', 'filtered-positive-priority', 'unknown'].includes(String(entry[3].readingCoverage || 'unknown'))
                && (entry[3].sourceReadingCount == null || (Number.isInteger(entry[3].sourceReadingCount) && entry[3].sourceReadingCount >= entry[1].length))
                && (entry[3].restrictionStatus == null || ['surface-pair-evidence', 'unknown-from-compact-bank', 'unknown'].includes(String(entry[3].restrictionStatus)))
                && (entry[3].readingEvidence == null || (Array.isArray(entry[3].readingEvidence) && entry[3].readingEvidence.every(item => isPlainObject(item)
                    && isSemanticKanaReading(item.reading)
                    && typeof item.retained === 'boolean'
                    && (item.popularityScore == null || Number.isFinite(Number(item.popularityScore)))
                    && (item.sequences == null || (Array.isArray(item.sequences) && item.sequences.every(Number.isInteger)))
                    && (item.spellingSpecificApplicability == null || typeof item.spellingSpecificApplicability === 'boolean')))))))
        && hasNoConflictingRows(data.entries, entry => entry[0], entry => [entry[1], entry[2] || 0, entry[3] || null]),
    'loanword-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry)
        ? isText(entry[0]) && isRule0RomajiEvidence(entry[1])
        : isPlainObject(entry) && isText(entry.surface)
            && ((isRule0RomajiEvidence(entry.output)
                    && (entry.category == null || ['country-name', 'country-language'].includes(String(entry.category))))
                || (entry.output == null && entry.requiresReview === true && isText(entry.reviewReason))))
        && hasNoConflictingRows(
            data,
            entry => Array.isArray(entry) ? entry[0] : entry.surface,
            entry => Array.isArray(entry)
                ? [normalizeReviewedRomaji(entry[1]), false, null]
                : [entry.output == null ? null : normalizeReviewedRomaji(entry.output), Boolean(entry.requiresReview), entry.reviewReason || null]
        ),
    'loanword-bank-v2': data => isNonEmptyRowBank(data, isLoanwordBankEntryV2)
        && hasNoConflictingRows(
            data,
            entry => Array.isArray(entry) ? entry[0] : entry.surface,
            entry => Array.isArray(entry)
                ? [normalizeReviewedRomaji(entry[1]), [], false, null]
                : [
                    entry.output == null ? null : normalizeReviewedRomaji(entry.output),
                    (entry.alternates || []).map(item => [normalizeReviewedRomaji(item.output), item.significance]),
                    Boolean(entry.requiresReview),
                    entry.reviewReason || null,
                    entry.ambiguitySignificance || null,
                    entry.context || null,
                    entry.category || null
                ]
        ),
    'compound-word-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry) && isText(entry[0]) && isSemanticKanaReading(entry[1])),
    'ateji-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry) && isText(entry[0]) && isSemanticKanaReading(entry[1]))
        && hasNoConflictingRows(data, entry => entry[0], entry => normalizeEvidenceReading(entry[1])),
    'proper-noun-bank-v1': data => isNonEmptyRowBank(data, entry => {
        if (Array.isArray(entry)) return isText(entry[0]) && isSemanticKanaReading(entry[1]);
        return isPlainObject(entry)
            && isText(entry.surface)
            && Array.isArray(entry.readings)
            && entry.readings.length > 0
            && entry.readings.every(candidate => isPlainObject(candidate)
                && isSemanticKanaReading(candidate.reading)
                && Number.isFinite(Number(candidate.weight || 0))
                && (candidate.categories == null || (Array.isArray(candidate.categories) && candidate.categories.every(isText))));
    }),
    'reviewed-proper-name-span-evidence-v1': data => isNonEmptyRowBank(data, entry => isPlainObject(entry)
        && isText(entry.surface) && isSemanticKanaReading(entry.reading) && isRule0RomajiEvidence(entry.romaji) && isText(entry.category) && isText(entry.source))
        && hasNoConflictingRows(data, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), normalizeReviewedRomaji(entry.romaji), entry.category]),
    'particle-expressions-v1': data => isNonEmptyRowBank(data, entry => isPlainObject(entry) && isText(entry.surface) && isRule0RomajiEvidence(entry.romaji) && normalizeReviewedRomaji(entry.romaji) === normalizeReviewedRomaji(entry.romaji).toLowerCase())
        && hasNoConflictingRows(data, entry => entry.surface, entry => normalizeReviewedRomaji(entry.romaji)),
    'conjugation-patterns-v1': data => isPlainObject(data)
        && isTextArray(data.joinEndings)
        && isTextArray(data.auxiliarySpacing)
        && isTextArray(data.auxiliarySpacingBasicForms)
        && isTextArray(data.contractedAuxiliaryBasicForms)
        && isTextArray(data.capitalizedAuxiliaries),
    'counter-date-reading-evidence-v1': data => isNonEmptyRowBank(data, entry => isPlainObject(entry)
        && isText(entry.surface)
        && (entry.aliases == null || isTextArray(entry.aliases))
        && isSemanticKanaReading(entry.reading) && isRule0RomajiEvidence(entry.romaji)
        && ['counter', 'calendar-date', 'calendar-month', 'duration-month', 'place-counter', 'clock-hour', 'minute-counter', 'numeric-component'].includes(String(entry.role || ''))
        && (entry.unit == null || isText(entry.unit))
        && (entry.numericTail == null || typeof entry.numericTail === 'boolean')
        && (entry.hundredTailReading == null || isSemanticKanaReading(entry.hundredTailReading)))
        && hasNoConflictingRows(data, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), normalizeReviewedRomaji(entry.romaji), entry.aliases || [], entry.role, entry.unit || null, Boolean(entry.numericTail), normalizeEvidenceReading(entry.hundredTailReading || '')])
        && hasUniqueCounterDateKeys(data),
    'contextual-reading-evidence-v1': data => isContextualReadingEvidence(data),
    'reading-evidence-v1': data => Array.isArray(data) && data.every(entry => isPlainObject(entry)
        && isText(entry.surface)
        && isSemanticKanaReading(entry.preferredReading)
        && Array.isArray(entry.alternatives)
        && entry.alternatives.every(item => Array.isArray(item) && isSemanticKanaReading(item[0])))
        && hasNoConflictingRows(data, entry => entry.surface, entry => [normalizeEvidenceReading(entry.preferredReading), entry.alternatives]),
    'reviewed-reading-evidence-v1': data => isPlainObject(data)
        && Number(data.version) === 1
        && Array.isArray(data.preferences)
        && data.preferences.length > 0
        && data.preferences.every(entry => isPlainObject(entry)
            && isText(entry.surface)
            && isSemanticKanaReading(entry.reading)
            && Array.isArray(entry.alternatives)
            && entry.alternatives.every(isSemanticKanaReading)
            && ((entry.numericCanonical == null && entry.numericRole == null)
                || (isText(entry.numericCanonical) && ['numeral', 'counter'].includes(String(entry.numericRole)))))
        && hasNoConflictingRows(data.preferences, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), entry.alternatives, entry.numericCanonical || null, entry.numericRole || null])
        && Array.isArray(data.spans)
        && data.spans.every(entry => isPlainObject(entry)
            && isText(entry.surface)
            && isSemanticKanaReading(entry.reading)
            && (entry.romaji == null || isRule0RomajiEvidence(entry.romaji))
            && (entry.alternatives == null || (Array.isArray(entry.alternatives) && entry.alternatives.every(isSemanticKanaReading)))
            && (entry.reviewRequired == null || typeof entry.reviewRequired === 'boolean'))
        && hasNoConflictingRows(data.spans, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), normalizeReviewedRomaji(entry.romaji || ''), entry.alternatives || [], Boolean(entry.reviewRequired)]),
    'rendaku-evidence-v1': data => Array.isArray(data) && data.every(entry => isPlainObject(entry)
        && isText(entry.surface) && isSemanticKanaReading(entry.reading) && typeof entry.rendaku === 'boolean' && isText(entry.source))
        && hasNoConflictingRows(data, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), Boolean(entry.rendaku), String(entry.source || '').trim()]),
    'historical-kana-evidence-v1': data => isPlainObject(data)
        && Array.isArray(data.entries)
        && data.entries.every(entry => isPlainObject(entry)
            && isText(entry.surface)
            && isSemanticKanaReading(entry.reading)
            && isText(entry.pos)
            && isText(entry.source)
            && (entry.conjugationClass == null || ['ク活用', 'シク活用'].includes(String(entry.conjugationClass))))
        && hasNoConflictingRows(data.entries, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), String(entry.pos || '').trim(), String(entry.conjugationClass || '').trim(), String(entry.source || '').trim()])
});

function validateAssetSchema(assetKey, data, filePath) {
    const schema = getAssetDefinition(assetKey).schema;
    if (!schema) return data;
    const validator = assetSchemaValidators[schema];
    if (!validator) throw new Error(`Unknown asset schema: ${schema}`);
    if (!validator(data)) throw new Error(`Schema ${schema} rejected ${filePath}`);
    return data;
}

// Source section: Built-in UI references and display controls.
let statusBanner = null;
let inputArea = null;
let outputDiv = null;
let translationReviewDiv = null;
let kanjiReadingsDiv = null;
let kanjiSearchInput = null;
let kanjiReadingConsumers = [];
const hasOwn = Object.prototype.hasOwnProperty;

function setVisibility(element, isVisible) {
    if (!element) return;
    element.hidden = !isVisible;
    element.style.display = isVisible ? '' : 'none';
    element.style.visibility = isVisible ? '' : 'hidden';
    element.setAttribute('aria-hidden', String(!isVisible));
    element.style.pointerEvents = isVisible ? 'auto' : 'none';
    if ('disabled' in element) /** @type {any} */ (element).disabled = !isVisible;
    if ('tabIndex' in element) element.tabIndex = isVisible ? 0 : -1;
}

function resolveKanjiConsumerElement(target, attributeName, fallback = null) {
    const selector = target.getAttribute?.(attributeName)?.trim();
    if (!selector) return fallback;
    try { return document.querySelector(selector); }
    catch { return null; }
}

function collectKanjiReadingConsumers(scanCustomTargets = false) {
    const explicitTargets = scanCustomTargets && typeof document.querySelectorAll === 'function'
        ? Array.from(document.querySelectorAll('[data-cj2r-kanji-readings]'))
        : [];
    if (kanjiReadingsDiv && !explicitTargets.includes(kanjiReadingsDiv)) explicitTargets.unshift(kanjiReadingsDiv);
    return explicitTargets.map(target => ({
        target,
        source: resolveKanjiConsumerElement(target, 'data-cj2r-kanji-source', inputArea),
        search: resolveKanjiConsumerElement(target, 'data-cj2r-kanji-search', kanjiSearchInput),
        isCustomTarget: target !== kanjiReadingsDiv
    }));
}

function sameKanjiReadingConsumers(previous, current) {
    return previous.length === current.length && previous.every((consumer, index) => {
        const next = current[index];
        return consumer.target === next.target && consumer.source === next.source && consumer.search === next.search;
    });
}

function refreshBuiltInUiReferences({ scanKanjiTargets = false } = {}) {
    const previous = [statusBanner, inputArea, outputDiv, translationReviewDiv, kanjiReadingsDiv, kanjiSearchInput];
    const previousConsumers = kanjiReadingConsumers;
    const hadCustomKanjiTarget = previousConsumers.some(consumer => consumer.isCustomTarget);
    statusBanner = document.getElementById('status-banner');
    inputArea = document.getElementById('input');
    outputDiv = document.getElementById('output');
    translationReviewDiv = document.getElementById('translation-review');
    kanjiReadingsDiv = document.getElementById('kanji-readings');
    kanjiSearchInput = document.getElementById('kanji-search');
    kanjiReadingConsumers = collectKanjiReadingConsumers(scanKanjiTargets || hadCustomKanjiTarget);

    setVisibility(statusBanner, true);
    const current = [statusBanner, inputArea, outputDiv, translationReviewDiv, kanjiReadingsDiv, kanjiSearchInput];
    return current.some((element, index) => element !== previous[index])
        || !sameKanjiReadingConsumers(previousConsumers, kanjiReadingConsumers);
}

refreshBuiltInUiReferences({ scanKanjiTargets: true });

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
        compoundWordPrefixes: new Set(),
        atejiDictionary: new Map(),
        atejiPrefixes: new Set(),
        properNounDictionary: new Map(),
        properNounPrefixes: new Set(),
        properNounVariantEvidenceSurfaces: new Map(),
        properNounVariantEvidencePrefixes: new Set(),
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
        counterDateReadingPrefixes: new Set(),
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

// Source section: Shared JSON loading, Kanji data, the Kanji helper and overrides.
async function ensureKuromojiLoaded() {
    try {
        if (!window.kuromoji) await loadScriptWithRetry(assetUrl(getAssetPath('kuromojiScript')));
        validateKuromojiApi(window.kuromoji);
        return true;
    } catch (error) {
        handleAssetLoadFailure('kuromojiScript', 'Unable to load Kuromoji', error);
        return false;
    }
}

function handleAssetLoadFailure(assetKey, message, error) {
    const definition = getAssetDefinition(assetKey);
    console.warn(`${message}:`, error);
    if (definition.criticality === ASSET_CRITICALITY.CRITICAL) {
        const detail = error?.message ? ` ${error.message}` : '';
        throw new Error(`${message}.${detail}`.trim());
    }
    if (definition.criticality === ASSET_CRITICALITY.DEVELOPER) runtimeState.developerWarnings.add(message);
    else runtimeState.resourceWarnings.add(message);
    return false;
}

async function fetchJsonAsset(assetKey, filePath = getAssetPath(assetKey), failureMessage = `Asset unavailable: ${filePath}`) {
    try {
        const response = await fetchAssetResponse(assetUrl(filePath));
        const data = await response.json();
        return validateAssetSchema(assetKey, data, filePath);
    } catch (error) {
        handleAssetLoadFailure(assetKey, failureMessage, error);
        return null;
    }
}

function normalizeReadingList(value) {
    if (!value) return [];
    return String(value)
        .replace(/・/g, ' ')
        .split(/\s+/)
        .map(part => part.trim())
        .filter(Boolean);
}

async function loadKanjiVariantDictionary() {
    const data = await fetchJsonAsset('kanjiVariants', getAssetPath('kanjiVariants'), 'Kanji variant dictionary unavailable');
    if (!data) return;
    runtimeState.generalKanjiVariantDictionary.clear();
    runtimeState.nameKanjiVariantDictionary.clear();
    for (const [variant, reference] of Object.entries(data?.general || {})) {
        if (isHanCharacter(variant) && isHanCharacter(reference) && variant !== reference) {
            runtimeState.generalKanjiVariantDictionary.set(variant, reference);
        }
    }
    for (const [variant, reference] of Object.entries(data?.names || {})) {
        if (isHanCharacter(variant) && isHanCharacter(reference) && variant !== reference) {
            runtimeState.nameKanjiVariantDictionary.set(variant, reference);
        }
    }
}

async function loadJapaneseHanScopeDictionary() {
    const data = await fetchJsonAsset('japaneseHanScope', getAssetPath('japaneseHanScope'), 'Japanese-use Han scope evidence unavailable');
    runtimeState.japaneseHanScopeDictionary.clear();
    if (!data) return;
    for (const entry of data.entries || []) {
        runtimeState.japaneseHanScopeDictionary.set(String(entry.character), {
            character: String(entry.character),
            reference: entry.reference ? String(entry.reference) : null,
            readings: [...new Set((entry.readings || []).map(normalizeKanaReading).filter(Boolean))],
            sourceIds: [...new Set((entry.sourceIds || []).map(String))],
            source: String(entry.source || '')
        });
    }
}

function buildJapaneseHanScopeCandidates(character, evidence = null) {
    const entry = evidence || runtimeState.japaneseHanScopeDictionary.get(String(character || '')) || null;
    const readings = entry?.readings || [];
    return readings.map((reading, index) => ({
        reading,
        romaji: convertToRomaji(reading),
        weight: Math.max(1, 100 - index),
        rank: index + 1,
        categories: ['japanese-han-scope'],
        sources: entry?.sourceIds?.length ? entry.sourceIds : [entry?.source || 'japanese-han-scope']
    }));
}

function normalizeKanjiDictionaryCandidateReading(reading, kind = 'on') {
    const raw = String(reading || '').trim();
    if (!raw) return null;
    const affix = /^-|-$/.test(raw);
    const dotted = raw.includes('.');
    const normalized = normalizeKanaReading(raw.replace(/^-+|-+$/g, '').split('.', 1)[0]);
    if (!normalized || !/^[ぁ-ゖゔゟー]+$/u.test(normalized)) return null;
    const category = kind === 'on'
        ? 'kanjidic-on'
        : affix ? 'kanjidic-kun-affix'
        : dotted ? 'kanjidic-kun-stem'
        : 'kanjidic-kun-bare';
    const priority = kind === 'on' ? 80 : affix ? 40 : dotted ? 60 : 90;
    return { reading: normalized, category, priority };
}

function buildKanjiDictionaryCandidates(character) {
    const char = String(character || '');
    const entry = runtimeState.kanjiDictionary[char] || null;
    if (!entry) return [];
    const candidates = [];
    const seen = new Set();
    const add = (reading, kind) => {
        const normalized = normalizeKanjiDictionaryCandidateReading(reading, kind);
        if (!normalized || seen.has(normalized.reading)) return;
        seen.add(normalized.reading);
        candidates.push(normalized);
    };
    for (const reading of entry.kun || []) add(reading, 'kun');
    for (const reading of entry.on || []) add(reading, 'on');
    candidates.sort((left, right) => right.priority - left.priority);
    return candidates.map((candidate, index) => ({
        reading: candidate.reading,
        romaji: convertToRomaji(candidate.reading),
        weight: candidate.priority,
        rank: index + 1,
        categories: ['kanjidic', candidate.category],
        sources: ['kanjidic']
    }));
}

function classifyHanCharacterScope(character) {
    const char = String(character || '');
    if (!isHanCharacter(char)) return { character: char, scope: 'out-of-scope', evidence: [], candidates: [] };

    const reviewed = runtimeState.japaneseHanScopeDictionary.get(char) || null;
    if (reviewed) {
        return {
            character: char,
            scope: 'japanese-scope',
            evidence: [{ source: 'reviewed-japanese-han-scope', sourceIds: reviewed.sourceIds, reference: reviewed.reference, detail: reviewed.source }],
            reference: reviewed.reference,
            candidates: buildJapaneseHanScopeCandidates(char, reviewed)
        };
    }

    const compatibility = normalizeCompatibilityIdeograph(char);
    const generalReference = runtimeState.generalKanjiVariantDictionary.get(char) || runtimeState.generalKanjiVariantDictionary.get(compatibility) || null;
    const nameReference = runtimeState.nameKanjiVariantDictionary.get(char) || runtimeState.nameKanjiVariantDictionary.get(compatibility) || null;
    const reference = generalReference || nameReference;
    if (reference) {
        const candidates = buildKanjiDictionaryCandidates(reference);
        if (candidates.length) {
            return {
                character: char,
                scope: 'japanese-scope',
                evidence: [{ source: generalReference ? 'general-kanji-variant' : 'name-kanji-variant', reference }],
                reference,
                candidates
            };
        }
    }

    const canonical = runtimeState.kanjiDictionary[char] ? char : runtimeState.kanjiDictionary[compatibility] ? compatibility : null;
    if (canonical) {
        const candidates = buildKanjiDictionaryCandidates(canonical);
        if (candidates.length) {
            return {
                character: char,
                scope: 'japanese-scope',
                evidence: [{ source: 'kanjidic', reference: canonical }],
                reference: canonical,
                candidates
            };
        }
        return {
            character: char,
            scope: 'unknown-scope',
            evidence: [{ source: 'kanjidic-no-japanese-reading', reference: canonical }],
            reference: canonical,
            candidates: []
        };
    }

    return { character: char, scope: 'unknown-scope', evidence: [], reference: null, candidates: [] };
}

function classifyHanSurfaceScope(value) {
    const characters = Array.from(String(value || '')).filter(isHanCharacter);
    if (!characters.length) return { scope: 'out-of-scope', characters: [] };
    const classified = characters.map(classifyHanCharacterScope);
    return {
        scope: classified.every(item => item.scope === 'japanese-scope') ? 'japanese-scope' : 'unknown-scope',
        characters: classified
    };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hasMeaningfulJapaneseText(value) {
    return /[\p{Script=Han}ぁ-ゖァ-ンヴー]/u.test(String(value || '').trim());
}

async function loadKanjiDictionary() {
    const files = getAssetPaths('kanjiBanks');
    for (const filePath of files) {
        const data = await fetchJsonAsset('kanjiBanks', filePath, `Kanji file unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            if (!Array.isArray(entry) || !entry[0]) continue;
            const kanji = String(entry[0]);
            if (!kanji || Array.from(kanji).length !== 1) continue;
            runtimeState.kanjiDictionary[kanji] = {
                on: normalizeReadingList(entry[1]),
                kun: normalizeReadingList(entry[2])
            };
        }
    }
}

function formatKanjiReadingForDisplay(reading) {
    const kana = String(reading || '').replace(/^-+|-+$/g, '').replace(/\./g, '');
    return { kana, romaji: capitalizeRomaji(convertToRomaji(kana)) };
}

function deduplicateKanjiReadingsForDisplay(readings) {
    const seen = new Set();
    const unique = [];
    for (const reading of readings || []) {
        const display = formatKanjiReadingForDisplay(reading);
        const key = `${display.romaji}|${display.kana}`;
        if (!display.kana || seen.has(key)) continue;
        seen.add(key);
        unique.push(reading);
    }
    return unique;
}

/** @param {string} char @param {number|null} [position] */
function getKanjiReadingEntry(char, position = null) {
    const entry = runtimeState.kanjiDictionary[char] || { on: [], kun: [] };
    const format = reading => ({ reading, ...formatKanjiReadingForDisplay(reading) });
    return {
        character: char,
        position: Number.isInteger(position) ? position : null,
        on: deduplicateKanjiReadingsForDisplay(entry.on).map(format),
        kun: deduplicateKanjiReadingsForDisplay(entry.kun).map(format)
    };
}

function getUniqueKanji(text) {
    return [...new Set(getHanOccurrences(text).map(({ char }) => char))];
}

function getKanjiReadingData(text, searchValue = '') {
    const sourceText = String(text || '');
    const searchText = String(searchValue || '').trim();
    return {
        searchText,
        search: searchText ? getUniqueKanji(searchText).map(char => getKanjiReadingEntry(char)) : [],
        input: hasMeaningfulJapaneseText(sourceText)
            ? getHanOccurrences(sourceText).map(({ char, position }) => getKanjiReadingEntry(char, position))
            : []
    };
}

/** @param {{character:string,position:number|null,on:Array<{reading:string,kana:string,romaji:string}>,kun:Array<{reading:string,kana:string,romaji:string}>}} entry */
function buildKanjiReadingMarkup(entry) {
    const positionAttribute = Number.isInteger(entry.position) ? ` data-position="${entry.position}"` : '';
    const makeReadingButton = display => `<button type="button" class="kanji-reading-button" data-kanji="${escapeHtml(entry.character)}" data-reading="${escapeHtml(display.reading)}"${positionAttribute}><span>${escapeHtml(display.romaji)} (${escapeHtml(display.kana)})</span></button>`;
    const onButtons = entry.on.map(makeReadingButton).join('') || '<span>—</span>';
    const kunButtons = entry.kun.map(makeReadingButton).join('') || '<span>—</span>';
    return `<div class="kanji-reading-item"><span class="kanji-character">${escapeHtml(entry.character)}</span><div class="kanji-reading-text"><div><strong>On’yomi:</strong> ${onButtons}</div><div><strong>Kun’yomi:</strong> ${kunButtons}</div></div></div>`;
}

function getHanOccurrences(text) {
    const occurrences = [];
    const value = String(text || '');
    for (let index = 0; index < value.length;) {
        const codePoint = value.codePointAt(index);
        if (codePoint === undefined) break;
        const char = String.fromCodePoint(codePoint);
        if (isHanCharacter(char)) occurrences.push({ char, position: index });
        index += char.length;
    }
    return occurrences;
}

/** @param {string} text @param {string} char @param {string} reading @param {number} position */
function replaceKanjiReadingAtPosition(text, char, reading, position) {
    const value = String(text || '');
    if (!char || !Number.isInteger(position) || position < 0 || value.slice(position, position + char.length) !== char) return value;
    const [stem, okurigana = ''] = String(reading).split('.', 2);
    const followingText = value.slice(position + char.length);
    const replacement = okurigana && followingText.startsWith(okurigana)
        ? stem.replace(/^-+|-+$/g, '')
        : String(reading).replace(/^-+|-+$/g, '').replace('.', '');
    return value.slice(0, position) + replacement + followingText;
}

/** @param {Element|null} sourceElement @param {string} char @param {string} reading @param {number} position */
function replaceKanjiReadingInElement(sourceElement, char, reading, position) {
    if (!char || !sourceElement || !('value' in sourceElement)) return false;
    const currentValue = String(sourceElement.value || '');
    const nextValue = replaceKanjiReadingAtPosition(currentValue, char, reading, position);
    if (nextValue === currentValue) return false;
    sourceElement.value = nextValue;
    sourceElement.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

/** @param {Element} target @param {Element|null} sourceElement */
function bindKanjiReadingButtons(target, sourceElement) {
    if (!sourceElement) return;
    target.querySelectorAll('.kanji-reading-button[data-position]').forEach(button => {
        button.addEventListener('click', function () {
            replaceKanjiReadingInElement(sourceElement, this.dataset.kanji, this.dataset.reading, Number(this.dataset.position));
        });
    });
}

/** @param {Element} target @param {string} text @param {string} [searchValue] @param {Element|null} [sourceElement] */
function renderKanjiReadings(target, text, searchValue = '', sourceElement = null) {
    if (!target) return null;
    const data = getKanjiReadingData(text, searchValue);
    if (!data.searchText && !hasMeaningfulJapaneseText(text)) {
        target.innerHTML = '';
        return data;
    }
    const sections = [];
    if (data.searchText) {
        if (!data.search.length) {
            target.innerHTML = '<div class="kanji-result-label">Kanji Search</div><div>No kanji found in the search field.</div>';
            return data;
        }
        sections.push(`<div class="kanji-result-group"><div class="kanji-result-label">Kanji Search</div>${data.search.map(buildKanjiReadingMarkup).join('')}</div>`);
    }
    if (data.input.length) {
        sections.push(`${sections.length ? '<div class="kanji-divider"></div>' : ''}<div class="kanji-result-group"><div class="kanji-result-label">Japanese Text Input</div>${data.input.map(buildKanjiReadingMarkup).join('')}</div>`);
    }
    target.innerHTML = sections.join('');
    bindKanjiReadingButtons(target, sourceElement);
    return data;
}

async function loadOverrideFile(assetKey) {
    const relativePath = getAssetPath(assetKey);
    return fetchJsonAsset(assetKey, relativePath, `Override file unavailable: ${relativePath}`);
}

async function loadOverrideData() {
    const [exactData, contextData] = await Promise.all([
        loadOverrideFile('exactOverrides'),
        loadOverrideFile('contextOverrides')
    ]);
    runtimeState.overrides = {};
    if (exactData && typeof exactData === 'object' && !Array.isArray(exactData)) {
        for (const [surface, output] of Object.entries(exactData)) {
            if (surface.startsWith('_') || typeof output !== 'string') continue;
            if (!isRule0RomajiEvidence(output)) {
                runtimeState.resourceWarnings.add(`Invalid exact override output: ${surface}`);
                continue;
            }
            runtimeState.overrides[canonicalizeTokenizerBoundaryCharacters(surface)] = normalizeReviewedRomaji(output);
        }
    }
    runtimeState.contextOverrides = [];
    if (!Array.isArray(contextData)) return;
    for (const item of contextData) {
        if (!item || !item.pattern || !item.surface || !item.romaji) continue;
        try {
            runtimeState.contextOverrides.push({ ...item, pattern: compileReviewedPattern(canonicalizeTokenizerBoundaryCharacters(item.pattern), 'i') });
        } catch (error) {
            console.warn(`Invalid contextual override pattern: ${item.pattern}`, error);
            runtimeState.resourceWarnings.add(`Invalid contextual override: ${item.pattern}`);
        }
    }
}

function buildContextOverrideIndex() {
    runtimeState.contextOverrideDictionary.clear();
    runtimeState.contextOverridePrefixes.clear();
    for (const override of runtimeState.contextOverrides) {
        const normalizedSurface = normalizeTranslatorInputText(override.surface);
        const indexedOverride = { ...override, normalizedSurface };
        const rules = runtimeState.contextOverrideDictionary.get(normalizedSurface) || [];
        rules.push(indexedOverride);
        runtimeState.contextOverrideDictionary.set(normalizedSurface, rules);
        addSurfacePrefixes(runtimeState.contextOverridePrefixes, normalizedSurface);
    }
}

// Source section: Kana-to-Romaji conversion and core orthographic mechanics.

function isTrailingRule0PunctuationCharacter(character) {
    if (!character) return false;
    const compatible = normalizeJapanesePunctuationCompatibility(character);
    if (!compatible) return false;
    const characters = Array.from(compatible);
    if (characters.length !== 1) return characters.every(isTrailingRule0PunctuationCharacter);
    return isCanonicalHardBoundaryAt(compatible, 0);
}

function splitTrailingPunctuation(text) {
    const source = String(text || '');
    const characters = Array.from(source);
    let end = characters.length;
    while (end > 0 && isTrailingRule0PunctuationCharacter(characters[end - 1])) end -= 1;
    if (end === characters.length) return { coreText: source, trailingText: '' };
    return { coreText: characters.slice(0, end).join(''), trailingText: characters.slice(end).join('') };
}



function capitalizeRomaji(value) {
    if (!value) return value;
    return String(value).replace(/^([^a-zA-Z]*)([a-zA-Z])/, (_, prefix, character) => prefix + character.toUpperCase());
}



function stripIdeographicVariationSelectors(value) {
    return String(value || '').replace(/(\p{Script=Han})[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]+/gu, '$1');
}

function isIdeographicVariationSelectorSequence(value) {
    return /^[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]+$/u.test(String(value || ''));
}

function isHanCharacter(value) {
    return /^\p{Script=Han}$/u.test(String(value || ''));
}

function containsHan(value) {
    return /\p{Script=Han}/u.test(String(value || ''));
}

function normalizeCompatibilityIdeograph(character) {
    const value = String(character || '');
    const normalized = value.normalize('NFKC');
    return Array.from(normalized).length === 1 && isHanCharacter(normalized) ? normalized : value;
}

function normalizeKanjiForLookupDetailed(value, options = {}) {
    const original = String(value || '');
    const allowNameVariants = Boolean(options.names);
    const withoutSelectors = stripIdeographicVariationSelectors(original);
    const mappings = [];
    let normalizedSurface = '';

    if (withoutSelectors !== original) {
        mappings.push({ from: original, to: withoutSelectors, type: 'variation-selector' });
    }

    for (const character of Array.from(withoutSelectors)) {
        let normalized = normalizeCompatibilityIdeograph(character);
        if (normalized !== character) mappings.push({ from: character, to: normalized, type: 'compatibility' });

        const generalVariant = runtimeState.generalKanjiVariantDictionary.get(normalized)
            || runtimeState.generalKanjiVariantDictionary.get(character);
        if (generalVariant && generalVariant !== normalized) {
            mappings.push({ from: character, to: generalVariant, type: 'general' });
            normalized = generalVariant;
        }

        if (allowNameVariants) {
            const nameVariant = runtimeState.nameKanjiVariantDictionary.get(normalized)
                || runtimeState.nameKanjiVariantDictionary.get(character);
            if (nameVariant && nameVariant !== normalized) {
                mappings.push({ from: character, to: nameVariant, type: 'name' });
                normalized = nameVariant;
            }
        }
        normalizedSurface += normalized;
    }

    return {
        surface: original,
        normalizedSurface,
        changed: normalizedSurface !== original || withoutSelectors !== original,
        mappings
    };
}

function normalizeKanjiForLookup(value, options = {}) {
    return normalizeKanjiForLookupDetailed(value, options).normalizedSurface;
}

const kanaToRomajiMap = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ゔ':'vu',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ゎ':'wa',
    'ゕ':'ka','ゖ':'ke','ゐ':'i','ゑ':'e','ゟ':'yori'
};

function normalizeKanaReading(value) {
    const specialKatakana = Object.freeze({
        'ヷ': 'ゔぁ', 'ヸ': 'ゔぃ', 'ヹ': 'ゔぇ', 'ヺ': 'ゔぉ', 'ヿ': 'こと'
    });
    return Array.from(String(value || '')).map(char => {
        if (specialKatakana[char]) return specialKatakana[char];
        return /[\u30a1-\u30f6]/u.test(char) ? String.fromCharCode(char.charCodeAt(0) - 0x60) : char;
    }).join('');
}

const obsoleteWRowModernKanaMap = Object.freeze({
    'ゐ': 'い',
    'ヰ': 'イ',
    'ゑ': 'え',
    'ヱ': 'エ'
});

function normalizeObsoleteWRowKanaForModernReading(value) {
    return Array.from(String(value || '')).map(character => obsoleteWRowModernKanaMap[character] || character).join('');
}

const japanesePunctuationCompatibilityPattern = /[\uFE10-\uFE19\uFE30-\uFE48\uFE50-\uFE6B]/gu;
const japaneseOrthographicNonBoundaryCharacters = new Set(['々','ゝ','ゞ','ヽ','ヾ','ー','〃','〆','〇']);
const unresolvedJapaneseOrthographicCharacters = new Set(['ゝ','ゞ','ヽ','ヾ','〃','〆','〓','〾','゛','゜','\u3099','\u309A']);

const historicalJapaneseSmallKanaExtensionCharacters = new Set([
    '𛄲', '𛅐', '𛅑', '𛅒',
    '𛅕', '𛅤', '𛅥', '𛅦', '𛅧'
]);

function isHistoricalJapaneseKanaExtensionCharacter(character) {
    const value = String(character || '');
    if (!value) return false;
    const codePoint = value.codePointAt(0);
    if (typeof codePoint !== 'number' || !Number.isInteger(codePoint)) return false;
    const inHistoricalJapaneseKanaBlock = (codePoint >= 0x1B000 && codePoint <= 0x1B0FF)
        || (codePoint >= 0x1B100 && codePoint <= 0x1B12F)
        || historicalJapaneseSmallKanaExtensionCharacters.has(value);
    return inHistoricalJapaneseKanaBlock
        && /^(?:\p{Script=Hiragana}|\p{Script=Katakana})$/u.test(value);
}

function normalizeSpacingKanaVoicingMarks(value) {
    return String(value || '').replace(/([ぁ-ゖァ-ヶゝヽ])([゛゜])/gu, (_, base, mark) => {
        const combining = mark === '゛' ? '\u3099' : '\u309A';
        return `${base}${combining}`.normalize('NFC');
    });
}

function isMechanicallyRomanisableKanaSurface(value) {
    const surface = String(value || '');
    return Boolean(surface) && /^[ぁ-ゖゟァ-ヺヿー]+$/u.test(surface);
}

function isJapaneseOrthographicReadingSurface(value) {
    const surface = String(value || '');
    return Boolean(surface) && Array.from(surface).every(character =>
        /^[ぁ-ゖゟァ-ヺヿー]$/u.test(character)
        || /^[\u{E0100}-\u{E01EF}]$/u.test(character)
        || isHistoricalJapaneseKanaExtensionCharacter(character)
        || unresolvedJapaneseOrthographicCharacters.has(character));
}
const canonicalHardBoundarySymbols = new Set(['~','|','+','=','×','⋯','⋮']);
const japaneseCensorshipMarkerCharacters = new Set(['◯','○','●']);
const japaneseConditionalCensorshipMarkerCharacters = new Set(['×']);
const canonicalHardWhitespaceCharacters = new Set(['\n','\r','\t','\u2028','\u2029','\u3000']);

function isJapaneseCensorshipMarkerCharacter(character) {
    return japaneseCensorshipMarkerCharacters.has(String(character || ''));
}

function isJapaneseCensorshipMarkerSurface(value) {
    const characters = Array.from(String(value || ''));
    if (!characters.length) return false;
    if (characters.every(isJapaneseCensorshipMarkerCharacter)) return true;
    return characters.length >= 2
        && japaneseConditionalCensorshipMarkerCharacters.has(characters[0])
        && characters.every(character => character === characters[0]);
}

function isJapaneseCensorshipMarkerContextCharacter(character) {
    const value = String(character || '');
    return isJapaneseCensorshipMarkerCharacter(value)
        || japaneseConditionalCensorshipMarkerCharacters.has(value)
        || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶヵー]$/u.test(value);
}

function getRepeatedCensorshipMarkerRun(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    if (!japaneseConditionalCensorshipMarkerCharacters.has(character)) return null;
    let start = index;
    let end = index + 1;
    while (start > 0 && source[start - 1] === character) start -= 1;
    while (end < source.length && source[end] === character) end += 1;
    if (end - start < 2) return null;
    return { start, end, character };
}

function isJapaneseCensorshipMarkerAt(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    if (isJapaneseCensorshipMarkerCharacter(character)) {
        return isJapaneseCensorshipMarkerContextCharacter(source[index - 1] || '')
            || isJapaneseCensorshipMarkerContextCharacter(source[index + 1] || '');
    }
    const repeatedRun = getRepeatedCensorshipMarkerRun(source, index);
    if (!repeatedRun) return false;
    const previous = source[repeatedRun.start - 1] || '';
    const next = source[repeatedRun.end] || '';
    return /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶヵー]$/u.test(previous)
        || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶヵー]$/u.test(next);
}

function normalizeJapanesePunctuationCompatibility(value) {
    return String(value || '')
        .replace(/〠/gu, '〒')
        .replace(japanesePunctuationCompatibilityPattern, character => {
            if (character === '\uFE19' || character === '\uFE30') return '…';
            return character.normalize('NFKC');
        })
        .replace(/[\uFF01-\uFF5E\uFF61-\uFF65]+/gu, segment => segment.normalize('NFKC'))
        .replace(/[‐‑]/gu, '-')
        .replace(/‒/gu, '–');
}

function isJapaneseCompatibilitySourceSymbol(character) {
    const codePoint = String(character || '').codePointAt(0);
    if (typeof codePoint !== 'number') return false;
    return (codePoint >= 0x3200 && codePoint <= 0x33FF)
        || (codePoint >= 0x1F200 && codePoint <= 0x1F2FF);
}

function getJapaneseCompatibilitySourceDecomposition(character) {
    const source = String(character || '');
    if (!isJapaneseCompatibilitySourceSymbol(source)) return null;
    const decomposed = source.normalize('NFKC');
    if (decomposed === source) return null;
    const characters = Array.from(decomposed);
    const hasJapaneseScript = characters.some(item => /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(item));
    if (!hasJapaneseScript) return null;
    const safe = characters.every(item =>
        /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Latin}\p{N}]$/u.test(item)
        || /^[\x20-\x7E]$/u.test(item)
        || /^[ー〔〕]$/u.test(item)
    );
    return safe ? decomposed : null;
}

function normalizeJapaneseCompatibilitySourceSymbols(value) {
    return Array.from(String(value || ''), character =>
        getJapaneseCompatibilitySourceDecomposition(character) || character
    ).join('');
}

function canonicalizeTokenizerBoundaryCharacters(value) {
    return normalizeJapanesePunctuationCompatibility(String(value || '')).replace(/[~～〜〰]/gu, '~');
}

const canonicalTransparentBoundaryCharacters = new Set([
    '「','」','『','』','（','）','(',')','［','］','[',']','【','】','〈','〉','《','》','〔','〕','〖','〗','〘','〙','〚','〛',
    '“','”','‘','’','"',"'",'«','»','‹','›','\n','\r','\t','\u2028','\u2029','\u3000'
]);

function isCanonicalTransparentBoundaryCharacter(character) {
    return canonicalTransparentBoundaryCharacters.has(String(character || ''));
}

function isCanonicalTransparentBoundarySurface(value) {
    const characters = Array.from(String(value || ''));
    return Boolean(characters.length) && characters.every(isCanonicalTransparentBoundaryCharacter);
}

function isBoundaryWordCharacter(character) {
    return Boolean(character) && /^[\p{L}\p{N}]$/u.test(character);
}

function isProtectedInternalBoundaryCharacter(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    const previous = source[index - 1] || '';
    const next = source[index + 1] || '';
    if (character === '.') {
        if (previous === '.' || next === '.') return false;
        return isBoundaryWordCharacter(previous) && isBoundaryWordCharacter(next);
    }
    if (character === ',') return /^[0-9]$/u.test(previous) && /^[0-9]$/u.test(next);
    if (character === ':') {
        if (/^[0-9]$/u.test(previous) && /^[0-9]$/u.test(next)) return true;
        if (/^[A-Za-z]$/u.test(previous) && next === '/') return true;
    }
    return false;
}

function isCanonicalHardBoundaryAt(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    if (!character) return false;
    if (isJapaneseCensorshipMarkerAt(source, index)) return true;
    if (japaneseOrthographicNonBoundaryCharacters.has(character)) return false;
    if (canonicalHardWhitespaceCharacters.has(character)) return true;
    if (isProtectedInternalBoundaryCharacter(source, index)) return false;
    if (/^\p{P}$/u.test(character)) return true;
    return canonicalHardBoundarySymbols.has(character);
}

function getCanonicalHardBoundaryRuns(value) {
    const text = String(value || '');
    const runs = [];
    let index = 0;
    while (index < text.length) {
        if (!isCanonicalHardBoundaryAt(text, index)) { index += 1; continue; }
        const start = index;
        const whitespace = canonicalHardWhitespaceCharacters.has(text[index]);
        const censorshipMarker = isJapaneseCensorshipMarkerAt(text, index);
        index += 1;
        while (index < text.length
            && isCanonicalHardBoundaryAt(text, index)
            && canonicalHardWhitespaceCharacters.has(text[index]) === whitespace
            && isJapaneseCensorshipMarkerAt(text, index) === censorshipMarker) index += 1;
        runs.push({ start, end: index, surface: text.slice(start, index), whitespace, censorshipMarker });
    }
    return runs;
}

function normalizeTranslatorInputText(value) {
    const composed = normalizeSpacingKanaVoicingMarks(value).normalize('NFC');
    const punctuationNormalised = normalizeJapanesePunctuationCompatibility(composed);
    const compatibilityNormalised = normalizeJapaneseCompatibilitySourceSymbols(punctuationNormalised);
    const widthNormalised = compatibilityNormalised.replace(/[\uFF01-\uFF5E\uFF61-\uFF9F]+/gu, segment => segment.normalize('NFKC'));
    const boundaryNormalised = canonicalizeTokenizerBoundaryCharacters(widthNormalised);
    const withoutSelectors = stripIdeographicVariationSelectors(boundaryNormalised);
    return normalizeKanjiForLookup(withoutSelectors);
}


// Historical encoded kana forms with an explicit Unicode ordinary-kana
// equivalent. These are structural source-form normalisations, not inferred
// readings.
const historicalFixedEncodedKanaMap = Object.freeze({
    '𛀀': 'エ',
    '𛄣': 'こと',
    '𛄤': 'トキ',
    '𛄥': 'トテ',
    '𛄦': 'ヨリ',
    '𛄧': 'ネ',
    '𛄨': 'ヰ'
});

function normalizeHistoricalFixedEncodedKanaForms(value) {
    return Array.from(String(value || ''), character => historicalFixedEncodedKanaMap[character] || character).join('');
}

// Unicode assigns fixed syllabic identities to these four archaic kana.
// Historical mode converts them to the existing CJ2R extended-kana spellings
// so the ordinary Rule-0 Hepburn/Wapuro romaniser remains authoritative.
const historicalArchaicSyllableKanaMap = Object.freeze({
    '𛄟': 'うぅ',
    '𛄠': 'いぃ',
    '𛄡': 'いぇ',
    '𛄢': 'うぅ'
});

function normalizeHistoricalArchaicSyllableKana(value) {
    return Array.from(String(value || ''), character => historicalArchaicSyllableKanaMap[character] || character).join('');
}

// Unicode documents the encoded small WI/WE forms as historic labialisation
// modifiers. Only the attested k/g + wi/we combinations are reduced here.
const historicalSmallKanaLabializationMap = Object.freeze({
    'く𛅐': 'くぃ',
    'ぐ𛅐': 'ぐぃ',
    'ク𛅤': 'クィ',
    'グ𛅤': 'グィ',
    'く𛅑': 'くぇ',
    'ぐ𛅑': 'ぐぇ',
    'ク𛅥': 'クェ',
    'グ𛅥': 'グェ'
});

function normalizeHistoricalSmallKanaLabialization(value) {
    const characters = Array.from(String(value || ''));
    let output = '';
    for (let index = 0; index < characters.length; index += 1) {
        const pair = `${characters[index] || ''}${characters[index + 1] || ''}`;
        const mapped = historicalSmallKanaLabializationMap[pair];
        if (mapped) {
            output += mapped;
            index += 1;
        } else {
            output += characters[index];
        }
    }
    return output;
}

// Historical-mode hentaigana normalisation is intentionally evidence-bounded.
// Unicode/CODH map these single-valued code-point ranges to one modern hiragana.
// Multi-valued forms (for example A-WO, KA-KE and N-MU-MO) are deliberately
// excluded so they remain unresolved/review-required without contextual evidence.
const historicalSingleValuedHentaiganaRanges = Object.freeze([
    Object.freeze({ start: 0x1B002, end: 0x1B004, modernKana: 'あ' }),
    Object.freeze({ start: 0x1B006, end: 0x1B009, modernKana: 'い' }),
    Object.freeze({ start: 0x1B00A, end: 0x1B00E, modernKana: 'う' }),
    Object.freeze({ start: 0x1B00F, end: 0x1B013, modernKana: 'え' }),
    Object.freeze({ start: 0x1B014, end: 0x1B016, modernKana: 'お' }),
    Object.freeze({ start: 0x1B017, end: 0x1B021, modernKana: 'か' }),
    Object.freeze({ start: 0x1B023, end: 0x1B02A, modernKana: 'き' }),
    Object.freeze({ start: 0x1B02B, end: 0x1B031, modernKana: 'く' }),
    Object.freeze({ start: 0x1B032, end: 0x1B037, modernKana: 'け' }),
    Object.freeze({ start: 0x1B038, end: 0x1B03A, modernKana: 'こ' }),
    Object.freeze({ start: 0x1B03C, end: 0x1B043, modernKana: 'さ' }),
    Object.freeze({ start: 0x1B044, end: 0x1B049, modernKana: 'し' }),
    Object.freeze({ start: 0x1B04A, end: 0x1B051, modernKana: 'す' }),
    Object.freeze({ start: 0x1B052, end: 0x1B056, modernKana: 'せ' }),
    Object.freeze({ start: 0x1B057, end: 0x1B05D, modernKana: 'そ' }),
    Object.freeze({ start: 0x1B05E, end: 0x1B061, modernKana: 'た' }),
    Object.freeze({ start: 0x1B062, end: 0x1B068, modernKana: 'ち' }),
    Object.freeze({ start: 0x1B069, end: 0x1B06C, modernKana: 'つ' }),
    Object.freeze({ start: 0x1B06E, end: 0x1B076, modernKana: 'て' }),
    Object.freeze({ start: 0x1B077, end: 0x1B07C, modernKana: 'と' }),
    Object.freeze({ start: 0x1B07E, end: 0x1B086, modernKana: 'な' }),
    Object.freeze({ start: 0x1B087, end: 0x1B08D, modernKana: 'に' }),
    Object.freeze({ start: 0x1B08F, end: 0x1B091, modernKana: 'ぬ' }),
    Object.freeze({ start: 0x1B092, end: 0x1B097, modernKana: 'ね' }),
    Object.freeze({ start: 0x1B099, end: 0x1B09D, modernKana: 'の' }),
    Object.freeze({ start: 0x1B09E, end: 0x1B0A8, modernKana: 'は' }),
    Object.freeze({ start: 0x1B0A9, end: 0x1B0AF, modernKana: 'ひ' }),
    Object.freeze({ start: 0x1B0B0, end: 0x1B0B2, modernKana: 'ふ' }),
    Object.freeze({ start: 0x1B0B3, end: 0x1B0B9, modernKana: 'へ' }),
    Object.freeze({ start: 0x1B0BA, end: 0x1B0C1, modernKana: 'ほ' }),
    Object.freeze({ start: 0x1B0C2, end: 0x1B0C8, modernKana: 'ま' }),
    Object.freeze({ start: 0x1B0C9, end: 0x1B0CF, modernKana: 'み' }),
    Object.freeze({ start: 0x1B0D0, end: 0x1B0D3, modernKana: 'む' }),
    Object.freeze({ start: 0x1B0D4, end: 0x1B0D5, modernKana: 'め' }),
    Object.freeze({ start: 0x1B0D7, end: 0x1B0DC, modernKana: 'も' }),
    Object.freeze({ start: 0x1B0DD, end: 0x1B0E1, modernKana: 'や' }),
    Object.freeze({ start: 0x1B0E3, end: 0x1B0E6, modernKana: 'ゆ' }),
    Object.freeze({ start: 0x1B0E7, end: 0x1B0EC, modernKana: 'よ' }),
    Object.freeze({ start: 0x1B0ED, end: 0x1B0F0, modernKana: 'ら' }),
    Object.freeze({ start: 0x1B0F1, end: 0x1B0F7, modernKana: 'り' }),
    Object.freeze({ start: 0x1B0F8, end: 0x1B0FD, modernKana: 'る' }),
    Object.freeze({ start: 0x1B0FE, end: 0x1B101, modernKana: 'れ' }),
    Object.freeze({ start: 0x1B102, end: 0x1B107, modernKana: 'ろ' }),
    Object.freeze({ start: 0x1B108, end: 0x1B10C, modernKana: 'わ' }),
    Object.freeze({ start: 0x1B10D, end: 0x1B111, modernKana: 'ゐ' }),
    Object.freeze({ start: 0x1B112, end: 0x1B115, modernKana: 'ゑ' }),
    Object.freeze({ start: 0x1B116, end: 0x1B11C, modernKana: 'を' })
]);

function getHistoricalSingleValuedHentaiganaModernKana(character) {
    const value = String(character || '');
    if (!value) return null;
    const codePoint = value.codePointAt(0);
    if (typeof codePoint !== 'number' || !Number.isInteger(codePoint)) return null;
    for (const range of historicalSingleValuedHentaiganaRanges) {
        if (codePoint >= range.start && codePoint <= range.end) return range.modernKana;
    }
    return null;
}

function normalizeHistoricalSingleValuedHentaigana(value) {
    const normalized = Array.from(String(value || ''), character =>
        getHistoricalSingleValuedHentaiganaModernKana(character) || character
    ).join('');
    // Hentaigana may carry dakuten or handakuten. Once a single-valued
    // historical glyph has been reduced to ordinary kana, reuse the same
    // spacing-mark conversion and NFC composition as the modern-kana path.
    // Ambiguous hentaigana are deliberately left unmapped, so their marks
    // remain unresolved rather than being guessed.
    return normalizeSpacingKanaVoicingMarks(normalized).normalize('NFC');
}

// CODH/NINJAL document these code points with more than one modern-kana value.
// Historical mode may resolve one only when an exact kana run has exactly one
// candidate backed by strong maintained whole-word lexical reading evidence.
const historicalAmbiguousHentaiganaCandidateMap = Object.freeze({
    '𛀅': Object.freeze(['あ', 'を']),
    '𛀢': Object.freeze(['か', 'け']),
    '𛀻': Object.freeze(['き', 'こ']),
    '𛁭': Object.freeze(['つ', 'と']),
    '𛁽': Object.freeze(['と', 'ら']),
    '𛂎': Object.freeze(['に', 'て']),
    '𛂘': Object.freeze(['ね', 'こ']),
    '𛃖': Object.freeze(['ま', 'め']),
    '𛃢': Object.freeze(['や', 'よ']),
    '𛄝': Object.freeze(['む', 'も', 'ん']),
    '𛄞': Object.freeze(['む', 'も', 'ん'])
});

function getHistoricalAmbiguousHentaiganaCandidates(character) {
    const candidates = historicalAmbiguousHentaiganaCandidateMap[String(character || '')];
    return candidates ? [...candidates] : [];
}

function isHistoricalContextualHentaiganaRunCharacter(character) {
    const value = String(character || '');
    return Boolean(value) && (
        /^[ぁ-ゖゟァ-ヺヿー]$/u.test(value)
        || /^[゛゜゙゚]$/u.test(value)
        || isHistoricalJapaneseKanaExtensionCharacter(value)
    );
}

function isHistoricalContextOrdinaryKanaCharacter(character) {
    return /^[ぁ-ゖゟァ-ヺヿー]$/u.test(String(character || ''));
}

function getStrongHistoricalKanaLexicalEvidence(reading) {
    const normalized = normalizeKanaReading(normalizeSpacingKanaVoicingMarks(reading).normalize('NFC'));
    const evidence = runtimeState.kanaLexicalReadingDictionary.get(normalized) || null;
    return evidence?.strongSources?.size ? { normalized, evidence } : null;
}

function resolveHistoricalContextualKanaRun(value, candidateProvider) {
    const source = String(value || '');
    const characters = Array.from(source);
    const ambiguousIndexes = [];
    let ordinaryContextCount = 0;
    let combinationCount = 1;
    for (let index = 0; index < characters.length; index += 1) {
        const candidates = candidateProvider(characters[index]);
        if (candidates.length) {
            ambiguousIndexes.push(index);
            combinationCount *= candidates.length;
            if (combinationCount > 64) return source;
        } else if (isHistoricalContextOrdinaryKanaCharacter(characters[index])) {
            ordinaryContextCount += 1;
        }
    }
    if (!ambiguousIndexes.length || ordinaryContextCount < 1) return source;

    let variants = [{ characters: [...characters] }];
    for (const index of ambiguousIndexes) {
        const candidates = candidateProvider(characters[index]);
        const next = [];
        for (const variant of variants) {
            for (const candidate of candidates) {
                const updated = [...variant.characters];
                updated[index] = candidate;
                next.push({ characters: updated });
            }
        }
        variants = next;
    }

    const viable = new Map();
    for (const variant of variants) {
        const candidateSurface = normalizeSpacingKanaVoicingMarks(variant.characters.join('')).normalize('NFC');
        const lexical = getStrongHistoricalKanaLexicalEvidence(candidateSurface);
        if (!lexical) continue;
        if (!viable.has(lexical.normalized)) viable.set(lexical.normalized, candidateSurface);
    }
    return viable.size === 1 ? [...viable.values()][0] : source;
}

function resolveHistoricalAmbiguousHentaiganaKanaRun(value) {
    return resolveHistoricalContextualKanaRun(value, getHistoricalAmbiguousHentaiganaCandidates);
}

const historicalArchaicYeDualIdentityCandidates = Object.freeze(['え', 'いぇ']);

function getHistoricalArchaicYeDualIdentityCandidates(character) {
    return String(character || '') === '𛀁' ? [...historicalArchaicYeDualIdentityCandidates] : [];
}

function resolveHistoricalArchaicYeDualIdentityKanaRun(value) {
    return resolveHistoricalContextualKanaRun(value, getHistoricalArchaicYeDualIdentityCandidates);
}

function getHistoricalContextualKanaExtensionCandidates(character) {
    const hentaigana = getHistoricalAmbiguousHentaiganaCandidates(character);
    return hentaigana.length ? hentaigana : getHistoricalArchaicYeDualIdentityCandidates(character);
}

function resolveHistoricalContextualKanaExtensionRun(value) {
    return resolveHistoricalContextualKanaRun(value, getHistoricalContextualKanaExtensionCandidates);
}

function normalizeHistoricalContextualKanaRuns(value, resolver) {
    const source = String(value || '');
    let output = '';
    let run = '';
    const flush = () => {
        if (!run) return;
        output += resolver(run);
        run = '';
    };
    for (const character of Array.from(source)) {
        if (isHistoricalContextualHentaiganaRunCharacter(character)) run += character;
        else {
            flush();
            output += character;
        }
    }
    flush();
    return output;
}

function normalizeHistoricalContextResolvedHentaigana(value) {
    return normalizeHistoricalContextualKanaRuns(value, resolveHistoricalAmbiguousHentaiganaKanaRun);
}

function normalizeHistoricalContextResolvedArchaicYe(value) {
    return normalizeHistoricalContextualKanaRuns(value, resolveHistoricalArchaicYeDualIdentityKanaRun);
}

function normalizeHistoricalContextResolvedKanaExtensions(value) {
    return normalizeHistoricalContextualKanaRuns(value, resolveHistoricalContextualKanaExtensionRun);
}

const historicalVerticalKanaRepeatMarkVoicing = Object.freeze({ '〱': false, '〲': true });

function isHistoricalVerticalRepeatableKana(character) {
    return /^[\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(String(character || ''));
}

function voiceHistoricalVerticalRepeatKana(character) {
    const source = String(character || '');
    if (!isHistoricalVerticalRepeatableKana(source)) return null;
    const decomposed = source.normalize('NFD').replace(/[\u3099\u309A]/gu, '');
    const voiced = (decomposed + '\u3099').normalize('NFC');
    if (voiced === source || !isHistoricalVerticalRepeatableKana(voiced)) return null;
    const romaji = convertToRomaji(voiced);
    return /^[A-Za-z']+$/u.test(romaji) ? voiced : null;
}

function normalizeHistoricalVerticalIterationMarks(value) {
    const canonical = String(value || '')
        .replace(/〳〵/gu, '〱')
        .replace(/〴〵/gu, '〲')
        .replace(/〻/gu, '々');
    const output = [];
    for (const character of Array.from(canonical)) {
        if (!Object.prototype.hasOwnProperty.call(historicalVerticalKanaRepeatMarkVoicing, character)) {
            output.push(character);
            continue;
        }
        if (output.length < 2) {
            output.push(character);
            continue;
        }
        const pair = output.slice(-2);
        if (!pair.every(isHistoricalVerticalRepeatableKana)) {
            output.push(character);
            continue;
        }
        let [first, second] = pair;
        if (historicalVerticalKanaRepeatMarkVoicing[character]) {
            first = voiceHistoricalVerticalRepeatKana(first);
            if (!first) {
                output.push(character);
                continue;
            }
        }
        output.push(first, second);
    }
    return output.join('');
}

const syllabicNApostropheFollowers = /^[あいうえおやゆよぁぃぅぇぉゃゅょ]/u;

function readingEndsInSyllabicN(value) {
    return /ん$/u.test(normalizeKanaReading(value));
}

function readingStartsWithVowelOrY(value) {
    return syllabicNApostropheFollowers.test(normalizeKanaReading(value));
}

function needsSyllabicNApostrophe(leftReading, rightReading) {
    return readingEndsInSyllabicN(leftReading) && readingStartsWithVowelOrY(rightReading);
}

const ideographicDecimalDigitMap = Object.freeze({
    '〇':'0','一':'1','二':'2','三':'3','四':'4','五':'5','六':'6','七':'7','八':'8','九':'9'
});
const ideographicDecimalDigitSurfacePattern = /^[0-9〇一二三四五六七八九]+$/u;

function canonicalizeIdeographicDecimalNotationSurface(value) {
    const surface = String(value || '');
    return surface.replace(/[0-9〇一二三四五六七八九]+/gu, run => {
        if (!run.includes('〇')) return run;
        return Array.from(run).map(character => ideographicDecimalDigitMap[character] || character).join('');
    });
}

function isIdeographicDecimalDigitSurface(value) {
    return ideographicDecimalDigitSurfacePattern.test(String(value || ''));
}

const japaneseNumeralSurfacePattern = /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u;
const numericGroupTerminalPattern = /[百千万億兆]$/u;
const largeNumericUnitSurfaces = new Set(['万', '億', '兆']);
const separatedNumericUnitSurfaces = new Set(['円']);

function isJapaneseNumeralSurface(value) {
    return japaneseNumeralSurfacePattern.test(String(value || ''));
}

function isSeparatedNumericUnitSurface(value) {
    return separatedNumericUnitSurfaces.has(String(value || ''));
}

function isLargeNumericUnitSurface(value) {
    return largeNumericUnitSurfaces.has(String(value || ''));
}

function isStructuredNumericUnitSurface(value) {
    const surface = String(value || '');
    for (const unit of separatedNumericUnitSurfaces) {
        if (surface.endsWith(unit) && isJapaneseNumeralSurface(surface.slice(0, -unit.length))) return true;
    }
    return false;
}

const sokuonGeminateRomajiInitials = new Set(['b','c','d','f','g','h','j','k','p','s','t','v','z']);

function isSokuonGeminateableReading(reading) {
    const initial = String(reading || '').match(/^[a-z]/)?.[0] || '';
    return sokuonGeminateRomajiInitials.has(initial);
}

const contractedKanaMap = Object.freeze({
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','きぇ':'kye','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','ぎぇ':'gye',
    'しゃ':'sha','しゅ':'shu','しょ':'sho','しぇ':'she','じゃ':'ja','じゅ':'ju','じょ':'jo','じぇ':'je',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','ちぇ':'che','ぢゃ':'ja','ぢゅ':'ju','ぢょ':'jo','ぢぇ':'je',
    'にゃ':'nya','にゅ':'nyu','にょ':'nyo','にぇ':'nye','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','ひぇ':'hye',
    'びゃ':'bya','びゅ':'byu','びょ':'byo','びぇ':'bye','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','ぴぇ':'pye',
    'みゃ':'mya','みゅ':'myu','みょ':'myo','みぇ':'mye','りゃ':'rya','りゅ':'ryu','りょ':'ryo','りぇ':'rye',
    'いぃ':'yi','いぇ':'ye',
    'うぁ':'wa','うぃ':'wi','うぅ':'wu','うぇ':'we','うぉ':'wo','うゃ':'wya','うゅ':'wyu','うぃぇ':'wye','うょ':'wyo',
    'くぁ':'kwa','くぃ':'kwi','くぇ':'kwe','くぉ':'kwo','くゎ':'kwa',
    'ぐぁ':'gwa','ぐぃ':'gwi','ぐぇ':'gwe','ぐぉ':'gwo','ぐゎ':'gwa',
    'すぃ':'si','ずぃ':'zi',
    'つぁ':'tsa','つぃ':'tsi','つぇ':'tse','つぉ':'tso','つゃ':'tsya','つゅ':'tsyu','つぃぇ':'tsye','つょ':'tsyo',
    'づぁ':'za','づぃ':'zi','づぇ':'ze','づぉ':'zo','づゃ':'zya','づゅ':'zyu','づぃぇ':'zye','づょ':'zyo',
    'てぃ':'ti','てゅ':'tyu','とぅ':'tu','とぃ':'twi',
    'でぃ':'di','でゅ':'dyu','どぅ':'du','どぃ':'dwi',
    'ぬぃ':'nwi','ぶぃ':'bwi','ぷぃ':'pwi','むぃ':'mwi','ゆぃ':'ywi','ゆぇ':'ye','るぃ':'rwi',
    'ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','ふゃ':'fya','ふゅ':'fyu','ふぃぇ':'fye','ふょ':'fyo',
    'ほぅ':'hu',
    'ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo','ゔゃ':'vya','ゔゅ':'vyu','ゔぃぇ':'vye','ゔょ':'vyo'
});

function hasUnresolvableProlongedSoundMark(text) {
    const normalizedText = normalizeKanaReading(text);
    let previousVowel = '';
    for (let index = 0; index < normalizedText.length; index += 1) {
        const char = normalizedText[index];
        if (char === 'ー') {
            if (!previousVowel) return true;
            continue;
        }
        if (char === 'っ' || char === 'ん') {
            previousVowel = '';
            continue;
        }
        const triple = normalizedText.slice(index, index + 3);
        const pair = normalizedText.slice(index, index + 2);
        const contracted = contractedKanaMap[triple] || contractedKanaMap[pair] || '';
        const reading = contracted || kanaToRomajiMap[char] || '';
        if (contracted) index += contractedKanaMap[triple] ? 2 : 1;
        previousVowel = reading.match(/[aeiou]$/)?.[0] || '';
    }
    return false;
}

function convertToRomaji(text) {
    const normalizedText = normalizeKanaReading(text);

    const romaji = [];
    let pendingDouble = false;
    for (let index = 0; index < normalizedText.length; index += 1) {
        const char = normalizedText[index];
        if (char === 'っ') {
            pendingDouble = true;
            continue;
        }
        if (char === 'ー') {
            const previous = romaji[romaji.length - 1] || '';
            const vowel = previous.match(/[aeiou]$/);
            if (vowel) romaji.push(vowel[0]);
            pendingDouble = false;
            continue;
        }
        if (char === 'ん' && readingStartsWithVowelOrY(normalizedText.slice(index + 1))) {
            romaji.push("n'");
            continue;
        }
        const triple = normalizedText.slice(index, index + 3);
        const pair = normalizedText.slice(index, index + 2);
        const contracted = contractedKanaMap[triple] || contractedKanaMap[pair] || '';
        const reading = contracted || kanaToRomajiMap[char] || char;
        if (contracted) index += contractedKanaMap[triple] ? 2 : 1;
        if (pendingDouble && isSokuonGeminateableReading(reading)) romaji.push(reading[0]);
        romaji.push(reading);
        pendingDouble = false;
    }
    return romaji.join('');
}

// The external grammar file is authoritative. The two fallback entries in
// runtime state are bootstrap values only; loaded configuration takes precedence.

// Source section: Lexical banks, proper nouns, grammar and reading/Rendaku/historical evidence loaders.
const lexicalTermBankFiles = {
    commonWords: getAssetPaths('commonWords'),
    generalWords: getAssetPaths('generalWords'),
    loanwords: getAssetPaths('loanwords'),
    compoundWords: getAssetPaths('compoundWords'),
    ateji: getAssetPaths('ateji'),
    properNouns: getAssetPaths('properNouns'),
    reviewedProperNameSpans: getAssetPaths('reviewedProperNameSpans'),
    contextualReadings: getAssetPaths('contextualReadingEvidence'),
    titleReadings: getAssetPaths('titleReadingEvidence')
};

function normalizeDictionaryReading(value) {
    return normalizeEvidenceReading(value);
}

function normalizeDictionaryRomaji(value) {
    return normalizeReviewedRomaji(value);
}

function dictionaryValuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function setUniqueDictionaryEntry(target, key, value, label) {
    if (!target.has(key)) {
        target.set(key, value);
        return value;
    }
    const existing = target.get(key);
    if (!dictionaryValuesEqual(existing, value)) throw new Error(`Conflicting ${label} entries for ${key}`);
    return existing;
}

function setUniqueDictionaryProperty(target, key, value, label) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
        target[key] = value;
        return value;
    }
    if (target[key] !== value) throw new Error(`Conflicting ${label} entries for ${key}`);
    return target[key];
}

function parseCompoundWordMatrix(data) {
    if (!Array.isArray(data)) return;
    for (const entry of data) {
        if (!Array.isArray(entry)) continue;
        const surface = String(entry[0] || '').trim();
        const reading = normalizeDictionaryReading(entry[1]);
        if (!surface || !reading) continue;
        const normalizedReading = normalizeKanaReading(reading);
        const compound = runtimeState.compoundWordDictionary.get(surface) || { readings: [] };
        if (!compound.readings.some(candidate => normalizeKanaReading(candidate.reading) === normalizedReading)) {
            compound.readings.push({ reading, romaji: convertToRomaji(reading) });
        }
        runtimeState.compoundWordDictionary.set(surface, compound);
    }
}

function finalizeCompoundWordDictionary() {
    for (const [surface, compound] of runtimeState.compoundWordDictionary.entries()) {
        if (compound.readings.length === 1) {
            compound.reading = compound.readings[0].reading;
            compound.romaji = compound.readings[0].romaji;
            registerKanaLexicalReadingEvidence(surface, compound.reading, 'compound-word');
        } else {
            compound.reading = null;
            compound.romaji = null;
        }
    }
}

async function loadCompoundWordDictionary() {
    runtimeState.compoundWordDictionary.clear();
    runtimeState.compoundWordPrefixes.clear();
    for (const filePath of lexicalTermBankFiles.compoundWords) {
        const data = await fetchJsonAsset('compoundWords', filePath, `Compound-word term bank unavailable: ${filePath}`);
        if (Array.isArray(data)) parseCompoundWordMatrix(data);
    }
    finalizeCompoundWordDictionary();
    for (const surface of runtimeState.compoundWordDictionary.keys()) addSurfacePrefixes(runtimeState.compoundWordPrefixes, surface);
}


async function loadContextualReadingEvidence() {
    runtimeState.contextFeatureGroups.clear();
    runtimeState.contextualReadingDictionary.clear();
    for (const filePath of lexicalTermBankFiles.contextualReadings) {
        const data = await fetchJsonAsset('contextualReadingEvidence', filePath, `Contextual reading evidence unavailable: ${filePath}`);
        if (!data || !Array.isArray(data.featureGroups) || !Array.isArray(data.entries)) continue;
        for (const group of data.featureGroups) {
            runtimeState.contextFeatureGroups.set(String(group.id), group.terms.map(item => ({ term: String(item.term), weight: Number(item.weight) })));
        }
        for (const entry of data.entries) {
            const surface = String(entry.surface || '').trim();
            if (!surface) continue;
            setUniqueDictionaryEntry(runtimeState.contextualReadingDictionary, surface, {
                window: Number(entry.window),
                minMargin: Number(entry.minMargin),
                source: String(entry.source),
                candidates: entry.candidates.map(candidate => ({
                    reading: normalizeDictionaryReading(candidate.reading),
                    features: candidate.features.map(String),
                    minScore: Number(candidate.minScore)
                }))
            }, 'contextual reading evidence');
        }
    }
}

async function loadCommonWordDictionary() {
    for (const filePath of lexicalTermBankFiles.commonWords) {
        const data = await fetchJsonAsset('commonWords', filePath, `Common-word term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(Array.isArray(entry) ? entry[0] : entry?.surface || '').trim();
            const reading = normalizeDictionaryReading(Array.isArray(entry) ? entry[1] : entry?.reading);
            const patternText = String(Array.isArray(entry) ? entry[2] || '' : entry?.pattern || '').trim();
            const romaji = Array.isArray(entry) ? null : normalizeDictionaryRomaji(entry?.romaji);
            const conjugationClass = Array.isArray(entry) ? '' : String(entry?.conjugationClass || '').trim();
            const tokenReadingAuthority = Array.isArray(entry) ? false : entry?.tokenReadingAuthority === true;
            if (!surface || !reading) continue;
            let pattern = null;
            if (patternText) {
                try { pattern = compileReviewedPattern(canonicalizeReviewedPatternForTokenizerBoundary(patternText), 'u'); }
                catch (error) {
                    console.warn(`Invalid common-word pattern: ${patternText}`, error);
                    runtimeState.resourceWarnings.add(`Invalid common-word pattern: ${patternText}`);
                    continue;
                }
            }
            const rules = runtimeState.commonWordDictionary.get(surface) || [];
            rules.push({ reading, pattern, romaji: romaji || null, conjugationClass: conjugationClass || null, tokenReadingAuthority });
            runtimeState.commonWordDictionary.set(surface, rules);
        }
    }
}

function buildReviewedCommonWordInflectionIndex() {
    runtimeState.commonWordInflectionDictionary.clear();
    runtimeState.commonWordInflectionPrefixes.clear();
    const register = (surface, reading, lemma, conjugationClass) => {
        if (!surface || !reading) return;
        setUniqueDictionaryEntry(runtimeState.commonWordInflectionDictionary, surface, { reading, lemma, conjugationClass }, 'reviewed common-word inflection');
        addSurfacePrefixes(runtimeState.commonWordInflectionPrefixes, surface);
    };
    for (const [surface, rules] of runtimeState.commonWordDictionary.entries()) {
        for (const rule of rules) {
            if (rule.pattern || rule.conjugationClass !== 'godan-ra') continue;
            const surfaceChars = Array.from(surface);
            const readingChars = Array.from(normalizeKanaReading(rule.reading));
            if (surfaceChars.at(-1) !== 'る' || readingChars.at(-1) !== 'る') continue;
            const surfaceStem = surfaceChars.slice(0, -1).join('');
            const readingStem = readingChars.slice(0, -1).join('');
            const endings = [
                ['る','る'], ['らない','らない'], ['らなかった','らなかった'], ['られる','られる'], ['られない','られない'],
                ['らせる','らせる'], ['らせたい','らせたい'], ['らせない','らせない'], ['らせた','らせた'], ['らせて','らせて'],
                ['ります','ります'], ['りました','りました'], ['りたい','りたい'], ['って','って'], ['った','った'],
                ['れば','れば'], ['れ','れ'], ['ろう','ろう']
            ];
            for (const [surfaceEnding, readingEnding] of endings) {
                register(surfaceStem + surfaceEnding, readingStem + readingEnding, surface, rule.conjugationClass);
            }
        }
    }
}

function registerKanaLexicalReadingEvidence(surface, reading, source, options = {}) {
    const cleanSurface = String(surface || '').trim();
    const normalizedReading = normalizeKanaReading(reading || '').trim();
    if (!cleanSurface || !normalizedReading || !/^[ぁ-ゖー]+$/u.test(normalizedReading) || !containsHan(cleanSurface)) return;
    const strong = options.strong !== false;
    const existing = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading) || { surfaces: new Set(), sources: new Set(), strongSources: new Set() };
    if (!existing.strongSources) existing.strongSources = new Set();
    existing.surfaces.add(cleanSurface);
    existing.sources.add(source);
    if (strong) existing.strongSources.add(source);
    runtimeState.kanaLexicalReadingDictionary.set(normalizedReading, existing);
    addSurfacePrefixes(runtimeState.kanaLexicalReadingPrefixes, normalizedReading);
}

function canonicalizeKanaPronunciationForLexicalAlias(reading) {
    // This key is used only to verify that two kana spellings represent the
    // same pronunciation for an already-established lexical entry. It never
    // replaces the written-kana form used for CJ2R output.
    return convertToRomaji(normalizeKanaReading(reading || ''))
        .toLowerCase()
        .replace(/ou/gu, 'oo')
        .replace(/ei/gu, 'ee');
}

function registerTokenizerConfirmedKanaLexicalReadingAliases() {
    if (!runtimeState.tokenizer) return 0;
    let registered = 0;
    for (const [surface, entry] of runtimeState.generalWordDictionary.entries()) {
        if (!entry?.mergeSafe || !containsHan(surface)) continue;
        const longMarkReadings = (entry.readings || []).filter(item => normalizeKanaReading(item?.reading || '').includes('ー'));
        if (!longMarkReadings.length) continue;

        let tokens;
        try {
            tokens = runtimeState.tokenizer.tokenize(surface);
        } catch (_) {
            continue;
        }
        const tokenizerReading = (tokens || []).map(token => String(token?.reading || token?.pronunciation || '')).join('');
        const normalizedAlias = normalizeKanaReading(tokenizerReading).trim();
        if (!normalizedAlias || !/^[ぁ-ゖー]+$/u.test(normalizedAlias)) continue;

        for (const item of longMarkReadings) {
            const attestedReading = normalizeKanaReading(item?.reading || '');
            if (!attestedReading || normalizedAlias === attestedReading) continue;
            if (canonicalizeKanaPronunciationForLexicalAlias(normalizedAlias) !== canonicalizeKanaPronunciationForLexicalAlias(attestedReading)) continue;
            const before = runtimeState.kanaLexicalReadingDictionary.get(normalizedAlias)?.sources?.size || 0;
            registerKanaLexicalReadingEvidence(surface, normalizedAlias, 'general-word-tokenizer-orthographic-alias', { strong: true });
            const after = runtimeState.kanaLexicalReadingDictionary.get(normalizedAlias)?.sources?.size || 0;
            if (after > before) registered += 1;
        }
    }
    return registered;
}

function normalizeGeneralWordReadingEvidence(rowMeta, readings) {
    const readingEvidence = [];
    if (Array.isArray(rowMeta?.readingEvidence)) {
        for (const item of rowMeta.readingEvidence) {
            const reading = normalizeDictionaryReading(item?.reading || '');
            if (!reading) continue;
            const sequences = [];
            if (Array.isArray(item?.sequences)) {
                for (const sequence of item.sequences) if (Number.isInteger(sequence)) sequences.push(sequence);
            }
            readingEvidence.push({
                reading,
                retained: Boolean(item?.retained),
                popularityScore: Number(item?.popularityScore || 0),
                sequences,
                spellingSpecificApplicability: item?.spellingSpecificApplicability === true
            });
        }
    }
    const retainedSet = new Set((readings || []).map(item => normalizeKanaReading(item.reading)));
    const unretainedReadings = [];
    for (const item of readingEvidence) {
        if (!item.retained && !retainedSet.has(normalizeKanaReading(item.reading))) unretainedReadings.push(item);
    }
    return { readingEvidence, unretainedReadings };
}

async function loadGeneralWordDictionary() {
    for (const filePath of lexicalTermBankFiles.generalWords) {
        const data = await fetchJsonAsset('generalWords', filePath, `General-word term bank unavailable: ${filePath}`);
        const bankMeta = data && !Array.isArray(data) && typeof data === 'object' ? (data._meta || {}) : {};
        const entries = Array.isArray(data) ? data : (Array.isArray(data?.entries) ? data.entries : []);
        if (!entries.length) continue;
        for (const entry of entries) {
            if (!Array.isArray(entry)) continue;
            const surface = String(entry[0] || '').trim();
            const rawReadings = Array.isArray(entry[1]) ? entry[1] : [];
            const mergeSafe = Boolean(entry[2]);
            const rowMeta = entry[3] && typeof entry[3] === 'object' && !Array.isArray(entry[3]) ? entry[3] : {};
            if (!surface || !rawReadings.length) continue;
            const readings = rawReadings.map(item => {
                const popularityScore = Number(Array.isArray(item) ? item[1] || 0 : 0);
                return {
                    reading: normalizeDictionaryReading(Array.isArray(item) ? item[0] : ''),
                    popularityScore,
                    score: popularityScore
                };
            }).filter(item => item.reading).sort((a, b) => b.popularityScore - a.popularityScore || a.reading.localeCompare(b.reading, 'ja'));
            if (!readings.length) continue;
            const { readingEvidence, unretainedReadings } = normalizeGeneralWordReadingEvidence(rowMeta, readings);
            const readingCoverage = String(rowMeta.readingCoverage || bankMeta.defaultReadingCoverage || 'unknown');
            const restrictionStatus = String(rowMeta.restrictionStatus || bankMeta.defaultRestrictionStatus || 'unknown');
            setUniqueDictionaryEntry(runtimeState.generalWordDictionary, surface, {
                readings, mergeSafe, readingCoverage, restrictionStatus,
                sourceReadingCount: Number.isInteger(rowMeta.sourceReadingCount) ? rowMeta.sourceReadingCount : null,
                readingEvidence, unretainedReadings,
                scoreSemantics: String(bankMeta.scoreSemantics || 'unknown')
            }, 'general-word');
            for (const item of readings) {
                registerKanaLexicalReadingEvidence(surface, item.reading, mergeSafe ? 'general-word' : 'general-word-reading-alias', { strong: mergeSafe });
            }
            const chars = Array.from(surface);
            for (let length = 1; length <= chars.length; length += 1) {
                runtimeState.generalWordPrefixes.add(chars.slice(0, length).join(''));
            }
        }
    }
}

async function loadLoanwordDictionary() {
    for (const filePath of lexicalTermBankFiles.loanwords) {
        const data = await fetchJsonAsset('loanwords', filePath, `Loanword term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(Array.isArray(entry) ? entry[0] : entry?.surface || '').trim();
            const output = normalizeDictionaryRomaji(Array.isArray(entry) ? entry[1] : entry?.output);
            if (!surface) continue;
            if (output) setUniqueDictionaryEntry(runtimeState.loanwordDictionary, surface, output, 'loanword');
            if (Array.isArray(entry)) continue;
            const category = String(entry?.category || '').trim();
            const requiresReview = Boolean(entry?.requiresReview);
            const reviewReason = String(entry?.reviewReason || '').trim();
            const ambiguitySignificance = String(entry?.ambiguitySignificance || '').trim();
            const alternates = Array.isArray(entry?.alternates) ? entry.alternates.map(item => ({
                output: normalizeDictionaryRomaji(item?.output),
                significance: String(item?.significance || '').trim()
            })).filter(item => item.output && item.significance) : [];
            const context = entry?.context ? {
                window: Number(entry.context.window),
                minMargin: Number(entry.context.minMargin),
                source: String(entry.context.source || '').trim(),
                candidates: Array.isArray(entry.context.candidates) ? entry.context.candidates.map(candidate => ({
                    output: normalizeDictionaryRomaji(candidate?.output),
                    minScore: Number(candidate?.minScore),
                    terms: Array.isArray(candidate?.terms) ? candidate.terms.map(term => ({
                        term: String(term?.term || ''),
                        weight: Number(term?.weight)
                    })).filter(term => term.term && Number.isFinite(term.weight) && term.weight > 0) : []
                })).filter(candidate => candidate.output && candidate.terms.length) : []
            } : null;
            if (category || requiresReview || reviewReason || ambiguitySignificance || alternates.length || context) {
                setUniqueDictionaryEntry(runtimeState.loanwordMetadataDictionary, surface, {
                    category: category || null,
                    requiresReview,
                    reviewReason: reviewReason || null,
                    ambiguitySignificance: ambiguitySignificance || null,
                    alternates,
                    context
                }, 'loanword metadata');
            }
        }
    }
}

async function loadAtejiDictionary() {
    for (const filePath of lexicalTermBankFiles.ateji) {
        const data = await fetchJsonAsset('ateji', filePath, `Ateji term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            if (!Array.isArray(entry)) continue;
            const surface = String(entry[0] || '').trim();
            const reading = normalizeDictionaryReading(entry[1]);
            if (!surface || !reading) continue;
            setUniqueDictionaryEntry(runtimeState.atejiDictionary, surface, reading, 'ateji');
            const chars = Array.from(surface);
            for (let length = 1; length <= chars.length; length += 1) runtimeState.atejiPrefixes.add(chars.slice(0, length).join(''));
        }
    }
}

function parseProperNounReadingHints(entry) {
    const hints = [];
    const labels = Array.isArray(entry?.[5]) ? entry[5] : [];
    for (const label of labels) {
        const match = String(label || '').match(/^([ぁ-ゖァ-ヶー]+)\s*\((\d+(?:\.\d+)?)%\)\s*-\s*([A-Za-z-]+)/u);
        if (!match) continue;
        hints.push({ reading: match[1], weight: Number(match[2]), category: match[3] });
    }
    return hints;
}

function registerProperNounCandidate(surface, reading, metadata = {}) {
    const cleanSurface = String(surface || '').trim();
    const cleanReading = normalizeDictionaryReading(reading);
    if (!cleanSurface || !cleanReading) return;
    addSurfacePrefixes(runtimeState.properNounPrefixes, cleanSurface);
    const normalized = normalizeKanaReading(cleanReading);
    let candidates = runtimeState.properNounDictionary.get(cleanSurface);
    if (!candidates) {
        candidates = new Map();
        runtimeState.properNounDictionary.set(cleanSurface, candidates);
    }
    const existing = candidates.get(normalized) || {
        reading: cleanReading,
        romaji: convertToRomaji(cleanReading),
        weight: 0,
        rank: Number.POSITIVE_INFINITY,
        categories: new Set(),
        sources: new Set()
    };
    existing.weight = Math.max(existing.weight, Number(metadata.weight || 0));
    const rank = Number(metadata.rank || 0);
    if (rank > 0) existing.rank = Math.min(existing.rank, rank);
    if (metadata.category) existing.categories.add(String(metadata.category));
    if (metadata.source) existing.sources.add(String(metadata.source));
    candidates.set(normalized, existing);
}

function candidateHasProperNounSource(candidate, fileName) {
    return [...(candidate?.sources || [])].some(source => String(source || '').endsWith(`/nouns/${fileName}`));
}

function buildProperNounPersonComponentCorroborationIndex() {
    const jmnedictPeople = [];
    for (const [surface, candidates] of runtimeState.properNounDictionary.entries()) {
        for (const candidate of candidates.values()) {
            if (candidate.categories?.has('person') && candidateHasProperNounSource(candidate, 'jmnedict-bank-1.json')) {
                jmnedictPeople.push({ surface, candidate });
            }
        }
    }

    for (const person of jmnedictPeople) {
        const personSurface = String(person.surface || '');
        const personReading = normalizeKanaReading(person.candidate.reading || '');
        const characters = Array.from(personSurface);
        if (!personReading || characters.length < 3) continue;
        for (let offset = 1; offset < characters.length; offset += 1) {
            for (const alignment of ['prefix', 'suffix']) {
                const componentSurface = alignment === 'prefix'
                    ? characters.slice(0, characters.length - offset).join('')
                    : characters.slice(offset).join('');
                if (Array.from(componentSurface).filter(isHanCharacter).length < 2) continue;
                const candidates = runtimeState.properNounDictionary.get(componentSurface);
                if (!candidates?.size) continue;
                for (const candidate of candidates.values()) {
                    if (!candidate.categories?.has('per') || !candidateHasProperNounSource(candidate, 'nouns-term-bank-1.json')) continue;
                    const componentReading = normalizeKanaReading(candidate.reading || '');
                    if (!componentReading) continue;
                    const readingAligned = alignment === 'prefix'
                        ? personReading.startsWith(componentReading)
                        : personReading.endsWith(componentReading);
                    if (!readingAligned) continue;
                    if (!(candidate.personComponentCorroborations instanceof Set)) candidate.personComponentCorroborations = new Set();
                    candidate.personComponentCorroborations.add([
                        'jmnedict-person-component', alignment, person.surface, person.candidate.reading
                    ].join('|'));
                }
            }
        }
    }
}

function getProperNounSourceRank(entry) {
    if (!Array.isArray(entry)) return 0;
    const value = Number(entry.length > 6 ? entry[6] : entry[3]);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function registerProperNounEntry(entry, sourceName) {
    if (isPlainObject(entry)) {
        const surface = String(entry.surface || '').trim();
        const rank = Number(entry.rank || 0);
        if (!surface || !Array.isArray(entry.readings)) return;
        for (const candidate of entry.readings) {
            const reading = normalizeDictionaryReading(candidate?.reading);
            if (!reading) continue;
            const categories = Array.isArray(candidate.categories) ? candidate.categories : [];
            if (!categories.length) {
                registerProperNounCandidate(surface, reading, { source: sourceName, weight: candidate.weight, rank });
                continue;
            }
            for (const category of categories) {
                registerProperNounCandidate(surface, reading, { category, source: sourceName, weight: candidate.weight, rank });
            }
        }
        return;
    }
    if (!Array.isArray(entry) || !entry[0] || !entry[1]) return;
    const surface = String(entry[0]).trim();
    const reading = normalizeDictionaryReading(entry[1]);
    const category = String(entry[2] || '').trim();
    if (!surface || !reading) return;
    const hints = parseProperNounReadingHints(entry);
    const normalizedReading = normalizeKanaReading(reading);
    let directHint = null;
    for (const hint of hints) {
        if (normalizeKanaReading(hint.reading) === normalizedReading) { directHint = hint; break; }
    }
    const rank = getProperNounSourceRank(entry);
    registerProperNounCandidate(surface, reading, {
        category, source: sourceName, weight: directHint ? directHint.weight : 100, rank
    });
    for (const hint of hints) {
        registerProperNounCandidate(surface, hint.reading, {
            category: hint.category || category, source: sourceName, weight: hint.weight, rank
        });
    }
}

async function loadReviewedProperNameSpanEvidence() {
    for (const filePath of lexicalTermBankFiles.reviewedProperNameSpans) {
        const data = await fetchJsonAsset('reviewedProperNameSpans', filePath, `Reviewed proper-name span evidence unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(entry?.surface || '').trim().replace(/\s+/gu, ' ');
            const reading = normalizeDictionaryReading(entry?.reading);
            const romaji = normalizeDictionaryRomaji(entry?.romaji);
            const category = String(entry?.category || '').trim();
            if (!surface || !reading || !romaji || !category) continue;
            setUniqueDictionaryEntry(runtimeState.reviewedProperNameSpanDictionary, surface, { reading, romaji, category }, 'reviewed proper-name span');
            const chars = Array.from(surface);
            for (let length = 1; length <= chars.length; length += 1) runtimeState.reviewedProperNameSpanPrefixes.add(chars.slice(0, length).join(''));
        }
    }
}

function buildLexicalPrefixIndexes() {
    runtimeState.commonWordPrefixes.clear();
    runtimeState.loanwordPrefixes.clear();

    // Reviewed common-word evidence is authored against source orthography, but an
    // earlier exact-dictionary rescue may canonicalise a kanji variant (for example
    // 龍 → 竜). Register a canonical lookup alias only when no explicit canonical
    // rule exists. This keeps explicit evidence authoritative while allowing later
    // reviewed lexical spans to survive harmless orthographic normalisation.
    const commonWordEntries = [...runtimeState.commonWordDictionary.entries()];
    const commonWordVariantAliases = new Map();
    for (const [surface, rules] of commonWordEntries) {
        const normalizedSurface = normalizeKanjiForLookup(surface);
        if (!normalizedSurface || normalizedSurface === surface || runtimeState.commonWordDictionary.has(normalizedSurface)) continue;
        if (!commonWordVariantAliases.has(normalizedSurface)) commonWordVariantAliases.set(normalizedSurface, rules);
        else if (commonWordVariantAliases.get(normalizedSurface) !== rules) commonWordVariantAliases.set(normalizedSurface, null);
    }
    for (const [normalizedSurface, rules] of commonWordVariantAliases) {
        if (rules) runtimeState.commonWordDictionary.set(normalizedSurface, rules);
    }

    for (const surface of runtimeState.commonWordDictionary.keys()) {
        addSurfacePrefixes(runtimeState.commonWordPrefixes, surface);
        addSurfacePrefixes(runtimeState.commonWordPrefixes, normalizeKanjiForLookup(surface));
    }
    buildReviewedCommonWordInflectionIndex();

    const titleReadingRules = [...runtimeState.titleReadingDictionary.values()].flat();
    runtimeState.titleReadingDictionary.clear();
    runtimeState.titleReadingPrefixes.clear();
    for (const rule of titleReadingRules) {
        const normalizedSurface = normalizeTranslatorInputText(rule.surface);
        if (!normalizedSurface) continue;
        const normalizedPatternText = canonicalizeReviewedPatternForTokenizerBoundary(rule.patternText);
        try { rule.pattern = compileReviewedPattern(normalizedPatternText, 'i'); }
        catch (error) {
            console.warn(`Invalid normalized title-reading pattern: ${rule.patternText}`, error);
            runtimeState.resourceWarnings.add(`Invalid normalized title-reading evidence: ${rule.patternText}`);
            continue;
        }
        const rules = runtimeState.titleReadingDictionary.get(normalizedSurface) || [];
        rules.push(rule);
        runtimeState.titleReadingDictionary.set(normalizedSurface, rules);
        addSurfacePrefixes(runtimeState.titleReadingPrefixes, normalizedSurface);
    }

    const loanwordEntries = [...runtimeState.loanwordDictionary.entries()];
    for (const [surface, output] of loanwordEntries) {
        const normalizedSurface = normalizeTranslatorInputText(surface);
        if (normalizedSurface && normalizedSurface !== surface) {
            const existingOutput = runtimeState.loanwordDictionary.get(normalizedSurface);
            if (!existingOutput) {
                runtimeState.loanwordDictionary.set(normalizedSurface, output);
                const metadata = runtimeState.loanwordMetadataDictionary.get(surface);
                if (metadata) runtimeState.loanwordMetadataDictionary.set(normalizedSurface, metadata);
            } else if (existingOutput !== output) {
                runtimeState.resourceWarnings.add(`Loanword normalization alias conflict: ${surface} -> ${normalizedSurface}`);
            }
        }
    }

    const loanwordMetadataEntries = [...runtimeState.loanwordMetadataDictionary.entries()];
    for (const [surface, metadata] of loanwordMetadataEntries) {
        const normalizedSurface = normalizeTranslatorInputText(surface);
        if (!normalizedSurface || normalizedSurface === surface) continue;
        const existingMetadata = runtimeState.loanwordMetadataDictionary.get(normalizedSurface);
        if (!existingMetadata) runtimeState.loanwordMetadataDictionary.set(normalizedSurface, metadata);
        else if (JSON.stringify(existingMetadata) !== JSON.stringify(metadata)) runtimeState.resourceWarnings.add(`Loanword metadata normalization alias conflict: ${surface} -> ${normalizedSurface}`);
    }

    for (const surface of runtimeState.loanwordDictionary.keys()) {
        addSurfacePrefixes(runtimeState.loanwordPrefixes, surface);
        addSurfacePrefixes(runtimeState.loanwordPrefixes, normalizeKanjiForLookup(surface));
    }

    runtimeState.properNounVariantEvidenceSurfaces.clear();
    runtimeState.properNounVariantEvidencePrefixes.clear();
    for (const surface of runtimeState.properNounDictionary.keys()) {
        const canonicalSurface = normalizeKanjiForLookup(surface, { names: true });
        if (!canonicalSurface) continue;
        let sourceSurfaces = runtimeState.properNounVariantEvidenceSurfaces.get(canonicalSurface);
        if (!sourceSurfaces) {
            sourceSurfaces = new Set();
            runtimeState.properNounVariantEvidenceSurfaces.set(canonicalSurface, sourceSurfaces);
        }
        sourceSurfaces.add(surface);
        addSurfacePrefixes(runtimeState.properNounVariantEvidencePrefixes, canonicalSurface);
    }
}


function escapeCanonicalizedReviewedPatternLiteral(value, inCharacterClass = false) {
    const reserved = inCharacterClass ? /[\\\]\^-]/u : /[\\^$.*+?()[\]{}|]/u;
    return Array.from(String(value || '')).map(character => reserved.test(character) ? `\\${character}` : character).join('');
}

function canonicalizeReviewedPatternForTokenizerBoundary(patternText) {
    const characters = Array.from(String(patternText || ''));
    let output = '';
    let inCharacterClass = false;
    for (let index = 0; index < characters.length; index += 1) {
        const character = characters[index];
        if (character === '\\') {
            const next = characters[index + 1];
            if (next == null) { output += character; continue; }
            if (/^[\x00-\x7F]$/u.test(next)) {
                output += character + next;
            } else {
                const canonical = canonicalizeTokenizerBoundaryCharacters(next);
                output += escapeCanonicalizedReviewedPatternLiteral(canonical, inCharacterClass);
            }
            index += 1;
            continue;
        }
        if (character === '[') { inCharacterClass = true; output += character; continue; }
        if (character === ']' && inCharacterClass) { inCharacterClass = false; output += character; continue; }
        if (/^[\x00-\x7F]$/u.test(character)) { output += character; continue; }
        const canonical = canonicalizeTokenizerBoundaryCharacters(character);
        output += escapeCanonicalizedReviewedPatternLiteral(canonical, inCharacterClass);
    }
    return normalizeReviewedPatternKanjiLiterals(output);
}

function normalizeReviewedPatternKanjiLiterals(patternText) {
    return Array.from(String(patternText || '')).map(character =>
        isHanCharacter(character) ? normalizeKanjiForLookup(character) : character
    ).join('');
}

async function loadTitleReadingEvidence() {
    runtimeState.titleReadingDictionary.clear();
    runtimeState.titleReadingPrefixes.clear();
    for (const filePath of lexicalTermBankFiles.titleReadings) {
        const data = await fetchJsonAsset('titleReadingEvidence', filePath, `Title-reading evidence unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(entry?.surface || '').trim().normalize('NFC');
            const patternText = String(entry?.pattern || '').trim();
            const kind = String(entry?.kind || 'title-reading');
            const silentSeparator = kind === 'title-separator-silent';
            if (!surface || !patternText || (!silentSeparator && !entry?.romaji)) continue;
            try {
                const rule = {
                    surface,
                    patternText,
                    pattern: compileReviewedPattern(canonicalizeReviewedPatternForTokenizerBoundary(patternText), 'i'),
                    reading: entry.reading ? normalizeEvidenceReading(entry.reading) : null,
                    romaji: silentSeparator ? '' : normalizeReviewedRomaji(entry.romaji),
                    kind,
                    source: String(entry.source || 'reviewed-title-reading')
                };
                const rules = runtimeState.titleReadingDictionary.get(surface) || [];
                rules.push(rule);
                runtimeState.titleReadingDictionary.set(surface, rules);
                addSurfacePrefixes(runtimeState.titleReadingPrefixes, surface);
            } catch (error) {
                console.warn(`Invalid title-reading pattern: ${entry.pattern}`, error);
                runtimeState.resourceWarnings.add(`Invalid title-reading evidence: ${entry.pattern}`);
            }
        }
    }
}

async function loadLexicalTermBanks() {
    await settleStartedJobs([
        loadCommonWordDictionary(),
        loadContextualReadingEvidence(),
        loadGeneralWordDictionary(),
        loadLoanwordDictionary(),
        loadCompoundWordDictionary(),
        loadAtejiDictionary(),
        loadTitleReadingEvidence()
    ]);
    await loadReviewedProperNameSpanEvidence();
    for (const filePath of lexicalTermBankFiles.properNouns) {
        const data = await fetchJsonAsset('properNouns', filePath, `Proper-noun term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) registerProperNounEntry(entry, filePath);
    }
    buildProperNounPersonComponentCorroborationIndex();
}

function buildKnownPhraseDictionary() {
    const next = new Map();
    for (const [surface, romaji] of Object.entries(fallbackGrammaticalExpressionMap).sort(([left], [right]) => left.localeCompare(right, 'ja'))) {
        next.set(surface, romaji);
    }
    for (const [surface, entry] of [...runtimeState.compoundWordDictionary.entries()].sort(([left], [right]) => left.localeCompare(right, 'ja'))) {
        if (entry?.reading && entry?.romaji) next.set(surface, entry.romaji);
    }
    // Loaded grammar is authoritative over fallback lexical phrases.
    for (const [surface, romaji] of Object.entries(runtimeState.particleExpressions).sort(([left], [right]) => left.localeCompare(right, 'ja'))) {
        next.set(surface, romaji);
    }
    runtimeState.knownPhraseDictionary.clear();
    runtimeState.knownPhrasePrefixes.clear();
    for (const [surface, romaji] of next) {
        runtimeState.knownPhraseDictionary.set(surface, romaji);
        addSurfacePrefixes(runtimeState.knownPhrasePrefixes, surface);
    }

    runtimeState.grammaticalExpressionDictionary.clear();
    runtimeState.grammaticalExpressionPrefixes.clear();
    const grammarEntries = [
        ...Object.entries(fallbackGrammaticalExpressionMap),
        ...Object.entries(runtimeState.particleExpressions)
    ];
    for (const [surface, romaji] of grammarEntries) {
        runtimeState.grammaticalExpressionDictionary.set(surface, romaji);
        addSurfacePrefixes(runtimeState.grammaticalExpressionPrefixes, surface);
    }
}

function registerAuthoritativeSpanEvidence(surface, evidence) {
    const cleanSurface = String(surface || '').trim();
    if (!cleanSurface || !evidence) return;
    const lookupSurfaces = new Set([cleanSurface, normalizeKanjiForLookup(cleanSurface)]);
    if (evidence.nameVariants) lookupSurfaces.add(normalizeKanjiForLookup(cleanSurface, { names: true }));

    for (const lookupSurface of lookupSurfaces) {
        if (!lookupSurface) continue;
        const existing = runtimeState.authoritativeSpanDictionary.get(lookupSurface);
        if (!existing || Number(evidence.priority || 0) > Number(existing.priority || 0)) {
            runtimeState.authoritativeSpanDictionary.set(lookupSurface, { ...evidence, surface: cleanSurface });
        }
        const characters = Array.from(lookupSurface);
        for (let length = 1; length <= characters.length; length += 1) {
            runtimeState.authoritativeSpanPrefixes.add(characters.slice(0, length).join(''));
        }
    }
}

function buildAuthoritativeSpanIndex() {
    runtimeState.authoritativeSpanDictionary.clear();
    runtimeState.authoritativeSpanPrefixes.clear();

    for (const [surface, entry] of runtimeState.generalWordDictionary.entries()) {
        const retainedReadings = entry?.readings || [];
        if (!retainedReadings.length) continue;
        const completeCoverage = entry?.readingCoverage === 'complete-source-surface';
        const sourceReadingCount = Number.isInteger(entry?.sourceReadingCount) ? entry.sourceReadingCount : null;
        const provenUnique = completeCoverage
            && sourceReadingCount === 1
            && retainedReadings.length === 1
            && !entry?.unretainedReadings?.length;
        // mergeSafe is boundary evidence only. When reading coverage is incomplete
        // or genuinely multi-reading, retain a provisional reading but require review.
        const candidateCount = Math.max(sourceReadingCount || 0, retainedReadings.length + (entry?.unretainedReadings?.length || 0));
        registerAuthoritativeSpanEvidence(surface, {
            reading: retainedReadings[0].reading,
            source: provenUnique ? 'complete-single-reading-general-word-evidence' : 'general-word-boundary-evidence',
            confidence: provenUnique ? 0.98 : 0.64,
            priority: 70,
            category: 'general-word',
            mergeSafe: Boolean(entry.mergeSafe),
            reviewRequired: !provenUnique,
            reviewFlag: candidateCount > 1 ? 'general-word-ambiguous' : (!completeCoverage ? 'general-word-coverage-incomplete' : 'reviewed-reading-ambiguous')
        });
    }
    for (const [surface, entry] of runtimeState.compoundWordDictionary.entries()) {
        if (!entry.reading) continue;
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'compound-word-evidence',
            confidence: 0.98,
            priority: 80,
            category: 'compound-word'
        });
    }
    for (const [surface, reading] of runtimeState.atejiDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading,
            source: 'ateji-lexicon',
            confidence: 0.99,
            priority: 95,
            category: 'ateji'
        });
    }
    for (const [surface, output] of runtimeState.loanwordDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            romaji: output,
            source: 'source-language-loanword',
            confidence: 1,
            priority: 90,
            category: 'loanword',
            loanwordCategory: runtimeState.loanwordMetadataDictionary.get(surface)?.category || null
        });
    }
    for (const [surface, metadata] of runtimeState.loanwordMetadataDictionary.entries()) {
        if (!metadata?.requiresReview || runtimeState.loanwordDictionary.has(surface)) continue;
        registerAuthoritativeSpanEvidence(surface, {
            reading: surface,
            source: 'reviewed-loanword-surface',
            confidence: 0.85,
            priority: 85,
            category: 'loanword-review',
            loanwordCategory: metadata.category || null,
            reviewRequired: true,
            reviewReason: metadata.reviewReason || 'source-spelling-unresolved'
        });
    }
    for (const [surface, entry] of runtimeState.reviewedProperNameSpanDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'reviewed-proper-name-span',
            confidence: 1,
            priority: 100,
            category: 'reviewed-name',
            nameVariants: true
        });
    }
    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'counter-date-reading-evidence',
            confidence: 1,
            priority: 100,
            category: 'counter-date',
            counterRole: entry.role || null,
            counterUnit: entry.unit || null
        });
    }
    for (const [surface, entry] of runtimeState.reviewedReadingSpanDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            alternatives: entry.alternatives || [],
            source: 'reviewed-reading-span',
            confidence: 1,
            priority: 99,
            category: 'reviewed-reading',
            reviewRequired: Boolean(entry.reviewRequired)
        });
    }
}

async function loadCounterDateEvidence() {
    const data = await fetchJsonAsset('counterDateEvidence', getAssetPath('counterDateEvidence'), 'Counter/date reading evidence unavailable');
    if (!Array.isArray(data)) return;
    runtimeState.counterDateReadingDictionary.clear();
    runtimeState.counterDateReadingPrefixes.clear();
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const aliases = Array.isArray(entry?.aliases) ? entry.aliases.map(value => String(value || '').trim()).filter(Boolean) : [];
        const reading = normalizeDictionaryReading(entry?.reading);
        const romaji = normalizeDictionaryRomaji(entry?.romaji);
        const role = String(entry?.role || '').trim();
        const unit = String(entry?.unit || '').trim() || null;
        const hundredTailReading = normalizeDictionaryReading(entry?.hundredTailReading) || null;
        if (!surface || !reading || !romaji || !role) continue;
        for (const reviewedSurface of [surface, ...aliases]) {
            setUniqueDictionaryEntry(runtimeState.counterDateReadingDictionary, reviewedSurface, { reading, romaji, role, unit, numericTail: entry.numericTail === true, hundredTailReading }, 'counter/date');
            addSurfacePrefixes(runtimeState.counterDateReadingPrefixes, reviewedSurface);
        }
    }
}

function replaceSetContents(target, values) {
    if (!Array.isArray(values) || !values.length) return;
    target.clear();
    values.map(value => String(value || '').trim()).filter(Boolean).forEach(value => target.add(value));
}

async function loadGrammarConfiguration() {
    const [expressions, conjugation] = await settleStartedJobs([
        fetchJsonAsset('particleExpressions', getAssetPath('particleExpressions'), 'Particle-expression configuration unavailable'),
        fetchJsonAsset('conjugationPatterns', getAssetPath('conjugationPatterns'), 'Conjugation-pattern configuration unavailable')
    ]);
    if (Array.isArray(expressions)) {
        for (const entry of expressions) {
            const surface = String(entry?.surface || '').trim();
            const romaji = normalizeDictionaryRomaji(entry?.romaji);
            if (!surface || !romaji) continue;
            setUniqueDictionaryProperty(runtimeState.particleExpressions, surface, romaji, 'particle expression');
        }
    }
    replaceSetContents(runtimeState.conjugationJoinEndings, conjugation?.joinEndings);
    replaceSetContents(runtimeState.auxiliarySpacingSurfaces, conjugation?.auxiliarySpacing);
    replaceSetContents(runtimeState.auxiliarySpacingBasicForms, conjugation?.auxiliarySpacingBasicForms);
    replaceSetContents(runtimeState.contractedAuxiliaryBasicForms, conjugation?.contractedAuxiliaryBasicForms);
    replaceSetContents(runtimeState.capitalizedAuxiliarySurfaces, conjugation?.capitalizedAuxiliaries);
}

async function loadReadingEvidence() {
    const data = await fetchJsonAsset('readingEvidence', getAssetPath('readingEvidence'), 'Reading-evidence bank unavailable');
    if (!Array.isArray(data)) return;
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const preferredReading = normalizeDictionaryReading(entry?.preferredReading);
        const alternatives = Array.isArray(entry?.alternatives) ? entry.alternatives : [];
        if (!surface || !preferredReading || !alternatives.length) continue;
        setUniqueDictionaryEntry(runtimeState.readingEvidenceDictionary, surface, {
            preferredReading,
            preferredPriority: Number(entry.preferredPriority || 0),
            preferredRank: Number(entry.preferredRank || 0),
            alternatives: alternatives.map(item => ({
                reading: normalizeDictionaryReading(item?.[0]),
                priority: Number(item?.[1] || 0),
                rank: Number(item?.[2] || 0)
            })).filter(item => item.reading)
        }, 'reading evidence');
    }
}


async function loadReviewedReadingEvidence() {
    const data = await fetchJsonAsset('reviewedReadingEvidence', getAssetPath('reviewedReadingEvidence'), 'Reviewed reading evidence unavailable');
    if (!data || !Array.isArray(data.preferences) || !Array.isArray(data.spans)) return;
    runtimeState.reviewedReadingPreferenceDictionary.clear();
    runtimeState.reviewedReadingSpanDictionary.clear();
    for (const entry of data.preferences) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        const alternatives = Array.isArray(entry?.alternatives)
            ? entry.alternatives.map(normalizeDictionaryReading).filter(Boolean)
            : [];
        if (!surface || !reading) continue;
        setUniqueDictionaryEntry(runtimeState.reviewedReadingPreferenceDictionary, surface, {
            reading,
            alternatives,
            numericCanonical: String(entry?.numericCanonical || '').trim() || null,
            numericRole: String(entry?.numericRole || '').trim() || null,
            note: String(entry?.note || '').trim()
        }, 'reviewed reading preference');
    }
    for (const entry of data.spans) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        const romaji = normalizeDictionaryRomaji(entry?.romaji || (reading ? convertToRomaji(reading) : ''));
        const alternatives = Array.isArray(entry?.alternatives)
            ? entry.alternatives.map(normalizeDictionaryReading).filter(Boolean)
            : [];
        if (!surface || !reading || !romaji) continue;
        setUniqueDictionaryEntry(runtimeState.reviewedReadingSpanDictionary, surface, {
            reading,
            romaji,
            alternatives,
            reviewRequired: Boolean(entry?.reviewRequired),
            note: String(entry?.note || '').trim()
        }, 'reviewed reading span');
    }
}

async function loadRendakuEvidence() {
    const data = await fetchJsonAsset('rendakuEvidence', getAssetPath('rendakuEvidence'), 'Rendaku evidence unavailable');
    if (!Array.isArray(data)) return;
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        if (!surface || !reading) continue;
        setUniqueDictionaryEntry(runtimeState.rendakuEvidenceDictionary, surface, {
            reading,
            rendaku: Boolean(entry?.rendaku),
            source: String(entry?.source || '').trim(),
            note: String(entry?.note || '').trim()
        }, 'Rendaku evidence');
        const characters = Array.from(surface);
        for (let length = 1; length <= characters.length; length += 1) {
            runtimeState.rendakuEvidencePrefixes.add(characters.slice(0, length).join(''));
        }
    }
}

async function loadHistoricalKanaEvidence() {
    const data = await fetchJsonAsset('historicalKanaEvidence', getAssetPath('historicalKanaEvidence'), 'Historical-kana evidence unavailable');
    const entries = Array.isArray(data) ? data : data?.entries;
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        if (!surface || !reading || !isSemanticKanaReading(reading)) continue;
        setUniqueDictionaryEntry(runtimeState.historicalKanaEvidenceDictionary, surface, {
            reading,
            pos: String(entry?.pos || '名詞').trim() || '名詞',
            conjugationClass: String(entry?.conjugationClass || '').trim(),
            source: String(entry?.source || '').trim(),
            sourceType: String(entry?.sourceType || '').trim(),
            note: String(entry?.note || '').trim()
        }, 'historical-kana evidence');
        const characters = Array.from(surface);
        for (let length = 1; length <= characters.length; length += 1) {
            runtimeState.historicalKanaEvidencePrefixes.add(characters.slice(0, length).join(''));
        }
    }
}

// Source section: Lexical lookup and post-tokenisation span merging.

function findSourceTokenRanges(tokens, sourceText) {
    const text = String(sourceText || '');
    const ranges = [];
    let cursor = 0;
    for (const token of tokens || []) {
        const surface = String(token?.surface_form || '');
        if (!surface) { ranges.push(null); continue; }

        const explicitStart = Number(token?.sourceStart);
        const explicitEnd = Number(token?.sourceEnd);
        const explicitSourceSurface = Number.isInteger(explicitStart) && Number.isInteger(explicitEnd)
            ? text.slice(explicitStart, explicitEnd)
            : '';
        const canonicalVariantOwnsExplicitSpan = Boolean(
            token?.variantCanonicalRetokenized === true
            && String(token?.variantOriginalSurface || '') === explicitSourceSurface
            && Array.isArray(token?.semanticAnnotationOwnership)
            && token.semanticAnnotationOwnership.some(owner =>
                owner?.sourceStart === explicitStart
                && owner?.sourceEnd === explicitEnd
                && owner?.sourceSurface === explicitSourceSurface
                && Array.isArray(owner?.annotations)
                && owner.annotations.includes('variantCanonicalRetokenized'))
        );
        if (Number.isInteger(explicitStart) && Number.isInteger(explicitEnd)
            && explicitStart >= cursor && explicitEnd >= explicitStart
            && (explicitSourceSurface === surface || canonicalVariantOwnsExplicitSpan)) {
            ranges.push({ start: explicitStart, end: explicitEnd });
            cursor = explicitEnd;
            continue;
        }

        const kuromojiStart = Number(token?.word_position || 0) - 1;
        if (kuromojiStart >= cursor && text.slice(kuromojiStart, kuromojiStart + surface.length) === surface) {
            const end = kuromojiStart + surface.length;
            ranges.push({ start: kuromojiStart, end });
            cursor = end;
            continue;
        }

        let start = text.indexOf(surface, cursor);
        if (start < 0) {
            const first = text.indexOf(surface);
            start = first >= 0 && text.indexOf(surface, first + surface.length) < 0 ? first : -1;
        }
        if (start < 0) { ranges.push(null); continue; }
        const end = start + surface.length;
        ranges.push({ start, end });
        cursor = end;
    }
    return ranges;
}

function attachSourceTokenSpans(tokens, sourceText) {
    const text = String(sourceText || '');
    const ranges = findSourceTokenRanges(tokens, text);
    let previousEnd = 0;
    return (tokens || []).map((token, index) => {
        const range = ranges[index];
        if (!range) return token;
        const gapStart = Math.min(previousEnd, range.start);
        const sourceGapBefore = text.slice(gapStart, range.start);
        previousEnd = Math.max(previousEnd, range.end);
        return {
            ...token,
            sourceStart: range.start,
            sourceEnd: range.end,
            sourceSurface: text.slice(range.start, range.end),
            sourceGapBefore
        };
    });
}

const spanBoundSemanticAnnotationKeys = new Set([
    'value', 'particle', 'prefix', 'suffix', 'nominalizer', 'grammatical', 'fullGrammaticalExpression',
    'titleSeparator', 'crossNotationSymbol', 'nameContinuation', 'nameGivenStart', 'canonicalBoundary', 'hardBoundaryReconstructed',
    'numericExpression', 'contextualOverrideMatched', 'contextualRomaji',
    'titleReadingEvidenceMatched', 'titleReadingEvidenceReading', 'titleReadingEvidenceRomaji', 'titleReadingEvidenceKind', 'titleReadingEvidenceSource',
    'sourceSpanLexicalCandidateMatched', 'sourceSpanLexicalCandidateReading', 'sourceSpanLexicalCandidateRomaji', 'sourceSpanLexicalCandidateKind', 'sourceSpanLexicalCandidateSource', 'sourceSpanLexicalCandidateConfidence',
    'reviewedProperNameSpanMatched', 'reviewedProperNameSpanRomaji', 'reviewedProperNameLookupSurface', 'reviewedProperNameVariantMappings', 'reviewedProperNameLexicalCollision', 'reviewedProperNameLexicalReading',
    'reviewedNameHonorificMatched', 'reviewedNameHonorificReading',
    'typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource', 'typedTemporalSpanLexicalCollision', 'typedTemporalSuffix', 'structuredTemporalHead',
    'typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives', 'structuredNumericSplit', 'sourceSpanLexicalBoundaryRelease',
    'ideographicDecimalNotationMatched', 'ideographicDecimalCanonicalDigits',
    'structuredFractionRole', 'structuredFractionReading', 'structuredFractionSource',
    'authoritativeSpanMatched', 'authoritativeSpanCategory', 'authoritativeSpanReading', 'authoritativeSpanRomaji', 'authoritativeSpanSource', 'authoritativeSpanConfidence', 'authoritativeSpanReviewRequired', 'authoritativeSpanReviewReason', 'authoritativeSpanReviewFlag', 'authoritativeSpanAlternatives', 'authoritativeSpanVariantMappings',
    'reviewedNumericAliasMatched', 'reviewedNumericAliasCanonicalSurface', 'reviewedNumericAliasReading', 'reviewedNumericAliasRomaji', 'reviewedNumericAliasSource',
    'variantProperNounMatched', 'variantCanonicalRetokenized', 'variantOriginalSurface', 'variantLookupSurface', 'variantMappings',
    'latinPassthroughMatched', 'latinPassthroughOutput',
    'knownPhraseMatched', 'knownPhraseValue', 'knownPhraseSource',
    'loanwordMatched', 'loanwordOutput', 'suppressLoanwordSourceSpelling', 'countryLanguageReviewRequired',
    'contextualLoanwordEvidenceMatched', 'contextualLoanwordEvidenceOutput', 'contextualLoanwordEvidenceSource', 'contextualLoanwordEvidenceScore', 'contextualLoanwordEvidenceMargin', 'contextualLoanwordEvidenceAmbiguous', 'contextualLoanwordEvidenceCandidates',
    'commonWordMatched', 'commonWordReading', 'commonWordRomaji', 'reviewedInflectionMatched',
    'contextualReadingEvidenceMatched', 'contextualReadingEvidenceReading', 'contextualReadingEvidenceRomaji', 'contextualReadingEvidenceSource', 'contextualReadingEvidenceScore', 'contextualReadingEvidenceMargin', 'contextualReadingEvidenceAmbiguous', 'contextualReadingEvidenceCandidates',
    'historicalKanaEvidenceMatched', 'historicalKanaEvidenceReading', 'historicalKanaEvidenceSource', 'historicalKanaEvidenceSourceType',
    'rendakuEvidenceMatched', 'rendakuEvidenceReading', 'rendakuEvidenceSource', 'rendakuApplied',
    'exactDictionaryRescueMatched', 'exactDictionaryRescueSource', 'exactDictionaryRescueConfidence',
    'kanaLexicalSpanMatched', 'kanaLexicalSpanReading', 'kanaLexicalSpanEvidenceStrength', 'kanaLexicalSpanEvidenceSurfaces',
    'atejiMatched', 'atejiReading',
    'generalWordMatched', 'generalWordReading', 'generalWordAmbiguous', 'generalWordCoverageIncomplete', 'generalWordCandidates', 'generalWordVariantMappings',
    'ordinaryCompoundReadingMatched', 'ordinaryCompoundReading', 'ordinaryCompoundReadingCandidates',
    'structuralRoleReadingMatched', 'structuralRoleReading', 'structuralRoleReadingCandidates', 'structuralPrefixRoleMatched', 'structuralSuffixRoleMatched',
    'iterationMarkFallbackMatched', 'iterationMarkFallbackReading',
    'nameContextAmbiguous', 'nameContextSurname', 'nameContextBase', 'nameContextStructure', 'nameContextCandidateSurface', 'nameContextSourceStart', 'nameContextSourceEnd', 'nameContextSourceSurface',
    'desiderativeGaruRecoveredFromSurface',
    'readingResolution', 'outputBoundaryBefore', 'outputBoundaryReason', 'outputBoundaryAuthority', 'outputBoundaryRequiresReview',
    'semanticAnnotationOwnership'
]);

function stripSpanBoundSemanticAnnotations(token) {
    const stripped = { ...(token || {}) };
    for (const key of spanBoundSemanticAnnotationKeys) delete stripped[key];
    return stripped;
}

function getCompleteDerivedSourceSpan(tokens, startIndex, endIndex, options = {}) {
    const members = (tokens || []).slice(startIndex, endIndex + 1);
    if (!members.length) return null;
    const first = members[0];
    const last = members[members.length - 1];
    if (!Number.isInteger(first?.sourceStart) || !Number.isInteger(last?.sourceEnd)) return null;
    let sourceSurface = String(first?.sourceSurface ?? first?.surface_form ?? '');
    for (let index = 1; index < members.length; index += 1) {
        const previous = members[index - 1];
        const current = members[index];
        let gap = '';
        if (!sourceTokensAreContiguous(previous, current)) {
            if (!options.allowWhitespaceGaps
                || !Number.isInteger(previous?.sourceEnd)
                || !Number.isInteger(current?.sourceStart)
                || current.sourceStart < previous.sourceEnd) return null;
            gap = String(current.sourceGapBefore || '');
            if (gap.length !== current.sourceStart - previous.sourceEnd || !/^[\s\u3000]+$/u.test(gap)) return null;
        }
        sourceSurface += gap + String(current?.sourceSurface ?? current?.surface_form ?? '');
    }
    return { sourceStart: first.sourceStart, sourceEnd: last.sourceEnd, sourceSurface };
}

function makeSemanticAnnotationOwnership(sourceSpan, annotations, evidenceSource, semanticRole, confidence = null, reviewRequired = null) {
    const keys = [...new Set((annotations || []).filter(Boolean))];
    if (!keys.length) return [];
    return [{
        annotations: keys,
        sourceStart: Number.isInteger(sourceSpan?.sourceStart) ? sourceSpan.sourceStart : null,
        sourceEnd: Number.isInteger(sourceSpan?.sourceEnd) ? sourceSpan.sourceEnd : null,
        sourceSurface: sourceSpan?.sourceSurface ?? null,
        evidenceSource: String(evidenceSource || 'derived-span'),
        semanticRole: String(semanticRole || 'derived-span'),
        confidence: Number.isFinite(confidence) ? confidence : null,
        reviewRequired: typeof reviewRequired === 'boolean' ? reviewRequired : null
    }];
}

function makeDerivedSpanToken(tokens, startIndex, endIndex, fields = {}, ownership = {}) {
    const members = (tokens || []).slice(startIndex, endIndex + 1);
    const first = members[0] || {};
    const sourceSpan = getCompleteDerivedSourceSpan(tokens, startIndex, endIndex, { allowWhitespaceGaps: Boolean(ownership.allowWhitespaceGaps) });
    const requestedSurface = String(fields.surface_form ?? members.map(token => String(token?.surface_form || '')).join(''));
    const sameExplicitSpan = Boolean(sourceSpan
        && Number.isInteger(first?.sourceStart)
        && Number.isInteger(first?.sourceEnd)
        && first.sourceStart === sourceSpan.sourceStart
        && first.sourceEnd === sourceSpan.sourceEnd
        && String(first.sourceSurface ?? first.surface_form ?? '') === sourceSpan.sourceSurface);
    const sameImplicitSpan = members.length === 1 && requestedSurface === String(first?.surface_form || '');
    const sameSpan = sameExplicitSpan || sameImplicitSpan;
    const base = sameSpan ? { ...first } : stripSpanBoundSemanticAnnotations(first);
    const previousOwnership = sameSpan && Array.isArray(first.semanticAnnotationOwnership)
        ? first.semanticAnnotationOwnership.map(owner => ({ ...owner, annotations: [...(owner.annotations || [])] }))
        : [];
    const token = { ...base, ...fields, derivedSpan: true };
    if (sourceSpan) {
        token.sourceStart = sourceSpan.sourceStart;
        token.sourceEnd = sourceSpan.sourceEnd;
        token.sourceSurface = sourceSpan.sourceSurface;
    } else if (!sameImplicitSpan) {
        delete token.sourceStart;
        delete token.sourceEnd;
        delete token.sourceSurface;
    }
    token.semanticAnnotationOwnership = [
        ...previousOwnership,
        ...makeSemanticAnnotationOwnership(
            sourceSpan,
            ownership.annotations,
            ownership.evidenceSource,
            ownership.semanticRole,
            ownership.confidence,
            ownership.reviewRequired
        )
    ];
    return token;
}

function makeDerivedMatchedSpanToken(tokens, startIndex, endIndex, endCharacter, fields = {}, ownership = {}) {
    const finalToken = tokens?.[endIndex];
    const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
    if (!finalToken || endCharacter >= finalLength) return makeDerivedSpanToken(tokens, startIndex, endIndex, fields, ownership);
    const prefixToken = makeDerivedSubspanToken(finalToken, 0, endCharacter);
    const members = [...(tokens || []).slice(startIndex, endIndex), prefixToken];
    return makeDerivedSpanToken(members, 0, members.length - 1, fields, ownership);
}

function makeDerivedSubspanToken(token, startCharacter, endCharacter, fields = {}, ownership = {}) {
    const originalSurface = String(token?.surface_form || '');
    const characters = Array.from(originalSurface);
    const start = Math.max(0, Math.min(characters.length, Number(startCharacter) || 0));
    const end = Math.max(start, Math.min(characters.length, Number(endCharacter) || characters.length));
    const surface = characters.slice(start, end).join('');
    const base = stripSpanBoundSemanticAnnotations(token || {});
    const output = { ...base, surface_form: surface, ...fields, derivedSpan: true };
    output.sourceGapBefore = start === 0 ? String(token?.sourceGapBefore || '') : '';
    const explicitSourceMatches = Number.isInteger(token?.sourceStart)
        && Number.isInteger(token?.sourceEnd)
        && String(token?.sourceSurface ?? originalSurface) === originalSurface;
    let sourceSpan = null;
    if (explicitSourceMatches) {
        const startUnits = characters.slice(0, start).join('').length;
        const endUnits = characters.slice(0, end).join('').length;
        sourceSpan = {
            sourceStart: token.sourceStart + startUnits,
            sourceEnd: token.sourceStart + endUnits,
            sourceSurface: String(token.sourceSurface ?? originalSurface).slice(startUnits, endUnits)
        };
        output.sourceStart = sourceSpan.sourceStart;
        output.sourceEnd = sourceSpan.sourceEnd;
        output.sourceSurface = sourceSpan.sourceSurface;
    } else {
        delete output.sourceStart;
        delete output.sourceEnd;
        delete output.sourceSurface;
    }
    output.semanticAnnotationOwnership = makeSemanticAnnotationOwnership(
        sourceSpan,
        ownership.annotations,
        ownership.evidenceSource,
        ownership.semanticRole,
        ownership.confidence,
        ownership.reviewRequired
    );
    return output;
}

function validateSourceTokenIntegrity(tokens, sourceText, options = {}) {
    const source = String(sourceText || '');
    const violations = [];
    let previousStart = -1;
    let previousEnd = 0;
    const covered = [];
    const add = (index, token, reason) => violations.push({ index, surface: String(token?.surface_form || ''), reason });
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!token) continue;
        const start = token.sourceStart;
        const end = token.sourceEnd;
        if (!Number.isInteger(start) || !Number.isInteger(end)) { add(index, token, 'missing-source-range'); continue; }
        if (start < 0 || end < start || end > source.length) { add(index, token, 'invalid-source-range'); continue; }
        if (start < previousStart) add(index, token, 'out-of-order-source-range');
        if (start < previousEnd) add(index, token, start === previousStart && end === previousEnd ? 'duplicated-source-range' : 'overlapping-source-range');
        const expectedSurface = source.slice(start, end);
        if (String(token.sourceSurface ?? '') !== expectedSurface) add(index, token, 'invalid-sourceSurface');
        previousStart = start;
        previousEnd = Math.max(previousEnd, end);
        covered.push([start, end]);
        for (const owner of token.semanticAnnotationOwnership || []) {
            const ownerMatches = owner
                && owner.sourceStart === start
                && owner.sourceEnd === end
                && owner.sourceSurface === expectedSurface;
            if (!ownerMatches) { add(index, token, 'stale-semantic-annotation-ownership'); continue; }
            for (const annotation of owner.annotations || []) {
                if (!Object.prototype.hasOwnProperty.call(token, annotation)) add(index, token, 'annotation-owner-without-annotation');
            }
        }
    }
    if (options.requireFullCoverage && covered.length) {
        let cursor = 0;
        for (const [start, end] of covered) {
            const gap = start > cursor ? source.slice(cursor, start) : '';
            if (gap && /\S/u.test(gap)) violations.push({ index: -1, surface: gap, reason: 'source-deletion' });
            cursor = Math.max(cursor, end);
        }
        const trailing = cursor < source.length ? source.slice(cursor) : '';
        if (trailing && /\S/u.test(trailing)) violations.push({ index: -1, surface: trailing, reason: 'source-deletion' });
    }
    return { valid: violations.length === 0, violations };
}

function sourceTokensAreContiguous(left, right) {
    return Boolean(
        left && right
        && Number.isInteger(left.sourceEnd)
        && Number.isInteger(right.sourceStart)
        && left.sourceEnd === right.sourceStart
    );
}

function contextualPatternContainsRange(pattern, sourceText, range) {
    if (!range) return false;
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const matcher = new RegExp(pattern.source, flags);
    let match;
    while ((match = matcher.exec(sourceText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (range.start >= start && range.end <= end) return true;
        if (!match[0].length) matcher.lastIndex += 1;
    }
    return false;
}

function isTitleMentionSourceBoundaryAt(sourceText, index) {
    const source = String(sourceText || '');
    const character = source[index] || '';
    return Boolean(character) && (/^\s$/u.test(character) || isCanonicalHardBoundaryAt(source, index));
}

function titleReadingEvidenceAppliesToRange(evidence, sourceText, range, boundaryContext = {}) {
    if (!evidence?.pattern || !range) return false;
    const source = canonicalizeTokenizerBoundaryCharacters(String(sourceText || ''));
    const reviewedSurface = canonicalizeTokenizerBoundaryCharacters(normalizeTranslatorInputText(String(evidence.surface || '')));
    if (!reviewedSurface || source.slice(range.start, range.end) !== reviewedSurface) return false;

    // Fragment rules remain valid only inside their authored larger title/context.
    // Complete-title rules need a stronger check: an unanchored regex equal to the
    // title surface must not become a raw-string prefix match inside another word.
    const exactFlags = evidence.pattern.flags.replace(/g/gu, '');
    const exactReviewedSurfacePattern = new RegExp(`^(?:${evidence.pattern.source})$`, exactFlags);
    const patternDescribesCompleteSurface = exactReviewedSurfacePattern.test(reviewedSurface);
    const matchFlags = evidence.pattern.flags.includes('g') ? evidence.pattern.flags : `${evidence.pattern.flags}g`;
    const matcher = new RegExp(evidence.pattern.source, matchFlags);
    let match;
    while ((match = matcher.exec(source)) !== null) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        if (range.start >= matchStart && range.end <= matchEnd) {
            if (!patternDescribesCompleteSurface) return true;
            // Authored punctuation/context extending beyond the reviewed surface is
            // independent evidence and remains valid without grammatical inference.
            if (matchStart < range.start || matchEnd > range.end) return true;
            break;
        }
        if (!match[0].length) matcher.lastIndex += 1;
    }

    if (!patternDescribesCompleteSurface) return false;

    // A rule authored for the complete reviewed title remains valid when that exact
    // title is mentioned as a syntactically bounded noun in a larger sentence. This
    // extension must use source-aligned morphology, never a raw following kana prefix.
    const left = source.slice(0, range.start);
    const right = source.slice(range.end);
    const leftBoundary = !left
        || isTitleMentionSourceBoundaryAt(left, left.length - 1)
        || Boolean(boundaryContext.leftGrammaticalBoundary);
    const rightBoundary = !right
        || isTitleMentionSourceBoundaryAt(source, range.end)
        || Boolean(boundaryContext.rightGrammaticalBoundary);
    return leftBoundary && rightBoundary;
}

function getTitleMentionBoundaryContext(tokens, sourceRanges, range, sourceText = '') {
    if (!range) return { leftGrammaticalBoundary: false, rightGrammaticalBoundary: false };
    let leftGrammaticalBoundary = false;
    let rightGrammaticalBoundary = false;
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const tokenRange = sourceRanges?.[index]
            || (Number.isInteger(token?.sourceStart) && Number.isInteger(token?.sourceEnd)
                ? { start: token.sourceStart, end: token.sourceEnd }
                : null);
        if (!tokenRange) continue;
        if (tokenRange.end === range.start && isParticle(token)) leftGrammaticalBoundary = true;
        if (tokenRange.start === range.end && isGrammaticalToken(token)) rightGrammaticalBoundary = true;
    }

    // Whole-sentence Kuromoji boundaries are useful evidence but must not be a
    // single point of failure. Re-tokenise only the exact source slice touching
    // the candidate boundary when the original partition swallowed a particle
    // into an adjacent lexical token. This remains analyser-backed evidence: a
    // lexical word such as はちみつ stays a noun and cannot masquerade as は.
    const source = String(sourceText || '');
    if (runtimeState.tokenizer && source) {
        if (!rightGrammaticalBoundary && range.end < source.length) {
            const suffixTokens = runtimeState.tokenizer.tokenize(source.slice(range.end));
            const first = suffixTokens[0] || null;
            if (first && isGrammaticalToken(first)) rightGrammaticalBoundary = true;
        }
        if (!leftGrammaticalBoundary && range.start > 0) {
            const prefixTokens = runtimeState.tokenizer.tokenize(source.slice(0, range.start));
            const last = prefixTokens[prefixTokens.length - 1] || null;
            if (last && isParticle(last)) leftGrammaticalBoundary = true;
        }
    }
    return { leftGrammaticalBoundary, rightGrammaticalBoundary };
}



/** @param {CJ2RToken|null|undefined} token */
function getKuromojiDictionaryReading(token) {
    if (!token) return null;
    const candidates = [token.reading, token.pronunciation, typeof token.getReading === 'function' ? token.getReading() : null];
    for (const candidate of candidates) {
        const reading = String(candidate || '').trim();
        if (!reading || reading === '*' || reading === '＊') continue;
        if (/^[ぁ-ゖァ-ヶー]+$/u.test(reading)) return reading;
    }
    return null;
}

function hasReviewedLexicalBoundaryBefore(token) {
    return Boolean(token?.reviewedLexicalBoundaryBefore || token?.tokenizationRoleBoundaryBefore || token?.sourceAuthorityBoundaryBefore);
}

function crossesReviewedLexicalBoundary(tokens, startIndex, endIndex) {
    if (endIndex <= startIndex) return false;
    return hasReviewedLexicalBoundaryBefore(tokens?.[endIndex]);
}

function selectCommonWordRuleLookup(surface, sourceText, allowDefault = true) {
    const originalSurface = String(surface || '');
    const rules = runtimeState.commonWordDictionary.get(originalSurface) || [];
    for (const rule of rules.filter(item => item.pattern)) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(sourceText)) return { rule, lookupSurface: originalSurface, variant: null };
    }
    if (allowDefault) {
        const defaultRule = rules.find(item => !item.pattern);
        if (defaultRule) return { rule: defaultRule, lookupSurface: originalSurface, variant: null };
    }
    const variant = normalizeKanjiForLookupDetailed(originalSurface);
    if (!variant.changed || !variant.normalizedSurface || !allowDefault) return null;
    const variantRule = (runtimeState.commonWordDictionary.get(variant.normalizedSurface) || []).find(item => !item.pattern);
    return variantRule ? { rule: variantRule, lookupSurface: variant.normalizedSurface, variant } : null;
}

function selectCommonWordRule(surface, sourceText, allowDefault = true) {
    return selectCommonWordRuleLookup(surface, sourceText, allowDefault)?.rule || null;
}

function isParticle(token) {
    return Boolean(token && (token.pos === '助詞' || token.fullGrammaticalExpression));
}
function tokenBasicForm(token) {
    const basic = String(token?.basic_form || '').trim();
    return basic && basic !== '*' ? basic : String(token?.surface_form || '');
}

function startsSeparateAuxiliaryUnit(token) {
    if (!token) return false;
    const surface = String(token.surface_form || '');
    const basic = tokenBasicForm(token);
    return runtimeState.auxiliarySpacingSurfaces.has(surface)
        || runtimeState.auxiliarySpacingBasicForms.has(basic);
}

function isGrammaticalToken(token) {
    if (!token) return false;
    if (isParticle(token) || token.pos === '助動詞' || runtimeState.grammaticalSurfaces.has(token.surface_form)) return true;
    return token.pos === '動詞'
        && token.pos_detail_1 === '非自立'
        && runtimeState.auxiliarySpacingBasicForms.has(tokenBasicForm(token));
}
function isNominalizer(token) { return Boolean(token) && token.surface_form === 'の' && token.pos === '名詞'; }
function isPrefix(token) { return Boolean(token) && (token.pos === '接頭詞' || token.structuralPrefixRoleMatched); }
function isSuffix(token) { return Boolean(token) && (token.pos === '接尾詞' || token.pos_detail_1 === '接尾' || token.structuralSuffixRoleMatched); }
function isProperNounToken(token) { return Boolean(token) && (token.pos_detail_1 === '固有名詞' || token.pos_detail_2 === '人名'); }
function isPersonNameToken(token) { return Boolean(token) && token.pos_detail_1 === '固有名詞' && token.pos_detail_2 === '人名'; }

function canContinueCommonWord(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.commonWordPrefixes.has(originalSurface)
        || runtimeState.commonWordPrefixes.has(normalizeKanjiForLookup(originalSurface));
}

function findLongestReviewedCommonWordInflection(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += String(token.surface_form || '');
        if (!runtimeState.commonWordInflectionPrefixes.has(candidateSurface)) break;
        const evidence = runtimeState.commonWordInflectionDictionary.get(candidateSurface);
        if (evidence) bestMatch = { surface: candidateSurface, ...evidence, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeReviewedCommonWordInflectionTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestReviewedCommonWordInflection(tokens, index);
        if (!bestMatch || bestMatch.length === 1) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '動詞',
            pos_detail_1: '自立',
            pos_detail_2: '*',
            basic_form: bestMatch.lemma,
            conjugated_type: bestMatch.conjugationClass,
            commonWordMatched: true,
            commonWordReading: bestMatch.reading,
            reviewedInflectionMatched: true
        }, {
            annotations: ['commonWordMatched', 'commonWordReading', 'reviewedInflectionMatched'],
            evidenceSource: 'reviewed-common-word-inflection',
            semanticRole: 'lexical-inflection'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestCommonWord(tokens, startIndex, sourceText) {
    let bestMatch = null;
    let candidateSurface = '';
    let hasProperNoun = false;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || (token.pos === '記号' && token.surface_form !== '々' && !containsHan(token.surface_form)) || token.contextualOverrideMatched || token.loanwordMatched || token.historicalKanaEvidenceMatched) break;
        candidateSurface += String(token.surface_form || '');
        hasProperNoun ||= isProperNounToken(token);
        if (!canContinueCommonWord(candidateSurface)) break;
        const contextRule = selectCommonWordRule(candidateSurface, sourceText, false);
        const defaultRule = contextRule ? null : selectCommonWordRule(candidateSurface, sourceText, !hasProperNoun);
        const rule = contextRule || defaultRule;
        if (rule) bestMatch = { surface: candidateSurface, reading: rule.reading, romaji: rule.romaji || null, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeCommonWordTokens(tokens, sourceText) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestCommonWord(tokens, index, sourceText);
        if (!bestMatch || bestMatch.length === 1) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', commonWordMatched: true, commonWordReading: bestMatch.reading, commonWordRomaji: bestMatch.romaji || null
        }, {
            annotations: ['commonWordMatched', 'commonWordReading', 'commonWordRomaji'],
            evidenceSource: 'common-word-bank',
            semanticRole: 'lexical-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}


function findLongestTitleReadingEvidence(tokens, startIndex, sourceText, sourceRanges = []) {
    if (!runtimeState.titleReadingDictionary.size) return null;
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.contextualOverrideMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const evidenceBackedSymbol = token.pos === '記号'
            && !isIdeographicVariationSelectorSequence(tokenSurface)
            && runtimeState.titleReadingPrefixes.has(nextCandidateSurface);
        if (token.pos === '記号' && !isIdeographicVariationSelectorSequence(tokenSurface) && !evidenceBackedSymbol) break;
        candidateSurface = nextCandidateSurface;
        if (!runtimeState.titleReadingPrefixes.has(candidateSurface)) break;
        const startRange = sourceRanges[startIndex];
        const endRange = sourceRanges[end];
        const candidateRange = startRange && endRange ? { start: startRange.start, end: endRange.end } : null;
        for (const evidence of runtimeState.titleReadingDictionary.get(candidateSurface) || []) {
            if (!titleReadingEvidenceAppliesToRange(evidence, sourceText, candidateRange, getTitleMentionBoundaryContext(tokens, sourceRanges, candidateRange, sourceText))) continue;
            bestMatch = { ...evidence, lookupSurface: candidateSurface, surface: evidence.surface || candidateSurface, length: end - startIndex + 1 };
        }
    }
    return bestMatch;
}

function mergeTitleReadingEvidenceTokens(tokens, sourceText) {
    const merged = [];
    const sourceRanges = findSourceTokenRanges(tokens, sourceText);
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestTitleReadingEvidence(tokens, index, sourceText, sourceRanges);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading || tokens[index].reading,
            pronunciation: bestMatch.reading || tokens[index].pronunciation,
            titleReadingEvidenceMatched: true,
            titleReadingEvidenceReading: bestMatch.reading || null,
            titleReadingEvidenceRomaji: bestMatch.romaji,
            titleReadingEvidenceKind: bestMatch.kind,
            titleReadingEvidenceSource: bestMatch.source,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        }, {
            annotations: ['titleReadingEvidenceMatched', 'titleReadingEvidenceReading', 'titleReadingEvidenceRomaji', 'titleReadingEvidenceKind', 'titleReadingEvidenceSource'],
            evidenceSource: bestMatch.source || 'title-reading-evidence',
            semanticRole: 'title-reading'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function getGeneralWordLookup(surface) {
    const originalSurface = String(surface || '');
    const exact = runtimeState.generalWordDictionary.get(originalSurface);
    if (exact) return { entry: exact, lookupSurface: originalSurface, variant: null };
    const variant = normalizeKanjiForLookupDetailed(originalSurface);
    if (!variant.changed || !variant.normalizedSurface) return null;
    const entry = runtimeState.generalWordDictionary.get(variant.normalizedSurface);
    return entry ? { entry, lookupSurface: variant.normalizedSurface, variant } : null;
}

function getGeneralWordCandidates(lookup) {
    if (!lookup?.entry?.readings) return [];
    const retained = lookup.entry.readings.map(item => ({
        reading: item.reading,
        popularityScore: Number(item.popularityScore ?? item.score ?? 0),
        retained: true
    }));
    const additional = (lookup.entry.unretainedReadings || []).map(item => ({
        reading: item.reading,
        popularityScore: Number(item.popularityScore || 0),
        retained: false
    }));
    const seen = new Set();
    return [...retained, ...additional]
        .filter(item => { const key = normalizeKanaReading(item.reading); if (!key || seen.has(key)) return false; seen.add(key); return true; })
        .sort((a, b) => b.popularityScore - a.popularityScore || a.reading.localeCompare(b.reading, 'ja'))
        .map((item, index) => ({
            reading: item.reading,
            romaji: convertToRomaji(item.reading),
            // Yomitan/Jitendex score is popularity/search ranking, not semantic probability.
            weight: 0,
            rank: index + 1,
            popularityScore: item.popularityScore,
            retained: item.retained,
            categories: new Set(['lexical']),
            sources: new Set(['jitendex-general-word'])
        }));
}

function hasCompleteGeneralWordReadingCoverage(lookup) {
    return lookup?.entry?.readingCoverage === 'complete-source-surface'
        && Number.isInteger(lookup.entry.sourceReadingCount)
        && lookup.entry.sourceReadingCount === getGeneralWordCandidates(lookup).length;
}

function selectGeneralWordReading(lookup) {
    const candidates = getGeneralWordCandidates(lookup);
    if (!hasCompleteGeneralWordReadingCoverage(lookup) || candidates.length !== 1) return null;
    return lookup.entry.readings.find(item => normalizeKanaReading(item.reading) === normalizeKanaReading(candidates[0].reading)) || null;
}

/** @param {CJ2RToken} token */
function resolveGeneralWordFallback(token) {
    if (!token || isProperNounToken(token) || isParticle(token) || isPrefix(token) || isSuffix(token) || token.pos === '助動詞') return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const selected = selectGeneralWordReading(lookup);
    const candidates = getGeneralWordCandidates(lookup);
    const concreteAmbiguity = candidates.length > 1;
    const coverageIncomplete = !hasCompleteGeneralWordReadingCoverage(lookup);
    // Popularity may order a provisional visible reading, but never clears
    // ambiguity or substitutes for source coverage/restriction evidence.
    const provisional = selected || lookup.entry.readings[0] || null;
    return {
        reading: provisional?.reading || null,
        source: selected ? 'general-word-fallback' : 'general-word-ranked-provisional',
        confidence: selected ? 0.86 : (concreteAmbiguity ? 0.55 : 0.64),
        candidates,
        flags: [
            ...(provisional ? ['fallback-reading'] : []),
            ...(concreteAmbiguity ? ['general-word-ambiguous'] : []),
            ...(coverageIncomplete ? ['general-word-coverage-incomplete'] : []),
            ...(lookup.variant ? ['variant-reading-evidence'] : [])
        ],
        variantMappings: lookup.variant?.mappings || [],
        ambiguous: concreteAmbiguity || coverageIncomplete
    };
}

function assessGeneralWordReading(token, currentReading) {
    if (!token || !currentReading) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    const sourceOrthographyCandidates = Array.isArray(token.sourceOrthographyGeneralWordCandidates)
        ? token.sourceOrthographyGeneralWordCandidates
        : [];
    if (!lookup && !sourceOrthographyCandidates.length) return null;
    const normalized = normalizeKanaReading(currentReading);
    const byReading = new Map();
    for (const candidate of [...(lookup ? getGeneralWordCandidates(lookup) : []), ...sourceOrthographyCandidates]) {
        const reading = normalizeKanaReading(candidate?.reading || '');
        if (!reading) continue;
        const existing = byReading.get(reading);
        byReading.set(reading, {
            ...(existing || {}),
            ...candidate,
            categories: new Set([...(existing?.categories || []), ...(candidate?.categories || [])]),
            sources: new Set([...(existing?.sources || []), ...(candidate?.sources || [])])
        });
    }
    const candidates = [...byReading.values()];
    const matchedIndex = candidates.findIndex(item => normalizeKanaReading(item.reading) === normalized);
    const canonicalCompleteCoverage = lookup ? hasCompleteGeneralWordReadingCoverage(lookup) : true;
    const completeCoverage = canonicalCompleteCoverage && token.sourceOrthographyGeneralWordCoverageIncomplete !== true;
    const strongPreference = completeCoverage && candidates.length === 1;
    const conflict = candidates.length > 0 && matchedIndex < 0;
    return {
        matched: matchedIndex >= 0,
        matchedIndex,
        candidates,
        strongPreference,
        conflict,
        coverageIncomplete: !completeCoverage,
        variantMappings: lookup?.variant?.mappings || []
    };
}

function isGeneralWordHardSegmentSeparatorToken(token) {
    if (!token) return false;
    const surface = String(token.surface_form || '');
    const characters = Array.from(surface);
    if (!characters.length) return false;
    const isHardCharacter = character => /^[~～〜、，,。！？?!]$/u.test(character);
    const hasHardCharacter = characters.some(isHardCharacter);
    if (!hasHardCharacter) return false;
    return characters.every(character => isHardCharacter(character) || isCanonicalTransparentBoundaryCharacter(character));
}

function isGeneralWordTransparentSegmentBoundaryToken(token) {
    return Boolean(token?.canonicalBoundary && isCanonicalTransparentBoundarySurface(token.surface_form));
}

function isGeneralWordSegmentSeparatorToken(token) {
    return isGeneralWordHardSegmentSeparatorToken(token) || isGeneralWordTransparentSegmentBoundaryToken(token);
}

function isGeneralWordSourceSegmentSeparatorCharacter(character) {
    return /^[~～〜、，,。！？?!]$/u.test(character) || isCanonicalTransparentBoundaryCharacter(character);
}

function splitGeneralWordSourceSegments(value) {
    const segments = [''];
    let insideSeparatorRun = false;
    for (const character of Array.from(String(value || ''))) {
        if (isGeneralWordSourceSegmentSeparatorCharacter(character)) {
            if (!insideSeparatorRun) segments.push('');
            insideSeparatorRun = true;
            continue;
        }
        insideSeparatorRun = false;
        segments[segments.length - 1] += character;
    }
    return segments;
}

function isTransparentWrappedGeneralWordSegmentIsolated(tokens, startIndex, endIndex) {
    const hasTransparentEdge = isGeneralWordTransparentSegmentBoundaryToken(tokens[startIndex - 1])
        || isGeneralWordTransparentSegmentBoundaryToken(tokens[endIndex + 1]);
    if (!hasTransparentEdge) return true;
    for (let index = startIndex - 1; index >= 0; index -= 1) {
        if (isGeneralWordHardSegmentSeparatorToken(tokens[index])) break;
        if (!isGeneralWordTransparentSegmentBoundaryToken(tokens[index])) return false;
    }
    for (let index = endIndex + 1; index < tokens.length; index += 1) {
        if (isGeneralWordHardSegmentSeparatorToken(tokens[index])) break;
        if (!isGeneralWordTransparentSegmentBoundaryToken(tokens[index])) return false;
    }
    return true;
}

function isTrailingSentencePunctuationToken(token) {
    return Boolean(token && token.pos === '記号' && /^[。！？?!]+$/u.test(String(token.surface_form || '')));
}

function hasStrongerGeneralWordSegmentEvidence(tokens, surface) {
    if (runtimeState.reviewedReadingPreferenceDictionary.get(surface)) return true;
    return tokens.some(token => token?.contextualOverrideMatched
        || token?.titleReadingEvidenceMatched
        || token?.reviewedProperNameSpanMatched
        || token?.reviewedNameHonorificMatched
        || token?.authoritativeSpanMatched
        || token?.reviewedNumericAliasMatched
        || token?.variantProperNounMatched
        || token?.exactDictionaryRescueMatched
        || token?.loanwordMatched
        || token?.atejiMatched
        || token?.commonWordMatched
        || token?.knownPhraseMatched
        || token?.rendakuEvidenceMatched
        || token?.historicalKanaEvidenceMatched
        || token?.fullGrammaticalExpression);
}

function findExactGeneralWordSegment(tokens, startIndex, sourceText = '') {
    if (!tokens?.length || startIndex < 0 || startIndex >= tokens.length) return null;
    if (startIndex > 0 && !isGeneralWordSegmentSeparatorToken(tokens[startIndex - 1])) return null;
    let endIndex = startIndex;
    while (endIndex + 1 < tokens.length && !isGeneralWordSegmentSeparatorToken(tokens[endIndex + 1])) endIndex += 1;
    let lexicalEndIndex = endIndex;
    while (lexicalEndIndex > startIndex && isTrailingSentencePunctuationToken(tokens[lexicalEndIndex])) lexicalEndIndex -= 1;
    const segmentTokens = tokens.slice(startIndex, lexicalEndIndex + 1);
    if (!segmentTokens.length) return null;
    if (!isTransparentWrappedGeneralWordSegmentIsolated(tokens, startIndex, lexicalEndIndex)) return null;
    const segmentSurface = segmentTokens.map(token => String(token?.surface_form || '')).join('');
    const sourceSpan = getCompleteDerivedSourceSpan(tokens, startIndex, lexicalEndIndex);
    if (!segmentSurface) return null;
    if (sourceSpan) {
        if (sourceSpan.sourceSurface !== segmentSurface) return null;
    } else {
        const segmentIndex = tokens.slice(0, startIndex).filter(isGeneralWordSegmentSeparatorToken).length;
        const sourceSegments = splitGeneralWordSourceSegments(sourceText);
        const sourceSegment = String(sourceSegments[segmentIndex] || '');
        if (sourceSegment !== segmentSurface) return null;
    }
    const lookup = getGeneralWordLookup(segmentSurface);
    if (!lookup?.entry?.readings?.length || lookup.entry.mergeSafe || getGeneralWordCandidates(lookup).length < 2) return null;
    if (hasStrongerGeneralWordSegmentEvidence(segmentTokens, segmentSurface)) return null;
    const provisional = lookup.entry.readings[0];
    return {
        surface: segmentSurface,
        reading: provisional.reading,
        length: segmentTokens.length,
        candidates: getGeneralWordCandidates(lookup),
        ambiguous: true,
        coverageIncomplete: !hasCompleteGeneralWordReadingCoverage(lookup),
        variantMappings: lookup.variant?.mappings || [],
        exactGeneralWordSegmentFallback: true,
        tokenizerConsensusVerbSpan: false
    };
}

function findLongestGeneralWord(tokens, startIndex, sourceText = '') {
    const exactSegmentMatch = findExactGeneralWordSegment(tokens, startIndex, sourceText);
    if (exactSegmentMatch) return exactSegmentMatch;
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || isProperNounToken(token) || isGrammaticalToken(token) || isPrefix(token)
            || (isSuffix(token) && end === startIndex)
            || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.loanwordMatched || token.atejiMatched || token.commonWordMatched
            || token.knownPhraseMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched || token.fullGrammaticalExpression) break;
        if (token.pos === '記号' && !containsHan(token.surface_form)) break;
        candidateSurface += String(token.surface_form || '');
        const lookupSurface = normalizeKanjiForLookup(candidateSurface);
        if (!runtimeState.generalWordPrefixes.has(candidateSurface) && !runtimeState.generalWordPrefixes.has(lookupSurface)) break;
        if (end === startIndex) continue;
        const lookup = getGeneralWordLookup(candidateSurface);
        if (!lookup?.entry) continue;
        const selected = selectGeneralWordReading(lookup);
        const candidates = getGeneralWordCandidates(lookup);
        const candidateTokens = tokens.slice(startIndex, end + 1);
        let tokenizerConsensusVerbSpan = false;
        let tokenizerConsensusReading = null;
        if (!lookup?.entry?.mergeSafe
            && candidateTokens.length > 1
            && candidateTokens.every(item => item?.pos === '動詞' && !isGrammaticalToken(item))
            && runtimeState.tokenizer) {
            const standalone = runtimeState.tokenizer.tokenize(candidateSurface) || [];
            const standaloneToken = standalone.length === 1 && String(standalone[0]?.surface_form || '') === candidateSurface
                ? standalone[0]
                : null;
            const standaloneReading = normalizeKanaReading(getKuromojiDictionaryReading(standaloneToken) || '');
            tokenizerConsensusVerbSpan = Boolean(
                standaloneToken
                && standaloneToken.pos === '動詞'
                && standaloneToken.pos_detail_1 !== '非自立'
                && standaloneReading
                && candidates.some(item => normalizeKanaReading(item?.reading || '') === standaloneReading)
            );
            tokenizerConsensusReading = tokenizerConsensusVerbSpan ? standaloneReading : null;
        }
        if (!lookup?.entry?.mergeSafe && !tokenizerConsensusVerbSpan) continue;
        // A tokenizer split may be repaired only when standalone Kuromoji and
        // maintained lexical evidence independently agree on the whole verb span.
        const provisional = selected
            || (tokenizerConsensusReading ? candidates.find(item => normalizeKanaReading(item?.reading || '') === tokenizerConsensusReading) : null)
            || lookup.entry.readings[0]
            || null;
        if (!provisional) continue;
        bestMatch = {
            surface: candidateSurface,
            reading: provisional.reading,
            length: end - startIndex + 1,
            candidates,
            ambiguous: candidates.length > 1,
            coverageIncomplete: !hasCompleteGeneralWordReadingCoverage(lookup),
            variantMappings: lookup.variant?.mappings || [],
            tokenizerConsensusVerbSpan
        };
    }
    return bestMatch;
}

function mergeGeneralWordTokens(tokens, sourceText = '') {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestGeneralWord(tokens, index, sourceText);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const matchedTokens = tokens.slice(index, index + bestMatch.length);
        if (isStructuredNumericUnitSurface(bestMatch.surface)) { merged.push(tokens[index]); continue; }
        const numericExpression = matchedTokens.length > 1 && matchedTokens.every(token => token.pos_detail_1 === '数' || (isSuffix(token) && token.pos_detail_2 === '助数詞'));
        if (numericExpression) {
            merged.push(tokens[index]);
            continue;
        }
        if (matchedTokens.length > 1 && matchedTokens.every(token => token.authoritativeSpanCategory === 'counter-date')) {
            merged.push(tokens[index]);
            continue;
        }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: bestMatch.tokenizerConsensusVerbSpan ? '動詞' : '名詞',
            pos_detail_1: bestMatch.tokenizerConsensusVerbSpan ? '自立' : '一般', pos_detail_2: '*',
            basic_form: bestMatch.tokenizerConsensusVerbSpan ? bestMatch.surface : undefined,
            generalWordMatched: true, generalWordReading: bestMatch.reading, generalWordCandidates: bestMatch.candidates,
            generalWordAmbiguous: bestMatch.ambiguous, generalWordCoverageIncomplete: bestMatch.coverageIncomplete, generalWordVariantMappings: bestMatch.variantMappings,
            generalWordVerbSpanReconstructed: Boolean(bestMatch.tokenizerConsensusVerbSpan), numericExpression
        }, {
            annotations: ['generalWordMatched', 'generalWordReading', 'generalWordCandidates', 'generalWordAmbiguous', 'generalWordCoverageIncomplete', 'generalWordVariantMappings', 'numericExpression'],
            evidenceSource: 'general-word-bank',
            semanticRole: 'lexical-span',
            reviewRequired: Boolean(bestMatch.ambiguous || bestMatch.coverageIncomplete)
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestRendakuEvidence(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || isProperNounToken(token) || isGrammaticalToken(token)
            || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.loanwordMatched || token.atejiMatched || token.commonWordMatched
            || token.knownPhraseMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched || token.fullGrammaticalExpression) break;
        if (token.pos === '記号' && !containsHan(token.surface_form)) break;
        candidateSurface += String(token.surface_form || '');
        if (!runtimeState.rendakuEvidencePrefixes.has(candidateSurface)) break;
        const evidence = runtimeState.rendakuEvidenceDictionary.get(candidateSurface);
        if (evidence) bestMatch = { surface: candidateSurface, ...evidence, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeRendakuEvidenceTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestRendakuEvidence(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            rendakuEvidenceMatched: true,
            rendakuEvidenceReading: bestMatch.reading,
            rendakuEvidenceSource: bestMatch.source,
            rendakuApplied: bestMatch.rendaku
        }, {
            annotations: ['rendakuEvidenceMatched', 'rendakuEvidenceReading', 'rendakuEvidenceSource', 'rendakuApplied'],
            evidenceSource: bestMatch.source || 'rendaku-evidence',
            semanticRole: 'rendaku-reading'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestHistoricalKanaEvidence(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        const historicalIterationMark = token?.pos === '記号' && /^[ゝゞヽヾ]$/u.test(String(token.surface_form || ''));
        if (!token || (token.pos === '記号' && !historicalIterationMark) || token.contextualOverrideMatched) break;
        const prefixSurface = candidateSurface;
        const tokenCharacters = Array.from(String(token.surface_form || ''));
        let stillPossible = false;
        for (let offset = 1; offset <= tokenCharacters.length; offset += 1) {
            const probe = prefixSurface + tokenCharacters.slice(0, offset).join('');
            if (runtimeState.historicalKanaEvidencePrefixes.has(probe)) stillPossible = true;
            const evidence = runtimeState.historicalKanaEvidenceDictionary.get(probe);
            if (!evidence) continue;
            const match = { surface: probe, ...evidence, endIndex: end, endOffset: offset, length: end - startIndex + 1 };
            if (!bestMatch || Array.from(probe).length > Array.from(bestMatch.surface).length) bestMatch = match;
        }
        candidateSurface = prefixSurface + tokenCharacters.join('');
        if (!runtimeState.historicalKanaEvidencePrefixes.has(candidateSurface)) break;
        if (!stillPossible && !bestMatch) break;
    }
    return bestMatch;
}

function tokenizeHistoricalRemainder(token, consumedCharacters) {
    const surface = String(token?.surface_form || '');
    const characters = Array.from(surface);
    const remainder = characters.slice(consumedCharacters).join('');
    if (!remainder) return [];
    // This is a post-tokenisation repair for an attested historical boundary.
    // Only the overshooting token fragment is retokenised; sentence context stays intact elsewhere.
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    if (!retokenized.length) {
        return [makeDerivedSubspanToken(token, consumedCharacters, characters.length, {
            reading: remainder, pronunciation: remainder
        }, { semanticRole: 'historical-remainder', evidenceSource: 'historical-kana-boundary' })];
    }
    let cursor = consumedCharacters;
    return retokenized.map(item => {
        const length = Array.from(String(item?.surface_form || '')).length;
        const derived = makeDerivedSubspanToken(token, cursor, cursor + length, { ...item }, {
            semanticRole: 'historical-remainder', evidenceSource: 'historical-kana-boundary'
        });
        cursor += length;
        return derived;
    });
}

function mergeHistoricalKanaEvidenceTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestHistoricalKanaEvidence(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedMatchedSpanToken(tokens, index, bestMatch.endIndex, bestMatch.endOffset, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: bestMatch.pos,
            pos_detail_1: '自立',
            pos_detail_2: '*',
            pos_detail_3: '*',
            historicalKanaEvidenceMatched: true,
            historicalKanaEvidenceReading: bestMatch.reading,
            historicalKanaEvidenceSource: bestMatch.source,
            historicalKanaEvidenceSourceType: bestMatch.sourceType
        }, {
            annotations: ['historicalKanaEvidenceMatched', 'historicalKanaEvidenceReading', 'historicalKanaEvidenceSource', 'historicalKanaEvidenceSourceType'],
            evidenceSource: bestMatch.source || 'historical-kana-evidence',
            semanticRole: 'historical-reading'
        }));
        const finalToken = tokens[bestMatch.endIndex];
        const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
        if (bestMatch.endOffset < finalLength) merged.push(...tokenizeHistoricalRemainder(finalToken, bestMatch.endOffset));
        index = bestMatch.endIndex;
    }
    return merged;
}

function findLongestAteji(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || (token.pos === '記号' && !containsHan(token.surface_form)) || token.contextualOverrideMatched || token.historicalKanaEvidenceMatched || isProperNounToken(token)) break;
        candidateSurface += String(token.surface_form || '');
        const reading = runtimeState.atejiDictionary.get(candidateSurface);
        if (reading) bestMatch = { surface: candidateSurface, reading, length: end - startIndex + 1 };
        if (!runtimeState.atejiPrefixes.has(candidateSurface)) break;
    }
    return bestMatch;
}

function mergeAtejiTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestAteji(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading, atejiMatched: true, atejiReading: bestMatch.reading
        }, {
            annotations: ['atejiMatched', 'atejiReading'], evidenceSource: 'ateji-bank', semanticRole: 'ateji-reading'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function canContinueLoanword(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.loanwordPrefixes.has(originalSurface)
        || runtimeState.loanwordPrefixes.has(normalizeKanjiForLookup(originalSurface));
}

function getLoanwordMetadata(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.loanwordMetadataDictionary.get(originalSurface)
        || runtimeState.loanwordMetadataDictionary.get(normalizeKanjiForLookup(originalSurface))
        || null;
}

function isReviewedCountryNameLoanword(surface) {
    return getLoanwordMetadata(surface)?.category === 'country-name';
}

function hasReviewedCountryLanguageLoanword(surface) {
    const originalSurface = String(surface || '');
    const output = runtimeState.loanwordDictionary.get(originalSurface)
        || runtimeState.loanwordDictionary.get(normalizeKanjiForLookup(originalSurface));
    return Boolean(output && getLoanwordMetadata(originalSurface)?.category === 'country-language');
}

function shouldSuppressCountryNameLoanwordBeforeLanguageSuffix(tokens, startIndex, matchLength, matchedSurface) {
    if (!isReviewedCountryNameLoanword(matchedSurface)) return false;
    const nextToken = tokens?.[startIndex + matchLength];
    if (String(nextToken?.surface_form || '') !== '語') return false;
    return !hasReviewedCountryLanguageLoanword(String(matchedSurface || '') + '語');
}

function makeMechanicalCountryNameFallbackToken(tokens, startIndex, bestMatch) {
    const matchedTokens = tokens.slice(startIndex, startIndex + bestMatch.length);
    const combinedReading = matchedTokens.map(token => getKuromojiDictionaryReading(token) || String(token?.surface_form || '')).join('');
    return makeDerivedSpanToken(tokens, startIndex, startIndex + bestMatch.length - 1, {
        surface_form: bestMatch.surface,
        reading: combinedReading || bestMatch.surface,
        pronunciation: combinedReading || bestMatch.surface,
        suppressLoanwordSourceSpelling: true,
        countryLanguageReviewRequired: true
    }, {
        annotations: ['suppressLoanwordSourceSpelling', 'countryLanguageReviewRequired'],
        evidenceSource: 'country-language-mechanical-fallback',
        semanticRole: 'loanword-country-name',
        reviewRequired: true
    });
}

function findLongestLoanword(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const evidenceBackedSymbol = token.pos === '記号'
            && !isIdeographicVariationSelectorSequence(tokenSurface)
            && canContinueLoanword(nextCandidateSurface);
        if (token.pos === '記号' && !isIdeographicVariationSelectorSequence(tokenSurface) && !evidenceBackedSymbol) break;
        candidateSurface = nextCandidateSurface;
        if (!canContinueLoanword(candidateSurface)) break;
        const output = runtimeState.loanwordDictionary.get(candidateSurface)
            || runtimeState.loanwordDictionary.get(normalizeKanjiForLookup(candidateSurface));
        if (output) bestMatch = { surface: candidateSurface, output, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function findUniqueReviewedLoanwordSegmentation(surface) {
    const originalSurface = String(surface || '');
    if (!originalSurface || runtimeState.loanwordDictionary.has(originalSurface)) return null;
    if (!/^[ァ-ヶー]+$/u.test(originalSurface)) return null;
    const characters = Array.from(originalSurface);
    const memo = new Map();

    const solve = start => {
        if (start === characters.length) return [[]];
        if (memo.has(start)) return memo.get(start);
        const solutions = [];
        for (let end = start + 1; end <= characters.length; end += 1) {
            const segment = characters.slice(start, end).join('');
            const output = runtimeState.loanwordDictionary.get(segment);
            if (!output) continue;
            for (const tail of solve(end)) {
                solutions.push([{ surface: segment, output }, ...tail]);
                if (solutions.length > 1) { memo.set(start, solutions); return solutions; }
            }
        }
        memo.set(start, solutions);
        return solutions;
    };

    const solutions = solve(0);
    return solutions.length === 1 && solutions[0].length > 1 ? solutions[0] : null;
}

function splitReviewedLoanwordToken(token) {
    if (!token || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched) return null;
    const segments = findUniqueReviewedLoanwordSegmentation(token.surface_form);
    if (!segments) return null;
    let cursor = 0;
    return segments.map((segment, index) => {
        const length = Array.from(segment.surface).length;
        const derived = makeDerivedSubspanToken(token, cursor, cursor + length, {
            surface_form: segment.surface,
            reading: segment.surface,
            pronunciation: segment.surface,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            loanwordMatched: true,
            loanwordOutput: segment.output,
            ...(index > 0 ? { reviewedLexicalBoundaryBefore: true, reviewedLexicalBoundarySource: 'reviewed-loanword-segmentation' } : {})
        }, {
            annotations: ['loanwordMatched', 'loanwordOutput'],
            evidenceSource: 'reviewed-loanword-segmentation',
            semanticRole: 'loanword-segment'
        });
        cursor += length;
        return derived;
    });
}

function mergeLoanwordTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestLoanword(tokens, index);
        if (!bestMatch) {
            const split = splitReviewedLoanwordToken(tokens[index]);
            if (split) merged.push(...split);
            else merged.push(tokens[index]);
            continue;
        }
        if (shouldSuppressCountryNameLoanwordBeforeLanguageSuffix(tokens, index, bestMatch.length, bestMatch.surface)) {
            merged.push(makeMechanicalCountryNameFallbackToken(tokens, index, bestMatch));
            index += bestMatch.length - 1;
            continue;
        }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, loanwordMatched: true, loanwordOutput: bestMatch.output
        }, {
            annotations: ['loanwordMatched', 'loanwordOutput'], evidenceSource: 'reviewed-loanword-bank', semanticRole: 'loanword-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

const reviewedNumericContextUnits = new Set([
    '十','百','千','万','億','兆','人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階','円'
]);

function getReviewedReadingPreferenceForSurface(surface) {
    return runtimeState.reviewedReadingPreferenceDictionary.get(String(surface || '')) || null;
}

function canonicalizeReviewedNumericAliasSurface(surface) {
    return Array.from(String(surface || '')).map(character => {
        const entry = getReviewedReadingPreferenceForSurface(character);
        return entry?.numericCanonical || character;
    }).join('');
}


function isReviewedNumericBaseToken(token) {
    if (!token) return false;
    return Boolean(token.numericExpression || token.pos_detail_1 === '数' || isJapaneseNumeralSurface(token.surface_form));
}

function isReviewedNumericContinuationToken(token) {
    if (!token) return false;
    const surface = String(token.surface_form || '');
    return isReviewedNumericBaseToken(token)
        || token.pos_detail_2 === '助数詞'
        || reviewedNumericContextUnits.has(surface)
        || Boolean(getReviewedReadingPreferenceForSurface(surface)?.numericCanonical);
}

function getCanonicalNumericAliasReading(canonicalSurface) {
    const surface = String(canonicalSurface || '');
    if (!surface || !runtimeState.tokenizer) return null;
    const reviewed = runtimeState.counterDateReadingDictionary.get(surface);
    if (reviewed?.reading) return { reading: reviewed.reading, romaji: reviewed.romaji || convertToRomaji(reviewed.reading), source: 'counter-date-reading-evidence' };
    const canonicalTokens = runtimeState.tokenizer.tokenize(surface);
    if (!canonicalTokens.length) return null;
    const readings = [];
    for (const token of canonicalTokens) {
        if (token?.pos_detail_1 === '固有名詞') return null;
        const reading = getKuromojiDictionaryReading(token);
        if (!reading) return null;
        readings.push(reading);
    }
    const reading = readings.join('');
    return reading ? { reading, romaji: convertToRomaji(reading), source: 'canonical-numeric-context' } : null;
}

function makeReviewedNumericAliasToken(tokens, startIndex, endIndex, canonicalSurface, resolved) {
    const span = tokens.slice(startIndex, endIndex + 1);
    return makeDerivedSpanToken(tokens, startIndex, endIndex, {
        surface_form: span.map(token => String(token.surface_form || '')).join(''),
        reading: resolved.reading,
        pronunciation: resolved.reading,
        pos: '名詞',
        pos_detail_1: '数',
        pos_detail_2: '*',
        pos_detail_3: '*',
        reviewedNumericAliasMatched: true,
        reviewedNumericAliasCanonicalSurface: canonicalSurface,
        reviewedNumericAliasReading: resolved.reading,
        reviewedNumericAliasRomaji: resolved.romaji || null,
        reviewedNumericAliasSource: resolved.source,
        numericExpression: true
    }, {
        annotations: ['reviewedNumericAliasMatched', 'reviewedNumericAliasCanonicalSurface', 'reviewedNumericAliasReading', 'reviewedNumericAliasRomaji', 'reviewedNumericAliasSource', 'numericExpression'],
        evidenceSource: resolved.source || 'reviewed-numeric-alias',
        semanticRole: 'numeric-alias'
    });
}


function getSingleHanIterationFallbackReading(token) {
    const surface = String(token?.surface_form || '');
    const characters = Array.from(surface);
    if (characters.length !== 1 || !isHanCharacter(characters[0]) || isGrammaticalToken(token)) return null;
    const reading = getKuromojiDictionaryReading(token);
    return reading && isSemanticKanaReading(reading) ? reading : null;
}

const kanaIterationMarkVoicing = Object.freeze({ 'ゝ': false, 'ゞ': true, 'ヽ': false, 'ヾ': true });
const smallKanaMoraFollowers = new Set(['ぁ','ぃ','ぅ','ぇ','ぉ','ゃ','ゅ','ょ','ゎ']);

function getTrailingKanaMora(reading) {
    const characters = Array.from(normalizeKanaReading(reading));
    if (!characters.length || characters[characters.length - 1] === 'ー') return null;
    const end = characters.length;
    const start = end > 1 && smallKanaMoraFollowers.has(characters[end - 1]) ? end - 2 : end - 1;
    const mora = characters.slice(start, end).join('');
    return /^[ぁ-ゔ]+$/u.test(mora) ? mora : null;
}

function applyKanaIterationVoicing(mora, voiced) {
    const characters = Array.from(String(mora || ''));
    if (!characters.length) return null;
    const firstDecomposed = characters[0].normalize('NFD').replace(/[\u3099\u309A]/gu, '');
    const first = (firstDecomposed + (voiced ? '\u3099' : '')).normalize('NFC');
    const repeated = first + characters.slice(1).join('');
    const romaji = convertToRomaji(repeated);
    return /^[A-Za-z']+$/u.test(romaji) ? repeated : null;
}

function expandKanaIterationReading(surface) {
    const original = String(surface || '');
    if (!/[ゝゞヽヾ]/u.test(original)) return null;
    let reading = '';
    let sawIteration = false;
    let previousScript = null;
    const sourceCharacters = Array.from(original);
    for (const character of sourceCharacters) {
        if (Object.prototype.hasOwnProperty.call(kanaIterationMarkVoicing, character)) {
            const requiredScript = /[ゝゞ]/u.test(character) ? 'hiragana' : 'katakana';
            if (previousScript !== requiredScript) return null;
            const previousMora = getTrailingKanaMora(reading);
            const repeated = previousMora && applyKanaIterationVoicing(previousMora, kanaIterationMarkVoicing[character]);
            if (!repeated) return null;
            reading += repeated;
            previousScript = requiredScript;
            sawIteration = true;
            continue;
        }
        const normalized = normalizeKanaReading(character);
        if (!/^[ぁ-ゔー]$/u.test(normalized)) return null;
        reading += normalized;
        if (/^[ぁ-ゖ]$/u.test(character)) previousScript = 'hiragana';
        else if (/^[ァ-ヶ]$/u.test(character)) previousScript = 'katakana';
    }
    return sawIteration ? reading : null;
}

function makeIterationFallbackToken(token, surface, reading) {
    return makeDerivedSpanToken([token], 0, 0, {
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        iterationMarkFallbackMatched: true,
        iterationMarkFallbackReading: reading
    }, {
        annotations: ['iterationMarkFallbackMatched', 'iterationMarkFallbackReading'],
        evidenceSource: 'iteration-mark-fallback', semanticRole: 'iteration-reading'
    });
}

function mergeIterationMarkFallbackTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const next = tokens[index + 1];
        if (!token) continue;

        const surface = String(token.surface_form || '');
        if (!getKuromojiDictionaryReading(token)) {
            const internalKanaReading = expandKanaIterationReading(surface);
            if (internalKanaReading) { merged.push(makeIterationFallbackToken(token, surface, internalKanaReading)); continue; }
        }

        if (!hasReviewedLexicalBoundaryBefore(next) && String(next?.surface_form || '') === '々') {
            const reading = getSingleHanIterationFallbackReading(token);
            if (reading) {
                merged.push(makeDerivedSpanToken(tokens, index, index + 1, { surface_form: surface + '々', reading: reading + reading, pronunciation: reading + reading, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', iterationMarkFallbackMatched: true, iterationMarkFallbackReading: reading + reading }, { annotations: ['iterationMarkFallbackMatched', 'iterationMarkFallbackReading'], evidenceSource: 'iteration-mark-fallback', semanticRole: 'iteration-reading' }));
                index += 1;
                continue;
            }
        }

        if (!hasReviewedLexicalBoundaryBefore(next) && Object.prototype.hasOwnProperty.call(kanaIterationMarkVoicing, String(next?.surface_form || ''))) {
            const combinedSurface = surface + String(next.surface_form || '');
            const reading = expandKanaIterationReading(combinedSurface);
            if (reading) {
                merged.push(makeDerivedSpanToken(tokens, index, index + 1, { surface_form: combinedSurface, reading, pronunciation: reading, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', iterationMarkFallbackMatched: true, iterationMarkFallbackReading: reading }, { annotations: ['iterationMarkFallbackMatched', 'iterationMarkFallbackReading'], evidenceSource: 'iteration-mark-fallback', semanticRole: 'iteration-reading' }));
                index += 1;
                continue;
            }
        }
        merged.push(token);
    }
    return merged;
}

function findReviewedNumericAliasSpan(tokens, startIndex) {
    const first = tokens[startIndex];
    if (!first) return null;
    const firstSurface = String(first.surface_form || '');
    const firstPreference = getReviewedReadingPreferenceForSurface(firstSurface);

    // Standard numeral + reviewed counter alias, e.g. 三疋 -> 三匹.
    if (isReviewedNumericBaseToken(first) && startIndex + 1 < tokens.length) {
        const next = tokens[startIndex + 1];
        if (hasReviewedLexicalBoundaryBefore(next)) return null;
        const nextPreference = getReviewedReadingPreferenceForSurface(next?.surface_form);
        if (nextPreference?.numericRole === 'counter' && nextPreference.numericCanonical) {
            const canonicalSurface = canonicalizeReviewedNumericAliasSurface(firstSurface + String(next.surface_form || ''));
            const resolved = getCanonicalNumericAliasReading(canonicalSurface);
            if (resolved) return { endIndex: startIndex + 1, canonicalSurface, resolved };
        }
    }

    if (!firstPreference?.numericCanonical || firstPreference.numericRole !== 'numeral') return null;
    const next = tokens[startIndex + 1] || null;
    const hasNumericContext = Boolean(next && isReviewedNumericContinuationToken(next));
    if (!hasNumericContext) return null;

    let originalSurface = firstSurface;
    let canonicalSurface = canonicalizeReviewedNumericAliasSurface(originalSurface);
    let best = getCanonicalNumericAliasReading(canonicalSurface)
        ? { endIndex: startIndex, canonicalSurface, resolved: getCanonicalNumericAliasReading(canonicalSurface) }
        : null;

    for (let endIndex = startIndex + 1; endIndex < tokens.length && endIndex <= startIndex + 3; endIndex += 1) {
        const token = tokens[endIndex];
        if (hasReviewedLexicalBoundaryBefore(token)) break;
        const surface = String(token?.surface_form || '');
        if (!token || isSeparatedNumericUnitSurface(surface)) break;
        if (!isReviewedNumericContinuationToken(token)) break;
        originalSurface += surface;
        canonicalSurface = canonicalizeReviewedNumericAliasSurface(originalSurface);
        const resolved = getCanonicalNumericAliasReading(canonicalSurface);
        if (resolved) best = { endIndex, canonicalSurface, resolved };
        if (token.pos_detail_2 === '助数詞' || ['人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階'].includes(surface)) break;
    }
    return best;
}

function mergeReviewedNumericAliasTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const match = findReviewedNumericAliasSpan(tokens, index);
        if (!match) { merged.push(tokens[index]); continue; }
        merged.push(makeReviewedNumericAliasToken(tokens, index, match.endIndex, match.canonicalSurface, match.resolved));
        index = match.endIndex;
    }
    return merged;
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestSourceOrthographyReviewedProperNameSpan(tokens, startIndex, sourceSpanCandidates = []) {
    const first = tokens?.[startIndex];
    if (!first || !Number.isInteger(first.sourceStart)) return null;
    const matches = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.kind === 'reviewed-name'
        && candidate?.evidenceSource === 'reviewed-proper-name-span'
        && candidate?.metadata?.sourceOrthographyPreserved === true
        && candidate.reviewRequired !== true
        && candidate.sourceStart === first.sourceStart
        && Number.isInteger(candidate.sourceEnd)
        && candidate.sourceEnd > candidate.sourceStart
        && candidate.reading
        && candidate.romaji);
    let best = null;
    for (const candidate of matches) {
        let endIndex = -1;
        for (let index = startIndex; index < tokens.length; index += 1) {
            const token = tokens[index];
            if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) break;
            if (index > startIndex && tokens[index - 1]?.sourceEnd !== token.sourceStart) break;
            const tokenEnd = Number(token.sourceEnd);
            if (tokenEnd === candidate.sourceEnd) { endIndex = index; break; }
            if (tokenEnd > candidate.sourceEnd) break;
        }
        if (endIndex < startIndex) continue;
        const reconstructed = tokens.slice(startIndex, endIndex + 1).map(token => String(token.surface_form || '')).join('');
        if (reconstructed !== String(candidate.sourceSurface || '')) continue;
        const evidence = runtimeState.reviewedProperNameSpanDictionary.get(String(candidate.lookupSurface || ''));
        if (!evidence || normalizeKanaReading(evidence.reading || '') !== normalizeKanaReading(candidate.reading || '')
            || String(evidence.romaji || '') !== String(candidate.romaji || '')) continue;
        const match = {
            surface: reconstructed,
            lookupSurface: String(candidate.lookupSurface || ''),
            reading: candidate.reading,
            romaji: candidate.romaji,
            category: evidence.category,
            endIndex,
            endOffset: Array.from(String(tokens[endIndex]?.surface_form || '')).length,
            length: endIndex - startIndex + 1,
            sourceOrthographyPreserved: true
        };
        if (!best || candidate.sourceEnd > best.sourceEnd) best = { ...match, sourceEnd: candidate.sourceEnd };
    }
    if (!best) return null;
    const { sourceEnd: _sourceEnd, ...result } = best;
    return result;
}

function findLongestReviewedProperNameSpan(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        const nameWhitespace = token?.pos === '記号' && token?.pos_detail_1 === '空白';
        if (!token || token.contextualOverrideMatched) break;
        const tokenSurface = String(token.surface_form || '');
        if (token.pos === '記号' && !nameWhitespace && !isIdeographicVariationSelectorSequence(tokenSurface)) {
            const punctuationProbe = normalizeKanjiForLookup((candidateSurface + tokenSurface).replace(/\s+/gu, ' '), { names: true });
            if (!runtimeState.reviewedProperNameSpanPrefixes.has(punctuationProbe)) break;
        }
        const prefixSurface = candidateSurface;
        const tokenCharacters = Array.from(String(token.surface_form || ''));
        let stillPossible = false;
        for (let offset = 1; offset <= tokenCharacters.length; offset += 1) {
            const matchedSurface = prefixSurface + tokenCharacters.slice(0, offset).join('');
            const normalizedProbe = normalizeKanjiForLookup(matchedSurface.replace(/\s+/gu, ' '), { names: true });
            if (runtimeState.reviewedProperNameSpanPrefixes.has(normalizedProbe)) stillPossible = true;
            const evidence = runtimeState.reviewedProperNameSpanDictionary.get(normalizedProbe);
            if (!evidence) continue;
            const remainder = tokenCharacters.slice(offset).join('');
            const honorifics = ['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏'];
            let allowedRemainder = !remainder || honorifics.includes(remainder);
            if (!allowedRemainder) {
                for (const honorific of honorifics) {
                    if (!honorific.startsWith(remainder)) continue;
                    let following = '';
                    for (let cursor = end + 1; cursor < tokens.length && following.length < honorific.length; cursor += 1) {
                        const nextSurface = String(tokens[cursor]?.surface_form || '');
                        if (!nextSurface || (tokens[cursor]?.pos === '記号' && tokens[cursor]?.pos_detail_1 === '空白')) break;
                        following += nextSurface;
                    }
                    if ((remainder + following).startsWith(honorific)) { allowedRemainder = true; break; }
                }
            }
            if (!allowedRemainder) continue;
            const match = { surface: matchedSurface, lookupSurface: normalizedProbe, ...evidence, endIndex: end, endOffset: offset, length: end - startIndex + 1 };
            if (!bestMatch || Array.from(normalizedProbe).length > Array.from(bestMatch.lookupSurface).length) bestMatch = match;
        }
        candidateSurface = prefixSurface + tokenCharacters.join('');
        const normalizedCandidate = normalizeKanjiForLookup(candidateSurface.replace(/\s+/gu, ' '), { names: true });
        if (!runtimeState.reviewedProperNameSpanPrefixes.has(normalizedCandidate)) break;
        if (!stillPossible && !bestMatch) break;
    }
    return bestMatch;
}

function getReviewedNameHonorificReading(surface) {
    const readings = new Map([['さん', 'さん'], ['さま', 'さま'], ['様', 'さま'], ['くん', 'くん'], ['君', 'くん'], ['ちゃん', 'ちゃん'], ['氏', 'し']]);
    return readings.get(String(surface || '')) || null;
}

function tokenizeReviewedNameRemainder(token, consumedCharacters) {
    const surface = String(token?.surface_form || '');
    const remainder = Array.from(surface).slice(consumedCharacters).join('');
    if (!remainder) return [];
    const honorificReading = getReviewedNameHonorificReading(remainder);
    if (honorificReading) {
        return [makeDerivedSubspanToken(token, consumedCharacters, Array.from(surface).length, {
            surface_form: remainder,
            reading: honorificReading,
            pronunciation: honorificReading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading
        }, {
            annotations: ['reviewedNameHonorificMatched', 'reviewedNameHonorificReading'],
            evidenceSource: 'reviewed-name-honorific', semanticRole: 'name-honorific'
        })];
    }
    return tokenizeHistoricalRemainder(token, consumedCharacters);
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeReviewedProperNameSpanTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const surfaceMatch = findLongestReviewedProperNameSpan(tokens, index);
        const sourceOrthographyMatch = findLongestSourceOrthographyReviewedProperNameSpan(tokens, index, sourceSpanCandidates);
        const bestMatch = !surfaceMatch || (sourceOrthographyMatch && sourceOrthographyMatch.length >= surfaceMatch.length)
            ? sourceOrthographyMatch
            : surfaceMatch;
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const personLike = bestMatch.category === 'person' || bestMatch.category === 'name';
        const originalToken = tokens[index];
        const originalSurfaceLength = Array.from(String(originalToken?.surface_form || '')).length;
        const exactSingleTokenMatch = bestMatch.endIndex === index && bestMatch.endOffset === originalSurfaceLength;
        const originalReading = normalizeKanaReading(originalToken?.reading || originalToken?.pronunciation || '');
        const reviewedReading = normalizeKanaReading(bestMatch.reading || '');
        const followingHonorific = exactSingleTokenMatch
            ? getReviewedNameHonorificReading(tokens[index + 1]?.surface_form)
            : null;
        const lexicalCollision = Boolean(
            exactSingleTokenMatch
            && !isProperNounToken(originalToken)
            && !followingHonorific
            && originalReading
            && reviewedReading
            && originalReading !== reviewedReading
        );
        merged.push(makeDerivedMatchedSpanToken(tokens, index, bestMatch.endIndex, bestMatch.endOffset, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: personLike ? '人名' : '地域', pos_detail_3: '*',
            reviewedProperNameSpanMatched: true, reviewedProperNameSpanRomaji: bestMatch.romaji,
            reviewedProperNameLookupSurface: bestMatch.lookupSurface,
            reviewedProperNameVariantMappings: normalizeKanjiForLookupDetailed(bestMatch.surface, { names: true }).mappings,
            reviewedProperNameLexicalCollision: lexicalCollision,
            reviewedProperNameLexicalReading: lexicalCollision ? originalReading : null
        }, {
            annotations: ['reviewedProperNameSpanMatched', 'reviewedProperNameSpanRomaji', 'reviewedProperNameLookupSurface', 'reviewedProperNameVariantMappings', 'reviewedProperNameLexicalCollision', 'reviewedProperNameLexicalReading'],
            evidenceSource: 'reviewed-proper-name-span', semanticRole: 'proper-name-span'
        }));
        const finalToken = tokens[bestMatch.endIndex];
        const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
        if (bestMatch.endOffset < finalLength) merged.push(...tokenizeReviewedNameRemainder(finalToken, bestMatch.endOffset));
        index = bestMatch.endIndex;
    }
    return merged;
}

function getEquivalentProperNounVariantCandidates(canonicalSurface) {
    const sourceSurfaces = runtimeState.properNounVariantEvidenceSurfaces.get(String(canonicalSurface || ''));
    if (!sourceSurfaces?.size) return [];
    const merged = new Map();
    for (const sourceSurface of sourceSurfaces) {
        const candidates = runtimeState.properNounDictionary.get(sourceSurface);
        if (!candidates?.size) continue;
        for (const candidate of candidates.values()) {
            const readingKey = normalizeKanaReading(candidate?.reading || '');
            if (!readingKey) continue;
            const existing = merged.get(readingKey);
            if (!existing) {
                merged.set(readingKey, {
                    ...candidate,
                    categories: new Set(candidate.categories || []),
                    sources: new Set(candidate.sources || []),
                    variantEvidenceSurfaces: new Set([sourceSurface])
                });
                continue;
            }
            existing.weight = Math.max(Number(existing.weight || 0), Number(candidate.weight || 0));
            const rank = Number(candidate.rank);
            if (Number.isFinite(rank) && rank > 0) existing.rank = Math.min(Number(existing.rank || Number.POSITIVE_INFINITY), rank);
            for (const category of candidate.categories || []) existing.categories.add(category);
            for (const source of candidate.sources || []) existing.sources.add(source);
            existing.variantEvidenceSurfaces.add(sourceSurface);
        }
    }
    return [...merged.values()];
}

function getProperNounCandidateLookup(surface) {
    const originalSurface = String(surface || '');
    const variantEvidence = normalizeKanjiForLookupDetailed(originalSurface, { names: true });
    const exact = runtimeState.properNounDictionary.get(originalSurface);
    if (exact?.size) {
        return { candidates: [...exact.values()], lookupSurface: originalSurface, variant: null, variantEvidence: variantEvidence.changed ? variantEvidence : null, equivalentEvidence: false };
    }
    if (!variantEvidence.changed || !variantEvidence.normalizedSurface) {
        const equivalent = getEquivalentProperNounVariantCandidates(originalSurface);
        return equivalent.length
            ? { candidates: equivalent, lookupSurface: originalSurface, variant: null, variantEvidence: null, equivalentEvidence: true }
            : { candidates: [], lookupSurface: originalSurface, variant: null, variantEvidence: null, equivalentEvidence: false };
    }
    const normalized = runtimeState.properNounDictionary.get(variantEvidence.normalizedSurface);
    if (normalized?.size) {
        return { candidates: [...normalized.values()], lookupSurface: variantEvidence.normalizedSurface, variant: variantEvidence, variantEvidence, equivalentEvidence: false };
    }
    const equivalent = getEquivalentProperNounVariantCandidates(variantEvidence.normalizedSurface);
    return equivalent.length
        ? { candidates: equivalent, lookupSurface: variantEvidence.normalizedSurface, variant: variantEvidence, variantEvidence, equivalentEvidence: true }
        : { candidates: [], lookupSurface: originalSurface, variant: null, variantEvidence, equivalentEvidence: false };
}

function inferVariantProperNounDetails(candidates) {
    const categories = new Set();
    for (const candidate of candidates || []) for (const category of candidate.categories || []) categories.add(category);
    if (categories.has('fam')) return { pos_detail_2: '人名', pos_detail_3: '姓' };
    if (categories.has('per') || categories.has('person') || categories.has('char')) return { pos_detail_2: '人名', pos_detail_3: '*' };
    if (categories.has('loc')) return { pos_detail_2: '地域', pos_detail_3: '*' };
    return { pos_detail_2: '一般', pos_detail_3: '*' };
}

function canContinueVariantProperNounSpan(surface) {
    const original = String(surface || '');
    if (runtimeState.properNounPrefixes.has(original)) return true;
    const canonical = normalizeKanjiForLookup(original, { names: true });
    return runtimeState.properNounPrefixes.has(canonical)
        || runtimeState.properNounVariantEvidencePrefixes.has(canonical);
}

function findLongestVariantProperNoun(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.sourceSpanLexicalCandidateMatched || token.reviewedProperNameSpanMatched
            || token.locationSuffixRoleMatched || token.locationSuffixContextMatched
            || token.sourceOrthographyEquivalentPersonNameRoleMatched
            || token.sourceOrthographyExactFullPersonNameRoleMatched
            || token.sourceOrthographyCorroboratedVariantFullPersonNameRoleMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const hanSurface = containsHan(tokenSurface);
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const lexicalBoundaryToken = ((token.pos === '記号' && tokenSurface !== '々') || isParticle(token) || token.contextualOverrideMatched) && !hanSurface;
        if (lexicalBoundaryToken && !canContinueVariantProperNounSpan(nextCandidateSurface)) break;
        candidateSurface = nextCandidateSurface;
        if (!canContinueVariantProperNounSpan(candidateSurface)) break;
        const hanCount = Array.from(candidateSurface).filter(isHanCharacter).length;
        const lookup = getProperNounCandidateLookup(candidateSurface);
        const mixedScriptCanonicalVariant = hanCount === 1
            && Array.from(candidateSurface).length > 1
            && lookup.variantEvidence?.changed === true
            && lookup.lookupSurface !== candidateSurface
            && lookup.candidates.length > 0;
        if (hanCount < 2 && !mixedScriptCanonicalVariant) continue;
        const variantAuthority = lookup.variantEvidence || (lookup.equivalentEvidence ? { changed: false, mappings: [] } : null);
        if (!variantAuthority || !lookup.candidates.length) continue;
        bestMatch = { surface: candidateSurface, lookupSurface: lookup.lookupSurface, candidates: lookup.candidates, variant: variantAuthority, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function tokenizeCanonicalVariantProperNoun(bestMatch, sourceTokens, startIndex) {
    if (!runtimeState.tokenizer || !bestMatch?.lookupSurface) return [];
    const canonicalTokens = runtimeState.tokenizer.tokenize(bestMatch.lookupSurface) || [];
    const reconstructed = canonicalTokens.map(token => String(token.surface_form || '')).join('');
    if (!canonicalTokens.length || reconstructed !== bestMatch.lookupSurface) return [];

    const originalCharacters = Array.from(String(bestMatch.surface || ''));
    const canonicalCharacters = Array.from(String(bestMatch.lookupSurface || ''));
    if (originalCharacters.length !== canonicalCharacters.length) return [];
    const fullSourceSpan = getCompleteDerivedSourceSpan(sourceTokens, startIndex, startIndex + bestMatch.length - 1);
    if (!fullSourceSpan) {
        return canonicalTokens.map(token => ({
            ...token,
            variantCanonicalRetokenized: true,
            variantOriginalSurface: bestMatch.surface,
            variantLookupSurface: bestMatch.lookupSurface,
            variantMappings: bestMatch.variant.mappings
        }));
    }
    const sourceToken = {
        surface_form: bestMatch.surface,
        sourceStart: fullSourceSpan.sourceStart,
        sourceEnd: fullSourceSpan.sourceEnd,
        sourceSurface: fullSourceSpan.sourceSurface
    };
    let characterOffset = 0;
    const derived = [];
    for (const canonicalToken of canonicalTokens) {
        const canonicalLength = Array.from(String(canonicalToken.surface_form || '')).length;
        if (!canonicalLength || characterOffset + canonicalLength > originalCharacters.length) return [];
        derived.push(makeDerivedSubspanToken(sourceToken, characterOffset, characterOffset + canonicalLength, {
            ...canonicalToken,
            variantCanonicalRetokenized: true,
            variantOriginalSurface: originalCharacters.slice(characterOffset, characterOffset + canonicalLength).join(''),
            variantLookupSurface: String(canonicalToken.surface_form || ''),
            variantMappings: bestMatch.variant.mappings
        }, {
            annotations: ['variantCanonicalRetokenized', 'variantOriginalSurface', 'variantLookupSurface', 'variantMappings'],
            evidenceSource: 'proper-noun-variant-canonical-retokenization', semanticRole: 'proper-name-canonical-subspan'
        }));
        characterOffset += canonicalLength;
    }
    return characterOffset === originalCharacters.length ? derived : [];
}

function mergeVariantProperNounTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestVariantProperNoun(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const canonicalTokens = tokenizeCanonicalVariantProperNoun(bestMatch, tokens, index);
        if (canonicalTokens.length) {
            merged.push(...canonicalTokens);
            index += bestMatch.length - 1;
            continue;
        }
        const details = inferVariantProperNounDetails(bestMatch.candidates);
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: '*', pronunciation: '*', pos: '名詞', pos_detail_1: '固有名詞',
            pos_detail_2: details.pos_detail_2, pos_detail_3: details.pos_detail_3, variantProperNounMatched: true,
            variantLookupSurface: bestMatch.lookupSurface, variantMappings: bestMatch.variant.mappings
        }, {
            annotations: ['variantProperNounMatched', 'variantLookupSurface', 'variantMappings'],
            evidenceSource: 'proper-noun-variant-evidence', semanticRole: 'proper-name-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

// Source section: Proper-name ranking, Kuromoji pronunciation safeguards and reading evidence.
function getProperNounCategoryHints(token) {
    const hints = new Set();
    if (token?.locationSuffixRoleMatched) {
        hints.add('loc');
        return hints;
    }
    if (token?.nameHonorificRoleMatched) {
        hints.add('fam');
        hints.add('per');
        hints.add('person');
        hints.add('char');
        return hints;
    }
    const detail2 = String(token?.pos_detail_2 || '');
    const detail3 = String(token?.pos_detail_3 || '');
    if (detail2 === '地域') hints.add('loc');
    if (detail2 === '人名') { hints.add('per'); hints.add('person'); hints.add('char'); }
    if (detail3 === '姓') hints.add('fam');
    if (detail3 === '名') hints.add('per');
    return hints;
}

function rankProperNounCandidates(candidates) {
    const ranked = [...(candidates || [])].sort((left, right) => {
        const weightDifference = Number(right?.weight || 0) - Number(left?.weight || 0);
        if (weightDifference) return weightDifference;
        const sourceDifference = (right?.sources?.size || 0) - (left?.sources?.size || 0);
        if (sourceDifference) return sourceDifference;
        const leftRank = Number.isFinite(left?.rank) ? left.rank : Number.POSITIVE_INFINITY;
        const rightRank = Number.isFinite(right?.rank) ? right.rank : Number.POSITIVE_INFINITY;
        return leftRank - rightRank;
    });
    const top = ranked[0] || null;
    const second = ranked[1] || null;
    if (!top) return { selected: null, ranked, margin: 0, confidence: 0 };
    if (!second) return { selected: top, ranked, margin: 100, confidence: 0.96 };
    const topWeight = Number(top.weight || 0);
    const secondWeight = Number(second.weight || 0);
    const margin = topWeight - secondWeight;
    const sourceLead = (top.sources?.size || 0) - (second.sources?.size || 0);
    const topRank = Number.isFinite(top.rank) ? top.rank : Number.POSITIVE_INFINITY;
    const secondRank = Number.isFinite(second.rank) ? second.rank : Number.POSITIVE_INFINITY;
    const rankLead = Number.isFinite(topRank) && Number.isFinite(secondRank) && topRank > 0 ? secondRank / topRank : 1;
    const clearWeightLead = margin >= 15 && topWeight >= 60;
    const corroboratedLead = margin >= 8 && sourceLead > 0;
    const clearRankLead = margin > 0 && rankLead >= 3;
    const selected = clearWeightLead || corroboratedLead || clearRankLead ? top : null;
    const confidence = selected ? Math.min(0.93, 0.68 + Math.min(0.18, margin / 250) + Math.min(0.07, topWeight / 1000)) : 0.38;
    return { selected, ranked, margin, confidence };
}

/** @param {CJ2RToken} token */
function assessOrdinaryNounProperNameConflict(token, selectedReading) {
    if (!token || token.pos !== '名詞' || token.pos_detail_1 !== '一般' || isProperNounToken(token) || token.nameHonorificRoleMatched || token.locationSuffixRoleMatched) return null;
    const normalizedSelected = normalizeKanaReading(selectedReading || '');
    if (!normalizedSelected) return null;
    const sourceOrthographyCandidates = Array.isArray(token.sourceOrthographyProperNounCandidates)
        ? token.sourceOrthographyProperNounCandidates
        : [];
    const lookup = getProperNounCandidateLookup(token.surface_form);
    const candidates = sourceOrthographyCandidates.length ? sourceOrthographyCandidates : (lookup.candidates || []);
    const distinctReadings = new Set(candidates.map(candidate => normalizeKanaReading(candidate?.reading || '')).filter(Boolean));
    if (distinctReadings.size !== 1) return null;
    const incompatibleCandidates = candidates.filter(candidate => normalizeKanaReading(candidate?.reading || '') !== normalizedSelected);
    if (!incompatibleCandidates.length) return null;
    return {
        candidates,
        incompatibleCandidates,
        variantMappings: lookup.variant?.mappings || []
    };
}

function resolveProperNounReading(token) {
    if (!token || (!isProperNounToken(token) && !token.nameHonorificRoleMatched && !token.locationSuffixRoleMatched)) return null;
    const sourceOrthographyCandidates = Array.isArray(token.sourceOrthographyProperNounCandidates)
        ? token.sourceOrthographyProperNounCandidates
        : [];
    const lookup = getProperNounCandidateLookup(token.nameHonorificCandidateSurface || token.locationSuffixCandidateSurface || token.surface_form);
    const candidates = sourceOrthographyCandidates.length ? sourceOrthographyCandidates : lookup.candidates;
    if (!candidates.length) return null;
    const tokenVariantMappings = Array.isArray(token.variantMappings) ? token.variantMappings : [];
    const variant = lookup.variant || ((token.variantCanonicalRetokenized || token.variantProperNounMatched) && tokenVariantMappings.length
        ? { mappings: tokenVariantMappings }
        : null);
    const sourceOrthographyExact = sourceOrthographyCandidates.length > 0;
    const sourcePrefix = sourceOrthographyExact ? 'proper-noun-source-orthography' : (variant ? 'proper-noun-variant' : 'proper-noun');
    const canonicalLexicalReviewFlags = token.sourceOrthographyCanonicalLexicalReviewRequired
        ? ['whole-word-reading-ambiguous']
        : [];
    const variantFlags = sourceOrthographyExact
        ? canonicalLexicalReviewFlags
        : (variant ? ['variant-reading-evidence'] : []);
    const hints = getProperNounCategoryHints(token);
    const categoryMatches = candidates.filter(candidate => [...candidate.categories].some(category => hints.has(category)));
    const contextualRoleMatched = Boolean(token.nameHonorificRoleMatched || token.locationSuffixRoleMatched);
    const roleCandidates = contextualRoleMatched && categoryMatches.length ? categoryMatches : candidates;
    const resolutionCandidates = contextualRoleMatched ? roleCandidates : candidates;
    const kuromojiReading = getKuromojiDictionaryReading(token);
    const normalizedKuromoji = normalizeKanaReading(kuromojiReading);
    const kuromojiMatch = normalizedKuromoji ? roleCandidates.find(candidate => normalizeKanaReading(candidate.reading) === normalizedKuromoji) : null;
    if (kuromojiMatch) {
        const relevantCandidates = categoryMatches.length ? categoryMatches : candidates;
        const relevantReadings = new Set(relevantCandidates.map(candidate => normalizeKanaReading(candidate.reading)));
        const ambiguous = relevantReadings.size > 1;
        return {
            reading: kuromojiMatch.reading, romaji: kuromojiMatch.romaji, source: `${sourcePrefix}+kuromoji`,
            confidence: ambiguous ? 0.78 : (variant ? 0.95 : 0.99), candidates: resolutionCandidates,
            flags: [...variantFlags, ...(ambiguous ? ['proper-noun-ambiguous'] : [])],
            variantMappings: variant?.mappings || [], ambiguous
        };
    }
    if (roleCandidates.length === 1) {
        const roleSource = token.nameHonorificRoleMatched ? `${sourcePrefix}-honorific-role`
            : (token.locationSuffixRoleMatched ? `${sourcePrefix}-location-suffix-role` : sourcePrefix);
        return { reading: roleCandidates[0].reading, romaji: roleCandidates[0].romaji, source: roleSource, confidence: variant ? 0.91 : 0.96, candidates: resolutionCandidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const categoryReadings = new Map(categoryMatches.map(candidate => [normalizeKanaReading(candidate.reading), candidate]));
    if (categoryReadings.size === 1) {
        const candidate = [...categoryReadings.values()][0];
        return { reading: candidate.reading, romaji: candidate.romaji, source: `${sourcePrefix}-category`, confidence: variant ? 0.86 : 0.90, candidates: resolutionCandidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const ranking = rankProperNounCandidates(contextualRoleMatched ? roleCandidates : (categoryMatches.length ? categoryMatches : candidates));
    if (ranking.selected) {
        return { reading: ranking.selected.reading, romaji: ranking.selected.romaji, source: `${sourcePrefix}-ranked`, confidence: Math.max(0.55, ranking.confidence - (variant ? 0.04 : 0)), candidates: resolutionCandidates, flags: [...variantFlags, 'proper-noun-ambiguous'], variantMappings: variant?.mappings || [], ambiguous: true };
    }
    return { reading: null, romaji: null, source: `${sourcePrefix}-ambiguous`, confidence: variant ? 0.30 : 0.35, candidates: resolutionCandidates, flags: [...variantFlags, 'proper-noun-ambiguous', 'unresolved-reading'], variantMappings: variant?.mappings || [], ambiguous: true };
}

function getSafeOrthographicPronunciation(readingValue, pronunciationValue) {
    const reading = normalizeKanaReading(readingValue || '');
    const pronunciation = normalizeKanaReading(pronunciationValue || '');
    if (!reading || !pronunciation || reading === pronunciation) return null;

    const allowedChanges = { 'は': 'わ', 'へ': 'え', 'を': 'お' };
    const readingKana = Array.from(reading);
    const pronunciationKana = Array.from(pronunciation);
    if (readingKana.length !== pronunciationKana.length) return null;

    let changed = false;
    for (let index = 0; index < readingKana.length; index += 1) {
        if (readingKana[index] === pronunciationKana[index]) continue;
        if (allowedChanges[readingKana[index]] !== pronunciationKana[index]) return null;
        changed = true;
    }
    return changed ? pronunciation : null;
}

function getKanaOrthographicPronunciation(token) {
    const surface = normalizeKanaReading(token?.surface_form || '');
    const reading = normalizeKanaReading(token?.reading || '');
    if (!surface || surface !== reading) return null;
    return getSafeOrthographicPronunciation(reading, token?.pronunciation);
}

function getMixedScriptOrthographicPronunciation(token) {
    if (!token || isProperNounToken(token) || /^[ぁ-ゖァ-ンヴー]+$/.test(String(token.surface_form || ''))) return null;
    if (!['接続詞', '副詞'].includes(String(token.pos || ''))) return null;
    const reading = normalizeKanaReading(token.reading || '');
    const pronunciation = normalizeKanaReading(token.pronunciation || '');
    if (!reading || !pronunciation || reading.length !== pronunciation.length) return null;
    let changed = false;
    for (let index = 0; index < reading.length; index += 1) {
        if (reading[index] === pronunciation[index]) continue;
        if (reading[index] !== 'は' || pronunciation[index] !== 'わ') return null;
        changed = true;
    }
    return changed ? pronunciation : null;
}

function parseKuromojiDictionaryFeatures(featureText) {
    const fields = String(featureText || '').split(',');
    if (fields.length < 10) return null;
    return {
        surface_form: fields[0], pos: fields[1], pos_detail_1: fields[2], pos_detail_2: fields[3], pos_detail_3: fields[4],
        conjugated_type: fields[5], conjugated_form: fields[6], basic_form: fields[7], reading: fields[8], pronunciation: fields[9]
    };
}

function getKuromojiExactDictionaryCandidates(surface) {
    const value = String(surface || '');
    const trie = runtimeState.tokenizer?.viterbi_builder?.trie;
    const dictionary = runtimeState.tokenizer?.token_info_dictionary;
    if (!value || !trie || !dictionary) return [];
    const trieId = trie.lookup(value);
    if (!Number.isInteger(trieId) || trieId < 0) return [];
    const tokenIds = dictionary.target_map?.[trieId] || [];
    return tokenIds
        .map(tokenId => parseKuromojiDictionaryFeatures(dictionary.getFeatures(tokenId)))
        .filter(candidate => candidate && candidate.surface_form === value);
}

function assessKuromojiWholeWordAmbiguity(token, currentReading) {
    if (!token || !containsHan(token.surface_form) || isProperNounToken(token)) return null;
    const candidates = getKuromojiExactDictionaryCandidates(token.surface_form)
        .filter(candidate => candidate.pos === token.pos && candidate.pos_detail_1 !== '固有名詞')
        .map(candidate => normalizeKanaReading(candidate.reading))
        .filter(Boolean);
    const uniqueReadings = [...new Set(candidates)];
    if (uniqueReadings.length < 2) return null;
    const normalizedCurrent = normalizeKanaReading(currentReading);
    return {
        readings: uniqueReadings,
        candidates: uniqueReadings.map(reading => ({
            reading,
            romaji: convertToRomaji(reading),
            weight: normalizeKanaReading(reading) === normalizedCurrent ? 100 : 0,
            rank: Number.POSITIVE_INFINITY,
            categories: new Set(['lexical']),
            sources: new Set(['kuromoji-exact-dictionary'])
        }))
    };
}

function selectExactDictionaryRescue(tokens, startIndex, endIndex, sourceText, candidateSurface) {
    const candidates = getKuromojiExactDictionaryCandidates(candidateSurface);
    if (!candidates.length) return null;
    const span = tokens.slice(startIndex, endIndex + 1);

    // Closed-class lexical entries may be restored when context caused Kuromoji
    // to split an exact kana word into multiple non-particle tokens.
    const lexicalCandidates = candidates.filter(candidate =>
        candidate.pos === '連体詞'
        && /^[ぁ-ゖァ-ンヴー]+$/u.test(candidate.surface_form)
        && normalizeKanaReading(candidate.surface_form) === normalizeKanaReading(candidate.reading)
    );
    const lexicalReadings = new Set(lexicalCandidates.map(candidate => normalizeKanaReading(candidate.reading)));
    if (lexicalCandidates.length && lexicalReadings.size === 1 && !span.some(isParticle)) {
        return { ...lexicalCandidates[0], source: 'kuromoji-exact-lexical', confidence: 0.99 };
    }

    // Historical kana in proper names can make Viterbi prefer a fake へ/を
    // particle split. Rescue only an isolated exact-name input; sentence context
    // such as みつを食べる must keep the genuine particle interpretation.
    const hasSuspiciousParticle = span.some(token => isParticle(token) && ['へ', 'を'].includes(String(token.surface_form || '')));
    if (!hasSuspiciousParticle || isParticle(span[0])) return null;
    const { coreText } = splitTrailingPunctuation(String(sourceText || ''));
    if (coreText.trim() !== candidateSurface) return null;
    const properCandidates = candidates.filter(candidate =>
        candidate.pos === '名詞'
        && candidate.pos_detail_1 === '固有名詞'
        && getSafeOrthographicPronunciation(candidate.reading, candidate.pronunciation)
    );
    const properPronunciations = new Set(properCandidates.map(candidate => normalizeKanaReading(candidate.pronunciation)));
    if (!properCandidates.length || properPronunciations.size !== 1) return null;
    return { ...properCandidates[0], source: 'kuromoji-exact-proper-name', confidence: 0.93 };
}

function getKuromojiExactDictionaryPrefixMatches(tokens, startIndex) {
    const trie = runtimeState.tokenizer?.viterbi_builder?.trie;
    if (!trie || typeof trie.commonPrefixSearch !== 'function') return [];
    let remainingSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        remainingSurface += String(token.surface_form || '');
    }
    return trie.commonPrefixSearch(remainingSurface).map(match => String(match?.k || '')).filter(Boolean);
}

function findLongestExactDictionaryRescue(tokens, startIndex, sourceText) {
    let candidateSurface = '';
    let bestMatch = null;
    const dictionaryMatches = getKuromojiExactDictionaryPrefixMatches(tokens, startIndex);
    if (!dictionaryMatches.length) return null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += String(token.surface_form || '');
        const stillPossible = dictionaryMatches.some(surface => surface.startsWith(candidateSurface));
        if (!stillPossible) break;
        if (end === startIndex) continue;
        const rescue = selectExactDictionaryRescue(tokens, startIndex, end, sourceText, candidateSurface);
        if (rescue) bestMatch = { ...rescue, surface: candidateSurface, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeExactDictionaryRescueTokens(tokens, sourceText) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestExactDictionaryRescue(tokens, index, sourceText);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.pronunciation,
            pos: bestMatch.pos,
            pos_detail_1: bestMatch.pos_detail_1,
            pos_detail_2: bestMatch.pos_detail_2,
            pos_detail_3: bestMatch.pos_detail_3,
            exactDictionaryRescueMatched: true,
            exactDictionaryRescueSource: bestMatch.source,
            exactDictionaryRescueConfidence: bestMatch.confidence
        }, {
            annotations: ['exactDictionaryRescueMatched', 'exactDictionaryRescueSource', 'exactDictionaryRescueConfidence'],
            evidenceSource: bestMatch.source || 'kuromoji-exact-dictionary',
            semanticRole: 'exact-dictionary-reading',
            confidence: bestMatch.confidence
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}


function getContextTokenTerms(token) {
    const terms = new Set();
    const surface = String(token?.surface_form || '').trim();
    const basic = tokenBasicForm(token);
    if (surface) terms.add(surface);
    if (basic) terms.add(basic);
    return terms;
}

function isContextEvidenceHardBoundaryToken(token) {
    const surface = String(token?.surface_form || '');
    if (!surface) return false;
    for (let index = 0; index < surface.length; index += 1) {
        const character = surface[index];
        if (isCanonicalTransparentBoundaryCharacter(character) && !canonicalHardWhitespaceCharacters.has(character)) continue;
        if (isCanonicalHardBoundaryAt(surface, index)) return true;
    }
    return false;
}

const contextEvidenceClauseBoundarySurfaces = new Set([
    'が', 'けど', 'けれど', 'けれども', 'ので', 'なので', 'のに', 'なのに',
    'ものの', 'ものを', 'ものから', 'し', 'から', 'ても', 'でも', 'ば', 'たら'
]);

function isContextEvidenceClauseBoundaryToken(tokens, index) {
    const token = tokens[index];
    if (isContextEvidenceHardBoundaryToken(token)) return true;
    const pos = String(token?.pos || '');
    if (pos === '接続詞') return true;
    if (pos === '助詞'
        && String(token?.pos_detail_1 || '') === '接続助詞'
        && contextEvidenceClauseBoundarySurfaces.has(String(token?.surface_form || ''))) return true;
    const nextSurface = String(tokens[index + 1]?.surface_form || '');
    return pos === '名詞'
        && String(token?.pos_detail_1 || '') === '非自立'
        && String(token?.pos_detail_2 || '') === '副詞可能'
        && (nextSurface === 'で' || nextSurface === 'では')
        && index > 0
        && ['動詞', '形容詞', '助動詞'].includes(String(tokens[index - 1]?.pos || ''));
}

function getContextEvidenceTokenIndexes(tokens, targetIndex, windowSize) {
    const indexes = [];
    for (const direction of [-1, 1]) {
        for (let distance = 1; distance <= windowSize; distance += 1) {
            const index = targetIndex + (direction * distance);
            if (index < 0 || index >= tokens.length) break;
            if (isContextEvidenceClauseBoundaryToken(tokens, index)) break;
            indexes.push(index);
        }
    }
    return indexes;
}

function scoreWeightedContextTerms(tokens, targetIndex, terms, windowSize, sourceText = '') {
    if (!Array.isArray(terms) || !terms.length) return 0;
    const matchedTerms = new Set();
    let score = 0;
    for (const index of getContextEvidenceTokenIndexes(tokens, targetIndex, windowSize)) {
        const tokenTerms = getContextTokenTerms(tokens[index]);
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !tokenTerms.has(evidence.term)) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    if (!sourceText) return score;
    const sourceWindow = getContextSourceWindow(tokens, targetIndex, windowSize, sourceText);
    const targetSurface = String(tokens[targetIndex]?.surface_form || '');
    for (const evidence of terms) {
        if (matchedTerms.has(evidence.term) || evidence.term === targetSurface || !sourceWindow.includes(evidence.term)) continue;
        matchedTerms.add(evidence.term);
        score += Number(evidence.weight || 0);
    }
    return score;
}

const LOANWORD_CONTEXT_NOMINAL_CONNECTORS = new Set(['の', 'な']);
const LOANWORD_CONTEXT_TOPIC_PARTICLES = new Set(['は', 'が']);

function isLoanwordContextCopulaToken(token) {
    const surface = String(token?.surface_form || '');
    const basic = String(tokenBasicForm(token) || '');
    return surface === 'だ' || surface === 'です' || basic === 'だ' || basic === 'です';
}

function isLoanwordContextLexicalToken(token) {
    const pos = String(token?.pos || '');
    return Boolean(String(token?.surface_form || '')) && !['助詞', '助動詞', '記号'].includes(pos);
}

function isLoanwordContextPredicateToken(tokens, index) {
    const token = tokens[index];
    const pos = String(token?.pos || '');
    if (pos === '動詞' || pos === '形容詞') return true;
    if (pos !== '名詞' || String(token?.pos_detail_1 || '') !== 'サ変接続') return false;
    const next = tokens[index + 1];
    if (!next || isContextEvidenceHardBoundaryToken(next)) return true;
    const nextSurface = String(next.surface_form || '');
    const nextBasic = String(tokenBasicForm(next) || nextSurface);
    return nextBasic === 'する' || nextSurface === 'だ' || nextSurface === 'です';
}

function getLoanwordContextEvidenceTokenIndexes(tokens, targetIndex, windowSize) {
    const indexes = new Set();
    const minimum = Math.max(0, targetIndex - windowSize);
    const maximum = Math.min(tokens.length - 1, targetIndex + windowSize);
    const previous = tokens[targetIndex - 1];
    const next = tokens[targetIndex + 1];

    const addNominalSegment = (start, direction) => {
        for (let index = start; index >= minimum && index <= maximum; index += direction) {
            const token = tokens[index];
            if (!token || isContextEvidenceHardBoundaryToken(token)) break;
            const surface = String(token.surface_form || '');
            if (String(token.pos || '') === '助詞' && !LOANWORD_CONTEXT_NOMINAL_CONNECTORS.has(surface)) break;
            if (isLoanwordContextLexicalToken(token)) indexes.add(index);
        }
    };

    const addCopularTopicRelation = () => {
        const following = tokens[targetIndex + 1];
        if (following && LOANWORD_CONTEXT_TOPIC_PARTICLES.has(String(following.surface_form || ''))) {
            const complement = [];
            for (let index = targetIndex + 2; index <= maximum; index += 1) {
                const token = tokens[index];
                if (!token || isContextEvidenceHardBoundaryToken(token)) break;
                if (isLoanwordContextCopulaToken(token)) {
                    if (complement.length) complement.forEach(item => indexes.add(item));
                    break;
                }
                if (!isLoanwordContextLexicalToken(token)) break;
                complement.push(index);
            }
        }

        const preceding = tokens[targetIndex - 1];
        const afterTarget = tokens[targetIndex + 1];
        if (preceding && LOANWORD_CONTEXT_TOPIC_PARTICLES.has(String(preceding.surface_form || ''))
            && afterTarget && isLoanwordContextCopulaToken(afterTarget)) {
            const topic = [];
            for (let index = targetIndex - 2; index >= minimum; index -= 1) {
                const token = tokens[index];
                if (!token || isContextEvidenceHardBoundaryToken(token) || !isLoanwordContextLexicalToken(token)) break;
                topic.push(index);
            }
            topic.forEach(item => indexes.add(item));
        }
    };

    if (previous && !isContextEvidenceHardBoundaryToken(previous)) {
        const surface = String(previous.surface_form || '');
        if (LOANWORD_CONTEXT_NOMINAL_CONNECTORS.has(surface)) addNominalSegment(targetIndex - 2, -1);
        else if (isLoanwordContextLexicalToken(previous)) indexes.add(targetIndex - 1);
    }

    if (next && !isContextEvidenceHardBoundaryToken(next)) {
        const surface = String(next.surface_form || '');
        if (LOANWORD_CONTEXT_NOMINAL_CONNECTORS.has(surface)) {
            addNominalSegment(targetIndex + 2, 1);
        } else if (isLoanwordContextLexicalToken(next)) {
            indexes.add(targetIndex + 1);
        } else if (String(next.pos || '') === '助詞') {
            for (let index = targetIndex + 2; index <= maximum; index += 1) {
                const token = tokens[index];
                if (!token || isContextEvidenceHardBoundaryToken(token)) break;
                if (!isLoanwordContextPredicateToken(tokens, index)) continue;
                indexes.add(index);
                const previousToken = tokens[index - 1];
                if (String(tokenBasicForm(token) || '') === 'する'
                    && previousToken
                    && String(previousToken.pos_detail_1 || '') === 'サ変接続') indexes.add(index - 1);
                break;
            }
        }
    }
    addCopularTopicRelation();
    return [...indexes];
}

function loanwordContextTermMatchesToken(term, token) {
    const evidenceTerm = String(term || '');
    if (!evidenceTerm) return false;
    const tokenTerms = getContextTokenTerms(token);
    if (tokenTerms.has(evidenceTerm)) return true;
    if (!/[一-龯々〆ヵヶ]/u.test(evidenceTerm)) return false;
    return [...tokenTerms].some(tokenTerm => tokenTerm.startsWith(evidenceTerm));
}

function loanwordContextTermMatchesTokenSequence(term, tokens, indexes) {
    const evidenceTerm = String(term || '');
    if (!evidenceTerm || !Array.isArray(indexes) || indexes.length < 2) return false;
    const selected = new Set(indexes);
    const ordered = [...selected].sort((left, right) => left - right);
    for (let startOffset = 0; startOffset < ordered.length; startOffset += 1) {
        let surface = '';
        let basic = '';
        let previousIndex = null;
        for (let offset = startOffset; offset < ordered.length; offset += 1) {
            const index = ordered[offset];
            if (previousIndex !== null && index !== previousIndex + 1) break;
            const token = tokens[index];
            if (!token || !isLoanwordContextLexicalToken(token)) break;
            surface += String(token.surface_form || '');
            basic += String(tokenBasicForm(token) || token.surface_form || '');
            if (surface === evidenceTerm || basic === evidenceTerm) return true;
            if (surface.length > evidenceTerm.length && basic.length > evidenceTerm.length) break;
            previousIndex = index;
        }
    }
    return false;
}

function scoreWeightedLoanwordContextTerms(tokens, targetIndex, terms, windowSize, sourceText = '') {
    if (!Array.isArray(terms) || !terms.length) return 0;
    const matchedTerms = new Set();
    let score = 0;
    const contextIndexes = getLoanwordContextEvidenceTokenIndexes(tokens, targetIndex, windowSize);
    for (const index of contextIndexes) {
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !loanwordContextTermMatchesToken(evidence.term, tokens[index])) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    for (const evidence of terms) {
        if (matchedTerms.has(evidence.term) || !loanwordContextTermMatchesTokenSequence(evidence.term, tokens, contextIndexes)) continue;
        matchedTerms.add(evidence.term);
        score += Number(evidence.weight || 0);
    }
    if (!sourceText) return score;
    const sourceWindow = getContextSourceWindow(tokens, targetIndex, windowSize, sourceText);
    const targetSurface = String(tokens[targetIndex]?.surface_form || '');
    for (const evidence of terms) {
        const term = String(evidence.term || '');
        if (matchedTerms.has(term) || !targetSurface || term === targetSurface || !term.includes(targetSurface)) continue;
        if (!sourceWindow.includes(term)) continue;
        matchedTerms.add(term);
        score += Number(evidence.weight || 0);
    }
    return score;
}

function scoreContextFeatureGroup(tokens, targetIndex, groupId, windowSize) {
    return scoreWeightedContextTerms(tokens, targetIndex, runtimeState.contextFeatureGroups.get(groupId) || [], windowSize);
}

function getContextualReadingEvidenceForToken(token) {
    const surface = String(token?.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    return runtimeState.contextualReadingDictionary.get(surface)
        || (normalized !== surface ? runtimeState.contextualReadingDictionary.get(normalized) : null)
        || null;
}

function getLoanwordMetadataForToken(token) {
    const surface = String(token?.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    return runtimeState.loanwordMetadataDictionary.get(surface)
        || (normalized !== surface ? runtimeState.loanwordMetadataDictionary.get(normalized) : null)
        || null;
}

function getContextSourceWindow(tokens, targetIndex, windowSize, sourceText) {
    if (!sourceText) return '';
    const targetToken = tokens[targetIndex];
    const targetPosition = Number(targetToken?.word_position || 0);
    if (targetPosition <= 0) return sourceText;
    const reachable = getContextEvidenceTokenIndexes(tokens, targetIndex, windowSize);
    const indexes = [targetIndex, ...reachable].sort((left, right) => left - right);
    const startToken = tokens[indexes[0]];
    const endToken = tokens[indexes[indexes.length - 1]];
    const startPosition = Number(startToken?.word_position || 0);
    const endPosition = Number(endToken?.word_position || 0);
    if (startPosition <= 0 || endPosition <= 0) return sourceText;
    let start = Math.max(0, startPosition - 1);
    let end = Math.min(sourceText.length, endPosition - 1 + String(endToken?.surface_form || '').length);
    const targetStart = targetPosition - 1;
    const targetEnd = Math.min(sourceText.length, targetStart + String(targetToken?.surface_form || '').length);
    for (let index = targetStart - 1; index >= start; index -= 1) {
        const character = sourceText[index];
        if (isCanonicalTransparentBoundaryCharacter(character) && !canonicalHardWhitespaceCharacters.has(character)) continue;
        if (!isCanonicalHardBoundaryAt(sourceText, index)) continue;
        start = index + 1;
        break;
    }
    for (let index = targetEnd; index < end; index += 1) {
        const character = sourceText[index];
        if (isCanonicalTransparentBoundaryCharacter(character) && !canonicalHardWhitespaceCharacters.has(character)) continue;
        if (!isCanonicalHardBoundaryAt(sourceText, index)) continue;
        end = index;
        break;
    }
    return end > start ? sourceText.slice(start, end) : String(targetToken?.surface_form || '');
}

function scoreFinalContextFeatureGroup(tokens, targetIndex, groupId, windowSize, sourceText) {
    return scoreWeightedContextTerms(tokens, targetIndex, runtimeState.contextFeatureGroups.get(groupId) || [], windowSize, sourceText);
}

function evaluateContextualReadingEvidence(tokens, targetIndex, evidence, options = {}) {
    if (!evidence) return { candidates: [], selected: null, margin: 0 };
    const finalPass = Boolean(options.finalPass);
    const sourceText = finalPass ? String(options.sourceText || '') : '';
    const candidates = evidence.candidates.map(candidate => {
        const score = candidate.features.reduce((total, feature) => total + (finalPass
            ? scoreFinalContextFeatureGroup(tokens, targetIndex, feature, evidence.window, sourceText)
            : scoreContextFeatureGroup(tokens, targetIndex, feature, evidence.window)), 0);
        return {
            reading: candidate.reading,
            romaji: convertToRomaji(candidate.reading),
            weight: score,
            rank: Number.POSITIVE_INFINITY,
            categories: new Set([finalPass ? 'sentence-context-verification' : 'contextual-reading']),
            sources: new Set([evidence.source]),
            minScore: candidate.minScore
        };
    }).sort((left, right) => right.weight - left.weight);
    const top = candidates[0] || null;
    const second = candidates[1] || null;
    const margin = top ? top.weight - Number(second?.weight || 0) : 0;
    const selected = top && top.weight >= Number(top.minScore || 0) && margin >= evidence.minMargin ? top : null;
    return { candidates, selected, margin };
}

function evaluateContextualLoanwordEvidence(tokens, targetIndex, metadata, options = {}) {
    const evidence = metadata?.context;
    if (!evidence) return { candidates: [], selected: null, margin: 0 };
    const sourceText = options.finalPass ? String(options.sourceText || '') : '';
    const candidates = evidence.candidates.map(candidate => ({
        output: candidate.output,
        romaji: candidate.output,
        weight: scoreWeightedLoanwordContextTerms(tokens, targetIndex, candidate.terms, evidence.window, sourceText),
        rank: Number.POSITIVE_INFINITY,
        categories: new Set([options.finalPass ? 'sentence-context-verification' : 'contextual-loanword']),
        sources: new Set([evidence.source]),
        minScore: candidate.minScore
    })).sort((left, right) => right.weight - left.weight);
    const top = candidates[0] || null;
    const second = candidates[1] || null;
    const margin = top ? top.weight - Number(second?.weight || 0) : 0;
    const selected = top && top.weight >= Number(top.minScore || 0) && margin >= Number(evidence.minMargin || 0) ? top : null;
    return { candidates, selected, margin };
}

function annotateContextualReadingEvidence(tokens) {
    return (tokens || []).map((token, index) => {
        const evidence = getContextualReadingEvidenceForToken(token);
        if (!evidence) return token;
        const evaluation = evaluateContextualReadingEvidence(tokens, index, evidence);
        const { candidates, selected, margin } = evaluation;
        return {
            ...token,
            contextualReadingEvidenceCandidates: candidates,
            contextualReadingEvidenceAmbiguous: !selected,
            ...(selected ? {
                contextualReadingEvidenceMatched: true,
                contextualReadingEvidenceReading: selected.reading,
                contextualReadingEvidenceRomaji: selected.romaji,
                contextualReadingEvidenceSource: evidence.source,
                contextualReadingEvidenceScore: selected.weight,
                contextualReadingEvidenceMargin: margin
            } : {})
        };
    });
}

function annotateContextualLoanwordEvidence(tokens) {
    return (tokens || []).map((token, index) => {
        const metadata = getLoanwordMetadataForToken(token);
        if (!metadata?.context) return token;
        const evaluation = evaluateContextualLoanwordEvidence(tokens, index, metadata);
        const { candidates, selected, margin } = evaluation;
        return {
            ...token,
            contextualLoanwordEvidenceCandidates: candidates,
            contextualLoanwordEvidenceAmbiguous: !selected,
            ...(selected ? {
                contextualLoanwordEvidenceMatched: true,
                contextualLoanwordEvidenceOutput: selected.output,
                contextualLoanwordEvidenceSource: metadata.context.source,
                contextualLoanwordEvidenceScore: selected.weight,
                contextualLoanwordEvidenceMargin: margin
            } : {})
        };
    });
}


function getCommonWordRuleForToken(token, sourceText) {
    if (!token) return null;
    const contextual = selectCommonWordRule(token.surface_form, sourceText, false);
    if (contextual) return contextual;
    if (isProperNounToken(token)) return null;
    return selectCommonWordRule(token.surface_form, sourceText, true) || null;
}

function getCommonWordReadingForToken(token, sourceText) {
    return getCommonWordRuleForToken(token, sourceText)?.reading || null;
}

function getLoanwordOutputForToken(token) {
    if (!token || token.suppressLoanwordSourceSpelling) return null;
    const surface = String(token.surface_form || '');
    return runtimeState.loanwordDictionary.get(surface) || runtimeState.loanwordDictionary.get(normalizeKanjiForLookup(surface)) || null;
}

function getCompoundReadingForToken(token) {
    if (!token || isProperNounToken(token)) return null;
    const surface = String(token.surface_form || '');
    const exact = runtimeState.compoundWordDictionary.get(surface)?.reading;
    if (exact) return exact;
    const normalized = normalizeKanjiForLookup(surface);
    return normalized !== surface ? runtimeState.compoundWordDictionary.get(normalized)?.reading || null : null;
}


function getReviewedReadingPreference(token) {
    if (!token) return null;
    const surface = String(token.surface_form || '');
    return runtimeState.reviewedReadingPreferenceDictionary.get(surface) || null;
}

function getReviewedReadingCandidates(token) {
    const evidence = getReviewedReadingPreference(token);
    if (!evidence) return [];
    const rows = [evidence.reading, ...(evidence.alternatives || [])];
    const seen = new Set();
    return rows.filter(reading => reading && !seen.has(normalizeKanaReading(reading)) && seen.add(normalizeKanaReading(reading))).map((reading, index) => ({
        reading,
        romaji: convertToRomaji(reading),
        weight: index === 0 ? 100 : Math.max(1, 80 - index),
        rank: index + 1,
        categories: new Set(['reviewed-reading']),
        sources: new Set(['reviewed-reading-evidence'])
    }));
}

function reviewedReadingMatches(reading, evidence) {
    const normalized = normalizeKanaReading(reading || '');
    if (!normalized || !evidence) return false;
    return [evidence.reading, ...(evidence.alternatives || [])]
        .some(candidate => normalizeKanaReading(candidate) === normalized);
}

function getReadingEvidenceCandidates(token) {
    if (!token) return [];
    const surface = String(token.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    const evidence = runtimeState.readingEvidenceDictionary.get(surface) || (normalized !== surface ? runtimeState.readingEvidenceDictionary.get(normalized) : null);
    if (!evidence) return [];
    const rows = [{ reading: evidence.preferredReading, priority: evidence.preferredPriority, rank: evidence.preferredRank }, ...evidence.alternatives];
    const seen = new Set();
    return rows.filter(row => row.reading && !seen.has(normalizeKanaReading(row.reading)) && seen.add(normalizeKanaReading(row.reading))).map(row => ({
        reading: row.reading,
        romaji: convertToRomaji(row.reading),
        weight: row.priority,
        rank: row.rank || Number.POSITIVE_INFINITY,
        categories: new Set(['reading-evidence']),
        sources: new Set(['reading-evidence'])
    }));
}

/** @param {CJ2RToken} token */
function getReadingEvidenceAssessment(token, currentReading) {
    if (!token || !currentReading || isProperNounToken(token)) return null;
    const surface = String(token.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    const evidence = runtimeState.readingEvidenceDictionary.get(surface) || (normalized !== surface ? runtimeState.readingEvidenceDictionary.get(normalized) : null);
    if (!evidence) return null;
    const normalizedCurrent = normalizeKanaReading(currentReading);
    const matchedAlternative = evidence.alternatives.find(item => normalizeKanaReading(item.reading) === normalizedCurrent);
    if (!matchedAlternative || matchedAlternative.priority > 0) return null;
    const preferredRank = Math.max(1, evidence.preferredRank || 0);
    const rankRatio = matchedAlternative.rank / preferredRank;
    if (evidence.preferredPriority < 200 || rankRatio < 50) return null;
    return { preferredReading: evidence.preferredReading, currentReading: matchedAlternative.reading, rankRatio };
}

function getReadingEvidenceFallback(token) {
    if (!token || isProperNounToken(token)) return null;
    const surface = String(token.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    const evidence = runtimeState.readingEvidenceDictionary.get(surface) || (normalized !== surface ? runtimeState.readingEvidenceDictionary.get(normalized) : null);
    if (!evidence || evidence.preferredPriority < 200 || !evidence.preferredReading) return null;
    const candidates = getReadingEvidenceCandidates(token);
    return {
        reading: evidence.preferredReading,
        candidates,
        ambiguous: candidates.length > 1
    };
}

// Source section: Sokuon repair, casual speech, grammar expressions, contextual overrides and known phrases.
function restoreDroppedSokuonTokens(tokens, sourceText) {
    const restored = (tokens || []).map(token => ({ ...token }));
    let sourceCursor = 0;
    for (const token of restored) {
        const originalSurface = String(token.surface_form || '');
        if (!originalSurface) continue;
        let startIndex = Number(token.word_position || 0) > 0 ? Number(token.word_position) - 1 : sourceText.indexOf(originalSurface, sourceCursor);
        if (startIndex < sourceCursor || startIndex < 0) startIndex = sourceText.indexOf(originalSurface, sourceCursor);
        if (startIndex < 0) startIndex = sourceCursor;
        const gap = sourceText.slice(sourceCursor, startIndex);
        const missingMatch = gap.match(/[っッ]+$/u);
        if (missingMatch && /^[ぁ-ゖァ-ンヴー]/u.test(originalSurface)) {
            const missing = missingMatch[0];
            token.surface_form = missing + originalSurface;
            token.reading = 'ッ'.repeat(Array.from(missing).length) + String(token.reading || originalSurface);
            token.pronunciation = 'ッ'.repeat(Array.from(missing).length) + String(token.pronunciation || token.reading || originalSurface);
            token.joinLeftAfterSokuon = sourceCursor > 0;
        }
        sourceCursor = startIndex + originalSurface.length;
    }
    return restored;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function splitStructuredNumericUnitTokens(tokens, sourceSpanCandidates = []) {
    const split = [];
    const input = tokens || [];
    for (let index = 0; index < input.length; index += 1) {
        const token = input[index];
        const surface = String(token?.surface_form || '');
        let matchedUnit = null;
        for (const unit of separatedNumericUnitSurfaces) {
            if (surface.endsWith(unit) && isJapaneseNumeralSurface(surface.slice(0, -unit.length))) {
                matchedUnit = unit;
                break;
            }
        }
        if (matchedUnit) {
            const numeralSurface = surface.slice(0, -matchedUnit.length);
            const position = Number(token.word_position || 0);
            const numeralLength = Array.from(numeralSurface).length;
            const fullLength = Array.from(surface).length;
            split.push(makeDerivedSubspanToken(token, 0, numeralLength, {
                surface_form: numeralSurface, reading: '*', pronunciation: '*',
                pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
                structuredNumericSplit: true
            }, {
                annotations: ['structuredNumericSplit'], evidenceSource: 'numeric-unit-structure', semanticRole: 'numeric-head'
            }));
            split.push(makeDerivedSubspanToken(token, numeralLength, fullLength, {
                surface_form: matchedUnit, reading: '*', pronunciation: '*',
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                word_position: position > 0 ? position + numeralSurface.length : position,
                structuredNumericSplit: true
            }, {
                annotations: ['structuredNumericSplit'], evidenceSource: 'numeric-unit-structure', semanticRole: 'numeric-unit'
            }));
            continue;
        }

        const previous = input[index - 1] || null;
        const durationReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
        if (surface === '分間' && previous && embeddedCounterKanjiNumeralPattern.test(String(previous.surface_form || ''))
            && sourceTokensAreContiguous(previous, token) && durationReading.endsWith('かん')) {
            const intervalReading = durationReading.slice(-2);
            const tokenStart = Number(token?.sourceStart);
            const tokenEnd = Number(token?.sourceEnd);
            const lexicalBoundaryRelease = Number.isInteger(tokenStart) && Number.isInteger(tokenEnd)
                && (sourceSpanCandidates || []).some(candidate => candidate?.category === 'lexical'
                    && candidate?.kind === 'kuromoji-exact-dictionary-span'
                    && candidate.reviewRequired !== true
                    && Number(candidate.confidence || 0) >= 0.85
                    && Number(candidate.sourceStart) === tokenStart + 1
                    && Number(candidate.sourceEnd) > tokenEnd
                    && Boolean(candidate.reading));
            split.push(makeDerivedSubspanToken(token, 0, 1, {
                surface_form: '分', reading: '*', pronunciation: '*',
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                structuredNumericSplit: true
            }, {
                annotations: ['structuredNumericSplit'], evidenceSource: 'minute-duration-structure', semanticRole: 'numeric-unit'
            }));
            split.push(makeDerivedSubspanToken(token, 1, 2, {
                surface_form: '間', reading: intervalReading, pronunciation: intervalReading,
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                structuredNumericSplit: !lexicalBoundaryRelease,
                sourceSpanLexicalBoundaryRelease: lexicalBoundaryRelease
            }, {
                annotations: lexicalBoundaryRelease
                    ? ['sourceSpanLexicalBoundaryRelease']
                    : ['structuredNumericSplit'],
                evidenceSource: lexicalBoundaryRelease ? 'source-span-lexical-boundary' : 'minute-duration-structure',
                semanticRole: lexicalBoundaryRelease ? 'lexical-boundary-release' : 'duration-suffix'
            }));
            continue;
        }
        split.push(token);
    }
    return split;
}


const structuredFractionNumeralPattern = /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u;

function getStructuredFractionCandidateParts(candidate) {
    if (candidate?.kind !== 'fraction-structure' || candidate?.semanticRole !== 'fraction') return null;
    const surface = String(candidate.sourceSurface || '');
    const match = surface.match(/^([0-9０-９〇零一二三四五六七八九十百千万億兆]+)分の([0-9０-９〇零一二三四五六七八九十百千万億兆]+)$/u);
    if (!match || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return null;
    const denominator = match[1];
    const unitStart = candidate.sourceStart + denominator.length;
    const connectorStart = unitStart + 1;
    return {
        sourceStart: candidate.sourceStart,
        sourceEnd: candidate.sourceEnd,
        denominatorStart: candidate.sourceStart,
        unitStart,
        connectorStart,
        connectorEnd: connectorStart + 1,
        numeratorStart: connectorStart + 1
    };
}

function sourceOffsetToCharacterIndex(surface, sourceOffset) {
    if (!Number.isInteger(sourceOffset) || sourceOffset < 0 || sourceOffset > String(surface || '').length) return null;
    const characters = Array.from(String(surface || ''));
    let units = 0;
    for (let index = 0; index <= characters.length; index += 1) {
        if (units === sourceOffset) return index;
        if (index === characters.length) break;
        units += characters[index].length;
        if (units > sourceOffset) return null;
    }
    return null;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function applyStructuredFractionOutputTokens(tokens, sourceSpanCandidates = []) {
    const structures = [];
    for (const candidate of sourceSpanCandidates || []) {
        const structure = getStructuredFractionCandidateParts(candidate);
        if (structure) structures.push(structure);
    }
    if (!structures.length) return tokens || [];
    const boundaries = new Set();
    for (const structure of structures) {
        boundaries.add(structure.unitStart);
        boundaries.add(structure.connectorStart);
        boundaries.add(structure.connectorEnd);
    }

    const segmented = [];
    for (const token of tokens || []) {
        const tokenStart = token?.sourceStart;
        const tokenEnd = token?.sourceEnd;
        if (typeof tokenStart !== 'number' || typeof tokenEnd !== 'number' || !Number.isInteger(tokenStart) || !Number.isInteger(tokenEnd) || tokenEnd <= tokenStart) {
            segmented.push(token);
            continue;
        }
        const cuts = [...boundaries].filter(boundary => boundary > tokenStart && boundary < tokenEnd).sort((a, b) => a - b);
        if (!cuts.length) { segmented.push(token); continue; }
        const surface = String(token.sourceSurface ?? token.surface_form ?? '');
        const absolute = [tokenStart, ...cuts, tokenEnd];
        let valid = true;
        const pieces = [];
        for (let index = 0; index < absolute.length - 1; index += 1) {
            const startCharacter = sourceOffsetToCharacterIndex(surface, absolute[index] - tokenStart);
            const endCharacter = sourceOffsetToCharacterIndex(surface, absolute[index + 1] - tokenStart);
            if (typeof startCharacter !== 'number' || typeof endCharacter !== 'number' || endCharacter <= startCharacter) { valid = false; break; }
            pieces.push(makeDerivedSubspanToken(token, startCharacter, endCharacter, {
                reading: '*', pronunciation: '*'
            }, { evidenceSource: 'fraction-output-structure', semanticRole: 'fraction-structural-segment' }));
        }
        if (valid) segmented.push(...pieces);
        else segmented.push(token);
    }

    return segmented.map(token => {
        const tokenStart = token.sourceStart;
        const tokenEnd = token.sourceEnd;
        if (typeof tokenStart !== 'number' || typeof tokenEnd !== 'number') return token;
        const structure = structures.find(item => tokenStart >= item.sourceStart && tokenEnd <= item.sourceEnd);
        if (!structure) return token;
        const length = Array.from(String(token.surface_form || '')).length;
        if (tokenStart === structure.unitStart && tokenEnd === structure.connectorStart && token.surface_form === '分') {
            return makeDerivedSubspanToken(token, 0, length, {
                surface_form: '分', reading: 'ブン', pronunciation: 'ブン',
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                structuredFractionRole: 'denominator-unit', structuredFractionReading: 'ぶん', structuredFractionSource: 'fraction-structure'
            }, {
                annotations: ['structuredFractionRole', 'structuredFractionReading', 'structuredFractionSource'],
                evidenceSource: 'fraction-structure', semanticRole: 'fraction-denominator-unit'
            });
        }
        if (tokenStart === structure.connectorStart && tokenEnd === structure.connectorEnd && token.surface_form === 'の') {
            return makeDerivedSubspanToken(token, 0, length, {
                surface_form: 'の', reading: 'ノ', pronunciation: 'ノ',
                pos: '助詞', pos_detail_1: '連体化', pos_detail_2: '*', pos_detail_3: '*',
                structuredFractionRole: 'connector', structuredFractionSource: 'fraction-structure'
            }, {
                annotations: ['structuredFractionRole', 'structuredFractionSource'],
                evidenceSource: 'fraction-structure', semanticRole: 'fraction-connector'
            });
        }
        if (structuredFractionNumeralPattern.test(String(token.surface_form || ''))
            && ((tokenStart >= structure.denominatorStart && tokenEnd <= structure.unitStart)
                || (tokenStart >= structure.numeratorStart && tokenEnd <= structure.sourceEnd))) {
            const role = tokenEnd <= structure.unitStart ? 'denominator-numeral' : 'numerator-numeral';
            return makeDerivedSubspanToken(token, 0, length, {
                pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
                structuredFractionRole: role, structuredFractionSource: 'fraction-structure'
            }, {
                annotations: ['structuredFractionRole', 'structuredFractionSource'],
                evidenceSource: 'fraction-structure', semanticRole: `fraction-${role}`
            });
        }
        return token;
    });
}


const typedTemporalPeriodSurfaces = new Set([
    '今日','明日','昨日','一昨日','明後日','毎日','今週','来週','先週','毎週',
    '今月','来月','先月','毎月','今年','来年','去年','毎年','一日'
]);
const morphologicalJoinParticleSurfaces = new Set(['て', 'で', 'ば']);

function isTypedTemporalPeriodSurface(surface) {
    const value = String(surface || '');
    if (typedTemporalPeriodSurfaces.has(value)) return true;
    return /^(?:[〇零一二三四五六七八九十百千万億兆0-9]+)(?:日|週間?|[ヶヵケかカ箇]月|年|時間)$/u.test(value);
}

function getTokenizerReadingForSurface(surface) {
    if (!runtimeState.tokenizer || !surface) return null;
    const tokens = runtimeState.tokenizer.tokenize(String(surface));
    if (!tokens.length || tokens.some(token => isProperNounToken(token))) return null;
    const readings = tokens.map(getKuromojiDictionaryReading);
    return readings.every(Boolean) ? readings.join('') : null;
}

function makeTypedTemporalSuffixToken(token) {
    return makeDerivedSubspanToken(token, 0, 1, {
        surface_form: '中', reading: 'ジュウ', pronunciation: 'ジュウ',
        pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalSuffix: true
    }, {
        annotations: ['typedTemporalSuffix'], evidenceSource: 'typed-temporal-boundary', semanticRole: 'temporal-suffix'
    });
}

function retokenizeTypedBoundaryRemainder(token, remainder) {
    const originalPosition = Number(token?.word_position || 0);
    const basePosition = originalPosition > 0 ? originalPosition + 1 : originalPosition;
    const originalCharacters = Array.from(String(token?.surface_form || ''));
    const startOffset = Math.max(0, originalCharacters.length - Array.from(remainder).length);
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    if (!retokenized.length) return [makeDerivedSubspanToken(token, startOffset, originalCharacters.length, {
        surface_form: remainder, reading: '*', pronunciation: '*',
        word_position: basePosition, tokenizationRoleBoundaryBefore: true
    }, { evidenceSource: 'typed-temporal-boundary', semanticRole: 'temporal-remainder' })];
    let consumed = 0;
    return retokenized.map((item, index) => {
        const length = Array.from(String(item?.surface_form || '')).length;
        const derived = makeDerivedSubspanToken(token, startOffset + consumed, startOffset + consumed + length, {
            ...item,
            word_position: basePosition > 0 && Number(item.word_position || 0) > 0 ? basePosition + Number(item.word_position) - 1 : Number(item.word_position || 0),
            tokenizationRoleBoundaryBefore: index === 0 || Boolean(item.tokenizationRoleBoundaryBefore)
        }, { evidenceSource: 'typed-temporal-boundary', semanticRole: 'temporal-remainder' });
        consumed += length;
        return derived;
    });
}

function getTrailingTypedTemporalHeadSpan(tokens) {
    if (!tokens?.length) return null;
    const lastIndex = tokens.length - 1;
    const lastSurface = String(tokens[lastIndex]?.surface_form || '');
    if (isTypedTemporalPeriodSurface(lastSurface)) return { startIndex: lastIndex, surface: lastSurface, token: tokens[lastIndex] };
    if (!/^(?:日|週間?|[ヶヵケかカ箇]月|月|年|時間)$/u.test(lastSurface)) return null;
    let startIndex = lastIndex;
    let numeralSurface = '';
    while (startIndex > 0 && isJapaneseNumeralSurface(tokens[startIndex - 1]?.surface_form)) {
        startIndex -= 1;
        numeralSurface = String(tokens[startIndex].surface_form || '') + numeralSurface;
    }
    if (!numeralSurface) return null;
    const surface = numeralSurface + lastSurface;
    return isTypedTemporalPeriodSurface(surface) ? { startIndex, surface, token: tokens[startIndex] } : null;
}

function makeStructuredTemporalHeadToken(tokens, span) {
    const members = tokens.slice(span.startIndex);
    const reading = normalizeKanaReading(members.map(getKuromojiDictionaryReading).filter(Boolean).join('') || getTokenizerReadingForSurface(span.surface) || '');
    return makeDerivedSpanToken(tokens, span.startIndex, tokens.length - 1, {
        surface_form: span.surface,
        reading: reading || '*',
        pronunciation: reading || '*',
        pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
        structuredTemporalHead: true
    }, {
        annotations: ['structuredTemporalHead'], evidenceSource: 'typed-temporal-structure', semanticRole: 'temporal-head'
    });
}

function getStandaloneSingleToken(surface) {
    if (!runtimeState.tokenizer || !surface) return null;
    const standalone = runtimeState.tokenizer.tokenize(String(surface));
    if (standalone.length !== 1 || String(standalone[0]?.surface_form || '') !== String(surface)) return null;
    return standalone[0];
}

function isStandaloneOrdinaryLexicalNoun(surface) {
    const token = getStandaloneSingleToken(surface);
    return Boolean(token && token.pos === '名詞' && token.pos_detail_1 !== '接尾' && !isProperNounToken(token));
}

function getAttestedTypedTemporalLexicalCollision(headSpan, token) {
    const lexicalSurface = String(token?.surface_form || '');
    if (!headSpan || !lexicalSurface.startsWith('中') || lexicalSurface === '中') return null;
    if (!isStandaloneOrdinaryLexicalNoun(lexicalSurface)) return null;
    const remainderSurface = lexicalSurface.slice(1);
    if (!isStandaloneOrdinaryLexicalNoun(remainderSurface)) return null;
    const spanSurface = String(headSpan.surface || '') + '中';
    const lookup = getGeneralWordLookup(spanSurface);
    const expectedReading = getTypedTemporalHeadReading(headSpan.surface, headSpan.token) + 'じゅう';
    const spanAttested = Boolean(expectedReading && lookup?.entry?.readings?.some(item => normalizeKanaReading(item?.reading) === expectedReading));
    if (!spanAttested) return null;
    return {
        headSurface: String(headSpan.surface || ''),
        spanSurface,
        lexicalSurface,
        remainderSurface
    };
}

function repairTypedTemporalExpressionBoundaries(tokens) {
    const repaired = [];
    for (const token of tokens || []) {
        const surface = String(token?.surface_form || '');
        if (surface.startsWith('中') && surface !== '中') {
            const headSpan = getTrailingTypedTemporalHeadSpan(repaired);
            if (headSpan && isStandaloneOrdinaryLexicalNoun(surface)) {
                const collision = getAttestedTypedTemporalLexicalCollision(headSpan, token);
                repaired.push(collision ? makeDerivedSpanToken([token], 0, 0, { typedTemporalSpanLexicalCollision: collision }, { annotations: ['typedTemporalSpanLexicalCollision'], evidenceSource: 'typed-temporal-boundary', semanticRole: 'lexical-temporal-collision', reviewRequired: true }) : token);
                continue;
            }
            if (headSpan) {
                const head = makeStructuredTemporalHeadToken(repaired, headSpan);
                repaired.splice(headSpan.startIndex, repaired.length - headSpan.startIndex, head);
                repaired.push(makeTypedTemporalSuffixToken(token));
                repaired.push(...retokenizeTypedBoundaryRemainder(token, surface.slice(1)));
                continue;
            }
        }
        repaired.push(token);
    }
    return repaired;
}

function makeTypedTemporalSpanToken(members, surface, reading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    return makeDerivedSpanToken(spanTokens, 0, spanTokens.length - 1, {
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalExpressionMatched: true,
        typedTemporalExpressionType: 'period-span',
        typedTemporalReading: reading,
        typedTemporalSource: 'typed-period-span'
    }, {
        annotations: ['typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource'],
        evidenceSource: 'typed-period-span', semanticRole: 'temporal-period'
    });
}

/** @param {string} surface @param {CJ2RToken|null} [token] */
function getTypedTemporalHeadReading(surface, token = null) {
    if (/^(?:一|1|１)日$/u.test(String(surface || ''))) return 'いちにち';
    const reviewed = runtimeState.counterDateReadingDictionary.get(String(surface || ''));
    if (reviewed?.reading) return normalizeKanaReading(reviewed.reading);
    const direct = token && String(token.surface_form || '') === surface ? getKuromojiDictionaryReading(token) : null;
    return normalizeKanaReading(direct || getTokenizerReadingForSurface(surface) || '');
}

function repairTypedTemporalSpanFollowerToken(token) {
    if (!token || isParticle(token) || token.pos === '記号' || token.pos === '助動詞') return token;
    const surface = String(token.surface_form || '');
    if (!surface) return token;
    const standalone = getStandaloneSingleToken(surface);
    const contextualRole = token.pos === '名詞' && (token.pos_detail_1 === '接尾' || isProperNounToken(token));
    const standaloneIndependent = standalone?.pos === '名詞' && standalone.pos_detail_1 !== '接尾' && !isProperNounToken(standalone);
    const repaired = contextualRole && standaloneIndependent ? {
        ...standalone,
        word_position: token.word_position,
        tokenizationRoleRepair: 'typed-temporal-span-follower'
    } : { ...token };
    repaired.tokenizationRoleBoundaryBefore = true;
    return repaired;
}

function sealTypedTemporalSpanFollowerBoundaries(tokens) {
    return (tokens || []).map((token, index) => {
        const previous = tokens[index - 1] || null;
        if (previous?.typedTemporalExpressionMatched !== true || previous?.typedTemporalExpressionType !== 'period-span') return token;
        return repairTypedTemporalSpanFollowerToken(token);
    });
}

function mergeTypedTemporalSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const surface = String(token?.surface_form || '');
        if (surface === '中' && !hasReviewedLexicalBoundaryBefore(token)) {
            const headSpan = getTrailingTypedTemporalHeadSpan(merged);
            if (headSpan) {
                const head = makeStructuredTemporalHeadToken(merged, headSpan);
                merged.splice(headSpan.startIndex, merged.length - headSpan.startIndex);
                merged.push(makeTypedTemporalSpanToken([head, token], headSpan.surface + '中', getTypedTemporalHeadReading(headSpan.surface, head) + 'じゅう'));
                continue;
            }
        }
        if (surface.endsWith('中') && surface.length > 1) {
            const headSurface = surface.slice(0, -1);
            if (isTypedTemporalPeriodSurface(headSurface)) {
                const headReading = getTypedTemporalHeadReading(headSurface);
                if (headReading) {
                    merged.push(makeTypedTemporalSpanToken([token], surface, headReading + 'じゅう'));
                    continue;
                }
            }
        }
        const next = tokens[index + 1];
        if (isTypedTemporalPeriodSurface(surface) && String(next?.surface_form || '') === '中' && !hasReviewedLexicalBoundaryBefore(next)) {
            const headReading = getTypedTemporalHeadReading(surface, token);
            if (headReading) {
                merged.push(makeTypedTemporalSpanToken([token, next], surface + '中', headReading + 'じゅう'));
                index += 1;
                continue;
            }
        }
        merged.push(token);
    }
    return sealTypedTemporalSpanFollowerBoundaries(merged);
}

function isCalendarMonthSurface(surface) {
    return /^(?:[〇零一二三四五六七八九十百0-9]+)月$/u.test(String(surface || ''));
}

function isOneDayNumeralSurface(surface) {
    return /^(?:一|1|１)$/u.test(String(surface || ''));
}

function getOneDaySpan(tokens, startIndex) {
    const token = tokens[startIndex];
    const surface = String(token?.surface_form || '');
    if (/^(?:一|1|１)日$/u.test(surface)) return { length: 1, head: token };
    const next = tokens[startIndex + 1];
    if (isOneDayNumeralSurface(surface) && String(next?.surface_form || '') === '日'
        && (token?.pos_detail_1 === '数' || isJapaneseNumeralSurface(surface) || /^[0-9０-９]$/u.test(surface))
        && next?.pos_detail_2 === '助数詞') return { length: 2, head: token };
    return null;
}

function getOneDaySpanSurface(tokens, startIndex, span) {
    return (tokens || []).slice(startIndex, startIndex + span.length).map(token => String(token?.surface_form || '')).join('');
}

function isTransparentNumericContextBoundaryToken(token) {
    return Boolean(token?.canonicalBoundary && isCanonicalTransparentBoundarySurface(token.surface_form));
}

function getPreviousNumericContextToken(tokens, startIndex) {
    let index = startIndex - 1;
    while (index >= 0 && isTransparentNumericContextBoundaryToken(tokens[index])) index -= 1;
    return { token: index >= 0 ? tokens[index] : null, index };
}

function getNextNumericContextToken(tokens, endIndex) {
    let index = endIndex + 1;
    while (index < (tokens || []).length && isTransparentNumericContextBoundaryToken(tokens[index])) index += 1;
    return { token: index < (tokens || []).length ? tokens[index] : null, index };
}

function hasOneDayCalendarPredecessor(tokens, startIndex) {
    const previous = getPreviousNumericContextToken(tokens, startIndex);
    const previousSurface = String(previous.token?.surface_form || '');
    if (isCalendarMonthSurface(previousSurface) || previousSurface === '毎月' || previousSurface === '各月') return true;
    const beforePrevious = getPreviousNumericContextToken(tokens, previous.index);
    const beforePreviousSurface = String(beforePrevious.token?.surface_form || '');
    return previousSurface === '月'
        && /^(?:[〇零一二三四五六七八九十百0-9０-９]+)$/u.test(beforePreviousSurface);
}

function isSahenPredicateStructureAt(tokens, startIndex) {
    const noun = tokens[startIndex] || null;
    if (!noun || noun.pos !== '名詞' || noun.pos_detail_1 !== 'サ変接続') return false;
    let verbIndex = startIndex + 1;
    const connector = tokens[verbIndex] || null;
    if (isParticle(connector) && String(connector.surface_form || '') === 'を') verbIndex += 1;
    const verb = tokens[verbIndex] || null;
    return Boolean(verb && verb.pos === '動詞' && tokenBasicForm(verb) === 'する');
}

function hasFollowingPredicateAfterOneDayNominal(tokens, startIndex) {
    const first = tokens[startIndex] || null;
    if (!first || first.pos !== '名詞' || isParticle(first) || isPrefix(first) || isSuffix(first)) return false;
    for (let index = startIndex + 1; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!token || token.pos === '記号') return false;
        if (token.pos === '動詞' || token.pos === '形容詞' || isSahenPredicateStructureAt(tokens, index)) return true;
    }
    return false;
}

function isOneDayDurationFollower(tokens, startIndex) {
    const token = tokens[startIndex] || null;
    if (!token) return false;
    const surface = String(token.surface_form || '');
    return token.pos === '動詞' || token.pos === '形容詞'
        || token.pos_detail_1 === '数' || token.numericExpression
        || isJapaneseNumeralSurface(surface)
        || /^(?:[〇零一二三四五六七八九十百0-9]+)(?:回|度|日|時間)$/u.test(surface)
        || /^(?:分|間|以内|以下|以上|未満|程度|ごと|毎|置き|おき|当たり|あたり|目|後|前|ぶり|半)$/u.test(surface)
        || (isParticle(token) && surface === 'で')
        || isSahenPredicateStructureAt(tokens, startIndex)
        || hasFollowingPredicateAfterOneDayNominal(tokens, startIndex);
}

function isFrequencyCountStructureAt(tokens, startIndex) {
    const token = tokens[startIndex] || null;
    if (!token) return false;
    const surface = String(token.surface_form || '');
    if (/^[〇零一二三四五六七八九十百0-9]+(?:回|度)$/u.test(surface)) return true;
    if (!isJapaneseNumeralSurface(surface)) return false;
    let index = startIndex;
    while (index < tokens.length && isJapaneseNumeralSurface(tokens[index]?.surface_form)) index += 1;
    const unit = String(tokens[index]?.surface_form || '');
    return unit === '回' || unit === '度';
}

function hasOneDayFrequencyContext(tokens, startIndex) {
    const particle = tokens[startIndex] || null;
    return Boolean(
        particle
        && isParticle(particle)
        && String(particle.surface_form || '') === 'に'
        && isFrequencyCountStructureAt(tokens, startIndex + 1)
    );
}

function makeAmbiguousOneDayTemporalToken(tokens, startIndex, span) {
    const endIndex = startIndex + span.length - 1;
    const surface = getOneDaySpanSurface(tokens, startIndex, span);
    const calendarEvidence = getReviewedCounterDateEvidence(surface, 'date');
    const reading = normalizeKanaReading(calendarEvidence?.reading || 'ついたち') || 'ついたち';
    return makeDerivedSpanToken(tokens, startIndex, endIndex, {
        surface_form: surface,
        reading, pronunciation: reading,
        pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalExpressionMatched: true,
        typedTemporalExpressionType: 'ambiguous-day',
        typedTemporalReading: reading,
        typedTemporalSource: 'terminal-one-day-provisional-calendar',
        typedTemporalRoleState: 'ambiguous',
        typedTemporalRoleSource: 'terminal-one-day-role-conflict',
        typedTemporalRoleReviewRequired: true,
        typedTemporalRoleAlternatives: ['calendar-date', 'duration-day']
    }, {
        annotations: [
            'typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource',
            'typedTemporalRoleState', 'typedTemporalRoleSource', 'typedTemporalRoleReviewRequired', 'typedTemporalRoleAlternatives'
        ],
        evidenceSource: 'terminal-one-day-role-conflict',
        semanticRole: 'temporal-role-ambiguous',
        reviewRequired: true
    });
}

function markTypedOneDayDurationTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getOneDaySpan(tokens, index);
        if (!span) { resolved.push(tokens[index]); continue; }
        if (hasOneDayCalendarPredecessor(tokens, index)) {
            resolved.push(tokens[index]);
            continue;
        }
        let scan = index + span.length;
        while (scan < tokens.length && isTransparentNumericContextBoundaryToken(tokens[scan])) scan += 1;
        let next = tokens[scan] || null;
        while (next && scan < tokens.length - 1 && isParticle(next) && ['だけ','も','は'].includes(String(next.surface_form || ''))) {
            scan += 1;
            while (scan < tokens.length && isTransparentNumericContextBoundaryToken(tokens[scan])) scan += 1;
            next = tokens[scan] || null;
        }
        const frequencyContext = hasOneDayFrequencyContext(tokens, scan);
        const followingParticle = tokens[scan] || null;
        const explicitCalendarContext = Boolean(
            isParticle(followingParticle)
            && String(followingParticle.surface_form || '') === 'に'
            && !frequencyContext
        );
        const durationContext = isOneDayDurationFollower(tokens, scan) || frequencyContext;
        if (!durationContext) {
            if (explicitCalendarContext) {
                resolved.push(tokens[index]);
                continue;
            }
            resolved.push(makeAmbiguousOneDayTemporalToken(tokens, index, span));
            index += span.length - 1;
            continue;
        }
        const surface = getOneDaySpanSurface(tokens, index, span);
        resolved.push(makeDerivedSpanToken(tokens, index, index + span.length - 1, {
            surface_form: surface,
            reading: 'イチニチ', pronunciation: 'イチニチ',
            pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
            typedTemporalExpressionMatched: true,
            typedTemporalExpressionType: 'duration-day',
            typedTemporalReading: 'いちにち',
            typedTemporalSource: 'typed-duration-context'
        }, {
            annotations: ['typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource'],
            evidenceSource: 'typed-duration-context', semanticRole: 'temporal-duration'
        }));
        index += span.length - 1;
    }
    return resolved;
}

function getAttestedFrequencyCounterReading(tokens, startIndex, endIndex, surface) {
    const members = (tokens || []).slice(startIndex, endIndex + 1);
    const reviewed = getReviewedCounterDateEvidence(surface, 'counter');
    if (reviewed?.reading) return reviewed.reading;
    const digitCounter = String(surface || '').match(/^([0-9０-９]+)(回|度)$/u);
    if (digitCounter) {
        const unitReading = normalizeKanaReading(getTokenizerReadingForSurface(digitCounter[2]) || '');
        if (unitReading) {
            const numeral = digitCounter[1].replace(/[０-９]/gu, character => String(character.charCodeAt(0) - 0xFF10));
            return numeral + unitReading;
        }
    }
    const analyserReading = normalizeKanaReading(members.map(item => getKuromojiDictionaryReading(item) || '').join(''));
    if (!analyserReading) return null;
    const lookup = getGeneralWordLookup(surface);
    const matched = getGeneralWordCandidates(lookup).find(candidate => normalizeKanaReading(candidate?.reading || '') === analyserReading);
    if (matched?.reading) return matched.reading;
    const unit = members.at(-1) || null;
    return members.length > 1 && unit?.pos_detail_2 === '助数詞' ? analyserReading : null;
}


function canonicalizeDayDurationEvidenceSurface(surface) {
    const canonical = canonicalizeReviewedNumericAliasSurface(String(surface || ''));
    return canonical.replace(/[０-９]/gu, character => String(character.charCodeAt(0) - 0xFF10));
}

function getReviewedIrregularDayDurationReading(surface) {
    const canonicalSurface = canonicalizeDayDurationEvidenceSurface(surface);
    if (/^(?:一|1)日$/u.test(canonicalSurface)) return { reading: 'いちにち', source: 'duration-day-structure' };
    const reviewed = runtimeState.counterDateReadingDictionary.get(canonicalSurface) || null;
    if (!reviewed?.reading || reviewed.role !== 'calendar-date' || reviewed.unit !== '日') return null;
    return {
        reading: normalizeKanaReading(reviewed.reading),
        source: 'duration-day-structure+reviewed-day-reading'
    };
}

function isDayDurationNumeralToken(token) {
    const surface = String(token?.surface_form || '');
    return isJapaneseNumeralSurface(surface)
        || Boolean(getReviewedReadingPreferenceForSurface(surface)?.numericCanonical);
}

function getReviewedDayDurationSpan(tokens, startIndex) {
    const first = tokens[startIndex] || null;
    if (!first) return null;
    const previous = tokens[startIndex - 1] || null;
    if (sourceTokensAreContiguous(previous, first) && isDayDurationNumeralToken(previous)) return null;

    let numeralSurface = '';
    for (let endIndex = startIndex; endIndex < tokens.length; endIndex += 1) {
        const token = tokens[endIndex];
        if (endIndex > startIndex && !sourceTokensAreContiguous(tokens[endIndex - 1], token)) break;
        const surface = String(token?.surface_form || '');
        const directMatch = surface.match(/^([0-9０-９〇零一二三四五六七八九十百千万億兆壱壹弌弐貮貳弎参參肆伍陸漆柒捌玖拾]+)日間$/u);
        if (directMatch) {
            const completeNumeralSurface = numeralSurface + directMatch[1];
            const evidence = getReviewedIrregularDayDurationReading(completeNumeralSurface + '日');
            return evidence ? { endIndex, numeralSurface: completeNumeralSurface, evidence } : null;
        }
        if (surface === '日間' && numeralSurface) {
            const evidence = getReviewedIrregularDayDurationReading(numeralSurface + '日');
            return evidence ? { endIndex, numeralSurface, evidence } : null;
        }
        if (!isDayDurationNumeralToken(token)) break;
        numeralSurface += surface;
    }
    return null;
}

function markTypedDayDurationSpanTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getReviewedDayDurationSpan(tokens, index);
        if (!span) {
            resolved.push(tokens[index]);
            continue;
        }
        const reading = span.evidence.reading + 'かん';
        const members = tokens.slice(index, span.endIndex + 1);
        const surface = members.map(item => String(item?.surface_form || '')).join('');
        resolved.push(makeDerivedSpanToken(tokens, index, span.endIndex, {
            surface_form: surface,
            reading, pronunciation: reading,
            pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
            typedTemporalExpressionMatched: true,
            typedTemporalExpressionType: 'duration-day-span',
            typedTemporalReading: reading,
            typedTemporalSource: span.evidence.source,
            typedTemporalRoleState: 'selected',
            typedTemporalRoleSource: 'explicit-day-duration-structure',
            typedTemporalRoleReviewRequired: false,
            typedTemporalRoleAlternatives: ['duration-day']
        }, {
            annotations: ['typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource', 'typedTemporalRoleState', 'typedTemporalRoleSource', 'typedTemporalRoleReviewRequired', 'typedTemporalRoleAlternatives'],
            evidenceSource: span.evidence.source, semanticRole: 'temporal-duration', reviewRequired: false
        }));
        index = span.endIndex;
    }
    return resolved;
}

function markTypedFrequencyCounterRoleTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const previous = tokens[index - 1] || null;
        const beforePrevious = tokens[index - 2] || null;
        const inOneDayFrequencyFrame = Boolean(
            beforePrevious?.typedTemporalExpressionType === 'duration-day'
            && isParticle(previous)
            && String(previous.surface_form || '') === 'に'
        );
        if (!inOneDayFrequencyFrame) { resolved.push(token); continue; }

        const directSurface = String(token?.surface_form || '');
        let endIndex = index;
        let surface = directSurface;
        if (!/^[〇零一二三四五六七八九十百0-9]+(?:回|度)$/u.test(surface)) {
            if (!isJapaneseNumeralSurface(directSurface)) { resolved.push(token); continue; }
            let scan = index;
            surface = '';
            while (scan < tokens.length && isJapaneseNumeralSurface(tokens[scan]?.surface_form)) {
                surface += String(tokens[scan].surface_form || '');
                scan += 1;
            }
            const unitSurface = String(tokens[scan]?.surface_form || '');
            if (unitSurface !== '回' && unitSurface !== '度') { resolved.push(token); continue; }
            surface += unitSurface;
            endIndex = scan;
        }

        const reading = getAttestedFrequencyCounterReading(tokens, index, endIndex, surface);
        if (!reading) { resolved.push(token); continue; }
        resolved.push(makeDerivedSpanToken(tokens, index, endIndex, {
            surface_form: surface,
            reading,
            pronunciation: reading,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericRoleSelected: true,
            typedNumericRole: 'frequency-counter',
            typedNumericRoleState: 'selected',
            typedNumericRoleSource: 'duration-frequency-context',
            typedNumericRoleReviewRequired: false,
            typedNumericRoleAlternatives: ['frequency-counter'],
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'frequency-counter',
            typedNumericReading: reading,
            typedNumericSource: 'duration-frequency-context+attested-reading'
        }, {
            annotations: ['numericExpression', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives', 'typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource'],
            evidenceSource: 'duration-frequency-context+attested-reading', semanticRole: 'frequency-counter', reviewRequired: false
        }));
        index = endIndex;
    }
    return resolved;
}

/** @param {string} surface @param {string|null} [role] */
function getReviewedCounterDateEvidence(surface, role = null) {
    const sourceSurface = String(surface || '');
    const canonicalDecimalSurface = canonicalizeIdeographicDecimalNotationSurface(sourceSurface);
    const evidence = runtimeState.counterDateReadingDictionary.get(sourceSurface)
        || (canonicalDecimalSurface !== sourceSurface ? runtimeState.counterDateReadingDictionary.get(canonicalDecimalSurface) : null)
        || null;
    if (!evidence) return null;
    if (role && String(evidence.role || '') !== String(role)) return null;
    return evidence;
}

function hasConflictingGeneralWordReading(surface, proposedReading) {
    const lookup = getGeneralWordLookup(String(surface || ''));
    const candidates = getGeneralWordCandidates(lookup);
    if (!candidates.length) return false;
    const proposed = normalizeKanaReading(proposedReading || '');
    return candidates.some(candidate => {
        const reading = normalizeKanaReading(candidate?.reading || '');
        return reading && proposed && reading !== proposed;
    });
}

function getCompetingLexicalCandidateForSpan(candidates, members, proposedReading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const first = spanTokens[0] || {};
    const last = spanTokens.at(-1) || first;
    const start = Number(first.sourceStart);
    const end = Number(last.sourceEnd);
    const proposed = normalizeKanaReading(proposedReading || '');
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    return (candidates || []).find(candidate => {
        if (candidate?.category !== 'lexical' || candidate?.kind !== 'general-word') return false;
        if (candidate.sourceStart !== start || candidate.sourceEnd !== end) return false;
        const reading = normalizeKanaReading(candidate.reading || '');
        return reading && proposed && reading !== proposed;
    }) || null;
}

function getCompetingLexicalReadingForSpan(candidates, members, proposedReading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const first = spanTokens[0] || {};
    const last = spanTokens.at(-1) || first;
    const start = Number(first.sourceStart);
    const end = Number(last.sourceEnd);
    const proposed = normalizeKanaReading(proposedReading || '');
    if (!Number.isInteger(start) || !Number.isInteger(end) || !proposed) return null;
    for (const candidate of candidates || []) {
        if (candidate?.category !== 'lexical' || candidate.sourceStart !== start || candidate.sourceEnd !== end) continue;
        const readings = [candidate, ...(candidate.alternatives || [])];
        for (const evidence of readings) {
            const reading = normalizeKanaReading(evidence?.reading || '');
            if (reading && reading !== proposed) return { candidate, reading };
        }
    }
    return null;
}

function hasClockHourStructuralContext(tokens, startIndex, endIndex) {
    const previous = getPreviousNumericContextToken(tokens, startIndex);
    const previousSurface = String(previous.token?.surface_form || '');
    if (previousSurface === '午前' || previousSurface === '午後') return true;
    const next = getNextNumericContextToken(tokens, endIndex);
    const nextSurface = String(next.token?.surface_form || '');
    if (nextSurface === '半') return true;
    const directMinuteMatch = nextSurface.match(/^([0-9０-９〇零一二三四五六七八九十百]+)分$/u);
    if (directMinuteMatch && resolveMinuteCounterReading(directMinuteMatch[1])) return true;
    const minuteUnit = getNextNumericContextToken(tokens, next.index);
    if (isJapaneseNumeralSurface(nextSurface) && String(minuteUnit.token?.surface_form || '') === '分'
        && resolveMinuteCounterReading(nextSurface)) return true;
    return false;
}

function isAdverbialBunLexicalConflict(candidate) {
    const reading = normalizeKanaReading(candidate?.reading || '');
    return Boolean(reading && reading.endsWith('ぶん'));
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates @param {CJ2RToken} leftToken @param {CJ2RToken} suffixToken */
function hasLongerLexicalSpanAtSuffixBoundary(candidates, leftToken, suffixToken) {
    const boundaryStart = Number(leftToken?.sourceEnd);
    const suffixEnd = Number(suffixToken?.sourceEnd);
    if (!Number.isInteger(boundaryStart) || !Number.isInteger(suffixEnd)) return false;
    return (candidates || []).some(candidate => candidate?.category === 'lexical'
        && Number(candidate.sourceStart) === boundaryStart
        && Number(candidate.sourceEnd) > suffixEnd
        && Boolean(candidate.reading));
}

function hasIndependentMinuteCounterContext(tokens, startIndex, endIndex) {
    const previousContext = getPreviousNumericContextToken(tokens, startIndex);
    const previous = previousContext.token;
    const immediatePrevious = tokens?.[startIndex - 1] || null;
    const first = tokens?.[startIndex] || null;
    const next = tokens?.[endIndex + 1] || null;
    if (previous?.typedNumericRole === 'clock-hour' && previous?.typedNumericRoleState === 'selected') return true;
    if (immediatePrevious && first && sourceTokensAreContiguous(immediatePrevious, first) && isRule0NumericGroupBoundary(immediatePrevious, first)) return true;
    if (String(next?.surface_form || '') === '間') return true;
    return next?.pos === '動詞' || next?.pos === '形容詞';
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates @param {CJ2RToken[]|CJ2RToken} members @param {string} proposedReading */
function getContextualCommonWordCandidateForSpan(candidates, members, proposedReading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const first = spanTokens[0] || {};
    const last = spanTokens.at(-1) || first;
    const start = Number(first.sourceStart);
    const end = Number(last.sourceEnd);
    const proposed = normalizeKanaReading(proposedReading || '');
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    return (candidates || []).find(candidate => {
        if (candidate?.category !== 'lexical' || candidate?.kind !== 'common-word' || !candidate?.metadata?.contextPattern) return false;
        if (candidate.sourceStart !== start || candidate.sourceEnd !== end) return false;
        const reading = normalizeKanaReading(candidate.reading || '');
        return reading && proposed && reading !== proposed;
    }) || null;
}


function makeTypedNumericRoleToken(members, surface, role, source, options = {}) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const state = options.state === 'ambiguous' ? 'ambiguous' : 'selected';
    const alternatives = [...new Set(Array.isArray(options.alternatives) ? options.alternatives.filter(Boolean) : [])];
    return makeDerivedSpanToken(spanTokens, 0, spanTokens.length - 1, {
        surface_form: surface,
        ...(options.fallbackReading ? { reading: options.fallbackReading, pronunciation: options.fallbackReading } : {}),
        pos: state === 'selected' ? '名詞' : (spanTokens[0]?.pos || '名詞'),
        pos_detail_1: state === 'selected' ? '数' : (spanTokens[0]?.pos_detail_1 || '一般'),
        pos_detail_2: state === 'selected' ? '*' : (spanTokens[0]?.pos_detail_2 || '*'), pos_detail_3: '*',
        numericExpression: state === 'selected',
        typedNumericRoleSelected: state === 'selected',
        typedNumericRole: state === 'selected' ? role : null,
        typedNumericRoleState: state,
        typedNumericRoleSource: source,
        typedNumericRoleReviewRequired: state === 'ambiguous',
        typedNumericRoleAlternatives: alternatives
    }, {
        annotations: ['numericExpression', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives'],
        evidenceSource: source, semanticRole: role, reviewRequired: state === 'ambiguous'
    });
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markAmbiguousNumericRoleTokens(tokens, sourceSpanCandidates = []) {
    return (tokens || []).map((token, index) => {
        if (token?.typedNumericRole || token?.typedTemporalExpressionMatched) return token;
        const surface = String(token?.surface_form || '');
        const minuteMatch = surface.match(/^([0-9０-９〇零一二三四五六七八九十百]+)分$/u);
        if (!minuteMatch) return token;
        const resolvedMinute = resolveMinuteCounterReading(minuteMatch[1]);
        if (!resolvedMinute?.reading || !hasConflictingGeneralWordReading(surface, resolvedMinute.reading)) return token;
        const lexical = getGeneralWordCandidates(getGeneralWordLookup(surface)).find(candidate => normalizeKanaReading(candidate?.reading || '') !== normalizeKanaReading(resolvedMinute.reading));
        if (!lexical) return token;
        const next = tokens?.[index + 1] || null;
        const lexicalContinuation = String(next?.surface_form || '') === '間'
            && sourceTokensAreContiguous(token, next)
            && hasLongerLexicalSpanAtSuffixBoundary(sourceSpanCandidates, token, next);
        if (String(next?.surface_form || '') === '間' && sourceTokensAreContiguous(token, next) && !lexicalContinuation) {
            return makeTypedNumericRoleToken([token], surface, 'minute-counter', 'minute-duration-structure', {
                state: 'selected', alternatives: ['minute-counter']
            });
        }
        if (getContextualCommonWordCandidateForSpan(sourceSpanCandidates, [token], resolvedMinute.reading)) return token;
        return makeDerivedSpanToken([token], 0, 0, {
            reading: lexical.reading, pronunciation: lexical.reading,
            typedNumericRoleSelected: false,
            typedNumericRole: null,
            typedNumericRoleState: 'ambiguous',
            typedNumericRoleSource: 'numeric-role-conflict',
            typedNumericRoleReviewRequired: true,
            typedNumericRoleAlternatives: ['minute-counter', 'lexical']
        }, {
            annotations: ['typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives'],
            evidenceSource: 'numeric-role-conflict', semanticRole: 'unresolved-numeric-role', reviewRequired: true
        });
    });
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markTypedClockHourRoleTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const directSurface = String(token?.surface_form || '');
        const directEvidence = getReviewedCounterDateEvidence(directSurface, 'clock-hour');
        if (/^[0-9０-９〇零一二三四五六七八九十百]+時$/u.test(directSurface)
            && directEvidence
            && String(tokens[index + 1]?.surface_form || '') !== '間') {
            const members = [token];
            const lexicalConflict = getCompetingLexicalReadingForSpan(sourceSpanCandidates, members, directEvidence.reading);
            const roleEstablished = hasClockHourStructuralContext(tokens, index, index);
            merged.push(makeTypedNumericRoleToken(members, directSurface, 'clock-hour', lexicalConflict && !roleEstablished ? 'numeric-role-conflict' : 'counter-date-role-evidence', {
                state: lexicalConflict && !roleEstablished ? 'ambiguous' : 'selected',
                alternatives: lexicalConflict && !roleEstablished ? ['clock-hour', 'lexical'] : ['clock-hour'],
                fallbackReading: lexicalConflict && !roleEstablished ? directEvidence.reading : null
            }));
            continue;
        }
        if (!isJapaneseNumeralSurface(directSurface)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
            if (end > index) {
                if (!sourceTokensAreContiguous(tokens[end - 1], tokens[end])) break;
                if (isRule0NumericGroupBoundary(tokens[end - 1], tokens[end])) break;
            }
            numeralSurface += String(tokens[end].surface_form || '');
            end += 1;
        }
        const unit = tokens[end] || null;
        if (String(unit?.surface_form || '') !== '時'
            || hasReviewedLexicalBoundaryBefore(unit)
            || String(tokens[end + 1]?.surface_form || '') === '間') {
            merged.push(token);
            continue;
        }
        const surface = numeralSurface + '時';
        const evidence = getReviewedCounterDateEvidence(surface, 'clock-hour');
        if (!evidence) { merged.push(token); continue; }
        const members = tokens.slice(index, end + 1);
        const lexicalConflict = getCompetingLexicalReadingForSpan(sourceSpanCandidates, members, evidence.reading);
        const roleEstablished = hasClockHourStructuralContext(tokens, index, end);
        merged.push(makeTypedNumericRoleToken(members, surface, 'clock-hour', lexicalConflict && !roleEstablished ? 'numeric-role-conflict' : 'counter-date-role-evidence', {
            state: lexicalConflict && !roleEstablished ? 'ambiguous' : 'selected',
            alternatives: lexicalConflict && !roleEstablished ? ['clock-hour', 'lexical'] : ['clock-hour'],
            fallbackReading: lexicalConflict && !roleEstablished ? evidence.reading : null
        }));
        index = end;
    }
    return merged;
}


const embeddedCounterKanjiNumeralPattern = /^[〇零一二三四五六七八九十百千万億兆]+$/u;

function isEmbeddedCounterKanjiNumeralToken(token) {
    const surface = String(token?.surface_form || '');
    return embeddedCounterKanjiNumeralPattern.test(surface)
        && (token?.pos_detail_1 === '数' || isJapaneseNumeralSurface(surface));
}

function getReviewedHundredCounterTailEvidence(unitSurface) {
    const sourceSurface = `百${String(unitSurface || '')}`;
    const entry = runtimeState.counterDateReadingDictionary.get(sourceSurface) || null;
    if (entry?.role !== 'counter' || entry.unit !== unitSurface || !entry.hundredTailReading) return null;
    const hundredTailReading = normalizeKanaReading(entry.hundredTailReading);
    return hundredTailReading ? { hundredTailReading, sourceSurface } : null;
}

function getReviewedNumericComponentEntries() {
    const entries = [];
    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        if (entry?.role !== 'numeric-component' || !entry.reading || !embeddedCounterKanjiNumeralPattern.test(surface)) continue;
        entries.push({ surface, reading: normalizeKanaReading(entry.reading) });
    }
    return entries.sort((a, b) => Array.from(b.surface).length - Array.from(a.surface).length);
}

function getReviewedOrTokenizerNumeralReading(surface) {
    const numeralSurface = String(surface || '');
    const reviewed = getReviewedCounterDateEvidence(numeralSurface, 'numeric-component');
    if (reviewed?.reading) return normalizeKanaReading(reviewed.reading);
    if (!embeddedCounterKanjiNumeralPattern.test(numeralSurface)) {
        return normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
    }

    const components = getReviewedNumericComponentEntries();
    const characters = Array.from(numeralSurface);
    const pieces = [];
    let cursor = 0;
    let usedReviewedComponent = false;
    while (cursor < characters.length) {
        const remainder = characters.slice(cursor).join('');
        const component = components.find(item => remainder.startsWith(item.surface));
        if (component) {
            pieces.push(component.reading);
            cursor += Array.from(component.surface).length;
            usedReviewedComponent = true;
            continue;
        }

        let nextReviewedOffset = characters.length;
        for (let offset = cursor + 1; offset < characters.length; offset += 1) {
            const candidateRemainder = characters.slice(offset).join('');
            if (components.some(item => candidateRemainder.startsWith(item.surface))) {
                nextReviewedOffset = offset;
                break;
            }
        }
        const ordinarySurface = characters.slice(cursor, nextReviewedOffset).join('');
        const ordinaryReading = normalizeKanaReading(getTokenizerReadingForSurface(ordinarySurface) || '');
        if (!ordinaryReading) return normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
        pieces.push(ordinaryReading);
        cursor = nextReviewedOffset;
    }
    return usedReviewedComponent ? pieces.join('') : normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
}

function getReviewedEmbeddedCounterTailEvidence(numeralSurface, unitSurface, fullSurface) {
    const exactWhole = runtimeState.counterDateReadingDictionary.get(String(fullSurface || '')) || null;
    if (exactWhole?.reading && exactWhole.role === 'counter') return null;
    let best = null;
    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        if (!entry?.numericTail || entry.role !== 'counter' || entry.unit !== unitSurface || !surface.endsWith(unitSurface)) continue;
        const tailNumeral = surface.slice(0, -unitSurface.length);
        if (!tailNumeral || !embeddedCounterKanjiNumeralPattern.test(tailNumeral) || !numeralSurface.endsWith(tailNumeral)) continue;
        if (!best || Array.from(tailNumeral).length > Array.from(best.tailNumeral).length) {
            best = { tailNumeral, reading: normalizeKanaReading(entry.reading), sourceSurface: surface };
        }
    }
    return best?.reading ? best : null;
}

function isRule0NumericGroupBoundary(previousToken, token) {
    if (!isJapaneseNumeralSurface(previousToken?.surface_form) || !isJapaneseNumeralSurface(token?.surface_form)) return false;
    if (isLargeNumericUnitSurface(token.surface_form)) return false;
    return numericGroupTerminalPattern.test(String(previousToken.surface_form || ''));
}

function getEmbeddedCounterTailSpan(tokens, startIndex) {
    const first = tokens[startIndex] || null;
    if (!first) return null;
    let numeralStart = startIndex;
    let ordinalPrefix = '';
    if (String(first.surface_form || '') === '第' && first.pos === '接頭詞' && first.pos_detail_1 === '数接続') {
        numeralStart += 1;
        ordinalPrefix = '第';
    } else if (!isEmbeddedCounterKanjiNumeralToken(first)) {
        return null;
    }
    const firstNumeral = tokens[numeralStart] || null;
    if (!isEmbeddedCounterKanjiNumeralToken(firstNumeral)) return null;
    const previous = tokens[startIndex - 1] || null;
    if (previous && sourceTokensAreContiguous(previous, first)
        && (isEmbeddedCounterKanjiNumeralToken(previous) || String(previous.surface_form || '') === '第')
        && !isRule0NumericGroupBoundary(previous, first)) return null;

    let end = numeralStart;
    let numeralSurface = '';
    while (end < tokens.length && isEmbeddedCounterKanjiNumeralToken(tokens[end])) {
        if (end > numeralStart) {
            if (!sourceTokensAreContiguous(tokens[end - 1], tokens[end])) break;
            if (isRule0NumericGroupBoundary(tokens[end - 1], tokens[end])) break;
        }
        numeralSurface += String(tokens[end].surface_form || '');
        end += 1;
    }
    const unit = tokens[end] || null;
    const unitSurface = String(unit?.surface_form || '');
    if (!unitSurface || unit?.pos !== '名詞' || unit?.pos_detail_1 !== '接尾' || unit?.pos_detail_2 !== '助数詞'
        || !sourceTokensAreContiguous(tokens[end - 1], unit)) return null;

    const fullSurface = ordinalPrefix + numeralSurface + unitSurface;
    if (numeralSurface.endsWith('百')) {
        const hundredEvidence = getReviewedHundredCounterTailEvidence(unitSurface);
        const numeralReading = hundredEvidence ? getReviewedOrTokenizerNumeralReading(numeralSurface) : '';
        const ordinalReading = ordinalPrefix ? normalizeKanaReading(getTokenizerReadingForSurface(ordinalPrefix) || '') : '';
        if (hundredEvidence && numeralReading.endsWith('く') && (!ordinalPrefix || ordinalReading)) {
            return {
                endIndex: end,
                surface: fullSurface,
                reading: ordinalReading + numeralReading.slice(0, -1) + hundredEvidence.hundredTailReading,
                evidence: { ...hundredEvidence, tailNumeral: '百' }
            };
        }
    }
    const evidence = getReviewedEmbeddedCounterTailEvidence(numeralSurface, unitSurface, fullSurface);
    if (!evidence) return null;
    const prefixNumeralLength = Array.from(numeralSurface).length - Array.from(evidence.tailNumeral).length;
    if (prefixNumeralLength < 0) return null;
    const prefixNumeral = Array.from(numeralSurface).slice(0, prefixNumeralLength).join('');
    if (!prefixNumeral && !ordinalPrefix) return null;
    const ordinalReading = ordinalPrefix ? normalizeKanaReading(getTokenizerReadingForSurface(ordinalPrefix) || '') : '';
    const numeralPrefixReading = prefixNumeral ? getReviewedOrTokenizerNumeralReading(prefixNumeral) : '';
    if ((ordinalPrefix && !ordinalReading) || (prefixNumeral && !numeralPrefixReading)) return null;
    return {
        endIndex: end,
        surface: fullSurface,
        reading: ordinalReading + numeralPrefixReading + evidence.reading,
        evidence
    };
}

function markTypedEmbeddedCounterTailTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getEmbeddedCounterTailSpan(tokens, index);
        if (!span) {
            resolved.push(tokens[index]);
            continue;
        }
        resolved.push(makeDerivedSpanToken(tokens, index, span.endIndex, {
            surface_form: span.surface,
            reading: span.reading,
            pronunciation: span.reading,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericRoleSelected: true,
            typedNumericRole: 'counter',
            typedNumericRoleState: 'selected',
            typedNumericRoleSource: 'reviewed-embedded-counter-tail',
            typedNumericRoleReviewRequired: false,
            typedNumericRoleAlternatives: ['counter'],
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'counter',
            typedNumericReading: span.reading,
            typedNumericSource: 'counter-date-numeric-tail-evidence'
        }, {
            annotations: [
                'numericExpression', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState',
                'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives',
                'typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource'
            ],
            evidenceSource: 'counter-date-numeric-tail-evidence', semanticRole: 'counter-expression', reviewRequired: false
        }));
        index = span.endIndex;
    }
    return resolved;
}

function getMinuteCounterFinalDigit(surface) {
    const chars = Array.from(String(surface || ''));
    const map = { '〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':0 };
    const last = chars.at(-1);
    if (/^[0-9]$/u.test(last || '')) return Number(last);
    return Object.prototype.hasOwnProperty.call(map, last) ? map[last] : null;
}

// Minute morphology is deliberately scoped to the already-selected minute role.
// It is not a universal counter sound-change heuristic.
function resolveMinuteCounterReading(numeralSurface) {
    const fullSurface = String(numeralSurface || '') + '分';
    const reviewed = getReviewedCounterDateEvidence(fullSurface, 'minute-counter');
    if (reviewed?.reading) return { reading: reviewed.reading, source: 'counter-date-reading-evidence' };
    const numeralReading = getReviewedOrTokenizerNumeralReading(numeralSurface);
    if (/百$/u.test(String(numeralSurface || '')) && /(?:ひゃく|びゃく|ぴゃく)$/u.test(numeralReading)) {
        return { reading: numeralReading.slice(0, -1) + 'っぷん', source: 'minute-counter-morphology' };
    }
    const finalDigit = getMinuteCounterFinalDigit(numeralSurface);
    if (!numeralReading) return null;
    if (finalDigit == null) {
        return /[千万億兆]$/u.test(String(numeralSurface || ''))
            ? { reading: numeralReading + 'ふん', source: 'minute-counter-morphology' }
            : null;
    }
    if (finalDigit === 1 && numeralReading.endsWith('いち')) return { reading: numeralReading.slice(0, -2) + 'いっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 6 && numeralReading.endsWith('ろく')) return { reading: numeralReading.slice(0, -2) + 'ろっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 8 && numeralReading.endsWith('はち')) return { reading: numeralReading.slice(0, -2) + 'はっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 0 && numeralReading.endsWith('じゅう')) return { reading: numeralReading.slice(0, -3) + 'じゅっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 3 || finalDigit === 4) return { reading: numeralReading + 'ぷん', source: 'minute-counter-morphology' };
    return { reading: numeralReading + 'ふん', source: 'minute-counter-morphology' };
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markTypedMinuteCounterRoleTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!isJapaneseNumeralSurface(token?.surface_form)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
            if (end > index) {
                if (!sourceTokensAreContiguous(tokens[end - 1], tokens[end])) break;
                if (isRule0NumericGroupBoundary(tokens[end - 1], tokens[end])) break;
            }
            numeralSurface += String(tokens[end].surface_form || '');
            end += 1;
        }
        const unit = tokens[end] || null;
        if (String(unit?.surface_form || '') !== '分' || unit?.structuredFractionRole === 'denominator-unit' || hasReviewedLexicalBoundaryBefore(unit)) {
            merged.push(token);
            continue;
        }
        const resolvedMinute = resolveMinuteCounterReading(numeralSurface);
        if (!resolvedMinute) { merged.push(token); continue; }
        const surface = numeralSurface + '分';
        const members = tokens.slice(index, end + 1);
        const contextualLexical = getContextualCommonWordCandidateForSpan(sourceSpanCandidates, members, resolvedMinute.reading);
        if (contextualLexical) {
            // Reviewed context-specific lexical evidence owns this numeric-looking
            // span. Leave the source tokens intact so the common-word stage can
            // merge the lexical head without swallowing its following context.
            merged.push(token);
            continue;
        }
        const lexicalConflict = getCompetingLexicalCandidateForSpan(sourceSpanCandidates, members, resolvedMinute.reading);
        const adverbialConflict = isAdverbialBunLexicalConflict(lexicalConflict);
        const durationSuffixToken = tokens?.[end + 1] || null;
        const lexicalContinuation = String(durationSuffixToken?.surface_form || '') === '間'
            && sourceTokensAreContiguous(unit, durationSuffixToken)
            && hasLongerLexicalSpanAtSuffixBoundary(sourceSpanCandidates, unit, durationSuffixToken);
        const durationSuffixContext = String(durationSuffixToken?.surface_form || '') === '間'
            && sourceTokensAreContiguous(unit, durationSuffixToken)
            && !lexicalContinuation;
        const unresolvedRole = Boolean(lexicalConflict
            && (lexicalContinuation
                || (!durationSuffixContext && !hasIndependentMinuteCounterContext(tokens, index, end))));
        merged.push(makeTypedNumericRoleToken(members, surface, 'minute-counter', unresolvedRole ? 'numeric-role-conflict' : 'numeric-role-structure', {
            state: unresolvedRole ? 'ambiguous' : 'selected',
            alternatives: unresolvedRole ? ['minute-counter', 'lexical'] : ['minute-counter'],
            fallbackReading: unresolvedRole ? (adverbialConflict ? lexicalConflict.reading : resolvedMinute.reading) : null
        }));
        index = end;
    }
    return merged;
}

function mergeIdeographicDecimalNotationTokens(tokens) {
    const merged = [];
    const input = tokens || [];
    for (let index = 0; index < input.length; index += 1) {
        const first = input[index];
        const firstSurface = String(first?.surface_form || '');
        if (first?.pos_detail_1 !== '数' || !isIdeographicDecimalDigitSurface(firstSurface)) {
            merged.push(first);
            continue;
        }

        const previous = input[index - 1] || null;
        if (previous && sourceTokensAreContiguous(previous, first)
            && isJapaneseNumeralSurface(previous.surface_form)
            && !isIdeographicDecimalDigitSurface(previous.surface_form)) {
            merged.push(first);
            continue;
        }

        let endIndex = index;
        let surface = firstSurface;
        while (endIndex + 1 < input.length) {
            const next = input[endIndex + 1];
            const nextSurface = String(next?.surface_form || '');
            if (next?.pos_detail_1 !== '数' || !isIdeographicDecimalDigitSurface(nextSurface)) break;
            if (!sourceTokensAreContiguous(input[endIndex], next)) break;
            surface += nextSurface;
            endIndex += 1;
        }

        const following = input[endIndex + 1] || null;
        const mixedWithNonDecimalNumeral = Boolean(following
            && sourceTokensAreContiguous(input[endIndex], following)
            && isJapaneseNumeralSurface(following.surface_form)
            && !isIdeographicDecimalDigitSurface(following.surface_form));
        const canonicalDigits = canonicalizeIdeographicDecimalNotationSurface(surface);
        if (mixedWithNonDecimalNumeral || canonicalDigits === surface || !surface.includes('〇')) {
            merged.push(...input.slice(index, endIndex + 1));
            index = endIndex;
            continue;
        }

        merged.push(makeDerivedSpanToken(input, index, endIndex, {
            surface_form: surface,
            reading: canonicalDigits,
            pronunciation: canonicalDigits,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'decimal-notation',
            typedNumericReading: canonicalDigits,
            typedNumericSource: 'ideographic-decimal-notation',
            ideographicDecimalNotationMatched: true,
            ideographicDecimalCanonicalDigits: canonicalDigits
        }, {
            annotations: [
                'numericExpression', 'typedNumericExpressionMatched', 'typedNumericExpressionType',
                'typedNumericReading', 'typedNumericSource', 'ideographicDecimalNotationMatched',
                'ideographicDecimalCanonicalDigits'
            ],
            evidenceSource: 'unicode-ideographic-decimal-notation',
            semanticRole: 'decimal-notation',
            reviewRequired: false
        }));
        index = endIndex;
    }
    return merged;
}

function applyTypedNumericRoleReadings(tokens) {
    return (tokens || []).map(token => {
        const role = String(token?.typedNumericRole || '');
        if (!role || (role !== 'clock-hour' && role !== 'minute-counter')) return token;
        let resolved = null;
        if (role === 'clock-hour') {
            const reviewed = getReviewedCounterDateEvidence(token.surface_form, 'clock-hour');
            if (reviewed?.reading) resolved = { reading: reviewed.reading, source: 'counter-date-reading-evidence' };
        } else if (role === 'minute-counter') {
            const surface = String(token.surface_form || '');
            resolved = resolveMinuteCounterReading(surface.endsWith('分') ? surface.slice(0, -1) : surface);
        }
        if (!resolved?.reading) return token;
        return makeDerivedSpanToken([token], 0, 0, {
            reading: resolved.reading,
            pronunciation: resolved.reading,
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: role,
            typedNumericReading: resolved.reading,
            typedNumericSource: resolved.source
        }, {
            annotations: ['typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource'],
            evidenceSource: resolved.source, semanticRole: role,
            reviewRequired: Boolean(token.typedNumericRoleReviewRequired)
        });
    });
}


function getStandaloneLexicalToken(surface) {
    if (!runtimeState.tokenizer || !surface) return null;
    const standalone = runtimeState.tokenizer.tokenize(String(surface));
    if (standalone.length !== 1) return null;
    const token = standalone[0];
    return token?.pos === '名詞' && token?.pos_detail_1 !== '接尾' ? token : null;
}

function repairCaseMarkedCounterFollowerTokens(tokens) {
    return (tokens || []).map((token, index) => {
        if (token?.pos !== '名詞' || token?.pos_detail_1 !== '接尾' || token?.pos_detail_2 !== '一般') return token;
        const previous = tokens[index - 1] || null;
        const next = tokens[index + 1] || null;
        if (previous?.pos_detail_2 !== '助数詞' || next?.pos !== '助詞' || next?.pos_detail_1 !== '格助詞') return token;
        const standalone = getStandaloneLexicalToken(token.surface_form);
        const currentReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
        const standaloneReading = normalizeKanaReading(getKuromojiDictionaryReading(standalone) || '');
        if (!standalone || !standaloneReading || standaloneReading === currentReading) return token;
        return {
            ...standalone,
            word_position: token.word_position,
            tokenizationRoleBoundaryBefore: true,
            tokenizationRoleRepair: 'case-marked-counter-follower'
        };
    });
}

const STRUCTURAL_UNIT_ROLE_SURFACES = Object.freeze(new Set([
    '話', '巻', '章', '節'
]));

const STRUCTURAL_UNIT_NOUN_MODIFIERS = Object.freeze(new Set([
    '最終'
]));

function makeStructuralRoleReadingCandidate(reading, source) {
    return {
        reading,
        romaji: convertToRomaji(reading),
        weight: 100,
        rank: 1,
        categories: new Set(['morphological-role']),
        sources: new Set([source])
    };
}

function getUniqueExactStructuralSuffixEvidence(token) {
    const surface = String(token?.surface_form || '');
    if (!STRUCTURAL_UNIT_ROLE_SURFACES.has(surface)) return null;
    const candidates = getKuromojiExactDictionaryCandidates(surface)
        .filter(candidate => candidate.pos === '名詞' && candidate.pos_detail_1 === '接尾' && candidate.pos_detail_2 === '助数詞');
    const readings = [...new Set(candidates.map(candidate => normalizeKanaReading(candidate.reading)).filter(Boolean))];
    if (readings.length !== 1) return null;
    const reading = readings[0];
    return {
        reading,
        candidates: [makeStructuralRoleReadingCandidate(reading, 'kuromoji-exact-counter-role')]
    };
}

function getUniqueExactOrdinaryPrefixEvidence(token) {
    const surface = String(token?.surface_form || '');
    if (!surface || !containsHan(surface)) return null;
    const candidates = getKuromojiExactDictionaryCandidates(surface)
        .filter(candidate => candidate.pos === '接頭詞' && candidate.pos_detail_1 === '名詞接続');
    const readings = [...new Set(candidates.map(candidate => normalizeKanaReading(candidate.reading)).filter(Boolean))];
    if (readings.length !== 1) return null;
    const reading = readings[0];
    return {
        reading,
        candidates: [makeStructuralRoleReadingCandidate(reading, 'kuromoji-exact-noun-prefix-role')]
    };
}

function isReviewedStructuralNounModifier(token) {
    const surface = String(token?.surface_form || '');
    if (!STRUCTURAL_UNIT_NOUN_MODIFIERS.has(surface) || isProperNounToken(token)) return false;
    const analyserReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
    if (!analyserReading) return false;
    return getGeneralWordCandidates(getGeneralWordLookup(surface))
        .some(candidate => normalizeKanaReading(candidate.reading) === analyserReading);
}

function getOrdinaryCompoundReadingEvidence(token) {
    if (!token || !isProperNounToken(token) || !containsHan(token.surface_form)) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    const candidates = getGeneralWordCandidates(lookup);
    if (!candidates.length) return null;
    const exactOrdinaryReadings = new Set(getKuromojiExactDictionaryCandidates(token.surface_form)
        .filter(candidate => candidate.pos === '名詞' && candidate.pos_detail_1 === '接尾' && candidate.pos_detail_2 === '助数詞')
        .map(candidate => normalizeKanaReading(candidate.reading))
        .filter(Boolean));
    const supported = candidates.filter(candidate => exactOrdinaryReadings.has(normalizeKanaReading(candidate.reading)));
    if (supported.length !== 1) return null;
    return { reading: supported[0].reading, candidates };
}

function annotateOrdinaryCompoundReadingContext(tokens) {
    const marked = (tokens || []).map(token => ({ ...token }));
    for (let index = 0; index < marked.length; index += 1) {
        const token = marked[index];
        const previous = marked[index - 1] || null;
        const next = marked[index + 1] || null;

        const ordinaryEvidence = getOrdinaryCompoundReadingEvidence(token);
        if (ordinaryEvidence) {
            const ordinaryNounPrefix = Boolean(
                previous
                && sourceTokensAreContiguous(previous, token)
                && previous.pos === '接頭詞'
                && previous.pos_detail_1 === '名詞接続'
                && !isProperNounToken(previous)
            );
            const ordinaryNounSuffix = Boolean(
                next
                && sourceTokensAreContiguous(token, next)
                && next.pos === '名詞'
                && next.pos_detail_1 === '接尾'
                && next.pos_detail_2 !== '人名'
                && !isProperNounToken(next)
            );
            if (ordinaryNounPrefix || ordinaryNounSuffix) {
                marked[index] = {
                    ...token,
                    ordinaryCompoundReadingMatched: true,
                    ordinaryCompoundReading: ordinaryEvidence.reading,
                    ordinaryCompoundReadingCandidates: ordinaryEvidence.candidates
                };
                if (ordinaryNounPrefix && STRUCTURAL_UNIT_ROLE_SURFACES.has(String(token.surface_form || ''))) {
                    marked[index - 1] = { ...previous, structuralPrefixRoleMatched: true };
                }
                continue;
            }
        }

        if (!previous || !sourceTokensAreContiguous(previous, token)) continue;
        const structuralEvidence = getUniqueExactStructuralSuffixEvidence(token);
        if (!structuralEvidence) continue;

        const currentOrdinaryPrefix = previous.pos === '接頭詞'
            && previous.pos_detail_1 === '名詞接続'
            && !isProperNounToken(previous);
        const recoveredPrefixEvidence = currentOrdinaryPrefix ? null : getUniqueExactOrdinaryPrefixEvidence(previous);
        const reviewedNounModifier = isReviewedStructuralNounModifier(previous);
        if (!currentOrdinaryPrefix && !recoveredPrefixEvidence && !reviewedNounModifier) continue;

        marked[index] = {
            ...token,
            structuralRoleReadingMatched: true,
            structuralRoleReading: structuralEvidence.reading,
            structuralRoleReadingCandidates: structuralEvidence.candidates,
            structuralSuffixRoleMatched: true
        };
        if (currentOrdinaryPrefix) {
            marked[index - 1] = { ...previous, structuralPrefixRoleMatched: true };
        } else if (recoveredPrefixEvidence) {
            marked[index - 1] = {
                ...previous,
                pos: '接頭詞',
                pos_detail_1: '名詞接続',
                pos_detail_2: '*',
                pos_detail_3: '*',
                basic_form: String(previous.surface_form || ''),
                structuralRoleReadingMatched: true,
                structuralRoleReading: recoveredPrefixEvidence.reading,
                structuralRoleReadingCandidates: recoveredPrefixEvidence.candidates,
                structuralPrefixRoleMatched: true
            };
        }
    }
    return marked;
}

function annotatePostCensorshipOrdinaryLexicalContext(tokens) {
    const marked = (tokens || []).map(token => ({ ...token }));
    for (let index = 1; index < marked.length; index += 1) {
        const token = marked[index];
        const previous = marked[index - 1];
        if (!previous?.censorshipMarker || !isProperNounToken(token) || !containsHan(token?.surface_form)) continue;

        const candidates = getGeneralWordCandidates(getGeneralWordLookup(token.surface_form));
        const distinctReadings = [...new Set(candidates
            .map(candidate => normalizeKanaReading(candidate?.reading || ''))
            .filter(Boolean))];
        if (distinctReadings.length !== 1) continue;

        const ordinaryReading = distinctReadings[0];
        const analyserReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
        if (!analyserReading || analyserReading === ordinaryReading) continue;

        marked[index] = {
            ...token,
            postCensorshipOrdinaryLexicalMatched: true,
            postCensorshipOrdinaryLexicalReading: ordinaryReading,
            postCensorshipOrdinaryLexicalCandidates: candidates
        };
    }
    return marked;
}

function isDirectNegativeAuxiliaryContinuation(previous, token) {
    if (!previous || !token) return false;
    const previousStem = previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞';
    if (!previousStem) return false;
    return tokenBasicForm(token) === 'ない'
        && String(token.conjugated_type || '') === '特殊・ナイ';
}

function isContractedCausativePassiveBridge(tokens, index) {
    const token = tokens?.[index];
    const previous = tokens?.[index - 1];
    const next = tokens?.[index + 1];
    if (!token || !previous || !next) return false;
    return previous.pos === '動詞'
        && String(previous.conjugated_form || '') === '未然形'
        && token.pos === '動詞'
        && token.pos_detail_1 === '自立'
        && String(token.surface_form || '') === 'さ'
        && tokenBasicForm(token) === 'する'
        && String(token.conjugated_type || '') === 'サ変・スル'
        && String(token.conjugated_form || '') === '未然レル接続'
        && next.pos === '動詞'
        && next.pos_detail_1 === '接尾'
        && tokenBasicForm(next) === 'れる';
}

const reviewedAspectualCompoundVerbBasicForms = new Set(['続ける', '始める', '終える', '終わる']);
const reviewedTeDeMotionContinuationBasicForms = new Set(['行く', 'いく', 'ゆく', '来る', 'くる']);
const godanContinuativeStemDictionaryEndings = new Map([
    ['い', 'う'], ['き', 'く'], ['ぎ', 'ぐ'], ['し', 'す'], ['ち', 'つ'],
    ['に', 'ぬ'], ['び', 'ぶ'], ['み', 'む'], ['り', 'る']
]);

function getReviewedNounMisparsedContinuativeStem(token) {
    if (!token || token.pos !== '名詞' || token.pos_detail_1 === '固有名詞') return null;
    const surface = String(token.surface_form || '');
    if (!surface) return null;
    const final = surface.slice(-1);
    const dictionaryEnding = godanContinuativeStemDictionaryEndings.get(final);
    if (!dictionaryEnding) return null;
    const dictionarySurface = surface.slice(0, -1) + dictionaryEnding;
    const lookup = getGeneralWordLookup(dictionarySurface);
    const candidates = getGeneralWordCandidates(lookup);
    if (!candidates.length) return null;
    const standalone = getStandaloneSingleToken(dictionarySurface);
    if (!standalone || standalone.pos !== '動詞' || standalone.pos_detail_1 === '接尾') return null;
    const standaloneReading = normalizeKanaReading(getKuromojiDictionaryReading(standalone) || standalone.reading || standalone.pronunciation || '');
    const supported = candidates.filter(candidate => normalizeKanaReading(candidate.reading) === standaloneReading);
    if (supported.length !== 1) return null;
    return { surface: dictionarySurface, reading: supported[0].reading };
}

function getReviewedSingleTokenCompoundVerbRecovery(previous, token) {
    if (!previous || !token || token.pos !== '動詞' || !sourceTokensAreContiguous(previous, token)) return null;
    const recoveredStem = getReviewedNounMisparsedContinuativeStem(previous);
    if (!recoveredStem) return null;
    const compoundSurface = String(previous.surface_form || '') + String(token.surface_form || '');
    const compound = getStandaloneSingleToken(compoundSurface);
    if (!compound || compound.pos !== '動詞' || compound.pos_detail_1 === '接尾') return null;
    const compoundReading = normalizeKanaReading(getKuromojiDictionaryReading(compound) || compound.reading || compound.pronunciation || '');
    const stemReading = normalizeKanaReading(getKuromojiDictionaryReading(previous) || previous.reading || previous.pronunciation || '');
    const followerReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '');
    if (!compoundReading || !stemReading || !followerReading || compoundReading !== stemReading + followerReading) return null;
    return { ...recoveredStem, compoundSurface, compoundReading };
}

const historicalShikuInflectionContinuations = new Set(['けれ', 'から', 'かり', 'かる', 'かれ', 'く', 'き']);

/** @param {CJ2RToken|null|undefined} token @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function getHistoricalInflectionBoundaryEvidence(token, sourceSpanCandidates = []) {
    if (!token || !Number.isInteger(token.sourceStart)) return null;
    const surface = String(token.surface_form || '');
    if (!historicalShikuInflectionContinuations.has(surface)) return null;
    return (sourceSpanCandidates || []).find(candidate =>
        candidate?.category === 'historical'
        && candidate?.kind === 'historical-reading'
        && candidate?.sourceEnd === token.sourceStart
        && candidate?.metadata?.conjugationClass === 'シク活用'
        && String(candidate?.sourceSurface || '').endsWith('し')
        && String(candidate?.reading || '').endsWith('し')
    ) || null;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function annotateMorphologicalOutputBoundaries(tokens, sourceSpanCandidates = []) {
    return (tokens || []).map((token, index) => {
        if (index === 0) return token;
        const previous = tokens[index - 1];
        const surface = String(token?.surface_form || '');
        const previousSurface = String(previous?.surface_form || '');
        const previousConjugation = String(previous?.conjugated_form || '');
        const separateAuxiliary = token?.pos === '動詞' && token?.pos_detail_1 === '非自立' && startsSeparateAuxiliaryUnit(token);
        const teDeLinkedSequence = /[てで]$/u.test(previousSurface);
        const compoundVerb = token?.pos === '動詞'
            && previous?.pos === '動詞'
            && previousConjugation.startsWith('連用')
            && !separateAuxiliary
            && !teDeLinkedSequence;
        const recoveredAspectualStem = token?.pos === '動詞'
            && reviewedAspectualCompoundVerbBasicForms.has(tokenBasicForm(token))
            && sourceTokensAreContiguous(previous, token)
            ? getReviewedNounMisparsedContinuativeStem(previous)
            : null;
        const recoveredSingleTokenCompound = token?.pos === '動詞'
            ? getReviewedSingleTokenCompoundVerbRecovery(previous, token)
            : null;
        const recoveredContinuativeCompound = Boolean((recoveredAspectualStem || recoveredSingleTokenCompound) && !separateAuxiliary && !teDeLinkedSequence);
        const recoveredAspectualCompound = Boolean(recoveredAspectualStem && recoveredContinuativeCompound);
        const teDeMotionContinuation = token?.pos === '動詞'
            && previous?.pos === '動詞'
            && reviewedTeDeMotionContinuationBasicForms.has(tokenBasicForm(token))
            && /[てで]$/u.test(previousSurface)
            && sourceTokensAreContiguous(previous, token);
        const attachedConjunctive = token?.pos === '助詞' && token?.pos_detail_1 === '接続助詞'
            && morphologicalJoinParticleSurfaces.has(surface)
            && Boolean(previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞'));
        const negativeAuxiliary = isDirectNegativeAuxiliaryContinuation(previous, token);
        const causativePassiveBridge = isContractedCausativePassiveBridge(tokens, index);
        const historicalInflectionEvidence = getHistoricalInflectionBoundaryEvidence(token, sourceSpanCandidates);
        if (!compoundVerb && !recoveredContinuativeCompound && !teDeMotionContinuation && !attachedConjunctive && !negativeAuxiliary && !causativePassiveBridge && !historicalInflectionEvidence) return token;
        const reason = historicalInflectionEvidence
            ? 'historical-adjective-inflection'
            : negativeAuxiliary
                ? 'direct-negative-inflection'
                : causativePassiveBridge
                ? 'contracted-causative-passive-bridge'
                : recoveredContinuativeCompound
                    ? (recoveredAspectualCompound ? 'reviewed-continuative-stem-aspectual-compound' : 'reviewed-continuative-stem-single-token-compound')
                    : teDeMotionContinuation
                        ? 'te-de-motion-continuation'
                        : compoundVerb
                            ? 'continuative-stem-compound-verb'
                            : 'attached-conjunctive-particle';
        return {
            ...token,
            morphologicalJoinLeft: true,
            morphologicalJoinReason: reason,
            morphologicalJoinAuthority: historicalInflectionEvidence
                ? 'historical-kana-evidence'
                : compoundVerb || recoveredContinuativeCompound || teDeMotionContinuation || causativePassiveBridge
                    ? 'strong-morphology'
                    : 'grammar',
            recoveredContinuativeStem: recoveredContinuativeCompound ? (recoveredAspectualStem || recoveredSingleTokenCompound)?.surface : undefined
        };
    });
}

function isKanaSurface(value) {
    return /^[ぁ-ゖァ-ンヴー]+$/u.test(String(value || ''));
}

function isMorphologicalStemToken(token) {
    return Boolean(token) && (token.pos === '動詞' || token.pos === '形容詞' || token.pos_detail_1 === '形容動詞語幹');
}

function isTeDeMorphologicalConnector(token) {
    return Boolean(token)
        && (token.surface_form === 'て' || token.surface_form === 'で')
        && (token.pos === '助詞' || (token.pos === '動詞' && token.pos_detail_1 === '非自立'));
}

function hasUnsafeKanaLexicalLeftBoundary(tokens, startIndex) {
    if (startIndex <= 0) return false;
    const current = tokens[startIndex];
    const previous = tokens[startIndex - 1];
    const beforePrevious = tokens[startIndex - 2];
    const currentLooksAttached = isGrammaticalToken(current)
        || current?.pos_detail_1 === '非自立'
        || isTeDeMorphologicalConnector(current);
    if (isMorphologicalStemToken(previous) && currentLooksAttached) return true;
    if (isTeDeMorphologicalConnector(previous) && isMorphologicalStemToken(beforePrevious)) return true;
    return previous?.pos === '動詞' && previous?.pos_detail_1 === '非自立';
}

function hasMorphologicalConnectorInSpan(tokens, startIndex, endIndex) {
    for (let index = startIndex + 1; index <= endIndex; index += 1) {
        if (isMorphologicalStemToken(tokens[index - 1]) && isTeDeMorphologicalConnector(tokens[index])) return true;
    }
    return false;
}

function hasUnsafeKanaLexicalRightBoundary(tokens, startIndex, endIndex) {
    if (endIndex >= tokens.length - 1 || !hasMorphologicalConnectorInSpan(tokens, startIndex, endIndex)) return false;
    const current = tokens[endIndex];
    const next = tokens[endIndex + 1];
    if (isTeDeMorphologicalConnector(current) && next?.pos === '動詞' && next?.pos_detail_1 === '非自立') return true;
    if (current?.pos === '動詞' && current?.pos_detail_1 === '非自立' && runtimeState.auxiliarySpacingBasicForms.has(tokenBasicForm(current))) {
        return next?.pos === '助動詞' || isGrammaticalToken(next) || runtimeState.conjugationJoinEndings.has(String(next?.surface_form || ''));
    }
    return false;
}

const kanaCommonWordFragmentHonorificReadings = new Map([
    ['さん', 'さん'], ['さま', 'さま'], ['くん', 'くん'], ['ちゃん', 'ちゃん']
]);

function selectReviewedKanaCommonWordBoundaryRule(surface, sourceText, hasProperNoun = false) {
    const contextual = selectCommonWordRule(surface, sourceText, false);
    if (contextual) return contextual;
    if (hasProperNoun) return null;
    return selectCommonWordRule(surface, sourceText, true) || null;
}

function findReviewedKanaCommonWordBoundarySplit(tokens, startIndex, sourceText) {
    if (hasUnsafeKanaLexicalLeftBoundary(tokens, startIndex)) return null;
    const startSurface = String(tokens[startIndex]?.surface_form || '');
    if (kanaCommonWordFragmentHonorificReadings.has(startSurface)) return null;
    let candidateSurface = '';
    let hasProperNoun = false;
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        const surface = String(token?.surface_form || '');
        if (!isKanaSurface(surface)) break;
        hasProperNoun ||= isProperNounToken(token);
        const characters = Array.from(surface);
        for (let offset = 1; offset <= characters.length; offset += 1) {
            const matchedSurface = candidateSurface + characters.slice(0, offset).join('');
            if (!canContinueCommonWord(matchedSurface)) break;
            const rule = selectReviewedKanaCommonWordBoundaryRule(matchedSurface, sourceText, hasProperNoun);
            if (rule && end > startIndex && offset < characters.length && !hasMorphologicalConnectorInSpan(tokens, startIndex, end)) {
                bestMatch = { surface: matchedSurface, reading: rule.reading, endIndex: end, endOffset: offset };
            }
        }
        candidateSurface += surface;
        if (!canContinueCommonWord(candidateSurface)) break;
    }
    return bestMatch;
}

function makeKanaCommonWordBoundaryFragment(token, surface, characterOffset = 0) {
    const fragment = String(surface || '');
    const position = Number(token?.word_position || 0);
    const length = Array.from(fragment).length;
    return makeDerivedSubspanToken(token, characterOffset, characterOffset + length, {
        surface_form: fragment,
        basic_form: fragment,
        reading: fragment,
        pronunciation: fragment,
        word_position: position > 0 ? position + characterOffset : position,
        kanaCommonWordBoundaryFragment: true
    }, {
        annotations: ['kanaCommonWordBoundaryFragment'], evidenceSource: 'reviewed-kana-common-word-boundary', semanticRole: 'lexical-boundary-fragment'
    });
}

function tokenizeKanaCommonWordBoundaryRemainder(token, surface, characterOffset, evidenceSurface) {
    const remainder = String(surface || '');
    if (!remainder) return [];
    const originalPosition = Number(token?.word_position || 0);
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    const reconstructed = retokenized.map(item => String(item?.surface_form || '')).join('');
    const rawTokens = retokenized.length && reconstructed === remainder ? retokenized : null;
    if (!rawTokens) {
        const fallback = makeKanaCommonWordBoundaryFragment(token, remainder, characterOffset);
        fallback.reviewedLexicalBoundaryBefore = true;
        fallback.reviewedLexicalBoundaryEvidenceSurface = evidenceSurface;
        return [fallback];
    }
    let consumed = 0;
    return rawTokens.map((item, index) => {
        const surfaceForm = String(item?.surface_form || '');
        const length = Array.from(surfaceForm).length;
        const adjusted = makeDerivedSubspanToken(token, characterOffset + consumed, characterOffset + consumed + length, {
            ...item,
            word_position: originalPosition > 0 ? originalPosition + characterOffset + consumed : Number(item?.word_position || 0),
            kanaCommonWordBoundaryFragment: true
        }, {
            annotations: ['kanaCommonWordBoundaryFragment'], evidenceSource: 'reviewed-kana-common-word-boundary', semanticRole: 'lexical-boundary-fragment'
        });
        if (index === 0) {
            adjusted.reviewedLexicalBoundaryBefore = true;
            adjusted.reviewedLexicalBoundaryEvidenceSurface = evidenceSurface;
        }
        consumed += length;
        return adjusted;
    });
}

function splitReviewedKanaCommonWordBoundaryTokens(tokens, sourceText) {
    const working = [...(tokens || [])];
    const maxSplits = Math.max(8, working.length * 2);
    for (let splitCount = 0; splitCount < maxSplits; splitCount += 1) {
        let splitApplied = false;
        for (let startIndex = 0; startIndex < working.length; startIndex += 1) {
            const match = findReviewedKanaCommonWordBoundarySplit(working, startIndex, sourceText);
            if (!match) continue;
            const endToken = working[match.endIndex];
            const characters = Array.from(String(endToken?.surface_form || ''));
            const prefixSurface = characters.slice(0, match.endOffset).join('');
            const remainderSurface = characters.slice(match.endOffset).join('');
            if (!prefixSurface || !remainderSurface) continue;
            const prefixFragment = makeKanaCommonWordBoundaryFragment(endToken, prefixSurface, 0);
            const remainderTokens = tokenizeKanaCommonWordBoundaryRemainder(endToken, remainderSurface, match.endOffset, match.surface);
            if (!remainderTokens.length) continue;
            working.splice(
                match.endIndex,
                1,
                prefixFragment,
                ...remainderTokens
            );
            splitApplied = true;
            break;
        }
        if (!splitApplied) break;
    }
    return working;
}

function mergeKanaCommonWordBoundaryHonorificTokens(tokens) {
    const merged = [];
    const honorifics = [...kanaCommonWordFragmentHonorificReadings.keys()];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const previous = merged[merged.length - 1];
        if (!previous?.kanaLexicalSpanMatched) { merged.push(token); continue; }
        let candidate = '';
        let endMatch = -1;
        let sawBoundaryFragment = false;
        for (let end = index; end < Math.min(tokens.length, index + 3); end += 1) {
            const next = tokens[end];
            const surface = String(next?.surface_form || '');
            if (!isKanaSurface(surface)) break;
            candidate += surface;
            sawBoundaryFragment ||= Boolean(next?.kanaCommonWordBoundaryFragment);
            if (sawBoundaryFragment && kanaCommonWordFragmentHonorificReadings.has(candidate)) endMatch = end;
            if (!honorifics.some(item => item.startsWith(candidate))) break;
        }
        if (endMatch < index) { merged.push(token); continue; }
        const surface = tokens.slice(index, endMatch + 1).map(item => String(item.surface_form || '')).join('');
        const reading = kanaCommonWordFragmentHonorificReadings.get(surface);
        merged.push(makeDerivedSpanToken(tokens, index, endMatch, {
            surface_form: surface,
            basic_form: surface,
            reading,
            pronunciation: reading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            kanaCommonWordBoundaryHonorific: true
        }, {
            annotations: ['kanaCommonWordBoundaryHonorific'], evidenceSource: 'reviewed-kana-honorific', semanticRole: 'name-honorific'
        }));
        index = endMatch;
    }
    return merged;
}

function findLongestKanaLexicalReading(tokens, startIndex) {
    if (hasUnsafeKanaLexicalLeftBoundary(tokens, startIndex) || tokens[startIndex]?.sourceSpanGrammarBoundary || tokens[startIndex]?.sourceSpanGrammarBoundaryBefore) return null;
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end) || (end > startIndex && tokens[end]?.sourceSpanGrammarBoundaryBefore)) break;
        const surface = String(token?.surface_form || '');
        if (!isKanaSurface(surface)) break;
        candidateSurface += surface;
        const normalizedReading = normalizeKanaReading(candidateSurface);
        if (!runtimeState.kanaLexicalReadingPrefixes.has(normalizedReading)) break;
        if (end === startIndex) continue;
        const evidence = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading);
        if (evidence && !hasUnsafeKanaLexicalRightBoundary(tokens, startIndex, end)) {
            bestMatch = {
                surface: candidateSurface,
                reading: normalizedReading,
                evidence,
                length: end - startIndex + 1,
                strong: Boolean(evidence.strongSources?.size)
            };
        }
    }
    return bestMatch;
}


function isEntireCanonicalBoundarySurface(surface) {
    const value = String(surface || '');
    if (!value) return false;
    const runs = getCanonicalHardBoundaryRuns(value);
    return runs.length === 1 && runs[0].start === 0 && runs[0].end === value.length;
}

function classifyCanonicalBoundaryTokens(tokens) {
    return (tokens || []).map(token => {
        const surface = String(token?.surface_form || '');
        if (!isEntireCanonicalBoundarySurface(surface)) return token;
        const whitespace = /^[\s\u3000]+$/u.test(surface);
        const censorshipMarker = isJapaneseCensorshipMarkerSurface(surface);
        return {
            ...token,
            pos: '記号',
            pos_detail_1: whitespace ? '空白' : '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            reading: surface,
            pronunciation: surface,
            canonicalBoundary: true,
            crossNotationSymbol: surface === '×',
            censorshipMarker
        };
    });
}

function offsetTokenWordPosition(token, sourceOffset) {
    const position = Number(token?.word_position || 0);
    return position > 0 ? { ...token, word_position: position + sourceOffset } : token;
}

function makeCanonicalBoundaryToken(surface, sourceOffset) {
    const whitespace = /^[\s\u3000]+$/u.test(String(surface || ''));
    return {
        surface_form: surface,
        pos: '記号',
        pos_detail_1: whitespace ? '空白' : '一般',
        pos_detail_2: '*',
        pos_detail_3: '*',
        conjugated_type: '*',
        conjugated_form: '*',
        basic_form: surface,
        reading: surface,
        pronunciation: surface,
        word_position: sourceOffset + 1,
        canonicalBoundary: true,
        hardBoundaryReconstructed: true,
        crossNotationSymbol: surface === '×',
        censorshipMarker: isJapaneseCensorshipMarkerSurface(surface)
    };
}

function tokenizeHardBoundarySegment(segment, sourceOffset) {
    if (!runtimeState.tokenizer) return [];
    const raw = String(segment || '');
    const core = raw.trim();
    if (!core) return [];
    const coreOffset = raw.indexOf(core);
    return restoreDroppedSokuonTokens(runtimeState.tokenizer.tokenize(core), core)
        .map(token => offsetTokenWordPosition(token, sourceOffset + coreOffset));
}

function hasAdjacentTransparentGrammarBoundary(sourceText, token) {
    const source = String(sourceText || '');
    const start = Number(token?.sourceStart);
    const end = Number(token?.sourceEnd);
    const transparentRunAt = (index, direction) => {
        let sawBoundary = false;
        for (let cursor = index; cursor >= 0 && cursor < source.length; cursor += direction) {
            const character = source[cursor];
            const sourceWhitespace = /[\s\u3000]/u.test(character);
            const hardBoundary = isCanonicalHardBoundaryAt(source, cursor);
            if (!sourceWhitespace && !hardBoundary) break;
            sawBoundary = true;
            if (!sourceWhitespace && !isCanonicalTransparentBoundaryCharacter(character)) return false;
        }
        return sawBoundary;
    };
    return (Number.isInteger(start) && start > 0 && transparentRunAt(start - 1, -1))
        || (Number.isInteger(end) && end < source.length && transparentRunAt(end, 1));
}

function restoreTransparentBoundaryGrammaticalRoles(rebuiltTokens, originalTokens, sourceText) {
    const originalBySpan = new Map();
    for (const token of originalTokens || []) {
        if (!token || (!isGrammaticalToken(token) && !isNominalizer(token))) continue;
        if (!hasAdjacentTransparentGrammarBoundary(sourceText, token)) continue;
        const key = `${token.sourceStart}:${token.sourceEnd}:${String(token.surface_form || '')}`;
        originalBySpan.set(key, token);
    }
    return attachSourceTokenSpans(rebuiltTokens, sourceText).map(token => {
        const key = `${token.sourceStart}:${token.sourceEnd}:${String(token.surface_form || '')}`;
        const original = originalBySpan.get(key);
        if (!original) return token;
        return {
            ...token,
            pos: original.pos,
            pos_detail_1: original.pos_detail_1,
            pos_detail_2: original.pos_detail_2,
            pos_detail_3: original.pos_detail_3,
            conjugated_type: original.conjugated_type,
            conjugated_form: original.conjugated_form,
            basic_form: original.basic_form,
            reading: original.reading,
            pronunciation: original.pronunciation,
            transparentBoundaryGrammarRoleRestored: true
        };
    });
}

function stabilizeHardBoundaryTokenization(tokens, sourceText) {
    const text = String(sourceText || '');
    const boundaries = getCanonicalHardBoundaryRuns(text);
    if (!runtimeState.tokenizer || !boundaries.length) return classifyCanonicalBoundaryTokens(tokens);

    const rebuilt = [];
    let cursor = 0;
    for (const boundary of boundaries) {
        rebuilt.push(...tokenizeHardBoundarySegment(text.slice(cursor, boundary.start), cursor));
        rebuilt.push(makeCanonicalBoundaryToken(boundary.surface, boundary.start));
        cursor = boundary.end;
    }
    rebuilt.push(...tokenizeHardBoundarySegment(text.slice(cursor), cursor));
    const classified = classifyCanonicalBoundaryTokens(rebuilt);
    return restoreTransparentBoundaryGrammaticalRoles(classified, tokens, text);
}

function isSourceSpanGrammarAnchor(token) {
    if (!token || token.pos === '記号' || isParticle(token) || isNominalizer(token) || token.pos === '助動詞') return false;
    return Boolean(String(token.surface_form || ''));
}

function getKanaRunLexicalReadingSpan(runTokens) {
    if (!runTokens?.length || isParticle(runTokens[0]) || isNominalizer(runTokens[0])) return null;
    const surface = runTokens.map(token => String(token.surface_form || '')).join('');
    const characters = Array.from(surface);
    let candidate = '';
    let bestLength = 0;
    for (let length = 1; length <= characters.length; length += 1) {
        candidate += characters[length - 1];
        const normalized = normalizeKanaReading(candidate);
        if (!runtimeState.kanaLexicalReadingPrefixes.has(normalized)) break;
        if (runtimeState.kanaLexicalReadingDictionary.has(normalized)) bestLength = length;
    }
    if (bestLength <= 0) return null;
    const reading = normalizeKanaReading(characters.slice(0, bestLength).join(''));
    const evidence = runtimeState.kanaLexicalReadingDictionary.get(reading) || null;
    return {
        start: 0,
        end: bestLength,
        surface: characters.slice(0, bestLength).join(''),
        strong: Boolean(evidence?.strongSources?.size)
    };
}

function lexicalKanaEvidenceCoversToken(runTokens, tokenIndex, lexicalSpan) {
    if (!lexicalSpan || tokenIndex < 0 || tokenIndex >= runTokens.length) return false;
    let start = 0;
    for (let index = 0; index < tokenIndex; index += 1) start += Array.from(String(runTokens[index].surface_form || '')).length;
    const end = start + Array.from(String(runTokens[tokenIndex].surface_form || '')).length;
    return lexicalSpan.start <= start && lexicalSpan.end > start && lexicalSpan.end >= end;
}

function isEstablishedSourceLexicalBoundaryCandidate(candidate) {
    if (!candidate || candidate.reviewRequired === true || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return false;
    if (candidate.category === 'loanword' && candidate.evidenceSource === 'source-language-loanword' && candidate.romaji != null) return true;
    if (candidate.kind === 'kuromoji-exact-dictionary-span' && Number(candidate.confidence || 0) >= 0.85) return true;
    if ((candidate.kind === 'common-word' || candidate.kind === 'common-word-inflection' || candidate.category === 'title')
        && Number(candidate.confidence || 0) >= 0.85) return true;
    return false;
}

function getEstablishedSourceLexicalBoundaryBeforeToken(sourceSpanCandidates, token) {
    if (!token || !Number.isInteger(token.sourceStart)) return null;
    const matches = (sourceSpanCandidates || []).filter(candidate =>
        isEstablishedSourceLexicalBoundaryCandidate(candidate)
        && candidate.sourceEnd === token.sourceStart
        && candidate.sourceStart < candidate.sourceEnd);
    if (!matches.length) return null;
    matches.sort((left, right) => left.sourceStart - right.sourceStart
        || Number(right.confidence || 0) - Number(left.confidence || 0));
    return matches[0];
}

function hasEstablishedSourceLexicalSpanCrossingToken(sourceSpanCandidates, token, boundaryCandidate) {
    if (!token || !boundaryCandidate || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return false;
    return (sourceSpanCandidates || []).some(candidate => {
        if (candidate === boundaryCandidate || candidate?.reviewRequired === true) return false;
        if (!Number.isInteger(candidate?.sourceStart) || !Number.isInteger(candidate?.sourceEnd)) return false;
        if (candidate.sourceStart > boundaryCandidate.sourceStart || candidate.sourceEnd < token.sourceEnd) return false;
        if (isEstablishedSourceLexicalBoundaryCandidate(candidate)) return true;
        return candidate.kind === 'kana-lexical-reading'
            && candidate.evidenceSource === 'kana-lexical-strong-evidence'
            && Number(candidate.confidence || 0) >= 0.9;
    });
}

/** @param {CJ2RToken[]} tokens @param {number} absoluteIndex @param {number} runStart @param {number} runEnd @param {any} lexicalSpan @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function isStrongKanaGrammarToken(tokens, absoluteIndex, runStart, runEnd, lexicalSpan, sourceSpanCandidates = []) {
    const token = tokens[absoluteIndex];
    if (!token || (!isParticle(token) && !isNominalizer(token))) return false;

    const runTokens = tokens.slice(runStart, runEnd + 1);
    const runIndex = absoluteIndex - runStart;
    const establishedBoundaryBefore = getEstablishedSourceLexicalBoundaryBeforeToken(sourceSpanCandidates, token);
    const establishedSpanAcross = hasEstablishedSourceLexicalSpanCrossingToken(sourceSpanCandidates, token, establishedBoundaryBefore);
    if (lexicalSpan?.strong
        && lexicalKanaEvidenceCoversToken(runTokens, runIndex, lexicalSpan)
        && (!establishedBoundaryBefore || establishedSpanAcross)) return false;

    const surface = String(token.surface_form || '');
    const previous = tokens[absoluteIndex - 1] || null;
    const next = tokens[absoluteIndex + 1] || null;
    const isGrammarLike = item => Boolean(item) && (isParticle(item) || isNominalizer(item) || item.pos === '助動詞');
    const nearestAnchor = direction => {
        for (let index = absoluteIndex + direction; index >= 0 && index < tokens.length; index += direction) {
            const candidate = tokens[index];
            if (candidate?.pos === '記号') return null;
            if (isGrammarLike(candidate)) continue;
            return isSourceSpanGrammarAnchor(candidate) ? candidate : null;
        }
        return null;
    };
    const leftAnchor = nearestAnchor(-1);
    const rightAnchor = nearestAnchor(1);

    if (surface === 'ん' && !rightAnchor) return false;

    // Conjunctive particles are grammatical when their surrounding morphology supports that role.
    // Keeping the original token lets the later morphology layer decide whether the output joins left.
    if (token.pos === '助詞' && token.pos_detail_1 === '接続助詞') {
        if (isMorphologicalStemToken(previous) || previous?.pos === '助動詞') return true;
        if (next?.pos === '動詞' && next?.pos_detail_1 === '非自立') return true;
        return Boolean(leftAnchor && rightAnchor);
    }

    if (token.pos_detail_1 === '係助詞') return Boolean(leftAnchor);
    if (token.pos_detail_1 === '格助詞' || token.pos_detail_1 === '連体化') {
        if (leftAnchor && rightAnchor) return true;
        // A trailing case particle can still be grammatical when the kana run is an inflection/suffix
        // attached to a lexical token outside the run (for example 獣たちへ).
        const externalLeftAnchor = runStart > 0 && isSourceSpanGrammarAnchor(tokens[runStart - 1]);
        if (externalLeftAnchor && absoluteIndex === runEnd && token.pos_detail_1 === '格助詞') return true;
        if (absoluteIndex === runEnd && leftAnchor && token.pos_detail_1 === '格助詞' && surface !== 'を' && surface !== 'へ') return true;
        return false;
    }
    const particleDetail = String(token.pos_detail_1 || '');
    if (particleDetail === '副助詞' || particleDetail === '並立助詞') return Boolean(leftAnchor && rightAnchor);
    if (particleDetail.includes('終助詞')) {
        return Boolean(leftAnchor && (rightAnchor || isMorphologicalStemToken(previous) || previous?.pos === '助動詞'));
    }
    if (isNominalizer(token)) return Boolean(leftAnchor && rightAnchor);
    return Boolean(leftAnchor && rightAnchor);
}

function makeBoundaryNeutralKanaToken(members) {
    const surface = members.map(token => String(token.surface_form || '')).join('');
    const lexical = members.find(token => isSourceSpanGrammarAnchor(token)) || members[0];
    const first = members[0];
    return makeDerivedSpanToken(members, 0, members.length - 1, {
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        pos: lexical?.pos,
        pos_detail_1: lexical?.pos_detail_1,
        pos_detail_2: lexical?.pos_detail_2,
        pos_detail_3: lexical?.pos_detail_3,
        basic_form: lexical?.basic_form,
        word_position: first.word_position,
        sourceSpanReconciled: true,
        sourceSpanReconciliationReason: 'kuromoji-kana-boundary-neutralised',
        sourceSpanGrammarBoundary: false,
        sourceSpanGrammarBoundaryBefore: Boolean(first.sourceSpanGrammarBoundaryBefore),
        tokenizationRoleBoundaryBefore: Boolean(first.tokenizationRoleBoundaryBefore),
        reviewedLexicalBoundaryBefore: Boolean(first.reviewedLexicalBoundaryBefore)
    }, {
        annotations: ['sourceSpanReconciled', 'sourceSpanReconciliationReason'],
        evidenceSource: 'source-span-reconciliation', semanticRole: 'token-boundary-repair'
    });
}

function shouldNeutralizeKanaBoundary(left, right) {
    if (!left || !right || !sourceTokensAreContiguous(left, right)) return false;
    if (!isKanaSurface(left.surface_form) || !isKanaSurface(right.surface_form)) return false;
    if (left.sourceSpanGrammarBoundary || right.sourceSpanGrammarBoundary || right.sourceSpanGrammarBoundaryBefore) return false;

    // Established morphology remains intact. Source-span reconciliation exists to neutralise
    // unreliable lexical/particle boundaries, not to replace the conjugation pipeline.
    if (right.pos === '助動詞' || left.pos === '助動詞') return false;
    if (right.pos === '助詞' && right.pos_detail_1 === '格助詞' && (right.surface_form === 'を' || right.surface_form === 'へ')) return false;
    if (isTeDeMorphologicalConnector(left) || isTeDeMorphologicalConnector(right)) return false;
    if ((right.pos_detail_1 === '接尾' || right.pos === '接尾詞')
        && (left.pos === '動詞' || left.pos === '形容詞' || left.pos === '助動詞')) return false;

    if (right.pos === '名詞' && right.pos_detail_1 === '非自立') return true;
    if (isParticle(left) || isParticle(right) || isNominalizer(left) || isNominalizer(right)) return true;
    return false;
}

function findOrthographicKatakanaNoCandidate(sourceSpanCandidates, token) {
    if (!token || String(token.surface_form || '') !== 'ノ') return null;
    if (!Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return null;
    return (sourceSpanCandidates || []).find(candidate => candidate?.category === 'grammar'
        && candidate?.kind === 'orthographic-katakana-no'
        && candidate?.sourceStart === token.sourceStart
        && candidate?.sourceEnd === token.sourceEnd) || null;
}

function hasStrongerLexicalSpanAcrossToken(sourceSpanCandidates, token) {
    if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return false;
    const lexicalCategories = new Set(['lexical', 'name', 'title', 'contextual']);
    return (sourceSpanCandidates || []).some(candidate => lexicalCategories.has(candidate?.category)
        && Number.isInteger(candidate?.sourceStart)
        && Number.isInteger(candidate?.sourceEnd)
        && candidate.sourceStart <= token.sourceStart
        && candidate.sourceEnd >= token.sourceEnd
        && (candidate.sourceStart < token.sourceStart || candidate.sourceEnd > token.sourceEnd));
}

/** @param {CJ2RToken[]} tokens @param {string} sourceText @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function reconcileKanaSourceTokenBoundaries(tokens, sourceText, sourceSpanCandidates = []) {
    const working = attachSourceTokenSpans(tokens, sourceText).map(token => ({ ...token }));
    for (let runStart = 0; runStart < working.length;) {
        if (!isKanaSurface(working[runStart]?.surface_form) || working[runStart]?.canonicalBoundary) { runStart += 1; continue; }
        let runEnd = runStart;
        while (runEnd + 1 < working.length
            && isKanaSurface(working[runEnd + 1]?.surface_form)
            && !working[runEnd + 1]?.canonicalBoundary
            && sourceTokensAreContiguous(working[runEnd], working[runEnd + 1])) runEnd += 1;

        const runTokens = working.slice(runStart, runEnd + 1);
        const runSurface = runTokens.map(token => String(token.surface_form || '')).join('');
        if ([...kanaCommonWordFragmentHonorificReadings.keys()].some(suffix => runSurface.endsWith(suffix))) {
            runStart = runEnd + 1;
            continue;
        }
        const lexicalSpan = getKanaRunLexicalReadingSpan(runTokens);
        for (let index = runStart; index <= runEnd; index += 1) {
            const orthographicNoCandidate = findOrthographicKatakanaNoCandidate(sourceSpanCandidates, working[index]);
            if (orthographicNoCandidate && !hasStrongerLexicalSpanAcrossToken(sourceSpanCandidates, working[index])) {
                working[index] = {
                    ...working[index],
                    pos: '助詞',
                    pos_detail_1: '格助詞',
                    pos_detail_2: '一般',
                    pos_detail_3: '*',
                    basic_form: 'の',
                    reading: 'ノ',
                    pronunciation: 'ノ',
                    orthographicParticleInferred: true,
                    orthographicParticleCanonicalSurface: 'の',
                    orthographicParticleEvidenceSource: orthographicNoCandidate.evidenceSource,
                    orthographicParticleReviewRequired: Boolean(orthographicNoCandidate.reviewRequired)
                };
            }
            if (!isStrongKanaGrammarToken(working, index, runStart, runEnd, lexicalSpan, sourceSpanCandidates)) continue;
            working[index].sourceSpanGrammarBoundary = true;
            working[index].sourceSpanGrammarBoundaryBefore = true;
            working[index].sourceSpanReconciliationReason = 'syntactically-supported-grammar-boundary';
            if (index + 1 <= runEnd) working[index + 1].sourceSpanGrammarBoundaryBefore = true;
        }

        const reconciled = [];
        let members = [working[runStart]];
        for (let index = runStart + 1; index <= runEnd; index += 1) {
            const current = working[index];
            const previous = members[members.length - 1];
            if (shouldNeutralizeKanaBoundary(previous, current)) members.push(current);
            else {
                reconciled.push(members.length > 1 ? makeBoundaryNeutralKanaToken(members) : members[0]);
                members = [current];
            }
        }
        reconciled.push(members.length > 1 ? makeBoundaryNeutralKanaToken(members) : members[0]);
        working.splice(runStart, runEnd - runStart + 1, ...reconciled);
        runStart += reconciled.length;
    }
    return attachSourceTokenSpans(working, sourceText);
}

function mergeKanaLexicalReadingTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const bestMatch = findLongestKanaLexicalReading(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            kanaLexicalSpanMatched: true,
            kanaLexicalSpanReading: bestMatch.reading,
            kanaLexicalSpanEvidenceSurfaces: [...bestMatch.evidence.surfaces],
            kanaLexicalSpanEvidenceStrength: bestMatch.strong ? 'strong' : 'weak'
        }, {
            annotations: ['kanaLexicalSpanMatched', 'kanaLexicalSpanReading', 'kanaLexicalSpanEvidenceSurfaces', 'kanaLexicalSpanEvidenceStrength'],
            evidenceSource: bestMatch.strong ? 'kana-lexical-strong-evidence' : 'kana-lexical-evidence', semanticRole: 'kana-lexical-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function mergeKanaBoundaryPair(left, right) {
    const surface = String(left?.surface_form || '') + String(right?.surface_form || '');
    return makeDerivedSpanToken([left, right], 0, 1, {
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        pos: '名詞',
        pos_detail_1: '一般',
        pos_detail_2: '*',
        pos_detail_3: '*',
        orthographicKanaBoundaryRepaired: true
    }, {
        annotations: ['orthographicKanaBoundaryRepaired'], evidenceSource: 'orthographic-kana-boundary', semanticRole: 'orthographic-kana'
    });
}

function mergeOrthographicKanaBoundaryTokens(tokens) {
    const merged = [];
    const smallKanaStart = /^[ゃゅょぁぃぅぇぉャュョァィゥェォ]/u;
    for (const token of tokens || []) {
        const currentSurface = String(token?.surface_form || '');
        const previous = merged[merged.length - 1];
        const previousSurface = String(previous?.surface_form || '');
        if (hasReviewedLexicalBoundaryBefore(token)) {
            merged.push(token);
            continue;
        }
        if (previous && isKanaSurface(previousSurface) && isKanaSurface(currentSurface) && /[っッ]$/u.test(previousSurface)) {
            merged[merged.length - 1] = mergeKanaBoundaryPair(previous, token);
            continue;
        }
        if (previous && isKanaSurface(previousSurface) && isKanaSurface(currentSurface) && smallKanaStart.test(currentSurface)) {
            const prior = merged[merged.length - 2];
            if (isParticle(previous) && prior && isKanaSurface(prior.surface_form)) {
                merged.splice(merged.length - 2, 2, mergeKanaBoundaryPair(mergeKanaBoundaryPair(prior, previous), token));
            } else {
                merged[merged.length - 1] = mergeKanaBoundaryPair(previous, token);
            }
            continue;
        }
        merged.push(token);
    }
    return merged;
}

function isLatinPassthroughTokenSurface(value) {
    const surface = String(value || '');
    return Boolean(surface) && /^[\p{Script=Latin}\p{Number}'’/@,&#% +_.:;!?=~|-]+$/u.test(surface);
}

function containsLatinOrNumber(value) {
    return /[\p{Script=Latin}\p{Number}]/u.test(String(value || ''));
}

/** @param {CJ2RSourceSpanCandidate|null|undefined} candidate */
function isHighConfidenceSourceSpanAuthorityCandidate(candidate) {
    if (!candidate || candidate.reviewRequired === true) return false;
    if (!Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return false;
    const confidence = candidate.confidence;
    if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0.85) return false;
    if (!candidate.reading && candidate.romaji == null) return false;
    return candidate.category !== 'tokenizer';
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates */
function hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates) {
    return (sourceSpanCandidates || []).some(other =>
        other !== candidate
        && isHighConfidenceSourceSpanAuthorityCandidate(other)
        && other.sourceStart <= candidate.sourceStart
        && other.sourceEnd > candidate.sourceEnd
        && Number(other.confidence || 0) >= Number(candidate.confidence || 0)
    );
}

/** @param {CJ2RSourceSpanCandidate|null|undefined} candidate */
function isImmutableSourceSpanBoundaryAuthorityCandidate(candidate) {
    if (!candidate || !isHighConfidenceSourceSpanAuthorityCandidate(candidate) || candidate.category === 'counter') return false;
    const priority = Number(candidate?.metadata?.priority);
    if (Number.isFinite(priority)) return priority >= 80;
    return candidate.category === 'title' || candidate.category === 'historical';
}

/** @param {CJ2RSourceSpanCandidate} candidate */
function isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate) {
    if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) return false;
    return candidate.kind === 'reviewed-reading'
        || candidate.kind === 'reviewed-name'
        || candidate.category === 'title'
        || candidate.category === 'historical';
}

/** @param {CJ2RSourceSpanCandidate|null|undefined} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function isSourceOrthographyPersonNameHonorificBoundaryCandidate(candidate, sourceSpanCandidates = []) {
    if (!candidate
        || candidate?.metadata?.sourceOrthographyPreserved !== true
        || candidate?.metadata?.sourceOrthographyEvidenceOnlyIntermediate === true
        || !sourceSpanNameCandidateHasPersonRole(candidate)
        || !Number.isInteger(candidate.sourceEnd)) return false;
    const honorificSurfaces = new Set(['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏']);
    return (sourceSpanCandidates || []).some(other =>
        Number.isInteger(other?.sourceStart)
        && other.sourceStart === candidate.sourceEnd
        && honorificSurfaces.has(String(other?.sourceSurface || '')));
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {number} boundary */
function hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, boundary) {
    let ends = false;
    let starts = false;
    for (const candidate of sourceSpanCandidates || []) {
        if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) continue;
        if (candidate.sourceEnd === boundary && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)) ends = true;
        if (candidate.sourceStart === boundary && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates)) starts = true;
        if (ends && starts) return true;
    }
    return false;
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates */
function hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates) {
    return (sourceSpanCandidates || []).some(other =>
        other !== candidate
        && isImmutableSourceSpanBoundaryAuthorityCandidate(other)
        && other.sourceStart < candidate.sourceStart
        && other.sourceEnd >= candidate.sourceEnd
        && Number(other.confidence || 0) >= Number(candidate.confidence || 0)
    );
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {number} sourceBoundary */
function isProtectedImmutableSourceSpanBoundary(sourceSpanCandidates, sourceBoundary) {
    if (!Number.isInteger(sourceBoundary)) return false;
    return (sourceSpanCandidates || []).some(candidate => {
        if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) return false;
        const protectedEnd = candidate.sourceEnd === sourceBoundary
            && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates);
        const protectedStart = candidate.sourceStart === sourceBoundary
            && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates);
        return protectedEnd || protectedStart;
    });
}

function retokenizeSourceAuthoritySegment(token, startCharacter, endCharacter, boundaryBefore = false) {
    const originalSurface = String(token?.surface_form || '');
    const characters = Array.from(originalSurface);
    const start = Math.max(0, Math.min(characters.length, startCharacter));
    const end = Math.max(start, Math.min(characters.length, endCharacter));
    const segmentSurface = characters.slice(start, end).join('');
    if (!segmentSurface) return [];
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(segmentSurface) : [];
    const reconstructed = (retokenized || []).map(item => String(item?.surface_form || '')).join('');
    const usable = retokenized?.length && reconstructed === segmentSurface ? retokenized : null;
    const originalPosition = Number(token?.word_position || 0);
    if (!usable) {
        const kanaSafe = isKanaSurface(segmentSurface);
        return [makeDerivedSubspanToken(token, start, end, {
            surface_form: segmentSurface,
            basic_form: segmentSurface,
            reading: kanaSafe ? segmentSurface : '*',
            pronunciation: kanaSafe ? segmentSurface : '*',
            word_position: originalPosition > 0 ? originalPosition + start : originalPosition,
            ...(boundaryBefore ? {
                reviewedLexicalBoundaryBefore: true,
                reviewedLexicalBoundarySource: 'source-span-authority-boundary-repair'
            } : {})
        }, {
            annotations: [], evidenceSource: 'source-span-authority-boundary-repair', semanticRole: 'token-boundary-repair'
        })];
    }
    let consumed = 0;
    return usable.map((item, index) => {
        const itemSurface = String(item?.surface_form || '');
        const itemLength = Array.from(itemSurface).length;
        const derived = makeDerivedSubspanToken(token, start + consumed, start + consumed + itemLength, {
            ...item,
            word_position: originalPosition > 0 ? originalPosition + start + consumed : Number(item?.word_position || 0),
            ...((boundaryBefore && index === 0) ? {
                reviewedLexicalBoundaryBefore: true,
                reviewedLexicalBoundarySource: 'source-span-authority-boundary-repair'
            } : {})
        }, {
            annotations: [], evidenceSource: 'source-span-authority-boundary-repair', semanticRole: 'token-boundary-repair'
        });
        consumed += itemLength;
        return derived;
    });
}

/**
 * Repairs a Kuromoji token only when immutable maintained evidence proves that
 * an authoritative source boundary lies inside it. Candidate discovery remains
 * non-destructive: weak dictionary/kana substrings cannot force a split.
 * @param {CJ2RToken[]} tokens
 * @param {string} sourceText
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates]
 */
function splitTokensAtImmutableSourceAuthorityBoundaries(tokens, sourceText, sourceSpanCandidates = []) {
    const working = attachSourceTokenSpans(tokens, sourceText);
    const output = [];
    for (const token of working || []) {
        if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) {
            output.push(token);
            continue;
        }
        const tokenStart = Number(token.sourceStart);
        const tokenEnd = Number(token.sourceEnd);
        const tokenSurface = String(token.surface_form || '');
        const sourceSurface = String(token.sourceSurface ?? tokenSurface);
        if (sourceSurface !== tokenSurface || tokenEnd <= tokenStart) {
            output.push(token);
            continue;
        }
        const internalBoundaries = new Set();
        for (const candidate of sourceSpanCandidates || []) {
            const sourceOrthographyNameHonorificBoundary = isSourceOrthographyPersonNameHonorificBoundaryCandidate(candidate, sourceSpanCandidates);
            const contextualLocationBoundary = getContextualLocationBoundaryEvidence(candidate, sourceText, tokenEnd);
            if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate) && !sourceOrthographyNameHonorificBoundary && !contextualLocationBoundary) continue;
            // A candidate that reaches across the left or right edge of this token
            // proves an internal boundary. Fully-contained substrings remain
            // non-destructive candidate evidence and cannot segment a token alone.
            if (candidate.sourceStart <= tokenStart
                && candidate.sourceEnd > tokenStart
                && candidate.sourceEnd < tokenEnd
                && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)
                && (sourceOrthographyNameHonorificBoundary
                    || contextualLocationBoundary
                    || isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate)
                    || hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, candidate.sourceEnd))) {
                internalBoundaries.add(Number(candidate.sourceEnd));
            }
            if (candidate.sourceStart > tokenStart
                && candidate.sourceStart < tokenEnd
                && candidate.sourceEnd >= tokenEnd
                && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates)
                && (sourceOrthographyNameHonorificBoundary
                    || contextualLocationBoundary
                    || isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate)
                    || hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, candidate.sourceStart))) {
                internalBoundaries.add(Number(candidate.sourceStart));
            }
        }
        if (!internalBoundaries.size) {
            output.push(token);
            continue;
        }
        const boundaries = [tokenStart, ...[...internalBoundaries].sort((a, b) => a - b), tokenEnd];
        const sourceCharacters = Array.from(sourceSurface);
        const characterOffsetForSourceBoundary = boundary => {
            const relativeUnits = boundary - tokenStart;
            return Array.from(sourceSurface.slice(0, relativeUnits)).length;
        };
        for (let index = 0; index < boundaries.length - 1; index += 1) {
            const segmentStart = characterOffsetForSourceBoundary(boundaries[index]);
            const segmentEnd = characterOffsetForSourceBoundary(boundaries[index + 1]);
            const boundaryBefore = index > 0 && isProtectedImmutableSourceSpanBoundary(sourceSpanCandidates, boundaries[index]);
            output.push(...retokenizeSourceAuthoritySegment(token, segmentStart, segmentEnd, boundaryBefore));
        }
        if (!sourceCharacters.length) output.push(token);
    }
    return attachSourceTokenSpans(output, sourceText).map(token => {
        const historicalInflectionEvidence = getHistoricalInflectionBoundaryEvidence(token, sourceSpanCandidates);
        if (!historicalInflectionEvidence || !token.reviewedLexicalBoundaryBefore) return token;
        const adjusted = {
            ...token,
            reviewedLexicalBoundaryBefore: false,
            sourceAuthorityBoundaryBefore: true,
            sourceAuthorityBoundarySource: 'historical-kana-inflection'
        };
        delete adjusted.reviewedLexicalBoundarySource;
        return adjusted;
    });
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {number} sourceEnd */
function isProtectedLatinPassthroughSourceBoundary(sourceSpanCandidates, sourceEnd) {
    if (!Number.isInteger(sourceEnd)) return false;
    return (sourceSpanCandidates || []).some(candidate =>
        isHighConfidenceSourceSpanAuthorityCandidate(candidate)
        && candidate.sourceEnd === sourceEnd
        && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)
    );
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeLatinPassthroughTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const surface = String(token?.surface_form || '');
        const punctuationLead = /^[-–—]$/u.test(surface) && containsLatinOrNumber(tokens[index + 1]?.surface_form || '');
        if (!isLatinPassthroughTokenSurface(surface) || (!containsLatinOrNumber(surface) && !punctuationLead)) {
            merged.push(token);
            continue;
        }

        let end = index;
        let span = surface;
        let hasContent = containsLatinOrNumber(surface);
        while (end + 1 < tokens.length) {
            const currentSourceEnd = Number(tokens[end]?.sourceEnd);
            // Latin/source passthrough is a transport mechanism, not semantic authority.
            // Once an immutable high-confidence source candidate ends at the current
            // boundary, do not absorb following punctuation/Latin material and erase
            // the exact token boundary later evidence-selection stages require. A
            // stronger enclosing candidate may continue through the boundary.
            if (isProtectedLatinPassthroughSourceBoundary(sourceSpanCandidates, currentSourceEnd)) break;
            const next = tokens[end + 1];
            if (hasReviewedLexicalBoundaryBefore(next)) break;
            const nextSurface = String(next?.surface_form || '');
            if (next?.pos === '記号' && next?.pos_detail_1 === '空白') {
                const afterSpace = tokens[end + 2];
                if (!afterSpace || !isLatinPassthroughTokenSurface(afterSpace.surface_form) || !containsLatinOrNumber(afterSpace.surface_form)) break;
                span += nextSurface + String(afterSpace.surface_form || '');
                hasContent = true;
                end += 2;
                continue;
            }
            // An explicitly reconstructed ASCII wave is a true segment boundary. Do not let
            // Latin/source passthrough absorb it, or later scoped title evidence can lose the
            // source-span boundary needed to resolve each neighbouring title independently.
            if (next?.hardBoundaryReconstructed && nextSurface === '~') break;
            if (!isLatinPassthroughTokenSurface(nextSurface)) break;
            const sourceGap = sourceTokensAreContiguous(tokens[end], next) ? '' : String(next?.sourceGapBefore || '');
            if (sourceGap && !/^[\s\u3000]+$/u.test(sourceGap)) break;
            span += sourceGap + nextSurface;
            if (containsLatinOrNumber(nextSurface)) hasContent = true;
            end += 1;
        }
        if (!hasContent) { merged.push(token); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, end, {
            surface_form: span,
            latinPassthroughMatched: true,
            latinPassthroughOutput: span,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*'
        }, {
            annotations: ['latinPassthroughMatched', 'latinPassthroughOutput'], evidenceSource: 'latin-source-passthrough', semanticRole: 'latin-passthrough', allowWhitespaceGaps: true
        }));
        index = end;
    }
    return merged;
}

function mergeReviewedNameHonorificTokens(tokens) {
    const merged = [];
    const honorifics = new Set(['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏']);
    for (let index = 0; index < tokens.length; index += 1) {
        const previous = merged[merged.length - 1];
        if (!previous?.reviewedProperNameSpanMatched) {
            merged.push(tokens[index]);
            continue;
        }
        let candidate = '';
        let endMatch = -1;
        for (let end = index; end < Math.min(tokens.length, index + 4); end += 1) {
            const token = tokens[end];
            if (crossesReviewedLexicalBoundary(tokens, index, end)) break;
            if (!token || token.pos === '記号') break;
            candidate += String(token.surface_form || '');
            if (honorifics.has(candidate)) endMatch = end;
            if (![...honorifics].some(surface => surface.startsWith(candidate))) break;
        }
        if (endMatch < index) {
            merged.push(tokens[index]);
            continue;
        }
        const surface = tokens.slice(index, endMatch + 1).map(token => String(token.surface_form || '')).join('');
        const honorificReading = getReviewedNameHonorificReading(surface);
        merged.push(makeDerivedSpanToken(tokens, index, endMatch, {
            surface_form: surface,
            reading: honorificReading || surface,
            pronunciation: honorificReading || surface,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading || surface
        }, {
            annotations: ['reviewedNameHonorificMatched', 'reviewedNameHonorificReading'], evidenceSource: 'reviewed-name-honorific', semanticRole: 'name-honorific'
        }));
        index = endMatch;
    }
    return merged;
}

function hasWholeNameStructureEvidence(surface) {
    const originalSurface = String(surface || '').replace(/\s+/gu, ' ').trim();
    if (!originalSurface) return false;
    const normalizedSurface = normalizeKanjiForLookup(originalSurface, { names: true });
    if (runtimeState.reviewedProperNameSpanDictionary.has(originalSurface)
        || runtimeState.reviewedProperNameSpanDictionary.has(normalizedSurface)) return true;
    return Boolean(runtimeState.properNounDictionary.get(originalSurface)?.size
        || runtimeState.properNounDictionary.get(normalizedSurface)?.size);
}

/** @param {CJ2RToken} prefixToken @param {CJ2RToken} nameToken @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function hasReviewedPrefixNameStructureEvidence(prefixToken, nameToken, sourceSpanCandidates = []) {
    if (!prefixToken || !nameToken) return false;
    const surface = `${String(prefixToken.surface_form || '')}${String(nameToken.surface_form || '')}`;
    if (hasWholeNameStructureEvidence(surface)) return true;
    if (!Number.isInteger(prefixToken.sourceStart) || !Number.isInteger(nameToken.sourceEnd)) return false;
    return (sourceSpanCandidates || []).some(candidate => {
        if (!candidate || candidate.reviewRequired === true
            || candidate.sourceStart !== prefixToken.sourceStart
            || candidate.sourceEnd !== nameToken.sourceEnd) return false;
        if (candidate.kind === 'common-word' || candidate.kind === 'common-word-inflection' || candidate.category === 'title') return true;
        if (candidate.category === 'loanword' && candidate.romaji != null) return true;
        return candidate.category === 'name' && candidate.evidenceSource !== 'kuromoji-exact-dictionary';
    });
}

function sourceSpanNameCandidateHasPersonRole(candidate) {
    if (candidate?.category !== 'name' || candidate?.semanticRole !== 'proper-name') return false;
    const personCategories = new Set(['fam', 'per', 'person', 'char']);
    return (candidate.alternatives || []).some(alternative =>
        (alternative?.categories || []).some(category => personCategories.has(String(category || ''))));
}

function getSourceSpanLocationNameReading(candidate) {
    if (candidate?.category !== 'name'
        || candidate?.kind !== 'proper-noun'
        || candidate?.semanticRole !== 'proper-name'
        || candidate?.reviewRequired === true
        || candidate?.metadata?.sourceOrthographyNameVariant !== true) return null;
    const locationReadings = new Set((candidate.alternatives || [])
        .filter(alternative => (alternative?.categories || []).some(category => String(category || '') === 'loc'))
        .map(alternative => normalizeKanaReading(alternative?.reading || ''))
        .filter(Boolean));
    if (locationReadings.size !== 1) return null;
    const reading = [...locationReadings][0];
    const selectedReading = normalizeKanaReading(candidate.reading || '');
    if (selectedReading && selectedReading !== reading) return null;
    return reading;
}

function getContextualLocationSuffixRoleEvidence(candidate, sourceText) {
    const sourceNameReading = getSourceSpanLocationNameReading(candidate);
    const canonicalSurface = String(candidate?.lookupSurface || '');
    if (!sourceNameReading || !canonicalSurface || !runtimeState.tokenizer
        || !Number.isInteger(candidate?.sourceStart) || !Number.isInteger(candidate?.sourceEnd)) return null;
    const source = String(sourceText || '');
    const canonicalizedSource = source.slice(0, candidate.sourceStart) + canonicalSurface + source.slice(candidate.sourceEnd);
    const canonicalNameEnd = candidate.sourceStart + canonicalSurface.length;
    const canonicalTokens = attachSourceTokenSpans(stabilizeHardBoundaryTokenization(runtimeState.tokenizer.tokenize(canonicalizedSource) || [], canonicalizedSource), canonicalizedSource);
    const nameIndex = canonicalTokens.findIndex(token => Number(token?.sourceStart) === Number(candidate.sourceStart)
        && Number(token?.sourceEnd) === canonicalNameEnd
        && String(token?.surface_form || '') === canonicalSurface);
    if (nameIndex < 0 || nameIndex >= canonicalTokens.length - 1) return null;
    const nameToken = canonicalTokens[nameIndex];
    const suffixToken = canonicalTokens[nameIndex + 1];
    if (nameToken.pos !== '名詞' || nameToken.pos_detail_1 !== '固有名詞' || nameToken.pos_detail_2 !== '地域') return null;
    if (suffixToken.pos !== '名詞' || suffixToken.pos_detail_1 !== '接尾' || suffixToken.pos_detail_2 !== '地域'
        || Number(suffixToken.sourceStart) !== canonicalNameEnd) return null;
    const canonicalNameReading = normalizeKanaReading(getKuromojiDictionaryReading(nameToken) || nameToken.reading || nameToken.pronunciation || '');
    if (!canonicalNameReading || canonicalNameReading !== sourceNameReading) return null;
    const suffixReading = normalizeKanaReading(getKuromojiDictionaryReading(suffixToken) || suffixToken.reading || suffixToken.pronunciation || '');
    const suffixSurface = String(suffixToken.surface_form || '');
    if (!suffixReading || !suffixSurface || source.slice(candidate.sourceEnd, candidate.sourceEnd + suffixSurface.length) !== suffixSurface) return null;
    return { canonicalSurface, nameReading: sourceNameReading, suffixReading, suffixSurface, suffixToken };
}

function getContextualLocationBoundaryEvidence(candidate, sourceText, tokenEnd) {
    if (!candidate || !Number.isInteger(candidate.sourceEnd) || !Number.isInteger(tokenEnd) || candidate.sourceEnd >= tokenEnd) return null;
    return getContextualLocationSuffixRoleEvidence(candidate, sourceText);
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markContextualLocationSuffixNameRoles(tokens, sourceSpanCandidates = [], sourceText = '') {
    const working = (tokens || []).map(token => ({ ...token }));
    const candidates = (sourceSpanCandidates || []).filter(candidate => Boolean(getSourceSpanLocationNameReading(candidate)));
    for (const candidate of candidates) {
        if (!Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) continue;
        const suffixIndex = working.findIndex(token => Number(token?.sourceStart) === Number(candidate.sourceEnd));
        if (suffixIndex < 0) continue;
        const suffix = working[suffixIndex];
        const role = getContextualLocationSuffixRoleEvidence(candidate, sourceText);
        if (!role || String(suffix?.surface_form || '') !== role.suffixSurface) continue;
        const startIndex = working.findIndex(token => Number(token?.sourceStart) === Number(candidate.sourceStart));
        if (startIndex < 0 || startIndex >= suffixIndex) continue;
        let endIndex = -1;
        for (let index = startIndex; index < suffixIndex; index += 1) {
            const token = working[index];
            if (!token || !Number.isInteger(token.sourceEnd)) break;
            if (index > startIndex && Number(working[index - 1]?.sourceEnd) !== Number(token.sourceStart)) break;
            if (Number(token.sourceEnd) === Number(candidate.sourceEnd)) { endIndex = index; break; }
            if (Number(token.sourceEnd) > Number(candidate.sourceEnd)) break;
        }
        if (endIndex < startIndex) continue;
        const members = working.slice(startIndex, endIndex + 1);
        if (members.map(token => String(token.surface_form || '')).join('') !== String(candidate.sourceSurface || '')) continue;
        const locationToken = makeDerivedSpanToken(working, startIndex, endIndex, {
            surface_form: String(candidate.sourceSurface || ''),
            reading: role.nameReading,
            pronunciation: role.nameReading,
            pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '一般',
            locationSuffixRoleMatched: true,
            locationSuffixCandidateSurface: role.canonicalSurface,
            locationSuffixSurface: String(suffix.surface_form || '')
        }, {
            annotations: ['locationSuffixRoleMatched'],
            evidenceSource: 'source-orthography-location-suffix-context',
            semanticRole: 'proper-name',
            confidence: Number(candidate.confidence || 0),
            reviewRequired: false
        });
        const suffixToken = {
            ...suffix,
            pos: role.suffixToken.pos,
            pos_detail_1: role.suffixToken.pos_detail_1,
            pos_detail_2: role.suffixToken.pos_detail_2,
            pos_detail_3: role.suffixToken.pos_detail_3,
            basic_form: role.suffixToken.basic_form,
            reading: role.suffixReading,
            pronunciation: role.suffixToken.pronunciation || role.suffixToken.reading || role.suffixReading,
            locationSuffixContextMatched: true
        };
        working.splice(startIndex, endIndex - startIndex + 1, locationToken);
        const adjustedSuffixIndex = startIndex + 1;
        if (working[adjustedSuffixIndex]?.sourceStart === suffixToken.sourceStart) working[adjustedSuffixIndex] = suffixToken;
    }
    return working;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markSwallowedNameHonorificBoundaryConflicts(tokens, sourceSpanCandidates = []) {
    const marked = tokens || [];
    const honorificSurfaces = new Set(['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏']);
    const candidates = sourceSpanCandidates || [];
    for (const nameCandidate of candidates) {
        if (!sourceSpanNameCandidateHasPersonRole(nameCandidate)
            || !Number.isInteger(nameCandidate.sourceStart)
            || !Number.isInteger(nameCandidate.sourceEnd)) continue;
        const honorific = candidates.find(candidate =>
            Number.isInteger(candidate?.sourceStart)
            && Number.isInteger(candidate?.sourceEnd)
            && candidate.sourceStart === nameCandidate.sourceEnd
            && honorificSurfaces.has(String(candidate.sourceSurface || '')));
        if (!honorific) continue;
        const boundaryPreserved = marked.some(token => token?.sourceEnd === nameCandidate.sourceEnd)
            && marked.some(token => token?.sourceStart === nameCandidate.sourceEnd);
        if (boundaryPreserved) continue;
        const owner = marked.find(token => Number.isInteger(token?.sourceStart)
            && Number.isInteger(token?.sourceEnd)
            && Number(token.sourceStart) === nameCandidate.sourceStart
            && Number(token.sourceEnd) > nameCandidate.sourceEnd);
        if (!owner) continue;
        owner.nameContextAmbiguous = true;
        owner.nameContextBase = String(nameCandidate.sourceSurface || '');
        owner.nameContextStructure = 'proper-name-honorific-boundary-conflict';
        owner.nameContextCandidateSurface = String(nameCandidate.lookupSurface || nameCandidate.sourceSurface || '');
        owner.nameContextSourceStart = nameCandidate.sourceStart;
        owner.nameContextSourceEnd = honorific.sourceEnd;
        owner.nameContextSourceSurface = `${String(nameCandidate.sourceSurface || '')}${String(honorific.sourceSurface || '')}`;
    }
    return marked;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markAttachedNameHonorificRoles(tokens, sourceSpanCandidates = []) {
    const marked = (tokens || []).map(token => ({ ...token }));
    for (let index = 0; index < marked.length - 1; index += 1) {
        const token = marked[index];
        const honorific = marked[index + 1];
        const honorificReading = getReviewedNameHonorificReading(honorific?.surface_form);
        if (!token || !honorific || !honorificReading
            || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)
            || !Number.isInteger(honorific.sourceStart) || token.sourceEnd !== honorific.sourceStart) continue;
        const nameCandidate = (sourceSpanCandidates || []).find(candidate =>
            sourceSpanNameCandidateHasPersonRole(candidate)
            && candidate.sourceStart === token.sourceStart
            && candidate.sourceEnd === token.sourceEnd);
        if (!nameCandidate) continue;
        token.nameHonorificRoleMatched = true;
        token.nameHonorificCandidateSurface = String(nameCandidate.lookupSurface || nameCandidate.sourceSurface || token.surface_form || '');
        honorific.reviewedNameHonorificMatched = true;
        honorific.reviewedNameHonorificReading = honorificReading;
    }
    return marked;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markUnreviewedNameContextTokens(tokens, sourceSpanCandidates = [], sourceText = '') {
    const locationRoleTokens = markContextualLocationSuffixNameRoles(tokens, sourceSpanCandidates, sourceText);
    const marked = markSwallowedNameHonorificBoundaryConflicts(locationRoleTokens, sourceSpanCandidates);
    for (let index = 0; index < marked.length; index += 1) {
        const surname = marked[index];
        if (!isPersonNameToken(surname) || surname.pos_detail_3 !== '姓') continue;
        let nextIndex = index + 1;
        let sawWhitespace = false;
        while (nextIndex < marked.length && marked[nextIndex]?.pos === '記号' && marked[nextIndex]?.pos_detail_1 === '空白') {
            sawWhitespace = true;
            nextIndex += 1;
        }
        const candidate = marked[nextIndex];
        if (!sawWhitespace || !candidate || !containsHan(candidate.surface_form) || isProperNounToken(candidate)) continue;
        candidate.nameContextAmbiguous = true;
        candidate.nameContextSurname = surname.surface_form;
    }

    // A nominal prefix followed by a proper-name token can be a destructive
    // analyser split. Keep it reviewable unless independent whole-span evidence
    // establishes the combined lexical or name structure.
    for (let index = 1; index < marked.length; index += 1) {
        const candidate = marked[index];
        const prefix = marked[index - 1];
        if (!candidate || !prefix
            || prefix.pos !== '接頭詞'
            || prefix.pos_detail_1 !== '名詞接続'
            || !isProperNounToken(candidate)) continue;
        if (hasReviewedPrefixNameStructureEvidence(prefix, candidate, sourceSpanCandidates)) continue;
        candidate.nameContextAmbiguous = true;
        candidate.nameContextBase = String(prefix.surface_form || '');
        candidate.nameContextStructure = 'nominal-prefix-proper-name-boundary';
    }

    // A proper-name token followed directly by a common name-forming generic can
    // create a presentation boundary that Kuromoji alone cannot authorise. Exact
    // maintained name evidence settles the structure; otherwise retain the current
    // output while making the boundary reviewable rather than guessing a space.
    const structuralNameSuffixes = new Set([
        '駅','空港','大学','都','道','府','県','市','区','町','村','山','川','河','湖','島',
        '線','港','公園','城','寺','神社','病院','学校','高校','中学校','小学校','研究所',
        '支店','本店','本社','支社'
    ]);
    for (let index = 1; index < marked.length; index += 1) {
        const candidate = marked[index];
        const surface = String(candidate?.surface_form || '');
        if (!candidate || !structuralNameSuffixes.has(surface) || candidate.reviewedProperNameSpanMatched) continue;
        const previous = marked[index - 1];
        if (!previous || previous.pos === '記号' || !(isProperNounToken(previous) || previous.reviewedProperNameSpanMatched || previous.variantProperNounMatched)) continue;

        let wholeNameAttested = false;
        let candidateSurface = surface;
        for (let cursor = index - 1, steps = 0; cursor >= 0 && steps < 8; cursor -= 1, steps += 1) {
            const token = marked[cursor];
            if (!token || token.pos === '記号' || isParticle(token) || token.pos === '助動詞') break;
            candidateSurface = String(token.surface_form || '') + candidateSurface;
            if (hasWholeNameStructureEvidence(candidateSurface)) {
                wholeNameAttested = true;
                break;
            }
        }
        if (wholeNameAttested) continue;
        candidate.nameContextAmbiguous = true;
        candidate.nameContextBase = String(previous.surface_form || '');
        candidate.nameContextStructure = 'proper-name-generic-boundary';
    }
    return marked;
}

function mergeDesiderativeGaruTokens(tokens) {
    const output = [];
    const joinRange = (start, end) => {
        const slice = tokens.slice(start, end + 1);
        return makeDerivedSpanToken(tokens, start, end, {
            surface_form: slice.map(token => String(token?.surface_form || '')).join(''),
            reading: slice.map(token => String(token?.reading || token?.surface_form || '')).join(''),
            pronunciation: slice.map(token => String(token?.pronunciation || token?.reading || token?.surface_form || '')).join(''),
            pos: '動詞',
            pos_detail_1: '自立',
            pos_detail_2: '*',
            desiderativeGaruMatched: true
        }, {
            annotations: ['desiderativeGaruMatched'], evidenceSource: 'productive-desiderative-garu', semanticRole: 'verbal-morphology'
        });
    };
    for (let index = 0; index < tokens.length; index += 1) {
        const stem = tokens[index];
        const tai = tokens[index + 1];
        const garu = tokens[index + 2];
        const taiConnector = tai && tokenBasicForm(tai) === 'たい' && String(tai.conjugated_form || '') === 'ガル接続';
        const garuSuffix = garu && tokenBasicForm(garu) === 'がる' && garu.pos === '動詞' && garu.pos_detail_1 === '接尾';
        const stemLike = stem && (stem.pos === '動詞' || stem.pos === '助動詞' || stem.pos === '形容詞'
            || (taiConnector && garuSuffix && stem.pos === '名詞' && stem.pos_detail_1 !== '固有名詞'));
        const misparsedTte = tokens[index + 3];
        const misparsedPastTa = stem?.pos === '動詞'
            && String(stem.conjugated_form || '').includes('連用')
            && String(tai?.surface_form || '') === 'た'
            && tokenBasicForm(tai) === 'た'
            && tai?.pos === '助動詞'
            && String(tai.conjugated_type || '') === '特殊・タ';
        const misparsedGaruChain = misparsedPastTa
            && String(garu?.surface_form || '') === 'が'
            && garu?.pos === '助詞'
            && String(misparsedTte?.surface_form || '') === 'って'
            && misparsedTte?.pos === '助詞'
            && !hasReviewedLexicalBoundaryBefore(tai)
            && !hasReviewedLexicalBoundaryBefore(garu)
            && !hasReviewedLexicalBoundaryBefore(misparsedTte);
        if (misparsedGaruChain) {
            { const joined = joinRange(index, index + 3); joined.desiderativeGaruRecoveredFromSurface = true; if (joined.semanticAnnotationOwnership?.[0]) joined.semanticAnnotationOwnership[0].annotations.push('desiderativeGaruRecoveredFromSurface'); output.push(joined); }
            index += 3;
            continue;
        }
        if (!stemLike || !taiConnector || !garuSuffix || hasReviewedLexicalBoundaryBefore(tai) || hasReviewedLexicalBoundaryBefore(garu)) {
            output.push(stem);
            continue;
        }
        let end = index + 2;
        if (String(garu.surface_form || '') === 'がっ') {
            const continuation = tokens[end + 1];
            if (continuation && !hasReviewedLexicalBoundaryBefore(continuation)) {
                const contracted = continuation.pos === '動詞'
                    && continuation.pos_detail_1 === '非自立'
                    && runtimeState.contractedAuxiliaryBasicForms.has(tokenBasicForm(continuation));
                if (contracted || String(continuation.surface_form || '') === 'て' || tokenBasicForm(continuation) === 'た') end += 1;
            }
            const mergedContracted = end === index + 3
                && runtimeState.contractedAuxiliaryBasicForms.has(tokenBasicForm(tokens[end]));
            if (mergedContracted) {
                const nominalizer = tokens[end + 1];
                const copula = tokens[end + 2];
                if (String(nominalizer?.surface_form || '') === 'ん' && tokenBasicForm(copula) === 'だ'
                    && !hasReviewedLexicalBoundaryBefore(nominalizer) && !hasReviewedLexicalBoundaryBefore(copula)) end += 2;
            }
        }
        output.push(joinRange(index, end));
        index = end;
    }
    return output;
}

function sourceSpanCandidateSupportsInflectionalStem(sourceSpanCandidates, token) {
    if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return false;
    const tokenReading = normalizeKanaReading(token.reading || token.pronunciation || '');
    const sourceCandidateSupport = (sourceSpanCandidates || []).some(candidate => {
        if (candidate?.sourceStart !== token.sourceStart || candidate?.sourceEnd !== token.sourceEnd) return false;
        if (candidate.reviewRequired === true) return false;
        const candidateReading = normalizeKanaReading(candidate.reading || '');
        if (tokenReading && candidateReading && tokenReading !== candidateReading) return false;
        if (candidate.kind === 'common-word-inflection' && candidate.semanticRole === 'lexical-inflection') return true;
        if (candidate.kind !== 'kuromoji-exact-dictionary-span') return false;
        return (candidate.alternatives || []).some(alternative => alternative?.pos === '動詞' || alternative?.pos === '形容詞');
    });
    if (sourceCandidateSupport) return true;
    if (!tokenReading) return false;
    // Some single-Kanji stems (for example 見 in 見て) have multiple dictionary readings,
    // so source-span discovery intentionally declines to emit one selected candidate.
    // The preserved token reading can still be checked against the raw dictionary without
    // trusting the injected POS: attachment is licensed only when that exact reading has
    // an attested verb/adjective entry.
    return getKuromojiExactDictionaryCandidates(String(token.surface_form || '')).some(candidate =>
        (candidate?.pos === '動詞' || candidate?.pos === '形容詞')
        && normalizeKanaReading(candidate?.reading || '') === tokenReading);
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeCasualSpeechTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    const joinToken = (left, right) => makeDerivedSpanToken([left, right], 0, 1, {
        surface_form: String(left.surface_form || '') + String(right.surface_form || ''),
        reading: String(left.reading || left.surface_form || '') + String(right.reading || right.surface_form || ''),
        pronunciation: String(left.pronunciation || left.reading || left.surface_form || '') + String(right.pronunciation || right.reading || right.surface_form || '')
    }, {
        evidenceSource: 'productive-casual-morphology', semanticRole: 'verbal-morphology'
    });
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const previous = merged[merged.length - 1];
        const next = tokens[index + 1];
        const nextNext = tokens[index + 2];
        const sourceEvidenceStem = Boolean(previous && sourceSpanCandidateSupportsInflectionalStem(sourceSpanCandidates, previous));
        const verbLikePrevious = previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞' || previous.pos_detail_1 === '動詞' || previous.pos_detail_1 === '形容詞' || sourceEvidenceStem);
        const contractedAuxiliary = token?.pos === '動詞'
            && token?.pos_detail_1 === '非自立'
            && runtimeState.contractedAuxiliaryBasicForms.has(tokenBasicForm(token));
        if (previous && !hasReviewedLexicalBoundaryBefore(token) && contractedAuxiliary && previous.pos !== '記号' && !isParticle(previous)) {
            merged[merged.length - 1] = joinToken(previous, token);
            continue;
        }
        if (previous && !hasReviewedLexicalBoundaryBefore(token) && verbLikePrevious && runtimeState.conjugationJoinEndings.has(token.surface_form)) {
            merged[merged.length - 1] = joinToken(previous, token);
            continue;
        }
        if (previous && !hasReviewedLexicalBoundaryBefore(token) && !hasReviewedLexicalBoundaryBefore(next) && !hasReviewedLexicalBoundaryBefore(nextNext)
            && previous.pos === '動詞' && token.surface_form === 'て' && next?.surface_form === 'ん' && nextNext?.surface_form === 'だ') {
            merged[merged.length - 1] = joinToken(joinToken(joinToken(previous, token), next), nextNext);
            index += 2;
            continue;
        }
        merged.push(token);
    }
    return merged;
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {CJ2RToken} startToken @param {CJ2RToken} endToken */
function sourceSpanGrammarCandidateCoversRange(sourceSpanCandidates, startToken, endToken) {
    if (!startToken || !endToken || !Number.isInteger(startToken.sourceStart) || !Number.isInteger(endToken.sourceEnd)) return false;
    const startSource = Number(startToken.sourceStart);
    const endSource = Number(endToken.sourceEnd);
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'grammar'
        && candidate?.kind === 'grammatical-expression'
        && candidate?.evidenceSource === 'grammatical-expression-evidence'
        && candidate?.sourceStart === startSource
        && candidate?.sourceEnd >= endSource);
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {CJ2RToken} startToken @param {CJ2RToken} endToken @param {string} surface */
function sourceSpanGrammarCandidateMatchesRange(sourceSpanCandidates, startToken, endToken, surface) {
    if (!startToken || !endToken || !Number.isInteger(startToken.sourceStart) || !Number.isInteger(endToken.sourceEnd)) return false;
    const startSource = Number(startToken.sourceStart);
    const endSource = Number(endToken.sourceEnd);
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'grammar'
        && candidate?.kind === 'grammatical-expression'
        && candidate?.evidenceSource === 'grammatical-expression-evidence'
        && candidate?.sourceStart === startSource
        && candidate?.sourceEnd === endSource
        && candidate?.sourceSurface === surface);
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestGrammaticalExpression(tokens, startIndex, sourceSpanCandidates = []) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token) break;
        if (token.pos === '記号' && !sourceSpanGrammarCandidateCoversRange(sourceSpanCandidates, tokens[startIndex], token)) break;
        candidateSurface += token.surface_form;
        if (!runtimeState.grammaticalExpressionPrefixes.has(candidateSurface)) break;
        const value = runtimeState.grammaticalExpressionDictionary.get(candidateSurface);
        if (value && (token.pos !== '記号' || sourceSpanGrammarCandidateMatchesRange(sourceSpanCandidates, tokens[startIndex], token, candidateSurface))) {
            bestMatch = { surface: candidateSurface, value, length: end - startIndex + 1 };
        }
    }
    return bestMatch;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeRecognizedGrammaticalExpressions(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestGrammaticalExpression(tokens, index, sourceSpanCandidates);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, { surface_form: bestMatch.surface, reading: bestMatch.surface, pronunciation: bestMatch.surface, pos: '助詞', pos_detail_1: '接続助詞', pos_detail_2: '*', fullGrammaticalExpression: true, value: bestMatch.value }, { annotations: ['fullGrammaticalExpression', 'value'], evidenceSource: 'grammatical-expression-bank', semanticRole: 'grammatical-expression' }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestContextualOverride(tokens, startIndex, sourceText, sourceRanges = [], options = {}) {
    const overridesEnabled = Object.prototype.hasOwnProperty.call(options, 'overridesEnabled')
        ? Boolean(options.overridesEnabled)
        : runtimeState.overridesEnabled;
    if (!overridesEnabled || !runtimeState.contextOverrideDictionary.size) return null;
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += token.surface_form;
        if (!runtimeState.contextOverridePrefixes.has(candidateSurface)) break;
        const startRange = sourceRanges[startIndex];
        const endRange = sourceRanges[end];
        const candidateRange = startRange && endRange ? { start: startRange.start, end: endRange.end } : null;
        for (const override of runtimeState.contextOverrideDictionary.get(candidateSurface) || []) {
            if (!contextualPatternContainsRange(override.pattern, sourceText, candidateRange)) continue;
            bestMatch = { surface: candidateSurface, romaji: override.romaji, length: end - startIndex + 1 };
        }
    }
    return bestMatch;
}

function mergeContextualOverrideTokens(tokens, sourceText, options = {}) {
    const merged = [];
    const sourceRanges = findSourceTokenRanges(tokens, sourceText);
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestContextualOverride(tokens, index, sourceText, sourceRanges, options);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            contextualOverrideMatched: true,
            contextualRomaji: bestMatch.romaji,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        }, {
            annotations: ['contextualOverrideMatched', 'contextualRomaji'], evidenceSource: 'context-override', semanticRole: 'contextual-override'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestKnownPhrase(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        const candidateTokens = tokens.slice(startIndex, end + 1);
        if (candidateTokens.some(item => item && (item.contextualOverrideMatched || item.titleReadingEvidenceMatched || item.loanwordMatched || item.atejiMatched))) break;
        candidateSurface += token.surface_form;
        if (!runtimeState.knownPhrasePrefixes.has(candidateSurface)) break;
        const value = runtimeState.knownPhraseDictionary.get(candidateSurface);
        const length = end - startIndex + 1;
        if (value && length > 1) bestMatch = { surface: candidateSurface, value, length, source: runtimeState.compoundWordDictionary.has(candidateSurface) ? 'whole-word-compound' : 'known-phrase' };
    }
    return bestMatch;
}

function mergeKnownPhraseTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestKnownPhrase(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, { surface_form: bestMatch.surface, knownPhraseMatched: true, knownPhraseValue: bestMatch.value, knownPhraseSource: bestMatch.source }, { annotations: ['knownPhraseMatched', 'knownPhraseValue', 'knownPhraseSource'], evidenceSource: bestMatch.source || 'known-phrase', semanticRole: 'known-phrase' }));
        index += bestMatch.length - 1;
    }
    return merged;
}

// Source section: Capitalisation, punctuation, token conversion, diagnostics and the ordered translation pipeline.

function getAuthoritativeSpanLookup(surface) {
    const originalSurface = String(surface || '');
    const exact = runtimeState.authoritativeSpanDictionary.get(originalSurface);
    if (exact) return { evidence: exact, lookupSurface: originalSurface, variant: null };

    const generalVariant = normalizeKanjiForLookupDetailed(originalSurface);
    if (generalVariant.changed) {
        const general = runtimeState.authoritativeSpanDictionary.get(generalVariant.normalizedSurface);
        if (general && !general.nameVariants) return { evidence: general, lookupSurface: generalVariant.normalizedSurface, variant: generalVariant };
    }

    const nameVariant = normalizeKanjiForLookupDetailed(originalSurface, { names: true });
    if (nameVariant.changed) {
        const name = runtimeState.authoritativeSpanDictionary.get(nameVariant.normalizedSurface);
        if (name?.nameVariants) return { evidence: name, lookupSurface: nameVariant.normalizedSurface, variant: nameVariant };
    }
    return null;
}

function canContinueAuthoritativeSpan(surface) {
    const originalSurface = String(surface || '');
    if (runtimeState.authoritativeSpanPrefixes.has(originalSurface)) return true;
    const general = normalizeKanjiForLookup(originalSurface);
    if (runtimeState.authoritativeSpanPrefixes.has(general)) return true;
    const name = normalizeKanjiForLookup(originalSurface, { names: true });
    return runtimeState.authoritativeSpanPrefixes.has(name);
}


function getSourceCharacterOffsets(sourceText) {
    const source = String(sourceText || '');
    const characters = Array.from(source);
    const offsets = [0];
    let cursor = 0;
    for (const character of characters) {
        cursor += character.length;
        offsets.push(cursor);
    }
    return { source, characters, offsets };
}

function makeSourceSpanCandidate(sourceText, sourceStart, sourceEnd, details = {}) {
    const source = String(sourceText || '');
    const start = Number(sourceStart);
    const end = Number(sourceEnd);
    const surface = source.slice(start, end);
    const alternatives = Array.isArray(details.alternatives)
        ? details.alternatives.map(item => Object.freeze({ ...item }))
        : [];
    const metadata = details.metadata && typeof details.metadata === 'object'
        ? Object.freeze({ ...details.metadata })
        : Object.freeze({});
    return Object.freeze({
        id: String(details.id || `${start}:${end}:${details.kind || details.category || 'candidate'}:${details.evidenceSource || 'source-span-discovery'}`),
        sourceStart: start,
        sourceEnd: end,
        sourceSurface: surface,
        lookupSurface: String(details.lookupSurface || surface),
        category: String(details.category || 'other'),
        kind: String(details.kind || details.category || 'candidate'),
        semanticRole: String(details.semanticRole || details.kind || details.category || 'candidate'),
        evidenceSource: String(details.evidenceSource || 'source-span-discovery'),
        reading: details.reading ? String(details.reading) : null,
        romaji: details.romaji != null ? String(details.romaji) : null,
        confidence: Number.isFinite(details.confidence) ? Number(details.confidence) : null,
        reviewRequired: typeof details.reviewRequired === 'boolean' ? details.reviewRequired : null,
        selectionState: 'unselected',
        alternatives: Object.freeze(alternatives),
        metadata
    });
}

function getCandidateCategoryForAuthoritativeEvidence(category) {
    if (category === 'reviewed-name') return 'name';
    if (category === 'loanword' || category === 'loanword-review') return 'loanword';
    if (category === 'counter-date') return 'counter';
    return 'lexical';
}

function serializeReadingCandidateForSpanDiscovery(candidate) {
    return {
        reading: candidate?.reading || null,
        romaji: candidate?.romaji || null,
        weight: Number.isFinite(candidate?.weight) ? candidate.weight : 0,
        rank: Number.isFinite(candidate?.rank) ? candidate.rank : null,
        popularityScore: Number.isFinite(candidate?.popularityScore) ? candidate.popularityScore : null,
        retained: typeof candidate?.retained === 'boolean' ? candidate.retained : null,
        categories: [...(candidate?.categories || [])],
        sources: [...(candidate?.sources || [])],
        personComponentCorroborations: [...(candidate?.personComponentCorroborations || [])]
    };
}

function scanSourceByPrefixes(sourceText, prefixes, lookup, emit) {
    if (!(prefixes instanceof Set) || !prefixes.size || typeof lookup !== 'function' || typeof emit !== 'function') return;
    const { characters, offsets } = getSourceCharacterOffsets(sourceText);
    for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
        let surface = '';
        for (let endIndex = startIndex; endIndex < characters.length; endIndex += 1) {
            surface += characters[endIndex];
            if (!prefixes.has(surface)) break;
            const match = lookup(surface);
            if (!match) continue;
            emit(match, surface, offsets[startIndex], offsets[endIndex + 1]);
        }
    }
}

function scanSourceWithContinuation(sourceText, canContinue, lookup, emit) {
    if (typeof canContinue !== 'function' || typeof lookup !== 'function' || typeof emit !== 'function') return;
    const { characters, offsets } = getSourceCharacterOffsets(sourceText);
    for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
        let surface = '';
        for (let endIndex = startIndex; endIndex < characters.length; endIndex += 1) {
            surface += characters[endIndex];
            if (!canContinue(surface)) break;
            const match = lookup(surface);
            if (!match) continue;
            emit(match, surface, offsets[startIndex], offsets[endIndex + 1]);
        }
    }
}

function addRegexSourceSpanCandidates(sourceText, regex, detailsForMatch, emit) {
    const source = String(sourceText || '');
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(source)) !== null) {
        const surface = String(match[0] || '');
        if (!surface) {
            regex.lastIndex += 1;
            continue;
        }
        const details = detailsForMatch(match, surface);
        if (details) emit(makeSourceSpanCandidate(source, match.index, match.index + surface.length, details));
    }
}

/** @param {string} sourceText @param {CJ2RToken[]} [tokens] @param {{historicalKana?: boolean, overridesEnabled?: boolean}} [options] @returns {ReadonlyArray<CJ2RSourceSpanCandidate>} */
function discoverSourceSpanCandidates(sourceText, tokens = [], options = {}) {
    const source = String(sourceText || '');
    const candidates = [];
    const seen = new Set();
    const emit = candidate => {
        if (!candidate) return;
        const key = [candidate.sourceStart, candidate.sourceEnd, candidate.category, candidate.kind, candidate.evidenceSource, candidate.reading || '', candidate.romaji || ''].join('|');
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push(candidate);
    };

    // Reviewed/maintained whole-span evidence. Discovery records every viable
    // interpretation but deliberately does not call the span-selection gates.
    scanSourceWithContinuation(source, canContinueAuthoritativeSpan, getAuthoritativeSpanLookup, (lookup, surface, start, end) => {
        const evidence = lookup.evidence || {};
        let alternatives = [];
        if (evidence.category === 'general-word') {
            const generalLookup = getGeneralWordLookup(surface);
            alternatives = getGeneralWordCandidates(generalLookup).map(serializeReadingCandidateForSpanDiscovery);
        } else if (evidence.category === 'reviewed-reading' && Array.isArray(evidence.alternatives)) {
            alternatives = evidence.alternatives.map(reading => ({
                reading,
                romaji: convertToRomaji(reading),
                categories: ['lexical'],
                sources: [evidence.source || 'reviewed-reading-span']
            }));
        }
        emit(makeSourceSpanCandidate(source, start, end, {
            lookupSurface: lookup.lookupSurface,
            category: getCandidateCategoryForAuthoritativeEvidence(evidence.category),
            kind: evidence.category || 'authoritative-span',
            semanticRole: evidence.category || 'authoritative-span',
            evidenceSource: evidence.source || 'authoritative-span-evidence',
            reading: evidence.reading || null,
            romaji: evidence.romaji ?? null,
            confidence: evidence.confidence,
            reviewRequired: typeof evidence.reviewRequired === 'boolean' ? evidence.reviewRequired : null,
            alternatives,
            metadata: {
                mergeSafe: Boolean(evidence.mergeSafe),
                priority: Number.isFinite(evidence.priority) ? evidence.priority : null,
                loanwordCategory: evidence.loanwordCategory || null,
                counterRole: evidence.counterRole || null,
                counterUnit: evidence.counterUnit || null,
                variantNormalized: Boolean(lookup.variant?.changed)
            }
        }));
    });

    // Compound-word evidence is also scanned independently. The authoritative
    // index stores only a usable single reading, so ambiguous maintained compounds
    // still need an explicit candidate with all supported readings preserved.
    scanSourceByPrefixes(source, runtimeState.compoundWordPrefixes, surface => runtimeState.compoundWordDictionary.get(surface), (entry, _surface, start, end) => {
        const alternatives = (entry?.readings || []).map(candidate => ({
            reading: candidate?.reading || null,
            romaji: candidate?.romaji || null,
            categories: ['lexical'],
            sources: ['compound-word-evidence']
        }));
        if (!alternatives.length) return;
        const resolved = alternatives.length === 1 ? alternatives[0] : null;
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'compound-word', semanticRole: 'lexical-span',
            evidenceSource: 'compound-word-evidence', reading: resolved?.reading || null,
            romaji: resolved?.romaji ?? null, confidence: resolved ? 0.98 : 0.72,
            reviewRequired: alternatives.length > 1, alternatives
        }));
    });

    // General-word evidence is scanned independently as well as through the
    // authoritative-span index. A higher-priority counter/name/loanword entry on
    // the same surface must not hide a competing lexical interpretation during
    // candidate discovery.
    scanSourceByPrefixes(source, runtimeState.generalWordPrefixes, getGeneralWordLookup, (lookup, _surface, start, end) => {
        const alternatives = getGeneralWordCandidates(lookup).map(serializeReadingCandidateForSpanDiscovery);
        if (!alternatives.length) return;
        const preferred = alternatives[0];
        const completeCoverage = hasCompleteGeneralWordReadingCoverage(lookup);
        const mergeSafe = Boolean(lookup?.entry?.mergeSafe);
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'general-word', semanticRole: 'lexical-span',
            evidenceSource: 'general-word-evidence', reading: preferred?.reading || null,
            romaji: preferred?.romaji ?? null, confidence: mergeSafe ? 0.9 : 0.72,
            reviewRequired: alternatives.length > 1 || !completeCoverage,
            alternatives,
            metadata: { mergeSafe, completeCoverage }
        }));
    });

    // Kana spellings may represent an established whole word whose maintained
    // lexical entry is written with Han characters. The kana-reading index is
    // therefore scanned independently of Kuromoji segmentation. Only evidence
    // already registered from maintained lexical entries is proposed here;
    // discovery does not select the boundary.
    {
        const { characters, offsets } = getSourceCharacterOffsets(source);
        for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
            let surface = '';
            for (let endIndex = startIndex; endIndex < characters.length; endIndex += 1) {
                const character = characters[endIndex];
                if (!isKanaSurface(character)) break;
                surface += character;
                const normalizedReading = normalizeKanaReading(surface);
                if (!runtimeState.kanaLexicalReadingPrefixes.has(normalizedReading)) break;
                const evidence = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading);
                if (!evidence) continue;
                const strong = Boolean(evidence.strongSources?.size);
                emit(makeSourceSpanCandidate(source, offsets[startIndex], offsets[endIndex + 1], {
                    category: 'lexical', kind: 'kana-lexical-reading', semanticRole: 'lexical-span',
                    evidenceSource: strong ? 'kana-lexical-strong-evidence' : 'kana-lexical-evidence',
                    reading: normalizedReading, romaji: convertToRomaji(normalizedReading),
                    confidence: strong ? 0.94 : 0.7, reviewRequired: false,
                    alternatives: [],
                    metadata: {
                        strong,
                        evidenceSurfaces: [...(evidence.surfaces || [])],
                        evidenceSources: [...(evidence.sources || [])]
                    }
                }));
            }
        }
    }

    // Unreviewed/specialist name evidence is a candidate source, never an
    // automatic segmentation decision.
    scanSourceByPrefixes(source, runtimeState.properNounPrefixes, surface => runtimeState.properNounDictionary.get(surface), (nameCandidates, _surface, start, end) => {
        const alternatives = [...nameCandidates.values()].map(serializeReadingCandidateForSpanDiscovery);
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'name', kind: 'proper-noun', semanticRole: 'proper-name', evidenceSource: 'proper-noun-evidence',
            confidence: alternatives.length === 1 ? 0.88 : 0.6,
            reviewRequired: alternatives.length > 1, alternatives,
            reading: alternatives.length === 1 ? alternatives[0].reading : null,
            romaji: alternatives.length === 1 ? alternatives[0].romaji : null
        }));
    });

    // Variant spellings are proposed only when the canonical personal-name
    // reading has independent full-name corroboration. Generic variant proper nouns
    // remain candidate evidence in the later proper-name path.
    scanSourceWithContinuation(source, canContinueVariantProperNounSpan, getProperNounCandidateLookup, (lookup, _surface, start, end) => {
        const variantMapped = Boolean(lookup?.variant?.changed);
        const equivalentEvidence = Boolean(lookup?.equivalentEvidence);
        if ((!variantMapped && !equivalentEvidence) || !lookup.lookupSurface) return;
        const alternatives = [...(lookup.candidates || [])].map(serializeReadingCandidateForSpanDiscovery);
        if (alternatives.length !== 1) return;
        const resolved = alternatives[0];
        const corroboratedComponent = Boolean((resolved.personComponentCorroborations || []).length);
        const equivalentSourceAuthority = equivalentEvidence && (lookup.candidates || []).some(sourceCandidate =>
            [...(sourceCandidate?.variantEvidenceSurfaces || [])].some(sourceSurface => {
                const sourceValue = String(sourceSurface || '');
                return sourceValue
                    && sourceValue !== lookup.lookupSurface
                    && normalizeTranslatorInputText(sourceValue) === lookup.lookupSurface;
            }));
        const equivalentFullPerson = equivalentSourceAuthority
            && (resolved.categories || []).some(category => String(category || '') === 'person');
        if (!corroboratedComponent && !equivalentFullPerson) return;
        emit(makeSourceSpanCandidate(source, start, end, {
            lookupSurface: lookup.lookupSurface,
            category: 'name', kind: 'proper-noun', semanticRole: 'proper-name', evidenceSource: 'proper-noun-evidence',
            confidence: 0.88, reviewRequired: false, alternatives,
            reading: resolved.reading, romaji: resolved.romaji,
            metadata: {
                variantNormalized: variantMapped,
                variantMappings: lookup?.variant?.mappings || [],
                variantEquivalentEvidence: equivalentFullPerson
            }
        }));
    });

    // Reviewed common-word and inflection evidence remains lexical candidate
    // evidence; pattern constraints are checked for applicability but do not
    // select boundaries here.
    scanSourceByPrefixes(source, runtimeState.commonWordPrefixes, surface => runtimeState.commonWordDictionary.get(surface), (rules, _surface, start, end) => {
        for (const rule of rules || []) {
            if (rule?.pattern instanceof RegExp) {
                if (!contextualPatternContainsRange(rule.pattern, source, { start, end })) continue;
            }
            emit(makeSourceSpanCandidate(source, start, end, {
                category: 'lexical', kind: 'common-word', semanticRole: 'lexical-span',
                evidenceSource: 'common-word-bank', reading: rule?.reading || null, romaji: rule?.romaji ?? null,
                confidence: 0.92, reviewRequired: false,
                metadata: { conjugationClass: rule?.conjugationClass || null, contextPattern: Boolean(rule?.pattern), tokenReadingAuthority: rule?.tokenReadingAuthority === true }
            }));
        }
    });
    scanSourceByPrefixes(source, runtimeState.commonWordInflectionPrefixes, surface => runtimeState.commonWordInflectionDictionary.get(surface), (entry, _surface, start, end) => {
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'common-word-inflection', semanticRole: 'lexical-inflection',
            evidenceSource: 'reviewed-common-word-inflection', reading: entry.reading || null,
            confidence: 0.93, reviewRequired: false,
            metadata: { lemma: entry.lemma || null, conjugationClass: entry.conjugationClass || null }
        }));
    });
    scanSourceByPrefixes(source, runtimeState.rendakuEvidencePrefixes, surface => runtimeState.rendakuEvidenceDictionary.get(surface), (entry, _surface, start, end) => {
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'rendaku-reading', semanticRole: 'lexical-reading',
            evidenceSource: entry.source || 'rendaku-evidence', reading: entry.reading || null,
            confidence: 0.9, reviewRequired: false,
            metadata: { rendaku: Boolean(entry.rendaku) }
        }));
    });

    // Title evidence is range-scoped. Exact complete-title rules may also apply
    // when the reviewed title is used as a syntactically bounded noun in a sentence.
    scanSourceByPrefixes(source, runtimeState.titleReadingPrefixes, surface => runtimeState.titleReadingDictionary.get(surface), (rules, _surface, start, end) => {
        for (const rule of rules || []) {
            if (!(rule?.pattern instanceof RegExp)) continue;
            if (!titleReadingEvidenceAppliesToRange(rule, source, { start, end }, getTitleMentionBoundaryContext(tokens, null, { start, end }, source))) continue;
            emit(makeSourceSpanCandidate(source, start, end, {
                category: 'title', kind: rule.kind || 'title-reading', semanticRole: 'title-reading',
                evidenceSource: rule.source || 'reviewed-title-reading', reading: rule.reading || null, romaji: rule.romaji ?? null,
                confidence: 1, reviewRequired: false
            }));
        }
    });

    if (options.historicalKana) {
        scanSourceByPrefixes(source, runtimeState.historicalKanaEvidencePrefixes, surface => runtimeState.historicalKanaEvidenceDictionary.get(surface), (entry, _surface, start, end) => {
            emit(makeSourceSpanCandidate(source, start, end, {
                category: 'historical', kind: 'historical-reading', semanticRole: 'historical-reading',
                evidenceSource: entry.source || 'historical-kana-evidence', reading: entry.reading || null,
                confidence: 0.95, reviewRequired: false,
                metadata: { sourceType: entry.sourceType || null, conjugationClass: entry.conjugationClass || null }
            }));
        });
    }

    // Grammar is proposed independently of lexical segmentation. A matching
    // grammatical surface is only a candidate until later boundary arbitration.
    scanSourceByPrefixes(source, runtimeState.grammaticalExpressionPrefixes, surface => runtimeState.grammaticalExpressionDictionary.get(surface), (romaji, _surface, start, end) => {
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'grammar', kind: 'grammatical-expression', semanticRole: 'grammar',
            evidenceSource: 'grammatical-expression-evidence', romaji, confidence: 0.8, reviewRequired: null
        }));
    });

    // Contextual evidence is recorded as competing evidence and is not scored
    // or selected during candidate creation.
    for (const [surface, entry] of runtimeState.contextualReadingDictionary.entries()) {
        let start = source.indexOf(surface);
        while (start >= 0) {
            emit(makeSourceSpanCandidate(source, start, start + surface.length, {
                category: 'contextual', kind: 'contextual-reading', semanticRole: 'contextual-reading',
                evidenceSource: entry.source || 'contextual-reading-evidence', reviewRequired: true,
                alternatives: (entry.candidates || []).map(candidate => ({
                    reading: candidate.reading || null,
                    romaji: candidate.reading ? convertToRomaji(candidate.reading) : null,
                    minScore: Number.isFinite(candidate.minScore) ? candidate.minScore : null,
                    features: [...(candidate.features || [])]
                })),
                metadata: { window: Number.isFinite(entry.window) ? entry.window : null, minMargin: Number.isFinite(entry.minMargin) ? entry.minMargin : null }
            }));
            start = source.indexOf(surface, start + Math.max(1, surface.length));
        }
    }
    for (const [surface, metadata] of runtimeState.loanwordMetadataDictionary.entries()) {
        if (!metadata?.context) continue;
        let start = source.indexOf(surface);
        while (start >= 0) {
            emit(makeSourceSpanCandidate(source, start, start + surface.length, {
                category: 'contextual', kind: 'contextual-loanword', semanticRole: 'contextual-loanword',
                evidenceSource: metadata.context.source || 'contextual-loanword-evidence', reviewRequired: true,
                alternatives: (metadata.context.candidates || []).map(candidate => ({
                    output: candidate.output || null,
                    minScore: Number.isFinite(candidate.minScore) ? candidate.minScore : null,
                    terms: (candidate.terms || []).map(term => ({ term: term.term, weight: term.weight }))
                })),
                metadata: { window: Number.isFinite(metadata.context.window) ? metadata.context.window : null, minMargin: Number.isFinite(metadata.context.minMargin) ? metadata.context.minMargin : null }
            }));
            start = source.indexOf(surface, start + Math.max(1, surface.length));
        }
    }

    // Structural role candidates carry no pronunciation. Role selection occurs later,
    // before any counter/date morphology is permitted to generate a reading.
    const numeralClass = '0-9０-９〇零一二三四五六七八九十百千万億兆';
    addRegexSourceSpanCandidates(source, new RegExp(`[${numeralClass}]+`, 'gu'), () => ({
        category: 'numeric', kind: 'numeral-structure', semanticRole: 'numeral', evidenceSource: 'surface-numeric-structure', confidence: 0.9
    }), emit);
    addRegexSourceSpanCandidates(source, new RegExp(`[${numeralClass}]+(?:時|分|日|週間?|[ヶヵケかカ箇]月|月|年|時間|回|度)`, 'gu'), (_match, surface) => {
        const unit = surface.match(/(?:週間?|時間|[ヶヵケかカ箇]月|時|分|日|月|年|回|度)$/u)?.[0] || '';
        const temporal = ['時','日','週','週間','月','年','時間'].includes(unit) || /[ヶヵケかカ箇]月$/u.test(unit);
        return {
            category: temporal ? 'temporal' : 'counter', kind: temporal ? 'temporal-structure' : 'counter-structure',
            semanticRole: temporal ? 'temporal-expression' : 'counter-expression', evidenceSource: 'surface-role-structure', confidence: 0.72,
            metadata: { unit }
        };
    }, emit);
    addRegexSourceSpanCandidates(source, new RegExp(`(?:今日|明日|昨日|一昨日|明後日|毎日|今週|来週|先週|毎週|今月|来月|先月|毎月|今年|来年|去年|毎年|一日|[${numeralClass}]+(?:日|週間?|[ヶヵケかカ箇]月|年|時間))中`, 'gu'), () => ({
        category: 'temporal', kind: 'period-wide-structure', semanticRole: 'temporal-period-wide', evidenceSource: 'typed-temporal-structure', confidence: 0.78
    }), emit);
    addRegexSourceSpanCandidates(source, new RegExp(`[${numeralClass}]+分の[${numeralClass}]+`, 'gu'), () => ({
        category: 'numeric', kind: 'fraction-structure', semanticRole: 'fraction', evidenceSource: 'surface-fraction-structure', confidence: 0.85
    }), emit);

    // Probe Kuromoji's dictionary directly from immutable source positions. The
    // resulting candidates are independent of the supplied token partition and do
    // not select a boundary by themselves.
    const tokenizerTokens = tokens || [];
    const tokenizerTrie = runtimeState.tokenizer?.viterbi_builder?.trie;
    if (tokenizerTrie && typeof tokenizerTrie.commonPrefixSearch === 'function') {
        const { characters, offsets } = getSourceCharacterOffsets(source);
        for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
            const sourceStart = offsets[startIndex];
            const prefixMatches = tokenizerTrie.commonPrefixSearch(source.slice(sourceStart)) || [];
            for (const prefixMatch of prefixMatches) {
                const surface = String(prefixMatch?.k || '');
                if (Array.from(surface).length < 2) continue;
                const sourceEnd = sourceStart + surface.length;
                const exactCandidates = getKuromojiExactDictionaryCandidates(surface).filter(candidate =>
                    candidate && candidate.pos !== '助詞' && candidate.pos !== '助動詞' && candidate.pos !== '記号'
                    && candidate.reading && /^[ぁ-ゖァ-ヶー]+$/u.test(String(candidate.reading)));
                const uniqueReadings = [...new Set(exactCandidates.map(candidate => normalizeKanaReading(candidate.reading)).filter(Boolean))];
                if (uniqueReadings.length !== 1) continue;
                const representative = exactCandidates.find(candidate => normalizeKanaReading(candidate.reading) === uniqueReadings[0]);
                const properName = representative?.pos === '名詞' && representative?.pos_detail_1 === '固有名詞';
                emit(makeSourceSpanCandidate(source, sourceStart, sourceEnd, {
                    category: properName ? 'name' : 'lexical', kind: 'kuromoji-exact-dictionary-span',
                    semanticRole: properName ? 'proper-name' : 'lexical-span', evidenceSource: 'kuromoji-exact-dictionary',
                    reading: uniqueReadings[0], romaji: convertToRomaji(uniqueReadings[0]), confidence: 0.88, reviewRequired: false,
                    alternatives: exactCandidates.map(candidate => ({
                        reading: normalizeKanaReading(candidate.reading), romaji: convertToRomaji(candidate.reading),
                        pos: candidate.pos || null, posDetail1: candidate.pos_detail_1 || null, posDetail2: candidate.pos_detail_2 || null
                    })),
                    metadata: { properName }
                }));
            }
        }
    }

    // Preserve Kuromoji's proposal as low-authority evidence over the exact
    // source positions without allowing it to mutate or select candidates.
    for (let tokenIndex = 0; tokenIndex < tokenizerTokens.length; tokenIndex += 1) {
        const token = tokenizerTokens[tokenIndex];
        if (!Number.isInteger(token?.sourceStart) || !Number.isInteger(token?.sourceEnd)) continue;
        const reading = getKuromojiDictionaryReading(token);
        const previousToken = tokenizerTokens[tokenIndex - 1] || null;
        const nextToken = tokenizerTokens[tokenIndex + 1] || null;
        const hasOrthographicNoFrame = String(token.surface_form || '') === 'ノ'
            && token.pos !== '助詞'
            && previousToken?.sourceEnd === token.sourceStart
            && nextToken?.sourceStart === token.sourceEnd
            && previousToken?.pos !== '記号'
            && nextToken?.pos !== '記号'
            && !isParticle(previousToken)
            && !isParticle(nextToken)
            && previousToken?.pos !== '助動詞'
            && nextToken?.pos !== '助動詞';
        if (hasOrthographicNoFrame) {
            emit(makeSourceSpanCandidate(source, token.sourceStart, token.sourceEnd, {
                category: 'grammar', kind: 'orthographic-katakana-no', semanticRole: 'genitive-particle',
                evidenceSource: 'source-orthography+syntactic-frame', reading: 'の', romaji: 'no', confidence: 0.74,
                reviewRequired: true,
                metadata: {
                    canonicalSurface: 'の',
                    tokenizerPos: token.pos || null,
                    tokenizerPosDetail1: token.pos_detail_1 || null
                }
            }));
        }
        if (isParticle(token) || token.pos === '助動詞') {
            emit(makeSourceSpanCandidate(source, token.sourceStart, token.sourceEnd, {
                category: 'grammar', kind: isParticle(token) ? 'kuromoji-particle' : 'kuromoji-auxiliary', semanticRole: 'grammar',
                evidenceSource: 'kuromoji-morphology', reading: reading || null,
                romaji: reading ? convertToRomaji(reading) : null, confidence: 0.62,
                metadata: { pos: token.pos || null, posDetail1: token.pos_detail_1 || null, posDetail2: token.pos_detail_2 || null }
            }));
        }
        emit(makeSourceSpanCandidate(source, token.sourceStart, token.sourceEnd, {
            category: 'tokenizer', kind: 'kuromoji-token', semanticRole: 'tokenizer-proposal',
            evidenceSource: 'kuromoji-tokenization', reading: reading || null,
            romaji: reading ? convertToRomaji(reading) : null, confidence: 0.5,
            metadata: { pos: token.pos || null, posDetail1: token.pos_detail_1 || null, posDetail2: token.pos_detail_2 || null }
        }));
    }

    candidates.sort((left, right) => left.sourceStart - right.sourceStart
        || right.sourceEnd - left.sourceEnd
        || left.category.localeCompare(right.category)
        || left.kind.localeCompare(right.kind)
        || left.evidenceSource.localeCompare(right.evidenceSource));
    return Object.freeze(candidates);
}

function isSourceOrthographyPreservableCandidate(candidate) {
    if (!candidate || !['lexical', 'name', 'loanword', 'title'].includes(String(candidate.category || ''))) return false;
    if (String(candidate.evidenceSource || '').startsWith('kuromoji-')) return false;
    if (String(candidate.lookupSurface || '') !== String(candidate.sourceSurface || '')) return false;
    const sourceSurface = String(candidate.sourceSurface || '');
    const normalizedSurface = normalizeTranslatorInputText(sourceSurface);
    return Boolean(sourceSurface && normalizedSurface && normalizedSurface !== sourceSurface);
}

function buildSourceOrthographyDiscoveryOffsetMap(sourceText) {
    const source = String(sourceText || '');
    const targetToSource = new Map([[0, 0]]);
    let sourceOffset = 0;
    let targetOffset = 0;
    let discoverySource = '';
    let previousRetainedHan = false;
    for (const character of Array.from(source)) {
        sourceOffset += character.length;
        if (isIdeographicVariationSelectorSequence(character) && previousRetainedHan) {
            targetToSource.set(targetOffset, sourceOffset);
            continue;
        }
        discoverySource += character;
        targetOffset += character.length;
        targetToSource.set(targetOffset, sourceOffset);
        previousRetainedHan = isHanCharacter(character);
    }
    return { discoverySource, targetToSource };
}

function buildCompatibilityOrthographyDiscoveryOffsetMap(sourceText) {
    const source = String(sourceText || '');
    const targetToSource = new Map([[0, 0]]);
    let sourceOffset = 0;
    let targetOffset = 0;
    let discoverySource = '';
    let previousRetainedHan = false;
    for (const character of Array.from(source)) {
        sourceOffset += character.length;
        if (isIdeographicVariationSelectorSequence(character) && previousRetainedHan) {
            targetToSource.set(targetOffset, sourceOffset);
            continue;
        }
        const mapped = normalizeCompatibilityIdeograph(character);
        discoverySource += mapped;
        targetOffset += mapped.length;
        targetToSource.set(targetOffset, sourceOffset);
        previousRetainedHan = isHanCharacter(mapped);
    }
    return { discoverySource, targetToSource };
}

function buildEvidenceOrthographyDiscoveryOffsetMap(sourceText) {
    const source = String(sourceText || '');
    const targetToSource = new Map([[0, 0]]);
    let sourceOffset = 0;
    let targetOffset = 0;
    let discoverySource = '';
    let previousRetainedHan = false;
    const characters = Array.from(source);
    for (let index = 0; index < characters.length; index += 1) {
        const character = characters[index];
        if (isIdeographicVariationSelectorSequence(character) && previousRetainedHan) {
            sourceOffset += character.length;
            targetToSource.set(targetOffset, sourceOffset);
            continue;
        }
        if (/^[\uFF61-\uFF9F]$/u.test(character)) {
            const run = [];
            while (index < characters.length && /^[\uFF61-\uFF9F]$/u.test(characters[index])) {
                run.push(characters[index]);
                index += 1;
            }
            index -= 1;
            let runSource = '';
            const runStartTargetOffset = targetOffset;
            let normalizedRun = '';
            for (const item of run) {
                runSource += item;
                sourceOffset += item.length;
                normalizedRun = runSource.normalize('NFKC');
                targetToSource.set(runStartTargetOffset + normalizedRun.length, sourceOffset);
            }
            discoverySource += normalizedRun;
            targetOffset = runStartTargetOffset + normalizedRun.length;
            previousRetainedHan = false;
            continue;
        }
        sourceOffset += character.length;
        const mapped = normalizeKanjiForLookup(character);
        discoverySource += mapped;
        targetOffset += mapped.length;
        targetToSource.set(targetOffset, sourceOffset);
        previousRetainedHan = isHanCharacter(mapped);
    }
    return { discoverySource, targetToSource };
}

/**
 * @param {CJ2RSourceSpanCandidate} candidate
 * @param {string} sourceText
 * @param {string} normalizedSourceText
 * @param {{targetToSource: Map<number, number>}|null} [discoveryOffsetMap]
 * @param {Record<string, any>} [metadataOverrides]
 */
function remapSourceOrthographyCandidate(candidate, sourceText, normalizedSourceText, discoveryOffsetMap = null, metadataOverrides = {}) {
    if (!isSourceOrthographyPreservableCandidate(candidate)) return null;
    const source = String(sourceText || '');
    const normalized = String(normalizedSourceText || '');
    const sourceStart = discoveryOffsetMap?.targetToSource?.get(candidate.sourceStart) ?? candidate.sourceStart;
    const sourceEnd = discoveryOffsetMap?.targetToSource?.get(candidate.sourceEnd) ?? candidate.sourceEnd;
    if (!Number.isInteger(sourceStart) || !Number.isInteger(sourceEnd) || sourceEnd <= sourceStart) return null;
    const normalizedPrefix = normalizeTranslatorInputText(source.slice(0, sourceStart));
    const normalizedThroughCandidate = normalizeTranslatorInputText(source.slice(0, sourceEnd));
    const start = normalizedPrefix.length;
    const end = normalizedThroughCandidate.length;
    if (start < 0 || end <= start || end > normalized.length) return null;
    const normalizedSurface = normalized.slice(start, end);
    if (normalizedSurface !== normalizeTranslatorInputText(candidate.sourceSurface)) return null;
    return makeSourceSpanCandidate(normalized, start, end, {
        id: `${candidate.id}:source-orthography`,
        lookupSurface: candidate.lookupSurface,
        category: candidate.category,
        kind: candidate.kind,
        semanticRole: candidate.semanticRole,
        evidenceSource: candidate.evidenceSource,
        reading: candidate.reading,
        romaji: candidate.romaji,
        confidence: candidate.confidence,
        reviewRequired: candidate.reviewRequired,
        alternatives: candidate.alternatives,
        metadata: {
            ...(candidate.metadata || {}),
            sourceOrthographyPreserved: true,
            originalSourceSurface: source.slice(sourceStart, sourceEnd),
            originalSourceStart: sourceStart,
            originalSourceEnd: sourceEnd,
            ...metadataOverrides
        }
    });
}

function discoverSourceOrthographyCandidates(sourceText, normalizedSourceText, options = {}) {
    const source = String(sourceText || '');
    const normalized = String(normalizedSourceText || '');
    if (!source || source === normalized || !runtimeState.tokenizer) return Object.freeze([]);
    const discoveryMaps = [{ map: buildSourceOrthographyDiscoveryOffsetMap(source), compatibilityIntermediate: false, evidenceOnlyIntermediate: false }];
    const compatibilityMap = buildCompatibilityOrthographyDiscoveryOffsetMap(source);
    if (compatibilityMap.discoverySource !== discoveryMaps[0].map.discoverySource) discoveryMaps.push({ map: compatibilityMap, compatibilityIntermediate: true, evidenceOnlyIntermediate: false });
    const evidenceMap = buildEvidenceOrthographyDiscoveryOffsetMap(source);
    if (evidenceMap && evidenceMap.discoverySource
        && !discoveryMaps.some(discovery => discovery.map.discoverySource === evidenceMap.discoverySource)) {
        discoveryMaps.push({ map: evidenceMap, compatibilityIntermediate: false, evidenceOnlyIntermediate: true });
    }
    const remapped = [];
    const seen = new Set();
    for (const discovery of discoveryMaps) {
        const discoveryOffsetMap = discovery.map;
        const discoverySource = discoveryOffsetMap.discoverySource;
        const originalTokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(discoverySource) || [], discoverySource);
        const originalCandidates = discoverSourceSpanCandidates(discoverySource, originalTokens, { historicalKana: Boolean(options.historicalKana) });
        for (const candidate of originalCandidates) {
            const mapped = remapSourceOrthographyCandidate(candidate, source, normalized, discoveryOffsetMap, {
                ...(discovery.compatibilityIntermediate ? { sourceOrthographyCompatibilityIntermediate: true } : {}),
                ...(discovery.evidenceOnlyIntermediate ? { sourceOrthographyEvidenceOnlyIntermediate: true } : {})
            });
            if (!mapped) continue;
            const key = [mapped.sourceStart, mapped.sourceEnd, mapped.category, mapped.kind, mapped.evidenceSource, mapped.reading || '', mapped.romaji || '', mapped.lookupSurface].join('|');
            if (seen.has(key)) continue;
            seen.add(key);
            remapped.push(mapped);
        }
    }
    return Object.freeze(remapped);
}


function buildNameVariantSourceOffsetMap(sourceText) {
    const source = String(sourceText || '');
    const targetToSource = new Map([[0, 0]]);
    let sourceOffset = 0;
    let targetOffset = 0;
    let normalized = '';
    for (const character of Array.from(source)) {
        const mapped = normalizeKanjiForLookup(character, { names: true });
        if (Array.from(mapped).length !== 1) return null;
        sourceOffset += character.length;
        targetOffset += mapped.length;
        normalized += mapped;
        targetToSource.set(targetOffset, sourceOffset);
    }
    return { normalized, targetToSource };
}

/**
 * @param {CJ2RSourceSpanCandidate} candidate
 * @param {string} sourceText
 * @param {string} canonicalText
 * @param {{targetToSource: Map<number, number>}} offsetMap
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [canonicalLexicalReviewEvidence]
 * @param {CJ2RSourceSpanCandidate|null} [canonicalTokenizerEvidence]
 * @param {boolean} [canonicalGeneralWordConsensus]
 */
function remapNameVariantOrthographyCandidate(candidate, sourceText, canonicalText, offsetMap, canonicalLexicalReviewEvidence = [], canonicalTokenizerEvidence = null, canonicalGeneralWordConsensus = false) {
    if (!candidate || candidate.category !== 'name' || candidate.kind !== 'proper-noun') return null;
    if (!Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return null;
    const sourceStart = offsetMap?.targetToSource?.get(candidate.sourceStart);
    const sourceEnd = offsetMap?.targetToSource?.get(candidate.sourceEnd);
    if (typeof sourceStart !== 'number' || typeof sourceEnd !== 'number' || !Number.isInteger(sourceStart) || !Number.isInteger(sourceEnd) || sourceEnd <= sourceStart) return null;
    const source = String(sourceText || '');
    const sourceSurface = source.slice(sourceStart, sourceEnd);
    const canonicalSurface = String(canonicalText || '').slice(candidate.sourceStart, candidate.sourceEnd);
    if (!sourceSurface || !canonicalSurface || sourceSurface === canonicalSurface) return null;
    if (normalizeKanjiForLookup(sourceSurface, { names: true }) !== canonicalSurface) return null;
    return makeSourceSpanCandidate(source, sourceStart, sourceEnd, {
        id: `${candidate.id}:name-variant-orthography`,
        lookupSurface: candidate.lookupSurface || canonicalSurface,
        category: candidate.category,
        kind: candidate.kind,
        semanticRole: candidate.semanticRole,
        evidenceSource: candidate.evidenceSource,
        reading: candidate.reading,
        romaji: candidate.romaji,
        confidence: candidate.confidence,
        reviewRequired: candidate.reviewRequired,
        alternatives: candidate.alternatives,
        metadata: {
            ...(candidate.metadata || {}),
            sourceOrthographyPreserved: true,
            sourceOrthographyNameVariant: true,
            originalSourceSurface: sourceSurface,
            originalSourceStart: sourceStart,
            originalSourceEnd: sourceEnd,
            canonicalNameVariantSurface: canonicalSurface,
            canonicalVariantLexicalReviewRequired: canonicalLexicalReviewEvidence.length > 0,
            canonicalVariantLexicalReviewEvidence: canonicalLexicalReviewEvidence.map(item => ({
                kind: item.kind,
                evidenceSource: item.evidenceSource,
                lookupSurface: item.lookupSurface,
                reading: item.reading || null,
                alternatives: item.alternatives || []
            })),
            canonicalVariantTokenizerPos: canonicalTokenizerEvidence?.metadata?.pos || null,
            canonicalVariantTokenizerPosDetail1: canonicalTokenizerEvidence?.metadata?.posDetail1 || null,
            canonicalVariantTokenizerPosDetail2: canonicalTokenizerEvidence?.metadata?.posDetail2 || null,
            canonicalVariantTokenizerReading: canonicalTokenizerEvidence?.reading || null,
            canonicalVariantGeneralWordConsensus: canonicalGeneralWordConsensus === true
        }
    });
}

function discoverNameVariantOrthographyCandidates(sourceText, options = {}) {
    const source = String(sourceText || '');
    if (!source || !runtimeState.tokenizer) return Object.freeze([]);
    const offsetMap = buildNameVariantSourceOffsetMap(source);
    if (!offsetMap || !offsetMap.normalized || offsetMap.normalized === source) return Object.freeze([]);
    const canonical = offsetMap.normalized;
    const canonicalTokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(canonical) || [], canonical);
    const canonicalCandidates = discoverSourceSpanCandidates(canonical, canonicalTokens, { historicalKana: Boolean(options.historicalKana) });
    const remapped = [];
    const seen = new Set();
    for (const candidate of canonicalCandidates) {
        const canonicalLexicalReviewEvidence = canonicalCandidates.filter(item =>
            item !== candidate
            && item.sourceStart === candidate.sourceStart
            && item.sourceEnd === candidate.sourceEnd
            && item.category === 'lexical'
            && item.kind === 'general-word'
            && item.reviewRequired === true);
        const canonicalTokenizerEvidence = canonicalCandidates.find(item =>
            item.category === 'tokenizer'
            && item.sourceStart === candidate.sourceStart
            && item.sourceEnd === candidate.sourceEnd) || null;
        const candidateReading = normalizeKanaReading(candidate.reading || '');
        const canonicalGeneralWordConsensus = Boolean(candidateReading
            && candidate.category === 'name'
            && candidate.kind === 'proper-noun'
            && candidate.reviewRequired !== true
            && !(canonicalCandidates || []).some(item =>
                item.category === 'name'
                && item.kind === 'proper-noun'
                && item.sourceStart <= candidate.sourceStart
                && item.sourceEnd >= candidate.sourceEnd
                && (item.sourceStart < candidate.sourceStart || item.sourceEnd > candidate.sourceEnd))
            && canonicalCandidates.some(item => {
                if (item.category !== 'lexical'
                    || item.kind !== 'general-word'
                    || item?.metadata?.mergeSafe !== true
                    || item.sourceStart !== candidate.sourceStart
                    || item.sourceEnd !== candidate.sourceEnd) return false;
                const readings = new Set([
                    normalizeKanaReading(item.reading || ''),
                    ...(item.alternatives || []).map(alternative => normalizeKanaReading(alternative?.reading || ''))
                ].filter(Boolean));
                return readings.size === 1 && readings.has(candidateReading);
            }));
        const mapped = remapNameVariantOrthographyCandidate(candidate, source, canonical, offsetMap, canonicalLexicalReviewEvidence, canonicalTokenizerEvidence, canonicalGeneralWordConsensus);
        if (!mapped) continue;
        const alternatives = (mapped.alternatives || []).map(item => `${item?.reading || ''}:${item?.romaji || ''}`).sort().join(',');
        const key = [mapped.sourceStart, mapped.sourceEnd, mapped.kind, mapped.evidenceSource, mapped.reading || '', mapped.lookupSurface || '', alternatives].join('|');
        if (seen.has(key)) continue;
        seen.add(key);
        remapped.push(mapped);
    }
    return Object.freeze(remapped);
}

function mergeSourceSpanCandidateSets(primary, additional) {
    const merged = [];
    const seen = new Map();
    for (const candidate of [...(primary || []), ...(additional || [])]) {
        const alternatives = (candidate?.alternatives || []).map(item => `${item?.reading || ''}:${item?.romaji || ''}`).sort().join(',');
        const key = [candidate?.sourceStart, candidate?.sourceEnd, candidate?.category, candidate?.kind, candidate?.evidenceSource, candidate?.reading || '', candidate?.romaji || '', candidate?.lookupSurface || '', alternatives].join('|');
        if (seen.has(key)) {
            const index = seen.get(key);
            const current = merged[index];
            if (candidate?.metadata?.sourceOrthographyNameVariant === true
                && current?.metadata?.sourceOrthographyNameVariant !== true) {
                merged[index] = { ...current, metadata: { ...(current?.metadata || {}), ...(candidate.metadata || {}) } };
            }
            continue;
        }
        seen.set(key, merged.length);
        merged.push(candidate);
    }
    merged.sort((left, right) => left.sourceStart - right.sourceStart
        || right.sourceEnd - left.sourceEnd
        || left.category.localeCompare(right.category)
        || left.kind.localeCompare(right.kind)
        || left.evidenceSource.localeCompare(right.evidenceSource));
    return Object.freeze(merged);
}

function getSourceOrthographyCandidateReadings(candidate) {
    const source = String(candidate?.evidenceSource || 'source-orthography-evidence');
    const alternatives = Array.isArray(candidate?.alternatives) && candidate.alternatives.length
        ? candidate.alternatives
        : (candidate?.reading ? [{ reading: candidate.reading, romaji: candidate.romaji }] : []);
    const byReading = new Map();
    for (const item of alternatives) {
        const reading = normalizeKanaReading(item?.reading || '');
        if (!reading) continue;
        const existing = byReading.get(reading);
        const categories = new Set([...(existing?.categories || []), ...(item?.categories || [])]);
        const sources = new Set([...(existing?.sources || []), ...(item?.sources || []), source]);
        const weight = Math.max(Number(existing?.weight || 0), Number(item?.weight || 0));
        const ranks = [existing?.rank, item?.rank]
            .filter(value => value !== null && value !== undefined && Number.isFinite(Number(value)))
            .map(Number);
        byReading.set(reading, {
            ...(existing || {}),
            ...item,
            reading: item?.reading || candidate?.reading || reading,
            romaji: item?.romaji || candidate?.romaji || convertToRomaji(reading),
            weight,
            rank: ranks.length ? Math.min(...ranks) : null,
            categories,
            sources,
            sourceOrthographyPreserved: true,
            originalSourceSurface: candidate?.metadata?.originalSourceSurface || candidate?.lookupSurface || null
        });
    }
    return [...byReading.values()];
}


function mergeSourceOrthographyResolutionEvidence(token, details = {}) {
    const properNameCandidates = Array.isArray(token?.sourceOrthographyProperNounCandidates)
        ? token.sourceOrthographyProperNounCandidates
        : [];
    const generalWordCandidates = Array.isArray(token?.sourceOrthographyGeneralWordCandidates)
        ? token.sourceOrthographyGeneralWordCandidates
        : [];
    if (!properNameCandidates.length && !generalWordCandidates.length) return details;

    const selectedReading = normalizeKanaReading(details.reading || token?.reading || token?.pronunciation || '');
    const selectedRomaji = details.romaji || (selectedReading ? convertToRomaji(selectedReading) : null);
    const selectedCandidate = selectedReading ? [{
        reading: selectedReading,
        romaji: selectedRomaji,
        weight: 100,
        rank: null,
        categories: new Set([properNameCandidates.length ? 'analyser-name-reading' : 'analyser-lexical-reading']),
        sources: new Set([details.source || 'source-span-lexical-reconstruction'])
    }] : [];
    const sourceCandidates = properNameCandidates.length ? properNameCandidates : generalWordCandidates;
    const candidates = mergeReadingResolutionCandidates([...selectedCandidate, ...sourceCandidates]);
    const distinctSourceReadings = new Set(sourceCandidates
        .map(candidate => normalizeKanaReading(candidate?.reading || ''))
        .filter(Boolean));
    const sourceIncludesSelected = selectedReading && distinctSourceReadings.has(selectedReading);
    const flags = [...(details.flags || [])];
    let ambiguous = Boolean(details.ambiguous);
    let confidence = Number.isFinite(details.confidence) ? Number(details.confidence) : 0.9;

    if (properNameCandidates.length) {
        if (distinctSourceReadings.size > 1) {
            if (!flags.includes('proper-noun-ambiguous')) flags.push('proper-noun-ambiguous');
            ambiguous = true;
            confidence = Math.min(confidence, 0.86);
        } else if (distinctSourceReadings.size === 1 && selectedReading && !sourceIncludesSelected) {
            if (!flags.includes('reading-evidence-conflict')) flags.push('reading-evidence-conflict');
            ambiguous = true;
            confidence = Math.min(confidence, 0.82);
        }
    } else if (generalWordCandidates.length) {
        if (distinctSourceReadings.size > 1) {
            if (!flags.includes('general-word-alternative')) flags.push('general-word-alternative');
            ambiguous = true;
            confidence = Math.min(confidence, 0.84);
        } else if (distinctSourceReadings.size === 1 && selectedReading && !sourceIncludesSelected) {
            if (!flags.includes('reading-evidence-conflict')) flags.push('reading-evidence-conflict');
            ambiguous = true;
            confidence = Math.min(confidence, 0.82);
        }
    }

    return {
        ...details,
        source: `${details.source || 'source-span-lexical-reconstruction'}+source-orthography`,
        confidence,
        candidates,
        flags,
        ambiguous
    };
}

/**
 * Carries exact original-orthography lexical evidence into token resolution without
 * granting that evidence new segmentation authority. Candidates are attached only
 * when the final token owns the exact normalized range of the original source span.
 * @param {CJ2RToken[]} tokens
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates
 */
function annotateSourceOrthographyEvidence(tokens, sourceSpanCandidates = []) {
    return (tokens || []).map(token => {
        if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return token;
        const exact = (sourceSpanCandidates || []).filter(candidate =>
            candidate?.metadata?.sourceOrthographyPreserved === true
            && candidate.sourceStart === token.sourceStart
            && candidate.sourceEnd === token.sourceEnd);
        if (!exact.length) return token;

        const sourceNameEvidence = exact.filter(candidate => candidate.category === 'name'
            && candidate.kind === 'proper-noun'
            && candidate.evidenceSource === 'proper-noun-evidence');
        const canonicalProperNameReviewCandidates = sourceNameEvidence.some(candidate =>
            candidate?.metadata?.originalSourceSurface
            && candidate.metadata.originalSourceSurface !== token.surface_form)
            ? (sourceSpanCandidates || []).filter(candidate =>
                candidate?.metadata?.sourceOrthographyPreserved !== true
                && candidate.sourceStart === token.sourceStart
                && candidate.sourceEnd === token.sourceEnd
                && candidate.category === 'name'
                && candidate.kind === 'proper-noun'
                && candidate.evidenceSource === 'proper-noun-evidence'
                && candidate.reviewRequired === true)
            : [];
        const nameCandidates = [...sourceNameEvidence, ...canonicalProperNameReviewCandidates]
            .flatMap(getSourceOrthographyCandidateReadings);
        const generalCandidates = exact
            .filter(candidate => candidate.category === 'lexical'
                && candidate.kind === 'general-word'
                && candidate.evidenceSource === 'general-word-evidence')
            .flatMap(getSourceOrthographyCandidateReadings);
        const canonicalVariantLexicalCandidates = exact
            .filter(candidate => candidate?.metadata?.sourceOrthographyNameVariant === true
                && candidate?.metadata?.canonicalVariantLexicalReviewRequired === true
                && candidate?.metadata?.canonicalVariantTokenizerPosDetail1 !== '固有名詞'
                && !(sourceSpanCandidates || []).some(other =>
                    other.category === 'name'
                    && other.kind === 'proper-noun'
                    && other.sourceStart <= candidate.sourceStart
                    && other.sourceEnd >= candidate.sourceEnd
                    && (other.sourceStart < candidate.sourceStart || other.sourceEnd > candidate.sourceEnd)))
            .flatMap(candidate => (candidate?.metadata?.canonicalVariantLexicalReviewEvidence || []).flatMap(item =>
                getSourceOrthographyCandidateReadings({
                    evidenceSource: item.evidenceSource || 'general-word-evidence',
                    reading: item.reading || null,
                    alternatives: item.alternatives || [],
                    metadata: { originalSourceSurface: candidate?.metadata?.originalSourceSurface || null }
                })
            ));
        if (!nameCandidates.length && !generalCandidates.length && !canonicalVariantLexicalCandidates.length) return token;

        const originalSurfaces = [...new Set(exact
            .map(candidate => candidate?.metadata?.originalSourceSurface || null)
            .filter(Boolean))];
        const mergedCanonicalLexicalCandidates = mergeReadingResolutionCandidates(canonicalVariantLexicalCandidates);
        return {
            ...token,
            sourceOrthographyEvidenceMatched: true,
            sourceOrthographyOriginalSurfaces: originalSurfaces,
            sourceOrthographyProperNounCandidates: mergeReadingResolutionCandidates(nameCandidates),
            sourceOrthographyGeneralWordCandidates: mergeReadingResolutionCandidates([...generalCandidates, ...canonicalVariantLexicalCandidates]),
            ...(mergedCanonicalLexicalCandidates.length && !token.locationSuffixRoleMatched ? {
                generalWordMatched: true,
                generalWordReading: mergedCanonicalLexicalCandidates[0].reading,
                generalWordCandidates: mergedCanonicalLexicalCandidates,
                generalWordAmbiguous: true
            } : {}),
            sourceOrthographyGeneralWordCoverageIncomplete: exact.some(candidate =>
                candidate.category === 'lexical'
                && candidate.kind === 'general-word'
                && candidate.evidenceSource === 'general-word-evidence'
                && candidate?.metadata?.completeCoverage !== true),
            sourceOrthographyCanonicalLexicalReviewRequired: exact.some(candidate =>
                candidate?.metadata?.sourceOrthographyNameVariant === true
                && candidate?.metadata?.canonicalVariantLexicalReviewRequired === true)
        };
    });
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates @param {string} sourceText */
function validateSourceSpanCandidates(candidates, sourceText) {
    const source = String(sourceText || '');
    const violations = [];
    for (let index = 0; index < (candidates || []).length; index += 1) {
        const candidate = candidates[index];
        const add = reason => violations.push({ index, id: candidate?.id || null, sourceSurface: candidate?.sourceSurface || null, reason });
        if (!candidate || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) { add('missing-source-range'); continue; }
        if (candidate.sourceStart < 0 || candidate.sourceEnd <= candidate.sourceStart || candidate.sourceEnd > source.length) { add('invalid-source-range'); continue; }
        if (candidate.sourceSurface !== source.slice(candidate.sourceStart, candidate.sourceEnd)) add('invalid-sourceSurface');
        if (!candidate.category || !candidate.kind || !candidate.evidenceSource) add('missing-candidate-provenance');
        if (candidate.selectionState !== 'unselected') add('candidate-selection-leaked-into-discovery');
        if (Object.prototype.hasOwnProperty.call(candidate, 'selected') || Object.prototype.hasOwnProperty.call(candidate, 'winner')) add('candidate-selection-field-present');
    }
    return { valid: violations.length === 0, violations };
}

function tokensNeedAuthoritativeRescue(tokens, surface) {
    return tokens.some(token => {
        const resolution = resolveTokenReading(token, surface);
        const source = String(resolution?.source || '');
        return String(convertToken(token, surface, resolution) || '').includes('[Unresolved]')
            || source === 'japanese-scope-character-fallback'
            || source === 'japanese-scope-compositional-fallback'
            || source === 'japanese-scope-data-gap';
    });
}

function generalWordSpanConflictsWithNumericStructure(tokens, startIndex, endIndex, candidateSurface) {
    const candidateTokens = tokens.slice(startIndex, endIndex + 1);
    if (isStructuredNumericUnitSurface(candidateSurface)) return true;

    const isNumericToken = token => Boolean(token) && (
        token.pos_detail_1 === '数'
        || (isSuffix(token) && token.pos_detail_2 === '助数詞')
        || token.authoritativeSpanCategory === 'counter-date'
        || token.numericExpression
        || token.typedNumericExpressionMatched
        || token.typedTemporalExpressionMatched
        || token.reviewedNumericAliasMatched
        || token.structuredNumericSplit
    );
    const containsCounter = candidateTokens.some(token =>
        (isSuffix(token) && token.pos_detail_2 === '助数詞')
        || token?.authoritativeSpanCategory === 'counter-date'
        || token?.typedTemporalExpressionMatched
    );
    if (containsCounter) return true;

    const allNumerals = candidateTokens.length > 1
        && candidateTokens.every(token => token?.pos_detail_1 === '数');
    if (!allNumerals) return false;

    // An isolated lexical numeral collision such as 万一 may remain a whole word,
    // but the same surface inside a larger numeric sequence must stay structural.
    return isNumericToken(tokens[startIndex - 1]) || isNumericToken(tokens[endIndex + 1]);
}

function counterDateAuthorityHasSelectedRole(candidateTokens, evidence) {
    if (evidence?.category !== 'counter-date') return true;
    const role = String(evidence?.counterRole || '');
    // These readings are role-specific: their pronunciation must never be used
    // as proof that the source span is a clock/minute expression. Role
    // selection happens earlier in the numeric pipeline.
    if (!['clock-hour', 'minute-counter'].includes(role)) return true;
    return (candidateTokens || []).some(token => token?.typedNumericRoleSelected === true && token?.typedNumericRole === role);
}

function getTokenSpanSourceBounds(tokens, startIndex, endIndex) {
    const first = tokens?.[startIndex];
    const last = tokens?.[endIndex];
    const sourceStart = Number.isInteger(first?.sourceStart) ? first.sourceStart : null;
    const sourceEnd = Number.isInteger(last?.sourceEnd) ? last.sourceEnd : null;
    return { sourceStart, sourceEnd };
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {number} endIndex @param {string} candidateSurface @param {any} evidence @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function arbitrateMergeSafeGeneralWordBoundary(tokens, startIndex, endIndex, candidateSurface, evidence, sourceSpanCandidates = []) {
    if (evidence?.category !== 'general-word' || !evidence?.mergeSafe || endIndex <= startIndex) return { allowed: false, reason: 'not-merge-safe-general-word' };
    const candidateTokens = tokens.slice(startIndex, endIndex + 1);
    const { sourceStart, sourceEnd } = getTokenSpanSourceBounds(tokens, startIndex, endIndex);
    if (!Number.isInteger(sourceStart) || !Number.isInteger(sourceEnd) || sourceEnd <= sourceStart) {
        if ((sourceSpanCandidates || []).length) return { allowed: false, reason: 'missing-source-span' };
        const protectedEvidenceInsideSpan = candidateTokens.some(item =>
            item?.reviewedProperNameSpanMatched || item?.reviewedNameHonorificMatched || item?.exactDictionaryRescueMatched
            || item?.titleReadingEvidenceMatched || item?.loanwordMatched || item?.contextualOverrideMatched || item?.nameContextAmbiguous
        );
        if (protectedEvidenceInsideSpan) return { allowed: false, reason: 'stronger-protected-evidence' };
        const grammaticalMaterialInsideSpan = candidateTokens.some((item, offset) => offset > 0 && (
            isParticle(item) || isNominalizer(item) || item?.pos === '助動詞' || item?.fullGrammaticalExpression || item?.sourceSpanGrammarBoundaryBefore
        ));
        if (grammaticalMaterialInsideSpan) return { allowed: false, reason: 'independent-grammatical-boundary' };
        if (generalWordSpanConflictsWithNumericStructure(tokens, startIndex, endIndex, candidateSurface)) return { allowed: false, reason: 'validated-numeric-structure' };
        return { allowed: true, reason: 'merge-safe-fixture-evidence' };
    }

    const exactLexicalCandidates = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.sourceStart === sourceStart
        && candidate?.sourceEnd === sourceEnd
        && candidate?.sourceSurface === candidateSurface
        && candidate?.category === 'lexical'
        && candidate?.kind === 'general-word'
        && candidate?.metadata?.mergeSafe === true
    );
    // Runtime-internal callers used by focused QA may not supply the immutable
    // candidate inventory. In that case the authored mergeSafe evidence itself
    // remains sufficient to exercise the arbitration rule.
    const hasExactLexicalBoundaryEvidence = exactLexicalCandidates.length > 0 || !(sourceSpanCandidates || []).length;
    if (!hasExactLexicalBoundaryEvidence) return { allowed: false, reason: 'no-exact-lexical-candidate' };

    const protectedEvidenceInsideSpan = candidateTokens.some(item =>
        item?.reviewedProperNameSpanMatched
        || item?.reviewedNameHonorificMatched
        || item?.exactDictionaryRescueMatched
        || item?.titleReadingEvidenceMatched
        || item?.loanwordMatched
        || item?.contextualOverrideMatched
        || item?.nameContextAmbiguous
    );
    if (protectedEvidenceInsideSpan) return { allowed: false, reason: 'stronger-protected-evidence' };

    const reviewedLoanwordComponents = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.category === 'loanword'
        && candidate.reviewRequired !== true
        && candidate.romaji != null
        && Number(candidate.confidence || 0) >= 0.85
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
        && (candidate.sourceStart > sourceStart || candidate.sourceEnd < sourceEnd)
    ).sort((left, right) => left.sourceStart - right.sourceStart || right.sourceEnd - left.sourceEnd);
    let coveredTo = sourceStart;
    let loanwordComponentCount = 0;
    for (const candidate of reviewedLoanwordComponents) {
        if (candidate.sourceStart > coveredTo) break;
        if (candidate.sourceEnd <= coveredTo) continue;
        coveredTo = candidate.sourceEnd;
        loanwordComponentCount += 1;
        if (coveredTo >= sourceEnd) break;
    }
    if (coveredTo >= sourceEnd && loanwordComponentCount > 1) {
        return { allowed: false, reason: 'reviewed-loanword-component-coverage' };
    }

    // A semantic role that has already been positively selected owns its source
    // span. Lexical boundary evidence may compete with raw numeric morphology,
    // but it cannot erase a role decision made by the role-first pipeline.
    const selectedRoleInsideSpan = candidateTokens.some(item =>
        item?.typedNumericRoleSelected === true
        || item?.typedTemporalExpressionMatched === true
        || item?.typedNumericExpressionMatched === true
    );
    if (selectedRoleInsideSpan) return { allowed: false, reason: 'selected-semantic-role' };

    // Explicit structured number+unit surfaces (currency and reviewed
    // productive counters) remain structural. Kuromoji's broad 助数詞 label is
    // not sufficient on its own because it also appears inside lexicalised
    // forms such as 一握り, so only the maintained productive counter set is a
    // hard boundary signal here.
    if (isStructuredNumericUnitSurface(candidateSurface)) return { allowed: false, reason: 'structured-numeric-unit' };
    const productiveCounterSurfaces = new Set(['人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階']);
    const hasProductiveCounterStructure = candidateTokens.some((item, offset) => {
        if (offset <= 0 || !productiveCounterSurfaces.has(String(item?.surface_form || ''))) return false;
        const previous = candidateTokens[offset - 1];
        return previous?.pos_detail_1 === '数' || isJapaneseNumeralSurface(previous?.surface_form || '') || previous?.numericExpression;
    });
    if (hasProductiveCounterStructure) return { allowed: false, reason: 'productive-counter-structure' };

    const grammarCandidatesInsideSpan = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.category === 'grammar'
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
    );
    const numericCandidatesInsideSpan = (sourceSpanCandidates || []).filter(candidate =>
        ['numeric', 'temporal', 'counter'].includes(candidate?.category)
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
    );
    const strongerNumericContainer = (sourceSpanCandidates || []).some(candidate =>
        ['numeric', 'counter'].includes(candidate?.category)
        && candidate.sourceStart <= sourceStart
        && candidate.sourceEnd >= sourceEnd
        && (candidate.sourceStart < sourceStart || candidate.sourceEnd > sourceEnd)
    );
    if (strongerNumericContainer) return { allowed: false, reason: 'inside-larger-numeric-structure' };

    const counterSubspan = (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'counter'
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
        && (candidate.sourceStart > sourceStart || candidate.sourceEnd < sourceEnd)
    );
    if (counterSubspan) return { allowed: false, reason: 'counter-subspan-evidence' };

    return {
        allowed: true,
        reason: grammarCandidatesInsideSpan.length || numericCandidatesInsideSpan.length
            ? 'exact-lexical-evidence-wins-analyser-segmentation'
            : 'exact-lexical-evidence',
        competingGrammarCandidates: grammarCandidatesInsideSpan.length,
        competingNumericCandidates: numericCandidatesInsideSpan.length
    };
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestAuthoritativeSpan(tokens, startIndex, sourceSpanCandidates = []) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.historicalKanaEvidenceMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const evidenceBackedSymbol = token.pos === '記号'
            && !isIdeographicVariationSelectorSequence(tokenSurface)
            && canContinueAuthoritativeSpan(nextCandidateSurface);
        if (token.pos === '記号' && !isIdeographicVariationSelectorSequence(tokenSurface) && !evidenceBackedSymbol) break;
        candidateSurface = nextCandidateSurface;
        const lookup = getAuthoritativeSpanLookup(candidateSurface);
        const nextToken = tokens[end + 1];
        const suppressCountryNameAuthority = Boolean(
            lookup?.evidence?.category === 'loanword'
            && lookup?.evidence?.loanwordCategory === 'country-name'
            && String(nextToken?.surface_form || '') === '語'
            && !hasReviewedCountryLanguageLoanword(candidateSurface + '語')
        );
        const changedForLookup = Boolean(lookup?.variant?.changed);
        const spansMultipleTokens = end > startIndex;
        const category = lookup?.evidence?.category || '';
        const candidateTokens = tokens.slice(startIndex, end + 1);
        const counterDateRoleAuthorityAllowed = counterDateAuthorityHasSelectedRole(candidateTokens, lookup?.evidence);
        const categoryAllowsDirectAuthority = ['counter-date', 'ateji', 'loanword', 'loanword-review', 'reviewed-reading'].includes(category)
            && counterDateRoleAuthorityAllowed;
        const generalWordRescue = category === 'general-word'
            && tokensNeedAuthoritativeRescue(candidateTokens, candidateSurface);
        const generalWordBoundaryArbitration = category === 'general-word'
            ? arbitrateMergeSafeGeneralWordBoundary(tokens, startIndex, end, candidateSurface, lookup?.evidence, sourceSpanCandidates)
            : { allowed: false, reason: 'not-general-word' };
        const mergeSafeGeneralWordAuthority = category === 'general-word'
            && Boolean(lookup?.evidence?.mergeSafe)
            && spansMultipleTokens
            && generalWordBoundaryArbitration.allowed;
        const unconditionalSpanAuthority = category !== 'general-word' && spansMultipleTokens && counterDateRoleAuthorityAllowed;
        const variantNormalizedAuthority = changedForLookup && category !== 'general-word' && counterDateRoleAuthorityAllowed;
        // Strong merge-safe lexical evidence may repair a readable tokenizer split. Weak general-word aliases remain rescue-only.
        if (lookup && !suppressCountryNameAuthority && (categoryAllowsDirectAuthority || generalWordRescue || mergeSafeGeneralWordAuthority || unconditionalSpanAuthority || variantNormalizedAuthority)) {
            bestMatch = {
                surface: candidateSurface,
                lookupSurface: lookup.lookupSurface,
                evidence: lookup.evidence,
                variant: lookup.variant,
                length: end - startIndex + 1
            };
        }
        if (!canContinueAuthoritativeSpan(candidateSurface)) break;
    }
    return bestMatch;
}

function sourceSpanLexicalCandidateHasStandaloneConsensus(candidate) {
    if (!candidate?.sourceSurface || !candidate?.reading) return false;
    const token = getStandaloneSingleToken(candidate.sourceSurface);
    if (!token || isParticle(token) || token.pos === '助動詞' || token.pos === '記号') return false;
    const reading = normalizeKanaReading(getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '');
    return Boolean(reading && reading === normalizeKanaReading(candidate.reading));
}

/** @param {CJ2RSourceSpanCandidate} candidate @returns {CJ2RToken[]|null} */
function getSourceSpanLexicalCandidateTokenizerConsensusTokens(candidate) {
    if (!candidate?.sourceSurface || !candidate?.reading || !runtimeState.tokenizer) return null;
    const tokens = runtimeState.tokenizer.tokenize(candidate.sourceSurface) || [];
    if (!tokens.length || tokens.map(token => String(token.surface_form || '')).join('') !== candidate.sourceSurface) return null;
    let reading = '';
    for (const token of tokens) {
        if (!token || isParticle(token) || token.pos === '助動詞') return null;
        const tokenReading = getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '';
        const normalized = normalizeKanaReading(tokenReading);
        if (!normalized) return null;
        reading += normalized;
    }
    return normalizeKanaReading(reading) === normalizeKanaReading(candidate.reading) ? tokens : null;
}

function sourceSpanLexicalCandidateHasTokenizerReadingConsensus(candidate) {
    return Boolean(getSourceSpanLexicalCandidateTokenizerConsensusTokens(candidate));
}

function sourceSpanLexicalCandidateHasCanonicalVariantSymbolSplitConsensus(candidate) {
    if (candidate?.metadata?.sourceOrthographyNameVariant !== true) return false;
    const canonicalSurface = String(candidate?.metadata?.canonicalNameVariantSurface || '');
    if (!canonicalSurface || canonicalSurface === candidate.sourceSurface) return false;
    const tokens = getSourceSpanLexicalCandidateTokenizerConsensusTokens({ ...candidate, sourceSurface: canonicalSurface });
    return Boolean(tokens && tokens.length > 1 && tokens.some(token => token?.pos === '記号'));
}

function sourceSpanLexicalCandidateHasCanonicalVariantPersonConsensus(candidate) {
    if (candidate?.metadata?.sourceOrthographyNameVariant !== true
        || candidate?.metadata?.canonicalVariantTokenizerPos !== '名詞'
        || candidate?.metadata?.canonicalVariantTokenizerPosDetail1 !== '固有名詞'
        || candidate?.metadata?.canonicalVariantTokenizerPosDetail2 !== '人名') return false;
    const fullPerson = getUniqueSourceOrthographyPersonReading(candidate, { requireFullPerson: true });
    const candidateReading = normalizeKanaReading(fullPerson?.reading || '');
    const tokenizerReading = normalizeKanaReading(candidate?.metadata?.canonicalVariantTokenizerReading || '');
    return Boolean(candidateReading && tokenizerReading && candidateReading === tokenizerReading);
}

function getCorroboratedPersonalNameAlternative(candidate) {
    if (candidate?.kind !== 'proper-noun' || candidate.reviewRequired === true) return null;
    const alternatives = candidate.alternatives || [];
    if (alternatives.length !== 1) return null;
    const alternative = alternatives[0];
    if (!(alternative.categories || []).includes('per')) return null;
    if (!(alternative.personComponentCorroborations || []).length) return null;
    return alternative;
}

function getCorroboratedPersonalNameTokenizerSplit(candidate) {
    const alternative = getCorroboratedPersonalNameAlternative(candidate);
    if (!alternative || !runtimeState.tokenizer) return null;
    const lookupSurface = String(candidate?.metadata?.variantNormalized ? candidate.lookupSurface || '' : candidate.sourceSurface || '');
    if (!lookupSurface) return null;
    const tokens = runtimeState.tokenizer.tokenize(lookupSurface) || [];
    if (tokens.length < 2 || tokens.map(token => String(token.surface_form || '')).join('') !== lookupSurface) return null;
    let tokenizerReading = '';
    for (const token of tokens) {
        if (!token || isParticle(token) || token.pos === '助動詞') return null;
        const reading = normalizeKanaReading(getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '');
        if (!reading) return tokens;
        tokenizerReading += reading;
    }
    return normalizeKanaReading(tokenizerReading) === normalizeKanaReading(alternative.reading || '') ? null : tokens;
}

function hasOrdinaryPersonalNameSourceBoundary(token, neighbour, side) {
    if (!neighbour) return true;
    if (neighbour?.pos === '記号' || neighbour?.canonicalBoundary || isGrammaticalToken(neighbour)) return true;
    if (side === 'left') return Boolean(token?.sourceSpanGrammarBoundaryBefore || neighbour?.sourceSpanGrammarBoundary);
    return Boolean(neighbour?.sourceSpanGrammarBoundary || neighbour?.sourceSpanGrammarBoundaryBefore);
}

function matchCorroboratedPersonalNameContext(tokens, startIndex, endIndex, candidate, alignment, fullSurface) {
    const candidateSurface = String(candidate?.lookupSurface || candidate?.sourceSurface || '');
    const canonicalFullSurface = String(fullSurface || '');
    if (!candidateSurface || !canonicalFullSurface || canonicalFullSurface === candidateSurface) return false;
    if (alignment === 'suffix' && canonicalFullSurface.endsWith(candidateSurface)) {
        const prefix = canonicalFullSurface.slice(0, canonicalFullSurface.length - candidateSurface.length);
        let accumulated = '';
        let index = startIndex - 1;
        for (; index >= 0 && accumulated.length < prefix.length; index -= 1) accumulated = String(tokens[index]?.surface_form || '') + accumulated;
        if (normalizeKanjiForLookup(accumulated, { names: true }) !== prefix) return false;
        const beforeFullName = tokens[index] || null;
        const fullNameStart = tokens[index + 1] || tokens[startIndex];
        const afterFullName = tokens[endIndex + 1] || null;
        return hasOrdinaryPersonalNameSourceBoundary(fullNameStart, beforeFullName, 'left')
            && hasOrdinaryPersonalNameSourceBoundary(tokens[endIndex], afterFullName, 'right');
    }
    if (alignment === 'prefix' && canonicalFullSurface.startsWith(candidateSurface)) {
        const suffix = canonicalFullSurface.slice(candidateSurface.length);
        let accumulated = '';
        let index = endIndex + 1;
        for (; index < tokens.length && accumulated.length < suffix.length; index += 1) accumulated += String(tokens[index]?.surface_form || '');
        if (normalizeKanjiForLookup(accumulated, { names: true }) !== suffix) return false;
        const beforeFullName = tokens[startIndex - 1] || null;
        const afterFullName = tokens[index] || null;
        return hasOrdinaryPersonalNameSourceBoundary(tokens[startIndex], beforeFullName, 'left')
            && hasOrdinaryPersonalNameSourceBoundary(tokens[index - 1] || tokens[endIndex], afterFullName, 'right');
    }
    return false;
}

function hasCorroboratedPersonalNameSourceBoundary(tokens, startIndex, endIndex, candidate) {
    const first = tokens?.[startIndex];
    const previous = tokens?.[startIndex - 1];
    const next = tokens?.[endIndex + 1];
    const leftBounded = hasOrdinaryPersonalNameSourceBoundary(first, previous, 'left');
    const rightBounded = hasOrdinaryPersonalNameSourceBoundary(tokens?.[endIndex], next, 'right');
    if (leftBounded && rightBounded) return true;

    const alternative = getCorroboratedPersonalNameAlternative(candidate);
    for (const corroboration of alternative?.personComponentCorroborations || []) {
        const [kind, alignment, fullSurface] = String(corroboration || '').split('|');
        if (kind !== 'jmnedict-person-component') continue;
        if (matchCorroboratedPersonalNameContext(tokens, startIndex, endIndex, candidate, alignment, fullSurface)) return true;
    }
    return false;
}

function isCorroboratedDestructivePersonalNameCandidate(candidate) {
    return Boolean(getCorroboratedPersonalNameTokenizerSplit(candidate));
}

function isSourceOrthographyTokenizerProperNameCandidate(candidate) {
    return Boolean(candidate
        && candidate.kind === 'kuromoji-exact-dictionary-span'
        && candidate.category === 'name'
        && candidate.reviewRequired !== true
        && candidate?.metadata?.properName === true
        && candidate?.metadata?.sourceOrthographyPreserved === true
        && candidate.reading);
}

function isStrongSourceSpanLexicalReconstructionCandidate(candidate) {
    if (!candidate || candidate?.metadata?.sourceOrthographyEvidenceOnlyIntermediate === true
        || candidate.reviewRequired === true || !Number.isFinite(candidate.confidence) || candidate.confidence < 0.85) return false;
    if (!candidate.reading && candidate.romaji == null) return false;
    if (candidate.kind === 'proper-noun') {
        return candidate?.metadata?.canonicalVariantGeneralWordConsensus === true
            || sourceSpanLexicalCandidateHasStandaloneConsensus(candidate)
            || sourceSpanLexicalCandidateHasTokenizerReadingConsensus(candidate)
            || sourceSpanLexicalCandidateHasCanonicalVariantSymbolSplitConsensus(candidate)
            || sourceSpanLexicalCandidateHasCanonicalVariantPersonConsensus(candidate);
    }
    if (candidate.kind === 'kuromoji-exact-dictionary-span') {
        return isSourceOrthographyTokenizerProperNameCandidate(candidate)
            || sourceSpanLexicalCandidateHasStandaloneConsensus(candidate);
    }
    if (candidate.kind === 'ateji' && candidate?.metadata?.sourceOrthographyPreserved === true) return true;
    return candidate.kind === 'common-word'
        || candidate.kind === 'common-word-inflection'
        || candidate.category === 'title';
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function sourceSpanLexicalCandidateHasMaintainedGeneralWordConsensus(candidate, sourceSpanCandidates = []) {
    if (candidate?.kind !== 'kuromoji-exact-dictionary-span' || candidate.reviewRequired === true) return false;
    const candidateReading = normalizeKanaReading(candidate.reading || '');
    if (!candidateReading) return false;
    return (sourceSpanCandidates || []).some(other => {
        if (other === candidate
            || other?.category !== 'lexical'
            || other?.kind !== 'general-word'
            || other?.metadata?.mergeSafe !== true
            || other?.sourceStart !== candidate.sourceStart
            || other?.sourceEnd !== candidate.sourceEnd
            || String(other?.sourceSurface || '') !== String(candidate.sourceSurface || '')) return false;
        const readings = new Set([
            normalizeKanaReading(other.reading || ''),
            ...(other.alternatives || []).map(alternative => normalizeKanaReading(alternative?.reading || ''))
        ].filter(Boolean));
        return readings.size === 1 && readings.has(candidateReading);
    });
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function sourceSpanLexicalCandidateHasStructuredRoleConflict(candidate, sourceSpanCandidates = []) {
    if (!candidate || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return true;
    const protectedInternalBoundary = (sourceSpanCandidates || []).some(other => {
        if (other === candidate || !isImmutableSourceSpanBoundaryAuthorityCandidate(other)) return false;
        for (const boundary of [other.sourceStart, other.sourceEnd]) {
            if (!Number.isInteger(boundary) || boundary <= candidate.sourceStart || boundary >= candidate.sourceEnd) continue;
            if (isProtectedImmutableSourceSpanBoundary(sourceSpanCandidates, boundary)) return true;
        }
        return false;
    });
    if (protectedInternalBoundary) return true;
    return (sourceSpanCandidates || []).some(other =>
        other !== candidate
        && ['numeric', 'counter', 'temporal'].includes(String(other?.category || ''))
        && Number.isInteger(other?.sourceStart)
        && Number.isInteger(other?.sourceEnd)
        && other.sourceStart < candidate.sourceEnd
        && other.sourceEnd > candidate.sourceStart);
}

/**
 * Rewrites only the reading of an intact Kuromoji token when an explicitly
 * reviewed common-word component owns one token edge and Kuromoji supplies an
 * independently attested alternate reading for that exact component. The
 * untouched part of the token keeps Kuromoji's own reading, so compositional
 * compounds are not destructively retokenised.
 * @param {CJ2RToken[]} tokens
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates]
 */
function applyReviewedCommonWordTokenReadingAuthority(tokens, sourceSpanCandidates = []) {
    return (tokens || []).map(token => {
        if (!token || isProperNounToken(token)
            || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return token;
        const tokenStart = Number(token.sourceStart);
        const tokenEnd = Number(token.sourceEnd);
        const tokenReading = normalizeKanaReading(token.reading || token.pronunciation || '');
        if (!tokenReading) return token;

        const rewrites = [];
        for (const candidate of sourceSpanCandidates || []) {
            if (candidate?.kind !== 'common-word'
                || candidate.reviewRequired === true
                || candidate?.metadata?.tokenReadingAuthority !== true
                || !Number.isInteger(candidate.sourceStart)
                || !Number.isInteger(candidate.sourceEnd)
                || candidate.sourceStart < tokenStart
                || candidate.sourceEnd > tokenEnd
                || (candidate.sourceStart === tokenStart && candidate.sourceEnd === tokenEnd)) continue;
            const atLeftEdge = candidate.sourceStart === tokenStart;
            const atRightEdge = candidate.sourceEnd === tokenEnd;
            if (!atLeftEdge && !atRightEdge) continue;
            const preferredReading = normalizeKanaReading(candidate.reading || '');
            if (!preferredReading) continue;

            const analyserReadings = new Set((sourceSpanCandidates || [])
                .filter(other => other !== candidate
                    && other?.kind === 'kuromoji-exact-dictionary-span'
                    && other?.sourceStart === candidate.sourceStart
                    && other?.sourceEnd === candidate.sourceEnd
                    && other.reviewRequired !== true)
                .map(other => normalizeKanaReading(other.reading || ''))
                .filter(reading => reading && reading !== preferredReading));
            for (const analyserReading of analyserReadings) {
                let rewritten = null;
                if (atLeftEdge && tokenReading.startsWith(analyserReading)) {
                    rewritten = preferredReading + tokenReading.slice(analyserReading.length);
                }
                if (atRightEdge && tokenReading.endsWith(analyserReading)) {
                    const suffixRewrite = tokenReading.slice(0, tokenReading.length - analyserReading.length) + preferredReading;
                    if (rewritten && rewritten !== suffixRewrite) {
                        rewritten = null;
                        break;
                    }
                    rewritten = suffixRewrite;
                }
                if (rewritten && rewritten !== tokenReading) rewrites.push({ candidate, rewritten });
            }
        }
        const distinct = [...new Map(rewrites.map(item => [item.rewritten, item])).values()];
        if (distinct.length !== 1) return token;
        const selected = distinct[0];
        return {
            ...token,
            reading: selected.rewritten,
            pronunciation: selected.rewritten,
            reviewedTokenReadingAuthorityMatched: true,
            reviewedTokenReadingAuthorityReading: selected.rewritten,
            reviewedTokenReadingAuthoritySurface: selected.candidate.sourceSurface,
            reviewedTokenReadingAuthoritySource: 'common-word-bank+kuromoji-exact-dictionary'
        };
    });
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestStrongSourceSpanLexicalCandidate(tokens, startIndex, sourceSpanCandidates = []) {
    const first = tokens?.[startIndex];
    if (!first || !Number.isInteger(first.sourceStart) || !Number.isInteger(first.sourceEnd)) return null;
    const firstSourceStart = Number(first.sourceStart);
    const firstSourceEnd = Number(first.sourceEnd);
    const matching = (sourceSpanCandidates || []).filter(candidate => {
        const corroboratedOrdinaryLexicalSpan = sourceSpanLexicalCandidateHasMaintainedGeneralWordConsensus(candidate, sourceSpanCandidates)
            && !sourceSpanLexicalCandidateHasStructuredRoleConflict(candidate, sourceSpanCandidates);
        if (candidate?.sourceStart !== firstSourceStart
            || candidate.sourceEnd <= firstSourceEnd
            || (!isStrongSourceSpanLexicalReconstructionCandidate(candidate)
                && !corroboratedOrdinaryLexicalSpan
                && !isCorroboratedDestructivePersonalNameCandidate(candidate))) return false;
        const strongerReviewedLoanword = candidate.category !== 'title' && (sourceSpanCandidates || []).some(other =>
            other !== candidate
            && other?.sourceStart === candidate.sourceStart
            && other?.sourceEnd === candidate.sourceEnd
            && other.category === 'loanword'
            && other.romaji != null
            && other.reviewRequired !== true);
        return !strongerReviewedLoanword;
    });
    if (!matching.length) return null;

    let best = null;
    for (const candidate of matching) {
        let endIndex = -1;
        for (let index = startIndex; index < tokens.length; index += 1) {
            const token = tokens[index];
            if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) break;
            if (index > startIndex && tokens[index - 1]?.sourceEnd !== token.sourceStart) break;
            const tokenSourceEnd = Number(token.sourceEnd);
            if (tokenSourceEnd === candidate.sourceEnd) { endIndex = index; break; }
            if (tokenSourceEnd > candidate.sourceEnd) break;
        }
        if (endIndex <= startIndex) continue;
        const members = tokens.slice(startIndex, endIndex + 1);
        const reconstructed = members.map(token => String(token.surface_form || '')).join('');
        const reconstructedMatchesSource = reconstructed === candidate.sourceSurface;
        const reconstructedMatchesNameVariant = candidate?.metadata?.sourceOrthographyNameVariant === true
            && reconstructed === String(candidate?.metadata?.canonicalNameVariantSurface || '');
        if (!reconstructedMatchesSource && !reconstructedMatchesNameVariant) continue;
        // Reconstruct destructive symbol-like splits, plus ordinary token splits when
        // source-span arbitration has already established a grammatical boundary
        // immediately after the candidate. The latter prevents a derived kana-reading
        // alias from stealing the final kana of an independently established word.
        const structuredRoleConflict = sourceSpanLexicalCandidateHasStructuredRoleConflict(candidate, sourceSpanCandidates);
        const grammarBoundaryAfter = Boolean(tokens[endIndex + 1]?.sourceSpanGrammarBoundary) && !structuredRoleConflict;
        const lexicalBoundaryRelease = Boolean(members[0]?.sourceSpanLexicalBoundaryRelease);
        const corroboratedDestructiveName = isCorroboratedDestructivePersonalNameCandidate(candidate);
        const sourceOrthographyTokenizerProperName = isSourceOrthographyTokenizerProperNameCandidate(candidate);
        const sourceOrthographyAuthoritativeAteji = candidate.kind === 'ateji'
            && candidate?.metadata?.sourceOrthographyPreserved === true;
        const canonicalVariantGeneralWordConsensus = candidate?.metadata?.canonicalVariantGeneralWordConsensus === true;
        const canonicalVariantPersonConsensus = sourceSpanLexicalCandidateHasCanonicalVariantPersonConsensus(candidate);
        const corroboratedOrdinaryLexicalSpan = candidate.kind === 'kuromoji-exact-dictionary-span'
            && sourceSpanLexicalCandidateHasMaintainedGeneralWordConsensus(candidate, sourceSpanCandidates)
            && !structuredRoleConflict
            && !members.some(token => isTypedBoundaryToken(token));
        if (corroboratedDestructiveName) {
            if (!hasCorroboratedPersonalNameSourceBoundary(tokens, startIndex, endIndex, candidate)) continue;
            // A reviewed ordinary lexical reading over the same exact span remains the
            // semantic authority when it agrees with the name reading. Corroboration
            // may repair destructive name tokenisation, but must not reclassify an
            // already-settled common word (for example 百合) as a personal name.
            const candidateReading = normalizeKanaReading(candidate.reading || '');
            const settledCommonWord = (sourceSpanCandidates || []).some(other =>
                other !== candidate
                && other?.sourceStart === candidate.sourceStart
                && other?.sourceEnd === candidate.sourceEnd
                && other.kind === 'common-word'
                && other.reviewRequired !== true
                && normalizeKanaReading(other.reading || '') === candidateReading);
            if (settledCommonWord) continue;
        } else if (!members.some(token => token?.pos === '記号')
            && !grammarBoundaryAfter
            && !corroboratedOrdinaryLexicalSpan
            && !sourceOrthographyTokenizerProperName
            && !sourceOrthographyAuthoritativeAteji
            && !canonicalVariantGeneralWordConsensus
            && !canonicalVariantPersonConsensus
            && !lexicalBoundaryRelease) continue;
        if (!best || candidate.sourceEnd > best.candidate.sourceEnd
            || (candidate.sourceEnd === best.candidate.sourceEnd && Number(candidate.confidence || 0) > Number(best.candidate.confidence || 0))) {
            best = { candidate, endIndex };
        }
    }
    if (!best) return null;

    const sameSpan = matching.filter(candidate => candidate.sourceEnd === best.candidate.sourceEnd);
    const conflicting = sameSpan.some(candidate => {
        if (candidate === best.candidate || candidate.reviewRequired === true) return false;
        const leftReading = normalizeKanaReading(candidate.reading || '');
        const rightReading = normalizeKanaReading(best.candidate.reading || '');
        const readingConflict = leftReading && rightReading && leftReading !== rightReading;
        const romajiConflict = candidate.romaji != null && best.candidate.romaji != null
            && String(candidate.romaji) !== String(best.candidate.romaji);
        return readingConflict || romajiConflict;
    });
    return conflicting ? null : best;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeStrongSourceSpanLexicalCandidateTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const best = findLongestStrongSourceSpanLexicalCandidate(tokens, index, sourceSpanCandidates);
        if (!best) { merged.push(tokens[index]); continue; }
        const candidate = best.candidate;
        const properName = candidate.category === 'name';
        const canonicalVariantPersonConsensus = sourceSpanLexicalCandidateHasCanonicalVariantPersonConsensus(candidate);
        const canonicalNameTokens = candidate.kind === 'proper-noun'
            && candidate?.metadata?.canonicalVariantGeneralWordConsensus !== true
            && !canonicalVariantPersonConsensus
            && !sourceSpanLexicalCandidateHasStandaloneConsensus(candidate)
            ? getSourceSpanLexicalCandidateTokenizerConsensusTokens(candidate)
            : null;
        if (canonicalNameTokens && canonicalNameTokens.length > 1 && !canonicalNameTokens.some(token => token?.pos === '記号')) {
            merged.push(...canonicalNameTokens.map(token => offsetTokenWordPosition(token, candidate.sourceStart)));
            index = best.endIndex;
            continue;
        }
        const sameSpanHasSourceOrthographyEvidence = (sourceSpanCandidates || []).some(other =>
            other?.sourceStart === candidate.sourceStart
            && other?.sourceEnd === candidate.sourceEnd
            && other?.metadata?.sourceOrthographyPreserved === true);
        const sameSpanOrthographyReviewRequired = sameSpanHasSourceOrthographyEvidence && (sourceSpanCandidates || []).some(other =>
            other !== candidate
            && other?.sourceStart === candidate.sourceStart
            && other?.sourceEnd === candidate.sourceEnd
            && other.reviewRequired === true);
        merged.push(makeDerivedSpanToken(tokens, index, best.endIndex, {
            surface_form: candidate.sourceSurface,
            reading: candidate.reading || '*', pronunciation: candidate.reading || '*',
            pos: '名詞', pos_detail_1: properName ? '固有名詞' : '一般', pos_detail_2: properName ? (canonicalVariantPersonConsensus ? '人名' : '一般') : '*', pos_detail_3: '*',
            sourceSpanLexicalCandidateMatched: true,
            sourceSpanLexicalCandidateReading: candidate.reading || null,
            sourceSpanLexicalCandidateRomaji: candidate.romaji ?? null,
            sourceSpanLexicalCandidateKind: candidate.kind,
            sourceSpanLexicalCandidateSource: candidate.evidenceSource,
            sourceSpanLexicalCandidateConfidence: candidate.confidence,
            sourceSpanLexicalCandidateReviewRequired: sameSpanOrthographyReviewRequired
        }, {
            annotations: ['sourceSpanLexicalCandidateMatched', 'sourceSpanLexicalCandidateReading', 'sourceSpanLexicalCandidateRomaji', 'sourceSpanLexicalCandidateKind', 'sourceSpanLexicalCandidateSource', 'sourceSpanLexicalCandidateConfidence', 'sourceSpanLexicalCandidateReviewRequired'],
            evidenceSource: candidate.evidenceSource, semanticRole: candidate.semanticRole || candidate.category,
            confidence: candidate.confidence, reviewRequired: sameSpanOrthographyReviewRequired
        }));
        index = best.endIndex;
    }
    return merged;
}

function getUniqueSourceOrthographyPersonReading(candidate, options = {}) {
    if (!candidate
        || (candidate?.metadata?.sourceOrthographyPreserved !== true && candidate?.metadata?.variantEquivalentEvidence !== true)
        || candidate.category !== 'name'
        || candidate.kind !== 'proper-noun'
        || candidate.evidenceSource !== 'proper-noun-evidence') return null;
    const readings = getSourceOrthographyCandidateReadings(candidate);
    if (readings.length !== 1) return null;
    const categories = new Set(readings[0]?.categories || []);
    const fullPerson = categories.has('person');
    const personComponent = fullPerson || categories.has('per') || categories.has('char');
    if (options.requireFullPerson && !fullPerson) return null;
    if (!personComponent) return null;
    return readings[0];
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function getCorroboratedVariantFullPersonComponents(candidate, sourceSpanCandidates = []) {
    if (candidate?.metadata?.sourceOrthographyNameVariant !== true) return null;
    const whole = getUniqueSourceOrthographyPersonReading(candidate, { requireFullPerson: true });
    if (!whole) return null;
    const wholeReading = normalizeKanaReading(whole.reading || '');
    if (!wholeReading) return null;
    const start = Number(candidate.sourceStart);
    const end = Number(candidate.sourceEnd);
    const uniqueRoleReading = (item, requiredCategory) => {
        if (!item || item.category !== 'name' || item.kind !== 'proper-noun' || item.evidenceSource !== 'proper-noun-evidence') return null;
        const readings = getSourceOrthographyCandidateReadings(item);
        if (readings.length !== 1) return null;
        const categories = new Set(readings[0]?.categories || []);
        if (!categories.has(requiredCategory)) return null;
        return normalizeKanaReading(readings[0]?.reading || '') || null;
    };
    const matches = [];
    for (const surnameCandidate of sourceSpanCandidates || []) {
        if (Number(surnameCandidate?.sourceStart) !== start || Number(surnameCandidate?.sourceEnd) <= start || Number(surnameCandidate?.sourceEnd) >= end) continue;
        const surnameReading = uniqueRoleReading(surnameCandidate, 'fam');
        if (!surnameReading) continue;
        for (const givenCandidate of sourceSpanCandidates || []) {
            if (Number(givenCandidate?.sourceStart) !== Number(surnameCandidate.sourceEnd) || Number(givenCandidate?.sourceEnd) !== end) continue;
            const givenReading = uniqueRoleReading(givenCandidate, 'per');
            if (!givenReading || surnameReading + givenReading !== wholeReading) continue;
            matches.push({
                split: Number(surnameCandidate.sourceEnd),
                surnameReading,
                givenReading
            });
        }
    }
    const unique = new Map(matches.map(match => [`${match.split}|${match.surnameReading}|${match.givenReading}`, match]));
    return unique.size === 1 ? [...unique.values()][0] : null;
}

function getTokenNameReadingForRole(token) {
    const reading = normalizeKanaReading(getKuromojiDictionaryReading(token) || token?.reading || token?.pronunciation || '');
    return reading || null;
}

function isSourceOrthographySurnameRoleToken(token, reading) {
    if (!token || !reading || token.pos !== '名詞') return false;
    if (token.pos_detail_1 === '固有名詞' && token.pos_detail_2 === '人名' && token.pos_detail_3 === '姓') return true;
    const lookup = getProperNounCandidateLookup(token.surface_form);
    return (lookup.candidates || []).some(candidate =>
        (candidate.categories || new Set()).has('fam')
        && normalizeKanaReading(candidate.reading || '') === reading);
}

/**
 * Restores a source-form person-name role only when independent structure already
 * establishes that role: an exact full-person entry following a recognised surname,
 * or an exact person/given-name entry immediately followed by a reviewed honorific.
 * Raw name-bank evidence alone never gains segmentation authority here.
 * @param {CJ2RToken[]} tokens
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates
 */
function mergeSourceOrthographyPersonNameRoleTokens(tokens, sourceSpanCandidates = []) {
    const working = [...(tokens || [])];
    for (const candidate of sourceSpanCandidates || []) {
        if (candidate?.metadata?.sourceOrthographyCompatibilityIntermediate === true
            || candidate?.metadata?.sourceOrthographyEvidenceOnlyIntermediate === true
            || (candidate?.metadata?.sourceOrthographyPreserved !== true && candidate?.metadata?.variantEquivalentEvidence !== true)
            || candidate.category !== 'name'
            || candidate.kind !== 'proper-noun'
            || candidate.evidenceSource !== 'proper-noun-evidence'
            || !Number.isInteger(candidate.sourceStart)
            || !Number.isInteger(candidate.sourceEnd)) continue;

        const candidateStart = Number(candidate.sourceStart);
        const candidateEnd = Number(candidate.sourceEnd);
        let startIndex = working.findIndex(token => token?.sourceStart === candidateStart);
        if (startIndex < 0) continue;
        let endIndex = -1;
        for (let index = startIndex; index < working.length; index += 1) {
            const token = working[index];
            if (!token || !Number.isInteger(token.sourceEnd)) break;
            if (index > startIndex && working[index - 1]?.sourceEnd !== token.sourceStart) break;
            const tokenEnd = Number(token.sourceEnd);
            if (tokenEnd === candidateEnd) { endIndex = index; break; }
            if (tokenEnd > candidateEnd) break;
        }
        if (endIndex < startIndex) continue;
        const spanLength = endIndex - startIndex + 1;
        if (spanLength < 2) continue;

        const corroboratedVariantPerson = getCorroboratedVariantFullPersonComponents(candidate, sourceSpanCandidates);
        if (corroboratedVariantPerson) {
            let surnameEndIndex = -1;
            for (let index = startIndex; index <= endIndex; index += 1) {
                if (Number(working[index]?.sourceEnd) === corroboratedVariantPerson.split) { surnameEndIndex = index; break; }
            }
            if (surnameEndIndex >= startIndex && surnameEndIndex < endIndex) {
                const roleDetails = {
                    sourceOrthographyPersonNameRoleMatched: true,
                    sourceOrthographyCorroboratedVariantFullPersonNameRoleMatched: true
                };
                const roleAnnotations = ['sourceOrthographyPersonNameRoleMatched', 'sourceOrthographyCorroboratedVariantFullPersonNameRoleMatched'];
                const surname = makeDerivedSpanToken(working, startIndex, surnameEndIndex, {
                    surface_form: working.slice(startIndex, surnameEndIndex + 1).map(token => token.surface_form).join(''),
                    reading: corroboratedVariantPerson.surnameReading, pronunciation: corroboratedVariantPerson.surnameReading,
                    pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓',
                    ...roleDetails
                }, { annotations: roleAnnotations, evidenceSource: candidate.evidenceSource, semanticRole: 'person-name-structure', confidence: 0.94, reviewRequired: false });
                const given = makeDerivedSpanToken(working, surnameEndIndex + 1, endIndex, {
                    surface_form: working.slice(surnameEndIndex + 1, endIndex + 1).map(token => token.surface_form).join(''),
                    reading: corroboratedVariantPerson.givenReading, pronunciation: corroboratedVariantPerson.givenReading,
                    pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '名',
                    ...roleDetails
                }, { annotations: roleAnnotations, evidenceSource: candidate.evidenceSource, semanticRole: 'person-name-structure', confidence: 0.94, reviewRequired: false });
                working.splice(startIndex, spanLength, surname, given);
                continue;
            }
        }

        const nextToken = working[endIndex + 1] || null;
        const honorificRole = Boolean(nextToken
            && nextToken.sourceStart === candidateEnd
            && getReviewedNameHonorificReading(nextToken.surface_form));

        const fullPersonReading = getUniqueSourceOrthographyPersonReading(candidate, { requireFullPerson: true });
        if (fullPersonReading
            && candidate?.metadata?.sourceOrthographyNameVariant !== true
            && spanLength >= 2) {
            const first = working[startIndex];
            const firstReading = getTokenNameReadingForRole(first);
            const wholeReading = normalizeKanaReading(fullPersonReading.reading || '');
            if (firstReading
                && wholeReading.startsWith(firstReading)
                && wholeReading.length > firstReading.length
                && isSourceOrthographySurnameRoleToken(first, firstReading)) {
                const remainderReading = wholeReading.slice(firstReading.length);
                const derivedGiven = makeDerivedSpanToken(working, startIndex + 1, endIndex, {
                    surface_form: working.slice(startIndex + 1, endIndex + 1).map(token => token.surface_form).join(''),
                    reading: remainderReading, pronunciation: remainderReading,
                    pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '名',
                    sourceOrthographyPersonNameRoleMatched: true,
                    sourceOrthographyEquivalentPersonNameRoleMatched: candidate?.metadata?.variantEquivalentEvidence === true,
                    sourceOrthographyExactFullPersonNameRoleMatched: candidate?.metadata?.sourceOrthographyPreserved === true
                        && candidate?.metadata?.sourceOrthographyNameVariant !== true
                }, {
                    annotations: ['sourceOrthographyPersonNameRoleMatched', 'sourceOrthographyEquivalentPersonNameRoleMatched', 'sourceOrthographyExactFullPersonNameRoleMatched'],
                    evidenceSource: candidate.evidenceSource, semanticRole: 'person-name-structure',
                    confidence: 0.92, reviewRequired: false
                });
                working.splice(startIndex + 1, spanLength - 1, derivedGiven);
                if (honorificRole) {
                    const shiftedHonorific = working[startIndex + 2] || null;
                    const honorificReading = getReviewedNameHonorificReading(shiftedHonorific?.surface_form);
                    if (shiftedHonorific && honorificReading) {
                        shiftedHonorific.pos = '名詞';
                        shiftedHonorific.pos_detail_1 = '接尾';
                        shiftedHonorific.pos_detail_2 = '人名';
                        shiftedHonorific.pos_detail_3 = '*';
                        shiftedHonorific.reviewedNameHonorificMatched = true;
                        shiftedHonorific.reviewedNameHonorificReading = honorificReading;
                    }
                }
                continue;
            }
        }

        const anyPersonReading = honorificRole ? getUniqueSourceOrthographyPersonReading(candidate) : null;
        if (anyPersonReading) {
            const derived = makeDerivedSpanToken(working, startIndex, endIndex, {
                surface_form: working.slice(startIndex, endIndex + 1).map(token => token.surface_form).join(''),
                reading: anyPersonReading.reading, pronunciation: anyPersonReading.reading,
                pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '名',
                sourceOrthographyPersonNameRoleMatched: true,
                sourceOrthographyEquivalentPersonNameRoleMatched: candidate?.metadata?.variantEquivalentEvidence === true
            }, {
                annotations: ['sourceOrthographyPersonNameRoleMatched', 'sourceOrthographyEquivalentPersonNameRoleMatched'],
                evidenceSource: candidate.evidenceSource, semanticRole: 'person-name-honorific-context',
                confidence: 0.92, reviewRequired: false
            });
            working.splice(startIndex, spanLength, derived);
            const shiftedHonorific = working[startIndex + 1] || null;
            const honorificReading = getReviewedNameHonorificReading(shiftedHonorific?.surface_form);
            if (shiftedHonorific && honorificReading) {
                shiftedHonorific.pos = '名詞';
                shiftedHonorific.pos_detail_1 = '接尾';
                shiftedHonorific.pos_detail_2 = '人名';
                shiftedHonorific.pos_detail_3 = '*';
                shiftedHonorific.reviewedNameHonorificMatched = true;
                shiftedHonorific.reviewedNameHonorificReading = honorificReading;
            }
        }
    }
    return working;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeAuthoritativeSpanTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestAuthoritativeSpan(tokens, index, sourceSpanCandidates);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const evidence = bestMatch.evidence;
        const reviewedName = evidence.category === 'reviewed-name';
        const numericExpression = evidence.category === 'counter-date'
            && /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u.test(bestMatch.surface);
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: evidence.reading || '*',
            pronunciation: evidence.reading || '*',
            pos: '名詞',
            pos_detail_1: reviewedName ? '固有名詞' : '一般',
            pos_detail_2: reviewedName ? '人名' : '*',
            pos_detail_3: '*',
            authoritativeSpanMatched: true,
            authoritativeSpanReading: evidence.reading || null,
            authoritativeSpanRomaji: evidence.romaji || null,
            authoritativeSpanSource: evidence.source,
            authoritativeSpanConfidence: evidence.confidence,
            authoritativeSpanCategory: evidence.category,
            authoritativeSpanReviewRequired: Boolean(evidence.reviewRequired),
            authoritativeSpanReviewReason: evidence.reviewReason || null,
            authoritativeSpanReviewFlag: evidence.reviewFlag || null,
            authoritativeSpanAlternatives: evidence.alternatives || [],
            authoritativeSpanVariantMappings: bestMatch.variant?.mappings || [],
            numericExpression
        }, {
            annotations: ['authoritativeSpanMatched', 'authoritativeSpanReading', 'authoritativeSpanRomaji', 'authoritativeSpanSource', 'authoritativeSpanConfidence', 'authoritativeSpanCategory', 'authoritativeSpanReviewRequired', 'authoritativeSpanReviewReason', 'authoritativeSpanReviewFlag', 'authoritativeSpanAlternatives', 'authoritativeSpanVariantMappings', 'numericExpression'],
            evidenceSource: evidence.source || 'authoritative-span',
            semanticRole: evidence.category || 'authoritative-span',
            confidence: evidence.confidence,
            reviewRequired: Boolean(evidence.reviewRequired)
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function normalizePunctuation(text) {
    const map = {
        '。':'.','、':',','？':'?','！':'!','：':':','；':';','（':'(', '）':')',
        '「':'"','」':'"','『':"'",'』':"'",'【':'[','】':']','〔':'(', '〕':')',
        '〈':'<','〉':'>','《':'<<','》':'>>','〖':'[','〗':']','〘':'[','〙':']','〚':'[','〛':']',
        '〝':'"','〟':'"','〞':'"','・':' ', '～':'~', '〜':'~', '〰':'~', '―':'—', '‥':'…', '⋯':'…', '⋮':'…'
    };
    const compatible = normalizeJapanesePunctuationCompatibility(String(text || ''));
    return compatible
        .replace(/[。、？！：；（）「」『』【】〔〕〈〉《》〖〗〘〙〚〛〝〟〞・～〜〰―‥⋯⋮]/g, match => map[match] ?? match)
        .replace(/(?:…\s*){2,}/g, '…');
}

function collapseRepeatedSpaces(text) { return String(text || '').replace(/ {2,}/g, ' '); }

const SINGLE_QUOTE_OPEN_MARKER = '\uE000';
const SINGLE_QUOTE_CLOSE_MARKER = '\uE001';
const DOUBLE_QUOTE_OPEN_MARKER = '\uE002';
const DOUBLE_QUOTE_CLOSE_MARKER = '\uE003';
const JAPANESE_WAVE_DELIMITER_MARKER = '\uE005';
const JAPANESE_HORIZONTAL_BAR_MARKER = '\uE00D';

function markJapaneseWaveDelimiters(text) {
    return String(text || '').replace(/[~～〜〰]/g, JAPANESE_WAVE_DELIMITER_MARKER);
}

function restoreJapaneseWaveDelimiters(text) {
    return String(text || '').replaceAll(JAPANESE_WAVE_DELIMITER_MARKER, '~');
}

function markJapaneseHorizontalBars(text) {
    return String(text || '').replace(/―/g, JAPANESE_HORIZONTAL_BAR_MARKER);
}

function restoreJapaneseHorizontalBars(text) {
    return String(text || '').replaceAll(JAPANESE_HORIZONTAL_BAR_MARKER, '—');
}

function normalizeJapaneseSubtitleBarSpacing(text) {
    const normalizeSegment = segment => {
        const value = String(segment || '');
        if (value.split(JAPANESE_HORIZONTAL_BAR_MARKER).length !== 3) return value;
        const match = value.match(new RegExp(`^(.+?)\\s*${JAPANESE_HORIZONTAL_BAR_MARKER}\\s*(.+?)\\s*${JAPANESE_HORIZONTAL_BAR_MARKER}([.!?…]*)$`, 'u'));
        if (!match || !match[1].trim() || !match[2].trim()) return value;
        return `${match[1].trimEnd()} ${JAPANESE_HORIZONTAL_BAR_MARKER} ${match[2].trim()} ${JAPANESE_HORIZONTAL_BAR_MARKER}${match[3] || ''}`;
    };
    return String(text || '').split(JAPANESE_WAVE_DELIMITER_MARKER).map(normalizeSegment).join(JAPANESE_WAVE_DELIMITER_MARKER);
}

function markJapaneseSingleQuotes(text) {
    const value = String(text || '')
        .replace(/『/g, SINGLE_QUOTE_OPEN_MARKER)
        .replace(/』/g, SINGLE_QUOTE_CLOSE_MARKER)
        .replace(/‘/g, SINGLE_QUOTE_OPEN_MARKER);
    return value.replace(/’/g, (match, offset, source) => {
        const previous = source[offset - 1] || '';
        const next = source[offset + 1] || '';
        return /[A-Za-z]/.test(previous) && /[A-Za-z]/.test(next) ? match : SINGLE_QUOTE_CLOSE_MARKER;
    });
}

function restoreJapaneseSingleQuotes(text) {
    return String(text || '').replaceAll(SINGLE_QUOTE_OPEN_MARKER, "'").replaceAll(SINGLE_QUOTE_CLOSE_MARKER, "'");
}

function markJapaneseDoubleQuotes(text) {
    return String(text || '')
        .replace(/[「“〝]/g, DOUBLE_QUOTE_OPEN_MARKER)
        .replace(/[」”〟〞]/g, DOUBLE_QUOTE_CLOSE_MARKER);
}

function restoreJapaneseDoubleQuotes(text) {
    return String(text || '').replaceAll(DOUBLE_QUOTE_OPEN_MARKER, '"').replaceAll(DOUBLE_QUOTE_CLOSE_MARKER, '"');
}

function normalizeSentenceSpacing(text) {
    const EMAIL_DOT_MARKER = '\uE004';
    const INTERNAL_DOT_MARKER = '\uE006';
    const INTERNAL_COMMA_MARKER = '\uE007';
    const INTERNAL_COLON_MARKER = '\uE008';
    const URL_QUESTION_MARKER = '\uE009';
    const URL_SEMICOLON_MARKER = '\uE00A';
    const URL_EXCLAMATION_MARKER = '\uE00B';
    const URL_COMMA_MARKER = '\uE00C';
    const protectUrlPunctuation = match => match
        .replace(/\?/g, URL_QUESTION_MARKER)
        .replace(/;/g, URL_SEMICOLON_MARKER)
        .replace(/!/g, URL_EXCLAMATION_MARKER)
        .replace(/,/g, URL_COMMA_MARKER);
    let value = String(text || '')
        .replace(/\bhttps?:\/\/[^\s"'<>]+/gi, protectUrlPunctuation)
        .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, match => match.replace(/\./g, EMAIL_DOT_MARKER))
        .replace(/(?<=[A-Za-z0-9])\.(?=[A-Za-z0-9])/g, INTERNAL_DOT_MARKER)
        .replace(/(?<=[0-9]),(?=[0-9])/g, INTERNAL_COMMA_MARKER)
        .replace(/(?<=[0-9]):(?=[0-9])/g, INTERNAL_COLON_MARKER)
        .replace(/\s+([,.;:?!…\)\]\}>])/g, '$1')
        .replace(/([,.;:?!])(?=[A-Za-z0-9])/g, '$1 ')
        .replace(/…\s*(?=[A-Za-z0-9])/g, '… ')
        .replace(/([\(\[\{<])\s+/g, '$1')
        .replace(new RegExp(`${SINGLE_QUOTE_OPEN_MARKER}\\s+`, 'g'), SINGLE_QUOTE_OPEN_MARKER)
        .replace(new RegExp(`\\s+${SINGLE_QUOTE_CLOSE_MARKER}`, 'g'), SINGLE_QUOTE_CLOSE_MARKER)
        .replace(new RegExp(`([A-Za-z0-9])${SINGLE_QUOTE_OPEN_MARKER}`, 'g'), `$1 ${SINGLE_QUOTE_OPEN_MARKER}`)
        .replace(new RegExp(`${SINGLE_QUOTE_CLOSE_MARKER}(?=[A-Za-z0-9])`, 'g'), `${SINGLE_QUOTE_CLOSE_MARKER} `)
        .replace(new RegExp(`${DOUBLE_QUOTE_OPEN_MARKER}\\s+`, 'g'), DOUBLE_QUOTE_OPEN_MARKER)
        .replace(new RegExp(`\\s+${DOUBLE_QUOTE_CLOSE_MARKER}`, 'g'), DOUBLE_QUOTE_CLOSE_MARKER)
        .replace(new RegExp(`([A-Za-z0-9])${DOUBLE_QUOTE_OPEN_MARKER}`, 'g'), `$1 ${DOUBLE_QUOTE_OPEN_MARKER}`)
        .replace(new RegExp(`${DOUBLE_QUOTE_CLOSE_MARKER}(?=[A-Za-z0-9])`, 'g'), `${DOUBLE_QUOTE_CLOSE_MARKER} `)
        .replace(new RegExp(`([,.;:?!])(?=${SINGLE_QUOTE_OPEN_MARKER}|${DOUBLE_QUOTE_OPEN_MARKER})`, 'g'), '$1 ')
        .replace(/\s{2,}/g, ' ')
        .trimEnd();

    // Literal ASCII double quotes remain supported for already-Western text.
    value = value.replace(/\s*"\s*/g, '"');
    let rebuilt = '';
    let inQuote = false;
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (character !== '"') {
            rebuilt += character;
            continue;
        }
        if (!inQuote) {
            if (rebuilt && !/[\s\(\[\{<]/.test(rebuilt.slice(-1))) rebuilt += ' ';
            rebuilt += '"';
            inQuote = true;
        } else {
            rebuilt = rebuilt.replace(/\s+$/g, '');
            rebuilt += '"';
            inQuote = false;
            const next = value[index + 1] || '';
            if (next && !/\s/.test(next) && /[A-Za-z0-9]/.test(next)) rebuilt += ' ';
        }
    }

    // Delimiter-like punctuation has an explicit, stable output layout.
    rebuilt = rebuilt
        .replace(new RegExp(`\\s*${JAPANESE_WAVE_DELIMITER_MARKER}\\s*`, 'g'), ` ${JAPANESE_WAVE_DELIMITER_MARKER} `)
        .replace(new RegExp(`\\s*${JAPANESE_HORIZONTAL_BAR_MARKER}\\s*`, 'g'), JAPANESE_HORIZONTAL_BAR_MARKER)
        .replace(/\s*([—–])\s*/g, '$1')
        .replace(/\s*\|\s*/g, ' | ');
    rebuilt = normalizeJapaneseSubtitleBarSpacing(rebuilt)
        .replace(new RegExp(`\\s*${JAPANESE_WAVE_DELIMITER_MARKER}\\s*`, 'g'), ` ${JAPANESE_WAVE_DELIMITER_MARKER} `);

    for (const openMarker of [SINGLE_QUOTE_OPEN_MARKER, DOUBLE_QUOTE_OPEN_MARKER]) {
        rebuilt = rebuilt.replaceAll(`${openMarker} ${JAPANESE_WAVE_DELIMITER_MARKER}`, `${openMarker}${JAPANESE_WAVE_DELIMITER_MARKER}`);
    }
    for (const closeMarker of [SINGLE_QUOTE_CLOSE_MARKER, DOUBLE_QUOTE_CLOSE_MARKER]) {
        rebuilt = rebuilt.replaceAll(`${JAPANESE_WAVE_DELIMITER_MARKER} ${closeMarker}`, `${JAPANESE_WAVE_DELIMITER_MARKER}${closeMarker}`);
    }

    // Keep punctuation runs tight, but restore an external word boundary after
    // closing brackets/quotes and before opening brackets when ordinary words abut them.
    rebuilt = rebuilt
        .replace(/\s+([,.;:?!…\)\]\}>])/g, '$1')
        .replace(/([A-Za-z0-9])(?=[\(\[\{])/g, '$1 ')
        .replace(/([\)\]\}])(?=[A-Za-z0-9])/g, '$1 ')
        .replace(/([,.;:?!])(?=[A-Za-z0-9])/g, '$1 ')
        .replace(/…\s*(?=[A-Za-z0-9])/g, '… ');

    return rebuilt.replace(/ {2,}/g, ' ')
        .replace(/(?<=\d),\s+(?=\d{3}(?:\D|$))/g, ',')
        .replace(/(?<=\d):\s+(?=\d{2}(?:\D|$))/g, ':')
        .replaceAll(EMAIL_DOT_MARKER, '.')
        .replaceAll(INTERNAL_DOT_MARKER, '.')
        .replaceAll(INTERNAL_COMMA_MARKER, ',')
        .replaceAll(INTERNAL_COLON_MARKER, ':')
        .replaceAll(URL_QUESTION_MARKER, '?')
        .replaceAll(URL_SEMICOLON_MARKER, ';')
        .replaceAll(URL_EXCLAMATION_MARKER, '!')
        .replaceAll(URL_COMMA_MARKER, ',')
        .trim();
}

function hasTerminalPairedWaveDelimiter(sourceText) {
    const source = canonicalizeTokenizerBoundaryCharacters(String(sourceText || '')).trim();
    const positions = [];
    for (let index = 0; index < source.length; index += 1) if (source[index] === '~') positions.push(index);
    if (positions.length < 2) return false;
    const closeIndex = positions[positions.length - 1];
    const openIndex = positions[positions.length - 2];
    const inner = source.slice(openIndex + 1, closeIndex).trim();
    const trailing = source.slice(closeIndex + 1);
    return Boolean(inner) && /^[。！？.!?…'"」』）】〕〉》\]\)}]*$/u.test(trailing);
}

function normalizeTerminalPairedWaveSpacing(text, sourceText) {
    if (!hasTerminalPairedWaveDelimiter(sourceText)) return String(text || '');
    const value = String(text || '');
    const closeIndex = value.lastIndexOf(JAPANESE_WAVE_DELIMITER_MARKER);
    if (closeIndex < 0) return value;
    const openIndex = value.lastIndexOf(JAPANESE_WAVE_DELIMITER_MARKER, closeIndex - 1);
    if (openIndex < 0) return value;
    const inner = value.slice(openIndex + 1, closeIndex).trim();
    if (!inner) return value;
    const prefix = value.slice(0, openIndex).trimEnd();
    const suffix = value.slice(closeIndex + 1).trimStart();
    return `${prefix}${prefix ? ' ' : ''}${JAPANESE_WAVE_DELIMITER_MARKER}${inner}${JAPANESE_WAVE_DELIMITER_MARKER}${suffix}`;
}

function hasTerminalPairedAsciiHyphenDelimiter(sourceText) {
    const source = normalizeJapanesePunctuationCompatibility(String(sourceText || '')).trim();
    const closeIndex = source.lastIndexOf('-');
    if (closeIndex < 0 || !/^[。！？.!?…'"」』）】〕〉》\]\)}]*$/u.test(source.slice(closeIndex + 1))) return false;
    for (let openIndex = closeIndex - 1; openIndex >= 0; openIndex -= 1) {
        if (source[openIndex] !== '-') continue;
        if (openIndex > 0 && !/\s/u.test(source[openIndex - 1])) continue;
        if (!source.slice(openIndex + 1, closeIndex).trim()) continue;
        return true;
    }
    return false;
}

function normalizeTerminalPairedAsciiHyphenSegment(text, sourceText) {
    if (!hasTerminalPairedAsciiHyphenDelimiter(sourceText)) return String(text || '');
    const value = String(text || '');
    const leading = value.match(/^\s*/u)?.[0] || '';
    const trailing = value.match(/\s*$/u)?.[0] || '';
    const coreEnd = Math.max(leading.length, value.length - trailing.length);
    const core = value.slice(leading.length, coreEnd);
    const closeIndex = core.lastIndexOf('-');
    if (closeIndex < 0) return value;
    let openIndex = -1;
    for (let index = closeIndex - 1; index >= 0; index -= 1) {
        if (core[index] === '-') { openIndex = index; break; }
    }
    if (openIndex < 0) return value;
    const inner = core.slice(openIndex + 1, closeIndex).trim();
    if (!inner) return value;
    const prefix = core.slice(0, openIndex).trimEnd();
    const suffix = core.slice(closeIndex + 1).trimStart();
    return `${leading}${prefix}${prefix ? ' ' : ''}-${inner}-${suffix}${trailing}`;
}

function normalizeTerminalPairedAsciiHyphenSpacing(text, sourceText) {
    const outputSegments = String(text || '').split(JAPANESE_WAVE_DELIMITER_MARKER);
    const sourceSegments = canonicalizeTokenizerBoundaryCharacters(String(sourceText || '')).split('~');
    if (outputSegments.length !== sourceSegments.length) return normalizeTerminalPairedAsciiHyphenSegment(text, sourceText);
    return outputSegments
        .map((segment, index) => normalizeTerminalPairedAsciiHyphenSegment(segment, sourceSegments[index]))
        .join(JAPANESE_WAVE_DELIMITER_MARKER);
}

function normalizeSourceColonSpacing(text, sourceText) {
    const output = String(text || '');
    const source = String(sourceText || '');
    const sourceColons = [];
    const outputColons = [];
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] === ':' || source[index] === '：') sourceColons.push({ index, ascii: source[index] === ':' });
    }
    for (let index = 0; index < output.length; index += 1) if (output[index] === ':') outputColons.push(index);
    if (!sourceColons.length || sourceColons.length !== outputColons.length) return output;
    let value = output;
    for (let pairIndex = sourceColons.length - 1; pairIndex >= 0; pairIndex -= 1) {
        const sourceColon = sourceColons[pairIndex];
        if (!sourceColon.ascii || /\s/u.test(source[sourceColon.index + 1] || '')) continue;
        const outputIndex = outputColons[pairIndex];
        value = value.slice(0, outputIndex + 1) + value.slice(outputIndex + 1).replace(/^\s+/u, '');
    }
    return value;
}

function normalizeRule0OutputPunctuation(text, sourceText = text) {
    const compatible = normalizeJapanesePunctuationCompatibility(text);
    const marked = markJapaneseHorizontalBars(markJapaneseWaveDelimiters(markJapaneseDoubleQuotes(markJapaneseSingleQuotes(compatible))));
    let spaced = normalizeSentenceSpacing(collapseRepeatedSpaces(normalizePunctuation(marked)));
    spaced = normalizeSourceColonSpacing(spaced, sourceText);
    spaced = normalizeTerminalPairedWaveSpacing(spaced, sourceText);
    spaced = normalizeTerminalPairedAsciiHyphenSpacing(spaced, sourceText);
    return restoreJapaneseHorizontalBars(restoreJapaneseDoubleQuotes(restoreJapaneseSingleQuotes(restoreJapaneseWaveDelimiters(spaced))));
}

function findExactOverride(candidateText, overrideMap) {
    const text = String(candidateText || '');
    const trimmed = text.trim();
    if (hasOwn.call(overrideMap, text)) return { value: overrideMap[text], directMatch: true };
    if (trimmed !== text && hasOwn.call(overrideMap, trimmed)) return { value: overrideMap[trimmed], directMatch: true };
    const { coreText } = splitTrailingPunctuation(text);
    if (coreText !== text && hasOwn.call(overrideMap, coreText)) return { value: overrideMap[coreText], directMatch: false };
    return null;
}

function getParticleReading(token) {
    if (!isParticle(token)) return null;
    return { 'は':'わ', 'へ':'え', 'を':'お' }[token.surface_form] || null;
}

function getLoanwordReviewFlag(token) {
    if (!token || isParticle(token) || isGrammaticalToken(token)) return null;
    const metadata = getLoanwordMetadataForToken(token);
    if (!metadata?.requiresReview) return null;
    const canonicalOutput = getLoanwordOutputForToken(token);
    const hasMaterialAlternate = metadata.ambiguitySignificance === 'material'
        || (metadata.alternates || []).some(item => item.significance === 'material');
    if (canonicalOutput && hasMaterialAlternate) {
        return token.contextualLoanwordEvidenceMatched ? null : 'loanword-source-ambiguous';
    }
    return 'missing-source-spelling-evidence';
}

function needsSourceSpellingReview(token) {
    return getLoanwordReviewFlag(token) === 'missing-source-spelling-evidence';
}

const REVIEW_SIGNAL_POLICY = Object.freeze({
    'exact-dictionary-rescue': { category: 'evidence', requiresReview: false, rationale: 'Reviewed dictionary rescue.' },
    'fallback-reading': { category: 'evidence', requiresReview: false, rationale: 'Lower-confidence but permitted fallback evidence.' },
    'historical-kana-attested': { category: 'historical-orthography', requiresReview: false, rationale: 'Attested historical-kana evidence.' },
    'source-span-kana-evidence': { category: 'tokenisation', requiresReview: false, rationale: 'Kana lexical evidence was selected independently of Kuromoji boundaries.' },
    'orthographic-particle-inferred': { category: 'grammar', requiresReview: true, rationale: 'Katakana particle orthography was selected from a syntactic frame after the tokenizer did not identify it as grammar.' },
    'orthographic-pronunciation': { category: 'orthography', requiresReview: false, rationale: 'Safe orthographic pronunciation evidence.' },
    'rendaku-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested Rendaku evidence.' },
    'rendaku-blocked-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested non-Rendaku evidence.' },
    'variant-reading-evidence': { category: 'orthography', requiresReview: false, rationale: 'Reviewed character-variant evidence.' },
    'reviewed-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A reviewed preferred reading was selected while legitimate alternatives remain.' },
    'numeric-role-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A numeric/counter role remains incompatible with a viable lexical interpretation.' },
    'temporal-role-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A temporal surface retains more than one structurally valid role after contextual resolution.' },
    'reviewed-numeric-alias': { category: 'orthography', requiresReview: false, rationale: 'A reviewed numeric orthographic alias was resolved through canonical numeric context.' },
    'proper-noun-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible proper-name readings remain.' },
    'general-word-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible general-word readings remain.' },
    'general-word-coverage-incomplete': { category: 'evidence-coverage', requiresReview: false, rationale: 'The compact general-word bank does not prove that all applicable readings for this spelling are represented; final review policy is decided by reading arbitration.' },
    'general-word-alternative': { category: 'ambiguity', requiresReview: true, rationale: 'Alternative general-word readings are materially plausible.' },
    'general-word-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'General-word evidence conflicts with the selected reading.' },
    'whole-word-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Whole-word evidence does not resolve one reading.' },
    'contextual-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Structured sentence context does not distinguish the supported readings strongly enough.' },
    'sentence-context-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'The final sentence-level verification pass still cannot distinguish the supported readings safely.' },
    'reading-evidence-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'Independent reading evidence conflicts with the selected reading.' },
    'missing-source-spelling-evidence': { category: 'source-spelling', requiresReview: true, rationale: 'Source-language spelling is required but not established.' },
    'loanword-source-ambiguous': { category: 'source-spelling', requiresReview: true, rationale: 'A canonical source-language spelling is available, but a materially plausible donor alternative remains unresolved by context.' },
    'unreviewed-country-language-form': { category: 'lexical-policy', requiresReview: true, rationale: 'A country name followed by 語 lacks reviewed whole-span language evidence and therefore stays in Japanese romanisation pending review.' },
    'name-context-ambiguous': { category: 'name-context', requiresReview: true, rationale: 'Name-like context is not backed by reviewed whole-name evidence.' },
    'unresolved-reading': { category: 'unresolved', requiresReview: true, rationale: 'No safe reading was resolved.' },
    'japanese-han-scope-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'The character is positively in Japanese scope; the best evidence-backed candidate is emitted while legitimate alternatives remain.' },
    'kanji-compositional-fallback': { category: 'ambiguity', requiresReview: true, rationale: 'No whole-word reading evidence resolved the Han span, so character-level Japanese reading evidence was composed as a reviewable fallback.' },
    'unknown-han-scope': { category: 'scope', requiresReview: true, rationale: 'Han input lacks positive Japanese-use evidence and is not eligible for guessed Japanese reading resolution.' },
    'unsupported-script': { category: 'unsupported-script', requiresReview: true, rationale: 'The source contains unsupported non-Latin script.' },
    'kanji-output-blocked': { category: 'output-guard', requiresReview: true, rationale: 'The output guard blocked unresolved Han.' },
    'nonlatin-output-blocked': { category: 'output-guard', requiresReview: true, rationale: 'The output guard blocked unresolved non-Latin script.' },
    'terminal-sokuon-review': { category: 'sokuon', requiresReview: true, rationale: 'A terminal sokuon has no following consonant to double and requires review.' },
    'repeated-sokuon-review': { category: 'sokuon', requiresReview: true, rationale: 'Repeated sokuon is stylised and requires review.' },
    'non-geminative-sokuon-review': { category: 'sokuon', requiresReview: true, rationale: 'Sokuon before a non-geminative unit cannot use normal consonant doubling and requires review.' },
    'historical-full-size-sokuon-ambiguity': { category: 'historical-orthography', requiresReview: true, rationale: 'Historical full-sized つ/ツ could represent a geminate without attested evidence.' },
    'numeric-literal-lexical-ambiguity': { category: 'numeric-lexical', requiresReview: true, rationale: 'A numeral-shaped surface is being used lexically or as a name.' },
    'iteration-mark-unattested': { category: 'orthography', requiresReview: true, rationale: 'An iteration mark repeats preceding Japanese material, but the resulting word-level reading is not backed by reviewed evidence.' },
    'japanese-orthography-unresolved': { category: 'orthography', requiresReview: true, rationale: 'The source uses recognised Japanese orthography, but no safe contextual reading was resolved.' },
    'tokenisation-boundary-ambiguous': { category: 'tokenisation', requiresReview: true, rationale: 'Two evidence-backed token boundaries remain plausible, so the selected segmentation requires review.' },
    'kana-tokenisation-boundary-unreviewed': { category: 'tokenisation', requiresReview: true, rationale: 'A contiguous Katakana span was split into lexical tokens without reviewed boundary evidence, so the tokenizer boundary requires review.' },
    'structural-boundary-uncertain': { category: 'tokenisation', requiresReview: true, rationale: 'The final word boundary rests only on tokenizer segmentation between contiguous lexical material and remains reviewable.' },
    'final-boundary-invariant-violation': { category: 'output-consistency', requiresReview: true, rationale: 'Final rendered boundary metadata contradicts retained lexical, grammatical or morphological evidence.' },
    'unreviewed-cross-notation': { category: 'mixed-script', requiresReview: true, rationale: 'The × notation is preserved because no reviewed title/context evidence establishes whether it is silent, spoken, or rendered as a separator.' },
    'censored-source-text': { category: 'source-redaction', requiresReview: true, rationale: 'A Japanese redaction mark is preserved literally because the hidden source characters and their reading cannot be reconstructed safely.' }
});

const DEFAULT_REVIEW_SIGNAL_POLICY = Object.freeze({
    category: 'unclassified',
    requiresReview: true,
    rationale: 'Unclassified uncertainty signals require review until a policy is registered.'
});

function getReviewSignalPolicy(flag) {
    return REVIEW_SIGNAL_POLICY[String(flag || '')] || DEFAULT_REVIEW_SIGNAL_POLICY;
}

const WEAK_LEXICAL_REVIEW_FLAGS = Object.freeze(new Set([
    'general-word-alternative',
    'whole-word-reading-ambiguous'
]));

const ROLE_RESOLVABLE_LEXICAL_REVIEW_FLAGS = Object.freeze(new Set([
    'contextual-reading-ambiguous',
    'general-word-alternative',
    'general-word-conflict',
    'reading-evidence-conflict',
    'sentence-context-ambiguous',
    'whole-word-reading-ambiguous'
]));

const PRODUCTIVE_COUNTER_REVIEW_SURFACES = Object.freeze(new Set([
    '人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階'
]));

function transitionReviewSignal(signal, state, details = {}) {
    const nextState = String(state || signal?.state || 'candidate');
    const lifecycle = Array.isArray(signal?.lifecycle) && signal.lifecycle.length
        ? [...signal.lifecycle]
        : [String(signal?.state || 'candidate')];
    if (lifecycle[lifecycle.length - 1] !== nextState) lifecycle.push(nextState);
    const policyRequiresReview = Boolean(signal?.policyRequiresReview ?? getReviewSignalPolicy(signal?.flag).requiresReview);
    return {
        ...signal,
        ...details,
        policyRequiresReview,
        state: nextState,
        lifecycle,
        requiresReview: policyRequiresReview && nextState === 'final-active'
    };
}

/** @returns {CJ2RReviewSignal} */
function makeReviewSignal(surface, flag, source, confidence, options = {}) {
    const policy = getReviewSignalPolicy(flag);
    const initialState = options.state || (policy.requiresReview ? 'candidate' : 'resolved');
    const sourceStart = Number.isInteger(options.sourceStart) ? options.sourceStart : null;
    const sourceEnd = Number.isInteger(options.sourceEnd) ? options.sourceEnd : null;
    return {
        surface: String(surface || ''),
        flag: String(flag || ''),
        reasonCode: String(options.reasonCode || flag || 'unclassified'),
        source: String(source || 'unresolved'),
        evidenceSource: String(options.evidenceSource || source || 'unresolved'),
        confidence: Number(confidence ?? 0),
        category: policy.category,
        sourceStart,
        sourceEnd,
        sourceSurface: options.sourceSurface == null ? null : String(options.sourceSurface),
        policyRequiresReview: policy.requiresReview,
        requiresReview: policy.requiresReview && initialState === 'final-active',
        rationale: policy.rationale,
        state: initialState,
        lifecycle: [initialState],
        resolutionReason: options.resolutionReason || null,
        supersededBy: options.supersededBy || null
    };
}

function makeReviewSignals(surface, source, confidence, flags, options = {}) {
    return [...new Set(Array.isArray(flags) ? flags : [])].map(flag => makeReviewSignal(surface, flag, source, confidence, options));
}

function getReviewSignalOwnership(token, flag = '') {
    if (flag === 'name-context-ambiguous'
        && Number.isInteger(token?.nameContextSourceStart)
        && Number.isInteger(token?.nameContextSourceEnd)) {
        return {
            sourceStart: token.nameContextSourceStart,
            sourceEnd: token.nameContextSourceEnd,
            sourceSurface: token.nameContextSourceSurface ?? token?.sourceSurface ?? token?.surface_form ?? null
        };
    }
    return {
        sourceStart: Number.isInteger(token?.sourceStart) ? token.sourceStart : null,
        sourceEnd: Number.isInteger(token?.sourceEnd) ? token.sourceEnd : null,
        sourceSurface: token?.sourceSurface ?? token?.surface_form ?? null
    };
}

function getResolutionReviewSignals(resolution, surface, token = null) {
    const source = resolution?.source || 'unresolved';
    const confidence = Number(resolution?.confidence ?? 0);
    const flags = [...new Set(Array.isArray(resolution?.flags) ? resolution.flags : [])];
    const ownership = getReviewSignalOwnership(token);
    const existing = Array.isArray(resolution?.reviewSignals) ? resolution.reviewSignals.map(signal => ({
        ...signal,
        reasonCode: String(signal?.reasonCode || signal?.flag || 'unclassified'),
        evidenceSource: String(signal?.evidenceSource || signal?.source || source),
        sourceStart: Number.isInteger(signal?.sourceStart) ? signal.sourceStart : ownership.sourceStart,
        sourceEnd: Number.isInteger(signal?.sourceEnd) ? signal.sourceEnd : ownership.sourceEnd,
        sourceSurface: signal?.sourceSurface ?? ownership.sourceSurface,
        lifecycle: [...(signal.lifecycle || [])]
    })) : [];
    const represented = new Set(existing.map(signal => signal.flag));
    for (const flag of flags.filter(item => !represented.has(item))) {
        existing.push(makeReviewSignal(surface, flag, source, confidence, getReviewSignalOwnership(token, flag)));
    }
    return existing;
}

function isReviewTransparentWrapperToken(token) {
    const surface = String(token?.surface_form || '');
    return Boolean(surface && /^[「」『』（）()［］\[\]【】〈〉《》〔〕〘〙〚〛“”‘’〝〟〞"']+$/u.test(surface));
}

function isReviewContextBoundaryToken(token) {
    const surface = String(token?.surface_form || '');
    if (!surface || isReviewTransparentWrapperToken(token)) return false;
    for (let index = 0; index < surface.length; index += 1) {
        if (isCanonicalHardBoundaryAt(surface, index)) return true;
    }
    return false;
}

function sourceSpanCandidateHasDistinctReadings(candidate) {
    const readings = new Set();
    const direct = normalizeKanaReading(candidate?.reading || '');
    if (direct) readings.add(direct);
    for (const alternative of candidate?.alternatives || []) {
        const reading = normalizeKanaReading(alternative?.reading || '');
        if (reading) readings.add(reading);
    }
    return readings.size > 1;
}

function getUnresolvedAmbiguousSourceSpansForToken(token, sourceSpanCandidates = []) {
    return (sourceSpanCandidates || []).filter(candidate =>
        candidate?.reviewRequired === true
        && sourceSpanCandidateContainsToken(candidate, token)
        && sourceSpanCandidateHasDistinctReadings(candidate));
}

function hasIndependentSentenceContext(tokenResults, tokenIndex, sourceSpanCandidates = []) {
    const tokens = tokenResults || [];
    const token = tokens[tokenIndex] || null;
    const unresolvedSpans = getUnresolvedAmbiguousSourceSpansForToken(token, sourceSpanCandidates);
    for (const direction of [-1, 1]) {
        for (let index = tokenIndex + direction; index >= 0 && index < tokens.length; index += direction) {
            const neighbour = tokens[index];
            if (!neighbour) continue;
            if (isReviewContextBoundaryToken(neighbour)) break;
            const surface = String(neighbour.surface_form || '');
            if (!surface || (neighbour.pos === '記号' && !/[\p{L}\p{N}]/u.test(surface))) continue;
            if (unresolvedSpans.some(candidate => sourceSpanCandidateContainsToken(candidate, neighbour))) continue;
            return true;
        }
    }
    return false;
}

function isContextSelectedLexicalResolution(resolution) {
    const source = String(resolution?.source || '');
    return source === 'contextual-reading-evidence'
        || source.startsWith('sentence-context-verification+');
}

function isOpenClassNominalToken(token) {
    return Boolean(token
        && token.pos === '名詞'
        && !isParticle(token)
        && !isGrammaticalToken(token)
        && !isPrefix(token)
        && !isSuffix(token));
}

function isTypedBoundaryToken(token) {
    const resolutionSource = String(token?.readingResolution?.source || '');
    return Boolean(token && (
        token.typedTemporalExpressionMatched
        || token.typedNumericExpressionMatched
        || token.numericExpression
        || token.typedTemporalExpressionType
        || token.typedNumericExpressionType
        || resolutionSource.startsWith('typed-')
        || resolutionSource.startsWith('counter-date-reading-evidence')
        || resolutionSource.startsWith('reviewed-numeric-alias')
    ));
}

function isNominalCompoundNeighbor(token) {
    if (!isOpenClassNominalToken(token) || isTypedBoundaryToken(token)) return false;
    const surface = String(token?.surface_form || '');
    const resolutionSource = String(token?.readingResolution?.source || '');
    if (/^[ぁ-ゖァ-ンヴー]+$/u.test(surface) && resolutionSource === 'written-kana') return false;
    return true;
}

function hasUnresolvedNominalCompoundAdjacency(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    if (!isOpenClassNominalToken(token) || isTypedBoundaryToken(token)) return false;
    for (const neighborIndex of [tokenIndex - 1, tokenIndex + 1]) {
        const neighbor = tokenResults?.[neighborIndex];
        if (!isNominalCompoundNeighbor(neighbor)) continue;
        const left = neighborIndex < tokenIndex ? neighbor : token;
        const right = neighborIndex < tokenIndex ? token : neighbor;
        const leftPosition = Number(left?.word_position || 0);
        const rightPosition = Number(right?.word_position || 0);
        if (leftPosition > 0 && rightPosition > 0) {
            const expectedRightPosition = leftPosition + Array.from(String(left.surface_form || '')).length;
            if (rightPosition === expectedRightPosition) return true;
            continue;
        }
        return true;
    }
    return false;
}

function hasUnresolvedMorphologicalCompoundAdjacency(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex] || null;
    const next = tokenResults?.[tokenIndex + 1] || null;
    const isCompoundJoin = item => Boolean(
        item?.morphologicalJoinLeft
        && String(item.morphologicalJoinReason || '') === 'continuative-stem-compound-verb'
        && /morphology/u.test(String(item.morphologicalJoinAuthority || ''))
    );
    return Boolean(isCompoundJoin(token) || isCompoundJoin(next));
}

function hasSingleMaintainedGeneralWordReading(resolution) {
    const selectedReading = normalizeKanaReading(resolution?.reading || '');
    if (!selectedReading) return false;
    const maintainedReadings = new Set((resolution?.candidates || [])
        .filter(candidate => candidate?.sources instanceof Set ? candidate.sources.has('jitendex-general-word') : Array.isArray(candidate?.sources) && candidate.sources.includes('jitendex-general-word'))
        .map(candidate => normalizeKanaReading(candidate?.reading || ''))
        .filter(Boolean));
    return maintainedReadings.size === 1 && maintainedReadings.has(selectedReading);
}

function shouldSupersedeWeakLexicalSignal(signal, resolution, tokenResults, tokenIndex, tokenSignals, sourceSpanCandidates = []) {
    if (!WEAK_LEXICAL_REVIEW_FLAGS.has(signal?.flag)) return false;
    if (!resolution?.reading || resolution?.ambiguous || Number(resolution?.confidence || 0) < 0.75) return false;
    if (!hasIndependentSentenceContext(tokenResults, tokenIndex, sourceSpanCandidates)) return false;
    if (!isContextSelectedLexicalResolution(resolution) && !hasSingleMaintainedGeneralWordReading(resolution)) return false;
    const token = tokenResults?.[tokenIndex] || null;
    const generalAssessment = assessGeneralWordReading(token, resolution.reading);
    const generalLookup = token ? getGeneralWordLookup(token.surface_form) : null;
    if (generalAssessment?.matched
        && Number(generalAssessment.matchedIndex || 0) > 0
        && Boolean(generalLookup?.entry?.mergeSafe)) return false;
    if (hasUnresolvedNominalCompoundAdjacency(tokenResults, tokenIndex)) return false;
    if (hasUnresolvedMorphologicalCompoundAdjacency(tokenResults, tokenIndex)) return false;
    const strongerActiveSignal = (tokenSignals || []).some(other =>
        other !== signal
        && Boolean(other?.policyRequiresReview ?? getReviewSignalPolicy(other?.flag).requiresReview)
        && !WEAK_LEXICAL_REVIEW_FLAGS.has(other?.flag)
    );
    return !strongerActiveSignal;
}

function sourceSpanCandidateContainsToken(candidate, token) {
    return Boolean(candidate
        && Number.isInteger(candidate.sourceStart)
        && Number.isInteger(candidate.sourceEnd)
        && Number.isInteger(token?.sourceStart)
        && Number.isInteger(token?.sourceEnd)
        && candidate.sourceStart <= token.sourceStart
        && candidate.sourceEnd >= token.sourceEnd);
}

function hasResolvedClockHalfStructure(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const next = tokenResults?.[tokenIndex + 1];
    if (!token || !next || !isJapaneseNumeralSurface(token.surface_form || '')) return false;
    if (String(next.surface_form || '') !== '時半') return false;
    if (next.outputBoundaryBefore !== 'join' || next.outputBoundaryRequiresReview) return false;
    if (next.outputBoundaryReason !== 'suffix-boundary' || next.outputBoundaryAuthority !== 'morphology') return false;
    return normalizeKanaReading(next.readingResolution?.reading || next.reading || '') === 'じはん';
}

function hasResolvedNumericStructure(tokenResults, tokenIndex, sourceSpanCandidates) {
    const token = tokenResults?.[tokenIndex];
    if (!token || token.typedNumericRoleReviewRequired || token.outputBoundaryRequiresReview) return false;
    if (token.outputBoundaryAuthority === 'typed-numeric') return true;
    if (hasResolvedClockHalfStructure(tokenResults, tokenIndex)) return true;
    const next = tokenResults?.[tokenIndex + 1];
    if (next?.outputBoundaryAuthority === 'typed-numeric' && !next.outputBoundaryRequiresReview) return true;
    if (isJapaneseNumeralSurface(token.surface_form || '')
        && PRODUCTIVE_COUNTER_REVIEW_SURFACES.has(String(next?.surface_form || ''))
        && next?.suffix
        && next?.outputBoundaryBefore === 'join'
        && next?.outputBoundaryReason === 'suffix-boundary'
        && next?.outputBoundaryAuthority === 'morphology'
        && !next?.outputBoundaryRequiresReview) {
        return (sourceSpanCandidates || []).some(candidate =>
            candidate?.category === 'numeric'
            && candidate.reviewRequired !== true
            && sourceSpanCandidateContainsToken(candidate, token));
    }
    return false;
}

function hasResolvedProductiveCounterContext(tokenResults, tokenIndex, sourceSpanCandidates) {
    const token = tokenResults?.[tokenIndex];
    const previous = tokenResults?.[tokenIndex - 1];
    if (!token || !previous || !PRODUCTIVE_COUNTER_REVIEW_SURFACES.has(String(token.surface_form || ''))) return false;
    if (token.outputBoundaryBefore !== 'join' || token.outputBoundaryRequiresReview || token.typedNumericRoleReviewRequired) return false;
    if (!['suffix-boundary', 'numeric-assembly-rule', 'typed-numeric-boundary'].includes(String(token.outputBoundaryReason || ''))
        && token.outputBoundaryAuthority !== 'typed-numeric') return false;
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'numeric'
        && candidate.reviewRequired !== true
        && sourceSpanCandidateContainsToken(candidate, previous));
}

function hasResolvedMorphologicalPrefixRole(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const next = tokenResults?.[tokenIndex + 1];
    const structuralPrefix = Boolean(token?.structuralPrefixRoleMatched
        && ['prefix-attachment', 'suffix-boundary'].includes(String(next?.outputBoundaryReason || '')));
    const tokenizerPrefix = Boolean(token?.prefix && next?.outputBoundaryReason === 'prefix-attachment');
    return Boolean((structuralPrefix || tokenizerPrefix)
        && next?.outputBoundaryBefore === 'join'
        && next?.outputBoundaryAuthority === 'morphology'
        && !next?.outputBoundaryRequiresReview);
}

function hasResolvedTemporalOffsetRole(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const previous = tokenResults?.[tokenIndex - 1];
    const surface = String(token?.surface_form || '');
    const reading = normalizeKanaReading(token?.readingResolution?.reading || token?.reading || '');
    const previousReadingSource = String(previous?.readingResolution?.source || '');
    const resolvedTemporalPredecessor = Boolean(previous?.typedTemporalExpressionMatched
        || previousReadingSource === 'typed-duration-context'
        || previousReadingSource === 'typed-temporal-expression');
    if (!resolvedTemporalPredecessor || previous?.typedNumericRoleReviewRequired || previous?.outputBoundaryRequiresReview) return false;
    if (surface === '前' && reading === 'まえ') return true;
    if (surface === '後' && ['あと', 'ご'].includes(reading)) return true;
    return false;
}

function hasResolvedMorphologicalSuffixRole(token) {
    return Boolean(token?.suffix
        && token?.outputBoundaryBefore === 'join'
        && token?.outputBoundaryReason === 'suffix-boundary'
        && token?.outputBoundaryAuthority === 'morphology'
        && !token?.outputBoundaryRequiresReview);
}

function hasVariantCanonicalRetokenizationEvidence(token) {
    return Boolean(token?.variantCanonicalRetokenized
        || (token?.semanticAnnotationOwnership || []).some(owner =>
            owner?.evidenceSource === 'proper-noun-variant-canonical-retokenization'
            || (owner?.annotations || []).includes('variantCanonicalRetokenized')));
}

function suffixRoleFollowsSourceOrthographyLocationVariant(token, sourceSpanCandidates) {
    if (!Number.isInteger(token?.sourceStart)) return false;
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'name'
        && candidate?.kind === 'proper-noun'
        && candidate?.reviewRequired !== true
        && candidate?.metadata?.sourceOrthographyNameVariant === true
        && Number(candidate?.sourceEnd) === Number(token.sourceStart)
        && (candidate?.alternatives || []).some(alternative =>
            (alternative?.categories || []).some(category => String(category || '') === 'loc')));
}

function suffixRoleIntersectsUnresolvedAmbiguousSpan(token, sourceSpanCandidates) {
    if (!Number.isInteger(token?.sourceStart) || !Number.isInteger(token?.sourceEnd)) return false;
    const tokenLength = Number(token.sourceEnd) - Number(token.sourceStart);
    return getUnresolvedAmbiguousSourceSpansForToken(token, sourceSpanCandidates).some(candidate =>
        Number.isInteger(candidate.sourceStart)
        && Number.isInteger(candidate.sourceEnd)
        && candidate.sourceEnd - candidate.sourceStart > tokenLength);
}

function properNameSpanConflictsWithResolvedReadings(candidate, tokenResults) {
    if (!candidate || candidate.category !== 'name' || candidate.semanticRole !== 'proper-name') return false;
    const candidateReading = normalizeKanaReading(candidate.reading || '');
    if (!candidateReading) return false;
    const covered = (tokenResults || []).filter(token => Number.isInteger(token?.sourceStart)
        && Number.isInteger(token?.sourceEnd)
        && token.sourceStart >= candidate.sourceStart
        && Number(token.sourceEnd) <= candidate.sourceEnd);
    if (!covered.length) return false;
    const resolvedReading = normalizeKanaReading(covered.map(token => token.readingResolution?.reading || token.reading || '').join(''));
    return Boolean(resolvedReading && resolvedReading !== candidateReading);
}

function suffixRoleIntersectsUnresolvedNameStructure(tokenResults, tokenIndex, sourceSpanCandidates) {
    const token = tokenResults?.[tokenIndex];
    if (!token) return false;
    if (token.nameContextAmbiguous) return true;

    const tokenLength = Number.isInteger(token.sourceStart) && Number.isInteger(token.sourceEnd)
        ? token.sourceEnd - token.sourceStart
        : 0;
    const conflictingNameSpan = (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'name'
        && candidate?.semanticRole === 'proper-name'
        && sourceSpanCandidateContainsToken(candidate, token)
        && Number.isInteger(candidate.sourceStart)
        && Number.isInteger(candidate.sourceEnd)
        && candidate.sourceEnd - candidate.sourceStart > tokenLength
        && properNameSpanConflictsWithResolvedReadings(candidate, tokenResults));
    if (conflictingNameSpan) return true;

    if (!Number.isInteger(token.sourceEnd)) return false;
    let expectedStart = token.sourceEnd;
    for (let index = tokenIndex + 1; index < (tokenResults || []).length; index += 1) {
        const next = tokenResults[index];
        if (!next || !Number.isInteger(next.sourceStart) || !Number.isInteger(next.sourceEnd) || next.sourceStart !== expectedStart) break;
        if (isReviewContextBoundaryToken(next) || next.pos === '助詞' || next.pos === '助動詞' || next.pos === '動詞' || next.pos === '形容詞') break;
        if (next.outputBoundaryAuthority === 'name-structure' && next.outputBoundaryReason === 'person-name-given-name-boundary') return true;
        expectedStart = next.sourceEnd;
    }
    return false;
}

function hasResolvedInflectedIchidanReading(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const next = tokenResults?.[tokenIndex + 1];
    if (!token || token.pos !== '動詞' || token.conjugated_type !== '一段' || token.conjugated_form === '基本形') return false;
    if (!next?.grammatical || next.outputBoundaryBefore !== 'join' || next.outputBoundaryAuthority !== 'grammar') return false;
    const basicForm = String(token.basic_form || '');
    const selectedReading = normalizeKanaReading(token.readingResolution?.reading || token.reading || '');
    if (!basicForm || basicForm === String(token.surface_form || '') || !selectedReading) return false;
    const candidates = getGeneralWordCandidates(getGeneralWordLookup(basicForm));
    if (candidates.length < 2) return false;
    const compatible = candidates.filter(candidate => {
        const reading = normalizeKanaReading(candidate.reading || '');
        return reading.endsWith('る') && reading.slice(0, -1) === selectedReading;
    });
    return compatible.length === 1;
}

function hasResolvedRecoveredContinuativeCompound(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const next = tokenResults?.[tokenIndex + 1];
    return Boolean(
        token
        && next?.morphologicalJoinLeft
        && next.morphologicalJoinReason === 'reviewed-continuative-stem-single-token-compound'
        && next.morphologicalJoinAuthority === 'strong-morphology'
        && Number.isInteger(token.sourceEnd)
        && Number.isInteger(next.sourceStart)
        && token.sourceEnd === next.sourceStart
    );
}

function getResolvedRoleReviewSupersession(signal, tokenResults, tokenIndex, sourceSpanCandidates) {
    if (!ROLE_RESOLVABLE_LEXICAL_REVIEW_FLAGS.has(signal?.flag)) return null;
    const token = tokenResults?.[tokenIndex];
    if (signal.flag === 'whole-word-reading-ambiguous' && hasResolvedRecoveredContinuativeCompound(tokenResults, tokenIndex)) {
        return {
            resolutionReason: 'Exact compound-verb recovery established that the earlier whole-word ambiguity came from the damaged token boundary.',
            supersededBy: 'resolved-tokenisation-recovery'
        };
    }
    if (hasResolvedMorphologicalPrefixRole(tokenResults, tokenIndex)) {
        return {
            resolutionReason: 'Final morphology established an ordinary noun-prefix role incompatible with the earlier standalone lexical interpretation.',
            supersededBy: 'resolved-morphological-prefix-role'
        };
    }
    if (hasResolvedMorphologicalSuffixRole(token)
        && !hasVariantCanonicalRetokenizationEvidence(token)
        && !suffixRoleFollowsSourceOrthographyLocationVariant(token, sourceSpanCandidates)
        && !suffixRoleIntersectsUnresolvedAmbiguousSpan(token, sourceSpanCandidates)
        && !suffixRoleIntersectsUnresolvedNameStructure(tokenResults, tokenIndex, sourceSpanCandidates)) {
        return {
            resolutionReason: 'Final morphology established a suffix role incompatible with the earlier lexical interpretation.',
            supersededBy: 'resolved-morphological-suffix-role'
        };
    }
    if (hasResolvedInflectedIchidanReading(tokenResults, tokenIndex)) {
        return {
            resolutionReason: 'Conjugation evidence uniquely identifies the selected Ichidan stem reading among the whole-verb candidates.',
            supersededBy: 'resolved-inflected-ichidan-reading'
        };
    }
    if (hasResolvedTemporalOffsetRole(tokenResults, tokenIndex)) {
        return {
            resolutionReason: 'Final typed temporal structure establishes this token as a temporal offset marker.',
            supersededBy: 'resolved-temporal-offset-role'
        };
    }
    if (WEAK_LEXICAL_REVIEW_FLAGS.has(signal.flag) && hasResolvedNumericStructure(tokenResults, tokenIndex, sourceSpanCandidates)) {
        return {
            resolutionReason: 'Final typed numeric structure superseded the earlier weak lexical interpretation.',
            supersededBy: 'resolved-numeric-role'
        };
    }
    if (hasResolvedProductiveCounterContext(tokenResults, tokenIndex, sourceSpanCandidates)) {
        return {
            resolutionReason: 'Final productive counter morphology established a non-lexical counter role for this source span.',
            supersededBy: 'resolved-productive-counter-role'
        };
    }
    return null;
}

function getDistinctSourceCandidateReadings(candidate) {
    const readings = new Set();
    const direct = normalizeKanaReading(candidate?.reading || '');
    if (direct) readings.add(direct);
    for (const alternative of candidate?.alternatives || []) {
        const reading = normalizeKanaReading(alternative?.reading || '');
        if (reading) readings.add(reading);
    }
    return readings;
}

function hasUnambiguousMatchingLexicalRole(token, resolution, sourceSpanCandidates = []) {
    if (!token || !resolution?.reading) return false;
    const selectedReading = normalizeKanaReading(resolution.reading);
    if (!selectedReading) return false;
    const exactLexical = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.category === 'lexical'
        && candidate.sourceStart === token.sourceStart
        && candidate.sourceEnd === token.sourceEnd);
    if (!exactLexical.length) return false;
    const readings = new Set();
    for (const candidate of exactLexical) {
        for (const reading of getDistinctSourceCandidateReadings(candidate)) readings.add(reading);
    }
    return readings.size === 1 && readings.has(selectedReading);
}

function hasAttachedNameHonorificContext(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const next = tokenResults?.[tokenIndex + 1];
    if (!token || !next) return false;
    if (Number.isInteger(token.sourceEnd) && Number.isInteger(next.sourceStart) && token.sourceEnd !== next.sourceStart) return false;
    const surface = String(next.surface_form || '');
    return Boolean(
        next.reviewedNameHonorificMatched
        || next.kanaCommonWordBoundaryHonorific
        || (next.pos === '名詞' && next.pos_detail_1 === '接尾' && next.pos_detail_2 === '人名')
        || ['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏'].includes(surface)
    );
}

function getResolvedProperNounReviewSupersession(signal, resolution, tokenResults, tokenIndex, sourceSpanCandidates) {
    if (!['proper-noun-ambiguous', 'reading-evidence-conflict'].includes(String(signal?.flag || ''))) return null;
    if (!String(resolution?.source || '').startsWith('proper-noun')) return null;
    const token = tokenResults?.[tokenIndex];
    if (!token) return null;
    if (token.nameContinuation && token.nameGivenStart) {
        return {
            resolutionReason: 'Sentence structure establishes this token as the given-name continuation of a person name.',
            supersededBy: 'resolved-person-name-structure'
        };
    }
    if (signal.flag === 'proper-noun-ambiguous'
        && hasUnambiguousMatchingLexicalRole(token, resolution, sourceSpanCandidates)
        && !hasAttachedNameHonorificContext(tokenResults, tokenIndex)
        && hasIndependentSentenceContext(tokenResults, tokenIndex, sourceSpanCandidates)) {
        return {
            resolutionReason: 'Independent sentence context supports the single maintained lexical reading rather than an isolated proper-name interpretation.',
            supersededBy: 'resolved-lexical-context'
        };
    }
    return null;
}

function shouldSupersedeResolvedOrthographicParticleSignal(signal, token) {
    return signal?.flag === 'orthographic-particle-inferred'
        && Boolean(token?.orthographicParticleInferred)
        && Boolean(token?.particle)
        && Boolean(token?.grammatical)
        && token?.outputBoundaryAuthority === 'grammar'
        && !token?.outputBoundaryRequiresReview;
}

function finalizeTokenReviewSignals(tokenResults, tokenIndex, sourceSpanCandidates = []) {
    const token = tokenResults?.[tokenIndex];
    const resolution = token?.readingResolution;
    const surface = String(token?.surface_form || resolution?.surface || '');
    const tokenSignals = getResolutionReviewSignals(resolution, surface, token);
    return tokenSignals.map(original => {
        const policyRequiresReview = Boolean(original?.policyRequiresReview ?? getReviewSignalPolicy(original?.flag).requiresReview);
        if (!policyRequiresReview) return transitionReviewSignal(original, 'resolved');
        if (original?.state === 'superseded') return transitionReviewSignal(original, 'superseded');
        if (original?.state === 'resolved') return transitionReviewSignal(original, 'resolved');
        const active = transitionReviewSignal(original, 'active');
        if (shouldSupersedeWeakLexicalSignal(active, resolution, tokenResults, tokenIndex, tokenSignals, sourceSpanCandidates)) {
            return transitionReviewSignal(active, 'superseded', {
                resolutionReason: 'Full-sentence lexical resolution selected one supported reading without an independent evidence conflict.',
                supersededBy: String(resolution?.source || 'context-selected-reading')
            });
        }
        if (shouldSupersedeResolvedOrthographicParticleSignal(active, token)) {
            return transitionReviewSignal(active, 'superseded', {
                resolutionReason: 'Final grammatical reconstruction established the standalone particle role and output boundary.',
                supersededBy: 'resolved-grammatical-boundary'
            });
        }
        const properNounSupersession = getResolvedProperNounReviewSupersession(active, resolution, tokenResults, tokenIndex, sourceSpanCandidates);
        if (properNounSupersession) return transitionReviewSignal(active, 'superseded', properNounSupersession);
        const roleSupersession = getResolvedRoleReviewSupersession(active, tokenResults, tokenIndex, sourceSpanCandidates);
        if (roleSupersession) return transitionReviewSignal(active, 'superseded', roleSupersession);
        return transitionReviewSignal(active, 'final-active');
    });
}

function makeFinalReviewSignal(surface, flag, source, confidence = 1, ownership = {}) {
    const signal = makeReviewSignal(surface, flag, source, confidence, ownership);
    return signal.policyRequiresReview ? transitionReviewSignal(transitionReviewSignal(signal, 'active'), 'final-active') : signal;
}

function mergeReadingResolutionCandidates(...candidateGroups) {
    const byReading = new Map();
    for (const group of candidateGroups) {
        for (const candidate of group || []) {
            const reading = normalizeKanaReading(candidate?.reading || '');
            if (!reading) continue;
            const existing = byReading.get(reading);
            const categories = new Set([...(existing?.categories || []), ...(candidate?.categories || [])]);
            const sources = new Set([...(existing?.sources || []), ...(candidate?.sources || [])]);
            const weight = Math.max(Number(existing?.weight || 0), Number(candidate?.weight || 0));
            const ranks = [existing?.rank, candidate?.rank].filter(value => value !== null && value !== undefined && Number.isFinite(Number(value))).map(Number);
            byReading.set(reading, {
                ...(existing || {}),
                ...candidate,
                reading: candidate?.reading || existing?.reading || reading,
                romaji: candidate?.romaji || existing?.romaji || convertToRomaji(reading),
                weight,
                rank: ranks.length ? Math.min(...ranks) : null,
                categories,
                sources
            });
        }
    }
    return [...byReading.values()];
}

function makeSelectedReadingCandidate(reading, source = 'kuromoji-token-reading') {
    const normalized = normalizeKanaReading(reading || '');
    if (!normalized) return null;
    return {
        reading: normalized,
        romaji: convertToRomaji(normalized),
        weight: 100,
        rank: null,
        categories: new Set(['lexical']),
        sources: new Set([source])
    };
}

/** @returns {CJ2RReadingResolution} */
/** @param {CJ2RToken} token */
function makeReadingResolution(token, options = {}) {
    const surface = String(token?.surface_form || '');
    const source = options.source || 'unresolved';
    const confidence = Number(options.confidence ?? 0);
    const flags = [...new Set(Array.isArray(options.flags) ? options.flags : [])];
    const providedReviewSignals = Array.isArray(options.reviewSignals)
        ? options.reviewSignals.map(signal => ({ ...signal, lifecycle: [...(signal?.lifecycle || [])] }))
        : [];
    const representedReviewFlags = new Set(providedReviewSignals.map(signal => signal.flag));
    const reviewSignals = [
        ...providedReviewSignals,
        ...makeReviewSignals(surface, source, confidence, flags.filter(flag => !representedReviewFlags.has(flag)))
    ];
    return {
        surface,
        reading: options.reading || null,
        romaji: Object.prototype.hasOwnProperty.call(options, 'romaji') ? options.romaji : null,
        source,
        confidence,
        candidates: Array.isArray(options.candidates) ? options.candidates : [],
        flags,
        variantMappings: Array.isArray(options.variantMappings) ? options.variantMappings : [],
        ambiguous: Boolean(options.ambiguous),
        hanScope: options.hanScope || null,
        scopeEvidence: Array.isArray(options.scopeEvidence) ? options.scopeEvidence : [],
        reviewSignals
    };
}

function makeProperNounAmbiguousCandidateFallback(token, properNounResolution, options = {}) {
    if (!properNounResolution?.ambiguous) return null;
    const properSurface = String(token?.surface_form || '');
    const supportedSingleHan = isHanCharacter(properSurface) ? classifyHanCharacterScope(properSurface) : null;
    const singleHanFallback = supportedSingleHan?.scope === 'japanese-scope';
    const establishedPersonRoleFallback = Boolean(options.establishedPersonRole && token?.nameHonorificRoleMatched);
    const explicitProperNounRoleFallback = Boolean(options.establishedProperNounRole
        && token?.pos === '名詞'
        && token?.pos_detail_1 === '固有名詞');
    if (!singleHanFallback && !establishedPersonRoleFallback && !explicitProperNounRoleFallback) return null;
    const topCandidate = rankProperNounCandidates(properNounResolution.candidates || []).ranked[0] || null;
    if (!topCandidate?.reading && !topCandidate?.romaji) return null;
    return {
        ...properNounResolution,
        reading: topCandidate.reading || null,
        romaji: topCandidate.romaji || null,
        source: `${properNounResolution.source || 'proper-noun-ambiguous'}-candidate-fallback`,
        confidence: Math.max(0.30, Number(properNounResolution.confidence || 0.30)),
        flags: [...new Set([...(properNounResolution.flags || []).filter(flag => flag !== 'unresolved-reading'), 'proper-noun-ambiguous', 'fallback-reading'])],
        ambiguous: true,
        hanScope: singleHanFallback ? 'japanese-scope' : (properNounResolution.hanScope || null),
        scopeEvidence: singleHanFallback ? [supportedSingleHan] : (properNounResolution.scopeEvidence || [])
    };
}

/** @param {CJ2RToken} token */
function resolveTokenReading(token, sourceText) {
    if (!token) return makeReadingResolution(token);
    if (token.censorshipMarker) return makeReadingResolution(token, {
        romaji: token.surface_form,
        source: 'japanese-censorship-marker',
        confidence: 1,
        flags: ['censored-source-text']
    });
    if (token.contextualOverrideMatched && token.contextualRomaji) return makeReadingResolution(token, { romaji: token.contextualRomaji, source: 'contextual-override', confidence: 1 });
    if (token.titleReadingEvidenceMatched && token.titleReadingEvidenceRomaji != null) return makeReadingResolution(token, {
        reading: token.titleReadingEvidenceReading || null, romaji: token.titleReadingEvidenceRomaji,
        source: `title-reading-evidence:${token.titleReadingEvidenceKind || 'reviewed'}`, confidence: 1
    });
    if (token.reviewedProperNameSpanMatched && token.reviewedProperNameSpanRomaji) {
        const lexicalCollisionReading = normalizeKanaReading(token.reviewedProperNameLexicalReading || '');
        const reviewedNameReading = normalizeKanaReading(token.reading || '');
        const lexicalCollision = Boolean(token.reviewedProperNameLexicalCollision
            && lexicalCollisionReading
            && reviewedNameReading
            && lexicalCollisionReading !== reviewedNameReading);
        return makeReadingResolution(token, {
            reading: token.reading,
            romaji: token.reviewedProperNameSpanRomaji,
            source: 'reviewed-proper-name-span',
            confidence: lexicalCollision ? 0.78 : 1,
            candidates: lexicalCollision ? [
                { reading: reviewedNameReading, romaji: token.reviewedProperNameSpanRomaji, categories: ['name'], sources: ['reviewed-proper-name-span'] },
                { reading: lexicalCollisionReading, romaji: null, categories: ['lexical'], sources: ['kuromoji-token-reading'] }
            ] : [],
            flags: lexicalCollision ? ['reading-evidence-conflict'] : [],
            ambiguous: lexicalCollision
        });
    }
    if (token.reviewedNameHonorificMatched && token.reviewedNameHonorificReading) return makeReadingResolution(token, { reading: token.reviewedNameHonorificReading, source: 'reviewed-name-honorific', confidence: 1 });
    if (token.nameHonorificRoleMatched) {
        const nameRoleResolution = resolveProperNounReading(token);
        if (nameRoleResolution) {
            const nameRoleFallback = makeProperNounAmbiguousCandidateFallback(token, nameRoleResolution, { establishedPersonRole: true });
            return makeReadingResolution(token, nameRoleFallback || nameRoleResolution);
        }
    }
    if (token.typedTemporalExpressionMatched && token.typedTemporalReading) return makeReadingResolution(token, { reading: token.typedTemporalReading, source: token.typedTemporalSource || 'typed-temporal-expression', confidence: 0.99 });
    if (token.typedNumericExpressionMatched && token.typedNumericReading) return makeReadingResolution(token, {
        reading: token.typedNumericReading,
        source: token.typedNumericSource || 'typed-numeric-expression',
        confidence: token.typedNumericRoleReviewRequired ? 0.82 : 0.99,
        flags: token.typedNumericRoleReviewRequired ? ['numeric-role-ambiguous'] : []
    });
    if (token.structuredFractionRole === 'denominator-unit' && token.structuredFractionReading) return makeReadingResolution(token, {
        reading: token.structuredFractionReading, source: token.structuredFractionSource || 'fraction-structure', confidence: 1
    });
    if (['denominator-numeral', 'numerator-numeral'].includes(String(token.structuredFractionRole || ''))) {
        const fractionNumeralReading = getKuromojiDictionaryReading(token);
        if (fractionNumeralReading) return makeReadingResolution(token, {
            reading: fractionNumeralReading, source: 'fraction-numeral-structure', confidence: 0.99
        });
    }
    if (token.sourceSpanLexicalCandidateMatched) return makeReadingResolution(token, mergeSourceOrthographyResolutionEvidence(token, {
        reading: token.sourceSpanLexicalCandidateReading || token.reading,
        romaji: token.sourceSpanLexicalCandidateRomaji ?? null,
        source: token.sourceSpanLexicalCandidateSource || 'source-span-lexical-reconstruction',
        confidence: token.sourceSpanLexicalCandidateReviewRequired ? Math.min(Number(token.sourceSpanLexicalCandidateConfidence || 0.9), 0.78) : (token.sourceSpanLexicalCandidateConfidence || 0.9),
        flags: token.sourceSpanLexicalCandidateReviewRequired ? ['whole-word-reading-ambiguous'] : []
    }));
    if (token.reviewedTokenReadingAuthorityMatched && token.reviewedTokenReadingAuthorityReading) return makeReadingResolution(token, {
        reading: token.reviewedTokenReadingAuthorityReading,
        source: token.reviewedTokenReadingAuthoritySource || 'reviewed-token-reading-authority',
        confidence: 0.99
    });
    if (token.authoritativeSpanMatched) {
        const authoritativeReviewFlag = token.authoritativeSpanCategory === 'loanword'
            ? getLoanwordReviewFlag(token)
            : (token.authoritativeSpanReviewRequired
                ? (token.authoritativeSpanReviewFlag || (token.authoritativeSpanCategory === 'loanword-review' ? 'missing-source-spelling-evidence' : 'reviewed-reading-ambiguous'))
                : null);
        const authoritativeAlternatives = Array.isArray(token.authoritativeSpanAlternatives)
            ? token.authoritativeSpanAlternatives.filter(Boolean)
            : [];
        const authoritativeCandidates = [token.authoritativeSpanReading, ...authoritativeAlternatives]
            .filter(Boolean)
            .map((reading, index) => ({
                reading,
                romaji: convertToRomaji(reading),
                weight: index === 0 ? 100 : Math.max(1, 80 - index),
                rank: index + 1,
                categories: new Set(['reviewed-reading']),
                sources: new Set([token.authoritativeSpanSource || 'authoritative-span-evidence'])
            }));
        return makeReadingResolution(token, {
            reading: token.authoritativeSpanReading || token.reading,
            romaji: token.authoritativeSpanRomaji || null,
            source: token.authoritativeSpanSource || 'authoritative-span-evidence',
            confidence: authoritativeReviewFlag ? Math.min(token.authoritativeSpanConfidence || 0.98, 0.86) : token.authoritativeSpanConfidence || 0.98,
            candidates: authoritativeCandidates,
            flags: [
                ...((token.authoritativeSpanVariantMappings || []).length ? ['variant-reading-evidence'] : []),
                ...(authoritativeReviewFlag ? [authoritativeReviewFlag] : [])
            ],
            variantMappings: token.authoritativeSpanVariantMappings || [],
            ambiguous: token.authoritativeSpanCategory === 'reviewed-reading' && authoritativeAlternatives.length > 0
        });
    }
    if (token.reviewedNumericAliasMatched && token.reviewedNumericAliasReading) return makeReadingResolution(token, {
        reading: token.reviewedNumericAliasReading,
        romaji: token.reviewedNumericAliasRomaji || null,
        source: token.reviewedNumericAliasSource ? `reviewed-numeric-alias+${token.reviewedNumericAliasSource}` : 'reviewed-numeric-alias',
        confidence: 0.99,
        flags: ['reviewed-numeric-alias']
    });
    if (token.latinPassthroughMatched && token.latinPassthroughOutput) return makeReadingResolution(token, { romaji: token.latinPassthroughOutput, source: 'latin-source-passthrough', confidence: 1 });
    if (token.fullGrammaticalExpression && runtimeState.particleExpressions[token.surface_form]) return makeReadingResolution(token, { romaji: runtimeState.particleExpressions[token.surface_form].toLowerCase(), source: 'particle-expression', confidence: 1 });
    if (token.fullGrammaticalExpression && fallbackGrammaticalExpressionMap[token.surface_form]) return makeReadingResolution(token, { romaji: fallbackGrammaticalExpressionMap[token.surface_form].toLowerCase(), source: 'grammatical-expression-fallback', confidence: 1, flags: ['fallback-reading'] });
    if (token.knownPhraseMatched && token.knownPhraseValue) return makeReadingResolution(token, { romaji: token.knownPhraseValue.toLowerCase(), source: token.knownPhraseSource || 'whole-word-lexicon', confidence: 0.99 });
    if (isGrammaticalToken(token) && runtimeState.particleExpressions[token.surface_form]) return makeReadingResolution(token, { romaji: runtimeState.particleExpressions[token.surface_form].toLowerCase(), source: 'particle-expression', confidence: 1 });
    if (token.orthographicParticleInferred) return makeReadingResolution(token, {
        reading: token.reading || 'ノ',
        source: token.orthographicParticleEvidenceSource || 'orthographic-particle-inference',
        confidence: token.orthographicParticleReviewRequired ? 0.74 : 0.9,
        flags: token.orthographicParticleReviewRequired ? ['orthographic-particle-inferred'] : []
    });
    const particleReading = getParticleReading(token);
    if (particleReading) return makeReadingResolution(token, { reading: particleReading, source: 'particle-pronunciation', confidence: 1 });
    if (token.contextualLoanwordEvidenceMatched && token.contextualLoanwordEvidenceOutput) return makeReadingResolution(token, { romaji: token.contextualLoanwordEvidenceOutput, source: 'contextual-loanword-evidence', confidence: 0.98, candidates: token.contextualLoanwordEvidenceCandidates || [] });
    if (token.loanwordMatched && token.loanwordOutput) {
        const reviewFlag = getLoanwordReviewFlag(token);
        return makeReadingResolution(token, { romaji: token.loanwordOutput, source: 'loanword-lexicon', confidence: reviewFlag ? 0.86 : 1, flags: reviewFlag ? [reviewFlag] : [] });
    }
    const loanwordOutput = getLoanwordOutputForToken(token);
    if (loanwordOutput) {
        const reviewFlag = getLoanwordReviewFlag(token);
        return makeReadingResolution(token, { romaji: loanwordOutput, source: 'loanword-lexicon', confidence: reviewFlag ? 0.86 : 1, flags: reviewFlag ? [reviewFlag] : [] });
    }
    const explicitCommonWordContext = selectCommonWordRule(token.surface_form, sourceText, false);
    if (explicitCommonWordContext?.reading) return makeReadingResolution(token, { reading: explicitCommonWordContext.reading, romaji: explicitCommonWordContext.romaji || null, source: explicitCommonWordContext.romaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.commonWordMatched && token.commonWordReading) return makeReadingResolution(token, { reading: token.commonWordReading, romaji: token.commonWordRomaji || null, source: token.commonWordRomaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.historicalKanaEvidenceMatched && token.historicalKanaEvidenceReading) return makeReadingResolution(token, { reading: token.historicalKanaEvidenceReading, source: 'historical-kana-evidence', confidence: 0.99, flags: ['historical-kana-attested'] });
    if (token.rendakuEvidenceMatched && token.rendakuEvidenceReading) return makeReadingResolution(token, { reading: token.rendakuEvidenceReading, source: 'rendaku-evidence', confidence: 0.99, flags: [token.rendakuApplied ? 'rendaku-attested' : 'rendaku-blocked-attested'] });
    if (token.exactDictionaryRescueMatched && token.exactDictionaryRescueSource === 'kuromoji-exact-proper-name') return makeReadingResolution(token, { reading: token.pronunciation, source: token.exactDictionaryRescueSource, confidence: token.exactDictionaryRescueConfidence || 0.93, flags: ['exact-dictionary-rescue'] });
    if (token.kanaLexicalSpanMatched && token.kanaLexicalSpanReading) return makeReadingResolution(token, { reading: token.kanaLexicalSpanReading, source: 'kana-whole-word-evidence', confidence: 0.98, flags: ['source-span-kana-evidence'] });
    const kanaOnly = isMechanicallyRomanisableKanaSurface(token.surface_form);
    if (kanaOnly) {
        if (hasUnresolvableProlongedSoundMark(token.surface_form)) {
            return makeReadingResolution(token, {
                romaji: '[Unresolved]',
                source: 'japanese-orthography-unresolved',
                confidence: 0.30,
                flags: ['unresolved-reading', 'japanese-orthography-unresolved']
            });
        }
        const sourceSpellingFlags = needsSourceSpellingReview(token) ? ['missing-source-spelling-evidence'] : [];
        const policyFlags = token.countryLanguageReviewRequired ? ['unreviewed-country-language-form'] : [];
        const reviewFlags = [...sourceSpellingFlags, ...policyFlags];
        const orthographicPronunciation = getKanaOrthographicPronunciation(token);
        if (orthographicPronunciation) return makeReadingResolution(token, { reading: orthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: reviewFlags.length ? 0.65 : 1, flags: ['orthographic-pronunciation', ...reviewFlags] });
        return makeReadingResolution(token, { reading: token.surface_form, source: 'written-kana', confidence: reviewFlags.length ? 0.65 : 1, flags: reviewFlags });
    }
    const mixedOrthographicPronunciation = getMixedScriptOrthographicPronunciation(token);
    if (mixedOrthographicPronunciation) return makeReadingResolution(token, { reading: mixedOrthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: 0.99, flags: ['orthographic-pronunciation'] });
    const commonWordRule = getCommonWordRuleForToken(token, sourceText);
    if (commonWordRule?.reading) return makeReadingResolution(token, { reading: commonWordRule.reading, romaji: commonWordRule.romaji || null, source: commonWordRule.romaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.atejiMatched && token.atejiReading) return makeReadingResolution(token, { reading: token.atejiReading, source: 'ateji-lexicon', confidence: 0.99 });
    if (token.structuralRoleReadingMatched && token.structuralRoleReading) return makeReadingResolution(token, {
        reading: token.structuralRoleReading,
        source: 'structural-role-context',
        confidence: 0.99,
        candidates: token.structuralRoleReadingCandidates || []
    });
    if (token.generalWordMatched && token.generalWordReading) return makeReadingResolution(token, {
        reading: token.generalWordReading,
        source: 'general-word-span-fallback',
        confidence: token.generalWordAmbiguous ? 0.78 : 0.86,
        candidates: token.generalWordCandidates || [],
        flags: ['fallback-reading', ...(token.generalWordAmbiguous ? ['general-word-ambiguous'] : []), ...(token.generalWordCoverageIncomplete ? ['general-word-coverage-incomplete'] : []), ...((token.generalWordVariantMappings || []).length ? ['variant-reading-evidence'] : [])],
        variantMappings: token.generalWordVariantMappings || []
    });
    if (token.ordinaryCompoundReadingMatched && token.ordinaryCompoundReading) return makeReadingResolution(token, {
        reading: token.ordinaryCompoundReading,
        source: 'ordinary-compound-context',
        confidence: 0.98,
        candidates: token.ordinaryCompoundReadingCandidates || []
    });
    if (token.postCensorshipOrdinaryLexicalMatched && token.postCensorshipOrdinaryLexicalReading) {
        const properNameEvidence = resolveProperNounReading(token);
        return makeReadingResolution(token, {
            reading: token.postCensorshipOrdinaryLexicalReading,
            source: 'post-censorship-ordinary-lexical',
            confidence: 0.78,
            candidates: mergeReadingResolutionCandidates(
                token.postCensorshipOrdinaryLexicalCandidates || [],
                properNameEvidence?.candidates || []
            ),
            flags: ['reading-evidence-conflict'],
            ambiguous: true
        });
    }
    const reviewedPreference = getReviewedReadingPreference(token);
    const reviewedCandidates = reviewedPreference ? getReviewedReadingCandidates(token) : [];
    const properNounResolution = resolveProperNounReading(token);
    if (properNounResolution?.reading) {
        const selectedProperReading = normalizeKanaReading(properNounResolution.reading);
        const generalAssessment = assessGeneralWordReading(token, properNounResolution.reading);
        const incompatibleGeneralCandidates = (generalAssessment?.candidates || []).filter(candidate => {
            const candidateReading = normalizeKanaReading(candidate?.reading || '');
            return candidateReading && candidateReading !== selectedProperReading;
        });
        if (incompatibleGeneralCandidates.length) {
            return makeReadingResolution(token, {
                ...properNounResolution,
                confidence: Math.min(Number(properNounResolution.confidence || 0.78), 0.78),
                candidates: mergeReadingResolutionCandidates(properNounResolution.candidates || [], generalAssessment?.candidates || []),
                flags: [...new Set([...(properNounResolution.flags || []), 'reading-evidence-conflict'])],
                variantMappings: generalAssessment?.variantMappings || properNounResolution.variantMappings || [],
                ambiguous: true
            });
        }
        return makeReadingResolution(token, properNounResolution);
    }
    if (token.iterationMarkFallbackMatched && token.iterationMarkFallbackReading) return makeReadingResolution(token, {
        reading: token.iterationMarkFallbackReading, source: 'iteration-mark-fallback', confidence: 0.55, flags: ['iteration-mark-unattested']
    });
    const kuromojiReading = getKuromojiDictionaryReading(token);
    if (reviewedPreference) {
        const selectedReading = reviewedReadingMatches(kuromojiReading, reviewedPreference)
            && normalizeKanaReading(kuromojiReading) === normalizeKanaReading(reviewedPreference.reading)
            ? kuromojiReading
            : reviewedPreference.reading;
        return makeReadingResolution(token, {
            reading: selectedReading,
            source: kuromojiReading && reviewedReadingMatches(kuromojiReading, reviewedPreference)
                ? 'reviewed-reading+kuromoji'
                : 'reviewed-reading-preference',
            confidence: 0.82,
            candidates: reviewedCandidates,
            flags: ['reviewed-reading-ambiguous'],
            ambiguous: true
        });
    }
    if (kuromojiReading) {
        const evidenceAssessment = getReadingEvidenceAssessment(token, kuromojiReading);
        const generalAssessment = assessGeneralWordReading(token, kuromojiReading);
        const kuromojiAmbiguity = assessKuromojiWholeWordAmbiguity(token, kuromojiReading);
        const ordinaryProperNameConflict = assessOrdinaryNounProperNameConflict(token, kuromojiReading);
        const nameContextCandidates = token.nameContextAmbiguous ? getProperNounCandidateLookup(token.nameContextCandidateSurface || token.surface_form).candidates : [];
        const flags = [];
        if (token.nameContextAmbiguous) flags.push('name-context-ambiguous');
        if (token.contextualReadingEvidenceAmbiguous) flags.push('contextual-reading-ambiguous');
        const loanwordReviewFlag = getLoanwordReviewFlag(token);
        if (loanwordReviewFlag) flags.push(loanwordReviewFlag);
        let confidence = properNounResolution?.ambiguous ? 0.78 : 0.92;
        if (token.contextualReadingEvidenceAmbiguous) confidence = Math.min(confidence, 0.72);
        let source = 'kuromoji-context';
        if (evidenceAssessment || ordinaryProperNameConflict) { flags.push('reading-evidence-conflict'); confidence = Math.min(confidence, 0.68); }
        if (properNounResolution?.ambiguous) flags.push('proper-noun-ambiguous');
        if (generalAssessment?.matched) {
            source = 'kuromoji+general-word';
            confidence = generalAssessment.matchedIndex === 0 ? 0.97 : 0.90;
            if (generalAssessment.candidates.length > 1) flags.push('general-word-alternative');
        } else if (generalAssessment?.conflict) {
            flags.push('general-word-conflict');
            confidence = Math.min(confidence, 0.68);
        }
        if (kuromojiAmbiguity) {
            flags.push('whole-word-reading-ambiguous');
            confidence = Math.min(confidence, 0.78);
        }
        const selectedCandidate = makeSelectedReadingCandidate(kuromojiReading);
        const candidates = mergeReadingResolutionCandidates(
            selectedCandidate ? [selectedCandidate] : [],
            token.contextualReadingEvidenceCandidates || [],
            properNounResolution?.candidates || [],
            ordinaryProperNameConflict?.candidates || [],
            nameContextCandidates,
            kuromojiAmbiguity?.candidates || [],
            generalAssessment?.candidates || [],
            getReadingEvidenceCandidates(token)
        );
        const unresolvedReadingConflict = Boolean(
            evidenceAssessment
            || ordinaryProperNameConflict
            || properNounResolution?.ambiguous
            || token.contextualReadingEvidenceAmbiguous
            || generalAssessment?.conflict
        );
        return makeReadingResolution(token, {
            reading: kuromojiReading, source, confidence, candidates, flags,
            variantMappings: generalAssessment?.variantMappings || [],
            ambiguous: unresolvedReadingConflict
        });
    }
    const compoundReading = getCompoundReadingForToken(token);
    if (compoundReading) return makeReadingResolution(token, { reading: compoundReading, source: 'whole-word-compound-fallback', confidence: 0.82, flags: ['fallback-reading'] });
    const generalWordFallback = resolveGeneralWordFallback(token);
    if (generalWordFallback?.reading) return makeReadingResolution(token, generalWordFallback);
    const evidenceFallback = getReadingEvidenceFallback(token);
    if (evidenceFallback?.reading) return makeReadingResolution(token, {
        reading: evidenceFallback.reading,
        source: 'frequency-evidence-fallback',
        confidence: evidenceFallback.ambiguous ? 0.62 : 0.72,
        candidates: evidenceFallback.candidates || [],
        flags: ['fallback-reading', ...(evidenceFallback.ambiguous ? ['whole-word-reading-ambiguous'] : [])],
        ambiguous: Boolean(evidenceFallback.ambiguous)
    });
    if (properNounResolution?.ambiguous) {
        const properNounFallback = makeProperNounAmbiguousCandidateFallback(token, properNounResolution, { establishedProperNounRole: true });
        return makeReadingResolution(token, properNounFallback || properNounResolution);
    }
    if (generalWordFallback?.ambiguous) return makeReadingResolution(token, generalWordFallback);
    const surface = String(token.surface_form || '');
    const unresolvedKanji = containsHan(surface);
    if (!unresolvedKanji && isJapaneseOrthographicReadingSurface(surface)) {
        return makeReadingResolution(token, {
            romaji: '[Unresolved]',
            source: 'japanese-orthography-unresolved',
            confidence: 0.30,
            flags: ['unresolved-reading', 'japanese-orthography-unresolved']
        });
    }
    const unsupportedScript = Array.from(surface).some(character => /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character));
    if (unresolvedKanji) {
        const scope = classifyHanSurfaceScope(surface);
        if (scope.scope === 'japanese-scope') {
            /** @type {any[]} */
            const scopeCharacters = scope.characters || [];
            const candidates = scopeCharacters.flatMap(item => item.candidates || []);
            const pureHanCharacters = Array.from(surface).filter(isHanCharacter);
            const preferOnReading = pureHanCharacters.length > 1 && pureHanCharacters.length === Array.from(surface).length;
            const selectedByCharacter = scopeCharacters.map(item => {
                const itemCandidates = item.candidates || [];
                const selected = preferOnReading
                    ? itemCandidates.find(candidate => candidate.categories?.includes('kanjidic-on')) || itemCandidates[0]
                    : itemCandidates[0];
                return { item, selected };
            });
            if (selectedByCharacter.some(entry => !entry.selected?.reading)) {
                return makeReadingResolution(token, {
                    reading: surface,
                    source: 'japanese-scope-data-gap',
                    confidence: 0.20,
                    candidates,
                    flags: ['unresolved-reading'],
                    hanScope: 'japanese-scope',
                    scopeEvidence: scopeCharacters
                });
            }

            let hanIndex = 0;
            const fallbackReading = Array.from(surface).map(character => {
                if (!isHanCharacter(character)) return normalizeKanaReading(character);
                const selected = selectedByCharacter[hanIndex]?.selected;
                hanIndex += 1;
                return selected?.reading || character;
            }).join('');
            const singleCharacter = isHanCharacter(surface) && scopeCharacters.length === 1;
            const selectedCandidate = singleCharacter ? selectedByCharacter[0].selected : null;
            const reviewedScope = singleCharacter && scopeCharacters[0]?.evidence?.some(item => item.source === 'reviewed-japanese-han-scope');
            const ambiguous = scopeCharacters.some(item => (item.candidates || []).length > 1);
            const variantEvidence = scopeCharacters.some(item => item.evidence?.some(evidence => evidence.source === 'general-kanji-variant' || evidence.source === 'name-kanji-variant'));
            if (singleCharacter && selectedCandidate?.reading && reviewedScope && !ambiguous) {
                return makeReadingResolution(token, {
                    reading: selectedCandidate.reading,
                    romaji: selectedCandidate.romaji || null,
                    source: 'japanese-scope-reviewed-single',
                    confidence: 0.88,
                    candidates,
                    flags: variantEvidence ? ['variant-reading-evidence'] : [],
                    ambiguous: false,
                    hanScope: 'japanese-scope',
                    scopeEvidence: scopeCharacters
                });
            }
            return makeReadingResolution(token, {
                reading: fallbackReading,
                source: singleCharacter ? 'japanese-scope-character-fallback' : 'japanese-scope-compositional-fallback',
                confidence: ambiguous ? 0.55 : 0.65,
                candidates,
                flags: [
                    'fallback-reading',
                    ...(ambiguous ? ['japanese-han-scope-ambiguous'] : []),
                    ...(!singleCharacter ? ['kanji-compositional-fallback'] : []),
                    ...(variantEvidence ? ['variant-reading-evidence'] : [])
                ],
                ambiguous,
                hanScope: 'japanese-scope',
                scopeEvidence: scopeCharacters
            });
        }
        return makeReadingResolution(token, {
            reading: surface,
            source: 'unknown-han-scope',
            confidence: 0.10,
            flags: ['unknown-han-scope'],
            hanScope: 'unknown-scope',
            scopeEvidence: scope.characters
        });
    }
    return makeReadingResolution(token, {
        reading: surface,
        source: unsupportedScript ? 'unresolved-script' : 'surface-fallback',
        confidence: unsupportedScript ? 0.20 : 0.55,
        flags: unsupportedScript ? ['unresolved-reading', 'unsupported-script'] : ['fallback-reading']
    });
}

const SENTENCE_CONTEXT_REVISABLE_SOURCES = Object.freeze([
    'kuromoji-context', 'kuromoji+general-word', 'whole-word-compound-fallback',
    'general-word-span-fallback', 'general-word-fallback', 'frequency-evidence-fallback',
    'surface-fallback', 'japanese-scope-character-fallback', 'japanese-scope-compositional-fallback', 'japanese-scope-data-gap', 'japanese-orthography-unresolved', 'unknown-han-scope', 'unresolved-script'
]);

function isSentenceContextRevisableResolution(resolution) {
    const source = String(resolution?.source || '');
    return SENTENCE_CONTEXT_REVISABLE_SOURCES.some(prefix => source === prefix || source.startsWith(`${prefix}+`) || source.startsWith(`${prefix}:`));
}

function makeSentenceContextVerifiedResolution(token, provisional, evaluation) {
    const selected = evaluation?.selected || null;
    if (!selected) return provisional;
    const selectedReading = normalizeKanaReading(selected.reading || '');
    if (!selectedReading) return provisional;
    const contextualReadings = new Set((evaluation?.candidates || [])
        .map(candidate => normalizeKanaReading(candidate?.reading || ''))
        .filter(Boolean));
    const provisionalReadings = new Set((provisional?.candidates || [])
        .map(candidate => normalizeKanaReading(candidate?.reading || ''))
        .filter(Boolean));
    const contextCoversProvisionalAmbiguity = provisionalReadings.size > 1
        && [...provisionalReadings].every(reading => contextualReadings.has(reading));
    const supersededFlags = new Set(['contextual-reading-ambiguous', 'sentence-context-ambiguous']);
    if (contextCoversProvisionalAmbiguity) {
        for (const flag of ['general-word-alternative', 'general-word-conflict', 'whole-word-reading-ambiguous', 'reading-evidence-conflict']) {
            supersededFlags.add(flag);
        }
    }
    const flags = (provisional?.flags || []).filter(flag => !supersededFlags.has(flag));
    const reviewSignals = getResolutionReviewSignals(provisional, String(token?.surface_form || provisional?.surface || '')).map(signal => {
        if (!supersededFlags.has(signal?.flag)) return signal;
        const contextualAmbiguity = signal?.flag === 'contextual-reading-ambiguous' || signal?.flag === 'sentence-context-ambiguous';
        const activeSignal = contextCoversProvisionalAmbiguity && !contextualAmbiguity
            ? transitionReviewSignal(signal, 'active')
            : signal;
        return transitionReviewSignal(activeSignal, 'superseded', {
            resolutionReason: contextCoversProvisionalAmbiguity
                ? 'Sentence-level contextual evidence selected between the maintained readings that owned this uncertainty.'
                : 'Sentence-level contextual evidence selected one supported reading.',
            supersededBy: 'sentence-context-verification'
        });
    });
    return makeReadingResolution(token, {
        reading: selected.reading,
        romaji: selected.romaji || null,
        source: `sentence-context-verification+${provisional?.source || 'unresolved'}`,
        confidence: Math.max(0.96, Math.min(0.99, Number(provisional?.confidence || 0) + 0.08)),
        candidates: evaluation.candidates || provisional?.candidates || [],
        flags,
        reviewSignals,
        variantMappings: provisional?.variantMappings || [],
        ambiguous: false,
        hanScope: provisional?.hanScope || null,
        scopeEvidence: provisional?.scopeEvidence || []
    });
}

function makeSentenceLoanwordContextVerifiedResolution(token, provisional, evaluation) {
    const selected = evaluation?.selected || null;
    if (!selected?.output) return provisional;
    const flags = (provisional?.flags || []).filter(flag => flag !== 'loanword-source-ambiguous');
    const reviewSignals = getResolutionReviewSignals(provisional, String(token?.surface_form || provisional?.surface || '')).map(signal => {
        if (signal?.flag !== 'loanword-source-ambiguous') return signal;
        return transitionReviewSignal(signal, 'superseded', {
            resolutionReason: 'Sentence-level context selected one reviewed source-language spelling.',
            supersededBy: 'sentence-context-loanword'
        });
    });
    return makeReadingResolution(token, {
        reading: provisional?.reading || null,
        romaji: selected.output,
        source: `sentence-context-loanword+${provisional?.source || 'loanword-lexicon'}`,
        confidence: 0.99,
        candidates: evaluation.candidates || provisional?.candidates || [],
        flags,
        reviewSignals,
        variantMappings: provisional?.variantMappings || [],
        ambiguous: false,
        hanScope: provisional?.hanScope || null,
        scopeEvidence: provisional?.scopeEvidence || []
    });
}

function makeSentenceContextAmbiguousResolution(token, provisional, evaluation) {
    if (!isSentenceContextRevisableResolution(provisional)) return provisional;
    const flags = [...new Set([...(provisional?.flags || []), 'sentence-context-ambiguous'])];
    return makeReadingResolution(token, {
        reading: provisional?.reading || null,
        romaji: provisional?.romaji || null,
        source: provisional?.source || 'unresolved',
        confidence: Math.min(Number(provisional?.confidence || 0), 0.70),
        candidates: evaluation?.candidates?.length ? evaluation.candidates : provisional?.candidates || [],
        flags,
        variantMappings: provisional?.variantMappings || [],
        ambiguous: true,
        hanScope: provisional?.hanScope || null,
        scopeEvidence: provisional?.scopeEvidence || []
    });
}

/** @param {CJ2RToken[]} tokens */
function verifySentenceLevelResolutions(tokens, provisionalResolutions, sourceText) {
    return (tokens || []).map((token, index) => {
        let provisional = provisionalResolutions[index] || makeReadingResolution(token);
        const loanwordMetadata = getLoanwordMetadataForToken(token);
        if (loanwordMetadata?.context) {
            const loanwordEvaluation = evaluateContextualLoanwordEvidence(tokens, index, loanwordMetadata, { finalPass: true, sourceText });
            if (loanwordEvaluation.selected) provisional = makeSentenceLoanwordContextVerifiedResolution(token, provisional, loanwordEvaluation);
        }
        const evidence = getContextualReadingEvidenceForToken(token);
        if (!evidence) return provisional;
        const evaluation = evaluateContextualReadingEvidence(tokens, index, evidence, { finalPass: true, sourceText });
        if (evaluation.selected) {
            if (!isSentenceContextRevisableResolution(provisional)) return provisional;
            return makeSentenceContextVerifiedResolution(token, provisional, evaluation);
        }
        return makeSentenceContextAmbiguousResolution(token, provisional, evaluation);
    });
}

function blockUnresolvedHanFromRomaji(value) {
    let unresolvedRun = false;
    let guarded = '';
    for (const character of Array.from(String(value || ''))) {
        const unsupportedLetter = /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character);
        const unsupportedCompatibilitySymbol = Boolean(getJapaneseCompatibilitySourceDecomposition(character));
        const unsupportedMark = unresolvedRun && /\p{M}/u.test(character);
        if (unsupportedLetter || unsupportedCompatibilitySymbol || unsupportedMark) {
            if (!unresolvedRun) guarded += '[Unresolved]';
            unresolvedRun = true;
            continue;
        }
        unresolvedRun = false;
        guarded += character;
    }
    return guarded.replace(/\[Unresolved\](?:\s*\[Unresolved\])+/g, '[Unresolved]');
}

function getOutputGuardFlags(value) {
    const text = String(value || '');
    const flags = [];
    if (containsHan(text)) flags.push('kanji-output-blocked');
    const hasOtherNonLatinLetter = Array.from(text).some(character =>
        /\p{L}/u.test(character)
        && !/\p{Script=Latin}/u.test(character)
        && !/\p{Script=Han}/u.test(character)
    );
    const hasJapaneseCompatibilitySymbol = Array.from(text).some(character => Boolean(getJapaneseCompatibilitySourceDecomposition(character)));
    if (hasOtherNonLatinLetter || hasJapaneseCompatibilitySymbol) flags.push('nonlatin-output-blocked');
    return flags;
}

/** @param {CJ2RToken} token @param {string} sourceText @param {CJ2RReadingResolution|null} [resolutionOverride] */
function convertToken(token, sourceText, resolutionOverride = null) {
    const resolution = resolutionOverride || resolveTokenReading(token, sourceText);
    token.readingResolution = resolution;
    let result = resolution.romaji != null ? resolution.romaji : convertToRomaji(resolution.reading || token.surface_form || '');
    const guardedResult = blockUnresolvedHanFromRomaji(result);
    if (guardedResult !== result) {
        for (const flag of getOutputGuardFlags(result)) {
            if (!resolution.flags.includes(flag)) resolution.flags.push(flag);
        }
        result = guardedResult;
    }
    if (result.includes('[Unresolved]')) return result;
    if (isParticle(token) || token.fullGrammaticalExpression || isSuffix(token) || isNominalizer(token) || isGrammaticalToken(token)) return result.toLowerCase();
    return result;
}

const spacedSuffixSurfaces = new Set(['さん','さま','様','くん','君','ちゃん','氏']);
function isDetachedReviewedNameGeneralSuffix(previousToken, token) {
    return Boolean(
        previousToken?.reviewedProperNameSpanMatched
        && token?.pos_detail_1 === '接尾'
        && token?.pos_detail_2 === '一般'
    );
}
function shouldSpaceSuffix(token, previousToken = null) {
    return spacedSuffixSurfaces.has(token?.surface_form)
        || isDetachedReviewedNameGeneralSuffix(previousToken, token);
}
function shouldDetachSuffixFromParticleHost(previousToken, token) {
    return Boolean(token?.suffix && previousToken && (previousToken.particle || isParticle(previousToken)));
}
function needsSpaceBeforeGrammaticalExpression(previousToken) {
    return Boolean(previousToken && previousToken.pos !== '記号' && !previousToken.prefix);
}
function isNumericExpressionToken(token) {
    return Boolean(token && (token.pos_detail_1 === '数' || token.numericExpression || isJapaneseNumeralSurface(token.surface_form)));
}

function isSeparatedNumericUnit(token) {
    return Boolean(token && isSeparatedNumericUnitSurface(token.surface_form));
}

function shouldSeparateNumericTokens(previousToken, token) {
    if (!isNumericExpressionToken(previousToken)) return false;
    if (isSeparatedNumericUnit(token)) return true;
    if (!isNumericExpressionToken(token)) return false;
    if (isLargeNumericUnitSurface(token.surface_form)) return false;
    return numericGroupTerminalPattern.test(String(previousToken.surface_form || ''));
}

function shouldJoinNumericTokens(previousToken, token) {
    return isNumericExpressionToken(previousToken) && isNumericExpressionToken(token) && !shouldSeparateNumericTokens(previousToken, token);
}

function isClockHourComponentToken(token) {
    if (!token) return false;
    if (token.typedNumericExpressionType === 'clock-hour') return true;
    const surface = String(token.surface_form || '');
    if (/^[〇零一二三四五六七八九十百0-9]+時$/u.test(surface)) return true;
    return surface === '時' && token.pos === '名詞' && token.pos_detail_1 === '接尾' && token.pos_detail_2 === '助数詞';
}

function shouldSeparateClockTimeComponents(previousToken, token) {
    return Boolean(
        isClockHourComponentToken(previousToken)
        && token?.typedNumericExpressionType === 'minute-counter'
    );
}

function needsCrossTokenApostrophe(previousToken, token) {
    if (!previousToken || !token || token.particle || token.grammatical || token.nominalizer || token.prefix || shouldSeparateNumericTokens(previousToken, token)) return false;
    const previousReading = previousToken.readingResolution?.reading || previousToken.surface_form || '';
    const currentReading = token.readingResolution?.reading || token.surface_form || '';
    return needsSyllabicNApostrophe(previousReading, currentReading);
}

function shouldJoinReviewedTitleCompactNumericSuffix(previousToken, token) {
    return Boolean(
        previousToken?.titleReadingEvidenceKind === 'title-compact-numeric-prefix'
        && token?.readingResolution?.source === 'latin-source-passthrough'
        && /^[0-9]+\/[0-9]+(?:~)?$/u.test(String(token.surface_form || ''))
    );
}

function makeOutputBoundaryDecision(type, reason, authority, requiresReview = false) {
    return { type, reason, authority, requiresReview: Boolean(requiresReview) };
}

function sourceBoundaryIsContiguous(previousToken, token) {
    return Number.isInteger(previousToken?.sourceEnd)
        && Number.isInteger(token?.sourceStart)
        && previousToken.sourceEnd === token.sourceStart;
}

function isUnreviewedTokenizerFallbackBoundary(previousToken, token) {
    if (!sourceBoundaryIsContiguous(previousToken, token)) return false;
    if (token?.reviewedLexicalBoundaryBefore || token?.tokenizationRoleBoundaryBefore) return false;
    if (previousToken?.pos === '記号' || token?.pos === '記号') return false;
    const previousSurface = String(previousToken?.surface_form || '');
    const currentSurface = String(token?.surface_form || '');
    if (!previousSurface || !currentSurface) return false;
    const iterationMarkAdjacency = /[ゝゞヽヾ]/u.test(previousSurface + currentSurface)
        && /^[ぁ-ゖァ-ンヴーゝゞヽヾ]+$/u.test(previousSurface + currentSurface);
    if (iterationMarkAdjacency) return true;
    const kanaAdjacency = isKanaSurface(previousSurface) && isKanaSurface(currentSurface);
    const nominalAdjacency = previousToken?.pos === '名詞' && token?.pos === '名詞';
    const mechanicalKanaReadings = previousToken?.readingResolution?.source === 'written-kana'
        && token?.readingResolution?.source === 'written-kana';
    const substantialFragments = Array.from(previousSurface).length >= 2 && Array.from(currentSurface).length >= 2;
    return kanaAdjacency && nominalAdjacency && mechanicalKanaReadings && substantialFragments;
}

function shouldSpaceBeforeJapaneseCensorshipMarker(previousToken) {
    if (previousToken?.pos !== '記号') return false;
    const surface = String(previousToken.surface_form || '');
    return /[、。，．！？!?；;：:…」』）］｝】〉》〕〗〙〛]$/u.test(surface);
}

function classifyTokenStructuralBoundaryDecision(previousToken, token) {
    if (!previousToken) return makeOutputBoundaryDecision('none', 'start-of-output', 'source');
    if (token.titleSeparator) return makeOutputBoundaryDecision('space', 'reviewed-title-separator', 'reviewed-title');
    if (token.censorshipMarker) return makeOutputBoundaryDecision(
        shouldSpaceBeforeJapaneseCensorshipMarker(previousToken) ? 'space' : 'tight',
        shouldSpaceBeforeJapaneseCensorshipMarker(previousToken) ? 'japanese-censorship-marker-after-punctuation' : 'japanese-censorship-marker',
        'source-redaction'
    );
    if (previousToken.censorshipMarker
        && isKanaSurface(String(token.surface_form || ''))
        && !token.particle && !token.nominalizer && !token.fullGrammaticalExpression && !token.grammatical) {
        return makeOutputBoundaryDecision('join', 'japanese-censorship-marker-kana-continuation', 'source-redaction');
    }
    if (previousToken.crossNotationSymbol && !previousToken.titleSeparator) return makeOutputBoundaryDecision('tight', 'cross-notation', 'orthography');
    if (shouldJoinReviewedTitleCompactNumericSuffix(previousToken, token)) return makeOutputBoundaryDecision('join', 'reviewed-title-compact-numeric-suffix', 'reviewed-title');
    if (token.readingResolution?.source === 'ideographic-decimal-notation') return makeOutputBoundaryDecision('space', 'ideographic-decimal-notation', 'orthography');
    if (token.readingResolution?.source === 'latin-source-passthrough') return makeOutputBoundaryDecision('space', 'latin-source-passthrough', 'source');
    if (token.nameContinuation) return makeOutputBoundaryDecision(token.nameGivenStart ? 'space' : 'join', token.nameGivenStart ? 'person-name-given-name-boundary' : 'person-name-continuation', 'name-structure');
    if (token.reviewedNameHonorificMatched) return makeOutputBoundaryDecision('space', 'reviewed-name-honorific-boundary', 'name-structure');
    if (previousToken.pos === '形容詞' && token.surface_form === 'な') return makeOutputBoundaryDecision('space', 'adjectival-na-boundary', 'grammar');
    if (shouldSeparateClockTimeComponents(previousToken, token)) return makeOutputBoundaryDecision('space', 'typed-clock-component-boundary', 'typed-numeric');
    if (shouldSeparateNumericTokens(previousToken, token)) return makeOutputBoundaryDecision('space', 'numeric-separation-rule', 'typed-numeric');
    if (shouldJoinNumericTokens(previousToken, token)) return makeOutputBoundaryDecision('join', 'numeric-assembly-rule', 'typed-numeric');
    if (token.joinLeftAfterSokuon) return makeOutputBoundaryDecision('join', 'sokuon-orthographic-join', 'orthography');
    if (token.morphologicalJoinLeft) return makeOutputBoundaryDecision('join', token.morphologicalJoinReason || 'morphological-join', token.morphologicalJoinAuthority || 'morphology');
    if (token.fullGrammaticalExpression) return makeOutputBoundaryDecision(needsSpaceBeforeGrammaticalExpression(previousToken) ? 'space' : 'join', 'reviewed-grammatical-expression', 'grammar');
    if (token.particle || token.nominalizer || token.prefix) return makeOutputBoundaryDecision('space', token.nominalizer ? 'nominalizer-boundary' : token.prefix ? 'prefix-boundary' : 'particle-boundary', 'grammar');
    if (token.suffix) {
        if (shouldDetachSuffixFromParticleHost(previousToken, token)) return makeOutputBoundaryDecision('space', 'suffix-invalid-particle-host', 'grammar');
        if (isDetachedReviewedNameGeneralSuffix(previousToken, token)) return makeOutputBoundaryDecision('space', 'reviewed-name-general-suffix-boundary', 'name-structure');
        return makeOutputBoundaryDecision(shouldSpaceSuffix(token, previousToken) ? 'space' : 'join', 'suffix-boundary', 'morphology');
    }
    if (previousToken.prefix) return makeOutputBoundaryDecision('join', 'prefix-attachment', 'morphology');
    if (token.grammatical) return makeOutputBoundaryDecision(token.startsSeparateAuxiliaryUnit ? 'space' : 'join', token.startsSeparateAuxiliaryUnit ? 'separate-auxiliary-unit' : 'attached-grammatical-unit', 'grammar');
    if (token.pos === '記号' && !containsHan(token.surface_form) && !isKanaSurface(token.surface_form)) {
        return makeOutputBoundaryDecision('tight', 'orthographic-symbol', 'orthography');
    }
    return makeOutputBoundaryDecision('space', 'tokenizer-fallback', 'tokenizer', isUnreviewedTokenizerFallbackBoundary(previousToken, token));
}


/** @param {CJ2RToken|null|undefined} previousToken @param {CJ2RToken} token */
function classifyTokenOutputBoundaryDecision(previousToken, token) {
    const decision = classifyTokenStructuralBoundaryDecision(previousToken, token);
    if (decision.type === 'join' && needsCrossTokenApostrophe(previousToken, token)) {
        return { ...decision, type: 'apostrophe', reason: `${decision.reason}+syllabic-n-apostrophe` };
    }
    return decision;
}

/** @param {CJ2RToken|null|undefined} previousToken @param {CJ2RToken} token */
function classifyTokenOutputBoundary(previousToken, token) {
    return classifyTokenOutputBoundaryDecision(previousToken, token).type;
}

function formatOutputTokenValue(previousToken, token, boundary) {
    if (String(token.value || '').includes('[Unresolved]')) return token.value;
    if (token.titleSeparator) return token.value;
    if (['latin-source-passthrough', 'loanword-lexicon', 'source-language-loanword'].includes(token.readingResolution?.source)) return token.value;
    if (token.numericExpression && /^[0-9０-９]+[A-Za-z]/u.test(String(token.value || ''))) return token.value;
    if (token.nameContinuation) return token.nameGivenStart ? capitalizeRomaji(token.value) : token.value.toLowerCase();
    if (previousToken?.pos === '形容詞' && token.surface_form === 'な') return token.value;
    if (shouldSeparateNumericTokens(previousToken, token)) return capitalizeRomaji(token.value);
    if (boundary === 'apostrophe' || boundary === 'join') return token.value.toLowerCase();
    if (token.fullGrammaticalExpression || token.particle || token.nominalizer) return token.value.toLowerCase();
    if (token.prefix) return capitalizeRomaji(token.value);
    if (token.suffix && shouldDetachSuffixFromParticleHost(previousToken, token)) return capitalizeRomaji(token.value);
    if (token.suffix && isDetachedReviewedNameGeneralSuffix(previousToken, token)) return capitalizeRomaji(token.value);
    if (token.suffix || previousToken?.prefix) return token.value.toLowerCase();
    if (token.grammatical) return runtimeState.capitalizedAuxiliarySurfaces.has(token.surface_form)
        ? capitalizeRomaji(token.value)
        : token.value.toLowerCase();
    return capitalizeRomaji(token.value);
}

function appendTokenOutput(joined, previousToken, token) {
    const boundary = token.outputBoundaryBefore || classifyTokenOutputBoundary(previousToken, token);
    const value = formatOutputTokenValue(previousToken, token, boundary);
    if (!joined || boundary === 'none') return value;
    if (boundary === 'space') return `${joined} ${value}`;
    if (boundary === 'apostrophe') return `${joined}'${value}`;
    if (boundary === 'tight') return joined + value;
    return joined + value;
}

function makeDiagnosticSourceOwnership(value, sourceStart, sourceEnd) {
    const source = String(value || '');
    const start = Math.max(0, Number(sourceStart) || 0);
    const end = Math.max(start, Number(sourceEnd) || start);
    return { sourceStart: start, sourceEnd: end, sourceSurface: source.slice(start, end) };
}

function findTerminalSokuonReviewSpans(value) {
    const source = String(value || '');
    const normalized = normalizeKanaReading(source);
    const spans = [];
    for (let index = 0; index < normalized.length; index += 1) {
        if (normalized[index] !== 'っ') continue;
        const next = normalized[index + 1] || '';
        if (index === normalized.length - 1 || /^[\s\p{P}\p{S}]$/u.test(next)) {
            spans.push(makeDiagnosticSourceOwnership(source, index, index + 1));
        }
    }
    return spans;
}

function hasTerminalSokuonReviewCondition(value) {
    return findTerminalSokuonReviewSpans(value).length > 0;
}

function findRepeatedSokuonReviewSpans(value) {
    const source = String(value || '');
    const normalized = normalizeKanaReading(source);
    const spans = [];
    let index = 0;
    while (index < normalized.length) {
        if (normalized[index] !== 'っ' || normalized[index + 1] !== 'っ') { index += 1; continue; }
        const start = index;
        while (index < normalized.length && normalized[index] === 'っ') index += 1;
        spans.push(makeDiagnosticSourceOwnership(source, start, index));
    }
    return spans;
}

function hasRepeatedSokuonReviewCondition(value) {
    return findRepeatedSokuonReviewSpans(value).length > 0;
}

function findNonGeminativeSokuonReviewSpans(value) {
    const source = String(value || '');
    const normalized = normalizeKanaReading(source);
    const spans = [];
    for (let index = 0; index < normalized.length; index += 1) {
        if (normalized[index] !== 'っ') continue;
        const next = normalized[index + 1] || '';
        if (!next || /^[\s\p{P}\p{S}]$/u.test(next) || next === 'っ') continue;
        if (!/^[ぁ-ゖー]$/u.test(next)) continue;
        const pair = normalized.slice(index + 1, index + 3);
        const reading = contractedKanaMap[pair] || kanaToRomajiMap[next] || '';
        if (!isSokuonGeminateableReading(reading)) spans.push(makeDiagnosticSourceOwnership(source, index, index + 1));
    }
    return spans;
}

function hasNonGeminativeSokuonReviewCondition(value) {
    return findNonGeminativeSokuonReviewSpans(value).length > 0;
}

function reviewedSourceLanguageLoanwordCoversIndex(tokenResults, sourceText, sourceIndex) {
    const tokens = Array.isArray(tokenResults) ? tokenResults : [];
    const text = String(sourceText || '');
    const ranges = findSourceTokenRanges(tokens, text);
    return tokens.some((token, index) => {
        const resolutionSource = String(token?.readingResolution?.source || '');
        if (!resolutionSource.includes('source-language-loanword')) return false;
        const range = ranges[index];
        if (!range || sourceIndex < range.start || sourceIndex >= range.end) return false;
        return text.slice(range.start, range.end) === String(token.surface_form || '');
    });
}

function findUnreviewedNonGeminativeSokuonReviewSpans(value, tokenResults = []) {
    const source = String(value || '');
    return findNonGeminativeSokuonReviewSpans(source).filter(span =>
        !reviewedSourceLanguageLoanwordCoversIndex(tokenResults, source, span.sourceStart));
}

function findHistoricalFullSizeSokuonAmbiguitySpans(value, tokenResults = []) {
    const source = String(value || '');
    const spans = [];
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] !== 'つ' && source[index] !== 'ツ') continue;
        const nextKana = normalizeKanaReading(source.slice(index + 1, index + 3));
        const next = nextKana[0] || '';
        if (!next || !/^[ぁ-ゖ]$/u.test(next)) continue;
        const pair = nextKana.slice(0, 2);
        const reading = contractedKanaMap[pair] || kanaToRomajiMap[next] || '';
        if (!isSokuonGeminateableReading(reading)) continue;
        const covered = tokenResults.some(token => {
            if (!token?.historicalKanaEvidenceMatched) return false;
            const surface = String(token.surface_form || '');
            if (!/[つツ]/u.test(surface)) return false;
            let offset = source.indexOf(surface);
            while (offset !== -1) {
                if (index >= offset && index < offset + surface.length) return true;
                offset = source.indexOf(surface, offset + 1);
            }
            return false;
        });
        if (!covered) spans.push(makeDiagnosticSourceOwnership(source, index, index + 1));
    }
    return spans;
}

function getCanonicalHardBoundarySegmentSpans(value) {
    const source = String(value || '');
    const spans = [];
    let cursor = 0;
    const pushSegment = (start, end) => {
        const raw = source.slice(start, end);
        const surface = raw.trim();
        if (!surface) return;
        const relativeStart = raw.indexOf(surface);
        const sourceStart = start + Math.max(0, relativeStart);
        spans.push({ surface, sourceStart, sourceEnd: sourceStart + surface.length, sourceSurface: surface });
    };
    for (const boundary of getCanonicalHardBoundaryRuns(source)) {
        pushSegment(cursor, boundary.start);
        cursor = boundary.end;
    }
    pushSegment(cursor, source.length);
    return spans;
}

function classifyReadingAuditCategories(reading) {
    const flags = new Set(reading?.flags || []);
    const source = String(reading?.source || '');
    const hanScope = String(reading?.hanScope || '');
    const unsupportedScript = flags.has('unsupported-script') || source === 'unresolved-script';
    const unknownHanScope = flags.has('unknown-han-scope') || source === 'unknown-han-scope' || hanScope === 'unknown-scope';
    const outOfScope = unsupportedScript || hanScope === 'out-of-scope';
    const unresolvedJapaneseReading = flags.has('unresolved-reading') && !outOfScope && !unknownHanScope;
    const categories = [];
    if (unresolvedJapaneseReading) {
        categories.push('unresolved-japanese-reading');
        if (hanScope === 'japanese-scope') categories.push('unresolved-japanese-han');
    }
    if (outOfScope) categories.push('out-of-scope-input');
    if (unknownHanScope) categories.push('unknown-japanese-scope-status');
    return categories;
}

function attachTranslationAuditStatistics(diagnostics) {
    const readings = Array.isArray(diagnostics?.readings) ? diagnostics.readings : [];
    for (const reading of readings) reading.auditCategories = classifyReadingAuditCategories(reading);
    const countCategory = category => readings.filter(reading => reading.auditCategories.includes(category)).length;
    const literalUnresolved = (String(diagnostics?.output || '').match(/\[Unresolved\]/g) || []).length;
    const requiresReview = Boolean(diagnostics?.requiresReview);
    diagnostics.statistics = {
        requiresReview,
        resolvedOutputRequiresReview: requiresReview && literalUnresolved === 0,
        literalUnresolved,
        hasLiteralUnresolved: literalUnresolved > 0,
        unresolvedJapaneseReadings: countCategory('unresolved-japanese-reading'),
        unresolvedJapaneseHan: countCategory('unresolved-japanese-han'),
        outOfScopeInput: countCategory('out-of-scope-input'),
        unknownJapaneseScopeStatus: countCategory('unknown-japanese-scope-status')
    };
    return diagnostics;
}

function isPlainKatakanaLexicalSurface(value) {
    return /^[ァ-ヶヴヵー]+$/u.test(String(value || ''));
}

function findUnreviewedContiguousKatakanaBoundaries(tokenResults, sourceText) {
    const tokens = Array.isArray(tokenResults) ? tokenResults : [];
    const ranges = findSourceTokenRanges(tokens, String(sourceText || ''));
    const boundaries = [];
    for (let index = 1; index < tokens.length; index += 1) {
        const left = tokens[index - 1];
        const right = tokens[index];
        if (!left || !right) continue;
        if (left.pos !== '名詞' || right.pos !== '名詞') continue;
        if (!isPlainKatakanaLexicalSurface(left.surface_form) || !isPlainKatakanaLexicalSurface(right.surface_form)) continue;
        if (left.readingResolution?.source !== 'written-kana' || right.readingResolution?.source !== 'written-kana') continue;
        if (right.reviewedLexicalBoundaryBefore || right.tokenizationRoleBoundaryBefore) continue;
        const leftRange = ranges[index - 1];
        const rightRange = ranges[index];
        if (!leftRange || !rightRange || leftRange.end !== rightRange.start) continue;
        boundaries.push({ left, right, surface: `${left.surface_form}${right.surface_form}`, sourceStart: leftRange.start, sourceEnd: rightRange.end, sourceSurface: String(sourceText || '').slice(leftRange.start, rightRange.end) });
    }
    return boundaries;
}

function findPartiallyReviewedContiguousKatakanaSpans(tokenResults, sourceText) {
    const tokens = Array.isArray(tokenResults) ? tokenResults : [];
    const ranges = findSourceTokenRanges(tokens, String(sourceText || ''));
    const spans = [];
    for (let index = 1; index < tokens.length; index += 1) {
        const left = tokens[index - 1];
        const right = tokens[index];
        if (!left || !right) continue;
        if (left.pos !== '名詞' || right.pos !== '名詞') continue;
        if (!isPlainKatakanaLexicalSurface(left.surface_form) || !isPlainKatakanaLexicalSurface(right.surface_form)) continue;
        if (right.reviewedLexicalBoundaryBefore || right.tokenizationRoleBoundaryBefore) continue;
        const leftRange = ranges[index - 1];
        const rightRange = ranges[index];
        if (!leftRange || !rightRange || leftRange.end !== rightRange.start) continue;
        const leftReviewed = left.readingResolution?.source === 'source-language-loanword' || left.readingResolution?.source === 'loanword-lexicon';
        const rightReviewed = right.readingResolution?.source === 'source-language-loanword' || right.readingResolution?.source === 'loanword-lexicon';
        const leftMechanical = ['written-kana', 'kuromoji-orthographic-pronunciation'].includes(left.readingResolution?.source);
        const rightMechanical = ['written-kana', 'kuromoji-orthographic-pronunciation'].includes(right.readingResolution?.source);
        if (!((leftReviewed && rightMechanical) || (leftMechanical && rightReviewed))) continue;
        spans.push({ left, right, surface: `${left.surface_form}${right.surface_form}`, sourceStart: leftRange.start, sourceEnd: rightRange.end, sourceSurface: String(sourceText || '').slice(leftRange.start, rightRange.end) });
    }
    return spans;
}

function renderTokenResults(tokenResults) {
    return (tokenResults || []).reduce((joined, token, index) => {
        if (token.pos === '記号' && token.pos_detail_1 === '空白' && /^\s+$/u.test(String(token.surface_form || ''))) return joined;
        const previousToken = tokenResults[index - 1];
        return appendTokenOutput(joined, previousToken, token);
    }, '');
}

function renderFinalOutputFromTokenResults(tokenResults, sourceText = '') {
    const rendered = renderTokenResults(tokenResults);
    return blockUnresolvedHanFromRomaji(normalizeRule0OutputPunctuation(rendered, sourceText));
}

function renderFinalOutputFromRecordedBoundaries(tokenResults, sourceText = '') {
    let joined = '';
    for (let index = 0; index < (tokenResults || []).length; index += 1) {
        const token = tokenResults[index];
        if (!token) continue;
        if (token.pos === '記号' && token.pos_detail_1 === '空白' && /^\s+$/u.test(String(token.surface_form || ''))) continue;
        const previousToken = tokenResults[index - 1] || null;
        const boundary = token.outputBoundaryBefore || 'none';
        const value = formatOutputTokenValue(previousToken, token, boundary);
        if (!joined || boundary === 'none') joined = value;
        else if (boundary === 'space') joined += ` ${value}`;
        else if (boundary === 'apostrophe') joined += `'${value}`;
        else joined += value;
    }
    return blockUnresolvedHanFromRomaji(normalizeRule0OutputPunctuation(joined, sourceText));
}

/**
 * Detects destructive Latin/source passthrough spans that cross the end of a
 * high-confidence immutable source candidate. Such a crossing makes the
 * candidate unreachable to later evidence-selection stages even though final
 * spacing/output metadata may remain internally self-consistent.
 * @param {CJ2RToken[]} tokenResults
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates
 */
function validateSourceSpanAuthorityPreservation(tokenResults, sourceSpanCandidates = []) {
    const violations = [];
    const seen = new Set();
    const addViolation = (candidate, token, index, boundary, reason, boundaryKind) => {
        const key = `${index}:${boundary}:${reason}`;
        if (seen.has(key)) return;
        seen.add(key);
        violations.push({
            index,
            surface: String(token?.surface_form || ''),
            reason,
            boundary: token?.outputBoundaryBefore || null,
            expected: `${candidate.sourceStart}:${candidate.sourceEnd}:${candidate.evidenceSource}:${boundaryKind}@${boundary}`
        });
    };
    for (const candidate of sourceSpanCandidates || []) {
        if (!isHighConfidenceSourceSpanAuthorityCandidate(candidate)) continue;
        for (let index = 0; index < (tokenResults || []).length; index += 1) {
            const token = tokenResults[index];
            if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) continue;
            const tokenStart = Number(token.sourceStart);
            const tokenEnd = Number(token.sourceEnd);
            const latinCrossing = Boolean(token.latinPassthroughMatched) || token.readingResolution?.source === 'latin-source-passthrough';

            // Latin/source passthrough is never allowed to consume the end of a
            // stronger immutable candidate merely because punctuation/ASCII is
            // mechanically mergeable.
            if (latinCrossing
                && candidate.sourceStart <= tokenStart
                && candidate.sourceEnd > tokenStart
                && candidate.sourceEnd < tokenEnd
                && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)) {
                addViolation(candidate, token, index, Number(candidate.sourceEnd), 'latin-passthrough-erased-source-candidate-boundary', 'end');
                continue;
            }

            if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) continue;
            const directOrAdjacentEnd = isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate)
                || hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, candidate.sourceEnd);
            if (directOrAdjacentEnd
                && candidate.sourceStart <= tokenStart
                && candidate.sourceEnd > tokenStart
                && candidate.sourceEnd < tokenEnd
                && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)) {
                addViolation(candidate, token, index, Number(candidate.sourceEnd), 'immutable-source-authority-boundary-erased', 'end');
            }
            const directOrAdjacentStart = isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate)
                || hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, candidate.sourceStart);
            if (directOrAdjacentStart
                && candidate.sourceStart > tokenStart
                && candidate.sourceStart < tokenEnd
                && candidate.sourceEnd >= tokenEnd
                && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates)) {
                addViolation(candidate, token, index, Number(candidate.sourceStart), 'immutable-source-authority-boundary-erased', 'start');
            }
        }
    }
    return { valid: violations.length === 0, violations };
}

function validateFinalOutputEvidenceConsistency(tokenResults, output = null, sourceText = '') {
    const violations = [];
    /** @param {any} token @param {number} index @param {string} reason @param {string|null} [expected] */
    const addViolation = (token, index, reason, expected = null) => violations.push({
        index,
        surface: String(token?.surface_form || ''),
        reason,
        boundary: token?.outputBoundaryBefore || null,
        expected
    });
    for (let index = 0; index < (tokenResults || []).length; index += 1) {
        const token = tokenResults[index];
        const previous = tokenResults[index - 1] || null;
        if (!token) continue;
        if (!token.outputBoundaryBefore) {
            addViolation(token, index, 'missing-boundary-provenance');
            continue;
        }
        const expected = classifyTokenOutputBoundaryDecision(previous, token);
        if (token.outputBoundaryBefore !== expected.type) addViolation(token, index, 'boundary-metadata-contradiction', expected.type);
        if ((token.morphologicalJoinLeft || token.joinLeftAfterSokuon) && !['join', 'apostrophe'].includes(token.outputBoundaryBefore)) {
            addViolation(token, index, 'join-evidence-rendered-separate', 'join');
        }
        if ((token.reviewedLexicalBoundaryBefore || token.tokenizationRoleBoundaryBefore) && ['join', 'apostrophe'].includes(token.outputBoundaryBefore)) {
            addViolation(token, index, 'reviewed-separate-boundary-rendered-joined', 'space');
        }
    }
    const hasCompleteBoundaryProvenance = (tokenResults || []).every(token => !token || Boolean(token.outputBoundaryBefore));
    if (hasCompleteBoundaryProvenance) {
        const provenanceOutput = renderFinalOutputFromRecordedBoundaries(tokenResults, sourceText);
        const rendererOutput = renderFinalOutputFromTokenResults(tokenResults, sourceText);
        if (rendererOutput !== provenanceOutput) {
            violations.push({
                index: -1,
                surface: '[output]',
                reason: 'boundary-renderer-contradiction',
                boundary: null,
                expected: provenanceOutput
            });
        }
        if (output !== null && output !== undefined && String(output) !== provenanceOutput) {
            violations.push({
                index: -1,
                surface: '[output]',
                reason: 'rendered-output-contradiction',
                boundary: null,
                expected: provenanceOutput
            });
        }
    }
    return { valid: violations.length === 0, violations };
}

/**
 * @param {any} diagnostics
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates
 * @param {{valid: boolean, violations: any[]}|null} [validation]
 */
function attachSourceSpanCandidateDiagnostics(diagnostics, candidates, validation = null) {
    const sourceSpanCandidates = (candidates || []).map(candidate => ({
        ...candidate,
        alternatives: (candidate.alternatives || []).map(item => ({ ...item })),
        metadata: { ...(candidate.metadata || {}) }
    }));
    const sourceSpanCandidateCounts = sourceSpanCandidates.reduce((counts, candidate) => {
        counts[candidate.category] = (counts[candidate.category] || 0) + 1;
        return counts;
    }, {});
    diagnostics.sourceSpanCandidates = sourceSpanCandidates;
    diagnostics.sourceSpanCandidateCounts = sourceSpanCandidateCounts;
    diagnostics.sourceSpanCandidateValidation = validation || { valid: true, violations: [] };
    return diagnostics;
}

function buildTranslationDiagnostics(sourceText, normalizedSourceText, output, tokenResults, options = {}) {
    const readings = tokenResults.map((token, index) => {
        const resolution = token.readingResolution;
        const unresolvedOrthographicSymbol = resolution?.source === 'japanese-orthography-unresolved';
        if (token.pos === '記号' && !/[\p{L}\p{N}]/u.test(String(token.surface_form || '')) && !unresolvedOrthographicSymbol && !token.censorshipMarker) return null;
        if (!resolution) return null;
        const reviewSignals = finalizeTokenReviewSignals(tokenResults, index, options.sourceSpanCandidates);
        return {
            surface: token.surface_form,
            value: token.value,
            source: resolution.source,
            confidence: resolution.confidence,
            reading: resolution.reading,
            candidates: (resolution.candidates || []).map(candidate => ({
                reading: candidate.reading, romaji: candidate.romaji, weight: candidate.weight,
                rank: Number.isFinite(candidate.rank) ? candidate.rank : null,
                categories: [...(candidate.categories || [])], sources: [...(candidate.sources || [])]
            })),
            flags: [...(resolution.flags || [])],
            reviewSignals,
            sourceStart: Number.isInteger(token.sourceStart) ? token.sourceStart : null,
            sourceEnd: Number.isInteger(token.sourceEnd) ? token.sourceEnd : null,
            sourceSurface: token.sourceSurface || token.surface_form || null,
            semanticAnnotationOwnership: (token.semanticAnnotationOwnership || []).map(owner => ({ ...owner, annotations: [...(owner.annotations || [])] })),
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            outputBoundaryBefore: token.outputBoundaryBefore || null,
            outputBoundaryReason: token.outputBoundaryReason || null,
            outputBoundaryAuthority: token.outputBoundaryAuthority || null,
            outputBoundaryRequiresReview: Boolean(token.outputBoundaryRequiresReview),
            variantMappings: [...(resolution.variantMappings || [])],
            hanScope: resolution.hanScope || null,
            scopeEvidence: [...(resolution.scopeEvidence || [])]
        };
    }).filter(Boolean);
    const redFlags = readings.flatMap(item => item.reviewSignals || []);
    const wholeSourceOwnership = { sourceStart: 0, sourceEnd: String(sourceText || '').length, sourceSurface: String(sourceText || '') };
    const addSignal = (surface, flag, source, confidence = 1, ownership = wholeSourceOwnership) => redFlags.push(makeFinalReviewSignal(surface, flag, source, confidence, ownership));
    for (const token of tokenResults) {
        if (!token?.outputBoundaryRequiresReview) continue;
        addSignal(token.surface_form, 'structural-boundary-uncertain', 'final-boundary-classification', 0.65, getReviewSignalOwnership(token));
    }
    for (const token of tokenResults) {
        if (!token?.typedNumericRoleReviewRequired) continue;
        addSignal(token.surface_form, 'numeric-role-ambiguous', token.typedNumericRoleSource || 'numeric-role-selection', 0.82, getReviewSignalOwnership(token));
    }
    for (const token of tokenResults) {
        if (!token?.typedTemporalRoleReviewRequired) continue;
        addSignal(token.surface_form, 'temporal-role-ambiguous', token.typedTemporalRoleSource || 'temporal-role-selection', 0.82, getReviewSignalOwnership(token));
    }
    const sourceOrthographyNameCandidates = (options.sourceSpanCandidates || []).filter(candidate =>
        candidate?.metadata?.sourceOrthographyPreserved === true
        && candidate.category === 'name'
        && candidate.kind === 'proper-noun'
        && candidate.evidenceSource === 'proper-noun-evidence'
        && Number.isInteger(candidate.sourceStart)
        && Number.isInteger(candidate.sourceEnd));
    const candidateIsResolvedByContainingNameVariant = candidate => {
        const start = Number(candidate.sourceStart);
        const end = Number(candidate.sourceEnd);
        for (const container of sourceOrthographyNameCandidates) {
            if (container === candidate
                || container?.metadata?.sourceOrthographyNameVariant !== true
                || Number(container.sourceStart) > start
                || Number(container.sourceEnd) < end
                || (Number(container.sourceStart) === start && Number(container.sourceEnd) === end)) continue;
            const maintained = getSourceOrthographyCandidateReadings(container);
            const maintainedReadings = new Set(maintained.map(item => normalizeKanaReading(item?.reading || '')).filter(Boolean));
            if (maintainedReadings.size !== 1) continue;
            const containedTokens = tokenResults.filter(token =>
                Number.isInteger(token?.sourceStart)
                && Number.isInteger(token?.sourceEnd)
                && Number(token.sourceStart) >= Number(container.sourceStart)
                && Number(token.sourceEnd) <= Number(container.sourceEnd));
            if (!containedTokens.length) continue;
            const selected = containedTokens.map(token => normalizeKanaReading(token?.readingResolution?.reading || '')).join('');
            if (selected && selected === [...maintainedReadings][0]) return true;
        }
        return false;
    };
    for (const candidate of sourceOrthographyNameCandidates) {
        if (candidateIsResolvedByContainingNameVariant(candidate)) continue;
        if (candidate?.metadata?.sourceOrthographyPreserved !== true
            || candidate.category !== 'name'
            || candidate.kind !== 'proper-noun'
            || candidate.evidenceSource !== 'proper-noun-evidence'
            || !Number.isInteger(candidate.sourceStart)
            || !Number.isInteger(candidate.sourceEnd)) continue;
        const candidateReadings = getSourceOrthographyCandidateReadings(candidate);
        if (!candidateReadings.length) continue;
        const candidateStart = Number(candidate.sourceStart);
        const candidateEnd = Number(candidate.sourceEnd);
        const contained = tokenResults.filter(token =>
            Number.isInteger(token?.sourceStart)
            && Number.isInteger(token?.sourceEnd)
            && Number(token.sourceStart) >= candidateStart
            && Number(token.sourceEnd) <= candidateEnd);
        if (!contained.length) continue;
        const selectedReading = contained.map(token => normalizeKanaReading(token?.readingResolution?.reading || '')).join('');
        const maintainedReadings = new Set(candidateReadings.map(item => normalizeKanaReading(item?.reading || '')).filter(Boolean));
        const originalStart = Number.isInteger(candidate?.metadata?.originalSourceStart) ? candidate.metadata.originalSourceStart : candidate.sourceStart;
        const originalEnd = Number.isInteger(candidate?.metadata?.originalSourceEnd) ? candidate.metadata.originalSourceEnd : candidate.sourceEnd;
        const originalSurface = candidate?.metadata?.originalSourceSurface || String(sourceText || '').slice(originalStart, originalEnd);
        if (maintainedReadings.size > 1) {
            const alreadyActive = redFlags.some(signal => signal?.state === 'final-active'
                && signal.flag === 'proper-noun-ambiguous'
                && signal.sourceStart === originalStart
                && signal.sourceEnd === originalEnd);
            if (!alreadyActive) addSignal(originalSurface, 'proper-noun-ambiguous', 'source-orthography-proper-name-evidence', 0.8, {
                sourceStart: originalStart, sourceEnd: originalEnd, sourceSurface: originalSurface
            });
            continue;
        }
        const maintainedReading = [...maintainedReadings][0] || '';
        if (!selectedReading || !maintainedReading || selectedReading === maintainedReading) continue;
        const alreadyActive = redFlags.some(signal => signal?.state === 'final-active'
            && signal.flag === 'reading-evidence-conflict'
            && signal.sourceStart === originalStart
            && signal.sourceEnd === originalEnd);
        if (!alreadyActive) addSignal(originalSurface, 'reading-evidence-conflict', 'source-orthography-proper-name-evidence', 0.82, {
            sourceStart: originalStart, sourceEnd: originalEnd, sourceSurface: originalSurface
        });
    }
    const structuralValidation = options.validateStructuralBoundaries
        ? (() => {
            const outputEvidenceValidation = validateFinalOutputEvidenceConsistency(tokenResults, output, sourceText);
            const sourceIntegrityValidation = options.sourceIntegrityValidation || { valid: true, violations: [] };
            const sourceAuthorityValidation = validateSourceSpanAuthorityPreservation(tokenResults, options.sourceSpanCandidates || []);
            return {
                valid: outputEvidenceValidation.valid && sourceIntegrityValidation.valid && sourceAuthorityValidation.valid,
                violations: [...outputEvidenceValidation.violations, ...sourceIntegrityValidation.violations, ...sourceAuthorityValidation.violations],
                outputEvidenceValidation,
                sourceIntegrityValidation,
                sourceAuthorityValidation
            };
        })()
        : { valid: true, violations: [], outputEvidenceValidation: { valid: true, violations: [] }, sourceIntegrityValidation: { valid: true, violations: [] }, sourceAuthorityValidation: { valid: true, violations: [] } };
    for (const violation of structuralValidation.violations) {
        addSignal(violation.surface || '[boundary]', 'final-boundary-invariant-violation', `final-output-consistency:${violation.reason}`, 1, Number.isInteger(violation.index) && violation.index >= 0 ? getReviewSignalOwnership(tokenResults[violation.index]) : wholeSourceOwnership);
    }
    for (const token of tokenResults) {
        const collision = token?.typedTemporalSpanLexicalCollision;
        if (!collision) continue;
        addSignal(`${collision.headSurface}${collision.lexicalSurface}`, 'tokenisation-boundary-ambiguous', 'typed-temporal-boundary', 0.85, getReviewSignalOwnership(token));
    }
    for (let tokenIndex = 0; tokenIndex < tokenResults.length; tokenIndex += 1) {
        const token = tokenResults[tokenIndex];
        if (!token?.crossNotationSymbol || token.titleReadingEvidenceKind) continue;
        const previous = tokenResults[tokenIndex - 1] || null;
        const next = tokenResults[tokenIndex + 1] || null;
        const reviewedLiteralContext = previous?.titleReadingEvidenceKind === 'title-cross-literal-context'
            && next?.titleReadingEvidenceKind === 'title-cross-literal-context'
            && previous.titleReadingEvidenceSource
            && previous.titleReadingEvidenceSource === next.titleReadingEvidenceSource;
        if (reviewedLiteralContext) continue;
        addSignal(token.surface_form, 'unreviewed-cross-notation', 'mixed-script-symbol', 0.60, getReviewSignalOwnership(token));
    }
    for (const flag of options.outputGuardFlags || []) addSignal('[output]', flag, 'final-output-guard');
    for (const boundary of findUnreviewedContiguousKatakanaBoundaries(tokenResults, normalizedSourceText)) {
        addSignal(boundary.surface, 'kana-tokenisation-boundary-unreviewed', 'kuromoji-katakana-boundary', 0.7, boundary);
    }
    for (const span of findPartiallyReviewedContiguousKatakanaSpans(tokenResults, normalizedSourceText)) {
        addSignal(span.surface, 'missing-source-spelling-evidence', 'partial-source-language-loanword', 0.7, span);
    }
    const diagnosticSegments = getCanonicalHardBoundarySegmentSpans(normalizedSourceText);
    for (const span of findTerminalSokuonReviewSpans(normalizedSourceText)) {
        addSignal(span.sourceSurface, 'terminal-sokuon-review', 'sokuon-safety', 1, span);
    }
    for (const span of findRepeatedSokuonReviewSpans(normalizedSourceText)) {
        addSignal(span.sourceSurface, 'repeated-sokuon-review', 'sokuon-safety', 1, span);
    }
    for (const span of findUnreviewedNonGeminativeSokuonReviewSpans(normalizedSourceText, tokenResults)) {
        addSignal(span.sourceSurface, 'non-geminative-sokuon-review', 'sokuon-safety', 1, span);
    }
    if (options.historicalKana) {
        for (const span of findHistoricalFullSizeSokuonAmbiguitySpans(normalizedSourceText, tokenResults)) {
            addSignal(span.sourceSurface, 'historical-full-size-sokuon-ambiguity', 'historical-orthography-safety', 1, span);
        }
    }
    for (const segment of diagnosticSegments) {
        if (!isJapaneseNumeralSurface(segment.surface)) continue;
        if (!tokenResults.some(token => {
            if (!isProperNounToken(token) || String(token.surface_form || '') !== segment.surface) return false;
            const hasOwnedSpan = Number.isInteger(token.sourceStart) && Number.isInteger(token.sourceEnd);
            return !hasOwnedSpan || (token.sourceStart >= segment.sourceStart && token.sourceEnd <= segment.sourceEnd);
        })) continue;
        addSignal(segment.surface, 'numeric-literal-lexical-ambiguity', 'numeric-safety', 1, segment);
    }
    const sourceCounts = readings.reduce((counts, item) => { counts[item.source] = (counts[item.source] || 0) + 1; return counts; }, {});
    return attachTranslationAuditStatistics(attachSourceSpanCandidateDiagnostics({
        sourceText, normalizedSourceText, output, readings, sourceCounts, redFlags, structuralValidation,
        requiresReview: redFlags.some(item => item.state === 'final-active' && item.requiresReview)
    }, options.sourceSpanCandidates, options.sourceSpanCandidateValidation));
}

function publishTranslationDiagnostics(diagnostics) {
    const classifiedDiagnostics = diagnostics ? attachTranslationAuditStatistics(diagnostics) : diagnostics;
    runtimeState.lastTranslationDiagnostics = classifiedDiagnostics;
    updateRuntimeDiagnostics('lastTranslation', classifiedDiagnostics);
}

function resolveOverridesEnabled(options = {}) {
    return Object.prototype.hasOwnProperty.call(options, 'overridesEnabled')
        ? Boolean(options.overridesEnabled)
        : runtimeState.overridesEnabled;
}

function translateText(text, options = {}) {
    const sourceText = String(text || '');
    if (!sourceText.trim()) return '';

    const overrideLookupText = canonicalizeTokenizerBoundaryCharacters(sourceText);
    const normalizedSourceText = options.historicalKana
        ? normalizeHistoricalVerticalIterationMarks(normalizeHistoricalContextResolvedKanaExtensions(normalizeHistoricalSingleValuedHentaigana(normalizeHistoricalSmallKanaLabialization(normalizeHistoricalArchaicSyllableKana(normalizeHistoricalFixedEncodedKanaForms(normalizeTranslatorInputText(sourceText)))))))
        : normalizeObsoleteWRowKanaForModernReading(normalizeTranslatorInputText(sourceText));
    const { trailingText: sourceTrailingText } = splitTrailingPunctuation(overrideLookupText);
    const overridesEnabled = resolveOverridesEnabled(options);
    if (overridesEnabled) {
        const exactOverrideMatch = findExactOverride(overrideLookupText, runtimeState.overrides);
        if (exactOverrideMatch) {
            const overrideOutput = exactOverrideMatch.directMatch ? exactOverrideMatch.value : exactOverrideMatch.value + sourceTrailingText;
            const preGuardOutput = normalizeRule0OutputPunctuation(overrideOutput, sourceText);
            const finalOutput = blockUnresolvedHanFromRomaji(preGuardOutput);
            const outputGuardTriggered = finalOutput !== preGuardOutput;
            const outputGuardFlags = outputGuardTriggered ? getOutputGuardFlags(preGuardOutput) : [];
            if (runtimeState.captureTranslationDiagnostics) {
                const flags = outputGuardTriggered ? ['unresolved-reading', 'unsupported-script', ...outputGuardFlags] : [];
                publishTranslationDiagnostics({
                    sourceText,
                    normalizedSourceText,
                    output: finalOutput,
                    readings: [{ surface: sourceText, value: finalOutput, source: 'exact-override', confidence: outputGuardTriggered ? 0.2 : 1, reading: null, candidates: [], flags }],
                    sourceCounts: { 'exact-override': 1 },
                    redFlags: flags.map(flag => makeFinalReviewSignal(sourceText, flag, 'exact-override', outputGuardTriggered ? 0.2 : 1, { sourceStart: 0, sourceEnd: sourceText.length, sourceSurface: sourceText })),
                    requiresReview: outputGuardTriggered
                });
            }
            return finalOutput;
        }
    }

    text = normalizedSourceText;
    if (!runtimeState.tokenizer) return blockUnresolvedHanFromRomaji(normalizeRule0OutputPunctuation(capitalizeRomaji(convertToRomaji(text)), sourceText));

    return translateTokenizedSourceText(sourceText, text, runtimeState.tokenizer.tokenize(text), options, overridesEnabled);
}

function translateTextFromTokenizationForQa(sourceText, rawTokens, options = {}) {
    const originalSourceText = String(sourceText || '');
    if (!originalSourceText.trim()) return '';
    const normalizedSourceText = options.historicalKana
        ? normalizeHistoricalVerticalIterationMarks(normalizeHistoricalContextResolvedKanaExtensions(normalizeHistoricalSingleValuedHentaigana(normalizeHistoricalSmallKanaLabialization(normalizeHistoricalArchaicSyllableKana(normalizeHistoricalFixedEncodedKanaForms(normalizeTranslatorInputText(originalSourceText)))))))
        : normalizeObsoleteWRowKanaForModernReading(normalizeTranslatorInputText(originalSourceText));
    return translateTokenizedSourceText(originalSourceText, normalizedSourceText, rawTokens, options, resolveOverridesEnabled(options));
}

function translateTokenizedSourceText(sourceText, text, rawTokens, options = {}, overridesEnabled = resolveOverridesEnabled(options)) {
    const preserveSourceSpans = tokens => attachSourceTokenSpans(tokens, text);
    const wholeSentenceTokens = preserveSourceSpans(restoreDroppedSokuonTokens(rawTokens || [], text));
    const normalizedSourceSpanCandidates = discoverSourceSpanCandidates(text, wholeSentenceTokens, {
        historicalKana: Boolean(options.historicalKana),
        overridesEnabled
    });
    const sourceOrthographyCandidates = discoverSourceOrthographyCandidates(sourceText, text, options);
    const nameVariantOrthographyCandidates = discoverNameVariantOrthographyCandidates(text, options);
    const sourceSpanCandidates = mergeSourceSpanCandidateSets(
        mergeSourceSpanCandidateSets(normalizedSourceSpanCandidates, sourceOrthographyCandidates),
        nameVariantOrthographyCandidates
    );
    const sourceSpanCandidateValidation = validateSourceSpanCandidates(sourceSpanCandidates, text);
    const tokenized = preserveSourceSpans(splitStructuredNumericUnitTokens(stabilizeHardBoundaryTokenization(wholeSentenceTokens, text), sourceSpanCandidates));
    if (!tokenized.length) {
        const finalOutput = blockUnresolvedHanFromRomaji(text);
        if (runtimeState.captureTranslationDiagnostics) {
            const outputGuardFlags = finalOutput !== text ? getOutputGuardFlags(text) : [];
            const flags = finalOutput !== text ? ['unresolved-reading', 'unsupported-script', ...outputGuardFlags] : ['fallback-reading'];
            publishTranslationDiagnostics(attachSourceSpanCandidateDiagnostics({
                sourceText, normalizedSourceText: text, output: finalOutput,
                readings: [{ surface: text, value: finalOutput, source: finalOutput !== text ? 'unresolved-script' : 'surface-fallback', confidence: finalOutput !== text ? 0.2 : 0.55, reading: text, candidates: [], flags }],
                sourceCounts: { [finalOutput !== text ? 'unresolved-script' : 'surface-fallback']: 1 },
                redFlags: flags.map(flag => makeFinalReviewSignal(text, flag, finalOutput !== text ? 'unresolved-script' : 'surface-fallback', finalOutput !== text ? 0.2 : 0.55, { sourceStart: 0, sourceEnd: text.length, sourceSurface: text })),
                requiresReview: finalOutput !== text
            }, sourceSpanCandidates, sourceSpanCandidateValidation));
        }
        return finalOutput;
    }
    const tokenReadingAuthorityTokens = preserveSourceSpans(applyReviewedCommonWordTokenReadingAuthority(tokenized, sourceSpanCandidates));
    const sourceAuthorityBoundaryTokens = preserveSourceSpans(splitTokensAtImmutableSourceAuthorityBoundaries(tokenReadingAuthorityTokens, text, sourceSpanCandidates));
    const sourceReconciledTokens = preserveSourceSpans(reconcileKanaSourceTokenBoundaries(sourceAuthorityBoundaryTokens, text, sourceSpanCandidates));
    const fractionStructuredTokens = preserveSourceSpans(applyStructuredFractionOutputTokens(sourceReconciledTokens, sourceSpanCandidates));
    const temporalBoundaryTokens = preserveSourceSpans(repairTypedTemporalExpressionBoundaries(fractionStructuredTokens));
    const temporalSpanTokens = preserveSourceSpans(mergeTypedTemporalSpanTokens(temporalBoundaryTokens));
    const oneDayRoleTokens = preserveSourceSpans(markTypedOneDayDurationTokens(temporalSpanTokens));
    const dayDurationRoleTokens = preserveSourceSpans(markTypedDayDurationSpanTokens(oneDayRoleTokens));
    const frequencyRoleTokens = preserveSourceSpans(markTypedFrequencyCounterRoleTokens(dayDurationRoleTokens));
    const embeddedCounterTailTokens = preserveSourceSpans(markTypedEmbeddedCounterTailTokens(frequencyRoleTokens));
    const numericRoleAmbiguityTokens = preserveSourceSpans(markAmbiguousNumericRoleTokens(embeddedCounterTailTokens, sourceSpanCandidates));
    const clockHourRoleTokens = preserveSourceSpans(markTypedClockHourRoleTokens(numericRoleAmbiguityTokens, sourceSpanCandidates));
    const minuteRoleTokens = preserveSourceSpans(markTypedMinuteCounterRoleTokens(clockHourRoleTokens, sourceSpanCandidates));
    const typedNumericTokens = preserveSourceSpans(applyTypedNumericRoleReadings(minuteRoleTokens));
    const decimalNotationTokens = preserveSourceSpans(mergeIdeographicDecimalNotationTokens(typedNumericTokens));
    const roleRepairedTokens = preserveSourceSpans(repairCaseMarkedCounterFollowerTokens(decimalNotationTokens));
    const desiderativeTokens = preserveSourceSpans(mergeDesiderativeGaruTokens(roleRepairedTokens));
    const reviewedInflectionTokens = preserveSourceSpans(mergeReviewedCommonWordInflectionTokens(desiderativeTokens));
    const kanaCommonWordBoundaryTokens = preserveSourceSpans(splitReviewedKanaCommonWordBoundaryTokens(reviewedInflectionTokens, text));
    const kanaLexicalTokens = preserveSourceSpans(mergeKanaLexicalReadingTokens(kanaCommonWordBoundaryTokens));
    const kanaHonorificTokens = preserveSourceSpans(mergeKanaCommonWordBoundaryHonorificTokens(kanaLexicalTokens));
    const kanaBoundaryTokens = preserveSourceSpans(mergeOrthographicKanaBoundaryTokens(kanaHonorificTokens));
    const latinProtectedTokens = preserveSourceSpans(mergeLatinPassthroughTokens(kanaBoundaryTokens, sourceSpanCandidates));
    const historicalTokens = preserveSourceSpans(options.historicalKana ? mergeHistoricalKanaEvidenceTokens(latinProtectedTokens) : latinProtectedTokens);
    const lexicalCandidateTokens = preserveSourceSpans(mergeStrongSourceSpanLexicalCandidateTokens(historicalTokens, sourceSpanCandidates));
    const sourceOrthographyNameRoleTokens = preserveSourceSpans(mergeSourceOrthographyPersonNameRoleTokens(lexicalCandidateTokens, sourceSpanCandidates));
    const exactDictionaryTokens = preserveSourceSpans(mergeExactDictionaryRescueTokens(sourceOrthographyNameRoleTokens, text));
    const reviewedProperNameTokens = preserveSourceSpans(mergeReviewedProperNameSpanTokens(exactDictionaryTokens, sourceSpanCandidates));
    const reviewedNameSuffixTokens = preserveSourceSpans(mergeReviewedNameHonorificTokens(reviewedProperNameTokens));
    const nameContextTokens = preserveSourceSpans(markUnreviewedNameContextTokens(reviewedNameSuffixTokens, sourceSpanCandidates, text));
    const authoritativeTokens = preserveSourceSpans(mergeAuthoritativeSpanTokens(nameContextTokens, sourceSpanCandidates));
    const iterationTokens = preserveSourceSpans(mergeIterationMarkFallbackTokens(authoritativeTokens));
    const reviewedNumericTokens = preserveSourceSpans(mergeReviewedNumericAliasTokens(iterationTokens));
    const variantProperNounTokens = preserveSourceSpans(mergeVariantProperNounTokens(reviewedNumericTokens));
    const casualTokens = preserveSourceSpans(mergeCasualSpeechTokens(variantProperNounTokens, sourceSpanCandidates));
    const commonWordTokens = preserveSourceSpans(mergeCommonWordTokens(casualTokens, text));
    const atejiTokens = preserveSourceSpans(mergeAtejiTokens(commonWordTokens));
    const grammaticalTokens = preserveSourceSpans(mergeRecognizedGrammaticalExpressions(atejiTokens, sourceSpanCandidates));
    const contextResolvedTokens = preserveSourceSpans(mergeContextualOverrideTokens(grammaticalTokens, text, { overridesEnabled }));
    const titleReadingTokens = preserveSourceSpans(mergeTitleReadingEvidenceTokens(contextResolvedTokens, text));
    const pathTokens = preserveSourceSpans(mergeGeneralWordTokens(mergeLoanwordTokens(mergeRendakuEvidenceTokens(mergeKnownPhraseTokens(titleReadingTokens))), text));
    const ordinaryCompoundTokens = preserveSourceSpans(annotateOrdinaryCompoundReadingContext(pathTokens));
    const postCensorshipTokens = preserveSourceSpans(annotatePostCensorshipOrdinaryLexicalContext(ordinaryCompoundTokens));
    const readingContextTokens = preserveSourceSpans(annotateContextualReadingEvidence(postCensorshipTokens));
    const contextTokens = preserveSourceSpans(annotateContextualLoanwordEvidence(readingContextTokens));
    const finalNameBoundaryTokens = preserveSourceSpans(markSwallowedNameHonorificBoundaryConflicts(contextTokens, sourceSpanCandidates));
    const finalNameRoleTokens = preserveSourceSpans(markAttachedNameHonorificRoles(finalNameBoundaryTokens, sourceSpanCandidates));
    const outputTokens = preserveSourceSpans(annotateSourceOrthographyEvidence(
        annotateMorphologicalOutputBoundaries(finalNameRoleTokens, sourceSpanCandidates),
        sourceSpanCandidates
    ));
    const provisionalResolutions = outputTokens.map(token => resolveTokenReading(token, text));
    const verifiedResolutions = verifySentenceLevelResolutions(outputTokens, provisionalResolutions, text);

    let inPersonName = false;
    let hasPersonNameContinuation = false;
    const tokenResults = outputTokens.map((token, tokenIndex) => {
        const grammatical = isGrammaticalToken(token);
        const personNameToken = isPersonNameToken(token);
        const personNameStart = personNameToken && !inPersonName;
        const nameContinuation = personNameToken && inPersonName;
        const nameGivenStart = nameContinuation && !hasPersonNameContinuation;
        if (personNameStart) { inPersonName = true; hasPersonNameContinuation = false; }
        else if (nameContinuation) hasPersonNameContinuation = true;
        else if (!personNameToken) { inPersonName = false; hasPersonNameContinuation = false; }
        return {
            surface: token.surface_form, surface_form: token.surface_form, pos: token.pos, pos_detail_1: token.pos_detail_1, pos_detail_2: token.pos_detail_2,
            basic_form: token.basic_form, conjugated_type: token.conjugated_type, conjugated_form: token.conjugated_form,
            value: convertToken(token, text, verifiedResolutions[tokenIndex]), readingResolution: token.readingResolution || verifiedResolutions[tokenIndex] || null,
            particle: isParticle(token), fullGrammaticalExpression: Boolean(token.fullGrammaticalExpression), grammatical,
            nominalizer: isNominalizer(token), prefix: isPrefix(token), suffix: isSuffix(token), joinLeftAfterSokuon: Boolean(token.joinLeftAfterSokuon),
            structuralPrefixRoleMatched: Boolean(token.structuralPrefixRoleMatched), structuralSuffixRoleMatched: Boolean(token.structuralSuffixRoleMatched),
            morphologicalJoinLeft: Boolean(token.morphologicalJoinLeft),
            morphologicalJoinReason: token.morphologicalJoinReason || null,
            morphologicalJoinAuthority: token.morphologicalJoinAuthority || null,
            startsSeparateAuxiliaryUnit: startsSeparateAuxiliaryUnit(token), numericExpression: Boolean(token.numericExpression),
            typedNumericExpressionType: token.typedNumericExpressionType || null,
            typedNumericRoleSelected: Boolean(token.typedNumericRoleSelected),
            typedNumericRole: token.typedNumericRole || null,
            typedNumericRoleState: token.typedNumericRoleState || null,
            typedNumericRoleSource: token.typedNumericRoleSource || null,
            typedNumericRoleReviewRequired: Boolean(token.typedNumericRoleReviewRequired),
            typedNumericRoleAlternatives: [...(token.typedNumericRoleAlternatives || [])],
            typedTemporalRoleState: token.typedTemporalRoleState || null,
            typedTemporalRoleSource: token.typedTemporalRoleSource || null,
            typedTemporalRoleReviewRequired: Boolean(token.typedTemporalRoleReviewRequired),
            typedTemporalRoleAlternatives: [...(token.typedTemporalRoleAlternatives || [])],
            typedTemporalSpanLexicalCollision: token.typedTemporalSpanLexicalCollision || null,
            orthographicParticleInferred: Boolean(token.orthographicParticleInferred),
            orthographicParticleEvidenceSource: token.orthographicParticleEvidenceSource || null,
            orthographicParticleReviewRequired: Boolean(token.orthographicParticleReviewRequired),
            titleSeparator: Boolean(token.titleReadingEvidenceMatched && ['title-separator', 'title-separator-silent'].includes(token.titleReadingEvidenceKind)),
            crossNotationSymbol: Boolean(token.crossNotationSymbol),
            censorshipMarker: Boolean(token.censorshipMarker),
            titleReadingEvidenceKind: token.titleReadingEvidenceKind || null,
            titleReadingEvidenceSource: token.titleReadingEvidenceSource || null,
            historicalKanaEvidenceMatched: Boolean(token.historicalKanaEvidenceMatched),
            reviewedProperNameSpanMatched: Boolean(token.reviewedProperNameSpanMatched),
            reviewedNameHonorificMatched: Boolean(token.reviewedNameHonorificMatched),
            nameHonorificRoleMatched: Boolean(token.nameHonorificRoleMatched),
            sourceStart: Number.isInteger(token.sourceStart) ? token.sourceStart : null,
            sourceEnd: Number.isInteger(token.sourceEnd) ? token.sourceEnd : null,
            sourceSurface: token.sourceSurface || token.surface_form || null,
            semanticAnnotationOwnership: (token.semanticAnnotationOwnership || []).map(owner => ({ ...owner, annotations: [...(owner.annotations || [])] })),
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            reviewedLexicalBoundaryBefore: Boolean(token.reviewedLexicalBoundaryBefore), tokenizationRoleBoundaryBefore: Boolean(token.tokenizationRoleBoundaryBefore),
            sourceAuthorityBoundaryBefore: Boolean(token.sourceAuthorityBoundaryBefore), sourceAuthorityBoundarySource: token.sourceAuthorityBoundarySource || null,
            personNameStart, nameContinuation, nameGivenStart
        };
    });

    for (let index = 0; index < tokenResults.length; index += 1) {
        const token = tokenResults[index];
        const previousToken = tokenResults[index - 1] || null;
        const boundaryDecision = classifyTokenOutputBoundaryDecision(previousToken, token);
        token.outputBoundaryBefore = boundaryDecision.type;
        token.outputBoundaryReason = boundaryDecision.reason;
        token.outputBoundaryAuthority = boundaryDecision.authority;
        token.outputBoundaryRequiresReview = boundaryDecision.requiresReview;
    }

    const result = renderTokenResults(tokenResults);

    const preGuardOutput = normalizeRule0OutputPunctuation(result, sourceText);
    const finalOutput = blockUnresolvedHanFromRomaji(preGuardOutput);
    const outputGuardFlags = finalOutput !== preGuardOutput ? getOutputGuardFlags(preGuardOutput) : [];
    if (runtimeState.captureTranslationDiagnostics) {
        const sourceIntegrityValidation = validateSourceTokenIntegrity(outputTokens, text, { requireFullCoverage: true });
        publishTranslationDiagnostics(buildTranslationDiagnostics(sourceText, text, finalOutput, tokenResults, {
            outputGuardFlags,
            historicalKana: Boolean(options.historicalKana),
            validateStructuralBoundaries: true,
            sourceIntegrityValidation,
            sourceSpanCandidates,
            sourceSpanCandidateValidation
        }));
    }
    return finalOutput;
}

// Source section: Runtime diagnostics, initialisation, UI events, binding and the public RomajiTranslator API.
function getRuntimeDiagnosticsInternals() {
    return Object.freeze({
        addSurfacePrefixes,
        attachSourceTokenSpans,
        makeDerivedSpanToken,
        makeDerivedSubspanToken,
        validateSourceTokenIntegrity,
        blockUnresolvedHanFromRomaji,
        buildTranslationDiagnostics,
        capitalizeRomaji,
        canonicalizeIdeographicDecimalNotationSurface,
        canonicalizeTokenizerBoundaryCharacters,
        canonicalizeReviewedPatternForTokenizerBoundary,
        classifyCanonicalBoundaryTokens,
        classifyHanCharacterScope,
        classifyTokenOutputBoundary,
        classifyTokenOutputBoundaryDecision,
        compileReviewedPattern,
        containsHan,
        convertToRomaji,
        convertToken,
        createRuntimeState,
        createCoalescingScheduler,
        discoverSourceSpanCandidates,
        validateSourceSpanCandidates,
        deduplicateKanjiReadingsForDisplay,
        findExactOverride,
        findLongestAuthoritativeSpan,
        findLongestExactDictionaryRescue,
        findLongestHistoricalKanaEvidence,
        findLongestReviewedProperNameSpan,
        findLongestVariantProperNoun,
        formatKanjiReadingForDisplay,
        getCommonWordReadingForToken,
        getContextualReadingEvidenceForToken,
        evaluateContextualReadingEvidence,
        getLoanwordMetadataForToken,
        getLoanwordReviewFlag,
        evaluateContextualLoanwordEvidence,
        annotateContextualLoanwordEvidence,
        annotateMorphologicalOutputBoundaries,
        getGeneralWordCandidates,
        normalizeGeneralWordReadingEvidence,
        getGeneralWordLookup,
        getHanOccurrences,
        getKuromojiDictionaryReading,
        hasTerminalSokuonReviewCondition,
        hasRepeatedSokuonReviewCondition,
        hasNonGeminativeSokuonReviewCondition,
        getProperNounCandidateLookup,
        needsCrossTokenApostrophe,
        needsSyllabicNApostrophe,
        mergeKanaLexicalReadingTokens,
        mergeDesiderativeGaruTokens,
        getReadingEvidenceAssessment,
        isHanCharacter,
        isParticle,
        isRule0RomajiEvidence,
        makeReadingResolution,
        markJapaneseSingleQuotes,
        markUnreviewedNameContextTokens,
        markAmbiguousNumericRoleTokens,
        markTypedClockHourRoleTokens,
        markTypedDayDurationSpanTokens,
        markTypedMinuteCounterRoleTokens,
        applyTypedNumericRoleReadings,
        mergeIdeographicDecimalNotationTokens,
        mergeCasualSpeechTokens,
        mergeAtejiTokens,
        mergeCommonWordTokens,
        mergeExactDictionaryRescueTokens,
        splitReviewedLoanwordToken,
        mergeGeneralWordTokens,
        mergeHistoricalKanaEvidenceTokens,
        mergeReviewedProperNameSpanTokens,
        mergeVariantProperNounTokens,
        needsSpaceBeforeGrammaticalExpression,
        normalizeDictionaryReading,
        normalizeKanaReading,
        normalizeKanjiForLookup,
        normalizePunctuation,
        normalizeRule0OutputPunctuation,
        normalizeTranslatorInputText,
        normalizeJapaneseCompatibilitySourceSymbols,
        getJapaneseCompatibilitySourceDecomposition,
        historicalFixedEncodedKanaMap,
        normalizeHistoricalFixedEncodedKanaForms,
        historicalArchaicSyllableKanaMap,
        normalizeHistoricalArchaicSyllableKana,
        historicalSingleValuedHentaiganaRanges,
        getHistoricalSingleValuedHentaiganaModernKana,
        normalizeHistoricalSingleValuedHentaigana,
        historicalAmbiguousHentaiganaCandidateMap,
        getHistoricalAmbiguousHentaiganaCandidates,
        resolveHistoricalAmbiguousHentaiganaKanaRun,
        normalizeHistoricalContextResolvedHentaigana,
        historicalArchaicYeDualIdentityCandidates,
        getHistoricalArchaicYeDualIdentityCandidates,
        resolveHistoricalArchaicYeDualIdentityKanaRun,
        normalizeHistoricalContextResolvedArchaicYe,
        resolveHistoricalContextualKanaExtensionRun,
        normalizeHistoricalContextResolvedKanaExtensions,
        normalizeHistoricalVerticalIterationMarks,
        normalizeSentenceSpacing,
        publicAssetPolicy,
        rankProperNounCandidates,
        registerProperNounEntry,
        reconcileKanaSourceTokenBoundaries,
        resolveGeneralWordFallback,
        resolveProperNounReading,
        resolveTokenReading,
        resolveOverridesEnabled,
        replaceKanjiReadingAtPosition,
        restoreJapaneseSingleQuotes,
        runtimeState,
        stabilizeHardBoundaryTokenization,
        startsSeparateAuxiliaryUnit,
        setUniqueDictionaryEntry,
        shouldJoinNumericTokens,
        shouldSeparateNumericTokens,
        splitStructuredNumericUnitTokens,
        splitTokensAtImmutableSourceAuthorityBoundaries,
        applyStructuredFractionOutputTokens,
        stripIdeographicVariationSelectors,
        translateText,
        translateTextFromTokenizationForQa,
        verifySentenceLevelResolutions,
        getKanjiReadingData,
        getRuntimeLoadingPolicy,
        registerRuntimeDiagnosticsTools,
        resolveConfiguredAssetBaseUrl,
        updateRuntimeDiagnostics,
        validateAssetSchema,
        validateFinalOutputEvidenceConsistency,
        validateSourceSpanAuthorityPreservation
    });
}

function getRuntimeLoadingPolicy() {
    return {
        assetBaseUrl: engineBaseUrl,
        configuredAssetBaseUrl: configuredAssetBase,
        fetchTimeoutMs: RUNTIME_FETCH_TIMEOUT_MS,
        scriptTimeoutMs: RUNTIME_SCRIPT_TIMEOUT_MS,
        tokenizerTimeoutMs: RUNTIME_TOKENIZER_TIMEOUT_MS,
        retryCount: RUNTIME_TRANSIENT_RETRIES,
        retryDelaysMs: Array.from({ length: RUNTIME_TRANSIENT_RETRIES }, (_, attempt) => runtimeRetryDelay(attempt))
    };
}

runtimeState.overridesEnabled = true;
runtimeState.captureTranslationDiagnostics = ENABLE_RUNTIME_DIAGNOSTICS;

async function loadRuntimeDiagnosticsTools() {
    if (hasOwn.call(window, RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL)) {
        runtimeState.developerWarnings.add('Runtime diagnostics bridge is already in use; diagnostics were not installed.');
        return false;
    }
    const bridge = getRuntimeDiagnosticsInternals();
    runtimeDiagnosticsBridgeValue = bridge;
    // Borrow the namespaced bridge only while loading CJ2R diagnostics, and only remove the exact value CJ2R installed.
    window[RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL] = bridge;
    try {
        await loadScriptWithRetry(assetUrl(getAssetPath('runtimeDiagnostics')), { async: true });
        if (!runtimeDiagnosticsTools) throw new Error('Runtime diagnostics script did not register its tools.');
        return true;
    } catch (error) {
        handleAssetLoadFailure('runtimeDiagnostics', 'Runtime diagnostics unavailable', error);
        return false;
    } finally {
        if (window[RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL] === bridge) delete window[RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL];
        runtimeDiagnosticsBridgeValue = null;
    }
}

function publicAssetPolicy() {
    return Object.fromEntries(Object.entries(translatorAssets).map(([key, definition]) => [key, {
        paths: [...definition.paths],
        criticality: definition.criticality,
        type: definition.type,
        schema: 'schema' in definition ? definition.schema : null
    }]));
}

function runtimeStatusSnapshot() {
    return {
        state: runtimeState.lifecycleState,
        ready: runtimeState.lifecycleState === 'ready' && Boolean(runtimeState.tokenizer),
        error: runtimeState.failure?.message || null,
        dataWarnings: [...runtimeState.resourceWarnings],
        developerWarnings: [...runtimeState.developerWarnings]
    };
}

/** @param {CJ2RRegressionReport|null} [regressionReport] */
function publishTranslatorDiagnostics(regressionReport = null) {
    const failures = regressionReport?.failures || [];
    runtimeDiagnosticsSnapshot = {
        rule: regressionReport?.rule || 'Rule 0',
        runtime: runtimeStatusSnapshot(),
        assetPolicy: publicAssetPolicy(),
        loadingPolicy: getRuntimeLoadingPolicy(),
        dataWarnings: [...runtimeState.resourceWarnings],
        developerWarnings: [...runtimeState.developerWarnings],
        regression: regressionReport,
        regressionFailures: failures,
        lastTranslation: runtimeState.lastTranslationDiagnostics,
        ...runtimeDiagnosticsExtras
    };
    return runtimeDiagnosticsSnapshot;
}

function getTranslatorDiagnostics() {
    const diagnostics = runtimeDiagnosticsSnapshot || publishTranslatorDiagnostics();
    const diagnosticsTools = ENABLE_RUNTIME_DIAGNOSTICS && runtimeDiagnosticsTools
        ? {
            ...runtimeDiagnosticsTools,
        }
        : null;
    return {
        ...diagnostics,
        runtime: runtimeStatusSnapshot(),
        dataWarnings: [...runtimeState.resourceWarnings],
        developerWarnings: [...runtimeState.developerWarnings],
        regressionFailures: [...(diagnostics.regressionFailures || [])],
        lastTranslation: runtimeState.lastTranslationDiagnostics,
        tools: diagnosticsTools
    };
}

/** @returns {Promise<CJ2RTokenizer>} */
function buildKuromojiTokenizer() {
    // Dictionary construction can be slow on constrained clients, but a finite configurable deadline keeps stalled initialisation deterministic.
    return new Promise((resolve, reject) => {
        let settled = false;
        /** @param {unknown} error @param {CJ2RTokenizer|null} [builtTokenizer] */
        const finish = (error, builtTokenizer = null) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (error) reject(error);
            else if (builtTokenizer) resolve(builtTokenizer);
            else reject(new Error('Kuromoji construction returned no tokenizer.'));
        };
        const timer = setTimeout(
            () => finish(new Error(`Kuromoji construction timed out after ${RUNTIME_TOKENIZER_TIMEOUT_MS} ms`)),
            RUNTIME_TOKENIZER_TIMEOUT_MS
        );
        try {
            window.kuromoji.builder({ dicPath: kuromojiDictionaryPath() }).build((error, builtTokenizer) => {
                if (error) finish(error);
                else {
                    try { finish(null, validateKuromojiTokenizer(builtTokenizer)); }
                    catch (validationError) { finish(validationError); }
                }
            });
        } catch (error) {
            finish(error);
        }
    });
}

function renderBuiltInStatus(diagnostics = runtimeDiagnosticsSnapshot || null) {
    if (!statusBanner) return;
    if (runtimeState.lifecycleState === 'failed') {
        setVisibility(statusBanner, true);
        statusBanner.className = 'error';
        statusBanner.innerText = `❌ Translator failed to initialise: ${runtimeState.failure?.message || 'Unknown error'}`;
        statusBanner.title = runtimeState.failure?.message || '';
        return;
    }
    if (runtimeState.lifecycleState !== 'ready') return;
    setVisibility(statusBanner, true);
    const warningList = diagnostics?.dataWarnings || [];
    const developerWarningList = diagnostics?.developerWarnings || [];
    const failures = diagnostics?.regressionFailures || [];
    statusBanner.title = [
        ...warningList.map(w => `Data: ${w}`),
        ...developerWarningList.map(w => `Runtime diagnostics: ${w}`),
        ...failures.map(f => `${f.id}: ${f.input} -> ${f.actual} (expected ${f.expected})`)
    ].join('\n');
    if (warningList.length || developerWarningList.length || failures.length) {
        statusBanner.className = 'error';
        statusBanner.innerText = `⚠ Translator ready with ${warningList.length} data warning${warningList.length === 1 ? '' : 's'}, ${developerWarningList.length} runtime diagnostic warning${developerWarningList.length === 1 ? '' : 's'}, and ${failures.length} regression failure${failures.length === 1 ? '' : 's'}.`;
    } else {
        statusBanner.className = 'ready';
        statusBanner.innerText = '✅ Translator Engine Ready! Local files compiled.';
    }
}

function readKanjiConsumerValue(element) {
    if (!element) return '';
    return 'value' in element ? String(element.value || '') : String(element.textContent || '');
}

function renderKanjiReadingConsumers() {
    for (const consumer of kanjiReadingConsumers) {
        renderKanjiReadings(
            consumer.target,
            readKanjiConsumerValue(consumer.source),
            readKanjiConsumerValue(consumer.search),
            consumer.source
        );
    }
    return kanjiReadingConsumers.length;
}

function isKanjiConsumerSource(element) {
    return kanjiReadingConsumers.some(consumer => consumer.source === element);
}

function isKanjiConsumerSearch(element) {
    return kanjiReadingConsumers.some(consumer => consumer.search === element);
}

function syncBuiltInUi({ focus = false, renderReadings = false, requireChange = false, scanKanjiTargets = false } = {}) {
    const changed = refreshBuiltInUiReferences({ scanKanjiTargets });
    if (requireChange && !changed) return false;
    if (runtimeState.lifecycleState === 'ready') {
        if (inputArea) {
            inputArea.removeAttribute('disabled');
            if (focus) inputArea.focus();
        }
        if ((changed || renderReadings) && kanjiReadingConsumers.length) renderKanjiReadingConsumers();
    }
    renderBuiltInStatus();
    return changed;
}

async function initializeTranslator() {
    runtimeState.lifecycleState = 'loading';
    runtimeState.failure = null;
    try {
        await ensureKuromojiLoaded();
        /** @type {Promise<unknown>[]} */
        const jobs = [loadOverrideData(), loadKanjiDictionary(), loadKanjiVariantDictionary(), loadJapaneseHanScopeDictionary(), loadLexicalTermBanks(), loadGrammarConfiguration(), loadCounterDateEvidence(), loadReadingEvidence(), loadReviewedReadingEvidence(), loadRendakuEvidence(), loadHistoricalKanaEvidence()];
        if (ENABLE_RUNTIME_DIAGNOSTICS) jobs.push(loadRuntimeDiagnosticsTools());
        await settleStartedJobs(jobs);
        buildKnownPhraseDictionary();
        buildContextOverrideIndex();
        buildLexicalPrefixIndexes();
        buildAuthoritativeSpanIndex();
        runtimeState.tokenizer = await buildKuromojiTokenizer();
        registerTokenizerConfirmedKanaLexicalReadingAliases();

        /** @type {CJ2RRegressionReport|null} */
        let regressionReport = null;
        if (ENABLE_RUNTIME_DIAGNOSTICS) {
            regressionReport = typeof runtimeDiagnosticsTools?.runRegressionChecks === 'function'
                ? runtimeDiagnosticsTools.runRegressionChecks()
                : null;
            if (!regressionReport && !runtimeState.developerWarnings.size) runtimeState.developerWarnings.add('Runtime diagnostics unavailable');
        }

        runtimeState.lifecycleState = 'ready';
        const diagnostics = publishTranslatorDiagnostics(regressionReport);
        syncBuiltInUi({ focus: true, renderReadings: true });
        renderBuiltInStatus(diagnostics);
        return true;
    } catch (error) {
        runtimeState.tokenizer = null;
        runtimeState.lifecycleState = 'failed';
        runtimeState.failure = error instanceof Error ? error : new Error(String(error));
        publishTranslatorDiagnostics();
        refreshBuiltInUiReferences();
        renderBuiltInStatus();
        console.error(runtimeState.failure);
        throw runtimeState.failure;
    }
}

const UI_INPUT_DEBOUNCE_MS = 16;

function createCoalescingScheduler(callback, delay = UI_INPUT_DEBOUNCE_MS, timerApi = null) {
    const timers = timerApi || { set: (fn, ms) => setTimeout(fn, ms), clear: id => clearTimeout(id) };
    let timer = null;
    let active = true;
    return {
        schedule(...args) {
            if (!active) return false;
            if (timer !== null) timers.clear(timer);
            timer = timers.set(() => {
                timer = null;
                if (active) callback(...args);
            }, delay);
            return true;
        },
        cancel() {
            if (timer === null) return false;
            timers.clear(timer);
            timer = null;
            return true;
        },
        dispose() {
            active = false;
            if (timer !== null) timers.clear(timer);
            timer = null;
        },
        refresh() { active = true; },
        isPending: () => timer !== null,
        isActive: () => active
    };
}

function renderBuiltInTranslationReview(audit) {
    if (!translationReviewDiv) return;
    const activeSignals = (audit?.redFlags || []).filter(signal => signal?.state === 'final-active' && signal?.requiresReview);
    if (!activeSignals.length) {
        translationReviewDiv.textContent = '';
        setVisibility(translationReviewDiv, false);
        return;
    }
    const summaries = [...new Set(activeSignals.map(signal => {
        const reason = String(signal.reasonCode || signal.flag || 'review-required');
        const surface = String(signal.sourceSurface || signal.surface || '');
        return surface && surface !== '[output]' ? `${reason} (${surface})` : reason;
    }))];
    translationReviewDiv.textContent = `Review required: ${summaries.join(', ')}`;
    setVisibility(translationReviewDiv, true);
}

const builtInInputScheduler = createCoalescingScheduler(() => {
    refreshBuiltInUiReferences();
    if (kanjiReadingConsumers.length) renderKanjiReadingConsumers();
    if (!outputDiv || !runtimeState.tokenizer) return;
    const sourceText = inputArea?.value || '';
    if (translationReviewDiv) {
        const result = translateWithReadingAudit(sourceText);
        outputDiv.innerText = result.romaji;
        renderBuiltInTranslationReview(result.audit);
    } else {
        outputDiv.innerText = translateText(sourceText);
    }
});
let builtInUiLifecycleActive = false;

const builtInUiObserver = typeof MutationObserver === 'function' && document.documentElement
    ? new MutationObserver(() => {
        if (!builtInUiLifecycleActive) return;
        // Custom Kanji targets are rescanned only after opt-in; a target inserted later is activated explicitly through refreshUi().
        syncBuiltInUi({ requireChange: true });
    })
    : null;

function handleBuiltInInput(event) {
    if (!(event.target instanceof Element)) return;
    refreshBuiltInUiReferences();
    if (event.target.id === 'input' || isKanjiConsumerSource(event.target)) {
        builtInInputScheduler.schedule();
    } else if (event.target.id === 'kanji-search' || isKanjiConsumerSearch(event.target)) {
        renderKanjiReadingConsumers();
    }
}

function installBuiltInUiLifecycle() {
    if (builtInUiLifecycleActive) return false;
    builtInInputScheduler.refresh();
    if (typeof document.addEventListener === 'function') {
        document.addEventListener('input', handleBuiltInInput);
    }
    if (builtInUiObserver && document.documentElement) builtInUiObserver.observe(document.documentElement, { childList: true, subtree: true });
    builtInUiLifecycleActive = true;
    return true;
}

function disposeBuiltInUiLifecycle() {
    if (!builtInUiLifecycleActive) return false;
    if (typeof document.removeEventListener === 'function') {
        document.removeEventListener('input', handleBuiltInInput);
    }
    if (builtInUiObserver) builtInUiObserver.disconnect();
    builtInInputScheduler.dispose();
    builtInUiLifecycleActive = false;
    return true;
}

function refreshBuiltInUiLifecycle() {
    installBuiltInUiLifecycle();
    syncBuiltInUi({ renderReadings: true, scanKanjiTargets: true });
    return builtInUiLifecycleActive;
}

const translatorReady = initializeTranslator();
installBuiltInUiLifecycle();


function resolveHookElement(target, label) {
    if (target instanceof Element) return target;
    if (typeof target === 'string') {
        const element = document.querySelector(target);
        if (element) return element;
    }
    throw new Error(`Translator ${label} could not be resolved.`);
}
function readHookValue(element) { return 'value' in element ? element.value : element.textContent || ''; }
function writeHookValue(element, value) { if ('value' in element) element.value = value; else element.textContent = value; }

const translatorBindingsByButton = new WeakMap();
const activeTranslatorBindings = new Set();

/** @param {CJ2RBindingOptions} options */
function bindTranslator(options) {
    const { field, button, output = null, overridesEnabled } = options || /** @type {CJ2RBindingOptions} */ ({});
    assertTranslatorNotDestroyed();
    const fieldElement = resolveHookElement(field, 'field');
    const buttonElement = resolveHookElement(button, 'button');
    const outputElement = output ? resolveHookElement(output, 'output') : null;
    const previousBinding = translatorBindingsByButton.get(buttonElement);
    if (previousBinding) previousBinding.unbind();

    let bindingOverridesEnabled = overridesEnabled === undefined ? runtimeState.overridesEnabled : Boolean(overridesEnabled);
    let active = true;
    let binding = null;
    // A binding may be removed or replaced while readiness is pending; only the current owner may write translated output.
    const isCurrent = () => active && translatorBindingsByButton.get(buttonElement) === binding;
    const inactiveError = () => {
        const error = new Error('Translator binding is no longer active.');
        error.name = 'AbortError';
        error.code = 'CJ2R_BINDING_INACTIVE';
        return error;
    };
    const translateBinding = async event => {
        if (event?.preventDefault) event.preventDefault();
        if (!isCurrent()) throw inactiveError();
        await translatorReady;
        if (!isCurrent()) throw inactiveError();
        const translated = translateText(readHookValue(fieldElement), { overridesEnabled: bindingOverridesEnabled });
        if (!isCurrent()) throw inactiveError();
        writeHookValue(outputElement || fieldElement, translated);
        return translated;
    };
    const clickHandler = event => {
        translateBinding(event).catch(error => {
            if (error?.code === 'CJ2R_BINDING_INACTIVE') return;
            console.error('CJ2R binding translation failed.', error);
        });
    };
    const unbind = () => {
        if (!active) return false;
        active = false;
        buttonElement.removeEventListener('click', clickHandler);
        if (translatorBindingsByButton.get(buttonElement) === binding) translatorBindingsByButton.delete(buttonElement);
        activeTranslatorBindings.delete(binding);
        return true;
    };
    binding = {
        field: fieldElement,
        button: buttonElement,
        output: outputElement,
        unbind,
        translate: translateBinding,
        setOverridesEnabled(enabled) {
            bindingOverridesEnabled = Boolean(enabled);
            return bindingOverridesEnabled;
        },
        getOverridesEnabled: () => bindingOverridesEnabled,
        isBound: () => isCurrent()
    };
    buttonElement.addEventListener('click', clickHandler);
    translatorBindingsByButton.set(buttonElement, binding);
    activeTranslatorBindings.add(binding);
    return binding;
}


function assertTranslatorText(text) {
    if (typeof text !== 'string') throw new TypeError('Translator input must be a string.');
    return text;
}

function assertTranslatorNotDestroyed() {
    if (runtimeState.lifecycleState === 'destroyed') throw new Error('Translator has been destroyed. Load the engine again before translating.');
}

function assertTranslatorReady() {
    assertTranslatorNotDestroyed();
    if (!runtimeState.tokenizer) throw new Error('Translator is not ready yet. Await RomajiTranslator.ready or use the async translate() method.');
}

function translateWithReadingAudit(text, options = {}) {
    const sourceText = assertTranslatorText(text);
    const previousCapture = runtimeState.captureTranslationDiagnostics;
    runtimeState.captureTranslationDiagnostics = true;
    runtimeState.lastTranslationDiagnostics = null;
    try {
        const romaji = translateText(sourceText, { historicalKana: Boolean(options.historicalKana) });
        const audit = runtimeState.lastTranslationDiagnostics || attachTranslationAuditStatistics({
            sourceText,
            normalizedSourceText: normalizeTranslatorInputText(sourceText),
            output: romaji,
            readings: [],
            sourceCounts: {},
            redFlags: [],
            requiresReview: false
        });
        return { romaji, audit };
    } finally {
        runtimeState.captureTranslationDiagnostics = previousCapture;
    }
}

let publicTranslatorApi = null;

function clearRuntimeStateForDestruction() {
    for (const binding of [...activeTranslatorBindings]) binding.unbind();
    disposeBuiltInUiLifecycle();
    for (const value of Object.values(runtimeState)) {
        if (value instanceof Map || value instanceof Set) value.clear();
        else if (Array.isArray(value)) value.length = 0;
    }
    runtimeState.overrides = {};
    runtimeState.contextOverrides = [];
    runtimeState.kanjiDictionary = {};
    runtimeState.particleExpressions = {};
    runtimeState.tokenizer = null;
    runtimeState.failure = null;
    runtimeState.captureTranslationDiagnostics = false;
    runtimeState.lastTranslationDiagnostics = null;
    runtimeState.lifecycleState = 'destroyed';
    statusBanner = null;
    inputArea = null;
    outputDiv = null;
    translationReviewDiv = null;
    kanjiReadingsDiv = null;
    kanjiSearchInput = null;
    kanjiReadingConsumers = [];
}

function destroyTranslator() {
    if (runtimeState.lifecycleState === 'loading') throw new Error('Translator cannot be destroyed while it is loading. Await RomajiTranslator.ready first.');
    if (runtimeState.lifecycleState === 'destroyed') return false;
    clearRuntimeStateForDestruction();
    if (runtimeDiagnosticsBridgeValue && window[RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL] === runtimeDiagnosticsBridgeValue) delete window[RUNTIME_DIAGNOSTICS_BRIDGE_SYMBOL];
    runtimeDiagnosticsBridgeValue = null;
    runtimeDiagnosticsTools = null;
    runtimeDiagnosticsSnapshot = null;
    runtimeDiagnosticsExtras = {};
    if (window.RomajiTranslator === publicTranslatorApi) delete window.RomajiTranslator;
    if (window[ENGINE_INSTANCE_SYMBOL] === ENGINE_INSTANCE_TOKEN) delete window[ENGINE_INSTANCE_SYMBOL];
    return true;
}


publicTranslatorApi = Object.freeze({
    ready: translatorReady,
    translate: async text => { const sourceText = assertTranslatorText(text); assertTranslatorNotDestroyed(); await translatorReady; assertTranslatorNotDestroyed(); return translateText(sourceText); },
    translateSync: text => {
        assertTranslatorReady();
        return translateText(assertTranslatorText(text));
    },
    translateHistorical: async text => { const sourceText = assertTranslatorText(text); assertTranslatorNotDestroyed(); await translatorReady; assertTranslatorNotDestroyed(); return translateText(sourceText, { historicalKana: true }); },
    translateHistoricalSync: text => {
        assertTranslatorReady();
        return translateText(assertTranslatorText(text), { historicalKana: true });
    },
    translateWithAudit: async (text, options = {}) => {
        const sourceText = assertTranslatorText(text);
        assertTranslatorNotDestroyed();
        await translatorReady;
        assertTranslatorNotDestroyed();
        return translateWithReadingAudit(sourceText, options);
    },
    translateWithAuditSync: (text, options = {}) => {
        assertTranslatorReady();
        return translateWithReadingAudit(text, options);
    },
    isReady: () => runtimeState.lifecycleState === 'ready' && Boolean(runtimeState.tokenizer),
    getStatus: () => runtimeStatusSnapshot(),
    getWarnings: () => ({
        data: [...runtimeState.resourceWarnings],
        developer: [...runtimeState.developerWarnings]
    }),
    getDiagnostics: () => getTranslatorDiagnostics(),
    getKanjiReadings: async (text, options = {}) => {
        const sourceText = assertTranslatorText(text);
        assertTranslatorNotDestroyed();
        await translatorReady;
        assertTranslatorNotDestroyed();
        return getKanjiReadingData(sourceText, options.search || '');
    },
    getKanjiReadingsSync: (text, options = {}) => {
        assertTranslatorReady();
        return getKanjiReadingData(assertTranslatorText(text), options.search || '');
    },
    disposeUi: () => { assertTranslatorNotDestroyed(); return disposeBuiltInUiLifecycle(); },
    refreshUi: () => { assertTranslatorNotDestroyed(); return refreshBuiltInUiLifecycle(); },
    setOverridesEnabled: enabled => {
        assertTranslatorNotDestroyed();
        runtimeState.overridesEnabled = Boolean(enabled);
        return runtimeState.overridesEnabled;
    },
    bind: bindTranslator,
    destroy: destroyTranslator
});
window.RomajiTranslator = publicTranslatorApi;
    } catch (error) {
        if (window[ENGINE_INSTANCE_SYMBOL] === ENGINE_INSTANCE_TOKEN) delete window[ENGINE_INSTANCE_SYMBOL];
        throw error;
    }
}());
//# sourceMappingURL=translator-engine.js.map
