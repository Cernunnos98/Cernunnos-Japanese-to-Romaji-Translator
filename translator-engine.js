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
 *   sourceStart?: number, sourceEnd?: number, sourceSurface?: string,
 *   sourceSpanReconciled?: boolean, sourceSpanReconciliationReason?: string, sourceSpanGrammarBoundary?: boolean, sourceSpanGrammarBoundaryBefore?: boolean,
 *   value?: string,
 *   particle?: boolean, prefix?: boolean, suffix?: boolean, nominalizer?: boolean, grammatical?: boolean,
 *   fullGrammaticalExpression?: boolean, titleSeparator?: boolean, crossNotationSymbol?: boolean, nameContinuation?: boolean, nameGivenStart?: boolean, canonicalBoundary?: boolean, hardBoundaryReconstructed?: boolean,
 *   morphologicalJoinLeft?: boolean, joinLeftAfterSokuon?: boolean, startsSeparateAuxiliaryUnit?: boolean, tokenizationRoleBoundaryBefore?: boolean, tokenizationRoleRepair?: string,
 *   numericExpression?: boolean,
 *   contextualOverrideMatched?: boolean, contextualRomaji?: string,
 *   titleReadingEvidenceMatched?: boolean, titleReadingEvidenceReading?: string|null, titleReadingEvidenceRomaji?: string|null, titleReadingEvidenceKind?: string,
 *   reviewedProperNameSpanMatched?: boolean, reviewedProperNameSpanRomaji?: string|null,
 *   reviewedNameHonorificMatched?: boolean, reviewedNameHonorificReading?: string|null,
 *   typedTemporalExpressionMatched?: boolean, typedTemporalExpressionType?: string, typedTemporalReading?: string|null, typedTemporalSource?: string, typedTemporalSpanLexicalCollision?: any, typedTemporalSuffix?: boolean,
 *   typedNumericExpressionMatched?: boolean, typedNumericExpressionType?: string, typedNumericReading?: string|null, typedNumericSource?: string,
 *   authoritativeSpanMatched?: boolean, authoritativeSpanCategory?: string, authoritativeSpanReading?: string|null, authoritativeSpanRomaji?: string|null, authoritativeSpanSource?: string, authoritativeSpanConfidence?: number, authoritativeSpanReviewRequired?: boolean, authoritativeSpanVariantMappings?: any[],
 *   reviewedNumericAliasMatched?: boolean, reviewedNumericAliasReading?: string|null, reviewedNumericAliasRomaji?: string|null, reviewedNumericAliasSource?: string,
 *   variantProperNounMatched?: boolean, variantCanonicalRetokenized?: boolean, variantOriginalSurface?: string, variantLookupSurface?: string, variantMappings?: any[],
 *   latinPassthroughMatched?: boolean, latinPassthroughOutput?: string,
 *   knownPhraseMatched?: boolean, knownPhraseValue?: string, knownPhraseSource?: string,
 *   loanwordMatched?: boolean, loanwordOutput?: string,
 *   commonWordMatched?: boolean, commonWordReading?: string|null, commonWordRomaji?: string|null,
 *   contextualReadingEvidenceMatched?: boolean, contextualReadingEvidenceReading?: string|null, contextualReadingEvidenceRomaji?: string|null, contextualReadingEvidenceSource?: string, contextualReadingEvidenceScore?: number, contextualReadingEvidenceMargin?: number, contextualReadingEvidenceAmbiguous?: boolean, contextualReadingEvidenceCandidates?: CJ2RReadingCandidate[],
 *   historicalKanaEvidenceMatched?: boolean, historicalKanaEvidenceReading?: string|null,
 *   rendakuEvidenceMatched?: boolean, rendakuEvidenceReading?: string|null, rendakuApplied?: boolean,
 *   exactDictionaryRescueMatched?: boolean, exactDictionaryRescueSource?: string, exactDictionaryRescueConfidence?: number,
 *   kanaLexicalSpanMatched?: boolean, kanaLexicalSpanReading?: string|null,
 *   atejiMatched?: boolean, atejiReading?: string|null,
 *   generalWordMatched?: boolean, generalWordReading?: string|null, generalWordAmbiguous?: boolean, generalWordCandidates?: CJ2RReadingCandidate[], generalWordVariantMappings?: any[],
 *   ordinaryCompoundReadingMatched?: boolean, ordinaryCompoundReading?: string|null, ordinaryCompoundReadingCandidates?: CJ2RReadingCandidate[],
 *   iterationMarkFallbackMatched?: boolean, iterationMarkFallbackReading?: string|null,
 *   nameContextAmbiguous?: boolean,
 *   readingResolution?: CJ2RReadingResolution,
 *   getReading?: (() => string|null)|undefined
 * }} CJ2RToken
 */
/** @typedef {{reading?: string, romaji?: string, weight?: number, rank?: number|null, categories?: Iterable<string>, sources?: Iterable<string>}} CJ2RReadingCandidate */
/** @typedef {{surface: string, reading: string|null, romaji: string|null, source: string, confidence: number, candidates: CJ2RReadingCandidate[], flags: string[], variantMappings: any[], ambiguous: boolean, hanScope?: string|null, scopeEvidence?: any[], reviewSignals: CJ2RReviewSignal[]}} CJ2RReadingResolution */
/** @typedef {'candidate'|'active'|'resolved'|'superseded'|'final-active'} CJ2RReviewSignalState */
/** @typedef {{surface: string, flag: string, source: string, confidence: number, category: string, policyRequiresReview: boolean, requiresReview: boolean, rationale: string, state: CJ2RReviewSignalState, lifecycle: CJ2RReviewSignalState[], resolutionReason?: string|null, supersededBy?: string|null}} CJ2RReviewSignal */
/** @typedef {{requiresReview: boolean, resolvedOutputRequiresReview: boolean, literalUnresolved: number, hasLiteralUnresolved: boolean, unresolvedJapaneseReadings: number, unresolvedJapaneseHan: number, outOfScopeInput: number, unknownJapaneseScopeStatus: number}} CJ2RAuditStatistics */
/** @typedef {{sourceText: string, normalizedSourceText: string, output: string, readings: any[], sourceCounts: Record<string, number>, redFlags: CJ2RReviewSignal[], requiresReview: boolean, statistics: CJ2RAuditStatistics}} CJ2RTranslationDiagnostics */
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
 *   loanwordDictionary: Map<string, any>, loanwordPrefixes: Set<string>, compoundWordDictionary: Map<string, any>, atejiDictionary: Map<string, any>, atejiPrefixes: Set<string>,
 *   properNounDictionary: Map<string, any>, properNounPrefixes: Set<string>, reviewedProperNameSpanDictionary: Map<string, any>, reviewedProperNameSpanPrefixes: Set<string>,
 *   readingEvidenceDictionary: Map<string, any>, contextualReadingDictionary: Map<string, any>, contextFeatureGroups: Map<string, any>, reviewedReadingPreferenceDictionary: Map<string, any>, reviewedReadingSpanDictionary: Map<string, any>,
 *   rendakuEvidenceDictionary: Map<string, any>, rendakuEvidencePrefixes: Set<string>, historicalKanaEvidenceDictionary: Map<string, any>, historicalKanaEvidencePrefixes: Set<string>, counterDateReadingDictionary: Map<string, any>,
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
    generalWords: { paths: ['data/general-words/general-words-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'general-word-bank-v1' },
    loanwords: { paths: ['data/loanwords/loanwords-term-bank-1.json'], criticality: ASSET_CRITICALITY.CRITICAL, type: 'json', schema: 'loanword-bank-v1' },
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
            && Number.isFinite(Number(candidate.minScore)) && Number(candidate.minScore) > 0));
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
            && (entry.conjugationClass == null || ['godan-ra'].includes(String(entry.conjugationClass)));
    }),
    'general-word-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry)
        && isText(entry[0])
        && Array.isArray(entry[1])
        && entry[1].length > 0
        && entry[1].every(reading => Array.isArray(reading) && isSemanticKanaReading(reading[0]) && Number.isFinite(Number(reading[1]))))
        && hasNoConflictingRows(data, entry => entry[0], entry => entry[1]),
    'loanword-bank-v1': data => isNonEmptyRowBank(data, entry => Array.isArray(entry)
        ? isText(entry[0]) && isRule0RomajiEvidence(entry[1])
        : isPlainObject(entry) && isText(entry.surface) && isRule0RomajiEvidence(entry.output))
        && hasNoConflictingRows(data, entry => Array.isArray(entry) ? entry[0] : entry.surface, entry => normalizeReviewedRomaji(Array.isArray(entry) ? entry[1] : entry.output)),
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
        && isText(entry.surface) && isSemanticKanaReading(entry.reading) && isRule0RomajiEvidence(entry.romaji) && isText(entry.category))
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
        && isSemanticKanaReading(entry.reading) && isRule0RomajiEvidence(entry.romaji))
        && hasNoConflictingRows(data, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), normalizeReviewedRomaji(entry.romaji), entry.aliases || []]),
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
            && (entry.numericCanonical == null || isText(entry.numericCanonical))
            && (entry.numericRole == null || ['numeral', 'counter'].includes(String(entry.numericRole))))
        && hasNoConflictingRows(data.preferences, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), entry.alternatives, entry.numericCanonical || null, entry.numericRole || null])
        && Array.isArray(data.spans)
        && data.spans.every(entry => isPlainObject(entry)
            && isText(entry.surface)
            && isSemanticKanaReading(entry.reading)
            && (entry.romaji == null || isRule0RomajiEvidence(entry.romaji)))
        && hasNoConflictingRows(data.spans, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), normalizeReviewedRomaji(entry.romaji || '')]),
    'rendaku-evidence-v1': data => Array.isArray(data) && data.every(entry => isPlainObject(entry) && isText(entry.surface) && isSemanticKanaReading(entry.reading))
        && hasNoConflictingRows(data, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), Boolean(entry.rendaku), String(entry.source || '').trim()]),
    'historical-kana-evidence-v1': data => isPlainObject(data)
        && Array.isArray(data.entries)
        && data.entries.every(entry => isPlainObject(entry) && isText(entry.surface) && isSemanticKanaReading(entry.reading))
        && hasNoConflictingRows(data.entries, entry => entry.surface, entry => [normalizeEvidenceReading(entry.reading), String(entry.pos || '').trim(), String(entry.source || '').trim()])
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
    const previous = [statusBanner, inputArea, outputDiv, kanjiReadingsDiv, kanjiSearchInput];
    const previousConsumers = kanjiReadingConsumers;
    const hadCustomKanjiTarget = previousConsumers.some(consumer => consumer.isCustomTarget);
    statusBanner = document.getElementById('status-banner');
    inputArea = document.getElementById('input');
    outputDiv = document.getElementById('output');
    kanjiReadingsDiv = document.getElementById('kanji-readings');
    kanjiSearchInput = document.getElementById('kanji-search');
    kanjiReadingConsumers = collectKanjiReadingConsumers(scanKanjiTargets || hadCustomKanjiTarget);

    setVisibility(statusBanner, true);
    const current = [statusBanner, inputArea, outputDiv, kanjiReadingsDiv, kanjiSearchInput];
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
const unresolvedJapaneseOrthographicCharacters = new Set(['ゝ','ゞ','ヽ','ヾ','〆','゛']);

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
        /^[ぁ-ゖゟァ-ヺヿー]$/u.test(character) || unresolvedJapaneseOrthographicCharacters.has(character));
}
const canonicalHardBoundarySymbols = new Set(['~','|','+','=','×','⋯','⋮']);
const canonicalHardWhitespaceCharacters = new Set(['\n','\r','\t','\u2028','\u2029','\u3000']);

function normalizeJapanesePunctuationCompatibility(value) {
    return String(value || '')
        .replace(japanesePunctuationCompatibilityPattern, character => {
            if (character === '\uFE19' || character === '\uFE30') return '…';
            return character.normalize('NFKC');
        })
        .replace(/[\uFF01-\uFF5E\uFF61-\uFF65]+/gu, segment => segment.normalize('NFKC'))
        .replace(/[‐‑]/gu, '-')
        .replace(/‒/gu, '–');
}

