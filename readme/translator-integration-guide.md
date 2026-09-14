# Translator Website Integration

This guide covers the browser runtime, public API and normal deployment patterns for CJ2R.

## 1. Runtime package

`translator.html` is the supplied interface, not the translator itself. The reusable package is:

```text
translator-engine.js
kuromoji.js
data/
```

- `translator-engine.js` exposes `window.RomajiTranslator`.
- `kuromoji.js` provides morphological analysis.
- `data/` contains the Kuromoji dictionaries and CJ2R's reviewed runtime data.

`translator-hook-example.html` is a minimal integration example. A host site may replace either HTML file with its own interface.

For development, editable JavaScript lives under `src/translator/`; `translator-engine.js` is generated with `node tools/build-translator-engine.js`. Ordinary JSON data changes do not require an engine rebuild unless the loader or schema code also changes.

CJ2R normally resolves supporting assets relative to `translator-engine.js`, not the host page. This lets the translator live in its own directory or on a separate asset origin.

## 2. Supplied interface

Keep these together:

```text
translator.html
translator-engine.js
kuromoji.js
data/
```

Serve the files over HTTP or HTTPS. Do not use a raw `file://` page for deployment testing because browser security rules affect script, JSON and dictionary loading.

For redistribution or hand-off, also retain `licenses and sources/`. It is not a runtime dependency, but it contains the notices and attribution that accompany the software and data.

`translator.html` includes a built-in **Sources & licences** notice. `translator-engine.js` does not create or manage that notice. A custom host page may provide its own presentation, but removing the supplied UI notice does not remove any acknowledgement, attribution or licence obligations that apply to the software or data being deployed. The downstream website operator is responsible for satisfying those obligations and should retain `licenses and sources/`, or provide the applicable equivalent notices/links where the packaging format permits that instead.

CJ2R includes EDRDG-derived material. The maintained EDRDG notice and `tools/edrdg-update/` describe the supported update procedure. After hand-off, keeping applicable upstream-derived data current is the downstream operator's responsibility; the package is not intended to be deployed permanently and then ignored where upstream update obligations apply. This is project compliance guidance only; the maintained licence/source files remain the authority for the corresponding third-party material.

## 3. Loading the engine

A normal integration does not need runtime diagnostics. Load the engine directly:

```html
<script src="/assets/romaji/translator-engine.js"></script>
```

### Optional runtime diagnostics

For development or troubleshooting, runtime diagnostics may be enabled before loading the engine:

```html
<script>
window.CJ2R_TRANSLATOR_CONFIG = { runtimeDiagnostics: true };
</script>
<script src="/assets/romaji/translator-engine.js"></script>
```

When enabled, CJ2R loads `tools/qa/translator-qa.js`, captures additional per-translation diagnostic information and runs the browser regression checks during initialisation. This is intended for development and troubleshooting, not normal production use.

Runtime diagnostics are **not a UI mode**. They do not add, remove or control the status banner, override checkbox, Kanji helper or any other page control. Those controls exist only when the host page supplies them; `translator.html` includes them, while a custom integration may omit them entirely.

This runtime diagnostic mode is also separate from the QA Dashboard and release QA under `tools/qa/`, which are used to test and certify the maintained project. Production pages should normally omit `runtimeDiagnostics`. When it is omitted or `false`, `tools/qa/` is not a browser runtime dependency.

You do **not** need to enable `runtimeDiagnostics` in the host page before running QA. Dashboard and command-line QA runners that need the diagnostic hooks set `runtimeDiagnostics: true` inside their own isolated test context before loading the engine; other QA stages deliberately exercise normal production behaviour with diagnostics disabled. Running QA therefore does not require changing the production configuration.

If the engine and its assets are stored in different locations, set `assetBaseUrl`:

```html
<script>
window.CJ2R_TRANSLATOR_CONFIG = {
    assetBaseUrl: 'https://cdn.example.com/assets/romaji/'
};
</script>
<script nonce="your-csp-nonce" src="/scripts/translator-engine.js"></script>
```

