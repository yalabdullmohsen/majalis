import type { ExternalCompetition } from "./types";

/** لا يُنشر إعلان ناقص: عنوان + جهة + رابط/تواصل. */
export function canPublishCompetition(draft: Partial<ExternalCompetition> | null | undefined): boolean {
  if (!draft) return false;
  const title = (draft.title || "").trim();
  const organizer = (draft.organizerName || "").trim();
  if (title.length < 3 || organizer.length < 2) return false;
  return Boolean(
    (draft.registrationUrl || "").trim() ||
      (draft.whatsappUrl || "").trim() ||
      (draft.phone || "").trim() ||
      (draft.sourceUrl || "").trim(),
  );
}

export function registrationIsOpen(status: ExternalCompetition["registrationStatus"]): boolean {
  return status === "مفتوح";
}

/** تطبيع حالات قديمة مخزّنة كـ«قريبًا» قبل عرضها للمستخدم. */
export function registrationStatusLabel(status: string): string {
  if (status === "قريبًا" || status === "قريبا") return "لم يبدأ التسجيل";
  return status;
}
