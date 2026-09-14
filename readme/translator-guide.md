# Translator Data and Evidence Guide

This guide explains CJ2R's runtime data: what each evidence family is for, how strongly it may influence translation, and how to change it safely.

For other systems, use the document that owns them:

- output rules: `readme/Romaji Rules.docx` (Rule 0);
- JavaScript source: `src/translator/translator-source-development-guide.md`;
- website integration: `readme/translator-integration-guide.md`;
- exact control-flow: `readme/cj2r-architectural-control-flow.md`;
- Japanese word-division semantics: `readme/cj2r-japanese-word-boundary-specification.md`;
- release QA: `tools/qa/translator-release-qa-guide.md`.

Rule 0 is authoritative. Dictionaries, frequency data and external sources provide evidence; they do not automatically define CJ2R output.

## 1. Data philosophy

CJ2R does not treat one dictionary as a universal answer source. The complete normalised sentence reaches Kuromoji first so morphological context is preserved. Reviewed data then acts at defined points to recognise spans, repair tokenisation, supply readings, preserve official spellings, handle grammar or surface uncertainty.

The important boundaries are:

- prefer whole-word and whole-name evidence to Kanji-by-Kanji reading;
- never destructively slice ordinary input before Kuromoji;
- use source-language spelling only where Rule 0 and reviewed evidence justify it;
- use attested Rendaku evidence rather than blanket voicing rules;
- use reviewed counter/date/numeral forms rather than a generic pronunciation heuristic;
- keep genuinely ambiguous names/readings reviewable;
- never hide unresolved Han by inventing a reading.

If a proposed data entry needs to break one of these boundaries, the problem probably belongs in translator logic instead.

## 2. Data families

### `data/Overrides/`

CJ2R has two explicit override banks.

`overrides.json` is an exact complete-input exception. It may legitimately contain no live overrides; underscore-prefixed metadata alone is a valid empty state.

`context-overrides.json` is a last-resort, source-context-specific replacement used only when no more precise evidence or morphology mechanism can express the correction. It is checked after full-sentence tokenisation and may also be empty.

Do not use either bank to hide a reusable lower-level bug.

### `data/title-readings/`

`title-reading-evidence.json` stores reviewed readings or direct Romaji that are valid only inside a recognised title/work-name context. Typical uses include:

- title furigana or gikun;
- title-specific name readings;
- official spellings that must not become global lexical rules.

Entries carry a `surface`, full-source `pattern`, evidence `kind`, source information and either a kana `reading`, final `romaji`, or both as required by the schema.

Title evidence is merged only after Kuromoji has tokenised the complete sentence. Its patterns and surfaces are canonicalised after Kanji-variant data is available so matching uses the same normalised orthography as the translation pipeline.

A small number of title-specific formatting behaviours are deliberately tied to explicit evidence kinds. For example, `title-compact-numeric-prefix` may attach a reviewed title prefix to an adjacent ASCII fraction such as `1/2`; this permission must not become a general word+number join rule.

Japanese `―` remains a normal tight em dash in ordinary text. Only the source-specific paired terminal subtitle form (`Title―Subtitle―`) receives spaced em-dash formatting. This is a punctuation rule, not a reason to broaden title evidence.

Use this bank only when the exceptional fact belongs to a title span. Ordinary lexical readings belong elsewhere.

### `data/common-words/`

This bank contains small, reviewed ordinary-word evidence used to correct demonstrated lexical or token-boundary failures.

Every row provides a kana `reading`. Object rows may also contain:

- a full-source `pattern` for scope;
- a final Rule-0 `romaji` when a stable internal output boundary cannot be reconstructed from one kana reading alone;
- a supported `conjugationClass` for explicitly modelled productive morphology.

Direct `romaji` is for genuine lexical formatting evidence such as `元カノ → Moto Kano`, not for splitting normal compounds simply because their internal morphology is visible.

Reviewed kana common-word evidence may also repair a Kuromoji boundary that falls inside the final kana token of a span. This is intentionally narrow: the reviewed span must cross an existing token boundary, its pattern must match, and CJ2R may split only the final token needed to expose the span. It does not perform arbitrary substring segmentation inside one token.

For supported productive morphology, store the reviewed lemma rather than every inflected surface. The current explicit class is `godan-ra`.

### Productive morphology repair

CJ2R has two narrow morphology repairs before later lexical merging:

