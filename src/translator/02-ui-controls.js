// Source section: Built-in UI references and display controls.
let statusBanner = null;
let inputArea = null;
let outputDiv = null;
let kanjiReadingsDiv = null;
let kanjiSearchInput = null;
let kanjiReadingConsumers = [];
const hasOwn = Object.prototype.hasOwnProperty;

function setVisibility(element, isVisible) {
    if (!element) return;
    element.hidden = !isVisible;
    element.style.display = isVisible ? '' : 'none';
    element.style.visibility = isVisible ? '' : 'hidden';
    element.setAttribute('aria-hidden', String(!isVisible));
    element.style.pointerEvents = isVisible ? 'auto' : 'none';
    if ('disabled' in element) /** @type {any} */ (element).disabled = !isVisible;
    if ('tabIndex' in element) element.tabIndex = isVisible ? 0 : -1;
}

function resolveKanjiConsumerElement(target, attributeName, fallback = null) {
    const selector = target.getAttribute?.(attributeName)?.trim();
    if (!selector) return fallback;
    try { return document.querySelector(selector); }
    catch { return null; }
}

function collectKanjiReadingConsumers(scanCustomTargets = false) {
    const explicitTargets = scanCustomTargets && typeof document.querySelectorAll === 'function'
        ? Array.from(document.querySelectorAll('[data-cj2r-kanji-readings]'))
        : [];
    if (kanjiReadingsDiv && !explicitTargets.includes(kanjiReadingsDiv)) explicitTargets.unshift(kanjiReadingsDiv);
    return explicitTargets.map(target => ({
        target,
        source: resolveKanjiConsumerElement(target, 'data-cj2r-kanji-source', inputArea),
        search: resolveKanjiConsumerElement(target, 'data-cj2r-kanji-search', kanjiSearchInput),
        isCustomTarget: target !== kanjiReadingsDiv
    }));
}

function sameKanjiReadingConsumers(previous, current) {
    return previous.length === current.length && previous.every((consumer, index) => {
        const next = current[index];
        return consumer.target === next.target && consumer.source === next.source && consumer.search === next.search;
    });
}

function refreshBuiltInUiReferences({ scanKanjiTargets = false } = {}) {
    const previous = [statusBanner, inputArea, outputDiv, kanjiReadingsDiv, kanjiSearchInput];
    const previousConsumers = kanjiReadingConsumers;
    const hadCustomKanjiTarget = previousConsumers.some(consumer => consumer.isCustomTarget);
    statusBanner = document.getElementById('status-banner');
    inputArea = document.getElementById('input');
    outputDiv = document.getElementById('output');
    kanjiReadingsDiv = document.getElementById('kanji-readings');
    kanjiSearchInput = document.getElementById('kanji-search');
    kanjiReadingConsumers = collectKanjiReadingConsumers(scanKanjiTargets || hadCustomKanjiTarget);

    setVisibility(statusBanner, true);
    const current = [statusBanner, inputArea, outputDiv, kanjiReadingsDiv, kanjiSearchInput];
    return current.some((element, index) => element !== previous[index])
        || !sameKanjiReadingConsumers(previousConsumers, kanjiReadingConsumers);
}

refreshBuiltInUiReferences({ scanKanjiTargets: true });

