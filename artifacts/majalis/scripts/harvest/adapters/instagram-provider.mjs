import { harvestUserAgent, sleep } from "../http.mjs";

/** @typedef {import('../types.mjs').HarvestItem} HarvestItem */

/**
 * عقد مزوّد مرخّص (لا كشط مباشر لإنستغرام):
 * GET {endpoint}/accounts/{handle}/posts?since={iso}
 * Authorization: Bearer {INSTAGRAM_PROVIDER_KEY}
 * → { posts: [{ id, url, caption|text, image_url?, published_at }] }
 */

export function getInstagramIngestMode() {
  return String(process.env.INSTAGRAM_INGEST_MODE || "oembed").toLowerCase();
}

export function getInstagramProviderConfig() {
  const key = process.env.INSTAGRAM_PROVIDER_KEY?.trim() || "";
  const endpoint = process.env.INSTAGRAM_PROVIDER_ENDPOINT?.trim() || "";
  return { key, endpoint, configured: Boolean(key && endpoint) };
}

/** @returns {{ mode: string, configured: boolean|null, message: string|null }} */
export function getInstagramProviderStatus() {
  const mode = getInstagramIngestMode();
  if (mode === "off") return { mode, configured: null, message: null };
  if (mode !== "provider") return { mode, configured: null, message: null };

  const cfg = getInstagramProviderConfig();
  if (!cfg.configured) {
    return {
      mode,
      configured: false,
      message: "Instagram provider is not configured.",
    };
  }
  return { mode, configured: true, message: null };
}

function mockPosts(handle) {
  return [
    {
      id: `mock-${handle}-1`,
      url: `https://www.instagram.com/p/mock-${handle}-1/`,
      caption: `درس علمي — @${handle} — بعد المغرب في المسجد`,
      image_url: null,
      published_at: new Date().toISOString(),
    },
  ];
}

/** @param {unknown} post */
function normalizeProviderPost(post) {
  const caption = String(post.caption ?? post.text ?? post.description ?? post.title ?? "").trim();
  const externalId = String(post.id ?? post.shortcode ?? post.external_id ?? post.url ?? "").trim();
  const url =
    post.url ??
    post.permalink ??
    (post.shortcode ? `https://www.instagram.com/p/${post.shortcode}/` : "");
  const imageUrl =
    post.image_url ?? post.thumbnail_url ?? post.display_url ?? post.media_url ?? undefined;
  const ocrText = post.ocr_text ?? post.alt_text ?? post.image_text ?? "";
  const text = [caption, ocrText].filter(Boolean).join("\n").trim() || caption;
  const publishedAt = post.published_at ?? post.timestamp ?? post.taken_at ?? new Date().toISOString();

  return {
    externalId: externalId || url,
    url,
    title: text.split("\n")[0].slice(0, 120) || "منشور إنستغرام",
    text,
    imageUrl: imageUrl || undefined,
    publishedAt: new Date(publishedAt).toISOString(),
  };
}

/**
 * @param {string} handle
 * @param {Date} [since]
 * @returns {Promise<ReturnType<typeof normalizeProviderPost>[]>}
 */
async function fetchPostsFromProviderApi(handle, since) {
  if (process.env.INSTAGRAM_PROVIDER_MOCK === "1") {
    return mockPosts(handle).map(normalizeProviderPost);
  }

  const { key, endpoint } = getInstagramProviderConfig();
  const base = endpoint.replace(/\/$/, "");
  const qs = since ? `?since=${encodeURIComponent(since.toISOString())}` : "";
  const url = `${base}/accounts/${encodeURIComponent(handle)}/posts${qs}`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${key}`,
      Accept: "application/json",
      "User-Agent": harvestUserAgent(),
    },
    redirect: "follow",
  });

  if (!res.ok) throw new Error(`Provider HTTP ${res.status} for @${handle}`);
  const data = await res.json();
  const posts = data.posts ?? data.items ?? data.data ?? [];
  if (!Array.isArray(posts)) return [];
  return posts.map(normalizeProviderPost).filter((p) => p.url && (p.title || p.text));
}

/**
 * @param {import('../types.mjs').SourceAccount} account
 * @param {Date} since
 * @returns {Promise<HarvestItem[]>}
 */
export async function fetchViaProvider(account, since) {
  const status = getInstagramProviderStatus();
  if (!status.configured) return [];

  const handle = account.handle.replace(/^@/, "");
  const posts = await fetchPostsFromProviderApi(handle, since);
  return posts
    .filter((p) => !since || new Date(p.publishedAt) >= since)
    .map((p) => ({
      sourceId: account.id,
      externalId: p.externalId,
      url: p.url,
      title: p.title,
      text: p.text,
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt,
    }));
}

export async function fetchAllProviderAccounts(accounts, since) {
  const status = getInstagramProviderStatus();
  if (!status.configured) return { items: [], skipped: true, message: status.message };

  const igAccounts = accounts.filter((a) => a.platform === "instagram" && a.enabled);
  const items = [];
  for (const account of igAccounts) {
    try {
      const batch = await fetchViaProvider(account, since);
      items.push(...batch);
    } catch {
      /* يُسجَّل في run.mjs عبر stats.failed */
    }
    await sleep(400);
  }
  return { items, skipped: false, message: null };
}
