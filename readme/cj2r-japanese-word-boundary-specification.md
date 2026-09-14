# CJ2R Japanese Word-Boundary Specification

## Purpose

This specification defines when adjacent Japanese source material becomes one CJ2R Romaji unit and when it becomes separate Romaji words.

It supplements, and does not replace, `Romaji Rules.docx`. Rule 0 remains authoritative for romanisation, long vowels, apostrophes, capitalisation, particles, punctuation, source-language loanword spelling and name policy.

## Linguistic basis

CJ2R must not equate morphological analyser tokens with presentation words. NINJAL's BCCWJ explicitly maintains both Short Unit Words, intended for relatively small lexical elements, and Long Unit Words, which represent a different, larger level of lexical analysis. Sudachi independently exposes short, middle and long split modes. A tokenizer boundary is therefore morphological evidence, not proof of a Romaji space.

For verbs, NINJAL's Compound Verb Lexicon distinguishes lexical `V+V` compounds from syntactic compounds and ordinary `V-te-V` chains. Its coverage criteria explicitly exclude ordinary `V-te-V` sequences while recognising that a small number of such expressions can be lexicalised exceptions. CJ2R therefore requires lexical/grammatical evidence for a join rather than promoting a part-of-speech pattern into an automatic word boundary.

For presentation spacing generally, use the strongest available evidence for the natural lexical or grammatical unit. The specification deliberately does not adopt any single corpus/tokeniser unit as the definition of a CJ2R Romaji word.

## Boundary states

Every consequential boundary should be classifiable as one of:

- `join` — the right-hand material belongs to the same Romaji unit;
- `space` — the right-hand material begins a separate Romaji word;
- `tight` — punctuation or notation attaches without an intervening space;
- `apostrophe` — phonological `n'` disambiguation applies across an otherwise joined boundary;
- `uncertain` — evidence is insufficient to make the lexical/grammatical boundary authoritative.

`uncertain` is not a printable separator. The renderer may emit the mechanically best-supported form, but the uncertainty must survive as review provenance.

## Evidence precedence

Where evidence conflicts, prefer the highest applicable class below. A lower class must not silently override a higher one.

1. Explicit source whitespace and hard punctuation structure.
2. Reviewed direct-Romaji spans whose internal spelling/spacing is authoritative.
3. Reviewed complete lexical spans, including established compounds.
4. Reviewed complete proper-name spans.
5. Reviewed complete loanword/source-language spans.
6. Reviewed grammatical expressions and explicit grammatical boundaries.
7. Reviewed prefix/suffix, counter, numeric and title-typography rules.
8. Strong morphology that identifies inflectional attachment or a grammatical role.
9. Kuromoji segmentation and part-of-speech evidence.
10. Mechanical fallback.

A Kuromoji split alone is never sufficient to claim an authoritative `space`. A morphological relationship alone is never sufficient to claim an authoritative lexical `join`.

## Rules by structure

### Lexical words and compounds

A reviewed complete lexical span is one Romaji lexical unit unless the reviewed evidence itself specifies internal spacing. This includes kana-only lexical words and mixed-script words whose source span is established independently of tokenisation.

Compound nouns are joined or divided according to reviewed lexical/semantic evidence. Do not concatenate every sequence of adjacent nouns and do not preserve every analyser split. If the system has no evidence beyond tokenisation, retain boundary uncertainty rather than manufacturing lexical certainty.

### Kana-only words

Contiguous Hiragana or Katakana must not be globally merged. Particles, auxiliaries and adjacent independent words can occur inside contiguous kana text.

Conversely, a tokenizer boundary inside contiguous kana is not automatically a Romaji space. Reviewed lexical evidence, source-span reconciliation and grammatical evidence must be considered first. If neither lexical unity nor a grammatical/independent boundary is established, the boundary is reviewable.

A maintained whole-word entry written with Han characters may also support a kana-only spelling of that same lexical item. CJ2R may use such evidence only when the registered whole-word reading and an independently obtained tokenizer reading for the maintained surface agree in pronunciation, allowing for Japanese long-vowel notation such as `ー` versus an explicit vowel sequence. This is boundary evidence only: the user's written kana remains authoritative for Rule 0 romanisation, and phonologically different kana must not be promoted as an alias. For example, an established lexical entry can justify treating `ぎょうざ` as one presentation word even when Kuromoji proposes internal fragments; this does not license globally merging contiguous kana phrases such as `きょうは`.

