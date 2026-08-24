import { harvestUserAgent, sleep } from "../http.mjs";
import {
  loadInstagramQuota,
  saveInstagramQuota,
  canConsumeQuota,
  consumeQuota,
  maxLatestPostsPerAccount,
  isBackfillEnabled,
} from "./instagram-quota.mjs";

/** @typedef {import('../types.mjs').HarvestItem} HarvestItem */

/** Instagram Posts — Discover by URL (ليس dataset الملف الشخصي) */
export const BRIGHTDATA_POSTS_DATASET_ID = "gd_lk5ns7kz21pck8jpis";
/** يُرفض إن وُجد في السر — هدفنا آخر منشور لا بروفايل */
export const BRIGHTDATA_PROFILE_DATASET_ID = "gd_l1vikfch901nx3by4";

export function getInstagramIngestMode() {
  return String(process.env.INSTAGRAM_INGEST_MODE || "oembed").toLowerCase();
}

/**
 * يقبل رابط Bright Data فقط (https://api.brightdata.com/...).
 * يرفض أوامر curl الكاملة — دون تسجيل قيمة السر.
 * يبني رابط scrape لـ Posts / discover_by=url.
 * @param {string} raw
 * @returns {{ ok: true, endpoint: string, scrapeUrl: string, datasetId: string }|{ ok: false, reason: string }}
 */
export function normalizeProviderEndpoint(raw) {
  const value = String(raw || "").trim();
  if (!value) return { ok: false, reason: "missing_endpoint" };
  if (/^curl\b/i.test(value) || /\s-(?:H|X|d|u)\b/.test(value) || /\n|\r|;|\|/.test(value)) {
    return { ok: false, reason: "endpoint_must_be_api_url_not_curl" };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "endpoint_invalid_url" };
  }
  if (url.protocol !== "https:") {
    return { ok: false, reason: "endpoint_must_be_https" };
  }
  if (url.hostname !== "api.brightdata.com") {
    return { ok: false, reason: "endpoint_must_be_brightdata_api" };
  }
  url.username = "";
  url.password = "";

  let datasetId = url.searchParams.get("dataset_id") || BRIGHTDATA_POSTS_DATASET_ID;
  if (datasetId === BRIGHTDATA_PROFILE_DATASET_ID) {
    datasetId = BRIGHTDATA_POSTS_DATASET_ID;
  }

  const scrape = new URL("https://api.brightdata.com/datasets/v3/scrape");
  scrape.searchParams.set("dataset_id", datasetId);
  scrape.searchParams.set("notify", "false");
  scrape.searchParams.set("include_errors", "true");
  scrape.searchParams.set("type", "discover_new");
  scrape.searchParams.set("discover_by", "url");
  scrape.searchParams.set("format", "json");

  const endpoint = `${url.origin}${url.pathname}`.replace(/\/+$/, "") || "https://api.brightdata.com/datasets/v3";
  return { ok: true, endpoint, scrapeUrl: scrape.toString(), datasetId };
}

export function getInstagramProviderConfig() {
  const key = process.env.INSTAGRAM_PROVIDER_KEY?.trim() || "";
  const endpointRaw = process.env.INSTAGRAM_PROVIDER_ENDPOINT?.trim() || "";
  const normalized = normalizeProviderEndpoint(endpointRaw);
  return {
    key,
    endpoint: normalized.ok ? normalized.endpoint : "",
    scrapeUrl: normalized.ok ? normalized.scrapeUrl : "",
    datasetId: normalized.ok ? normalized.datasetId : "",
    configured: Boolean(key && normalized.ok),
    endpointError: key && endpointRaw && !normalized.ok ? normalized.reason : null,
    provider_endpoint_ok: Boolean(normalized.ok),
  };
}

/** @returns {{ mode: string, configured: boolean|null, message: string|null }} */
export function getInstagramProviderStatus() {
  const mode = getInstagramIngestMode();
  if (mode === "off") return { mode, configured: null, message: null };
  if (mode !== "provider") return { mode, configured: null, message: null };

  const cfg = getInstagramProviderConfig();
  if (!cfg.configured) {
    const message = cfg.endpointError
      ? `Instagram provider endpoint invalid (${cfg.endpointError}). Expected https://api.brightdata.com/...`
      : "Instagram provider is not configured.";
    return { mode, configured: false, message };
  }
  return { mode, configured: true, message: null };
}

