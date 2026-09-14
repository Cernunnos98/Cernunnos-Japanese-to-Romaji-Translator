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
    const ranges = findSourceTokenRanges(tokens, sourceText);
    return (tokens || []).map((token, index) => {
        const range = ranges[index];
        if (!range) return token;
        return {
            ...token,
            sourceStart: range.start,
            sourceEnd: range.end,
            sourceSurface: String(sourceText || '').slice(range.start, range.end)
        };
    });
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
        merged.push({
            ...tokens[index],
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
        });
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
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', commonWordMatched: true, commonWordReading: bestMatch.reading, commonWordRomaji: bestMatch.romaji || null
        });
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
            if (!contextualPatternContainsRange(evidence.pattern, sourceText, candidateRange)) continue;
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
        merged.push({
            ...tokens[index],
            surface_form: bestMatch.surface,
            reading: bestMatch.reading || tokens[index].reading,
            pronunciation: bestMatch.reading || tokens[index].pronunciation,
            titleReadingEvidenceMatched: true,
            titleReadingEvidenceReading: bestMatch.reading || null,
            titleReadingEvidenceRomaji: bestMatch.romaji,
            titleReadingEvidenceKind: bestMatch.kind,
            titleReadingEvidenceSource: bestMatch.source,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        });
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
    return lookup.entry.readings.map(item => ({
        reading: item.reading,
        romaji: convertToRomaji(item.reading),
        weight: item.score,
        rank: Number.POSITIVE_INFINITY,
        categories: new Set(['lexical']),
        sources: new Set(['jitendex-general-word'])
    }));
}

function selectGeneralWordReading(lookup) {
    const readings = lookup?.entry?.readings || [];
    if (!readings.length) return null;
    if (readings.length === 1) return readings[0];
    return readings[0].score - readings[1].score >= 50 ? readings[0] : null;
}

/** @param {CJ2RToken} token */
function resolveGeneralWordFallback(token) {
    if (!token || isProperNounToken(token) || isParticle(token) || isPrefix(token) || isSuffix(token) || token.pos === '助動詞') return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const selected = selectGeneralWordReading(lookup);
    const candidates = getGeneralWordCandidates(lookup);
    const ambiguous = candidates.length > 1;
    // An ambiguous general-word entry still contains attested ranked readings.
    // Use the highest-ranked candidate only as provisional visible output while
    // retaining ambiguity metadata so diagnostics continue to require review.
    const provisional = selected || lookup.entry.readings[0] || null;
    return {
        reading: provisional?.reading || null,
        source: selected ? 'general-word-fallback' : 'general-word-ranked-ambiguous',
        confidence: selected ? (ambiguous ? 0.78 : 0.86) : 0.55,
        candidates,
        flags: [
            ...(provisional ? ['fallback-reading'] : []),
            ...(ambiguous ? ['general-word-ambiguous'] : []),
            ...(lookup.variant ? ['variant-reading-evidence'] : [])
        ],
        variantMappings: lookup.variant?.mappings || [],
        ambiguous
    };
}

