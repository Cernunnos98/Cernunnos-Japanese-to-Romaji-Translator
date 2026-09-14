# Release QA Guide

CJ2R's release QA verifies the complete stored project rather than a few hand-picked translations. For diagnosis, see `translator-qa-troubleshooting.md`.

## 1. Full release gate

### Primary method: QA Dashboard

On Windows, the intended interactive QA method is to open `tools/qa/` and double-click:

**Open CJ2R QA Dashboard.cmd**

The launcher finds the project automatically, starts the local dashboard and opens it in the default browser. No command needs to be entered. Choose **Comprehensive release QA** when a release-certifying run is required. Use the focused and technical scans for diagnosis without running unrelated checks.

The gate verifies, in a fail-closed sequence where generated parity and structural/package integrity run before behavioural QA:

- `translator-engine.js` and its source map match `src/translator/`;
- `translator-qa.js` and its source map match the focused QA suites;
- the generated architectural SVG matches the Markdown/Mermaid source;
- structural/package integrity passes, including required maintained files, QA Dashboard completeness, package hygiene and generated/source consistency;
- JSDoc/TypeScript `checkJs` with the explicit CJ2R null-safety policy passes;
- the symbol-resolved source dependency graph is acyclic;
- canonical, generated and differential Node QA passes;
- the differential review ledger has no unreviewed/pending disagreement;
- exhaustive punctuation/boundary QA passes;
- browser smoke passes in development, production-configured and cross-origin modes;
- registry-derived failure injection covers every declared scenario exactly once;
- representative malformed JSON follows the correct critical/optional failure policy;
- evidence-candidate and EDRDG updater safety tests pass.

The Node runner still reports one authoritative regression result even though maintained QA source is split across focused files under `tools/qa/suites/`.

The dashboard shows step progress, failures, detailed output and elapsed time. Keep the small launcher window open while using the dashboard, or use **Close dashboard** in the interface when finished. It offers:

- **Comprehensive release QA**, which runs every release gate and is the only release-certifying option;
- a complete translation diagnostic;
- focused translator scans for Romaji rules, tokenisation and merging, tokenisation mutation, numbers and counters, names and loanwords, grammar, ambiguity and audit, historical kana, and runtime/API behaviour;
- focused technical checks for punctuation, generated-file parity, types, dependencies and provenance.

Focused and technical scans are diagnostic only. They do not certify a release. Select **Build generated files first** only when maintained translator or QA source has changed.

No host-page or production configuration change is required before QA. Runners that need CJ2R's internal diagnostic hooks enable `runtimeDiagnostics: true` inside their own isolated test context before loading the engine, while production-behaviour stages keep runtime diagnostics disabled. This applies whether QA is started from the Dashboard or from the command line.

Direct command-line use is the secondary/manual path for automation, non-Windows environments and advanced troubleshooting. To start the dashboard manually:

```bash
node tools/qa/run-translator-qa-dashboard.js
```

To run the release gate directly instead of through the dashboard:

```bash
node tools/qa/run-translator-release-qa.js
```

If translator JavaScript changed and generated files need rebuilding first:

```bash
node tools/qa/run-translator-release-qa.js --build
```

By default the dashboard asks the operating system for an available local port, avoiding collisions with other local tools. Add `--no-open` to suppress automatic browser opening or `--port=PORT` to request a specific local port.

The complete release gate requires Node.js, Python 3, TypeScript (`tsc`), Chromium/Chrome and Graphviz `dot`. Supported TypeScript versions are >=5.8.0 and <7.0.0; `run-translator-typecheck.js` rejects versions outside that range. The static policy is explicit `checkJs` + `strictNullChecks`, with broad strict mode and `noImplicitAny` disabled so a compiler-default change cannot silently redefine release acceptance. The runner accepts `CJ2R_PYTHON` (or `PYTHON`) for a non-standard Python 3 executable and `CHROMIUM` for a non-standard Chromium/Chrome executable.

## 2. Generated artefacts and parity

Maintained QA source is under `tools/qa/suites/`. `tokenisation-mutation.js` is the dedicated adversarial suite for artificial Kuromoji boundary mutations; its fixed expectations are Rule-0/mechanism expectations, not snapshots of current translator output.

`tokenisation-and-merging.js` contains isolated coverage for each authoritative-span acceptance gate. Keep those checks independent when changing `findLongestAuthoritativeSpan`; the variant-normalised single-token gate overlaps with multi-token authority in some cases but is still required for other categories.

Permanent regressions use mechanism identities rather than temporary work-item identities. `regression-mechanisms.js` is a QA infrastructure module—not an additional regression suite—and defines and validates the permanent taxonomy:

- Kana completeness;
- zero unresolved Japanese;
- tokenisation invariance;
- grammatical boundaries;
- whole-word readings;
- ateji/gikun;
- proper names;
- loanwords;
- uncertainty propagation;
- mixed-script handling;
- semantic annotation ownership;
- source integrity;
- source-span candidate discovery;
- numeric/counter role arbitration;
- final output/evidence consistency.

