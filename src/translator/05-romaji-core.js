// Source section: Kana-to-Romaji conversion and core orthographic mechanics.

function isTrailingRule0PunctuationCharacter(character) {
    if (!character) return false;
    const compatible = normalizeJapanesePunctuationCompatibility(character);
    if (!compatible) return false;
    const characters = Array.from(compatible);
    if (characters.length !== 1) return characters.every(isTrailingRule0PunctuationCharacter);
    return isCanonicalHardBoundaryAt(compatible, 0);
}

function splitTrailingPunctuation(text) {
    const source = String(text || '');
    const characters = Array.from(source);
    let end = characters.length;
    while (end > 0 && isTrailingRule0PunctuationCharacter(characters[end - 1])) end -= 1;
    if (end === characters.length) return { coreText: source, trailingText: '' };
    return { coreText: characters.slice(0, end).join(''), trailingText: characters.slice(end).join('') };
}



function capitalizeRomaji(value) {
    if (!value) return value;
    return String(value).replace(/^([^a-zA-Z]*)([a-zA-Z])/, (_, prefix, character) => prefix + character.toUpperCase());
}



function stripIdeographicVariationSelectors(value) {
    return String(value || '').replace(/(\p{Script=Han})[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]+/gu, '$1');
}

function isIdeographicVariationSelectorSequence(value) {
    return /^[\uFE00-\uFE0F\u{E0100}-\u{E01EF}]+$/u.test(String(value || ''));
}

function isHanCharacter(value) {
    return /^\p{Script=Han}$/u.test(String(value || ''));
}

function containsHan(value) {
    return /\p{Script=Han}/u.test(String(value || ''));
}

function normalizeCompatibilityIdeograph(character) {
    const value = String(character || '');
    const normalized = value.normalize('NFKC');
    return Array.from(normalized).length === 1 && isHanCharacter(normalized) ? normalized : value;
}

function normalizeKanjiForLookupDetailed(value, options = {}) {
    const original = String(value || '');
    const allowNameVariants = Boolean(options.names);
    const withoutSelectors = stripIdeographicVariationSelectors(original);
    const mappings = [];
    let normalizedSurface = '';

    if (withoutSelectors !== original) {
        mappings.push({ from: original, to: withoutSelectors, type: 'variation-selector' });
    }

    for (const character of Array.from(withoutSelectors)) {
        let normalized = normalizeCompatibilityIdeograph(character);
        if (normalized !== character) mappings.push({ from: character, to: normalized, type: 'compatibility' });

        const generalVariant = runtimeState.generalKanjiVariantDictionary.get(normalized)
            || runtimeState.generalKanjiVariantDictionary.get(character);
        if (generalVariant && generalVariant !== normalized) {
            mappings.push({ from: character, to: generalVariant, type: 'general' });
            normalized = generalVariant;
        }

        if (allowNameVariants) {
            const nameVariant = runtimeState.nameKanjiVariantDictionary.get(normalized)
                || runtimeState.nameKanjiVariantDictionary.get(character);
            if (nameVariant && nameVariant !== normalized) {
                mappings.push({ from: character, to: nameVariant, type: 'name' });
                normalized = nameVariant;
            }
        }
        normalizedSurface += normalized;
    }

    return {
        surface: original,
        normalizedSurface,
        changed: normalizedSurface !== original || withoutSelectors !== original,
        mappings
    };
}

function normalizeKanjiForLookup(value, options = {}) {
    return normalizeKanjiForLookupDetailed(value, options).normalizedSurface;
}

const kanaToRomajiMap = {
    'あ':'a','い':'i','う':'u','え':'e','お':'o','か':'ka','き':'ki','く':'ku','け':'ke','こ':'ko',
    'さ':'sa','し':'shi','す':'su','せ':'se','そ':'so','た':'ta','ち':'chi','つ':'tsu','て':'te','と':'to',
    'な':'na','に':'ni','ぬ':'nu','ね':'ne','の':'no','は':'ha','ひ':'hi','ふ':'fu','へ':'he','ほ':'ho',
    'ま':'ma','み':'mi','む':'mu','め':'me','も':'mo','や':'ya','ゆ':'yu','よ':'yo',
    'ら':'ra','り':'ri','る':'ru','れ':'re','ろ':'ro','わ':'wa','を':'wo','ん':'n',
    'が':'ga','ぎ':'gi','ぐ':'gu','げ':'ge','ご':'go','ざ':'za','じ':'ji','ず':'zu','ぜ':'ze','ぞ':'zo',
    'だ':'da','ぢ':'ji','づ':'zu','で':'de','ど':'do','ば':'ba','び':'bi','ぶ':'bu','べ':'be','ぼ':'bo','ゔ':'vu',
    'ぱ':'pa','ぴ':'pi','ぷ':'pu','ぺ':'pe','ぽ':'po',
    'ぁ':'a','ぃ':'i','ぅ':'u','ぇ':'e','ぉ':'o','ゃ':'ya','ゅ':'yu','ょ':'yo','ゎ':'wa',
    'ゕ':'ka','ゖ':'ke','ゐ':'i','ゑ':'e','ゟ':'yori'
};