function canonicalizeTokenizerBoundaryCharacters(value) {
    return normalizeJapanesePunctuationCompatibility(String(value || '')).replace(/[~～〜〰]/gu, '~');
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
    if (!character || japaneseOrthographicNonBoundaryCharacters.has(character)) return false;
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
        index += 1;
        while (index < text.length
            && isCanonicalHardBoundaryAt(text, index)
            && canonicalHardWhitespaceCharacters.has(text[index]) === whitespace) index += 1;
        runs.push({ start, end: index, surface: text.slice(start, index), whitespace });
    }
    return runs;
}

function splitCanonicalHardBoundarySegments(value) {
    const text = String(value || '');
    const segments = [];
    let cursor = 0;
    for (const boundary of getCanonicalHardBoundaryRuns(text)) {
        const segment = text.slice(cursor, boundary.start).trim();
        if (segment) segments.push(segment);
        cursor = boundary.end;
    }
    const tail = text.slice(cursor).trim();
    if (tail) segments.push(tail);
    return segments;
}

function normalizeTranslatorInputText(value) {
    const composed = normalizeSpacingKanaVoicingMarks(value).normalize('NFC');
    const compatibilityNormalised = normalizeJapanesePunctuationCompatibility(composed);
    const widthNormalised = compatibilityNormalised.replace(/[\uFF01-\uFF5E\uFF61-\uFF9F]+/gu, segment => segment.normalize('NFKC'));
    const boundaryNormalised = canonicalizeTokenizerBoundaryCharacters(widthNormalised);
    const withoutSelectors = stripIdeographicVariationSelectors(boundaryNormalised);
    return normalizeKanjiForLookup(withoutSelectors);
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
    for (const filePath of lexicalTermBankFiles.compoundWords) {
        const data = await fetchJsonAsset('compoundWords', filePath, `Compound-word term bank unavailable: ${filePath}`);
        if (Array.isArray(data)) parseCompoundWordMatrix(data);
    }
    finalizeCompoundWordDictionary();
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
            if (!surface || !reading) continue;
            let pattern = null;
            if (patternText) {
                try { pattern = compileReviewedPattern(patternText, 'u'); }
                catch (error) {
                    console.warn(`Invalid common-word pattern: ${patternText}`, error);
                    runtimeState.resourceWarnings.add(`Invalid common-word pattern: ${patternText}`);
                    continue;
                }
            }
            const rules = runtimeState.commonWordDictionary.get(surface) || [];
            rules.push({ reading, pattern, romaji: romaji || null, conjugationClass: conjugationClass || null });
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

function registerKanaLexicalReadingEvidence(surface, reading, source) {
    const cleanSurface = String(surface || '').trim();
    const normalizedReading = normalizeKanaReading(reading || '').trim();
    if (!cleanSurface || !normalizedReading || !/^[ぁ-ゖー]+$/u.test(normalizedReading) || !containsHan(cleanSurface)) return;
    const existing = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading) || { surfaces: new Set(), sources: new Set() };
    existing.surfaces.add(cleanSurface);
    existing.sources.add(source);
    runtimeState.kanaLexicalReadingDictionary.set(normalizedReading, existing);
    addSurfacePrefixes(runtimeState.kanaLexicalReadingPrefixes, normalizedReading);
}

