/**
 * Boot the Quran core services (state + Dexie + resource lifecycle + workers).
 * Call from platform bootstrap — no UI.
 */
import { getQuranEngineContext } from "@/core/quran/QuranEngineContext";

const BOOT_FLAG = "__majalis_quran_core_booted__";

export async function startQuranCore(): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[BOOT_FLAG]) return;
  w[BOOT_FLAG] = true;

  const kick = () => {
    void getQuranEngineContext().boot().catch(() => undefined);
  };

  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(kick, { timeout: 12_000 });
  } else {
    globalThis.setTimeout(kick, 3_500);
  }
}
