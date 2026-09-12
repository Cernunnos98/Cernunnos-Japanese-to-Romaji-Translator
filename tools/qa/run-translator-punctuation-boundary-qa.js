const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { createNodeTranslatorContext } = require('./browser/fake-dom');

const args = process.argv.slice(2);
const rootArg = args.find(arg => !arg.startsWith('--'));
const root = path.resolve(rootArg || path.join(__dirname, '../..'));
function intArg(name, fallback) {
    const inline = args.find(arg => arg.startsWith(`${name}=`));
    if (inline) return Math.max(0, Number.parseInt(inline.slice(name.length + 1), 10) || fallback);
    const index = args.indexOf(name);
    if (index >= 0) return Math.max(0, Number.parseInt(args[index + 1], 10) || fallback);
    return fallback;
}
const partitions = Math.max(1, intArg('--partitions', Number(process.env.TRANSLATOR_PUNCTUATION_PARTITIONS || 1)));
const partition = Math.min(partitions - 1, intArg('--partition', Number(process.env.TRANSLATOR_PUNCTUATION_PARTITION || 0)));
const maxFailures = Math.max(1, intArg('--max-failures', 40));

const { context } = createNodeTranslatorContext(root);
const enginePath = path.join(root, 'translator-engine.js');
vm.runInContext(fs.readFileSync(enginePath, 'utf8'), context, { filename: enginePath });

const bases = [
    '学校',                    // ordinary kanji lexical item
    '偏る',                    // okurigana/context-sensitive reading
    '喃',                      // reviewed ambiguous rare character
    '弎百',                    // reviewed formal numeral + irregular numeric phonology
    '驫木',                    // reviewed proper-name span
    'ジャック・スケリントン', // reviewed foreign name containing internal punctuation
    '時々',                    // iteration mark must not become a boundary
    'スーパー',                // prolonged-sound mark must not become a boundary
    'こういう',                // kana lexical continuity
    '幻影',                    // syllabic-n apostrophe output
    'あっ',                    // terminal sokuon review state
    'これはテスト'             // mixed grammar + loanword
];

const separatorFamilies = [
    { name: 'period', canonical: '。', variants: ['。','．','｡','﹒','︒','.'] },
    { name: 'comma', canonical: '、', variants: ['、','，','､','﹑','﹐','︑','︐',','] },
    { name: 'question', canonical: '？', variants: ['？','?','﹖','︖'] },
    { name: 'exclamation', canonical: '！', variants: ['！','!','﹗','︕'] },
    { name: 'colon', canonical: '：', variants: ['：',':','﹕','︓'] },
    { name: 'semicolon', canonical: '；', variants: ['；',';','﹔','︔'] },
    { name: 'wave', canonical: '〜', variants: ['〜','～','~','〰'] },
    { name: 'em-dash', canonical: '―', variants: ['―','—','﹘','︱'] },
    { name: 'en-dash', canonical: '–', variants: ['–','︲','‒'] },
    { name: 'hyphen', canonical: '-', variants: ['-','－','‐','‑'] },
    { name: 'ellipsis', canonical: '…', variants: ['…','……','‥','⋯','⋮','︙','︰'] },
    { name: 'middle-dot', canonical: '・', variants: ['・','･'] },
    { name: 'slash', canonical: '/', variants: ['/','／'] },
    { name: 'backslash', canonical: '\\', variants: ['\\','＼','﹨'] },
    { name: 'pipe', canonical: '|', variants: ['|','｜'] }
];

