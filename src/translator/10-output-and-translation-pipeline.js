// Source section: Capitalisation, punctuation, token conversion, diagnostics and the ordered translation pipeline.

function getAuthoritativeSpanLookup(surface) {
    const originalSurface = String(surface || '');
    const exact = runtimeState.authoritativeSpanDictionary.get(originalSurface);
    if (exact) return { evidence: exact, lookupSurface: originalSurface, variant: null };

    const generalVariant = normalizeKanjiForLookupDetailed(originalSurface);
    if (generalVariant.changed) {
        const general = runtimeState.authoritativeSpanDictionary.get(generalVariant.normalizedSurface);
        if (general && !general.nameVariants) return { evidence: general, lookupSurface: generalVariant.normalizedSurface, variant: generalVariant };
    }

    const nameVariant = normalizeKanjiForLookupDetailed(originalSurface, { names: true });
    if (nameVariant.changed) {
        const name = runtimeState.authoritativeSpanDictionary.get(nameVariant.normalizedSurface);
        if (name?.nameVariants) return { evidence: name, lookupSurface: nameVariant.normalizedSurface, variant: nameVariant };
    }
    return null;
}

function canContinueAuthoritativeSpan(surface) {
    const originalSurface = String(surface || '');
    if (runtimeState.authoritativeSpanPrefixes.has(originalSurface)) return true;
    const general = normalizeKanjiForLookup(originalSurface);
    if (runtimeState.authoritativeSpanPrefixes.has(general)) return true;
    const name = normalizeKanjiForLookup(originalSurface, { names: true });
    return runtimeState.authoritativeSpanPrefixes.has(name);
}


function getSourceCharacterOffsets(sourceText) {
    const source = String(sourceText || '');
    const characters = Array.from(source);
    const offsets = [0];
    let cursor = 0;
    for (const character of characters) {
        cursor += character.length;
        offsets.push(cursor);
    }
    return { source, characters, offsets };
}

function makeSourceSpanCandidate(sourceText, sourceStart, sourceEnd, details = {}) {
    const source = String(sourceText || '');
    const start = Number(sourceStart);
    const end = Number(sourceEnd);
    const surface = source.slice(start, end);
    const alternatives = Array.isArray(details.alternatives)
        ? details.alternatives.map(item => Object.freeze({ ...item }))
        : [];
    const metadata = details.metadata && typeof details.metadata === 'object'
        ? Object.freeze({ ...details.metadata })
        : Object.freeze({});
    return Object.freeze({
        id: String(details.id || `${start}:${end}:${details.kind || details.category || 'candidate'}:${details.evidenceSource || 'source-span-discovery'}`),
        sourceStart: start,
        sourceEnd: end,
        sourceSurface: surface,
        lookupSurface: String(details.lookupSurface || surface),
        category: String(details.category || 'other'),
        kind: String(details.kind || details.category || 'candidate'),
        semanticRole: String(details.semanticRole || details.kind || details.category || 'candidate'),
        evidenceSource: String(details.evidenceSource || 'source-span-discovery'),
        reading: details.reading ? String(details.reading) : null,
        romaji: details.romaji != null ? String(details.romaji) : null,
        confidence: Number.isFinite(details.confidence) ? Number(details.confidence) : null,
        reviewRequired: typeof details.reviewRequired === 'boolean' ? details.reviewRequired : null,
        selectionState: 'unselected',
        alternatives: Object.freeze(alternatives),
        metadata
    });
}

function getCandidateCategoryForAuthoritativeEvidence(category) {
    if (category === 'reviewed-name') return 'name';
    if (category === 'loanword' || category === 'loanword-review') return 'loanword';
    if (category === 'counter-date') return 'counter';
    return 'lexical';
}

function serializeReadingCandidateForSpanDiscovery(candidate) {
    return {
        reading: candidate?.reading || null,
        romaji: candidate?.romaji || null,
        weight: Number.isFinite(candidate?.weight) ? candidate.weight : 0,
        rank: Number.isFinite(candidate?.rank) ? candidate.rank : null,
        popularityScore: Number.isFinite(candidate?.popularityScore) ? candidate.popularityScore : null,
        retained: typeof candidate?.retained === 'boolean' ? candidate.retained : null,
        categories: [...(candidate?.categories || [])],
        sources: [...(candidate?.sources || [])]
    };
}

function scanSourceByPrefixes(sourceText, prefixes, lookup, emit) {
    if (!(prefixes instanceof Set) || !prefixes.size || typeof lookup !== 'function' || typeof emit !== 'function') return;
    const { characters, offsets } = getSourceCharacterOffsets(sourceText);
    for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
        let surface = '';
        for (let endIndex = startIndex; endIndex < characters.length; endIndex += 1) {
            surface += characters[endIndex];
            if (!prefixes.has(surface)) break;
            const match = lookup(surface);
            if (!match) continue;
            emit(match, surface, offsets[startIndex], offsets[endIndex + 1]);
        }
    }
}

function scanSourceWithContinuation(sourceText, canContinue, lookup, emit) {
    if (typeof canContinue !== 'function' || typeof lookup !== 'function' || typeof emit !== 'function') return;
    const { characters, offsets } = getSourceCharacterOffsets(sourceText);
    for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
        let surface = '';
        for (let endIndex = startIndex; endIndex < characters.length; endIndex += 1) {
            surface += characters[endIndex];
            if (!canContinue(surface)) break;
            const match = lookup(surface);
            if (!match) continue;
            emit(match, surface, offsets[startIndex], offsets[endIndex + 1]);
        }
    }
}

function addRegexSourceSpanCandidates(sourceText, regex, detailsForMatch, emit) {
    const source = String(sourceText || '');
    regex.lastIndex = 0;
    let match;
    while ((match = regex.exec(source)) !== null) {
        const surface = String(match[0] || '');
        if (!surface) {
            regex.lastIndex += 1;
            continue;
        }
        const details = detailsForMatch(match, surface);
        if (details) emit(makeSourceSpanCandidate(source, match.index, match.index + surface.length, details));
    }
}

/** @param {string} sourceText @param {CJ2RToken[]} [tokens] @param {{historicalKana?: boolean, overridesEnabled?: boolean}} [options] @returns {ReadonlyArray<CJ2RSourceSpanCandidate>} */
function discoverSourceSpanCandidates(sourceText, tokens = [], options = {}) {
    const source = String(sourceText || '');
    const candidates = [];
    const seen = new Set();
    const emit = candidate => {
        if (!candidate) return;
        const key = [candidate.sourceStart, candidate.sourceEnd, candidate.category, candidate.kind, candidate.evidenceSource, candidate.reading || '', candidate.romaji || ''].join('|');
        if (seen.has(key)) return;
        seen.add(key);
        candidates.push(candidate);
    };

    // Reviewed/maintained whole-span evidence. Discovery records every viable
    // interpretation but deliberately does not call the span-selection gates.
    scanSourceWithContinuation(source, canContinueAuthoritativeSpan, getAuthoritativeSpanLookup, (lookup, surface, start, end) => {
        const evidence = lookup.evidence || {};
        let alternatives = [];
        if (evidence.category === 'general-word') {
            const generalLookup = getGeneralWordLookup(surface);
            alternatives = getGeneralWordCandidates(generalLookup).map(serializeReadingCandidateForSpanDiscovery);
        }
        emit(makeSourceSpanCandidate(source, start, end, {
            lookupSurface: lookup.lookupSurface,
            category: getCandidateCategoryForAuthoritativeEvidence(evidence.category),
            kind: evidence.category || 'authoritative-span',
            semanticRole: evidence.category || 'authoritative-span',
            evidenceSource: evidence.source || 'authoritative-span-evidence',
            reading: evidence.reading || null,
            romaji: evidence.romaji ?? null,
            confidence: evidence.confidence,
            reviewRequired: typeof evidence.reviewRequired === 'boolean' ? evidence.reviewRequired : null,
            alternatives,
            metadata: {
                mergeSafe: Boolean(evidence.mergeSafe),
                priority: Number.isFinite(evidence.priority) ? evidence.priority : null,
                loanwordCategory: evidence.loanwordCategory || null,
                counterRole: evidence.counterRole || null,
                counterUnit: evidence.counterUnit || null,
                variantNormalized: Boolean(lookup.variant?.changed)
            }
        }));
    });

    // Compound-word evidence is also scanned independently. The authoritative
    // index stores only a usable single reading, so ambiguous maintained compounds
    // still need an explicit candidate with all supported readings preserved.
    scanSourceByPrefixes(source, runtimeState.compoundWordPrefixes, surface => runtimeState.compoundWordDictionary.get(surface), (entry, surface, start, end) => {
        const alternatives = (entry?.readings || []).map(candidate => ({
            reading: candidate?.reading || null,
            romaji: candidate?.romaji || null,
            categories: ['lexical'],
            sources: ['compound-word-evidence']
        }));
        if (!alternatives.length) return;
        const resolved = alternatives.length === 1 ? alternatives[0] : null;
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'compound-word', semanticRole: 'lexical-span',
            evidenceSource: 'compound-word-evidence', reading: resolved?.reading || null,
            romaji: resolved?.romaji ?? null, confidence: resolved ? 0.98 : 0.72,
            reviewRequired: alternatives.length > 1, alternatives
        }));
    });

    // General-word evidence is scanned independently as well as through the
    // authoritative-span index. A higher-priority counter/name/loanword entry on
    // the same surface must not hide a competing lexical interpretation during
    // candidate discovery.
    scanSourceByPrefixes(source, runtimeState.generalWordPrefixes, getGeneralWordLookup, (lookup, surface, start, end) => {
        const alternatives = getGeneralWordCandidates(lookup).map(serializeReadingCandidateForSpanDiscovery);
        if (!alternatives.length) return;
        const preferred = alternatives[0];
        const completeCoverage = hasCompleteGeneralWordReadingCoverage(lookup);
        const mergeSafe = Boolean(lookup?.entry?.mergeSafe);
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'general-word', semanticRole: 'lexical-span',
            evidenceSource: 'general-word-evidence', reading: preferred?.reading || null,
            romaji: preferred?.romaji ?? null, confidence: mergeSafe ? 0.9 : 0.72,
            reviewRequired: alternatives.length > 1 || !completeCoverage,
            alternatives,
            metadata: { mergeSafe, completeCoverage }
        }));
    });

    // Kana spellings may represent an established whole word whose maintained
    // lexical entry is written with Han characters. The kana-reading index is
    // therefore scanned independently of Kuromoji segmentation. Only evidence
    // already registered from maintained lexical entries is proposed here;
    // discovery does not select the boundary.
    {
        const { characters, offsets } = getSourceCharacterOffsets(source);
        for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
            let surface = '';
            for (let endIndex = startIndex; endIndex < characters.length; endIndex += 1) {
                const character = characters[endIndex];
                if (!isKanaSurface(character)) break;
                surface += character;
                const normalizedReading = normalizeKanaReading(surface);
                if (!runtimeState.kanaLexicalReadingPrefixes.has(normalizedReading)) break;
                const evidence = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading);
                if (!evidence) continue;
                const strong = Boolean(evidence.strongSources?.size);
                emit(makeSourceSpanCandidate(source, offsets[startIndex], offsets[endIndex + 1], {
                    category: 'lexical', kind: 'kana-lexical-reading', semanticRole: 'lexical-span',
                    evidenceSource: strong ? 'kana-lexical-strong-evidence' : 'kana-lexical-evidence',
                    reading: normalizedReading, romaji: convertToRomaji(normalizedReading),
                    confidence: strong ? 0.94 : 0.7, reviewRequired: false,
                    alternatives: [],
                    metadata: {
                        strong,
                        evidenceSurfaces: [...(evidence.surfaces || [])],
                        evidenceSources: [...(evidence.sources || [])]
                    }
                }));
            }
        }
    }

    // Unreviewed/specialist name evidence is a candidate source, never an
    // automatic segmentation decision.
    scanSourceByPrefixes(source, runtimeState.properNounPrefixes, surface => runtimeState.properNounDictionary.get(surface), (nameCandidates, surface, start, end) => {
        const alternatives = [...nameCandidates.values()].map(serializeReadingCandidateForSpanDiscovery);
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'name', kind: 'proper-noun', semanticRole: 'proper-name', evidenceSource: 'proper-noun-evidence',
            confidence: alternatives.length === 1 ? 0.88 : 0.6,
            reviewRequired: alternatives.length > 1, alternatives,
            reading: alternatives.length === 1 ? alternatives[0].reading : null,
            romaji: alternatives.length === 1 ? alternatives[0].romaji : null
        }));
    });

    // Reviewed common-word and inflection evidence remains lexical candidate
    // evidence; pattern constraints are checked for applicability but do not
    // select boundaries here.
    scanSourceByPrefixes(source, runtimeState.commonWordPrefixes, surface => runtimeState.commonWordDictionary.get(surface), (rules, surface, start, end) => {
        for (const rule of rules || []) {
            if (rule?.pattern instanceof RegExp) {
                if (!contextualPatternContainsRange(rule.pattern, source, { start, end })) continue;
            }
            emit(makeSourceSpanCandidate(source, start, end, {
                category: 'lexical', kind: 'common-word', semanticRole: 'lexical-span',
                evidenceSource: 'common-word-bank', reading: rule?.reading || null, romaji: rule?.romaji ?? null,
                confidence: 0.92, reviewRequired: false,
                metadata: { conjugationClass: rule?.conjugationClass || null, contextPattern: Boolean(rule?.pattern) }
            }));
        }
    });
    scanSourceByPrefixes(source, runtimeState.commonWordInflectionPrefixes, surface => runtimeState.commonWordInflectionDictionary.get(surface), (entry, surface, start, end) => {
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'common-word-inflection', semanticRole: 'lexical-inflection',
            evidenceSource: 'reviewed-common-word-inflection', reading: entry.reading || null,
            confidence: 0.93, reviewRequired: false,
            metadata: { lemma: entry.lemma || null, conjugationClass: entry.conjugationClass || null }
        }));
    });
    scanSourceByPrefixes(source, runtimeState.rendakuEvidencePrefixes, surface => runtimeState.rendakuEvidenceDictionary.get(surface), (entry, surface, start, end) => {
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'lexical', kind: 'rendaku-reading', semanticRole: 'lexical-reading',
            evidenceSource: entry.source || 'rendaku-evidence', reading: entry.reading || null,
            confidence: 0.9, reviewRequired: false,
            metadata: { rendaku: Boolean(entry.rendaku) }
        }));
    });

    // Title evidence is range-scoped. Exact complete-title rules may also apply
    // when the reviewed title is used as a syntactically bounded noun in a sentence.
    scanSourceByPrefixes(source, runtimeState.titleReadingPrefixes, surface => runtimeState.titleReadingDictionary.get(surface), (rules, surface, start, end) => {
        for (const rule of rules || []) {
            if (!(rule?.pattern instanceof RegExp)) continue;
            if (!titleReadingEvidenceAppliesToRange(rule, source, { start, end }, getTitleMentionBoundaryContext(tokens, null, { start, end }, source))) continue;
            emit(makeSourceSpanCandidate(source, start, end, {
                category: 'title', kind: rule.kind || 'title-reading', semanticRole: 'title-reading',
                evidenceSource: rule.source || 'reviewed-title-reading', reading: rule.reading || null, romaji: rule.romaji ?? null,
                confidence: 1, reviewRequired: false
            }));
        }
    });

    if (options.historicalKana) {
        scanSourceByPrefixes(source, runtimeState.historicalKanaEvidencePrefixes, surface => runtimeState.historicalKanaEvidenceDictionary.get(surface), (entry, surface, start, end) => {
            emit(makeSourceSpanCandidate(source, start, end, {
                category: 'historical', kind: 'historical-reading', semanticRole: 'historical-reading',
                evidenceSource: entry.source || 'historical-kana-evidence', reading: entry.reading || null,
                confidence: 0.95, reviewRequired: false,
                metadata: { sourceType: entry.sourceType || null }
            }));
        });
    }

    // Grammar is proposed independently of lexical segmentation. A matching
    // grammatical surface is only a candidate until later boundary arbitration.
    scanSourceByPrefixes(source, runtimeState.grammaticalExpressionPrefixes, surface => runtimeState.grammaticalExpressionDictionary.get(surface), (romaji, surface, start, end) => {
        emit(makeSourceSpanCandidate(source, start, end, {
            category: 'grammar', kind: 'grammatical-expression', semanticRole: 'grammar',
            evidenceSource: 'grammatical-expression-evidence', romaji, confidence: 0.8, reviewRequired: null
        }));
    });

    // Contextual evidence is recorded as competing evidence and is not scored
    // or selected during candidate creation.
    for (const [surface, entry] of runtimeState.contextualReadingDictionary.entries()) {
        let start = source.indexOf(surface);
        while (start >= 0) {
            emit(makeSourceSpanCandidate(source, start, start + surface.length, {
                category: 'contextual', kind: 'contextual-reading', semanticRole: 'contextual-reading',
                evidenceSource: entry.source || 'contextual-reading-evidence', reviewRequired: true,
                alternatives: (entry.candidates || []).map(candidate => ({
                    reading: candidate.reading || null,
                    romaji: candidate.reading ? convertToRomaji(candidate.reading) : null,
                    minScore: Number.isFinite(candidate.minScore) ? candidate.minScore : null,
                    features: [...(candidate.features || [])]
                })),
                metadata: { window: Number.isFinite(entry.window) ? entry.window : null, minMargin: Number.isFinite(entry.minMargin) ? entry.minMargin : null }
            }));
            start = source.indexOf(surface, start + Math.max(1, surface.length));
        }
    }
    for (const [surface, metadata] of runtimeState.loanwordMetadataDictionary.entries()) {
        if (!metadata?.context) continue;
        let start = source.indexOf(surface);
        while (start >= 0) {
            emit(makeSourceSpanCandidate(source, start, start + surface.length, {
                category: 'contextual', kind: 'contextual-loanword', semanticRole: 'contextual-loanword',
                evidenceSource: metadata.context.source || 'contextual-loanword-evidence', reviewRequired: true,
                alternatives: (metadata.context.candidates || []).map(candidate => ({
                    output: candidate.output || null,
                    minScore: Number.isFinite(candidate.minScore) ? candidate.minScore : null,
                    terms: (candidate.terms || []).map(term => ({ term: term.term, weight: term.weight }))
                })),
                metadata: { window: Number.isFinite(metadata.context.window) ? metadata.context.window : null, minMargin: Number.isFinite(metadata.context.minMargin) ? metadata.context.minMargin : null }
            }));
            start = source.indexOf(surface, start + Math.max(1, surface.length));
        }
    }

    // Structural role candidates carry no pronunciation. Role selection occurs later,
    // before any counter/date morphology is permitted to generate a reading.
    const numeralClass = '0-9０-９〇零一二三四五六七八九十百千万億兆';
    addRegexSourceSpanCandidates(source, new RegExp(`[${numeralClass}]+`, 'gu'), () => ({
        category: 'numeric', kind: 'numeral-structure', semanticRole: 'numeral', evidenceSource: 'surface-numeric-structure', confidence: 0.9
    }), emit);
    addRegexSourceSpanCandidates(source, new RegExp(`[${numeralClass}]+(?:時|分|日|週間?|[ヶヵケかカ箇]月|月|年|時間|回|度)`, 'gu'), (match, surface) => {
        const unit = surface.match(/(?:週間?|時間|[ヶヵケかカ箇]月|時|分|日|月|年|回|度)$/u)?.[0] || '';
        const temporal = ['時','日','週','週間','月','年','時間'].includes(unit) || /[ヶヵケかカ箇]月$/u.test(unit);
        return {
            category: temporal ? 'temporal' : 'counter', kind: temporal ? 'temporal-structure' : 'counter-structure',
            semanticRole: temporal ? 'temporal-expression' : 'counter-expression', evidenceSource: 'surface-role-structure', confidence: 0.72,
            metadata: { unit }
        };
    }, emit);
    addRegexSourceSpanCandidates(source, new RegExp(`(?:今日|明日|昨日|一昨日|明後日|毎日|今週|来週|先週|毎週|今月|来月|先月|毎月|今年|来年|去年|毎年|一日|[${numeralClass}]+(?:日|週間?|[ヶヵケかカ箇]月|年|時間))中`, 'gu'), () => ({
        category: 'temporal', kind: 'period-wide-structure', semanticRole: 'temporal-period-wide', evidenceSource: 'typed-temporal-structure', confidence: 0.78
    }), emit);
    addRegexSourceSpanCandidates(source, new RegExp(`[${numeralClass}]+分の[${numeralClass}]+`, 'gu'), () => ({
        category: 'numeric', kind: 'fraction-structure', semanticRole: 'fraction', evidenceSource: 'surface-fraction-structure', confidence: 0.85
    }), emit);

    // Probe Kuromoji's dictionary directly from immutable source positions. The
    // resulting candidates are independent of the supplied token partition and do
    // not select a boundary by themselves.
    const tokenizerTokens = tokens || [];
    const tokenizerTrie = runtimeState.tokenizer?.viterbi_builder?.trie;
    if (tokenizerTrie && typeof tokenizerTrie.commonPrefixSearch === 'function') {
        const { characters, offsets } = getSourceCharacterOffsets(source);
        for (let startIndex = 0; startIndex < characters.length; startIndex += 1) {
            const sourceStart = offsets[startIndex];
            const prefixMatches = tokenizerTrie.commonPrefixSearch(source.slice(sourceStart)) || [];
            for (const prefixMatch of prefixMatches) {
                const surface = String(prefixMatch?.k || '');
                if (Array.from(surface).length < 2) continue;
                const sourceEnd = sourceStart + surface.length;
                const exactCandidates = getKuromojiExactDictionaryCandidates(surface).filter(candidate =>
                    candidate && candidate.pos !== '助詞' && candidate.pos !== '助動詞' && candidate.pos !== '記号'
                    && candidate.reading && /^[ぁ-ゖァ-ヶー]+$/u.test(String(candidate.reading)));
                const uniqueReadings = [...new Set(exactCandidates.map(candidate => normalizeKanaReading(candidate.reading)).filter(Boolean))];
                if (uniqueReadings.length !== 1) continue;
                const representative = exactCandidates.find(candidate => normalizeKanaReading(candidate.reading) === uniqueReadings[0]);
                const properName = representative?.pos === '名詞' && representative?.pos_detail_1 === '固有名詞';
                emit(makeSourceSpanCandidate(source, sourceStart, sourceEnd, {
                    category: properName ? 'name' : 'lexical', kind: 'kuromoji-exact-dictionary-span',
                    semanticRole: properName ? 'proper-name' : 'lexical-span', evidenceSource: 'kuromoji-exact-dictionary',
                    reading: uniqueReadings[0], romaji: convertToRomaji(uniqueReadings[0]), confidence: 0.88, reviewRequired: false,
                    alternatives: exactCandidates.map(candidate => ({
                        reading: normalizeKanaReading(candidate.reading), romaji: convertToRomaji(candidate.reading),
                        pos: candidate.pos || null, posDetail1: candidate.pos_detail_1 || null, posDetail2: candidate.pos_detail_2 || null
                    })),
                    metadata: { properName }
                }));
            }
        }
    }

    // Preserve Kuromoji's proposal as low-authority evidence over the exact
    // source positions without allowing it to mutate or select candidates.
    for (let tokenIndex = 0; tokenIndex < tokenizerTokens.length; tokenIndex += 1) {
        const token = tokenizerTokens[tokenIndex];
        if (!Number.isInteger(token?.sourceStart) || !Number.isInteger(token?.sourceEnd)) continue;
        const reading = getKuromojiDictionaryReading(token);
        const previousToken = tokenizerTokens[tokenIndex - 1] || null;
        const nextToken = tokenizerTokens[tokenIndex + 1] || null;
        const hasOrthographicNoFrame = String(token.surface_form || '') === 'ノ'
            && token.pos !== '助詞'
            && previousToken?.sourceEnd === token.sourceStart
            && nextToken?.sourceStart === token.sourceEnd
            && previousToken?.pos !== '記号'
            && nextToken?.pos !== '記号'
            && !isParticle(previousToken)
            && !isParticle(nextToken)
            && previousToken?.pos !== '助動詞'
            && nextToken?.pos !== '助動詞';
        if (hasOrthographicNoFrame) {
            emit(makeSourceSpanCandidate(source, token.sourceStart, token.sourceEnd, {
                category: 'grammar', kind: 'orthographic-katakana-no', semanticRole: 'genitive-particle',
                evidenceSource: 'source-orthography+syntactic-frame', reading: 'の', romaji: 'no', confidence: 0.74,
                reviewRequired: true,
                metadata: {
                    canonicalSurface: 'の',
                    tokenizerPos: token.pos || null,
                    tokenizerPosDetail1: token.pos_detail_1 || null
                }
            }));
        }
        if (isParticle(token) || token.pos === '助動詞') {
            emit(makeSourceSpanCandidate(source, token.sourceStart, token.sourceEnd, {
                category: 'grammar', kind: isParticle(token) ? 'kuromoji-particle' : 'kuromoji-auxiliary', semanticRole: 'grammar',
                evidenceSource: 'kuromoji-morphology', reading: reading || null,
                romaji: reading ? convertToRomaji(reading) : null, confidence: 0.62,
                metadata: { pos: token.pos || null, posDetail1: token.pos_detail_1 || null, posDetail2: token.pos_detail_2 || null }
            }));
        }
        emit(makeSourceSpanCandidate(source, token.sourceStart, token.sourceEnd, {
            category: 'tokenizer', kind: 'kuromoji-token', semanticRole: 'tokenizer-proposal',
            evidenceSource: 'kuromoji-tokenization', reading: reading || null,
            romaji: reading ? convertToRomaji(reading) : null, confidence: 0.5,
            metadata: { pos: token.pos || null, posDetail1: token.pos_detail_1 || null, posDetail2: token.pos_detail_2 || null }
        }));
    }

    candidates.sort((left, right) => left.sourceStart - right.sourceStart
        || right.sourceEnd - left.sourceEnd
        || left.category.localeCompare(right.category)
        || left.kind.localeCompare(right.kind)
        || left.evidenceSource.localeCompare(right.evidenceSource));
    return Object.freeze(candidates);
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates @param {string} sourceText */
function validateSourceSpanCandidates(candidates, sourceText) {
    const source = String(sourceText || '');
    const violations = [];
    for (let index = 0; index < (candidates || []).length; index += 1) {
        const candidate = candidates[index];
        const add = reason => violations.push({ index, id: candidate?.id || null, sourceSurface: candidate?.sourceSurface || null, reason });
        if (!candidate || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) { add('missing-source-range'); continue; }
        if (candidate.sourceStart < 0 || candidate.sourceEnd <= candidate.sourceStart || candidate.sourceEnd > source.length) { add('invalid-source-range'); continue; }
        if (candidate.sourceSurface !== source.slice(candidate.sourceStart, candidate.sourceEnd)) add('invalid-sourceSurface');
        if (!candidate.category || !candidate.kind || !candidate.evidenceSource) add('missing-candidate-provenance');
        if (candidate.selectionState !== 'unselected') add('candidate-selection-leaked-into-discovery');
        if (Object.prototype.hasOwnProperty.call(candidate, 'selected') || Object.prototype.hasOwnProperty.call(candidate, 'winner')) add('candidate-selection-field-present');
    }
    return { valid: violations.length === 0, violations };
}

