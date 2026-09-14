const bridgeSymbol = Symbol.for('CJ2R.translator.runtime-diagnostics.bridge');
const qaInternals = window[bridgeSymbol];
if (!qaInternals) throw new Error('CJ2R runtime diagnostic internals are unavailable.');
const {
    addSurfacePrefixes,
    attachSourceTokenSpans,
    makeDerivedSpanToken,
    makeDerivedSubspanToken,
    validateSourceTokenIntegrity,
    annotateMorphologicalOutputBoundaries,
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
    getGeneralWordCandidates,
    getGeneralWordLookup,
    getHanOccurrences,
    getKuromojiDictionaryReading,
    hasTerminalSokuonReviewCondition,
    hasRepeatedSokuonReviewCondition,
    hasNonGeminativeSokuonReviewCondition,
    getProperNounCandidateLookup,
    getReadingEvidenceAssessment,
    isHanCharacter,
    isParticle,
    isRule0RomajiEvidence,
    makeReadingResolution,
    markJapaneseSingleQuotes,
    markUnreviewedNameContextTokens,
    markAmbiguousNumericRoleTokens,
    markTypedClockHourRoleTokens,
    markTypedMinuteCounterRoleTokens,
    applyTypedNumericRoleReadings,
    mergeCasualSpeechTokens,
    mergeDesiderativeGaruTokens,
    mergeAtejiTokens,
    mergeCommonWordTokens,
    mergeExactDictionaryRescueTokens,
    splitReviewedLoanwordToken,
    mergeGeneralWordTokens,
    mergeKanaLexicalReadingTokens,
    mergeVariantProperNounTokens,
    needsCrossTokenApostrophe,
    needsSyllabicNApostrophe,
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
    validateFinalOutputEvidenceConsistency
} = qaInternals;

// Developer-only regression and QA tools.
// This file is loaded only when runtime diagnostics are explicitly enabled.

// Rule 0: regression expectations come from Romaji Rules.
// Tests protect those rules; they must never redefine them to match current output.
function translateForRegression(inputText, useOverrides, options = {}) {
    const previousState = runtimeState.overridesEnabled;
    const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics;
    runtimeState.overridesEnabled = useOverrides;
    runtimeState.captureTranslationDiagnostics = false;
    try {
        return translateText(inputText, options);
    } finally {
        runtimeState.overridesEnabled = previousState;
        runtimeState.captureTranslationDiagnostics = previousDiagnosticsState;
    }
}

function translateAuditForGeneratedQa(inputText, useOverrides = false, options = {}) {
    const previousState = runtimeState.overridesEnabled;
    const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics;
    const previousDiagnostics = runtimeState.lastTranslationDiagnostics;
    runtimeState.overridesEnabled = useOverrides;
    runtimeState.captureTranslationDiagnostics = true;
    runtimeState.lastTranslationDiagnostics = null;
    try {
        const output = translateText(inputText, options);
        return { output, requiresReview: Boolean(runtimeState.lastTranslationDiagnostics?.requiresReview) };
    } finally {
        runtimeState.overridesEnabled = previousState;
        runtimeState.captureTranslationDiagnostics = previousDiagnosticsState;
        runtimeState.lastTranslationDiagnostics = previousDiagnostics;
    }
}

function evaluateRegressionResult(check, actual) {
    const acceptedValues = Array.isArray(check.expectedAny) ? check.expectedAny : [check.expected];
    return {
        id: check.id,
        suite: check.suite,
        area: check.area || null,
        mechanism: check.mechanism || null,
        rule: check.rule,
        input: check.input,
        expected: acceptedValues.join(' OR '),
        expectedAny: Array.isArray(check.expectedAny) ? [...check.expectedAny] : null,
        actual,
        passed: acceptedValues.includes(actual)
    };
}

function validateRegressionDefinitions(checks, options = {}) {
    const problems = [];
    const seenIds = new Set();
    for (const check of checks) {
        const hasExpected = Object.prototype.hasOwnProperty.call(check, 'expected');
        const hasExpectedAny = Array.isArray(check.expectedAny) && check.expectedAny.length > 0;
        if (!check.id || !check.suite || !check.rule || hasExpected === hasExpectedAny) {
            problems.push(`Incomplete regression definition: ${check.id || check.input || 'unnamed check'}`);
            continue;
        }
        if (hasExpectedAny && !check.expectedAny.every(value => typeof value === 'string' && value.length > 0)) {
            problems.push(`Invalid accepted outputs: ${check.id}`);
            continue;
        }
        if (seenIds.has(check.id)) problems.push(`Duplicate regression id: ${check.id}`);
        seenIds.add(check.id);
        for (const problem of validatePermanentQaMechanismCheck(check)) problems.push(problem);
    }
    if (options.requireMechanismCoverage !== false) {
        for (const problem of validatePermanentQaMechanismCoverage(checks)) problems.push(problem);
    }
    return problems;
}

