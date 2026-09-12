const fs = require('fs');
const http = require('http');
const path = require('path');
const crypto = require('crypto');
const { spawn } = require('child_process');
const { stopProcessGroup } = require('../browser/cdp-harness');

const host = '127.0.0.1';
const root = path.resolve(__dirname, '../../..');
const uiRoot = __dirname;
const requestedPort = process.argv.find(arg => arg.startsWith('--port='));
const parsedPort = Number(requestedPort?.slice('--port='.length));
const listenPort = Number.isInteger(parsedPort) && parsedPort > 0 && parsedPort <= 65535 ? parsedPort : 0;
const openBrowser = !process.argv.includes('--no-open');
const maxLogLines = 12000;
const sessionToken = crypto.randomBytes(24).toString('hex');
const focusedAreas = Object.freeze([
    ['romaji-core', 'Romaji rules', 'Kana conversion, Wāpuro spelling, apostrophes, punctuation and Rule 0 output.'],
    ['tokenisation-and-merging', 'Tokenisation and merging', 'Token boundaries, lexical spans, joining, splitting and output boundaries.'],
    ['tokenisation-mutation', 'Tokenisation mutation', 'Adversarial token-boundary variations and invariance checks.'],
    ['numbers-and-counters', 'Numbers and counters', 'Numeric groups, dates, counters and numeric pronunciation.'],
    ['names-and-loanwords', 'Names and loanwords', 'Proper names, source spellings, loanwords and scoped title evidence.'],
    ['grammar', 'Grammar', 'Particles, inflections, auxiliary forms and grammatical boundaries.'],
    ['ambiguity-and-audit', 'Ambiguity and audit', 'Uncertainty, unresolved input, evidence conflicts and review signalling.'],
    ['historical-kana', 'Historical kana', 'Historical spellings and modern-normalisation safeguards.'],
    ['runtime-and-api', 'Runtime and API', 'Loading, configuration, public API behaviour and runtime safeguards.']
]);

const jobDefinitions = Object.freeze({
    release: {
        label: 'Comprehensive release QA',
        description: 'Runs every release gate. Only this option can certify a release.',
        certification: true,
        group: 'Comprehensive scans',
        commands: buildFirst => [{
            label: 'Full release QA',
            command: process.execPath,
            args: [path.join(root, 'tools/qa/run-translator-release-qa.js'), ...(buildFirst ? ['--build'] : []), root],
            embeddedSteps: true
        }]
    },
    node: {
        label: 'Complete translation diagnostic',
        description: 'Runs canonical, generated and differential translation checks.',
        certification: false,
        group: 'Comprehensive scans',
        commands: () => [{ label: 'Node translation QA', command: process.execPath, args: [path.join(root, 'tools/qa/run-translator-node-qa.js'), root] }]
    },
    ...Object.fromEntries(focusedAreas.map(([area, label, description]) => [`focused-${area}`, {
        label,
        description,
        certification: false,
        group: 'Focused translator scans',
        commands: () => [{
            label,
            command: process.execPath,
            args: [path.join(root, 'tools/qa/run-translator-focused-qa.js'), root, `--area=${area}`]
        }]
    }])),
    punctuation: {
        label: 'Punctuation and boundaries',
        description: 'Runs the complete partitioned punctuation and boundary matrix.',
        certification: false,
        group: 'Technical checks',
        commands: () => [{ label: 'Punctuation and boundaries', command: process.execPath, args: [path.join(root, 'tools/qa/run-translator-punctuation-boundary-partitioned.js'), root] }]
    },
    generated: {
        label: 'Generated-file parity',
        description: 'Checks the engine, QA bundle and architectural diagram against their maintained sources.',
        certification: false,
        group: 'Technical checks',
        commands: () => [
            { label: 'Generated engine source', command: process.execPath, args: [path.join(root, 'tools/build-translator-engine.js'), '--check', root] },
            { label: 'Generated QA bundle source', command: process.execPath, args: [path.join(root, 'tools/qa/build-translator-qa.js'), '--check', root] },
            { label: 'Generated architectural flow', command: process.execPath, args: [path.join(root, 'tools/build-cj2r-flowchart.js'), '--check', root] }
        ]
    },
    typecheck: {
        label: 'Static type check',
        description: 'Runs the translator JSDoc and TypeScript checks.',
        certification: false,
        group: 'Technical checks',
        commands: () => [{ label: 'Static type check', command: process.execPath, args: [path.join(root, 'tools/qa/run-translator-typecheck.js'), root] }]
    },
    dependencies: {
        label: 'Source dependency check',
        description: 'Checks the translator source graph for circular dependencies.',
        certification: false,
        group: 'Technical checks',
        commands: () => [{ label: 'Source dependency check', command: process.execPath, args: [path.join(root, 'tools/qa/run-translator-dependency-check.js'), root] }]
    },
    provenance: {
        label: 'Evidence provenance hashes',
        description: 'Checks that tracked evidence hashes match the maintained data files.',
        certification: false,
        group: 'Technical checks',
        commands: () => [{ label: 'Evidence provenance hashes', command: process.execPath, args: [path.join(root, 'tools/qa/update-external-evidence-source-provenance-hashes.js'), '--check', root] }]
    }
});