`assetBaseUrl` should point to the directory containing `kuromoji.js` and `data/`. A missing trailing slash is normalised. Cross-origin hosting remains supported when the asset server supplies the required CORS headers, and HTTPS production pages should use HTTPS asset origins. CJ2R rejects active/non-web schemes, embedded URL credentials, and an HTTP asset base on an HTTPS page. Dynamically inserted CJ2R scripts inherit the engine script's CSP nonce.

Treat `assetBaseUrl` as a **code/data trust boundary**. It must point only to infrastructure controlled by, or explicitly trusted by, the operator. The loader's protocol, credential and downgrade checks prevent unsafe configuration classes; they are not content authentication. The configured origin can provide `kuromoji.js`, dictionary assets and translator JSON/data, so a compromised or untrusted origin can alter translator behaviour and can supply executable JavaScript through `kuromoji.js`. Prefer versioned release directories and deploy one tested CJ2R release as a coherent engine/data/dictionary set rather than mixing files from different releases.

Asset loading uses a small bounded retry policy for transient failures. By default CJ2R makes up to two retries after the first attempt, waiting 250 ms and then 500 ms; deterministic fetch failures such as HTTP 404 are not retried. `assetRetryCount` (capped at three retries), `retryDelayMs` and `retryMaxDelayMs` may be configured when a deployment needs different finite limits. `assetTimeoutMs` and `scriptTimeoutMs` default to 15 seconds per attempt. Kuromoji construction has a separate configurable `tokenizerTimeoutMs`, which defaults to 60 seconds so slower valid clients have more headroom while stalled initialisation still terminates.

## 4. Translation API

### Asynchronous translation

Use the asynchronous method by default:

```js
const romaji = await RomajiTranslator.translate(japaneseText);
```

`translate()` waits for initialisation before translating.

### Synchronous translation

Use the synchronous method only after readiness:

```js
if (RomajiTranslator.isReady()) {
    const romaji = RomajiTranslator.translateSync(japaneseText);
}
```

Calling `translateSync()` too early throws a readiness error rather than attempting a reduced translation.

### Preserve CJ2R output as returned

A host should treat the returned Romaji as final translator output. Do not apply generic title-casing, word splitting/joining or punctuation cleanup after `translate()`/`translateSync()`: reviewed foreign names and loanwords can intentionally contain source-language spacing and casing such as `Death Note`, `eBay` or `SpaceX`, and those decisions may span several Kuromoji tokens internally.

If a host needs a different presentation convention, keep that transformation outside CJ2R and do not treat the transformed text as CJ2R's Rule 0 result.

### Readiness, status and lifecycle

`RomajiTranslator.ready` is a promise that resolves after successful initialisation. `isReady()` is the synchronous readiness check. `getStatus()` returns the current lifecycle state, readiness, initialisation error and warning arrays; `getWarnings()` returns the data/developer warning arrays directly. `getDiagnostics()` returns CJ2R-owned runtime diagnostic state, including the effective loading policy. When `runtimeDiagnostics: true` is enabled, its `tools` property also exposes the development diagnostic functions. CJ2R does not publish or remove generic host-page globals such as `translatorDiagnostics` or `runTranslatorRegressionChecks`.

The global override state can be changed with `RomajiTranslator.setOverridesEnabled(enabled)`. This is separate from a binding's per-binding override setting.

`RomajiTranslator.destroy()` tears down the built-in UI/bindings, removes the public API and releases the single-engine instance lock. A destroyed instance must not be reused; reload the engine to create a new instance.

### Historical kana

Historical handling is opt-in and does not affect normal translation:

```js
const romaji = await RomajiTranslator.translateHistorical(historicalText);
```

A synchronous `translateHistoricalSync()` is also available after `isReady()` returns true.

### Audit API

Use the audit API to inspect uncertainty without changing the normal translation path:

