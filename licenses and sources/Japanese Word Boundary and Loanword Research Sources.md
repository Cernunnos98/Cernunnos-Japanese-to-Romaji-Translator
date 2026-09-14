# Japanese word-boundary and loanword research sources

This file records linguistic and lexicographic references used to design and audit CJ2R's Japanese word-division and loanword policies. Unless another project notice explicitly says otherwise, these references are **research evidence only**: CJ2R does not redistribute their full text or datasets through this file.

## NINJAL — BCCWJ morphological units and frequency lists

National Institute for Japanese Language and Linguistics (NINJAL), *Balanced Corpus of Contemporary Written Japanese (BCCWJ)*.

- Morphological information: https://clrd.ninjal.ac.jp/bccwj/en/morphology.html
- TSV data details: https://clrd.ninjal.ac.jp/bccwj/en/tsv.html
- Public frequency lists: https://clrd.ninjal.ac.jp/bccwj/freq-list.html

Research role in CJ2R:

- establishes that Short Unit Words and Long Unit Words are distinct linguistic units rather than interchangeable output-word boundaries;
- provides an external check against treating one morphological analyser segmentation as authoritative Romaji spacing;
- public SUW/LUW frequency data may be used to measure coverage and choose representative audit material, but frequency alone does not establish a reading, source-language spelling or CJ2R output boundary.

## NINJAL — Compound Verb Lexicon

NINJAL, *Compound Verb Lexicon*.

- About/coverage: https://www2.ninjal.ac.jp/vvlexicon/about.html
- Academic Repository dataset: https://doi.org/10.15084/0002000261

Research role in CJ2R:

- distinguishes lexical `V+V` compounds from syntactic verb compounds and ordinary `V-te-V` sequences;
- documents that the lexicon principally covers conjunctive-form `V+V` compounds and excludes ordinary `V-te-V` chains, while noting a small number of lexicalised exceptions;
- supports evidence-driven treatment of compound verbs instead of the unsafe rule `continuative-form verb + following verb = join`.

The lexicon is a linguistic reference. CJ2R does not copy its definitions or example sentences into runtime data.

## NINJAL Report 126 — loanwords in public media

NINJAL, *公共媒体の外来語：「外来語」言い換え提案を支える調査研究* / *Loanwords in the Public Media: Basic Researches for “Suggestions for Paraphrasing Loanwords”*, Research Report 126, issued 2007-03-31.

- Repository record: https://repository.ninjal.ac.jp/records/1303
- DOI: https://doi.org/10.15084/00001287

Research role in CJ2R:

- provides an independent frequency-oriented inventory for measuring practical loanword coverage;
- helps identify gaps in a source-spelling bank that was previously biased toward entries carrying explicit source-language metadata;
- does **not** itself authorise an English or other source-language spelling. Candidate spellings still require separate lexical/source evidence and project review.

## Sudachi — multi-granular tokenisation

Sudachi documentation, SplitMode A/B/C.

- https://worksapplications.github.io/sudachi.rs/python/api/sudachipy.html

Research role in CJ2R:

- provides an independent implementation example in which Japanese tokenisation intentionally supports short, middle and long segmentation units;
- reinforces the architectural rule that one analyser's token boundary must not automatically become a presentation-space boundary.

CJ2R continues to use Kuromoji at runtime; Sudachi is a design reference, not a runtime dependency.

## Agency for Cultural Affairs — 外来語の表記

Agency for Cultural Affairs, Japanese-language policy material *外来語の表記*.

- Current policy page: https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gairai/
- Example list: https://www.bunka.go.jp/kokugo_nihongo/sisaku/joho/joho/kijun/naikaku/gairai/huroku01.html

Research role in CJ2R:

- corroborates established Japanese loanword orthography and the fact that foreign-derived words can have conventional Japanese spellings that do not mechanically preserve every distinction in the source language;
- supports treating Katakana spelling as Japanese orthography, not as sufficient proof of one reversible foreign spelling.

The policy material is not used to infer CJ2R source-language output mechanically.

## EDRDG / Jitendex / JMnedict

JMdict/JMnedict and Jitendex remain primary lexical evidence for CJ2R. Their snapshots, project use and licence relationship are documented separately in:

- `Jitendex-Jiten-JMnedict Attribution.md`
- `Electronic Dictionary Research and Development Group License.md`
- `CC BY-SA 4.0 Notice.md`

For loanwords, explicit source-language metadata is strong evidence but is not treated as a prerequisite for recognising that a common Katakana form is a loanword. Where source metadata is absent, CJ2R may accept a source-language spelling only after independent lexical evidence converges and competing plausible source forms have been excluded. Otherwise the surface remains review-required.

## Additional Japanese-English dictionary cross-check

**新和英** was consulted as an independent Japanese-English lexical cross-check during the loanword coverage review.