function normalizeKanaReading(value) {
    const specialKatakana = Object.freeze({
        'ヷ': 'ゔぁ', 'ヸ': 'ゔぃ', 'ヹ': 'ゔぇ', 'ヺ': 'ゔぉ', 'ヿ': 'こと'
    });
    return Array.from(String(value || '')).map(char => {
        if (specialKatakana[char]) return specialKatakana[char];
        return /[\u30a1-\u30f6]/u.test(char) ? String.fromCharCode(char.charCodeAt(0) - 0x60) : char;
    }).join('');
}

const obsoleteWRowModernKanaMap = Object.freeze({
    'ゐ': 'い',
    'ヰ': 'イ',
    'ゑ': 'え',
    'ヱ': 'エ'
});

function normalizeObsoleteWRowKanaForModernReading(value) {
    return Array.from(String(value || '')).map(character => obsoleteWRowModernKanaMap[character] || character).join('');
}

const japanesePunctuationCompatibilityPattern = /[\uFE10-\uFE19\uFE30-\uFE48\uFE50-\uFE6B]/gu;
const japaneseOrthographicNonBoundaryCharacters = new Set(['々','ゝ','ゞ','ヽ','ヾ','ー','〃','〆','〇']);
const unresolvedJapaneseOrthographicCharacters = new Set(['ゝ','ゞ','ヽ','ヾ','〃','〆','〓','〾','゛','゜','\u3099','\u309A']);

const historicalJapaneseSmallKanaExtensionCharacters = new Set([
    '𛄲', '𛅐', '𛅑', '𛅒',
    '𛅕', '𛅤', '𛅥', '𛅦', '𛅧'
]);

function isHistoricalJapaneseKanaExtensionCharacter(character) {
    const value = String(character || '');
    if (!value) return false;
    const codePoint = value.codePointAt(0);
    if (typeof codePoint !== 'number' || !Number.isInteger(codePoint)) return false;
    const inHistoricalJapaneseKanaBlock = (codePoint >= 0x1B000 && codePoint <= 0x1B0FF)
        || (codePoint >= 0x1B100 && codePoint <= 0x1B12F)
        || historicalJapaneseSmallKanaExtensionCharacters.has(value);
    return inHistoricalJapaneseKanaBlock
        && /^(?:\p{Script=Hiragana}|\p{Script=Katakana})$/u.test(value);
}

function normalizeSpacingKanaVoicingMarks(value) {
    return String(value || '').replace(/([ぁ-ゖァ-ヶゝヽ])([゛゜])/gu, (_, base, mark) => {
        const combining = mark === '゛' ? '\u3099' : '\u309A';
        return `${base}${combining}`.normalize('NFC');
    });
}

function isMechanicallyRomanisableKanaSurface(value) {
    const surface = String(value || '');
    return Boolean(surface) && /^[ぁ-ゖゟァ-ヺヿー]+$/u.test(surface);
}

function isJapaneseOrthographicReadingSurface(value) {
    const surface = String(value || '');
    return Boolean(surface) && Array.from(surface).every(character =>
        /^[ぁ-ゖゟァ-ヺヿー]$/u.test(character)
        || /^[\u{E0100}-\u{E01EF}]$/u.test(character)
        || isHistoricalJapaneseKanaExtensionCharacter(character)
        || unresolvedJapaneseOrthographicCharacters.has(character));
}
const canonicalHardBoundarySymbols = new Set(['~','|','+','=','×','⋯','⋮']);
const japaneseCensorshipMarkerCharacters = new Set(['◯','○','●']);
const japaneseConditionalCensorshipMarkerCharacters = new Set(['×']);
const canonicalHardWhitespaceCharacters = new Set(['\n','\r','\t','\u2028','\u2029','\u3000']);

function isJapaneseCensorshipMarkerCharacter(character) {
    return japaneseCensorshipMarkerCharacters.has(String(character || ''));
}

function isJapaneseCensorshipMarkerSurface(value) {
    const characters = Array.from(String(value || ''));
    if (!characters.length) return false;
    if (characters.every(isJapaneseCensorshipMarkerCharacter)) return true;
    return characters.length >= 2
        && japaneseConditionalCensorshipMarkerCharacters.has(characters[0])
        && characters.every(character => character === characters[0]);
}

function isJapaneseCensorshipMarkerContextCharacter(character) {
    const value = String(character || '');
    return isJapaneseCensorshipMarkerCharacter(value)
        || japaneseConditionalCensorshipMarkerCharacters.has(value)
        || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶヵー]$/u.test(value);
}

function getRepeatedCensorshipMarkerRun(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    if (!japaneseConditionalCensorshipMarkerCharacters.has(character)) return null;
    let start = index;
    let end = index + 1;
    while (start > 0 && source[start - 1] === character) start -= 1;
    while (end < source.length && source[end] === character) end += 1;
    if (end - start < 2) return null;
    return { start, end, character };
}

