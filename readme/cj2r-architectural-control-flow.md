# CJ2R — Japanese → Romaji Control Flow

This document is the contributor/developer map for CJ2R. The Mermaid block below is the authoritative flow definition; `tools/build-cj2r-flowchart.js` generates `readme/cj2r-architectural-control-flow.svg`, which must not be edited independently.

Use this document when you need the exact order of token repair, evidence merging, reading resolution or final output handling. It describes implementation, not linguistic policy: `readme/Romaji Rules.docx` (Rule 0) remains authoritative for expected output.

## Legend

- **[Mxx]** = primary source module under `src/translator/`.
- **[DATA]** = evidence/data bank that can influence the stage.
- **[API]** = public translator interface.
- **[GUARD]** = safety/fallback behaviour designed to avoid silent bad output.
- Token-stream repair order and reading-resolution priority are **different control flows**. Both are shown below.

## Exhaustive control-flow

```mermaid
flowchart TD
    %% ============================================================
    %% ENTRY / INITIALISATION
    %% ============================================================
    START([Japanese input]) --> ENTRY{How did input enter CJ2R?}

    ENTRY -->|Built-in UI| UI[Live input field\n[M02 UI controls + M11 bootstrap]]
    ENTRY -->|Public API| API[RomajiTranslator API\n[M11 public API]]
    ENTRY -->|Bound host control| BIND[RomajiTranslator.bind(...)\n[M11 public API]]

    API --> API1{Requested mode}
    API1 -->|translate / translateSync| MODE_STD[Normal translation]
    API1 -->|translateHistorical / Sync| MODE_HIST[Historical-kana path enabled]
    API1 -->|translateWithAudit / Sync| MODE_AUD[Same translation path + diagnostics capture]

    UI --> READY
    BIND --> READY
    MODE_STD --> READY
    MODE_HIST --> READY
    MODE_AUD --> READY

    READY{Translator ready?\n[M11 initialiseTranslator]}
    READY -->|Normal public async path| INIT[Load/validate assets + build Kuromoji\n[M01 M04 M06 M11]]
    INIT --> INITPOL{Asset failure policy\n[M01 M04]}
    INITPOL -->|Critical missing/bad schema| INITFAIL[Initialisation fails clearly]
    INITPOL -->|Optional missing/bad schema| INITWARN[Continue with warning; affected evidence unavailable]
    INITPOL -->|Developer-only missing| DEVWARN[Continue; runtime-diagnostics warning]
    INITWARN --> TOKENREADY[Tokenizer/evidence state ready]
    DEVWARN --> TOKENREADY
    INIT --> TOKENREADY
    READY -->|Already ready| TOKENREADY

    TOKENREADY --> SOURCE[Preserve original source text\n[M10 translateText]]

    %% ============================================================
    %% EXACT WHOLE-TEXT OVERRIDE
    %% ============================================================
    SOURCE --> OVRON{Overrides enabled?\n[M03 state + M11 API/UI control]}
    OVRON -->|yes| EXACT{Exact whole-input override?\n[M10]\nBank may contain metadata only when zero live overrides remain\n[DATA data/Overrides/overrides.json]}
    OVRON -->|no| NORM
    EXACT -->|yes| EXACTOUT[Use reviewed whole-text Romaji\nPreserve applicable trailing punctuation]
    EXACT -->|no| NORM
    EXACTOUT --> FINPUNC

    %% ============================================================
    %% NORMALISATION
    %% ============================================================
    NORM[Input normalisation\n[M05 normalizeTranslatorInputText]] --> NFC[NFC composition]
    NFC --> WIDTH[Targeted NFKC for half-width kana / full-width ASCII]
    WIDTH --> IVS[Strip ideographic variation selectors\n[M04 variant helpers]]
    IVS --> GVAR[Apply general lookup-safe Kanji variants\n[DATA data/kanji/kanji-variants.json]]
    GVAR --> WROWQ{Historical mode requested?}
    WROWQ -->|no| WROW[Normalise obsolete W-row kana before tokenisation\nゐ→い / ヰ→イ / ゑ→え / ヱ→エ\n[M05 normalizeObsoleteWRowKanaForModernReading]\nNarrow orthographic/phonological rule only]
    WROWQ -->|yes — preserve historical surface for T16 evidence| TOKCHK
    WROW --> TOKCHK{Tokenizer available?}

    TOKCHK -->|no — defensive internal fallback| DEFKANA[Convert whatever is safely convertible directly\n[M05 convertToRomaji]]
    DEFKANA --> DEFCAP[Capitalise + punctuation normalisation\n[M10]]
    DEFCAP --> FINALHAN

    TOKCHK -->|yes| KURO[Kuromoji tokenises the COMPLETE normalised sentence\n[M01 asset path + M11 build + Kuromoji dictionary]]
    KURO --> CONTEXT[Whole-sentence morphological context is preserved\nNo destructive pre-tokenisation slicing]

    %% ============================================================
    %% TOKEN STREAM PASSES — EXACT LIVE ORDER
    %% ============================================================
    CONTEXT --> TS0[[POST-KUROMOJI SOURCE-SPAN + TOKEN-STREAM PASSES\nOriginal source offsets are retained across every pass; changed spans invalidate span-bound semantic state unless explicitly revalidated [M07 makeDerivedSpanToken / makeDerivedSubspanToken]; Kuromoji boundaries are proposals, not final spans]]

    TS0 --> TS1[1 Restore dropped sokuon っ/ッ tokens\n[M09 restoreDroppedSokuonTokens]\nRuns immediately on the complete Kuromoji token stream while source positions still match the original normalised sentence]
    TS1 --> CANDDISC[[1A NON-DESTRUCTIVE SOURCE-SPAN CANDIDATE DISCOVERY\n[M10 discoverSourceSpanCandidates + validateSourceSpanCandidates]\nScan immutable normalised-source offsets before destructive numeric/grammar/lexical merging\nLexical/kana-lexical/name/loanword/numeric/temporal/counter/grammar/historical/title/context evidence may overlap\nAll candidates remain selectionState=unselected; candidate creation does not change tokens, output or review state]]
    CANDDISC --> TS2[2 Stabilise canonical hard-boundary tokenisation\n[M09 stabilizeHardBoundaryTokenization]\nRetokenise only canonical hard-boundary segments; preserve whole-sentence context everywhere else]
    TS2 --> TS3[3 Split structured numeric-unit tokens\n[M09 splitStructuredNumericUnitTokens]]
    TS3 --> TS3A[3A Reconcile continuous kana source spans\n[M09 reconcileKanaSourceTokenBoundaries]\nProtect syntax-backed grammar/morphology; recover evidence-backed standalone Katakana ノ particle roles; neutralise unsupported Kuromoji boundaries before lexical reading decisions]\n    TS3A --> TS3B[3B Apply structured Japanese fraction output roles\n[M09 applyStructuredFractionOutputTokens]\nExact numeral+分の+numeral source candidate only; expose 分 + grammatical の with immutable source ownership; no post-render string split]\n    TS3B --> TS4[4 Repair typed temporal-expression boundaries\n[M09 repairTypedTemporalExpressionBoundaries]\nRecover swallowed temporal suffixes without splitting complete standalone lexical 中-words; mark independently attested span/lexical collisions for review]
    TS4 --> TS5[5 Merge typed temporal spans\n[M09 mergeTypedTemporalSpanTokens]\nRecognise normal [temporal head][中] as well as repaired spans; seal the right edge and independently re-evaluate suffix-like lexical followers]
    TS5 --> TS6[6 Classify one-day date vs duration role\n[M09 markTypedOneDayDurationTokens]\nPreserve legitimate calendar `ついたち`; recognise ordinary and サ変+する predicates, including through intervening nominal argument phrases]
    TS6 --> TS6A[6A Select explicit one-day frequency-counter role\n[M09 markTypedFrequencyCounterRoleTokens]\nRequire `一日` duration + に + numeral+回/度 structure; prefer reviewed counter reading, otherwise require analyser counter-suffix evidence]
    TS6A --> TS7A[7A Select numeric/counter semantic roles before pronunciation\n[M09 markAmbiguousNumericRoleTokens + markTypedClockHourRoleTokens + markTypedMinuteCounterRoleTokens]\nUse immutable source-span candidates + role-aware evidence; counter pronunciation cannot prove the role; contextual reviewed する lexemes may retain lexical ownership; unresolved same-span lexical/counter conflicts remain reviewable]
    TS7A --> TS7B[7B Generate role-scoped clock/minute pronunciation\n[M09 applyTypedNumericRoleReadings + resolveMinuteCounterReading]\nReviewed exceptions apply only to their selected role; productive minute onbin is scoped to minute-counter and is not a universal counter heuristic]
    TS7B --> TS8[8 Repair case-marked counter-follower lexical roles\n[M09 repairCaseMarkedCounterFollowerTokens]\nRequire independent reading evidence + following case-particle syntax]
    TS8 --> TS9[9 Merge productive desiderative `たがる` chains\n[M09 mergeDesiderativeGaruTokens]\nStrong morphology/contiguity only; punctuation blocks bounded misparse recovery]
    TS9 --> TS10[10 Merge reviewed common-word inflections\n[M07 mergeReviewedCommonWordInflectionTokens]\n[DATA data/common-words/common-words-term-bank-1.json]]
    TS10 --> TS11[11 Reviewed kana common-word boundary split\n[M09 splitReviewedKanaCommonWordBoundaryTokens]\nRetokenise overshooting remainder + protect repaired boundary]
    TS11 --> TS12[12 Recover kana-only lexical spans\n[M09 mergeKanaLexicalReadingTokens]\nMaintained whole-word readings may contribute tokenizer-confirmed long-vowel orthographic aliases; written kana still controls final Rule 0 romanisation]
    TS12 --> TS13[13 Reassemble honorific fragments caused by reviewed boundary repair\n[M09 mergeKanaCommonWordBoundaryHonorificTokens]]
    TS13 --> TS14[14 Merge deterministic orthographic kana boundaries\n[M09 mergeOrthographicKanaBoundaryTokens]]
    TS14 --> TS15[15 Protect Latin / number / official-spelling spans\n[M09 mergeLatinPassthroughTokens]]
    TS15 --> HISTQ{Historical mode requested?}
    HISTQ -->|yes| TS16[16 Merge explicit historical-kana evidence\n[M07 mergeHistoricalKanaEvidenceTokens]\n[DATA data/historical-kana/historical-kana-evidence.json]]
    HISTQ -->|no| TS17
    TS16 --> TS17[17 Narrow exact-Kuromoji dictionary rescue\n[M08 mergeExactDictionaryRescueTokens]\nContext-gated; especially proper-name rescue]
    TS17 --> TS18[18 Merge reviewed proper-name spans\n[M07 mergeReviewedProperNameSpanTokens]\n[DATA data/nouns/reviewed-proper-name-span-evidence.json]]
    TS18 --> TS19[19 Repair reviewed-name + honorific/suffix boundaries\n[M09 mergeReviewedNameHonorificTokens]]
    TS19 --> TS20[20 Mark unreviewed name-context tokens for audit\n[M09 markUnreviewedNameContextTokens]]
    TS20 --> TS21[21 Authoritative span rescue\n[M06 index + M10 mergeAuthoritativeSpanTokens]]

    TS21 --> AUTHNOTE[Authoritative span sources\nPriority 100 reviewed names + role-aware counters/dates\n95 ateji\n90 loanwords\n80 compounds\n70 single-reading general words\n[M06]]
    AUTHNOTE -. evidence .-> AUTHDATA[DATA:\nreviewed proper-name spans\ncounter-date-reading-evidence.json\nateji-term-bank-1.json\nloanwords-term-bank-1.json\ncompound-words-term-bank-1.json\ngeneral-words-term-bank-1.json]
    TS21 --> TS22[22 Conservative 々 structural fallback\n[M07 mergeIterationMarkFallbackTokens]\nNo Rendaku guessing]
    TS22 --> TS23[23 Reviewed numeric orthographic aliases\n[M07 mergeReviewedNumericAliasTokens]]
    TS23 --> TS24[24 Name-only Kanji variant proper-noun repair\n[M07 mergeVariantProperNounTokens]\n[DATA data/kanji/kanji-variants.json names]]
    TS24 --> TS25[25 Casual speech / conjugation repair\n[M09 mergeCasualSpeechTokens]\n[DATA data/grammar/conjugation-patterns.json]]
    TS25 --> TS26[26 Merge reviewed common-word spans\n[M07 mergeCommonWordTokens]\n[DATA data/common-words/common-words-term-bank-1.json]]
    TS26 --> TS27[27 Merge whole-word ateji spans\n[M07 mergeAtejiTokens]\n[DATA data/ateji/ateji-term-bank-1.json]]
    TS27 --> TS28[28 Merge approved grammatical expressions\n[M09 mergeRecognizedGrammaticalExpressions]\n[DATA particle-expressions.json + conjugation-patterns.json]]
    TS28 --> TS29[29 Merge contextual overrides\n[M09 mergeContextualOverrideTokens]\n[DATA data/Overrides/context-overrides.json]]
    TS29 --> TS30[30 Merge scoped title-reading evidence\n[M06 loader + M07 mergeTitleReadingEvidenceTokens]\n[DATA data/title-readings/title-reading-evidence.json]]
    TS30 --> TS31[31 Merge known phrase / compound spans\n[M09 mergeKnownPhraseTokens]]
    TS31 --> TS32[32 Merge attested Rendaku / non-Rendaku evidence\n[M07 mergeRendakuEvidenceTokens]\n[DATA data/rendaku/rendaku-evidence.json]]
    TS32 --> TS33[33 Merge source-language loanwords\n[M07 mergeLoanwordTokens]\nLongest reviewed whole span wins; preserve reviewed spacing/casing\nAmbiguous partial-token segmentations stay unsplit]
    TS33 --> TS34[34 General-word span rescue/fallback\n[M07 mergeGeneralWordTokens]\nPreserve existing numeral + 助数詞 structure; general-word evidence cannot replace it; false splits inside verbs require standalone-tokenizer + maintained-reading consensus\n[DATA data/general-words/general-words-term-bank-1.json]]
    TS34 --> TS35[35 Annotate contextual legitimate-reading evidence\n[M08 annotateContextualReadingEvidence]\nToken-neighbour feature scores; shared support/ties and insufficient margin stay ambiguous\n[DATA data/reading-evidence/contextual-reading-evidence.json]]
    TS35 --> TS36[36 Annotate morphological output boundaries\n[M09 annotateMorphologicalOutputBoundaries]\nCarry explicit same-word/conjunctive joins while preserving separate auxiliaries]

    %% ============================================================
    %% READING RESOLUTION
    %% ============================================================
    TS36 --> RR0[[TOKEN READING / DIRECT-ROMAJI RESOLUTION\n[M10 resolveTokenReading]\nFirst safe match wins]]
    JHSCOPE[Japanese-use Han scope evidence\n[M04 classifyHanCharacterScope]\nKANJIDIC + reviewed variant maps + compact reviewed Japanese-use supplement\nunique reviewed single-Han reading may resolve; unknown-scope never receives guessed readings] -. consulted only when ordinary reading paths fail .-> RR0

    RR0 --> RR1{1 Contextual override already matched?}
    RR1 -->|yes| RDIRECT1[Direct reviewed Romaji\nsource=contextual-override]
    RR1 -->|no| RR1A{2 Scoped title-reading evidence matched?}
    RR1A -->|yes| RDTITLE[Use reviewed title reading/direct Romaji\nsource=title-reading-evidence:kind\nDATA title-reading-evidence.json]
    RR1A -->|no| RR2{3 Reviewed proper-name span?}
    RR2 -->|yes| RDIRECT2[Reviewed reading + direct Romaji\nsource=reviewed-proper-name-span]
    RR2 -->|no| RR2A{4 Reviewed name honorific/suffix repair?}
    RR2A -->|yes| RNAMEHON[Use independently reviewed honorific reading\nsource=reviewed-name-honorific]
    RR2A -->|no| RR2T{5 Typed temporal expression?}
    RR2T -->|yes| RTEMP[Use canonical typed temporal reading\nsource=typed-temporal-expression or recorded typed source]
    RR2T -->|no| RR2N{6 Typed numeric expression?}
    RR2N -->|yes| RTYPENUM[Use canonical typed numeric reading\nsource=typed-numeric-expression or recorded typed source]
    RR2N -->|no| RR2F{6A Structured fraction role?}
    RR2F -->|denominator unit| RFRAC[Use role-scoped ぶん\nsource=fraction-structure]
    RR2F -->|fraction numeral with tokenizer reading| RFRACNUM[Use numeric reading inside selected fraction role\nsource=fraction-numeral-structure]
    RR2F -->|no| RR3{7 Authoritative span evidence?}
    RR3 -->|yes| RAUTH[Use authoritative reading and/or direct Romaji\nPreserve variant mappings/source/confidence]
    RR3 -->|no| RR3A{8 Reviewed numeric alias?}
    RR3A -->|yes| RNUM[Use canonical reviewed numeric reading/direct Romaji\nflag reviewed-numeric-alias]
    RR3A -->|no| RR4{9 Latin passthrough span?}
    RR4 -->|yes| RLATIN[Preserve source spelling/punctuation\nsource=latin-source-passthrough]
    RR4 -->|no| RR5{10 Full approved grammatical expression?}
    RR5 -->|yes| RGRAM[Use lower-case configured Romaji\nDATA particle-expressions\nFallback map only if needed]
    RR5 -->|no| RR6{11 Known whole phrase matched?}
    RR6 -->|yes| RPHRASE[Use known-phrase/whole-word value]
    RR6 -->|no| RR7{12 Particle-expression entry?}
    RR7 -->|yes| RPARTEXP[Use configured lower-case expression]
    RR7 -->|no| RR8{13 True grammatical particle?}
    RR8 -->|yes| RPART[Particle pronunciation\nは→wa / へ→e / を→o only grammatically\n[M10 getParticleReading]]
    RR8 -->|no| RR9{14 Loanword evidence?}
    RR9 -->|yes| RLOAN[Use reviewed source-language output\nPreserve stored spacing/casing; typed country-language scope stays whole-span only\n[M08 lookup + token evidence]\nDATA loanwords]
    RR9 -->|no| RR10{15 Reviewed/common whole-word reading already matched?}
    RR10 -->|yes| RCOMMON[Use reviewed contextual whole-word reading]
    RR10 -->|no| RR11{16 Historical-kana evidence?}
    RR11 -->|yes| RHIST[Use attested historical reading\nflag historical-kana-attested]
    RR11 -->|no| RR12{17 Rendaku evidence?}
    RR12 -->|yes| RREN[Use attested voiced or blocked reading\nflag rendaku-attested / blocked]
    RR12 -->|no| RR13{18 Exact dictionary proper-name rescue?}
    RR13 -->|yes| REXACT[Use Kuromoji exact dictionary pronunciation\nflag exact-dictionary-rescue]
    RR13 -->|no| RR13A{19 Kana lexical-span evidence?}
    RR13A -->|yes| RKLEX[Use reviewed kana whole-word reading\nflag source-span-kana-evidence]
    RR13A -->|no| RR14{20 Surface is kana-only?}
    RR14 -->|yes| RKANA{Safe orthographic pronunciation available?\n[M08]}
    RKANA -->|yes| RKANAP[Use orthographic pronunciation]
    RKANA -->|no| RWRITTEN[Use WRITTEN kana surface\nPreserves Wāpuro long-vowel spelling]
    RR14 -->|no| RR15{21 Mixed-script safe orthographic pronunciation?}
    RR15 -->|yes| RMIX[Use safe mixed-script orthographic pronunciation]
    RR15 -->|no| RR16{22 Contextual common-word evidence available?}
    RR16 -->|yes| RCOMMON2[Use whole-word contextual reading\nor reviewed direct Rule-0 Romaji\n[M08 common-word lookup]]
    RR16 -->|no| RR17{23 Whole-word ateji reading?}
    RR17 -->|yes| RATEJI[Use ateji reading]
    RR17 -->|no| RR18{24 General-word span evidence?}
    RR18 -->|yes| RGENSPAN[Use selected reading\nKeep ambiguity/candidates/variant flags]
    RR18 -->|no| RR19{25 Proper-noun candidate evidence?\n[M08 resolveProperNounReading]}

    RR19 -->|safe winner| RNAME[Use proper-noun reading]
    RR19 -->|ambiguous/no winner| RR19A{26 Conservative 々 fallback matched?}
    RNAME -. ranking logic .-> NAMERANK[Kuromoji agreement → unique reading → category hints → source/rank evidence\nAmbiguity remains reviewable rather than forced\nDATA nouns-term-bank + jmnedict + reviewed spans]
    RR19A -->|yes| RITER[Repeat safe preceding single-Kanji reading\nflag iteration-mark-unattested\nreview required; no Rendaku guess]
    RR19A -->|no| RR19B{27 Reviewed multiple-reading preference?}
    RR19B -->|yes| RREVIEWED[Use reviewed preferred reading\nretain alternatives + review signal]
    RR19B -->|no| RR20

    RR20{28 Kuromoji whole-token reading available?}
    RR20 -->|yes| RKCTX[Use Kuromoji contextual reading\n[M08 + M10]]
    RKCTX --> KASSESS[Same-span reading arbitration\nMerge selected Kuromoji reading with independent maintained candidates\nIncompatible positive evidence => active conflict + review\nWeak alternatives may remain contextual candidates\nDATA reading-evidence + general-words]
    RR20 -->|no| RR21{29 Compound fallback available?}
    RR21 -->|yes| RCOMPF[Use whole-word compound fallback]
    RR21 -->|no| RR22{30 General-word fallback available?}
    RR22 -->|safe reading| RGENF[Use general-word fallback\nwith candidates/ambiguity metadata]
    RR22 -->|none| RR23{31 Reading-evidence fallback?}
    RR23 -->|yes| REVID[Use evidence fallback\nsource=frequency-evidence-fallback\nkeep candidates + ambiguity\nprintable Romaji does not clear review]
    RR23 -->|no| RR24{32 Earlier proper-noun/general evidence was ambiguous?}
    RR24 -->|yes| RAMBIG[Preserve ambiguity metadata\nSupported single Han may emit top evidence-backed candidate + review]
    RR24 -->|no| RR25{33 Does unresolved surface contain Han?}
    RR25 -->|yes| RUNRES{Japanese-use Han scope?\n[M04 classifyHanSurfaceScope]}
    RUNRES -->|Japanese scope; unique reviewed single| RJSINGLE[Use reviewed single-Han candidate\nsource=japanese-scope-reviewed-single]
    RUNRES -->|Japanese scope; fallback needed| RJSCOPE[Emit best evidence-backed candidate\nsource=japanese-scope-character/compositional-fallback\nambiguity => requiresReview]
    RUNRES -->|Unknown scope| RUNKNOWN[Retain unresolved surface\nsource=unknown-han-scope\nflag unknown-han-scope\nNo guessed Japanese reading]
    RR25 -->|no| RSURF[Surface fallback for non-Han token]

    %% All reading routes converge
    RDIRECT1 --> SENTVERIFY
    RDTITLE --> SENTVERIFY
    RDIRECT2 --> SENTVERIFY
    RNAMEHON --> SENTVERIFY
    RTEMP --> SENTVERIFY
    RTYPENUM --> SENTVERIFY
    RAUTH --> SENTVERIFY
    RNUM --> SENTVERIFY
    RLATIN --> SENTVERIFY
    RGRAM --> SENTVERIFY
    RPHRASE --> SENTVERIFY
    RPARTEXP --> SENTVERIFY
    RPART --> SENTVERIFY
    RLOAN --> SENTVERIFY
    RCOMMON --> SENTVERIFY
    RHIST --> SENTVERIFY
    RREN --> SENTVERIFY
    REXACT --> SENTVERIFY
    RKLEX --> SENTVERIFY
    RKANAP --> SENTVERIFY
    RWRITTEN --> SENTVERIFY
    RMIX --> SENTVERIFY
    RCOMMON2 --> SENTVERIFY
    RATEJI --> SENTVERIFY
    RGENSPAN --> SENTVERIFY
    RNAME --> SENTVERIFY
    RITER --> SENTVERIFY
    RREVIEWED --> SENTVERIFY
    KASSESS --> SENTVERIFY
    RCOMPF --> SENTVERIFY
    RGENF --> SENTVERIFY
    REVID --> SENTVERIFY
    RAMBIG --> SENTVERIFY
    RJSINGLE --> SENTVERIFY
    RJSCOPE --> SENTVERIFY
    RUNKNOWN --> SENTVERIFY
    RSURF --> SENTVERIFY

    %% ============================================================

    SENTVERIFY[[FINAL SENTENCE-LEVEL READING VERIFICATION\n[M10 verifySentenceLevelResolutions + review-signal lifecycle]\nAll provisional resolutions are considered with the repaired token stream and full source\nOnly lower-confidence/fallback sources may change, and only to an already-attested contextual candidate\nOrdinary surrounding text cannot clear an independent same-span reading conflict\nRecognised contextual selection may supersede weak ambiguity; superseded provenance is retained\nShared contextual support or insufficient full-sentence margin => retain reading + lower confidence + require review\n[DATA data/reading-evidence/contextual-reading-evidence.json]]] --> CONVERTQ

    %% ROMAJI CONVERSION
    %% ============================================================
    CONVERTQ{Resolver supplied direct Romaji?\n[M10 convertToken]}
    CONVERTQ -->|yes| DIRECT[Use reviewed/direct Romaji unchanged except later formatting]
    CONVERTQ -->|no| K2R[Convert resolved kana with Rule 0\n[M05 convertToRomaji]]

    K2R --> YOON[Yōon / kogaki contractions\ne.g. きょ→kyo, not kiyo]
    YOON --> SOKUON[Small っ/ッ doubles a supported following consonant
Terminal, repeated or non-geminative use -> audit review<br/>Historical full-sized つ/ツ ambiguity -> audit review]
    SOKUON --> NASAL[ん stays n, never automatic m]
    NASAL --> NAPOS[Insert apostrophe before following vowel/y where needed]
    NAPOS --> LONG[Preserve written long-vowel sequence\nおう→ou / おお→oo / aa / ii / ee/ei / uu]
    LONG --> CHOON[ー repeats the preceding vowel\nNever blindly infer ou]
    CHOON --> TOKGUARD
    DIRECT --> TOKGUARD

    TOKGUARD[Block unresolved Han inside token output\n[M10 blockUnresolvedHanFromRomaji]] --> ASSEMBLE

    %% ============================================================
    %% FINAL ASSEMBLY
    %% ============================================================
    ASSEMBLE[[FINAL TOKEN JOINING / CASING\n[M07 grammar classifiers + M10 output pipeline]]] --> JNAME[Track person-name continuation and name spacing]
    JNAME --> JPART[Particles + nominaliser: lowercase and spaced]
    JPART --> JGRAM[Approved grammatical expressions: lowercase\nSpacing based on grammatical context]
    JGRAM --> JPREF[Prefixes/suffixes: dedicated joining + casing rules]
    JPREF --> JAUX[Auxiliary spacing/capitalisation from conjugation configuration]
    JAUX --> JLEX[Ordinary lexical tokens: capitalise]
    JLEX --> JTITLECOMPACT[Reviewed compact title-number boundary
[M10]
Only title-compact-numeric-prefix evidence + contiguous ASCII slash fraction joins\nCanonical trailing ~ may remain on that passthrough token]
    JTITLECOMPACT --> JNUM[Numeric assembly: attach local place-value units, separate completed groups / 円]
    JNUM --> JBOUNDARY[Structural output-boundary classification
Decide join vs space before phonological apostrophe handling]
    JBOUNDARY --> JNAPOS[Cross-token ん + vowel/y apostrophe safeguard
Only refines an existing join boundary; never replaces a structural space]
    JNAPOS --> FINPUNC[Normalise punctuation + sentence spacing\nPaired segment-terminal source `―...―` subtitle bars receive surrounding spaces even before trailing sentence punctuation; ordinary bars stay tight\n[M10]]

    FINPUNC --> P1[Japanese 。、？！：； brackets/quotes etc. normalised to project output conventions]
    P1 --> TILDE[～ and 〜 → ~]
    TILDE --> SPACE[Collapse repeated spaces + normalise sentence spacing]
    SPACE --> FINALHAN[Final unresolved-Han guard\n[M10]\nNo silent Kanji leakage]
    FINALHAN --> FINALCONSISTENCY[Final Structural Validation\n[M07 validateSourceTokenIntegrity + M10 validateFinalOutputEvidenceConsistency]\nValidate source partition + semantic ownership, then compare rendered output with retained boundary provenance; never re-segment Latin output]
    FINALHAN --> ROMAJI([Final Romaji output])

    %% ============================================================
    %% AUDIT SIDE PATH
    %% ============================================================
    ROMAJI --> AUDQ{Audit mode?}
    AUDQ -->|no| RETURN[Return Romaji string]
    AUDQ -->|yes| AUD[Build translation diagnostics\n[M10 + M11]]
    AUD --> AUD1[Per-token surface + output]
    AUD1 --> AUD2[Resolver source + confidence]
    AUD2 --> AUD3[Chosen reading + candidate readings]
    AUD3 --> AUD4[Flags + review-signal candidates: fallback, ambiguity, conflicts, variants, unresolved, etc.]
    AUD4 --> AUDLIFE[Finalise review-signal lifecycle\n[M10]\ncandidate → active → superseded/resolved OR final-active\nResolution refinements carry prior signals forward\nOnly the uncertainty actually settled by stronger evidence may be superseded; independent ambiguity/conflict/unresolved signals remain active]
    AUDLIFE --> AUD5[Variant mappings + per-reading reviewSignals\nPreserve lifecycle/provenance + superseding source/reason]
    AUD5 --> AUDCAT[Per-reading auditCategories\nunresolved Japanese reading/Han vs out-of-scope vs unknown Japanese-scope status]
    AUDCAT --> AUDSTAT[audit.statistics\nrequiresReview + resolved-output review\nliteral Unresolved count + separate scope counts]
    AUDSTAT --> AUD6[sourceCounts]
    AUD6 --> AUD7[redFlags + requiresReview\nOnly final-active signals can require review]
    AUD7 --> AUDRET[Return { romaji, audit }\nSame Romaji as ordinary path]

    %% ============================================================
    %% SIDE TOOL — KANJI HELPER
    %% ============================================================
    KHELP[Reusable Kanji Readings capability\n[M04 data + M11 API/UI lifecycle + kanji banks]] -. separate reference capability .-> START
    KHELP --> KHELP2[Structured getKanjiReadings API\nOptional built-in or data-cj2r-kanji-readings renderer]
    KHELP2 --> KHELP3[UI rendering only when a consumer opts in\nNOT a contextual translation resolver]
    KHELP3 --> KHELP4[Must not be used to guess a word/name one Kanji at a time]

    %% ============================================================
    %% ARCHITECTURAL WARNINGS
    %% ============================================================
    W1[DO NOT pre-slice Japanese before Kuromoji]:::warn
    W2[DO NOT add blanket Rendaku voicing]:::warn
    W3[DO NOT construct contextual names/words one Kanji at a time]:::warn
    W4[DO NOT globally map は/へ/を outside grammatical roles]:::warn
    W5[DO NOT force ambiguous evidence just to improve statistics]:::warn
    W6[DO NOT let unresolved Han silently pass to final Romaji]:::warn

    CONTEXT -. hard boundary .-> W1
    TS16 -. evidence-driven only .-> W2
    RUNRES -. whole-word first .-> W3
    RPART -. grammatical-role only .-> W4
    RAMBIG -. review signal .-> W5
    FINALHAN -. last defence .-> W6

    classDef warn fill:#fff3cd,stroke:#8a6d3b,color:#3f2f00,stroke-width:1px;
```

