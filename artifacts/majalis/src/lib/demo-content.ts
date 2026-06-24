import { arabicMatchAny } from "./arabic-search";

export const DEMO_LESSONS = [
  {
    id: "demo-lesson-1",
    title: "مجالس العلم — مقدمة في العقيدة الصحيحة",
    category: "عقيدة",
    mosque: "مسجد النور",
    city: "الرياض",
    delivery: "حضور",
    audience: "الكل",
    schedule: "السبت 8م",
    description: "درس تمهيدي يعرّف طالب العلم بأصول الاعتقاد على منهج أهل السنة.",
    speaker_name: "الشيخ عبدالله بن باز",
    keywords: ["مجالس العلم", "عقيدة", "الإسلام", "أهل السنة"],
    sheikhs: { name: "الشيخ عبدالله بن باز" },
  },
  {
    id: "demo-lesson-2",
    title: "أحكام الطهارة للمبتدئين",
    category: "فقه",
    mosque: "مركز الهدى",
    city: "جدة",
    delivery: "حضور",
    audience: "رجال",
    schedule: "الأحد 7م",
    description: "شرح مبسّط لأحكام الوضوء والغسل والتيمم مع أمثلة عملية.",
    speaker_name: "الشيخ محمد بن صالح العثيمين",
    keywords: ["فقه", "طهارة", "أحكام"],
    sheikhs: { name: "الشيخ محمد بن صالح العثيمين" },
  },
  {
    id: "demo-lesson-3",
    title: "تفسير سورة الفاتحة",
    category: "تفسير",
    mosque: "جامع الصفا",
    city: "الدمام",
    delivery: "بث",
    audience: "الكل",
    schedule: "الجمعة بعد العصر",
    description: "تفسير موجز لسورة الفاتحة مع بيان معانيها وأسرارها.",
    speaker_name: "الشيخ أحمد المفسر",
    keywords: ["تفسير", "قرآن"],
    sheikhs: { name: "الشيخ أحمد المفسر" },
  },
  {
    id: "demo-lesson-4",
    title: "مجلس علم — علم الحديث عند الإمام الألباني",
    category: "حديث",
    mosque: "مركز الإمام الألباني",
    city: "عمان",
    delivery: "حضور",
    audience: "الكل",
    schedule: "الثلاثاء 6م",
    description: "مجلس علمي في مصطلح الحديث ومنهج الإمام محمد ناصر الدين الألباني رحمه الله.",
    speaker_name: "الشيخ محمد ناصر الدين الألباني",
    keywords: ["حديث", "الألباني", "مجالس العلم", "سنة"],
    sheikhs: { name: "الشيخ محمد ناصر الدين الألباني" },
  },
];

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
    title: "تفريغ: أصول طلب العلم في مجالس العلم",
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

export const DEMO_FAWAID = [
  {
    id: "demo-fawaid-1",
    text: "العلم ميراث النبوة، وكل مجلس علم خطوة إلى بصيرة أوسع.",
    author_name: "مجالس العلم",
  },
  {
    id: "demo-fawaid-2",
    text: "صلاح القلب يبدأ بسؤال صادق واتباع للدليل.",
    author_name: "فائدة مختارة",
  },
  {
    id: "demo-fawaid-3",
    text: "من ثمرات طلب العلم: تواضع أكثر وخوف من الجهل.",
    author_name: "فائدة مختارة",
  },
];