1. Kuromoji metadata can reconstruct productive `たがる` chains, including supported contractions and a bounded recovery for the common unpunctuated `た + が + って` misparse after a verb continuative. Punctuation blocks that recovery.
2. Reviewed common-word lemmas with a supported `conjugationClass` can derive ordinary inflected surfaces.

These are metadata/evidence-driven mechanisms, not suffix scanners over arbitrary kana strings.

### `data/general-words/`

General-word evidence is a weaker lexical fallback. A single-reading entry may rescue a span that would otherwise become unresolved, but it should not override sound grammar or stronger contextual evidence simply because the row exists.

### `data/compound-words/`

Contains established compounds used as whole-word evidence after Kuromoji analysis. Compound evidence must never be used to remove the surface from raw input before tokenisation.

### `data/ateji/`

Contains reviewed whole-word ateji readings. Ateji is resolved as a lexical unit, not by choosing a reading for each Kanji separately.

### `data/loanwords/`

Contains reviewed source-language mappings where Rule 0 requires them. The maintained bank is a **mixed** evidence set: existing CJ2R-reviewed decisions retain precedence, while conservatively accepted JMdict/Jitendex and JMnedict evidence expands lexical loanwords, companies, products, works, organisations and similar established foreign-derived expressions.

A reviewed whole-expression mapping is atomic. The stored output controls its word recognition, internal spacing and capitalisation; CJ2R must not reconstruct that output from Kuromoji pieces or title-case it afterwards. Longest complete reviewed matches therefore outrank shorter loanword components. Normalised input aliases may be registered for width-equivalent spellings so mixed/full-width Latin or digit forms still reach the same reviewed mapping.

Runtime foreign-source output uses CJ2R's conventional unaccented Latin/ASCII form. The original source spelling, including diacritics, belongs in provenance/audit evidence rather than being silently discarded. For example, reviewed evidence may produce `デビュー → Debut` and `メルヘン → Marchen` while retaining the accented donor spelling in the audit record.

The bank also supports narrowly typed `country-name` and `country-language` rows. A reviewed modern language-name compound such as `ロシア語 → Russia-go` or `トルコ語 → Turkey-go` is an explicit whole-expression decision, not a productive rule. A bare country mapping must not leak into an unreviewed `country + 語` string; for example, `イギリス → United Kingdom` does not authorise `イギリス語 → United Kingdom-go`.

Source-language spelling remains evidence-driven. Explicit JMdict/Jitendex source-language metadata is strong evidence, but a common loanword may also be accepted when independent lexical evidence converges on one source form and materially competing spellings or senses have been excluded. Frequency evidence may identify coverage gaps; it is not spelling authority. Orthographic variants containing a middle dot are not inferred from an undotted entry: a dotted form receives source-language output only when that exact written form has its own reviewed evidence.

When a surface is established as foreign-derived but one source spelling is not sufficiently established, the bank may store a metadata-only row with `requiresReview: true` and a `reviewReason`, without an authoritative `output`. Runtime then retains mechanical Rule-0 Romaji and a review signal rather than inventing a global foreign spelling. This is appropriate for unresolved homographs, clippings, abbreviations and wasei-eigo.

Do not guess a foreign spelling from katakana. If Kuromoji emits several reviewed loanwords as one katakana token, CJ2R may split it only when:

- no reviewed whole-token spelling exists; and
- exactly one complete segmentation into reviewed loanword entries is possible.

Ambiguous segmentations, conflicting homographs, unverifiable partial-source records and descriptive/non-name outputs remain excluded or reviewable rather than being promoted for coverage.


### `data/nouns/`

Contains proper-noun evidence, including compact maintained name banks and reviewed exact-span repairs.

Proper-name evidence is deliberately context-sensitive. A possible name reading in a dictionary is not automatically valid everywhere the same surface occurs.

`reviewed-proper-name-span-evidence.json` stores complete reviewed name/place spans that may repair a bad Kuromoji split after tokenisation. Unknown or genuinely ambiguous names should remain review signals.

### `data/grammar/`

Key files are:

- `particle-expressions.json` — approved particle-based/grammatical expressions whose output follows Rule 0's lowercase treatment;
- `conjugation-patterns.json` — bounded conjugation and token-repair configuration;
- `counter-date-reading-evidence.json` — reviewed irregular counter, date and numeral forms.

