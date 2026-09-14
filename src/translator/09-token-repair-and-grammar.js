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

function splitStructuredNumericUnitTokens(tokens) {
    const split = [];
    for (const token of tokens || []) {
        const surface = String(token?.surface_form || '');
        let matchedUnit = null;
        for (const unit of separatedNumericUnitSurfaces) {
            if (surface.endsWith(unit) && isJapaneseNumeralSurface(surface.slice(0, -unit.length))) {
                matchedUnit = unit;
                break;
            }
        }
        if (!matchedUnit) { split.push(token); continue; }
        const numeralSurface = surface.slice(0, -matchedUnit.length);
        const position = Number(token.word_position || 0);
        split.push({
            ...token, surface_form: numeralSurface, reading: '*', pronunciation: '*',
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            structuredNumericSplit: true
        });
        split.push({
            ...token, surface_form: matchedUnit, reading: '*', pronunciation: '*',
            pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '助数詞', pos_detail_3: '*',
            word_position: position > 0 ? position + numeralSurface.length : position,
            structuredNumericSplit: true
        });
    }
    return split;
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
    return {
        ...token,
        surface_form: '中', reading: 'ジュウ', pronunciation: 'ジュウ',
        pos: '名詞', pos_detail_1: '接尾', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalSuffix: true
    };
}

