# Translator Source Development Guide

`src/translator/` is the editable JavaScript source for CJ2R. `translator-engine.js` is generated from these ordered modules and should not be edited directly.

`00-contracts.js` contains shared JSDoc contracts only. The generated engine is checked with TypeScript `checkJs`, so keep the contracts aligned with annotations actually written by the pipeline and prefer accurate JSDoc types over broad casts that weaken the static checks.

## 1. Normal workflow

1. Edit the module that owns the behaviour.
2. Rebuild the engine:

```bash
node tools/build-translator-engine.js
```

3. Run QA through the QA Dashboard. On Windows, this is the primary method: open `tools/qa/`, double-click **`Open CJ2R QA Dashboard.cmd`**, then choose **Comprehensive release QA** when release certification is required. The direct command-line equivalent is:

```bash
node tools/qa/run-translator-release-qa.js
```

Or rebuild and test in one command:

```bash
node tools/qa/run-translator-release-qa.js --build
```

The complete gate requires Node.js, Python 3, TypeScript (`tsc`), Chromium/Chrome and Graphviz `dot`. Static checking supports TypeScript >=5.8.0 and <7.0.0; the runner rejects versions outside that range so compiler-default changes cannot silently redefine the release gate. `CJ2R_PYTHON`/`PYTHON` and `CHROMIUM` may be used when those executables are installed in non-standard locations.

Ordinary JSON changes under `data/` do not require an engine rebuild unless JavaScript loading/schema/interpretation code also changes.

## 2. Module ownership

- `00-contracts.js` — shared JSDoc contracts; no runtime behaviour.
- `01-assets-and-schemas.js` — asset paths, failure policy and JSON schemas.
- `02-ui-controls.js` — optional UI references, including explicit Kanji Readings consumers, and visibility controls.
- `03-runtime-state.js` — mutable translator state, evidence groups and CJ2R-owned diagnostic coordination state.
- `04-data-and-kanji-loaders.js` — shared JSON loading, reusable Kanji Readings data/rendering and overrides.
- `05-romaji-core.js` — input normalisation and deterministic kana-to-Romaji mechanics.
- `06-lexical-and-evidence-loaders.js` — lexical/evidence loading, indexes and proper-noun candidates.
- `07-token-merging.js` — reviewed post-Kuromoji lexical/span merging.
- `08-reading-resolver.js` — reading selection, contextual evidence scoring, name ranking and Kuromoji safeguards.
- `09-token-repair-and-grammar.js` — typed temporal/numeric analysis, morphology, boundary/role repair, grammar and output-boundary annotations.
- `10-output-and-translation-pipeline.js` — authoritative-span rescue, resolver precedence, sentence-level resolution verification, output assembly, diagnostics and audit policy.
- `11-public-api-and-bootstrap.js` — initialisation, UI/binding lifecycle and public API.

The numeric order is intentional. If modules are added, renamed or reordered, update the build tooling and run the complete release gate.

Check generated parity without writing:

```bash
node tools/build-translator-engine.js --check
```

Run the static check directly with:

```bash
node tools/qa/run-translator-typecheck.js
```

The static gate intentionally uses `checkJs` plus `strictNullChecks`; it does not claim full TypeScript strict-mode coverage. The runner passes that policy explicitly (`strict=false`, `noImplicitAny=false`, `strictNullChecks=true`) rather than inheriting TypeScript defaults. A future migration to full strict typing would be a separate reviewed change, not an incidental compiler upgrade.

## 3. Development and production runtime

Runtime diagnostics are disabled by default. Enable them only when development or troubleshooting requires the browser diagnostic bundle and initialisation-time regression checks:

```js
window.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true };
```

This setting does not control the built-in status banner, override checkbox or other UI elements. Those controls are optional DOM integrations supplied by the host page. Production pages normally omit `runtimeDiagnostics`; setting it explicitly to `false` is equivalent.

`assetBaseUrl` may be supplied when supporting assets do not share the engine script's directory. The resolver accepts normal HTTP/HTTPS deployment URLs (and `file:` only from a `file:` page), but rejects active schemes, embedded credentials and HTTPS-to-HTTP downgrades. Dynamically inserted scripts inherit the engine script's CSP nonce.

Transient asset loading uses a bounded exponential retry policy: two retries by default, with 250 ms then 500 ms delays. `assetRetryCount` is capped at three retries, while `retryDelayMs` and `retryMaxDelayMs` control finite backoff. Deterministic HTTP failures are not retried. `assetTimeoutMs`/`scriptTimeoutMs` remain per-attempt deadlines. Kuromoji construction uses a separate `tokenizerTimeoutMs` with a 60-second default so slow valid construction has headroom without allowing a stalled builder to wait indefinitely.

Do not create a separate production engine by editing generated source. The browser QA covers development, production configuration and cross-origin loading directly.

The engine runs inside a private bundle boundary. `window.RomajiTranslator` is the supported public surface; diagnostic state is exposed intentionally through `RomajiTranslator.getDiagnostics()`. Development diagnostic functions are registered inside that CJ2R-owned object when enabled. Temporary namespaced bridges are installed only when unoccupied and are removed only when CJ2R still owns the exact value, so host-page globals are never overwritten or deleted as cleanup. Loading the engine a second time while the same instance is active is intentionally idempotent.

The engine-managed built-in input, status and Kanji UI uses delegated events and refreshable references so late DOM insertion and SPA replacement do not require reloading the engine. The override checkbox and sources/licences notice in `translator.html` are page-owned and are not discovered, synchronised or controlled by `translator-engine.js`. Kanji Readings are a separate reusable capability: `getKanjiReadings()` / `getKanjiReadingsSync()` expose structured data, while `[data-cj2r-kanji-readings]` opts a page into the supplied renderer. Custom reading targets present at startup are discovered automatically; a custom target inserted later is registered by calling `refreshUi()`. The DOM observer rescans custom reading targets only after opt-in, so pages with no readings consumer do not incur Kanji-specific mutation scanning or rendering.

## 4. Review and uncertainty policy

Review flags are classified centrally in `10-output-and-translation-pipeline.js`. Each flag maps to a category, rationale and review requirement. Unknown flags default to review-required until explicitly classified.

Review-causing signals have an explicit lifecycle: `candidate` → `active` → either `superseded`/`resolved` or `final-active`. Only `final-active` signals can make the completed translation require review. Candidate provenance is retained in the audit, including lifecycle history, the final state and any superseding source/reason.

Producing printable Romaji is not evidence that uncertainty disappeared. Lower-confidence fallback routes must carry their candidate/ambiguity metadata into the final `ReadingResolution`; a fallback may choose the best defensible visible candidate while the audit still requires review. Resolution-refinement stages must likewise carry existing `reviewSignals` forward. They may mark only the uncertainty they actually settle as `superseded`, with the stronger evidence recorded as the superseding source; unrelated ambiguity/conflict signals remain active.

Weak lexical multiplicity signals (`general-word-alternative` and raw `whole-word-reading-ambiguous`) may be superseded only when the normal sentence pipeline has selected a contextual lexical reading with sufficient confidence, the supporting context is inside the same hard-boundary segment, no stronger review-required signal survives for that token, and the token is not still participating in an unresolved contiguous nominal compound. Reviewed ambiguity, proper-name ambiguity, contextual ambiguity, evidence conflicts, unresolved readings and other stronger safety signals are never cleared by this weak-signal rule.

Normal translation and audit translation use the same result path. `translateWithAudit()` / `translateWithAuditSync()` add diagnostic information; they do not choose a different reading.

The audit records both:

- `audit.sourceText` — caller input;
- `audit.normalizedSourceText` — the normalised form that reached the translator.

Task 09 also classifies audit scope independently of the literal output guard. Each reading exposes `auditCategories`; the sentence audit exposes `audit.statistics`. The statistics deliberately separate:

- `unresolvedJapaneseReadings` — unresolved reading failures that remain inside Japanese scope;
- `unresolvedJapaneseHan` — the subset above whose Han scope is positively `japanese-scope`;
- `outOfScopeInput` — unsupported non-Japanese script/input (for example Korean, Cyrillic or Arabic), which must not inflate unresolved-Japanese counts;
- `unknownJapaneseScopeStatus` — Han with no positive Japanese-use evidence, kept distinct from both unresolved Japanese and positively out-of-scope input;
- `literalUnresolved` / `hasLiteralUnresolved` — final `[Unresolved]` output occurrence(s), regardless of why the output guard fired;
- `resolvedOutputRequiresReview` — Romaji was produced without `[Unresolved]`, but final-active uncertainty still requires human review.

