// Source section: Sokuon repair, casual speech, grammar expressions, contextual overrides and known phrases.
function restoreDroppedSokuonTokens(tokens, sourceText) {
    const restored = (tokens || []).map(token => ({ ...token }));
    let sourceCursor = 0;
    for (const token of restored) {
        const originalSurface = String(token.surface_form || '');
        if (!originalSurface) continue;
        let startIndex = Number(token.word_position || 0) > 0 ? Number(token.word_position) - 1 : sourceText.indexOf(originalSurface, sourceCursor);
        if (startIndex < sourceCursor || startIndex < 0) startIndex = sourceText.indexOf(originalSurface, sourceCursor);
        if (startIndex < 0) startIndex = sourceCursor;
        const gap = sourceText.slice(sourceCursor, startIndex);
        const missingMatch = gap.match(/[っッ]+$/u);
        if (missingMatch && /^[ぁ-ゖァ-ンヴー]/u.test(originalSurface)) {
            const missing = missingMatch[0];
            token.surface_form = missing + originalSurface;
            token.reading = 'ッ'.repeat(Array.from(missing).length) + String(token.reading || originalSurface);
            token.pronunciation = 'ッ'.repeat(Array.from(missing).length) + String(token.pronunciation || token.reading || originalSurface);
            token.joinLeftAfterSokuon = sourceCursor > 0;
        }
        sourceCursor = startIndex + originalSurface.length;
    }
    return restored;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function splitStructuredNumericUnitTokens(tokens, sourceSpanCandidates = []) {
    const split = [];
    const input = tokens || [];
    for (let index = 0; index < input.length; index += 1) {
        const token = input[index];
        const surface = String(token?.surface_form || '');
        let matchedUnit = null;
        for (const unit of separatedNumericUnitSurfaces) {
            if (surface.endsWith(unit) && isJapaneseNumeralSurface(surface.slice(0, -unit.length))) {
                matchedUnit = unit;
                break;
            }
        }
        if (matchedUnit) {
            const numeralSurface = surface.slice(0, -matchedUnit.length);
            const position = Number(token.word_position || 0);
            const numeralLength = Array.from(numeralSurface).length;
            const fullLength = Array.from(surface).length;
            split.push(makeDerivedSubspanToken(token, 0, numeralLength, {
                surface_form: numeralSurface, reading: '*', pronunciation: '*',
                pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
                structuredNumericSplit: true
            }, {
                annotations: ['structuredNumericSplit'], evidenceSource: 'numeric-unit-structure', semanticRole: 'numeric-head'
            }));
            split.push(makeDerivedSubspanToken(token, numeralLength, fullLength, {
                surface_form: matchedUnit, reading: '*', pronunciation: '*',
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                word_position: position > 0 ? position + numeralSurface.length : position,
                structuredNumericSplit: true
            }, {
                annotations: ['structuredNumericSplit'], evidenceSource: 'numeric-unit-structure', semanticRole: 'numeric-unit'
            }));
            continue;
        }

        const previous = input[index - 1] || null;
        const durationReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
        if (surface === '分間' && previous && embeddedCounterKanjiNumeralPattern.test(String(previous.surface_form || ''))
            && sourceTokensAreContiguous(previous, token) && durationReading.endsWith('かん')) {
            const intervalReading = durationReading.slice(-2);
            const tokenStart = Number(token?.sourceStart);
            const tokenEnd = Number(token?.sourceEnd);
            const lexicalBoundaryRelease = Number.isInteger(tokenStart) && Number.isInteger(tokenEnd)
                && (sourceSpanCandidates || []).some(candidate => candidate?.category === 'lexical'
                    && candidate?.kind === 'kuromoji-exact-dictionary-span'
                    && candidate.reviewRequired !== true
                    && Number(candidate.confidence || 0) >= 0.85
                    && Number(candidate.sourceStart) === tokenStart + 1
                    && Number(candidate.sourceEnd) > tokenEnd
                    && Boolean(candidate.reading));
            split.push(makeDerivedSubspanToken(token, 0, 1, {
                surface_form: '分', reading: '*', pronunciation: '*',
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                structuredNumericSplit: true
            }, {
                annotations: ['structuredNumericSplit'], evidenceSource: 'minute-duration-structure', semanticRole: 'numeric-unit'
            }));
            split.push(makeDerivedSubspanToken(token, 1, 2, {
                surface_form: '間', reading: intervalReading, pronunciation: intervalReading,
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                structuredNumericSplit: !lexicalBoundaryRelease,
                sourceSpanLexicalBoundaryRelease: lexicalBoundaryRelease
            }, {
                annotations: lexicalBoundaryRelease
                    ? ['sourceSpanLexicalBoundaryRelease']
                    : ['structuredNumericSplit'],
                evidenceSource: lexicalBoundaryRelease ? 'source-span-lexical-boundary' : 'minute-duration-structure',
                semanticRole: lexicalBoundaryRelease ? 'lexical-boundary-release' : 'duration-suffix'
            }));
            continue;
        }
        split.push(token);
    }
    return split;
}


const structuredFractionNumeralPattern = /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u;

function getStructuredFractionCandidateParts(candidate) {
    if (candidate?.kind !== 'fraction-structure' || candidate?.semanticRole !== 'fraction') return null;
    const surface = String(candidate.sourceSurface || '');
    const match = surface.match(/^([0-9０-９〇零一二三四五六七八九十百千万億兆]+)分の([0-9０-９〇零一二三四五六七八九十百千万億兆]+)$/u);
    if (!match || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return null;
    const denominator = match[1];
    const unitStart = candidate.sourceStart + denominator.length;
    const connectorStart = unitStart + 1;
    return {
        sourceStart: candidate.sourceStart,
        sourceEnd: candidate.sourceEnd,
        denominatorStart: candidate.sourceStart,
        unitStart,
        connectorStart,
        connectorEnd: connectorStart + 1,
        numeratorStart: connectorStart + 1
    };
}

function sourceOffsetToCharacterIndex(surface, sourceOffset) {
    if (!Number.isInteger(sourceOffset) || sourceOffset < 0 || sourceOffset > String(surface || '').length) return null;
    const characters = Array.from(String(surface || ''));
    let units = 0;
    for (let index = 0; index <= characters.length; index += 1) {
        if (units === sourceOffset) return index;
        if (index === characters.length) break;
        units += characters[index].length;
        if (units > sourceOffset) return null;
    }
    return null;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function applyStructuredFractionOutputTokens(tokens, sourceSpanCandidates = []) {
    const structures = [];
    for (const candidate of sourceSpanCandidates || []) {
        const structure = getStructuredFractionCandidateParts(candidate);
        if (structure) structures.push(structure);
    }
    if (!structures.length) return tokens || [];
    const boundaries = new Set();
    for (const structure of structures) {
        boundaries.add(structure.unitStart);
        boundaries.add(structure.connectorStart);
        boundaries.add(structure.connectorEnd);
    }

    const segmented = [];
    for (const token of tokens || []) {
        const tokenStart = token?.sourceStart;
        const tokenEnd = token?.sourceEnd;
        if (typeof tokenStart !== 'number' || typeof tokenEnd !== 'number' || !Number.isInteger(tokenStart) || !Number.isInteger(tokenEnd) || tokenEnd <= tokenStart) {
            segmented.push(token);
            continue;
        }
        const cuts = [...boundaries].filter(boundary => boundary > tokenStart && boundary < tokenEnd).sort((a, b) => a - b);
        if (!cuts.length) { segmented.push(token); continue; }
        const surface = String(token.sourceSurface ?? token.surface_form ?? '');
        const absolute = [tokenStart, ...cuts, tokenEnd];
        let valid = true;
        const pieces = [];
        for (let index = 0; index < absolute.length - 1; index += 1) {
            const startCharacter = sourceOffsetToCharacterIndex(surface, absolute[index] - tokenStart);
            const endCharacter = sourceOffsetToCharacterIndex(surface, absolute[index + 1] - tokenStart);
            if (typeof startCharacter !== 'number' || typeof endCharacter !== 'number' || endCharacter <= startCharacter) { valid = false; break; }
            pieces.push(makeDerivedSubspanToken(token, startCharacter, endCharacter, {
                reading: '*', pronunciation: '*'
            }, { evidenceSource: 'fraction-output-structure', semanticRole: 'fraction-structural-segment' }));
        }
        if (valid) segmented.push(...pieces);
        else segmented.push(token);
    }

    return segmented.map(token => {
        const tokenStart = token.sourceStart;
        const tokenEnd = token.sourceEnd;
        if (typeof tokenStart !== 'number' || typeof tokenEnd !== 'number') return token;
        const structure = structures.find(item => tokenStart >= item.sourceStart && tokenEnd <= item.sourceEnd);
        if (!structure) return token;
        const length = Array.from(String(token.surface_form || '')).length;
        if (tokenStart === structure.unitStart && tokenEnd === structure.connectorStart && token.surface_form === '分') {
            return makeDerivedSubspanToken(token, 0, length, {
                surface_form: '分', reading: 'ブン', pronunciation: 'ブン',
                pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
                structuredFractionRole: 'denominator-unit', structuredFractionReading: 'ぶん', structuredFractionSource: 'fraction-structure'
            }, {
                annotations: ['structuredFractionRole', 'structuredFractionReading', 'structuredFractionSource'],
                evidenceSource: 'fraction-structure', semanticRole: 'fraction-denominator-unit'
            });
        }
        if (tokenStart === structure.connectorStart && tokenEnd === structure.connectorEnd && token.surface_form === 'の') {
            return makeDerivedSubspanToken(token, 0, length, {
                surface_form: 'の', reading: 'ノ', pronunciation: 'ノ',
                pos: '助詞', pos_detail_1: '連体化', pos_detail_2: '*', pos_detail_3: '*',
                structuredFractionRole: 'connector', structuredFractionSource: 'fraction-structure'
            }, {
                annotations: ['structuredFractionRole', 'structuredFractionSource'],
                evidenceSource: 'fraction-structure', semanticRole: 'fraction-connector'
            });
        }
        if (structuredFractionNumeralPattern.test(String(token.surface_form || ''))
            && ((tokenStart >= structure.denominatorStart && tokenEnd <= structure.unitStart)
                || (tokenStart >= structure.numeratorStart && tokenEnd <= structure.sourceEnd))) {
            const role = tokenEnd <= structure.unitStart ? 'denominator-numeral' : 'numerator-numeral';
            return makeDerivedSubspanToken(token, 0, length, {
                pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
                structuredFractionRole: role, structuredFractionSource: 'fraction-structure'
            }, {
                annotations: ['structuredFractionRole', 'structuredFractionSource'],
                evidenceSource: 'fraction-structure', semanticRole: `fraction-${role}`
            });
        }
        return token;
    });
}


const typedTemporalPeriodSurfaces = new Set([
    '今日','明日','昨日','一昨日','明後日','毎日','今週','来週','先週','毎週',
    '今月','来月','先月','毎月','今年','来年','去年','毎年','一日'
]);
const morphologicalJoinParticleSurfaces = new Set(['て', 'で', 'ば']);

function isTypedTemporalPeriodSurface(surface) {
    const value = String(surface || '');
    if (typedTemporalPeriodSurfaces.has(value)) return true;
    return /^(?:[〇零一二三四五六七八九十百千万億兆0-9]+)(?:日|週間?|[ヶヵケかカ箇]月|年|時間)$/u.test(value);
}

function getTokenizerReadingForSurface(surface) {
    if (!runtimeState.tokenizer || !surface) return null;
    const tokens = runtimeState.tokenizer.tokenize(String(surface));
    if (!tokens.length || tokens.some(token => isProperNounToken(token))) return null;
    const readings = tokens.map(getKuromojiDictionaryReading);
    return readings.every(Boolean) ? readings.join('') : null;
}

function makeTypedTemporalSuffixToken(token) {
    return makeDerivedSubspanToken(token, 0, 1, {
        surface_form: '中', reading: 'ジュウ', pronunciation: 'ジュウ',
        pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalSuffix: true
    }, {
        annotations: ['typedTemporalSuffix'], evidenceSource: 'typed-temporal-boundary', semanticRole: 'temporal-suffix'
    });
}

function retokenizeTypedBoundaryRemainder(token, remainder) {
    const originalPosition = Number(token?.word_position || 0);
    const basePosition = originalPosition > 0 ? originalPosition + 1 : originalPosition;
    const originalCharacters = Array.from(String(token?.surface_form || ''));
    const startOffset = Math.max(0, originalCharacters.length - Array.from(remainder).length);
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    if (!retokenized.length) return [makeDerivedSubspanToken(token, startOffset, originalCharacters.length, {
        surface_form: remainder, reading: '*', pronunciation: '*',
        word_position: basePosition, tokenizationRoleBoundaryBefore: true
    }, { evidenceSource: 'typed-temporal-boundary', semanticRole: 'temporal-remainder' })];
    let consumed = 0;
    return retokenized.map((item, index) => {
        const length = Array.from(String(item?.surface_form || '')).length;
        const derived = makeDerivedSubspanToken(token, startOffset + consumed, startOffset + consumed + length, {
            ...item,
            word_position: basePosition > 0 && Number(item.word_position || 0) > 0 ? basePosition + Number(item.word_position) - 1 : Number(item.word_position || 0),
            tokenizationRoleBoundaryBefore: index === 0 || Boolean(item.tokenizationRoleBoundaryBefore)
        }, { evidenceSource: 'typed-temporal-boundary', semanticRole: 'temporal-remainder' });
        consumed += length;
        return derived;
    });
}

function getTrailingTypedTemporalHeadSpan(tokens) {
    if (!tokens?.length) return null;
    const lastIndex = tokens.length - 1;
    const lastSurface = String(tokens[lastIndex]?.surface_form || '');
    if (isTypedTemporalPeriodSurface(lastSurface)) return { startIndex: lastIndex, surface: lastSurface, token: tokens[lastIndex] };
    if (!/^(?:日|週間?|[ヶヵケかカ箇]月|月|年|時間)$/u.test(lastSurface)) return null;
    let startIndex = lastIndex;
    let numeralSurface = '';
    while (startIndex > 0 && isJapaneseNumeralSurface(tokens[startIndex - 1]?.surface_form)) {
        startIndex -= 1;
        numeralSurface = String(tokens[startIndex].surface_form || '') + numeralSurface;
    }
    if (!numeralSurface) return null;
    const surface = numeralSurface + lastSurface;
    return isTypedTemporalPeriodSurface(surface) ? { startIndex, surface, token: tokens[startIndex] } : null;
}

function makeStructuredTemporalHeadToken(tokens, span) {
    const members = tokens.slice(span.startIndex);
    const reading = normalizeKanaReading(members.map(getKuromojiDictionaryReading).filter(Boolean).join('') || getTokenizerReadingForSurface(span.surface) || '');
    return makeDerivedSpanToken(tokens, span.startIndex, tokens.length - 1, {
        surface_form: span.surface,
        reading: reading || '*',
        pronunciation: reading || '*',
        pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
        structuredTemporalHead: true
    }, {
        annotations: ['structuredTemporalHead'], evidenceSource: 'typed-temporal-structure', semanticRole: 'temporal-head'
    });
}

function getStandaloneSingleToken(surface) {
    if (!runtimeState.tokenizer || !surface) return null;
    const standalone = runtimeState.tokenizer.tokenize(String(surface));
    if (standalone.length !== 1 || String(standalone[0]?.surface_form || '') !== String(surface)) return null;
    return standalone[0];
}

function isStandaloneOrdinaryLexicalNoun(surface) {
    const token = getStandaloneSingleToken(surface);
    return Boolean(token && token.pos === '名詞' && token.pos_detail_1 !== '接尾' && !isProperNounToken(token));
}

function getAttestedTypedTemporalLexicalCollision(headSpan, token) {
    const lexicalSurface = String(token?.surface_form || '');
    if (!headSpan || !lexicalSurface.startsWith('中') || lexicalSurface === '中') return null;
    if (!isStandaloneOrdinaryLexicalNoun(lexicalSurface)) return null;
    const remainderSurface = lexicalSurface.slice(1);
    if (!isStandaloneOrdinaryLexicalNoun(remainderSurface)) return null;
    const spanSurface = String(headSpan.surface || '') + '中';
    const lookup = getGeneralWordLookup(spanSurface);
    const expectedReading = getTypedTemporalHeadReading(headSpan.surface, headSpan.token) + 'じゅう';
    const spanAttested = Boolean(expectedReading && lookup?.entry?.readings?.some(item => normalizeKanaReading(item?.reading) === expectedReading));
    if (!spanAttested) return null;
    return {
        headSurface: String(headSpan.surface || ''),
        spanSurface,
        lexicalSurface,
        remainderSurface
    };
}

function repairTypedTemporalExpressionBoundaries(tokens) {
    const repaired = [];
    for (const token of tokens || []) {
        const surface = String(token?.surface_form || '');
        if (surface.startsWith('中') && surface !== '中') {
            const headSpan = getTrailingTypedTemporalHeadSpan(repaired);
            if (headSpan && isStandaloneOrdinaryLexicalNoun(surface)) {
                const collision = getAttestedTypedTemporalLexicalCollision(headSpan, token);
                repaired.push(collision ? makeDerivedSpanToken([token], 0, 0, { typedTemporalSpanLexicalCollision: collision }, { annotations: ['typedTemporalSpanLexicalCollision'], evidenceSource: 'typed-temporal-boundary', semanticRole: 'lexical-temporal-collision', reviewRequired: true }) : token);
                continue;
            }
            if (headSpan) {
                const head = makeStructuredTemporalHeadToken(repaired, headSpan);
                repaired.splice(headSpan.startIndex, repaired.length - headSpan.startIndex, head);
                repaired.push(makeTypedTemporalSuffixToken(token));
                repaired.push(...retokenizeTypedBoundaryRemainder(token, surface.slice(1)));
                continue;
            }
        }
        repaired.push(token);
    }
    return repaired;
}

function makeTypedTemporalSpanToken(members, surface, reading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    return makeDerivedSpanToken(spanTokens, 0, spanTokens.length - 1, {
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalExpressionMatched: true,
        typedTemporalExpressionType: 'period-span',
        typedTemporalReading: reading,
        typedTemporalSource: 'typed-period-span'
    }, {
        annotations: ['typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource'],
        evidenceSource: 'typed-period-span', semanticRole: 'temporal-period'
    });
}

/** @param {string} surface @param {CJ2RToken|null} [token] */
function getTypedTemporalHeadReading(surface, token = null) {
    if (/^(?:一|1|１)日$/u.test(String(surface || ''))) return 'いちにち';
    const reviewed = runtimeState.counterDateReadingDictionary.get(String(surface || ''));
    if (reviewed?.reading) return normalizeKanaReading(reviewed.reading);
    const direct = token && String(token.surface_form || '') === surface ? getKuromojiDictionaryReading(token) : null;
    return normalizeKanaReading(direct || getTokenizerReadingForSurface(surface) || '');
}

function repairTypedTemporalSpanFollowerToken(token) {
    if (!token || isParticle(token) || token.pos === '記号' || token.pos === '助動詞') return token;
    const surface = String(token.surface_form || '');
    if (!surface) return token;
    const standalone = getStandaloneSingleToken(surface);
    const contextualRole = token.pos === '名詞' && (token.pos_detail_1 === '接尾' || isProperNounToken(token));
    const standaloneIndependent = standalone?.pos === '名詞' && standalone.pos_detail_1 !== '接尾' && !isProperNounToken(standalone);
    const repaired = contextualRole && standaloneIndependent ? {
        ...standalone,
        word_position: token.word_position,
        tokenizationRoleRepair: 'typed-temporal-span-follower'
    } : { ...token };
    repaired.tokenizationRoleBoundaryBefore = true;
    return repaired;
}

function sealTypedTemporalSpanFollowerBoundaries(tokens) {
    return (tokens || []).map((token, index) => {
        const previous = tokens[index - 1] || null;
        if (previous?.typedTemporalExpressionMatched !== true || previous?.typedTemporalExpressionType !== 'period-span') return token;
        return repairTypedTemporalSpanFollowerToken(token);
    });
}

function mergeTypedTemporalSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const surface = String(token?.surface_form || '');
        if (surface === '中' && !hasReviewedLexicalBoundaryBefore(token)) {
            const headSpan = getTrailingTypedTemporalHeadSpan(merged);
            if (headSpan) {
                const head = makeStructuredTemporalHeadToken(merged, headSpan);
                merged.splice(headSpan.startIndex, merged.length - headSpan.startIndex);
                merged.push(makeTypedTemporalSpanToken([head, token], headSpan.surface + '中', getTypedTemporalHeadReading(headSpan.surface, head) + 'じゅう'));
                continue;
            }
        }
        if (surface.endsWith('中') && surface.length > 1) {
            const headSurface = surface.slice(0, -1);
            if (isTypedTemporalPeriodSurface(headSurface)) {
                const headReading = getTypedTemporalHeadReading(headSurface);
                if (headReading) {
                    merged.push(makeTypedTemporalSpanToken([token], surface, headReading + 'じゅう'));
                    continue;
                }
            }
        }
        const next = tokens[index + 1];
        if (isTypedTemporalPeriodSurface(surface) && String(next?.surface_form || '') === '中' && !hasReviewedLexicalBoundaryBefore(next)) {
            const headReading = getTypedTemporalHeadReading(surface, token);
            if (headReading) {
                merged.push(makeTypedTemporalSpanToken([token, next], surface + '中', headReading + 'じゅう'));
                index += 1;
                continue;
            }
        }
        merged.push(token);
    }
    return sealTypedTemporalSpanFollowerBoundaries(merged);
}

function isCalendarMonthSurface(surface) {
    return /^(?:[〇零一二三四五六七八九十百0-9]+)月$/u.test(String(surface || ''));
}

function isOneDayNumeralSurface(surface) {
    return /^(?:一|1|１)$/u.test(String(surface || ''));
}

function getOneDaySpan(tokens, startIndex) {
    const token = tokens[startIndex];
    const surface = String(token?.surface_form || '');
    if (/^(?:一|1|１)日$/u.test(surface)) return { length: 1, head: token };
    const next = tokens[startIndex + 1];
    if (isOneDayNumeralSurface(surface) && String(next?.surface_form || '') === '日'
        && (token?.pos_detail_1 === '数' || isJapaneseNumeralSurface(surface) || /^[0-9０-９]$/u.test(surface))
        && next?.pos_detail_2 === '助数詞') return { length: 2, head: token };
    return null;
}

function getOneDaySpanSurface(tokens, startIndex, span) {
    return (tokens || []).slice(startIndex, startIndex + span.length).map(token => String(token?.surface_form || '')).join('');
}

function isTransparentNumericContextBoundaryToken(token) {
    return Boolean(token?.canonicalBoundary && isCanonicalTransparentBoundarySurface(token.surface_form));
}

function getPreviousNumericContextToken(tokens, startIndex) {
    let index = startIndex - 1;
    while (index >= 0 && isTransparentNumericContextBoundaryToken(tokens[index])) index -= 1;
    return { token: index >= 0 ? tokens[index] : null, index };
}

function getNextNumericContextToken(tokens, endIndex) {
    let index = endIndex + 1;
    while (index < (tokens || []).length && isTransparentNumericContextBoundaryToken(tokens[index])) index += 1;
    return { token: index < (tokens || []).length ? tokens[index] : null, index };
}

function hasOneDayCalendarPredecessor(tokens, startIndex) {
    const previous = getPreviousNumericContextToken(tokens, startIndex);
    const previousSurface = String(previous.token?.surface_form || '');
    if (isCalendarMonthSurface(previousSurface) || previousSurface === '毎月' || previousSurface === '各月') return true;
    const beforePrevious = getPreviousNumericContextToken(tokens, previous.index);
    const beforePreviousSurface = String(beforePrevious.token?.surface_form || '');
    return previousSurface === '月'
        && /^(?:[〇零一二三四五六七八九十百0-9０-９]+)$/u.test(beforePreviousSurface);
}

function isSahenPredicateStructureAt(tokens, startIndex) {
    const noun = tokens[startIndex] || null;
    if (!noun || noun.pos !== '名詞' || noun.pos_detail_1 !== 'サ変接続') return false;
    let verbIndex = startIndex + 1;
    const connector = tokens[verbIndex] || null;
    if (isParticle(connector) && String(connector.surface_form || '') === 'を') verbIndex += 1;
    const verb = tokens[verbIndex] || null;
    return Boolean(verb && verb.pos === '動詞' && tokenBasicForm(verb) === 'する');
}

function hasFollowingPredicateAfterOneDayNominal(tokens, startIndex) {
    const first = tokens[startIndex] || null;
    if (!first || first.pos !== '名詞' || isParticle(first) || isPrefix(first) || isSuffix(first)) return false;
    for (let index = startIndex + 1; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!token || token.pos === '記号') return false;
        if (token.pos === '動詞' || token.pos === '形容詞' || isSahenPredicateStructureAt(tokens, index)) return true;
    }
    return false;
}