function isJapaneseCensorshipMarkerAt(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    if (isJapaneseCensorshipMarkerCharacter(character)) {
        return isJapaneseCensorshipMarkerContextCharacter(source[index - 1] || '')
            || isJapaneseCensorshipMarkerContextCharacter(source[index + 1] || '');
    }
    const repeatedRun = getRepeatedCensorshipMarkerRun(source, index);
    if (!repeatedRun) return false;
    const previous = source[repeatedRun.start - 1] || '';
    const next = source[repeatedRun.end] || '';
    return /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶヵー]$/u.test(previous)
        || /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}々〆ヶヵー]$/u.test(next);
}

function normalizeJapanesePunctuationCompatibility(value) {
    return String(value || '')
        .replace(/〠/gu, '〒')
        .replace(japanesePunctuationCompatibilityPattern, character => {
            if (character === '\uFE19' || character === '\uFE30') return '…';
            return character.normalize('NFKC');
        })
        .replace(/[\uFF01-\uFF5E\uFF61-\uFF65]+/gu, segment => segment.normalize('NFKC'))
        .replace(/[‐‑]/gu, '-')
        .replace(/‒/gu, '–');
}

function isJapaneseCompatibilitySourceSymbol(character) {
    const codePoint = String(character || '').codePointAt(0);
    if (typeof codePoint !== 'number') return false;
    return (codePoint >= 0x3200 && codePoint <= 0x33FF)
        || (codePoint >= 0x1F200 && codePoint <= 0x1F2FF);
}

function getJapaneseCompatibilitySourceDecomposition(character) {
    const source = String(character || '');
    if (!isJapaneseCompatibilitySourceSymbol(source)) return null;
    const decomposed = source.normalize('NFKC');
    if (decomposed === source) return null;
    const characters = Array.from(decomposed);
    const hasJapaneseScript = characters.some(item => /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(item));
    if (!hasJapaneseScript) return null;
    const safe = characters.every(item =>
        /^[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Latin}\p{N}]$/u.test(item)
        || /^[\x20-\x7E]$/u.test(item)
        || /^[ー〔〕]$/u.test(item)
    );
    return safe ? decomposed : null;
}

function normalizeJapaneseCompatibilitySourceSymbols(value) {
    return Array.from(String(value || ''), character =>
        getJapaneseCompatibilitySourceDecomposition(character) || character
    ).join('');
}

function canonicalizeTokenizerBoundaryCharacters(value) {
    return normalizeJapanesePunctuationCompatibility(String(value || '')).replace(/[~～〜〰]/gu, '~');
}

const canonicalTransparentBoundaryCharacters = new Set([
    '「','」','『','』','（','）','(',')','［','］','[',']','【','】','〈','〉','《','》','〔','〕','〖','〗','〘','〙','〚','〛',
    '“','”','‘','’','"',"'",'«','»','‹','›','\n','\r','\t','\u2028','\u2029','\u3000'
]);

function isCanonicalTransparentBoundaryCharacter(character) {
    return canonicalTransparentBoundaryCharacters.has(String(character || ''));
}

function isCanonicalTransparentBoundarySurface(value) {
    const characters = Array.from(String(value || ''));
    return Boolean(characters.length) && characters.every(isCanonicalTransparentBoundaryCharacter);
}

function isBoundaryWordCharacter(character) {
    return Boolean(character) && /^[\p{L}\p{N}]$/u.test(character);
}

function isProtectedInternalBoundaryCharacter(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    const previous = source[index - 1] || '';
    const next = source[index + 1] || '';
    if (character === '.') {
        if (previous === '.' || next === '.') return false;
        return isBoundaryWordCharacter(previous) && isBoundaryWordCharacter(next);
    }
    if (character === ',') return /^[0-9]$/u.test(previous) && /^[0-9]$/u.test(next);
    if (character === ':') {
        if (/^[0-9]$/u.test(previous) && /^[0-9]$/u.test(next)) return true;
        if (/^[A-Za-z]$/u.test(previous) && next === '/') return true;
    }
    return false;
}

function isCanonicalHardBoundaryAt(text, index) {
    const source = String(text || '');
    const character = source[index] || '';
    if (!character) return false;
    if (isJapaneseCensorshipMarkerAt(source, index)) return true;
    if (japaneseOrthographicNonBoundaryCharacters.has(character)) return false;
    if (canonicalHardWhitespaceCharacters.has(character)) return true;
    if (isProtectedInternalBoundaryCharacter(source, index)) return false;
    if (/^\p{P}$/u.test(character)) return true;
    return canonicalHardBoundarySymbols.has(character);
}

function getCanonicalHardBoundaryRuns(value) {
    const text = String(value || '');
    const runs = [];
    let index = 0;
    while (index < text.length) {
        if (!isCanonicalHardBoundaryAt(text, index)) { index += 1; continue; }
        const start = index;
        const whitespace = canonicalHardWhitespaceCharacters.has(text[index]);
        const censorshipMarker = isJapaneseCensorshipMarkerAt(text, index);
        index += 1;
        while (index < text.length
            && isCanonicalHardBoundaryAt(text, index)
            && canonicalHardWhitespaceCharacters.has(text[index]) === whitespace
            && isJapaneseCensorshipMarkerAt(text, index) === censorshipMarker) index += 1;
        runs.push({ start, end: index, surface: text.slice(start, index), whitespace, censorshipMarker });
    }
    return runs;
}

