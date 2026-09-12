// Source section: Shared JSON loading, Kanji data, the Kanji helper and overrides.
async function ensureKuromojiLoaded() {
    try {
        if (!window.kuromoji) await loadScriptWithRetry(assetUrl(getAssetPath('kuromojiScript')));
        validateKuromojiApi(window.kuromoji);
        return true;
    } catch (error) {
        handleAssetLoadFailure('kuromojiScript', 'Unable to load Kuromoji', error);
        return false;
    }
}

function handleAssetLoadFailure(assetKey, message, error) {
    const definition = getAssetDefinition(assetKey);
    console.warn(`${message}:`, error);
    if (definition.criticality === ASSET_CRITICALITY.CRITICAL) {
        const detail = error?.message ? ` ${error.message}` : '';
        throw new Error(`${message}.${detail}`.trim());
    }
    if (definition.criticality === ASSET_CRITICALITY.DEVELOPER) runtimeState.developerWarnings.add(message);
    else runtimeState.resourceWarnings.add(message);
    return false;
}

async function fetchJsonAsset(assetKey, filePath = getAssetPath(assetKey), failureMessage = `Asset unavailable: ${filePath}`) {
    try {
        const response = await fetchAssetResponse(assetUrl(filePath));
        const data = await response.json();
        return validateAssetSchema(assetKey, data, filePath);
    } catch (error) {
        handleAssetLoadFailure(assetKey, failureMessage, error);
        return null;
    }
}

function normalizeReadingList(value) {
    if (!value) return [];
    return String(value)
        .replace(/・/g, ' ')
        .split(/\s+/)
        .map(part => part.trim())
        .filter(Boolean);
}

async function loadKanjiVariantDictionary() {
    const data = await fetchJsonAsset('kanjiVariants', getAssetPath('kanjiVariants'), 'Kanji variant dictionary unavailable');
    if (!data) return;
    runtimeState.generalKanjiVariantDictionary.clear();
    runtimeState.nameKanjiVariantDictionary.clear();
    for (const [variant, reference] of Object.entries(data?.general || {})) {
        if (isHanCharacter(variant) && isHanCharacter(reference) && variant !== reference) {
            runtimeState.generalKanjiVariantDictionary.set(variant, reference);
        }
    }
    for (const [variant, reference] of Object.entries(data?.names || {})) {
        if (isHanCharacter(variant) && isHanCharacter(reference) && variant !== reference) {
            runtimeState.nameKanjiVariantDictionary.set(variant, reference);
        }
    }
}

async function loadJapaneseHanScopeDictionary() {
    const data = await fetchJsonAsset('japaneseHanScope', getAssetPath('japaneseHanScope'), 'Japanese-use Han scope evidence unavailable');
    runtimeState.japaneseHanScopeDictionary.clear();
    if (!data) return;
    for (const entry of data.entries || []) {
        runtimeState.japaneseHanScopeDictionary.set(String(entry.character), {
            character: String(entry.character),
            reference: entry.reference ? String(entry.reference) : null,
            readings: [...new Set((entry.readings || []).map(normalizeKanaReading).filter(Boolean))],
            sourceIds: [...new Set((entry.sourceIds || []).map(String))],
            source: String(entry.source || '')
        });
    }
}

function buildJapaneseHanScopeCandidates(character, evidence = null) {
    const entry = evidence || runtimeState.japaneseHanScopeDictionary.get(String(character || '')) || null;
    const readings = entry?.readings || [];
    return readings.map((reading, index) => ({
        reading,
        romaji: convertToRomaji(reading),
        weight: Math.max(1, 100 - index),
        rank: index + 1,
        categories: ['japanese-han-scope'],
        sources: entry?.sourceIds?.length ? entry.sourceIds : [entry?.source || 'japanese-han-scope']
    }));
}

function normalizeKanjiDictionaryCandidateReading(reading, kind = 'on') {
    const raw = String(reading || '').trim();
    if (!raw) return null;
    const affix = /^-|-$/.test(raw);
    const dotted = raw.includes('.');
    const normalized = normalizeKanaReading(raw.replace(/^-+|-+$/g, '').split('.', 1)[0]);
    if (!normalized || !/^[ぁ-ゖゔゟー]+$/u.test(normalized)) return null;
    const category = kind === 'on'
        ? 'kanjidic-on'
        : affix ? 'kanjidic-kun-affix'
        : dotted ? 'kanjidic-kun-stem'
        : 'kanjidic-kun-bare';
    const priority = kind === 'on' ? 80 : affix ? 40 : dotted ? 60 : 90;
    return { reading: normalized, category, priority };
}

