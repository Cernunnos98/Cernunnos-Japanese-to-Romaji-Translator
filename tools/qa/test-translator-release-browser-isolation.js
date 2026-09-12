const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const vm = require('vm');

const releasePath = path.join(__dirname, 'run-translator-release-qa.js');
const failurePath = path.join(__dirname, 'run-translator-failure-injection-cdp.js');
const partitionedFailurePath = path.join(__dirname, 'run-translator-failure-injection-partitioned.js');
const smokePath = path.join(__dirname, 'run-translator-browser-smoke-cdp.js');
const harnessPath = path.join(__dirname, 'browser/cdp-harness.js');
const failureHtmlPath = path.join(__dirname, 'browser/translator-failure-injection.html');
const releaseSource = fs.readFileSync(releasePath, 'utf8');
const failureSource = fs.readFileSync(failurePath, 'utf8');
const partitionedFailureSource = fs.readFileSync(partitionedFailurePath, 'utf8');
const smokeSource = fs.readFileSync(smokePath, 'utf8');
const harnessSource = fs.readFileSync(harnessPath, 'utf8');
const failureHtmlSource = fs.readFileSync(failureHtmlPath, 'utf8');
const browserMarker = 'await withBrowser(async port => {';
const smokeStart = releaseSource.indexOf(browserMarker);
const smokeEnd = releaseSource.indexOf("await run('Partitioned failure injection'", smokeStart);

assert(smokeStart >= 0, 'Browser smoke session was not found.');
assert(smokeEnd > smokeStart, 'Failure injection must run after browser smoke.');

const smokeSession = releaseSource.slice(smokeStart, smokeEnd);
assert(smokeSession.includes("await run('Developer browser smoke'"), 'Developer smoke is missing from the smoke session.');
assert(smokeSession.includes("await run('Production browser smoke'"), 'Production smoke is missing from the smoke session.');
assert(smokeSession.includes("await run('Cross-origin browser smoke'"), 'Cross-origin smoke is missing from the smoke session.');
assert(!smokeSession.includes("run('Partitioned failure injection'"), 'Failure injection must not reuse the smoke browser session.');
assert(releaseSource.includes("await run('Partitioned failure injection', process.execPath, [path.join(__dirname, 'run-translator-failure-injection-partitioned.js'), root]"), 'Release QA must use the partitioned failure-injection orchestrator.');
assert(partitionedFailureSource.includes("run-translator-failure-injection-cdp.js"), 'Partitioned failure injection must delegate scenario execution to the isolated CDP runner.');
assert(partitionedFailureSource.includes('TRANSLATOR_FAILURE_PARTITIONS'), 'Partitioned failure injection must expose a bounded partition count.');
assert(partitionedFailureSource.includes('missingIds') && partitionedFailureSource.includes('duplicateIds') && partitionedFailureSource.includes('unexpectedIds'), 'Partitioned failure injection must verify exact scenario coverage before passing.');

assert(failureSource.includes('const batchSize = positiveInteger(process.env.TRANSLATOR_FAILURE_BATCH_SIZE, 2);'), 'Failure injection must default to isolated asset-pair batches while allowing controlled recovery batches.');
assert(failureSource.includes('runWithConcurrency(batch, 1, scenario =>'), 'Failure scenarios within an asset pair must run serially.');
assert(failureSource.includes("await command('Network.setCacheDisabled', { cacheDisabled: true });"), 'Failure-injection targets must disable browser caching.');
assert(failureSource.includes('const batchResults = await withBrowser('), 'Each failure-injection asset pair must receive a fresh Chromium profile.');
assert(failureHtmlSource.includes('assetTimeoutMs: scenario.assetTimeoutMs || 5000'), 'Failure injection must leave normal asset loading enough headroom to isolate the intended failure.');
assert(failureHtmlSource.includes('scriptTimeoutMs: scenario.scriptTimeoutMs || 5000'), 'Failure injection must leave normal script loading enough headroom to isolate the intended failure.');

