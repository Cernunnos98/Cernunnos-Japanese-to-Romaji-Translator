#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { performance } = require('perf_hooks');
const { spawn } = require('child_process');
const { createNodeTranslatorContext } = require('./browser/fake-dom');
const {
    createCdpSession,
    launchChromium,
    mime,
    processGroupExists,
    stopBrowserSession
} = require('./browser/cdp-harness');

const STATES = Object.freeze({
    PASS: 'pass',
    PERFORMANCE_FAILURE: 'performance-failure',
    MEMORY_INSTABILITY: 'memory-instability',
    HARNESS_ERROR: 'harness-error',
    UNSUPPORTED: 'unsupported-environment',
    NOT_RUN: 'not-run'
});

const argv = process.argv.slice(2);
const rootArg = argv[0] && !argv[0].startsWith('--') ? argv.shift() : null;
const root = path.resolve(rootArg || path.join(__dirname, '../..'));
const activeChildren = new Set();

function hasFlag(name) { return argv.includes(name); }
function argValue(name, fallback = null) {
    const index = argv.indexOf(name);
    return index >= 0 ? (argv[index + 1] ?? fallback) : fallback;
}
function positiveIntArg(name, fallback) {
    const raw = argValue(name, null);
    if (raw == null) return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) throw new Error(`${name} requires a positive integer.`);
    return value;
}
function percentile(sorted, quantile) {
    if (!sorted.length) return null;
    const position = (sorted.length - 1) * quantile;
    const lower = Math.floor(position);
    const upper = Math.ceil(position);
    if (lower === upper) return sorted[lower];
    return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}
function stats(samples) {
    const values = samples.filter(Number.isFinite).sort((a, b) => a - b);
    return {
        samples: values.length,
        median: percentile(values, 0.5),
        p95: percentile(values, 0.95),
        p99: values.length >= 100 ? percentile(values, 0.99) : null,
        min: values.length ? values[0] : null,
        max: values.length ? values[values.length - 1] : null
    };
}
function roundMetrics(value) {
    if (Array.isArray(value)) return value.map(roundMetrics);
    if (!value || typeof value !== 'object') return typeof value === 'number' && Number.isFinite(value) ? Number(value.toFixed(3)) : value;
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, roundMetrics(item)]));
}
function environment(extra = {}) {
    return {
        nodeVersion: process.version,
        platform: process.platform,
        architecture: process.arch,
        timestamp: new Date().toISOString(),
        nodeFlags: [...process.execArgv],
        gcExposed: typeof global.gc === 'function',
        ...extra
    };
}

const corpus = Object.freeze([
    '全員まとめて僕のもの',
    '桃源郷ノ蜜事を読んだ',
    '此花亭奇譚について話す',
    'ロシア語を勉強している',
    '東京へ行って映画を見る',
    '「風の谷のナウシカ」が好きです',
    '学校に行く前に本を買った',
    'デスノートの新しい展示を見た',
    '三百六十五日を振り返る',
    '銀魂を友達と一緒に見ました',
    '日本語の文章をローマ字に変換する',
    '隠れ巨乳の先輩が快楽に屈服して堕ちるまで'
]);

async function createReadyTranslatorContext(options = {}) {
    const started = performance.now();
    const { context } = createNodeTranslatorContext(root);
    if (options.quietConsole) context.console = Object.freeze({ log() {}, info() {}, warn() {}, error() {} });
    context.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: Boolean(options.runtimeDiagnostics) };
    const enginePath = path.join(root, 'translator-engine.js');
    const evalStarted = performance.now();
    vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });
    const evalFinished = performance.now();
    await context.RomajiTranslator.ready;
    const readyFinished = performance.now();
    return {
        context,
        timing: {
            engineEvaluationMs: evalFinished - evalStarted,
            readyWaitMs: readyFinished - evalFinished,
            coldInitialisationMs: readyFinished - started
        }
    };
}

