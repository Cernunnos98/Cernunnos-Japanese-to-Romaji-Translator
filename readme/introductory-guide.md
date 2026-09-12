# CJ2R Introductory Guide

CJ2R — Cernunnos' Japanese to Romaji Translator — is a browser-based Japanese-to-Romaji translator. Kuromoji analyses the complete Japanese sentence, then CJ2R applies reviewed lexical evidence, grammar handling, reading resolution, formatting rules and review safeguards.

This guide is for someone new to the project. It covers the project layout, normal development workflow, basic integration and release checks. More specialised guides are linked where needed.

## 1. Project structure

`translator.html` is the supplied interface, not the translator itself. The reusable browser runtime is:

```text
translator-engine.js
kuromoji.js
data/
```

The main project areas are:

| Location | Purpose |
| --- | --- |
| `translator.html` | Supplied CJ2R interface |
| `translator-hook-example.html` | Minimal host-page integration example |
| `translator-engine.js` | Generated browser runtime |
| `kuromoji.js` | Kuromoji library |
| `data/` | Dictionaries, reviewed readings, grammar and linguistic evidence |
| `src/translator/` | Editable translator JavaScript |
| `tools/` | Build, maintenance and QA tooling |
| `readme/` | Project documentation and Rule 0 |
| `licenses and sources/` | Licences, notices and source attribution |

Two important generated files are built from maintained source:

```text
src/translator/*.js
        ↓
node tools/build-translator-engine.js
        ↓
translator-engine.js
```

```text
tools/qa/suites/*.js
        ↓
node tools/qa/build-translator-qa.js
        ↓
tools/qa/translator-qa.js
```

Edit the maintained source, not the generated output.

### Detailed references

| Area | Reference |
| --- | --- |
| Romanisation rules and expected output | `readme/Romaji Rules.docx` |
| Runtime data, evidence and provenance | `readme/translator-guide.md` |
| JavaScript source and build structure | `src/translator/translator-source-development-guide.md` |
| Website integration and public API | `readme/translator-integration-guide.md` |
| Release QA | `tools/qa/translator-release-qa-guide.md` |
| QA troubleshooting | `tools/qa/translator-qa-troubleshooting.md` |
| Exact translation control-flow | `readme/cj2r-architectural-control-flow.md` |
| Runtime/distribution file requirements | `readme/translator-required-files-summary.md` |
| Yomitan review-candidate generation | `tools/evidence-candidate-generation/yomitan-evidence-candidate-generation-guide.md` |
| EDRDG maintenance | `tools/edrdg-update/cj2r-edrdg-updater-guide.md` |

The provenance and naming documents in `readme/` are audit records rather than day-to-day guides.

## 2. Running the supplied translator

Keep these together:

```text
translator.html
translator-engine.js
kuromoji.js
data/
```

Serve the project over HTTP or HTTPS. Do not use a `file://` page for deployment testing because CJ2R loads scripts, JSON and Kuromoji dictionary files.

For example, from the project root:

```bash
py -m http.server 8000
```

Then open:

```text
http://localhost:8000/translator.html
```

The Japanese input remains disabled while assets load. Once CJ2R is ready, enter Japanese in **Japanese Text**; the result appears in **Romaji Translation**.

The **Kanji Readings** panel is a manual reference tool. It shows possible On'yomi and Kun'yomi readings, but CJ2R does not construct contextual word readings by joining individual Kanji readings. The same readings are available to custom integrations through `RomajiTranslator.getKanjiReadings()` / `getKanjiReadingsSync()`, or through an explicit `data-cj2r-kanji-readings` rendering target. Pages that omit a readings target do not use the Kanji-rendering lifecycle.

The **Override Enabled** control is mainly useful for diagnosis. Disabling it shows what the normal translation pipeline produces without exact or contextual overrides. The supplied `translator.html` owns this checkbox and the Sources & licences notice; `translator-engine.js` does not create, discover or synchronise either control.

## 3. Rule 0

The authoritative output rules are in:

```text
readme/Romaji Rules.docx
```

The project calls this **Rule 0**. Code, data and QA expectations must follow it, even where another romanisation convention would choose a different form.

A required example is:

```text
痛いのは嫌なので防御力に極振りしたいと思います。
Itai no wa Iya nano de Bougyoryoku ni Kyokufuri Shitai to Omoimasu.
```

When a test expectation is disputed, check Rule 0 first.

## 4. Translation flow

A normal translation follows this broad path:

```text
Japanese input
    ↓
optional exact whole-input override
    ↓
normalisation
    ↓
Kuromoji tokenises the complete sentence
    ↓
post-tokenisation repair and reviewed span recognition
    ↓
reading resolution
    ↓
kana-to-Romaji conversion
    ↓
capitalisation, spacing and punctuation
    ↓
final Romaji
```

The complete normalised sentence must reach Kuromoji before ordinary lexical decisions are made. Do not cut recognised words out of the raw Japanese before tokenisation. CJ2R performs lexical repair and merging afterwards so Kuromoji retains sentence context.