const clients = new Set();
let currentChild = null;
let stopRequested = false;
let shuttingDown = false;
let runSequence = 0;
let state = emptyState();

function emptyState() {
    return {
        runId: null,
        jobId: null,
        label: null,
        description: null,
        certification: false,
        buildFirst: false,
        status: 'idle',
        startedAt: null,
        finishedAt: null,
        exitCode: null,
        steps: [],
        failures: [],
        log: []
    };
}

function publicJobs() {
    return Object.entries(jobDefinitions).map(([id, job]) => ({
        id,
        label: job.label,
        description: job.description,
        certification: job.certification,
        group: job.group
    }));
}

function snapshot(includeLog = true) {
    return { ...state, log: includeLog ? state.log : undefined };
}

function sendEvent(response, event, payload) {
    response.write(`event: ${event}\ndata: ${JSON.stringify(payload)}\n\n`);
}

function broadcast(event, payload) {
    for (const client of clients) sendEvent(client, event, payload);
}

function broadcastState() {
    broadcast('state', snapshot(false));
}

function stripAnsi(value) {
    return String(value).replace(/[\u001b\u009b][[\]()#;?]*(?:(?:(?:[a-zA-Z\d]*(?:;[-a-zA-Z\d\/#&.:=?%@~_]+)*)?\u0007)|(?:(?:\d{1,4}(?:;\d{0,4})*)?[\dA-PR-TZcf-nq-uy=><~]))/g, '');
}

function addLog(stream, text) {
    const clean = stripAnsi(text).replace(/\r$/, '');
    const entry = {
        sequence: state.log.length ? state.log[state.log.length - 1].sequence + 1 : 1,
        time: new Date().toISOString(),
        stream,
        stepId: state.steps.findLast(step => step.status === 'running')?.id || null,
        text: clean
    };
    state.log.push(entry);
    if (state.log.length > maxLogLines) state.log.splice(0, state.log.length - maxLogLines);
    broadcast('log', entry);
}

function completeRunningStep(status = 'passed') {
    const step = state.steps.findLast(item => item.status === 'running');
    if (!step) return;
    step.status = status;
    step.finishedAt = new Date().toISOString();
}

function beginStep(label) {
    completeRunningStep('passed');
    state.steps.push({
        id: state.steps.length + 1,
        label,
        status: 'running',
        startedAt: new Date().toISOString(),
        finishedAt: null
    });
    broadcastState();
}

function processLine(stream, line, embeddedSteps) {
    const clean = stripAnsi(line).replace(/\r$/, '');
    const stepMatch = embeddedSteps ? clean.match(/^===\s+(.+?)\s+===$/) : null;
    if (stepMatch) beginStep(stepMatch[1]);
    addLog(stream, clean);
}

function runCommand(commandDefinition) {
    if (!commandDefinition.embeddedSteps) beginStep(commandDefinition.label);
    else beginStep('Preparing release checks');
    return new Promise((resolve, reject) => {
        const child = spawn(commandDefinition.command, commandDefinition.args, {
            cwd: root,
            env: process.env,
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: process.platform !== 'win32'
        });
        currentChild = child;
        const buffers = { stdout: '', stderr: '' };
        const consume = stream => chunk => {
            buffers[stream] += chunk.toString('utf8');
            const lines = buffers[stream].split(/\n/);
            buffers[stream] = lines.pop();
            for (const line of lines) processLine(stream, line, commandDefinition.embeddedSteps);
        };
        child.stdout.on('data', consume('stdout'));
        child.stderr.on('data', consume('stderr'));
        child.once('error', reject);
        child.once('exit', (code, signal) => {
            for (const stream of ['stdout', 'stderr']) {
                if (buffers[stream]) processLine(stream, buffers[stream], commandDefinition.embeddedSteps);
            }
            currentChild = null;
            if (code === 0) resolve(0);
            else reject(new Error(`${commandDefinition.label} ended with ${signal ? `signal ${signal}` : `exit code ${code ?? 1}`}.`));
        });
    });
}

async function startRun(jobId, buildFirst) {
    const job = jobDefinitions[jobId];
    if (!job) throw new Error('Unknown QA selection.');
    if (state.status === 'running' || state.status === 'stopping') throw new Error('A QA run is already active.');
    stopRequested = false;
    state = {
        ...emptyState(),
        runId: ++runSequence,
        jobId,
        label: job.label,
        description: job.description,
        certification: job.certification,
        buildFirst: Boolean(buildFirst && jobId === 'release'),
        status: 'running',
        startedAt: new Date().toISOString()
    };
    broadcast('reset', snapshot());
    try {
        for (const command of job.commands(state.buildFirst)) {
            if (stopRequested) break;
            await runCommand(command);
        }
        if (stopRequested) {
            completeRunningStep('stopped');
            state.status = 'stopped';
            state.exitCode = 130;
        } else {
            completeRunningStep('passed');
            state.status = 'passed';
            state.exitCode = 0;
        }
    } catch (error) {
        if (stopRequested) {
            completeRunningStep('stopped');
            state.status = 'stopped';
            state.exitCode = 130;
        } else {
            completeRunningStep('failed');
            state.status = 'failed';
            state.exitCode = 1;
            const failureMessage = stripAnsi(error.message || String(error));
            state.failures.push(failureMessage);
            addLog('stderr', error.stack || failureMessage);
        }
    } finally {
        state.finishedAt = new Date().toISOString();
        broadcastState();
    }
}

async function stopRun() {
    if (!currentChild || state.status !== 'running') return false;
    stopRequested = true;
    state.status = 'stopping';
    broadcastState();
    await stopProcessGroup(currentChild);
    return true;
}

function json(response, statusCode, value) {
    response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(value));
}

function readJson(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
            if (body.length > 8192) request.destroy(new Error('Request body is too large.'));
        });
        request.on('end', () => {
            try { resolve(body ? JSON.parse(body) : {}); }
            catch (_) { reject(new Error('Invalid JSON request.')); }
        });
        request.on('error', reject);
    });
}