function isOneDayDurationFollower(tokens, startIndex) {
    const token = tokens[startIndex] || null;
    if (!token) return false;
    const surface = String(token.surface_form || '');
    return token.pos === '動詞' || token.pos === '形容詞'
        || token.pos_detail_1 === '数' || token.numericExpression
        || isJapaneseNumeralSurface(surface)
        || /^(?:[〇零一二三四五六七八九十百0-9]+)(?:回|度|日|時間)$/u.test(surface)
        || /^(?:分|間|以内|以下|以上|未満|程度|ごと|毎|置き|おき|当たり|あたり|目|後|前|ぶり|半)$/u.test(surface)
        || (isParticle(token) && surface === 'で')
        || isSahenPredicateStructureAt(tokens, startIndex)
        || hasFollowingPredicateAfterOneDayNominal(tokens, startIndex);
}

function isFrequencyCountStructureAt(tokens, startIndex) {
    const token = tokens[startIndex] || null;
    if (!token) return false;
    const surface = String(token.surface_form || '');
    if (/^[〇零一二三四五六七八九十百0-9]+(?:回|度)$/u.test(surface)) return true;
    if (!isJapaneseNumeralSurface(surface)) return false;
    let index = startIndex;
    while (index < tokens.length && isJapaneseNumeralSurface(tokens[index]?.surface_form)) index += 1;
    const unit = String(tokens[index]?.surface_form || '');
    return unit === '回' || unit === '度';
}

function hasOneDayFrequencyContext(tokens, startIndex) {
    const particle = tokens[startIndex] || null;
    return Boolean(
        particle
        && isParticle(particle)
        && String(particle.surface_form || '') === 'に'
        && isFrequencyCountStructureAt(tokens, startIndex + 1)
    );
}

function makeAmbiguousOneDayTemporalToken(tokens, startIndex, span) {
    const endIndex = startIndex + span.length - 1;
    const surface = getOneDaySpanSurface(tokens, startIndex, span);
    const calendarEvidence = getReviewedCounterDateEvidence(surface, 'date');
    const reading = normalizeKanaReading(calendarEvidence?.reading || 'ついたち') || 'ついたち';
    return makeDerivedSpanToken(tokens, startIndex, endIndex, {
        surface_form: surface,
        reading, pronunciation: reading,
        pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalExpressionMatched: true,
        typedTemporalExpressionType: 'ambiguous-day',
        typedTemporalReading: reading,
        typedTemporalSource: 'terminal-one-day-provisional-calendar',
        typedTemporalRoleState: 'ambiguous',
        typedTemporalRoleSource: 'terminal-one-day-role-conflict',
        typedTemporalRoleReviewRequired: true,
        typedTemporalRoleAlternatives: ['calendar-date', 'duration-day']
    }, {
        annotations: [
            'typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource',
            'typedTemporalRoleState', 'typedTemporalRoleSource', 'typedTemporalRoleReviewRequired', 'typedTemporalRoleAlternatives'
        ],
        evidenceSource: 'terminal-one-day-role-conflict',
        semanticRole: 'temporal-role-ambiguous',
        reviewRequired: true
    });
}

function markTypedOneDayDurationTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getOneDaySpan(tokens, index);
        if (!span) { resolved.push(tokens[index]); continue; }
        if (hasOneDayCalendarPredecessor(tokens, index)) {
            resolved.push(tokens[index]);
            continue;
        }
        let scan = index + span.length;
        while (scan < tokens.length && isTransparentNumericContextBoundaryToken(tokens[scan])) scan += 1;
        let next = tokens[scan] || null;
        while (next && scan < tokens.length - 1 && isParticle(next) && ['だけ','も','は'].includes(String(next.surface_form || ''))) {
            scan += 1;
            while (scan < tokens.length && isTransparentNumericContextBoundaryToken(tokens[scan])) scan += 1;
            next = tokens[scan] || null;
        }
        const frequencyContext = hasOneDayFrequencyContext(tokens, scan);
        const followingParticle = tokens[scan] || null;
        const explicitCalendarContext = Boolean(
            isParticle(followingParticle)
            && String(followingParticle.surface_form || '') === 'に'
            && !frequencyContext
        );
        const durationContext = isOneDayDurationFollower(tokens, scan) || frequencyContext;
        if (!durationContext) {
            if (explicitCalendarContext) {
                resolved.push(tokens[index]);
                continue;
            }
            resolved.push(makeAmbiguousOneDayTemporalToken(tokens, index, span));
            index += span.length - 1;
            continue;
        }
        const surface = getOneDaySpanSurface(tokens, index, span);
        resolved.push(makeDerivedSpanToken(tokens, index, index + span.length - 1, {
            surface_form: surface,
            reading: 'イチニチ', pronunciation: 'イチニチ',
            pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
            typedTemporalExpressionMatched: true,
            typedTemporalExpressionType: 'duration-day',
            typedTemporalReading: 'いちにち',
            typedTemporalSource: 'typed-duration-context'
        }, {
            annotations: ['typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource'],
            evidenceSource: 'typed-duration-context', semanticRole: 'temporal-duration'
        }));
        index += span.length - 1;
    }
    return resolved;
}

function getAttestedFrequencyCounterReading(tokens, startIndex, endIndex, surface) {
    const members = (tokens || []).slice(startIndex, endIndex + 1);
    const reviewed = getReviewedCounterDateEvidence(surface, 'counter');
    if (reviewed?.reading) return reviewed.reading;
    const digitCounter = String(surface || '').match(/^([0-9０-９]+)(回|度)$/u);
    if (digitCounter) {
        const unitReading = normalizeKanaReading(getTokenizerReadingForSurface(digitCounter[2]) || '');
        if (unitReading) {
            const numeral = digitCounter[1].replace(/[０-９]/gu, character => String(character.charCodeAt(0) - 0xFF10));
            return numeral + unitReading;
        }
    }
    const analyserReading = normalizeKanaReading(members.map(item => getKuromojiDictionaryReading(item) || '').join(''));
    if (!analyserReading) return null;
    const lookup = getGeneralWordLookup(surface);
    const matched = getGeneralWordCandidates(lookup).find(candidate => normalizeKanaReading(candidate?.reading || '') === analyserReading);
    if (matched?.reading) return matched.reading;
    const unit = members.at(-1) || null;
    return members.length > 1 && unit?.pos_detail_2 === '助数詞' ? analyserReading : null;
}


function canonicalizeDayDurationEvidenceSurface(surface) {
    const canonical = canonicalizeReviewedNumericAliasSurface(String(surface || ''));
    return canonical.replace(/[０-９]/gu, character => String(character.charCodeAt(0) - 0xFF10));
}

function getReviewedIrregularDayDurationReading(surface) {
    const canonicalSurface = canonicalizeDayDurationEvidenceSurface(surface);
    if (/^(?:一|1)日$/u.test(canonicalSurface)) return { reading: 'いちにち', source: 'duration-day-structure' };
    const reviewed = runtimeState.counterDateReadingDictionary.get(canonicalSurface) || null;
    if (!reviewed?.reading || reviewed.role !== 'calendar-date' || reviewed.unit !== '日') return null;
    return {
        reading: normalizeKanaReading(reviewed.reading),
        source: 'duration-day-structure+reviewed-day-reading'
    };
}

function isDayDurationNumeralToken(token) {
    const surface = String(token?.surface_form || '');
    return isJapaneseNumeralSurface(surface)
        || Boolean(getReviewedReadingPreferenceForSurface(surface)?.numericCanonical);
}

function getReviewedDayDurationSpan(tokens, startIndex) {
    const first = tokens[startIndex] || null;
    if (!first) return null;
    const previous = tokens[startIndex - 1] || null;
    if (sourceTokensAreContiguous(previous, first) && isDayDurationNumeralToken(previous)) return null;

    let numeralSurface = '';
    for (let endIndex = startIndex; endIndex < tokens.length; endIndex += 1) {
        const token = tokens[endIndex];
        if (endIndex > startIndex && !sourceTokensAreContiguous(tokens[endIndex - 1], token)) break;
        const surface = String(token?.surface_form || '');
        const directMatch = surface.match(/^([0-9０-９〇零一二三四五六七八九十百千万億兆壱壹弌弐貮貳弎参參肆伍陸漆柒捌玖拾]+)日間$/u);
        if (directMatch) {
            const completeNumeralSurface = numeralSurface + directMatch[1];
            const evidence = getReviewedIrregularDayDurationReading(completeNumeralSurface + '日');
            return evidence ? { endIndex, numeralSurface: completeNumeralSurface, evidence } : null;
        }
        if (surface === '日間' && numeralSurface) {
            const evidence = getReviewedIrregularDayDurationReading(numeralSurface + '日');
            return evidence ? { endIndex, numeralSurface, evidence } : null;
        }
        if (!isDayDurationNumeralToken(token)) break;
        numeralSurface += surface;
    }
    return null;
}

function markTypedDayDurationSpanTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getReviewedDayDurationSpan(tokens, index);
        if (!span) {
            resolved.push(tokens[index]);
            continue;
        }
        const reading = span.evidence.reading + 'かん';
        const members = tokens.slice(index, span.endIndex + 1);
        const surface = members.map(item => String(item?.surface_form || '')).join('');
        resolved.push(makeDerivedSpanToken(tokens, index, span.endIndex, {
            surface_form: surface,
            reading, pronunciation: reading,
            pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
            typedTemporalExpressionMatched: true,
            typedTemporalExpressionType: 'duration-day-span',
            typedTemporalReading: reading,
            typedTemporalSource: span.evidence.source,
            typedTemporalRoleState: 'selected',
            typedTemporalRoleSource: 'explicit-day-duration-structure',
            typedTemporalRoleReviewRequired: false,
            typedTemporalRoleAlternatives: ['duration-day']
        }, {
            annotations: ['typedTemporalExpressionMatched', 'typedTemporalExpressionType', 'typedTemporalReading', 'typedTemporalSource', 'typedTemporalRoleState', 'typedTemporalRoleSource', 'typedTemporalRoleReviewRequired', 'typedTemporalRoleAlternatives'],
            evidenceSource: span.evidence.source, semanticRole: 'temporal-duration', reviewRequired: false
        }));
        index = span.endIndex;
    }
    return resolved;
}

function markTypedFrequencyCounterRoleTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const previous = tokens[index - 1] || null;
        const beforePrevious = tokens[index - 2] || null;
        const inOneDayFrequencyFrame = Boolean(
            beforePrevious?.typedTemporalExpressionType === 'duration-day'
            && isParticle(previous)
            && String(previous.surface_form || '') === 'に'
        );
        if (!inOneDayFrequencyFrame) { resolved.push(token); continue; }

        const directSurface = String(token?.surface_form || '');
        let endIndex = index;
        let surface = directSurface;
        if (!/^[〇零一二三四五六七八九十百0-9]+(?:回|度)$/u.test(surface)) {
            if (!isJapaneseNumeralSurface(directSurface)) { resolved.push(token); continue; }
            let scan = index;
            surface = '';
            while (scan < tokens.length && isJapaneseNumeralSurface(tokens[scan]?.surface_form)) {
                surface += String(tokens[scan].surface_form || '');
                scan += 1;
            }
            const unitSurface = String(tokens[scan]?.surface_form || '');
            if (unitSurface !== '回' && unitSurface !== '度') { resolved.push(token); continue; }
            surface += unitSurface;
            endIndex = scan;
        }

        const reading = getAttestedFrequencyCounterReading(tokens, index, endIndex, surface);
        if (!reading) { resolved.push(token); continue; }
        resolved.push(makeDerivedSpanToken(tokens, index, endIndex, {
            surface_form: surface,
            reading,
            pronunciation: reading,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericRoleSelected: true,
            typedNumericRole: 'frequency-counter',
            typedNumericRoleState: 'selected',
            typedNumericRoleSource: 'duration-frequency-context',
            typedNumericRoleReviewRequired: false,
            typedNumericRoleAlternatives: ['frequency-counter'],
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'frequency-counter',
            typedNumericReading: reading,
            typedNumericSource: 'duration-frequency-context+attested-reading'
        }, {
            annotations: ['numericExpression', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives', 'typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource'],
            evidenceSource: 'duration-frequency-context+attested-reading', semanticRole: 'frequency-counter', reviewRequired: false
        }));
        index = endIndex;
    }
    return resolved;
}

/** @param {string} surface @param {string|null} [role] */
function getReviewedCounterDateEvidence(surface, role = null) {
    const sourceSurface = String(surface || '');
    const canonicalDecimalSurface = canonicalizeIdeographicDecimalNotationSurface(sourceSurface);
    const evidence = runtimeState.counterDateReadingDictionary.get(sourceSurface)
        || (canonicalDecimalSurface !== sourceSurface ? runtimeState.counterDateReadingDictionary.get(canonicalDecimalSurface) : null)
        || null;
    if (!evidence) return null;
    if (role && String(evidence.role || '') !== String(role)) return null;
    return evidence;
}

function hasConflictingGeneralWordReading(surface, proposedReading) {
    const lookup = getGeneralWordLookup(String(surface || ''));
    const candidates = getGeneralWordCandidates(lookup);
    if (!candidates.length) return false;
    const proposed = normalizeKanaReading(proposedReading || '');
    return candidates.some(candidate => {
        const reading = normalizeKanaReading(candidate?.reading || '');
        return reading && proposed && reading !== proposed;
    });
}

function getCompetingLexicalCandidateForSpan(candidates, members, proposedReading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const first = spanTokens[0] || {};
    const last = spanTokens.at(-1) || first;
    const start = Number(first.sourceStart);
    const end = Number(last.sourceEnd);
    const proposed = normalizeKanaReading(proposedReading || '');
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    return (candidates || []).find(candidate => {
        if (candidate?.category !== 'lexical' || candidate?.kind !== 'general-word') return false;
        if (candidate.sourceStart !== start || candidate.sourceEnd !== end) return false;
        const reading = normalizeKanaReading(candidate.reading || '');
        return reading && proposed && reading !== proposed;
    }) || null;
}

function getCompetingLexicalReadingForSpan(candidates, members, proposedReading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const first = spanTokens[0] || {};
    const last = spanTokens.at(-1) || first;
    const start = Number(first.sourceStart);
    const end = Number(last.sourceEnd);
    const proposed = normalizeKanaReading(proposedReading || '');
    if (!Number.isInteger(start) || !Number.isInteger(end) || !proposed) return null;
    for (const candidate of candidates || []) {
        if (candidate?.category !== 'lexical' || candidate.sourceStart !== start || candidate.sourceEnd !== end) continue;
        const readings = [candidate, ...(candidate.alternatives || [])];
        for (const evidence of readings) {
            const reading = normalizeKanaReading(evidence?.reading || '');
            if (reading && reading !== proposed) return { candidate, reading };
        }
    }
    return null;
}

