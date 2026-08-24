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

/**
 * عقد مزوّد مرخّص (لا كشط مباشر) — المسار الرسمي:
 * GET {endpoint}/accounts/{handle}/posts?since={iso}
 * Authorization: Bearer {INSTAGRAM_PROVIDER_KEY}
 * → { posts: [{ id, url, caption|text, image_url?, published_at }] }
 *
 * مسارات اختيارية للتوافق: /latest و /posts/{id} إن وُجدت لدى المزوّد.
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
 * المسار الرسمي للمزوّد: قائمة منشورات منذ تاريخ.
 * @param {string} handle
 * @param {Date} [since]
 * @returns {Promise<ReturnType<typeof normalizeProviderPost>[]>}
 */
export async function fetchPostsFromProviderApi(handle, since) {
  if (process.env.INSTAGRAM_PROVIDER_MOCK === "1") {
    return [normalizeProviderPost(mockPostDetails(handle, mockLatest(handle).id))];
  }

  const { key, endpoint } = getInstagramProviderConfig();
  if (!key || !endpoint) return [];

  const base = endpoint.replace(/\/$/, "");
  const h = handle.replace(/^@/, "");
  const sinceIso = since instanceof Date ? since.toISOString() : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const paths = [
    `/accounts/${encodeURIComponent(h)}/posts?since=${encodeURIComponent(sinceIso)}`,
    `/accounts/${encodeURIComponent(h)}/posts?since=${encodeURIComponent(sinceIso)}&limit=30`,
    `/v1/accounts/${encodeURIComponent(h)}/posts?since=${encodeURIComponent(sinceIso)}`,
  ];

  let lastError = /** @type {Error|null} */ (null);
  for (const path of paths) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: authHeaders(key),
        redirect: "follow",
      });
      if (res.status === 401 || res.status === 403) {
        throw new Error(`HTTP ${res.status}`);
      }
      if (res.status === 429) {
        throw new Error("HTTP 429");
      }
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status}`);
        continue;
      }
      const data = await res.json();
      const posts = Array.isArray(data)
        ? data
        : Array.isArray(data.posts)
          ? data.posts
          : Array.isArray(data.items)
            ? data.items
            : Array.isArray(data.data)
              ? data.data
              : [];
      if (!Array.isArray(posts)) continue;
      return posts.map(normalizeProviderPost).filter((p) => p.url && (p.title || p.text));
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
      if (/HTTP 401|HTTP 403|HTTP 429/.test(lastError.message)) throw lastError;
    }
  }
  if (lastError) throw lastError;
  return [];
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
  const sinceIso = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  try {
    const candidates = [
      `${base}/accounts/${encodeURIComponent(h)}/posts?since=${encodeURIComponent(sinceIso)}&limit=1`,
      `${base}/accounts/${encodeURIComponent(h)}/posts?since=${encodeURIComponent(sinceIso)}`,
      `${base}/accounts/${encodeURIComponent(h)}/latest`,
      `${base}/accounts/${encodeURIComponent(h)}/posts?limit=1`,
    ];

    let res = null;
    for (const url of candidates) {
      res = await fetch(url, {
        headers: authHeaders(key),
        redirect: "follow",
      });
      if (res.ok || res.status === 401 || res.status === 403 || res.status === 429) break;
    }

    if (!res) {
      return { ok: false, status: "provider_error", message: "no_response" };
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
      (Array.isArray(data.data) ? data.data[0] : null) ??
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
 * قائمة منشورات حديثة (لنافذة 7 أيام / backfill) — العقد الرسمي `posts?since=`.
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
 * يجلب منشورات النافذة عبر العقد الرسمي `posts?since=` ثم يحتفظ بمسار probe كاحتياطي.
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

  consumeQuota(quota, "probe");
  out.probeUsed = 1;

  const fetchGate = canConsumeQuota(quota, "fetch");
  if (!fetchGate.ok) {
    if (persistQuota) saveInstagramQuota(quota);
    out.status = "rate_limited";
    out.message = fetchGate.detail || "rate_limited";
    return out;
  }

  const backfill = isBackfillEnabled();
  const limit = maxLatestPostsPerAccount();

  // المسار الرسمي: posts?since= (كل الحسابات ضمن آخر 7 أيام)
  try {
    consumeQuota(quota, "fetch");
    out.fetchUsed = 1;
    const posts = await fetchPostsFromProviderApi(handle, since);
    if (persistQuota) saveInstagramQuota(quota);

    const filtered = posts
      .filter((p) => {
        const t = Date.parse(p.publishedAt);
        return Number.isNaN(t) || t >= since.getTime();
      })
      .slice(0, limit);

    if (filtered.length) {
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
    }

    // قائمة فارغة ضمن النافذة = لا جديد
    out.status = "unchanged";
    return out;
  } catch (primaryErr) {
    // احتياطي: probe/latest ثم منشور واحد إن وُجد لدى المزوّد
    const msg = String(primaryErr?.message || primaryErr);
    if (/HTTP 401|HTTP 403/.test(msg)) {
      if (persistQuota) saveInstagramQuota(quota);
      out.status = "private_or_unavailable";
      out.message = msg;
      return out;
    }
    if (/HTTP 429/.test(msg)) {
      if (persistQuota) saveInstagramQuota(quota);
      out.status = "rate_limited";
      out.message = msg;
      return out;
    }

    const probed = await probeLatestPost(handle);
    if (persistQuota) saveInstagramQuota(quota);
    if (!probed.ok) {
      out.status = probed.status;
      out.message = probed.message || msg;
      return out;
    }

    out.latest = probed.latest;
    if (!backfill && samePost(account, probed.latest)) {
      out.status = "unchanged";
      return out;
    }

    try {
      const post = await fetchSinglePost(handle, probed.latest.id);
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
      ];
      out.status = "new_post";
      return out;
    } catch (err) {
      out.status = "provider_error";
      out.message = String(err?.message || err || msg);
      return out;
    }
  }
}

/**
 * توافق خلفي: يستخدم مسار probe→fetch (منشور واحد).
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
