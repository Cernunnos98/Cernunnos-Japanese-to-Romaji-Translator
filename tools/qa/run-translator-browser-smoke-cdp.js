const fs = require('fs');
const path = require('path');
const { createCdpSession, mime, positiveInteger } = require('./browser/cdp-harness');

const root = path.resolve(process.argv[2] || path.join(__dirname, '../..'));
const port = Number(process.argv[3] || 9333);
const mode = process.argv[4] || 'dev';
const commandTimeout = positiveInteger(process.env.TRANSLATOR_SMOKE_COMMAND_TIMEOUT_MS, 15000);
const smokeTimeout = positiveInteger(process.env.TRANSLATOR_SMOKE_TIMEOUT_MS, 120000);

(async () => {
    const crossOrigin = mode === 'cross-origin';
    const production = mode === 'production';
    const lateDom = mode === 'late-dom';
    const pageOrigin = crossOrigin ? 'https://host.test' : 'https://translator.test';
    const engineOrigin = crossOrigin ? 'https://cdn.translator.test' : pageOrigin;
    const assetOrigin = production ? 'https://assets.translator.test' : engineOrigin;
    const assetBasePath = production ? '/assets/romaji/' : '/';
    const expectedAssetBase = `${assetOrigin}${assetBasePath}`;
    const session = await createCdpSession(port, { commandTimeout });
    const { command, on } = session;
    await command('Runtime.enable');
    await command('Page.enable');
    await command('Fetch.enable', {
        patterns: [...new Set([pageOrigin, engineOrigin, assetOrigin])].map(origin => ({ urlPattern: `${origin}/*`, requestStage: 'Request' }))
    });

    on('Fetch.requestPaused', async params => {
        try {
            const url = new URL(params.request.url);
            let requestPath = decodeURIComponent(url.pathname);
            if (production && url.origin === assetOrigin && requestPath.startsWith(assetBasePath)) {
                requestPath = requestPath.slice(assetBasePath.length);
            }
            const local = path.join(root, requestPath.replace(/^\/+/, ''));
            if (!local.startsWith(`${root}${path.sep}`) || !fs.existsSync(local) || !fs.statSync(local).isFile()) {
                await command('Fetch.fulfillRequest', {
                    requestId: params.requestId,
                    responseCode: 404,
                    responseHeaders: [{ name: 'Content-Type', value: 'text/plain' }],
                    body: Buffer.from('Not found').toString('base64')
                });
                return;
            }
            const data = fs.readFileSync(local);
            await command('Fetch.fulfillRequest', {
                requestId: params.requestId,
                responseCode: 200,
                responseHeaders: [
                    { name: 'Content-Type', value: mime(local) },
                    { name: 'Cache-Control', value: 'public, max-age=60' },
                    { name: 'Access-Control-Allow-Origin', value: '*' }
                ],
                body: data.toString('base64')
            });
        } catch (error) {
            try { await command('Fetch.failRequest', { requestId: params.requestId, errorReason: 'Failed' }); } catch (_) {}
            console.error('intercept', error);
        }
    });

    const frameTree = await command('Page.getFrameTree');
    const frameId = frameTree.frameTree.frame.id;
    let html = fs.readFileSync(path.join(root, 'tools/qa/browser/translator-browser-smoke.html'), 'utf8');
    const configScript = `<script>window.CJ2R_BROWSER_SMOKE_MODE=${JSON.stringify(mode)};window.CJ2R_EXPECTED_ASSET_BASE=${JSON.stringify(expectedAssetBase)};${production ? `window.CJ2R_TRANSLATOR_CONFIG={assetBaseUrl:${JSON.stringify(expectedAssetBase)}};` : ''}<\/script>`;
    html = html.replace('<head>', `<head><base href="${pageOrigin}/tools/qa/browser/">${configScript}`);
    if (lateDom) {
        html = html.replace(/<div id="built-in-ui">[\s\S]*?<\/div>\s*\n\s*<textarea id="hook-field">/, '<div id="built-in-ui"></div>\n\n    <textarea id="hook-field">');
    }
    html = html.replace('<script nonce="cj2r-browser-smoke-nonce" src="../../../translator-engine.js"></script>', `<script nonce="cj2r-browser-smoke-nonce" src="${engineOrigin}/translator-engine.js"></script>`);
    await command('Page.setDocumentContent', { frameId, html });

    const started = Date.now();
    let result = null;
    while (Date.now() - started < smokeTimeout) {
        const response = await command('Runtime.evaluate', { expression: 'window.browserSmokeResult || null', returnByValue: true });
        result = response.result?.value || null;
        if (result) break;
        await new Promise(resolve => setTimeout(resolve, 250));
    }
    if (!result) {
        const debug = await command('Runtime.evaluate', { expression: '({body:document.body&&document.body.innerText,diag:window.RomajiTranslator?.getDiagnostics?.()||null,api:!!window.RomajiTranslator})', returnByValue: true });
        throw new Error(`Smoke timeout: ${JSON.stringify(debug.result?.value)}`);
    }

    async function waitForApiReady(timeout = 30000) {
        const startedAt = Date.now();
        while (Date.now() - startedAt < timeout) {
            const response = await command('Runtime.evaluate', { expression: 'Boolean(window.RomajiTranslator)', returnByValue: true });
            if (response.result?.value) return;
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        const debug = await command('Runtime.evaluate', { expression: '({href:location.href,body:document.body?.innerText||"",scripts:Array.from(document.scripts).map(s=>s.src),api:!!window.RomajiTranslator})', returnByValue: true }).catch(() => null);
        throw new Error(`Supplied integration page did not publish RomajiTranslator: ${JSON.stringify(debug?.result?.value || null)}`);
    }

    async function evaluateSuppliedPage(relativePath, expression) {
        await command('Page.navigate', { url: 'about:blank' });
        await new Promise(resolve => setTimeout(resolve, 50));
        const pageFrame = (await command('Page.getFrameTree')).frameTree.frame.id;
        let pageHtml = fs.readFileSync(path.join(root, relativePath), 'utf8');
        pageHtml = pageHtml.replace('<head>', `<head><base href="${pageOrigin}/">`);
        await command('Page.setDocumentContent', { frameId: pageFrame, html: pageHtml });
        await waitForApiReady();
        const response = await command('Runtime.evaluate', {
            expression: `(async()=>{${expression}})()`,
            awaitPromise: true,
            returnByValue: true
        });
        if (response.exceptionDetails) throw new Error(response.exceptionDetails.text || `Supplied page check failed: ${relativePath}`);
        return Boolean(response.result?.value);
    }

    if (mode === 'dev') {
        result.checks.suppliedTranslatorHtml = await evaluateSuppliedPage('translator.html', `
            await window.RomajiTranslator.ready;
            const input = document.getElementById('input');
            const output = document.getElementById('output');
            const readings = document.getElementById('kanji-readings');
            const overrideInput = document.getElementById('overrides-enabled');
            const overrideText = document.getElementById('override-text');
            const licenseNotice = document.getElementById('license-notice');
            input.value = '学校に行く';
            input.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 100));
            const translationOk = input.disabled === false
                && output.textContent === 'Gakkou ni Iku'
                && Array.from(readings.querySelectorAll('.kanji-character')).some(element => element.textContent === '学');
            overrideInput.checked = false;
            overrideText.textContent = 'page-owned';
            window.RomajiTranslator.setOverridesEnabled(true);
            const engineLeavesPageControlAlone = overrideInput.checked === false && overrideText.textContent === 'page-owned';
            overrideInput.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 30));
            const pageOwnsOverrideControl = overrideText.textContent === 'Override Disabled';
            overrideInput.checked = true;
            overrideInput.dispatchEvent(new Event('change', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 30));
            return translationOk
                && engineLeavesPageControlAlone
                && pageOwnsOverrideControl
                && overrideText.textContent === 'Override Enabled'
                && Boolean(licenseNotice?.querySelector('a'));
        `);
        result.checks.suppliedHookExample = await evaluateSuppliedPage('translator-hook-example.html', `
            await window.RomajiTranslator.ready;
            const field = document.getElementById('my-textbox');
            const button = document.getElementById('my-romaji-button');
            const readings = document.querySelector('[data-cj2r-kanji-readings]');
            field.value = '学校';
            field.dispatchEvent(new Event('input', { bubbles: true }));
            await new Promise(resolve => setTimeout(resolve, 80));
            const rendered = Array.from(readings.querySelectorAll('.kanji-character')).some(element => element.textContent === '学');
            button.click();
            await new Promise(resolve => setTimeout(resolve, 50));
            return rendered && field.value === 'Gakkou';
        `);
        result.ok = Object.values(result.checks).every(Boolean);
    }

    result.mode = mode;
    console.log(JSON.stringify(result, null, 2));
    try { await command('Page.close'); } catch (_) {}
    session.close();
    process.exit(result.ok ? 0 : 2);
})().catch(error => {
    console.error(error.stack || error);
    process.exit(1);
});
