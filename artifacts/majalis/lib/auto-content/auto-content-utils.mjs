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

export function calculateQualityScore(item) {
  let score = 0;
  if (item.title) score += 20;
  if (item.summary) score += 20;
  if (item.content && item.content.length > 300) score += 20;
  if (item.source_url) score += 20;
  if (item.category) score += 10;
  if (item.tags && item.tags.length > 0) score += 10;
  return Math.min(score, 100);
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
  if (!process.env.OPENAI_API_KEY) {
    return {
      summary: String(description || "").slice(0, 500),
      category: "عام",
      tags: [],
    };
  }

  const prompt = `
حلل المادة التالية لموقع المجلس العلمي.
لا تخترع معلومة.
لا تصدر فتوى.
أعد JSON فقط:
{
  "summary": "ملخص مختصر",
  "category": "تصنيف شرعي مناسب",
  "tags": ["وسم1","وسم2"]
}

المصدر: ${sourceName}
العنوان: ${title}
النص: ${description}
`;

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
  });

  if (!response.ok) {
    return {
      summary: String(description || "").slice(0, 500),
      category: "عام",
      tags: [],
    };
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "{}";

  try {
    return JSON.parse(text.replace(/```json|```/g, "").trim());
  } catch {
    return {
      summary: String(description || "").slice(0, 500),
      category: "عام",
      tags: [],
    };
  }
}