async function measureNodeBenchmarks(config) {
    const cold = [];
    for (let index = 0; index < config.coldIterations; index += 1) {
        const instance = await createReadyTranslatorContext();
        cold.push(instance.timing);
        try { instance.context.RomajiTranslator.destroy(); } catch (_) {}
    }

    const { context } = await createReadyTranslatorContext();

    for (let index = 0; index < config.warmupIterations; index += 1) {
        context.RomajiTranslator.translateSync(corpus[index % corpus.length]);
    }
    const translationSamples = [];
    for (let index = 0; index < config.measureIterations; index += 1) {
        const input = corpus[index % corpus.length];
        const started = performance.now();
        context.RomajiTranslator.translateSync(input);
        translationSamples.push(performance.now() - started);
    }

    const { context: qaContext } = await createReadyTranslatorContext({ runtimeDiagnostics: true, quietConsole: true });
    const prepareCandidateProbe = qaContext.RomajiTranslator.getDiagnostics()?.tools?.prepareCandidateDiscoveryProbeForQa;
    if (typeof prepareCandidateProbe !== 'function') throw new Error('Candidate-discovery performance probe is unavailable from developer QA diagnostics.');
    const probes = corpus.map(input => prepareCandidateProbe(input));
    for (let index = 0; index < config.warmupIterations; index += 1) probes[index % probes.length]();
    const candidateSamples = [];
    for (let index = 0; index < config.measureIterations; index += 1) {
        const probe = probes[index % probes.length];
        const started = performance.now();
        probe();
        candidateSamples.push(performance.now() - started);
    }
    try { context.RomajiTranslator.destroy(); } catch (_) {}
    try { qaContext.RomajiTranslator.destroy(); } catch (_) {}

    return {
        state: STATES.PASS,
        mode: 'node',
        warmupIterations: config.warmupIterations,
        measuredIterations: config.measureIterations,
        coldIterations: config.coldIterations,
        coldInitialisationMs: stats(cold.map(item => item.coldInitialisationMs)),
        engineEvaluationMs: stats(cold.map(item => item.engineEvaluationMs)),
        dataAndTokenizerReadyWaitMs: stats(cold.map(item => item.readyWaitMs)),
        translationLatencyMs: stats(translationSamples),
        candidateDiscoveryLatencyMs: stats(candidateSamples)
    };
}

function forceGc() {
    if (typeof global.gc !== 'function') return false;
    global.gc();
    global.gc();
    global.gc();
    return true;
}

async function runMemoryWorker(config) {
    if (typeof global.gc !== 'function') {
        return {
            state: STATES.HARNESS_ERROR,
            mode: 'memory',
            diagnostic: `Explicit GC is unavailable. Run: ${process.execPath} --expose-gc ${__filename} ${root} --memory-worker`
        };
    }
    const { context } = await createReadyTranslatorContext();
    for (let index = 0; index < config.memoryWarmupIterations; index += 1) {
        context.RomajiTranslator.translateSync(corpus[index % corpus.length]);
    }

    const baselineGcReadings = [];
    for (let index = 0; index < 3; index += 1) {
        forceGc();
        baselineGcReadings.push(process.memoryUsage().heapUsed);
    }
    const baselineHeap = [...baselineGcReadings].sort((a, b) => a - b)[1];
    const gcNoiseBytes = Math.max(...baselineGcReadings) - Math.min(...baselineGcReadings);
    const plateaux = [];
    for (let plateau = 0; plateau < config.memoryPlateaux; plateau += 1) {
        for (let index = 0; index < config.memoryWorkloadIterations; index += 1) {
            context.RomajiTranslator.translateSync(corpus[(plateau * config.memoryWorkloadIterations + index) % corpus.length]);
        }
        forceGc();
        plateaux.push({ plateau: plateau + 1, heapUsedBytes: process.memoryUsage().heapUsed });
    }
    try { context.RomajiTranslator.destroy(); } catch (_) {}
    forceGc();

    const heaps = plateaux.map(item => item.heapUsedBytes);
    const deltas = heaps.slice(1).map((value, index) => value - heaps[index]);
    const noiseThreshold = Math.max(gcNoiseBytes * 3, 256 * 1024);
    const cumulativeThreshold = Math.max(gcNoiseBytes * 6, 1024 * 1024);
    const cumulativeGrowth = heaps.length ? heaps[heaps.length - 1] - heaps[0] : 0;
    const continuingGrowth = deltas.length >= 2 && deltas.every(delta => delta > noiseThreshold) && cumulativeGrowth > cumulativeThreshold;

    return {
        state: continuingGrowth ? STATES.MEMORY_INSTABILITY : STATES.PASS,
        mode: 'memory',
        environment: environment({ benchmarkMode: 'memory-worker' }),
        gcExposed: true,
        warmupIterations: config.memoryWarmupIterations,
        workloadIterationsPerPlateau: config.memoryWorkloadIterations,
        plateaux: config.memoryPlateaux,
        baselineHeapUsedBytes: baselineHeap,
        baselineGcReadingsBytes: baselineGcReadings,
        gcNoiseBytes,
        noiseThresholdBytes: noiseThreshold,
        cumulativeGrowthThresholdBytes: cumulativeThreshold,
        postWorkloadPlateaux: plateaux,
        plateauDeltasBytes: deltas,
        cumulativeGrowthBytes: cumulativeGrowth,
        continuingGrowth
    };
}

