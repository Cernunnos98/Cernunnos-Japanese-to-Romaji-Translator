// Source section: Lexical lookup and post-tokenisation span merging.

function findSourceTokenRanges(tokens, sourceText) {
    const text = String(sourceText || '');
    const ranges = [];
    let cursor = 0;
    for (const token of tokens || []) {
        const surface = String(token?.surface_form || '');
        if (!surface) { ranges.push(null); continue; }

        const explicitStart = Number(token?.sourceStart);
        const explicitEnd = Number(token?.sourceEnd);
        if (Number.isInteger(explicitStart) && Number.isInteger(explicitEnd)
            && explicitStart >= cursor && explicitEnd >= explicitStart
            && text.slice(explicitStart, explicitEnd) === surface) {
            ranges.push({ start: explicitStart, end: explicitEnd });
            cursor = explicitEnd;
            continue;
        }

        const kuromojiStart = Number(token?.word_position || 0) - 1;
        if (kuromojiStart >= cursor && text.slice(kuromojiStart, kuromojiStart + surface.length) === surface) {
            const end = kuromojiStart + surface.length;
            ranges.push({ start: kuromojiStart, end });
            cursor = end;
            continue;
        }

        let start = text.indexOf(surface, cursor);
        if (start < 0) {
            const first = text.indexOf(surface);
            start = first >= 0 && text.indexOf(surface, first + surface.length) < 0 ? first : -1;
        }
        if (start < 0) { ranges.push(null); continue; }
        const end = start + surface.length;
        ranges.push({ start, end });
        cursor = end;
    }
    return ranges;
}

function attachSourceTokenSpans(tokens, sourceText) {
    const text = String(sourceText || '');
    const ranges = findSourceTokenRanges(tokens, text);
    let previousEnd = 0;
    return (tokens || []).map((token, index) => {
        const range = ranges[index];
        if (!range) return token;
        const gapStart = Math.min(previousEnd, range.start);
        const sourceGapBefore = text.slice(gapStart, range.start);
        previousEnd = Math.max(previousEnd, range.end);
        return {
            ...token,
            sourceStart: range.start,
            sourceEnd: range.end,
            sourceSurface: text.slice(range.start, range.end),
            sourceGapBefore
        };
    });
}

const spanBoundSemanticAnnotationKeys = new Set([
    'value', 'particle', 'prefix', 'suffix', 'nominalizer', 'grammatical', 'fullGrammaticalExpression',
    'titleSeparator', 'crossNotationSymbol', 'nameContinuation', 'nameGivenStart', 'canonicalBoundary', 'hardBoundaryReconstructed',
    'numericExpression', 'contextualOverrideMatched', 'contextualRomaji',
    'titleReadingEvidenceMatched', 'titleReadingEvidenceReading', 'titleReadingEvidenceRomaji', 'titleReadingEvidenceKind', 'titleReadingEvidenceSource',
    'sourceSpanLexicalCandidateMatched', 'sourceSpanLexicalCandidateReading', 'sourceSpanLexicalCandidateRomaji', 'sourceSpanLexicalCandidateKind', 'sourceSpanLexicalCandidateSource', 'sourceSpanLexicalCandidateConfidence',
    'reviewedProperNameSpanMatched', 'reviewedProperNameSpanRomaji', 'reviewedProperNameLookupSurface', 'reviewedProperNameVariantMappings',
    'reviewedNameHonorificMatched', 'reviewedNameHonorificReading',
    'typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource', 'typedTemporalSpanLexicalCollision', 'typedTemporalSuffix', 'structuredTemporalHead',
    'typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives', 'structuredNumericSplit',
    'structuredFractionRole', 'structuredFractionReading', 'structuredFractionSource',
    'authoritativeSpanMatched', 'authoritativeSpanCategory', 'authoritativeSpanReading', 'authoritativeSpanRomaji', 'authoritativeSpanSource', 'authoritativeSpanConfidence', 'authoritativeSpanReviewRequired', 'authoritativeSpanReviewReason', 'authoritativeSpanReviewFlag', 'authoritativeSpanVariantMappings',
    'reviewedNumericAliasMatched', 'reviewedNumericAliasCanonicalSurface', 'reviewedNumericAliasReading', 'reviewedNumericAliasRomaji', 'reviewedNumericAliasSource',
    'variantProperNounMatched', 'variantCanonicalRetokenized', 'variantOriginalSurface', 'variantLookupSurface', 'variantMappings',
    'latinPassthroughMatched', 'latinPassthroughOutput',
    'knownPhraseMatched', 'knownPhraseValue', 'knownPhraseSource',
    'loanwordMatched', 'loanwordOutput', 'suppressLoanwordSourceSpelling', 'countryLanguageReviewRequired',
    'contextualLoanwordEvidenceMatched', 'contextualLoanwordEvidenceOutput', 'contextualLoanwordEvidenceSource', 'contextualLoanwordEvidenceScore', 'contextualLoanwordEvidenceMargin', 'contextualLoanwordEvidenceAmbiguous', 'contextualLoanwordEvidenceCandidates',
    'commonWordMatched', 'commonWordReading', 'commonWordRomaji', 'reviewedInflectionMatched',
    'contextualReadingEvidenceMatched', 'contextualReadingEvidenceReading', 'contextualReadingEvidenceRomaji', 'contextualReadingEvidenceSource', 'contextualReadingEvidenceScore', 'contextualReadingEvidenceMargin', 'contextualReadingEvidenceAmbiguous', 'contextualReadingEvidenceCandidates',
    'historicalKanaEvidenceMatched', 'historicalKanaEvidenceReading', 'historicalKanaEvidenceSource', 'historicalKanaEvidenceSourceType',
    'rendakuEvidenceMatched', 'rendakuEvidenceReading', 'rendakuEvidenceSource', 'rendakuApplied',
    'exactDictionaryRescueMatched', 'exactDictionaryRescueSource', 'exactDictionaryRescueConfidence',
    'kanaLexicalSpanMatched', 'kanaLexicalSpanReading', 'kanaLexicalSpanEvidenceStrength', 'kanaLexicalSpanEvidenceSurfaces',
    'atejiMatched', 'atejiReading',
    'generalWordMatched', 'generalWordReading', 'generalWordAmbiguous', 'generalWordCoverageIncomplete', 'generalWordCandidates', 'generalWordVariantMappings',
    'ordinaryCompoundReadingMatched', 'ordinaryCompoundReading', 'ordinaryCompoundReadingCandidates',
    'iterationMarkFallbackMatched', 'iterationMarkFallbackReading',
    'nameContextAmbiguous', 'nameContextSurname', 'nameContextBase', 'nameContextStructure',
    'desiderativeGaruRecoveredFromSurface',
    'readingResolution', 'outputBoundaryBefore', 'outputBoundaryReason', 'outputBoundaryAuthority', 'outputBoundaryRequiresReview',
    'semanticAnnotationOwnership'
]);

function stripSpanBoundSemanticAnnotations(token) {
    const stripped = { ...(token || {}) };
    for (const key of spanBoundSemanticAnnotationKeys) delete stripped[key];
    return stripped;
}

function getCompleteDerivedSourceSpan(tokens, startIndex, endIndex, options = {}) {
    const members = (tokens || []).slice(startIndex, endIndex + 1);
    if (!members.length) return null;
    const first = members[0];
    const last = members[members.length - 1];
    if (!Number.isInteger(first?.sourceStart) || !Number.isInteger(last?.sourceEnd)) return null;
    let sourceSurface = String(first?.sourceSurface ?? first?.surface_form ?? '');
    for (let index = 1; index < members.length; index += 1) {
        const previous = members[index - 1];
        const current = members[index];
        let gap = '';
        if (!sourceTokensAreContiguous(previous, current)) {
            if (!options.allowWhitespaceGaps
                || !Number.isInteger(previous?.sourceEnd)
                || !Number.isInteger(current?.sourceStart)
                || current.sourceStart < previous.sourceEnd) return null;
            gap = String(current.sourceGapBefore || '');
            if (gap.length !== current.sourceStart - previous.sourceEnd || !/^[\s\u3000]+$/u.test(gap)) return null;
        }
        sourceSurface += gap + String(current?.sourceSurface ?? current?.surface_form ?? '');
    }
    return { sourceStart: first.sourceStart, sourceEnd: last.sourceEnd, sourceSurface };
}

function makeSemanticAnnotationOwnership(sourceSpan, annotations, evidenceSource, semanticRole, confidence = null, reviewRequired = null) {
    const keys = [...new Set((annotations || []).filter(Boolean))];
    if (!keys.length) return [];
    return [{
        annotations: keys,
        sourceStart: Number.isInteger(sourceSpan?.sourceStart) ? sourceSpan.sourceStart : null,
        sourceEnd: Number.isInteger(sourceSpan?.sourceEnd) ? sourceSpan.sourceEnd : null,
        sourceSurface: sourceSpan?.sourceSurface ?? null,
        evidenceSource: String(evidenceSource || 'derived-span'),
        semanticRole: String(semanticRole || 'derived-span'),
        confidence: Number.isFinite(confidence) ? confidence : null,
        reviewRequired: typeof reviewRequired === 'boolean' ? reviewRequired : null
    }];
}

