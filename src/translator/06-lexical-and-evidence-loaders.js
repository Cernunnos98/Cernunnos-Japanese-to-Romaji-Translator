// Source section: Lexical banks, proper nouns, grammar and reading/Rendaku/historical evidence loaders.
const lexicalTermBankFiles = {
    commonWords: getAssetPaths('commonWords'),
    generalWords: getAssetPaths('generalWords'),
    loanwords: getAssetPaths('loanwords'),
    compoundWords: getAssetPaths('compoundWords'),
    ateji: getAssetPaths('ateji'),
    properNouns: getAssetPaths('properNouns'),
    reviewedProperNameSpans: getAssetPaths('reviewedProperNameSpans'),
    contextualReadings: getAssetPaths('contextualReadingEvidence'),
    titleReadings: getAssetPaths('titleReadingEvidence')
};

function normalizeDictionaryReading(value) {
    return normalizeEvidenceReading(value);
}

function normalizeDictionaryRomaji(value) {
    return normalizeReviewedRomaji(value);
}

function dictionaryValuesEqual(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
}

function setUniqueDictionaryEntry(target, key, value, label) {
    if (!target.has(key)) {
        target.set(key, value);
        return value;
    }
    const existing = target.get(key);
    if (!dictionaryValuesEqual(existing, value)) throw new Error(`Conflicting ${label} entries for ${key}`);
    return existing;
}

function setUniqueDictionaryProperty(target, key, value, label) {
    if (!Object.prototype.hasOwnProperty.call(target, key)) {
        target[key] = value;
        return value;
    }
    if (target[key] !== value) throw new Error(`Conflicting ${label} entries for ${key}`);
    return target[key];
}

function parseCompoundWordMatrix(data) {
    if (!Array.isArray(data)) return;
    for (const entry of data) {
        if (!Array.isArray(entry)) continue;
        const surface = String(entry[0] || '').trim();
        const reading = normalizeDictionaryReading(entry[1]);
        if (!surface || !reading) continue;
        const normalizedReading = normalizeKanaReading(reading);
        const compound = runtimeState.compoundWordDictionary.get(surface) || { readings: [] };
        if (!compound.readings.some(candidate => normalizeKanaReading(candidate.reading) === normalizedReading)) {
            compound.readings.push({ reading, romaji: convertToRomaji(reading) });
        }
        runtimeState.compoundWordDictionary.set(surface, compound);
    }
}

function finalizeCompoundWordDictionary() {
    for (const [surface, compound] of runtimeState.compoundWordDictionary.entries()) {
        if (compound.readings.length === 1) {
            compound.reading = compound.readings[0].reading;
            compound.romaji = compound.readings[0].romaji;
            registerKanaLexicalReadingEvidence(surface, compound.reading, 'compound-word');
        } else {
            compound.reading = null;
            compound.romaji = null;
        }
    }
}

async function loadCompoundWordDictionary() {
    for (const filePath of lexicalTermBankFiles.compoundWords) {
        const data = await fetchJsonAsset('compoundWords', filePath, `Compound-word term bank unavailable: ${filePath}`);
        if (Array.isArray(data)) parseCompoundWordMatrix(data);
    }
    finalizeCompoundWordDictionary();
}


async function loadContextualReadingEvidence() {
    runtimeState.contextFeatureGroups.clear();
    runtimeState.contextualReadingDictionary.clear();
    for (const filePath of lexicalTermBankFiles.contextualReadings) {
        const data = await fetchJsonAsset('contextualReadingEvidence', filePath, `Contextual reading evidence unavailable: ${filePath}`);
        if (!data || !Array.isArray(data.featureGroups) || !Array.isArray(data.entries)) continue;
        for (const group of data.featureGroups) {
            runtimeState.contextFeatureGroups.set(String(group.id), group.terms.map(item => ({ term: String(item.term), weight: Number(item.weight) })));
        }
        for (const entry of data.entries) {
            const surface = String(entry.surface || '').trim();
            if (!surface) continue;
            setUniqueDictionaryEntry(runtimeState.contextualReadingDictionary, surface, {
                window: Number(entry.window),
                minMargin: Number(entry.minMargin),
                source: String(entry.source),
                candidates: entry.candidates.map(candidate => ({
                    reading: normalizeDictionaryReading(candidate.reading),
                    features: candidate.features.map(String),
                    minScore: Number(candidate.minScore)
                }))
            }, 'contextual reading evidence');
        }
    }
}

