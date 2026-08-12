/**
 * جلب منشورات Instagram عبر Apify (apify/instagram-scraper) — يستبدل
 * الاعتماد على Meta Graph API. لا صلاحيات Meta ولا تسجيل دخول لإنستغرام.
 * السعر بالنتيجة (~$0.0023/نتيجة) — resultsLimit صغير عمدًا لكل حساب.
 */
const ACTOR_ID = "apify~instagram-scraper";
const RESULTS_LIMIT_PER_ACCOUNT = 5;
const RUN_TIMEOUT_SECS = 90;
const FETCH_TIMEOUT_MS = 100_000;
const MAX_RETRIES = 1;

function apifyToken() {
  return String(process.env.APIFY_API_TOKEN || "").trim();
}

export function isApifyConfigured() {
  return Boolean(apifyToken());
}

/** يحوّل عنصر خام من apify/instagram-scraper إلى شكل item موحّد يطابق
 * ما يتوقعه processAutomationItem/upsertUnifiedContentItem الموجودان
 * فعليًا (title/link/description/imageUrl/mediaUrls/timestamp/id). */
function mapApifyItem(raw) {
  const mediaUrls = [];
  if (raw.videoUrl) mediaUrls.push(raw.videoUrl);
  if (raw.displayUrl) mediaUrls.push(raw.displayUrl);
  for (const child of raw.childPosts || []) {
    if (child.displayUrl) mediaUrls.push(child.displayUrl);
    if (child.videoUrl) mediaUrls.push(child.videoUrl);
  }

  const mediaType = raw.type === "Video" ? "video" : raw.type === "Sidecar" ? "carousel" : "image";

  return {
    id: raw.id || raw.shortCode || null,
    shortCode: raw.shortCode || null,
    title: (raw.caption || "").slice(0, 80) || raw.ownerFullName || raw.ownerUsername || "منشور Instagram",
    description: raw.caption || "",
    link: raw.url || (raw.shortCode ? `https://www.instagram.com/p/${raw.shortCode}/` : null),
    imageUrl: raw.displayUrl || mediaUrls[0] || "",
    mediaUrls: [...new Set(mediaUrls.filter(Boolean))],
    mediaType,
    timestamp: raw.timestamp || null,
    ownerUsername: raw.ownerUsername || null,
    ownerFullName: raw.ownerFullName || null,
    fromApify: true,
  };
}

async function callApifyRunSync(input) {
  const token = apifyToken();
  const url = `https://api.apify.com/v2/acts/${ACTOR_ID}/run-sync-get-dataset-items?token=${encodeURIComponent(token)}&timeout=${RUN_TIMEOUT_SECS}`;

  let lastError;
  for (let attempt = 1; attempt <= 1 + MAX_RETRIES; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        // لا كشف للتوكن في رسالة الخطأ إطلاقًا — رسالة Apify نفسها لا تتضمنه.
        const text = await res.text().catch(() => "");
        throw new Error(`apify_http_${res.status}: ${text.slice(0, 200)}`);
      }
      return await res.json();
    } catch (err) {
      lastError = err;
      if (attempt <= MAX_RETRIES) await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw lastError;
}

/**
 * يجلب أحدث منشورات عدة حسابات Instagram دفعة واحدة (استدعاء Apify واحد
 * لكل الحسابات معًا لتقليل التكلفة وعدد الاستدعاءات — لا استدعاء منفصل
 * لكل حساب). يُعيد خريطة username → items[] بالإضافة لأي خطأ عام للتشغيل.
 */
export async function fetchInstagramPostsViaApify(handles, { resultsLimit = RESULTS_LIMIT_PER_ACCOUNT } = {}) {
  if (!isApifyConfigured()) {
    return { ok: false, error: "apify_not_configured", byHandle: {} };
  }
  const directUrls = handles.map((h) => `https://www.instagram.com/${h}/`);

  let items;
  try {
    items = await callApifyRunSync({
      directUrls,
      resultsType: "posts",
      resultsLimit,
      onlyPostsNewerThan: "60 days",
    });
  } catch (err) {
    // لا تسجيل لأي جزء من التوكن أو الرابط الكامل — رسالة الخطأ فقط.
    return { ok: false, error: String(err.message || err).slice(0, 300), byHandle: {} };
  }

  const byHandle = Object.fromEntries(handles.map((h) => [h.toLowerCase(), []]));
  for (const raw of Array.isArray(items) ? items : []) {
    const owner = String(raw.ownerUsername || "").toLowerCase();
    if (owner && byHandle[owner]) {
      byHandle[owner].push(mapApifyItem(raw));
    } else {
      // نادرًا ما يفشل استخراج ownerUsername من الاستجابة — طابق بالرابط المُدخَل بدلًا من ذلك.
      const inputUrl = String(raw.inputUrl || "").toLowerCase();
      const matched = handles.find((h) => inputUrl.includes(`/${h.toLowerCase()}/`));
      if (matched) byHandle[matched.toLowerCase()].push(mapApifyItem(raw));
    }
  }

  return { ok: true, byHandle, totalItems: Array.isArray(items) ? items.length : 0 };
}
