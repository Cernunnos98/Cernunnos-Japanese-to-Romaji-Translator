// Source section: Proper-name ranking, Kuromoji pronunciation safeguards and reading evidence.
function getProperNounCategoryHints(token) {
    const hints = new Set();
    const detail2 = String(token?.pos_detail_2 || '');
    const detail3 = String(token?.pos_detail_3 || '');
    if (detail2 === '地域') hints.add('loc');
    if (detail2 === '人名') { hints.add('per'); hints.add('person'); hints.add('char'); }
    if (detail3 === '姓') hints.add('fam');
    if (detail3 === '名') hints.add('per');
    return hints;
}

function rankProperNounCandidates(candidates) {
    const ranked = [...(candidates || [])].sort((left, right) => {
        const weightDifference = Number(right?.weight || 0) - Number(left?.weight || 0);
        if (weightDifference) return weightDifference;
        const sourceDifference = (right?.sources?.size || 0) - (left?.sources?.size || 0);
        if (sourceDifference) return sourceDifference;
        const leftRank = Number.isFinite(left?.rank) ? left.rank : Number.POSITIVE_INFINITY;
        const rightRank = Number.isFinite(right?.rank) ? right.rank : Number.POSITIVE_INFINITY;
        return leftRank - rightRank;
    });
    const top = ranked[0] || null;
    const second = ranked[1] || null;
    if (!top) return { selected: null, ranked, margin: 0, confidence: 0 };
    if (!second) return { selected: top, ranked, margin: 100, confidence: 0.96 };
    const topWeight = Number(top.weight || 0);
    const secondWeight = Number(second.weight || 0);
    const margin = topWeight - secondWeight;
    const sourceLead = (top.sources?.size || 0) - (second.sources?.size || 0);
    const topRank = Number.isFinite(top.rank) ? top.rank : Number.POSITIVE_INFINITY;
    const secondRank = Number.isFinite(second.rank) ? second.rank : Number.POSITIVE_INFINITY;
    const rankLead = Number.isFinite(topRank) && Number.isFinite(secondRank) && topRank > 0 ? secondRank / topRank : 1;
    const clearWeightLead = margin >= 15 && topWeight >= 60;
    const corroboratedLead = margin >= 8 && sourceLead > 0;
    const clearRankLead = margin > 0 && rankLead >= 3;
    const selected = clearWeightLead || corroboratedLead || clearRankLead ? top : null;
    const confidence = selected ? Math.min(0.93, 0.68 + Math.min(0.18, margin / 250) + Math.min(0.07, topWeight / 1000)) : 0.38;
    return { selected, ranked, margin, confidence };
}

