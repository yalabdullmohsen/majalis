/**
 * Edge middleware:
 * 1) يزيل ?tab=courses|men|women من /lessons — يُبقي ?search= وغيره.
 * 2) يحجب /admin و/dashboard عن الزواحف وعن الزوار بلا جلسة (404 + noindex).
 * يجب استدعاء next() لتمرير الطلبات العادية؛ وإلا يرجع Vercel جسمًا فارغًا.
 */
import { next } from "@vercel/functions";

const BOT_UA =
  /bot|crawler|spider|slurp|bingpreview|facebookexternalhit|linkedinbot|twitterbot|embedly|quora link preview|pinterest|redditbot|applebot|semrush|ahrefs|mj12|dotbot|bytespider|gptbot|claudebot|perplexity/i;

function isHtmlDocument(request) {
  const dest = String(request.headers.get("sec-fetch-dest") || "").toLowerCase();
  if (dest === "document") return true;
  const accept = String(request.headers.get("accept") || "").toLowerCase();
  return accept.includes("text/html");
}

function isLikelyBot(request) {
  const ua = String(request.headers.get("user-agent") || "");
  return BOT_UA.test(ua);
}

function isPrivateAppPath(pathname) {
  return /^\/(admin|dashboard)(\/|$)/.test(pathname);
}

/** جلسة Supabase في الكوكي — بدونها لا تُعرض قشرة الإدارة للعامة. */
function hasSupabaseSession(request) {
  try {
    const cookies = request.cookies?.getAll?.() || [];
    return cookies.some((c) => {
      const n = String(c?.name || "");
      return (
        n.includes("-auth-token") ||
        (n.startsWith("sb-") && /auth/i.test(n))
      );
    });
  } catch {
    return false;
  }
}

function privateNotFound() {
  return new Response(
    `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><meta name="robots" content="noindex, nofollow"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>غير متاح</title></head><body><h1>غير متاح</h1><p>هذه الصفحة غير متاحة للعرض العام.</p></body></html>`,
    {
      status: 404,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "private, no-store",
        "X-Robots-Tag": "noindex, nofollow",
      },
    },
  );
}

export default function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  if (isPrivateAppPath(pathname) && isHtmlDocument(request)) {
    if (isLikelyBot(request) || !hasSupabaseSession(request)) {
      return privateNotFound();
    }
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
