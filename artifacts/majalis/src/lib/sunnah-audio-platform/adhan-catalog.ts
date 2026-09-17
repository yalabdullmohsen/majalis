/**
 * كتالوج أصوات الأذان — بيانات وصفية فقط.
 */
import type { AdhanVoiceEntry } from "./types";

export const ADHAN_VOICE_CATALOG: readonly AdhanVoiceEntry[] = [
  { id: "makkah-style", labelAr: "أذان الحرم المكي", region: "makkah", personNameAr: null, delivery: "bundled_short_clip", licenseStatus: "style_only_preview", catalogId: "makkah", notesAr: "نمط مكي بلا نسبة شخصية." },
  { id: "madinah-pending", labelAr: "نمط المدينة", region: "madinah", personNameAr: null, delivery: "stream", licenseStatus: "pending_owner_approval", catalogId: null, notesAr: "معلّق حتى الترخيص." },
  { id: "gulf-kuwait", labelAr: "أذان خليجي (الكويت)", region: "gulf", personNameAr: null, delivery: "bundled_short_clip", licenseStatus: "style_only_preview", catalogId: "kuwait", notesAr: "مقطع قصير." },
  { id: "egyptian-style", labelAr: "أذان بنمط مصري", region: "egyptian", personNameAr: null, delivery: "stream", licenseStatus: "style_only_preview", catalogId: "egypt", notesAr: "بث عند الطلب." },
  { id: "system-default", labelAr: "صوت النظام الافتراضي", region: "short_alert", personNameAr: null, delivery: "bundled_short_clip", licenseStatus: "verified_for_production", catalogId: null, notesAr: "إشعار النظام بلا ملف أذان." },
  { id: "ali-mulla-pending", labelAr: "علي ملا (معلّق)", region: "makkah", personNameAr: "علي ملا", delivery: "stream", licenseStatus: "pending_owner_approval", catalogId: null, notesAr: "يتطلب ترخيصًا صريحًا." },
  { id: "essam-bukhari-pending", labelAr: "عصام بخاري (معلّق)", region: "madinah", personNameAr: "عصام بخاري", delivery: "stream", licenseStatus: "pending_owner_approval", catalogId: null, notesAr: "يتطلب ترخيصًا صريحًا." },
  { id: "alafasy-adhan-pending", labelAr: "مشاري العفاسي — أذان (معلّق)", region: "gulf", personNameAr: "مشاري راشد العفاسي", delivery: "stream", licenseStatus: "pending_owner_approval", catalogId: "alafasy", notesAr: "أذان شخصي معلّق." },
  { id: "ghamdi-adhan-pending", labelAr: "سعد الغامدي — أذان (معلّق)", region: "makkah", personNameAr: "سعد الغامدي", delivery: "stream", licenseStatus: "pending_owner_approval", catalogId: null, notesAr: "يتطلب ترخيصًا صريحًا." },
] as const;

export function listSelectableAdhanVoices(): AdhanVoiceEntry[] {
  return ADHAN_VOICE_CATALOG.filter((v) => v.licenseStatus === "verified_for_production");
}

export function listPendingAdhanVoices(): AdhanVoiceEntry[] {
  return ADHAN_VOICE_CATALOG.filter((v) => v.licenseStatus === "pending_owner_approval");
}

export function getAdhanVoice(id: string): AdhanVoiceEntry | undefined {
  return ADHAN_VOICE_CATALOG.find((v) => v.id === id);
}
