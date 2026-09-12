import {
  WIDGET_ACCOUNT_SCOPE_KEY,
  WIDGET_BUNDLE_KEY,
  WIDGET_BUNDLE_TMP_KEY,
  assertNoSecretsInSnapshot,
} from "./privacy";
import { WIDGET_BRAND, WIDGET_SCHEMA_VERSION, type WidgetBundleFile } from "./types";

export function writeWidgetBundleAtomic(bundle: WidgetBundleFile): { ok: boolean; reason?: string } {
  if (typeof localStorage === "undefined") return { ok: false, reason: "no_storage" };
  if (bundle.schemaVersion !== WIDGET_SCHEMA_VERSION) return { ok: false, reason: "schema_mismatch" };
  if (bundle.brand !== WIDGET_BRAND) return { ok: false, reason: "brand_mismatch" };
  const json = JSON.stringify(bundle);
  if (!assertNoSecretsInSnapshot(json)) return { ok: false, reason: "secrets_detected" };
  if (json.length > 120_000) return { ok: false, reason: "payload_too_large" };
  try {
    localStorage.setItem(WIDGET_BUNDLE_TMP_KEY, json);
    localStorage.setItem(WIDGET_BUNDLE_KEY, json);
    localStorage.removeItem(WIDGET_BUNDLE_TMP_KEY);
    localStorage.setItem(WIDGET_ACCOUNT_SCOPE_KEY, bundle.accountScope);
    return { ok: true };
  } catch {
    try { localStorage.removeItem(WIDGET_BUNDLE_TMP_KEY); } catch { /* ignore */ }
    return { ok: false, reason: "write_failed" };
  }
}

export function readWidgetBundle(): WidgetBundleFile | null {
  if (typeof localStorage === "undefined") return null;
  try {
    const raw = localStorage.getItem(WIDGET_BUNDLE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WidgetBundleFile;
    if (parsed.schemaVersion !== WIDGET_SCHEMA_VERSION || parsed.brand !== WIDGET_BRAND) return null;
    if (!Array.isArray(parsed.snapshots)) return null;
    return parsed;
  } catch {
    return null;
  }
}

export function clearWidgetBundles(): void {
  if (typeof localStorage === "undefined") return;
  for (const key of [WIDGET_BUNDLE_KEY, WIDGET_BUNDLE_TMP_KEY, WIDGET_ACCOUNT_SCOPE_KEY]) {
    try { localStorage.removeItem(key); } catch { /* ignore */ }
  }
  const kill: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith("sunnah-widget-")) kill.push(k);
  }
  for (const k of kill) {
    try { localStorage.removeItem(k); } catch { /* ignore */ }
  }
}

export function getStoredAccountScope(): string | null {
  if (typeof localStorage === "undefined") return null;
  try { return localStorage.getItem(WIDGET_ACCOUNT_SCOPE_KEY); } catch { return null; }
}
