#!/usr/bin/env node
'use strict';

const crypto = require('crypto');
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { createNodeTranslatorContext } = require('./browser/fake-dom');

const RESULT_STATES = Object.freeze({ PASS: 'passed', FAIL: 'failed', NOT_RUN: 'not-executed', INFRA: 'infrastructure-error' });
const args = process.argv.slice(2);
const root = path.resolve(args[0] && !args[0].startsWith('--') ? args.shift() : path.join(__dirname, '../..'));

function argValue(name, fallback = null) {
    const index = args.indexOf(name);
    return index >= 0 ? (args[index + 1] ?? fallback) : fallback;
}
function hasArg(name) { return args.includes(name); }
function intArg(name, fallback) {
    const raw = argValue(name, null);
    if (raw == null) return fallback;
    const value = Number(raw);
    if (!Number.isInteger(value)) throw new Error(`${name} requires an integer.`);
    return value;
}

const partitionCount = intArg('--partitions', 32);
if (partitionCount < 1 || partitionCount > 1024) throw new Error('--partitions must be between 1 and 1024.');
const outputDir = path.resolve(argValue('--output-dir', path.join(os.tmpdir(), 'cj2r-lexical-candidate-audit')));
const force = hasArg('--force');

function partitionForKey(key) {
    const digest = crypto.createHash('sha256').update(String(key), 'utf8').digest();
    return digest.readUInt32BE(0) % partitionCount;
}
function inventoryFingerprint(entries) {
    const hash = crypto.createHash('sha256');
    for (const entry of entries) hash.update(JSON.stringify(entry)).update('\n');
    return hash.digest('hex');
}
function partitionPath(index) {
    return path.join(outputDir, `partition-${String(index).padStart(3, '0')}-of-${String(partitionCount).padStart(3, '0')}.json`);
}
function writeJsonAtomic(filePath, value) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    const temp = `${filePath}.${process.pid}.tmp`;
    fs.writeFileSync(temp, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
    fs.renameSync(temp, filePath);
}
function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}
function summarizeMechanisms(results) {
    const counts = {};
    for (const result of results) for (const failure of result.failures || []) counts[failure.mechanism] = (counts[failure.mechanism] || 0) + 1;
    return counts;
}
function summarizeSources(results) {
    const sources = {};
    for (const result of results) {
        const item = sources[result.sourceType] || { passed: 0, failed: 0, intentional: 0, infrastructureError: 0, total: 0 };
        item.total += 1;
        if (result.status === RESULT_STATES.PASS) item.passed += 1;
        else if (result.status === RESULT_STATES.FAIL) item.failed += 1;
        else if (result.status === 'intentional-context-restriction') item.intentional += 1;
        else if (result.status === RESULT_STATES.INFRA) item.infrastructureError += 1;
        sources[result.sourceType] = item;
    }
    return sources;
}

async function loadTools() {
    const { context } = createNodeTranslatorContext(root);
    const stderrConsole = Object.freeze({
        log: (...items) => process.stderr.write(`${items.join(' ')}\n`),
        info: () => {},
        warn: (...items) => process.stderr.write(`${items.join(' ')}\n`),
        error: (...items) => process.stderr.write(`${items.join(' ')}\n`)
    });
    context.console = stderrConsole;
    context.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true };
    const enginePath = path.join(root, 'translator-engine.js');
    vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });
    await context.RomajiTranslator.ready;
    const tools = context.RomajiTranslator.getDiagnostics()?.tools || {};
    for (const name of ['getLexicalCandidateAuditInventory', 'runLexicalCandidateAuditEntries', 'getLexicalCandidateCollisionReport']) {
        if (typeof tools[name] !== 'function') throw new Error(`Required lexical audit diagnostic tool is unavailable: ${name}`);
    }
    return tools;
}

function selectedPartitions() {
    if (hasArg('--all')) return Array.from({ length: partitionCount }, (_, index) => index);
    const partitionRaw = argValue('--partition', null);
    if (partitionRaw != null) {
        const value = Number(partitionRaw);
        if (!Number.isInteger(value) || value < 0 || value >= partitionCount) throw new Error(`--partition must be between 0 and ${partitionCount - 1}.`);
        return [value];
    }
    const rangeRaw = argValue('--range', null);
    if (rangeRaw != null) {
        const match = String(rangeRaw).match(/^(\d+):(\d+)$/u);
        if (!match) throw new Error('--range must be START:END (inclusive).');
        const start = Number(match[1]);
        const end = Number(match[2]);
        if (start < 0 || end < start || end >= partitionCount) throw new Error(`--range must stay within 0:${partitionCount - 1}.`);
        return Array.from({ length: end - start + 1 }, (_, offset) => start + offset);
    }
    return [];
}