function runChildJson(command, args, options = {}) {
    const timeoutMs = Number.isFinite(Number(options.timeoutMs)) ? Number(options.timeoutMs) : 300000;
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: root,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: process.platform !== 'win32'
        });
        activeChildren.add(child);
        let stdout = '';
        let stderr = '';
        let settled = false;
        const finish = (error, value) => {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            activeChildren.delete(child);
            if (error) reject(error); else resolve(value);
        };
        const stop = signal => {
            try {
                if (process.platform === 'win32') child.kill(signal);
                else process.kill(-child.pid, signal);
            } catch (error) {
                if (error.code !== 'ESRCH') throw error;
            }
        };
        const timer = setTimeout(() => {
            stop('SIGTERM');
            setTimeout(() => { try { stop('SIGKILL'); } catch (_) {} }, 1000).unref();
            finish(new Error(`Memory worker exceeded ${timeoutMs} ms.`));
        }, timeoutMs);
        child.stdout?.setEncoding('utf8');
        child.stderr?.setEncoding('utf8');
        child.stdout?.on('data', chunk => { stdout += chunk; });
        child.stderr?.on('data', chunk => { stderr += chunk; });
        child.once('error', error => finish(error));
        child.once('exit', code => {
            if (code !== 0) {
                const error = new Error(stderr.trim() || stdout.trim() || `Child process exited with ${code}.`);
                error.exitCode = code;
                finish(error);
                return;
            }
            try { finish(null, JSON.parse(stdout)); }
            catch (error) { finish(new Error(`Memory worker returned invalid JSON: ${error.message}; stderr=${stderr.trim()}`)); }
        });
    });
}

function terminateActiveChildren() {
    for (const child of activeChildren) {
        try {
            if (process.platform === 'win32') child.kill('SIGKILL');
            else process.kill(-child.pid, 'SIGKILL');
        } catch (_) {}
    }
}

process.on('SIGINT', () => { terminateActiveChildren(); process.exit(130); });
process.on('SIGTERM', () => { terminateActiveChildren(); process.exit(143); });
process.on('exit', terminateActiveChildren);

async function measureMemory(config) {
    const childArgs = [
        '--expose-gc', __filename, root, '--memory-worker',
        '--memory-warmup', String(config.memoryWarmupIterations),
        '--memory-workload', String(config.memoryWorkloadIterations),
        '--memory-plateaux', String(config.memoryPlateaux)
    ];
    const result = await runChildJson(process.execPath, childArgs);
    return { ...result, isolatedWorker: true, relaunchUsed: typeof global.gc !== 'function' };
}

function findChromium() {
    const configured = process.env.CHROMIUM;
    if (configured) return fs.existsSync(configured) ? configured : null;
    return ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome', '/usr/bin/google-chrome-stable'].find(fs.existsSync) || null;
}

