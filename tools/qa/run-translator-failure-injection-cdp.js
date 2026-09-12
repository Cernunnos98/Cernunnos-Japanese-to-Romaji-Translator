const fs = require('fs');
const path = require('path');
const vm = require('vm');
const {
    createCdpSession,
    launchChromium,
    mime,
    positiveInteger,
    signalProcessGroup,
    stopBrowserSession,
    withTimeout
} = require('./browser/cdp-harness');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const chromium = process.env.CHROMIUM || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(fs.existsSync);
if (!chromium) throw new Error('Chromium was not found. Set CHROMIUM to its executable path.');

const requestTimeout = positiveInteger(process.env.TRANSLATOR_FAILURE_REQUEST_TIMEOUT_MS, 10000);
const commandTimeout = positiveInteger(process.env.TRANSLATOR_FAILURE_COMMAND_TIMEOUT_MS, 15000);
const scenarioTimeout = positiveInteger(process.env.TRANSLATOR_FAILURE_SCENARIO_TIMEOUT_MS, 90000);
const suiteTimeout = positiveInteger(process.env.TRANSLATOR_FAILURE_INJECTION_TIMEOUT_MS, 240000);
const activeBrowsers = new Set();
let shuttingDown = false;

async function withBrowser(task) {
    const session = await launchChromium(chromium, { profilePrefix: 'translator-failure-injection-' });
    activeBrowsers.add(session);
    try {
        await session.ready;
        return await task(session.port);
    } finally {
        await stopBrowserSession(session);
        activeBrowsers.delete(session);
    }
}

async function shutdown(reason, exitCode) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`\n${reason}`);
    await Promise.allSettled(Array.from(activeBrowsers, session => stopBrowserSession(session)));
    activeBrowsers.clear();
    process.exit(exitCode);
}

process.on('SIGINT', () => { void shutdown('Failure injection interrupted; cleaning Chromium processes.', 130); });
process.on('SIGTERM', () => { void shutdown('Failure injection terminated; cleaning Chromium processes.', 143); });
process.on('exit', () => {
    for (const session of activeBrowsers) {
        try { signalProcessGroup(session.browser, 'SIGKILL'); } catch (_) {}
        try { fs.rmSync(session.profile, { recursive: true, force: true }); } catch (_) {}
    }
});

const suiteWatchdog = setTimeout(() => {
    void shutdown(`Failure injection exceeded ${suiteTimeout} ms; cleaning Chromium processes.`, 1);
}, suiteTimeout);
suiteWatchdog.unref();

function loadAssetRegistry() {
    const sourcePath = path.join(root, 'src/translator/01-assets-and-schemas.js');
    const context = vm.createContext({
        URL,
        console,
        window: {},
        document: {
            currentScript: { src: 'https://translator.test/translator-engine.js' },
            baseURI: 'https://translator.test/'
        }
    });
    vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: sourcePath });
    return vm.runInContext(`Object.fromEntries(Object.entries(translatorAssets).map(([key, value]) => [key, {
        paths: [...value.paths], criticality: value.criticality, type: value.type, schema: value.schema || null
    }]))`, context);
}

function safeId(value) {
    return String(value || '').replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();
}

function chooseDictionaryProbe(relativeDirectory) {
    const directory = path.join(root, relativeDirectory);
    const files = fs.readdirSync(directory).filter(name => name.endsWith('.gz')).sort();
    if (!files.length) throw new Error(`No dictionary probe file found under ${relativeDirectory}`);
    const preferred = files.includes('base.dat.gz') ? 'base.dat.gz' : files[0];
    return path.posix.join(relativeDirectory.replace(/\\/g, '/'), preferred);
}

