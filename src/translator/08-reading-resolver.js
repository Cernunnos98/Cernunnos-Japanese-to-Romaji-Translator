// Source section: Proper-name ranking, Kuromoji pronunciation safeguards and reading evidence.
function getProperNounCategoryHints(token) {
    const hints = new Set();
    if (token?.locationSuffixRoleMatched) {
        hints.add('loc');
        return hints;
    }
    if (token?.nameHonorificRoleMatched) {
        hints.add('fam');
        hints.add('per');
        hints.add('person');
        hints.add('char');
        return hints;
    }
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
function assessOrdinaryNounProperNameConflict(token, selectedReading) {
    if (!token || token.pos !== '名詞' || token.pos_detail_1 !== '一般' || isProperNounToken(token) || token.nameHonorificRoleMatched || token.locationSuffixRoleMatched) return null;
    const normalizedSelected = normalizeKanaReading(selectedReading || '');
    if (!normalizedSelected) return null;
    const sourceOrthographyCandidates = Array.isArray(token.sourceOrthographyProperNounCandidates)
        ? token.sourceOrthographyProperNounCandidates
        : [];
    const lookup = getProperNounCandidateLookup(token.surface_form);
    const candidates = sourceOrthographyCandidates.length ? sourceOrthographyCandidates : (lookup.candidates || []);
    const distinctReadings = new Set(candidates.map(candidate => normalizeKanaReading(candidate?.reading || '')).filter(Boolean));
    if (distinctReadings.size !== 1) return null;
    const incompatibleCandidates = candidates.filter(candidate => normalizeKanaReading(candidate?.reading || '') !== normalizedSelected);
    if (!incompatibleCandidates.length) return null;
    return {
        candidates,
        incompatibleCandidates,
        variantMappings: lookup.variant?.mappings || []
    };
}

function resolveProperNounReading(token) {
    if (!token || (!isProperNounToken(token) && !token.nameHonorificRoleMatched && !token.locationSuffixRoleMatched)) return null;
    const sourceOrthographyCandidates = Array.isArray(token.sourceOrthographyProperNounCandidates)
        ? token.sourceOrthographyProperNounCandidates
        : [];
    const lookup = getProperNounCandidateLookup(token.nameHonorificCandidateSurface || token.locationSuffixCandidateSurface || token.surface_form);
    const candidates = sourceOrthographyCandidates.length ? sourceOrthographyCandidates : lookup.candidates;
    if (!candidates.length) return null;
    const tokenVariantMappings = Array.isArray(token.variantMappings) ? token.variantMappings : [];
    const variant = lookup.variant || ((token.variantCanonicalRetokenized || token.variantProperNounMatched) && tokenVariantMappings.length
        ? { mappings: tokenVariantMappings }
        : null);
    const sourceOrthographyExact = sourceOrthographyCandidates.length > 0;
    const sourcePrefix = sourceOrthographyExact ? 'proper-noun-source-orthography' : (variant ? 'proper-noun-variant' : 'proper-noun');
    const canonicalLexicalReviewFlags = token.sourceOrthographyCanonicalLexicalReviewRequired
        ? ['whole-word-reading-ambiguous']
        : [];
    const variantFlags = sourceOrthographyExact
        ? canonicalLexicalReviewFlags
        : (variant ? ['variant-reading-evidence'] : []);
    const hints = getProperNounCategoryHints(token);
    const categoryMatches = candidates.filter(candidate => [...candidate.categories].some(category => hints.has(category)));
    const contextualRoleMatched = Boolean(token.nameHonorificRoleMatched || token.locationSuffixRoleMatched);
    const roleCandidates = contextualRoleMatched && categoryMatches.length ? categoryMatches : candidates;
    const resolutionCandidates = contextualRoleMatched ? roleCandidates : candidates;
    const kuromojiReading = getKuromojiDictionaryReading(token);
    const normalizedKuromoji = normalizeKanaReading(kuromojiReading);
    const kuromojiMatch = normalizedKuromoji ? roleCandidates.find(candidate => normalizeKanaReading(candidate.reading) === normalizedKuromoji) : null;
    if (kuromojiMatch) {
        const relevantCandidates = categoryMatches.length ? categoryMatches : candidates;
        const relevantReadings = new Set(relevantCandidates.map(candidate => normalizeKanaReading(candidate.reading)));
        const ambiguous = relevantReadings.size > 1;
        return {
            reading: kuromojiMatch.reading, romaji: kuromojiMatch.romaji, source: `${sourcePrefix}+kuromoji`,
            confidence: ambiguous ? 0.78 : (variant ? 0.95 : 0.99), candidates: resolutionCandidates,
            flags: [...variantFlags, ...(ambiguous ? ['proper-noun-ambiguous'] : [])],
            variantMappings: variant?.mappings || [], ambiguous
        };
    }
    if (roleCandidates.length === 1) {
        const roleSource = token.nameHonorificRoleMatched ? `${sourcePrefix}-honorific-role`
            : (token.locationSuffixRoleMatched ? `${sourcePrefix}-location-suffix-role` : sourcePrefix);
        return { reading: roleCandidates[0].reading, romaji: roleCandidates[0].romaji, source: roleSource, confidence: variant ? 0.91 : 0.96, candidates: resolutionCandidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const categoryReadings = new Map(categoryMatches.map(candidate => [normalizeKanaReading(candidate.reading), candidate]));
    if (categoryReadings.size === 1) {
        const candidate = [...categoryReadings.values()][0];
        return { reading: candidate.reading, romaji: candidate.romaji, source: `${sourcePrefix}-category`, confidence: variant ? 0.86 : 0.90, candidates: resolutionCandidates, flags: variantFlags, variantMappings: variant?.mappings || [], ambiguous: false };
    }
    const ranking = rankProperNounCandidates(contextualRoleMatched ? roleCandidates : (categoryMatches.length ? categoryMatches : candidates));
    if (ranking.selected) {
        return { reading: ranking.selected.reading, romaji: ranking.selected.romaji, source: `${sourcePrefix}-ranked`, confidence: Math.max(0.55, ranking.confidence - (variant ? 0.04 : 0)), candidates: resolutionCandidates, flags: [...variantFlags, 'proper-noun-ambiguous'], variantMappings: variant?.mappings || [], ambiguous: true };
    }
    return { reading: null, romaji: null, source: `${sourcePrefix}-ambiguous`, confidence: variant ? 0.30 : 0.35, candidates: resolutionCandidates, flags: [...variantFlags, 'proper-noun-ambiguous', 'unresolved-reading'], variantMappings: variant?.mappings || [], ambiguous: true };
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
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
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
        }, {
            annotations: ['exactDictionaryRescueMatched', 'exactDictionaryRescueSource', 'exactDictionaryRescueConfidence'],
            evidenceSource: bestMatch.source || 'kuromoji-exact-dictionary',
            semanticRole: 'exact-dictionary-reading',
            confidence: bestMatch.confidence
        }));
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

function isContextEvidenceHardBoundaryToken(token) {
    const surface = String(token?.surface_form || '');
    if (!surface) return false;
    for (let index = 0; index < surface.length; index += 1) {
        const character = surface[index];
        if (isCanonicalTransparentBoundaryCharacter(character) && !canonicalHardWhitespaceCharacters.has(character)) continue;
        if (isCanonicalHardBoundaryAt(surface, index)) return true;
    }
    return false;
}

const contextEvidenceClauseBoundarySurfaces = new Set([
    'が', 'けど', 'けれど', 'けれども', 'ので', 'なので', 'のに', 'なのに',
    'ものの', 'ものを', 'ものから', 'し', 'から', 'ても', 'でも', 'ば', 'たら'
]);

function isContextEvidenceClauseBoundaryToken(tokens, index) {
    const token = tokens[index];
    if (isContextEvidenceHardBoundaryToken(token)) return true;
    const pos = String(token?.pos || '');
    if (pos === '接続詞') return true;
    if (pos === '助詞'
        && String(token?.pos_detail_1 || '') === '接続助詞'
        && contextEvidenceClauseBoundarySurfaces.has(String(token?.surface_form || ''))) return true;
    const nextSurface = String(tokens[index + 1]?.surface_form || '');
    return pos === '名詞'
        && String(token?.pos_detail_1 || '') === '非自立'
        && String(token?.pos_detail_2 || '') === '副詞可能'
        && (nextSurface === 'で' || nextSurface === 'では')
        && index > 0
        && ['動詞', '形容詞', '助動詞'].includes(String(tokens[index - 1]?.pos || ''));
}

function getContextEvidenceTokenIndexes(tokens, targetIndex, windowSize) {
    const indexes = [];
    for (const direction of [-1, 1]) {
        for (let distance = 1; distance <= windowSize; distance += 1) {
            const index = targetIndex + (direction * distance);
            if (index < 0 || index >= tokens.length) break;
            if (isContextEvidenceClauseBoundaryToken(tokens, index)) break;
            indexes.push(index);
        }
    }
    return indexes;
}

function scoreWeightedContextTerms(tokens, targetIndex, terms, windowSize, sourceText = '') {
    if (!Array.isArray(terms) || !terms.length) return 0;
    const matchedTerms = new Set();
    let score = 0;
    for (const index of getContextEvidenceTokenIndexes(tokens, targetIndex, windowSize)) {
        const tokenTerms = getContextTokenTerms(tokens[index]);
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !tokenTerms.has(evidence.term)) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    if (!sourceText) return score;
    const sourceWindow = getContextSourceWindow(tokens, targetIndex, windowSize, sourceText);
    const targetSurface = String(tokens[targetIndex]?.surface_form || '');
    for (const evidence of terms) {
        if (matchedTerms.has(evidence.term) || evidence.term === targetSurface || !sourceWindow.includes(evidence.term)) continue;
        matchedTerms.add(evidence.term);
        score += Number(evidence.weight || 0);
    }
    return score;
}

const LOANWORD_CONTEXT_NOMINAL_CONNECTORS = new Set(['の', 'な']);
const LOANWORD_CONTEXT_TOPIC_PARTICLES = new Set(['は', 'が']);

function isLoanwordContextCopulaToken(token) {
    const surface = String(token?.surface_form || '');
    const basic = String(tokenBasicForm(token) || '');
    return surface === 'だ' || surface === 'です' || basic === 'だ' || basic === 'です';
}

function isLoanwordContextLexicalToken(token) {
    const pos = String(token?.pos || '');
    return Boolean(String(token?.surface_form || '')) && !['助詞', '助動詞', '記号'].includes(pos);
}

function isLoanwordContextPredicateToken(tokens, index) {
    const token = tokens[index];
    const pos = String(token?.pos || '');
    if (pos === '動詞' || pos === '形容詞') return true;
    if (pos !== '名詞' || String(token?.pos_detail_1 || '') !== 'サ変接続') return false;
    const next = tokens[index + 1];
    if (!next || isContextEvidenceHardBoundaryToken(next)) return true;
    const nextSurface = String(next.surface_form || '');
    const nextBasic = String(tokenBasicForm(next) || nextSurface);
    return nextBasic === 'する' || nextSurface === 'だ' || nextSurface === 'です';
}

function getLoanwordContextEvidenceTokenIndexes(tokens, targetIndex, windowSize) {
    const indexes = new Set();
    const minimum = Math.max(0, targetIndex - windowSize);
    const maximum = Math.min(tokens.length - 1, targetIndex + windowSize);
    const previous = tokens[targetIndex - 1];
    const next = tokens[targetIndex + 1];

    const addNominalSegment = (start, direction) => {
        for (let index = start; index >= minimum && index <= maximum; index += direction) {
            const token = tokens[index];
            if (!token || isContextEvidenceHardBoundaryToken(token)) break;
            const surface = String(token.surface_form || '');
            if (String(token.pos || '') === '助詞' && !LOANWORD_CONTEXT_NOMINAL_CONNECTORS.has(surface)) break;
            if (isLoanwordContextLexicalToken(token)) indexes.add(index);
        }
    };

    const addCopularTopicRelation = () => {
        const following = tokens[targetIndex + 1];
        if (following && LOANWORD_CONTEXT_TOPIC_PARTICLES.has(String(following.surface_form || ''))) {
            const complement = [];
            for (let index = targetIndex + 2; index <= maximum; index += 1) {
                const token = tokens[index];
                if (!token || isContextEvidenceHardBoundaryToken(token)) break;
                if (isLoanwordContextCopulaToken(token)) {
                    if (complement.length) complement.forEach(item => indexes.add(item));
                    break;
                }
                if (!isLoanwordContextLexicalToken(token)) break;
                complement.push(index);
            }
        }

        const preceding = tokens[targetIndex - 1];
        const afterTarget = tokens[targetIndex + 1];
        if (preceding && LOANWORD_CONTEXT_TOPIC_PARTICLES.has(String(preceding.surface_form || ''))
            && afterTarget && isLoanwordContextCopulaToken(afterTarget)) {
            const topic = [];
            for (let index = targetIndex - 2; index >= minimum; index -= 1) {
                const token = tokens[index];
                if (!token || isContextEvidenceHardBoundaryToken(token) || !isLoanwordContextLexicalToken(token)) break;
                topic.push(index);
            }
            topic.forEach(item => indexes.add(item));
        }
    };

    if (previous && !isContextEvidenceHardBoundaryToken(previous)) {
        const surface = String(previous.surface_form || '');
        if (LOANWORD_CONTEXT_NOMINAL_CONNECTORS.has(surface)) addNominalSegment(targetIndex - 2, -1);
        else if (isLoanwordContextLexicalToken(previous)) indexes.add(targetIndex - 1);
    }

    if (next && !isContextEvidenceHardBoundaryToken(next)) {
        const surface = String(next.surface_form || '');
        if (LOANWORD_CONTEXT_NOMINAL_CONNECTORS.has(surface)) {
            addNominalSegment(targetIndex + 2, 1);
        } else if (isLoanwordContextLexicalToken(next)) {
            indexes.add(targetIndex + 1);
        } else if (String(next.pos || '') === '助詞') {
            for (let index = targetIndex + 2; index <= maximum; index += 1) {
                const token = tokens[index];
                if (!token || isContextEvidenceHardBoundaryToken(token)) break;
                if (!isLoanwordContextPredicateToken(tokens, index)) continue;
                indexes.add(index);
                const previousToken = tokens[index - 1];
                if (String(tokenBasicForm(token) || '') === 'する'
                    && previousToken
                    && String(previousToken.pos_detail_1 || '') === 'サ変接続') indexes.add(index - 1);
                break;
            }
        }
    }
    addCopularTopicRelation();
    return [...indexes];
}

function loanwordContextTermMatchesToken(term, token) {
    const evidenceTerm = String(term || '');
    if (!evidenceTerm) return false;
    const tokenTerms = getContextTokenTerms(token);
    if (tokenTerms.has(evidenceTerm)) return true;
    if (!/[一-龯々〆ヵヶ]/u.test(evidenceTerm)) return false;
    return [...tokenTerms].some(tokenTerm => tokenTerm.startsWith(evidenceTerm));
}

function loanwordContextTermMatchesTokenSequence(term, tokens, indexes) {
    const evidenceTerm = String(term || '');
    if (!evidenceTerm || !Array.isArray(indexes) || indexes.length < 2) return false;
    const selected = new Set(indexes);
    const ordered = [...selected].sort((left, right) => left - right);
    for (let startOffset = 0; startOffset < ordered.length; startOffset += 1) {
        let surface = '';
        let basic = '';
        let previousIndex = null;
        for (let offset = startOffset; offset < ordered.length; offset += 1) {
            const index = ordered[offset];
            if (previousIndex !== null && index !== previousIndex + 1) break;
            const token = tokens[index];
            if (!token || !isLoanwordContextLexicalToken(token)) break;
            surface += String(token.surface_form || '');
            basic += String(tokenBasicForm(token) || token.surface_form || '');
            if (surface === evidenceTerm || basic === evidenceTerm) return true;
            if (surface.length > evidenceTerm.length && basic.length > evidenceTerm.length) break;
            previousIndex = index;
        }
    }
    return false;
}

function scoreWeightedLoanwordContextTerms(tokens, targetIndex, terms, windowSize, sourceText = '') {
    if (!Array.isArray(terms) || !terms.length) return 0;
    const matchedTerms = new Set();
    let score = 0;
    const contextIndexes = getLoanwordContextEvidenceTokenIndexes(tokens, targetIndex, windowSize);
    for (const index of contextIndexes) {
        for (const evidence of terms) {
            if (matchedTerms.has(evidence.term) || !loanwordContextTermMatchesToken(evidence.term, tokens[index])) continue;
            matchedTerms.add(evidence.term);
            score += Number(evidence.weight || 0);
        }
    }
    for (const evidence of terms) {
        if (matchedTerms.has(evidence.term) || !loanwordContextTermMatchesTokenSequence(evidence.term, tokens, contextIndexes)) continue;
        matchedTerms.add(evidence.term);
        score += Number(evidence.weight || 0);
    }
    if (!sourceText) return score;
    const sourceWindow = getContextSourceWindow(tokens, targetIndex, windowSize, sourceText);
    const targetSurface = String(tokens[targetIndex]?.surface_form || '');
    for (const evidence of terms) {
        const term = String(evidence.term || '');
        if (matchedTerms.has(term) || !targetSurface || term === targetSurface || !term.includes(targetSurface)) continue;
        if (!sourceWindow.includes(term)) continue;
        matchedTerms.add(term);
        score += Number(evidence.weight || 0);
    }
    return score;
}

function scoreContextFeatureGroup(tokens, targetIndex, groupId, windowSize) {
    return scoreWeightedContextTerms(tokens, targetIndex, runtimeState.contextFeatureGroups.get(groupId) || [], windowSize);
}

function getContextualReadingEvidenceForToken(token) {
    const surface = String(token?.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    return runtimeState.contextualReadingDictionary.get(surface)
        || (normalized !== surface ? runtimeState.contextualReadingDictionary.get(normalized) : null)
        || null;
}

function getLoanwordMetadataForToken(token) {
    const surface = String(token?.surface_form || '');
    const normalized = normalizeKanjiForLookup(surface);
    return runtimeState.loanwordMetadataDictionary.get(surface)
        || (normalized !== surface ? runtimeState.loanwordMetadataDictionary.get(normalized) : null)
        || null;
}

function getContextSourceWindow(tokens, targetIndex, windowSize, sourceText) {
    if (!sourceText) return '';
    const targetToken = tokens[targetIndex];
    const targetPosition = Number(targetToken?.word_position || 0);
    if (targetPosition <= 0) return sourceText;
    const reachable = getContextEvidenceTokenIndexes(tokens, targetIndex, windowSize);
    const indexes = [targetIndex, ...reachable].sort((left, right) => left - right);
    const startToken = tokens[indexes[0]];
    const endToken = tokens[indexes[indexes.length - 1]];
    const startPosition = Number(startToken?.word_position || 0);
    const endPosition = Number(endToken?.word_position || 0);
    if (startPosition <= 0 || endPosition <= 0) return sourceText;
    let start = Math.max(0, startPosition - 1);
    let end = Math.min(sourceText.length, endPosition - 1 + String(endToken?.surface_form || '').length);
    const targetStart = targetPosition - 1;
    const targetEnd = Math.min(sourceText.length, targetStart + String(targetToken?.surface_form || '').length);
    for (let index = targetStart - 1; index >= start; index -= 1) {
        const character = sourceText[index];
        if (isCanonicalTransparentBoundaryCharacter(character) && !canonicalHardWhitespaceCharacters.has(character)) continue;
        if (!isCanonicalHardBoundaryAt(sourceText, index)) continue;
        start = index + 1;
        break;
    }
    for (let index = targetEnd; index < end; index += 1) {
        const character = sourceText[index];
        if (isCanonicalTransparentBoundaryCharacter(character) && !canonicalHardWhitespaceCharacters.has(character)) continue;
        if (!isCanonicalHardBoundaryAt(sourceText, index)) continue;
        end = index;
        break;
    }
    return end > start ? sourceText.slice(start, end) : String(targetToken?.surface_form || '');
}

function scoreFinalContextFeatureGroup(tokens, targetIndex, groupId, windowSize, sourceText) {
    return scoreWeightedContextTerms(tokens, targetIndex, runtimeState.contextFeatureGroups.get(groupId) || [], windowSize, sourceText);
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

function evaluateContextualLoanwordEvidence(tokens, targetIndex, metadata, options = {}) {
    const evidence = metadata?.context;
    if (!evidence) return { candidates: [], selected: null, margin: 0 };
    const sourceText = options.finalPass ? String(options.sourceText || '') : '';
    const candidates = evidence.candidates.map(candidate => ({
        output: candidate.output,
        romaji: candidate.output,
        weight: scoreWeightedLoanwordContextTerms(tokens, targetIndex, candidate.terms, evidence.window, sourceText),
        rank: Number.POSITIVE_INFINITY,
        categories: new Set([options.finalPass ? 'sentence-context-verification' : 'contextual-loanword']),
        sources: new Set([evidence.source]),
        minScore: candidate.minScore
    })).sort((left, right) => right.weight - left.weight);
    const top = candidates[0] || null;
    const second = candidates[1] || null;
    const margin = top ? top.weight - Number(second?.weight || 0) : 0;
    const selected = top && top.weight >= Number(top.minScore || 0) && margin >= Number(evidence.minMargin || 0) ? top : null;
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

function annotateContextualLoanwordEvidence(tokens) {
    return (tokens || []).map((token, index) => {
        const metadata = getLoanwordMetadataForToken(token);
        if (!metadata?.context) return token;
        const evaluation = evaluateContextualLoanwordEvidence(tokens, index, metadata);
        const { candidates, selected, margin } = evaluation;
        return {
            ...token,
            contextualLoanwordEvidenceCandidates: candidates,
            contextualLoanwordEvidenceAmbiguous: !selected,
            ...(selected ? {
                contextualLoanwordEvidenceMatched: true,
                contextualLoanwordEvidenceOutput: selected.output,
                contextualLoanwordEvidenceSource: metadata.context.source,
                contextualLoanwordEvidenceScore: selected.weight,
                contextualLoanwordEvidenceMargin: margin
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
    if (!token || token.suppressLoanwordSourceSpelling) return null;
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