```js
const { romaji, audit } = await RomajiTranslator.translateWithAudit(japaneseText);

if (audit.requiresReview) {
    console.log(audit.redFlags, audit.readings);
}
```

`translateWithAuditSync()` is available after readiness. Pass `{ historicalKana: true }` when explicitly auditing historical orthography.

The audit reports the original caller input as `audit.sourceText` and the normalised form used by CJ2R as `audit.normalizedSourceText`. Review flags cover recognised uncertainty such as ambiguous readings, unresolved names/source spellings, unusual sokuon and unresolved numeric or temporal roles. For example, contextless terminal `一日` exposes a `temporal-role-ambiguous` signal because `ついたち` and `いちにち` remain structurally viable; terminal punctuation does not manufacture a resolution.

`audit.requiresReview` represents **active unresolved uncertainty in the final result**. Review signals also retain historical provenance. Each signal records a stable reason code/flag, evidence source and owning source span (`sourceStart`, `sourceEnd`, `sourceSurface`) together with its lifecycle state. Only a signal whose final state is `final-active` can make `audit.requiresReview` true; a `superseded` or `resolved` signal documents an uncertainty that existed earlier in processing but no longer requires caller action.

When independent maintained evidence supports an incompatible reading for the same selected span, `audit.readings[].candidates` retains the competing readings and `audit.requiresReview` remains true until a recognised resolver actually settles the conflict. Strong conflicts are not cleared merely because printable Romaji was produced or because neighbouring text looks plausible. Weaker alternative-list uncertainty may be marked `superseded` only when a recognised contextual/structural resolver selects an already-attested interpretation with sufficient evidence; the superseded signal remains in audit provenance.

Integration consumers should use `audit.requiresReview` as the final unresolved-state indicator and may inspect `audit.redFlags`/`audit.readings` for the owning span and reason. When it is true, present the result for human verification rather than silently treating it as authoritative. The supplied standalone UI is driven from the same final audit state; development diagnostics are not a separate source of truth for review status.

### Kanji Readings API and optional rendering

Kanji Readings are a reusable CJ2R capability rather than a requirement of the supplied interface. Structured data is available without creating any Kanji UI:

```js
const readings = await RomajiTranslator.getKanjiReadings(japaneseText, {
    search: optionalKanjiSearch
});
```

`getKanjiReadingsSync()` is available after readiness. The result contains `input` entries for each Han occurrence in the source text and deduplicated `search` entries for the optional search string. Each entry contains the character, its source position where applicable, and formatted On'yomi/Kun'yomi reading arrays.

A custom page can opt into CJ2R's supplied automatic renderer with an explicit target:

```html
<textarea id="japanese"></textarea>
<input id="kanji-search" type="text">
<div
    data-cj2r-kanji-readings
    data-cj2r-kanji-source="#japanese"
    data-cj2r-kanji-search="#kanji-search"></div>
```

`data-cj2r-kanji-source` identifies the text source and `data-cj2r-kanji-search` is optional. Targets present when the engine loads are registered automatically. If a custom target is inserted later, call `RomajiTranslator.refreshUi()` once to register it. This keeps pages that never request Kanji Readings free of Kanji-specific mutation scanning. `refreshUi()` also restores a deliberately disposed UI lifecycle. If no built-in or explicit Kanji Readings target exists, CJ2R performs no Kanji-rendering work; direct API access remains available.

## 5. Binding CJ2R to existing controls

The supplied `translator-hook-example.html` demonstrates the binding helper:

```js
const binding = RomajiTranslator.bind({
    field: '#japanese',
    button: '#romanise',
    output: '#romaji'
});
```

`output` is optional. Without it, the result is written according to the binding's normal behaviour.

A button can have only one active CJ2R binding. Rebinding the same button retires the previous CJ2R handler so one click cannot trigger duplicate translations. A binding that is unbound or replaced while it is awaiting initialisation is prevented from writing stale output; its direct `translate()` promise rejects with an `AbortError` carrying code `CJ2R_BINDING_INACTIVE`. Click-triggered initialisation/translation failures are contained by the binding handler and do not create an unhandled promise rejection.

