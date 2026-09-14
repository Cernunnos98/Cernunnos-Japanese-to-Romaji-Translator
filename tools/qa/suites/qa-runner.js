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
