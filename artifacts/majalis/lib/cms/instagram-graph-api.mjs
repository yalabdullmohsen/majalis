/**
 * Phase 7 — Instagram Graph API connector (Meta Business).
 * Env: INSTAGRAM_GRAPH_ACCESS_TOKEN, INSTAGRAM_APP_ID, INSTAGRAM_APP_SECRET,
 *      INSTAGRAM_BUSINESS_ACCOUNT_ID, INSTAGRAM_WEBHOOK_VERIFY_TOKEN
 */
import { logAutomationStep } from "./automation-step-logs.mjs";
import { fetchResource } from "../http/fetch-layer.mjs";
import { recordSourceHealthEvent } from "../auto-knowledge-engine/monitoring/source-health-events.mjs";

const GRAPH_VERSION = "v21.0";
const GRAPH_BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

function pick(...keys) {
  for (const k of keys) {
    const v = String(process.env[k] || "").trim();
    if (v) return v;
  }
  return "";
}

export function getInstagramGraphConfig() {
  return {
    accessToken: pick("INSTAGRAM_GRAPH_ACCESS_TOKEN"),
    appId: pick("INSTAGRAM_APP_ID"),
    appSecret: pick("INSTAGRAM_APP_SECRET"),
    businessAccountId: pick("INSTAGRAM_BUSINESS_ACCOUNT_ID"),
    webhookVerifyToken: pick("INSTAGRAM_WEBHOOK_VERIFY_TOKEN"),
  };
}

export function isInstagramGraphConfigured() {
  const c = getInstagramGraphConfig();
  return Boolean(c.accessToken && c.businessAccountId);
}

export function getInstagramGraphStatus() {
  const c = getInstagramGraphConfig();
  const configured = isInstagramGraphConfigured();
  let tokenPreview = null;
  if (c.accessToken) {
    tokenPreview = `${c.accessToken.slice(0, 8)}…${c.accessToken.slice(-4)}`;
  }
  return {
    configured,
    status: configured ? "connected" : "instagram_connector_not_configured",
    message: configured ? "Instagram Graph API configured" : "Instagram connector not configured",
    manualAssistMode: !configured,
    appId: c.appId ? `${c.appId.slice(0, 6)}…` : null,
    businessAccountId: c.businessAccountId || null,
    accessTokenSet: Boolean(c.accessToken),
    accessTokenPreview: tokenPreview,
    webhookVerifyTokenSet: Boolean(c.webhookVerifyToken),
    envKeys: [
      "INSTAGRAM_GRAPH_ACCESS_TOKEN",
      "INSTAGRAM_APP_ID",
      "INSTAGRAM_APP_SECRET",
      "INSTAGRAM_BUSINESS_ACCOUNT_ID",
      "INSTAGRAM_WEBHOOK_VERIFY_TOKEN",
    ],
  };
}