function buildKanjiDictionaryCandidates(character) {
    const char = String(character || '');
    const entry = runtimeState.kanjiDictionary[char] || null;
    if (!entry) return [];
    const candidates = [];
    const seen = new Set();
    const add = (reading, kind) => {
        const normalized = normalizeKanjiDictionaryCandidateReading(reading, kind);
        if (!normalized || seen.has(normalized.reading)) return;
        seen.add(normalized.reading);
        candidates.push(normalized);
    };
    for (const reading of entry.kun || []) add(reading, 'kun');
    for (const reading of entry.on || []) add(reading, 'on');
    candidates.sort((left, right) => right.priority - left.priority);
    return candidates.map((candidate, index) => ({
        reading: candidate.reading,
        romaji: convertToRomaji(candidate.reading),
        weight: candidate.priority,
        rank: index + 1,
        categories: ['kanjidic', candidate.category],
        sources: ['kanjidic']
    }));
}

function classifyHanCharacterScope(character) {
    const char = String(character || '');
    if (!isHanCharacter(char)) return { character: char, scope: 'out-of-scope', evidence: [], candidates: [] };

    const reviewed = runtimeState.japaneseHanScopeDictionary.get(char) || null;
    if (reviewed) {
        return {
            character: char,
            scope: 'japanese-scope',
            evidence: [{ source: 'reviewed-japanese-han-scope', sourceIds: reviewed.sourceIds, reference: reviewed.reference, detail: reviewed.source }],
            reference: reviewed.reference,
            candidates: buildJapaneseHanScopeCandidates(char, reviewed)
        };
    }

    const compatibility = normalizeCompatibilityIdeograph(char);
    const generalReference = runtimeState.generalKanjiVariantDictionary.get(char) || runtimeState.generalKanjiVariantDictionary.get(compatibility) || null;
    const nameReference = runtimeState.nameKanjiVariantDictionary.get(char) || runtimeState.nameKanjiVariantDictionary.get(compatibility) || null;
    const reference = generalReference || nameReference;
    if (reference) {
        const candidates = buildKanjiDictionaryCandidates(reference);
        if (candidates.length) {
            return {
                character: char,
                scope: 'japanese-scope',
                evidence: [{ source: generalReference ? 'general-kanji-variant' : 'name-kanji-variant', reference }],
                reference,
                candidates
            };
        }
    }

    const canonical = runtimeState.kanjiDictionary[char] ? char : runtimeState.kanjiDictionary[compatibility] ? compatibility : null;
    if (canonical) {
        const candidates = buildKanjiDictionaryCandidates(canonical);
        if (candidates.length) {
            return {
                character: char,
                scope: 'japanese-scope',
                evidence: [{ source: 'kanjidic', reference: canonical }],
                reference: canonical,
                candidates
            };
        }
        return {
            character: char,
            scope: 'unknown-scope',
            evidence: [{ source: 'kanjidic-no-japanese-reading', reference: canonical }],
            reference: canonical,
            candidates: []
        };
    }

    return { character: char, scope: 'unknown-scope', evidence: [], reference: null, candidates: [] };
}

function classifyHanSurfaceScope(value) {
    const characters = Array.from(String(value || '')).filter(isHanCharacter);
    if (!characters.length) return { scope: 'out-of-scope', characters: [] };
    const classified = characters.map(classifyHanCharacterScope);
    return {
        scope: classified.every(item => item.scope === 'japanese-scope') ? 'japanese-scope' : 'unknown-scope',
        characters: classified
    };
}

function escapeHtml(value) {
    return String(value)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}

function hasMeaningfulJapaneseText(value) {
    return /[\p{Script=Han}ぁ-ゖァ-ンヴー]/u.test(String(value || '').trim());
}