function makeDerivedSpanToken(tokens, startIndex, endIndex, fields = {}, ownership = {}) {
    const members = (tokens || []).slice(startIndex, endIndex + 1);
    const first = members[0] || {};
    const sourceSpan = getCompleteDerivedSourceSpan(tokens, startIndex, endIndex, { allowWhitespaceGaps: Boolean(ownership.allowWhitespaceGaps) });
    const requestedSurface = String(fields.surface_form ?? members.map(token => String(token?.surface_form || '')).join(''));
    const sameExplicitSpan = Boolean(sourceSpan
        && Number.isInteger(first?.sourceStart)
        && Number.isInteger(first?.sourceEnd)
        && first.sourceStart === sourceSpan.sourceStart
        && first.sourceEnd === sourceSpan.sourceEnd
        && String(first.sourceSurface ?? first.surface_form ?? '') === sourceSpan.sourceSurface);
    const sameImplicitSpan = members.length === 1 && requestedSurface === String(first?.surface_form || '');
    const sameSpan = sameExplicitSpan || sameImplicitSpan;
    const base = sameSpan ? { ...first } : stripSpanBoundSemanticAnnotations(first);
    const previousOwnership = sameSpan && Array.isArray(first.semanticAnnotationOwnership)
        ? first.semanticAnnotationOwnership.map(owner => ({ ...owner, annotations: [...(owner.annotations || [])] }))
        : [];
    const token = { ...base, ...fields, derivedSpan: true };
    if (sourceSpan) {
        token.sourceStart = sourceSpan.sourceStart;
        token.sourceEnd = sourceSpan.sourceEnd;
        token.sourceSurface = sourceSpan.sourceSurface;
    } else if (!sameImplicitSpan) {
        delete token.sourceStart;
        delete token.sourceEnd;
        delete token.sourceSurface;
    }
    token.semanticAnnotationOwnership = [
        ...previousOwnership,
        ...makeSemanticAnnotationOwnership(
            sourceSpan,
            ownership.annotations,
            ownership.evidenceSource,
            ownership.semanticRole,
            ownership.confidence,
            ownership.reviewRequired
        )
    ];
    return token;
}

function makeDerivedMatchedSpanToken(tokens, startIndex, endIndex, endCharacter, fields = {}, ownership = {}) {
    const finalToken = tokens?.[endIndex];
    const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
    if (!finalToken || endCharacter >= finalLength) return makeDerivedSpanToken(tokens, startIndex, endIndex, fields, ownership);
    const prefixToken = makeDerivedSubspanToken(finalToken, 0, endCharacter);
    const members = [...(tokens || []).slice(startIndex, endIndex), prefixToken];
    return makeDerivedSpanToken(members, 0, members.length - 1, fields, ownership);
}

function makeDerivedSubspanToken(token, startCharacter, endCharacter, fields = {}, ownership = {}) {
    const originalSurface = String(token?.surface_form || '');
    const characters = Array.from(originalSurface);
    const start = Math.max(0, Math.min(characters.length, Number(startCharacter) || 0));
    const end = Math.max(start, Math.min(characters.length, Number(endCharacter) || characters.length));
    const surface = characters.slice(start, end).join('');
    const base = stripSpanBoundSemanticAnnotations(token || {});
    const output = { ...base, surface_form: surface, ...fields, derivedSpan: true };
    output.sourceGapBefore = start === 0 ? String(token?.sourceGapBefore || '') : '';
    const explicitSourceMatches = Number.isInteger(token?.sourceStart)
        && Number.isInteger(token?.sourceEnd)
        && String(token?.sourceSurface ?? originalSurface) === originalSurface;
    let sourceSpan = null;
    if (explicitSourceMatches) {
        const startUnits = characters.slice(0, start).join('').length;
        const endUnits = characters.slice(0, end).join('').length;
        sourceSpan = {
            sourceStart: token.sourceStart + startUnits,
            sourceEnd: token.sourceStart + endUnits,
            sourceSurface: String(token.sourceSurface ?? originalSurface).slice(startUnits, endUnits)
        };
        output.sourceStart = sourceSpan.sourceStart;
        output.sourceEnd = sourceSpan.sourceEnd;
        output.sourceSurface = sourceSpan.sourceSurface;
    } else {
        delete output.sourceStart;
        delete output.sourceEnd;
        delete output.sourceSurface;
    }
    output.semanticAnnotationOwnership = makeSemanticAnnotationOwnership(
        sourceSpan,
        ownership.annotations,
        ownership.evidenceSource,
        ownership.semanticRole,
        ownership.confidence,
        ownership.reviewRequired
    );
    return output;
}

function validateSourceTokenIntegrity(tokens, sourceText, options = {}) {
    const source = String(sourceText || '');
    const violations = [];
    let previousStart = -1;
    let previousEnd = 0;
    const covered = [];
    const add = (index, token, reason) => violations.push({ index, surface: String(token?.surface_form || ''), reason });
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!token) continue;
        const start = token.sourceStart;
        const end = token.sourceEnd;
        if (!Number.isInteger(start) || !Number.isInteger(end)) { add(index, token, 'missing-source-range'); continue; }
        if (start < 0 || end < start || end > source.length) { add(index, token, 'invalid-source-range'); continue; }
        if (start < previousStart) add(index, token, 'out-of-order-source-range');
        if (start < previousEnd) add(index, token, start === previousStart && end === previousEnd ? 'duplicated-source-range' : 'overlapping-source-range');
        const expectedSurface = source.slice(start, end);
        if (String(token.sourceSurface ?? '') !== expectedSurface) add(index, token, 'invalid-sourceSurface');
        previousStart = start;
        previousEnd = Math.max(previousEnd, end);
        covered.push([start, end]);
        for (const owner of token.semanticAnnotationOwnership || []) {
            const ownerMatches = owner
                && owner.sourceStart === start
                && owner.sourceEnd === end
                && owner.sourceSurface === expectedSurface;
            if (!ownerMatches) { add(index, token, 'stale-semantic-annotation-ownership'); continue; }
            for (const annotation of owner.annotations || []) {
                if (!Object.prototype.hasOwnProperty.call(token, annotation)) add(index, token, 'annotation-owner-without-annotation');
            }
        }
    }
    if (options.requireFullCoverage && covered.length) {
        let cursor = 0;
        for (const [start, end] of covered) {
            const gap = start > cursor ? source.slice(cursor, start) : '';
            if (gap && /\S/u.test(gap)) violations.push({ index: -1, surface: gap, reason: 'source-deletion' });
            cursor = Math.max(cursor, end);
        }
        const trailing = cursor < source.length ? source.slice(cursor) : '';
        if (trailing && /\S/u.test(trailing)) violations.push({ index: -1, surface: trailing, reason: 'source-deletion' });
    }
    return { valid: violations.length === 0, violations };
}

function sourceTokensAreContiguous(left, right) {
    return Boolean(
        left && right
        && Number.isInteger(left.sourceEnd)
        && Number.isInteger(right.sourceStart)
        && left.sourceEnd === right.sourceStart
    );
}

function contextualPatternContainsRange(pattern, sourceText, range) {
    if (!range) return false;
    const flags = pattern.flags.includes('g') ? pattern.flags : pattern.flags + 'g';
    const matcher = new RegExp(pattern.source, flags);
    let match;
    while ((match = matcher.exec(sourceText)) !== null) {
        const start = match.index;
        const end = start + match[0].length;
        if (range.start >= start && range.end <= end) return true;
        if (!match[0].length) matcher.lastIndex += 1;
    }
    return false;
}

function isTitleMentionSourceBoundaryAt(sourceText, index) {
    const source = String(sourceText || '');
    const character = source[index] || '';
    return Boolean(character) && (/^\s$/u.test(character) || isCanonicalHardBoundaryAt(source, index));
}

function titleReadingEvidenceAppliesToRange(evidence, sourceText, range, boundaryContext = {}) {
    if (!evidence?.pattern || !range) return false;
    const source = canonicalizeTokenizerBoundaryCharacters(String(sourceText || ''));
    const reviewedSurface = canonicalizeTokenizerBoundaryCharacters(normalizeTranslatorInputText(String(evidence.surface || '')));
    if (!reviewedSurface || source.slice(range.start, range.end) !== reviewedSurface) return false;

    // Fragment rules remain valid only inside their authored larger title/context.
    // Complete-title rules need a stronger check: an unanchored regex equal to the
    // title surface must not become a raw-string prefix match inside another word.
    const exactFlags = evidence.pattern.flags.replace(/g/gu, '');
    const exactReviewedSurfacePattern = new RegExp(`^(?:${evidence.pattern.source})$`, exactFlags);
    const patternDescribesCompleteSurface = exactReviewedSurfacePattern.test(reviewedSurface);
    const matchFlags = evidence.pattern.flags.includes('g') ? evidence.pattern.flags : `${evidence.pattern.flags}g`;
    const matcher = new RegExp(evidence.pattern.source, matchFlags);
    let match;
    while ((match = matcher.exec(source)) !== null) {
        const matchStart = match.index;
        const matchEnd = matchStart + match[0].length;
        if (range.start >= matchStart && range.end <= matchEnd) {
            if (!patternDescribesCompleteSurface) return true;
            // Authored punctuation/context extending beyond the reviewed surface is
            // independent evidence and remains valid without grammatical inference.
            if (matchStart < range.start || matchEnd > range.end) return true;
            break;
        }
        if (!match[0].length) matcher.lastIndex += 1;
    }

    if (!patternDescribesCompleteSurface) return false;

    // A rule authored for the complete reviewed title remains valid when that exact
    // title is mentioned as a syntactically bounded noun in a larger sentence. This
    // extension must use source-aligned morphology, never a raw following kana prefix.
    const left = source.slice(0, range.start);
    const right = source.slice(range.end);
    const leftBoundary = !left
        || isTitleMentionSourceBoundaryAt(left, left.length - 1)
        || Boolean(boundaryContext.leftGrammaticalBoundary);
    const rightBoundary = !right
        || isTitleMentionSourceBoundaryAt(source, range.end)
        || Boolean(boundaryContext.rightGrammaticalBoundary);
    return leftBoundary && rightBoundary;
}