async function loadCommonWordDictionary() {
    for (const filePath of lexicalTermBankFiles.commonWords) {
        const data = await fetchJsonAsset('commonWords', filePath, `Common-word term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(Array.isArray(entry) ? entry[0] : entry?.surface || '').trim();
            const reading = normalizeDictionaryReading(Array.isArray(entry) ? entry[1] : entry?.reading);
            const patternText = String(Array.isArray(entry) ? entry[2] || '' : entry?.pattern || '').trim();
            const romaji = Array.isArray(entry) ? null : normalizeDictionaryRomaji(entry?.romaji);
            const conjugationClass = Array.isArray(entry) ? '' : String(entry?.conjugationClass || '').trim();
            if (!surface || !reading) continue;
            let pattern = null;
            if (patternText) {
                try { pattern = compileReviewedPattern(patternText, 'u'); }
                catch (error) {
                    console.warn(`Invalid common-word pattern: ${patternText}`, error);
                    runtimeState.resourceWarnings.add(`Invalid common-word pattern: ${patternText}`);
                    continue;
                }
            }
            const rules = runtimeState.commonWordDictionary.get(surface) || [];
            rules.push({ reading, pattern, romaji: romaji || null, conjugationClass: conjugationClass || null });
            runtimeState.commonWordDictionary.set(surface, rules);
        }
    }
}

function buildReviewedCommonWordInflectionIndex() {
    runtimeState.commonWordInflectionDictionary.clear();
    runtimeState.commonWordInflectionPrefixes.clear();
    const register = (surface, reading, lemma, conjugationClass) => {
        if (!surface || !reading) return;
        setUniqueDictionaryEntry(runtimeState.commonWordInflectionDictionary, surface, { reading, lemma, conjugationClass }, 'reviewed common-word inflection');
        addSurfacePrefixes(runtimeState.commonWordInflectionPrefixes, surface);
    };
    for (const [surface, rules] of runtimeState.commonWordDictionary.entries()) {
        for (const rule of rules) {
            if (rule.pattern || rule.conjugationClass !== 'godan-ra') continue;
            const surfaceChars = Array.from(surface);
            const readingChars = Array.from(normalizeKanaReading(rule.reading));
            if (surfaceChars.at(-1) !== 'る' || readingChars.at(-1) !== 'る') continue;
            const surfaceStem = surfaceChars.slice(0, -1).join('');
            const readingStem = readingChars.slice(0, -1).join('');
            const endings = [
                ['る','る'], ['らない','らない'], ['らなかった','らなかった'], ['られる','られる'], ['られない','られない'],
                ['らせる','らせる'], ['らせたい','らせたい'], ['らせない','らせない'], ['らせた','らせた'], ['らせて','らせて'],
                ['ります','ります'], ['りました','りました'], ['りたい','りたい'], ['って','って'], ['った','った'],
                ['れば','れば'], ['れ','れ'], ['ろう','ろう']
            ];
            for (const [surfaceEnding, readingEnding] of endings) {
                register(surfaceStem + surfaceEnding, readingStem + readingEnding, surface, rule.conjugationClass);
            }
        }
    }
}

function registerKanaLexicalReadingEvidence(surface, reading, source) {
    const cleanSurface = String(surface || '').trim();
    const normalizedReading = normalizeKanaReading(reading || '').trim();
    if (!cleanSurface || !normalizedReading || !/^[ぁ-ゖー]+$/u.test(normalizedReading) || !containsHan(cleanSurface)) return;
    const existing = runtimeState.kanaLexicalReadingDictionary.get(normalizedReading) || { surfaces: new Set(), sources: new Set() };
    existing.surfaces.add(cleanSurface);
    existing.sources.add(source);
    runtimeState.kanaLexicalReadingDictionary.set(normalizedReading, existing);
    addSurfacePrefixes(runtimeState.kanaLexicalReadingPrefixes, normalizedReading);
}

async function loadGeneralWordDictionary() {
    for (const filePath of lexicalTermBankFiles.generalWords) {
        const data = await fetchJsonAsset('generalWords', filePath, `General-word term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            if (!Array.isArray(entry)) continue;
            const surface = String(entry[0] || '').trim();
            const rawReadings = Array.isArray(entry[1]) ? entry[1] : [];
            const mergeSafe = Boolean(entry[2]);
            if (!surface || !rawReadings.length) continue;
            const readings = rawReadings.map(item => ({
                reading: normalizeDictionaryReading(Array.isArray(item) ? item[0] : ''),
                score: Number(Array.isArray(item) ? item[1] || 0 : 0)
            })).filter(item => item.reading).sort((a, b) => b.score - a.score);
            if (!readings.length) continue;
            setUniqueDictionaryEntry(runtimeState.generalWordDictionary, surface, { readings, mergeSafe }, 'general-word');
            if (mergeSafe) {
                for (const item of readings) registerKanaLexicalReadingEvidence(surface, item.reading, 'general-word');
            }
            const chars = Array.from(surface);
            for (let length = 1; length <= chars.length; length += 1) {
                runtimeState.generalWordPrefixes.add(chars.slice(0, length).join(''));
            }
        }
    }
}

