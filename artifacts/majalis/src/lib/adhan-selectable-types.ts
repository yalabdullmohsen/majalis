/**
 * أنواع الأذان المعروضة للمستخدم: أربعة فقط، وكلها مربوطة بملفات موجودة.
 *
 * داخل التطبيق: MP3/M4A من /audio/adhan.
 * إشعار iOS: CAF قصير من حزمة Sounds (حد النظام ≈ ٣٠ث).
 * لا يُعرض خيار تجاوز الرنين — غير مدعوم في هذا الإصدار.
 */
import type { AdhanPlaybackMode } from "./adhan-playback-modes";

export const SELECTABLE_ADHAN_TYPE_IDS = [
  "makkah-full",
  "madinah-full",
  "makkah-short",
  "madinah-short",
] as const;

export type SelectableAdhanTypeId = (typeof SELECTABLE_ADHAN_TYPE_IDS)[number];

export type SelectableAdhanType = {
  id: SelectableAdhanTypeId;
  label: string;
  muezzinId: "makkah" | "madinah";
  mode: "full" | "short";
  /** تشغيل داخل التطبيق */
  inAppUrl: string;
  /** صوت الإشعار الأصلي (اسم الملف في الحزمة) */
  notificationSound: string;
};

export const SELECTABLE_ADHAN_TYPES: readonly SelectableAdhanType[] = [
  {
    id: "makkah-full",
    label: "أذان مكة كامل",
    muezzinId: "makkah",
    mode: "full",
    inAppUrl: "/audio/adhan/adhan-makkah-full.m4a",
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "madinah-full",
    label: "أذان المدينة كامل",
    muezzinId: "madinah",
    mode: "full",
    inAppUrl: "/audio/adhan/adhan-madinah-full.m4a",
    notificationSound: "adhan-short-madinah.caf",
  },
  {
    id: "makkah-short",
    label: "أذان مكة مختصر",
    muezzinId: "makkah",
    mode: "short",
    inAppUrl: "/audio/adhan/adhan-makkah-full.m4a",
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "madinah-short",
    label: "أذان المدينة مختصر",
    muezzinId: "madinah",
    mode: "short",
    inAppUrl: "/audio/adhan/adhan-madinah-full.m4a",
    notificationSound: "adhan-short-madinah.caf",
  },
];

export const ALLOWED_ADHAN_MUEZZIN_IDS = ["makkah", "madinah"] as const;

export function isSelectableAdhanTypeId(v: unknown): v is SelectableAdhanTypeId {
  return SELECTABLE_ADHAN_TYPE_IDS.includes(v as SelectableAdhanTypeId);
}

export function getSelectableAdhanType(id: string): SelectableAdhanType {
  return SELECTABLE_ADHAN_TYPES.find((t) => t.id === id) ?? SELECTABLE_ADHAN_TYPES[2]!;
}

export function clampAdhanMuezzinId(id: string | null | undefined): "makkah" | "madinah" {
  return id === "madinah" ? "madinah" : "makkah";
}

export function clampAdhanPlaybackMode(mode: unknown): "full" | "short" {
  return mode === "full" ? "full" : "short";
}

export function typeIdFromPrefs(
  muezzinId: string,
  mode: AdhanPlaybackMode | "" | undefined,
): SelectableAdhanTypeId {
  const city = clampAdhanMuezzinId(muezzinId);
  const clipped = clampAdhanPlaybackMode(mode);
  return `${city}-${clipped}` as SelectableAdhanTypeId;
}
