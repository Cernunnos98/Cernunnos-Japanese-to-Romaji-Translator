#!/usr/bin/env node
'use strict';

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const defaultRoot = path.resolve(__dirname, '../..');

function readJson(filePath) {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function loanwordSurface(row) {
    return String(Array.isArray(row) ? row[0] : row?.surface || '').trim();
}

function loanwordOutput(row) {
    return String(Array.isArray(row) ? row[1] : row?.output || '').trim();
}

function isReviewOnly(row) {
    return !Array.isArray(row) && row?.requiresReview === true && !loanwordOutput(row);
}

function loadKanaRomaniser(root) {
    const sourcePath = path.join(root, 'src/translator/05-romaji-core.js');
    const context = vm.createContext({
        console,
        runtimeState: {
            generalKanjiVariantDictionary: new Map(),
            nameKanjiVariantDictionary: new Map()
        }
    });
    vm.runInContext(fs.readFileSync(sourcePath, 'utf8'), context, { filename: sourcePath });
    if (typeof context.convertToRomaji !== 'function') throw new Error('Kana Romanisation helper is unavailable.');
    return value => context.convertToRomaji(String(value || '').replace(/[・･\s]/gu, ''));
}

function phoneticSkeleton(value, options = {}) {
    let text = String(value || '')
        .normalize('NFKD')
        .toLowerCase()
        .replace(/[^a-z]/gu, '');
    if (options.dropLeadingThe) text = text.replace(/^the/u, '');
    return text
        .replace(/ph/gu, 'f')
        .replace(/th/gu, 't')
        .replace(/sh/gu, 's')
        .replace(/ch/gu, 'c')
        .replace(/gh/gu, 'g')
        .replace(/qu/gu, 'k')
        .replace(/ck/gu, 'k')
        .replace(/x/gu, 'ks')
        .replace(/[lr]/gu, 'r')
        .replace(/[vb]/gu, 'b')
        .replace(/[aeiouy]/gu, '')
        .replace(/(.)\1+/gu, '$1');
}

function levenshtein(left, right) {
    if (!left) return right.length;
    if (!right) return left.length;
    let previous = Array.from({ length: right.length + 1 }, (_, index) => index);
    for (let row = 1; row <= left.length; row += 1) {
        const current = [row];
        for (let column = 1; column <= right.length; column += 1) {
            current[column] = Math.min(
                current[column - 1] + 1,
                previous[column] + 1,
                previous[column - 1] + (left[row - 1] === right[column - 1] ? 0 : 1)
            );
        }
        previous = current;
    }
    return previous[right.length];
}

function similarity(left, right) {
    const longest = Math.max(left.length, right.length);
    if (!longest) return 1;
    return 1 - (levenshtein(left, right) / longest);
}

const functionWordMarkers = Object.freeze({
    of: ['オブ', 'オヴ'],
    and: ['アンド', '＆', '&'],
    with: ['ウィズ', 'ウイズ'],
    from: ['フロム'],
    for: ['フォー', 'フォア'],
    to: ['トゥ', 'トウ', 'ツー']
});

function wordList(output) {
    return output.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/gu) || [];
}

function hasMarker(surface, markers) {
    return markers.some(marker => surface.includes(marker));
}