async function installRootInterceptor(session) {
    const { command, on } = session;
    await command('Fetch.enable', { patterns: [{ urlPattern: 'https://translator.test/*', requestStage: 'Request' }] });
    on('Fetch.requestPaused', async params => {
        try {
            const url = new URL(params.request.url);
            const requestPath = decodeURIComponent(url.pathname).replace(/^\/+/, '');
            const local = path.resolve(root, requestPath);
            if (!local.startsWith(`${root}${path.sep}`) || !fs.existsSync(local) || !fs.statSync(local).isFile()) {
                await command('Fetch.fulfillRequest', {
                    requestId: params.requestId,
                    responseCode: 404,
                    responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }],
                    body: Buffer.from('Not found').toString('base64')
                });
                return;
            }
            const data = fs.readFileSync(local);
            await command('Fetch.fulfillRequest', {
                requestId: params.requestId,
                responseCode: 200,
                responseHeaders: [
                    { name: 'Content-Type', value: mime(local) },
                    { name: 'Access-Control-Allow-Origin', value: '*' },
                    { name: 'Cache-Control', value: 'no-store' }
                ],
                body: data.toString('base64')
            });
        } catch (_) {
            try { await command('Fetch.failRequest', { requestId: params.requestId, errorReason: 'Failed' }); } catch (_) {}
        }
    });
}

