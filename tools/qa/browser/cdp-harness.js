const fs = require('fs');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');

function positiveInteger(value, fallback) {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback;
}

function freePort() {
    return new Promise((resolve, reject) => {
        const server = net.createServer();
        server.on('error', reject);
        server.listen(0, '127.0.0.1', () => {
            const port = server.address().port;
            server.close(() => resolve(port));
        });
    });
}

function waitForCdp(port, timeout = 15000) {
    return new Promise((resolve, reject) => {
        const started = Date.now();
        let settled = false;
        const finish = error => {
            if (settled) return;
            settled = true;
            if (error) reject(error);
            else resolve();
        };
        const poll = () => {
            if (settled) return;
            let handled = false;
            const retry = () => {
                if (handled || settled) return;
                handled = true;
                if (Date.now() - started >= timeout) finish(new Error('Chromium CDP did not become ready.'));
                else setTimeout(poll, 100);
            };
            const request = http.get({ host: '127.0.0.1', port, path: '/json/version' }, response => {
                response.resume();
                if (response.statusCode === 200) finish();
                else retry();
            });
            request.setTimeout(1000, () => {
                request.destroy();
                retry();
            });
            request.on('error', retry);
        };
        poll();
    });
}

function signalProcessGroup(child, signal) {
    if (!child?.pid) return;
    try {
        if (process.platform === 'win32') child.kill(signal);
        else process.kill(-child.pid, signal);
    } catch (error) {
        if (error.code !== 'ESRCH') throw error;
    }
}

function processGroupExists(child) {
    if (!child?.pid) return false;
    if (process.platform === 'win32') return child.exitCode === null;
    try {
        process.kill(-child.pid, 0);
        return true;
    } catch (error) {
        if (error.code === 'ESRCH') return false;
        throw error;
    }
}

async function waitForProcessGroupExit(child, timeout = 2000) {
    const deadline = Date.now() + timeout;
    while (processGroupExists(child) && Date.now() < deadline) {
        await new Promise(resolve => setTimeout(resolve, 50));
    }
    return !processGroupExists(child);
}

async function stopProcessGroup(child, killAfterMs = 2000) {
    if (!child?.pid) return;
    signalProcessGroup(child, 'SIGTERM');
    if (child.exitCode === null && child.signalCode === null) {
        await new Promise(resolve => {
            let settled = false;
            const finish = () => {
                if (settled) return;
                settled = true;
                clearTimeout(timer);
                resolve();
            };
            const timer = setTimeout(() => {
                signalProcessGroup(child, 'SIGKILL');
                finish();
            }, killAfterMs);
            child.once('exit', finish);
        });
    }
    if (processGroupExists(child)) signalProcessGroup(child, 'SIGKILL');
    await waitForProcessGroupExit(child, killAfterMs);
}

async function launchChromium(chromium, options = {}) {
    const port = await freePort();
    const profilePrefix = options.profilePrefix || 'translator-qa-';
    const profile = fs.mkdtempSync(path.join(os.tmpdir(), profilePrefix));
    const browser = spawn(chromium, [
        '--headless=new', '--no-sandbox', '--disable-gpu', '--disable-dev-shm-usage',
        `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`,
        ...(options.args || []), 'about:blank'
    ], {
        stdio: options.stdio || ['ignore', 'ignore', 'ignore'],
        detached: process.platform !== 'win32'
    });
    const session = { browser, profile, port };
    session.ready = waitForCdp(port, options.readyTimeout || 15000);
    return session;
}

async function stopBrowserSession(session) {
    if (!session) return;
    await stopProcessGroup(session.browser);
    try { fs.rmSync(session.profile, { recursive: true, force: true }); } catch (_) {}
}

