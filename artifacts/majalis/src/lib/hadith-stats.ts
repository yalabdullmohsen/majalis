/**
 * إحصائيات قسم الحديث — أعداد ونسب من المرجع المحلي والبذرة المنسّقة ومصطلح الحديث.
 * الصحة في الصحيحين = عضوية الكتاب؛ لا تُلصق درجات ملفّقة لكل سند.
 */

export type HadithStatBar = {
  id: string;
  label: string;
  value: number;
  total: number;
  tone: "sahih" | "daif" | "mawdu" | "emerald" | "sand" | "neutral";
  href?: string;
  note?: string;
};

export type HadithKpi = {
  id: string;
  label: string;
  value: number;
  suffix?: string;
  hint?: string;
  href?: string;
  tone?: HadithStatBar["tone"];
  pctOf?: number;
};

export type HadithRingSlice = {
  id: string;
  label: string;
  value: number;
  tone: HadithStatBar["tone"];
  href?: string;
};

export type HadithStatsSnapshot = {
  updatedLabel: string;
  disclaimer: string;
  kpis: HadithKpi[];
  authenticityBars: HadithStatBar[];
  sahihaynBars: HadithStatBar[];
  scienceBars: HadithStatBar[];
  sahihaynRing: HadithRingSlice[];
  curatedRing: HadithRingSlice[];
  mustalahRing: HadithRingSlice[];
  coverage: Array<{ label: string; value: string; hint: string }>;
  methods: string[];
};

/** أعداد ثابتة من المرجع المحلي والبذرة (تُحدَّث مع الملء/التدقيق). */
export const HADITH_STATS_SOURCE = {
  bukhari: 7580,
  muslim: 7360,
  sahihayn: 14940,
  bukhariBooks: 97,
  muslimBooks: 56,
  curatedSahih: 931,
  curatedDaif: 349,
  curatedMawdu: 265,
  mustalahTerms: 101,
  mustalahAccepted: 59,
  mustalahRejected: 27,
  mustalahNeutral: 15,
  matnSplitBukhariPct: 97.6,
  matnSplitMuslimPct: 93.3,
  takhrijBookCoveragePct: 100,
  searchScopes: 4,
  auditPasses: 4,
} as const;

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

function arNum(n: number): string {
  return n.toLocaleString("ar-EG");
}

export function formatHadithStat(n: number): string {
  return arNum(n);
}

export function formatHadithPct(part: number, whole: number): string {
  return `${pct(part, whole).toLocaleString("ar-EG")}٪`;
}

/** زوايا conic-gradient من شرائح النسب (مجموع = ١٠٠٪ من القيم). */
export function ringConicGradient(slices: HadithRingSlice[]): string {
  const toneColor: Record<HadithRingSlice["tone"], string> = {
    sahih: "#5CC49A",
    emerald: "#3FAE84",
    daif: "#F59E0B",
    mawdu: "#EF4444",
    sand: "#B8963F",
    neutral: "#94A3B8",
  };
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  let cursor = 0;
  const parts: string[] = [];
  for (const slice of slices) {
    const start = cursor;
    const span = (slice.value / total) * 100;
    cursor += span;
    parts.push(`${toneColor[slice.tone]} ${start}% ${cursor}%`);
  }
  return `conic-gradient(from 180deg, ${parts.join(", ")})`;
}

