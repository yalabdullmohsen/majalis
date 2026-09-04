/**
 * طبقة عرض قسم الإعجاز — ترتيب منهجي وشارات حذرة بلا مبالغة.
 */
import type { MiracleSeedItem } from "@/lib/miracles-seed";

/** فلتر موضوعات مضغوط للواجهة (مجمّع من تصنيفات البذرة). */
export const MIRACLE_TOPIC_FILTERS = [
  "الكل",
  "كونيات",
  "خلق الإنسان",
  "طب",
  "أرض",
  "نبات",
  "حيوان",
  "بحر",
  "زمن",
  "صحة ووقاية",
] as const;

export type MiracleTopicFilter = (typeof MIRACLE_TOPIC_FILTERS)[number];

const CATEGORY_TO_TOPIC: Record<string, MiracleTopicFilter> = {
  الكون: "كونيات",
  الفلك: "كونيات",
  النجوم: "كونيات",
  الضوء: "كونيات",
  الأجنة: "خلق الإنسان",
  الإنسان: "خلق الإنسان",
  الجلد: "خلق الإنسان",
  العظام: "خلق الإنسان",
  الدم: "خلق الإنسان",
  الطب: "طب",
  الأرض: "أرض",
  الجبال: "أرض",
  الحديد: "أرض",
  النبات: "نبات",
  الحيوان: "حيوان",
  الحشرات: "حيوان",
  البحار: "بحر",
  المياه: "بحر",
  الرياح: "زمن",
  السحاب: "زمن",
  الزمن: "زمن",
};

/** ترتيب أبواب القرآن المنهجي */
const QURAN_TOPIC_ORDER: MiracleTopicFilter[] = [
  "خلق الإنسان",
  "كونيات",
  "أرض",
  "بحر",
  "نبات",
  "حيوان",
  "زمن",
  "طب",
];

/** ترتيب أبواب السنة المنهجي */
const SUNNAH_TOPIC_ORDER: MiracleTopicFilter[] = [
  "طب",
  "صحة ووقاية",
  "خلق الإنسان",
  "نبات",
];

export type MiracleMethodBadge = "تأمل منضبط" | "إشارة علمية";

export function miracleTopicLabel(
  item: Pick<MiracleSeedItem, "category" | "source_type"> | string,
): MiracleTopicFilter {
  if (typeof item === "string") {
    return CATEGORY_TO_TOPIC[item] ?? "كونيات";
  }
  if (item.source_type === "سنة") {
    if (item.category === "الطب" || item.category === "الدم") return "طب";
    if (
      item.category === "الجلد" ||
      item.category === "الإنسان" ||
      item.category === "النبات"
    ) {
      return "صحة ووقاية";
    }
  }
  return CATEGORY_TO_TOPIC[item.category] ?? "كونيات";
}

/** لا نستخدم «إعجاز قطعي» في الواجهة — أقصى شارة: إشارة علمية / تأمل منضبط */
export function miracleMethodBadge(
  item: Pick<MiracleSeedItem, "source_type" | "category">,
): MiracleMethodBadge {
  if (item.source_type === "سنة") return "تأمل منضبط";
  if (item.category === "الطب" || item.category === "الأجنة") return "تأمل منضبط";
  return "إشارة علمية";
}