`requiresReview` remains an uncertainty/safety decision and is intentionally independent of these scope counts. A review-required result is not necessarily unresolved, and a literal `[Unresolved]` result is not necessarily an unresolved **Japanese** reading.

Ambiguous names/readings, unusual sokuon, historical orthography, numeric lexical ambiguity and missing source-language spelling should remain reviewable when the available evidence cannot justify one authoritative result.

## 5. Reviewed evidence mechanisms

### Proper-name spans

`data/nouns/reviewed-proper-name-span-evidence.json` stores complete reviewed name/place spans. They are applied after Kuromoji tokenisation so a bad split can be repaired without introducing a global name-reading heuristic. Reviewed whole-name evidence may cross any number of Kuromoji tokens and outranks ordinary lexical, per-Kanji and candidate-name readings inside the established span. Japanese personal names remain in Japanese name order in final Romaji.

A reading that is only established by title context belongs in scoped title-reading evidence rather than the global proper-name bank. For example, `光` may resolve as `Hikaru` inside `光が死んだ夏` without globally replacing ordinary `光 → Hikari`. Conversely, an independently established complete person name such as `小日向海流 → Kohinata Minoru` belongs in reviewed proper-name span evidence. When the intended proper-name reading is still genuinely ambiguous, emit the best defensible candidate and keep `requiresReview`; do not promote one candidate merely because Kuromoji agrees with it.

Reviewed name spans may detach recognised honorific suffixes such as `様`, `君` and `氏`. Suffix readings remain independently evidence-backed.

### Common-word direct Romaji

A reviewed common-word object may include final Rule-0 `romaji` when one kana reading cannot express a stable internal output boundary, such as `元カノ → Moto Kano`.

This field is consumed only through the normal reviewed common-word path. Do not use it to split ordinary lexical compounds or to avoid implementing productive morphology.

### Reviewed common-word inflection

A common-word lemma may declare an explicitly supported `conjugationClass`. The current productive class is `godan-ra`. Store the lemma and let the post-load index derive supported ordinary forms rather than adding every inflection as a separate title/word exception.

### Kana boundary repair

`splitReviewedKanaCommonWordBoundaryTokens()` can expose a reviewed common-word boundary inside the final Kuromoji kana token only when:

- the span begins at an existing token boundary;
- it crosses at least one Kuromoji boundary;
- the reviewed rule/pattern matches;
- only the final token needs to be split.

The overshooting remainder is retokenised to recover grammatical metadata. The new reviewed boundary is protected from later span merges. Arbitrary substring segmentation inside one token is intentionally forbidden.

### Title readings

Reviewed common-word and title-reading indexes are finalised only after Kanji-variant data settles, so canonical spellings and reviewed patterns use the same normalised orthography.

The title-specific `title-compact-numeric-prefix` boundary may join a following ASCII fraction (`^[0-9]+/[0-9]+(?:~)?$`) when the title evidence's full-source pattern supplies the context. Do not broaden this into general word+number joining.

### Exact overrides

The `exact-overrides-v1` schema permits an object containing only underscore-prefixed metadata. This is the canonical zero-live-override state and must not produce an optional-asset warning.

### Japanese subtitle bars

`normalizeRule0OutputPunctuation()` keeps track of source Japanese `―`. Ordinary bars remain tight em dashes. Only exactly two source bars with the second terminal inside the current canonical wave-delimited segment are treated as a paired subtitle delimiter and spaced accordingly. Final sentence punctuation after the second bar does not make that subtitle delimiter non-terminal; additional lexical material still does.

## 6. Narrow repair layers

Post-tokenisation repairs exist for specific demonstrated failure modes. They are not general replacements for Kuromoji.

Important examples:

- productive `たがる` reconstruction from strong Kuromoji metadata, plus a bounded recovery for an unpunctuated verb-continuative + `たがって` misparse; punctuation blocks the recovery;
- reviewed common-word inflection for explicit supported conjugation classes;
- dropped sokuon restoration and bounded kana boundary repair;
- numeric-unit splitting, typed temporal/minute expression analysis and reviewed irregular counter/date/numeral evidence;
- old-form Kanji/variation-selector normalisation with separate name-only variant scope;
- conservative authoritative span rescue for reviewed names, counters/dates, ateji, loanwords and safe general words;
- unique reviewed decomposition of a swallowed katakana token only when no whole-token spelling exists and exactly one complete decomposition is possible;
- reviewed proper-name span repair without consuming attached honorifics;
- Latin/number passthrough protection and Rule-0 numeric grouping;
- source-language spelling and title-specific readings only through reviewed evidence;
- sentence-level contextual verification that can select only among already-attested candidates and otherwise surfaces review.

Ordinary sokuon doubles only a supported following consonant. Terminal, repeated, vowel-following and other non-geminative uses remain audit-review cases rather than guesses.

When extending a repair layer, begin with a reproducible real-world failure and add permanent regression coverage. Do not broaden a mechanism merely to reduce an adversarial mismatch count.

## 7. Provenance and maintenance tools

Every maintained `data/` file is classified in `data/translator-data-provenance-classification.json`; maintained classifications must not remain `partial`.

Externally derived evidence with a sufficiently specific source basis is pinned in `data/external-evidence-source-provenance.json`. After intentionally changing a tracked file, refresh its recorded hash with:

```bash
node tools/qa/update-external-evidence-source-provenance-hashes.js
```

The updater changes hashes only; source/version/licence metadata must be reviewed separately when the source basis changes.

External dictionary snapshots are not imported directly into runtime data:

- use `tools/evidence-candidate-generation/` for deterministic Yomitan review candidates;
- use `tools/edrdg-update/` for controlled Jitendex/JMdict, JMnedict and KANJIDIC refreshes.

See their specialist guides for the full workflows.

## 8. Pipeline Stage Development Reference

Use this section to locate the narrowest stage that owns a change. It is a maintenance companion to `readme/cj2r-architectural-control-flow.md`; it is not intended to be read from start to finish before every edit.

The three authorities have different jobs:

- `readme/Romaji Rules.docx` defines the required linguistic/output behaviour.
- `readme/cj2r-architectural-control-flow.md` shows the live execution order and data flow.
- this section tells you where a stage is implemented, what it consumes/produces, what must remain true around it, and where focused regression coverage belongs.

If executable order changes, update the architectural flow and this reference in the same change. A source/documentation ordering mismatch is a release defect. `Mxx` below means the numbered source module from Section 2 (for example, `M09` = `09-token-repair-and-grammar.js`).

### 8.1 Find the right part of the pipeline first

Diagnose the failure before editing code:

| If the problem is… | Start here |
|---|---|
| UI/API entry, configuration, asset loading, normalisation or tokeniser startup | **P stages** — Section 8.2 |
| Kuromoji split/grouping is wrong, or a reviewed span needs to be formed | **T stages** — Section 8.3 |
| Tokens are correct but the selected reading/direct Romaji is wrong | **R stages** — Section 8.4 |
| Reading is correct but kana→Romaji spelling is wrong | **C stages** — Section 8.5 |
| Words/readings are correct but casing, joining, spacing, punctuation or audit output is wrong | **O stages** — Section 8.6 |

For an existing stage, change that stage rather than adding a parallel fix elsewhere. If no existing stage can own the behaviour safely, use Section 8.7.

`Focused QA` names the first suite to extend for that stage; the normal build and full release-gate requirements remain those in Section 1.

### 8.2 Request, initialisation and pre-tokenisation

Use this phase when the problem exists **before normal Kuromoji token processing**: entry routing, runtime configuration, loading, source preservation, exact whole-text overrides, input normalisation or tokenizer startup.

**P01 — Entry surface**