/**
 * لوج غير حسّاس — لا يطبع المفتاح ولا الـURL الكامل.
 * @param {{ account_handle: string, status_code: number|string, dataset_id?: string, provider_endpoint_ok?: boolean }} info
 */
export function logProviderProbe(info) {
  const handle = String(info.account_handle || "").replace(/^@/, "") || "-";
  const code = info.status_code ?? "-";
  const dataset = info.dataset_id || BRIGHTDATA_POSTS_DATASET_ID;
  const ok = info.provider_endpoint_ok === false ? "false" : "true";
  console.log(
    `instagram_provider provider_endpoint_ok=${ok} dataset_id=${dataset} status_code=${code} account_handle=${handle}`,
  );
}

function mockLatest(handle) {
  const id = process.env.INSTAGRAM_MOCK_LATEST_ID?.trim() || `mock-${handle}-1`;
  return {
    id,
    shortcode: id,
    url: `https://www.instagram.com/p/${id}/`,
    published_at: new Date().toISOString(),
  };
}

function mockPostDetails(handle, postId) {
  const id = postId || mockLatest(handle).id;
  return {
    id,
    url: `https://www.instagram.com/p/${id}/`,
    caption: `درس علمي — @${handle} — بعد المغرب في المسجد`,
    image_url: null,
    published_at: new Date().toISOString(),
  };
}

/** @param {unknown} post */
function normalizeProviderPost(post) {
  if (!post || typeof post !== "object") {
    return { externalId: "", url: "", title: "", text: "", imageUrl: undefined, publishedAt: null };
  }
  const caption = String(
    post.caption ?? post.text ?? post.description ?? post.title ?? "",
  ).trim();
  const shortcode = String(post.shortcode ?? "").trim();
  const externalId = String(
    post.id ?? post.shortcode ?? post.external_id ?? post.post_id ?? post.url ?? "",
  ).trim();
  const url =
    post.url ??
    post.permalink ??
    (shortcode ? `https://www.instagram.com/p/${shortcode}/` : "");
  const imageUrl =
    post.image_url ?? post.thumbnail_url ?? post.display_url ?? post.media_url ?? undefined;
  const ocrText = post.ocr_text ?? post.alt_text ?? post.image_text ?? "";
  const text = [caption, ocrText].filter(Boolean).join("\n").trim() || caption;
  const publishedAtRaw =
    post.published_at ?? post.datetime ?? post.timestamp ?? post.taken_at ?? post.date_posted ?? null;
  let publishedAt = null;
  if (publishedAtRaw) {
    const t = Date.parse(String(publishedAtRaw));
    if (Number.isFinite(t)) publishedAt = new Date(t).toISOString();
  }

  return {
    externalId: externalId || url,
    url: String(url || ""),
    title: text.split("\n")[0].slice(0, 120) || "",
    text,
    imageUrl: imageUrl || undefined,
    publishedAt,
  };
}

/**
 * @param {unknown} raw
 * @returns {{ id: string, url: string, publishedAt: string|null }|null}
 */
export function normalizeLatestProbe(raw) {
  if (!raw || typeof raw !== "object") return null;
  const id = String(
    raw.id ?? raw.shortcode ?? raw.latest_post_id ?? raw.media_id ?? raw.external_id ?? "",
  ).trim();
  const url = String(
    raw.url ??
      raw.permalink ??
      raw.latest_post_url ??
      (raw.shortcode ? `https://www.instagram.com/p/${raw.shortcode}/` : "") ??
      "",
  ).trim();
  if (!id && !url) return null;
  const publishedAtRaw =
    raw.published_at ?? raw.datetime ?? raw.latest_post_published_at ?? raw.timestamp ?? raw.date_posted ?? null;
  return {
    id: id || url,
    url: url || (id ? `https://www.instagram.com/p/${id}/` : ""),
    publishedAt: publishedAtRaw ? new Date(publishedAtRaw).toISOString() : null,
  };
}

function authHeaders(key) {
  return {
    Authorization: `Bearer ${key}`,
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": harvestUserAgent(),
  };
}

/**
 * يستخرج منشورات من استجابة Bright Data (مصفوفة منشورات أو كائن بروفايل بـ posts[]).
 * @param {unknown} data
 * @returns {ReturnType<typeof normalizeProviderPost>[]}
 */