function buildAggregate(inventory, collisions, fingerprint) {
    const partitionStates = [];
    const executedResults = [];
    const reportProblems = [];
    for (let index = 0; index < partitionCount; index += 1) {
        const filePath = partitionPath(index);
        if (!fs.existsSync(filePath)) {
            partitionStates.push({ partition: index, state: RESULT_STATES.NOT_RUN });
            continue;
        }
        try {
            const report = readJson(filePath);
            if (report.partition !== index || report.partitionCount !== partitionCount || report.inventoryFingerprint !== fingerprint || !Array.isArray(report.results)) {
                partitionStates.push({ partition: index, state: RESULT_STATES.INFRA, reason: 'stale-or-invalid-partition-report' });
                reportProblems.push({ partition: index, reason: 'stale-or-invalid-partition-report' });
                continue;
            }
            partitionStates.push({ partition: index, state: report.state, entries: report.entriesExamined });
            executedResults.push(...report.results);
        } catch (error) {
            partitionStates.push({ partition: index, state: RESULT_STATES.INFRA, reason: String(error?.message || error) });
            reportProblems.push({ partition: index, reason: String(error?.message || error) });
        }
    }

    const authoritativeInventory = inventory.entries.filter(entry => entry.sourceClass !== 'derived');
    const executedKeys = new Set(executedResults.map(result => result.key));
    const executedEntries = inventory.entries.filter(entry => executedKeys.has(entry.key));
    const failed = executedResults.filter(result => result.status === RESULT_STATES.FAIL);
    const infrastructureErrors = executedResults.filter(result => result.status === RESULT_STATES.INFRA);
    const intentional = executedResults.filter(result => result.status === 'intentional-context-restriction');
    const analyserSensitive = failed.filter(result => (result.failures || []).some(item => item.mechanism === 'analyser-partition-sensitive'));
    const ambiguousSurfaces = new Set(inventory.entries.filter(entry => entry.ambiguityExpected).map(entry => entry.surface));
    const executedSurfaces = new Set(executedEntries.map(entry => entry.surface));
    const noReachableCandidate = failed.filter(result => result.candidateExpected && (result.failures || []).some(item => item.expectedCandidate && !item.found));

    const stateCounts = partitionStates.reduce((acc, item) => { acc[item.state] = (acc[item.state] || 0) + 1; return acc; }, {});
    const aggregate = {
        schemaVersion: 1,
        resultState: failed.length ? RESULT_STATES.FAIL : ((infrastructureErrors.length || reportProblems.length) ? RESULT_STATES.INFRA : RESULT_STATES.PASS),
        partitionCount,
        partitionStates,
        partitionStateCounts: stateCounts,
        inventoryFingerprint: fingerprint,
        authoritativeEntriesTotal: authoritativeInventory.length,
        inventoryEntriesTotal: inventory.entries.length,
        totalAuthoritativeEntriesExamined: executedEntries.filter(entry => entry.sourceClass !== 'derived').length,
        totalEntriesExamined: executedEntries.length,
        uniqueSourceSurfacesExamined: executedSurfaces.size,
        candidateGeneratingEntriesExamined: executedEntries.filter(entry => entry.candidateExpected).length,
        intentionallyContextRestrictedEntriesExamined: executedEntries.filter(entry => entry.contextScope !== 'global').length,
        intentionalNonCandidateEntriesExamined: intentional.length,
        entriesWithNoReachableCandidatePath: noReachableCandidate.length,
        ambiguousSurfaces: ambiguousSurfaces.size,
        sameSurfaceCrossBankCollisions: collisions.length,
        equivalentCrossBankCollisions: collisions.filter(item => item.equivalentEvidence).length,
        ambiguousCrossBankCollisions: collisions.filter(item => item.ambiguous).length,
        analyserPartitionSensitiveCases: analyserSensitive.length,
        failures: failed.length,
        infrastructureErrors: infrastructureErrors.length + reportProblems.length,
        failuresByMechanism: summarizeMechanisms(executedResults),
        resultsBySource: summarizeSources(executedResults),
        collisions,
        failedEntries: failed.map(result => ({ key: result.key, sourceType: result.sourceType, surface: result.surface, contextScope: result.contextScope, failures: result.failures })),
        infrastructureProblems: [
            ...reportProblems,
            ...infrastructureErrors.map(result => ({ key: result.key, sourceType: result.sourceType, surface: result.surface, reason: result.probes?.find(item => item.status === RESULT_STATES.INFRA)?.reason || 'audit-entry-infrastructure-error' }))
        ]
    };
    return aggregate;
}