- **Owner:** M11 `RomajiTranslator` API, `bindTranslator`, built-in lifecycle
- **Flow:** Caller/UI text → translation request
- **Rules / constraints:** Built-in UI, public API and bound-host controls must converge on the same `translateText()` path. Do not create a second translation implementation for a UI.
- **Uses:** `CJ2R_TRANSLATOR_CONFIG`
- **Focused QA:** `runtime-and-api.js` + browser smoke

**P02 — Runtime configuration**

- **Owner:** M01/M02/M03/M11
- **Flow:** Pre-load config + DOM availability → runtime flags/UI references
- **Rules / constraints:** `runtimeDiagnostics`, `assetBaseUrl` and optional engine-managed UI must not alter linguistic semantics. The supplied `translator.html` may use `setOverridesEnabled()` to implement its own override checkbox; the engine must not discover or synchronise that checkbox or the page-owned sources/licences notice. Missing built-in UI elements must remain non-fatal.
- **Uses:** `window.CJ2R_TRANSLATOR_CONFIG`
- **Focused QA:** `runtime-and-api.js` + browser smoke

**P03 — Initialisation**

- **Owner:** M11 `initializeTranslator`
- **Flow:** Uninitialised runtime → ready tokenizer/evidence state
- **Rules / constraints:** Start all required loaders before building indexes/tokenizer. Critical asset/schema failure must fail clearly; optional/developer failures follow M01 policy. Do not translate through a reduced half-initialised state.
- **Uses:** All runtime assets
- **Focused QA:** `runtime-and-api.js` + failure injection

**P04 — Asset/schema loading**

- **Owner:** M01 + M04 + M06 loaders
- **Flow:** Asset URLs → validated runtime banks
- **Rules / constraints:** New data families need an asset definition, schema/failure policy, loader, provenance classification and explicit index/state ownership. Do not accept malformed rows silently.
- **Uses:** `data/` + `kuromoji.js`
- **Focused QA:** `runtime-and-api.js` + semantic-data safety

**P05 — Source preservation**

- **Owner:** M10 `translateText`
- **Flow:** Caller string → `sourceText`, override lookup text, normalised source
- **Rules / constraints:** Preserve original caller input for audit. Override lookup canonicalisation and normal translation normalisation are intentionally distinct.
- **Focused QA:** `romaji-core.js` + `ambiguity-and-audit.js`

**P06 — Exact whole-text override**

- **Owner:** M10 `resolveOverridesEnabled`, `findExactOverride`
- **Flow:** Pre-normalisation lookup text → direct Romaji or continue
- **Rules / constraints:** Runs before normal tokenisation. Keep it narrow, reviewed and optional; do not use exact overrides to mask a systemic pipeline defect. Preserve applicable trailing punctuation.
- **Uses:** `data/Overrides/overrides.json`
- **Focused QA:** `runtime-and-api.js` + relevant linguistic suite

**P07 — Input normalisation**

- **Owner:** M05 `normalizeTranslatorInputText` and Kanji helpers in M04
- **Flow:** Source text → normalised sentence
- **Rules / constraints:** Preserve semantic text while applying documented Unicode/width/punctuation/IVS/general-variant normalisation. Never pre-slice the sentence in a way that destroys Kuromoji context.
- **Uses:** `data/kanji/kanji-variants.json`
- **Focused QA:** `romaji-core.js` + `tokenisation-and-merging.js`

**P08 — Defensive no-tokenizer fallback**

- **Owner:** M10 + M05 `convertToRomaji`
- **Flow:** Normalised text without tokenizer → safely convertible output
- **Rules / constraints:** Defensive internal fallback only. It must never invent Han readings; final unresolved-Han guard still applies. Normal async/public use should initialise instead.
- **Focused QA:** `runtime-and-api.js` + `ambiguity-and-audit.js`

**P09 — Whole-sentence Kuromoji tokenisation**

- **Owner:** M11 tokenizer build + M10 `translateText`, `translateTokenizedSourceText`
- **Flow:** Complete normalised sentence → Kuromoji token stream → source-span downstream resolver
- **Rules / constraints:** Tokenise the complete sentence. Kuromoji supplies linguistic evidence, but its boundaries are not authoritative. The downstream resolver accepts a token stream separately from the source text so adversarial QA can mutate boundaries without changing the source. New features must not introduce destructive pre-tokenisation substring translation.
- **Uses:** `data/dict/`
- **Focused QA:** `tokenisation-and-merging.js` + `tokenisation-mutation.js`

**P10 — Empty-token fallback**

- **Owner:** M10 `translateText`
- **Flow:** Empty token stream → guarded surface fallback
- **Rules / constraints:** Preserve audit signal and block unresolved Han. Do not treat an empty token stream as evidence for invented readings.
- **Focused QA:** `ambiguity-and-audit.js`

### 8.3 Post-Kuromoji token repair and merging

Use this phase when Kuromoji has produced tokens but their **boundaries, grouping or evidence spans are wrong**. These passes run in the listed order. Moving a pass changes semantics.

Tokenisation-mutation QA deliberately supplies alternative artificial token partitions to `translateTextFromTokenizationForQa()`. These tests must retain the same Japanese source string and independently justified expected output. They are intended to prove that stronger lexical, grammatical, name and loanword evidence survives boundary changes; genuinely unknown tokenisation may remain reviewable but must still romanise mechanically without Japanese leakage or `[Unresolved]`.

**T01 — Dropped-sokuon restoration**

- **Owner:** M09 `restoreDroppedSokuonTokens`
- **Flow:** Raw Kuromoji tokens + full source → repaired tokens
- **Rules / constraints:** Runs immediately after tokenisation while source positions still correspond to the normalised sentence. Restore only demonstrably dropped `っ/ッ`; do not guess non-geminative cases.
- **Focused QA:** `tokenisation-and-merging.js` + `romaji-core.js`

**T02 — Canonical hard-boundary stabilisation**

- **Owner:** M09 `stabilizeHardBoundaryTokenization`
- **Flow:** T01 tokens + source → boundary-stable tokens
- **Rules / constraints:** Retokenise only hard-boundary segments. Preserve complete-sentence analysis elsewhere and retain positions/boundary semantics. `×` is a canonical hard boundary so Kuromoji's possible `カケル` reading cannot become authoritative merely because the symbol was tokenised as a word; reviewed title evidence may subsequently reinterpret the source span. ASCII `~` remains a true segment boundary and must not be swallowed by Latin passthrough.
- **Focused QA:** `tokenisation-and-merging.js` + `romaji-core.js` + punctuation-boundary QA

**T03 — Structured numeric-unit split**

- **Owner:** M09 `splitStructuredNumericUnitTokens`
- **Flow:** T02 tokens → numeric structure tokens
- **Rules / constraints:** Split only recognised structured numeric/unit shapes. Do not perform final numeric spacing here.
- **Focused QA:** `numbers-and-counters.js`

**T04 — Typed temporal boundary repair**

- **Owner:** M09 `repairTypedTemporalExpressionBoundaries`
- **Flow:** T03 tokens → temporal-boundary-safe tokens
- **Rules / constraints:** Repair only recognised temporal constructions where Kuromoji has absorbed a neighbouring lexical token into a temporal suffix/span. A complete standalone ordinary lexical noun beginning with `中` is preserved rather than split solely because a preceding token could form a temporal span. When both the typed `～中` span and the competing `中`-initial noun plus remainder are independently attested lexical analyses, preserve the lexical tokenisation but carry an explicit segmentation-collision review marker. Establish a protected boundary rather than adding a phrase-specific output exception.
- **Uses:** token morphology + reviewed temporal/numeric roles
- **Focused QA:** `tokenisation-and-merging.js` + `numbers-and-counters.js`

**T05 — Typed temporal span merge**

- **Owner:** M09 `mergeTypedTemporalSpanTokens`
- **Flow:** T04 tokens → typed temporal spans
- **Rules / constraints:** Form recognised period-wide/deadline temporal units before generic lexical mergers can cross them, including the normal multi-token `[temporal head][中]` shape as well as repaired swallowed-boundary cases. A recognised span seals its right edge: an immediately following lexical token is kept independent, and suffix/proper-name contextual roles are re-evaluated from standalone tokenisation when that yields an ordinary lexical noun. Preserve particles and already-correct lexical analyses.
- **Focused QA:** `numbers-and-counters.js` + `tokenisation-and-merging.js`

**T06 — One-day role classification**