export function extractPostsFromBrightDataPayload(data) {
  if (!data) return [];
  if (Array.isArray(data)) {
    const out = [];
    for (const row of data) {
      if (!row || typeof row !== "object") continue;
      if (row.error || row.error_code) continue;
      if (Array.isArray(row.posts) && row.posts.length) {
        for (const p of row.posts) out.push(normalizeProviderPost(p));
        continue;
      }
      // صف منشور مباشر
      if (row.url || row.shortcode || row.caption || row.description) {
        out.push(normalizeProviderPost(row));
      }
    }
    return out.filter((p) => p.url && (p.title || p.text || p.externalId));
  }
  if (typeof data === "object") {
    if (Array.isArray(data.posts)) {
      return data.posts.map(normalizeProviderPost).filter((p) => p.url);
    }
    if (Array.isArray(data.data)) return extractPostsFromBrightDataPayload(data.data);
  }
  return [];
}

class ProviderHttpError extends Error {
  /** @param {number} status @param {string} [detail] */
  constructor(status, detail) {
    super(detail ? `HTTP ${status}: ${detail}` : `HTTP ${status}`);
    this.name = "ProviderHttpError";
    this.status = status;
  }
}

/**
 * @param {string} key
 * @param {string} snapshotId
 * @param {{ maxAttempts?: number, delayMs?: number }} [opts]
 */
async function fetchSnapshotJson(key, snapshotId, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 8;
  const delayMs = opts.delayMs ?? 2500;
  const url = `https://api.brightdata.com/datasets/v3/snapshot/${encodeURIComponent(snapshotId)}?format=json`;
  for (let i = 0; i < maxAttempts; i++) {
    const res = await fetch(url, { headers: authHeaders(key), redirect: "follow" });
    if (res.status === 202) {
      await sleep(delayMs);
      continue;
    }
    if (!res.ok) throw new ProviderHttpError(res.status, "snapshot");
    return res.json();
  }
  throw new ProviderHttpError(408, "snapshot_timeout");
}

/**
 * Bright Data: Instagram Posts — Discover by URL.
 * @param {string} handle
 * @param {{ numOfPosts?: number }} [opts]
 * @returns {Promise<{ posts: ReturnType<typeof normalizeProviderPost>[], statusCode: number, datasetId: string }>}
 */
export async function scrapePostsDiscoverByUrl(handle, opts = {}) {
  const h = String(handle || "").replace(/^@/, "");
  const numOfPosts = Math.max(1, Math.min(30, Number(opts.numOfPosts) || 1));

  if (process.env.INSTAGRAM_PROVIDER_MOCK === "1") {
    const post = normalizeProviderPost(mockPostDetails(h, mockLatest(h).id));
    logProviderProbe({
      account_handle: h,
      status_code: 200,
      dataset_id: BRIGHTDATA_POSTS_DATASET_ID,
      provider_endpoint_ok: true,
    });
    return { posts: [post], statusCode: 200, datasetId: BRIGHTDATA_POSTS_DATASET_ID };
  }

  const cfg = getInstagramProviderConfig();
  if (!cfg.configured || !cfg.scrapeUrl || !cfg.key) {
    logProviderProbe({
      account_handle: h,
      status_code: 0,
      dataset_id: cfg.datasetId || BRIGHTDATA_POSTS_DATASET_ID,
      provider_endpoint_ok: false,
    });
    throw new ProviderHttpError(0, "not_configured");
  }

  const body = {
    input: [
      {
        url: `https://www.instagram.com/${h}/`,
        num_of_posts: numOfPosts,
        post_type: "Post",
      },
    ],
    limit_per_input: numOfPosts,
  };

  const res = await fetch(cfg.scrapeUrl, {
    method: "POST",
    headers: authHeaders(cfg.key),
    body: JSON.stringify(body),
    redirect: "follow",
  });

  logProviderProbe({
    account_handle: h,
    status_code: res.status,
    dataset_id: cfg.datasetId,
    provider_endpoint_ok: cfg.provider_endpoint_ok,
  });

  if (res.status === 404) {
    throw new ProviderHttpError(404);
  }
  if (res.status === 401 || res.status === 403) {
    throw new ProviderHttpError(res.status);
  }
  if (res.status === 429) {
    throw new ProviderHttpError(429);
  }
  if (!res.ok) {
    throw new ProviderHttpError(res.status);
  }

  let data = await res.json();
  if (data && typeof data === "object" && !Array.isArray(data) && data.snapshot_id) {
    data = await fetchSnapshotJson(cfg.key, String(data.snapshot_id));
  }

  const posts = extractPostsFromBrightDataPayload(data);
  return { posts, statusCode: res.status, datasetId: cfg.datasetId };
}

