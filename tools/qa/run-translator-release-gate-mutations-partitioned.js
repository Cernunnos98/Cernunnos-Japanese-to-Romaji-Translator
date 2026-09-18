#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { positiveInteger, processGroupExists, signalProcessGroup, stopProcessGroup } = require('./browser/cdp-harness');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const runner = path.join(__dirname, 'test-translator-release-gate-mutations.js');
const partitionCount = positiveInteger(process.env.TRANSLATOR_RELEASE_GATE_MUTATION_PARTITIONS, 5);
const concurrency = positiveInteger(process.env.TRANSLATOR_RELEASE_GATE_MUTATION_CONCURRENCY, 2);
const partitionTimeout = positiveInteger(process.env.TRANSLATOR_RELEASE_GATE_MUTATION_TIMEOUT_MS, 240000);
const active = new Set();
const temporaryRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-release-gate-mutation-partitions-'));
let stopping = false;
let tempCleaned = false;

function cleanupTemporaryRoot() {
    if (tempCleaned) return;
    tempCleaned = true;
    try { fs.rmSync(temporaryRoot, { recursive: true, force: true }); } catch (_) {}
}

function runPartition(index) {
    return new Promise((resolve, reject) => {
        const child = spawn(process.execPath, [runner, root, `--partition=${index}/${partitionCount}`], {
            cwd: root,
            env: { ...process.env, CJ2R_RELEASE_GATE_MUTATION_TEMP_ROOT: temporaryRoot },
            stdio: ['ignore', 'pipe', 'pipe'],
            detached: process.platform !== 'win32'
        });
        active.add(child);
        let stdout = '';
        let stderr = '';
        child.stdout.on('data', chunk => { stdout += chunk; });
        child.stderr.on('data', chunk => { stderr += chunk; });
        let timedOut = false;
        const timer = setTimeout(() => {
            timedOut = true;
            signalProcessGroup(child, 'SIGTERM');
            setTimeout(() => {
                if (processGroupExists(child)) signalProcessGroup(child, 'SIGKILL');
            }, 2000).unref();
        }, partitionTimeout);
        child.once('error', error => {
            clearTimeout(timer);
            active.delete(child);
            reject(error);
        });
        child.once('exit', code => {
            clearTimeout(timer);
            active.delete(child);
            if (stdout) process.stdout.write(stdout);
            if (stderr) process.stderr.write(stderr);
            if (timedOut) return reject(new Error(`Release-gate mutation partition ${index + 1}/${partitionCount} exceeded ${partitionTimeout} ms.`));
            if (code !== 0) return reject(new Error(`Release-gate mutation partition ${index + 1}/${partitionCount} failed with exit code ${code}.`));
            resolve();
        });
    });
}

async function runPool(indexes, limit) {
    let next = 0;
    async function worker() {
        while (true) {
            const position = next++;
            if (position >= indexes.length) return;
            const index = indexes[position];
            console.log(`Starting release-gate mutation partition ${index + 1}/${partitionCount}`);
            await runPartition(index);
            console.log(`Finished release-gate mutation partition ${index + 1}/${partitionCount}`);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, indexes.length) }, worker));
}

async function stopChildren() {
    if (stopping) return;
    stopping = true;
    await Promise.allSettled(Array.from(active, child => stopProcessGroup(child)));
    active.clear();
    cleanupTemporaryRoot();
}

process.on('SIGINT', () => { void stopChildren().finally(() => process.exit(130)); });
process.on('SIGTERM', () => { void stopChildren().finally(() => process.exit(143)); });
process.on('exit', () => {
    for (const child of active) {
        try { signalProcessGroup(child, 'SIGKILL'); } catch (_) {}
    }
    cleanupTemporaryRoot();
});

(async () => {
    const indexes = Array.from({ length: partitionCount }, (_, index) => index);
    await runPool(indexes, concurrency);
    cleanupTemporaryRoot();
    console.log(`Release-gate mutation detection passed across ${partitionCount} partitions.`);
})().catch(error => {
    console.error(error.stack || error);
    void stopChildren().finally(() => process.exit(1));
});