Checks in this taxonomy use `MECH-*` IDs. The harness rejects temporary work-item identifiers, rejects unknown mechanism prefixes, requires every mechanism to remain represented, and rejects rationales based only on development history. The regression `rule` must explain the behaviour being protected; the originating title alone is not a rationale. The canonical Node report exposes `regressionMechanismSummary` so coverage remains visible independently of the source file in which a check lives.

Source-integrity mechanism checks exercise silent deletion, duplication, overlap, ordering and written-surface mismatches. Semantic-ownership checks verify that changed spans invalidate inherited span-bound state, same-span transformations retain valid ownership, and known larger-span lexical constructions cannot be corrupted by stale smaller-span roles. Runtime diagnostics run the same source/ownership validation on the final annotated token stream before internal semantic fields are projected away.

Source-span candidate-discovery checks verify that candidate creation is non-destructive, competing interpretations may overlap, non-tokenizer evidence is independent of a particular Kuromoji split, grammatical morphology is recorded as evidence rather than segmentation authority, and discovery cannot mark a candidate selected/winning. Runtime diagnostics expose the unselected candidate inventory, category counts and candidate provenance validation separately from final selected-token structural validation.

Numeric-role checks verify that counter/date data is role-typed, semantic role is selected before pronunciation, minute sound change is scoped to an already-selected minute role, incompatible same-span lexical/counter evidence remains reviewable, and larger lexical spans cannot be consumed by a smaller counter interpretation.

Build the browser-facing aggregate with:

```bash
node tools/qa/build-translator-qa.js
```

Check without writing:

```bash
node tools/qa/build-translator-qa.js --check
```

The architectural flow is maintained in `readme/cj2r-architectural-control-flow.md`. Generate/check its SVG with:

```bash
node tools/build-cj2r-flowchart.js
node tools/build-cj2r-flowchart.js --check
```

`--check` verifies the embedded Mermaid source hash and the rendered graph's semantic nodes, edges and labels. Graphviz layout-only geometry (coordinates, paths and placement) is deliberately excluded from parity because different Graphviz versions/platforms can render the same graph with minor coordinate drift. The check still invokes `dot`, so a missing/broken renderer or unparsable graph fails. Real rebuilds can therefore produce harmless SVG geometry churn even when semantics are unchanged; avoid committing a rebuilt SVG unless the Mermaid source changed, and review any rebuild diff accordingly.

The translator engine follows the same source/generated rule:

```bash
node tools/build-translator-engine.js
node tools/build-translator-engine.js --check
```

Do not repair parity failures by editing generated files directly.

## 3. Browser environment and timeouts

The browser runners use `tools/qa/browser/cdp-harness.js` for Chromium launch, CDP deadlines, process-group ownership and temporary-profile cleanup.

If Chromium is not in a standard location:

```bash
CHROMIUM=/path/to/chromium node tools/qa/run-translator-release-qa.js
```

CJ2R's own watchdogs are intentionally generous. An internal timeout identifies the failing step and performs normal owned-process cleanup. An outer shell/IDE/CI timeout is **not** a test result; inspect the underlying process and logs before deciding whether the step passed or failed.

`SIGINT`, `SIGTERM` and CJ2R watchdogs can clean owned process groups. An uncatchable external `SIGKILL` cannot be handled by the test process, so automation should terminate the QA process group cleanly.

Default timing can be overridden for genuinely slow CI with the documented `TRANSLATOR_*_TIMEOUT_MS` environment variables. Do not increase timeouts to hide a reproducible failure.

Browser smoke covers the reusable runtime surface as well as translation output. Its lifecycle checks include stale/unbound/rebound `bind()` protection, built-in and custom Kanji Readings rendering, direct Kanji API access, late custom-target registration/removal through `refreshUi()`, operation without a readings target, single-refresh behaviour, host-global diagnostics isolation, destroy/hot-reload, CSP nonce propagation and supported cross-origin asset loading. Development smoke also opens the maintained `translator.html` and `translator-hook-example.html` directly so the supplied integrations are verified rather than inferred from a synthetic fixture. The `translator.html` check also verifies that the page owns its override checkbox/label and sources/licences notice, while direct engine override API calls do not mutate those page controls.

## 4. Partitioned punctuation QA

`run-translator-punctuation-boundary-partitioned.js` is the release wrapper for the exhaustive punctuation/boundary matrix. It runs bounded partitions and verifies the complete expected coverage.

The permanent punctuation contract distinguishes separator and wrapper roles. Single wave delimiters must remain `A ~ B`; terminal paired wave wrappers must remain tight inside (`Title ~Subtitle~`). Paired ASCII hyphen subtitle wrappers are validated from source punctuation provenance so internal Latin hyphens are not reformatted. Title-specific examples must not replace these mechanism-level checks.

Use the single-partition runner only for focused diagnosis:

```bash
node tools/qa/run-translator-punctuation-boundary-qa.js
```

with the relevant partition environment settings.