const pairFamilies = [
    { name: 'corner', canonical: ['「','」'], variants: [['「','」'],['｢','｣'],['﹁','﹂']] },
    { name: 'white-corner', canonical: ['『','』'], variants: [['『','』'],['﹃','﹄']] },
    { name: 'paren', canonical: ['(',')'], variants: [['(',')'],['（','）'],['︵','︶'],['﹙','﹚']] },
    { name: 'square', canonical: ['[',']'], variants: [['[',']'],['［','］'],['﹇','﹈']] },
    { name: 'curly', canonical: ['{','}'], variants: [['{','}'],['｛','｝'],['︷','︸'],['﹛','﹜']] },
    { name: 'lenticular', canonical: ['【','】'], variants: [['【','】'],['︻','︼']] },
    { name: 'tortoise', canonical: ['〔','〕'], variants: [['〔','〕'],['︹','︺'],['﹝','﹞']] },
    { name: 'angle', canonical: ['〈','〉'], variants: [['〈','〉'],['︿','﹀']] },
    { name: 'double-angle', canonical: ['《','》'], variants: [['《','》'],['︽','︾']] },
    { name: 'white-lenticular', canonical: ['〖','〗'], variants: [['〖','〗'],['︗','︘']] },
    { name: 'white-square', canonical: ['〘','〙'], variants: [['〘','〙']] },
    { name: 'white-bracket', canonical: ['〚','〛'], variants: [['〚','〛']] },
    { name: 'curly-double-quote', canonical: ['“','”'], variants: [['“','”'],['〝','〟'],['〝','〞']] },
    { name: 'curly-single-quote', canonical: ['‘','’'], variants: [['‘','’']] }
];

const infixLayouts = [
    { name: 'tight', render: (left, punct, right) => `${left}${punct}${right}` },
    { name: 'ascii-both', render: (left, punct, right) => `${left} ${punct} ${right}` },
    { name: 'ascii-left', render: (left, punct, right) => `${left} ${punct}${right}` },
    { name: 'ascii-right', render: (left, punct, right) => `${left}${punct} ${right}` },
    { name: 'ideographic-both', render: (left, punct, right) => `${left}　${punct}　${right}` },
    { name: 'ideographic-left', render: (left, punct, right) => `${left}　${punct}${right}` },
    { name: 'ideographic-right', render: (left, punct, right) => `${left}${punct}　${right}` },
    { name: 'tab-both', render: (left, punct, right) => `${left}\t${punct}\t${right}` },
    { name: 'newline-both', render: (left, punct, right) => `${left}\n${punct}\n${right}` },
    { name: 'crlf-both', render: (left, punct, right) => `${left}\r\n${punct}\r\n${right}` },
    { name: 'line-separator', render: (left, punct, right) => `${left}\u2028${punct}\u2028${right}` },
    { name: 'paragraph-separator', render: (left, punct, right) => `${left}\u2029${punct}\u2029${right}` }
];

const wrapperLayouts = [
    { name: 'tight', render: (open, base, close) => `${open}${base}${close}` },
    { name: 'ascii-inner', render: (open, base, close) => `${open} ${base} ${close}` },
    { name: 'ideographic-inner', render: (open, base, close) => `${open}　${base}　${close}` },
    { name: 'newline-inner', render: (open, base, close) => `${open}\n${base}\n${close}` }
];

const clusterFamilies = [
    { name: 'exclaim-question', canonical: '！？', variants: ['！？','!?','﹗﹖','︕︖'] },
    { name: 'question-exclaim', canonical: '？！', variants: ['？！','?!','﹖﹗','︖︕'] },
    { name: 'double-ellipsis', canonical: '……', variants: ['……','︙︙','︰︰','‥‥','⋯⋯'] },
    { name: 'period-close-quote', canonical: '。』', variants: ['。』','︒﹄','｡』'] },
    { name: 'comma-open-quote', canonical: '、「', variants: ['、「','︑﹁','､｢'] },
    { name: 'wave-period', canonical: '〜。', variants: ['〜。','～︒','〰｡','~.'] },
    { name: 'double-em-dash', canonical: '――', variants: ['――','︱︱','﹘﹘','——'] },
    { name: 'double-middle-dot', canonical: '・・', variants: ['・・','･･'] }
];