async function loadGeneralWordDictionary() {
    for (const filePath of lexicalTermBankFiles.generalWords) {
        const data = await fetchJsonAsset('generalWords', filePath, `General-word term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            if (!Array.isArray(entry)) continue;
            const surface = String(entry[0] || '').trim();
            const rawReadings = Array.isArray(entry[1]) ? entry[1] : [];
            const mergeSafe = Boolean(entry[2]);
            if (!surface || !rawReadings.length) continue;
            const readings = rawReadings.map(item => ({
                reading: normalizeDictionaryReading(Array.isArray(item) ? item[0] : ''),
                score: Number(Array.isArray(item) ? item[1] || 0 : 0)
            })).filter(item => item.reading).sort((a, b) => b.score - a.score);
            if (!readings.length) continue;
            setUniqueDictionaryEntry(runtimeState.generalWordDictionary, surface, { readings, mergeSafe }, 'general-word');
            if (mergeSafe) {
                for (const item of readings) registerKanaLexicalReadingEvidence(surface, item.reading, 'general-word');
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
            if (surface && output) setUniqueDictionaryEntry(runtimeState.loanwordDictionary, surface, output, 'loanword');
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
    const directHint = hints.find(hint => normalizeKanaReading(hint.reading) === normalizedReading);
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
        const normalizedPatternText = normalizeReviewedPatternKanjiLiterals(canonicalizeTokenizerBoundaryCharacters(rule.patternText));
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

    for (const surface of runtimeState.loanwordDictionary.keys()) {
        addSurfacePrefixes(runtimeState.loanwordPrefixes, surface);
        addSurfacePrefixes(runtimeState.loanwordPrefixes, normalizeKanjiForLookup(surface));
    }
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
                    pattern: compileReviewedPattern(canonicalizeTokenizerBoundaryCharacters(patternText), 'i'),
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
        if (entry?.readings?.length !== 1) continue;
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.readings[0].reading,
            source: 'single-reading-general-word-evidence',
            confidence: 0.98,
            priority: 70,
            category: 'general-word'
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
            category: 'loanword'
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
            category: 'counter-date'
        });
    }
    for (const [surface, entry] of runtimeState.reviewedReadingSpanDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
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
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const aliases = Array.isArray(entry?.aliases) ? entry.aliases.map(value => String(value || '').trim()).filter(Boolean) : [];
        const reading = normalizeDictionaryReading(entry?.reading);
        const romaji = normalizeDictionaryRomaji(entry?.romaji);
        if (!surface || !reading || !romaji) continue;
        for (const reviewedSurface of [surface, ...aliases]) {
            setUniqueDictionaryEntry(runtimeState.counterDateReadingDictionary, reviewedSurface, { reading, romaji }, 'counter/date');
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
        if (!surface || !reading || !romaji) continue;
        setUniqueDictionaryEntry(runtimeState.reviewedReadingSpanDictionary, surface, {
            reading,
            romaji,
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
        if (!surface || !reading || !/^[ぁ-ゖァ-ンヴー]+$/u.test(reading)) continue;
        setUniqueDictionaryEntry(runtimeState.historicalKanaEvidenceDictionary, surface, {
            reading,
            pos: String(entry?.pos || '名詞').trim() || '名詞',
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
        if (Number.isInteger(explicitStart) && Number.isInteger(explicitEnd)
            && explicitStart >= cursor && explicitEnd >= explicitStart
            && text.slice(explicitStart, explicitEnd) === surface) {
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
    const ranges = findSourceTokenRanges(tokens, sourceText);
    return (tokens || []).map((token, index) => {
        const range = ranges[index];
        if (!range) return token;
        return {
            ...token,
            sourceStart: range.start,
            sourceEnd: range.end,
            sourceSurface: String(sourceText || '').slice(range.start, range.end)
        };
    });
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
    return Boolean(token?.reviewedLexicalBoundaryBefore || token?.tokenizationRoleBoundaryBefore);
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
function isPrefix(token) { return Boolean(token) && token.pos === '接頭詞'; }
function isSuffix(token) { return Boolean(token) && (token.pos === '接尾詞' || token.pos_detail_1 === '接尾'); }
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
        merged.push({
            ...tokens[index],
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
        });
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
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', commonWordMatched: true, commonWordReading: bestMatch.reading, commonWordRomaji: bestMatch.romaji || null
        });
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
            if (!contextualPatternContainsRange(evidence.pattern, sourceText, candidateRange)) continue;
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
        merged.push({
            ...tokens[index],
            surface_form: bestMatch.surface,
            reading: bestMatch.reading || tokens[index].reading,
            pronunciation: bestMatch.reading || tokens[index].pronunciation,
            titleReadingEvidenceMatched: true,
            titleReadingEvidenceReading: bestMatch.reading || null,
            titleReadingEvidenceRomaji: bestMatch.romaji,
            titleReadingEvidenceKind: bestMatch.kind,
            titleReadingEvidenceSource: bestMatch.source,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        });
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
    return lookup.entry.readings.map(item => ({
        reading: item.reading,
        romaji: convertToRomaji(item.reading),
        weight: item.score,
        rank: Number.POSITIVE_INFINITY,
        categories: new Set(['lexical']),
        sources: new Set(['jitendex-general-word'])
    }));
}

function selectGeneralWordReading(lookup) {
    const readings = lookup?.entry?.readings || [];
    if (!readings.length) return null;
    if (readings.length === 1) return readings[0];
    return readings[0].score - readings[1].score >= 50 ? readings[0] : null;
}

/** @param {CJ2RToken} token */
function resolveGeneralWordFallback(token) {
    if (!token || isProperNounToken(token) || isParticle(token) || isPrefix(token) || isSuffix(token) || token.pos === '助動詞') return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const selected = selectGeneralWordReading(lookup);
    const candidates = getGeneralWordCandidates(lookup);
    const ambiguous = candidates.length > 1;
    // An ambiguous general-word entry still contains attested ranked readings.
    // Use the highest-ranked candidate only as provisional visible output while
    // retaining ambiguity metadata so diagnostics continue to require review.
    const provisional = selected || lookup.entry.readings[0] || null;
    return {
        reading: provisional?.reading || null,
        source: selected ? 'general-word-fallback' : 'general-word-ranked-ambiguous',
        confidence: selected ? (ambiguous ? 0.78 : 0.86) : 0.55,
        candidates,
        flags: [
            ...(provisional ? ['fallback-reading'] : []),
            ...(ambiguous ? ['general-word-ambiguous'] : []),
            ...(lookup.variant ? ['variant-reading-evidence'] : [])
        ],
        variantMappings: lookup.variant?.mappings || [],
        ambiguous
    };
}

function assessGeneralWordReading(token, currentReading) {
    if (!token || !currentReading) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const normalized = normalizeKanaReading(currentReading);
    const matchedIndex = lookup.entry.readings.findIndex(item => normalizeKanaReading(item.reading) === normalized);
    const strongPreference = lookup.entry.readings.length > 1
        ? lookup.entry.readings[0].score - lookup.entry.readings[1].score >= 50
        : Boolean(lookup.entry.readings.length);
    return {
        matched: matchedIndex >= 0,
        matchedIndex,
        candidates: getGeneralWordCandidates(lookup),
        strongPreference,
        variantMappings: lookup.variant?.mappings || []
    };
}

function isGeneralWordSegmentSeparatorToken(token) {
    return Boolean(token && /^[~～〜]$/u.test(String(token.surface_form || '')));
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
    const segmentTokens = tokens.slice(startIndex, endIndex + 1);
    if (!segmentTokens.length) return null;
    const segmentSurface = segmentTokens.map(token => String(token?.surface_form || '')).join('');
    const segmentIndex = tokens.slice(0, startIndex).filter(isGeneralWordSegmentSeparatorToken).length;
    const sourceSegments = String(sourceText || '').split(/[~～〜]/u);
    if (!segmentSurface || sourceSegments[segmentIndex] !== segmentSurface) return null;
    const lookup = getGeneralWordLookup(segmentSurface);
    if (!lookup?.entry?.readings?.length || lookup.entry.mergeSafe || lookup.entry.readings.length < 2) return null;
    if (hasStrongerGeneralWordSegmentEvidence(segmentTokens, segmentSurface)) return null;
    const provisional = lookup.entry.readings[0];
    return {
        surface: segmentSurface,
        reading: provisional.reading,
        length: segmentTokens.length,
        candidates: getGeneralWordCandidates(lookup),
        ambiguous: true,
        variantMappings: lookup.variant?.mappings || [],
        exactGeneralWordSegmentFallback: true
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
        if (!lookup?.entry?.mergeSafe) continue;
        const selected = selectGeneralWordReading(lookup);
        // mergeSafe answers the span-boundary question independently from the
        // reading-ambiguity question. When several readings remain, preserve
        // them for review but use the bank's top-ranked attested reading as a
        // provisional output rather than discarding the whole lexical span.
        const provisional = selected || lookup.entry.readings[0] || null;
        if (!provisional) continue;
        bestMatch = {
            surface: candidateSurface,
            reading: provisional.reading,
            length: end - startIndex + 1,
            candidates: getGeneralWordCandidates(lookup),
            ambiguous: lookup.entry.readings.length > 1,
            variantMappings: lookup.variant?.mappings || []
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
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', generalWordMatched: true,
            generalWordReading: bestMatch.reading, generalWordCandidates: bestMatch.candidates,
            generalWordAmbiguous: bestMatch.ambiguous, generalWordVariantMappings: bestMatch.variantMappings,
            numericExpression,
            authoritativeSpanMatched: false, authoritativeSpanReading: null, authoritativeSpanRomaji: null,
            authoritativeSpanSource: null, authoritativeSpanCategory: null, authoritativeSpanVariantMappings: []
        });
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
        merged.push({
            ...tokens[index],
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
        });
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
        if (!token || token.pos === '記号' || token.contextualOverrideMatched) break;
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
    const remainder = Array.from(surface).slice(consumedCharacters).join('');
    if (!remainder) return [];
    // This is a post-tokenisation repair for an attested historical boundary.
    // Only the overshooting token fragment is retokenised; sentence context stays intact elsewhere.
    return runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [{ ...token, surface_form: remainder, reading: remainder, pronunciation: remainder }];
}

function mergeHistoricalKanaEvidenceTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestHistoricalKanaEvidence(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push({
            ...tokens[index],
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
        });
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
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading, atejiMatched: true, atejiReading: bestMatch.reading });
        index += bestMatch.length - 1;
    }
    return merged;
}

function canContinueLoanword(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.loanwordPrefixes.has(originalSurface)
        || runtimeState.loanwordPrefixes.has(normalizeKanjiForLookup(originalSurface));
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
    return segments.map((segment, index) => ({
        ...token,
        surface_form: segment.surface,
        reading: segment.surface,
        pronunciation: segment.surface,
        pos: '名詞',
        pos_detail_1: '一般',
        pos_detail_2: '*',
        loanwordMatched: true,
        loanwordOutput: segment.output,
        ...(index > 0 ? { reviewedLexicalBoundaryBefore: true, reviewedLexicalBoundarySource: 'reviewed-loanword-segmentation' } : {})
    }));
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
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, loanwordMatched: true, loanwordOutput: bestMatch.output });
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
    return {
        ...span[0],
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
    };
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
    return {
        ...token,
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        iterationMarkFallbackMatched: true,
        iterationMarkFallbackReading: reading
    };
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
                merged.push(makeIterationFallbackToken(token, surface + '々', reading + reading));
                index += 1;
                continue;
            }
        }

        if (!hasReviewedLexicalBoundaryBefore(next) && Object.prototype.hasOwnProperty.call(kanaIterationMarkVoicing, String(next?.surface_form || ''))) {
            const combinedSurface = surface + String(next.surface_form || '');
            const reading = expandKanaIterationReading(combinedSurface);
            if (reading) {
                merged.push(makeIterationFallbackToken(token, combinedSurface, reading));
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
        return [{
            ...token,
            surface_form: remainder,
            reading: honorificReading,
            pronunciation: honorificReading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading
        }];
    }
    return tokenizeHistoricalRemainder(token, consumedCharacters);
}

function mergeReviewedProperNameSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestReviewedProperNameSpan(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const personLike = bestMatch.category === 'person' || bestMatch.category === 'name';
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: personLike ? '人名' : '地域', pos_detail_3: '*',
            reviewedProperNameSpanMatched: true, reviewedProperNameSpanRomaji: bestMatch.romaji,
            reviewedProperNameLookupSurface: bestMatch.lookupSurface,
            reviewedProperNameVariantMappings: normalizeKanjiForLookupDetailed(bestMatch.surface, { names: true }).mappings
        });
        const finalToken = tokens[bestMatch.endIndex];
        const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
        if (bestMatch.endOffset < finalLength) merged.push(...tokenizeReviewedNameRemainder(finalToken, bestMatch.endOffset));
        index = bestMatch.endIndex;
    }
    return merged;
}

function getProperNounCandidateLookup(surface) {
    const originalSurface = String(surface || '');
    const variantEvidence = normalizeKanjiForLookupDetailed(originalSurface, { names: true });
    const exact = runtimeState.properNounDictionary.get(originalSurface);
    if (exact?.size) {
        return { candidates: [...exact.values()], lookupSurface: originalSurface, variant: null, variantEvidence: variantEvidence.changed ? variantEvidence : null };
    }
    if (!variantEvidence.changed || !variantEvidence.normalizedSurface) {
        return { candidates: [], lookupSurface: originalSurface, variant: null, variantEvidence: null };
    }
    const normalized = runtimeState.properNounDictionary.get(variantEvidence.normalizedSurface);
    return normalized?.size
        ? { candidates: [...normalized.values()], lookupSurface: variantEvidence.normalizedSurface, variant: variantEvidence, variantEvidence }
        : { candidates: [], lookupSurface: originalSurface, variant: null, variantEvidence };
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
    return runtimeState.properNounPrefixes.has(normalizeKanjiForLookup(original, { names: true }));
}

function findLongestVariantProperNoun(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token) break;
        const tokenSurface = String(token.surface_form || '');
        const hanSurface = containsHan(tokenSurface);
        if (((token.pos === '記号' && tokenSurface !== '々') || isParticle(token) || token.contextualOverrideMatched) && !hanSurface) break;
        candidateSurface += tokenSurface;
        if (!canContinueVariantProperNounSpan(candidateSurface)) break;
        const hanCount = Array.from(candidateSurface).filter(isHanCharacter).length;
        if (hanCount < 2) continue;
        const lookup = getProperNounCandidateLookup(candidateSurface);
        if (!lookup.variantEvidence || !lookup.candidates.length) continue;
        bestMatch = { surface: candidateSurface, lookupSurface: lookup.lookupSurface, candidates: lookup.candidates, variant: lookup.variantEvidence, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function tokenizeCanonicalVariantProperNoun(bestMatch) {
    if (!runtimeState.tokenizer || !bestMatch?.lookupSurface) return [];
    const canonicalTokens = runtimeState.tokenizer.tokenize(bestMatch.lookupSurface) || [];
    const reconstructed = canonicalTokens.map(token => String(token.surface_form || '')).join('');
    if (!canonicalTokens.length || reconstructed !== bestMatch.lookupSurface) return [];
    return canonicalTokens.map(token => ({
        ...token,
        variantCanonicalRetokenized: true,
        variantOriginalSurface: bestMatch.surface,
        variantLookupSurface: bestMatch.lookupSurface,
        variantMappings: bestMatch.variant.mappings
    }));
}

function mergeVariantProperNounTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestVariantProperNoun(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const canonicalTokens = tokenizeCanonicalVariantProperNoun(bestMatch);
        if (canonicalTokens.length) {
            merged.push(...canonicalTokens);
            index += bestMatch.length - 1;
            continue;
        }
        const details = inferVariantProperNounDetails(bestMatch.candidates);
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: '*', pronunciation: '*', pos: '名詞', pos_detail_1: '固有名詞',
            pos_detail_2: details.pos_detail_2, pos_detail_3: details.pos_detail_3, variantProperNounMatched: true,
            variantLookupSurface: bestMatch.lookupSurface, variantMappings: bestMatch.variant.mappings
        });
        index += bestMatch.length - 1;
    }
    return merged;
}

// Source section: Proper-name ranking, Kuromoji pronunciation safeguards and reading evidence.
function getProperNounCategoryHints(token) {
    const hints = new Set();
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
function resolveProperNounReading(token) {
    if (!token || !isProperNounToken(token)) return null;
    const lookup = getProperNounCandidateLookup(token.surface_form);
    const candidates = lookup.candidates;
    if (!candidates.length) return null;
    const tokenVariantMappings = Array.isArray(token.variantMappings) ? token.variantMappings : [];
    const variant = lookup.variant || ((token.variantCanonicalRetokenized || token.variantProperNounMatched) && tokenVariantMappings.length
        ? { mappings: tokenVariantMappings }
        : null);
    const sourcePrefix = variant ? 'proper-noun-variant' : 'proper-noun';
    const variantFlags = variant ? ['variant-reading-evidence'] : [];
    const kuromojiReading = getKuromojiDictionaryReading(token);
    const normalizedKuromoji = normalizeKanaReading(kuromojiReading);
    const kuromojiMatch = normalizedKuromoji ? candidates.find(candidate => normalizeKanaReading(candidate.reading) === normalizedKuromoji) : null;
    if (kuromojiMatch) {
        const hints = getProperNounCategoryHints(token);
        const categoryMatches = candidates.filter(candidate => [...candidate.categories].some(category => hints.has(category)));
        const relevantCandidates = categoryMatches.length ? categoryMatches : candidates;
        const relevantReadings = new Set(relevantCandidates.map(candidate => normalizeKanaReading(candidate.reading)));
        const ranking = rankProperNounCandidates(relevantCandidates);
        const rankedMatch = ranking.selected
            && normalizeKanaReading(ranking.selected.reading) === normalizedKuromoji;
        const ambiguous = relevantReadings.size > 1 && (Boolean(variant) || !rankedMatch);
        return {
            reading: kuromojiMatch.reading, romaji: kuromojiMatch.romaji, source: `${sourcePrefix}+kuromoji`,
            confidence: ambiguous ? 0.78 : (variant ? 0.95 : 0.99), candidates,
            flags: [...variantFlags, ...(ambiguous ? ['proper-noun-ambiguous'] : [])],
            variantMappings: variant?.mappings || [], ambiguous
        };
    }
    if (candidates.length === 1) {
        return { reading: candidates[0].reading, romaji: candidates[0].romaji, source: sourcePrefix, confidence: variant ? 0.91 : 0.96, candidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const hints = getProperNounCategoryHints(token);
    const categoryMatches = candidates.filter(candidate => [...candidate.categories].some(category => hints.has(category)));
    const categoryReadings = new Map(categoryMatches.map(candidate => [normalizeKanaReading(candidate.reading), candidate]));
    if (categoryReadings.size === 1) {
        const candidate = [...categoryReadings.values()][0];
        return { reading: candidate.reading, romaji: candidate.romaji, source: `${sourcePrefix}-category`, confidence: variant ? 0.86 : 0.90, candidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const ranking = rankProperNounCandidates(categoryMatches.length ? categoryMatches : candidates);
    if (ranking.selected) {
        return { reading: ranking.selected.reading, romaji: ranking.selected.romaji, source: `${sourcePrefix}-ranked`, confidence: Math.max(0.55, ranking.confidence - (variant ? 0.04 : 0)), candidates, flags: [...variantFlags, 'proper-noun-ambiguous'], variantMappings: variant?.mappings || [], ambiguous: true };
    }
    return { reading: null, romaji: null, source: `${sourcePrefix}-ambiguous`, confidence: variant ? 0.30 : 0.35, candidates, flags: [...variantFlags, 'proper-noun-ambiguous', 'unresolved-reading'], variantMappings: variant?.mappings || [], ambiguous: true };
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
        merged.push({
            ...tokens[index],
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
        });
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

function scoreContextFeatureGroup(tokens, targetIndex, groupId, windowSize) {
    const terms = runtimeState.contextFeatureGroups.get(groupId) || [];
    if (!terms.length) return 0;
    const start = Math.max(0, targetIndex - windowSize);
    const end = Math.min(tokens.length - 1, targetIndex + windowSize);
    const matchedTerms = new Set();
    let score = 0;
    for (let index = start; index <= end; index += 1) {
        if (index === targetIndex) continue;
        const tokenTerms = getContextTokenTerms(tokens[index]);
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !tokenTerms.has(evidence.term)) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    return score;
}

function getContextualReadingEvidenceForToken(token) {
    const surface = String(token?.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    return runtimeState.contextualReadingDictionary.get(surface)
        || (normalized !== surface ? runtimeState.contextualReadingDictionary.get(normalized) : null)
        || null;
}

function getContextSourceWindow(tokens, targetIndex, windowSize, sourceText) {
    if (!sourceText) return '';
    const startIndex = Math.max(0, targetIndex - windowSize);
    const endIndex = Math.min(tokens.length - 1, targetIndex + windowSize);
    const startToken = tokens[startIndex];
    const endToken = tokens[endIndex];
    const startPosition = Number(startToken?.word_position || 0);
    const endPosition = Number(endToken?.word_position || 0);
    if (startPosition > 0 && endPosition > 0) {
        const start = Math.max(0, startPosition - 1);
        const end = Math.min(sourceText.length, endPosition - 1 + String(endToken?.surface_form || '').length);
        if (end > start) return sourceText.slice(start, end);
    }
    return sourceText;
}

function scoreFinalContextFeatureGroup(tokens, targetIndex, groupId, windowSize, sourceText) {
    const terms = runtimeState.contextFeatureGroups.get(groupId) || [];
    if (!terms.length) return 0;
    const start = Math.max(0, targetIndex - windowSize);
    const end = Math.min(tokens.length - 1, targetIndex + windowSize);
    const matchedTerms = new Set();
    let score = 0;
    for (let index = start; index <= end; index += 1) {
        if (index === targetIndex) continue;
        const tokenTerms = getContextTokenTerms(tokens[index]);
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !tokenTerms.has(evidence.term)) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    const sourceWindow = getContextSourceWindow(tokens, targetIndex, windowSize, sourceText);
    const targetSurface = String(tokens[targetIndex]?.surface_form || '');
    for (const evidence of terms) {
        if (matchedTerms.has(evidence.term) || evidence.term === targetSurface || !sourceWindow.includes(evidence.term)) continue;
        matchedTerms.add(evidence.term);
        score += Number(evidence.weight || 0);
    }
    return score;
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
    if (!token) return null;
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

function splitStructuredNumericUnitTokens(tokens) {
    const split = [];
    for (const token of tokens || []) {
        const surface = String(token?.surface_form || '');
        let matchedUnit = null;
        for (const unit of separatedNumericUnitSurfaces) {
            if (surface.endsWith(unit) && isJapaneseNumeralSurface(surface.slice(0, -unit.length))) {
                matchedUnit = unit;
                break;
            }
        }
        if (!matchedUnit) { split.push(token); continue; }
        const numeralSurface = surface.slice(0, -matchedUnit.length);
        const position = Number(token.word_position || 0);
        split.push({
            ...token, surface_form: numeralSurface, reading: '*', pronunciation: '*',
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            structuredNumericSplit: true
        });
        split.push({
            ...token, surface_form: matchedUnit, reading: '*', pronunciation: '*',
            pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
            word_position: position > 0 ? position + numeralSurface.length : position,
            structuredNumericSplit: true
        });
    }
    return split;
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
    return {
        ...token,
        surface_form: '中', reading: 'ジュウ', pronunciation: 'ジュウ',
        pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalSuffix: true
    };
}

function retokenizeTypedBoundaryRemainder(token, remainder) {
    const originalPosition = Number(token?.word_position || 0);
    const basePosition = originalPosition > 0 ? originalPosition + 1 : originalPosition;
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    if (!retokenized.length) return [{
        ...token, surface_form: remainder, reading: '*', pronunciation: '*',
        word_position: basePosition, tokenizationRoleBoundaryBefore: true
    }];
    return retokenized.map((item, index) => ({
        ...item,
        word_position: basePosition > 0 && Number(item.word_position || 0) > 0 ? basePosition + Number(item.word_position) - 1 : Number(item.word_position || 0),
        tokenizationRoleBoundaryBefore: index === 0 || Boolean(item.tokenizationRoleBoundaryBefore)
    }));
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
    return {
        ...span.token,
        surface_form: span.surface,
        reading: reading || '*',
        pronunciation: reading || '*',
        pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
        structuredTemporalHead: true
    };
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
                repaired.push(collision ? { ...token, typedTemporalSpanLexicalCollision: collision } : token);
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

function makeTypedTemporalSpanToken(head, surface, reading) {
    return {
        ...head,
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalExpressionMatched: true,
        typedTemporalExpressionType: 'period-span',
        typedTemporalReading: reading,
        typedTemporalSource: 'typed-period-span'
    };
}

/** @param {string} surface @param {CJ2RToken|null} [token] */
function getTypedTemporalHeadReading(surface, token = null) {
    if (surface === '一日') return 'いちにち';
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
                merged.push(makeTypedTemporalSpanToken(head, headSpan.surface + '中', getTypedTemporalHeadReading(headSpan.surface, head) + 'じゅう'));
                continue;
            }
        }
        if (surface.endsWith('中') && surface.length > 1) {
            const headSurface = surface.slice(0, -1);
            if (isTypedTemporalPeriodSurface(headSurface)) {
                const headReading = getTypedTemporalHeadReading(headSurface);
                if (headReading) {
                    merged.push(makeTypedTemporalSpanToken(token, surface, headReading + 'じゅう'));
                    continue;
                }
            }
        }
        const next = tokens[index + 1];
        if (isTypedTemporalPeriodSurface(surface) && String(next?.surface_form || '') === '中' && !hasReviewedLexicalBoundaryBefore(next)) {
            const headReading = getTypedTemporalHeadReading(surface, token);
            if (headReading) {
                merged.push(makeTypedTemporalSpanToken(token, surface + '中', headReading + 'じゅう'));
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

function getOneDaySpan(tokens, startIndex) {
    const token = tokens[startIndex];
    if (String(token?.surface_form || '') === '一日') return { length: 1, head: token };
    const next = tokens[startIndex + 1];
    if (String(token?.surface_form || '') === '一' && String(next?.surface_form || '') === '日'
        && (token?.pos_detail_1 === '数' || isJapaneseNumeralSurface(token.surface_form))
        && next?.pos_detail_2 === '助数詞') return { length: 2, head: token };
    return null;
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
        || isSahenPredicateStructureAt(tokens, startIndex)
        || hasFollowingPredicateAfterOneDayNominal(tokens, startIndex);
}

function markTypedOneDayDurationTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getOneDaySpan(tokens, index);
        if (!span) { resolved.push(tokens[index]); continue; }
        const previous = tokens[index - 1] || null;
        if (previous && isCalendarMonthSurface(previous.surface_form)) {
            resolved.push(tokens[index]);
            continue;
        }
        let scan = index + span.length;
        let next = tokens[scan] || null;
        while (next && scan < tokens.length - 1 && isParticle(next) && ['だけ','も','は'].includes(String(next.surface_form || ''))) {
            scan += 1;
            next = tokens[scan] || null;
        }
        const durationContext = isOneDayDurationFollower(tokens, scan);
        if (!durationContext) { resolved.push(tokens[index]); continue; }
        const surface = span.length === 1 ? '一日' : String(tokens[index].surface_form || '') + String(tokens[index + 1].surface_form || '');
        resolved.push({
            ...span.head,
            surface_form: surface,
            reading: 'イチニチ', pronunciation: 'イチニチ',
            pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
            typedTemporalExpressionMatched: true,
            typedTemporalExpressionType: 'duration-day',
            typedTemporalReading: 'いちにち',
            typedTemporalSource: 'typed-duration-context'
        });
        index += span.length - 1;
    }
    return resolved;
}

function makeTypedClockHourToken(token, surface, reading, source) {
    return {
        ...token,
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
        numericExpression: true,
        typedNumericExpressionMatched: true,
        typedNumericExpressionType: 'clock-hour',
        typedNumericReading: reading,
        typedNumericSource: source
    };
}

function mergeTypedClockHourTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const directSurface = String(token?.surface_form || '');
        const directEvidence = runtimeState.counterDateReadingDictionary.get(directSurface);
        if (/^[0-9０-９〇零一二三四五六七八九十百]+時$/u.test(directSurface)
            && directEvidence?.reading
            && String(tokens[index + 1]?.surface_form || '') !== '間') {
            merged.push(makeTypedClockHourToken(token, directSurface, directEvidence.reading, 'counter-date-reading-evidence'));
            continue;
        }
        if (!isJapaneseNumeralSurface(directSurface)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
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
        const reviewed = runtimeState.counterDateReadingDictionary.get(surface);
        if (!reviewed?.reading) { merged.push(token); continue; }
        merged.push(makeTypedClockHourToken(token, surface, reviewed.reading, 'counter-date-reading-evidence'));
        index = end;
    }
    return merged;
}

function getMinuteCounterFinalDigit(surface) {
    const chars = Array.from(String(surface || ''));
    const map = { '〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':0 };
    const last = chars.at(-1);
    if (/^[0-9]$/u.test(last || '')) return Number(last);
    return Object.prototype.hasOwnProperty.call(map, last) ? map[last] : null;
}

function resolveMinuteCounterReading(numeralSurface) {
    const fullSurface = String(numeralSurface || '') + '分';
    const reviewed = runtimeState.counterDateReadingDictionary.get(fullSurface);
    if (reviewed?.reading) return { reading: reviewed.reading, source: 'counter-date-reading-evidence' };
    const numeralReading = normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
    const finalDigit = getMinuteCounterFinalDigit(numeralSurface);
    if (!numeralReading || finalDigit == null) return null;
    if (finalDigit === 1 && numeralReading.endsWith('いち')) return { reading: numeralReading.slice(0, -2) + 'いっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 6 && numeralReading.endsWith('ろく')) return { reading: numeralReading.slice(0, -2) + 'ろっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 8 && numeralReading.endsWith('はち')) return { reading: numeralReading.slice(0, -2) + 'はっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 0 && numeralReading.endsWith('じゅう')) return { reading: numeralReading.slice(0, -3) + 'じゅっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 3 || finalDigit === 4) return { reading: numeralReading + 'ぷん', source: 'minute-counter-morphology' };
    return { reading: numeralReading + 'ふん', source: 'minute-counter-morphology' };
}

function mergeTypedMinuteCounterTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!isJapaneseNumeralSurface(token?.surface_form)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
            numeralSurface += String(tokens[end].surface_form || '');
            end += 1;
        }
        const unit = tokens[end] || null;
        if (String(unit?.surface_form || '') !== '分' || hasReviewedLexicalBoundaryBefore(unit)) {
            merged.push(token);
            continue;
        }
        const resolvedMinute = resolveMinuteCounterReading(numeralSurface);
        if (!resolvedMinute) { merged.push(token); continue; }
        const surface = numeralSurface + '分';
        merged.push({
            ...token,
            surface_form: surface,
            reading: resolvedMinute.reading,
            pronunciation: resolvedMinute.reading,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'minute-counter',
            typedNumericReading: resolvedMinute.reading,
            typedNumericSource: resolvedMinute.source
        });
        index = end;
    }
    return merged;
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

function getOrdinaryCompoundReadingEvidence(token) {
    if (!token || !isProperNounToken(token) || !containsHan(token.surface_form)) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    const selected = selectGeneralWordReading(lookup);
    if (!selected?.reading) return null;
    const normalizedSelected = normalizeKanaReading(selected.reading);
    const exactOrdinaryMatch = getKuromojiExactDictionaryCandidates(token.surface_form).some(candidate =>
        candidate.pos === '名詞'
        && candidate.pos_detail_1 === '接尾'
        && candidate.pos_detail_2 === '助数詞'
        && normalizeKanaReading(candidate.reading) === normalizedSelected
    );
    if (!exactOrdinaryMatch) return null;
    return { reading: selected.reading, candidates: getGeneralWordCandidates(lookup) };
}

function annotateOrdinaryCompoundReadingContext(tokens) {
    return (tokens || []).map((token, index) => {
        const evidence = getOrdinaryCompoundReadingEvidence(token);
        if (!evidence) return token;
        const previous = tokens[index - 1] || null;
        const next = tokens[index + 1] || null;
        const ordinaryNounPrefix = Boolean(
            previous
            && previous.pos === '接頭詞'
            && previous.pos_detail_1 === '名詞接続'
            && !isProperNounToken(previous)
        );
        const ordinaryNounSuffix = Boolean(
            next
            && next.pos === '名詞'
            && next.pos_detail_1 === '接尾'
            && next.pos_detail_2 !== '人名'
            && !isProperNounToken(next)
        );
        if (!ordinaryNounPrefix && !ordinaryNounSuffix) return token;
        return {
            ...token,
            ordinaryCompoundReadingMatched: true,
            ordinaryCompoundReading: evidence.reading,
            ordinaryCompoundReadingCandidates: evidence.candidates
        };
    });
}

function annotateMorphologicalOutputBoundaries(tokens) {
    return (tokens || []).map((token, index) => {
        if (index === 0) return token;
        const previous = tokens[index - 1];
        const surface = String(token?.surface_form || '');
        const previousConjugation = String(previous?.conjugated_form || '');
        const separateAuxiliary = token?.pos === '動詞' && token?.pos_detail_1 === '非自立' && startsSeparateAuxiliaryUnit(token);
        const compoundVerb = token?.pos === '動詞' && previous?.pos === '動詞' && previousConjugation.startsWith('連用') && !separateAuxiliary;
        const attachedConjunctive = token?.pos === '助詞' && token?.pos_detail_1 === '接続助詞'
            && morphologicalJoinParticleSurfaces.has(surface)
            && Boolean(previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞'));
        return compoundVerb || attachedConjunctive ? { ...token, morphologicalJoinLeft: true } : token;
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
    return {
        ...token,
        surface_form: fragment,
        basic_form: fragment,
        reading: fragment,
        pronunciation: fragment,
        word_position: position > 0 ? position + characterOffset : position,
        kanaCommonWordBoundaryFragment: true
    };
}

function tokenizeKanaCommonWordBoundaryRemainder(token, surface, characterOffset, evidenceSurface) {
    const remainder = String(surface || '');
    if (!remainder) return [];
    const originalPosition = Number(token?.word_position || 0);
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    const reconstructed = retokenized.map(item => String(item?.surface_form || '')).join('');
    const tokens = retokenized.length && reconstructed === remainder
        ? retokenized
        : [makeKanaCommonWordBoundaryFragment(token, remainder, characterOffset)];
    let consumed = 0;
    return tokens.map((item, index) => {
        const surfaceForm = String(item?.surface_form || '');
        const adjusted = {
            ...item,
            word_position: originalPosition > 0 ? originalPosition + characterOffset + consumed : Number(item?.word_position || 0),
            kanaCommonWordBoundaryFragment: true
        };
        if (index === 0) {
            adjusted.reviewedLexicalBoundaryBefore = true;
            adjusted.reviewedLexicalBoundaryEvidenceSurface = evidenceSurface;
        }
        consumed += Array.from(surfaceForm).length;
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
        merged.push({
            ...token,
            surface_form: surface,
            basic_form: surface,
            reading,
            pronunciation: reading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            kanaCommonWordBoundaryHonorific: true
        });
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
            bestMatch = { surface: candidateSurface, reading: normalizedReading, evidence, length: end - startIndex + 1 };
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
        return {
            ...token,
            pos: '記号',
            pos_detail_1: whitespace ? '空白' : '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            reading: surface,
            pronunciation: surface,
            canonicalBoundary: true,
            crossNotationSymbol: surface === '×'
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
        crossNotationSymbol: surface === '×'
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
    return classifyCanonicalBoundaryTokens(rebuilt);
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
    return bestLength > 0 ? { start: 0, end: bestLength, surface: characters.slice(0, bestLength).join('') } : null;
}

function lexicalKanaEvidenceCoversToken(runTokens, tokenIndex, lexicalSpan) {
    if (!lexicalSpan || tokenIndex < 0 || tokenIndex >= runTokens.length) return false;
    let start = 0;
    for (let index = 0; index < tokenIndex; index += 1) start += Array.from(String(runTokens[index].surface_form || '')).length;
    const end = start + Array.from(String(runTokens[tokenIndex].surface_form || '')).length;
    return lexicalSpan.start <= start && lexicalSpan.end > start && lexicalSpan.end >= end;
}

function isStrongKanaGrammarToken(tokens, absoluteIndex, runStart, runEnd, lexicalSpan) {
    const token = tokens[absoluteIndex];
    if (!token || (!isParticle(token) && !isNominalizer(token))) return false;

    const runTokens = tokens.slice(runStart, runEnd + 1);
    const runIndex = absoluteIndex - runStart;
    if (lexicalKanaEvidenceCoversToken(runTokens, runIndex, lexicalSpan)) return false;

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
    const last = members[members.length - 1];
    return {
        ...lexical,
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        word_position: first.word_position,
        sourceStart: first.sourceStart,
        sourceEnd: last.sourceEnd,
        sourceSurface: surface,
        sourceSpanReconciled: true,
        sourceSpanReconciliationReason: 'kuromoji-kana-boundary-neutralised',
        sourceSpanGrammarBoundary: false,
        sourceSpanGrammarBoundaryBefore: Boolean(first.sourceSpanGrammarBoundaryBefore),
        tokenizationRoleBoundaryBefore: Boolean(first.tokenizationRoleBoundaryBefore),
        reviewedLexicalBoundaryBefore: Boolean(first.reviewedLexicalBoundaryBefore)
    };
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

function reconcileKanaSourceTokenBoundaries(tokens, sourceText) {
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
            if (!isStrongKanaGrammarToken(working, index, runStart, runEnd, lexicalSpan)) continue;
            working[index].sourceSpanGrammarBoundary = true;
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
        merged.push({
            ...tokens[index],
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            kanaLexicalSpanMatched: true,
            kanaLexicalSpanReading: bestMatch.reading,
            kanaLexicalSpanEvidenceSurfaces: [...bestMatch.evidence.surfaces]
        });
        index += bestMatch.length - 1;
    }
    return merged;
}

function mergeKanaBoundaryPair(left, right) {
    const surface = String(left?.surface_form || '') + String(right?.surface_form || '');
    return {
        ...left,
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        pos: '名詞',
        pos_detail_1: '一般',
        pos_detail_2: '*',
        pos_detail_3: '*',
        orthographicKanaBoundaryRepaired: true
    };
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
    return Boolean(surface) && /^[\p{Script=Latin}\p{Number}'’/@&#% +_.:;!?=~|-]+$/u.test(surface);
}

function containsLatinOrNumber(value) {
    return /[\p{Script=Latin}\p{Number}]/u.test(String(value || ''));
}

function mergeLatinPassthroughTokens(tokens) {
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
            span += nextSurface;
            if (containsLatinOrNumber(nextSurface)) hasContent = true;
            end += 1;
        }
        if (!hasContent) { merged.push(token); continue; }
        merged.push({
            ...token,
            surface_form: span,
            latinPassthroughMatched: true,
            latinPassthroughOutput: span,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*'
        });
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
        merged.push({
            ...tokens[index],
            surface_form: surface,
            reading: honorificReading || surface,
            pronunciation: honorificReading || surface,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading || surface
        });
        index = endMatch;
    }
    return merged;
}

function markUnreviewedNameContextTokens(tokens) {
    const marked = (tokens || []).map(token => ({ ...token }));
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
    return marked;
}

function mergeDesiderativeGaruTokens(tokens) {
    const output = [];
    const joinRange = (start, end) => {
        const first = tokens[start];
        const slice = tokens.slice(start, end + 1);
        return {
            ...first,
            surface_form: slice.map(token => String(token?.surface_form || '')).join(''),
            reading: slice.map(token => String(token?.reading || token?.surface_form || '')).join(''),
            pronunciation: slice.map(token => String(token?.pronunciation || token?.reading || token?.surface_form || '')).join(''),
            pos: '動詞',
            pos_detail_1: '自立',
            pos_detail_2: '*',
            desiderativeGaruMatched: true
        };
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
            output.push({ ...joinRange(index, index + 3), desiderativeGaruRecoveredFromSurface: true });
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

function mergeCasualSpeechTokens(tokens) {
    const merged = [];
    const joinToken = (left, right) => ({
        ...left,
        surface_form: String(left.surface_form || '') + String(right.surface_form || ''),
        reading: String(left.reading || left.surface_form || '') + String(right.reading || right.surface_form || ''),
        pronunciation: String(left.pronunciation || left.reading || left.surface_form || '') + String(right.pronunciation || right.reading || right.surface_form || '')
    });
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const previous = merged[merged.length - 1];
        const next = tokens[index + 1];
        const nextNext = tokens[index + 2];
        const verbLikePrevious = previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞' || previous.pos_detail_1 === '動詞' || previous.pos_detail_1 === '形容詞');
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

function findLongestGrammaticalExpression(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += token.surface_form;
        if (!runtimeState.grammaticalExpressionPrefixes.has(candidateSurface)) break;
        const value = runtimeState.grammaticalExpressionDictionary.get(candidateSurface);
        if (value) bestMatch = { surface: candidateSurface, value, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeRecognizedGrammaticalExpressions(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestGrammaticalExpression(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.surface, pronunciation: bestMatch.surface, pos: '助詞', pos_detail_1: '接続助詞', pos_detail_2: '*', fullGrammaticalExpression: true, value: bestMatch.value });
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
        merged.push({
            ...tokens[index],
            surface_form: bestMatch.surface,
            contextualOverrideMatched: true,
            contextualRomaji: bestMatch.romaji,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        });
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
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, knownPhraseMatched: true, knownPhraseValue: bestMatch.value, knownPhraseSource: bestMatch.source });
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

function findLongestAuthoritativeSpan(tokens, startIndex) {
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
        const changedForLookup = Boolean(lookup?.variant?.changed);
        const spansMultipleTokens = end > startIndex;
        const category = lookup?.evidence?.category || '';
        const categoryAllowsDirectAuthority = ['counter-date', 'ateji', 'loanword', 'reviewed-reading'].includes(category);
        const candidateTokens = tokens.slice(startIndex, end + 1);
        const generalWordRescue = category === 'general-word'
            && tokensNeedAuthoritativeRescue(candidateTokens, candidateSurface);
        const unconditionalSpanAuthority = category !== 'general-word' && spansMultipleTokens;
        const variantNormalizedAuthority = changedForLookup && category !== 'general-word';
        // General-word evidence is rescue-only; reviewed non-general evidence may also authorise spans or variant-normalised single tokens.
        if (lookup && (categoryAllowsDirectAuthority || generalWordRescue || unconditionalSpanAuthority || variantNormalizedAuthority)) {
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

function mergeAuthoritativeSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestAuthoritativeSpan(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const evidence = bestMatch.evidence;
        const reviewedName = evidence.category === 'reviewed-name';
        const numericExpression = evidence.category === 'counter-date'
            && /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u.test(bestMatch.surface);
        merged.push({
            ...tokens[index],
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
            authoritativeSpanVariantMappings: bestMatch.variant?.mappings || [],
            numericExpression
        });
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

function normalizeRule0OutputPunctuation(text, sourceText = text) {
    const compatible = normalizeJapanesePunctuationCompatibility(text);
    const marked = markJapaneseHorizontalBars(markJapaneseWaveDelimiters(markJapaneseDoubleQuotes(markJapaneseSingleQuotes(compatible))));
    let spaced = normalizeSentenceSpacing(collapseRepeatedSpaces(normalizePunctuation(marked)));
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

function needsSourceSpellingReview(token) {
    const surface = String(token?.surface_form || '');
    if (!/^[ァ-ヶー]+$/u.test(surface) || isParticle(token) || isGrammaticalToken(token)) return false;
    if (isProperNounToken(token)) return true;
    return token?.pos === '名詞' && surface.includes('ー');
}

const REVIEW_SIGNAL_POLICY = Object.freeze({
    'exact-dictionary-rescue': { category: 'evidence', requiresReview: false, rationale: 'Reviewed dictionary rescue.' },
    'fallback-reading': { category: 'evidence', requiresReview: false, rationale: 'Lower-confidence but permitted fallback evidence.' },
    'historical-kana-attested': { category: 'historical-orthography', requiresReview: false, rationale: 'Attested historical-kana evidence.' },
    'source-span-kana-evidence': { category: 'tokenisation', requiresReview: false, rationale: 'Kana lexical evidence was selected independently of Kuromoji boundaries.' },
    'orthographic-pronunciation': { category: 'orthography', requiresReview: false, rationale: 'Safe orthographic pronunciation evidence.' },
    'rendaku-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested Rendaku evidence.' },
    'rendaku-blocked-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested non-Rendaku evidence.' },
    'variant-reading-evidence': { category: 'orthography', requiresReview: false, rationale: 'Reviewed character-variant evidence.' },
    'reviewed-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A reviewed preferred reading was selected while legitimate alternatives remain.' },
    'reviewed-numeric-alias': { category: 'orthography', requiresReview: false, rationale: 'A reviewed numeric orthographic alias was resolved through canonical numeric context.' },
    'proper-noun-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible proper-name readings remain.' },
    'general-word-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible general-word readings remain.' },
    'general-word-alternative': { category: 'ambiguity', requiresReview: true, rationale: 'Alternative general-word readings are materially plausible.' },
    'general-word-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'General-word evidence conflicts with the selected reading.' },
    'whole-word-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Whole-word evidence does not resolve one reading.' },
    'contextual-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Structured sentence context does not distinguish the supported readings strongly enough.' },
    'sentence-context-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'The final sentence-level verification pass still cannot distinguish the supported readings safely.' },
    'reading-evidence-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'Independent reading evidence conflicts with the selected reading.' },
    'missing-source-spelling-evidence': { category: 'source-spelling', requiresReview: true, rationale: 'Source-language spelling is required but not established.' },
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
    'unreviewed-cross-notation': { category: 'mixed-script', requiresReview: true, rationale: 'The × notation is preserved because no reviewed title/context evidence establishes whether it is silent, spoken, or rendered as a separator.' }
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
    return {
        surface: String(surface || ''),
        flag: String(flag || ''),
        source: String(source || 'unresolved'),
        confidence: Number(confidence ?? 0),
        category: policy.category,
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

function getResolutionReviewSignals(resolution, surface) {
    const source = resolution?.source || 'unresolved';
    const confidence = Number(resolution?.confidence ?? 0);
    const flags = [...new Set(Array.isArray(resolution?.flags) ? resolution.flags : [])];
    const existing = Array.isArray(resolution?.reviewSignals) ? resolution.reviewSignals.map(signal => ({ ...signal, lifecycle: [...(signal.lifecycle || [])] })) : [];
    const represented = new Set(existing.map(signal => signal.flag));
    for (const signal of makeReviewSignals(surface, source, confidence, flags.filter(flag => !represented.has(flag)))) existing.push(signal);
    return existing;
}

function isReviewContextBoundaryToken(token) {
    const surface = String(token?.surface_form || '');
    if (!surface) return false;
    for (let index = 0; index < surface.length; index += 1) {
        if (isCanonicalHardBoundaryAt(surface, index)) return true;
    }
    return false;
}

function hasIndependentSentenceContext(tokenResults, tokenIndex) {
    const tokens = tokenResults || [];
    for (const direction of [-1, 1]) {
        for (let index = tokenIndex + direction; index >= 0 && index < tokens.length; index += direction) {
            const token = tokens[index];
            if (!token) continue;
            if (isReviewContextBoundaryToken(token)) break;
            const surface = String(token.surface_form || '');
            if (!surface || (token.pos === '記号' && !/[\p{L}\p{N}]/u.test(surface))) continue;
            return true;
        }
    }
    return false;
}

function isContextSelectedLexicalResolution(resolution) {
    const source = String(resolution?.source || '');
    return source === 'kuromoji-context'
        || source === 'kuromoji+general-word'
        || source.startsWith('sentence-context-verification+kuromoji-context')
        || source.startsWith('sentence-context-verification+kuromoji+general-word');
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

function shouldSupersedeWeakLexicalSignal(signal, resolution, tokenResults, tokenIndex, tokenSignals) {
    if (!WEAK_LEXICAL_REVIEW_FLAGS.has(signal?.flag)) return false;
    if (!resolution?.reading || resolution?.ambiguous || Number(resolution?.confidence || 0) < 0.75) return false;
    if (!isContextSelectedLexicalResolution(resolution) || !hasIndependentSentenceContext(tokenResults, tokenIndex)) return false;
    if (hasUnresolvedNominalCompoundAdjacency(tokenResults, tokenIndex)) return false;
    const strongerActiveSignal = (tokenSignals || []).some(other =>
        other !== signal
        && Boolean(other?.policyRequiresReview ?? getReviewSignalPolicy(other?.flag).requiresReview)
        && !WEAK_LEXICAL_REVIEW_FLAGS.has(other?.flag)
    );
    return !strongerActiveSignal;
}

function finalizeTokenReviewSignals(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const resolution = token?.readingResolution;
    const surface = String(token?.surface_form || resolution?.surface || '');
    const tokenSignals = getResolutionReviewSignals(resolution, surface);
    return tokenSignals.map(original => {
        const policyRequiresReview = Boolean(original?.policyRequiresReview ?? getReviewSignalPolicy(original?.flag).requiresReview);
        if (!policyRequiresReview) return transitionReviewSignal(original, 'resolved');
        if (original?.state === 'superseded') return transitionReviewSignal(original, 'superseded');
        if (original?.state === 'resolved') return transitionReviewSignal(original, 'resolved');
        const active = transitionReviewSignal(original, 'active');
        if (shouldSupersedeWeakLexicalSignal(active, resolution, tokenResults, tokenIndex, tokenSignals)) {
            return transitionReviewSignal(active, 'superseded', {
                resolutionReason: 'Context-selected lexical reading supersedes raw alternative-list uncertainty.',
                supersededBy: String(resolution?.source || 'context-selected-reading')
            });
        }
        return transitionReviewSignal(active, 'final-active');
    });
}

function makeFinalReviewSignal(surface, flag, source, confidence = 1) {
    const signal = makeReviewSignal(surface, flag, source, confidence);
    return signal.policyRequiresReview ? transitionReviewSignal(transitionReviewSignal(signal, 'active'), 'final-active') : signal;
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

/** @param {CJ2RToken} token */
function resolveTokenReading(token, sourceText) {
    if (!token) return makeReadingResolution(token);
    if (token.contextualOverrideMatched && token.contextualRomaji) return makeReadingResolution(token, { romaji: token.contextualRomaji, source: 'contextual-override', confidence: 1 });
    if (token.titleReadingEvidenceMatched && token.titleReadingEvidenceRomaji != null) return makeReadingResolution(token, {
        reading: token.titleReadingEvidenceReading || null, romaji: token.titleReadingEvidenceRomaji,
        source: `title-reading-evidence:${token.titleReadingEvidenceKind || 'reviewed'}`, confidence: 1
    });
    if (token.reviewedProperNameSpanMatched && token.reviewedProperNameSpanRomaji) return makeReadingResolution(token, { reading: token.reading, romaji: token.reviewedProperNameSpanRomaji, source: 'reviewed-proper-name-span', confidence: 1 });
    if (token.reviewedNameHonorificMatched && token.reviewedNameHonorificReading) return makeReadingResolution(token, { reading: token.reviewedNameHonorificReading, source: 'reviewed-name-honorific', confidence: 1 });
    if (token.typedTemporalExpressionMatched && token.typedTemporalReading) return makeReadingResolution(token, { reading: token.typedTemporalReading, source: token.typedTemporalSource || 'typed-temporal-expression', confidence: 0.99 });
    if (token.typedNumericExpressionMatched && token.typedNumericReading) return makeReadingResolution(token, { reading: token.typedNumericReading, source: token.typedNumericSource || 'typed-numeric-expression', confidence: 0.99 });
    if (token.authoritativeSpanMatched) return makeReadingResolution(token, {
        reading: token.authoritativeSpanReading || token.reading,
        romaji: token.authoritativeSpanRomaji || null,
        source: token.authoritativeSpanSource || 'authoritative-span-evidence',
        confidence: token.authoritativeSpanConfidence || 0.98,
        flags: [
            ...((token.authoritativeSpanVariantMappings || []).length ? ['variant-reading-evidence'] : []),
            ...(token.authoritativeSpanReviewRequired ? ['reviewed-reading-ambiguous'] : [])
        ],
        variantMappings: token.authoritativeSpanVariantMappings || []
    });
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
    const particleReading = getParticleReading(token);
    if (particleReading) return makeReadingResolution(token, { reading: particleReading, source: 'particle-pronunciation', confidence: 1 });
    if (token.loanwordMatched && token.loanwordOutput) return makeReadingResolution(token, { romaji: token.loanwordOutput, source: 'loanword-lexicon', confidence: 1 });
    const loanwordOutput = getLoanwordOutputForToken(token);
    if (loanwordOutput) return makeReadingResolution(token, { romaji: loanwordOutput, source: 'loanword-lexicon', confidence: 1 });
    const explicitCommonWordContext = selectCommonWordRule(token.surface_form, sourceText, false);
    if (explicitCommonWordContext?.reading) return makeReadingResolution(token, { reading: explicitCommonWordContext.reading, romaji: explicitCommonWordContext.romaji || null, source: explicitCommonWordContext.romaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.contextualReadingEvidenceMatched && token.contextualReadingEvidenceReading) return makeReadingResolution(token, { reading: token.contextualReadingEvidenceReading, romaji: token.contextualReadingEvidenceRomaji || null, source: 'contextual-reading-evidence', confidence: 0.96, candidates: token.contextualReadingEvidenceCandidates || [] });
    if (token.commonWordMatched && token.commonWordReading) return makeReadingResolution(token, { reading: token.commonWordReading, romaji: token.commonWordRomaji || null, source: token.commonWordRomaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.historicalKanaEvidenceMatched && token.historicalKanaEvidenceReading) return makeReadingResolution(token, { reading: token.historicalKanaEvidenceReading, source: 'historical-kana-evidence', confidence: 0.99, flags: ['historical-kana-attested'] });
    if (token.rendakuEvidenceMatched && token.rendakuEvidenceReading) return makeReadingResolution(token, { reading: token.rendakuEvidenceReading, source: 'rendaku-evidence', confidence: 0.99, flags: [token.rendakuApplied ? 'rendaku-attested' : 'rendaku-blocked-attested'] });
    if (token.exactDictionaryRescueMatched && token.exactDictionaryRescueSource === 'kuromoji-exact-proper-name') return makeReadingResolution(token, { reading: token.pronunciation, source: token.exactDictionaryRescueSource, confidence: token.exactDictionaryRescueConfidence || 0.93, flags: ['exact-dictionary-rescue'] });
    if (token.kanaLexicalSpanMatched && token.kanaLexicalSpanReading) return makeReadingResolution(token, { reading: token.kanaLexicalSpanReading, source: 'kana-whole-word-evidence', confidence: 0.98, flags: ['source-span-kana-evidence'] });
    const kanaOnly = isMechanicallyRomanisableKanaSurface(token.surface_form);
    if (kanaOnly) {
        const sourceSpellingFlags = needsSourceSpellingReview(token) ? ['missing-source-spelling-evidence'] : [];
        const orthographicPronunciation = getKanaOrthographicPronunciation(token);
        if (orthographicPronunciation) return makeReadingResolution(token, { reading: orthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: sourceSpellingFlags.length ? 0.65 : 1, flags: ['orthographic-pronunciation', ...sourceSpellingFlags] });
        return makeReadingResolution(token, { reading: token.surface_form, source: 'written-kana', confidence: sourceSpellingFlags.length ? 0.65 : 1, flags: sourceSpellingFlags });
    }
    const mixedOrthographicPronunciation = getMixedScriptOrthographicPronunciation(token);
    if (mixedOrthographicPronunciation) return makeReadingResolution(token, { reading: mixedOrthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: 0.99, flags: ['orthographic-pronunciation'] });
    const commonWordRule = getCommonWordRuleForToken(token, sourceText);
    if (commonWordRule?.reading) return makeReadingResolution(token, { reading: commonWordRule.reading, romaji: commonWordRule.romaji || null, source: commonWordRule.romaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.atejiMatched && token.atejiReading) return makeReadingResolution(token, { reading: token.atejiReading, source: 'ateji-lexicon', confidence: 0.99 });
    if (token.generalWordMatched && token.generalWordReading) return makeReadingResolution(token, {
        reading: token.generalWordReading,
        source: 'general-word-span-fallback',
        confidence: token.generalWordAmbiguous ? 0.78 : 0.86,
        candidates: token.generalWordCandidates || [],
        flags: ['fallback-reading', ...(token.generalWordAmbiguous ? ['general-word-ambiguous'] : []), ...((token.generalWordVariantMappings || []).length ? ['variant-reading-evidence'] : [])],
        variantMappings: token.generalWordVariantMappings || []
    });
    if (token.ordinaryCompoundReadingMatched && token.ordinaryCompoundReading) return makeReadingResolution(token, {
        reading: token.ordinaryCompoundReading,
        source: 'ordinary-compound-context',
        confidence: 0.98,
        candidates: token.ordinaryCompoundReadingCandidates || []
    });
    const reviewedPreference = getReviewedReadingPreference(token);
    const reviewedCandidates = reviewedPreference ? getReviewedReadingCandidates(token) : [];
    const properNounResolution = resolveProperNounReading(token);
    if (properNounResolution?.reading) return makeReadingResolution(token, properNounResolution);
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
        const nameContextCandidates = token.nameContextAmbiguous ? getProperNounCandidateLookup(token.surface_form).candidates : [];
        const flags = [];
        if (token.nameContextAmbiguous) flags.push('name-context-ambiguous');
        if (token.contextualReadingEvidenceAmbiguous) flags.push('contextual-reading-ambiguous');
        if (needsSourceSpellingReview(token)) flags.push('missing-source-spelling-evidence');
        let confidence = properNounResolution?.ambiguous ? 0.78 : 0.92;
        if (token.contextualReadingEvidenceAmbiguous) confidence = Math.min(confidence, 0.72);
        let source = 'kuromoji-context';
        if (evidenceAssessment) { flags.push('reading-evidence-conflict'); confidence = Math.min(confidence, 0.68); }
        if (properNounResolution?.ambiguous) flags.push('proper-noun-ambiguous');
        if (generalAssessment?.matched) {
            source = 'kuromoji+general-word';
            confidence = generalAssessment.matchedIndex === 0 ? 0.97 : 0.90;
            if (generalAssessment.candidates.length > 1) flags.push('general-word-alternative');
        } else if (generalAssessment?.strongPreference) {
            flags.push('general-word-conflict');
            confidence = Math.min(confidence, 0.68);
        }
        if (kuromojiAmbiguity) {
            flags.push('whole-word-reading-ambiguous');
            confidence = Math.min(confidence, 0.78);
        }
        const candidates = token.contextualReadingEvidenceCandidates?.length ? token.contextualReadingEvidenceCandidates
            : properNounResolution?.candidates?.length ? properNounResolution.candidates
            : nameContextCandidates.length ? nameContextCandidates
            : kuromojiAmbiguity?.candidates?.length ? kuromojiAmbiguity.candidates
            : generalAssessment?.candidates?.length ? generalAssessment.candidates : getReadingEvidenceCandidates(token);
        return makeReadingResolution(token, { reading: kuromojiReading, source, confidence, candidates, flags, variantMappings: generalAssessment?.variantMappings || [] });
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
        const properSurface = String(token.surface_form || '');
        const supportedSingleHan = isHanCharacter(properSurface) ? classifyHanCharacterScope(properSurface) : null;
        if (supportedSingleHan?.scope === 'japanese-scope') {
            const topCandidate = rankProperNounCandidates(properNounResolution.candidates || []).ranked[0] || null;
            if (topCandidate?.reading || topCandidate?.romaji) {
                return makeReadingResolution(token, {
                    ...properNounResolution,
                    reading: topCandidate.reading || null,
                    romaji: topCandidate.romaji || null,
                    source: `${properNounResolution.source || 'proper-noun-ambiguous'}-candidate-fallback`,
                    confidence: Math.max(0.30, Number(properNounResolution.confidence || 0.30)),
                    flags: [...new Set([...(properNounResolution.flags || []).filter(flag => flag !== 'unresolved-reading'), 'proper-noun-ambiguous', 'fallback-reading'])],
                    ambiguous: true,
                    hanScope: 'japanese-scope',
                    scopeEvidence: [supportedSingleHan]
                });
            }
        }
        return makeReadingResolution(token, properNounResolution);
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
    const flags = (provisional?.flags || []).filter(flag => flag !== 'contextual-reading-ambiguous' && flag !== 'sentence-context-ambiguous');
    const supersededFlags = new Set(['contextual-reading-ambiguous', 'sentence-context-ambiguous']);
    const reviewSignals = getResolutionReviewSignals(provisional, String(token?.surface_form || provisional?.surface || '')).map(signal => {
        if (!supersededFlags.has(signal?.flag)) return signal;
        return transitionReviewSignal(signal, 'superseded', {
            resolutionReason: 'Sentence-level contextual evidence selected one supported reading.',
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
        const provisional = provisionalResolutions[index] || makeReadingResolution(token);
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
        const unsupportedMark = unresolvedRun && /\p{M}/u.test(character);
        if (unsupportedLetter || unsupportedMark) {
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
    if (hasOtherNonLatinLetter) flags.push('nonlatin-output-blocked');
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
    if (isParticle(token) || token.fullGrammaticalExpression || isSuffix(token) || isNominalizer(token) || isGrammaticalToken(token)) return result.toLowerCase();
    return result;
}

const spacedSuffixSurfaces = new Set(['さん','さま','様','くん','君','ちゃん','氏']);
function shouldSpaceSuffix(token) { return spacedSuffixSurfaces.has(token?.surface_form); }
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

function classifyTokenStructuralBoundary(previousToken, token) {
    if (!previousToken) return 'none';
    if (token.titleSeparator) return 'space';
    if (previousToken.crossNotationSymbol && !previousToken.titleSeparator) return 'tight';
    if (shouldJoinReviewedTitleCompactNumericSuffix(previousToken, token)) return 'join';
    if (token.readingResolution?.source === 'latin-source-passthrough') return 'space';
    if (token.nameContinuation) return token.nameGivenStart ? 'space' : 'join';
    if (previousToken.pos === '形容詞' && token.surface_form === 'な') return 'space';
    if (shouldSeparateClockTimeComponents(previousToken, token)) return 'space';
    if (shouldSeparateNumericTokens(previousToken, token)) return 'space';
    if (shouldJoinNumericTokens(previousToken, token)) return 'join';
    if (token.joinLeftAfterSokuon || token.morphologicalJoinLeft) return 'join';
    if (token.fullGrammaticalExpression) return needsSpaceBeforeGrammaticalExpression(previousToken) ? 'space' : 'join';
    if (token.particle || token.nominalizer || token.prefix) return 'space';
    if (token.suffix) return shouldSpaceSuffix(token) ? 'space' : 'join';
    if (previousToken.prefix) return 'join';
    if (token.grammatical) return token.startsSeparateAuxiliaryUnit ? 'space' : 'join';
    return 'space';
}

/** @param {CJ2RToken|null|undefined} previousToken @param {CJ2RToken} token */
function classifyTokenOutputBoundary(previousToken, token) {
    const structuralBoundary = classifyTokenStructuralBoundary(previousToken, token);
    if (structuralBoundary === 'join' && needsCrossTokenApostrophe(previousToken, token)) return 'apostrophe';
    return structuralBoundary;
}

function formatOutputTokenValue(previousToken, token, boundary) {
    if (token.titleSeparator) return token.value;
    if (token.readingResolution?.source === 'latin-source-passthrough') return token.value;
    if (token.nameContinuation) return token.nameGivenStart ? capitalizeRomaji(token.value) : token.value.toLowerCase();
    if (previousToken?.pos === '形容詞' && token.surface_form === 'な') return token.value;
    if (shouldSeparateNumericTokens(previousToken, token)) return capitalizeRomaji(token.value);
    if (boundary === 'apostrophe' || boundary === 'join') return token.value.toLowerCase();
    if (token.fullGrammaticalExpression || token.particle || token.nominalizer) return token.value.toLowerCase();
    if (token.prefix) return capitalizeRomaji(token.value);
    if (token.suffix || previousToken?.prefix) return token.value.toLowerCase();
    if (token.grammatical) return runtimeState.capitalizedAuxiliarySurfaces.has(token.surface_form)
        ? capitalizeRomaji(token.value)
        : token.value.toLowerCase();
    return capitalizeRomaji(token.value);
}

function appendTokenOutput(joined, previousToken, token) {
    const boundary = classifyTokenOutputBoundary(previousToken, token);
    const value = formatOutputTokenValue(previousToken, token, boundary);
    if (!joined || boundary === 'none') return value;
    if (boundary === 'space') return `${joined} ${value}`;
    if (boundary === 'apostrophe') return `${joined}'${value}`;
    if (boundary === 'tight') return joined + value;
    return joined + value;
}

function hasTerminalSokuonReviewCondition(value) {
    const chars = Array.from(normalizeKanaReading(String(value || '')));
    return chars.some((char, index) => char === 'っ' && (index === chars.length - 1 || /^[\s\p{P}\p{S}]$/u.test(chars[index + 1])));
}

function hasRepeatedSokuonReviewCondition(value) {
    return /っ{2,}/u.test(normalizeKanaReading(String(value || '')));
}

function hasNonGeminativeSokuonReviewCondition(value) {
    const normalized = normalizeKanaReading(String(value || ''));
    for (let index = 0; index < normalized.length; index += 1) {
        if (normalized[index] !== 'っ') continue;
        const next = normalized[index + 1] || '';
        if (!next || /^[\s\p{P}\p{S}]$/u.test(next) || next === 'っ') continue;
        if (!/^[ぁ-ゖー]$/u.test(next)) continue;
        const pair = normalized.slice(index + 1, index + 3);
        const reading = contractedKanaMap[pair] || kanaToRomajiMap[next] || '';
        if (!isSokuonGeminateableReading(reading)) return true;
    }
    return false;
}

function hasHistoricalFullSizeSokuonAmbiguity(value, tokenResults = []) {
    const source = String(value || '');
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
        if (!covered) return true;
    }
    return false;
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
        boundaries.push({ left, right, surface: `${left.surface_form}${right.surface_form}` });
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
        spans.push({ left, right, surface: `${left.surface_form}${right.surface_form}` });
    }
    return spans;
}