- **Owner:** M09 `markTypedOneDayDurationTokens`
- **Flow:** T05 tokens → date/duration-role annotations
- **Rules / constraints:** Distinguish calendar-date `一日` from duration/frequency use using structural context. Predicate detection includes ordinary verbs/adjectives and morphological `サ変接続` noun + `する` structures, including inflected `する` and an explicit `を`; it may also see through an intervening case-marked nominal phrase to the eventual clause predicate. An explicit case particle immediately attached to `一日` remains a calendar/date boundary control. Do not globally replace the legitimate `ついたち` reading.
- **Uses:** `data/grammar/counter-date-reading-evidence.json`
- **Focused QA:** `numbers-and-counters.js`

**T07a — Typed clock-hour span merge**

- **Owner:** M09 `mergeTypedClockHourTokens`
- **Flow:** T06 tokens → reviewed clock-hour components
- **Rules / constraints:** Form a `clock-hour` token only when the complete numeral+`時` surface has reviewed counter/date evidence. This preserves irregular readings such as `四時`, `七時` and `九時`, supports reviewed 0–23 hour notation and Arabic aliases, and does not reinterpret the distinct duration counter `時間`.
- **Uses:** `data/grammar/counter-date-reading-evidence.json`
- **Focused QA:** `numbers-and-counters.js`

**T07b — Typed minute-counter span merge**

- **Owner:** M09 `mergeTypedMinuteCounterTokens`
- **Flow:** T07a tokens → complete numeral+`分` minute expressions
- **Rules / constraints:** Consume the complete numeral span plus the minute unit so regular/onbin minute readings and output joining are resolved as one typed expression. Adjacent typed `clock-hour` and `minute-counter` components remain separate output units. Do not create a generic number-pronunciation heuristic.
- **Uses:** reviewed counter/date evidence + numeric structure
- **Focused QA:** `numbers-and-counters.js`

**T08 — Case-marked counter-follower role repair**

- **Owner:** M09 `repairCaseMarkedCounterFollowerTokens`
- **Flow:** T07b tokens → lexical-role-corrected follower tokens
- **Rules / constraints:** Repair a following token only when counter adjacency gave it a suffix-like analysis, independent-token evidence supplies a different lexical reading, and a following case particle confirms noun-like syntax. Genuine suffixes remain unchanged.
- **Focused QA:** `tokenisation-and-merging.js` + `numbers-and-counters.js`

**T09 — Productive `たがる` repair**

- **Owner:** M09 `mergeDesiderativeGaruTokens`
- **Flow:** T08 tokens → reconstructed desiderative chain
- **Rules / constraints:** Require strong morphology/contiguity; punctuation blocks bounded misparse recovery. Do not turn this into a general substring merge.
- **Uses:** `data/grammar/conjugation-patterns.json`
- **Focused QA:** `grammar.js` + `tokenisation-and-merging.js`

**T10 — Reviewed common-word inflection**

- **Owner:** M07 `mergeReviewedCommonWordInflectionTokens`
- **Flow:** T09 tokens → reviewed inflected lexical units
- **Rules / constraints:** Derive only declared supported conjugation classes from reviewed lemmas. Add productive logic, not one exception per inflection.
- **Uses:** `data/common-words/common-words-term-bank-1.json`
- **Focused QA:** `grammar.js` + `tokenisation-and-merging.js`

**T11 — Reviewed kana common-word boundary split**

- **Owner:** M09 `splitReviewedKanaCommonWordBoundaryTokens`
- **Flow:** T10 tokens + source → exposed reviewed boundary
- **Rules / constraints:** May cross existing Kuromoji boundaries but split only the final overshooting kana token; retokenise remainder; protect the new boundary.
- **Uses:** common-word bank
- **Focused QA:** `tokenisation-and-merging.js`

**T12 — Kana lexical-span recovery**

- **Owner:** M09 `mergeKanaLexicalReadingTokens`
- **Flow:** T11 tokens → reviewed kana lexical spans
- **Rules / constraints:** Use registered whole-reading evidence only; do not perform arbitrary kana substring segmentation.
- **Uses:** compound/general-word evidence
- **Focused QA:** `tokenisation-and-merging.js` + `romaji-core.js`

**T13 — Boundary-repair honorific reassembly**

- **Owner:** M09 `mergeKanaCommonWordBoundaryHonorificTokens`
- **Flow:** T12 tokens → restored honorific unit boundaries
- **Rules / constraints:** Reassemble only fragments caused by T11; do not consume unrelated following grammar.
- **Uses:** reviewed boundary metadata
- **Focused QA:** `tokenisation-and-merging.js` + `names-and-loanwords.js`

**T14 — Orthographic kana-boundary merge**

- **Owner:** M09 `mergeOrthographicKanaBoundaryTokens`
- **Flow:** T13 tokens → deterministic kana units
- **Rules / constraints:** Merge only deterministic orthographic continuations. Respect protected reviewed boundaries and hard punctuation.
- **Focused QA:** `tokenisation-and-merging.js` + `romaji-core.js`

**T15 — Latin/number/source-spelling protection**

- **Owner:** M09 `mergeLatinPassthroughTokens`
- **Flow:** T14 tokens → protected passthrough spans
- **Rules / constraints:** Preserve source spelling/punctuation and stop later Japanese lexical mergers from rewriting the span.
- **Focused QA:** `names-and-loanwords.js` + `tokenisation-and-merging.js`

**Pre-tokenisation modern obsolete W-row kana normalisation**

- **Owner:** M05 `normalizeObsoleteWRowKanaForModernReading`, invoked by M10 `translateText`.
- **Flow:** after ordinary input normalisation and before Kuromoji, in normal mode only.
- **Rules / constraints:** map the obsolete W-row kana to their modern vowel equivalents while preserving script: `ゐ → い`, `ヰ → イ`, `ゑ → え`, `ヱ → エ`. This is a narrow orthographic/phonological normalisation backed by the maintained official historical-kana evidence; it is not a general historical-spelling rewrite.
- **Isolation:** explicit historical mode does **not** run this pre-tokenisation rewrite, so T16 can still match the original historical surface against attested whole-word evidence.
- **Focused QA:** `ambiguity-and-audit.js` + `historical-kana.js`

**T16 — Historical-kana evidence (opt-in)**

- **Owner:** M07 `mergeHistoricalKanaEvidenceTokens`
- **Flow:** T15 tokens → historical evidence spans
- **Rules / constraints:** Execute only when historical mode was requested. This whole-word historical evidence pass remains separate from the narrow modern-mode obsolete W-row normalisation described above.
- **Uses:** `data/historical-kana/historical-kana-evidence.json`
- **Focused QA:** `historical-kana.js`

**T17 — Exact Kuromoji dictionary rescue**

- **Owner:** M08 `mergeExactDictionaryRescueTokens`
- **Flow:** T16/T15 tokens + source → narrow exact-dictionary spans
- **Rules / constraints:** Context-gated rescue, especially proper names. Never elevate broad dictionary-prefix matching into automatic certainty.
- **Uses:** Kuromoji dictionary
- **Focused QA:** `names-and-loanwords.js` + `ambiguity-and-audit.js`

**T18 — Reviewed proper-name spans**

- **Owner:** M07 `mergeReviewedProperNameSpanTokens`
- **Flow:** T17 tokens → reviewed name units
- **Rules / constraints:** Whole reviewed span evidence may cross arbitrary Kuromoji boundaries and repair bad tokenisation; it outranks lexical/per-Kanji readings inside the established name span and preserves Japanese name order. Title-only name readings stay title-scoped. Genuine name ambiguity remains reviewable; do not create global per-Kanji name heuristics.
- **Uses:** `data/nouns/reviewed-proper-name-span-evidence.json`
- **Focused QA:** `names-and-loanwords.js`

**T19 — Reviewed-name honorific/suffix repair**

- **Owner:** M09 `mergeReviewedNameHonorificTokens`
- **Flow:** T18 tokens → name + independently backed suffix units
- **Rules / constraints:** Keep suffix/honorific reading independently evidence-backed; do not let name span swallow it indiscriminately.
- **Uses:** reviewed name evidence + supported suffix readings
- **Focused QA:** `names-and-loanwords.js`

