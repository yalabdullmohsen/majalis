import { arabicMatchAny } from "./arabic-search";
import { SEED_QA, QA_CATEGORIES, filterSeedQa } from "./qa-seed";
import { SEED_FAWAID, FAWAID_CATEGORIES, filterSeedFawaid } from "./fawaid-seed";
import { ADHKAR_CATEGORIES, filterAdhkar } from "./adhkar-seed";

import { SEED_QA, QA_CATEGORIES, filterSeedQa } from "./qa-seed";
import { SEED_FAWAID, FAWAID_CATEGORIES, filterSeedFawaid } from "./fawaid-seed";
import { filterQualityFawaid } from "./content-quality";
import { ADHKAR_CATEGORIES, filterAdhkar } from "./adhkar-seed";
import { lessonAds } from "./lesson-ads";

export { FAWAID_CATEGORIES, filterSeedFawaid };

export const DEMO_LESSONS = lessonAds.flatMap((ad) =>
  ad.sessions.map((session, idx) => ({
    id: `demo-kw-${ad.id}-${idx}`,
    title: ad.title,
    category: ad.tags.includes("تفسير")
      ? "تفسير"
      : ad.tags.includes("فقه")
        ? "فقه"
        : ad.tags.includes("حديث")
          ? "حديث"
          : ad.tags.includes("عقيدة")
            ? "عقيدة"
            : "أخرى",
    mosque: session.venue,
    city: "العاصمة",
    region: session.district.split("–")[0]?.trim() || session.district,
    delivery: ad.tags.includes("بث مباشر") ? "كلاهما" : "حضور فقط",
    audience: ad.hasWomenSection ? "الكل" : "رجال",
    schedule: `${session.day} — ${session.time}`,
    day_of_week: session.day,
    lesson_time: session.time,
    description: session.note || ad.shortDescription,
    speaker_name: ad.teacher,
    status: "approved",
    keywords: ad.tags,
    sheikhs: { name: ad.teacher },
  })),
);

export const DEMO_SHEIKHS = [
  {
    id: "demo-sheikh-1",
    name: "الشيخ عبدالله بن باز",
    ijazah: "إجازة في العقيدة والحديث",
    city: "الرياض",
    years_experience: 20,
    is_verified: true,
    specialties: ["عقيدة", "حديث", "فتاوى"],
    bio: "من كبار علماء المملكة العربية السعودية.",
  },
  {
    id: "demo-sheikh-2",
    name: "الشيخ محمد بن صالح العثيمين",
    ijazah: "إجازة في الفقه المقارن",
    city: "القصيم",
    years_experience: 15,
    is_verified: true,
    specialties: ["فقه", "أصول", "تفسير"],
    bio: "عالم فقيه مفسر من أبرز علماء نجد.",
  },
  {
    id: "demo-sheikh-3",
    name: "الشيخ محمد ناصر الدين الألباني",
    ijazah: "إجازة في علوم الحديث",
    city: "عمان",
    years_experience: 18,
    is_verified: true,
    specialties: ["حديث", "علل", "سنة"],
    bio: "محدث العصر وإمام الجرح والتعديل المعاصر.",
  },
  {
    id: "demo-sheikh-4",
    name: "الشيخ أحمد المفسر",
    ijazah: "إجازة في التفسير",
    city: "الدمام",
    years_experience: 18,
    is_verified: true,
    specialties: ["تفسير", "لغة"],
  },
];

export const DEMO_LIBRARY = [
  {
    id: "demo-library-1",
    title: "العقيدة الطحاوية — شرح مختصر",
    type: "كتاب",
    category: "عقيدة",
    description: "ملخص منظم لأهم مسائل العقيدة في متن الطحاوية.",
  },
  {
    id: "demo-library-2",
    title: "متن الآجرومية",
    type: "متن",
    category: "لغة",
    description: "متن كلاسيكي في النحو العربي مع شرح مبسّط.",
  },
  {
    id: "demo-library-3",
    title: "تفريغ: أصول طلب العلم في المجلس العلمي",
    type: "تفريغ",
    category: "تأصيل",
    description: "تفريغ درس علمي عن آداب طلب العلم ومراتبه.",
  },
  {
    id: "demo-library-4",
    title: "ملخص: أركان الإسلام",
    type: "ملخص",
    category: "عقيدة",
    description: "ملخص مرئي لأركان الإسلام الخمسة.",
  },
];

