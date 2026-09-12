function makeArtificialTokenisation(parts) {
    return (parts || []).map(item => {
        const spec = typeof item === 'string' ? { surface: item } : item;
        const surface = String(spec.surface || '');
        const symbol = spec.pos === '記号' || /^[!！?？。、,.~〜～]$/u.test(surface);
        const kana = /^[ぁ-ゖァ-ヶー]+$/u.test(surface);
        return {
            surface_form: surface,
            pos: spec.pos || (symbol ? '記号' : '名詞'),
            pos_detail_1: spec.pos_detail_1 || (symbol ? '一般' : '一般'),
            pos_detail_2: spec.pos_detail_2 || '*',
            pos_detail_3: spec.pos_detail_3 || '*',
            basic_form: spec.basic_form || surface,
            conjugated_type: spec.conjugated_type || '*',
            conjugated_form: spec.conjugated_form || '*',
            reading: Object.prototype.hasOwnProperty.call(spec, 'reading') ? spec.reading : (kana ? surface : null),
            pronunciation: Object.prototype.hasOwnProperty.call(spec, 'pronunciation') ? spec.pronunciation : (kana ? surface : null)
        };
    });
}

function translateArtificialTokenisation(source, parts) {
    const tokens = makeArtificialTokenisation(parts);
    const reconstructed = tokens.map(token => token.surface_form).join('');
    if (reconstructed !== source) throw new Error(`Artificial tokenisation does not reconstruct source: ${reconstructed} !== ${source}`);
    return translateTextFromTokenizationForQa(source, tokens, { overridesEnabled: false });
}

function auditArtificialTokenisation(source, parts) {
    const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics;
    const previousDiagnostics = runtimeState.lastTranslationDiagnostics;
    runtimeState.captureTranslationDiagnostics = true;
    runtimeState.lastTranslationDiagnostics = null;
    try {
        const output = translateArtificialTokenisation(source, parts);
        return { output, audit: runtimeState.lastTranslationDiagnostics };
    } finally {
        runtimeState.captureTranslationDiagnostics = previousDiagnosticsState;
        runtimeState.lastTranslationDiagnostics = previousDiagnostics;
    }
}