function hasClockHourStructuralContext(tokens, startIndex, endIndex) {
    const previous = getPreviousNumericContextToken(tokens, startIndex);
    const previousSurface = String(previous.token?.surface_form || '');
    if (previousSurface === '午前' || previousSurface === '午後') return true;
    const next = getNextNumericContextToken(tokens, endIndex);
    const nextSurface = String(next.token?.surface_form || '');
    if (nextSurface === '半') return true;
    const directMinuteMatch = nextSurface.match(/^([0-9０-９〇零一二三四五六七八九十百]+)分$/u);
    if (directMinuteMatch && resolveMinuteCounterReading(directMinuteMatch[1])) return true;
    const minuteUnit = getNextNumericContextToken(tokens, next.index);
    if (isJapaneseNumeralSurface(nextSurface) && String(minuteUnit.token?.surface_form || '') === '分'
        && resolveMinuteCounterReading(nextSurface)) return true;
    return false;
}

function isAdverbialBunLexicalConflict(candidate) {
    const reading = normalizeKanaReading(candidate?.reading || '');
    return Boolean(reading && reading.endsWith('ぶん'));
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates @param {CJ2RToken} leftToken @param {CJ2RToken} suffixToken */
function hasLongerLexicalSpanAtSuffixBoundary(candidates, leftToken, suffixToken) {
    const boundaryStart = Number(leftToken?.sourceEnd);
    const suffixEnd = Number(suffixToken?.sourceEnd);
    if (!Number.isInteger(boundaryStart) || !Number.isInteger(suffixEnd)) return false;
    return (candidates || []).some(candidate => candidate?.category === 'lexical'
        && Number(candidate.sourceStart) === boundaryStart
        && Number(candidate.sourceEnd) > suffixEnd
        && Boolean(candidate.reading));
}

function hasIndependentMinuteCounterContext(tokens, startIndex, endIndex) {
    const previousContext = getPreviousNumericContextToken(tokens, startIndex);
    const previous = previousContext.token;
    const immediatePrevious = tokens?.[startIndex - 1] || null;
    const first = tokens?.[startIndex] || null;
    const next = tokens?.[endIndex + 1] || null;
    if (previous?.typedNumericRole === 'clock-hour' && previous?.typedNumericRoleState === 'selected') return true;
    if (immediatePrevious && first && sourceTokensAreContiguous(immediatePrevious, first) && isRule0NumericGroupBoundary(immediatePrevious, first)) return true;
    if (String(next?.surface_form || '') === '間') return true;
    return next?.pos === '動詞' || next?.pos === '形容詞';
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} candidates @param {CJ2RToken[]|CJ2RToken} members @param {string} proposedReading */
function getContextualCommonWordCandidateForSpan(candidates, members, proposedReading) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const first = spanTokens[0] || {};
    const last = spanTokens.at(-1) || first;
    const start = Number(first.sourceStart);
    const end = Number(last.sourceEnd);
    const proposed = normalizeKanaReading(proposedReading || '');
    if (!Number.isInteger(start) || !Number.isInteger(end)) return null;
    return (candidates || []).find(candidate => {
        if (candidate?.category !== 'lexical' || candidate?.kind !== 'common-word' || !candidate?.metadata?.contextPattern) return false;
        if (candidate.sourceStart !== start || candidate.sourceEnd !== end) return false;
        const reading = normalizeKanaReading(candidate.reading || '');
        return reading && proposed && reading !== proposed;
    }) || null;
}


function makeTypedNumericRoleToken(members, surface, role, source, options = {}) {
    const spanTokens = Array.isArray(members) ? members : [members];
    const state = options.state === 'ambiguous' ? 'ambiguous' : 'selected';
    const alternatives = [...new Set(Array.isArray(options.alternatives) ? options.alternatives.filter(Boolean) : [])];
    return makeDerivedSpanToken(spanTokens, 0, spanTokens.length - 1, {
        surface_form: surface,
        ...(options.fallbackReading ? { reading: options.fallbackReading, pronunciation: options.fallbackReading } : {}),
        pos: state === 'selected' ? '名詞' : (spanTokens[0]?.pos || '名詞'),
        pos_detail_1: state === 'selected' ? '数' : (spanTokens[0]?.pos_detail_1 || '一般'),
        pos_detail_2: state === 'selected' ? '*' : (spanTokens[0]?.pos_detail_2 || '*'), pos_detail_3: '*',
        numericExpression: state === 'selected',
        typedNumericRoleSelected: state === 'selected',
        typedNumericRole: state === 'selected' ? role : null,
        typedNumericRoleState: state,
        typedNumericRoleSource: source,
        typedNumericRoleReviewRequired: state === 'ambiguous',
        typedNumericRoleAlternatives: alternatives
    }, {
        annotations: ['numericExpression', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives'],
        evidenceSource: source, semanticRole: role, reviewRequired: state === 'ambiguous'
    });
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markAmbiguousNumericRoleTokens(tokens, sourceSpanCandidates = []) {
    return (tokens || []).map((token, index) => {
        if (token?.typedNumericRole || token?.typedTemporalExpressionMatched) return token;
        const surface = String(token?.surface_form || '');
        const minuteMatch = surface.match(/^([0-9０-９〇零一二三四五六七八九十百]+)分$/u);
        if (!minuteMatch) return token;
        const resolvedMinute = resolveMinuteCounterReading(minuteMatch[1]);
        if (!resolvedMinute?.reading || !hasConflictingGeneralWordReading(surface, resolvedMinute.reading)) return token;
        const lexical = getGeneralWordCandidates(getGeneralWordLookup(surface)).find(candidate => normalizeKanaReading(candidate?.reading || '') !== normalizeKanaReading(resolvedMinute.reading));
        if (!lexical) return token;
        const next = tokens?.[index + 1] || null;
        const lexicalContinuation = String(next?.surface_form || '') === '間'
            && sourceTokensAreContiguous(token, next)
            && hasLongerLexicalSpanAtSuffixBoundary(sourceSpanCandidates, token, next);
        if (String(next?.surface_form || '') === '間' && sourceTokensAreContiguous(token, next) && !lexicalContinuation) {
            return makeTypedNumericRoleToken([token], surface, 'minute-counter', 'minute-duration-structure', {
                state: 'selected', alternatives: ['minute-counter']
            });
        }
        if (getContextualCommonWordCandidateForSpan(sourceSpanCandidates, [token], resolvedMinute.reading)) return token;
        return makeDerivedSpanToken([token], 0, 0, {
            reading: lexical.reading, pronunciation: lexical.reading,
            typedNumericRoleSelected: false,
            typedNumericRole: null,
            typedNumericRoleState: 'ambiguous',
            typedNumericRoleSource: 'numeric-role-conflict',
            typedNumericRoleReviewRequired: true,
            typedNumericRoleAlternatives: ['minute-counter', 'lexical']
        }, {
            annotations: ['typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState', 'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives'],
            evidenceSource: 'numeric-role-conflict', semanticRole: 'unresolved-numeric-role', reviewRequired: true
        });
    });
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markTypedClockHourRoleTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const directSurface = String(token?.surface_form || '');
        const directEvidence = getReviewedCounterDateEvidence(directSurface, 'clock-hour');
        if (/^[0-9０-９〇零一二三四五六七八九十百]+時$/u.test(directSurface)
            && directEvidence
            && String(tokens[index + 1]?.surface_form || '') !== '間') {
            const members = [token];
            const lexicalConflict = getCompetingLexicalReadingForSpan(sourceSpanCandidates, members, directEvidence.reading);
            const roleEstablished = hasClockHourStructuralContext(tokens, index, index);
            merged.push(makeTypedNumericRoleToken(members, directSurface, 'clock-hour', lexicalConflict && !roleEstablished ? 'numeric-role-conflict' : 'counter-date-role-evidence', {
                state: lexicalConflict && !roleEstablished ? 'ambiguous' : 'selected',
                alternatives: lexicalConflict && !roleEstablished ? ['clock-hour', 'lexical'] : ['clock-hour'],
                fallbackReading: lexicalConflict && !roleEstablished ? directEvidence.reading : null
            }));
            continue;
        }
        if (!isJapaneseNumeralSurface(directSurface)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
            if (end > index) {
                if (!sourceTokensAreContiguous(tokens[end - 1], tokens[end])) break;
                if (isRule0NumericGroupBoundary(tokens[end - 1], tokens[end])) break;
            }
            numeralSurface += String(tokens[end].surface_form || '');
            end += 1;
        }
        const unit = tokens[end] || null;
        if (String(unit?.surface_form || '') !== '時'
            || hasReviewedLexicalBoundaryBefore(unit)
            || String(tokens[end + 1]?.surface_form || '') === '間') {
            merged.push(token);
            continue;
        }
        const surface = numeralSurface + '時';
        const evidence = getReviewedCounterDateEvidence(surface, 'clock-hour');
        if (!evidence) { merged.push(token); continue; }
        const members = tokens.slice(index, end + 1);
        const lexicalConflict = getCompetingLexicalReadingForSpan(sourceSpanCandidates, members, evidence.reading);
        const roleEstablished = hasClockHourStructuralContext(tokens, index, end);
        merged.push(makeTypedNumericRoleToken(members, surface, 'clock-hour', lexicalConflict && !roleEstablished ? 'numeric-role-conflict' : 'counter-date-role-evidence', {
            state: lexicalConflict && !roleEstablished ? 'ambiguous' : 'selected',
            alternatives: lexicalConflict && !roleEstablished ? ['clock-hour', 'lexical'] : ['clock-hour'],
            fallbackReading: lexicalConflict && !roleEstablished ? evidence.reading : null
        }));
        index = end;
    }
    return merged;
}


const embeddedCounterKanjiNumeralPattern = /^[〇零一二三四五六七八九十百千万億兆]+$/u;

function isEmbeddedCounterKanjiNumeralToken(token) {
    const surface = String(token?.surface_form || '');
    return embeddedCounterKanjiNumeralPattern.test(surface)
        && (token?.pos_detail_1 === '数' || isJapaneseNumeralSurface(surface));
}

function getReviewedHundredCounterTailEvidence(unitSurface) {
    const sourceSurface = `百${String(unitSurface || '')}`;
    const entry = runtimeState.counterDateReadingDictionary.get(sourceSurface) || null;
    if (entry?.role !== 'counter' || entry.unit !== unitSurface || !entry.hundredTailReading) return null;
    const hundredTailReading = normalizeKanaReading(entry.hundredTailReading);
    return hundredTailReading ? { hundredTailReading, sourceSurface } : null;
}

function getReviewedNumericComponentEntries() {
    const entries = [];
    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        if (entry?.role !== 'numeric-component' || !entry.reading || !embeddedCounterKanjiNumeralPattern.test(surface)) continue;
        entries.push({ surface, reading: normalizeKanaReading(entry.reading) });
    }
    return entries.sort((a, b) => Array.from(b.surface).length - Array.from(a.surface).length);
}

function getReviewedOrTokenizerNumeralReading(surface) {
    const numeralSurface = String(surface || '');
    const reviewed = getReviewedCounterDateEvidence(numeralSurface, 'numeric-component');
    if (reviewed?.reading) return normalizeKanaReading(reviewed.reading);
    if (!embeddedCounterKanjiNumeralPattern.test(numeralSurface)) {
        return normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
    }

    const components = getReviewedNumericComponentEntries();
    const characters = Array.from(numeralSurface);
    const pieces = [];
    let cursor = 0;
    let usedReviewedComponent = false;
    while (cursor < characters.length) {
        const remainder = characters.slice(cursor).join('');
        const component = components.find(item => remainder.startsWith(item.surface));
        if (component) {
            pieces.push(component.reading);
            cursor += Array.from(component.surface).length;
            usedReviewedComponent = true;
            continue;
        }

        let nextReviewedOffset = characters.length;
        for (let offset = cursor + 1; offset < characters.length; offset += 1) {
            const candidateRemainder = characters.slice(offset).join('');
            if (components.some(item => candidateRemainder.startsWith(item.surface))) {
                nextReviewedOffset = offset;
                break;
            }
        }
        const ordinarySurface = characters.slice(cursor, nextReviewedOffset).join('');
        const ordinaryReading = normalizeKanaReading(getTokenizerReadingForSurface(ordinarySurface) || '');
        if (!ordinaryReading) return normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
        pieces.push(ordinaryReading);
        cursor = nextReviewedOffset;
    }
    return usedReviewedComponent ? pieces.join('') : normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
}

function getReviewedEmbeddedCounterTailEvidence(numeralSurface, unitSurface, fullSurface) {
    const exactWhole = runtimeState.counterDateReadingDictionary.get(String(fullSurface || '')) || null;
    if (exactWhole?.reading && exactWhole.role === 'counter') return null;
    let best = null;
    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        if (!entry?.numericTail || entry.role !== 'counter' || entry.unit !== unitSurface || !surface.endsWith(unitSurface)) continue;
        const tailNumeral = surface.slice(0, -unitSurface.length);
        if (!tailNumeral || !embeddedCounterKanjiNumeralPattern.test(tailNumeral) || !numeralSurface.endsWith(tailNumeral)) continue;
        if (!best || Array.from(tailNumeral).length > Array.from(best.tailNumeral).length) {
            best = { tailNumeral, reading: normalizeKanaReading(entry.reading), sourceSurface: surface };
        }
    }
    return best?.reading ? best : null;
}

function isRule0NumericGroupBoundary(previousToken, token) {
    if (!isJapaneseNumeralSurface(previousToken?.surface_form) || !isJapaneseNumeralSurface(token?.surface_form)) return false;
    if (isLargeNumericUnitSurface(token.surface_form)) return false;
    return numericGroupTerminalPattern.test(String(previousToken.surface_form || ''));
}

function getEmbeddedCounterTailSpan(tokens, startIndex) {
    const first = tokens[startIndex] || null;
    if (!first) return null;
    let numeralStart = startIndex;
    let ordinalPrefix = '';
    if (String(first.surface_form || '') === '第' && first.pos === '接頭詞' && first.pos_detail_1 === '数接続') {
        numeralStart += 1;
        ordinalPrefix = '第';
    } else if (!isEmbeddedCounterKanjiNumeralToken(first)) {
        return null;
    }
    const firstNumeral = tokens[numeralStart] || null;
    if (!isEmbeddedCounterKanjiNumeralToken(firstNumeral)) return null;
    const previous = tokens[startIndex - 1] || null;
    if (previous && sourceTokensAreContiguous(previous, first)
        && (isEmbeddedCounterKanjiNumeralToken(previous) || String(previous.surface_form || '') === '第')
        && !isRule0NumericGroupBoundary(previous, first)) return null;

    let end = numeralStart;
    let numeralSurface = '';
    while (end < tokens.length && isEmbeddedCounterKanjiNumeralToken(tokens[end])) {
        if (end > numeralStart) {
            if (!sourceTokensAreContiguous(tokens[end - 1], tokens[end])) break;
            if (isRule0NumericGroupBoundary(tokens[end - 1], tokens[end])) break;
        }
        numeralSurface += String(tokens[end].surface_form || '');
        end += 1;
    }
    const unit = tokens[end] || null;
    const unitSurface = String(unit?.surface_form || '');
    if (!unitSurface || unit?.pos !== '名詞' || unit?.pos_detail_1 !== '接尾' || unit?.pos_detail_2 !== '助数詞'
        || !sourceTokensAreContiguous(tokens[end - 1], unit)) return null;

    const fullSurface = ordinalPrefix + numeralSurface + unitSurface;
    if (numeralSurface.endsWith('百')) {
        const hundredEvidence = getReviewedHundredCounterTailEvidence(unitSurface);
        const numeralReading = hundredEvidence ? getReviewedOrTokenizerNumeralReading(numeralSurface) : '';
        const ordinalReading = ordinalPrefix ? normalizeKanaReading(getTokenizerReadingForSurface(ordinalPrefix) || '') : '';
        if (hundredEvidence && numeralReading.endsWith('く') && (!ordinalPrefix || ordinalReading)) {
            return {
                endIndex: end,
                surface: fullSurface,
                reading: ordinalReading + numeralReading.slice(0, -1) + hundredEvidence.hundredTailReading,
                evidence: { ...hundredEvidence, tailNumeral: '百' }
            };
        }
    }
    const evidence = getReviewedEmbeddedCounterTailEvidence(numeralSurface, unitSurface, fullSurface);
    if (!evidence) return null;
    const prefixNumeralLength = Array.from(numeralSurface).length - Array.from(evidence.tailNumeral).length;
    if (prefixNumeralLength < 0) return null;
    const prefixNumeral = Array.from(numeralSurface).slice(0, prefixNumeralLength).join('');
    if (!prefixNumeral && !ordinalPrefix) return null;
    const ordinalReading = ordinalPrefix ? normalizeKanaReading(getTokenizerReadingForSurface(ordinalPrefix) || '') : '';
    const numeralPrefixReading = prefixNumeral ? getReviewedOrTokenizerNumeralReading(prefixNumeral) : '';
    if ((ordinalPrefix && !ordinalReading) || (prefixNumeral && !numeralPrefixReading)) return null;
    return {
        endIndex: end,
        surface: fullSurface,
        reading: ordinalReading + numeralPrefixReading + evidence.reading,
        evidence
    };
}

function markTypedEmbeddedCounterTailTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getEmbeddedCounterTailSpan(tokens, index);
        if (!span) {
            resolved.push(tokens[index]);
            continue;
        }
        resolved.push(makeDerivedSpanToken(tokens, index, span.endIndex, {
            surface_form: span.surface,
            reading: span.reading,
            pronunciation: span.reading,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericRoleSelected: true,
            typedNumericRole: 'counter',
            typedNumericRoleState: 'selected',
            typedNumericRoleSource: 'reviewed-embedded-counter-tail',
            typedNumericRoleReviewRequired: false,
            typedNumericRoleAlternatives: ['counter'],
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'counter',
            typedNumericReading: span.reading,
            typedNumericSource: 'counter-date-numeric-tail-evidence'
        }, {
            annotations: [
                'numericExpression', 'typedNumericRoleSelected', 'typedNumericRole', 'typedNumericRoleState',
                'typedNumericRoleSource', 'typedNumericRoleReviewRequired', 'typedNumericRoleAlternatives',
                'typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource'
            ],
            evidenceSource: 'counter-date-numeric-tail-evidence', semanticRole: 'counter-expression', reviewRequired: false
        }));
        index = span.endIndex;
    }
    return resolved;
}

function getMinuteCounterFinalDigit(surface) {
    const chars = Array.from(String(surface || ''));
    const map = { '〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':0 };
    const last = chars.at(-1);
    if (/^[0-9]$/u.test(last || '')) return Number(last);
    return Object.prototype.hasOwnProperty.call(map, last) ? map[last] : null;
}

