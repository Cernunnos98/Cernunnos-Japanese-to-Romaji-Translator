(function () {
    'use strict';

    const smokeMode = window.CJ2R_BROWSER_SMOKE_MODE || 'dev';
    const lateDomMode = smokeMode === 'late-dom';
    const lateDomInitialControlsAbsent = !document.getElementById('input');

    const expected = {
        sync: "Zen'in Matomete Boku no Mono",
        asyncResult: 'Mushoku Tensei ~Isekai Ittara Honki Dasu~',
        apostrophe: "Gen'ei",
        wave: 'Toukyou ~ Oosaka',
        builtin: 'Kore wa "Test" desu.',
        quoteNormal: '"Neko"',
        quoteMixed: '"\'Neko\'"',
        quoteSameStyleNested: '""Neko""',
        asciiNestedQuoteGuard: '"" Neko ""',
        bound: 'Gakkou ni Iku',
        orthographicPronunciation: 'Aruiwa',
        mixedOrthographicPronunciation: 'Aruiwa',
        kanaPronunciationGuard: 'Kouiu',
        kanaPronunciationPunctuationGuard: 'Kouiu.',
        exactNameRescue: 'Mitsuo',
        exactNameContextGuard: 'Mitsu o Taberu',
        historicalWokashi: 'Okashi',
        historicalSentence: 'Kyou wa Hare',
        historicalBoundary: 'Koe o Kiku',
        historicalModernGuard: 'Hon o Yomu'
    };

    function writeResult(result) {
        window.browserSmokeResult = result;
        const output = document.getElementById('browser-smoke-result');
        if (output) output.textContent = JSON.stringify(result, null, 2);
    }

    function builtInUiMarkup() {
        return `
            <div id="status-banner">Loading</div>
            <textarea id="input" disabled></textarea>
            <div id="output"></div>
            <div id="kanji-readings" data-cj2r-kanji-readings data-cj2r-kanji-source="#input" data-cj2r-kanji-search="#kanji-search"></div>
            <input id="kanji-search" type="text">
            <label id="override-control">
                <input id="overrides-enabled" type="checkbox" checked>
                <span id="override-text">Override Enabled</span>
            </label>
            <div id="license-notice"></div>`;
    }

    async function replaceBuiltInUi() {
        const container = document.getElementById('built-in-ui');
        if (!container) throw new Error('Built-in UI container is unavailable.');
        container.innerHTML = builtInUiMarkup();
        await new Promise(resolve => setTimeout(resolve, 30));
        return document.getElementById('input');
    }

    async function runBrowserSmokeTest() {
        const result = { ok: false, checks: {} };
        try {
            if (!window.RomajiTranslator) throw new Error('RomajiTranslator was not exposed.');
            await window.RomajiTranslator.ready;

            if (lateDomMode) await replaceBuiltInUi();

            result.checks.ready = window.RomajiTranslator.isReady() === true;
            result.checks.lateDomInitialAbsence = !lateDomMode || lateDomInitialControlsAbsent;
            result.checks.lateDomActivation = !lateDomMode || document.getElementById('input')?.disabled === false;
            result.checks.syncReadinessGuard = window.browserEarlySyncGuard === true;
            result.checks.regressions = (window.RomajiTranslator.getDiagnostics().regressionFailures?.length ?? 0) === 0;
            result.checks.sync = window.RomajiTranslator.translateSync('全員まとめて僕のもの') === expected.sync;
            result.checks.async = await window.RomajiTranslator.translate('無職転生 ～異世界行ったら本気だす～') === expected.asyncResult;
            result.checks.apostrophe = await window.RomajiTranslator.translate('幻影') === expected.apostrophe;
            result.checks.wave = await window.RomajiTranslator.translate('東京～大阪') === expected.wave;
            result.checks.quoteNormal = await window.RomajiTranslator.translate('「猫」') === expected.quoteNormal;
            result.checks.quoteMixed = await window.RomajiTranslator.translate('「『猫』」') === expected.quoteMixed;
            result.checks.quoteSameStyleNested = await window.RomajiTranslator.translate('「「猫」」') === expected.quoteSameStyleNested;
            result.checks.asciiNestedQuoteGuard = await window.RomajiTranslator.translate('""猫""') === expected.asciiNestedQuoteGuard;
            result.checks.orthographicPronunciation = await window.RomajiTranslator.translate('あるいは') === expected.orthographicPronunciation;
            result.checks.mixedOrthographicPronunciation = await window.RomajiTranslator.translate('或いは') === expected.mixedOrthographicPronunciation;
            result.checks.kanaPronunciationGuard = await window.RomajiTranslator.translate('こういう') === expected.kanaPronunciationGuard;
            result.checks.kanaPronunciationPunctuationGuard = await window.RomajiTranslator.translate('こういう。') === expected.kanaPronunciationPunctuationGuard;
            result.checks.exactNameRescue = await window.RomajiTranslator.translate('みつを') === expected.exactNameRescue;
            result.checks.exactNameContextGuard = await window.RomajiTranslator.translate('みつを食べる') === expected.exactNameContextGuard;
            result.checks.historicalWokashi = await window.RomajiTranslator.translateHistorical('をかし') === expected.historicalWokashi;
            result.checks.historicalSentence = window.RomajiTranslator.translateHistoricalSync('けふは晴れ') === expected.historicalSentence;
            result.checks.historicalBoundary = await window.RomajiTranslator.translateHistorical('こゑを聞く') === expected.historicalBoundary;
            result.checks.historicalModernGuard = await window.RomajiTranslator.translateHistorical('本を読む') === expected.historicalModernGuard;

            const auditProbe = await window.RomajiTranslator.translateWithAudit('克寿');
            result.checks.auditApi = Boolean(
                auditProbe?.romaji
                && auditProbe?.audit
                && Array.isArray(auditProbe.audit.readings)
                && typeof auditProbe.audit.requiresReview === 'boolean'
            );
            const historicalAuditProbe = window.RomajiTranslator.translateWithAuditSync('をかし', { historicalKana: true });
            result.checks.auditHistorical = historicalAuditProbe?.romaji === expected.historicalWokashi
                && historicalAuditProbe?.audit?.sourceText === 'をかし';
            const normalizedAuditProbe = await window.RomajiTranslator.translateWithAudit('ｶﾀｶﾅ');
            result.checks.auditSourceContract = normalizedAuditProbe?.romaji === 'Katakana'
                && normalizedAuditProbe?.audit?.sourceText === 'ｶﾀｶﾅ'
                && normalizedAuditProbe?.audit?.normalizedSourceText === 'カタカナ';

            const kanjiApi = await window.RomajiTranslator.getKanjiReadings('日', { search: '月' });
            const kanjiApiSync = window.RomajiTranslator.getKanjiReadingsSync('日');
            result.checks.kanjiDirectApi = kanjiApi.input[0]?.character === '日'
                && kanjiApi.input[0]?.position === 0
                && kanjiApi.search[0]?.character === '月'
                && kanjiApiSync.input[0]?.character === '日';

            const customKanjiSource = document.createElement('textarea');
            customKanjiSource.id = 'custom-kanji-source';
            const customKanjiSearch = document.createElement('input');
            customKanjiSearch.id = 'custom-kanji-search';
            const customKanjiTarget = document.createElement('div');
            customKanjiTarget.id = 'custom-kanji-target';
            customKanjiTarget.setAttribute('data-cj2r-kanji-readings', '');
            customKanjiTarget.setAttribute('data-cj2r-kanji-source', '#custom-kanji-source');
            customKanjiTarget.setAttribute('data-cj2r-kanji-search', '#custom-kanji-search');
            document.body.append(customKanjiSource, customKanjiSearch, customKanjiTarget);
            window.RomajiTranslator.refreshUi();
            await new Promise(resolve => setTimeout(resolve, 30));
            customKanjiSource.value = '日';
            customKanjiSource.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 50));
            result.checks.kanjiCustomTarget = Array.from(customKanjiTarget.querySelectorAll('.kanji-character')).some(element => element.textContent === '日');
            customKanjiTarget.remove();
            customKanjiSource.remove();
            customKanjiSearch.remove();
            await new Promise(resolve => setTimeout(resolve, 30));
            result.checks.kanjiTargetRemoval = !document.querySelector('#custom-kanji-target');

            const dynamicScripts = Array.from(document.querySelectorAll('script[src]')).filter(script => /(?:kuromoji\.js|translator-qa\.js)$/.test(new URL(script.src).pathname));
            result.checks.cspNoncePropagation = dynamicScripts.length > 0
                && dynamicScripts.every(script => script.nonce === 'cj2r-browser-smoke-nonce');
            const expectedAssetBase = window.CJ2R_EXPECTED_ASSET_BASE || null;
            const assetResources = performance.getEntriesByType('resource').map(entry => entry.name);
            result.checks.configuredAssetBase = smokeMode !== 'production'
                || (Boolean(expectedAssetBase) && assetResources.some(url => url.startsWith(expectedAssetBase) && /kuromoji\.js$/.test(new URL(url).pathname)));

            const qaBridgeSymbol = Symbol.for('CJ2R.translator.runtime-diagnostics.bridge');
            result.checks.namespaceIsolation = typeof window.runtimeState === 'undefined'
                && typeof window.translateText === 'undefined'
                && typeof window.convertToRomaji === 'undefined'
                && !window[qaBridgeSymbol];

            const originalApi = window.RomajiTranslator;
            const dependencyCountBefore = performance.getEntriesByType('resource').filter(entry => /(?:kuromoji\.js|translator-qa\.js)$/.test(new URL(entry.name).pathname)).length;
            const engineScript = Array.from(document.querySelectorAll('script[src]')).find(script => /translator-engine\.js$/.test(new URL(script.src).pathname));
            const reload = document.createElement('script');
            reload.src = engineScript?.src || '../../../translator-engine.js';
            reload.nonce = engineScript?.nonce || '';
            await new Promise((resolve, reject) => {
                reload.onload = resolve;
                reload.onerror = () => reject(new Error('Second engine load failed.'));
                document.head.appendChild(reload);
            });
            await new Promise(resolve => setTimeout(resolve, 30));
            const dependencyCountAfter = performance.getEntriesByType('resource').filter(entry => /(?:kuromoji\.js|translator-qa\.js)$/.test(new URL(entry.name).pathname)).length;
            result.checks.doubleLoadIdempotent = window.RomajiTranslator === originalApi
                && dependencyCountAfter === dependencyCountBefore;

            const field = document.getElementById('input');
            const output = document.getElementById('output');
            field.value = 'これは「テスト」です。';
            field.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 60));
            result.checks.builtin = output.textContent === expected.builtin;

            const replacementField = await replaceBuiltInUi();
            const replacementOutput = document.getElementById('output');
            replacementField.value = 'これは「テスト」です。';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 60));
            result.checks.spaReplacement = replacementField.disabled === false
                && replacementOutput.textContent === expected.builtin;

            replacementField.value = '日日';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 30));
            const duplicateItems = Array.from(document.querySelectorAll('#kanji-readings .kanji-reading-item'));
            const secondHiButton = duplicateItems[1]
                ? Array.from(duplicateItems[1].querySelectorAll('.kanji-reading-button')).find(button => /Hi \(ひ\)/.test(button.textContent || ''))
                : null;
            secondHiButton?.click();
            await new Promise(resolve => setTimeout(resolve, 30));
            result.checks.kanjiSecondOccurrence = replacementField.value === '日ひ';

            replacementField.value = '𠮷';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 30));
            result.checks.kanjiSupplementaryHan = Array.from(document.querySelectorAll('#kanji-readings .kanji-character'))
                .some(element => element.textContent === '𠮷');

            const readingsTarget = document.getElementById('kanji-readings');
            let readingMutations = 0;
            const readingsObserver = new MutationObserver(() => { readingMutations += 1; });
            readingsObserver.observe(readingsTarget, { childList: true, subtree: true });
            replacementField.value = '学校';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 50));
            readingsObserver.disconnect();
            result.checks.kanjiSingleRefresh = readingMutations <= 1;

            replacementOutput.textContent = 'debounce-sentinel';
            let outputMutations = 0;
            const outputObserver = new MutationObserver(() => { outputMutations += 1; });
            outputObserver.observe(replacementOutput, { childList: true, characterData: true, subtree: true });
            replacementField.value = '学校';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            replacementField.value = '学校に';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            replacementField.value = '学校に行く';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            const debounceImmediate = replacementOutput.textContent === 'debounce-sentinel';
            await new Promise(resolve => setTimeout(resolve, 80));
            outputObserver.disconnect();
            result.checks.typingDebounced = debounceImmediate
                && replacementOutput.textContent === expected.bound
                && outputMutations <= 1;

            readingsTarget.remove();
            await new Promise(resolve => setTimeout(resolve, 30));
            replacementOutput.textContent = 'no-readings-target';
            replacementField.value = '学校に行く';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 80));
            result.checks.kanjiNoTarget = !document.querySelector('[data-cj2r-kanji-readings], #kanji-readings')
                && replacementOutput.textContent === expected.bound;

            const binding = window.RomajiTranslator.bind({
                field: '#hook-field',
                button: '#hook-button',
                output: '#hook-output'
            });
            document.getElementById('hook-field').value = '学校に行く';
            document.getElementById('hook-button').click();
            await new Promise(resolve => setTimeout(resolve, 20));
            result.checks.bind = document.getElementById('hook-output').textContent === expected.bound;

            const lifecycleField = document.createElement('textarea');
            const lifecycleOutput = document.createElement('div');
            lifecycleField.id = 'lifecycle-field';
            lifecycleOutput.id = 'lifecycle-output';
            document.body.append(lifecycleField, lifecycleOutput);
            document.getElementById('hook-output').textContent = 'retired-binding';
            lifecycleField.value = '幻影';
            const replacementBinding = window.RomajiTranslator.bind({
                field: lifecycleField,
                button: '#hook-button',
                output: lifecycleOutput
            });
            document.getElementById('hook-button').click();
            await new Promise(resolve => setTimeout(resolve, 30));
            result.checks.bindReplacement = binding.isBound() === false
                && replacementBinding.isBound() === true
                && document.getElementById('hook-output').textContent === 'retired-binding'
                && lifecycleOutput.textContent === expected.apostrophe;

            const staleField = document.createElement('textarea');
            const staleButton = document.createElement('button');
            const staleOutput = document.createElement('div');
            document.body.append(staleField, staleButton, staleOutput);
            staleField.value = '幻影';
            staleOutput.textContent = 'stale-sentinel';
            const staleBinding = window.RomajiTranslator.bind({ field: staleField, button: staleButton, output: staleOutput });
            const stalePromise = staleBinding.translate();
            staleBinding.unbind();
            let staleRejected = false;
            try { await stalePromise; }
            catch (error) { staleRejected = error?.code === 'CJ2R_BINDING_INACTIVE'; }
            result.checks.bindUnboundAsyncGuard = staleRejected && staleOutput.textContent === 'stale-sentinel';

            const reboundFirstOutput = document.createElement('div');
            const reboundSecondOutput = document.createElement('div');
            staleField.value = '幻影';
            reboundFirstOutput.textContent = 'first-sentinel';
            const reboundFirst = window.RomajiTranslator.bind({ field: staleField, button: staleButton, output: reboundFirstOutput });
            const reboundPending = reboundFirst.translate();
            const reboundSecond = window.RomajiTranslator.bind({ field: staleField, button: staleButton, output: reboundSecondOutput });
            let reboundRejected = false;
            try { await reboundPending; }
            catch (error) { reboundRejected = error?.code === 'CJ2R_BINDING_INACTIVE'; }
            await reboundSecond.translate();
            result.checks.bindReboundAsyncGuard = reboundRejected
                && reboundFirst.isBound() === false
                && reboundFirstOutput.textContent === 'first-sentinel'
                && reboundSecondOutput.textContent === expected.apostrophe;
            reboundSecond.unbind();
            staleField.remove();
            staleButton.remove();
            staleOutput.remove();
            reboundFirstOutput.remove();
            reboundSecondOutput.remove();

            const overrideCheckbox = document.getElementById('overrides-enabled');
            const globalOverrideBefore = Boolean(overrideCheckbox?.checked);
            replacementBinding.setOverridesEnabled(false);
            result.checks.bindingOverrideIsolation = replacementBinding.getOverridesEnabled() === false
                && Boolean(overrideCheckbox?.checked) === globalOverrideBefore;
            replacementBinding.unbind();

            const disposed = window.RomajiTranslator.disposeUi();
            replacementOutput.textContent = 'disposed-ui';
            replacementField.value = '幻影';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 30));
            const stayedDisposed = replacementOutput.textContent === 'disposed-ui';
            const refreshed = window.RomajiTranslator.refreshUi();
            replacementOutput.textContent = 'refreshed-ui';
            replacementField.value = '学校に行く';
            replacementField.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 80));
            result.checks.uiDisposeRefresh = disposed === true
                && stayedDisposed
                && refreshed === true
                && replacementOutput.textContent === expected.bound;

            const oldApi = window.RomajiTranslator;
            const destroyed = oldApi.destroy();
            const destroyedAgain = oldApi.destroy();
            let oldApiRejected = false;
            try { await oldApi.translate('学校に行く'); }
            catch (error) { oldApiRejected = /destroyed/i.test(String(error?.message || error)); }
            const destroyedStateClean = oldApi.getStatus().state === 'destroyed'
                && typeof window.RomajiTranslator === 'undefined'
                && window.translatorDiagnostics?.hostOwned === true
                && window.runTranslatorRegressionChecks?.() === 'host-regression'
                && window.runTranslatorGeneratedQA?.() === 'host-generated'
                && window.runTranslatorDifferentialChecks?.() === 'host-differential'
                && window.runTranslatorReadingAudit?.() === 'host-audit'
                && !window[Symbol.for('CJ2R.translator.engine.instance')];
            const freshScript = document.createElement('script');
            freshScript.src = engineScript?.src || '../../../translator-engine.js';
            freshScript.nonce = engineScript?.nonce || '';
            await new Promise((resolve, reject) => {
                freshScript.onload = resolve;
                freshScript.onerror = () => reject(new Error('Fresh engine load after destroy failed.'));
                document.head.appendChild(freshScript);
            });
            const newApi = window.RomajiTranslator;
            await newApi.ready;
            result.checks.destroyHotReload = window.browserEarlyDestroyGuard === true
                && destroyed === true
                && destroyedAgain === false
                && oldApiRejected
                && destroyedStateClean
                && newApi !== oldApi
                && newApi.translateSync('学校に行く') === expected.bound
                && !window[Symbol.for('CJ2R.translator.runtime-diagnostics.bridge')];

            result.ok = Object.values(result.checks).every(Boolean);
        } catch (error) {
            result.error = String(error?.stack || error);
        }
        writeResult(result);
        return result;
    }

    window.runTranslatorBrowserSmokeTest = runBrowserSmokeTest;
    runBrowserSmokeTest();
}());