Counter/date evidence records whole-form decisions. It is not a generic number or Rendaku engine. A reviewed contextual lexical reading may suppress a competing minute interpretation only in the context it actually covers; the maintained `三分する → Sanbun Suru` and `四分する → Shibun Suru` evidence therefore does not change ordinary `三分待つ → Sanpun Matsu` or `四分待つ → Yonpun Matsu`.

A bare terminal `一日` is role-ambiguous: both the calendar reading `ついたち` and the one-day duration reading `いちにち` are legitimate without resolving context. CJ2R keeps `Tsuitachi` as the provisional printable output but marks the final result review-required with `temporal-role-ambiguous`. Month/date context, duration predicates and recognised frequency structures continue to resolve the role normally; punctuation alone does not resolve it.


Japanese fractions are handled structurally rather than by adding phrase overrides. An exact `[numeral]分の[numeral]` source span selects the fraction role, keeps denominator `分` as `ぶん`, and exposes grammatical `の` to the normal Rule 0 particle output policy (for example, `三分の一 → Sanbun no Ichi`). The rule does not apply when the material after `分の` is not a numeral.

Katakana `ノ` is not assumed to be grammatical merely because of its shape. If the analyser labels a standalone `ノ` between lexical spans as a symbol, CJ2R may create a provisional reviewable `の` particle interpretation from source-span evidence only when no stronger reviewed lexical/name/title span contains it. If the final grammatical and boundary reconstruction confirms that role without an incompatible surviving interpretation, the provisional review signal is superseded rather than remaining active; its provenance remains in the audit. Unresolved or conflicting cases remain review-required. Output rendering follows the same boundary metadata used by ordinary particles, so symbol handling cannot bypass an explicit boundary. This covers cases such as `桃源郷ノ蜜事 → Tougenkyou no Mitsugoto` without breaking lexical forms such as `モノノ怪`, `山ノ手`, `くノ一` or `ノート`.

A false split inside a compound verb is repaired only from converging evidence. If Kuromoji has misclassified a supported Godan continuative stem as a noun, the maintained lemma must prove that stem, standalone Kuromoji must independently recognise the exact contiguous combined surface as one ordinary verb, and the whole-token reading must equal the independently established stem and follower readings. Whitespace or a combined surface that is not recognised as one verb blocks this repair; CJ2R does not apply a generic `continuative form + verb = compound` rule.

Compound morphology establishes a boundary, not automatically a pronunciation. If a normally tokenised continuative stem still has independently supported readings, joining it to a following lexical verb does not clear that reading ambiguity. Exact tokenisation-recovery evidence may clear only uncertainty created by the damaged partition when the complete recovered verb and its component readings independently agree.

Review signals have explicit lifecycle ownership. An active signal records its source span, reason and evidence. A recognised structural, grammatical or morphological resolver may supersede only the uncertainty that it actually settles, while the earlier signal remains in audit provenance. For example, a non-basic Ichidan inflection may resolve a whole-lemma reading conflict only when conjugation metadata and the selected stem uniquely match one maintained candidate; the unresolved basic form remains review-required.


### `data/reviewed-reading/`

`reviewed-reading-evidence.json` stores project-reviewed decisions for otherwise unresolved multiple-reading cases. It can record a preferred reading, legitimate alternatives and narrow contextual metadata. It should resolve only the scope justified by the evidence; it is not a global character-reading table.

### `data/reading-evidence/`

Contains supporting evidence for competing or weak readings. Frequency can contribute to review, but frequency alone does not decide the reading of the current sentence.

If context still does not distinguish legitimate alternatives, keep the case ambiguous.
A selected Kuromoji reading does not erase an independently supported incompatible maintained reading for the same surface. Such cross-source disagreement remains reviewable, and the audit retains all supported readings. Surrounding words only clear ambiguity when a recognised contextual resolver actually selects one of those supported readings; their mere presence is not evidence of resolution.

### `data/rendaku/`

Contains attested Rendaku and non-Rendaku readings for reviewed compounds. The complete reading is stored explicitly.

This bank is not a training set for a general voicing heuristic. One attested compound does not authorise voicing in unrelated unseen compounds.

### `data/historical-kana/`

Contains reviewed historical spellings and readings. It is consulted only by the explicit historical APIs.

Do not turn historical evidence into global substitutions such as `へ → え` or `を → お` in normal translation.

