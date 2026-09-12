// Source section: Shared JSDoc contracts for translator internals.
// This file contains type contracts only and has no runtime behaviour.

/**
 * Token object used throughout the translation pipeline. Kuromoji fields are
 * retained alongside explicit CJ2R annotations added by merge/repair stages.
 * @typedef {{
 *   surface_form: string,
 *   pos?: string, pos_detail_1?: string, pos_detail_2?: string, pos_detail_3?: string,
 *   basic_form?: string, reading?: string|null, pronunciation?: string|null,
 *   conjugated_form?: string, conjugated_type?: string, word_position?: number,
 *   sourceStart?: number, sourceEnd?: number, sourceSurface?: string,
 *   sourceSpanReconciled?: boolean, sourceSpanReconciliationReason?: string, sourceSpanGrammarBoundary?: boolean, sourceSpanGrammarBoundaryBefore?: boolean,
 *   value?: string,
 *   particle?: boolean, prefix?: boolean, suffix?: boolean, nominalizer?: boolean, grammatical?: boolean,
 *   fullGrammaticalExpression?: boolean, titleSeparator?: boolean, crossNotationSymbol?: boolean, nameContinuation?: boolean, nameGivenStart?: boolean, canonicalBoundary?: boolean, hardBoundaryReconstructed?: boolean,
 *   morphologicalJoinLeft?: boolean, joinLeftAfterSokuon?: boolean, startsSeparateAuxiliaryUnit?: boolean, tokenizationRoleBoundaryBefore?: boolean, tokenizationRoleRepair?: string,
 *   numericExpression?: boolean,
 *   contextualOverrideMatched?: boolean, contextualRomaji?: string,
 *   titleReadingEvidenceMatched?: boolean, titleReadingEvidenceReading?: string|null, titleReadingEvidenceRomaji?: string|null, titleReadingEvidenceKind?: string,
 *   reviewedProperNameSpanMatched?: boolean, reviewedProperNameSpanRomaji?: string|null,
 *   reviewedNameHonorificMatched?: boolean, reviewedNameHonorificReading?: string|null,
 *   typedTemporalExpressionMatched?: boolean, typedTemporalExpressionType?: string, typedTemporalReading?: string|null, typedTemporalSource?: string, typedTemporalSpanLexicalCollision?: any, typedTemporalSuffix?: boolean,
 *   typedNumericExpressionMatched?: boolean, typedNumericExpressionType?: string, typedNumericReading?: string|null, typedNumericSource?: string,
 *   authoritativeSpanMatched?: boolean, authoritativeSpanCategory?: string, authoritativeSpanReading?: string|null, authoritativeSpanRomaji?: string|null, authoritativeSpanSource?: string, authoritativeSpanConfidence?: number, authoritativeSpanReviewRequired?: boolean, authoritativeSpanVariantMappings?: any[],
 *   reviewedNumericAliasMatched?: boolean, reviewedNumericAliasReading?: string|null, reviewedNumericAliasRomaji?: string|null, reviewedNumericAliasSource?: string,
 *   variantProperNounMatched?: boolean, variantCanonicalRetokenized?: boolean, variantOriginalSurface?: string, variantLookupSurface?: string, variantMappings?: any[],
 *   latinPassthroughMatched?: boolean, latinPassthroughOutput?: string,
 *   knownPhraseMatched?: boolean, knownPhraseValue?: string, knownPhraseSource?: string,
 *   loanwordMatched?: boolean, loanwordOutput?: string,
 *   commonWordMatched?: boolean, commonWordReading?: string|null, commonWordRomaji?: string|null,
 *   contextualReadingEvidenceMatched?: boolean, contextualReadingEvidenceReading?: string|null, contextualReadingEvidenceRomaji?: string|null, contextualReadingEvidenceSource?: string, contextualReadingEvidenceScore?: number, contextualReadingEvidenceMargin?: number, contextualReadingEvidenceAmbiguous?: boolean, contextualReadingEvidenceCandidates?: CJ2RReadingCandidate[],
 *   historicalKanaEvidenceMatched?: boolean, historicalKanaEvidenceReading?: string|null,
 *   rendakuEvidenceMatched?: boolean, rendakuEvidenceReading?: string|null, rendakuApplied?: boolean,
 *   exactDictionaryRescueMatched?: boolean, exactDictionaryRescueSource?: string, exactDictionaryRescueConfidence?: number,
 *   kanaLexicalSpanMatched?: boolean, kanaLexicalSpanReading?: string|null,
 *   atejiMatched?: boolean, atejiReading?: string|null,
 *   generalWordMatched?: boolean, generalWordReading?: string|null, generalWordAmbiguous?: boolean, generalWordCandidates?: CJ2RReadingCandidate[], generalWordVariantMappings?: any[],
 *   ordinaryCompoundReadingMatched?: boolean, ordinaryCompoundReading?: string|null, ordinaryCompoundReadingCandidates?: CJ2RReadingCandidate[],
 *   iterationMarkFallbackMatched?: boolean, iterationMarkFallbackReading?: string|null,
 *   nameContextAmbiguous?: boolean,
 *   readingResolution?: CJ2RReadingResolution,
 *   getReading?: (() => string|null)|undefined
 * }} CJ2RToken
 */