function normalizeTranslatorInputText(value) {
    const composed = normalizeSpacingKanaVoicingMarks(value).normalize('NFC');
    const punctuationNormalised = normalizeJapanesePunctuationCompatibility(composed);
    const compatibilityNormalised = normalizeJapaneseCompatibilitySourceSymbols(punctuationNormalised);
    const widthNormalised = compatibilityNormalised.replace(/[\uFF01-\uFF5E\uFF61-\uFF9F]+/gu, segment => segment.normalize('NFKC'));
    const boundaryNormalised = canonicalizeTokenizerBoundaryCharacters(widthNormalised);
    const withoutSelectors = stripIdeographicVariationSelectors(boundaryNormalised);
    return normalizeKanjiForLookup(withoutSelectors);
}


// Historical encoded kana forms with an explicit Unicode ordinary-kana
// equivalent. These are structural source-form normalisations, not inferred
// readings.
const historicalFixedEncodedKanaMap = Object.freeze({
    '𛀀': 'エ',
    '𛄣': 'こと',
    '𛄤': 'トキ',
    '𛄥': 'トテ',
    '𛄦': 'ヨリ',
    '𛄧': 'ネ',
    '𛄨': 'ヰ'
});

function normalizeHistoricalFixedEncodedKanaForms(value) {
    return Array.from(String(value || ''), character => historicalFixedEncodedKanaMap[character] || character).join('');
}

// Unicode assigns fixed syllabic identities to these four archaic kana.
// Historical mode converts them to the existing CJ2R extended-kana spellings
// so the ordinary Rule-0 Hepburn/Wapuro romaniser remains authoritative.
const historicalArchaicSyllableKanaMap = Object.freeze({
    '𛄟': 'うぅ',
    '𛄠': 'いぃ',
    '𛄡': 'いぇ',
    '𛄢': 'うぅ'
});

function normalizeHistoricalArchaicSyllableKana(value) {
    return Array.from(String(value || ''), character => historicalArchaicSyllableKanaMap[character] || character).join('');
}

// Unicode documents the encoded small WI/WE forms as historic labialisation
// modifiers. Only the attested k/g + wi/we combinations are reduced here.
const historicalSmallKanaLabializationMap = Object.freeze({
    'く𛅐': 'くぃ',
    'ぐ𛅐': 'ぐぃ',
    'ク𛅤': 'クィ',
    'グ𛅤': 'グィ',
    'く𛅑': 'くぇ',
    'ぐ𛅑': 'ぐぇ',
    'ク𛅥': 'クェ',
    'グ𛅥': 'グェ'
});

function normalizeHistoricalSmallKanaLabialization(value) {
    const characters = Array.from(String(value || ''));
    let output = '';
    for (let index = 0; index < characters.length; index += 1) {
        const pair = `${characters[index] || ''}${characters[index + 1] || ''}`;
        const mapped = historicalSmallKanaLabializationMap[pair];
        if (mapped) {
            output += mapped;
            index += 1;
        } else {
            output += characters[index];
        }
    }
    return output;
}