For the exact pass order and resolver precedence, use `readme/cj2r-architectural-control-flow.md`.

## 5. Integrating CJ2R into another site

A host site does not need `translator.html`. A normal runtime directory can be:

```text
/assets/romaji/
    translator-engine.js
    kuromoji.js
    data/
```

Runtime diagnostics are off by default and should normally be omitted in production:

```html
<script src="/assets/romaji/translator-engine.js"></script>
```

Set `window.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true }` before the engine only when development or troubleshooting requires CJ2R's browser diagnostics. This setting does not control the supplied status banner, override checkbox or other UI elements.

Normal asynchronous translation:

```js
const romaji = await RomajiTranslator.translate(japaneseText);
```

Synchronous translation is available after readiness:

```js
if (RomajiTranslator.isReady()) {
    const romaji = RomajiTranslator.translateSync(japaneseText);
}
```

Calling `translateSync()` before readiness throws an error rather than using a reduced fallback translation.

The binding helper can connect CJ2R to existing controls:

```js
const binding = RomajiTranslator.bind({
    field: '#japanese',
    button: '#romanise',
    output: '#romaji'
});
```

The returned binding can later be changed or removed. Rebinding or unbinding while initialisation is still pending cannot write stale output into the retired target:

```js
binding.setOverridesEnabled(false);
binding.unbind();
```

Kanji reading data can be consumed without using the supplied UI:

```js
const readings = await RomajiTranslator.getKanjiReadings(text);
```

For automatic rendering in a custom page, add `data-cj2r-kanji-readings` to the target and point `data-cj2r-kanji-source` at the source field. An optional `data-cj2r-kanji-search` selector adds the same search behaviour as the supplied interface. If the target is added after CJ2R has loaded, call `RomajiTranslator.refreshUi()` once after insertion.

Use the audit API when an integration needs uncertainty information without changing the normal result:

```js
const { romaji, audit } = await RomajiTranslator.translateWithAudit(text);

if (audit.requiresReview) {
    console.log(audit.redFlags);
}
```

Historical kana is opt-in:

```js
const romaji = await RomajiTranslator.translateHistorical(text);
```

See `readme/translator-integration-guide.md` for the complete API and deployment details.

## 6. Source, data and QA are separate

Keep this distinction clear:

```text
TRANSLATOR
├── src/translator/*.js   ← logic
└── data/*                 ← linguistic data and evidence

TESTS
└── tools/qa/suites/*.js  ← expected behaviour and safeguards

GENERATED
├── translator-engine.js
└── tools/qa/translator-qa.js
```

QA verifies behaviour; it does not define it. A correction belongs in translator source or data, with a regression added afterwards when permanent coverage is warranted.

Do not change an expected result merely to match current output. The expectation must be justified by Rule 0 and the relevant evidence.

## 7. Changing translator logic

Edit the module under `src/translator/` that owns the behaviour:

- `00-contracts.js` — shared JSDoc contracts; no runtime behaviour
- `01-assets-and-schemas.js` — asset paths, criticality and schemas
- `02-ui-controls.js` — built-in UI controls
- `03-runtime-state.js` — runtime state and diagnostic coordination
- `04-data-and-kanji-loaders.js` — shared loading and Kanji helper data
- `05-romaji-core.js` — deterministic kana-to-Romaji mechanics
- `06-lexical-and-evidence-loaders.js` — lexical/evidence loading and indexes
- `07-token-merging.js` — reviewed post-Kuromoji span merging
- `08-reading-resolver.js` — reading selection and name safeguards
- `09-token-repair-and-grammar.js` — token repair, morphology and grammar
- `10-output-and-translation-pipeline.js` — translation, output and audit policy
- `11-public-api-and-bootstrap.js` — initialisation, binding and public API

Then rebuild:

```bash
node tools/build-translator-engine.js
```

To check generated parity without writing:

```bash
node tools/build-translator-engine.js --check
```

Do not make permanent fixes directly in `translator-engine.js`.

## 8. Changing translator data

Many corrections belong in data rather than JavaScript.

| Change | Typical location |
| --- | --- |
| Exact complete-input exception | `data/Overrides/overrides.json` |
| Context-dependent exception | `data/Overrides/context-overrides.json` |
| Scoped title reading/spelling | `data/title-readings/` |
| Reviewed common word | `data/common-words/` |
| General lexical evidence | `data/general-words/` |
| Compound | `data/compound-words/` |
| Ateji | `data/ateji/` |
| Proper name | `data/nouns/` |
| Loanword/source spelling | `data/loanwords/` |
| Grammar and particles | `data/grammar/` |
| Rendaku evidence | `data/rendaku/` |
| Reading ambiguity evidence | `data/reading-evidence/` |
| Historical kana | `data/historical-kana/` |

A normal JSON edit does not require rebuilding `translator-engine.js`. Rebuild only when JavaScript loading, schema or interpretation code changes.

Some externally derived files have recorded provenance hashes. Follow `readme/translator-guide.md` when changing one of those files.

## 9. Changing QA