const assets = new Map([
    ['/', ['index.html', 'text/html; charset=utf-8']],
    ['/index.html', ['index.html', 'text/html; charset=utf-8']],
    ['/app.js', ['app.js', 'application/javascript; charset=utf-8']],
    ['/styles.css', ['styles.css', 'text/css; charset=utf-8']]
]);

function serveAsset(requestPath, response) {
    const asset = assets.get(requestPath);
    if (!asset) return false;
    const [file, contentType] = asset;
    response.writeHead(200, {
        'Content-Type': contentType,
        'Cache-Control': 'no-store',
        'Content-Security-Policy': "default-src 'self'; style-src 'self'; script-src 'self'; connect-src 'self'; img-src 'self' data:; base-uri 'none'; frame-ancestors 'none'",
        'X-Content-Type-Options': 'nosniff',
        'Referrer-Policy': 'no-referrer'
    });
    response.end(fs.readFileSync(path.join(uiRoot, file)));
    return true;
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${host}/`);
    try {
        if (request.method === 'GET' && serveAsset(url.pathname, response)) return;
        if (request.method === 'GET' && url.pathname === '/api/jobs') return json(response, 200, publicJobs());
        if (request.method === 'GET' && url.pathname === '/api/state') return json(response, 200, snapshot());
        if (request.method === 'GET' && url.pathname === '/api/session') return json(response, 200, { token: sessionToken });
        if (request.method === 'GET' && url.pathname === '/api/events') {
            response.writeHead(200, {
                'Content-Type': 'text/event-stream; charset=utf-8',
                'Cache-Control': 'no-store',
                Connection: 'keep-alive'
            });
            clients.add(response);
            sendEvent(response, 'state', snapshot());
            request.on('close', () => clients.delete(response));
            return;
        }
        if (request.method === 'POST' && url.pathname === '/api/run') {
            if (request.headers['x-cj2r-qa-token'] !== sessionToken) return json(response, 403, { error: 'Invalid local dashboard session.' });
            const body = await readJson(request);
            if (!jobDefinitions[body.jobId]) return json(response, 400, { error: 'Choose a valid QA run.' });
            if (state.status === 'running' || state.status === 'stopping') return json(response, 409, { error: 'A QA run is already active.' });
            void startRun(body.jobId, Boolean(body.buildFirst));
            return json(response, 202, { accepted: true });
        }
        if (request.method === 'POST' && url.pathname === '/api/stop') {
            if (request.headers['x-cj2r-qa-token'] !== sessionToken) return json(response, 403, { error: 'Invalid local dashboard session.' });
            const stopped = await stopRun();
            return json(response, stopped ? 202 : 409, stopped ? { accepted: true } : { error: 'No QA run is active.' });
        }
        if (request.method === 'POST' && url.pathname === '/api/shutdown') {
            if (request.headers['x-cj2r-qa-token'] !== sessionToken) return json(response, 403, { error: 'Invalid local dashboard session.' });
            json(response, 202, { accepted: true });
            setTimeout(() => { void shutdown(); }, 100);
            return;
        }
        json(response, 404, { error: 'Not found.' });
    } catch (error) {
        json(response, 500, { error: error.message || String(error) });
    }
});

function launchDashboard(url) {
    const command = process.platform === 'win32' ? 'cmd' : process.platform === 'darwin' ? 'open' : 'xdg-open';
    const args = process.platform === 'win32' ? ['/c', 'start', '', url] : [url];
    const opener = spawn(command, args, { stdio: 'ignore', detached: true });
    opener.on('error', () => {});
    opener.unref();
}

async function shutdown() {
    if (shuttingDown) return;
    shuttingDown = true;
    stopRequested = true;
    if (currentChild) await stopProcessGroup(currentChild);
    for (const client of clients) client.end();
    server.close(() => process.exit(0));
}

process.on('SIGINT', () => { void shutdown(); });
process.on('SIGTERM', () => { void shutdown(); });

server.on('error', error => {
    console.error(`Unable to start the QA dashboard: ${error.message || error}`);
    process.exitCode = 1;
});

server.listen(listenPort, host, () => {
    const address = server.address();
    const activePort = typeof address === 'object' && address ? address.port : listenPort;
    const url = `http://${host}:${activePort}/`;
    console.log(`CJ2R QA dashboard: ${url}`);
    console.log('Press Ctrl+C to close it.');
    if (openBrowser) launchDashboard(url);
});