async function loadLoanwordDictionary() {
    for (const filePath of lexicalTermBankFiles.loanwords) {
        const data = await fetchJsonAsset('loanwords', filePath, `Loanword term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(Array.isArray(entry) ? entry[0] : entry?.surface || '').trim();
            const output = normalizeDictionaryRomaji(Array.isArray(entry) ? entry[1] : entry?.output);
            if (!surface || !output) continue;
            setUniqueDictionaryEntry(runtimeState.loanwordDictionary, surface, output, 'loanword');
            const category = Array.isArray(entry) ? '' : String(entry?.category || '').trim();
            if (category) setUniqueDictionaryEntry(runtimeState.loanwordMetadataDictionary, surface, { category }, 'loanword metadata');
        }
    }
}

async function loadAtejiDictionary() {
    for (const filePath of lexicalTermBankFiles.ateji) {
        const data = await fetchJsonAsset('ateji', filePath, `Ateji term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            if (!Array.isArray(entry)) continue;
            const surface = String(entry[0] || '').trim();
            const reading = normalizeDictionaryReading(entry[1]);
            if (!surface || !reading) continue;
            setUniqueDictionaryEntry(runtimeState.atejiDictionary, surface, reading, 'ateji');
            const chars = Array.from(surface);
            for (let length = 1; length <= chars.length; length += 1) runtimeState.atejiPrefixes.add(chars.slice(0, length).join(''));
        }
    }
}

function parseProperNounReadingHints(entry) {
    const hints = [];
    const labels = Array.isArray(entry?.[5]) ? entry[5] : [];
    for (const label of labels) {
        const match = String(label || '').match(/^([ぁ-ゖァ-ヶー]+)\s*\((\d+(?:\.\d+)?)%\)\s*-\s*([A-Za-z-]+)/u);
        if (!match) continue;
        hints.push({ reading: match[1], weight: Number(match[2]), category: match[3] });
    }
    return hints;
}

function registerProperNounCandidate(surface, reading, metadata = {}) {
    const cleanSurface = String(surface || '').trim();
    const cleanReading = normalizeDictionaryReading(reading);
    if (!cleanSurface || !cleanReading) return;
    addSurfacePrefixes(runtimeState.properNounPrefixes, cleanSurface);
    const normalized = normalizeKanaReading(cleanReading);
    let candidates = runtimeState.properNounDictionary.get(cleanSurface);
    if (!candidates) {
        candidates = new Map();
        runtimeState.properNounDictionary.set(cleanSurface, candidates);
    }
    const existing = candidates.get(normalized) || {
        reading: cleanReading,
        romaji: convertToRomaji(cleanReading),
        weight: 0,
        rank: Number.POSITIVE_INFINITY,
        categories: new Set(),
        sources: new Set()
    };
    existing.weight = Math.max(existing.weight, Number(metadata.weight || 0));
    const rank = Number(metadata.rank || 0);
    if (rank > 0) existing.rank = Math.min(existing.rank, rank);
    if (metadata.category) existing.categories.add(String(metadata.category));
    if (metadata.source) existing.sources.add(String(metadata.source));
    candidates.set(normalized, existing);
}

