const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const {
    launchChromium,
    positiveInteger,
    processGroupExists,
    signalProcessGroup,
    stopBrowserSession,
    stopProcessGroup
} = require('./browser/cdp-harness');

const cliArgs = process.argv.slice(2);
const buildFirst = cliArgs.includes('--build');
const rootArg = cliArgs.find(arg => arg !== '--build');
const root = path.resolve(rootArg || path.join(__dirname, '../..'));
const chromium = process.env.CHROMIUM || ['/usr/bin/chromium', '/usr/bin/chromium-browser', '/usr/bin/google-chrome'].find(fs.existsSync);
if (!chromium) throw new Error('Chromium was not found. Set CHROMIUM to its executable path.');

const stepTimeout = positiveInteger(process.env.TRANSLATOR_RELEASE_STEP_TIMEOUT_MS, 300000);
const releaseTimeout = positiveInteger(process.env.TRANSLATOR_RELEASE_QA_TIMEOUT_MS, 1800000);
const activeChildren = new Set();
const activeBrowsers = new Set();
let shuttingDown = false;

async function stopChild(child) {
    await stopProcessGroup(child);
    activeChildren.delete(child);
}

async function stopBrowser(session) {
    await stopBrowserSession(session);
    activeBrowsers.delete(session);
}

async function shutdown(reason, exitCode) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`\n${reason}`);
    await Promise.allSettled([
        ...Array.from(activeChildren, child => stopChild(child)),
        ...Array.from(activeBrowsers, session => stopBrowser(session))
    ]);
    process.exit(exitCode);
}

process.on('SIGINT', () => { void shutdown('Release QA interrupted; cleaning child processes.', 130); });
process.on('SIGTERM', () => { void shutdown('Release QA terminated; cleaning child processes.', 143); });
process.on('exit', () => {
    for (const child of activeChildren) {
        try { signalProcessGroup(child, 'SIGKILL'); } catch (_) {}
    }
    for (const session of activeBrowsers) {
        try { signalProcessGroup(session.browser, 'SIGKILL'); } catch (_) {}
        try { fs.rmSync(session.profile, { recursive: true, force: true }); } catch (_) {}
    }
});



async function resolvePython3() {
    const configured = process.env.CJ2R_PYTHON || process.env.PYTHON;
    const candidates = configured
        ? [[configured, []]]
        : process.platform === 'win32'
            ? [['python', []], ['py', ['-3']], ['python3', []]]
            : [['python3', []], ['python', []]];
    for (const [command, prefix] of candidates) {
        const available = await new Promise(resolve => {
            const child = spawn(command, [...prefix, '-c', 'import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)'], {
                cwd: root,
                stdio: 'ignore',
                detached: process.platform !== 'win32'
            });
            activeChildren.add(child);
            child.once('error', () => {
                activeChildren.delete(child);
                resolve(false);
            });
            child.once('exit', code => {
                activeChildren.delete(child);
                resolve(code === 0);
            });
        });
        if (available) return { command, prefix };
    }
    throw new Error('Python 3 was not found. Install Python 3 or set CJ2R_PYTHON to its executable.');
}

