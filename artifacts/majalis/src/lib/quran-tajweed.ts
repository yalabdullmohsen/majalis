export type TajweedLevel = "مبتدئ" | "متوسط" | "متقدم";

export type TajweedSectionId =
  | "basics"
  | "makhraj-sifat"
  | "noon-rules"
  | "meem-rules"
  | "madd"
  | "waqf"
  | "practice";

export type TajweedSection = {
  id: TajweedSectionId;
  title: string;
  description: string;
  order: number;
};

export type TajweedQuizItem = {
  question: string;
  choices: string[];
  correctIndex: number;
};

export type TajweedLesson = {
  id: string;
  title: string;
  sectionId: TajweedSectionId;
  level: TajweedLevel;
  summary: string;
  material: string;
  explanation: string;
  examples: string[];
  practiceAyahs: { surah: number; ayahs: number[]; note: string }[];
  quiz: TajweedQuizItem[];
  source: string;
  lastReviewed: string;
};

export const TAJWEED_SECTIONS: TajweedSection[] = [
  {
    id: "basics",
    title: "مبادئ التجويد",
    description: "تعريف التجويد وأهميته وآداب التلاوة.",
    order: 1,
  },
  {
    id: "makhraj-sifat",
    title: "المخارج والصفات",
    description: "مواضع خروج الحروف وصفاتها اللازمة والعارضة.",
    order: 2,
  },
  {
    id: "noon-rules",
    title: "أحكام النون الساكنة والتنوين",
    description: "الإظهار، الإدغام، الإقلاب، والإخفاء.",
    order: 3,
  },
  {
    id: "meem-rules",
    title: "أحكام الميم الساكنة",
    description: "الإخفاء الشفوي، الإدغام الشفوي، والإظهار الشفوي.",
    order: 4,
  },
  {
    id: "madd",
    title: "المدود",
    description: "المد الطبيعي والفرعي: المتصل، المنفصل، اللازم، والعارض.",
    order: 5,
  },
  {
    id: "waqf",
    title: "الوقف والابتداء",
    description: "علامات الوقف في المصحف وآداب التوقف عند التلاوة.",
    order: 6,
  },
  {
    id: "practice",
    title: "التطبيق العملي",
    description: "تفخيم وترقيق وتطبيقات على الراء واللام وهمزتي الوصل والقطع.",
    order: 7,
  },
];