### Verbs and inflection

Inflectional material remains attached to its lexical word. Conjunctive `て`/`で` used as part of the preceding verb form therefore joins left under the existing Rule 0 grammatical conventions.

A following independent verb is a separate Romaji word unless there is evidence that the complete source span is an established lexical compound verb. In particular:

- `食べて帰る` -> `Tabete Kaeru`
- `本を買って帰る` -> `Hon o Katte Kaeru`

Genuine lexical compound verbs remain joined when established by complete lexical evidence, for example the existing reviewed behaviour for `読み終わる` -> `Yomiowaru`. A false Kuromoji split may also be repaired when the left token can be proven to be a misparsed continuative verb stem from maintained lemma evidence, standalone Kuromoji independently analyses the exact contiguous combined surface as one ordinary verb, and that whole-token reading exactly equals the separately established stem and follower readings. This establishes only that demonstrated compound boundary; it does not license a generic continuative-form-plus-verb join or erase competing maintained readings.

The rule `continuative-form verb + following verb = compound verb` is prohibited as a stand-alone join criterion.

### Auxiliaries

Auxiliary attachment follows the existing CJ2R grammatical policy. Contracted or inflectional auxiliaries may join where Rule 0 and established grammar require it. Auxiliaries that CJ2R classifies as separate units remain separate.

Part-of-speech label `非自立` by itself is evidence, not final boundary authority.

### Particles and nominalisers

Particles and nominalisers are grammatical boundaries unless stronger reviewed lexical evidence proves that the same kana belongs inside a lexical span. Their Rule 0 lowercase rendering is independent of the segmentation decision. Katakana `ノ` requires the same role test: when Kuromoji mislabels a standalone `ノ` between lexical anchors as a symbol, CJ2R may recover a provisional reviewable grammatical `の` role only if no stronger reviewed lexical/name/title span contains it. When final grammatical/boundary reconstruction independently confirms that role and no incompatible interpretation remains active, the provisional review signal is superseded while its provenance is retained; unresolved or conflicting cases remain review-required. Forms such as `モノノ怪`, `山ノ手`, `くノ一` and `ノート` are protected by lexical evidence or by the absence of the standalone-particle frame.

Conjunctive particles can attach to the inflected word on their left without licensing a join to the independent lexical word on their right.

### Prefixes and suffixes

Reviewed derivational prefixes and suffixes follow the lexical unit they establish. Do not infer attachment from orthographic adjacency alone. Name honorifics and other special suffix classes continue to follow their explicit CJ2R policy. A Kuromoji `接尾` label is likewise not sufficient to join across an immediately preceding grammatical particle: unless stronger morphology has already established an attachment, that impossible host boundary is preserved and the following token is rendered as an independent lexical unit.

### Numbers, counters and temporal expressions

Typed/reviewed numeric, counter and temporal evidence owns its internal boundaries. A structurally established one-day frequency frame (`一日` + `に` + numeral + `回`/`度`) may select a `frequency-counter` role before pronunciation; reviewed whole-counter readings are preferred, and an analyser reading is accepted only from an actual counter-suffix analysis. Generic numeric adjacency must not override reviewed lexical collisions. Existing ambiguity behaviour for competing temporal and lexical analyses remains reviewable. Context-scoped reviewed lexical evidence may also prevent a smaller minute-counter interpretation when the source actually forms a `する` lexical construction; for example, reviewed `三分する`/`四分する` evidence selects `さんぶん`/`しぶん`, while ordinary `三分待つ`/`四分待つ` remains the productive minute-counter reading. This is not a generic number+`分` pronunciation rule.

A Japanese fraction written as `[numeral]分の[numeral]` is a structural numeric construction, not a minute-counter reading. When Kuromoji combines `分の`, the exact fraction source-span candidate may expose `分` and grammatical `の` as source-aligned units. The fraction role supplies the denominator-unit reading `ぶん`; Rule 0 then handles `の` through the ordinary particle boundary/casing policy. This does not authorise treating arbitrary `分の` sequences as fractions, and no post-render Romaji split is permitted.