function tokensNeedAuthoritativeRescue(tokens, surface) {
    return tokens.some(token => {
        const resolution = resolveTokenReading(token, surface);
        const source = String(resolution?.source || '');
        return String(convertToken(token, surface, resolution) || '').includes('[Unresolved]')
            || source === 'japanese-scope-character-fallback'
            || source === 'japanese-scope-compositional-fallback'
            || source === 'japanese-scope-data-gap';
    });
}

function generalWordSpanConflictsWithNumericStructure(tokens, startIndex, endIndex, candidateSurface) {
    const candidateTokens = tokens.slice(startIndex, endIndex + 1);
    if (isStructuredNumericUnitSurface(candidateSurface)) return true;

    const isNumericToken = token => Boolean(token) && (
        token.pos_detail_1 === '数'
        || (isSuffix(token) && token.pos_detail_2 === '助数詞')
        || token.authoritativeSpanCategory === 'counter-date'
        || token.numericExpression
        || token.typedNumericExpressionMatched
        || token.typedTemporalExpressionMatched
        || token.reviewedNumericAliasMatched
        || token.structuredNumericSplit
    );
    const containsCounter = candidateTokens.some(token =>
        (isSuffix(token) && token.pos_detail_2 === '助数詞')
        || token?.authoritativeSpanCategory === 'counter-date'
        || token?.typedTemporalExpressionMatched
    );
    if (containsCounter) return true;

    const allNumerals = candidateTokens.length > 1
        && candidateTokens.every(token => token?.pos_detail_1 === '数');
    if (!allNumerals) return false;

    // An isolated lexical numeral collision such as 万一 may remain a whole word,
    // but the same surface inside a larger numeric sequence must stay structural.
    return isNumericToken(tokens[startIndex - 1]) || isNumericToken(tokens[endIndex + 1]);
}

function counterDateAuthorityHasSelectedRole(candidateTokens, evidence) {
    if (evidence?.category !== 'counter-date') return true;
    const role = String(evidence?.counterRole || '');
    // These readings are role-specific: their pronunciation must never be used
    // as proof that the source span is a clock/minute expression. Role
    // selection happens earlier in the numeric pipeline.
    if (!['clock-hour', 'minute-counter'].includes(role)) return true;
    return (candidateTokens || []).some(token => token?.typedNumericRoleSelected === true && token?.typedNumericRole === role);
}

function getTokenSpanSourceBounds(tokens, startIndex, endIndex) {
    const first = tokens?.[startIndex];
    const last = tokens?.[endIndex];
    const sourceStart = Number.isInteger(first?.sourceStart) ? first.sourceStart : null;
    const sourceEnd = Number.isInteger(last?.sourceEnd) ? last.sourceEnd : null;
    return { sourceStart, sourceEnd };
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {number} endIndex @param {string} candidateSurface @param {any} evidence @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function arbitrateMergeSafeGeneralWordBoundary(tokens, startIndex, endIndex, candidateSurface, evidence, sourceSpanCandidates = []) {
    if (evidence?.category !== 'general-word' || !evidence?.mergeSafe || endIndex <= startIndex) return { allowed: false, reason: 'not-merge-safe-general-word' };
    const candidateTokens = tokens.slice(startIndex, endIndex + 1);
    const { sourceStart, sourceEnd } = getTokenSpanSourceBounds(tokens, startIndex, endIndex);
    if (!Number.isInteger(sourceStart) || !Number.isInteger(sourceEnd) || sourceEnd <= sourceStart) {
        if ((sourceSpanCandidates || []).length) return { allowed: false, reason: 'missing-source-span' };
        const protectedEvidenceInsideSpan = candidateTokens.some(item =>
            item?.reviewedProperNameSpanMatched || item?.reviewedNameHonorificMatched || item?.exactDictionaryRescueMatched
            || item?.titleReadingEvidenceMatched || item?.loanwordMatched || item?.contextualOverrideMatched || item?.nameContextAmbiguous
        );
        if (protectedEvidenceInsideSpan) return { allowed: false, reason: 'stronger-protected-evidence' };
        const grammaticalMaterialInsideSpan = candidateTokens.some((item, offset) => offset > 0 && (
            isParticle(item) || isNominalizer(item) || item?.pos === '助動詞' || item?.fullGrammaticalExpression || item?.sourceSpanGrammarBoundaryBefore
        ));
        if (grammaticalMaterialInsideSpan) return { allowed: false, reason: 'independent-grammatical-boundary' };
        if (generalWordSpanConflictsWithNumericStructure(tokens, startIndex, endIndex, candidateSurface)) return { allowed: false, reason: 'validated-numeric-structure' };
        return { allowed: true, reason: 'merge-safe-fixture-evidence' };
    }

    const exactLexicalCandidates = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.sourceStart === sourceStart
        && candidate?.sourceEnd === sourceEnd
        && candidate?.sourceSurface === candidateSurface
        && candidate?.category === 'lexical'
        && candidate?.kind === 'general-word'
        && candidate?.metadata?.mergeSafe === true
    );
    // Runtime-internal callers used by focused QA may not supply the immutable
    // candidate inventory. In that case the authored mergeSafe evidence itself
    // remains sufficient to exercise the arbitration rule.
    const hasExactLexicalBoundaryEvidence = exactLexicalCandidates.length > 0 || !(sourceSpanCandidates || []).length;
    if (!hasExactLexicalBoundaryEvidence) return { allowed: false, reason: 'no-exact-lexical-candidate' };

    const protectedEvidenceInsideSpan = candidateTokens.some(item =>
        item?.reviewedProperNameSpanMatched
        || item?.reviewedNameHonorificMatched
        || item?.exactDictionaryRescueMatched
        || item?.titleReadingEvidenceMatched
        || item?.loanwordMatched
        || item?.contextualOverrideMatched
        || item?.nameContextAmbiguous
    );
    if (protectedEvidenceInsideSpan) return { allowed: false, reason: 'stronger-protected-evidence' };

    // A semantic role that has already been positively selected owns its source
    // span. Lexical boundary evidence may compete with raw numeric morphology,
    // but it cannot erase a role decision made by the role-first pipeline.
    const selectedRoleInsideSpan = candidateTokens.some(item =>
        item?.typedNumericRoleSelected === true
        || item?.typedTemporalExpressionMatched === true
        || item?.typedNumericExpressionMatched === true
    );
    if (selectedRoleInsideSpan) return { allowed: false, reason: 'selected-semantic-role' };

    // Explicit structured number+unit surfaces (currency and reviewed
    // productive counters) remain structural. Kuromoji's broad 助数詞 label is
    // not sufficient on its own because it also appears inside lexicalised
    // forms such as 一握り, so only the maintained productive counter set is a
    // hard boundary signal here.
    if (isStructuredNumericUnitSurface(candidateSurface)) return { allowed: false, reason: 'structured-numeric-unit' };
    const productiveCounterSurfaces = new Set(['人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階']);
    const hasProductiveCounterStructure = candidateTokens.some((item, offset) => {
        if (offset <= 0 || !productiveCounterSurfaces.has(String(item?.surface_form || ''))) return false;
        const previous = candidateTokens[offset - 1];
        return previous?.pos_detail_1 === '数' || isJapaneseNumeralSurface(previous?.surface_form || '') || previous?.numericExpression;
    });
    if (hasProductiveCounterStructure) return { allowed: false, reason: 'productive-counter-structure' };

    const grammarCandidatesInsideSpan = (sourceSpanCandidates || []).filter(candidate =>
        candidate?.category === 'grammar'
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
    );
    const numericCandidatesInsideSpan = (sourceSpanCandidates || []).filter(candidate =>
        ['numeric', 'temporal', 'counter'].includes(candidate?.category)
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
    );
    const strongerNumericContainer = (sourceSpanCandidates || []).some(candidate =>
        ['numeric', 'counter'].includes(candidate?.category)
        && candidate.sourceStart <= sourceStart
        && candidate.sourceEnd >= sourceEnd
        && (candidate.sourceStart < sourceStart || candidate.sourceEnd > sourceEnd)
    );
    if (strongerNumericContainer) return { allowed: false, reason: 'inside-larger-numeric-structure' };

    const counterSubspan = (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'counter'
        && candidate.sourceStart >= sourceStart
        && candidate.sourceEnd <= sourceEnd
        && (candidate.sourceStart > sourceStart || candidate.sourceEnd < sourceEnd)
    );
    if (counterSubspan) return { allowed: false, reason: 'counter-subspan-evidence' };

    return {
        allowed: true,
        reason: grammarCandidatesInsideSpan.length || numericCandidatesInsideSpan.length
            ? 'exact-lexical-evidence-wins-analyser-segmentation'
            : 'exact-lexical-evidence',
        competingGrammarCandidates: grammarCandidatesInsideSpan.length,
        competingNumericCandidates: numericCandidatesInsideSpan.length
    };
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestAuthoritativeSpan(tokens, startIndex, sourceSpanCandidates = []) {
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.contextualOverrideMatched || token.titleReadingEvidenceMatched || token.historicalKanaEvidenceMatched) break;
        const tokenSurface = String(token.surface_form || '');
        const nextCandidateSurface = candidateSurface + tokenSurface;
        const evidenceBackedSymbol = token.pos === '記号'
            && !isIdeographicVariationSelectorSequence(tokenSurface)
            && canContinueAuthoritativeSpan(nextCandidateSurface);
        if (token.pos === '記号' && !isIdeographicVariationSelectorSequence(tokenSurface) && !evidenceBackedSymbol) break;
        candidateSurface = nextCandidateSurface;
        const lookup = getAuthoritativeSpanLookup(candidateSurface);
        const nextToken = tokens[end + 1];
        const suppressCountryNameAuthority = Boolean(
            lookup?.evidence?.category === 'loanword'
            && lookup?.evidence?.loanwordCategory === 'country-name'
            && String(nextToken?.surface_form || '') === '語'
            && !hasReviewedCountryLanguageLoanword(candidateSurface + '語')
        );
        const changedForLookup = Boolean(lookup?.variant?.changed);
        const spansMultipleTokens = end > startIndex;
        const category = lookup?.evidence?.category || '';
        const candidateTokens = tokens.slice(startIndex, end + 1);
        const counterDateRoleAuthorityAllowed = counterDateAuthorityHasSelectedRole(candidateTokens, lookup?.evidence);
        const categoryAllowsDirectAuthority = ['counter-date', 'ateji', 'loanword', 'loanword-review', 'reviewed-reading'].includes(category)
            && counterDateRoleAuthorityAllowed;
        const generalWordRescue = category === 'general-word'
            && tokensNeedAuthoritativeRescue(candidateTokens, candidateSurface);
        const generalWordBoundaryArbitration = category === 'general-word'
            ? arbitrateMergeSafeGeneralWordBoundary(tokens, startIndex, end, candidateSurface, lookup?.evidence, sourceSpanCandidates)
            : { allowed: false, reason: 'not-general-word' };
        const mergeSafeGeneralWordAuthority = category === 'general-word'
            && Boolean(lookup?.evidence?.mergeSafe)
            && spansMultipleTokens
            && generalWordBoundaryArbitration.allowed;
        const unconditionalSpanAuthority = category !== 'general-word' && spansMultipleTokens && counterDateRoleAuthorityAllowed;
        const variantNormalizedAuthority = changedForLookup && category !== 'general-word' && counterDateRoleAuthorityAllowed;
        // Strong merge-safe lexical evidence may repair a readable tokenizer split. Weak general-word aliases remain rescue-only.
        if (lookup && !suppressCountryNameAuthority && (categoryAllowsDirectAuthority || generalWordRescue || mergeSafeGeneralWordAuthority || unconditionalSpanAuthority || variantNormalizedAuthority)) {
            bestMatch = {
                surface: candidateSurface,
                lookupSurface: lookup.lookupSurface,
                evidence: lookup.evidence,
                variant: lookup.variant,
                length: end - startIndex + 1
            };
        }
        if (!canContinueAuthoritativeSpan(candidateSurface)) break;
    }
    return bestMatch;
}

function sourceSpanLexicalCandidateHasStandaloneConsensus(candidate) {
    if (!candidate?.sourceSurface || !candidate?.reading) return false;
    const token = getStandaloneSingleToken(candidate.sourceSurface);
    if (!token || isParticle(token) || token.pos === '助動詞' || token.pos === '記号') return false;
    const reading = normalizeKanaReading(getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '');
    return Boolean(reading && reading === normalizeKanaReading(candidate.reading));
}

function getSourceSpanLexicalCandidateTokenizerConsensusTokens(candidate) {
    if (!candidate?.sourceSurface || !candidate?.reading || !runtimeState.tokenizer) return null;
    const tokens = runtimeState.tokenizer.tokenize(candidate.sourceSurface) || [];
    if (!tokens.length || tokens.map(token => String(token.surface_form || '')).join('') !== candidate.sourceSurface) return null;
    let reading = '';
    for (const token of tokens) {
        if (!token || isParticle(token) || token.pos === '助動詞') return null;
        const tokenReading = getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '';
        const normalized = normalizeKanaReading(tokenReading);
        if (!normalized) return null;
        reading += normalized;
    }
    return normalizeKanaReading(reading) === normalizeKanaReading(candidate.reading) ? tokens : null;
}

function sourceSpanLexicalCandidateHasTokenizerReadingConsensus(candidate) {
    return Boolean(getSourceSpanLexicalCandidateTokenizerConsensusTokens(candidate));
}

