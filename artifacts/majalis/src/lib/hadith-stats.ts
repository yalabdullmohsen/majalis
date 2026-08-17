/**
 * إحصائيات الحديث — بطاقات منقولة من مطبوع معتمد فقط.
 * لا عدّ آلي من المرآة المحلية؛ لا شارات نسبة بلا بسط/مقام مسمّى.
 */

import sahihaynCards from "../../content/hadith-stats/sahihayn.json";

export type HadithRepeatMode = "with-repeats" | "without-repeats" | "n/a";

export type HadithStatSource = {
  book: string;
  edition: string;
  editor: string;
};

export type HadithStatCard = {
  id: string;
  label: string;
  value: number;
  repeatMode: HadithRepeatMode;
  numberingSystem: string;
  /** معيار إسقاط التكرار — يظهر في البطاقة عند بغير مكرر */
  dedupeCriterion?: string;
  source: HadithStatSource;
  note?: string;
  href?: string;
};

export type HadithKpi = {
  id: string;
  label: string;
  value: number;
  hint?: string;
  href?: string;
  tone?: "sahih" | "emerald" | "sand" | "neutral";
  /** نسبة مسمّاة فقط — بسط ومقام واضحان في التسمية */
  namedRatio?: { label: string; part: number; whole: number };
  numberingSystem?: string;
  repeatModeLabel?: string;
  sourceLine?: string;
  note?: string;
};

export type HadithStatsSnapshot = {
  updatedLabel: string;
  disclaimer: string;
  kpis: HadithKpi[];
  cards: HadithStatCard[];
  methods: string[];
};

function arNum(n: number): string {
  return n.toLocaleString("ar-EG");
}

function pct(part: number, whole: number): number {
  if (!whole) return 0;
  return Math.round((part / whole) * 1000) / 10;
}

export function formatHadithStat(n: number): string {
  return arNum(n);
}

/** نسبة مسمّاة فقط — تُستدعى مع تسمية البسط/المقام في الواجهة */
export function formatHadithNamedPct(part: number, whole: number): string {
  return `${pct(part, whole).toLocaleString("ar-EG")}٪`;
}

/** @deprecated استخدم formatHadithNamedPct مع تسمية واضحة */
export function formatHadithPct(part: number, whole: number): string {
  return formatHadithNamedPct(part, whole);
}

export function repeatModeLabel(mode: HadithRepeatMode): string {
  if (mode === "with-repeats") return "بالمكرر";
  if (mode === "without-repeats") return "بغير مكرر";
  return "لا ينطبق مكرر/غير مكرر";
}

export const HADITH_STAT_CARDS: HadithStatCard[] = sahihaynCards as HadithStatCard[];

export function buildHadithStatsSnapshot(): HadithStatsSnapshot {
  const cards = HADITH_STAT_CARDS;
  const bukhariWith = cards.find((c) => c.id === "bukhari-with-repeats");
  const bukhariWithout = cards.find((c) => c.id === "bukhari-without-repeats");
  const muslim = cards.find((c) => c.id === "muslim-abdulbaqi");
  const bBooks = cards.find((c) => c.id === "bukhari-books");
  const mBooks = cards.find((c) => c.id === "muslim-books");

  const kpis: HadithKpi[] = [];

  if (bukhariWith) {
    kpis.push({
      id: bukhariWith.id,
      label: bukhariWith.label,
      value: bukhariWith.value,
      tone: "sahih",
      href: bukhariWith.href,
      numberingSystem: bukhariWith.numberingSystem,
      repeatModeLabel: repeatModeLabel(bukhariWith.repeatMode),
      sourceLine: `${bukhariWith.source.book} · ${bukhariWith.source.edition}`,
      note: bukhariWith.note,
      hint: `${bukhariWith.numberingSystem} · ${repeatModeLabel(bukhariWith.repeatMode)}`,
    });
  }

  if (bukhariWithout && bukhariWith) {
    kpis.push({
      id: bukhariWithout.id,
      label: bukhariWithout.label,
      value: bukhariWithout.value,
      tone: "emerald",
      href: bukhariWithout.href,
      numberingSystem: bukhariWithout.numberingSystem,
      repeatModeLabel: repeatModeLabel(bukhariWithout.repeatMode),
      sourceLine: `${bukhariWithout.source.book} · ${bukhariWithout.source.editor}`,
      note: [bukhariWithout.note, bukhariWithout.dedupeCriterion].filter(Boolean).join(" — "),
      hint: `${repeatModeLabel(bukhariWithout.repeatMode)} · ${bukhariWithout.dedupeCriterion ?? ""}`,
      namedRatio: {
        label: "نسبة بغير المكرر من عدّ فتح الباري بالمكرر",
        part: bukhariWithout.value,
        whole: bukhariWith.value,
      },
    });
  }

  if (muslim) {
    kpis.push({
      id: muslim.id,
      label: muslim.label,
      value: muslim.value,
      tone: "emerald",
      href: muslim.href,
      numberingSystem: muslim.numberingSystem,
      repeatModeLabel: repeatModeLabel(muslim.repeatMode),
      sourceLine: `${muslim.source.book} · ${muslim.source.edition}`,
      note: [muslim.note, muslim.dedupeCriterion].filter(Boolean).join(" — "),
      hint: `${muslim.numberingSystem} · ${repeatModeLabel(muslim.repeatMode)}`,
    });
  }

  if (bBooks) {
    kpis.push({
      id: bBooks.id,
      label: bBooks.label,
      value: bBooks.value,
      tone: "sand",
      href: bBooks.href,
      numberingSystem: bBooks.numberingSystem,
      sourceLine: `${bBooks.source.book}`,
      note: bBooks.note,
      hint: bBooks.numberingSystem,
    });
  }

  if (mBooks) {
    kpis.push({
      id: mBooks.id,
      label: mBooks.label,
      value: mBooks.value,
      tone: "neutral",
      href: mBooks.href,
      numberingSystem: mBooks.numberingSystem,
      sourceLine: `${mBooks.source.book} · ${mBooks.source.editor}`,
      note: mBooks.note,
      hint: mBooks.numberingSystem,
    });
  }

  return {
    updatedLabel: "أرقام منقولة من طبعات معتمدة — بلا عدّ محلي",
    disclaimer:
      "كل رقم يذكر نظام الترقيم وبيان المكرر صراحةً ومصدره المطبوع. لا تُعرض أعداد مرآة CDN كإحصاء كلاسيكي، ولا تُلصق درجات ملفّقة للأحاديث.",
    kpis,
    cards,
    methods: [
      "بحث بالرقم أو المعرّف (bukhari:1)",
      "بحث بجزء من المتن بعد التطبيع",
      "بحث باسم الراوي",
      "عرض الحكم المنقول فقط منسوبًا لقائله",
    ],
  };
}

/** توافق قديم — أعداد كلاسيكية للعرض فقط؛ ليست عدّ CDN */
export const HADITH_STATS_SOURCE = {
  bukhari: 7563,
  muslim: 3033,
  sahihayn: 7563 + 3033,
  bukhariBooks: 97,
  muslimBooks: 54,
  bukhariWithoutRepeats: 2602,
} as const;
