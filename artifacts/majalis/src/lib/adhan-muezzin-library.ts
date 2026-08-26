/**
 * مكتبة المؤذنين المعروضة في الإعدادات — أصول محلية أولاً، ثم CDN.
 * iOS: إشعار النظام ≤٢٩ث؛ الأذان الكامل داخل التطبيق أو عبر مقاطع CAF متتابعة (مكة/الحرم).
 */
import {
  OFFLINE_FEATURED_MUEZZIN_IDS,
  getOfflineAdhanPack,
  notificationSoundForAdhanPack,
} from "./adhan-offline-assets";
import { getMuezzin, type Muezzin } from "./adhan-audio";

/** مؤذنون إضافيون للتشغيل داخل التطبيق (CDN) — إشعار قصير حسب النمط */
export const STREAMING_MUEZZIN_IDS = [
  "abdulbasit",
  "qatami",
  "nafees",
  "alafasy",
  "mansour",
] as const;

export type BundledMuezzinId = (typeof OFFLINE_FEATURED_MUEZZIN_IDS)[number];
export type StreamingMuezzinId = (typeof STREAMING_MUEZZIN_IDS)[number];
export type SelectableMuezzinId = BundledMuezzinId | StreamingMuezzinId;

export type MuezzinLibraryEntry = {
  id: SelectableMuezzinId;
  label: string;
  /** ملف داخل التطبيق — null = CDN فقط */
  inAppUrl: string | null;
  /** صوت إشعار iOS (CAF) */
  notificationSound: string;
  /** يدعم مقاطع CAF متتابعة على iOS (≤٤×٢٨ث) */
  iosChainedSegments: boolean;
  bundled: boolean;
};

const CHAINED_IDS = new Set<string>(["makkah", "alharam", "makki"]);

function entryFromMuezzin(m: Muezzin, bundled: boolean): MuezzinLibraryEntry {
  const pack = getOfflineAdhanPack(m.id);
  const localUrl = pack?.local.general ?? null;
  const inApp =
    localUrl ??
    (m.audioAvailable && m.audioUrl.startsWith("/") ? m.audioUrl : null);
  return {
    id: m.id as SelectableMuezzinId,
    label: m.name,
    inAppUrl: inApp,
    notificationSound:
      notificationSoundForAdhanPack(m.id) ??
      pack?.notificationSound ??
      "adhan-short-makkah.caf",
    iosChainedSegments: CHAINED_IDS.has(m.id),
    bundled,
  };
}

/** كل المؤذنين القابلين للاختيار — محلي + بث */
export function listSelectableMuezzins(): MuezzinLibraryEntry[] {
  const bundled = OFFLINE_FEATURED_MUEZZIN_IDS.map((id) => {
    const m = getMuezzin(id);
    return entryFromMuezzin(m, true);
  });
  const streaming = STREAMING_MUEZZIN_IDS.map((id) => {
    const m = getMuezzin(id);
    if (!m.audioAvailable) return null;
    return entryFromMuezzin(m, false);
  }).filter(Boolean) as MuezzinLibraryEntry[];
  return [...bundled, ...streaming];
}

export function getMuezzinLibraryEntry(id: string): MuezzinLibraryEntry | undefined {
  return listSelectableMuezzins().find((e) => e.id === id);
}

export function isSelectableMuezzinId(id: string): id is SelectableMuezzinId {
  return listSelectableMuezzins().some((e) => e.id === id);
}

export function clampSelectableMuezzinId(id: string | null | undefined): SelectableMuezzinId {
  if (id && isSelectableMuezzinId(id)) return id;
  return "makkah";
}

export function muezzinSupportsIosChaining(id: string): boolean {
  return CHAINED_IDS.has(id);
}
