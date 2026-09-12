# CJ2R EDRDG Updater

This tool keeps CJ2R's maintained EDRDG-derived inputs current without allowing an upstream dictionary refresh to change the live translator silently.

It checks four source packages:

- **Jitendex** — priority information used by reviewed JMdict-derived CJ2R evidence;
- **JMdict (without proper names)** — direct current EDRDG cross-check;
- **JMnedict** — reviewed proper-name subset;
- **KANJIDIC** — Kanji helper banks.

Source URLs are kept in `cj2r-edrdg-updater-sources.json` so release-location changes can be reviewed separately.

## 1. Why updates are staged

A dictionary can change readings, priorities or metadata while remaining structurally valid. CJ2R therefore uses two phases:

1. **Prepare** — obtain/pin source archives, validate their contents, compare them with maintained CJ2R derivatives, build an isolated candidate project and write a review report plus SHA-256-pinned manifest.
2. **Apply** — require the exact reviewed manifest hash, reject unresolved blockers, run the full release gate on the candidate, promote only manifest-listed files, then run the full gate again on the live project. A failed live gate restores the previous bytes.

This is a controlled maintenance procedure, not an automatic background update service.

## 2. Prepare an update

From the project root:

```bash
node tools/edrdg-update/cj2r-edrdg-updater.js
```

The default staging directory is timestamped under `tools/edrdg-update/staging/`. Preparation does not change runtime `data/`.

Important outputs:

- `edrdg-update-review-report.json` — blockers, Jitendex priority changes and JMdict cross-check differences;
- `edrdg-update-manifest.json` — source hashes/revisions and exact project paths proposed for change;
- `edrdg-update-manifest.sha256` — approval hash;
- `candidate-project/` — isolated candidate tree.

If a maintained CJ2R reading is no longer supported by the relevant current source, preparation records a blocker and exits with status `3`. Review the discrepancy and prepare a new clean staging set before application.

JMdict cross-check differences are reported separately because Jitendex may contain reviewed material that does not appear as the same surface/reading pair in the direct JMdict package. Such a difference is review information, not automatically a blocker.

## 3. Apply a reviewed update

After reviewing the report, use the exact manifest hash printed during preparation:

```bash
node tools/edrdg-update/cj2r-edrdg-updater.js \
  --apply \
  --staging-dir "/path/to/the/staging-directory" \
  --manifest-sha256 <exact-64-character-hash>
```

The hash prevents the staged proposal from changing after review.

Application is refused if:

- the manifest hash does not match;
- blockers remain;
- a staged source is malformed;
- candidate release QA fails;
- the promoted live release QA fails.

Promotion is transactional for the files listed in the manifest. A failed final gate restores their pre-update bytes.

## 4. What the updater refreshes

When the review report is clean, the candidate may update:

- existing priority scores in `data/general-words/general-words-term-bank-1.json`;
- existing priority scores in `data/ateji/ateji-term-bank-1.json`;
- maintained Jitendex priority fields in `data/reading-evidence/reading-evidence.json`;
- validation of the existing compact JMnedict-reviewed name subset;
- KANJIDIC helper banks and source metadata;
- Jitendex/JMnedict/KANJIDIC snapshot references in attribution/provenance files;
- tracked SHA-256 values in `data/external-evidence-source-provenance.json`.

It does **not** add every new upstream dictionary entry automatically. New lexical readings, proper names and title-specific evidence remain normal CJ2R review work.

## 5. Offline or controlled-source use

Already-downloaded archives can be supplied explicitly:

```bash
node tools/edrdg-update/cj2r-edrdg-updater.js \
  --offline jitendex=/path/jitendex-yomitan.zip \
  --offline jmdict=/path/JMdict_english_without_proper_names.zip \
  --offline jmnedict=/path/JMnedict.zip \
  --offline kanjidic=/path/KANJIDIC_english.zip
```

All four sources are still required. Archive and extracted-snapshot hashes are recorded in the staging manifest.

## 6. Licence relationship

EDRDG's General Dictionary Licence Statement requires software/services using covered data to maintain a procedure for regular updates from current versions. It gives monthly updating as an example for WWW dictionary servers rather than one universal interval for all applications.

CJ2R's update procedure is this staged updater plus manual review and the release gate. Maintainers/downstream operators should run it regularly enough for the way their deployment uses and redistributes the EDRDG-derived material.

The updater does not replace the separate attribution, redistribution, ShareAlike, warranty/liability or KANJIDIC-specific obligations. See:

```text
licenses and sources/Electronic Dictionary Research and Development Group License.md
```

and the official EDRDG licence referenced there.
