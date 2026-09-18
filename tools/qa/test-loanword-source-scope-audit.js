#!/usr/bin/env node
'use strict';

const assert = require('assert');
const path = require('path');
const { analyseLoanwordRow, buildAudit } = require('./run-loanword-source-scope-audit');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const romanise = value => ({
    'バタリアン': 'batarian',
    'デスノート': 'desunooto',
    'ストリートファイター': 'sutoriitofaitaa',
    'ザスケアクロウ': 'zasukeakurou',
    'ザダイバー': 'zadaibaa',
    'アイネク': 'aineku',
    'カットソー': 'kattosoo',
    'デビルレイズ': 'debirureizu',
    'テクノス': 'tekunosu'
})[value] || '';

assert(analyseLoanwordRow(['バタリアン', 'Return of the Living Dead'], romanise), 'Expanded work-title identity should be a review candidate.');
assert(analyseLoanwordRow(['ザスケアクロウ', 'Night of the Scarecrow'], romanise)?.reasons.includes('za-prefix-identity-mismatch'), 'ザ-prefixed identity mismatch should be visible.');
assert.strictEqual(analyseLoanwordRow(['デスノート', 'Death Note'], romanise), null, 'Direct source spelling must not be rejected merely because English spelling is non-phonetic.');
assert.strictEqual(analyseLoanwordRow(['ストリートファイター', 'Street Fighter'], romanise), null, 'Corrected source spelling must not remain a review candidate.');
assert.strictEqual(analyseLoanwordRow(['ザダイバー', 'The Diver'], romanise), null, 'A represented The + direct source spelling must not be treated as an identity mismatch.');
assert(analyseLoanwordRow(['アイネク', 'Eine Kleine Nachtmusik'], romanise), 'An expanded work title for an established Japanese abbreviation should remain reviewable.');
assert(analyseLoanwordRow(['カットソー', 'Cut And Sewn'], romanise), 'A reconstructed full donor expression for a Japanese clipping should remain reviewable.');
assert(analyseLoanwordRow(['デビルレイズ', 'Tampa Bay Devil Rays'], romanise), 'An entity expansion that injects an absent geographic name should remain reviewable.');
assert(analyseLoanwordRow(['テクノス', 'Technos Japan Corporation'], romanise), 'A large official-name restoration may be a candidate, but must be explicitly adjudicated rather than trusted automatically.');

const report = buildAudit(root);
assert.strictEqual(report.resultType, 'review-candidates-not-release-failures');
assert(report.bankRows > 8000, 'Whole-bank source-scope audit did not load the maintained loanword bank.');
assert(report.candidateCount > 0, 'Whole-bank source-scope audit should expose review candidates.');
assert(!report.candidates.some(candidate => candidate.surface === 'ストリートファイター'), 'Corrected Street Fighter mapping was falsely flagged.');
assert(!report.candidates.some(candidate => candidate.surface === 'ザダイバー'), 'Corrected The Diver mapping was falsely flagged.');
const unadjudicated = report.candidates.filter(candidate => !candidate.adjudicatedBySemanticOracle);
assert.deepStrictEqual(
    unadjudicated.map(candidate => candidate.surface),
    [],
    `Maintained source-scope candidates require explicit semantic-oracle adjudication before release: ${unadjudicated.map(candidate => candidate.surface).join(', ')}`
);

console.log(`Loanword source-scope audit tests passed (${report.candidateCount} review candidates).`);
