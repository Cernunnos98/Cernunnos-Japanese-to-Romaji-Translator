# Translator File Naming Rules

CJ2R uses purpose-specific filenames for maintained project files. Clear names reduce staging, overwrite and maintenance mistakes, especially when files are viewed outside their normal directory context.

## Maintained naming requirements

A maintained filename should identify its subsystem and purpose when the directory alone would not make that clear. Examples include:

- `src/translator/translator-source-development-guide.md`
- `tools/qa/translator-release-qa-guide.md`
- `tools/qa/translator-qa-troubleshooting.md`
- `tools/qa/translator-differential-review-decisions.json`
- `tools/qa/run-translator-structural-integrity.py`
- `tools/qa/run-translator-node-qa.js`
- `tools/qa/run-translator-release-qa.js`
- `tools/qa/run-translator-browser-smoke-cdp.js`
- `tools/qa/run-translator-failure-injection-cdp.js`
- `readme/translator-integration-guide.md`
- `readme/translator-required-files-summary.md`
- `readme/introductory-guide.md`
- `data/kanji/kanjidic-source-metadata.json`
- `data/nouns/wikipedia-proper-nouns-source-metadata.json`

The structural integrity gate rejects ambiguous maintained paths such as generic `README.md` or `index.json` where a project-specific filename is required. It also rejects retired paths that would restore superseded project structures.

## Project root

The maintained root directory is:

```text
CJ2R-Translator
```

This matches the project abbreviation: Cernunnos' Japanese to Romaji Translator.

EDRDG maintenance files follow the same purpose-specific pattern:

- `cj2r-edrdg-updater.js`
- `cj2r-edrdg-updater-sources.json`
- `test-cj2r-edrdg-updater.js`
- `cj2r-edrdg-updater-guide.md`

## Names deliberately retained

Do not rename files whose existing names are part of a runtime, upstream or distribution contract:

- `CJ2R-Translator-Project-License.md` is the named project licence; conventional upstream licence/NOTICE filenames are retained where useful for attribution.
- `kuromoji.js` identifies the bundled third-party runtime.
- `data/dict/` retains Kuromoji/IPADIC dictionary filenames because the loader expects them.
- numbered files under `src/translator/` retain their prefixes because build order is intentional.
- `translator.html`, `translator-engine.js` and `translator-hook-example.html` already describe their roles clearly.

A local naming preference is not a reason to rename an upstream or runtime-contract file.
