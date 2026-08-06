/**
 * Smart Content Recommendation Engine (logic-only).
 * Maps a current reading context → related Fiqh / texts / Azkar with
 * time-of-day and seasonal awareness. Silent fallbacks — never throws.
 */
import { resolveTimeOfDay, type TimeOfDay } from "@/lib/daily-context";
import { normalizeArabic } from "@/shared/arabic-normalize";
import { expandSearchTerms } from "@/lib/search-synonyms";

export type SmartRecKind = "fiqh" | "adhkar" | "quran" | "fawaid" | "seasonal";

export type SmartRecommendation = {
  id: string;
  kind: SmartRecKind;
  title: string;
  href: string;
  reason: string;
  score: number;
};

export type SmartRecContext = {
  /** Free-text of the article / verse currently read. */
  text?: string;
  title?: string;
  contentType?: string;
  keywords?: string[];
  now?: Date;
};

const FIQH_TOPIC_MAP: Array<{ keys: string[]; title: string; href: string }> = [
  { keys: ["صلاة", "قيام", "تهجد", "وضوء"], title: "فقه الصلاة", href: "/fiqh/salah" },
  { keys: ["زكاة", "صدقة"], title: "فقه الزكاة", href: "/fiqh/zakat" },
  { keys: ["صيام", "صوم", "رمضان"], title: "فقه الصيام", href: "/fiqh/sawm" },
  { keys: ["حج", "عمرة"], title: "فقه الحج", href: "/fiqh/hajj" },
  { keys: ["نكاح", "زواج", "طلاق"], title: "فقه الأسرة", href: "/fiqh/usra" },
  { keys: ["طهارة", "غسل", "نجاسة"], title: "فقه الطهارة", href: "/fiqh/taharah" },
  { keys: ["بيع", "ربا", "معاملات"], title: "فقه المعاملات", href: "/fiqh/muamalat" },
];

const ADHKAR_BY_TIME: Record<TimeOfDay, { title: string; href: string; reason: string }> = {
  fajr: { title: "أذكار الصباح", href: "/adhkar/morning", reason: "وقت أذكار الصباح" },
  duha: { title: "أذكار الصباح", href: "/adhkar/morning", reason: "امتداد أذكار الصباح" },
  zuhr: { title: "أذكار بعد الصلاة", href: "/adhkar/after-salah", reason: "أذكار ما بعد الفريضة" },
  asr: { title: "أذكار متنوعة", href: "/adhkar/misc", reason: "وقت مناسب للذكر" },
  maghrib: { title: "أذكار المساء", href: "/adhkar/evening", reason: "وقت أذكار المساء" },
  isha: { title: "أذكار المساء", href: "/adhkar/evening", reason: "أذكار المساء قبل النوم" },
  layl: { title: "أذكار النوم", href: "/adhkar/sleep", reason: "أذكار النوم وقيام الليل" },
};

function haystackOf(ctx: SmartRecContext): string {
  return [ctx.title, ctx.text, ...(ctx.keywords || [])].filter(Boolean).join(" ");
}

function scoreKeys(hay: string, keys: string[]): number {
  const n = normalizeArabic(hay);
  let score = 0;
  for (const k of keys) {
    const variants = expandSearchTerms(k).map((t) => normalizeArabic(t));
    if (variants.some((v) => v && n.includes(v))) score += 2;
  }
  return score;
}

function seasonalBoost(now: Date): SmartRecommendation | null {
  try {
    const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura", {
      timeZone: "Asia/Kuwait",
      month: "numeric",
      day: "numeric",
    });
    const parts = fmt.formatToParts(now);
    const month = Number(parts.find((p) => p.type === "month")?.value || 0);
    const day = Number(parts.find((p) => p.type === "day")?.value || 0);
    if (month === 9) {
      return {
        id: "seasonal-ramadan",
        kind: "seasonal",
        title: "ورد القرآن في رمضان",
        href: "/daily-wird",
        reason: "موسم رمضان — تكثيف التلاوة",
        score: 8,
      };
    }
    if (month === 12 && day <= 10) {
      return {
        id: "seasonal-dhul-hijjah",
        kind: "seasonal",
        title: "فضائل عشر ذي الحجة",
        href: "/occasions",
        reason: "موسم العشر من ذي الحجة",
        score: 8,
      };
    }
  } catch {
    /* ignore calendar failures */
  }
  return null;
}

/**
 * Build ranked contextual recommendations for the current reading session.
 */
export function buildSmartRecommendations(ctx: SmartRecContext = {}): SmartRecommendation[] {
  try {
    const now = ctx.now || new Date();
    const time = resolveTimeOfDay(now.getHours() + now.getMinutes() / 60);
    const hay = haystackOf(ctx);
    const out: SmartRecommendation[] = [];

    const adhkar = ADHKAR_BY_TIME[time];
    out.push({
      id: `adhkar-${time}`,
      kind: "adhkar",
      title: adhkar.title,
      href: adhkar.href,
      reason: adhkar.reason,
      score: 6,
    });

    for (const topic of FIQH_TOPIC_MAP) {
      const s = scoreKeys(hay, topic.keys);
      if (s > 0) {
        out.push({
          id: `fiqh-${topic.href}`,
          kind: "fiqh",
          title: topic.title,
          href: topic.href,
          reason: "مرتبط بنصّك الحالي",
          score: 4 + s,
        });
      }
    }

    if (normalizeArabic(hay).includes("صبر") || normalizeArabic(hay).includes("ابتلاء")) {
      out.push({
        id: "fawaid-sabr",
        kind: "fawaid",
        title: "فوائد في الصبر والابتلاء",
        href: "/fawaid",
        reason: "موضوع متقاطع مع قراءتك",
        score: 5,
      });
    }

    out.push({
      id: "quran-hub",
      kind: "quran",
      title: "المصحف الرقمي",
      href: "/quran-hub",
      reason: "متابعة التلاوة والحفظ",
      score: 3,
    });

    const seasonal = seasonalBoost(now);
    if (seasonal) out.push(seasonal);

    return out.sort((a, b) => b.score - a.score).slice(0, 8);
  } catch {
    return [];
  }
}