function assessGeneralWordReading(token, currentReading) {
    if (!token || !currentReading) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    if (!lookup) return null;
    const normalized = normalizeKanaReading(currentReading);
    const matchedIndex = lookup.entry.readings.findIndex(item => normalizeKanaReading(item.reading) === normalized);
    const strongPreference = lookup.entry.readings.length > 1
        ? lookup.entry.readings[0].score - lookup.entry.readings[1].score >= 50
        : Boolean(lookup.entry.readings.length);
    return {
        matched: matchedIndex >= 0,
        matchedIndex,
        candidates: getGeneralWordCandidates(lookup),
        strongPreference,
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
    if (!lookup?.entry?.readings?.length || lookup.entry.mergeSafe || lookup.entry.readings.length < 2) return null;
    if (hasStrongerGeneralWordSegmentEvidence(segmentTokens, segmentSurface)) return null;
    const provisional = lookup.entry.readings[0];
    return {
        surface: segmentSurface,
        reading: provisional.reading,
        length: segmentTokens.length,
        candidates: getGeneralWordCandidates(lookup),
        ambiguous: true,
        variantMappings: lookup.variant?.mappings || [],
        exactGeneralWordSegmentFallback: true
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
        if (!lookup?.entry?.mergeSafe) continue;
        const selected = selectGeneralWordReading(lookup);
        // mergeSafe answers the span-boundary question independently from the
        // reading-ambiguity question. When several readings remain, preserve
        // them for review but use the bank's top-ranked attested reading as a
        // provisional output rather than discarding the whole lexical span.
        const provisional = selected || lookup.entry.readings[0] || null;
        if (!provisional) continue;
        bestMatch = {
            surface: candidateSurface,
            reading: provisional.reading,
            length: end - startIndex + 1,
            candidates: getGeneralWordCandidates(lookup),
            ambiguous: lookup.entry.readings.length > 1,
            variantMappings: lookup.variant?.mappings || []
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
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', generalWordMatched: true,
            generalWordReading: bestMatch.reading, generalWordCandidates: bestMatch.candidates,
            generalWordAmbiguous: bestMatch.ambiguous, generalWordVariantMappings: bestMatch.variantMappings,
            numericExpression,
            authoritativeSpanMatched: false, authoritativeSpanReading: null, authoritativeSpanRomaji: null,
            authoritativeSpanSource: null, authoritativeSpanCategory: null, authoritativeSpanVariantMappings: []
        });
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
        merged.push({
            ...tokens[index],
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
        });
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
    const remainder = Array.from(surface).slice(consumedCharacters).join('');
    if (!remainder) return [];
    // This is a post-tokenisation repair for an attested historical boundary.
    // Only the overshooting token fragment is retokenised; sentence context stays intact elsewhere.
    return runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [{ ...token, surface_form: remainder, reading: remainder, pronunciation: remainder }];
}

function mergeHistoricalKanaEvidenceTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestHistoricalKanaEvidence(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push({
            ...tokens[index],
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
        });
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
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading, atejiMatched: true, atejiReading: bestMatch.reading });
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
    return {
        ...tokens[startIndex],
        surface_form: bestMatch.surface,
        reading: combinedReading || bestMatch.surface,
        pronunciation: combinedReading || bestMatch.surface,
        suppressLoanwordSourceSpelling: true,
        countryLanguageReviewRequired: true
    };
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
    return segments.map((segment, index) => ({
        ...token,
        surface_form: segment.surface,
        reading: segment.surface,
        pronunciation: segment.surface,
        pos: '名詞',
        pos_detail_1: '一般',
        pos_detail_2: '*',
        loanwordMatched: true,
        loanwordOutput: segment.output,
        ...(index > 0 ? { reviewedLexicalBoundaryBefore: true, reviewedLexicalBoundarySource: 'reviewed-loanword-segmentation' } : {})
    }));
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
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, loanwordMatched: true, loanwordOutput: bestMatch.output });
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
    return {
        ...span[0],
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
    };
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
    return {
        ...token,
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        iterationMarkFallbackMatched: true,
        iterationMarkFallbackReading: reading
    };
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
                merged.push(makeIterationFallbackToken(token, surface + '々', reading + reading));
                index += 1;
                continue;
            }
        }

        if (!hasReviewedLexicalBoundaryBefore(next) && Object.prototype.hasOwnProperty.call(kanaIterationMarkVoicing, String(next?.surface_form || ''))) {
            const combinedSurface = surface + String(next.surface_form || '');
            const reading = expandKanaIterationReading(combinedSurface);
            if (reading) {
                merged.push(makeIterationFallbackToken(token, combinedSurface, reading));
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
        return [{
            ...token,
            surface_form: remainder,
            reading: honorificReading,
            pronunciation: honorificReading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading
        }];
    }
    return tokenizeHistoricalRemainder(token, consumedCharacters);
}

function mergeReviewedProperNameSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestReviewedProperNameSpan(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const personLike = bestMatch.category === 'person' || bestMatch.category === 'name';
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.reading, pronunciation: bestMatch.reading,
            pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: personLike ? '人名' : '地域', pos_detail_3: '*',
            reviewedProperNameSpanMatched: true, reviewedProperNameSpanRomaji: bestMatch.romaji,
            reviewedProperNameLookupSurface: bestMatch.lookupSurface,
            reviewedProperNameVariantMappings: normalizeKanjiForLookupDetailed(bestMatch.surface, { names: true }).mappings
        });
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

function tokenizeCanonicalVariantProperNoun(bestMatch) {
    if (!runtimeState.tokenizer || !bestMatch?.lookupSurface) return [];
    const canonicalTokens = runtimeState.tokenizer.tokenize(bestMatch.lookupSurface) || [];
    const reconstructed = canonicalTokens.map(token => String(token.surface_form || '')).join('');
    if (!canonicalTokens.length || reconstructed !== bestMatch.lookupSurface) return [];
    return canonicalTokens.map(token => ({
        ...token,
        variantCanonicalRetokenized: true,
        variantOriginalSurface: bestMatch.surface,
        variantLookupSurface: bestMatch.lookupSurface,
        variantMappings: bestMatch.variant.mappings
    }));
}

function mergeVariantProperNounTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestVariantProperNoun(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const canonicalTokens = tokenizeCanonicalVariantProperNoun(bestMatch);
        if (canonicalTokens.length) {
            merged.push(...canonicalTokens);
            index += bestMatch.length - 1;
            continue;
        }
        const details = inferVariantProperNounDetails(bestMatch.candidates);
        merged.push({
            ...tokens[index], surface_form: bestMatch.surface, reading: '*', pronunciation: '*', pos: '名詞', pos_detail_1: '固有名詞',
            pos_detail_2: details.pos_detail_2, pos_detail_3: details.pos_detail_3, variantProperNounMatched: true,
            variantLookupSurface: bestMatch.lookupSurface, variantMappings: bestMatch.variant.mappings
        });
        index += bestMatch.length - 1;
    }
    return merged;
}