function isStrongSourceSpanLexicalReconstructionCandidate(candidate) {
    if (!candidate || candidate.reviewRequired === true || !Number.isFinite(candidate.confidence) || candidate.confidence < 0.85) return false;
    if (!candidate.reading && candidate.romaji == null) return false;
    if (candidate.kind === 'proper-noun') {
        return sourceSpanLexicalCandidateHasStandaloneConsensus(candidate)
            || sourceSpanLexicalCandidateHasTokenizerReadingConsensus(candidate);
    }
    if (candidate.kind === 'kuromoji-exact-dictionary-span') return sourceSpanLexicalCandidateHasStandaloneConsensus(candidate);
    return candidate.kind === 'common-word'
        || candidate.kind === 'common-word-inflection'
        || candidate.category === 'title';
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestStrongSourceSpanLexicalCandidate(tokens, startIndex, sourceSpanCandidates = []) {
    const first = tokens?.[startIndex];
    if (!first || !Number.isInteger(first.sourceStart) || !Number.isInteger(first.sourceEnd)) return null;
    const firstSourceStart = Number(first.sourceStart);
    const firstSourceEnd = Number(first.sourceEnd);
    const matching = (sourceSpanCandidates || []).filter(candidate => {
        if (candidate?.sourceStart !== firstSourceStart
            || candidate.sourceEnd <= firstSourceEnd
            || !isStrongSourceSpanLexicalReconstructionCandidate(candidate)) return false;
        const strongerReviewedLoanword = candidate.category !== 'title' && (sourceSpanCandidates || []).some(other =>
            other !== candidate
            && other?.sourceStart === candidate.sourceStart
            && other?.sourceEnd === candidate.sourceEnd
            && other.category === 'loanword'
            && other.romaji != null
            && other.reviewRequired !== true);
        return !strongerReviewedLoanword;
    });
    if (!matching.length) return null;

    let best = null;
    for (const candidate of matching) {
        let endIndex = -1;
        for (let index = startIndex; index < tokens.length; index += 1) {
            const token = tokens[index];
            if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) break;
            if (index > startIndex && tokens[index - 1]?.sourceEnd !== token.sourceStart) break;
            const tokenSourceEnd = Number(token.sourceEnd);
            if (tokenSourceEnd === candidate.sourceEnd) { endIndex = index; break; }
            if (tokenSourceEnd > candidate.sourceEnd) break;
        }
        if (endIndex <= startIndex) continue;
        const members = tokens.slice(startIndex, endIndex + 1);
        const reconstructed = members.map(token => String(token.surface_form || '')).join('');
        if (reconstructed !== candidate.sourceSurface) continue;
        // This reconstruction path exists for destructive symbol-like token splits.
        // Ordinary analyser word/grammar boundaries continue through their dedicated
        // arbitration paths rather than being collapsed merely because a dictionary
        // also contains the combined surface.
        if (!members.some(token => token?.pos === '記号')) continue;
        if (!best || candidate.sourceEnd > best.candidate.sourceEnd
            || (candidate.sourceEnd === best.candidate.sourceEnd && Number(candidate.confidence || 0) > Number(best.candidate.confidence || 0))) {
            best = { candidate, endIndex };
        }
    }
    if (!best) return null;

    const sameSpan = matching.filter(candidate => candidate.sourceEnd === best.candidate.sourceEnd);
    const conflicting = sameSpan.some(candidate => {
        if (candidate === best.candidate || candidate.reviewRequired === true) return false;
        const leftReading = normalizeKanaReading(candidate.reading || '');
        const rightReading = normalizeKanaReading(best.candidate.reading || '');
        const readingConflict = leftReading && rightReading && leftReading !== rightReading;
        const romajiConflict = candidate.romaji != null && best.candidate.romaji != null
            && String(candidate.romaji) !== String(best.candidate.romaji);
        return readingConflict || romajiConflict;
    });
    return conflicting ? null : best;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeStrongSourceSpanLexicalCandidateTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const best = findLongestStrongSourceSpanLexicalCandidate(tokens, index, sourceSpanCandidates);
        if (!best) { merged.push(tokens[index]); continue; }
        const candidate = best.candidate;
        const properName = candidate.category === 'name';
        const canonicalNameTokens = candidate.kind === 'proper-noun' && !sourceSpanLexicalCandidateHasStandaloneConsensus(candidate)
            ? getSourceSpanLexicalCandidateTokenizerConsensusTokens(candidate)
            : null;
        if (canonicalNameTokens && canonicalNameTokens.length > 1 && !canonicalNameTokens.some(token => token?.pos === '記号')) {
            merged.push(...canonicalNameTokens.map(token => offsetTokenWordPosition(token, candidate.sourceStart)));
            index = best.endIndex;
            continue;
        }
        merged.push(makeDerivedSpanToken(tokens, index, best.endIndex, {
            surface_form: candidate.sourceSurface,
            reading: candidate.reading || '*', pronunciation: candidate.reading || '*',
            pos: '名詞', pos_detail_1: properName ? '固有名詞' : '一般', pos_detail_2: properName ? '一般' : '*', pos_detail_3: '*',
            sourceSpanLexicalCandidateMatched: true,
            sourceSpanLexicalCandidateReading: candidate.reading || null,
            sourceSpanLexicalCandidateRomaji: candidate.romaji ?? null,
            sourceSpanLexicalCandidateKind: candidate.kind,
            sourceSpanLexicalCandidateSource: candidate.evidenceSource,
            sourceSpanLexicalCandidateConfidence: candidate.confidence
        }, {
            annotations: ['sourceSpanLexicalCandidateMatched', 'sourceSpanLexicalCandidateReading', 'sourceSpanLexicalCandidateRomaji', 'sourceSpanLexicalCandidateKind', 'sourceSpanLexicalCandidateSource', 'sourceSpanLexicalCandidateConfidence'],
            evidenceSource: candidate.evidenceSource, semanticRole: candidate.semanticRole || candidate.category,
            confidence: candidate.confidence, reviewRequired: false
        }));
        index = best.endIndex;
    }
    return merged;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeAuthoritativeSpanTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestAuthoritativeSpan(tokens, index, sourceSpanCandidates);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const evidence = bestMatch.evidence;
        const reviewedName = evidence.category === 'reviewed-name';
        const numericExpression = evidence.category === 'counter-date'
            && /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u.test(bestMatch.surface);
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: evidence.reading || '*',
            pronunciation: evidence.reading || '*',
            pos: '名詞',
            pos_detail_1: reviewedName ? '固有名詞' : '一般',
            pos_detail_2: reviewedName ? '人名' : '*',
            pos_detail_3: '*',
            authoritativeSpanMatched: true,
            authoritativeSpanReading: evidence.reading || null,
            authoritativeSpanRomaji: evidence.romaji || null,
            authoritativeSpanSource: evidence.source,
            authoritativeSpanConfidence: evidence.confidence,
            authoritativeSpanCategory: evidence.category,
            authoritativeSpanReviewRequired: Boolean(evidence.reviewRequired),
            authoritativeSpanReviewReason: evidence.reviewReason || null,
            authoritativeSpanReviewFlag: evidence.reviewFlag || null,
            authoritativeSpanVariantMappings: bestMatch.variant?.mappings || [],
            numericExpression
        }, {
            annotations: ['authoritativeSpanMatched', 'authoritativeSpanReading', 'authoritativeSpanRomaji', 'authoritativeSpanSource', 'authoritativeSpanConfidence', 'authoritativeSpanCategory', 'authoritativeSpanReviewRequired', 'authoritativeSpanReviewReason', 'authoritativeSpanReviewFlag', 'authoritativeSpanVariantMappings', 'numericExpression'],
            evidenceSource: evidence.source || 'authoritative-span',
            semanticRole: evidence.category || 'authoritative-span',
            confidence: evidence.confidence,
            reviewRequired: Boolean(evidence.reviewRequired)
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function normalizePunctuation(text) {
    const map = {
        '。':'.','、':',','？':'?','！':'!','：':':','；':';','（':'(', '）':')',
        '「':'"','」':'"','『':"'",'』':"'",'【':'[','】':']','〔':'(', '〕':')',
        '〈':'<','〉':'>','《':'<<','》':'>>','〖':'[','〗':']','〘':'[','〙':']','〚':'[','〛':']',
        '〝':'"','〟':'"','〞':'"','・':' ', '～':'~', '〜':'~', '〰':'~', '―':'—', '‥':'…', '⋯':'…', '⋮':'…'
    };
    const compatible = normalizeJapanesePunctuationCompatibility(String(text || ''));
    return compatible
        .replace(/[。、？！：；（）「」『』【】〔〕〈〉《》〖〗〘〙〚〛〝〟〞・～〜〰―‥⋯⋮]/g, match => map[match] ?? match)
        .replace(/(?:…\s*){2,}/g, '…');
}

function collapseRepeatedSpaces(text) { return String(text || '').replace(/ {2,}/g, ' '); }

const SINGLE_QUOTE_OPEN_MARKER = '\uE000';
const SINGLE_QUOTE_CLOSE_MARKER = '\uE001';
const DOUBLE_QUOTE_OPEN_MARKER = '\uE002';
const DOUBLE_QUOTE_CLOSE_MARKER = '\uE003';
const JAPANESE_WAVE_DELIMITER_MARKER = '\uE005';
const JAPANESE_HORIZONTAL_BAR_MARKER = '\uE00D';

function markJapaneseWaveDelimiters(text) {
    return String(text || '').replace(/[~～〜〰]/g, JAPANESE_WAVE_DELIMITER_MARKER);
}

function restoreJapaneseWaveDelimiters(text) {
    return String(text || '').replaceAll(JAPANESE_WAVE_DELIMITER_MARKER, '~');
}

function markJapaneseHorizontalBars(text) {
    return String(text || '').replace(/―/g, JAPANESE_HORIZONTAL_BAR_MARKER);
}

function restoreJapaneseHorizontalBars(text) {
    return String(text || '').replaceAll(JAPANESE_HORIZONTAL_BAR_MARKER, '—');
}

function normalizeJapaneseSubtitleBarSpacing(text) {
    const normalizeSegment = segment => {
        const value = String(segment || '');
        if (value.split(JAPANESE_HORIZONTAL_BAR_MARKER).length !== 3) return value;
        const match = value.match(new RegExp(`^(.+?)\\s*${JAPANESE_HORIZONTAL_BAR_MARKER}\\s*(.+?)\\s*${JAPANESE_HORIZONTAL_BAR_MARKER}([.!?…]*)$`, 'u'));
        if (!match || !match[1].trim() || !match[2].trim()) return value;
        return `${match[1].trimEnd()} ${JAPANESE_HORIZONTAL_BAR_MARKER} ${match[2].trim()} ${JAPANESE_HORIZONTAL_BAR_MARKER}${match[3] || ''}`;
    };
    return String(text || '').split(JAPANESE_WAVE_DELIMITER_MARKER).map(normalizeSegment).join(JAPANESE_WAVE_DELIMITER_MARKER);
}

function markJapaneseSingleQuotes(text) {
    const value = String(text || '')
        .replace(/『/g, SINGLE_QUOTE_OPEN_MARKER)
        .replace(/』/g, SINGLE_QUOTE_CLOSE_MARKER)
        .replace(/‘/g, SINGLE_QUOTE_OPEN_MARKER);
    return value.replace(/’/g, (match, offset, source) => {
        const previous = source[offset - 1] || '';
        const next = source[offset + 1] || '';
        return /[A-Za-z]/.test(previous) && /[A-Za-z]/.test(next) ? match : SINGLE_QUOTE_CLOSE_MARKER;
    });
}

function restoreJapaneseSingleQuotes(text) {
    return String(text || '').replaceAll(SINGLE_QUOTE_OPEN_MARKER, "'").replaceAll(SINGLE_QUOTE_CLOSE_MARKER, "'");
}

function markJapaneseDoubleQuotes(text) {
    return String(text || '')
        .replace(/[「“〝]/g, DOUBLE_QUOTE_OPEN_MARKER)
        .replace(/[」”〟〞]/g, DOUBLE_QUOTE_CLOSE_MARKER);
}

function restoreJapaneseDoubleQuotes(text) {
    return String(text || '').replaceAll(DOUBLE_QUOTE_OPEN_MARKER, '"').replaceAll(DOUBLE_QUOTE_CLOSE_MARKER, '"');
}

function normalizeSentenceSpacing(text) {
    const EMAIL_DOT_MARKER = '\uE004';
    const INTERNAL_DOT_MARKER = '\uE006';
    const INTERNAL_COMMA_MARKER = '\uE007';
    const INTERNAL_COLON_MARKER = '\uE008';
    const URL_QUESTION_MARKER = '\uE009';
    const URL_SEMICOLON_MARKER = '\uE00A';
    const URL_EXCLAMATION_MARKER = '\uE00B';
    const URL_COMMA_MARKER = '\uE00C';
    const protectUrlPunctuation = match => match
        .replace(/\?/g, URL_QUESTION_MARKER)
        .replace(/;/g, URL_SEMICOLON_MARKER)
        .replace(/!/g, URL_EXCLAMATION_MARKER)
        .replace(/,/g, URL_COMMA_MARKER);
    let value = String(text || '')
        .replace(/\bhttps?:\/\/[^\s"'<>]+/gi, protectUrlPunctuation)
        .replace(/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g, match => match.replace(/\./g, EMAIL_DOT_MARKER))
        .replace(/(?<=[A-Za-z0-9])\.(?=[A-Za-z0-9])/g, INTERNAL_DOT_MARKER)
        .replace(/(?<=[0-9]),(?=[0-9])/g, INTERNAL_COMMA_MARKER)
        .replace(/(?<=[0-9]):(?=[0-9])/g, INTERNAL_COLON_MARKER)
        .replace(/\s+([,.;:?!…\)\]\}>])/g, '$1')
        .replace(/([,.;:?!])(?=[A-Za-z0-9])/g, '$1 ')
        .replace(/…\s*(?=[A-Za-z0-9])/g, '… ')
        .replace(/([\(\[\{<])\s+/g, '$1')
        .replace(new RegExp(`${SINGLE_QUOTE_OPEN_MARKER}\\s+`, 'g'), SINGLE_QUOTE_OPEN_MARKER)
        .replace(new RegExp(`\\s+${SINGLE_QUOTE_CLOSE_MARKER}`, 'g'), SINGLE_QUOTE_CLOSE_MARKER)
        .replace(new RegExp(`([A-Za-z0-9])${SINGLE_QUOTE_OPEN_MARKER}`, 'g'), `$1 ${SINGLE_QUOTE_OPEN_MARKER}`)
        .replace(new RegExp(`${SINGLE_QUOTE_CLOSE_MARKER}(?=[A-Za-z0-9])`, 'g'), `${SINGLE_QUOTE_CLOSE_MARKER} `)
        .replace(new RegExp(`${DOUBLE_QUOTE_OPEN_MARKER}\\s+`, 'g'), DOUBLE_QUOTE_OPEN_MARKER)
        .replace(new RegExp(`\\s+${DOUBLE_QUOTE_CLOSE_MARKER}`, 'g'), DOUBLE_QUOTE_CLOSE_MARKER)
        .replace(new RegExp(`([A-Za-z0-9])${DOUBLE_QUOTE_OPEN_MARKER}`, 'g'), `$1 ${DOUBLE_QUOTE_OPEN_MARKER}`)
        .replace(new RegExp(`${DOUBLE_QUOTE_CLOSE_MARKER}(?=[A-Za-z0-9])`, 'g'), `${DOUBLE_QUOTE_CLOSE_MARKER} `)
        .replace(new RegExp(`([,.;:?!])(?=${SINGLE_QUOTE_OPEN_MARKER}|${DOUBLE_QUOTE_OPEN_MARKER})`, 'g'), '$1 ')
        .replace(/\s{2,}/g, ' ')
        .trimEnd();

    // Literal ASCII double quotes remain supported for already-Western text.
    value = value.replace(/\s*"\s*/g, '"');
    let rebuilt = '';
    let inQuote = false;
    for (let index = 0; index < value.length; index += 1) {
        const character = value[index];
        if (character !== '"') {
            rebuilt += character;
            continue;
        }
        if (!inQuote) {
            if (rebuilt && !/[\s\(\[\{<]/.test(rebuilt.slice(-1))) rebuilt += ' ';
            rebuilt += '"';
            inQuote = true;
        } else {
            rebuilt = rebuilt.replace(/\s+$/g, '');
            rebuilt += '"';
            inQuote = false;
            const next = value[index + 1] || '';
            if (next && !/\s/.test(next) && /[A-Za-z0-9]/.test(next)) rebuilt += ' ';
        }
    }

    // Delimiter-like punctuation has an explicit, stable output layout.
    rebuilt = rebuilt
        .replace(new RegExp(`\\s*${JAPANESE_WAVE_DELIMITER_MARKER}\\s*`, 'g'), ` ${JAPANESE_WAVE_DELIMITER_MARKER} `)
        .replace(new RegExp(`\\s*${JAPANESE_HORIZONTAL_BAR_MARKER}\\s*`, 'g'), JAPANESE_HORIZONTAL_BAR_MARKER)
        .replace(/\s*([—–])\s*/g, '$1')
        .replace(/\s*\|\s*/g, ' | ');
    rebuilt = normalizeJapaneseSubtitleBarSpacing(rebuilt)
        .replace(new RegExp(`\\s*${JAPANESE_WAVE_DELIMITER_MARKER}\\s*`, 'g'), ` ${JAPANESE_WAVE_DELIMITER_MARKER} `);

    for (const openMarker of [SINGLE_QUOTE_OPEN_MARKER, DOUBLE_QUOTE_OPEN_MARKER]) {
        rebuilt = rebuilt.replaceAll(`${openMarker} ${JAPANESE_WAVE_DELIMITER_MARKER}`, `${openMarker}${JAPANESE_WAVE_DELIMITER_MARKER}`);
    }
    for (const closeMarker of [SINGLE_QUOTE_CLOSE_MARKER, DOUBLE_QUOTE_CLOSE_MARKER]) {
        rebuilt = rebuilt.replaceAll(`${JAPANESE_WAVE_DELIMITER_MARKER} ${closeMarker}`, `${JAPANESE_WAVE_DELIMITER_MARKER}${closeMarker}`);
    }

    // Keep punctuation runs tight, but restore an external word boundary after
    // closing brackets/quotes and before opening brackets when ordinary words abut them.
    rebuilt = rebuilt
        .replace(/\s+([,.;:?!…\)\]\}>])/g, '$1')
        .replace(/([A-Za-z0-9])(?=[\(\[\{])/g, '$1 ')
        .replace(/([\)\]\}])(?=[A-Za-z0-9])/g, '$1 ')
        .replace(/([,.;:?!])(?=[A-Za-z0-9])/g, '$1 ')
        .replace(/…\s*(?=[A-Za-z0-9])/g, '… ');

    return rebuilt.replace(/ {2,}/g, ' ')
        .replace(/(?<=\d),\s+(?=\d{3}(?:\D|$))/g, ',')
        .replace(/(?<=\d):\s+(?=\d{2}(?:\D|$))/g, ':')
        .replaceAll(EMAIL_DOT_MARKER, '.')
        .replaceAll(INTERNAL_DOT_MARKER, '.')
        .replaceAll(INTERNAL_COMMA_MARKER, ',')
        .replaceAll(INTERNAL_COLON_MARKER, ':')
        .replaceAll(URL_QUESTION_MARKER, '?')
        .replaceAll(URL_SEMICOLON_MARKER, ';')
        .replaceAll(URL_EXCLAMATION_MARKER, '!')
        .replaceAll(URL_COMMA_MARKER, ',')
        .trim();
}

function hasTerminalPairedWaveDelimiter(sourceText) {
    const source = canonicalizeTokenizerBoundaryCharacters(String(sourceText || '')).trim();
    const positions = [];
    for (let index = 0; index < source.length; index += 1) if (source[index] === '~') positions.push(index);
    if (positions.length < 2) return false;
    const closeIndex = positions[positions.length - 1];
    const openIndex = positions[positions.length - 2];
    const inner = source.slice(openIndex + 1, closeIndex).trim();
    const trailing = source.slice(closeIndex + 1);
    return Boolean(inner) && /^[。！？.!?…'"」』）】〕〉》\]\)}]*$/u.test(trailing);
}

function normalizeTerminalPairedWaveSpacing(text, sourceText) {
    if (!hasTerminalPairedWaveDelimiter(sourceText)) return String(text || '');
    const value = String(text || '');
    const closeIndex = value.lastIndexOf(JAPANESE_WAVE_DELIMITER_MARKER);
    if (closeIndex < 0) return value;
    const openIndex = value.lastIndexOf(JAPANESE_WAVE_DELIMITER_MARKER, closeIndex - 1);
    if (openIndex < 0) return value;
    const inner = value.slice(openIndex + 1, closeIndex).trim();
    if (!inner) return value;
    const prefix = value.slice(0, openIndex).trimEnd();
    const suffix = value.slice(closeIndex + 1).trimStart();
    return `${prefix}${prefix ? ' ' : ''}${JAPANESE_WAVE_DELIMITER_MARKER}${inner}${JAPANESE_WAVE_DELIMITER_MARKER}${suffix}`;
}

function hasTerminalPairedAsciiHyphenDelimiter(sourceText) {
    const source = normalizeJapanesePunctuationCompatibility(String(sourceText || '')).trim();
    const closeIndex = source.lastIndexOf('-');
    if (closeIndex < 0 || !/^[。！？.!?…'"」』）】〕〉》\]\)}]*$/u.test(source.slice(closeIndex + 1))) return false;
    for (let openIndex = closeIndex - 1; openIndex >= 0; openIndex -= 1) {
        if (source[openIndex] !== '-') continue;
        if (openIndex > 0 && !/\s/u.test(source[openIndex - 1])) continue;
        if (!source.slice(openIndex + 1, closeIndex).trim()) continue;
        return true;
    }
    return false;
}

function normalizeTerminalPairedAsciiHyphenSegment(text, sourceText) {
    if (!hasTerminalPairedAsciiHyphenDelimiter(sourceText)) return String(text || '');
    const value = String(text || '');
    const leading = value.match(/^\s*/u)?.[0] || '';
    const trailing = value.match(/\s*$/u)?.[0] || '';
    const coreEnd = Math.max(leading.length, value.length - trailing.length);
    const core = value.slice(leading.length, coreEnd);
    const closeIndex = core.lastIndexOf('-');
    if (closeIndex < 0) return value;
    let openIndex = -1;
    for (let index = closeIndex - 1; index >= 0; index -= 1) {
        if (core[index] === '-') { openIndex = index; break; }
    }
    if (openIndex < 0) return value;
    const inner = core.slice(openIndex + 1, closeIndex).trim();
    if (!inner) return value;
    const prefix = core.slice(0, openIndex).trimEnd();
    const suffix = core.slice(closeIndex + 1).trimStart();
    return `${leading}${prefix}${prefix ? ' ' : ''}-${inner}-${suffix}${trailing}`;
}

function normalizeTerminalPairedAsciiHyphenSpacing(text, sourceText) {
    const outputSegments = String(text || '').split(JAPANESE_WAVE_DELIMITER_MARKER);
    const sourceSegments = canonicalizeTokenizerBoundaryCharacters(String(sourceText || '')).split('~');
    if (outputSegments.length !== sourceSegments.length) return normalizeTerminalPairedAsciiHyphenSegment(text, sourceText);
    return outputSegments
        .map((segment, index) => normalizeTerminalPairedAsciiHyphenSegment(segment, sourceSegments[index]))
        .join(JAPANESE_WAVE_DELIMITER_MARKER);
}

function normalizeRule0OutputPunctuation(text, sourceText = text) {
    const compatible = normalizeJapanesePunctuationCompatibility(text);
    const marked = markJapaneseHorizontalBars(markJapaneseWaveDelimiters(markJapaneseDoubleQuotes(markJapaneseSingleQuotes(compatible))));
    let spaced = normalizeSentenceSpacing(collapseRepeatedSpaces(normalizePunctuation(marked)));
    spaced = normalizeTerminalPairedWaveSpacing(spaced, sourceText);
    spaced = normalizeTerminalPairedAsciiHyphenSpacing(spaced, sourceText);
    return restoreJapaneseHorizontalBars(restoreJapaneseDoubleQuotes(restoreJapaneseSingleQuotes(restoreJapaneseWaveDelimiters(spaced))));
}

function findExactOverride(candidateText, overrideMap) {
    const text = String(candidateText || '');
    const trimmed = text.trim();
    if (hasOwn.call(overrideMap, text)) return { value: overrideMap[text], directMatch: true };
    if (trimmed !== text && hasOwn.call(overrideMap, trimmed)) return { value: overrideMap[trimmed], directMatch: true };
    const { coreText } = splitTrailingPunctuation(text);
    if (coreText !== text && hasOwn.call(overrideMap, coreText)) return { value: overrideMap[coreText], directMatch: false };
    return null;
}

function getParticleReading(token) {
    if (!isParticle(token)) return null;
    return { 'は':'わ', 'へ':'え', 'を':'お' }[token.surface_form] || null;
}

function getLoanwordReviewFlag(token) {
    if (!token || isParticle(token) || isGrammaticalToken(token)) return null;
    const metadata = getLoanwordMetadataForToken(token);
    if (!metadata?.requiresReview) return null;
    const canonicalOutput = getLoanwordOutputForToken(token);
    const hasMaterialAlternate = metadata.ambiguitySignificance === 'material'
        || (metadata.alternates || []).some(item => item.significance === 'material');
    if (canonicalOutput && hasMaterialAlternate) {
        return token.contextualLoanwordEvidenceMatched ? null : 'loanword-source-ambiguous';
    }
    return 'missing-source-spelling-evidence';
}

function needsSourceSpellingReview(token) {
    return getLoanwordReviewFlag(token) === 'missing-source-spelling-evidence';
}

const REVIEW_SIGNAL_POLICY = Object.freeze({
    'exact-dictionary-rescue': { category: 'evidence', requiresReview: false, rationale: 'Reviewed dictionary rescue.' },
    'fallback-reading': { category: 'evidence', requiresReview: false, rationale: 'Lower-confidence but permitted fallback evidence.' },
    'historical-kana-attested': { category: 'historical-orthography', requiresReview: false, rationale: 'Attested historical-kana evidence.' },
    'source-span-kana-evidence': { category: 'tokenisation', requiresReview: false, rationale: 'Kana lexical evidence was selected independently of Kuromoji boundaries.' },
    'orthographic-particle-inferred': { category: 'grammar', requiresReview: true, rationale: 'Katakana particle orthography was selected from a syntactic frame after the tokenizer did not identify it as grammar.' },
    'orthographic-pronunciation': { category: 'orthography', requiresReview: false, rationale: 'Safe orthographic pronunciation evidence.' },
    'rendaku-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested Rendaku evidence.' },
    'rendaku-blocked-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested non-Rendaku evidence.' },
    'variant-reading-evidence': { category: 'orthography', requiresReview: false, rationale: 'Reviewed character-variant evidence.' },
    'reviewed-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A reviewed preferred reading was selected while legitimate alternatives remain.' },
    'numeric-role-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A numeric/counter role remains incompatible with a viable lexical interpretation.' },
    'temporal-role-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A temporal surface retains more than one structurally valid role after contextual resolution.' },
    'reviewed-numeric-alias': { category: 'orthography', requiresReview: false, rationale: 'A reviewed numeric orthographic alias was resolved through canonical numeric context.' },
    'proper-noun-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible proper-name readings remain.' },
    'general-word-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible general-word readings remain.' },
    'general-word-coverage-incomplete': { category: 'evidence-coverage', requiresReview: false, rationale: 'The compact general-word bank does not prove that all applicable readings for this spelling are represented; final review policy is decided by reading arbitration.' },
    'general-word-alternative': { category: 'ambiguity', requiresReview: true, rationale: 'Alternative general-word readings are materially plausible.' },
    'general-word-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'General-word evidence conflicts with the selected reading.' },
    'whole-word-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Whole-word evidence does not resolve one reading.' },
    'contextual-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Structured sentence context does not distinguish the supported readings strongly enough.' },
    'sentence-context-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'The final sentence-level verification pass still cannot distinguish the supported readings safely.' },
    'reading-evidence-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'Independent reading evidence conflicts with the selected reading.' },
    'missing-source-spelling-evidence': { category: 'source-spelling', requiresReview: true, rationale: 'Source-language spelling is required but not established.' },
    'loanword-source-ambiguous': { category: 'source-spelling', requiresReview: true, rationale: 'A canonical source-language spelling is available, but a materially plausible donor alternative remains unresolved by context.' },
    'unreviewed-country-language-form': { category: 'lexical-policy', requiresReview: true, rationale: 'A country name followed by 語 lacks reviewed whole-span language evidence and therefore stays in Japanese romanisation pending review.' },
    'name-context-ambiguous': { category: 'name-context', requiresReview: true, rationale: 'Name-like context is not backed by reviewed whole-name evidence.' },
    'unresolved-reading': { category: 'unresolved', requiresReview: true, rationale: 'No safe reading was resolved.' },
    'japanese-han-scope-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'The character is positively in Japanese scope; the best evidence-backed candidate is emitted while legitimate alternatives remain.' },
    'kanji-compositional-fallback': { category: 'ambiguity', requiresReview: true, rationale: 'No whole-word reading evidence resolved the Han span, so character-level Japanese reading evidence was composed as a reviewable fallback.' },
    'unknown-han-scope': { category: 'scope', requiresReview: true, rationale: 'Han input lacks positive Japanese-use evidence and is not eligible for guessed Japanese reading resolution.' },
    'unsupported-script': { category: 'unsupported-script', requiresReview: true, rationale: 'The source contains unsupported non-Latin script.' },
    'kanji-output-blocked': { category: 'output-guard', requiresReview: true, rationale: 'The output guard blocked unresolved Han.' },
    'nonlatin-output-blocked': { category: 'output-guard', requiresReview: true, rationale: 'The output guard blocked unresolved non-Latin script.' },
    'terminal-sokuon-review': { category: 'sokuon', requiresReview: true, rationale: 'A terminal sokuon has no following consonant to double and requires review.' },
    'repeated-sokuon-review': { category: 'sokuon', requiresReview: true, rationale: 'Repeated sokuon is stylised and requires review.' },
    'non-geminative-sokuon-review': { category: 'sokuon', requiresReview: true, rationale: 'Sokuon before a non-geminative unit cannot use normal consonant doubling and requires review.' },
    'historical-full-size-sokuon-ambiguity': { category: 'historical-orthography', requiresReview: true, rationale: 'Historical full-sized つ/ツ could represent a geminate without attested evidence.' },
    'numeric-literal-lexical-ambiguity': { category: 'numeric-lexical', requiresReview: true, rationale: 'A numeral-shaped surface is being used lexically or as a name.' },
    'iteration-mark-unattested': { category: 'orthography', requiresReview: true, rationale: 'An iteration mark repeats preceding Japanese material, but the resulting word-level reading is not backed by reviewed evidence.' },
    'japanese-orthography-unresolved': { category: 'orthography', requiresReview: true, rationale: 'The source uses recognised Japanese orthography, but no safe contextual reading was resolved.' },
    'tokenisation-boundary-ambiguous': { category: 'tokenisation', requiresReview: true, rationale: 'Two evidence-backed token boundaries remain plausible, so the selected segmentation requires review.' },
    'kana-tokenisation-boundary-unreviewed': { category: 'tokenisation', requiresReview: true, rationale: 'A contiguous Katakana span was split into lexical tokens without reviewed boundary evidence, so the tokenizer boundary requires review.' },
    'structural-boundary-uncertain': { category: 'tokenisation', requiresReview: true, rationale: 'The final word boundary rests only on tokenizer segmentation between contiguous lexical material and remains reviewable.' },
    'final-boundary-invariant-violation': { category: 'output-consistency', requiresReview: true, rationale: 'Final rendered boundary metadata contradicts retained lexical, grammatical or morphological evidence.' },
    'unreviewed-cross-notation': { category: 'mixed-script', requiresReview: true, rationale: 'The × notation is preserved because no reviewed title/context evidence establishes whether it is silent, spoken, or rendered as a separator.' }
});

