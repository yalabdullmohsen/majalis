/**
 * Vercel Edge Middleware — يعيد HTTP 404 حقيقيًا للمسارات غير المعروفة
 * بدل إرجاع index.html بحالة 200 (مشكلة فهرسة/SEO).
 *
 * المسارات المعروفة من known-routes.json (يُولَّد في البناء).
 */
import known from "./known-routes.json";

const STATIC_EXT =
  /\.(js|css|png|jpe?g|gif|webp|avif|svg|ico|woff2?|ttf|otf|map|json|xml|txt|webmanifest|mp3|mp4|pdf)$/i;

function isAllowed(pathname) {
  if (pathname === "/") return true;
  if (pathname.startsWith("/api/") || pathname === "/api") return true;
  if (pathname.startsWith("/assets/") || pathname.startsWith("/data/") || pathname.startsWith("/fonts/")) {
    return true;
  }
  if (STATIC_EXT.test(pathname)) return true;
  if (pathname.startsWith("/.well-known/")) return true;

  const exact = pathname.replace(/\/$/, "") || "/";
  if (known.exact.includes(exact) || known.exact.includes(pathname)) return true;
  for (const p of known.prefixes) {
    if (pathname.startsWith(p) || exact.startsWith(p)) return true;
  }
  return false;
}

export const config = {
  matcher: ["/((?!assets/|data/|fonts/|api/).*)"],
};

export default async function middleware(request) {
  const url = new URL(request.url);
  const { pathname } = url;

  // الأصول والـAPI تُترك للمنصة
  if (isAllowed(pathname)) {
    return; // continue
  }

  // طلبات غير HTML (prefetch للأصول) — لا تتدخل
  const accept = request.headers.get("accept") || "";
  if (!accept.includes("text/html") && accept !== "*/*" && accept !== "") {
    return;
  }

  // أعد صفحة 404 الثابتة إن وُجدت، وإلا نصًا بسيطًا — بحالة 404
  try {
    const origin = url.origin;
    const res = await fetch(new URL("/404/index.html", origin));
    if (res.ok) {
      const body = await res.text();
      return new Response(body, {
        status: 404,
        headers: {
          "content-type": "text/html; charset=utf-8",
          "x-robots-tag": "noindex",
          "cache-control": "public, max-age=60",
        },
      });
    }
  } catch {
    /* fall through */
  }

  return new Response(
    `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"/><title>الصفحة غير موجودة | المجلس العلمي</title><meta name="robots" content="noindex"/></head><body><h1>٤٠٤</h1><p>الصفحة غير موجودة.</p><p><a href="/">الرئيسية</a></p></body></html>`,
    {
      status: 404,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex",
      },
    },
  );
}