// Historical-mode hentaigana normalisation is intentionally evidence-bounded.
// Unicode/CODH map these single-valued code-point ranges to one modern hiragana.
// Multi-valued forms (for example A-WO, KA-KE and N-MU-MO) are deliberately
// excluded so they remain unresolved/review-required without contextual evidence.
const historicalSingleValuedHentaiganaRanges = Object.freeze([
    Object.freeze({ start: 0x1B002, end: 0x1B004, modernKana: 'あ' }),
    Object.freeze({ start: 0x1B006, end: 0x1B009, modernKana: 'い' }),
    Object.freeze({ start: 0x1B00A, end: 0x1B00E, modernKana: 'う' }),
    Object.freeze({ start: 0x1B00F, end: 0x1B013, modernKana: 'え' }),
    Object.freeze({ start: 0x1B014, end: 0x1B016, modernKana: 'お' }),
    Object.freeze({ start: 0x1B017, end: 0x1B021, modernKana: 'か' }),
    Object.freeze({ start: 0x1B023, end: 0x1B02A, modernKana: 'き' }),
    Object.freeze({ start: 0x1B02B, end: 0x1B031, modernKana: 'く' }),
    Object.freeze({ start: 0x1B032, end: 0x1B037, modernKana: 'け' }),
    Object.freeze({ start: 0x1B038, end: 0x1B03A, modernKana: 'こ' }),
    Object.freeze({ start: 0x1B03C, end: 0x1B043, modernKana: 'さ' }),
    Object.freeze({ start: 0x1B044, end: 0x1B049, modernKana: 'し' }),
    Object.freeze({ start: 0x1B04A, end: 0x1B051, modernKana: 'す' }),
    Object.freeze({ start: 0x1B052, end: 0x1B056, modernKana: 'せ' }),
    Object.freeze({ start: 0x1B057, end: 0x1B05D, modernKana: 'そ' }),
    Object.freeze({ start: 0x1B05E, end: 0x1B061, modernKana: 'た' }),
    Object.freeze({ start: 0x1B062, end: 0x1B068, modernKana: 'ち' }),
    Object.freeze({ start: 0x1B069, end: 0x1B06C, modernKana: 'つ' }),
    Object.freeze({ start: 0x1B06E, end: 0x1B076, modernKana: 'て' }),
    Object.freeze({ start: 0x1B077, end: 0x1B07C, modernKana: 'と' }),
    Object.freeze({ start: 0x1B07E, end: 0x1B086, modernKana: 'な' }),
    Object.freeze({ start: 0x1B087, end: 0x1B08D, modernKana: 'に' }),
    Object.freeze({ start: 0x1B08F, end: 0x1B091, modernKana: 'ぬ' }),
    Object.freeze({ start: 0x1B092, end: 0x1B097, modernKana: 'ね' }),
    Object.freeze({ start: 0x1B099, end: 0x1B09D, modernKana: 'の' }),
    Object.freeze({ start: 0x1B09E, end: 0x1B0A8, modernKana: 'は' }),
    Object.freeze({ start: 0x1B0A9, end: 0x1B0AF, modernKana: 'ひ' }),
    Object.freeze({ start: 0x1B0B0, end: 0x1B0B2, modernKana: 'ふ' }),
    Object.freeze({ start: 0x1B0B3, end: 0x1B0B9, modernKana: 'へ' }),
    Object.freeze({ start: 0x1B0BA, end: 0x1B0C1, modernKana: 'ほ' }),
    Object.freeze({ start: 0x1B0C2, end: 0x1B0C8, modernKana: 'ま' }),
    Object.freeze({ start: 0x1B0C9, end: 0x1B0CF, modernKana: 'み' }),
    Object.freeze({ start: 0x1B0D0, end: 0x1B0D3, modernKana: 'む' }),
    Object.freeze({ start: 0x1B0D4, end: 0x1B0D5, modernKana: 'め' }),
    Object.freeze({ start: 0x1B0D7, end: 0x1B0DC, modernKana: 'も' }),
    Object.freeze({ start: 0x1B0DD, end: 0x1B0E1, modernKana: 'や' }),
    Object.freeze({ start: 0x1B0E3, end: 0x1B0E6, modernKana: 'ゆ' }),
    Object.freeze({ start: 0x1B0E7, end: 0x1B0EC, modernKana: 'よ' }),
    Object.freeze({ start: 0x1B0ED, end: 0x1B0F0, modernKana: 'ら' }),
    Object.freeze({ start: 0x1B0F1, end: 0x1B0F7, modernKana: 'り' }),
    Object.freeze({ start: 0x1B0F8, end: 0x1B0FD, modernKana: 'る' }),
    Object.freeze({ start: 0x1B0FE, end: 0x1B101, modernKana: 'れ' }),
    Object.freeze({ start: 0x1B102, end: 0x1B107, modernKana: 'ろ' }),
    Object.freeze({ start: 0x1B108, end: 0x1B10C, modernKana: 'わ' }),
    Object.freeze({ start: 0x1B10D, end: 0x1B111, modernKana: 'ゐ' }),
    Object.freeze({ start: 0x1B112, end: 0x1B115, modernKana: 'ゑ' }),
    Object.freeze({ start: 0x1B116, end: 0x1B11C, modernKana: 'を' })
]);

function getHistoricalSingleValuedHentaiganaModernKana(character) {
    const value = String(character || '');
    if (!value) return null;
    const codePoint = value.codePointAt(0);
    if (typeof codePoint !== 'number' || !Number.isInteger(codePoint)) return null;
    for (const range of historicalSingleValuedHentaiganaRanges) {
        if (codePoint >= range.start && codePoint <= range.end) return range.modernKana;
    }
    return null;
}

function normalizeHistoricalSingleValuedHentaigana(value) {
    const normalized = Array.from(String(value || ''), character =>
        getHistoricalSingleValuedHentaiganaModernKana(character) || character
    ).join('');
    // Hentaigana may carry dakuten or handakuten. Once a single-valued
    // historical glyph has been reduced to ordinary kana, reuse the same
    // spacing-mark conversion and NFC composition as the modern-kana path.
    // Ambiguous hentaigana are deliberately left unmapped, so their marks
    // remain unresolved rather than being guessed.
    return normalizeSpacingKanaVoicingMarks(normalized).normalize('NFC');
}

