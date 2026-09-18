# Historical Kana Evidence Sources

`data/historical-kana/historical-kana-evidence.json` contains a small set of reviewed spelling-to-reading facts used only by the translator's explicit historical translation path.

Primary reference:
- Agency for Cultural Affairs, *Modern Kana Usage* historical/modern comparison tables:
  - https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gendaikana/huhyo_i.html
  - https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gendaikana/huhyo_yu.html
  - https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gendaikana/huhyo_kyo.html

Additional lexical verification:
- Kotobank, `をかし` (reading `おかし`): https://kotobank.jp/word/%E3%82%92%E3%81%8B%E3%81%97-172905
- Kotobank, `思う` (historical `おもふ`; modern reading `おもう`): https://kotobank.jp/word/%E6%80%9D%E3%81%86-454753
- Kotobank, `歌う` (historical `うたふ`; modern reading `うたう`): https://kotobank.jp/word/%E6%AD%8C%E3%81%86-440093
- Kotobank, `使う` (historical `つかふ`; modern reading `つかう`): https://kotobank.jp/word/%E4%BD%BF%E3%81%86-570808
- Kotobank, `問う` (historical `とふ`; modern reading `とう`): https://kotobank.jp/word/%E5%95%8F%E3%81%86-579356
- Kotobank, `請う／乞う` (historical `こふ`; modern reading `こう`): https://kotobank.jp/word/%E8%AB%8B%E3%81%86-493776
- Kotobank, `笑う` (historical `わらふ`; modern reading `わらう`): https://kotobank.jp/word/%E7%AC%91%E3%81%86-665615
- Kotobank, `心／こゝろ` (reading `こころ`): https://kotobank.jp/word/%E5%BF%83-64563
- Aozora Bunko, Izumi Kyōtarō, *麻を刈る* (attested `涼（すゞ）しい`): https://www.aozora.gr.jp/cards/000050/files/50768_63869.html

The project does not redistribute NINJAL historical UniDic or CHJ data. Those resources remain research and QA references because their distribution and commercial-use conditions require separate consideration.

Structural historical iteration-mark references:
- Unicode Standard, CJK Symbols and Punctuation, U+3031–U+3035 and U+303B: https://www.unicode.org/charts/PDF/U3000.pdf
- Unicode Core Specification, Chapter 6, vertical kana repeat-mark semantics and `とき〲` example: https://unicode.org/versions/Unicode17.0.0/core-spec/chapter-6/
- Kotobank, `おどり字` (including `〻` and multi-kana くの字点 classification): https://kotobank.jp/word/%E3%81%8A%E3%81%A9%E3%82%8A%E5%AD%97-1514029
- Digital Daijisen via goo, `踊り字` (example `いろ〱`): https://dictionary.goo.ne.jp/word/%E8%B8%8A%E3%82%8A%E5%AD%97/

These references justify structural handling of encoded iteration symbols only. They do not authorise a general historical-kana rewrite or replace the exact lexical evidence entries above.



## Hentaigana / kuzushiji references

CJ2R historical mode uses a separate structural mapping for encoded hentaigana whose modern-kana value is unambiguous. The mapping is not inferred from glyph shape and is not enabled in normal mode.

Authoritative mapping/reference sources:
- Center for Open Data in the Humanities (CODH), *Unicode Hentaigana List*: https://codh.rois.ac.jp/char-shape/hentaigana/
  - groups the 286 encoded hentaigana U+1B001–U+1B11E by corresponding modern hiragana and identifies their base characters;
- National Diet Library, *Kuzushiji (Japanese Cursive Characters)* Research Navi: https://ndlsearch.ndl.go.jp/en/rnavi/humanities/post_1006
  - identifies hentaigana as variant kana within kuzushiji and points to the NINJAL hentaigana list/database;
- National Institute for Japanese Language and Linguistics (NINJAL), Hentaigana Database / resource index: https://www.ninjal.ac.jp/english/resources/search/ and https://cid.ninjal.ac.jp/hentaiganaDB/DB/glyph/DBindex.html
- Unicode Core Specification, Chapter 18, Kana Supplement / Kana Extended-A: https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-18/

Project-owner-supplied supplementary research guide:
- University of Kansas Libraries, Japanese cursive-script/hentaigana guide: https://guides.lib.ku.edu/c.php?g=831527&p=5936362

The KU Libraries page is retained as a supplementary research reference. Per-code-point automatic mappings in CJ2R are independently bounded by Unicode/CODH/NINJAL evidence rather than by a general assumption that every cursive glyph has one mechanically recoverable reading.

NINJAL's Hentaigana Glyph Database also records voiced and semi-voiced occurrences on encoded hentaigana. For example, its `は` and `へ` inventories distinguish base hentaigana from entries marked `濁点` and `半濁点`:
- https://cid.ninjal.ac.jp/hentaiganaDB/DB/glyph/U%2B306F.html
- https://cid.ninjal.ac.jp/hentaiganaDB/DB/glyph/U%2B3078.html

CJ2R therefore preserves dakuten and handakuten structurally only after a single-valued hentaigana has first been reduced to its maintained ordinary-hiragana value. It then reuses the ordinary kana voicing normaliser and NFC composition. A diacritic never supplies a missing base reading: multi-valued or otherwise unresolved hentaigana stay review-required.

Unicode also defines a small set of non-hentaigana historic kana with explicit ordinary-kana equivalents suitable for structural historical-mode normalisation: U+1B000 `𛀀` is an obsolete form of `エ`; U+1B123–U+1B126 are historic digraphs corresponding to `こと`, `トキ`, `トテ`, and `ヨリ`; and U+1B127/U+1B128 are older forms of `ネ`/`ヰ`. See Unicode Core Specification Chapter 18 and the Kana Extended-A names list:
- https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-18/
- https://www.unicode.org/charts/nameslist/n_1B100.html