### `data/kanji/`

Contains KANJIDIC-derived data for the reusable Kanji Readings capability and reviewed variant normalisation. The supplied UI is one consumer; custom integrations may use the public readings API or an explicit rendering target.

Kanji Readings are not a contextual word resolver. Their On'yomi/Kun'yomi lists must not be used to construct an unknown word one character at a time.

`kanji-variants.json` distinguishes general lookup-safe variants from name-only variants. Keep those scopes separate.

### `data/dict/`

Contains the Kuromoji/IPADIC dictionary bundle. These filenames are part of Kuromoji's loading contract.

Replacing or renaming this bundle is a substantial runtime change and requires full regression/browser review.

## 3. Critical, optional and non-runtime data

The asset registry in `src/translator/01-assets-and-schemas.js` is authoritative.

- **Critical runtime data** must load and pass schema validation before CJ2R reports readiness. This includes Kuromoji dictionaries, main lexical banks, Kanji banks, core grammar and reviewed-reading evidence.
- **Optional runtime data** may fail with a warning while the translator remains usable. Overrides, title readings, variants, reviewed proper-name spans, reading evidence, Rendaku and historical-kana evidence are in this category.
- **Non-runtime project data** includes provenance/classification records used by release tooling rather than by browser translation.

See `readme/translator-required-files-summary.md` for the current file-level summary.

## 4. Where evidence enters the pipeline

The evidence banks do not all compete at one point. At a high level:

1. an enabled exact whole-input override may return before ordinary conversion;
2. otherwise the complete normalised sentence reaches Kuromoji;
3. post-tokenisation passes repair/merge spans using narrowly scoped evidence;
4. the reading resolver selects the safest supported reading or direct Romaji;
5. Rule 0 conversion and final formatting are applied;
6. audit signals record uncertainty where no confident decision is justified.

This is why the same surface can appear in several banks without those entries having equal authority.

For exact pass order and resolver precedence, use `readme/cj2r-architectural-control-flow.md` rather than duplicating that order here.

## 5. Choosing the correct evidence layer

Use the narrowest layer that accurately describes the fact:

| Fact | Preferred layer |
| --- | --- |
| Complete input is one indivisible reviewed exception | Exact override |
| Source-context-specific exception with no narrower home | Contextual override |
| Title-only reading/gikun/name/spelling | Title-reading evidence |
| Ordinary reviewed lexical reading | Common/general word bank |
| Established compound | Compound bank |
| Whole-word ateji | Ateji bank |
| Source-language loanword spelling | Loanword bank |
| Proper name/place | Noun/name evidence |
| Particle or bounded grammar behaviour | Grammar data |
| Irregular counter/date/numeral | Counter/date evidence |
| Attested Rendaku/non-Rendaku | Rendaku evidence |
| Competing/weak reading | Reading evidence or reviewed-reading evidence |
| Historical spelling | Historical-kana evidence |

If no existing family can express a correction without abusing its scope, inspect the translator logic instead of creating a convenient exception in the wrong bank.

## 6. Safe data editing

### Preserve review context

Keep the established schema and any source, confidence, category, variant-scope or provenance fields needed to understand a record. Do not reduce a reviewed entry to a surface/answer pair when the data family records more than that.

### Do not import dictionaries wholesale

External dictionaries are candidate/reference sources, not automatic runtime authority. Broad imports can introduce ambiguous names, uncommon readings or conventions that conflict with Rule 0. Existing project-reviewed mappings take precedence over bulk-derived candidates, and any candidate whose complete source scope, identity or formatting cannot be justified should stay out of the runtime bank.

For loanwords specifically, preserve the distinction between the compact runtime bank and its audit evidence. Do not copy descriptive JMnedict glosses, multiple aliases, unresolved homographs or uncertain partial-source etymologies into `loanwords-term-bank-1.json` merely to increase coverage.

Use the controlled review paths:

- Yomitan snapshots → `tools/evidence-candidate-generation/`;
- maintained EDRDG-derived sources → `tools/edrdg-update/`.

### Do not use frequency as a verdict

Frequency is supporting evidence, not proof that the most common reading applies in the current sentence.

### Do not hide uncertainty

If several readings remain legitimate, keep the case reviewable. Do not force a winner merely to make QA green.

### Preserve full-sentence tokenisation

Apart from the explicit exact whole-input override, evidence should act after the complete sentence has reached Kuromoji.