const RAW_LESSONS: Omit<TajweedLesson, "quiz">[] = [
  {
    id: "intro-tajweed",
    title: "تعريف التجويد وأهميته",
    sectionId: "basics",
    level: "مبتدئ",
    summary: "معنى التجويد شرعاً ولغةً، ولماذا يُعدّ أساس التلاوة الصحيحة.",
    material: "مبادئ التجويد",
    explanation:
      "التجويد لغةً: الإتقان. وشرعاً: إخراج كل حرف من مخرجه الصحيح مع إعطائه حقه ومستحقه من الصفات. قال الإمام ابن الجزري: «التجويد: علم بكيفية أداء الحروف من حيث مخرجها وصفاتها». من أهدافه: حفظ اللسان من اللحن في كتاب الله.",
    examples: ["تلاوة الفاتحة بمراعاة المخارج", "تمييز الحروف المتشابهة في النطق"],
    practiceAyahs: [{ surah: 1, ayahs: [1, 2, 3, 4], note: "قراءة الفاتحة مع التركيز على مخارج الحروف" }],
    source: "متن الجزرية — مقدمة التجويد",
    lastReviewed: "2026-06-27",
  },
  {
    id: "makhraj",
    title: "مخارج الحروف",
    sectionId: "makhraj-sifat",
    level: "مبتدئ",
    summary: "معرفة مواضع خروج الحروف من الفم والحلق واللسان.",
    material: "المخارج",
    explanation:
      "مخارج الحروف هي المواضع التي تخرج منها الحروف عند النطق. العلماء قسّموها إلى ستة عشر مخرجاً رئيسياً. إتقان المخارج أساس التلاوة الصحيحة.",
    examples: ["الهمزة من أقصى الحلق", "العين من وسط اللسان", "الضاد من حافة اللسان"],
    practiceAyahs: [{ surah: 1, ayahs: [1, 2, 3], note: "تطبيق مخارج الحروف في الفاتحة" }],
    source: "متن الجزرية وشروح التجويد المعتمدة",
    lastReviewed: "2026-06-27",
  },
  {
    id: "sifat",
    title: "صفات الحروف",
    sectionId: "makhraj-sifat",
    level: "متوسط",
    summary: "الصفات اللازمة والعارضة للحروف الهجائية.",
    material: "الصفات",
    explanation:
      "للحروف صفات تُميّزها عن غيرها: الهمس والجهر، الشدة والرخاوة، الاستعلاء والاستفال، وغيرها. فهم الصفات يُحسّن التلاوة ويمنع اللحن.",
    examples: ["الباء: جهر، شدة، انفتاح", "الفاء: همس، رخاوة", "الطاء: استعلاء، انطباق"],
    practiceAyahs: [{ surah: 112, ayahs: [1, 2, 3, 4], note: "تمييز صفات الحروف في الإخلاص" }],
    source: "متن الجزرية",
    lastReviewed: "2026-06-27",
  },
  {
    id: "noon-sakinah",
    title: "أحكام النون الساكنة والتنوين",
    sectionId: "noon-rules",
    level: "متوسط",
    summary: "الإظهار، الإدغام، الإقلاب، والإخفاء.",
    material: "أحكام النون",
    explanation:
      "إذا جاء بعد النون الساكنة أو التنوين حرف، يُطبّق أحد أربعة أحكام: الإظهار الحلقي، الإدغام، الإقلاب، أو الإخفاء الحقيقي.",
    examples: ["منْ عَمَل — إظهار", "مِنْ رَبِّهِم — إدغام", "مِنْ بَعْد — إقلاب", "أَنْتُم — إخفاء"],
    practiceAyahs: [{ surah: 2, ayahs: [255], note: "آية الكرسي — تطبيق أحكام النون" }],
    source: "متن الجزرية — باب أحكام النون الساكنة",
    lastReviewed: "2026-06-27",
  },
  {
    id: "meem-sakinah",
    title: "أحكام الميم الساكنة",
    sectionId: "meem-rules",
    level: "متوسط",
    summary: "الإخفاء الشفوي، الإدغام الشفوي، والإظهار الشفوي.",
    material: "أحكام الميم",
    explanation: "للميم الساكنة ثلاثة أحكام عند لقاء حرف آخر: الإخفاء الشفوي، الإدغام الشفوي، والإظهار الشفوي.",
    examples: ["تَرْمِيهِمْ بِحِجَارَةٍ — إخفاء", "لَهُمْ مَّا — إدغام", "أَمْ تَأْمُر — إظهار"],
    practiceAyahs: [{ surah: 114, ayahs: [1, 2, 3, 4, 5, 6], note: "سورة الناس" }],
    source: "متن الجزرية",
    lastReviewed: "2026-06-27",
  },
  {
    id: "madd-lesson",
    title: "المدود",
    sectionId: "madd",
    level: "متوسط",
    summary: "المد الطبيعي، الممد، والمد اللازم والعارض.",
    material: "المدود",
    explanation:
      "المد: إطالة الصوت بحرف من حروف المد (الألف، الواو، الياء). ينقسم إلى طبيعي وفرعي (متصل، منفصل، لازم، عارض).",
    examples: ["قَالُوا — مد طبيعي", "الضَّالِّينَ — مد لازم", "يَا أَيُّهَا — مد منفصل"],
    practiceAyahs: [{ surah: 1, ayahs: [2, 6, 7], note: "مدود الفاتحة" }],
    source: "متن الجزرية — باب المد",
    lastReviewed: "2026-06-27",
  },
  {
    id: "waqf",
    title: "الوقف والابتداء",
    sectionId: "waqf",
    level: "مبتدئ",
    summary: "علامات الوقف في المصحف وآداب التوقف عند التلاوة.",
    material: "الوقف والابتداء",
    explanation:
      "الوقف: قطع الصوت زمناً كافياً للتنفس. علامات المصحف: ╌ تام، ╌ جائز، ╌ حسن، ╌ قبيح. الابتداء: البدء من موضع مناسب بعد الوقف.",
    examples: ["م — وقف لازم", "ط — وقف مطلق", "ج — وقف جائز", "ص — وصل"],
    practiceAyahs: [{ surah: 2, ayahs: [1, 2, 3, 4, 5], note: "تطبيق الوقف في أوائل البقرة" }],
    source: "أحكام الوقف والابتداء — ابن الجزري",
    lastReviewed: "2026-06-27",
  },
  {
    id: "tafkheem",
    title: "التفخيم والترقيق",
    sectionId: "practice",
    level: "متقدم",
    summary: "تفخيم وترقيق حرف الراء واللام والألف بعدها.",
    material: "التطبيق العملي",
    explanation:
      "التفخيم: ملء الفم بالصوت. الترقيق: ضعف الصوت. الراء تُفخّم أو ترقق بحسب حركتها وما قبلها. اللام في لفظ الجلالة تُفخّم أو ترقق.",
    examples: ["رَبِّ — راء مفخّمة", "رِزْق — راء مرققة", "الله — لام مفخّمة أو مرققة"],
    practiceAyahs: [{ surah: 1, ayahs: [2, 3, 4], note: "تفخيم وترقيق في الفاتحة" }],
    source: "متن الجزرية",
    lastReviewed: "2026-06-27",
  },
  {
    id: "raa",
    title: "أحكام الراءات",
    sectionId: "practice",
    level: "متقدم",
    summary: "تفخيم وترقيق الراء بحسب حركتها والحرف السابق.",
    material: "التطبيق العملي",
    explanation:
      "الراء تُفخّم إذا كانت مفتوحة أو مضمومة، أو ساكنة بعد فتح أو ضم. وترقق إذا كانت مكسورة أو ساكنة بعد كسر.",
    examples: ["رَحْمَن — مفخّمة", "رِجَال — مرققة", "مِرْصَاد — مرققة"],
    practiceAyahs: [{ surah: 55, ayahs: [1, 2, 3], note: "الرحمن — تطبيق أحكام الراء" }],
    source: "متن الجزرية",
    lastReviewed: "2026-06-27",
  },
  {
    id: "laam",
    title: "أحكام اللامات",
    sectionId: "practice",
    level: "متقدم",
    summary: "لام لفظ الجلالة واللامات في القرآن.",
    material: "التطبيق العملي",
    explanation:
      "لام لفظ الجلالة: تُفخّم إذا سبقت بفتح أو ضم، وترقق إذا سبقت بكسر. ولامات أخرى لها أحكام خاصة في الإظهار والإدغام.",
    examples: ["بِسْمِ اللَّه — لام مرققة", "قَالَ اللَّه — لام مفخّمة", "لِلَّه — لام مرققة"],
    practiceAyahs: [{ surah: 1, ayahs: [1, 3], note: "لامات الفاتحة" }],
    source: "متن الجزرية",
    lastReviewed: "2026-06-27",
  },
  {
    id: "hamza",
    title: "همزتا الوصل والقطع",
    sectionId: "practice",
    level: "متوسط",
    summary: "الفرق بين همزة الوصل وهمزة القطع في التلاوة والكتابة.",
    material: "التطبيق العملي",
    explanation:
      "همزة الوصل: تُنطق عند البدء بالكلمة ولا تُنطق عند الوصل. همزة القطع: تُنطق دائماً. مثال: «الْحَمْدُ» همزة وصل، «أَنْعَمْتَ» همزة قطع.",
    examples: ["ٱلْحَمْدُ — همزة وصل", "إِيَّاكَ — همزة قطع", "ٱسْتَعِينُوا — همزة وصل"],
    practiceAyahs: [{ surah: 1, ayahs: [1, 2, 5, 6], note: "همزات الفاتحة" }],
    source: "علوم القرآن — مراجع معتمدة",
    lastReviewed: "2026-06-27",
  },
];

