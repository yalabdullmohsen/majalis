/**
 * كتالوج أصوات التنبيه/الأذان القصير — يعرض فقط الأصوات المعتمدة والمرخّصة.
 * الأذان الكامل محذوف نهائيًا من المنتج.
 */
import catalogJson from "../../content/audio/audio-sources.json";

export type AlertSoundStatus = "approved" | "needs_license" | "rejected";
export type AlertSoundKind = "adhan_short" | "alert" | "silent" | "adhan_full";

export type AlertSoundEntry = {
  id: string;
  labelAr: string;
  kind: AlertSoundKind;
  status: AlertSoundStatus;
  license: string;
  source: string;
  iosFile: string | null;
  webFile: string | null;
  durationSecApprox?: number;
  notes?: string;
  rejectionReason?: string;
};

type CatalogFile = {
  sounds: AlertSoundEntry[];
  policy: { fullAdhanAllowed: boolean; maxDurationSec: number };
};

const catalog = catalogJson as CatalogFile;

export const ALERT_SOUND_CATALOG: readonly AlertSoundEntry[] = catalog.sounds;

/** الأصوات المعروضة للمستخدم فقط */
export function listApprovedAlertSounds(): AlertSoundEntry[] {
  return ALERT_SOUND_CATALOG.filter((s) => s.status === "approved");
}

export function listApprovedAdhanShortSounds(): AlertSoundEntry[] {
  return listApprovedAlertSounds().filter((s) => s.kind === "adhan_short" || s.kind === "silent" || s.id.startsWith("alert-"));
}

export function getAlertSound(id: string | null | undefined): AlertSoundEntry | undefined {
  if (!id) return undefined;
  return ALERT_SOUND_CATALOG.find((s) => s.id === id);
}

export function getApprovedAlertSound(id: string | null | undefined): AlertSoundEntry {
  const hit = getAlertSound(id);
  if (hit && hit.status === "approved") return hit;
  return (
    getAlertSound("alert-default-short") ||
    listApprovedAlertSounds()[0]!
  );
}

/** اسم ملف iOS LocalNotifications (جذر الحزمة) */
export function iosNotificationSoundName(soundId: string | null | undefined): string | undefined {
  const s = getApprovedAlertSound(soundId);
  if (s.kind === "silent" || !s.iosFile) return undefined;
  return s.iosFile;
}

/** مسار معاينة الويب */
export function webPreviewUrl(soundId: string | null | undefined): string | null {
  const s = getApprovedAlertSound(soundId);
  return s.webFile;
}

export const DEFAULT_ADHAN_SHORT_SOUND_ID = "adhan-makkah-short";
export const DEFAULT_ALERT_SOUND_ID = "alert-default-short";

/** هل ما زال الأذان الكامل مسموحًا؟ دائمًا لا. */
export function isFullAdhanAllowed(): boolean {
  return false;
}
