# Translator QA Troubleshooting

Use this guide to diagnose QA failures without weakening translator behaviour or tests. Start with the smallest relevant check; finish release-level changes with the full release gate.

## First checks

On Windows, use the QA Dashboard as the primary diagnostic entry point: open `tools/qa/` and double-click **`Open CJ2R QA Dashboard.cmd`**. Use a focused scan when isolating one subsystem; use **Comprehensive release QA** when checking whether the complete project is releasable. No command needs to be typed.

The equivalent direct command-line checks are secondary/manual options for automation, non-Windows use or troubleshooting the dashboard itself:

```bash
node tools/build-translator-engine.js --check
node tools/qa/run-translator-release-qa.js
```

If JavaScript under `src/translator/` changed intentionally, rebuild first or run the release gate with `--build`.

## Structural/package-integrity failure

The structural gate is an early hard release check. Treat its result as a package defect, not as a translation regression. Typical causes include:

- a required maintained file or QA Dashboard component is missing;
- a generated artefact no longer matches its maintained source;
- a temporary checkpoint, recovery manifest, QA output or obvious backup/duplicate file was placed inside the release tree;
- a maintained `data/` file lacks complete provenance classification;
- a retired or ambiguous project path has been reintroduced.

Fix the package/source tree itself and rerun the gate. Do not bypass the structural stage or weaken its required-file/package-hygiene rules to make a candidate pass.

## `translator-engine.js is out of date`

A source module changed but the generated engine was not rebuilt.

```bash
node tools/build-translator-engine.js
```

Do not copy fixes directly into `translator-engine.js`; the source modules are authoritative.

## Translator is not ready

If `translateSync()` is called before initialisation, either wait for `RomajiTranslator.ready` or use the asynchronous `translate()` method.

If readiness itself rejects, inspect the browser console/developer warning. A critical asset may be missing, malformed or failing its schema.

## Critical data/schema failure

Critical JSON must:

- exist at the declared asset path;
- parse as JSON;
- match the schema in `src/translator/01-assets-and-schemas.js`.

Fix the named data/path first. If the format intentionally changed, update the loader/schema together and add regression coverage.

## Optional data warning

Optional evidence may fail softly while the core translator remains usable. If the resource should be present, fix its path/content rather than suppressing the warning or changing criticality without justification.

## Timeout or orphan process report

Node.js, Python 3, TypeScript (`tsc`), Graphviz `dot` and Chromium/Chrome are developer/release QA dependencies only; they are not browser translator runtime dependencies.

Distinguish an internal CJ2R watchdog from an outer shell/IDE/CI timeout:

- an internal timeout identifies the failing step and performs normal owned-process cleanup;
- an outer timeout is neither pass nor fail—inspect child processes and logs;
- `SIGINT`/`SIGTERM` and internal watchdogs can clean owned Chromium groups/profiles;
- an external `SIGKILL` cannot be caught.

After an interrupted run, check for QA-owned Chromium processes and `translator-qa-*` / `translator-failure-injection-*` temporary profiles before retrying.

## Chromium cannot start

Point the runner at the installed browser:

```bash
CHROMIUM=/path/to/chromium node tools/qa/run-translator-release-qa.js
```

This is an environment issue, not a translation failure.

## Canonical regression failure

Treat the expected result as a project requirement unless Rule 0 or an explicitly reviewed policy change says otherwise.

1. Reproduce the input.
2. Find the responsible layer: tokenisation, repair, reading resolution, Romaji conversion, grammar/capitalisation or final formatting.
3. Fix source/data at that layer.
4. Keep the regression; do not weaken it simply to match the current output.
5. Add a nearby negative/control case when useful to prevent overreach.

## Generated QA fails but canonical QA passes

Generated checks often expose structural issues in maintained evidence, variants, punctuation or schema assumptions. Fix the responsible structure/mechanism rather than adding a one-off override.

## Punctuation/boundary QA failure

Reproduce the complete matrix with:

```bash
node tools/qa/run-translator-punctuation-boundary-partitioned.js
```

Use the single-partition runner for focused diagnosis.

Before adding punctuation-specific exceptions, check:

- compatibility/canonical mapping;
- hard-boundary classification;
- exact-override trailing punctuation;
- protected Japanese orthographic marks;
- reviewed spans containing punctuation;
- Latin passthrough such as URLs.

Treat the problem as a boundary-layer defect unless Rule 0 explicitly distinguishes the forms.

## Browser QA fails but Node QA passes

Investigate browser/runtime integration rather than linguistic logic. Check:

- browser console errors;
- asset paths relative to `translator-engine.js`;
- manifest paths and file existence;
- readiness and the public `RomajiTranslator` API;
- production/cross-origin configuration where relevant.

## Failure injection failure

Failure injection verifies that optional resources fail softly and critical resources fail safely. Do not make a critical resource optional merely to pass the test. Decide whether reliable translation is genuinely possible without that resource.

## Japanese word is split or read incorrectly

Before adding an override, choose the correct layer:

| Problem | First place to inspect |
| --- | --- |
| Known lexical reading | Appropriate lexical data bank |
| Proper name | Reviewed name evidence / name resolver |
| Grammatical expression | Grammar data |
| Rendaku | Attested Rendaku evidence |
| Historical spelling | Historical evidence/API |
| Kuromoji boundary | Token repair/merging source |
| General reading choice | Reading resolver/evidence |
| Title-only reading | Scoped title-reading evidence |

Keep whole-sentence Kuromoji tokenisation intact. Avoid pre-tokenisation slicing and broad character substitutions.

## JSON addition is not used

Ordinary JSON changes do not normally require rebuilding the engine. Check:

- the file is declared in the asset registry;
- the row matches its schema;
- the loader indexes/registers it;
- its evidence family has the right precedence and scope;
- any required full-source pattern actually matches the normalised input.

Then rerun focused QA.

## Many unrelated failures after one change

Revert or narrow the broad change. A large failure cluster usually means the rule was applied at the wrong layer or with too much authority. CJ2R deliberately favours narrow evidence-backed behaviour over universal heuristics.

## Before accepting a release fix

Confirm the relevant gates are green, including:

- generated-source parity;
- canonical/generated/differential QA;
- punctuation/boundary QA where applicable;
- browser smoke;
- failure injection for loading/schema/runtime changes;
- provenance;
- any focused invariance/control checks needed for the change.

For Drive promotion, also verify the returned Drive bytes/hashes and rerun the relevant gate from those returned files before declaring the release accepted.