function retokenizeTypedBoundaryRemainder(token, remainder) {
    const originalPosition = Number(token?.word_position || 0);
    const basePosition = originalPosition > 0 ? originalPosition + 1 : originalPosition;
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    if (!retokenized.length) return [{
        ...token, surface_form: remainder, reading: '*', pronunciation: '*',
        word_position: basePosition, tokenizationRoleBoundaryBefore: true
    }];
    return retokenized.map((item, index) => ({
        ...item,
        word_position: basePosition > 0 && Number(item.word_position || 0) > 0 ? basePosition + Number(item.word_position) - 1 : Number(item.word_position || 0),
        tokenizationRoleBoundaryBefore: index === 0 || Boolean(item.tokenizationRoleBoundaryBefore)
    }));
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
    return {
        ...span.token,
        surface_form: span.surface,
        reading: reading || '*',
        pronunciation: reading || '*',
        pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
        structuredTemporalHead: true
    };
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
                repaired.push(collision ? { ...token, typedTemporalSpanLexicalCollision: collision } : token);
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

function makeTypedTemporalSpanToken(head, surface, reading) {
    return {
        ...head,
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*', pos_detail_3: '*',
        typedTemporalExpressionMatched: true,
        typedTemporalExpressionType: 'period-span',
        typedTemporalReading: reading,
        typedTemporalSource: 'typed-period-span'
    };
}

/** @param {string} surface @param {CJ2RToken|null} [token] */
function getTypedTemporalHeadReading(surface, token = null) {
    if (surface === '一日') return 'いちにち';
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
                merged.push(makeTypedTemporalSpanToken(head, headSpan.surface + '中', getTypedTemporalHeadReading(headSpan.surface, head) + 'じゅう'));
                continue;
            }
        }
        if (surface.endsWith('中') && surface.length > 1) {
            const headSurface = surface.slice(0, -1);
            if (isTypedTemporalPeriodSurface(headSurface)) {
                const headReading = getTypedTemporalHeadReading(headSurface);
                if (headReading) {
                    merged.push(makeTypedTemporalSpanToken(token, surface, headReading + 'じゅう'));
                    continue;
                }
            }
        }
        const next = tokens[index + 1];
        if (isTypedTemporalPeriodSurface(surface) && String(next?.surface_form || '') === '中' && !hasReviewedLexicalBoundaryBefore(next)) {
            const headReading = getTypedTemporalHeadReading(surface, token);
            if (headReading) {
                merged.push(makeTypedTemporalSpanToken(token, surface + '中', headReading + 'じゅう'));
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

function getOneDaySpan(tokens, startIndex) {
    const token = tokens[startIndex];
    if (String(token?.surface_form || '') === '一日') return { length: 1, head: token };
    const next = tokens[startIndex + 1];
    if (String(token?.surface_form || '') === '一' && String(next?.surface_form || '') === '日'
        && (token?.pos_detail_1 === '数' || isJapaneseNumeralSurface(token.surface_form))
        && next?.pos_detail_2 === '助数詞') return { length: 2, head: token };
    return null;
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
        || isSahenPredicateStructureAt(tokens, startIndex)
        || hasFollowingPredicateAfterOneDayNominal(tokens, startIndex);
}

function markTypedOneDayDurationTokens(tokens) {
    const resolved = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const span = getOneDaySpan(tokens, index);
        if (!span) { resolved.push(tokens[index]); continue; }
        const previous = tokens[index - 1] || null;
        if (previous && isCalendarMonthSurface(previous.surface_form)) {
            resolved.push(tokens[index]);
            continue;
        }
        let scan = index + span.length;
        let next = tokens[scan] || null;
        while (next && scan < tokens.length - 1 && isParticle(next) && ['だけ','も','は'].includes(String(next.surface_form || ''))) {
            scan += 1;
            next = tokens[scan] || null;
        }
        const durationContext = isOneDayDurationFollower(tokens, scan);
        if (!durationContext) { resolved.push(tokens[index]); continue; }
        const surface = span.length === 1 ? '一日' : String(tokens[index].surface_form || '') + String(tokens[index + 1].surface_form || '');
        resolved.push({
            ...span.head,
            surface_form: surface,
            reading: 'イチニチ', pronunciation: 'イチニチ',
            pos: '名詞', pos_detail_1: '副詞可能', pos_detail_2: '*', pos_detail_3: '*',
            typedTemporalExpressionMatched: true,
            typedTemporalExpressionType: 'duration-day',
            typedTemporalReading: 'いちにち',
            typedTemporalSource: 'typed-duration-context'
        });
        index += span.length - 1;
    }
    return resolved;
}

function makeTypedClockHourToken(token, surface, reading, source) {
    return {
        ...token,
        surface_form: surface,
        reading,
        pronunciation: reading,
        pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
        numericExpression: true,
        typedNumericExpressionMatched: true,
        typedNumericExpressionType: 'clock-hour',
        typedNumericReading: reading,
        typedNumericSource: source
    };
}

function mergeTypedClockHourTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        const directSurface = String(token?.surface_form || '');
        const directEvidence = runtimeState.counterDateReadingDictionary.get(directSurface);
        if (/^[0-9０-９〇零一二三四五六七八九十百]+時$/u.test(directSurface)
            && directEvidence?.reading
            && String(tokens[index + 1]?.surface_form || '') !== '間') {
            merged.push(makeTypedClockHourToken(token, directSurface, directEvidence.reading, 'counter-date-reading-evidence'));
            continue;
        }
        if (!isJapaneseNumeralSurface(directSurface)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
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
        const reviewed = runtimeState.counterDateReadingDictionary.get(surface);
        if (!reviewed?.reading) { merged.push(token); continue; }
        merged.push(makeTypedClockHourToken(token, surface, reviewed.reading, 'counter-date-reading-evidence'));
        index = end;
    }
    return merged;
}

function getMinuteCounterFinalDigit(surface) {
    const chars = Array.from(String(surface || ''));
    const map = { '〇':0,'零':0,'一':1,'二':2,'三':3,'四':4,'五':5,'六':6,'七':7,'八':8,'九':9,'十':0 };
    const last = chars.at(-1);
    if (/^[0-9]$/u.test(last || '')) return Number(last);
    return Object.prototype.hasOwnProperty.call(map, last) ? map[last] : null;
}