// CODH/NINJAL document these code points with more than one modern-kana value.
// Historical mode may resolve one only when an exact kana run has exactly one
// candidate backed by strong maintained whole-word lexical reading evidence.
const historicalAmbiguousHentaiganaCandidateMap = Object.freeze({
    '𛀅': Object.freeze(['あ', 'を']),
    '𛀢': Object.freeze(['か', 'け']),
    '𛀻': Object.freeze(['き', 'こ']),
    '𛁭': Object.freeze(['つ', 'と']),
    '𛁽': Object.freeze(['と', 'ら']),
    '𛂎': Object.freeze(['に', 'て']),
    '𛂘': Object.freeze(['ね', 'こ']),
    '𛃖': Object.freeze(['ま', 'め']),
    '𛃢': Object.freeze(['や', 'よ']),
    '𛄝': Object.freeze(['む', 'も', 'ん']),
    '𛄞': Object.freeze(['む', 'も', 'ん'])
});

function getHistoricalAmbiguousHentaiganaCandidates(character) {
    const candidates = historicalAmbiguousHentaiganaCandidateMap[String(character || '')];
    return candidates ? [...candidates] : [];
}

function isHistoricalContextualHentaiganaRunCharacter(character) {
    const value = String(character || '');
    return Boolean(value) && (
        /^[ぁ-ゖゟァ-ヺヿー]$/u.test(value)
        || /^[゛゜゙゚]$/u.test(value)
        || isHistoricalJapaneseKanaExtensionCharacter(value)
    );
}

function isHistoricalContextOrdinaryKanaCharacter(character) {
    return /^[ぁ-ゖゟァ-ヺヿー]$/u.test(String(character || ''));
}

function getStrongHistoricalKanaLexicalEvidence(reading) {
    const normalized = normalizeKanaReading(normalizeSpacingKanaVoicingMarks(reading).normalize('NFC'));
    const evidence = runtimeState.kanaLexicalReadingDictionary.get(normalized) || null;
    return evidence?.strongSources?.size ? { normalized, evidence } : null;
}

function resolveHistoricalContextualKanaRun(value, candidateProvider) {
    const source = String(value || '');
    const characters = Array.from(source);
    const ambiguousIndexes = [];
    let ordinaryContextCount = 0;
    let combinationCount = 1;
    for (let index = 0; index < characters.length; index += 1) {
        const candidates = candidateProvider(characters[index]);
        if (candidates.length) {
            ambiguousIndexes.push(index);
            combinationCount *= candidates.length;
            if (combinationCount > 64) return source;
        } else if (isHistoricalContextOrdinaryKanaCharacter(characters[index])) {
            ordinaryContextCount += 1;
        }
    }
    if (!ambiguousIndexes.length || ordinaryContextCount < 1) return source;

    let variants = [{ characters: [...characters] }];
    for (const index of ambiguousIndexes) {
        const candidates = candidateProvider(characters[index]);
        const next = [];
        for (const variant of variants) {
            for (const candidate of candidates) {
                const updated = [...variant.characters];
                updated[index] = candidate;
                next.push({ characters: updated });
            }
        }
        variants = next;
    }

    const viable = new Map();
    for (const variant of variants) {
        const candidateSurface = normalizeSpacingKanaVoicingMarks(variant.characters.join('')).normalize('NFC');
        const lexical = getStrongHistoricalKanaLexicalEvidence(candidateSurface);
        if (!lexical) continue;
        if (!viable.has(lexical.normalized)) viable.set(lexical.normalized, candidateSurface);
    }
    return viable.size === 1 ? [...viable.values()][0] : source;
}

function resolveHistoricalAmbiguousHentaiganaKanaRun(value) {
    return resolveHistoricalContextualKanaRun(value, getHistoricalAmbiguousHentaiganaCandidates);
}

const historicalArchaicYeDualIdentityCandidates = Object.freeze(['え', 'いぇ']);

function getHistoricalArchaicYeDualIdentityCandidates(character) {
    return String(character || '') === '𛀁' ? [...historicalArchaicYeDualIdentityCandidates] : [];
}

function resolveHistoricalArchaicYeDualIdentityKanaRun(value) {
    return resolveHistoricalContextualKanaRun(value, getHistoricalArchaicYeDualIdentityCandidates);
}

function getHistoricalContextualKanaExtensionCandidates(character) {
    const hentaigana = getHistoricalAmbiguousHentaiganaCandidates(character);
    return hentaigana.length ? hentaigana : getHistoricalArchaicYeDualIdentityCandidates(character);
}

function resolveHistoricalContextualKanaExtensionRun(value) {
    return resolveHistoricalContextualKanaRun(value, getHistoricalContextualKanaExtensionCandidates);
}

function normalizeHistoricalContextualKanaRuns(value, resolver) {
    const source = String(value || '');
    let output = '';
    let run = '';
    const flush = () => {
        if (!run) return;
        output += resolver(run);
        run = '';
    };
    for (const character of Array.from(source)) {
        if (isHistoricalContextualHentaiganaRunCharacter(character)) run += character;
        else {
            flush();
            output += character;
        }
    }
    flush();
    return output;
}

function normalizeHistoricalContextResolvedHentaigana(value) {
    return normalizeHistoricalContextualKanaRuns(value, resolveHistoricalAmbiguousHentaiganaKanaRun);
}

function normalizeHistoricalContextResolvedArchaicYe(value) {
    return normalizeHistoricalContextualKanaRuns(value, resolveHistoricalArchaicYeDualIdentityKanaRun);
}