function getProperNounSourceRank(entry) {
    if (!Array.isArray(entry)) return 0;
    const value = Number(entry.length > 6 ? entry[6] : entry[3]);
    return Number.isFinite(value) && value > 0 ? value : 0;
}

function registerProperNounEntry(entry, sourceName) {
    if (isPlainObject(entry)) {
        const surface = String(entry.surface || '').trim();
        const rank = Number(entry.rank || 0);
        if (!surface || !Array.isArray(entry.readings)) return;
        for (const candidate of entry.readings) {
            const reading = normalizeDictionaryReading(candidate?.reading);
            if (!reading) continue;
            const categories = Array.isArray(candidate.categories) ? candidate.categories : [];
            if (!categories.length) {
                registerProperNounCandidate(surface, reading, { source: sourceName, weight: candidate.weight, rank });
                continue;
            }
            for (const category of categories) {
                registerProperNounCandidate(surface, reading, { category, source: sourceName, weight: candidate.weight, rank });
            }
        }
        return;
    }
    if (!Array.isArray(entry) || !entry[0] || !entry[1]) return;
    const surface = String(entry[0]).trim();
    const reading = normalizeDictionaryReading(entry[1]);
    const category = String(entry[2] || '').trim();
    if (!surface || !reading) return;
    const hints = parseProperNounReadingHints(entry);
    const normalizedReading = normalizeKanaReading(reading);
    const directHint = hints.find(hint => normalizeKanaReading(hint.reading) === normalizedReading);
    const rank = getProperNounSourceRank(entry);
    registerProperNounCandidate(surface, reading, {
        category, source: sourceName, weight: directHint ? directHint.weight : 100, rank
    });
    for (const hint of hints) {
        registerProperNounCandidate(surface, hint.reading, {
            category: hint.category || category, source: sourceName, weight: hint.weight, rank
        });
    }
}