### Proper names

Reviewed proper-name spans outrank tokenisation. Unique maintained whole-name evidence can also repair a destructive symbol-token split when Kuromoji's normal reading of the same complete source surface independently agrees with that name reading. If normal analysis contains multiple lexical sub-tokens, CJ2R restores those canonical sub-token boundaries instead of flattening unrelated name components into one output word. Internal division therefore follows reviewed/name evidence plus verified canonical structure rather than the damaged token partition. A name-like context without sufficient whole-name evidence remains reviewable.

### Loanwords and foreign-derived expressions

Reviewed source-language evidence owns the complete Japanese span and the rendered source-language form. Internal Latin spaces, punctuation, casing and stylisation are preserved when supported.

A source-language output such as `Death Note` or `One Piece` may contain an internal Latin space even when the Japanese source is a contiguous Katakana span. This is not a Japanese token boundary decision; it is part of authoritative direct-Romaji evidence.

Partial source-language evidence must not be presented as though it authorises the whole contiguous Katakana span. Mechanical output may be emitted for unresolved material, with review retained where appropriate.

### Mixed script

Script transitions do not create word boundaries automatically. Mixed-script lexical units may join when complete lexical evidence establishes the span. Conversely, script continuity does not prove lexical unity.

### Punctuation and explicit source spacing

Hard punctuation and explicit source whitespace are structural boundaries and must not be erased by lower-priority lexical or morphological heuristics. Punctuation attachment itself follows Rule 0 and the existing punctuation normalisation policy.

## Source-span and semantic ownership

Every selected token/span retains provenance to the original normalised source through `sourceStart`, `sourceEnd` and `sourceSurface`. A transformation that changes that span invalidates span-bound semantic annotations unless the new span explicitly revalidates them. Same-span transformations may retain their existing annotation ownership.

Derived semantic annotations identify the source span that owns them, the evidence source and semantic role, with confidence/review state where applicable. A smaller numeric, temporal, lexical, grammatical, name or other interpretation must therefore not remain active merely because its token was used as the construction base for a larger span.

The final selected token stream must form an ordered, non-overlapping source partition without silently deleting or duplicating non-whitespace source characters. Tokeniser-omitted whitespace may be represented through exact `sourceGapBefore` provenance, but this does not itself provide linguistic evidence to merge across the gap. Canonicalised token text may differ from the written surface only when its source range still maps back to the original written characters.

Before diagnostic projection, source-integrity validation checks range completeness/order, duplication/overlap, `sourceSurface` fidelity and semantic-annotation ownership.

## Non-destructive source-span candidates

Before destructive numeric, grammatical or lexical merging, CJ2R records viable interpretations directly against immutable normalised-source offsets. Candidate categories include lexical spans, names, loanwords, numeric/temporal/counter structures, grammatical morphology, historical/title evidence and contextual evidence where available.

Candidate discovery does **not** select a boundary, role or reading. A dictionary hit does not prove that its span is the intended word in the current sentence, and Kuromoji morphology remains evidence rather than authority. In addition to maintained project indexes, CJ2R scans Kuromoji's dictionary directly from immutable source offsets and records only exact non-grammatical surfaces that have one unique supported reading; this makes the proposal independent of whatever token partition Kuromoji happened to return for the sentence. Competing interpretations may therefore overlap during discovery; for example, a complete lexical span may coexist with a shorter counter candidate over the same initial characters.

Each discovered candidate records its exact `sourceStart`, `sourceEnd`, `sourceSurface`, evidence source, semantic role and an explicit `selectionState: unselected`. Candidate validation enforces range/surface/provenance integrity while allowing temporary overlap. Only later boundary/role/reading arbitration may turn evidence into the selected non-overlapping final source partition.

Runtime diagnostics expose the candidate inventory and validation separately from the final reading/boundary decisions. Candidate existence alone must not add a space, join, pronunciation, capitalisation change or review requirement.

