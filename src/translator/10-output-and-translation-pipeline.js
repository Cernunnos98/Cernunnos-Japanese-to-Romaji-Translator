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

function findLongestAuthoritativeSpan(tokens, startIndex) {
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
        const categoryAllowsDirectAuthority = ['counter-date', 'ateji', 'loanword', 'reviewed-reading'].includes(category);
        const candidateTokens = tokens.slice(startIndex, end + 1);
        const generalWordRescue = category === 'general-word'
            && tokensNeedAuthoritativeRescue(candidateTokens, candidateSurface);
        const unconditionalSpanAuthority = category !== 'general-word' && spansMultipleTokens;
        const variantNormalizedAuthority = changedForLookup && category !== 'general-word';
        // General-word evidence is rescue-only; reviewed non-general evidence may also authorise spans or variant-normalised single tokens.
        if (lookup && !suppressCountryNameAuthority && (categoryAllowsDirectAuthority || generalWordRescue || unconditionalSpanAuthority || variantNormalizedAuthority)) {
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

function mergeAuthoritativeSpanTokens(tokens) {
    const merged = [];
    for (let index = 0; index < tokens.length; index += 1) {
        const bestMatch = findLongestAuthoritativeSpan(tokens, index);
        if (!bestMatch) { merged.push(tokens[index]); continue; }
        const evidence = bestMatch.evidence;
        const reviewedName = evidence.category === 'reviewed-name';
        const numericExpression = evidence.category === 'counter-date'
            && /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u.test(bestMatch.surface);
        merged.push({
            ...tokens[index],
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
            authoritativeSpanVariantMappings: bestMatch.variant?.mappings || [],
            numericExpression
        });
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

function needsSourceSpellingReview(token) {
    const surface = String(token?.surface_form || '');
    if (!/^[ァ-ヶー]+$/u.test(surface) || isParticle(token) || isGrammaticalToken(token)) return false;
    if (isProperNounToken(token)) return true;
    return token?.pos === '名詞' && surface.includes('ー');
}

const REVIEW_SIGNAL_POLICY = Object.freeze({
    'exact-dictionary-rescue': { category: 'evidence', requiresReview: false, rationale: 'Reviewed dictionary rescue.' },
    'fallback-reading': { category: 'evidence', requiresReview: false, rationale: 'Lower-confidence but permitted fallback evidence.' },
    'historical-kana-attested': { category: 'historical-orthography', requiresReview: false, rationale: 'Attested historical-kana evidence.' },
    'source-span-kana-evidence': { category: 'tokenisation', requiresReview: false, rationale: 'Kana lexical evidence was selected independently of Kuromoji boundaries.' },
    'orthographic-pronunciation': { category: 'orthography', requiresReview: false, rationale: 'Safe orthographic pronunciation evidence.' },
    'rendaku-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested Rendaku evidence.' },
    'rendaku-blocked-attested': { category: 'rendaku', requiresReview: false, rationale: 'Attested non-Rendaku evidence.' },
    'variant-reading-evidence': { category: 'orthography', requiresReview: false, rationale: 'Reviewed character-variant evidence.' },
    'reviewed-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'A reviewed preferred reading was selected while legitimate alternatives remain.' },
    'reviewed-numeric-alias': { category: 'orthography', requiresReview: false, rationale: 'A reviewed numeric orthographic alias was resolved through canonical numeric context.' },
    'proper-noun-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible proper-name readings remain.' },
    'general-word-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Multiple plausible general-word readings remain.' },
    'general-word-alternative': { category: 'ambiguity', requiresReview: true, rationale: 'Alternative general-word readings are materially plausible.' },
    'general-word-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'General-word evidence conflicts with the selected reading.' },
    'whole-word-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Whole-word evidence does not resolve one reading.' },
    'contextual-reading-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'Structured sentence context does not distinguish the supported readings strongly enough.' },
    'sentence-context-ambiguous': { category: 'ambiguity', requiresReview: true, rationale: 'The final sentence-level verification pass still cannot distinguish the supported readings safely.' },
    'reading-evidence-conflict': { category: 'evidence-conflict', requiresReview: true, rationale: 'Independent reading evidence conflicts with the selected reading.' },
    'missing-source-spelling-evidence': { category: 'source-spelling', requiresReview: true, rationale: 'Source-language spelling is required but not established.' },
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
    return {
        surface: String(surface || ''),
        flag: String(flag || ''),
        source: String(source || 'unresolved'),
        confidence: Number(confidence ?? 0),
        category: policy.category,
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

function getResolutionReviewSignals(resolution, surface) {
    const source = resolution?.source || 'unresolved';
    const confidence = Number(resolution?.confidence ?? 0);
    const flags = [...new Set(Array.isArray(resolution?.flags) ? resolution.flags : [])];
    const existing = Array.isArray(resolution?.reviewSignals) ? resolution.reviewSignals.map(signal => ({ ...signal, lifecycle: [...(signal.lifecycle || [])] })) : [];
    const represented = new Set(existing.map(signal => signal.flag));
    for (const signal of makeReviewSignals(surface, source, confidence, flags.filter(flag => !represented.has(flag)))) existing.push(signal);
    return existing;
}

function isReviewContextBoundaryToken(token) {
    const surface = String(token?.surface_form || '');
    if (!surface) return false;
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

function shouldSupersedeWeakLexicalSignal(signal, resolution, tokenResults, tokenIndex, tokenSignals) {
    if (!WEAK_LEXICAL_REVIEW_FLAGS.has(signal?.flag)) return false;
    if (!resolution?.reading || resolution?.ambiguous || Number(resolution?.confidence || 0) < 0.75) return false;
    if (!isContextSelectedLexicalResolution(resolution) || !hasIndependentSentenceContext(tokenResults, tokenIndex)) return false;
    if (hasUnresolvedNominalCompoundAdjacency(tokenResults, tokenIndex)) return false;
    const strongerActiveSignal = (tokenSignals || []).some(other =>
        other !== signal
        && Boolean(other?.policyRequiresReview ?? getReviewSignalPolicy(other?.flag).requiresReview)
        && !WEAK_LEXICAL_REVIEW_FLAGS.has(other?.flag)
    );
    return !strongerActiveSignal;
}

function finalizeTokenReviewSignals(tokenResults, tokenIndex) {
    const token = tokenResults?.[tokenIndex];
    const resolution = token?.readingResolution;
    const surface = String(token?.surface_form || resolution?.surface || '');
    const tokenSignals = getResolutionReviewSignals(resolution, surface);
    return tokenSignals.map(original => {
        const policyRequiresReview = Boolean(original?.policyRequiresReview ?? getReviewSignalPolicy(original?.flag).requiresReview);
        if (!policyRequiresReview) return transitionReviewSignal(original, 'resolved');
        if (original?.state === 'superseded') return transitionReviewSignal(original, 'superseded');
        if (original?.state === 'resolved') return transitionReviewSignal(original, 'resolved');
        const active = transitionReviewSignal(original, 'active');
        if (shouldSupersedeWeakLexicalSignal(active, resolution, tokenResults, tokenIndex, tokenSignals)) {
            return transitionReviewSignal(active, 'superseded', {
                resolutionReason: 'Context-selected lexical reading supersedes raw alternative-list uncertainty.',
                supersededBy: String(resolution?.source || 'context-selected-reading')
            });
        }
        return transitionReviewSignal(active, 'final-active');
    });
}

function makeFinalReviewSignal(surface, flag, source, confidence = 1) {
    const signal = makeReviewSignal(surface, flag, source, confidence);
    return signal.policyRequiresReview ? transitionReviewSignal(transitionReviewSignal(signal, 'active'), 'final-active') : signal;
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
    if (token.typedNumericExpressionMatched && token.typedNumericReading) return makeReadingResolution(token, { reading: token.typedNumericReading, source: token.typedNumericSource || 'typed-numeric-expression', confidence: 0.99 });
    if (token.authoritativeSpanMatched) return makeReadingResolution(token, {
        reading: token.authoritativeSpanReading || token.reading,
        romaji: token.authoritativeSpanRomaji || null,
        source: token.authoritativeSpanSource || 'authoritative-span-evidence',
        confidence: token.authoritativeSpanConfidence || 0.98,
        flags: [
            ...((token.authoritativeSpanVariantMappings || []).length ? ['variant-reading-evidence'] : []),
            ...(token.authoritativeSpanReviewRequired ? ['reviewed-reading-ambiguous'] : [])
        ],
        variantMappings: token.authoritativeSpanVariantMappings || []
    });
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
    const particleReading = getParticleReading(token);
    if (particleReading) return makeReadingResolution(token, { reading: particleReading, source: 'particle-pronunciation', confidence: 1 });
    if (token.loanwordMatched && token.loanwordOutput) return makeReadingResolution(token, { romaji: token.loanwordOutput, source: 'loanword-lexicon', confidence: 1 });
    const loanwordOutput = getLoanwordOutputForToken(token);
    if (loanwordOutput) return makeReadingResolution(token, { romaji: loanwordOutput, source: 'loanword-lexicon', confidence: 1 });
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
        const orthographicPronunciation = getKanaOrthographicPronunciation(token);
        if (orthographicPronunciation) return makeReadingResolution(token, { reading: orthographicPronunciation, source: 'kuromoji-orthographic-pronunciation', confidence: sourceSpellingFlags.length ? 0.65 : 1, flags: ['orthographic-pronunciation', ...sourceSpellingFlags] });
        return makeReadingResolution(token, { reading: token.surface_form, source: 'written-kana', confidence: sourceSpellingFlags.length ? 0.65 : 1, flags: sourceSpellingFlags });
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
        flags: ['fallback-reading', ...(token.generalWordAmbiguous ? ['general-word-ambiguous'] : []), ...((token.generalWordVariantMappings || []).length ? ['variant-reading-evidence'] : [])],
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
        if (needsSourceSpellingReview(token)) flags.push('missing-source-spelling-evidence');
        let confidence = properNounResolution?.ambiguous ? 0.78 : 0.92;
        if (token.contextualReadingEvidenceAmbiguous) confidence = Math.min(confidence, 0.72);
        let source = 'kuromoji-context';
        if (evidenceAssessment) { flags.push('reading-evidence-conflict'); confidence = Math.min(confidence, 0.68); }
        if (properNounResolution?.ambiguous) flags.push('proper-noun-ambiguous');
        if (generalAssessment?.matched) {
            source = 'kuromoji+general-word';
            confidence = generalAssessment.matchedIndex === 0 ? 0.97 : 0.90;
            if (generalAssessment.candidates.length > 1) flags.push('general-word-alternative');
        } else if (generalAssessment?.strongPreference) {
            flags.push('general-word-conflict');
            confidence = Math.min(confidence, 0.68);
        }
        if (kuromojiAmbiguity) {
            flags.push('whole-word-reading-ambiguous');
            confidence = Math.min(confidence, 0.78);
        }
        const candidates = token.contextualReadingEvidenceCandidates?.length ? token.contextualReadingEvidenceCandidates
            : properNounResolution?.candidates?.length ? properNounResolution.candidates
            : nameContextCandidates.length ? nameContextCandidates
            : kuromojiAmbiguity?.candidates?.length ? kuromojiAmbiguity.candidates
            : generalAssessment?.candidates?.length ? generalAssessment.candidates : getReadingEvidenceCandidates(token);
        return makeReadingResolution(token, { reading: kuromojiReading, source, confidence, candidates, flags, variantMappings: generalAssessment?.variantMappings || [] });
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
        const provisional = provisionalResolutions[index] || makeReadingResolution(token);
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

function classifyTokenStructuralBoundary(previousToken, token) {
    if (!previousToken) return 'none';
    if (token.titleSeparator) return 'space';
    if (previousToken.crossNotationSymbol && !previousToken.titleSeparator) return 'tight';
    if (shouldJoinReviewedTitleCompactNumericSuffix(previousToken, token)) return 'join';
    if (token.readingResolution?.source === 'latin-source-passthrough') return 'space';
    if (token.nameContinuation) return token.nameGivenStart ? 'space' : 'join';
    if (previousToken.pos === '形容詞' && token.surface_form === 'な') return 'space';
    if (shouldSeparateClockTimeComponents(previousToken, token)) return 'space';
    if (shouldSeparateNumericTokens(previousToken, token)) return 'space';
    if (shouldJoinNumericTokens(previousToken, token)) return 'join';
    if (token.joinLeftAfterSokuon || token.morphologicalJoinLeft) return 'join';
    if (token.fullGrammaticalExpression) return needsSpaceBeforeGrammaticalExpression(previousToken) ? 'space' : 'join';
    if (token.particle || token.nominalizer || token.prefix) return 'space';
    if (token.suffix) return shouldSpaceSuffix(token) ? 'space' : 'join';
    if (previousToken.prefix) return 'join';
    if (token.grammatical) return token.startsSeparateAuxiliaryUnit ? 'space' : 'join';
    return 'space';
}

/** @param {CJ2RToken|null|undefined} previousToken @param {CJ2RToken} token */
function classifyTokenOutputBoundary(previousToken, token) {
    const structuralBoundary = classifyTokenStructuralBoundary(previousToken, token);
    if (structuralBoundary === 'join' && needsCrossTokenApostrophe(previousToken, token)) return 'apostrophe';
    return structuralBoundary;
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
    if (token.suffix || previousToken?.prefix) return token.value.toLowerCase();
    if (token.grammatical) return runtimeState.capitalizedAuxiliarySurfaces.has(token.surface_form)
        ? capitalizeRomaji(token.value)
        : token.value.toLowerCase();
    return capitalizeRomaji(token.value);
}

function appendTokenOutput(joined, previousToken, token) {
    const boundary = classifyTokenOutputBoundary(previousToken, token);
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
        boundaries.push({ left, right, surface: `${left.surface_form}${right.surface_form}` });
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
        spans.push({ left, right, surface: `${left.surface_form}${right.surface_form}` });
    }
    return spans;
}

function buildTranslationDiagnostics(sourceText, normalizedSourceText, output, tokenResults, options = {}) {
    const readings = tokenResults.map((token, index) => {
        const resolution = token.readingResolution;
        const unresolvedOrthographicSymbol = resolution?.source === 'japanese-orthography-unresolved';
        if (token.pos === '記号' && !/[\p{L}\p{N}]/u.test(String(token.surface_form || '')) && !unresolvedOrthographicSymbol) return null;
        if (!resolution) return null;
        const reviewSignals = finalizeTokenReviewSignals(tokenResults, index);
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
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            variantMappings: [...(resolution.variantMappings || [])],
            hanScope: resolution.hanScope || null,
            scopeEvidence: [...(resolution.scopeEvidence || [])]
        };
    }).filter(Boolean);
    const redFlags = readings.flatMap(item => item.reviewSignals || []);
    const addSignal = (surface, flag, source, confidence = 1) => redFlags.push(makeFinalReviewSignal(surface, flag, source, confidence));
    for (const token of tokenResults) {
        const collision = token?.typedTemporalSpanLexicalCollision;
        if (!collision) continue;
        addSignal(`${collision.headSurface}${collision.lexicalSurface}`, 'tokenisation-boundary-ambiguous', 'typed-temporal-boundary', 0.85);
    }
    for (const token of tokenResults) {
        if (!token?.crossNotationSymbol || token.titleReadingEvidenceKind) continue;
        addSignal(token.surface_form, 'unreviewed-cross-notation', 'mixed-script-symbol', 0.60);
    }
    for (const flag of options.outputGuardFlags || []) addSignal('[output]', flag, 'final-output-guard');
    for (const boundary of findUnreviewedContiguousKatakanaBoundaries(tokenResults, normalizedSourceText)) {
        addSignal(boundary.surface, 'kana-tokenisation-boundary-unreviewed', 'kuromoji-katakana-boundary', 0.7);
    }
    for (const span of findPartiallyReviewedContiguousKatakanaSpans(tokenResults, normalizedSourceText)) {
        addSignal(span.surface, 'missing-source-spelling-evidence', 'partial-source-language-loanword', 0.7);
    }
    const diagnosticSegments = splitCanonicalHardBoundarySegments(normalizedSourceText);
    if (diagnosticSegments.some(hasTerminalSokuonReviewCondition)) addSignal('っ', 'terminal-sokuon-review', 'sokuon-safety');
    if (diagnosticSegments.some(hasRepeatedSokuonReviewCondition)) addSignal('っっ', 'repeated-sokuon-review', 'sokuon-safety');
    if (diagnosticSegments.some(hasNonGeminativeSokuonReviewCondition)) addSignal('っ', 'non-geminative-sokuon-review', 'sokuon-safety');
    if (options.historicalKana && hasHistoricalFullSizeSokuonAmbiguity(normalizedSourceText, tokenResults)) addSignal('つ', 'historical-full-size-sokuon-ambiguity', 'historical-orthography-safety');
    for (const segment of diagnosticSegments) {
        if (!isJapaneseNumeralSurface(segment)) continue;
        if (!tokenResults.some(token => isProperNounToken(token) && String(token.surface_form || '') === segment)) continue;
        addSignal(segment, 'numeric-literal-lexical-ambiguity', 'numeric-safety');
    }
    const sourceCounts = readings.reduce((counts, item) => { counts[item.source] = (counts[item.source] || 0) + 1; return counts; }, {});
    return attachTranslationAuditStatistics({
        sourceText, normalizedSourceText, output, readings, sourceCounts, redFlags,
        requiresReview: redFlags.some(item => item.state === 'final-active' && item.requiresReview)
    });
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
                    redFlags: flags.map(flag => ({ surface: sourceText, flag, source: 'exact-override', confidence: outputGuardTriggered ? 0.2 : 1 })),
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
    const tokenized = preserveSourceSpans(splitStructuredNumericUnitTokens(stabilizeHardBoundaryTokenization(wholeSentenceTokens, text)));
    if (!tokenized.length) {
        const finalOutput = blockUnresolvedHanFromRomaji(text);
        if (runtimeState.captureTranslationDiagnostics) {
            const outputGuardFlags = finalOutput !== text ? getOutputGuardFlags(text) : [];
            const flags = finalOutput !== text ? ['unresolved-reading', 'unsupported-script', ...outputGuardFlags] : ['fallback-reading'];
            publishTranslationDiagnostics({
                sourceText, normalizedSourceText: text, output: finalOutput,
                readings: [{ surface: text, value: finalOutput, source: finalOutput !== text ? 'unresolved-script' : 'surface-fallback', confidence: finalOutput !== text ? 0.2 : 0.55, reading: text, candidates: [], flags }],
                sourceCounts: { [finalOutput !== text ? 'unresolved-script' : 'surface-fallback']: 1 },
                redFlags: flags.map(flag => ({ surface: text, flag, source: finalOutput !== text ? 'unresolved-script' : 'surface-fallback', confidence: finalOutput !== text ? 0.2 : 0.55 })),
                requiresReview: finalOutput !== text
            });
        }
        return finalOutput;
    }
    const sourceReconciledTokens = preserveSourceSpans(reconcileKanaSourceTokenBoundaries(tokenized, text));
    const temporalBoundaryTokens = preserveSourceSpans(repairTypedTemporalExpressionBoundaries(sourceReconciledTokens));
    const temporalSpanTokens = preserveSourceSpans(mergeTypedTemporalSpanTokens(temporalBoundaryTokens));
    const oneDayRoleTokens = preserveSourceSpans(markTypedOneDayDurationTokens(temporalSpanTokens));
    const typedClockHourTokens = preserveSourceSpans(mergeTypedClockHourTokens(oneDayRoleTokens));
    const typedNumericTokens = preserveSourceSpans(mergeTypedMinuteCounterTokens(typedClockHourTokens));
    const roleRepairedTokens = preserveSourceSpans(repairCaseMarkedCounterFollowerTokens(typedNumericTokens));
    const desiderativeTokens = preserveSourceSpans(mergeDesiderativeGaruTokens(roleRepairedTokens));
    const reviewedInflectionTokens = preserveSourceSpans(mergeReviewedCommonWordInflectionTokens(desiderativeTokens));
    const kanaCommonWordBoundaryTokens = preserveSourceSpans(splitReviewedKanaCommonWordBoundaryTokens(reviewedInflectionTokens, text));
    const kanaLexicalTokens = preserveSourceSpans(mergeKanaLexicalReadingTokens(kanaCommonWordBoundaryTokens));
    const kanaHonorificTokens = preserveSourceSpans(mergeKanaCommonWordBoundaryHonorificTokens(kanaLexicalTokens));
    const kanaBoundaryTokens = preserveSourceSpans(mergeOrthographicKanaBoundaryTokens(kanaHonorificTokens));
    const latinProtectedTokens = preserveSourceSpans(mergeLatinPassthroughTokens(kanaBoundaryTokens));
    const historicalTokens = preserveSourceSpans(options.historicalKana ? mergeHistoricalKanaEvidenceTokens(latinProtectedTokens) : latinProtectedTokens);
    const exactDictionaryTokens = preserveSourceSpans(mergeExactDictionaryRescueTokens(historicalTokens, text));
    const reviewedProperNameTokens = preserveSourceSpans(mergeReviewedProperNameSpanTokens(exactDictionaryTokens));
    const reviewedNameSuffixTokens = preserveSourceSpans(mergeReviewedNameHonorificTokens(reviewedProperNameTokens));
    const nameContextTokens = preserveSourceSpans(markUnreviewedNameContextTokens(reviewedNameSuffixTokens));
    const authoritativeTokens = preserveSourceSpans(mergeAuthoritativeSpanTokens(nameContextTokens));
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
    const contextTokens = preserveSourceSpans(annotateContextualReadingEvidence(ordinaryCompoundTokens));
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
            startsSeparateAuxiliaryUnit: startsSeparateAuxiliaryUnit(token), numericExpression: Boolean(token.numericExpression),
            typedNumericExpressionType: token.typedNumericExpressionType || null,
            typedTemporalSpanLexicalCollision: token.typedTemporalSpanLexicalCollision || null,
            titleSeparator: Boolean(token.titleReadingEvidenceMatched && ['title-separator', 'title-separator-silent'].includes(token.titleReadingEvidenceKind)),
            crossNotationSymbol: Boolean(token.crossNotationSymbol),
            titleReadingEvidenceKind: token.titleReadingEvidenceKind || null,
            sourceStart: Number.isInteger(token.sourceStart) ? token.sourceStart : null,
            sourceEnd: Number.isInteger(token.sourceEnd) ? token.sourceEnd : null,
            sourceSurface: token.sourceSurface || token.surface_form || null,
            sourceSpanReconciled: Boolean(token.sourceSpanReconciled),
            sourceSpanReconciliationReason: token.sourceSpanReconciliationReason || null,
            reviewedLexicalBoundaryBefore: Boolean(token.reviewedLexicalBoundaryBefore), tokenizationRoleBoundaryBefore: Boolean(token.tokenizationRoleBoundaryBefore),
            personNameStart, nameContinuation, nameGivenStart
        };
    });

    const result = tokenResults.reduce((joined, token, index) => {
        if (token.pos === '記号' && token.pos_detail_1 === '空白' && /^\s+$/u.test(String(token.surface_form || ''))) return joined;
        const previousToken = tokenResults[index - 1];
        if (token.pos === '記号' && !token.titleSeparator && !containsHan(token.surface_form)) return joined + token.value;
        return appendTokenOutput(joined, previousToken, token);
    }, '');

    const preGuardOutput = normalizeRule0OutputPunctuation(result, sourceText);
    const finalOutput = blockUnresolvedHanFromRomaji(preGuardOutput);
    const outputGuardFlags = finalOutput !== preGuardOutput ? getOutputGuardFlags(preGuardOutput) : [];
    if (runtimeState.captureTranslationDiagnostics) publishTranslationDiagnostics(buildTranslationDiagnostics(sourceText, text, finalOutput, tokenResults, { outputGuardFlags, historicalKana: Boolean(options.historicalKana) }));
    return finalOutput;
}