async function loadReviewedProperNameSpanEvidence() {
    for (const filePath of lexicalTermBankFiles.reviewedProperNameSpans) {
        const data = await fetchJsonAsset('reviewedProperNameSpans', filePath, `Reviewed proper-name span evidence unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(entry?.surface || '').trim().replace(/\s+/gu, ' ');
            const reading = normalizeDictionaryReading(entry?.reading);
            const romaji = normalizeDictionaryRomaji(entry?.romaji);
            const category = String(entry?.category || '').trim();
            if (!surface || !reading || !romaji || !category) continue;
            setUniqueDictionaryEntry(runtimeState.reviewedProperNameSpanDictionary, surface, { reading, romaji, category }, 'reviewed proper-name span');
            const chars = Array.from(surface);
            for (let length = 1; length <= chars.length; length += 1) runtimeState.reviewedProperNameSpanPrefixes.add(chars.slice(0, length).join(''));
        }
    }
}

function buildLexicalPrefixIndexes() {
    runtimeState.commonWordPrefixes.clear();
    runtimeState.loanwordPrefixes.clear();

    // Reviewed common-word evidence is authored against source orthography, but an
    // earlier exact-dictionary rescue may canonicalise a kanji variant (for example
    // 龍 → 竜). Register a canonical lookup alias only when no explicit canonical
    // rule exists. This keeps explicit evidence authoritative while allowing later
    // reviewed lexical spans to survive harmless orthographic normalisation.
    const commonWordEntries = [...runtimeState.commonWordDictionary.entries()];
    const commonWordVariantAliases = new Map();
    for (const [surface, rules] of commonWordEntries) {
        const normalizedSurface = normalizeKanjiForLookup(surface);
        if (!normalizedSurface || normalizedSurface === surface || runtimeState.commonWordDictionary.has(normalizedSurface)) continue;
        if (!commonWordVariantAliases.has(normalizedSurface)) commonWordVariantAliases.set(normalizedSurface, rules);
        else if (commonWordVariantAliases.get(normalizedSurface) !== rules) commonWordVariantAliases.set(normalizedSurface, null);
    }
    for (const [normalizedSurface, rules] of commonWordVariantAliases) {
        if (rules) runtimeState.commonWordDictionary.set(normalizedSurface, rules);
    }

    for (const surface of runtimeState.commonWordDictionary.keys()) {
        addSurfacePrefixes(runtimeState.commonWordPrefixes, surface);
        addSurfacePrefixes(runtimeState.commonWordPrefixes, normalizeKanjiForLookup(surface));
    }
    buildReviewedCommonWordInflectionIndex();

    const titleReadingRules = [...runtimeState.titleReadingDictionary.values()].flat();
    runtimeState.titleReadingDictionary.clear();
    runtimeState.titleReadingPrefixes.clear();
    for (const rule of titleReadingRules) {
        const normalizedSurface = normalizeTranslatorInputText(rule.surface);
        if (!normalizedSurface) continue;
        const normalizedPatternText = normalizeReviewedPatternKanjiLiterals(canonicalizeTokenizerBoundaryCharacters(rule.patternText));
        try { rule.pattern = compileReviewedPattern(normalizedPatternText, 'i'); }
        catch (error) {
            console.warn(`Invalid normalized title-reading pattern: ${rule.patternText}`, error);
            runtimeState.resourceWarnings.add(`Invalid normalized title-reading evidence: ${rule.patternText}`);
            continue;
        }
        const rules = runtimeState.titleReadingDictionary.get(normalizedSurface) || [];
        rules.push(rule);
        runtimeState.titleReadingDictionary.set(normalizedSurface, rules);
        addSurfacePrefixes(runtimeState.titleReadingPrefixes, normalizedSurface);
    }

    const loanwordEntries = [...runtimeState.loanwordDictionary.entries()];
    for (const [surface, output] of loanwordEntries) {
        const normalizedSurface = normalizeTranslatorInputText(surface);
        if (normalizedSurface && normalizedSurface !== surface) {
            const existingOutput = runtimeState.loanwordDictionary.get(normalizedSurface);
            if (!existingOutput) {
                runtimeState.loanwordDictionary.set(normalizedSurface, output);
                const metadata = runtimeState.loanwordMetadataDictionary.get(surface);
                if (metadata) runtimeState.loanwordMetadataDictionary.set(normalizedSurface, metadata);
            } else if (existingOutput !== output) {
                runtimeState.resourceWarnings.add(`Loanword normalization alias conflict: ${surface} -> ${normalizedSurface}`);
            }
        }
    }

    for (const surface of runtimeState.loanwordDictionary.keys()) {
        addSurfacePrefixes(runtimeState.loanwordPrefixes, surface);
        addSurfacePrefixes(runtimeState.loanwordPrefixes, normalizeKanjiForLookup(surface));
    }
}


function normalizeReviewedPatternKanjiLiterals(patternText) {
    return Array.from(String(patternText || '')).map(character =>
        isHanCharacter(character) ? normalizeKanjiForLookup(character) : character
    ).join('');
}

async function loadTitleReadingEvidence() {
    runtimeState.titleReadingDictionary.clear();
    runtimeState.titleReadingPrefixes.clear();
    for (const filePath of lexicalTermBankFiles.titleReadings) {
        const data = await fetchJsonAsset('titleReadingEvidence', filePath, `Title-reading evidence unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) {
            const surface = String(entry?.surface || '').trim().normalize('NFC');
            const patternText = String(entry?.pattern || '').trim();
            const kind = String(entry?.kind || 'title-reading');
            const silentSeparator = kind === 'title-separator-silent';
            if (!surface || !patternText || (!silentSeparator && !entry?.romaji)) continue;
            try {
                const rule = {
                    surface,
                    patternText,
                    pattern: compileReviewedPattern(canonicalizeTokenizerBoundaryCharacters(patternText), 'i'),
                    reading: entry.reading ? normalizeEvidenceReading(entry.reading) : null,
                    romaji: silentSeparator ? '' : normalizeReviewedRomaji(entry.romaji),
                    kind,
                    source: String(entry.source || 'reviewed-title-reading')
                };
                const rules = runtimeState.titleReadingDictionary.get(surface) || [];
                rules.push(rule);
                runtimeState.titleReadingDictionary.set(surface, rules);
                addSurfacePrefixes(runtimeState.titleReadingPrefixes, surface);
            } catch (error) {
                console.warn(`Invalid title-reading pattern: ${entry.pattern}`, error);
                runtimeState.resourceWarnings.add(`Invalid title-reading evidence: ${entry.pattern}`);
            }
        }
    }
}