// Minute morphology is deliberately scoped to the already-selected minute role.
// It is not a universal counter sound-change heuristic.
function resolveMinuteCounterReading(numeralSurface) {
    const fullSurface = String(numeralSurface || '') + '分';
    const reviewed = getReviewedCounterDateEvidence(fullSurface, 'minute-counter');
    if (reviewed?.reading) return { reading: reviewed.reading, source: 'counter-date-reading-evidence' };
    const numeralReading = getReviewedOrTokenizerNumeralReading(numeralSurface);
    if (/百$/u.test(String(numeralSurface || '')) && /(?:ひゃく|びゃく|ぴゃく)$/u.test(numeralReading)) {
        return { reading: numeralReading.slice(0, -1) + 'っぷん', source: 'minute-counter-morphology' };
    }
    const finalDigit = getMinuteCounterFinalDigit(numeralSurface);
    if (!numeralReading) return null;
    if (finalDigit == null) {
        return /[千万億兆]$/u.test(String(numeralSurface || ''))
            ? { reading: numeralReading + 'ふん', source: 'minute-counter-morphology' }
            : null;
    }
    if (finalDigit === 1 && numeralReading.endsWith('いち')) return { reading: numeralReading.slice(0, -2) + 'いっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 6 && numeralReading.endsWith('ろく')) return { reading: numeralReading.slice(0, -2) + 'ろっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 8 && numeralReading.endsWith('はち')) return { reading: numeralReading.slice(0, -2) + 'はっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 0 && numeralReading.endsWith('じゅう')) return { reading: numeralReading.slice(0, -3) + 'じゅっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 3 || finalDigit === 4) return { reading: numeralReading + 'ぷん', source: 'minute-counter-morphology' };
    return { reading: numeralReading + 'ふん', source: 'minute-counter-morphology' };
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markTypedMinuteCounterRoleTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!isJapaneseNumeralSurface(token?.surface_form)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
            if (end > index) {
                if (!sourceTokensAreContiguous(tokens[end - 1], tokens[end])) break;
                if (isRule0NumericGroupBoundary(tokens[end - 1], tokens[end])) break;
            }
            numeralSurface += String(tokens[end].surface_form || '');
            end += 1;
        }
        const unit = tokens[end] || null;
        if (String(unit?.surface_form || '') !== '分' || unit?.structuredFractionRole === 'denominator-unit' || hasReviewedLexicalBoundaryBefore(unit)) {
            merged.push(token);
            continue;
        }
        const resolvedMinute = resolveMinuteCounterReading(numeralSurface);
        if (!resolvedMinute) { merged.push(token); continue; }
        const surface = numeralSurface + '分';
        const members = tokens.slice(index, end + 1);
        const contextualLexical = getContextualCommonWordCandidateForSpan(sourceSpanCandidates, members, resolvedMinute.reading);
        if (contextualLexical) {
            // Reviewed context-specific lexical evidence owns this numeric-looking
            // span. Leave the source tokens intact so the common-word stage can
            // merge the lexical head without swallowing its following context.
            merged.push(token);
            continue;
        }
        const lexicalConflict = getCompetingLexicalCandidateForSpan(sourceSpanCandidates, members, resolvedMinute.reading);
        const adverbialConflict = isAdverbialBunLexicalConflict(lexicalConflict);
        const durationSuffixToken = tokens?.[end + 1] || null;
        const lexicalContinuation = String(durationSuffixToken?.surface_form || '') === '間'
            && sourceTokensAreContiguous(unit, durationSuffixToken)
            && hasLongerLexicalSpanAtSuffixBoundary(sourceSpanCandidates, unit, durationSuffixToken);
        const durationSuffixContext = String(durationSuffixToken?.surface_form || '') === '間'
            && sourceTokensAreContiguous(unit, durationSuffixToken)
            && !lexicalContinuation;
        const unresolvedRole = Boolean(lexicalConflict
            && (lexicalContinuation
                || (!durationSuffixContext && !hasIndependentMinuteCounterContext(tokens, index, end))));
        merged.push(makeTypedNumericRoleToken(members, surface, 'minute-counter', unresolvedRole ? 'numeric-role-conflict' : 'numeric-role-structure', {
            state: unresolvedRole ? 'ambiguous' : 'selected',
            alternatives: unresolvedRole ? ['minute-counter', 'lexical'] : ['minute-counter'],
            fallbackReading: unresolvedRole ? (adverbialConflict ? lexicalConflict.reading : resolvedMinute.reading) : null
        }));
        index = end;
    }
    return merged;
}

function mergeIdeographicDecimalNotationTokens(tokens) {
    const merged = [];
    const input = tokens || [];
    for (let index = 0; index < input.length; index += 1) {
        const first = input[index];
        const firstSurface = String(first?.surface_form || '');
        if (first?.pos_detail_1 !== '数' || !isIdeographicDecimalDigitSurface(firstSurface)) {
            merged.push(first);
            continue;
        }

        const previous = input[index - 1] || null;
        if (previous && sourceTokensAreContiguous(previous, first)
            && isJapaneseNumeralSurface(previous.surface_form)
            && !isIdeographicDecimalDigitSurface(previous.surface_form)) {
            merged.push(first);
            continue;
        }

        let endIndex = index;
        let surface = firstSurface;
        while (endIndex + 1 < input.length) {
            const next = input[endIndex + 1];
            const nextSurface = String(next?.surface_form || '');
            if (next?.pos_detail_1 !== '数' || !isIdeographicDecimalDigitSurface(nextSurface)) break;
            if (!sourceTokensAreContiguous(input[endIndex], next)) break;
            surface += nextSurface;
            endIndex += 1;
        }

        const following = input[endIndex + 1] || null;
        const mixedWithNonDecimalNumeral = Boolean(following
            && sourceTokensAreContiguous(input[endIndex], following)
            && isJapaneseNumeralSurface(following.surface_form)
            && !isIdeographicDecimalDigitSurface(following.surface_form));
        const canonicalDigits = canonicalizeIdeographicDecimalNotationSurface(surface);
        if (mixedWithNonDecimalNumeral || canonicalDigits === surface || !surface.includes('〇')) {
            merged.push(...input.slice(index, endIndex + 1));
            index = endIndex;
            continue;
        }

        merged.push(makeDerivedSpanToken(input, index, endIndex, {
            surface_form: surface,
            reading: canonicalDigits,
            pronunciation: canonicalDigits,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'decimal-notation',
            typedNumericReading: canonicalDigits,
            typedNumericSource: 'ideographic-decimal-notation',
            ideographicDecimalNotationMatched: true,
            ideographicDecimalCanonicalDigits: canonicalDigits
        }, {
            annotations: [
                'numericExpression', 'typedNumericExpressionMatched', 'typedNumericExpressionType',
                'typedNumericReading', 'typedNumericSource', 'ideographicDecimalNotationMatched',
                'ideographicDecimalCanonicalDigits'
            ],
            evidenceSource: 'unicode-ideographic-decimal-notation',
            semanticRole: 'decimal-notation',
            reviewRequired: false
        }));
        index = endIndex;
    }
    return merged;
}

function applyTypedNumericRoleReadings(tokens) {
    return (tokens || []).map(token => {
        const role = String(token?.typedNumericRole || '');
        if (!role || (role !== 'clock-hour' && role !== 'minute-counter')) return token;
        let resolved = null;
        if (role === 'clock-hour') {
            const reviewed = getReviewedCounterDateEvidence(token.surface_form, 'clock-hour');
            if (reviewed?.reading) resolved = { reading: reviewed.reading, source: 'counter-date-reading-evidence' };
        } else if (role === 'minute-counter') {
            const surface = String(token.surface_form || '');
            resolved = resolveMinuteCounterReading(surface.endsWith('分') ? surface.slice(0, -1) : surface);
        }
        if (!resolved?.reading) return token;
        return makeDerivedSpanToken([token], 0, 0, {
            reading: resolved.reading,
            pronunciation: resolved.reading,
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: role,
            typedNumericReading: resolved.reading,
            typedNumericSource: resolved.source
        }, {
            annotations: ['typedNumericExpressionMatched', 'typedNumericExpressionType', 'typedNumericReading', 'typedNumericSource'],
            evidenceSource: resolved.source, semanticRole: role,
            reviewRequired: Boolean(token.typedNumericRoleReviewRequired)
        });
    });
}


function getStandaloneLexicalToken(surface) {
    if (!runtimeState.tokenizer || !surface) return null;
    const standalone = runtimeState.tokenizer.tokenize(String(surface));
    if (standalone.length !== 1) return null;
    const token = standalone[0];
    return token?.pos === '名詞' && token?.pos_detail_1 !== '接尾' ? token : null;
}

function repairCaseMarkedCounterFollowerTokens(tokens) {
    return (tokens || []).map((token, index) => {
        if (token?.pos !== '名詞' || token?.pos_detail_1 !== '接尾' || token?.pos_detail_2 !== '一般') return token;
        const previous = tokens[index - 1] || null;
        const next = tokens[index + 1] || null;
        if (previous?.pos_detail_2 !== '助数詞' || next?.pos !== '助詞' || next?.pos_detail_1 !== '格助詞') return token;
        const standalone = getStandaloneLexicalToken(token.surface_form);
        const currentReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
        const standaloneReading = normalizeKanaReading(getKuromojiDictionaryReading(standalone) || '');
        if (!standalone || !standaloneReading || standaloneReading === currentReading) return token;
        return {
            ...standalone,
            word_position: token.word_position,
            tokenizationRoleBoundaryBefore: true,
            tokenizationRoleRepair: 'case-marked-counter-follower'
        };
    });
}

const STRUCTURAL_UNIT_ROLE_SURFACES = Object.freeze(new Set([
    '話', '巻', '章', '節'
]));

const STRUCTURAL_UNIT_NOUN_MODIFIERS = Object.freeze(new Set([
    '最終'
]));

function makeStructuralRoleReadingCandidate(reading, source) {
    return {
        reading,
        romaji: convertToRomaji(reading),
        weight: 100,
        rank: 1,
        categories: new Set(['morphological-role']),
        sources: new Set([source])
    };
}

function getUniqueExactStructuralSuffixEvidence(token) {
    const surface = String(token?.surface_form || '');
    if (!STRUCTURAL_UNIT_ROLE_SURFACES.has(surface)) return null;
    const candidates = getKuromojiExactDictionaryCandidates(surface)
        .filter(candidate => candidate.pos === '名詞' && candidate.pos_detail_1 === '接尾' && candidate.pos_detail_2 === '助数詞');
    const readings = [...new Set(candidates.map(candidate => normalizeKanaReading(candidate.reading)).filter(Boolean))];
    if (readings.length !== 1) return null;
    const reading = readings[0];
    return {
        reading,
        candidates: [makeStructuralRoleReadingCandidate(reading, 'kuromoji-exact-counter-role')]
    };
}

function getUniqueExactOrdinaryPrefixEvidence(token) {
    const surface = String(token?.surface_form || '');
    if (!surface || !containsHan(surface)) return null;
    const candidates = getKuromojiExactDictionaryCandidates(surface)
        .filter(candidate => candidate.pos === '接頭詞' && candidate.pos_detail_1 === '名詞接続');
    const readings = [...new Set(candidates.map(candidate => normalizeKanaReading(candidate.reading)).filter(Boolean))];
    if (readings.length !== 1) return null;
    const reading = readings[0];
    return {
        reading,
        candidates: [makeStructuralRoleReadingCandidate(reading, 'kuromoji-exact-noun-prefix-role')]
    };
}

function isReviewedStructuralNounModifier(token) {
    const surface = String(token?.surface_form || '');
    if (!STRUCTURAL_UNIT_NOUN_MODIFIERS.has(surface) || isProperNounToken(token)) return false;
    const analyserReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
    if (!analyserReading) return false;
    return getGeneralWordCandidates(getGeneralWordLookup(surface))
        .some(candidate => normalizeKanaReading(candidate.reading) === analyserReading);
}

function getOrdinaryCompoundReadingEvidence(token) {
    if (!token || !isProperNounToken(token) || !containsHan(token.surface_form)) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    const candidates = getGeneralWordCandidates(lookup);
    if (!candidates.length) return null;
    const exactOrdinaryReadings = new Set(getKuromojiExactDictionaryCandidates(token.surface_form)
        .filter(candidate => candidate.pos === '名詞' && candidate.pos_detail_1 === '接尾' && candidate.pos_detail_2 === '助数詞')
        .map(candidate => normalizeKanaReading(candidate.reading))
        .filter(Boolean));
    const supported = candidates.filter(candidate => exactOrdinaryReadings.has(normalizeKanaReading(candidate.reading)));
    if (supported.length !== 1) return null;
    return { reading: supported[0].reading, candidates };
}

function annotateOrdinaryCompoundReadingContext(tokens) {
    const marked = (tokens || []).map(token => ({ ...token }));
    for (let index = 0; index < marked.length; index += 1) {
        const token = marked[index];
        const previous = marked[index - 1] || null;
        const next = marked[index + 1] || null;

        const ordinaryEvidence = getOrdinaryCompoundReadingEvidence(token);
        if (ordinaryEvidence) {
            const ordinaryNounPrefix = Boolean(
                previous
                && sourceTokensAreContiguous(previous, token)
                && previous.pos === '接頭詞'
                && previous.pos_detail_1 === '名詞接続'
                && !isProperNounToken(previous)
            );
            const ordinaryNounSuffix = Boolean(
                next
                && sourceTokensAreContiguous(token, next)
                && next.pos === '名詞'
                && next.pos_detail_1 === '接尾'
                && next.pos_detail_2 !== '人名'
                && !isProperNounToken(next)
            );
            if (ordinaryNounPrefix || ordinaryNounSuffix) {
                marked[index] = {
                    ...token,
                    ordinaryCompoundReadingMatched: true,
                    ordinaryCompoundReading: ordinaryEvidence.reading,
                    ordinaryCompoundReadingCandidates: ordinaryEvidence.candidates
                };
                if (ordinaryNounPrefix && STRUCTURAL_UNIT_ROLE_SURFACES.has(String(token.surface_form || ''))) {
                    marked[index - 1] = { ...previous, structuralPrefixRoleMatched: true };
                }
                continue;
            }
        }

        if (!previous || !sourceTokensAreContiguous(previous, token)) continue;
        const structuralEvidence = getUniqueExactStructuralSuffixEvidence(token);
        if (!structuralEvidence) continue;

        const currentOrdinaryPrefix = previous.pos === '接頭詞'
            && previous.pos_detail_1 === '名詞接続'
            && !isProperNounToken(previous);
        const recoveredPrefixEvidence = currentOrdinaryPrefix ? null : getUniqueExactOrdinaryPrefixEvidence(previous);
        const reviewedNounModifier = isReviewedStructuralNounModifier(previous);
        if (!currentOrdinaryPrefix && !recoveredPrefixEvidence && !reviewedNounModifier) continue;

        marked[index] = {
            ...token,
            structuralRoleReadingMatched: true,
            structuralRoleReading: structuralEvidence.reading,
            structuralRoleReadingCandidates: structuralEvidence.candidates,
            structuralSuffixRoleMatched: true
        };
        if (currentOrdinaryPrefix) {
            marked[index - 1] = { ...previous, structuralPrefixRoleMatched: true };
        } else if (recoveredPrefixEvidence) {
            marked[index - 1] = {
                ...previous,
                pos: '接頭詞',
                pos_detail_1: '名詞接続',
                pos_detail_2: '*',
                pos_detail_3: '*',
                basic_form: String(previous.surface_form || ''),
                structuralRoleReadingMatched: true,
                structuralRoleReading: recoveredPrefixEvidence.reading,
                structuralRoleReadingCandidates: recoveredPrefixEvidence.candidates,
                structuralPrefixRoleMatched: true
            };
        }
    }
    return marked;
}

function annotatePostCensorshipOrdinaryLexicalContext(tokens) {
    const marked = (tokens || []).map(token => ({ ...token }));
    for (let index = 1; index < marked.length; index += 1) {
        const token = marked[index];
        const previous = marked[index - 1];
        if (!previous?.censorshipMarker || !isProperNounToken(token) || !containsHan(token?.surface_form)) continue;

        const candidates = getGeneralWordCandidates(getGeneralWordLookup(token.surface_form));
        const distinctReadings = [...new Set(candidates
            .map(candidate => normalizeKanaReading(candidate?.reading || ''))
            .filter(Boolean))];
        if (distinctReadings.length !== 1) continue;

        const ordinaryReading = distinctReadings[0];
        const analyserReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || '');
        if (!analyserReading || analyserReading === ordinaryReading) continue;

        marked[index] = {
            ...token,
            postCensorshipOrdinaryLexicalMatched: true,
            postCensorshipOrdinaryLexicalReading: ordinaryReading,
            postCensorshipOrdinaryLexicalCandidates: candidates
        };
    }
    return marked;
}

function isDirectNegativeAuxiliaryContinuation(previous, token) {
    if (!previous || !token) return false;
    const previousStem = previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞';
    if (!previousStem) return false;
    return tokenBasicForm(token) === 'ない'
        && String(token.conjugated_type || '') === '特殊・ナイ';
}

function isContractedCausativePassiveBridge(tokens, index) {
    const token = tokens?.[index];
    const previous = tokens?.[index - 1];
    const next = tokens?.[index + 1];
    if (!token || !previous || !next) return false;
    return previous.pos === '動詞'
        && String(previous.conjugated_form || '') === '未然形'
        && token.pos === '動詞'
        && token.pos_detail_1 === '自立'
        && String(token.surface_form || '') === 'さ'
        && tokenBasicForm(token) === 'する'
        && String(token.conjugated_type || '') === 'サ変・スル'
        && String(token.conjugated_form || '') === '未然レル接続'
        && next.pos === '動詞'
        && next.pos_detail_1 === '接尾'
        && tokenBasicForm(next) === 'れる';
}

const reviewedAspectualCompoundVerbBasicForms = new Set(['続ける', '始める', '終える', '終わる']);
const reviewedTeDeMotionContinuationBasicForms = new Set(['行く', 'いく', 'ゆく', '来る', 'くる']);
const godanContinuativeStemDictionaryEndings = new Map([
    ['い', 'う'], ['き', 'く'], ['ぎ', 'ぐ'], ['し', 'す'], ['ち', 'つ'],
    ['に', 'ぬ'], ['び', 'ぶ'], ['み', 'む'], ['り', 'る']
]);

function getReviewedNounMisparsedContinuativeStem(token) {
    if (!token || token.pos !== '名詞' || token.pos_detail_1 === '固有名詞') return null;
    const surface = String(token.surface_form || '');
    if (!surface) return null;
    const final = surface.slice(-1);
    const dictionaryEnding = godanContinuativeStemDictionaryEndings.get(final);
    if (!dictionaryEnding) return null;
    const dictionarySurface = surface.slice(0, -1) + dictionaryEnding;
    const lookup = getGeneralWordLookup(dictionarySurface);
    const candidates = getGeneralWordCandidates(lookup);
    if (!candidates.length) return null;
    const standalone = getStandaloneSingleToken(dictionarySurface);
    if (!standalone || standalone.pos !== '動詞' || standalone.pos_detail_1 === '接尾') return null;
    const standaloneReading = normalizeKanaReading(getKuromojiDictionaryReading(standalone) || standalone.reading || standalone.pronunciation || '');
    const supported = candidates.filter(candidate => normalizeKanaReading(candidate.reading) === standaloneReading);
    if (supported.length !== 1) return null;
    return { surface: dictionarySurface, reading: supported[0].reading };
}

function getReviewedSingleTokenCompoundVerbRecovery(previous, token) {
    if (!previous || !token || token.pos !== '動詞' || !sourceTokensAreContiguous(previous, token)) return null;
    const recoveredStem = getReviewedNounMisparsedContinuativeStem(previous);
    if (!recoveredStem) return null;
    const compoundSurface = String(previous.surface_form || '') + String(token.surface_form || '');
    const compound = getStandaloneSingleToken(compoundSurface);
    if (!compound || compound.pos !== '動詞' || compound.pos_detail_1 === '接尾') return null;
    const compoundReading = normalizeKanaReading(getKuromojiDictionaryReading(compound) || compound.reading || compound.pronunciation || '');
    const stemReading = normalizeKanaReading(getKuromojiDictionaryReading(previous) || previous.reading || previous.pronunciation || '');
    const followerReading = normalizeKanaReading(getKuromojiDictionaryReading(token) || token.reading || token.pronunciation || '');
    if (!compoundReading || !stemReading || !followerReading || compoundReading !== stemReading + followerReading) return null;
    return { ...recoveredStem, compoundSurface, compoundReading };
}

const historicalShikuInflectionContinuations = new Set(['けれ', 'から', 'かり', 'かる', 'かれ', 'く', 'き']);