Reviewed title candidates remain context-scoped. If a title rule itself matches the complete reviewed title surface, that exact surface may also retain the title reading when used as a syntactically bounded noun. Source punctuation/whitespace, a recognised following particle, or source-aligned neighbouring grammatical-token evidence may establish that boundary; this allows ordinary Japanese constructions such as a title preceded by a particle or followed by a copular auxiliary without treating arbitrary adjacent text as title context. A rule that only matches a fragment inside a larger reviewed title does not gain this privilege, and a title surface embedded as the prefix or suffix of a larger lexical string is not treated as a title mention. Candidate ownership is per source occurrence; a context match elsewhere in the sentence cannot authorise a different occurrence.

## Numeric/counter role before pronunciation

Numeric recognition, semantic-role selection and pronunciation are separate decisions. A reviewed counter/date reading proves how a span is pronounced **if that role is established**; it does not prove that the written span is functioning as that counter/date expression in the current input.

The counter/date evidence bank therefore declares a semantic `role` and, where applicable, a `unit`. Clock-hour and minute processing first records `selected` or `ambiguous` role state on the exact owning source span. Only a selected role may invoke role-specific pronunciation. Productive minute sound change is scoped to the selected minute-counter class and must not be generalised to unrelated counters.

If an incompatible complete lexical interpretation remains viable for the same source span and no recognised role resolver selects between them, the role may remain unresolved and review is required. In particular, a row such as `十分 → じゅっぷん` must never be allowed to establish the minute role merely because that pronunciation exists in the reviewed counter bank.
Conversely, a narrowly reviewed structural or contextual resolver may select the lexical reading when the surrounding Japanese provides positive evidence for that role. For example, reviewed `十分に` / `十二分に` adverbial contexts can select the lexical `ぶん` reading, while a sentence such as `十分待つ` remains reviewable because both “sufficiently/enough” and “ten minutes” are viable from the orthography alone.

## Reading arbitration after boundary and role

Once the source span and semantic role are established, reading arbitration combines the selected analyser reading with independently maintained whole-word, reviewed-reading, proper-name and contextual candidates for that exact span. Candidate ranking and frequency may order alternatives, but do not by themselves prove that one incompatible reading is correct.

A positive maintained reading that conflicts with the selected reading is an unresolved evidence conflict unless a recognised resolver actually selects between them. The audit must retain both the emitted provisional reading and the incompatible supported alternative, and review remains mandatory. Merely adding neighbouring words, particles or punctuation does not clear that conflict.

Weak alternative-list uncertainty is different from an independent conflict. A full-sentence resolver may supersede weak ambiguity only when it selects an already-supported reading with sufficient contextual evidence and no independent strong conflict remains. Superseded uncertainty stays visible in audit provenance rather than being deleted.

## Boundary provenance

For every consequential final boundary, retain enough provenance to state:

- the rendered boundary (`join`, `space`, `tight`, `apostrophe`);
- the reason/evidence class;
- whether the decision is authoritative or fallback;
- whether unresolved ambiguity requires review.

The final validation phase must validate this recorded decision. It must not re-segment Japanese from the finished Latin string.

## Final consistency invariants

The final output/evidence consistency validator must be able to detect at least:

- a reviewed lexical, name or loanword span split contrary to its evidence;
- a reviewed separate boundary rendered joined;
- a reviewed joined boundary rendered with a space;
- a morphology-only join presented as authoritative lexical evidence;
- an unresolved contiguous-kana boundary emitted without an applicable review signal;
- authoritative direct-Romaji internal spacing altered by generic formatting;
- boundary metadata contradicting the rendered separator.

A structural validation warning does not replace the earlier boundary engine. It reports contradictions or surviving uncertainty and feeds the existing review/audit model.

## Implementation constraint

Boundary decisions remain owned by the existing token repair/merging and output pipeline. Do not add a second post-render spacing engine and do not attempt to infer Japanese segmentation from Romaji output.

## References

The research basis and source roles are documented in `licenses and sources/Japanese Word Boundary and Loanword Research Sources.md`. Principal references are:

- NINJAL BCCWJ morphological information and SUW/LUW frequency lists;
- NINJAL Compound Verb Lexicon;
- Sudachi multi-granular tokenisation documentation;
- NINJAL Report 126 for independent loanword-coverage measurement;
- Agency for Cultural Affairs `外来語の表記` for Japanese loanword orthography.

These sources inform boundary/evidence policy. `Romaji Rules.docx` remains authoritative for CJ2R output orthography.
