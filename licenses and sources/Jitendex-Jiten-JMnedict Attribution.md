# Jitendex, Jiten and JMnedict attribution

## Jitendex / JMdict

Jitendex.org by Stephen Kraus.
Existing CJ2R snapshot: 2026-08-11, revision 2026.08.11.0.
Licence: CC BY-SA 4.0.

CJ2R uses Jitendex as a structured distribution of JMdict evidence, including reading priorities, ateji identification, compact general whole-word fallback evidence, and reviewed loanword source-language spelling evidence. Existing CJ2R-reviewed mappings take precedence over bulk-derived evidence.

For the loanword expansion, non-wasei multiword source strings are excluded when the Jitendex export does not expose enough JMdict source metadata to prove that the source applies to the whole Japanese expression rather than only part of it. Ambiguous source spellings are not guessed.

Jitendex includes JMdict material from the Electronic Dictionary Research and Development Group (EDRDG); the EDRDG licence notice is included separately in this folder.

## Jiten

Jiten: https://jiten.moe/
Previously maintained CJ2R frequency snapshot: 2026-09-03 / revision 2026-09-02.
Loanword-expansion supporting snapshot: 2026-09-12, revision Jiten 26-09-08.
Licence: Jiten publishes its derived decks, frequency lists and statistics under CC BY-SA 4.0.

Frequency is supporting evidence for prioritisation and ambiguity review only. It never establishes a source-language spelling and never selects an otherwise ambiguous mapping by itself.

## JMnedict

JMnedict, Electronic Dictionary Research and Development Group (EDRDG).
Snapshot used: 2026-08-10, revision JMnedict.2026-08-10.
Licence: EDRDG licence, included separately in this folder.

CJ2R uses JMnedict for reviewed proper-name evidence and, in the loanword/name expansion, a conservatively filtered subset of established company, product, work, organisation and group names. Exact-surface conflicts, ordinary-word collisions, multiple incompatible names, descriptive/non-name outputs and other unsafe rows are excluded rather than guessed.