(async () => {
    if (hasArg('--help')) {
        process.stdout.write([
            'Usage: node tools/qa/run-lexical-candidate-coverage-audit.js [root] [options]',
            '  --partition N       Run one deterministic partition.',
            '  --range A:B         Run an inclusive range of partitions.',
            '  --all               Run all partitions, skipping valid completed reports.',
            '  --aggregate         Aggregate existing partition reports without running new partitions.',
            '  --list              Print partition/inventory metadata only.',
            '  --partitions N      Partition count (default 32).',
            '  --output-dir PATH   Report directory (default: OS temporary directory).',
            '  --force             Re-run requested partitions even if a valid report already exists.',
            ''
        ].join('\n'));
        return;
    }

    const tools = await loadTools();
    const inventory = tools.getLexicalCandidateAuditInventory();
    const collisions = tools.getLexicalCandidateCollisionReport();
    const fingerprint = inventoryFingerprint(inventory.entries);
    const partitionSizes = Array.from({ length: partitionCount }, () => 0);
    for (const entry of inventory.entries) partitionSizes[partitionForKey(entry.key)] += 1;

    if (hasArg('--list')) {
        process.stdout.write(`${JSON.stringify({ partitionCount, partitionSizes, inventoryFingerprint: fingerprint, inventoryEntries: inventory.entries.length, sourceSummary: inventory.sourceSummary, collisions: collisions.length }, null, 2)}\n`);
        return;
    }

    const requested = selectedPartitions();
    if (!requested.length && !hasArg('--aggregate')) throw new Error('Choose --partition, --range, --all, --aggregate, or --list.');

    for (const partition of requested) {
        const filePath = partitionPath(partition);
        if (!force && fs.existsSync(filePath)) {
            try {
                const existing = readJson(filePath);
                if (existing.partition === partition && existing.partitionCount === partitionCount && existing.inventoryFingerprint === fingerprint && Array.isArray(existing.results)) continue;
            } catch (_) { /* stale/partial report is replaced */ }
        }
        const entries = inventory.entries.filter(entry => partitionForKey(entry.key) === partition);
        const started = new Date().toISOString();
        let results;
        let state;
        let harnessError = null;
        try {
            results = tools.runLexicalCandidateAuditEntries(entries.map(entry => entry.key));
            const failed = results.some(result => result.status === RESULT_STATES.FAIL);
            const infra = results.some(result => result.status === RESULT_STATES.INFRA);
            state = failed ? RESULT_STATES.FAIL : (infra ? RESULT_STATES.INFRA : RESULT_STATES.PASS);
        } catch (error) {
            results = [];
            state = RESULT_STATES.INFRA;
            harnessError = String(error?.stack || error?.message || error);
        }
        const report = {
            schemaVersion: 1,
            state,
            partition,
            partitionCount,
            inventoryFingerprint: fingerprint,
            startedAt: started,
            completedAt: new Date().toISOString(),
            entriesExamined: entries.length,
            authoritativeEntriesExamined: entries.filter(entry => entry.sourceClass !== 'derived').length,
            uniqueSurfacesExamined: new Set(entries.map(entry => entry.surface)).size,
            candidateGeneratingEntries: entries.filter(entry => entry.candidateExpected).length,
            intentionalNonCandidateEntries: entries.filter(entry => !entry.candidateExpected).length,
            contextRestrictedEntries: entries.filter(entry => entry.contextScope !== 'global').length,
            failuresByMechanism: summarizeMechanisms(results),
            resultsBySource: summarizeSources(results),
            harnessError,
            results
        };
        writeJsonAtomic(filePath, report);
    }

    const aggregate = buildAggregate(inventory, collisions, fingerprint);
    fs.mkdirSync(outputDir, { recursive: true });
    writeJsonAtomic(path.join(outputDir, 'aggregate.json'), aggregate);
    process.stdout.write(`${JSON.stringify({
        resultState: aggregate.resultState,
        partitionCount: aggregate.partitionCount,
        partitionStateCounts: aggregate.partitionStateCounts,
        totalAuthoritativeEntriesExamined: aggregate.totalAuthoritativeEntriesExamined,
        totalEntriesExamined: aggregate.totalEntriesExamined,
        uniqueSourceSurfacesExamined: aggregate.uniqueSourceSurfacesExamined,
        candidateGeneratingEntriesExamined: aggregate.candidateGeneratingEntriesExamined,
        entriesWithNoReachableCandidatePath: aggregate.entriesWithNoReachableCandidatePath,
        failures: aggregate.failures,
        infrastructureErrors: aggregate.infrastructureErrors,
        failuresByMechanism: aggregate.failuresByMechanism,
        sameSurfaceCrossBankCollisions: aggregate.sameSurfaceCrossBankCollisions,
        ambiguousCrossBankCollisions: aggregate.ambiguousCrossBankCollisions,
        analyserPartitionSensitiveCases: aggregate.analyserPartitionSensitiveCases,
        outputDir
    }, null, 2)}\n`);

    // Unrequested partitions are deliberately not a failure. Genuine requested audit failures are.
    if (aggregate.failures) process.exitCode = 2;
    else if (aggregate.infrastructureErrors) process.exitCode = 3;
})().catch(error => {
    process.stdout.write(`${JSON.stringify({ resultState: RESULT_STATES.INFRA, error: String(error?.message || error) }, null, 2)}\n`);
    process.exitCode = 3;
});
