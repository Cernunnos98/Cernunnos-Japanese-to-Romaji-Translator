const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createNodeTranslatorContext } = require('./browser/fake-dom');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const areaArgument = process.argv.slice(3).find(argument => argument.startsWith('--area='));
const area = areaArgument?.slice('--area='.length) || '';

if (!area) {
    console.error('A focused QA area is required.');
    process.exit(2);
}

const { context } = createNodeTranslatorContext(root);

(async () => {
    const enginePath = path.join(root, 'translator-engine.js');
    context.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true };
    vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });
    await context.RomajiTranslator.ready;

    const diagnostics = context.RomajiTranslator.getDiagnostics();
    const tools = diagnostics?.tools;
    if (!tools) throw new Error('Runtime diagnostics did not load.');
    if (typeof tools.runRegressionChecks !== 'function') throw new Error('Runtime diagnostics do not expose runRegressionChecks.');

    let regression;
    try {
        regression = tools.runRegressionChecks({ area });
    } catch (error) {
        throw new Error(`Focused QA area \"${area}\" is unavailable: ${error.message || error}`);
    }
    const selectedArea = regression.availableAreas.find(item => item.id === area);
    const output = {
        ok: regression.harnessPassed && regression.definitionProblems.length === 0 && regression.failures.length === 0,
        area,
        label: selectedArea?.label || area,
        regressionCount: regression.results.length,
        summary: regression.summary,
        mechanismSummary: regression.mechanismSummary,
        definitionProblems: regression.definitionProblems,
        failures: regression.failures,
        results: regression.results
    };
    console.log(JSON.stringify(output, null, 2));
    process.exit(output.ok ? 0 : 2);
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