/** @param {CJ2RToken|null|undefined} token @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function getHistoricalInflectionBoundaryEvidence(token, sourceSpanCandidates = []) {
    if (!token || !Number.isInteger(token.sourceStart)) return null;
    const surface = String(token.surface_form || '');
    if (!historicalShikuInflectionContinuations.has(surface)) return null;
    return (sourceSpanCandidates || []).find(candidate =>
        candidate?.category === 'historical'
        && candidate?.kind === 'historical-reading'
        && candidate?.sourceEnd === token.sourceStart
        && candidate?.metadata?.conjugationClass === 'シク活用'
        && String(candidate?.sourceSurface || '').endsWith('し')
        && String(candidate?.reading || '').endsWith('し')
    ) || null;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function annotateMorphologicalOutputBoundaries(tokens, sourceSpanCandidates = []) {
    return (tokens || []).map((token, index) => {
        if (index === 0) return token;
        const previous = tokens[index - 1];
        const surface = String(token?.surface_form || '');
        const previousSurface = String(previous?.surface_form || '');
        const previousConjugation = String(previous?.conjugated_form || '');
        const separateAuxiliary = token?.pos === '動詞' && token?.pos_detail_1 === '非自立' && startsSeparateAuxiliaryUnit(token);
        const teDeLinkedSequence = /[てで]$/u.test(previousSurface);
        const compoundVerb = token?.pos === '動詞'
            && previous?.pos === '動詞'
            && previousConjugation.startsWith('連用')
            && !separateAuxiliary
            && !teDeLinkedSequence;
        const recoveredAspectualStem = token?.pos === '動詞'
            && reviewedAspectualCompoundVerbBasicForms.has(tokenBasicForm(token))
            && sourceTokensAreContiguous(previous, token)
            ? getReviewedNounMisparsedContinuativeStem(previous)
            : null;
        const recoveredSingleTokenCompound = token?.pos === '動詞'
            ? getReviewedSingleTokenCompoundVerbRecovery(previous, token)
            : null;
        const recoveredContinuativeCompound = Boolean((recoveredAspectualStem || recoveredSingleTokenCompound) && !separateAuxiliary && !teDeLinkedSequence);
        const recoveredAspectualCompound = Boolean(recoveredAspectualStem && recoveredContinuativeCompound);
        const teDeMotionContinuation = token?.pos === '動詞'
            && previous?.pos === '動詞'
            && reviewedTeDeMotionContinuationBasicForms.has(tokenBasicForm(token))
            && /[てで]$/u.test(previousSurface)
            && sourceTokensAreContiguous(previous, token);
        const attachedConjunctive = token?.pos === '助詞' && token?.pos_detail_1 === '接続助詞'
            && morphologicalJoinParticleSurfaces.has(surface)
            && Boolean(previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞'));
        const negativeAuxiliary = isDirectNegativeAuxiliaryContinuation(previous, token);
        const causativePassiveBridge = isContractedCausativePassiveBridge(tokens, index);
        const historicalInflectionEvidence = getHistoricalInflectionBoundaryEvidence(token, sourceSpanCandidates);
        if (!compoundVerb && !recoveredContinuativeCompound && !teDeMotionContinuation && !attachedConjunctive && !negativeAuxiliary && !causativePassiveBridge && !historicalInflectionEvidence) return token;
        const reason = historicalInflectionEvidence
            ? 'historical-adjective-inflection'
            : negativeAuxiliary
                ? 'direct-negative-inflection'
                : causativePassiveBridge
                ? 'contracted-causative-passive-bridge'
                : recoveredContinuativeCompound
                    ? (recoveredAspectualCompound ? 'reviewed-continuative-stem-aspectual-compound' : 'reviewed-continuative-stem-single-token-compound')
                    : teDeMotionContinuation
                        ? 'te-de-motion-continuation'
                        : compoundVerb
                            ? 'continuative-stem-compound-verb'
                            : 'attached-conjunctive-particle';
        return {
            ...token,
            morphologicalJoinLeft: true,
            morphologicalJoinReason: reason,
            morphologicalJoinAuthority: historicalInflectionEvidence
                ? 'historical-kana-evidence'
                : compoundVerb || recoveredContinuativeCompound || teDeMotionContinuation || causativePassiveBridge
                    ? 'strong-morphology'
                    : 'grammar',
            recoveredContinuativeStem: recoveredContinuativeCompound ? (recoveredAspectualStem || recoveredSingleTokenCompound)?.surface : undefined
        };
    });
}

function isKanaSurface(value) {
    return /^[ぁ-ゖァ-ンヴー]+$/u.test(String(value || ''));
}

function isMorphologicalStemToken(token) {
    return Boolean(token) && (token.pos === '動詞' || token.pos === '形容詞' || token.pos_detail_1 === '形容動詞語幹');
}

function isTeDeMorphologicalConnector(token) {
    return Boolean(token)
        && (token.surface_form === 'て' || token.surface_form === 'で')
        && (token.pos === '助詞' || (token.pos === '動詞' && token.pos_detail_1 === '非自立'));
}

function hasUnsafeKanaLexicalLeftBoundary(tokens, startIndex) {
    if (startIndex <= 0) return false;
    const current = tokens[startIndex];
    const previous = tokens[startIndex - 1];
    const beforePrevious = tokens[startIndex - 2];
    const currentLooksAttached = isGrammaticalToken(current)
        || current?.pos_detail_1 === '非自立'
        || isTeDeMorphologicalConnector(current);
    if (isMorphologicalStemToken(previous) && currentLooksAttached) return true;
    if (isTeDeMorphologicalConnector(previous) && isMorphologicalStemToken(beforePrevious)) return true;
    return previous?.pos === '動詞' && previous?.pos_detail_1 === '非自立';
}

function hasMorphologicalConnectorInSpan(tokens, startIndex, endIndex) {
    for (let index = startIndex + 1; index <= endIndex; index += 1) {
        if (isMorphologicalStemToken(tokens[index - 1]) && isTeDeMorphologicalConnector(tokens[index])) return true;
    }
    return false;
}

function hasUnsafeKanaLexicalRightBoundary(tokens, startIndex, endIndex) {
    if (endIndex >= tokens.length - 1 || !hasMorphologicalConnectorInSpan(tokens, startIndex, endIndex)) return false;
    const current = tokens[endIndex];
    const next = tokens[endIndex + 1];
    if (isTeDeMorphologicalConnector(current) && next?.pos === '動詞' && next?.pos_detail_1 === '非自立') return true;
    if (current?.pos === '動詞' && current?.pos_detail_1 === '非自立' && runtimeState.auxiliarySpacingBasicForms.has(tokenBasicForm(current))) {
        return next?.pos === '助動詞' || isGrammaticalToken(next) || runtimeState.conjugationJoinEndings.has(String(next?.surface_form || ''));
    }
    return false;
}

const kanaCommonWordFragmentHonorificReadings = new Map([
    ['さん', 'さん'], ['さま', 'さま'], ['くん', 'くん'], ['ちゃん', 'ちゃん']
]);

function selectReviewedKanaCommonWordBoundaryRule(surface, sourceText, hasProperNoun = false) {
    const contextual = selectCommonWordRule(surface, sourceText, false);
    if (contextual) return contextual;
    if (hasProperNoun) return null;
    return selectCommonWordRule(surface, sourceText, true) || null;
}

function findReviewedKanaCommonWordBoundarySplit(tokens, startIndex, sourceText) {
    if (hasUnsafeKanaLexicalLeftBoundary(tokens, startIndex)) return null;
    const startSurface = String(tokens[startIndex]?.surface_form || '');
    if (kanaCommonWordFragmentHonorificReadings.has(startSurface)) return null;
    let candidateSurface = '';
    let hasProperNoun = false;
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        const surface = String(token?.surface_form || '');
        if (!isKanaSurface(surface)) break;
        hasProperNoun ||= isProperNounToken(token);
        const characters = Array.from(surface);
        for (let offset = 1; offset <= characters.length; offset += 1) {
            const matchedSurface = candidateSurface + characters.slice(0, offset).join('');
            if (!canContinueCommonWord(matchedSurface)) break;
            const rule = selectReviewedKanaCommonWordBoundaryRule(matchedSurface, sourceText, hasProperNoun);
            if (rule && end > startIndex && offset < characters.length && !hasMorphologicalConnectorInSpan(tokens, startIndex, end)) {
                bestMatch = { surface: matchedSurface, reading: rule.reading, endIndex: end, endOffset: offset };
            }
        }
        candidateSurface += surface;
        if (!canContinueCommonWord(candidateSurface)) break;
    }
    return bestMatch;
}

function makeKanaCommonWordBoundaryFragment(token, surface, characterOffset = 0) {
    const fragment = String(surface || '');
    const position = Number(token?.word_position || 0);
    const length = Array.from(fragment).length;
    return makeDerivedSubspanToken(token, characterOffset, characterOffset + length, {
        surface_form: fragment,
        basic_form: fragment,
        reading: fragment,
        pronunciation: fragment,
        word_position: position > 0 ? position + characterOffset : position,
        kanaCommonWordBoundaryFragment: true
    }, {
        annotations: ['kanaCommonWordBoundaryFragment'], evidenceSource: 'reviewed-kana-common-word-boundary', semanticRole: 'lexical-boundary-fragment'
    });
}

function tokenizeKanaCommonWordBoundaryRemainder(token, surface, characterOffset, evidenceSurface) {
    const remainder = String(surface || '');
    if (!remainder) return [];
    const originalPosition = Number(token?.word_position || 0);
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    const reconstructed = retokenized.map(item => String(item?.surface_form || '')).join('');
    const rawTokens = retokenized.length && reconstructed === remainder ? retokenized : null;
    if (!rawTokens) {
        const fallback = makeKanaCommonWordBoundaryFragment(token, remainder, characterOffset);
        fallback.reviewedLexicalBoundaryBefore = true;
        fallback.reviewedLexicalBoundaryEvidenceSurface = evidenceSurface;
        return [fallback];
    }
    let consumed = 0;
    return rawTokens.map((item, index) => {
        const surfaceForm = String(item?.surface_form || '');
        const length = Array.from(surfaceForm).length;
        const adjusted = makeDerivedSubspanToken(token, characterOffset + consumed, characterOffset + consumed + length, {
            ...item,
            word_position: originalPosition > 0 ? originalPosition + characterOffset + consumed : Number(item?.word_position || 0),
            kanaCommonWordBoundaryFragment: true
        }, {
            annotations: ['kanaCommonWordBoundaryFragment'], evidenceSource: 'reviewed-kana-common-word-boundary', semanticRole: 'lexical-boundary-fragment'
        });
        if (index === 0) {
            adjusted.reviewedLexicalBoundaryBefore = true;
            adjusted.reviewedLexicalBoundaryEvidenceSurface = evidenceSurface;
        }
        consumed += length;
        return adjusted;
    });
}

function splitReviewedKanaCommonWordBoundaryTokens(tokens, sourceText) {
    const working = [...(tokens || [])];
    const maxSplits = Math.max(8, working.length * 2);
    for (let splitCount = 0; splitCount < maxSplits; splitCount += 1) {
        let splitApplied = false;
        for (let startIndex = 0; startIndex < working.length; startIndex += 1) {
            const match = findReviewedKanaCommonWordBoundarySplit(working, startIndex, sourceText);
            if (!match) continue;
            const endToken = working[match.endIndex];
            const characters = Array.from(String(endToken?.surface_form || ''));
            const prefixSurface = characters.slice(0, match.endOffset).join('');
            const remainderSurface = characters.slice(match.endOffset).join('');
            if (!prefixSurface || !remainderSurface) continue;
            const prefixFragment = makeKanaCommonWordBoundaryFragment(endToken, prefixSurface, 0);
            const remainderTokens = tokenizeKanaCommonWordBoundaryRemainder(endToken, remainderSurface, match.endOffset, match.surface);
            if (!remainderTokens.length) continue;
            working.splice(
                match.endIndex,
                1,
                prefixFragment,
                ...remainderTokens
            );
            splitApplied = true;
            break;
        }
        if (!splitApplied) break;
    }
    return working;
}

function mergeKanaCommonWordBoundaryHonorificTokens(tokens) {
    const merged = [];
    const honorifics = [...kanaCommonWordFragmentHonorificReadings.keys()];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const previous = merged[merged.length - 1];
        if (!previous?.kanaLexicalSpanMatched) { merged.push(token); continue; }
        let candidate = '';
        let endMatch = -1;
        let sawBoundaryFragment = false;
        for (let end = index; end < Math.min(tokens.length, index + 3); end += 1) {
            const next = tokens[end];
            const surface = String(next?.surface_form || '');
            if (!isKanaSurface(surface)) break;
            candidate += surface;
            sawBoundaryFragment ||= Boolean(next?.kanaCommonWordBoundaryFragment);
            if (sawBoundaryFragment && kanaCommonWordFragmentHonorificReadings.has(candidate)) endMatch = end;
            if (!honorifics.some(item => item.startsWith(candidate))) break;
        }
        if (endMatch < index) { merged.push(token); continue; }
        const surface = tokens.slice(index, endMatch + 1).map(item => String(item.surface_form || '')).join('');
        const reading = kanaCommonWordFragmentHonorificReadings.get(surface);
        merged.push(makeDerivedSpanToken(tokens, index, endMatch, {
            surface_form: surface,
            basic_form: surface,
            reading,
            pronunciation: reading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            kanaCommonWordBoundaryHonorific: true
        }, {
            annotations: ['kanaCommonWordBoundaryHonorific'], evidenceSource: 'reviewed-kana-honorific', semanticRole: 'name-honorific'
        }));
        index = endMatch;
    }
    return merged;
}

function findLongestKanaLexicalReading(tokens, startIndex) {
    if (hasUnsafeKanaLexicalLeftBoundary(tokens, startIndex) || tokens[startIndex]?.sourceSpanGrammarBoundary || tokens[startIndex]?.sourceSpanGrammarBoundaryBefore) return null;
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end) || (end > startIndex && tokens[end]?.sourceSpanGrammarBoundaryBefore)) break;
        const surface = String(token?.surface_form || '');
        if (!isKanaSurface(surface)) break;
        candidateSurface += surface;
        const normalizedReading = normalizeKanaReading(candidateSurface);
        if (!runtimeState.kanaLexicalReadingPrefixes.has(normalizedReading)) break;
        if (end === startIndex) continue;
        const evidence = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading);
        if (evidence && !hasUnsafeKanaLexicalRightBoundary(tokens, startIndex, end)) {
            bestMatch = {
                surface: candidateSurface,
                reading: normalizedReading,
                evidence,
                length: end - startIndex + 1,
                strong: Boolean(evidence.strongSources?.size)
            };
        }
    }
    return bestMatch;
}


function isEntireCanonicalBoundarySurface(surface) {
    const value = String(surface || '');
    if (!value) return false;
    const runs = getCanonicalHardBoundaryRuns(value);
    return runs.length === 1 && runs[0].start === 0 && runs[0].end === value.length;
}

function classifyCanonicalBoundaryTokens(tokens) {
    return (tokens || []).map(token => {
        const surface = String(token?.surface_form || '');
        if (!isEntireCanonicalBoundarySurface(surface)) return token;
        const whitespace = /^[\s\u3000]+$/u.test(surface);
        const censorshipMarker = isJapaneseCensorshipMarkerSurface(surface);
        return {
            ...token,
            pos: '記号',
            pos_detail_1: whitespace ? '空白' : '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            reading: surface,
            pronunciation: surface,
            canonicalBoundary: true,
            crossNotationSymbol: surface === '×',
            censorshipMarker
        };
    });
}

function offsetTokenWordPosition(token, sourceOffset) {
    const position = Number(token?.word_position || 0);
    return position > 0 ? { ...token, word_position: position + sourceOffset } : token;
}

function makeCanonicalBoundaryToken(surface, sourceOffset) {
    const whitespace = /^[\s\u3000]+$/u.test(String(surface || ''));
    return {
        surface_form: surface,
        pos: '記号',
        pos_detail_1: whitespace ? '空白' : '一般',
        pos_detail_2: '*',
        pos_detail_3: '*',
        conjugated_type: '*',
        conjugated_form: '*',
        basic_form: surface,
        reading: surface,
        pronunciation: surface,
        word_position: sourceOffset + 1,
        canonicalBoundary: true,
        hardBoundaryReconstructed: true,
        crossNotationSymbol: surface === '×',
        censorshipMarker: isJapaneseCensorshipMarkerSurface(surface)
    };
}

function tokenizeHardBoundarySegment(segment, sourceOffset) {
    if (!runtimeState.tokenizer) return [];
    const raw = String(segment || '');
    const core = raw.trim();
    if (!core) return [];
    const coreOffset = raw.indexOf(core);
    return restoreDroppedSokuonTokens(runtimeState.tokenizer.tokenize(core), core)
        .map(token => offsetTokenWordPosition(token, sourceOffset + coreOffset));
}

function hasAdjacentTransparentGrammarBoundary(sourceText, token) {
    const source = String(sourceText || '');
    const start = Number(token?.sourceStart);
    const end = Number(token?.sourceEnd);
    const transparentRunAt = (index, direction) => {
        let sawBoundary = false;
        for (let cursor = index; cursor >= 0 && cursor < source.length; cursor += direction) {
            const character = source[cursor];
            const sourceWhitespace = /[\s\u3000]/u.test(character);
            const hardBoundary = isCanonicalHardBoundaryAt(source, cursor);
            if (!sourceWhitespace && !hardBoundary) break;
            sawBoundary = true;
            if (!sourceWhitespace && !isCanonicalTransparentBoundaryCharacter(character)) return false;
        }
        return sawBoundary;
    };
    return (Number.isInteger(start) && start > 0 && transparentRunAt(start - 1, -1))
        || (Number.isInteger(end) && end < source.length && transparentRunAt(end, 1));
}

function restoreTransparentBoundaryGrammaticalRoles(rebuiltTokens, originalTokens, sourceText) {
    const originalBySpan = new Map();
    for (const token of originalTokens || []) {
        if (!token || (!isGrammaticalToken(token) && !isNominalizer(token))) continue;
        if (!hasAdjacentTransparentGrammarBoundary(sourceText, token)) continue;
        const key = `${token.sourceStart}:${token.sourceEnd}:${String(token.surface_form || '')}`;
        originalBySpan.set(key, token);
    }
    return attachSourceTokenSpans(rebuiltTokens, sourceText).map(token => {
        const key = `${token.sourceStart}:${token.sourceEnd}:${String(token.surface_form || '')}`;
        const original = originalBySpan.get(key);
        if (!original) return token;
        return {
            ...token,
            pos: original.pos,
            pos_detail_1: original.pos_detail_1,
            pos_detail_2: original.pos_detail_2,
            pos_detail_3: original.pos_detail_3,
            conjugated_type: original.conjugated_type,
            conjugated_form: original.conjugated_form,
            basic_form: original.basic_form,
            reading: original.reading,
            pronunciation: original.pronunciation,
            transparentBoundaryGrammarRoleRestored: true
        };
    });
}

function stabilizeHardBoundaryTokenization(tokens, sourceText) {
    const text = String(sourceText || '');
    const boundaries = getCanonicalHardBoundaryRuns(text);
    if (!runtimeState.tokenizer || !boundaries.length) return classifyCanonicalBoundaryTokens(tokens);

    const rebuilt = [];
    let cursor = 0;
    for (const boundary of boundaries) {
        rebuilt.push(...tokenizeHardBoundarySegment(text.slice(cursor, boundary.start), cursor));
        rebuilt.push(makeCanonicalBoundaryToken(boundary.surface, boundary.start));
        cursor = boundary.end;
    }
    rebuilt.push(...tokenizeHardBoundarySegment(text.slice(cursor), cursor));
    const classified = classifyCanonicalBoundaryTokens(rebuilt);
    return restoreTransparentBoundaryGrammaticalRoles(classified, tokens, text);
}

function isSourceSpanGrammarAnchor(token) {
    if (!token || token.pos === '記号' || isParticle(token) || isNominalizer(token) || token.pos === '助動詞') return false;
    return Boolean(String(token.surface_form || ''));
}

function getKanaRunLexicalReadingSpan(runTokens) {
    if (!runTokens?.length || isParticle(runTokens[0]) || isNominalizer(runTokens[0])) return null;
    const surface = runTokens.map(token => String(token.surface_form || '')).join('');
    const characters = Array.from(surface);
    let candidate = '';
    let bestLength = 0;
    for (let length = 1; length <= characters.length; length += 1) {
        candidate += characters[length - 1];
        const normalized = normalizeKanaReading(candidate);
        if (!runtimeState.kanaLexicalReadingPrefixes.has(normalized)) break;
        if (runtimeState.kanaLexicalReadingDictionary.has(normalized)) bestLength = length;
    }
    if (bestLength <= 0) return null;
    const reading = normalizeKanaReading(characters.slice(0, bestLength).join(''));
    const evidence = runtimeState.kanaLexicalReadingDictionary.get(reading) || null;
    return {
        start: 0,
        end: bestLength,
        surface: characters.slice(0, bestLength).join(''),
        strong: Boolean(evidence?.strongSources?.size)
    };
}

function lexicalKanaEvidenceCoversToken(runTokens, tokenIndex, lexicalSpan) {
    if (!lexicalSpan || tokenIndex < 0 || tokenIndex >= runTokens.length) return false;
    let start = 0;
    for (let index = 0; index < tokenIndex; index += 1) start += Array.from(String(runTokens[index].surface_form || '')).length;
    const end = start + Array.from(String(runTokens[tokenIndex].surface_form || '')).length;
    return lexicalSpan.start <= start && lexicalSpan.end > start && lexicalSpan.end >= end;
}

function isEstablishedSourceLexicalBoundaryCandidate(candidate) {
    if (!candidate || candidate.reviewRequired === true || !Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return false;
    if (candidate.category === 'loanword' && candidate.evidenceSource === 'source-language-loanword' && candidate.romaji != null) return true;
    if (candidate.kind === 'kuromoji-exact-dictionary-span' && Number(candidate.confidence || 0) >= 0.85) return true;
    if ((candidate.kind === 'common-word' || candidate.kind === 'common-word-inflection' || candidate.category === 'title')
        && Number(candidate.confidence || 0) >= 0.85) return true;
    return false;
}

function getEstablishedSourceLexicalBoundaryBeforeToken(sourceSpanCandidates, token) {
    if (!token || !Number.isInteger(token.sourceStart)) return null;
    const matches = (sourceSpanCandidates || []).filter(candidate =>
        isEstablishedSourceLexicalBoundaryCandidate(candidate)
        && candidate.sourceEnd === token.sourceStart
        && candidate.sourceStart < candidate.sourceEnd);
    if (!matches.length) return null;
    matches.sort((left, right) => left.sourceStart - right.sourceStart
        || Number(right.confidence || 0) - Number(left.confidence || 0));
    return matches[0];
}

function hasEstablishedSourceLexicalSpanCrossingToken(sourceSpanCandidates, token, boundaryCandidate) {
    if (!token || !boundaryCandidate || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return false;
    return (sourceSpanCandidates || []).some(candidate => {
        if (candidate === boundaryCandidate || candidate?.reviewRequired === true) return false;
        if (!Number.isInteger(candidate?.sourceStart) || !Number.isInteger(candidate?.sourceEnd)) return false;
        if (candidate.sourceStart > boundaryCandidate.sourceStart || candidate.sourceEnd < token.sourceEnd) return false;
        if (isEstablishedSourceLexicalBoundaryCandidate(candidate)) return true;
        return candidate.kind === 'kana-lexical-reading'
            && candidate.evidenceSource === 'kana-lexical-strong-evidence'
            && Number(candidate.confidence || 0) >= 0.9;
    });
}

/** @param {CJ2RToken[]} tokens @param {number} absoluteIndex @param {number} runStart @param {number} runEnd @param {any} lexicalSpan @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function isStrongKanaGrammarToken(tokens, absoluteIndex, runStart, runEnd, lexicalSpan, sourceSpanCandidates = []) {
    const token = tokens[absoluteIndex];
    if (!token || (!isParticle(token) && !isNominalizer(token))) return false;

    const runTokens = tokens.slice(runStart, runEnd + 1);
    const runIndex = absoluteIndex - runStart;
    const establishedBoundaryBefore = getEstablishedSourceLexicalBoundaryBeforeToken(sourceSpanCandidates, token);
    const establishedSpanAcross = hasEstablishedSourceLexicalSpanCrossingToken(sourceSpanCandidates, token, establishedBoundaryBefore);
    if (lexicalSpan?.strong
        && lexicalKanaEvidenceCoversToken(runTokens, runIndex, lexicalSpan)
        && (!establishedBoundaryBefore || establishedSpanAcross)) return false;

    const surface = String(token.surface_form || '');
    const previous = tokens[absoluteIndex - 1] || null;
    const next = tokens[absoluteIndex + 1] || null;
    const isGrammarLike = item => Boolean(item) && (isParticle(item) || isNominalizer(item) || item.pos === '助動詞');
    const nearestAnchor = direction => {
        for (let index = absoluteIndex + direction; index >= 0 && index < tokens.length; index += direction) {
            const candidate = tokens[index];
            if (candidate?.pos === '記号') return null;
            if (isGrammarLike(candidate)) continue;
            return isSourceSpanGrammarAnchor(candidate) ? candidate : null;
        }
        return null;
    };
    const leftAnchor = nearestAnchor(-1);
    const rightAnchor = nearestAnchor(1);

    if (surface === 'ん' && !rightAnchor) return false;

    // Conjunctive particles are grammatical when their surrounding morphology supports that role.
    // Keeping the original token lets the later morphology layer decide whether the output joins left.
    if (token.pos === '助詞' && token.pos_detail_1 === '接続助詞') {
        if (isMorphologicalStemToken(previous) || previous?.pos === '助動詞') return true;
        if (next?.pos === '動詞' && next?.pos_detail_1 === '非自立') return true;
        return Boolean(leftAnchor && rightAnchor);
    }

    if (token.pos_detail_1 === '係助詞') return Boolean(leftAnchor);
    if (token.pos_detail_1 === '格助詞' || token.pos_detail_1 === '連体化') {
        if (leftAnchor && rightAnchor) return true;
        // A trailing case particle can still be grammatical when the kana run is an inflection/suffix
        // attached to a lexical token outside the run (for example 獣たちへ).
        const externalLeftAnchor = runStart > 0 && isSourceSpanGrammarAnchor(tokens[runStart - 1]);
        if (externalLeftAnchor && absoluteIndex === runEnd && token.pos_detail_1 === '格助詞') return true;
        if (absoluteIndex === runEnd && leftAnchor && token.pos_detail_1 === '格助詞' && surface !== 'を' && surface !== 'へ') return true;
        return false;
    }
    const particleDetail = String(token.pos_detail_1 || '');
    if (particleDetail === '副助詞' || particleDetail === '並立助詞') return Boolean(leftAnchor && rightAnchor);
    if (particleDetail.includes('終助詞')) {
        return Boolean(leftAnchor && (rightAnchor || isMorphologicalStemToken(previous) || previous?.pos === '助動詞'));
    }
    if (isNominalizer(token)) return Boolean(leftAnchor && rightAnchor);
    return Boolean(leftAnchor && rightAnchor);
}

function makeBoundaryNeutralKanaToken(members) {
    const surface = members.map(token => String(token.surface_form || '')).join('');
    const lexical = members.find(token => isSourceSpanGrammarAnchor(token)) || members[0];
    const first = members[0];
    return makeDerivedSpanToken(members, 0, members.length - 1, {
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        pos: lexical?.pos,
        pos_detail_1: lexical?.pos_detail_1,
        pos_detail_2: lexical?.pos_detail_2,
        pos_detail_3: lexical?.pos_detail_3,
        basic_form: lexical?.basic_form,
        word_position: first.word_position,
        sourceSpanReconciled: true,
        sourceSpanReconciliationReason: 'kuromoji-kana-boundary-neutralised',
        sourceSpanGrammarBoundary: false,
        sourceSpanGrammarBoundaryBefore: Boolean(first.sourceSpanGrammarBoundaryBefore),
        tokenizationRoleBoundaryBefore: Boolean(first.tokenizationRoleBoundaryBefore),
        reviewedLexicalBoundaryBefore: Boolean(first.reviewedLexicalBoundaryBefore)
    }, {
        annotations: ['sourceSpanReconciled', 'sourceSpanReconciliationReason'],
        evidenceSource: 'source-span-reconciliation', semanticRole: 'token-boundary-repair'
    });
}

function shouldNeutralizeKanaBoundary(left, right) {
    if (!left || !right || !sourceTokensAreContiguous(left, right)) return false;
    if (!isKanaSurface(left.surface_form) || !isKanaSurface(right.surface_form)) return false;
    if (left.sourceSpanGrammarBoundary || right.sourceSpanGrammarBoundary || right.sourceSpanGrammarBoundaryBefore) return false;

    // Established morphology remains intact. Source-span reconciliation exists to neutralise
    // unreliable lexical/particle boundaries, not to replace the conjugation pipeline.
    if (right.pos === '助動詞' || left.pos === '助動詞') return false;
    if (right.pos === '助詞' && right.pos_detail_1 === '格助詞' && (right.surface_form === 'を' || right.surface_form === 'へ')) return false;
    if (isTeDeMorphologicalConnector(left) || isTeDeMorphologicalConnector(right)) return false;
    if ((right.pos_detail_1 === '接尾' || right.pos === '接尾詞')
        && (left.pos === '動詞' || left.pos === '形容詞' || left.pos === '助動詞')) return false;

    if (right.pos === '名詞' && right.pos_detail_1 === '非自立') return true;
    if (isParticle(left) || isParticle(right) || isNominalizer(left) || isNominalizer(right)) return true;
    return false;
}

function findOrthographicKatakanaNoCandidate(sourceSpanCandidates, token) {
    if (!token || String(token.surface_form || '') !== 'ノ') return null;
    if (!Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return null;
    return (sourceSpanCandidates || []).find(candidate => candidate?.category === 'grammar'
        && candidate?.kind === 'orthographic-katakana-no'
        && candidate?.sourceStart === token.sourceStart
        && candidate?.sourceEnd === token.sourceEnd) || null;
}

function hasStrongerLexicalSpanAcrossToken(sourceSpanCandidates, token) {
    if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return false;
    const lexicalCategories = new Set(['lexical', 'name', 'title', 'contextual']);
    return (sourceSpanCandidates || []).some(candidate => lexicalCategories.has(candidate?.category)
        && Number.isInteger(candidate?.sourceStart)
        && Number.isInteger(candidate?.sourceEnd)
        && candidate.sourceStart <= token.sourceStart
        && candidate.sourceEnd >= token.sourceEnd
        && (candidate.sourceStart < token.sourceStart || candidate.sourceEnd > token.sourceEnd));
}

/** @param {CJ2RToken[]} tokens @param {string} sourceText @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function reconcileKanaSourceTokenBoundaries(tokens, sourceText, sourceSpanCandidates = []) {
    const working = attachSourceTokenSpans(tokens, sourceText).map(token => ({ ...token }));
    for (let runStart = 0; runStart < working.length;) {
        if (!isKanaSurface(working[runStart]?.surface_form) || working[runStart]?.canonicalBoundary) { runStart += 1; continue; }
        let runEnd = runStart;
        while (runEnd + 1 < working.length
            && isKanaSurface(working[runEnd + 1]?.surface_form)
            && !working[runEnd + 1]?.canonicalBoundary
            && sourceTokensAreContiguous(working[runEnd], working[runEnd + 1])) runEnd += 1;

        const runTokens = working.slice(runStart, runEnd + 1);
        const runSurface = runTokens.map(token => String(token.surface_form || '')).join('');
        if ([...kanaCommonWordFragmentHonorificReadings.keys()].some(suffix => runSurface.endsWith(suffix))) {
            runStart = runEnd + 1;
            continue;
        }
        const lexicalSpan = getKanaRunLexicalReadingSpan(runTokens);
        for (let index = runStart; index <= runEnd; index += 1) {
            const orthographicNoCandidate = findOrthographicKatakanaNoCandidate(sourceSpanCandidates, working[index]);
            if (orthographicNoCandidate && !hasStrongerLexicalSpanAcrossToken(sourceSpanCandidates, working[index])) {
                working[index] = {
                    ...working[index],
                    pos: '助詞',
                    pos_detail_1: '格助詞',
                    pos_detail_2: '一般',
                    pos_detail_3: '*',
                    basic_form: 'の',
                    reading: 'ノ',
                    pronunciation: 'ノ',
                    orthographicParticleInferred: true,
                    orthographicParticleCanonicalSurface: 'の',
                    orthographicParticleEvidenceSource: orthographicNoCandidate.evidenceSource,
                    orthographicParticleReviewRequired: Boolean(orthographicNoCandidate.reviewRequired)
                };
            }
            if (!isStrongKanaGrammarToken(working, index, runStart, runEnd, lexicalSpan, sourceSpanCandidates)) continue;
            working[index].sourceSpanGrammarBoundary = true;
            working[index].sourceSpanGrammarBoundaryBefore = true;
            working[index].sourceSpanReconciliationReason = 'syntactically-supported-grammar-boundary';
            if (index + 1 <= runEnd) working[index + 1].sourceSpanGrammarBoundaryBefore = true;
        }

        const reconciled = [];
        let members = [working[runStart]];
        for (let index = runStart + 1; index <= runEnd; index += 1) {
            const current = working[index];
            const previous = members[members.length - 1];
            if (shouldNeutralizeKanaBoundary(previous, current)) members.push(current);
            else {
                reconciled.push(members.length > 1 ? makeBoundaryNeutralKanaToken(members) : members[0]);
                members = [current];
            }
        }
        reconciled.push(members.length > 1 ? makeBoundaryNeutralKanaToken(members) : members[0]);
        working.splice(runStart, runEnd - runStart + 1, ...reconciled);
        runStart += reconciled.length;
    }
    return attachSourceTokenSpans(working, sourceText);
}

function mergeKanaLexicalReadingTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const bestMatch = findLongestKanaLexicalReading(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            reading: bestMatch.reading,
            pronunciation: bestMatch.reading,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            kanaLexicalSpanMatched: true,
            kanaLexicalSpanReading: bestMatch.reading,
            kanaLexicalSpanEvidenceSurfaces: [...bestMatch.evidence.surfaces],
            kanaLexicalSpanEvidenceStrength: bestMatch.strong ? 'strong' : 'weak'
        }, {
            annotations: ['kanaLexicalSpanMatched', 'kanaLexicalSpanReading', 'kanaLexicalSpanEvidenceSurfaces', 'kanaLexicalSpanEvidenceStrength'],
            evidenceSource: bestMatch.strong ? 'kana-lexical-strong-evidence' : 'kana-lexical-evidence', semanticRole: 'kana-lexical-span'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function mergeKanaBoundaryPair(left, right) {
    const surface = String(left?.surface_form || '') + String(right?.surface_form || '');
    return makeDerivedSpanToken([left, right], 0, 1, {
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        pos: '名詞',
        pos_detail_1: '一般',
        pos_detail_2: '*',
        pos_detail_3: '*',
        orthographicKanaBoundaryRepaired: true
    }, {
        annotations: ['orthographicKanaBoundaryRepaired'], evidenceSource: 'orthographic-kana-boundary', semanticRole: 'orthographic-kana'
    });
}

function mergeOrthographicKanaBoundaryTokens(tokens) {
    const merged = [];
    const smallKanaStart = /^[ゃゅょぁぃぅぇぉャュョァィゥェォ]/u;
    for (const token of tokens || []) {
        const currentSurface = String(token?.surface_form || '');
        const previous = merged[merged.length - 1];
        const previousSurface = String(previous?.surface_form || '');
        if (hasReviewedLexicalBoundaryBefore(token)) {
            merged.push(token);
            continue;
        }
        if (previous && isKanaSurface(previousSurface) && isKanaSurface(currentSurface) && /[っッ]$/u.test(previousSurface)) {
            merged[merged.length - 1] = mergeKanaBoundaryPair(previous, token);
            continue;
        }
        if (previous && isKanaSurface(previousSurface) && isKanaSurface(currentSurface) && smallKanaStart.test(currentSurface)) {
            const prior = merged[merged.length - 2];
            if (isParticle(previous) && prior && isKanaSurface(prior.surface_form)) {
                merged.splice(merged.length - 2, 2, mergeKanaBoundaryPair(mergeKanaBoundaryPair(prior, previous), token));
            } else {
                merged[merged.length - 1] = mergeKanaBoundaryPair(previous, token);
            }
            continue;
        }
        merged.push(token);
    }
    return merged;
}

function isLatinPassthroughTokenSurface(value) {
    const surface = String(value || '');
    return Boolean(surface) && /^[\p{Script=Latin}\p{Number}'’/@,&#% +_.:;!?=~|-]+$/u.test(surface);
}

function containsLatinOrNumber(value) {
    return /[\p{Script=Latin}\p{Number}]/u.test(String(value || ''));
}

/** @param {CJ2RSourceSpanCandidate|null|undefined} candidate */
function isHighConfidenceSourceSpanAuthorityCandidate(candidate) {
    if (!candidate || candidate.reviewRequired === true) return false;
    if (!Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) return false;
    const confidence = candidate.confidence;
    if (typeof confidence !== 'number' || !Number.isFinite(confidence) || confidence < 0.85) return false;
    if (!candidate.reading && candidate.romaji == null) return false;
    return candidate.category !== 'tokenizer';
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates */
function hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates) {
    return (sourceSpanCandidates || []).some(other =>
        other !== candidate
        && isHighConfidenceSourceSpanAuthorityCandidate(other)
        && other.sourceStart <= candidate.sourceStart
        && other.sourceEnd > candidate.sourceEnd
        && Number(other.confidence || 0) >= Number(candidate.confidence || 0)
    );
}