## Module map

| Label | Source module | Main responsibility in the journey |
|---|---|---|
| **M01** | `src/translator/01-assets-and-schemas.js` | Asset paths, criticality, schema validation, Kuromoji asset location. |
| **M02** | `src/translator/02-ui-controls.js` | Optional UI visibility/control wiring and explicit Kanji Readings consumer discovery. |
| **M03** | `src/translator/03-runtime-state.js` | Runtime dictionaries, warnings, flags, override state and diagnostics state. |
| **M04** | `src/translator/04-data-and-kanji-loaders.js` | JSON loading/failure policy, Kanji variant normalisation, Japanese-use Han scope classification, structured Kanji Readings data/rendering, overrides. |
| **M05** | `src/translator/05-romaji-core.js` | Input normalisation and deterministic kana→Romaji Rule 0 mechanics. |
| **M06** | `src/translator/06-lexical-and-evidence-loaders.js` | Loads lexical/evidence banks, proper-noun candidates and builds the authoritative span index. |
| **M07** | `src/translator/07-token-merging.js` | Evidence-driven token/span merging: common/general words, names, ateji, loanwords, Rendaku, historical kana and variants; reviewed loanwords use longest complete matching, safe width-normalised aliases and unique decomposition only when the whole token lacks reviewed spelling. |
| **M08** | `src/translator/08-reading-resolver.js` | Proper-noun ranking, exact dictionary rescue, orthographic pronunciations, lexical/evidence lookups and contextual candidate scoring. |
| **M09** | `src/translator/09-token-repair-and-grammar.js` | Typed temporal/numeric analysis, morphology, sokuon/kana/role boundary repairs, Latin passthrough, grammar, context overrides, phrases and output-boundary annotations. |
| **M10** | `src/translator/10-output-and-translation-pipeline.js` | Non-destructive immutable-source candidate discovery, exact override, authoritative-span rescue, resolver precedence, **Sentence-Level Reading Verification**, token conversion, casing/joining/punctuation, unresolved-Han guard, **Final Output/Evidence Consistency Validation**, and diagnostics. |
| **M11** | `src/translator/11-public-api-and-bootstrap.js` | Initialisation, bounded runtime lifecycle, host binding, optional Kanji UI lifecycle, CJ2R-owned diagnostics, public/audit API. |

