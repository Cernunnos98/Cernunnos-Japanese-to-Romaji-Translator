# Required Files Summary

This document lists the files needed for CJ2R at runtime, for the supplied interfaces, and for maintained development/release work.

## 1. Core runtime

A production integration needs:

```text
translator-engine.js
kuromoji.js
data/
```

The engine classifies runtime assets as **critical** or **optional**.

### Critical assets

CJ2R does not report itself as ready if a critical asset is missing or fails schema validation. Critical assets include:

- `kuromoji.js` and `data/dict/`;
- `data/kanji/kanji-bank-1.json` and `kanji-bank-2.json`;
- the main lexical banks under `data/common-words/`, `data/general-words/`, `data/loanwords/`, `data/compound-words/`, `data/ateji/` and `data/nouns/`;
- `data/grammar/particle-expressions.json`;
- `data/grammar/conjugation-patterns.json`;
- `data/grammar/counter-date-reading-evidence.json`;
- `data/reading-evidence/contextual-reading-evidence.json`;
- `data/reviewed-reading/reviewed-reading-evidence.json`.

Critical JSON must match its declared schema. Valid JSON with the wrong structure is still a critical load failure.

### Optional assets

CJ2R can initialise without these, but records a warning and disables the affected evidence:

- `data/Overrides/overrides.json`;
- `data/Overrides/context-overrides.json`;
- `data/title-readings/title-reading-evidence.json`;
- `data/kanji/kanji-variants.json`;
- `data/kanji/japanese-han-scope.json`;
- `data/nouns/reviewed-proper-name-span-evidence.json`;
- `data/reading-evidence/reading-evidence.json`;
- `data/rendaku/rendaku-evidence.json`;
- `data/historical-kana/historical-kana-evidence.json`.

Historical evidence is consulted only by the explicit historical APIs.

The authoritative runtime asset registry and schemas are in `src/translator/01-assets-and-schemas.js`.

## 2. Non-runtime release/provenance data

The browser does not fetch these during normal translation, but maintained release packages should retain them:

- `data/external-evidence-source-provenance.json` — pinned hashes and source/licence records for tracked external evidence;
- `data/translator-data-provenance-classification.json` — provenance classification for every maintained file under `data/`;
- `readme/translator-data-provenance-classification-audit.md` — human-readable provenance summary.

Every maintained `data/` file must have a complete provenance classification.

## 3. Supplied interfaces

For the built-in interface, add:

```text
translator.html
```

For the minimal host-page integration example, add:

```text
translator-hook-example.html
```

Both use the same core runtime package. `translator-hook-example.html` also demonstrates the optional `data-cj2r-kanji-readings` hook; no additional runtime file is required because the Kanji banks are already part of the core package.

## 4. Development and release files

A maintained source package should also retain:

```text
src/translator/
tools/
readme/
licenses and sources/
```

Key points:

- `src/translator/` is the editable JavaScript source;
- `translator-engine.js` is generated with `node tools/build-translator-engine.js`;
- `tools/qa/Open CJ2R QA Dashboard.cmd` is the primary Windows QA entry point and requires no command entry;
- `tools/qa/run-translator-qa-dashboard.js`, `tools/qa/run-translator-focused-qa.js` and `tools/qa/dashboard/{server.js,app.js,index.html,styles.css}` are maintained QA Dashboard components and must be present in a maintained release package;
- `tools/qa/run-translator-structural-integrity.py` is the authoritative structural/package-integrity gate and is invoked by `tools/qa/run-translator-release-qa.js`;
- `tools/qa/` also contains the complete release/regression QA and generated QA bundle;
- `tools/evidence-candidate-generation/` contains review-candidate tooling;
- `tools/edrdg-update/` contains the controlled EDRDG refresh procedure;
- `readme/introductory-guide.md` is the project entry guide and `readme/translator-guide.md` is the maintained data/evidence guide;
- `licenses and sources/` contains required project and third-party notices/attribution.

Temporary checkpoints, pre-edit hash snapshots, session/recovery manifests, temporary QA outputs and obvious duplicate/backup copies are not maintained project files and must stay outside the release tree. Structural QA enforces this package hygiene as well as the maintained Dashboard file set.

Runtime diagnostics are disabled by default. Development or troubleshooting hosts may opt in before loading the engine:

```js
window.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true };
```

This mode loads the browser diagnostic QA bundle and runs its initialisation-time regression checks; it does not create or control page UI. Diagnostic state is read through `RomajiTranslator.getDiagnostics()` rather than generic host-page globals. Production deployments normally omit this setting. With runtime diagnostics disabled, `tools/qa/` is not a browser runtime dependency.

## 5. Distribution quick reference

| Package | Files |
| --- | --- |
| Core runtime | `translator-engine.js`, `kuromoji.js`, `data/` |
| Built-in UI | Core runtime + `translator.html` |
| Hook example | Core runtime + `translator-hook-example.html` |
| Maintained source/release | Runtime + `src/`, `tools/`, `readme/`, `licenses and sources/` |

`licenses and sources/` is not required for execution, but it belongs with redistributed copies containing the corresponding third-party software or data (or the applicable equivalent notices/links where the relevant packaging rules permit). A custom interface may replace CJ2R's supplied Sources & licences UI, but the downstream operator still owns the applicable acknowledgement/licence obligations and ongoing EDRDG-derived-data maintenance. See `readme/translator-integration-guide.md` and `tools/edrdg-update/cj2r-edrdg-updater-guide.md`.

For maintained file-naming rules, see `readme/translator-file-naming-audit.md`. For QA requirements, see `tools/qa/translator-release-qa-guide.md`.
