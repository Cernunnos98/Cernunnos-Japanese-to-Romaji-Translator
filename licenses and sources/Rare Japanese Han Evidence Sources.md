# Rare Japanese Han Evidence Sources

CJ2R uses a small number of manually reviewed factual reading/scope facts for rare Han characters whose Japanese use is not adequately represented by the ordinary runtime dictionaries.

## 𱁬 (U+3106C)

Japanese scholarly and library-reference evidence records the readings `たいと`, `だいと`, and `おとど`, while also describing the character as a likely ghost/legendary surname character rather than evidence of an ordinary established surname. CJ2R therefore treats it as **Japanese scope with unresolved ambiguity**, not as a confirmed surname reading.

Sources:

- 笹原宏之, 三省堂「漢字の現在」第82回「幽霊文字からキョンシー文字へ？」, 2011-02-08: https://dictionary.sanseido-publ.co.jp/column/kanji_genzai082
- 国立国会図書館 レファレンス協同データベース, record 1000152853: https://crd.ndl.go.jp/reference/detail?page=ref_view&id=1000152853

CJ2R stores only the minimal factual classification/reading evidence required for runtime use. It does not redistribute the source articles or dictionary text.

## 2026-09-11: Batch 2 269-character scope review

CJ2R reviewed all **269** KANJIDIC Han rows that had no usable Japanese `on`/`kun` reading and no existing reviewed variant/supplemental path **before adding any new runtime readings**.

The review used Japanese-language lexicographic and character-infrastructure evidence, principally:

- 漢字辞典オンライン: https://kanji.jitenon.jp/
- 民間字辞典: https://minkan.jp/
- 文字情報基盤検索システム: https://moji.or.jp/mojikibansearch/
- 漢字知識: https://kanjitisiki.com/
- Unicode Unihan Japanese-specific properties only as a secondary cross-check: https://www.unicode.org/Public/18.0.0/ucd/Unihan.zip

The review found sufficiently supported Japanese readings for **256** of the 269 characters. Those 256 are stored in `data/kanji/japanese-han-scope.json` as reviewed positive-scope evidence. Where more than one legitimate reading is recorded, CJ2R retains the alternatives and requires review rather than pretending the first candidate is certain.

Thirteen characters were deliberately **not** promoted:

- `㣺`, `䒑`, `亻`, `耂`, `艹`, `飠`, `爫`, `牜`, `犭`, `㓁`: standalone components for which the Japanese dictionary evidence explicitly lists no reading.
- `关`: Japanese dictionary evidence treats it as a component/uncertain variant and explicitly lists no reading.
- `囍`: the Japanese source explicitly lists its sound reading as unknown.
- `碵`: the source displays `セキ` only as a **convenience** reading while explicitly stating that the character's sound/meaning are uncertain and recording competing theories. CJ2R therefore does not promote `セキ` as established Japanese reading evidence.

A source conflict was resolved conservatively for `炻`: Japanese dictionary evidence and the attested Japanese word `炻器` (`せっき`) support the on-reading `セキ`; a conflicting Unicode `kJapanese` value was treated as secondary and was not imported.

Only minimal factual reading/scope evidence is stored. CJ2R does not redistribute source dictionary prose.