## Evidence/data map

| Behaviour | Primary evidence/data |
|---|---|
| Exact whole-text exceptions (bank may contain metadata only when there are zero live exceptions) | `data/Overrides/overrides.json` |
| Context-sensitive exceptions (bank may be empty) | `data/Overrides/context-overrides.json` |
| Kanji Readings API/optional display | `data/kanji/kanji-bank-1.json`, `kanji-bank-2.json` |
| General/name-only Kanji variants | `data/kanji/kanji-variants.json` |
| Reviewed common words | `data/common-words/common-words-term-bank-1.json` |
| General word readings/candidates | `data/general-words/general-words-term-bank-1.json` |
| Compounds / known phrases | `data/compound-words/compound-words-term-bank-1.json` |
| Source-language loanwords | `data/loanwords/loanwords-term-bank-1.json` |
| Ateji | `data/ateji/ateji-term-bank-1.json` |
| Proper nouns | `data/nouns/nouns-term-bank-1.json`, `data/nouns/jmnedict-bank-1.json` |
| Reviewed whole-name spans | `data/nouns/reviewed-proper-name-span-evidence.json` |
| Counters/dates/numerals | `data/grammar/counter-date-reading-evidence.json` |
| Particle-based expressions | `data/grammar/particle-expressions.json` |
| Conjugation/auxiliary joining | `data/grammar/conjugation-patterns.json` |
| Reading preference/conflict evidence | `data/reading-evidence/reading-evidence.json` |
| Contextual legitimate-reading evidence | `data/reading-evidence/contextual-reading-evidence.json` |
| Rendaku/non-Rendaku evidence | `data/rendaku/rendaku-evidence.json` |
| Historical kana | `data/historical-kana/historical-kana-evidence.json` |
| Kuromoji context | `kuromoji.js` + `data/dict/` |