function buildTranslationDiagnostics(sourceText, normalizedSourceText, output, tokenResults, options = {}) {
    const readings = tokenResults.map((token, index) => {
        const resolution = token.readingResolution;
        const unresolvedOrthographicSymbol = resolution?.source === 'japanese-orthography-unresolved';
        if (token.pos === '記号' && !/[\p{L}\p{N}]/u.test(String(token.surface_form || '')) && !unresolvedOrthographicSymbol) return null;
        if (!resolution) return null;
        const reviewSignals = finalizeTokenReviewSignals(tokenResults, index);
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
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            variantMappings: [...(resolution.variantMappings || [])],
            hanScope: resolution.hanScope || null,
            scopeEvidence: [...(resolution.scopeEvidence || [])]
        };
    }).filter(Boolean);
    const redFlags = readings.flatMap(item => item.reviewSignals || []);
    const addSignal = (surface, flag, source, confidence = 1) => redFlags.push(makeFinalReviewSignal(surface, flag, source, confidence));
    for (const token of tokenResults) {
        const collision = token?.typedTemporalSpanLexicalCollision;
        if (!collision) continue;
        addSignal(`${collision.headSurface}${collision.lexicalSurface}`, 'tokenisation-boundary-ambiguous', 'typed-temporal-boundary', 0.85);
    }
    for (const token of tokenResults) {
        if (!token?.crossNotationSymbol || token.titleReadingEvidenceKind) continue;
        addSignal(token.surface_form, 'unreviewed-cross-notation', 'mixed-script-symbol', 0.60);
    }
    for (const flag of options.outputGuardFlags || []) addSignal('[output]', flag, 'final-output-guard');
    for (const boundary of findUnreviewedContiguousKatakanaBoundaries(tokenResults, normalizedSourceText)) {
        addSignal(boundary.surface, 'kana-tokenisation-boundary-unreviewed', 'kuromoji-katakana-boundary', 0.7);
    }
    for (const span of findPartiallyReviewedContiguousKatakanaSpans(tokenResults, normalizedSourceText)) {
        addSignal(span.surface, 'missing-source-spelling-evidence', 'partial-source-language-loanword', 0.7);
    }
    const diagnosticSegments = splitCanonicalHardBoundarySegments(normalizedSourceText);
    if (diagnosticSegments.some(hasTerminalSokuonReviewCondition)) addSignal('っ', 'terminal-sokuon-review', 'sokuon-safety');
    if (diagnosticSegments.some(hasRepeatedSokuonReviewCondition)) addSignal('っっ', 'repeated-sokuon-review', 'sokuon-safety');
    if (diagnosticSegments.some(hasNonGeminativeSokuonReviewCondition)) addSignal('っ', 'non-geminative-sokuon-review', 'sokuon-safety');
    if (options.historicalKana && hasHistoricalFullSizeSokuonAmbiguity(normalizedSourceText, tokenResults)) addSignal('つ', 'historical-full-size-sokuon-ambiguity', 'historical-orthography-safety');
    for (const segment of diagnosticSegments) {
        if (!isJapaneseNumeralSurface(segment)) continue;
        if (!tokenResults.some(token => isProperNounToken(token) && String(token.surface_form || '') === segment)) continue;
        addSignal(segment, 'numeric-literal-lexical-ambiguity', 'numeric-safety');
    }
    const sourceCounts = readings.reduce((counts, item) => { counts[item.source] = (counts[item.source] || 0) + 1; return counts; }, {});
    return attachTranslationAuditStatistics({
        sourceText, normalizedSourceText, output, readings, sourceCounts, redFlags,
        requiresReview: redFlags.some(item => item.state === 'final-active' && item.requiresReview)
    });
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
        ? normalizeTranslatorInputText(sourceText)
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
                    redFlags: flags.map(flag => ({ surface: sourceText, flag, source: 'exact-override', confidence: outputGuardTriggered ? 0.2 : 1 })),
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
        ? normalizeTranslatorInputText(originalSourceText)
        : normalizeObsoleteWRowKanaForModernReading(normalizeTranslatorInputText(originalSourceText));
    return translateTokenizedSourceText(originalSourceText, normalizedSourceText, rawTokens, options, resolveOverridesEnabled(options));
}

