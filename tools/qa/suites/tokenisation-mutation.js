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
        { id: 'MECH-TOKENISATION-EMPTY-RAW-FALLBACK-DIAGNOSTICS', suite: 'unit', rule: 'A non-empty source paired with an empty tokenizer result uses the bounded surface fallback and records that fallback explicitly instead of fabricating token evidence', input: 'テスト / empty raw token list', expected: '[Unresolved]|unresolved-reading|true', run: () => { const previousDiagnosticsState = runtimeState.captureTranslationDiagnostics; const previousDiagnostics = runtimeState.lastTranslationDiagnostics; runtimeState.captureTranslationDiagnostics = true; runtimeState.lastTranslationDiagnostics = null; try { const output = translateTextFromTokenizationForQa('テスト', [], { overridesEnabled: false }); const audit = runtimeState.lastTranslationDiagnostics; return `${output}|${audit?.redFlags?.[0]?.flag || ''}|${String(Boolean(audit?.requiresReview))}`; } finally { runtimeState.captureTranslationDiagnostics = previousDiagnosticsState; runtimeState.lastTranslationDiagnostics = previousDiagnostics; } } },
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
        { id: 'MECH-TOKENISATION-REVIEWED-LOANWORD-PARTICLE-COLLISION', suite: 'unit', rule: 'A reviewed source-language loanword span remains intact when an alternative kana token split would make its final fragment plus the following particle resemble another lexical reading', input: 'アイデアプロセッ / サ / は / 人気', expected: 'Idea Processor wa Ninki', run: () => translateArtificialTokenisation('アイデアプロセッサは人気', [
            { surface: 'アイデアプロセッ', pos: '名詞', pos_detail_1: '一般', reading: 'アイデアプロセッ', pronunciation: 'アイデアプロセッ' },
            { surface: 'サ', pos: '名詞', pos_detail_1: '一般', reading: 'サ', pronunciation: 'サ' },
            particle('は', '係助詞'),
            { surface: '人気', pos: '名詞', pos_detail_1: '一般', reading: 'ニンキ', pronunciation: 'ニンキ' }
        ]) },
        { id: 'MECH-TOKENISATION-INFLECTIONAL-TEDE-POS-RECOVERY', suite: 'unit', rule: 'Inflectional て/で attachment is recovered from source-span verb evidence when an alternative analyser POS mislabels the inflected stem', input: '泳い(noun) / で / 戻る', expected: 'Oyoide Modoru', run: () => translateArtificialTokenisation('泳いで戻る', [
            { surface: '泳い', pos: '名詞', pos_detail_1: '一般', reading: 'オヨイ', pronunciation: 'オヨイ' },
            particle('で', '接続助詞'),
            { surface: '戻る', pos: '動詞', pos_detail_1: '自立', basic_form: '戻る', reading: 'モドル', pronunciation: 'モドル' }
        ]) },
        { id: 'CHECK-TOKENISATION-INFLECTIONAL-TEDE-NOUN-PARTICLE-SEPARATE', suite: 'unit', rule: 'Recovering inflectional て/で from lexical evidence must not attach an ordinary case particle to a noun', input: '手 / で / 描く', expected: 'Te de Egaku', run: () => translateArtificialTokenisation('手で描く', [
            { surface: '手', pos: '名詞', pos_detail_1: '一般', reading: 'テ', pronunciation: 'テ' },
            particle('で', '格助詞'),
            { surface: '描く', pos: '動詞', pos_detail_1: '自立', basic_form: '描く', reading: 'エガク', pronunciation: 'エガク' }
        ]) },
        { id: 'MECH-TOKENISATION-GRAMMATICAL-EXPRESSION-POS-RECOVERY', suite: 'unit', rule: 'An exact maintained grammatical expression is reconstructed from source evidence even when the analyser mislabels that expression as a symbol token', input: '作品 / として(symbol) / 登場', expected: 'Sakuhin to shite Toujou', run: () => translateArtificialTokenisation('作品として登場', [
            { surface: '作品', pos: '名詞', pos_detail_1: '一般', reading: 'サクヒン', pronunciation: 'サクヒン' },
            { surface: 'として', pos: '記号', pos_detail_1: '一般', reading: 'トシテ', pronunciation: 'トシテ' },
            { surface: '登場', pos: '名詞', pos_detail_1: 'サ変接続', reading: 'トウジョウ', pronunciation: 'トージョー' }
        ]) },
        { id: 'MECH-TOKENISATION-EXACT-WORD-PARTICLE-COLLISION', suite: 'unit', rule: 'An exact whole-word dictionary span remains intact before a syntactically supported particle instead of yielding to an overlapping kana-reading alias', input: 'パン / ダ / は / 人気', expected: 'Panda wa Ninki', run: () => translateArtificialTokenisation('パンダは人気', [
            { surface: 'パン', pos: '名詞', pos_detail_1: '一般', reading: 'パン', pronunciation: 'パン' },
            { surface: 'ダ', pos: '名詞', pos_detail_1: '一般', reading: 'ダ', pronunciation: 'ダ' },
            particle('は', '係助詞'),
            { surface: '人気', pos: '名詞', pos_detail_1: '一般', reading: 'ニンキ', pronunciation: 'ニンキ' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-CORROBORATED-LEXICAL-NUMERIC-SPLIT', suite: 'unit', rule: 'A numeric-plus-counter-shaped analyser split is repairable when exact whole-span Kuromoji evidence and independent maintained lexical evidence agree and no typed numeric authority overlaps the span', input: 'ひと / 時(助数詞)', expected: 'Hitotoki:false', run: () => { const result = auditArtificialTokenisation('ひと時', [
            { surface: 'ひと', pos: '名詞', pos_detail_1: '数', reading: 'ヒト', pronunciation: 'ヒト' },
            { surface: '時', pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', reading: 'ジ', pronunciation: 'ジ' }
        ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
        { id: 'MECH-GRAMMAR-SUFFIX-PARTICLE-HOST-REJECTED', suite: 'engine', rule: 'A suffix-like analyser token cannot attach across an immediately preceding particle when no stronger morphology establishes that attachment', input: '音楽が好き', expected: 'Ongaku ga Suki', expectedRequiresReview: false },
        { id: 'CHECK-SUFFIX-PARTICLE-HOST-MO', suite: 'engine', rule: 'The same suffix-host guard applies to a different ordinary particle rather than being specific to が', input: '映画も好き', expected: 'Eiga mo Suki', expectedRequiresReview: false },
        { id: 'MECH-TOKENISATION-SUFFIX-LEXICAL-HOST-PRESERVED', suite: 'unit', rule: 'Rejecting a particle as a suffix host does not disable ordinary suffix attachment to a lexical host under the same analyser metadata', input: '中央 + 駅(接尾)', expected: 'Chuuoueki', run: () => translateArtificialTokenisation('中央駅', [
            { surface: '中央', pos: '名詞', pos_detail_1: '一般', reading: 'チュウオウ', pronunciation: 'チューオー' },
            { surface: '駅', pos: '名詞', pos_detail_1: '接尾', reading: 'エキ', pronunciation: 'エキ' }
        ]) },
        { id: 'MECH-GRAMMAR-MUTATION-GRAMMATICAL-NO', suite: 'unit', rule: 'A genuine grammatical の remains grammatical while neighbouring kana boundaries vary', input: 'ぼくは麻理のなか', expected: 'Boku wa Mari no Naka', run: () => translateArtificialTokenisation('ぼくは麻理のなか', [
            'ぼく', particle('は', '係助詞'),
            { surface: '麻理', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '人名', reading: 'マリ', pronunciation: 'マリ' },
            particle('の', '連体化'), { surface: 'なか', pos: '名詞', pos_detail_1: '非自立' }
        ]) },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-SYMBOL-MUTATION', suite: 'unit', rule: 'Changing a standalone Katakana ノ from particle analysis to symbol analysis cannot remove its grammatical output boundary when the source frame still supports that role', input: '東京 / ノ(symbol) / 空', expected: 'Toukyou no Sora', run: () => translateArtificialTokenisation('東京ノ空', [
            { surface: '東京', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', reading: 'トウキョウ', pronunciation: 'トーキョー' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '空', pos: '名詞', pos_detail_1: '一般', reading: 'ソラ', pronunciation: 'ソラ' }
        ]) },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-REVIEW-INVARIANCE', suite: 'unit', rule: 'A supported symbol-token mutation of grammatical Katakana ノ produces the same resolved review state as normal tokenisation after grammatical reconstruction', input: '東京 / ノ(symbol) / 夜 review', expected: 'Toukyou no Yoru:true:superseded', run: () => { const result = auditArtificialTokenisation('東京ノ夜', [
            { surface: '東京', pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', reading: 'トウキョウ', pronunciation: 'トーキョー' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '夜', pos: '名詞', pos_detail_1: '一般', reading: 'ヨル', pronunciation: 'ヨル' }
        ]); const signal = result.audit?.redFlags?.find(item => item.flag === 'orthographic-particle-inferred'); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}:${signal?.state || ''}`; } },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-KUROMOJI-LEXICAL-SPAN', suite: 'unit', rule: 'A unique whole-word Kuromoji dictionary reading outranks a destructive symbol split through lexical Katakana ノ', input: '山 / ノ(symbol) / 手', expected: 'Yamanote', run: () => translateArtificialTokenisation('山ノ手', [
            { surface: '山', pos: '名詞', pos_detail_1: '一般', reading: 'ヤマ', pronunciation: 'ヤマ' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '手', pos: '名詞', pos_detail_1: '一般', reading: 'テ', pronunciation: 'テ' }
        ]) },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-COMMON-LEXICAL-SPAN', suite: 'unit', rule: 'Maintained whole-word evidence survives a destructive symbol split through lexical Katakana ノ', input: 'く / ノ(symbol) / 一', expected: 'Kunoichi', run: () => translateArtificialTokenisation('くノ一', [
            { surface: 'く', pos: '名詞', pos_detail_1: '一般', reading: 'ク', pronunciation: 'ク' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '一', pos: '名詞', pos_detail_1: '数', reading: 'イチ', pronunciation: 'イチ' }
        ]) },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-PROPER-NAME-SPAN', suite: 'unit', rule: 'Unique maintained proper-name evidence survives a destructive symbol split through lexical Katakana ノ', input: '石 / ノ(symbol) / 森', expected: 'Ishinomori', run: () => translateArtificialTokenisation('石ノ森', [
            { surface: '石', pos: '名詞', pos_detail_1: '一般', reading: 'イシ', pronunciation: 'イシ' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '森', pos: '名詞', pos_detail_1: '一般', reading: 'モリ', pronunciation: 'モリ' }
        ]) },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-LONG-PROPER-NAME-BOUNDARIES', suite: 'unit', rule: 'Repairing an internal symbol split in a longer proper name restores canonical analyser boundaries instead of collapsing unrelated name components', input: '石 / ノ(symbol) / 森章太郎', expected: 'Ishinomori Shoutarou', run: () => translateArtificialTokenisation('石ノ森章太郎', [
            { surface: '石', pos: '名詞', pos_detail_1: '一般', reading: 'イシ', pronunciation: 'イシ' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '森章太郎', pos: '名詞', pos_detail_1: '一般', reading: 'モリショウタロウ', pronunciation: 'モリショウタロウ' }
        ]) },
        { id: 'MECH-TOKENISATION-KATAKANA-NO-STATION-NAME-BOUNDARIES', suite: 'unit', rule: 'Whole-name evidence repairs Katakana ノ mutation while retaining the canonical suffix boundary behaviour of the name', input: '三 / ノ(symbol) / 宮駅', expected: 'Sannomiyaeki', run: () => translateArtificialTokenisation('三ノ宮駅', [
            { surface: '三', pos: '名詞', pos_detail_1: '数', reading: 'サン', pronunciation: 'サン' },
            { surface: 'ノ', pos: '記号', pos_detail_1: '一般', reading: 'ノ', pronunciation: 'ノ' },
            { surface: '宮駅', pos: '名詞', pos_detail_1: '一般', reading: 'ミヤエキ', pronunciation: 'ミヤエキ' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-YOTSUBATO', suite: 'unit', rule: 'Reviewed title-boundary evidence remains authoritative even when an artificial tokenisation exposes particle-like kana', input: 'よ/つば/と/!', expected: 'Yotsuba to!', run: () => translateArtificialTokenisation('よつばと!', [particle('よ', '終助詞'), 'つば', particle('と', '並立助詞'), { surface: '!', pos: '記号' }]) },
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
        { id: 'MECH-TOKENISATION-MUTATION-VERB-COMPOUND-CONSENSUS', suite: 'unit', rule: 'A false split inside a lexical compound verb is repaired only when standalone Kuromoji and maintained lexical evidence agree on the complete verb span', input: '手紙を読み/返す', expected: 'Tegami o Yomikaesu:false', run: () => { const result = auditArtificialTokenisation('手紙を読み返す', [
            { surface: '手紙', pos: '名詞', pos_detail_1: '一般', reading: 'テガミ', pronunciation: 'テガミ' },
            { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
            { surface: '読み', pos: '動詞', pos_detail_1: '自立', basic_form: '読む', reading: 'ヨミ', pronunciation: 'ヨミ' },
            { surface: '返す', pos: '動詞', pos_detail_1: '自立', basic_form: '返す', reading: 'カエス', pronunciation: 'カエス' }
        ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
        { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-RECOVERY', suite: 'unit', rule: 'A noun-misparsed continuative stem is recovered before a reviewed productive compound-verb follower without depending on the original analyser POS', input: '本 / を / 読み(noun) / 直す', expected: 'Hon o Yominaosu:false', run: () => { const result = auditArtificialTokenisation('本を読み直す', [
            { surface: '本', pos: '名詞', pos_detail_1: '一般', reading: 'ホン', pronunciation: 'ホン' },
            { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
            { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
            { surface: '直す', pos: '動詞', pos_detail_1: '自立', basic_form: '直す', reading: 'ナオス', pronunciation: 'ナオス' }
        ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
        { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-FAMILY', suite: 'unit', rule: 'The same continuative-stem recovery applies to another attested verb stem before 直す', input: '手紙 / を / 書き(noun) / 直す', expected: 'Tegami o Kakinaosu:false', run: () => { const result = auditArtificialTokenisation('手紙を書き直す', [
            { surface: '手紙', pos: '名詞', pos_detail_1: '一般', reading: 'テガミ', pronunciation: 'テガミ' },
            { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
            { surface: '書き', pos: '名詞', pos_detail_1: '一般', reading: 'カキ', pronunciation: 'カキ' },
            { surface: '直す', pos: '動詞', pos_detail_1: '自立', basic_form: '直す', reading: 'ナオス', pronunciation: 'ナオス' }
        ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
        { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-DIFFERENT-FOLLOWER', suite: 'unit', rule: 'Continuative-stem recovery is evidence-based on the complete compound rather than hard-coded to one follower verb', input: '本 / を / 読み(noun) / 返す', expected: 'Hon o Yomikaesu:false', run: () => { const result = auditArtificialTokenisation('本を読み返す', [
            { surface: '本', pos: '名詞', pos_detail_1: '一般', reading: 'ホン', pronunciation: 'ホン' },
            { surface: 'を', pos: '助詞', pos_detail_1: '格助詞', reading: 'ヲ', pronunciation: 'ヲ' },
            { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
            { surface: '返す', pos: '動詞', pos_detail_1: '自立', basic_form: '返す', reading: 'カエス', pronunciation: 'カエス' }
        ]); return `${result.output}:${String(Boolean(result.audit?.requiresReview))}`; } },
        { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-LEXICAL-GUARD', suite: 'unit', rule: 'A noun-shaped stem is not joined to a following verb when the complete surface is not recognised as one lexical verb', input: '読み(noun) / 直る', expected: 'Yomi Naoru', run: () => translateArtificialTokenisation('読み直る', [
            { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
            { surface: '直る', pos: '動詞', pos_detail_1: '自立', basic_form: '直る', reading: 'ナオル', pronunciation: 'ナオル' }
        ]) },
        { id: 'MECH-TOKENISATION-MUTATION-CONTINUATIVE-COMPOUND-WHITESPACE-GUARD', suite: 'unit', rule: 'Explicit source whitespace prevents continuative compound recovery even when the surrounding token shapes otherwise match', input: '読み /space/ 直す', expected: 'Yomi Naosu', run: () => translateArtificialTokenisation('読み 直す', [
            { surface: '読み', pos: '名詞', pos_detail_1: '一般', reading: 'ヨミ', pronunciation: 'ヨミ' },
            { surface: ' ', pos: '記号', pos_detail_1: '空白', reading: ' ', pronunciation: ' ' },
            { surface: '直す', pos: '動詞', pos_detail_1: '自立', basic_form: '直す', reading: 'ナオス', pronunciation: 'ナオス' }
        ]) },
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
        { id: 'MECH-TOKENISATION-MUTATION-UNKNOWN-TOKEN-SAFETY', suite: 'unit', rule: 'Unknown contiguous Katakana remains mechanically romanisable under an artificial split and retains boundary review instead of leaking Japanese or unresolved output', input: 'ヌヘ/モラ', expected: 'Nuhe Mora:true:false:false', run: () => { const result = auditArtificialTokenisation('ヌヘモラ', ['ヌヘ', 'モラ']); const output = result.output; return `${output}:${String(Boolean(result.audit?.requiresReview))}:${String(/[ぁ-ゖァ-ヶ一-龯]/u.test(output))}:${String(output.includes('[Unresolved]'))}`; } },
        { id: 'MECH-FINAL-OUTPUT-SOURCE-AUTHORITY-LATIN-CROSSING', suite: 'unit', rule: 'Structural diagnostics reject a Latin passthrough token that crosses the end of a high-confidence immutable source candidate', input: 'synthetic Pay! crossing reviewed ラインPay boundary', expected: 'latin-passthrough-erased-source-candidate-boundary', run: () => { const tokens = [{ surface_form: 'Pay!', sourceStart: 3, sourceEnd: 7, latinPassthroughMatched: true, readingResolution: { source: 'latin-source-passthrough' }, outputBoundaryBefore: 'space' }]; const candidates = [{ sourceStart: 0, sourceEnd: 6, sourceSurface: 'ラインPay', category: 'loanword', evidenceSource: 'source-language-loanword', romaji: 'LINE Pay', reading: null, confidence: 1, reviewRequired: false }]; return validateSourceSpanAuthorityPreservation(tokens, candidates).violations.map(item => item.reason).join('|'); } },
        { id: 'MECH-TOKENISATION-VARIANT-CANONICAL-SOURCE-SPAN-OWNERSHIP', suite: 'unit', rule: 'Canonical retokenisation of a supported name glyph variant retains its verified original source span instead of relocating the canonical glyph to a later matching source character', input: '先㠀諸島 source-span ownership', expected: 'true:1:2:㠀', run: () => { const audit = runTranslatorReadingAudit('先㠀諸島'); const reading = audit.readings.find(item => (item.semanticAnnotationOwnership || []).some(owner => owner?.sourceSurface === '㠀' && (owner?.annotations || []).includes('variantCanonicalRetokenized'))); return `${String(Boolean(audit.structuralValidation?.valid))}:${reading?.sourceStart ?? ''}:${reading?.sourceEnd ?? ''}:${reading?.sourceSurface || ''}`; } },
        { id: 'MECH-FINAL-OUTPUT-SOURCE-AUTHORITY-OVERSIZED-TOKEN', suite: 'unit', rule: 'Structural diagnostics reject a final token that still buries an immutable reviewed boundary inside an oversized tokenizer span', input: 'synthetic グレンラガンフィギュア crossing reviewed-name/loanword boundary', expected: 'immutable-source-authority-boundary-erased', run: () => { const tokens = [{ surface_form: 'グレンラガンフィギュア', sourceStart: 0, sourceEnd: 11, outputBoundaryBefore: 'none' }]; const candidates = [{ sourceStart: 0, sourceEnd: 6, sourceSurface: 'グレンラガン', category: 'name', kind: 'reviewed-name', evidenceSource: 'reviewed-proper-name-span', romaji: 'Gurren Lagann', reading: 'ぐれんらがん', confidence: 1, reviewRequired: false, metadata: { priority: 100 } }, { sourceStart: 6, sourceEnd: 11, sourceSurface: 'フィギュア', category: 'loanword', kind: 'loanword', evidenceSource: 'source-language-loanword', romaji: 'Figure', reading: null, confidence: 1, reviewRequired: false, metadata: { priority: 90 } }]; return validateSourceSpanAuthorityPreservation(tokens, candidates).violations.map(item => item.reason).join('|'); } },
        { id: 'MECH-FINAL-OUTPUT-VALIDATOR-CONTROL', suite: 'unit', rule: 'Final structural validation accepts a coherent token stream whose recorded spaces agree with the boundary classifier and rendered Romaji', input: 'synthetic 雪 / 降る boundary control', expected: 'true:0', run: () => { const tokens = [
            { surface_form: '雪', pos: '名詞', value: 'Yuki', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
            { surface_form: '降る', pos: '動詞', value: 'furu', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'space' }
        ]; const result = validateFinalOutputEvidenceConsistency(tokens, 'Yuki Furu', '雪降る'); return `${String(result.valid)}:${result.violations.length}`; } },
        { id: 'MECH-FINAL-OUTPUT-VALIDATOR-MISSING-PROVENANCE', suite: 'unit', rule: 'Final structural validation rejects a token whose output boundary was rendered without recorded boundary provenance', input: 'synthetic 光 / 差す missing provenance', expected: 'missing-boundary-provenance', run: () => { const tokens = [
            { surface_form: '光', pos: '名詞', value: 'Hikari', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
            { surface_form: '差す', pos: '動詞', value: 'sasu', readingResolution: { source: 'kuromoji-context' } }
        ]; return validateFinalOutputEvidenceConsistency(tokens, 'Hikari Sasu', '光差す').violations.map(item => item.reason).join('|'); } },
        { id: 'MECH-FINAL-OUTPUT-VALIDATOR-JOIN-CONTRADICTION', suite: 'unit', rule: 'Final structural validation rejects a rendered space when lexical/morphological join evidence requires attachment', input: 'synthetic 読み / 返す join contradiction', expected: 'boundary-metadata-contradiction|join-evidence-rendered-separate', run: () => { const tokens = [
            { surface_form: '読み', pos: '動詞', value: 'Yomi', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
            { surface_form: '返す', pos: '動詞', value: 'kaesu', readingResolution: { source: 'kuromoji-context' }, morphologicalJoinLeft: true, morphologicalJoinReason: 'compound-verb', morphologicalJoinAuthority: 'lexical-compound', outputBoundaryBefore: 'space' }
        ]; return validateFinalOutputEvidenceConsistency(tokens, 'Yomi Kaesu', '読み返す').violations.map(item => item.reason).sort().join('|'); } },
        { id: 'MECH-FINAL-OUTPUT-VALIDATOR-SEPARATION-CONTRADICTION', suite: 'unit', rule: 'Final structural validation rejects a join that contradicts an explicit reviewed separation boundary', input: 'synthetic 学校 / 生活 reviewed separation', expected: 'reviewed-separate-boundary-rendered-joined', run: () => { const tokens = [
            { surface_form: '学校', pos: '名詞', value: 'Gakkou', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
            { surface_form: '生活', pos: '名詞', value: 'seikatsu', readingResolution: { source: 'kuromoji-context' }, reviewedLexicalBoundaryBefore: true, outputBoundaryBefore: 'join' }
        ]; return validateFinalOutputEvidenceConsistency(tokens).violations.filter(item => item.reason === 'reviewed-separate-boundary-rendered-joined').map(item => item.reason).join('|'); } },
        { id: 'MECH-FINAL-OUTPUT-VALIDATOR-RENDERED-OUTPUT', suite: 'unit', rule: 'Final structural validation independently rejects final Romaji whose actual spacing no longer matches a coherent boundary-provenance stream', input: 'synthetic 星 / 光る output mutation', expected: 'rendered-output-contradiction', run: () => { const tokens = [
            { surface_form: '星', pos: '名詞', value: 'Hoshi', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'none' },
            { surface_form: '光る', pos: '動詞', value: 'hikaru', readingResolution: { source: 'kuromoji-context' }, outputBoundaryBefore: 'space' }
        ]; return validateFinalOutputEvidenceConsistency(tokens, 'HoshiHikaru', '星光る').violations.map(item => item.reason).join('|'); } },
        { id: 'MECH-FINAL-OUTPUT-KATAKANA-SYMBOL-BOUNDARY', suite: 'unit', rule: 'Final diagnostics and emitted Romaji agree on the explicit space before a recovered Katakana ノ particle even when the tokenizer originally labelled it as a symbol', input: '東京ノ空 output provenance', expected: 'Toukyou no Sora:space:particle-boundary:grammar', run: () => { const previous = runtimeState.captureTranslationDiagnostics; try { runtimeState.captureTranslationDiagnostics = true; const output = translateText('東京ノ空'); const reading = runtimeState.lastTranslationDiagnostics?.readings?.find(item => item.sourceSurface === 'ノ'); return `${output}:${reading?.outputBoundaryBefore || ''}:${reading?.outputBoundaryReason || ''}:${reading?.outputBoundaryAuthority || ''}`; } finally { runtimeState.captureTranslationDiagnostics = previous; } } },
        { id: 'MECH-FINAL-OUTPUT-VALIDATOR-SYMBOL-BOUNDARY-CONTRADICTION', suite: 'unit', rule: 'The final verifier reconstructs output independently from recorded boundary provenance so a renderer shortcut cannot silently discard an explicit space', input: 'synthetic 東京 / ノ renderer bypass', expected: 'rendered-output-contradiction', run: () => { const tokens = [
            { surface_form: '東京', value: 'Toukyou', pos: '名詞', outputBoundaryBefore: 'none' },
            { surface_form: 'ノ', value: 'no', pos: '助詞', particle: true, grammatical: true, outputBoundaryBefore: 'space' }
        ]; const result = validateFinalOutputEvidenceConsistency(tokens, 'Toukyouno', '東京ノ'); return result.violations.map(item => item.reason).includes('rendered-output-contradiction') ? 'rendered-output-contradiction' : result.violations.map(item => item.reason).join('|'); } }
    ];
}