## 7. Provenance

CJ2R uses two project-level records:

- `data/external-evidence-source-provenance.json` pins sufficiently specific external source bases and project-file hashes;
- `data/translator-data-provenance-classification.json` classifies every maintained file under `data/`.

The human-readable summary is `readme/translator-data-provenance-classification-audit.md`.

NINJAL loanword surveys are used only as usage/recognition and coverage-gap corroboration. They do not supply runtime source spelling, and CJ2R does not redistribute the survey rows. See `licenses and sources/NINJAL Loanword Survey Attribution.md`.

A `partial` classification may be used while investigating provenance, but it cannot ship in a release tree.

After intentionally changing a file already tracked by the external-evidence manifest, refresh only its recorded hash with:

```bash
node tools/qa/update-external-evidence-source-provenance-hashes.js
```

Check without writing:

```bash
node tools/qa/update-external-evidence-source-provenance-hashes.js --check
```

The updater does not invent source metadata. If the source basis, snapshot, licence or version changed, review that metadata separately.

## 8. Maintained external evidence sources

CJ2R currently uses several external source families in controlled ways:

- **Jitendex/JMdict** — reviewed lexical/reading evidence; current refreshes go through the EDRDG updater.
- **JMnedict** — compact reviewed proper-name support; dictionary presence alone does not make a reading globally authoritative.
- **Jiten frequency evidence** — supporting evidence only.
- **NINJAL Rendaku material** — supports explicit reviewed compounds, not a blanket voicing rule.
- **Historical-kana references** — support exact reviewed historical forms; broad research datasets are not automatically redistributed.
- **jkindrix/japanese-language-data** — bounded reference for conjugation coverage, not a wholesale imported grammar/dictionary source.
- **Japanese Wikipedia and reviewed proper-noun sources** — compact attributed name evidence subject to CJ2R's name safeguards.
- **Kuromoji/IPADIC** — morphological analyser and token readings; it is not Rule 0 and does not automatically outrank stronger reviewed evidence.

Source and licence records are kept under `licenses and sources/`.

## 9. Evidence candidate generation

The Yomitan candidate generator accepts a hash-pinned extracted snapshot and produces a deterministic review-only file. It refuses an unexpected snapshot hash and cannot write into runtime `data/`.

Only individually justified candidates should be promoted into live CJ2R evidence.

See `tools/evidence-candidate-generation/yomitan-evidence-candidate-generation-guide.md`.

## 10. EDRDG-derived data maintenance

Use:

```text
tools/edrdg-update/cj2r-edrdg-updater.js
```

The updater separates **prepare** from **apply**. Preparation stages and validates source archives, rechecks maintained derivatives and creates a review manifest. Application requires the exact reviewed manifest hash, runs the release gate before and after promotion, and rolls back promoted files if the live gate fails.

It does not add every new upstream dictionary entry automatically.

See `tools/edrdg-update/cj2r-edrdg-updater-guide.md`.

## 11. Testing a data change

For a normal data correction:

1. reproduce the faulty behaviour;
2. confirm the intended result against Rule 0 and suitable evidence;
3. choose the narrowest correct data family;
4. preserve that family's schema and provenance requirements;
5. add/strengthen permanent regression coverage when warranted;
6. rebuild `tools/qa/translator-qa.js` if QA source changed;
7. refresh provenance hashes if a tracked evidence file changed;
8. use the QA Dashboard for the relevant focused checks and, when release certification is required, **Comprehensive release QA**.

On Windows, `tools/qa/Open CJ2R QA Dashboard.cmd` is the primary QA method: double-click it, use the relevant focused scan while diagnosing, then choose **Comprehensive release QA** for release certification. Direct command-line runners are secondary/manual options.

Ordinary JSON changes do not require an engine rebuild. If JavaScript also changed, the direct command-line equivalent can rebuild first with:

```bash
node tools/qa/run-translator-release-qa.js --build
```

Without a JavaScript rebuild, the direct command-line equivalent is:

```bash
node tools/qa/run-translator-release-qa.js
```

## 12. Scope of this guide

This document answers three questions: **what CJ2R's data means, where a linguistic fact belongs, and how to change evidence without giving it more authority than the evidence supports**.

For setup, source code, integration, QA or exact pass order, use the specialist guides listed at the top instead of duplicating those systems here.