function run(label, command, args, timeout = stepTimeout) {
    process.stdout.write(`\n=== ${label} ===\n`);
    return new Promise((resolve, reject) => {
        const child = spawn(command, args, {
            cwd: root,
            stdio: 'inherit',
            detached: process.platform !== 'win32'
        });
        activeChildren.add(child);
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            signalProcessGroup(child, 'SIGTERM');
            setTimeout(() => {
                if (processGroupExists(child)) signalProcessGroup(child, 'SIGKILL');
            }, 2000).unref();
        }, timeout);
        child.once('error', error => {
            clearTimeout(timer);
            activeChildren.delete(child);
            reject(error);
        });
        child.once('exit', (code, signal) => {
            clearTimeout(timer);
            activeChildren.delete(child);
            if (timedOut) {
                reject(new Error(`${label} exceeded ${timeout} ms and was terminated.`));
                return;
            }
            if (code !== 0) {
                reject(new Error(`${label} failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
                return;
            }
            resolve();
        });
    });
}

async function withBrowser(task) {
    const session = await launchChromium(chromium, { profilePrefix: 'translator-qa-' });
    activeBrowsers.add(session);
    try {
        await session.ready;
        return await task(session.port);
    } finally {
        await stopBrowser(session);
    }
}

const releaseWatchdog = setTimeout(() => {
    void shutdown(`Release QA exceeded ${releaseTimeout} ms; cleaning child processes.`, 1);
}, releaseTimeout);
releaseWatchdog.unref();

(async () => {
    const buildScript = path.join(root, 'tools', 'build-translator-engine.js');
    const qaBuildScript = path.join(__dirname, 'build-translator-qa.js');
    const flowBuildScript = path.join(root, 'tools', 'build-cj2r-flowchart.js');
    if (buildFirst) {
        await run('Build translator engine', process.execPath, [buildScript, root]);
        await run('Build translator QA bundle', process.execPath, [qaBuildScript, root]);
        await run('Build architectural flow SVG', process.execPath, [flowBuildScript, root]);
    }
    await run('Generated engine source check', process.execPath, [buildScript, '--check', root]);
    await run('Generated QA bundle source check', process.execPath, [qaBuildScript, '--check', root]);
    await run('Generated architectural flow check', process.execPath, [flowBuildScript, '--check', root]);
    const python = await resolvePython3();
    await run('Structural integrity', python.command, [...python.prefix, path.join(__dirname, 'run-translator-structural-integrity.py'), root]);
    await run('Translator JSDoc/static type check', process.execPath, [path.join(__dirname, 'run-translator-typecheck.js'), root]);
    await run('Translator source dependency check', process.execPath, [path.join(__dirname, 'run-translator-dependency-check.js'), root]);

    await run('Release browser isolation tests', process.execPath, [path.join(__dirname, 'test-translator-release-browser-isolation.js')]);
    await run('Semantic data safety tests', process.execPath, [path.join(__dirname, 'test-translator-semantic-data-safety.js'), root]);
    await run('Loanword source-scope audit tests', process.execPath, [path.join(__dirname, 'test-loanword-source-scope-audit.js'), root]);
    await run('External evidence provenance updater tests', process.execPath, [path.join(__dirname, 'test-update-external-evidence-source-provenance-hashes.js')]);
    await run('External evidence provenance hash check', process.execPath, [path.join(__dirname, 'update-external-evidence-source-provenance-hashes.js'), '--check', root]);
    await run(
        'Release-gate mutation detection',
        process.execPath,
        [path.join(__dirname, 'run-translator-release-gate-mutations-partitioned.js'), root],
        positiveInteger(process.env.TRANSLATOR_RELEASE_GATE_MUTATION_TOTAL_TIMEOUT_MS, 600000)
    );
    await run('Yomitan evidence candidate generator tests', process.execPath, [path.join(root, 'tools/evidence-candidate-generation/test-generate-yomitan-evidence-review-candidates.js')]);
    await run('CJ2R EDRDG updater tests', process.execPath, [path.join(root, 'tools/edrdg-update/test-cj2r-edrdg-updater.js')]);
    await run('Node canonical/generated/differential QA', process.execPath, [path.join(__dirname, 'run-translator-node-qa.js'), root]);
    await run(
        'Partitioned punctuation boundary QA',
        process.execPath,
        [path.join(__dirname, 'run-translator-punctuation-boundary-partitioned.js'), root],
        positiveInteger(process.env.TRANSLATOR_RELEASE_PUNCTUATION_TIMEOUT_MS, 180000)
    );

    await withBrowser(async port => {
        await run('Developer browser smoke', process.execPath, [path.join(__dirname, 'run-translator-browser-smoke-cdp.js'), root, String(port), 'dev']);
        await run('Production browser smoke', process.execPath, [path.join(__dirname, 'run-translator-browser-smoke-cdp.js'), root, String(port), 'production']);
        await run('Cross-origin browser smoke', process.execPath, [path.join(__dirname, 'run-translator-browser-smoke-cdp.js'), root, String(port), 'cross-origin']);
    });

    await run('Partitioned failure injection', process.execPath, [path.join(__dirname, 'run-translator-failure-injection-partitioned.js'), root], positiveInteger(process.env.TRANSLATOR_RELEASE_FAILURE_TIMEOUT_MS, 900000));
    clearTimeout(releaseWatchdog);
    console.log('\nRelease QA passed.');
})().catch(error => {
    clearTimeout(releaseWatchdog);
    console.error(error.stack || error);
    void shutdown('Release QA failed; cleaning child processes.', 1);
});