function testRegressionHarness() {
    const strictProbe = { id: 'HARNESS-STRICT', suite: 'harness', rule: 'Rule 0', input: 'probe', expected: 'Expected' };
    const alternativeProbe = { id: 'HARNESS-ALTERNATIVE', suite: 'harness', rule: 'Rule 0', input: '日本', expectedAny: ['Nihon', 'Nippon'] };
    const strictPass = evaluateRegressionResult(strictProbe, 'Expected');
    const strictFail = evaluateRegressionResult(strictProbe, 'Unexpected');
    const firstAlternative = evaluateRegressionResult(alternativeProbe, 'Nihon');
    const secondAlternative = evaluateRegressionResult(alternativeProbe, 'Nippon');
    const alternativeFail = evaluateRegressionResult(alternativeProbe, 'Japan');
    return strictPass.passed === true
        && strictFail.passed === false
        && firstAlternative.passed === true
        && secondAlternative.passed === true
        && alternativeFail.passed === false
        && testPermanentQaMechanismHarness();
}

function qaHasTerminalPairedWaveDelimiter(sourceText) {
    const source = String(sourceText || '')
        .replace(/[～〜〰]/gu, '~')
        .trim();
    const positions = [];
    for (let index = 0; index < source.length; index += 1) if (source[index] === '~') positions.push(index);
    if (positions.length < 2) return false;
    const closeIndex = positions[positions.length - 1];
    const openIndex = positions[positions.length - 2];
    const inner = source.slice(openIndex + 1, closeIndex).trim();
    const trailing = source.slice(closeIndex + 1);
    return Boolean(inner) && /^[。！？.!?…'"」』）】〕〉》\]\)}]*$/u.test(trailing);
}

function getRegressionInvariants() {
    return [
        {
            id: 'R0-INVARIANT-NO-HAN',
            rule: 'Rule 0 output must not leak Han characters into the Romaji field',
            expected: 'no Han characters',
            test: output => !containsHan(output)
        },
        {
            id: 'R0-INVARIANT-NO-MACRONS',
            rule: 'Rule 0 forbids macrons in final Romaji',
            expected: 'no macrons',
            test: output => !/[ĀĒĪŌŪāēīōū]/u.test(String(output || ''))
        },
        {
            id: 'R0-INVARIANT-ASCII-PUNCTUATION',
            rule: 'Rule 0 final punctuation uses the guide-compatible English forms',
            expected: 'no Japanese punctuation',
            test: output => !/[。、？！：；（）「」『』【】〔〕・～]/u.test(String(output || ''))
        },
        {
            id: 'R0-INVARIANT-SPACING',
            rule: 'Rule 0 output must not contain repeated or punctuation-adjacent stray spaces',
            expected: 'clean spacing',
            test: (output, check) => {
                const value = String(output || '');
                const source = String(check?.input || '');
                const punctuationSpacingClean = !/ {2,}|　/u.test(value)
                    && !/\s+[,.;:?!\)\]]/u.test(value)
                    && !/[\(\[]\s+/u.test(value)
                    && !/[,;:?!](?=[A-Za-z])/u.test(value);
                if (!punctuationSpacingClean) return false;
                if (!/[~～〜]/u.test(source)) return true;
                const waveIndexes = [];
                for (let index = 0; index < value.length; index += 1) if (value[index] === '~') waveIndexes.push(index);
                const pairedTerminalWave = qaHasTerminalPairedWaveDelimiter(source) && waveIndexes.length >= 2;
                const pairedOpenIndex = pairedTerminalWave ? waveIndexes[waveIndexes.length - 2] : -1;
                const pairedCloseIndex = pairedTerminalWave ? waveIndexes[waveIndexes.length - 1] : -1;
                for (const index of waveIndexes) {
                    const left = value[index - 1] || '';
                    const right = value[index + 1] || '';
                    if (index === pairedOpenIndex) {
                        if (left && !/[\s'"]/u.test(left)) return false;
                        if (right && /\s/u.test(right)) return false;
                        continue;
                    }
                    if (index === pairedCloseIndex) {
                        if (left && /\s/u.test(left)) return false;
                        if (right && /\s/u.test(right)) return false;
                        continue;
                    }
                    if (left && !/[\s'"]/u.test(left)) return false;
                    if (right && !/[\s'"]/u.test(right)) return false;
                }
                return true;
            }
        },
        {
            id: 'R0-INVARIANT-NO-UNRESOLVED',
            rule: 'Permanent translation regressions must resolve rather than emit the safety marker',
            expected: 'no [Unresolved] marker',
            test: output => !String(output || '').includes('[Unresolved]')
        }
    ];
}

function evaluateRegressionInvariant(check, invariant, actual) {
    let passed = false;
    try {
        passed = Boolean(invariant.test(actual, check));
    } catch (error) {
        return {
            id: `${check.id}::${invariant.id}`,
            parentId: check.id,
            suite: 'invariant',
            area: check.area || null,
            rule: invariant.rule,
            input: check.input,
            expected: invariant.expected,
            actual: `ERROR: ${error.message || error}`,
            passed: false
        };
    }

    return {
        id: `${check.id}::${invariant.id}`,
        parentId: check.id,
        suite: 'invariant',
        area: check.area || null,
        rule: invariant.rule,
        input: check.input,
        expected: invariant.expected,
        actual: String(actual ?? ''),
        passed
    };
}

function runRegressionInvariants(check, actual) {
    return getRegressionInvariants().map(invariant =>
        evaluateRegressionInvariant(check, invariant, actual)
    );
}

function stableSample(items, limit, keySelector = value => String(value)) {
    const values = [...items].sort((left, right) =>
        keySelector(left).localeCompare(keySelector(right), 'ja')
    );
    const cappedLimit = Math.max(0, Math.min(values.length, Number(limit) || 0));
    if (!cappedLimit || !values.length) return [];
    if (values.length <= cappedLimit) return values;
    if (cappedLimit === 1) return [values[Math.floor(values.length / 2)]];

    const selected = [];
    const usedIndexes = new Set();
    for (let index = 0; index < cappedLimit; index += 1) {
        const position = Math.round(index * (values.length - 1) / (cappedLimit - 1));
        if (usedIndexes.has(position)) continue;
        usedIndexes.add(position);
        selected.push(values[position]);
    }
    return selected;
}

function makeQaResult(id, category, input, passed, actual, expected) {
    return { id, category, input, passed: Boolean(passed), actual, expected };
}

// This heavier QA pass is manual by design. It samples large banks,
// exhaustively checks small reviewed banks, and derives checks at runtime.
function runTranslatorGeneratedQA(options = {}) {
    const limit = Math.max(5, Math.min(250, Number(options.limit || 40)));
    const results = [];
    const definitions = getRegressionDefinitions();
    const engineSample = runtimeState.tokenizer
        ? stableSample(definitions.engineChecks, Math.min(12, limit), check => check.id)
        : [];

    for (const check of engineSample) {
        const first = translateForRegression(check.input, false);
        const second = translateForRegression(check.input, false);
        results.push(makeQaResult(
            `QA-DETERMINISM-${check.id}`,
            'determinism',
            check.input,
            first === second,
            `${first} | ${second}`,
            'identical repeated output'
        ));
    }

    const punctuationCandidates = runtimeState.tokenizer
        ? definitions.engineChecks.map(check => ({ check, base: translateForRegression(check.input, false) }))
            .filter(({ check, base }) => !/^[ぁ-ゖ]{1,3}$/u.test(check.input)
                && !/[。？！?!\.]$/u.test(check.input)
                && !base.includes('[Unresolved]'))
        : [];
    const punctuationSample = stableSample(
        punctuationCandidates,
        Math.min(12, limit),
        ({ check }) => check.id
    );
    for (const { check, base } of punctuationSample) {
        const punctuated = translateForRegression(`${check.input}。`, false);
        results.push(makeQaResult(
            `QA-PUNCTUATION-${check.id}`,
            'metamorphic-punctuation',
            `${check.input} + 。`,
            punctuated === `${base}.`,
            punctuated,
            `${base}.`
        ));
    }

    const boundaryPunctuationSample = punctuationSample.slice(0, Math.min(8, punctuationSample.length));
    for (const { check, base } of boundaryPunctuationSample) {
        const commaJoined = translateForRegression(`${check.input}、${check.input}`, false);
        results.push(makeQaResult(
            `QA-COMMA-BOUNDARY-${check.id}`,
            'metamorphic-punctuation-boundary',
            `${check.input}、${check.input}`,
            commaJoined === `${base}, ${base}`,
            commaJoined,
            `${base}, ${base}`
        ));

        for (const [waveLabel, wave] of [['WAVE', '〜'], ['WAVE-FULLWIDTH', '～'], ['WAVE-ASCII', '~']]) {
            const waveJoined = translateForRegression(`${check.input}${wave}${check.input}`, false);
            results.push(makeQaResult(
                `QA-${waveLabel}-BOUNDARY-${check.id}`,
                'metamorphic-punctuation-boundary',
                `${check.input}${wave}${check.input}`,
                waveJoined === `${base} ~ ${base}`,
                waveJoined,
                `${base} ~ ${base}`
            ));
        }
    }

    const waveContractCandidates = punctuationCandidates.filter(({ check }) => !/[~～〜「」『』"']/u.test(String(check.input || '')));
    const waveContractFailures = [];
    for (const { check, base } of waveContractCandidates) {
        const baseAudit = translateAuditForGeneratedQa(check.input, false);
        const variants = [['〜', 'wave-dash'], ['～', 'fullwidth-tilde'], ['~', 'ascii-tilde']];
        const outputs = variants.map(([wave, label]) => {
            const audit = translateAuditForGeneratedQa(`${check.input}${wave}${check.input}`, false);
            return { label, output: audit.output, requiresReview: audit.requiresReview };
        });
        const expected = `${base} ~ ${base}`;
        if (outputs.some(item => item.output !== expected || item.requiresReview !== baseAudit.requiresReview)) {
            waveContractFailures.push({ id: check.id, input: check.input, expected, expectedRequiresReview: baseAudit.requiresReview, outputs });
            if (waveContractFailures.length >= 5) break;
        }
    }
    results.push(makeQaResult(
        'QA-CONTRACT-WAVE-BOUNDARY-EQUIVALENCE',
        'contract-boundary-equivalence',
        `${waveContractCandidates.length} eligible permanent engine cases × 3 wave forms`,
        waveContractFailures.length === 0,
        waveContractFailures.length ? JSON.stringify(waveContractFailures) : `${waveContractCandidates.length} cases equivalent`,
        'all ~ / ～ / 〜 forms preserve identical boundary-local translation and review status'
    ));

    const missingKanaEvidence = [];
    let requiredKanaEvidenceCount = 0;
    for (const [surface, entry] of runtimeState.generalWordDictionary.entries()) {
        if (!entry?.mergeSafe) continue;
        for (const item of entry.readings || []) {
            const reading = normalizeKanaReading(item?.reading || '');
            if (!reading || !/^[ぁ-ゖー]+$/u.test(reading) || !containsHan(surface)) continue;
            requiredKanaEvidenceCount += 1;
            const evidence = runtimeState.kanaLexicalReadingDictionary.get(reading);
            if (!evidence?.surfaces?.has(surface)) {
                missingKanaEvidence.push({ surface, reading });
                if (missingKanaEvidence.length >= 10) break;
            }
        }
        if (missingKanaEvidence.length >= 10) break;
    }
    results.push(makeQaResult(
        'QA-CONTRACT-KANA-LEXICAL-EVIDENCE-COMPLETE',
        'contract-kana-continuity',
        `${requiredKanaEvidenceCount} merge-safe lexical readings checked`,
        missingKanaEvidence.length === 0,
        missingKanaEvidence.length ? JSON.stringify(missingKanaEvidence) : `${requiredKanaEvidenceCount} readings registered`,
        'every merge-safe lexical reading is registered for kana tokenisation repair'
    ));

    const generalSamples = stableSample(
        [...runtimeState.generalWordDictionary.entries()].filter(([, entry]) => entry?.readings?.length),
        limit,
        ([surface]) => surface
    );
    for (const [surface, entry] of generalSamples) {
        const readings = entry.readings || [];
        const kanaValid = readings.every(item => /^[ぁ-ゖァ-ヶー]+$/u.test(item.reading));
        const sorted = readings.every((item, index) => !index || readings[index - 1].score >= item.score);
        const romajiSafe = readings.every(item => {
            const romaji = convertToRomaji(item.reading);
            return !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        });
        results.push(makeQaResult(
            `QA-GENERAL-${surface}`,
            'dictionary-structure',
            surface,
            kanaValid && sorted && romajiSafe,
            `kana=${kanaValid}; sorted=${sorted}; romaji=${romajiSafe}`,
            'valid ranked kana readings and Rule 0-safe Romaji'
        ));
    }

    const historicalSamples = stableSample(
        [...runtimeState.historicalKanaEvidenceDictionary.entries()],
        Math.min(limit, 20),
        ([surface]) => surface
    );
    for (const [surface, entry] of historicalSamples) {
        const readingValid = /^[ぁ-ゖァ-ンヴー]+$/u.test(entry?.reading || '');
        const sourceValid = /^https?:\/\//u.test(entry?.source || '');
        const romaji = convertToRomaji(entry?.reading || '');
        const romajiSafe = Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        results.push(makeQaResult(
            `QA-HISTORICAL-${surface}`,
            'historical-evidence-structure',
            surface,
            readingValid && sourceValid && romajiSafe,
            `reading=${readingValid}; source=${sourceValid}; romaji=${romajiSafe}`,
            'valid modern-kana reading, source URL and Rule 0-safe Romaji'
        ));
    }

    // Small reviewed banks are cheap enough to validate exhaustively.
    for (const [surface, output] of runtimeState.loanwordDictionary.entries()) {
        const outputSafe = Boolean(output) && !containsHan(output) && !/[ĀĒĪŌŪāēīōū]/u.test(output);
        const translated = runtimeState.tokenizer ? translateForRegression(surface, false) : output;
        results.push(makeQaResult(
            `QA-LOANWORD-${surface}`,
            'loanword-bank',
            surface,
            outputSafe && translated === output,
            `output=${output}; translated=${translated}`,
            'source-language output is Rule 0-safe and used by translation'
        ));
    }

    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        const readingValid = /^[ぁ-ゖァ-ンヴー]+$/u.test(entry?.reading || '');
        const romaji = String(entry?.romaji || '').trim();
        const romajiSafe = Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        const audit = runtimeState.tokenizer ? translateAuditForGeneratedQa(surface, false) : { output: romaji, requiresReview: false };
        const lexicalCandidates = entry?.role === 'minute-counter' ? getGeneralWordCandidates(getGeneralWordLookup(surface)) : [];
        const competingLexicalOutputs = lexicalCandidates
            .filter(candidate => normalizeKanaReading(candidate?.reading || '') !== normalizeKanaReading(entry?.reading || ''))
            .map(candidate => capitalizeRomaji(convertToRomaji(candidate.reading || '')));
        const roleConflictHandled = competingLexicalOutputs.length > 0
            && audit.requiresReview
            && competingLexicalOutputs.includes(audit.output);
        const translationValid = audit.output === romaji || roleConflictHandled;
        results.push(makeQaResult(
            `QA-COUNTER-DATE-${surface}`,
            'counter-date-bank',
            surface,
            readingValid && romajiSafe && translationValid,
            `role=${entry?.role || ''}; reading=${entry?.reading || ''}; romaji=${romaji}; translated=${audit.output}; review=${audit.requiresReview}`,
            'reviewed counter/date evidence is Rule 0-safe and is used only when its semantic role is established; incompatible lexical evidence remains reviewable'
        ));
    }

    for (const [surface, reading] of runtimeState.atejiDictionary.entries()) {
        const readingValid = /^[ぁ-ゖァ-ンヴー]+$/u.test(reading || '');
        const romaji = convertToRomaji(reading || '');
        const romajiSafe = Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        results.push(makeQaResult(
            `QA-ATEJI-${surface}`,
            'ateji-bank',
            surface,
            readingValid && romajiSafe,
            `reading=${reading}; romaji=${romaji}`,
            'valid whole-word kana reading and Rule 0-safe Romaji'
        ));
    }

    for (const [surface, entry] of runtimeState.reviewedProperNameSpanDictionary.entries()) {
        const readingValid = /^[ぁ-ゖァ-ンヴー]+$/u.test(entry?.reading || '');
        const romaji = String(entry?.romaji || '').trim();
        const romajiSafe = Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        const translated = runtimeState.tokenizer ? translateForRegression(surface, false) : romaji;
        results.push(makeQaResult(
            `QA-REVIEWED-PROPER-NAME-${surface}`,
            'reviewed-proper-name-span-bank',
            surface,
            readingValid && romajiSafe && translated === romaji,
            `reading=${entry?.reading || ''}; romaji=${romaji}; translated=${translated}`,
            'reviewed exact name/place reading and Rule 0 output are used unchanged'
        ));
    }

    for (const [surface, romaji] of Object.entries(runtimeState.particleExpressions)) {
        const outputSafe = Boolean(romaji) && romaji === romaji.toLowerCase() && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        results.push(makeQaResult(
            `QA-PARTICLE-EXPRESSION-${surface}`,
            'particle-expression-bank',
            surface,
            outputSafe,
            romaji,
            'lowercase Rule 0-safe particle/expression Romaji'
        ));
    }

    for (const [surface, entry] of runtimeState.readingEvidenceDictionary.entries()) {
        const candidates = [entry?.preferredReading, ...(entry?.alternatives || []).map(item => item.reading)].filter(Boolean);
        const readingsValid = candidates.length > 1 && candidates.every(reading => /^[ぁ-ゖァ-ンヴー]+$/u.test(reading));
        const romajiSafe = candidates.every(reading => {
            const romaji = convertToRomaji(reading);
            return Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        });
        results.push(makeQaResult(
            `QA-READING-EVIDENCE-${surface}`,
            'reading-evidence-bank',
            surface,
            readingsValid && romajiSafe,
            `readings=${candidates.join('|')}; romaji=${romajiSafe}`,
            'preferred and alternative readings are valid kana and Rule 0-safe'
        ));
    }

    for (const [surface, entry] of runtimeState.rendakuEvidenceDictionary.entries()) {
        const readingValid = /^[ぁ-ゖァ-ンヴー]+$/u.test(entry?.reading || '');
        const sourceValid = Boolean(entry?.source);
        const romaji = convertToRomaji(entry?.reading || '');
        const romajiSafe = Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        results.push(makeQaResult(
            `QA-RENDAKU-${surface}`,
            'rendaku-evidence-bank',
            surface,
            readingValid && sourceValid && romajiSafe,
            `reading=${entry?.reading || ''}; source=${sourceValid}; romaji=${romaji}`,
            'attested whole-word reading has source evidence and Rule 0-safe Romaji'
        ));
    }

    for (const item of runtimeState.contextOverrides) {
        const patternValid = item?.pattern instanceof RegExp;
        const surfaceValid = Boolean(String(item?.surface || '').trim());
        const romaji = String(item?.romaji || '').trim();
        const romajiSafe = Boolean(romaji) && !containsHan(romaji) && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
        const sourceValid = !item?.source || /^https?:\/\//u.test(String(item.source));
        results.push(makeQaResult(
            `QA-CONTEXT-OVERRIDE-${item?.surface || 'unknown'}-${results.length}`,
            'context-override-bank',
            String(item?.surface || ''),
            patternValid && surfaceValid && romajiSafe && sourceValid,
            `pattern=${patternValid}; surface=${surfaceValid}; romaji=${romaji}; source=${sourceValid}`,
            'compiled pattern, surface, optional source URL and Rule 0-safe Romaji'
        ));
    }

    for (const [surface, rules] of runtimeState.titleReadingDictionary.entries()) {
        for (const [index, item] of (rules || []).entries()) {
            const patternValid = item?.pattern instanceof RegExp;
            const surfaceValid = Boolean(String(surface || '').trim());
            const reading = String(item?.reading || '').trim();
            const readingValid = !reading || /^[ぁ-ゖァ-ンヴー]+$/u.test(reading);
            const kind = String(item?.kind || '').trim();
            const romaji = String(item?.romaji ?? '').trim();
            const silentSeparator = kind === 'title-separator-silent';
            const romajiSafe = (silentSeparator ? romaji === '' : Boolean(romaji))
                && !containsHan(romaji)
                && !/[ĀĒĪŌŪāēīōū]/u.test(romaji);
            const kindValid = Boolean(kind);
            const sourceValid = Boolean(String(item?.source || '').trim());
            results.push(makeQaResult(
                `QA-TITLE-READING-${surface}-${index}`,
                'title-reading-evidence-bank',
                surface,
                patternValid && surfaceValid && readingValid && romajiSafe && kindValid && sourceValid,
                `pattern=${patternValid}; surface=${surfaceValid}; reading=${readingValid}; romaji=${romaji}; kind=${kindValid}; source=${sourceValid}`,
                'scoped pattern, optional kana reading, evidence kind/source and Rule 0-safe Romaji (empty only for an explicitly silent title separator)'
            ));
        }
    }

    const generalVariants = stableSample([...runtimeState.generalKanjiVariantDictionary.entries()], Math.min(limit, 30), ([variant]) => variant);
    for (const [variant, reference] of generalVariants) {
        results.push(makeQaResult(
            `QA-VARIANT-GENERAL-${variant}`,
            'metamorphic-variant',
            `${variant} → ${reference}`,
            normalizeKanjiForLookup(variant) === reference,
            normalizeKanjiForLookup(variant),
            reference
        ));
    }

    const nameVariants = stableSample([...runtimeState.nameKanjiVariantDictionary.entries()], Math.min(limit, 30), ([variant]) => variant);
    for (const [variant, reference] of nameVariants) {
        results.push(makeQaResult(
            `QA-VARIANT-NAME-${variant}`,
            'metamorphic-variant',
            `${variant} → ${reference}`,
            normalizeKanjiForLookup(variant, { names: true }) === reference,
            normalizeKanjiForLookup(variant, { names: true }),
            reference
        ));
    }

    const failures = results.filter(result => !result.passed);
    const summary = results.reduce((acc, result) => {
        acc[result.category] = acc[result.category] || { passed: 0, failed: 0, total: 0 };
        acc[result.category].total += 1;
        acc[result.category][result.passed ? 'passed' : 'failed'] += 1;
        return acc;
    }, {});

    const report = { rule: 'Rule 0: Obey Romaji Rules', results, failures, summary };
    updateRuntimeDiagnostics('generatedQA', report);
    return report;
}

function getKuromojiWholeReading(surface) {
    if (!runtimeState.tokenizer || !surface) return { reading: null, rawReading: null, tokens: [] };
    const tokens = runtimeState.tokenizer.tokenize(String(surface));
    const readings = [];
    const tokenSummary = [];

    for (const token of tokens) {
        const tokenSurface = String(token.surface_form || '');
        if (token.pos === '記号' && !containsHan(tokenSurface)) continue;
        const reading = getKuromojiDictionaryReading(token);
        tokenSummary.push({
            surface: tokenSurface,
            reading: reading || null,
            pos: token.pos,
            detail1: token.pos_detail_1,
            detail2: token.pos_detail_2
        });
        if (!reading) return { reading: null, rawReading: null, tokens: tokenSummary };
        readings.push(reading);
    }

    const rawReading = readings.join('');
    return {
        reading: normalizeKanaReading(rawReading),
        rawReading,
        tokens: tokenSummary
    };
}

function getReadingEvidenceCandidatesForSurface(surface) {
    const evidence = runtimeState.readingEvidenceDictionary.get(String(surface || ''));
    if (!evidence) return [];

    return [
        { reading: evidence.preferredReading, weight: evidence.preferredPriority },
        ...evidence.alternatives.map(item => ({ reading: item.reading, weight: item.priority }))
    ].filter(candidate => candidate.reading);
}

function compareReferenceReadingSets(surface, leftCandidates, rightCandidates, sourceType) {
    const left = leftCandidates.filter(candidate => candidate?.reading);
    const right = rightCandidates.filter(candidate => candidate?.reading);
    if (!left.length || !right.length) {
        return {
            surface,
            sourceType,
            status: 'unavailable',
            leftReadings: left.map(candidate => candidate.reading),
            rightReadings: right.map(candidate => candidate.reading)
        };
    }

    const leftReadings = new Set(left.map(candidate => normalizeKanaReading(candidate.reading)));
    const rightReadings = new Set(right.map(candidate => normalizeKanaReading(candidate.reading)));
    const agreement = [...leftReadings].some(reading => rightReadings.has(reading));
    return {
        surface,
        sourceType,
        status: agreement ? 'agreement' : 'disagreement',
        leftReadings: left.map(candidate => candidate.reading),
        rightReadings: right.map(candidate => candidate.reading)
    };
}

function compareIndependentReadingSources(surface, referenceCandidates, sourceType) {
    const reference = [...referenceCandidates]
        .filter(candidate => candidate?.reading)
        .map(candidate => ({
            reading: candidate.reading,
            normalized: normalizeKanaReading(candidate.reading),
            weight: Number(candidate.weight || 0)
        }));
    const kuromoji = getKuromojiWholeReading(surface);
    const accepted = new Set(reference.map(candidate => candidate.normalized));
    const agreement = Boolean(kuromoji.reading && accepted.has(kuromoji.reading));
    const status = !kuromoji.reading ? 'unavailable' : agreement ? 'agreement' : 'disagreement';

    const translatorOutput = translateForRegression(surface, false);
    const normalizeRomaji = value => String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    const translatorKey = normalizeRomaji(translatorOutput);
    const referenceKeys = reference.map(candidate => normalizeRomaji(convertToRomaji(candidate.reading)));
    const translatorMatchesReference = Boolean(translatorKey && referenceKeys.includes(translatorKey));
    return {
        surface,
        sourceType,
        status,
        kuromojiReading: kuromoji.reading,
        referenceReadings: reference.map(candidate => candidate.reading),
        translatorOutput,
        translatorMatchesReference,
        reviewStatus: status === 'disagreement'
            ? (translatorMatchesReference ? 'resolved-by-translator' : 'unresolved')
            : 'not-needed',
        tokens: kuromoji.tokens
    };
}

// Differential testing compares Kuromoji against independently loaded
// lexical/name evidence. Disagreements are review targets, never auto-fixes.
function runTranslatorDifferentialChecks(options = {}) {
    const generalLimit = Math.max(0, Math.min(500, Number(options.generalLimit ?? 80)));
    const nameLimit = Math.max(0, Math.min(500, Number(options.nameLimit ?? 40)));
    const evidenceLimit = Math.max(0, Math.min(500, Number(options.evidenceLimit ?? 80)));
    const results = [];

    // This comparison works even without Kuromoji and checks two separately
    // loaded lexical evidence sources. A disagreement is a review target only.
    const evidenceEntries = stableSample(
        [...runtimeState.readingEvidenceDictionary.keys()].filter(surface => runtimeState.generalWordDictionary.has(surface)),
        evidenceLimit,
        surface => surface
    );
    for (const surface of evidenceEntries) {
        const generalLookup = getGeneralWordLookup(surface);
        results.push(compareReferenceReadingSets(
            surface,
            getGeneralWordCandidates(generalLookup),
            getReadingEvidenceCandidatesForSurface(surface),
            'general-word-vs-reading-evidence'
        ));
    }

    const generalEntries = stableSample(
        [...runtimeState.generalWordDictionary.entries()].filter(([surface, entry]) =>
            containsHan(surface) && entry?.readings?.length
        ),
        generalLimit,
        ([surface]) => surface
    );
    for (const [surface, entry] of generalEntries) {
        results.push(compareIndependentReadingSources(
            surface,
            entry.readings.map(item => ({ reading: item.reading, weight: item.score })),
            'general-word-vs-kuromoji'
        ));
    }

    const nameEntries = stableSample(
        [...runtimeState.properNounDictionary.entries()].filter(([surface, candidates]) =>
            containsHan(surface) && candidates?.size
        ),
        nameLimit,
        ([surface]) => surface
    );
    for (const [surface, candidates] of nameEntries) {
        results.push(compareIndependentReadingSources(
            surface,
            [...candidates.values()],
            'proper-noun-vs-kuromoji'
        ));
    }

    const summary = results.reduce((acc, result) => {
        acc[result.status] = (acc[result.status] || 0) + 1;
        return acc;
    }, { agreement: 0, disagreement: 0, unavailable: 0 });
    const disagreements = results.filter(result => result.status === 'disagreement');
    const unavailable = results.filter(result => result.status === 'unavailable');
    summary.resolvedDisagreement = disagreements.filter(result => result.reviewStatus === 'resolved-by-translator').length;
    summary.unresolvedDisagreement = disagreements.length - summary.resolvedDisagreement;
    const report = { summary, results, disagreements, unavailable };

    updateRuntimeDiagnostics('differential', report);
    console.info(`Differential reading check: ${summary.agreement} agree, ${summary.disagreement} disagree, ${summary.unavailable} unavailable.`);
    return report;
}
