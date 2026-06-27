/**
 * Import lesson metadata from social / web URLs.
 */

const PLATFORM_PATTERNS = [
  { platform: "instagram", test: /instagram\.com/i },
  { platform: "youtube", test: /youtube\.com|youtu\.be/i },
  { platform: "twitter", test: /twitter\.com|x\.com/i },
  { platform: "telegram", test: /t\.me|telegram/i },
  { platform: "facebook", test: /facebook\.com|fb\.com/i },
];

export function detectPlatform(url) {
  const u = String(url || "");
  for (const p of PLATFORM_PATTERNS) {
    if (p.test.test(u)) return p.platform;
  }
  if (/\.rss|feed|xml/i.test(u)) return "rss";
  return "website";
}

function extractMeta(html, property) {
  const re = new RegExp(
    `<meta[^>]+(?:property|name)=["']${property}["'][^>]+content=["']([^"']+)["']`,
    "i",
  );
  const m = html.match(re);
  if (m) return m[1];
  const re2 = new RegExp(
    `<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${property}["']`,
    "i",
  );
  return html.match(re2)?.[1] || "";
}

export async function fetchUrlContent(url) {
  const res = await fetch(url, {
    headers: {
      "User-Agent": "MajalisBot/1.0 (+https://majlisilm.com)",
      Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    },
    redirect: "follow",
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const contentType = res.headers.get("content-type") || "";
  const body = await res.text();
  return { body, contentType, finalUrl: res.url };
}

export async function importFromUrl(url) {
  const platform = detectPlatform(url);
  const { body, finalUrl } = await fetchUrlContent(url);

  if (platform === "rss" || body.trim().startsWith("<?xml") || body.includes("<rss")) {
    return {
      platform: "rss",
      url: finalUrl,
      title: "",
      description: body.slice(0, 2000),
      imageUrl: "",
      rawText: body.slice(0, 8000),
    };
  }

  const title =
    extractMeta(body, "og:title") ||
    extractMeta(body, "twitter:title") ||
    (body.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || "").trim();

  const description =
    extractMeta(body, "og:description") ||
    extractMeta(body, "twitter:description") ||
    extractMeta(body, "description");

  const imageUrl = extractMeta(body, "og:image") || extractMeta(body, "twitter:image");

  const textOnly = body
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 6000);

  return {
    platform,
    url: finalUrl,
    title: title.trim(),
    description: description.trim(),
    imageUrl: imageUrl.trim(),
    rawText: `${title}\n${description}\n${textOnly}`.trim(),
  };
}
