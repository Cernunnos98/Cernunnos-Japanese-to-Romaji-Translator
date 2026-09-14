const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn } = require('child_process');
const { positiveInteger, signalProcessGroup, processGroupExists, stopProcessGroup } = require('./browser/cdp-harness');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const runner = path.join(__dirname, 'run-translator-failure-injection-cdp.js');
const requestedPartitions = positiveInteger(process.env.TRANSLATOR_FAILURE_PARTITIONS, 18);
const concurrency = positiveInteger(process.env.TRANSLATOR_FAILURE_PARTITION_CONCURRENCY, 2);
const partitionTimeout = positiveInteger(process.env.TRANSLATOR_FAILURE_PARTITION_TIMEOUT_MS, 300000);
const activeChildren = new Set();
const temporaryDirectories = new Set();
let shuttingDown = false;

function removeTemporaryDirectories() {
    for (const directory of temporaryDirectories) {
        try { fs.rmSync(directory, { recursive: true, force: true }); } catch (_) {}
        temporaryDirectories.delete(directory);
    }
}

function runChild(args, env, options = {}) {
    return new Promise((resolve, reject) => {
        const capture = Boolean(options.capture);
        const child = spawn(process.execPath, args, {
            cwd: root,
            env: { ...process.env, ...env },
            stdio: capture ? ['ignore', 'pipe', 'inherit'] : ['ignore', 'ignore', 'inherit'],
            detached: process.platform !== 'win32'
        });
        activeChildren.add(child);
        let stdout = '';
        if (capture) child.stdout.on('data', chunk => { stdout += chunk; });
        let timedOut = false;
        const timeout = options.timeout || partitionTimeout;
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
            if (timedOut) return reject(new Error(`Failure-injection partition exceeded ${timeout} ms.`));
            if (code !== 0) return reject(new Error(`Failure-injection child failed with ${signal ? `signal ${signal}` : `exit code ${code}`}.`));
            resolve(stdout);
        });
    });
}

async function shutdown(reason, exitCode) {
    if (shuttingDown) return;
    shuttingDown = true;
    console.error(`\n${reason}`);
    await Promise.allSettled(Array.from(activeChildren, child => stopProcessGroup(child)));
    activeChildren.clear();
    removeTemporaryDirectories();
    process.exit(exitCode);
}

process.on('SIGINT', () => { void shutdown('Partitioned failure injection interrupted; cleaning child processes.', 130); });
process.on('SIGTERM', () => { void shutdown('Partitioned failure injection terminated; cleaning child processes.', 143); });
process.on('exit', () => {
    for (const child of activeChildren) {
        try { signalProcessGroup(child, 'SIGKILL'); } catch (_) {}
    }
    removeTemporaryDirectories();
});

async function runPool(items, limit, worker) {
    const output = new Array(items.length);
    let next = 0;
    async function consume() {
        while (true) {
            const index = next++;
            if (index >= items.length) return;
            output[index] = await worker(items[index]);
        }
    }
    await Promise.all(Array.from({ length: Math.min(limit, items.length) }, consume));
    return output;
}

(async () => {
    const listText = await runChild([runner, root], { TRANSLATOR_FAILURE_LIST_ONLY: '1' }, { capture: true, timeout: 30000 });
    const list = JSON.parse(listText);
    const expectedIds = Array.isArray(list.scenarios) ? list.scenarios : [];
    if (!expectedIds.length) throw new Error('Failure-injection scenario listing returned no scenarios.');
    const partitionCount = Math.min(requestedPartitions, expectedIds.length);
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'cj2r-failure-partitions-'));
    temporaryDirectories.add(tempDir);
    try {
        const indexes = Array.from({ length: partitionCount }, (_, index) => index);
        const reports = await runPool(indexes, concurrency, async index => {
            const reportPath = path.join(tempDir, `partition-${String(index).padStart(2, '0')}.json`);
            console.error(`Starting failure-injection partition ${index + 1}/${partitionCount}`);
            try {
                await runChild([runner, root], {
                    TRANSLATOR_FAILURE_PARTITION_COUNT: String(partitionCount),
                    TRANSLATOR_FAILURE_PARTITION_INDEX: String(index),
                    TRANSLATOR_FAILURE_REPORT_PATH: reportPath
                });
            } catch (error) {
                let failureDetail = '';
                if (fs.existsSync(reportPath)) {
                    try {
                        const failedReport = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
                        const failedScenarios = (failedReport.results || [])
                            .filter(result => result && result.ok === false)
                            .map(result => result.id || result.scenario)
                            .filter(Boolean);
                        if (failedScenarios.length) failureDetail = ` Failed scenario(s): ${failedScenarios.join(', ')}.`;
                    } catch (_) {}
                }
                throw new Error(`Failure-injection partition ${index + 1}/${partitionCount}: ${error.message}.${failureDetail}`);
            }
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            if (!report.ok) throw new Error(`Failure-injection partition ${index + 1}/${partitionCount} reported failure.`);
            console.error(`Finished failure-injection partition ${index + 1}/${partitionCount} (${report.results.length} scenarios)`);
            return report;
        });
        const results = reports.flatMap(report => report.results || []);
        const actualIds = results.map(item => item && (item.id || item.scenario)).filter(Boolean);
        const duplicateIds = actualIds.filter((id, index) => actualIds.indexOf(id) !== index);
        const missingIds = expectedIds.filter(id => !actualIds.includes(id));
        const unexpectedIds = actualIds.filter(id => !expectedIds.includes(id));
        const ok = reports.every(report => report.ok)
            && results.every(result => result && result.ok)
            && !duplicateIds.length && !missingIds.length && !unexpectedIds.length
            && actualIds.length === expectedIds.length;
        const merged = {
            ok,
            coverage: {
                declaredScenarios: list.declaredScenarios,
                scenarios: expectedIds.length,
                partitions: partitionCount,
                partitionConcurrency: Math.min(concurrency, partitionCount),
                duplicateIds: [...new Set(duplicateIds)],
                missingIds,
                unexpectedIds
            },
            partitions: reports.map(report => ({
                index: report.coverage.partitionIndex,
                count: report.coverage.partitionCount,
                scenarios: report.coverage.scenarios,
                ok: report.ok
            })),
            results
        };
        console.log(JSON.stringify(merged, null, 2));
        process.exitCode = ok ? 0 : 2;
    } finally {
        fs.rmSync(tempDir, { recursive: true, force: true });
        temporaryDirectories.delete(tempDir);
    }
})().catch(error => {
    console.error(error.stack || error);
    void shutdown('Partitioned failure injection failed; cleaning child processes.', 1);
});
