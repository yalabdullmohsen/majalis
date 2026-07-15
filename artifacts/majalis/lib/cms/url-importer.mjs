/**
 * Import lesson metadata from social / web URLs.
 */

const SUPPORTED_PLATFORMS = new Set(["instagram", "youtube", "twitter", "telegram", "website"]);

const PLATFORM_PATTERNS = [
  { platform: "instagram", test: /instagram\.com/i, label: "Instagram" },
  { platform: "youtube", test: /youtube\.com|youtu\.be/i, label: "YouTube" },
  { platform: "twitter", test: /twitter\.com|x\.com/i, label: "X" },
  { platform: "telegram", test: /t\.me|telegram\.(me|org)/i, label: "Telegram" },
  { platform: "facebook", test: /facebook\.com|fb\.com/i, label: "Facebook" },
];

export function normalizeImportUrl(raw) {
  const u = String(raw || "").trim();
  if (!u) return null;
  try {
    const parsed = new URL(u.startsWith("http") ? u : `https://${u}`);
    if (!["http:", "https:"].includes(parsed.protocol)) return null;
    parsed.hash = "";
    let path = parsed.pathname.replace(/\/+$/, "");
    if (path === "") path = "";
    parsed.pathname = path || "/";
    return parsed.toString();
  } catch {
    return null;
  }
}

export function isSupportedImportPlatform(platform) {
  return SUPPORTED_PLATFORMS.has(platform);
}

export function getPlatformLabel(platform) {
  const found = PLATFORM_PATTERNS.find((p) => p.platform === platform);
  if (found) return found.label;
  if (platform === "website") return "صفحة ويب";
  if (platform === "rss") return "RSS";
  return platform;
}

export function detectPlatform(url) {
  const u = String(url || "");
  for (const p of PLATFORM_PATTERNS) {
    if (p.test.test(u)) return p.platform;
  }
  if (/\.rss|\/feed|\.xml$/i.test(u)) return "rss";
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
      "User-Agent": "MajalisBot/1.0 (+https://www.majlisilm.com)",
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
