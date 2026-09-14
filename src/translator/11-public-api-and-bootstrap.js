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
        canonicalizeTokenizerBoundaryCharacters,
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
        evaluateContextualLoanwordEvidence,
        annotateContextualLoanwordEvidence,
        annotateMorphologicalOutputBoundaries,
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
        markAmbiguousNumericRoleTokens,
        markTypedClockHourRoleTokens,
        markTypedMinuteCounterRoleTokens,
        applyTypedNumericRoleReadings,
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