function httpJson(method, requestPath, port, timeout = 10000) {
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, value) => {
            if (settled) return;
            settled = true;
            if (error) reject(error);
            else resolve(value);
        };
        const request = http.request({ host: '127.0.0.1', port, method, path: requestPath }, response => {
            let body = '';
            response.setEncoding('utf8');
            response.on('data', chunk => { body += chunk; });
            response.on('end', () => {
                try { finish(null, JSON.parse(body)); }
                catch (_) { finish(new Error(body || `Invalid JSON from ${requestPath}`)); }
            });
        });
        request.setTimeout(timeout, () => request.destroy(new Error(`timeout HTTP ${method} ${requestPath}`)));
        request.on('error', error => finish(error));
        request.end();
    });
}

function waitForSocketOpen(socket, timeout = 10000) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => {
            try { socket.close(); } catch (_) {}
            reject(new Error('timeout WebSocket open'));
        }, timeout);
        socket.addEventListener('open', () => {
            clearTimeout(timer);
            resolve();
        }, { once: true });
        socket.addEventListener('error', event => {
            clearTimeout(timer);
            reject(event.error || new Error('WebSocket connection failed.'));
        }, { once: true });
    });
}

function withTimeout(promise, timeout, label) {
    return new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(`${label} exceeded ${timeout} ms.`)), timeout);
        promise.then(
            value => { clearTimeout(timer); resolve(value); },
            error => { clearTimeout(timer); reject(error); }
        );
    });
}

async function createCdpSession(port, options = {}) {
    const requestTimeout = positiveInteger(options.requestTimeout, 10000);
    const commandTimeout = positiveInteger(options.commandTimeout, 15000);
    const target = await httpJson('PUT', '/json/new?about:blank', port, requestTimeout);
    const socket = new WebSocket(target.webSocketDebuggerUrl);
    let sequence = 0;
    const pending = new Map();
    const listeners = new Map();
    const on = (method, handler) => {
        if (!listeners.has(method)) listeners.set(method, new Set());
        listeners.get(method).add(handler);
        return () => listeners.get(method)?.delete(handler);
    };
    const rejectPending = reason => {
        for (const [id, request] of pending) {
            clearTimeout(request.timer);
            request.reject(new Error(`${reason}; pending command ${id}`));
        }
        pending.clear();
    };
    socket.addEventListener('message', event => {
        const message = JSON.parse(event.data);
        if (message.id && pending.has(message.id)) {
            const request = pending.get(message.id);
            pending.delete(message.id);
            clearTimeout(request.timer);
            if (message.error) request.reject(new Error(JSON.stringify(message.error)));
            else request.resolve(message.result);
            return;
        }
        for (const handler of listeners.get(message.method) || []) handler(message.params);
    });
    socket.addEventListener('close', () => rejectPending('CDP WebSocket closed'));
    const command = (method, params = {}) => new Promise((resolve, reject) => {
        const id = ++sequence;
        const timer = setTimeout(() => {
            if (!pending.has(id)) return;
            pending.delete(id);
            reject(new Error(`timeout ${method}`));
        }, commandTimeout);
        pending.set(id, { resolve, reject, timer });
        socket.send(JSON.stringify({ id, method, params }));
    });
    await waitForSocketOpen(socket, requestTimeout);
    return {
        socket,
        command,
        on,
        close() {
            rejectPending('CDP session closed');
            try { socket.close(); } catch (_) {}
        }
    };
}

function mime(filePath) {
    if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
    if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
    if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
    if (filePath.endsWith('.md')) return 'text/markdown; charset=utf-8';
    if (filePath.endsWith('.svg')) return 'image/svg+xml';
    if (filePath.endsWith('.gz')) return 'application/gzip';
    return 'application/octet-stream';
}

module.exports = {
    createCdpSession,
    freePort,
    httpJson,
    launchChromium,
    mime,
    positiveInteger,
    processGroupExists,
    signalProcessGroup,
    waitForProcessGroupExit,
    stopBrowserSession,
    stopProcessGroup,
    waitForCdp,
    waitForSocketOpen,
    withTimeout
};