**T20 — Unreviewed name-context marking**

- **Owner:** M09 `markUnreviewedNameContextTokens`
- **Flow:** T19 tokens → audit-marked name-context tokens
- **Rules / constraints:** Mark uncertainty; do not force a reading merely because the local context resembles a name.
- **Uses:** proper-noun candidate indexes
- **Focused QA:** `names-and-loanwords.js` + `ambiguity-and-audit.js`

**T21 — Authoritative span rescue**

- **Owner:** M10 `mergeAuthoritativeSpanTokens`, index built in M06
- **Flow:** T20 tokens → high-confidence evidence spans
- **Rules / constraints:** Respect authoritative-source priority and existing protected boundaries. Add a source only if its scope/confidence justifies authoritative rescue.
- **Uses:** reviewed names, reviewed whole-word reading spans, counters/dates, ateji, loanwords, compounds, safe general words
- **Focused QA:** relevant domain suite + `tokenisation-and-merging.js`

**T22 — Conservative `々` fallback**

- **Owner:** M07 `mergeIterationMarkFallbackTokens`
- **Flow:** T21 tokens → structurally repeated reading token
- **Rules / constraints:** Repeat only a safe preceding single-Kanji reading. Do not guess Rendaku; keep result reviewable.
- **Uses:** previous token evidence
- **Focused QA:** `ambiguity-and-audit.js` + `romaji-core.js`

**T23 — Reviewed numeric aliases**

- **Owner:** M07 `mergeReviewedNumericAliasTokens`
- **Flow:** T22 tokens → canonical reviewed numeric aliases
- **Rules / constraints:** Canonical numeric evidence remains authoritative; aliases must not create general orthographic guessing.
- **Uses:** `data/grammar/counter-date-reading-evidence.json`
- **Focused QA:** `numbers-and-counters.js`

**S01 — Japanese-use Han scope classification**

- **Owner:** M04 `classifyHanCharacterScope` / `classifyHanSurfaceScope`; loader `loadJapaneseHanScopeDictionary`
- **Flow:** Han that reaches reading fallback → positive Japanese-scope check before unknown-scope handling
- **Rules / constraints:** KANJIDIC entries count as positive Japanese scope only when they provide at least one usable Japanese on/kun reading; reviewed Japanese variant mappings and the compact reviewed MJ/Unihan bank may also establish scope. `unknown-scope` Han must not receive guessed Japanese readings. Every supported Han must have a viable candidate path. When stronger whole-word/context evidence is absent, emit the best evidence-backed candidate and retain `requiresReview` when legitimate alternatives remain. Chinese/Korean readings never satisfy this rule.
- **Uses:** `data/kanji/kanji-bank-*.json`, `data/kanji/kanji-variants.json`, `data/kanji/japanese-han-scope.json`
- **Focused QA:** `ambiguity-and-audit.js` + `names-and-loanwords.js`

**T24 — Name-only Kanji variants**

- **Owner:** M07 `mergeVariantProperNounTokens`
- **Flow:** T23 tokens → canonicalised proper-noun candidate spans
- **Rules / constraints:** Apply only the name-scoped variant map here; keep general lookup variants separate from name-only variants.
- **Uses:** `data/kanji/kanji-variants.json`, proper-noun banks
- **Focused QA:** `names-and-loanwords.js`

**T25 — Casual speech/conjugation repair**

- **Owner:** M09 `mergeCasualSpeechTokens`
- **Flow:** T24 tokens → repaired conjugation chains
- **Rules / constraints:** Use configured morphology/auxiliary endings; do not merge across protected lexical or punctuation boundaries.
- **Uses:** `data/grammar/conjugation-patterns.json`
- **Focused QA:** `grammar.js`

**T26 — Reviewed common-word spans**

- **Owner:** M07 `mergeCommonWordTokens`
- **Flow:** T25 tokens + source → reviewed common-word units
- **Rules / constraints:** Use rule/pattern/context selection; direct Rule-0 Romaji is allowed only through the reviewed common-word mechanism.
- **Uses:** common-word bank
- **Focused QA:** `tokenisation-and-merging.js` + `romaji-core.js`

**T27 — Whole-word ateji**

- **Owner:** M07 `mergeAtejiTokens`
- **Flow:** T26 tokens → ateji spans
- **Rules / constraints:** Whole-word reviewed lexical evidence only. Do not infer ateji from individual characters. Title-specific authorial ateji/gikun do not belong in this generic bank; keep them in scoped title-reading evidence.
- **Uses:** `data/ateji/ateji-term-bank-1.json`
- **Focused QA:** `romaji-core.js` + `tokenisation-and-merging.js`

**T28 — Approved grammatical expressions**

- **Owner:** M09 `mergeRecognizedGrammaticalExpressions`
- **Flow:** T27 tokens → grammatical-expression units
- **Rules / constraints:** Merge only configured/approved expressions and preserve lexical words outside them. Particle-expression casing remains lowercase later.
- **Uses:** `data/grammar/particle-expressions.json`, `conjugation-patterns.json`
- **Focused QA:** `grammar.js`

**T29 — Contextual overrides**

- **Owner:** M09 `mergeContextualOverrideTokens`
- **Flow:** T28 tokens + full normalised source → scoped override spans
- **Rules / constraints:** Only when overrides are enabled. Pattern must justify the surface in this context. Keep bank narrow and prefer systemic/evidence mechanisms first.
- **Uses:** `data/Overrides/context-overrides.json`
- **Focused QA:** relevant linguistic suite + `runtime-and-api.js`

**T30 — Scoped title-reading evidence**

- **Owner:** M07 `mergeTitleReadingEvidenceTokens`, loader/index in M06
- **Flow:** T29 tokens + full normalised source → title-scoped reading/direct-Romaji spans
- **Rules / constraints:** Full-source pattern is mandatory scope. Use for title furigana/gikun, title-specific ateji, title names, official spellings and reviewed mixed-script notation; do not leak title readings into ordinary lexical use. Author-selected readings must be independently evidenced as a whole span; never derive them by choosing convenient per-character readings. When the same surface also has ordinary lexical or compositional evidence, the matched title reading remains authoritative for that reviewed title context. `title-separator-silent` is the only evidence kind allowed an empty Romaji value, and only when independent title-reading evidence establishes that the source symbol is unspoken.
- **Uses:** `data/title-readings/title-reading-evidence.json`
- **Focused QA:** `names-and-loanwords.js`

**T31 — Known phrase/compound spans**

- **Owner:** M09 `mergeKnownPhraseTokens`
- **Flow:** T30 tokens → known phrase units
- **Rules / constraints:** Longest reviewed multi-token phrase only; do not use as a catch-all for ordinary morphology.
- **Uses:** compound/known-phrase indexes
- **Focused QA:** `tokenisation-and-merging.js` + `romaji-core.js`

**T32 — Rendaku/non-Rendaku evidence**

- **Owner:** M07 `mergeRendakuEvidenceTokens`
- **Flow:** T31 tokens → attested compound reading spans
- **Rules / constraints:** Evidence-backed voiced or blocked reading only. No productive Rendaku guessing.
- **Uses:** `data/rendaku/rendaku-evidence.json`
- **Focused QA:** `romaji-core.js` + `ambiguity-and-audit.js`

**T33 — Source-language loanwords**

- **Owner:** M07 `mergeLoanwordTokens`
- **Flow:** T32 tokens → loanword output spans
- **Rules / constraints:** Prefer reviewed whole-token source spelling. Partial-token decomposition only when no whole-token spelling exists and exactly one reviewed complete segmentation is possible. If only part of a contiguous Katakana span has reviewed source-language spelling, preserve the mechanically romanised remainder and require review rather than presenting a hybrid result as authoritative.
- **Uses:** `data/loanwords/loanwords-term-bank-1.json`
- **Focused QA:** `names-and-loanwords.js`

**T34 — General-word span rescue**

- **Owner:** M07 `mergeGeneralWordTokens`
- **Flow:** T33 tokens → selected/ambiguous general-word spans
- **Rules / constraints:** Preserve candidate/ambiguity metadata. General-word evidence is fallback/rescue, not authority to overwrite stronger reviewed mechanisms or an already-tokenised numeral + 助数詞 structure merely because the combined orthography also exists in the general-word bank.
- **Uses:** `data/general-words/general-words-term-bank-1.json`
- **Focused QA:** `romaji-core.js` + `ambiguity-and-audit.js`