function getTokenisationMutationRegressionChecks() {
    const particle = (surface, detail) => ({ surface, pos: '助詞', pos_detail_1: detail });
    return [
        { id: 'MECH-TOKENISATION-MUTATION-ROKUNIN', suite: 'unit', rule: 'Alternative Kuromoji boundaries cannot change a lexically established kana span', input: 'ろくに/ん, ろく/にん, ろくにん', expected: 'Rokunin|Rokunin|Rokunin', run: () => [
            translateArtificialTokenisation('ろくにん', [{ surface: 'ろくに', pos: '副詞' }, particle('ん', '終助詞')]),
            translateArtificialTokenisation('ろくにん', ['ろく', { surface: 'にん', pos: '名詞', pos_detail_1: '非自立' }]),
            translateArtificialTokenisation('ろくにん', ['ろくにん'])
        ].join('|') },
        { id: 'MECH-TOKENISATION-MUTATION-BONNOUJI', suite: 'unit', rule: 'Lexical evidence spanning a particle-like kana outranks alternative token boundaries', input: 'ぼん/の/うじ, ぼんのう/じ, ぼんのうじ', expected: 'Bonnouji|Bonnouji|Bonnouji', run: () => [
            translateArtificialTokenisation('ぼんのうじ', ['ぼん', particle('の', '連体化'), 'うじ']),
            translateArtificialTokenisation('ぼんのうじ', ['ぼんのう', { surface: 'じ', pos: '名詞', pos_detail_1: '非自立' }]),
            translateArtificialTokenisation('ぼんのうじ', ['ぼんのうじ'])
        ].join('|') },
        { id: 'MECH-GRAMMAR-MUTATION-GRAMMATICAL-NO', suite: 'unit', rule: 'A genuine grammatical の remains grammatical while neighbouring kana boundaries vary', input: 'ぼくは麻理のなか', expected: 'Boku wa Mari no Naka', run: () => translateArtificialTokenisation('ぼくは麻理のなか', [
            'ぼく', particle('は', '係助詞'),
            { surface: '麻理', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', reading: 'マリ', pronunciation: 'マリ' },
            particle('の', '連体化'), { surface: 'なか', pos: '名詞', pos_detail_1: '非自立' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-YOTSUBATO', suite: 'unit', rule: 'Particle-like kana exposed by an artificial split is output-neutral inside a lexical span', input: 'よ/つば/と/!', expected: 'Yotsubato!', run: () => translateArtificialTokenisation('よつばと!', [particle('よ', '終助詞'), 'つば', particle('と', '並立助詞'), { surface: '!', pos: '記号' }]) },
        { id: 'MECH-GRAMMAR-MUTATION-PARTICLE-VERB-NISHITA', suite: 'unit', rule: 'Particle plus verb sequences retain their grammatical boundary independently of surrounding token partitions', input: 'コレットは死ぬことにした', expected: 'Koretto wa Shinu Koto ni Shita', run: () => translateArtificialTokenisation('コレットは死ぬことにした', [
            { surface: 'コレット', pos: '名詞', pos_detail_1: '固有名詞' }, particle('は', '係助詞'),
            { surface: '死ぬ', pos: '動詞', pos_detail_1: '自立', basic_form: '死ぬ', reading: 'シヌ', pronunciation: 'シヌ' },
            { surface: 'こと', pos: '名詞', pos_detail_1: '非自立' }, particle('に', '格助詞'),
            { surface: 'し', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_form: '連用形', reading: 'シ', pronunciation: 'シ' },
            { surface: 'た', pos: '助動詞', basic_form: 'た', reading: 'タ', pronunciation: 'タ' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-HIRUNAKA', suite: 'unit', rule: 'A false boundary inside a kana lexical word cannot introduce spacing or capitalisation', input: 'ひる/なか/の/流星', expected: 'Hirunaka no Ryuusei', run: () => translateArtificialTokenisation('ひるなかの流星', [
            { surface: 'ひる', pos: '動詞', pos_detail_1: '自立', reading: 'ヒル', pronunciation: 'ヒル' },
            { surface: 'なか', pos: '名詞', pos_detail_1: '非自立', reading: 'ナカ', pronunciation: 'ナカ' },
            particle('の', '連体化'), { surface: '流星', pos: '名詞', reading: 'リュウセイ', pronunciation: 'リュウセイ' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-SYLLABIC-N', suite: 'unit', rule: 'Splitting syllabic ん from its lexical unit cannot change apostrophe placement when source-span evidence establishes the word', input: 'し/ん/よう versus しん/よう', expected: "Shin'you|Shin'you", run: () => [
            translateArtificialTokenisation('しんよう', ['し', { surface: 'ん', pos: '名詞', pos_detail_1: '非自立' }, { surface: 'よう', pos: '名詞', pos_detail_1: '非自立' }]),
            translateArtificialTokenisation('しんよう', ['しん', { surface: 'よう', pos: '名詞', pos_detail_1: '非自立' }])
        ].join('|') },
        { id: 'MECH-GRAMMAR-MUTATION-CONJUGATION', suite: 'unit', rule: 'Equivalent token boundaries inside the lexical half of a conjugated structure do not change its output', input: 'し/て/いる versus して/いる', expected: 'Shite iru|Shite iru', run: () => [
            translateArtificialTokenisation('している', [
                { surface: 'し', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_form: '連用形', reading: 'シ', pronunciation: 'シ' },
                { surface: 'て', pos: '助詞', pos_detail_1: '接続助詞', reading: 'テ', pronunciation: 'テ' },
                { surface: 'いる', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる', reading: 'イル', pronunciation: 'イル' }
            ]),
            translateArtificialTokenisation('している', [
                { surface: 'して', pos: '動詞', pos_detail_1: '自立', basic_form: 'する', conjugated_form: '連用形', reading: 'シテ', pronunciation: 'シテ' },
                { surface: 'いる', pos: '動詞', pos_detail_1: '非自立', basic_form: 'いる', reading: 'イル', pronunciation: 'イル' }
            ])
        ].join('|') },
        { id: 'MECH-TOKENISATION-MUTATION-MIXED-SCRIPT', suite: 'unit', rule: 'Mixed Kanji/kana compounds remain stable when internal Han and kana boundaries vary but their reading evidence is retained', input: '十/字架/の/ろく/にん', expected: 'Juujika no Rokunin', run: () => translateArtificialTokenisation('十字架のろくにん', [
            { surface: '十', pos: '名詞', reading: 'ジュウ', pronunciation: 'ジュウ' },
            { surface: '字架', pos: '名詞', reading: 'ジカ', pronunciation: 'ジカ' }, particle('の', '連体化'),
            'ろく', { surface: 'にん', pos: '名詞', pos_detail_1: '非自立' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-PUNCTUATION', suite: 'unit', rule: 'A hard punctuation boundary isolates independently mutated lexical spans on each side', input: 'ぼん/の/うじ!/ろくに/ん', expected: 'Bonnouji! Rokunin', run: () => translateArtificialTokenisation('ぼんのうじ!ろくにん', [
            'ぼん', particle('の', '連体化'), 'うじ', { surface: '!', pos: '記号' },
            { surface: 'ろくに', pos: '副詞' }, particle('ん', '終助詞')
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-REVIEWED-LOANWORD', suite: 'unit', rule: 'Reviewed source-language loanword evidence may span arbitrary Kuromoji boundaries', input: 'チェン/ソー/マン', expected: 'Chainsaw Man', run: () => translateArtificialTokenisation('チェンソーマン', ['チェン', 'ソー', 'マン']) },
        { id: 'MECH-TOKENISATION-MUTATION-KANA-NAME', suite: 'unit', rule: 'Reviewed kana-name evidence may span arbitrary Kuromoji boundaries', input: 'ナウ/シカ', expected: 'Nausicaa', run: () => translateArtificialTokenisation('ナウシカ', ['ナウ', 'シカ']) },
        { id: 'MECH-TOKENISATION-MUTATION-UNKNOWN-TOKEN-SAFETY', suite: 'unit', rule: 'Unknown contiguous Katakana remains mechanically romanisable under an artificial split and retains boundary review instead of leaking Japanese or unresolved output', input: 'ヌヘ/モラ', expected: 'Nuhe Mora:true:false:false', run: () => { const result = auditArtificialTokenisation('ヌヘモラ', ['ヌヘ', 'モラ']); const output = result.output; return `${output}:${String(Boolean(result.audit?.requiresReview))}:${String(/[ぁ-ゖァ-ヶ一-龯]/u.test(output))}:${String(output.includes('[Unresolved]'))}`; } }
    ];
}
