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

