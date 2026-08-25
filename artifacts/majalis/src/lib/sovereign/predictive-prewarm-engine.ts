/**
 * تسخين تنبؤي — prefetch أثناء الخمول + Wi‑Fi/شحن فقط.
 */
import { prefetchMushafPage } from "@/lib/quran-data/qpc-page-data";
import { findPageByFirstAyah } from "@/lib/quran-data/ayah-page-index.generated";
import { listAyahAudioUrls } from "@/lib/quran-audio";
import { prewarmAudioCdns, prewarmUrl } from "@/lib/resource-prewarm";
import { getPowerSaverState, scheduleNonCriticalWork } from "@/lib/power-saver-engine";
import { getTopSurahs, getPreferredReciterId, recordReadingActivity } from "@/lib/sovereign/predictive-analytics";

const FLAG = "__majalis_predictive_prewarm_armed__";

type NetworkInformationLike = {
  type?: string;
  effectiveType?: string;
  saveData?: boolean;
};

function isOnWifiOrEthernet(): boolean {
  if (typeof navigator === "undefined") return true;
  try {
    const conn = (navigator as Navigator & { connection?: NetworkInformationLike }).connection;
    if (!conn) return true;
    if (conn.saveData) return false;
    const t = `${conn.type ?? ""} ${conn.effectiveType ?? ""}`.toLowerCase();
    if (/wifi|ethernet|wimax/.test(t)) return true;
    if (/2g|slow-2g|cellular/.test(t)) return false;
  } catch {
    /* ignore */
  }
  return typeof navigator.onLine === "boolean" ? navigator.onLine : true;
}

async function isChargingOrFull(): Promise<boolean> {
  try {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{ charging: boolean; level: number }>;
    };
    if (!nav.getBattery) return true;
    const bat = await nav.getBattery();
    return bat.charging || bat.level >= 0.85;
  } catch {
    return true;
  }
}

export async function canRunPredictivePrewarm(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (getPowerSaverState().mode === "aggressive") return false;
  if (!isOnWifiOrEthernet()) return false;
  return isChargingOrFull();
}

function surahFirstPage(surah: number): number | null {
  const key = `${surah}:1`;
  return findPageByFirstAyah(key);
}

function prewarmSurahBundle(surah: number, reciterId: string): void {
  const page = surahFirstPage(surah);
  if (page != null) {
    prefetchMushafPage(page);
    prefetchMushafPage(page + 1);
  }
  const urls = listAyahAudioUrls(surah, 1, reciterId);
  for (const u of urls.slice(0, 2)) prewarmUrl(u);
}

/** يُستدعى من bootstrap — مرة واحدة + عند idle. */
export function startPredictivePrewarmEngine(): void {
  if (typeof window === "undefined") return;
  const w = window as unknown as Record<string, unknown>;
  if (w[FLAG]) return;
  w[FLAG] = true;

  const run = () => {
    void (async () => {
      if (!(await canRunPredictivePrewarm())) return;
      prewarmAudioCdns();
      const reciter = getPreferredReciterId() ?? "alafasy";
      for (const surah of getTopSurahs(4)) {
        prewarmSurahBundle(surah, reciter);
      }
    })();
  };

  scheduleNonCriticalWork(run);
  if (typeof document !== "undefined") {
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState !== "visible") return;
      scheduleNonCriticalWork(run);
    });
  }
}

/** تسجيل زيارة مسار + تحليلات — يُستدعى من جسر التنقل. */
export function recordRouteForPredictivePrewarm(path: string): void {
  const mushaf = path.match(/\/mushaf(?:\/page\/(\d+))?/);
  const quran = path.match(/\/quran(?:\/(\d+))?/);
  if (quran?.[1]) {
    recordReadingActivity({ surah: Number.parseInt(quran[1], 10) });
    return;
  }
  if (mushaf) {
    recordReadingActivity();
  }
}

export function resetPredictivePrewarmForTests(): void {
  if (typeof window === "undefined") return;
  delete (window as unknown as Record<string, unknown>)[FLAG];
}
