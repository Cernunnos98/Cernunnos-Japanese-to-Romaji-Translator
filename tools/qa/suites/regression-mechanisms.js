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
