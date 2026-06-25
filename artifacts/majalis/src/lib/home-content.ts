import { lessonAds, type LessonAd } from "@/lib/lesson-ads";

export type KuwaitLesson = {
  id: string;
  sheikhName: string;
  sheikhImage?: string;
  title: string;
  day: string;
  time: string;
  mosque: string;
  region: string;
  governorate: string;
  category: string;
  status: "نشط" | "منتهٍ";
  note?: string;
};

const CATEGORY_FROM_TAGS: Record<string, string> = {
  تفسير: "تفسير",
  فقه: "فقه",
  حديث: "حديث",
  عقيدة: "عقيدة",
  سنة: "حديث",
  "دورة علمية": "تأصيل",
  "برنامج تعليمي": "فقه",
};

function categoryForAd(ad: LessonAd): string {
  for (const tag of ad.tags) {
    if (CATEGORY_FROM_TAGS[tag]) return CATEGORY_FROM_TAGS[tag];
  }
  return "أخرى";
}

function regionFromDistrict(district: string): string {
  const part = district.split("–")[0]?.split("-")[0]?.trim();
  return part || district.trim();
}

function governorateFromDistrict(district: string): string {
  if (district.includes("القيروان") || district.includes("الفردوس")) return "العاصمة";
  if (district.includes("الجهراء")) return "الجهراء";
  if (district.includes("حولي")) return "حولي";
  return "العاصمة";
}

function lessonsFromAds(): KuwaitLesson[] {
  const rows: KuwaitLesson[] = [];

  for (const ad of lessonAds) {
    ad.sessions.forEach((session, idx) => {
      const genericLabel = session.label === "المجلس الأسبوعي" || session.label === "البرنامج الأسبوعي";
      rows.push({
        id: `kw-${ad.id}-${idx}`,
        sheikhName: ad.teacher,
        sheikhImage: ad.teacherImage,
        title: genericLabel ? ad.title : `${ad.title} — ${session.label}`,
        day: session.day,
        time: session.time,
        mosque: session.venue,
        region: regionFromDistrict(session.district),
        governorate: governorateFromDistrict(session.district),
        category: categoryForAd(ad),
        status: "نشط",
        note: session.note || ad.shortDescription,
      });
    });
  }

  return rows;
}

export const KUWAIT_LESSONS: KuwaitLesson[] = lessonsFromAds();

export const DAILY_HADITH = {
  text: "مَنْ سَلَكَ طَرِيقًا يَلْتَمِسُ فِيهِ عِلْمًا سَهَّلَ اللَّهُ لَهُ طَرِيقًا إِلَى الْجَنَّةِ",
  narrator: "أبو هريرة رضي الله عنه",
  source: "رواه مسلم",
  meaning: "السعي في طلب العلم سبب لتيسير طريق الجنة.",
};

export const DAILY_AYAH = {
  text: "وَقُل رَّبِّ زِدْنِي عِلْمًا",
  surah: "سورة طه",
  ayahNumber: 114,
  meaning: "من أعظم الأدعية أن يسأل العبد ربه زيادة العلم النافع.",
};