const protectedCases = [
    ["Heaven's Feel", "Heaven's Feel"],
    ['O’Reilly', 'O’Reilly'],
    ['test@example.com', 'test@example.com'],
    ['ver1.2', 'ver1.2'],
    ['v2.0.1', 'v2.0.1'],
    ['1,234', '1,234'],
    ['12:30', '12:30'],
    ['https://example.com/a-b?x=1&y=2#frag', 'https://example.com/a-b?x=1&y=2#frag'],
    ['A/B', 'A/B'],
    ['A-B', 'A-B'],
    ['A_B', 'A_B'],
    ['A+B', 'A+B'],
    ['C++', 'C++'],
    ['時々', 'Tokidoki']
];

const cases = [];
function add(id, category, input, expectedInput, extra = {}) { cases.push({ id, category, input, expectedInput, ...extra }); }

const layoutBases = bases.slice(0, 6);

// Every punctuation variant is checked in tight, leading, trailing and repeated positions
// across every representative linguistic base.
for (const base of bases) {
    for (const family of separatorFamilies) {
        for (const variant of family.variants) {
            add(`infix:${base}:${family.name}:${variant.codePointAt(0).toString(16)}:tight`, 'infix-equivalence', `${base}${variant}${base}`, `${base}${family.canonical}${base}`, { base, expectRepeatedBase: true });
            add(`leading:${base}:${family.name}:${variant.codePointAt(0).toString(16)}`, 'leading-equivalence', `${variant}${base}`, `${family.canonical}${base}`, { base, expectSingleBase: true });
            add(`trailing:${base}:${family.name}:${variant.codePointAt(0).toString(16)}`, 'trailing-equivalence', `${base}${variant}`, `${base}${family.canonical}`, { base, expectSingleBase: true });
            add(`repeat:${base}:${family.name}:${variant.codePointAt(0).toString(16)}`, 'repeated-equivalence', `${base}${variant}${variant}${base}`, `${base}${family.canonical}${family.canonical}${base}`, { base, expectRepeatedBase: true });
        }
    }
    for (const family of pairFamilies) {
        for (const [open, close] of family.variants) {
            add(`wrapper:${base}:${family.name}:${open.codePointAt(0).toString(16)}:tight`, 'wrapper-equivalence', `${open}${base}${close}`, `${family.canonical[0]}${base}${family.canonical[1]}`, { base, expectSingleBase: true });
        }
    }
    for (const family of clusterFamilies) {
        for (const variant of family.variants) {
            add(`cluster:${base}:${family.name}:${variant.codePointAt(0).toString(16)}`, 'cluster-equivalence', `${base}${variant}${base}`, `${base}${family.canonical}${base}`, { base, expectRepeatedBase: true });
        }
    }
}

// Every whitespace/layout form is exercised against the canonical member of every
// punctuation family across six structurally different bases. This keeps the release
// process bounded while still covering every layout class independently of glyph variants.
for (const base of layoutBases) {
    for (const family of separatorFamilies) {
        for (const layout of infixLayouts.filter(item => item.name !== 'tight')) {
            add(`layout:${base}:${family.name}:${layout.name}`, 'layout-equivalence', layout.render(base, family.canonical, base), `${base}${family.canonical}${base}`, { base, expectRepeatedBase: true });
        }
    }
    for (const family of pairFamilies) {
        for (const layout of wrapperLayouts.filter(item => item.name !== 'tight')) {
            add(`wrapper-layout:${base}:${family.name}:${layout.name}`, 'wrapper-layout-equivalence', layout.render(family.canonical[0], base, family.canonical[1]), `${family.canonical[0]}${base}${family.canonical[1]}`, { base, expectSingleBase: true });
        }
    }
}

