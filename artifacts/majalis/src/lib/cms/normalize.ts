/** Strip HTML tags and normalize whitespace for aggregator pipeline. */
export function stripHtml(html: string): string {
  return (html || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build URL-safe slug from Arabic/Latin title. */
export function slugify(text: string, maxLen = 80): string {
  const base = (text || "")
    .trim()
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/[^\w\s\u0600-\u06FF-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return base.slice(0, maxLen) || "item";
}

/** Simple djb2 hash for content fingerprinting (browser-safe). */
export function contentHash(parts: string[]): string {
  const joined = parts.filter(Boolean).join("|").toLowerCase();
  let hash = 5381;
  for (let i = 0; i < joined.length; i++) {
    hash = (hash * 33) ^ joined.charCodeAt(i);
  }
  return (hash >>> 0).toString(16).padStart(8, "0");
}

/** Token overlap similarity 0..1 for fuzzy title matching. */
export function tokenSimilarity(a: string, b: string): number {
  const tokensA = new Set(a.split(/\s+/).filter((t) => t.length > 1));
  const tokensB = new Set(b.split(/\s+/).filter((t) => t.length > 1));
  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let overlap = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) overlap++;
  }
  return overlap / Math.max(tokensA.size, tokensB.size);
}

/** Validate HTTP(S) URL with optional HEAD check (client-side, best-effort). */
export async function validateUrl(url: string, checkHead = false): Promise<{ ok: boolean; error?: string }> {
  if (!url?.trim()) return { ok: true };
  try {
    const parsed = new URL(url);
    if (!["http:", "https:"].includes(parsed.protocol)) {
      return { ok: false, error: "بروتوكول غير مدعوم" };
    }
    if (!checkHead) return { ok: true };
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(6000), redirect: "follow" });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String((err as Error)?.message || err) };
  }
}

/** Normalize import row fields to CmsContentRecord shape. */
export function normalizeImportRow(
  kind: import("./content-types").CmsContentKind,
  row: Record<string, unknown>,
): import("./content-types").CmsContentRecord {
  const title = String(
    row.title || row.name || row.question || row.text || "",
  ).trim();
  const body = stripHtml(String(row.body || row.answer || row.description || row.biography || ""));
  const summary = stripHtml(String(row.summary || row.bio || row.note || "")).slice(0, 500);

  return {
    kind,
    external_key: row.external_key ? String(row.external_key) : undefined,
    slug: row.slug ? String(row.slug) : slugify(title),
    title,
    summary: summary || body.slice(0, 200),
    body,
    speaker_name: row.speaker_name || row.sheikh_name || row.mufti_name || row.author_name
      ? String(row.speaker_name || row.sheikh_name || row.mufti_name || row.author_name)
      : undefined,
    category: row.category || row.type ? String(row.category || row.type) : undefined,
    status: (row.status as import("./content-types").CmsWorkflowStatus) || "approved",
    source_urls: Array.isArray(row.source_urls) ? row.source_urls.map(String) : undefined,
    metadata: row as Record<string, unknown>,
    raw: row,
  };
}
