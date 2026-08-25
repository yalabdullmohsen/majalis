/**
 * أنواع الأذان المعروضة للمستخدم: الافتراضي (مكة) × كامل/مختصر فقط.
 * أُزيل مؤذن المدينة من الاختيار والأصول المرتبطة به.
 *
 * داخل التطبيق: MP3/M4A من /audio/adhan.
 * إشعار iOS: CAF قصير من حزمة Sounds (حد النظام ≈ ٣٠ث).
 */
import type { AdhanPlaybackMode } from "./adhan-playback-modes";

export const SELECTABLE_ADHAN_TYPE_IDS = [
  "makkah-full",
  "makkah-short",
] as const;

export type SelectableAdhanTypeId = (typeof SELECTABLE_ADHAN_TYPE_IDS)[number];

export type SelectableAdhanType = {
  id: SelectableAdhanTypeId;
  label: string;
  muezzinId: "makkah";
  mode: "full" | "short";
  /** تشغيل داخل التطبيق */
  inAppUrl: string;
  /** صوت الإشعار الأصلي (اسم الملف في الحزمة) */
  notificationSound: string;
};

export const SELECTABLE_ADHAN_TYPES: readonly SelectableAdhanType[] = [
  {
    id: "makkah-full",
    label: "الأذان الكامل (الافتراضي)",
    muezzinId: "makkah",
    mode: "full",
    inAppUrl: "/audio/adhan/adhan-makkah-full.m4a",
    notificationSound: "adhan-short-makkah.caf",
  },
  {
    id: "makkah-short",
    label: "الأذان المختصر (الافتراضي)",
    muezzinId: "makkah",
    mode: "short",
    inAppUrl: "/audio/adhan/adhan-makkah-full.m4a",
    notificationSound: "adhan-short-makkah.caf",
  },
];

export const ALLOWED_ADHAN_MUEZZIN_IDS = ["makkah"] as const;

/** معرّفات قديمة تُرحَّل إلى الافتراضي */
const LEGACY_TYPE_MAP: Record<string, SelectableAdhanTypeId> = {
  "madinah-full": "makkah-full",
  "madinah-short": "makkah-short",
  "makkah-full": "makkah-full",
  "makkah-short": "makkah-short",
};

export function isSelectableAdhanTypeId(v: unknown): v is SelectableAdhanTypeId {
  return SELECTABLE_ADHAN_TYPE_IDS.includes(v as SelectableAdhanTypeId);
}

export function getSelectableAdhanType(id: string): SelectableAdhanType {
  const mapped = LEGACY_TYPE_MAP[id] ?? "makkah-short";
  return SELECTABLE_ADHAN_TYPES.find((t) => t.id === mapped) ?? SELECTABLE_ADHAN_TYPES[1]!;
}

export function clampAdhanMuezzinId(_id: string | null | undefined): "makkah" {
  return "makkah";
}

export function clampAdhanPlaybackMode(mode: unknown): "full" | "short" {
  return mode === "full" ? "full" : "short";
}

export function typeIdFromPrefs(
  _muezzinId: string,
  mode: AdhanPlaybackMode | "" | undefined,
): SelectableAdhanTypeId {
  const clipped = clampAdhanPlaybackMode(mode);
  return `makkah-${clipped}` as SelectableAdhanTypeId;
}