## What can happen to one Japanese input?

A single input can therefore be:

1. accepted through the built-in UI, a bound host control, or one of the public APIs;
2. run normally, through historical-kana mode, or through the identical translation path with audit capture;
3. intercepted by an enabled exact whole-text override before normalisation;
4. Unicode-normalised, width-normalised, IVS-stripped and mapped through safe general Kanji variants;
5. tokenised as a complete sentence by Kuromoji;
6. assigned continuous original-source offsets, reconciled where Kuromoji boundaries lack stronger linguistic support, then repaired/rejoined through the ordered token-stream passes;
7. matched against reviewed names, counters/dates, common/general words, compounds, ateji, loanwords, grammar, historical kana, Rendaku and context-specific overrides;
8. resolved through the ordered reading/direct-Romaji precedence chain rather than trusting any one dictionary absolutely;
9. kept reviewable when name/general-word evidence is genuinely ambiguous;
10. blocked from silently inventing a Kanji-by-Kanji contextual reading when no safe whole-word reading exists;
11. emitted directly in reviewed/source-language Romaji where appropriate, or converted from safe kana using Rule 0;
12. processed for yōon, sokuon, ん/apostrophe behaviour, written long vowels and ー;
13. joined with person-name, particle, grammar, prefix/suffix and auxiliary spacing/casing rules, plus the explicitly reviewed compact title-prefix + ASCII-fraction boundary;
14. normalised to project punctuation, including `～`/`〜` → `~`; single wave separators use `A ~ B`, while terminal paired wave wrappers remain tight inside (`Title ~Subtitle~`) and source-space-prefixed terminal ASCII hyphen wrappers preserve `Title -Subtitle-`; evidence-driven `×` handling distinguishes reviewed silent/rendered/title-span behaviour from literal reviewable fallback; paired segment-terminal source `―...―` subtitle delimiters become spaced em dashes while ordinary horizontal bars remain tight, and final sentence punctuation after the closing subtitle bar does not disable that spacing;
15. passed through a final unresolved-Han guard;
16. when diagnostics are captured, checked first by **Source/Annotation Integrity Validation** on the final annotated token stream for ordered/non-overlapping source coverage, source-surface fidelity and semantic ownership, then by **Final Output/Evidence Consistency Validation**, which compares retained boundary provenance with the actual rendered Romaji without re-segmenting the finished Latin text; and
17. optionally returned with an audit showing the pre-arbitration source-span candidate inventory/category counts/validation plus each selected reading's original source range, semantic-annotation ownership, reconciliation provenance, evidence source, confidence/candidates/flags, boundary provenance, combined structural-validation results, review-signal lifecycle/provenance, source counts and whether any `final-active` uncertainty still requires review.