## 5. Partitioned failure injection

`run-translator-failure-injection-partitioned.js` is the official release wrapper. It obtains the authoritative scenario registry, distributes scenarios across bounded child partitions, runs those partitions with controlled concurrency, then rejects:

- missing scenario IDs;
- duplicate scenario IDs;
- unexpected scenario IDs;
- failed scenarios.

Each underlying resource scenario remains browser-isolated. The matrix includes deterministic permanent failures, transient retries, fetch/script timeouts, the configurable Kuromoji construction deadline, a slower-but-valid tokenizer build, binding failure containment and diagnostics-bridge collision/cleanup ownership. Retry scenarios verify the exact bounded attempt count rather than accepting eventual success alone.

Default orchestration uses 18 partitions with two running concurrently. Slow/resource-constrained CI may adjust:

- `TRANSLATOR_FAILURE_PARTITIONS`;
- `TRANSLATOR_FAILURE_PARTITION_CONCURRENCY`;
- `TRANSLATOR_FAILURE_PARTITION_TIMEOUT_MS`.

The lower-level partition count/index settings are for diagnostics/orchestration, not for reducing release coverage.

## 6. External evidence provenance hashes

After intentionally changing a file already tracked by `data/external-evidence-source-provenance.json`, refresh its recorded SHA-256 with:

```bash
node tools/qa/update-external-evidence-source-provenance-hashes.js
```

Check without writing:

```bash
node tools/qa/update-external-evidence-source-provenance-hashes.js --check
```

The updater changes existing hash fields only. It does not invent or alter source, snapshot, version or licence metadata.

Every maintained file under `data/` must have a complete entry in `data/translator-data-provenance-classification.json`.

## 7. Evidence and source-maintenance tools

### Yomitan review candidates

`tools/evidence-candidate-generation/` turns a hash-pinned extracted Yomitan snapshot into deterministic review-only candidates. It cannot write directly into runtime `data/`.

See `tools/evidence-candidate-generation/yomitan-evidence-candidate-generation-guide.md`.

### EDRDG maintenance

`tools/edrdg-update/cj2r-edrdg-updater.js` stages and verifies maintained Jitendex/JMdict, JMnedict and KANJIDIC source refreshes. Application requires the reviewed manifest hash and runs the full release gate against both candidate and promoted states, with rollback if the live gate fails.

Release QA tests the updater with offline synthetic fixtures; it does not download current dictionaries during an ordinary release run.

See `tools/edrdg-update/cj2r-edrdg-updater-guide.md`.

## 8. Main QA files

| File | Purpose |
| --- | --- |
| `suites/*.js` | Maintained focused QA source plus small QA infrastructure modules |
| `suites/regression-mechanisms.js` | QA infrastructure: permanent regression taxonomy, annotation and coverage validation (not a standalone regression suite) |
| `suites/tokenisation-mutation.js` | Adversarial artificial-tokenisation and boundary-invariance QA |
| `translator-qa.js` | Generated browser-facing QA aggregate |
| `build-translator-qa.js` | Build/parity check for the aggregate |
| `run-translator-node-qa.js` | Canonical/generated/differential Node QA |
| `run-translator-focused-qa.js` | One selected translator functional-area regression scan |
| `run-translator-typecheck.js` | Version-bounded TypeScript `checkJs` + explicit `strictNullChecks` validation (`>=5.8 <7`) |
| `run-translator-dependency-check.js` | Symbol-resolved acyclic source-dependency validation |
| `run-translator-punctuation-boundary-partitioned.js` | Complete punctuation/boundary release wrapper |
| `run-translator-browser-smoke-cdp.js` | Development/production/cross-origin browser smoke; also verifies the supplied interface and hook example |
| `run-translator-failure-injection-partitioned.js` | Complete failure-injection release wrapper |
| `translator-differential-review-decisions.json` | Reviewed differential-decision ledger |
| `browser/cdp-harness.js` | Shared browser/process harness |
| `browser/fake-dom.js` | Minimal Node DOM emulation |
| `run-translator-structural-integrity.py` | Authoritative structural/package-integrity gate; invoked by the top-level release runner |
| `run-translator-release-qa.js` | Top-level release gate |
| `run-translator-qa-dashboard.js` | Local readable QA dashboard launcher |
| `Open CJ2R QA Dashboard.cmd` | Double-click Windows launcher for the QA dashboard |
| `dashboard/` | Local-only dashboard server and interface assets |

`tools/` is developer-only and is not required by a production webpage when runtime diagnostics are disabled.

## 9. Release acceptance principle

A release is not complete merely because the local gate passed. For Drive promotion, use the project's release discipline:

1. promote changed files in place where possible;
2. fetch every changed/new file back from Drive;
3. compare Drive-returned bytes/SHA-256 with the tested candidate;
4. reconstruct the tested release from those returned bytes;
5. rerun the relevant release gate without silently rebuilding first;
6. confirm no owned Node/Chromium/profile resources remain.

Only then treat the promoted Drive tree as the accepted release.