async function loadLexicalTermBanks() {
    await settleStartedJobs([
        loadCommonWordDictionary(),
        loadContextualReadingEvidence(),
        loadGeneralWordDictionary(),
        loadLoanwordDictionary(),
        loadCompoundWordDictionary(),
        loadAtejiDictionary(),
        loadTitleReadingEvidence()
    ]);
    await loadReviewedProperNameSpanEvidence();
    for (const filePath of lexicalTermBankFiles.properNouns) {
        const data = await fetchJsonAsset('properNouns', filePath, `Proper-noun term bank unavailable: ${filePath}`);
        if (!Array.isArray(data)) continue;
        for (const entry of data) registerProperNounEntry(entry, filePath);
    }
}

function buildKnownPhraseDictionary() {
    const next = new Map();
    for (const [surface, romaji] of Object.entries(fallbackGrammaticalExpressionMap).sort(([left], [right]) => left.localeCompare(right, 'ja'))) {
        next.set(surface, romaji);
    }
    for (const [surface, entry] of [...runtimeState.compoundWordDictionary.entries()].sort(([left], [right]) => left.localeCompare(right, 'ja'))) {
        if (entry?.reading && entry?.romaji) next.set(surface, entry.romaji);
    }
    // Loaded grammar is authoritative over fallback lexical phrases.
    for (const [surface, romaji] of Object.entries(runtimeState.particleExpressions).sort(([left], [right]) => left.localeCompare(right, 'ja'))) {
        next.set(surface, romaji);
    }
    runtimeState.knownPhraseDictionary.clear();
    runtimeState.knownPhrasePrefixes.clear();
    for (const [surface, romaji] of next) {
        runtimeState.knownPhraseDictionary.set(surface, romaji);
        addSurfacePrefixes(runtimeState.knownPhrasePrefixes, surface);
    }

    runtimeState.grammaticalExpressionDictionary.clear();
    runtimeState.grammaticalExpressionPrefixes.clear();
    const grammarEntries = [
        ...Object.entries(fallbackGrammaticalExpressionMap),
        ...Object.entries(runtimeState.particleExpressions)
    ];
    for (const [surface, romaji] of grammarEntries) {
        runtimeState.grammaticalExpressionDictionary.set(surface, romaji);
        addSurfacePrefixes(runtimeState.grammaticalExpressionPrefixes, surface);
    }
}

function registerAuthoritativeSpanEvidence(surface, evidence) {
    const cleanSurface = String(surface || '').trim();
    if (!cleanSurface || !evidence) return;
    const lookupSurfaces = new Set([cleanSurface, normalizeKanjiForLookup(cleanSurface)]);
    if (evidence.nameVariants) lookupSurfaces.add(normalizeKanjiForLookup(cleanSurface, { names: true }));

    for (const lookupSurface of lookupSurfaces) {
        if (!lookupSurface) continue;
        const existing = runtimeState.authoritativeSpanDictionary.get(lookupSurface);
        if (!existing || Number(evidence.priority || 0) > Number(existing.priority || 0)) {
            runtimeState.authoritativeSpanDictionary.set(lookupSurface, { ...evidence, surface: cleanSurface });
        }
        const characters = Array.from(lookupSurface);
        for (let length = 1; length <= characters.length; length += 1) {
            runtimeState.authoritativeSpanPrefixes.add(characters.slice(0, length).join(''));
        }
    }
}

