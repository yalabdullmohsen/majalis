export const DEMO_LESSONS = [
  {
    id: "demo-lesson-1",
    title: "مقدمة في العقيدة الصحيحة",
    category: "عقيدة",
    mosque: "مسجد النور",
    city: "الرياض",
    delivery: "حضور",
    audience: "الكل",
    schedule: "السبت 8م",
    description: "درس تمهيدي يعرّف طالب العلم بأصول الاعتقاد على منهج أهل السنة.",
    sheikhs: { name: "الشيخ عبدالله العلمي" },
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
    sheikhs: { name: "الشيخ محمد الفقيه" },
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
    sheikhs: { name: "الشيخ أحمد المفسر" },
  },
];

export const DEMO_SHEIKHS = [
  {
    id: "demo-sheikh-1",
    name: "الشيخ عبدالله العلمي",
    ijazah: "إجازة في العقيدة والحديث",
    city: "الرياض",
    years_experience: 20,
    is_verified: true,
    specialties: ["عقيدة", "حديث"],
  },
  {
    id: "demo-sheikh-2",
    name: "الشيخ محمد الفقيه",
    ijazah: "إجازة في الفقه المقارن",
    city: "جدة",
    years_experience: 15,
    is_verified: true,
    specialties: ["فقه", "أصول"],
  },
  {
    id: "demo-sheikh-3",
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
    title: "تفريغ: أصول طلب العلم",
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
    qa_categories: { name: "تأصيل" },
  },
  {
    id: "demo-qa-2",
    question: "كيف أبدأ في حفظ القرآن؟",
    qa_categories: { name: "قرآن" },
  },
];

export function isDemoId(id: string) {
  return id.startsWith("demo-");
}

export function demoNoticeText(section: string) {
  return `لا توجد بيانات حية في ${section} بعد. نعرض محتوى تجريبيًا حتى يضيف المشرف موادًا معتمدة.`;
}