const DEFAULT_REVIEW_SIGNAL_POLICY = Object.freeze({
    category: 'unclassified',
    requiresReview: true,
    rationale: 'Unclassified uncertainty signals require review until a policy is registered.'
});

function getReviewSignalPolicy(flag) {
    return REVIEW_SIGNAL_POLICY[String(flag || '')] || DEFAULT_REVIEW_SIGNAL_POLICY;
}

const WEAK_LEXICAL_REVIEW_FLAGS = Object.freeze(new Set([
    'general-word-alternative',
    'whole-word-reading-ambiguous'
]));

const ROLE_RESOLVABLE_LEXICAL_REVIEW_FLAGS = Object.freeze(new Set([
    'general-word-alternative',
    'general-word-conflict',
    'reading-evidence-conflict',
    'whole-word-reading-ambiguous'
]));

const PRODUCTIVE_COUNTER_REVIEW_SURFACES = Object.freeze(new Set([
    '人','月','日','年','つ','匹','疋','本','個','歳','才','時','分','秒','枚','冊','台','回','階'
]));

function transitionReviewSignal(signal, state, details = {}) {
    const nextState = String(state || signal?.state || 'candidate');
    const lifecycle = Array.isArray(signal?.lifecycle) && signal.lifecycle.length
        ? [...signal.lifecycle]
        : [String(signal?.state || 'candidate')];
    if (lifecycle[lifecycle.length - 1] !== nextState) lifecycle.push(nextState);
    const policyRequiresReview = Boolean(signal?.policyRequiresReview ?? getReviewSignalPolicy(signal?.flag).requiresReview);
    return {
        ...signal,
        ...details,
        policyRequiresReview,
        state: nextState,
        lifecycle,
        requiresReview: policyRequiresReview && nextState === 'final-active'
    };
}

/** @returns {CJ2RReviewSignal} */
function makeReviewSignal(surface, flag, source, confidence, options = {}) {
    const policy = getReviewSignalPolicy(flag);
    const initialState = options.state || (policy.requiresReview ? 'candidate' : 'resolved');
    const sourceStart = Number.isInteger(options.sourceStart) ? options.sourceStart : null;
    const sourceEnd = Number.isInteger(options.sourceEnd) ? options.sourceEnd : null;
    return {
        surface: String(surface || ''),
        flag: String(flag || ''),
        reasonCode: String(options.reasonCode || flag || 'unclassified'),
        source: String(source || 'unresolved'),
        evidenceSource: String(options.evidenceSource || source || 'unresolved'),
        confidence: Number(confidence ?? 0),
        category: policy.category,
        sourceStart,
        sourceEnd,
        sourceSurface: options.sourceSurface == null ? null : String(options.sourceSurface),
        policyRequiresReview: policy.requiresReview,
        requiresReview: policy.requiresReview && initialState === 'final-active',
        rationale: policy.rationale,
        state: initialState,
        lifecycle: [initialState],
        resolutionReason: options.resolutionReason || null,
        supersededBy: options.supersededBy || null
    };
}

function makeReviewSignals(surface, source, confidence, flags, options = {}) {
    return [...new Set(Array.isArray(flags) ? flags : [])].map(flag => makeReviewSignal(surface, flag, source, confidence, options));
}

function getReviewSignalOwnership(token) {
    return {
        sourceStart: Number.isInteger(token?.sourceStart) ? token.sourceStart : null,
        sourceEnd: Number.isInteger(token?.sourceEnd) ? token.sourceEnd : null,
        sourceSurface: token?.sourceSurface ?? token?.surface_form ?? null
    };
}

function getResolutionReviewSignals(resolution, surface, token = null) {
    const source = resolution?.source || 'unresolved';
    const confidence = Number(resolution?.confidence ?? 0);
    const flags = [...new Set(Array.isArray(resolution?.flags) ? resolution.flags : [])];
    const ownership = getReviewSignalOwnership(token);
    const existing = Array.isArray(resolution?.reviewSignals) ? resolution.reviewSignals.map(signal => ({
        ...signal,
        reasonCode: String(signal?.reasonCode || signal?.flag || 'unclassified'),
        evidenceSource: String(signal?.evidenceSource || signal?.source || source),
        sourceStart: Number.isInteger(signal?.sourceStart) ? signal.sourceStart : ownership.sourceStart,
        sourceEnd: Number.isInteger(signal?.sourceEnd) ? signal.sourceEnd : ownership.sourceEnd,
        sourceSurface: signal?.sourceSurface ?? ownership.sourceSurface,
        lifecycle: [...(signal.lifecycle || [])]
    })) : [];
    const represented = new Set(existing.map(signal => signal.flag));
    for (const signal of makeReviewSignals(surface, source, confidence, flags.filter(flag => !represented.has(flag)), ownership)) existing.push(signal);
    return existing;
}

function isReviewTransparentWrapperToken(token) {
    const surface = String(token?.surface_form || '');
    return Boolean(surface && /^[「」『』（）()［］\[\]【】〈〉《》〔〕〘〙〚〛“”‘’〝〟〞"']+$/u.test(surface));
}

function isReviewContextBoundaryToken(token) {
    const surface = String(token?.surface_form || '');
    if (!surface || isReviewTransparentWrapperToken(token)) return false;
    for (let index = 0; index < surface.length; index += 1) {
        if (isCanonicalHardBoundaryAt(surface, index)) return true;
    }
    return false;
}

function hasIndependentSentenceContext(tokenResults, tokenIndex) {
    const tokens = tokenResults || [];
    for (const direction of [-1, 1]) {
        for (let index = tokenIndex + direction; index >= 0 && index < tokens.length; index += direction) {
            const token = tokens[index];
            if (!token) continue;
            if (isReviewContextBoundaryToken(token)) break;
            const surface = String(token.surface_form || '');
            if (!surface || (token.pos === '記号' && !/[\p{L}\p{N}]/u.test(surface))) continue;
            return true;
        }
    }
    return false;
}

function isContextSelectedLexicalResolution(resolution) {
    const source = String(resolution?.source || '');
    return source === 'kuromoji-context'
        || source === 'kuromoji+general-word'
        || source.startsWith('sentence-context-verification+kuromoji-context')
        || source.startsWith('sentence-context-verification+kuromoji+general-word');
}

function isOpenClassNominalToken(token) {
    return Boolean(token
        && token.pos === '名詞'
        && !isParticle(token)
        && !isGrammaticalToken(token)
        && !isPrefix(token)
        && !isSuffix(token));
}

function isTypedBoundaryToken(token) {
    const resolutionSource = String(token?.readingResolution?.source || '');
    return Boolean(token && (
        token.typedTemporalExpressionMatched
        || token.typedNumericExpressionMatched
        || token.numericExpression
        || token.typedTemporalExpressionType
        || token.typedNumericExpressionType
        || resolutionSource.startsWith('typed-')
        || resolutionSource.startsWith('counter-date-reading-evidence')
        || resolutionSource.startsWith('reviewed-numeric-alias')
    ));
}

function isNominalCompoundNeighbor(token) {
    if (!isOpenClassNominalToken(token) || isTypedBoundaryToken(token)) return false;
    const surface = String(token?.surface_form || '');
    const resolutionSource = String(token?.readingResolution?.source || '');
    if (/^[ぁ-ゖァ-ンヴー]+$/u.test(surface) && resolutionSource === 'written-kana') return false;
    return true;
}

function hasUnresolvedNominalCompoundAdjacency(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    if (!isOpenClassNominalToken(token) || isTypedBoundaryToken(token)) return false;
    for (const neighborIndex of [tokenIndex - 1, tokenIndex + 1]) {
        const neighbor = tokenResults?.[neighborIndex];
        if (!isNominalCompoundNeighbor(neighbor)) continue;
        const left = neighborIndex < tokenIndex ? neighbor : token;
        const right = neighborIndex < tokenIndex ? token : neighbor;
        const leftPosition = Number(left?.word_position || 0);
        const rightPosition = Number(right?.word_position || 0);
        if (leftPosition > 0 && rightPosition > 0) {
            const expectedRightPosition = leftPosition + Array.from(String(left.surface_form || '')).length;
            if (rightPosition === expectedRightPosition) return true;
            continue;
        }
        return true;
    }
    return false;
}

function hasUnresolvedMorphologicalCompoundAdjacency(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex] || null;
    const next = tokenResults?.[tokenIndex + 1] || null;
    const isCompoundJoin = item => Boolean(
        item?.morphologicalJoinLeft
        && String(item.morphologicalJoinReason || '') === 'continuative-stem-compound-verb'
        && /morphology/u.test(String(item.morphologicalJoinAuthority || ''))
    );
    return Boolean(isCompoundJoin(token) || isCompoundJoin(next));
}

function shouldSupersedeWeakLexicalSignal(signal, resolution, tokenResults, tokenIndex, tokenSignals) {
    if (!WEAK_LEXICAL_REVIEW_FLAGS.has(signal?.flag)) return false;
    if (!resolution?.reading || resolution?.ambiguous || Number(resolution?.confidence || 0) < 0.75) return false;
    if (!isContextSelectedLexicalResolution(resolution) || !hasIndependentSentenceContext(tokenResults, tokenIndex)) return false;
    if (hasUnresolvedNominalCompoundAdjacency(tokenResults, tokenIndex)) return false;
    if (hasUnresolvedMorphologicalCompoundAdjacency(tokenResults, tokenIndex)) return false;
    const strongerActiveSignal = (tokenSignals || []).some(other =>
        other !== signal
        && Boolean(other?.policyRequiresReview ?? getReviewSignalPolicy(other?.flag).requiresReview)
        && !WEAK_LEXICAL_REVIEW_FLAGS.has(other?.flag)
    );
    return !strongerActiveSignal;
}

function sourceSpanCandidateContainsToken(candidate, token) {
    return Boolean(candidate
        && Number.isInteger(candidate.sourceStart)
        && Number.isInteger(candidate.sourceEnd)
        && Number.isInteger(token?.sourceStart)
        && Number.isInteger(token?.sourceEnd)
        && candidate.sourceStart <= token.sourceStart
        && candidate.sourceEnd >= token.sourceEnd);
}

function hasResolvedNumericStructure(tokenResults, tokenIndex, sourceSpanCandidates) {
    const token = tokenResults?.[tokenIndex];
    if (!token || token.typedNumericRoleReviewRequired || token.outputBoundaryRequiresReview) return false;
    const candidates = (sourceSpanCandidates || []).filter(candidate =>
        ['numeric', 'counter', 'temporal'].includes(String(candidate?.category || ''))
        && candidate.reviewRequired !== true
        && sourceSpanCandidateContainsToken(candidate, token));
    if (!candidates.length) return false;
    if (token.outputBoundaryAuthority === 'typed-numeric') return true;
    const next = tokenResults?.[tokenIndex + 1];
    if (next?.outputBoundaryAuthority === 'typed-numeric' && !next.outputBoundaryRequiresReview) return true;
    return candidates.some(candidate =>
        ['counter', 'temporal'].includes(String(candidate.category || ''))
        && Number(candidate.confidence || 0) >= 0.72
        && Boolean(candidate.reading || candidate.metadata?.unit));
}

function hasResolvedProductiveCounterContext(tokenResults, tokenIndex, sourceSpanCandidates) {
    const token = tokenResults?.[tokenIndex];
    const previous = tokenResults?.[tokenIndex - 1];
    if (!token || !previous || !PRODUCTIVE_COUNTER_REVIEW_SURFACES.has(String(token.surface_form || ''))) return false;
    if (token.outputBoundaryBefore !== 'join' || token.outputBoundaryRequiresReview || token.typedNumericRoleReviewRequired) return false;
    if (!['suffix-boundary', 'numeric-assembly-rule', 'typed-numeric-boundary'].includes(String(token.outputBoundaryReason || ''))
        && token.outputBoundaryAuthority !== 'typed-numeric') return false;
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'numeric'
        && candidate.reviewRequired !== true
        && sourceSpanCandidateContainsToken(candidate, previous));
}

