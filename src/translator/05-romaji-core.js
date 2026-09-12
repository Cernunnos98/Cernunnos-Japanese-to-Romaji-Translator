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
const unresolvedJapaneseOrthographicCharacters = new Set(['ゝ','ゞ','ヽ','ヾ','〆','゛']);

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
        /^[ぁ-ゖゟァ-ヺヿー]$/u.test(character) || unresolvedJapaneseOrthographicCharacters.has(character));
}
const canonicalHardBoundarySymbols = new Set(['~','|','+','=','×','⋯','⋮']);
const canonicalHardWhitespaceCharacters = new Set(['\n','\r','\t','\u2028','\u2029','\u3000']);

function normalizeJapanesePunctuationCompatibility(value) {
    return String(value || '')
        .replace(japanesePunctuationCompatibilityPattern, character => {
            if (character === '\uFE19' || character === '\uFE30') return '…';
            return character.normalize('NFKC');
        })
        .replace(/[\uFF01-\uFF5E\uFF61-\uFF65]+/gu, segment => segment.normalize('NFKC'))
        .replace(/[‐‑]/gu, '-')
        .replace(/‒/gu, '–');
}

function canonicalizeTokenizerBoundaryCharacters(value) {
    return normalizeJapanesePunctuationCompatibility(String(value || '')).replace(/[~～〜〰]/gu, '~');
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
    if (!character || japaneseOrthographicNonBoundaryCharacters.has(character)) return false;
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
        index += 1;
        while (index < text.length
            && isCanonicalHardBoundaryAt(text, index)
            && canonicalHardWhitespaceCharacters.has(text[index]) === whitespace) index += 1;
        runs.push({ start, end: index, surface: text.slice(start, index), whitespace });
    }
    return runs;
}

function splitCanonicalHardBoundarySegments(value) {
    const text = String(value || '');
    const segments = [];
    let cursor = 0;
    for (const boundary of getCanonicalHardBoundaryRuns(text)) {
        const segment = text.slice(cursor, boundary.start).trim();
        if (segment) segments.push(segment);
        cursor = boundary.end;
    }
    const tail = text.slice(cursor).trim();
    if (tail) segments.push(tail);
    return segments;
}

function normalizeTranslatorInputText(value) {
    const composed = normalizeSpacingKanaVoicingMarks(value).normalize('NFC');
    const compatibilityNormalised = normalizeJapanesePunctuationCompatibility(composed);
    const widthNormalised = compatibilityNormalised.replace(/[\uFF01-\uFF5E\uFF61-\uFF9F]+/gu, segment => segment.normalize('NFKC'));
    const boundaryNormalised = canonicalizeTokenizerBoundaryCharacters(widthNormalised);
    const withoutSelectors = stripIdeographicVariationSelectors(boundaryNormalised);
    return normalizeKanjiForLookup(withoutSelectors);
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

