#!/usr/bin/env node
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const cliArgs = process.argv.slice(2);
const rootArg = cliArgs.find(argument => !argument.startsWith('--'));
const root = path.resolve(rootArg || path.join(__dirname, '../..'));
const partitionArg = cliArgs.find(argument => argument.startsWith('--partition='));
const partitionMatch = partitionArg?.slice('--partition='.length).match(/^(\d+)\/(\d+)$/u);
if (partitionArg && !partitionMatch) throw new Error('Partition must use --partition=<zero-based-index>/<count>.');
const partitionIndex = partitionMatch ? Number(partitionMatch[1]) : 0;
const partitionCount = partitionMatch ? Number(partitionMatch[2]) : 1;
if (partitionIndex < 0 || partitionCount < 1 || partitionIndex >= partitionCount) throw new Error('Invalid mutation-test partition.');
const wrapperOwnedTemporaryRoot = Boolean(process.env.CJ2R_RELEASE_GATE_MUTATION_TEMP_ROOT);
const temporaryRoot = wrapperOwnedTemporaryRoot
    ? path.resolve(process.env.CJ2R_RELEASE_GATE_MUTATION_TEMP_ROOT)
    : os.tmpdir();
fs.mkdirSync(temporaryRoot, { recursive: true });
const sandboxPrefix = wrapperOwnedTemporaryRoot ? 'partition-' : 'cj2r-release-gate-mutations-';
const sandbox = fs.mkdtempSync(path.join(temporaryRoot, sandboxPrefix));
const maxBuffer = 64 * 1024 * 1024;
let cleaned = false;

function cleanupSandbox() {
    if (cleaned) return;
    cleaned = true;
    try { fs.rmSync(sandbox, { recursive: true, force: true }); } catch (_) {}
}

process.on('SIGINT', () => { cleanupSandbox(); process.exit(130); });
process.on('SIGTERM', () => { cleanupSandbox(); process.exit(143); });
process.on('exit', cleanupSandbox);

function run(command, args) {
    const result = spawnSync(command, args, {
        cwd: sandbox,
        encoding: 'utf8',
        maxBuffer,
        env: process.env
    });
    if (result.error) throw result.error;
    return {
        status: result.status,
        output: `${result.stdout || ''}${result.stderr || ''}`
    };
}

function resolvePython3() {
    const configured = process.env.CJ2R_PYTHON || process.env.PYTHON;
    const candidates = configured
        ? [[configured, []]]
        : process.platform === 'win32'
            ? [['python', []], ['py', ['-3']], ['python3', []]]
            : [['python3', []], ['python', []]];
    for (const [command, prefix] of candidates) {
        const probe = spawnSync(command, [...prefix, '-c', 'import sys; raise SystemExit(0 if sys.version_info.major == 3 else 1)'], {
            encoding: 'utf8'
        });
        if (!probe.error && probe.status === 0) return { command, prefix };
    }
    throw new Error('Python 3 was not found. Install Python 3 or set CJ2R_PYTHON to its executable.');
}

function sandboxPath(relative) {
    return path.join(sandbox, relative);
}

function sourcePath(relative) {
    return path.join(root, relative);
}

function restore(relative) {
    const source = sourcePath(relative);
    const target = sandboxPath(relative);
    if (!fs.existsSync(source)) {
        fs.rmSync(target, { recursive: true, force: true });
        return;
    }
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
}