function buildAuthoritativeSpanIndex() {
    runtimeState.authoritativeSpanDictionary.clear();
    runtimeState.authoritativeSpanPrefixes.clear();

    for (const [surface, entry] of runtimeState.generalWordDictionary.entries()) {
        if (entry?.readings?.length !== 1) continue;
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.readings[0].reading,
            source: 'single-reading-general-word-evidence',
            confidence: 0.98,
            priority: 70,
            category: 'general-word'
        });
    }
    for (const [surface, entry] of runtimeState.compoundWordDictionary.entries()) {
        if (!entry.reading) continue;
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'compound-word-evidence',
            confidence: 0.98,
            priority: 80,
            category: 'compound-word'
        });
    }
    for (const [surface, reading] of runtimeState.atejiDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading,
            source: 'ateji-lexicon',
            confidence: 0.99,
            priority: 95,
            category: 'ateji'
        });
    }
    for (const [surface, output] of runtimeState.loanwordDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            romaji: output,
            source: 'source-language-loanword',
            confidence: 1,
            priority: 90,
            category: 'loanword',
            loanwordCategory: runtimeState.loanwordMetadataDictionary.get(surface)?.category || null
        });
    }
    for (const [surface, entry] of runtimeState.reviewedProperNameSpanDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'reviewed-proper-name-span',
            confidence: 1,
            priority: 100,
            category: 'reviewed-name',
            nameVariants: true
        });
    }
    for (const [surface, entry] of runtimeState.counterDateReadingDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'counter-date-reading-evidence',
            confidence: 1,
            priority: 100,
            category: 'counter-date'
        });
    }
    for (const [surface, entry] of runtimeState.reviewedReadingSpanDictionary.entries()) {
        registerAuthoritativeSpanEvidence(surface, {
            reading: entry.reading,
            romaji: entry.romaji,
            source: 'reviewed-reading-span',
            confidence: 1,
            priority: 99,
            category: 'reviewed-reading',
            reviewRequired: Boolean(entry.reviewRequired)
        });
    }
}

async function loadCounterDateEvidence() {
    const data = await fetchJsonAsset('counterDateEvidence', getAssetPath('counterDateEvidence'), 'Counter/date reading evidence unavailable');
    if (!Array.isArray(data)) return;
    runtimeState.counterDateReadingDictionary.clear();
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const aliases = Array.isArray(entry?.aliases) ? entry.aliases.map(value => String(value || '').trim()).filter(Boolean) : [];
        const reading = normalizeDictionaryReading(entry?.reading);
        const romaji = normalizeDictionaryRomaji(entry?.romaji);
        if (!surface || !reading || !romaji) continue;
        for (const reviewedSurface of [surface, ...aliases]) {
            setUniqueDictionaryEntry(runtimeState.counterDateReadingDictionary, reviewedSurface, { reading, romaji }, 'counter/date');
        }
    }
}

function replaceSetContents(target, values) {
    if (!Array.isArray(values) || !values.length) return;
    target.clear();
    values.map(value => String(value || '').trim()).filter(Boolean).forEach(value => target.add(value));
}

async function loadGrammarConfiguration() {
    const [expressions, conjugation] = await settleStartedJobs([
        fetchJsonAsset('particleExpressions', getAssetPath('particleExpressions'), 'Particle-expression configuration unavailable'),
        fetchJsonAsset('conjugationPatterns', getAssetPath('conjugationPatterns'), 'Conjugation-pattern configuration unavailable')
    ]);
    if (Array.isArray(expressions)) {
        for (const entry of expressions) {
            const surface = String(entry?.surface || '').trim();
            const romaji = normalizeDictionaryRomaji(entry?.romaji);
            if (!surface || !romaji) continue;
            setUniqueDictionaryProperty(runtimeState.particleExpressions, surface, romaji, 'particle expression');
        }
    }
    replaceSetContents(runtimeState.conjugationJoinEndings, conjugation?.joinEndings);
    replaceSetContents(runtimeState.auxiliarySpacingSurfaces, conjugation?.auxiliarySpacing);
    replaceSetContents(runtimeState.auxiliarySpacingBasicForms, conjugation?.auxiliarySpacingBasicForms);
    replaceSetContents(runtimeState.contractedAuxiliaryBasicForms, conjugation?.contractedAuxiliaryBasicForms);
    replaceSetContents(runtimeState.capitalizedAuxiliarySurfaces, conjugation?.capitalizedAuxiliaries);
}