function normalizeHistoricalContextResolvedKanaExtensions(value) {
    return normalizeHistoricalContextualKanaRuns(value, resolveHistoricalContextualKanaExtensionRun);
}

const historicalVerticalKanaRepeatMarkVoicing = Object.freeze({ '〱': false, '〲': true });

function isHistoricalVerticalRepeatableKana(character) {
    return /^[\p{Script=Hiragana}\p{Script=Katakana}]$/u.test(String(character || ''));
}

function voiceHistoricalVerticalRepeatKana(character) {
    const source = String(character || '');
    if (!isHistoricalVerticalRepeatableKana(source)) return null;
    const decomposed = source.normalize('NFD').replace(/[\u3099\u309A]/gu, '');
    const voiced = (decomposed + '\u3099').normalize('NFC');
    if (voiced === source || !isHistoricalVerticalRepeatableKana(voiced)) return null;
    const romaji = convertToRomaji(voiced);
    return /^[A-Za-z']+$/u.test(romaji) ? voiced : null;
}

function normalizeHistoricalVerticalIterationMarks(value) {
    const canonical = String(value || '')
        .replace(/〳〵/gu, '〱')
        .replace(/〴〵/gu, '〲')
        .replace(/〻/gu, '々');
    const output = [];
    for (const character of Array.from(canonical)) {
        if (!Object.prototype.hasOwnProperty.call(historicalVerticalKanaRepeatMarkVoicing, character)) {
            output.push(character);
            continue;
        }
        if (output.length < 2) {
            output.push(character);
            continue;
        }
        const pair = output.slice(-2);
        if (!pair.every(isHistoricalVerticalRepeatableKana)) {
            output.push(character);
            continue;
        }
        let [first, second] = pair;
        if (historicalVerticalKanaRepeatMarkVoicing[character]) {
            first = voiceHistoricalVerticalRepeatKana(first);
            if (!first) {
                output.push(character);
                continue;
            }
        }
        output.push(first, second);
    }
    return output.join('');
}

const syllabicNApostropheFollowers = /^[あいうえおやゆよぁぃぅぇぉゃゅょ]/u;

function readingEndsInSyllabicN(value) {
    return /ん$/u.test(normalizeKanaReading(value));
}

function readingStartsWithVowelOrY(value) {
    return syllabicNApostropheFollowers.test(normalizeKanaReading(value));
}

function needsSyllabicNApostrophe(leftReading, rightReading) {
    return readingEndsInSyllabicN(leftReading) && readingStartsWithVowelOrY(rightReading);
}

const ideographicDecimalDigitMap = Object.freeze({
    '〇':'0','一':'1','二':'2','三':'3','四':'4','五':'5','六':'6','七':'7','八':'8','九':'9'
});
const ideographicDecimalDigitSurfacePattern = /^[0-9〇一二三四五六七八九]+$/u;

function canonicalizeIdeographicDecimalNotationSurface(value) {
    const surface = String(value || '');
    return surface.replace(/[0-9〇一二三四五六七八九]+/gu, run => {
        if (!run.includes('〇')) return run;
        return Array.from(run).map(character => ideographicDecimalDigitMap[character] || character).join('');
    });
}

function isIdeographicDecimalDigitSurface(value) {
    return ideographicDecimalDigitSurfacePattern.test(String(value || ''));
}

const japaneseNumeralSurfacePattern = /^[0-9０-９〇零一二三四五六七八九十百千万億兆]+$/u;
const numericGroupTerminalPattern = /[百千万億兆]$/u;
const largeNumericUnitSurfaces = new Set(['万', '億', '兆']);
const separatedNumericUnitSurfaces = new Set(['円']);

function isJapaneseNumeralSurface(value) {
    return japaneseNumeralSurfacePattern.test(String(value || ''));
}

function isSeparatedNumericUnitSurface(value) {
    return separatedNumericUnitSurfaces.has(String(value || ''));
}

function isLargeNumericUnitSurface(value) {
    return largeNumericUnitSurfaces.has(String(value || ''));
}

function isStructuredNumericUnitSurface(value) {
    const surface = String(value || '');
    for (const unit of separatedNumericUnitSurfaces) {
        if (surface.endsWith(unit) && isJapaneseNumeralSurface(surface.slice(0, -unit.length))) return true;
    }
    return false;
}

const sokuonGeminateRomajiInitials = new Set(['b','c','d','f','g','h','j','k','p','s','t','v','z']);

function isSokuonGeminateableReading(reading) {
    const initial = String(reading || '').match(/^[a-z]/)?.[0] || '';
    return sokuonGeminateRomajiInitials.has(initial);
}

const contractedKanaMap = Object.freeze({
    'きゃ':'kya','きゅ':'kyu','きょ':'kyo','きぇ':'kye','ぎゃ':'gya','ぎゅ':'gyu','ぎょ':'gyo','ぎぇ':'gye',
    'しゃ':'sha','しゅ':'shu','しょ':'sho','しぇ':'she','じゃ':'ja','じゅ':'ju','じょ':'jo','じぇ':'je',
    'ちゃ':'cha','ちゅ':'chu','ちょ':'cho','ちぇ':'che','ぢゃ':'ja','ぢゅ':'ju','ぢょ':'jo','ぢぇ':'je',
    'にゃ':'nya','にゅ':'nyu','にょ':'nyo','にぇ':'nye','ひゃ':'hya','ひゅ':'hyu','ひょ':'hyo','ひぇ':'hye',
    'びゃ':'bya','びゅ':'byu','びょ':'byo','びぇ':'bye','ぴゃ':'pya','ぴゅ':'pyu','ぴょ':'pyo','ぴぇ':'pye',
    'みゃ':'mya','みゅ':'myu','みょ':'myo','みぇ':'mye','りゃ':'rya','りゅ':'ryu','りょ':'ryo','りぇ':'rye',
    'いぃ':'yi','いぇ':'ye',
    'うぁ':'wa','うぃ':'wi','うぅ':'wu','うぇ':'we','うぉ':'wo','うゃ':'wya','うゅ':'wyu','うぃぇ':'wye','うょ':'wyo',
    'くぁ':'kwa','くぃ':'kwi','くぇ':'kwe','くぉ':'kwo','くゎ':'kwa',
    'ぐぁ':'gwa','ぐぃ':'gwi','ぐぇ':'gwe','ぐぉ':'gwo','ぐゎ':'gwa',
    'すぃ':'si','ずぃ':'zi',
    'つぁ':'tsa','つぃ':'tsi','つぇ':'tse','つぉ':'tso','つゃ':'tsya','つゅ':'tsyu','つぃぇ':'tsye','つょ':'tsyo',
    'づぁ':'za','づぃ':'zi','づぇ':'ze','づぉ':'zo','づゃ':'zya','づゅ':'zyu','づぃぇ':'zye','づょ':'zyo',
    'てぃ':'ti','てゅ':'tyu','とぅ':'tu','とぃ':'twi',
    'でぃ':'di','でゅ':'dyu','どぅ':'du','どぃ':'dwi',
    'ぬぃ':'nwi','ぶぃ':'bwi','ぷぃ':'pwi','むぃ':'mwi','ゆぃ':'ywi','ゆぇ':'ye','るぃ':'rwi',
    'ふぁ':'fa','ふぃ':'fi','ふぇ':'fe','ふぉ':'fo','ふゃ':'fya','ふゅ':'fyu','ふぃぇ':'fye','ふょ':'fyo',
    'ほぅ':'hu',
    'ゔぁ':'va','ゔぃ':'vi','ゔぇ':'ve','ゔぉ':'vo','ゔゃ':'vya','ゔゅ':'vyu','ゔぃぇ':'vye','ゔょ':'vyo'
});

function hasUnresolvableProlongedSoundMark(text) {
    const normalizedText = normalizeKanaReading(text);
    let previousVowel = '';
    for (let index = 0; index < normalizedText.length; index += 1) {
        const char = normalizedText[index];
        if (char === 'ー') {
            if (!previousVowel) return true;
            continue;
        }
        if (char === 'っ' || char === 'ん') {
            previousVowel = '';
            continue;
        }
        const triple = normalizedText.slice(index, index + 3);
        const pair = normalizedText.slice(index, index + 2);
        const contracted = contractedKanaMap[triple] || contractedKanaMap[pair] || '';
        const reading = contracted || kanaToRomajiMap[char] || '';
        if (contracted) index += contractedKanaMap[triple] ? 2 : 1;
        previousVowel = reading.match(/[aeiou]$/)?.[0] || '';
    }
    return false;
}

function convertToRomaji(text) {
    const normalizedText = normalizeKanaReading(text);

    const romaji = [];
    let pendingDouble = false;
    for (let index = 0; index < normalizedText.length; index += 1) {
        const char = normalizedText[index];
        if (char === 'っ') {
            pendingDouble = true;
            continue;
        }
        if (char === 'ー') {
            const previous = romaji[romaji.length - 1] || '';
            const vowel = previous.match(/[aeiou]$/);
            if (vowel) romaji.push(vowel[0]);
            pendingDouble = false;
            continue;
        }
        if (char === 'ん' && readingStartsWithVowelOrY(normalizedText.slice(index + 1))) {
            romaji.push("n'");
            continue;
        }
        const triple = normalizedText.slice(index, index + 3);
        const pair = normalizedText.slice(index, index + 2);
        const contracted = contractedKanaMap[triple] || contractedKanaMap[pair] || '';
        const reading = contracted || kanaToRomajiMap[char] || char;
        if (contracted) index += contractedKanaMap[triple] ? 2 : 1;
        if (pendingDouble && isSokuonGeminateableReading(reading)) romaji.push(reading[0]);
        romaji.push(reading);
        pendingDouble = false;
    }
    return romaji.join('');
}

// The external grammar file is authoritative. The two fallback entries in
// runtime state are bootstrap values only; loaded configuration takes precedence.

