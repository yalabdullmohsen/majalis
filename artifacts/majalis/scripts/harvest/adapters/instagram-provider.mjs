import { harvestUserAgent, sleep } from "../http.mjs";
import {
  loadInstagramQuota,
  saveInstagramQuota,
  canConsumeQuota,
  consumeQuota,
  maxLatestPostsPerAccount,
} from "./instagram-quota.mjs";

/** @typedef {import('../types.mjs').HarvestItem} HarvestItem */

/**
 * عقد مزوّد مرخّص (لا كشط مباشر):
 * PROBE: GET {endpoint}/accounts/{handle}/latest → { id|shortcode, url, published_at? }
 * FETCH: GET {endpoint}/accounts/{handle}/posts/{id} — منشور واحد فقط
 * Authorization: Bearer {INSTAGRAM_PROVIDER_KEY}
 */

export function getInstagramIngestMode() {
  return String(process.env.INSTAGRAM_INGEST_MODE || "oembed").toLowerCase();
}

/**
 * يقبل رابط API فقط (https://...) من GitHub Secrets / env.
 * يرفض أوامر curl الكاملة أو أي قيمة غير URL صالحة — دون تسجيل قيمة السر.
 * @param {string} raw
 * @returns {{ ok: true, endpoint: string }|{ ok: false, reason: string }}
 */
export function normalizeProviderEndpoint(raw) {
  const value = String(raw || "").trim();
  if (!value) return { ok: false, reason: "missing_endpoint" };
  // رفض أوامر curl أو حقن أوامر شائعة
  if (/^curl\b/i.test(value) || /\s-(?:H|X|d|u)\b/.test(value) || /\n|\r|;|\|/.test(value)) {
    return { ok: false, reason: "endpoint_must_be_api_url_not_curl" };
  }
  let url;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: "endpoint_invalid_url" };
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    return { ok: false, reason: "endpoint_unsupported_protocol" };
  }
  // لا نسمح بمسافات أو بيانات اعتماد داخل الرابط في اللوج؛ نُسقط userinfo
  url.username = "";
  url.password = "";
  // أساس API بدون مسار زائد ضار — نحفظ origin + pathname بدون query/hash
  const endpoint = `${url.origin}${url.pathname}`.replace(/\/+$/, "");
  if (!endpoint) return { ok: false, reason: "endpoint_empty_after_normalize" };
  return { ok: true, endpoint };
}

export function getInstagramProviderConfig() {
  // يُقرأ حصراً من البيئة (في CI: GitHub Secrets عبر workflow env)
  const key = process.env.INSTAGRAM_PROVIDER_KEY?.trim() || "";
  const endpointRaw = process.env.INSTAGRAM_PROVIDER_ENDPOINT?.trim() || "";
  const normalized = normalizeProviderEndpoint(endpointRaw);
  const endpoint = normalized.ok ? normalized.endpoint : "";
  return {
    key,
    endpoint,
    configured: Boolean(key && endpoint),
    endpointError: key && endpointRaw && !normalized.ok ? normalized.reason : null,
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
      ? "Instagram provider endpoint is invalid (expected API URL from secrets)."
      : "Instagram provider is not configured.";
    return {
      mode,
      configured: false,
      message,
    };
  }
  return { mode, configured: true, message: null };
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
  const publishedAtRaw = raw.published_at ?? raw.latest_post_published_at ?? raw.timestamp ?? null;
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
    "User-Agent": harvestUserAgent(),
  };
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

  if (process.env.INSTAGRAM_PROVIDER_MOCK === "1") {
    const latest = normalizeLatestProbe(mockLatest(handle));
    if (!latest?.id) {
      return {
        ok: false,
        status: "provider_missing_latest_post_id",
        message: "provider_missing_latest_post_id",
      };
    }
    return { ok: true, latest };
  }

  const { key, endpoint } = getInstagramProviderConfig();
  const base = endpoint.replace(/\/$/, "");
  const h = handle.replace(/^@/, "");

  try {
    let res = await fetch(`${base}/accounts/${encodeURIComponent(h)}/latest`, {
      headers: authHeaders(key),
      redirect: "follow",
    });

    if (res.status === 404) {
      res = await fetch(`${base}/accounts/${encodeURIComponent(h)}/posts?limit=1`, {
        headers: authHeaders(key),
        redirect: "follow",
      });
    }

    if (res.status === 401 || res.status === 403) {
      return { ok: false, status: "private_or_unavailable", message: `HTTP ${res.status}` };
    }
    if (res.status === 429) {
      return { ok: false, status: "rate_limited", message: "HTTP 429" };
    }
    if (!res.ok) {
      return { ok: false, status: "provider_error", message: `HTTP ${res.status}` };
    }

    const data = await res.json();
    const raw =
      data.latest ??
      data.post ??
      (Array.isArray(data.posts) ? data.posts[0] : null) ??
      (Array.isArray(data.items) ? data.items[0] : null) ??
      data;

    const latest = normalizeLatestProbe(raw);
    if (!latest?.id) {
      return {
        ok: false,
        status: "provider_missing_latest_post_id",
        message: "provider_missing_latest_post_id",
      };
    }
    return { ok: true, latest };
  } catch (err) {
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

  const { key, endpoint } = getInstagramProviderConfig();
  const base = endpoint.replace(/\/$/, "");
  const h = handle.replace(/^@/, "");
  const id = encodeURIComponent(postId);

  let res = await fetch(`${base}/accounts/${encodeURIComponent(h)}/posts/${id}`, {
    headers: authHeaders(key),
    redirect: "follow",
  });

  if (res.status === 404) {
    res = await fetch(`${base}/accounts/${encodeURIComponent(h)}/posts?ids=${id}&limit=1`, {
      headers: authHeaders(key),
      redirect: "follow",
    });
  }

  if (!res.ok) throw new Error(`Provider HTTP ${res.status} for @${h} post ${postId}`);
  const data = await res.json();
  const post = data.post ?? data.posts?.[0] ?? data.items?.[0] ?? data;
  return normalizeProviderPost(post);
}