export function miracleCardSummary(item: Pick<MiracleSeedItem, "tafsir_summary" | "body">): string {
  const raw = cleanSummaryBoilerplate(item.tafsir_summary || item.body || "")
    .replace(/\s+/g, " ")
    .trim();
  if (raw.length <= 160) return raw;
  const cut = raw.slice(0, 157);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > 80 ? cut.slice(0, lastSpace) : cut).trim()}…`;
}

/** مصدر مختصر للبطاقة */
export function miracleShortSource(source?: string): string {
  if (!source) return "";
  const first = source.split("|")[0]?.trim() || source.trim();
  return first.length > 72 ? `${first.slice(0, 69).trim()}…` : first;
}

function topicRank(source: "قرآن" | "سنة", topic: MiracleTopicFilter): number {
  const order = source === "سنة" ? SUNNAH_TOPIC_ORDER : QURAN_TOPIC_ORDER;
  const i = order.indexOf(topic);
  return i === -1 ? 90 : i;
}

/** ترتيب منهجي: مصدر ثم موضوع ثم عنوان */
export function sortMiraclesMethodically(items: MiracleSeedItem[]): MiracleSeedItem[] {
  return [...items].sort((a, b) => {
    if (a.source_type !== b.source_type) {
      return a.source_type === "قرآن" ? -1 : 1;
    }
    const ta = miracleTopicLabel(a);
    const tb = miracleTopicLabel(b);
    const ra = topicRank(a.source_type, ta);
    const rb = topicRank(b.source_type, tb);
    if (ra !== rb) return ra - rb;
    return a.title.localeCompare(b.title, "ar");
  });
}

export function filterByTopic(items: MiracleSeedItem[], topic: MiracleTopicFilter): MiracleSeedItem[] {
  if (topic === "الكل") return items;
  return items.filter((m) => miracleTopicLabel(m) === topic);
}

/** روابط ذات صلة من نفس القسم فقط */
export function relatedMiracles(
  current: MiracleSeedItem,
  all: MiracleSeedItem[],
  limit = 4,
): MiracleSeedItem[] {
  const topic = miracleTopicLabel(current);
  const sameTopic = all.filter((m) => m.id !== current.id && miracleTopicLabel(m) === topic);
  const sameSource = all.filter(
    (m) => m.id !== current.id && m.source_type === current.source_type && !sameTopic.includes(m),
  );
  return [...sameTopic, ...sameSource].slice(0, limit);
}

export function extractScientificNote(body: string): string {
  const marker = "ملاحظة للتفكر:";
  const idx = body.indexOf(marker);
  if (idx === -1) {
    const parts = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
    return (
      parts.find((p) => p.startsWith("ملاحظة") || p.includes("يذكر بعض")) ||
      parts.find((p) => !p.startsWith("قال") && !p.startsWith("التفسير:") && !p.startsWith("المعنى الشرعي") && !p.startsWith("تنبيه:")) ||
      ""
    );
  }
  const rest = body.slice(idx + marker.length).trim();
  const stop = rest.search(/\n\nتنبيه:|تنبيه:/);
  return (stop === -1 ? rest : rest.slice(0, stop)).trim();
}

export function extractShariaMeaning(body: string, fallback?: string): string {
  const markers = ["المعنى الشرعي:", "التفسير:"];
  for (const marker of markers) {
    const idx = body.indexOf(marker);
    if (idx === -1) continue;
    const rest = body.slice(idx + marker.length).trim();
    const stop = rest.search(/\n\nملاحظة|\n\nتنبيه:|ملاحظة للتفكر:|تنبيه:/);
    const chunk = (stop === -1 ? rest : rest.slice(0, stop)).trim();
    if (chunk) return chunk;
  }
  if (fallback) return cleanSummaryBoilerplate(fallback);
  return "";
}

export function extractIntro(body: string): string {
  const parts = body.split(/\n\n+/).map((p) => p.trim()).filter(Boolean);
  const first = parts.find((p) => p.startsWith("قال "));
  return first || parts[0] || "";
}

export function extractLimitsNote(body: string): string {
  const idx = body.search(/تنبيه:/);
  if (idx === -1) return "";
  return body.slice(idx).replace(/^تنبيه:\s*/, "").trim();
}

/** تنظيف تكرار العبارات المنهجية في الملخصات القديمة */
export function cleanSummaryBoilerplate(text: string): string {
  return text
    .replace(/(?:يُعرض المعنى الشرعي أولًا ثم ملاحظة التفكر بحذر(?: وتواضع علمي)?[.،]?)+/g, "")
    .replace(/(?:ويُقرأ للتفكر لا كحكم علمي نهائي يتغيّر مع النظريات[.،]?)+/g, "")
    .replace(/(?:والعبرة اليقين والعمل لا الجزم بكل تفسير علمي لاحق[.،]?)+/g, "")
    .replace(/مع ربط الآية بتعظيم الخالق والعمل بمقتضى\s*الإ(?:يمان)?[.،]?/g, "")
    .replace(/ويُعرض المعنى الشرعي أولًا ثم ملاحظة التفك\s*—\s*/g, "")
    .replace(/ر بحذر\./g, ".")
    .replace(/الإ\s*—\s*يُقرأ/g, "الإيمان — يُقرأ")
    .replace(/الإي\s*—\s*يُقرأ/g, "الإيمان — يُقرأ")
    .replace(/يمان\./g, ".")
    .replace(/مان\./g, ".")
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.،])/g, "$1")
    .trim();
}

export const MIRACLE_FIXED_CAUTION =
  "لا تُبنى عقيدة أو حكم شرعي على دعوى علمية معاصرة؛ النص الشرعي أصلٌ بنفسه، والنظر العلمي للتأمل ضمن حدوده.";