function getTitleMentionBoundaryContext(tokens, sourceRanges, range, sourceText = '') {
    if (!range) return { leftGrammaticalBoundary: false, rightGrammaticalBoundary: false };
    let leftGrammaticalBoundary = false;
    let rightGrammaticalBoundary = false;
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const tokenRange = sourceRanges?.[index]
            || (Number.isInteger(token?.sourceStart) && Number.isInteger(token?.sourceEnd)
                ? { start: token.sourceStart, end: token.sourceEnd }
                : null);
        if (!tokenRange) continue;
        if (tokenRange.end === range.start && isParticle(token)) leftGrammaticalBoundary = true;
        if (tokenRange.start === range.end && isGrammaticalToken(token)) rightGrammaticalBoundary = true;
    }

    // Whole-sentence Kuromoji boundaries are useful evidence but must not be a
    // single point of failure. Re-tokenise only the exact source slice touching
    // the candidate boundary when the original partition swallowed a particle
    // into an adjacent lexical token. This remains analyser-backed evidence: a
    // lexical word such as はちみつ stays a noun and cannot masquerade as は.
    const source = String(sourceText || '');
    if (runtimeState.tokenizer && source) {
        if (!rightGrammaticalBoundary && range.end < source.length) {
            const suffixTokens = runtimeState.tokenizer.tokenize(source.slice(range.end));
            const first = suffixTokens[0] || null;
            if (first && isGrammaticalToken(first)) rightGrammaticalBoundary = true;
        }
        if (!leftGrammaticalBoundary && range.start > 0) {
            const prefixTokens = runtimeState.tokenizer.tokenize(source.slice(0, range.start));
            const last = prefixTokens[prefixTokens.length - 1] || null;
            if (last && isParticle(last)) leftGrammaticalBoundary = true;
        }
    }
    return { leftGrammaticalBoundary, rightGrammaticalBoundary };
}



/** @param {CJ2RToken|null|undefined} token */
function getKuromojiDictionaryReading(token) {
    if (!token) return null;
    const candidates = [token.reading, token.pronunciation, typeof token.getReading === 'function' ? token.getReading() : null];
    for (const candidate of candidates) {
        const reading = String(candidate || '').trim();
        if (!reading || reading === '*' || reading === '＊') continue;
        if (/^[ぁ-ゖァ-ヶー]+$/u.test(reading)) return reading;
    }
    return null;
}

function hasReviewedLexicalBoundaryBefore(token) {
    return Boolean(token?.reviewedLexicalBoundaryBefore || token?.tokenizationRoleBoundaryBefore);
}

function crossesReviewedLexicalBoundary(tokens, startIndex, endIndex) {
    if (endIndex <= startIndex) return false;
    return hasReviewedLexicalBoundaryBefore(tokens?.[endIndex]);
}

function selectCommonWordRuleLookup(surface, sourceText, allowDefault = true) {
    const originalSurface = String(surface || '');
    const rules = runtimeState.commonWordDictionary.get(originalSurface) || [];
    for (const rule of rules.filter(item => item.pattern)) {
        rule.pattern.lastIndex = 0;
        if (rule.pattern.test(sourceText)) return { rule, lookupSurface: originalSurface, variant: null };
    }
    if (allowDefault) {
        const defaultRule = rules.find(item => !item.pattern);
        if (defaultRule) return { rule: defaultRule, lookupSurface: originalSurface, variant: null };
    }
    const variant = normalizeKanjiForLookupDetailed(originalSurface);
    if (!variant.changed || !variant.normalizedSurface || !allowDefault) return null;
    const variantRule = (runtimeState.commonWordDictionary.get(variant.normalizedSurface) || []).find(item => !item.pattern);
    return variantRule ? { rule: variantRule, lookupSurface: variant.normalizedSurface, variant } : null;
}

function selectCommonWordRule(surface, sourceText, allowDefault = true) {
    return selectCommonWordRuleLookup(surface, sourceText, allowDefault)?.rule || null;
}

function isParticle(token) {
    return Boolean(token && (token.pos === '助詞' || token.fullGrammaticalExpression));
}
function tokenBasicForm(token) {
    const basic = String(token?.basic_form || '').trim();
    return basic && basic !== '*' ? basic : String(token?.surface_form || '');
}

function startsSeparateAuxiliaryUnit(token) {
    if (!token) return false;
    const surface = String(token.surface_form || '');
    const basic = tokenBasicForm(token);
    return runtimeState.auxiliarySpacingSurfaces.has(surface)
        || runtimeState.auxiliarySpacingBasicForms.has(basic);
}

function isGrammaticalToken(token) {
    if (!token) return false;
    if (isParticle(token) || token.pos === '助動詞' || runtimeState.grammaticalSurfaces.has(token.surface_form)) return true;
    return token.pos === '動詞'
        && token.pos_detail_1 === '非自立'
        && runtimeState.auxiliarySpacingBasicForms.has(tokenBasicForm(token));
}
function isNominalizer(token) { return Boolean(token) && token.surface_form === 'の' && token.pos === '名詞'; }
function isPrefix(token) { return Boolean(token) && token.pos === '接頭詞'; }
function isSuffix(token) { return Boolean(token) && (token.pos === '接尾詞' || token.pos_detail_1 === '接尾'); }
function isProperNounToken(token) { return Boolean(token) && (token.pos_detail_1 === '固有名詞' || token.pos_detail_2 === '人名'); }
function isPersonNameToken(token) { return Boolean(token) && token.pos_detail_1 === '固有名詞' && token.pos_detail_2 === '人名'; }

function canContinueCommonWord(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.commonWordPrefixes.has(originalSurface)
        || runtimeState.commonWordPrefixes.has(normalizeKanjiForLookup(originalSurface));
}