/** @param {CJ2RSourceSpanCandidate|null|undefined} candidate */
function isImmutableSourceSpanBoundaryAuthorityCandidate(candidate) {
    if (!candidate || !isHighConfidenceSourceSpanAuthorityCandidate(candidate) || candidate.category === 'counter') return false;
    const priority = Number(candidate?.metadata?.priority);
    if (Number.isFinite(priority)) return priority >= 80;
    return candidate.category === 'title' || candidate.category === 'historical';
}

/** @param {CJ2RSourceSpanCandidate} candidate */
function isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate) {
    if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) return false;
    return candidate.kind === 'reviewed-reading'
        || candidate.kind === 'reviewed-name'
        || candidate.category === 'title'
        || candidate.category === 'historical';
}

/** @param {CJ2RSourceSpanCandidate|null|undefined} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function isSourceOrthographyPersonNameHonorificBoundaryCandidate(candidate, sourceSpanCandidates = []) {
    if (!candidate
        || candidate?.metadata?.sourceOrthographyPreserved !== true
        || candidate?.metadata?.sourceOrthographyEvidenceOnlyIntermediate === true
        || !sourceSpanNameCandidateHasPersonRole(candidate)
        || !Number.isInteger(candidate.sourceEnd)) return false;
    const honorificSurfaces = new Set(['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏']);
    return (sourceSpanCandidates || []).some(other =>
        Number.isInteger(other?.sourceStart)
        && other.sourceStart === candidate.sourceEnd
        && honorificSurfaces.has(String(other?.sourceSurface || '')));
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {number} boundary */
function hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, boundary) {
    let ends = false;
    let starts = false;
    for (const candidate of sourceSpanCandidates || []) {
        if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) continue;
        if (candidate.sourceEnd === boundary && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)) ends = true;
        if (candidate.sourceStart === boundary && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates)) starts = true;
        if (ends && starts) return true;
    }
    return false;
}

/** @param {CJ2RSourceSpanCandidate} candidate @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates */
function hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates) {
    return (sourceSpanCandidates || []).some(other =>
        other !== candidate
        && isImmutableSourceSpanBoundaryAuthorityCandidate(other)
        && other.sourceStart < candidate.sourceStart
        && other.sourceEnd >= candidate.sourceEnd
        && Number(other.confidence || 0) >= Number(candidate.confidence || 0)
    );
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {number} sourceBoundary */
function isProtectedImmutableSourceSpanBoundary(sourceSpanCandidates, sourceBoundary) {
    if (!Number.isInteger(sourceBoundary)) return false;
    return (sourceSpanCandidates || []).some(candidate => {
        if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate)) return false;
        const protectedEnd = candidate.sourceEnd === sourceBoundary
            && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates);
        const protectedStart = candidate.sourceStart === sourceBoundary
            && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates);
        return protectedEnd || protectedStart;
    });
}

