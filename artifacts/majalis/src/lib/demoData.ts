const sheikhNames = [
  ["د. عبد الرحمن البصري", "العقيدة", "السعودية"],
  ["د. يوسف المراكشي", "الفقه المالكي", "المغرب"],
  ["الشيخ ناصر الكويتي", "التفسير", "الكويت"],
  ["د. أحمد الشامي", "الحديث وعلومه", "سوريا"],
  ["الشيخ مصطفى المدني", "السيرة النبوية", "السعودية"],
  ["د. خالد الأندلسي", "الأخلاق والتزكية", "الأندلس"],
  ["الشيخ إبراهيم المصري", "الدعوة والإرشاد", "مصر"],
  ["د. سلمان الحنبلي", "الفقه المقارن", "الأردن"],
  ["الشيخ طارق الجزائري", "علوم القرآن", "الجزائر"],
  ["د. محمد الزاهد", "التربية الإيمانية", "قطر"],
  ["الشيخ عبد الله الحضرمي", "مصطلح الحديث", "اليمن"],
  ["د. عمر التونسي", "مقاصد الشريعة", "تونس"],
  ["الشيخ وليد المقدسي", "السيرة والشمائل", "فلسطين"],
  ["د. حاتم النجدي", "العقيدة والمنهج", "السعودية"],
  ["الشيخ أنس الشنقيطي", "أصول الفقه", "موريتانيا"],
  ["د. فهد البغدادي", "الرقائق والأخلاق", "العراق"],
  ["الشيخ زيد العماني", "فقه العبادات", "عمان"],
  ["د. مازن الدمشقي", "علل الحديث", "سوريا"],
  ["الشيخ حسن الإماراتي", "الدعوة المعاصرة", "الإمارات"],
  ["د. عبد اللطيف القيرواني", "تفسير القرآن", "تونس"],
];

export const demoSheikhs = sheikhNames.map(([name, specialty, country], index) => ({
  id: `demo-sheikh-${index + 1}`,
  name,
  bio: `داعية وباحث متخصص في ${specialty}، يعتني بتقريب العلم الشرعي بلغة واضحة ومنهجية تربوية متدرجة.`,
  biography: `تلقى ${name} العلم على عدد من أهل الاختصاص، وله برامج علمية في ${specialty}، ويقدم دروسًا منهجية تجمع بين التأصيل والربط بواقع المسلم المعاصر.`,
  qualifications: ["إجازات علمية", "برامج تأصيلية", "محاضرات عامة"],
  specialties: [specialty],
  specialty,
  ijazah: `إجازات وبرامج متخصصة في ${specialty}`,
  city: country,
  country,
  photo_url: `/demo/sheikhs/sheikh-${(index % 10) + 1}.svg`,
  years_experience: 8 + (index % 12),
  is_verified: index < 12,
  lessons_count: 5,
  created_at: new Date(2026, 0, index + 1).toISOString(),
}));

const lessonCategories = ["العقيدة", "الفقه", "التفسير", "الحديث", "السيرة", "الأخلاق", "الدعوة"];
const lessonSeries = [
  "مدخل إلى",
  "قواعد في",
  "شرح مختصر في",
  "مجالس من",
  "وقفات تربوية مع",
  "أصول",
  "معالم",
  "دروس عملية في",
  "بناء طالب العلم في",
  "مختارات من",
];

export const demoLessons = Array.from({ length: 100 }, (_, index) => {
  const category = lessonCategories[index % lessonCategories.length];
  const sheikh = demoSheikhs[index % demoSheikhs.length];
  const number = index + 1;
  return {
    id: `demo-lesson-${number}`,
    title: `${lessonSeries[index % lessonSeries.length]} ${category} - المجلس ${Math.floor(index / lessonCategories.length) + 1}`,
    description: `درس تجريبي منظم في ${category} يركز على المعاني الأساسية والتطبيقات العملية، مع أمثلة مختصرة وأسئلة للمراجعة.`,
    duration: `${35 + (index % 6) * 7} دقيقة`,
    sheikh_id: sheikh.id,
    sheikhs: { ...sheikh },
    category,
    mosque: "المجلس العلمي الافتراضي",
    city: sheikh.country,
    audience: "الكل",
    delivery: index % 3 === 0 ? "بث مباشر" : "حضور فقط",
    schedule: `كل ${["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس"][index % 5]} بعد العشاء`,
    lesson_time: "08:30 مساءً",
    thumbnail_url: `/demo/lessons/lesson-${(index % 12) + 1}.svg`,
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    status: "approved",
    created_at: new Date(2026, 1, number).toISOString(),
  };
});

const bookCategories = ["العقيدة", "الفقه", "التفسير", "الحديث", "السيرة", "الأخلاق", "الدعوة", "أصول الفقه", "تزكية", "لغة"];
const bookTitles = [
  "زاد طالب العلم",
  "مختصر أصول الإيمان",
  "مفاتيح التدبر",
  "الفقه الميسر",
  "رياض السيرة",
  "منارات الأخلاق",
  "دليل الداعية",
  "قواعد الاستدلال",
  "لطائف الحديث",
  "بناء الملكة العلمية",
];

export const demoLibrary = Array.from({ length: 50 }, (_, index) => {
  const category = bookCategories[index % bookCategories.length];
  const sheikh = demoSheikhs[index % demoSheikhs.length];
  const number = index + 1;
  return {
    id: `demo-book-${number}`,
    title: `${bookTitles[index % bookTitles.length]} ${number}`,
    author_name: sheikh.name,
    type: "كتاب",
    category,
    sheikh_id: sheikh.id,
    sheikhs: { ...sheikh },
    description: `كتاب تجريبي في ${category} يقدم مادة علمية مختصرة، منظمة، ومناسبة للقراءة المنهجية والمراجعة السريعة.`,
    cover_url: `/demo/books/book-${(index % 10) + 1}.svg`,
    file_url: "",
    external_url: "",
    status: "approved",
    created_at: new Date(2026, 2, number).toISOString(),
  };
});

export const demoFawaid = [
  { id: "demo-fawaid-1", text: "العلم إذا صحبه العمل أورث صاحبه بصيرة وثباتًا.", author_name: "فائدة مختارة", status: "approved", created_at: new Date().toISOString() },
  { id: "demo-fawaid-2", text: "من بركة المجلس أن يخرج المرء منه بسؤال صادق وعزم جديد.", author_name: "المجلس العلمي", status: "approved", created_at: new Date().toISOString() },
  { id: "demo-fawaid-3", text: "القليل المتقن من العلم أنفع من الكثير المشتت.", author_name: "فائدة تربوية", status: "approved", created_at: new Date().toISOString() },
];

export const demoQa = [
  {
    id: "demo-qa-1",
    question: "كيف أبدأ طلب العلم بطريقة صحيحة؟",
    answer: "يبدأ طالب العلم بتصحيح النية، ثم دراسة المختصرات المعتمدة على يد أهل العلم، مع العناية بالمراجعة والعمل بما يتعلم.",
    qa_categories: { name: "طلب العلم", slug: "learning" },
    status: "published",
    review_status: "approved",
    created_at: new Date().toISOString(),
  },
];

export function isDemoId(id: string | undefined) {
  return Boolean(id?.startsWith("demo-"));
}