function defaultQuiz(lesson: Omit<TajweedLesson, "quiz">): TajweedQuizItem[] {
  if (lesson.id === "intro-tajweed") {
    return [
      {
        question: "ما معنى التجويد لغةً؟",
        choices: ["الإتقان", "السرعة", "الرفع", "الوقف"],
        correctIndex: 0,
      },
      {
        question: "ما هدف التجويد الأساسي؟",
        choices: ["إخراج الحروف من مخارجها", "زيادة سرعة القراءة", "حفظ السور", "كتابة المصحف"],
        correctIndex: 0,
      },
    ];
  }
  return [
    {
      question: `أي مما يلي يرتبط بدرس «${lesson.title}»؟`,
      choices: [lesson.material, "التفسير الموضوعي", "أحكام الحج", "النحو"],
      correctIndex: 0,
    },
  ];
}

function enrichLesson(lesson: Omit<TajweedLesson, "quiz"> & { quiz?: TajweedQuizItem[] }): TajweedLesson {
  return {
    ...lesson,
    quiz: lesson.quiz?.length ? lesson.quiz : defaultQuiz(lesson),
  };
}

function isCompleteLesson(lesson: TajweedLesson): boolean {
  return Boolean(
    lesson.id &&
      lesson.title?.trim() &&
      lesson.summary?.trim() &&
      lesson.explanation?.trim() &&
      lesson.material?.trim() &&
      lesson.source?.trim() &&
      lesson.examples.length > 0 &&
      lesson.practiceAyahs.length > 0,
  );
}

export const TAJWEED_LESSONS = RAW_LESSONS.map(enrichLesson).filter(isCompleteLesson);

export function getTajweedLesson(id: string): TajweedLesson | undefined {
  return TAJWEED_LESSONS.find((l) => l.id === id);
}

export function getTajweedLessonsBySection(sectionId: TajweedSectionId): TajweedLesson[] {
  return TAJWEED_LESSONS.filter((l) => l.sectionId === sectionId);
}

export function getTajweedSectionsWithLessons() {
  return TAJWEED_SECTIONS.map((section) => ({
    ...section,
    lessons: getTajweedLessonsBySection(section.id),
  })).filter((s) => s.lessons.length > 0);
}
