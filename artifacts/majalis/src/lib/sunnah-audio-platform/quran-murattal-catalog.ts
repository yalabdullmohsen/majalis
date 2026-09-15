/**
 * كتالوج التلاوات المرتّلة — إحالة لبث quran-audio فقط.
 */
import type { MurattalReciterEntry } from "./types";

export const MURATTAL_RECITER_CATALOG: readonly MurattalReciterEntry[] = [
  { id: "husary-murattal", nameAr: "محمود خليل الحصري (مرتل)", catalogId: "husary", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "minshawi-murattal", nameAr: "محمد صديق المنشاوي (مرتل)", catalogId: "minshawi", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "abdulsamad-murattal", nameAr: "عبد الباسط عبد الصمد (مرتل)", catalogId: "abdulsamad", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "high", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "ayyoub-murattal", nameAr: "محمد أيوب", catalogId: "ayyoub", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "alafasy-murattal", nameAr: "مشاري راشد العفاسي", catalogId: "alafasy", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "ghamdi-murattal", nameAr: "سعد الغامدي", catalogId: "ghamdi", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "data_saver", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "maher-murattal", nameAr: "ماهر المعيقلي", catalogId: "maher", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "ajamy-murattal", nameAr: "أحمد العجمي", catalogId: "ajamy", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "data_saver", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "dosari-murattal", nameAr: "ياسر الدوسري", catalogId: "dosari", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
  { id: "jaleel-murattal", nameAr: "خالد الجليل", catalogId: "jaleel", style: "murattal", licenseStatus: "pending_owner_approval", qualityDefault: "medium", notesAr: "بث عام — موافقة المالك مطلوبة." },
] as const;

export function listMurattalReciters(): readonly MurattalReciterEntry[] {
  return MURATTAL_RECITER_CATALOG;
}

export function getMurattalReciter(id: string): MurattalReciterEntry | undefined {
  return MURATTAL_RECITER_CATALOG.find((r) => r.id === id);
}