export const DEMO_QA = [
  {
    id: "demo-qa-1",
    question: "ما أهمية طلب العلم الشرعي؟",
    answer: "طلب العلم الشرعي فريضة على كل مسلم، وهو سبيل معرفة دين الله والعمل به على بصيرة.",
    category_id: "demo-cat-1",
    ruling_type: null,
    evidence: "قال ﷺ: «طلب العلم فريضة على كل مسلم».",
    reference: "سنن ابن ماجه",
    status: "published",
    review_status: "approved",
    created_at: new Date().toISOString(),
    qa_categories: { name: "تأصيل", slug: "foundations" },
  },
  {
    id: "demo-qa-2",
    question: "كيف أبدأ في حفظ القرآن؟",
    answer: "ابدأ بسورة قصيرة مثل الفاتحة أو الإخلاص، وردّد على شيخ متقن، وثبّت المراجعة اليومية.",
    category_id: "demo-cat-2",
    ruling_type: "سنة",
    evidence: null,
    reference: null,
    status: "published",
    review_status: "approved",
    created_at: new Date().toISOString(),
    qa_categories: { name: "قرآن", slug: "quran" },
  },
  {
    id: "demo-qa-3",
    question: "ما حكم صيام يوم عرفة لغير الحاج؟",
    answer: "صيام يوم عرفة لغير الحاج سنة مؤكدة، وهو من أفضل الأيام التي يُستحب صيامها.",
    category_id: "demo-cat-3",
    ruling_type: "سنة",
    evidence: "عن أبي قتادة رضي الله عنه أن النبي ﷺ سُئل عن صوم يوم عرفة فقال: «يُكفِّر السنة الماضية والباقية».",
    reference: "صحيح مسلم",
    status: "published",
    review_status: "approved",
    created_at: new Date().toISOString(),
    qa_categories: { name: "أحكام شرعية", slug: "rulings" },
  },
  {
    id: "demo-qa-4",
    question: "هل الصلاة واجبة؟",
    answer: "نعم، الصلاة واجبة على كل مسلم بالغ عاقل، وهي ركن من أركان الإسلام.",
    category_id: "demo-cat-3",
    ruling_type: "حلال",
    evidence: "قال تعالى: ﴿وَأَقِيمُوا الصَّلَاةَ وَآتُوا الزَّكَاةَ﴾",
    reference: "القرآن الكريم",
    status: "published",
    review_status: "approved",
    created_at: new Date().toISOString(),
    qa_categories: { name: "أحكام شرعية", slug: "rulings" },
  },
];

export const DEMO_QA_CATEGORIES = [
  { id: "all", name: "الكل" },
  { id: "demo-cat-1", name: "تأصيل", slug: "foundations" },
  { id: "demo-cat-2", name: "قرآن", slug: "quran" },
  { id: "demo-cat-3", name: "أحكام شرعية", slug: "rulings" },
];

export function isDemoId(id: string) {
  return id.startsWith("demo-");
}

export function demoNoticeText(section: string) {
  return `لا توجد بيانات حية في ${section} بعد. نعرض محتوى تجريبيًا حتى يضيف المشرف موادًا معتمدة.`;
}

export type DemoSearchResults = {
  lessons: typeof DEMO_LESSONS;
  library: typeof DEMO_LIBRARY;
  miracles: { id: string; title: string; category: string }[];
  sheikhs: typeof DEMO_SHEIKHS;
  qa: typeof DEMO_QA;
  fawaid: typeof DEMO_FAWAID;
};

export function searchDemoContent(term: string): DemoSearchResults {
  const q = term.trim();
  if (!q) {
    return { lessons: [], library: [], miracles: [], sheikhs: [], qa: [], fawaid: [] };
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
    arabicMatchAny([f.text, f.author_name], q)
  );

  return { lessons, library, miracles: [], sheikhs, qa, fawaid };
}

export function filterDemoQa({
  categoryId,
  search,
}: {
  categoryId?: string;
  search?: string;
}) {
  let items = DEMO_QA.filter((q) => q.status === "published");
  if (categoryId && categoryId !== "all") {
    items = items.filter((q) => q.category_id === categoryId);
  }
  if (search?.trim()) {
    const s = search.trim();
    items = items.filter((q) =>
      arabicMatchAny([q.question, q.answer, q.evidence, q.reference, q.qa_categories?.name], s)
    );
  }
  return items;
}
