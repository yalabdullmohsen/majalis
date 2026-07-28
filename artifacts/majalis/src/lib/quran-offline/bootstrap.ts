/**
 * Boot the Quran offline schema: open Dexie → migrate legacy → start outbox.
 * Logic-only — call from platform / offline bootstrap (no UI).
 */
import { openQuranOfflineDb } from "@/lib/quran-offline/db";
import { migrateLegacyQuranOfflineData } from "@/lib/quran-offline/migrate-legacy";
import { startQuranOutboxSync, drainQuranOutbox } from "@/lib/quran-offline/outbox-sync";

const BOOT_FLAG = "__majalis_quran_offline_booted__";

export async function startQuranOfflineStorage(): Promise<void> {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[BOOT_FLAG]) return;
  w[BOOT_FLAG] = true;

  try {
    await openQuranOfflineDb();
  } catch {
    return;
  }

  const kick = async () => {
    try {
      await migrateLegacyQuranOfflineData();
    } catch {
      /* never block UX */
    }
    try {
      const { runSilentSchemaMigrations } = await import(
        "@/lib/quran-offline/schema-migrate"
      );
      await runSilentSchemaMigrations();
    } catch {
      /* ignore */
    }
    try {
      startQuranOutboxSync();
    } catch {
      /* ignore */
    }
    try {
      const { startQuranResourceLifecycle } = await import(
        "@/lib/quran-offline/resource-lifecycle"
      );
      startQuranResourceLifecycle();
    } catch {
      /* ignore */
    }
  };

  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => {
      void kick();
    }, { timeout: 10_000 });
  } else {
    globalThis.setTimeout(() => {
      void kick();
    }, 3_000);
  }
}

/** Manual flush (settings / vault) — no UI coupling. */
export async function forceQuranOfflineSync(): Promise<void> {
  await migrateLegacyQuranOfflineData({ force: true });
  await drainQuranOutbox();
}
