/**
 * شرح الآية بالذكاء الاصطناعي — كاش IndexedDB عبر محرك الأوفلاين.
 * يعتمد /api/assistant مع قالب منظم؛ لا يخترع أحكامًا بلا مصادر.
 */
import { callAssistantApi } from "@/lib/assistant-api";
import { engineGet, enginePut } from "@/lib/offline-engine";

export type AiAyahExplainSections = {
  overall: string;
  context: string;
  takeaways: string;
};

export type AiAyahExplainResult = {
  surah: number;
  ayah: number;
  raw: string;
  sections: AiAyahExplainSections;
  cached: boolean;
  disclaimer: string;
  generatedAt: string;
};

const CACHE_STORE = "articles" as const;
const CACHE_PREFIX = "ai-ayah-explain:v1:";
const DISCLAIMER =
  "هذه إجابة تعليمية مساعدة، وليست فتوى. راجع التفاسير المعتمدة (كابن كثير وال سعدي) والعالم المختص عند الحاجة.";

function cacheKey(surah: number, ayah: number): string {
  return `${CACHE_PREFIX}${surah}:${ayah}`;
}

function buildPrompt(surah: number, ayah: number, ayahText?: string): string {
  const textLine = ayahText?.trim()
    ? `نص الآية (عثماني/مبسّط إن وُجد):\n«${ayahText.trim().slice(0, 800)}»\n\n`
    : "";
  return (
    `اشرح الآية ${surah}:${ayah} للمسلم العام بأسلوب واضح ومنظم بالعربية الفصحى.\n` +
    textLine +
    `التزم بالمصادر الكلاسيكية الموثوقة (تفسير ابن كثير، تفسير السعدي، وما صح من أسباب النزول إن وُجد).\n` +
    `لا تخترع حديثًا ولا حكمًا بلا سند تعرفه. إن لم تجد سبب نزول موثوقًا فقل ذلك صراحة.\n\n` +
    `استخدم بالضبط هذه العناوين الثلاثة بهذا الترتيب:\n` +
    `## المعنى الإجمالي\n` +
    `## أسباب النزول / السياق\n` +
    `## الفوائد والأحكام المستفادة\n`
  );
}

export function parseExplainSections(raw: string): AiAyahExplainSections {
  const text = String(raw || "").trim();
  const split = (heading: string, next?: string): string => {
    const re = new RegExp(
      `##\\s*${heading}\\s*([\\s\\S]*?)(?=${next ? `##\\s*${next}` : "$"})`,
      "i",
    );
    const m = text.match(re);
    return (m?.[1] || "").trim();
  };
  const overall =
    split("المعنى الإجمالي", "أسباب") ||
    split("المعنى الإجمالي") ||
    text.slice(0, 600);
  const context =
    split("أسباب النزول\\s*/\\s*السياق", "الفوائد") ||
    split("أسباب النزول") ||
    split("السياق") ||
    "لم يُذكر سبب نزول موثوق في هذه الإجابة؛ راجع كتب أسباب النزول المعتمدة.";
  const takeaways =
    split("الفوائد والأحكام المستفادة") ||
    split("الفوائد") ||
    "";
  return { overall, context, takeaways };
}

export async function getCachedAyahExplain(
  surah: number,
  ayah: number,
): Promise<AiAyahExplainResult | null> {
  const row = await engineGet<Omit<AiAyahExplainResult, "cached">>(
    CACHE_STORE,
    cacheKey(surah, ayah),
  );
  if (!row?.value?.raw) return null;
  return { ...row.value, cached: true };
}

export async function explainAyahWithAi(opts: {
  surah: number;
  ayah: number;
  ayahText?: string;
  forceRefresh?: boolean;
}): Promise<AiAyahExplainResult> {
  const { surah, ayah, ayahText, forceRefresh } = opts;
  if (!forceRefresh) {
    const hit = await getCachedAyahExplain(surah, ayah);
    if (hit) return hit;
  }

  const { response, data } = await callAssistantApi({
    message: buildPrompt(surah, ayah, ayahText),
    messages: [],
  });

  const raw = String(
    data.answer || data.reply || data.message || "",
  ).trim();

  if (!response.ok || !raw) {
    throw new Error(
      data.message || "تعذر توليد شرح الآية الآن. جرّب لاحقًا أو افتح التفسير الكلاسيكي.",
    );
  }

  const result: AiAyahExplainResult = {
    surah,
    ayah,
    raw,
    sections: parseExplainSections(raw),
    cached: false,
    disclaimer: data.disclaimer || DISCLAIMER,
    generatedAt: new Date().toISOString(),
  };

  await enginePut(CACHE_STORE, cacheKey(surah, ayah), {
    surah: result.surah,
    ayah: result.ayah,
    raw: result.raw,
    sections: result.sections,
    disclaimer: result.disclaimer,
    generatedAt: result.generatedAt,
  }).catch(() => undefined);

  return result;
}