function buildScenarios(registry) {
    const scenarios = [];
    const firstJsonByCriticality = new Map();
    for (const [assetKey, definition] of Object.entries(registry)) {
        if (definition.type === 'json') {
            for (const [index, assetPath] of definition.paths.entries()) {
                const suffix = `${safeId(assetKey)}-${index + 1}`;
                scenarios.push({
                    id: `${definition.criticality}-json-missing-${suffix}`,
                    assetKey, assetPath, criticality: definition.criticality, type: definition.type, failure: 'missing'
                });
                scenarios.push({
                    id: `${definition.criticality}-json-bad-schema-${suffix}`,
                    assetKey, assetPath, criticality: definition.criticality, type: definition.type, failure: 'bad-schema'
                });
                if (!firstJsonByCriticality.has(definition.criticality)) {
                    firstJsonByCriticality.set(definition.criticality, { assetKey, assetPath, definition });
                }
            }
            continue;
        }
        if (definition.type === 'script') {
            for (const [index, assetPath] of definition.paths.entries()) {
                scenarios.push({
                    id: `${definition.criticality}-script-missing-${safeId(assetKey)}-${index + 1}`,
                    assetKey, assetPath, criticality: definition.criticality, type: definition.type, failure: 'script-missing'
                });
            }
            continue;
        }
        if (definition.type === 'dictionary-bundle') {
            for (const [index, directory] of definition.paths.entries()) {
                scenarios.push({
                    id: `${definition.criticality}-dictionary-missing-${safeId(assetKey)}-${index + 1}`,
                    assetKey,
                    assetPath: chooseDictionaryProbe(directory),
                    criticality: definition.criticality,
                    type: definition.type,
                    failure: 'dictionary-missing'
                });
            }
        }
    }

    // Parser failures need one representative at each JSON failure policy; schema failures cover every JSON path.
    for (const [criticality, item] of firstJsonByCriticality.entries()) {
        scenarios.push({
            id: `${criticality}-json-malformed-${safeId(item.assetKey)}`,
            assetKey: item.assetKey,
            assetPath: item.assetPath,
            criticality,
            type: 'json',
            failure: 'bad-json'
        });
    }

    scenarios.push(
        {
            id: 'runtime-json-transient-503-retry',
            assetKey: 'counterDateEvidence', assetPath: registry.counterDateEvidence.paths[0],
            criticality: 'critical', type: 'json', failure: 'transient-503'
        },
        {
            id: 'runtime-script-transient-retry',
            assetKey: 'kuromojiScript', assetPath: registry.kuromojiScript.paths[0],
            criticality: 'critical', type: 'script', failure: 'script-transient-error'
        },
        {
            id: 'runtime-json-timeout-bounded',
            assetKey: 'kanjiBanks', assetPath: registry.kanjiBanks.paths[0],
            criticality: 'critical', type: 'json', failure: 'json-timeout', assetTimeoutMs: 250
        },
        {
            id: 'runtime-script-timeout-bounded',
            assetKey: 'kuromojiScript', assetPath: registry.kuromojiScript.paths[0],
            criticality: 'critical', type: 'script', failure: 'script-timeout', scriptTimeoutMs: 250
        },
        {
            id: 'runtime-tokenizer-timeout-bounded',
            assetKey: 'kuromojiDictionary', assetPath: registry.kuromojiDictionary.paths[0],
            criticality: 'critical', type: 'runtime', failure: 'tokenizer-timeout', tokenizerTimeoutMs: 250
        },
        {
            id: 'runtime-tokenizer-configurable-delayed-success',
            assetKey: 'kuromojiDictionary', assetPath: registry.kuromojiDictionary.paths[0],
            criticality: 'critical', type: 'runtime', failure: 'tokenizer-delayed-success', tokenizerTimeoutMs: 2000, delayMs: 300
        },
        {
            id: 'runtime-bind-initialization-failure-contained',
            assetKey: 'kanjiBanks', assetPath: registry.kanjiBanks.paths[0],
            criticality: 'critical', type: 'json', failure: 'bind-init-failure'
        },
        {
            id: 'runtime-diagnostics-bridge-collision-owned-cleanup',
            assetKey: 'runtimeDiagnostics', assetPath: registry.runtimeDiagnostics.paths[0],
            criticality: 'developer-only', type: 'runtime', failure: 'diagnostics-bridge-collision'
        },
        {
            id: 'runtime-critical-waits-for-delayed-sibling',
            assetKey: 'kanjiBanks', assetPath: registry.kanjiBanks.paths[0],
            delayedPath: registry.kanjiVariants.paths[0], delayMs: 350,
            criticality: 'critical', type: 'json', failure: 'delayed-sibling', assetTimeoutMs: 1000
        },
        {
            id: 'runtime-production-fatal-visible',
            assetKey: 'kanjiBanks', assetPath: registry.kanjiBanks.paths[0],
            criticality: 'critical', type: 'json', failure: 'production-fatal', runtimeDiagnostics: false
        },
        {
            id: 'runtime-preexisting-kuromoji-incompatible',
            assetKey: 'kuromojiScript', assetPath: registry.kuromojiScript.paths[0],
            criticality: 'critical', type: 'runtime', failure: 'preexisting-kuromoji-incompatible'
        },
        {
            id: 'runtime-preexisting-kuromoji-compatible',
            assetKey: 'kuromojiScript', assetPath: registry.kuromojiScript.paths[0],
            criticality: 'critical', type: 'runtime', failure: 'preexisting-kuromoji-compatible'
        },
        {
            id: 'runtime-tokenizer-hooks-incompatible',
            assetKey: 'kuromojiDictionary', assetPath: registry.kuromojiDictionary.paths[0],
            criticality: 'critical', type: 'runtime', failure: 'tokenizer-hooks-incompatible'
        }
    );
    return scenarios;
}

