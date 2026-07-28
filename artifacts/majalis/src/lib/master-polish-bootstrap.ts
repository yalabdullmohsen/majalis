/**
 * Master polish — consolidation bootstrap for all 8 architectural pillars.
 * Idempotent; safe from App / platform-logic. Logic-only — no UI.
 */

const FLAG = "__majalis_master_polish_booted__";

export async function startMasterPolishSuite(): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  // 1+7: Network scheduler + battery FPS + visibility freeze (already in modules)
  try {
    const { startNetworkScheduler } = await import("@/lib/network-scheduler");
    startNetworkScheduler();
  } catch {
    /* ignore */
  }
  try {
    const { startBatteryFpsMonitor } = await import("@/lib/render-fps-throttle");
    startBatteryFpsMonitor();
  } catch {
    /* ignore */
  }

  // 2: IDB self-heal soft probe + storage reconcile
  try {
    const { withWebLock } = await import("@/lib/web-locks");
    await withWebLock("majalis:idb-heal-probe", async () => {
      const { backupCriticalUserState } = await import("@/lib/idb-self-heal");
      backupCriticalUserState();
    });
  } catch {
    /* ignore */
  }

  // 5: Font ready warm (zero-CLS)
  try {
    const { waitForDocumentFonts } = await import("@/lib/font-ready");
    void waitForDocumentFonts(3_000);
  } catch {
    /* ignore */
  }

  // 6: Cross-tab channel already warm elsewhere; ensure lock channel id
  try {
    const { getCrossTabId } = await import("@/lib/cross-tab-sync");
    getCrossTabId();
  } catch {
    /* ignore */
  }

  // 7: WebView profile — skip SW in restricted embeds
  try {
    const { shouldSkipServiceWorker, getWebViewProfile } = await import("@/lib/webview-guard");
    const profile = getWebViewProfile();
    (w as { __majalis_webview_profile__?: unknown }).__majalis_webview_profile__ = profile;
    if (shouldSkipServiceWorker()) {
      (w as { __majalis_skip_sw__?: boolean }).__majalis_skip_sw__ = true;
    }
  } catch {
    /* ignore */
  }

  // 4: Soft memory pressure already started in platform suite
  // 3/8: Audio/INP modules are lazy-loaded by consumers
}

/** Test helper */
export function resetMasterPolishForTests(): void {
  if (typeof window === "undefined") return;
  delete (window as unknown as Record<string, unknown>)[FLAG];
}
