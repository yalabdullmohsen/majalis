import type { ShariaRuling } from "./platform-types";

export const RULINGS_SEED: ShariaRuling[] = [
  {
    id: "ruling-wudu-nullifiers",
    external_key: "ruling-wudu-nullifiers",
    title: "نواقض الوضوء",
    summary: "ما يُبطل الوضوء من أحداث ونواقض.",
    body: `**نواقض الوضوء:**
1. خروج شيء من السبيلين (بول، غائط، ريح).
2. النوم الخفيف أو الثقيل.
3. مسّ الفرج بشهوة.
4. أكل لحم الإبل (عند جمهور العلماء).
5. الكفر والردة.

**الدليل:** قوله ﷺ: «الوضوء مما خرج من السبيلين».`,
    category: "الطهارة",
    evidence: [
      { type: "حديث", text: "الوضوء مما خرج من السبيلين", source: "رواه مسلم" },
    ],
    references: [{ text: "المغني لابن قدامة", source: "كتاب الطهارة" }],
    keywords: ["وضوء", "طهارة", "نواقض"],
    status: "approved",
    view_count: 3400,
    created_at: "2024-01-05T08:00:00Z",
  },
  {
    id: "ruling-prayer-pillars",
    external_key: "ruling-prayer-pillars",
    title: "أركان الصلاة",
    summary: "الأركان التي لا تصح الصلاة إلا بها.",
    body: `**أركان الصلاة:**
1. القيام مع القدرة.
2. تكبيرة الإحرام.
3. قراءة الفاتحة.
4. الركوع.
5. الرفع من الركوع.
6. السجود.
7. الجلوس بين السجدتين.
8. الطمأنينة في جميع الأركان.
9. التشهد الأخير.
10. الجلوس له.
11. الصلاة على النبي ﷺ.
12. التسليم.`,
    category: "الصلاة",
    evidence: [
      { type: "حديث", text: "صلوا كما رأيتموني أصلي", source: "رواه البخاري" },
    ],
    keywords: ["صلاة", "أركان", "عبادات"],
    status: "approved",
    view_count: 5200,
    created_at: "2023-11-20T07:00:00Z",
  },
  {
    id: "ruling-zakat-conditions",
    external_key: "ruling-zakat-conditions",
    title: "شروط وجوب الزكاة",
    summary: "الشروط التي تجب بها الزكاة في المال.",
    body: `**شروط وجوب الزكاة:**
1. الإسلام.
2. الحرية.
3. بلوغ النصاب.
4. حولان الحول.
5. التميُّز (الملك التام).
6. النماء (عند بعض العلماء).`,
    category: "الزكاة",
    evidence: [
      { type: "قرآن", text: "خُذْ مِنْ أَمْوَالِهِمْ صَدَقَةً", source: "سورة التوبة: 103" },
    ],
    keywords: ["زكاة", "شروط", "نصاب"],
    status: "approved",
    view_count: 2800,
    created_at: "2023-08-14T06:00:00Z",
  },
  {
    id: "ruling-hajj-pillars",
    external_key: "ruling-hajj-pillars",
    title: "أركان الحج",
    summary: "ما لا يتم الحج إلا به.",
    body: `**أركان الحج:**
1. الإحرام.
2. الوقوف بعرفة.
3. طواف الإفاضة.
4. السعي بين الصفا والمروة.

**واجبات الحج:** الوقوف بعرفة إلى الغروب، المبيت بمزدلفة، رمي الجمار، حلق أو تقصير الرأس، طواف الوداع.`,
    category: "الحج",
    evidence: [
      { type: "قرآن", text: "وَلِلَّهِ عَلَى النَّاسِ حِجُّ الْبَيْتِ", source: "سورة آل عمران: 97" },
    ],
    keywords: ["حج", "أركان", "عرفة"],
    status: "approved",
    view_count: 1900,
    created_at: "2023-06-01T05:00:00Z",
  },
  {
    id: "ruling-trade-conditions",
    external_key: "ruling-trade-conditions",
    title: "شروط صحة البيع",
    summary: "ما يشترط لصحة عقد البيع في الشريعة.",
    body: `**شروط صحة البيع:**
1. رضا الطرفين.
2. معلومية المبيع والثمن.
3. التمكين من المبيع.
4. أن يكون المبيع مباحاً.
5. أن لا يكون فيه غرر فاحش.`,
    category: "المعاملات",
    evidence: [
      { type: "حديث", text: "إنما البيع عن تراض", source: "رواه ابن ماجه" },
    ],
    keywords: ["بيع", "معاملات", "تجارة"],
    status: "approved",
    view_count: 2100,
    created_at: "2023-04-22T04:00:00Z",
  },
  {
    id: "ruling-inheritance-shares",
    external_key: "ruling-inheritance-shares",
    title: "أنصبة الميراث في القرآن",
    summary: "توزيع الميراث بين الورثة وفق الآيات القرآنية.",
    body: `**أنصبة الميراث:**
- للزوج النصف إن لم يكن للزوجة ولد، والربع إن كان.
- للزوجة الربع إن لم يكن للزوج ولد، والثمن إن كان.
- للابن ضعف نصيب البنت.
- للأب السدس مع ولد، والتوريث مع ولد الابن.
- للأم الثلث إن لم يكن ولد، والسدس مع ولد.`,
    category: "المواريث",
    evidence: [
      { type: "قرآن", text: "يُوصِيكُمُ اللَّهُ فِي أَوْلَادِكُمْ", source: "سورة النساء: 11" },
    ],
    keywords: ["ميراث", "مواريث", "ورثة"],
    status: "approved",
    view_count: 1600,
    created_at: "2023-02-10T03:00:00Z",
  },
];

export function findRulingById(id: string) {
  return RULINGS_SEED.find((r) => r.id === id || r.external_key === id) || null;
}