async function runScenario(scenario, port) {
    if (shuttingDown) throw new Error('Failure injection is shutting down.');
    console.error(`Running ${scenario.id}`);
    const session = await createCdpSession(port, { requestTimeout, commandTimeout });
    const { command, on } = session;
    await command('Runtime.enable');
    await command('Page.enable');
    await command('Network.enable');
    await command('Network.setCacheDisabled', { cacheDisabled: true });
    await command('Fetch.enable', { patterns: [{ urlPattern: 'https://translator.test/*', requestStage: 'Request' }] });
    const fetchTasks = new Set();
    let fetchError = null;
    let closing = false;
    on('Fetch.requestPaused', params => {
        if (closing) return;
        const task = (async () => {
            const url = new URL(params.request.url);
            const local = path.join(root, decodeURIComponent(url.pathname).replace(/^\/+/, ''));
            if (!local.startsWith(`${root}${path.sep}`) || !fs.existsSync(local)) {
                await command('Fetch.fulfillRequest', {
                    requestId: params.requestId,
                    responseCode: 404,
                    responseHeaders: [{ name: 'Access-Control-Allow-Origin', value: '*' }],
                    body: ''
                });
                return;
            }
            const data = fs.readFileSync(local);
            await command('Fetch.fulfillRequest', {
                requestId: params.requestId,
                responseCode: 200,
                responseHeaders: [
                    { name: 'Content-Type', value: mime(local) },
                    { name: 'Access-Control-Allow-Origin', value: '*' }
                ],
                body: data.toString('base64')
            });
        })();
        fetchTasks.add(task);
        task.then(
            () => fetchTasks.delete(task),
            error => { fetchTasks.delete(task); fetchError ||= error; }
        );
    });

    const tree = await command('Page.getFrameTree');
    const frameId = tree.frameTree.frame.id;
    let html = fs.readFileSync(path.join(root, 'tools/qa/browser/translator-failure-injection.html'), 'utf8');
    html = html.replace('<head>', `<head><base href="https://translator.test/tools/qa/browser/"><script>(function(){const NativeXHR=window.XMLHttpRequest;window.XMLHttpRequest=class extends NativeXHR{open(method,url,...rest){const resolved=String(url).startsWith('/')?'https://translator.test'+url:url;return super.open(method,resolved,...rest);}};window.__TRANSLATOR_FAILURE_SCENARIO__=${JSON.stringify(scenario)};window.addEventListener('message',e=>{if(e.data&&e.data.type==='translator-failure-injection')window.failureInjectionScenarioResult=e.data.result;});}());<\/script>`);
    await command('Page.setDocumentContent', { frameId, html });

    const start = Date.now();
    let result = null;
    while (Date.now() - start < 60000) {
        const response = await command('Runtime.evaluate', { expression: 'window.failureInjectionScenarioResult||null', returnByValue: true });
        result = response.result?.value || null;
        if (result) break;
        await new Promise(resolve => setTimeout(resolve, 200));
    }
    if (!result) {
        const diagnostics = await command('Runtime.evaluate', {
            expression: '({body:document.body&&document.body.innerText,diag:window.RomajiTranslator?.getDiagnostics?.()||null})',
            returnByValue: true
        });
        throw new Error(`${scenario.id} timeout ${JSON.stringify(diagnostics.result?.value)}`);
    }
    closing = true;
    while (fetchTasks.size) await Promise.allSettled([...fetchTasks]);
    if (fetchError && !String(fetchError?.message || fetchError).includes('Invalid InterceptionId')) throw fetchError;
    try { await command('Page.close'); } catch (_) {}
    session.close();
    return result;
}

