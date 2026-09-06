/**
 * أنواع الأذان المعروضة للمستخدم: تنبيه قصير فقط.
 * المؤذن يُختار من adhan-muezzin-library.
 *
 * داخل التطبيق: MP3/M4A من /audio/adhan أو CDN.
 * إشعار iOS: CAF قصير من حزمة Sounds.
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
  /** دائماً short — full محذوف */
  mode: "short";
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
  // معرّف *-full للتوافق فقط — التسليم دائماً short
  const mode = "short" as const;
  const entry = getMuezzinLibraryEntry(muezzinId);
  const inAppUrl = entry?.inAppUrl ?? "/audio/adhan/adhan-makkah-full.m4a";
  const notificationSound = entry?.notificationSound ?? "adhan-short-makkah.caf";
  return {
    id,
    label: "تنبيه مختصر",
    hint: `${entry?.label ?? "الأذان الافتراضي"} · صوت إشعار قصير (CAF ≤٢٩ث)`,
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
  _mode: AdhanPlaybackMode | "" | undefined,
): SelectableAdhanType {
  const mid = clampSelectableMuezzinId(muezzinId);
  // دائماً short — full محذوف
  return buildType("makkah-short", mid);
}

export function clampAdhanMuezzinId(id: string | null | undefined): SelectableMuezzinId {
  return clampSelectableMuezzinId(id);
}

export function clampAdhanPlaybackMode(mode: unknown): "short" {
  // أي full قديم يُرحَّل إلى short
  void mode;
  return "short";
}

export function typeIdFromPrefs(
  muezzinId: string,
  _mode: AdhanPlaybackMode | "" | undefined,
): SelectableAdhanTypeId {
  void muezzinId;
  return "makkah-short";
}

export function isAllowedAdhanMuezzinId(id: string): boolean {
  return (ALLOWED_ADHAN_MUEZZIN_IDS as readonly string[]).includes(id);
}