// Exact-override trailing punctuation must survive compatibility/presentation variants.
for (const family of separatorFamilies.filter(item => ['period','question','exclamation','colon','semicolon','wave','ellipsis'].includes(item.name))) {
    for (const variant of family.variants) {
        add(`override-trailing:${family.name}:${variant.codePointAt(0).toString(16)}`, 'override-trailing-equivalence', `東京喰種${variant}`, `東京喰種${family.canonical}`);
    }
}

// Nested layouts catch delimiter state-machine and quote-nesting defects.
const nested = [
    ['「','」','『','』'],
    ['『','』','「','」'],
    ['（','）','【','】'],
    ['【','】','（','）'],
    ['“','”','‘','’'],
    ['﹁','﹂','﹃','﹄'],
    ['︵','︶','︻','︼'],
    ['《','》','〈','〉']
];
for (const base of bases) {
    for (const [o1,c1,o2,c2] of nested) {
        add(`nested:${base}:${o1.codePointAt(0).toString(16)}:${o2.codePointAt(0).toString(16)}`, 'nested-delimiter', `${o1}${o2}${base}${c2}${c1}`, `${o1.normalize('NFKC')}${o2.normalize('NFKC')}${base}${c2.normalize('NFKC')}${c1.normalize('NFKC')}`, { base, expectSingleBase: true });
    }
}

for (const [input, expected] of protectedCases) {
    cases.push({ id: `protected:${input}`, category: 'protected-internal', input, literalExpected: expected });
}

function key(value) { return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, ''); }
const auditCache = new Map();
function audit(input) {
    const key = String(input);
    if (!auditCache.has(key)) auditCache.set(key, context.RomajiTranslator.translateWithAuditSync(key));
    return auditCache.get(key);
}

(async () => {
    await context.RomajiTranslator.ready;
    const baseAudits = new Map(bases.map(base => [base, audit(base)]));
    const selected = cases.filter((_, index) => index % partitions === partition);
    const failures = [];
    let passed = 0;
    const categorySummary = {};

    for (const test of selected) {
        let ok = true;
        let actual;
        let expected;
        let details = null;
        if (test.literalExpected !== undefined) {
            const result = audit(test.input);
            actual = result.romaji;
            expected = test.literalExpected;
            ok = actual === expected && result.audit.requiresReview === false;
            details = { review: result.audit.requiresReview };
        } else {
            const result = audit(test.input);
            const canonical = audit(test.expectedInput);
            actual = result.romaji;
            expected = canonical.romaji;
            ok = actual === expected && result.audit.requiresReview === canonical.audit.requiresReview;
            if (ok && test.base) {
                const baseAudit = baseAudits.get(test.base);
                if (test.expectRepeatedBase) ok = key(result.romaji) === key(baseAudit.romaji).repeat(2);
                else if (test.expectSingleBase) ok = key(result.romaji) === key(baseAudit.romaji);
                if (ok) ok = result.audit.requiresReview === baseAudit.audit.requiresReview;
                details = { baseOutput: baseAudit.romaji, baseReview: baseAudit.audit.requiresReview, review: result.audit.requiresReview };
            } else details = { review: result.audit.requiresReview, canonicalReview: canonical.audit.requiresReview };
        }
        categorySummary[test.category] ||= { passed: 0, failed: 0, total: 0 };
        categorySummary[test.category].total += 1;
        if (ok) { passed += 1; categorySummary[test.category].passed += 1; }
        else {
            categorySummary[test.category].failed += 1;
            if (failures.length < maxFailures) failures.push({ id: test.id, category: test.category, input: test.input, canonicalInput: test.expectedInput || null, expected, actual, details });
        }
    }

    const output = {
        ok: failures.length === 0 && passed === selected.length,
        partition,
        partitions,
        selected: selected.length,
        passed,
        failed: selected.length - passed,
        totalCases: cases.length,
        categorySummary,
        failures
    };
    console.log(JSON.stringify(output, null, 2));
    process.exit(output.ok ? 0 : 2);
})().catch(error => { console.error(error.stack || error); process.exit(1); });
