/**
 * Seed queue for Review Hub — realistic Arabic moderation samples.
 * Audio URLs use everyayah CDN so playback works in production.
 */
import type { ContentReviewItem, RecitationReviewItem, ReviewItem } from "./types";

function peaks(seed: number, count = 48): number[] {
  const out: number[] = [];
  let x = seed;
  for (let i = 0; i < count; i++) {
    x = (x * 16807) % 2147483647;
    const n = (x % 1000) / 1000;
    const envelope = 0.35 + 0.65 * Math.sin((i / count) * Math.PI);
    out.push(Math.min(1, Math.max(0.08, n * envelope)));
  }
  return out;
}

function ayahUrl(surah: number, ayah: number): string {
  const s = String(surah).padStart(3, "0");
  const a = String(ayah).padStart(3, "0");
  return `https://everyayah.com/data/Alafasy_128kbps/${s}${a}.mp3`;
}

const RECITATIONS: RecitationReviewItem[] = [
  {
    id: "rec-001",
    stream: "recitation",
    status: "pending",
    priority: "high",
    flaggedByAi: true,
    userId: "u-1042",
    userName: "أحمد الراشد",
    surah: 1,
    ayah: 1,
    verseRef: "الفاتحة ١",
    expectedText: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    aiScore: 62,
    audioUrl: ayahUrl(1, 1),
    waveform: peaks(11),
    submittedAt: "2026-07-28T08:12:00.000Z",
    notes: "انخفاض تطابق على «الرحمن»",
  },
  {
    id: "rec-002",
    stream: "recitation",
    status: "flagged_ai",
    priority: "high",
    flaggedByAi: true,
    userId: "u-2088",
    userName: "نورة السالم",
    surah: 1,
    ayah: 2,
    verseRef: "الفاتحة ٢",
    expectedText: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    aiScore: 48,
    audioUrl: ayahUrl(1, 2),
    waveform: peaks(22),
    submittedAt: "2026-07-28T09:40:00.000Z",
    notes: "طلب مراجعة بشرية صريحة",
  },
  {
    id: "rec-003",
    stream: "recitation",
    status: "pending",
    priority: "normal",
    flaggedByAi: false,
    userId: "u-3310",
    userName: "أحمد بن عبدالله",
    surah: 1,
    ayah: 5,
    verseRef: "سورة الفاتحة - آية 5",
    expectedText: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    aiScore: 82,
    audioUrl: ayahUrl(1, 5),
    waveform: peaks(33),
    submittedAt: "2026-07-28T10:05:00.000Z",
    notes: "شك في نطق الحرف المشدد (إيَّاك)",
  },
  {
    id: "rec-004",
    stream: "recitation",
    status: "pending",
    priority: "normal",
    flaggedByAi: true,
    userId: "u-4412",
    userName: "سارة القحطاني",
    surah: 2,
    ayah: 255,
    verseRef: "البقرة ٢٥٥",
    expectedText:
      "اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ ۚ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ",
    aiScore: 71,
    audioUrl: ayahUrl(2, 255),
    waveform: peaks(44),
    submittedAt: "2026-07-27T18:22:00.000Z",
  },
  {
    id: "rec-005",
    stream: "recitation",
    status: "approved",
    priority: "normal",
    flaggedByAi: false,
    userId: "u-5501",
    userName: "يوسف المالكي",
    surah: 112,
    ayah: 1,
    verseRef: "الإخلاص ١",
    expectedText: "قُلْ هُوَ اللَّهُ أَحَدٌ",
    aiScore: 97,
    audioUrl: ayahUrl(112, 1),
    waveform: peaks(55),
    submittedAt: "2026-07-27T14:00:00.000Z",
  },
  {
    id: "rec-006",
    stream: "recitation",
    status: "rejected",
    priority: "normal",
    flaggedByAi: true,
    userId: "u-6602",
    userName: "ماجد الحربي",
    surah: 1,
    ayah: 7,
    verseRef: "الفاتحة ٧",
    expectedText:
      "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    aiScore: 28,
    audioUrl: ayahUrl(1, 7),
    waveform: peaks(66),
    submittedAt: "2026-07-26T16:45:00.000Z",
    feedback: "التلاوة غير مكتملة — يُرجى إعادة التسجيل من أول الآية.",
  },
];