/** @typedef {{reading?: string, romaji?: string, weight?: number, rank?: number|null, categories?: Iterable<string>, sources?: Iterable<string>}} CJ2RReadingCandidate */
/** @typedef {{surface: string, reading: string|null, romaji: string|null, source: string, confidence: number, candidates: CJ2RReadingCandidate[], flags: string[], variantMappings: any[], ambiguous: boolean, hanScope?: string|null, scopeEvidence?: any[], reviewSignals: CJ2RReviewSignal[]}} CJ2RReadingResolution */
/** @typedef {'candidate'|'active'|'resolved'|'superseded'|'final-active'} CJ2RReviewSignalState */
/** @typedef {{surface: string, flag: string, source: string, confidence: number, category: string, policyRequiresReview: boolean, requiresReview: boolean, rationale: string, state: CJ2RReviewSignalState, lifecycle: CJ2RReviewSignalState[], resolutionReason?: string|null, supersededBy?: string|null}} CJ2RReviewSignal */
/** @typedef {{requiresReview: boolean, resolvedOutputRequiresReview: boolean, literalUnresolved: number, hasLiteralUnresolved: boolean, unresolvedJapaneseReadings: number, unresolvedJapaneseHan: number, outOfScopeInput: number, unknownJapaneseScopeStatus: number}} CJ2RAuditStatistics */
/** @typedef {{sourceText: string, normalizedSourceText: string, output: string, readings: any[], sourceCounts: Record<string, number>, redFlags: CJ2RReviewSignal[], requiresReview: boolean, statistics: CJ2RAuditStatistics}} CJ2RTranslationDiagnostics */
/** @typedef {{field: Element|string, button: Element|string, output?: Element|string|null, overridesEnabled?: boolean}} CJ2RBindingOptions */

/** @typedef {{tokenize: (text: string) => CJ2RToken[], viterbi_builder?: any, token_info_dictionary?: any}} CJ2RTokenizer */
/** @typedef {{failures?: any[], rule?: string, [key: string]: any}} CJ2RRegressionReport */
/**
 * Mutable state owned by one translator engine instance.
 * @typedef {{
 *   overridesEnabled: boolean, overrides: Record<string, string>, contextOverrides: any[], contextOverrideDictionary: Map<string, any[]>, contextOverridePrefixes: Set<string>,
 *   titleReadingDictionary: Map<string, any>, titleReadingPrefixes: Set<string>, kanjiDictionary: Record<string, {on: string[], kun: string[]}>, tokenizer: CJ2RTokenizer|null,
 *   commonWordDictionary: Map<string, any>, commonWordPrefixes: Set<string>, commonWordInflectionDictionary: Map<string, any>, commonWordInflectionPrefixes: Set<string>,
 *   generalWordDictionary: Map<string, any>, generalWordPrefixes: Set<string>, kanaLexicalReadingDictionary: Map<string, any>, kanaLexicalReadingPrefixes: Set<string>,
 *   loanwordDictionary: Map<string, any>, loanwordPrefixes: Set<string>, compoundWordDictionary: Map<string, any>, atejiDictionary: Map<string, any>, atejiPrefixes: Set<string>,
 *   properNounDictionary: Map<string, any>, properNounPrefixes: Set<string>, reviewedProperNameSpanDictionary: Map<string, any>, reviewedProperNameSpanPrefixes: Set<string>,
 *   readingEvidenceDictionary: Map<string, any>, contextualReadingDictionary: Map<string, any>, contextFeatureGroups: Map<string, any>, reviewedReadingPreferenceDictionary: Map<string, any>, reviewedReadingSpanDictionary: Map<string, any>,
 *   rendakuEvidenceDictionary: Map<string, any>, rendakuEvidencePrefixes: Set<string>, historicalKanaEvidenceDictionary: Map<string, any>, historicalKanaEvidencePrefixes: Set<string>, counterDateReadingDictionary: Map<string, any>,
 *   authoritativeSpanDictionary: Map<string, any>, authoritativeSpanPrefixes: Set<string>, generalKanjiVariantDictionary: Map<string, string>, nameKanjiVariantDictionary: Map<string, string>, japaneseHanScopeDictionary: Map<string, any>,
 *   resourceWarnings: Set<string>, developerWarnings: Set<string>, lifecycleState: 'loading'|'ready'|'failed'|'destroyed', failure: Error|null, captureTranslationDiagnostics: boolean, lastTranslationDiagnostics: CJ2RTranslationDiagnostics|null,
 *   conjugationJoinEndings: Set<string>, auxiliarySpacingSurfaces: Set<string>, auxiliarySpacingBasicForms: Set<string>, contractedAuxiliaryBasicForms: Set<string>, capitalizedAuxiliarySurfaces: Set<string>,
 *   particleExpressions: Record<string, string>, grammaticalExpressionDictionary: Map<string, string>, grammaticalExpressionPrefixes: Set<string>, knownPhrasePrefixes: Set<string>, grammaticalSurfaces: Set<string>, knownPhraseDictionary: Map<string, string>
 * }} CJ2RRuntimeState
 */