No definitions or other dictionary content from that source are redistributed by CJ2R, and this project does not assert a redistribution licence for that research copy. It is therefore not a runtime dependency or a distributed source dataset. Where it corroborated a spelling decision, the distributed CJ2R row remains a project-reviewed factual mapping and was also checked against the project's other lexical evidence.

## Evidence policy

These sources have complementary roles. CJ2R does not collapse them into one automatic authority:

1. corpus/frequency evidence answers whether a form is common enough to matter for coverage;
2. morphological research informs word-boundary mechanisms;
3. lexical dictionaries establish readings, senses and source-language evidence;
4. official spelling sources establish Japanese orthographic convention;
5. CJ2R review decides whether the evidence is strong enough to emit an authoritative source-language spelling.

When the evidence does not establish one source spelling — for example because of homographs, clippings, wasei-eigo or competing source languages — CJ2R retains mechanical Romaji and marks the result for review instead of guessing.


## NINJAL — UniDic terminology and Japanese segmentation

NINJAL, *UniDic* documentation and terminology glossary.

- UniDic overview: https://clrd.ninjal.ac.jp/unidic/about_unidic.html
- Terminology glossary: https://clrd.ninjal.ac.jp/unidic/glossary.html

Research role in CJ2R:

- confirms that Japanese so-called "morphological analysis" commonly performs segmentation into dictionary-defined word units rather than literal decomposition into linguistic morphemes;
- reinforces the distinction between analyser token boundaries and CJ2R presentation-word boundaries;
- supports treating a tokenizer split as evidence rather than proof that the source contains multiple independent lexical words.

## Japanese dictionary cross-check — 餃子 / ギョーザ

Established Japanese dictionary references were consulted to verify the kana-boundary case represented by `餃子` / `ギョーザ` / `ぎょうざ`.

- Kotobank aggregation for `餃子` (including Digital Daijisen and Seisenban Nihon Kokugo Daijiten): https://kotobank.jp/word/%E9%A4%83%E5%AD%90-479204
- Kotobank / Nipponica entry for `ギョウザ`: https://kotobank.jp/word/%E3%81%8E%E3%82%88%E3%81%86%E3%81%96-1526232

Research role in CJ2R:

- corroborates that the Japanese form is an established noun/lexical entry and a borrowing associated with Chinese;
- supports the boundary conclusion that a kana spelling of this established lexical item is one presentation word;
- does **not** justify the stronger claim that every such borrowing is synchronically one indivisible morpheme, and does not authorise generic joining of contiguous kana.

No dictionary definitions are redistributed in CJ2R; these references are research-only evidence.

## Japanese dictionary cross-check — 物の怪 / もののけ

Digital Daijisen via Kotobank was consulted to verify the lexical status and reading of `物の怪` / `もののけ`:

- Kotobank aggregation for `物の怪`: https://kotobank.jp/word/%E7%89%A9%E3%81%AE%E6%80%AA-646063

Research role in CJ2R:

- corroborates `もののけ` as an established lexical noun rather than a sequence whose presentation boundaries should follow an analyser's context-dependent token split;
- supports a reviewed whole-word boundary/reading row used when Kuromoji splits the kana spelling differently in sentence context;
- does not authorise generic joining of contiguous kana.

No dictionary definitions are redistributed in CJ2R; the reference is research-only evidence.

## Paramount Japan — STAR TREK / スター・トレック

Paramount Japan's official *STAR TREK／スター・トレック* site was consulted for the reviewed dotted Japanese title form.

- Official site: https://paramount.jp/startrek/
- Official product example pairing `スター・トレック` with `STAR TREK THE MOTION PICTURE`: https://paramount.jp/search/detail.php?id=5928

Research role in CJ2R:

- independently verifies that the written Japanese form `スター・トレック` refers to the source title *Star Trek*;
- supports the exact reviewed source-language mapping `スター・トレック` -> `Star Trek`;
- does not authorise generic removal of middle dots or mechanical inference of source-language spacing.

No Paramount site content is redistributed by CJ2R; the runtime row is a project-reviewed factual source-spelling mapping.

## Sakura Quest official site — サクラクエスト / SAKURA QUEST

The official *Sakura Quest* site was consulted for the complete Japanese title and its source-language presentation.

- Official site: https://sakura-quest.com/
- Official story index: https://sakura-quest.com/story/index.html

Research role in CJ2R:

- independently verifies that the complete written title `サクラクエスト` is presented as *SAKURA QUEST*;
- supports only the exact reviewed source-language mapping `サクラクエスト` -> `Sakura Quest`;
- does not authorise generic joining of contiguous Katakana, inference from the recognised `クエスト` suffix, or suppression of review for other partially recognised foreign-derived spans.

No site content is redistributed by CJ2R; the runtime row is a project-reviewed factual source-spelling mapping.

