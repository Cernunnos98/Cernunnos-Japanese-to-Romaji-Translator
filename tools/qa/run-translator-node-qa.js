const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createNodeTranslatorContext } = require('./browser/fake-dom');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const extraArgs = process.argv.slice(3);
const queueFlagIndex = extraArgs.indexOf('--write-differential-queue');
const differentialQueuePath = queueFlagIndex >= 0
    ? path.resolve(extraArgs[queueFlagIndex + 1] || path.join(root, 'tools/qa/translator-differential-review-queue.json'))
    : null;

function classifyDifferentialReview(item) {
    if (item.sourceType === 'proper-noun-vs-kuromoji') return 'proper-name-reading';
    if (item.sourceType === 'general-word-vs-reading-evidence') return 'cross-evidence-reading';
    if ((item.tokens || []).length > 1) return 'kuromoji-span-or-reading';
    return 'whole-word-reading';
}

function loadDifferentialReviews() {
    const reviewPath = path.join(root, 'tools/qa/translator-differential-review-decisions.json');
    const rows = JSON.parse(fs.readFileSync(reviewPath, 'utf8'));
    if (!Array.isArray(rows)) throw new Error('Differential review ledger must be an array.');
    const byKey = new Map();
    const bySurface = new Map();
    for (const row of rows) {
        const surface = String(row?.surface || '').trim();
        const decision = String(row?.decision || '').trim();
        if (!surface || !decision) throw new Error('Differential review entries require surface and decision.');
        if (row.sourceType) byKey.set(`${row.sourceType}\u0000${surface}`, row);
        if (!bySurface.has(surface)) bySurface.set(surface, row);
    }
    return { rows, byKey, bySurface };
}

function normalizeReviewRomaji(value) {
    return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
}

function applyDifferentialReviews(report) {
    const reviews = loadDifferentialReviews();
    const noChangeDecisions = new Set([
        'leave-as-review-signal', 'leave-evidence-disagreement', 'leave-context-dependent',
        'accept-kuromoji-variant', 'leave-lexical-name-ambiguity', 'leave-multiple-name-readings',
        'reference-source-unsuitable'
    ]);
    for (const item of report?.results || []) {
        if (item.status !== 'disagreement') { item.reviewStatus = 'not-needed'; continue; }
        if (item.translatorMatchesReference) { item.reviewStatus = 'resolved-by-translator'; continue; }
        const review = reviews.byKey.get(`${item.sourceType}\u0000${item.surface}`) || reviews.bySurface.get(item.surface) || null;
        item.manualReview = review;
        if (!review) { item.reviewStatus = 'unresolved'; continue; }
        if (review.expectedRomaji) {
            item.reviewStatus = normalizeReviewRomaji(item.translatorOutput) === normalizeReviewRomaji(review.expectedRomaji)
                ? 'resolved-by-review' : 'review-action-pending';
            continue;
        }
        item.reviewStatus = noChangeDecisions.has(review.decision) ? 'reviewed-no-change' : 'review-action-pending';
    }
    const disagreements = (report?.results || []).filter(item => item.status === 'disagreement');
    report.disagreements = disagreements;
    report.unavailable = (report?.results || []).filter(item => item.status === 'unavailable');
    report.summary.resolvedDisagreement = disagreements.filter(item => ['resolved-by-translator', 'resolved-by-review'].includes(item.reviewStatus)).length;
    report.summary.reviewedNoChange = disagreements.filter(item => item.reviewStatus === 'reviewed-no-change').length;
    report.summary.reviewActionPending = disagreements.filter(item => item.reviewStatus === 'review-action-pending').length;
    report.summary.unresolvedDisagreement = disagreements.filter(item => item.reviewStatus === 'unresolved').length;
    report.summary.reviewedDisagreement = report.summary.resolvedDisagreement + report.summary.reviewedNoChange;
    return report;
}