assert(!releaseSource.includes('spawnSync'), 'Release QA must retain child handles so interrupted runs can clean them up.');
assert(releaseSource.includes("process.on('SIGTERM'"), 'Release QA must clean child processes on SIGTERM.');
assert(releaseSource.includes('TRANSLATOR_RELEASE_QA_TIMEOUT_MS'), 'Release QA must have an internal suite deadline.');
assert(failureSource.includes("process.on('SIGTERM'"), 'Failure injection must clean Chromium on SIGTERM.');
assert(failureSource.includes('TRANSLATOR_FAILURE_INJECTION_TIMEOUT_MS'), 'Failure injection must have an internal suite deadline.');
assert(releaseSource.includes("require('./browser/cdp-harness')"), 'Release QA must use the shared browser harness.');
assert(failureSource.includes("require('./browser/cdp-harness')"), 'Failure injection must use the shared browser harness.');
assert(smokeSource.includes("require('./browser/cdp-harness')"), 'Browser smoke must use the shared CDP harness.');
assert(!failureSource.includes('function freePort('), 'Failure injection must not carry a private free-port implementation.');
assert(!failureSource.includes('function waitForCdp('), 'Failure injection must not carry a private CDP readiness implementation.');
assert(harnessSource.includes("detached: process.platform !== 'win32'"), 'Shared Chromium launches must use process groups on POSIX.');
assert(harnessSource.includes('request.setTimeout(timeout'), 'Shared CDP HTTP requests must have a deadline.');
assert(harnessSource.includes("new Error('timeout WebSocket open')"), 'Shared WebSocket opening must have a deadline.');
assert(harnessSource.includes('stopProcessGroup'), 'Shared harness must own process-group cleanup.');
assert(!smokeSource.includes('runtimeDiagnostics:true'), 'Production smoke must not enable runtime diagnostics.');
assert(!smokeSource.includes("replace('const ENABLE_RUNTIME_DIAGNOSTICS"), 'Production smoke must not rewrite engine source text.');
assert(smokeSource.includes("mode === 'cross-origin'"), 'Browser smoke must exercise the cross-origin package layout.');


function createBootstrapRecoveryContext(config) {
    class Element {}
    const document = {
        baseURI: 'https://example.test/tool/',
        currentScript: { src: 'https://example.test/tool/translator-engine.js', nonce: '', getAttribute: () => null },
        documentElement: null,
        getElementById: () => null,
        querySelector: () => null,
        addEventListener() {},
        removeEventListener() {}
    };
    const window = { CJ2R_TRANSLATOR_CONFIG: config };
    const quietConsole = { log() {}, warn() {}, error() {} };
    const context = {
        window, document, URL, console: quietConsole, AbortController,
        fetch: async () => { throw new Error('offline test fixture'); },
        setTimeout, clearTimeout, Element, MutationObserver: undefined,
        WeakMap, Set, Map, Object, Array, String, Number, Boolean, RegExp, Promise, Error, Symbol
    };
    vm.createContext(context);
    return context;
}

function verifyBootstrapLockRecovery() {
    const root = path.resolve(__dirname, '../..');
    const engineSource = fs.readFileSync(path.join(root, 'translator-engine.js'), 'utf8');
    const instanceSymbol = Symbol.for('CJ2R.translator.engine.instance');
    const context = createBootstrapRecoveryContext({ assetBaseUrl: 'http://[' });
    assert.throws(() => vm.runInContext(engineSource, context), /Invalid URL/, 'Malformed assetBaseUrl must fail synchronously.');
    assert.strictEqual(Boolean(context.window[instanceSymbol]), false, 'Synchronous bootstrap failure must release the engine-instance lock.');
    assert.strictEqual(Boolean(context.window.RomajiTranslator), false, 'A failed bootstrap must not publish a partial public API.');
    context.window.CJ2R_TRANSLATOR_CONFIG = { assetBaseUrl: 'https://example.test/tool/' };
    assert.doesNotThrow(() => vm.runInContext(engineSource, context), 'The same page must be able to load the engine again after synchronous bootstrap failure.');
    assert.strictEqual(Boolean(context.window.RomajiTranslator), true, 'A valid retry must publish RomajiTranslator.');
    context.window.RomajiTranslator.ready.catch(() => {});
}