async function measureBrowser(config) {
    const chromium = findChromium();
    if (!chromium) {
        return { state: STATES.UNSUPPORTED, mode: 'browser', diagnostic: 'Chromium was not found. Set CHROMIUM to its executable path.' };
    }
    let session = null;
    let profile = null;
    let browser = null;
    let result = null;
    try {
        session = await launchChromium(chromium, { profilePrefix: 'cj2r-perf-' });
        profile = session.profile;
        browser = session.browser;
        await session.ready;
        const cdp = await createCdpSession(session.port, { commandTimeout: 30000 });
        const { command } = cdp;
        await command('Runtime.enable');
        await command('Page.enable');
        await installRootInterceptor(cdp);
        const version = await command('Browser.getVersion');
        const frameId = (await command('Page.getFrameTree')).frameTree.frame.id;
        let html = fs.readFileSync(path.join(root, 'translator.html'), 'utf8');
        html = html.replace('<head>', '<head><base href="https://translator.test/">');
        html = html.replace('<script src="translator-engine.js"></script>', '<script src="https://translator.test/translator-engine.js"></script>');
        const loadStarted = performance.now();
        await command('Page.setDocumentContent', { frameId, html });
        let apiPublished = false;
        const apiDeadline = Date.now() + 30000;
        while (Date.now() < apiDeadline) {
            const probe = await command('Runtime.evaluate', { expression: 'Boolean(window.RomajiTranslator)', returnByValue: true });
            if (probe.result?.value) { apiPublished = true; break; }
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        if (!apiPublished) throw new Error('Browser translator API was not published within 30000 ms.');
        const readyResult = await command('Runtime.evaluate', {
            expression: '(async()=>{await window.RomajiTranslator.ready; return true;})()', awaitPromise: true, returnByValue: true
        });
        if (readyResult.exceptionDetails) throw new Error(readyResult.exceptionDetails.text || 'Browser translator readiness evaluation failed.');
        if (!readyResult.result?.value) throw new Error('Browser translator did not become ready.');
        const browserReadyMs = performance.now() - loadStarted;
        const bench = await command('Runtime.evaluate', {
            expression: `(async()=>{\n                const corpus=${JSON.stringify(corpus)};\n                const input=document.getElementById('input');\n                const output=document.getElementById('output');\n                const one=async(text)=>{\n                    const before=output.innerText;\n                    const started=performance.now();\n                    input.value=text;\n                    input.dispatchEvent(new Event('input',{bubbles:true}));\n                    while(performance.now()-started<5000){\n                        if(output.innerText!==before) return performance.now()-started;\n                        await new Promise(resolve=>setTimeout(resolve,1));\n                    }\n                    throw new Error('UI output timeout');\n                };\n                for(let i=0;i<${config.browserWarmupIterations};i+=1) await one(corpus[i%corpus.length]);\n                const samples=[];\n                for(let i=0;i<${config.browserMeasureIterations};i+=1) samples.push(await one(corpus[i%corpus.length]));\n                return {samples};\n            })()`,
            awaitPromise: true,
            returnByValue: true
        });
        if (bench.exceptionDetails) throw new Error(bench.exceptionDetails.text || 'Browser benchmark evaluation failed.');
        result = {
            state: STATES.PASS,
            mode: 'browser',
            browser: version.product || null,
            browserProtocolVersion: version.protocolVersion || null,
            executable: path.basename(chromium),
            warmupIterations: config.browserWarmupIterations,
            measuredIterations: config.browserMeasureIterations,
            coldPageToReadyMs: browserReadyMs,
            inputToOutputLatencyMs: stats(bench.result?.value?.samples || [])
        };
        cdp.close();
    } catch (error) {
        result = { state: STATES.HARNESS_ERROR, mode: 'browser', diagnostic: String(error?.message || error) };
    } finally {
        if (session) await stopBrowserSession(session).catch(() => {});
    }
    const profileRemoved = Boolean(profile) && !fs.existsSync(profile);
    const processGroupStopped = Boolean(browser) && !processGroupExists(browser);
    const cleanupVerified = profileRemoved && processGroupStopped;
    if (result.state === STATES.PASS && !cleanupVerified) {
        result = { ...result, state: STATES.HARNESS_ERROR, diagnostic: 'Browser benchmark cleanup verification failed.' };
    }
    return { ...result, cleanupVerified, cleanup: { profileRemoved, processGroupStopped } };
}

async function runCleanupFailureSelfTest() {
    const chromium = findChromium();
    if (!chromium) return { state: STATES.UNSUPPORTED, diagnostic: 'Chromium was not found. Set CHROMIUM to its executable path.' };
    let session;
    let profile;
    let browser;
    try {
        session = await launchChromium(chromium, { profilePrefix: 'cj2r-perf-cleanup-test-' });
        profile = session.profile;
        browser = session.browser;
        await session.ready;
        throw new Error('deliberate cleanup-path probe');
    } catch (error) {
        if (!/deliberate cleanup-path probe/.test(String(error?.message || error))) throw error;
    } finally {
        if (session) await stopBrowserSession(session);
    }
    const cleaned = Boolean(profile) && !fs.existsSync(profile) && (!browser || !processGroupExists(browser));
    return { state: cleaned ? STATES.PASS : STATES.HARNESS_ERROR, failurePathCleanupVerified: cleaned };
}


function loadPerformanceLimits() {
    const raw = argValue('--limits', null);
    if (!raw) return null;
    const filePath = path.resolve(raw);
    const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('--limits must point to a JSON object.');
    return parsed;
}

function applyPerformanceLimits(sections, limits) {
    if (!limits) return [];
    const failures = [];
    const checks = [
        ['coldInitialisationP95Ms', sections.node?.coldInitialisationMs?.p95, 'node'],
        ['translationP95Ms', sections.node?.translationLatencyMs?.p95, 'node'],
        ['candidateDiscoveryP95Ms', sections.node?.candidateDiscoveryLatencyMs?.p95, 'node'],
        ['browserInputToOutputP95Ms', sections.browser?.inputToOutputLatencyMs?.p95, 'browser']
    ];
    for (const [name, actual, sectionName] of checks) {
        if (!Number.isFinite(actual) || !Number.isFinite(Number(limits[name]))) continue;
        const limit = Number(limits[name]);
        if (actual > limit) failures.push({ metric: name, actual, limit, section: sectionName });
    }
    if (Number.isFinite(Number(limits.memoryCumulativeGrowthBytes)) && Number.isFinite(sections.memory?.cumulativeGrowthBytes)) {
        const limit = Number(limits.memoryCumulativeGrowthBytes);
        if (sections.memory.cumulativeGrowthBytes > limit) failures.push({
            metric: 'memoryCumulativeGrowthBytes', actual: sections.memory.cumulativeGrowthBytes, limit, section: 'memory'
        });
    }
    for (const failure of failures) {
        const section = sections[failure.section];
        section.thresholdFailures = section.thresholdFailures || [];
        section.thresholdFailures.push(failure);
        if (failure.section === 'memory') section.state = STATES.MEMORY_INSTABILITY;
        else section.state = STATES.PERFORMANCE_FAILURE;
    }
    return failures;
}

function benchmarkState(sections) {
    const states = Object.values(sections).map(section => section?.state).filter(Boolean);
    if (states.includes(STATES.PERFORMANCE_FAILURE)) return STATES.PERFORMANCE_FAILURE;
    if (states.includes(STATES.MEMORY_INSTABILITY)) return STATES.MEMORY_INSTABILITY;
    if (states.includes(STATES.HARNESS_ERROR)) return STATES.HARNESS_ERROR;
    if (states.length && states.every(state => state === STATES.UNSUPPORTED || state === STATES.NOT_RUN)) return STATES.UNSUPPORTED;
    return STATES.PASS;
}

(async () => {
    if (hasFlag('--help')) {
        process.stdout.write([
            'Usage: node tools/qa/run-translator-performance-qa.js [root] [options]',
            '  --mode node|memory|browser|all   Benchmark selection (default all).',
            '  --warmup N                       Node warm-up iterations (default 24).',
            '  --iterations N                   Node measured iterations (default 120).',
            '  --cold-iterations N              Fresh initialisation samples (default 3).',
            '  --memory-warmup N                Memory warm-up iterations (default 60).',
            '  --memory-workload N              Translations per memory plateau (default 1000).',
            '  --memory-plateaux N              Post-GC workload plateaux (default 4).',
            '  --browser-warmup N               Browser UI warm-up iterations (default 12).',
            '  --browser-iterations N           Browser UI samples (default 60).',
            '  --limits PATH                    Optional JSON upper limits derived from repeated accepted-baseline runs.',
            '  --cleanup-self-test              Exercise Chromium failure-path cleanup.',
            '',
            'Result states: pass, performance-failure, memory-instability, harness-error, unsupported-environment, not-run.',
            'Harness/environment errors are never reported as translator regressions.',
            ''
        ].join('\n'));
        return;
    }

    const config = {
        warmupIterations: positiveIntArg('--warmup', 24),
        measureIterations: positiveIntArg('--iterations', 120),
        coldIterations: positiveIntArg('--cold-iterations', 3),
        memoryWarmupIterations: positiveIntArg('--memory-warmup', 60),
        memoryWorkloadIterations: positiveIntArg('--memory-workload', 1000),
        memoryPlateaux: positiveIntArg('--memory-plateaux', 4),
        browserWarmupIterations: positiveIntArg('--browser-warmup', 12),
        browserMeasureIterations: positiveIntArg('--browser-iterations', 60)
    };

    if (hasFlag('--memory-worker')) {
        const memory = await runMemoryWorker(config);
        process.stdout.write(`${JSON.stringify(roundMetrics(memory), null, 2)}\n`);
        process.exitCode = memory.state === STATES.PASS ? 0 : 3;
        return;
    }

    if (hasFlag('--cleanup-self-test')) {
        const cleanup = await runCleanupFailureSelfTest();
        process.stdout.write(`${JSON.stringify({ state: cleanup.state, environment: environment(), cleanup }, null, 2)}\n`);
        process.exitCode = cleanup.state === STATES.PASS || cleanup.state === STATES.UNSUPPORTED ? 0 : 3;
        return;
    }

    const mode = String(argValue('--mode', 'all'));
    if (!['node', 'memory', 'browser', 'all'].includes(mode)) throw new Error('--mode must be node, memory, browser, or all.');
    const sections = {
        node: mode === 'all' || mode === 'node' ? await measureNodeBenchmarks(config) : { state: STATES.NOT_RUN, mode: 'node' },
        memory: mode === 'all' || mode === 'memory' ? await measureMemory(config) : { state: STATES.NOT_RUN, mode: 'memory' },
        browser: mode === 'all' || mode === 'browser' ? await measureBrowser(config) : { state: STATES.NOT_RUN, mode: 'browser' }
    };
    const limits = loadPerformanceLimits();
    const thresholdFailures = applyPerformanceLimits(sections, limits);
    const state = benchmarkState(sections);
    const report = roundMetrics({
        schemaVersion: 1,
        state,
        environment: environment({ benchmarkMode: mode }),
        configuration: config,
        limitsApplied: limits,
        thresholdFailures,
        benchmarks: sections
    });
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
    if (state === STATES.PERFORMANCE_FAILURE || state === STATES.MEMORY_INSTABILITY) process.exitCode = 2;
    else if (state === STATES.HARNESS_ERROR) process.exitCode = 3;
    else process.exitCode = 0;
})().catch(error => {
    process.stdout.write(`${JSON.stringify({ schemaVersion: 1, state: STATES.HARNESS_ERROR, environment: environment(), diagnostic: String(error?.stack || error?.message || error) }, null, 2)}\n`);
    process.exitCode = 3;
});
