(function () {
    'use strict';
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
        canonicalizeIdeographicDecimalNotationSurface,
        canonicalizeTokenizerBoundaryCharacters,
        canonicalizeReviewedPatternForTokenizerBoundary,
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
        getLoanwordReviewFlag,
        getGeneralWordCandidates,
        normalizeGeneralWordReadingEvidence,
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
        markTypedDayDurationSpanTokens,
        markTypedMinuteCounterRoleTokens,
        applyTypedNumericRoleReadings,
        mergeIdeographicDecimalNotationTokens,
        mergeCasualSpeechTokens,
        mergeDesiderativeGaruTokens,
        mergeAtejiTokens,
        mergeCommonWordTokens,
        mergeExactDictionaryRescueTokens,
        splitReviewedLoanwordToken,
        mergeGeneralWordTokens,
        mergeHistoricalKanaEvidenceTokens,
        mergeReviewedProperNameSpanTokens,
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
                    const sourceColonStyles = [];
                    for (let index = 0; index < source.length; index += 1) {
                        if (source[index] === ':' || source[index] === '：') {
                            sourceColonStyles.push({ ascii: source[index] === ':', tight: source[index] === ':' && !/\s/u.test(source[index + 1] || '') });
                        }
                    }
                    let colonOrdinal = 0;
                    let colonSpacingClean = true;
                    for (let index = 0; index < value.length; index += 1) {
                        if (value[index] !== ':') continue;
                        const style = sourceColonStyles[colonOrdinal++] || null;
                        if (/[A-Za-z]/u.test(value[index + 1] || '') && !style?.tight) {
                            colonSpacingClean = false;
                            break;
                        }
                    }
                    const spacingProbe = value.replace(/\bhttps?:\/\/[^\s"'<>]+/giu, match => 'U'.repeat(match.length));
                    const punctuationSpacingClean = !/ {2,}|　/u.test(spacingProbe)
                        && !/\s+[,.;:?!\)\]]/u.test(spacingProbe)
                        && !/[\(\[]\s+/u.test(spacingProbe)
                        && !/[,;?!](?=[A-Za-z])/u.test(spacingProbe)
                        && colonSpacingClean;
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

    function getRomajiCoreRegressionChecks() {
        return [
            { id: 'R0-KANA-SOKUON', suite: 'unit', rule: 'R0.4 small っ doubles the following consonant', input: 'きっぷ', expected: 'kippu', run: () => convertToRomaji('きっぷ') },
            { id: 'SCHEMA-RENDAKU-EVIDENCE-PROVENANCE', suite: 'unit', rule: 'Evidence-backed Rendaku rows require an explicit voiced/unvoiced decision and source provenance', input: '角刈り / rendaku evidence', expected: 'accepted', run: () => { try { validateAssetSchema('rendakuEvidence', [{ surface: '角刈り', reading: 'かくがり', rendaku: true, source: 'QA source' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-RENDAKU-EVIDENCE-SOURCE-MISSING-REJECT', suite: 'unit', rule: 'Source-less Rendaku rows cannot become authoritative evidence', input: '角刈り / source missing', expected: 'rejected', run: () => { try { validateAssetSchema('rendakuEvidence', [{ surface: '角刈り', reading: 'かくがり', rendaku: true }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-RENDAKU-EVIDENCE-DECISION-MISSING-REJECT', suite: 'unit', rule: 'Rendaku evidence must state whether voicing applies rather than relying on a truthy fallback', input: '角刈り / rendaku decision missing', expected: 'rejected', run: () => { try { validateAssetSchema('rendakuEvidence', [{ surface: '角刈り', reading: 'かくがり', source: 'QA source' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
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
            { id: 'R0-SOKUON-ISOLATED-REVIEW', suite: 'engine', rule: 'R0.4 cannot invent a doubled consonant for an isolated sokuon with no following Kana, so the empty mechanical result remains explicitly reviewable', input: 'っ', expected: '', expectedRequiresReview: true },
            { id: 'R0-KANA-FOREIGN-DU', suite: 'unit', rule: 'R0.5 foreign small-kana pairs stay inside one Romaji unit', input: 'ドゥ', expected: 'du', run: () => convertToRomaji('ドゥ') },
            { id: 'R0-KANA-BASE-INVENTORY', suite: 'unit', rule: 'The complete supported base Kana inventory is mechanically convertible without leaking Japanese Kana', input: 'base Kana inventory', expected: 'true', run: () => { const required = { 'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ゎ':'wa','ゕ':'ka','ゖ':'ke','ゐ':'i','ゑ':'e','ゟ':'yori' }; return String(Object.entries(required).every(([surface, expected]) => { const actual = convertToRomaji(surface); return actual === expected && !/[ぁ-ゖゟァ-ヺヿ]/u.test(actual); })); } },
            { id: 'R0-KANA-KATAKANA-MIRROR', suite: 'unit', rule: 'Every supported base Hiragana entry has an equivalent Katakana path through the shared mechanical converter', input: 'base Hiragana/Katakana parity', expected: 'true', run: () => { const required = { 'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko','さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to','な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho','ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo','ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n','が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo','だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po','ゔ':'vu','ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ゎ':'wa','ゕ':'ka','ゖ':'ke','ゐ':'i','ゑ':'e','ゟ':'yori' }; const toKatakana = value => Array.from(value).map(character => { const code = character.codePointAt(0); return code >= 0x3041 && code <= 0x309f ? String.fromCodePoint(code + 0x60) : character; }).join(''); return String(Object.entries(required).filter(([surface]) => surface !== 'ゟ').every(([surface, expected]) => convertToRomaji(toKatakana(surface)) === expected)); } },
            { id: 'R0-KANA-CONTRACTED-INVENTORY', suite: 'unit', rule: 'The complete supported contracted Kana inventory, including yoon and extended foreign-sound spellings, has deterministic Romaji with no Kana leakage', input: 'contracted Kana inventory', expected: 'true', run: () => { const required = { 'キャ':'kya', 'キュ':'kyu', 'キョ':'kyo', 'キェ':'kye', 'ギャ':'gya', 'ギュ':'gyu', 'ギョ':'gyo', 'ギェ':'gye', 'シャ':'sha', 'シュ':'shu', 'ショ':'sho', 'シェ':'she', 'ジャ':'ja', 'ジュ':'ju', 'ジョ':'jo', 'ジェ':'je', 'チャ':'cha', 'チュ':'chu', 'チョ':'cho', 'チェ':'che', 'ヂャ':'ja', 'ヂュ':'ju', 'ヂョ':'jo', 'ヂェ':'je', 'ニャ':'nya', 'ニュ':'nyu', 'ニョ':'nyo', 'ニェ':'nye', 'ヒャ':'hya', 'ヒュ':'hyu', 'ヒョ':'hyo', 'ヒェ':'hye', 'ビャ':'bya', 'ビュ':'byu', 'ビョ':'byo', 'ビェ':'bye', 'ピャ':'pya', 'ピュ':'pyu', 'ピョ':'pyo', 'ピェ':'pye', 'ミャ':'mya', 'ミュ':'myu', 'ミョ':'myo', 'ミェ':'mye', 'リャ':'rya', 'リュ':'ryu', 'リョ':'ryo', 'リェ':'rye', 'イィ':'yi', 'イェ':'ye', 'ウァ':'wa', 'ウィ':'wi', 'ウゥ':'wu', 'ウェ':'we', 'ウォ':'wo', 'ウャ':'wya', 'ウュ':'wyu', 'ウィェ':'wye', 'ウョ':'wyo', 'クァ':'kwa', 'クィ':'kwi', 'クェ':'kwe', 'クォ':'kwo', 'クヮ':'kwa', 'グァ':'gwa', 'グィ':'gwi', 'グェ':'gwe', 'グォ':'gwo', 'グヮ':'gwa', 'スィ':'si', 'ズィ':'zi', 'ツァ':'tsa', 'ツィ':'tsi', 'ツェ':'tse', 'ツォ':'tso', 'ツャ':'tsya', 'ツュ':'tsyu', 'ツィェ':'tsye', 'ツョ':'tsyo', 'ヅァ':'za', 'ヅィ':'zi', 'ヅェ':'ze', 'ヅォ':'zo', 'ヅャ':'zya', 'ヅュ':'zyu', 'ヅィェ':'zye', 'ヅョ':'zyo', 'ティ':'ti', 'テュ':'tyu', 'トゥ':'tu', 'トィ':'twi', 'ディ':'di', 'デュ':'dyu', 'ドゥ':'du', 'ドィ':'dwi', 'ヌィ':'nwi', 'ブィ':'bwi', 'プィ':'pwi', 'ムィ':'mwi', 'ユィ':'ywi', 'ユェ':'ye', 'ルィ':'rwi', 'ファ':'fa', 'フィ':'fi', 'フェ':'fe', 'フォ':'fo', 'フャ':'fya', 'フュ':'fyu', 'フィェ':'fye', 'フョ':'fyo', 'ホゥ':'hu', 'ヴァ':'va', 'ヴィ':'vi', 'ヴェ':'ve', 'ヴォ':'vo', 'ヴャ':'vya', 'ヴュ':'vyu', 'ヴィェ':'vye', 'ヴョ':'vyo' }; return String(Object.entries(required).every(([surface, expected]) => { const actual = convertToRomaji(surface); return actual === expected && !/[ぁ-ゖゟァ-ヺヿ]/u.test(actual); })); } },
            { id: 'R0-KANA-HISTORICAL-SPECIAL-INVENTORY', suite: 'unit', rule: 'Supported historical and special Kana code points have deterministic mechanical Romaji paths', input: 'ゐ ゑ ヰ ヱ ヷ ヸ ヹ ヺ ゟ ヿ ヵ ヶ', expected: 'i|e|i|e|va|vi|ve|vo|yori|koto|ka|ke', run: () => ['ゐ','ゑ','ヰ','ヱ','ヷ','ヸ','ヹ','ヺ','ゟ','ヿ','ヵ','ヶ'].map(convertToRomaji).join('|') },
            { id: 'R0-KANA-COMBINING-DAKUTEN', suite: 'unit', rule: 'Decomposed combining dakuten is NFC-normalised before tokenisation so valid voiced Kana remains deterministic', input: 'カ + combining dakuten', expected: 'ガ', run: () => normalizeTranslatorInputText('カ\u3099') },
            { id: 'R0-KANA-COMBINING-HANDAKUTEN', suite: 'unit', rule: 'Decomposed combining handakuten is NFC-normalised before tokenisation so valid semi-voiced Kana remains deterministic', input: 'ハ + combining handakuten', expected: 'パ', run: () => normalizeTranslatorInputText('ハ\u309A') },
            { id: 'R0-KANA-N-APOSTROPHE', suite: 'unit', rule: "R0.6 ん before a vowel or y uses an apostrophe", input: 'げんえい', expected: "gen'ei", run: () => convertToRomaji('げんえい') },
            { id: 'SYS-SOURCE-SPELLING-REVIEW', suite: 'unit', rule: 'Katakana orthography alone does not create source-spelling uncertainty without positive loanword evidence', input: 'パーティー', expected: 'clear', run: () => resolveTokenReading({ surface_form: 'パーティー', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: 'パーティー', pronunciation: 'パーティー' }, 'パーティー').flags.includes('missing-source-spelling-evidence') ? 'review' : 'clear' },
            { id: 'SYS-SOURCE-SPELLING-REVIEW-POSITIVE-EVIDENCE', suite: 'unit', rule: 'Reviewed loanword metadata can explicitly require source-spelling review without relying on Katakana shape', input: 'リード', expected: 'missing-source-spelling-evidence', run: () => resolveTokenReading({ surface_form: 'リード', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: 'リード', pronunciation: 'リード' }, 'リード').flags.includes('missing-source-spelling-evidence') ? 'missing-source-spelling-evidence' : 'missing' },
            { id: 'R0-KANA-OU', suite: 'unit', rule: 'R0.3 written おう remains ou', input: 'とうきょう', expected: 'toukyou', run: () => convertToRomaji('とうきょう') },
            { id: 'R0-KANA-OO', suite: 'unit', rule: 'R0.3 written おお remains oo', input: 'おおさか', expected: 'oosaka', run: () => convertToRomaji('おおさか') },
            { id: 'R0-PUNCT-WAVE-TILDE', suite: 'unit', rule: 'Rule 0 punctuation converts full-width ～ to ASCII ~', input: '～', expected: '~', run: () => normalizePunctuation('～') },
            { id: 'SYS-TOKENIZER-WAVE-CANONICALISATION', suite: 'unit', rule: 'All accepted wave delimiters canonicalise to the same tokenizer-safe boundary before linguistic processing', input: 'A〜B～C~D', expected: 'A~B~C~D', run: () => canonicalizeTokenizerBoundaryCharacters('A〜B～C~D') },
            { id: 'SYS-TOKENIZER-PRESENTATION-PUNCTUATION-CANONICALISATION', suite: 'unit', rule: 'Vertical presentation punctuation is canonicalised before tokenizer boundary analysis rather than leaking compatibility forms into linguistic processing', input: 'FE19 / FE30 presentation punctuation', expected: 'A…B…C', run: () => canonicalizeTokenizerBoundaryCharacters('A\uFE19B\uFE30C') },
            { id: 'SYS-POSTAL-MARK-FACE-CANONICALISATION', suite: 'unit', rule: 'The compatibility postal-mark face canonicalises to the established Japanese postal mark before tokenisation', input: '〠', expected: '〒', run: () => normalizeTranslatorInputText('〠') },
            { id: 'SYS-CIRCLED-POSTAL-SYMBOL-NONALIAS', suite: 'unit', rule: 'The distinct circled postal/electronics symbol is not silently folded into the postal-mark reading path', input: '〶', expected: '〶', run: () => normalizeTranslatorInputText('〶') },
            { id: 'MECH-BOUNDARY-ARBITRATION-COMPATIBILITY-PUNCTUATION-NFKC', suite: 'unit', rule: 'Non-ellipsis compatibility punctuation follows NFKC canonicalisation before structural boundary analysis', input: 'U+FE10 vertical comma', expected: ',', run: () => canonicalizeTokenizerBoundaryCharacters('\uFE10') },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-SOURCE-NORMALISATION', suite: 'unit', rule: 'Japanese compatibility source symbols use their explicit Unicode compatibility decomposition before tokenisation', input: '㈱㍿㌔㍻㋿㋐🈁🈀', expected: '(株)株式会社キロ平成令和アココほか', run: () => normalizeJapaneseCompatibilitySourceSymbols('㈱㍿㌔㍻㋿㋐🈁🈀') },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-PROLONGED-SOUND', suite: 'unit', rule: 'Japanese compatibility decompositions may retain the ordinary prolonged-sound mark inside the canonical Katakana source', input: '㌀㍍㌃㌶', expected: 'アパートメートルアールヘクタール', run: () => normalizeJapaneseCompatibilitySourceSymbols('㌀㍍㌃㌶') },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-LATIN-INVERSE', suite: 'unit', rule: 'The Japanese-specific compatibility path does not globally NFKC-normalise squared Latin measurement symbols', input: '㎡', expected: '㎡', run: () => normalizeJapaneseCompatibilitySourceSymbols('㎡') },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-DECOMPOSITION-GATE', suite: 'unit', rule: 'Only compatibility symbols whose canonical compatibility decomposition contains Japanese script are admitted to the Japanese source normaliser', input: '㍿ / ㎡', expected: '株式会社|null', run: () => `${getJapaneseCompatibilitySourceDecomposition('㍿')}|${String(getJapaneseCompatibilitySourceDecomposition('㎡'))}` },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-RANGE-INVARIANT', suite: 'unit', rule: 'Every eligible compatibility character in the scoped Unicode ranges normalises to its Japanese decomposition, every ineligible character remains untouched by this helper, and the final output guard blocks any eligible raw symbol that survives', input: 'U+3200–U+33FF / U+1F200–U+1F2FF', expected: 'true', run: () => { const codePoints = []; for (let codePoint = 0x3200; codePoint <= 0x33FF; codePoint += 1) codePoints.push(codePoint); for (let codePoint = 0x1F200; codePoint <= 0x1F2FF; codePoint += 1) codePoints.push(codePoint); let eligible = 0; for (const codePoint of codePoints) { const character = String.fromCodePoint(codePoint); const decomposition = getJapaneseCompatibilitySourceDecomposition(character); if (decomposition) { eligible += 1; if (normalizeJapaneseCompatibilitySourceSymbols(character) !== decomposition || !blockUnresolvedHanFromRomaji(character).includes('[Unresolved]')) return 'false'; } else if (normalizeJapaneseCompatibilitySourceSymbols(character) !== character) return 'false'; } return String(eligible > 0); } },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-OUTPUT-BACKSTOP', suite: 'unit', rule: 'A Japanese compatibility source symbol that somehow survives source normalisation cannot leak through the final Romaji output guard as trusted text', input: 'A㍿B', expected: 'A[Unresolved]B', run: () => blockUnresolvedHanFromRomaji('A㍿B') },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-CORPORATION', suite: 'engine', rule: 'The Unicode corporation compatibility symbol enters the same whole-word reading path as its canonical Japanese source text', input: '㍿', expected: 'Kabushikigaisha', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-KILO', suite: 'engine', rule: 'Squared Katakana source forms are expanded before ordinary lexical and loanword processing', input: '㌔', expected: 'Kilo', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-APARTMENT', suite: 'engine', rule: 'Squared Katakana compatibility forms containing a prolonged-sound mark preserve their canonical Japanese spelling before Rule 0 romanisation', input: '㌀', expected: 'Apaato', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-METRE', suite: 'engine', rule: 'Compatibility expansion feeds the existing reviewed source-language spelling path instead of bypassing it', input: '㍍', expected: 'Metre', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-HEISEI', suite: 'engine', rule: 'The Heisei era compatibility source form expands to its canonical Kanji source before reading resolution', input: '㍻', expected: 'Heisei', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-REIWA', suite: 'engine', rule: 'The Reiwa era compatibility source form expands to its canonical Kanji source before reading resolution', input: '㋿', expected: 'Reiwa', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-SYOUWA-AMBIGUITY', suite: 'engine', rule: 'Compatibility expansion does not erase an existing canonical-source ambiguity or its review requirement', input: '㍼', expected: 'Shouwa', expectedRequiresReview: true },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-PARENTHESISED-CORPORATION', suite: 'engine', rule: 'Parenthesised Japanese compatibility symbols preserve the canonical punctuation and the canonical lexical review state', input: '㈱', expected: '(Kabu)', expectedRequiresReview: true },
            { id: 'CHECK-POSTAL-MARK-FACE-EQUIVALENCE', suite: 'engine', rule: 'The postal-mark face follows the established postal-mark reading rather than leaking a compatibility glyph', input: '〠', expected: 'Yuubinbangou', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-KOKO', suite: 'engine', rule: 'Japanese broadcast compatibility symbols with Katakana decompositions enter the ordinary kana path', input: '🈁', expected: 'Koko', expectedRequiresReview: false },
            { id: 'CHECK-JAPANESE-COMPATIBILITY-HOKA', suite: 'engine', rule: 'Japanese broadcast compatibility symbols with Hiragana decompositions enter the ordinary kana path', input: '🈀', expected: 'Hoka', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-REPEATED-FULL-STOP-HARD', suite: 'unit', rule: 'Adjacent ASCII full stops remain hard structural boundaries rather than being mistaken for protected word-internal dots', input: '学校..学校 boundary tokens', expected: '..:true', run: () => { const source = '学校..学校'; const tokens = stabilizeHardBoundaryTokenization(attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source), source); const boundary = tokens.find(token => token.canonicalBoundary); return `${boundary?.surface_form || ''}:${String(Boolean(boundary?.canonicalBoundary))}`; } },
            { id: 'MECH-BOUNDARY-ARBITRATION-NUMERIC-COLON-PROTECTED', suite: 'engine', rule: 'A colon between decimal digits remains protected as internal numeric punctuation through the translation pipeline without added boundary spacing', input: '12:30', expected: '12:30', expectedRequiresReview: false },
            { id: 'R0-PUNCT-TYPOGRAPHIC-APOSTROPHE-CONTEXT', suite: 'unit', rule: 'A typographic apostrophe stays intact between Latin letters but is treated as a Japanese closing quote marker outside a Latin word', input: 'A’B テ’スト', expected: "A’B テ'スト", run: () => restoreJapaneseSingleQuotes(markJapaneseSingleQuotes('A’B テ’スト')) },
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
            { id: 'R0-N-APOSTROPHE-Y-WORD', suite: 'engine', rule: 'R0.6 ん before y takes an apostrophe inside an ordinary word', input: '翻訳家', expected: "Hon'yakuka", expectedRequiresReview: false },
            { id: 'R0-INTEGRATION-APOSTROPHE-STRESS', suite: 'engine', rule: 'Rule 0 integration check for several independent n-apostrophe boundaries', input: '新鋭の翻訳家は原因を知らず、三人で深夜の学校へ向かった。', expected: "Shin'ei no Hon'yakuka wa Gen'in o Shirazu, Sannin de Shin'ya no Gakkou e Mukatta.", expectedRequiresReview: false },
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
            { id: 'SYS-KATAKANA-VU-ENGINE', suite: 'engine', rule: 'Modern Katakana ヴ remains mechanically romanisable without manufacturing source-spelling uncertainty from script alone', input: 'ヴ', expected: 'Vu', expectedRequiresReview: false },
            { id: 'MECH-KANA-KENTURIA', suite: 'engine', rule: 'Extended Kana トゥ remains mechanically romanisable in a complete Katakana word without script-only source-spelling review', input: 'ケントゥリア', expected: 'Kenturia', expectedRequiresReview: false },
            { id: 'SYS-N-KANA-LEXICAL-KYAKKAN', suite: 'engine', rule: 'Evidence-backed kana recovery preserves a final syllabic ん after sokuon/yoon', input: 'きゃっかん', expected: 'Kyakkan' },
            { id: 'SYS-N-GUARD-CONSONANT', suite: 'engine', rule: 'The systemic ん fix does not introduce an apostrophe before consonants', input: 'しんぶん', expected: 'Shinbun' },
            { id: 'R0-TSU-VS-SOKUON-ENGINE', suite: 'engine', rule: 'Modern full-size つ remains tsu while small っ doubles the following consonant', input: 'まつ まって', expected: 'Matsu Matte' },
            { id: 'R0-SOKUON-EMPHATIC-MEDIAL', suite: 'engine', rule: 'Colloquial emphatic medial sokuon remains a normal doubled consonant when the written following consonant is clear', input: 'すっごい', expected: 'Suggoi' },
            { id: 'R0-SOKUON-INITIAL-COLLOQUIAL', suite: 'engine', rule: 'A colloquial form beginning with っ still doubles a valid following consonant', input: 'っす', expected: 'ssu' },
            { id: 'R0-SOKUON-HALFWIDTH', suite: 'engine', rule: 'Half-width ｯ is normalised before ordinary sokuon processing and needs no review when the following consonant is supported', input: 'ｯｶ', expected: 'Kka', expectedRequiresReview: false },
            { id: 'STRESS-LATIN-SLASH', suite: 'engine', rule: 'Existing Latin title spelling with a slash passes through unchanged', input: 'Fate/stay night', expected: 'Fate/stay night' },
            { id: 'STRESS-LATIN-URL-PUNCTUATION', suite: 'engine', rule: 'Existing Latin URLs preserve source-internal query punctuation instead of receiving sentence-style comma spacing', input: 'https://example.test/a?x=1,y=2!', expected: 'https://example.test/a?x=1,y=2!', expectedRequiresReview: false },
            { id: 'STRESS-LATIN-URL-SURROUNDING-SPACES', suite: 'engine', rule: 'Latin passthrough reconstructs exact source whitespace around a URL even when earlier token repairs represent that whitespace as a source gap', input: 'See https://example.test/a?x=1,y=2! Next', expected: 'See https://example.test/a?x=1,y=2! Next', expectedRequiresReview: false },
            { id: 'STRESS-LATIN-COMMA-SPACED-CONTROL', suite: 'engine', rule: 'Latin passthrough keeps an intentional source space after a comma while preserving the same punctuation transport mechanism', input: 'Alpha, Beta', expected: 'Alpha, Beta', expectedRequiresReview: false },
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
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-KANA-INTERNAL', suite: 'engine', rule: 'A Japanese redaction circle embedded inside a kana word remains literal, does not create an artificial word boundary and requires review because the hidden source reading is unknowable', input: 'ち◯こ', expected: 'Chi◯ko', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-KATAKANA-INTERNAL', suite: 'engine', rule: 'A common Japanese redaction circle inside Katakana preserves the written visible kana and long-vowel behaviour without guessing the censored character', input: 'ク○ゲー', expected: 'Ku○gee', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-RUN-NAME', suite: 'engine', rule: 'A repeated black-circle redaction run is retained as an opaque name placeholder while the following ordinary Japanese title word remains independently romanised', input: '●●先生', expected: '●● Sensei', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-HAN-BOUNDARY', suite: 'engine', rule: 'A redaction mark between Han spans blocks unsafe whole-word or Rendaku inference across the hidden source material and preserves the visible mark literally', input: '第◯話', expected: 'Dai◯ Hanashi', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-HAN-ORDINARY-LEXICAL-GUARD', suite: 'engine', rule: 'A visible Han token isolated after a Japanese redaction mark must not become a confident proper-name reading when one unique maintained ordinary lexical reading conflicts with that isolated analyser role', input: '第◯章', expected: 'Dai◯ Shou', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-HAN-MULTIREADING-GUARD', suite: 'engine', rule: 'Post-redaction ordinary lexical guarding does not invent certainty when the visible Han token itself has multiple maintained ordinary readings', input: '第◯巻', expected: 'Dai◯ Maki', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-PARTICLE-GUARD', suite: 'engine', rule: 'An opaque Japanese redaction mark must not absorb or attach a following grammatical particle when the visible particle remains independently analysable', input: '○を描く', expected: '○ o Egaku', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-CROSS-RUN', suite: 'engine', rule: 'A repeated Japanese × redaction run is distinguished from ordinary single cross notation and preserved as hidden source text rather than pronounced compositionally', input: '××先生', expected: '×× Sensei', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-PUNCTUATION-BOUNDARY', suite: 'engine', rule: 'A preserved Japanese redaction marker after sentence punctuation inherits the established external punctuation boundary instead of suppressing its following space', input: '××先生、××先生', expected: '×× Sensei, ×× Sensei', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-JAPANESE-CENSOR-NUMERIC-ZERO-GUARD', suite: 'unit', rule: 'A single ideographic zero in numeric Japanese context remains numeric material and is never globally reclassified as a censorship marker', input: '〇円', expected: 'false', run: () => String(Boolean(stabilizeHardBoundaryTokenization(runtimeState.tokenizer.tokenize('〇円'), '〇円').find(token => token.censorshipMarker))) },
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

    function runAuthoritativeSpanGateFixture({ surface, lookupSurface = surface, category, tokens, nameVariant = false, mergeSafe = false, startIndex = 0 }) {
        const originalDictionary = runtimeState.authoritativeSpanDictionary;
        const originalPrefixes = runtimeState.authoritativeSpanPrefixes;
        const originalGeneralVariants = runtimeState.generalKanjiVariantDictionary;
        const originalNameVariants = runtimeState.nameKanjiVariantDictionary;
        try {
            runtimeState.authoritativeSpanDictionary = new Map([[lookupSurface, {
                reading: 'あ', source: category === 'general-word' ? 'complete-single-reading-general-word-evidence' : 'qa-authoritative-gate', confidence: 1, priority: 100, category, nameVariants: nameVariant, mergeSafe
            }]]);
            runtimeState.authoritativeSpanPrefixes = new Set();
            addSurfacePrefixes(runtimeState.authoritativeSpanPrefixes, lookupSurface);
            runtimeState.generalKanjiVariantDictionary = new Map();
            runtimeState.nameKanjiVariantDictionary = nameVariant ? new Map([[surface, lookupSurface]]) : new Map();
            return findLongestAuthoritativeSpan(tokens, startIndex);
        } finally {
            runtimeState.authoritativeSpanDictionary = originalDictionary;
            runtimeState.authoritativeSpanPrefixes = originalPrefixes;
            runtimeState.generalKanjiVariantDictionary = originalGeneralVariants;
            runtimeState.nameKanjiVariantDictionary = originalNameVariants;
        }
    }
    
    function getTokenisationAndMergingRegressionChecks() {
        return [
            { id: 'MECH-TOKENISATION-SOURCE-SPAN-OFFSETS', suite: 'unit', rule: 'Every token remains traceable to its original continuous Japanese source offsets', input: 'ぼん / の / うじ', expected: '0-2|2-3|3-5', run: () => attachSourceTokenSpans([{ surface_form: 'ぼん' }, { surface_form: 'の' }, { surface_form: 'うじ' }], 'ぼんのうじ').map(token => `${token.sourceStart}-${token.sourceEnd}`).join('|') },
            { id: 'MECH-CANDIDATE-DISCOVERY-NONDESTRUCTIVE', suite: 'unit', rule: 'Source-span candidate creation does not mutate or merge the token proposal stream', input: '八 / 分 / 音符', expected: 'true', run: () => { const tokens = attachSourceTokenSpans([{ surface_form: '八', pos: '名詞', pos_detail_1: '数', reading: 'ハチ' }, { surface_form: '分', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', reading: 'フン' }, { surface_form: '音符', pos: '名詞', pos_detail_1: '一般', reading: 'オンプ' }], '八分音符'); const before = JSON.stringify(tokens); discoverSourceSpanCandidates('八分音符', tokens, {}); return String(JSON.stringify(tokens) === before); } },
            { id: 'MECH-FINAL-OUTPUT-SUFFIX-PARTICLE-HOST', suite: 'engine', rule: 'A lexical word mislabelled by Kuromoji as a suffix after a particle is emitted as a separate capitalised lexical unit', input: '「ドラゴンボール」が好き', expected: '"Dragon Ball" ga Suki', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-MULTIPLE-INTERNAL-AUTHORITY-CUTS', suite: 'unit', rule: 'Multiple adjacent immutable evidence spans inside one oversized analyser token are split in source order rather than allowing one internal boundary to mask another', input: '甲乙丙 as one token with three adjacent reviewed spans', expected: '甲|乙|丙:true:true', run: () => { const source = '甲乙丙'; const token = { surface_form: source, sourceStart: 0, sourceEnd: source.length, sourceSurface: source, reading: '*', pronunciation: '*', pos: '名詞', pos_detail_1: '一般' }; const candidate = (sourceStart, sourceEnd, reading) => ({ sourceStart, sourceEnd, sourceSurface: source.slice(sourceStart, sourceEnd), category: 'lexical', kind: 'reviewed-reading', semanticRole: 'lexical', evidenceSource: 'qa-reviewed', reading, confidence: 1, reviewRequired: false, metadata: { priority: 100 } }); const split = splitTokensAtImmutableSourceAuthorityBoundaries([token], source, [candidate(0, 1, 'こう'), candidate(1, 2, 'おつ'), candidate(2, 3, 'へい')]); return `${split.map(item => item.surface_form).join('|')}:${String(Boolean(split[1]?.reviewedLexicalBoundaryBefore))}:${String(Boolean(split[2]?.reviewedLexicalBoundaryBefore))}`; } },
            { id: 'MECH-CANDIDATE-DISCOVERY-OVERLAP-PRESERVED', suite: 'unit', rule: 'Competing lexical and counter interpretations may coexist over overlapping immutable source positions before arbitration', input: '八分音符', expected: 'lexical:0-4|counter:0-2', run: () => { const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize('八分音符'), '八分音符'); const candidates = discoverSourceSpanCandidates('八分音符', tokens, {}); const lexical = candidates.find(item => item.kind === 'general-word' && item.sourceStart === 0 && item.sourceEnd === 4); const counter = candidates.find(item => item.kind === 'counter-date' && item.sourceStart === 0 && item.sourceEnd === 2); return `${lexical?.category || ''}:${lexical?.sourceStart}-${lexical?.sourceEnd}|${counter?.category || ''}:${counter?.sourceStart}-${counter?.sourceEnd}`; } },
            { id: 'MECH-CANDIDATE-DISCOVERY-NO-SELECTION', suite: 'unit', rule: 'Candidate discovery records possibilities only and cannot mark a candidate as selected or winning', input: '一時金 candidates', expected: 'true', run: () => { const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize('一時金'), '一時金'); const candidates = discoverSourceSpanCandidates('一時金', tokens, {}); return String(candidates.length > 1 && candidates.every(item => item.selectionState === 'unselected' && !Object.prototype.hasOwnProperty.call(item, 'selected') && !Object.prototype.hasOwnProperty.call(item, 'winner'))); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-AMBIGUOUS-COMPOUND', suite: 'unit', rule: 'Maintained compound evidence remains visible as an unresolved lexical candidate when the bank contains multiple supported readings', input: '男 candidate evidence', expected: 'true:2', run: () => { const source = '男'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidate = discoverSourceSpanCandidates(source, tokens, {}).find(item => item.kind === 'compound-word' && item.sourceStart === 0 && item.sourceEnd === source.length); return `${String(Boolean(candidate?.reviewRequired))}:${candidate?.alternatives?.length || 0}`; } },
            { id: 'MECH-CANDIDATE-DISCOVERY-REVIEWED-READING-ALTERNATIVES', suite: 'unit', rule: 'Reviewed whole-span reading evidence exposes every maintained alternative through source-span candidate discovery instead of keeping alternatives only in the loader dictionary', input: '各月 candidate evidence', expected: 'かくげつ|かくつき:true', run: () => { const source = '各月'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidate = discoverSourceSpanCandidates(source, tokens, {}).find(item => item.kind === 'reviewed-reading' && item.sourceStart === 0 && item.sourceEnd === source.length); const readings = [candidate?.reading, ...(candidate?.alternatives || []).map(item => item?.reading)].filter(Boolean).sort((left, right) => left.localeCompare(right, 'ja')); return `${readings.join('|')}:${String(Boolean(candidate?.reviewRequired))}`; } },
            { id: 'MECH-CANDIDATE-DISCOVERY-COVERAGE-CONTRACT', suite: 'unit', rule: 'General-word candidate diagnostics report source reading coverage from the lexical entry rather than treating a missing wrapper property as proof of completeness', input: '検証語 incomplete lexical evidence', expected: 'false:true:false', run: () => { const surface = '検証語'; const previousEntry = runtimeState.generalWordDictionary.get(surface); const previousPrefixes = runtimeState.generalWordPrefixes; try { runtimeState.generalWordDictionary.set(surface, { readings: [{ reading: 'けんしょうご', popularityScore: 10 }], unretainedReadings: [], mergeSafe: false, readingCoverage: 'filtered-positive-priority', restrictionStatus: 'unknown', sourceReadingCount: 2, scoreSemantics: 'popularity-ranking-only' }); runtimeState.generalWordPrefixes = new Set(previousPrefixes); addSurfacePrefixes(runtimeState.generalWordPrefixes, surface); const tokens = attachSourceTokenSpans([{ surface_form: surface, pos: '名詞', pos_detail_1: '一般', reading: 'ケンショウゴ', pronunciation: 'ケンショウゴ' }], surface); const candidate = discoverSourceSpanCandidates(surface, tokens, {}).find(item => item.kind === 'general-word' && item.sourceStart === 0 && item.sourceEnd === surface.length); return `${String(Boolean(candidate?.metadata?.completeCoverage))}:${String(Boolean(candidate?.reviewRequired))}:${String(Boolean(candidate?.metadata?.mergeSafe))}`; } finally { if (previousEntry) runtimeState.generalWordDictionary.set(surface, previousEntry); else runtimeState.generalWordDictionary.delete(surface); runtimeState.generalWordPrefixes = previousPrefixes; } } },
            { id: 'MECH-CANDIDATE-DISCOVERY-TOKENISATION-INDEPENDENT', suite: 'unit', rule: 'Non-tokenizer candidate discovery depends on immutable source positions rather than one exact Kuromoji boundary proposal', input: '八分音符 under two tokenisations', expected: 'true', run: () => { const a = attachSourceTokenSpans([{ surface_form: '八' }, { surface_form: '分' }, { surface_form: '音符' }], '八分音符'); const b = attachSourceTokenSpans([{ surface_form: '八分' }, { surface_form: '音' }, { surface_form: '符' }], '八分音符'); const signature = list => discoverSourceSpanCandidates('八分音符', list, {}).filter(item => item.category !== 'tokenizer' && item.evidenceSource !== 'kuromoji-morphology').map(item => `${item.sourceStart}-${item.sourceEnd}:${item.category}:${item.kind}:${item.evidenceSource}`).sort().join('|'); return String(signature(a) === signature(b)); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-GRAMMAR-COMPETES', suite: 'unit', rule: 'Morphological grammar evidence is emitted as a candidate rather than being allowed to manufacture the source segmentation by itself', input: '僕の本', expected: 'true', run: () => { const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize('僕の本'), '僕の本'); const candidates = discoverSourceSpanCandidates('僕の本', tokens, {}); return String(candidates.some(item => item.category === 'grammar' && item.kind === 'kuromoji-particle' && item.sourceSurface === 'の')); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-KATAKANA-NO-GRAMMAR', suite: 'unit', rule: 'A standalone Katakana ノ between lexical spans remains an explicit grammatical-role candidate when Kuromoji labels the glyph as a symbol', input: '東京ノ空', expected: 'grammar:orthographic-katakana-no:source-orthography+syntactic-frame:true', run: () => { const source = '東京ノ空'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidate = discoverSourceSpanCandidates(source, tokens, {}).find(item => item.kind === 'orthographic-katakana-no'); return `${candidate?.category || ''}:${candidate?.kind || ''}:${candidate?.evidenceSource || ''}:${String(Boolean(candidate?.reviewRequired))}`; } },
            { id: 'MECH-CANDIDATE-DISCOVERY-CONTEXT-RANGE-BOUND', suite: 'unit', rule: 'A reviewed context-pattern candidate is emitted only for the source occurrence actually covered by its matching pattern, not every identical surface elsewhere in the sentence', input: '十分に休む。十分待つ', expected: '1:0', run: () => { const source = '十分に休む。十分待つ'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidates = discoverSourceSpanCandidates(source, tokens, {}).filter(item => item.kind === 'common-word' && item.sourceSurface === '十分'); const first = candidates.filter(item => item.sourceStart === 0).length; const secondStart = source.lastIndexOf('十分'); const second = candidates.filter(item => item.sourceStart === secondStart).length; return `${first}:${second}`; } },
            { id: 'MECH-CANDIDATE-DISCOVERY-TITLE-RAW-PREFIX-GUARD', suite: 'unit', rule: 'A complete-title rule written as an unanchored exact surface cannot activate merely because the following lexical word begins with particle-like kana', input: 'ドロヘドロはちみつ', expected: 'false', run: () => { const source = 'ドロヘドロはちみつ'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.category === 'title' && item.sourceStart === 0 && item.sourceEnd === 'ドロヘドロ'.length)); } },
            { id: 'TITLE-COMPLETE-SURFACE-CANONICAL-PUNCTUATION-BOUNDARY', suite: 'engine', rule: 'Complete title evidence recognises canonicalised fullwidth punctuation as a source boundary', input: '東京喰種．', expected: 'Tokyo Ghoul.' },
            { id: 'MECH-CANDIDATE-DISCOVERY-TITLE-GRAMMATICAL-MENTION', suite: 'unit', rule: 'A complete reviewed title remains a title-reading candidate when a real source-aligned grammatical particle follows it', input: 'ドロヘドロは話題だ', expected: 'true', run: () => { const source = 'ドロヘドロは話題だ'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.category === 'title' && item.sourceStart === 0 && item.sourceEnd === 'ドロヘドロ'.length)); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-TITLE-AUTHORED-CONTEXT-RETAINED', suite: 'unit', rule: 'Tightening complete-title boundaries does not disable a fragment rule inside its explicitly authored full-title context', input: '魔女の旅々', expected: 'true', run: () => { const source = '魔女の旅々'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const start = source.indexOf('旅々'); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.category === 'title' && item.sourceStart === start && item.sourceEnd === start + '旅々'.length)); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-VALIDATION-ALLOWS-OVERLAP', suite: 'unit', rule: 'Candidate validation permits documented temporary overlap while still enforcing source-position/provenance integrity', input: '八分音符 candidates', expected: 'true', run: () => { const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize('八分音符'), '八分音符'); return String(validateSourceSpanCandidates(discoverSourceSpanCandidates('八分音符', tokens, {}), '八分音符').valid); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-VALIDATION-REJECTS-CORRUPTION', suite: 'unit', rule: 'Candidate validation reports each source-range, provenance and discovery-selection invariant violation instead of silently accepting corrupted candidate state', input: 'candidate invariant corruption', expected: 'missing-source-range|invalid-source-range|invalid-sourceSurface|missing-candidate-provenance|candidate-selection-leaked-into-discovery|candidate-selection-field-present', run: () => { const source = '日本'; const validBase = { id: 'probe', sourceStart: 0, sourceEnd: 1, sourceSurface: '日', category: 'lexical', kind: 'probe', evidenceSource: 'qa-probe', selectionState: 'unselected' }; const candidates = [null, { ...validBase, sourceEnd: 99 }, { ...validBase, sourceSurface: '本' }, { id: 'missing-provenance', sourceStart: 0, sourceEnd: 1, sourceSurface: '日', selectionState: 'unselected' }, { ...validBase, selectionState: 'selected' }, { ...validBase, selected: true }]; return validateSourceSpanCandidates(candidates, source).violations.map(item => item.reason).join('|'); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-KANA-ORTHOGRAPHIC-ALIAS', suite: 'unit', rule: 'A maintained whole-word reading can propose a complete Kana lexical span when an independently confirmed orthographic reading alias matches the source', input: 'ぎょうざ', expected: '0-4:true:餃子', run: () => { const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize('ぎょうざ'), 'ぎょうざ'); const candidate = discoverSourceSpanCandidates('ぎょうざ', tokens, {}).find(item => item.kind === 'kana-lexical-reading' && item.sourceStart === 0 && item.sourceEnd === 4 && item.metadata?.strong); return `${candidate?.sourceStart}-${candidate?.sourceEnd}:${Boolean(candidate?.metadata?.strong)}:${(candidate?.metadata?.evidenceSurfaces || []).join(',')}`; } },
            { id: 'MECH-BOUNDARY-ARBITRATION-KANA-LONG-VOWEL-LEXICAL', suite: 'engine', rule: 'A tokenizer split cannot create a false word boundary inside an established Kana spelling when maintained lexical evidence confirms the whole word modulo Japanese long-vowel notation', input: 'ぎょうざ', expected: 'Gyouza', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-KANA-ALIAS-GRAMMAR-GUARD', suite: 'engine', rule: 'Kana lexical-reading evidence must not erase an independently grammatical particle merely because shorter lexical readings occur inside the phrase', input: 'きょうは', expected: 'Kyou wa', expectedRequiresReview: false },
            { id: 'MECH-CANDIDATE-DISCOVERY-KANA-ALIAS-NO-FALSE-WHOLE-SPAN', suite: 'unit', rule: 'Kana reading evidence may expose shorter lexical candidates without inventing a strong whole-span lexical candidate for a grammatical phrase', input: 'きょうは', expected: 'true', run: () => { const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize('きょうは'), 'きょうは'); const candidates = discoverSourceSpanCandidates('きょうは', tokens, {}); return String(!candidates.some(item => item.kind === 'kana-lexical-reading' && item.sourceStart === 0 && item.sourceEnd === 4 && item.metadata?.strong)); } },
            { id: 'MECH-BOUNDARY-ARBITRATION-MIXED-ORTHOGRAPHY', suite: 'engine', rule: 'Strong exact lexical boundary evidence may override an internal analyser split that mistakes written Kana for separate grammar', input: '虫よけ', expected: 'Mushiyoke', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-OKURIGANA-WHOLE-SPAN', suite: 'engine', rule: 'A complete lexical span absorbs its attested okurigana exactly once instead of duplicating the suffix after token merging', input: '聞書き', expected: 'Kikigaki', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-LEXICALISED-NUMERAL', suite: 'engine', rule: 'Exact merge-safe lexical evidence may win over raw numeral morphology when no selected counter or temporal role owns the span', input: '一晩', expected: 'Hitoban', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-GRAMMAR-NEGATIVE-CONTROL', suite: 'engine', rule: 'Independent grammatical structure remains separated when there is no stronger exact whole-span lexical boundary evidence', input: '僕の本', expected: 'Boku no Hon', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-COUNTER-NEGATIVE-CONTROL', suite: 'engine', rule: 'Productive numeral-counter structure remains structural rather than being reclassified as a general lexical word', input: '四本選ぶ', expected: 'Yonhon Erabu', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-CURRENCY-NEGATIVE-CONTROL', suite: 'engine', rule: 'Structured numeric currency units preserve their numeric output boundary even when a lexical entry shares the same orthography', input: '千円', expected: 'Sen En', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-SELECTED-ROLE-PRESERVED', suite: 'engine', rule: 'A positively selected clock and minute role remains authoritative and cannot be erased by competing lexical boundary evidence', input: '九時五分', expected: 'Kuji Gofun', expectedRequiresReview: false },
            { id: 'MECH-SEMANTIC-OWNERSHIP-CHANGED-SPAN-INVALIDATES', suite: 'unit', rule: 'A changed source span cannot inherit span-bound semantic annotations from its first member', input: '一時 + 金', expected: 'false:0:3:一時金:lexical-span', run: () => { const source = '一時金'; const tokens = attachSourceTokenSpans([{ surface_form: '一時', typedNumericExpressionMatched: true, typedNumericExpressionType: 'clock-hour', typedNumericReading: 'いちじ' }, { surface_form: '金' }], source); const merged = makeDerivedSpanToken(tokens, 0, 1, { surface_form: source, generalWordMatched: true, generalWordReading: 'いちじきん' }, { annotations: ['generalWordMatched', 'generalWordReading'], evidenceSource: 'qa-general-word', semanticRole: 'lexical-span' }); const owner = merged.semanticAnnotationOwnership?.[0] || {}; return `${Boolean(merged.typedNumericExpressionMatched)}:${owner.sourceStart}:${owner.sourceEnd}:${owner.sourceSurface || ''}:${owner.semanticRole || ''}`; } },
            { id: 'MECH-SEMANTIC-OWNERSHIP-SAME-SPAN-PRESERVES', suite: 'unit', rule: 'An explicitly reinterpreted token may preserve span-bound semantics when the derived token covers the identical source span', input: '一日', expected: 'true:true', run: () => { const tokens = attachSourceTokenSpans([{ surface_form: '一日', typedTemporalExpressionMatched: true, typedTemporalExpressionType: 'duration', typedTemporalReading: 'いちにち' }], '一日'); const derived = makeDerivedSpanToken(tokens, 0, 0, { surface_form: '一日', authoritativeSpanMatched: true }, { annotations: ['authoritativeSpanMatched'], evidenceSource: 'qa-authoritative', semanticRole: 'same-span-revalidation' }); return `${Boolean(derived.typedTemporalExpressionMatched)}:${Boolean(derived.authoritativeSpanMatched)}`; } },
            { id: 'MECH-SOURCE-INTEGRITY-DELETION', suite: 'unit', rule: 'Source integrity detects uncovered Japanese source text instead of allowing a derived token stream to silently delete it', input: '日本語 with 本 omitted', expected: 'source-deletion', run: () => validateSourceTokenIntegrity([{ surface_form: '日', sourceStart: 0, sourceEnd: 1, sourceSurface: '日' }, { surface_form: '語', sourceStart: 2, sourceEnd: 3, sourceSurface: '語' }], '日本語', { requireFullCoverage: true }).violations.map(item => item.reason).find(reason => reason === 'source-deletion') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-DUPLICATION', suite: 'unit', rule: 'Source integrity detects two derived tokens claiming the same original source range', input: '日 claimed twice', expected: 'duplicated-source-range', run: () => validateSourceTokenIntegrity([{ surface_form: '日', sourceStart: 0, sourceEnd: 1, sourceSurface: '日' }, { surface_form: '日', sourceStart: 0, sourceEnd: 1, sourceSurface: '日' }], '日').violations.map(item => item.reason).find(reason => reason === 'duplicated-source-range') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-OVERLAP', suite: 'unit', rule: 'Source integrity rejects overlapping derived source ranges', input: '日本 / 本語', expected: 'overlapping-source-range', run: () => validateSourceTokenIntegrity([{ surface_form: '日本', sourceStart: 0, sourceEnd: 2, sourceSurface: '日本' }, { surface_form: '本語', sourceStart: 1, sourceEnd: 3, sourceSurface: '本語' }], '日本語').violations.map(item => item.reason).find(reason => reason === 'overlapping-source-range') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-OUT-OF-ORDER', suite: 'unit', rule: 'Source integrity rejects derived tokens whose source ranges are emitted out of order', input: '本 then 日', expected: 'out-of-order-source-range', run: () => validateSourceTokenIntegrity([{ surface_form: '本', sourceStart: 1, sourceEnd: 2, sourceSurface: '本' }, { surface_form: '日', sourceStart: 0, sourceEnd: 1, sourceSurface: '日' }], '日本').violations.map(item => item.reason).find(reason => reason === 'out-of-order-source-range') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-SURFACE', suite: 'unit', rule: 'Source integrity rejects sourceSurface text that does not equal the claimed source range', input: '日 range labelled 本', expected: 'invalid-sourceSurface', run: () => validateSourceTokenIntegrity([{ surface_form: '日', sourceStart: 0, sourceEnd: 1, sourceSurface: '本' }], '日').violations.map(item => item.reason).find(reason => reason === 'invalid-sourceSurface') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-MISSING-RANGE', suite: 'unit', rule: 'Source integrity rejects a token that has no integer source range', input: '日 without source range', expected: 'missing-source-range', run: () => validateSourceTokenIntegrity([{ surface_form: '日', sourceSurface: '日' }], '日').violations.map(item => item.reason).find(reason => reason === 'missing-source-range') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-INVALID-RANGE', suite: 'unit', rule: 'Source integrity rejects a token whose source range extends beyond the immutable source text', input: '日 with sourceEnd 2 in one-character source', expected: 'invalid-source-range', run: () => validateSourceTokenIntegrity([{ surface_form: '日', sourceStart: 0, sourceEnd: 2, sourceSurface: '日' }], '日').violations.map(item => item.reason).find(reason => reason === 'invalid-source-range') || '' },
            { id: 'MECH-SOURCE-INTEGRITY-ANNOTATION-MISSING', suite: 'unit', rule: 'Semantic ownership cannot name an annotation that is absent from the token carrying the ownership record', input: '日本 owner names absent generalWordMatched', expected: 'annotation-owner-without-annotation', run: () => validateSourceTokenIntegrity([{ surface_form: '日本', sourceStart: 0, sourceEnd: 2, sourceSurface: '日本', semanticAnnotationOwnership: [{ annotations: ['generalWordMatched'], sourceStart: 0, sourceEnd: 2, sourceSurface: '日本', evidenceSource: 'qa', semanticRole: 'lexical', confidence: 1, reviewRequired: false }] }], '日本').violations.map(item => item.reason).find(reason => reason === 'annotation-owner-without-annotation') || '' },
            { id: 'MECH-WHOLE-WORD-TITLE-OPTIONAL-ABSENCE-NOOP', suite: 'unit', rule: 'An unavailable optional title-reading bank remains a supported pipeline no-op and cannot manufacture title-reading authority', input: '化物語 with empty optional title-reading dictionary', expected: 'false', run: () => { const previousDictionary = runtimeState.titleReadingDictionary; const previousCapture = runtimeState.captureTranslationDiagnostics; try { runtimeState.titleReadingDictionary = new Map(); runtimeState.captureTranslationDiagnostics = true; translateText('化物語'); return String((runtimeState.lastTranslationDiagnostics?.readings || []).some(item => item.source === 'title-reading-evidence')); } finally { runtimeState.titleReadingDictionary = previousDictionary; runtimeState.captureTranslationDiagnostics = previousCapture; } } },
            { id: 'MECH-SOURCE-INTEGRITY-TRAILING-DELETION', suite: 'unit', rule: 'Full-coverage source integrity detects uncovered non-whitespace text after the final emitted token', input: '日本語 with trailing 語 omitted', expected: 'source-deletion', run: () => validateSourceTokenIntegrity([{ surface_form: '日本', sourceStart: 0, sourceEnd: 2, sourceSurface: '日本' }], '日本語', { requireFullCoverage: true }).violations.map(item => item.reason).find(reason => reason === 'source-deletion') || '' },
            { id: 'MECH-SEMANTIC-OWNERSHIP-STALE-OWNER', suite: 'unit', rule: 'A semantic annotation owner cannot claim a different source span from the token carrying that annotation', input: '日本 with stale owner 日', expected: 'stale-semantic-annotation-ownership', run: () => validateSourceTokenIntegrity([{ surface_form: '日本', sourceStart: 0, sourceEnd: 2, sourceSurface: '日本', generalWordMatched: true, semanticAnnotationOwnership: [{ annotations: ['generalWordMatched'], sourceStart: 0, sourceEnd: 1, sourceSurface: '日', evidenceSource: 'qa', semanticRole: 'lexical', confidence: 1, reviewRequired: false }] }], '日本').violations.map(item => item.reason).find(reason => reason === 'stale-semantic-annotation-ownership') || '' },
            { id: 'MECH-SEMANTIC-OWNERSHIP-ICHIIJIKIN', suite: 'engine', rule: 'A larger lexical span cannot inherit a smaller clock-hour interpretation and suppress the final 金 reading', input: '一時金', expected: 'Ichijikin', expectedRequiresReview: false },
            { id: 'MECH-SEMANTIC-OWNERSHIP-HACHIBUONPU', suite: 'engine', rule: 'A larger lexical span cannot inherit a smaller minute-counter interpretation and suppress 音符', input: '八分音符', expected: 'Hachibuonpu', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-SOURCE-SPAN-CROSS-TOKEN-LEXICAL', suite: 'unit', rule: 'Source-span reconciliation may neutralise a false particle boundary across any number of Kuromoji tokens before reading resolution', input: 'ぼん / の / うじ', expected: 'ぼんのうじ', run: () => { const tokens = attachSourceTokenSpans([{ surface_form: 'ぼん', pos: '名詞', pos_detail_1: '一般', reading: 'ボン' }, { surface_form: 'の', pos: '助詞', pos_detail_1: '連体化', reading: 'ノ' }, { surface_form: 'うじ', pos: '名詞', pos_detail_1: '一般', reading: 'ウジ' }], 'ぼんのうじ'); return reconcileKanaSourceTokenBoundaries(tokens, 'ぼんのうじ').map(token => token.surface_form).join('|'); } },
            { id: 'MECH-GRAMMAR-SURFACE-PARTICLE-GUARD', suite: 'unit', rule: 'A kana surface matching a particle is not grammatical merely because that spelling exists in the particle table', input: 'の as ordinary noun token', expected: 'false', run: () => String(isParticle({ surface_form: 'の', pos: '名詞', pos_detail_1: '一般' })) },
            { id: 'MECH-GRAMMAR-KATAKANA-NO-SYMBOL-RECOVERY', suite: 'engine', rule: 'A standalone orthographic ノ mislabelled as a symbol is recovered as a separate lowercase genitive particle when lexical spans occur on both sides', input: '森ノ奥', expected: 'Mori no Oku', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-KATAKANA-NO-USER-FAMILY', suite: 'engine', rule: 'Katakana genitive orthography remains a grammatical output boundary in a longer title-like noun phrase rather than concatenating with the preceding lexical word', input: '桃源郷ノ蜜事', expected: 'Tougenkyou no Mitsugoto', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-KATAKANA-NO-TITLE-LEXICAL-GUARD', suite: 'engine', rule: 'Reviewed whole-title evidence outranks a possible internal Katakana ノ grammatical analysis so an established lexical title is not split', input: 'モノノ怪', expected: 'Mononoke', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-KATAKANA-NO-WHOLE-TOKEN-GUARD', suite: 'engine', rule: 'A complete tokenizer-owned proper-name span containing ノ is not split merely because the same glyph can function as a stylised particle elsewhere', input: '山ノ手', expected: 'Yamanote', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-KATAKANA-NO-LOANWORD-GUARD', suite: 'engine', rule: 'Katakana words beginning with ノ remain lexical and are not reclassified by the standalone orthographic-particle recovery mechanism', input: 'ノート', expected: 'Nooto', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-LEXICAL-NO-BONNOUJI', suite: 'engine', rule: 'A lexical の exposed by Kuromoji inside continuous kana does not create a particle boundary', input: 'ぼんのうじ', expected: 'Bonnouji', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-GENUINE-NO-MARI', suite: 'engine', rule: 'A syntactically supported の remains grammatical while adjacent kana lexical evidence cannot manufacture the segmentation', input: 'ぼくは麻理のなか', expected: 'Boku wa Mari no Naka', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-ROKUNIN', suite: 'engine', rule: 'A false Kuromoji split before final ん is output-neutral inside a lexical kana span', input: '十字架のろくにん', expected: 'Juujika no Rokunin', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-YOTSUBA-GUARD', suite: 'unit', rule: 'Kuromoji splitting よつばと into particle-like fragments cannot reproduce the known broken yo Tsuba to output', input: 'よつばと!', expected: 'true', run: () => String(translateText('よつばと!') !== 'yo Tsuba to!' && translateText('よつばと!') !== 'Yo Tsuba to!') },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-KORETTO', suite: 'engine', rule: 'A genuine に particle remains grammatical and cannot be consumed by kana lexical evidence for にし', input: 'コレットは死ぬことにした', expected: 'Koretto wa Shinu Koto ni Shita', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-KANA-BOUNDARY-HIRUNAKA', suite: 'engine', rule: 'A Kuromoji boundary inside a continuous kana lexical word does not introduce a space or capitalisation', input: 'ひるなかの流星', expected: 'Hirunaka no Ryuusei', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-AUDIT-SOURCE-SPAN', suite: 'unit', rule: 'Translation audit retains the reconciled token source range so the final reading remains traceable to the original Japanese span', input: 'ぼんのうじ', expected: '0:5:ぼんのうじ', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; translateText('ぼんのうじ'); const item = runtimeState.lastTranslationDiagnostics?.readings?.find(reading => reading.surface === 'ぼんのうじ'); return `${item?.sourceStart}:${item?.sourceEnd}:${item?.sourceSurface || ''}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-BOUNDARY-ARBITRATION-LOCATION-VARIANT-KEN', suite: 'engine', rule: 'A supported source-only location-name glyph variant preserves the canonical name reading before a Kuromoji regional suffix even when raw variant tokenisation swallows the boundary', input: '髙山県', expected: 'Takayamaken', expectedRequiresReview: true },
            { id: 'MECH-BOUNDARY-ARBITRATION-LOCATION-VARIANT-TO', suite: 'engine', rule: 'Contextual regional-suffix evidence restores the canonical location-name boundary before 都 without suppressing existing uncertainty', input: '髙山都', expected: 'Takayamato', expectedRequiresReview: true },
            { id: 'MECH-BOUNDARY-ARBITRATION-LOCATION-VARIANT-TOU', suite: 'engine', rule: 'Contextual regional-suffix evidence preserves the suffix reading selected by canonical full-context Kuromoji analysis for 島', input: '髙山島', expected: 'Takayamatou', expectedRequiresReview: true },
            { id: 'MECH-BOUNDARY-ARBITRATION-LOCATION-VARIANT-SUFFIX-REVIEW-BMP', suite: 'engine', rule: 'Canonical location-suffix context may resolve variant tokenisation without erasing lexical review state retained by the canonical spelling', input: '伊勢厡市', expected: 'Iseharashi', expectedRequiresReview: true },
            { id: 'MECH-BOUNDARY-ARBITRATION-LOCATION-VARIANT-SUFFIX-REVIEW-SUPPLEMENTARY', suite: 'engine', rule: 'Supplementary-plane location variants preserve canonical suffix review state when contextual boundary evidence is selected', input: '伊勢𠩤市', expected: 'Iseharashi', expectedRequiresReview: true },
            { id: 'MECH-SOURCE-INTEGRITY-VARIANT-CANONICAL-TRACE', suite: 'unit', rule: 'Canonical name-variant re-tokenisation remains traceable to the exact original variant source span', input: '髙橋', expected: '0:2:髙橋', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; translateText('髙橋'); const item = runtimeState.lastTranslationDiagnostics?.readings?.find(reading => reading.surface === '高橋'); return `${item?.sourceStart}:${item?.sourceEnd}:${item?.sourceSurface || ''}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
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
            { id: 'AUTH-SPAN-GATE-DIRECT-CATEGORY', suite: 'unit', rule: 'Direct-authority categories can authorise an exact single-token span without relying on multi-token or variant gates', input: 'single-token ateji authority', expected: '1', run: () => String(runAuthoritativeSpanGateFixture({ surface: '亜', category: 'ateji', tokens: [{ surface_form: '亜', pos: '名詞', reading: 'ア' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-RESCUE', suite: 'unit', rule: 'General-word evidence is authoritative only when the candidate token still needs authoritative reading rescue', input: 'single unresolved general-word token', expected: '1', run: () => String(runAuthoritativeSpanGateFixture({ surface: '𰻞', category: 'general-word', tokens: [{ surface_form: '𰻞', pos: '名詞', pos_detail_1: '一般', reading: '*', pronunciation: '*' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-MERGESAFE-READABLE', suite: 'unit', rule: 'Strong merge-safe whole-word evidence can repair a multi-token split even when every fragment has a readable Kuromoji reading', input: '甲 + 乙 / merge-safe general word', expected: '2', run: () => String(runAuthoritativeSpanGateFixture({ surface: '甲乙', category: 'general-word', mergeSafe: true, tokens: [{ surface_form: '甲', pos: '名詞', pos_detail_1: '一般', reading: 'コウ' }, { surface_form: '乙', pos: '名詞', pos_detail_1: '一般', reading: 'オツ' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-WEAK-READABLE-NOMERGE', suite: 'unit', rule: 'A weak general-word reading alias cannot override a completely readable tokenizer split', input: '甲 + 乙 / non-merge-safe general word', expected: '0', run: () => String(runAuthoritativeSpanGateFixture({ surface: '甲乙', category: 'general-word', mergeSafe: false, tokens: [{ surface_form: '甲', pos: '名詞', pos_detail_1: '一般', reading: 'コウ' }, { surface_form: '乙', pos: '名詞', pos_detail_1: '一般', reading: 'オツ' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-PARTICLE-GUARD', suite: 'unit', rule: 'Merge-safe lexical evidence does not consume an independently grammatical particle inside an otherwise matching surface', input: '猫 + の + 家', expected: '0', run: () => String(runAuthoritativeSpanGateFixture({ surface: '猫の家', category: 'general-word', mergeSafe: true, tokens: [{ surface_form: '猫', pos: '名詞', pos_detail_1: '一般', reading: 'ネコ' }, { surface_form: 'の', pos: '助詞', pos_detail_1: '連体化', reading: 'ノ' }, { surface_form: '家', pos: '名詞', pos_detail_1: '一般', reading: 'イエ' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-REVIEWED-NAME-GUARD', suite: 'unit', rule: 'Merge-safe lexical evidence does not consume stronger reviewed proper-name evidence inside its candidate span', input: '東 + 京 with reviewed-name token', expected: '0', run: () => String(runAuthoritativeSpanGateFixture({ surface: '東京', category: 'general-word', mergeSafe: true, tokens: [{ surface_form: '東', pos: '名詞', pos_detail_1: '一般', reading: 'ヒガシ' }, { surface_form: '京', pos: '名詞', pos_detail_1: '固有名詞', reading: 'キョウ', reviewedProperNameSpanMatched: true }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-NUMERIC-UNIT-GUARD', suite: 'unit', rule: 'Merge-safe lexical evidence does not consume a structural numeral-plus-counter unit', input: '千 + 円', expected: '0', run: () => String(runAuthoritativeSpanGateFixture({ surface: '千円', category: 'general-word', mergeSafe: true, tokens: [{ surface_form: '千', pos: '名詞', pos_detail_1: '数', reading: 'セン' }, { surface_form: '円', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', reading: 'エン' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-NUMERIC-CONTEXT-GUARD', suite: 'unit', rule: 'An otherwise lexical all-numeral surface stays structural when it is embedded in a larger numeric sequence', input: '二 + 万 + 一 / candidate 万一', expected: '0', run: () => String(runAuthoritativeSpanGateFixture({ surface: '万一', category: 'general-word', mergeSafe: true, startIndex: 1, tokens: [{ surface_form: '二', pos: '名詞', pos_detail_1: '数', reading: 'ニ' }, { surface_form: '万', pos: '名詞', pos_detail_1: '数', reading: 'マン' }, { surface_form: '一', pos: '名詞', pos_detail_1: '数', reading: 'イチ' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-GENERAL-WORD-ISOLATED-NUMERIC-LEXEME', suite: 'unit', rule: 'A reviewed lexical numeral collision may remain authoritative when no surrounding numeric structure exists', input: '万 + 一 / isolated 万一', expected: '2', run: () => String(runAuthoritativeSpanGateFixture({ surface: '万一', category: 'general-word', mergeSafe: true, tokens: [{ surface_form: '万', pos: '名詞', pos_detail_1: '数', reading: 'マン' }, { surface_form: '一', pos: '名詞', pos_detail_1: '数', reading: 'イチ' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-MULTI-TOKEN-NON-GENERAL', suite: 'unit', rule: 'A non-general authoritative entry spanning multiple tokens is accepted independently of the direct-category and variant gates', input: 'two-token compound authority', expected: '2', run: () => String(runAuthoritativeSpanGateFixture({ surface: '甲乙', category: 'compound-word', tokens: [{ surface_form: '甲', pos: '名詞', reading: 'コウ' }, { surface_form: '乙', pos: '名詞', reading: 'オツ' }] })?.length || 0) },
            { id: 'AUTH-SPAN-GATE-VARIANT-SINGLE-TOKEN', suite: 'unit', rule: 'A variant-normalised non-general entry can authorise a single token even when no other authoritative-span gate applies', input: '髙 → 高 reviewed-name authority', expected: '1', run: () => String(runAuthoritativeSpanGateFixture({ surface: '髙', lookupSurface: '高', category: 'reviewed-name', nameVariant: true, tokens: [{ surface_form: '髙', pos: '名詞', reading: 'タカ' }] })?.length || 0) },
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
            { id: 'SYS-TITLE-ANSATSUSHA-GUARD', suite: 'engine', rule: 'Systemic boundary repair does not regress an already-correct long title', input: '『世界最高暗殺者、異世界貴族に転生する』', expected: "'Sekai Saikou Ansatsusha, Isekai Kizoku ni Tensei Suru'", expectedRequiresReview: false },
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
            { id: 'CHECK-ORTHO-ITERATION-CONTIGUOUS-BOUNDARY-REVIEW', suite: 'engine', rule: 'A tokenizer-only boundary inside contiguous kana containing an iteration mark remains reviewable when no whole-span evidence applies in normal mode', input: 'すゞしい', expected: 'Suzu Shii', expectedRequiresReview: true },
            { id: 'CHECK-ORTHO-ITERATION-SINGLE-TOKEN-CONTROL', suite: 'engine', rule: 'An iteration mark already contained inside one confidently analysed token does not become reviewable merely because the orthographic mark is present', input: 'いすゞ', expected: 'Isuzu', expectedRequiresReview: false },
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
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-FREQUENCY', suite: 'engine', rule: 'A day span followed by に plus an explicit frequency count is a one-day duration frame rather than calendar day one', input: '一日に三回読む', expected: 'Ichinichi ni Sankai Yomu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-FREQUENCY-SECOND-COUNTER', suite: 'engine', rule: 'One-day duration selection is driven by the following frequency structure rather than a 回-specific string exception', input: '一日に三度読む', expected: 'Ichinichi ni Sando Yomu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-FREQUENCY-KAI-FAMILY', suite: 'engine', rule: 'A structurally selected one-day frequency frame accepts analyser-backed 回 counter readings without inheriting unrelated numeral ambiguity', input: '一日に六回書く', expected: 'Ichinichi ni Rokkai Kaku', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-FREQUENCY-DO-FAMILY', suite: 'engine', rule: 'A structurally selected one-day frequency frame preserves an attested 度 count and clears only the ambiguity superseded by that role', input: '一日に五度確認する', expected: 'Ichinichi ni Godo Kakunin Suru', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-CALENDAR-GUARD', suite: 'engine', rule: 'A case-marked 一日 without a following frequency count retains the accepted calendar-date interpretation', input: '一日に学校で会う', expected: 'Tsuitachi ni Gakkou de Au', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-BARE-ONE-DAY-AMBIGUOUS', suite: 'engine', rule: 'Bare 一日 retains a printable provisional date reading but remains review-required because calendar-date and one-day-duration roles are both viable without context', input: '一日', expected: 'Tsuitachi', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-PUNCTUATED-ONE-DAY-AMBIGUOUS', suite: 'engine', rule: 'Terminal punctuation does not resolve the lexical role of bare 一日', input: '一日。', expected: 'Tsuitachi.', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ADVERBIAL-JUUBUN', suite: 'engine', rule: 'Reviewed contextual lexical evidence resolves 十分に as the adverbial じゅうぶん construction instead of leaving a stale minute-counter conflict', input: '十分に休む', expected: 'Juubun ni Yasumu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ADVERBIAL-JUUNIBUN', suite: 'engine', rule: 'Reviewed contextual lexical evidence resolves 十二分に as じゅうにぶん without selecting a minute-counter role', input: '十二分に楽しむ', expected: 'Juunibun ni Tanoshimu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ADVERBIAL-FREQUENCY-GUARD', suite: 'engine', rule: 'A following numeric frequency phrase prevents the adjectival-context rule from manufacturing certainty for an otherwise ambiguous 分 expression', input: '十分に一回休む', expected: 'Juubun ni Ikkai Yasumu', expectedRequiresReview: true },
            { id: 'CHECK-TEMPORAL-LEXICAL-COLLISION-REVIEW', suite: 'engine', rule: 'When an attested typed span and a complete 中-initial lexical noun produce two valid boundary analyses, CJ2R keeps the lexical output but requires review rather than manufacturing segmentation certainty', input: '一日中学校で学ぶ', expected: 'Ichinichi Chuugakkou de Manabu', expectedRequiresReview: true },
            { id: 'CHECK-TEMPORAL-LEXICAL-COLLISION-CONTROL', suite: 'engine', rule: 'A 中-initial lexical noun is not made reviewable merely because an unattested distributive temporal span could be imagined', input: '毎日中庭を歩く', expected: 'Mainichi Nakaniwa o Aruku', expectedRequiresReview: false },
            { id: 'CTX-COUNTER-FOLLOWER-LEXICAL-ROLE', suite: 'engine', rule: 'A case-marked noun following a counter can recover its independent lexical reading when counter adjacency causes Kuromoji to misclassify it as a suffix', input: '一日一回薬を飲む', expected: 'Ichinichi Ikkai Kusuri o Nomu', expectedRequiresReview: false },
            { id: 'CTX-MORPH-COMPOUND-VERB-JOIN', suite: 'engine', rule: 'Explicit morphological grouping keeps a lexical compound verb together through final output formatting', input: '本を読み終わった', expected: 'Hon o Yomiowatta', expectedRequiresReview: false },
            { id: 'CTX-MORPH-CONJUNCTIVE-BA-JOIN', suite: 'engine', rule: 'Explicit morphological grouping keeps conjunctive ば attached to the inflected lexical word rather than introducing a formatter space', input: '行かなければいけない', expected: 'Ikanakereba Ikenai', expectedRequiresReview: true },
            { id: 'MECH-KANA-LEXICAL-CONTEXT-SPLIT-MONONOKE', suite: 'engine', rule: 'Reviewed whole-word evidence reconstructs a kana lexical noun when sentence context makes Kuromoji split it across incompatible token roles', input: 'もののけを見る', expected: 'Mononoke o Miru', expectedRequiresReview: false },
            { id: 'MECH-KANA-LEXICAL-CONTEXT-SPLIT-MONONOKE-SECOND-CONTEXT', suite: 'engine', rule: 'The lexical reconstruction is evidence-driven and survives a different following grammatical frame rather than depending on one sentence', input: 'もののけを呼ぶ', expected: 'Mononoke o Yobu', expectedRequiresReview: false },
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
            { id: 'KANA-COMMON-PARTIAL-TOKEN-HONORIFIC', suite: 'engine', rule: 'A partial-token lexical repair can reassemble an honorific fragmented by the split without capitalising it', input: 'わるものさん', expected: 'Warumono san', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KEION-ABBREVIATION', suite: 'engine', rule: 'Reviewed whole-word evidence resolves the ordinary 軽音 abbreviation as けいおん instead of composing the isolated 音 reading', input: '軽音', expected: 'Keion', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KEIONBU-PROPER-NAME-COLLISION', suite: 'engine', rule: 'Reviewed whole-word evidence overrides a destructive prefix plus proper-name split inside the ordinary lexical compound 軽音部', input: '軽音部', expected: 'Keionbu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KEIONBU-TITLE-CONTEXT', suite: 'engine', rule: 'The 軽音部 lexical repair remains valid inside a larger ordinary title context rather than depending on whole-input matching', input: 'ふつうの軽音部', expected: 'Futsuu no Keionbu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KEIONBU-PROPER-NAME-INVERSE', suite: 'engine', rule: 'The lexical repair does not globally replace standalone 音部 when Kuromoji analyses it as a proper name', input: '音部', expected: 'Otobe', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KEIONBU-FULL-FORM-INVERSE', suite: 'engine', rule: 'The shortened 軽音 evidence does not disturb the independently supported full lexical form 軽音楽部', input: '軽音楽部', expected: 'Keiongakubu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-HITOTOKI-CORROBORATED-SPLIT', suite: 'engine', rule: 'Independent maintained lexical evidence and exact Kuromoji whole-span evidence repair a destructive numeric-plus-counter analyser split without relying on a surface-specific override', input: 'ひと時', expected: 'Hitotoki', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-HITOTOKI-CONTEXT', suite: 'engine', rule: 'The corroborated ひと時 lexical span remains intact inside ordinary sentence context rather than only as an isolated input', input: 'ひと時を過ごす', expected: 'Hitotoki o Sugosu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-SUUJITSU-MODERN-DEFAULT', suite: 'engine', rule: 'Reviewed contemporary lexical evidence selects 数日 as すうじつ rather than allowing a weaker alternative analyser reading to become the modern default', input: '数日', expected: 'Suujitsu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-SUUJITSUKAN-MODERN-DEFAULT', suite: 'engine', rule: 'The independently attested modern compound 数日間 retains すうじつ inside the complete lexical span instead of inheriting 日間 as にちかん after destructive tokenisation', input: '数日間', expected: 'Suujitsukan', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-SUUJITSUGO-CONTEXT', suite: 'engine', rule: 'The modern 数日 reading remains stable before an ordinary following temporal noun rather than depending on whole-input matching', input: '数日後', expected: 'Suujitsugo', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-SUUJITSU-KYUUJITAI', suite: 'engine', rule: 'Variant normalisation preserves the reviewed modern 数日 reading for the corresponding kyuuji surface rather than reviving a weaker analyser reading', input: '數日', expected: 'Suujitsu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-SUUJITSUKAN-KYUUJITAI', suite: 'engine', rule: 'Variant normalisation preserves the reviewed modern 数日間 compound reading for the corresponding kyuuji surface', input: '數日間', expected: 'Suujitsukan', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-OTESUU-MODERN-POLITE', suite: 'engine', rule: 'Reviewed contemporary honorific lexical evidence selects 御手数/お手数 as おてすう instead of allowing the alternate analyser reading おてかず to become the default', input: 'お手数', expected: 'Otesuu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-OTESUU-POLITE-CONTEXT', suite: 'engine', rule: 'The reviewed お手数 lexical reading remains authoritative in the ordinary polite expression お手数ですが rather than becoming silently Otekazu in sentence context', input: 'お手数ですが', expected: 'Otesuu desu ga', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-OTESUU-BASE-AMBIGUITY-INVERSE', suite: 'engine', rule: 'Scoping the honorific lexical form does not erase the legitimate てすう/てかず ambiguity of bare 手数', input: '手数', expected: 'Tesuu', expectedRequiresReview: true },
            { id: 'MECH-WHOLE-WORD-MODERN-EKIBYOU', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 疫病 as えきびょう instead of allowing the historically common やくびょう reading to become the default', input: '疫病', expected: 'Ekibyou', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-EKIBYOU-CONTEXT', suite: 'engine', rule: 'The modern 疫病 reading remains authoritative inside an ordinary following compound instead of reverting to historical やくびょう', input: '疫病対策', expected: 'Ekibyou Taisaku', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-YAKUBYOUGAMI-INVERSE', suite: 'engine', rule: 'Modern-default handling for 疫病 does not overwrite the established lexicalised reading 疫病神 やくびょうがみ', input: '疫病神', expected: 'Yakubyougami', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-KANCHI', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 完治 as かんち rather than the redirected alternate かんじ', input: '完治', expected: 'Kanchi', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-KANCHI-CONTEXT', suite: 'engine', rule: 'Unrelated sentence context cannot revive the non-default 完治 reading once modern whole-word evidence resolves the lexeme', input: '完全に完治する', expected: 'Kanzen ni Kanchi Suru', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TEKIKOKU', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 敵国 as てきこく rather than the redirected alternate てっこく', input: '敵国', expected: 'Tekikoku', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TEKIKOKU-COMPOUND', suite: 'engine', rule: 'The modern 敵国 reading remains intact when the lexeme participates in a larger compound', input: '敵国兵', expected: 'Tekikokuhei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-RYOKKA', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 緑化 as りょっか rather than the redirected alternate りょくか', input: '緑化', expected: 'Ryokka', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-ROUEI', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 漏洩 as ろうえい while retaining ろうせつ only as a non-default attested alternate', input: '漏洩', expected: 'Rouei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-ROUEI-CONTEXT', suite: 'engine', rule: 'The modern 漏洩 reading remains stable inside ordinary compound context', input: '情報漏洩', expected: 'Jouhou Rouei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TENNOUSEI', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 天王星 as てんのうせい rather than the redirected てんおうせい form', input: '天王星', expected: 'Tennousei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-KYOUJI', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 教示 as きょうじ while retaining きょうし only as an attested alternate', input: '教示', expected: 'Kyouji', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-GOKYOUJI', suite: 'engine', rule: 'Modern-default 教示 evidence remains authoritative when preceded by the ordinary honorific prefix', input: '御教示', expected: 'Gokyouji', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-NOUSAKUBUTSU', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 農作物 as のうさくぶつ rather than the alternate のうさくもつ', input: '農作物', expected: 'Nousakubutsu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-SHOUROU', suite: 'engine', rule: 'Reviewed contemporary evidence selects 鐘楼 as しょうろう while leaving しゅろう as an attested alternate rather than default authority', input: '鐘楼', expected: 'Shourou', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-YOJIN', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 余人 as よじん rather than the redirected alternate よにん', input: '余人', expected: 'Yojin', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TESSEI', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects standalone 鉄製 as てっせい', input: '鉄製', expected: 'Tessei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TESSEI-ADNOMINAL', suite: 'engine', rule: 'The reviewed てっせい default applies at an ordinary grammatical boundary rather than only when 鉄製 is the entire input', input: '鉄製の箱', expected: 'Tessei no Hako', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TETSU-SEIHIN-INVERSE', suite: 'engine', rule: 'The standalone 鉄製 default does not leak into the established longer compound 鉄製品', input: '鉄製品', expected: 'Tetsu Seihin', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-TETSU-SEI-COMPOUND-INVERSE', suite: 'engine', rule: 'A longer 鉄製 compound outside the reviewed modern-default boundary keeps its existing reading and uncertainty instead of being rewritten by prefix leakage', input: '鉄製模造品', expected: 'Tetsusei Mozouhin', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-MERGESAFE-LOWER-VARIANT-CONTEXT', suite: 'engine', rule: 'Unrelated sentence context does not erase review when a merge-safe whole lexeme is still pronounced with a lower-ranked legitimate alternate reading', input: '高名な作家', expected: 'Koumyou na Sakka', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-MODERN-VARIANT-CONTROL-SEKOU', suite: 'engine', rule: 'A genuinely current reading pair remains reviewable instead of being collapsed merely because one dictionary ordering ranks one pronunciation first', input: '施工', expected: 'Shikou', expectedRequiresReview: true },
            { id: 'MECH-WHOLE-WORD-MODERN-SANKAKUKEI', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 三角形 as さんかくけい rather than the redirected さんかっけい alternate', input: '三角形', expected: 'Sankakukei', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-MODERN-SANKAKUKEI-WHOLE-TOKEN', suite: 'engine', rule: 'An explicitly reviewed component reading may repair the matching edge of an intact compositional Kuromoji token without destroying the analyser reading of its prefix', input: '正三角形', expected: 'Seisankakukei', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-MODERN-SANKAKUKEI-LONGER-PREFIX', suite: 'engine', rule: 'Token-reading authority preserves a longer independently analysed prefix while replacing only the attested alternate reading of the reviewed 三角形 suffix', input: '二等辺三角形', expected: 'Nitouhensankakukei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-SANKAKKEI-KANA-INVERSE', suite: 'engine', rule: 'Reviewed Kanji default selection does not rewrite explicitly authored kana that encode the accepted さんかっけい pronunciation', input: 'さんかっけい', expected: 'sankakkei', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-SHIIKA', suite: 'engine', rule: 'Reviewed contemporary dictionary evidence selects 詩歌 as しいか rather than the redirected しか alternate', input: '詩歌', expected: 'Shiika', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-SHIIKA-CONTEXT', suite: 'engine', rule: 'The modern 詩歌 reading remains authoritative in ordinary lexical context rather than reverting to しか', input: '近代詩歌', expected: 'Kindai Shiika', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-MODERN-SHIKA-KANA-INVERSE', suite: 'engine', rule: 'Reviewed Kanji default selection does not rewrite explicitly authored kana that encode the accepted しか pronunciation', input: 'しか', expected: 'shika', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-KITAN-TOKEN-SPLIT', suite: 'engine', rule: 'Reviewed whole-word evidence for 奇譚 overrides an erroneous person-name subtoken so tokenizer segmentation cannot insert a false lexical space', input: '此花亭奇譚', expected: 'Konohanatei Kitan', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-TAISOU-MIXED-KANA', suite: 'engine', rule: 'Reviewed whole-word evidence joins the mixed-script lexical span 大そう and supplies its attested たいそう reading instead of reading 大 in isolation', input: '大そう', expected: 'Taisou', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-DAKIMAKURA-LEXICAL-SPAN', suite: 'engine', rule: 'Reviewed lexical evidence joins 抱き枕 before merchandise loanword handling so the noun reads Dakimakura rather than Idakimakura', input: '抱き枕カバー', expected: 'Dakimakura Cover', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-YOTSUBA-TO-TITLE', suite: 'engine', rule: 'Reviewed title-boundary evidence separates the final particle-like と in よつばと without creating a generic all-kana splitting heuristic', input: 'よつばと！', expected: 'Yotsuba to!', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-KAKUKAKU-SHIKAJIKA', suite: 'engine', rule: 'Reviewed title evidence preserves Shikajika as one lexical unit instead of treating its final か as a grammatical particle', input: 'かくかくしかじか', expected: 'Kakukaku Shikajika', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-RYUUOU-NO-OSHIGOTO', suite: 'engine', rule: 'Reviewed title evidence reconstructs the internal Ryuuou no Oshigoto boundaries when Kuromoji returns the all-kana title as one span', input: 'りゅうおうのおしごと！', expected: 'Ryuuou no Oshigoto!', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-KUMO-NANI-KA', suite: 'engine', rule: 'Reviewed title context separates Nani ka only for the established 蜘蛛ですが、なにか title instead of globally splitting lexical なにか', input: '蜘蛛ですが、なにか？', expected: 'Kumo desu ga, Nani ka?', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-REVIEWED-PATTERN-FULLWIDTH-META-LITERAL', suite: 'unit', rule: 'Full-width punctuation authored as literal reviewed-pattern text stays literal after tokenizer-boundary canonicalisation rather than becoming regular-expression syntax', input: '前（後）？ reviewed pattern', expected: 'true:false', run: () => { const pattern = compileReviewedPattern(canonicalizeReviewedPatternForTokenizerBoundary('前（後）？'), 'u'); const exact = pattern.test(normalizeTranslatorInputText('前（後）？')); pattern.lastIndex = 0; const omitted = pattern.test(normalizeTranslatorInputText('前後')); return `${exact}:${omitted}`; } },
            { id: 'MECH-BOUNDARY-ARBITRATION-REVIEWED-PATTERN-ASCII-SYNTAX-CONTROL', suite: 'unit', rule: 'ASCII regular-expression syntax intentionally authored in reviewed evidence remains active while full-width punctuation inside its character class is canonicalised to the normalized source form', input: '試験(?=$|[。？！]) reviewed pattern', expected: 'true:false', run: () => { const pattern = compileReviewedPattern(canonicalizeReviewedPatternForTokenizerBoundary('試験(?=$|[。？！])'), 'u'); const punctuated = pattern.test(normalizeTranslatorInputText('試験？')); pattern.lastIndex = 0; const lexicalTail = pattern.test(normalizeTranslatorInputText('試験猫')); return `${punctuated}:${lexicalTail}`; } },
            { id: 'MECH-BOUNDARY-ARBITRATION-KUMO-PUNCTUATION-SCOPE', suite: 'unit', rule: 'The reviewed 蜘蛛ですが、なにか？ title pattern requires its authored question mark after input normalization and cannot leak the Nani ka boundary into an unpunctuated lookalike', input: '蜘蛛ですが、なにか？ pattern scope', expected: 'true:false', run: () => { const rule = (runtimeState.titleReadingDictionary.get('なにか') || []).find(item => item.patternText === '蜘蛛ですが、なにか？'); if (!rule) return 'missing'; rule.pattern.lastIndex = 0; const punctuated = rule.pattern.test(normalizeTranslatorInputText('蜘蛛ですが、なにか？')); rule.pattern.lastIndex = 0; const unpunctuated = rule.pattern.test(normalizeTranslatorInputText('蜘蛛ですが、なにか')); return `${punctuated}:${unpunctuated}`; } },
            { id: 'MECH-BOUNDARY-ARBITRATION-COMMON-WORD-PUNCTUATION-PATTERN', suite: 'unit', rule: 'Reviewed common-word context patterns are matched against the same canonical punctuation form as normalized source text so a full-width question mark does not silently disable the authored context rule', input: '一人？ common-word pattern', expected: 'true:false', run: () => { const rule = (runtimeState.commonWordDictionary.get('一人') || []).find(item => item.pattern); if (!rule) return 'missing'; rule.pattern.lastIndex = 0; const punctuated = rule.pattern.test(normalizeTranslatorInputText('一人？')); rule.pattern.lastIndex = 0; const lexicalTail = rule.pattern.test(normalizeTranslatorInputText('一人猫')); return `${punctuated}:${lexicalTail}`; } },
            { id: 'MECH-BOUNDARY-ARBITRATION-KAZE-TABIBITO', suite: 'engine', rule: 'Reviewed title evidence joins 旅ビト as Tabibito while retaining ノ as the grammatical particle no', input: '風ノ旅ビト', expected: 'Kaze no Tabibito', expectedRequiresReview: false },
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
            { id: 'MECH-TOKENISATION-EMPTY-RAW-FALLBACK-DIAGNOSTICS', suite: 'unit', rule: 'A non-empty source paired with an empty tokenizer result uses the bounded surface fallback and records that fallback explicitly instead of fabricating token evidence', input: 'テスト / empty raw token list', expected: '[Unresolved]|unresolved-reading|true', run: () => { const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics; const previousDiagnostics = runtimeState.lastTranslationDiagnostics; runtimeState.captureTranslationDiagnostics = true; runtimeState.lastTranslationDiagnostics = null; try { const output = translateTextFromTokenizationForQa('テスト', [], { overridesEnabled: false }); const audit = runtimeState.lastTranslationDiagnostics; return `${output}|${audit?.redFlags?.[0]?.flag || ''}|${String(Boolean(audit?.requiresReview))}`; } finally { runtimeState.captureTranslationDiagnostics = previousDiagnosticsState; runtimeState.lastTranslationDiagnostics = previousDiagnostics; } } },
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
            { id: 'MECH-TOKENISATION-REVIEWED-LOANWORD-PARTICLE-COLLISION', suite: 'unit', rule: 'A reviewed source-language loanword span remains intact when an alternative kana token split would make its final fragment plus the following particle resemble another lexical reading', input: 'アイデアプロセッ / サ / は / 人気', expected: 'Idea Processor wa Ninki', run: () => translateArtificialTokenisation('アイデアプロセッサは人気', [
                { surface: 'アイデアプロセッ', pos: '名詞', pos_detail_1: '一般', reading: 'アイデアプロセッ', pronunciation: 'アイデアプロセッ' },
                { surface: 'サ', pos: '名詞', pos_detail_1: '一般', reading: 'サ', pronunciation: 'サ' },
                particle('は', '係助詞'),
                { surface: '人気', pos: '名詞', pos_detail_1: '一般', reading: 'ニンキ', pronunciation: 'ニンキ' }
            ]) },
            { id: 'MECH-TOKENISATION-INFLECTIONAL-TEDE-POS-RECOVERY', suite: 'unit', rule: 'Inflectional て/で attachment is recovered from source-span verb evidence when an alternative analyser POS mislabels the inflected stem', input: '泳い(noun) / で / 戻る', expected: 'Oyoide Modoru', run: () => translateArtificialTokenisation('泳いで戻る', [
                { surface: '泳い', pos: '名詞', pos_detail_1: '一般', reading: 'オヨイ', pronunciation: 'オヨイ' },
                particle('で', '接続助詞'),
                { surface: '戻る', pos: '動詞', pos_detail_1: '自立', basic_form: '戻る', reading: 'モドル', pronunciation: 'モドル' }
            ]) },
            { id: 'CHECK-TOKENISATION-INFLECTIONAL-TEDE-NOUN-PARTICLE-SEPARATE', suite: 'unit', rule: 'Recovering inflectional て/で from lexical evidence must not attach an ordinary case particle to a noun', input: '手 / で / 描く', expected: 'Te de Egaku', run: () => translateArtificialTokenisation('手で描く', [
                { surface: '手', pos: '名詞', pos_detail_1: '一般', reading: 'テ', pronunciation: 'テ' },
                particle('で', '格助詞'),
                { surface: '描く', pos: '動詞', pos_detail_1: '自立', basic_form: '描く', reading: 'エガク', pronunciation: 'エガク' }
            ]) },
            { id: 'MECH-TOKENISATION-GRAMMATICAL-EXPRESSION-POS-RECOVERY', suite: 'unit', rule: 'An exact maintained grammatical expression is reconstructed from source evidence even when the analyser mislabels that expression as a symbol token', input: '作品 / として(symbol) / 登場', expected: 'Sakuhin to shite Toujou', run: () => translateArtificialTokenisation('作品として登場', [
                { surface: '作品', pos: '名詞', pos_detail_1: '一般', reading: 'サクヒン', pronunciation: 'サクヒン' },
                { surface: 'として', pos: '記号', pos_detail_1: '一般', reading: 'トシテ', pronunciation: 'トシテ' },
                { surface: '登場', pos: '名詞', pos_detail_1: 'サ変接続', reading: 'トウジョウ', pronunciation: 'トージョー' }
            ]) },
            { id: 'MECH-TOKENISATION-EXACT-WORD-PARTICLE-COLLISION', suite: 'unit', rule: 'An exact whole-word dictionary span remains intact before a syntactically supported particle instead of yielding to an overlapping kana-reading alias', input: 'パン / ダ / は / 人気', expected: 'Panda wa Ninki', run: () => translateArtificialTokenisation('パンダは人気', [
                { surface: 'パン', pos: '名詞', pos_detail_1: '一般', reading: 'パン', pronunciation: 'パン' },
                { surface: 'ダ', pos: '名詞', pos_detail_1: '一般', reading: 'ダ', pronunciation: 'ダ' },
                particle('は', '係助詞'),
                { surface: '人気', pos: '名詞', pos_detail_1: '一般', reading: 'ニンキ', pronunciation: 'ニンキ' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-CORROBORATED-LEXICAL-NUMERIC-SPLIT', suite: 'unit', rule: 'A numeric-plus-counter-shaped analyser split is repairable when exact whole-span Kuromoji evidence and independent maintained lexical evidence agree and no typed numeric authority overlaps the span', input: 'ひと / 時(助数詞)', expected: 'Hitotoki:false', run: () => { const result = auditArtificialTokenisation('ひと時', [
                { surface: 'ひと', pos: '名詞', pos_detail_1: '数', reading: 'ヒト', pronunciation: 'ヒト' },
                { surface: '時', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', reading: 'ジ', pronunciation: 'ジ' }
            ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
            { id: 'MECH-GRAMMAR-SUFFIX-PARTICLE-HOST-REJECTED', suite: 'engine', rule: 'A suffix-like analyser token cannot attach across an immediately preceding particle when no stronger morphology establishes that attachment', input: '音楽が好き', expected: 'Ongaku ga Suki', expectedRequiresReview: false },
            { id: 'CHECK-SUFFIX-PARTICLE-HOST-MO', suite: 'engine', rule: 'The same suffix-host guard applies to a different ordinary particle rather than being specific to が', input: '映画も好き', expected: 'Eiga mo Suki', expectedRequiresReview: false },
            { id: 'MECH-TOKENISATION-SUFFIX-LEXICAL-HOST-PRESERVED', suite: 'unit', rule: 'Rejecting a particle as a suffix host does not disable ordinary suffix attachment to a lexical host under the same analyser metadata', input: '中央 + 駅(接尾)', expected: 'Chuuoueki', run: () => translateArtificialTokenisation('中央駅', [
                { surface: '中央', pos: '名詞', pos_detail_1: '一般', reading: 'チュウオウ', pronunciation: 'チューオー' },
                { surface: '駅', pos: '名詞', pos_detail_1: '接尾', reading: 'エキ', pronunciation: 'エキ' }
            ]) },
            { id: 'MECH-GRAMMAR-MUTATION-GRAMMATICAL-NO', suite: 'unit', rule: 'A genuine grammatical の remains grammatical while neighbouring kana boundaries vary', input: 'ぼくは麻理のなか', expected: 'Boku wa Mari no Naka', run: () => translateArtificialTokenisation('ぼくは麻理のなか', [
                'ぼく', particle('は', '係助詞'),
                { surface: '麻理', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', reading: 'マリ', pronunciation: 'マリ' },
                particle('の', '連体化'), { surface: 'なか', pos: '名詞', pos_detail_1: '非自立' }
            ]) },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-SYMBOL-MUTATION', suite: 'unit', rule: 'Changing a standalone Katakana ノ from particle analysis to symbol analysis cannot remove its grammatical output boundary when the source frame still supports that role', input: '東京 / ノ(symbol) / 空', expected: 'Toukyou no Sora', run: () => translateArtificialTokenisation('東京ノ空', [
                { surface: '東京', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', reading: 'トウキョウ', pronunciation: 'トーキョー' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '空', pos: '名詞', pos_detail_1: '一般', reading: 'ソラ', pronunciation: 'ソラ' }
            ]) },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-REVIEW-INVARIANCE', suite: 'unit', rule: 'A supported symbol-token mutation of grammatical Katakana ノ produces the same resolved review state as normal tokenisation after grammatical reconstruction', input: '東京 / ノ(symbol) / 夜 review', expected: 'Toukyou no Yoru:true:superseded', run: () => { const result = auditArtificialTokenisation('東京ノ夜', [
                { surface: '東京', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', reading: 'トウキョウ', pronunciation: 'トーキョー' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '夜', pos: '名詞', pos_detail_1: '一般', reading: 'ヨル', pronunciation: 'ヨル' }
            ]); const signal = result.audit?.redFlags?.find(item => item.flag === 'orthographic-particle-inferred'); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}:${signal?.state || ''}`; } },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-KUROMOJI-LEXICAL-SPAN', suite: 'unit', rule: 'A unique whole-word Kuromoji dictionary reading outranks a destructive symbol split through lexical Katakana ノ', input: '山 / ノ(symbol) / 手', expected: 'Yamanote', run: () => translateArtificialTokenisation('山ノ手', [
                { surface: '山', pos: '名詞', pos_detail_1: '一般', reading: 'ヤマ', pronunciation: 'ヤマ' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '手', pos: '名詞', pos_detail_1: '一般', reading: 'テ', pronunciation: 'テ' }
            ]) },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-COMMON-LEXICAL-SPAN', suite: 'unit', rule: 'Maintained whole-word evidence survives a destructive symbol split through lexical Katakana ノ', input: 'く / ノ(symbol) / 一', expected: 'Kunoichi', run: () => translateArtificialTokenisation('くノ一', [
                { surface: 'く', pos: '名詞', pos_detail_1: '一般', reading: 'ク', pronunciation: 'ク' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '一', pos: '名詞', pos_detail_1: '数', reading: 'イチ', pronunciation: 'イチ' }
            ]) },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-PROPER-NAME-SPAN', suite: 'unit', rule: 'Unique maintained proper-name evidence survives a destructive symbol split through lexical Katakana ノ', input: '石 / ノ(symbol) / 森', expected: 'Ishinomori', run: () => translateArtificialTokenisation('石ノ森', [
                { surface: '石', pos: '名詞', pos_detail_1: '一般', reading: 'イシ', pronunciation: 'イシ' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '森', pos: '名詞', pos_detail_1: '一般', reading: 'モリ', pronunciation: 'モリ' }
            ]) },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-LONG-PROPER-NAME-BOUNDARIES', suite: 'unit', rule: 'Repairing an internal symbol split in a longer proper name restores canonical analyser boundaries instead of collapsing unrelated name components', input: '石 / ノ(symbol) / 森章太郎', expected: 'Ishinomori Shoutarou', run: () => translateArtificialTokenisation('石ノ森章太郎', [
                { surface: '石', pos: '名詞', pos_detail_1: '一般', reading: 'イシ', pronunciation: 'イシ' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '森章太郎', pos: '名詞', pos_detail_1: '一般', reading: 'モリショウタロウ', pronunciation: 'モリショウタロウ' }
            ]) },
            { id: 'MECH-TOKENISATION-KATAKANA-NO-STATION-NAME-BOUNDARIES', suite: 'unit', rule: 'Whole-name evidence repairs Katakana ノ mutation while retaining the canonical suffix boundary behaviour of the name', input: '三 / ノ(symbol) / 宮駅', expected: 'Sannomiyaeki', run: () => translateArtificialTokenisation('三ノ宮駅', [
                { surface: '三', pos: '名詞', pos_detail_1: '数', reading: 'サン', pronunciation: 'サン' },
                { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
                { surface: '宮駅', pos: '名詞', pos_detail_1: '一般', reading: 'ミヤエキ', pronunciation: 'ミヤエキ' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-YOTSUBATO', suite: 'unit', rule: 'Reviewed title-boundary evidence remains authoritative even when an artificial tokenisation exposes particle-like kana', input: 'よ/つば/と/!', expected: 'Yotsuba to!', run: () => translateArtificialTokenisation('よつばと!', [particle('よ', '終助詞'), 'つば', particle('と', '並立助詞'), { surface: '!', pos: '記号' }]) },
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
            { id: 'MECH-TOKENISATION-MUTATION-VERB-COMPOUND-CONSENSUS', suite: 'unit', rule: 'A false split inside a lexical compound verb is repaired only when standalone Kuromoji and maintained lexical evidence agree on the complete verb span', input: '手紙を読み/返す', expected: 'Tegami o Yomikaesu:false', run: () => { const result = auditArtificialTokenisation('手紙を読み返す', [
                { surface: '手紙', pos: '名詞', pos_detail_1: '一般', reading: 'テガミ', pronunciation: 'テガミ' },
                { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
                { surface: '読み', pos: '動詞', pos_detail_1: '自立', basic_form: '読む', reading: 'ヨミ', pronunciation: 'ヨミ' },
                { surface: '返す', pos: '動詞', pos_detail_1: '自立', basic_form: '返す', reading: 'カエス', pronunciation: 'カエス' }
            ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
            { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-RECOVERY', suite: 'unit', rule: 'A noun-misparsed continuative stem is recovered before a reviewed productive compound-verb follower without depending on the original analyser POS', input: '本 / を / 読み(noun) / 直す', expected: 'Hon o Yominaosu:false', run: () => { const result = auditArtificialTokenisation('本を読み直す', [
                { surface: '本', pos: '名詞', pos_detail_1: '一般', reading: 'ホン', pronunciation: 'ホン' },
                { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
                { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
                { surface: '直す', pos: '動詞', pos_detail_1: '自立', basic_form: '直す', reading: 'ナオス', pronunciation: 'ナオス' }
            ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
            { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-FAMILY', suite: 'unit', rule: 'The same continuative-stem recovery applies to another attested verb stem before 直す', input: '手紙 / を / 書き(noun) / 直す', expected: 'Tegami o Kakinaosu:false', run: () => { const result = auditArtificialTokenisation('手紙を書き直す', [
                { surface: '手紙', pos: '名詞', pos_detail_1: '一般', reading: 'テガミ', pronunciation: 'テガミ' },
                { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
                { surface: '書き', pos: '名詞', pos_detail_1: '一般', reading: 'カキ', pronunciation: 'カキ' },
                { surface: '直す', pos: '動詞', pos_detail_1: '自立', basic_form: '直す', reading: 'ナオス', pronunciation: 'ナオス' }
            ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
            { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-DIFFERENT-FOLLOWER', suite: 'unit', rule: 'Continuative-stem recovery is evidence-based on the complete compound rather than hard-coded to one follower verb', input: '本 / を / 読み(noun) / 返す', expected: 'Hon o Yomikaesu:false', run: () => { const result = auditArtificialTokenisation('本を読み返す', [
                { surface: '本', pos: '名詞', pos_detail_1: '一般', reading: 'ホン', pronunciation: 'ホン' },
                { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
                { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
                { surface: '返す', pos: '動詞', pos_detail_1: '自立', basic_form: '返す', reading: 'カエス', pronunciation: 'カエス' }
            ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
            { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-LEXICAL-GUARD', suite: 'unit', rule: 'A noun-shaped stem is not joined to a following verb when the complete surface is not recognised as one lexical verb', input: '読み(noun) / 直る', expected: 'Yomi Naoru', run: () => translateArtificialTokenisation('読み直る', [
                { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
                { surface: '直る', pos: '動詞', pos_detail_1: '自立', basic_form: '直る', reading: 'ナオル', pronunciation: 'ナオル' }
            ]) },
            { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-WHITESPACE-GUARD', suite: 'unit', rule: 'Explicit source whitespace prevents continuative compound recovery even when the surrounding token shapes otherwise match', input: '読み /space/ 直す', expected: 'Yomi Naosu', run: () => translateArtificialTokenisation('読み 直す', [
                { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
                { surface: ' ', pos: '記号', pos_detail_1: '空白', reading: ' ', pronunciation: ' ' },
                { surface: '直す', pos: '動詞', pos_detail_1: '自立', basic_form: '直す', reading: 'ナオス', pronunciation: 'ナオス' }
            ]) },
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
            { id: 'MECH-TOKENISATION-MUTATION-UNKNOWN-TOKEN-SAFETY', suite: 'unit', rule: 'Unknown contiguous Katakana remains mechanically romanisable under an artificial split and retains boundary review instead of leaking Japanese or unresolved output', input: 'ヌヘ/モラ', expected: 'Nuhe Mora:true:false:false', run: () => { const result = auditArtificialTokenisation('ヌヘモラ', ['ヌヘ', 'モラ']); const output = result.output; return `${output}:${String(Boolean(result.audit?.requiresReview))}:${String(/[ぁ-ゖァ-ヶ一-龯]/u.test(output))}:${String(output.includes('[Unresolved]'))}`; } },
            { id: 'MECH-FINAL-OUTPUT-SOURCE-AUTHORITY-LATIN-CROSSING', suite: 'unit', rule: 'Structural diagnostics reject a Latin passthrough token that crosses the end of a high-confidence immutable source candidate', input: 'synthetic Pay! crossing reviewed ラインPay boundary', expected: 'latin-passthrough-erased-source-candidate-boundary', run: () => { const tokens = [{ surface_form: 'Pay!', sourceStart: 3, sourceEnd: 7, latinPassthroughMatched: true, readingResolution: { source: 'latin-source-passthrough' }, outputBoundaryBefore: 'space' }]; const candidates = [{ sourceStart: 0, sourceEnd: 6, sourceSurface: 'ラインPay', category: 'loanword', evidenceSource: 'source-language-loanword', romaji: 'LINE Pay', reading: null, confidence: 1, reviewRequired: false }]; return validateSourceSpanAuthorityPreservation(tokens, candidates).violations.map(item => item.reason).join('|'); } },
            { id: 'MECH-TOKENISATION-VARIANT-CANONICAL-SOURCE-SPAN-OWNERSHIP', suite: 'unit', rule: 'Canonical retokenisation of a supported name glyph variant retains its verified original source span instead of relocating the canonical glyph to a later matching source character', input: '先㠀諸島 source-span ownership', expected: 'true:1:2:㠀', run: () => { const audit = runTranslatorReadingAudit('先㠀諸島'); const reading = audit.readings.find(item => (item.semanticAnnotationOwnership || []).some(owner => owner?.sourceSurface === '㠀' && (owner?.annotations || []).includes('variantCanonicalRetokenized'))); return `${String(Boolean(audit.structuralValidation?.valid))}:${reading?.sourceStart ?? ''}:${reading?.sourceEnd ?? ''}:${reading?.sourceSurface || ''}`; } },
            { id: 'MECH-FINAL-OUTPUT-SOURCE-AUTHORITY-OVERSIZED-TOKEN', suite: 'unit', rule: 'Structural diagnostics reject a final token that still buries an immutable reviewed boundary inside an oversized tokenizer span', input: 'synthetic グレンラガンフィギュア crossing reviewed-name/loanword boundary', expected: 'immutable-source-authority-boundary-erased', run: () => { const tokens = [{ surface_form: 'グレンラガンフィギュア', sourceStart: 0, sourceEnd: 11, outputBoundaryBefore: 'none' }]; const candidates = [{ sourceStart: 0, sourceEnd: 6, sourceSurface: 'グレンラガン', category: 'name', kind: 'reviewed-name', evidenceSource: 'reviewed-proper-name-span', romaji: 'Gurren Lagann', reading: 'ぐれんらがん', confidence: 1, reviewRequired: false, metadata: { priority: 100 } }, { sourceStart: 6, sourceEnd: 11, sourceSurface: 'フィギュア', category: 'loanword', kind: 'loanword', evidenceSource: 'source-language-loanword', romaji: 'Figure', reading: null, confidence: 1, reviewRequired: false, metadata: { priority: 90 } }]; return validateSourceSpanAuthorityPreservation(tokens, candidates).violations.map(item => item.reason).join('|'); } },
            { id: 'MECH-FINAL-OUTPUT-VALIDATOR-CONTROL', suite: 'unit', rule: 'Final structural validation accepts a coherent token stream whose recorded spaces agree with the boundary classifier and rendered Romaji', input: 'synthetic 雪 / 降る boundary control', expected: 'true:0', run: () => { const tokens = [
                { surface_form: '雪', pos: '名詞', value: 'Yuki', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
                { surface_form: '降る', pos: '動詞', value: 'furu', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'space' }
            ]; const result = validateFinalOutputEvidenceConsistency(tokens, 'Yuki Furu', '雪降る'); return `${String(result.valid)}:${result.violations.length}`; } },
            { id: 'MECH-FINAL-OUTPUT-VALIDATOR-MISSING-PROVENANCE', suite: 'unit', rule: 'Final structural validation rejects a token whose output boundary was rendered without recorded boundary provenance', input: 'synthetic 光 / 差す missing provenance', expected: 'missing-boundary-provenance', run: () => { const tokens = [
                { surface_form: '光', pos: '名詞', value: 'Hikari', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
                { surface_form: '差す', pos: '動詞', value: 'sasu', readingResolution: { source: 'kuromoji-context' } }
            ]; return validateFinalOutputEvidenceConsistency(tokens, 'Hikari Sasu', '光差す').violations.map(item => item.reason).join('|'); } },
            { id: 'MECH-FINAL-OUTPUT-VALIDATOR-JOIN-CONTRADICTION', suite: 'unit', rule: 'Final structural validation rejects a rendered space when lexical/morphological join evidence requires attachment', input: 'synthetic 読み / 返す join contradiction', expected: 'boundary-metadata-contradiction|join-evidence-rendered-separate', run: () => { const tokens = [
                { surface_form: '読み', pos: '動詞', value: 'Yomi', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
                { surface_form: '返す', pos: '動詞', value: 'kaesu', readingResolution: { source: 'kuromoji-context' }, morphologicalJoinLeft: true, morphologicalJoinReason: 'compound-verb', morphologicalJoinAuthority: 'lexical-compound', outputBoundaryBefore: 'space' }
            ]; return validateFinalOutputEvidenceConsistency(tokens, 'Yomi Kaesu', '読み返す').violations.map(item => item.reason).sort().join('|'); } },
            { id: 'MECH-FINAL-OUTPUT-VALIDATOR-SEPARATION-CONTRADICTION', suite: 'unit', rule: 'Final structural validation rejects a join that contradicts an explicit reviewed separation boundary', input: 'synthetic 学校 / 生活 reviewed separation', expected: 'reviewed-separate-boundary-rendered-joined', run: () => { const tokens = [
                { surface_form: '学校', pos: '名詞', value: 'Gakkou', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
                { surface_form: '生活', pos: '名詞', value: 'seikatsu', readingResolution: { source: 'kuromoji-context' }, reviewedLexicalBoundaryBefore: true, outputBoundaryBefore: 'join' }
            ]; return validateFinalOutputEvidenceConsistency(tokens).violations.filter(item => item.reason === 'reviewed-separate-boundary-rendered-joined').map(item => item.reason).join('|'); } },
            { id: 'MECH-FINAL-OUTPUT-VALIDATOR-RENDERED-OUTPUT', suite: 'unit', rule: 'Final structural validation independently rejects final Romaji whose actual spacing no longer matches a coherent boundary-provenance stream', input: 'synthetic 星 / 光る output mutation', expected: 'rendered-output-contradiction', run: () => { const tokens = [
                { surface_form: '星', pos: '名詞', value: 'Hoshi', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
                { surface_form: '光る', pos: '動詞', value: 'hikaru', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'space' }
            ]; return validateFinalOutputEvidenceConsistency(tokens, 'HoshiHikaru', '星光る').violations.map(item => item.reason).join('|'); } },
            { id: 'MECH-FINAL-OUTPUT-KATAKANA-SYMBOL-BOUNDARY', suite: 'unit', rule: 'Final diagnostics and emitted Romaji agree on the explicit space before a recovered Katakana ノ particle even when the tokenizer originally labelled it as a symbol', input: '東京ノ空 output provenance', expected: 'Toukyou no Sora:space:particle-boundary:grammar', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('東京ノ空'); const reading = runtimeState.lastTranslationDiagnostics?.readings?.find(item => item.sourceSurface === 'ノ'); return `${output}:${reading?.outputBoundaryBefore || ''}:${reading?.outputBoundaryReason || ''}:${reading?.outputBoundaryAuthority || ''}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-FINAL-OUTPUT-VALIDATOR-SYMBOL-BOUNDARY-CONTRADICTION', suite: 'unit', rule: 'The final verifier reconstructs output independently from recorded boundary provenance so a renderer shortcut cannot silently discard an explicit space', input: 'synthetic 東京 / ノ renderer bypass', expected: 'rendered-output-contradiction', run: () => { const tokens = [
                { surface_form: '東京', value: 'Toukyou', pos: '名詞', outputBoundaryBefore: 'none' },
                { surface_form: 'ノ', value: 'no', pos: '助詞', particle: true, grammatical: true, outputBoundaryBefore: 'space' }
            ]; const result = validateFinalOutputEvidenceConsistency(tokens, 'Toukyouno', '東京ノ'); return result.violations.map(item => item.reason).includes('rendered-output-contradiction') ? 'rendered-output-contradiction' : result.violations.map(item => item.reason).join('|'); } }
        ];
    }

    function getNumbersAndCountersRegressionChecks() {
        return [
            { id: 'MECH-REVIEW-PRODUCTIVE-COUNTER-ROLE-SUPERSESSION-LIFECYCLE', suite: 'unit', rule: 'A productive counter suffix following a structural numeral may supersede only the lexical ambiguity signals that conflict with its resolved counter role, while preserving unrelated review state on the numeral', input: '万人 productive-counter audit', expected: 'Mannin:general-word-conflict:superseded:resolved-productive-counter-role:false', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('万人'); const reading = runtimeState.lastTranslationDiagnostics?.readings?.find(item => item.surface === '人'); const signal = (reading?.reviewSignals || []).find(item => item.flag === 'general-word-conflict'); return `${output}:${signal?.flag || ''}:${signal?.state || ''}:${signal?.supersededBy || ''}:${String(Boolean(signal?.requiresReview))}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'SCHEMA-REVIEWED-READING-NUMERIC-METADATA-PAIRED', suite: 'unit', rule: 'Reviewed numeric reading metadata must carry its canonical numeric form and semantic role together rather than partially asserting numeric authority', input: 'numericRole without numericCanonical', expected: 'rejected', run: () => { try { validateAssetSchema('reviewedReadingEvidence', { version: 1, preferences: [{ surface: '壱', reading: 'いち', alternatives: ['ひと'], numericRole: 'numeral' }], spans: [] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-COUNTER-DATE-ALIASES-UNIQUE', suite: 'unit', rule: 'Counter/date evidence accepts distinct orthographic aliases only when each lookup key has one reviewed role', input: '一分 / １分', expected: 'accepted', run: () => { try { validateAssetSchema('counterDateEvidence', [{ surface: '一分', aliases: ['１分'], reading: 'いっぷん', romaji: 'Ippun', role: 'minute-counter', unit: '分' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-COUNTER-DATE-ALIAS-COLLISION-REJECT', suite: 'unit', rule: 'One counter/date alias cannot silently select two different readings or semantic roles', input: 'shared alias collision', expected: 'rejected', run: () => { try { validateAssetSchema('counterDateEvidence', [{ surface: '一分', aliases: ['共有'], reading: 'いっぷん', romaji: 'Ippun', role: 'minute-counter', unit: '分' }, { surface: '一月', aliases: ['共有'], reading: 'いちがつ', romaji: 'Ichigatsu', role: 'calendar-month', unit: '月' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-COUNTER-DATE-SURFACE-ALIAS-COLLISION-REJECT', suite: 'unit', rule: 'A counter/date alias cannot shadow another row\'s canonical surface even when the data remains valid JSON', input: 'surface/alias collision', expected: 'rejected', run: () => { try { validateAssetSchema('counterDateEvidence', [{ surface: '一分', aliases: ['一月'], reading: 'いっぷん', romaji: 'Ippun', role: 'minute-counter', unit: '分' }, { surface: '一月', reading: 'いちがつ', romaji: 'Ichigatsu', role: 'calendar-month', unit: '月' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'MECH-NUMERIC-ROLE-EVIDENCE-TYPED', suite: 'unit', rule: 'Reviewed counter/date evidence carries an explicit semantic role and unit instead of acting as generic pronunciation authority', input: '十分 evidence', expected: 'minute-counter:分', run: () => { const entry = runtimeState.counterDateReadingDictionary.get('十分'); return `${entry?.role || ''}:${entry?.unit || ''}`; } },
            { id: 'MECH-NUMERIC-ROLE-SELECTION-PRECEDES-READING', suite: 'unit', rule: 'Minute structure selects the minute-counter role before any role-specific pronunciation is generated', input: '十五分待つ role stage', expected: 'minute-counter:false', run: () => { const source = '十五分待つ'; const base = attachSourceTokenSpans(splitStructuredNumericUnitTokens(runtimeState.tokenizer.tokenize(source)), source); const candidates = discoverSourceSpanCandidates(source, base, {}); const marked = markTypedMinuteCounterRoleTokens(base, candidates); const first = marked[0] || {}; return `${first.typedNumericRole || ''}:${Boolean(first.typedNumericExpressionMatched)}`; } },
            { id: 'MECH-NUMERIC-ROLE-READING-AFTER-SELECTION', suite: 'unit', rule: 'Minute pronunciation is generated only after a minute-counter role has already been selected for the owning source span', input: '十五分待つ reading stage', expected: 'minute-counter:じゅうごふん', run: () => { const source = '十五分待つ'; const base = attachSourceTokenSpans(splitStructuredNumericUnitTokens(runtimeState.tokenizer.tokenize(source)), source); const candidates = discoverSourceSpanCandidates(source, base, {}); const marked = markTypedMinuteCounterRoleTokens(base, candidates); const resolved = applyTypedNumericRoleReadings(marked); const first = resolved[0] || {}; return `${first.typedNumericExpressionType || ''}:${first.typedNumericReading || ''}`; } },
            { id: 'MECH-NUMERIC-ROLE-SAHEN-LEXICAL-THREE', suite: 'engine', rule: 'Reviewed サ変 lexical evidence for 三分 suppresses the minute-counter role only when the following verb is する', input: '三分する', expected: 'Sanbun Suru', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-SAHEN-LEXICAL-FOUR', suite: 'engine', rule: 'Reviewed サ変 lexical evidence for 四分 selects しぶん rather than the productive four-minute reading', input: '四分する', expected: 'Shibun Suru', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-SAHEN-INFLECTED-THREE', suite: 'engine', rule: 'The contextual 三分 lexical reading remains valid with an inflected する form', input: '三分した', expected: 'Sanbun Shita', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-SAHEN-INFLECTED-FOUR', suite: 'engine', rule: 'The contextual 四分 lexical reading remains valid with an inflected する form', input: '四分して', expected: 'Shibun Shite', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-SAHEN-MINUTE-CONTROL-THREE', suite: 'engine', rule: 'The 三分 lexical サ変 reading must not leak into an ordinary minute-counter context', input: '三分待つ', expected: 'Sanpun Matsu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-SAHEN-MINUTE-CONTROL-FOUR', suite: 'engine', rule: 'The 四分 lexical サ変 reading must not leak into an ordinary minute-counter context', input: '四分待つ', expected: 'Yonpun Matsu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-AMBIGUOUS-JUUBUN', suite: 'engine', rule: 'Standalone 十分 cannot use the minute pronunciation as proof of the minute role while an attested incompatible lexical reading remains viable', input: '十分', expectedAny: ['Juubun', 'Juppun'], expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-AMBIGUOUS-JUUNIBUN', suite: 'engine', rule: 'Standalone 十二分 remains reviewable because the lexical item and productive twelve-minute interpretation are both viable without resolving context', input: '十二分', expectedAny: ['Juunibun', 'Juunifun'], expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-JUUBUN-WAIT-AMBIGUOUS', suite: 'engine', rule: '十分 before 待つ remains reviewable because both the lexical sufficiently/enough reading and the ten-minute reading are viable from the written sentence alone', input: '十分待つ', expectedAny: ['Juubun Matsu', 'Juppun Matsu'], expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-CLEAR-MINUTE', suite: 'engine', rule: 'A structurally established minute expression applies minute morphology after role selection without inheriting lexical-span uncertainty', input: '十五分待つ', expected: 'Juugofun Matsu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-CLEAR-CLOCK', suite: 'engine', rule: 'Reviewed irregular clock pronunciation activates only after the clock-hour role has been structurally established', input: '九時五分', expected: 'Kuji Gofun', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-TRANSPARENT-WRAPPER-MERIDIEM-HOUR', suite: 'engine', rule: 'A transparent quotation wrapper around a clock hour does not hide an independently sufficient 午前/午後 clock-role context', input: '午前「一時」', expected: 'Gozen "Ichiji"', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-HARD-BOUNDARY-MERIDIEM-HOUR-GUARD', suite: 'engine', rule: 'A hard sentence boundary still blocks 午前/午後 from establishing the role of a following quoted 一時', input: '午前。「一時」', expected: 'Gozen. "Ichiji"', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-TRANSPARENT-WRAPPER-CLOCK-MINUTE', suite: 'engine', rule: 'A transparent wrapper around an ambiguous minute span does not hide the selected preceding clock-hour structure', input: '三時「十分」', expected: 'Sanji "Juppun"', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-HARD-BOUNDARY-CLOCK-MINUTE-GUARD', suite: 'engine', rule: 'A hard boundary prevents a preceding clock hour from resolving a following quoted 十分 minute/lexical ambiguity', input: '三時。「十分」', expectedAny: ['Sanji. "Juubun"', 'Sanji. "Juppun"'], expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-TRANSPARENT-WRAPPER-JUUBUN-LEXICAL-GUARD', suite: 'engine', rule: 'A wrapper alone does not turn ambiguous 十分 before 待つ into a minute expression when no independent clock structure exists', input: '「十分」待つ', expectedAny: ['"Juubun" Matsu', '"Juppun" Matsu'], expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-LARGER-LEXICAL-GUARD', suite: 'engine', rule: 'A smaller counter candidate cannot consume a larger attested lexical span merely because counter pronunciation evidence exists', input: '八分音符', expectedAny: ['Hachibuonpu', "Hachibun'onpu"], expectedRequiresReview: false },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-CANDIDATE', suite: 'unit', rule: 'A written Japanese fraction is discovered as an explicit source-span structure before output segmentation is applied', input: '四分の三', expected: 'fraction:0:4', run: () => { const source = '四分の三'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidate = discoverSourceSpanCandidates(source, tokens, {}).find(item => item.kind === 'fraction-structure'); return `${candidate?.semanticRole || ''}:${candidate?.sourceStart}:${candidate?.sourceEnd}`; } },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-OVERSIZED-TOKEN', suite: 'unit', rule: 'Fraction output structure remains tokenizer-independent when one oversized analyser token crosses every denominator, unit, connector and numerator boundary', input: '三分の一 as one oversized token', expected: '三|分|の|一', run: () => { const source = '三分の一'; const token = { surface_form: source, sourceStart: 0, sourceEnd: source.length, sourceSurface: source, reading: '*', pronunciation: '*', pos: '名詞', pos_detail_1: '一般' }; const candidate = { sourceStart: 0, sourceEnd: source.length, sourceSurface: source, kind: 'fraction-structure', semanticRole: 'fraction' }; return applyStructuredFractionOutputTokens([token], [candidate]).map(item => item.surface_form).join('|'); } },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-SEGMENT', suite: 'unit', rule: 'Fraction structure decomposes a tokenizer-owned 分の span into a denominator unit and grammatical connector without changing source coverage', input: '三分の一 structural tokens', expected: '三|分|の|一:denominator-unit:connector', run: () => { const source = '三分の一'; const base = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidates = discoverSourceSpanCandidates(source, base, {}); const tokens = attachSourceTokenSpans(applyStructuredFractionOutputTokens(base, candidates), source); return `${tokens.map(item => item.surface_form).join('|')}:${tokens.find(item => item.surface_form === '分')?.structuredFractionRole || ''}:${tokens.find(item => item.surface_form === 'の')?.structuredFractionRole || ''}`; } },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-THIRD', suite: 'engine', rule: 'Fraction reading and output structure remain separate so grammatical の is emitted as its own lowercase unit', input: '三分の一', expected: 'Sanbun no Ichi', expectedRequiresReview: false },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-QUARTERS', suite: 'engine', rule: 'The structural fraction rule generalises beyond the original denominator while preserving the attested 分 reading', input: '四分の三', expected: 'Yonbun no San', expectedRequiresReview: false },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-PERCENT', suite: 'engine', rule: 'Larger fraction denominators retain numeric composition while separating the grammatical connector at output', input: '百分の一', expected: 'Hyakubun no Ichi', expectedRequiresReview: false },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-MULTIDIGIT', suite: 'engine', rule: 'Multi-character denominators and numerators keep their selected fraction role without inheriting unrelated contextless numeral ambiguity', input: '十二分の五', expected: 'Juunibun no Go', expectedRequiresReview: false },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-CONTEXT', suite: 'engine', rule: 'Fraction output structure composes with an ordinary preceding genitive without merging either grammatical の boundary', input: '全体の三分の一', expected: 'Zentai no Sanbun no Ichi', expectedRequiresReview: false },
            { id: 'MECH-OUTPUT-STRUCTURE-NONFRACTION-GUARD', suite: 'unit', rule: 'A numeral-plus-minute phrase followed by nonnumeric material is not falsely classified as a fraction merely because 分の is tokenised together', input: '三分の時間', expected: 'false', run: () => { const source = '三分の時間'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.kind === 'fraction-structure')); } },
            { id: 'MECH-OUTPUT-STRUCTURE-FRACTION-SOURCE-INTEGRITY', suite: 'unit', rule: 'Fraction segmentation retains an exact ordered partition of the immutable Japanese source span', input: '二分の一 source integrity', expected: 'true:0', run: () => { const source = '二分の一'; const base = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const candidates = discoverSourceSpanCandidates(source, base, {}); const tokens = attachSourceTokenSpans(applyStructuredFractionOutputTokens(base, candidates), source); const result = validateSourceTokenIntegrity(tokens, source, { requireFullCoverage: true }); return `${result.valid}:${result.violations.length}`; } },
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
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ASCII-DURATION', suite: 'engine', rule: 'Arabic 1日 enters the same one-day role arbitration as 一日 and selects the duration reading in ordinary predicate context', input: '1日休む', expected: 'Ichinichi Yasumu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ASCII-FREQUENCY', suite: 'engine', rule: 'Arabic 1日 selects the duration role before a structurally recognised frequency counter while regular source digits retain their written form', input: '1日に3回読む', expected: 'Ichinichi ni 3kai Yomu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-TRANSPARENT-WRAPPER-FREQUENCY', suite: 'engine', rule: 'A transparent wrapper around 1日 does not hide the following に + frequency-counter structure that establishes the duration-day role', input: '「1日」に3回読む', expected: '"Ichinichi" ni 3kai Yomu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-HARD-BOUNDARY-FREQUENCY-GUARD', suite: 'engine', rule: 'A hard sentence boundary prevents a later に + frequency counter from reaching back across punctuation to resolve quoted 1日', input: '「1日」。に3回読む', expected: '"Tsuitachi". ni 3kai Yomu', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-AMOUNT', suite: 'engine', rule: 'A following amount suffix establishes duration-day semantics for 1日 rather than a calendar date', input: '1日分', expected: 'Ichinichibun', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-DE-PREDICATE', suite: 'engine', rule: 'The time-span frame 1日で plus predicate selects the one-day duration reading', input: '1日で終わる', expected: 'Ichinichi de Owaru', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ALL-DAY-ASCII', suite: 'engine', rule: 'Arabic 1日 shares the typed temporal-head reading used by 一日 inside the all-day span 1日中', input: '1日中本を読む', expected: 'Ichinichijuu Hon o Yomu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ASCII-AMBIGUOUS-LIMIT', suite: 'engine', rule: '限定 alone does not prove whether isolated 1日 means one day or the first day of a month, so the provisional calendar reading remains review-required', input: '1日限定', expected: 'Tsuitachi Gentei', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-MONTH-CONTROL-ASCII', suite: 'engine', rule: 'An explicit month immediately before Arabic 1日 establishes the first-of-month calendar role', input: '4月1日限定', expected: 'Shigatsu Tsuitachi Gentei', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-TRANSPARENT-WRAPPER-MONTH', suite: 'engine', rule: 'A transparent wrapper around Arabic 1日 does not hide an explicit preceding month that establishes the calendar-date role', input: '4月「1日」', expected: 'Shigatsu "Tsuitachi"', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-HARD-BOUNDARY-MONTH-GUARD', suite: 'engine', rule: 'A hard sentence boundary prevents a preceding month from resolving a following quoted 1日 role', input: '4月。「1日」', expected: 'Shigatsu. "Tsuitachi"', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-RECURRING-MONTH-CONTROL', suite: 'engine', rule: '毎月 immediately before Arabic 1日 establishes a recurring first-of-month calendar role', input: '毎月1日限定', expected: 'Maitsuki Tsuitachi Gentei', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ASCII-BARE-AMBIGUOUS', suite: 'engine', rule: 'Bare Arabic 1日 carries the same unresolved calendar-date versus duration-day review state as bare 一日', input: '1日', expected: 'Tsuitachi', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ORDINAL-KANJI', suite: 'engine', rule: 'The ordinal suffix 目 establishes a counted-day role, so isolated 一日目 uses いちにち rather than the first-of-month reading', input: '一日目', expected: 'Ichinichime', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-ORDINAL-ASCII', suite: 'engine', rule: 'Arabic 1日目 enters the same counted-day ordinal role as 一日目', input: '1日目', expected: 'Ichinichime', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-OFFSET-AFTER', suite: 'engine', rule: 'A following 後 establishes a one-day temporal offset and selects いちにち outside explicit calendar-date context', input: '一日後', expected: 'Ichinichigo', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-OFFSET-BEFORE-ASCII', suite: 'engine', rule: 'Arabic 1日前 uses the same one-day temporal-offset role as the kanji form', input: '1日前', expected: 'Ichinichi Mae', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-INTERVAL-BURI', suite: 'engine', rule: 'The interval suffix ぶり establishes elapsed one-day semantics rather than a calendar date', input: '一日ぶり', expected: 'Ichinichiburi', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-HALF-DURATION', suite: 'engine', rule: 'A following 半 establishes a duration amount, so standalone 1日半 uses the one-day duration reading', input: '1日半', expected: 'Ichinichi Han', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-ONE-DAY-OFFSET-MONTH-CONTROL', suite: 'engine', rule: 'An explicit month predecessor remains stronger calendar evidence even when 後 follows the date', input: '4月1日後', expected: 'Shigatsu Tsuitachigo', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-IRREGULAR-KANJI', suite: 'engine', rule: 'An explicit 日間 duration uses the established irregular day-count reading instead of mechanically combining the numeral with にち', input: '二日間', expected: 'Futsukakan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-IRREGULAR-ASCII', suite: 'engine', rule: 'Arabic digits enter the same explicit day-duration structure when reviewed day-count evidence establishes an irregular reading', input: '7日間', expected: 'Nanokakan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-IRREGULAR-FULLWIDTH', suite: 'engine', rule: 'Full-width digits use the same reviewed day-duration evidence as their ASCII numeric alias', input: '７日間', expected: 'Nanokakan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-IRREGULAR-MULTIDIGIT', suite: 'engine', rule: 'A multi-digit irregular day count remains one duration span and applies the reviewed 十四日 reading before 間', input: '十四日間', expected: 'Juuyokkakan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-HATSUKA', suite: 'engine', rule: 'The established 二十日 day-count reading is preserved inside an explicit duration span', input: '二十日間', expected: 'Hatsukakan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-NIJUUYOKKA', suite: 'engine', rule: 'The reviewed 二十四日 reading remains authoritative inside an explicit duration span', input: '二十四日間', expected: 'Nijuuyokkakan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-REGULAR-ELEVEN-CONTROL', suite: 'engine', rule: 'The irregular-day repair does not decompose a regular eleven-day duration into 十 plus 一日間', input: '十一日間', expected: 'Juuichinichikan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-REGULAR-TWELVE-CONTROL', suite: 'engine', rule: 'The irregular-day repair leaves an ordinary twelve-day duration on the regular にち path', input: '十二日間', expected: 'Juuninichikan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-REGULAR-ASCII-CONTROL', suite: 'engine', rule: 'A regular Arabic-digit day duration retains the established source-digit rendering rather than being expanded by the irregular-day rule', input: '11日間', expected: '11nichikan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-DATE-CONTROL', suite: 'engine', rule: 'The explicit-duration repair does not alter the same irregular day reading inside a calendar date', input: '4月7日', expected: 'Shigatsu Nanoka', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-LEXICAL-CONTROL', suite: 'engine', rule: 'A lexical compound beginning with an irregular day surface is unaffected unless the explicit 日間 duration structure is present', input: '二日月', expected: 'Futsukazuki', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-SPLIT-IRREGULAR', suite: 'unit', rule: 'Irregular day-duration evidence survives a tokenizer split inside a multi-digit day count', input: '十 + 四日間', expected: '十四日間:じゅうよっかかん', run: () => { const source = '十四日間'; const tokens = [{ surface_form: '十', sourceStart: 0, sourceEnd: 1, sourceSurface: '十', pos: '名詞', pos_detail_1: '数', pos_detail_2: '*' }, { surface_form: '四日間', sourceStart: 1, sourceEnd: 4, sourceSurface: '四日間', pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*' }]; const marked = markTypedDayDurationSpanTokens(tokens); const first = marked[0] || {}; return `${first.surface_form || ''}:${first.typedTemporalReading || ''}`; } },
            { id: 'MECH-NUMERIC-ROLE-DAY-DURATION-SPLIT-REGULAR-GUARD', suite: 'unit', rule: 'A nested one-day surface inside a larger regular numeral is not misclassified as an independent irregular duration', input: '十 + 一日間', expected: '十|一日間', run: () => { const tokens = [{ surface_form: '十', sourceStart: 0, sourceEnd: 1, sourceSurface: '十', pos: '名詞', pos_detail_1: '数', pos_detail_2: '*' }, { surface_form: '一日間', sourceStart: 1, sourceEnd: 4, sourceSurface: '一日間', pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*' }]; return markTypedDayDurationSpanTokens(tokens).map(token => token.surface_form).join('|'); } },
            { id: 'MECH-COUNTER-TAIL-EVIDENCE-FLAG', suite: 'unit', rule: 'Reviewed counter evidence explicitly declares when an attested allomorph may propagate as the final tail of a larger Kanji count', input: '一回 numericTail', expected: 'true', run: () => String(Boolean(runtimeState.counterDateReadingDictionary.get('一回')?.numericTail)) },
            { id: 'MECH-COUNTER-TAIL-MULTIDIGIT-IKKAI', suite: 'engine', rule: 'A reviewed 一回 tail remains authoritative inside a larger Kanji count instead of reverting to いちかい', input: '十一回', expected: 'Juuikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-ORDINAL-IKKAI', suite: 'engine', rule: 'The same reviewed counter tail composes with a 第-prefixed ordinal without losing the sokuon', input: '第十一回', expected: 'Daijuuikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-MULTIDIGIT-ROKKAI', suite: 'engine', rule: 'Reviewed 六回 evidence remains the final counter tail inside a larger Kanji numeral', input: '十六回', expected: 'Juurokkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-TENS-JUKKAI', suite: 'engine', rule: 'Reviewed 十回 evidence may supply the final tens counter allomorph when no exact whole-counter exception owns the full span', input: '二十回', expected: 'Nijukkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-BOOKS', suite: 'engine', rule: 'The numeric-tail contract is counter-family evidence rather than a 回-only patch', input: '十一冊', expected: 'Juuissatsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-BOOKS-ORDINAL', suite: 'engine', rule: 'Reviewed 冊 counter morphology also survives 第-prefixed ordinal composition', input: '第一冊', expected: 'Daiissatsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-CHAPTER', suite: 'engine', rule: 'Reviewed 一章 counter evidence preserves the sokuon when embedded after a larger Kanji numeral', input: '十一章', expected: 'Juuisshou', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-CHAPTER-ORDINAL', suite: 'engine', rule: 'A 第-prefixed chapter number composes with the reviewed 一章 tail', input: '第一章', expected: 'Daiisshou', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-SECTION', suite: 'engine', rule: 'Reviewed 一節 evidence preserves its sokuon inside a larger section count', input: '十一節', expected: 'Juuissetsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-SECTION-ORDINAL', suite: 'engine', rule: 'A 第-prefixed section number composes with the reviewed 一節 tail', input: '第一節', expected: 'Daiissetsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-VOLUME-STANDALONE', suite: 'engine', rule: 'Reviewed volume-counter evidence corrects the standalone 一巻 reading before larger-span composition is attempted', input: '一巻', expected: 'Ikkan', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-VOLUME', suite: 'engine', rule: 'Reviewed 一巻 evidence remains the final allomorphic tail in a larger volume count', input: '十一巻', expected: 'Juuikkan', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-VOLUME-ORDINAL', suite: 'engine', rule: 'A 第-prefixed volume ordinal composes with the reviewed 一巻 tail', input: '第一巻', expected: 'Daiikkan', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-PERSON-SUPPLETION-GUARD', suite: 'engine', rule: 'Suppletive 一人 evidence is not treated as a reusable final tail inside larger person counts', input: '十一人', expected: 'Juuichinin', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HATACHI-WHOLE-GUARD', suite: 'engine', rule: 'An exact reviewed whole-counter exception remains stronger than a reusable 十歳 tail', input: '二十歳', expected: 'Hatachi', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-EVIDENCE', suite: 'unit', rule: 'Hundred-boundary counter sound changes require explicit reviewed counter-family evidence', input: '百回 hundredTailReading', expected: 'っかい', run: () => String(runtimeState.counterDateReadingDictionary.get('百回')?.hundredTailReading || '') },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-GUARD', suite: 'engine', rule: 'Reviewed 回 evidence applies the attested 百 boundary sound change without relying on a generic counter heuristic', input: '百回', expected: 'Hyakkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-MULTIPLE-K', suite: 'engine', rule: 'The 百 boundary tail preserves the independently resolved irregular hundred numeral inside a larger count', input: '三百回', expected: 'Sanbyakkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-KO', suite: 'engine', rule: 'Reviewed 個 evidence applies its 百 boundary sound change', input: '百個', expected: 'Hyakko', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-HIKI', suite: 'engine', rule: 'Reviewed 匹 evidence applies its 百 boundary sound change', input: '百匹', expected: 'Hyappiki', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-HON', suite: 'engine', rule: 'Reviewed 本 evidence applies its selected 百 boundary reading', input: '百本', expected: 'Hyappon', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-FLOOR', suite: 'engine', rule: 'Reviewed 階 evidence applies its 百 boundary sound change independently from 回', input: '百階', expected: 'Hyakkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-HAI', suite: 'engine', rule: 'Reviewed 杯 evidence applies its 百 boundary sound change', input: '百杯', expected: 'Hyappai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-KAN', suite: 'engine', rule: 'Reviewed 巻 evidence applies its 百 boundary sound change', input: '百巻', expected: 'Hyakkan', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-SATSU-GUARD', suite: 'engine', rule: '冊 has no reviewed 百 contraction and therefore retains hyaku', input: '百冊', expected: 'Hyakusatsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-SAI-GUARD', suite: 'engine', rule: '歳 has no reviewed 百 contraction and therefore retains hyaku', input: '百歳', expected: 'Hyakusai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-SHOU-GUARD', suite: 'engine', rule: '章 has no reviewed 百 contraction and therefore retains hyaku', input: '百章', expected: 'Hyakushou', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-SETSU-GUARD', suite: 'engine', rule: '節 has no reviewed 百 contraction and therefore retains hyaku', input: '百節', expected: 'Hyakusetsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-PERSON-GUARD', suite: 'engine', rule: '人 remains on its ordinary hundred-counter path', input: '百人', expected: 'Hyakunin', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-HUNDRED-STORY-GUARD', suite: 'engine', rule: '話 remains on its ordinary hundred-counter path', input: '百話', expected: 'Hyakuwa', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-STORY-GUARD', suite: 'engine', rule: 'A serial unit without a declared allomorphic tail is not rewritten by the embedded-counter mechanism', input: '十一話', expected: 'Juuichiwa', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-DIGIT-PRESERVATION-GUARD', suite: 'engine', rule: 'Larger Arabic-digit counters preserve the existing source-digit policy unless an exact reviewed whole form exists', input: '11回', expected: '11kai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-NUMERIC-COMPONENT-HUNDRED', suite: 'engine', rule: 'A reviewed irregular hundred numeral remains intact when it precedes a reusable counter tail inside a larger Kanji count', input: '三百一回', expected: 'Sanbyaku Ikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-NUMERIC-COMPONENT-SIX-HUNDRED', suite: 'engine', rule: 'Reviewed 六百 pronunciation composes with a following reviewed counter tail instead of reverting to the tokenizer regular hyaku form', input: '六百六回', expected: 'Roppyaku Rokkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-NUMERIC-COMPONENT-THOUSAND', suite: 'engine', rule: 'Reviewed irregular 千 components remain authoritative when a larger Kanji count is assembled around an embedded counter tail', input: '三千一回', expected: 'Sanzen Ikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-RULE0-GROUPING-LARGE', suite: 'engine', rule: 'Embedded counter-tail composition preserves Rule-0 spaces between completed numeric groups and only composes the final lower-value group with the counter', input: '一万三千六百八十一回', expected: 'Ichiman Sanzen Roppyaku Hachijuuikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-RULE0-GROUPING-BOOKS', suite: 'engine', rule: 'Rule-0 numeric grouping remains intact for another reusable counter-tail family', input: '一万三千六百八十一冊', expected: 'Ichiman Sanzen Roppyaku Hachijuuissatsu', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-RULE0-GROUPING-HUNDRED', suite: 'engine', rule: 'A completed 百 group remains separate from a following lower-value counter tail', input: '百一回', expected: 'Hyaku Ikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-RULE0-GROUPING-ORDINAL', suite: 'engine', rule: 'A 第 prefix remains attached to the first numeric group while later Rule-0 numeric groups remain separated', input: '第三百一回', expected: 'Daisanbyaku Ikkai', expectedRequiresReview: false },
            { id: 'MECH-COUNTER-TAIL-RULE0-GROUPING-CONTROL', suite: 'engine', rule: 'A small counter expression with no completed higher-value group remains compact', input: '二十一回', expected: 'Nijuuikkai', expectedRequiresReview: false },
            { id: 'CTX-MINUTE-WHOLE-NUMERAL-SPAN', suite: 'engine', rule: 'Minute analysis consumes the complete numeral span plus 分 so regular multi-digit minute readings do not split or fall back lexically', input: '十五分待つ', expected: 'Juugofun Matsu', expectedRequiresReview: false },
            { id: 'CTX-MINUTE-ONBIN-MULTIDIGIT', suite: 'engine', rule: 'Whole-span minute analysis preserves counter sound change after a multi-digit numeral instead of inserting an output boundary', input: '二十一分待つ', expected: 'Nijuuippun Matsu', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-SOKUON', suite: 'engine', rule: 'An explicit 分間 duration preserves the attested minute-counter sound change instead of falling back to the lexical 分 reading', input: '十分間', expected: 'Juppunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-MULTIDIGIT', suite: 'engine', rule: 'The 分間 suffix keeps the reviewed final-minute allomorph when the minute count contains more than one Kanji digit', input: '二十一分間', expected: 'Nijuuippunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-HUNDRED-COMPONENT', suite: 'engine', rule: 'Minute-duration assembly preserves both an irregular reviewed hundred component and the final minute-counter allomorph', input: '六百六分間', expected: 'Roppyaku Roppunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-RULE0-HUNDRED-TAIL', suite: 'engine', rule: 'Minute-counter morphology applies to the final lower-value numeric group without erasing the Rule-0 boundary after a completed 百 group', input: '三百一分', expected: 'Sanbyaku Ippun', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-RULE0-THOUSAND-DURATION', suite: 'engine', rule: 'A completed 千 group remains separate from the final minute-counter group inside a duration', input: '三千一分間', expected: 'Sanzen Ippunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-RULE0-LARGE-DURATION', suite: 'engine', rule: 'Large minute durations preserve all Rule-0 numeric group boundaries while the final group retains its minute allomorph', input: '一万三千六百八十一分間', expected: 'Ichiman Sanzen Roppyaku Hachijuuippunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-HUNDRED', suite: 'engine', rule: 'A whole hundred minute count uses the established 百分 sound change instead of the lexical 分 reading', input: '百分', expected: 'Hyappun', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-HUNDRED-COMPOSED', suite: 'engine', rule: 'An irregular reviewed hundred numeral composes with the minute-specific 百分 sound change', input: '三百分', expected: 'Sanbyappun', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-HUNDRED', suite: 'engine', rule: 'A whole hundred-minute duration preserves the 百分 sound change before 間', input: '百分間', expected: 'Hyappunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-THOUSAND-GUARD', suite: 'engine', rule: 'A 千分 duration keeps the established supported fun reading rather than inheriting the 百分 sound change', input: '千分間', expected: 'Senfunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-MAN-GUARD', suite: 'engine', rule: 'A 万-based minute duration remains outside the 百分 sound-change rule', input: '一万分間', expected: 'Ichimanfunkan', expectedRequiresReview: false },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-LEXICAL-GUARD', suite: 'engine', rule: 'An intact lexical 間に合う boundary prevents ambiguous 十分 from being forced into the ten-minute reading merely because 分 and 間 are adjacent in the source', input: '十分間に合う', expected: 'Juubun Maniau', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-LEXICAL-VERB-GUARD', suite: 'engine', rule: 'A longer lexical word beginning with 間 outranks the apparent 分間 boundary when the source also supports lexical 十分', input: '十分間違う', expected: 'Juubun Machigau', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-RULE0-LEXICAL-GROUP-GUARD', suite: 'engine', rule: 'A preceding completed numeric group does not erase a stronger lexical continuation across the apparent 分間 boundary', input: '三百十分間違う', expected: 'Sanbyaku Juubun Machigau', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-MINUTE-DURATION-DIGIT-GUARD', suite: 'engine', rule: 'Arabic-digit 分間 expressions retain the established source-digit rendering while the Kanji duration path is repaired', input: '21分間', expected: '21funkan', expectedRequiresReview: false },
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
            { id: 'CHECK-JIHAN-CONTROL', suite: 'engine', rule: 'The existing compact 時半 counter form remains unchanged while hour/minute boundaries are repaired', input: '午後六時半', expected: 'Gogo Rokujihan', expectedRequiresReview: false },
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
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-CANONICAL', suite: 'unit', rule: 'U+3007 inside an ideographic decimal digit run selects decimal notation and canonicalises the whole run to ASCII digits', input: '二〇二六', expected: '2026', run: () => canonicalizeIdeographicDecimalNotationSurface('二〇二六') },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-REI-GUARD', suite: 'unit', rule: 'Ordinary ideographic 零 is not the U+3007 decimal-position marker and is never rewritten by the decimal-notation canonicaliser', input: '二零二六', expected: '二零二六', run: () => canonicalizeIdeographicDecimalNotationSurface('二零二六') },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-YEAR', suite: 'engine', rule: 'A year written with CJK decimal digits and U+3007 preserves its positional digit notation instead of reading each ideograph lexically', input: '二〇二六年', expected: '2026nen', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-CURRENCY', suite: 'engine', rule: 'U+3007 in a decimal currency amount is rendered as the digit zero while the existing currency boundary is preserved', input: '一〇〇円', expected: '100 En', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-ORDINAL', suite: 'engine', rule: 'A U+3007 decimal ordinal matches the established Arabic-digit output boundary rather than attaching the digit to 第', input: '第〇章', expected: 'Dai 0shou', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-ZERO-HOUR', suite: 'engine', rule: 'U+3007 as a decimal zero reuses the already reviewed 0時 clock-hour alias before generic digit rendering', input: '〇時', expected: 'Reiji', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-LEADING-ZERO', suite: 'engine', rule: 'A CJK decimal digit run can preserve leading zeroes when U+3007 makes the positional notation explicit', input: '〇〇七', expected: '007', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-IDEOGRAPHIC-DECIMAL-SYMBOL-GUARD', suite: 'unit', rule: 'A standalone U+3007 that the analyser identifies as a symbol is not globally converted into the digit zero', input: '〇', expected: '〇', run: () => translateText('〇') },
            { id: 'DIFF-IPPai', suite: 'engine', rule: 'Reviewed lexical evidence corrects a Kuromoji counter split', input: '一杯', expected: 'Ippai' },
            { id: 'DIFF-IKKYOKU', suite: 'engine', rule: 'Reviewed counter evidence preserves the sokuon in 一曲', input: '一曲', expected: 'Ikkyoku' },
            { id: 'DIFF-IPPO', suite: 'engine', rule: 'Reviewed counter evidence preserves the sokuon in 一歩', input: '一歩', expected: 'Ippo' },
            { id: 'STRESS-COUNTER-FUTARI', suite: 'engine', rule: 'Reviewed counter/date evidence preserves the irregular 二人 reading', input: '二人', expected: 'Futari' },
            { id: 'STRESS-COUNTER-REPETITION-GUARD', suite: 'engine', rule: 'Counter evidence must not remain stale when a larger reviewed lexical span replaces repeated counter tokens', input: '一人一人', expected: 'Hitori Hitori' },
            { id: 'STRESS-DATE-FUTSUKA', suite: 'engine', rule: 'Reviewed counter/date evidence preserves the irregular 二日 reading', input: '二日', expected: 'Futsuka' },
            { id: 'STRESS-COUNTER-IPPON', suite: 'engine', rule: 'Reviewed counter/date evidence preserves counter sound change in 一本', input: '一本', expected: 'Ippon' },
            { id: 'STRESS-COUNTER-SANBON', suite: 'engine', rule: 'Reviewed counter/date evidence preserves Rendaku-like counter voicing in 三本', input: '三本', expected: 'Sanbon' },
            { id: 'SYS-N-READING-BOUNDARY-KANJI', suite: 'engine', rule: 'A numeric-unit boundary takes precedence over cross-token apostrophe insertion', input: '千円', expected: 'Sen En' },
            { id: 'SYS-NUMERIC-COMPOUND-SPACING', suite: 'engine', rule: 'A completed thousands group is separated from the following currency unit', input: '五千円', expected: 'Gosen En', expectedRequiresReview: false },
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
            { id: 'SYS-NUMERIC-COMPOSITE-YEN', suite: 'engine', rule: 'A 万 group is joined internally but separated from the following currency unit', input: '一万円', expected: 'Ichiman En', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-LONG-GROUPING', suite: 'engine', rule: 'Long Japanese numerals preserve structural place-value groups instead of becoming one artificial word', input: '二万三千四百五十六円', expected: 'Niman Sanzen Yonhyaku Gojuuroku En', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-SANBYAKU-RULE0-N', suite: 'engine', rule: 'Reviewed 300 evidence keeps Rule 0 n before byaku rather than m-assimilation', input: '三百', expected: 'Sanbyaku' },
            { id: 'SYS-NUMERIC-SANMAN-RULE0-N', suite: 'engine', rule: 'Rule 0 keeps written syllabic n before man rather than source-guide m-assimilation', input: '三万円', expected: 'Sanman En', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-OKU-MAN-GROUPING', suite: 'engine', rule: 'A composite block attaches to the following 万 while a completed 億 block remains a separate output group', input: '一億二千万', expected: 'Ichioku Nisenman', expectedRequiresReview: false },
            { id: 'SYS-NUMERIC-CHOU-SOKUON-ICCHOU', suite: 'engine', rule: 'Reviewed 一兆 evidence applies Rule 0 sokuon before ちょ as cc rather than copying external romanisation', input: '一兆', expected: 'Icchou' },
            { id: 'SYS-NUMERIC-CHOU-SOKUON-HACCHOU', suite: 'engine', rule: 'Reviewed 八兆 evidence applies the same small-っ mechanism', input: '八兆', expected: 'Hacchou' },
            { id: 'SYS-NUMERIC-CHOU-SOKUON-JUCCHOU', suite: 'engine', rule: 'Reviewed 十兆 evidence applies the same small-っ mechanism', input: '十兆', expected: 'Jucchou' },
            { id: 'SYS-NUMERIC-MULTI-LARGE-UNIT-GROUPING', suite: 'engine', rule: 'Large-unit groups stay readable and never gain a false apostrophe at a numeric output boundary', input: '五百兆二万一', expected: 'Gohyakuchou Niman Ichi', expectedRequiresReview: false },
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
            })),
            { id: 'MECH-NUMERIC-ROLE-ISOLATED-ONE-MINUTE-REVIEW', suite: 'engine', rule: 'An isolated 一分 remains reviewable when minute-counter evidence and an incompatible lexical reading occupy the same source span', input: '一分', expected: 'Ippun', expectedRequiresReview: true },
            { id: 'MECH-NUMERIC-ROLE-ONE-MINUTE-VERB-CONTROL', suite: 'engine', rule: 'External verbal context may establish the ordinary one-minute role without inheriting the isolated-surface ambiguity state', input: '一分待つ', expected: 'Ippun Matsu', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-ISOLATED-ONE-MONTH-AMBIGUITY', suite: 'engine', rule: 'An isolated 一月 remains reviewable because date evidence cannot use the same source span to suppress the independently attested duration reading', input: '一月', expected: 'Ichigatsu', expectedRequiresReview: true },
        ];
    }

    const DOMAIN_SEMANTIC_ORACLE_CASES = Object.freeze([
        Object.freeze({
            id: 'ORACLE-LOANWORD-EVANGELION-COMPONENT',
            input: 'エヴァンゲリオン',
            expected: 'Evangelion',
            rule: 'Independent source-spelling oracle: the lexical component エヴァンゲリオン maps to Evangelion and must not expand into the complete title phrase.',
            provenance: 'https://30th.evangelion.jp/articles/official'
        }),
        Object.freeze({
            id: 'ORACLE-TITLE-SHINSEIKI-EVANGELION',
            input: '新世紀エヴァンゲリオン',
            expected: 'Shinseiki Evangelion',
            rule: 'Independent compositional oracle: Japanese 新世紀 remains romanised while the reviewed Katakana component uses the source spelling Evangelion.',
            provenance: 'https://30th.evangelion.jp/articles/official'
        })
    ]);
    
    function getNamesAndLoanwordsRegressionChecks() {
        return [
            { id: 'MECH-LOANWORD-SENTENCE-CONTEXT-SUPERSESSION-BASS', suite: 'engine', rule: 'Reviewed sentence-level loanword context may select an attested source spelling and supersede only the ambiguity signal it resolves', input: 'ベースをバンドで弾く', expected: 'Bass o Band de Hiku', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-SENTENCE-CONTEXT-SUPERSESSION-LIFECYCLE', suite: 'unit', rule: 'Sentence-level reviewed loanword context removes the resolved ambiguity flag and transitions its review signal to superseded without discarding the signal lifecycle', input: 'synthetic Base/Bass provisional ambiguity resolved by final sentence context', expected: 'Bass:false:superseded:false:sentence-context-loanword', run: () => { const tokens = [{ surface_form: 'ベース', pos: '名詞', pos_detail_1: '一般' }, { surface_form: 'を', pos: '助詞', pos_detail_1: '格助詞' }, { surface_form: 'バンド', pos: '名詞', pos_detail_1: '一般' }, { surface_form: 'で', pos: '助詞', pos_detail_1: '格助詞' }, { surface_form: '弾く', basic_form: '弾く', pos: '動詞', pos_detail_1: '自立' }]; const provisional = makeReadingResolution(tokens[0], { romaji: 'Base', source: 'loanword-lexicon', confidence: 0.8, flags: ['loanword-source-ambiguous'], ambiguous: true }); const resolved = verifySentenceLevelResolutions(tokens, [provisional], 'ベースをバンドで弾く')[0]; const signal = (resolved.reviewSignals || []).find(item => item.flag === 'loanword-source-ambiguous'); return `${resolved.romaji || ''}:${String((resolved.flags || []).includes('loanword-source-ambiguous'))}:${signal?.state || ''}:${String(Boolean(signal?.requiresReview))}:${signal?.supersededBy || ''}`; } },
            ...DOMAIN_SEMANTIC_ORACLE_CASES.map(item => ({ ...item, suite: 'engine', expectedRequiresReview: false })),
            { id: 'R0-KATAKANA-SOKUON-H', suite: 'unit', rule: 'R0.4 Katakana sokuon can geminate h in foreign names and spellings', input: 'バッハ', expected: 'bahha', run: () => convertToRomaji('バッハ') },
            { id: 'SYS-NAME-CONTEXT-UNKNOWN-GIVEN', suite: 'unit', rule: 'A Han token after a surname and explicit name-space is marked for review when it is not already a proper noun', input: '藤林 杏子', expected: 'true', run: () => { const tokens = [{ surface_form: '藤林', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓' }, { surface_form: ' ', pos: '記号', pos_detail_1: '空白' }, { surface_form: '杏子', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*' }]; const marked = markUnreviewedNameContextTokens(tokens); return String(Boolean(marked[2].nameContextAmbiguous)); } },
            { id: 'MECH-REVIEW-PROPER-NAME-LEXICAL-HOMOGRAPH', suite: 'engine', rule: 'Reviewed proper-name evidence remains reviewable when the exact source token has a conflicting ordinary lexical reading', input: '下屋を修理する', expected: 'Shitaya o Shuuri Suru', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-LEXICAL-HOMOGRAPH-HONORIFIC', suite: 'engine', rule: 'A directly attached reviewed honorific establishes the proper-name role and does not manufacture lexical-collision review', input: '下屋さん', expected: 'Shitaya san', expectedRequiresReview: false },
            { id: 'SYS-NAME-STRUCTURE-UNREVIEWED-GENERIC', suite: 'unit', rule: 'An unattested proper-name plus facility generic boundary is reviewable instead of being silently accepted from tokenizer segmentation', input: '試験町 + 駅', expected: 'true', run: () => { const tokens = [{ surface_form: '試験町', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '一般' }, { surface_form: '駅', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '地域', pos_detail_3: '*' }]; return String(Boolean(markUnreviewedNameContextTokens(tokens)[1].nameContextAmbiguous)); } },
            { id: 'SYS-NAME-STRUCTURE-WHOLE-NAME-EVIDENCE', suite: 'unit', rule: 'Exact whole-name evidence settles a proper-name generic structure without manufacturing boundary review', input: '試験町駅 / attested whole name', expected: 'false', run: () => { const surface = '試験町駅'; const previous = runtimeState.properNounDictionary.get(surface); try { runtimeState.properNounDictionary.set(surface, new Map([['しけんちょうえき', { reading: 'しけんちょうえき' }]])); const tokens = [{ surface_form: '試験町', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '一般' }, { surface_form: '駅', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '地域', pos_detail_3: '*' }]; return String(Boolean(markUnreviewedNameContextTokens(tokens)[1].nameContextAmbiguous)); } finally { if (previous) runtimeState.properNounDictionary.set(surface, previous); else runtimeState.properNounDictionary.delete(surface); } } },
            { id: 'SYS-NAME-STRUCTURE-EXPLICIT-SPACE', suite: 'unit', rule: 'Explicit source whitespace remains an intentional boundary and is not reclassified as an unreviewed attached facility-name boundary', input: '試験町 + space + 駅', expected: 'false', run: () => { const tokens = [{ surface_form: '試験町', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '一般' }, { surface_form: ' ', pos: '記号', pos_detail_1: '空白' }, { surface_form: '駅', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '地域', pos_detail_3: '*' }]; return String(Boolean(markUnreviewedNameContextTokens(tokens)[2].nameContextAmbiguous)); } },
            { id: 'SYS-NAME-STRUCTURE-ORDINARY-NOUN-GUARD', suite: 'unit', rule: 'A common noun followed by the same generic is not treated as a proper-name structure merely because the suffix surface matches', input: '中央 + 駅', expected: 'false', run: () => { const tokens = [{ surface_form: '中央', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*' }, { surface_form: '駅', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '地域', pos_detail_3: '*' }]; return String(Boolean(markUnreviewedNameContextTokens(tokens)[1].nameContextAmbiguous)); } },
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
            { id: 'MECH-LOANWORD-LONGEST-SPAN-WINS', suite: 'unit', rule: 'A short reviewed loanword cannot shadow a longer complete reviewed loanword beginning with the same surface', input: 'アンパン + マン / short versus complete mapping', expected: 'LongForm', run: () => { const shortSurface = 'アンパン'; const longSurface = 'アンパンマン'; const savedShort = runtimeState.loanwordDictionary.get(shortSurface); const savedLong = runtimeState.loanwordDictionary.get(longSurface); const savedPrefixes = new Set(runtimeState.loanwordPrefixes); try { runtimeState.loanwordDictionary.set(shortSurface, 'Short'); runtimeState.loanwordDictionary.set(longSurface, 'LongForm'); addSurfacePrefixes(runtimeState.loanwordPrefixes, shortSurface); addSurfacePrefixes(runtimeState.loanwordPrefixes, longSurface); return translateText(longSurface); } finally { if (savedShort !== undefined) runtimeState.loanwordDictionary.set(shortSurface, savedShort); else runtimeState.loanwordDictionary.delete(shortSurface); if (savedLong !== undefined) runtimeState.loanwordDictionary.set(longSurface, savedLong); else runtimeState.loanwordDictionary.delete(longSurface); runtimeState.loanwordPrefixes = savedPrefixes; } } },
            { id: 'MECH-LOANWORD-KATAKANA-NEGATIVE-CONTROLS', suite: 'unit', rule: 'Katakana orthography alone never promotes native, mimetic, name-like or taxonomic Japanese forms into source-language loanword mappings', input: 'ドキドキ / ワクワク / サクラ / ネコ / メダカ', expected: 'none', run: () => ['ドキドキ','ワクワク','サクラ','ネコ','メダカ'].some(surface => runtimeState.loanwordDictionary.has(surface) || runtimeState.loanwordMetadataDictionary.has(surface)) ? 'mapped' : 'none' },
            { id: 'MECH-LOANWORD-METADATA-ONLY-SCHEMA', suite: 'unit', rule: 'A reviewed loanword surface may deliberately omit source Romaji when the source spelling remains ambiguous, provided it is marked for review', input: 'loanword-bank-v1 / metadata-only review', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'カード', requiresReview: true, reviewReason: 'ambiguous-source-spelling' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'MECH-LOANWORD-METADATA-ONLY-REQUIRES-REASON', suite: 'unit', rule: 'A source-less loanword row is invalid unless it explicitly records why review is required', input: 'loanword-bank-v1 / unreasoned source-less row', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'カード', requiresReview: true }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-ALIAS-SOURCE-SPELLING-DIVER', suite: 'unit', rule: 'A work-identity translation cannot replace the foreign source form directly represented by the Katakana title', input: 'ザダイバー / Men of Honor', expected: 'The Diver', run: () => runtimeState.loanwordDictionary.get('ザダイバー') || 'missing' },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-ALIAS-SOURCE-SPELLING-AGENT', suite: 'unit', rule: 'A work-identity translation cannot replace the foreign source form directly represented by the Katakana title', input: 'ザエージェント / Jerry Maguire', expected: 'The Agent', run: () => runtimeState.loanwordDictionary.get('ザエージェント') || 'missing' },
            { id: 'SCHEMA-LOANWORD-V2-LEGACY-SIMPLE', suite: 'unit', rule: 'The extended loanword schema remains compatible with legacy two-column rows', input: '[\"コーヒー\", \"Coffee\"]', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [['コーヒー', 'Coffee']], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-LEGACY-COUNTRY', suite: 'unit', rule: 'The extended loanword schema remains compatible with existing country-name object rows', input: 'ロシア → Russia / country-name', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ロシア', output: 'Russia', category: 'country-name' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-LEGACY-REVIEW-ONLY', suite: 'unit', rule: 'The extended loanword schema remains compatible with review-only object rows', input: 'リード / review-only', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'リード', requiresReview: true, reviewReason: 'Donor spelling unresolved.' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'MECH-PROPER-NAME-LEGACY-HINT-SCHEMA-FIXTURE', suite: 'unit', rule: 'A schema-valid legacy proper-noun row may retain explicit reading-weight and source-rank hints even though current maintained banks contain no legacy hint labels', input: 'legacy proper-noun reading hint fixture', expected: '73:per:17', run: () => { const surface = '試験名'; const entry = [surface, 'しけんめい', 'per', 0, null, ['しけんめい (73%) - per'], 17]; validateAssetSchema('properNouns', [entry], 'qa'); const previous = runtimeState.properNounDictionary.get(surface); const chars = Array.from(surface); const prefixes = chars.map((_, index) => chars.slice(0, index + 1).join('')); const previousPrefixes = prefixes.map(prefix => runtimeState.properNounPrefixes.has(prefix)); try { runtimeState.properNounDictionary.delete(surface); registerProperNounEntry(entry, 'qa-legacy-hint'); const candidate = runtimeState.properNounDictionary.get(surface)?.get(normalizeKanaReading('しけんめい')); return `${candidate?.weight || 0}:${candidate?.categories?.has('per') ? 'per' : 'missing'}:${Number.isFinite(candidate?.rank) ? candidate.rank : 0}`; } finally { if (previous) runtimeState.properNounDictionary.set(surface, previous); else runtimeState.properNounDictionary.delete(surface); prefixes.forEach((prefix, index) => { if (previousPrefixes[index]) runtimeState.properNounPrefixes.add(prefix); else runtimeState.properNounPrefixes.delete(prefix); }); } } },
            { id: 'MECH-PROPER-NAME-CATEGORYLESS-STRUCTURED-CANDIDATE', suite: 'unit', rule: 'A schema-valid structured proper-noun candidate may omit category labels while retaining its reviewed reading, weight and source evidence', input: 'category-less structured proper-noun fixture', expected: '42:0:true', run: () => { const surface = '試験名二'; const entry = { surface, readings: [{ reading: 'しけんめいに', weight: 42 }] }; validateAssetSchema('properNouns', [entry], 'qa'); const previous = runtimeState.properNounDictionary.get(surface); const chars = Array.from(surface); const prefixes = chars.map((_, index) => chars.slice(0, index + 1).join('')); const previousPrefixes = prefixes.map(prefix => runtimeState.properNounPrefixes.has(prefix)); try { runtimeState.properNounDictionary.delete(surface); registerProperNounEntry(entry, 'qa-structured-name'); const candidate = runtimeState.properNounDictionary.get(surface)?.get(normalizeKanaReading('しけんめいに')); return `${candidate?.weight || 0}:${candidate?.categories?.size || 0}:${String(Boolean(candidate?.sources?.has('qa-structured-name')))}`; } finally { if (previous) runtimeState.properNounDictionary.set(surface, previous); else runtimeState.properNounDictionary.delete(surface); prefixes.forEach((prefix, index) => { if (previousPrefixes[index]) runtimeState.properNounPrefixes.add(prefix); else runtimeState.properNounPrefixes.delete(prefix); }); } } },
            { id: 'MECH-WHOLE-WORD-COMMON-VARIANT-DEFAULT-FIXTURE', suite: 'unit', rule: 'A general kanji-variant surface may use a reviewed default common-word rule stored under its canonical lookup spelling', input: '試験龍 → 試験竜 common-word fixture', expected: 'しけんりゅう', run: () => { const surface = '試験龍'; const canonical = '試験竜'; const previousSurface = runtimeState.commonWordDictionary.get(surface); const previousCanonical = runtimeState.commonWordDictionary.get(canonical); try { runtimeState.commonWordDictionary.delete(surface); runtimeState.commonWordDictionary.set(canonical, [{ reading: 'しけんりゅう', pattern: null }]); const reading = getCommonWordReadingForToken({ surface_form: surface, pos: '名詞', pos_detail_1: '一般' }, surface); return reading || 'missing'; } finally { if (previousSurface) runtimeState.commonWordDictionary.set(surface, previousSurface); else runtimeState.commonWordDictionary.delete(surface); if (previousCanonical) runtimeState.commonWordDictionary.set(canonical, previousCanonical); else runtimeState.commonWordDictionary.delete(canonical); } } },
            { id: 'MECH-LOANWORD-MATERIAL-ALTERNATE-SCHEMA-FIXTURE', suite: 'unit', rule: 'A schema-valid reviewed loanword may require ambiguity review because a material alternate exists even when top-level ambiguity significance is not itself material', input: 'material alternate without top-level material flag', expected: 'loanword-source-ambiguous', run: () => { const surface = 'テストベース'; const entry = { surface, output: 'Base', category: 'ordinary-gairaigo', requiresReview: true, reviewReason: 'Material donor ambiguity.', ambiguitySignificance: 'none', alternates: [{ output: 'Bass', significance: 'material' }] }; validateAssetSchema('loanwords', [entry], 'qa'); const previousOutput = runtimeState.loanwordDictionary.get(surface); const previousMetadata = runtimeState.loanwordMetadataDictionary.get(surface); try { runtimeState.loanwordDictionary.set(surface, entry.output); runtimeState.loanwordMetadataDictionary.set(surface, { category: entry.category, requiresReview: true, reviewReason: entry.reviewReason, ambiguitySignificance: entry.ambiguitySignificance, alternates: entry.alternates, context: null }); return getLoanwordReviewFlag({ surface_form: surface, pos: '名詞', pos_detail_1: '一般' }) || 'none'; } finally { if (previousOutput) runtimeState.loanwordDictionary.set(surface, previousOutput); else runtimeState.loanwordDictionary.delete(surface); if (previousMetadata) runtimeState.loanwordMetadataDictionary.set(surface, previousMetadata); else runtimeState.loanwordMetadataDictionary.delete(surface); } } },
            { id: 'SCHEMA-LOANWORD-V2-CONTEXTUAL-ALTERNATE', suite: 'unit', rule: 'A canonical donor plus a material alternate may carry conservative context-selection evidence', input: 'ベース → Base / Bass', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ベース', output: 'Base', category: 'ordinary-gairaigo', requiresReview: true, reviewReason: 'Material donor ambiguity.', ambiguitySignificance: 'material', alternates: [{ output: 'Bass', significance: 'material' }], context: { window: 4, minMargin: 2, source: 'qa', candidates: [{ output: 'Base', minScore: 2, terms: [{ term: '土台', weight: 2 }] }, { output: 'Bass', minScore: 2, terms: [{ term: '音楽', weight: 2 }] }] } }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-INVALID-CANONICAL', suite: 'unit', rule: 'Canonical donor output must satisfy Rule 0 source-output syntax', input: 'カード → カード', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'カード', output: 'カード' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-INVALID-ALTERNATE', suite: 'unit', rule: 'Alternate donor output must satisfy the same Rule 0 source-output syntax as canonical output', input: 'ベース alternate ベース', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ベース', output: 'Base', alternates: [{ output: 'ベース', significance: 'material' }] }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-DUPLICATE-ALTERNATE', suite: 'unit', rule: 'One donor alternate cannot be repeated inside a rich loanword row', input: 'Bass + Bass', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ベース', output: 'Base', alternates: [{ output: 'Bass', significance: 'material' }, { output: 'Bass', significance: 'incidental' }] }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-CANONICAL-AS-ALTERNATE', suite: 'unit', rule: 'The canonical donor cannot also be stored as its own alternate', input: 'Base + Base', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ベース', output: 'Base', alternates: [{ output: 'Base', significance: 'material' }] }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-REVIEW-REQUIRES-REASON', suite: 'unit', rule: 'A canonical loanword row marked for review must state the reason', input: 'Base / requiresReview without reason', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ベース', output: 'Base', requiresReview: true }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-CONTEXT-OUTPUT-MUST-BE-DECLARED', suite: 'unit', rule: 'Context selection cannot introduce a donor spelling that is absent from the canonical and alternate set', input: 'Base context candidate Bass without alternate', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ベース', output: 'Base', context: { window: 4, minMargin: 2, source: 'qa', candidates: [{ output: 'Bass', minScore: 2, terms: [{ term: '音楽', weight: 2 }] }] } }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-CONFLICTING-DUPLICATE-SURFACE', suite: 'unit', rule: 'Conflicting rows for one loanword surface fail schema validation instead of depending on load order', input: 'カード → Card / Guard', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [['カード', 'Card'], ['カード', 'Guard']], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-COUNTRY-LANGUAGE', suite: 'unit', rule: 'Reviewed country-language rows remain compatible with the richer schema', input: 'ロシア語 → Russia-go / country-language', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ロシア語', output: 'Russia-go', category: 'country-language' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-COUNTRY-LANGUAGE-SURFACE-REJECT', suite: 'unit', rule: 'Country-language evidence must describe an explicitly reviewed complete surface ending in 語', input: 'ロシア → Russia-go / country-language', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ロシア', output: 'Russia-go', category: 'country-language' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-COUNTRY-LANGUAGE-OUTPUT-REJECT', suite: 'unit', rule: 'Country-language evidence must preserve the project policy suffix -go instead of admitting an arbitrary semantic translation', input: 'ロシア語 → Russian / country-language', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'ロシア語', output: 'Russian', category: 'country-language' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-COUNTRY-LANGUAGE-REVIEW-ONLY-REJECT', suite: 'unit', rule: 'The country-language category is reserved for authoritative whole-expression decisions, not metadata-only review rows', input: '架空語 / country-language / review-only', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: '架空語', category: 'country-language', requiresReview: true, reviewReason: 'qa' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-PUNCTUATION-REJECT', suite: 'unit', rule: 'Japanese punctuation cannot leak into reviewed donor output', input: 'Card。', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'カード', output: 'Card。' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-NONASCII-REJECT', suite: 'unit', rule: 'Loanword source output remains ASCII-safe while Rule 0 forbids accented donor output', input: 'Café', expected: 'rejected', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'カフェ', output: 'Café' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-LOANWORD-V2-OFFICIAL-CASING-PRESERVED', suite: 'unit', rule: 'Schema validation permits reviewed brand casing rather than blindly title-casing source output', input: 'iPhone', expected: 'accepted', run: () => { try { validateAssetSchema('loanwords', [{ surface: 'アイフォーン', output: 'iPhone', category: 'product-name' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'CHECK-LONG-REVIEWED-NAME-SPAN-11', suite: 'unit', rule: 'Reviewed proper-name spans are evidence-bounded rather than capped at ten tokens', input: '11-token reviewed-name span', expected: '11', run: () => { const original = runtimeState.reviewedProperNameSpanDictionary; const originalPrefixes = runtimeState.reviewedProperNameSpanPrefixes; const surface = '山山山山山山山山山山山'; const tokens = Array.from(surface).map(value => ({ surface_form: value, pos: '名詞' })); try { runtimeState.reviewedProperNameSpanDictionary = new Map([[surface, { reading: 'やま', romaji: 'Yama', category: 'name' }]]); runtimeState.reviewedProperNameSpanPrefixes = new Set(); addSurfacePrefixes(runtimeState.reviewedProperNameSpanPrefixes, surface); return String(findLongestReviewedProperNameSpan(tokens, 0)?.length || 0); } finally { runtimeState.reviewedProperNameSpanDictionary = original; runtimeState.reviewedProperNameSpanPrefixes = originalPrefixes; } } },
            { id: 'CHECK-LONG-VARIANT-NAME-9', suite: 'unit', rule: 'Variant proper-name spans use name-evidence prefixes rather than an eight-token ceiling', input: '9-token variant name', expected: '9', run: () => { const originalDictionary = runtimeState.properNounDictionary; const originalPrefixes = runtimeState.properNounPrefixes; const originalVariants = runtimeState.nameKanjiVariantDictionary; const canonical = '国国国国国国国国国'; const variant = '國国国国国国国国国'; const tokens = Array.from(variant).map(value => ({ surface_form: value, pos: '名詞', pos_detail_1: '固有名詞' })); try { runtimeState.properNounDictionary = new Map([[canonical, new Map([['くに', { reading: 'くに', romaji: 'kuni', categories: new Set(['per']), sources: new Set(['qa']) }]])]]); runtimeState.properNounPrefixes = new Set(); addSurfacePrefixes(runtimeState.properNounPrefixes, canonical); runtimeState.nameKanjiVariantDictionary = new Map([['國', '国']]); return String(findLongestVariantProperNoun(tokens, 0)?.length || 0); } finally { runtimeState.properNounDictionary = originalDictionary; runtimeState.properNounPrefixes = originalPrefixes; runtimeState.nameKanjiVariantDictionary = originalVariants; } } },
            { id: 'DATA-ROMAJI-SOURCE-SAFE', suite: 'unit', rule: 'Reviewed source-language spelling accepts Rule 0-safe Latin output', input: 'Chun-Li', expected: 'true', run: () => String(isRule0RomajiEvidence('Chun-Li')) },
            { id: 'ASSET-SCHEMA-PROPER-NOUN-COMPACT', suite: 'unit', rule: 'The proper-noun schema accepts the compact CJ2R surface/readings representation', input: 'proper-noun-bank-v1 / compact', expected: 'accepted', run: () => { try { validateAssetSchema('properNouns', [{ surface: '日本', rank: 1, readings: [{ reading: 'にほん', weight: 50, categories: ['loc'] }] }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-REVIEWED-NAME-SOURCE-REQUIRED', suite: 'unit', rule: 'Promoted reviewed proper-name spans require explicit source provenance', input: 'reviewed proper-name span with source', expected: 'accepted', run: () => { try { validateAssetSchema('reviewedProperNameSpans', [{ surface: '試験名', reading: 'しけんめい', romaji: 'Shikenmei', category: 'name', source: 'QA reviewed source' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-REVIEWED-NAME-SOURCE-MISSING-REJECT', suite: 'unit', rule: 'Source-less reviewed proper-name evidence cannot become authoritative', input: 'reviewed proper-name span without source', expected: 'rejected', run: () => { try { validateAssetSchema('reviewedProperNameSpans', [{ surface: '試験名', reading: 'しけんめい', romaji: 'Shikenmei', category: 'name' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SRC-ATEJI-WHOLE-WORD', suite: 'unit', rule: 'Ateji bank supplies a whole-word reading without per-kanji inference', input: '寿司', expected: '寿司:すし', run: () => { const merged = mergeAtejiTokens([{ surface_form: '寿', pos: '名詞' }, { surface_form: '司', pos: '名詞' }]); return `${merged[0]?.surface_form || ''}:${merged[0]?.atejiReading || ''}`; } },
            { id: 'SRC-JMNEDICT-PROPER-NOUN', suite: 'unit', rule: 'JMnedict supplements only tokens already classified as proper nouns', input: '阿良々木', expected: 'Araragi', run: () => capitalizeRomaji(resolveProperNounReading({ surface_form: '阿良々木', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名' })?.romaji || '') },
            { id: 'CHECK-NAME-FOLLOWING-LEXICAL', suite: 'engine', rule: 'A person-name span does not swallow a following lexical word', input: '山田太郎物語', expected: 'Yamada Tarou Monogatari' },
            { id: 'CHECK-NAME-HONORIFIC-FOLLOWING-LEXICAL', suite: 'engine', rule: 'A person name plus honorific does not swallow a following lexical word', input: '山田太郎さん物語', expected: 'Yamada Tarou san Monogatari' },
            { id: 'MECH-PROPER-NAME-REVIEWED-SPLIT-HONORIFIC-LOOKAHEAD', suite: 'unit', rule: 'Reviewed proper-name matching may recognise an honorific split across an oversized token remainder and the following token without consuming the honorific into the name span', input: 'かぐやさ + ん', expected: 'かぐや:0:3', run: () => { const tokens = [{ surface_form: 'かぐやさ', pos: '名詞', pos_detail_1: '一般' }, { surface_form: 'ん', pos: '名詞', pos_detail_1: '一般' }]; const match = findLongestReviewedProperNameSpan(tokens, 0); return `${match?.surface || ''}:${match?.endIndex ?? -1}:${match?.endOffset ?? -1}`; } },
            { id: 'MECH-PROPER-NAME-VARIANT-CATEGORY-FALLBACK-MATRIX', suite: 'unit', rule: 'When canonical variant re-tokenisation is unavailable, maintained proper-name categories preserve surname, person, location and generic proper-noun distinctions rather than collapsing them to one class', input: 'fam / per / loc / generic category fixtures', expected: '人名:姓|人名:*|地域:*|一般:*', run: () => { const originalDictionary = runtimeState.properNounDictionary; const originalPrefixes = runtimeState.properNounPrefixes; const originalVariants = runtimeState.nameKanjiVariantDictionary; const originalTokenizer = runtimeState.tokenizer; const canonical = '国国'; const variant = '國国'; try { runtimeState.nameKanjiVariantDictionary = new Map([['國', '国']]); runtimeState.tokenizer = { tokenize: () => [] }; return ['fam', 'per', 'loc', ''].map(category => { runtimeState.properNounDictionary = new Map([[canonical, new Map([['くにくに', { reading: 'くにくに', categories: new Set(category ? [category] : []), sources: new Set(['qa']) }]])]]); runtimeState.properNounPrefixes = new Set(); addSurfacePrefixes(runtimeState.properNounPrefixes, canonical); const tokens = attachSourceTokenSpans([{ surface_form: variant, pos: '名詞', pos_detail_1: '固有名詞' }], variant); const token = mergeVariantProperNounTokens(tokens)[0] || {}; return `${token.pos_detail_2 || ''}:${token.pos_detail_3 || ''}`; }).join('|'); } finally { runtimeState.properNounDictionary = originalDictionary; runtimeState.properNounPrefixes = originalPrefixes; runtimeState.nameKanjiVariantDictionary = originalVariants; runtimeState.tokenizer = originalTokenizer; } } },
            { id: 'MECH-PROPER-NAME-REVIEWED-REMAINDER-HONORIFIC', suite: 'unit', rule: 'Reviewed proper-name evidence may end inside an oversized raw tokenizer token while preserving a following name honorific as a separate derived source span', input: 'かぐやさん raw tokenizer remainder', expected: 'かぐや|さん:true', run: () => { const source = 'かぐやさん'; const raw = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const merged = mergeReviewedProperNameSpanTokens(raw); return `${merged.map(item => item.surface_form).join('|')}:${String(Boolean(merged[merged.length - 1]?.reviewedNameHonorificMatched))}`; } },
            { id: 'MECH-PROPER-NAME-VARIANT-CANONICAL-RETOKENIZATION-FALLBACK', suite: 'unit', rule: 'Variant whole-name evidence retains proper-name category details when canonical re-tokenisation is temporarily unavailable for an already-tokenised source span', input: '髙橋 with unavailable canonical re-tokenisation', expected: 'true:人名:姓:高橋', run: () => { const source = '髙橋'; const tokens = attachSourceTokenSpans([{ surface_form: source, pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓', reading: '*', pronunciation: '*' }], source); const previousTokenizer = runtimeState.tokenizer; try { runtimeState.tokenizer = { tokenize: () => [] }; const merged = mergeVariantProperNounTokens(tokens); const token = merged[0] || {}; return `${String(Boolean(token.variantProperNounMatched))}:${token.pos_detail_2 || ''}:${token.pos_detail_3 || ''}:${token.variantLookupSurface || ''}`; } finally { runtimeState.tokenizer = previousTokenizer; } } },
            { id: 'R0-VARIANT-NAME-YOSHIDA', suite: 'engine', rule: 'Variant name glyphs use whole-name evidence rather than single-Kanji reconstruction', input: '𠮷田', expected: 'Yoshida' },
            { id: 'R0-VARIANT-NAME-TAKAHASHI', suite: 'engine', rule: 'Common itaiji in surnames resolve through whole-name evidence', input: '髙橋', expected: 'Takahashi' },
            { id: 'R0-VARIANT-NAME-WATANABE', suite: 'engine', rule: 'Variant surname forms resolve through whole-name evidence', input: '渡邉', expected: 'Watanabe' },
            { id: 'MECH-PROPER-NAME-VARIANT-EQUIVALENCE-EVIDENCE', suite: 'engine', rule: 'An unmaintained supported glyph variant inherits the maintained reading alternatives of equivalent proper-name spellings instead of losing their ambiguity during canonicalisation', input: '橫澤', expected: 'Yokozawa', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-LEXICALISED-PARTICLE-VARIANT-SPAN', suite: 'engine', rule: 'A supported name-glyph variant may cross an internal particle only when the accumulated spelling remains a maintained proper-name prefix, preserving whole-name evidence such as 江の島', input: '江の嶋', expected: 'Enoshima' },
            { id: 'MECH-PROPER-NAME-EQUIVALENT-FULL-PERSON-CANONICAL', suite: 'engine', rule: 'A canonical supported spelling that is absent as a maintained entry may inherit equivalent maintained full-person evidence when existing surname structure independently establishes the name boundary', input: '斎藤義竜', expected: 'Saitou Yoshitatsu', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-EQUIVALENT-FULL-PERSON-COMPATIBILITY', suite: 'engine', rule: 'A compatibility-ideograph spelling may inherit equivalent maintained full-person evidence without reverting to character-by-character name readings', input: '斎藤義龍', expected: 'Saitou Yoshitatsu', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-EQUIVALENT-FULL-PERSON-NONAUTHORITY-BMP-GUARD', suite: 'engine', rule: 'A supported name glyph must not inherit full-person role authority when the canonical maintained spelling itself has no source-orthography authority; existing surname ambiguity remains reviewable', input: '藤厡芳秀', expected: 'Fujiwara Kaoru Shuu', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-EQUIVALENT-FULL-PERSON-NONAUTHORITY-SUPPLEMENTARY-GUARD', suite: 'engine', rule: 'A supplementary-plane name glyph must preserve the same review state as its canonical spelling when equivalent full-person evidence lacks source-orthography authority', input: '藤𠩤芳秀', expected: 'Fujiwara Kaoru Shuu', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-VARIANT-FULL-PERSON-IMPLICIT-PARTICLE-BMP-GUARD', suite: 'engine', rule: 'A synthetic surname glyph variant must not let a full-person reading with an implicit particle overwrite independently maintained surname and given-name evidence', input: '藤厡秀郷', expected: 'Fujiwara Hidesato', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-VARIANT-FULL-PERSON-IMPLICIT-PARTICLE-SUPPLEMENTARY-GUARD', suite: 'engine', rule: 'The same implicit-particle guard applies when the surname variant uses a supplementary Han code point', input: '藤𠩤秀郷', expected: 'Fujiwara Hidesato', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-VARIANT-CANONICAL-PERSON-CONSENSUS-BMP', suite: 'engine', rule: 'A supported surname glyph variant preserves an exact whole-person reading when maintained proper-name evidence and the canonical Kuromoji person token independently agree on that complete reading', input: '藤厡不比等', expected: 'Fujiwaranofuhito', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-VARIANT-CANONICAL-PERSON-CONSENSUS-SUPPLEMENTARY', suite: 'engine', rule: 'The same canonical whole-person consensus remains valid when the supported surname glyph is a supplementary-plane Han character', input: '藤𠩤不比等', expected: 'Fujiwaranofuhito', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CANONICAL-SURNAME-LEXICAL-CONFLICT-REVIEW', suite: 'engine', rule: 'A maintained full-person reading does not erase an independently supported lexical reading conflict on its surname span', input: '桑田佳祐', expected: 'Kuwata Keisuke', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-VARIANT-SURNAME-LEXICAL-CONFLICT-REVIEW', suite: 'engine', rule: 'A supported surname glyph variant preserves the canonical surname lexical-conflict review state while retaining the maintained person reading', input: '桒田佳祐', expected: 'Kuwata Keisuke', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-VARIANT-CANONICAL-TOKENIZER-CONSENSUS-BMP', suite: 'engine', rule: 'A maintained proper-name reading may reconstruct a supported glyph variant when the canonical spelling independently has matching tokenizer component readings', input: '井ノ厡', expected: 'Inohara', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-VARIANT-CANONICAL-TOKENIZER-CONSENSUS-SUPPLEMENTARY', suite: 'engine', rule: 'Canonical tokenizer-reading consensus also supports reconstruction when the changed name glyph is supplementary-plane Han', input: '井ノ𠩤', expected: 'Inohara', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-VARIANT-FULL-PERSON-CORROBORATED-KITAJIMA-ITA', suite: 'engine', rule: 'A supported name glyph may reuse an exact maintained personal-name reading when unique maintained surname and given-name evidence independently compose the same reading', input: '北㠀康介', expected: 'Kitajima Kousuke', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-VARIANT-FULL-PERSON-CORROBORATED-KITAJIMA-SHIMA', suite: 'engine', rule: 'Equivalent supported name glyphs preserve the same corroborated personal-name structure without gaining authority from glyph substitution alone', input: '北嶌康介', expected: 'Kitajima Kousuke', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-VARIANT-GENERAL-WORD-CONSENSUS-CHISHIMA-LEFT', suite: 'engine', rule: 'A supported name glyph variant preserves a complete lexical span when maintained general-word and proper-name evidence agree on the same reading', input: '千㠀列島', expected: 'Chishimarettou', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-VARIANT-GENERAL-WORD-CONSENSUS-CHISHIMA-RIGHT', suite: 'engine', rule: 'The same lexical-span preservation applies when the supported name glyph occurs at the end of the maintained span', input: '千島列㠀', expected: 'Chishimarettou', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-OFFICIAL-ROMAJI-RYUKISHI07', suite: 'engine', rule: 'Reviewed official Roman presentation takes precedence over a phonetic reconstruction of a Japanese creator name', input: '竜騎士０７', expected: 'Ryukishi07', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-OFFICIAL-ROMAJI-RYUKISHI07-VARIANT', suite: 'engine', rule: 'A supported kanji variant preserves the same reviewed official Roman presentation for the creator name', input: '龍騎士０７', expected: 'Ryukishi07', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-REVIEWED-VARIANT-PRECEDENCE', suite: 'engine', rule: 'Generic variant re-tokenisation cannot overwrite an already matched reviewed proper-name span', input: '言峯', expected: 'Kotomine', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-IVS-SOURCE-ORTHOGRAPHY-EVIDENCE', suite: 'engine', rule: 'Ideographic variation selectors remain transparent to exact maintained name-evidence discovery and do not change the maintained reading', input: '萬\u{E0100}長', expected: 'Kazunaga', expectedRequiresReview: false },
            { id: 'R0-EXACT-NAME-ISAO', suite: 'engine', rule: 'An exact Kuromoji proper-name entry can rescue a kana name that Viterbi otherwise splits before を', input: 'いさを', expected: 'Isao' },
            { id: 'R0-EXACT-NAME-MITSUO', suite: 'engine', rule: 'An exact Kuromoji proper-name entry can rescue a kana name that Viterbi otherwise splits before を', input: 'みつを', expected: 'Mitsuo' },
            { id: 'R0-EXACT-NAME-FUMIE', suite: 'engine', rule: 'An exact Kuromoji proper-name entry can rescue a kana name that Viterbi otherwise splits before へ', input: 'ふみへ', expected: 'Fumie' },
            { id: 'R0-EXACT-NAME-CONTEXT-GUARD-WO', suite: 'engine', rule: 'Exact-name rescue must not steal a genuine を particle when following context makes the particle parse complete', input: 'みつを食べる', expected: 'Mitsu o Taberu' },
            { id: 'R0-EXACT-NAME-CONTEXT-GUARD-HE', suite: 'engine', rule: 'Exact-name rescue must not steal a genuine へ particle when following context makes the particle parse complete', input: 'ふみへ行く', expected: 'Fumi e Iku' },
            { id: 'R0-PUNCT-LOANWORD-TEST', suite: 'engine', rule: 'R0 punctuation plus R0.8 source-language spelling for テスト', input: 'これは「テスト」です。', expected: 'Kore wa "Test" desu.' },
            { id: 'R0-LOANWORD-AUTUMN', suite: 'engine', rule: 'R0.8 loanwords use their source-language spelling', input: 'オータム', expected: 'Autumn' },
            { id: 'R0-LOANWORD-MARUGOTO-BASIC-SOURCE-SPELLING-COVERAGE', suite: 'unit', rule: 'Independently verified basic Katakana loanwords and foreign names use reviewed source spellings rather than confident mechanical Katakana fallback', input: 'ピクニック / オフィス / フライト / キャビネット / シドニー / マドリード / モーターズ', expected: 'Picnic:false|Office:false|Flight:false|Cabinet:false|Sydney:false|Madrid:false|Motors:false', run: () => [['ピクニック','Picnic'], ['オフィス','Office'], ['フライト','Flight'], ['キャビネット','Cabinet'], ['シドニー','Sydney'], ['マドリード','Madrid'], ['モーターズ','Motors']].map(([input]) => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview))}`; }).join('|') },
            { id: 'R0-LOANWORD-MARUGOTO-COUNTRY-SOURCE-SPELLING-COVERAGE', suite: 'unit', rule: 'Independently verified country-name Katakana surfaces use the project source-spelling policy instead of confident mechanical Katakana fallback', input: 'インド / オーストラリア / カナダ / スリランカ / ニュージーランド / ブラジル / マレーシア / メキシコ', expected: 'India:false|Australia:false|Canada:false|Sri Lanka:false|New Zealand:false|Brazil:false|Malaysia:false|Mexico:false', run: () => ['インド','オーストラリア','カナダ','スリランカ','ニュージーランド','ブラジル','マレーシア','メキシコ'].map(input => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview))}`; }).join('|') },
            { id: 'R0-LOANWORD-ENGLISH-PREFERENCE-TOBACCO', suite: 'engine', rule: 'When an established English spelling is a genuine phonetic match, CJ2R prefers that familiar English donor spelling', input: 'タバコ', expected: 'Tobacco', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ENGLISH-PREFERENCE-BUTTON', suite: 'engine', rule: 'English-preference policy uses Button where the English spelling is a genuine match for the established borrowing', input: 'ボタン', expected: 'Button', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-PORTUGUESE-CARTA', suite: 'engine', rule: 'Established Portuguese-derived vocabulary uses its reviewed donor spelling', input: 'カルタ', expected: 'Carta', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-DUAL-DONOR-KOPPU', suite: 'engine', rule: 'Competing attested donor languages keep mechanical Romaji reviewable when neither donor is justified as canonical', input: 'コップ', expected: 'Koppu', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-HOTCHKISS-VARIANT', suite: 'engine', rule: 'Established spelling variants may resolve to the same reviewed source name', input: 'ホチキス', expected: 'Hotchkiss', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-FRENCH-CROQUETTE', suite: 'engine', rule: 'Reviewed French-derived vocabulary retains the French source spelling', input: 'コロッケ', expected: 'Croquette', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-BASE-STANDALONE-AMBIGUOUS', suite: 'engine', rule: 'Standalone ベース keeps the normal Base default while the material Base/Bass ambiguity remains reviewable', input: 'ベース', expected: 'Base', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-BASS-MUSIC-CONTEXT', suite: 'engine', rule: 'Strong musical context selects Bass from the reviewed ベース alternatives', input: 'ベースを弾く', expected: 'Bass o Hiku', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SOFT-STANDALONE-AMBIGUOUS', suite: 'engine', rule: 'Standalone ソフト keeps the reviewed Soft default while material Soft/Software ambiguity remains reviewable', input: 'ソフト', expected: 'Soft', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-SOFTWARE-CONTEXT-KAIHATSU', suite: 'engine', rule: 'Strong development context selects Software from the reviewed ソフト alternatives', input: 'ソフト開発', expected: 'Software Kaihatsu', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SOFT-CONTEXT-KUCHOU', suite: 'engine', rule: 'Descriptive context selects Soft rather than Software for ソフト', input: 'ソフトな口調', expected: 'Soft na Kuchou', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SOFT-LANDING-WHOLE-SPAN', suite: 'engine', rule: 'Reviewed whole-span source spelling outranks the ambiguity of standalone ソフト', input: 'ソフトランディング', expected: 'Soft Landing', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-PASOKON-SOFTWARE-WHOLE-SPAN', suite: 'engine', rule: 'An established Japanese clipping remains Pasokon while ソフト resolves as Software in the reviewed compound', input: 'パソコンソフト', expected: 'Pasokon Software', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ENGLISH-PREFERENCE-CATEGORY', suite: 'engine', rule: 'English-preference policy emits Category for カテゴリー', input: 'カテゴリー', expected: 'Category', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ENGLISH-PREFERENCE-PROFILE', suite: 'engine', rule: 'English-preference policy emits Profile for プロフィール', input: 'プロフィール', expected: 'Profile', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ENGLISH-PREFERENCE-PROFILE-VARIANT', suite: 'engine', rule: 'The established プロファイル variant resolves to the same familiar English spelling', input: 'プロファイル', expected: 'Profile', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-NONENGLISH-ENERGIE-RETAINED', suite: 'engine', rule: 'English preference does not replace a reviewed non-English donor when the English cognate is not the same Japanese borrowing', input: 'エネルギー', expected: 'Energie', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SAUCE-STANDALONE-AMBIGUOUS', suite: 'engine', rule: 'Standalone ソース keeps Sauce as the canonical default while Sauce/Source remains materially ambiguous', input: 'ソース', expected: 'Sauce', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-SOURCE-CODE-CONTEXT', suite: 'engine', rule: 'Strong software context selects Source from the reviewed ソース alternatives', input: 'ソースコード', expected: 'Source Code', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SAUCE-FOOD-CONTEXT', suite: 'engine', rule: 'Strong food context selects Sauce from the reviewed ソース alternatives', input: 'トマトソース', expected: 'Tomato Sauce', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SOURCE-INFORMATION-CONTEXT', suite: 'engine', rule: 'Direct information-source context selects Source from the reviewed ソース alternatives', input: '情報のソースを見る', expected: 'Jouhou no Source o Miru', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-CASH-STANDALONE-AMBIGUOUS', suite: 'engine', rule: 'Standalone キャッシュ keeps Cash as the canonical default while Cash/Cache remains materially ambiguous', input: 'キャッシュ', expected: 'Cash', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CACHE-MEMORY-CONTEXT', suite: 'engine', rule: 'Strong computing context selects Cache from the reviewed キャッシュ alternatives', input: 'キャッシュメモリ', expected: 'Cache Memory', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-CASH-DIRECT-PAYMENT-CONTEXT', suite: 'engine', rule: 'Direct payment context selects Cash from the reviewed キャッシュ alternatives', input: 'キャッシュで払う', expected: 'Cash de Harau', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ROCK-STANDALONE-AMBIGUOUS', suite: 'engine', rule: 'Standalone ロック keeps Rock as the canonical default while Rock/Lock remains materially ambiguous', input: 'ロック', expected: 'Rock', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-LOCK-RELEASE-CONTEXT', suite: 'engine', rule: 'Strong locking context selects Lock from the reviewed ロック alternatives', input: 'ロックを解除する', expected: 'Lock o Kaijo Suru', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-PASS-STANDALONE-AMBIGUOUS', suite: 'engine', rule: 'Standalone パス keeps Pass as the canonical default while Pass/Path remains materially ambiguous', input: 'パス', expected: 'Pass', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-PATH-FILE-CONTEXT', suite: 'engine', rule: 'Strong filesystem context selects Path from the reviewed パス alternatives', input: 'ファイルパス', expected: 'File Path', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-LACE-CONTEXT', suite: 'engine', rule: 'Strong textile context selects Lace from the reviewed レース alternatives', input: 'レースの布', expected: 'Lace no Nuno', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-FOAM-CONTEXT', suite: 'engine', rule: 'Strong material context selects Foam from the reviewed フォーム alternatives', input: 'フォーム素材', expected: 'Foam Sozai', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-FOAM-CONTEXT-PRESERVES-UNRELATED-REVIEW', suite: 'engine', rule: 'Resolving the Form/Foam donor ambiguity must not clear an independent lexical review signal elsewhere in the sentence', input: '泡のフォームを見る', expected: 'Awa no Foam o Miru', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-LIGHT-RIGHT-GUARD', suite: 'engine', rule: 'A nearby directional 右 is a separate argument and must not by itself reclassify ライト as Right', input: 'ライトを右に置く', expected: 'Light o Migi ni Oku', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-TRACK-MUSIC-GUARD', suite: 'engine', rule: 'Music in a separate case phrase must not by itself reclassify トラック as Track', input: 'トラックで音楽を聴く', expected: 'Track de Ongaku o Kiku', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-CODE-GUITAR-GUARD', suite: 'engine', rule: 'A guitar in a separate argument must not by itself reclassify コード as Chord', input: 'コードをギターに接続する', expected: 'Code o Guitar ni Setsuzoku Suru', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-CASH-DATA-GUARD', suite: 'engine', rule: 'A data object bought with キャッシュ must not by proximity alone reclassify the payment term as Cache', input: 'キャッシュでデータを買う', expected: 'Cash de Data o Kau', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-SAUCE-SOURCE-GUARD', suite: 'engine', rule: 'Unrelated cooking and information arguments must not silently settle the Sauce/Source ambiguity', input: 'ソースを料理の情報として記録する', expected: 'Sauce o Ryouri no Jouhou to shite Kiroku Suru', expectedRequiresReview: true },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-LACE-CURTAIN', suite: 'engine', rule: 'A direct genitive head is valid context: レースのカーテン selects Lace even when an unrelated 車 appears later', input: 'レースのカーテンを車に積む', expected: 'Lace no Curtain o Kuruma ni Tsumu', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-COAT-PREDICATE', suite: 'engine', rule: 'The governing wear predicate selects Coat while a later tennis argument must not overturn it', input: 'コートを着てテニスを見る', expected: 'Coat o Kite Tennis o Miru', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-CONTEXT-RELATION-LOCK-PREDICATE', suite: 'engine', rule: 'The governing release predicate selects Lock while later music context must not overturn it', input: 'ロックを解除して音楽を流す', expected: 'Lock o Kaijo Shite Ongaku o Nagasu', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ORDINARY-GAP-CALORIE', suite: 'engine', rule: 'Recovered everyday source-language coverage prevents mechanical output for a routine food term', input: 'カロリー', expected: 'Calorie', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ORDINARY-GAP-SOUND', suite: 'engine', rule: 'Recovered everyday source-language coverage includes common media vocabulary', input: 'サウンド', expected: 'Sound', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ORDINARY-GAP-RUGBY', suite: 'engine', rule: 'Recovered everyday source-language coverage includes common sport vocabulary', input: 'ラグビー', expected: 'Rugby', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ORDINARY-GAP-SCREEN', suite: 'engine', rule: 'Recovered everyday source-language coverage includes common display vocabulary', input: 'スクリーン', expected: 'Screen', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ORDINARY-GAP-COORDINATE', suite: 'engine', rule: 'Recovered everyday source-language coverage includes common activity/style vocabulary', input: 'コーディネート', expected: 'Coordinate', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-COURSE-CANONICAL', suite: 'engine', rule: 'Clear ordinary コース uses the established English donor spelling without unnecessary review', input: 'コース', expected: 'Course', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SARIN-CANONICAL', suite: 'engine', rule: 'Established サリン uses its reviewed international source spelling without unnecessary review', input: 'サリン', expected: 'Sarin', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-TYPE-CANONICAL', suite: 'engine', rule: 'The ordinary default for タイプ is the established donor spelling Type', input: 'タイプ', expected: 'Type', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-TOP-CANONICAL', suite: 'engine', rule: 'The ordinary default for トップ is the established donor spelling Top', input: 'トップ', expected: 'Top', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-ZERO-CANONICAL', suite: 'engine', rule: 'Ordinary ゼロ uses Zero rather than mechanical Katakana Romaji', input: 'ゼロ', expected: 'Zero', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-DRAMA-CANONICAL', suite: 'engine', rule: 'Ordinary ドラマ uses the established donor spelling Drama', input: 'ドラマ', expected: 'Drama', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-VIDEO-CANONICAL', suite: 'engine', rule: 'Ordinary ビデオ uses the established donor spelling Video', input: 'ビデオ', expected: 'Video', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-MARK-CANONICAL', suite: 'engine', rule: 'Ordinary マーク uses the established donor spelling Mark', input: 'マーク', expected: 'Mark', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-AIDS-CASING', suite: 'engine', rule: 'Established acronym loanwords preserve reviewed source casing', input: 'エイズ', expected: 'AIDS', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-MAIL-DEFAULT', suite: 'engine', rule: 'Ordinary メール defaults to Mail; the rare Male sense is incidental and does not create routine review noise', input: 'メール', expected: 'Mail', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-MARATHON-CANONICAL', suite: 'engine', rule: 'Ordinary マラソン uses the established Marathon spelling without review for an unrelated specialist sense', input: 'マラソン', expected: 'Marathon', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-LEVEL-CANONICAL', suite: 'engine', rule: 'Ordinary レベル uses Level rather than treating a rare competing spelling as material', input: 'レベル', expected: 'Level', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-SUPER-CLIPPING', suite: 'engine', rule: 'Established Japanese clipping スーパー remains Super rather than being expanded to one inferred full expression', input: 'スーパー', expected: 'Super', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-NET-CLIPPING', suite: 'engine', rule: 'Established Japanese ネット remains Net across its ordinary clipped uses rather than being expanded mechanically', input: 'ネット', expected: 'Net', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-TON-CANONICAL', suite: 'engine', rule: 'Ordinary unit トン uses Ton; spelling variants of the unit do not create routine review noise', input: 'トン', expected: 'Ton', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-PRO-CLIPPING', suite: 'engine', rule: 'Established Japanese clipping プロ remains Pro instead of being expanded to an inferred source word', input: 'プロ', expected: 'Pro', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-TERO-CLIPPING', suite: 'engine', rule: 'Established Japanese clipping テロ keeps its Japanese clipped Roman form instead of being expanded to Terrorism', input: 'テロ', expected: 'Tero', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-RISUTORA-CLIPPING', suite: 'engine', rule: 'Established Japanese clipping リストラ remains Risutora rather than being expanded or translated', input: 'リストラ', expected: 'Risutora', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-HOME-PAGE-CANONICAL', suite: 'engine', rule: 'Reviewed multiword source spelling for ホームページ preserves its internal source boundary', input: 'ホームページ', expected: 'Home Page', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-SUPER-LONGEST-SPAN', suite: 'engine', rule: 'Short Super evidence must not shadow a longer reviewed proper loanword span', input: 'スーパーマリオ', expected: 'Super Mario', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-NET-LONGEST-SPAN', suite: 'engine', rule: 'Short Net evidence must not shadow a longer reviewed Network span', input: 'ネットワーク', expected: 'Network', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-TERO-LONGEST-SPAN', suite: 'engine', rule: 'Short Tero evidence must not shadow the independently reviewed テロップ spelling', input: 'テロップ', expected: 'Telop', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-TON-NAME-GUARD', suite: 'engine', rule: 'Short Ton evidence must not swallow the reviewed country name Tonga', input: 'トンガ', expected: 'Tonga', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-PRO-PARTIAL-REVIEW', suite: 'engine', rule: 'A short Pro mapping must not make an otherwise unresolved longer Katakana span authoritative', input: 'プロゼット', expected: 'Pro Zetto', expectedRequiresReview: true },
            { id: 'MECH-LOANWORD-SARIN-PREFIX-UNKNOWN-NAME', suite: 'engine', rule: 'A shorter Sarin mapping must not make an unresolved longer Katakana name authoritative', input: 'サリンジャー', expected: 'Sarin Jaa', expectedRequiresReview: true },
            { id: 'MECH-LOANWORD-VIDEO-GAME-COMPOSITION', suite: 'engine', rule: 'Two complete reviewed loanword components may compose without a mechanical/source hybrid', input: 'ビデオゲーム', expected: 'Video Game', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-KILO-PREFIX-GUARD', suite: 'engine', rule: 'Adding a shorter Kilo mapping must not shadow a longer reviewed Kilometre span', input: 'キロメートル', expected: 'Kilometre', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-BUBBLE-PREFIX-GUARD', suite: 'engine', rule: 'Adding a shorter Bubble mapping must not shadow the longer reviewed Bubble Bobble span', input: 'バブルボブル', expected: 'Bubble Bobble', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-DUNGEON', suite: 'engine', rule: 'R0.8 ordinary katakana loanwords use source-language spelling', input: 'ダンジョン', expected: 'Dungeon' },
            { id: 'MECH-LOANWORD-LAST-GAME-WHOLE-SOURCE-SPELLING', suite: 'engine', rule: 'Reviewed whole-token source-language evidence prevents hybrid mechanical/source output for ラストゲーム', input: 'ラストゲーム', expected: 'Last Game', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-APOCALYPSE-SOURCE-SPELLING', suite: 'engine', rule: 'Reviewed dictionary evidence restores アポカリプス to its established English source spelling', input: 'アポカリプス', expected: 'Apocalypse', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-APOCALYPSE-MECHANICAL-FALLBACK', suite: 'unit', rule: 'Positive loanword metadata can mark an unresolved donor spelling reviewable without treating arbitrary Katakana as uncertain', input: 'アポカリプス with reviewed loanword identity but unresolved donor spelling', expected: 'Apokaripusu|true|missing-source-spelling-evidence', run: () => { const saved = runtimeState.loanwordDictionary.get('アポカリプス'); const savedMetadata = runtimeState.loanwordMetadataDictionary.get('アポカリプス'); const savedSpan = runtimeState.authoritativeSpanDictionary.get('アポカリプス'); runtimeState.loanwordDictionary.delete('アポカリプス'); runtimeState.authoritativeSpanDictionary.delete('アポカリプス'); runtimeState.loanwordMetadataDictionary.set('アポカリプス', { category: 'ordinary-gairaigo', requiresReview: true, reviewReason: 'Reviewed loanword identity; donor spelling unresolved.', ambiguitySignificance: null, alternates: [], context: null }); const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('アポカリプス'); const diagnostics = runtimeState.lastTranslationDiagnostics || {}; const flag = (diagnostics.redFlags || []).some(item => item.flag === 'missing-source-spelling-evidence') ? 'missing-source-spelling-evidence' : 'missing'; return `${output}|${Boolean(diagnostics.requiresReview)}|${flag}`; } finally { runtimeState.captureTranslationDiagnostics = previous; if (saved) runtimeState.loanwordDictionary.set('アポカリプス', saved); else runtimeState.loanwordDictionary.delete('アポカリプス'); if (savedMetadata) runtimeState.loanwordMetadataDictionary.set('アポカリプス', savedMetadata); else runtimeState.loanwordMetadataDictionary.delete('アポカリプス'); if (savedSpan) runtimeState.authoritativeSpanDictionary.set('アポカリプス', savedSpan); } } },
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
            { id: 'R0-LOANWORD-QUEST', suite: 'engine', rule: 'R0.8 exact reviewed whole-title source spelling outranks partial mechanical Katakana analysis', input: 'サクラクエスト', expected: 'Sakura Quest', expectedRequiresReview: false },
            { id: 'R0-LOANWORD-AQUATOPE', suite: 'engine', rule: 'R0.8 アクアトープ preserves the established source-language spelling', input: '白い砂のアクアトープ', expected: 'Shiroi Suna no Aquatope' },
            { id: 'R0-FOREIGN-NAME-DARWIN', suite: 'engine', rule: 'R0.8 a foreign name written in Katakana uses its source spelling', input: 'ダーウィン事変', expected: 'Darwin Jihen' },
            { id: 'DIFF-OMITAMA', suite: 'engine', rule: 'Reviewed place-name evidence corrects 小美玉 without changing general name ranking', input: '小美玉', expected: 'Omitama' },
            { id: 'R0-KATAKANA-SOKUON-REVIEWED-LOANWORD', suite: 'engine', rule: 'A reviewed source-language loanword containing ッ keeps its reviewed source spelling', input: 'ペット', expected: 'Pet' },
            { id: 'R0-KATAKANA-NONGEMINATIVE-SOKUON-QAWWALI', suite: 'engine', rule: 'A complete reviewed source-language loanword span may carry a source spelling whose Katakana sokuon is not mechanically geminative', input: 'カッワーリー', expected: 'Qawwali', expectedRequiresReview: false },
            { id: 'R0-KATAKANA-NONGEMINATIVE-SOKUON-NUTELLA', suite: 'engine', rule: 'A second independently reviewed source-language loanword confirms that non-geminative sokuon safety does not override complete lexical evidence', input: 'ヌテッラ', expected: 'Nutella', expectedRequiresReview: false },
            { id: 'STRESS-VS-NAME-KAMIKI', suite: 'engine', rule: 'Variation selectors do not defeat reviewed whole-name lookup', input: '神︀木隆之介', expected: 'Kamiki Ryuunosuke' },
            { id: 'STRESS-ATEJI-TEMPURA', suite: 'engine', rule: 'Exact ateji evidence wins across misleading token boundaries', input: '天婦羅', expected: 'Tenpura' },
            { id: 'STRESS-NAME-HONORIFIC-KAMIKI', suite: 'engine', rule: 'A reviewed whole-name reading survives an attached honorific', input: '神木隆之介さん', expected: 'Kamiki Ryuunosuke san', expectedRequiresReview: false },
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
            { id: 'TITLE-MONONOKE-MENTION-PARTICLE', suite: 'engine', rule: 'Exact complete-title evidence remains applicable when the reviewed title is mentioned as a bounded noun before a grammatical particle', input: 'モノノ怪を見る', expected: 'Mononoke o Miru', expectedRequiresReview: false },
            { id: 'TITLE-BAKUMAN-MENTION-PARTICLE', suite: 'engine', rule: 'Bounded title-mention handling applies across independently reviewed exact titles rather than only to Mononoke', input: 'バクマンを読む', expected: 'Bakuman o Yomu', expectedRequiresReview: false },
            { id: 'TITLE-MONONOKE-MENTION-PREFIX-GUARD', suite: 'engine', rule: 'Exact title-mention evidence does not reinterpret a reviewed title surface when it is merely the prefix of a longer lexical string', input: 'モノノ怪計画', expected: 'Mono no Kai Keikaku', expectedRequiresReview: false },
            { id: 'TITLE-MONONOKE-MENTION-PRECEDED-BY-PARTICLE', suite: 'engine', rule: 'An exact reviewed title remains a bounded title mention when normal Japanese syntax places a grammatical particle immediately before it', input: '私はモノノ怪を見る', expected: 'Watashi wa Mononoke o Miru', expectedRequiresReview: false },
            { id: 'TITLE-BAKUMAN-MENTION-PRECEDED-BY-PARTICLE', suite: 'engine', rule: 'Preceding-particle title boundaries generalise across independently reviewed exact titles', input: '私はバクマンを読む', expected: 'Watashi wa Bakuman o Yomu', expectedRequiresReview: false },
            { id: 'TITLE-MONONOKE-MENTION-COPULA-BOUNDARY', suite: 'unit', rule: 'A following grammatical auxiliary can bound an exact reviewed title mention without requiring punctuation or whitespace', input: 'これはモノノ怪です', expected: 'true', run: () => { const source = 'これはモノノ怪です'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.category === 'title' && item.sourceSurface === 'モノノ怪' && item.romaji === 'Mononoke')); } },
            { id: 'TITLE-MONONOKE-MENTION-LEFT-PREFIX-GUARD', suite: 'unit', rule: 'Neighbouring grammatical-boundary support does not turn an exact title surface into a title when it is attached to a lexical prefix', input: '新モノノ怪を見る', expected: 'false', run: () => { const source = '新モノノ怪を見る'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.category === 'title' && item.sourceSurface === 'モノノ怪')); } },
            { id: 'TITLE-MONONOKE-MENTION-RIGHT-LEXICAL-PREFIX-GUARD', suite: 'unit', rule: 'A following lexical token beginning with particle-like kana does not establish a grammatical title boundary by raw string prefix alone', input: 'モノノ怪はちみつ', expected: 'false', run: () => { const source = 'モノノ怪はちみつ'; const tokens = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); return String(discoverSourceSpanCandidates(source, tokens, {}).some(item => item.category === 'title' && item.sourceSurface === 'モノノ怪')); } },
            { id: 'MECH-CANDIDATE-DISCOVERY-TITLE-RANGE-OWNERSHIP', suite: 'unit', rule: 'Context-scoped title candidate discovery attaches evidence only to the source occurrence contained by the matching title context', input: '光を見る。光が死んだ夏', expected: '5-6', run: () => discoverSourceSpanCandidates('光を見る。光が死んだ夏', [], {}).filter(candidate => candidate.category === 'title' && candidate.sourceSurface === '光' && candidate.romaji === 'Hikaru').map(candidate => `${candidate.sourceStart}-${candidate.sourceEnd}`).join('|') },
            { id: 'MECH-PROPER-NAME-KATAKANA-NO-WHOLE-EVIDENCE', suite: 'engine', rule: 'Unique whole-name evidence prevents lexical Katakana ノ inside an attested proper name from being treated as a grammatical particle', input: '貴ノ花', expected: 'Takanohana', expectedRequiresReview: false },
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
            { id: 'STRESS-NAME-HONORIFIC-TSUNEOKI', suite: 'engine', rule: 'A reviewed name span survives an honorific even when Kuromoji overshoots the final name token', input: '池田恒興さん', expected: 'Ikeda Tsuneoki san', expectedRequiresReview: false },
            { id: 'STRESS-LATIN-APOSTROPHE', suite: 'engine', rule: 'Existing Latin source spelling and punctuation pass through unchanged', input: "Heaven's Feel", expected: "Heaven's Feel" },
            { id: 'MECH-LOANWORD-TERMINAL-PUNCT-MIXED-SCRIPT-VTUBER', suite: 'engine', rule: 'Terminal punctuation cannot make Latin passthrough erase the end boundary of an exact reviewed mixed-script donor spelling', input: 'Ｖチューバー！', expected: 'VTuber!', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-TERMINAL-PUNCT-CATCH22', suite: 'engine', rule: 'Terminal punctuation cannot make Latin/number passthrough erase an exact reviewed donor spelling whose canonical output differs from literal source passthrough', input: 'キャッチ２２？', expected: 'Catch-22?', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-TITLE-TERMINAL-PUNCT-3X3EYES', suite: 'engine', rule: 'Terminal punctuation cannot make Latin passthrough erase the immutable boundary required by reviewed mixed-script title evidence', input: '3×3EYES！', expected: 'Sazan Eyes!', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-OVERSIZED-LOANWORD-IRON-MAIDEN', suite: 'engine', rule: 'An oversized Kuromoji token cannot hide the boundary between adjacent reviewed loanword spans', input: 'アイアン・メイデンフィギュア', expected: 'Iron Maiden Figure', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-OVERSIZED-REVIEWED-NAME-NAUSICAA', suite: 'engine', rule: 'A reviewed proper-name span remains selectable when Kuromoji absorbs a following reviewed lexical span into the same token', input: 'ナウシカフィギュア', expected: 'Nausicaa Figure', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-OVERSIZED-REVIEWED-READING-KIKUIN', suite: 'engine', rule: 'A reviewed reading span may repair a tokenizer boundary inside a larger token without allowing weaker overlapping lexical evidence to steal the span', input: '掬飲物語', expected: 'Kikuin Monogatari', expectedRequiresReview: false },
            { id: 'MECH-BOUNDARY-ARBITRATION-OVERSIZED-SUBSTRING-INVERSE-KENTURIA', suite: 'engine', rule: 'A reviewed loanword substring alone cannot force segmentation inside an unrelated larger lexical token', input: 'ケントゥリア', expected: 'Kenturia', expectedRequiresReview: false },
            { id: 'STRESS-LOANWORD-ICE-CREAM', suite: 'engine', rule: 'Expanded reviewed source-language evidence preserves Ice Cream', input: 'アイスクリーム', expected: 'Ice Cream' },
            { id: 'STRESS-FOREIGN-NAME-EINSTEIN', suite: 'engine', rule: 'Expanded reviewed foreign-name evidence preserves the source spelling Einstein', input: 'アインシュタイン', expected: 'Einstein' },
            { id: 'SYS-LOANWORD-CAKE', suite: 'engine', rule: 'Reviewed source-language loanword evidence is used instead of phonetic katakana Romanisation', input: 'ケーキを食べる。', expected: 'Cake o Taberu.' },
            { id: 'MECH-LOANWORD-ORCHESTRA-CORROBORATED', suite: 'engine', rule: 'Independently corroborated ordinary loanword evidence supplies source-language spelling without relying on long-vowel heuristics', input: 'オーケストラ', expected: 'Orchestra', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-CARD-SOURCE-AMBIGUITY', suite: 'engine', rule: 'A dominant established donor spelling is emitted directly when a rare alternative is only incidental', input: 'カード', expected: 'Card', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-TELEVISION-CLIPPING-REVIEW', suite: 'engine', rule: 'An established Japanese clipping keeps its conventional Roman clipping rather than expanding to the donor-language full form', input: 'テレビ', expected: 'Terebi', expectedRequiresReview: false },
            { id: 'SYS-FOREIGN-NAME-JACK-SKELLINGTON', suite: 'engine', rule: 'A reviewed Western full-name span preserves the source spelling across the middle dot', input: 'ジャック・スケリントンです。', expected: 'Jack Skellington desu.' },
            { id: 'MECH-LOANWORD-REVIEWED-DOTTED-SURFACE-STAR-TREK', suite: 'engine', rule: 'An independently verified dotted Katakana title surface may use its exact reviewed source-language spelling without inferring a generic middle-dot alias', input: 'スター・トレックを見る', expected: 'Star Trek o Miru', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-SOURCE-SPELLING-OUTRANKS-DICTIONARY-NAME', suite: 'engine', rule: 'Reviewed source-language spelling outranks a lower-authority Kuromoji proper-name reading over the same dotted Katakana span', input: 'コカ・コーラ', expected: 'Coca-Cola', expectedRequiresReview: false },
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
            { id: 'MECH-PROPER-NAME-KOHINATA-MINORU-TITLE', suite: 'engine', rule: 'Reviewed whole-name evidence resolves 小日向海流 inside the published title even when surrounding lexical material remains independently analysed', input: '空手小公子小日向海流', expected: 'Karate Shoukoushi Kohinata Minoru', expectedRequiresReview: true },
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
            { id: 'CHECK-NAME-GURREN-LAGANN-GENERAL-SUFFIX', suite: 'engine', rule: 'A general Japanese suffix following a reviewed proper-name span keeps an output word boundary instead of attaching to the canonical name spelling', input: 'グレンラガン展', expected: 'Gurren Lagann Ten', expectedRequiresReview: false },
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
            { id: 'MECH-LOANWORD-ENGLISH-PREFERENCE-EUROPE', suite: 'engine', rule: 'English-preference policy uses Europe where the English form is a genuine source-spelling match', input: 'ヨーロッパ', expected: 'Europe', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-DUTCH-SOURCE', suite: 'engine', rule: 'Reviewed Dutch-source lexical evidence wins over phonetic Katakana romanisation for a safe full-source loanword', input: 'ガラス', expected: 'Glas', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-AUTHORITATIVE-CASE-EBAY', suite: 'engine', rule: 'Reviewed source-language brand casing is preserved exactly and is not rewritten by title-style output capitalisation', input: 'イーベイ', expected: 'eBay', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-LOANWORD-SPACEX-ALIAS', suite: 'engine', rule: 'Normalised mixed-script aliases resolve to the same reviewed source-language spelling without losing internal brand casing', input: 'スペースX', expected: 'SpaceX', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-HOMOGRAPH-BUS-PRECEDENCE', suite: 'engine', rule: 'Existing reviewed CJ2R homograph decisions retain precedence over conflicting external source-language candidates', input: 'バス', expected: 'Bus', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-AUTHORITY-UNCTAD', suite: 'engine', rule: 'Reviewed organisation evidence preserves the established source acronym instead of expanding it into a descriptive English name', input: 'アンクタッド', expected: 'UNCTAD', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-UNVERIFIED-PARTIAL-SOURCE-EXCLUDED', suite: 'engine', rule: 'A source-language phrase whose full-versus-partial status cannot be proven is excluded instead of being promoted as authoritative output', input: 'カボチャ', expected: 'Kabocha', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-STREET-FIGHTER', suite: 'engine', rule: 'A named-entity work translation cannot replace the Rule-0 source spelling represented by the Japanese Katakana surface', input: 'ストリートファイター', expected: 'Street Fighter', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-MACH-GO-GO-GO', suite: 'engine', rule: 'A localised work title cannot replace the independently verified primary Roman name of the original Japanese work', input: 'マッハゴーゴーゴー', expected: 'Mach Go Go Go', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-DIVER', suite: 'engine', rule: 'A foreign original title cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザダイバー', expected: 'The Diver', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-AGENT', suite: 'engine', rule: 'A foreign original title cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザエージェント', expected: 'The Agent', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-CLIPPING-DYUEMA', suite: 'engine', rule: 'An established Japanese clipping remains in its clipped Roman form instead of being expanded to the historical full donor expression', input: 'デュエマ', expected: 'Dyuema', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-CLIPPING-POKEKA', suite: 'engine', rule: 'An established Japanese clipping remains in its clipped Roman form instead of being expanded to the historical full donor expression', input: 'ポケカ', expected: 'Pokeka', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-CLIPPING-AJIKAN', suite: 'engine', rule: 'A Japanese proper-name clipping remains the Japanese clipped form rather than being expanded to the complete foreign band name', input: 'アジカン', expected: 'Ajikan', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-CLIPPING-RECCHIRI', suite: 'engine', rule: 'A Japanese proper-name clipping remains the Japanese clipped form rather than being expanded to the complete foreign band name', input: 'レッチリ', expected: 'Recchiri', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-LAST-SUMMER-2', suite: 'engine', rule: 'An original English work title cannot replace the English source components encoded by the Japanese localised title', input: 'ラストサマー２', expected: 'Last Summer 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-MICRO-KIDS', suite: 'engine', rule: 'A different original work title cannot replace the source-language components encoded by the Japanese localised title', input: 'ミクロキッズ', expected: 'Micro Kids', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-JEKYLL-HYDE', suite: 'engine', rule: 'A work identity cannot replace the reviewed source spellings directly represented by a Japanese localised title', input: 'ジキル＆ハイド', expected: 'Jekyll & Hyde', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-PINK-PANTHER-2', suite: 'engine', rule: 'A different original work title cannot replace the source-language components encoded by the Japanese localised sequel title', input: 'ピンクパンサー２', expected: 'Pink Panther 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-SECRET-SERVICE', suite: 'engine', rule: 'A foreign original title cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザシークレットサービス', expected: 'The Secret Service', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-DROPPERS', suite: 'engine', rule: 'An alternate work identity cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザドロッパーズ', expected: 'The Droppers', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-PRODUCER', suite: 'engine', rule: 'A work-identity title cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザプロデューサー', expected: 'The Producer', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-MONSTER', suite: 'engine', rule: 'A work-identity title cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザモンスター', expected: 'The Monster', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-LAST-STUNT', suite: 'engine', rule: 'A work-identity title cannot replace the source spelling directly encoded by the Japanese Katakana title', input: 'ザラストスタント', expected: 'The Last Stunt', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-SCARECROW', suite: 'engine', rule: 'A different original work title cannot replace the source spelling encoded by ザ・スケアクロウ', input: 'ザスケアクロウ', expected: 'The Scarecrow', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-GAMBLER', suite: 'engine', rule: 'A longer work identity cannot replace the source spelling encoded by ザ・ギャンブラー', input: 'ザギャンブラー', expected: 'The Gambler', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-DECLINE', suite: 'engine', rule: 'An unrepresented original-title continuation cannot be injected after the source form encoded by ザ・デクライン', input: 'ザデクライン', expected: 'The Decline', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-GREAT-FIGHTER', suite: 'engine', rule: 'An unrelated original title cannot replace the source words encoded by ザ・グレート・ファイター', input: 'ザグレートファイター', expected: 'The Great Fighter', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-BIG-BATTLE', suite: 'engine', rule: 'International work aliases cannot replace the source words encoded by ザ・ビッグ・バトル', input: 'ザビッグバトル', expected: 'The Big Battle', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-KILLER-BEES', suite: 'engine', rule: 'A shorter original title cannot discard source material present in ザ・キラー・ビーズ', input: 'ザキラービーズ', expected: 'The Killer Bees', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-CRITTERS-2', suite: 'engine', rule: 'An original-title subtitle absent from クリッター2 cannot be injected into CJ2R output', input: 'クリッター２', expected: 'Critters 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-SCANNERS-2', suite: 'engine', rule: 'An original-title subtitle absent from スキャナーズ2 cannot be injected into CJ2R output', input: 'スキャナーズ２', expected: 'Scanners 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-BEN-HUR', suite: 'engine', rule: 'A source-title subtitle absent from ベン・ハー cannot be injected into CJ2R output', input: 'ベン・ハー', expected: 'Ben-Hur', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-TEXAS-SWAT', suite: 'engine', rule: 'An original film identity cannot replace the mixed-script source title テキサスSWAT', input: 'テキサスＳＷＡＴ', expected: 'Texas SWAT', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-VAMP-2', suite: 'engine', rule: 'An original work title cannot replace the localised source form encoded by ヴァンプ2', input: 'ヴァンプ２', expected: 'Vamp 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-WORK-TRANSLATION-ALIAS-DOLLS-2', suite: 'engine', rule: 'An original work title cannot replace the localised source form encoded by ドールズ2', input: 'ドールズ２', expected: 'Dolls 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-AH-POOK', suite: 'engine', rule: 'A JMnedict work identity cannot append collection-title material absent from the Japanese loanword title', input: 'アプークイズヒア', expected: 'Ah Pook Is Here', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-TOM-JONES', suite: 'engine', rule: 'A full original literary title cannot replace the proper-name source form encoded by the Japanese title', input: 'トムジョウンズ', expected: 'Tom Jones', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-LIFE-HEALING', suite: 'engine', rule: 'An original English book title cannot replace the source words encoded by the Japanese loanword title', input: 'ライフ・ヒーリング', expected: 'Life Healing', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-HOT-SHOTS-2', suite: 'engine', rule: 'A sequel subtitle absent from the Japanese title cannot be injected even when it belongs to the same work', input: 'ホット・ショット２', expected: 'Hot Shots! 2', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-SOURCE-TITLE-LOST-WORLD-JURASSIC-PARK', suite: 'engine', rule: 'Canonical source spelling may restore articles and punctuation but must not discard source components explicitly represented in the Japanese title', input: 'ロストワールドジュラシックパーク', expected: 'The Lost World: Jurassic Park', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-JMNEDICT-LOCAL-TITLE-LOVE-CATASTROPHE', suite: 'engine', rule: 'An original title cannot inject an unrepresented adjective or plural ending into a Japanese localised loanword title', input: 'ラヴ＆カタストロフィ', expected: 'Love & Catastrophe', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-CLIPPING-AINEKU', suite: 'engine', rule: 'An established Japanese abbreviation must not be expanded back into the complete foreign work title', input: 'アイネク', expected: 'Aineku', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-CLIPPING-CUT-SEW', suite: 'engine', rule: 'An established Japanese clipping must remain clipped instead of reconstructing the donor expression cut and sewn', input: 'カットソー', expected: 'Kattosoo', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-RULE0-NONENGLISH-ILIAS', suite: 'engine', rule: 'A non-English donor spelling must not be replaced by an English translated title', input: 'イリアス', expected: 'Ilias', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-PARTIAL-ENTITY-DEVIL-RAYS', suite: 'engine', rule: 'A reviewed entity identity must not inject source words absent from the Japanese surface', input: 'デビルレイズ', expected: 'Devil Rays', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-LOCALISED-SUBTITLE-RUNDOWN', suite: 'engine', rule: 'Canonical source spelling may restore The Rundown but must preserve the additional loanword subtitle explicitly present in Japanese', input: 'ランダウン・ロッキングザアマゾン', expected: 'The Rundown Rocking the Amazon', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-PRODUCT-NO-ENTITY-EXPANSION-KRAZY-SALT', suite: 'engine', rule: 'A product identity cannot inject brand-owner or omitted descriptor words beyond the source form represented by the Japanese surface', input: 'キレイジーソールト', expected: 'Krazy Salt', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-ADVERSARIAL-REVIEWED-SURNAME', suite: 'engine', rule: 'Reviewed whole-name evidence overrides misleading kanji-by-kanji token readings for an attested specialised surname', input: '霧切', expected: 'Kirigiri', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-ADVERSARIAL-SPECIAL-GIVEN-NAME', suite: 'engine', rule: 'Reviewed whole-name evidence preserves an attested specialised Japanese name reading instead of literal kanji readings', input: '縁寿', expected: 'Enje', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-ADVERSARIAL-JAPANESE-PERSON-ORDER', suite: 'engine', rule: 'Verified Japanese personal-name evidence uses the attested complete reading and keeps Japanese surname-given-name order', input: '宮崎駿', expected: 'Miyazaki Hayao', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-ADVERSARIAL-OFFICIAL-PRESENTATION', suite: 'engine', rule: 'Authoritative official Roman presentation can establish a complete Japanese personal name when it agrees with the Japanese reading and order', input: '月ノ美兎', expected: 'Tsukino Mito', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-ADVERSARIAL-TITLE-SOURCE-SPELLING', suite: 'engine', rule: 'Reviewed title loanwords use verified source-language spelling instead of mechanical Katakana romanisation', input: 'スパイファミリー', expected: 'Spy Family', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-ADVERSARIAL-OFFICIAL-NAME-SOURCE-SPELLING', suite: 'engine', rule: 'Reviewed organisation names use their verified official source-language form', input: '京都アニメーション', expected: 'Kyoto Animation', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-ADVERSARIAL-ATEJI-SOURCE-SPELLING', suite: 'engine', rule: 'Verified ateji loanword material can restore the source-language merchandise term without semantic translation', input: '缶バッジ', expected: 'Can Badge', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-AUTHORITY-CAN-COFFEE', suite: 'engine', rule: 'Reviewed foreign-derived components outrank a lower-authority whole-span phonetic lexical reading without translating the Japanese compound into idiomatic English', input: '缶コーヒー', expected: 'Can Coffee', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-AUTHORITY-GRAMMAR-BOUNDARY', suite: 'engine', rule: 'A following grammatical boundary cannot authorise lexical reconstruction across protected reviewed source-language component boundaries', input: 'ドラム缶と缶コーヒー', expected: 'Drum Can to Can Coffee', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-AUTHORITY-CAN-COFFEE-HALFWIDTH', suite: 'engine', rule: 'Width normalisation preserves the reviewed source-language component boundary in a mixed Kanji and half-width Katakana loanword compound', input: '缶ｺｰﾋｰ', expected: 'Can Coffee', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-AUTHORITY-CAN-COFFEE-STRUCTURE', suite: 'unit', rule: 'A lower-authority whole-span lexical candidate cannot erase an immutable reviewed source-language component boundary', input: '缶コーヒー structural audit', expected: 'Can Coffee:true:false', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('缶コーヒー'); const diagnostics = runtimeState.lastTranslationDiagnostics || {}; return `${output}:${String(Boolean(diagnostics.structuralValidation?.valid))}:${String(Boolean(diagnostics.requiresReview))}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
            { id: 'MECH-LOANWORD-ADVERSARIAL-SOURCE-PUNCTUATION', suite: 'engine', rule: 'Verified source-title punctuation is preserved when it is part of the reviewed source-language form', input: 'パズル＆ドラゴンズ', expected: 'Puzzle & Dragons', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-OFFICIAL-COMPANY-TECHNOS', suite: 'engine', rule: 'A verified foreign company name is restored in its official source-language form rather than mechanically romanised or descriptively expanded', input: 'テクノス', expected: 'TECHNOS JAPAN CORP.', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-OFFICIAL-COMPANY-AISIN-AW', suite: 'engine', rule: 'Verified official company punctuation is preserved as part of the reviewed source-language name', input: 'アイシン・エイ・ダブリュ', expected: 'Aisin AW Co., Ltd.', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-GHOST', suite: 'engine', rule: 'Independently reviewed ordinary donor spelling applies to ゴースト in a fresh mixed-script hobby context without requiring a title-specific override', input: 'MFゴーストを読む', expected: 'MF Ghost o Yomu', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-RANK', suite: 'engine', rule: 'Independently reviewed ordinary donor spelling applies to ランク after a Latin classification prefix instead of falling back to mechanical Katakana Romaji', input: 'Sランク冒険者', expected: 'S Rank Boukensha', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-VTUBER', suite: 'engine', rule: 'Reviewed mixed-script Vチューバー evidence restores the established VTuber spelling and accepts width-equivalent Latin input through normalisation', input: 'Vチューバー文化', expected: 'VTuber Bunka', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-VTUBER-FULLWIDTH', suite: 'engine', rule: 'Width-equivalent Vチューバー input resolves to the same reviewed VTuber spelling without requiring a duplicate runtime rule', input: 'Ｖチューバー文化', expected: 'VTuber Bunka', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-GHOST-WHOLE-GUARD', suite: 'engine', rule: 'Adding ordinary ゴースト evidence does not override a stronger existing reviewed whole-expression mapping that already owns the complete source span', input: 'ゴーストレストラン', expected: 'Ghost Restaurant', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-RANK-WHOLE-GUARD', suite: 'engine', rule: 'Adding ordinary ランク evidence preserves the stronger existing reviewed whole-expression mapping for ランクイン', input: 'ランクイン', expected: 'Rank In', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-PREFIX-COLLISION-GUARD', suite: 'engine', rule: 'A newly reviewed shorter loanword component cannot force-prefix split an unrelated longer Katakana token when no complete reviewed segmentation exists', input: 'ランクル', expected: 'Rankuru', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-GHOSTWRITER-WHOLE', suite: 'engine', rule: 'Reviewed whole donor evidence outranks partial ゴースト component composition for the established loanword ゴーストライター', input: 'ゴーストライター', expected: 'Ghostwriter', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-GHOST-TOWN-WHOLE', suite: 'engine', rule: 'Reviewed whole donor evidence preserves the established two-word source expression for ゴーストタウン instead of leaving a mechanical Katakana remainder', input: 'ゴーストタウン', expected: 'Ghost Town', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-COMPONENT-COVERAGE-RANK-UP-WHOLE', suite: 'engine', rule: 'Reviewed whole wasei-eigo evidence renders ランクアップ as Rank Up rather than a source-spelling root followed by an unresolved mechanical remainder', input: 'ランクアップ', expected: 'Rank Up', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-HYBRID-TOURNAMENT-SPAN', suite: 'engine', rule: 'Reviewed hybrid-span evidence keeps 決勝 in Romaji while restoring the donor spelling Tournament for the Katakana loanword segment', input: '決勝トーナメント', expected: 'Kesshou Tournament', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-HIGHSCHOOL-DXD-CROSS-CONTEXT', suite: 'engine', rule: 'Reviewed title context on both operands establishes literal × presentation in ハイスクールD×D and clears the otherwise correct cross-notation review warning', input: 'ハイスクールD×D', expected: 'High School D×D', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-UNSCOPED-CROSS-CONTROL', suite: 'engine', rule: 'A generic Latin × expression remains reviewable when no scoped title evidence establishes how the cross notation should be interpreted', input: 'A×B', expected: 'A×B', expectedRequiresReview: true },
            { id: 'MECH-MIXED-SCRIPT-SOURCE-COLON-REZERO', suite: 'engine', rule: 'Colon normalisation preserves source adjacency when a Latin prefix is immediately followed by Japanese title text', input: 'Re:ゼロから始める異世界生活', expected: 'Re:Zero kara Hajimeru Isekai Seikatsu', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-SOURCE-COLON-NIER', suite: 'engine', rule: 'Already-Latin source text retains an intentionally tight colon instead of receiving sentence-style whitespace', input: 'NieR:Automata', expected: 'NieR:Automata', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-SOURCE-COLON-SPACED-CONTROL', suite: 'engine', rule: 'Source colon preservation does not remove an intentional source space after the colon in ordinary Latin text', input: 'Label: Example', expected: 'Label: Example', expectedRequiresReview: false },
            { id: 'MECH-MIXED-SCRIPT-SOURCE-COLON-FULLWIDTH-CONTROL', suite: 'engine', rule: 'Japanese full-width colon punctuation retains sentence-style spacing rather than inheriting tight ASCII title-colon presentation', input: 'Label：Example', expected: 'Label: Example', expectedRequiresReview: false },
            { id: 'MECH-LOANWORD-LOVE-LIVE-SUNSHINE-PUNCTUATION', suite: 'engine', rule: 'Loanword source spellings exclude punctuation supplied separately by the Japanese source so Love Live punctuation is not duplicated and Sunshine uses its donor spelling', input: 'ラブライブ！サンシャイン!!', expected: 'Love Live! Sunshine!!', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-COMPONENT-SHINZOU', suite: 'engine', rule: 'A destructively split given-name component may use its unique person-name reading when an independent full JMnedict person name corroborates the same component reading', input: '晋三', expected: 'Shinzou', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-VARIANT-SHINZOU', suite: 'engine', rule: 'A name-only kanji variant uses the same corroborated personal-name component authority without losing the whole component during canonical re-tokenisation', input: '晉三', expected: 'Shinzou', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-FULL-CONTEXT-ABE', suite: 'engine', rule: 'The corroborated given-name repair remains valid inside the independently attested full personal name', input: '安倍晋三', expected: 'Abe Shinzou', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-DIFFERENT-NAME-MASAMUNE', suite: 'engine', rule: 'The authority rule generalises beyond the discovery name when another unique component reading is independently corroborated by a full personal name', input: '政宗', expected: 'Masamune', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-FULL-CONTEXT-DATE', suite: 'engine', rule: 'The generalised component repair composes with its corroborating surname context', input: '伊達政宗', expected: 'Date Masamune', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-COMMON-WORD-GUARD', suite: 'engine', rule: 'Corroborated person-name evidence does not reclassify an already settled reviewed common-word reading over the same span', input: '百合', expected: 'Yuri', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-CORROBORATED-PREFIX-CONTINUATION-GUARD', suite: 'engine', rule: 'A corroborated personal-name prefix is not reconstructed through an adjoining lexical continuation unless an independent source boundary justifies that span', input: '晋三物語', expected: 'Susumu San Monogatari', expectedRequiresReview: true },
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
            { id: 'SCHEMA-COMMON-GODAN-RA-VALID', suite: 'unit', rule: 'A reviewed godan-ra common-word lemma is accepted only when both the source surface and reading carry the required る ending', input: '告る / こくる / godan-ra', expected: 'accepted', run: () => { try { validateAssetSchema('commonWords', [{ surface: '告る', reading: 'こくる', conjugationClass: 'godan-ra', source: 'qa-fixture' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-COMMON-GODAN-RA-SURFACE-GUARD', suite: 'unit', rule: 'A godan-ra label cannot silently attach to a common-word surface that lacks the required る ending', input: '告 / こくる / godan-ra', expected: 'rejected', run: () => { try { validateAssetSchema('commonWords', [{ surface: '告', reading: 'こくる', conjugationClass: 'godan-ra', source: 'qa-fixture' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-COMMON-GODAN-RA-READING-GUARD', suite: 'unit', rule: 'A godan-ra label cannot silently attach to a common-word reading that lacks the required る ending', input: '告る / こく / godan-ra', expected: 'rejected', run: () => { try { validateAssetSchema('commonWords', [{ surface: '告る', reading: 'こく', conjugationClass: 'godan-ra', source: 'qa-fixture' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SYS-KANA-RESCUE-GRAMMATICAL-TAIL-GUARD', suite: 'unit', rule: 'Reverse kana lexical evidence cannot swallow a grammatical tail after a verb stem', input: '食べ + て + い + ない', expected: '食べ|て|い|ない', run: () => mergeKanaLexicalReadingTokens([{ surface_form: '食べ', reading: 'タベ', pronunciation: 'タベ', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる' }, { surface_form: 'て', reading: 'テ', pronunciation: 'テ', pos: '助詞', pos_detail_1: '接続助詞', basic_form: 'て' }, { surface_form: 'い', reading: 'イ', pronunciation: 'イ', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる' }, { surface_form: 'ない', reading: 'ナイ', pronunciation: 'ナイ', pos: '助動詞', pos_detail_1: '*', basic_form: 'ない' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-KANA-RESCUE-ANNAI-PRESERVED', suite: 'unit', rule: 'The grammatical-tail guard preserves legitimate all-kana lexical rescue', input: 'あん + ない', expected: 'あんない', run: () => mergeKanaLexicalReadingTokens([{ surface_form: 'あん', reading: 'アン', pronunciation: 'アン', pos: '名詞', pos_detail_1: '一般', basic_form: 'あん' }, { surface_form: 'ない', reading: 'ナイ', pronunciation: 'ナイ', pos: '助動詞', pos_detail_1: '*', basic_form: 'ない' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-KANA-RESCUE-TOKYO-PRESERVED', suite: 'unit', rule: 'The grammatical-tail guard preserves a multi-token whole-kana lexical reading', input: 'とう + きょう', expected: 'とうきょう', run: () => mergeKanaLexicalReadingTokens([{ surface_form: 'とう', reading: 'トウ', pronunciation: 'トウ', pos: '名詞', pos_detail_1: '一般', basic_form: 'とう' }, { surface_form: 'きょう', reading: 'キョウ', pronunciation: 'キョウ', pos: '名詞', pos_detail_1: '一般', basic_form: 'きょう' }]).map(token => token.surface_form).join('|') },
            { id: 'SYS-MORPH-NEGATIVE-AUX-RECLASSIFIED', suite: 'unit', rule: 'Direct negative inflection remains attached even when a later lexical repair has relabelled the auxiliary token as a noun while retaining Kuromoji conjugation metadata', input: '書か + なかった(名詞誤分類/特殊・ナイ)', expected: 'direct-negative-inflection', run: () => annotateMorphologicalOutputBoundaries([{ surface_form: '書か', pos: '動詞', pos_detail_1: '自立', basic_form: '書く', conjugated_form: '未然形' }, { surface_form: 'なかった', pos: '名詞', pos_detail_1: '一般', basic_form: 'ない', conjugated_type: '特殊・ナイ', conjugated_form: '連用タ接続' }])[1]?.morphologicalJoinReason || 'missing' },
            { id: 'SYS-MORPH-CAUSATIVE-PASSIVE-BRIDGE', suite: 'unit', rule: 'A Kuromoji サ変 misanalysis between a verb irrealis stem and passive suffix is repaired from conjugation metadata rather than lexical surface identity', input: '待た + さ(する/未然レル接続) + れる', expected: 'contracted-causative-passive-bridge', run: () => annotateMorphologicalOutputBoundaries([{ surface_form: '待た', pos: '動詞', pos_detail_1: '自立', basic_form: '待つ', conjugated_form: '未然形' }, { surface_form: 'さ', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_type: 'サ変・スル', conjugated_form: '未然レル接続' }, { surface_form: 'れる', pos: '動詞', pos_detail_1: '接尾', basic_form: 'れる', conjugated_type: '一段', conjugated_form: '基本形' }])[1]?.morphologicalJoinReason || 'missing' },
            { id: 'SYS-MORPH-CAUSATIVE-PASSIVE-BRIDGE-GUARD', suite: 'unit', rule: 'The causative-passive bridge repair does not join an ordinary independent する form without the specific passive-suffix morphology', input: 'verb + さ(する) + lexical verb', expected: 'false', run: () => String(Boolean(annotateMorphologicalOutputBoundaries([{ surface_form: '待た', pos: '動詞', pos_detail_1: '自立', basic_form: '待つ', conjugated_form: '未然形' }, { surface_form: 'さ', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_type: 'サ変・スル', conjugated_form: '未然形' }, { surface_form: 'れる', pos: '動詞', pos_detail_1: '自立', basic_form: 'れる', conjugated_type: '一段', conjugated_form: '基本形' }])[1]?.morphologicalJoinLeft)) },
            { id: 'SYS-MORPH-NOUN-MISPARSED-ASPECTUAL-STEM', suite: 'unit', rule: 'Reviewed verb evidence can recover a noun-misparsed godan continuative stem before an aspectual compound follower', input: '遊び(名詞誤解析) + 続ける', expected: 'reviewed-continuative-stem-aspectual-compound', run: () => annotateMorphologicalOutputBoundaries([{ surface_form: '遊び', pos: '名詞', pos_detail_1: '一般', basic_form: '遊び', sourceStart: 0, sourceEnd: 2 }, { surface_form: '続ける', pos: '動詞', pos_detail_1: '自立', basic_form: '続ける', sourceStart: 2, sourceEnd: 5 }])[1]?.morphologicalJoinReason || 'missing' },
            { id: 'SYS-MORPH-NOUN-MISPARSED-ASPECTUAL-WHITESPACE-GUARD', suite: 'unit', rule: 'An explicit source gap prevents recovered aspectual-compound joining', input: '遊び 続ける', expected: 'false', run: () => String(Boolean(annotateMorphologicalOutputBoundaries([{ surface_form: '遊び', pos: '名詞', pos_detail_1: '一般', basic_form: '遊び', sourceStart: 0, sourceEnd: 2 }, { surface_form: '続ける', pos: '動詞', pos_detail_1: '自立', basic_form: '続ける', sourceStart: 3, sourceEnd: 6 }])[1]?.morphologicalJoinLeft)) },
            { id: 'SYS-MORPH-NOUN-MISPARSED-NONASPECTUAL-GUARD', suite: 'unit', rule: 'Recovered continuative-stem evidence does not join an arbitrary following lexical verb', input: '遊び + 帰る', expected: 'false', run: () => String(Boolean(annotateMorphologicalOutputBoundaries([{ surface_form: '遊び', pos: '名詞', pos_detail_1: '一般', basic_form: '遊び', sourceStart: 0, sourceEnd: 2 }, { surface_form: '帰る', pos: '動詞', pos_detail_1: '自立', basic_form: '帰る', sourceStart: 2, sourceEnd: 4 }])[1]?.morphologicalJoinLeft)) },
            { id: 'SYS-MORPH-TE-DE-MOTION-CONTINUATION', suite: 'unit', rule: 'A contiguous te/de-form followed by 行く/来る forms one productive motion/aspectual continuation', input: '食べて + いく', expected: 'te-de-motion-continuation', run: () => annotateMorphologicalOutputBoundaries([{ surface_form: '食べて', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる', sourceStart: 0, sourceEnd: 3 }, { surface_form: 'いく', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いく', sourceStart: 3, sourceEnd: 5 }])[1]?.morphologicalJoinReason || 'missing' },
            { id: 'SYS-MORPH-TE-DE-MOTION-WHITESPACE-GUARD', suite: 'unit', rule: 'Explicit source whitespace prevents te/de motion-continuation joining', input: '食べて いく', expected: 'false', run: () => String(Boolean(annotateMorphologicalOutputBoundaries([{ surface_form: '食べて', pos: '動詞', pos_detail_1: '自立', basic_form: '食べる', sourceStart: 0, sourceEnd: 3 }, { surface_form: 'いく', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いく', sourceStart: 4, sourceEnd: 6 }])[1]?.morphologicalJoinLeft)) },
            { id: 'SYS-MORPH-TE-DE-MOTION-CASE-PARTICLE-GUARD', suite: 'unit', rule: 'A noun or phrase ending in case-particle で must not be mistaken for a verb te/de-form before 行く/来る', input: '一人で + 行く', expected: 'false', run: () => String(Boolean(annotateMorphologicalOutputBoundaries([{ surface_form: '一人で', pos: '名詞', pos_detail_1: '一般', basic_form: '一人', sourceStart: 0, sourceEnd: 3 }, { surface_form: '行く', pos: '動詞', pos_detail_1: '自立', basic_form: '行く', sourceStart: 3, sourceEnd: 5 }])[1]?.morphologicalJoinLeft)) },
            { id: 'SYS-MORPH-TE-DE-MOTION-ENGINE-IKU', suite: 'engine', rule: 'Productive te-form + いく remains one lexical-grammatical unit', input: '食べていく', expected: 'Tabeteiku', expectedRequiresReview: false },
            { id: 'SYS-MORPH-TE-DE-MOTION-ENGINE-KURU', suite: 'engine', rule: 'Productive te-form + くる remains one lexical-grammatical unit', input: '見てくる', expected: 'Mitekuru', expectedRequiresReview: false },
            { id: 'R0-KANA-ORTHOGRAPHIC-PRONUNCIATION', suite: 'unit', rule: 'R0.7 may use Kuromoji pronunciation when it differs from the written kana only by an established particle-pronunciation spelling', input: 'あるいは / アルイハ / アルイワ', expected: 'aruiwa', run: () => convertToken({ surface_form: 'あるいは', reading: 'アルイハ', pronunciation: 'アルイワ', pos: '接続詞', pos_detail_1: '*', pos_detail_2: '*' }, 'あるいは') },
            { id: 'SRC-GRAMMAR-PARTICLE-EXPRESSION', suite: 'unit', rule: 'Configured particle expressions stay explicitly classified', input: 'について', expected: 'ni tsuite', run: () => runtimeState.particleExpressions['について'] || '' },
            { id: 'R0-GRAMMAR-BOUNDARY-AFTER-AUX', suite: 'unit', rule: 'R0.7 a complete particle-based expression starts a new romaji unit after a completed grammatical construction', input: 'いる + のに', expected: 'true', run: () => String(needsSpaceBeforeGrammaticalExpression({ surface_form: 'いる', pos: '動詞', grammatical: true })) },
            { id: 'R0-GRAMMAR-BOUNDARY-AFTER-PUNCT', suite: 'unit', rule: 'R0 punctuation does not create an extra word separator before a grammatical expression', input: '「 + のに', expected: 'false', run: () => String(needsSpaceBeforeGrammaticalExpression({ surface_form: '「', pos: '記号' })) },
            { id: 'SYS-GRAMMAR-QUOTE-CLOSING-PARTICLE-TO', suite: 'engine', rule: 'A case particle immediately outside a closing Japanese quote keeps its grammatical role', input: '「学校」と会社', expected: '"Gakkou" to Kaisha', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-PAREN-CLOSING-PARTICLE-KARA', suite: 'engine', rule: 'A particle outside paired parentheses keeps its grammatical role without making all punctuation transparent', input: '（学校）から帰る', expected: '(Gakkou) kara Kaeru', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-NESTED-QUOTE-PARTICLE-O', suite: 'engine', rule: 'Nested closing quotes do not erase the following particle role', input: '『「学校」』を読む', expected: '\'"Gakkou"\' o Yomu', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-QUOTE-ASCII-WHITESPACE', suite: 'engine', rule: 'ASCII whitespace adjacent to a closing quote does not reclassify the following particle as a lexical word', input: '「学校」  と  会社', expected: '"Gakkou" to Kaisha', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-IDEOGRAPHIC-WHITESPACE', suite: 'engine', rule: 'Ideographic spaces preserve particle role while retaining structural word separation', input: '学校　から　帰る', expected: 'Gakkou kara Kaeru', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-TAB-WHITESPACE', suite: 'engine', rule: 'A realistically pasted tab does not erase particle role', input: '学校\tから\t帰る', expected: 'Gakkou kara Kaeru', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-NEWLINE-WHITESPACE', suite: 'engine', rule: 'A realistically pasted newline does not erase particle role', input: '学校\nから\n帰る', expected: 'Gakkou kara Kaeru', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-HARD-COMMA-NOT-TRANSPARENT', suite: 'engine', rule: 'A hard clause boundary is not treated like a transparent quote or whitespace boundary', input: '学校、と会社', expected: 'Gakkou, To Kaisha', expectedRequiresReview: false },
            { id: 'SYS-GRAMMAR-HARD-PERIOD-NOT-TRANSPARENT', suite: 'engine', rule: 'A sentence boundary does not borrow the particle role from the preceding clause', input: '学校。と会社', expected: 'Gakkou. To Kaisha', expectedRequiresReview: false },
            { id: 'SRC-CONJUGATION-DATA', suite: 'unit', rule: 'Conjugation joining is loaded from the compact grammar configuration', input: 'て', expected: 'true', run: () => String(runtimeState.conjugationJoinEndings.has('て')) },
            { id: 'CHECK-IRU-LEXICAL', suite: 'engine', rule: 'Independent lexical いる remains a lexical verb', input: '犬がいる', expected: 'Inu ga Iru' },
            { id: 'CHECK-IRU-AUX', suite: 'engine', rule: 'Non-independent いる remains an attached auxiliary', input: '食べている', expected: 'Tabete iru' },
            { id: 'SYS-AUX-FAMILY-ITA', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary across past forms', input: '食べていた', expected: 'Tabete ita' },
            { id: 'SYS-AUX-FAMILY-INAI', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary across negative forms', input: '食べていない', expected: 'Tabete inai' },
            { id: 'SYS-AUX-FAMILY-IMASU', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary before polite continuations', input: '食べています', expected: 'Tabete imasu' },
            { id: 'SYS-AUX-FAMILY-IMASHITA', suite: 'engine', rule: 'Conjugated いる retains the same auxiliary boundary across polite past forms', input: '食べていました', expected: 'Tabete imashita' },
            { id: 'SYS-INFLECTION-NEGATIVE-PAST-GODAN', suite: 'engine', rule: 'Negative past inflection remains attached to a godan lexical stem', input: '走らなかった', expected: 'Hashiranakatta', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-NEGATIVE-PAST-ICHIDAN', suite: 'engine', rule: 'Negative past inflection remains attached to an ichidan lexical stem', input: '見なかった', expected: 'Minakatta', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-NEGATIVE-PAST-ADJECTIVE', suite: 'engine', rule: 'Negative past inflection remains attached to an adjective stem', input: '高くなかった', expected: 'Takakunakatta', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-NEGATIVE-PAST-AUXILIARY', suite: 'engine', rule: 'Negative inflection attaches inside an auxiliary unit without removing the Rule-0 boundary before that auxiliary', input: '食べていなかった', expected: 'Tabete inakatta', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-NEGATIVE-PREDICATE-GUARD', suite: 'engine', rule: 'Independent negative predicate after a particle expression remains a separate lexical unit', input: '学生ではなかった', expected: 'Gakusei de wa Nakatta', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-CAUSATIVE-PASSIVE-GODAN', suite: 'engine', rule: 'Contracted causative-passive morphology joins productively across a Kuromoji サ変 bridge misanalysis', input: '待たされる', expected: 'Matasareru', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-CAUSATIVE-PASSIVE-NEGATIVE', suite: 'engine', rule: 'Contracted causative-passive morphology remains attached through a following negative-past inflection', input: '働かされなかった', expected: 'Hatarakasarenakatta', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-CAUSATIVE-PASSIVE-TE-AUX', suite: 'engine', rule: 'Contracted causative-passive morphology preserves the separate auxiliary-unit boundary after a te-form', input: '書かされている', expected: 'Kakasarete iru', expectedRequiresReview: false },
            { id: 'SYS-INFLECTION-V-TE-V-GUARD', suite: 'engine', rule: 'A genuine V-te-V sequence remains two lexical units rather than being flattened by inflectional attachment', input: '読んで帰る', expected: 'Yonde Kaeru', expectedRequiresReview: false },
            { id: 'SYS-MORPH-ASPECTUAL-NOUN-STEM-ASOBU', suite: 'engine', rule: 'A noun-misparsed godan continuative stem remains attached to a reviewed aspectual compound follower', input: '遊び続ける', expected: 'Asobitsuzukeru', expectedRequiresReview: false },
            { id: 'SYS-MORPH-ASPECTUAL-NOUN-STEM-WHITESPACE', suite: 'engine', rule: 'Explicit source whitespace remains authoritative over aspectual compound recovery', input: '遊び 続ける', expected: 'Asobi Tsuzukeru', expectedRequiresReview: false },
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
            { id: 'R0-CANONICAL-TITLE', suite: 'engine', rule: 'Rule 0 canonical example from Romaji Rules', input: '痛いのは嫌なので防御力に極振りしたいと思います。', expected: 'Itai no wa Iya nano de Bougyoryoku ni Kyokufuri Shitai to Omoimasu.', expectedRequiresReview: false },
            { id: 'DIFF-SHITAPPARA', suite: 'engine', rule: 'Reviewed whole-word evidence repairs a false verbal split', input: '下っ腹', expected: 'Shitappara' },
            { id: 'R0-SOKUON-VERB-ONBIN', suite: 'engine', rule: '促音便 in a godan verb remains ordinary consonant doubling', input: '待って', expected: 'Matte' },
            { id: 'R0-SOKUON-VERB-IKU-EXCEPTION', suite: 'engine', rule: 'The 行く te-form exception preserves its written sokuon', input: '行って', expected: 'Itte' },
            { id: 'STRESS-VARIANT-SEJI', suite: 'engine', rule: 'General old-form Kanji normalisation reaches the same whole-word reading as the canonical spelling', input: 'お世辭', expected: 'Oseji' },
            { id: 'STRESS-VARIANT-GRAMMAR-GUARD', suite: 'engine', rule: 'Variant normalisation must preserve canonical particle and word boundaries rather than flattening a phrase', input: 'ことが出來る', expected: 'Koto ga Dekiru' },
            { id: 'STRESS-GRAMMAR-RESCUE-GUARD', suite: 'engine', rule: 'Authoritative evidence rescue must not flatten already-resolvable grammar, and compatible Ichidan conjugation evidence supersedes obsolete isolated-stem ambiguity', input: 'せざるを得ない', expected: 'Sezaru o Enai', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-INFLECTED-ICHIDAN-NEGATIVE', suite: 'engine', rule: 'A non-template sentence uses conjugation evidence to distinguish the uniquely compatible Ichidan stem reading from incompatible whole-verb alternatives', input: '利益を得ない', expected: 'Rieki o Enai', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-INFLECTED-ICHIDAN-POLITE', suite: 'engine', rule: 'The same evidence rule applies to a different attached grammatical continuation rather than being specific to negative ない', input: '得ます', expected: 'Emasu', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-INFLECTED-ICHIDAN-BASIC-GUARD', suite: 'engine', rule: 'Uninflected ambiguous whole-verb evidence remains review-required because no conjugated stem evidence exists to choose between legitimate readings', input: '得る', expected: 'Uru', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-INFLECTED-ICHIDAN-PROVENANCE', suite: 'unit', rule: 'Conjugation resolution supersedes only the stale lexical conflict while retaining its review provenance and the resolving evidence source', input: '得ない review lifecycle', expected: 'superseded:resolved-inflected-ichidan-reading:false', run: () => { const audit = runTranslatorReadingAudit('得ない'); const signal = audit.redFlags.find(item => item.flag === 'general-word-conflict'); return `${signal?.state || ''}:${signal?.supersededBy || ''}:${String(Boolean(audit.requiresReview))}`; } },
            { id: 'TITLE-DEAIMON', suite: 'engine', rule: 'Scoped title-spelling evidence preserves Deaimon without a whole-input bypass', input: 'であいもん', expected: 'Deaimon', expectedRequiresReview: false },
            { id: 'CHECK-BARAKAMON', suite: 'engine', rule: 'Scoped title-word evidence preserves Barakamon without applying false particle boundaries', input: 'ばらかもん', expected: 'Barakamon', expectedRequiresReview: false },
            { id: 'MECH-GRAMMAR-DAKE-LOWERCASE', suite: 'engine', rule: 'The particle だけ remains lowercase in title output while surrounding ordinary lexical words retain title capitalisation', input: '僕だけがいない街', expected: 'Boku dake ga Inai Machi' }
        ];
    }

    function getAmbiguityAndAuditRegressionChecks() {
        return [
            { id: 'MECH-PROPER-NAME-SINGLE-HAN-AMBIGUOUS-CANDIDATE-FALLBACK', suite: 'unit', rule: 'A supported single-Han proper-name span with unresolved but legitimate name candidates may emit one evidence-backed fallback reading only while retaining explicit proper-name ambiguity', input: 'synthetic single-Han proper-name ambiguity', expected: 'proper-noun-ambiguous-candidate-fallback:ごう:true:false', run: () => { const surface = '剛'; const previousNames = runtimeState.properNounDictionary.get(surface); const previousGeneral = runtimeState.generalWordDictionary.get(surface); const candidates = new Map([['ごう', { reading: 'ごう', romaji: 'gou', weight: 50, rank: 100, categories: new Set(['per']), sources: new Set(['qa']) }], ['つよし', { reading: 'つよし', romaji: 'tsuyoshi', weight: 50, rank: 100, categories: new Set(['per']), sources: new Set(['qa']) }]]); try { runtimeState.properNounDictionary.set(surface, candidates); runtimeState.generalWordDictionary.delete(surface); const resolution = resolveTokenReading({ surface_form: surface, pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '名', reading: '*', pronunciation: '*' }, surface); return `${resolution?.source || ''}:${normalizeKanaReading(resolution?.reading || '')}:${String(Boolean(resolution?.ambiguous))}:${String((resolution?.flags || []).includes('unresolved-reading'))}`; } finally { if (previousNames) runtimeState.properNounDictionary.set(surface, previousNames); else runtimeState.properNounDictionary.delete(surface); if (previousGeneral) runtimeState.generalWordDictionary.set(surface, previousGeneral); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'MECH-PROPER-NAME-MULTI-HAN-EXPLICIT-ROLE-CANDIDATE-FALLBACK', suite: 'unit', rule: 'An explicitly analysed multi-Han proper noun with tied maintained name readings emits one maintained provisional name reading while preserving proper-name ambiguity instead of becoming unresolved', input: 'synthetic multi-Han explicit proper-name ambiguity', expected: 'proper-noun-ambiguous-candidate-fallback:しけんめい:true:false', run: () => { const surface = '試験名'; const previousNames = runtimeState.properNounDictionary.get(surface); const previousGeneral = runtimeState.generalWordDictionary.get(surface); const candidates = new Map([['しけんめい', { reading: 'しけんめい', romaji: 'shikenmei', weight: 50, rank: 100, categories: new Set(['per']), sources: new Set(['qa']) }], ['しけんな', { reading: 'しけんな', romaji: 'shikenna', weight: 50, rank: 100, categories: new Set(['per']), sources: new Set(['qa']) }]]); try { runtimeState.properNounDictionary.set(surface, candidates); runtimeState.generalWordDictionary.delete(surface); const resolution = resolveTokenReading({ surface_form: surface, pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '名', reading: '*', pronunciation: '*' }, surface); return `${resolution?.source || ''}:${normalizeKanaReading(resolution?.reading || '')}:${String(Boolean(resolution?.ambiguous))}:${String((resolution?.flags || []).includes('unresolved-reading'))}`; } finally { if (previousNames) runtimeState.properNounDictionary.set(surface, previousNames); else runtimeState.properNounDictionary.delete(surface); if (previousGeneral) runtimeState.generalWordDictionary.set(surface, previousGeneral); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'MECH-PROPER-NAME-MULTI-HAN-LEXICAL-ROLE-NO-NAME-FALLBACK', suite: 'unit', rule: 'The multi-Han proper-name candidate fallback is gated by independently established proper-name role and does not activate for an ordinary lexical token with the same maintained name candidates', input: 'synthetic multi-Han ordinary lexical inverse', expected: 'japanese-scope-compositional-fallback:false', run: () => { const surface = '試験名'; const previousNames = runtimeState.properNounDictionary.get(surface); const previousGeneral = runtimeState.generalWordDictionary.get(surface); const candidates = new Map([['しけんめい', { reading: 'しけんめい', romaji: 'shikenmei', weight: 50, rank: 100, categories: new Set(['per']), sources: new Set(['qa']) }], ['しけんな', { reading: 'しけんな', romaji: 'shikenna', weight: 50, rank: 100, categories: new Set(['per']), sources: new Set(['qa']) }]]); try { runtimeState.properNounDictionary.set(surface, candidates); runtimeState.generalWordDictionary.delete(surface); const resolution = resolveTokenReading({ surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', reading: '*', pronunciation: '*' }, surface); return `${resolution?.source || ''}:${String(String(resolution?.source || '').includes('proper-noun-ambiguous-candidate-fallback'))}`; } finally { if (previousNames) runtimeState.properNounDictionary.set(surface, previousNames); else runtimeState.properNounDictionary.delete(surface); if (previousGeneral) runtimeState.generalWordDictionary.set(surface, previousGeneral); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'MECH-PROPER-NAME-EXPLICIT-ROLE-LEXICAL-COLLISION-INVENTORY', suite: 'unit', rule: 'Every maintained ordinary-word/proper-name collision analysed explicitly as a proper noun resolves to a maintained name reading rather than an ordinary lexical or unresolved reading', input: 'whole-bank ordinary-word/proper-name collision inventory under explicit proper-name role', expected: '0', run: () => { let violations = 0; for (const [surface, nameCandidates] of runtimeState.properNounDictionary.entries()) { if (!runtimeState.generalWordDictionary.has(surface) || !containsHan(surface)) continue; const maintained = new Set([...nameCandidates.values()].map(candidate => normalizeKanaReading(candidate?.reading || '')).filter(Boolean)); if (!maintained.size) continue; const resolution = resolveTokenReading({ surface_form: surface, pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '一般', pos_detail_3: '*', reading: '*', pronunciation: '*' }, surface); if (!maintained.has(normalizeKanaReading(resolution?.reading || ''))) violations += 1; } return String(violations); } },
            { id: 'SCHEMA-CONTEXTUAL-READING-DUPLICATE-CANDIDATE-REJECT', suite: 'unit', rule: 'A contextual reading entry cannot define the same reading more than once under competing feature rules', input: 'duplicate contextual reading candidate', expected: 'rejected', run: () => { const data = { version: 1, featureGroups: [{ id: 'qa-context-a', terms: [{ term: '試験', weight: 2 }] }, { id: 'qa-context-b', terms: [{ term: '確認', weight: 2 }] }], entries: [{ surface: '試験語', window: 2, minMargin: 1, source: 'qa-reviewed', candidates: [{ reading: 'しけんご', features: ['qa-context-a'], minScore: 1 }, { reading: 'しけんご', features: ['qa-context-b'], minScore: 1 }] }] }; try { validateAssetSchema('contextualReadingEvidence', data, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'MECH-UNCERTAINTY-GENERAL-WORD-READING-EVIDENCE-SCHEMA-FIXTURE', suite: 'unit', rule: 'Schema-valid general-word reading evidence preserves retained and unretained source readings even when the maintained compact bank currently contains no such rows', input: 'schema-valid readingEvidence fixture', expected: '2:1:しけんご:true|しけんこと:false:202', run: () => { const data = { _meta: { schemaVersion: 2, scoreSemantics: 'popularity-ranking-only', defaultReadingCoverage: 'complete-source-surface', defaultRestrictionStatus: 'surface-pair-evidence' }, entries: [['試験語', [['しけんご', 100]], 1, { readingCoverage: 'complete-source-surface', sourceReadingCount: 2, restrictionStatus: 'surface-pair-evidence', readingEvidence: [{ reading: 'しけんご', retained: true, popularityScore: 100, sequences: [101], spellingSpecificApplicability: true }, { reading: 'しけんこと', retained: false, popularityScore: 50, sequences: [202], spellingSpecificApplicability: false }] }]] }; validateAssetSchema('generalWords', data, 'qa'); const normalized = normalizeGeneralWordReadingEvidence(data.entries[0][3], [{ reading: 'しけんご', popularityScore: 100 }]); const candidates = getGeneralWordCandidates({ entry: { readings: [{ reading: 'しけんご', popularityScore: 100 }], unretainedReadings: normalized.unretainedReadings } }); return `${normalized.readingEvidence.length}:${normalized.unretainedReadings.length}:${candidates.map(item => `${item.reading}:${item.retained}`).join('|')}:${normalized.unretainedReadings[0]?.sequences?.[0] || 0}`; } },
            { id: 'MECH-UNCERTAINTY-GENERAL-WORD-READING-EVIDENCE-SPARSE-FIELDS', suite: 'unit', rule: 'Schema-valid general-word reading evidence may omit optional provenance fields without inventing sequence, popularity or spelling-specific evidence', input: 'sparse schema-valid readingEvidence fixture', expected: '1:0:0:0:false', run: () => { const data = { _meta: { schemaVersion: 2, scoreSemantics: 'popularity-ranking-only', defaultReadingCoverage: 'complete-source-surface' }, entries: [['試験疎語', [['しけんそご', 10]], 1, { readingCoverage: 'complete-source-surface', readingEvidence: [{ reading: 'しけんそご', retained: true }] }]] }; validateAssetSchema('generalWords', data, 'qa'); const normalized = normalizeGeneralWordReadingEvidence(data.entries[0][3], [{ reading: 'しけんそご', popularityScore: 10 }]); const item = normalized.readingEvidence[0]; return `${normalized.readingEvidence.length}:${normalized.unretainedReadings.length}:${item?.popularityScore || 0}:${item?.sequences?.length || 0}:${String(Boolean(item?.spellingSpecificApplicability))}`; } },
            { id: 'GENERAL-WORD-POPULARITY-NOT-CERTAINTY', suite: 'unit', rule: 'Popularity ranking may order general-word readings but cannot resolve semantic ambiguity even when the score gap is large', input: 'synthetic complete multi-reading general word', expected: 'general-word-ranked-provisional:true:true:2:0|0', run: () => { const surface = '試験一般語'; const previous = runtimeState.generalWordDictionary.get(surface); try { runtimeState.generalWordDictionary.set(surface, { readings: [{ reading: 'しけんいっぱんご', popularityScore: 500 }, { reading: 'しけんいっぱんこと', popularityScore: 1 }], mergeSafe: true, readingCoverage: 'complete-source-surface', restrictionStatus: 'surface-pair-evidence', sourceReadingCount: 2, readingEvidence: [], unretainedReadings: [], scoreSemantics: 'popularity-ranking-only' }); const resolution = resolveGeneralWordFallback({ surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }); return `${resolution?.source || ''}:${String(Boolean(resolution?.ambiguous))}:${String((resolution?.flags || []).includes('general-word-ambiguous'))}:${resolution?.candidates?.length || 0}:${(resolution?.candidates || []).map(item => item.weight).join('|')}`; } finally { if (previous) runtimeState.generalWordDictionary.set(surface, previous); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'GENERAL-WORD-INCOMPLETE-COVERAGE-UNCERTAINTY', suite: 'unit', rule: 'A single retained compact-bank reading remains explicitly marked incomplete when complete source reading coverage is not proven', input: 'synthetic filtered single-reading general word', expected: 'general-word-ranked-provisional:true:true:1', run: () => { const surface = '試験限定語'; const previous = runtimeState.generalWordDictionary.get(surface); try { runtimeState.generalWordDictionary.set(surface, { readings: [{ reading: 'しけんげんていご', popularityScore: 250 }], mergeSafe: true, readingCoverage: 'filtered-positive-priority', restrictionStatus: 'unknown-from-compact-bank', sourceReadingCount: null, readingEvidence: [], unretainedReadings: [], scoreSemantics: 'popularity-ranking-only' }); const resolution = resolveGeneralWordFallback({ surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }); return `${resolution?.source || ''}:${String(Boolean(resolution?.ambiguous))}:${String((resolution?.flags || []).includes('general-word-coverage-incomplete'))}:${resolution?.candidates?.length || 0}`; } finally { if (previous) runtimeState.generalWordDictionary.set(surface, previous); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'GENERAL-WORD-COMPLETE-SINGLE-CLEAR', suite: 'unit', rule: 'A general-word reading becomes unambiguous only when source coverage is complete and exactly one applicable reading remains', input: 'synthetic complete single-reading general word', expected: 'general-word-fallback:false:false:1', run: () => { const surface = '試験確定語'; const previous = runtimeState.generalWordDictionary.get(surface); try { runtimeState.generalWordDictionary.set(surface, { readings: [{ reading: 'しけんかくていご', popularityScore: 1 }], mergeSafe: true, readingCoverage: 'complete-source-surface', restrictionStatus: 'surface-pair-evidence', sourceReadingCount: 1, readingEvidence: [{ reading: 'しけんかくていご', retained: true, popularityScore: 1 }], unretainedReadings: [], scoreSemantics: 'popularity-ranking-only' }); const resolution = resolveGeneralWordFallback({ surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }); return `${resolution?.source || ''}:${String(Boolean(resolution?.ambiguous))}:${String((resolution?.flags || []).includes('general-word-coverage-incomplete'))}:${resolution?.candidates?.length || 0}`; } finally { if (previous) runtimeState.generalWordDictionary.set(surface, previous); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'MECH-READING-ARBITRATION-INDEPENDENT-CONFLICT', suite: 'unit', rule: 'A selected Kuromoji reading remains explicitly ambiguous when independent maintained lexical evidence supports an incompatible reading for the same source span', input: 'synthetic same-span reading conflict', expected: 'true:general-word-conflict:2', run: () => { const surface = '試験競合語'; const previous = runtimeState.generalWordDictionary.get(surface); try { runtimeState.generalWordDictionary.set(surface, { readings: [{ reading: 'しけんべつよみ', popularityScore: 10 }], mergeSafe: false, readingCoverage: 'complete-source-surface', restrictionStatus: 'surface-pair-evidence', sourceReadingCount: 1, readingEvidence: [{ reading: 'しけんべつよみ', retained: true, popularityScore: 10 }], unretainedReadings: [], scoreSemantics: 'popularity-ranking-only' }); const token = { surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: 'シケンコウゴウゴ', pronunciation: 'シケンコウゴウゴ' }; const resolution = resolveTokenReading(token, surface); return `${String(Boolean(resolution.ambiguous))}:${resolution.flags.includes('general-word-conflict') ? 'general-word-conflict' : 'clear'}:${resolution.candidates.length}`; } finally { if (previous) runtimeState.generalWordDictionary.set(surface, previous); else runtimeState.generalWordDictionary.delete(surface); } } },
            { id: 'MECH-READING-ARBITRATION-SURROUNDING-TEXT-NOT-RESOLUTION', suite: 'engine', rule: 'Ordinary neighbouring words do not clear a same-span strong reading conflict unless a recognised resolver actually selects between the incompatible readings', input: '通帳を作る', expected: 'Kayoichou o Tsukuru', expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-ALTERNATIVES-PRESERVED', suite: 'unit', rule: 'Reading diagnostics preserve both the emitted reading and incompatible independently supported alternatives instead of collapsing the conflict to one visible candidate', input: '胡坐 candidate audit', expected: 'あぐら|こざ:true', run: () => { const audit = runTranslatorReadingAudit('胡坐'); const reading = audit.readings.find(item => item.surface === '胡坐'); const candidates = (reading?.candidates || []).map(item => normalizeKanaReading(item.reading)).sort(); return `${candidates.join('|')}:${String(audit.requiresReview)}`; } },
            { id: 'MECH-READING-ARBITRATION-LEXICAL-CONFLICT-CONTEXT', suite: 'engine', rule: 'A plausible sentence context cannot silently convert independently conflicting lexical readings into certainty when no dedicated contextual selector resolves the word', input: '火傷をした', expected: 'Kashou o Shita', expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-HISTORICAL-MODERN-CONFLICT', suite: 'engine', rule: 'Competing maintained readings for a surface remain reviewable when ordinary context does not establish whether the historical or modern lexical sense is intended', input: '野手が捕る', expected: 'Note ga Toru', expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-WEAK-ALTERNATIVE-CONTEXT', suite: 'engine', rule: 'Weak alternative-list uncertainty may be superseded only when full-sentence lexical resolution selects a supported reading and no independent evidence conflict remains', input: '本を読む', expected: 'Hon o Yomu', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-GENERIC-CONTEXT-NOT-READING-EVIDENCE', suite: 'engine', rule: 'Generic neighbouring words do not become reading evidence merely because Kuromoji selected one maintained reading', input: '一品について話す', expected: 'Ippin ni tsuite Hanasu', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-GENERIC-PREDICATE-NOT-READING-EVIDENCE', suite: 'engine', rule: 'A generic predicate that is compatible with multiple maintained readings does not clear weak lexical ambiguity', input: '三味線を見る', expected: 'Shamisen o Miru', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-EXPLICIT-CONTEXTUAL-EVIDENCE-CLEARS-WEAK-ALTERNATIVE', suite: 'unit', rule: 'Reviewed contextual evidence, rather than mere token proximity, clears weak alternative-list uncertainty when the context selects one maintained reading', input: '本を読む contextual source', expected: 'ほん:sentence-context-verification+kuromoji+general-word:false', run: () => { const audit = runTranslatorReadingAudit('本を読む'); const reading = audit.readings.find(item => item.sourceSurface === '本'); return `${normalizeKanaReading(reading?.reading || '')}:${reading?.source || ''}:${String(Boolean(audit.requiresReview))}`; } },
            { id: 'MECH-READING-ARBITRATION-RECOGNISED-CONTEXT-SELECTOR', suite: 'engine', rule: 'A recognised sentence-level contextual resolver may clear ambiguity when it selects one already-attested reading with sufficient contextual evidence', input: '市場で魚を買う', expected: 'Ichiba de Sakana o Kau', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-HARD-PUNCTUATION-SEGMENT-INVARIANCE', suite: 'engine', rule: 'Hard punctuation boundaries preserve the same provisional ambiguous whole-lexeme reading on each side instead of allowing punctuation to change lexical arbitration', input: '得る、得る', expected: 'Uru, Uru', expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-HARD-PUNCTUATION-SENTENCE-INVARIANCE', suite: 'engine', rule: 'Sentence punctuation likewise preserves an exact ambiguous lexical segment reading independently on each side', input: '得る。得る', expected: 'Uru. Uru', expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-HARD-PUNCTUATION-CONTEXT-ISOLATION', suite: 'engine', rule: 'A hard punctuation boundary isolates an unresolved ambiguous lexeme from a later context that independently resolves the same spelling', input: '得る、信用を得る', expected: "Uru, Shin'you o Eru", expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-HITOME-GLANCE-CONTEXT', suite: 'engine', rule: 'A reviewed sense-level contextual resolver selects ひとめ for 一目 when the following predicate is 見る', input: '一目見る', expected: 'Hitome Miru', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-ICHIMOKU-CONTROL', suite: 'engine', rule: 'The same contextual evidence preserves いちもく in the established 一目置く expression instead of globally forcing the glance reading', input: '一目置く', expected: 'Ichimoku Oku', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-HITOME-VISUAL-CONTEXT', suite: 'engine', rule: 'Reviewed visual-context evidence selects 一目 ひとめ before 見る instead of accepting the analyser\'s incompatible いちもく proposal', input: '一目見る', expected: 'Hitome Miru', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-ICHIMOKU-IDIOM-CONTROL', suite: 'engine', rule: 'Contextual 一目 arbitration preserves the independently attested いちもく reading in 一目置く', input: '一目置く', expected: 'Ichimoku Oku', expectedRequiresReview: false },
            { id: 'MECH-READING-ARBITRATION-HITOME-NEUTRAL-REVIEW', suite: 'engine', rule: 'Context that does not uniquely distinguish the attested 一目 readings remains reviewable rather than being forced by the new selector', input: '一目で分かる', expectedAny: ['Ichimoku de Wakaru', 'Hitome de Wakaru'], expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-SHARED-CONTEXT-NINKI', suite: 'engine', rule: 'A maintained context feature shared by incompatible 人気 readings preserves review instead of allowing analyser agreement to manufacture semantic certainty', input: '人気がなくなる', expectedAny: ['Ninki ga Nakunaru', 'Hitoke ga Nakunaru'], expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-SHARED-CONTEXT-SEIKA', suite: 'engine', rule: 'A decoration context that supports multiple attested 生花 readings remains explicitly reviewable rather than forcing one dictionary sense', input: '生花を飾った', expectedAny: ['Seika o Kazatta', 'Ikebana o Kazatta', 'Shouka o Kazatta', 'Namabana o Kazatta', 'Ikibana o Kazatta'], expectedRequiresReview: true },
            { id: 'SYS-AUDIT-NONGEMINATIVE-SOKUON-UNREVIEWED-CONTROL', suite: 'engine', rule: 'Non-geminative sokuon remains reviewable when no complete reviewed source-language loanword span covers it', input: 'アッラ', expected: 'Ara', expectedRequiresReview: true },
            { id: 'CTX-FINAL-MARKET-PHYSICAL', suite: 'engine', rule: 'Sentence context selects the physical-place 市場 reading from attested candidates when surrounding lexical evidence supports buying at a market', input: '市場で魚を買う', expected: 'Ichiba de Sakana o Kau', expectedRequiresReview: false },
            { id: 'CTX-FINAL-MARKET-ECONOMIC', suite: 'engine', rule: 'Sentence context selects the economic 市場 reading from attested candidates when surrounding financial evidence supports it', input: '株式市場を調査する', expected: 'Kabushikishijou o Chousa Suru', expectedRequiresReview: false },
            { id: 'CTX-FINAL-REPEATED-MARKET-CONJUNCTIVE-CLAUSE-SCOPE', suite: 'engine', rule: 'Context for a repeated ambiguous lexeme cannot cross a conjunctive-particle clause boundary and override stronger evidence local to the later occurrence', input: '市場で魚を買うが市場価格も調査する', expected: 'Ichiba de Sakana o Kau ga Shijou Kakaku mo Chousa Suru', expectedRequiresReview: false },
            { id: 'CTX-FINAL-REPEATED-MARKET-CONJUNCTION-CLAUSE-SCOPE', suite: 'engine', rule: 'An explicit conjunction also separates contextual evidence so an earlier physical-market cue cannot force the later economic 市場 occurrence', input: '市場で魚を買うそして市場価格を調査する', expected: 'Ichiba de Sakana o Kau Soshite Shijou Kakaku o Chousa Suru', expectedRequiresReview: false },
            { id: 'CTX-FINAL-REPEATED-MARKET-ADVERBIAL-NOUN-CLAUSE-SCOPE', suite: 'engine', rule: 'A predicate followed by an adverbial non-independent noun plus で forms a structural clause boundary, preventing earlier sense cues from overriding a later repeated lexeme', input: '市場で魚を買う一方で市場価格も調査する', expected: 'Ichiba de Sakana o Kau Ippou de Shijou Kakaku mo Chousa Suru', expectedRequiresReview: false },
            { id: 'CTX-FINAL-ADVERBIAL-NOUN-NONCLAUSE-INVERSE', suite: 'engine', rule: 'The adverbial-noun boundary rule requires a preceding predicate; an ordinary nominal 一方で phrase remains transparent to valid same-phrase physical-market evidence', input: '市場の一方で魚を買う', expected: 'Ichiba no Ippou de Sakana o Kau', expectedRequiresReview: false },
            { id: 'CTX-FINAL-SAME-CLAUSE-MARKET-CONTROL', suite: 'engine', rule: 'Clause scoping does not weaken valid same-clause contextual selection for an ordinary physical 市場 reading', input: '市場で魚を買う', expected: 'Ichiba de Sakana o Kau', expectedRequiresReview: false },
            { id: 'CTX-FINAL-MARKET-AMBIGUOUS-REVIEW', suite: 'engine', rule: 'When whole-sentence context does not distinguish legitimate 市場 readings, the existing reading is retained but the result remains reviewable instead of gaining false confidence', input: '市場に行く', expected: 'Shijou ni Iku', expectedRequiresReview: true },
            { id: 'CHECK-MARKET-FRUIT-CLEAR', suite: 'engine', rule: 'Physical-market context remains confident when a downstream lexical selection supersedes weak alternative-list uncertainty on 果物', input: '市場で果物を買う', expected: 'Ichiba de Kudamono o Kau', expectedRequiresReview: false },
            { id: 'CHECK-COUNTER-WATER-CLEAR', suite: 'engine', rule: 'Resolved counter/duration structure does not remain reviewable solely because the exact dictionary lists alternative readings for 水', input: '一日二回水を飲む', expected: 'Ichinichi Nikai Mizu o Nomu', expectedRequiresReview: false },
            { id: 'CHECK-BOOK-COMPOUND-VERB-CLEAR', suite: 'engine', rule: 'Object and predicate context may supersede weak lexical alternatives for 本 without erasing the alternative candidates from diagnostics', input: '本を読み始める', expected: 'Hon o Yomihajimeru', expectedRequiresReview: false },
            { id: 'CHECK-ERU-CONTEXT-CLEAR', suite: 'engine', rule: 'Context-selected 得る is not reviewable solely because legitimate dictionary readings include both える and うる', input: '信用を得る', expected: "Shin'you o Eru", expectedRequiresReview: false },
            { id: 'CHECK-MARKET-NEUTRAL-REVIEW', suite: 'engine', rule: 'Neutral 市場 context retains final-active uncertainty when sentence-level evidence cannot safely distinguish いちば from しじょう', input: '市場について話す', expected: 'Shijou ni tsuite Hanasu', expectedRequiresReview: true },
            { id: 'CHECK-REPEATED-MARKET-LOCAL-REVIEW-OWNERSHIP', suite: 'unit', rule: 'Repeated identical surfaces keep review ownership local when one 市場 occurrence is resolved by purchase context and the other remains neutral', input: '市場で魚を買う。市場について話す', expected: 'Ichiba de Sakana o Kau. Shijou ni tsuite Hanasu:false:true:8:10', run: () => { const audit = runTranslatorReadingAudit('市場で魚を買う。市場について話す'); const active = audit.redFlags.filter(item => item.state === 'final-active' && item.requiresReview && item.sourceSurface === '市場'); const firstActive = active.some(item => item.sourceStart === 0 && item.sourceEnd === 2); const secondActive = active.some(item => item.sourceStart === 8 && item.sourceEnd === 10); return `${audit.output}:${String(firstActive)}:${String(secondActive)}:${active[0]?.sourceStart}:${active[0]?.sourceEnd}`; } },
            { id: 'CHECK-REPEATED-MARKET-LOCAL-REVIEW-OWNERSHIP-INVERSE', suite: 'unit', rule: 'Reversing repeated 市場 occurrences does not transfer neutral-context review state onto the independently resolved purchase-context occurrence', input: '市場について話す。市場で魚を買う', expected: 'Shijou ni tsuite Hanasu. Ichiba de Sakana o Kau:true:false:0:2', run: () => { const audit = runTranslatorReadingAudit('市場について話す。市場で魚を買う'); const active = audit.redFlags.filter(item => item.state === 'final-active' && item.requiresReview && item.sourceSurface === '市場'); const firstActive = active.some(item => item.sourceStart === 0 && item.sourceEnd === 2); const secondActive = active.some(item => item.sourceStart === 9 && item.sourceEnd === 11); return `${audit.output}:${String(firstActive)}:${String(secondActive)}:${active[0]?.sourceStart}:${active[0]?.sourceEnd}`; } },
            { id: 'CHECK-REPEATED-ICHIMOKU-INDEPENDENT-LOCAL-RESOLUTION', suite: 'unit', rule: 'Two 一目 occurrences in one input may resolve to different maintained readings when each has its own strong local predicate evidence', input: '一目見る。一目置く', expected: 'Hitome Miru. Ichimoku Oku:false:ひとめ@0|いちもく@5', run: () => { const audit = runTranslatorReadingAudit('一目見る。一目置く'); const readings = audit.readings.filter(item => item.sourceSurface === '一目').map(item => `${normalizeKanaReading(item.reading || '')}@${item.sourceStart}`).join('|'); return `${audit.output}:${String(Boolean(audit.requiresReview))}:${readings}`; } },
            { id: 'CHECK-REPEATED-ICHIMOKU-ASYMMETRIC-REVIEW', suite: 'unit', rule: 'A resolved 一目 occurrence remains clear while a separate contextless occurrence of the same surface stays final-active and reviewable', input: '一目見る。一目', expected: 'Hitome Miru. Ichimoku:false:true:5:7', run: () => { const audit = runTranslatorReadingAudit('一目見る。一目'); const active = audit.redFlags.filter(item => item.state === 'final-active' && item.requiresReview && item.sourceSurface === '一目'); const firstActive = active.some(item => item.sourceStart === 0 && item.sourceEnd === 2); const secondActive = active.some(item => item.sourceStart === 5 && item.sourceEnd === 7); return `${audit.output}:${String(firstActive)}:${String(secondActive)}:${active[0]?.sourceStart}:${active[0]?.sourceEnd}`; } },
            { id: 'CHECK-NOMINAL-COMPOUND-REVIEW', suite: 'engine', rule: 'Weak lexical alternatives remain final-active inside an unresolved contiguous nominal compound rather than being cleared merely because other title material exists', input: '仙狐伝説', expected: 'Sen Kitsune Densetsu', expectedRequiresReview: true },
            { id: 'LEX-NAME-PRECEDENCE-SHINSHOU', suite: 'engine', rule: 'Strong ordinary-word and exact counter-class dictionary evidence override a Viterbi personal-name reading inside an ordinary noun-prefix compound', input: '新章', expected: 'Shinshou', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-ZOKUSHOU', suite: 'engine', rule: 'Ordinary compound morphology prevents the personal-name reading of 章 after the noun prefix 続', input: '続章', expected: 'Zokushou', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-SHOUMATSU', suite: 'engine', rule: 'Strong ordinary-word plus exact counter-class evidence overrides a Viterbi personal-name reading when a non-name nominal suffix establishes ordinary compound context', input: '章末', expected: 'Shoumatsu', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-UNIT-SAISHUUWA', suite: 'engine', rule: 'A reviewed serial modifier plus exact structural counter evidence selects the episode-unit reading of 話 instead of its standalone lexical reading', input: '最終話', expected: 'Saishuuwa', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-UNIT-SAISHUUKAN', suite: 'engine', rule: 'A reviewed serial modifier plus exact structural counter evidence selects the volume-unit reading of 巻 instead of its standalone lexical reading', input: '最終巻', expected: 'Saishuukan', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-UNIT-SAISHUUSHOU', suite: 'engine', rule: 'A reviewed serial modifier plus exact structural counter evidence selects the chapter-unit reading of 章 instead of an unrelated personal-name reading', input: '最終章', expected: 'Saishuushou', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-PREFIX-KAKUWA', suite: 'engine', rule: 'An exact ordinary noun-prefix role combines with structural episode-unit evidence so 各話 uses the productive compound reading rather than standalone 話', input: '各話', expected: 'Kakuwa', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-PREFIX-JIKAN', suite: 'engine', rule: 'An exact ordinary noun-prefix role combines with structural volume-unit evidence so 次巻 uses the productive compound reading rather than standalone 巻', input: '次巻', expected: 'Jikan', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-PREFIX-RECOVERY-ZENSHOU', suite: 'engine', rule: 'Exact noun-prefix evidence can recover 全 from a spurious personal-name tokenisation when a following structural chapter role independently proves ordinary compound morphology', input: '全章', expected: 'Zenshou', expectedRequiresReview: false },
            { id: 'MECH-WHOLE-WORD-STRUCTURAL-WHOLE-TOKEN-GUARD', suite: 'engine', rule: 'Structural suffix recovery does not split an intact whole-word token merely because its final character can serve as a volume counter', input: '新巻', expected: 'Aramaki', expectedRequiresReview: false },
            { id: 'MECH-UNCERTAINTY-STRUCTURAL-WHOLE-WORD-VARIANT-GUARD', suite: 'engine', rule: 'A whole compound with independently attested competing exact dictionary readings remains reviewable instead of being cleared by productive structural morphology', input: '各巻', expected: 'Kakukan', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-AMBIGUOUS-EXACT-SPAN-KAKUGETSU', suite: 'engine', rule: 'Reviewed exact-span evidence can preserve competing attested readings across analyser behaviour; 各月 uses the dictionary-headword reading provisionally and remains review-required because かくつき is also attested', input: '各月', expected: 'Kakugetsu', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-AMBIGUOUS-EXACT-SPAN-KAKUNEN', suite: 'engine', rule: 'Reviewed exact-span evidence can preserve competing attested readings even when Kuromoji splits the lexeme; 各年 uses かくねん provisionally and remains review-required because かくとし is also attested', input: '各年', expected: 'Kakunen', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-AMBIGUOUS-EXACT-SPAN-CANDIDATES', suite: 'unit', rule: 'A reviewed ambiguous exact span exposes both attested readings to diagnostics instead of hiding the alternative behind the provisional output', input: '各年 reading candidates', expected: 'かくねん|かくとし:true', run: () => { const audit = runTranslatorReadingAudit('各年'); const resolution = audit.readings.find(item => item.sourceSurface === '各年') || audit.readings[0]; return `${(resolution?.candidates || []).map(item => item.reading).join('|')}:${String(Boolean(audit.requiresReview))}`; } },
            { id: 'MECH-REVIEW-DISTRIBUTIVE-TEMPORAL-INVERSE-KAKUJITSU', suite: 'engine', rule: 'Adding reviewed ambiguity for 各月/各年 does not rewrite unrelated distributive temporal compounds with an independently established reading', input: '各日', expected: 'Kakujitsu' },
            { id: 'MECH-REVIEW-DISTRIBUTIVE-TEMPORAL-INVERSE-KAKUSHUU', suite: 'engine', rule: 'Adding reviewed ambiguity for 各月/各年 does not rewrite unrelated distributive temporal compounds with an independently established reading', input: '各週', expected: 'Kakushuu' },
            { id: 'MECH-REVIEW-DISTRIBUTIVE-TEMPORAL-INVERSE-MAITSUKI', suite: 'engine', rule: 'Reviewed 各月 ambiguity must not alter the established independent reading of 毎月', input: '毎月', expected: 'Maitsuki' },
            { id: 'MECH-REVIEW-DISTRIBUTIVE-TEMPORAL-INVERSE-MAITOSHI', suite: 'engine', rule: 'Reviewed 各年 ambiguity must not alter the established independent reading of 毎年', input: '毎年', expected: 'Maitoshi' },
            { id: 'MECH-REVIEW-DISTRIBUTIVE-TEMPORAL-INVERSE-TSUKI', suite: 'engine', rule: 'Reviewed 各月 ambiguity must not alter standalone 月', input: '月', expected: 'Tsuki' },
            { id: 'MECH-REVIEW-DISTRIBUTIVE-TEMPORAL-INVERSE-TOSHI', suite: 'engine', rule: 'Reviewed 各年 ambiguity must not alter standalone 年', input: '年', expected: 'Toshi' },
            { id: 'MECH-REVIEW-STRUCTURAL-PREFIX-SUPERSESSION', suite: 'unit', rule: 'Once final morphology proves an ordinary structural prefix role, incompatible standalone lexical evidence remains visible only as superseded review provenance', input: '各話 review lifecycle', expected: 'false:superseded:resolved-morphological-prefix-role', run: () => { const audit = runTranslatorReadingAudit('各話'); const signal = audit.redFlags.find(item => item.sourceSurface === '各' && item.flag === 'general-word-conflict'); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${signal?.supersededBy || ''}`; } },
            { id: 'LEX-NAME-PRECEDENCE-AUDIT', suite: 'unit', rule: 'Ordinary compound precedence is explicit in audit provenance rather than silently mutating the tokenizer reading', input: '新章 audit', expected: 'しょう:ordinary-compound-context:false', run: () => { const audit = runTranslatorReadingAudit('新章'); const reading = audit.readings.find(item => item.surface === '章'); return `${reading?.reading || ''}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'LEX-NAME-PRECEDENCE-PERSON-CONTROL', suite: 'engine', rule: 'A genuine surname-plus-given-name context retains the reviewed personal-name reading of 章', input: '山田章', expected: 'Yamada Akira', expectedRequiresReview: false },
            { id: 'LEX-NAME-PRECEDENCE-WHOLE-NAME-CONTROL', suite: 'engine', rule: 'A whole proper-name token is unaffected by ordinary compound precedence', input: '章太郎', expected: 'Shoutarou', expectedRequiresReview: false },
            { id: 'CHECK-LIFECYCLE-SUPERSEDED', suite: 'unit', rule: 'A weak lexical ambiguity signal retains provenance while transitioning candidate -> active -> superseded after contextual selection', input: '本を読む lifecycle', expected: 'superseded:candidate>active>superseded:false', run: () => { const audit = runTranslatorReadingAudit('本を読む'); const signal = audit.redFlags.find(item => item.flag === 'general-word-alternative'); return `${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'MECH-REVIEW-SAME-SPAN-CONTEXT-NOT-INDEPENDENT', suite: 'unit', rule: 'Tokens inside one unresolved multi-reading source span cannot act as independent sentence context for clearing that span', input: '一人前 review lifecycle', expected: 'true:final-active:none', run: () => { const audit = runTranslatorReadingAudit('一人前'); const signal = audit.redFlags.find(item => item.flag === 'whole-word-reading-ambiguous' && item.state === 'final-active'); const oldSupersession = audit.redFlags.find(item => String(item.supersededBy || '').startsWith('kuromoji')); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${oldSupersession?.supersededBy || 'none'}`; } },
            { id: 'MECH-REVIEW-WHOLE-SPAN-AMBIGUITY-BLOCKS-SUFFIX', suite: 'unit', rule: 'A morphology-owned suffix join cannot clear unresolved multi-reading evidence that covers a larger source span containing the suffix', input: '一条 review lifecycle', expected: 'true:final-active:none', run: () => { const audit = runTranslatorReadingAudit('一条'); const signal = audit.redFlags.find(item => item.sourceSurface === '条' && item.flag === 'general-word-conflict'); const oldSupersession = audit.redFlags.find(item => item.sourceSurface === '条' && item.supersededBy === 'resolved-morphological-suffix-role'); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${oldSupersession?.supersededBy || 'none'}`; } },
            { id: 'MECH-REVIEW-SOURCE-ORTHOGRAPHY-SPAN-MONOTONIC-VARIANT', suite: 'engine', rule: 'A source-orthography reconstruction may preserve a supported glyph variant reading but must not clear independently review-required same-span lexical evidence', input: '一條', expected: 'Ichijou', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-SOURCE-ORTHOGRAPHY-PROPER-NAME-MONOTONIC-SAIJOU', suite: 'engine', rule: 'A supported glyph variant may preserve an exact maintained name reading, but it must not clear ambiguity that remains active for the canonically equivalent source span', input: '西條市', expected: 'Saijoushi', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-SOURCE-ORTHOGRAPHY-HALFWIDTH-EVIDENCE-MONOTONIC', suite: 'engine', rule: 'Half-width kana normalisation must not erase exact maintained source-orthography name evidence that remains relevant to review', input: 'ｼｬ乱Ｑ', expected: 'Sha Ran Q', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-SOURCE-ORTHOGRAPHY-GENERAL-VARIANT-EVIDENCE-MONOTONIC', suite: 'engine', rule: 'A supported general Han variant must not erase exact maintained source-orthography name evidence reached through the equivalent spelling', input: 'シャ亂Ｑ', expected: 'Sha Ran Q', expectedRequiresReview: true },
            { id: 'MECH-UNCERTAINTY-PROPER-NOUN-RANK-NOT-CERTAINTY', suite: 'unit', rule: 'Kuromoji agreement with the top-ranked proper-name reading cannot erase other maintained proper-name readings for the same span', input: '青柳 review lifecycle', expected: 'true:proper-noun-ambiguous:final-active', run: () => { const audit = runTranslatorReadingAudit('青柳'); const reading = audit.readings.find(item => item.sourceSurface === '青柳') || audit.readings[0]; const signal = audit.redFlags.find(item => item.sourceSurface === '青柳' && item.flag === 'proper-noun-ambiguous'); return `${String(Boolean(audit.requiresReview))}:${(reading?.flags || []).includes('proper-noun-ambiguous') ? 'proper-noun-ambiguous' : 'clear'}:${signal?.state || ''}`; } },
            { id: 'MECH-UNCERTAINTY-NAME-HONORIFIC-DOES-NOT-SELECT-READING', suite: 'engine', rule: 'An attached name honorific establishes name role but cannot select between multiple maintained readings for that name', input: '愛ちゃん', expected: 'Ai chan', expectedRequiresReview: true },
            { id: 'MECH-UNCERTAINTY-NAME-HONORIFIC-AMBIGUITY-LIFECYCLE', suite: 'unit', rule: 'Name-role evidence keeps proper-name ambiguity final-active when more than one maintained person-name reading survives', input: '愛ちゃん review lifecycle', expected: 'true:final-active:none', run: () => { const audit = runTranslatorReadingAudit('愛ちゃん'); const signal = audit.redFlags.find(item => item.sourceSurface === '愛' && item.flag === 'proper-noun-ambiguous'); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${signal?.supersededBy || 'none'}`; } },
            { id: 'MECH-UNCERTAINTY-NAME-HONORIFIC-FAMILY', suite: 'unit', rule: 'Recognised name honorifics do not masquerade as lexical context across distinct ambiguous name surfaces', input: '愛ちゃん / 旭さん / 王氏', expected: 'true:true:true', run: () => ['愛ちゃん', '旭さん', '王氏'].map(input => { const audit = runTranslatorReadingAudit(input); return String(Boolean(audit.requiresReview && audit.redFlags.some(item => item.flag === 'proper-noun-ambiguous' && item.state === 'final-active'))); }).join(':') },
            { id: 'MECH-UNCERTAINTY-SWALLOWED-NAME-HONORIFIC-BOUNDARY', suite: 'engine', rule: 'A tokenizer reading that swallows a maintained person-name plus honorific boundary remains provisionally lexical but review-required instead of silently erasing the competing name structure', input: '許さん', expected: 'Yurusan', expectedRequiresReview: true },
            { id: 'MECH-UNCERTAINTY-SWALLOWED-NAME-HONORIFIC-OWNERSHIP', suite: 'unit', rule: 'The review signal for a swallowed name/honorific boundary owns the complete competing source construction rather than only the damaged tokenizer token', input: '許さん review ownership', expected: 'name-context-ambiguous:0:3:許さん:final-active', run: () => { const audit = runTranslatorReadingAudit('許さん'); const signal = audit.redFlags.find(item => item.flag === 'name-context-ambiguous'); return `${signal?.flag || ''}:${signal?.sourceStart ?? ''}:${signal?.sourceEnd ?? ''}:${signal?.sourceSurface || ''}:${signal?.state || ''}`; } },
            { id: 'MECH-UNCERTAINTY-SWALLOWED-NAME-HONORIFIC-FAMILY', suite: 'unit', rule: 'Distinct swallowed verb/name-honorific boundary collisions remain reviewable without forcing the name interpretation', input: '愛さん / 許さん / 出さん', expected: 'Aisan:true|Yurusan:true|Dasan:true', run: () => ['愛さん', '許さん', '出さん'].map(input => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview && audit.redFlags.some(item => item.flag === 'name-context-ambiguous' && item.state === 'final-active')))}`; }).join('|') },
            { id: 'MECH-UNCERTAINTY-SWALLOWED-NAME-HONORIFIC-LEXICAL-INVERSE', suite: 'engine', rule: 'Ordinary explicit negative morphology without an honorific-shaped competing boundary remains clear', input: '許さない', expected: 'Yurusanai', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-LEXICAL-TOKEN', suite: 'engine', rule: 'A separated recognised honorific establishes person-name role even when Kuromoji analysed the preceding Han as an ordinary lexical token', input: '許ちゃん', expected: 'Kyo chan', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-CATEGORY-FILTER', suite: 'engine', rule: 'Person-name role from an attached honorific excludes a maintained location-only reading from name arbitration', input: '燕さん', expected: 'En san', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-AMBIGUITY', suite: 'unit', rule: 'A lexical reading that coincides with one person-name reading may remain provisional, but the honorific cannot clear another maintained person-name reading', input: '花さん / 計ちゃん', expected: 'Hana san:true|Kei chan:true', run: () => ['花さん', '計ちゃん'].map(input => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview && audit.redFlags.some(item => item.flag === 'proper-noun-ambiguous' && item.state === 'final-active')))}`; }).join('|') },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-ORDINARY-LEXICAL-INVERSE', suite: 'unit', rule: 'Person-name role arbitration is not activated when the same surfaces occur without an attached recognised honorific', input: '許さない / 燕が飛ぶ / 花が咲く', expected: 'Yurusanai:false|Tsubame ga Tobu:false|Hana ga Saku:false', run: () => ['許さない', '燕が飛ぶ', '花が咲く'].map(input => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview))}`; }).join('|') },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-REVIEWED-SPAN-INVERSE', suite: 'engine', rule: 'Existing reviewed single-reading name plus honorific behaviour remains clear', input: '下屋さん', expected: 'Shitaya san', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-SINGLE-HAN-FALLBACK', suite: 'engine', rule: 'When person-name role is established but several maintained single-Han person readings remain tied, the existing evidence-backed candidate fallback supplies a provisional name reading while keeping review active', input: '円さん', expected: 'Madoka san', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-MULTI-HAN-FALLBACK', suite: 'engine', rule: 'Established person-name role permits the highest-ranked maintained whole-name person candidate as a provisional output while retaining review when several person readings survive', input: '古城さん', expected: 'Koshiro san', expectedRequiresReview: true },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-OUTRANKS-NUMERIC-LEXICAL', suite: 'engine', rule: 'A recognised honorific establishes person-name role before numeric or general-word reading authority, so a unique maintained person reading wins for the same source span', input: '十三さん', expected: 'Juuzou san', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-OUTRANKS-GENERAL-WORD', suite: 'engine', rule: 'A recognised honorific gives the maintained person-name reading priority over an incompatible general-word boundary candidate for the same complete surface', input: '風太郎さん', expected: 'Fuutarou san', expectedRequiresReview: false },
            { id: 'MECH-PROPER-NAME-HONORIFIC-ROLE-PRIORITY-INVERSES', suite: 'unit', rule: 'Name-role priority does not change the same surfaces when they occur without a recognised attached honorific', input: '十三 / 風太郎', expected: 'Juusan:false|Fuutarou:false', run: () => ['十三', '風太郎'].map(input => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview))}`; }).join('|') },
            { id: 'MECH-UNCERTAINTY-PROPER-NOUN-LEXICAL-CONFLICT', suite: 'unit', rule: 'A selected proper-name reading remains reviewable when incompatible maintained lexical evidence survives for the same source span', input: '望月 review lifecycle', expected: 'Mochizuki:true:reading-evidence-conflict:final-active:ぼうげつ|もちづき', run: () => { const audit = runTranslatorReadingAudit('望月'); const reading = audit.readings.find(item => item.sourceSurface === '望月') || audit.readings[0]; const signal = audit.redFlags.find(item => item.sourceSurface === '望月' && item.flag === 'reading-evidence-conflict'); const readings = [...new Set((reading?.candidates || []).map(item => normalizeKanaReading(item?.reading || '')).filter(Boolean))].sort().join('|'); return `${audit.output}:${String(Boolean(audit.requiresReview))}:${signal?.flag || ''}:${signal?.state || ''}:${readings}`; } },
            { id: 'MECH-UNCERTAINTY-LEXICAL-NOUN-UNIQUE-NAME-CONFLICT', suite: 'unit', rule: 'An ordinary lexical noun retains review when one unambiguous maintained whole-surface name reading conflicts with the selected lexical reading', input: '八木 / 大木 / 平野 / 根本', expected: 'Hachiboku:true|Taiboku:true|Heiya:true|Konpon:true', run: () => ['八木', '大木', '平野', '根本'].map(input => { const audit = runTranslatorReadingAudit(input); return `${audit.output}:${String(Boolean(audit.requiresReview && audit.redFlags.some(item => item.flag === 'reading-evidence-conflict' && item.state === 'final-active')))}`; }).join('|') },
            { id: 'MECH-UNCERTAINTY-LEXICAL-NOUN-UNIQUE-NAME-CANDIDATES', suite: 'unit', rule: 'The lexical output and the conflicting maintained name reading remain visible together in diagnostics rather than replacing one another', input: '八木 candidate preservation', expected: 'はちぼく|やぎ:true', run: () => { const audit = runTranslatorReadingAudit('八木'); const reading = audit.readings.find(item => item.sourceSurface === '八木') || audit.readings[0]; const readings = [...new Set((reading?.candidates || []).map(item => normalizeKanaReading(item?.reading || '')).filter(Boolean))].sort().join('|'); return `${readings}:${String(Boolean(audit.requiresReview))}`; } },
            { id: 'MECH-UNCERTAINTY-CLOCK-SURFACE-NOT-ROLE-PROOF', suite: 'unit', rule: 'A numeric-looking bare surface and reviewed pronunciation cannot by themselves prove the clock-hour role when viable lexical readings survive', input: '一時 review lifecycle', expected: 'Ichiji:true:numeric-role-ambiguous:final-active', run: () => { const audit = runTranslatorReadingAudit('一時'); const signal = audit.redFlags.find(item => item.sourceSurface === '一時' && item.flag === 'numeric-role-ambiguous'); return `${audit.output}:${String(Boolean(audit.requiresReview))}:${signal?.flag || ''}:${signal?.state || ''}`; } },
            { id: 'MECH-UNCERTAINTY-CLOCK-MERIDIEM-ROLE-CONTROL', suite: 'unit', rule: 'An explicit meridiem marker independently establishes the clock-hour role and keeps reviewed hour pronunciation clear', input: '午前一時 review lifecycle', expected: 'Gozen Ichiji:false', run: () => { const audit = runTranslatorReadingAudit('午前一時'); return `${audit.output}:${String(Boolean(audit.requiresReview))}`; } },
            { id: 'MECH-REVIEW-ISOLATED-QUOTE-WRAPPER-READING-INVARIANCE', suite: 'engine', rule: 'An isolated transparent quotation wrapper does not act as reading evidence or promote a tokenizer proper-name reading over the same bare ambiguous lexical span', input: '「大分」', expected: '"Daibu"', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-ISOLATED-PAREN-WRAPPER-READING-INVARIANCE', suite: 'engine', rule: 'An isolated transparent parenthesis wrapper preserves the same provisional reading and review state as the bare ambiguous lexical span', input: '（大分）', expected: '(Daibu)', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-QUOTE-WRAPPER-TRANSPARENT', suite: 'engine', rule: 'Paired quotation punctuation around a lexical item does not by itself prevent a recognised neighbouring context from superseding weak lexical ambiguity', input: '「本」を読む', expected: '"Hon" o Yomu', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-HARD-BOUNDARY-NOT-TRANSPARENT', suite: 'engine', rule: 'A sentence-ending hard boundary still blocks contextual supersession of weak lexical ambiguity', input: '本。を読む', expected: 'Hon. o Yomu', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-SIGNAL-OWNS-SOURCE-SPAN', suite: 'unit', rule: 'An active review signal identifies a stable reason code, evidence source and the exact source span that owns the unresolved uncertainty', input: '上手 review ownership', expected: 'whole-word-reading-ambiguous:0:2:上手:kuromoji+general-word:true', run: () => { const audit = runTranslatorReadingAudit('上手'); const signal = audit.redFlags.find(item => item.state === 'final-active' && item.requiresReview); return `${signal?.reasonCode || ''}:${signal?.sourceStart}:${signal?.sourceEnd}:${signal?.sourceSurface || ''}:${signal?.evidenceSource || ''}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'MECH-REVIEW-ORTHOGRAPHIC-NO-SUPERSEDED', suite: 'unit', rule: 'A Katakana ノ inference remains in audit provenance but becomes historical once final grammatical reconstruction establishes the particle role and output boundary', input: '森ノ奥 review lifecycle', expected: 'superseded:candidate>active>superseded:false:1:2', run: () => { const audit = runTranslatorReadingAudit('森ノ奥'); const signal = audit.redFlags.find(item => item.flag === 'orthographic-particle-inferred'); return `${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}:${signal?.sourceStart}:${signal?.sourceEnd}`; } },
            { id: 'MECH-REVIEW-PRODUCTIVE-COUNTER-SUPERSEDES-LEXICAL', suite: 'engine', rule: 'A productive numeral-plus-counter structure supersedes obsolete lexical ambiguity on the counter only after the final counter boundary is established', input: '六人を見る', expected: 'Rokunin o Miru', expectedRequiresReview: false },
            { id: 'MECH-REVIEW-MORPHOLOGICAL-SUFFIX-SUPERSEDES-LEXICAL', suite: 'unit', rule: 'A morphology-owned suffix join supersedes incompatible whole-word reading conflicts on the suffix while retaining them as historical provenance', input: '翻訳家 review lifecycle', expected: 'false:superseded:0', run: () => { const audit = runTranslatorReadingAudit('翻訳家'); const signal = audit.redFlags.find(item => item.sourceSurface === '家' && item.flag === 'reading-evidence-conflict'); const active = audit.redFlags.filter(item => item.state === 'final-active' && item.requiresReview); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${active.length}`; } },
            { id: 'MECH-REVIEW-NAME-SPAN-BLOCKS-SUFFIX-SUPERSESSION', suite: 'unit', rule: 'Generic suffix morphology cannot clear a conflicting reading when reviewed proper-name span evidence covers the same source characters', input: '綾波レイ review lifecycle', expected: 'true:final-active:none', run: () => { const audit = runTranslatorReadingAudit('綾波レイ'); const signal = audit.redFlags.find(item => item.sourceSurface === '波' && item.flag === 'general-word-conflict'); const oldSupersession = audit.redFlags.find(item => item.sourceSurface === '波' && item.supersededBy === 'resolved-morphological-suffix-role'); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${oldSupersession?.supersededBy || 'none'}`; } },
            { id: 'MECH-REVIEW-PERSON-NAME-STRUCTURE-BLOCKS-SUFFIX-SUPERSESSION', suite: 'unit', rule: 'Generic suffix morphology cannot clear a conflicting reading inside a contiguous span that the final boundary pass already recognises as a personal-name structure', input: '乙骨憂太 review lifecycle', expected: 'true:final-active:true', run: () => { const audit = runTranslatorReadingAudit('乙骨憂太'); const signal = audit.redFlags.find(item => item.sourceSurface === '骨' && item.flag === 'general-word-conflict'); const nameBoundary = audit.readings.some(item => item.outputBoundaryAuthority === 'name-structure' && item.outputBoundaryReason === 'person-name-given-name-boundary'); return `${String(Boolean(audit.requiresReview))}:${signal?.state || ''}:${String(nameBoundary)}`; } },
            { id: 'CHECK-LIFECYCLE-FINAL-ACTIVE', suite: 'unit', rule: 'Standalone unresolved lexical ambiguity transitions candidate -> active -> final-active and still requires review', input: '上手 lifecycle', expected: 'final-active:candidate>active>final-active:true', run: () => { const audit = runTranslatorReadingAudit('上手'); const signal = audit.redFlags.find(item => item.flag === 'whole-word-reading-ambiguous'); return `${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'MECH-UNCERTAINTY-FREQUENCY-FALLBACK-RETAINS-AMBIGUITY', suite: 'unit', rule: 'Frequency evidence may provide a printable preferred reading, but legitimate alternatives remain reviewable instead of being cleared by successful fallback output', input: 'synthetic frequency fallback ambiguity', expected: 'frequency-evidence-fallback:true:true:true:2', run: () => { const surface = '試験曖昧語'; const previous = runtimeState.readingEvidenceDictionary.get(surface); try { runtimeState.readingEvidenceDictionary.set(surface, { preferredReading: 'しけんあいまいご', preferredPriority: 200, preferredRank: 1, alternatives: [{ reading: 'しけんあいまいこと', priority: 0, rank: 1000 }] }); const token = { surface_form: surface, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }; const resolution = resolveTokenReading(token, surface); const diagnosticToken = { ...token, value: convertToRomaji(resolution.reading || ''), readingResolution: resolution }; const audit = buildTranslationDiagnostics(surface, surface, diagnosticToken.value, [diagnosticToken]); return `${resolution.source}:${String(Boolean(resolution.ambiguous))}:${String(resolution.flags.includes('whole-word-reading-ambiguous'))}:${String(audit.requiresReview)}:${resolution.candidates.length}`; } finally { if (previous) runtimeState.readingEvidenceDictionary.set(surface, previous); else runtimeState.readingEvidenceDictionary.delete(surface); } } },
            { id: 'MECH-UNCERTAINTY-SENTENCE-CONTEXT-SUPERSESSION-PROVENANCE', suite: 'unit', rule: 'When stronger sentence evidence resolves contextual ambiguity, the old uncertainty remains visible as superseded provenance rather than disappearing silently', input: '市場 + final contextual resolution provenance', expected: 'いちば:superseded:candidate>superseded:false', run: () => { const tokens = [{ surface_form: '市場', word_position: 1, pos: '名詞', basic_form: '市場' }, { surface_form: '魚を買う', word_position: 4, pos: '名詞', basic_form: '魚を買う' }]; const provisional = [makeReadingResolution(tokens[0], { reading: 'しじょう', source: 'kuromoji-context', confidence: 0.70, flags: ['contextual-reading-ambiguous'], ambiguous: true }), makeReadingResolution(tokens[1], { reading: 'さかなをかう', source: 'kuromoji-context', confidence: 0.90 })]; const verified = verifySentenceLevelResolutions(tokens, provisional, '市場で魚を買う'); const signal = verified[0].reviewSignals.find(item => item.flag === 'contextual-reading-ambiguous'); return `${normalizeKanaReading(verified[0].reading || '')}:${signal?.state || ''}:${(signal?.lifecycle || []).join('>')}:${String(Boolean(signal?.requiresReview))}`; } },
            { id: 'MECH-UNCERTAINTY-SENTENCE-CONTEXT-PRESERVES-INDEPENDENT-CONFLICT', suite: 'unit', rule: 'Sentence context may supersede the ambiguity it resolves, but it must not erase an independent reading-evidence conflict', input: '市場 + contextual selection + independent conflict', expected: 'superseded:final-active:true', run: () => { const tokens = [{ surface_form: '市場', word_position: 1, pos: '名詞', basic_form: '市場' }, { surface_form: '魚を買う', word_position: 4, pos: '名詞', basic_form: '魚を買う' }]; const provisional = [makeReadingResolution(tokens[0], { reading: 'しじょう', source: 'kuromoji-context', confidence: 0.68, flags: ['contextual-reading-ambiguous', 'reading-evidence-conflict'], ambiguous: true }), makeReadingResolution(tokens[1], { reading: 'さかなをかう', source: 'kuromoji-context', confidence: 0.90 })]; const verified = verifySentenceLevelResolutions(tokens, provisional, '市場で魚を買う'); const diagnosticTokens = tokens.map((token, index) => ({ ...token, value: convertToRomaji(verified[index].reading || ''), readingResolution: verified[index] })); const audit = buildTranslationDiagnostics('市場で魚を買う', '市場で魚を買う', 'Ichiba de Sakana o Kau', diagnosticTokens); const contextual = audit.redFlags.find(item => item.flag === 'contextual-reading-ambiguous'); const conflict = audit.redFlags.find(item => item.flag === 'reading-evidence-conflict'); return `${contextual?.state || ''}:${conflict?.state || ''}:${String(audit.requiresReview)}`; } },
            { id: 'MECH-REVIEW-COMPOUND-JOIN-DOES-NOT-RESOLVE-STEM-READING', suite: 'engine', rule: 'A morphological compound-verb join establishes a word boundary but does not manufacture certainty about an independently ambiguous stem reading', input: '絵を描き直す', expected: 'E o Egakinaosu', expectedRequiresReview: true },
            { id: 'MECH-REVIEW-COMPOUND-JOIN-UNAMBIGUOUS-CONTROL', suite: 'engine', rule: 'An evidence-backed compound verb with an unambiguous stem remains clear; review is not added merely because compound morphology is present', input: '手紙を書き直す', expected: 'Tegami o Kakinaosu', expectedRequiresReview: false },
            { id: 'MECH-UNCERTAINTY-VARIANT-NAME-AUDIT-PRESERVES-AMBIGUITY', suite: 'unit', rule: 'Canonicalising a variant surname must not let Kuromoji plus frequency ranking erase a legitimate whole-name reading alternative', input: '山﨑 audit', expected: 'proper-noun-source-orthography+kuromoji:proper-noun-ambiguous:final-active:true', run: () => { const audit = runTranslatorReadingAudit('山﨑'); const reading = audit.readings[0]; const signal = audit.redFlags.find(item => item.flag === 'proper-noun-ambiguous'); return `${reading?.source || ''}:${(reading?.flags || []).includes('proper-noun-ambiguous') ? 'proper-noun-ambiguous' : 'clear'}:${signal?.state || ''}:${String(audit.requiresReview)}`; } },
            { id: 'MECH-UNCERTAINTY-VARIANT-CANONICAL-SUFFIX-REVIEW-MONOTONICITY', suite: 'unit', rule: 'Canonical retokenisation of a supported name glyph variant may recover suffix structure but must not clear an existing lexical ambiguity solely because the canonical token is a suffix', input: '各務厡市 audit', expected: 'Kakamigaharashi:whole-word-reading-ambiguous:final-active:true', run: () => { const audit = runTranslatorReadingAudit('各務厡市'); const signal = audit.redFlags.find(item => item.surface === '市' && item.flag === 'whole-word-reading-ambiguous'); return `${audit.output || ''}:${signal?.flag || ''}:${signal?.state || ''}:${String(audit.requiresReview)}`; } },
            { id: 'MECH-UNCERTAINTY-VARIANT-CANONICAL-SUFFIX-SUPPLEMENTARY-REVIEW-MONOTONICITY', suite: 'engine', rule: 'The review-monotonicity rule also applies when the source-only name variant uses a supplementary Han code point', input: '各務𠩤市', expected: 'Kakamigaharashi', expectedRequiresReview: true },
            { id: 'MECH-UNCERTAINTY-NAME-VARIANT-CANONICAL-LEXICAL-REVIEW-MONOTONICITY', suite: 'engine', rule: 'A supported name-only glyph variant inherits canonical whole-word lexical uncertainty for review without giving that lexical evidence reading authority', input: '㠀', expected: 'Shima', expectedRequiresReview: true },
            { id: 'MECH-UNCERTAINTY-SOURCE-SPELLING-UNCERTAINTY-FINAL-ACTIVE', suite: 'unit', rule: 'Mechanical Katakana output remains clear when no positive loanword evidence establishes a source-spelling uncertainty', input: 'パーティー audit', expected: '::false:false', run: () => { const audit = runTranslatorReadingAudit('パーティー'); const signal = audit.redFlags.find(item => item.flag === 'missing-source-spelling-evidence'); return `${signal?.flag || ''}:${signal?.state || ''}:${String(Boolean(signal?.requiresReview))}:${String(audit.statistics?.resolvedOutputRequiresReview)}`; } },
            { id: 'MECH-UNCERTAINTY-SOURCE-SPELLING-POSITIVE-EVIDENCE', suite: 'unit', rule: 'Positive reviewed loanword metadata, rather than Katakana shape, can keep source-spelling uncertainty final-active', input: 'ホール audit', expected: 'missing-source-spelling-evidence:final-active:true:true', run: () => { const audit = runTranslatorReadingAudit('ホール'); const signal = audit.redFlags.find(item => item.flag === 'missing-source-spelling-evidence'); return `${signal?.flag || ''}:${signal?.state || ''}:${String(Boolean(signal?.requiresReview))}:${String(audit.statistics?.resolvedOutputRequiresReview)}`; } },
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
            { id: 'UNRESOLVED-RANKED-SINGLE-AMBIGUOUS', suite: 'unit', rule: 'Ambiguous general-word evidence may provide a provisional top-ranked reading while retaining ambiguity rather than returning no reading', input: '閾 / general-word fallback', expected: 'しきい:general-word-ranked-provisional:true', run: () => { const resolution = resolveGeneralWordFallback({ surface_form: '閾', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }); return `${normalizeKanaReading(resolution?.reading || '')}:${resolution?.source || ''}:${String(Boolean(resolution?.ambiguous))}`; } },
            { id: 'UNRESOLVED-RANKED-ENGINE-MERGESAFE', suite: 'engine', rule: 'Ranked ambiguous whole-word evidence produces usable Romaji but remains review-required', input: '凉風', expected: 'Ryoufuu', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-ENGINE-NONMERGESAFE', suite: 'engine', rule: 'An exact whole-input non-merge-safe ambiguous lexeme produces provisional Romaji while retaining review', input: '頰笑む', expected: 'Hohoemu', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-ENGINE-NONMERGESAFE-TERMINAL-PUNCTUATION', suite: 'engine', rule: 'Terminal sentence punctuation is a transparent structural boundary and must not break an exact non-merge-safe lexical span', input: '頰笑む。', expected: 'Hohoemu.', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-ENGINE-NONMERGESAFE-TERMINAL-EXCLAMATION', suite: 'engine', rule: 'Terminal exclamation punctuation is likewise transparent to exact non-merge-safe lexical-span recognition', input: '頰笑む！', expected: 'Hohoemu!', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-REVIEWED-PREFERENCE-PRECEDENCE', suite: 'engine', rule: 'Reviewed reading preference still outranks the generic whole-input ambiguous general-word fallback', input: '陌', expected: 'Haku', expectedRequiresReview: true },
            { id: 'UNRESOLVED-RANKED-THIRTY-CONTRACT', suite: 'unit', rule: 'The historical 30 genuine multi-reading cases all produce Romaji while remaining review-required; ambiguity is not converted into literal unresolved output', input: '30 historical ambiguous surfaces', expected: '30:0:30', run: () => { const surfaces = ['その儘','佰','凉風','剝す','匕','卌','召請','否々','塡める','弍','弎','弐','引繰り返る','拋る','捌','焰','玖','疋','筝','菴','蕈','貮','適確','銜む','鋼鈑','閾','閾値','陌','頰','頰笑む']; const results = surfaces.map(surface => translateAuditForGeneratedQa(surface, false)); return `${results.length}:${results.filter(item => item.output.includes('[Unresolved]')).length}:${results.filter(item => item.requiresReview).length}`; } },
            { id: 'SYS-ITERATION-MARK-UNATTESTED-REVIEW', suite: 'unit', rule: 'A structurally repeated 々 form without reviewed whole-word evidence is romanised conservatively but remains reviewable for word-level reading and Rendaku', input: '旅々', expected: 'Tabitabi:review', run: () => { const audit = translateAuditForGeneratedQa('旅々', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'SYS-ITERATION-MARK-ATTESTED-CLEAR', suite: 'unit', rule: 'A known 々 word with authoritative lexical evidence remains confident and is not replaced by the structural fallback', input: '人々', expected: 'Hitobito:clear', run: () => { const audit = translateAuditForGeneratedQa('人々', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-ORTHO-BARE-SMALL-KA-SCOPE', suite: 'unit', rule: 'Bare ヵ remains mechanically romanisable as ka without treating unusual Katakana shape alone as review evidence', input: 'ヵ audit', expected: 'Ka:written-kana:false:false', run: () => { const audit = runTranslatorReadingAudit('ヵ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-SMALL-KE-SCOPE', suite: 'unit', rule: 'Bare ヶ remains mechanically romanisable as ke without treating unusual Katakana shape alone as review evidence', input: 'ヶ audit', expected: 'Ke:written-kana:false:false', run: () => { const audit = runTranslatorReadingAudit('ヶ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-ITERATION-SCOPE', suite: 'unit', rule: 'A bare kana iteration mark is recognised Japanese orthography but cannot be resolved without a preceding syllable', input: 'ゞ audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('ゞ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-SHIME-SCOPE', suite: 'unit', rule: 'Bare 〆 is recognised Japanese orthography but remains reviewable without lexical context', input: '〆 audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('〆'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-DITTO-SCOPE', suite: 'unit', rule: 'A ditto mark requires antecedent content and cannot be presented as resolved Romaji without a repetition decision', input: '〃 audit', expected: '[Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('〃'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-DITTO-AFTER-LEXICAL-SCOPE', suite: 'unit', rule: 'A ditto mark after readable Japanese remains reviewable until its repeated content is explicitly resolved', input: '猫〃 audit', expected: 'Neko [Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('猫〃'); const reading = audit.readings.find(item => item?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-GETA-SCOPE', suite: 'unit', rule: 'A geta mark stands for an unavailable ideograph and must remain explicitly unresolved', input: '〓 audit', expected: '[Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('〓'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-GETA-AFTER-LEXICAL-SCOPE', suite: 'unit', rule: 'A geta mark after readable Japanese cannot disappear into trusted output because its missing ideograph is unknown', input: '猫〓 audit', expected: 'Neko [Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('猫〓'); const reading = audit.readings.find(item => item?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-IDEOGRAPHIC-VARIATION-INDICATOR', suite: 'unit', rule: 'A bare ideographic variation indicator cannot be presented as resolved because it explicitly signals that the intended ideograph is unknown or unavailable', input: '〾 audit', expected: '[Unresolved]:japanese-orthography-unresolved:true:0-1', run: () => { const audit = runTranslatorReadingAudit('〾'); const reading = audit.readings.find(item => item?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}:${reading?.sourceStart}-${reading?.sourceEnd}`; } },
            { id: 'CHECK-ORTHO-IDEOGRAPHIC-VARIATION-INDICATOR-SEQUENCE', suite: 'unit', rule: 'An ideographic variation indicator keeps the following approximate ideograph visible as evidence but makes the result review-required instead of treating the approximation as the intended character', input: '〾都 audit', expected: '[Unresolved] to:true:0-1:1-2', run: () => { const audit = runTranslatorReadingAudit('〾都'); const indicator = audit.readings.find(item => item?.source === 'japanese-orthography-unresolved'); const approximation = audit.readings.find(item => item?.sourceSurface === '都'); return `${audit.output}:${String(audit.requiresReview)}:${indicator?.sourceStart}-${indicator?.sourceEnd}:${approximation?.sourceStart}-${approximation?.sourceEnd}`; } },
            { id: 'CHECK-ORTHO-IDEOGRAPHIC-HALF-FILL-INVERSE', suite: 'unit', rule: 'The neighbouring ideographic half fill space is a visible display-cell compatibility character and is not reclassified as an unknown intended ideograph by the variation-indicator safety rule', input: '〿猫 audit', expected: '〿 Neko:false', run: () => { const audit = runTranslatorReadingAudit('〿猫'); return `${audit.output}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-HISTORICAL-KANA-SUPPLEMENT-SCOPE', suite: 'unit', rule: 'Assigned historic Japanese kana in Kana Supplement remain unresolved without reading evidence but are classified inside Japanese orthographic scope rather than as non-Japanese script', input: '𛀀 audit', expected: '[Unresolved]:japanese-orthography-unresolved:unresolved-japanese-reading:true', run: () => { const audit = runTranslatorReadingAudit('𛀀'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${(reading?.auditCategories || []).join(',')}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-HENTAIGANA-SCOPE', suite: 'unit', rule: 'Unresolved hentaigana in the Japanese Kana Supplement/Extended-A blocks are Japanese orthography rather than out-of-scope input', input: '𛀅 audit', expected: '[Unresolved]:japanese-orthography-unresolved:unresolved-japanese-reading:true', run: () => { const audit = runTranslatorReadingAudit('𛀅'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${(reading?.auditCategories || []).join(',')}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-KATAKANA-PHONETIC-EXTENSION-INVERSE', suite: 'unit', rule: 'Ainu-oriented Katakana Phonetic Extensions are not silently reclassified as Japanese-language historical kana by the Kana Supplement/Extended-A scope rule', input: 'ㇰ audit', expected: '[Unresolved]:unresolved-script:out-of-scope-input:true', run: () => { const audit = runTranslatorReadingAudit('ㇰ'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${(reading?.auditCategories || []).join(',')}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-DAKUTEN-SCOPE', suite: 'unit', rule: 'A standalone spacing dakuten cannot leak silently and is retained in the audit as unresolved Japanese orthography', input: '゛ audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('゛'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-HANDAKUTEN-SCOPE', suite: 'unit', rule: 'A standalone spacing handakuten cannot leak silently and is retained in the audit as unresolved Japanese orthography', input: '゜ audit', expected: '[Unresolved]:japanese-orthography-unresolved:false:true', run: () => { const audit = runTranslatorReadingAudit('゜'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String((reading?.flags || []).includes('unsupported-script'))}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-COMBINING-DAKUTEN-SCOPE', suite: 'unit', rule: 'A surviving unattached combining dakuten is unresolved Japanese orthography rather than literal output', input: 'U+3099 audit', expected: '[Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('\u3099'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-BARE-COMBINING-HANDAKUTEN-SCOPE', suite: 'unit', rule: 'A surviving unattached combining handakuten is unresolved Japanese orthography rather than literal output', input: 'U+309A audit', expected: '[Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('\u309A'); const reading = audit.readings[0]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-INVALID-HANDAKUTEN-REVIEW', suite: 'unit', rule: 'A handakuten that cannot compose with its preceding kana must not leak literally into trusted Romaji', input: 'カ゜ audit', expected: 'Ka [Unresolved]:true:japanese-orthography-unresolved', run: () => { const audit = runTranslatorReadingAudit('カ゜'); const unresolved = audit.readings.find(reading => reading?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${String(audit.requiresReview)}:${unresolved?.source || ''}`; } },
            { id: 'CHECK-ORTHO-BARE-CHOONPU-REVIEW', suite: 'unit', rule: 'A standalone prolonged sound mark cannot disappear silently because there is no preceding kana vowel to extend', input: 'ー audit', expected: '[Unresolved]:true:japanese-orthography-unresolved', run: () => { const audit = runTranslatorReadingAudit('ー'); const unresolved = audit.readings.find(reading => reading?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${String(audit.requiresReview)}:${unresolved?.source || ''}`; } },
            { id: 'CHECK-ORTHO-LEADING-CHOONPU-REVIEW', suite: 'unit', rule: 'A leading prolonged sound mark cannot be silently discarded before otherwise readable kana', input: 'ーア audit', expected: '[Unresolved]:true:japanese-orthography-unresolved', run: () => { const audit = runTranslatorReadingAudit('ーア'); const unresolved = audit.readings.find(reading => reading?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${String(audit.requiresReview)}:${unresolved?.source || ''}`; } },
            { id: 'CHECK-ORTHO-CHOONPU-AFTER-N-REVIEW', suite: 'unit', rule: 'A prolonged sound mark after syllabic n cannot be treated as a vowel extension', input: 'ンー audit', expected: '[Unresolved]:true:japanese-orthography-unresolved', run: () => { const audit = runTranslatorReadingAudit('ンー'); const unresolved = audit.readings.find(reading => reading?.source === 'japanese-orthography-unresolved'); return `${audit.output}:${String(audit.requiresReview)}:${unresolved?.source || ''}`; } },
            { id: 'CHECK-ORTHO-MIXED-KANA-UNRESOLVED-SCOPE', suite: 'unit', rule: 'A mixed token containing ordinary kana and unresolved Japanese orthography remains explicitly unresolved rather than being guessed or treated as unsupported script', input: 'synthetic あ〆 token', expected: 'japanese-orthography-unresolved:[Unresolved]:true', run: () => { const resolution = resolveTokenReading({ surface_form: 'あ〆', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }, 'あ〆'); return `${resolution.source}:${resolution.romaji || ''}:${String((resolution.flags || []).includes('japanese-orthography-unresolved'))}`; } },
            { id: 'CHECK-ORTHO-SHIME-LEXICAL-CONTROL', suite: 'unit', rule: 'Compact lexical evidence may rescue 〆切る from unresolved output while preserving incomplete-coverage provenance for later reading arbitration', input: '〆切る audit', expected: 'Shimekiru:clear', run: () => { const audit = translateAuditForGeneratedQa('〆切る', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-ORTHO-ITERATION-LEXICAL-CONTROL', suite: 'unit', rule: 'A dictionary-resolved kana iteration word remains clear and is not displaced by the structural fallback', input: 'いすゞ audit', expected: 'Isuzu:clear', run: () => { const audit = translateAuditForGeneratedQa('いすゞ', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-ORTHO-ITERATION-SCRIPT-GUARD', suite: 'unit', rule: 'A kana iteration mark from the wrong script is not guessed as a valid repetition', input: 'さヾ audit', expected: 'sa [Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('さヾ'); const reading = audit.readings[audit.readings.length - 1]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-UNATTACHED-IVS-AFTER-KANA', suite: 'unit', rule: 'A supplementary ideographic variation selector without an ideographic base cannot leak invisibly after kana', input: 'か + VS17 audit', expected: 'ka [Unresolved]:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('か\u{E0100}'); const reading = audit.readings[audit.readings.length - 1]; return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-UNATTACHED-IVS-BEFORE-KANA', suite: 'unit', rule: 'A supplementary ideographic variation selector without a preceding ideographic base remains unresolved before kana rather than passing through literally', input: 'VS17 + あ audit', expected: '[Unresolved] A:japanese-orthography-unresolved:true', run: () => { const audit = runTranslatorReadingAudit('\u{E0100}あ'); const reading = audit.readings.find(item => item.source === 'japanese-orthography-unresolved'); return `${audit.output}:${reading?.source || ''}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-IVS-HAN-ATTACHED-CONTROL', suite: 'unit', rule: 'A supplementary ideographic variation selector attached to Han remains a lookup-only glyph selector and does not create unresolved output', input: '晉 + VS17 + 三 audit', expected: 'Shinzou:晉三:false', run: () => { const audit = runTranslatorReadingAudit('晉\u{E0100}三'); return `${audit.output}:${audit.normalizedSourceText}:${String(audit.requiresReview)}`; } },
            { id: 'CHECK-ORTHO-EMOJI-VS16-CONTROL', suite: 'unit', rule: 'The emoji presentation selector remains outside the ideographic-selector safety rule', input: 'coffee + VS16 audit', expected: '☕️:false', run: () => { const audit = runTranslatorReadingAudit('☕\uFE0F'); return `${audit.output}:${String(audit.requiresReview)}`; } },
            { id: 'SYS-AUDIT-TERMINAL-SOKUON-REVIEW', suite: 'unit', rule: 'A terminal small っ is reviewable because Rule 0 only defines sokuon before a following consonant', input: 'terminal-sokuon-review', expected: 'true', run: () => String(buildTranslationDiagnostics('そっ？', 'そっ?', 'So?', [{ surface_form: 'そっ', pos: '感動詞', value: 'so', readingResolution: { source: 'written-kana', confidence: 1, reading: 'そっ', candidates: [], flags: [], variantMappings: [] } }]).requiresReview) },
            { id: 'SYS-AUDIT-TERMINAL-KATAKANA-SOKUON', suite: 'unit', rule: 'Expressive final ッ is the same reviewable terminal-sokuon condition as final っ', input: 'ドキッ', expected: 'true', run: () => String(hasTerminalSokuonReviewCondition('ドキッ')) },
            { id: 'SYS-AUDIT-MEDIAL-SOKUON-CLEAR', suite: 'unit', rule: 'Ordinary medial sokuon with a following consonant is not a terminal-sokuon review condition', input: 'きっぷ', expected: 'false', run: () => String(hasTerminalSokuonReviewCondition('きっぷ')) },
            { id: 'SYS-NUMERIC-LITERAL-LEXICAL-AMBIGUITY', suite: 'unit', rule: 'A numeral-only string tokenised as a proper name is reviewable instead of silently treated as an unambiguous number or name', input: '九十九', expected: 'true', run: () => String(buildTranslationDiagnostics('九十九', '九十九', 'Tsukumo', [{ surface_form: '九十九', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', value: 'Tsukumo', readingResolution: { source: 'kuromoji-context', confidence: 0.8, reading: 'つくも', candidates: [], flags: [], variantMappings: [] } }]).requiresReview) },
            { id: 'SYS-AUDIT-TERMINAL-SOKUON-SPAN-OWNERSHIP', suite: 'unit', rule: 'Each terminal sokuon review signal owns only its local source occurrence rather than the whole input', input: 'あっ。えっ', expected: '1-2:っ|4-5:っ', run: () => { const audit = runTranslatorReadingAudit('あっ。えっ'); return audit.redFlags.filter(item => item.flag === 'terminal-sokuon-review' && item.state === 'final-active').map(item => `${item.sourceStart}-${item.sourceEnd}:${item.sourceSurface}`).join('|'); } },
            { id: 'SYS-AUDIT-REPEATED-SOKUON-SPAN-OWNERSHIP', suite: 'unit', rule: 'A repeated-sokuon review signal is source-local even when unrelated ambiguous Japanese follows later in the sentence', input: 'あっっか。市場について話す', expected: '1-3:っっ', run: () => { const audit = runTranslatorReadingAudit('あっっか。市場について話す'); const signal = audit.redFlags.find(item => item.flag === 'repeated-sokuon-review' && item.state === 'final-active'); return `${signal?.sourceStart}-${signal?.sourceEnd}:${signal?.sourceSurface}`; } },
            { id: 'SYS-AUDIT-NONGEMINATIVE-SOKUON-SPAN-OWNERSHIP', suite: 'unit', rule: 'A non-geminative sokuon review signal is source-local and does not claim later sentence material', input: 'あっら。市場について話す', expected: '1-2:っ', run: () => { const audit = runTranslatorReadingAudit('あっら。市場について話す'); const signal = audit.redFlags.find(item => item.flag === 'non-geminative-sokuon-review' && item.state === 'final-active'); return `${signal?.sourceStart}-${signal?.sourceEnd}:${signal?.sourceSurface}`; } },
            { id: 'SYS-AUDIT-NUMERIC-LEXICAL-REPEATED-SPAN-OWNERSHIP', suite: 'unit', rule: 'Repeated numeral-shaped lexical/name ambiguities retain distinct source ownership across a hard delimiter', input: '九十九〜九十九', expected: '0-3:九十九|4-7:九十九', run: () => { const audit = runTranslatorReadingAudit('九十九〜九十九'); return audit.redFlags.filter(item => item.flag === 'numeric-literal-lexical-ambiguity' && item.state === 'final-active').map(item => `${item.sourceStart}-${item.sourceEnd}:${item.sourceSurface}`).join('|'); } },
            { id: 'SYS-AUDIT-NUMERIC-LEXICAL-MULTI-REVIEW-SPAN-ISOLATION', suite: 'unit', rule: 'A numeric lexical ambiguity and an independent contextual ambiguity keep separate source ownership in the same input', input: '九十九〜市場について話す', expected: '0-3:九十九|4-6:市場:true', run: () => { const audit = runTranslatorReadingAudit('九十九〜市場について話す'); const numeric = audit.redFlags.find(item => item.flag === 'numeric-literal-lexical-ambiguity' && item.state === 'final-active'); const market = audit.redFlags.find(item => item.flag === 'sentence-context-ambiguous' && item.sourceSurface === '市場' && item.state === 'final-active'); return `${numeric?.sourceStart}-${numeric?.sourceEnd}:${numeric?.sourceSurface}|${market?.sourceStart}-${market?.sourceEnd}:${market?.sourceSurface}:${String(Boolean(audit.requiresReview))}`; } },
            { id: 'READING-RESOLUTION-SUPPORTED-KANJI-FALLBACK', suite: 'unit', rule: 'Supported Han without stronger whole-word evidence emits the best evidence-backed character candidate instead of literal unresolved output', input: '𠮷', expected: 'japanese-scope-character-fallback', run: () => resolveTokenReading({ surface_form: '𠮷', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }, '𠮷').source },
            { id: 'MECH-READING-ARBITRATION-COMPOSITIONAL-FALLBACK-PREFERS-ON', suite: 'unit', rule: 'When no whole-word evidence resolves an unsupported pure-Han compound, compositional fallback prefers each character’s KANJIDIC on-reading instead of accidentally inheriting a higher-ranked bare kun-reading', input: 'synthetic unsupported pure-Han compound 山唖', expected: 'japanese-scope-compositional-fallback:さんあ:true', run: () => { const resolution = resolveTokenReading({ surface_form: '山唖', pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', reading: '*', pronunciation: '*' }, '山唖'); return `${resolution.source}:${normalizeKanaReading(resolution.reading || '')}:${String((resolution.flags || []).includes('kanji-compositional-fallback'))}`; } },
            { id: 'READING-RESOLUTION-NAME-RANKED-AMBIGUITY', suite: 'unit', rule: 'The reading resolver keeps raw Romaji lowercase while retaining legitimate name ambiguity for final Rule 0 formatting', input: '山﨑 / 山崎 name readings', expected: 'yamazaki:ambiguous', run: () => { const resolution = resolveProperNounReading({ surface_form: '山﨑', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', pos_detail_3: '姓', reading: '*', pronunciation: '*' }); return `${resolution?.romaji || ''}:${resolution?.ambiguous ? 'ambiguous' : 'resolved'}`; } },
            { id: 'RANK-NAME-EQUAL-EVIDENCE', suite: 'unit', rule: 'Equal legitimate name readings remain unresolved without contextual evidence', input: '50 / 50', expected: 'ambiguous', run: () => rankProperNounCandidates([{ reading: 'a', weight: 50, rank: 100, sources: new Set(['a']) }, { reading: 'b', weight: 50, rank: 100, sources: new Set(['a']) }]).selected ? 'selected' : 'ambiguous' },
            { id: 'ADV-PROPER-NOUN-KUROMOJI-DOES-NOT-ERASE-EQUAL-AMBIGUITY', suite: 'unit', rule: 'A Kuromoji reading alone does not resolve equally supported proper-name alternatives', input: '日本 / ニッポン', expected: 'ambiguous', run: () => resolveProperNounReading({ surface_form: '日本', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '*', reading: 'ニッポン', pronunciation: 'ニッポン' })?.ambiguous ? 'ambiguous' : 'resolved' },
            { id: 'SYS-PROPER-NOUN-KUROMOJI-AMBIGUITY-CONTRACT', suite: 'unit', rule: 'Either Kuromoji choice remains reviewable when the proper-name evidence itself is tied', input: 'synthetic tied readings', expected: 'ambiguous:ambiguous', run: () => { const surface = '試験曖昧名'; const previous = runtimeState.properNounDictionary.get(surface); const candidates = new Map([['こう', { reading: 'こう', romaji: 'kou', weight: 50, rank: 100, categories: new Set(['loc']), sources: new Set(['qa']) }], ['ぎょう', { reading: 'ぎょう', romaji: 'gyou', weight: 50, rank: 100, categories: new Set(['loc']), sources: new Set(['qa']) }]]); try { runtimeState.properNounDictionary.set(surface, candidates); const makeToken = reading => ({ surface_form: surface, pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '*', reading, pronunciation: reading }); const left = resolveProperNounReading(makeToken('コウ')); const right = resolveProperNounReading(makeToken('ギョウ')); return `${left?.ambiguous ? 'ambiguous' : 'resolved'}:${right?.ambiguous ? 'ambiguous' : 'resolved'}`; } finally { if (previous) runtimeState.properNounDictionary.set(surface, previous); else runtimeState.properNounDictionary.delete(surface); } } },
            { id: 'R0-NO-HAN-GUARD', suite: 'unit', rule: 'The Romaji output guard never allows unresolved Han to leak through', input: 'ABC𠮷DEF', expected: 'ABC[Unresolved]DEF', run: () => blockUnresolvedHanFromRomaji('ABC𠮷DEF') },
            { id: 'MECH-REVIEW-PREFIX-PROPER-NAME-GUARD', suite: 'unit', rule: 'A nominal prefix followed by a proper-name token remains reviewable when no independent whole-span evidence authorises that structure', input: 'synthetic prefix + proper name', expected: 'review:nominal-prefix-proper-name-boundary', run: () => { const tokens = [{ surface_form: '軽', pos: '接頭詞', pos_detail_1: '名詞接続', pos_detail_2: '*', sourceStart: 0, sourceEnd: 1 }, { surface_form: '音部', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', sourceStart: 1, sourceEnd: 3 }]; const marked = markUnreviewedNameContextTokens(tokens, []); return `${marked[1]?.nameContextAmbiguous ? 'review' : 'clear'}:${marked[1]?.nameContextStructure || ''}`; } },
            { id: 'MECH-REVIEW-PREFIX-PROPER-NAME-EVIDENCE-GUARD', suite: 'unit', rule: 'Independent reviewed whole-span lexical evidence prevents a false name-context review on a prefix plus proper-name analyser split', input: 'synthetic prefix + proper name + reviewed span', expected: 'clear', run: () => { const tokens = [{ surface_form: '軽', pos: '接頭詞', pos_detail_1: '名詞接続', pos_detail_2: '*', sourceStart: 0, sourceEnd: 1 }, { surface_form: '音部', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', sourceStart: 1, sourceEnd: 3 }]; const evidence = [{ sourceStart: 0, sourceEnd: 3, category: 'lexical', kind: 'common-word', evidenceSource: 'common-word-bank', reviewRequired: false }]; return markUnreviewedNameContextTokens(tokens, evidence)[1]?.nameContextAmbiguous ? 'review' : 'clear'; } },
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
            { id: 'CHECK-BARE-WI-KATAKANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete katakana ヰ to modern イ without manufacturing review from script alone', input: 'ヰ', expected: 'I', expectedRequiresReview: false },
            { id: 'CHECK-BARE-WE-HIRAGANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete hiragana ゑ to modern え from existing official historical-kana evidence', input: 'ゑ', expected: 'E', expectedRequiresReview: false },
            { id: 'CHECK-BARE-WE-KATAKANA', suite: 'engine', rule: 'Modern mode phonologically normalises obsolete katakana ヱ to modern エ without manufacturing review from script alone', input: 'ヱ', expected: 'E', expectedRequiresReview: false },
            { id: 'CHECK-WIRU-MODERN', suite: 'engine', rule: 'Modern mode applies the obsolete W-row kana normalisation inside a lexical hiragana form', input: 'ゐる', expected: 'Iru', expectedRequiresReview: false },
            { id: 'CHECK-MAWIRU-MODERN', suite: 'engine', rule: 'Modern mode applies obsolete ゐ normalisation medially without requiring a whole-word historical override', input: 'まゐる', expected: 'Mairu', expectedRequiresReview: false },
            { id: 'CHECK-KOWE-MODERN', suite: 'engine', rule: 'Modern mode applies obsolete ゑ normalisation medially using the same W-row orthographic class', input: 'こゑ', expected: 'Koe', expectedRequiresReview: false },
            { id: 'CHECK-UWERU-MODERN', suite: 'engine', rule: 'Modern mode resolves an all-kana historical W-row spelling by normalising only the obsolete kana before ordinary analysis', input: 'うゑる', expected: 'Ueru', expectedRequiresReview: false },
            { id: 'CHECK-MIXED-UWERU-MODERN', suite: 'engine', rule: 'Modern mode normalises obsolete ゑ before tokenisation so a mixed Kanji-kana lexical form is analysed as the ordinary modern verb', input: '植ゑる', expected: 'Ueru', expectedRequiresReview: false },
            { id: 'CHECK-STYLISTIC-KATAKANA', suite: 'engine', rule: 'Stylistic obsolete Katakana receives its modern vowel value while review remains evidence-driven rather than script-driven', input: 'ヱビス', expected: 'Ebisu', expectedRequiresReview: false },
            { id: 'CHECK-MODERN-HIRAGANA-CONTROL', suite: 'engine', rule: 'Normal modern hiragana remains unchanged by obsolete W-row normalisation', input: 'いえ', expected: 'Ie', expectedRequiresReview: false },
            { id: 'CHECK-MODERN-KATAKANA-CONTROL', suite: 'engine', rule: 'Normal modern Katakana retains its output without acquiring review solely from script choice', input: 'イエ', expected: 'Ie', expectedRequiresReview: false },
            { id: 'CHECK-SCOPE-BARE-TSUCHIYOSHI', suite: 'unit', rule: 'Reviewed MJ/Unihan evidence classifies supplementary-plane 𠮷 as Japanese scope without forcing one pronunciation', input: '𠮷', expected: 'japanese-scope:3', run: () => { const result = classifyHanCharacterScope('𠮷'); return `${result.scope}:${result.candidates.length}`; } },
            { id: 'CHECK-SCOPE-KANJIDIC-CONTROL', suite: 'unit', rule: 'Ordinary KANJIDIC-covered Kanji enter Japanese scope through the existing Kanji bank rather than the supplemental bank', input: '日', expected: 'japanese-scope:kanjidic', run: () => { const result = classifyHanCharacterScope('日'); return `${result.scope}:${result.evidence[0]?.source || ''}`; } },
            { id: 'CHECK-SCOPE-GENERAL-VARIANT', suite: 'unit', rule: 'Existing general Japanese variant mappings are positive Japanese-scope evidence', input: '國', expected: 'japanese-scope:国', run: () => { const result = classifyHanCharacterScope('國'); return `${result.scope}:${result.reference || ''}`; } },
            { id: 'CHECK-SHITSU-VARIANT-WORD-LOOKUP', suite: 'unit', rule: 'The Jōyō/JIS variant 𠮟 uses 叱 only for whole-word reading lookup', input: '𠮟り方', expected: '叱り方', run: () => normalizeKanjiForLookup('𠮟り方') },
            { id: 'CHECK-SHITSU-VARIANT-SHIKARIKATA', suite: 'engine', rule: 'The Jōyō/JIS variant spelling 𠮟り方 resolves through canonical whole-word evidence rather than character-by-character fallback', input: '𠮟り方', expected: 'Shikarikata', expectedRequiresReview: false },
            { id: 'CHECK-SHITSU-CANONICAL-CONTROL', suite: 'engine', rule: 'Canonical 叱り方 remains unchanged by variant lookup support', input: '叱り方', expected: 'Shikarikata', expectedRequiresReview: false },
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
            { id: 'CHECK-ORDINARY-KANJI-CONTROL', suite: 'engine', rule: 'Ordinary non-variant Japanese Kanji continue through existing lexical/KANJIDIC paths unchanged', input: '日本語', expected: 'Nihongo', expectedRequiresReview: true },
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
            { id: 'CHECK-ORDINARY-JAPANESE-CONTROL', suite: 'engine', rule: 'Rare-Han scope evidence does not disturb ordinary Japanese lexical resolution', input: '日本語', expected: 'Nihongo', expectedRequiresReview: true },
            { id: 'CHECK-JAPANESE-HAN-STATS', suite: 'unit', rule: 'Ambiguous supported Han is represented as resolved Romaji requiring review, not as an unresolved-Japanese or scope-error statistic', input: '𠮷 statistics', expected: 'true:0:0:0:0:0:true', run: () => { const audit = runTranslatorReadingAudit('𠮷'); const s = audit.statistics || {}; return `${String(Boolean(s.requiresReview))}:${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}:${String(Boolean(s.resolvedOutputRequiresReview))}`; } },
            { id: 'CHECK-UNKNOWN-HAN-STATS', suite: 'unit', rule: 'Unknown-scope Han is counted separately from both unresolved Japanese and positively out-of-scope script input', input: '𰻞 statistics', expected: 'true:0:0:0:1:1:false', run: () => { const audit = runTranslatorReadingAudit('𰻞'); const s = audit.statistics || {}; return `${String(Boolean(s.requiresReview))}:${s.unresolvedJapaneseReadings}:${s.unresolvedJapaneseHan}:${s.outOfScopeInput}:${s.unknownJapaneseScopeStatus}:${s.literalUnresolved}:${String(Boolean(s.resolvedOutputRequiresReview))}`; } },
            { id: 'CHECK-UNRESOLVED-MARKER-PREFIX-CASE', suite: 'unit', rule: 'The reserved unresolved marker keeps its exact casing when it follows a productive prefix', input: '第𠀀巻', expected: 'Dai [Unresolved] Maki:1', run: () => { const audit = runTranslatorReadingAudit('第𠀀巻'); return `${audit.output}:${audit.statistics?.literalUnresolved || 0}`; } },
            { id: 'CHECK-UNRESOLVED-MARKER-GRAMMAR-CASE', suite: 'unit', rule: 'Grammatical lowercasing cannot mutate the reserved unresolved safety marker', input: 'synthetic grammatical unresolved token', expected: '[Unresolved]', run: () => convertToken({ surface_form: '𠀀', pos: '助詞', pos_detail_1: '格助詞', pos_detail_2: '*', pos_detail_3: '*', reading: '*', pronunciation: '*' }, '𠀀') },
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
                input, expected, expectedRequiresReview: true
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
                input, expected, expectedRequiresReview: id === 'LEX-09'
            })),
            { id: 'MECH-READING-ARBITRATION-OOMIZU-REVIEWED-PREFERENCE', suite: 'engine', rule: 'Reviewed whole-word evidence prevents the unsupported Daisui reading while preserving review for the attested Oomizu and Taisui alternatives', input: '大水', expected: 'Oomizu', expectedRequiresReview: true },
            { id: 'MECH-READING-ARBITRATION-CROSS-BANK-OTOKO-ONOKO', suite: 'engine', rule: 'Bare 男 remains reviewable because maintained lexical evidence supports both modern おとこ and historical おのこ readings; ordinary contextual compounds may resolve independently', input: '男', expected: 'Otoko', expectedRequiresReview: true },
        ];
    }

    function getHistoricalKanaRegressionChecks() {
        return [
            { id: 'SYS-AUDIT-HISTORICAL-FULL-SIZE-SOKUON', suite: 'unit', rule: 'Historical mode treats a full-size つ before a geminatable consonant as ambiguous unless attested historical evidence resolves it', input: '立つて', expected: 'true', run: () => String(buildTranslationDiagnostics('立つて', '立つて', 'Tatsute', [{ surface_form: '立つて', pos: '動詞', value: 'tatsute', readingResolution: { source: 'tokenizer', confidence: 0.8, reading: 'たつて', candidates: [], flags: [], variantMappings: [] } }], { historicalKana: true }).requiresReview) },
            { id: 'SYS-AUDIT-HISTORICAL-FULL-SIZE-SOKUON-SPAN-OWNERSHIP', suite: 'unit', rule: 'Historical full-size sokuon ambiguity signals retain each local source occurrence instead of claiming the whole input', input: 'あつか。えつか', expected: '1-2:つ|5-6:つ', run: () => { const audit = buildTranslationDiagnostics('あつか。えつか', 'あつか。えつか', 'Atsuka. Etsuka', [], { historicalKana: true }); return audit.redFlags.filter(item => item.flag === 'historical-full-size-sokuon-ambiguity' && item.state === 'final-active').map(item => `${item.sourceStart}-${item.sourceEnd}:${item.sourceSurface}`).join('|'); } },
            { id: 'SCHEMA-HISTORICAL-EVIDENCE-PROVENANCE', suite: 'unit', rule: 'Historical-kana evidence requires lexical role and source provenance', input: 'をかし / historical evidence', expected: 'accepted', run: () => { try { validateAssetSchema('historicalKanaEvidence', { entries: [{ surface: 'をかし', reading: 'おかし', pos: '形容詞', source: 'https://example.test/source' }] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-HISTORICAL-EVIDENCE-SOURCE-MISSING-REJECT', suite: 'unit', rule: 'Source-less historical-kana rows cannot become authoritative evidence', input: 'をかし / source missing', expected: 'rejected', run: () => { try { validateAssetSchema('historicalKanaEvidence', { entries: [{ surface: 'をかし', reading: 'おかし', pos: '形容詞' }] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-HISTORICAL-EVIDENCE-POS-MISSING-REJECT', suite: 'unit', rule: 'Historical-kana rows require their lexical role so obsolete spelling evidence is not applied without scope', input: 'をかし / part of speech missing', expected: 'rejected', run: () => { try { validateAssetSchema('historicalKanaEvidence', { entries: [{ surface: 'をかし', reading: 'おかし', source: 'https://example.test/source' }] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-HISTORICAL-EVIDENCE-CONJUGATION-CLASS', suite: 'unit', rule: 'Historical adjective evidence may carry a reviewed conjugation class used only for evidence-bounded inflection recovery', input: 'をかし / シク活用', expected: 'accepted', run: () => { try { validateAssetSchema('historicalKanaEvidence', { entries: [{ surface: 'をかし', reading: 'おかし', pos: '形容詞', conjugationClass: 'シク活用', source: 'https://example.test/source' }] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'SCHEMA-HISTORICAL-EVIDENCE-CONJUGATION-CLASS-INVALID', suite: 'unit', rule: 'Historical conjugation metadata rejects unsupported values instead of widening inflection recovery silently', input: 'をかし / invalid conjugation class', expected: 'rejected', run: () => { try { validateAssetSchema('historicalKanaEvidence', { entries: [{ surface: 'をかし', reading: 'おかし', pos: '形容詞', conjugationClass: 'unknown', source: 'https://example.test/source' }] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'MECH-KANA-HISTORICAL-SPECIAL-KATAKANA-READING-CONTRACT', suite: 'unit', rule: 'Historical-kana loading uses the same semantic-kana contract as schema validation, including precomposed ヷ/ヸ/ヹ/ヺ readings', input: 'ヷ / ヸ / ヹ / ヺ', expected: 'accepted:ゔぁ/ゔぃ/ゔぇ/ゔぉ', run: () => { const readings = ['ヷ', 'ヸ', 'ヹ', 'ヺ']; const entries = readings.map((reading, index) => ({ surface: `仮${index + 1}`, reading, pos: '名詞', source: 'https://example.test/source' })); try { validateAssetSchema('historicalKanaEvidence', { entries }, 'qa'); } catch (_) { return 'rejected'; } return `accepted:${readings.map(normalizeKanaReading).join('/')}`; } },
            { id: 'R0-KANA-LARGE-TSU', suite: 'unit', rule: 'Full-size つ remains tsu by default in modern text unless historical evidence proves a sokuon reading', input: 'まつ', expected: 'matsu', run: () => convertToRomaji('まつ') },
            { id: 'CHECK-LONG-HISTORICAL-SPAN-11', suite: 'unit', rule: 'Historical-kana evidence spans are evidence-bounded rather than capped at ten tokens', input: '11-token historical span', expected: '11', run: () => { const original = runtimeState.historicalKanaEvidenceDictionary; const originalPrefixes = runtimeState.historicalKanaEvidencePrefixes; const surface = 'ゐゐゐゐゐゐゐゐゐゐゐ'; const tokens = Array.from(surface).map(value => ({ surface_form: value, pos: '名詞' })); try { runtimeState.historicalKanaEvidenceDictionary = new Map([[surface, { reading: 'いいいいいいいいいいい', source: 'qa' }]]); runtimeState.historicalKanaEvidencePrefixes = new Set(); addSurfacePrefixes(runtimeState.historicalKanaEvidencePrefixes, surface); return String(findLongestHistoricalKanaEvidence(tokens, 0)?.length || 0); } finally { runtimeState.historicalKanaEvidenceDictionary = original; runtimeState.historicalKanaEvidencePrefixes = originalPrefixes; } } },
            { id: 'CHECK-HIST-ITERATION-SYMBOL-SPAN', suite: 'unit', rule: 'Exact historical evidence may span a kana iteration mark even when Kuromoji exposes the mark as a symbol token', input: 'こゝろ', expected: 'こゝろ:historical', run: () => { const source = 'こゝろ'; const raw = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const merged = mergeHistoricalKanaEvidenceTokens(raw); return `${merged[0]?.surface_form || ''}:${merged[0]?.historicalKanaEvidenceMatched ? 'historical' : 'missing'}`; } },
            { id: 'CHECK-HIST-FIXED-ENCODED-KANA-NORMALISATION', suite: 'unit', rule: 'Historical encoded kana with an explicit Unicode ordinary-kana equivalent normalise structurally without inferring a lexical reading', input: '𛀀/𛄣/𛄤/𛄥/𛄦/𛄧/𛄨', expected: 'エ|こと|トキ|トテ|ヨリ|ネ|ヰ', run: () => ['𛀀','𛄣','𛄤','𛄥','𛄦','𛄧','𛄨'].map(normalizeHistoricalFixedEncodedKanaForms).join('|') },
            { id: 'CHECK-HIST-ARCHAIC-YI-YE-WU-RULE0-NORMALISATION', suite: 'unit', rule: 'Unicode-fixed archaic wu/yi/ye/wu identities normalise in historical mode to the existing CJ2R extended-kana spellings consumed by the Rule-0 romaniser', input: '𛄟/𛄠/𛄡/𛄢', expected: 'うぅ|いぃ|いぇ|うぅ', run: () => ['𛄟','𛄠','𛄡','𛄢'].map(normalizeHistoricalArchaicSyllableKana).join('|') },
            { id: 'CHECK-HIST-SMALL-KANA-EXTENSION-U17-SCOPE', suite: 'unit', rule: 'The nine Unicode 17 historic Small Kana Extension characters remain inside Japanese historical orthographic runs without sweeping the mixed-use block', input: 'U+1B132/U+1B150..152/U+1B155/U+1B164..167', expected: '9/9 guarded', run: () => { const values = ['𛄲','𛅐','𛅑','𛅒','𛅕','𛅤','𛅥','𛅦','𛅧']; const guarded = values.filter(value => resolveHistoricalContextualKanaExtensionRun(`𛀻うしん${value}`) === `𛀻うしん${value}`).length; return `${guarded}/${values.length} guarded`; } },
            { id: 'CHECK-HIST-SMALL-WI-WE-LABIALISATION-NORMALISATION', suite: 'unit', rule: 'Historical small WI/WE resolve only in the attested k/g labialised combinations and reuse the existing Rule-0 kwi/gwi/kwe/gwe spellings', input: 'く𛅐/ぐ𛅐/ク𛅤/グ𛅤/く𛅑/ぐ𛅑/ク𛅥/グ𛅥', expected: 'Kwi|Gwi|Kwi|Gwi|Kwe|Gwe|Kwe|Gwe', run: () => ['く𛅐','ぐ𛅐','ク𛅤','グ𛅤','く𛅑','ぐ𛅑','ク𛅥','グ𛅥'].map(value => translateAuditForGeneratedQa(value, false, { historicalKana: true }).output).join('|') },
            { id: 'CHECK-HIST-SMALL-KANA-UNSUPPORTED-IDENTITY-GUARD', suite: 'unit', rule: 'Small KO, WO and N remain review-required because current evidence does not establish one safe Rule-0 reading rule for those encoded functions', input: '𛄲/𛅕/く𛅒/ク𛅦/𛅧 historical mode', expected: '5/5 review', run: () => { const values = ['𛄲','𛅕','く𛅒','ク𛅦','𛅧']; const review = values.filter(value => translateAuditForGeneratedQa(value, false, { historicalKana: true }).requiresReview).length; return `${review}/${values.length} review`; } },
            { id: 'CHECK-HIST-SMALL-KANA-RUN-BOUNDARY-GUARD', suite: 'unit', rule: 'An unresolved historic Small Kana Extension character stays inside a contextual kana run and cannot let a preceding ambiguous hentaigana fragment resolve independently', input: '𛀻うしん𛄲', expected: '𛀻うしん𛄲', run: () => resolveHistoricalContextualKanaExtensionRun('𛀻うしん𛄲') },
            { id: 'CHECK-HIST-HENTAIGANA-SINGLE-VALUE-COVERAGE', suite: 'unit', rule: 'Historical-mode automatic hentaigana conversion is limited to the 274 Unicode/CODH code points with one maintained modern-kana value', input: 'U+1B002..U+1B11C single-valued hentaigana coverage', expected: '274', run: () => String(historicalSingleValuedHentaiganaRanges.reduce((count, range) => count + (range.end - range.start + 1), 0)) },
            { id: 'CHECK-HIST-HENTAIGANA-AMBIGUOUS-EXCLUSION', suite: 'unit', rule: 'Unicode hentaigana with multiple attested modern-kana values are excluded from automatic normalisation instead of selecting one reading', input: '𛀅/𛀢/𛀻/𛁭/𛁽/𛂎/𛂘/𛃖/𛃢/𛄝/𛄞', expected: '11/11 unresolved', run: () => { const ambiguous = ['𛀅','𛀢','𛀻','𛁭','𛁽','𛂎','𛂘','𛃖','𛃢','𛄝','𛄞']; const unresolved = ambiguous.filter(value => getHistoricalSingleValuedHentaiganaModernKana(value) === null).length; return `${unresolved}/${ambiguous.length} unresolved`; } },
            { id: 'CHECK-HIST-HENTAIGANA-AMBIGUOUS-CANDIDATE-MAP', suite: 'unit', rule: 'Each multi-valued encoded hentaigana retains exactly its CODH/NINJAL candidate kana set instead of a preferred reading', input: '11 multi-valued hentaigana candidate sets', expected: 'あ/を|か/け|き/こ|つ/と|と/ら|に/て|ね/こ|ま/め|や/よ|む/も/ん|む/も/ん', run: () => ['𛀅','𛀢','𛀻','𛁭','𛁽','𛂎','𛂘','𛃖','𛃢','𛄝','𛄞'].map(value => getHistoricalAmbiguousHentaiganaCandidates(value).join('/')).join('|') },
            { id: 'CHECK-HIST-HENTAIGANA-LEXICAL-CONTEXT-RESOLUTION', suite: 'unit', rule: 'A multi-valued hentaigana may resolve only when one exact kana-run candidate has strong maintained whole-word lexical reading evidence', input: '𛀻うしん', expected: 'こうしん', run: () => resolveHistoricalAmbiguousHentaiganaKanaRun('𛀻うしん') },
            { id: 'CHECK-HIST-HENTAIGANA-LEXICAL-COLLISION-GUARD', suite: 'unit', rule: 'If more than one hentaigana candidate is supported by strong maintained whole-word lexical evidence, CJ2R must preserve the original ambiguous glyph', input: 'そう𛀢い', expected: 'そう𛀢い', run: () => resolveHistoricalAmbiguousHentaiganaKanaRun('そう𛀢い') },
            { id: 'CHECK-HIST-HENTAIGANA-LEXICAL-STANDALONE-GUARD', suite: 'unit', rule: 'Whole-word lexical evidence cannot collapse a standalone multi-valued hentaigana without surrounding kana context', input: '𛀻', expected: '𛀻', run: () => resolveHistoricalAmbiguousHentaiganaKanaRun('𛀻') },
            { id: 'CHECK-HIST-ARCHAIC-YE-DUAL-IDENTITY-CANDIDATES', suite: 'unit', rule: 'U+1B001 retains both Unicode identities for contextual resolution: hentaigana e and archaic ye through the existing Rule-0 extended-kana spelling', input: '𛀁', expected: 'え|いぇ', run: () => getHistoricalArchaicYeDualIdentityCandidates('𛀁').join('|') },
            { id: 'CHECK-HIST-ARCHAIC-YE-LEXICAL-CONTEXT-RESOLUTION', suite: 'unit', rule: 'U+1B001 may resolve to one identity only when the complete kana run has exactly one strong maintained lexical candidate', input: '𛀁ど', expected: 'えど', run: () => resolveHistoricalArchaicYeDualIdentityKanaRun('𛀁ど') },
            { id: 'CHECK-HIST-ARCHAIC-YE-STANDALONE-GUARD', suite: 'unit', rule: 'U+1B001 has no standalone default despite its two bounded identities', input: '𛀁', expected: '𛀁', run: () => resolveHistoricalArchaicYeDualIdentityKanaRun('𛀁') },
            { id: 'CHECK-HIST-HENTAIGANA-EXTENSION-RUN-BOUNDARY-GUARD', suite: 'unit', rule: 'An unresolved historical kana-extension character remains inside the orthographic run and cannot let a preceding fragment masquerade as a complete lexical run', input: '𛀻うしん𛀁', expected: '𛀻うしん𛀁', run: () => resolveHistoricalAmbiguousHentaiganaKanaRun('𛀻うしん𛀁') },
            { id: 'CHECK-HIST-KANA-EXTENSION-COMBINED-BOUNDARY-GUARD', suite: 'unit', rule: 'The production contextual resolver evaluates multi-valued hentaigana and U+1B001 across one complete historical-kana run rather than resolving fragments independently', input: '𛀻うしん𛀁', expected: '𛀻うしん𛀁', run: () => resolveHistoricalContextualKanaExtensionRun('𛀻うしん𛀁') },
            { id: 'CHECK-HIST-HENTAIGANA-REPRESENTATIVE-NORMALISATION', suite: 'unit', rule: 'Single-valued hentaigana normalise to their maintained modern hiragana values across the encoded range', input: '𛀂/𛀆/𛀳/𛂞/𛄍/𛄒/𛄖', expected: 'あ|い|け|は|ゐ|ゑ|を', run: () => ['𛀂','𛀆','𛀳','𛂞','𛄍','𛄒','𛄖'].map(normalizeHistoricalSingleValuedHentaigana).join('|') },
            { id: 'CHECK-HIST-HENTAIGANA-DAKUTEN-COMPOSITION', suite: 'unit', rule: 'After a single-valued hentaigana is mapped to ordinary kana, combining and spacing dakuten compose through the existing kana voicing normaliser', input: '𛀳 + combining/spacing dakuten', expected: 'げ|げ', run: () => [normalizeHistoricalSingleValuedHentaigana('𛀳\u3099'), normalizeHistoricalSingleValuedHentaigana('𛀳゛')].join('|') },
            { id: 'CHECK-HIST-HENTAIGANA-HANDAKUTEN-COMPOSITION', suite: 'unit', rule: 'After a single-valued hentaigana is mapped to ordinary kana, combining and spacing handakuten compose when Japanese orthography permits it', input: '𛂦 + combining/spacing handakuten', expected: 'ぱ|ぱ', run: () => [normalizeHistoricalSingleValuedHentaigana('𛂦\u309A'), normalizeHistoricalSingleValuedHentaigana('𛂦゜')].join('|') },
            { id: 'HIST-SMALL-WI-HIRAGANA-K', suite: 'historical', rule: 'Historical small hiragana WI after く represents the attested labialised kwi sequence', input: 'く𛅐', expected: 'Kwi', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WI-HIRAGANA-G', suite: 'historical', rule: 'Historical small hiragana WI after ぐ represents the attested labialised gwi sequence', input: 'ぐ𛅐', expected: 'Gwi', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WI-KATAKANA-K', suite: 'historical', rule: 'Historical small katakana WI after ク represents the attested labialised kwi sequence', input: 'ク𛅤', expected: 'Kwi', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WI-KATAKANA-G', suite: 'historical', rule: 'Historical small katakana WI after グ represents the attested labialised gwi sequence', input: 'グ𛅤', expected: 'Gwi', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WE-HIRAGANA-K', suite: 'historical', rule: 'Historical small hiragana WE after く represents the attested labialised kwe sequence', input: 'く𛅑', expected: 'Kwe', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WE-HIRAGANA-G', suite: 'historical', rule: 'Historical small hiragana WE after ぐ represents the attested labialised gwe sequence', input: 'ぐ𛅑', expected: 'Gwe', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WE-KATAKANA-K', suite: 'historical', rule: 'Historical small katakana WE after ク represents the attested labialised kwe sequence', input: 'ク𛅥', expected: 'Kwe', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WE-KATAKANA-G', suite: 'historical', rule: 'Historical small katakana WE after グ represents the attested labialised gwe sequence', input: 'グ𛅥', expected: 'Gwe', expectedRequiresReview: false },
            { id: 'HIST-SMALL-WI-WE-NORMAL-MODE-GUARD', suite: 'unit', rule: 'Historic Small Kana Extension labialisation is opt-in and remains unresolved in ordinary translation mode', input: 'く𛅐 normal mode', expected: 'Ku [Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('く𛅐', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-SMALL-WO-HISTORICAL-GUARD', suite: 'unit', rule: 'Small WO remains review-required in historical mode because its encoded attestation does not justify a generic kwo/gwo rule', input: 'く𛅒 historical mode', expected: 'Ku [Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('く𛅒', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-SMALL-N-HISTORICAL-GUARD', suite: 'unit', rule: 'Small katakana N remains review-required because Unicode documents a nasalisation function rather than ordinary syllabic ン equivalence', input: '𛅧 historical mode', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('𛅧', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-SMALL-KO-HISTORICAL-GUARD', suite: 'unit', rule: 'Small KO remains review-required because the encoding evidence establishes a distinct character but not one phonological normalisation rule', input: '𛄲 historical mode', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('𛄲', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-FIXED-ARCHAIC-KATAKANA-E', suite: 'historical', rule: 'Historical mode treats U+1B000 as Unicode explicitly defines it: an obsolete form of Katakana エ representing e', input: '𛀀', expected: 'E', expectedRequiresReview: false },
            { id: 'HIST-FIXED-HIRAGANA-DIGRAPH-KOTO', suite: 'historical', rule: 'Historical mode expands the encoded historic hiragana digraph KOTO to its explicit こと equivalent before romanisation', input: '𛄣', expected: 'Koto', expectedRequiresReview: false },
            { id: 'HIST-FIXED-ALTERNATE-WI', suite: 'historical', rule: 'Historical mode reduces the older alternate Katakana WI form to ヰ and then follows CJ2R existing obsolete-w-row romanisation behaviour', input: '𛄨', expected: 'I', expectedRequiresReview: false },
            { id: 'HIST-HENTAIGANA-KOKORO', suite: 'historical', rule: 'Historical mode converts single-valued encoded hentaigana through their maintained modern-hiragana values before lexical romanisation', input: '𛀸𛀸𛄂', expected: 'Kokoro', expectedRequiresReview: false },
            { id: 'HIST-HENTAIGANA-MULTIVALUE-LEXICAL-RESOLUTION', suite: 'historical', rule: 'Historical mode resolves a multi-valued hentaigana only when its exact kana run has one strong maintained lexical reading candidate', input: '𛀻うしん', expected: 'Koushin', expectedRequiresReview: false },
            { id: 'HIST-ARCHAIC-YE-DUAL-IDENTITY-LEXICAL-RESOLUTION', suite: 'historical', rule: 'Historical mode resolves U+1B001 only when complete-run lexical evidence selects exactly one of its hentaigana-e or archaic-ye identities', input: '𛀁ど', expected: 'Edo', expectedRequiresReview: false },
            { id: 'HIST-HENTAIGANA-VERTICAL-ITERATION-ORDER', suite: 'historical', rule: 'Hentaigana normalisation runs before historical vertical iteration expansion so repeat marks operate on canonical kana rather than unresolved glyphs', input: '𛀂𛀆〱', expected: 'Aiai', expectedRequiresReview: false },
            { id: 'HIST-HENTAIGANA-DAKUTEN-E2E', suite: 'historical', rule: 'Historical mode retains dakuten carried by a single-valued hentaigana after reducing the glyph to its maintained modern-kana value', input: '𛀳゛', expected: 'ge', expectedRequiresReview: false },
            { id: 'HIST-HENTAIGANA-HANDAKUTEN-E2E', suite: 'historical', rule: 'Historical mode retains handakuten carried by a single-valued hentaigana after reducing the glyph to its maintained modern-kana value', input: '𛂦゜ん', expected: 'Pan', expectedRequiresReview: false },
            { id: 'HIST-FIXED-ENCODED-KANA-NORMAL-MODE-GUARD', suite: 'unit', rule: 'Historical fixed-form kana normalisation is opt-in and does not silently rewrite ordinary-mode input', input: '𛀀 normal mode', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('𛀀'); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-ARCHAIC-WU-HIRAGANA', suite: 'historical', rule: 'Historical mode transliterates U+1B11F from its Unicode-fixed wu identity through the existing Rule-0 wu kana mapping', input: '𛄟', expected: 'Wu', expectedRequiresReview: false },
            { id: 'HIST-ARCHAIC-YI-KATAKANA', suite: 'historical', rule: 'Historical mode transliterates U+1B120 from its Unicode-fixed yi identity through the existing Rule-0 yi kana mapping', input: '𛄠', expected: 'Yi', expectedRequiresReview: false },
            { id: 'HIST-ARCHAIC-YE-KATAKANA', suite: 'historical', rule: 'Historical mode transliterates U+1B121 from its Unicode-fixed ye identity through the existing Rule-0 ye kana mapping', input: '𛄡', expected: 'Ye', expectedRequiresReview: false },
            { id: 'HIST-ARCHAIC-WU-KATAKANA', suite: 'historical', rule: 'Historical mode transliterates U+1B122 from its Unicode-fixed wu identity through the existing Rule-0 wu kana mapping', input: '𛄢', expected: 'Wu', expectedRequiresReview: false },
            { id: 'HIST-ARCHAIC-YI-YE-WU-NORMAL-MODE-GUARD', suite: 'unit', rule: 'Archaic yi/ye/wu transliteration remains historical-mode only', input: '𛄟/𛄠/𛄡/𛄢 normal mode', expected: '4/4 review', run: () => { const values = ['𛄟','𛄠','𛄡','𛄢']; const count = values.filter(value => translateAuditForGeneratedQa(value, false).requiresReview).length; return `${count}/${values.length} review`; } },
            { id: 'HIST-HENTAIGANA-NORMAL-MODE-GUARD', suite: 'unit', rule: 'Hentaigana reading normalisation remains historical-mode only and does not silently change ordinary translation mode', input: '𛀂 normal mode', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('𛀂'); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-HENTAIGANA-VOICED-NORMAL-MODE-GUARD', suite: 'unit', rule: 'Dakuten or handakuten does not bypass the historical-mode gate for encoded hentaigana', input: '𛀳゛ normal mode', expected: 'review', run: () => { const audit = translateAuditForGeneratedQa('𛀳゛'); return audit.requiresReview ? 'review' : 'clear'; } },
            { id: 'HIST-HENTAIGANA-MULTIVALUE-GUARD', suite: 'unit', rule: 'A multi-valued hentaigana without qualifying exact lexical context remains unresolved and review-required in historical mode', input: '𛀅 historical mode', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('𛀅', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-HENTAIGANA-MULTIVALUE-LEXICAL-COLLISION-REVIEW', suite: 'unit', rule: 'Competing strong lexical candidates do not clear review for a multi-valued hentaigana', input: 'そう𛀢い historical mode', expected: 'review', run: () => translateAuditForGeneratedQa('そう𛀢い', false, { historicalKana: true }).requiresReview ? 'review' : 'clear' },
            { id: 'HIST-HENTAIGANA-MULTIVALUE-DAKUTEN-GUARD', suite: 'unit', rule: 'A dakuten following a multi-valued hentaigana must not make its base reading appear resolved', input: '𛀅゛ historical mode', expected: 'review', run: () => { const audit = translateAuditForGeneratedQa('𛀅゛', false, { historicalKana: true }); return audit.requiresReview ? 'review' : 'clear'; } },
            { id: 'HIST-HENTAIGANA-ARCHAIC-YE-ALIAS-GUARD', suite: 'unit', rule: 'U+1B001 remains unresolved without qualifying complete-run lexical context because neither its archaic-ye nor hentaigana-e identity is a standalone default', input: '𛀁 historical mode', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('𛀁', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-HIST-VERTICAL-ITERATION-NORMALISATION', suite: 'unit', rule: 'Historical-only vertical iteration normalisation expands encoded kana repetition semantics, canonicalises split glyph forms, and maps the vertical ideographic mark onto the existing 々 path', input: 'いろ〱 / とき〲 / いろ〳〵 / とき〴〵 / 人〻 / 〵', expected: 'いろいろ|ときどき|いろいろ|ときどき|人々|〵', run: () => ['いろ〱','とき〲','いろ〳〵','とき〴〵','人〻','〵'].map(normalizeHistoricalVerticalIterationMarks).join('|') },
            { id: 'HIST-VERTICAL-KANA-ITERATION-UNVOICED', suite: 'historical', rule: 'Historical mode expands the vertical kana repeat mark 〱 from the immediately preceding kana pair', input: 'いろ〱', expected: 'Iroiro', expectedRequiresReview: false },
            { id: 'HIST-VERTICAL-KANA-ITERATION-VOICED', suite: 'historical', rule: 'Historical mode expands the voiced vertical kana repeat mark 〲 and voices the first kana of the repeated pair', input: 'とき〲', expected: 'Tokidoki', expectedRequiresReview: false },
            { id: 'HIST-VERTICAL-KANA-ITERATION-SPLIT-UNVOICED', suite: 'historical', rule: 'Historical mode treats 〳 followed by 〵 as the split glyph form of 〱', input: 'いろ〳〵', expected: 'Iroiro', expectedRequiresReview: false },
            { id: 'HIST-VERTICAL-KANA-ITERATION-SPLIT-VOICED', suite: 'historical', rule: 'Historical mode treats 〴 followed by 〵 as the split glyph form of 〲', input: 'とき〴〵', expected: 'Tokidoki', expectedRequiresReview: false },
            { id: 'HIST-VERTICAL-IDEOGRAPHIC-ITERATION', suite: 'historical', rule: 'Historical mode canonicalises 〻 to the existing ideographic iteration-mark path so reviewed lexical evidence remains authoritative', input: '人〻', expected: 'Hitobito', expectedRequiresReview: false },
            { id: 'HIST-VERTICAL-IDEOGRAPHIC-ITERATION-TOKI', suite: 'historical', rule: 'Historical mode preserves ordinary 々 lexical authority after canonicalising the vertical ideographic iteration mark', input: '時〻', expected: 'Tokidoki', expectedRequiresReview: false },
            { id: 'HIST-VERTICAL-ITERATION-NORMAL-MODE-GUARD', suite: 'unit', rule: 'Historical vertical iteration semantics remain opt-in and are not silently enabled in normal translation mode', input: 'とき〲 normal mode', expected: 'Toki [Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('とき〲', false); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-HIST-VERTICAL-ITERATION-MALFORMED-LOWER-HALF', suite: 'unit', rule: 'A standalone split lower half has no repeat target and remains unresolved/reviewable even in historical mode', input: '〵 historical audit', expected: '[Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('〵', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'CHECK-HIST-VERTICAL-ITERATION-MALFORMED-SHORT-CONTEXT', suite: 'unit', rule: 'A vertical kana repeat mark without two preceding kana remains unresolved/reviewable instead of guessing a repeat span', input: 'あ〲 historical audit', expected: 'A [Unresolved]:review', run: () => { const audit = translateAuditForGeneratedQa('あ〲', false, { historicalKana: true }); return `${audit.output}:${audit.requiresReview ? 'review' : 'clear'}`; } },
            { id: 'HIST-KOKORO-ITERATION', suite: 'historical', rule: 'Historical mode resolves the attested kana iteration-mark spelling こゝろ from exact whole-word evidence', input: 'こゝろ', expected: 'Kokoro', expectedRequiresReview: false },
            { id: 'HIST-SUZUSHII-ITERATION', suite: 'historical', rule: 'Historical mode resolves the attested voiced iteration-mark spelling すゞしい as one adjective rather than accepting a proper-name prefix split', input: 'すゞしい', expected: 'Suzushii', expectedRequiresReview: false },
            { id: 'HIST-WOKASHI', suite: 'historical', rule: 'Historical mode uses attested whole-word evidence instead of treating historical を as a particle', input: 'をかし', expected: 'Okashi' },
            { id: 'MECH-BOUNDARY-ARBITRATION-HISTORICAL-REMAINDER-REPAIR', suite: 'unit', rule: 'Reviewed historical evidence can end inside an oversized raw tokenizer token and must retokenise the genuine remainder without losing source order', input: 'をかしく raw tokenizer remainder', expected: 'をかし|く:く', run: () => { const source = 'をかしく'; const raw = attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source); const merged = mergeHistoricalKanaEvidenceTokens(raw); return `${merged.map(item => item.surface_form).join('|')}:${merged[merged.length - 1]?.surface_form || ''}`; } },
            { id: 'HIST-WOKASHIKU-INFLECTION', suite: 'historical', rule: 'A reviewed シク活用 adjective keeps its continuative inflection attached when historical evidence ends inside an oversized tokenizer token', input: 'をかしく', expected: 'Okashiku', expectedRequiresReview: false },
            { id: 'HIST-WOKASHIKI-INFLECTION', suite: 'historical', rule: 'A reviewed シク活用 adjective keeps its attributive inflection attached without relying on the tokenizer part-of-speech assigned to the suffix', input: 'をかしき', expected: 'Okashiki', expectedRequiresReview: false },
            { id: 'HIST-WOKASHIKERE-INFLECTION', suite: 'historical', rule: 'A reviewed シク活用 adjective keeps its realis inflection attached using the maintained conjugation class', input: 'をかしけれ', expected: 'Okashikere', expectedRequiresReview: false },
            { id: 'HIST-WOKASHI-NONINFLECTION-CONTROL', suite: 'historical', rule: 'Historical adjective evidence does not join an arbitrary lexical remainder merely because it shares the evidence prefix', input: 'をかしこと', expected: 'Okashi Koto' },
            { id: 'HIST-WIDO-INFLECTION-NEGATIVE-CONTROL', suite: 'historical', rule: 'A historical noun never receives adjective-inflection joining merely because its remainder begins with an inflection-looking kana', input: 'ゐどく', expected: 'Ido Ku' },
            { id: 'HIST-WIDO', suite: 'historical', rule: 'Historical mode resolves obsolete ゐ from attested word evidence', input: 'ゐど', expected: 'Ido' },
            { id: 'HIST-WIRU', suite: 'historical', rule: 'Historical mode resolves obsolete ゐ in a verb from attested word evidence', input: 'ゐる', expected: 'Iru' },
            { id: 'HIST-MAWIRU', suite: 'historical', rule: 'Historical mode resolves obsolete medial ゐ without changing the modern pipeline', input: 'まゐる', expected: 'Mairu' },
            { id: 'HIST-OMOHIDE', suite: 'historical', rule: 'Historical mode keeps a mixed-script historical lexical form together', input: '思ひ出を語る', expected: 'Omoide o Kataru' },
            { id: 'HIST-KOWE', suite: 'historical', rule: 'Historical evidence may repair a token boundary that overshoots into a following modern particle', input: 'こゑを聞く', expected: 'Koe o Kiku', expectedRequiresReview: false },
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
            { id: 'HIST-OMOU-HAGYOU-KANJI', suite: 'historical', rule: 'Historical mode resolves attested 思ふ through exact dictionary evidence rather than preserving obsolete final ふ mechanically', input: '思ふ', expected: 'Omou', expectedRequiresReview: false },
            { id: 'HIST-OMOU-HAGYOU-KANA', suite: 'historical', rule: 'Historical mode resolves the kana-only historical form おもふ from the same attested lexical evidence', input: 'おもふ', expected: 'Omou', expectedRequiresReview: false },
            { id: 'HIST-UTAU-HAGYOU-KANJI', suite: 'historical', rule: 'Historical mode resolves attested 歌ふ as うたう without applying a global ふ conversion heuristic', input: '歌ふ', expected: 'Utau', expectedRequiresReview: false },
            { id: 'HIST-UTAU-HAGYOU-KANA', suite: 'historical', rule: 'Historical mode resolves kana-only うたふ from exact evidence', input: 'うたふ', expected: 'Utau', expectedRequiresReview: false },
            { id: 'HIST-TSUKAU-HAGYOU-KANJI', suite: 'historical', rule: 'Historical mode resolves attested 使ふ as つかう instead of accepting an unrelated single-Kanji reading', input: '使ふ', expected: 'Tsukau', expectedRequiresReview: false },
            { id: 'HIST-TSUKAU-HAGYOU-KANA', suite: 'historical', rule: 'Historical mode resolves kana-only つかふ from exact evidence', input: 'つかふ', expected: 'Tsukau', expectedRequiresReview: false },
            { id: 'HIST-TOU-HAGYOU-KANJI', suite: 'historical', rule: 'Historical mode resolves attested 問ふ as とう from exact evidence', input: '問ふ', expected: 'Tou', expectedRequiresReview: false },
            { id: 'HIST-TOU-HAGYOU-KANA', suite: 'historical', rule: 'Historical mode resolves kana-only とふ as とう from exact evidence', input: 'とふ', expected: 'Tou', expectedRequiresReview: false },
            { id: 'HIST-KOU-HAGYOU-SEI', suite: 'historical', rule: 'Historical mode resolves attested 請ふ as こう from exact evidence', input: '請ふ', expected: 'Kou', expectedRequiresReview: false },
            { id: 'HIST-KOU-HAGYOU-KOTSU', suite: 'historical', rule: 'Historical mode resolves attested 乞ふ as こう from the same dictionary-supported historical spelling', input: '乞ふ', expected: 'Kou', expectedRequiresReview: false },
            { id: 'HIST-KOU-HAGYOU-KANA', suite: 'historical', rule: 'Historical mode resolves kana-only こふ as こう from exact evidence', input: 'こふ', expected: 'Kou', expectedRequiresReview: false },
            { id: 'HIST-WARAU-HAGYOU-KANJI', suite: 'historical', rule: 'Historical mode resolves attested 笑ふ as わらう instead of accepting the unrelated name-like 笑 reading plus a detached ふ', input: '笑ふ', expected: 'Warau', expectedRequiresReview: false },
            { id: 'HIST-WARAU-HAGYOU-KANA', suite: 'historical', rule: 'Historical mode resolves kana-only わらふ as わらう from exact evidence', input: 'わらふ', expected: 'Warau', expectedRequiresReview: false },
            { id: 'HIST-HAGYOU-MULTI-SPAN-CONTEXT', suite: 'historical', rule: 'Independent attested historical spans remain correctly bounded when adjacent in ordinary context', input: 'おもはず笑ふ', expected: 'Omowazu Warau', expectedRequiresReview: false },
            { id: 'HIST-GUARD-MODERN-HAGYOU-VOWEL-FORMS', suite: 'unit', rule: 'Adding exact historical ハ行四段 evidence does not rewrite ordinary modern dictionary forms in historical mode', input: '笑う / 思う / 歌う / 使う / 問う / 請う / 乞う', expected: 'Warau|Omou|Utau|Tsukau|Tou|Kou|Kou', run: () => ['笑う','思う','歌う','使う','問う','請う','乞う'].map(value => translateText(value, { historicalKana: true })).join('|') },
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
            { id: 'ASSET-SCHEMA-COMMON-ROMAJI-VALID', suite: 'unit', rule: 'Common-word evidence may carry reviewed Rule 0 Romaji for internal lexical boundaries', input: '元カノ → Moto Kano', expected: 'accepted', run: () => { try { validateAssetSchema('commonWords', [{ surface: '元カノ', reading: 'もとかの', romaji: 'Moto Kano', pattern: '元カノ', source: 'qa-reviewed' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-COMMON-ROMAJI-REJECT', suite: 'unit', rule: 'Common-word direct Romaji rejects output that violates Rule 0 evidence syntax', input: 'invalid common-word Romaji', expected: 'rejected', run: () => { try { validateAssetSchema('commonWords', [{ surface: '語', reading: 'ご', romaji: '***', source: 'qa-reviewed' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-COMMON-SOURCE-REQUIRED', suite: 'unit', rule: 'Authoritative common-word evidence must retain row-level provenance so manual and imported decisions cannot become source-less authority', input: 'common-word row without source', expected: 'rejected', run: () => { try { validateAssetSchema('commonWords', [{ surface: '試験語', reading: 'しけんご' }], 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-GENERAL-VALID', suite: 'unit', rule: 'Critical general-word data accepts the documented bank shape', input: 'general-word-bank-v2', expected: 'accepted', run: () => { try { validateAssetSchema('generalWords', { _meta: { schemaVersion: 2, scoreSemantics: 'popularity-ranking-only', defaultReadingCoverage: 'filtered-positive-priority' }, entries: [['語', [['ご', 1]], 0, { readingCoverage: 'filtered-positive-priority', restrictionStatus: 'unknown-from-compact-bank' }]] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-GENERAL-REJECT', suite: 'unit', rule: 'Critical general-word data rejects valid JSON with the wrong structure', input: 'general-word-bank-v2 / wrong shape', expected: 'rejected', run: () => { try { validateAssetSchema('generalWords', { _meta: { schemaVersion: 2, scoreSemantics: 'semantic-confidence' }, entries: [['語', [['ご', 1]], 0]] }, 'qa'); return 'accepted'; } catch (_) { return 'rejected'; } } },
            { id: 'ASSET-SCHEMA-POLICY', suite: 'unit', rule: 'The public asset policy reports schema contracts alongside criticality', input: 'generalWords', expected: 'general-word-bank-v2', run: () => publicAssetPolicy().generalWords.schema || '' },
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
        { id: 'semantic-annotation-ownership', label: 'Semantic annotation ownership', prefix: 'MECH-SEMANTIC-OWNERSHIP-' },
        { id: 'source-integrity', label: 'Source-span integrity', prefix: 'MECH-SOURCE-INTEGRITY-' },
        { id: 'source-span-candidate-discovery', label: 'Source-span candidate discovery', prefix: 'MECH-CANDIDATE-DISCOVERY-' },
        { id: 'numeric-role-arbitration', label: 'Numeric/counter role arbitration', prefix: 'MECH-NUMERIC-ROLE-' },
        { id: 'counter-tail-composition', label: 'Reviewed embedded counter-tail composition', prefix: 'MECH-COUNTER-TAIL-' },
        { id: 'boundary-arbitration', label: 'Lexical/structural boundary arbitration', prefix: 'MECH-BOUNDARY-ARBITRATION-' },
        { id: 'reading-arbitration', label: 'Reading arbitration and ambiguity', prefix: 'MECH-READING-ARBITRATION-' },
        { id: 'review-lifecycle', label: 'Review state lifecycle', prefix: 'MECH-REVIEW-' },
        { id: 'structured-output', label: 'Structured output policy', prefix: 'MECH-OUTPUT-STRUCTURE-' },
        { id: 'grammatical-boundaries', label: 'Grammatical boundaries', prefix: 'MECH-GRAMMAR-' },
        { id: 'whole-word-readings', label: 'Whole-word readings', prefix: 'MECH-WHOLE-WORD-' },
        { id: 'ateji-gikun', label: 'Ateji/gikun', prefix: 'MECH-ATEJI-GIKUN-' },
        { id: 'proper-names', label: 'Proper names', prefix: 'MECH-PROPER-NAME-' },
        { id: 'loanwords', label: 'Loanwords', prefix: 'MECH-LOANWORD-' },
        { id: 'uncertainty-propagation', label: 'Uncertainty propagation', prefix: 'MECH-UNCERTAINTY-' },
        { id: 'mixed-script-handling', label: 'Mixed-script handling', prefix: 'MECH-MIXED-SCRIPT-' },
        { id: 'final-output-consistency', label: 'Final output/evidence consistency', prefix: 'MECH-FINAL-OUTPUT-' }
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
        "SYS-AUDIT-NONGEMINATIVE-SOKUON-UNREVIEWED-CONTROL",
        "R0-KATAKANA-NONGEMINATIVE-SOKUON-QAWWALI",
        "R0-KATAKANA-NONGEMINATIVE-SOKUON-NUTELLA",
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
        "SCHEMA-COMMON-GODAN-RA-VALID",
        "SCHEMA-COMMON-GODAN-RA-SURFACE-GUARD",
        "SCHEMA-COMMON-GODAN-RA-READING-GUARD",
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
        "STRESS-LATIN-URL-PUNCTUATION",
        "STRESS-LATIN-URL-SURROUNDING-SPACES",
        "STRESS-LATIN-COMMA-SPACED-CONTROL",
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

    // Whole-bank lexical candidate coverage audit helpers.
    // These helpers are developer-only diagnostics; they never participate in runtime translation.
    
    function lexicalAuditStableKey(parts) {
        return parts.map(value => String(value ?? '')).join('\u0000');
    }
    
    function lexicalAuditSortedUnique(values) {
        return [...new Set((values || []).map(value => String(value || '')).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ja'));
    }
    
    function lexicalAuditCandidateReadings(candidate) {
        return lexicalAuditSortedUnique([
            candidate?.reading,
            ...(candidate?.alternatives || []).map(item => item?.reading)
        ]);
    }
    
    function lexicalAuditCandidateOutputs(candidate) {
        return lexicalAuditSortedUnique([
            candidate?.romaji,
            ...(candidate?.alternatives || []).map(item => item?.romaji || item?.output)
        ]);
    }
    
    function lexicalAuditEntryMatchesCandidate(entry, candidate, sourceStart) {
        if (!entry || !candidate) return false;
        if (candidate.kind !== entry.candidateKind) return false;
        if (candidate.sourceStart !== sourceStart || candidate.sourceEnd !== sourceStart + entry.surface.length) return false;
        if (candidate.sourceSurface !== entry.surface) return false;
        const expectedReadings = entry.readings || [];
        const expectedOutputs = entry.outputs || [];
        const actualReadings = lexicalAuditCandidateReadings(candidate);
        const actualOutputs = lexicalAuditCandidateOutputs(candidate);
        if (expectedReadings.length && !expectedReadings.every(reading => actualReadings.includes(reading))) return false;
        if (expectedOutputs.length && !expectedOutputs.every(output => actualOutputs.includes(output))) return false;
        return true;
    }
    
    function lexicalAuditMakeEntry(details) {
        const entry = {
            sourceType: String(details.sourceType || ''),
            sourceClass: String(details.sourceClass || 'maintained'),
            surface: String(details.surface || ''),
            readings: lexicalAuditSortedUnique(details.readings || []),
            outputs: lexicalAuditSortedUnique(details.outputs || []),
            candidateKind: details.candidateKind ? String(details.candidateKind) : null,
            contextScope: String(details.contextScope || 'global'),
            patternText: details.patternText ? String(details.patternText) : null,
            patternIndex: Number.isInteger(details.patternIndex) ? details.patternIndex : null,
            candidateExpected: details.candidateExpected !== false,
            boundaryIndependent: details.boundaryIndependent !== false,
            historicalKana: Boolean(details.historicalKana),
            authoritative: details.authoritative !== false,
            ambiguityExpected: Boolean(details.ambiguityExpected),
            notes: details.notes ? String(details.notes) : null
        };
        entry.key = lexicalAuditStableKey([
            entry.sourceType,
            entry.surface,
            entry.candidateKind || 'none',
            entry.patternIndex ?? '',
            entry.readings.join('|'),
            entry.outputs.join('|')
        ]);
        return Object.freeze(entry);
    }
    
    function getLexicalCandidateAuditInventory() {
        const entries = [];
        const add = details => {
            const entry = lexicalAuditMakeEntry(details);
            if (!entry.surface) return;
            entries.push(entry);
        };
    
        for (const [surface, lookup] of runtimeState.generalWordDictionary.entries()) {
            const readings = getGeneralWordCandidates(getGeneralWordLookup(surface)).map(item => item.reading);
            add({ sourceType: 'general-word', surface, readings, candidateKind: 'general-word', ambiguityExpected: readings.length > 1 });
        }
        for (const [surface, rules] of runtimeState.commonWordDictionary.entries()) {
            (rules || []).forEach((rule, patternIndex) => add({
                sourceType: 'common-word', surface, readings: [rule?.reading], outputs: [rule?.romaji], candidateKind: 'common-word',
                contextScope: rule?.pattern ? 'pattern-restricted' : 'global', patternText: rule?.pattern?.source || null,
                patternIndex, boundaryIndependent: true
            }));
        }
        for (const [surface, entry] of runtimeState.compoundWordDictionary.entries()) {
            const readings = (entry?.readings || []).map(item => item?.reading);
            add({ sourceType: 'compound-word', surface, readings, candidateKind: 'compound-word', ambiguityExpected: readings.length > 1 });
        }
        for (const [surface, output] of runtimeState.loanwordDictionary.entries()) {
            add({ sourceType: 'loanword', surface, outputs: [output], candidateKind: 'loanword' });
        }
        for (const [surface, metadata] of runtimeState.loanwordMetadataDictionary.entries()) {
            if (metadata?.requiresReview && !runtimeState.loanwordDictionary.has(surface)) {
                add({ sourceType: 'reviewed-loanword-surface', surface, readings: [surface], candidateKind: 'loanword-review' });
            }
            if (metadata?.context) {
                add({ sourceType: 'contextual-loanword', surface, outputs: (metadata.context.candidates || []).map(item => item?.output), candidateKind: 'contextual-loanword', contextScope: 'context-arbitration', authoritative: false });
            }
        }
        for (const [surface, reading] of runtimeState.atejiDictionary.entries()) {
            add({ sourceType: 'ateji', surface, readings: [reading], candidateKind: 'ateji' });
        }
        for (const [surface, candidates] of runtimeState.properNounDictionary.entries()) {
            const readings = [...candidates.values()].map(item => item?.reading);
            add({ sourceType: 'proper-noun', surface, readings, candidateKind: 'proper-noun', ambiguityExpected: readings.length > 1 });
        }
        for (const [surface, entry] of runtimeState.reviewedProperNameSpanDictionary.entries()) {
            add({ sourceType: 'reviewed-proper-name-span', surface, readings: [entry?.reading], outputs: [entry?.romaji], candidateKind: 'reviewed-name' });
        }
        for (const [surface, entry] of runtimeState.reviewedReadingSpanDictionary.entries()) {
            const readings = [entry?.reading, ...(entry?.alternatives || [])];
            add({ sourceType: 'reviewed-reading-span', surface, readings, outputs: [entry?.romaji], candidateKind: 'reviewed-reading', ambiguityExpected: readings.filter(Boolean).length > 1 });
        }
        for (const [surface, rules] of runtimeState.titleReadingDictionary.entries()) {
            (rules || []).forEach((rule, patternIndex) => add({
                sourceType: 'title-reading', surface, readings: [rule?.reading], outputs: [rule?.romaji], candidateKind: rule?.kind || 'title-reading',
                contextScope: 'title-pattern-restricted', patternText: rule?.pattern?.source || null, patternIndex,
                // Authored title patterns are source-aligned. The separate complete-title mention extension is intentionally grammar-bound.
                boundaryIndependent: true
            }));
        }
        for (const [surface, entry] of runtimeState.contextualReadingDictionary.entries()) {
            add({ sourceType: 'contextual-reading', surface, readings: (entry?.candidates || []).map(item => item?.reading), candidateKind: 'contextual-reading', contextScope: 'context-arbitration', authoritative: false });
        }
        for (const [surface, entry] of runtimeState.rendakuEvidenceDictionary.entries()) {
            add({ sourceType: 'rendaku', surface, readings: [entry?.reading], candidateKind: 'rendaku-reading' });
        }
        for (const [surface, entry] of runtimeState.historicalKanaEvidenceDictionary.entries()) {
            add({ sourceType: 'historical-kana', surface, readings: [entry?.reading], candidateKind: 'historical-reading', contextScope: 'historical-mode', historicalKana: true });
        }
        for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
            add({ sourceType: 'counter-date', surface, readings: [entry?.reading], outputs: [entry?.romaji], candidateKind: 'counter-date', contextScope: 'role-specialised' });
        }
    
        // These maintained sources influence reading arbitration but intentionally do not own source boundaries.
        for (const [surface, entry] of runtimeState.readingEvidenceDictionary.entries()) {
            add({ sourceType: 'reading-evidence', surface, readings: [entry?.preferredReading, ...(entry?.alternatives || []).map(item => item?.reading)], candidateExpected: false, candidateKind: null, contextScope: 'reading-arbitration-only', boundaryIndependent: false });
        }
        for (const [surface, entry] of runtimeState.reviewedReadingPreferenceDictionary.entries()) {
            add({ sourceType: 'reviewed-reading-preference', surface, readings: [entry?.reading, ...(entry?.alternatives || [])], candidateExpected: false, candidateKind: null, contextScope: 'reading-arbitration-only', boundaryIndependent: false });
        }
    
        // Derived indexes are audited separately from authored-entry totals.
        for (const [surface, entry] of runtimeState.commonWordInflectionDictionary.entries()) {
            add({ sourceType: 'derived-common-word-inflection', sourceClass: 'derived', surface, readings: [entry?.reading], candidateKind: 'common-word-inflection', authoritative: false });
        }
        for (const [surface, entry] of runtimeState.kanaLexicalReadingDictionary.entries()) {
            add({ sourceType: 'derived-kana-lexical-reading', sourceClass: 'derived', surface, readings: [surface], candidateKind: 'kana-lexical-reading', authoritative: false });
        }
    
        entries.sort((left, right) => left.key.localeCompare(right.key, 'ja'));
        const bySource = {};
        for (const entry of entries) {
            bySource[entry.sourceType] = bySource[entry.sourceType] || { entries: 0, surfaces: new Set(), candidateExpected: 0, contextRestricted: 0 };
            const summary = bySource[entry.sourceType];
            summary.entries += 1;
            summary.surfaces.add(entry.surface);
            if (entry.candidateExpected) summary.candidateExpected += 1;
            if (entry.contextScope !== 'global') summary.contextRestricted += 1;
        }
        return {
            entries,
            sourceSummary: Object.fromEntries(Object.entries(bySource).map(([key, value]) => [key, {
                entries: value.entries,
                uniqueSurfaces: value.surfaces.size,
                candidateExpected: value.candidateExpected,
                contextRestricted: value.contextRestricted
            }]))
        };
    }
    
    function lexicalAuditRegexMatchesRange(patternText, source, surfaceStart, surfaceEnd) {
        if (!patternText) return true;
        try {
            const base = compileReviewedPattern(patternText, 'i');
            const flags = base.flags.includes('g') ? base.flags : `${base.flags}g`;
            const matcher = new RegExp(base.source, flags);
            const normalizedSource = canonicalizeTokenizerBoundaryCharacters(String(source || ''));
            let match;
            while ((match = matcher.exec(normalizedSource)) !== null) {
                const start = match.index;
                const end = start + match[0].length;
                if (surfaceStart >= start && surfaceEnd <= end) return true;
                if (!match[0].length) matcher.lastIndex += 1;
            }
            return false;
        } catch (_) {
            return false;
        }
    }
    
    function lexicalAuditMaterializePattern(entry) {
        const surface = entry.surface;
        const patternText = entry.patternText;
        if (!patternText) return surface;
        const directCandidates = [
            surface,
            `${surface}は`, `${surface}へ`, `${surface}について`, `${surface}の`, `${surface}が`, `${surface}を`, `${surface}に休む`,
            `防御力に${surface}`, `${surface}する`, `${surface}すれば`, `${surface}した`, `${surface}に十分休む`
        ];
        for (const candidate of directCandidates) {
            const start = candidate.indexOf(surface);
            if (start >= 0 && lexicalAuditRegexMatchesRange(patternText, candidate, start, start + surface.length)) return candidate;
        }
    
        // Project-reviewed patterns are intentionally regular and mostly literal title/context forms.
        // Produce a conservative witness, then verify it against the real compiled pattern before use.
        let witness = String(patternText)
            .replace(/^\^/u, '').replace(/\$$/u, '')
            .replace(/\(\?=\$\|\[[^\]]+\]\)/gu, '')
            .replace(/\(\?=\(\?:[^)]*\)\)/gu, 'する')
            .replace(/\(\?:([^|()]+)\|[^)]*\)/gu, '$1')
            .replace(/\[～〜\]/gu, '～')
            .replace(/\[~~\]/gu, '~')
            .replace(/\\u3000/gu, '　')
            .replace(/\[ 　\]\?/gu, ' ')
            .replace(/\[ 　\]/gu, ' ')
            .replace(/！\?/gu, '！')
            .replace(/△\?/gu, '△')
            .replace(/。\?/gu, '')
            .replace(/\\\//gu, '/')
            .replace(/\\([\\.^$|?*+()\[\]{}])/gu, '$1');
        const start = witness.indexOf(surface);
        if (start >= 0 && lexicalAuditRegexMatchesRange(patternText, witness, start, start + surface.length)) return witness;
        return null;
    }
    
    function lexicalAuditTokenize(source) {
        return attachSourceTokenSpans(runtimeState.tokenizer.tokenize(source), source);
    }
    
    // Prepare a stable candidate-discovery probe for performance QA. Tokenisation is
    // performed once so repeated timing samples measure candidate discovery itself.
    function prepareCandidateDiscoveryProbeForQa(sourceText, options = {}) {
        const source = String(sourceText || '');
        const tokens = lexicalAuditTokenize(source);
        const historicalKana = Boolean(options.historicalKana);
        return () => discoverSourceSpanCandidates(source, tokens, { historicalKana }).length;
    }
    
    function lexicalAuditSyntheticTokens(source, surfaceStart, surfaceEnd, mutation) {
        const prefix = source.slice(0, surfaceStart);
        const surface = source.slice(surfaceStart, surfaceEnd);
        const suffix = source.slice(surfaceEnd);
        const tokens = [];
        const push = (surfaceForm, extras = {}) => {
            if (!surfaceForm) return;
            tokens.push({ surface_form: surfaceForm, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', ...extras });
        };
        push(prefix, { pos: /[「」『』、。！？]/u.test(prefix) ? '記号' : '名詞' });
        if (mutation === 'whole') {
            push(surface);
        } else if (mutation === 'character-split' || mutation === 'internal-no') {
            for (const character of Array.from(surface)) {
                push(character, character === 'ノ' ? { pos: '記号', pos_detail_1: '一般' } : {});
            }
        } else if (mutation === 'final-shared-with-suffix' && suffix) {
            const chars = Array.from(surface);
            const last = chars.pop() || '';
            push(chars.join(''));
            push(last + suffix);
            return attachSourceTokenSpans(tokens, source);
        } else {
            push(surface);
        }
        if (suffix) {
            const particleMatch = suffix.match(/^(を|が|の|へ|は|に|と|で|も)/u);
            if (particleMatch) {
                push(particleMatch[1], { pos: '助詞', pos_detail_1: '格助詞' });
                push(suffix.slice(particleMatch[1].length));
            } else push(suffix);
        }
        return attachSourceTokenSpans(tokens, source);
    }
    
    function lexicalAuditFindEntry(inventory, entryKey) {
        return inventory.entries.find(item => item.key === entryKey) || null;
    }
    
    function lexicalAuditEvaluateCandidate(entry, source, tokens, surfaceStart) {
        const candidates = discoverSourceSpanCandidates(source, tokens, { historicalKana: entry.historicalKana });
        const validation = validateSourceSpanCandidates(candidates, source);
        const matches = candidates.filter(candidate => lexicalAuditEntryMatchesCandidate(entry, candidate, surfaceStart));
        return {
            found: matches.length > 0,
            matchCount: matches.length,
            validationValid: validation.valid,
            validationViolations: validation.violations,
            matchingCandidates: matches.map(candidate => ({
                kind: candidate.kind,
                category: candidate.category,
                evidenceSource: candidate.evidenceSource,
                reading: candidate.reading,
                romaji: candidate.romaji,
                reviewRequired: candidate.reviewRequired,
                alternatives: candidate.alternatives
            }))
        };
    }
    
    function lexicalAuditContextCases(entry, inventory) {
        if (!entry.candidateExpected) return [];
        const cases = [];
        if (entry.contextScope === 'pattern-restricted' || entry.contextScope === 'title-pattern-restricted') {
            const witness = lexicalAuditMaterializePattern(entry);
            if (witness) cases.push({ id: 'authored-valid-context', source: witness, expected: true, actualTokenizer: true });
            else cases.push({ id: 'authored-valid-context', source: null, expected: true, infrastructureError: 'unable-to-materialize-authored-pattern' });
    
            // Surface-alone is a useful negative only when the authored pattern itself does not cover it
            // and no equivalent global evidence independently licenses the same candidate. Context-scoped
            // duplicate evidence must not be mistaken for a scope leak when a maintained global rule is valid.
            const hasEquivalentGlobalEvidence = Boolean(inventory?.entries?.some(other =>
                other.key !== entry.key
                && other.candidateExpected
                && other.contextScope === 'global'
                && other.surface === entry.surface
                && other.candidateKind === entry.candidateKind
                && entry.readings.every(reading => other.readings.includes(reading))
                && entry.outputs.every(output => other.outputs.includes(output))
            ));
            if (!hasEquivalentGlobalEvidence && !lexicalAuditRegexMatchesRange(entry.patternText, entry.surface, 0, entry.surface.length)) {
                cases.push({ id: 'outside-authored-context', source: entry.surface, expected: false, actualTokenizer: true });
            }
            if (entry.contextScope === 'title-pattern-restricted' && lexicalAuditRegexMatchesRange(entry.patternText, entry.surface, 0, entry.surface.length)) {
                // A complete title may extend to a real grammatical boundary, but raw kana prefix coincidence must not count.
                cases.push({ id: 'complete-title-grammatical-boundary', source: `${entry.surface}は話題だ`, expected: true, actualTokenizer: true });
                cases.push({ id: 'complete-title-raw-prefix-negative', source: `${entry.surface}はちみつ`, expected: false, actualTokenizer: true });
            }
            return cases;
        }
    
        if (entry.contextScope === 'historical-mode') {
            cases.push({ id: 'standalone', source: entry.surface, expected: true, actualTokenizer: true });
            cases.push({ id: 'quoted', source: `「${entry.surface}」`, expected: true, actualTokenizer: false });
            return cases;
        }
    
        // Contextual-reading evidence is intentionally always discoverable as competing evidence;
        // context scoring happens later. Audit both standalone and embedded reachability.
        const nounLike = !['derived-common-word-inflection'].includes(entry.sourceType);
        cases.push({ id: 'standalone', source: entry.surface, expected: true, actualTokenizer: true });
        if (nounLike) {
            cases.push({ id: 'particle-wo', source: `${entry.surface}を確認した`, expected: true, actualTokenizer: false });
            cases.push({ id: 'particle-ga', source: `${entry.surface}がある`, expected: true, actualTokenizer: false });
            cases.push({ id: 'particle-no', source: `${entry.surface}の記録`, expected: true, actualTokenizer: false });
            cases.push({ id: 'particle-e', source: `${entry.surface}へ向かう`, expected: true, actualTokenizer: false });
        }
        cases.push({ id: 'quoted', source: `「${entry.surface}」`, expected: true, actualTokenizer: false });
        cases.push({ id: 'embedded', source: `昨日、${entry.surface}を確認した。`, expected: true, actualTokenizer: false });
        return cases;
    }
    
    function runLexicalCandidateAuditEntries(entryKeys) {
        const inventory = getLexicalCandidateAuditInventory();
        const selected = (entryKeys || []).map(key => lexicalAuditFindEntry(inventory, key)).filter(Boolean);
        const results = [];
        for (const entry of selected) {
            if (!entry.candidateExpected) {
                results.push({
                    key: entry.key, sourceType: entry.sourceType, surface: entry.surface, status: 'intentional-context-restriction',
                    disposition: 'reading-arbitration-only', candidateExpected: false, failures: [], probes: []
                });
                continue;
            }
            const probes = [];
            const failures = [];
            let infrastructureError = null;
            const cases = lexicalAuditContextCases(entry, inventory);
            for (const testCase of cases) {
                if (testCase.infrastructureError) {
                    infrastructureError = testCase.infrastructureError;
                    probes.push({ id: testCase.id, status: 'infrastructure-error', reason: testCase.infrastructureError });
                    continue;
                }
                const source = testCase.source;
                const start = source.indexOf(entry.surface);
                if (start < 0) {
                    infrastructureError = 'surface-not-present-in-generated-context';
                    probes.push({ id: testCase.id, status: 'infrastructure-error', reason: infrastructureError });
                    continue;
                }
                let evaluation;
                try {
                    const tokens = testCase.actualTokenizer ? lexicalAuditTokenize(source) : lexicalAuditSyntheticTokens(source, start, start + entry.surface.length, 'whole');
                    evaluation = lexicalAuditEvaluateCandidate(entry, source, tokens, start);
                } catch (error) {
                    infrastructureError = String(error?.message || error);
                    probes.push({ id: testCase.id, status: 'infrastructure-error', reason: infrastructureError });
                    continue;
                }
                const passed = evaluation.validationValid && evaluation.found === testCase.expected;
                probes.push({ id: testCase.id, source, expectedCandidate: testCase.expected, passed, ...evaluation });
                if (!passed) failures.push({
                    mechanism: evaluation.validationValid ? (testCase.expected ? 'embedded-or-context-discovery-gap' : 'context-scope-leak') : 'candidate-validation-failure',
                    probe: testCase.id,
                    source,
                    expectedCandidate: testCase.expected,
                    found: evaluation.found,
                    validationViolations: evaluation.validationViolations
                });
            }
    
            // Artificial tokenisation mutations are applied only where the maintained evidence
            // should be independent of the analyser's exact partition.
            if (!infrastructureError && entry.boundaryIndependent) {
                const mutationSource = entry.contextScope === 'pattern-restricted' || entry.contextScope === 'title-pattern-restricted'
                    ? lexicalAuditMaterializePattern(entry)
                    : `${entry.surface}を確認した`;
                if (mutationSource) {
                    const start = mutationSource.indexOf(entry.surface);
                    for (const mutation of ['whole', 'character-split', ...(entry.surface.includes('ノ') ? ['internal-no'] : []), 'final-shared-with-suffix']) {
                        if (mutation === 'final-shared-with-suffix' && start + entry.surface.length >= mutationSource.length) continue;
                        try {
                            const evaluation = lexicalAuditEvaluateCandidate(entry, mutationSource, lexicalAuditSyntheticTokens(mutationSource, start, start + entry.surface.length, mutation), start);
                            const passed = evaluation.validationValid && evaluation.found;
                            probes.push({ id: `mutation-${mutation}`, source: mutationSource, expectedCandidate: true, passed, ...evaluation });
                            if (!passed) failures.push({
                                mechanism: 'analyser-partition-sensitive', probe: `mutation-${mutation}`, source: mutationSource,
                                expectedCandidate: true, found: evaluation.found, validationViolations: evaluation.validationViolations
                            });
                        } catch (error) {
                            infrastructureError = String(error?.message || error);
                            probes.push({ id: `mutation-${mutation}`, status: 'infrastructure-error', reason: infrastructureError });
                            break;
                        }
                    }
                }
            }
    
            let status = 'passed';
            let disposition = null;
            if (infrastructureError) status = 'infrastructure-error';
            else if (failures.length) status = 'failed';
            else if (entry.contextScope !== 'global') disposition = entry.contextScope;
            results.push({
                key: entry.key, sourceType: entry.sourceType, sourceClass: entry.sourceClass, surface: entry.surface,
                contextScope: entry.contextScope, authoritative: entry.authoritative, ambiguityExpected: entry.ambiguityExpected,
                status, disposition, candidateExpected: true, failures,
                probeCount: probes.length,
                passedProbeCount: probes.filter(probe => probe.passed === true).length,
                probes: status === 'passed' ? [] : probes
            });
        }
        return results;
    }
    
    function getLexicalCandidateCollisionReport() {
        const inventory = getLexicalCandidateAuditInventory();
        const bySurface = new Map();
        for (const entry of inventory.entries) {
            if (entry.sourceClass === 'derived' || !entry.candidateExpected) continue;
            const list = bySurface.get(entry.surface) || [];
            list.push(entry);
            bySurface.set(entry.surface, list);
        }
        const collisions = [];
        for (const [surface, entries] of bySurface.entries()) {
            const sourceTypes = lexicalAuditSortedUnique(entries.map(entry => entry.sourceType));
            if (sourceTypes.length < 2) continue;
            const readings = lexicalAuditSortedUnique(entries.flatMap(entry => entry.readings || []));
            const outputs = lexicalAuditSortedUnique(entries.flatMap(entry => entry.outputs || []));
            const distinctInterpretations = lexicalAuditSortedUnique(entries.map(entry => `${entry.readings.join('|')}=>${entry.outputs.join('|')}`));
            collisions.push({
                surface,
                sourceTypes,
                readings,
                outputs,
                entryCount: entries.length,
                equivalentEvidence: distinctInterpretations.length === 1,
                ambiguous: readings.length > 1 || outputs.length > 1,
                entries: entries.map(entry => ({ key: entry.key, sourceType: entry.sourceType, candidateKind: entry.candidateKind, readings: entry.readings, outputs: entry.outputs, contextScope: entry.contextScope }))
            });
        }
        collisions.sort((left, right) => left.surface.localeCompare(right.surface, 'ja'));
        return collisions;
    }

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
        runTranslatorReadingAudit,
        getLexicalCandidateAuditInventory,
        runLexicalCandidateAuditEntries,
        getLexicalCandidateCollisionReport,
        prepareCandidateDiscoveryProbeForQa
    });
}());
//# sourceMappingURL=translator-qa.js.map
