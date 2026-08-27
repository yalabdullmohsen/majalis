/**
 * محرك دمج المنظومة — Capacitor/PWA (IndexedDB + sync-outbox + AudioLibraryEngine).
 * بديل react-native-fs / Notifee — لا يكسر التطبيق عند فشل الشبكة.
 */
import { isOnline } from "@/lib/offline-db";
import { enqueueOutbox, flushOutbox, outboxPendingCount } from "@/lib/sync-outbox";
import { ensureHybridSyncOutboxHandlers } from "@/lib/hybrid-sync-handlers";

export type SyncStatus = "synced" | "pending_offline" | "error";

export interface SystemTaskStatus {
  adhanEngineReady: boolean;
  offlineDownloadActive: boolean;
  syncStatus: SyncStatus;
  lastError: string | null;
}

export type ReadingProgressSyncInput = {
  userId: string;
  page?: number;
  surah?: number;
  ayah?: number;
  ayahId?: number;
};

let started = false;

export class UnifiedAppEngine {
  private static instance: UnifiedAppEngine | null = null;
  private lastStatus: SystemTaskStatus | null = null;

  private constructor() {}

  static getInstance(): UnifiedAppEngine {
    if (!UnifiedAppEngine.instance) {
      UnifiedAppEngine.instance = new UnifiedAppEngine();
    }
    return UnifiedAppEngine.instance;
  }

  getLastStatus(): SystemTaskStatus | null {
    return this.lastStatus;
  }

  /** offline-first: طابور outbox + CRDT/WAL عبر hybrid-sync-handlers */
  async syncUserProgressOfflineFirst(input: ReadingProgressSyncInput): Promise<void> {
    const ayahRef = input.ayah ?? input.ayahId;
    const id =
      input.page != null
        ? `mushaf:${input.userId}`
        : input.surah != null
          ? `surah:${input.userId}:${input.surah}:${ayahRef ?? 1}`
          : `progress:${input.userId}:${ayahRef ?? Date.now()}`;

    await enqueueOutbox("reading_progress", id, {
      userId: input.userId,
      page: input.page,
      surah: input.surah,
      ayah: ayahRef,
      updatedAt: new Date().toISOString(),
    });

    if (!isOnline()) return;

    try {
      await flushOutbox();
    } catch {
      /* يبقى في الطابور لحين عودة الشبكة */
    }
  }

  async deployAllServices(): Promise<SystemTaskStatus> {
    try {
      ensureHybridSyncOutboxHandlers();

      let syncStatus: SyncStatus = "synced";
      if (!isOnline()) {
        const pending = await outboxPendingCount();
        syncStatus = pending > 0 ? "pending_offline" : "synced";
      } else {
        try {
          const { remaining } = await flushOutbox();
          syncStatus = remaining > 0 ? "pending_offline" : "synced";
        } catch {
          syncStatus = "error";
        }
      }

      const adhanEngineReady = await this.probeAdhanReady();
      const offlineDownloadActive = await this.probeOfflineDownloadActive();

      const status: SystemTaskStatus = {
        adhanEngineReady,
        offlineDownloadActive,
        syncStatus,
        lastError: null,
      };
      this.lastStatus = status;
      return status;
    } catch (error) {
      const status: SystemTaskStatus = {
        adhanEngineReady: false,
        offlineDownloadActive: false,
        syncStatus: "error",
        lastError: error instanceof Error ? error.message : "خطأ غير متوقع في التفعيل",
      };
      this.lastStatus = status;
      return status;
    }
  }

  private async probeAdhanReady(): Promise<boolean> {
    try {
      const { listFamousMuezzins } = await import("@/lib/audio-library-engine");
      const muezzins = listFamousMuezzins();
      if (muezzins.length === 0) return false;
      const { isNative, isIOS } = await import("@/lib/capacitor-utils");
      if (isNative && isIOS) {
        return muezzins.some((m) => m.iosChainedSegments || m.bundled);
      }
      const { isAdhanAndroidAlarmAvailable } = await import("@/lib/adhan-android-alarm");
      if (isAdhanAndroidAlarmAvailable()) return true;
      return true;
    } catch {
      return false;
    }
  }

  private async probeOfflineDownloadActive(): Promise<boolean> {
    try {
      const { resolveDownloadResumeHint, getAllDownloadStatuses } = await import(
        "@/lib/quran-audio-downloads"
      );
      const hint = await resolveDownloadResumeHint();
      if (hint) return true;
      const statuses = await getAllDownloadStatuses();
      return statuses.some((s) => s.downloadedSurahs > 0 && !s.complete);
    } catch {
      return false;
    }
  }

  /** عند عودة التطبيق للمقدمة: مزامنة + إشعار UI باستئناف التنزيل */
  async onAppForeground(): Promise<void> {
    if (isOnline()) {
      try {
        await flushOutbox();
      } catch {
        /* optional */
      }
    }
    try {
      const { resolveDownloadResumeHint } = await import("@/lib/quran-audio-downloads");
      const hint = await resolveDownloadResumeHint();
      if (hint && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("majalis:download-resume-hint", { detail: hint }));
      }
    } catch {
      /* optional */
    }
  }
}

/** تهيئة مرة واحدة — listeners للشبكة والمقدمة */
export async function startUnifiedAppEngine(): Promise<SystemTaskStatus> {
  if (typeof window === "undefined") {
    return {
      adhanEngineReady: false,
      offlineDownloadActive: false,
      syncStatus: "synced",
      lastError: null,
    };
  }

  const engine = UnifiedAppEngine.getInstance();
  if (started) {
    return engine.getLastStatus() ?? (await engine.deployAllServices());
  }
  started = true;

  const status = await engine.deployAllServices();

  const onForeground = () => {
    if (document.visibilityState === "visible") {
      void engine.onAppForeground();
    }
  };
  document.addEventListener("visibilitychange", onForeground);
  window.addEventListener("online", () => {
    void engine.deployAllServices();
  });

  void import("@/lib/capacitor-utils").then(({ isNative }) => {
    if (!isNative) return;
    void import("@capacitor/app")
      .then(({ App }) => {
        void App.addListener("appStateChange", ({ isActive }) => {
          if (isActive) void engine.onAppForeground();
        });
      })
      .catch(() => {});
  });

  return status;
}
