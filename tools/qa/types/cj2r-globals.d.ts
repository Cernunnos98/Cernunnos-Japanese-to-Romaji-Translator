interface Error { transient?: boolean; code?: string; }

interface CJ2RTranslatorConfig extends Record<string, unknown> {
    assetBaseUrl?: string;
    runtimeDiagnostics?: boolean;
    assetTimeoutMs?: number;
    scriptTimeoutMs?: number;
    tokenizerTimeoutMs?: number;
    retryDelayMs?: number;
    retryMaxDelayMs?: number;
    assetRetryCount?: number;
}

interface CJ2RTranslatorStatus {
    state: string;
    ready: boolean;
    error: string | null;
    dataWarnings: string[];
    developerWarnings: string[];
}

interface CJ2RTranslatorBinding {
    field: Element;
    button: Element;
    output: Element | null;
    unbind(): boolean;
    translate(event?: Event | null): Promise<string>;
    setOverridesEnabled(enabled: boolean): boolean;
    getOverridesEnabled(): boolean;
    isBound(): boolean;
}

interface CJ2RTranslatorBindingOptions {
    field: Element | string;
    button: Element | string;
    output?: Element | string | null;
    overridesEnabled?: boolean;
}

interface CJ2RTranslatorAuditResult {
    romaji: string;
    audit: unknown;
}

interface CJ2RKanjiReading {
    reading: string;
    kana: string;
    romaji: string;
}

interface CJ2RKanjiReadingEntry {
    character: string;
    position: number | null;
    on: CJ2RKanjiReading[];
    kun: CJ2RKanjiReading[];
}

interface CJ2RKanjiReadingData {
    searchText: string;
    search: CJ2RKanjiReadingEntry[];
    input: CJ2RKanjiReadingEntry[];
}

interface CJ2RTranslatorDiagnostics {
    rule: string;
    runtime: CJ2RTranslatorStatus;
    assetPolicy: Record<string, unknown>;
    loadingPolicy: {
        assetBaseUrl: string;
        configuredAssetBaseUrl: string | null;
        fetchTimeoutMs: number;
        scriptTimeoutMs: number;
        tokenizerTimeoutMs: number;
        retryCount: number;
        retryDelaysMs: number[];
    };
    dataWarnings: string[];
    developerWarnings: string[];
    regression: unknown;
    regressionFailures: unknown[];
    lastTranslation: unknown;
    tools: Record<string, (...args: any[]) => any> | null;
    [key: string]: unknown;
}

interface CJ2RTranslatorApi {
    ready: Promise<boolean>;
    translate(text: string): Promise<string>;
    translateSync(text: string): string;
    translateHistorical(text: string): Promise<string>;
    translateHistoricalSync(text: string): string;
    translateWithAudit(text: string, options?: { historicalKana?: boolean }): Promise<CJ2RTranslatorAuditResult>;
    translateWithAuditSync(text: string, options?: { historicalKana?: boolean }): CJ2RTranslatorAuditResult;
    isReady(): boolean;
    getStatus(): CJ2RTranslatorStatus;
    getWarnings(): { data: string[]; developer: string[] };
    getDiagnostics(): CJ2RTranslatorDiagnostics;
    getKanjiReadings(text: string, options?: { search?: string }): Promise<CJ2RKanjiReadingData>;
    getKanjiReadingsSync(text: string, options?: { search?: string }): CJ2RKanjiReadingData;
    disposeUi(): boolean;
    refreshUi(): boolean;
    setOverridesEnabled(enabled: boolean): boolean;
    bind(options: CJ2RTranslatorBindingOptions): CJ2RTranslatorBinding;
    destroy(): boolean;
}

interface Window {
    CJ2R_TRANSLATOR_CONFIG?: CJ2RTranslatorConfig;
    kuromoji?: any;
    RomajiTranslator?: CJ2RTranslatorApi;
}