function retokenizeSourceAuthoritySegment(token, startCharacter, endCharacter, boundaryBefore = false) {
    const originalSurface = String(token?.surface_form || '');
    const characters = Array.from(originalSurface);
    const start = Math.max(0, Math.min(characters.length, startCharacter));
    const end = Math.max(start, Math.min(characters.length, endCharacter));
    const segmentSurface = characters.slice(start, end).join('');
    if (!segmentSurface) return [];
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(segmentSurface) : [];
    const reconstructed = (retokenized || []).map(item => String(item?.surface_form || '')).join('');
    const usable = retokenized?.length && reconstructed === segmentSurface ? retokenized : null;
    const originalPosition = Number(token?.word_position || 0);
    if (!usable) {
        const kanaSafe = isKanaSurface(segmentSurface);
        return [makeDerivedSubspanToken(token, start, end, {
            surface_form: segmentSurface,
            basic_form: segmentSurface,
            reading: kanaSafe ? segmentSurface : '*',
            pronunciation: kanaSafe ? segmentSurface : '*',
            word_position: originalPosition > 0 ? originalPosition + start : originalPosition,
            ...(boundaryBefore ? {
                reviewedLexicalBoundaryBefore: true,
                reviewedLexicalBoundarySource: 'source-span-authority-boundary-repair'
            } : {})
        }, {
            annotations: [], evidenceSource: 'source-span-authority-boundary-repair', semanticRole: 'token-boundary-repair'
        })];
    }
    let consumed = 0;
    return usable.map((item, index) => {
        const itemSurface = String(item?.surface_form || '');
        const itemLength = Array.from(itemSurface).length;
        const derived = makeDerivedSubspanToken(token, start + consumed, start + consumed + itemLength, {
            ...item,
            word_position: originalPosition > 0 ? originalPosition + start + consumed : Number(item?.word_position || 0),
            ...((boundaryBefore && index === 0) ? {
                reviewedLexicalBoundaryBefore: true,
                reviewedLexicalBoundarySource: 'source-span-authority-boundary-repair'
            } : {})
        }, {
            annotations: [], evidenceSource: 'source-span-authority-boundary-repair', semanticRole: 'token-boundary-repair'
        });
        consumed += itemLength;
        return derived;
    });
}

/**
 * Repairs a Kuromoji token only when immutable maintained evidence proves that
 * an authoritative source boundary lies inside it. Candidate discovery remains
 * non-destructive: weak dictionary/kana substrings cannot force a split.
 * @param {CJ2RToken[]} tokens
 * @param {string} sourceText
 * @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates]
 */
function splitTokensAtImmutableSourceAuthorityBoundaries(tokens, sourceText, sourceSpanCandidates = []) {
    const working = attachSourceTokenSpans(tokens, sourceText);
    const output = [];
    for (const token of working || []) {
        if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) {
            output.push(token);
            continue;
        }
        const tokenStart = Number(token.sourceStart);
        const tokenEnd = Number(token.sourceEnd);
        const tokenSurface = String(token.surface_form || '');
        const sourceSurface = String(token.sourceSurface ?? tokenSurface);
        if (sourceSurface !== tokenSurface || tokenEnd <= tokenStart) {
            output.push(token);
            continue;
        }
        const internalBoundaries = new Set();
        for (const candidate of sourceSpanCandidates || []) {
            const sourceOrthographyNameHonorificBoundary = isSourceOrthographyPersonNameHonorificBoundaryCandidate(candidate, sourceSpanCandidates);
            const contextualLocationBoundary = getContextualLocationBoundaryEvidence(candidate, sourceText, tokenEnd);
            if (!isImmutableSourceSpanBoundaryAuthorityCandidate(candidate) && !sourceOrthographyNameHonorificBoundary && !contextualLocationBoundary) continue;
            // A candidate that reaches across the left or right edge of this token
            // proves an internal boundary. Fully-contained substrings remain
            // non-destructive candidate evidence and cannot segment a token alone.
            if (candidate.sourceStart <= tokenStart
                && candidate.sourceEnd > tokenStart
                && candidate.sourceEnd < tokenEnd
                && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)
                && (sourceOrthographyNameHonorificBoundary
                    || contextualLocationBoundary
                    || isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate)
                    || hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, candidate.sourceEnd))) {
                internalBoundaries.add(Number(candidate.sourceEnd));
            }
            if (candidate.sourceStart > tokenStart
                && candidate.sourceStart < tokenEnd
                && candidate.sourceEnd >= tokenEnd
                && !hasEqualOrStrongerSourceSpanPrecursor(candidate, sourceSpanCandidates)
                && (sourceOrthographyNameHonorificBoundary
                    || contextualLocationBoundary
                    || isDirectImmutableSourceSpanBoundaryAuthorityCandidate(candidate)
                    || hasAdjacentImmutableSourceSpanAuthority(sourceSpanCandidates, candidate.sourceStart))) {
                internalBoundaries.add(Number(candidate.sourceStart));
            }
        }
        if (!internalBoundaries.size) {
            output.push(token);
            continue;
        }
        const boundaries = [tokenStart, ...[...internalBoundaries].sort((a, b) => a - b), tokenEnd];
        const sourceCharacters = Array.from(sourceSurface);
        const characterOffsetForSourceBoundary = boundary => {
            const relativeUnits = boundary - tokenStart;
            return Array.from(sourceSurface.slice(0, relativeUnits)).length;
        };
        for (let index = 0; index < boundaries.length - 1; index += 1) {
            const segmentStart = characterOffsetForSourceBoundary(boundaries[index]);
            const segmentEnd = characterOffsetForSourceBoundary(boundaries[index + 1]);
            const boundaryBefore = index > 0 && isProtectedImmutableSourceSpanBoundary(sourceSpanCandidates, boundaries[index]);
            output.push(...retokenizeSourceAuthoritySegment(token, segmentStart, segmentEnd, boundaryBefore));
        }
        if (!sourceCharacters.length) output.push(token);
    }
    return attachSourceTokenSpans(output, sourceText).map(token => {
        const historicalInflectionEvidence = getHistoricalInflectionBoundaryEvidence(token, sourceSpanCandidates);
        if (!historicalInflectionEvidence || !token.reviewedLexicalBoundaryBefore) return token;
        const adjusted = {
            ...token,
            reviewedLexicalBoundaryBefore: false,
            sourceAuthorityBoundaryBefore: true,
            sourceAuthorityBoundarySource: 'historical-kana-inflection'
        };
        delete adjusted.reviewedLexicalBoundarySource;
        return adjusted;
    });
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {number} sourceEnd */
function isProtectedLatinPassthroughSourceBoundary(sourceSpanCandidates, sourceEnd) {
    if (!Number.isInteger(sourceEnd)) return false;
    return (sourceSpanCandidates || []).some(candidate =>
        isHighConfidenceSourceSpanAuthorityCandidate(candidate)
        && candidate.sourceEnd === sourceEnd
        && !hasEqualOrStrongerSourceSpanContinuation(candidate, sourceSpanCandidates)
    );
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeLatinPassthroughTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const surface = String(token?.surface_form || '');
        const punctuationLead = /^[-–—]$/u.test(surface) && containsLatinOrNumber(tokens[index + 1]?.surface_form || '');
        if (!isLatinPassthroughTokenSurface(surface) || (!containsLatinOrNumber(surface) && !punctuationLead)) {
            merged.push(token);
            continue;
        }

        let end = index;
        let span = surface;
        let hasContent = containsLatinOrNumber(surface);
        while (end + 1 < tokens.length) {
            const currentSourceEnd = Number(tokens[end]?.sourceEnd);
            // Latin/source passthrough is a transport mechanism, not semantic authority.
            // Once an immutable high-confidence source candidate ends at the current
            // boundary, do not absorb following punctuation/Latin material and erase
            // the exact token boundary later evidence-selection stages require. A
            // stronger enclosing candidate may continue through the boundary.
            if (isProtectedLatinPassthroughSourceBoundary(sourceSpanCandidates, currentSourceEnd)) break;
            const next = tokens[end + 1];
            if (hasReviewedLexicalBoundaryBefore(next)) break;
            const nextSurface = String(next?.surface_form || '');
            if (next?.pos === '記号' && next?.pos_detail_1 === '空白') {
                const afterSpace = tokens[end + 2];
                if (!afterSpace || !isLatinPassthroughTokenSurface(afterSpace.surface_form) || !containsLatinOrNumber(afterSpace.surface_form)) break;
                span += nextSurface + String(afterSpace.surface_form || '');
                hasContent = true;
                end += 2;
                continue;
            }
            // An explicitly reconstructed ASCII wave is a true segment boundary. Do not let
            // Latin/source passthrough absorb it, or later scoped title evidence can lose the
            // source-span boundary needed to resolve each neighbouring title independently.
            if (next?.hardBoundaryReconstructed && nextSurface === '~') break;
            if (!isLatinPassthroughTokenSurface(nextSurface)) break;
            const sourceGap = sourceTokensAreContiguous(tokens[end], next) ? '' : String(next?.sourceGapBefore || '');
            if (sourceGap && !/^[\s\u3000]+$/u.test(sourceGap)) break;
            span += sourceGap + nextSurface;
            if (containsLatinOrNumber(nextSurface)) hasContent = true;
            end += 1;
        }
        if (!hasContent) { merged.push(token); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, end, {
            surface_form: span,
            latinPassthroughMatched: true,
            latinPassthroughOutput: span,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*'
        }, {
            annotations: ['latinPassthroughMatched', 'latinPassthroughOutput'], evidenceSource: 'latin-source-passthrough', semanticRole: 'latin-passthrough', allowWhitespaceGaps: true
        }));
        index = end;
    }
    return merged;
}

function mergeReviewedNameHonorificTokens(tokens) {
    const merged = [];
    const honorifics = new Set(['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏']);
    for (let index = 0; index < tokens.length; index += 1) {
        const previous = merged[merged.length - 1];
        if (!previous?.reviewedProperNameSpanMatched) {
            merged.push(tokens[index]);
            continue;
        }
        let candidate = '';
        let endMatch = -1;
        for (let end = index; end < Math.min(tokens.length, index + 4); end += 1) {
            const token = tokens[end];
            if (crossesReviewedLexicalBoundary(tokens, index, end)) break;
            if (!token || token.pos === '記号') break;
            candidate += String(token.surface_form || '');
            if (honorifics.has(candidate)) endMatch = end;
            if (![...honorifics].some(surface => surface.startsWith(candidate))) break;
        }
        if (endMatch < index) {
            merged.push(tokens[index]);
            continue;
        }
        const surface = tokens.slice(index, endMatch + 1).map(token => String(token.surface_form || '')).join('');
        const honorificReading = getReviewedNameHonorificReading(surface);
        merged.push(makeDerivedSpanToken(tokens, index, endMatch, {
            surface_form: surface,
            reading: honorificReading || surface,
            pronunciation: honorificReading || surface,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading || surface
        }, {
            annotations: ['reviewedNameHonorificMatched', 'reviewedNameHonorificReading'], evidenceSource: 'reviewed-name-honorific', semanticRole: 'name-honorific'
        }));
        index = endMatch;
    }
    return merged;
}

function hasWholeNameStructureEvidence(surface) {
    const originalSurface = String(surface || '').replace(/\s+/gu, ' ').trim();
    if (!originalSurface) return false;
    const normalizedSurface = normalizeKanjiForLookup(originalSurface, { names: true });
    if (runtimeState.reviewedProperNameSpanDictionary.has(originalSurface)
        || runtimeState.reviewedProperNameSpanDictionary.has(normalizedSurface)) return true;
    return Boolean(runtimeState.properNounDictionary.get(originalSurface)?.size
        || runtimeState.properNounDictionary.get(normalizedSurface)?.size);
}