async function loadKanjiDictionary() {
    const files = getAssetPaths('kanjiBanks');
    for (const filePath of files) {
        const data = await fetchJsonAsset('kanjiBanks', filePath, `Kanji file unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            if (!Array.isArray(entry) || !entry[0]) continue;
            const kanji = String(entry[0]);
            if (!kanji || Array.from(kanji).length !== 1) continue;
            runtimeState.kanjiDictionary[kanji] = {
                on: normalizeReadingList(entry[1]),
                kun: normalizeReadingList(entry[2])
            };
        }
    }
}

function formatKanjiReadingForDisplay(reading) {
    const kana = String(reading || '').replace(/^-+|-+$/g, '').replace(/\./g, '');
    return { kana, romaji: capitalizeRomaji(convertToRomaji(kana)) };
}

function deduplicateKanjiReadingsForDisplay(readings) {
    const seen = new Set();
    const unique = [];
    for (const reading of readings || []) {
        const display = formatKanjiReadingForDisplay(reading);
        const key = `${display.romaji}|${display.kana}`;
        if (!display.kana || seen.has(key)) continue;
        seen.add(key);
        unique.push(reading);
    }
    return unique;
}

/** @param {string} char @param {number|null} [position] */
function getKanjiReadingEntry(char, position = null) {
    const entry = runtimeState.kanjiDictionary[char] || { on: [], kun: [] };
    const format = reading => ({ reading, ...formatKanjiReadingForDisplay(reading) });
    return {
        character: char,
        position: Number.isInteger(position) ? position : null,
        on: deduplicateKanjiReadingsForDisplay(entry.on).map(format),
        kun: deduplicateKanjiReadingsForDisplay(entry.kun).map(format)
    };
}

function getUniqueKanji(text) {
    return [...new Set(getHanOccurrences(text).map(({ char }) => char))];
}

function getKanjiReadingData(text, searchValue = '') {
    const sourceText = String(text || '');
    const searchText = String(searchValue || '').trim();
    return {
        searchText,
        search: searchText ? getUniqueKanji(searchText).map(char => getKanjiReadingEntry(char)) : [],
        input: hasMeaningfulJapaneseText(sourceText)
            ? getHanOccurrences(sourceText).map(({ char, position }) => getKanjiReadingEntry(char, position))
            : []
    };
}

/** @param {{character:string,position:number|null,on:Array<{reading:string,kana:string,romaji:string}>,kun:Array<{reading:string,kana:string,romaji:string}>}} entry */
function buildKanjiReadingMarkup(entry) {
    const positionAttribute = Number.isInteger(entry.position) ? ` data-position="${entry.position}"` : '';
    const makeReadingButton = display => `<button type="button" class="kanji-reading-button" data-kanji="${escapeHtml(entry.character)}" data-reading="${escapeHtml(display.reading)}"${positionAttribute}><span>${escapeHtml(display.romaji)} (${escapeHtml(display.kana)})</span></button>`;
    const onButtons = entry.on.map(makeReadingButton).join('') || '<span>—</span>';
    const kunButtons = entry.kun.map(makeReadingButton).join('') || '<span>—</span>';
    return `<div class="kanji-reading-item"><span class="kanji-character">${escapeHtml(entry.character)}</span><div class="kanji-reading-text"><div><strong>On’yomi:</strong> ${onButtons}</div><div><strong>Kun’yomi:</strong> ${kunButtons}</div></div></div>`;
}

function getHanOccurrences(text) {
    const occurrences = [];
    const value = String(text || '');
    for (let index = 0; index < value.length;) {
        const codePoint = value.codePointAt(index);
        if (codePoint === undefined) break;
        const char = String.fromCodePoint(codePoint);
        if (isHanCharacter(char)) occurrences.push({ char, position: index });
        index += char.length;
    }
    return occurrences;
}

/** @param {string} text @param {string} char @param {string} reading @param {number} position */
function replaceKanjiReadingAtPosition(text, char, reading, position) {
    const value = String(text || '');
    if (!char || !Number.isInteger(position) || position < 0 || value.slice(position, position + char.length) !== char) return value;
    const [stem, okurigana = ''] = String(reading).split('.', 2);
    const followingText = value.slice(position + char.length);
    const replacement = okurigana && followingText.startsWith(okurigana)
        ? stem.replace(/^-+|-+$/g, '')
        : String(reading).replace(/^-+|-+$/g, '').replace('.', '');
    return value.slice(0, position) + replacement + followingText;
}

/** @param {Element|null} sourceElement @param {string} char @param {string} reading @param {number} position */
function replaceKanjiReadingInElement(sourceElement, char, reading, position) {
    if (!char || !sourceElement || !('value' in sourceElement)) return false;
    const currentValue = String(sourceElement.value || '');
    const nextValue = replaceKanjiReadingAtPosition(currentValue, char, reading, position);
    if (nextValue === currentValue) return false;
    sourceElement.value = nextValue;
    sourceElement.dispatchEvent(new Event('input', { bubbles: true }));
    return true;
}

/** @param {Element} target @param {Element|null} sourceElement */
function bindKanjiReadingButtons(target, sourceElement) {
    if (!sourceElement) return;
    target.querySelectorAll('.kanji-reading-button[data-position]').forEach(button => {
        button.addEventListener('click', function () {
            replaceKanjiReadingInElement(sourceElement, this.dataset.kanji, this.dataset.reading, Number(this.dataset.position));
        });
    });
}

/** @param {Element} target @param {string} text @param {string} [searchValue] @param {Element|null} [sourceElement] */
function renderKanjiReadings(target, text, searchValue = '', sourceElement = null) {
    if (!target) return null;
    const data = getKanjiReadingData(text, searchValue);
    if (!data.searchText && !hasMeaningfulJapaneseText(text)) {
        target.innerHTML = '';
        return data;
    }
    const sections = [];
    if (data.searchText) {
        if (!data.search.length) {
            target.innerHTML = '<div class="kanji-result-label">Kanji Search</div><div>No kanji found in the search field.</div>';
            return data;
        }
        sections.push(`<div class="kanji-result-group"><div class="kanji-result-label">Kanji Search</div>${data.search.map(buildKanjiReadingMarkup).join('')}</div>`);
    }
    if (data.input.length) {
        sections.push(`${sections.length ? '<div class="kanji-divider"></div>' : ''}<div class="kanji-result-group"><div class="kanji-result-label">Japanese Text Input</div>${data.input.map(buildKanjiReadingMarkup).join('')}</div>`);
    }
    target.innerHTML = sections.join('');
    bindKanjiReadingButtons(target, sourceElement);
    return data;
}

async function loadOverrideFile(assetKey) {
    const relativePath = getAssetPath(assetKey);
    return fetchJsonAsset(assetKey, relativePath, `Override file unavailable: ${relativePath}`);
}

async function loadOverrideData() {
    const [exactData, contextData] = await Promise.all([
        loadOverrideFile('exactOverrides'),
        loadOverrideFile('contextOverrides')
    ]);
    runtimeState.overrides = {};
    if (exactData && typeof exactData === 'object' && !Array.isArray(exactData)) {
        for (const [surface, output] of Object.entries(exactData)) {
            if (surface.startsWith('_') || typeof output !== 'string') continue;
            if (!isRule0RomajiEvidence(output)) {
                runtimeState.resourceWarnings.add(`Invalid exact override output: ${surface}`);
                continue;
            }
            runtimeState.overrides[canonicalizeTokenizerBoundaryCharacters(surface)] = normalizeReviewedRomaji(output);
        }
    }
    runtimeState.contextOverrides = [];
    if (!Array.isArray(contextData)) return;
    for (const item of contextData) {
        if (!item || !item.pattern || !item.surface || !item.romaji) continue;
        try {
            runtimeState.contextOverrides.push({ ...item, pattern: compileReviewedPattern(canonicalizeTokenizerBoundaryCharacters(item.pattern), 'i') });
        } catch (error) {
            console.warn(`Invalid contextual override pattern: ${item.pattern}`, error);
            runtimeState.resourceWarnings.add(`Invalid contextual override: ${item.pattern}`);
        }
    }
}

function buildContextOverrideIndex() {
    runtimeState.contextOverrideDictionary.clear();
    runtimeState.contextOverridePrefixes.clear();
    for (const override of runtimeState.contextOverrides) {
        const normalizedSurface = normalizeTranslatorInputText(override.surface);
        const indexedOverride = { ...override, normalizedSurface };
        const rules = runtimeState.contextOverrideDictionary.get(normalizedSurface) || [];
        rules.push(indexedOverride);
        runtimeState.contextOverrideDictionary.set(normalizedSurface, rules);
        addSurfacePrefixes(runtimeState.contextOverridePrefixes, normalizedSurface);
    }
}

