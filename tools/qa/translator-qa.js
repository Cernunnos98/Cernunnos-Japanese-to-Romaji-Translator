(function () {
    'use strict';
    const bridgeSymbol = Symbol.for('CJ2R.translator.runtime-diagnostics.bridge');
    const qaInternals = window[bridgeSymbol];
    if (!qaInternals) throw new Error('CJ2R runtime diagnostic internals are unavailable.');
    const {
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
        getReadingEvidenceAssessment,
        isHanCharacter,
        isParticle,
        isRule0RomajiEvidence,
        makeReadingResolution,
        markJapaneseSingleQuotes,
        markUnreviewedNameContextTokens,
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
            const translated = runtimeState.tokenizer ? translateForRegression(surface, false) : romaji;
            results.push(makeQaResult(
                `QA-COUNTER-DATE-${surface}`,
                'counter-date-bank',
                surface,
                readingValid && romajiSafe && translated === romaji,
                `reading=${entry?.reading || ''}; romaji=${romaji}; translated=${translated}`,
                'reviewed counter/date reading and Rule 0 output are used unchanged'
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

    function getRomajiCoreRegressionChecks() {
        return [
            { id: 'R0-KANA-SOKUON', suite: 'unit', rule: 'R0.4 small っ doubles the following consonant', input: 'きっぷ', expected: 'kippu', run: () => convertToRomaji('きっぷ') },
            { id: 'R0-KANA-SOKUON-SH', suite: 'unit', rule: 'R0.4 small っ doubles the following s/sh-family consonant', input: 'ざっし', expected: 'zasshi', run: () => convertToRomaji('ざっし') },
            { id: 'R0-KANA-SOKUON-CH', suite: 'unit', rule: 'R0.4 small っ preserves the Hepburn doubled consonant before chi', input: 'こっち', expected: 'kocchi', run: () => convertToRomaji('こっち') },
            { id: 'R0-KATAKANA-SOKUON', suite: 'unit', rule: 'R0.4 Katakana ッ uses the same following-consonant mechanism', input: 'ゲット', expected: 'getto', run: () => convertToRomaji('ゲット') },
            { id: 'R0-KANA-SOKUON-TS', suite: 'unit', rule: 'R0.4 small っ before tsu doubles the initial t in this guide Romaji', input: 'みっつ', expected: 'mittsu', run: () => convertToRomaji('みっつ') },
            { id: 'R0-KANA-SOKUON-YOON', suite: 'unit', rule: 'R0.4 small っ also doubles the consonant of a following contracted kana unit', input: 'きっきょ', expected: 'kikkyo', run: () => convertToRomaji('きっきょ') },
            { id: 'R0-KATAKANA-SOKUON-VOICED-G', suite: 'unit', rule: 'R0.4 modern Katakana sokuon can geminate a voiced obstruent', input: 'バッグ', expected: 'baggu', run: () => convertToRomaji('バッグ') },
            { id: 'R0-KATAKANA-SOKUON-VOICED-D', suite: 'unit', rule: 'R0.4 modern Katakana sokuon can geminate a voiced d consonant', input: 'ベッド', expected: 'beddo', run: () => convertToRomaji('ベッド') },
            { id: 'R0-KATAKANA-SOKUON-VOICED-B', suite: 'unit', rule: 'R0.4 modern Katakana sokuon can geminate a voiced b consonant', input: 'アッバ', expected: 'abba', run: () => convertToRomaji('アッバ') },
            { id: 'R0-KATAKANA-SOKUON-VOICED-Z', suite: 'unit', rule: 'R0.4 modern Katakana sokuon can geminate a voiced z consonant', input: 'キッズ', expected: 'kizzu', run: () => convertToRomaji('キッズ') },
            { id: 'R0-KATAKANA-SOKUON-J', suite: 'unit', rule: 'R0.4 modern Katakana sokuon can geminate j', input: 'バッジ', expected: 'bajji', run: () => convertToRomaji('バッジ') },
            { id: 'R0-KATAKANA-SOKUON-F', suite: 'unit', rule: 'R0.4 Katakana sokuon can geminate f in foreign spellings', input: 'ワッフル', expected: 'waffuru', run: () => convertToRomaji('ワッフル') },
            { id: 'R0-KATAKANA-SOKUON-V', suite: 'unit', rule: 'R0.4 extended Katakana can represent a sokuon before v', input: 'アッヴァ', expected: 'avva', run: () => convertToRomaji('アッヴァ') },
            { id: 'SYS-KATAKANA-VU-RESOLVER', suite: 'unit', rule: 'Modern Katakana ヴ follows the written-kana resolver path rather than unsupported-script fallback after real tokenisation', input: 'ヴ', expected: 'written-kana|false|false', run: () => { const token = runtimeState.tokenizer.tokenize('ヴ')[0]; const resolution = resolveTokenReading(token, 'ヴ'); return `${resolution.source}|${resolution.flags.includes('unsupported-script')}|${resolution.flags.includes('unresolved-reading')}`; } },
            { id: 'R0-KATAKANA-SOKUON-EXTENDED-TI', suite: 'unit', rule: 'R0.4 sokuon applies before an extended Katakana consonant unit', input: 'セッティ', expected: 'setti', run: () => convertToRomaji('セッティ') },
            { id: 'R0-SOKUON-NO-VOWEL-DOUBLING', suite: 'unit', rule: 'R0.4 sokuon before a vowel does not invent a doubled vowel', input: 'あっあ', expected: 'aa', run: () => convertToRomaji('あっあ') },
            { id: 'R0-SOKUON-NO-SONORANT-GUESS', suite: 'unit', rule: 'R0.4 unusual sokuon before a non-geminative sonorant is not mechanically doubled', input: 'あっら', expected: 'ara', run: () => convertToRomaji('あっら') },
            { id: 'R0-KANA-FOREIGN-DU', suite: 'unit', rule: 'R0.5 foreign small-kana pairs stay inside one Romaji unit', input: 'ドゥ', expected: 'du', run: () => convertToRomaji('ドゥ') },
            { id: 'R0-KANA-BASE-INVENTORY', suite: 'unit', rule: 'The complete supported base Kana inventory is mechanically convertible without leaking Japanese Kana', input: 'base Kana inventory', expected: 'true', run: () => { const required = { 'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ゎ':'wa','ゕ':'ka','ゖ':'ke','ゐ':'i','ゑ':'e','ゟ':'yori' }; return String(Object.entries(required).every(([surface, expected]) => { const actual = convertToRomaji(surface); return actual === expected && !/[ぁ-ゖゟァ-ヺヿ]/u.test(actual); })); } },
            { id: 'R0-KANA-KATAKANA-MIRROR', suite: 'unit', rule: 'Every supported base Hiragana entry has an equivalent Katakana path through the shared mechanical converter', input: 'base Hiragana/Katakana parity', expected: 'true', run: () => { const required = { 'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ゎ':'wa','ゕ':'ka','ゖ':'ke','ゐ':'i','ゑ':'e','ゟ':'yori' }; const toKatakana = value => Array.from(value).map(character => { const code = character.codePointAt(0); return code >= 0x3041 && code <= 0x309f ? String.fromCodePoint(code + 0x60) : character; }).join(''); return String(Object.entries(required).filter(([surface]) => surface !== 'ゟ').every(([surface, expected]) => convertToRomaji(toKatakana(surface)) === expected)); } },
            { id: 'R0-KANA-CONTRACTED-INVENTORY', suite: 'unit', rule: 'The complete supported contracted Kana inventory, including yoon and extended foreign-sound spellings, has deterministic Romaji with no Kana leakage', input: 'contracted Kana inventory', expected: 'true', run: () => { const required = { 'キャ':'kya', 'キュ':'kyu', 'キョ':'kyo', 'キェ':'kye', 'ギャ':'gya', 'ギュ':'gyu', 'ギョ':'gyo', 'ギェ':'gye', 'シャ':'sha', 'シュ':'shu', 'ショ':'sho', 'シェ':'she', 'ジャ':'ja', 'ジュ':'ju', 'ジョ':'jo', 'ジェ':'je', 'チャ':'cha', 'チュ':'chu', 'チョ':'cho', 'チェ':'che', 'ヂャ':'ja', 'ヂュ':'ju', 'ヂョ':'jo', 'ヂェ':'je', 'ニャ':'nya', 'ニュ':'nyu', 'ニョ':'nyo', 'ニェ':'nye', 'ヒャ':'hya', 'ヒュ':'hyu', 'ヒョ':'hyo', 'ヒェ':'hye', 'ビャ':'bya', 'ビュ':'byu', 'ビョ':'byo', 'ビェ':'bye', 'ピャ':'pya', 'ピュ':'pyu', 'ピョ':'pyo', 'ピェ':'pye', 'ミャ':'mya', 'ミュ':'myu', 'ミョ':'myo', 'ミェ':'mye', 'リャ':'rya', 'リュ':'ryu', 'リョ':'ryo', 'リェ':'rye', 'イィ':'yi', 'イェ':'ye', 'ウァ':'wa', 'ウィ':'wi', 'ウゥ':'wu', 'ウェ':'we', 'ウォ':'wo', 'ウャ':'wya', 'ウュ':'wyu', 'ウィェ':'wye', 'ウョ':'wyo', 'クァ':'kwa', 'クィ':'kwi', 'クェ':'kwe', 'クォ':'kwo', 'クヮ':'kwa', 'グァ':'gwa', 'グィ':'gwi', 'グェ':'gwe', 'グォ':'gwo', 'グヮ':'gwa', 'スィ':'si', 'ズィ':'zi', 'ツァ':'tsa', 'ツィ':'tsi', 'ツェ':'tse', 'ツォ':'tso', 'ツャ':'tsya', 'ツュ':'tsyu', 'ツィェ':'tsye', 'ツョ':'tsyo', 'ヅァ':'za', 'ヅィ':'zi', 'ヅェ':'ze', 'ヅォ':'zo', 'ヅャ':'zya', 'ヅュ':'zyu', 'ヅィェ':'zye', 'ヅョ':'zyo', 'ティ':'ti', 'テュ':'tyu', 'トゥ':'tu', 'トィ':'twi', 'ディ':'di', 'デュ':'dyu', 'ドゥ':'du', 'ドィ':'dwi', 'ヌィ':'nwi', 'ブィ':'bwi', 'プィ':'pwi', 'ムィ':'mwi', 'ユィ':'ywi', 'ユェ':'ye', 'ルィ':'rwi', 'ファ':'fa', 'フィ':'fi', 'フェ':'fe', 'フォ':'fo', 'フャ':'fya', 'フュ':'fyu', 'フィェ':'fye', 'フョ':'fyo', 'ホゥ':'hu', 'ヴァ':'va', 'ヴィ':'vi', 'ヴェ':'ve', 'ヴォ':'vo', 'ヴャ':'vya', 'ヴュ':'vyu', 'ヴィェ':'vye', 'ヴョ':'vyo' }; return String(Object.entries(required).every(([surface, expected]) => { const actual = convertToRomaji(surface); return actual === expected && !/[ぁ-ゖゟァ-ヺヿ]/u.test(actual); })); } },
            { id: 'R0-KANA-HISTORICAL-SPECIAL-INVENTORY', suite: 'unit', rule: 'Supported historical and special Kana code points have deterministic mechanical Romaji paths', input: 'ゐ ゑ ヰ ヱ ヷ ヸ ヹ ヺ ゟ ヿ ヵ ヶ', expected: 'i|e|i|e|va|vi|ve|vo|yori|koto|ka|ke', run: () => ['ゐ','ゑ','ヰ','ヱ','ヷ','ヸ','ヹ','ヺ','ゟ','ヿ','ヵ','ヶ'].map(convertToRomaji).join('|') },
            { id: 'R0-KANA-COMBINING-DAKUTEN', suite: 'unit', rule: 'Decomposed combining dakuten is NFC-normalised before tokenisation so valid voiced Kana remains deterministic', input: 'カ + combining dakuten', expected: 'ガ', run: () => normalizeTranslatorInputText('カ\u3099') },
            { id: 'R0-KANA-COMBINING-HANDAKUTEN', suite: 'unit', rule: 'Decomposed combining handakuten is NFC-normalised before tokenisation so valid semi-voiced Kana remains deterministic', input: 'ハ + combining handakuten', expected: 'パ', run: () => normalizeTranslatorInputText('ハ\u309A') },
            { id: 'R0-KANA-N-APOSTROPHE', suite: 'unit', rule: "R0.6 ん before a vowel or y uses an apostrophe", input: 'げんえい', expected: "gen'ei", run: () => convertToRomaji('げんえい') },
            { id: 'SYS-SOURCE-SPELLING-REVIEW', suite: 'unit', rule: 'Unreviewed prolonged Katakana nouns are marked for source-spelling review instead of being silently accepted as final Romaji', input: 'パーティー', expected: 'missing-source-spelling-evidence', run: () => resolveTokenReading({ surface_form: 'パーティー', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: 'パーティー', pronunciation: 'パーティー' }, 'パーティー').flags.includes('missing-source-spelling-evidence') ? 'missing-source-spelling-evidence' : 'missing' },
            { id: 'R0-KANA-OU', suite: 'unit', rule: 'R0.3 written おう remains ou', input: 'とうきょう', expected: 'toukyou', run: () => convertToRomaji('とうきょう') },
            { id: 'R0-KANA-OO', suite: 'unit', rule: 'R0.3 written おお remains oo', input: 'おおさか', expected: 'oosaka', run: () => convertToRomaji('おおさか') },
            { id: 'R0-PUNCT-WAVE-TILDE', suite: 'unit', rule: 'Rule 0 punctuation converts full-width ～ to ASCII ~', input: '～', expected: '~', run: () => normalizePunctuation('～') },
            { id: 'SYS-TOKENIZER-WAVE-CANONICALISATION', suite: 'unit', rule: 'All accepted wave delimiters canonicalise to the same tokenizer-safe boundary before linguistic processing', input: 'A〜B～C~D', expected: 'A~B~C~D', run: () => canonicalizeTokenizerBoundaryCharacters('A〜B～C~D') },
            { id: 'SYS-INPUT-WAVE-CANONICALISATION', suite: 'unit', rule: 'Central input normalisation makes wave-dash, fullwidth tilde and ASCII tilde equivalent', input: '学校〜切手 / 学校～切手 / 学校~切手', expected: 'true', run: () => String(new Set(['学校〜切手', '学校～切手', '学校~切手'].map(normalizeTranslatorInputText)).size === 1) },
            { id: 'SYS-PUNCT-CENTRAL-WAVE', suite: 'unit', rule: 'Japanese wave delimiters are spaced in the central final punctuation pass', input: 'A。〜B〜', expected: 'A. ~B~', run: () => normalizeRule0OutputPunctuation('A。〜B〜') },
            { id: 'SYS-PUNCT-PAIRED-WAVE-WRAPPER-ASCII', suite: 'unit', rule: 'A terminal paired ASCII wave wrapper is tight around its enclosed subtitle while remaining separated from preceding title text', input: 'Title ~Subtitle~', expected: 'Title ~Subtitle~', run: () => normalizeRule0OutputPunctuation('Title ~Subtitle~') },
            { id: 'SYS-PUNCT-PAIRED-WAVE-WRAPPER-FULLWIDTH', suite: 'unit', rule: 'A terminal paired Japanese wave wrapper uses the same tight-inside layout after ASCII canonicalisation', input: 'Title 〜Subtitle〜', expected: 'Title ~Subtitle~', run: () => normalizeRule0OutputPunctuation('Title 〜Subtitle〜') },
            { id: 'SYS-PUNCT-PAIRED-WAVE-WHOLE-WRAPPER', suite: 'unit', rule: 'A paired wave wrapper around the whole expression has no artificial interior or exterior padding', input: '〜Subtitle〜', expected: '~Subtitle~', run: () => normalizeRule0OutputPunctuation('〜Subtitle〜') },
            { id: 'SYS-PUNCT-PAIRED-WAVE-NONTERMINAL-SEPARATORS', suite: 'unit', rule: 'Multiple non-terminal waves remain independent separators rather than being misclassified as a terminal wrapper', input: 'A〜B〜C', expected: 'A ~ B ~ C', run: () => normalizeRule0OutputPunctuation('A〜B〜C') },
            { id: 'SYS-PUNCT-PAIRED-WAVE-TRAILING-SENTENCE-PUNCT', suite: 'unit', rule: 'Sentence punctuation after a terminal paired wave wrapper does not reintroduce interior spaces', input: 'Title〜Subtitle〜。', expected: 'Title ~Subtitle~.', run: () => normalizeRule0OutputPunctuation('Title〜Subtitle〜。') },
            { id: 'SYS-PUNCT-PAIRED-HYPHEN-SOURCE-PROVENANCE', suite: 'unit', rule: 'A source-space-prefixed terminal hyphen subtitle wrapper remains separated from the title but tight around its subtitle', input: 'PSYREN -Sairen-', expected: 'PSYREN -Sairen-', run: () => normalizeRule0OutputPunctuation('PSYREN- Sairen-', 'PSYREN -サイレン-') },
            { id: 'SYS-PUNCT-WAVE-BEFORE-FULL-STOP', suite: 'unit', rule: 'Wave delimiter spacing must not leave padding before following punctuation', input: 'A〜。', expected: 'A ~.', run: () => normalizeRule0OutputPunctuation('A〜。') },
            { id: 'SYS-PUNCT-WAVE-BEFORE-COMMA', suite: 'unit', rule: 'Wave delimiter spacing must compose cleanly with a following comma', input: 'A～、B', expected: 'A ~, B', run: () => normalizeRule0OutputPunctuation('A～、B') },
            { id: 'R0-PUNCT-ELLIPSIS-SPACING', suite: 'unit', rule: 'Rule 0 punctuation does not leave a space before a Unicode ellipsis', input: 'A …', expected: 'A…', run: () => normalizeSentenceSpacing(normalizePunctuation('A …')) },
            { id: 'R0-KANA-YOON', suite: 'unit', rule: 'R0.5 small kana form one contracted unit', input: 'きょう', expected: 'kyou', run: () => convertToRomaji('きょう') },
            { id: 'R0-KANA-DI-YOON', suite: 'unit', rule: 'R0.5 contracted ぢゃ/ぢゅ/ぢょ use the same Hepburn ja/ju/jo forms as their modern equivalents', input: 'ぢゃ', expected: 'ja', run: () => convertToRomaji('ぢゃ') },
            { id: 'R0-KANA-LONG-MARK', suite: 'unit', rule: 'R0.3b ー repeats the preceding vowel', input: 'オー', expected: 'oo', run: () => convertToRomaji('オー') },
            { id: 'R0-PUNCT-QUOTES', suite: 'unit', rule: 'R0 punctuation uses English equivalents and spacing', input: 'Kore wa 「 Tesuto 」desu。', expected: 'Kore wa "Tesuto" desu.', run: () => normalizeSentenceSpacing(normalizePunctuation('Kore wa 「 Tesuto 」desu。')) },
            { id: 'R0-PUNCT-SINGLE-QUOTE-MARKERS', suite: 'unit', rule: 'Japanese corner quotes keep quote spacing separate from Romaji apostrophes', input: "『 Gen'ei 』desu。", expected: "'Gen'ei' desu.", run: () => restoreJapaneseSingleQuotes(normalizeSentenceSpacing(normalizePunctuation(markJapaneseSingleQuotes("『 Gen'ei 』desu。")))) },
            { id: 'SYS-PUNCT-COMMA-BETWEEN-SINGLE-QUOTED-TITLES', suite: 'unit', rule: 'A Japanese comma between adjacent Japanese single-quoted spans becomes an English comma followed by one external space', input: '『A』、『B』', expected: "'A', 'B'", run: () => normalizeRule0OutputPunctuation('『A』、『B』') },
            { id: 'R0-PUNCT-DASH', suite: 'unit', rule: 'R0 punctuation uses the English em dash for the Japanese horizontal bar', input: 'A―B', expected: 'A—B', run: () => normalizePunctuation('A―B') },
            { id: 'CHECK-PUNCT-SUBTITLE-BARS', suite: 'unit', rule: 'A paired terminal Japanese horizontal-bar subtitle delimiter receives English surrounding spaces in the final punctuation pass', input: 'Title―Subtitle―', expected: 'Title — Subtitle —', run: () => normalizeRule0OutputPunctuation('Title―Subtitle―') },
            { id: 'CHECK-PUNCT-SUBTITLE-BARS-LOWER-S', suite: 'unit', rule: 'Subtitle-bar spacing treats whitespace as whitespace and never consumes adjacent lowercase s characters', input: 'Chris―subtitle―', expected: 'Chris — subtitle —', run: () => normalizeRule0OutputPunctuation('Chris―subtitle―') },
            { id: 'CHECK-PUNCT-SUBTITLE-BARS-DOUBLE-S', suite: 'unit', rule: 'Subtitle-bar spacing preserves lowercase s characters on both sides of the delimiter', input: 'Bass―song―', expected: 'Bass — song —', run: () => normalizeRule0OutputPunctuation('Bass―song―') },
            { id: 'CHECK-PUNCT-SUBTITLE-BARS-TRAILING-SENTENCE', suite: 'unit', rule: 'Paired terminal Japanese subtitle bars remain terminal for spacing purposes when followed only by final sentence punctuation', input: 'Title―Subtitle―。', expected: 'Title — Subtitle —.', run: () => normalizeRule0OutputPunctuation('Title―Subtitle―。') },
            { id: 'CHECK-PUNCT-SUBTITLE-BARS-WAVE-BOUNDARY', suite: 'unit', rule: 'Paired terminal Japanese subtitle bars are evaluated independently on each canonical wave-delimited segment', input: 'Title―Subtitle―~Title―Subtitle―', expected: 'Title — Subtitle — ~ Title — Subtitle —', run: () => normalizeRule0OutputPunctuation('Title―Subtitle―~Title―Subtitle―') },
            { id: 'CHECK-PUNCT-SINGLE-BAR-GUARD', suite: 'unit', rule: 'An ordinary single Japanese horizontal bar remains a tight English em dash', input: 'A―B', expected: 'A—B', run: () => normalizeRule0OutputPunctuation('A―B') },
            { id: 'CHECK-PUNCT-NONTERMINAL-BAR-GUARD', suite: 'unit', rule: 'Two Japanese horizontal bars are not treated as subtitle delimiters when the second bar is non-terminal', input: 'A―B―C', expected: 'A—B—C', run: () => normalizeRule0OutputPunctuation('A―B―C') },
            { id: 'UI-KANJIDIC-DISPLAY-OKURIGANA', suite: 'unit', rule: 'Kanji Readings hides KANJIDIC okurigana metadata in visible labels', input: 'とど.ける', expected: 'Todokeru (とどける)', run: () => { const display = formatKanjiReadingForDisplay('とど.ける'); return `${display.romaji} (${display.kana})`; } },
            { id: 'UI-KANJIDIC-DISPLAY-AFFIX', suite: 'unit', rule: 'Kanji Readings hides KANJIDIC affix metadata in visible labels', input: '-とど.け', expected: 'Todoke (とどけ)', run: () => { const display = formatKanjiReadingForDisplay('-とど.け'); return `${display.romaji} (${display.kana})`; } },
            { id: 'UI-KANJIDIC-DISPLAY-DEDUP-IRU', suite: 'unit', rule: 'Kanji Readings hides duplicate buttons after display metadata is removed', input: 'い.る / -い.る / -い.り', expected: 'Iru (いる)|Iri (いり)', run: () => deduplicateKanjiReadingsForDisplay(['い.る', '-い.る', '-い.り']).map(reading => { const display = formatKanjiReadingForDisplay(reading); return `${display.romaji} (${display.kana})`; }).join('|') },
            { id: 'UI-KANJIDIC-DISPLAY-DEDUP-GYOU', suite: 'unit', rule: 'Kanji Readings collapses metadata variants with the same visible reading', input: '-ゆ.き / -ゆき / -い.き / -いき / おこな.う / おこ.なう', expected: 'Yuki (ゆき)|Iki (いき)|Okonau (おこなう)', run: () => deduplicateKanjiReadingsForDisplay(['-ゆ.き', '-ゆき', '-い.き', '-いき', 'おこな.う', 'おこ.なう']).map(reading => { const display = formatKanjiReadingForDisplay(reading); return `${display.romaji} (${display.kana})`; }).join('|') },
            { id: 'CHECK-HAN-SUPPLEMENTARY', suite: 'unit', rule: 'Kanji helper recognises supplementary-plane Han using Unicode Script=Han', input: '𠮷', expected: 'true', run: () => String(isHanCharacter('𠮷')) },
            { id: 'CHECK-HAN-DUPLICATE-POSITIONS', suite: 'unit', rule: 'Kanji helper retains each repeated Han occurrence with its own position', input: '日日', expected: '日@0|日@1', run: () => getHanOccurrences('日日').map(({ char, position }) => `${char}@${position}`).join('|') },
            { id: 'CHECK-HAN-UTF16-POSITIONS', suite: 'unit', rule: 'Kanji helper positions use UTF-16 indexes so supplementary Han does not shift later replacements', input: '𠮷日', expected: '𠮷@0|日@2', run: () => getHanOccurrences('𠮷日').map(({ char, position }) => `${char}@${position}`).join('|') },
            { id: 'CHECK-HAN-SECOND-REPLACEMENT', suite: 'unit', rule: 'Kanji helper replaces the selected occurrence rather than the first matching character', input: '日日 / second 日', expected: '日にち', run: () => replaceKanjiReadingAtPosition('日日', '日', 'にち', 1) },
            { id: 'VARIANT-NFKC-COMPAT', suite: 'unit', rule: 'Compatibility ideographs normalise for lookup only', input: '神', expected: '神', run: () => normalizeKanjiForLookup('神') },
            { id: 'VARIANT-IVS-LOOKUP', suite: 'unit', rule: 'Ideographic variation selectors are ignored for dictionary lookup only', input: '崎󠄀', expected: '崎', run: () => normalizeKanjiForLookup('崎\u{E0100}') },
            { id: 'CHECK-REGEX-REJECT-NESTED-QUANTIFIER', suite: 'unit', rule: 'Reviewed regexes reject unsafe unbounded repetition before compilation', input: '(a+)+$', expected: 'rejected', run: () => { try { compileReviewedPattern('(a+)+$', 'u'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-REGEX-ALLOW-REVIEWED-LOOKAHEAD', suite: 'unit', rule: 'The restricted validator keeps maintained lookahead and non-capturing reviewed patterns valid', input: '一人(?=$|[、。！？]|(?:の|が|は))', expected: 'accepted', run: () => { try { return compileReviewedPattern('一人(?=$|[、。！？]|(?:の|が|は))', 'u') instanceof RegExp ? 'accepted' : 'rejected'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-EXACT-OVERRIDE-REJECT-MACRON', suite: 'unit', rule: 'Exact override evidence follows Rule 0 Wāpuro long-vowel spelling rather than macrons', input: '東京 → Tōkyō', expected: 'rejected', run: () => { try { validateAssetSchema('exactOverrides', { 東京: 'Tōkyō' }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'DATA-SEMANTIC-READING-NORMALISE', suite: 'unit', rule: 'Semantic reading inputs are width-normalised and trimmed before storage', input: '　カオシュンえき　', expected: 'カオシュンえき', run: () => normalizeDictionaryReading('　カオシュンえき　') },
            { id: 'DATA-DUPLICATE-CONFLICT-REJECTED', suite: 'unit', rule: 'Conflicting duplicate single-value evidence is rejected instead of silently overwriting', input: 'duplicate conflict', expected: 'rejected', run: () => { const map = new Map(); setUniqueDictionaryEntry(map, 'x', 'A', 'test'); try { setUniqueDictionaryEntry(map, 'x', 'B', 'test'); } catch (_) { return 'rejected'; } return 'accepted'; } },
            { id: 'COMPOUND-MULTI-READING-NO-LAST-ROW-WINS', suite: 'unit', rule: 'Compound fallback never selects a reading merely because it was the last source row', input: '男: おとこ / おのこ', expected: '2:ambiguous', run: () => { const entry = runtimeState.compoundWordDictionary.get('男'); return `${entry?.readings?.length || 0}:${entry?.reading ? entry.reading : 'ambiguous'}`; } },
            { id: 'R0-KANA-SURFACE-PRIORITY', suite: 'unit', rule: 'R0.2/R0.3 written kana outranks pronunciation-normalised readings', input: 'とうきょう / トーキョー', expected: 'toukyou', run: () => convertToken({ surface_form: 'とうきょう', reading: 'トーキョー', pronunciation: 'トーキョー', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' }, 'とうきょう') },
            { id: 'R0-KANA-PRONUNCIATION-GUARD', suite: 'unit', rule: 'R0.2/R0.3 does not accept broader pronunciation normalisation that would erase the written kana sequence', input: 'こういう / コウイウ / コーユウ', expected: 'kouiu', run: () => convertToken({ surface_form: 'こういう', reading: 'コウイウ', pronunciation: 'コーユウ', pos: '連体詞', pos_detail_1: '*', pos_detail_2: '*' }, 'こういう') },
            { id: 'CHECK-IVS-HAN-STRIP', suite: 'unit', rule: 'Han variation selectors are stripped for lookup', input: '崎󠄀', expected: '崎', run: () => stripIdeographicVariationSelectors('崎\u{E0100}') },
            { id: 'CHECK-EMOJI-VS-PRESERVE', suite: 'unit', rule: 'Emoji variation selectors survive Japanese lookup normalisation', input: '☕️', expected: '☕️', run: () => stripIdeographicVariationSelectors('☕️') },
            { id: 'CHECK-LATIN-EMAIL', suite: 'engine', rule: 'Western inline e-mail identifiers survive unchanged', input: 'test@example.com', expected: 'test@example.com' },
            { id: 'CHECK-LATIN-AMPERSAND', suite: 'engine', rule: 'Western inline identifiers may contain ampersands', input: 'A&B', expected: 'A&B' },
            { id: 'CHECK-LATIN-HASH', suite: 'engine', rule: 'Western inline identifiers may contain hashes', input: 'A#B', expected: 'A#B' },
            { id: 'R0-SURFACE-SOKUON', suite: 'engine', rule: 'R0.4 written っ must survive the full pipeline', input: 'きっぷ', expected: 'Kippu' },
            { id: 'R0-PUNCT-SINGLE-QUOTE-TITLE', suite: 'engine', rule: 'Japanese 『』 becomes tight English single quotation marks without changing title spacing', input: '『新・世阿弥の鸚鵡返し、あゝ勘違いの神隠し。』', expected: "'Shin Zeami no Oumugaeshi, Aa Kanchigai no Kamigakushi.'" },
            { id: 'R0-PUNCT-SINGLE-QUOTE-APOSTROPHE', suite: 'engine', rule: 'Single quotation conversion must not alter an internal Rule 0 n-apostrophe', input: '『幻影』', expected: "'Gen'ei'" },
            { id: 'CHECK-DOUBLE-QUOTE-NORMAL', suite: 'engine', rule: 'Japanese double corner quotes convert tightly to English double quotation marks', input: '「猫」', expected: '"Neko"' },
            { id: 'CHECK-DOUBLE-QUOTE-MIXED-NESTING', suite: 'engine', rule: 'Mixed Japanese quote styles preserve opening and closing direction through spacing', input: '「『猫』」', expected: '"\'Neko\'"' },
            { id: 'CHECK-DOUBLE-QUOTE-SAME-NESTING', suite: 'engine', rule: 'Nested Japanese double corner quotes do not gain false spaces between adjacent quote marks', input: '「「猫」」', expected: '""Neko""' },
            { id: 'CHECK-DOUBLE-QUOTE-UNMATCHED-OPEN', suite: 'engine', rule: 'An unmatched Japanese opening double quote keeps opening-quote spacing semantics', input: '「猫', expected: '"Neko' },
            { id: 'CHECK-DOUBLE-QUOTE-UNMATCHED-CLOSE', suite: 'engine', rule: 'An unmatched Japanese closing double quote keeps closing-quote spacing semantics', input: '猫」', expected: 'Neko"' },
            { id: 'CHECK-ASCII-QUOTE-GUARD', suite: 'engine', rule: 'Literal ASCII double quotes retain their existing toggle-based spacing behaviour', input: '"猫"', expected: '"Neko"' },
            { id: 'CHECK-N-APOSTROPHE-GUARD', suite: 'engine', rule: 'Directional Japanese quote markers do not alter Rule 0 n-apostrophes', input: '幻影', expected: "Gen'ei" },
            { id: 'R0-N-APOSTROPHE-Y-WORD', suite: 'engine', rule: 'R0.6 ん before y takes an apostrophe inside an ordinary word', input: '翻訳家', expected: "Hon'yakuka" },
            { id: 'R0-INTEGRATION-APOSTROPHE-STRESS', suite: 'engine', rule: 'Rule 0 integration check for several independent n-apostrophe boundaries', input: '新鋭の翻訳家は原因を知らず、三人で深夜の学校へ向かった。', expected: "Shin'ei no Hon'yakuka wa Gen'in o Shirazu, Sannin de Shin'ya no Gakkou e Mukatta." },
            { id: 'R0-SURFACE-OU', suite: 'engine', rule: 'R0.2/R0.3 convert the written kana, not a normalised pronunciation', input: 'とうきょう', expected: 'Toukyou' },
            { id: 'R0-MIXED-MATAWA', suite: 'engine', rule: 'R0.7 lexical conjunction は pronunciation survives mixed-script spelling', input: '又は', expected: 'Matawa' },
            { id: 'R0-MIXED-MOSHIKUWA', suite: 'engine', rule: 'R0.7 lexical conjunction は pronunciation survives mixed-script spelling', input: '若しくは', expected: 'Moshikuwa' },
            { id: 'R0-GREETING-KONNICHIWA', suite: 'engine', rule: 'R0.7 established greeting pronunciation uses wa without changing the written kana rules generally', input: 'こんにちは', expected: 'Konnichiwa' },
            { id: 'R0-GREETING-KONBANWA', suite: 'engine', rule: 'R0.7 established greeting pronunciation uses wa without changing the written kana rules generally', input: 'こんばんは', expected: 'Konbanwa' },
            { id: 'R0-WORD-HE', suite: 'engine', rule: 'R0.7 ordinary へ remains he', input: 'へや', expected: 'Heya' },
            { id: 'R0-WORD-HA', suite: 'engine', rule: 'R0.7 ordinary は remains ha', input: 'はな', expected: 'Hana' },
            { id: 'CHECK-KAOHSIUNG-CONTEXT', suite: 'engine', rule: 'Reviewed Kaohsiung station evidence remains scoped inside a larger sentence', input: '高雄駅に行く', expected: 'Kaohsiung Eki ni Iku' },
            { id: 'CHECK-CHUN-LI-CONTEXT', suite: 'engine', rule: 'Reviewed Chun-Li evidence remains scoped inside a larger sentence', input: '春麗と戦う', expected: 'Chun-Li to Tatakau' },
            { id: 'R0-PUNCT-WAVE-TITLE', suite: 'engine', rule: 'Rule 0 punctuation converts ～ to ~ while preserving surrounding title spacing', input: '無職転生 ～異世界行ったら本気だす～', expected: 'Mushoku Tensei ~Isekai Ittara Honki Dasu~' },
            { id: 'SYS-PUNCT-EDEN-PAIRED-WAVE-WRAPPER', suite: 'engine', rule: 'A mixed-script subtitle enclosed by paired Japanese waves remains tight to the converted ASCII wrapper and separated once from the main title', input: "EDEN 〜It's an Endless World!〜", expected: "EDEN ~It's an Endless World!~", expectedRequiresReview: false },
            { id: 'SYS-PUNCT-PSYREN-PAIRED-HYPHEN-WRAPPER', suite: 'engine', rule: 'A source-space-prefixed terminal ASCII hyphen subtitle wrapper preserves one external title boundary and no artificial interior padding', input: 'PSYREN -サイレン-', expected: 'PSYREN -Sairen-', expectedRequiresReview: false },
            { id: 'SYS-PUNCT-WAVE-NFKC-PROVENANCE', suite: 'engine', rule: 'Full-width ～ retains delimiter spacing even though input width normalisation would otherwise collapse it to ASCII', input: '学校～切手', expected: 'Gakkou ~ Kitte' },
            { id: 'SYS-PUNCT-WAVE-ASCII-CONSISTENCY', suite: 'engine', rule: 'ASCII ~ uses the same final delimiter spacing as Japanese wave marks', input: '学校~切手', expected: 'Gakkou ~ Kitte' },
            { id: 'DIFF-NUKERU', suite: 'engine', rule: 'Reviewed lexical evidence prevents a false Kanji-plus-okurigana reading', input: '脱ける', expected: 'Nukeru' },
            { id: 'DIFF-KOUKUUGAISHA', suite: 'engine', rule: 'Reviewed compound evidence preserves rendaku in 航空会社', input: '航空会社', expected: 'Koukuugaisha' },
            { id: 'DIFF-CHOUME', suite: 'engine', rule: 'Reviewed address-term evidence corrects a false individual-Kanji reading', input: '丁目', expected: 'Choume' },
            { id: 'RENDAKU-KAKUGARI', suite: 'engine', rule: 'Attested NINJAL Rendaku evidence supplies the complete reading before romanisation', input: '角刈り', expected: 'Kakugari' },
            { id: 'RENDAKU-KUSAKARI', suite: 'engine', rule: 'Attested negative Rendaku evidence must preserve an unvoiced compound reading', input: '草刈り', expected: 'Kusakari' },
            { id: 'RENDAKU-TORAGARI', suite: 'engine', rule: 'Attested NINJAL Rendaku evidence supplies the voiced compound reading', input: '虎刈り', expected: 'Toragari' },
            { id: 'RENDAKU-AJITSUKE', suite: 'engine', rule: 'Attested negative Rendaku evidence prevents a blanket voicing rule', input: '味付け', expected: 'Ajitsuke' },
            { id: 'RENDAKU-KUGIZUKE', suite: 'engine', rule: 'Attested NINJAL Rendaku evidence supplies the voiced 付け reading', input: '釘付け', expected: 'Kugizuke' },
            { id: 'STRESS-KANA-SOKUON-ECCHI', suite: 'engine', rule: 'Adversarial repair: sokuon survives the full pipeline in kana-only lexical input', input: 'えっち', expected: 'Ecchi' },
            { id: 'SYS-KATAKANA-VU-ENGINE', suite: 'engine', rule: 'Modern Katakana ヴ remains in Japanese kana scope through the full translation pipeline while independent source-spelling review remains intact', input: 'ヴ', expected: 'Vu', expectedRequiresReview: true },
            { id: 'MECH-KANA-KENTURIA', suite: 'engine', rule: 'Extended Kana トゥ remains mechanically romanisable in a complete Katakana word; source-language spelling uncertainty is review metadata, not [Unresolved]', input: 'ケントゥリア', expected: 'Kenturia', expectedRequiresReview: true },
            { id: 'SYS-N-KANA-LEXICAL-KYAKKAN', suite: 'engine', rule: 'Evidence-backed kana recovery preserves a final syllabic ん after sokuon/yoon', input: 'きゃっかん', expected: 'Kyakkan' },
            { id: 'SYS-N-GUARD-CONSONANT', suite: 'engine', rule: 'The systemic ん fix does not introduce an apostrophe before consonants', input: 'しんぶん', expected: 'Shinbun' },
            { id: 'R0-TSU-VS-SOKUON-ENGINE', suite: 'engine', rule: 'Modern full-size つ remains tsu while small っ doubles the following consonant', input: 'まつ まって', expected: 'Matsu Matte' },
            { id: 'R0-SOKUON-EMPHATIC-MEDIAL', suite: 'engine', rule: 'Colloquial emphatic medial sokuon remains a normal doubled consonant when the written following consonant is clear', input: 'すっごい', expected: 'Suggoi' },
            { id: 'R0-SOKUON-INITIAL-COLLOQUIAL', suite: 'engine', rule: 'A colloquial form beginning with っ still doubles a valid following consonant', input: 'っす', expected: 'ssu' },
            { id: 'R0-SOKUON-HALFWIDTH', suite: 'engine', rule: 'Half-width ｯ is normalised before ordinary sokuon processing', input: 'ｯｶ', expected: 'Kka', expectedRequiresReview: true },
            { id: 'STRESS-LATIN-SLASH', suite: 'engine', rule: 'Existing Latin title spelling with a slash passes through unchanged', input: 'Fate/stay night', expected: 'Fate/stay night' },
            { id: 'STRESS-LATIN-ORDINAL', suite: 'engine', rule: 'Existing Latin ordinal casing passes through unchanged', input: '2nd Season', expected: '2nd Season' },
            { id: 'TITLE-READING-CONTEXT-OCCURRENCE', suite: 'engine', rule: 'Scoped title-reading evidence applies only to the occurrence inside its matching title context', input: '空の境界 空', expected: 'Kara no Kyoukai Sora' },
            { id: 'TITLE-YOFUKASHI-NO-UTA', suite: 'engine', rule: 'Scoped title-boundary evidence repairs the particle の boundary after よふかし kana lexical rescue', input: 'よふかしのうた', expected: 'Yofukashi no Uta', expectedRequiresReview: false },
            { id: 'TITLE-KOUKAKU-KIDOUTAI', suite: 'engine', rule: 'Scoped title reading resolves only 攻殻 as Koukaku and leaves 機動隊 to ordinary lexical evidence', input: '攻殻機動隊', expected: 'Koukaku Kidoutai', expectedRequiresReview: false },
            { id: 'TITLE-JUUNI-KOKUKI', suite: 'engine', rule: 'Scoped title lexical-boundary evidence preserves Juuni Kokuki without a whole-input bypass', input: '十二国記', expected: 'Juuni Kokuki', expectedRequiresReview: false },
            { id: 'TITLE-URUSEI-YATSURA', suite: 'engine', rule: 'Scoped title gikun resolves うる星 as Urusei while ordinary lexical evidence supplies やつら', input: 'うる星やつら', expected: 'Urusei Yatsura', expectedRequiresReview: false },
            { id: 'TITLE-TASOGARE-AMNESIA-SEPARATOR', suite: 'engine', rule: 'Scoped title-separator evidence renders × as lowercase x with lexical spacing instead of punctuation concatenation', input: '黄昏乙女×アムネジア', expected: 'Tasogare Otome x Amnesia', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-AOHARU-CROSS-SILENT', suite: 'engine', rule: 'Reviewed title evidence follows the official 青春×機関銃 reading and treats × as an unspoken separator rather than kakeru', input: '青春×機関銃', expected: 'Aoharu Kikanjuu', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-3X3-EYES-SPACED', suite: 'engine', rule: 'Reviewed mixed-script title evidence resolves 3×3 EYES as Sazan Eyes; × is not interpreted compositionally as kakeru', input: '3×3 EYES', expected: 'Sazan Eyes', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-3X3-EYES-COMPACT', suite: 'engine', rule: 'The official compact 3×3EYES presentation uses the same reviewed Sazan Eyes title reading', input: '3×3EYES', expected: 'Sazan Eyes', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-WAVE-BOUNDARY', suite: 'engine', rule: 'A canonical wave boundary between two reviewed mixed-script title spans must remain independent so Latin passthrough cannot swallow either title-evidence span', input: '3×3 EYES~3×3 EYES', expected: 'Sazan Eyes ~ Sazan Eyes', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-UNREVIEWED-CROSS-PRESERVED', suite: 'engine', rule: 'Without reviewed title/context evidence, × is preserved as notation instead of being guessed as kakeru', input: '猫×犬', expected: 'Neko×Inu', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-NUMERIC-CROSS-PRESERVED', suite: 'engine', rule: 'A bare multiplication/cross notation is preserved mechanically and remains reviewable rather than becoming a spoken Japanese word', input: '3×4', expected: '3×4', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-LATIN-CROSS-PRESERVED', suite: 'engine', rule: 'Mixed Latin notation containing × is preserved exactly and marked for review when no title evidence establishes a rendering', input: 'A×B', expected: 'A×B', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-CROSS-CANONICAL-BOUNDARY', suite: 'unit', rule: '× is a canonical boundary symbol so Kuromoji can never make its カケル reading authoritative', input: '3×4', expected: '3|×|4:true', run: () => { const tokens = stabilizeHardBoundaryTokenization(runtimeState.tokenizer.tokenize('3×4'), '3×4'); return `${tokens.map(token => token.surface_form).join('|')}:${Boolean(tokens.find(token => token.surface_form === '×')?.crossNotationSymbol)}`; } },
            { id: 'MECH-MIXED-SCRIPT-AOHARU-SILENT-SEPARATOR-EVIDENCE', suite: 'unit', rule: 'The silent × behaviour in 青春×機関銃 is explicit reviewed title evidence rather than a global symbol rule', input: '青春×機関銃', expected: 'title-separator-silent:true', run: () => { const rule = (runtimeState.titleReadingDictionary.get('×') || []).find(item => item.kind === 'title-separator-silent' && item.pattern.test('青春×機関銃')); return `${rule?.kind || ''}:${rule?.romaji === ''}`; } },
            { id: 'MECH-MIXED-SCRIPT-UNREVIEWED-CROSS-AUDIT', suite: 'unit', rule: 'Preserved × notation carries an explicit mixed-script review signal when no reviewed title/context evidence settles its role', input: 'A×B', expected: 'A×B:unreviewed-cross-notation:true', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('A×B'); const audit = runtimeState.lastTranslationDiagnostics; return `${output}:${audit?.redFlags?.find(item => item.flag === 'unreviewed-cross-notation')?.flag || ''}:${Boolean(audit?.requiresReview)}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'TITLE-GIKUN-KOISURU-ASTEROID', suite: 'engine', rule: 'Scoped title-reading evidence preserves the explicit 小惑星（アステロイド） reading without a generic override', input: '恋する小惑星', expected: 'Koisuru Asteroid' },
            { id: 'TITLE-GIKUN-AO-EXORCIST', suite: 'engine', rule: 'Scoped title-reading evidence preserves 祓魔師 as Exorcist without leaking into ordinary lexical contexts', input: '青の祓魔師', expected: 'Ao no Exorcist' },
            { id: 'TITLE-GIKUN-INDEX', suite: 'engine', rule: 'Scoped title-reading evidence preserves 禁書目録 as Index without a generic contextual override', input: 'とある魔術の禁書目録', expected: 'Toaru Majutsu no Index' },
            { id: 'TITLE-GIKUN-HEROINE', suite: 'engine', rule: 'Scoped gikun evidence preserves the title reading 彼女→Heroine while ordinary 彼女 remains Kanojo', input: '冴えない彼女の育てかた', expected: 'Saenai Heroine no Sodatekata' },
            { id: 'TITLE-GIKUN-BISQUE-DOLL', suite: 'engine', rule: 'Scoped gikun evidence preserves 着せ替え人形→Bisque Doll inside the reviewed title', input: 'その着せ替え人形は恋をする', expected: 'Sono Bisque Doll wa Koi o Suru' },
            { id: 'TITLE-OFFICIAL-FRIEREN', suite: 'engine', rule: 'Reviewed official-spelling evidence preserves Frieren after whole-sentence tokenisation', input: '葬送のフリーレン', expected: 'Sousou no Frieren' },
            { id: 'TITLE-OFFICIAL-GRIMGAR', suite: 'engine', rule: 'Reviewed official-spelling evidence preserves Grimgar after whole-sentence tokenisation', input: '灰と幻想のグリムガル', expected: 'Hai to Gensou no Grimgar' },
            { id: 'TITLE-OFFICIAL-WISTORIA', suite: 'engine', rule: 'Title-reading and official-spelling evidence jointly preserve Tsurugi and Wistoria without generic overrides', input: '杖と剣のウィストリア', expected: 'Tsue to Tsurugi no Wistoria' },
            { id: 'TITLE-GIKUN-NONLEAK-HEROINE', suite: 'engine', rule: 'Title-specific 彼女→Heroine evidence does not alter ordinary 彼女', input: '彼女は学生です', expected: 'Kanojo wa Gakusei desu' },
            { id: 'TITLE-GIKUN-NONLEAK-SORA', suite: 'engine', rule: 'Title-specific 宇宙→Sora evidence does not alter ordinary 宇宙', input: '宇宙へ行く', expected: 'Uchuu e Iku' },
            { id: 'TITLE-READING-NONLEAK-TSURUGI', suite: 'engine', rule: 'Title-specific 剣→Tsurugi evidence does not alter ordinary 剣', input: '剣を持つ', expected: 'Ken o Motsu' },
            { id: 'TITLE-MACHIKADO-MAZOKU', suite: 'engine', rule: 'Ordinary kana lexical evidence keeps まぞく whole while the reviewed mixed-script まちカド span remains intact', input: 'まちカドまぞく', expected: 'Machikado Mazoku', expectedRequiresReview: false },
            { id: 'CHECK-KEMONOTACHI', suite: 'engine', rule: 'Context-scoped lexical evidence preserves 獣たち as Kemonotachi while weak dictionary multiplicity on contextual 神 is superseded at final review', input: 'かつて神だった獣たちへ', expected: 'Katsute Kami Datta Kemonotachi e', expectedRequiresReview: false },
            { id: 'TITLE-INUBOKU', suite: 'engine', rule: 'Scoped title gikun/spelling evidence resolves 妖狐×僕 as Inu x Boku after whole-sentence tokenisation', input: '妖狐×僕SS', expected: 'Inu x Boku SS', expectedRequiresReview: false },
            { id: 'CHECK-TORADORA', suite: 'engine', rule: 'Scoped title lexical-boundary evidence preserves Toradora as one coined title word', input: 'とらドラ！', expected: 'Toradora!', expectedRequiresReview: false },
            { id: 'TITLE-NATSUYUKI', suite: 'engine', rule: 'Scoped title compound evidence resolves 夏雪 as Natsuyuki while ordinary loanword evidence supplies Rendezvous', input: '夏雪ランデブー', expected: 'Natsuyuki Rendezvous', expectedRequiresReview: false },
            { id: 'TITLE-TOKYO-GHOUL', suite: 'engine', rule: 'Scoped official title evidence preserves Tokyo Ghoul without bypassing whole-sentence tokenisation', input: '東京喰種', expected: 'Tokyo Ghoul', expectedRequiresReview: false },
            { id: 'TITLE-GIKUN-RAILGUN', suite: 'engine', rule: 'Scoped gikun evidence resolves 超電磁砲 as Railgun after whole-sentence tokenisation rather than through an exact override', input: 'とある科学の超電磁砲', expected: 'Toaru Kagaku no Railgun', expectedRequiresReview: false },
            { id: 'TITLE-ITERATION-MAJO-TABITABI', suite: 'engine', rule: 'Scoped title evidence resolves 旅々 as Tabitabi after whole-sentence tokenisation rather than bypassing the pipeline', input: '魔女の旅々', expected: 'Majo no Tabitabi' },
            { id: 'TITLE-LYCORIS-RECOIL', suite: 'engine', rule: 'Scoped official title-spelling evidence preserves Lycoris Recoil after whole-sentence tokenisation', input: 'リコリス・リコイル', expected: 'Lycoris Recoil', expectedRequiresReview: false },
            { id: 'TITLE-SUMMER-TIME-RENDERING', suite: 'engine', rule: 'Scoped official title-spelling evidence preserves Summer Time Rendering after whole-sentence tokenisation', input: 'サマータイムレンダ', expected: 'Summer Time Rendering', expectedRequiresReview: false },
            { id: 'TITLE-UNDER-NINJA', suite: 'engine', rule: 'Scoped official title-spelling evidence preserves Under Ninja after whole-sentence tokenisation', input: 'アンダーニンジャ', expected: 'Under Ninja', expectedRequiresReview: false },
            { id: 'TITLE-DURARARA', suite: 'engine', rule: 'Scoped coined-title spelling evidence preserves Durarara after whole-sentence tokenisation', input: 'デュラララ!!', expected: 'Durarara!!', expectedRequiresReview: false },
            { id: 'TITLE-SHIKANOKO', suite: 'engine', rule: 'Scoped title-boundary evidence preserves the reviewed all-kana lexical segmentation without a whole-input bypass', input: 'しかのこのこのここしたんたん', expected: 'Shikanoko Nokonoko Koshitantan', expectedRequiresReview: false },
            { id: 'TITLE-NON-NON-BIYORI', suite: 'engine', rule: 'Scoped title-boundary evidence preserves Non Non while ordinary kana output resolves Biyori through the normal pipeline', input: 'のんのんびより', expected: 'Non Non Biyori', expectedRequiresReview: false }
        ];
    }

    function getTokenisationAndMergingRegressionChecks() {
        return [
            { id: 'MECH-TOKENISATION-SOURCE-SPAN-OFFSETS', suite: 'unit', rule: 'Every token remains traceable to its original continuous Japanese source offsets', input: 'ぼん / の / うじ', expected: '0-2|2-3|3-5', run: () => attachSourceTokenSpans([{ surface_form: 'ぼん' }, { surface_form: 'の' }, { surface_form: 'うじ' }], 'ぼんのうじ').map(token => `${token.sourceStart}-${token.sourceEnd}`).join('|') },
            { id: 'MECH-TOKENISATION-SOURCE-SPAN-CROSS-TOKEN-LEXICAL', suite: 'unit', rule: 'Source-span reconciliation may neutralise a false particle boundary across any number of Kuromoji tokens before reading resolution', input: 'ぼん / の / うじ', expected: 'ぼんのうじ', run: () => { const tokens = attachSourceTokenSpans([{ surface_form: 'ぼん', pos: '名詞', pos_detail_1: '一般', reading: 'ボン' }, { surface_form: 'の', pos: '助詞', pos_detail_1: '連体化', reading: 'ノ' }, { surface_form: 'うじ', pos: '名詞', pos_detail_1: '一般', reading: 'ウジ' }], 'ぼんのうじ'); return reconcileKanaSourceTokenBoundaries(tokens, 'ぼんのうじ').map(token => token.surface_form).join('|'); } },
            { id: 'MECH-GRAMMAR-SURFACE-PARTICLE-GUARD', suite: 'unit', rule: 'A kana surface matching a particle is not grammatical merely because that spelling exists in the particle table', input: 'の as ordinary noun token', expected: 'false', run: () => String(isParticle({ surface_form: 'の', pos: '名詞', pos_detail_1: '一般' })) },
            { id: 'MECH-TOKENISATION-LEXICAL-NO-BONNOUJI', suite: 'engine', rule: 'A lexical の exposed by Kuromoji inside continuous kana does not create a particle boundary', input: 'ぼんのうじ', expected: 'Bonnouji', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-GENUINE-NO-MARI', suite: 'engine', rule: 'A syntactically supported の remains grammatical while adjacent kana lexical evidence cannot manufacture the segmentation', input: 'ぼくは麻理のなか', expected: 'Boku wa Mari no Naka', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-ROKUNIN', suite: 'engine', rule: 'A false Kuromoji split before final ん is output-neutral inside a lexical kana span', input: '十字架のろくにん', expected: 'Juujika no Rokunin', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-YOTSUBA-GUARD', suite: 'unit', rule: 'Kuromoji splitting よつばと into particle-like fragments cannot reproduce the known broken yo Tsuba to output', input: 'よつばと!', expected: 'true', run: () => String(translateText('よつばと!') !== 'yo Tsuba to!' && translateText('よつばと!') !== 'Yo Tsuba to!') },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-KORETTO', suite: 'engine', rule: 'A genuine に particle remains grammatical and cannot be consumed by kana lexical evidence for にし', input: 'コレットは死ぬことにした', expected: 'Koretto wa Shinu Koto ni Shita', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-HIRUNAKA', suite: 'engine', rule: 'A Kuromoji boundary inside a continuous kana lexical word does not introduce a space or capitalisation', input: 'ひるなかの流星', expected: 'Hirunaka no Ryuusei', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-AUDIT-SOURCE-SPAN', suite: 'unit', rule: 'Translation audit retains the reconciled token source range so the final reading remains traceable to the original Japanese span', input: 'ぼんのうじ', expected: '0:5:ぼんのうじ', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; translateText('ぼんのうじ'); const item = runtimeState.lastTranslationDiagnostics?.readings?.find(reading => reading.surface === 'ぼんのうじ'); return `${item?.sourceStart}:${item?.sourceEnd}:${item?.sourceSurface || ''}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'CHECK-KANA-BOUNDARY-BAKUMAN-REVIEWED-EVIDENCE', suite: 'engine', rule: 'Reviewed exact-title evidence supersedes an otherwise unreviewed contiguous Katakana tokenizer boundary', input: 'バクマン。', expected: 'Bakuman.', expectedRequiresReview: false },
            { id: 'CHECK-KANA-BOUNDARY-BAKUMAN-SIGNAL-SUPERSEDED', suite: 'unit', rule: 'Reviewed exact-title evidence prevents the earlier tokenizer-boundary uncertainty from remaining final-active', input: 'バクマン', expected: 'false', run: () => String(Boolean(runTranslatorReadingAudit('バクマン').redFlags.find(item => item.flag === 'kana-tokenisation-boundary-unreviewed' && item.state === 'final-active'))) },
            { id: 'CHECK-KANA-BOUNDARY-ANPANMAN-REVIEW', suite: 'engine', rule: 'A contiguous Katakana noun span split only by Kuromoji remains output-compatible but requires review until a lexical boundary is independently established', input: 'アンパンマン', expected: 'Anpan Man', expectedRequiresReview: true },
            { id: 'CHECK-KANA-BOUNDARY-ANPANMAN-SIGNAL', suite: 'unit', rule: 'A silent contiguous Katakana tokenizer split remains an explicit final-active boundary-review signal when no reviewed evidence resolves it', input: 'アンパンマン', expected: 'final-active:true', run: () => { const signal = runTranslatorReadingAudit('アンパンマン').redFlags.find(item => item.flag === 'kana-tokenisation-boundary-unreviewed'); return `${signal?.state || ''}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'CHECK-KANA-BOUNDARY-REVIEWED-LOANWORD-CONTROL', suite: 'engine', rule: 'Reviewed source-language loanword evidence remains authoritative and is not reclassified as an unreviewed tokenizer boundary', input: 'チェンソーマン', expected: 'Chainsaw Man', expectedRequiresReview: false },
            { id: 'CHECK-KANA-BOUNDARY-EXPLICIT-SPACE-CONTROL', suite: 'engine', rule: 'An explicit source-space boundary remains a deliberate output boundary rather than a contiguous-Katakana uncertainty', input: 'バク マン', expected: 'Baku Man', expectedRequiresReview: false },
            { id: 'SYS-TOKENIZER-CANONICAL-WAVE-HARD-BOUNDARY', suite: 'unit', rule: 'Canonical ~ is reclassified as a hard symbol boundary after the whole-sentence Kuromoji pass', input: '~', expected: '記号:boundary', run: () => { const token = classifyCanonicalBoundaryTokens([{ surface_form: '~', pos: '名詞', pos_detail_1: '一般', reading: '~', pronunciation: '~' }])[0]; return `${token.pos}:${token.canonicalBoundary ? 'boundary' : 'ordinary'}`; } },
            { id: 'ADV-WAVE-DASH-ITTEIRU-BOUNDARY', suite: 'engine', rule: 'Wave-dash cannot change the reading of an identical phrase across the delimiter', input: '行っている〜行っている', expected: 'Itte iru ~ Itte iru' },
            { id: 'ADV-FULLWIDTH-WAVE-ITTEIRU-BOUNDARY', suite: 'engine', rule: 'Fullwidth tilde uses the same hard-boundary reading behaviour', input: '行っている～行っている', expected: 'Itte iru ~ Itte iru' },
            { id: 'ADV-ASCII-WAVE-ITTEIRU-BOUNDARY', suite: 'engine', rule: 'ASCII tilde uses the same hard-boundary reading behaviour', input: '行っている~行っている', expected: 'Itte iru ~ Itte iru' },
            { id: 'ADV-KANA-NIHON-WHOLE-WORD', suite: 'engine', rule: 'A written kana reading with merge-safe whole-word evidence stays one lexical output unit', input: 'にほん', expected: 'Nihon' },
            { id: 'ADV-KANA-NIPPON-WHOLE-WORD', suite: 'engine', rule: 'Alternative written kana evidence remains safe when the kana itself identifies the reading', input: 'にっぽん', expected: 'Nippon' },
            { id: 'SYS-N-BOUNDARY-VOWEL', suite: 'unit', rule: 'The shared syllabic-ん boundary rule inserts an apostrophe before vowel-initial readings', input: 'せん + えん', expected: 'true', run: () => String(needsSyllabicNApostrophe('せん', 'えん')) },
            { id: 'SYS-N-BOUNDARY-Y', suite: 'unit', rule: 'The shared syllabic-ん boundary rule inserts an apostrophe before y-initial readings', input: 'しん + よう', expected: 'true', run: () => String(needsSyllabicNApostrophe('しん', 'よう')) },
            { id: 'SYS-N-BOUNDARY-CONSONANT', suite: 'unit', rule: 'The shared syllabic-ん boundary rule does not insert an apostrophe before consonants', input: 'しん + ぶん', expected: 'false', run: () => String(needsSyllabicNApostrophe('しん', 'ぶん')) },
            { id: 'SYS-PUNCT-CENTRAL-WAVE-QUOTE', suite: 'unit', rule: 'Wave delimiter spacing respects an enclosing Japanese quote boundary', input: '『A〜』', expected: "'A ~'", run: () => normalizeRule0OutputPunctuation('『A〜』') },
            { id: 'VARIANT-GENERAL-KYUJITAI', suite: 'unit', rule: 'Japanese old forms can consult modern whole-word evidence', input: '國際', expected: '国際', run: () => normalizeKanjiForLookup('國際') },
            { id: 'PERF-COMMON-WORD-PREFIX', suite: 'unit', rule: 'Common-word span scans stop when no dictionary prefix remains possible', input: 'common-word prefix index', expected: 'indexed', run: () => { const surface = [...runtimeState.commonWordDictionary.keys()].find(value => Array.from(value).length > 1); return surface && runtimeState.commonWordPrefixes.has(Array.from(surface)[0]) ? 'indexed' : 'missing'; } },
            { id: 'CHECK-LONG-KUROMOJI-RESCUE-9', suite: 'unit', rule: 'Exact Kuromoji rescue is dictionary-prefix bounded rather than capped at eight tokens', input: '9-token exact lexical rescue', expected: '9', run: () => { const original = runtimeState.tokenizer; const surface = 'あいうえおかきくけ'; const tokens = Array.from(surface).map(value => ({ surface_form: value, pos: '名詞', pos_detail_1: '一般' })); try { runtimeState.tokenizer = { viterbi_builder: { trie: { lookup: value => value === surface ? 7 : -1, commonPrefixSearch: value => value.startsWith(surface) ? [{ k: surface, v: 7 }] : [] } }, token_info_dictionary: { target_map: { 7: [1] }, getFeatures: () => `${surface},連体詞,*,*,*,*,*,${surface},${surface},${surface}` } }; return String(findLongestExactDictionaryRescue(tokens, 0, surface)?.length || 0); } finally { runtimeState.tokenizer = original; } } },
            { id: 'CHECK-LONG-AUTHORITATIVE-SPAN-13', suite: 'unit', rule: 'Authoritative spans terminate on their prefix index rather than a twelve-token ceiling', input: '13-token authoritative span', expected: '13', run: () => { const originalDictionary = runtimeState.authoritativeSpanDictionary; const originalPrefixes = runtimeState.authoritativeSpanPrefixes; const surface = '亜亜亜亜亜亜亜亜亜亜亜亜亜'; const tokens = Array.from(surface).map(value => ({ surface_form: value, pos: '名詞', reading: '*' })); try { runtimeState.authoritativeSpanDictionary = new Map([[surface, { reading: 'あ', source: 'qa', confidence: 1, priority: 100, category: 'ateji' }]]); runtimeState.authoritativeSpanPrefixes = new Set(); addSurfacePrefixes(runtimeState.authoritativeSpanPrefixes, surface); return String(findLongestAuthoritativeSpan(tokens, 0)?.length || 0); } finally { runtimeState.authoritativeSpanDictionary = originalDictionary; runtimeState.authoritativeSpanPrefixes = originalPrefixes; } } },
            { id: 'SRC-GENERAL-WORD-BANK-LOADED', suite: 'unit', rule: 'General whole-word evidence is loaded as a substantial fallback bank without replacing reviewed sources', input: 'general-word bank', expected: 'true', run: () => String(runtimeState.generalWordDictionary.size > 10000) },
            { id: 'SRC-GENERAL-WORD-UNIQUE-FALLBACK', suite: 'unit', rule: 'Rule 0 may use a high-priority complete-word reading when Kuromoji supplies no reading', input: '大人 / no Kuromoji reading', expected: 'おとな', run: () => normalizeKanaReading(resolveGeneralWordFallback({ surface_form: '大人', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' })?.reading || '') },
            { id: 'R0-GENERAL-WORD-SINGLE-TOKEN-AUTHORITY', suite: 'engine', rule: 'Single-reading whole-word evidence rescues an unresolved single Kuromoji token', input: '且', expected: 'Katsu' },
            { id: 'R0-GENERAL-WORD-ITERATION-MARK-AUTHORITY', suite: 'engine', rule: 'Evidence-backed iteration marks remain inside an authoritative whole-word span', input: '各々', expected: 'Onoono' },
            { id: 'R0-GENERAL-WORD-SHIME-AUTHORITY', suite: 'engine', rule: 'An evidence-backed 〆 token may continue an authoritative whole-word span', input: '〆切る', expected: 'Shimekiru' },
            { id: 'R0-GENERAL-WORD-SUPPLEMENTARY-HAN-AUTHORITY', suite: 'engine', rule: 'Supplementary Han inside single-reading whole-word evidence does not fall through unresolved', input: '𠮟る', expected: 'Shikaru' },
            { id: 'SRC-GENERAL-WORD-KUROMOJI-WINS', suite: 'unit', rule: 'A valid context-selected Kuromoji reading remains authoritative while matching general-word evidence records corroboration', input: '今日 / コンニチ', expected: 'kuromoji+general-word', run: () => resolveTokenReading({ surface_form: '今日', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: 'コンニチ', pronunciation: 'コンニチ' }, '今日').source },
            { id: 'SRC-GENERAL-WORD-SPAN-FALLBACK', suite: 'unit', rule: 'A merge-safe whole-word reading may repair a bad Kuromoji split even when each fragment has a reading', input: '十二 / split readings', expected: '十二:じゅうに', run: () => { const merged = mergeGeneralWordTokens([{ surface_form: '十', pos: '名詞', pos_detail_1: '一般', reading: 'ジュウ' }, { surface_form: '二', pos: '名詞', pos_detail_1: '一般', reading: 'ニ' }]); return `${merged[0]?.surface_form || ''}:${merged[0]?.generalWordReading || ''}`; } },
            { id: 'UNRESOLVED-RANKED-MERGESAFE-AMBIGUOUS', suite: 'unit', rule: 'A merge-safe ambiguous general-word span may use its top-ranked attested reading provisionally while retaining ambiguity for review', input: '凉 + 風', expected: '凉風:りょうふう:ambiguous', run: () => { const merged = mergeGeneralWordTokens([{ surface_form: '凉', pos: '名詞', pos_detail_1: '一般', reading: '*' }, { surface_form: '風', pos: '名詞', pos_detail_1: '一般', reading: 'フウ' }], '凉風'); return `${merged[0]?.surface_form || ''}:${normalizeKanaReading(merged[0]?.generalWordReading || '')}:${merged[0]?.generalWordAmbiguous ? 'ambiguous' : 'resolved'}`; } },
            { id: 'UNRESOLVED-RANKED-WHOLE-INPUT-NONMERGESAFE', suite: 'unit', rule: 'A non-merge-safe ambiguous lexeme may be rescued only when the reviewed general-word surface exactly covers the whole input', input: '剝 + す / whole input', expected: '剝す:はがす:ambiguous', run: () => { const merged = mergeGeneralWordTokens([{ surface_form: '剝', pos: '名詞', pos_detail_1: '固有名詞', reading: '*' }, { surface_form: 'す', pos: '助動詞', pos_detail_1: '*', reading: 'ス' }], '剝す'); return `${merged[0]?.surface_form || ''}:${normalizeKanaReading(merged[0]?.generalWordReading || '')}:${merged[0]?.generalWordAmbiguous ? 'ambiguous' : 'resolved'}`; } },
            { id: 'UNRESOLVED-RANKED-WHOLE-INPUT-NONLEAK', suite: 'unit', rule: 'Whole-input fallback permission does not turn a non-merge-safe general word into an internal substring merge inside a larger source', input: '剝 + す + 猫 / 剝す猫', expected: '剝|す|猫', run: () => mergeGeneralWordTokens([{ surface_form: '剝', pos: '名詞', pos_detail_1: '固有名詞', reading: '*' }, { surface_form: 'す', pos: '助動詞', pos_detail_1: '*', reading: 'ス' }, { surface_form: '猫', pos: '名詞', pos_detail_1: '一般', reading: 'ネコ' }], '剝す猫').map(token => token.surface_form).join('|') },
            { id: 'READING-RESOLUTION-COMPOUND-FALLBACK', suite: 'unit', rule: 'Rule 0 uses attested whole-word evidence before individual-Kanji reconstruction', input: '団扇', expected: 'うちわ', run: () => normalizeKanaReading(resolveTokenReading({ surface_form: '団扇', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }, '団扇').reading || '') },
            { id: 'R0-READING-HITORI-CONTEXT', suite: 'unit', rule: 'R0.1 context selects the whole-word reading before generic POS labels', input: '一人 / 一人で行く', expected: 'ひとり', run: () => getCommonWordReadingForToken({ surface_form: '一人', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '*' }, '一人で行く') || '' },
            { id: 'R0-COMMON-SPAN-HITORI', suite: 'unit', rule: 'R0.1 whole-word readings survive tokenizer splits', input: '一 + 人 / 一人で行く', expected: '一人:ひとり', run: () => { const merged = mergeCommonWordTokens([{ surface_form: '一', pos: '名詞', pos_detail_1: '一般' }, { surface_form: '人', pos: '名詞', pos_detail_1: '一般' }], '一人で行く'); return `${merged[0]?.surface_form || ''}:${merged[0]?.commonWordReading || ''}`; } },
            { id: 'R0-COMMON-SPAN-TOUKYOU', suite: 'unit', rule: 'R0.2/R0.3 written kana word survives tokenizer splits', input: 'とう + きょう', expected: 'とうきょう:とうきょう', run: () => { const merged = mergeCommonWordTokens([{ surface_form: 'とう', pos: '名詞', pos_detail_1: '一般' }, { surface_form: 'きょう', pos: '名詞', pos_detail_1: '一般' }], 'とうきょう'); return `${merged[0]?.surface_form || ''}:${merged[0]?.commonWordReading || ''}`; } },
            { id: 'SYS-TITLE-ANSATSUSHA-GUARD', suite: 'engine', rule: 'Systemic boundary repair does not regress an already-correct long title', input: '『世界最高暗殺者、異世界貴族に転生する』', expected: "'Sekai Saikou Ansatsusha, Isekai Kizoku ni Tensei Suru'" },
            { id: 'R0-SOKUON-TARA-BOUNDARY', suite: 'engine', rule: 'R0.4 a written sokuon still doubles the consonant when Kuromoji splits before たら', input: '行ったら', expected: 'Ittara' },
            { id: 'R0-WHOLE-WORD-HITORI', suite: 'engine', rule: 'R0.1 whole-word reading must be selected in context', input: '一人で行く', expected: 'Hitori de Iku' },
            { id: 'R0-SURFACE-N-APOSTROPHE', suite: 'engine', rule: 'R0.6 written ん boundary must survive the full pipeline', input: 'げんえい', expected: "Gen'ei" },
            { id: 'R0-LEXICAL-ARUIWA', suite: 'engine', rule: 'R0.7 established lexical pronunciation of terminal は follows Kuromoji pronunciation metadata', input: 'あるいは', expected: 'Aruiwa' },
            { id: 'R0-MIXED-ARUIWA', suite: 'engine', rule: 'R0.7 the same established pronunciation applies when the lexical token contains Kanji', input: '或いは', expected: 'Aruiwa' },
            { id: 'R0-MIXED-NEGAWAKUWA', suite: 'engine', rule: 'R0.7 lexicalised terminal は pronunciation follows explicit Kuromoji pronunciation metadata', input: '願わくは', expected: 'Negawakuwa' },
            { id: 'R0-CONJUNCTION-SOREDEWA', suite: 'engine', rule: 'R0.7 established conjunction pronunciation uses wa when Kuromoji explicitly marks it', input: 'それでは', expected: 'Soredewa' },
            { id: 'R0-PRONUNCIATION-GUARD-KOUIU', suite: 'engine', rule: 'R0.2/R0.3 written kana remains authoritative when Kuromoji pronunciation changes the vowel sequence', input: 'こういう', expected: 'Kouiu' },
            { id: 'R0-PRONUNCIATION-GUARD-KOUIU-PUNCT', suite: 'engine', rule: 'Whole-word written-kana behaviour must survive punctuation-driven Kuromoji tokenisation changes', input: 'こういう。', expected: 'Kouiu.' },
            { id: 'R0-COMMON-KAKUSHIGOTO', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence may repair an all-kana Kuromoji split', input: 'かくしごと', expected: 'Kakushigoto' },
            { id: 'R0-COMMON-SAIJAKU', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence may repair a compound split into prefix tokens', input: '最弱', expected: 'Saijaku' },
            { id: 'R0-COMMON-KOUTETSUJOU', suite: 'engine', rule: 'R0.1 context-scoped whole-word evidence repairs a coined compound split', input: '甲鉄城のカバネリ', expected: 'Koutetsujou no Kabaneri' },
            { id: 'R0-WHOLE-WORD-KYOKUFURI', suite: 'engine', rule: 'R0.1 determine the complete lexical reading before romanising', input: '極振り', expected: 'Kyokufuri' },
            { id: 'R0-COMMON-TOTSUKUNI', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence preserves an established all-kana lexical unit', input: 'とつくに', expected: 'Totsukuni' },
            { id: 'R0-COMMON-HEIKE', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence selects 平家 as へいけ', input: '平家物語', expected: 'Heike Monogatari' },
            { id: 'R0-COMMON-YURI', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence selects 百合 as ゆり in ordinary lexical use', input: '私の百合はお仕事です！', expected: 'Watashi no Yuri wa Oshigoto desu!' },
            { id: 'R0-COMMON-SEWAYAKI', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence preserves 世話やき as one lexical word', input: '世話やきキツネ', expected: 'Sewayaki Kitsune' },
            { id: 'R0-COMMON-AMAAMA', suite: 'engine', rule: 'R0.1 a Han iteration mark may remain inside a reviewed whole-word match', input: '甘々と稲妻', expected: 'Amaama to Inazuma' },
            { id: 'R0-COMMON-UZAI', suite: 'engine', rule: 'R0.1 reviewed all-kana evidence repairs a false Kuromoji split', input: '先輩がうざい後輩の話', expected: 'Senpai ga Uzai Kouhai no Hanashi' },
            { id: 'R0-COMMON-OTOKONOKO', suite: 'engine', rule: 'R0.1 reviewed all-kana evidence repairs a false internal word boundary', input: '先輩はおとこのこ', expected: 'Senpai wa Otokonoko' },
            { id: 'R0-COMMON-HINAMATSURI', suite: 'engine', rule: 'R0.1 reviewed whole-word evidence keeps ひなまつり as one lexical word', input: 'ひなまつり', expected: 'Hinamatsuri' },
            { id: 'R0-COMMON-KUNOICHI', suite: 'engine', rule: 'R0.1 reviewed mixed-script whole-word evidence keeps くノ一 together', input: 'くノ一ツバキの胸の内', expected: 'Kunoichi Tsubaki no Mune no Uchi' },
            { id: 'DIFF-SHIITE', suite: 'engine', rule: 'Reviewed lexical evidence preserves the established whole-word reading', input: '強いて', expected: 'Shiite' },
            { id: 'DIFF-MIBAE', suite: 'engine', rule: 'Reviewed whole-word evidence preserves rendaku in 見映え', input: '見映え', expected: 'Mibae' },
            { id: 'DIFF-ONAJIMI', suite: 'engine', rule: 'Reviewed whole-word evidence preserves the conventional 御馴染み reading', input: '御馴染み', expected: 'Onajimi' },
            { id: 'DIFF-HIGAWARI', suite: 'engine', rule: 'Reviewed whole-word evidence preserves rendaku in 日変わり', input: '日変わり', expected: 'Higawari' },
            { id: 'DIFF-YATSUATARI', suite: 'engine', rule: 'Reviewed whole-word evidence preserves the established 八つ当り reading', input: '八つ当り', expected: 'Yatsuatari' },
            { id: 'DIFF-HOKKYOKUTEN', suite: 'engine', rule: 'Reviewed whole-word evidence corrects the established 北極点 reading', input: '北極点', expected: 'Hokkyokuten' },
            { id: 'STRESS-KANA-N-Y', suite: 'engine', rule: 'Adversarial repair: an n-apostrophe survives a Kuromoji boundary before y', input: 'しんよう', expected: "Shin'you" },
            { id: 'STRESS-KANA-YOON-BOUNDARY', suite: 'engine', rule: 'Adversarial repair: small yoon kana cannot be separated into a stray output token', input: 'しにょう', expected: 'Shinyou' },
            { id: 'STRESS-KANA-SOKUON-GAKKOU', suite: 'engine', rule: 'Adversarial repair: sokuon plus long-vowel spelling survives token boundaries', input: 'がっこう', expected: 'Gakkou' },
            { id: 'SYS-N-KANA-LEXICAL-ANNAI', suite: 'engine', rule: 'Evidence-backed kana recovery prevents Kuromoji from splitting a lexical ん boundary', input: 'あんない', expected: 'Annai' },
            { id: 'SYS-N-KANA-LEXICAL-KYOURYUU', suite: 'engine', rule: 'Evidence-backed kana recovery preserves one lexical word across misleading kana token boundaries', input: 'きょうりゅう', expected: 'Kyouryuu' },
            { id: 'SYS-N-KANA-LEXICAL-SENEN', suite: 'engine', rule: 'Evidence-backed kana recovery applies the ん apostrophe inside a kana-only whole word', input: 'せんえん', expected: "Sen'en" },
            { id: 'SYS-N-VOWEL-KONIN', suite: 'engine', rule: 'The systemic ん rule remains correct in a second vowel-boundary lexical family', input: 'こんいん', expected: "Kon'in" },
            { id: 'R0-SOKUON-SINO-LEXICAL', suite: 'engine', rule: 'A lexical Sino-Japanese sokuon survives whole-word resolution', input: '結果', expected: 'Kekka' },
            { id: 'STRESS-UNICODE-DECOMPOSED-KANA', suite: 'engine', rule: 'Input NFC normalisation composes decomposed dakuten before tokenisation', input: 'がっこう', expected: 'Gakkou' },
            { id: 'CHECK-ORTHO-SPACING-DAKUTEN', suite: 'engine', rule: 'An adjacent spacing dakuten is canonicalised before NFC so valid kana cannot leak into Romaji output', input: 'ぷちえう゛ぁ', expected: 'Puchieva', expectedRequiresReview: false },
            { id: 'CHECK-ORTHO-SPACING-HANDAKUTEN-NORMALISE', suite: 'unit', rule: 'An adjacent spacing handakuten is canonicalised without globally reclassifying the standalone mark', input: 'は゜', expected: 'ぱ', run: () => normalizeTranslatorInputText('は゜') },
            { id: 'CHECK-ORTHO-ITERATION-HIRA', suite: 'engine', rule: 'An unattested hiragana iteration mark repeats the preceding syllable structurally and remains reviewable', input: 'くゝ', expected: 'Kuku', expectedRequiresReview: true },
            { id: 'CHECK-ORTHO-ITERATION-HIRA-VOICED', suite: 'engine', rule: 'A voiced hiragana iteration mark repeats the preceding syllable with voicing and remains reviewable', input: 'くゞ', expected: 'Kugu', expectedRequiresReview: true },
            { id: 'CHECK-ORTHO-ITERATION-KATA', suite: 'engine', rule: 'An unattested katakana iteration mark repeats the preceding syllable structurally and remains reviewable', input: 'サヽ', expected: 'Sasa', expectedRequiresReview: true },
            { id: 'CHECK-ORTHO-ITERATION-KATA-VOICED', suite: 'engine', rule: 'A voiced katakana iteration mark repeats the preceding syllable with voicing and remains reviewable', input: 'サヾ', expected: 'Saza', expectedRequiresReview: true },
            { id: 'CHECK-ORTHO-ITERATION-YOON', suite: 'engine', rule: 'Kana iteration fallback repeats the complete preceding contracted syllable rather than only its small kana', input: 'きゃゝ', expected: 'Kyakya', expectedRequiresReview: true },
            { id: 'STRESS-UNICODE-HALFWIDTH-KANA', suite: 'engine', rule: 'Half-width kana are width-normalised before tokenisation', input: 'ｶﾞｯｺｳ', expected: 'Gakkou' },
            { id: 'STRESS-UNICODE-FULLWIDTH-DIGITS', suite: 'engine', rule: 'Full-width ASCII digits are width-normalised before tokenisation', input: '２０９９', expected: '2099' },
            { id: 'CHECK-MAMAHAHA', suite: 'engine', rule: 'Context-scoped lexical evidence resolves 継母 and 連れ子 while reviewed common-word Romaji preserves 元カノ, with generic overrides disabled', input: '継母の連れ子が元カノだった', expected: 'Mamahaha no Tsurego ga Moto Kano Datta', expectedRequiresReview: false },
            { id: 'CTX-BOUNDARY-ICHINICHIJUU-HON', suite: 'engine', rule: 'A recognised all-day temporal span establishes a lexical boundary before the following noun even when Kuromoji initially absorbs 中本 as one token', input: '一日中本を読む', expected: 'Ichinichijuu Hon o Yomu', expectedRequiresReview: false },
            { id: 'CHECK-SPAN-FOLLOWER-IE', suite: 'engine', rule: 'A recognised typed temporal span seals its right edge so a following one-Kanji noun is re-evaluated independently rather than retained as a suffix reading', input: '一日中家で休む', expected: 'Ichinichijuu Ie de Yasumu' },
            { id: 'CHECK-SPAN-FOLLOWER-MISE', suite: 'engine', rule: 'Typed-span edge sealing is lexical-role driven and does not depend on a 家-specific reading correction', input: '一日中店で働く', expected: 'Ichinichijuu Mise de Hataraku' },
            { id: 'CHECK-SPAN-FOLLOWER-KURUMA', suite: 'engine', rule: 'A second suffix-like one-Kanji follower recovers its standalone lexical role after a recognised temporal span', input: '一日中車に乗る', expected: 'Ichinichijuu Kuruma ni Noru' },
            { id: 'CHECK-SPAN-FOLLOWER-MULTIKANJI', suite: 'engine', rule: 'Sealing a typed temporal span preserves an already-correct following multi-Kanji lexical token', input: '一日中図書館で勉強する', expected: 'Ichinichijuu Toshokan de Benkyou Suru' },
            { id: 'CHECK-SPAN-FOLLOWER-PARTICLE', suite: 'engine', rule: 'A grammatical particle immediately following a typed temporal span remains grammatical and is not lexically retokenised', input: '今日中に終える', expected: 'Kyoujuu ni Oeru' },
            { id: 'CHECK-OTHER-SPAN-FOLLOWER', suite: 'engine', rule: 'The right-edge contract applies to recognised temporal spans beyond 一日中', input: '今週中店を閉める', expected: 'Konshuujuu Mise o Shimeru' },
            { id: 'CHECK-SWALLOWED-OTHER-SPAN', suite: 'engine', rule: 'Existing swallowed-boundary recovery remains valid for another recognised temporal head', input: '今日中家に帰る', expected: 'Kyoujuu Ie ni Kaeru' },
            { id: 'CHECK-LEXICAL-CHUU-CONTRAST', suite: 'engine', rule: 'A complete standalone lexical word beginning with 中 is not split merely because a preceding token could form a temporal span', input: '毎日中庭を歩く', expected: 'Mainichi Nakaniwa o Aruku' },
            { id: 'CHECK-TEMP-SPAN-STANDALONE-CHUU', suite: 'engine', rule: 'A multi-token temporal head followed by a standalone 中 is normalised to the same typed period-span representation as swallowed-boundary recovery, allowing downstream lexical uncertainty to be superseded consistently', input: '一日中犬と歩く', expected: 'Ichinichijuu Inu to Aruku', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-NOMINAL-PREDICATE', suite: 'engine', rule: 'Bare 一日 remains a duration when an intervening lexical argument phrase precedes the eventual clause predicate', input: '一日学校で学ぶ', expected: 'Ichinichi Gakkou de Manabu', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-NOMINAL-SAHEN', suite: 'engine', rule: 'The duration-role scan can see a following サ変 predicate through an intervening case-marked nominal phrase without activity-noun exceptions', input: '一日図書館で勉強する', expected: 'Ichinichi Toshokan de Benkyou Suru', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-DATE-PARTICLE-CONTROL', suite: 'engine', rule: 'An explicit case particle immediately after 一日 keeps the calendar reading even when another nominal phrase and predicate follow', input: '一日に学校で会う', expected: 'Tsuitachi ni Gakkou de Au', expectedRequiresReview: false },
            { id: 'CHECK-TEMPORAL-LEXICAL-COLLISION-REVIEW', suite: 'engine', rule: 'When an attested typed span and a complete 中-initial lexical noun produce two valid boundary analyses, CJ2R keeps the lexical output but requires review rather than manufacturing segmentation certainty', input: '一日中学校で学ぶ', expected: 'Ichinichi Chuugakkou de Manabu', expectedRequiresReview: true },
            { id: 'CHECK-TEMPORAL-LEXICAL-COLLISION-CONTROL', suite: 'engine', rule: 'A 中-initial lexical noun is not made reviewable merely because an unattested distributive temporal span could be imagined', input: '毎日中庭を歩く', expected: 'Mainichi Nakaniwa o Aruku', expectedRequiresReview: false },
            { id: 'CTX-COUNTER-FOLLOWER-LEXICAL-ROLE', suite: 'engine', rule: 'A case-marked noun following a counter can recover its independent lexical reading when counter adjacency causes Kuromoji to misclassify it as a suffix', input: '一日一回薬を飲む', expected: 'Ichinichi Ikkai Kusuri o Nomu', expectedRequiresReview: false },
            { id: 'CTX-MORPH-COMPOUND-VERB-JOIN', suite: 'engine', rule: 'Explicit morphological grouping keeps a lexical compound verb together through final output formatting', input: '本を読み終わった', expected: 'Hon o Yomiowatta', expectedRequiresReview: false },
            { id: 'CTX-MORPH-CONJUNCTIVE-BA-JOIN', suite: 'engine', rule: 'Explicit morphological grouping keeps conjunctive ば attached to the inflected lexical word rather than introducing a formatter space', input: '行かなければいけない', expected: 'Ikanakereba Ikenai', expectedRequiresReview: false },
            { id: 'KANA-COMMON-PROTECTED-BOUNDARY-UMINEKO', suite: 'engine', rule: 'A reviewed partial-token lexical boundary remains protected from later dictionary/span rescue and retokenises the remainder as particle の', input: 'うみねこのなく頃に', expected: 'Umineko no Naku Koro ni', expectedRequiresReview: false },
            { id: 'KANA-COMMON-PROTECTED-BOUNDARY-CONTRACT', suite: 'unit', rule: 'Exact Kuromoji rescue may not cross a boundary deliberately created by reviewed lexical evidence', input: 'こ | の with protected boundary', expected: 'こ|の', run: () => { const tokens = [{ surface_form: 'こ', pos: '名詞', pos_detail_1: '一般', reading: 'コ', pronunciation: 'コ' }, { surface_form: 'の', pos: '助詞', pos_detail_1: '連体化', reading: 'ノ', pronunciation: 'ノ', reviewedLexicalBoundaryBefore: true, reviewedLexicalBoundaryEvidenceSurface: 'うみねこ' }]; const rescued = mergeExactDictionaryRescueTokens(tokens, 'この'); return rescued.map(token => token.surface_form).join('|'); } },
            { id: 'CHECK-KAGEKI-SHOUJO', suite: 'engine', rule: 'Reviewed common-word boundary evidence may split inside a Kuromoji kana token when the lexical span crosses an existing token boundary', input: 'かげきしょうじょ!!', expected: 'Kageki Shoujo!!', expectedRequiresReview: false },
            { id: 'CHECK-WARUMONO', suite: 'engine', rule: 'Reviewed common-word boundary evidence recovers わるもの and preserves the following honorific suffix', input: '休日のわるものさん', expected: 'Kyuujitsu no Warumono san', expectedRequiresReview: false },
            { id: 'KANA-COMMON-PARTIAL-TOKEN-KAGEKI', suite: 'engine', rule: 'Reviewed kana common-word evidence can recover a lexical boundary that ends inside a Kuromoji token', input: 'かげきしょうじょ', expected: 'Kageki Shoujo', expectedRequiresReview: false },
            { id: 'CHECK-RANMA-COMPACT-FRACTION-JOIN', suite: 'unit', rule: 'A reviewed title prefix explicitly classified for compact numeric typography joins a contiguous ASCII fraction token', input: 'Ranma + 1/2', expected: 'join', run: () => classifyTokenOutputBoundary({ surface_form: 'らんま', titleReadingEvidenceKind: 'title-compact-numeric-prefix' }, { surface_form: '1/2', readingResolution: { source: 'latin-source-passthrough' } }) },
            { id: 'CHECK-RANMA-COMPACT-FRACTION-WAVE-TAIL-JOIN', suite: 'unit', rule: 'The compact numeric title join survives when canonical wave-boundary normalisation is retained on the same Latin passthrough token as the fraction', input: 'Ranma + 1/2~', expected: 'join', run: () => classifyTokenOutputBoundary({ surface_form: 'らんま', titleReadingEvidenceKind: 'title-compact-numeric-prefix' }, { surface_form: '1/2~', readingResolution: { source: 'latin-source-passthrough' } }) },
            { id: 'CHECK-RANMA-COMPACT-FRACTION-GUARD', suite: 'unit', rule: 'Ordinary title evidence does not globally concatenate following ASCII fractions', input: 'reviewed title + 1/2 without compact-numeric permission', expected: 'space', run: () => classifyTokenOutputBoundary({ surface_form: 'らんま', titleReadingEvidenceKind: 'title-reading' }, { surface_form: '1/2', readingResolution: { source: 'latin-source-passthrough' } }) },
            { id: 'CHECK-RANMA-COMPACT-NONFRACTION-GUARD', suite: 'unit', rule: 'Compact numeric title permission applies only to slash fractions, not arbitrary adjacent ASCII numbers', input: 'Ranma + 12', expected: 'space', run: () => classifyTokenOutputBoundary({ surface_form: 'らんま', titleReadingEvidenceKind: 'title-compact-numeric-prefix' }, { surface_form: '12', readingResolution: { source: 'latin-source-passthrough' } }) },
            { id: 'TITLE-RANMA-COMPACT-TYPOGRAPHY', suite: 'engine', rule: 'Scoped reviewed title evidence repairs らんま as Ranma and the compact numeric-title boundary joins the contiguous 1/2 suffix without a whole-input override', input: 'らんま1/2', expected: 'Ranma1/2', expectedRequiresReview: false },
            { id: 'TITLE-RANMA-SEGMENT-BOUNDARY', suite: 'engine', rule: 'Scoped Ranma title evidence remains valid when the exact reviewed title span is repeated across a recognised title separator', input: 'らんま1/2～らんま1/2', expected: 'Ranma1/2 ~ Ranma1/2', expectedRequiresReview: false },
            { id: 'TITLE-RANMA-COMPACT-NONLEAK', suite: 'engine', rule: 'The compact-title boundary rule does not concatenate an ordinary lexical word with a following ASCII fraction', input: '猫1/2', expected: 'Neko 1/2', expectedRequiresReview: false },
            { id: 'KANA-COMMON-PARTIAL-TOKEN-HONORIFIC', suite: 'engine', rule: 'A partial-token lexical repair can reassemble an honorific fragmented by the split without capitalising it', input: 'わるものさん', expected: 'Warumono san', expectedRequiresReview: false }
        ];
    }

    function makeArtificialTokenisation(parts) {
        return (parts || []).map(item => {
            const spec = typeof item === 'string' ? { surface: item } : item;
            const surface = String(spec.surface || '');
            const symbol = spec.pos === '記号' || /^[!！?？。、,.~〜～]$/u.test(surface);
            const kana = /^[ぁ-ゖァ-ヶー]+$/u.test(surface);
            return {
                surface_form: surface,
                pos: spec.pos || (symbol ? '記号' : '名詞'),
                pos_detail_1: spec.pos_detail_1 || (symbol ? '一般' : '一般'),
                pos_detail_2: spec.pos_detail_2 || '*',
                pos_detail_3: spec.pos_detail_3 || '*',
                basic_form: spec.basic_form || surface,
                conjugated_type: spec.conjugated_type || '*',
                conjugated_form: spec.conjugated_form || '*',
                reading: Object.prototype.hasOwnProperty.call(spec, 'reading') ? spec.reading : (kana ? surface : null),
                pronunciation: Object.prototype.hasOwnProperty.call(spec, 'pronunciation') ? spec.pronunciation : (kana ? surface : null)
            };
        });
    }
    
    function translateArtificialTokenisation(source, parts) {
        const tokens = makeArtificialTokenisation(parts);
        const reconstructed = tokens.map(token => token.surface_form).join('');
        if (reconstructed !== source) throw new Error(`Artificial tokenisation does not reconstruct source: ${reconstructed} !== ${source}`);
        return translateTextFromTokenizationForQa(source, tokens, { overridesEnabled: false });
    }
    
    function auditArtificialTokenisation(source, parts) {
        const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics;
        const previousDiagnostics = runtimeState.lastTranslationDiagnostics;
        runtimeState.captureTranslationDiagnostics = true;
        runtimeState.lastTranslationDiagnostics = null;
        try {
            const output = translateArtificialTokenisation(source, parts);
            return { output, audit: runtimeState.lastTranslationDiagnostics };
        } finally {
            runtimeState.captureTranslationDiagnostics = previousDiagnosticsState;
            runtimeState.lastTranslationDiagnostics = previousDiagnostics;
        }
    }
    
    function getTokenisationMutationRegressionChecks() {
        const particle = (surface, detail) => ({ surface, pos: '助詞', pos_detail_1: detail });
        return [
            { id: 'MECH-TOKENISATION-MUTATION-ROKUNIN', suite: 'unit', rule: 'Alternative Kuromoji boundaries cannot change a lexically established kana span', input: 'ろくに/ん, ろく/にん, ろくにん', expected: 'Rokunin|Rokunin|Rokunin', run: () => [
                translateArtificialTokenisation('ろくにん', [{ surface: 'ろくに', pos: '副詞' }, particle('ん', '終助詞')]),
                translateArtificialTokenisation('ろくにん', ['ろく', { surface: 'にん', pos: '名詞', pos_detail_1: '非自立' }]),
                translateArtificialTokenisation('ろくにん', ['ろくにん'])
            ].join('|') },
            { id: 'MECH-TOKENISATION-MUTATION-BONNOUJI', suite: 'unit', rule: 'Lexical evidence spanning a particle-like kana outranks alternative token boundaries', input: 'ぼん/の/うじ, ぼんのう/じ, ぼんのうじ', expected: 'Bonnouji|Bonnouji|Bonnouji', run: () => [
                translateArtificialTokenisation('ぼんのうじ', ['ぼん', particle('の', '連体化'), 'うじ']),
                translateArtificialTokenisation('ぼんのうじ', ['ぼんのう', { surface: 'じ', pos: '名詞', pos_detail_1: '非自立' }]),
                translateArtificialTokenisation('ぼんのうじ', ['ぼんのうじ'])
            ].join('|') },
            { id: 'MECH-GRAMMAR-MUTATION-GRAMMATICAL-NO', suite: 'unit', rule: 'A genuine grammatical の remains grammatical while neighbouring kana boundaries vary', input: 'ぼくは麻理のなか', expected: 'Boku wa Mari no Naka', run: () => translateArtificialTokenisation('ぼくは麻理のなか', [
                'ぼく', particle('は', '係助詞'),
                { surface: '麻理', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', reading: 'マリ', pronunciation: 'マリ' },
                particle('の', '連体化'), { surface: 'なか', pos: '名詞', pos_detail_1: '非自立' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-YOTSUBATO', suite: 'unit', rule: 'Particle-like kana exposed by an artificial split is output-neutral inside a lexical span', input: 'よ/つば/と/!', expected: 'Yotsubato!', run: () => translateArtificialTokenisation('よつばと!', [particle('よ', '終助詞'), 'つば', particle('と', '並立助詞'), { surface: '!', pos: '記号' }]) },
            { id: 'MECH-GRAMMAR-MUTATION-PARTICLE-VERB-NISHITA', suite: 'unit', rule: 'Particle plus verb sequences retain their grammatical boundary independently of surrounding token partitions', input: 'コレットは死ぬことにした', expected: 'Koretto wa Shinu Koto ni Shita', run: () => translateArtificialTokenisation('コレットは死ぬことにした', [
                { surface: 'コレット', pos: '名詞', pos_detail_1: '固有名詞' }, particle('は', '係助詞'),
                { surface: '死ぬ', pos: '動詞', pos_detail_1: '自立', basic_form: '死ぬ', reading: 'シヌ', pronunciation: 'シヌ' },
                { surface: 'こと', pos: '名詞', pos_detail_1: '非自立' }, particle('に', '格助詞'),
                { surface: 'し', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_form: '連用形', reading: 'シ', pronunciation: 'シ' },
                { surface: 'た', pos: '助動詞', basic_form: 'た', reading: 'タ', pronunciation: 'タ' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-HIRUNAKA', suite: 'unit', rule: 'A false boundary inside a kana lexical word cannot introduce spacing or capitalisation', input: 'ひる/なか/の/流星', expected: 'Hirunaka no Ryuusei', run: () => translateArtificialTokenisation('ひるなかの流星', [
                { surface: 'ひる', pos: '動詞', pos_detail_1: '自立', reading: 'ヒル', pronunciation: 'ヒル' },
                { surface: 'なか', pos: '名詞', pos_detail_1: '非自立', reading: 'ナカ', pronunciation: 'ナカ' },
                particle('の', '連体化'), { surface: '流星', pos: '名詞', reading: 'リュウセイ', pronunciation: 'リュウセイ' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-SYLLABIC-N', suite: 'unit', rule: 'Splitting syllabic ん from its lexical unit cannot change apostrophe placement when source-span evidence establishes the word', input: 'し/ん/よう versus しん/よう', expected: "Shin'you|Shin'you", run: () => [
                translateArtificialTokenisation('しんよう', ['し', { surface: 'ん', pos: '名詞', pos_detail_1: '非自立' }, { surface: 'よう', pos: '名詞', pos_detail_1: '非自立' }]),
                translateArtificialTokenisation('しんよう', ['しん', { surface: 'よう', pos: '名詞', pos_detail_1: '非自立' }])
            ].join('|') },
            { id: 'MECH-GRAMMAR-MUTATION-CONJUGATION', suite: 'unit', rule: 'Equivalent token boundaries inside the lexical half of a conjugated structure do not change its output', input: 'し/て/いる versus して/いる', expected: 'Shite iru|Shite iru', run: () => [
                translateArtificialTokenisation('している', [
                    { surface: 'し', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_form: '連用形', reading: 'シ', pronunciation: 'シ' },
                    { surface: 'て', pos: '助詞', pos_detail_1: '接続助詞', reading: 'テ', pronunciation: 'テ' },
                    { surface: 'いる', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる', reading: 'イル', pronunciation: 'イル' }
                ]),
                translateArtificialTokenisation('している', [
                    { surface: 'して', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_form: '連用形', reading: 'シテ', pronunciation: 'シテ' },
                    { surface: 'いる', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる', reading: 'イル', pronunciation: 'イル' }
                ])
            ].join('|') },
            { id: 'MECH-TOKENISATION-MUTATION-MIXED-SCRIPT', suite: 'unit', rule: 'Mixed Kanji/kana compounds remain stable when internal Han and kana boundaries vary but their reading evidence is retained', input: '十/字架/の/ろく/にん', expected: 'Juujika no Rokunin', run: () => translateArtificialTokenisation('十字架のろくにん', [
                { surface: '十', pos: '名詞', reading: 'ジュウ', pronunciation: 'ジュウ' },
                { surface: '字架', pos: '名詞', reading: 'ジカ', pronunciation: 'ジカ' }, particle('の', '連体化'),
                'ろく', { surface: 'にん', pos: '名詞', pos_detail_1: '非自立' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-PUNCTUATION', suite: 'unit', rule: 'A hard punctuation boundary isolates independently mutated lexical spans on each side', input: 'ぼん/の/うじ!/ろくに/ん', expected: 'Bonnouji! Rokunin', run: () => translateArtificialTokenisation('ぼんのうじ!ろくにん', [
                'ぼん', particle('の', '連体化'), 'うじ', { surface: '!', pos: '記号' },
                { surface: 'ろくに', pos: '副詞' }, particle('ん', '終助詞')
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-REVIEWED-LOANWORD', suite: 'unit', rule: 'Reviewed source-language loanword evidence may span arbitrary Kuromoji boundaries', input: 'チェン/ソー/マン', expected: 'Chainsaw Man', run: () => translateArtificialTokenisation('チェンソーマン', ['チェン', 'ソー', 'マン']) },
            { id: 'MECH-TOKENISATION-MUTATION-KANA-NAME', suite: 'unit', rule: 'Reviewed kana-name evidence may span arbitrary Kuromoji boundaries', input: 'ナウ/シカ', expected: 'Nausicaa', run: () => translateArtificialTokenisation('ナウシカ', ['ナウ', 'シカ']) },
            { id: 'MECH-TOKENISATION-MUTATION-UNKNOWN-TOKEN-SAFETY', suite: 'unit', rule: 'Unknown contiguous Katakana remains mechanically romanisable under an artificial split and retains boundary review instead of leaking Japanese or unresolved output', input: 'ヌヘ/モラ', expected: 'Nuhe Mora:true:false:false', run: () => { const result = auditArtificialTokenisation('ヌヘモラ', ['ヌヘ', 'モラ']); const output = result.output; return `${output}:${String(Boolean(result.audit?.requiresReview))}:${String(/[ぁ-ゖァ-ヶ一-龯]/u.test(output))}:${String(output.includes('[Unresolved]'))}`; } }
        ];
    }

    function getNumbersAndCountersRegressionChecks() {
        return [
            { id: 'SYS-NUMERIC-TOKEN-JOIN', suite: 'unit', rule: 'A multiplier joins its following place-value unit inside one number group', input: '一 + 万', expected: 'true', run: () => String(shouldJoinNumericTokens({ surface_form: '一', pos_detail_1: '数' }, { surface_form: '万', pos_detail_1: '数' })) },
            { id: 'SYS-NUMERIC-GROUP-BOUNDARY', suite: 'unit', rule: 'A completed 百/千/万/億/兆 group starts a new output group before the next numeral component', input: '三千 + 四', expected: 'false', run: () => String(shouldJoinNumericTokens({ surface_form: '三千', numericExpression: true }, { surface_form: '四', pos_detail_1: '数' })) },
            { id: 'SYS-NUMERIC-TENS-JOIN', suite: 'unit', rule: '十 remains joined to its following ones digit inside the final tens group', input: '十 + 六', expected: 'true', run: () => String(shouldJoinNumericTokens({ surface_form: '十', pos_detail_1: '数' }, { surface_form: '六', pos_detail_1: '数' })) },
            { id: 'SYS-NUMERIC-YEN-BOUNDARY', suite: 'unit', rule: 'A following 円 unit is separated from the numeric expression before apostrophe logic runs', input: '万 + 円', expected: 'true', run: () => String(shouldSeparateNumericTokens({ surface_form: '万', pos_detail_1: '数' }, { surface_form: '円', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞' })) },
            { id: 'SYS-NUMERIC-SWALLOWED-UNIT-SPLIT', suite: 'unit', rule: 'A tokenizer token that swallows a numeral and 円 is restored to structural numeric and unit tokens', input: '千円', expected: '千|円', run: () => splitStructuredNumericUnitTokens([{ surface_form: '千円', reading: 'センエン', pronunciation: 'センエン', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-NUMERIC-N-APOSTROPHE-GUARD', suite: 'unit', rule: 'A numeric output boundary prevents a false syllabic-n apostrophe across groups', input: '三千 + 四', expected: 'false', run: () => String(needsCrossTokenApostrophe({ surface_form: '三千', numericExpression: true, readingResolution: { reading: 'さんぜん' } }, { surface_form: '四', pos_detail_1: '数', readingResolution: { reading: 'よん' } })) },
            { id: 'SYS-NUMERIC-LARGE-UNIT-JOIN', suite: 'unit', rule: 'A large unit such as 万/億/兆 attaches to the preceding numeric group rather than starting a new output word', input: '二千 + 万', expected: 'true', run: () => String(shouldJoinNumericTokens({ surface_form: '二千', numericExpression: true }, { surface_form: '万', pos_detail_1: '数' })) },
            { id: 'SYS-NUMERIC-LARGE-UNIT-N-APOSTROPHE-GUARD', suite: 'unit', rule: 'A completed 万 group starts a new group before a trailing numeral and blocks a false cross-group apostrophe', input: '二万 + 一', expected: 'false', run: () => String(needsCrossTokenApostrophe({ surface_form: '二万', numericExpression: true, readingResolution: { reading: 'にまん' } }, { surface_form: '一', pos_detail_1: '数', readingResolution: { reading: 'いち' } })) },
            { id: 'PERF-CONTEXT-OVERRIDE-INDEX', suite: 'unit', rule: 'Contextual overrides are indexed once when present; a deliberately empty contextual bank is also valid', input: 'context override index', expected: 'valid', run: () => runtimeState.contextOverrides.length === 0 || (runtimeState.contextOverrideDictionary.size > 0 && runtimeState.contextOverridePrefixes.size > 0) ? 'valid' : 'missing' },
            { id: 'READING-RESOLUTION-NAME-CONTEXT', suite: 'unit', rule: 'A context-selected proper-name reading wins when it matches a specialist candidate', input: '日本 / ニホン', expected: 'proper-noun+kuromoji', run: () => resolveTokenReading({ surface_form: '日本', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '*', reading: 'ニホン', pronunciation: 'ニホン' }, '日本').source },
            { id: 'CTX-TEMPORAL-ONE-DAY-DURATION', suite: 'engine', rule: 'Typed temporal analysis reads 一日 as a duration in ordinary predicate context rather than leaking the calendar-date reading', input: '一日休む', expected: 'Ichinichi Yasumu', expectedRequiresReview: false },
            { id: 'CTX-TEMPORAL-ONE-DAY-DATE-CONTRAST', suite: 'engine', rule: 'Typed temporal analysis preserves the reviewed calendar-date reading of 一日 when it occurs inside a month-date expression', input: '九月一日', expected: 'Kugatsu Tsuitachi', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-SAHEN-PREDICATE', suite: 'engine', rule: 'A one-day duration is recognised when the following predicate is expressed as a サ変接続 noun plus する', input: '一日勉強する', expected: 'Ichinichi Benkyou Suru', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-SAHEN-UNSEEN', suite: 'engine', rule: 'Duration detection follows the サ変 predicate structure rather than a list of known activity nouns', input: '一日掃除する', expected: 'Ichinichi Souji Suru', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-SAHEN-PARTICLE', suite: 'engine', rule: 'Permitted duration particles between 一日 and a サ変 predicate do not hide the following predicate structure', input: '一日だけ練習する', expected: 'Ichinichi dake Renshuu Suru', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-SAHEN-INFLECTED', suite: 'engine', rule: 'The duration role follows a サ変 predicate through inflected forms of する by morphology rather than surface spelling', input: '一日運動している', expected: 'Ichinichi Undou Shite iru', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-SAHEN-O-PARTICLE', suite: 'engine', rule: 'An explicit object marker inside a サ変 predicate structure does not hide the governing する predicate from duration analysis', input: '一日勉強をする', expected: 'Ichinichi Benkyou o Suru', expectedRequiresReview: false },
            { id: 'CHECK-ONE-DAY-FIRST-DAY-CONTROL', suite: 'engine', rule: 'A genuine first-of-month use remains the reviewed calendar reading when a case particle separates 一日 from the following verb', input: '一日に会う', expected: 'Tsuitachi ni Au', expectedRequiresReview: false },
            { id: 'CTX-MINUTE-WHOLE-NUMERAL-SPAN', suite: 'engine', rule: 'Minute analysis consumes the complete numeral span plus 分 so regular multi-digit minute readings do not split or fall back lexically', input: '十五分待つ', expected: 'Juugofun Matsu', expectedRequiresReview: false },
            { id: 'CTX-MINUTE-ONBIN-MULTIDIGIT', suite: 'engine', rule: 'Whole-span minute analysis preserves counter sound change after a multi-digit numeral instead of inserting an output boundary', input: '二十一分待つ', expected: 'Nijuuippun Matsu', expectedRequiresReview: false },
            { id: 'CHECK-MINUTE-VOWEL-BOUNDARY', suite: 'engine', rule: 'A completed minute expression is a separate output unit from a following vowel-initial lexical verb', input: '十一分歩く', expected: 'Juuippun Aruku', expectedRequiresReview: false },
            { id: 'CHECK-MINUTE-Y-BOUNDARY', suite: 'engine', rule: 'A completed minute expression is separated from a following y-initial lexical verb rather than receiving a cross-word apostrophe', input: '十一分休む', expected: 'Juuippun Yasumu', expectedRequiresReview: false },
            { id: 'CHECK-MINUTE-UNSEEN-VOWEL', suite: 'engine', rule: 'Minute-boundary spacing is structural rather than specific to 十一分 or one following verb', input: '五分泳ぐ', expected: 'Gofun Oyogu', expectedRequiresReview: false },
            { id: 'CHECK-PERSON-COUNTER-VOWEL', suite: 'engine', rule: 'The same ordinary-word boundary prevents apostrophe insertion after a completed person counter', input: '三人歩く', expected: 'Sannin Aruku' },
            { id: 'CHECK-HON-COUNTER-VOWEL', suite: 'engine', rule: 'A second counter family confirms that apostrophe insertion does not cross an independent lexical word boundary', input: '三本選ぶ', expected: 'Sanbon Erabu' },
            { id: 'CHECK-COUNTER-GENERAL-WORD-COLLISION', suite: 'engine', rule: 'A structurally tokenised numeral plus 助数詞 is not replaced by an ambiguous general-word span merely because that orthographic surface exists in the fallback lexicon', input: '四本選ぶ', expected: 'Yonhon Erabu', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-GENERAL-WORD-UNSEEN', suite: 'engine', rule: 'The structured-counter guard is independent of the following lexical verb', input: '四本読む', expected: 'Yonhon Yomu', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-STRUCTURE-UNIT', suite: 'unit', rule: 'General-word merging preserves an existing numeral-plus-counter token boundary', input: '四 + 本', expected: '四|本', run: () => mergeGeneralWordTokens([{ surface_form: '四', pos: '名詞', pos_detail_1: '数', pos_detail_2: '*' }, { surface_form: '本', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞' }]).map(token => token.surface_form).join('|') },
            { id: 'CHECK-DURATION-Y-BOUNDARY', suite: 'engine', rule: 'A completed duration expression remains separate from a following y-initial lexical word', input: '三時間休む', expected: 'Sanjikan Yasumu' },
            { id: 'CHECK-SEPARATED-UNIT-VOWEL', suite: 'engine', rule: 'An already-separated numeric unit does not acquire an apostrophe before a following independent vowel-initial word', input: '千円ある', expected: 'Sen En Aru' },
            { id: 'CHECK-CONSONANT-CONTROL', suite: 'engine', rule: 'Counter spacing remains unchanged when the following independent word begins with a consonant', input: '十一分待つ', expected: 'Juuippun Matsu', expectedRequiresReview: false },
            { id: 'CHECK-INTERNAL-N-APOSTROPHE-CONTROL', suite: 'engine', rule: 'The boundary fix preserves a genuine internal syllabic-n apostrophe inside one lexical unit', input: '信用', expected: "Shin'you" },
            { id: 'CHECK-STRUCTURAL-SPACE-CONTROL', suite: 'unit', rule: 'Cross-token apostrophe logic cannot override an independently classified ordinary word boundary', input: 'じゅういっぷん + ある', expected: 'space', run: () => classifyTokenOutputBoundary({ surface_form: '十一分', readingResolution: { reading: 'じゅういっぷん' } }, { surface_form: 'ある', pos: '動詞', readingResolution: { reading: 'ある' } }) },
            { id: 'CHECK-STRUCTURAL-JOIN-APOSTROPHE', suite: 'unit', rule: 'A syllabic-n apostrophe is still inserted when morphology explicitly joins the two token readings into one Romanised unit', input: 'しん + よう', expected: 'apostrophe', run: () => classifyTokenOutputBoundary({ surface_form: 'しん', readingResolution: { reading: 'しん' } }, { surface_form: 'よう', morphologicalJoinLeft: true, readingResolution: { reading: 'よう' } }) },
            { id: 'CHECK-GOGO-SANJI-MINUTES', suite: 'engine', rule: 'A clock hour and following minute component remain separate output units after PM context', input: '午後三時十五分', expected: 'Gogo Sanji Juugofun' },
            { id: 'CHECK-GOGO-YOJI-MINUTES', suite: 'engine', rule: 'Clock-component spacing is structural rather than specific to one hour reading', input: '午後四時三十五分', expected: 'Gogo Yoji Sanjuugofun' },
            { id: 'CHECK-BARE-SANJI-MINUTES', suite: 'engine', rule: 'The hour/minute structural boundary does not depend on 午前 or 午後 being present', input: '三時十五分', expected: 'Sanji Juugofun' },
            { id: 'CHECK-UNSEEN-SHICHIJI-MINUTES', suite: 'engine', rule: 'An unseen irregular hour reading still forms a distinct component before minutes', input: '午後七時二十分', expected: 'Gogo Shichiji Nijuppun' },
            { id: 'CHECK-FIVE-MINUTE-COMPONENT', suite: 'engine', rule: 'Single-digit minute components remain distinct from the preceding hour', input: '四時五分', expected: 'Yoji Gofun' },
            { id: 'CHECK-KNOWN-GOOD-HACHIJI-CONTROL', suite: 'engine', rule: 'The existing known-good AM hour/minute spacing remains unchanged', input: '午前八時十五分', expected: 'Gozen Hachiji Juugofun' },
            { id: 'CHECK-ONE-MINUTE-CONTROL', suite: 'engine', rule: 'Reviewed one-minute evidence remains a separate clock component', input: '午前一時一分', expected: 'Gozen Ichiji Ippun' },
            { id: 'CHECK-JIHAN-CONTROL', suite: 'engine', rule: 'The existing compact 時半 counter form remains unchanged while hour/minute boundaries are repaired', input: '午後六時半', expected: 'Gogo Rokujihan' },
            { id: 'CHECK-STRUCTURAL-MERGED-HOUR-UNIT', suite: 'unit', rule: 'A merged numeric-looking clock-hour token must still be separated from a following typed minute component', input: '三時 + 十五分', expected: 'space', run: () => classifyTokenOutputBoundary({ surface_form: '三時', pos_detail_1: '数', numericExpression: true }, { surface_form: '十五分', pos_detail_1: '数', numericExpression: true, typedNumericExpressionType: 'minute-counter' }) },
            { id: 'CHECK-IRREGULAR-KUJI', suite: 'engine', rule: 'Reviewed clock-hour evidence preserves the irregular 九時 reading while retaining the structural minute boundary', input: '九時五分', expected: 'Kuji Gofun' },
            { id: 'CHECK-24H-YOJI', suite: 'engine', rule: 'Reviewed 24-hour clock evidence preserves the irregular 四時 component inside 十四時', input: '十四時五分', expected: 'Juuyoji Gofun' },
            { id: 'CHECK-24H-KUJI', suite: 'engine', rule: 'Reviewed 24-hour clock evidence preserves the irregular 九時 component inside 十九時', input: '十九時五分', expected: 'Juukuji Gofun' },
            { id: 'CHECK-ZERO-HOUR', suite: 'engine', rule: 'Reviewed clock-hour evidence supports midnight zero-hour notation as a distinct component before minutes', input: '零時五分', expected: 'Reiji Gofun' },
            { id: 'CHECK-ARABIC-HOUR-ALIAS', suite: 'engine', rule: 'Arabic-digit clock notation reuses the same reviewed hour reading and hour/minute structural boundary', input: '9時五分', expected: 'Kuji Gofun' },
            { id: 'CHECK-HOUR-DURATION-CONTRAST', suite: 'engine', rule: 'Clock-hour evidence does not reinterpret the distinct duration counter 時間', input: '九時間', expected: 'Kyuujikan' },
            { id: 'CTX-BUN-LEXICAL-CONTROL', suite: 'engine', rule: 'Typed minute handling does not reinterpret lexical/counter 分 outside a minute expression', input: '一人分', expected: 'Hitoribun', expectedRequiresReview: false },
            { id: 'CHECK-ARABIC-SANBON', suite: 'engine', rule: 'Reviewed Arabic counter alias preserves 三本 evidence', input: '3本', expected: 'Sanbon' },
            { id: 'CHECK-ARABIC-FUTSUKA', suite: 'engine', rule: 'Reviewed Arabic date alias preserves 二日 evidence', input: '2日', expected: 'Futsuka' },
            { id: 'CHECK-ARABIC-HATACHI', suite: 'engine', rule: 'Reviewed Arabic age alias preserves 二十歳 evidence', input: '20歳', expected: 'Hatachi' },
            { id: 'CHECK-CALENDAR-DATE', suite: 'engine', rule: 'Reviewed calendar aliases preserve digit year and reviewed month/day readings', input: '2026年9月6日', expected: '2026nen Kugatsu Muika' },
            { id: 'DIFF-IPPai', suite: 'engine', rule: 'Reviewed lexical evidence corrects a Kuromoji counter split', input: '一杯', expected: 'Ippai' },
            { id: 'DIFF-IKKYOKU', suite: 'engine', rule: 'Reviewed counter evidence preserves the sokuon in 一曲', input: '一曲', expected: 'Ikkyoku' },
            { id: 'DIFF-IPPO', suite: 'engine', rule: 'Reviewed counter evidence preserves the sokuon in 一歩', input: '一歩', expected: 'Ippo' },
            { id: 'STRESS-COUNTER-FUTARI', suite: 'engine', rule: 'Reviewed counter/date evidence preserves the irregular 二人 reading', input: '二人', expected: 'Futari' },
            { id: 'STRESS-COUNTER-REPETITION-GUARD', suite: 'engine', rule: 'Counter evidence must not remain stale when a larger reviewed lexical span replaces repeated counter tokens', input: '一人一人', expected: 'Hitori Hitori' },
            { id: 'STRESS-DATE-FUTSUKA', suite: 'engine', rule: 'Reviewed counter/date evidence preserves the irregular 二日 reading', input: '二日', expected: 'Futsuka' },
            { id: 'STRESS-COUNTER-IPPON', suite: 'engine', rule: 'Reviewed counter/date evidence preserves counter sound change in 一本', input: '一本', expected: 'Ippon' },
            { id: 'STRESS-COUNTER-SANBON', suite: 'engine', rule: 'Reviewed counter/date evidence preserves Rendaku-like counter voicing in 三本', input: '三本', expected: 'Sanbon' },
            { id: 'SYS-N-READING-BOUNDARY-KANJI', suite: 'engine', rule: 'A numeric-unit boundary takes precedence over cross-token apostrophe insertion', input: '千円', expected: 'Sen En' },
            { id: 'SYS-NUMERIC-COMPOUND-SPACING', suite: 'engine', rule: 'A completed thousands group is separated from the following currency unit', input: '五千円', expected: 'Gosen En' },
            { id: 'SYS-COUNTER-IKKAGETSU-KANJI', suite: 'engine', rule: 'Reviewed counter evidence preserves the irregular いっかげつ reading', input: '一箇月', expected: 'Ikkagetsu' },
            { id: 'SYS-COUNTER-IKKAGETSU-SMALL-KE', suite: 'engine', rule: 'A reviewed counter alias shares the same attested reading without a number heuristic', input: '一ヶ月', expected: 'Ikkagetsu' },
            { id: 'CHECK-COUNTER-IKKAGETSU-SMALL-KA', suite: 'engine', rule: 'Small ヵ reuses the reviewed 一箇月 reading as an explicit orthographic alias', input: '一ヵ月', expected: 'Ikkagetsu', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-ROKKAGETSU-SMALL-KA', suite: 'engine', rule: 'Small ヵ preserves the reviewed 六箇月 sound change rather than falling back to Rokukagetsu', input: '六ヵ月', expected: 'Rokkagetsu', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-JUKKAGETSU-SMALL-KA', suite: 'engine', rule: 'Small ヵ preserves the reviewed 十箇月 sound change rather than falling back to Juukagetsu', input: '十ヵ月', expected: 'Jukkagetsu', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-IKKAGETSU-SPAN-SMALL-KA', suite: 'engine', rule: 'Typed period-span composition preserves the reviewed small-ヵ counter head reading', input: '一ヵ月中', expected: 'Ikkagetsujuu', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-IKKAGETSU-SPAN-SMALL-KE', suite: 'engine', rule: 'Typed period-span composition also preserves the existing reviewed small-ヶ counter head reading', input: '一ヶ月中', expected: 'Ikkagetsujuu', expectedRequiresReview: false },
            { id: 'SYS-COUNTER-IKKAGETSU-HIRAGANA', suite: 'engine', rule: 'Orthographic counter aliases reuse one reviewed いっかげつ reading', input: '一か月', expected: 'Ikkagetsu' },
            { id: 'SYS-COUNTER-IKKASHO-KANJI', suite: 'engine', rule: 'Reviewed counter evidence preserves the irregular いっかしょ reading', input: '一箇所', expected: 'Ikkasho' },
            { id: 'SYS-COUNTER-IKKASHO-SMALL-KE', suite: 'engine', rule: 'A reviewed place-counter alias shares the same attested reading', input: '一ヶ所', expected: 'Ikkasho' },
            { id: 'CHECK-COUNTER-IKKASHO-SMALL-KA', suite: 'engine', rule: 'Small ヵ reuses the reviewed 一箇所 reading as an explicit orthographic alias', input: '一ヵ所', expected: 'Ikkasho', expectedRequiresReview: false },
            { id: 'SYS-COUNTER-IKKASHO-HIRAGANA', suite: 'engine', rule: 'Orthographic place-counter aliases reuse one reviewed いっかしょ reading', input: '一か所', expected: 'Ikkasho' },
            { id: 'SYS-NUMERIC-COMPOSITE-YEN', suite: 'engine', rule: 'A 万 group is joined internally but separated from the following currency unit', input: '一万円', expected: 'Ichiman En' },
            { id: 'SYS-NUMERIC-LONG-GROUPING', suite: 'engine', rule: 'Long Japanese numerals preserve structural place-value groups instead of becoming one artificial word', input: '二万三千四百五十六円', expected: 'Niman Sanzen Yonhyaku Gojuuroku En' },
            { id: 'SYS-NUMERIC-SANBYAKU-RULE0-N', suite: 'engine', rule: 'Reviewed 300 evidence keeps Rule 0 n before byaku rather than m-assimilation', input: '三百', expected: 'Sanbyaku' },
            { id: 'SYS-NUMERIC-SANMAN-RULE0-N', suite: 'engine', rule: 'Rule 0 keeps written syllabic n before man rather than source-guide m-assimilation', input: '三万円', expected: 'Sanman En' },
            { id: 'SYS-NUMERIC-OKU-MAN-GROUPING', suite: 'engine', rule: 'A composite block attaches to the following 万 while a completed 億 block remains a separate output group', input: '一億二千万', expected: 'Ichioku Nisenman' },
            { id: 'SYS-NUMERIC-CHOU-SOKUON-ICCHOU', suite: 'engine', rule: 'Reviewed 一兆 evidence applies Rule 0 sokuon before ちょ as cc rather than copying external romanisation', input: '一兆', expected: 'Icchou' },
            { id: 'SYS-NUMERIC-CHOU-SOKUON-HACCHOU', suite: 'engine', rule: 'Reviewed 八兆 evidence applies the same small-っ mechanism', input: '八兆', expected: 'Hacchou' },
            { id: 'SYS-NUMERIC-CHOU-SOKUON-JUCCHOU', suite: 'engine', rule: 'Reviewed 十兆 evidence applies the same small-っ mechanism', input: '十兆', expected: 'Jucchou' },
            { id: 'SYS-NUMERIC-MULTI-LARGE-UNIT-GROUPING', suite: 'engine', rule: 'Large-unit groups stay readable and never gain a false apostrophe at a numeric output boundary', input: '五百兆二万一', expected: 'Gohyakuchou Niman Ichi' },
            { id: 'R0-SOKUON-COUNTER-P', suite: 'engine', rule: 'Reviewed counter evidence can supply a sokuon-bearing reading before p', input: '六本', expected: 'Roppon' },
            { id: 'R0-SOKUON-COUNTER-K', suite: 'engine', rule: 'Reviewed counter evidence can supply a sokuon-bearing reading before k', input: '十回', expected: 'Jukkai' },
            { id: 'R0-SOKUON-DATE', suite: 'engine', rule: 'Reviewed date evidence preserves lexical sokuon', input: '四日', expected: 'Yokka' },
            { id: 'STRESS-AGE-HATACHI', suite: 'engine', rule: 'Reviewed counter/date evidence preserves the irregular 二十歳 reading', input: '二十歳', expected: 'Hatachi' }
            ,...[
                ['NUM-01','佰円','Hyaku En'], ['NUM-02','弐百円','Nihyaku En'], ['NUM-03','弐人','Futari'], ['NUM-04','弐つ','Futatsu'],
                ['NUM-05','弎百','Sanbyaku'], ['NUM-06','弎つ','Mittsu'], ['NUM-07','捌百','Happyaku'], ['NUM-08','一疋','Ippiki'],
                ['NUM-09','三疋','Sanbiki'], ['NUM-10','陌円','Hyaku En'], ['NUM-11','玖万','Kyuuman'], ['NUM-12','玖月','Kugatsu'],
                ['NUM-13','玖百','Kyuuhyaku'], ['NUM-14','卌円','Yonjuu En'], ['NUM-15','貮人','Futari'], ['NUM-16','貮百','Nihyaku']
            ].map(([id, input, expected]) => ({
                id: `UNRESOLVED30-${id}`, suite: 'engine',
                rule: 'Formal numeral/counter glyphs reuse canonical Japanese numeric and counter readings without changing lexical uses',
                input, expected
            }))
        ];
    }

    function getNamesAndLoanwordsRegressionChecks() {
        return [
            { id: 'R0-KATAKANA-SOKUON-H', suite: 'unit', rule: 'R0.4 Katakana sokuon can geminate h in foreign names and spellings', input: 'バッハ', expected: 'bahha', run: () => convertToRomaji('バッハ') },
            { id: 'SYS-NAME-CONTEXT-UNKNOWN-GIVEN', suite: 'unit', rule: 'A Han token after a surname and explicit name-space is marked for review when it is not already a proper noun', input: '藤林 杏子', expected: 'true', run: () => { const tokens = [{ surface_form: '藤林', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓' }, { surface_form: ' ', pos: '記号', pos_detail_1: '空白' }, { surface_form: '杏子', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*' }]; const marked = markUnreviewedNameContextTokens(tokens); return String(Boolean(marked[2].nameContextAmbiguous)); } },
            { id: 'SYS-NAME-SPAN-PREFIX-GUARD', suite: 'unit', rule: 'Reviewed name evidence may not consume only the lexical prefix of a different longer given-name token', input: 'synthetic reviewed-name prefix', expected: 'none', run: () => { const surface = '試験 名'; const previous = runtimeState.reviewedProperNameSpanDictionary.get(surface); const hadPrefix = runtimeState.reviewedProperNameSpanPrefixes.has(surface); runtimeState.reviewedProperNameSpanDictionary.set(surface, { reading: 'しけんな', romaji: 'Shiken Na', category: 'person' }); addSurfacePrefixes(runtimeState.reviewedProperNameSpanPrefixes, surface); try { const tokens = [{ surface_form: '試験', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓' }, { surface_form: ' ', pos: '記号', pos_detail_1: '空白' }, { surface_form: '名子', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*' }]; return findLongestReviewedProperNameSpan(tokens, 0) ? 'matched' : 'none'; } finally { if (previous) runtimeState.reviewedProperNameSpanDictionary.set(surface, previous); else runtimeState.reviewedProperNameSpanDictionary.delete(surface); if (!hadPrefix) { for (const prefix of [...runtimeState.reviewedProperNameSpanPrefixes]) if (surface.startsWith(prefix) && ![...runtimeState.reviewedProperNameSpanDictionary.keys()].some(key => key.startsWith(prefix))) runtimeState.reviewedProperNameSpanPrefixes.delete(prefix); } } } },
            { id: 'SYS-CASUAL-CONTRACTION-TERU', suite: 'unit', rule: 'Non-independent contracted てる is joined by morphology rather than a title-specific surface rule', input: '食べ + てる', expected: '食べてる', run: () => mergeCasualSpeechTokens([{ surface_form: '食べ', reading: 'タベ', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる' }, { surface_form: 'てる', reading: 'テル', pos: '動詞', pos_detail_1: '非自立', basic_form: 'てる' }]).map(token => token.surface_form).join('|') },
            { id: 'VARIANT-NAME-TSUCHIYOSHI', suite: 'unit', rule: 'Name-only itaiji are available only to proper-name lookup', input: '𠮷田', expected: '吉田', run: () => normalizeKanjiForLookup('𠮷田', { names: true }) },
            { id: 'VARIANT-NAME-NOT-GENERAL', suite: 'unit', rule: 'Name-only itaiji do not rewrite ordinary lexical lookup', input: '𠮷田', expected: '𠮷田', run: () => normalizeKanjiForLookup('𠮷田') },
            { id: 'VARIANT-NAME-TAKA', suite: 'unit', rule: 'Common name itaiji can consult the reference whole-name spelling', input: '髙橋', expected: '高橋', run: () => normalizeKanjiForLookup('髙橋', { names: true }) },
            { id: 'VARIANT-NAME-WATANABE', suite: 'unit', rule: 'Variant surname glyphs can consult reference whole-name evidence', input: '渡邉', expected: '渡辺', run: () => normalizeKanjiForLookup('渡邉', { names: true }) },
            { id: 'VARIANT-NAME-SYMBOL-TOKEN-YOSHIDA', suite: 'unit', rule: 'Rare Han classified as a symbol can still participate in whole-name variant lookup and canonical retokenisation', input: '𠮷(symbol) + 田', expected: '吉田:吉田', run: () => { const merged = mergeVariantProperNounTokens([{ surface_form: '𠮷', pos: '記号', pos_detail_1: '一般' }, { surface_form: '田', pos: '名詞', pos_detail_1: '一般' }]); return `${merged[0]?.surface_form || ''}:${merged[0]?.variantLookupSurface || ''}`; } },
            { id: 'VARIANT-NAME-SYMBOL-TOKEN-YAMAZAKI', suite: 'unit', rule: 'Compatibility Han classified as a symbol can still participate in whole-name variant lookup and canonical retokenisation', input: '山 + 﨑(symbol)', expected: '山崎:山崎', run: () => { const merged = mergeVariantProperNounTokens([{ surface_form: '山', pos: '名詞', pos_detail_1: '一般' }, { surface_form: '﨑', pos: '記号', pos_detail_1: '一般' }]); return `${merged[0]?.surface_form || ''}:${merged[0]?.variantLookupSurface || ''}`; } },
            { id: 'RANK-NAME-CLEAR-EVIDENCE', suite: 'unit', rule: 'A clearly preferred name reading may be selected while alternatives remain recorded', input: '77 / 21', expected: 'preferred', run: () => rankProperNounCandidates([{ reading: 'a', weight: 77, rank: 100, sources: new Set(['a']) }, { reading: 'b', weight: 21, rank: 100, sources: new Set(['a']) }]).selected?.reading === 'a' ? 'preferred' : 'ambiguous' },
            { id: 'RANK-NIHON-BALANCED', suite: 'unit', rule: '日本 keeps its balanced proper-name evidence instead of inheriting a false first-row preference', input: '日本', expected: 'ambiguous', run: () => rankProperNounCandidates(getProperNounCandidateLookup('日本').candidates).selected ? 'selected' : 'ambiguous' },
            { id: 'PERF-LOANWORD-PREFIX', suite: 'unit', rule: 'Loanword span scans stop when no dictionary prefix remains possible', input: 'loanword prefix index', expected: 'indexed', run: () => { const surface = [...runtimeState.loanwordDictionary.keys()].find(value => Array.from(value).length > 1); return surface && runtimeState.loanwordPrefixes.has(Array.from(surface)[0]) ? 'indexed' : 'missing'; } },
            { id: 'CHECK-LONG-REVIEWED-NAME-SPAN-11', suite: 'unit', rule: 'Reviewed proper-name spans are evidence-bounded rather than capped at ten tokens', input: '11-token reviewed-name span', expected: '11', run: () => { const original = runtimeState.reviewedProperNameSpanDictionary; const originalPrefixes = runtimeState.reviewedProperNameSpanPrefixes; const surface = '山山山山山山山山山山山'; const tokens = Array.from(surface).map(value => ({ surface_form: value, pos: '名詞' })); try { runtimeState.reviewedProperNameSpanDictionary = new Map([[surface, { reading: 'やま', romaji: 'Yama', category: 'name' }]]); runtimeState.reviewedProperNameSpanPrefixes = new Set(); addSurfacePrefixes(runtimeState.reviewedProperNameSpanPrefixes, surface); return String(findLongestReviewedProperNameSpan(tokens, 0)?.length || 0); } finally { runtimeState.reviewedProperNameSpanDictionary = original; runtimeState.reviewedProperNameSpanPrefixes = originalPrefixes; } } },
            { id: 'CHECK-LONG-VARIANT-NAME-9', suite: 'unit', rule: 'Variant proper-name spans use name-evidence prefixes rather than an eight-token ceiling', input: '9-token variant name', expected: '9', run: () => { const originalDictionary = runtimeState.properNounDictionary; const originalPrefixes = runtimeState.properNounPrefixes; const originalVariants = runtimeState.nameKanjiVariantDictionary; const canonical = '国国国国国国国国国'; const variant = '國国国国国国国国国'; const tokens = Array.from(variant).map(value => ({ surface_form: value, pos: '名詞', pos_detail_1: '固有名詞' })); try { runtimeState.properNounDictionary = new Map([[canonical, new Map([['くに', { reading: 'くに', romaji: 'kuni', categories: new Set(['per']), sources: new Set(['qa']) }]])]]); runtimeState.properNounPrefixes = new Set(); addSurfacePrefixes(runtimeState.properNounPrefixes, canonical); runtimeState.nameKanjiVariantDictionary = new Map([['國', '国']]); return String(findLongestVariantProperNoun(tokens, 0)?.length || 0); } finally { runtimeState.properNounDictionary = originalDictionary; runtimeState.properNounPrefixes = originalPrefixes; runtimeState.nameKanjiVariantDictionary = originalVariants; } } },
            { id: 'DATA-ROMAJI-SOURCE-SAFE', suite: 'unit', rule: 'Reviewed source-language spelling accepts Rule 0-safe Latin output', input: 'Chun-Li', expected: 'true', run: () => String(isRule0RomajiEvidence('Chun-Li')) },
            { id: 'ASSET-SCHEMA-PROPER-NOUN-COMPACT', suite: 'unit', rule: 'The proper-noun schema accepts the compact CJ2R surface/readings representation', input: 'proper-noun-bank-v1 / compact', expected: 'accepted', run: () => { try { validateAssetSchema('properNouns', [{ surface: '日本', rank: 1, readings: [{ reading: 'にほん', weight: 50, categories: ['loc'] }] }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SRC-ATEJI-WHOLE-WORD', suite: 'unit', rule: 'Ateji bank supplies a whole-word reading without per-kanji inference', input: '寿司', expected: '寿司:すし', run: () => { const merged = mergeAtejiTokens([{ surface_form: '寿', pos: '名詞' }, { surface_form: '司', pos: '名詞' }]); return `${merged[0]?.surface_form || ''}:${merged[0]?.atejiReading || ''}`; } },
            { id: 'SRC-JMNEDICT-PROPER-NOUN', suite: 'unit', rule: 'JMnedict supplements only tokens already classified as proper nouns', input: '阿良々木', expected: 'Araragi', run: () => capitalizeRomaji(resolveProperNounReading({ surface_form: '阿良々木', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名' })?.romaji || '') },
            { id: 'CHECK-NAME-FOLLOWING-LEXICAL', suite: 'engine', rule: 'A person-name span does not swallow a following lexical word', input: '山田太郎物語', expected: 'Yamada Tarou Monogatari' },
            { id: 'CHECK-NAME-HONORIFIC-FOLLOWING-LEXICAL', suite: 'engine', rule: 'A person name plus honorific does not swallow a following lexical word', input: '山田太郎さん物語', expected: 'Yamada Tarou san Monogatari' },
            { id: 'R0-VARIANT-NAME-YOSHIDA', suite: 'engine', rule: 'Variant name glyphs use whole-name evidence rather than single-Kanji reconstruction', input: '𠮷田', expected: 'Yoshida' },
            { id: 'R0-VARIANT-NAME-TAKAHASHI', suite: 'engine', rule: 'Common itaiji in surnames resolve through whole-name evidence', input: '髙橋', expected: 'Takahashi' },
            { id: 'R0-VARIANT-NAME-WATANABE', suite: 'engine', rule: 'Variant surname forms resolve through whole-name evidence', input: '渡邉', expected: 'Watanabe' },
            { id: 'R0-EXACT-NAME-ISAO', suite: 'engine', rule: 'An exact Kuromoji proper-name entry can rescue a kana name that Viterbi otherwise splits before を', input: 'いさを', expected: 'Isao' },
            { id: 'R0-EXACT-NAME-MITSUO', suite: 'engine', rule: 'An exact Kuromoji proper-name entry can rescue a kana name that Viterbi otherwise splits before を', input: 'みつを', expected: 'Mitsuo' },
            { id: 'R0-EXACT-NAME-FUMIE', suite: 'engine', rule: 'An exact Kuromoji proper-name entry can rescue a kana name that Viterbi otherwise splits before へ', input: 'ふみへ', expected: 'Fumie' },
            { id: 'R0-EXACT-NAME-CONTEXT-GUARD-WO', suite: 'engine', rule: 'Exact-name rescue must not steal a genuine を particle when following context makes the particle parse complete', input: 'みつを食べる', expected: 'Mitsu o Taberu' },
            { id: 'R0-EXACT-NAME-CONTEXT-GUARD-HE', suite: 'engine', rule: 'Exact-name rescue must not steal a genuine へ particle when following context makes the particle parse complete', input: 'ふみへ行く', expected: 'Fumi e Iku' },
            { id: 'R0-PUNCT-LOANWORD-TEST', suite: 'engine', rule: 'R0 punctuation plus R0.8 source-language spelling for テスト', input: 'これは「テスト」です。', expected: 'Kore wa "Test" desu.' },
            { id: 'R0-LOANWORD-AUTUMN', suite: 'engine', rule: 'R0.8 loanwords use their source-language spelling', input: 'オータム', expected: 'Autumn' },
            { id: 'R0-LOANWORD-DUNGEON', suite: 'engine', rule: 'R0.8 ordinary katakana loanwords use source-language spelling', input: 'ダンジョン', expected: 'Dungeon' },
            { id: 'MECH-LOANWORD-LAST-GAME-WHOLE-SOURCE-SPELLING', suite: 'engine', rule: 'Reviewed whole-token source-language evidence prevents hybrid mechanical/source output for ラストゲーム', input: 'ラストゲーム', expected: 'Last Game', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-APOCALYPSE-SOURCE-SPELLING', suite: 'engine', rule: 'Reviewed dictionary evidence restores アポカリプス to its established English source spelling', input: 'アポカリプス', expected: 'Apocalypse', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-APOCALYPSE-MECHANICAL-FALLBACK', suite: 'unit', rule: 'Removing source-spelling evidence does not break Kana conversion: the mechanical form remains printable and reviewable', input: 'アポカリプス without reviewed source spelling', expected: 'Apokaripusu|true|missing-source-spelling-evidence', run: () => { const saved = runtimeState.loanwordDictionary.get('アポカリプス'); const savedSpan = runtimeState.authoritativeSpanDictionary.get('アポカリプス'); runtimeState.loanwordDictionary.delete('アポカリプス'); runtimeState.authoritativeSpanDictionary.delete('アポカリプス'); const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('アポカリプス'); const diagnostics = runtimeState.lastTranslationDiagnostics || {}; const flag = (diagnostics.redFlags || []).some(item => item.flag === 'missing-source-spelling-evidence') ? 'missing-source-spelling-evidence' : 'missing'; return `${output}|${Boolean(diagnostics.requiresReview)}|${flag}`; } finally { runtimeState.captureTranslationDiagnostics = previous; if (saved) runtimeState.loanwordDictionary.set('アポカリプス', saved); if (savedSpan) runtimeState.authoritativeSpanDictionary.set('アポカリプス', savedSpan); } } },
            { id: 'MECH-LOANWORD-PARTIAL-SOURCE-SPELLING-RETAINS-REVIEW', suite: 'unit', rule: 'Partial source-language restoration must not turn a mixed mechanical/reviewed Katakana span into a confident result', input: 'ラストゲーム with only ゲーム reviewed', expected: 'Rasuto Game|true|partial-source-language-loanword', run: () => { const saved = runtimeState.loanwordDictionary.get('ラストゲーム'); const savedSpan = runtimeState.authoritativeSpanDictionary.get('ラストゲーム'); runtimeState.loanwordDictionary.delete('ラストゲーム'); runtimeState.authoritativeSpanDictionary.delete('ラストゲーム'); const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('ラストゲーム'); const diagnostics = runtimeState.lastTranslationDiagnostics || {}; const source = (diagnostics.redFlags || []).find(item => item.flag === 'missing-source-spelling-evidence')?.source || 'missing'; return `${output}|${Boolean(diagnostics.requiresReview)}|${source}`; } finally { runtimeState.captureTranslationDiagnostics = previous; if (saved) runtimeState.loanwordDictionary.set('ラストゲーム', saved); if (savedSpan) runtimeState.authoritativeSpanDictionary.set('ラストゲーム', savedSpan); } } },
            { id: 'R0-LOANWORD-JAADUGAR', suite: 'engine', rule: 'R0.8 foreign names use their source-language spelling', input: '天幕のジャードゥーガル', expected: 'Tenmaku no Jaadugar' },
            { id: 'CHECK-OOSAKAJOU', suite: 'engine', rule: 'Malformed imported proper-name readings are repaired to reviewed whole-name kana', input: '大坂城', expected: 'Oosakajou' },
            { id: 'CHECK-KAOHSIUNG-EKI', suite: 'engine', rule: 'Rule 0 preserves the reviewed source-language spelling of Kaohsiung', input: '高雄駅', expected: 'Kaohsiung Eki' },
            { id: 'CHECK-YOKOHAMA-GREEN-LINE', suite: 'engine', rule: 'Mixed Japanese and source-language proper-name evidence remains whole-span and valid', input: '横浜市営地下鉄グリーンライン', expected: 'Yokohama Shiei Chikatetsu Green Line' },
            { id: 'CHECK-CHUN-LI', suite: 'engine', rule: 'Rule 0 foreign-name evidence uses the reviewed source-language spelling Chun-Li', input: '春麗', expected: 'Chun-Li' },
            { id: 'R0-ATEJI-CAN', suite: 'engine', rule: 'R0.8 foreign-derived ateji use the source-language word', input: '缶', expected: 'Can' },
            { id: 'SRC-ATEJI-SUSHI', suite: 'engine', rule: 'Ateji bank supplies an established whole-word reading', input: '寿司', expected: 'Sushi' },
            { id: 'R0-INTEGRATION-NONI-BOUNDARY', suite: 'engine', rule: 'Rule 0 integration check for grammatical boundaries, whole-word readings, loanwords and punctuation', input: '幻影の東京で一人だけが珈琲について知っているのに、僕への手紙は「オータム・クラブ」から届いた。', expected: 'Gen\'ei no Toukyou de Hitori dake ga Coffee ni tsuite Shitte iru noni, Boku e no Tegami wa \"Autumn Club\" kara Todoita.' },
            { id: 'R0-LOANWORD-ATELIER', suite: 'engine', rule: 'R0.8 French-derived アトリエ uses its source-language spelling', input: 'とんがり帽子のアトリエ', expected: 'Tongari Boushi no Atelier' },
            { id: 'R0-LOANWORD-TELEPATH', suite: 'engine', rule: 'R0.8 English-derived テレパス uses its source-language spelling', input: '星屑テレパス', expected: 'Hoshikuzu Telepath' },
            { id: 'R0-LOANWORD-TRAIN', suite: 'engine', rule: 'R0.8 English-derived トレイン uses its source-language spelling', input: '終末トレインどこへいく？', expected: 'Shuumatsu Train Doko e Iku?' },
            { id: 'R0-LOANWORD-DROPKICK', suite: 'engine', rule: 'R0.8 English-derived ドロップキック uses its source-language spelling', input: 'ドロップキック', expected: 'Dropkick' },
            { id: 'R0-LOANWORD-CIRCUS', suite: 'engine', rule: 'R0.8 English-derived サーカス uses its source-language spelling', input: 'からくりサーカス', expected: 'Karakuri Circus' },
            { id: 'R0-LOANWORD-QUEST', suite: 'engine', rule: 'R0.8 English-derived クエスト uses its source-language spelling', input: 'サクラクエスト', expected: 'Sakura Quest' },
            { id: 'R0-LOANWORD-AQUATOPE', suite: 'engine', rule: 'R0.8 アクアトープ preserves the established source-language spelling', input: '白い砂のアクアトープ', expected: 'Shiroi Suna no Aquatope' },
            { id: 'R0-FOREIGN-NAME-DARWIN', suite: 'engine', rule: 'R0.8 a foreign name written in Katakana uses its source spelling', input: 'ダーウィン事変', expected: 'Darwin Jihen' },
            { id: 'DIFF-OMITAMA', suite: 'engine', rule: 'Reviewed place-name evidence corrects 小美玉 without changing general name ranking', input: '小美玉', expected: 'Omitama' },
            { id: 'R0-KATAKANA-SOKUON-REVIEWED-LOANWORD', suite: 'engine', rule: 'A reviewed source-language loanword containing ッ keeps its reviewed source spelling', input: 'ペット', expected: 'Pet' },
            { id: 'STRESS-VS-NAME-KAMIKI', suite: 'engine', rule: 'Variation selectors do not defeat reviewed whole-name lookup', input: '神︀木隆之介', expected: 'Kamiki Ryuunosuke' },
            { id: 'STRESS-ATEJI-TEMPURA', suite: 'engine', rule: 'Exact ateji evidence wins across misleading token boundaries', input: '天婦羅', expected: 'Tenpura' },
            { id: 'STRESS-NAME-HONORIFIC-KAMIKI', suite: 'engine', rule: 'A reviewed whole-name reading survives an attached honorific', input: '神木隆之介さん', expected: 'Kamiki Ryuunosuke san' },
            { id: 'SYS-NAME-HONORIFIC-KANJI-SAMA', suite: 'engine', rule: 'Reviewed-name suffix handling resolves kanji 様 as the honorific sama without lexical ambiguity', input: '神木隆之介様', expected: 'Kamiki Ryuunosuke sama', expectedRequiresReview: false },
            { id: 'SYS-NAME-HONORIFIC-KANJI-KUN', suite: 'engine', rule: 'Reviewed-name suffix handling resolves kanji 君 as honorific kun after a reviewed person name', input: '神木隆之介君', expected: 'Kamiki Ryuunosuke kun', expectedRequiresReview: false },
            { id: 'SYS-NAME-HONORIFIC-KANJI-SHI', suite: 'engine', rule: 'Reviewed-name suffix handling resolves 氏 as honorific shi after a reviewed person name', input: '神木隆之介氏', expected: 'Kamiki Ryuunosuke shi', expectedRequiresReview: false },
            { id: 'NAME-KAGUYA-REVIEWED', suite: 'engine', rule: 'Reviewed kana-name evidence keeps かぐや whole and combines safely with kanji 様', input: 'かぐや様', expected: 'Kaguya sama', expectedRequiresReview: false },
            { id: 'NAME-SUZUMIYA-REVIEWED', suite: 'engine', rule: 'Reviewed proper-name evidence resolves 涼宮 as Suzumiya outside a title override', input: '涼宮さん', expected: 'Suzumiya san', expectedRequiresReview: false },
            { id: 'NAME-KOMI-REVIEWED', suite: 'engine', rule: 'Reviewed proper-name evidence resolves 古見 as Komi outside a title override', input: '古見さん', expected: 'Komi san', expectedRequiresReview: false },
            { id: 'LEXICAL-HAIYORE', suite: 'engine', rule: 'Ordinary lexical evidence resolves 這いよれ as Haiyore without title-specific context', input: '這いよれ', expected: 'Haiyore', expectedRequiresReview: false },
            { id: 'TITLE-HAKABA-KITAROU', suite: 'engine', rule: 'Scoped bibliographic title evidence resolves 墓場鬼太郎 as Hakaba Kitarou without globally forcing 鬼太郎 to Kitarou', input: '墓場鬼太郎', expected: 'Hakaba Kitarou', expectedRequiresReview: false },
            { id: 'TITLE-HAKABA-KITAROU-SCOPE', suite: 'unit', rule: '墓場鬼太郎 title evidence is scoped to the complete reviewed title and does not match bare 鬼太郎', input: '墓場鬼太郎 / 鬼太郎', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('墓場鬼太郎') || []).find(item => item.romaji === 'Hakaba Kitarou'); return `${rule?.pattern?.test('墓場鬼太郎') ? 'match' : 'no-match'}|${rule?.pattern?.test('鬼太郎') ? 'match' : 'no-match'}`; } },
            { id: 'LEXICAL-USUZAKURA', suite: 'engine', rule: 'Reviewed ordinary lexical evidence resolves 薄桜 as Usuzakura independently of the title 薄桜鬼', input: '薄桜', expected: 'Usuzakura', expectedRequiresReview: false },
            { id: 'TITLE-HAKUOUKI', suite: 'engine', rule: 'Scoped bibliographic title evidence resolves 薄桜鬼 as Hakuouki while ordinary 薄桜 remains Usuzakura', input: '薄桜鬼', expected: 'Hakuouki', expectedRequiresReview: false },
            { id: 'TITLE-YUU-YUU-HAKUSHO-WHITE-STAR', suite: 'engine', rule: 'Scoped title evidence resolves 幽☆遊☆白書 as Yuu Yuu Hakusho and consumes decorative stars from the Romaji title', input: '幽☆遊☆白書', expected: 'Yuu Yuu Hakusho', expectedRequiresReview: false },
            { id: 'TITLE-YUU-YUU-HAKUSHO-BLACK-STAR', suite: 'engine', rule: 'The attested black-star title typography resolves to the same Yuu Yuu Hakusho reading', input: '幽★遊★白書', expected: 'Yuu Yuu Hakusho', expectedRequiresReview: false },
            { id: 'TITLE-YUU-YUU-HAKUSHO-SCOPE', suite: 'unit', rule: 'Yuu Yuu Hakusho title evidence is exact to the reviewed decorated title surfaces and does not reinterpret bare 幽 or 遊', input: '幽☆遊☆白書 / 幽 / 遊', expected: 'match|no-match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('幽☆遊☆白書') || []).find(item => item.romaji === 'Yuu Yuu Hakusho'); return `${rule?.pattern?.test('幽☆遊☆白書') ? 'match' : 'no-match'}|${rule?.pattern?.test('幽') ? 'match' : 'no-match'}|${rule?.pattern?.test('遊') ? 'match' : 'no-match'}`; } },
            { id: 'TITLE-KIZUMONOGATARI', suite: 'engine', rule: 'Scoped official title-reading evidence resolves 傷物語 without a generic override', input: '傷物語', expected: 'Kizumonogatari', expectedRequiresReview: false },
            { id: 'TITLE-NEKOMONOGATARI', suite: 'engine', rule: 'Scoped official title-reading evidence resolves 猫物語 without a generic override', input: '猫物語', expected: 'Nekomonogatari', expectedRequiresReview: false },
            { id: 'TITLE-KOYOMIMONOGATARI', suite: 'engine', rule: 'Scoped official title-reading evidence resolves 暦物語 without a generic override', input: '暦物語', expected: 'Koyomimonogatari', expectedRequiresReview: false },
            { id: 'TITLE-OWARIMONOGATARI', suite: 'engine', rule: 'Scoped official title-reading evidence resolves 終物語 without a generic override', input: '終物語', expected: 'Owarimonogatari', expectedRequiresReview: false },
            { id: 'TITLE-MONONOKE', suite: 'engine', rule: 'Scoped official title-reading evidence resolves stylised モノノ怪 as Mononoke without a mixed-script heuristic', input: 'モノノ怪', expected: 'Mononoke', expectedRequiresReview: false },
            { id: 'TITLE-MONONOKE-PUNCT', suite: 'engine', rule: 'Scoped Mononoke title evidence remains valid with the guide-normalised final Japanese full stop', input: 'モノノ怪。', expected: 'Mononoke.', expectedRequiresReview: false },
            { id: 'TITLE-MONONOKE-SCOPE', suite: 'unit', rule: 'Mononoke title evidence is exact to the reviewed title and does not reinterpret longer mixed-script words', input: 'モノノ怪 / モノノ怪物', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('モノノ怪') || []).find(item => item.romaji === 'Mononoke'); return `${rule?.pattern?.test('モノノ怪') ? 'match' : 'no-match'}|${rule?.pattern?.test('モノノ怪物') ? 'match' : 'no-match'}`; } },
            { id: 'TITLE-SPIRITED-AWAY-KAMIKAKUSHI', suite: 'engine', rule: 'Scoped attested title-reading evidence preserves the non-rendaku Kamikakushi reading without changing generic 神隠し', input: '千と千尋の神隠し', expected: 'Sen to Chihiro no Kamikakushi', expectedRequiresReview: false },
            { id: 'TITLE-SPIRITED-AWAY-KAMIKAKUSHI-PUNCT', suite: 'engine', rule: 'The reviewed Kamikakushi title reading remains valid before a normalised Japanese full stop', input: '千と千尋の神隠し。', expected: 'Sen to Chihiro no Kamikakushi.', expectedRequiresReview: false },
            { id: 'TITLE-SPIRITED-AWAY-KAMIKAKUSHI-SCOPE', suite: 'unit', rule: 'The Kamikakushi title reading is scoped to the reviewed title boundary and does not reinterpret longer strings', input: '千と千尋の神隠し / 千と千尋の神隠し物語', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('千と千尋の神隠し') || []).find(item => item.romaji === 'Sen to Chihiro no Kamikakushi'); return `${rule?.pattern?.test('千と千尋の神隠し') ? 'match' : 'no-match'}|${rule?.pattern?.test('千と千尋の神隠し物語') ? 'match' : 'no-match'}`; } },
            { id: 'TITLE-SPIRITED-AWAY-GENERIC-KAMIGAKUSHI-CONTROL', suite: 'engine', rule: 'Title-scoped Kamikakushi evidence must not globally suppress the attested generic Kamigakushi variant selected by Kuromoji', input: '神隠し', expected: 'Kamigakushi', expectedRequiresReview: false },
            { id: 'LEXICAL-MONONOKE-KUROMOJI-CONTROL', suite: 'engine', rule: 'Ordinary lexical 物の怪 continues to resolve through Kuromoji independently of title evidence', input: '物の怪', expected: 'Mononoke', expectedRequiresReview: false },
            { id: 'CHECK-NO-LEGACY-CONTEXT-OVERRIDES', suite: 'unit', rule: 'Reviewed linguistic evidence must remain on its typed evidence paths rather than regress into generic contextual overrides', input: 'reviewed evidence surfaces', expected: 'none', run: () => { const legacySurfaces = new Set(['元カノ','ロシア語','化物語','銀魂','呪術廻戦','継母','連れ子','鬼滅の刃','かぐや','涼宮','地縛','刀語','未来日記','傷物語','猫物語','暦物語','終物語','青春男','這いよれ','さくら荘','古見','仙狐','獣たち','式守','精霊の守り人','烏は主を選ばない','姑獲鳥の夏','絡新婦の理','傾物語','全修','るろうに','八咫烏','鴨乃橋ロン','戦国妖狐','隠れ巨乳','鵼の碑','凍牌','闘牌録']); return runtimeState.contextOverrides.some(item => legacySurfaces.has(item.surface)) ? 'legacy-present' : 'none'; } },
            { id: 'CHECK-NO-LEGACY-EXACT-OVERRIDES-KANA-LEXICAL-BOUNDARIES', suite: 'unit', rule: 'Reviewed kana and lexical boundaries must remain on normal evidence paths rather than return to whole-input bypasses', input: 'reviewed kana and lexical-boundary titles', expected: 'none', run: () => { const legacySurfaces = new Set(['よふかしのうた','攻殻機動隊','小林さんちのメイドラゴン','まちカドまぞく','とある科学の超電磁砲','のんのんびより']); return Object.keys(runtimeState.overrides || {}).some(surface => legacySurfaces.has(surface)) ? 'legacy-present' : 'none'; } },
            { id: 'CHECK-NO-LEGACY-EXACT-OVERRIDES-SCOPED-TITLE-BOUNDARIES', suite: 'unit', rule: 'Scoped title and lexical-boundary evidence must not regress into whole-input bypasses', input: 'scoped title-boundary evidence', expected: 'none', run: () => { const legacySurfaces = new Set(['ヴァニタスの手記','とらドラ！','ゆるキャン△','かげきしょうじょ!!','ばらかもん','休日のわるものさん']); return Object.keys(runtimeState.overrides || {}).some(surface => legacySurfaces.has(surface)) ? 'legacy-present' : 'none'; } },
            { id: 'CHECK-NO-LEGACY-EXACT-OVERRIDES-OFFICIAL-TITLE-SPELLINGS', suite: 'unit', rule: 'Official and source-language title spellings must remain on scoped evidence rather than whole-input bypasses', input: 'official and source-language title spellings', expected: 'none', run: () => { const legacySurfaces = new Set(['ドロヘドロ','メイドインアビス','オッドタクシー','リコリス・リコイル','サマータイムレンダ','アンダーニンジャ','デュラララ!!']); return Object.keys(runtimeState.overrides || {}).some(surface => legacySurfaces.has(surface)) ? 'legacy-present' : 'none'; } },
            { id: 'CHECK-NO-LEGACY-EXACT-OVERRIDES-GIKUN-TITLES', suite: 'unit', rule: 'Reviewed title gikun and source-language spellings must remain on scoped evidence rather than whole-input bypasses', input: 'reviewed gikun and source-spelling titles', expected: 'none', run: () => { const legacySurfaces = new Set(['斉木楠雄のΨ難','魔法少女まどか☆マギカ','デッドデッドデーモンズデデデデデストラクション','妖狐×僕SS','夏雪ランデブー','東京喰種','賭ケグルイ']); return Object.keys(runtimeState.overrides || {}).some(surface => legacySurfaces.has(surface)) ? 'legacy-present' : 'none'; } },
            { id: 'CHECK-NO-LEGACY-EXACT-OVERRIDES-WHOLE-WORD-TITLES', suite: 'unit', rule: 'Reviewed title and whole-word boundaries must remain on normal evidence paths rather than whole-input bypasses', input: 'reviewed whole-word title evidence', expected: 'none', run: () => { const legacySurfaces = new Set(['十二国記','うる星やつら','黄昏乙女×アムネジア','うみねこのなく頃に']); return Object.keys(runtimeState.overrides || {}).some(surface => legacySurfaces.has(surface)) ? 'legacy-present' : 'none'; } },
            { id: 'TITLE-KOWLOON-GENERIC-ROMANCE', suite: 'engine', rule: 'Ordinary 九龍 lexical evidence merges the source span, then scoped title evidence supplies Kowloon while the remainder uses source-spelling evidence', input: '九龍ジェネリックロマンス', expected: 'Kowloon Generic Romance', expectedRequiresReview: false },
            { id: 'LEXICAL-KYUURYUU-CONTRACT', suite: 'unit', rule: 'Ordinary 九龍 is represented in reviewed lexical evidence as きゅうりゅう rather than relying on title-specific source spelling', input: '九龍 lexical evidence', expected: 'きゅうりゅう', run: () => (runtimeState.commonWordDictionary.get('九龍') || []).find(item => !item.pattern)?.reading || 'missing' },
            { id: 'LEXICAL-KYUURYUU-VARIANT-ALIAS', suite: 'unit', rule: 'Reviewed common-word evidence remains addressable after an earlier canonical kanji-variant rescue changes 九龍 to 九竜', input: '九竜 common-word lookup', expected: 'きゅうりゅう', run: () => (runtimeState.commonWordDictionary.get('九竜') || []).find(item => !item.pattern)?.reading || 'missing' },
            { id: 'TITLE-KOWLOON-VARIANT-LOOKUP-ALIAS', suite: 'unit', rule: 'Scoped title evidence remains lookup-addressable after a canonical kanji-variant rescue changes 九龍 to 九竜', input: '九竜 title evidence alias', expected: 'Kowloon', run: () => (runtimeState.titleReadingDictionary.get('九竜') || []).find(item => item.surface === '九龍')?.romaji || 'missing' },
            { id: 'TITLE-KOWLOON-NORMALIZED-PATTERN-CONTRACT', suite: 'unit', rule: 'Reviewed title regex literals are canonicalised after kanji-variant data loads so they match the same normalized input seen by the tokenizer', input: '九龍 pattern over normalized 九竜 input', expected: 'true', run: () => { const rule = (runtimeState.titleReadingDictionary.get('九竜') || []).find(item => item.surface === '九龍'); if (!rule) return 'missing'; rule.pattern.lastIndex = 0; return String(rule.pattern.test('九竜ジェネリックロマンス')); } },
            { id: 'CHECK-LOANWORD-MEDALIST', suite: 'engine', rule: 'Reviewed source-language evidence supplies the established spelling for メダリスト', input: 'メダリスト', expected: 'Medalist', expectedRequiresReview: false },
            { id: 'CHECK-LOANWORD-MOB', suite: 'engine', rule: 'Reviewed source-language evidence supplies the established spelling for モブ', input: 'モブ', expected: 'Mob', expectedRequiresReview: false },
            { id: 'CHECK-LOANWORD-PSYCHO', suite: 'engine', rule: 'Reviewed source-language evidence supplies the established spelling for サイコ', input: 'サイコ', expected: 'Psycho', expectedRequiresReview: false },
            { id: 'CHECK-LOANWORD-MOB-PSYCHO', suite: 'engine', rule: 'Unique complete decomposition of reviewed source-language entries resolves モブサイコ without a title-specific override', input: 'モブサイコ100', expected: 'Mob Psycho 100', expectedRequiresReview: false },
            { id: 'LOANWORD-MOB-PSYCHO-UNIQUE-SPLIT', suite: 'unit', rule: 'Reviewed モブ and サイコ entries provide one complete source-spelling decomposition of モブサイコ', input: 'モブサイコ', expected: 'Mob|Psycho', run: () => (splitReviewedLoanwordToken({ surface_form: 'モブサイコ', pos: '名詞', pos_detail_1: '一般' }) || []).map(item => item.loanwordOutput).join('|') || 'unsplit' },
            { id: 'LOANWORD-MOB-PSYCHO-NO-PREFIX-LEAK', suite: 'unit', rule: 'Reviewed partial-token loanword splitting requires a complete decomposition and does not consume a recognised prefix of a longer token', input: 'モブサイコロ', expected: 'unsplit', run: () => splitReviewedLoanwordToken({ surface_form: 'モブサイコロ', pos: '名詞', pos_detail_1: '一般' }) ? 'split' : 'unsplit' },
            { id: 'LOANWORD-UNIQUE-PARTIAL-TOKEN-SPLIT', suite: 'unit', rule: 'A katakana token with no whole-token source spelling may split only when it has one complete decomposition into reviewed loanword entries', input: 'ジェネリックロマンス', expected: 'Generic|Romance', run: () => (splitReviewedLoanwordToken({ surface_form: 'ジェネリックロマンス', pos: '名詞', pos_detail_1: '一般' }) || []).map(item => item.loanwordOutput).join('|') || 'unsplit' },
            { id: 'LOANWORD-AMBIGUOUS-PARTIAL-TOKEN-NOSPLIT', suite: 'unit', rule: 'Reviewed partial-token loanword splitting refuses ambiguous decompositions rather than guessing a source-word boundary', input: 'アアア with ア and アア evidence', expected: 'unsplit', run: () => { const original = runtimeState.loanwordDictionary; try { runtimeState.loanwordDictionary = new Map([['ア','A'],['アア','AA']]); return splitReviewedLoanwordToken({ surface_form: 'アアア', pos: '名詞', pos_detail_1: '一般' }) ? 'split' : 'unsplit'; } finally { runtimeState.loanwordDictionary = original; } } },
            { id: 'CHECK-NO-KOWLOON-EXACT-OVERRIDE', suite: 'unit', rule: '九龍ジェネリックロマンス must remain on scoped title/source-spelling evidence rather than a whole-input bypass', input: '九龍ジェネリックロマンス', expected: 'absent', run: () => Object.prototype.hasOwnProperty.call(runtimeState.overrides || {}, '九龍ジェネリックロマンス') ? 'present' : 'absent' },
            { id: 'CHECK-NO-MORPHOLOGY-OVERRIDES', suite: 'unit', rule: 'Productive 告る and たがる morphology must not regress into generic exact/contextual overrides', input: '告らせたい / 心が叫びたがってるんだ。', expected: 'none', run: () => (runtimeState.contextOverrides.some(item => item.surface === '告らせたい') || Object.prototype.hasOwnProperty.call(runtimeState.overrides || {}, '心が叫びたがってるんだ。')) ? 'legacy-present' : 'none' },
            { id: 'CHECK-NO-RANMA-EXACT-OVERRIDE', suite: 'unit', rule: 'らんま1/2 must remain on scoped title evidence plus compact numeric-boundary handling rather than returning to a whole-input bypass', input: 'らんま1/2', expected: 'absent', run: () => Object.prototype.hasOwnProperty.call(runtimeState.overrides || {}, 'らんま1/2') ? 'present' : 'absent' },
            { id: 'TITLE-RANMA-SCOPED-EVIDENCE', suite: 'unit', rule: 'Ranma title evidence is scoped to the exact compact らんま1/2 title spelling and does not leak to other fractions', input: 'らんま1/2 / らんま1/3', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('らんま') || []).find(item => item.kind === 'title-compact-numeric-prefix'); return `${rule?.pattern?.test('らんま1/2') ? 'match' : 'no-match'}|${rule?.pattern?.test('らんま1/3') ? 'match' : 'no-match'}`; } },
            { id: 'TITLE-KOWLOON-NONLEAK', suite: 'engine', rule: 'Scoped Kowloon title evidence must not globally reinterpret ordinary 九龍', input: '九龍を見た', expected: 'Kyuuryuu o Mita', expectedRequiresReview: false },
            { id: 'TITLE-SAIKI-KUSUO-SAINAN', suite: 'engine', rule: 'Scoped title-name and gikun evidence resolves 楠雄 and Ψ難 without an exact whole-input bypass', input: '斉木楠雄のΨ難', expected: 'Saiki Kusuo no Sainan', expectedRequiresReview: false },
            { id: 'TITLE-MADOKA-MAGICA', suite: 'engine', rule: 'Scoped title spelling evidence preserves Madoka Magica and removes the decorative star from the Romaji title span', input: '魔法少女まどか☆マギカ', expected: 'Mahou Shoujo Madoka Magica', expectedRequiresReview: false },
            { id: 'TITLE-DEAD-DEAD-DEMONS', suite: 'engine', rule: 'Scoped official/source title spelling preserves Dead Dead Demons Dededede Destruction after whole-sentence tokenisation', input: 'デッドデッドデーモンズデデデデデストラクション', expected: 'Dead Dead Demons Dededede Destruction', expectedRequiresReview: false },
            { id: 'TITLE-DOROHEDORO', suite: 'engine', rule: 'Scoped official title spelling preserves the coined Dorohedoro form after whole-sentence tokenisation', input: 'ドロヘドロ', expected: 'Dorohedoro', expectedRequiresReview: false },
            { id: 'CHECK-NO-LEGACY-EXACT-OVERRIDES-SOURCE-SPELLING-TITLES', suite: 'unit', rule: 'Reviewed title and source-language spelling evidence must not regress into silent whole-input bypasses', input: 'reviewed source-spelling titles', expected: 'none', run: () => { const legacySurfaces = new Set(['ぼっち・ざ・ろっく！','けいおん！','しかのこのこのここしたんたん','であいもん','ふらいんぐうぃっち']); return Object.keys(runtimeState.overrides || {}).some(surface => legacySurfaces.has(surface)) ? 'legacy-present' : 'none'; } },
            { id: 'TITLE-BOCCHI-THE-ROCK', suite: 'engine', rule: 'Scoped official title-spelling evidence preserves Bocchi the Rock without a whole-input bypass', input: 'ぼっち・ざ・ろっく！', expected: 'Bocchi the Rock!', expectedRequiresReview: false },
            { id: 'TITLE-K-ON', suite: 'engine', rule: 'Scoped official title typography preserves K-On without a whole-input bypass', input: 'けいおん！', expected: 'K-On!', expectedRequiresReview: false },
            { id: 'CHECK-SENKO-TITLE-EVIDENCE-NONLEAK', suite: 'unit', rule: 'Title-scoped 仙狐 evidence must not leak into the global reviewed proper-name dictionary', input: '仙狐 evidence scope', expected: 'scoped', run: () => runtimeState.reviewedProperNameSpanDictionary.has('仙狐') ? 'leaked' : ((runtimeState.titleReadingDictionary.get('仙狐') || []).some(item => String(item.pattern || '').includes('世話やきキツネの仙狐さん')) ? 'scoped' : 'missing') },
            { id: 'CHECK-SENKO-ORDINARY-CONTEXT', suite: 'engine', rule: 'Outside its reviewed title context, 仙狐 does not receive title-name evidence', input: '仙狐伝説', expected: 'Sen Kitsune Densetsu', expectedRequiresReview: true },
            { id: 'STRESS-NAME-HONORIFIC-TSUNEOKI', suite: 'engine', rule: 'A reviewed name span survives an honorific even when Kuromoji overshoots the final name token', input: '池田恒興さん', expected: 'Ikeda Tsuneoki san' },
            { id: 'STRESS-LATIN-APOSTROPHE', suite: 'engine', rule: 'Existing Latin source spelling and punctuation pass through unchanged', input: "Heaven's Feel", expected: "Heaven's Feel" },
            { id: 'STRESS-LOANWORD-ICE-CREAM', suite: 'engine', rule: 'Expanded reviewed source-language evidence preserves Ice Cream', input: 'アイスクリーム', expected: 'Ice Cream' },
            { id: 'STRESS-FOREIGN-NAME-EINSTEIN', suite: 'engine', rule: 'Expanded reviewed foreign-name evidence preserves the source spelling Einstein', input: 'アインシュタイン', expected: 'Einstein' },
            { id: 'SYS-LOANWORD-CAKE', suite: 'engine', rule: 'Reviewed source-language loanword evidence is used instead of phonetic katakana Romanisation', input: 'ケーキを食べる。', expected: 'Cake o Taberu.' },
            { id: 'SYS-FOREIGN-NAME-JACK-SKELLINGTON', suite: 'engine', rule: 'A reviewed Western full-name span preserves the source spelling across the middle dot', input: 'ジャック・スケリントンです。', expected: 'Jack Skellington desu.' },
            { id: 'SYS-JAPANESE-NAME-WHITESPACE', suite: 'engine', rule: 'A reviewed Japanese full-name span works across Rule 0 explicit name whitespace', input: '藤林 杏は学生です。', expected: 'Fujibayashi Kyou wa Gakusei desu.' },
            { id: 'R0-TITLE-SLIME', suite: 'engine', rule: 'R0.7/R0.8 lexical capitalisation plus source-language loanword spelling', input: '転生したらスライムだった件', expected: 'Tensei Shitara Slime Datta Ken' },
            { id: 'CHECK-KIMETSU', suite: 'engine', rule: 'Scoped title-reading evidence preserves the reviewed complete-title reading without a generic override', input: '鬼滅の刃', expected: 'Kimetsu no Yaiba', expectedRequiresReview: false },
            { id: 'TITLE-KOWLOON-NO-EXACT-BYPASS', suite: 'engine', rule: '九龍ジェネリックロマンス resolves through lexical/title/source-spelling evidence with the exact override removed', input: '九龍ジェネリックロマンス', expected: 'Kowloon Generic Romance', expectedRequiresReview: false },
            { id: 'TITLE-MADE-IN-ABYSS', suite: 'engine', rule: 'Scoped official title-spelling evidence preserves Made in Abyss after whole-sentence tokenisation', input: 'メイドインアビス', expected: 'Made in Abyss', expectedRequiresReview: false },
            { id: 'CHECK-VANITAS-CARTE', suite: 'engine', rule: 'Publisher-backed scoped gikun evidence resolves 手記 as Carte after whole-sentence tokenisation', input: 'ヴァニタスの手記', expected: 'Vanitas no Carte', expectedRequiresReview: false },
            { id: 'TITLE-GIKUN-YORIMOI-SORA', suite: 'engine', rule: 'Scoped title-reading evidence preserves the title-specific 宇宙 reading そら without a generic override', input: '宇宙よりも遠い場所', expected: 'Sora yori mo Tooi Basho' },
            { id: 'TITLE-KOBAYASHI-MAID-DRAGON', suite: 'engine', rule: 'Scoped title-boundary evidence separates ち + の while source-language loanword evidence supplies Maid Dragon', input: '小林さんちのメイドラゴン', expected: 'Kobayashi san Chi no Maid Dragon', expectedRequiresReview: false },
            { id: 'CHECK-SENKO', suite: 'engine', rule: 'Scoped title-name evidence preserves 仙狐 as Senko without promoting 仙狐 to a global proper name', input: '世話やきキツネの仙狐さん', expected: 'Sewayaki Kitsune no Senko san', expectedRequiresReview: false },
            { id: 'NAME-SHIKIMORI-REVIEWED', suite: 'engine', rule: 'Reviewed proper-name evidence resolves 式守 as Shikimori without a title override', input: '可愛いだけじゃない式守さん', expected: 'Kawaii dake janai Shikimori san' },
            { id: 'TITLE-ODD-TAXI', suite: 'engine', rule: 'Scoped official title-spelling evidence preserves Odd Taxi after whole-sentence tokenisation', input: 'オッドタクシー', expected: 'Odd Taxi', expectedRequiresReview: false },
            { id: 'CHECK-YURU-CAMP', suite: 'engine', rule: 'Scoped official-spelling evidence renders title-specific キャン as Camp without a whole-input bypass', input: 'ゆるキャン△', expected: 'Yuru Camp△', expectedRequiresReview: false },
            { id: 'TITLE-FLYING-WITCH', suite: 'engine', rule: 'R0.8 scoped title-spelling evidence preserves the English source spelling despite all-hiragana input', input: 'ふらいんぐうぃっち', expected: 'Flying Witch', expectedRequiresReview: false },
            { id: 'CHECK-MORIBITO', suite: 'engine', rule: 'Scoped whole-title evidence preserves 精霊の守り人 as Seirei no Moribito without a generic override', input: '精霊の守り人', expected: 'Seirei no Moribito', expectedRequiresReview: false },
            { id: 'CHECK-ARUJI', suite: 'engine', rule: 'Context-scoped lexical evidence preserves 主 as Aruji in 烏は主を選ばない', input: '烏は主を選ばない', expected: 'Karasu wa Aruji o Erabanai', expectedRequiresReview: false },
            { id: 'CHECK-UBUME', suite: 'engine', rule: 'Context-scoped lexical evidence preserves the attested irregular 姑獲鳥 reading Ubume', input: '姑獲鳥の夏', expected: 'Ubume no Natsu', expectedRequiresReview: false },
            { id: 'CHECK-JOROUGUMO', suite: 'engine', rule: 'Lexical 絡新婦 evidence plus scoped 理 evidence preserves Jorougumo no Kotowari', input: '絡新婦の理', expected: 'Jorougumo no Kotowari', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HIKARU-TITLE-CONTEXT', suite: 'engine', rule: 'Reviewed title-name evidence resolves 光 as Hikaru specifically within 光が死んだ夏', input: '光が死んだ夏', expected: 'Hikaru ga Shinda Natsu', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HIKARU-TITLE-SCOPE', suite: 'unit', rule: 'The Hikaru reading is scoped to 光が死んだ夏 and does not match bare 光', input: '光が死んだ夏 / 光', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('光') || []).find(item => item.romaji === 'Hikaru'); return `${rule?.pattern?.test('光が死んだ夏') ? 'match' : 'no-match'}|${rule?.pattern?.test('光') ? 'match' : 'no-match'}`; } },
            { id: 'MECH-PROPER-NAME-HIKARU-NONLEAK', suite: 'engine', rule: 'Title-scoped 光→Hikaru evidence does not globally replace the ordinary lexical 光 reading', input: '光', expected: 'Hikari', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-KOHINATA-MINORU-TITLE', suite: 'engine', rule: 'Reviewed whole-name evidence resolves 小日向海流 inside the published title even when surrounding lexical material remains independently analysed', input: '空手小公子小日向海流', expected: 'Karate Shoukoushi Kohinata Minoru' },
            { id: 'MECH-PROPER-NAME-KOHINATA-MINORU-WHOLE-NAME', suite: 'engine', rule: 'Reviewed whole-name evidence resolves 小日向海流 as Kohinata Minoru and preserves Japanese name order', input: '小日向海流', expected: 'Kohinata Minoru', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-KOHINATA-MINORU-LEXICAL-NONLEAK', suite: 'engine', rule: 'Whole-name evidence does not reinterpret lexical 海流 outside the reviewed person-name span', input: '海流', expected: 'Kairyuu', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-KOHINATA-MINORU-CROSSES-TOKEN-BOUNDARIES', suite: 'unit', rule: 'Reviewed whole-name evidence crosses arbitrary Kuromoji boundaries and outranks lexical/Kanji readings inside the established name span', input: '小 / 日向 / 海 / 流', expected: 'Kohinata Minoru', run: () => translateArtificialTokenisation('小日向海流', [
                { surface: '小', pos: '接頭詞', reading: 'ショウ', pronunciation: 'ショウ' },
                { surface: '日向', pos: '名詞', pos_detail_1: '固有名詞', reading: 'ヒナタ', pronunciation: 'ヒナタ' },
                { surface: '海', pos: '名詞', reading: 'ウミ', pronunciation: 'ウミ' },
                { surface: '流', pos: '名詞', reading: 'リュウ', pronunciation: 'リュウ' }
            ]) },
            { id: 'MECH-PROPER-NAME-KOHINATA-MINORU-PRECEDENCE-AUDIT', suite: 'unit', rule: 'Reviewed 小日向海流 evidence becomes one authoritative final span rather than exposing surname plus lexical 海流', input: '小日向海流', expected: 'Kohinata Minoru:reviewed-proper-name-span:1', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('小日向海流'); const readings = runtimeState.lastTranslationDiagnostics?.readings || []; return `${output}:${readings[0]?.source || ''}:${readings.length}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-PROPER-NAME-AMBIGUITY-RETAINS-REVIEW', suite: 'engine', rule: 'When a proper-name reading remains genuinely ambiguous, the best candidate is emitted but review is retained', input: '山﨑', expected: 'Yamazaki', expectedRequiresReview: true },
            { id: 'MECH-WHOLE-WORD-TITLE-GAMARAN', suite: 'engine', rule: 'Reviewed whole-title evidence outranks per-character construction for 我間乱', input: '我間乱', expected: 'Gamaran', expectedRequiresReview: false },
            { id: 'MECH-ATEJI-GIKUN-GAMARAN-TITLE-ATEJI-CLASSIFICATION', suite: 'unit', rule: '我間乱 is stored as reviewed title-ateji evidence rather than a generic lexical ateji', input: '我間乱', expected: 'title-ateji|https://www.kodansha.co.jp/comic/products/0000017207', run: () => { const rule = (runtimeState.titleReadingDictionary.get('我間乱') || []).find(item => item.romaji === 'Gamaran'); return `${rule?.kind || ''}|${rule?.source || ''}`; } },
            { id: 'MECH-ATEJI-GIKUN-GAMARAN-NOT-GENERIC-ATEJI', suite: 'unit', rule: 'Title-specific 我間乱 evidence must not be promoted into the generic ateji lexicon', input: '我間乱', expected: 'absent', run: () => runtimeState.atejiDictionary.has('我間乱') ? 'present' : 'absent' },
            { id: 'MECH-ATEJI-GIKUN-GAMARAN-COMPONENT-READINGS-AVAILABLE', suite: 'unit', rule: 'Per-character data contains readings capable of Ga + Ma + Ran, but their availability is not evidence that the title selects them', input: '我 / 間 / 乱', expected: 'ga|ma|ran', run: () => `${runtimeState.kanjiDictionary['我']?.on?.includes('ガ') ? 'ga' : 'missing'}|${runtimeState.kanjiDictionary['間']?.kun?.includes('ま') ? 'ma' : 'missing'}|${runtimeState.kanjiDictionary['乱']?.on?.includes('ラン') ? 'ran' : 'missing'}` },
            { id: 'MECH-ATEJI-GIKUN-GAMARAN-NO-AUTHORIAL-GUESSING', suite: 'unit', rule: 'Without reviewed title evidence CJ2R must not manufacture Gamaran merely by selecting convenient character readings', input: '我間乱', expected: 'not-guessed', run: () => { const saved = runtimeState.titleReadingDictionary.get('我間乱'); runtimeState.titleReadingDictionary.delete('我間乱'); try { return translateText('我間乱') === 'Gamaran' ? 'guessed' : 'not-guessed'; } finally { if (saved) runtimeState.titleReadingDictionary.set('我間乱', saved); } } },
            { id: 'MECH-WHOLE-WORD-TITLE-TASOGARE', suite: 'engine', rule: 'Reviewed bibliographic title evidence outranks tokenizer readings for 誰そ彼', input: '誰そ彼', expected: 'Tasogare', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-TITLE-KASANE', suite: 'engine', rule: 'Reviewed whole-title evidence resolves 累 as Kasane without globally changing the Kanji reading', input: '累', expected: 'Kasane', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-TITLE-TEPPUU', suite: 'engine', rule: 'Reviewed whole-title evidence resolves 鉄風 as Teppuu rather than composing Tetsu + Fuu', input: '鉄風', expected: 'Teppuu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-SHOUKOUSHI', suite: 'engine', rule: 'Reviewed whole-word evidence resolves 小公子 before character-by-character construction', input: '小公子', expected: 'Shoukoushi', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KASANE-NONLEAK', suite: 'engine', rule: 'Title-scoped 累→Kasane evidence does not leak into the ordinary compound 累積', input: '累積', expected: 'Ruiseki', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-AOHARU-NONLEAK', suite: 'engine', rule: 'Title-scoped 青春→Aoharu evidence does not globally replace the ordinary 青春 reading', input: '青春', expected: 'Seishun', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-AOHARU-SCOPE', suite: 'unit', rule: 'Aoharu evidence is scoped to 青春×機関銃 and does not match bare 青春', input: '青春×機関銃 / 青春', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('青春') || []).find(item => item.romaji === 'Aoharu'); return `${rule?.pattern?.test('青春×機関銃') ? 'match' : 'no-match'}|${rule?.pattern?.test('青春') ? 'match' : 'no-match'}`; } },
            { id: 'MECH-WHOLE-WORD-TITLE-CROSSES-TOKEN-BOUNDARIES', suite: 'unit', rule: 'Reviewed title evidence can span arbitrary Kuromoji token boundaries before final reading selection', input: '我 / 間 / 乱', expected: 'Gamaran', run: () => translateArtificialTokenisation('我間乱', [
                { surface: '我', pos: '名詞', reading: 'ワガ', pronunciation: 'ワガ' },
                { surface: '間', pos: '名詞', reading: 'カン', pronunciation: 'カン' },
                { surface: '乱', pos: '名詞', reading: 'ラン', pronunciation: 'ラン' }
            ]) },
            { id: 'MECH-WHOLE-WORD-CROSSES-TOKEN-BOUNDARIES', suite: 'unit', rule: 'Reviewed whole-word evidence can span Kuromoji token boundaries before character-level fallback', input: '小 / 公子', expected: 'Shoukoushi', run: () => translateArtificialTokenisation('小公子', [
                { surface: '小', pos: '名詞', reading: 'ショウ', pronunciation: 'ショウ' },
                { surface: '公子', pos: '名詞', reading: 'コウシ', pronunciation: 'コウシ' }
            ]) },
            { id: 'MECH-WHOLE-WORD-AOHARU-TOKEN-AUTHORITY', suite: 'unit', rule: 'Within the reviewed 青春×機関銃 title context, 青春 resolves as Aoharu independently of the separator rendering decision', input: '青春×機関銃', expected: 'Aoharu:title-reading-evidence:official-title-reading', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; translateText('青春×機関銃'); const first = runtimeState.lastTranslationDiagnostics?.readings?.find(item => item.surface === '青春'); return `${first?.value || ''}:${first?.source || ''}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-WHOLE-WORD-TITLE-PRECEDENCE-AUDIT', suite: 'unit', rule: 'Title evidence becomes the final reading authority for 我間乱 rather than leaving character-level readings visible', input: '我間乱', expected: 'Gamaran:title-reading-evidence:title-ateji:1', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('我間乱'); const readings = runtimeState.lastTranslationDiagnostics?.readings || []; return `${output}:${readings[0]?.source || ''}:${readings.length}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-WHOLE-WORD-PRECEDENCE-AUDIT', suite: 'unit', rule: 'Reviewed whole-word evidence becomes the final reading authority for 小公子 as one span', input: '小公子', expected: 'Shoukoushi:reviewed-reading-span:1', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('小公子'); const readings = runtimeState.lastTranslationDiagnostics?.readings || []; return `${output}:${readings[0]?.source || ''}:${readings.length}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-UNCERTAINTY-WHOLE-WORD-FALLBACK-AMBIGUITY', suite: 'engine', rule: 'Without stronger whole-word evidence, ambiguous reviewed character readings remain reviewable instead of becoming falsely certain', input: '巉罧', expected: 'Zan Shin', expectedRequiresReview: true },
            { id: 'TITLE-KABUKIMONOGATARI', suite: 'engine', rule: 'Scoped title-reading evidence preserves 傾物語 as Kabukimonogatari without a generic override', input: '傾物語', expected: 'Kabukimonogatari' },
            { id: 'CHECK-ZENSHUU', suite: 'engine', rule: 'Scoped title-reading evidence preserves 全修。 as Zenshuu. without a generic override', input: '全修。', expected: 'Zenshuu.', expectedRequiresReview: false },
            { id: 'CHECK-RUROUNI', suite: 'engine', rule: 'Scoped title-reading evidence resolves るろうに and 剣心 without a generic override', input: 'るろうに剣心', expected: 'Rurouni Kenshin', expectedRequiresReview: false },
            { id: 'CHECK-NO-RUROUNI-EXACT-OVERRIDE', suite: 'unit', rule: 'The long Rurouni title must remain on scoped title evidence and punctuation infrastructure rather than a whole-input bypass', input: 'るろうに剣心―明治剣客浪漫譚―', expected: 'absent', run: () => Object.prototype.hasOwnProperty.call(runtimeState.overrides || {}, 'るろうに剣心―明治剣客浪漫譚―') ? 'present' : 'absent' },
            { id: 'TITLE-RUROUNI-FULL', suite: 'engine', rule: 'Reviewed title readings plus paired subtitle-bar typography reproduce the full official title without an exact override', input: 'るろうに剣心―明治剣客浪漫譚―', expected: 'Rurouni Kenshin — Meiji Kenkaku Romantan —', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-RUROUNI-TRAILING-PUNCTUATION', suite: 'engine', rule: 'Trailing sentence punctuation does not disable paired subtitle-bar typography inside a reviewed title', input: 'るろうに剣心―明治剣客浪漫譚―。', expected: 'Rurouni Kenshin — Meiji Kenkaku Romantan —.', expectedRequiresReview: false },
            { id: 'TITLE-RUROUNI-KENKAKU-NONLEAK', suite: 'engine', rule: 'Title-scoped 剣客→Kenkaku evidence does not suppress the ordinary ambiguous 剣客 reading outside the title', input: '剣客', expected: 'Kenkyaku', expectedRequiresReview: true },
            { id: 'TITLE-RUROUNI-EVIDENCE-SCOPE', suite: 'unit', rule: 'Rurouni compound evidence matches the reviewed full title but not bare ordinary surfaces', input: '剣客 / 浪漫譚', expected: 'true|false|true|false', run: () => { const full = 'るろうに剣心―明治剣客浪漫譚―'; const ken = (runtimeState.titleReadingDictionary.get('剣客') || []).find(item => item.romaji === 'Kenkaku'); const roman = (runtimeState.titleReadingDictionary.get('浪漫譚') || []).find(item => item.romaji === 'Romantan'); return `${Boolean(ken?.pattern?.test(full))}|${Boolean(ken?.pattern?.test('剣客'))}|${Boolean(roman?.pattern?.test(full))}|${Boolean(roman?.pattern?.test('浪漫譚'))}`; } },
            { id: 'NAME-KAMONOHASHI-REVIEWED', suite: 'engine', rule: 'Reviewed proper-name evidence preserves Kamonohashi Ron without a title override', input: '鴨乃橋ロン', expected: 'Kamonohashi Ron' },
            { id: 'CHECK-UNRESOLVED-KINMEI-TENNOU', suite: 'engine', rule: 'Reviewed whole-name evidence resolves 欽明天皇 instead of leaving a token unresolved', input: '欽明天皇', expected: 'Kinmeitennou', expectedRequiresReview: false },
            { id: 'CHECK-UNRESOLVED-UEDA-SHINYA', suite: 'engine', rule: 'Reviewed whole-name evidence resolves 上田晋也 when Kuromoji misclassifies part of the name', input: '上田晋也', expected: 'Ueda Shinya', expectedRequiresReview: false },
            { id: 'CHECK-UNRESOLVED-MENG-TIAN', suite: 'engine', rule: 'Reviewed foreign-name evidence resolves 蒙恬 with the established ASCII source-language spelling', input: '蒙恬', expected: 'Meng Tian', expectedRequiresReview: false },
            { id: 'CHECK-UNRESOLVED-YUAN-SHIKAI', suite: 'engine', rule: 'Reviewed foreign-name evidence resolves 袁世凱 with the established ASCII source-language spelling', input: '袁世凱', expected: 'Yuan Shikai', expectedRequiresReview: false },
            { id: 'CHECK-UNRESOLVED-REVIEWED-NAME-CONTEXT', suite: 'engine', rule: 'Reviewed whole-name rescue preserves the following lexical boundary instead of swallowing adjacent material', input: '袁世凱政権', expected: 'Yuan Shikai Seiken', expectedRequiresReview: false },
            { id: 'CHECK-NAME-NAUSICAA', suite: 'engine', rule: 'Reviewed proper-name evidence resolves ナウシカ using Rule 0 ASCII source spelling', input: '風の谷のナウシカ', expected: 'Kaze no Tani no Nausicaa', expectedRequiresReview: false },
            { id: 'CHECK-NAME-NAUSICAA-SUFFIX', suite: 'engine', rule: 'Reviewed ナウシカ evidence remains whole-name when followed by an attached Japanese lexical suffix', input: 'ナウシカ姫', expected: 'Nausicaa Hime', expectedRequiresReview: false },
            { id: 'CHECK-NAME-NAUSICAA-EXPLICIT-BOUNDARY', suite: 'engine', rule: 'An explicit source-space boundary prevents reviewed ナウシカ evidence from merging separate tokens', input: 'ナウ シカ', expected: 'Nau Shika', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-NATSUME-SHICHI', suite: 'engine', rule: 'Title-scoped bibliographic evidence resolves 夏目友人帳 漆 with the attested seventh-season reading Shichi', input: '夏目友人帳 漆', expected: 'Natsume Yuujinchou Shichi', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-NATSUME-SHICHI-PUNCT', suite: 'engine', rule: 'The reviewed 夏目友人帳 漆 reading survives normalised final punctuation', input: '夏目友人帳 漆。', expected: 'Natsume Yuujinchou Shichi.', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-NATSUME-SHICHI-GENERIC-CONTROL', suite: 'engine', rule: 'Title-scoped Shichi evidence does not globally reinterpret ordinary 漆', input: '漆を塗る', expected: 'Urushi o Nuru', expectedRequiresReview: false },
            { id: 'CHECK-NAME-GURREN-LAGANN', suite: 'engine', rule: 'Reviewed official proper-name evidence preserves the established ASCII spelling Gurren Lagann', input: 'グレンラガン', expected: 'Gurren Lagann', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-RAGANHEN', suite: 'engine', rule: 'Scoped title-reading evidence resolves 螺巌篇 as the attested Raganhen reading while preserving surrounding title analysis', input: '劇場版 天元突破グレンラガン 螺巌篇', expected: 'Gekijouban Tengen Toppa Gurren Lagann Raganhen', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-RAGANHEN-SCOPE', suite: 'unit', rule: 'Raganhen evidence is constrained to a reviewed title boundary and does not match longer lexical continuation', input: '螺巌篇 / 螺巌篇物語', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('螺巌篇') || []).find(item => item.romaji === 'Raganhen'); return `${rule?.pattern?.test('螺巌篇') ? 'match' : 'no-match'}|${rule?.pattern?.test('螺巌篇物語') ? 'match' : 'no-match'}`; } },
            { id: 'CHECK-TITLE-BAKUMAN', suite: 'engine', rule: 'Scoped licensed-title spelling prevents tokenizer-internal Katakana splitting for バクマン。', input: 'バクマン。', expected: 'Bakuman.', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-BAKUMAN-SCOPE', suite: 'unit', rule: 'Bakuman title evidence does not reinterpret longer Katakana strings that merely share the prefix', input: 'バクマン / バクマンガ', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('バクマン') || []).find(item => item.romaji === 'Bakuman'); return `${rule?.pattern?.test('バクマン') ? 'match' : 'no-match'}|${rule?.pattern?.test('バクマンガ') ? 'match' : 'no-match'}`; } },
            { id: 'CHECK-TITLE-GINTAMA-YOROZUYA', suite: 'engine', rule: 'Scoped official Gintama evidence resolves title-specific 万事屋 as Yorozuya without globally rewriting the lexeme', input: '劇場版 銀魂 完結篇 万事屋よ永遠なれ', expected: 'Gekijouban Gintama Kanketsuhen Yorozuya yo Eiennare', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-GINTAMA-YOROZUYA-OFFICIAL-SPACING', suite: 'engine', rule: 'The same title reading accepts the official compact 劇場版銀魂 spelling', input: '劇場版銀魂 完結篇 万事屋よ永遠なれ', expected: 'Gekijouban Gintama Kanketsuhen Yorozuya yo Eiennare', expectedRequiresReview: false },
            { id: 'CHECK-TITLE-GINTAMA-YOROZUYA-SCOPE', suite: 'unit', rule: 'Gintama Yorozuya evidence is constrained to the reviewed full-title context and does not rewrite generic 万事屋', input: 'reviewed title / generic 万事屋', expected: 'match|no-match', run: () => { const rule = (runtimeState.titleReadingDictionary.get('万事屋') || []).find(item => item.romaji === 'Yorozuya'); return `${rule?.pattern?.test('劇場版 銀魂 完結篇 万事屋よ永遠なれ') ? 'match' : 'no-match'}|${rule?.pattern?.test('万事屋') ? 'match' : 'no-match'}`; } },
            { id: 'CHECK-SENGOKU-YOUKO', suite: 'engine', rule: 'Attested lexical 妖狐 evidence resolves 戦国妖狐 without a generic override', input: '戦国妖狐', expected: 'Sengoku Youko', expectedRequiresReview: false },
            { id: 'CHECK-NUE-NO-ISHIBUMI', suite: 'engine', rule: 'Publisher-backed scoped whole-title evidence preserves 鵼の碑 as Nue no Ishibumi without a generic override', input: '鵼の碑', expected: 'Nue no Ishibumi', expectedRequiresReview: false },
            { id: 'CHECK-TOUHAI', suite: 'engine', rule: 'Scoped title-reading evidence resolves 凍牌 and 闘牌録 while Rule 0 preserves Rate and Maajan', input: '凍牌～裏レート麻雀闘牌録～', expected: 'Touhai ~Ura Rate Maajan Touhairoku~', expectedRequiresReview: true },
            { id: 'MECH-LOANWORD-DEATH-NOTE-REVIEWED-OUTPUT', suite: 'engine', rule: 'Reviewed loanword output preserves Death Note for デスノート rather than falling back to mechanical kana romanisation', input: 'デスノート', expected: 'Death Note', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-GUNDAM-TOKEN-SPLIT', suite: 'engine', rule: 'Reviewed whole-span Katakana evidence prevents Kuromoji ガン and ダム segmentation from inserting a false output space', input: '機動戦士ガンダム', expected: 'Kidou Senshi Gundam', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-ONE-PIECE-REVIEWED-OUTPUT', suite: 'engine', rule: 'Reviewed loanword output preserves One Piece for ワンピース rather than falling back to mechanical kana romanisation', input: 'ワンピース', expected: 'One Piece', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-STRAY-DOGS-REVIEWED-OUTPUT', suite: 'engine', rule: 'Reviewed loanword output preserves Stray Dogs for ストレイドッグス inside a mixed-script title', input: '文豪ストレイドッグス', expected: 'Bungou Stray Dogs', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-ASCII-FOLD-MARCHEN', suite: 'engine', rule: 'Reviewed foreign-source spellings are emitted in CJ2R ASCII form while preserving the authoritative lexical identity', input: 'メルヘン', expected: 'Marchen', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-ASCII-FOLD-DEBUT', suite: 'engine', rule: 'Reviewed French source spelling is emitted using the approved unaccented CJ2R runtime form rather than mechanical Katakana', input: 'デビュー', expected: 'Debut', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-GERMAN-SOURCE', suite: 'engine', rule: 'Reviewed German-source lexical evidence wins over phonetic Katakana romanisation for a safe full-source loanword', input: 'アルバイト', expected: 'Arbeit', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-FRENCH-SOURCE', suite: 'engine', rule: 'Reviewed French-source lexical evidence wins over phonetic Katakana romanisation for a safe full-source loanword', input: 'アンケート', expected: 'Enquete', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-PORTUGUESE-SOURCE', suite: 'engine', rule: 'Reviewed Portuguese-source lexical evidence wins over phonetic Katakana romanisation for a safe full-source loanword', input: 'ヨーロッパ', expected: 'Europa', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-DUTCH-SOURCE', suite: 'engine', rule: 'Reviewed Dutch-source lexical evidence wins over phonetic Katakana romanisation for a safe full-source loanword', input: 'ガラス', expected: 'Glas', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-AUTHORITATIVE-CASE-EBAY', suite: 'engine', rule: 'Reviewed source-language brand casing is preserved exactly and is not rewritten by title-style output capitalisation', input: 'イーベイ', expected: 'eBay', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-LOANWORD-SPACEX-ALIAS', suite: 'engine', rule: 'Normalised mixed-script aliases resolve to the same reviewed source-language spelling without losing internal brand casing', input: 'スペースX', expected: 'SpaceX', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-HOMOGRAPH-BUS-PRECEDENCE', suite: 'engine', rule: 'Existing reviewed CJ2R homograph decisions retain precedence over conflicting external source-language candidates', input: 'バス', expected: 'Bus', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-AUTHORITY-UNCTAD', suite: 'engine', rule: 'Reviewed organisation evidence preserves the established source acronym instead of expanding it into a descriptive English name', input: 'アンクタッド', expected: 'UNCTAD', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-UNVERIFIED-PARTIAL-SOURCE-EXCLUDED', suite: 'engine', rule: 'A source-language phrase whose full-versus-partial status cannot be proven is excluded instead of being promoted as authoritative output', input: 'カボチャ', expected: 'Kabocha', expectedRequiresReview: false }
        ];
    }

    function getGrammarRegressionChecks() {
        return [
            { id: 'SYS-BOUNDARY-AUX-BASIC-IRU', suite: 'unit', rule: 'Auxiliary-unit spacing follows morphology rather than the current surface spelling', input: 'い / basic いる', expected: 'true|space', run: () => { const token = { surface_form: 'い', basic_form: 'いる', pos: '動詞', pos_detail_1: '非自立', grammatical: true, startsSeparateAuxiliaryUnit: true }; return `${startsSeparateAuxiliaryUnit(token)}|${classifyTokenOutputBoundary({ surface_form: 'て', pos: '助詞' }, token)}`; } },
            { id: 'SYS-BOUNDARY-AUX-BASIC-DA', suite: 'unit', rule: 'A conjugated だ auxiliary starts its own grammatical output unit even after another auxiliary', input: 'いる + だろ', expected: 'space', run: () => classifyTokenOutputBoundary({ surface_form: 'いる', grammatical: true }, { surface_form: 'だろ', basic_form: 'だ', grammatical: true, startsSeparateAuxiliaryUnit: true }) },
            { id: 'SYS-BOUNDARY-AUX-CONTINUATION-U', suite: 'unit', rule: 'An auxiliary continuation that does not start a new unit remains attached to the preceding auxiliary stem', input: 'だろ + う', expected: 'join', run: () => classifyTokenOutputBoundary({ surface_form: 'だろ', grammatical: true }, { surface_form: 'う', basic_form: 'う', grammatical: true, startsSeparateAuxiliaryUnit: false }) },
            { id: 'SYS-CASUAL-CONTRACTION-DERU', suite: 'unit', rule: 'Non-independent contracted でる is joined by morphology after a verb form', input: '読ん + でる', expected: '読んでる', run: () => mergeCasualSpeechTokens([{ surface_form: '読ん', reading: 'ヨン', pos: '動詞', pos_detail_1: '自立', basic_form: '読む' }, { surface_form: 'でる', reading: 'デル', pos: '動詞', pos_detail_1: '非自立', basic_form: 'でる' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-CASUAL-CONTRACTION-MISPARSED-STEM', suite: 'unit', rule: 'A contracted non-independent auxiliary can repair a Kuromoji stem-category misanalysis without hard-coding the lexical word', input: '恋し + てる', expected: '恋してる', run: () => mergeCasualSpeechTokens([{ surface_form: '恋し', reading: 'コイシ', pos: '形容詞', pos_detail_1: '自立', basic_form: '恋しい' }, { surface_form: 'てる', reading: 'テル', pos: '動詞', pos_detail_1: '非自立', basic_form: 'てる' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-CASUAL-CONTRACTION-INDEPENDENT-GUARD', suite: 'unit', rule: 'An independent lexical verb with the same visible ending is not swallowed as a contraction', input: '光 + 照る', expected: '光|照る', run: () => mergeCasualSpeechTokens([{ surface_form: '光', reading: 'ヒカリ', pos: '名詞', pos_detail_1: '一般', basic_form: '光' }, { surface_form: '照る', reading: 'テル', pos: '動詞', pos_detail_1: '自立', basic_form: '照る' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-DESIDERATIVE-GARU-METADATA', suite: 'unit', rule: 'Kuromoji たい/ガル接続 + suffix がる metadata is repaired as one productive desiderative chain without lexical hard-coding', input: '食べ + た(たい/ガル接続) + がっ + てる + ん + だ', expected: '食べたがってるんだ', run: () => mergeDesiderativeGaruTokens([{ surface_form: '食べ', reading: 'タベ', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる' }, { surface_form: 'た', reading: 'タ', pos: '助動詞', basic_form: 'たい', conjugated_form: 'ガル接続' }, { surface_form: 'がっ', reading: 'ガッ', pos: '動詞', pos_detail_1: '接尾', basic_form: 'がる' }, { surface_form: 'てる', reading: 'テル', pos: '動詞', pos_detail_1: '非自立', basic_form: 'てる' }, { surface_form: 'ん', reading: 'ン', pos: '名詞', pos_detail_1: '非自立', basic_form: 'ん' }, { surface_form: 'だ', reading: 'ダ', pos: '助動詞', basic_form: 'だ' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-DESIDERATIVE-GARU-MISPARSED-TAGATTE', suite: 'unit', rule: 'A contiguous verb-renyou + past-ta + ga + tte misparse is recovered as productive たがって when Kuromoji misses the desiderative analysis', input: '見 + た(過去) + が + って', expected: '見たがって', run: () => mergeDesiderativeGaruTokens([{ surface_form: '見', reading: 'ミ', pos: '動詞', pos_detail_1: '自立', basic_form: '見る', conjugated_form: '連用形' }, { surface_form: 'た', reading: 'タ', pos: '助動詞', basic_form: 'た', conjugated_form: '基本形', conjugated_type: '特殊・タ' }, { surface_form: 'が', reading: 'ガ', pos: '助詞', pos_detail_1: '接続助詞', basic_form: 'が' }, { surface_form: 'って', reading: 'ッテ', pos: '助詞', pos_detail_1: '格助詞', basic_form: 'って' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-DESIDERATIVE-GARU-NOUN-STEM-RECOVERY', suite: 'unit', rule: 'Strong たい/ガル接続 + がる metadata may recover a continuative stem that Kuromoji locally misclassified as an ordinary noun', input: '遊び(名詞誤解析) + た(たい/ガル接続) + がっ + て', expected: '遊びたがって', run: () => mergeDesiderativeGaruTokens([{ surface_form: '遊び', reading: 'アソビ', pos: '名詞', pos_detail_1: '一般', basic_form: '遊び' }, { surface_form: 'た', reading: 'タ', pos: '助動詞', basic_form: 'たい', conjugated_form: 'ガル接続' }, { surface_form: 'がっ', reading: 'ガッ', pos: '動詞', pos_detail_1: '接尾', basic_form: 'がる' }, { surface_form: 'て', reading: 'テ', pos: '助詞', pos_detail_1: '接続助詞', basic_form: 'て' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-DESIDERATIVE-GARU-PUNCT-GUARD', suite: 'unit', rule: 'Punctuation between conjunction が and quotative って blocks the surface-recovery path', input: '食べ + た + が + 、 + って', expected: '食べ|た|が|、|って', run: () => mergeDesiderativeGaruTokens([{ surface_form: '食べ', reading: 'タベ', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる', conjugated_form: '連用形' }, { surface_form: 'た', reading: 'タ', pos: '助動詞', basic_form: 'た', conjugated_form: '基本形', conjugated_type: '特殊・タ' }, { surface_form: 'が', reading: 'ガ', pos: '助詞', pos_detail_1: '接続助詞', basic_form: 'が' }, { surface_form: '、', reading: '、', pos: '記号', pos_detail_1: '読点', basic_form: '、' }, { surface_form: 'って', reading: 'ッテ', pos: '助詞', pos_detail_1: '格助詞', basic_form: 'って' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-REVIEWED-GODAN-RA-INFLECTION-INDEX', suite: 'unit', rule: 'A reviewed godan-ra lexical lemma generates ordinary inflected surface evidence instead of title-specific conjugated overrides', input: '告る -> 告らせたい', expected: 'こくらせたい', run: () => runtimeState.commonWordInflectionDictionary.get('告らせたい')?.reading || 'missing' },
            { id: 'SYS-KANA-RESCUE-GRAMMATICAL-TAIL-GUARD', suite: 'unit', rule: 'Reverse kana lexical evidence cannot swallow a grammatical tail after a verb stem', input: '食べ + て + い + ない', expected: '食べ|て|い|ない', run: () => mergeKanaLexicalReadingTokens([{ surface_form: '食べ', reading: 'タベ', pronunciation: 'タベ', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる' }, { surface_form: 'て', reading: 'テ', pronunciation: 'テ', pos: '助詞', pos_detail_1: '接続助詞', basic_form: 'て' }, { surface_form: 'い', reading: 'イ', pronunciation: 'イ', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる' }, { surface_form: 'ない', reading: 'ナイ', pronunciation: 'ナイ', pos: '助動詞', pos_detail_1: '*', basic_form: 'ない' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-KANA-RESCUE-ANNAI-PRESERVED', suite: 'unit', rule: 'The grammatical-tail guard preserves legitimate all-kana lexical rescue', input: 'あん + ない', expected: 'あんない', run: () => mergeKanaLexicalReadingTokens([{ surface_form: 'あん', reading: 'アン', pronunciation: 'アン', pos: '名詞', pos_detail_1: '一般', basic_form: 'あん' }, { surface_form: 'ない', reading: 'ナイ', pronunciation: 'ナイ', pos: '助動詞', pos_detail_1: '*', basic_form: 'ない' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-KANA-RESCUE-TOKYO-PRESERVED', suite: 'unit', rule: 'The grammatical-tail guard preserves a multi-token whole-kana lexical reading', input: 'とう + きょう', expected: 'とうきょう', run: () => mergeKanaLexicalReadingTokens([{ surface_form: 'とう', reading: 'トウ', pronunciation: 'トウ', pos: '名詞', pos_detail_1: '一般', basic_form: 'とう' }, { surface_form: 'きょう', reading: 'キョウ', pronunciation: 'キョウ', pos: '名詞', pos_detail_1: '一般', basic_form: 'きょう' }]).map(token => token.surface_form).join('|') },
            { id: 'R0-KANA-ORTHOGRAPHIC-PRONUNCIATION', suite: 'unit', rule: 'R0.7 may use Kuromoji pronunciation when it differs from the written kana only by an established particle-pronunciation spelling', input: 'あるいは / アルイハ / アルイワ', expected: 'aruiwa', run: () => convertToken({ surface_form: 'あるいは', reading: 'アルイハ', pronunciation: 'アルイワ', pos: '接続詞', pos_detail_1: '*', pos_detail_2: '*' }, 'あるいは') },
            { id: 'SRC-GRAMMAR-PARTICLE-EXPRESSION', suite: 'unit', rule: 'Configured particle expressions stay explicitly classified', input: 'について', expected: 'ni tsuite', run: () => runtimeState.particleExpressions['について'] || '' },
            { id: 'R0-GRAMMAR-BOUNDARY-AFTER-AUX', suite: 'unit', rule: 'R0.7 a complete particle-based expression starts a new romaji unit after a completed grammatical construction', input: 'いる + のに', expected: 'true', run: () => String(needsSpaceBeforeGrammaticalExpression({ surface_form: 'いる', pos: '動詞', grammatical: true })) },
            { id: 'R0-GRAMMAR-BOUNDARY-AFTER-PUNCT', suite: 'unit', rule: 'R0 punctuation does not create an extra word separator before a grammatical expression', input: '「 + のに', expected: 'false', run: () => String(needsSpaceBeforeGrammaticalExpression({ surface_form: '「', pos: '記号' })) },
            { id: 'SRC-CONJUGATION-DATA', suite: 'unit', rule: 'Conjugation joining is loaded from the compact grammar configuration', input: 'て', expected: 'true', run: () => String(runtimeState.conjugationJoinEndings.has('て')) },
            { id: 'CHECK-IRU-LEXICAL', suite: 'engine', rule: 'Independent lexical いる remains a lexical verb', input: '犬がいる', expected: 'Inu ga Iru' },
            { id: 'CHECK-IRU-AUX', suite: 'engine', rule: 'Non-independent いる remains an attached auxiliary', input: '食べている', expected: 'Tabete iru' },
            { id: 'SYS-AUX-FAMILY-ITA', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary across past forms', input: '食べていた', expected: 'Tabete ita' },
            { id: 'SYS-AUX-FAMILY-INAI', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary across negative forms', input: '食べていない', expected: 'Tabete inai' },
            { id: 'SYS-AUX-FAMILY-IMASU', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary before polite continuations', input: '食べています', expected: 'Tabete imasu' },
            { id: 'SYS-AUX-FAMILY-IMASHITA', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary across polite past forms', input: '食べていました', expected: 'Tabete imashita' },
            { id: 'SYS-AUX-KANA-SURU-ITA', suite: 'engine', rule: 'Kana lexical rescue must not swallow a productive する + ている past auxiliary chain', input: 'していた', expected: 'Shite ita' },
            { id: 'SYS-AUX-KANA-SURU-INAI', suite: 'engine', rule: 'Kana lexical rescue must not swallow a productive する + ている negative auxiliary chain', input: 'していない', expected: 'Shite inai' },
            { id: 'SYS-AUX-CHAIN-DAROU', suite: 'engine', rule: 'Separate grammatical units remain separate while inflectional continuations stay attached', input: '食べていただろう', expected: 'Tabete ita darou' },
            { id: 'SYS-AUX-CHAIN-NOMINAL-DAROU', suite: 'engine', rule: 'The same auxiliary-unit boundary rule applies after nominal predicates', input: '学生だろう', expected: 'Gakusei darou' },
            { id: 'SYS-AUX-CHAIN-ADJECTIVAL-DAROU', suite: 'engine', rule: 'The same auxiliary-unit boundary rule applies after adjectival predicates', input: '静かだろう', expected: 'Shizuka darou' },
            { id: 'SYS-AUX-CHAIN-DE-ARU', suite: 'engine', rule: 'Configured grammatical auxiliary units remain distinct instead of being concatenated by surface accident', input: '静かである', expected: 'Shizuka de aru' },
            { id: 'SYS-CASUAL-FAMILY-TABETERU', suite: 'engine', rule: 'Casual ている contraction remains one lexical-grammatical unit', input: '食べてる', expected: 'Tabeteru' },
            { id: 'SYS-CASUAL-FAMILY-YONDERU', suite: 'engine', rule: 'Casual でいる contraction remains one lexical-grammatical unit', input: '読んでる', expected: 'Yonderu' },
            { id: 'SYS-CASUAL-FAMILY-KOISHITERU', suite: 'engine', rule: 'Casual contraction repair is systemic even when Kuromoji misclassifies the preceding stem', input: '恋してる', expected: 'Koishiteru' },
            { id: 'SYS-CASUAL-FAMILY-AISHITERU', suite: 'engine', rule: 'Casual contraction repair generalises to another してる lexical verb', input: '愛してる', expected: 'Aishiteru' },
            { id: 'SYS-DESIDERATIVE-GARU-BASE', suite: 'engine', rule: 'Productive たがる joins to the preceding verb continuative through Kuromoji morphology', input: '食べたがる', expected: 'Tabetagaru', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-CONTRACTED', suite: 'engine', rule: 'Productive たがってる contraction remains one lexical-grammatical unit', input: '食べたがってる', expected: 'Tabetagatteru', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-UNCONTRACTED', suite: 'engine', rule: 'Uncontracted たがっている preserves the lexical desiderative chain while keeping auxiliary いる as a separate Rule-0 unit', input: '叫びたがっている', expected: 'Sakebitagatte iru', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-MISPARSED-MIRU', suite: 'engine', rule: 'Productive たがって is recovered when Kuromoji misreads 見た as past tense before がって', input: '見たがって', expected: 'Mitagatte', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-MISPARSED-TABERU', suite: 'engine', rule: 'Productive たがって is recovered in an ordinary continuation when Kuromoji misreads 食べた + が + って', input: '食べたがってしかたがない', expected: 'Tabetagatte Shikata ga Nai', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-NOUN-STEM-ASOBU', suite: 'engine', rule: 'Strong たい/がる morphology overrides a local noun-stem misclassification for 遊びたがって', input: '遊びたがって', expected: 'Asobitagatte', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-PUNCTUATED-CONJUNCTION', suite: 'engine', rule: 'An explicit comma preserves past-tense + conjunction + quotative structure instead of forcing desiderative recovery', input: '食べたが、って言った', expected: 'Tabeta ga, tte Itta', expectedRequiresReview: false },
            { id: 'SYS-DESIDERATIVE-GARU-NDA', suite: 'engine', rule: 'Contracted desiderative + explanatory んだ is reconstructed consistently when Kuromoji splits the chain', input: '帰りたがってるんだ', expected: 'Kaeritagatterunda', expectedRequiresReview: false },
            { id: 'SYS-REVIEWED-GODAN-RA-KOKURU', suite: 'engine', rule: 'Reviewed godan-ra lemma evidence resolves slang 告る productively', input: '告る', expected: 'Kokuru', expectedRequiresReview: false },
            { id: 'SYS-REVIEWED-GODAN-RA-KOKUTTE', suite: 'engine', rule: 'Reviewed godan-ra lemma evidence derives the sokuon te-form rather than storing a conjugated phrase', input: '告って', expected: 'Kokutte', expectedRequiresReview: false },
            { id: 'SYS-REVIEWED-GODAN-RA-KOKURANAI', suite: 'engine', rule: 'Reviewed godan-ra lemma evidence derives the negative form', input: '告らない', expected: 'Kokuranai', expectedRequiresReview: false },
            { id: 'SYS-REVIEWED-GODAN-RA-KOKURASETAI', suite: 'engine', rule: 'Reviewed godan-ra lemma evidence derives causative desiderative 告らせたい without a contextual override', input: 'かぐや様は告らせたい', expected: 'Kaguya sama wa Kokurasetai', expectedRequiresReview: false },
            { id: 'SYS-KOKOSAKE-MORPHOLOGY', suite: 'engine', rule: 'Reviewed 心 context plus productive たがる/contraction morphology resolves the title without an exact override', input: '心が叫びたがってるんだ。', expected: 'Kokoro ga Sakebitagatterunda.', expectedRequiresReview: false },
            { id: 'SYS-TITLE-DANMACHI-BOUNDARIES', suite: 'engine', rule: 'Long-title grammatical boundaries are derived from morphology rather than accidental token adjacency', input: '『ダンジョンに出会いを求めるのは間違っているだろうか』', expected: "'Dungeon ni Deai o Motomeru no wa Machigatte iru darou ka'" },
            { id: 'SYS-TITLE-KOISHITERU-PUNCT', suite: 'engine', rule: 'Casual contraction and punctuation finalisation coexist correctly in a long title', input: '『恋してると言えないままに、お前を抱いていいか。〜俺の不器用な溺愛と、彼女の隠された秘密〜』', expected: "'Koishiteru to Ienai Mama ni, Omae o Daite Ii ka. ~Ore no Bukiyou na Dekiai to, Kanojo no Kakusareta Himitsu~'" },
            { id: 'R0-LEXICAL-SHITE', suite: 'engine', rule: 'R0.7 して is a verb construction, not a particle expression', input: 'して', expected: 'Shite' },
            { id: 'R0-VERB-SHITTEIRU', suite: 'engine', rule: 'R0.7 lexical verb begins capitalised; attached auxiliary follows guide usage', input: '知っている', expected: 'Shitte iru' },
            { id: 'R0-VERB-ITTEIRU', suite: 'engine', rule: 'R0.7 lexical verb begins capitalised; attached auxiliary follows guide usage', input: '行っている', expected: 'Itte iru' },
            { id: 'R0-GRAMMAR-NONI-AFTER-AUX', suite: 'engine', rule: 'R0.7 a particle-based expression remains separate after a completed verb construction', input: '知っているのに', expected: 'Shitte iru noni' },
            { id: 'R0-GRAMMAR-NONI-AFTER-VERB', suite: 'engine', rule: 'R0.7 a particle-based expression remains separate after an ordinary lexical verb', input: '行くのに', expected: 'Iku noni' },
            { id: 'R0-PARTICLE-NI', suite: 'engine', rule: 'R0.7 particles remain lowercase', input: '学校に行く', expected: 'Gakkou ni Iku' },
            { id: 'R0-PARTICLE-E-NO', suite: 'engine', rule: 'R0.7 directional へ becomes e only as a particle', input: '僕への手紙', expected: 'Boku e no Tegami' },
            { id: 'R0-PARTICLE-O', suite: 'engine', rule: 'R0.7 object を becomes o', input: '手紙を書く', expected: 'Tegami o Kaku' },
            { id: 'R0-PARTICLE-O-2', suite: 'engine', rule: 'R0.7 object を becomes o', input: '日本語を話す', expected: 'Nihongo o Hanasu' },
            { id: 'R0-EXTREME-ARUIWA-TITLE', suite: 'engine', rule: 'Independent extreme title stress test keeps Rule 0 readings, punctuation, particles and lexical pronunciation together', input: '縫製人間ヌイグルマー：金色の髪の乙女、あるいは終末の日に彼が彼女を抱きしめた理由。', expected: "Housei Ningen Nuigurumaa: Kin'iro no Kami no Otome, Aruiwa Shuumatsu no Hi ni Kare ga Kanojo o Dakishimeta Riyuu." },
            { id: 'R0-PARTICLE-E', suite: 'engine', rule: 'R0.7 directional へ becomes e only as a particle', input: '学校へ行く', expected: 'Gakkou e Iku' },
            { id: 'R0-PARTICLE-NANODE', suite: 'engine', rule: 'R0.7 established particle-based expression remains lowercase', input: '嫌なので', expected: 'Iya nano de' },
            { id: 'R0-CAP-MATOMETE', suite: 'engine', rule: 'R0.7 ordinary lexical words, including adverbs, begin capitalised', input: '全員まとめて僕のもの', expected: "Zen'in Matomete Boku no Mono" },
            { id: 'CTX-CAP-ARIMASU-LEXICAL', suite: 'engine', rule: 'Ordinary lexical あります remains capitalised because lexical verbs are not particle-based grammatical expressions', input: '会議があります', expected: 'Kaigi ga Arimasu', expectedRequiresReview: false },
            { id: 'R0-INFLECTION-MASU', suite: 'engine', rule: 'R0.7 ordinary verb constructions are not particle expressions and remain one word', input: '思います', expected: 'Omoimasu' },
            { id: 'R0-AUX-DESHITA-SPACING', suite: 'engine', rule: 'R0.7 copular でした remains a separate grammatical unit after a completed noun', input: '剣でした', expected: 'Ken deshita' },
            { id: 'SRC-GRAMMAR-NI-TOTTE', suite: 'engine', rule: 'Rule 0 explicit particle-based expression from the guide', input: '彼にとって', expected: 'Kare ni totte' },
            { id: 'SRC-GRAMMAR-TO-SHITE', suite: 'engine', rule: 'Rule 0 explicit particle-based expression from the guide', input: '学生として', expected: 'Gakusei to shite' },
            { id: 'R0-CANONICAL-TITLE', suite: 'engine', rule: 'Rule 0 canonical example from Romaji Rules', input: '痛いのは嫌なので防御力に極振りしたいと思います。', expected: 'Itai no wa Iya nano de Bougyoryoku ni Kyokufuri Shitai to Omoimasu.' },
            { id: 'DIFF-SHITAPPARA', suite: 'engine', rule: 'Reviewed whole-word evidence repairs a false verbal split', input: '下っ腹', expected: 'Shitappara' },
            { id: 'R0-SOKUON-VERB-ONBIN', suite: 'engine', rule: '促音便 in a godan verb remains ordinary consonant doubling', input: '待って', expected: 'Matte' },
            { id: 'R0-SOKUON-VERB-IKU-EXCEPTION', suite: 'engine', rule: 'The 行く te-form exception preserves its written sokuon', input: '行って', expected: 'Itte' },
            { id: 'STRESS-VARIANT-SEJI', suite: 'engine', rule: 'General old-form Kanji normalisation reaches the same whole-word reading as the canonical spelling', input: 'お世辭', expected: 'Oseji' },
            { id: 'STRESS-VARIANT-GRAMMAR-GUARD', suite: 'engine', rule: 'Variant normalisation must preserve canonical particle and word boundaries rather than flattening a phrase', input: 'ことが出來る', expected: 'Koto ga Dekiru' },
            { id: 'STRESS-GRAMMAR-RESCUE-GUARD', suite: 'engine', rule: 'Authoritative evidence rescue must not flatten already-resolvable grammar', input: 'せざるを得ない', expected: 'Sezaru o Enai' },
            { id: 'TITLE-DEAIMON', suite: 'engine', rule: 'Scoped title-spelling evidence preserves Deaimon without a whole-input bypass', input: 'であいもん', expected: 'Deaimon', expectedRequiresReview: false },
            { id: 'CHECK-BARAKAMON', suite: 'engine', rule: 'Scoped title-word evidence preserves Barakamon without applying false particle boundaries', input: 'ばらかもん', expected: 'Barakamon', expectedRequiresReview: false }
        ];
    }

    function getAmbiguityAndAuditRegressionChecks() {
        return [
            { id: 'CTX-FINAL-MARKET-PHYSICAL', suite: 'engine', rule: 'Sentence context selects the physical-place 市場 reading from attested candidates when surrounding lexical evidence supports buying at a market', input: '市場で魚を買う', expected: 'Ichiba de Sakana o Kau', expectedRequiresReview: false },
            { id: 'CTX-FINAL-MARKET-ECONOMIC', suite: 'engine', rule: 'Sentence context selects the economic 市場 reading from attested candidates when surrounding financial evidence supports it', input: '株式市場を調査する', expected: 'Kabushikishijou o Chousa Suru', expectedRequiresReview: false },
            { id: 'CTX-FINAL-MARKET-AMBIGUOUS-REVIEW', suite: 'engine', rule: 'When whole-sentence context does not distinguish legitimate 市場 readings, the existing reading is retained but the result remains reviewable instead of gaining false confidence', input: '市場に行く', expected: 'Shijou ni Iku', expectedRequiresReview: true },
            { id: 'CHECK-MARKET-FRUIT-CLEAR', suite: 'engine', rule: 'Physical-market context remains confident when a downstream lexical selection supersedes weak alternative-list uncertainty on 果物', input: '市場で果物を買う', expected: 'Ichiba de Kudamono o Kau', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-WATER-CLEAR', suite: 'engine', rule: 'Resolved counter/duration structure does not remain reviewable solely because the exact dictionary lists alternative readings for 水', input: '一日二回水を飲む', expected: 'Ichinichi Nikai Mizu o Nomu', expectedRequiresReview: false },
            { id: 'CHECK-BOOK-COMPOUND-VERB-CLEAR', suite: 'engine', rule: 'Object and predicate context may supersede weak lexical alternatives for 本 without erasing the alternative candidates from diagnostics', input: '本を読み始める', expected: 'Hon o Yomihajimeru', expectedRequiresReview: false },
            { id: 'CHECK-ERU-CONTEXT-CLEAR', suite: 'engine', rule: 'Context-selected 得る is not reviewable solely because legitimate dictionary readings include both える and うる', input: '信用を得る', expected: "Shin'you o Eru", expectedRequiresReview: false },
            { id: 'CHECK-MARKET-NEUTRAL-REVIEW', suite: 'engine', rule: 'Neutral 市場 context retains final-active uncertainty when sentence-level evidence cannot safely distinguish いちば from しじょう', input: '市場について話す', expected: 'Shijou ni tsuite Hanasu', expectedRequiresReview: true },
            { id: 'CHECK-NOMINAL-COMPOUND-REVIEW', suite: 'engine', rule: 'Weak lexical alternatives remain final-active inside an unresolved contiguous nominal compound rather than being cleared merely because other title material exists', input: '仙狐伝説', expected: 'Sen Kitsune Densetsu', expectedRequiresReview: true },
            { id: 'LEX-NAME-PRECEDENCE-SHINSHOU', suite: 'engine', rule: 'Strong ordinary-word and exact counter-class dictionary evidence override a Viterbi personal-name reading inside an ordinary noun-prefix compound', input: '新章', expected: 'Shinshou', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-ZOKUSHOU', suite: 'engine', rule: 'Ordinary compound morphology prevents the personal-name reading of 章 after the noun prefix 続', input: '続章', expected: 'Zokushou', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-SHOUMATSU', suite: 'engine', rule: 'Strong ordinary-word plus exact counter-class evidence overrides a Viterbi personal-name reading when a non-name nominal suffix establishes ordinary compound context', input: '章末', expected: 'Shoumatsu', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-AUDIT', suite: 'unit', rule: 'Ordinary compound precedence is explicit in audit provenance rather than silently mutating the tokenizer reading', input: '新章 audit', expected: 'しょう:ordinary-compound-context:false', run: () => { const audit = runTranslatorReadingAudit('新章'); const reading = audit.readings.find(item => item.surface === '章'); return `${reading?.reading || ''}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'LEX-NAME-PRECEDENCE-PERSON-CONTROL', suite: 'engine', rule: 'A genuine surname-plus-given-name context retains the reviewed personal-name reading of 章', input: '山田章', expected: 'Yamada Akira', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-WHOLE-NAME-CONTROL', suite: 'engine', rule: 'A whole proper-name token is unaffected by ordinary compound precedence', input: '章太郎', expected: 'Shoutarou', expectedRequiresReview: false },
            { id: 'CHECK-LIFECYCLE-SUPERSEDED', suite: 'unit', rule: 'A weak lexical ambiguity signal retains provenance while transitioning candidate -> active -> superseded after contextual selection', input: '本を読む lifecycle', expected: 'superseded:candidate>active>superseded:false', run: () => { const audit = runTranslatorReadingAudit('本を読む'); const signal = audit.redFlags.find(item => item.flag === 'general-word-alternative'); return `${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'CHECK-LIFECYCLE-FINAL-ACTIVE', suite: 'unit', rule: 'Standalone unresolved lexical ambiguity transitions candidate -> active -> final-active and still requires review', input: '上手 lifecycle', expected: 'final-active:candidate>active>final-active:true', run: () => { const audit = runTranslatorReadingAudit('上手'); const signal = audit.redFlags.find(item => item.flag === 'whole-word-reading-ambiguous'); return `${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'MECH-UNCERTAINTY-FREQUENCY-FALLBACK-RETAINS-AMBIGUITY', suite: 'unit', rule: 'Frequency evidence may provide a printable preferred reading, but legitimate alternatives remain reviewable instead of being cleared by successful fallback output', input: 'synthetic frequency fallback ambiguity', expected: 'frequency-evidence-fallback:true:true:true:2', run: () => { const surface = '試験曖昧語'; const previous = runtimeState.readingEvidenceDictionary.get(surface); try { runtimeState.readingEvidenceDictionary.set(surface, { preferredReading: 'しけんあいまいご', preferredPriority: 200, preferredRank: 1, alternatives: [{ reading: 'しけんあいまいこと', priority: 0, rank: 1000 }] }); const token = { surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }; const resolution = resolveTokenReading(token, surface); const diagnosticToken = { ...token, value: convertToRomaji(resolution.reading || ''), readingResolution: resolution }; const audit = buildTranslationDiagnostics(surface, surface, diagnosticToken.value, [diagnosticToken]); return `${resolution.source}:${String(Boolean(resolution.ambiguous))}:${String(resolution.flags.includes('whole-word-reading-ambiguous'))}:${String(audit.requiresReview)}:${resolution.candidates.length}`; } finally { if (previous) runtimeState.readingEvidenceDictionary.set(surface, previous); else runtimeState.readingEvidenceDictionary.delete(surface); } } },
            { id: 'MECH-UNCERTAINTY-SENTENCE-CONTEXT-SUPERSESSION-PROVENANCE', suite: 'unit', rule: 'When stronger sentence evidence resolves contextual ambiguity, the old uncertainty remains visible as superseded provenance rather than disappearing silently', input: '市場 + final contextual resolution provenance', expected: 'いちば:superseded:candidate>superseded:false', run: () => { const tokens = [{ surface_form: '市場', word_position: 1, pos: '名詞', basic_form: '市場' }, { surface_form: '魚を買う', word_position: 4, pos: '名詞', basic_form: '魚を買う' }]; const provisional = [makeReadingResolution(tokens[0], { reading: 'しじょう', source: 'kuromoji-context', confidence: 0.70, flags: ['contextual-reading-ambiguous'], ambiguous: true }), makeReadingResolution(tokens[1], { reading: 'さかなをかう', source: 'kuromoji-context', confidence: 0.90 })]; const verified = verifySentenceLevelResolutions(tokens, provisional, '市場で魚を買う'); const signal = verified[0].reviewSignals.find(item => item.flag === 'contextual-reading-ambiguous'); return `${normalizeKanaReading(verified[0].reading || '')}:${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'MECH-UNCERTAINTY-SENTENCE-CONTEXT-PRESERVES-INDEPENDENT-CONFLICT', suite: 'unit', rule: 'Sentence context may supersede the ambiguity it resolves, but it must not erase an independent reading-evidence conflict', input: '市場 + contextual selection + independent conflict', expected: 'superseded:final-active:true', run: () => { const tokens = [{ surface_form: '市場', word_position: 1, pos: '名詞', basic_form: '市場' }, { surface_form: '魚を買う', word_position: 4, pos: '名詞', basic_form: '魚を買う' }]; const provisional = [makeReadingResolution(tokens[0], { reading: 'しじょう', source: 'kuromoji-context', confidence: 0.68, flags: ['contextual-reading-ambiguous', 'reading-evidence-conflict'], ambiguous: true }), makeReadingResolution(tokens[1], { reading: 'さかなをかう', source: 'kuromoji-context', confidence: 0.90 })]; const verified = verifySentenceLevelResolutions(tokens, provisional, '市場で魚を買う'); const diagnosticTokens = tokens.map((token, index) => ({ ...token, value: convertToRomaji(verified[index].reading || ''), readingResolution: verified[index] })); const audit = buildTranslationDiagnostics('市場で魚を買う', '市場で魚を買う', 'Ichiba de Sakana o Kau', diagnosticTokens); const contextual = audit.redFlags.find(item => item.flag === 'contextual-reading-ambiguous'); const conflict = audit.redFlags.find(item => item.flag === 'reading-evidence-conflict'); return `${contextual?.state || ''}:${conflict?.state || ''}:${String(audit.requiresReview)}`; } },
            { id: 'MECH-UNCERTAINTY-VARIANT-NAME-AUDIT-PRESERVES-AMBIGUITY', suite: 'unit', rule: 'Canonicalising a variant surname must not let Kuromoji plus frequency ranking erase a legitimate whole-name reading alternative', input: '山﨑 audit', expected: 'proper-noun-variant+kuromoji:proper-noun-ambiguous:final-active:true', run: () => { const audit = runTranslatorReadingAudit('山﨑'); const reading = audit.readings[0]; const signal = audit.redFlags.find(item => item.flag === 'proper-noun-ambiguous'); return `${reading?.source || ''}:${(reading?.flags || []).includes('proper-noun-ambiguous') ? 'proper-noun-ambiguous' : 'clear'}:${signal?.state || ''}:${String(audit.requiresReview)}`; } },
            { id: 'MECH-UNCERTAINTY-SOURCE-SPELLING-UNCERTAINTY-FINAL-ACTIVE', suite: 'unit', rule: 'Mechanical Katakana conversion does not clear unresolved source-language spelling evidence merely because printable Romaji was produced', input: 'パーティー audit', expected: 'missing-source-spelling-evidence:final-active:true:true', run: () => { const audit = runTranslatorReadingAudit('パーティー'); const signal = audit.redFlags.find(item => item.flag === 'missing-source-spelling-evidence'); return `${signal?.flag || ''}:${signal?.state || ''}:${String(Boolean(signal?.requiresReview))}:${String(audit.statistics?.resolvedOutputRequiresReview)}`; } },
            { id: 'MECH-UNCERTAINTY-READING-CONFLICT-FINAL-ACTIVE', suite: 'unit', rule: 'Independent reading conflict remains reviewable even when the resolver can emit a plausible Romaji candidate', input: '僕 / しもべ synthetic resolver conflict', expected: 'reading-evidence-conflict:final-active:true', run: () => { const token = { surface_form: '僕', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: 'シモベ', pronunciation: 'シモベ' }; const resolution = resolveTokenReading(token, '僕'); const diagnosticToken = { ...token, value: convertToRomaji(resolution.reading || ''), readingResolution: resolution }; const audit = buildTranslationDiagnostics('僕', '僕', diagnosticToken.value, [diagnosticToken]); const signal = audit.redFlags.find(item => item.flag === 'reading-evidence-conflict'); return `${signal?.flag || ''}:${signal?.state || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CTX-FINAL-RAW-SOURCE-RECOVERY', suite: 'unit', rule: 'The final sentence scan can recover contextual evidence hidden inside an already-merged token without letting the earlier token-only pass guess from substrings', input: '市場 + merged 魚を買う token', expected: 'none=>いちば', run: () => { const tokens = [{ surface_form: '市場', word_position: 1, pos: '名詞', basic_form: '市場' }, { surface_form: '魚を買う', word_position: 4, pos: '名詞', basic_form: '魚を買う' }]; const evidence = getContextualReadingEvidenceForToken(tokens[0]); const early = evaluateContextualReadingEvidence(tokens, 0, evidence); const final = evaluateContextualReadingEvidence(tokens, 0, evidence, { finalPass: true, sourceText: '市場で魚を買う' }); return `${early.selected?.reading || 'none'}=>${final.selected?.reading || 'none'}`; } },
            { id: 'CTX-FINAL-AUTHORITATIVE-PROTECTION', suite: 'unit', rule: 'Sentence-level verification cannot replace an authoritative reading merely because contextual evidence favours another attested candidate', input: 'authoritative 市場 reading under physical context', expected: 'しじょう:exact-override', run: () => { const tokens = [{ surface_form: '市場', word_position: 1, pos: '名詞', basic_form: '市場' }, { surface_form: '魚を買う', word_position: 4, pos: '名詞', basic_form: '魚を買う' }]; const provisional = [makeReadingResolution(tokens[0], { reading: 'しじょう', source: 'exact-override', confidence: 1 }), makeReadingResolution(tokens[1], { reading: 'さかなをかう', source: 'kuromoji-context', confidence: 0.9 })]; const verified = verifySentenceLevelResolutions(tokens, provisional, '市場で魚を買う'); return `${verified[0].reading}:${verified[0].source}`; } },
            { id: 'SYS-AUDIT-SOKUON-BEFORE-VOWEL', suite: 'unit', rule: 'A sokuon before a vowel is a reviewable non-geminative context rather than ordinary consonant doubling', input: 'あっあ', expected: 'true', run: () => String(hasNonGeminativeSokuonReviewCondition('あっあ')) },
            { id: 'SYS-AUDIT-SOKUON-BEFORE-SONORANT', suite: 'unit', rule: 'Rare sokuon before n/m/r/w/y is reviewable instead of being guessed', input: 'あっら', expected: 'true', run: () => String(hasNonGeminativeSokuonReviewCondition('あっら')) },
            { id: 'SYS-AUDIT-SOKUON-NONGEMINATIVE-FAMILIES', suite: 'unit', rule: 'Vowels and n/m/r/w/y followers all stay outside automatic sokuon doubling', input: 'vowels+n/m/r/w/y', expected: 'true', run: () => String(['あ','い','う','え','お','ん','ま','ら','わ','や'].every(next => hasNonGeminativeSokuonReviewCondition(`あっ${next}`))) },
            { id: 'SYS-AUDIT-REPEATED-SOKUON', suite: 'unit', rule: 'Repeated sokuon is stylised writing and is reviewable', input: 'あっっ！', expected: 'true', run: () => String(hasRepeatedSokuonReviewCondition('あっっ！')) },
            { id: 'SYS-AUDIT-MODERN-FULL-SIZE-TSU-GUARD', suite: 'unit', rule: 'Ordinary modern full-size つ is not globally reinterpreted as sokuon', input: 'いつか', expected: 'false', run: () => String(buildTranslationDiagnostics('いつか', 'いつか', 'Itsuka', [{ surface_form: 'いつか', pos: '副詞', value: 'Itsuka', readingResolution: { source: 'written-kana', confidence: 1, reading: 'いつか', candidates: [], flags: [], variantMappings: [] } }], { historicalKana: false }).requiresReview) },
            { id: 'SYS-AUDIT-INITIAL-REGULAR-SOKUON', suite: 'unit', rule: 'A leading sokuon still follows the ordinary doubling rule when a valid consonant follows', input: 'っす', expected: 'ssu', run: () => convertToRomaji('っす') },
            { id: 'SYS-AUDIT-WHOLE-WORD-AMBIGUITY', suite: 'unit', rule: 'A known whole-word reading ambiguity is promoted to requiresReview', input: 'whole-word-reading-ambiguous', expected: 'true', run: () => String(buildTranslationDiagnostics('上手', '上手', 'Jouzu', [{ surface_form: '上手', pos: '名詞', value: 'Jouzu', readingResolution: { source: 'kuromoji', confidence: 0.78, reading: 'じょうず', candidates: [], flags: ['whole-word-reading-ambiguous'], variantMappings: [] } }]).requiresReview) },
            { id: 'UNRESOLVED-RANKED-SINGLE-AMBIGUOUS', suite: 'unit', rule: 'Ambiguous general-word evidence may provide a provisional top-ranked reading while retaining ambiguity rather than returning no reading', input: '閾 / general-word fallback', expected: 'しきい:general-word-ranked-ambiguous:true', run: () => { const resolution = resolveGeneralWordFallback({ surface_form: '閾', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }); return `${normalizeKanaReading(resolution?.reading || '')}:${resolution?.source || ''}:${String(Boolean(resolution?.ambiguous))}`; } },
            { id: 'UNRESOLVED-RANKED-ENGINE-MERGESAFE', suite: 'engine', rule: 'Ranked ambiguous whole-word evidence produces usable Romaji but remains review-required', input: '凉風', expected: 'Ryoufuu', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-ENGINE-NONMERGESAFE', suite: 'engine', rule: 'An exact whole-input non-merge-safe ambiguous lexeme produces provisional Romaji while retaining review', input: '頰笑む', expected: 'Hohoemu', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-REVIEWED-PREFERENCE-PRECEDENCE', suite: 'engine', rule: 'Reviewed reading preference still outranks the generic whole-input ambiguous general-word fallback', input: '陌', expected: 'Haku', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-THIRTY-CONTRACT', suite: 'unit', rule: 'The historical 30 genuine multi-reading cases all produce Romaji while remaining review-required; ambiguity is not converted into literal unresolved output', input: '30 historical ambiguous surfaces', expected: '30:0:30', run: () => { const surfaces = ['その儘','佰','凉風','剝す','匕','卌','召請','否々','塡める','弍','弎','弐','引繰り返る','拋る','捌','焰','玖','疋','筝','菴','蕈','貮','適確','銜む','鋼鈑','閾','閾値','陌','頰','頰笑む']; const results = surfaces.map(surface => translateAuditForGeneratedQa(surface, false)); return `${results.length}:${results.filter(item => item.output.includes('[Unresolved]')).length}:${results.filter(item => item.requiresReview).length}`; } },
            { id: 'SYS-ITERATION-MARK-UNATTESTED-REVIEW', suite: 'unit', rule: 'A structurally repeated 々 form without reviewed whole-word evidence is romanised conservatively but remains reviewable for word-level reading and Rendaku', input: '旅々', expected: 'Tabitabi:review', run: () => { const audit = translateAuditForGeneratedQa('旅々', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'SYS-ITERATION-MARK-ATTESTED-CLEAR', suite: 'unit', rule: 'A known 々 word with authoritative lexical evidence remains confident and is not replaced by the structural fallback', input: '人々', expected: 'Hitobito:clear', run: () => { const audit = translateAuditForGeneratedQa('人々', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-ORTHO-BARE-SMALL-KA-SCOPE', suite: 'unit', rule: 'Bare ヵ remains mechanically romanisable as ka while contextual orthographic uncertainty stays reviewable', input: 'ヵ audit', expected: 'Ka:written-kana:false:true', run: () => { const audit = runTranslatorReadingAudit('ヵ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-SMALL-KE-SCOPE', suite: 'unit', rule: 'Bare ヶ remains mechanically romanisable as ke while contextual orthographic uncertainty stays reviewable', input: 'ヶ audit', expected: 'Ke:written-kana:false:true', run: () => { const audit = runTranslatorReadingAudit('ヶ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-ITERATION-SCOPE', suite: 'unit', rule: 'A bare kana iteration mark is recognised Japanese orthography but cannot be resolved without a preceding syllable', input: 'ゞ audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('ゞ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-SHIME-SCOPE', suite: 'unit', rule: 'Bare 〆 is recognised Japanese orthography but remains reviewable without lexical context', input: '〆 audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('〆'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-DAKUTEN-SCOPE', suite: 'unit', rule: 'A standalone spacing dakuten cannot leak silently and is retained in the audit as unresolved Japanese orthography', input: '゛ audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('゛'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-SHIME-LEXICAL-CONTROL', suite: 'unit', rule: 'Evidence-backed 〆 remains clear and is not displaced by the unresolved-orthography fallback', input: '〆切る audit', expected: 'Shimekiru:clear', run: () => { const audit = translateAuditForGeneratedQa('〆切る', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-ORTHO-ITERATION-LEXICAL-CONTROL', suite: 'unit', rule: 'A dictionary-resolved kana iteration word remains clear and is not displaced by the structural fallback', input: 'いすゞ audit', expected: 'Isuzu:clear', run: () => { const audit = translateAuditForGeneratedQa('いすゞ', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-ORTHO-ITERATION-SCRIPT-GUARD', suite: 'unit', rule: 'A kana iteration mark from the wrong script is not guessed as a valid repetition', input: 'さヾ audit', expected: 'sa [Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('さヾ'); const reading = audit.readings[audit.readings.length - 1]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'SYS-AUDIT-TERMINAL-SOKUON-REVIEW', suite: 'unit', rule: 'A terminal small っ is reviewable because Rule 0 only defines sokuon before a following consonant', input: 'terminal-sokuon-review', expected: 'true', run: () => String(buildTranslationDiagnostics('そっ？', 'そっ?', 'So?', [{ surface_form: 'そっ', pos: '感動詞', value: 'so', readingResolution: { source: 'written-kana', confidence: 1, reading: 'そっ', candidates: [], flags: [], variantMappings: [] } }]).requiresReview) },
            { id: 'SYS-AUDIT-TERMINAL-KATAKANA-SOKUON', suite: 'unit', rule: 'Expressive final ッ is the same reviewable terminal-sokuon condition as final っ', input: 'ドキッ', expected: 'true', run: () => String(hasTerminalSokuonReviewCondition('ドキッ')) },
            { id: 'SYS-AUDIT-MEDIAL-SOKUON-CLEAR', suite: 'unit', rule: 'Ordinary medial sokuon with a following consonant is not a terminal-sokuon review condition', input: 'きっぷ', expected: 'false', run: () => String(hasTerminalSokuonReviewCondition('きっぷ')) },
            { id: 'SYS-NUMERIC-LITERAL-LEXICAL-AMBIGUITY', suite: 'unit', rule: 'A numeral-only string tokenised as a proper name is reviewable instead of silently treated as an unambiguous number or name', input: '九十九', expected: 'true', run: () => String(buildTranslationDiagnostics('九十九', '九十九', 'Tsukumo', [{ surface_form: '九十九', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', value: 'Tsukumo', readingResolution: { source: 'kuromoji-context', confidence: 0.8, reading: 'つくも', candidates: [], flags: [], variantMappings: [] } }]).requiresReview) },
            { id: 'READING-RESOLUTION-SUPPORTED-KANJI-FALLBACK', suite: 'unit', rule: 'Supported Han without stronger whole-word evidence emits the best evidence-backed character candidate instead of literal unresolved output', input: '𠮷', expected: 'japanese-scope-character-fallback', run: () => resolveTokenReading({ surface_form: '𠮷', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }, '𠮷').source },
            { id: 'READING-RESOLUTION-NAME-RANKED-AMBIGUITY', suite: 'unit', rule: 'The reading resolver keeps raw Romaji lowercase while retaining legitimate name ambiguity for final Rule 0 formatting', input: '山﨑 / 山崎 name readings', expected: 'yamazaki:ambiguous', run: () => { const resolution = resolveProperNounReading({ surface_form: '山﨑', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓', reading: '*', pronunciation: '*' }); return `${resolution?.romaji || ''}:${resolution?.ambiguous ? 'ambiguous' : 'resolved'}`; } },
            { id: 'RANK-NAME-EQUAL-EVIDENCE', suite: 'unit', rule: 'Equal legitimate name readings remain unresolved without contextual evidence', input: '50 / 50', expected: 'ambiguous', run: () => rankProperNounCandidates([{ reading: 'a', weight: 50, rank: 100, sources: new Set(['a']) }, { reading: 'b', weight: 50, rank: 100, sources: new Set(['a']) }]).selected ? 'selected' : 'ambiguous' },
            { id: 'ADV-PROPER-NOUN-KUROMOJI-DOES-NOT-ERASE-EQUAL-AMBIGUITY', suite: 'unit', rule: 'A Kuromoji reading alone does not resolve equally supported proper-name alternatives', input: '日本 / ニッポン', expected: 'ambiguous', run: () => resolveProperNounReading({ surface_form: '日本', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '*', reading: 'ニッポン', pronunciation: 'ニッポン' })?.ambiguous ? 'ambiguous' : 'resolved' },
            { id: 'SYS-PROPER-NOUN-KUROMOJI-AMBIGUITY-CONTRACT', suite: 'unit', rule: 'Either Kuromoji choice remains reviewable when the proper-name evidence itself is tied', input: 'synthetic tied readings', expected: 'ambiguous:ambiguous', run: () => { const surface = '試験曖昧名'; const previous = runtimeState.properNounDictionary.get(surface); const candidates = new Map([['こう', { reading: 'こう', romaji: 'kou', weight: 50, rank: 100, categories: new Set(['loc']), sources: new Set(['qa']) }], ['ぎょう', { reading: 'ぎょう', romaji: 'gyou', weight: 50, rank: 100, categories: new Set(['loc']), sources: new Set(['qa']) }]]); try { runtimeState.properNounDictionary.set(surface, candidates); const makeToken = reading => ({ surface_form: surface, pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '*', reading, pronunciation: reading }); const left = resolveProperNounReading(makeToken('コウ')); const right = resolveProperNounReading(makeToken('ギョウ')); return `${left?.ambiguous ? 'ambiguous' : 'resolved'}:${right?.ambiguous ? 'ambiguous' : 'resolved'}`; } finally { if (previous) runtimeState.properNounDictionary.set(surface, previous); else runtimeState.properNounDictionary.delete(surface); } } },
            { id: 'R0-NO-HAN-GUARD', suite: 'unit', rule: 'The Romaji output guard never allows unresolved Han to leak through', input: 'ABC𠮷DEF', expected: 'ABC[Unresolved]DEF', run: () => blockUnresolvedHanFromRomaji('ABC𠮷DEF') },
            { id: 'CHECK-EXACT-OVERRIDE-REJECT-HAN', suite: 'unit', rule: 'Exact override evidence cannot contain unresolved Han', input: '猫 → 猫', expected: 'rejected', run: () => { try { validateAssetSchema('exactOverrides', { 猫: '猫' }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-EXACT-OVERRIDE-GUARD-AUDIT', suite: 'unit', rule: 'A malformed in-memory exact override cannot silently bypass the final script guard and audit review signal', input: '猫 → 猫', expected: '[Unresolved]:review', run: () => { const previousOverrides = runtimeState.overrides; const previousEnabled = runtimeState.overridesEnabled; const previousCapture = runtimeState.captureTranslationDiagnostics; const previousDiagnostics = runtimeState.lastTranslationDiagnostics; try { runtimeState.overrides = { 猫: '猫' }; runtimeState.overridesEnabled = true; runtimeState.captureTranslationDiagnostics = true; runtimeState.lastTranslationDiagnostics = null; const output = translateText('猫'); return `${output}:${runtimeState.lastTranslationDiagnostics?.requiresReview ? 'review' : 'clear'}`; } finally { runtimeState.overrides = previousOverrides; runtimeState.overridesEnabled = previousEnabled; runtimeState.captureTranslationDiagnostics = previousCapture; runtimeState.lastTranslationDiagnostics = previousDiagnostics; } } },
            { id: 'CHECK-EXACT-OVERRIDE-SAFE-AUDIT', suite: 'unit', rule: 'A Rule 0-safe exact override stays high-confidence and does not create a false review signal', input: '猫 → Neko', expected: 'Neko:clear', run: () => { const previousOverrides = runtimeState.overrides; const previousEnabled = runtimeState.overridesEnabled; const previousCapture = runtimeState.captureTranslationDiagnostics; const previousDiagnostics = runtimeState.lastTranslationDiagnostics; try { runtimeState.overrides = { 猫: 'Neko' }; runtimeState.overridesEnabled = true; runtimeState.captureTranslationDiagnostics = true; runtimeState.lastTranslationDiagnostics = null; const output = translateText('猫'); return `${output}:${runtimeState.lastTranslationDiagnostics?.requiresReview ? 'review' : 'clear'}`; } finally { runtimeState.overrides = previousOverrides; runtimeState.overridesEnabled = previousEnabled; runtimeState.captureTranslationDiagnostics = previousCapture; runtimeState.lastTranslationDiagnostics = previousDiagnostics; } } },
            { id: 'DATA-ROMAJI-REJECT-HAN', suite: 'unit', rule: 'Reviewed Romaji evidence cannot contain unresolved Han', input: '大阪城', expected: 'false', run: () => String(isRule0RomajiEvidence('大阪城')) },
            { id: 'R0-DATA-ROMAJI-REJECT-DIACRITIC', suite: 'unit', rule: 'Rule 0 reviewed Romaji evidence rejects non-ASCII Latin diacritics', input: 'Nausicaä', expected: 'false', run: () => String(isRule0RomajiEvidence('Nausicaä')) },
            { id: 'R0-SUPPORTED-KANJI-ROMAJI', suite: 'unit', rule: 'Supported Han is mechanically Romanised from available Japanese reading evidence even when the selected candidate still requires review', input: '𠮷', expected: 'kichi', run: () => convertToken({ surface_form: '𠮷', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }, '𠮷') },
            { id: 'SRC-GENERAL-WORD-AMBIGUITY', suite: 'unit', rule: 'Close legitimate complete-word alternatives remain unresolved rather than being guessed', input: '日本 / Jitendex alternatives', expected: 'ambiguous', run: () => resolveGeneralWordFallback({ surface_form: '日本', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' })?.ambiguous ? 'ambiguous' : 'resolved' },
            { id: 'SRC-READING-EVIDENCE-BOKU', suite: 'unit', rule: 'Strong lexical and frequency evidence flags a suspicious alternative without overriding context', input: '僕 / しもべ', expected: 'ぼく', run: () => getReadingEvidenceAssessment({ surface_form: '僕', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' }, 'シモベ')?.preferredReading || '' },
            { id: 'SRC-READING-EVIDENCE-NIHON', suite: 'unit', rule: 'Close legitimate alternatives are not flagged by the strong-evidence threshold', input: '日本 / にっぽん', expected: '', run: () => getReadingEvidenceAssessment({ surface_form: '日本', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' }, 'ニッポン')?.preferredReading || '' },
            { id: 'CHECK-AUDIT-PUNCT-IGNORED', suite: 'unit', rule: 'Punctuation does not count as reading evidence in audits', input: '学校。', expected: '0', run: () => String(buildTranslationDiagnostics('学校。', '学校。', 'Gakkou.', [{ surface_form: '。', pos: '記号', value: '.', readingResolution: makeReadingResolution({ surface_form: '。' }, { reading: '。', source: 'surface-fallback', flags: ['fallback-reading'] }) }]).readings.length) },
            { id: 'CHECK-BARE-WI-HIRAGANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete hiragana ゐ to modern い before tokenisation', input: 'ゐ', expected: 'I', expectedRequiresReview: false },
            { id: 'CHECK-BARE-WI-KATAKANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete katakana ヰ to modern イ before tokenisation while preserving the normal Katakana review policy', input: 'ヰ', expected: 'I', expectedRequiresReview: true },
            { id: 'CHECK-BARE-WE-HIRAGANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete hiragana ゑ to modern え from existing official historical-kana evidence', input: 'ゑ', expected: 'E', expectedRequiresReview: false },
            { id: 'CHECK-BARE-WE-KATAKANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete katakana ヱ to modern エ while preserving the normal Katakana review policy', input: 'ヱ', expected: 'E', expectedRequiresReview: true },
            { id: 'CHECK-WIRU-MODERN', suite: 'engine', rule: 'Modern mode applies the obsolete W-row kana normalisation inside a lexical hiragana form', input: 'ゐる', expected: 'Iru', expectedRequiresReview: false },
            { id: 'CHECK-MAWIRU-MODERN', suite: 'engine', rule: 'Modern mode applies obsolete ゐ normalisation medially without requiring a whole-word historical override', input: 'まゐる', expected: 'Mairu', expectedRequiresReview: false },
            { id: 'CHECK-KOWE-MODERN', suite: 'engine', rule: 'Modern mode applies obsolete ゑ normalisation medially using the same W-row orthographic class', input: 'こゑ', expected: 'Koe', expectedRequiresReview: false },
            { id: 'CHECK-UWERU-MODERN', suite: 'engine', rule: 'Modern mode resolves an all-kana historical W-row spelling by normalising only the obsolete kana before ordinary analysis', input: 'うゑる', expected: 'Ueru', expectedRequiresReview: false },
            { id: 'CHECK-MIXED-UWERU-MODERN', suite: 'engine', rule: 'Modern mode normalises obsolete ゑ before tokenisation so a mixed Kanji-kana lexical form is analysed as the ordinary modern verb', input: '植ゑる', expected: 'Ueru', expectedRequiresReview: false },
            { id: 'CHECK-STYLISTIC-KATAKANA', suite: 'engine', rule: 'Stylistic obsolete Katakana receives its modern vowel value without bypassing ordinary Katakana source-spelling review policy', input: 'ヱビス', expected: 'Ebisu', expectedRequiresReview: true },
            { id: 'CHECK-MODERN-HIRAGANA-CONTROL', suite: 'engine', rule: 'Normal modern hiragana remains unchanged by obsolete W-row normalisation', input: 'いえ', expected: 'Ie', expectedRequiresReview: false },
            { id: 'CHECK-MODERN-KATAKANA-CONTROL', suite: 'engine', rule: 'Normal modern Katakana retains its existing output and review semantics', input: 'イエ', expected: 'Ie', expectedRequiresReview: true },
            { id: 'CHECK-SCOPE-BARE-TSUCHIYOSHI', suite: 'unit', rule: 'Reviewed MJ/Unihan evidence classifies supplementary-plane 𠮷 as Japanese scope without forcing one pronunciation', input: '𠮷', expected: 'japanese-scope:3', run: () => { const result = classifyHanCharacterScope('𠮷'); return `${result.scope}:${result.candidates.length}`; } },
            { id: 'CHECK-SCOPE-KANJIDIC-CONTROL', suite: 'unit', rule: 'Ordinary KANJIDIC-covered Kanji enter Japanese scope through the existing Kanji bank rather than the supplemental bank', input: '日', expected: 'japanese-scope:kanjidic', run: () => { const result = classifyHanCharacterScope('日'); return `${result.scope}:${result.evidence[0]?.source || ''}`; } },
            { id: 'CHECK-SCOPE-GENERAL-VARIANT', suite: 'unit', rule: 'Existing general Japanese variant mappings are positive Japanese-scope evidence', input: '國', expected: 'japanese-scope:国', run: () => { const result = classifyHanCharacterScope('國'); return `${result.scope}:${result.reference || ''}`; } },
            { id: 'CHECK-SCOPE-NAME-VARIANT', suite: 'unit', rule: 'Existing name-only itaiji mappings are positive Japanese-scope evidence without becoming global reading overrides', input: '𠮷', expected: 'japanese-scope:吉', run: () => { const result = classifyHanCharacterScope('𠮷'); return `${result.scope}:${result.reference || ''}`; } },
            { id: 'CHECK-SCOPE-NONHAN', suite: 'unit', rule: 'The Han scope classifier explicitly reports non-Han input as out-of-scope', input: 'A', expected: 'out-of-scope', run: () => classifyHanCharacterScope('A').scope },
            { id: 'CHECK-SCOPE-UNKNOWN-HAN', suite: 'unit', rule: 'Han without positive Japanese-use evidence remains unknown-scope and receives no guessed reading candidates', input: '𠀀', expected: 'unknown-scope:0', run: () => { const result = classifyHanCharacterScope('𠀀'); return `${result.scope}:${result.candidates.length}`; } },
            { id: 'MECH-ZERO-UNRESOLVED-HAN-REVIEWED-POSITIVE-SCOPE', suite: 'unit', rule: 'Every Han in the reviewed positive scope must retain a viable Japanese reading path without unresolved output or Han leakage', input: 'reviewed positive Han scope', expected: '256:256:0:0', run: () => { const surfaces = Array.from('㖦㖨㗅㗚㗴㘅㙊㚖㛏㝡㝢㝫㝵㟁㟨㟴㟽㠶㡀㡜㡡㤚㥯㩮㩳㫗㫪㬎㬚㬜㬢㭭㮇㮈㮍㮤㮶㯃㯍㯰㰏㰦㳃㳒㴑㴞㵤㷀㷔㸅㸿㹦㹨㺃㺔㽲㽵㽷㾮㿉㿗䀹䁘䂓䄅䅏䅣䆴䆿䇦䇮䇳䈇䈎䉤䋖䋝䌂䌫䍃䏮䏰䐈䐗䐜䐢䑓䑛䑶䑺䒳䔈䔥䕃䖝䖸䗥䗪䘏䙁䙥䚡䚯䜌䝤䟽䡎䢵䦰䧧䧺䨄䨩䪼䬻䯂䯊䯒䯨䰗䰠䳄䳑䴇䵷丬仫俦傣僳养凃卧呕埗复嶗庹廹开惮懵扡扻抅挲揫摹敄斵斸旼昺晥朁枒栘栾梐梴棃槩樳檔櫳歺毈毗氊沄沪沭泭泻洤洴涊涮溴滙潠澾瀺炻猹玔玨璈璥璺瓖瘘瘨皞皡睘瞤瞩砬礮窾筹篰籯聃肙肤胦脍臁艗荣菡蔛蔾藙蘤蚝蝼蟥覀訡諐踌躶轊釄鍫鏵閆阴隽霶頄颼飱驘鱭鱺鵒鶽鷀麽鬥𢦏㐆㐬㐮㑨㑪㒒㒼㓛㕞㕣㕮'); let supported = 0; let withCandidates = 0; let unresolved = 0; let leakedHan = 0; for (const surface of surfaces) { const scope = classifyHanCharacterScope(surface); if (scope.scope === 'japanese-scope') supported += 1; if ((scope.candidates || []).length) withCandidates += 1; const token = { surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', reading: '*', pronunciation: '*' }; const resolution = resolveTokenReading(token, surface); const output = convertToken(token, surface, resolution); if (output.includes('[Unresolved]')) unresolved += 1; if (containsHan(output)) leakedHan += 1; } return `${supported}:${withCandidates}:${unresolved}:${leakedHan}`; } },
            { id: 'MECH-ZERO-UNRESOLVED-HAN-REVIEWED-EXCLUSIONS', suite: 'unit', rule: 'Han deliberately excluded from supported Japanese scope must remain unknown with no invented reading candidates', input: 'reviewed Han exclusions', expected: '13:0', run: () => { const surfaces = Array.from('㣺䒑亻关耂艹飠碵囍爫牜犭㓁'); const unknown = surfaces.filter(surface => classifyHanCharacterScope(surface).scope === 'unknown-scope').length; const candidates = surfaces.reduce((count, surface) => count + (classifyHanCharacterScope(surface).candidates || []).length, 0); return `${unknown}:${candidates}`; } },
            { id: 'MECH-ZERO-UNRESOLVED-HAN-LEXICOGRAPHIC-CONFLICT', suite: 'unit', rule: 'Japanese lexicographic evidence for 炻 outranks a conflicting secondary Unicode Japanese-property value', input: '炻 candidate', expected: 'せき', run: () => classifyHanCharacterScope('炻').candidates?.[0]?.reading || '' },
            { id: 'MECH-ZERO-UNRESOLVED-HAN-KANJIDIC-NO-JAPANESE-READING-SCOPE', suite: 'unit', rule: 'A KANJIDIC row with no Japanese on/kun reading is not treated as supported Japanese Han merely because the character exists in the source bank', input: '碵', expected: 'unknown-scope:kanjidic-no-japanese-reading:0', run: () => { const result = classifyHanCharacterScope('碵'); return `${result.scope}:${result.evidence?.[0]?.source || ''}:${result.candidates.length}`; } },
            { id: 'MECH-ZERO-UNRESOLVED-HAN-SUPPORTED-COVERAGE-INVARIANT', suite: 'unit', rule: 'Every Han classified as supported from KANJIDIC, reviewed scope or variant evidence has a candidate path, produces no literal unresolved/Han leakage, and marks ambiguous character fallback explicitly', input: 'all supported Han', expected: '0:0:0:0', run: () => { const characters = new Set([...Object.keys(runtimeState.kanjiDictionary), ...runtimeState.japaneseHanScopeDictionary.keys(), ...runtimeState.generalKanjiVariantDictionary.keys(), ...runtimeState.nameKanjiVariantDictionary.keys()]); let scopeGaps = 0; let unresolved = 0; let dataGaps = 0; let missingAmbiguitySignal = 0; for (const character of characters) { const scope = classifyHanCharacterScope(character); if (scope.scope !== 'japanese-scope') continue; if (!(scope.candidates || []).length) scopeGaps += 1; const token = { surface_form: character, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', reading: '*', pronunciation: '*' }; const resolution = resolveTokenReading(token, character); const output = convertToken(token, character, resolution); if (output.includes('[Unresolved]') || containsHan(output)) unresolved += 1; if (resolution.source === 'japanese-scope-data-gap') dataGaps += 1; if (resolution.source === 'japanese-scope-character-fallback' && (resolution.candidates || []).length > 1 && !(resolution.flags || []).includes('japanese-han-scope-ambiguous')) missingAmbiguitySignal += 1; } return `${scopeGaps}:${unresolved}:${dataGaps}:${missingAmbiguitySignal}`; } },
            { id: 'CHECK-BARE-TSUCHIYOSHI-REVIEW', suite: 'unit', rule: 'Bare 𠮷 emits the best reviewed Japanese candidate while remaining review-required because legitimate alternatives remain', input: '𠮷', expected: 'Kichi:true', run: () => { const audit = runTranslatorReadingAudit('𠮷'); return `${audit.output}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-BARE-TSUCHIYOSHI-AUDIT', suite: 'unit', rule: 'Bare 𠮷 is distinguished from unknown Han and exposes all reviewed Japanese candidates alongside the selected fallback', input: '𠮷 audit', expected: 'japanese-scope:japanese-scope-character-fallback:きち|きつ|よい', run: () => { const audit = runTranslatorReadingAudit('𠮷'); const reading = audit.readings[0]; return `${reading?.hanScope || ''}:${reading?.source || ''}:${(reading?.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-UNKNOWN-HAN-AUDIT', suite: 'unit', rule: 'Unknown-scope Han is blocked without being labelled an unresolved Japanese reading', input: '𠀀 audit', expected: 'unknown-scope:unknown-han-scope:false', run: () => { const audit = runTranslatorReadingAudit('𠀀'); const reading = audit.readings[0]; return `${reading?.hanScope || ''}:${reading?.source || ''}:${String((reading?.flags || []).includes('unresolved-reading'))}`; } },
            { id: 'CHECK-WHOLE-NAME-YOSHIDA', suite: 'engine', rule: 'Japanese-scope classification does not disturb existing whole-name variant resolution for 𠮷田', input: '𠮷田', expected: 'Yoshida', expectedRequiresReview: false },
            { id: 'CHECK-WHOLE-NAME-YOSHINO', suite: 'engine', rule: 'Japanese-scope classification does not disturb existing whole-name variant resolution for 𠮷野', input: '𠮷野', expected: 'Yoshino', expectedRequiresReview: false },
            { id: 'CHECK-GENERAL-VARIANT-KOKUSAI', suite: 'engine', rule: 'General Japanese variant reduction remains available to ordinary lexical evidence', input: '國際', expected: 'Kokusai', expectedRequiresReview: false },
            { id: 'CHECK-ORDINARY-KANJI-CONTROL', suite: 'engine', rule: 'Ordinary non-variant Japanese Kanji continue through existing lexical/KANJIDIC paths unchanged', input: '日本語', expected: 'Nihongo' },
            { id: 'CHECK-SCOPE-DRAGON', suite: 'unit', rule: 'MJ/Unihan Japanese properties classify 龘 as Japanese scope with its reviewed Japanese reading', input: '龘', expected: 'japanese-scope:とう', run: () => { const result = classifyHanCharacterScope('龘'); return `${result.scope}:${(result.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-SCOPE-THUNDER', suite: 'unit', rule: 'MJ/Unihan Japanese properties classify 䨻 as Japanese scope while preserving both reviewed Japanese readings', input: '䨻', expected: 'japanese-scope:ほう|びょう', run: () => { const result = classifyHanCharacterScope('䨻'); return `${result.scope}:${(result.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-SCOPE-BIANG', suite: 'unit', rule: 'Han with no positive Japanese-use evidence remains unknown-scope and imports no Mandarin reading', input: '𰻞', expected: 'unknown-scope:0', run: () => { const result = classifyHanCharacterScope('𰻞'); return `${result.scope}:${(result.candidates || []).length}`; } },
            { id: 'CHECK-SCOPE-TAITO-GHOST', suite: 'unit', rule: 'Reviewed Japanese scholarly/library evidence classifies the rare kokuji/ghost-character 𱁬 as Japanese scope without treating disputed surname history as certainty', input: '𱁬', expected: 'japanese-scope:たいと|だいと|おとど', run: () => { const result = classifyHanCharacterScope('𱁬'); return `${result.scope}:${(result.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-DRAGON-UNIQUE-READING', suite: 'engine', rule: 'A bare Japanese-scope Han with exactly one reviewed Japanese reading may resolve from that reviewed evidence', input: '龘', expected: 'Tou', expectedRequiresReview: false },
            { id: 'CHECK-DRAGON-AUDIT', suite: 'unit', rule: 'Unique reviewed Japanese-scope resolution retains scope and candidate provenance', input: '龘 audit', expected: 'japanese-scope:japanese-scope-reviewed-single:とう', run: () => { const audit = runTranslatorReadingAudit('龘'); const reading = audit.readings[0]; return `${reading?.hanScope || ''}:${reading?.source || ''}:${(reading?.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-THUNDER-AMBIGUOUS', suite: 'unit', rule: 'Multiple reviewed Japanese readings for 䨻 produce the best reviewed candidate plus requiresReview rather than literal unresolved output', input: '䨻 audit', expected: 'Hou:true:ほう|びょう', run: () => { const audit = runTranslatorReadingAudit('䨻'); const reading = audit.readings[0]; return `${audit.output}:${String(audit.requiresReview)}:${(reading?.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-TAITO-GHOST-AMBIGUOUS', suite: 'unit', rule: 'Disputed rare Japanese 𱁬 emits the best reviewed candidate while retaining all attested alternatives and requiresReview', input: '𱁬 audit', expected: 'Taito:true:たいと|だいと|おとど', run: () => { const audit = runTranslatorReadingAudit('𱁬'); const reading = audit.readings[0]; return `${audit.output}:${String(audit.requiresReview)}:${(reading?.candidates || []).map(item => item.reading).join('|')}`; } },
            { id: 'CHECK-BIANG-UNKNOWN-AUDIT', suite: 'unit', rule: 'Unknown-scope 𰻞 remains blocked without Chinese-reading leakage or unresolved-Japanese labelling', input: '𰻞 audit', expected: 'unknown-scope:unknown-han-scope:false:0', run: () => { const audit = runTranslatorReadingAudit('𰻞'); const reading = audit.readings[0]; return `${reading?.hanScope || ''}:${reading?.source || ''}:${String((reading?.flags || []).includes('unresolved-reading'))}:${(reading?.candidates || []).length}`; } },
            { id: 'CHECK-TSUCHIYOSHI-CONTROL', suite: 'unit', rule: 'Existing Japanese-scope 𠮷 remains ambiguous and review-required without invoking either final output guard', input: '𠮷 audit', expected: 'Kichi:true:3:false:false', run: () => { const audit = runTranslatorReadingAudit('𠮷'); const flags = audit.readings[0]?.flags || []; return `${audit.output}:${String(audit.requiresReview)}:${audit.readings[0]?.candidates?.length || 0}:${String(flags.includes('kanji-output-blocked'))}:${String(flags.includes('nonlatin-output-blocked'))}`; } },
            { id: 'CHECK-YOSHIDA-CONTROL', suite: 'engine', rule: 'Rare-Han scope evidence does not disturb existing whole-name variant resolution', input: '𠮷田', expected: 'Yoshida', expectedRequiresReview: false },
            { id: 'CHECK-ORDINARY-JAPANESE-CONTROL', suite: 'engine', rule: 'Rare-Han scope evidence does not disturb ordinary Japanese lexical resolution', input: '日本語', expected: 'Nihongo' },
            { id: 'CHECK-JAPANESE-HAN-STATS', suite: 'unit', rule: 'Ambiguous supported Han is represented as resolved Romaji requiring review, not as an unresolved-Japanese or scope-error statistic', input: '𠮷 statistics', expected: 'true:0:0:0:0:0:true', run: () => { const audit = runTranslatorReadingAudit('𠮷'); const s = audit.statistics || {}; return `${String(Boolean(s.requiresReview))}:${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}:${String(Boolean(s.resolvedOutputRequiresReview))}`; } },
            { id: 'CHECK-UNKNOWN-HAN-STATS', suite: 'unit', rule: 'Unknown-scope Han is counted separately from both unresolved Japanese and positively out-of-scope script input', input: '𰻞 statistics', expected: 'true:0:0:0:1:1:false', run: () => { const audit = runTranslatorReadingAudit('𰻞'); const s = audit.statistics || {}; return `${String(Boolean(s.requiresReview))}:${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}:${String(Boolean(s.resolvedOutputRequiresReview))}`; } },
            { id: 'CHECK-UNSUPPORTED-SCRIPT-STATS', suite: 'unit', rule: 'Korean, Cyrillic and Arabic are out-of-scope inputs and never inflate unresolved-Japanese statistics', input: '한국어 / Привет / العربية statistics', expected: '3/3:0/0:0/3', run: () => { const audits = ['한국어','Привет','العربية'].map(text => runTranslatorReadingAudit(text)); return `${audits.filter(a => a.statistics?.outOfScopeInput === 1).length}/${audits.length}:${audits.reduce((n,a)=>n+(a.statistics?.unresolvedJapaneseReadings||0),0)}/${audits.reduce((n,a)=>n+(a.statistics?.unresolvedJapaneseHan||0),0)}:${audits.reduce((n,a)=>n+(a.statistics?.unknownJapaneseScopeStatus||0),0)}/${audits.reduce((n,a)=>n+(a.statistics?.literalUnresolved||0),0)}`; } },
            { id: 'CHECK-RESOLVED-REVIEW-STATS', suite: 'unit', rule: 'Review-required Romaji with no unresolved output is distinguished from literal unresolved output', input: '市場について話す statistics', expected: 'true:0:0:0:0:0:true', run: () => { const audit = runTranslatorReadingAudit('市場について話す'); const s = audit.statistics || {}; return `${String(Boolean(s.requiresReview))}:${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}:${String(Boolean(s.resolvedOutputRequiresReview))}`; } },
            { id: 'CHECK-CLEAR-JAPANESE-HAN-STATS', suite: 'unit', rule: 'A reviewed unique Japanese Han reading is clear and contributes to none of the unresolved/scope-error statistics', input: '龘 statistics', expected: 'false:0:0:0:0:0:false', run: () => { const audit = runTranslatorReadingAudit('龘'); const s = audit.statistics || {}; return `${String(Boolean(s.requiresReview))}:${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}:${String(Boolean(s.resolvedOutputRequiresReview))}`; } },
            { id: 'CHECK-READING-CATEGORIES-JAPANESE-HAN', suite: 'unit', rule: 'Resolved supported-Han ambiguity is carried by review flags rather than unresolved audit categories', input: '𠮷 categories', expected: 'japanese-han-scope-ambiguous:true', run: () => { const audit = runTranslatorReadingAudit('𠮷'); const reading = audit.readings[0]; return `${(reading?.flags || []).includes('japanese-han-scope-ambiguous') ? 'japanese-han-scope-ambiguous' : ''}:${String((reading?.auditCategories || []).length === 0)}`; } },
            { id: 'CHECK-READING-CATEGORIES-UNKNOWN-HAN', suite: 'unit', rule: 'Reading-level audit categories expose unknown Japanese-scope status without reclassifying it as unresolved Japanese', input: '𰻞 categories', expected: 'unknown-japanese-scope-status', run: () => (runTranslatorReadingAudit('𰻞').readings[0]?.auditCategories || []).join('|') },
            { id: 'CHECK-READING-CATEGORIES-OUT-OF-SCOPE', suite: 'unit', rule: 'Unsupported non-Japanese script is classified only as out-of-scope input for unresolved-statistics purposes', input: '한국어 categories', expected: 'out-of-scope-input', run: () => (runTranslatorReadingAudit('한국어').readings[0]?.auditCategories || []).join('|') },
            { id: 'CHECK-MIXED-SCOPE-STATS', suite: 'unit', rule: 'Mixed Japanese plus unsupported script keeps the out-of-scope count separate from Japanese resolution state', input: '日本語 한국어 statistics', expected: '0:0:1:0:1', run: () => { const s = runTranslatorReadingAudit('日本語 한국어').statistics || {}; return `${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}`; } },
            { id: 'CHECK-AMBIGUOUS30-STATS', suite: 'unit', rule: 'The established 30-character ambiguous-Han set remains Romanised and reviewable without being counted as unresolved Japanese', input: '30-character ambiguous-Han statistics', expected: '30/30/30', run: () => { const surfaces = ['佰','偏','卌','喃','嬲','巉','弍','弎','弐','恁','掬','捌','擣','殱','溷','爼','疋','站','纈','纐','罧','翊','蒿','貮','逎','陌','頷','驫','髷','玖']; const audits = surfaces.map(surface => runTranslatorReadingAudit(surface)); const romanised = audits.filter(a => !a.output.includes('[Unresolved]')).length; const reviewable = audits.filter(a => a.requiresReview).length; const notUnresolvedJapanese = audits.filter(a => (a.statistics?.unresolvedJapaneseReadings || 0) === 0).length; return `${romanised}/${reviewable}/${notUnresolvedJapanese}`; } },
            { id: 'CHECK-UNSUPPORTED-CYRILLIC', suite: 'unit', rule: 'Unsupported Cyrillic is reviewable rather than leaked', input: 'Привет', expected: '[Unresolved]', run: () => translateText('Привет') },
            { id: 'CHECK-UNSUPPORTED-KOREAN', suite: 'unit', rule: 'Unsupported Korean is blocked and reviewable under the generic non-Latin output diagnostic, never the Han-specific guard diagnostic', input: '한국어', expected: '[Unresolved]:true:false', run: () => { const audit = runTranslatorReadingAudit('한국어'); const flags = audit.readings.flatMap(item => item.flags || []); return `${audit.output}:${String(flags.includes('nonlatin-output-blocked'))}:${String(flags.includes('kanji-output-blocked'))}`; } },
            { id: 'CHECK-UNSUPPORTED-ARABIC', suite: 'unit', rule: 'Unsupported Arabic is reviewable rather than leaked', input: 'العربية', expected: '[Unresolved]', run: () => translateText('العربية') },
            { id: 'CHECK-ASCII-DOUBLE-NEST-GUARD', suite: 'engine', rule: 'Adjacent literal ASCII double quotes retain their existing ambiguous toggle spacing behaviour', input: '""猫""', expected: '"" Neko ""' },
            { id: 'R0-VARIANT-NAME-YAMASAKI', suite: 'engine', rule: 'Variant surnames preserve legitimate whole-name reading ambiguity instead of presenting the frequency-leading candidate as settled', input: '山﨑', expectedAny: ['Yamazaki', 'Yamasaki'], expectedRequiresReview: true },
            { id: 'SRC-GRAMMAR-NI-TSUITE', suite: 'engine', rule: 'Rule 0 explicit particle-based expression is tested with an unambiguous lexical word', input: '学校について', expected: 'Gakkou ni tsuite' },
            { id: 'R0-AMBIGUOUS-NIHON', suite: 'engine', rule: 'Rule 0 permits both established readings of 日本 but requires review when context does not resolve them', input: '日本', expectedAny: ['Nihon', 'Nippon'], expectedRequiresReview: true },
            { id: 'R0-AMBIGUOUS-NIHON-NI-TSUITE', suite: 'engine', rule: 'Rule 0 explicitly resolves 日本について as Nihon while について remains lowercase', input: '日本について', expected: 'Nihon ni tsuite' },
            { id: 'ADV-R0-NIHON-WA', suite: 'engine', rule: 'Rule 0 explicitly resolves 日本は as Nihon wa', input: '日本は', expected: 'Nihon wa' },
            { id: 'ADV-R0-NIHON-E', suite: 'engine', rule: 'Rule 0 explicitly resolves 日本へ as Nihon e', input: '日本へ', expected: 'Nihon e' },
            { id: 'SYS-NUMERIC-LEXICAL-AMBIGUITY-AUDIT', suite: 'engine', rule: 'A bare numeral-looking proper-name reading remains reviewable when number and lexical interpretations compete', input: '九十九', expected: 'Tsukumo', expectedRequiresReview: true },
            { id: 'SYS-NUMERIC-LEXICAL-AMBIGUITY-HARD-BOUNDARY', suite: 'engine', rule: 'A hard title delimiter cannot suppress numeric lexical ambiguity on either side', input: '九十九〜九十九', expected: 'Tsukumo ~ Tsukumo', expectedRequiresReview: true },
            { id: 'R0-SOKUON-TERMINAL-NO-PUNCT', suite: 'engine', rule: 'A final expressive sokuon with no punctuation is reviewable and contributes no invented Romaji letter', input: 'あっ', expected: 'A', expectedRequiresReview: true },
            { id: 'R0-SOKUON-TERMINAL-BEFORE-SPACE', suite: 'engine', rule: 'A sokuon ending one expression before whitespace is reviewable', input: 'あっ そう', expected: 'A Sou', expectedRequiresReview: true },
            { id: 'R0-SOKUON-TERMINAL-BEFORE-QUOTE', suite: 'engine', rule: 'A sokuon before closing punctuation is reviewable', input: '「あっ」', expected: '"A"', expectedRequiresReview: true },
            { id: 'R0-SOKUON-BEFORE-VOWEL-AUDIT', suite: 'engine', rule: 'A rare/stylised sokuon before a vowel does not duplicate the vowel and requires review', input: 'あっあ', expected: 'Aa', expectedRequiresReview: true },
            { id: 'R0-SOKUON-BEFORE-R-AUDIT', suite: 'engine', rule: 'A rare/stylised sokuon before r does not invent rr and requires review', input: 'あっら', expected: 'Ara', expectedRequiresReview: true },
            { id: 'R0-SOKUON-REPEATED-AUDIT', suite: 'engine', rule: 'Repeated sokuon is preserved as a review signal rather than multiplying a consonant arbitrarily', input: 'あっっか', expected: 'Akka', expectedRequiresReview: true },
            { id: 'R0-TERMINAL-SOKUON-AUDIT-ELLIPSIS', suite: 'engine', rule: 'Final expressive small っ before an ellipsis remains reviewable rather than inventing a following consonant', input: 'えっ……', expected: 'E…', expectedRequiresReview: true },
            { id: 'STRESS-EVIDENCE-TSUNDOKU', suite: 'engine', rule: 'Single-reading whole-word evidence can rescue an otherwise unresolved token span', input: 'つん読', expected: 'Tsundoku' },
            { id: 'STRESS-EVIDENCE-HEIRITSU', suite: 'engine', rule: 'Single-reading whole-word evidence can rescue an otherwise unresolved Kanji span', input: '併立', expected: 'Heiritsu' },
            { id: 'STRESS-ATEJI-JINGISUKAN', suite: 'engine', rule: 'Exact ateji evidence can rescue a multi-token unresolved span', input: '成吉思汗', expected: 'Jingisukan' },
            { id: 'CHECK-YATAGARASU', suite: 'engine', rule: 'Attested lexical evidence resolves 八咫烏 without a generic override', input: '八咫烏', expected: 'Yatagarasu', expectedRequiresReview: false },
            { id: 'CHECK-KYONYUU', suite: 'engine', rule: 'Attested lexical 巨乳 evidence resolves 隠れ巨乳 without a generic override', input: '隠れ巨乳', expected: 'Kakure Kyonyuu', expectedRequiresReview: false },
            { id: 'NAME-KOMI-CONTEXT', suite: 'engine', rule: 'Reviewed proper-name evidence resolves Komi in title context without changing global name ranking', input: '古見さんは、コミュ症です。', expected: 'Komi san wa, Komyushou desu.' }
            ,{ id: 'SYS-REVIEWED-READING-30-AUDIT', suite: 'unit', rule: 'Each researched ambiguous single-kanji fallback returns Romaji while retaining a human-review signal', input: '30 reviewed ambiguous kanji', expected: '30/30', run: () => {
                const surfaces = ['佰','偏','卌','喃','嬲','巉','弍','弎','弐','恁','掬','捌','擣','殱','溷','爼','疋','站','纈','纐','罧','翊','蒿','貮','逎','陌','頷','驫','髷','玖'];
                const reviewed = surfaces.filter(surface => translateAuditForGeneratedQa(surface).requiresReview).length;
                return `${reviewed}/${surfaces.length}`;
            } },
            ...[
                ['01','佰','Hyaku'], ['02','偏','Hen'], ['03','卌','Yonjuu'], ['04','喃','Nan'], ['05','嬲','Naburu'],
                ['06','巉','Zan'], ['07','弍','Ni'], ['08','弎','San'], ['09','弐','Ni'], ['10','恁','Jin'],
                ['11','掬','Kiku'], ['12','捌','Hachi'], ['13','擣','Tou'], ['14','殱','Sen'], ['15','溷','Kon'],
                ['16','爼','So'], ['17','疋','Hiki'], ['18','站','Tan'], ['19','纈','Ketsu'], ['20','纐','Kou'],
                ['21','罧','Shin'], ['22','翊','Yoku'], ['23','蒿','Yomogi'], ['24','貮','Ni'], ['25','逎','Shuu'],
                ['26','陌','Haku'], ['27','頷','Ago'], ['28','驫','Hyou'], ['29','髷','Mage'], ['30','玖','Kyuu']
            ].map(([number, input, expected]) => ({
                id: `UNRESOLVED30-${number}-ISOLATED`, suite: 'engine',
                rule: 'A researched multiple-reading kanji returns its reviewed preferred Romaji rather than unresolved Han while preserving alternatives for audit',
                input, expected
            })),
            ...[
                ['LEX-01','仟佰','Senpaku'], ['LEX-02','偏る','Katayoru'], ['LEX-03','偏見','Henken'], ['LEX-04','喃喃','Nannan'], ['LEX-05','喃語','Nango'],
                ['LEX-06','嬲る','Naburu'], ['LEX-07','巉岩','Zangan'], ['LEX-08','捌く','Sabaku'], ['LEX-09','捌ける','Hakeru'], ['LEX-10','擣く','Tsuku'],
                ['LEX-11','擣衣','Toui'], ['LEX-12','殱滅','Senmetsu'], ['LEX-13','溷濁','Kondaku'], ['LEX-14','爼上','Sojou'], ['LEX-15','兵站','Heitan'],
                ['LEX-16','車站','Shatan'], ['LEX-17','夾纈','Kyoukechi'], ['LEX-18','纐纈','Koukechi'], ['LEX-19','翊賛','Yokusan'], ['LEX-20','蒿里','Kouri'],
                ['LEX-21','陌上','Hakujou'], ['LEX-22','頷く','Unazuku'], ['LEX-23','頷首','Ganshu'], ['LEX-24','驫木','Todoroki'], ['LEX-25','髷物','Magemono'],
                ['LEX-26','玖馬','Kyuuba']
            ].map(([id, input, expected]) => ({
                id: `UNRESOLVED30-${id}`, suite: 'engine',
                rule: 'Reviewed multiple-reading fallback must not override stronger lexical, inflectional, compound, or proper-name context',
                input, expected
            }))
        ];
    }

    function getHistoricalKanaRegressionChecks() {
        return [
            { id: 'SYS-AUDIT-HISTORICAL-FULL-SIZE-SOKUON', suite: 'unit', rule: 'Historical mode treats a full-size つ before a geminatable consonant as ambiguous unless attested historical evidence resolves it', input: '立つて', expected: 'true', run: () => String(buildTranslationDiagnostics('立つて', '立つて', 'Tatsute', [{ surface_form: '立つて', pos: '動詞', value: 'tatsute', readingResolution: { source: 'tokenizer', confidence: 0.8, reading: 'たつて', candidates: [], flags: [], variantMappings: [] } }], { historicalKana: true }).requiresReview) },
            { id: 'R0-KANA-LARGE-TSU', suite: 'unit', rule: 'Full-size つ remains tsu by default in modern text unless historical evidence proves a sokuon reading', input: 'まつ', expected: 'matsu', run: () => convertToRomaji('まつ') },
            { id: 'CHECK-LONG-HISTORICAL-SPAN-11', suite: 'unit', rule: 'Historical-kana evidence spans are evidence-bounded rather than capped at ten tokens', input: '11-token historical span', expected: '11', run: () => { const original = runtimeState.historicalKanaEvidenceDictionary; const originalPrefixes = runtimeState.historicalKanaEvidencePrefixes; const surface = 'ゐゐゐゐゐゐゐゐゐゐゐ'; const tokens = Array.from(surface).map(value => ({ surface_form: value, pos: '名詞' })); try { runtimeState.historicalKanaEvidenceDictionary = new Map([[surface, { reading: 'いいいいいいいいいいい', source: 'qa' }]]); runtimeState.historicalKanaEvidencePrefixes = new Set(); addSurfacePrefixes(runtimeState.historicalKanaEvidencePrefixes, surface); return String(findLongestHistoricalKanaEvidence(tokens, 0)?.length || 0); } finally { runtimeState.historicalKanaEvidenceDictionary = original; runtimeState.historicalKanaEvidencePrefixes = originalPrefixes; } } },
            { id: 'HIST-WOKASHI', suite: 'historical', rule: 'Historical mode uses attested whole-word evidence instead of treating historical を as a particle', input: 'をかし', expected: 'Okashi' },
            { id: 'HIST-WIDO', suite: 'historical', rule: 'Historical mode resolves obsolete ゐ from attested word evidence', input: 'ゐど', expected: 'Ido' },
            { id: 'HIST-WIRU', suite: 'historical', rule: 'Historical mode resolves obsolete ゐ in a verb from attested word evidence', input: 'ゐる', expected: 'Iru' },
            { id: 'HIST-MAWIRU', suite: 'historical', rule: 'Historical mode resolves obsolete medial ゐ without changing the modern pipeline', input: 'まゐる', expected: 'Mairu' },
            { id: 'HIST-OMOHIDE', suite: 'historical', rule: 'Historical mode keeps a mixed-script historical lexical form together', input: '思ひ出を語る', expected: 'Omoide o Kataru' },
            { id: 'HIST-KOWE', suite: 'historical', rule: 'Historical evidence may repair a token boundary that overshoots into a following modern particle', input: 'こゑを聞く', expected: 'Koe o Kiku' },
            { id: 'HIST-UWERU', suite: 'historical', rule: 'Historical mode resolves obsolete ゑ in a verb', input: '植ゑる', expected: 'Ueru' },
            { id: 'HIST-KANGAERU', suite: 'historical', rule: 'Historical mode maps attested へ spelling to the modern lexical reading without changing ordinary へ particles', input: '考へる', expected: 'Kangaeru' },
            { id: 'HIST-WOTOKO', suite: 'historical', rule: 'Historical mode distinguishes lexical を from the modern object particle', input: 'をとこ', expected: 'Otoko' },
            { id: 'HIST-TOWOKA', suite: 'historical', rule: 'Historical mode uses the attested 十日 spelling-to-reading relation', input: 'とをか', expected: 'Tooka' },
            { id: 'HIST-WODORU', suite: 'historical', rule: 'Historical mode resolves lexical initial を as modern お only for an attested historical word', input: 'をどる', expected: 'Odoru' },
            { id: 'HIST-AWOI', suite: 'historical', rule: 'Historical mode resolves an attested internal を without changing modern particle rules', input: 'あをい', expected: 'Aoi' },
            { id: 'HIST-OMOWAZU', suite: 'historical', rule: 'Historical mode resolves attested は to modern わ inside a lexical word', input: '思はず', expected: 'Omowazu' },
            { id: 'HIST-KEFU', suite: 'historical', rule: 'Historical mode resolves the attested historical spelling of 今日', input: 'けふは晴れ', expected: 'Kyou wa Hare' },
            { id: 'HIST-TEFU', suite: 'historical', rule: 'Historical mode resolves the attested historical spelling of 蝶', input: 'てふ', expected: 'Chou' },
            { id: 'HIST-IU', suite: 'historical', rule: 'Historical mode resolves 言ふ to the modern lexical reading いう', input: '言ふ', expected: 'Iu' },
            { id: 'HIST-YUUGATA', suite: 'historical', rule: 'Historical mode resolves the attested historical spelling of 夕方', input: 'ゆふがた', expected: 'Yuugata' },
            { id: 'HIST-KAGEROU', suite: 'historical', rule: 'Historical mode resolves final historical ふ from whole-word evidence', input: 'かげろふ', expected: 'Kagerou' },
            { id: 'HIST-FUKUROU', suite: 'historical', rule: 'Historical mode resolves final historical ふ from whole-word evidence', input: 'ふくろふ', expected: 'Fukurou' },
            { id: 'HIST-KAU', suite: 'historical', rule: 'Historical mode resolves historical 買ふ without inventing a global ふ conversion rule', input: '買ふ', expected: 'Kau' },
            { id: 'HIST-GUARD-WO', suite: 'historical', rule: 'Historical mode leaves an ordinary modern を particle unchanged', input: '本を読む', expected: 'Hon o Yomu' },
            { id: 'HIST-GUARD-HE', suite: 'historical', rule: 'Historical mode leaves an ordinary modern へ particle unchanged', input: '西へ進む', expected: 'Nishi e Susumu' },
            { id: 'HIST-GUARD-HA', suite: 'historical', rule: 'Historical mode leaves an ordinary modern は particle unchanged', input: '彼は学生', expected: 'Kare wa Gakusei' },
            { id: 'HIST-GUARD-KOUIU', suite: 'historical', rule: 'Historical mode does not replace modern written-vowel behaviour with phonetic normalisation', input: 'こういう', expected: 'Kouiu' },
            { id: 'HIST-GUARD-KONNICHIWA', suite: 'historical', rule: 'Historical mode preserves the modern lexicalised は pronunciation rule', input: 'こんにちは', expected: 'Konnichiwa' },
            { id: 'HIST-GUARD-NAME-WO', suite: 'historical', rule: 'Historical mode does not steal a modern を particle after a name-like token', input: 'みつを食べる', expected: 'Mitsu o Taberu' },
            { id: 'HIST-GUARD-NAME-HE', suite: 'historical', rule: 'Historical mode does not steal a modern へ particle after a name-like token', input: 'ふみへ行く', expected: 'Fumi e Iku' },
            { id: 'HIST-GUARD-KA-WA', suite: 'historical', rule: 'Historical mode does not invent a lexical かは conversion in an ordinary modern particle sequence', input: '行くかは分からない', expected: 'Iku ka wa Wakaranai' }
        ];
    }

    function getRuntimeAndApiRegressionChecks() {
        return [
            { id: 'CHECK-UI-DEBOUNCE-LATEST', suite: 'unit', rule: 'Built-in typing coalesces pending work and keeps only the latest scheduled input', input: 'A -> B', expected: 'B', run: () => { let nextId = 0; const tasks = new Map(); const timerApi = { set: fn => { const id = ++nextId; tasks.set(id, fn); return id; }, clear: id => tasks.delete(id) }; const calls = []; const scheduler = createCoalescingScheduler(value => calls.push(value), 16, timerApi); scheduler.schedule('A'); scheduler.schedule('B'); for (const fn of tasks.values()) fn(); return calls.join('|'); } },
            { id: 'CHECK-UI-DEBOUNCE-CANCEL', suite: 'unit', rule: 'Cancelling pending built-in UI work prevents the queued translation from running', input: 'cancel pending', expected: '0', run: () => { let nextId = 0; const tasks = new Map(); const timerApi = { set: fn => { const id = ++nextId; tasks.set(id, fn); return id; }, clear: id => tasks.delete(id) }; let calls = 0; const scheduler = createCoalescingScheduler(() => { calls += 1; }, 16, timerApi); scheduler.schedule(); scheduler.cancel(); for (const fn of tasks.values()) fn(); return String(calls); } },
            { id: 'CHECK-UI-DISPOSE-REFRESH', suite: 'unit', rule: 'Disposed UI schedulers reject work until explicitly refreshed', input: 'dispose -> refresh', expected: 'false|true|1', run: () => { let nextId = 0; const tasks = new Map(); const timerApi = { set: fn => { const id = ++nextId; tasks.set(id, fn); return id; }, clear: id => tasks.delete(id) }; let calls = 0; const scheduler = createCoalescingScheduler(() => { calls += 1; }, 16, timerApi); scheduler.dispose(); const disposedSchedule = scheduler.schedule(); scheduler.refresh(); const refreshedSchedule = scheduler.schedule(); for (const fn of [...tasks.values()]) fn(); return `${disposedSchedule}|${refreshedSchedule}|${calls}`; } },
            { id: 'CHECK-BIND-OVERRIDE-ISOLATION', suite: 'unit', rule: 'A per-call override setting is resolved locally without changing the global override state', input: 'local overrides=false', expected: 'false|unchanged', run: () => { const before = runtimeState.overridesEnabled; const local = resolveOverridesEnabled({ overridesEnabled: false }); return `${local}|${runtimeState.overridesEnabled === before ? 'unchanged' : 'changed'}`; } },
            { id: 'CHECK-ASSET-RETRY-POLICY', suite: 'unit', rule: 'Transient asset retries are bounded, use increasing delays, and keep a finite tokenizer timeout', input: 'runtime loading policy', expected: '2:250,500:60000', run: () => { const policy = getRuntimeLoadingPolicy(); return `${policy.retryCount}:${policy.retryDelaysMs.join(',')}:${policy.tokenizerTimeoutMs}`; } },
            { id: 'CHECK-ASSET-BASE-HTTPS-CROSS-ORIGIN', suite: 'unit', rule: 'Explicit HTTPS asset bases remain usable for legitimate cross-origin hosting', input: 'https://cdn.example.test/cj2r', expected: 'https://cdn.example.test/cj2r/', run: () => resolveConfiguredAssetBaseUrl('https://cdn.example.test/cj2r', 'https://host.example.test/page') || '' },
            { id: 'CHECK-ASSET-BASE-REJECTS-ACTIVE-SCHEME', suite: 'unit', rule: 'assetBaseUrl rejects executable or non-web URL schemes', input: 'javascript:alert(1)', expected: 'rejected', run: () => { try { resolveConfiguredAssetBaseUrl('javascript:alert(1)', 'https://host.example.test/page'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-ASSET-BASE-REJECTS-CREDENTIALS', suite: 'unit', rule: 'assetBaseUrl rejects embedded URL credentials', input: 'https://user:pass@example.test/cj2r/', expected: 'rejected', run: () => { try { resolveConfiguredAssetBaseUrl('https://user:pass@example.test/cj2r/', 'https://host.example.test/page'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-ASSET-BASE-REJECTS-HTTPS-DOWNGRADE', suite: 'unit', rule: 'assetBaseUrl rejects HTTPS-to-HTTP asset downgrades', input: 'https page -> http assets', expected: 'rejected', run: () => { try { resolveConfiguredAssetBaseUrl('http://cdn.example.test/cj2r/', 'https://host.example.test/page'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-KANJI-READING-DATA', suite: 'unit', rule: 'Kanji Readings are available as structured data independently of the supplied UI', input: '日 / 月', expected: '日:0:true|月:null:true', run: () => { const data = getKanjiReadingData('日', '月'); const input = data.input[0]; const search = data.search[0]; return `${input?.character}:${input?.position}:${String(Boolean(input?.on.length || input?.kun.length))}|${search?.character}:${search?.position}:${String(Boolean(search?.on.length || search?.kun.length))}`; } },
            { id: 'CHECK-REGEX-SCHEMA-REJECTS-UNSAFE', suite: 'unit', rule: 'Unsafe contextual regex data is rejected by its asset schema rather than silently compiled', input: 'context-overrides-v1 / (a+)+$', expected: 'rejected', run: () => { try { validateAssetSchema('contextOverrides', [{ pattern: '(a+)+$', surface: '猫', romaji: 'Neko' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-EXACT-OVERRIDE-SCHEMA-VALID', suite: 'unit', rule: 'Rule 0-safe exact override Romaji remains valid reviewed evidence', input: '猫 → Neko', expected: 'accepted', run: () => { try { validateAssetSchema('exactOverrides', { 猫: 'Neko' }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-EMPTY-EXACT-OVERRIDE-BANK', suite: 'unit', rule: 'A metadata-only exact override bank is valid when no live exact overrides remain', input: '{ _comment: ... }', expected: 'accepted', run: () => { try { validateAssetSchema('exactOverrides', { _comment: 'No live exact overrides.' }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'DATA-DUPLICATE-EQUAL-IDEMPOTENT', suite: 'unit', rule: 'Equal duplicate single-value evidence is idempotent', input: 'duplicate equal', expected: '1', run: () => { const map = new Map(); setUniqueDictionaryEntry(map, 'x', { reading: 'ねこ' }, 'test'); setUniqueDictionaryEntry(map, 'x', { reading: 'ねこ' }, 'test'); return String(map.size); } },
            { id: 'ASSET-SCHEMA-COMMON-ROMAJI-VALID', suite: 'unit', rule: 'Common-word evidence may carry reviewed Rule 0 Romaji for internal lexical boundaries', input: '元カノ → Moto Kano', expected: 'accepted', run: () => { try { validateAssetSchema('commonWords', [{ surface: '元カノ', reading: 'もとかの', romaji: 'Moto Kano', pattern: '元カノ' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-COMMON-ROMAJI-REJECT', suite: 'unit', rule: 'Common-word direct Romaji rejects output that violates Rule 0 evidence syntax', input: 'invalid common-word Romaji', expected: 'rejected', run: () => { try { validateAssetSchema('commonWords', [{ surface: '語', reading: 'ご', romaji: '***' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-GENERAL-VALID', suite: 'unit', rule: 'Critical general-word data accepts the documented bank shape', input: 'general-word-bank-v1', expected: 'accepted', run: () => { try { validateAssetSchema('generalWords', [['語', [['ご', 1]], 0]], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-GENERAL-REJECT', suite: 'unit', rule: 'Critical general-word data rejects valid JSON with the wrong structure', input: 'general-word-bank-v1 / wrong shape', expected: 'rejected', run: () => { try { validateAssetSchema('generalWords', { entries: [] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-POLICY', suite: 'unit', rule: 'The public asset policy reports schema contracts alongside criticality', input: 'generalWords', expected: 'general-word-bank-v1', run: () => publicAssetPolicy().generalWords.schema || '' },
            { id: 'RUNTIME-STATE-ISOLATION', suite: 'unit', rule: 'A fresh runtime state owns independent mutable dictionaries', input: 'createRuntimeState()', expected: 'isolated', run: () => { const isolated = createRuntimeState(); isolated.generalWordDictionary.set('__qa__', { readings: [] }); return isolated.generalWordDictionary.has('__qa__') && !runtimeState.generalWordDictionary.has('__qa__') ? 'isolated' : 'shared'; } },
            { id: 'OVERRIDE-EXACT-HELPER', suite: 'unit', rule: 'Rule 0 compatible exact-override infrastructure', input: '例', expected: 'Rei', run: () => findExactOverride('例', { '例': 'Rei' })?.value || '' },
            { id: 'R0-COMMON-KAKURIYO-YADOMESHI', suite: 'engine', rule: 'R0.1 reviewed context-scoped whole-word evidence preserves Kakuriyo and Yadomeshi', input: 'かくりよの宿飯', expected: 'Kakuriyo no Yadomeshi' },
            { id: 'CHECK-MOTOKANO', suite: 'engine', rule: 'Reviewed common-word Romaji preserves the lexical boundary in 元カノ without a generic override', input: '元カノ', expected: 'Moto Kano', expectedRequiresReview: false },
            { id: 'CHECK-RUSSIA-COUNTRY', suite: 'engine', rule: 'Reviewed foreign country names use the conventional English country name', input: 'ロシア', expected: 'Russia', expectedRequiresReview: false },
            { id: 'CHECK-RUSSIA-GO', suite: 'engine', rule: 'Current established country-derived language names preserve the reviewed English country name plus Japanese -go', input: 'ロシア語', expected: 'Russia-go', expectedRequiresReview: false },
            { id: 'CHECK-GERMANY-GO', suite: 'engine', rule: 'Established country-derived language names use reviewed whole-span evidence', input: 'ドイツ語', expected: 'Germany-go', expectedRequiresReview: false },
            { id: 'CHECK-FRANCE-GO', suite: 'engine', rule: 'Established country-derived language names use reviewed whole-span evidence', input: 'フランス語', expected: 'France-go', expectedRequiresReview: false },
            { id: 'CHECK-TURKEY-GO', suite: 'engine', rule: 'Conventional English exonyms are retained inside established country-derived language names', input: 'トルコ語', expected: 'Turkey-go', expectedRequiresReview: false },
            { id: 'CHECK-THAILAND-GO', suite: 'engine', rule: 'An ambiguous bare country surface may still have authoritative whole-span language evidence', input: 'タイ語', expected: 'Thailand-go', expectedRequiresReview: false },
            { id: 'CHECK-UK-GO-NONSTANDARD', suite: 'engine', rule: 'Unapproved country-plus-go compounds must not inherit a bare country source-language mapping', input: 'イギリス語', expected: 'Igirisugo', expectedRequiresReview: true },
            { id: 'CHECK-AMERICA-GO-NONSTANDARD', suite: 'engine', rule: 'Unapproved country-plus-go compounds fall back to Japanese romanisation instead of fabricated English-country hybrids', input: 'アメリカ語', expected: 'Amerikago', expectedRequiresReview: true },
            { id: 'TITLE-BAKEMONOGATARI', suite: 'engine', rule: 'Scoped official title-reading evidence preserves Bakemonogatari without a generic override', input: '化物語', expected: 'Bakemonogatari' },
            { id: 'CHECK-GINTAMA', suite: 'engine', rule: 'Scoped title-reading evidence preserves Gintama without a generic override', input: '銀魂', expected: 'Gintama', expectedRequiresReview: false },
            { id: 'CHECK-JUJUTSUKAISEN', suite: 'engine', rule: 'Scoped title-reading evidence preserves Jujutsu Kaisen without a generic override', input: '呪術廻戦', expected: 'Jujutsu Kaisen', expectedRequiresReview: false },
            { id: 'TITLE-KAKEGURUI', suite: 'engine', rule: 'Scoped official title evidence resolves the stylised 賭ケグルイ orthography as Kakegurui without an exact bypass', input: '賭ケグルイ', expected: 'Kakegurui', expectedRequiresReview: false }
        ];
    }

    const permanentQaMechanisms = Object.freeze([
        { id: 'kana-completeness', label: 'Kana completeness', prefix: 'MECH-KANA-' },
        { id: 'zero-unresolved-japanese', label: 'Zero unresolved Japanese', prefix: 'MECH-ZERO-UNRESOLVED-' },
        { id: 'tokenisation-invariance', label: 'Tokenisation invariance', prefix: 'MECH-TOKENISATION-' },
        { id: 'grammatical-boundaries', label: 'Grammatical boundaries', prefix: 'MECH-GRAMMAR-' },
        { id: 'whole-word-readings', label: 'Whole-word readings', prefix: 'MECH-WHOLE-WORD-' },
        { id: 'ateji-gikun', label: 'Ateji/gikun', prefix: 'MECH-ATEJI-GIKUN-' },
        { id: 'proper-names', label: 'Proper names', prefix: 'MECH-PROPER-NAME-' },
        { id: 'loanwords', label: 'Loanwords', prefix: 'MECH-LOANWORD-' },
        { id: 'uncertainty-propagation', label: 'Uncertainty propagation', prefix: 'MECH-UNCERTAINTY-' },
        { id: 'mixed-script-handling', label: 'Mixed-script handling', prefix: 'MECH-MIXED-SCRIPT-' }
    ]);
    
    function permanentQaMechanismForId(id) {
        const value = String(id || '');
        const definition = permanentQaMechanisms.find(item => value.startsWith(item.prefix));
        return definition?.id || null;
    }
    
    function annotatePermanentQaMechanisms(checks) {
        return checks.map(check => {
            const mechanism = permanentQaMechanismForId(check.id);
            return mechanism ? { ...check, mechanism } : check;
        });
    }
    
    function validatePermanentQaMechanismCheck(check) {
        const problems = [];
        const id = String(check?.id || '');
        if (/(?:^|-)(?:B|TASK|PHASE|MILESTONE)[-_]?\d+[A-Z]?(?:-|$)/i.test(id)) {
            problems.push(`History-coupled permanent regression id: ${id}`);
            return problems;
        }
        if (!id.startsWith('MECH-')) return problems;
    
        const mechanism = permanentQaMechanismForId(id);
        if (!mechanism) problems.push(`Unknown permanent QA mechanism: ${id}`);
        if (check.mechanism !== mechanism) problems.push(`Permanent QA mechanism mismatch: ${id}`);
        const rationale = String(check.rule || '');
        if (rationale.length < 24) problems.push(`Permanent QA rationale is too weak: ${id}`);
        if (/\b(?:Batch|Task|Phase|Milestone)(?:-|\s)*\d+/i.test(rationale)) problems.push(`Permanent QA rationale is history-coupled: ${id}`);
        return problems;
    }
    
    function validatePermanentQaMechanismCoverage(checks) {
        const present = new Set(checks.map(check => check.mechanism).filter(Boolean));
        return permanentQaMechanisms
            .filter(definition => !present.has(definition.id))
            .map(definition => `Missing permanent QA mechanism coverage: ${definition.id}`);
    }
    
    function summarizePermanentQaMechanisms(results, definitionIds) {
        const summary = Object.fromEntries(permanentQaMechanisms.map(definition => [definition.id, {
            label: definition.label,
            passed: 0,
            failed: 0,
            total: 0
        }]));
        for (const result of results) {
            if (!definitionIds.has(result.id) || !result.mechanism || !summary[result.mechanism]) continue;
            summary[result.mechanism].total += 1;
            summary[result.mechanism][result.passed ? 'passed' : 'failed'] += 1;
        }
        return summary;
    }
    
    
    function testPermanentQaMechanismHarness() {
        const valid = annotatePermanentQaMechanisms([{
            id: 'MECH-KANA-HARNESS-PROBE', suite: 'unit',
            rule: 'Supported Kana remains mechanically convertible without an unresolved marker',
            input: 'probe', expected: 'probe'
        }])[0];
        const validProblems = validatePermanentQaMechanismCheck(valid);
        const historyProblems = validatePermanentQaMechanismCheck({
            id: `MILESTONE-${1}-HARNESS-PROBE`, suite: 'unit',
            rule: 'Artificial boundary changes must not affect a known lexical span',
            input: 'probe', expected: 'probe'
        });
        const unknownProblems = validatePermanentQaMechanismCheck({
            id: 'MECH-UNKNOWN-HARNESS-PROBE', suite: 'unit',
            mechanism: 'unknown',
            rule: 'A permanent regression must belong to a recognised linguistic mechanism',
            input: 'probe', expected: 'probe'
        });
        const rationaleProblems = validatePermanentQaMechanismCheck({
            id: 'MECH-KANA-HARNESS-RATIONALE', suite: 'unit',
            mechanism: 'kana-completeness',
            rule: 'Milestone 1 provenance alone is not a behaviour-focused rationale',
            input: 'probe', expected: 'probe'
        });
        return validProblems.length === 0
            && historyProblems.some(problem => problem.includes('History-coupled'))
            && unknownProblems.some(problem => problem.includes('Unknown permanent QA mechanism'))
            && rationaleProblems.some(problem => problem.includes('rationale is history-coupled'));
    }

    const regressionCheckOrder = Object.freeze([
        "R0-KANA-SOKUON",
        "R0-KANA-SOKUON-SH",
        "R0-KANA-SOKUON-CH",
        "R0-KATAKANA-SOKUON",
        "R0-KANA-SOKUON-TS",
        "R0-KANA-SOKUON-YOON",
        "R0-KATAKANA-SOKUON-VOICED-G",
        "R0-KATAKANA-SOKUON-VOICED-D",
        "R0-KATAKANA-SOKUON-VOICED-B",
        "R0-KATAKANA-SOKUON-VOICED-Z",
        "R0-KATAKANA-SOKUON-J",
        "R0-KATAKANA-SOKUON-F",
        "R0-KATAKANA-SOKUON-H",
        "R0-KATAKANA-SOKUON-V",
        "R0-KATAKANA-SOKUON-EXTENDED-TI",
        "R0-SOKUON-NO-VOWEL-DOUBLING",
        "R0-SOKUON-NO-SONORANT-GUESS",
        "SYS-AUDIT-SOKUON-BEFORE-VOWEL",
        "SYS-AUDIT-SOKUON-BEFORE-SONORANT",
        "SYS-AUDIT-SOKUON-NONGEMINATIVE-FAMILIES",
        "SYS-AUDIT-REPEATED-SOKUON",
        "SYS-AUDIT-HISTORICAL-FULL-SIZE-SOKUON",
        "SYS-AUDIT-MODERN-FULL-SIZE-TSU-GUARD",
        "SYS-AUDIT-INITIAL-REGULAR-SOKUON",
        "R0-KANA-FOREIGN-DU",
        "R0-KANA-N-APOSTROPHE",
        "SYS-N-BOUNDARY-VOWEL",
        "SYS-N-BOUNDARY-Y",
        "SYS-N-BOUNDARY-CONSONANT",
        "SYS-AUDIT-WHOLE-WORD-AMBIGUITY",
        "SYS-ITERATION-MARK-UNATTESTED-REVIEW",
        "SYS-ITERATION-MARK-ATTESTED-CLEAR",
        "SYS-AUDIT-TERMINAL-SOKUON-POLICY-GAP",
        "SYS-AUDIT-TERMINAL-KATAKANA-SOKUON",
        "SYS-AUDIT-MEDIAL-SOKUON-CLEAR",
        "SYS-NAME-CONTEXT-UNKNOWN-GIVEN",
        "SYS-NAME-SPAN-PREFIX-GUARD",
        "SYS-SOURCE-SPELLING-REVIEW",
        "SYS-NUMERIC-TOKEN-JOIN",
        "SYS-NUMERIC-GROUP-BOUNDARY",
        "SYS-NUMERIC-TENS-JOIN",
        "SYS-NUMERIC-YEN-BOUNDARY",
        "SYS-NUMERIC-SWALLOWED-UNIT-SPLIT",
        "SYS-NUMERIC-N-APOSTROPHE-GUARD",
        "SYS-NUMERIC-LARGE-UNIT-JOIN",
        "SYS-NUMERIC-LARGE-UNIT-N-APOSTROPHE-GUARD",
        "SYS-NUMERIC-LITERAL-LEXICAL-AMBIGUITY",
        "R0-KANA-LARGE-TSU",
        "R0-KANA-OU",
        "R0-KANA-OO",
        "R0-PUNCT-WAVE-TILDE",
        "SYS-BOUNDARY-AUX-BASIC-IRU",
        "SYS-BOUNDARY-AUX-BASIC-DA",
        "SYS-BOUNDARY-AUX-CONTINUATION-U",
        "SYS-CASUAL-CONTRACTION-TERU",
        "SYS-CASUAL-CONTRACTION-DERU",
        "SYS-CASUAL-CONTRACTION-MISPARSED-STEM",
        "SYS-CASUAL-CONTRACTION-INDEPENDENT-GUARD",
        "SYS-DESIDERATIVE-GARU-METADATA",
        "SYS-REVIEWED-GODAN-RA-INFLECTION-INDEX",
        "SYS-DESIDERATIVE-GARU-BASE",
        "SYS-DESIDERATIVE-GARU-CONTRACTED",
        "SYS-DESIDERATIVE-GARU-UNCONTRACTED",
        "SYS-DESIDERATIVE-GARU-NDA",
        "SYS-REVIEWED-GODAN-RA-KOKURU",
        "SYS-REVIEWED-GODAN-RA-KOKUTTE",
        "SYS-REVIEWED-GODAN-RA-KOKURANAI",
        "SYS-REVIEWED-GODAN-RA-KOKURASETAI",
        "SYS-KOKOSAKE-MORPHOLOGY",
        "CHECK-RANMA-COMPACT-FRACTION-JOIN",
        "CHECK-RANMA-COMPACT-FRACTION-WAVE-TAIL-JOIN",
        "CHECK-RANMA-COMPACT-FRACTION-GUARD",
        "CHECK-RANMA-COMPACT-NONFRACTION-GUARD",
        "SYS-KANA-RESCUE-GRAMMATICAL-TAIL-GUARD",
        "SYS-KANA-RESCUE-ANNAI-PRESERVED",
        "SYS-KANA-RESCUE-TOKYO-PRESERVED",
        "SYS-PUNCT-CENTRAL-WAVE",
        "SYS-PUNCT-WAVE-BEFORE-FULL-STOP",
        "SYS-PUNCT-WAVE-BEFORE-COMMA",
        "SYS-PUNCT-CENTRAL-WAVE-QUOTE",
        "R0-PUNCT-ELLIPSIS-SPACING",
        "R0-KANA-YOON",
        "R0-KANA-DI-YOON",
        "R0-KANA-LONG-MARK",
        "R0-PUNCT-QUOTES",
        "R0-PUNCT-SINGLE-QUOTE-MARKERS",
        "R0-PUNCT-DASH",
        "CHECK-PUNCT-SUBTITLE-BARS",
        "CHECK-PUNCT-SUBTITLE-BARS-WAVE-BOUNDARY",
        "CHECK-PUNCT-SINGLE-BAR-GUARD",
        "CHECK-PUNCT-NONTERMINAL-BAR-GUARD",
        "UI-KANJIDIC-DISPLAY-OKURIGANA",
        "UI-KANJIDIC-DISPLAY-AFFIX",
        "UI-KANJIDIC-DISPLAY-DEDUP-IRU",
        "UI-KANJIDIC-DISPLAY-DEDUP-GYOU",
        "CHECK-HAN-SUPPLEMENTARY",
        "CHECK-HAN-DUPLICATE-POSITIONS",
        "CHECK-HAN-UTF16-POSITIONS",
        "CHECK-HAN-SECOND-REPLACEMENT",
        "CHECK-UI-DEBOUNCE-LATEST",
        "CHECK-UI-DEBOUNCE-CANCEL",
        "CHECK-UI-DISPOSE-REFRESH",
        "CHECK-BIND-OVERRIDE-ISOLATION",
        "READING-RESOLUTION-UNRESOLVED-KANJI",
        "VARIANT-NFKC-COMPAT",
        "VARIANT-IVS-LOOKUP",
        "VARIANT-GENERAL-KYUJITAI",
        "VARIANT-NAME-TSUCHIYOSHI",
        "VARIANT-NAME-NOT-GENERAL",
        "VARIANT-NAME-TAKA",
        "VARIANT-NAME-WATANABE",
        "VARIANT-NAME-SYMBOL-TOKEN-YOSHIDA",
        "VARIANT-NAME-SYMBOL-TOKEN-YAMAZAKI",
        "READING-RESOLUTION-NAME-RANKED-AMBIGUITY",
        "RANK-NAME-EQUAL-EVIDENCE",
        "RANK-NAME-CLEAR-EVIDENCE",
        "RANK-NIHON-BALANCED",
        "R0-NO-HAN-GUARD",
        "PERF-CONTEXT-OVERRIDE-INDEX",
        "PERF-COMMON-WORD-PREFIX",
        "PERF-LOANWORD-PREFIX",
        "CHECK-REGEX-REJECT-NESTED-QUANTIFIER",
        "CHECK-REGEX-ALLOW-REVIEWED-LOOKAHEAD",
        "CHECK-REGEX-SCHEMA-REJECTS-UNSAFE",
        "CHECK-EXACT-OVERRIDE-SCHEMA-VALID",
        "CHECK-EMPTY-EXACT-OVERRIDE-BANK",
        "CHECK-EXACT-OVERRIDE-REJECT-HAN",
        "CHECK-EXACT-OVERRIDE-REJECT-MACRON",
        "CHECK-EXACT-OVERRIDE-GUARD-AUDIT",
        "CHECK-EXACT-OVERRIDE-SAFE-AUDIT",
        "CHECK-LONG-KUROMOJI-RESCUE-9",
        "CHECK-LONG-HISTORICAL-SPAN-11",
        "CHECK-LONG-REVIEWED-NAME-SPAN-11",
        "CHECK-LONG-AUTHORITATIVE-SPAN-13",
        "CHECK-LONG-VARIANT-NAME-9",
        "DATA-SEMANTIC-READING-NORMALISE",
        "DATA-ROMAJI-SOURCE-SAFE",
        "DATA-ROMAJI-REJECT-HAN",
        "DATA-DUPLICATE-EQUAL-IDEMPOTENT",
        "DATA-DUPLICATE-CONFLICT-REJECTED",
        "COMPOUND-MULTI-READING-NO-LAST-ROW-WINS",
        "R0-UNRESOLVED-KANJI-ROMAJI",
        "ASSET-SCHEMA-GENERAL-VALID",
        "ASSET-SCHEMA-PROPER-NOUN-COMPACT",
        "ASSET-SCHEMA-GENERAL-REJECT",
        "ASSET-SCHEMA-POLICY",
        "RUNTIME-STATE-ISOLATION",
        "SRC-GENERAL-WORD-BANK-LOADED",
        "SRC-GENERAL-WORD-UNIQUE-FALLBACK",
        "R0-GENERAL-WORD-SINGLE-TOKEN-AUTHORITY",
        "R0-GENERAL-WORD-ITERATION-MARK-AUTHORITY",
        "R0-GENERAL-WORD-SHIME-AUTHORITY",
        "R0-GENERAL-WORD-SUPPLEMENTARY-HAN-AUTHORITY",
        "SRC-GENERAL-WORD-AMBIGUITY",
        "SRC-GENERAL-WORD-KUROMOJI-WINS",
        "SRC-GENERAL-WORD-SPAN-FALLBACK",
        "READING-RESOLUTION-COMPOUND-FALLBACK",
        "READING-RESOLUTION-NAME-CONTEXT",
        "R0-READING-HITORI-CONTEXT",
        "R0-KANA-SURFACE-PRIORITY",
        "R0-KANA-ORTHOGRAPHIC-PRONUNCIATION",
        "R0-KANA-PRONUNCIATION-GUARD",
        "R0-COMMON-SPAN-HITORI",
        "R0-COMMON-SPAN-TOUKYOU",
        "SRC-ATEJI-WHOLE-WORD",
        "SRC-JMNEDICT-PROPER-NOUN",
        "SRC-GRAMMAR-PARTICLE-EXPRESSION",
        "R0-GRAMMAR-BOUNDARY-AFTER-AUX",
        "R0-GRAMMAR-BOUNDARY-AFTER-PUNCT",
        "SRC-CONJUGATION-DATA",
        "SRC-READING-EVIDENCE-BOKU",
        "SRC-READING-EVIDENCE-NIHON",
        "CHECK-AUDIT-PUNCT-IGNORED",
        "CHECK-IVS-HAN-STRIP",
        "CHECK-EMOJI-VS-PRESERVE",
        "CHECK-BARE-WI-HIRAGANA",
        "CHECK-BARE-WI-KATAKANA",
        "CHECK-BARE-WE-HIRAGANA",
        "CHECK-BARE-WE-KATAKANA",
        "CHECK-WIRU-MODERN",
        "CHECK-MAWIRU-MODERN",
        "CHECK-KOWE-MODERN",
        "CHECK-UWERU-MODERN",
        "CHECK-MIXED-UWERU-MODERN",
        "CHECK-STYLISTIC-KATAKANA",
        "CHECK-MODERN-HIRAGANA-CONTROL",
        "CHECK-MODERN-KATAKANA-CONTROL",
        "CHECK-UNSUPPORTED-CYRILLIC",
        "CHECK-UNSUPPORTED-KOREAN",
        "CHECK-UNSUPPORTED-ARABIC",
        "OVERRIDE-EXACT-HELPER",
        "CHECK-NAME-FOLLOWING-LEXICAL",
        "CHECK-NAME-HONORIFIC-FOLLOWING-LEXICAL",
        "CHECK-IRU-LEXICAL",
        "CHECK-IRU-AUX",
        "SYS-AUX-FAMILY-ITA",
        "SYS-AUX-FAMILY-INAI",
        "SYS-AUX-FAMILY-IMASU",
        "SYS-AUX-FAMILY-IMASHITA",
        "SYS-AUX-KANA-SURU-ITA",
        "SYS-AUX-KANA-SURU-INAI",
        "SYS-AUX-CHAIN-DAROU",
        "SYS-AUX-CHAIN-NOMINAL-DAROU",
        "SYS-AUX-CHAIN-ADJECTIVAL-DAROU",
        "SYS-AUX-CHAIN-DE-ARU",
        "SYS-CASUAL-FAMILY-TABETERU",
        "SYS-CASUAL-FAMILY-YONDERU",
        "SYS-CASUAL-FAMILY-KOISHITERU",
        "SYS-CASUAL-FAMILY-AISHITERU",
        "SYS-TITLE-DANMACHI-BOUNDARIES",
        "SYS-TITLE-ANSATSUSHA-GUARD",
        "SYS-TITLE-KOISHITERU-PUNCT",
        "CHECK-LATIN-EMAIL",
        "CHECK-LATIN-AMPERSAND",
        "CHECK-LATIN-HASH",
        "CHECK-ARABIC-SANBON",
        "CHECK-ARABIC-FUTSUKA",
        "CHECK-ARABIC-HATACHI",
        "CHECK-CALENDAR-DATE",
        "R0-LEXICAL-SHITE",
        "R0-VERB-SHITTEIRU",
        "R0-VERB-ITTEIRU",
        "R0-SOKUON-TARA-BOUNDARY",
        "R0-GRAMMAR-NONI-AFTER-AUX",
        "R0-GRAMMAR-NONI-AFTER-VERB",
        "R0-PARTICLE-NI",
        "R0-PARTICLE-E-NO",
        "R0-PARTICLE-O",
        "R0-PARTICLE-O-2",
        "R0-WHOLE-WORD-HITORI",
        "R0-SURFACE-SOKUON",
        "R0-SURFACE-N-APOSTROPHE",
        "R0-PUNCT-SINGLE-QUOTE-TITLE",
        "R0-PUNCT-SINGLE-QUOTE-APOSTROPHE",
        "CHECK-DOUBLE-QUOTE-NORMAL",
        "CHECK-DOUBLE-QUOTE-MIXED-NESTING",
        "CHECK-DOUBLE-QUOTE-SAME-NESTING",
        "CHECK-DOUBLE-QUOTE-UNMATCHED-OPEN",
        "CHECK-DOUBLE-QUOTE-UNMATCHED-CLOSE",
        "CHECK-ASCII-QUOTE-GUARD",
        "CHECK-ASCII-DOUBLE-NEST-GUARD",
        "CHECK-N-APOSTROPHE-GUARD",
        "R0-N-APOSTROPHE-Y-WORD",
        "R0-INTEGRATION-APOSTROPHE-STRESS",
        "R0-VARIANT-NAME-YOSHIDA",
        "R0-VARIANT-NAME-TAKAHASHI",
        "R0-VARIANT-NAME-WATANABE",
        "R0-VARIANT-NAME-YAMASAKI",
        "R0-SURFACE-OU",
        "R0-LEXICAL-ARUIWA",
        "R0-MIXED-ARUIWA",
        "R0-MIXED-MATAWA",
        "R0-MIXED-MOSHIKUWA",
        "R0-MIXED-NEGAWAKUWA",
        "R0-GREETING-KONNICHIWA",
        "R0-GREETING-KONBANWA",
        "R0-CONJUNCTION-SOREDEWA",
        "R0-PRONUNCIATION-GUARD-KOUIU",
        "R0-PRONUNCIATION-GUARD-KOUIU-PUNCT",
        "R0-EXACT-NAME-ISAO",
        "R0-EXACT-NAME-MITSUO",
        "R0-EXACT-NAME-FUMIE",
        "R0-EXACT-NAME-CONTEXT-GUARD-WO",
        "R0-EXACT-NAME-CONTEXT-GUARD-HE",
        "R0-EXTREME-ARUIWA-TITLE",
        "R0-PARTICLE-E",
        "R0-WORD-HE",
        "R0-WORD-HA",
        "R0-PUNCT-LOANWORD-TEST",
        "R0-LOANWORD-AUTUMN",
        "R0-LOANWORD-DUNGEON",
        "R0-COMMON-KAKUSHIGOTO",
        "R0-COMMON-SAIJAKU",
        "R0-COMMON-KOUTETSUJOU",
        "R0-LOANWORD-JAADUGAR",
        "CHECK-OOSAKAJOU",
        "CHECK-KAOHSIUNG-EKI",
        "CHECK-YOKOHAMA-GREEN-LINE",
        "CHECK-CHUN-LI",
        "CHECK-KAOHSIUNG-CONTEXT",
        "CHECK-CHUN-LI-CONTEXT",
        "R0-ATEJI-CAN",
        "R0-PARTICLE-NANODE",
        "R0-CAP-MATOMETE",
        "R0-WHOLE-WORD-KYOKUFURI",
        "R0-INFLECTION-MASU",
        "R0-AUX-DESHITA-SPACING",
        "SRC-GRAMMAR-NI-TSUITE",
        "R0-AMBIGUOUS-NIHON",
        "R0-AMBIGUOUS-NIHON-NI-TSUITE",
        "SRC-GRAMMAR-NI-TOTTE",
        "SRC-GRAMMAR-TO-SHITE",
        "SRC-ATEJI-SUSHI",
        "R0-CANONICAL-TITLE",
        "R0-INTEGRATION-NONI-BOUNDARY",
        "R0-COMMON-TOTSUKUNI",
        "R0-COMMON-HEIKE",
        "R0-COMMON-YURI",
        "R0-LOANWORD-ATELIER",
        "R0-LOANWORD-TELEPATH",
        "R0-LOANWORD-TRAIN",
        "R0-PUNCT-WAVE-TITLE",
        "SYS-PUNCT-WAVE-NFKC-PROVENANCE",
        "SYS-PUNCT-WAVE-ASCII-CONSISTENCY",
        "R0-COMMON-SEWAYAKI",
        "R0-COMMON-AMAAMA",
        "R0-COMMON-UZAI",
        "R0-COMMON-OTOKONOKO",
        "R0-COMMON-KAKURIYO-YADOMESHI",
        "R0-LOANWORD-DROPKICK",
        "R0-LOANWORD-CIRCUS",
        "R0-COMMON-HINAMATSURI",
        "R0-COMMON-KUNOICHI",
        "R0-LOANWORD-QUEST",
        "R0-LOANWORD-AQUATOPE",
        "R0-FOREIGN-NAME-DARWIN",
        "DIFF-IPPai",
        "DIFF-SHIITE",
        "DIFF-NUKERU",
        "DIFF-IKKYOKU",
        "DIFF-IPPO",
        "DIFF-SHITAPPARA",
        "DIFF-MIBAE",
        "DIFF-ONAJIMI",
        "DIFF-KOUKUUGAISHA",
        "DIFF-CHOUME",
        "DIFF-HIGAWARI",
        "DIFF-YATSUATARI",
        "DIFF-OMITAMA",
        "DIFF-HOKKYOKUTEN",
        "RENDAKU-KAKUGARI",
        "RENDAKU-KUSAKARI",
        "RENDAKU-TORAGARI",
        "RENDAKU-AJITSUKE",
        "RENDAKU-KUGIZUKE",
        "STRESS-KANA-N-Y",
        "STRESS-KANA-YOON-BOUNDARY",
        "STRESS-KANA-SOKUON-ECCHI",
        "STRESS-KANA-SOKUON-GAKKOU",
        "STRESS-COUNTER-FUTARI",
        "STRESS-COUNTER-REPETITION-GUARD",
        "STRESS-DATE-FUTSUKA",
        "STRESS-COUNTER-IPPON",
        "STRESS-COUNTER-SANBON",
        "SYS-N-KANA-LEXICAL-ANNAI",
        "SYS-N-KANA-LEXICAL-KYAKKAN",
        "SYS-N-KANA-LEXICAL-KYOURYUU",
        "SYS-N-KANA-LEXICAL-SENEN",
        "SYS-N-READING-BOUNDARY-KANJI",
        "SYS-NUMERIC-COMPOUND-SPACING",
        "SYS-N-GUARD-CONSONANT",
        "SYS-N-VOWEL-KONIN",
        "SYS-COUNTER-IKKAGETSU-KANJI",
        "SYS-COUNTER-IKKAGETSU-SMALL-KE",
        "SYS-COUNTER-IKKAGETSU-HIRAGANA",
        "SYS-COUNTER-IKKASHO-KANJI",
        "SYS-COUNTER-IKKASHO-SMALL-KE",
        "SYS-COUNTER-IKKASHO-HIRAGANA",
        "SYS-NUMERIC-COMPOSITE-YEN",
        "SYS-NUMERIC-LONG-GROUPING",
        "SYS-NUMERIC-SANBYAKU-RULE0-N",
        "SYS-NUMERIC-SANMAN-RULE0-N",
        "SYS-NUMERIC-OKU-MAN-GROUPING",
        "SYS-NUMERIC-CHOU-SOKUON-ICCHOU",
        "SYS-NUMERIC-CHOU-SOKUON-HACCHOU",
        "SYS-NUMERIC-CHOU-SOKUON-JUCCHOU",
        "SYS-NUMERIC-MULTI-LARGE-UNIT-GROUPING",
        "SYS-NUMERIC-LEXICAL-AMBIGUITY-AUDIT",
        "R0-TSU-VS-SOKUON-ENGINE",
        "R0-SOKUON-SINO-LEXICAL",
        "R0-SOKUON-VERB-ONBIN",
        "R0-SOKUON-VERB-IKU-EXCEPTION",
        "R0-SOKUON-EMPHATIC-MEDIAL",
        "R0-SOKUON-COUNTER-P",
        "R0-SOKUON-COUNTER-K",
        "R0-SOKUON-DATE",
        "R0-SOKUON-INITIAL-COLLOQUIAL",
        "R0-SOKUON-TERMINAL-NO-PUNCT",
        "R0-SOKUON-TERMINAL-BEFORE-SPACE",
        "R0-SOKUON-TERMINAL-BEFORE-QUOTE",
        "R0-SOKUON-BEFORE-VOWEL-AUDIT",
        "R0-SOKUON-BEFORE-R-AUDIT",
        "R0-SOKUON-REPEATED-AUDIT",
        "R0-SOKUON-HALFWIDTH",
        "R0-KATAKANA-SOKUON-REVIEWED-LOANWORD",
        "R0-TERMINAL-SOKUON-AUDIT-ELLIPSIS",
        "STRESS-AGE-HATACHI",
        "STRESS-VARIANT-SEJI",
        "STRESS-VARIANT-GRAMMAR-GUARD",
        "STRESS-VS-NAME-KAMIKI",
        "STRESS-EVIDENCE-TSUNDOKU",
        "STRESS-EVIDENCE-HEIRITSU",
        "STRESS-ATEJI-TEMPURA",
        "STRESS-ATEJI-JINGISUKAN",
        "STRESS-NAME-HONORIFIC-KAMIKI",
        "STRESS-NAME-HONORIFIC-TSUNEOKI",
        "STRESS-UNICODE-DECOMPOSED-KANA",
        "STRESS-UNICODE-HALFWIDTH-KANA",
        "STRESS-UNICODE-FULLWIDTH-DIGITS",
        "STRESS-LATIN-APOSTROPHE",
        "STRESS-LATIN-SLASH",
        "STRESS-LATIN-ORDINAL",
        "STRESS-LOANWORD-ICE-CREAM",
        "STRESS-FOREIGN-NAME-EINSTEIN",
        "SYS-LOANWORD-CAKE",
        "SYS-FOREIGN-NAME-JACK-SKELLINGTON",
        "SYS-JAPANESE-NAME-WHITESPACE",
        "STRESS-GRAMMAR-RESCUE-GUARD",
        "R0-TITLE-SLIME",
        "HIST-WOKASHI",
        "HIST-WIDO",
        "HIST-WIRU",
        "HIST-MAWIRU",
        "HIST-OMOHIDE",
        "HIST-KOWE",
        "HIST-UWERU",
        "HIST-KANGAERU",
        "HIST-WOTOKO",
        "HIST-TOWOKA",
        "HIST-WODORU",
        "HIST-AWOI",
        "HIST-OMOWAZU",
        "HIST-KEFU",
        "HIST-TEFU",
        "HIST-IU",
        "HIST-YUUGATA",
        "HIST-KAGEROU",
        "HIST-FUKUROU",
        "HIST-KAU",
        "HIST-GUARD-WO",
        "HIST-GUARD-HE",
        "HIST-GUARD-HA",
        "HIST-GUARD-KOUIU",
        "HIST-GUARD-KONNICHIWA",
        "HIST-GUARD-NAME-WO",
        "HIST-GUARD-NAME-HE",
        "HIST-GUARD-KA-WA",
        "TITLE-READING-CONTEXT-OCCURRENCE",
        "CHECK-NO-RANMA-EXACT-OVERRIDE",
        "CHECK-NO-RUROUNI-EXACT-OVERRIDE",
        "TITLE-RUROUNI-FULL",
        "TITLE-RUROUNI-KENKAKU-NONLEAK",
        "TITLE-RUROUNI-EVIDENCE-SCOPE",
        "TITLE-RANMA-SCOPED-EVIDENCE",
        "TITLE-RANMA-COMPACT-TYPOGRAPHY",
        "TITLE-RANMA-SEGMENT-BOUNDARY",
        "TITLE-RANMA-COMPACT-NONLEAK",
        "CHECK-MOTOKANO",
        "CHECK-RUSSIA-COUNTRY",
        "CHECK-RUSSIA-GO",
        "CHECK-GERMANY-GO",
        "CHECK-FRANCE-GO",
        "CHECK-TURKEY-GO",
        "CHECK-THAILAND-GO",
        "CHECK-UK-GO-NONSTANDARD",
        "CHECK-AMERICA-GO-NONSTANDARD",
        "CHECK-BAKEMONOGATARI",
        "CHECK-GINTAMA",
        "CHECK-JUJUTSUKAISEN",
        "CHECK-KIMETSU",
        "CHECK-MAMAHAHA",
        "CHECK-URUSEI",
        "CHECK-KOWLOON",
        "CHECK-MADE-IN-ABYSS",
        "CHECK-VANITAS-CARTE",
        "CHECK-TASOGARE-AMNESIA",
        "TITLE-GIKUN-KOISURU-ASTEROID",
        "TITLE-GIKUN-AO-EXORCIST",
        "TITLE-GIKUN-INDEX",
        "TITLE-GIKUN-HEROINE",
        "TITLE-GIKUN-BISQUE-DOLL",
        "TITLE-OFFICIAL-FRIEREN",
        "TITLE-OFFICIAL-GRIMGAR",
        "TITLE-OFFICIAL-WISTORIA",
        "TITLE-GIKUN-NONLEAK-HEROINE",
        "TITLE-GIKUN-NONLEAK-SORA",
        "TITLE-READING-NONLEAK-TSURUGI",
        "TITLE-GIKUN-YORIMOI-SORA",
        "CHECK-UMINEKO",
        "CHECK-KOBAYASHI-MAID-DRAGON",
        "CHECK-MACHIKADO-MAZOKU",
        "CHECK-SENKO",
        "CHECK-KEMONOTACHI",
        "CHECK-SHIKIMORI",
        "CHECK-INUBOKU",
        "CHECK-TORADORA",
        "CHECK-NATSUYUKI",
        "CHECK-TOKYO-GHOUL",
        "CHECK-RAILGUN",
        "CHECK-KAKEGURUI",
        "TITLE-ITERATION-MAJO-TABITABI",
        "CHECK-ODD-TAXI",
        "CHECK-LYCORIS-RECOIL",
        "CHECK-SUMMER-TIME-RENDERING",
        "CHECK-UNDER-NINJA",
        "CHECK-DURARARA",
        "CHECK-SHIKANOKO",
        "CHECK-YURU-CAMP",
        "CHECK-KAGEKI-SHOUJO",
        "CHECK-DEAIMON",
        "CHECK-FLYING-WITCH",
        "CHECK-BARAKAMON",
        "CHECK-NON-NON-BIYORI",
        "CHECK-WARUMONO",
        "CHECK-MORIBITO",
        "CHECK-ARUJI",
        "CHECK-UBUME",
        "CHECK-JOROUGUMO",
        "CHECK-KABUKI",
        "CHECK-ZENSHUU",
        "CHECK-RUROUNI",
        "CHECK-YATAGARASU",
        "CHECK-KAMONOHASHI",
        "CHECK-SENGOKU-YOUKO",
        "CHECK-KYONYUU",
        "CHECK-NUE-NO-ISHIBUMI",
        "CHECK-TOUHAI",
        "CHECK-KOMI-CONTEXT",
        "MECH-LOANWORD-DEATH-NOTE-REVIEWED-OUTPUT",
        "MECH-LOANWORD-GUNDAM-TOKEN-SPLIT",
        "MECH-LOANWORD-ONE-PIECE-REVIEWED-OUTPUT",
        "MECH-LOANWORD-STRAY-DOGS-REVIEWED-OUTPUT",
        "MECH-LOANWORD-ASCII-FOLD-MARCHEN",
        "MECH-LOANWORD-ASCII-FOLD-DEBUT",
        "MECH-LOANWORD-GERMAN-SOURCE",
        "MECH-LOANWORD-FRENCH-SOURCE",
        "MECH-LOANWORD-PORTUGUESE-SOURCE",
        "MECH-LOANWORD-DUTCH-SOURCE",
        "MECH-LOANWORD-AUTHORITATIVE-CASE-EBAY",
        "MECH-MIXED-SCRIPT-LOANWORD-SPACEX-ALIAS",
        "MECH-LOANWORD-HOMOGRAPH-BUS-PRECEDENCE",
        "MECH-LOANWORD-AUTHORITY-UNCTAD",
        "MECH-LOANWORD-UNVERIFIED-PARTIAL-SOURCE-EXCLUDED",
    ]);

    const regressionAreaDefinitions = Object.freeze([
        { id: 'romaji-core', label: 'Romaji rules', getChecks: getRomajiCoreRegressionChecks },
        { id: 'tokenisation-and-merging', label: 'Tokenisation and merging', getChecks: getTokenisationAndMergingRegressionChecks },
        { id: 'tokenisation-mutation', label: 'Tokenisation mutation', getChecks: getTokenisationMutationRegressionChecks },
        { id: 'numbers-and-counters', label: 'Numbers and counters', getChecks: getNumbersAndCountersRegressionChecks },
        { id: 'names-and-loanwords', label: 'Names and loanwords', getChecks: getNamesAndLoanwordsRegressionChecks },
        { id: 'grammar', label: 'Grammar', getChecks: getGrammarRegressionChecks },
        { id: 'ambiguity-and-audit', label: 'Ambiguity and audit', getChecks: getAmbiguityAndAuditRegressionChecks },
        { id: 'historical-kana', label: 'Historical kana', getChecks: getHistoricalKanaRegressionChecks },
        { id: 'runtime-and-api', label: 'Runtime and API', getChecks: getRuntimeAndApiRegressionChecks }
    ]);
    
    function getRegressionDefinitions(options = {}) {
        const order = new Map(regressionCheckOrder.map((id, index) => [id, index]));
        const selectedArea = options.area ? String(options.area) : null;
        if (selectedArea && !regressionAreaDefinitions.some(area => area.id === selectedArea)) {
            throw new Error(`Unknown regression area: ${selectedArea}`);
        }
        const selectedAreas = selectedArea
            ? regressionAreaDefinitions.filter(area => area.id === selectedArea)
            : regressionAreaDefinitions;
        const allChecks = annotatePermanentQaMechanisms(selectedAreas.flatMap(area =>
            area.getChecks().map(check => ({ ...check, area: area.id }))
        )).sort((left, right) => (order.get(left.id) ?? Number.MAX_SAFE_INTEGER) - (order.get(right.id) ?? Number.MAX_SAFE_INTEGER));
        return {
            selectedArea,
            availableAreas: regressionAreaDefinitions.map(({ id, label }) => ({ id, label })),
            unitChecks: allChecks.filter(check => check.suite === 'unit'),
            engineChecks: allChecks.filter(check => check.suite === 'engine'),
            historicalChecks: allChecks.filter(check => check.suite === 'historical'),
            overrideChecks: allChecks.filter(check => check.suite === 'override')
        };
    }
    
    
    function runRegressionChecks(options = {}) {
        const definitions = getRegressionDefinitions(options);
        const allChecks = [...definitions.unitChecks, ...definitions.engineChecks, ...definitions.historicalChecks, ...definitions.overrideChecks];
        const failures = [];
        const results = [];
        const definitionProblems = validateRegressionDefinitions(allChecks, {
            requireMechanismCoverage: !definitions.selectedArea
        });
        for (const problem of definitionProblems) failures.push({ type: 'harness', suite: 'harness', input: problem, expected: 'valid regression definition', actual: problem });
        const harnessPassed = testRegressionHarness();
        if (!harnessPassed) failures.push({ type: 'harness', suite: 'harness', input: 'regression comparator', expected: 'detect pass and deliberate failure', actual: 'self-test failed' });
    
        const recordResult = result => {
            results.push(result);
            if (!result.passed) failures.push({ ...result, type: result.suite });
        };
        const recordInvariants = (check, actual) => {
            for (const invariantResult of runRegressionInvariants(check, actual)) recordResult(invariantResult);
        };
        const recordExpectedReviewState = (check, useOverrides = false, options = {}) => {
            if (!Object.prototype.hasOwnProperty.call(check, 'expectedRequiresReview')) return;
            const audit = translateAuditForGeneratedQa(check.input, useOverrides, options);
            recordResult({
                id: `${check.id}-REVIEW`,
                suite: check.suite,
                area: check.area || null,
                rule: `${check.rule} (review state)`,
                input: check.input,
                expected: String(Boolean(check.expectedRequiresReview)),
                expectedAny: null,
                actual: String(Boolean(audit.requiresReview)),
                passed: Boolean(check.expectedRequiresReview) === Boolean(audit.requiresReview)
            });
        };
    
        for (const check of definitions.unitChecks) {
            let actual;
            try { actual = check.run(); } catch (error) { actual = `ERROR: ${error.message || error}`; }
            recordResult(evaluateRegressionResult(check, actual));
        }
    
        if (runtimeState.tokenizer) {
            for (const check of definitions.engineChecks) {
                const actual = translateForRegression(check.input, false);
                const result = evaluateRegressionResult(check, actual);
                results.push(result);
                if (!result.passed) {
                    const rawTokens = runtimeState.tokenizer.tokenize(check.input).map(token => ({
                        surface: token.surface_form,
                        reading: token.reading,
                        pronunciation: token.pronunciation,
                        pos: token.pos,
                        detail1: token.pos_detail_1,
                        detail2: token.pos_detail_2
                    }));
                    failures.push({ ...result, type: check.suite, rawTokens });
                }
                recordInvariants(check, actual);
                recordExpectedReviewState(check, false);
            }
            for (const check of definitions.historicalChecks) {
                const actual = translateForRegression(check.input, false, { historicalKana: true });
                const result = evaluateRegressionResult(check, actual);
                results.push(result);
                if (!result.passed) {
                    const rawTokens = runtimeState.tokenizer.tokenize(check.input).map(token => ({
                        surface: token.surface_form, reading: token.reading, pronunciation: token.pronunciation,
                        pos: token.pos, detail1: token.pos_detail_1, detail2: token.pos_detail_2
                    }));
                    failures.push({ ...result, type: check.suite, rawTokens });
                }
                recordInvariants(check, actual);
                recordExpectedReviewState(check, false, { historicalKana: true });
            }
            for (const check of definitions.overrideChecks) {
                const actual = translateForRegression(check.input, true);
                recordResult(evaluateRegressionResult(check, actual));
                recordInvariants(check, actual);
                recordExpectedReviewState(check, true);
            }
        }
    
        const summary = results.reduce((acc, result) => {
            const suite = result.suite || 'unknown';
            acc[suite] = acc[suite] || { passed: 0, failed: 0, total: 0 };
            acc[suite].total += 1;
            acc[suite][result.passed ? 'passed' : 'failed'] += 1;
            return acc;
        }, {});
        const mechanismSummary = summarizePermanentQaMechanisms(results, new Set(allChecks.map(check => check.id)));
        if (!failures.length) console.info(`Regression assertions passed: ${results.length}/${results.length}`);
        else {
            for (const failure of failures) console.warn(`[${failure.suite || failure.type}] ${failure.input} -> ${failure.actual} (expected ${failure.expected})`);
            console.warn(`Regression assertions failed: ${failures.length}/${results.length + definitionProblems.length + (harnessPassed ? 0 : 1)}`);
        }
        return {
            rule: 'Rule 0: Obey Romaji Rules',
            selectedArea: definitions.selectedArea,
            availableAreas: definitions.availableAreas,
            harnessPassed,
            definitionProblems,
            invariantCount: getRegressionInvariants().length,
            summary,
            mechanismSummary,
            results,
            failures
        };
    }
    
    function runTranslatorReadingAudit(inputText) {
        const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics;
        runtimeState.captureTranslationDiagnostics = true;
        try {
            translateText(String(inputText || ''));
            return runtimeState.lastTranslationDiagnostics;
        } finally {
            runtimeState.captureTranslationDiagnostics = previousDiagnosticsState;
        }
    }
    
    registerRuntimeDiagnosticsTools({
        runRegressionChecks,
        runTranslatorGeneratedQA,
        runTranslatorDifferentialChecks,
        runTranslatorReadingAudit
    });
}());
//# sourceMappingURL=translator-qa.js.map