**T35 — Contextual reading-evidence annotation**

- **Owner:** M08 `annotateContextualReadingEvidence`
- **Flow:** T34 tokens → tokens carrying legitimate contextual reading candidates and neighbour-derived scores
- **Rules / constraints:** Attach evidence; do not force a winner when the token-local margin is insufficient. Candidate readings must come from the validated contextual bank.
- **Uses:** `data/reading-evidence/contextual-reading-evidence.json`
- **Focused QA:** `ambiguity-and-audit.js`

**T36 — Morphological output-boundary annotation**

- **Owner:** M09 `annotateMorphologicalOutputBoundaries`
- **Flow:** T35 tokens → output-boundary-aware token stream
- **Rules / constraints:** Carry explicit same-word/compound/conjunctive joining relationships into output assembly instead of reconstructing them late from coarse POS alone. Preserve independently separate auxiliary units.
- **Focused QA:** `tokenisation-and-merging.js` + `grammar.js`

### 8.4 Reading and direct-Romaji resolution

Use this phase when the token stream is already correct but CJ2R chooses the **wrong reading, wrong evidence source or wrong direct Romaji**. `resolveTokenReading()` is a first-safe-match precedence chain, so order is part of the behaviour.

**R01 — Contextual override**

- **Owner:** M10
- **Flow:** matched T29 token → direct reviewed Romaji
- **Rules / constraints:** Highest token-level precedence because full context already matched; still subordinate to the pre-token exact override P06.
- **Uses:** contextual overrides
- **Focused QA:** relevant domain suite

**R02 — Scoped title evidence**

- **Owner:** M10
- **Flow:** T30 token → reviewed reading/direct Romaji
- **Rules / constraints:** Must remain scoped to matched full-title context; outranks ordinary name/word evidence.
- **Uses:** title-reading evidence
- **Focused QA:** `names-and-loanwords.js`

**R03 — Reviewed proper-name span**

- **Owner:** M10
- **Flow:** T18 token → reviewed name Romaji
- **Rules / constraints:** Whole reviewed span outranks candidate-name ranking, ordinary lexical readings and Kuromoji across the complete established name span; preserve Japanese name order and retain review when no reviewed span or stronger evidence settles the intended reading.
- **Uses:** reviewed proper-name spans
- **Focused QA:** `names-and-loanwords.js`

**R04 — Reviewed name honorific**

- **Owner:** M10
- **Flow:** T19 token → reviewed suffix reading
- **Rules / constraints:** Keeps suffix reading independent of the name span; do not fold into generic particle/suffix fallback.
- **Uses:** supported honorific evidence
- **Focused QA:** `names-and-loanwords.js`

**R05 — Typed temporal expression**

- **Owner:** M10
- **Flow:** typed temporal token from M09 → canonical temporal reading
- **Rules / constraints:** Resolve explicit typed temporal evidence before broad authoritative-span rescue so ordinary temporal grammar cannot be displaced by a lexical span. Preserve the token's recorded typed source.
- **Uses:** typed temporal annotations created during token repair
- **Focused QA:** `numbers-and-counters.js` + `tokenisation-and-merging.js`

**R06 — Typed numeric expression**

- **Owner:** M10
- **Flow:** typed numeric token from M09 → canonical numeric reading
- **Rules / constraints:** Resolve explicit typed numeric evidence before broad authoritative-span rescue so structurally recognised counters/numerals retain their canonical reading. Preserve the token's recorded typed source.
- **Uses:** typed numeric annotations created during token repair
- **Focused QA:** `numbers-and-counters.js`

**R07 — Authoritative span**

- **Owner:** M10
- **Flow:** T21 token → authoritative reading/direct Romaji
- **Rules / constraints:** Preserve recorded source, confidence, variant mappings and review-required metadata. Reviewed whole-word spans outrank Kanji-by-Kanji construction; where no reviewed whole span exists, compositional ambiguity must remain reviewable rather than being treated as certainty.
- **Uses:** authoritative span index
- **Focused QA:** relevant domain suite

**R08 — Reviewed numeric alias**

- **Owner:** M10
- **Flow:** T23 token → canonical reading/direct Romaji
- **Rules / constraints:** Must precede generic number/Kuro fallback so reviewed irregular forms survive.
- **Uses:** counter/date evidence
- **Focused QA:** `numbers-and-counters.js`

**R09 — Latin passthrough**

- **Owner:** M10
- **Flow:** T15 token → source spelling
- **Rules / constraints:** Preserve source spelling; do not kana-convert or title-case internally.
- **Focused QA:** `names-and-loanwords.js`

**R10 — Full grammatical expression**

- **Owner:** M10
- **Flow:** configured full expression → lowercase Romaji
- **Rules / constraints:** Configured particle expression first, narrow fallback map second. Do not classify ordinary lexical words as expressions.
- **Uses:** particle expressions
- **Focused QA:** `grammar.js`

**R11 — Known phrase**

- **Owner:** M10
- **Flow:** T31 token → reviewed whole-phrase value
- **Rules / constraints:** Reviewed phrase value outranks ordinary particle/word fallback for the matched span only.
- **Uses:** compound/known phrase
- **Focused QA:** `romaji-core.js`

**R12 — Particle-expression entry**

- **Owner:** M10
- **Flow:** exact expression surface → lowercase Romaji
- **Rules / constraints:** Applies to established expression entry even when not pre-merged as a full expression.
- **Uses:** particle expressions
- **Focused QA:** `grammar.js`

**R13 — True particle pronunciation**

- **Owner:** M10 `getParticleReading`
- **Flow:** grammatical particle → reading (`は→wa`, `へ→e`, `を→o`)
- **Rules / constraints:** Pronunciation changes only when token is grammatically a particle; lexical kana must not inherit particle readings.
- **Uses:** Kuromoji POS
- **Focused QA:** `grammar.js` + `romaji-core.js`

**R14 — Loanword evidence**

- **Owner:** M10 + M08 lookup
- **Flow:** reviewed loanword → source-language output
- **Rules / constraints:** Source spelling beats kana-derived output where reviewed.
- **Uses:** loanword bank
- **Focused QA:** `names-and-loanwords.js`

**R15 — Reviewed common-word token**

- **Owner:** M10
- **Flow:** T26 token → reading/direct Rule-0 Romaji
- **Rules / constraints:** Use direct `romaji` only when explicitly reviewed; otherwise retain reading for normal conversion.
- **Uses:** common-word bank
- **Focused QA:** `romaji-core.js`

**R16 — Historical-kana evidence**

- **Owner:** M10
- **Flow:** T16 token → attested reading
- **Rules / constraints:** Only reachable in historical mode because T16 is opt-in.
- **Uses:** historical evidence
- **Focused QA:** `historical-kana.js`

**R17 — Rendaku evidence**

- **Owner:** M10
- **Flow:** T32 token → attested voiced/blocked reading
- **Rules / constraints:** Retain attestation flag; no heuristic voicing.
- **Uses:** Rendaku evidence
- **Focused QA:** `romaji-core.js` + `ambiguity-and-audit.js`

**R18 — Exact dictionary proper-name rescue**

- **Owner:** M10/M08
- **Flow:** T17 token → Kuromoji exact pronunciation
- **Rules / constraints:** Narrow rescue only; keep `exact-dictionary-rescue` flag and confidence below reviewed evidence.
- **Uses:** Kuromoji dictionary
- **Focused QA:** `names-and-loanwords.js` + `ambiguity-and-audit.js`

**R19 — Kana lexical-span evidence**

- **Owner:** M10
- **Flow:** T12 token → reviewed whole-kana reading
- **Rules / constraints:** Represents tokenisation rescue, not general kana rewriting; keep rescue flag.
- **Uses:** compound/general kana evidence
- **Focused QA:** `tokenisation-and-merging.js`

**R20 — Kana-only orthographic/written reading**

- **Owner:** M10 + M08
- **Flow:** kana token → safe pronunciation or written surface
- **Rules / constraints:** Prefer safe orthographic pronunciation; otherwise preserve written kana so Wāpuro long-vowel spelling is not lost. Source-spelling uncertainty must remain flagged.
- **Uses:** Kuromoji pronunciation metadata
- **Focused QA:** `romaji-core.js` + `ambiguity-and-audit.js`