/** @param {CJ2RToken} token */
function resolveProperNounReading(token) {
    if (!token || !isProperNounToken(token)) return null;
    const lookup = getProperNounCandidateLookup(token.surface_form);
    const candidates = lookup.candidates;
    if (!candidates.length) return null;
    const tokenVariantMappings = Array.isArray(token.variantMappings) ? token.variantMappings : [];
    const variant = lookup.variant || ((token.variantCanonicalRetokenized || token.variantProperNounMatched) && tokenVariantMappings.length
        ? { mappings: tokenVariantMappings }
        : null);
    const sourcePrefix = variant ? 'proper-noun-variant' : 'proper-noun';
    const variantFlags = variant ? ['variant-reading-evidence'] : [];
    const kuromojiReading = getKuromojiDictionaryReading(token);
    const normalizedKuromoji = normalizeKanaReading(kuromojiReading);
    const kuromojiMatch = normalizedKuromoji ? candidates.find(candidate => normalizeKanaReading(candidate.reading) === normalizedKuromoji) : null;
    if (kuromojiMatch) {
        const hints = getProperNounCategoryHints(token);
        const categoryMatches = candidates.filter(candidate => [...candidate.categories].some(category => hints.has(category)));
        const relevantCandidates = categoryMatches.length ? categoryMatches : candidates;
        const relevantReadings = new Set(relevantCandidates.map(candidate => normalizeKanaReading(candidate.reading)));
        const ranking = rankProperNounCandidates(relevantCandidates);
        const rankedMatch = ranking.selected
            && normalizeKanaReading(ranking.selected.reading) === normalizedKuromoji;
        const ambiguous = relevantReadings.size > 1 && (Boolean(variant) || !rankedMatch);
        return {
            reading: kuromojiMatch.reading, romaji: kuromojiMatch.romaji, source: `${sourcePrefix}+kuromoji`,
            confidence: ambiguous ? 0.78 : (variant ? 0.95 : 0.99), candidates,
            flags: [...variantFlags, ...(ambiguous ? ['proper-noun-ambiguous'] : [])],
            variantMappings: variant?.mappings || [], ambiguous
        };
    }
    if (candidates.length === 1) {
        return { reading: candidates[0].reading, romaji: candidates[0].romaji, source: sourcePrefix, confidence: variant ? 0.91 : 0.96, candidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const hints = getProperNounCategoryHints(token);
    const categoryMatches = candidates.filter(candidate => [...candidate.categories].some(category => hints.has(category)));
    const categoryReadings = new Map(categoryMatches.map(candidate => [normalizeKanaReading(candidate.reading), candidate]));
    if (categoryReadings.size === 1) {
        const candidate = [...categoryReadings.values()][0];
        return { reading: candidate.reading, romaji: candidate.romaji, source: `${sourcePrefix}-category`, confidence: variant ? 0.86 : 0.90, candidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const ranking = rankProperNounCandidates(categoryMatches.length ? categoryMatches : candidates);
    if (ranking.selected) {
        return { reading: ranking.selected.reading, romaji: ranking.selected.romaji, source: `${sourcePrefix}-ranked`, confidence: Math.max(0.55, ranking.confidence - (variant ? 0.04 : 0)), candidates, flags: [...variantFlags, 'proper-noun-ambiguous'], variantMappings: variant?.mappings || [], ambiguous: true };
    }
    return { reading: null, romaji: null, source: `${sourcePrefix}-ambiguous`, confidence: variant ? 0.30 : 0.35, candidates, flags: [...variantFlags, 'proper-noun-ambiguous', 'unresolved-reading'], variantMappings: variant?.mappings || [], ambiguous: true };
}

function getSafeOrthographicPronunciation(readingValue, pronunciationValue) {
    const reading = normalizeKanaReading(readingValue || '');
    const pronunciation = normalizeKanaReading(pronunciationValue || '');
    if (!reading || !pronunciation || reading === pronunciation) return null;

    const allowedChanges = { 'は': 'わ', 'へ': 'え', 'を': 'お' };
    const readingKana = Array.from(reading);
    const pronunciationKana = Array.from(pronunciation);
    if (readingKana.length !== pronunciationKana.length) return null;

    let changed = false;
    for (let index = 0; index < readingKana.length; index += 1) {
        if (readingKana[index] === pronunciationKana[index]) continue;
        if (allowedChanges[readingKana[index]] !== pronunciationKana[index]) return null;
        changed = true;
    }
    return changed ? pronunciation : null;
}

function getKanaOrthographicPronunciation(token) {
    const surface = normalizeKanaReading(token?.surface_form || '');
    const reading = normalizeKanaReading(token?.reading || '');
    if (!surface || surface !== reading) return null;
    return getSafeOrthographicPronunciation(reading, token?.pronunciation);
}

function getMixedScriptOrthographicPronunciation(token) {
    if (!token || isProperNounToken(token) || /^[ぁ-ゖァ-ンヴー]+$/.test(String(token.surface_form || ''))) return null;
    if (!['接続詞', '副詞'].includes(String(token.pos || ''))) return null;
    const reading = normalizeKanaReading(token.reading || '');
    const pronunciation = normalizeKanaReading(token.pronunciation || '');
    if (!reading || !pronunciation || reading.length !== pronunciation.length) return null;
    let changed = false;
    for (let index = 0; index < reading.length; index += 1) {
        if (reading[index] === pronunciation[index]) continue;
        if (reading[index] !== 'は' || pronunciation[index] !== 'わ') return null;
        changed = true;
    }
    return changed ? pronunciation : null;
}

function parseKuromojiDictionaryFeatures(featureText) {
    const fields = String(featureText || '').split(',');
    if (fields.length < 10) return null;
    return {
        surface_form: fields[0], pos: fields[1], pos_detail_1: fields[2], pos_detail_2: fields[3], pos_detail_3: fields[4],
        conjugated_type: fields[5], conjugated_form: fields[6], basic_form: fields[7], reading: fields[8], pronunciation: fields[9]
    };
}

function getKuromojiExactDictionaryCandidates(surface) {
    const value = String(surface || '');
    const trie = runtimeState.tokenizer?.viterbi_builder?.trie;
    const dictionary = runtimeState.tokenizer?.token_info_dictionary;
    if (!value || !trie || !dictionary) return [];
    const trieId = trie.lookup(value);
    if (!Number.isInteger(trieId) || trieId < 0) return [];
    const tokenIds = dictionary.target_map?.[trieId] || [];
    return tokenIds
        .map(tokenId => parseKuromojiDictionaryFeatures(dictionary.getFeatures(tokenId)))
        .filter(candidate => candidate && candidate.surface_form === value);
}

function assessKuromojiWholeWordAmbiguity(token, currentReading) {
    if (!token || !containsHan(token.surface_form) || isProperNounToken(token)) return null;
    const candidates = getKuromojiExactDictionaryCandidates(token.surface_form)
        .filter(candidate => candidate.pos === token.pos && candidate.pos_detail_1 !== '固有名詞')
        .map(candidate => normalizeKanaReading(candidate.reading))
        .filter(Boolean);
    const uniqueReadings = [...new Set(candidates)];
    if (uniqueReadings.length < 2) return null;
    const normalizedCurrent = normalizeKanaReading(currentReading);
    return {
        readings: uniqueReadings,
        candidates: uniqueReadings.map(reading => ({
            reading,
            romaji: convertToRomaji(reading),
            weight: normalizeKanaReading(reading) === normalizedCurrent ? 100 : 0,
            rank: Number.POSITIVE_INFINITY,
            categories: new Set(['lexical']),
            sources: new Set(['kuromoji-exact-dictionary'])
        }))
    };
}

function selectExactDictionaryRescue(tokens, startIndex, endIndex, sourceText, candidateSurface) {
    const candidates = getKuromojiExactDictionaryCandidates(candidateSurface);
    if (!candidates.length) return null;
    const span = tokens.slice(startIndex, endIndex + 1);

    // Closed-class lexical entries may be restored when context caused Kuromoji
    // to split an exact kana word into multiple non-particle tokens.
    const lexicalCandidates = candidates.filter(candidate =>
        candidate.pos === '連体詞'
        && /^[ぁ-ゖァ-ンヴー]+$/u.test(candidate.surface_form)
        && normalizeKanaReading(candidate.surface_form) === normalizeKanaReading(candidate.reading)
    );
    const lexicalReadings = new Set(lexicalCandidates.map(candidate => normalizeKanaReading(candidate.reading)));
    if (lexicalCandidates.length && lexicalReadings.size === 1 && !span.some(isParticle)) {
        return { ...lexicalCandidates[0], source: 'kuromoji-exact-lexical', confidence: 0.99 };
    }

    // Historical kana in proper names can make Viterbi prefer a fake へ/を
    // particle split. Rescue only an isolated exact-name input; sentence context
    // such as みつを食べる must keep the genuine particle interpretation.
    const hasSuspiciousParticle = span.some(token => isParticle(token) && ['へ', 'を'].includes(String(token.surface_form || '')));
    if (!hasSuspiciousParticle || isParticle(span[0])) return null;
    const { coreText } = splitTrailingPunctuation(String(sourceText || ''));
    if (coreText.trim() !== candidateSurface) return null;
    const properCandidates = candidates.filter(candidate =>
        candidate.pos === '名詞'
        && candidate.pos_detail_1 === '固有名詞'
        && getSafeOrthographicPronunciation(candidate.reading, candidate.pronunciation)
    );
    const properPronunciations = new Set(properCandidates.map(candidate => normalizeKanaReading(candidate.pronunciation)));
    if (!properCandidates.length || properPronunciations.size !== 1) return null;
    return { ...properCandidates[0], source: 'kuromoji-exact-proper-name', confidence: 0.93 };
}

function getKuromojiExactDictionaryPrefixMatches(tokens, startIndex) {
    const trie = runtimeState.tokenizer?.viterbi_builder?.trie;
    if (!trie || typeof trie.commonPrefixSearch !== 'function') return [];
    let remainingSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        remainingSurface += String(token.surface_form || '');
    }
    return trie.commonPrefixSearch(remainingSurface).map(match => String(match?.k || '')).filter(Boolean);
}

function findLongestExactDictionaryRescue(tokens, startIndex, sourceText) {
    let candidateSurface = '';
    let bestMatch = null;
    const dictionaryMatches = getKuromojiExactDictionaryPrefixMatches(tokens, startIndex);
    if (!dictionaryMatches.length) return null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += String(token.surface_form || '');
        const stillPossible = dictionaryMatches.some(surface => surface.startsWith(candidateSurface));
        if (!stillPossible) break;
        if (end === startIndex) continue;
        const rescue = selectExactDictionaryRescue(tokens, startIndex, end, sourceText, candidateSurface);
        if (rescue) bestMatch = { ...rescue, surface: candidateSurface, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeExactDictionaryRescueTokens(tokens, sourceText) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestExactDictionaryRescue(tokens, index, sourceText);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push({
            ...tokens[index],
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.pronunciation,
            pos: bestMatch.pos,
            pos_detail_1: bestMatch.pos_detail_1,
            pos_detail_2: bestMatch.pos_detail_2,
            pos_detail_3: bestMatch.pos_detail_3,
            exactDictionaryRescueMatched: true,
            exactDictionaryRescueSource: bestMatch.source,
            exactDictionaryRescueConfidence: bestMatch.confidence
        });
        index += bestMatch.length - 1;
    }
    return merged;
}


function getContextTokenTerms(token) {
    const terms = new Set();
    const surface = String(token?.surface_form || '').trim();
    const basic = tokenBasicForm(token);
    if (surface) terms.add(surface);
    if (basic) terms.add(basic);
    return terms;
}

function scoreContextFeatureGroup(tokens, targetIndex, groupId, windowSize) {
    const terms = runtimeState.contextFeatureGroups.get(groupId) || [];
    if (!terms.length) return 0;
    const start = Math.max(0, targetIndex - windowSize);
    const end = Math.min(tokens.length - 1, targetIndex + windowSize);
    const matchedTerms = new Set();
    let score = 0;
    for (let index = start; index <= end; index += 1) {
        if (index === targetIndex) continue;
        const tokenTerms = getContextTokenTerms(tokens[index]);
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !tokenTerms.has(evidence.term)) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    return score;
}

function getContextualReadingEvidenceForToken(token) {
    const surface = String(token?.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    return runtimeState.contextualReadingDictionary.get(surface)
        || (normalized !== surface ? runtimeState.contextualReadingDictionary.get(normalized) : null)
        || null;
}

function getContextSourceWindow(tokens, targetIndex, windowSize, sourceText) {
    if (!sourceText) return '';
    const startIndex = Math.max(0, targetIndex - windowSize);
    const endIndex = Math.min(tokens.length - 1, targetIndex + windowSize);
    const startToken = tokens[startIndex];
    const endToken = tokens[endIndex];
    const startPosition = Number(startToken?.word_position || 0);
    const endPosition = Number(endToken?.word_position || 0);
    if (startPosition > 0 && endPosition > 0) {
        const start = Math.max(0, startPosition - 1);
        const end = Math.min(sourceText.length, endPosition - 1 + String(endToken?.surface_form || '').length);
        if (end > start) return sourceText.slice(start, end);
    }
    return sourceText;
}

function scoreFinalContextFeatureGroup(tokens, targetIndex, groupId, windowSize, sourceText) {
    const terms = runtimeState.contextFeatureGroups.get(groupId) || [];
    if (!terms.length) return 0;
    const start = Math.max(0, targetIndex - windowSize);
    const end = Math.min(tokens.length - 1, targetIndex + windowSize);
    const matchedTerms = new Set();
    let score = 0;
    for (let index = start; index <= end; index += 1) {
        if (index === targetIndex) continue;
        const tokenTerms = getContextTokenTerms(tokens[index]);
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !tokenTerms.has(evidence.term)) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    const sourceWindow = getContextSourceWindow(tokens, targetIndex, windowSize, sourceText);
    const targetSurface = String(tokens[targetIndex]?.surface_form || '');
    for (const evidence of terms) {
        if (matchedTerms.has(evidence.term) || evidence.term === targetSurface || !sourceWindow.includes(evidence.term)) continue;
        matchedTerms.add(evidence.term);
        score += Number(evidence.weight || 0);
    }
    return score;
}

function evaluateContextualReadingEvidence(tokens, targetIndex, evidence, options = {}) {
    if (!evidence) return { candidates: [], selected: null, margin: 0 };
    const finalPass = Boolean(options.finalPass);
    const sourceText = finalPass ? String(options.sourceText || '') : '';
    const candidates = evidence.candidates.map(candidate => {
        const score = candidate.features.reduce((total, feature) => total + (finalPass
            ? scoreFinalContextFeatureGroup(tokens, targetIndex, feature, evidence.window, sourceText)
            : scoreContextFeatureGroup(tokens, targetIndex, feature, evidence.window)), 0);
        return {
            reading: candidate.reading,
            romaji: convertToRomaji(candidate.reading),
            weight: score,
            rank: Number.POSITIVE_INFINITY,
            categories: new Set([finalPass ? 'sentence-context-verification' : 'contextual-reading']),
            sources: new Set([evidence.source]),
            minScore: candidate.minScore
        };
    }).sort((left, right) => right.weight - left.weight);
    const top = candidates[0] || null;
    const second = candidates[1] || null;
    const margin = top ? top.weight - Number(second?.weight || 0) : 0;
    const selected = top && top.weight >= Number(top.minScore || 0) && margin >= evidence.minMargin ? top : null;
    return { candidates, selected, margin };
}

function annotateContextualReadingEvidence(tokens) {
    return (tokens || []).map((token, index) => {
        const evidence = getContextualReadingEvidenceForToken(token);
        if (!evidence) return token;
        const evaluation = evaluateContextualReadingEvidence(tokens, index, evidence);
        const { candidates, selected, margin } = evaluation;
        return {
            ...token,
            contextualReadingEvidenceCandidates: candidates,
            contextualReadingEvidenceAmbiguous: !selected,
            ...(selected ? {
                contextualReadingEvidenceMatched: true,
                contextualReadingEvidenceReading: selected.reading,
                contextualReadingEvidenceRomaji: selected.romaji,
                contextualReadingEvidenceSource: evidence.source,
                contextualReadingEvidenceScore: selected.weight,
                contextualReadingEvidenceMargin: margin
            } : {})
        };
    });
}

function getCommonWordRuleForToken(token, sourceText) {
    if (!token) return null;
    const contextual = selectCommonWordRule(token.surface_form, sourceText, false);
    if (contextual) return contextual;
    if (isProperNounToken(token)) return null;
    return selectCommonWordRule(token.surface_form, sourceText, true) || null;
}

function getCommonWordReadingForToken(token, sourceText) {
    return getCommonWordRuleForToken(token, sourceText)?.reading || null;
}

function getLoanwordOutputForToken(token) {
    if (!token) return null;
    const surface = String(token.surface_form || '');
    return runtimeState.loanwordDictionary.get(surface) || runtimeState.loanwordDictionary.get(normalizeKanjiForLookup(surface)) || null;
}

function getCompoundReadingForToken(token) {
    if (!token || isProperNounToken(token)) return null;
    const surface = String(token.surface_form || '');
    const exact = runtimeState.compoundWordDictionary.get(surface)?.reading;
    if (exact) return exact;
    const normalized = normalizeKanjiForLookup(surface);
    return normalized !== surface ? runtimeState.compoundWordDictionary.get(normalized)?.reading || null : null;
}


function getReviewedReadingPreference(token) {
    if (!token) return null;
    const surface = String(token.surface_form || '');
    return runtimeState.reviewedReadingPreferenceDictionary.get(surface) || null;
}

function getReviewedReadingCandidates(token) {
    const evidence = getReviewedReadingPreference(token);
    if (!evidence) return [];
    const rows = [evidence.reading, ...(evidence.alternatives || [])];
    const seen = new Set();
    return rows.filter(reading => reading && !seen.has(normalizeKanaReading(reading)) && seen.add(normalizeKanaReading(reading))).map((reading, index) => ({
        reading,
        romaji: convertToRomaji(reading),
        weight: index === 0 ? 100 : Math.max(1, 80 - index),
        rank: index + 1,
        categories: new Set(['reviewed-reading']),
        sources: new Set(['reviewed-reading-evidence'])
    }));
}

function reviewedReadingMatches(reading, evidence) {
    const normalized = normalizeKanaReading(reading || '');
    if (!normalized || !evidence) return false;
    return [evidence.reading, ...(evidence.alternatives || [])]
        .some(candidate => normalizeKanaReading(candidate) === normalized);
}

function getReadingEvidenceCandidates(token) {
    if (!token) return [];
    const surface = String(token.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    const evidence = runtimeState.readingEvidenceDictionary.get(surface) || (normalized !== surface ? runtimeState.readingEvidenceDictionary.get(normalized) : null);
    if (!evidence) return [];
    const rows = [{ reading: evidence.preferredReading, priority: evidence.preferredPriority, rank: evidence.preferredRank }, ...evidence.alternatives];
    const seen = new Set();
    return rows.filter(row => row.reading && !seen.has(normalizeKanaReading(row.reading)) && seen.add(normalizeKanaReading(row.reading))).map(row => ({
        reading: row.reading,
        romaji: convertToRomaji(row.reading),
        weight: row.priority,
        rank: row.rank || Number.POSITIVE_INFINITY,
        categories: new Set(['reading-evidence']),
        sources: new Set(['reading-evidence'])
    }));
}

/** @param {CJ2RToken} token */
function getReadingEvidenceAssessment(token, currentReading) {
    if (!token || !currentReading || isProperNounToken(token)) return null;
    const surface = String(token.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    const evidence = runtimeState.readingEvidenceDictionary.get(surface) || (normalized !== surface ? runtimeState.readingEvidenceDictionary.get(normalized) : null);
    if (!evidence) return null;
    const normalizedCurrent = normalizeKanaReading(currentReading);
    const matchedAlternative = evidence.alternatives.find(item => normalizeKanaReading(item.reading) === normalizedCurrent);
    if (!matchedAlternative || matchedAlternative.priority > 0) return null;
    const preferredRank = Math.max(1, evidence.preferredRank || 0);
    const rankRatio = matchedAlternative.rank / preferredRank;
    if (evidence.preferredPriority < 200 || rankRatio < 50) return null;
    return { preferredReading: evidence.preferredReading, currentReading: matchedAlternative.reading, rankRatio };
}

function getReadingEvidenceFallback(token) {
    if (!token || isProperNounToken(token)) return null;
    const surface = String(token.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    const evidence = runtimeState.readingEvidenceDictionary.get(surface) || (normalized !== surface ? runtimeState.readingEvidenceDictionary.get(normalized) : null);
    if (!evidence || evidence.preferredPriority < 200 || !evidence.preferredReading) return null;
    const candidates = getReadingEvidenceCandidates(token);
    return {
        reading: evidence.preferredReading,
        candidates,
        ambiguous: candidates.length > 1
    };
}