export function samePost(account, latest) {
  const seenId = String(account.last_seen_post_id || "").trim();
  const seenUrl = String(account.last_seen_post_url || "").trim();
  if (seenId && (latest.id === seenId || latest.url.includes(seenId))) return true;
  if (seenUrl && (latest.url === seenUrl || (latest.id && seenUrl.includes(latest.id)))) return true;
  return false;
}

/**
 * probe خفيف ثم fetch مشروط (منشور واحد كحد أقصى إلا مع backfill).
 * @param {import('../types.mjs').SourceAccount} account
 * @param {{ persistQuota?: boolean }} [opts]
 */
export async function probeAndMaybeFetch(account, opts = {}) {
  const persistQuota = opts.persistQuota !== false;
  const handle = String(account.handle || "").replace(/^@/, "");

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
    // oembed: لا probe عبر المزود — يُعالَج من inbox في المحوّل
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

  consumeQuota(quota, "probe");
  out.probeUsed = 1;

  const probed = await probeLatestPost(handle);
  if (persistQuota) saveInstagramQuota(quota);

  if (!probed.ok) {
    out.status = probed.status;
    out.message = probed.message;
    return out;
  }

  out.latest = probed.latest;

  if (samePost(account, probed.latest)) {
    out.status = "unchanged";
    return out;
  }

  const fetchGate = canConsumeQuota(quota, "fetch");
  if (!fetchGate.ok) {
    out.status = "rate_limited";
    out.message = fetchGate.detail || "rate_limited";
    return out;
  }

  const limit = maxLatestPostsPerAccount();
  try {
    consumeQuota(quota, "fetch");
    out.fetchUsed = 1;
    const post = await fetchSinglePost(handle, probed.latest.id);
    if (persistQuota) saveInstagramQuota(quota);

    if (!post.url || !(post.title || post.text)) {
      out.status = "provider_error";
      out.message = "empty_post_payload";
      return out;
    }

    out.items = [
      {
        sourceId: account.id,
        externalId: post.externalId,
        url: post.url,
        title: post.title,
        text: post.text,
        imageUrl: post.imageUrl,
        publishedAt: post.publishedAt,
      },
    ].slice(0, limit);

    out.status = "new_post";
    return out;
  } catch (err) {
    if (persistQuota) saveInstagramQuota(quota);
    out.status = "provider_error";
    out.message = String(err?.message || err);
    return out;
  }
}

/**
 * توافق خلفي: يستخدم مسار probe→fetch (منشور واحد).
 * @param {import('../types.mjs').SourceAccount} account
 * @param {Date} _since
 * @returns {Promise<HarvestItem[]>}
 */
export async function fetchViaProvider(account, _since) {
  const result = await probeAndMaybeFetch(account, { persistQuota: true });
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
