# Yomitan Evidence Candidate Generation

This tool converts a pinned, extracted Yomitan term-dictionary snapshot into a deterministic **review queue**. It does not edit CJ2R runtime data and deliberately omits glossary definitions.

Supported source labels are `jmnedict`, `jitendex` and `yomitan-term-bank`. The snapshot must contain `index.json` and `term_bank_*.json` files using the supported eight-field Yomitan term-bank shape.

## Safe workflow

1. Obtain and extract the exact upstream snapshot to a separate working directory.
2. Calculate the complete snapshot SHA-256 with the generator's exported `computeSnapshotSha256()` helper (or a trusted wrapper) and record it with the source date/revision.
3. Run the generator with that expected hash. A mismatch stops the run before output is written.
4. Review the generated candidates manually.
5. Promote only individually justified entries into the correct CJ2R evidence family, update provenance where required, then run the full release gate.

Example:

```bash
node tools/evidence-candidate-generation/generate-yomitan-evidence-review-candidates.js \
  --snapshot-dir /path/to/extracted/jmnedict-2026-08-10 \
  --source-type jmnedict \
  --snapshot-label 2026-08-10 \
  --expected-sha256 <recorded-snapshot-sha256> \
  --require-han \
  --output /tmp/jmnedict-2026-08-10-review-candidates.json
```

`--min-score` filters the review queue only; score is supporting evidence, not authority for a reading. Use `--overwrite` only when intentionally regenerating the same review file.

For output inside the CJ2R project, the tool permits only:

```text
tools/evidence-candidate-generation/generated-review-candidates/
```

It refuses runtime `data/`, source directories and vague filenames such as `candidates.json` or `output.json`.

For identical snapshot bytes and arguments, output is deterministic. The generated file records the source type, snapshot label, verified snapshot hash, filters and candidate count. Definitions are never copied.

If Yomitan changes its term-bank schema, update this tool only after reviewing the upstream format and strengthening the corresponding tests.