On Windows, the QA Dashboard is the primary way to run QA: open `tools/qa/` and double-click **`Open CJ2R QA Dashboard.cmd`**. The browser dashboard requires no command entry and offers the comprehensive release gate, the complete translation diagnostic, focused translator scans and technical checks. Only **Comprehensive release QA** is release-certifying. Direct command-line runners are retained for automation, non-Windows use and advanced troubleshooting.

Maintained QA source is under:

```text
tools/qa/suites/
```

After editing a suite, rebuild the aggregate:

```bash
node tools/qa/build-translator-qa.js
```

Check parity without writing:

```bash
node tools/qa/build-translator-qa.js --check
```

Run the main Node regression suite with:

```bash
node tools/qa/run-translator-node-qa.js
```

The focused suites remain modular, but the runner still reports one authoritative regression result.

## 10. Normal fix workflow

1. **Reproduce the problem.** Record the Japanese input, current output, expected output and the Rule 0/evidence basis for that expectation.
2. **Find the responsible layer.** Decide whether the problem is data, tokenisation/merging, reading selection, grammar, Romaji conversion, formatting or runtime behaviour.
3. **Fix the mechanism.** Prefer the smallest correct layer. Use reviewed data for lexical facts and code for general behaviour.
4. **Add regression coverage.** Protect the mechanism, not only one convenient example.
5. **Rebuild generated files where required.** Rebuild the engine after source JavaScript changes and the QA aggregate after suite changes.
6. **Use the QA Dashboard for the relevant focused checks, then choose Comprehensive release QA when release certification is required.**

If the Japanese genuinely supports several readings and the available context does not settle them, preserve that uncertainty. A review signal can be the correct outcome.

## 11. Release QA

For normal Windows QA, open `tools/qa/`, double-click **`Open CJ2R QA Dashboard.cmd`**, then choose **Comprehensive release QA**. This is the intended interactive release-QA path.

The equivalent direct command-line release gate is the secondary/manual path:

```bash
node tools/qa/run-translator-release-qa.js
```

After JavaScript source changes, you can rebuild and test in one command:

```bash
node tools/qa/run-translator-release-qa.js --build
```

The gate covers generated-source parity, structural/package integrity, static checking, canonical/generated/differential QA, punctuation boundaries, browser integration, failure handling and maintenance-tool safety. `tools/qa/run-translator-structural-integrity.py` is invoked early by the top-level release runner and is a hard release failure if required files, package hygiene or maintained structural invariants are wrong.

A wrapper timeout is not a test result. Inspect the underlying process/log state before deciding whether a step passed or failed. See `tools/qa/translator-qa-troubleshooting.md` for recovery guidance.

The full gate expects Node.js, Python 3, TypeScript (`tsc`), Chromium/Chrome and Graphviz `dot`. `CJ2R_PYTHON` (or `PYTHON`) can point the structural gate at a non-standard Python 3 executable, and `CHROMIUM` can point the browser checks at a non-standard browser location.

## 12. Production and redistribution

A production webpage needs:

```text
translator-engine.js
kuromoji.js
data/
```

Add `translator.html` only if the supplied interface is wanted.

A maintained source/release package should also keep:

```text
src/translator/
tools/
readme/
licenses and sources/
```

`licenses and sources/` is not a browser dependency, but it belongs with redistributed copies of the corresponding software and data. `translator.html` provides a built-in Sources & licences notice; a custom host may present those notices differently, but UI ownership does not remove the downstream operator's applicable acknowledgement or licence obligations.

CJ2R can be hosted separately from the page that uses it. Assets resolve relative to the engine or an explicit `assetBaseUrl`; cross-origin hosting requires normal CORS permissions, and HTTPS production pages should use HTTPS asset origins. `assetBaseUrl` is a code/data trust boundary: configure only infrastructure controlled or explicitly trusted by the operator. Its URL validation prevents unsafe configuration classes but does not authenticate content; the asset origin can supply executable `kuromoji.js` as well as translator data. Deploy a coherent, preferably versioned release instead of mixing files from different versions.

CJ2R targets modern evergreen browsers. The maintained browser release gate is Chromium-based; a downstream operator that requires Firefox, Safari or older-browser guarantees owns those additional compatibility tests. The supplied `translator.html` contains inline script/style and may need the site's normal CSP nonce/hash/externalisation treatment. Engine nonce propagation covers scripts CJ2R creates dynamically; it does not authorise host-page inline blocks.

The downstream operator also owns ongoing maintenance after hand-off. For EDRDG-derived material, retain the applicable source/licence notices and use the supported procedure in `tools/edrdg-update/` regularly enough to satisfy the maintained upstream requirements. The package should not be treated as install-once-and-ignore where those obligations apply.

## 13. Short version

```text
Rule 0 defines the output.
Source and data produce it.
QA verifies it.
Build scripts produce generated artefacts.
Release QA checks the project as a whole.
```

For a correction: reproduce it, choose the correct layer, fix it narrowly, add regression coverage, rebuild what changed and run the release gate.