function editJson(relative, mutate) {
    const target = sandboxPath(relative);
    const value = JSON.parse(fs.readFileSync(target, 'utf8'));
    mutate(value);
    fs.writeFileSync(target, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function expectMutationDetected(test) {
    for (const relative of test.restore) restore(relative);
    test.mutate();
    const failed = run(test.command, test.args());
    if (failed.status === 0) {
        throw new Error(`${test.id}: mutation was not detected; gate exited successfully.`);
    }
    if (test.expected && !test.expected.test(failed.output)) {
        throw new Error(`${test.id}: gate failed, but not with the expected diagnostic.\n${failed.output.slice(-6000)}`);
    }

    for (const relative of test.restore) restore(relative);
    const clean = run(test.cleanCommand || test.command, test.cleanArgs ? test.cleanArgs() : test.args());
    if (clean.status !== 0) {
        throw new Error(`${test.id}: gate did not recover after restoring the mutated bytes.\n${clean.output.slice(-6000)}`);
    }
    process.stdout.write(`PASS ${test.id}\n`);
}

try {
    fs.cpSync(root, sandbox, { recursive: true, force: true, preserveTimestamps: true });
    const python = resolvePython3();
    const node = process.execPath;

    const tests = [
        {
            id: 'generated-engine-parity-detects-drift',
            restore: ['translator-engine.js'],
            command: node,
            args: () => [sandboxPath('tools/build-translator-engine.js'), '--check', sandbox],
            mutate: () => fs.appendFileSync(sandboxPath('translator-engine.js'), '\n// mutation: generated engine drift\n', 'utf8'),
            expected: /out of date with src\/translator/i
        },
        {
            id: 'generated-qa-parity-detects-drift',
            restore: ['tools/qa/translator-qa.js'],
            command: node,
            args: () => [sandboxPath('tools/qa/build-translator-qa.js'), '--check', sandbox],
            mutate: () => fs.appendFileSync(sandboxPath('tools/qa/translator-qa.js'), '\n// mutation: generated QA drift\n', 'utf8'),
            expected: /out of date with tools\/qa\/suites/i
        },
        {
            id: 'structural-integrity-rejects-release-temp-artefact',
            restore: ['tools/qa/qa-output.tmp'],
            command: python.command,
            args: () => [...python.prefix, sandboxPath('tools/qa/run-translator-structural-integrity.py'), sandbox],
            cleanArgs: () => [...python.prefix, sourcePath('tools/qa/run-translator-structural-integrity.py'), root],
            mutate: () => fs.writeFileSync(sandboxPath('tools/qa/qa-output.tmp'), 'mutation\n', 'utf8'),
            expected: /Temporary (?:QA|checkpoint\/recovery) artefact in release tree/i
        },
        {
            id: 'typecheck-detects-jsdoc-type-corruption',
            restore: ['translator-engine.js'],
            command: node,
            args: () => [sandboxPath('tools/qa/run-translator-typecheck.js'), sandbox],
            mutate: () => fs.appendFileSync(
                sandboxPath('translator-engine.js'),
                '\n/** @type {number} */\nlet cj2rReleaseGateMutationType = "not-a-number";\n',
                'utf8'
            ),
            expected: /Type 'string' is not assignable to type 'number'|TS2322/i
        },
        {
            id: 'dependency-check-detects-source-cycle',
            restore: ['src/translator/01-assets-and-schemas.js', 'src/translator/02-ui-controls.js'],
            command: node,
            args: () => [sandboxPath('tools/qa/run-translator-dependency-check.js'), sandbox],
            mutate: () => {
                fs.appendFileSync(sandboxPath('src/translator/01-assets-and-schemas.js'), '\nconst CJ2R_RELEASE_GATE_MUTATION_A = CJ2R_RELEASE_GATE_MUTATION_B;\n', 'utf8');
                fs.appendFileSync(sandboxPath('src/translator/02-ui-controls.js'), '\nconst CJ2R_RELEASE_GATE_MUTATION_B = CJ2R_RELEASE_GATE_MUTATION_A;\n', 'utf8');
            },
            expected: /Circular translator source dependencies detected/i
        },
        {
            id: 'semantic-data-safety-rejects-unclassified-maintained-data',
            restore: ['data/translator-data-provenance-classification.json'],
            command: node,
            args: () => [sandboxPath('tools/qa/test-translator-semantic-data-safety.js'), sandbox],
            mutate: () => editJson('data/translator-data-provenance-classification.json', manifest => {
                if (!Array.isArray(manifest.entries) || !manifest.entries.length) throw new Error('Provenance classification manifest has no entries.');
                const index = manifest.entries.findIndex(item => item.path === 'data/title-readings/title-reading-evidence.json');
                if (index < 0) throw new Error('Expected title-reading provenance classification was not found.');
                manifest.entries.splice(index, 1);
            }),
            expected: /Every maintained file under data\/ must have exactly one provenance classification/i
        },
        {
            id: 'source-scope-audit-rejects-unadjudicated-candidate',
            restore: ['tools/qa/semantic-oracle/loanword-source-truth.json'],
            command: node,
            args: () => [sandboxPath('tools/qa/test-loanword-source-scope-audit.js'), sandbox],
            mutate: () => editJson('tools/qa/semantic-oracle/loanword-source-truth.json', oracle => {
                if (!Array.isArray(oracle.cases) || !oracle.cases.length) throw new Error('Loanword source-truth oracle has no cases.');
                const index = oracle.cases.findIndex(item => item.surface === 'エディ＆ザクルーザーズ');
                if (index < 0) throw new Error('Expected エディ＆ザクルーザーズ semantic-oracle case was not found.');
                oracle.cases.splice(index, 1);
            }),
            expected: /require explicit semantic-oracle adjudication|エディ＆ザクルーザーズ/i
        },
        {
            id: 'provenance-hash-check-detects-pinned-evidence-drift',
            restore: ['data/ateji/ateji-term-bank-1.json'],
            command: node,
            args: () => [sandboxPath('tools/qa/update-external-evidence-source-provenance-hashes.js'), '--check', sandbox],
            mutate: () => fs.appendFileSync(sandboxPath('data/ateji/ateji-term-bank-1.json'), '\n', 'utf8'),
            expected: /hash|sha-?256|out of date|mismatch/i
        },
        {
            id: 'behavioural-regression-detects-reviewed-source-spelling-corruption',
            restore: ['data/loanwords/loanwords-term-bank-1.json'],
            command: node,
            args: () => [sandboxPath('tools/qa/run-translator-focused-qa.js'), sandbox, '--area=names-and-loanwords'],
            mutate: () => editJson('data/loanwords/loanwords-term-bank-1.json', rows => {
                const row = rows.find(item => Array.isArray(item) ? item[0] === 'スパイファミリー' : item && item.surface === 'スパイファミリー');
                if (!row) throw new Error('Expected スパイファミリー loanword row was not found.');
                if (Array.isArray(row)) row[1] = 'Supai Famirii';
                else row.output = 'Supai Famirii';
            }),
            expected: /スパイファミリー|Spy Family|SUPAI/i
        },
        {
            id: 'qa-builder-rejects-source-syntax-error',
            restore: ['tools/qa/suites/names-and-loanwords.js'],
            command: node,
            args: () => [sandboxPath('tools/qa/build-translator-qa.js'), '--check', sandbox],
            mutate: () => fs.appendFileSync(
                sandboxPath('tools/qa/suites/names-and-loanwords.js'),
                "\nconst CJ2R_RELEASE_GATE_BROKEN_STRING = 'row's';\n",
                'utf8'
            ),
            expected: /JavaScript syntax error in tools\/qa\/suites\/names-and-loanwords\.js/i
        }
    ];

    const selectedTests = tests.filter((_, index) => index % partitionCount === partitionIndex);
    if (!selectedTests.length) throw new Error(`Mutation-test partition ${partitionIndex + 1}/${partitionCount} selected no cases.`);
    for (const test of selectedTests) expectMutationDetected(test);
    console.log(`Release-gate mutation detection passed (${selectedTests.length}/${selectedTests.length} mutations detected and recovered in partition ${partitionIndex + 1}/${partitionCount}).`);
} finally {
    cleanupSandbox();
}