export async function graphApiGet(path, params = {}) {
  const c = getInstagramGraphConfig();
  if (!c.accessToken) throw new Error("instagram_token_missing");

  const url = new URL(path.startsWith("http") ? path : `${GRAPH_BASE}${path.startsWith("/") ? path : `/${path}`}`);
  url.searchParams.set("access_token", c.accessToken);
  for (const [k, v] of Object.entries(params)) {
    if (v != null) url.searchParams.set(k, String(v));
  }

  const res = await fetchResource(url.toString(), {
    label: "instagram:graph",
    timeoutMs: 20_000,
    maxRetries: 2,
    useCache: false,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || json.error) {
    const msg = json.error?.message || res.statusText;
    const code = json.error?.code;
    const tokenExpired = code === 190 || /expired|invalid.*token/i.test(msg);
    throw new Error(tokenExpired ? `instagram_token_expired: ${msg}` : `graph_api_error: ${msg}`);
  }
  return json;
}

function collectMediaUrls(node) {
  const urls = [];
  if (node.media_url) urls.push(node.media_url);
  if (node.thumbnail_url) urls.push(node.thumbnail_url);
  for (const child of node.children?.data || []) {
    if (child.media_url) urls.push(child.media_url);
    if (child.thumbnail_url) urls.push(child.thumbnail_url);
  }
  return [...new Set(urls.filter(Boolean))];
}

export function mapGraphMediaNode(node) {
  const mediaUrls = collectMediaUrls(node);
  const imageUrl = node.media_type === "VIDEO" ? node.thumbnail_url || mediaUrls[0] : node.media_url || mediaUrls[0];
  const caption = node.caption || "";
  const hashtags = [...new Set(caption.match(/#[\u0600-\u06FF\w]+/g) || [])];
  const permalink = node.permalink || "";
  const isReel = node.media_type === "VIDEO" && /\/reel\//i.test(permalink);
  return {
    title: caption.slice(0, 80) || "منشور Instagram",
    link: permalink,
    description: caption,
    caption,
    imageUrl: imageUrl || "",
    mediaUrls,
    mediaType: isReel ? "REELS" : node.media_type,
    media_type: isReel ? "REELS" : node.media_type,
    mediaUrl: node.media_url || imageUrl,
    timestamp: node.timestamp,
    permalink,
    externalId: node.id,
    id: node.id,
    hashtags,
    source_url: permalink,
    fromGraphApi: true,
    connectorPending: false,
  };
}

export async function fetchMediaByBusinessAccountId(igUserId, { limit = 15 } = {}) {
  const fields = [
    "id",
    "caption",
    "media_type",
    "media_url",
    "thumbnail_url",
    "permalink",
    "timestamp",
    "children{media_url,media_type,thumbnail_url,id}",
  ].join(",");
  const data = await graphApiGet(`/${igUserId}/media`, { fields, limit });
  return (data.data || []).map(mapGraphMediaNode);
}

export async function fetchMediaByUsername(handle, { limit = 15, runId, sourceId } = {}) {
  const c = getInstagramGraphConfig();
  const ownerId = c.businessAccountId;
  if (!ownerId || !handle) return [];

  await logAutomationStep({
    runId,
    sourceId,
    step: "fetch_started",
    status: "ok",
    detail: `business_discovery:${handle}`,
  });

  const mediaFields = `{id,caption,media_type,media_url,thumbnail_url,permalink,timestamp,children{media_url,media_type,thumbnail_url,id}}`;
  const fields = `business_discovery.username(${handle})${mediaFields}`;
  const data = await graphApiGet(`/${ownerId}`, { fields });
  const media = data.business_discovery?.media?.data || [];
  return media.slice(0, limit).map(mapGraphMediaNode);
}

export async function fetchInstagramMediaForSource(source, { limit = 15, runId } = {}) {
  const config = source.config || {};
  const handle = config.handle || source.url?.replace(/.*instagram\.com\//, "").replace(/\/$/, "");
  const igAccountId = config.instagram_business_account_id || getInstagramGraphConfig().businessAccountId;

  if (!isInstagramGraphConfigured()) {
    await logAutomationStep({
      runId,
      sourceId: source.id,
      step: "connector_status",
      status: "warn",
      detail: "instagram_connector_not_configured",
    });
    return { items: [], configured: false, manualAssistMode: true };
  }

  await logAutomationStep({
    runId,
    sourceId: source.id,
    step: "auth_status",
    status: "ok",
    detail: "token_present",
  });

  try {
    let items = [];
    if (config.instagram_business_account_id) {
      items = await fetchMediaByBusinessAccountId(config.instagram_business_account_id, { limit });
    } else if (handle) {
      items = await fetchMediaByUsername(handle, { limit, runId, sourceId: source.id });
    } else if (igAccountId) {
      items = await fetchMediaByBusinessAccountId(igAccountId, { limit });
    }

    await logAutomationStep({
      runId,
      sourceId: source.id,
      step: "fetch_success",
      status: "ok",
      detail: `${items.length} posts`,
      metadata: { handle, count: items.length },
    });

    return { items, configured: true, manualAssistMode: false, graphApi: true };
  } catch (err) {
    const errMsg = String(err.message || err);
    await logAutomationStep({
      runId,
      sourceId: source.id,
      step: "fetch_failed",
      status: "error",
      detail: errMsg.slice(0, 500),
    });
    try {
      await recordSourceHealthEvent({
        connectorSlug: source.slug || source.name || "instagram",
        connectorType: "instagram",
        eventType: "fetch_failed",
        failureReason: errMsg.includes("token_expired") ? "instagram_token_expired" : "graph_api_fetch_failed",
        errorMessage: errMsg.slice(0, 500),
        metadata: { handle: source.config?.handle, sourceId: source.id },
      });
    } catch {
      /* non-blocking */
    }
    return {
      items: [],
      configured: true,
      manualAssistMode: true,
      error: errMsg,
      failureReason: errMsg.includes("token_expired") ? "instagram_token_expired" : "graph_api_fetch_failed",
    };
  }
}

export async function testInstagramConnection() {
  const status = getInstagramGraphStatus();
  if (!status.configured) {
    return {
      ok: false,
      ...status,
      accounts: [],
      failureReason: "instagram_connector_not_configured",
      remediation: buildInstagramRemediation({ configured: false }),
    };
  }

  const c = getInstagramGraphConfig();
  try {
    const [me, tokenInfo] = await Promise.all([
      graphApiGet(`/${c.businessAccountId}`, {
        fields: "username,name,followers_count,media_count",
      }),
      diagnoseInstagramToken().catch(() => null),
    ]);
    return {
      ok: true,
      configured: true,
      account: {
        id: c.businessAccountId,
        username: me.username,
        name: me.name,
        followers: me.followers_count,
        mediaCount: me.media_count,
      },
      accounts: [{ id: c.businessAccountId, username: me.username, name: me.name }],
      token: tokenInfo,
    };
  } catch (err) {
    const errMsg = String(err.message || err);
    const tokenExpired = errMsg.includes("token_expired");
    return {
      ok: false,
      configured: true,
      error: errMsg,
      failureReason: tokenExpired ? "instagram_token_expired" : "graph_api_test_failed",
      accounts: [],
      remediation: buildInstagramRemediation({
        configured: true,
        tokenExpired,
        error: errMsg,
      }),
    };
  }
}

/** Meta debug_token — inspect token validity, expiry, scopes. */
export async function diagnoseInstagramToken() {
  const c = getInstagramGraphConfig();
  if (!c.accessToken) {
    return {
      valid: false,
      failureReason: "instagram_token_missing",
      remediation: buildInstagramRemediation({ configured: false }),
    };
  }

  const appToken = c.appId && c.appSecret ? `${c.appId}|${c.appSecret}` : c.accessToken;
  const url = new URL(`${GRAPH_BASE}/debug_token`);
  url.searchParams.set("input_token", c.accessToken);
  url.searchParams.set("access_token", appToken);

  const res = await fetchResource(url.toString(), {
    label: "instagram:debug_token",
    timeoutMs: 15_000,
    maxRetries: 1,
    useCache: false,
  });
  const json = await res.json().catch(() => ({}));
  const data = json.data || {};

  if (!res.ok || json.error || data.is_valid === false) {
    const msg = json.error?.message || data.error?.message || "invalid_token";
    const expired = data.error?.code === 190 || /expired/i.test(msg);
    return {
      valid: false,
      failureReason: expired ? "instagram_token_expired" : "instagram_token_invalid",
      error: msg,
      expiresAt: data.expires_at ? new Date(data.expires_at * 1000).toISOString() : null,
      scopes: data.scopes || [],
      remediation: buildInstagramRemediation({ configured: true, tokenExpired: expired, error: msg }),
    };
  }

  const expiresAt = data.expires_at ? new Date(data.expires_at * 1000).toISOString() : null;
  const expiresInDays = data.expires_at
    ? Math.round((data.expires_at * 1000 - Date.now()) / (1000 * 60 * 60 * 24))
    : null;

  return {
    valid: true,
    appId: data.app_id || null,
    userId: data.user_id || null,
    type: data.type || null,
    expiresAt,
    expiresInDays,
    scopes: data.scopes || [],
    isValid: data.is_valid !== false,
    warning: expiresInDays != null && expiresInDays < 14 ? "token_expiring_soon" : null,
    remediation: expiresInDays != null && expiresInDays < 14
      ? buildInstagramRemediation({ configured: true, tokenExpiringSoon: true, expiresInDays })
      : null,
  };
}

export function buildInstagramRemediation(ctx = {}) {
  const steps = [];
  if (!ctx.configured) {
    steps.push(
      "أضف INSTAGRAM_GRAPH_ACCESS_TOKEN و INSTAGRAM_BUSINESS_ACCOUNT_ID في Vercel → Project Settings → Environment Variables (Production).",
      "أنشئ Long-lived User Access Token من Meta Developer Console → Instagram Basic Display / Graph API.",
      "اربط Instagram Business Account بصفحة Facebook في Meta Business Suite.",
      "انسخ Instagram Business Account ID (ليس Page ID) إلى INSTAGRAM_BUSINESS_ACCOUNT_ID.",
    );
    return { category: "configuration", steps, external: true };
  }
  if (ctx.tokenExpired) {
    steps.push(
      "الـ Token منتهي — أنشئ Long-lived Token جديد من Meta Developer Console.",
      "Tools → Graph API Explorer → Generate Access Token → instagram_basic, pages_show_list, instagram_manage_insights.",
      "حوّله إلى Long-lived Token عبر: GET /oauth/access_token?grant_type=fb_exchange_token&...",
      "حدّث INSTAGRAM_GRAPH_ACCESS_TOKEN في Vercel ثم أعد النشر.",
    );
    return { category: "token_expired", steps, external: true };
  }
  if (ctx.tokenExpiringSoon) {
    steps.push(
      `الـ Token ينتهي خلال ${ctx.expiresInDays} يوم — جدّده قبل انتهاء الصلاحية.`,
      "Meta Developer Console → Graph API Explorer → Extend Access Token.",
    );
    return { category: "token_expiring", steps, external: true };
  }
  if (ctx.error) {
    steps.push(
      `خطأ Graph API: ${ctx.error}`,
      "تحقق من صلاحيات الـ Token: instagram_basic, pages_read_engagement, business_management.",
      "تأكد أن INSTAGRAM_BUSINESS_ACCOUNT_ID يطابق حساب Instagram Business المرتبط.",
    );
    return { category: "api_error", steps, external: true };
  }
  return { category: "ok", steps: [], external: false };
}

export async function getInstagramDiagnostics() {
  const status = getInstagramGraphStatus();
  if (!status.configured) {
    return {
      ok: false,
      optional: true,
      ...status,
      failureReason: "instagram_connector_not_configured",
      token: null,
      connection: null,
      remediation: buildInstagramRemediation({ configured: false }),
      pipelineImpact: "Instagram sources use Manual Assist Mode — other connectors continue normally.",
    };
  }

  const [token, connection] = await Promise.all([
    diagnoseInstagramToken().catch((e) => ({
      valid: false,
      failureReason: "debug_token_failed",
      error: e.message,
    })),
    testInstagramConnection(),
  ]);

  return {
    ok: connection.ok && token.valid !== false,
    optional: true,
    ...status,
    token,
    connection: connection.account || null,
    failureReason: connection.failureReason || token.failureReason || null,
    remediation: connection.remediation || token.remediation || null,
    pipelineImpact: connection.ok
      ? "Instagram Graph API active — automatic fetch enabled."
      : "Instagram fetch disabled — Manual Assist Mode active; other sources unaffected.",
  };
}

/** Mock fetch for tests — INSTAGRAM_GRAPH_MOCK=1 */
export function getMockInstagramPosts(handle) {
  return [
    {
      title: `إعلان درس — ${handle}`,
      link: `https://instagram.com/p/mock-${handle}-1`,
      description: "درس شرح كتاب التوحيد — الشيخ محمد — مسجد السلام — الجهراء — الجمعة بعد العشاء",
      imageUrl: "/logo.png",
      mediaUrls: ["/logo.png"],
      mediaType: "IMAGE",
      timestamp: new Date().toISOString(),
      permalink: `https://instagram.com/p/mock-${handle}-1`,
      externalId: `mock_${handle}_1`,
      fromGraphApi: true,
    },
  ];
}