function translateTokenizedSourceText(sourceText, text, rawTokens, options = {}, overridesEnabled = resolveOverridesEnabled(options)) {
    const preserveSourceSpans = tokens => attachSourceTokenSpans(tokens, text);
    const wholeSentenceTokens = preserveSourceSpans(restoreDroppedSokuonTokens(rawTokens || [], text));
    const tokenized = preserveSourceSpans(splitStructuredNumericUnitTokens(stabilizeHardBoundaryTokenization(wholeSentenceTokens, text)));
    if (!tokenized.length) {
        const finalOutput = blockUnresolvedHanFromRomaji(text);
        if (runtimeState.captureTranslationDiagnostics) {
            const outputGuardFlags = finalOutput !== text ? getOutputGuardFlags(text) : [];
            const flags = finalOutput !== text ? ['unresolved-reading', 'unsupported-script', ...outputGuardFlags] : ['fallback-reading'];
            publishTranslationDiagnostics({
                sourceText, normalizedSourceText: text, output: finalOutput,
                readings: [{ surface: text, value: finalOutput, source: finalOutput !== text ? 'unresolved-script' : 'surface-fallback', confidence: finalOutput !== text ? 0.2 : 0.55, reading: text, candidates: [], flags }],
                sourceCounts: { [finalOutput !== text ? 'unresolved-script' : 'surface-fallback']: 1 },
                redFlags: flags.map(flag => ({ surface: text, flag, source: finalOutput !== text ? 'unresolved-script' : 'surface-fallback', confidence: finalOutput !== text ? 0.2 : 0.55 })),
                requiresReview: finalOutput !== text
            });
        }
        return finalOutput;
    }
    const sourceReconciledTokens = preserveSourceSpans(reconcileKanaSourceTokenBoundaries(tokenized, text));
    const temporalBoundaryTokens = preserveSourceSpans(repairTypedTemporalExpressionBoundaries(sourceReconciledTokens));
    const temporalSpanTokens = preserveSourceSpans(mergeTypedTemporalSpanTokens(temporalBoundaryTokens));
    const oneDayRoleTokens = preserveSourceSpans(markTypedOneDayDurationTokens(temporalSpanTokens));
    const typedClockHourTokens = preserveSourceSpans(mergeTypedClockHourTokens(oneDayRoleTokens));
    const typedNumericTokens = preserveSourceSpans(mergeTypedMinuteCounterTokens(typedClockHourTokens));
    const roleRepairedTokens = preserveSourceSpans(repairCaseMarkedCounterFollowerTokens(typedNumericTokens));
    const desiderativeTokens = preserveSourceSpans(mergeDesiderativeGaruTokens(roleRepairedTokens));
    const reviewedInflectionTokens = preserveSourceSpans(mergeReviewedCommonWordInflectionTokens(desiderativeTokens));
    const kanaCommonWordBoundaryTokens = preserveSourceSpans(splitReviewedKanaCommonWordBoundaryTokens(reviewedInflectionTokens, text));
    const kanaLexicalTokens = preserveSourceSpans(mergeKanaLexicalReadingTokens(kanaCommonWordBoundaryTokens));
    const kanaHonorificTokens = preserveSourceSpans(mergeKanaCommonWordBoundaryHonorificTokens(kanaLexicalTokens));
    const kanaBoundaryTokens = preserveSourceSpans(mergeOrthographicKanaBoundaryTokens(kanaHonorificTokens));
    const latinProtectedTokens = preserveSourceSpans(mergeLatinPassthroughTokens(kanaBoundaryTokens));
    const historicalTokens = preserveSourceSpans(options.historicalKana ? mergeHistoricalKanaEvidenceTokens(latinProtectedTokens) : latinProtectedTokens);
    const exactDictionaryTokens = preserveSourceSpans(mergeExactDictionaryRescueTokens(historicalTokens, text));
    const reviewedProperNameTokens = preserveSourceSpans(mergeReviewedProperNameSpanTokens(exactDictionaryTokens));
    const reviewedNameSuffixTokens = preserveSourceSpans(mergeReviewedNameHonorificTokens(reviewedProperNameTokens));
    const nameContextTokens = preserveSourceSpans(markUnreviewedNameContextTokens(reviewedNameSuffixTokens));
    const authoritativeTokens = preserveSourceSpans(mergeAuthoritativeSpanTokens(nameContextTokens));
    const iterationTokens = preserveSourceSpans(mergeIterationMarkFallbackTokens(authoritativeTokens));
    const reviewedNumericTokens = preserveSourceSpans(mergeReviewedNumericAliasTokens(iterationTokens));
    const variantProperNounTokens = preserveSourceSpans(mergeVariantProperNounTokens(reviewedNumericTokens));
    const casualTokens = preserveSourceSpans(mergeCasualSpeechTokens(variantProperNounTokens));
    const commonWordTokens = preserveSourceSpans(mergeCommonWordTokens(casualTokens, text));
    const atejiTokens = preserveSourceSpans(mergeAtejiTokens(commonWordTokens));
    const grammaticalTokens = preserveSourceSpans(mergeRecognizedGrammaticalExpressions(atejiTokens));
    const contextResolvedTokens = preserveSourceSpans(mergeContextualOverrideTokens(grammaticalTokens, text, { overridesEnabled }));
    const titleReadingTokens = preserveSourceSpans(mergeTitleReadingEvidenceTokens(contextResolvedTokens, text));
    const pathTokens = preserveSourceSpans(mergeGeneralWordTokens(mergeLoanwordTokens(mergeRendakuEvidenceTokens(mergeKnownPhraseTokens(titleReadingTokens))), text));
    const ordinaryCompoundTokens = preserveSourceSpans(annotateOrdinaryCompoundReadingContext(pathTokens));
    const contextTokens = preserveSourceSpans(annotateContextualReadingEvidence(ordinaryCompoundTokens));
    const outputTokens = preserveSourceSpans(annotateMorphologicalOutputBoundaries(contextTokens));
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
            morphologicalJoinLeft: Boolean(token.morphologicalJoinLeft),
            startsSeparateAuxiliaryUnit: startsSeparateAuxiliaryUnit(token), numericExpression: Boolean(token.numericExpression),
            typedNumericExpressionType: token.typedNumericExpressionType || null,
            typedTemporalSpanLexicalCollision: token.typedTemporalSpanLexicalCollision || null,
            titleSeparator: Boolean(token.titleReadingEvidenceMatched && ['title-separator', 'title-separator-silent'].includes(token.titleReadingEvidenceKind)),
            crossNotationSymbol: Boolean(token.crossNotationSymbol),
            titleReadingEvidenceKind: token.titleReadingEvidenceKind || null,
            sourceStart: Number.isInteger(token.sourceStart) ? token.sourceStart : null,
            sourceEnd: Number.isInteger(token.sourceEnd) ? token.sourceEnd : null,
            sourceSurface: token.sourceSurface || token.surface_form || null,
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            reviewedLexicalBoundaryBefore: Boolean(token.reviewedLexicalBoundaryBefore), tokenizationRoleBoundaryBefore: Boolean(token.tokenizationRoleBoundaryBefore),
            personNameStart, nameContinuation, nameGivenStart
        };
    });

    const result = tokenResults.reduce((joined, token, index) => {
        if (token.pos === '記号' && token.pos_detail_1 === '空白' && /^\s+$/u.test(String(token.surface_form || ''))) return joined;
        const previousToken = tokenResults[index - 1];
        if (token.pos === '記号' && !token.titleSeparator && !containsHan(token.surface_form)) return joined + token.value;
        return appendTokenOutput(joined, previousToken, token);
    }, '');

    const preGuardOutput = normalizeRule0OutputPunctuation(result, sourceText);
    const finalOutput = blockUnresolvedHanFromRomaji(preGuardOutput);
    const outputGuardFlags = finalOutput !== preGuardOutput ? getOutputGuardFlags(preGuardOutput) : [];
    if (runtimeState.captureTranslationDiagnostics) publishTranslationDiagnostics(buildTranslationDiagnostics(sourceText, text, finalOutput, tokenResults, { outputGuardFlags, historicalKana: Boolean(options.historicalKana) }));
    return finalOutput;
}

