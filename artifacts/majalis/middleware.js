/**
 * Edge middleware:
 * 1) يزيل ?tab=courses|men|women من /lessons — يُبقي ?search= وغيره.
 * 2) يحجب /admin و/dashboard عن الزواحف وعن الزوار بلا جلسة (404 + noindex).
 * 3) /scholars: معرّفات معروفة تُمرَّر؛ مزالة → 410؛ مجهولة → 404 نظيف.
 * يجب استدعاء next() لتمرير الطلبات العادية؛ وإلا يرجع Vercel جسمًا فارغًا.
 */
import { next } from "@vercel/functions";

const BOT_UA =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|twitterbot|embedly|quora link preview|pinterest|redditbot|applebot|semrush|ahrefs|mj12|dotbot|bytespider|gptbot|claudebot|perplexity/i;

/** يطابق src/data/scholars-profiles.ts — قائمة ثابتة للـedge بلا استيراد حزمة. */
const SCHOLAR_CANONICAL = new Set([
  "malik",
  "nawawi",
  "abu-hanifa",
  "shafii",
  "ahmad",
  "bukhari",
  "muslim",
  "ibn-taymiyyah",
  "ibn-kathir",
]);

const SCHOLAR_ALIASES = {
  "imam-malik": "malik",
  "al-nawawi": "nawawi",
  "imam-nawawi": "nawawi",
  hanafi: "abu-hanifa",
  "imam-abu-hanifa": "abu-hanifa",
  shafi: "shafii",
  "al-shafi": "shafii",
  "al-shafii": "shafii",
  "imam-shafi": "shafii",
  "imam-shafii": "shafii",
  "ahmad-ibn-hanbal": "ahmad",
  hanbali: "ahmad",
  "imam-ahmad": "ahmad",
  "al-bukhari": "bukhari",
  "imam-bukhari": "bukhari",
  "imam-muslim": "muslim",
  "al-muslim": "muslim",
  "ibn-taymiya": "ibn-taymiyyah",
  "sheikh-ul-islam": "ibn-taymiyyah",
};

const SCHOLAR_GONE = new Set([
  "ibn-al-qayyim-alt",
  "ibn-uthaymeen-older",
  "ibn-uthaymin-ext",
  "al-ghazali-junior",
  "amir-al-san'ani",
  "amir-al-san%27ani",
  "al-qurtubi-scholar",
  "ibn-mufli",
  "al-bayhaqi",
  "al-mubarakfuri-2",
  "al-izz-ibn-abdes-salam",
  "ibn-al-mubarak-senior",
  "al-haytami",
  "al-khatib-baghdadi",
  "al-mizzi-2",
  "ibn-juzayy-2",
  "ibn-al-salah",
  "ibn-abi-shayba",
  "fakhr-al-razi",
]);

function isHtmlDocument(request) {
  const dest = String(request.headers.get("sec-fetch-dest") || "").toLowerCase();
  if (dest === "document") return true;
  const accept = String(request.headers.get("accept") || "").toLowerCase();
  return accept.includes("text/html") || accept.includes("*/*") || !accept;
}

function isLikelyBot(request) {
  const ua = String(request.headers.get("user-agent") || "");
  return BOT_UA.test(ua);
}

function isPrivateAppPath(pathname) {
  return /^\/(admin|dashboard)(\/|$)/.test(pathname);
}

function hasSupabaseSession(request) {
  try {
    const cookies = request.cookies?.getAll?.() || [];
    return cookies.some((c) => {
      const n = String(c?.name || "");
      return n.includes("-auth-token") || (n.startsWith("sb-") && /auth/i.test(n));
    });
  } catch {
    return false;
  }
}

function htmlStatusPage(status, title, body) {
  return new Response(
    `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="robots" content="noindex, nofollow"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${title}</title></head><body><h1>${title}</h1><p>${body}</p></body></html>`,
    {
      status,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

function privateNotFound() {
  return htmlStatusPage(404, "غير متاح", "هذه الصفحة غير متاحة للعرض العام.");
}

function scholarGone() {
  return htmlStatusPage(410, "أُزيل المعرّف", "هذا الرابط يشير إلى سجل قديم خاطئ أو مكرر.");
}

function scholarMissing() {
  return htmlStatusPage(404, "عالِم غير موجود", "لا توجد صفحة لهذا المعرّف في فهرس العلماء.");
}

export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (isPrivateAppPath(pathname)) {
    // دائماً احجب القشرة المفهرسة عن غير المصرّح والبوتات — حتى بلا Accept: text/html
    if (isLikelyBot(request) || !hasSupabaseSession(request)) {
      if (isHtmlDocument(request) || isLikelyBot(request)) {
        return privateNotFound();
      }
      return new Response(null, {
        status: 404,
        headers: {
          "Cache-Control": "private, no-store",
          "X-Robots-Tag": "noindex, nofollow",
        },
      });
    }
  }

  if (pathname === "/scholars" || pathname.startsWith("/scholars/")) {
    if (pathname === "/scholars" || pathname === "/scholars/") {
      return next();
    }
    const raw = pathname.slice("/scholars/".length).split("/")[0] || "";
    let key = raw;
    try {
      key = decodeURIComponent(raw).toLowerCase();
    } catch {
      key = raw.toLowerCase();
    }

    if (SCHOLAR_GONE.has(key) || SCHOLAR_GONE.has(raw)) {
      return scholarGone();
    }
    const aliasTarget = SCHOLAR_ALIASES[key];
    if (aliasTarget) {
      url.pathname = `/scholars/${aliasTarget}`;
      return Response.redirect(url.toString(), 308);
    }
    if (!SCHOLAR_CANONICAL.has(key)) {
      return scholarMissing();
    }
    return next();
  }

  const tab = url.searchParams.get("tab");
  if (pathname === "/lessons" && (tab === "courses" || tab === "men" || tab === "women")) {
    url.searchParams.delete("tab");
    const qs = url.searchParams.toString();
    const dest = qs ? `${url.pathname}?${qs}` : url.pathname;
    return Response.redirect(new URL(dest, url.origin).toString(), 308);
  }
  return next();
}
