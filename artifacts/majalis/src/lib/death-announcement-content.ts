import type { DeathAnnouncementForm } from "@/lib/condolence-shared";

export const DEATH_ANNOUNCEMENT_VERSE = "إنا لله وإنا إليه راجعون";

export type DeathAnnouncementCopy = {
  transition: string;
  burialLine: string;
  prayerLine: string;
  condolenceLine: string;
  phoneLine: string;
  closing: string;
};

export function buildDeathAnnouncementCopy(
  form: DeathAnnouncementForm,
  forPreview = false,
): DeathAnnouncementCopy {
  const male = form.gender === "male";
  const day = forPreview && !form.day.trim() ? "الخميس" : form.day.trim() || "……";
  const prayer = forPreview && !form.prayer.trim() ? "العشاء" : form.prayer.trim() || "……";
  const cemetery = forPreview && !form.cemetery.trim() ? "الصليبيخات" : form.cemetery.trim() || "……";
  const address =
    forPreview && !form.condolenceAddress.trim()
      ? "منزل العائلة — منطقة …"
      : form.condolenceAddress.trim() || "……";
  const phone = forPreview && !form.phone.trim() ? "99999999" : form.phone.trim() || "……";

  return {
    transition: male ? "انتقل إلى رحمة الله تعالى" : "انتقلت إلى رحمة الله تعالى",
    burialLine: male
      ? `وسيوارى جثمانه الثرى يوم ${day}`
      : `وسيوارى جثمانها الثرى يوم ${day}`,
    prayerLine: `بعد صلاة ${prayer} في مقبرة ${cemetery}`,
    condolenceLine: `العزاء: ${address}`,
    phoneLine: `التليفون: ${phone}`,
    closing: male ? "رحمه الله وأسكنه فسيح جناته" : "رحمها الله وأسكنها فسيح جناتها",
  };
}
