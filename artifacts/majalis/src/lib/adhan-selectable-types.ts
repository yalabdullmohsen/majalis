/**
 * أنواع الأذان المعروضة للمستخدم: صيغة التسليم (كامل / مختصر).
 * المؤذن يُختار من adhan-muezzin-library.
 *
 * داخل التطبيق: MP3/M4A من /audio/adhan أو CDN.
 * إشعار iOS: CAF قصير أو مقاطع متتابعة (مكة/الحرم) من حزمة Sounds.
 */
import type { AdhanPlaybackMode } from "./adhan-playback-modes";
import {
  clampSelectableMuezzinId,
  getMuezzinLibraryEntry,
  type SelectableMuezzinId,
} from "./adhan-muezzin-library";

export const SELECTABLE_ADHAN_TYPE_IDS = [
  "makkah-full",
  "makkah-short",
] as const;

export type SelectableAdhanTypeId = (typeof SELECTABLE_ADHAN_TYPE_IDS)[number];

export type SelectableAdhanType = {
  id: SelectableAdhanTypeId;
  label: string;
  hint: string;
  muezzinId: SelectableMuezzinId;
  mode: "full" | "short";
  inAppUrl: string;
  notificationSound: string;
};

export const ALLOWED_ADHAN_MUEZZIN_IDS = [
  "makkah",
  "alharam",
  "aqsa",
  "egypt",
  "turkey",
  "takbeerat",
  "soft",
  "abdulbasit",
  "qatami",
  "nafees",
  "alafasy",
  "mansour",
] as const;

const LEGACY_TYPE_MAP: Record<string, SelectableAdhanTypeId> = {
  "madinah-full": "makkah-full",
  "madinah-short": "makkah-short",
  "makkah-full": "makkah-full",
  "makkah-short": "makkah-short",
};

export function isSelectableAdhanTypeId(v: unknown): v is SelectableAdhanTypeId {
  return SELECTABLE_ADHAN_TYPE_IDS.includes(v as SelectableAdhanTypeId);
}

function buildType(id: SelectableAdhanTypeId, muezzinId: SelectableMuezzinId): SelectableAdhanType {
  const mode = id.endsWith("-full") ? "full" : "short";
  const entry = getMuezzinLibraryEntry(muezzinId);
  const inAppUrl = entry?.inAppUrl ?? "/audio/adhan/adhan-makkah-full.m4a";
  const notificationSound = entry?.notificationSound ?? "adhan-short-makkah.caf";
  const chainHint =
    mode === "full" && entry?.iosChainedSegments
      ? " · على iOS: إشعارات متتابعة (≤٤×٢٨ث) ثم إكمال داخل التطبيق"
      : mode === "full"
        ? " · إشعار قصير + أذان كامل عند فتح التطبيق"
        : " · صوت إشعار النظام (CAF ≤٢٩ث)";
  return {
    id,
    label: mode === "full" ? "الأذان الكامل" : "تنبيه مختصر",
    hint: `${entry?.label ?? "الأذان الافتراضي"}${chainHint}`,
    muezzinId,
    mode,
    inAppUrl,
    notificationSound,
  };
}

export const SELECTABLE_ADHAN_TYPES: readonly SelectableAdhanType[] = [
  buildType("makkah-full", "makkah"),
  buildType("makkah-short", "makkah"),
];

export function getSelectableAdhanType(id: string): SelectableAdhanType {
  const mapped = LEGACY_TYPE_MAP[id] ?? "makkah-short";
  return SELECTABLE_ADHAN_TYPES.find((t) => t.id === mapped) ?? SELECTABLE_ADHAN_TYPES[1]!;
}

export function getAdhanTypeForMuezzinAndMode(
  muezzinId: string,
  mode: AdhanPlaybackMode | "" | undefined,
): SelectableAdhanType {
  const mid = clampSelectableMuezzinId(muezzinId);
  const clipped = mode === "full" ? "full" : "short";
  return buildType(`makkah-${clipped}` as SelectableAdhanTypeId, mid);
}

export function clampAdhanMuezzinId(id: string | null | undefined): SelectableMuezzinId {
  return clampSelectableMuezzinId(id);
}

export function clampAdhanPlaybackMode(mode: unknown): "full" | "short" {
  return mode === "full" ? "full" : "short";
}

export function typeIdFromPrefs(
  muezzinId: string,
  mode: AdhanPlaybackMode | "" | undefined,
): SelectableAdhanTypeId {
  const clipped = clampAdhanPlaybackMode(mode);
  return `makkah-${clipped}` as SelectableAdhanTypeId;
}

export function isAllowedAdhanMuezzinId(id: string): boolean {
  return (ALLOWED_ADHAN_MUEZZIN_IDS as readonly string[]).includes(id);
}