function writeDifferentialQueue(report) {
    if (!differentialQueuePath) return null;
    const items = [...(report?.disagreements || []), ...(report?.unavailable || [])].map(item => ({
        surface: item.surface,
        category: classifyDifferentialReview(item),
        sourceType: item.sourceType,
        status: item.status,
        reviewStatus: item.reviewStatus || 'not-needed',
        kuromojiReading: item.kuromojiReading || null,
        referenceReadings: item.referenceReadings || item.rightReadings || [],
        translatorOutput: item.translatorOutput || null,
        translatorMatchesReference: Boolean(item.translatorMatchesReference),
        manualReview: item.manualReview || null,
        tokens: item.tokens || []
    }));
    const payload = {
        generatedBy: 'tools/qa/run-translator-node-qa.js --write-differential-queue',
        note: 'Review queue only. Entries are never automatic fixes.',
        summary: report?.summary || {},
        items
    };
    fs.mkdirSync(path.dirname(differentialQueuePath), { recursive: true });
    fs.writeFileSync(differentialQueuePath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
    return differentialQueuePath;
}

const { context } = createNodeTranslatorContext(root);

(async () => {
    const enginePath = path.join(root, 'translator-engine.js');
    context.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true };
    vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });

    let syncGuard = false;
    try { context.RomajiTranslator.translateSync('テスト'); }
    catch (error) { syncGuard = /not ready yet/i.test(String(error?.message || error)); }

    await context.RomajiTranslator.ready;
    const diagnostics = context.RomajiTranslator.getDiagnostics();
    const tools = diagnostics.tools || {};
    if (typeof tools.runRegressionChecks !== 'function' || typeof tools.runTranslatorGeneratedQA !== 'function' || typeof tools.runTranslatorDifferentialChecks !== 'function') {
        throw new Error('Runtime diagnostic tools were not registered.');
    }
    const regression = tools.runRegressionChecks();
    const generated = await tools.runTranslatorGeneratedQA({ limit: 80 });
    const differential = applyDifferentialReviews(await tools.runTranslatorDifferentialChecks({ generalLimit: 500, nameLimit: 500, evidenceLimit: 500 }));
    const writtenDifferentialQueue = writeDifferentialQueue(differential);
    const policy = diagnostics.assetPolicy || {};
    const assetPolicy = Boolean(
        policy.generalWords?.criticality === 'critical' &&
        policy.exactOverrides?.criticality === 'optional' &&
        policy.titleReadingEvidence?.criticality === 'optional' &&
        policy.reviewedProperNameSpans?.criticality === 'optional' &&
        policy.counterDateEvidence?.criticality === 'critical' &&
        policy.historicalKanaEvidence?.criticality === 'optional' &&
        policy.runtimeDiagnostics?.criticality === 'developer-only'
    );
    const generatedFailures = Object.values(generated.summary || {}).reduce((total, item) => total + Number(item?.failed || 0), 0);
    const differentialReviewComplete = differential.summary.unresolvedDisagreement === 0 && differential.summary.reviewActionPending === 0;
    const output = {
        ok: syncGuard && assetPolicy && regression.failures.length === 0 && generatedFailures === 0 && differentialReviewComplete,
        differentialReviewComplete,
        syncReadinessGuard: syncGuard,
        assetPolicy,
        regressionSummary: regression.summary,
        regressionMechanismSummary: regression.mechanismSummary,
        regressionCount: regression.results.length,
        regressionFailures: regression.failures,
        generated,
        differential,
        differentialQueue: writtenDifferentialQueue,
        warnings: [...(context.RomajiTranslator.getDiagnostics().dataWarnings || [])],
        developerWarnings: [...(context.RomajiTranslator.getDiagnostics().developerWarnings || [])]
    };
    console.log(JSON.stringify(output, null, 2));
    process.exit(output.ok ? 0 : 2);
})().catch(error => { console.error(error.stack || error); process.exit(1); });