function resolveMinuteCounterReading(numeralSurface) {
    const fullSurface = String(numeralSurface || '') + '分';
    const reviewed = runtimeState.counterDateReadingDictionary.get(fullSurface);
    if (reviewed?.reading) return { reading: reviewed.reading, source: 'counter-date-reading-evidence' };
    const numeralReading = normalizeKanaReading(getTokenizerReadingForSurface(numeralSurface) || '');
    const finalDigit = getMinuteCounterFinalDigit(numeralSurface);
    if (!numeralReading || finalDigit == null) return null;
    if (finalDigit === 1 && numeralReading.endsWith('いち')) return { reading: numeralReading.slice(0, -2) + 'いっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 6 && numeralReading.endsWith('ろく')) return { reading: numeralReading.slice(0, -2) + 'ろっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 8 && numeralReading.endsWith('はち')) return { reading: numeralReading.slice(0, -2) + 'はっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 0 && numeralReading.endsWith('じゅう')) return { reading: numeralReading.slice(0, -3) + 'じゅっぷん', source: 'minute-counter-morphology' };
    if (finalDigit === 3 || finalDigit === 4) return { reading: numeralReading + 'ぷん', source: 'minute-counter-morphology' };
    return { reading: numeralReading + 'ふん', source: 'minute-counter-morphology' };
}

function mergeTypedMinuteCounterTokens(tokens) {
    const merged = [];
    for (let index = 0; index < (tokens || []).length; index += 1) {
        const token = tokens[index];
        if (!isJapaneseNumeralSurface(token?.surface_form)) { merged.push(token); continue; }
        let end = index;
        let numeralSurface = '';
        while (end < tokens.length && isJapaneseNumeralSurface(tokens[end]?.surface_form)) {
            numeralSurface += String(tokens[end].surface_form || '');
            end += 1;
        }
        const unit = tokens[end] || null;
        if (String(unit?.surface_form || '') !== '分' || hasReviewedLexicalBoundaryBefore(unit)) {
            merged.push(token);
            continue;
        }
        const resolvedMinute = resolveMinuteCounterReading(numeralSurface);
        if (!resolvedMinute) { merged.push(token); continue; }
        const surface = numeralSurface + '分';
        merged.push({
            ...token,
            surface_form: surface,
            reading: resolvedMinute.reading,
            pronunciation: resolvedMinute.reading,
            pos: '名詞', pos_detail_1: '数', pos_detail_2: '*', pos_detail_3: '*',
            numericExpression: true,
            typedNumericExpressionMatched: true,
            typedNumericExpressionType: 'minute-counter',
            typedNumericReading: resolvedMinute.reading,
            typedNumericSource: resolvedMinute.source
        });
        index = end;
    }
    return merged;
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

function getOrdinaryCompoundReadingEvidence(token) {
    if (!token || !isProperNounToken(token) || !containsHan(token.surface_form)) return null;
    const lookup = getGeneralWordLookup(token.surface_form);
    const selected = selectGeneralWordReading(lookup);
    if (!selected?.reading) return null;
    const normalizedSelected = normalizeKanaReading(selected.reading);
    const exactOrdinaryMatch = getKuromojiExactDictionaryCandidates(token.surface_form).some(candidate =>
        candidate.pos === '名詞'
        && candidate.pos_detail_1 === '接尾'
        && candidate.pos_detail_2 === '助数詞'
        && normalizeKanaReading(candidate.reading) === normalizedSelected
    );
    if (!exactOrdinaryMatch) return null;
    return { reading: selected.reading, candidates: getGeneralWordCandidates(lookup) };
}

function annotateOrdinaryCompoundReadingContext(tokens) {
    return (tokens || []).map((token, index) => {
        const evidence = getOrdinaryCompoundReadingEvidence(token);
        if (!evidence) return token;
        const previous = tokens[index - 1] || null;
        const next = tokens[index + 1] || null;
        const ordinaryNounPrefix = Boolean(
            previous
            && previous.pos === '接頭詞'
            && previous.pos_detail_1 === '名詞接続'
            && !isProperNounToken(previous)
        );
        const ordinaryNounSuffix = Boolean(
            next
            && next.pos === '名詞'
            && next.pos_detail_1 === '接尾'
            && next.pos_detail_2 !== '人名'
            && !isProperNounToken(next)
        );
        if (!ordinaryNounPrefix && !ordinaryNounSuffix) return token;
        return {
            ...token,
            ordinaryCompoundReadingMatched: true,
            ordinaryCompoundReading: evidence.reading,
            ordinaryCompoundReadingCandidates: evidence.candidates
        };
    });
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
    const selected = selectGeneralWordReading(lookup);
    if (!selected?.reading) return null;
    const standalone = getStandaloneSingleToken(dictionarySurface);
    if (!standalone || standalone.pos !== '動詞' || standalone.pos_detail_1 === '接尾') return null;
    return { surface: dictionarySurface, reading: selected.reading };
}

function annotateMorphologicalOutputBoundaries(tokens) {
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
        const recoveredStem = token?.pos === '動詞'
            && reviewedAspectualCompoundVerbBasicForms.has(tokenBasicForm(token))
            && sourceTokensAreContiguous(previous, token)
            ? getReviewedNounMisparsedContinuativeStem(previous)
            : null;
        const recoveredAspectualCompound = Boolean(recoveredStem && !separateAuxiliary && !teDeLinkedSequence);
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
        if (!compoundVerb && !recoveredAspectualCompound && !teDeMotionContinuation && !attachedConjunctive && !negativeAuxiliary && !causativePassiveBridge) return token;
        const reason = negativeAuxiliary
            ? 'direct-negative-inflection'
            : causativePassiveBridge
                ? 'contracted-causative-passive-bridge'
                : recoveredAspectualCompound
                    ? 'reviewed-continuative-stem-aspectual-compound'
                    : teDeMotionContinuation
                        ? 'te-de-motion-continuation'
                        : compoundVerb
                            ? 'continuative-stem-compound-verb'
                            : 'attached-conjunctive-particle';
        return {
            ...token,
            morphologicalJoinLeft: true,
            morphologicalJoinReason: reason,
            morphologicalJoinAuthority: compoundVerb || recoveredAspectualCompound || teDeMotionContinuation || causativePassiveBridge ? 'strong-morphology' : 'grammar',
            recoveredContinuativeStem: recoveredAspectualCompound ? recoveredStem?.surface : undefined
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
    return {
        ...token,
        surface_form: fragment,
        basic_form: fragment,
        reading: fragment,
        pronunciation: fragment,
        word_position: position > 0 ? position + characterOffset : position,
        kanaCommonWordBoundaryFragment: true
    };
}

function tokenizeKanaCommonWordBoundaryRemainder(token, surface, characterOffset, evidenceSurface) {
    const remainder = String(surface || '');
    if (!remainder) return [];
    const originalPosition = Number(token?.word_position || 0);
    const retokenized = runtimeState.tokenizer ? runtimeState.tokenizer.tokenize(remainder) : [];
    const reconstructed = retokenized.map(item => String(item?.surface_form || '')).join('');
    const tokens = retokenized.length && reconstructed === remainder
        ? retokenized
        : [makeKanaCommonWordBoundaryFragment(token, remainder, characterOffset)];
    let consumed = 0;
    return tokens.map((item, index) => {
        const surfaceForm = String(item?.surface_form || '');
        const adjusted = {
            ...item,
            word_position: originalPosition > 0 ? originalPosition + characterOffset + consumed : Number(item?.word_position || 0),
            kanaCommonWordBoundaryFragment: true
        };
        if (index === 0) {
            adjusted.reviewedLexicalBoundaryBefore = true;
            adjusted.reviewedLexicalBoundaryEvidenceSurface = evidenceSurface;
        }
        consumed += Array.from(surfaceForm).length;
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
        merged.push({
            ...token,
            surface_form: surface,
            basic_form: surface,
            reading,
            pronunciation: reading,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            kanaCommonWordBoundaryHonorific: true
        });
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
        return {
            ...token,
            pos: '記号',
            pos_detail_1: whitespace ? '空白' : '一般',
            pos_detail_2: '*',
            pos_detail_3: '*',
            reading: surface,
            pronunciation: surface,
            canonicalBoundary: true,
            crossNotationSymbol: surface === '×'
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
        crossNotationSymbol: surface === '×'
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

const grammarTransparentBoundaryCharacters = new Set([
    '「','」','『','』','（','）','(',')','［','］','[',']','【','】','〈','〉','《','》','〔','〕','〖','〗','〘','〙','〚','〛',
    '“','”','‘','’','"',"'",'«','»','‹','›','\n','\r','\t','\u2028','\u2029','\u3000'
]);

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
            if (!sourceWhitespace && !grammarTransparentBoundaryCharacters.has(character)) return false;
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

function isStrongKanaGrammarToken(tokens, absoluteIndex, runStart, runEnd, lexicalSpan) {
    const token = tokens[absoluteIndex];
    if (!token || (!isParticle(token) && !isNominalizer(token))) return false;

    const runTokens = tokens.slice(runStart, runEnd + 1);
    const runIndex = absoluteIndex - runStart;
    if (lexicalSpan?.strong && lexicalKanaEvidenceCoversToken(runTokens, runIndex, lexicalSpan)) return false;

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
    const last = members[members.length - 1];
    return {
        ...lexical,
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        word_position: first.word_position,
        sourceStart: first.sourceStart,
        sourceEnd: last.sourceEnd,
        sourceSurface: surface,
        sourceSpanReconciled: true,
        sourceSpanReconciliationReason: 'kuromoji-kana-boundary-neutralised',
        sourceSpanGrammarBoundary: false,
        sourceSpanGrammarBoundaryBefore: Boolean(first.sourceSpanGrammarBoundaryBefore),
        tokenizationRoleBoundaryBefore: Boolean(first.tokenizationRoleBoundaryBefore),
        reviewedLexicalBoundaryBefore: Boolean(first.reviewedLexicalBoundaryBefore)
    };
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

function reconcileKanaSourceTokenBoundaries(tokens, sourceText) {
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
            if (!isStrongKanaGrammarToken(working, index, runStart, runEnd, lexicalSpan)) continue;
            working[index].sourceSpanGrammarBoundary = true;
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
        merged.push({
            ...tokens[index],
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
        });
        index += bestMatch.length - 1;
    }
    return merged;
}

function mergeKanaBoundaryPair(left, right) {
    const surface = String(left?.surface_form || '') + String(right?.surface_form || '');
    return {
        ...left,
        surface_form: surface,
        reading: surface,
        pronunciation: surface,
        pos: '名詞',
        pos_detail_1: '一般',
        pos_detail_2: '*',
        pos_detail_3: '*',
        orthographicKanaBoundaryRepaired: true
    };
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
    return Boolean(surface) && /^[\p{Script=Latin}\p{Number}'’/@&#% +_.:;!?=~|-]+$/u.test(surface);
}

function containsLatinOrNumber(value) {
    return /[\p{Script=Latin}\p{Number}]/u.test(String(value || ''));
}

function mergeLatinPassthroughTokens(tokens) {
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
            span += nextSurface;
            if (containsLatinOrNumber(nextSurface)) hasContent = true;
            end += 1;
        }
        if (!hasContent) { merged.push(token); continue; }
        merged.push({
            ...token,
            surface_form: span,
            latinPassthroughMatched: true,
            latinPassthroughOutput: span,
            pos: '名詞',
            pos_detail_1: '一般',
            pos_detail_2: '*',
            pos_detail_3: '*'
        });
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
        merged.push({
            ...tokens[index],
            surface_form: surface,
            reading: honorificReading || surface,
            pronunciation: honorificReading || surface,
            pos: '名詞',
            pos_detail_1: '接尾',
            pos_detail_2: '人名',
            pos_detail_3: '*',
            reviewedNameHonorificMatched: true,
            reviewedNameHonorificReading: honorificReading || surface
        });
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

function markUnreviewedNameContextTokens(tokens) {
    const marked = (tokens || []).map(token => ({ ...token }));
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

    // A proper-name token followed directly by a common name-forming generic can
    // create a presentation boundary that Kuromoji alone cannot authorise. Exact
    // whole-name evidence settles the structure; otherwise retain the current
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
        const first = tokens[start];
        const slice = tokens.slice(start, end + 1);
        return {
            ...first,
            surface_form: slice.map(token => String(token?.surface_form || '')).join(''),
            reading: slice.map(token => String(token?.reading || token?.surface_form || '')).join(''),
            pronunciation: slice.map(token => String(token?.pronunciation || token?.reading || token?.surface_form || '')).join(''),
            pos: '動詞',
            pos_detail_1: '自立',
            pos_detail_2: '*',
            desiderativeGaruMatched: true
        };
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
            output.push({ ...joinRange(index, index + 3), desiderativeGaruRecoveredFromSurface: true });
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

function mergeCasualSpeechTokens(tokens) {
    const merged = [];
    const joinToken = (left, right) => ({
        ...left,
        surface_form: String(left.surface_form || '') + String(right.surface_form || ''),
        reading: String(left.reading || left.surface_form || '') + String(right.reading || right.surface_form || ''),
        pronunciation: String(left.pronunciation || left.reading || left.surface_form || '') + String(right.pronunciation || right.reading || right.surface_form || '')
    });
    for (let index = 0; index < tokens.length; index += 1) {
        const token = tokens[index];
        const previous = merged[merged.length - 1];
        const next = tokens[index + 1];
        const nextNext = tokens[index + 2];
        const verbLikePrevious = previous && (previous.pos === '動詞' || previous.pos === '形容詞' || previous.pos === '助動詞' || previous.pos_detail_1 === '動詞' || previous.pos_detail_1 === '形容詞');
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

function findLongestGrammaticalExpression(tokens, startIndex) {
    let bestMatch = null;
    let candidateSurface = '';
    for (let end = startIndex; end < tokens.length; end += 1) {
        const token = tokens[end];
        if (crossesReviewedLexicalBoundary(tokens, startIndex, end)) break;
        if (!token || token.pos === '記号') break;
        candidateSurface += token.surface_form;
        if (!runtimeState.grammaticalExpressionPrefixes.has(candidateSurface)) break;
        const value = runtimeState.grammaticalExpressionDictionary.get(candidateSurface);
        if (value) bestMatch = { surface: candidateSurface, value, length: end - startIndex + 1 };
    }
    return bestMatch;
}

function mergeRecognizedGrammaticalExpressions(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestGrammaticalExpression(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, reading: bestMatch.surface, pronunciation: bestMatch.surface, pos: '助詞', pos_detail_1: '接続助詞', pos_detail_2: '*', fullGrammaticalExpression: true, value: bestMatch.value });
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
        merged.push({
            ...tokens[index],
            surface_form: bestMatch.surface,
            contextualOverrideMatched: true,
            contextualRomaji: bestMatch.romaji,
            ...(bestMatch.length > 1 ? { pos: '名詞', pos_detail_1: '一般', pos_detail_2: '*' } : {})
        });
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
        merged.push({ ...tokens[index], surface_form: bestMatch.surface, knownPhraseMatched: true, knownPhraseValue: bestMatch.value, knownPhraseSource: bestMatch.source });
        index += bestMatch.length - 1;
    }
    return merged;
}

