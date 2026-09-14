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
        add({ sourceType: 'reviewed-reading-span', surface, readings: [entry?.reading], outputs: [entry?.romaji], candidateKind: 'reviewed-reading' });
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