Bindings have their own override setting:

```js
const binding = RomajiTranslator.bind({
    field: '#japanese',
    button: '#romanise',
    output: '#romaji',
    overridesEnabled: false
});

binding.setOverridesEnabled(true);
binding.unbind();
```

The built-in UI lifecycle is separate from custom bindings. `RomajiTranslator.disposeUi()` removes the engine-managed input/status/Kanji handling and its DOM observer; `RomajiTranslator.refreshUi()` reconnects that handling. The override checkbox and sources/licences notice in `translator.html` are owned by that page rather than by `translator-engine.js`.

### Built-in UI controls are optional

CJ2R does not require the controls from `translator.html` to perform translation. A custom interface may omit the built-in override checkbox, status banner, sources/licences notice and other supplied UI elements without disabling the translation engine. `translator-engine.js` does not create or control the override checkbox or sources/licences notice. This separation concerns UI ownership only: a custom host remains responsible for any source acknowledgement, attribution and licence presentation required by the material it deploys. Overrides remain enabled by default unless changed through `RomajiTranslator.setOverridesEnabled()` or a binding's `overridesEnabled` option.

## 6. Directory placement and cross-origin hosting

A normal deployment can be:

```text
/assets/romaji/
    translator-engine.js
    kuromoji.js
    data/
```

The host page may live elsewhere. If the page and translator package are on different origins, the package origin must allow the browser to fetch the engine, Kuromoji, JSON and dictionary assets through normal CORS headers.

Kuromoji receives an absolute dictionary URL based on the translator package, so its dictionaries follow the package origin rather than the page origin.

For long-lived caching, use versioned release directories:

```text
/assets/romaji/<release>/
    translator-engine.js
    kuromoji.js
    data/
```

This prevents an old cached dictionary from being mixed with a newer engine or data set.

## 7. Browser support and CSP

CJ2R targets modern evergreen browsers that support the JavaScript and browser APIs used by the maintained runtime. The maintained browser release gate is Chromium-based. It verifies CJ2R against Chromium/Chrome behaviour; it is not a contractual Firefox, Safari or older-browser matrix. A downstream operator that requires guarantees for additional browsers or browser versions must add and own those compatibility tests for its deployment.

The supplied `translator.html` is an example/interface and may require normal production adaptation. It contains inline `<style>` and `<script>` blocks. A site with a strict Content Security Policy must authorise those blocks using its normal nonces/hashes or externalise them. CJ2R propagates the nonce from the engine script to script elements that CJ2R creates dynamically, but that propagation does **not** authorise inline script or style in the host page. Do not weaken a production CSP with `unsafe-inline` merely to avoid adapting the supplied example. A custom site that already externalises scripts and styles may integrate only the reusable runtime package.

## 8. Caching

CJ2R uses normal browser fetching for static assets. It does not add a service worker, local-storage cache or private caching layer.

Configure cache behaviour through standard server/CDN headers such as:

- `Cache-Control`
- `ETag`
- `Last-Modified`

Versioned package paths are recommended when using long cache lifetimes.

## 9. QA, development and release files

`src/translator/` and `tools/` are not production browser dependencies, but they should remain in the maintained source package so the translator can be rebuilt and verified.

### Primary QA method: dashboard

For normal local QA on Windows, the QA Dashboard is the intended entry point. No command needs to be typed:

1. Open `tools/qa/`.
2. Double-click **`Open CJ2R QA Dashboard.cmd`**.
3. The launcher starts the local QA server and opens the dashboard in the default browser.
4. Choose **Comprehensive release QA** for a release-certifying run, or choose a focused/technical scan when diagnosing one area.
5. Select **Build generated files first** only when maintained translator or QA source has changed and the generated files need rebuilding.