**R21 — Mixed-script orthographic pronunciation**

- **Owner:** M10 + M08
- **Flow:** safe mixed-script token → pronunciation
- **Rules / constraints:** Require safe orthographic evidence; do not use this to invent arbitrary mixed Kanji readings.
- **Uses:** Kuromoji metadata
- **Focused QA:** `romaji-core.js`

**R22 — Contextual common-word lookup**

- **Owner:** M10 + M08
- **Flow:** token + full source → reviewed common-word rule
- **Rules / constraints:** Full-source rule/context selection may supply reading/direct Romaji; outranks ateji/general fallback.
- **Uses:** common-word bank
- **Focused QA:** `romaji-core.js`

**R23 — Ateji reading**

- **Owner:** M10
- **Flow:** T27 token → reviewed ateji reading
- **Rules / constraints:** Whole-word evidence only.
- **Uses:** ateji bank
- **Focused QA:** `romaji-core.js`

**R24 — General-word span evidence**

- **Owner:** M10
- **Flow:** T34 token → selected reading + candidates/flags
- **Rules / constraints:** Keep ambiguity and variant mappings; confidence remains below reviewed mechanisms.
- **Uses:** general-word bank
- **Focused QA:** `ambiguity-and-audit.js`

**R25 — Proper-noun candidate ranking**

- **Owner:** M08 `resolveProperNounReading`
- **Flow:** unresolved proper-noun token → safe winner or ambiguous metadata
- **Rules / constraints:** Rank using Kuromoji agreement, unique reading, category/source hints. Do not force a winner when evidence does not justify one. Canonicalising a name variant must not erase legitimate reading alternatives merely because the canonical Kuromoji reading agrees with the frequency-leading candidate.
- **Uses:** noun/JMnedict/reviewed-name candidates
- **Focused QA:** `names-and-loanwords.js` + `ambiguity-and-audit.js`

**R26 — Conservative `々` fallback**

- **Owner:** M10
- **Flow:** T22 token → repeated safe reading
- **Rules / constraints:** Remains review-required and below safe proper-name winner; no Rendaku inference.
- **Uses:** structural previous-token evidence
- **Focused QA:** `ambiguity-and-audit.js`

**R27 — Reviewed multiple-reading preference**

- **Owner:** M10 + M08
- **Flow:** reviewed ambiguous surface → preferred reading + alternatives
- **Rules / constraints:** Preference may choose output but must retain ambiguity/candidates/review signal.
- **Uses:** reviewed-reading evidence
- **Focused QA:** `ambiguity-and-audit.js`

**R28 — Kuromoji contextual reading**

- **Owner:** M10 + M08
- **Flow:** remaining token with Kuromoji reading → contextual reading + assessments
- **Rules / constraints:** Assess conflicts against reading/general/name evidence. Kuromoji is important context, not absolute authority.
- **Uses:** Kuromoji + reading/general-word evidence
- **Focused QA:** `ambiguity-and-audit.js` + domain suite

**R29 — Compound fallback**

- **Owner:** M08/M10
- **Flow:** unresolved token → compound reading
- **Rules / constraints:** Fallback only after contextual Kuromoji path is unavailable.
- **Uses:** compound bank
- **Focused QA:** `romaji-core.js`

**R30 — General-word fallback**

- **Owner:** M07/M10
- **Flow:** unresolved token → safe general reading or ambiguous metadata
- **Rules / constraints:** Preserve ambiguity; never collapse multiple legitimate readings merely for determinism.
- **Uses:** general-word bank
- **Focused QA:** `ambiguity-and-audit.js`

**R31 — Reading-evidence fallback**

- **Owner:** M08/M10
- **Flow:** unresolved token → frequency/evidence reading
- **Rules / constraints:** Lower-confidence fallback. Keep the fallback flag, candidate set and ambiguity state. A preferred frequency reading may supply visible Romaji, but remaining legitimate alternatives keep the result review-required.
- **Uses:** `data/reading-evidence/reading-evidence.json`
- **Focused QA:** `ambiguity-and-audit.js`

**R32 — Earlier ambiguous result**

- **Owner:** M10
- **Flow:** unresolved but previously ambiguous name/general evidence → ambiguity metadata
- **Rules / constraints:** Return uncertainty rather than discarding it for a surface guess.
- **Uses:** prior candidate metadata
- **Focused QA:** `ambiguity-and-audit.js`

**R33 — Japanese-scope/unknown-scope fallback**

- **Owner:** M10
- **Flow:** no stronger reading → Japanese-use Han scope classification → Japanese-scope candidate fallback / unknown-scope Han / unsupported-script / non-Han surface fallback
- **Rules / constraints:** Never invent unsupported readings. Positively Japanese-scope Han must emit a defensible candidate rather than `[Unresolved]`; ambiguity remains explicit through candidates, audit flags and `requiresReview`. Multi-Han composition is a lower-confidence reviewable fallback only after stronger whole-word evidence has failed. Unknown-scope Han receives no guessed Japanese reading and must not inflate unresolved-Japanese metrics. Unsupported output is later blocked from leaking into Romaji.
- **Focused QA:** `ambiguity-and-audit.js`

**R34 — Sentence-level resolution verification**

- **Owner:** M10 `verifySentenceLevelResolutions` with M08 contextual evidence evaluation
- **Flow:** complete T36 token stream + all provisional R01–R33 resolutions + original normalised source → verified resolutions
- **Rules / constraints:** Runs once after provisional per-token resolution and before Romaji conversion. It may revise only lower-confidence/fallback sources, and only to a legitimate candidate already present in contextual evidence. Reviewed spans, exact/contextual overrides, typed expressions, particles, loanwords and other authoritative sources are protected. If stronger sentence evidence settles contextual ambiguity, retain the earlier signal as `superseded` provenance rather than deleting it; independent conflicts or other review-required signals remain active. If the full-sentence margin is still insufficient, retain the current reading, reduce confidence and require review rather than guessing.
- **Uses:** `data/reading-evidence/contextual-reading-evidence.json`
- **Focused QA:** `ambiguity-and-audit.js`

### 8.5 Kana-to-Romaji conversion and per-token safety

Use this phase when the chosen Japanese reading is correct but the **Romanisation mechanics** are wrong: yōon, sokuon, syllabic `ん`, long vowels, chōonpu or unresolved-Han safety.

**C01 — Direct-Romaji decision**

- **Owner:** M10 `convertToken`
- **Flow:** `ReadingResolution` → direct Romaji or kana conversion
- **Rules / constraints:** If resolver supplied reviewed/source Romaji, preserve it except later global formatting. Otherwise convert only the resolved reading.
- **Focused QA:** `romaji-core.js`

**C02 — Yōon/kogaki**

- **Owner:** M05 `convertToRomaji`
- **Flow:** kana reading → contracted syllables
- **Rules / constraints:** Small `ゃゅょ` etc. combine with the preceding supported kana; never emit them as independent full-size syllables.
- **Focused QA:** `romaji-core.js`

**C03 — Sokuon**

- **Owner:** M05 + M10 audit checks
- **Flow:** kana reading → geminated consonant or review condition
- **Rules / constraints:** Double only supported following consonants. Terminal/repeated/vowel-following/non-geminative uses remain reviewable.
- **Focused QA:** `romaji-core.js` + `ambiguity-and-audit.js`

**C04 — Syllabic `ん`**

- **Owner:** M05 plus cross-token M10
- **Flow:** kana reading → `n` with required apostrophe context
- **Rules / constraints:** Never automatically convert `ん` to `m`. Insert apostrophe before vowel/y when ambiguity requires it.
- **Focused QA:** `romaji-core.js`

**C05 — Written long vowels**

- **Owner:** M05
- **Flow:** kana reading → Wāpuro sequence
- **Rules / constraints:** Preserve written kana distinction (`おう→ou`, `おお→oo`, etc.). Do not infer macrons then back-convert.
- **Focused QA:** `romaji-core.js`

**C06 — Chōonpu `ー`**

