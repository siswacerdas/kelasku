/** Konfigurasi bersama klien dan Cloud Function. */
export const REGION = "asia-southeast1";
export const FUNCTION_NAME = "generateRpm";
export const DAILY_LIMIT = 20; // pembuatan RPM per admin per hari (kontrol biaya)
export const DEFAULT_MODEL = "claude-sonnet-5-5";
export const PROMPT_VERSION = "rpm-v3|scaffolding-v2|cp-atp-tp-v1.1|gen-1";