function findLongestReviewedCommonWordInflection(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += String(token.surface_form || '');
        if (!runtimeState.commonWordInflectionPrefixes.has(candidateSurface)) break;
        const evidence = runtimeState.commonWordInflectionDictionary.get(candidateSurface);
        if (evidence) bestMatch = { surface: candidateSurface, ...evidence, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeReviewedCommonWordInflectionTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestReviewedCommonWordInflection(tokens, index);
        if (!bestMatch || bestMatch.length === 1) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '動詞',
            pos_detail_1: '自立',
            pos_detail_2: '*',
            basic_form: bestMatch.lemma,
            conjugated_type: bestMatch.conjugationClass,
            commonWordMatched: true,
            commonWordReading: bestMatch.reading,
            reviewedInflectionMatched: true
        }, {
            annotations: ['commonWordMatched', 'commonWordReading', 'reviewedInflectionMatched'],
            evidenceSource: 'reviewed-common-word-inflection',
            semanticRole: 'lexical-inflection'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestCommonWord(tokens, startIndex, sourceText) {
    let bestMatch = null;
    let candidateSurface = '';
    let hasProperNoun = false;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || (token.pos === '記号' && token.surface_form !== '々' && !containsHan(token.surface_form)) || token.contextualOverrideMatched || token.loanwordMatched || token.historicalKanaEvidenceMatched) break;
        candidateSurface += String(token.surface_form || '');
        hasProperNoun ||= isProperNounToken(token);
        if (!canContinueCommonWord(candidateSurface)) break;
        const contextRule = selectCommonWordRule(candidateSurface, sourceText, false);
        const defaultRule = contextRule ? null : selectCommonWordRule(candidateSurface, sourceText, !hasProperNoun);
        const rule = contextRule || defaultRule;
        if (rule) bestMatch = { surface: candidateSurface, reading: rule.reading, romaji: rule.romaji || null, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeCommonWordTokens(tokens, sourceText) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestCommonWord(tokens, index, sourceText);
        if (!bestMatch || bestMatch.length === 1) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', commonWordMatched: true, commonWordReading: bestMatch.reading, commonWordRomaji: bestMatch.romaji || null
        }, {
            annotations: ['commonWordMatched', 'commonWordReading', 'commonWordRomaji'],
            evidenceSource: 'common-word-bank',
            semanticRole: 'lexical-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}


function findLongestTitleReadingEvidence(tokens, startIndex, sourceText, sourceRanges = []) {
    if (!runtimeState.titleReadingDictionary.size) return null;
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.contextualOverrideMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const evidenceBackedSymbol = token.pos === '記号'
            && !isIdeographicVariationSelectorSequence(tokenSurface)
            && runtimeState.titleReadingPrefixes.has(nextCandidateSurface);
        if (token.pos === '記号' && !isIdeographicVariationSelectorSequence(tokenSurface) && !evidenceBackedSymbol) break;
        candidateSurface = nextCandidateSurface;
        if (!runtimeState.titleReadingPrefixes.has(candidateSurface)) break;
        const startRange = sourceRanges[startIndex];
        const endRange = sourceRanges[end];
        const candidateRange = startRange && endRange ? { start: startRange.start, end: endRange.end } : null;
        for (const evidence of runtimeState.titleReadingDictionary.get(candidateSurface) || []) {
            if (!titleReadingEvidenceAppliesToRange(evidence, sourceText, candidateRange, getTitleMentionBoundaryContext(tokens, sourceRanges, candidateRange, sourceText))) continue;
            bestMatch = { ...evidence, lookupSurface: candidateSurface, surface: evidence.surface || candidateSurface, length: end - startIndex + 1 };
        }
    }
    return bestMatch;
}

function mergeTitleReadingEvidenceTokens(tokens, sourceText) {
    const merged = [];
    const sourceRanges = findSourceTokenRanges(tokens, sourceText);
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestTitleReadingEvidence(tokens, index, sourceText, sourceRanges);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading || tokens[index].reading,
            pronunciation: bestMatch.reading || tokens[index].pronunciation,
            titleReadingEvidenceMatched: true,
            titleReadingEvidenceReading: bestMatch.reading || null,
            titleReadingEvidenceRomaji: bestMatch.romaji,
            titleReadingEvidenceKind: bestMatch.kind,
            titleReadingEvidenceSource: bestMatch.source,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        }, {
            annotations: ['titleReadingEvidenceMatched', 'titleReadingEvidenceReading', 'titleReadingEvidenceRomaji', 'titleReadingEvidenceKind', 'titleReadingEvidenceSource'],
            evidenceSource: bestMatch.source || 'title-reading-evidence',
            semanticRole: 'title-reading'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function getGeneralWordLookup(surface) {
    const originalSurface = String(surface || '');
    const exact = runtimeState.generalWordDictionary.get(originalSurface);
    if (exact) return { entry: exact, lookupSurface: originalSurface, variant: null };
    const variant = normalizeKanjiForLookupDetailed(originalSurface);
    if (!variant.changed || !variant.normalizedSurface) return null;
    const entry = runtimeState.generalWordDictionary.get(variant.normalizedSurface);
    return entry ? { entry, lookupSurface: variant.normalizedSurface, variant } : null;
}

function getGeneralWordCandidates(lookup) {
    if (!lookup?.entry?.readings) return [];
    const retained = lookup.entry.readings.map(item => ({
        reading: item.reading,
        popularityScore: Number(item.popularityScore ?? item.score ?? 0),
        retained: true
    }));
    const additional = (lookup.entry.unretainedReadings || []).map(item => ({
        reading: item.reading,
        popularityScore: Number(item.popularityScore || 0),
        retained: false
    }));
    const seen = new Set();
    return [...retained, ...additional]
        .filter(item => { const key = normalizeKanaReading(item.reading); if (!key || seen.has(key)) return false; seen.add(key); return true; })
        .sort((a, b) => b.popularityScore - a.popularityScore || a.reading.localeCompare(b.reading, 'ja'))
        .map((item, index) => ({
            reading: item.reading,
            romaji: convertToRomaji(item.reading),
            // Yomitan/Jitendex score is popularity/search ranking, not semantic probability.
            weight: 0,
            rank: index + 1,
            popularityScore: item.popularityScore,
            retained: item.retained,
            categories: new Set(['lexical']),
            sources: new Set(['jitendex-general-word'])
        }));
}

function hasCompleteGeneralWordReadingCoverage(lookup) {
    return lookup?.entry?.readingCoverage === 'complete-source-surface'
        && Number.isInteger(lookup.entry.sourceReadingCount)
        && lookup.entry.sourceReadingCount === getGeneralWordCandidates(lookup).length;
}

function selectGeneralWordReading(lookup) {
    const candidates = getGeneralWordCandidates(lookup);
    if (!hasCompleteGeneralWordReadingCoverage(lookup) || candidates.length !== 1) return null;
    return lookup.entry.readings.find(item => normalizeKanaReading(item.reading) === normalizeKanaReading(candidates[0].reading)) || null;
}

/** @param {CJ2RToken} token */
function resolveGeneralWordFallback(token) {
    if (!token || isProperNounToken(token) || isParticle(token) || isPrefix(token) || isSuffix(token) || token.pos === '助動詞') return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const selected = selectGeneralWordReading(lookup);
    const candidates = getGeneralWordCandidates(lookup);
    const concreteAmbiguity = candidates.length > 1;
    const coverageIncomplete = !hasCompleteGeneralWordReadingCoverage(lookup);
    // Popularity may order a provisional visible reading, but never clears
    // ambiguity or substitutes for source coverage/restriction evidence.
    const provisional = selected || lookup.entry.readings[0] || null;
    return {
        reading: provisional?.reading || null,
        source: selected ? 'general-word-fallback' : 'general-word-ranked-provisional',
        confidence: selected ? 0.86 : (concreteAmbiguity ? 0.55 : 0.64),
        candidates,
        flags: [
            ...(provisional ? ['fallback-reading'] : []),
            ...(concreteAmbiguity ? ['general-word-ambiguous'] : []),
            ...(coverageIncomplete ? ['general-word-coverage-incomplete'] : []),
            ...(lookup.variant ? ['variant-reading-evidence'] : [])
        ],
        variantMappings: lookup.variant?.mappings || [],
        ambiguous: concreteAmbiguity || coverageIncomplete
    };
}

function assessGeneralWordReading(token, currentReading) {
    if (!token || !currentReading) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const normalized = normalizeKanaReading(currentReading);
    const candidates = getGeneralWordCandidates(lookup);
    const matchedIndex = candidates.findIndex(item => normalizeKanaReading(item.reading) === normalized);
    const completeCoverage = hasCompleteGeneralWordReadingCoverage(lookup);
    const strongPreference = completeCoverage && candidates.length === 1;
    const conflict = candidates.length > 0 && matchedIndex < 0;
    return {
        matched: matchedIndex >= 0,
        matchedIndex,
        candidates,
        strongPreference,
        conflict,
        coverageIncomplete: !completeCoverage,
        variantMappings: lookup.variant?.mappings || []
    };
}

function isGeneralWordSegmentSeparatorToken(token) {
    return Boolean(token && /^[~～〜]$/u.test(String(token.surface_form || '')));
}

function hasStrongerGeneralWordSegmentEvidence(tokens, surface) {
    if (runtimeState.reviewedReadingPreferenceDictionary.get(surface)) return true;
    return tokens.some(token => token?.contextualOverrideMatched
        || token?.titleReadingEvidenceMatched
        || token?.reviewedProperNameSpanMatched
        || token?.reviewedNameHonorificMatched
        || token?.authoritativeSpanMatched
        || token?.reviewedNumericAliasMatched
        || token?.variantProperNounMatched
        || token?.exactDictionaryRescueMatched
        || token?.loanwordMatched
        || token?.atejiMatched
        || token?.commonWordMatched
        || token?.knownPhraseMatched
        || token?.rendakuEvidenceMatched
        || token?.historicalKanaEvidenceMatched
        || token?.fullGrammaticalExpression);
}

function findExactGeneralWordSegment(tokens, startIndex, sourceText = '') {
    if (!tokens?.length || startIndex < 0 || startIndex >= tokens.length) return null;
    if (startIndex > 0 && !isGeneralWordSegmentSeparatorToken(tokens[startIndex - 1])) return null;
    let endIndex = startIndex;
    while (endIndex + 1 < tokens.length && !isGeneralWordSegmentSeparatorToken(tokens[endIndex + 1])) endIndex += 1;
    const segmentTokens = tokens.slice(startIndex, endIndex + 1);
    if (!segmentTokens.length) return null;
    const segmentSurface = segmentTokens.map(token => String(token?.surface_form || '')).join('');
    const segmentIndex = tokens.slice(0, startIndex).filter(isGeneralWordSegmentSeparatorToken).length;
    const sourceSegments = String(sourceText || '').split(/[~～〜]/u);
    if (!segmentSurface || sourceSegments[segmentIndex] !== segmentSurface) return null;
    const lookup = getGeneralWordLookup(segmentSurface);
    if (!lookup?.entry?.readings?.length || lookup.entry.mergeSafe || getGeneralWordCandidates(lookup).length < 2) return null;
    if (hasStrongerGeneralWordSegmentEvidence(segmentTokens, segmentSurface)) return null;
    const provisional = lookup.entry.readings[0];
    return {
        surface: segmentSurface,
        reading: provisional.reading,
        length: segmentTokens.length,
        candidates: getGeneralWordCandidates(lookup),
        ambiguous: true,
        coverageIncomplete: !hasCompleteGeneralWordReadingCoverage(lookup),
        variantMappings: lookup.variant?.mappings || [],
        exactGeneralWordSegmentFallback: true,
        tokenizerConsensusVerbSpan: false
    };
}

function findLongestGeneralWord(tokens, startIndex, sourceText = '') {
    const exactSegmentMatch = findExactGeneralWordSegment(tokens, startIndex, sourceText);
    if (exactSegmentMatch) return exactSegmentMatch;
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || isProperNounToken(token) || isGrammaticalToken(token) || isPrefix(token)
            || (isSuffix(token) && end === startIndex)
            || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.loanwordMatched || token.atejiMatched || token.commonWordMatched
            || token.knownPhraseMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched || token.fullGrammaticalExpression) break;
        if (token.pos === '記号' && !containsHan(token.surface_form)) break;
        candidateSurface += String(token.surface_form || '');
        const lookupSurface = normalizeKanjiForLookup(candidateSurface);
        if (!runtimeState.generalWordPrefixes.has(candidateSurface) && !runtimeState.generalWordPrefixes.has(lookupSurface)) break;
        if (end === startIndex) continue;
        const lookup = getGeneralWordLookup(candidateSurface);
        if (!lookup?.entry) continue;
        const selected = selectGeneralWordReading(lookup);
        const candidates = getGeneralWordCandidates(lookup);
        const candidateTokens = tokens.slice(startIndex, end + 1);
        let tokenizerConsensusVerbSpan = false;
        let tokenizerConsensusReading = null;
        if (!lookup?.entry?.mergeSafe
            && candidateTokens.length > 1
            && candidateTokens.every(item => item?.pos === '動詞' && !isGrammaticalToken(item))
            && runtimeState.tokenizer) {
            const standalone = runtimeState.tokenizer.tokenize(candidateSurface) || [];
            const standaloneToken = standalone.length === 1 && String(standalone[0]?.surface_form || '') === candidateSurface
                ? standalone[0]
                : null;
            const standaloneReading = normalizeKanaReading(getKuromojiDictionaryReading(standaloneToken) || '');
            tokenizerConsensusVerbSpan = Boolean(
                standaloneToken
                && standaloneToken.pos === '動詞'
                && standaloneToken.pos_detail_1 !== '非自立'
                && standaloneReading
                && candidates.some(item => normalizeKanaReading(item?.reading || '') === standaloneReading)
            );
            tokenizerConsensusReading = tokenizerConsensusVerbSpan ? standaloneReading : null;
        }
        if (!lookup?.entry?.mergeSafe && !tokenizerConsensusVerbSpan) continue;
        // A tokenizer split may be repaired only when standalone Kuromoji and
        // maintained lexical evidence independently agree on the whole verb span.
        const provisional = selected
            || (tokenizerConsensusReading ? candidates.find(item => normalizeKanaReading(item?.reading || '') === tokenizerConsensusReading) : null)
            || lookup.entry.readings[0]
            || null;
        if (!provisional) continue;
        bestMatch = {
            surface: candidateSurface,
            reading: provisional.reading,
            length: end - startIndex + 1,
            candidates,
            ambiguous: candidates.length > 1,
            coverageIncomplete: !hasCompleteGeneralWordReadingCoverage(lookup),
            variantMappings: lookup.variant?.mappings || [],
            tokenizerConsensusVerbSpan
        };
    }
    return bestMatch;
}

function mergeGeneralWordTokens(tokens, sourceText = '') {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestGeneralWord(tokens, index, sourceText);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const matchedTokens = tokens.slice(index, index + bestMatch.length);
        if (isStructuredNumericUnitSurface(bestMatch.surface)) { merged.push(tokens[index]); continue; }
        const numericExpression = matchedTokens.length > 1 && matchedTokens.every(token => token.pos_detail_1 === '数' || (isSuffix(token) && token.pos_detail_2 === '助数詞'));
        if (numericExpression) {
            merged.push(tokens[index]);
            continue;
        }
        if (matchedTokens.length > 1 && matchedTokens.every(token => token.authoritativeSpanCategory === 'counter-date')) {
            merged.push(tokens[index]);
            continue;
        }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: bestMatch.tokenizerConsensusVerbSpan ? '動詞' : '名詞',
            pos_detail_1: bestMatch.tokenizerConsensusVerbSpan ? '自立' : '一般', pos_detail_2: '*',
            basic_form: bestMatch.tokenizerConsensusVerbSpan ? bestMatch.surface : undefined,
            generalWordMatched: true, generalWordReading: bestMatch.reading, generalWordCandidates: bestMatch.candidates,
            generalWordAmbiguous: bestMatch.ambiguous, generalWordCoverageIncomplete: bestMatch.coverageIncomplete, generalWordVariantMappings: bestMatch.variantMappings,
            generalWordVerbSpanReconstructed: Boolean(bestMatch.tokenizerConsensusVerbSpan), numericExpression
        }, {
            annotations: ['generalWordMatched', 'generalWordReading', 'generalWordCandidates', 'generalWordAmbiguous', 'generalWordCoverageIncomplete', 'generalWordVariantMappings', 'numericExpression'],
            evidenceSource: 'general-word-bank',
            semanticRole: 'lexical-span',
            reviewRequired: Boolean(bestMatch.ambiguous || bestMatch.coverageIncomplete)
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestRendakuEvidence(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || isProperNounToken(token) || isGrammaticalToken(token)
            || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.loanwordMatched || token.atejiMatched || token.commonWordMatched
            || token.knownPhraseMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched || token.fullGrammaticalExpression) break;
        if (token.pos === '記号' && !containsHan(token.surface_form)) break;
        candidateSurface += String(token.surface_form || '');
        if (!runtimeState.rendakuEvidencePrefixes.has(candidateSurface)) break;
        const evidence = runtimeState.rendakuEvidenceDictionary.get(candidateSurface);
        if (evidence) bestMatch = { surface: candidateSurface, ...evidence, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeRendakuEvidenceTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestRendakuEvidence(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            rendakuEvidenceMatched: true,
            rendakuEvidenceReading: bestMatch.reading,
            rendakuEvidenceSource: bestMatch.source,
            rendakuApplied: bestMatch.rendaku
        }, {
            annotations: ['rendakuEvidenceMatched', 'rendakuEvidenceReading', 'rendakuEvidenceSource', 'rendakuApplied'],
            evidenceSource: bestMatch.source || 'rendaku-evidence',
            semanticRole: 'rendaku-reading'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestHistoricalKanaEvidence(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号' || token.contextualOverrideMatched) break;
        const prefixSurface = candidateSurface;
        const tokenCharacters = Array.from(String(token.surface_form || ''));
        let stillPossible = false;
        for (let offset = 1; offset <= tokenCharacters.length; offset += 1) {
            const probe = prefixSurface + tokenCharacters.slice(0, offset).join('');
            if (runtimeState.historicalKanaEvidencePrefixes.has(probe)) stillPossible = true;
            const evidence = runtimeState.historicalKanaEvidenceDictionary.get(probe);
            if (!evidence) continue;
            const match = { surface: probe, ...evidence, endIndex: end, endOffset: offset, length: end - startIndex + 1 };
            if (!bestMatch || Array.from(probe).length > Array.from(bestMatch.surface).length) bestMatch = match;
        }
        candidateSurface = prefixSurface + tokenCharacters.join('');
        if (!runtimeState.historicalKanaEvidencePrefixes.has(candidateSurface)) break;
        if (!stillPossible && !bestMatch) break;
    }
    return bestMatch;
}

function tokenizeHistoricalRemainder(token, consumedCharacters) {
    const surface = String(token?.surface_form || '');
    const characters = Array.from(surface);
    const remainder = characters.slice(consumedCharacters).join('');
    if (!remainder) return [];
    // This is a post-tokenisation repair for an attested historical boundary.
    // Only the overshooting token fragment is retokenised; sentence context stays intact elsewhere.
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    if (!retokenized.length) {
        return [makeDerivedSubspanToken(token, consumedCharacters, characters.length, {
            reading: remainder, pronunciation: remainder
        }, { semanticRole: 'historical-remainder', evidenceSource: 'historical-kana-boundary' })];
    }
    let cursor = consumedCharacters;
    return retokenized.map(item => {
        const length = Array.from(String(item?.surface_form || '')).length;
        const derived = makeDerivedSubspanToken(token, cursor, cursor + length, { ...item }, {
            semanticRole: 'historical-remainder', evidenceSource: 'historical-kana-boundary'
        });
        cursor += length;
        return derived;
    });
}

function mergeHistoricalKanaEvidenceTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestHistoricalKanaEvidence(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedMatchedSpanToken(tokens, index, bestMatch.endIndex, bestMatch.endOffset, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: bestMatch.pos,
            pos_detail_1: '自立',
            pos_detail_2: '*',
            pos_detail_3: '*',
            historicalKanaEvidenceMatched: true,
            historicalKanaEvidenceReading: bestMatch.reading,
            historicalKanaEvidenceSource: bestMatch.source,
            historicalKanaEvidenceSourceType: bestMatch.sourceType
        }, {
            annotations: ['historicalKanaEvidenceMatched', 'historicalKanaEvidenceReading', 'historicalKanaEvidenceSource', 'historicalKanaEvidenceSourceType'],
            evidenceSource: bestMatch.source || 'historical-kana-evidence',
            semanticRole: 'historical-reading'
        }));
        const finalToken = tokens[bestMatch.endIndex];
        const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
        if (bestMatch.endOffset < finalLength) merged.push(...tokenizeHistoricalRemainder(finalToken, bestMatch.endOffset));
        index = bestMatch.endIndex;
    }
    return merged;
}