/** @param {CJ2RToken} prefixToken @param {CJ2RToken} nameToken @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function hasReviewedPrefixNameStructureEvidence(prefixToken, nameToken, sourceSpanCandidates = []) {
    if (!prefixToken || !nameToken) return false;
    const surface = `${String(prefixToken.surface_form || '')}${String(nameToken.surface_form || '')}`;
    if (hasWholeNameStructureEvidence(surface)) return true;
    if (!Number.isInteger(prefixToken.sourceStart) || !Number.isInteger(nameToken.sourceEnd)) return false;
    return (sourceSpanCandidates || []).some(candidate => {
        if (!candidate || candidate.reviewRequired === true
            || candidate.sourceStart !== prefixToken.sourceStart
            || candidate.sourceEnd !== nameToken.sourceEnd) return false;
        if (candidate.kind === 'common-word' || candidate.kind === 'common-word-inflection' || candidate.category === 'title') return true;
        if (candidate.category === 'loanword' && candidate.romaji != null) return true;
        return candidate.category === 'name' && candidate.evidenceSource !== 'kuromoji-exact-dictionary';
    });
}

function sourceSpanNameCandidateHasPersonRole(candidate) {
    if (candidate?.category !== 'name' || candidate?.semanticRole !== 'proper-name') return false;
    const personCategories = new Set(['fam', 'per', 'person', 'char']);
    return (candidate.alternatives || []).some(alternative =>
        (alternative?.categories || []).some(category => personCategories.has(String(category || ''))));
}

function getSourceSpanLocationNameReading(candidate) {
    if (candidate?.category !== 'name'
        || candidate?.kind !== 'proper-noun'
        || candidate?.semanticRole !== 'proper-name'
        || candidate?.reviewRequired === true
        || candidate?.metadata?.sourceOrthographyNameVariant !== true) return null;
    const locationReadings = new Set((candidate.alternatives || [])
        .filter(alternative => (alternative?.categories || []).some(category => String(category || '') === 'loc'))
        .map(alternative => normalizeKanaReading(alternative?.reading || ''))
        .filter(Boolean));
    if (locationReadings.size !== 1) return null;
    const reading = [...locationReadings][0];
    const selectedReading = normalizeKanaReading(candidate.reading || '');
    if (selectedReading && selectedReading !== reading) return null;
    return reading;
}

function getContextualLocationSuffixRoleEvidence(candidate, sourceText) {
    const sourceNameReading = getSourceSpanLocationNameReading(candidate);
    const canonicalSurface = String(candidate?.lookupSurface || '');
    if (!sourceNameReading || !canonicalSurface || !runtimeState.tokenizer
        || !Number.isInteger(candidate?.sourceStart) || !Number.isInteger(candidate?.sourceEnd)) return null;
    const source = String(sourceText || '');
    const canonicalizedSource = source.slice(0, candidate.sourceStart) + canonicalSurface + source.slice(candidate.sourceEnd);
    const canonicalNameEnd = candidate.sourceStart + canonicalSurface.length;
    const canonicalTokens = attachSourceTokenSpans(stabilizeHardBoundaryTokenization(runtimeState.tokenizer.tokenize(canonicalizedSource) || [], canonicalizedSource), canonicalizedSource);
    const nameIndex = canonicalTokens.findIndex(token => Number(token?.sourceStart) === Number(candidate.sourceStart)
        && Number(token?.sourceEnd) === canonicalNameEnd
        && String(token?.surface_form || '') === canonicalSurface);
    if (nameIndex < 0 || nameIndex >= canonicalTokens.length - 1) return null;
    const nameToken = canonicalTokens[nameIndex];
    const suffixToken = canonicalTokens[nameIndex + 1];
    if (nameToken.pos !== '名詞' || nameToken.pos_detail_1 !== '固有名詞' || nameToken.pos_detail_2 !== '地域') return null;
    if (suffixToken.pos !== '名詞' || suffixToken.pos_detail_1 !== '接尾' || suffixToken.pos_detail_2 !== '地域'
        || Number(suffixToken.sourceStart) !== canonicalNameEnd) return null;
    const canonicalNameReading = normalizeKanaReading(getKuromojiDictionaryReading(nameToken) || nameToken.reading || nameToken.pronunciation || '');
    if (!canonicalNameReading || canonicalNameReading !== sourceNameReading) return null;
    const suffixReading = normalizeKanaReading(getKuromojiDictionaryReading(suffixToken) || suffixToken.reading || suffixToken.pronunciation || '');
    const suffixSurface = String(suffixToken.surface_form || '');
    if (!suffixReading || !suffixSurface || source.slice(candidate.sourceEnd, candidate.sourceEnd + suffixSurface.length) !== suffixSurface) return null;
    return { canonicalSurface, nameReading: sourceNameReading, suffixReading, suffixSurface, suffixToken };
}

function getContextualLocationBoundaryEvidence(candidate, sourceText, tokenEnd) {
    if (!candidate || !Number.isInteger(candidate.sourceEnd) || !Number.isInteger(tokenEnd) || candidate.sourceEnd >= tokenEnd) return null;
    return getContextualLocationSuffixRoleEvidence(candidate, sourceText);
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markContextualLocationSuffixNameRoles(tokens, sourceSpanCandidates = [], sourceText = '') {
    const working = (tokens || []).map(token => ({ ...token }));
    const candidates = (sourceSpanCandidates || []).filter(candidate => Boolean(getSourceSpanLocationNameReading(candidate)));
    for (const candidate of candidates) {
        if (!Number.isInteger(candidate.sourceStart) || !Number.isInteger(candidate.sourceEnd)) continue;
        const suffixIndex = working.findIndex(token => Number(token?.sourceStart) === Number(candidate.sourceEnd));
        if (suffixIndex < 0) continue;
        const suffix = working[suffixIndex];
        const role = getContextualLocationSuffixRoleEvidence(candidate, sourceText);
        if (!role || String(suffix?.surface_form || '') !== role.suffixSurface) continue;
        const startIndex = working.findIndex(token => Number(token?.sourceStart) === Number(candidate.sourceStart));
        if (startIndex < 0 || startIndex >= suffixIndex) continue;
        let endIndex = -1;
        for (let index = startIndex; index < suffixIndex; index += 1) {
            const token = working[index];
            if (!token || !Number.isInteger(token.sourceEnd)) break;
            if (index > startIndex && Number(working[index - 1]?.sourceEnd) !== Number(token.sourceStart)) break;
            if (Number(token.sourceEnd) === Number(candidate.sourceEnd)) { endIndex = index; break; }
            if (Number(token.sourceEnd) > Number(candidate.sourceEnd)) break;
        }
        if (endIndex < startIndex) continue;
        const members = working.slice(startIndex, endIndex + 1);
        if (members.map(token => String(token.surface_form || '')).join('') !== String(candidate.sourceSurface || '')) continue;
        const locationToken = makeDerivedSpanToken(working, startIndex, endIndex, {
            surface_form: String(candidate.sourceSurface || ''),
            reading: role.nameReading,
            pronunciation: role.nameReading,
            pos: '名詞', pos_detail_1: '固有名詞', pos_detail_2: '地域', pos_detail_3: '一般',
            locationSuffixRoleMatched: true,
            locationSuffixCandidateSurface: role.canonicalSurface,
            locationSuffixSurface: String(suffix.surface_form || '')
        }, {
            annotations: ['locationSuffixRoleMatched'],
            evidenceSource: 'source-orthography-location-suffix-context',
            semanticRole: 'proper-name',
            confidence: Number(candidate.confidence || 0),
            reviewRequired: false
        });
        const suffixToken = {
            ...suffix,
            pos: role.suffixToken.pos,
            pos_detail_1: role.suffixToken.pos_detail_1,
            pos_detail_2: role.suffixToken.pos_detail_2,
            pos_detail_3: role.suffixToken.pos_detail_3,
            basic_form: role.suffixToken.basic_form,
            reading: role.suffixReading,
            pronunciation: role.suffixToken.pronunciation || role.suffixToken.reading || role.suffixReading,
            locationSuffixContextMatched: true
        };
        working.splice(startIndex, endIndex - startIndex + 1, locationToken);
        const adjustedSuffixIndex = startIndex + 1;
        if (working[adjustedSuffixIndex]?.sourceStart === suffixToken.sourceStart) working[adjustedSuffixIndex] = suffixToken;
    }
    return working;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markSwallowedNameHonorificBoundaryConflicts(tokens, sourceSpanCandidates = []) {
    const marked = tokens || [];
    const honorificSurfaces = new Set(['さん', 'さま', '様', 'くん', '君', 'ちゃん', '氏']);
    const candidates = sourceSpanCandidates || [];
    for (const nameCandidate of candidates) {
        if (!sourceSpanNameCandidateHasPersonRole(nameCandidate)
            || !Number.isInteger(nameCandidate.sourceStart)
            || !Number.isInteger(nameCandidate.sourceEnd)) continue;
        const honorific = candidates.find(candidate =>
            Number.isInteger(candidate?.sourceStart)
            && Number.isInteger(candidate?.sourceEnd)
            && candidate.sourceStart === nameCandidate.sourceEnd
            && honorificSurfaces.has(String(candidate.sourceSurface || '')));
        if (!honorific) continue;
        const boundaryPreserved = marked.some(token => token?.sourceEnd === nameCandidate.sourceEnd)
            && marked.some(token => token?.sourceStart === nameCandidate.sourceEnd);
        if (boundaryPreserved) continue;
        const owner = marked.find(token => Number.isInteger(token?.sourceStart)
            && Number.isInteger(token?.sourceEnd)
            && Number(token.sourceStart) === nameCandidate.sourceStart
            && Number(token.sourceEnd) > nameCandidate.sourceEnd);
        if (!owner) continue;
        owner.nameContextAmbiguous = true;
        owner.nameContextBase = String(nameCandidate.sourceSurface || '');
        owner.nameContextStructure = 'proper-name-honorific-boundary-conflict';
        owner.nameContextCandidateSurface = String(nameCandidate.lookupSurface || nameCandidate.sourceSurface || '');
        owner.nameContextSourceStart = nameCandidate.sourceStart;
        owner.nameContextSourceEnd = honorific.sourceEnd;
        owner.nameContextSourceSurface = `${String(nameCandidate.sourceSurface || '')}${String(honorific.sourceSurface || '')}`;
    }
    return marked;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markAttachedNameHonorificRoles(tokens, sourceSpanCandidates = []) {
    const marked = (tokens || []).map(token => ({ ...token }));
    for (let index = 0; index < marked.length - 1; index += 1) {
        const token = marked[index];
        const honorific = marked[index + 1];
        const honorificReading = getReviewedNameHonorificReading(honorific?.surface_form);
        if (!token || !honorific || !honorificReading
            || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)
            || !Number.isInteger(honorific.sourceStart) || token.sourceEnd !== honorific.sourceStart) continue;
        const nameCandidate = (sourceSpanCandidates || []).find(candidate =>
            sourceSpanNameCandidateHasPersonRole(candidate)
            && candidate.sourceStart === token.sourceStart
            && candidate.sourceEnd === token.sourceEnd);
        if (!nameCandidate) continue;
        token.nameHonorificRoleMatched = true;
        token.nameHonorificCandidateSurface = String(nameCandidate.lookupSurface || nameCandidate.sourceSurface || token.surface_form || '');
        honorific.reviewedNameHonorificMatched = true;
        honorific.reviewedNameHonorificReading = honorificReading;
    }
    return marked;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function markUnreviewedNameContextTokens(tokens, sourceSpanCandidates = [], sourceText = '') {
    const locationRoleTokens = markContextualLocationSuffixNameRoles(tokens, sourceSpanCandidates, sourceText);
    const marked = markSwallowedNameHonorificBoundaryConflicts(locationRoleTokens, sourceSpanCandidates);
    for (let index = 0; index < marked.length; index += 1) {
        const surname = marked[index];
        if (!isPersonNameToken(surname) || surname.pos_detail_3 !== '姓') continue;
        let nextIndex = index + 1;
        let sawWhitespace = false;
        while (nextIndex < marked.length && marked[nextIndex]?.pos === '記号' && marked[nextIndex]?.pos_detail_1 === '空白') {
            sawWhitespace = true;
            nextIndex += 1;
        }
        const candidate = marked[nextIndex];
        if (!sawWhitespace || !candidate || !containsHan(candidate.surface_form) || isProperNounToken(candidate)) continue;
        candidate.nameContextAmbiguous = true;
        candidate.nameContextSurname = surname.surface_form;
    }

    // A nominal prefix followed by a proper-name token can be a destructive
    // analyser split. Keep it reviewable unless independent whole-span evidence
    // establishes the combined lexical or name structure.
    for (let index = 1; index < marked.length; index += 1) {
        const candidate = marked[index];
        const prefix = marked[index - 1];
        if (!candidate || !prefix
            || prefix.pos !== '接頭詞'
            || prefix.pos_detail_1 !== '名詞接続'
            || !isProperNounToken(candidate)) continue;
        if (hasReviewedPrefixNameStructureEvidence(prefix, candidate, sourceSpanCandidates)) continue;
        candidate.nameContextAmbiguous = true;
        candidate.nameContextBase = String(prefix.surface_form || '');
        candidate.nameContextStructure = 'nominal-prefix-proper-name-boundary';
    }

    // A proper-name token followed directly by a common name-forming generic can
    // create a presentation boundary that Kuromoji alone cannot authorise. Exact
    // maintained name evidence settles the structure; otherwise retain the current
    // output while making the boundary reviewable rather than guessing a space.
    const structuralNameSuffixes = new Set([
        '駅','空港','大学','都','道','府','県','市','区','町','村','山','川','河','湖','島',
        '線','港','公園','城','寺','神社','病院','学校','高校','中学校','小学校','研究所',
        '支店','本店','本社','支社'
    ]);
    for (let index = 1; index < marked.length; index += 1) {
        const candidate = marked[index];
        const surface = String(candidate?.surface_form || '');
        if (!candidate || !structuralNameSuffixes.has(surface) || candidate.reviewedProperNameSpanMatched) continue;
        const previous = marked[index - 1];
        if (!previous || previous.pos === '記号' || !(isProperNounToken(previous) || previous.reviewedProperNameSpanMatched || previous.variantProperNounMatched)) continue;

        let wholeNameAttested = false;
        let candidateSurface = surface;
        for (let cursor = index - 1, steps = 0; cursor >= 0 && steps < 8; cursor -= 1, steps += 1) {
            const token = marked[cursor];
            if (!token || token.pos === '記号' || isParticle(token) || token.pos === '助動詞') break;
            candidateSurface = String(token.surface_form || '') + candidateSurface;
            if (hasWholeNameStructureEvidence(candidateSurface)) {
                wholeNameAttested = true;
                break;
            }
        }
        if (wholeNameAttested) continue;
        candidate.nameContextAmbiguous = true;
        candidate.nameContextBase = String(previous.surface_form || '');
        candidate.nameContextStructure = 'proper-name-generic-boundary';
    }
    return marked;
}

function mergeDesiderativeGaruTokens(tokens) {
    const output = [];
    const joinRange = (start, end) => {
        const slice = tokens.slice(start, end + 1);
        return makeDerivedSpanToken(tokens, start, end, {
            surface_form: slice.map(token => String(token?.surface_form || '')).join(''),
            reading: slice.map(token => String(token?.reading || token?.surface_form || '')).join(''),
            pronunciation: slice.map(token => String(token?.pronunciation || token?.reading || token?.surface_form || '')).join(''),
            pos: '動詞',
            pos_detail_1: '自立',
            pos_detail_2: '*',
            desiderativeGaruMatched: true
        }, {
            annotations: ['desiderativeGaruMatched'], evidenceSource: 'productive-desiderative-garu', semanticRole: 'verbal-morphology'
        });
    };
    for (let index = 0; index < tokens.length; index += 1) {
        const stem = tokens[index];
        const tai = tokens[index + 1];
        const garu = tokens[index + 2];
        const taiConnector = tai && tokenBasicForm(tai) === 'たい' && String(tai.conjugated_form || '') === 'ガル接続';
        const garuSuffix = garu && tokenBasicForm(garu) === 'がる' && garu.pos === '動詞' && garu.pos_detail_1 === '接尾';
        const stemLike = stem && (stem.pos === '動詞' || stem.pos === '助動詞' || stem.pos === '形容詞'
            || (taiConnector && garuSuffix && stem.pos === '名詞' && stem.pos_detail_1 !== '固有名詞'));
        const misparsedTte = tokens[index + 3];
        const misparsedPastTa = stem?.pos === '動詞'
            && String(stem.conjugated_form || '').includes('連用')
            && String(tai?.surface_form || '') === 'た'
            && tokenBasicForm(tai) === 'た'
            && tai?.pos === '助動詞'
            && String(tai.conjugated_type || '') === '特殊・タ';
        const misparsedGaruChain = misparsedPastTa
            && String(garu?.surface_form || '') === 'が'
            && garu?.pos === '助詞'
            && String(misparsedTte?.surface_form || '') === 'って'
            && misparsedTte?.pos === '助詞'
            && !hasReviewedLexicalBoundaryBefore(tai)
            && !hasReviewedLexicalBoundaryBefore(garu)
            && !hasReviewedLexicalBoundaryBefore(misparsedTte);
        if (misparsedGaruChain) {
            { const joined = joinRange(index, index + 3); joined.desiderativeGaruRecoveredFromSurface = true; if (joined.semanticAnnotationOwnership?.[0]) joined.semanticAnnotationOwnership[0].annotations.push('desiderativeGaruRecoveredFromSurface'); output.push(joined); }
            index += 3;
            continue;
        }
        if (!stemLike || !taiConnector || !garuSuffix || hasReviewedLexicalBoundaryBefore(tai) || hasReviewedLexicalBoundaryBefore(garu)) {
            output.push(stem);
            continue;
        }
        let end = index + 2;
        if (String(garu.surface_form || '') === 'がっ') {
            const continuation = tokens[end + 1];
            if (continuation && !hasReviewedLexicalBoundaryBefore(continuation)) {
                const contracted = continuation.pos === '動詞'
                    && continuation.pos_detail_1 === '非自立'
                    && runtimeState.contractedAuxiliaryBasicForms.has(tokenBasicForm(continuation));
                if (contracted || String(continuation.surface_form || '') === 'て' || tokenBasicForm(continuation) === 'た') end += 1;
            }
            const mergedContracted = end === index + 3
                && runtimeState.contractedAuxiliaryBasicForms.has(tokenBasicForm(tokens[end]));
            if (mergedContracted) {
                const nominalizer = tokens[end + 1];
                const copula = tokens[end + 2];
                if (String(nominalizer?.surface_form || '') === 'ん' && tokenBasicForm(copula) === 'だ'
                    && !hasReviewedLexicalBoundaryBefore(nominalizer) && !hasReviewedLexicalBoundaryBefore(copula)) end += 2;
            }
        }
        output.push(joinRange(index, end));
        index = end;
    }
    return output;
}

function sourceSpanCandidateSupportsInflectionalStem(sourceSpanCandidates, token) {
    if (!token || !Number.isInteger(token.sourceStart) || !Number.isInteger(token.sourceEnd)) return false;
    const tokenReading = normalizeKanaReading(token.reading || token.pronunciation || '');
    const sourceCandidateSupport = (sourceSpanCandidates || []).some(candidate => {
        if (candidate?.sourceStart !== token.sourceStart || candidate?.sourceEnd !== token.sourceEnd) return false;
        if (candidate.reviewRequired === true) return false;
        const candidateReading = normalizeKanaReading(candidate.reading || '');
        if (tokenReading && candidateReading && tokenReading !== candidateReading) return false;
        if (candidate.kind === 'common-word-inflection' && candidate.semanticRole === 'lexical-inflection') return true;
        if (candidate.kind !== 'kuromoji-exact-dictionary-span') return false;
        return (candidate.alternatives || []).some(alternative => alternative?.pos === '動詞' || alternative?.pos === '形容詞');
    });
    if (sourceCandidateSupport) return true;
    if (!tokenReading) return false;
    // Some single-Kanji stems (for example 見 in 見て) have multiple dictionary readings,
    // so source-span discovery intentionally declines to emit one selected candidate.
    // The preserved token reading can still be checked against the raw dictionary without
    // trusting the injected POS: attachment is licensed only when that exact reading has
    // an attested verb/adjective entry.
    return getKuromojiExactDictionaryCandidates(String(token.surface_form || '')).some(candidate =>
        (candidate?.pos === '動詞' || candidate?.pos === '形容詞')
        && normalizeKanaReading(candidate?.reading || '') === tokenReading);
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeCasualSpeechTokens(tokens, sourceSpanCandidates = []) {
    const merged = [];
    const joinToken = (left, right) => makeDerivedSpanToken([left, right], 0, 1, {
        surface_form: String(left.surface_form || '') + String(right.surface_form || ''),
        reading: String(left.reading || left.surface_form || '') + String(right.reading || right.surface_form || ''),
        pronunciation: String(left.pronunciation || left.reading || left.surface_form || '') + String(right.pronunciation || right.reading || right.surface_form || '')
    }, {
        evidenceSource: 'productive-casual-morphology', semanticRole: 'verbal-morphology'
    });
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const previous = merged[merged.length - 1];
        const next = tokens[index + 1];
        const nextNext = tokens[index + 2];
        const sourceEvidenceStem = Boolean(previous && sourceSpanCandidateSupportsInflectionalStem(sourceSpanCandidates, previous));
        const verbLikePrevious = previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞' || previous.pos_detail_1 === '動詞' || previous.pos_detail_1 === '形容詞' || sourceEvidenceStem);
        const contractedAuxiliary = token?.pos === '動詞'
            && token?.pos_detail_1 === '非自立'
            && runtimeState.contractedAuxiliaryBasicForms.has(tokenBasicForm(token));
        if (previous && !hasReviewedLexicalBoundaryBefore(token) && contractedAuxiliary && previous.pos !== '記号' && !isParticle(previous)) {
            merged[merged.length - 1] = joinToken(previous, token);
            continue;
        }
        if (previous && !hasReviewedLexicalBoundaryBefore(token) && verbLikePrevious && runtimeState.conjugationJoinEndings.has(token.surface_form)) {
            merged[merged.length - 1] = joinToken(previous, token);
            continue;
        }
        if (previous && !hasReviewedLexicalBoundaryBefore(token) && !hasReviewedLexicalBoundaryBefore(next) && !hasReviewedLexicalBoundaryBefore(nextNext)
            && previous.pos === '動詞' && token.surface_form === 'て' && next?.surface_form === 'ん' && nextNext?.surface_form === 'だ') {
            merged[merged.length - 1] = joinToken(joinToken(joinToken(previous, token), next), nextNext);
            index += 2;
            continue;
        }
        merged.push(token);
    }
    return merged;
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {CJ2RToken} startToken @param {CJ2RToken} endToken */
function sourceSpanGrammarCandidateCoversRange(sourceSpanCandidates, startToken, endToken) {
    if (!startToken || !endToken || !Number.isInteger(startToken.sourceStart) || !Number.isInteger(endToken.sourceEnd)) return false;
    const startSource = Number(startToken.sourceStart);
    const endSource = Number(endToken.sourceEnd);
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'grammar'
        && candidate?.kind === 'grammatical-expression'
        && candidate?.evidenceSource === 'grammatical-expression-evidence'
        && candidate?.sourceStart === startSource
        && candidate?.sourceEnd >= endSource);
}

/** @param {ReadonlyArray<CJ2RSourceSpanCandidate>} sourceSpanCandidates @param {CJ2RToken} startToken @param {CJ2RToken} endToken @param {string} surface */
function sourceSpanGrammarCandidateMatchesRange(sourceSpanCandidates, startToken, endToken, surface) {
    if (!startToken || !endToken || !Number.isInteger(startToken.sourceStart) || !Number.isInteger(endToken.sourceEnd)) return false;
    const startSource = Number(startToken.sourceStart);
    const endSource = Number(endToken.sourceEnd);
    return (sourceSpanCandidates || []).some(candidate =>
        candidate?.category === 'grammar'
        && candidate?.kind === 'grammatical-expression'
        && candidate?.evidenceSource === 'grammatical-expression-evidence'
        && candidate?.sourceStart === startSource
        && candidate?.sourceEnd === endSource
        && candidate?.sourceSurface === surface);
}

/** @param {CJ2RToken[]} tokens @param {number} startIndex @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function findLongestGrammaticalExpression(tokens, startIndex, sourceSpanCandidates = []) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token) break;
        if (token.pos === '記号' && !sourceSpanGrammarCandidateCoversRange(sourceSpanCandidates, tokens[startIndex], token)) break;
        candidateSurface += token.surface_form;
        if (!runtimeState.grammaticalExpressionPrefixes.has(candidateSurface)) break;
        const value = runtimeState.grammaticalExpressionDictionary.get(candidateSurface);
        if (value && (token.pos !== '記号' || sourceSpanGrammarCandidateMatchesRange(sourceSpanCandidates, tokens[startIndex], token, candidateSurface))) {
            bestMatch = { surface: candidateSurface, value, length: end - startIndex + 1 };
        }
    }
    return bestMatch;
}

/** @param {CJ2RToken[]} tokens @param {ReadonlyArray<CJ2RSourceSpanCandidate>} [sourceSpanCandidates] */
function mergeRecognizedGrammaticalExpressions(tokens, sourceSpanCandidates = []) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestGrammaticalExpression(tokens, index, sourceSpanCandidates);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, { surface_form: bestMatch.surface, reading: bestMatch.surface, pronunciation: bestMatch.surface, pos: '助詞', pos_detail_1: '接続助詞', pos_detail_2: '*', fullGrammaticalExpression: true, value: bestMatch.value }, { annotations: ['fullGrammaticalExpression', 'value'], evidenceSource: 'grammatical-expression-bank', semanticRole: 'grammatical-expression' }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestContextualOverride(tokens, startIndex, sourceText, sourceRanges = [], options = {}) {
    const overridesEnabled = Object.prototype.hasOwnProperty.call(options, 'overridesEnabled')
        ? Boolean(options.overridesEnabled)
        : runtimeState.overridesEnabled;
    if (!overridesEnabled || !runtimeState.contextOverrideDictionary.size) return null;
    let candidateSurface = '';
    let bestMatch = null;
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += token.surface_form;
        if (!runtimeState.contextOverridePrefixes.has(candidateSurface)) break;
        const startRange = sourceRanges[startIndex];
        const endRange = sourceRanges[end];
        const candidateRange = startRange && endRange ? { start: startRange.start, end: endRange.end } : null;
        for (const override of runtimeState.contextOverrideDictionary.get(candidateSurface) || []) {
            if (!contextualPatternContainsRange(override.pattern, sourceText, candidateRange)) continue;
            bestMatch = { surface: candidateSurface, romaji: override.romaji, length: end - startIndex + 1 };
        }
    }
    return bestMatch;
}

function mergeContextualOverrideTokens(tokens, sourceText, options = {}) {
    const merged = [];
    const sourceRanges = findSourceTokenRanges(tokens, sourceText);
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestContextualOverride(tokens, index, sourceText, sourceRanges, options);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, {
            surface_form: bestMatch.surface,
            contextualOverrideMatched: true,
            contextualRomaji: bestMatch.romaji,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        }, {
            annotations: ['contextualOverrideMatched', 'contextualRomaji'], evidenceSource: 'context-override', semanticRole: 'contextual-override'
        }));
        index += bestMatch.length - 1;
    }
    return merged;
}

function findLongestKnownPhrase(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        const candidateTokens = tokens.slice(startIndex, end + 1);
        if (candidateTokens.some(item => item && (item.contextualOverrideMatched || item.titleReadingEvidenceMatched || item.loanwordMatched || item.atejiMatched))) break;
        candidateSurface += token.surface_form;
        if (!runtimeState.knownPhrasePrefixes.has(candidateSurface)) break;
        const value = runtimeState.knownPhraseDictionary.get(candidateSurface);
        const length = end - startIndex + 1;
        if (value && length > 1) bestMatch = { surface: candidateSurface, value, length, source: runtimeState.compoundWordDictionary.has(candidateSurface) ? 'whole-word-compound' : 'known-phrase' };
    }
    return bestMatch;
}

function mergeKnownPhraseTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestKnownPhrase(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push(makeDerivedSpanToken(tokens, index, index + bestMatch.length - 1, { surface_form: bestMatch.surface, knownPhraseMatched: true, knownPhraseValue: bestMatch.value, knownPhraseSource: bestMatch.source }, { annotations: ['knownPhraseMatched', 'knownPhraseValue', 'knownPhraseSource'], evidenceSource: bestMatch.source || 'known-phrase', semanticRole: 'known-phrase' }));
        index += bestMatch.length - 1;
    }
    return merged;
}