async function runWithConcurrency(items, limit, worker) {
    const results = new Array(items.length);
    let nextIndex = 0;
    async function consume() {
        while (true) {
            if (shuttingDown) throw new Error('Failure injection is shutting down.');
            const index = nextIndex++;
            if (index >= items.length) return;
            results[index] = await worker(items[index]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
    return results;
}

(async () => {
    const registry = loadAssetRegistry();
    const allScenarios = buildScenarios(registry);
    const filterText = String(process.env.TRANSLATOR_FAILURE_FILTER || '').trim();
    const filters = filterText ? filterText.split(',').map(item => item.trim()).filter(Boolean) : [];
    const filteredScenarios = filters.length ? allScenarios.filter(item => filters.some(filter => item.id.includes(filter))) : allScenarios;
    if (!filteredScenarios.length) throw new Error(`No failure-injection scenarios matched: ${filterText}`);

    if (process.env.TRANSLATOR_FAILURE_LIST_ONLY === '1') {
        clearTimeout(suiteWatchdog);
        console.log(JSON.stringify({
            count: filteredScenarios.length,
            declaredScenarios: allScenarios.length,
            scenarios: filteredScenarios.map(item => item.id)
        }, null, 2));
        process.exit(0);
    }

    const partitionCount = positiveInteger(process.env.TRANSLATOR_FAILURE_PARTITION_COUNT, 1);
    const partitionIndexText = String(process.env.TRANSLATOR_FAILURE_PARTITION_INDEX ?? '0').trim();
    const partitionIndex = Number(partitionIndexText);
    if (!Number.isInteger(partitionIndex) || partitionIndex < 0 || partitionIndex >= partitionCount) {
        throw new Error(`Invalid failure-injection partition index ${partitionIndexText}; expected 0..${partitionCount - 1}.`);
    }
    const scenarios = partitionCount === 1
        ? filteredScenarios
        : filteredScenarios.filter((_, index) => index % partitionCount === partitionIndex);
    if (!scenarios.length) throw new Error(`Failure-injection partition ${partitionIndex + 1}/${partitionCount} has no scenarios.`);
    const results = [];
    // Each scenario gets a fresh page; browser reuse is bounded for faster local gates.
    const batchSize = positiveInteger(process.env.TRANSLATOR_FAILURE_BATCH_SIZE, 2);
    for (let offset = 0; offset < scenarios.length; offset += batchSize) {
        if (shuttingDown) throw new Error('Failure injection is shutting down.');
        const batch = scenarios.slice(offset, offset + batchSize);
        const batchResults = await withBrowser(port => runWithConcurrency(batch, 1, scenario =>
            withTimeout(runScenario(scenario, port), scenarioTimeout, scenario.id)
        ));
        results.push(...batchResults);
    }
    const coverage = {
        declaredAssets: Object.keys(registry).length,
        scenarios: scenarios.length,
        filteredScenarios: filteredScenarios.length,
        declaredScenarios: allScenarios.length,
        partitionIndex,
        partitionCount,
        jsonPaths: Object.values(registry).filter(item => item.type === 'json').reduce((sum, item) => sum + item.paths.length, 0),
        scriptPaths: Object.values(registry).filter(item => item.type === 'script').reduce((sum, item) => sum + item.paths.length, 0),
        dictionaryBundles: Object.values(registry).filter(item => item.type === 'dictionary-bundle').reduce((sum, item) => sum + item.paths.length, 0)
    };
    const report = { ok: results.every(result => result.ok), coverage, results };
    const reportPath = String(process.env.TRANSLATOR_FAILURE_REPORT_PATH || '').trim();
    if (reportPath) {
        fs.mkdirSync(path.dirname(path.resolve(reportPath)), { recursive: true });
        fs.writeFileSync(path.resolve(reportPath), `${JSON.stringify(report, null, 2)}\n`);
    }
    clearTimeout(suiteWatchdog);
    console.log(JSON.stringify(report, null, 2));
    process.exit(report.ok ? 0 : 2);
})().catch(error => {
    clearTimeout(suiteWatchdog);
    console.error(error.stack || error);
    void shutdown('Failure injection failed; cleaning Chromium processes.', 1);
});