The dashboard can run the complete release gate, the complete translation diagnostic, focused translator scans, punctuation/boundary QA, generated-file parity, static type checking, source dependency checking and evidence-provenance checking. Focused and technical scans are diagnostic; only **Comprehensive release QA** certifies a release.

Important QA files include:

- `tools/qa/Open CJ2R QA Dashboard.cmd` — double-click Windows launcher;
- `tools/qa/run-translator-qa-dashboard.js` and `tools/qa/dashboard/` — local dashboard server/interface;
- `tools/qa/run-translator-focused-qa.js` — selected functional-area QA;
- `tools/qa/translator-qa.js` — generated browser-facing QA aggregate;
- `tools/qa/suites/` — maintained focused QA source;
- `tools/qa/browser/translator-browser-smoke.*` — real-browser startup/API coverage;
- `tools/qa/browser/translator-failure-injection.html` — isolated resource-failure fixture;
- `tools/qa/translator-differential-review-decisions.json` — reviewed disagreement ledger.

Direct command-line QA is the secondary/manual path for automation, non-Windows environments and advanced troubleshooting. The full release gate requires Node.js, Python 3, TypeScript (`tsc`), Chromium/Chrome and Graphviz `dot`. CJ2R supports TypeScript >=5.8.0 and <7.0.0 for this gate; the checker explicitly applies `checkJs` + `strictNullChecks` rather than inheriting broad strict-mode defaults. The release gate remains available as:

```bash
node tools/qa/run-translator-release-qa.js
```

After intentional JavaScript source changes, rebuild the engine first or use:

```bash
node tools/qa/run-translator-release-qa.js --build
```

See `tools/qa/translator-release-qa-guide.md` and `tools/qa/translator-qa-troubleshooting.md` for release and recovery details.

Evidence candidate generation and EDRDG maintenance are intentionally separate from live translation:

- `tools/evidence-candidate-generation/` creates review-only candidates from pinned Yomitan snapshots;
- `tools/edrdg-update/` stages and verifies updates to maintained EDRDG-derived source material.

Neither tool promotes unreviewed dictionary content directly into live runtime data.

## 10. Deployment checklist

Before handing CJ2R to another site:

1. Keep `translator-engine.js`, `kuromoji.js` and `data/` together as one tested release; do not mix engine/data/dictionaries from different releases. The expanded loanword bank depends on matching engine/schema behaviour for reviewed whole-span recognition, normalised aliases and protected source-language casing.
2. Keep `licenses and sources/` with redistributed copies of the corresponding software/data, or provide the applicable equivalent notices/links where permitted.
3. Ensure the host site's source/licence presentation satisfies the obligations applicable to the deployed material; omitting CJ2R's built-in notice does not remove them.
4. Omit `runtimeDiagnostics` in production; enable `runtimeDiagnostics: true` only for development or troubleshooting.
5. Prefer `translate()` unless the caller has already confirmed readiness.
6. Use historical methods only when historical orthography is intended.
7. Serve the package over HTTP/HTTPS. Configure CORS for cross-origin hosting, use HTTPS asset origins on HTTPS production pages, and point `assetBaseUrl` only at operator-controlled or explicitly trusted infrastructure.
8. Apply the host site's normal CSP nonce/hash/externalisation policy to inline content in the supplied HTML; CJ2R's dynamic-script nonce propagation does not authorise host-page inline blocks.
9. Use normal static-file caching and prefer versioned release paths for aggressive caching.
10. Rebuild generated artefacts after maintained source changes and run the complete release gate before release.
11. If the deployment requires Firefox, Safari or older-browser guarantees beyond the maintained Chromium gate, run and maintain that additional compatibility matrix.
12. Keep and periodically use the documented EDRDG update procedure for maintained deployments that incorporate the corresponding derived data; after hand-off, this maintenance belongs to the downstream operator.

Translation runs in the visitor's browser. Production scaling is therefore mainly a static-hosting and caching concern rather than a backend translation-service concern.