async function loadReadingEvidence() {
    const data = await fetchJsonAsset('readingEvidence', getAssetPath('readingEvidence'), 'Reading-evidence bank unavailable');
    if (!Array.isArray(data)) return;
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const preferredReading = normalizeDictionaryReading(entry?.preferredReading);
        const alternatives = Array.isArray(entry?.alternatives) ? entry.alternatives : [];
        if (!surface || !preferredReading || !alternatives.length) continue;
        setUniqueDictionaryEntry(runtimeState.readingEvidenceDictionary, surface, {
            preferredReading,
            preferredPriority: Number(entry.preferredPriority || 0),
            preferredRank: Number(entry.preferredRank || 0),
            alternatives: alternatives.map(item => ({
                reading: normalizeDictionaryReading(item?.[0]),
                priority: Number(item?.[1] || 0),
                rank: Number(item?.[2] || 0)
            })).filter(item => item.reading)
        }, 'reading evidence');
    }
}


async function loadReviewedReadingEvidence() {
    const data = await fetchJsonAsset('reviewedReadingEvidence', getAssetPath('reviewedReadingEvidence'), 'Reviewed reading evidence unavailable');
    if (!data || !Array.isArray(data.preferences) || !Array.isArray(data.spans)) return;
    runtimeState.reviewedReadingPreferenceDictionary.clear();
    runtimeState.reviewedReadingSpanDictionary.clear();
    for (const entry of data.preferences) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        const alternatives = Array.isArray(entry?.alternatives)
            ? entry.alternatives.map(normalizeDictionaryReading).filter(Boolean)
            : [];
        if (!surface || !reading) continue;
        setUniqueDictionaryEntry(runtimeState.reviewedReadingPreferenceDictionary, surface, {
            reading,
            alternatives,
            numericCanonical: String(entry?.numericCanonical || '').trim() || null,
            numericRole: String(entry?.numericRole || '').trim() || null,
            note: String(entry?.note || '').trim()
        }, 'reviewed reading preference');
    }
    for (const entry of data.spans) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        const romaji = normalizeDictionaryRomaji(entry?.romaji || (reading ? convertToRomaji(reading) : ''));
        if (!surface || !reading || !romaji) continue;
        setUniqueDictionaryEntry(runtimeState.reviewedReadingSpanDictionary, surface, {
            reading,
            romaji,
            reviewRequired: Boolean(entry?.reviewRequired),
            note: String(entry?.note || '').trim()
        }, 'reviewed reading span');
    }
}

async function loadRendakuEvidence() {
    const data = await fetchJsonAsset('rendakuEvidence', getAssetPath('rendakuEvidence'), 'Rendaku evidence unavailable');
    if (!Array.isArray(data)) return;
    for (const entry of data) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        if (!surface || !reading) continue;
        setUniqueDictionaryEntry(runtimeState.rendakuEvidenceDictionary, surface, {
            reading,
            rendaku: Boolean(entry?.rendaku),
            source: String(entry?.source || '').trim(),
            note: String(entry?.note || '').trim()
        }, 'Rendaku evidence');
        const characters = Array.from(surface);
        for (let length = 1; length <= characters.length; length += 1) {
            runtimeState.rendakuEvidencePrefixes.add(characters.slice(0, length).join(''));
        }
    }
}

async function loadHistoricalKanaEvidence() {
    const data = await fetchJsonAsset('historicalKanaEvidence', getAssetPath('historicalKanaEvidence'), 'Historical-kana evidence unavailable');
    const entries = Array.isArray(data) ? data : data?.entries;
    if (!Array.isArray(entries)) return;
    for (const entry of entries) {
        const surface = String(entry?.surface || '').trim();
        const reading = normalizeDictionaryReading(entry?.reading);
        if (!surface || !reading || !/^[ぁ-ゖァ-ンヴー]+$/u.test(reading)) continue;
        setUniqueDictionaryEntry(runtimeState.historicalKanaEvidenceDictionary, surface, {
            reading,
            pos: String(entry?.pos || '名詞').trim() || '名詞',
            source: String(entry?.source || '').trim(),
            sourceType: String(entry?.sourceType || '').trim(),
            note: String(entry?.note || '').trim()
        }, 'historical-kana evidence');
        const characters = Array.from(surface);
        for (let length = 1; length <= characters.length; length += 1) {
            runtimeState.historicalKanaEvidencePrefixes.add(characters.slice(0, length).join(''));
        }
    }
}