function findLongestAteji(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || (token.pos === '記号' && !containsHan(token.surface_form)) || token.contextualOverrideMatched || token.historicalKanaEvidenceMatched || isProperNounToken(token)) break;
        candidateSurface += String(token.surface_form || '');
        const reading = runtimeState.atejiDictionary.get(candidateSurface);
        if (reading) bestMatch = { surface: candidateSurface, reading, length: end - startIndex + 1 };
        if (!runtimeState.atejiPrefixes.has(candidateSurface)) break;
    }
    return bestMatch;
}

function mergeAtejiTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestAteji(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading, atejiMatched: true, atejiReading: bestMatch.reading
        }, {
            annotations: ['atejiMatched', 'atejiReading'], evidenceSource: 'ateji-bank', semanticRole: 'ateji-reading'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function canContinueLoanword(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.loanwordPrefixes.has(originalSurface)
        || runtimeState.loanwordPrefixes.has(normalizeKanjiForLookup(originalSurface));
}

function getLoanwordMetadata(surface) {
    const originalSurface = String(surface || '');
    return runtimeState.loanwordMetadataDictionary.get(originalSurface)
        || runtimeState.loanwordMetadataDictionary.get(normalizeKanjiForLookup(originalSurface))
        || null;
}

function isReviewedCountryNameLoanword(surface) {
    return getLoanwordMetadata(surface)?.category === 'country-name';
}

function hasReviewedCountryLanguageLoanword(surface) {
    const originalSurface = String(surface || '');
    const output = runtimeState.loanwordDictionary.get(originalSurface)
        || runtimeState.loanwordDictionary.get(normalizeKanjiForLookup(originalSurface));
    return Boolean(output && getLoanwordMetadata(originalSurface)?.category === 'country-language');
}

function shouldSuppressCountryNameLoanwordBeforeLanguageSuffix(tokens, startIndex, matchLength, matchedSurface) {
    if (!isReviewedCountryNameLoanword(matchedSurface)) return false;
    const nextToken = tokens?.[startIndex + matchLength];
    if (String(nextToken?.surface_form || '') !== '語') return false;
    return !hasReviewedCountryLanguageLoanword(String(matchedSurface || '') + '語');
}

function makeMechanicalCountryNameFallbackToken(tokens, startIndex, bestMatch) {
    const matchedTokens = tokens.slice(startIndex, startIndex + bestMatch.length);
    const combinedReading = matchedTokens.map(token => getKuromojiDictionaryReading(token) || String(token?.surface_form || '')).join('');
    return makeDerivedSpanToken(tokens, startIndex, startIndex + bestMatch.length - 1, {
        surface_form: bestMatch.surface,
        reading: combinedReading || bestMatch.surface,
        pronunciation: combinedReading || bestMatch.surface,
        suppressLoanwordSourceSpelling: true,
        countryLanguageReviewRequired: true
    }, {
        annotations: ['suppressLoanwordSourceSpelling', 'countryLanguageReviewRequired'],
        evidenceSource: 'country-language-mechanical-fallback',
        semanticRole: 'loanword-country-name',
        reviewRequired: true
    });
}

function findLongestLoanword(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const evidenceBackedSymbol = token.pos === '記号'
            && !isIdeographicVariationSelectorSequence(tokenSurface)
            && canContinueLoanword(nextCandidateSurface);
        if (token.pos === '記号' && !isIdeographicVariationSelectorSequence(tokenSurface) && !evidenceBackedSymbol) break;
        candidateSurface = nextCandidateSurface;
        if (!canContinueLoanword(candidateSurface)) break;
        const output = runtimeState.loanwordDictionary.get(candidateSurface)
            || runtimeState.loanwordDictionary.get(normalizeKanjiForLookup(candidateSurface));
        if (output) bestMatch = { surface: candidateSurface, output, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function findUniqueReviewedLoanwordSegmentation(surface) {
    const originalSurface = String(surface || '');
    if (!originalSurface || runtimeState.loanwordDictionary.has(originalSurface)) return null;
    if (!/^[ァ-ヶー]+$/u.test(originalSurface)) return null;
    const characters = Array.from(originalSurface);
    const memo = new Map();

    const solve = start => {
        if (start === characters.length) return [[]];
        if (memo.has(start)) return memo.get(start);
        const solutions = [];
        for (let end = start + 1; end <= characters.length; end += 1) {
            const segment = characters.slice(start, end).join('');
            const output = runtimeState.loanwordDictionary.get(segment);
            if (!output) continue;
            for (const tail of solve(end)) {
                solutions.push([{ surface: segment, output }, ...tail]);
                if (solutions.length > 1) { memo.set(start, solutions); return solutions; }
            }
        }
        memo.set(start, solutions);
        return solutions;
    };

    const solutions = solve(0);
    return solutions.length === 1 && solutions[0].length > 1 ? solutions[0] : null;
}

function splitReviewedLoanwordToken(token) {
    if (!token || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.rendakuEvidenceMatched || token.historicalKanaEvidenceMatched) return null;
    const segments = findUniqueReviewedLoanwordSegmentation(token.surface_form);
    if (!segments) return null;
    let cursor = 0;
    return segments.map((segment, index) => {
        const length = Array.from(segment.surface).length;
        const derived = makeDerivedSubspanToken(token, cursor, cursor + length, {
            surface_form: segment.surface,
            reading: segment.surface,
            pronunciation: segment.surface,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            loanwordMatched: true,
            loanwordOutput: segment.output,
            ...(index > 0 ? { reviewedLexicalBoundaryBefore: true, reviewedLexicalBoundarySource: 'reviewed-loanword-segmentation' } : {})
        }, {
            annotations: ['loanwordMatched', 'loanwordOutput'],
            evidenceSource: 'reviewed-loanword-segmentation',
            semanticRole: 'loanword-segment'
        });
        cursor += length;
        return derived;
    });
}

function mergeLoanwordTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestLoanword(tokens, index);
        if (!bestMatch) {
            const split = splitReviewedLoanwordToken(tokens[index]);
            if (split) merged.push(...split);
            else merged.push(tokens[index]);
            continue;
        }
        if (shouldSuppressCountryNameLoanwordBeforeLanguageSuffix(tokens, index, bestMatch.length, bestMatch.surface)) {
            merged.push(makeMechanicalCountryNameFallbackToken(tokens, index, bestMatch));
            index += bestMatch.length - 1;
            continue;
        }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, loanwordMatched: true, loanwordOutput: bestMatch.output
        }, {
            annotations: ['loanwordMatched', 'loanwordOutput'], evidenceSource: 'reviewed-loanword-bank', semanticRole: 'loanword-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

const reviewedNumericContextUnits = new Set([
    '十','百','千','万','億','兆','人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階','円'
]);

function getReviewedReadingPreferenceForSurface(surface) {
    return runtimeState.reviewedReadingPreferenceDictionary.get(String(surface || '')) || null;
}

function canonicalizeReviewedNumericAliasSurface(surface) {
    return Array.from(String(surface || '')).map(character => {
        const entry = getReviewedReadingPreferenceForSurface(character);
        return entry?.numericCanonical || character;
    }).join('');
}


function isReviewedNumericBaseToken(token) {
    if (!token) return false;
    return Boolean(token.numericExpression || token.pos_detail_1 === '数' || isJapaneseNumeralSurface(token.surface_form));
}

function isReviewedNumericContinuationToken(token) {
    if (!token) return false;
    const surface = String(token.surface_form || '');
    return isReviewedNumericBaseToken(token)
        || token.pos_detail_2 === '助数詞'
        || reviewedNumericContextUnits.has(surface)
        || Boolean(getReviewedReadingPreferenceForSurface(surface)?.numericCanonical);
}

function getCanonicalNumericAliasReading(canonicalSurface) {
    const surface = String(canonicalSurface || '');
    if (!surface || !runtimeState.tokenizer) return null;
    const reviewed = runtimeState.counterDateReadingDictionary.get(surface);
    if (reviewed?.reading) return { reading: reviewed.reading, romaji: reviewed.romaji || convertToRomaji(reviewed.reading), source: 'counter-date-reading-evidence' };
    const canonicalTokens = runtimeState.tokenizer.tokenize(surface);
    if (!canonicalTokens.length) return null;
    const readings = [];
    for (const token of canonicalTokens) {
        if (token?.pos_detail_1 === '固有名詞') return null;
        const reading = getKuromojiDictionaryReading(token);
        if (!reading) return null;
        readings.push(reading);
    }
    const reading = readings.join('');
    return reading ? { reading, romaji: convertToRomaji(reading), source: 'canonical-numeric-context' } : null;
}

function makeReviewedNumericAliasToken(tokens, startIndex, endIndex, canonicalSurface, resolved) {
    const span = tokens.slice(startIndex, endIndex + 1);
    return makeDerivedSpanToken(tokens, startIndex, endIndex, {
        surface_form: span.map(token => String(token.surface_form || '')).join(''),
        reading: resolved.reading,
        pronunciation: resolved.reading,
        pos: '名詞',
        pos_detail_1: '数',
        pos_detail_2: '*',
        pos_detail_3: '*',
        reviewedNumericAliasMatched: true,
        reviewedNumericAliasCanonicalSurface: canonicalSurface,
        reviewedNumericAliasReading: resolved.reading,
        reviewedNumericAliasRomaji: resolved.romaji || null,
        reviewedNumericAliasSource: resolved.source,
        numericExpression: true
    }, {
        annotations: ['reviewedNumericAliasMatched', 'reviewedNumericAliasCanonicalSurface', 'reviewedNumericAliasReading', 'reviewedNumericAliasRomaji', 'reviewedNumericAliasSource', 'numericExpression'],
        evidenceSource: resolved.source || 'reviewed-numeric-alias',
        semanticRole: 'numeric-alias'
    });
}


function getSingleHanIterationFallbackReading(token) {
    const surface = String(token?.surface_form || '');
    const characters = Array.from(surface);
    if (characters.length !== 1 || !isHanCharacter(characters[0]) || isGrammaticalToken(token)) return null;
    const reading = getKuromojiDictionaryReading(token);
    return reading && isSemanticKanaReading(reading) ? reading : null;
}

const kanaIterationMarkVoicing = Object.freeze({ 'ゝ': false, 'ゞ': true, 'ヽ': false, 'ヾ': true });
const smallKanaMoraFollowers = new Set(['ぁ','ぃ','ぅ','ぇ','ぉ','ゃ','ゅ','ょ','ゎ']);

function getTrailingKanaMora(reading) {
    const characters = Array.from(normalizeKanaReading(reading));
    if (!characters.length || characters[characters.length - 1] === 'ー') return null;
    const end = characters.length;
    const start = end > 1 && smallKanaMoraFollowers.has(characters[end - 1]) ? end - 2 : end - 1;
    const mora = characters.slice(start, end).join('');
    return /^[ぁ-ゔ]+$/u.test(mora) ? mora : null;
}

function applyKanaIterationVoicing(mora, voiced) {
    const characters = Array.from(String(mora || ''));
    if (!characters.length) return null;
    const firstDecomposed = characters[0].normalize('NFD').replace(/[\u3099\u309A]/gu, '');
    const first = (firstDecomposed + (voiced ? '\u3099' : '')).normalize('NFC');
    const repeated = first + characters.slice(1).join('');
    const romaji = convertToRomaji(repeated);
    return /^[A-Za-z']+$/u.test(romaji) ? repeated : null;
}

function expandKanaIterationReading(surface) {
    const original = String(surface || '');
    if (!/[ゝゞヽヾ]/u.test(original)) return null;
    let reading = '';
    let sawIteration = false;
    let previousScript = null;
    const sourceCharacters = Array.from(original);
    for (const character of sourceCharacters) {
        if (Object.prototype.hasOwnProperty.call(kanaIterationMarkVoicing, character)) {
            const requiredScript = /[ゝゞ]/u.test(character) ? 'hiragana' : 'katakana';
            if (previousScript !== requiredScript) return null;
            const previousMora = getTrailingKanaMora(reading);
            const repeated = previousMora && applyKanaIterationVoicing(previousMora, kanaIterationMarkVoicing[character]);
            if (!repeated) return null;
            reading += repeated;
            previousScript = requiredScript;
            sawIteration = true;
            continue;
        }
        const normalized = normalizeKanaReading(character);
        if (!/^[ぁ-ゔー]$/u.test(normalized)) return null;
        reading += normalized;
        if (/^[ぁ-ゖ]$/u.test(character)) previousScript = 'hiragana';
        else if (/^[ァ-ヶ]$/u.test(character)) previousScript = 'katakana';
    }
    return sawIteration ? reading : null;
}

function makeIterationFallbackToken(token, surface, reading) {
    return makeDerivedSpanToken([token], 0, 0, {
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        iterationMarkFallbackMatched: true,
        iterationMarkFallbackReading: reading
    }, {
        annotations: ['iterationMarkFallbackMatched', 'iterationMarkFallbackReading'],
        evidenceSource: 'iteration-mark-fallback', semanticRole: 'iteration-reading'
    });
}

function mergeIterationMarkFallbackTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const next = tokens[index + 1];
        if (!token) continue;

        const surface = String(token.surface_form || '');
        if (!getKuromojiDictionaryReading(token)) {
            const internalKanaReading = expandKanaIterationReading(surface);
            if (internalKanaReading) { merged.push(makeIterationFallbackToken(token, surface, internalKanaReading)); continue; }
        }

        if (!hasReviewedLexicalBoundaryBefore(next) && String(next?.surface_form || '') === '々') {
            const reading = getSingleHanIterationFallbackReading(token);
            if (reading) {
                merged.push(makeDerivedSpanToken(tokens, index, index + 1, { surface_form: surface + '々', reading: reading + reading, pronunciation: reading + reading, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', iterationMarkFallbackMatched: true, iterationMarkFallbackReading: reading + reading }, { annotations: ['iterationMarkFallbackMatched', 'iterationMarkFallbackReading'], evidenceSource: 'iteration-mark-fallback', semanticRole: 'iteration-reading' }));
                index += 1;
                continue;
            }
        }

        if (!hasReviewedLexicalBoundaryBefore(next) && Object.prototype.hasOwnProperty.call(kanaIterationMarkVoicing, String(next?.surface_form || ''))) {
            const combinedSurface = surface + String(next.surface_form || '');
            const reading = expandKanaIterationReading(combinedSurface);
            if (reading) {
                merged.push(makeDerivedSpanToken(tokens, index, index + 1, { surface_form: combinedSurface, reading, pronunciation: reading, pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*', iterationMarkFallbackMatched: true, iterationMarkFallbackReading: reading }, { annotations: ['iterationMarkFallbackMatched', 'iterationMarkFallbackReading'], evidenceSource: 'iteration-mark-fallback', semanticRole: 'iteration-reading' }));
                index += 1;
                continue;
            }
        }
        merged.push(token);
    }
    return merged;
}

function findReviewedNumericAliasSpan(tokens, startIndex) {
    const first = tokens[startIndex];
    if (!first) return null;
    const firstSurface = String(first.surface_form || '');
    const firstPreference = getReviewedReadingPreferenceForSurface(firstSurface);

    // Standard numeral + reviewed counter alias, e.g. 三疋 -> 三匹.
    if (isReviewedNumericBaseToken(first) && startIndex + 1 < tokens.length) {
        const next = tokens[startIndex + 1];
        if (hasReviewedLexicalBoundaryBefore(next)) return null;
        const nextPreference = getReviewedReadingPreferenceForSurface(next?.surface_form);
        if (nextPreference?.numericRole === 'counter' && nextPreference.numericCanonical) {
            const canonicalSurface = canonicalizeReviewedNumericAliasSurface(firstSurface + String(next.surface_form || ''));
            const resolved = getCanonicalNumericAliasReading(canonicalSurface);
            if (resolved) return { endIndex: startIndex + 1, canonicalSurface, resolved };
        }
    }

    if (!firstPreference?.numericCanonical || firstPreference.numericRole !== 'numeral') return null;
    const next = tokens[startIndex + 1] || null;
    const hasNumericContext = Boolean(next && isReviewedNumericContinuationToken(next));
    if (!hasNumericContext) return null;

    let originalSurface = firstSurface;
    let canonicalSurface = canonicalizeReviewedNumericAliasSurface(originalSurface);
    let best = getCanonicalNumericAliasReading(canonicalSurface)
        ? { endIndex: startIndex, canonicalSurface, resolved: getCanonicalNumericAliasReading(canonicalSurface) }
        : null;

    for (let endIndex = startIndex + 1; endIndex < tokens.length && endIndex <= startIndex + 3; endIndex += 1) {
        const token = tokens[endIndex];
        if (hasReviewedLexicalBoundaryBefore(token)) break;
        const surface = String(token?.surface_form || '');
        if (!token || isSeparatedNumericUnitSurface(surface)) break;
        if (!isReviewedNumericContinuationToken(token)) break;
        originalSurface += surface;
        canonicalSurface = canonicalizeReviewedNumericAliasSurface(originalSurface);
        const resolved = getCanonicalNumericAliasReading(canonicalSurface);
        if (resolved) best = { endIndex, canonicalSurface, resolved };
        if (token.pos_detail_2 === '助数詞' || ['人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階'].includes(surface)) break;
    }
    return best;
}

function mergeReviewedNumericAliasTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const match = findReviewedNumericAliasSpan(tokens, index);
        if (!match) { merged.push(tokens[index]); continue; }
        merged.push(makeReviewedNumericAliasToken(tokens, index, match.endIndex, match.canonicalSurface, match.resolved));
        index = match.endIndex;
    }
    return merged;
}

function findLongestReviewedProperNameSpan(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        const nameWhitespace = token?.pos === '記号' && token?.pos_detail_1 === '空白';
        if (!token || token.contextualOverrideMatched) break;
        const tokenSurface = String(token.surface_form || '');
        if (token.pos === '記号' && !nameWhitespace && !isIdeographicVariationSelectorSequence(tokenSurface)) {
            const punctuationProbe = normalizeKanjiForLookup((candidateSurface + tokenSurface).replace(/\s+/gu, ' '), { names: true });
            if (!runtimeState.reviewedProperNameSpanPrefixes.has(punctuationProbe)) break;
        }
        const prefixSurface = candidateSurface;
        const tokenCharacters = Array.from(String(token.surface_form || ''));
        let stillPossible = false;
        for (let offset = 1; offset <= tokenCharacters.length; offset += 1) {
            const matchedSurface = prefixSurface + tokenCharacters.slice(0, offset).join('');
            const normalizedProbe = normalizeKanjiForLookup(matchedSurface.replace(/\s+/gu, ' '), { names: true });
            if (runtimeState.reviewedProperNameSpanPrefixes.has(normalizedProbe)) stillPossible = true;
            const evidence = runtimeState.reviewedProperNameSpanDictionary.get(normalizedProbe);
            if (!evidence) continue;
            const remainder = tokenCharacters.slice(offset).join('');
            const honorifics = ['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏'];
            let allowedRemainder = !remainder || honorifics.includes(remainder);
            if (!allowedRemainder) {
                for (const honorific of honorifics) {
                    if (!honorific.startsWith(remainder)) continue;
                    let following = '';
                    for (let cursor = end + 1; cursor < tokens.length && following.length < honorific.length; cursor += 1) {
                        const nextSurface = String(tokens[cursor]?.surface_form || '');
                        if (!nextSurface || (tokens[cursor]?.pos === '記号' && tokens[cursor]?.pos_detail_1 === '空白')) break;
                        following += nextSurface;
                    }
                    if ((remainder + following).startsWith(honorific)) { allowedRemainder = true; break; }
                }
            }
            if (!allowedRemainder) continue;
            const match = { surface: matchedSurface, lookupSurface: normalizedProbe, ...evidence, endIndex: end, endOffset: offset, length: end - startIndex + 1 };
            if (!bestMatch || Array.from(normalizedProbe).length > Array.from(bestMatch.lookupSurface).length) bestMatch = match;
        }
        candidateSurface = prefixSurface + tokenCharacters.join('');
        const normalizedCandidate = normalizeKanjiForLookup(candidateSurface.replace(/\s+/gu, ' '), { names: true });
        if (!runtimeState.reviewedProperNameSpanPrefixes.has(normalizedCandidate)) break;
        if (!stillPossible && !bestMatch) break;
    }
    return bestMatch;
}

function getReviewedNameHonorificReading(surface) {
    const readings = new Map([['さん', 'さん'], ['さま', 'さま'], ['様', 'さま'], ['くん', 'くん'], ['君', 'くん'], ['ちゃん', 'ちゃん'], ['氏', 'し']]);
    return readings.get(String(surface || '')) || null;
}

function tokenizeReviewedNameRemainder(token, consumedCharacters) {
    const surface = String(token?.surface_form || '');
    const remainder = Array.from(surface).slice(consumedCharacters).join('');
    if (!remainder) return [];
    const honorificReading = getReviewedNameHonorificReading(remainder);
    if (honorificReading) {
        return [makeDerivedSubspanToken(token, consumedCharacters, Array.from(surface).length, {
            surface_form: remainder,
            reading: honorificReading,
            pronunciation: honorificReading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading
        }, {
            annotations: ['reviewedNameHonorificMatched', 'reviewedNameHonorificReading'],
            evidenceSource: 'reviewed-name-honorific', semanticRole: 'name-honorific'
        })];
    }
    return tokenizeHistoricalRemainder(token, consumedCharacters);
}

function mergeReviewedProperNameSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestReviewedProperNameSpan(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const personLike = bestMatch.category === 'person' || bestMatch.category === 'name';
        merged.push(makeDerivedMatchedSpanToken(tokens, index, bestMatch.endIndex, bestMatch.endOffset, {
            surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: personLike ? '人名' : '地域', pos_detail_3: '*',
            reviewedProperNameSpanMatched: true, reviewedProperNameSpanRomaji: bestMatch.romaji,
            reviewedProperNameLookupSurface: bestMatch.lookupSurface,
            reviewedProperNameVariantMappings: normalizeKanjiForLookupDetailed(bestMatch.surface, { names: true }).mappings
        }, {
            annotations: ['reviewedProperNameSpanMatched', 'reviewedProperNameSpanRomaji', 'reviewedProperNameLookupSurface', 'reviewedProperNameVariantMappings'],
            evidenceSource: 'reviewed-proper-name-span', semanticRole: 'proper-name-span'
        }));
        const finalToken = tokens[bestMatch.endIndex];
        const finalLength = Array.from(String(finalToken?.surface_form || '')).length;
        if (bestMatch.endOffset < finalLength) merged.push(...tokenizeReviewedNameRemainder(finalToken, bestMatch.endOffset));
        index = bestMatch.endIndex;
    }
    return merged;
}

function getProperNounCandidateLookup(surface) {
    const originalSurface = String(surface || '');
    const variantEvidence = normalizeKanjiForLookupDetailed(originalSurface, { names: true });
    const exact = runtimeState.properNounDictionary.get(originalSurface);
    if (exact?.size) {
        return { candidates: [...exact.values()], lookupSurface: originalSurface, variant: null, variantEvidence: variantEvidence.changed ? variantEvidence : null };
    }
    if (!variantEvidence.changed || !variantEvidence.normalizedSurface) {
        return { candidates: [], lookupSurface: originalSurface, variant: null, variantEvidence: null };
    }
    const normalized = runtimeState.properNounDictionary.get(variantEvidence.normalizedSurface);
    return normalized?.size
        ? { candidates: [...normalized.values()], lookupSurface: variantEvidence.normalizedSurface, variant: variantEvidence, variantEvidence }
        : { candidates: [], lookupSurface: originalSurface, variant: null, variantEvidence };
}

function inferVariantProperNounDetails(candidates) {
    const categories = new Set();
    for (const candidate of candidates || []) for (const category of candidate.categories || []) categories.add(category);
    if (categories.has('fam')) return { pos_detail_2: '人名', pos_detail_3: '姓' };
    if (categories.has('per') || categories.has('person') || categories.has('char')) return { pos_detail_2: '人名', pos_detail_3: '*' };
    if (categories.has('loc')) return { pos_detail_2: '地域', pos_detail_3: '*' };
    return { pos_detail_2: '一般', pos_detail_3: '*' };
}

function canContinueVariantProperNounSpan(surface) {
    const original = String(surface || '');
    if (runtimeState.properNounPrefixes.has(original)) return true;
    return runtimeState.properNounPrefixes.has(normalizeKanjiForLookup(original, { names: true }));
}

function findLongestVariantProperNoun(tokens, startIndex) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token) break;
        const tokenSurface = String(token.surface_form || '');
        const hanSurface = containsHan(tokenSurface);
        if (((token.pos === '記号' && tokenSurface !== '々') || isParticle(token) || token.contextualOverrideMatched) && !hanSurface) break;
        candidateSurface += tokenSurface;
        if (!canContinueVariantProperNounSpan(candidateSurface)) break;
        const hanCount = Array.from(candidateSurface).filter(isHanCharacter).length;
        if (hanCount < 2) continue;
        const lookup = getProperNounCandidateLookup(candidateSurface);
        if (!lookup.variantEvidence || !lookup.candidates.length) continue;
        bestMatch = { surface: candidateSurface, lookupSurface: lookup.lookupSurface, candidates: lookup.candidates, variant: lookup.variantEvidence, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function tokenizeCanonicalVariantProperNoun(bestMatch, sourceTokens, startIndex) {
    if (!runtimeState.tokenizer || !bestMatch?.lookupSurface) return [];
    const canonicalTokens = runtimeState.tokenizer.tokenize(bestMatch.lookupSurface) || [];
    const reconstructed = canonicalTokens.map(token => String(token.surface_form || '')).join('');
    if (!canonicalTokens.length || reconstructed !== bestMatch.lookupSurface) return [];

    const originalCharacters = Array.from(String(bestMatch.surface || ''));
    const canonicalCharacters = Array.from(String(bestMatch.lookupSurface || ''));
    if (originalCharacters.length !== canonicalCharacters.length) return [];
    const fullSourceSpan = getCompleteDerivedSourceSpan(sourceTokens, startIndex, startIndex + bestMatch.length - 1);
    if (!fullSourceSpan) {
        return canonicalTokens.map(token => ({
            ...token,
            variantCanonicalRetokenized: true,
            variantOriginalSurface: bestMatch.surface,
            variantLookupSurface: bestMatch.lookupSurface,
            variantMappings: bestMatch.variant.mappings
        }));
    }
    const sourceToken = {
        surface_form: bestMatch.surface,
        sourceStart: fullSourceSpan.sourceStart,
        sourceEnd: fullSourceSpan.sourceEnd,
        sourceSurface: fullSourceSpan.sourceSurface
    };
    let characterOffset = 0;
    const derived = [];
    for (const canonicalToken of canonicalTokens) {
        const canonicalLength = Array.from(String(canonicalToken.surface_form || '')).length;
        if (!canonicalLength || characterOffset + canonicalLength > originalCharacters.length) return [];
        derived.push(makeDerivedSubspanToken(sourceToken, characterOffset, characterOffset + canonicalLength, {
            ...canonicalToken,
            variantCanonicalRetokenized: true,
            variantOriginalSurface: originalCharacters.slice(characterOffset, characterOffset + canonicalLength).join(''),
            variantLookupSurface: String(canonicalToken.surface_form || ''),
            variantMappings: bestMatch.variant.mappings
        }, {
            annotations: ['variantCanonicalRetokenized', 'variantOriginalSurface', 'variantLookupSurface', 'variantMappings'],
            evidenceSource: 'proper-noun-variant-canonical-retokenization', semanticRole: 'proper-name-canonical-subspan'
        }));
        characterOffset += canonicalLength;
    }
    return characterOffset === originalCharacters.length ? derived : [];
}

function mergeVariantProperNounTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestVariantProperNoun(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const canonicalTokens = tokenizeCanonicalVariantProperNoun(bestMatch, tokens, index);
        if (canonicalTokens.length) {
            merged.push(...canonicalTokens);
            index += bestMatch.length - 1;
            continue;
        }
        const details = inferVariantProperNounDetails(bestMatch.candidates);
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface, reading: '*', pronunciation: '*', pos: '名詞', pos_detail_1: '固有名詞',
            pos_detail_2: details.pos_detail_2, pos_detail_3: details.pos_detail_3, variantProperNounMatched: true,
            variantLookupSurface: bestMatch.lookupSurface, variantMappings: bestMatch.variant.mappings
        }, {
            annotations: ['variantProperNounMatched', 'variantLookupSurface', 'variantMappings'],
            evidenceSource: 'proper-noun-variant-evidence', semanticRole: 'proper-name-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