const CONTENT: ContentReviewItem[] = [
  {
    id: "cnt-001",
    stream: "content",
    status: "pending",
    priority: "high",
    flaggedByAi: false,
    userId: "u-sch-12",
    userName: "الشيخ عبد الرحمن",
    category: "tafsir_edit",
    title: "تعديل حاشية في كتاب فقه العبادات",
    originalText: "النية شرط أساسي في جميع العبادات.",
    editedText:
      "النية شرط أساسي وركن لا تصح الصلاة إلا به في سائر العبادات.",
    submittedAt: "2026-07-28T07:30:00.000Z",
    notes: "إضافة توضيح فقهي",
  },
  {
    id: "cnt-002",
    stream: "content",
    status: "flagged_ai",
    priority: "high",
    flaggedByAi: true,
    userId: "u-7720",
    userName: "مشعل الدوسري",
    category: "question",
    title: "سؤال: حكم قراءة الفاتحة خلف الإمام",
    originalText: "",
    editedText:
      "ما حكم قراءة الفاتحة للمأموم في الصلاة الجهرية؟ وهل تجب مع قراءة الإمام؟ أرجو التفصيل مع الدليل.",
    submittedAt: "2026-07-28T11:10:00.000Z",
    notes: "الذكاء أشار لاحتمال تكرار سؤال منشور",
  },
  {
    id: "cnt-003",
    stream: "content",
    status: "pending",
    priority: "normal",
    flaggedByAi: false,
    userId: "u-sch-03",
    userName: "أ. منى الزهراني",
    category: "article",
    title: "مقال: آداب طلب العلم في المسجد",
    originalText:
      "طلب العلم عبادة، وينبغي للمتعلم أن يخلص النية ويوقر العالم.",
    editedText:
      "طلب العلم عبادة جليلة، وينبغي للمتعلم أن يخلص النية لله، ويوقر العالم، ويجلس بأدب في حلقة المسجد، ولا يرفع صوته فوق صوت شيخه.",
    submittedAt: "2026-07-27T20:15:00.000Z",
  },
  {
    id: "cnt-004",
    stream: "content",
    status: "pending",
    priority: "normal",
    flaggedByAi: true,
    userId: "u-8891",
    userName: "فهد الشمري",
    category: "forum",
    title: "نقاش: أفضل طبعات المصحف للتعلّم",
    originalText: "أي طبعة تنصحون بها للمبتدئين؟",
    editedText:
      "أي طبعة تنصحون بها للمبتدئين في الحفظ؟ وهل مصحف المدينة أوضح من غيره من ناحية الضبط؟",
    submittedAt: "2026-07-28T06:55:00.000Z",
  },
  {
    id: "cnt-005",
    stream: "content",
    status: "approved",
    priority: "normal",
    flaggedByAi: false,
    userId: "u-sch-07",
    userName: "الشيخ إبراهيم النجدي",
    category: "tafsir_edit",
    title: "تصحيح إحالة تفسير سورة العصر",
    originalText: "قال الطبري في تفسيره…",
    editedText: "قال الإمام الطبري رحمه الله في جامع البيان…",
    submittedAt: "2026-07-25T12:00:00.000Z",
  },
  {
    id: "cnt-006",
    stream: "content",
    status: "rejected",
    priority: "high",
    flaggedByAi: true,
    userId: "u-9900",
    userName: "مستخدم مجهول",
    category: "forum",
    title: "منشور بلا مصدر",
    originalText: "",
    editedText: "سمعت أن كذا وكذا دون إسناد.",
    submittedAt: "2026-07-24T09:00:00.000Z",
    feedback: "يُرفض لعدم التوثيق ومخالفة سياسة المصادر.",
  },
];

export const REVIEW_HUB_SEED: ReviewItem[] = [...RECITATIONS, ...CONTENT];

export const REVIEW_HUB_DEFAULT_METRICS = {
  totalPending: 0,
  dailyRecitationVerifications: 128,
  activeScholars: 14,
  systemAccuracyRate: 0.943,
};