verifyBootstrapLockRecovery();

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitFor(predicate, timeout, message) {
    const started = Date.now();
    while (Date.now() - started < timeout) {
        if (predicate()) return;
        await delay(50);
    }
    throw new Error(message);
}

function processIsRunning(pid) {
    try {
        process.kill(pid, 0);
        if (process.platform !== 'win32') {
            const statPath = `/proc/${pid}/stat`;
            if (fs.existsSync(statPath)) {
                const state = fs.readFileSync(statPath, 'utf8').split(' ')[2];
                if (state === 'Z') return false;
            }
        }
        return true;
    } catch (error) {
        if (error.code === 'ESRCH') return false;
        throw error;
    }
}

async function verifyInterruptedFailureInjectionCleanup() {
    if (process.platform === 'win32') return;

    const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'translator-cleanup-test-'));
    const fakeChromium = path.join(temp, 'fake-chromium');
    const marker = path.join(temp, 'pids.json');
    const profilesBefore = new Set(fs.readdirSync(os.tmpdir()).filter(name => name.startsWith('translator-failure-injection-')));
    fs.writeFileSync(fakeChromium, `#!/usr/bin/env node\nconst fs=require('fs');const {spawn}=require('child_process');const marker=process.env.TRANSLATOR_QA_FAKE_BROWSER_MARKER;const child=spawn(process.execPath,['-e','setInterval(()=>{},1000)'],{stdio:'ignore'});fs.writeFileSync(marker,JSON.stringify({browser:process.pid,child:child.pid}));setInterval(()=>{},1000);\n`);
    fs.chmodSync(fakeChromium, 0o755);

    const root = path.resolve(__dirname, '../..');
    const runner = spawn(process.execPath, [failurePath, root], {
        cwd: root,
        stdio: ['ignore', 'ignore', 'ignore'],
        env: {
            ...process.env,
            CHROMIUM: fakeChromium,
            TRANSLATOR_QA_FAKE_BROWSER_MARKER: marker,
            TRANSLATOR_FAILURE_INJECTION_TIMEOUT_MS: '60000'
        }
    });

    let recorded = null;
    try {
        await waitFor(() => fs.existsSync(marker), 5000, 'Fake Chromium was not launched.');
        recorded = JSON.parse(fs.readFileSync(marker, 'utf8'));
        runner.kill('SIGTERM');
        await waitFor(() => runner.exitCode !== null || runner.signalCode !== null, 5000, 'Failure-injection runner did not exit after SIGTERM.');
        await waitFor(
            () => !processIsRunning(recorded.browser) && !processIsRunning(recorded.child),
            5000,
            'Interrupted failure injection left Chromium descendants running.'
        );
        await waitFor(() => {
            const current = fs.readdirSync(os.tmpdir()).filter(name => name.startsWith('translator-failure-injection-'));
            return current.every(name => profilesBefore.has(name));
        }, 5000, 'Interrupted failure injection left a Chromium profile behind.');
    } finally {
        if (runner.exitCode === null && runner.signalCode === null) runner.kill('SIGKILL');
        if (recorded) {
            for (const pid of [recorded.browser, recorded.child]) {
                try { process.kill(pid, 'SIGKILL'); } catch (_) {}
            }
        }
        fs.rmSync(temp, { recursive: true, force: true });
    }
}

verifyInterruptedFailureInjectionCleanup()
    .then(() => console.log('Release browser isolation tests passed.'))
    .catch(error => {
        console.error(error.stack || error);
        process.exit(1);
    });