export const DEMO_MIRACLES = [
  {
    id: "demo-miracle-1",
    title: "آيات التفكر في خلق السماوات والأرض",
    source_type: "قرآن",
    category: "فلك",
    body: "قال تعالى: ﴿إِنَّ فِي خَلْقِ السَّمَاوَاتِ وَالْأَرْضِ وَاخْتِلَافِ اللَّيْلِ وَالنَّهَارِ لَآيَاتٍ لِّأُولِي الْأَلْبَابِ﴾ — دلالة على عظمة الخالق في نظام الكون.",
    status: "approved",
  },
  {
    id: "demo-miracle-2",
    title: "دلائل القدرة في خلق الإنسان",
    source_type: "قرآن",
    category: "طب",
    body: "قال تعالى: ﴿فَنَظِرْ إِلَىٰ إِطْفَارِهِ﴾ — إشارة إلى بدء خلق الإنسان من نطفة ومراحل نموه المعجزة.",
    status: "approved",
  },
  {
    id: "demo-miracle-3",
    title: "الجبال أوتادًا للأرض",
    source_type: "قرآن",
    category: "جيولوجيا",
    body: "قال تعالى: ﴿وَأَلْقَىٰ فِي الْأَرْضِ رَوَاسِيَ﴾ — وصف علمي لدور الجبال في ثبات الأرض.",
    status: "approved",
  },
];

export const DEMO_FAWAID = filterQualityFawaid(SEED_FAWAID);

export const DEMO_QA = SEED_QA;

export const DEMO_QA_CATEGORIES = [{ id: "all", name: "الكل" }, ...QA_CATEGORIES];

export function isDemoId(id: string) {
  return id.startsWith("demo-") || id.startsWith("seed-");
}

export type DemoSearchResults = {
  lessons: typeof DEMO_LESSONS;
  library: typeof DEMO_LIBRARY;
  miracles: { id: string; title: string; category: string }[];
  sheikhs: typeof DEMO_SHEIKHS;
  qa: typeof DEMO_QA;
  fawaid: typeof DEMO_FAWAID;
  adhkar: { id: string; text: string; category?: string; source?: string }[];
};

export function searchDemoContent(term: string): DemoSearchResults {
  const q = term.trim();
  if (!q) {
    return { lessons: [], library: [], miracles: [], sheikhs: [], qa: [], fawaid: [], adhkar: [] };
  }

  const lessons = DEMO_LESSONS.filter((l) =>
    arabicMatchAny(
      [l.title, l.description, l.speaker_name, l.category, ...(l.keywords || [])],
      q
    )
  );

  const sheikhs = DEMO_SHEIKHS.filter((s) =>
    arabicMatchAny([s.name, s.bio, s.ijazah, s.city, ...(s.specialties || [])], q)
  );

  const library = DEMO_LIBRARY.filter((it) =>
    arabicMatchAny([it.title, it.description, it.category, it.type], q)
  );

  const qa = DEMO_QA.filter((x) =>
    arabicMatchAny([x.question, x.answer, x.qa_categories?.name, x.reference], q)
  );

  const fawaid = DEMO_FAWAID.filter((f) =>
    arabicMatchAny([f.text, f.author_name, f.category, f.source], q)
  );

  const adhkar = filterAdhkar(q).slice(0, 15).map((item) => ({
    id: item.id,
    text: item.text,
    category: ADHKAR_CATEGORIES.find((c) => c.id === item.categoryId)?.name,
    source: item.source,
  }));

  return { lessons, library, miracles: [], sheikhs, qa, fawaid, adhkar };
}

export function filterDemoQa({
  categoryId,
  search,
}: {
  categoryId?: string;
  search?: string;
}) {
  return filterSeedQa({ categoryId, search });
}