function hasResolvedMorphologicalSuffixRole(token) {
    return Boolean(token?.suffix
        && token?.outputBoundaryBefore === 'join'
        && token?.outputBoundaryReason === 'suffix-boundary'
        && token?.outputBoundaryAuthority === 'morphology'
        && !token?.outputBoundaryRequiresReview);
}

function hasResolvedInflectedIchidanReading(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const next = tokenResults?.[tokenIndex + 1];
    if (!token || token.pos !== '動詞' || token.conjugated_type !== '一段' || token.conjugated_form === '基本形') return false;
    if (!next?.grammatical || next.outputBoundaryBefore !== 'join' || next.outputBoundaryAuthority !== 'grammar') return false;
    const basicForm = String(token.basic_form || '');
    const selectedReading = normalizeKanaReading(token.readingResolution?.reading || token.reading || '');
    if (!basicForm || basicForm === String(token.surface_form || '') || !selectedReading) return false;
    const candidates = getGeneralWordCandidates(getGeneralWordLookup(basicForm));
    if (candidates.length < 2) return false;
    const compatible = candidates.filter(candidate => {
        const reading = normalizeKanaReading(candidate.reading || '');
        return reading.endsWith('る') && reading.slice(0, -1) === selectedReading;
    });
    return compatible.length === 1;
}

function getResolvedRoleReviewSupersession(signal, tokenResults, tokenIndex, sourceSpanCandidates) {
    if (!ROLE_RESOLVABLE_LEXICAL_REVIEW_FLAGS.has(signal?.flag)) return null;
    const token = tokenResults?.[tokenIndex];
    if (hasResolvedMorphologicalSuffixRole(token)) {
        return {
            resolutionReason: 'Final morphology established a suffix role incompatible with the earlier lexical interpretation.',
            supersededBy: 'resolved-morphological-suffix-role'
        };
    }
    if (hasResolvedInflectedIchidanReading(tokenResults, tokenIndex)) {
        return {
            resolutionReason: 'Conjugation evidence uniquely identifies the selected Ichidan stem reading among the whole-verb candidates.',
            supersededBy: 'resolved-inflected-ichidan-reading'
        };
    }
    if (WEAK_LEXICAL_REVIEW_FLAGS.has(signal.flag) && hasResolvedNumericStructure(tokenResults, tokenIndex, sourceSpanCandidates)) {
        return {
            resolutionReason: 'Final typed numeric structure superseded the earlier weak lexical interpretation.',
            supersededBy: 'resolved-numeric-role'
        };
    }
    if (hasResolvedProductiveCounterContext(tokenResults, tokenIndex, sourceSpanCandidates)) {
        return {
            resolutionReason: 'Final productive counter morphology established a non-lexical counter role for this source span.',
            supersededBy: 'resolved-productive-counter-role'
        };
    }
    return null;
}

function shouldSupersedeResolvedOrthographicParticleSignal(signal, token) {
    return signal?.flag === 'orthographic-particle-inferred'
        && Boolean(token?.orthographicParticleInferred)
        && Boolean(token?.particle)
        && Boolean(token?.grammatical)
        && token?.outputBoundaryAuthority === 'grammar'
        && !token?.outputBoundaryRequiresReview;
}

function finalizeTokenReviewSignals(tokenResults, tokenIndex, sourceSpanCandidates = []) {
    const token = tokenResults?.[tokenIndex];
    const resolution = token?.readingResolution;
    const surface = String(token?.surface_form || resolution?.surface || '');
    const tokenSignals = getResolutionReviewSignals(resolution, surface, token);
    return tokenSignals.map(original => {
        const policyRequiresReview = Boolean(original?.policyRequiresReview ?? getReviewSignalPolicy(original?.flag).requiresReview);
        if (!policyRequiresReview) return transitionReviewSignal(original, 'resolved');
        if (original?.state === 'superseded') return transitionReviewSignal(original, 'superseded');
        if (original?.state === 'resolved') return transitionReviewSignal(original, 'resolved');
        const active = transitionReviewSignal(original, 'active');
        if (shouldSupersedeWeakLexicalSignal(active, resolution, tokenResults, tokenIndex, tokenSignals)) {
            return transitionReviewSignal(active, 'superseded', {
                resolutionReason: 'Full-sentence lexical resolution selected one supported reading without an independent evidence conflict.',
                supersededBy: String(resolution?.source || 'context-selected-reading')
            });
        }
        if (shouldSupersedeResolvedOrthographicParticleSignal(active, token)) {
            return transitionReviewSignal(active, 'superseded', {
                resolutionReason: 'Final grammatical reconstruction established the standalone particle role and output boundary.',
                supersededBy: 'resolved-grammatical-boundary'
            });
        }
        const roleSupersession = getResolvedRoleReviewSupersession(active, tokenResults, tokenIndex, sourceSpanCandidates);
        if (roleSupersession) return transitionReviewSignal(active, 'superseded', roleSupersession);
        return transitionReviewSignal(active, 'final-active');
    });
}

function makeFinalReviewSignal(surface, flag, source, confidence = 1, ownership = {}) {
    const signal = makeReviewSignal(surface, flag, source, confidence, ownership);
    return signal.policyRequiresReview ? transitionReviewSignal(transitionReviewSignal(signal, 'active'), 'final-active') : signal;
}

function mergeReadingResolutionCandidates(...candidateGroups) {
    const byReading = new Map();
    for (const group of candidateGroups) {
        for (const candidate of group || []) {
            const reading = normalizeKanaReading(candidate?.reading || '');
            if (!reading) continue;
            const existing = byReading.get(reading);
            const categories = new Set([...(existing?.categories || []), ...(candidate?.categories || [])]);
            const sources = new Set([...(existing?.sources || []), ...(candidate?.sources || [])]);
            const weight = Math.max(Number(existing?.weight || 0), Number(candidate?.weight || 0));
            const ranks = [existing?.rank, candidate?.rank].filter(value => value !== null && value !== undefined && Number.isFinite(Number(value))).map(Number);
            byReading.set(reading, {
                ...(existing || {}),
                ...candidate,
                reading: candidate?.reading || existing?.reading || reading,
                romaji: candidate?.romaji || existing?.romaji || convertToRomaji(reading),
                weight,
                rank: ranks.length ? Math.min(...ranks) : null,
                categories,
                sources
            });
        }
    }
    return [...byReading.values()];
}

function makeSelectedReadingCandidate(reading, source = 'kuromoji-token-reading') {
    const normalized = normalizeKanaReading(reading || '');
    if (!normalized) return null;
    return {
        reading: normalized,
        romaji: convertToRomaji(normalized),
        weight: 100,
        rank: null,
        categories: new Set(['lexical']),
        sources: new Set([source])
    };
}

/** @returns {CJ2RReadingResolution} */
/** @param {CJ2RToken} token */
function makeReadingResolution(token, options = {}) {
    const surface = String(token?.surface_form || '');
    const source = options.source || 'unresolved';
    const confidence = Number(options.confidence ?? 0);
    const flags = [...new Set(Array.isArray(options.flags) ? options.flags : [])];
    const providedReviewSignals = Array.isArray(options.reviewSignals)
        ? options.reviewSignals.map(signal => ({ ...signal, lifecycle: [...(signal?.lifecycle || [])] }))
        : [];
    const representedReviewFlags = new Set(providedReviewSignals.map(signal => signal.flag));
    const reviewSignals = [
        ...providedReviewSignals,
        ...makeReviewSignals(surface, source, confidence, flags.filter(flag => !representedReviewFlags.has(flag)))
    ];
    return {
        surface,
        reading: options.reading || null,
        romaji: Object.prototype.hasOwnProperty.call(options, 'romaji') ? options.romaji : null,
        source,
        confidence,
        candidates: Array.isArray(options.candidates) ? options.candidates : [],
        flags,
        variantMappings: Array.isArray(options.variantMappings) ? options.variantMappings : [],
        ambiguous: Boolean(options.ambiguous),
        hanScope: options.hanScope || null,
        scopeEvidence: Array.isArray(options.scopeEvidence) ? options.scopeEvidence : [],
        reviewSignals
    };
}

