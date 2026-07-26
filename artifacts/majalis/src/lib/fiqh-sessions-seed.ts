import type { FiqhCouncilSession } from "./fiqh-council-types";

/** جلسات موثقة من البذور — لا تواريخ أو موضوعات مُختلَقة */
/**
 * ملاحظة تدقيق (٢٠٢٦-٠٧-٢٦): أُفرغت هذه البذرة من اثنتي عشرة «جلسة» كانت تنسب
 * دورات إلى المجمع الفقهي الإسلامي (الدورات 14-25) بلا مستند: official_source_url
 * هو الصفحة الرئيسية للجهة فقط، وlocation/country/city كلها "غير متوفر"، وagenda
 * فارغ، وstart_date = end_date (يوم واحد) في كل جلسة — ومع ذلك كانت موسومة
 * verification_status: "verified". وقد ثبت بالمقابلة مع المصدر الرسمي أن الدورة
 * الثالثة والعشرين للمجمع الفقهي برابطة العالم الإسلامي انعقدت بالرياض في أبريل
 * 2024م، فـ«الدورة 24» المؤرَّخة 2024-03-15 و«الدورة 25» المؤرَّخة 2025-03-20 لم
 * تنعقدا أصلاً. وقد حُذفت في نفس الالتزام العناصر التي كانت أعداد القرارات في هذه
 * الجلسات محسوبة منها (راجع fiqh-council-seed.ts وملف SQL المرافق)، فلم يبقَ لها
 * مضمون تصفه. لا يُعاد ملؤها إلا من قرارات منشورة برقم دورة ورقم قرار قابلَين للمقابلة.
 */
export const FIQH_SESSIONS_PUBLISHED_SEED: FiqhCouncilSession[] = [];

/** ربط session_number → slug — فارغ حتى تُوثَّق جلسات حقيقية بمصادرها */
export const FIQH_SESSION_NUMBER_MAP: Record<string, string> = {};

export function findFiqhSessionBySlug(slug: string) {
  return FIQH_SESSIONS_PUBLISHED_SEED.find((s) => s.slug === slug) || null;
}

export function getLastCompletedSessionSeed() {
  return [...FIQH_SESSIONS_PUBLISHED_SEED]
    .filter((s) => s.status === "completed" && s.verification_status === "verified")
    .sort((a, b) => (b.start_date || "").localeCompare(a.start_date || ""))[0] || null;
}

export function getUpcomingSessionSeed() {
  return null;
}