## Contributor diagnosis map

| Wrong output symptom | First place to investigate | Do not solve it by… |
|---|---|---|
| Entire reviewed title has a special spelling | Exact override (`overrides.json`) | Hiding a reusable lower-level bug with an override. |
| Foreign name/loanword is phonetic, mis-spaced or re-cased instead of using its reviewed source form | Loanword evidence / Latin passthrough / protected source-output formatting | Guessing source spelling from katakana or rebuilding an authoritative mapping from tokenizer pieces. |
| Japanese name is split or read wrongly | Reviewed whole-name spans first (crossing Kuromoji boundaries and preserving Japanese name order) → proper-noun candidates → name variants; title-only names stay scoped to title evidence and unresolved name ambiguity remains reviewable. | Joining individual Kanji readings or promoting a context-only name reading globally. |
| Counter/date/age/numeral reading is wrong | Counter/date evidence | Creating a blanket sound-change rule. |
| Compound needs/blocks Rendaku | Rendaku evidence | Blanket consonant voicing. |
| Variant/IVS spelling fails | General variant mapping; name-only mapping for names | Making name-only variants global. |
| Whole word is split as false grammar or needs a stable internal Romaji boundary | Source-span reconciliation first, then stronger common/general/compound/title/name evidence. Kuromoji boundaries are retained only when stronger lexical, morphological or grammatical evidence does not contradict them. | Pre-slicing before Kuromoji, surface-only particle inference, boundary-specific rescue patches, or hiding morphology debt in a whole-form lexical row. |
| Reviewed title prefix must be typographically attached to a compact numeric fraction | Scoped title-reading evidence with `title-compact-numeric-prefix`; final boundary joining remains limited to a contiguous ASCII slash fraction, allowing only a canonical trailing `~` when boundary normalisation retains it on that passthrough token. | Globally joining words to numbers, or using a whole-input exact override. |
| Several reviewed loanwords are swallowed into one katakana token | Unique full-token decomposition through existing loanword evidence, only when no whole-token reviewed spelling exists. | Guessing among multiple possible katakana segmentations or inventing source spellings. |
| `×` is emitted as `kakeru`, or mixed-script title notation is guessed | Canonical hard-boundary handling first, then scoped title-reading evidence. Reviewed evidence may make `×` silent, render `x`, or resolve the larger title span; otherwise preserve literal `×` and require review. | Assigning `kakeru`, `cross`, `times` or another spoken value from the glyph alone. |
| は / へ / を is wrong | Particle role detection + particle expressions | Global character replacement. |
| Particle-based expression is cased/spaced wrongly | Grammar merge + final assembly | Lowercasing arbitrary verbs/adjectives. |
| ー / っ / yōon / ん is wrong | `05-romaji-core.js`; cross-token ん also `10-output...` | Adding word-specific dictionary patches. |
| Kanji becomes unresolved | Audit → whole-word/name/counter/ateji/loanword/compound/reading evidence | Using the Kanji helper to invent context. |
| Plausible readings are genuinely ambiguous | Audit candidates/flags and evidence review | Forcing a winner just to eliminate a mismatch. |

## Important architectural principle

CJ2R is **whole-sentence first, source-span aware and evidence-driven**. Kuromoji proposes morphological evidence, but its token boundaries are non-authoritative. CJ2R retains original source offsets and reconciles final spans against stronger lexical, morphological and grammatical evidence. Evidence must not remove the sentence context Kuromoji needs, and the fallback path may report uncertainty rather than fabricate a contextual Kanji reading.