- **Owner:** M05
- **Flow:** preceding vowel + `ー` → repeated vowel
- **Rules / constraints:** Repeat the preceding vowel; never blindly infer `ou`.
- **Focused QA:** `romaji-core.js`

**C07 — Token unresolved-Han guard**

- **Owner:** M10 `blockUnresolvedHanFromRomaji`
- **Flow:** token output → guarded output
- **Rules / constraints:** No unresolved Han may be emitted as if translation succeeded. Preserve diagnostic flags.
- **Focused QA:** `ambiguity-and-audit.js`

### 8.6 Final assembly, punctuation and audit

Use this phase when individual token outputs are correct but the **final sentence** is wrong: name joining, particle casing, lexical casing, numeric grouping, apostrophes, spacing, punctuation, audit data or public return behaviour.

**O01 — Token metadata/classification**

- **Owner:** M07 classifiers + M10 `translateText`
- **Flow:** resolved token → output token record
- **Rules / constraints:** Preserve grammatical/name/numeric/title-boundary metadata used by later spacing. New token flags need explicit ownership and regression coverage.
- **Uses:** grammar/name metadata
- **Focused QA:** relevant domain suite

**O02 — Person-name continuation**

- **Owner:** M10 output assembly
- **Flow:** name tokens → name spacing state
- **Rules / constraints:** Preserve surname/given-name continuation semantics; do not globally join all proper nouns.
- **Uses:** Kuromoji/name metadata
- **Focused QA:** `names-and-loanwords.js`

**O03 — Particle/nominaliser casing**

- **Owner:** M10 boundary formatting
- **Flow:** grammatical token → lowercase/spaced output
- **Rules / constraints:** Only true particles and established particle-based expressions are lowercase under Rule 0.
- **Uses:** grammar config
- **Focused QA:** `grammar.js`

**O04 — Prefix/suffix/auxiliary joining**

- **Owner:** M07 classifiers + M10
- **Flow:** lexical/grammar tokens → joined/spaced units
- **Rules / constraints:** Honour dedicated prefix/suffix and configured auxiliary boundaries; do not replace with generic “join Japanese tokens” logic.
- **Uses:** conjugation config
- **Focused QA:** `grammar.js` + `tokenisation-and-merging.js`

**O05 — Ordinary lexical casing**

- **Owner:** M10 `capitalizeRomaji`/formatting
- **Flow:** lexical token → title-cased token
- **Rules / constraints:** Apply project casing after reading resolution; direct source spellings retain their reviewed form where specified.
- **Uses:** Rule 0
- **Focused QA:** `romaji-core.js`

**O06 — Compact title-number boundary**

- **Owner:** M10 `shouldJoinReviewedTitleCompactNumericSuffix`
- **Flow:** title prefix + contiguous ASCII fraction → joined output
- **Rules / constraints:** Only `title-compact-numeric-prefix` evidence may activate this special join. Do not generalise to arbitrary word+number adjacency.
- **Uses:** title-reading evidence
- **Focused QA:** `names-and-loanwords.js` + `numbers-and-counters.js`

**O07 — Numeric assembly**

- **Owner:** M10 numeric boundary helpers
- **Flow:** numeric tokens → grouped/separated numeric output
- **Rules / constraints:** Attach local place-value units; separate completed groups/`円`; determine the structural join/space boundary before any cross-token apostrophe decision.
- **Uses:** counter/date evidence
- **Focused QA:** `numbers-and-counters.js`

**O08 — Cross-token `n` apostrophe**

- **Owner:** M10 `classifyTokenStructuralBoundary` + `needsCrossTokenApostrophe`
- **Flow:** adjacent outputs → structural join/space decision → apostrophe-safe join when required
- **Rules / constraints:** Apostrophe insertion is a refinement of an existing `join` boundary. It must never replace a structural `space` boundary between independent words or measurement units.
- **Focused QA:** `romaji-core.js` + `numbers-and-counters.js`

**O09 — Reduction/join**

- **Owner:** M10 `appendTokenOutput`
- **Flow:** output token list → raw sentence string
- **Rules / constraints:** Punctuation tokens bypass ordinary spacing; title separators preserve their dedicated behaviour. An unreviewed `×` remains literal and tight (`A×B`) and carries `unreviewed-cross-notation`; reviewed title evidence may instead make it silent, render it as `x`, or resolve a larger whole-title span. Do not infer `kakeru`, `cross` or `times` from the glyph alone, and do not duplicate spacing logic outside the boundary classifier.
- **Focused QA:** `romaji-core.js` + punctuation QA

**O10 — Rule-0 punctuation normalisation**

- **Owner:** M10 `normalizeRule0OutputPunctuation`
- **Flow:** raw sentence → canonical punctuation/spacing
- **Rules / constraints:** Preserve Japanese-wave delimiter handling, subtitle-bar distinction, quotes/brackets and sentence spacing. A single `~`/`～`/`〜` used as a segment separator is rendered with one space on each side (`A ~ B`). A terminal paired wave wrapper remains tight around its enclosed subtitle while staying separated once from preceding title text (`Title 〜Subtitle〜` → `Title ~Subtitle~`; `〜Subtitle〜` → `~Subtitle~`). Source-space-prefixed terminal ASCII hyphen wrappers follow the same provenance principle (`Title -Subtitle-`) without altering ordinary internal Latin hyphens. Ordinary horizontal bars remain tight unless the paired subtitle-bar rule applies.
- **Uses:** Rule 0 punctuation policy
- **Focused QA:** `romaji-core.js` + exhaustive punctuation QA

**O11 — Final unresolved-Han guard**

- **Owner:** M10 `blockUnresolvedHanFromRomaji`
- **Flow:** canonical sentence → final safe output
- **Rules / constraints:** Last safety net: unresolved Han must not leak even if an earlier branch missed it. Any trigger should remain diagnosable.
- **Focused QA:** `ambiguity-and-audit.js`

**O12 — Diagnostics/audit build**

- **Owner:** M10 `buildTranslationDiagnostics`, `publishTranslationDiagnostics`
- **Flow:** token results + final output → audit record
- **Rules / constraints:** Audit must describe the same Romaji path, not choose a different reading. New flags require central policy classification. Scope statistics must derive from reading provenance (`hanScope`, source and flags), never merely from the presence of `[Unresolved]`; unknown Han and unsupported non-Japanese scripts must not inflate unresolved-Japanese metrics.
- **Uses:** review-signal policy
- **Focused QA:** `ambiguity-and-audit.js`

**O13 — Public return/UI publication**

- **Owner:** M11
- **Flow:** final string or `{romaji,audit}` → caller/UI
- **Rules / constraints:** Async methods await readiness; sync methods require readiness; custom bindings and engine-managed UI must not alter translation semantics. Retired bindings must re-check ownership after asynchronous waits before writing. The override checkbox and sources/licences notice remain owned by `translator.html`, not the engine. Kanji Readings data must remain usable without the supplied UI, and rendering must be opt-in through the built-in target or an explicit custom target. Diagnostic state and tools must remain CJ2R-owned and cleanup must never remove a host value.
- **Uses:** runtime config
- **Focused QA:** `runtime-and-api.js` + browser smoke

### 8.7 Adding a completely new pipeline stage

Add a stage only when the behaviour has a reusable scope that no existing stage can own safely. Do not create a new stage merely to fix one example.

Before implementation:

1. Define the failure class and explain why the existing stages above cannot own it safely.
2. Name the exact preceding and following stage so the insertion point is explicit.
3. Define the input/state consumed, output/state produced, and the invariants that neighbouring stages depend on.
4. State what evidence makes the transformation deterministic and what must remain reviewable when evidence is insufficient.
5. Add schema/provenance only if the stage genuinely requires maintained data.
6. Add positive, negative, boundary, punctuation and scope regressions, including at least one case proving the stage does not fire outside its intended scope.
7. Implement it at one intended precedence point. Do not duplicate behaviour across layers unless the architecture specifically requires both a token-stage and resolver-stage component.
8. Update the architectural flow and this reference with the new stage ID, owner, flow, invariants, data dependencies and focused QA. Then follow the normal build/release workflow in Section 1.

Treat changes to stage order, resolver precedence, public API semantics, failure policy, audit classification or source-data interpretation as architectural changes even when the code diff is small.