export function buildHadithStatsSnapshot(): HadithStatsSnapshot {
  const s = HADITH_STATS_SOURCE;
  const curatedTotal = s.curatedSahih + s.curatedDaif + s.curatedMawdu;
  const mustalahGraded = s.mustalahAccepted + s.mustalahRejected + s.mustalahNeutral;
  const sectionTotal = s.sahihayn + s.curatedDaif + s.curatedMawdu;
  const booksTotal = s.bukhariBooks + s.muslimBooks;

  return {
    updatedLabel: "محدَّثة من مرجع الصحيحين والبذرة المنسّقة ومصطلح الحديث",
    disclaimer:
      "درجة الصحيحين = عضوية البخاري ومسلم. البطاقات المنسّقة للتحذير والتوعية تحمل تخريجًا منسوبًا؛ لا تُخلط مع الصحة المطلقة.",
    kpis: [
      {
        id: "sahihayn",
        label: "حديث في الصحيحين",
        value: s.sahihayn,
        hint: "مرجع الصحة بالملكية",
        href: "/hadith/sahih",
        tone: "sahih",
        pctOf: sectionTotal,
      },
      {
        id: "bukhari",
        label: "صحيح البخاري",
        value: s.bukhari,
        hint: `${arNum(s.bukhariBooks)} كتابًا · ${formatHadithPct(s.bukhari, s.sahihayn)}`,
        href: "/hadith/books",
        tone: "emerald",
        pctOf: s.sahihayn,
      },
      {
        id: "muslim",
        label: "صحيح مسلم",
        value: s.muslim,
        hint: `${arNum(s.muslimBooks)} كتابًا · ${formatHadithPct(s.muslim, s.sahihayn)}`,
        href: "/hadith/books",
        tone: "emerald",
        pctOf: s.sahihayn,
      },
      {
        id: "curated",
        label: "بطاقة منسّقة",
        value: curatedTotal,
        hint: `صحيح ${formatHadithPct(s.curatedSahih, curatedTotal)} · تحذير ${formatHadithPct(s.curatedDaif + s.curatedMawdu, curatedTotal)}`,
        tone: "sand",
      },
      {
        id: "mustalah",
        label: "مصطلح حديثي",
        value: s.mustalahTerms,
        hint: `${formatHadithPct(s.mustalahAccepted, mustalahGraded)} مقبول`,
        href: "/hadith-science",
        tone: "neutral",
      },
      {
        id: "books",
        label: "كتاب في الصحيحين",
        value: booksTotal,
        hint: `بخاري ${arNum(s.bukhariBooks)} · مسلم ${arNum(s.muslimBooks)}`,
        href: "/hadith/books",
        tone: "sand",
      },
    ],
    authenticityBars: [
      {
        id: "sahih",
        label: "الصحيح (الصحيحان)",
        value: s.sahihayn,
        total: sectionTotal,
        tone: "sahih",
        href: "/hadith/sahih",
        note: `${formatHadithPct(s.sahihayn, sectionTotal)} من أقسام العرض`,
      },
      {
        id: "mawdu",
        label: "الموضوع",
        value: s.curatedMawdu,
        total: sectionTotal,
        tone: "mawdu",
        href: "/hadith/mawdu",
        note: `${formatHadithPct(s.curatedMawdu, sectionTotal)} · ${formatHadithPct(s.curatedMawdu, curatedTotal)} من المنسّق`,
      },
      {
        id: "makthub",
        label: "المكذوب / الضعيف",
        value: s.curatedDaif,
        total: sectionTotal,
        tone: "daif",
        href: "/hadith/daif",
        note: `${formatHadithPct(s.curatedDaif, sectionTotal)} · ${formatHadithPct(s.curatedDaif, curatedTotal)} من المنسّق`,
      },
    ],
    sahihaynBars: [
      {
        id: "b-share",
        label: "نصيب البخاري",
        value: s.bukhari,
        total: s.sahihayn,
        tone: "emerald",
        note: formatHadithPct(s.bukhari, s.sahihayn),
      },
      {
        id: "m-share",
        label: "نصيب مسلم",
        value: s.muslim,
        total: s.sahihayn,
        tone: "sahih",
        note: formatHadithPct(s.muslim, s.sahihayn),
      },
      {
        id: "b-books",
        label: "كتب البخاري",
        value: s.bukhariBooks,
        total: booksTotal,
        tone: "sand",
        note: formatHadithPct(s.bukhariBooks, booksTotal),
      },
      {
        id: "m-books",
        label: "كتب مسلم",
        value: s.muslimBooks,
        total: booksTotal,
        tone: "neutral",
        note: formatHadithPct(s.muslimBooks, booksTotal),
      },
    ],
    scienceBars: [
      {
        id: "ms-acc",
        label: "مصطلحات مقبولة",
        value: s.mustalahAccepted,
        total: mustalahGraded || s.mustalahTerms,
        tone: "sahih",
        href: "/hadith-science",
        note: formatHadithPct(s.mustalahAccepted, mustalahGraded || s.mustalahTerms),
      },
      {
        id: "ms-rej",
        label: "مصطلحات مردودة",
        value: s.mustalahRejected,
        total: mustalahGraded || s.mustalahTerms,
        tone: "mawdu",
        href: "/hadith-science",
        note: formatHadithPct(s.mustalahRejected, mustalahGraded || s.mustalahTerms),
      },
      {
        id: "ms-neu",
        label: "مصطلحات محايدة",
        value: s.mustalahNeutral,
        total: mustalahGraded || s.mustalahTerms,
        tone: "neutral",
        href: "/hadith-science",
        note: formatHadithPct(s.mustalahNeutral, mustalahGraded || s.mustalahTerms),
      },
      {
        id: "matn-b",
        label: "فصل متن البخاري",
        value: Math.round(s.matnSplitBukhariPct),
        total: 100,
        tone: "emerald",
        note: `${s.matnSplitBukhariPct.toLocaleString("ar-EG")}٪ عرض بلا سند`,
      },
      {
        id: "matn-m",
        label: "فصل متن مسلم",
        value: Math.round(s.matnSplitMuslimPct),
        total: 100,
        tone: "sahih",
        note: `${s.matnSplitMuslimPct.toLocaleString("ar-EG")}٪ عرض بلا سند`,
      },
      {
        id: "takhrij",
        label: "تغطية رقم الكتاب",
        value: s.takhrijBookCoveragePct,
        total: 100,
        tone: "sand",
        note: "تخريج بالكتاب والرقم",
      },
    ],
    sahihaynRing: [
      { id: "bukhari", label: "البخاري", value: s.bukhari, tone: "emerald", href: "/hadith/books" },
      { id: "muslim", label: "مسلم", value: s.muslim, tone: "sahih", href: "/hadith/books" },
    ],
    curatedRing: [
      { id: "c-sahih", label: "صحيح منسّق", value: s.curatedSahih, tone: "sahih", href: "/hadith/sahih" },
      { id: "c-daif", label: "مكذوب/ضعيف", value: s.curatedDaif, tone: "daif", href: "/hadith/daif" },
      { id: "c-mawdu", label: "موضوع", value: s.curatedMawdu, tone: "mawdu", href: "/hadith/mawdu" },
    ],
    mustalahRing: [
      { id: "acc", label: "مقبول", value: s.mustalahAccepted, tone: "sahih", href: "/hadith-science" },
      { id: "rej", label: "مردود", value: s.mustalahRejected, tone: "mawdu", href: "/hadith-science" },
      { id: "neu", label: "محايد", value: s.mustalahNeutral, tone: "neutral", href: "/hadith-science" },
    ],
    coverage: [
      {
        label: "طرق البحث",
        value: arNum(s.searchScopes),
        hint: "متن · سند+متن · تخريج · أرقام",
      },
      {
        label: "مرجع الصحة",
        value: "عضوية",
        hint: "الصحيحان بلا درجات ملفّقة",
      },
      {
        label: "عرض البطاقة",
        value: "متن",
        hint: "السند والتخريج في التفاصيل",
      },
      {
        label: "تدقيق الجودة",
        value: `${arNum(s.auditPasses)} تمريرات`,
        hint: "اكتمال · نص · تخريج · عيّنات",
      },
    ],
    methods: [
      "بحث المتن",
      "بحث السند والمتن",
      "بحث التخريج والشرح",
      "أرقام الحديث والكتاب",
      "تصفية المجموعة",
      "تصفية الموضوع",
      "الصحيح ← الموضوع ← المكذوب",
    ],
  };
}
