# Translator Data Provenance Classification

CJ2R classifies every maintained file under `data/` so its source basis remains reviewable. The machine-readable record is `data/translator-data-provenance-classification.json`; release structural QA requires complete coverage.

## Classification rules

- **project-authored/manual** — CJ2R-created rules, corrections or metadata. External material may be consulted, but the distributed data is not claimed as an imported external dataset.
- **externally-derived** — selected, transformed or generated from an identified external source.
- **mixed** — combines external evidence with project curation or more than one source family.
- **legacy/unknown** — a reliable source basis has not been established.

A `complete` entry is sufficiently documented for maintained release use. `partial` may be used during investigation, but the release gate rejects any tree containing a partial classification.

## Current totals

`data/translator-data-provenance-classification.json` contains **39** entries:

- project-authored/manual: **10**
- externally-derived: **22**
- mixed: **7**
- complete: **39**
- partial: **0**

## Notable data groups

### Common-word bank

`data/common-words/common-words-term-bank-1.json` records a source label per row. Project-reviewed rows are separated from Jitendex-derived rows (snapshot `2026-08-11`, revision `2026.08.11.0`). Jitendex-derived material remains covered by the relevant Jitendex/EDRDG/CC BY-SA notices.

### Compound fallback bank

`data/compound-words/compound-words-term-bank-1.json` is a small project-reviewed fallback set. It stores factual surface/reading data only and does not redistribute forum explanations or presentation content.

### Expanded loanword/source-spelling bank

`data/loanwords/loanwords-term-bank-1.json` is classified as **mixed**. Existing CJ2R-reviewed mappings retain precedence over conservatively accepted external candidates. The expansion uses explicit JMdict/Jitendex source-language evidence plus a filtered JMnedict subset for established company, product, work, organisation and group names; Jiten frequency is supporting/prioritisation evidence only. Ambiguous homographs, descriptive/non-name outputs and unverifiable partial-source records are excluded rather than guessed.

Runtime foreign-source output uses the project's conventional unaccented Latin/ASCII form. Typed `country-name`/`country-language` rows support only explicitly reviewed whole expressions such as `ロシア語 → Russia-go`; country mappings are not productively extended to arbitrary `～語` strings.

NINJAL loanword surveys are used only for usage/recognition and coverage-gap corroboration; CJ2R does not redistribute NINJAL survey rows or use survey presence as source-spelling authority. Relevant notices include:

- `licenses and sources/Jitendex-Jiten-JMnedict Attribution.md`
- `licenses and sources/CC BY-SA 4.0 Notice.md`
- `licenses and sources/Electronic Dictionary Research and Development Group License.md`
- `licenses and sources/NINJAL Loanword Survey Attribution.md`

### Japanese-use Han scope

`data/kanji/japanese-han-scope.json` is a compact mixed-source positive-scope supplement. It retains only selected Japanese-use facts needed by CJ2R from MJ文字情報一覧表 Ver.006.02, stable Unicode Unihan 18.0.0 Japanese-specific properties, and narrowly reviewed Japanese scholarly/library evidence for the disputed U+3106C ghost-character. It does not redistribute the full source works and does not import Chinese/Korean readings. An exact single Han may resolve only when the reviewed bank has exactly one Japanese candidate; multiple candidates remain reviewable. Han lacking positive Japanese-use evidence remains `unknown-scope` and is excluded from unresolved-Japanese metrics.

Relevant notices include:

- `licenses and sources/MJ Character Information Attribution.md`
- `licenses and sources/Unicode Data Attribution.md`
- `licenses and sources/Rare Japanese Han Evidence Sources.md`

### Kanji variants

`data/kanji/kanji-variants.json` is project-curated. Agency for Cultural Affairs material and Unicode IVD data are recorded as reference/normative evidence; comparison sources are not redistributed as datasets.

Relevant notices include:

- `licenses and sources/Japanese-Government-Data-Attribution.md`
- `licenses and sources/Unicode Data Attribution.md`

### Japanese Wikipedia proper nouns

`data/nouns/nouns-term-bank-1.json` uses a compact CJ2R-specific representation of surface forms, candidate readings, categories, weights and ranks. Source basis and reuse terms are documented in `licenses and sources/Japanese-Wikipedia-Proper-Noun-Attribution.md`.

### Reviewed counter/date and clock-time evidence

`data/grammar/counter-date-reading-evidence.json` is project-authored/manual. It stores reviewed exceptional counter/date/numeral readings rather than importing a general numeric-pronunciation dataset. The 2026-09-10 clock-time review added reviewed 0:00–23:00 hour forms and Arabic aliases; the factual Japanese readings were cross-checked against The Japan Foundation Irodori starter time tables, while final Romaji remains governed by Rule 0.

### Reviewed multiple-reading evidence

`data/reviewed-reading/reviewed-reading-evidence.json` is project-authored/manual. It records reviewed preferred readings, legitimate alternatives and narrow numeric-role metadata for cases that remain ambiguous in ordinary dictionaries.

### Contextual reading evidence

`data/reading-evidence/contextual-reading-evidence.json` is project-authored/manual. It stores CJ2R-authored contextual feature groups, weights, thresholds and legitimate candidate readings used by normal resolution and the final sentence-level verifier. External dictionary references may be consulted to verify factual readings or sense distinctions, but the distributed feature/weight data is not an imported external dataset.

### Reviewed proper-name spans

`data/nouns/reviewed-proper-name-span-evidence.json` stores project-reviewed complete-name/place spans. Rows retain their evidence description. External sources may verify factual readings or spellings, but source-page prose, design and media are not copied into the bank.

### Scoped title-reading evidence

`data/title-readings/title-reading-evidence.json` is a project-authored/manual bank for reviewed title furigana/gikun, title-specific names and official spellings. It is used where an exceptional reading belongs to a title span rather than to the same characters globally.

## External-evidence hash coverage

`data/external-evidence-source-provenance.json` pins **15** externally-derived or mixed files whose source/licence basis is specific enough for automatic verification. Structural QA checks each stored SHA-256 and referenced notice.

Project-authored/manual banks do not need an external-source hash entry merely because an external reference was consulted during review.

## Maintenance rule

When adding or replacing a file under `data/`:

1. classify it in `data/translator-data-provenance-classification.json`;
2. document the source basis without guessing;
3. if it is externally derived or mixed and its source/licence basis is pinned, add or update `data/external-evidence-source-provenance.json`;
4. refresh tracked hashes with `node tools/qa/update-external-evidence-source-provenance-hashes.js`;
5. resolve every `partial` classification before release promotion.

If a source cannot be distributed on a defensible basis, replace or remove the dependency rather than relabelling uncertainty.