// Source section: Runtime diagnostics, initialisation, UI events, binding and the public RomajiTranslator API.
function getRuntimeDiagnosticsInternals() {
    return Object.freeze({
        addSurfacePrefixes,
        attachSourceTokenSpans,
        blockUnresolvedHanFromRomaji,
        buildTranslationDiagnostics,
        capitalizeRomaji,
        canonicalizeTokenizerBoundaryCharacters,
        classifyCanonicalBoundaryTokens,
        classifyHanCharacterScope,
        classifyTokenOutputBoundary,
        compileReviewedPattern,
        containsHan,
        convertToRomaji,
        convertToken,
        createRuntimeState,
        createCoalescingScheduler,
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
        getGeneralWordCandidates,
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
        mergeCasualSpeechTokens,
        mergeAtejiTokens,
        mergeCommonWordTokens,
        mergeExactDictionaryRescueTokens,
        splitReviewedLoanwordToken,
        mergeGeneralWordTokens,
        mergeVariantProperNounTokens,
        needsSpaceBeforeGrammaticalExpression,
        normalizeDictionaryReading,
        normalizeKanaReading,
        normalizeKanjiForLookup,
        normalizePunctuation,
        normalizeRule0OutputPunctuation,
        normalizeTranslatorInputText,
        normalizeSentenceSpacing,
        publicAssetPolicy,
        rankProperNounCandidates,
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
        stripIdeographicVariationSelectors,
        translateText,
        translateTextFromTokenizationForQa,
        verifySentenceLevelResolutions,
        getKanjiReadingData,
        getRuntimeLoadingPolicy,
        registerRuntimeDiagnosticsTools,
        resolveConfiguredAssetBaseUrl,
        updateRuntimeDiagnostics,
        validateAssetSchema
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
    return {
        ...diagnostics,
        runtime: runtimeStatusSnapshot(),
        dataWarnings: [...runtimeState.resourceWarnings],
        developerWarnings: [...runtimeState.developerWarnings],
        regressionFailures: [...(diagnostics.regressionFailures || [])],
        lastTranslation: runtimeState.lastTranslationDiagnostics,
        tools: ENABLE_RUNTIME_DIAGNOSTICS ? runtimeDiagnosticsTools : null
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

const builtInInputScheduler = createCoalescingScheduler(() => {
    refreshBuiltInUiReferences();
    if (kanjiReadingConsumers.length) renderKanjiReadingConsumers();
    if (outputDiv && runtimeState.tokenizer) outputDiv.innerText = translateText(inputArea?.value || '');
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