/**
 * @param {string} handle
 * @param {Date} [since]
 * @returns {Promise<ReturnType<typeof normalizeProviderPost>[]>}
 */
export async function fetchPostsFromProviderApi(handle, since) {
  const num =
    since instanceof Date
      ? Math.min(30, maxLatestPostsPerAccount())
      : 1;
  const { posts } = await scrapePostsDiscoverByUrl(handle, { numOfPosts: num });
  if (!(since instanceof Date)) return posts;
  const sinceMs = since.getTime();
  return posts.filter((p) => {
    const t = Date.parse(p.publishedAt);
    return Number.isNaN(t) || t >= sinceMs;
  });
}

/**
 * @param {string} handle
 * @returns {Promise<{ ok: true, latest: {id:string,url:string,publishedAt:string|null} }|{ ok: false, status: string, message: string }>}
 */
export async function probeLatestPost(handle) {
  const status = getInstagramProviderStatus();
  if (status.mode === "provider" && status.configured === false) {
    return { ok: false, status: "missing_secret", message: status.message || "missing_secret" };
  }
  if (status.mode !== "provider") {
    return { ok: false, status: "provider_error", message: `mode=${status.mode}` };
  }

  try {
    const { posts } = await scrapePostsDiscoverByUrl(handle, { numOfPosts: 1 });
    const tip = posts[0];
    if (!tip) {
      return {
        ok: false,
        status: "provider_missing_latest_post_id",
        message: "provider_missing_latest_post_id",
      };
    }
    const latest = normalizeLatestProbe({
      id: tip.externalId,
      url: tip.url,
      published_at: tip.publishedAt,
    });
    if (!latest?.id) {
      return {
        ok: false,
        status: "provider_missing_latest_post_id",
        message: "provider_missing_latest_post_id",
      };
    }
    return { ok: true, latest };
  } catch (err) {
    const statusCode = err?.status ?? 0;
    if (statusCode === 404) {
      return { ok: false, status: "skipped_provider_404", message: "HTTP 404" };
    }
    if (statusCode === 401 || statusCode === 403) {
      return { ok: false, status: "private_or_unavailable", message: `HTTP ${statusCode}` };
    }
    if (statusCode === 429) {
      return { ok: false, status: "rate_limited", message: "HTTP 429" };
    }
    return { ok: false, status: "provider_error", message: String(err?.message || err) };
  }
}

/**
 * @param {string} handle
 * @param {string} postId
 */
export async function fetchSinglePost(handle, postId) {
  if (process.env.INSTAGRAM_PROVIDER_MOCK === "1") {
    return normalizeProviderPost(mockPostDetails(handle, postId));
  }
  const { posts } = await scrapePostsDiscoverByUrl(handle, { numOfPosts: 5 });
  const match = posts.find(
    (p) =>
      p.externalId === postId ||
      p.url.includes(postId) ||
      String(p.externalId).includes(postId),
  );
  if (!match) throw new Error(`Provider post not found for @${handle} post ${postId}`);
  return match;
}

export function samePost(account, latest) {
  const seenId = String(account.last_seen_post_id || "").trim();
  const seenUrl = String(account.last_seen_post_url || "").trim();
  if (seenId && (latest.id === seenId || latest.url.includes(seenId))) return true;
  if (seenUrl && (latest.url === seenUrl || (latest.id && seenUrl.includes(latest.id)))) return true;
  return false;
}

/**
 * @param {string} handle
 * @param {{ limit?: number, since?: Date }} [opts]
 */
export async function fetchRecentPosts(handle, opts = {}) {
  const limit = Math.max(1, Math.min(30, Number(opts.limit) || maxLatestPostsPerAccount()));
  const since =
    opts.since instanceof Date ? opts.since : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const sinceMs = since.getTime();

  if (process.env.INSTAGRAM_PROVIDER_MOCK === "1") {
    const post = normalizeProviderPost(mockPostDetails(handle, `mock-${handle}-1`));
    return [
      {
        sourceId: "",
        externalId: post.externalId,
        url: post.url,
        title: post.title,
        text: post.text,
        imageUrl: post.imageUrl,
        publishedAt: post.publishedAt,
      },
    ];
  }

  const status = getInstagramProviderStatus();
  if (status.mode !== "provider" || !status.configured) return [];

  const posts = await fetchPostsFromProviderApi(handle, since);
  return posts
    .filter((p) => {
      const t = Date.parse(p.publishedAt);
      return Number.isNaN(t) || t >= sinceMs;
    })
    .slice(0, limit)
    .map((p) => ({
      sourceId: "",
      externalId: p.externalId,
      url: p.url,
      title: p.title,
      text: p.text,
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt,
    }));
}

