import { RESEARCH_CATEGORIES, ANTI_CHEATING_NOTICE } from "./catalog";
import { listPublishedResearches } from "./service";
import type { ResearchRecord } from "./types";

export interface TopicSuggestion {
  title: string;
  categoryId: string;
  rationale: string;
  crowded: boolean;
}

export interface ResearchGapHint {
  categoryId: string;
  label: string;
  publishedCount: number;
  hint: string;
}

/** اقتراح موضوعات — لا يكتب البحث نيابةً عن الطالب. */
export function suggestResearchTopics(interest?: string, limit = 8): TopicSuggestion[] {
  const pool = listPublishedResearches();
  const byCat = new Map<string, number>();
  for (const r of pool) for (const c of r.categoryIds) byCat.set(c, (byCat.get(c) || 0) + 1);

  const interestNorm = (interest || "").trim();
  const cats = RESEARCH_CATEGORIES.filter((c) => c.active !== false);
  const scored = cats.map((c) => {
    const count = byCat.get(c.id) || 0;
    let score = 10 - Math.min(count, 10);
    if (interestNorm && c.label.includes(interestNorm)) score += 5;
    return { c, count, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ c, count }) => ({
      title: `دراسة منهجية في ${c.label}: إشكالية معاصرة ومراجعة أدبيات`,
      categoryId: c.id,
      rationale: count === 0
        ? "التصنيف شبه فارغ في الفهرس الحالي — فرصة لفجوة بحثية محتملة (تحقق من المصادر الأصلية)."
        : `يوجد ${count} عملًا مفهرسًا في هذا الباب — راجع ما سبق قبل اختيار الزاوية.`,
      crowded: count >= 5,
    }));
}

export function listCrowdedTopics(limit = 6): Array<{ categoryId: string; label: string; count: number }> {
  const pool = listPublishedResearches();
  const byCat = new Map<string, number>();
  for (const r of pool) for (const c of r.categoryIds) byCat.set(c, (byCat.get(c) || 0) + 1);
  return RESEARCH_CATEGORIES.map((c) => ({ categoryId: c.id, label: c.label, count: byCat.get(c.id) || 0 }))
    .filter((x) => x.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

export function listResearchGaps(limit = 8): ResearchGapHint[] {
  const pool = listPublishedResearches();
  const byCat = new Map<string, number>();
  for (const r of pool) for (const c of r.categoryIds) byCat.set(c, (byCat.get(c) || 0) + 1);
  return RESEARCH_CATEGORIES.map((c) => ({
    categoryId: c.id,
    label: c.label,
    publishedCount: byCat.get(c.id) || 0,
    hint: "فجوة محتملة في الفهرس المحلي فقط — ليست حكمًا على الحقل العلمي عالميًا.",
  }))
    .sort((a, b) => a.publishedCount - b.publishedCount)
    .slice(0, limit);
}

export function suggestKeywordsFromText(text: string, limit = 10): string[] {
  const stop = new Set(["في", "من", "على", "إلى", "عن", "هذا", "هذه", "ذلك", "التي", "الذي", "ما", "لا", "إن", "أن", "كان", "مع", "أو", "ثم"]);
  const words = text
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, " ")
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !stop.has(w));
  const freq = new Map<string, number>();
  for (const w of words) freq.set(w, (freq.get(w) || 0) + 1);
  return [...freq.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

export function draftProposalOutline(topic: string, categoryLabel: string): string {
  return [
    `عنوان مقترح أولي: ${topic || "—"}`,
    `التصنيف المقترح: ${categoryLabel || "—"}`,
    "",
    "1) المقدمة وأهمية الموضوع",
    "2) إشكالية البحث وأسئلته",
    "3) أهداف البحث",
    "4) الدراسات السابقة (يجب الرجوع للمصادر الأصلية)",
    "5) منهج البحث",
    "6) مباحث الدراسة",
    "7) الخاتمة والنتائج والتوصيات",
    "8) ثبت المراجع",
    "",
    "تنبيه: هذا تصور أوّلي للمساعدة التعليمية فقط، ويحتاج مراجعة بشرية وإشرافًا أكاديميًا.",
    ANTI_CHEATING_NOTICE,
  ].join("\n");
}

export function buildReadingList(seed: ResearchRecord[], limit = 8): ResearchRecord[] {
  return seed.slice(0, limit);
}

export const ASSISTANT_POLICY_LINES = [
  ANTI_CHEATING_NOTICE,
  "المخرجات الآلية مساعدة وليست بديلاً عن البحث العلمي أو الإشراف الأكاديمي.",
  "يُمنع طلب إنشاء بحث جاهز بقصد تسليمه على أنه عمل الطالب.",
  "يجب الرجوع دائمًا إلى المصادر الأصلية والتحقق من النقول.",
];