function analyseLoanwordRow(row, romanise) {
    const surface = loanwordSurface(row);
    const output = loanwordOutput(row);
    if (!surface || !output || isReviewOnly(row) || !/[ァ-ヺー]/u.test(surface)) return null;

    const mechanicalRomaji = romanise(surface);
    const startsWithZaArticle = /^ザ(?:[・･]|(?![ーッ]))/u.test(surface) && /^The(?:\b|$)/iu.test(output);
    const sourceSkeleton = phoneticSkeleton(mechanicalRomaji, { dropLeadingThe: false });
    const outputSkeleton = phoneticSkeleton(output, { dropLeadingThe: startsWithZaArticle });
    const score = similarity(sourceSkeleton, outputSkeleton);
    const words = wordList(output);
    const reasons = [];

    if (/^ザ(?:[・･]|(?![ーッ]))/u.test(surface) && words.length >= 2 && !/^The(?:\b|$)/iu.test(output)) {
        reasons.push({ id: 'za-prefix-identity-mismatch', weight: 5 });
    }

    const lowerWords = new Set(words.map(word => word.toLowerCase().replace(/[’']/gu, '')));
    for (const [word, markers] of Object.entries(functionWordMarkers)) {
        if (lowerWords.has(word) && !hasMarker(surface, markers) && score < 0.55) {
            reasons.push({ id: `unrepresented-function-word:${word}`, weight: 2 });
        }
    }
    if (lowerWords.has('the') && !/^ザ(?:[・･]|(?![ーッ]))/u.test(surface) && score < 0.5) {
        reasons.push({ id: 'unrepresented-function-word:the', weight: 3 });
    }

    if (words.length >= 4 && score < 0.55) reasons.push({ id: 'expanded-multiword-low-phonetic', weight: 3 });
    if (words.length >= 2 && score < 0.2 && !(startsWithZaArticle && words.length === 2)) reasons.push({ id: 'very-low-phonetic-multiword', weight: 3 });
    if (/[:：]/u.test(output) && !/[:：]/u.test(surface)) reasons.push({ id: 'unrepresented-subtitle-colon', weight: 2 });

    const compactMechanicalLength = mechanicalRomaji.replace(/[^A-Za-z]/gu, '').length;
    const compactOutputLength = output.replace(/[^A-Za-z]/gu, '').length;
    if (words.length >= 3 && compactMechanicalLength > 0 && compactOutputLength / compactMechanicalLength >= 1.8 && score < 0.55) {
        reasons.push({ id: 'large-output-expansion', weight: 2 });
    }

    if (!reasons.length) return null;
    return {
        surface,
        output,
        mechanicalRomaji,
        phoneticSimilarity: Number(score.toFixed(3)),
        outputWordCount: words.length,
        riskScore: reasons.reduce((total, reason) => total + reason.weight, 0),
        reasons: reasons.map(reason => reason.id)
    };
}

function buildAudit(root) {
    const bankPath = path.join(root, 'data/loanwords/loanwords-term-bank-1.json');
    const oraclePath = path.join(root, 'tools/qa/semantic-oracle/loanword-source-truth.json');
    const rows = readJson(bankPath);
    const oracle = fs.existsSync(oraclePath) ? readJson(oraclePath) : { cases: [] };
    const oracleBySurface = new Map((oracle.cases || []).map(item => [item.surface, item.id]));
    const romanise = loadKanaRomaniser(root);
    const candidates = rows
        .map(row => analyseLoanwordRow(row, romanise))
        .filter(Boolean)
        .map(candidate => ({ ...candidate, adjudicatedBySemanticOracle: oracleBySurface.get(candidate.surface) || null }))
        .sort((left, right) => right.riskScore - left.riskScore || left.phoneticSimilarity - right.phoneticSimilarity || left.surface.localeCompare(right.surface, 'ja'));

    const reasons = {};
    for (const candidate of candidates) for (const reason of candidate.reasons) reasons[reason] = (reasons[reason] || 0) + 1;
    return {
        schemaVersion: 1,
        resultType: 'review-candidates-not-release-failures',
        bankRows: rows.length,
        candidateCount: candidates.length,
        adjudicatedCandidateCount: candidates.filter(candidate => candidate.adjudicatedBySemanticOracle).length,
        reasons,
        candidates
    };
}

function parseArgs(argv) {
    const args = [...argv];
    let root = defaultRoot;
    if (args[0] && !args[0].startsWith('--')) root = path.resolve(args.shift());
    let output = null;
    let limit = null;
    for (let index = 0; index < args.length; index += 1) {
        if (args[index] === '--output') output = path.resolve(args[++index]);
        else if (args[index] === '--limit') {
            limit = Number(args[++index]);
            if (!Number.isInteger(limit) || limit < 1) throw new Error('--limit requires a positive integer.');
        } else throw new Error(`Unknown option: ${args[index]}`);
    }
    return { root, output, limit };
}

function runCli(argv = process.argv.slice(2)) {
    const { root, output, limit } = parseArgs(argv);
    const report = buildAudit(root);
    const printable = limit == null ? report : { ...report, candidates: report.candidates.slice(0, limit) };
    const text = `${JSON.stringify(printable, null, 2)}\n`;
    if (output) {
        fs.mkdirSync(path.dirname(output), { recursive: true });
        fs.writeFileSync(output, text, 'utf8');
        console.error(`Loanword source-scope audit wrote ${printable.candidates.length}/${report.candidateCount} review candidates to ${output}.`);
    } else process.stdout.write(text);
    return 0;
}

if (require.main === module) {
    try {
        process.exitCode = runCli();
    } catch (error) {
        console.error(error.stack || error);
        process.exitCode = 1;
    }
}

module.exports = {
    analyseLoanwordRow,
    buildAudit,
    levenshtein,
    phoneticSkeleton,
    similarity
};
