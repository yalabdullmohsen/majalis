export function createSlug(input) {
  return String(input || "")
    .toLowerCase()
    .trim()
    .replace(/[^\u0600-\u06FFa-zA-Z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);
}

export function createExternalKey(sourceName, url, title) {
  return Buffer.from(`${sourceName}|${url}|${title}`)
    .toString("base64")
    .replace(/=/g, "")
    .slice(0, 180);
}

export function cleanText(input = "") {
  return String(input || "")
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

export function detectContentType(title, text) {
  const value = `${title} ${text}`;
  if (value.includes("فتوى")) return "fatwa";
  if (value.includes("قرار")) return "resolution";
  if (value.includes("توصية")) return "recommendation";
  if (value.includes("حديث")) return "hadith";
  if (value.includes("ذكر") || value.includes("أذكار")) return "adhkar";
  if (value.includes("إعجاز")) return "scientific_miracle";
  if (value.includes("فائدة")) return "benefit";
  return "article";
}

export function mapContentTypeToUpdateType(contentType) {
  const map = {
    fatwa: "فتوى",
    resolution: "قرار",
    recommendation: "قرار",
    hadith: "خبر علمي",
    adhkar: "خبر علمي",
    scientific_miracle: "خبر علمي",
    benefit: "خبر علمي",
    article: "خبر علمي",
  };
  return map[contentType] || "خبر علمي";
}

export function calculateQualityScore(item) {
  let score = 0;
  if (item.title) score += 15;
  if (item.summary) score += 15;
  if (item.content && item.content.length > 300) score += 15;
  if (item.source_url) score += 10;
  if (item.category) score += 10;
  if (item.tags && item.tags.length > 0) score += 10;
  if (item.seo_title) score += 10;
  if (item.seo_description) score += 10;
  if (item.source_verified) score += 5;
  return Math.min(score, 100);
}

export function verifySourceUrl(originalUrl, sourceUrl, trustLevel = 80) {
  const errors = [];
  if (!originalUrl || !sourceUrl) {
    errors.push("missing_url");
    return { verified: false, errors };
  }

  let parsedOriginal;
  let parsedSource;
  try {
    parsedOriginal = new URL(originalUrl);
    parsedSource = new URL(sourceUrl);
  } catch {
    errors.push("invalid_url");
    return { verified: false, errors };
  }

  if (parsedOriginal.protocol !== "https:" && parsedOriginal.protocol !== "http:") {
    errors.push("unsupported_protocol");
  }

  const sourceHost = parsedSource.hostname.replace(/^www\./, "");
  const originalHost = parsedOriginal.hostname.replace(/^www\./, "");
  const sameDomain =
    originalHost === sourceHost ||
    originalHost.endsWith(`.${sourceHost}`) ||
    sourceHost.endsWith(`.${originalHost}`);

  if (!sameDomain && trustLevel < 90) {
    errors.push("domain_mismatch");
  }

  return {
    verified: errors.length === 0,
    errors,
    trustLevel,
  };
}

export function generateSeoMetadata({ title, summary, category, slug, sourceName }) {
  const seoTitle = `${title} | المجلس العلمي`.slice(0, 70);
  const seoDescription = (summary || title)
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 160);

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: title,
    description: seoDescription,
    url: `/updates/auto/${slug}`,
    articleSection: category || "علوم شرعية",
    publisher: {
      "@type": "Organization",
      name: "المجلس العلمي",
    },
    isBasedOn: sourceName
      ? { "@type": "CreativeWork", name: sourceName }
      : undefined,
  };

  return { seoTitle, seoDescription, structuredData };
}

export async function ensureUniqueSlug(supabase, baseSlug) {
  let slug = createSlug(baseSlug);
  if (!slug) slug = `item-${Date.now()}`;

  const { data: existing } = await supabase
    .from("auto_imported_content")
    .select("slug")
    .eq("slug", slug)
    .maybeSingle();

  if (!existing) return slug;

  for (let i = 2; i <= 20; i++) {
    const candidate = `${slug}-${i}`.slice(0, 120);
    const { data: clash } = await supabase
      .from("auto_imported_content")
      .select("slug")
      .eq("slug", candidate)
      .maybeSingle();
    if (!clash) return candidate;
  }

  return `${slug}-${Date.now()}`.slice(0, 120);
}

export function extractRssItems(xml) {
  const items = [];
  const matches = xml.match(/<item>[\s\S]*?<\/item>/gi) || [];

  for (const item of matches.slice(0, 20)) {
    const title = cleanText(
      item.match(/<title><!\[CDATA\[(.*?)\]\]><\/title>/s)?.[1]
      || item.match(/<title>(.*?)<\/title>/s)?.[1]
      || "",
    );
    const link = cleanText(item.match(/<link>(.*?)<\/link>/s)?.[1] || "");
    const description = cleanText(
      item.match(/<description><!\[CDATA\[(.*?)\]\]><\/description>/s)?.[1]
      || item.match(/<description>(.*?)<\/description>/s)?.[1]
      || "",
    );
    const pubDate = cleanText(item.match(/<pubDate>(.*?)<\/pubDate>/s)?.[1] || "");

    if (title && link) {
      items.push({ title, link, description, pubDate });
    }
  }

  return items;
}

export async function aiAnalyzeContent({ title, description, sourceName }) {
  const fallback = {
    summary: String(description || "").slice(0, 500),
    category: "عام",
    tags: [],
    seoKeywords: [],
  };

  if (!process.env.OPENAI_API_KEY) return fallback;

  const prompt = `
حلل المادة التالية لموقع المجلس العلمي.
لا تخترع معلومة.
لا تصدر فتوى.
أعد JSON فقط:
{
  "summary": "ملخص مختصر (150-300 حرف)",
  "category": "تصنيف شرعي مناسب",
  "tags": ["وسم1","وسم2"],
  "seoKeywords": ["كلمة1","كلمة2"]
}

المصدر: ${sourceName}
العنوان: ${title}
النص: ${description}
`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(20000),
    });

    if (!response.ok) return fallback;

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "{}";
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return fallback;
  }
}

export const PIPELINE_STAGES = [
  "dedup",
  "source_verify",
  "classify",
  "ai_analyze",
  "slug",
  "seo",
  "quality",
  "save",
];