Unicode identifies `𛄟`/`𛄠`/`𛄡`/`𛄢` as HIRAGANA LETTER ARCHAIC WU / KATAKANA LETTER ARCHAIC YI / KATAKANA LETTER ARCHAIC YE / KATAKANA LETTER ARCHAIC WU. CJ2R therefore preserves those encoded syllabic identities in historical mode rather than collapsing them to modern vowel kana. Rule 0 already uses a Hepburn base and the core extended-kana table already defines `うぅ → wu`, `いぃ → yi`, and `いぇ → ye`; the historical source forms are normalised onto those existing kana spellings and then pass through the ordinary romaniser. This is transliteration of the encoded syllable identity, not a claim that every proposed yi/ye/wu contrast is independently attested as a historical Japanese phoneme.

Eleven Unicode hentaigana are explicitly multi-valued in the maintained correspondence data: U+1B005 (`あ/を`), U+1B022 (`か/け`), U+1B03B (`き/こ`), U+1B06D (`つ/と`), U+1B07D (`と/ら`), U+1B08E (`に/て`), U+1B098 (`ね/こ`), U+1B0D6 (`ま/め`), U+1B0E2 (`や/よ`), and U+1B11D/U+1B11E (`む/も/ん`). CJ2R never assigns these a default value. Historical mode may normalise one only when the complete contiguous kana run provides surrounding kana context and exactly one candidate is backed by the existing **strong maintained whole-word kana-lexical reading index**. If zero or multiple candidates are supported, the source glyph remains unresolved/review-required. No frequency or tokenizer-likelihood heuristic participates. U+1B001 is a separate dual-identity case rather than a default hentaigana mapping: Unicode names it HIRAGANA LETTER ARCHAIC YE and also aliases it as HENTAIGANA LETTER E-1. CJ2R therefore retains two bounded historical-mode candidates, `え` and Rule-0 `いぇ`, and may select one only under the same complete-run, unique-strong-maintained-lexical-evidence rule. Standalone U+1B001 remains unresolved. All assigned historical Japanese kana-extension characters participate in run-boundary detection even if they themselves are unresolved, preventing an unresolved extension from creating a false boundary that would permit partial lexical resolution. The production resolver evaluates U+1B001 and the eleven multi-valued hentaigana jointly when they occur in the same run.

## Unicode Small Kana Extension research boundary

Unicode 17 assigns nine historic small-kana characters in the Small Kana Extension block that are relevant to CJ2R's Japanese historical-orthography boundary handling:
- U+1B132 `𛄲` HIRAGANA LETTER SMALL KO;
- U+1B150–U+1B152 `𛅐`/`𛅑`/`𛅒` HIRAGANA LETTER SMALL WI/WE/WO;
- U+1B155 `𛅕` KATAKANA LETTER SMALL KO;
- U+1B164–U+1B167 `𛅤`/`𛅥`/`𛅦`/`𛅧` KATAKANA LETTER SMALL WI/WE/WO/N.

Primary references:
- Unicode 17 Small Kana Extension names list: https://www.unicode.org/charts/nameslist/n_1B130.html
- Unicode Core Specification, Chapter 18, Small Kana Extension: https://www.unicode.org/versions/Unicode17.0.0/core-spec/chapter-18/
- Ryusei Yamaguchi, Unicode L2/16-354, *Proposal to add Kana small letters*: https://www.unicode.org/L2/L2016/16354-kana-small-ltr.pdf
- Ken Lunde, Unicode L2/10-468R2 / WG2 N3987, *Proposal to add two kana characters*: https://www.unicode.org/wg2/docs/n3987.pdf

L2/16-354 classifies small WI/WE/WO as historic letters for labialisation and gives Japanese dictionary attestations including `くゐ`/`ぐゐ` and `くゑ`/`ぐゑ`. Its phonetic-system table explicitly gives `クヰ` as [kʷi]. Independent Japanese-phonology literature likewise identifies the historical w-medial glide in the ka/ga columns and gives `クヰ` /kwi/ and `クヱ` /kwe/. CJ2R therefore normalises only the structurally attested k/g + small WI/WE combinations to its existing Rule-0 extended-kana spellings (`くぃ`, `ぐぃ`, `くぇ`, `ぐぇ` and katakana equivalents), which already produce `kwi`, `gwi`, `kwe`, and `gwe`.

This does **not** authorise a blanket Small Kana Extension rewrite. The block is mixed-use, and Unicode documents attestations from Japanese historical material as well as phonetic transcription of non-Japanese terms. In particular:
- small WO remains unresolved: L2/16-354 establishes the encoded small character and a general labialisation classification, but its cited WO examples are transcriptional and do not establish a general Japanese historical `kwo/gwo` normalisation rule;
- U+1B167 small katakana N remains unresolved: L2/16-354 explicitly classifies small N as a nasalisation letter and illustrates nasalisation, so replacing it mechanically with ordinary moraic `ン`/`n` would erase a documented distinction;
- small KO remains unresolved: L2/10-468R2 establishes distinct small KO characters used in Japanese publishing and states that they are not merely presentation forms of existing KO, but it does not establish one phonological reading transformation suitable for CJ2R.

The nine Unicode 17 historic small-kana characters are nevertheless kept inside historical contextual-kana run boundaries even when unresolved. This prevents an unsupported small kana from splitting a longer run and accidentally allowing a preceding ambiguous hentaigana fragment to resolve as if it were a complete lexical item. This is an exact code-point allow-list, not a block-wide assumption.