/**
 * @param {import('../types.mjs').SourceAccount} account
 * @param {{ persistQuota?: boolean, since?: Date }} [opts]
 */
export async function probeAndMaybeFetch(account, opts = {}) {
  const persistQuota = opts.persistQuota !== false;
  const handle = String(account.handle || "").replace(/^@/, "");
  const since = opts.since instanceof Date ? opts.since : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

  const out = {
    status: "unchanged",
    items: /** @type {HarvestItem[]} */ ([]),
    probeUsed: 0,
    fetchUsed: 0,
    latest: /** @type {{id:string,url:string,publishedAt:string|null}|null} */ (null),
    message: /** @type {string|undefined} */ (undefined),
  };

  const mode = getInstagramIngestMode();
  if (mode === "off") {
    out.status = "provider_error";
    out.message = "instagram skipped: mode=off";
    return out;
  }

  if (mode === "provider") {
    const st = getInstagramProviderStatus();
    if (!st.configured) {
      out.status = "missing_secret";
      out.message = st.message || "missing_secret";
      return out;
    }
  } else {
    out.status = "provider_error";
    out.message = "use_oembed_adapter";
    return out;
  }

  let quota = loadInstagramQuota();
  const probeGate = canConsumeQuota(quota, "probe");
  if (!probeGate.ok) {
    out.status = "rate_limited";
    out.message = probeGate.detail || "rate_limited";
    return out;
  }

  const backfill = isBackfillEnabled();
  const limit = backfill ? maxLatestPostsPerAccount() : 1;

  try {
    consumeQuota(quota, "probe");
    out.probeUsed = 1;
    const { posts } = await scrapePostsDiscoverByUrl(handle, { numOfPosts: limit });
    if (persistQuota) saveInstagramQuota(quota);

    const filtered = posts
      .filter((p) => {
        const t = Date.parse(p.publishedAt);
        return Number.isNaN(t) || t >= since.getTime();
      })
      .slice(0, limit);

    if (!filtered.length) {
      out.status = "unchanged";
      return out;
    }

    const tip = filtered[0];
    out.latest = {
      id: tip.externalId,
      url: tip.url,
      publishedAt: tip.publishedAt || null,
    };

    if (!backfill && samePost(account, out.latest)) {
      out.status = "unchanged";
      return out;
    }

    const fetchGate = canConsumeQuota(quota, "fetch");
    if (!fetchGate.ok) {
      out.status = "rate_limited";
      out.message = fetchGate.detail || "rate_limited";
      return out;
    }
    consumeQuota(quota, "fetch");
    out.fetchUsed = 1;
    if (persistQuota) saveInstagramQuota(quota);

    out.items = filtered.map((p) => ({
      sourceId: account.id,
      externalId: p.externalId,
      url: p.url,
      title: p.title,
      text: p.text,
      imageUrl: p.imageUrl,
      publishedAt: p.publishedAt,
    }));
    out.status = "new_post";
    return out;
  } catch (primaryErr) {
    if (persistQuota) saveInstagramQuota(quota);
    const statusCode = primaryErr?.status ?? 0;
    const msg = String(primaryErr?.message || primaryErr);

    if (statusCode === 404 || /HTTP 404/.test(msg)) {
      out.status = "skipped_provider_404";
      out.message = "HTTP 404";
      return out;
    }
    if (statusCode === 401 || statusCode === 403 || /HTTP 401|HTTP 403/.test(msg)) {
      out.status = "private_or_unavailable";
      out.message = msg;
      return out;
    }
    if (statusCode === 429 || /HTTP 429/.test(msg)) {
      out.status = "rate_limited";
      out.message = msg;
      return out;
    }

    out.status = "provider_error";
    out.message = msg;
    return out;
  }
}

/**
 * @param {import('../types.mjs').SourceAccount} account
 * @param {Date} _since
 * @returns {Promise<HarvestItem[]>}
 */
export async function fetchViaProvider(account, _since) {
  const result = await probeAndMaybeFetch(account, {
    persistQuota: true,
    since: _since instanceof Date ? _since : undefined,
  });
  return result.items;
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
      /* يُسجَّل في run.mjs */
    }
    await sleep(400);
  }
  return { items, skipped: false, message: null };
}
