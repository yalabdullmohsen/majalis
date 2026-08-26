/**
 * محرك مكتبة الصوت الموحّد — قرّاء + مؤذنون + جدولة أذان (Capacitor).
 * Capacitor فقط — يعيد استخدام RECITERS و adhan-muezzin-library.
 */
import { isIOS, isNative } from "./capacitor-utils";
import { getMuezzin } from "./adhan-audio";
import {
  clampSelectableMuezzinId,
  listSelectableMuezzins,
  muezzinSupportsIosChaining,
  type SelectableMuezzinId,
} from "./adhan-muezzin-library";
import {
  cancelAndroidFullAdhan,
  isAdhanAndroidAlarmAvailable,
  scheduleAndroidFullAdhan,
} from "./adhan-android-alarm";
import { resolveAdhanClip } from "./adhan-playback-modes";
import { RECITERS, getReciter, type QuranReciter } from "./quran-audio";
import type { PrayerKey } from "./adhan-preferences";

export type RecitationStyle = "مرتل" | "مجود" | "معلم";

export type FamousReciterEntry = {
  id: string;
  name: string;
  rewayah: string;
  style: RecitationStyle;
  qualityLabel: string;
  featured: boolean;
  /** بث مباشر MP3 — everyayah / mp3quran */
  streaming: boolean;
  /** تنزيل سور كاملة للأوفلاين */
  offlineCapable: boolean;
};

export type FamousMuezzinEntry = {
  id: SelectableMuezzinId;
  name: string;
  location: string;
  bundled: boolean;
  iosChainedSegments: boolean;
  notificationSound: string;
};

/** قرّاء مميزون — مطابقة RECITERS المُتحقَّقة */
export const FAMOUS_RECITER_IDS = [
  "abdulsamad",
  "minshawi",
  "husary",
  "hudhaify",
  "shuraim",
  "sudais",
  "maher",
  "alafasy",
  "dosari",
  "qatami",
] as const;

const RECITER_STYLE: Record<string, RecitationStyle> = {
  abdulsamad: "مرتل",
  minshawi: "مرتل",
  husary: "معلم",
  hudhaify: "مرتل",
  shuraim: "مرتل",
  sudais: "مرتل",
  maher: "مرتل",
  alafasy: "مرتل",
  dosari: "مرتل",
  qatami: "مرتل",
};

function reciterToEntry(r: QuranReciter): FamousReciterEntry {
  return {
    id: r.id,
    name: r.nameAr,
    rewayah: r.riwaya,
    style: RECITER_STYLE[r.id] ?? "مرتل",
    qualityLabel: r.qualityLabel,
    featured: r.featured,
    streaming: true,
    offlineCapable: Boolean(r.surahBaseUrl),
  };
}

export function listFamousReciters(): FamousReciterEntry[] {
  const order = new Map<string, number>(
    FAMOUS_RECITER_IDS.map((id, i) => [id, i]),
  );
  return RECITERS.filter((r) => order.has(r.id))
    .sort((a, b) => (order.get(a.id)! - order.get(b.id)!))
    .map(reciterToEntry);
}

export function getFamousReciter(id: string): FamousReciterEntry | undefined {
  if (!FAMOUS_RECITER_IDS.includes(id as (typeof FAMOUS_RECITER_IDS)[number])) {
    return undefined;
  }
  return reciterToEntry(getReciter(id));
}

export function listFamousMuezzins(): FamousMuezzinEntry[] {
  return listSelectableMuezzins().map((m) => {
    const full = getMuezzin(m.id);
    const location =
      full.mosque && full.origin
        ? `${full.mosque} — ${full.origin}`
        : full.mosque ?? full.origin ?? "—";
    return {
      id: m.id,
      name: m.label,
      location,
      bundled: m.bundled,
      iosChainedSegments: m.iosChainedSegments,
      notificationSound: m.notificationSound,
    };
  });
}

export function getFamousMuezzin(id: string): FamousMuezzinEntry | undefined {
  return listFamousMuezzins().find((m) => m.id === id);
}

/**
 * جدولة أذان بمؤذن محدّد — iOS متسلسل / Android FGS / ويب: no-op.
 */
export async function scheduleAdhanWithMuezzin(opts: {
  prayerKey: PrayerKey;
  prayerName: string;
  atMs: number;
  muezzinId: string;
  isFullAdhan: boolean;
  isFajr?: boolean;
}): Promise<{ ok: boolean; ids: number[] }> {
  const muezzinId = clampSelectableMuezzinId(opts.muezzinId);
  const mode = opts.isFullAdhan ? "full" : "short";
  const isFajr = opts.isFajr ?? opts.prayerKey === "fajr";

  if (isNative && isIOS) {
    const { scheduleIosFullAdhan } = await import("./adhan-ios-segments");
    return scheduleIosFullAdhan({
      prayerKey: opts.prayerKey,
      prayerName: opts.prayerName,
      recordingId: muezzinId,
      isFajr,
      startAtMs: opts.atMs,
      deliveryMode: mode,
    });
  }

  if (isAdhanAndroidAlarmAvailable() && mode === "full") {
    await cancelAndroidFullAdhan(opts.prayerKey);
    const muezzin = getMuezzin(muezzinId);
    const clip = resolveAdhanClip(muezzin, { isFajr, mode: "full" });
    if (!clip) return { ok: false, ids: [] };
    const ok = await scheduleAndroidFullAdhan({
      atMs: opts.atMs,
      url: clip.url,
      title: `أذان ${opts.prayerName}`,
      prayerKey: opts.prayerKey,
    });
    return { ok, ids: ok ? [1] : [] };
  }

  return { ok: false, ids: [] };
}

export function describeMuezzinAdhanCapability(muezzinId: string, isFull: boolean): string {
  const id = clampSelectableMuezzinId(muezzinId);
  if (!isFull) return "إشعار CAF قصير (≤٢٩ث)";
  if (isNative && isIOS && muezzinSupportsIosChaining(id)) {
    return "iOS: حتى ٤ إشعارات متتابعة + إكمال داخل التطبيق";
  }
  if (isNative && isIOS) return "iOS: إشعار قصير + أذان كامل عند فتح التطبيق";
  if (isAdhanAndroidAlarmAvailable()) return "Android: أذان كامل عبر خدمة أمامية";
  return "أذان كامل داخل التطبيق عند الفتح";
}