/** @param {CJ2RToken} token */
function resolveTokenReading(token, sourceText) {
    if (!token) return makeReadingResolution(token);
    if (token.contextualOverrideMatched && token.contextualRomaji) return makeReadingResolution(token, { romaji: token.contextualRomaji, source: 'contextual-override', confidence: 1 });
    if (token.titleReadingEvidenceMatched && token.titleReadingEvidenceRomaji != null) return makeReadingResolution(token, {
        reading: token.titleReadingEvidenceReading || null, romaji: token.titleReadingEvidenceRomaji,
        source: `title-reading-evidence:${token.titleReadingEvidenceKind || 'reviewed'}`, confidence: 1
    });
    if (token.reviewedProperNameSpanMatched && token.reviewedProperNameSpanRomaji) return makeReadingResolution(token, { reading: token.reading, romaji: token.reviewedProperNameSpanRomaji, source: 'reviewed-proper-name-span', confidence: 1 });
    if (token.reviewedNameHonorificMatched && token.reviewedNameHonorificReading) return makeReadingResolution(token, { reading: token.reviewedNameHonorificReading, source: 'reviewed-name-honorific', confidence: 1 });
    if (token.typedTemporalExpressionMatched && token.typedTemporalReading) return makeReadingResolution(token, { reading: token.typedTemporalReading, source: token.typedTemporalSource || 'typed-temporal-expression', confidence: 0.99 });
    if (token.typedNumericExpressionMatched && token.typedNumericReading) return makeReadingResolution(token, {
        reading: token.typedNumericReading,
        source: token.typedNumericSource || 'typed-numeric-expression',
        confidence: token.typedNumericRoleReviewRequired ? 0.82 : 0.99,
        flags: token.typedNumericRoleReviewRequired ? ['numeric-role-ambiguous'] : []
    });
    if (token.structuredFractionRole === 'denominator-unit' && token.structuredFractionReading) return makeReadingResolution(token, {
        reading: token.structuredFractionReading, source: token.structuredFractionSource || 'fraction-structure', confidence: 1
    });
    if (['denominator-numeral', 'numerator-numeral'].includes(String(token.structuredFractionRole || ''))) {
        const fractionNumeralReading = getKuromojiDictionaryReading(token);
        if (fractionNumeralReading) return makeReadingResolution(token, {
            reading: fractionNumeralReading, source: 'fraction-numeral-structure', confidence: 0.99
        });
    }
    if (token.sourceSpanLexicalCandidateMatched) return makeReadingResolution(token, {
        reading: token.sourceSpanLexicalCandidateReading || token.reading,
        romaji: token.sourceSpanLexicalCandidateRomaji ?? null,
        source: token.sourceSpanLexicalCandidateSource || 'source-span-lexical-reconstruction',
        confidence: token.sourceSpanLexicalCandidateConfidence || 0.9
    });
    if (token.authoritativeSpanMatched) {
        const authoritativeReviewFlag = token.authoritativeSpanCategory === 'loanword'
            ? getLoanwordReviewFlag(token)
            : (token.authoritativeSpanReviewRequired
                ? (token.authoritativeSpanReviewFlag || (token.authoritativeSpanCategory === 'loanword-review' ? 'missing-source-spelling-evidence' : 'reviewed-reading-ambiguous'))
                : null);
        return makeReadingResolution(token, {
            reading: token.authoritativeSpanReading || token.reading,
            romaji: token.authoritativeSpanRomaji || null,
            source: token.authoritativeSpanSource || 'authoritative-span-evidence',
            confidence: authoritativeReviewFlag ? Math.min(token.authoritativeSpanConfidence || 0.98, 0.86) : token.authoritativeSpanConfidence || 0.98,
            flags: [
                ...((token.authoritativeSpanVariantMappings || []).length ? ['variant-reading-evidence'] : []),
                ...(authoritativeReviewFlag ? [authoritativeReviewFlag] : [])
            ],
            variantMappings: token.authoritativeSpanVariantMappings || []
        });
    }
    if (token.reviewedNumericAliasMatched && token.reviewedNumericAliasReading) return makeReadingResolution(token, {
        reading: token.reviewedNumericAliasReading,
        romaji: token.reviewedNumericAliasRomaji || null,
        source: token.reviewedNumericAliasSource ? `reviewed-numeric-alias+${token.reviewedNumericAliasSource}` : 'reviewed-numeric-alias',
        confidence: 0.99,
        flags: ['reviewed-numeric-alias']
    });
    if (token.latinPassthroughMatched && token.latinPassthroughOutput) return makeReadingResolution(token, { romaji: token.latinPassthroughOutput, source: 'latin-source-passthrough', confidence: 1 });
    if (token.fullGrammaticalExpression && runtimeState.particleExpressions[token.surface_form]) return makeReadingResolution(token, { romaji: runtimeState.particleExpressions[token.surface_form].toLowerCase(), source: 'particle-expression', confidence: 1 });
    if (token.fullGrammaticalExpression && fallbackGrammaticalExpressionMap[token.surface_form]) return makeReadingResolution(token, { romaji: fallbackGrammaticalExpressionMap[token.surface_form].toLowerCase(), source: 'grammatical-expression-fallback', confidence: 1, flags: ['fallback-reading'] });
    if (token.knownPhraseMatched && token.knownPhraseValue) return makeReadingResolution(token, { romaji: token.knownPhraseValue.toLowerCase(), source: token.knownPhraseSource || 'whole-word-lexicon', confidence: 0.99 });
    if (isGrammaticalToken(token) && runtimeState.particleExpressions[token.surface_form]) return makeReadingResolution(token, { romaji: runtimeState.particleExpressions[token.surface_form].toLowerCase(), source: 'particle-expression', confidence: 1 });
    if (token.orthographicParticleInferred) return makeReadingResolution(token, {
        reading: token.reading || 'ノ',
        source: token.orthographicParticleEvidenceSource || 'orthographic-particle-inference',
        confidence: token.orthographicParticleReviewRequired ? 0.74 : 0.9,
        flags: token.orthographicParticleReviewRequired ? ['orthographic-particle-inferred'] : []
    });
    const particleReading = getParticleReading(token);
    if (particleReading) return makeReadingResolution(token, { reading: particleReading, source: 'particle-pronunciation', confidence: 1 });
    if (token.contextualLoanwordEvidenceMatched && token.contextualLoanwordEvidenceOutput) return makeReadingResolution(token, { romaji: token.contextualLoanwordEvidenceOutput, source: 'contextual-loanword-evidence', confidence: 0.98, candidates: token.contextualLoanwordEvidenceCandidates || [] });
    if (token.loanwordMatched && token.loanwordOutput) {
        const reviewFlag = getLoanwordReviewFlag(token);
        return makeReadingResolution(token, { romaji: token.loanwordOutput, source: 'loanword-lexicon', confidence: reviewFlag ? 0.86 : 1, flags: reviewFlag ? [reviewFlag] : [] });
    }
    const loanwordOutput = getLoanwordOutputForToken(token);
    if (loanwordOutput) {
        const reviewFlag = getLoanwordReviewFlag(token);
        return makeReadingResolution(token, { romaji: loanwordOutput, source: 'loanword-lexicon', confidence: reviewFlag ? 0.86 : 1, flags: reviewFlag ? [reviewFlag] : [] });
    }
    const explicitCommonWordContext = selectCommonWordRule(token.surface_form, sourceText, false);
    if (explicitCommonWordContext?.reading) return makeReadingResolution(token, { reading: explicitCommonWordContext.reading, romaji: explicitCommonWordContext.romaji || null, source: explicitCommonWordContext.romaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.contextualReadingEvidenceMatched && token.contextualReadingEvidenceReading) return makeReadingResolution(token, { reading: token.contextualReadingEvidenceReading, romaji: token.contextualReadingEvidenceRomaji || null, source: 'contextual-reading-evidence', confidence: 0.96, candidates: token.contextualReadingEvidenceCandidates || [] });
    if (token.commonWordMatched && token.commonWordReading) return makeReadingResolution(token, { reading: token.commonWordReading, romaji: token.commonWordRomaji || null, source: token.commonWordRomaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.historicalKanaEvidenceMatched && token.historicalKanaEvidenceReading) return makeReadingResolution(token, { reading: token.historicalKanaEvidenceReading, source: 'historical-kana-evidence', confidence: 0.99, flags: ['historical-kana-attested'] });
    if (token.rendakuEvidenceMatched && token.rendakuEvidenceReading) return makeReadingResolution(token, { reading: token.rendakuEvidenceReading, source: 'rendaku-evidence', confidence: 0.99, flags: [token.rendakuApplied ? 'rendaku-attested' : 'rendaku-blocked-attested'] });
    if (token.exactDictionaryRescueMatched && token.exactDictionaryRescueSource === 'kuromoji-exact-proper-name') return makeReadingResolution(token, { reading: token.pronunciation, source: token.exactDictionaryRescueSource, confidence: token.exactDictionaryRescueConfidence || 0.93, flags: ['exact-dictionary-rescue'] });
    if (token.kanaLexicalSpanMatched && token.kanaLexicalSpanReading) return makeReadingResolution(token, { reading: token.kanaLexicalSpanReading, source: 'kana-whole-word-evidence', confidence: 0.98, flags: ['source-span-kana-evidence'] });
    const kanaOnly = isMechanicallyRomanisableKanaSurface(token.surface_form);
    if (kanaOnly) {
        const sourceSpellingFlags = needsSourceSpellingReview(token) ? ['missing-source-spelling-evidence'] : [];
        const policyFlags = token.countryLanguageReviewRequired ? ['unreviewed-country-language-form'] : [];
        const reviewFlags = [...sourceSpellingFlags, ...policyFlags];
        const orthographicPronunciation = getKanaOrthographicPronunciation(token);
        if (orthographicPronunciation) return makeReadingResolution(token, { reading: orthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: reviewFlags.length ? 0.65 : 1, flags: ['orthographic-pronunciation', ...reviewFlags] });
        return makeReadingResolution(token, { reading: token.surface_form, source: 'written-kana', confidence: reviewFlags.length ? 0.65 : 1, flags: reviewFlags });
    }
    const mixedOrthographicPronunciation = getMixedScriptOrthographicPronunciation(token);
    if (mixedOrthographicPronunciation) return makeReadingResolution(token, { reading: mixedOrthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: 0.99, flags: ['orthographic-pronunciation'] });
    const commonWordRule = getCommonWordRuleForToken(token, sourceText);
    if (commonWordRule?.reading) return makeReadingResolution(token, { reading: commonWordRule.reading, romaji: commonWordRule.romaji || null, source: commonWordRule.romaji ? 'reviewed-common-word-romaji' : 'whole-word-context', confidence: 1 });
    if (token.atejiMatched && token.atejiReading) return makeReadingResolution(token, { reading: token.atejiReading, source: 'ateji-lexicon', confidence: 0.99 });
    if (token.generalWordMatched && token.generalWordReading) return makeReadingResolution(token, {
        reading: token.generalWordReading,
        source: 'general-word-span-fallback',
        confidence: token.generalWordAmbiguous ? 0.78 : 0.86,
        candidates: token.generalWordCandidates || [],
        flags: ['fallback-reading', ...(token.generalWordAmbiguous ? ['general-word-ambiguous'] : []), ...(token.generalWordCoverageIncomplete ? ['general-word-coverage-incomplete'] : []), ...((token.generalWordVariantMappings || []).length ? ['variant-reading-evidence'] : [])],
        variantMappings: token.generalWordVariantMappings || []
    });
    if (token.ordinaryCompoundReadingMatched && token.ordinaryCompoundReading) return makeReadingResolution(token, {
        reading: token.ordinaryCompoundReading,
        source: 'ordinary-compound-context',
        confidence: 0.98,
        candidates: token.ordinaryCompoundReadingCandidates || []
    });
    const reviewedPreference = getReviewedReadingPreference(token);
    const reviewedCandidates = reviewedPreference ? getReviewedReadingCandidates(token) : [];
    const properNounResolution = resolveProperNounReading(token);
    if (properNounResolution?.reading) return makeReadingResolution(token, properNounResolution);
    if (token.iterationMarkFallbackMatched && token.iterationMarkFallbackReading) return makeReadingResolution(token, {
        reading: token.iterationMarkFallbackReading, source: 'iteration-mark-fallback', confidence: 0.55, flags: ['iteration-mark-unattested']
    });
    const kuromojiReading = getKuromojiDictionaryReading(token);
    if (reviewedPreference) {
        const selectedReading = reviewedReadingMatches(kuromojiReading, reviewedPreference)
            && normalizeKanaReading(kuromojiReading) === normalizeKanaReading(reviewedPreference.reading)
            ? kuromojiReading
            : reviewedPreference.reading;
        return makeReadingResolution(token, {
            reading: selectedReading,
            source: kuromojiReading && reviewedReadingMatches(kuromojiReading, reviewedPreference)
                ? 'reviewed-reading+kuromoji'
                : 'reviewed-reading-preference',
            confidence: 0.82,
            candidates: reviewedCandidates,
            flags: ['reviewed-reading-ambiguous'],
            ambiguous: true
        });
    }
    if (kuromojiReading) {
        const evidenceAssessment = getReadingEvidenceAssessment(token, kuromojiReading);
        const generalAssessment = assessGeneralWordReading(token, kuromojiReading);
        const kuromojiAmbiguity = assessKuromojiWholeWordAmbiguity(token, kuromojiReading);
        const nameContextCandidates = token.nameContextAmbiguous ? getProperNounCandidateLookup(token.surface_form).candidates : [];
        const flags = [];
        if (token.nameContextAmbiguous) flags.push('name-context-ambiguous');
        if (token.contextualReadingEvidenceAmbiguous) flags.push('contextual-reading-ambiguous');
        const loanwordReviewFlag = getLoanwordReviewFlag(token);
        if (loanwordReviewFlag) flags.push(loanwordReviewFlag);
        let confidence = properNounResolution?.ambiguous ? 0.78 : 0.92;
        if (token.contextualReadingEvidenceAmbiguous) confidence = Math.min(confidence, 0.72);
        let source = 'kuromoji-context';
        if (evidenceAssessment) { flags.push('reading-evidence-conflict'); confidence = Math.min(confidence, 0.68); }
        if (properNounResolution?.ambiguous) flags.push('proper-noun-ambiguous');
        if (generalAssessment?.matched) {
            source = 'kuromoji+general-word';
            confidence = generalAssessment.matchedIndex === 0 ? 0.97 : 0.90;
            if (generalAssessment.candidates.length > 1) flags.push('general-word-alternative');
        } else if (generalAssessment?.conflict) {
            flags.push('general-word-conflict');
            confidence = Math.min(confidence, 0.68);
        }
        if (kuromojiAmbiguity) {
            flags.push('whole-word-reading-ambiguous');
            confidence = Math.min(confidence, 0.78);
        }
        const selectedCandidate = makeSelectedReadingCandidate(kuromojiReading);
        const candidates = mergeReadingResolutionCandidates(
            selectedCandidate ? [selectedCandidate] : [],
            token.contextualReadingEvidenceCandidates || [],
            properNounResolution?.candidates || [],
            nameContextCandidates,
            kuromojiAmbiguity?.candidates || [],
            generalAssessment?.candidates || [],
            getReadingEvidenceCandidates(token)
        );
        const unresolvedReadingConflict = Boolean(
            evidenceAssessment
            || properNounResolution?.ambiguous
            || token.contextualReadingEvidenceAmbiguous
            || generalAssessment?.conflict
        );
        return makeReadingResolution(token, {
            reading: kuromojiReading, source, confidence, candidates, flags,
            variantMappings: generalAssessment?.variantMappings || [],
            ambiguous: unresolvedReadingConflict
        });
    }
    const compoundReading = getCompoundReadingForToken(token);
    if (compoundReading) return makeReadingResolution(token, { reading: compoundReading, source: 'whole-word-compound-fallback', confidence: 0.82, flags: ['fallback-reading'] });
    const generalWordFallback = resolveGeneralWordFallback(token);
    if (generalWordFallback?.reading) return makeReadingResolution(token, generalWordFallback);
    const evidenceFallback = getReadingEvidenceFallback(token);
    if (evidenceFallback?.reading) return makeReadingResolution(token, {
        reading: evidenceFallback.reading,
        source: 'frequency-evidence-fallback',
        confidence: evidenceFallback.ambiguous ? 0.62 : 0.72,
        candidates: evidenceFallback.candidates || [],
        flags: ['fallback-reading', ...(evidenceFallback.ambiguous ? ['whole-word-reading-ambiguous'] : [])],
        ambiguous: Boolean(evidenceFallback.ambiguous)
    });
    if (properNounResolution?.ambiguous) {
        const properSurface = String(token.surface_form || '');
        const supportedSingleHan = isHanCharacter(properSurface) ? classifyHanCharacterScope(properSurface) : null;
        if (supportedSingleHan?.scope === 'japanese-scope') {
            const topCandidate = rankProperNounCandidates(properNounResolution.candidates || []).ranked[0] || null;
            if (topCandidate?.reading || topCandidate?.romaji) {
                return makeReadingResolution(token, {
                    ...properNounResolution,
                    reading: topCandidate.reading || null,
                    romaji: topCandidate.romaji || null,
                    source: `${properNounResolution.source || 'proper-noun-ambiguous'}-candidate-fallback`,
                    confidence: Math.max(0.30, Number(properNounResolution.confidence || 0.30)),
                    flags: [...new Set([...(properNounResolution.flags || []).filter(flag => flag !== 'unresolved-reading'), 'proper-noun-ambiguous', 'fallback-reading'])],
                    ambiguous: true,
                    hanScope: 'japanese-scope',
                    scopeEvidence: [supportedSingleHan]
                });
            }
        }
        return makeReadingResolution(token, properNounResolution);
    }
    if (generalWordFallback?.ambiguous) return makeReadingResolution(token, generalWordFallback);
    const surface = String(token.surface_form || '');
    const unresolvedKanji = containsHan(surface);
    if (!unresolvedKanji && isJapaneseOrthographicReadingSurface(surface)) {
        return makeReadingResolution(token, {
            romaji: '[Unresolved]',
            source: 'japanese-orthography-unresolved',
            confidence: 0.30,
            flags: ['unresolved-reading', 'japanese-orthography-unresolved']
        });
    }
    const unsupportedScript = Array.from(surface).some(character => /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character));
    if (unresolvedKanji) {
        const scope = classifyHanSurfaceScope(surface);
        if (scope.scope === 'japanese-scope') {
            /** @type {any[]} */
            const scopeCharacters = scope.characters || [];
            const candidates = scopeCharacters.flatMap(item => item.candidates || []);
            const pureHanCharacters = Array.from(surface).filter(isHanCharacter);
            const preferOnReading = pureHanCharacters.length > 1 && pureHanCharacters.length === Array.from(surface).length;
            const selectedByCharacter = scopeCharacters.map(item => {
                const itemCandidates = item.candidates || [];
                const selected = preferOnReading
                    ? itemCandidates.find(candidate => candidate.categories?.includes('kanjidic-on')) || itemCandidates[0]
                    : itemCandidates[0];
                return { item, selected };
            });
            if (selectedByCharacter.some(entry => !entry.selected?.reading)) {
                return makeReadingResolution(token, {
                    reading: surface,
                    source: 'japanese-scope-data-gap',
                    confidence: 0.20,
                    candidates,
                    flags: ['unresolved-reading'],
                    hanScope: 'japanese-scope',
                    scopeEvidence: scopeCharacters
                });
            }

            let hanIndex = 0;
            const fallbackReading = Array.from(surface).map(character => {
                if (!isHanCharacter(character)) return normalizeKanaReading(character);
                const selected = selectedByCharacter[hanIndex]?.selected;
                hanIndex += 1;
                return selected?.reading || character;
            }).join('');
            const singleCharacter = isHanCharacter(surface) && scopeCharacters.length === 1;
            const selectedCandidate = singleCharacter ? selectedByCharacter[0].selected : null;
            const reviewedScope = singleCharacter && scopeCharacters[0]?.evidence?.some(item => item.source === 'reviewed-japanese-han-scope');
            const ambiguous = scopeCharacters.some(item => (item.candidates || []).length > 1);
            const variantEvidence = scopeCharacters.some(item => item.evidence?.some(evidence => evidence.source === 'general-kanji-variant' || evidence.source === 'name-kanji-variant'));
            if (singleCharacter && selectedCandidate?.reading && reviewedScope && !ambiguous) {
                return makeReadingResolution(token, {
                    reading: selectedCandidate.reading,
                    romaji: selectedCandidate.romaji || null,
                    source: 'japanese-scope-reviewed-single',
                    confidence: 0.88,
                    candidates,
                    flags: variantEvidence ? ['variant-reading-evidence'] : [],
                    ambiguous: false,
                    hanScope: 'japanese-scope',
                    scopeEvidence: scopeCharacters
                });
            }
            return makeReadingResolution(token, {
                reading: fallbackReading,
                source: singleCharacter ? 'japanese-scope-character-fallback' : 'japanese-scope-compositional-fallback',
                confidence: ambiguous ? 0.55 : 0.65,
                candidates,
                flags: [
                    'fallback-reading',
                    ...(ambiguous ? ['japanese-han-scope-ambiguous'] : []),
                    ...(!singleCharacter ? ['kanji-compositional-fallback'] : []),
                    ...(variantEvidence ? ['variant-reading-evidence'] : [])
                ],
                ambiguous,
                hanScope: 'japanese-scope',
                scopeEvidence: scopeCharacters
            });
        }
        return makeReadingResolution(token, {
            reading: surface,
            source: 'unknown-han-scope',
            confidence: 0.10,
            flags: ['unknown-han-scope'],
            hanScope: 'unknown-scope',
            scopeEvidence: scope.characters
        });
    }
    return makeReadingResolution(token, {
        reading: surface,
        source: unsupportedScript ? 'unresolved-script' : 'surface-fallback',
        confidence: unsupportedScript ? 0.20 : 0.55,
        flags: unsupportedScript ? ['unresolved-reading', 'unsupported-script'] : ['fallback-reading']
    });
}

const SENTENCE_CONTEXT_REVISABLE_SOURCES = Object.freeze([
    'kuromoji-context', 'kuromoji+general-word', 'whole-word-compound-fallback',
    'general-word-span-fallback', 'general-word-fallback', 'frequency-evidence-fallback',
    'surface-fallback', 'japanese-scope-character-fallback', 'japanese-scope-compositional-fallback', 'japanese-scope-data-gap', 'japanese-orthography-unresolved', 'unknown-han-scope', 'unresolved-script'
]);

function isSentenceContextRevisableResolution(resolution) {
    const source = String(resolution?.source || '');
    return SENTENCE_CONTEXT_REVISABLE_SOURCES.some(prefix => source === prefix || source.startsWith(`${prefix}+`) || source.startsWith(`${prefix}:`));
}

function makeSentenceContextVerifiedResolution(token, provisional, evaluation) {
    const selected = evaluation?.selected || null;
    if (!selected) return provisional;
    const selectedReading = normalizeKanaReading(selected.reading || '');
    if (!selectedReading) return provisional;
    const flags = (provisional?.flags || []).filter(flag => flag !== 'contextual-reading-ambiguous' && flag !== 'sentence-context-ambiguous');
    const supersededFlags = new Set(['contextual-reading-ambiguous', 'sentence-context-ambiguous']);
    const reviewSignals = getResolutionReviewSignals(provisional, String(token?.surface_form || provisional?.surface || '')).map(signal => {
        if (!supersededFlags.has(signal?.flag)) return signal;
        return transitionReviewSignal(signal, 'superseded', {
            resolutionReason: 'Sentence-level contextual evidence selected one supported reading.',
            supersededBy: 'sentence-context-verification'
        });
    });
    return makeReadingResolution(token, {
        reading: selected.reading,
        romaji: selected.romaji || null,
        source: `sentence-context-verification+${provisional?.source || 'unresolved'}`,
        confidence: Math.max(0.96, Math.min(0.99, Number(provisional?.confidence || 0) + 0.08)),
        candidates: evaluation.candidates || provisional?.candidates || [],
        flags,
        reviewSignals,
        variantMappings: provisional?.variantMappings || [],
        ambiguous: false,
        hanScope: provisional?.hanScope || null,
        scopeEvidence: provisional?.scopeEvidence || []
    });
}

function makeSentenceLoanwordContextVerifiedResolution(token, provisional, evaluation) {
    const selected = evaluation?.selected || null;
    if (!selected?.output) return provisional;
    const flags = (provisional?.flags || []).filter(flag => flag !== 'loanword-source-ambiguous');
    const reviewSignals = getResolutionReviewSignals(provisional, String(token?.surface_form || provisional?.surface || '')).map(signal => {
        if (signal?.flag !== 'loanword-source-ambiguous') return signal;
        return transitionReviewSignal(signal, 'superseded', {
            resolutionReason: 'Sentence-level context selected one reviewed source-language spelling.',
            supersededBy: 'sentence-context-loanword'
        });
    });
    return makeReadingResolution(token, {
        reading: provisional?.reading || null,
        romaji: selected.output,
        source: `sentence-context-loanword+${provisional?.source || 'loanword-lexicon'}`,
        confidence: 0.99,
        candidates: evaluation.candidates || provisional?.candidates || [],
        flags,
        reviewSignals,
        variantMappings: provisional?.variantMappings || [],
        ambiguous: false,
        hanScope: provisional?.hanScope || null,
        scopeEvidence: provisional?.scopeEvidence || []
    });
}

function makeSentenceContextAmbiguousResolution(token, provisional, evaluation) {
    if (!isSentenceContextRevisableResolution(provisional)) return provisional;
    const flags = [...new Set([...(provisional?.flags || []), 'sentence-context-ambiguous'])];
    return makeReadingResolution(token, {
        reading: provisional?.reading || null,
        romaji: provisional?.romaji || null,
        source: provisional?.source || 'unresolved',
        confidence: Math.min(Number(provisional?.confidence || 0), 0.70),
        candidates: evaluation?.candidates?.length ? evaluation.candidates : provisional?.candidates || [],
        flags,
        variantMappings: provisional?.variantMappings || [],
        ambiguous: true,
        hanScope: provisional?.hanScope || null,
        scopeEvidence: provisional?.scopeEvidence || []
    });
}

/** @param {CJ2RToken[]} tokens */
function verifySentenceLevelResolutions(tokens, provisionalResolutions, sourceText) {
    return (tokens || []).map((token, index) => {
        let provisional = provisionalResolutions[index] || makeReadingResolution(token);
        const loanwordMetadata = getLoanwordMetadataForToken(token);
        if (loanwordMetadata?.context) {
            const loanwordEvaluation = evaluateContextualLoanwordEvidence(tokens, index, loanwordMetadata, { finalPass: true, sourceText });
            if (loanwordEvaluation.selected) provisional = makeSentenceLoanwordContextVerifiedResolution(token, provisional, loanwordEvaluation);
        }
        const evidence = getContextualReadingEvidenceForToken(token);
        if (!evidence) return provisional;
        const evaluation = evaluateContextualReadingEvidence(tokens, index, evidence, { finalPass: true, sourceText });
        if (evaluation.selected) {
            if (!isSentenceContextRevisableResolution(provisional)) return provisional;
            return makeSentenceContextVerifiedResolution(token, provisional, evaluation);
        }
        return makeSentenceContextAmbiguousResolution(token, provisional, evaluation);
    });
}

function blockUnresolvedHanFromRomaji(value) {
    let unresolvedRun = false;
    let guarded = '';
    for (const character of Array.from(String(value || ''))) {
        const unsupportedLetter = /\p{L}/u.test(character) && !/\p{Script=Latin}/u.test(character);
        const unsupportedMark = unresolvedRun && /\p{M}/u.test(character);
        if (unsupportedLetter || unsupportedMark) {
            if (!unresolvedRun) guarded += '[Unresolved]';
            unresolvedRun = true;
            continue;
        }
        unresolvedRun = false;
        guarded += character;
    }
    return guarded.replace(/\[Unresolved\](?:\s*\[Unresolved\])+/g, '[Unresolved]');
}

function getOutputGuardFlags(value) {
    const text = String(value || '');
    const flags = [];
    if (containsHan(text)) flags.push('kanji-output-blocked');
    const hasOtherNonLatinLetter = Array.from(text).some(character =>
        /\p{L}/u.test(character)
        && !/\p{Script=Latin}/u.test(character)
        && !/\p{Script=Han}/u.test(character)
    );
    if (hasOtherNonLatinLetter) flags.push('nonlatin-output-blocked');
    return flags;
}

/** @param {CJ2RToken} token @param {string} sourceText @param {CJ2RReadingResolution|null} [resolutionOverride] */
function convertToken(token, sourceText, resolutionOverride = null) {
    const resolution = resolutionOverride || resolveTokenReading(token, sourceText);
    token.readingResolution = resolution;
    let result = resolution.romaji != null ? resolution.romaji : convertToRomaji(resolution.reading || token.surface_form || '');
    const guardedResult = blockUnresolvedHanFromRomaji(result);
    if (guardedResult !== result) {
        for (const flag of getOutputGuardFlags(result)) {
            if (!resolution.flags.includes(flag)) resolution.flags.push(flag);
        }
        result = guardedResult;
    }
    if (isParticle(token) || token.fullGrammaticalExpression || isSuffix(token) || isNominalizer(token) || isGrammaticalToken(token)) return result.toLowerCase();
    return result;
}

const spacedSuffixSurfaces = new Set(['さん','さま','様','くん','君','ちゃん','氏']);
function shouldSpaceSuffix(token) { return spacedSuffixSurfaces.has(token?.surface_form); }
function shouldDetachSuffixFromParticleHost(previousToken, token) {
    return Boolean(token?.suffix && previousToken && (previousToken.particle || isParticle(previousToken)));
}
function needsSpaceBeforeGrammaticalExpression(previousToken) {
    return Boolean(previousToken && previousToken.pos !== '記号' && !previousToken.prefix);
}
function isNumericExpressionToken(token) {
    return Boolean(token && (token.pos_detail_1 === '数' || token.numericExpression || isJapaneseNumeralSurface(token.surface_form)));
}

function isSeparatedNumericUnit(token) {
    return Boolean(token && isSeparatedNumericUnitSurface(token.surface_form));
}

function shouldSeparateNumericTokens(previousToken, token) {
    if (!isNumericExpressionToken(previousToken)) return false;
    if (isSeparatedNumericUnit(token)) return true;
    if (!isNumericExpressionToken(token)) return false;
    if (isLargeNumericUnitSurface(token.surface_form)) return false;
    return numericGroupTerminalPattern.test(String(previousToken.surface_form || ''));
}

function shouldJoinNumericTokens(previousToken, token) {
    return isNumericExpressionToken(previousToken) && isNumericExpressionToken(token) && !shouldSeparateNumericTokens(previousToken, token);
}

function isClockHourComponentToken(token) {
    if (!token) return false;
    if (token.typedNumericExpressionType === 'clock-hour') return true;
    const surface = String(token.surface_form || '');
    if (/^[〇零一二三四五六七八九十百0-9]+時$/u.test(surface)) return true;
    return surface === '時' && token.pos === '名詞' && token.pos_detail_1 === '接尾' && token.pos_detail_2 === '助数詞';
}

function shouldSeparateClockTimeComponents(previousToken, token) {
    return Boolean(
        isClockHourComponentToken(previousToken)
        && token?.typedNumericExpressionType === 'minute-counter'
    );
}

function needsCrossTokenApostrophe(previousToken, token) {
    if (!previousToken || !token || token.particle || token.grammatical || token.nominalizer || token.prefix || shouldSeparateNumericTokens(previousToken, token)) return false;
    const previousReading = previousToken.readingResolution?.reading || previousToken.surface_form || '';
    const currentReading = token.readingResolution?.reading || token.surface_form || '';
    return needsSyllabicNApostrophe(previousReading, currentReading);
}

function shouldJoinReviewedTitleCompactNumericSuffix(previousToken, token) {
    return Boolean(
        previousToken?.titleReadingEvidenceKind === 'title-compact-numeric-prefix'
        && token?.readingResolution?.source === 'latin-source-passthrough'
        && /^[0-9]+\/[0-9]+(?:~)?$/u.test(String(token.surface_form || ''))
    );
}

function makeOutputBoundaryDecision(type, reason, authority, requiresReview = false) {
    return { type, reason, authority, requiresReview: Boolean(requiresReview) };
}

function sourceBoundaryIsContiguous(previousToken, token) {
    return Number.isInteger(previousToken?.sourceEnd)
        && Number.isInteger(token?.sourceStart)
        && previousToken.sourceEnd === token.sourceStart;
}

function isUnreviewedTokenizerFallbackBoundary(previousToken, token) {
    if (!sourceBoundaryIsContiguous(previousToken, token)) return false;
    if (token?.reviewedLexicalBoundaryBefore || token?.tokenizationRoleBoundaryBefore) return false;
    if (previousToken?.pos === '記号' || token?.pos === '記号') return false;
    const previousSurface = String(previousToken?.surface_form || '');
    const currentSurface = String(token?.surface_form || '');
    if (!previousSurface || !currentSurface) return false;
    const kanaAdjacency = isKanaSurface(previousSurface) && isKanaSurface(currentSurface);
    const nominalAdjacency = previousToken?.pos === '名詞' && token?.pos === '名詞';
    const mechanicalKanaReadings = previousToken?.readingResolution?.source === 'written-kana'
        && token?.readingResolution?.source === 'written-kana';
    const substantialFragments = Array.from(previousSurface).length >= 2 && Array.from(currentSurface).length >= 2;
    return kanaAdjacency && nominalAdjacency && mechanicalKanaReadings && substantialFragments;
}

function classifyTokenStructuralBoundaryDecision(previousToken, token) {
    if (!previousToken) return makeOutputBoundaryDecision('none', 'start-of-output', 'source');
    if (token.titleSeparator) return makeOutputBoundaryDecision('space', 'reviewed-title-separator', 'reviewed-title');
    if (previousToken.crossNotationSymbol && !previousToken.titleSeparator) return makeOutputBoundaryDecision('tight', 'cross-notation', 'orthography');
    if (shouldJoinReviewedTitleCompactNumericSuffix(previousToken, token)) return makeOutputBoundaryDecision('join', 'reviewed-title-compact-numeric-suffix', 'reviewed-title');
    if (token.readingResolution?.source === 'latin-source-passthrough') return makeOutputBoundaryDecision('space', 'latin-source-passthrough', 'source');
    if (token.nameContinuation) return makeOutputBoundaryDecision(token.nameGivenStart ? 'space' : 'join', token.nameGivenStart ? 'person-name-given-name-boundary' : 'person-name-continuation', 'name-structure');
    if (previousToken.pos === '形容詞' && token.surface_form === 'な') return makeOutputBoundaryDecision('space', 'adjectival-na-boundary', 'grammar');
    if (shouldSeparateClockTimeComponents(previousToken, token)) return makeOutputBoundaryDecision('space', 'typed-clock-component-boundary', 'typed-numeric');
    if (shouldSeparateNumericTokens(previousToken, token)) return makeOutputBoundaryDecision('space', 'numeric-separation-rule', 'typed-numeric');
    if (shouldJoinNumericTokens(previousToken, token)) return makeOutputBoundaryDecision('join', 'numeric-assembly-rule', 'typed-numeric');
    if (token.joinLeftAfterSokuon) return makeOutputBoundaryDecision('join', 'sokuon-orthographic-join', 'orthography');
    if (token.morphologicalJoinLeft) return makeOutputBoundaryDecision('join', token.morphologicalJoinReason || 'morphological-join', token.morphologicalJoinAuthority || 'morphology');
    if (token.fullGrammaticalExpression) return makeOutputBoundaryDecision(needsSpaceBeforeGrammaticalExpression(previousToken) ? 'space' : 'join', 'reviewed-grammatical-expression', 'grammar');
    if (token.particle || token.nominalizer || token.prefix) return makeOutputBoundaryDecision('space', token.nominalizer ? 'nominalizer-boundary' : token.prefix ? 'prefix-boundary' : 'particle-boundary', 'grammar');
    if (token.suffix) {
        if (shouldDetachSuffixFromParticleHost(previousToken, token)) return makeOutputBoundaryDecision('space', 'suffix-invalid-particle-host', 'grammar');
        return makeOutputBoundaryDecision(shouldSpaceSuffix(token) ? 'space' : 'join', 'suffix-boundary', 'morphology');
    }
    if (previousToken.prefix) return makeOutputBoundaryDecision('join', 'prefix-attachment', 'morphology');
    if (token.grammatical) return makeOutputBoundaryDecision(token.startsSeparateAuxiliaryUnit ? 'space' : 'join', token.startsSeparateAuxiliaryUnit ? 'separate-auxiliary-unit' : 'attached-grammatical-unit', 'grammar');
    if (token.pos === '記号' && !containsHan(token.surface_form) && !isKanaSurface(token.surface_form)) {
        return makeOutputBoundaryDecision('tight', 'orthographic-symbol', 'orthography');
    }
    return makeOutputBoundaryDecision('space', 'tokenizer-fallback', 'tokenizer', isUnreviewedTokenizerFallbackBoundary(previousToken, token));
}

function classifyTokenStructuralBoundary(previousToken, token) {
    return classifyTokenStructuralBoundaryDecision(previousToken, token).type;
}

/** @param {CJ2RToken|null|undefined} previousToken @param {CJ2RToken} token */
function classifyTokenOutputBoundaryDecision(previousToken, token) {
    const decision = classifyTokenStructuralBoundaryDecision(previousToken, token);
    if (decision.type === 'join' && needsCrossTokenApostrophe(previousToken, token)) {
        return { ...decision, type: 'apostrophe', reason: `${decision.reason}+syllabic-n-apostrophe` };
    }
    return decision;
}

/** @param {CJ2RToken|null|undefined} previousToken @param {CJ2RToken} token */
function classifyTokenOutputBoundary(previousToken, token) {
    return classifyTokenOutputBoundaryDecision(previousToken, token).type;
}

function formatOutputTokenValue(previousToken, token, boundary) {
    if (token.titleSeparator) return token.value;
    if (['latin-source-passthrough', 'loanword-lexicon', 'source-language-loanword'].includes(token.readingResolution?.source)) return token.value;
    if (token.nameContinuation) return token.nameGivenStart ? capitalizeRomaji(token.value) : token.value.toLowerCase();
    if (previousToken?.pos === '形容詞' && token.surface_form === 'な') return token.value;
    if (shouldSeparateNumericTokens(previousToken, token)) return capitalizeRomaji(token.value);
    if (boundary === 'apostrophe' || boundary === 'join') return token.value.toLowerCase();
    if (token.fullGrammaticalExpression || token.particle || token.nominalizer) return token.value.toLowerCase();
    if (token.prefix) return capitalizeRomaji(token.value);
    if (token.suffix && shouldDetachSuffixFromParticleHost(previousToken, token)) return capitalizeRomaji(token.value);
    if (token.suffix || previousToken?.prefix) return token.value.toLowerCase();
    if (token.grammatical) return runtimeState.capitalizedAuxiliarySurfaces.has(token.surface_form)
        ? capitalizeRomaji(token.value)
        : token.value.toLowerCase();
    return capitalizeRomaji(token.value);
}

function appendTokenOutput(joined, previousToken, token) {
    const boundary = token.outputBoundaryBefore || classifyTokenOutputBoundary(previousToken, token);
    const value = formatOutputTokenValue(previousToken, token, boundary);
    if (!joined || boundary === 'none') return value;
    if (boundary === 'space') return `${joined} ${value}`;
    if (boundary === 'apostrophe') return `${joined}'${value}`;
    if (boundary === 'tight') return joined + value;
    return joined + value;
}

function hasTerminalSokuonReviewCondition(value) {
    const chars = Array.from(normalizeKanaReading(String(value || '')));
    return chars.some((char, index) => char === 'っ' && (index === chars.length - 1 || /^[\s\p{P}\p{S}]$/u.test(chars[index + 1])));
}

function hasRepeatedSokuonReviewCondition(value) {
    return /っ{2,}/u.test(normalizeKanaReading(String(value || '')));
}

function hasNonGeminativeSokuonReviewCondition(value) {
    const normalized = normalizeKanaReading(String(value || ''));
    for (let index = 0; index < normalized.length; index += 1) {
        if (normalized[index] !== 'っ') continue;
        const next = normalized[index + 1] || '';
        if (!next || /^[\s\p{P}\p{S}]$/u.test(next) || next === 'っ') continue;
        if (!/^[ぁ-ゖー]$/u.test(next)) continue;
        const pair = normalized.slice(index + 1, index + 3);
        const reading = contractedKanaMap[pair] || kanaToRomajiMap[next] || '';
        if (!isSokuonGeminateableReading(reading)) return true;
    }
    return false;
}

function reviewedSourceLanguageLoanwordCoversIndex(tokenResults, sourceText, sourceIndex) {
    const tokens = Array.isArray(tokenResults) ? tokenResults : [];
    const text = String(sourceText || '');
    const ranges = findSourceTokenRanges(tokens, text);
    return tokens.some((token, index) => {
        const resolutionSource = String(token?.readingResolution?.source || '');
        if (!resolutionSource.includes('source-language-loanword')) return false;
        const range = ranges[index];
        if (!range || sourceIndex < range.start || sourceIndex >= range.end) return false;
        return text.slice(range.start, range.end) === String(token.surface_form || '');
    });
}

function hasUnreviewedNonGeminativeSokuonReviewCondition(value, tokenResults = []) {
    const source = String(value || '');
    const normalized = normalizeKanaReading(source);
    for (let index = 0; index < normalized.length; index += 1) {
        if (normalized[index] !== 'っ') continue;
        const next = normalized[index + 1] || '';
        if (!next || /^[\s\p{P}\p{S}]$/u.test(next) || next === 'っ') continue;
        if (!/^[ぁ-ゖー]$/u.test(next)) continue;
        const pair = normalized.slice(index + 1, index + 3);
        const reading = contractedKanaMap[pair] || kanaToRomajiMap[next] || '';
        if (isSokuonGeminateableReading(reading)) continue;
        if (!reviewedSourceLanguageLoanwordCoversIndex(tokenResults, source, index)) return true;
    }
    return false;
}

function hasHistoricalFullSizeSokuonAmbiguity(value, tokenResults = []) {
    const source = String(value || '');
    for (let index = 0; index < source.length; index += 1) {
        if (source[index] !== 'つ' && source[index] !== 'ツ') continue;
        const nextKana = normalizeKanaReading(source.slice(index + 1, index + 3));
        const next = nextKana[0] || '';
        if (!next || !/^[ぁ-ゖ]$/u.test(next)) continue;
        const pair = nextKana.slice(0, 2);
        const reading = contractedKanaMap[pair] || kanaToRomajiMap[next] || '';
        if (!isSokuonGeminateableReading(reading)) continue;
        const covered = tokenResults.some(token => {
            if (!token?.historicalKanaEvidenceMatched) return false;
            const surface = String(token.surface_form || '');
            if (!/[つツ]/u.test(surface)) return false;
            let offset = source.indexOf(surface);
            while (offset !== -1) {
                if (index >= offset && index < offset + surface.length) return true;
                offset = source.indexOf(surface, offset + 1);
            }
            return false;
        });
        if (!covered) return true;
    }
    return false;
}

function classifyReadingAuditCategories(reading) {
    const flags = new Set(reading?.flags || []);
    const source = String(reading?.source || '');
    const hanScope = String(reading?.hanScope || '');
    const unsupportedScript = flags.has('unsupported-script') || source === 'unresolved-script';
    const unknownHanScope = flags.has('unknown-han-scope') || source === 'unknown-han-scope' || hanScope === 'unknown-scope';
    const outOfScope = unsupportedScript || hanScope === 'out-of-scope';
    const unresolvedJapaneseReading = flags.has('unresolved-reading') && !outOfScope && !unknownHanScope;
    const categories = [];
    if (unresolvedJapaneseReading) {
        categories.push('unresolved-japanese-reading');
        if (hanScope === 'japanese-scope') categories.push('unresolved-japanese-han');
    }
    if (outOfScope) categories.push('out-of-scope-input');
    if (unknownHanScope) categories.push('unknown-japanese-scope-status');
    return categories;
}

function attachTranslationAuditStatistics(diagnostics) {
    const readings = Array.isArray(diagnostics?.readings) ? diagnostics.readings : [];
    for (const reading of readings) reading.auditCategories = classifyReadingAuditCategories(reading);
    const countCategory = category => readings.filter(reading => reading.auditCategories.includes(category)).length;
    const literalUnresolved = (String(diagnostics?.output || '').match(/\[Unresolved\]/g) || []).length;
    const requiresReview = Boolean(diagnostics?.requiresReview);
    diagnostics.statistics = {
        requiresReview,
        resolvedOutputRequiresReview: requiresReview && literalUnresolved === 0,
        literalUnresolved,
        hasLiteralUnresolved: literalUnresolved > 0,
        unresolvedJapaneseReadings: countCategory('unresolved-japanese-reading'),
        unresolvedJapaneseHan: countCategory('unresolved-japanese-han'),
        outOfScopeInput: countCategory('out-of-scope-input'),
        unknownJapaneseScopeStatus: countCategory('unknown-japanese-scope-status')
    };
    return diagnostics;
}

function isPlainKatakanaLexicalSurface(value) {
    return /^[ァ-ヶヴヵー]+$/u.test(String(value || ''));
}

function findUnreviewedContiguousKatakanaBoundaries(tokenResults, sourceText) {
    const tokens = Array.isArray(tokenResults) ? tokenResults : [];
    const ranges = findSourceTokenRanges(tokens, String(sourceText || ''));
    const boundaries = [];
    for (let index = 1; index < tokens.length; index += 1) {
        const left = tokens[index - 1];
        const right = tokens[index];
        if (!left || !right) continue;
        if (left.pos !== '名詞' || right.pos !== '名詞') continue;
        if (!isPlainKatakanaLexicalSurface(left.surface_form) || !isPlainKatakanaLexicalSurface(right.surface_form)) continue;
        if (left.readingResolution?.source !== 'written-kana' || right.readingResolution?.source !== 'written-kana') continue;
        if (right.reviewedLexicalBoundaryBefore || right.tokenizationRoleBoundaryBefore) continue;
        const leftRange = ranges[index - 1];
        const rightRange = ranges[index];
        if (!leftRange || !rightRange || leftRange.end !== rightRange.start) continue;
        boundaries.push({ left, right, surface: `${left.surface_form}${right.surface_form}`, sourceStart: leftRange.start, sourceEnd: rightRange.end, sourceSurface: String(sourceText || '').slice(leftRange.start, rightRange.end) });
    }
    return boundaries;
}

function findPartiallyReviewedContiguousKatakanaSpans(tokenResults, sourceText) {
    const tokens = Array.isArray(tokenResults) ? tokenResults : [];
    const ranges = findSourceTokenRanges(tokens, String(sourceText || ''));
    const spans = [];
    for (let index = 1; index < tokens.length; index += 1) {
        const left = tokens[index - 1];
        const right = tokens[index];
        if (!left || !right) continue;
        if (left.pos !== '名詞' || right.pos !== '名詞') continue;
        if (!isPlainKatakanaLexicalSurface(left.surface_form) || !isPlainKatakanaLexicalSurface(right.surface_form)) continue;
        if (right.reviewedLexicalBoundaryBefore || right.tokenizationRoleBoundaryBefore) continue;
        const leftRange = ranges[index - 1];
        const rightRange = ranges[index];
        if (!leftRange || !rightRange || leftRange.end !== rightRange.start) continue;
        const leftReviewed = left.readingResolution?.source === 'source-language-loanword' || left.readingResolution?.source === 'loanword-lexicon';
        const rightReviewed = right.readingResolution?.source === 'source-language-loanword' || right.readingResolution?.source === 'loanword-lexicon';
        const leftMechanical = ['written-kana', 'kuromoji-orthographic-pronunciation'].includes(left.readingResolution?.source);
        const rightMechanical = ['written-kana', 'kuromoji-orthographic-pronunciation'].includes(right.readingResolution?.source);
        if (!((leftReviewed && rightMechanical) || (leftMechanical && rightReviewed))) continue;
        spans.push({ left, right, surface: `${left.surface_form}${right.surface_form}`, sourceStart: leftRange.start, sourceEnd: rightRange.end, sourceSurface: String(sourceText || '').slice(leftRange.start, rightRange.end) });
    }
    return spans;
}

function renderTokenResults(tokenResults) {
    return (tokenResults || []).reduce((joined, token, index) => {
        if (token.pos === '記号' && token.pos_detail_1 === '空白' && /^\s+$/u.test(String(token.surface_form || ''))) return joined;
        const previousToken = tokenResults[index - 1];
        return appendTokenOutput(joined, previousToken, token);
    }, '');
}

function renderFinalOutputFromTokenResults(tokenResults, sourceText = '') {
    const rendered = renderTokenResults(tokenResults);
    return blockUnresolvedHanFromRomaji(normalizeRule0OutputPunctuation(rendered, sourceText));
}

function renderFinalOutputFromRecordedBoundaries(tokenResults, sourceText = '') {
    let joined = '';
    for (let index = 0; index < (tokenResults || []).length; index += 1) {
        const token = tokenResults[index];
        if (!token) continue;
        if (token.pos === '記号' && token.pos_detail_1 === '空白' && /^\s+$/u.test(String(token.surface_form || ''))) continue;
        const previousToken = tokenResults[index - 1] || null;
        const boundary = token.outputBoundaryBefore || 'none';
        const value = formatOutputTokenValue(previousToken, token, boundary);
        if (!joined || boundary === 'none') joined = value;
        else if (boundary === 'space') joined += ` ${value}`;
        else if (boundary === 'apostrophe') joined += `'${value}`;
        else joined += value;
    }
    return blockUnresolvedHanFromRomaji(normalizeRule0OutputPunctuation(joined, sourceText));
}

function validateFinalOutputEvidenceConsistency(tokenResults, output = null, sourceText = '') {
    const violations = [];
    /** @param {any} token @param {number} index @param {string} reason @param {string|null} [expected] */
    const addViolation = (token, index, reason, expected = null) => violations.push({
        index,
        surface: String(token?.surface_form || ''),
        reason,
        boundary: token?.outputBoundaryBefore || null,
        expected
    });
    for (let index = 0; index < (tokenResults || []).length; index += 1) {
        const token = tokenResults[index];
        const previous = tokenResults[index - 1] || null;
        if (!token) continue;
        if (!token.outputBoundaryBefore) {
            addViolation(token, index, 'missing-boundary-provenance');
            continue;
        }
        const expected = classifyTokenOutputBoundaryDecision(previous, token);
        if (token.outputBoundaryBefore !== expected.type) addViolation(token, index, 'boundary-metadata-contradiction', expected.type);
        if ((token.morphologicalJoinLeft || token.joinLeftAfterSokuon) && !['join', 'apostrophe'].includes(token.outputBoundaryBefore)) {
            addViolation(token, index, 'join-evidence-rendered-separate', 'join');
        }
        if ((token.reviewedLexicalBoundaryBefore || token.tokenizationRoleBoundaryBefore) && ['join', 'apostrophe'].includes(token.outputBoundaryBefore)) {
            addViolation(token, index, 'reviewed-separate-boundary-rendered-joined', 'space');
        }
    }
    const hasCompleteBoundaryProvenance = (tokenResults || []).every(token => !token || Boolean(token.outputBoundaryBefore));
    if (hasCompleteBoundaryProvenance) {
        const provenanceOutput = renderFinalOutputFromRecordedBoundaries(tokenResults, sourceText);
        const rendererOutput = renderFinalOutputFromTokenResults(tokenResults, sourceText);
        if (rendererOutput !== provenanceOutput) {
            violations.push({
                index: -1,
                surface: '[output]',
                reason: 'boundary-renderer-contradiction',
                boundary: null,
                expected: provenanceOutput
            });
        }
        if (output !== null && output !== undefined && String(output) !== provenanceOutput) {
            violations.push({
                index: -1,
                surface: '[output]',
                reason: 'rendered-output-contradiction',
                boundary: null,
                expected: provenanceOutput
            });
        }
    }
    return { valid: violations.length === 0, violations };
}

/**
 * @param {any} diagnostics
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates
 * @param {{valid: boolean, violations: any[]}|null} [validation]
 */
function attachSourceSpanCandidateDiagnostics(diagnostics, candidates, validation = null) {
    const sourceSpanCandidates = (candidates || []).map(candidate => ({
        ...candidate,
        alternatives: (candidate.alternatives || []).map(item => ({ ...item })),
        metadata: { ...(candidate.metadata || {}) }
    }));
    const sourceSpanCandidateCounts = sourceSpanCandidates.reduce((counts, candidate) => {
        counts[candidate.category] = (counts[candidate.category] || 0) + 1;
        return counts;
    }, {});
    diagnostics.sourceSpanCandidates = sourceSpanCandidates;
    diagnostics.sourceSpanCandidateCounts = sourceSpanCandidateCounts;
    diagnostics.sourceSpanCandidateValidation = validation || { valid: true, violations: [] };
    return diagnostics;
}

function buildTranslationDiagnostics(sourceText, normalizedSourceText, output, tokenResults, options = {}) {
    const readings = tokenResults.map((token, index) => {
        const resolution = token.readingResolution;
        const unresolvedOrthographicSymbol = resolution?.source === 'japanese-orthography-unresolved';
        if (token.pos === '記号' && !/[\p{L}\p{N}]/u.test(String(token.surface_form || '')) && !unresolvedOrthographicSymbol) return null;
        if (!resolution) return null;
        const reviewSignals = finalizeTokenReviewSignals(tokenResults, index, options.sourceSpanCandidates);
        return {
            surface: token.surface_form,
            value: token.value,
            source: resolution.source,
            confidence: resolution.confidence,
            reading: resolution.reading,
            candidates: (resolution.candidates || []).map(candidate => ({
                reading: candidate.reading, romaji: candidate.romaji, weight: candidate.weight,
                rank: Number.isFinite(candidate.rank) ? candidate.rank : null,
                categories: [...(candidate.categories || [])], sources: [...(candidate.sources || [])]
            })),
            flags: [...(resolution.flags || [])],
            reviewSignals,
            sourceStart: Number.isInteger(token.sourceStart) ? token.sourceStart : null,
            sourceEnd: Number.isInteger(token.sourceEnd) ? token.sourceEnd : null,
            sourceSurface: token.sourceSurface || token.surface_form || null,
            semanticAnnotationOwnership: (token.semanticAnnotationOwnership || []).map(owner => ({ ...owner, annotations: [...(owner.annotations || [])] })),
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            outputBoundaryBefore: token.outputBoundaryBefore || null,
            outputBoundaryReason: token.outputBoundaryReason || null,
            outputBoundaryAuthority: token.outputBoundaryAuthority || null,
            outputBoundaryRequiresReview: Boolean(token.outputBoundaryRequiresReview),
            variantMappings: [...(resolution.variantMappings || [])],
            hanScope: resolution.hanScope || null,
            scopeEvidence: [...(resolution.scopeEvidence || [])]
        };
    }).filter(Boolean);
    const redFlags = readings.flatMap(item => item.reviewSignals || []);
    const wholeSourceOwnership = { sourceStart: 0, sourceEnd: String(sourceText || '').length, sourceSurface: String(sourceText || '') };
    const addSignal = (surface, flag, source, confidence = 1, ownership = wholeSourceOwnership) => redFlags.push(makeFinalReviewSignal(surface, flag, source, confidence, ownership));
    for (const token of tokenResults) {
        if (!token?.outputBoundaryRequiresReview) continue;
        addSignal(token.surface_form, 'structural-boundary-uncertain', 'final-boundary-classification', 0.65, getReviewSignalOwnership(token));
    }
    for (const token of tokenResults) {
        if (!token?.typedNumericRoleReviewRequired) continue;
        addSignal(token.surface_form, 'numeric-role-ambiguous', token.typedNumericRoleSource || 'numeric-role-selection', 0.82, getReviewSignalOwnership(token));
    }
    for (const token of tokenResults) {
        if (!token?.typedTemporalRoleReviewRequired) continue;
        addSignal(token.surface_form, 'temporal-role-ambiguous', token.typedTemporalRoleSource || 'temporal-role-selection', 0.82, getReviewSignalOwnership(token));
    }
    const structuralValidation = options.validateStructuralBoundaries
        ? (() => {
            const outputEvidenceValidation = validateFinalOutputEvidenceConsistency(tokenResults, output, sourceText);
            const sourceIntegrityValidation = options.sourceIntegrityValidation || { valid: true, violations: [] };
            return {
                valid: outputEvidenceValidation.valid && sourceIntegrityValidation.valid,
                violations: [...outputEvidenceValidation.violations, ...sourceIntegrityValidation.violations],
                outputEvidenceValidation,
                sourceIntegrityValidation
            };
        })()
        : { valid: true, violations: [], outputEvidenceValidation: { valid: true, violations: [] }, sourceIntegrityValidation: { valid: true, violations: [] } };
    for (const violation of structuralValidation.violations) {
        addSignal(violation.surface || '[boundary]', 'final-boundary-invariant-violation', `final-output-consistency:${violation.reason}`, 1, Number.isInteger(violation.index) && violation.index >= 0 ? getReviewSignalOwnership(tokenResults[violation.index]) : wholeSourceOwnership);
    }
    for (const token of tokenResults) {
        const collision = token?.typedTemporalSpanLexicalCollision;
        if (!collision) continue;
        addSignal(`${collision.headSurface}${collision.lexicalSurface}`, 'tokenisation-boundary-ambiguous', 'typed-temporal-boundary', 0.85, getReviewSignalOwnership(token));
    }
    for (const token of tokenResults) {
        if (!token?.crossNotationSymbol || token.titleReadingEvidenceKind) continue;
        addSignal(token.surface_form, 'unreviewed-cross-notation', 'mixed-script-symbol', 0.60, getReviewSignalOwnership(token));
    }
    for (const flag of options.outputGuardFlags || []) addSignal('[output]', flag, 'final-output-guard');
    for (const boundary of findUnreviewedContiguousKatakanaBoundaries(tokenResults, normalizedSourceText)) {
        addSignal(boundary.surface, 'kana-tokenisation-boundary-unreviewed', 'kuromoji-katakana-boundary', 0.7, boundary);
    }
    for (const span of findPartiallyReviewedContiguousKatakanaSpans(tokenResults, normalizedSourceText)) {
        addSignal(span.surface, 'missing-source-spelling-evidence', 'partial-source-language-loanword', 0.7, span);
    }
    const diagnosticSegments = splitCanonicalHardBoundarySegments(normalizedSourceText);
    if (diagnosticSegments.some(hasTerminalSokuonReviewCondition)) addSignal('っ', 'terminal-sokuon-review', 'sokuon-safety');
    if (diagnosticSegments.some(hasRepeatedSokuonReviewCondition)) addSignal('っっ', 'repeated-sokuon-review', 'sokuon-safety');
    if (hasUnreviewedNonGeminativeSokuonReviewCondition(normalizedSourceText, tokenResults)) addSignal('っ', 'non-geminative-sokuon-review', 'sokuon-safety');
    if (options.historicalKana && hasHistoricalFullSizeSokuonAmbiguity(normalizedSourceText, tokenResults)) addSignal('つ', 'historical-full-size-sokuon-ambiguity', 'historical-orthography-safety');
    for (const segment of diagnosticSegments) {
        if (!isJapaneseNumeralSurface(segment)) continue;
        if (!tokenResults.some(token => isProperNounToken(token) && String(token.surface_form || '') === segment)) continue;
        addSignal(segment, 'numeric-literal-lexical-ambiguity', 'numeric-safety');
    }
    const sourceCounts = readings.reduce((counts, item) => { counts[item.source] = (counts[item.source] || 0) + 1; return counts; }, {});
    return attachTranslationAuditStatistics(attachSourceSpanCandidateDiagnostics({
        sourceText, normalizedSourceText, output, readings, sourceCounts, redFlags, structuralValidation,
        requiresReview: redFlags.some(item => item.state === 'final-active' && item.requiresReview)
    }, options.sourceSpanCandidates, options.sourceSpanCandidateValidation));
}

function publishTranslationDiagnostics(diagnostics) {
    const classifiedDiagnostics = diagnostics ? attachTranslationAuditStatistics(diagnostics) : diagnostics;
    runtimeState.lastTranslationDiagnostics = classifiedDiagnostics;
    updateRuntimeDiagnostics('lastTranslation', classifiedDiagnostics);
}

function resolveOverridesEnabled(options = {}) {
    return Object.prototype.hasOwnProperty.call(options, 'overridesEnabled')
        ? Boolean(options.overridesEnabled)
        : runtimeState.overridesEnabled;
}

function translateText(text, options = {}) {
    const sourceText = String(text || '');
    if (!sourceText.trim()) return '';

    const overrideLookupText = canonicalizeTokenizerBoundaryCharacters(sourceText);
    const normalizedSourceText = options.historicalKana
        ? normalizeTranslatorInputText(sourceText)
        : normalizeObsoleteWRowKanaForModernReading(normalizeTranslatorInputText(sourceText));
    const { trailingText: sourceTrailingText } = splitTrailingPunctuation(overrideLookupText);
    const overridesEnabled = resolveOverridesEnabled(options);
    if (overridesEnabled) {
        const exactOverrideMatch = findExactOverride(overrideLookupText, runtimeState.overrides);
        if (exactOverrideMatch) {
            const overrideOutput = exactOverrideMatch.directMatch ? exactOverrideMatch.value : exactOverrideMatch.value + sourceTrailingText;
            const preGuardOutput = normalizeRule0OutputPunctuation(overrideOutput, sourceText);
            const finalOutput = blockUnresolvedHanFromRomaji(preGuardOutput);
            const outputGuardTriggered = finalOutput !== preGuardOutput;
            const outputGuardFlags = outputGuardTriggered ? getOutputGuardFlags(preGuardOutput) : [];
            if (runtimeState.captureTranslationDiagnostics) {
                const flags = outputGuardTriggered ? ['unresolved-reading', 'unsupported-script', ...outputGuardFlags] : [];
                publishTranslationDiagnostics({
                    sourceText,
                    normalizedSourceText,
                    output: finalOutput,
                    readings: [{ surface: sourceText, value: finalOutput, source: 'exact-override', confidence: outputGuardTriggered ? 0.2 : 1, reading: null, candidates: [], flags }],
                    sourceCounts: { 'exact-override': 1 },
                    redFlags: flags.map(flag => makeFinalReviewSignal(sourceText, flag, 'exact-override', outputGuardTriggered ? 0.2 : 1, { sourceStart: 0, sourceEnd: sourceText.length, sourceSurface: sourceText })),
                    requiresReview: outputGuardTriggered
                });
            }
            return finalOutput;
        }
    }

    text = normalizedSourceText;
    if (!runtimeState.tokenizer) return blockUnresolvedHanFromRomaji(normalizeRule0OutputPunctuation(capitalizeRomaji(convertToRomaji(text)), sourceText));

    return translateTokenizedSourceText(sourceText, text, runtimeState.tokenizer.tokenize(text), options, overridesEnabled);
}

function translateTextFromTokenizationForQa(sourceText, rawTokens, options = {}) {
    const originalSourceText = String(sourceText || '');
    if (!originalSourceText.trim()) return '';
    const normalizedSourceText = options.historicalKana
        ? normalizeTranslatorInputText(originalSourceText)
        : normalizeObsoleteWRowKanaForModernReading(normalizeTranslatorInputText(originalSourceText));
    return translateTokenizedSourceText(originalSourceText, normalizedSourceText, rawTokens, options, resolveOverridesEnabled(options));
}

function translateTokenizedSourceText(sourceText, text, rawTokens, options = {}, overridesEnabled = resolveOverridesEnabled(options)) {
    const preserveSourceSpans = tokens => attachSourceTokenSpans(tokens, text);
    const wholeSentenceTokens = preserveSourceSpans(restoreDroppedSokuonTokens(rawTokens || [], text));
    const sourceSpanCandidates = discoverSourceSpanCandidates(text, wholeSentenceTokens, {
        historicalKana: Boolean(options.historicalKana),
        overridesEnabled
    });
    const sourceSpanCandidateValidation = validateSourceSpanCandidates(sourceSpanCandidates, text);
    const tokenized = preserveSourceSpans(splitStructuredNumericUnitTokens(stabilizeHardBoundaryTokenization(wholeSentenceTokens, text)));
    if (!tokenized.length) {
        const finalOutput = blockUnresolvedHanFromRomaji(text);
        if (runtimeState.captureTranslationDiagnostics) {
            const outputGuardFlags = finalOutput !== text ? getOutputGuardFlags(text) : [];
            const flags = finalOutput !== text ? ['unresolved-reading', 'unsupported-script', ...outputGuardFlags] : ['fallback-reading'];
            publishTranslationDiagnostics(attachSourceSpanCandidateDiagnostics({
                sourceText, normalizedSourceText: text, output: finalOutput,
                readings: [{ surface: text, value: finalOutput, source: finalOutput !== text ? 'unresolved-script' : 'surface-fallback', confidence: finalOutput !== text ? 0.2 : 0.55, reading: text, candidates: [], flags }],
                sourceCounts: { [finalOutput !== text ? 'unresolved-script' : 'surface-fallback']: 1 },
                redFlags: flags.map(flag => makeFinalReviewSignal(text, flag, finalOutput !== text ? 'unresolved-script' : 'surface-fallback', finalOutput !== text ? 0.2 : 0.55, { sourceStart: 0, sourceEnd: text.length, sourceSurface: text })),
                requiresReview: finalOutput !== text
            }, sourceSpanCandidates, sourceSpanCandidateValidation));
        }
        return finalOutput;
    }
    const sourceReconciledTokens = preserveSourceSpans(reconcileKanaSourceTokenBoundaries(tokenized, text, sourceSpanCandidates));
    const fractionStructuredTokens = preserveSourceSpans(applyStructuredFractionOutputTokens(sourceReconciledTokens, sourceSpanCandidates));
    const temporalBoundaryTokens = preserveSourceSpans(repairTypedTemporalExpressionBoundaries(fractionStructuredTokens));
    const temporalSpanTokens = preserveSourceSpans(mergeTypedTemporalSpanTokens(temporalBoundaryTokens));
    const oneDayRoleTokens = preserveSourceSpans(markTypedOneDayDurationTokens(temporalSpanTokens));
    const frequencyRoleTokens = preserveSourceSpans(markTypedFrequencyCounterRoleTokens(oneDayRoleTokens));
    const numericRoleAmbiguityTokens = preserveSourceSpans(markAmbiguousNumericRoleTokens(frequencyRoleTokens, sourceSpanCandidates));
    const clockHourRoleTokens = preserveSourceSpans(markTypedClockHourRoleTokens(numericRoleAmbiguityTokens));
    const minuteRoleTokens = preserveSourceSpans(markTypedMinuteCounterRoleTokens(clockHourRoleTokens, sourceSpanCandidates));
    const typedNumericTokens = preserveSourceSpans(applyTypedNumericRoleReadings(minuteRoleTokens));
    const roleRepairedTokens = preserveSourceSpans(repairCaseMarkedCounterFollowerTokens(typedNumericTokens));
    const desiderativeTokens = preserveSourceSpans(mergeDesiderativeGaruTokens(roleRepairedTokens));
    const reviewedInflectionTokens = preserveSourceSpans(mergeReviewedCommonWordInflectionTokens(desiderativeTokens));
    const kanaCommonWordBoundaryTokens = preserveSourceSpans(splitReviewedKanaCommonWordBoundaryTokens(reviewedInflectionTokens, text));
    const kanaLexicalTokens = preserveSourceSpans(mergeKanaLexicalReadingTokens(kanaCommonWordBoundaryTokens));
    const kanaHonorificTokens = preserveSourceSpans(mergeKanaCommonWordBoundaryHonorificTokens(kanaLexicalTokens));
    const kanaBoundaryTokens = preserveSourceSpans(mergeOrthographicKanaBoundaryTokens(kanaHonorificTokens));
    const latinProtectedTokens = preserveSourceSpans(mergeLatinPassthroughTokens(kanaBoundaryTokens));
    const historicalTokens = preserveSourceSpans(options.historicalKana ? mergeHistoricalKanaEvidenceTokens(latinProtectedTokens) : latinProtectedTokens);
    const lexicalCandidateTokens = preserveSourceSpans(mergeStrongSourceSpanLexicalCandidateTokens(historicalTokens, sourceSpanCandidates));
    const exactDictionaryTokens = preserveSourceSpans(mergeExactDictionaryRescueTokens(lexicalCandidateTokens, text));
    const reviewedProperNameTokens = preserveSourceSpans(mergeReviewedProperNameSpanTokens(exactDictionaryTokens));
    const reviewedNameSuffixTokens = preserveSourceSpans(mergeReviewedNameHonorificTokens(reviewedProperNameTokens));
    const nameContextTokens = preserveSourceSpans(markUnreviewedNameContextTokens(reviewedNameSuffixTokens));
    const authoritativeTokens = preserveSourceSpans(mergeAuthoritativeSpanTokens(nameContextTokens, sourceSpanCandidates));
    const iterationTokens = preserveSourceSpans(mergeIterationMarkFallbackTokens(authoritativeTokens));
    const reviewedNumericTokens = preserveSourceSpans(mergeReviewedNumericAliasTokens(iterationTokens));
    const variantProperNounTokens = preserveSourceSpans(mergeVariantProperNounTokens(reviewedNumericTokens));
    const casualTokens = preserveSourceSpans(mergeCasualSpeechTokens(variantProperNounTokens));
    const commonWordTokens = preserveSourceSpans(mergeCommonWordTokens(casualTokens, text));
    const atejiTokens = preserveSourceSpans(mergeAtejiTokens(commonWordTokens));
    const grammaticalTokens = preserveSourceSpans(mergeRecognizedGrammaticalExpressions(atejiTokens));
    const contextResolvedTokens = preserveSourceSpans(mergeContextualOverrideTokens(grammaticalTokens, text, { overridesEnabled }));
    const titleReadingTokens = preserveSourceSpans(mergeTitleReadingEvidenceTokens(contextResolvedTokens, text));
    const pathTokens = preserveSourceSpans(mergeGeneralWordTokens(mergeLoanwordTokens(mergeRendakuEvidenceTokens(mergeKnownPhraseTokens(titleReadingTokens))), text));
    const ordinaryCompoundTokens = preserveSourceSpans(annotateOrdinaryCompoundReadingContext(pathTokens));
    const readingContextTokens = preserveSourceSpans(annotateContextualReadingEvidence(ordinaryCompoundTokens));
    const contextTokens = preserveSourceSpans(annotateContextualLoanwordEvidence(readingContextTokens));
    const outputTokens = preserveSourceSpans(annotateMorphologicalOutputBoundaries(contextTokens));
    const provisionalResolutions = outputTokens.map(token => resolveTokenReading(token, text));
    const verifiedResolutions = verifySentenceLevelResolutions(outputTokens, provisionalResolutions, text);

    let inPersonName = false;
    let hasPersonNameContinuation = false;
    const tokenResults = outputTokens.map((token, tokenIndex) => {
        const grammatical = isGrammaticalToken(token);
        const personNameToken = isPersonNameToken(token);
        const personNameStart = personNameToken && !inPersonName;
        const nameContinuation = personNameToken && inPersonName;
        const nameGivenStart = nameContinuation && !hasPersonNameContinuation;
        if (personNameStart) { inPersonName = true; hasPersonNameContinuation = false; }
        else if (nameContinuation) hasPersonNameContinuation = true;
        else if (!personNameToken) { inPersonName = false; hasPersonNameContinuation = false; }
        return {
            surface: token.surface_form, surface_form: token.surface_form, pos: token.pos, pos_detail_1: token.pos_detail_1, pos_detail_2: token.pos_detail_2,
            basic_form: token.basic_form, conjugated_type: token.conjugated_type, conjugated_form: token.conjugated_form,
            value: convertToken(token, text, verifiedResolutions[tokenIndex]), readingResolution: token.readingResolution || verifiedResolutions[tokenIndex] || null,
            particle: isParticle(token), fullGrammaticalExpression: Boolean(token.fullGrammaticalExpression), grammatical,
            nominalizer: isNominalizer(token), prefix: isPrefix(token), suffix: isSuffix(token), joinLeftAfterSokuon: Boolean(token.joinLeftAfterSokuon),
            morphologicalJoinLeft: Boolean(token.morphologicalJoinLeft),
            morphologicalJoinReason: token.morphologicalJoinReason || null,
            morphologicalJoinAuthority: token.morphologicalJoinAuthority || null,
            startsSeparateAuxiliaryUnit: startsSeparateAuxiliaryUnit(token), numericExpression: Boolean(token.numericExpression),
            typedNumericExpressionType: token.typedNumericExpressionType || null,
            typedNumericRoleSelected: Boolean(token.typedNumericRoleSelected),
            typedNumericRole: token.typedNumericRole || null,
            typedNumericRoleState: token.typedNumericRoleState || null,
            typedNumericRoleSource: token.typedNumericRoleSource || null,
            typedNumericRoleReviewRequired: Boolean(token.typedNumericRoleReviewRequired),
            typedNumericRoleAlternatives: [...(token.typedNumericRoleAlternatives || [])],
            typedTemporalRoleState: token.typedTemporalRoleState || null,
            typedTemporalRoleSource: token.typedTemporalRoleSource || null,
            typedTemporalRoleReviewRequired: Boolean(token.typedTemporalRoleReviewRequired),
            typedTemporalRoleAlternatives: [...(token.typedTemporalRoleAlternatives || [])],
            typedTemporalSpanLexicalCollision: token.typedTemporalSpanLexicalCollision || null,
            orthographicParticleInferred: Boolean(token.orthographicParticleInferred),
            orthographicParticleEvidenceSource: token.orthographicParticleEvidenceSource || null,
            orthographicParticleReviewRequired: Boolean(token.orthographicParticleReviewRequired),
            titleSeparator: Boolean(token.titleReadingEvidenceMatched && ['title-separator', 'title-separator-silent'].includes(token.titleReadingEvidenceKind)),
            crossNotationSymbol: Boolean(token.crossNotationSymbol),
            titleReadingEvidenceKind: token.titleReadingEvidenceKind || null,
            sourceStart: Number.isInteger(token.sourceStart) ? token.sourceStart : null,
            sourceEnd: Number.isInteger(token.sourceEnd) ? token.sourceEnd : null,
            sourceSurface: token.sourceSurface || token.surface_form || null,
            semanticAnnotationOwnership: (token.semanticAnnotationOwnership || []).map(owner => ({ ...owner, annotations: [...(owner.annotations || [])] })),
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            reviewedLexicalBoundaryBefore: Boolean(token.reviewedLexicalBoundaryBefore), tokenizationRoleBoundaryBefore: Boolean(token.tokenizationRoleBoundaryBefore),
            personNameStart, nameContinuation, nameGivenStart
        };
    });

    for (let index = 0; index < tokenResults.length; index += 1) {
        const token = tokenResults[index];
        const previousToken = tokenResults[index - 1] || null;
        const boundaryDecision = classifyTokenOutputBoundaryDecision(previousToken, token);
        token.outputBoundaryBefore = boundaryDecision.type;
        token.outputBoundaryReason = boundaryDecision.reason;
        token.outputBoundaryAuthority = boundaryDecision.authority;
        token.outputBoundaryRequiresReview = boundaryDecision.requiresReview;
    }

    const result = renderTokenResults(tokenResults);

    const preGuardOutput = normalizeRule0OutputPunctuation(result, sourceText);
    const finalOutput = blockUnresolvedHanFromRomaji(preGuardOutput);
    const outputGuardFlags = finalOutput !== preGuardOutput ? getOutputGuardFlags(preGuardOutput) : [];
    if (runtimeState.captureTranslationDiagnostics) {
        const sourceIntegrityValidation = validateSourceTokenIntegrity(outputTokens, text, { requireFullCoverage: true });
        publishTranslationDiagnostics(buildTranslationDiagnostics(sourceText, text, finalOutput, tokenResults, {
            outputGuardFlags,
            historicalKana: Boolean(options.historicalKana),
            validateStructuralBoundaries: true,
            sourceIntegrityValidation,
            sourceSpanCandidates,
            sourceSpanCandidateValidation
        }));
    }
    return finalOutput;
}

