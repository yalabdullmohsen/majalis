/** صفحة 404 HTML مشتركة — HTTP 404، RTL، هوية المجلس، روابط خروج. */
const SITE_NAME = "سُنّة";

export function buildNotFoundHtml(options = {}) {
  const title = options.title || `الصفحة غير موجودة | ${SITE_NAME}`;
  const description =
    options.description ||
    "الصفحة التي تبحث عنها غير موجودة أو نُقلت. يمكنك العودة للرئيسية أو تصفّح الدروس أو البحث.";
  const heading = options.heading || "الصفحة غير موجودة";
  const detail =
    options.detail ||
    "يبدو أن الرابط غير صحيح أو أن المحتوى لم يعد متاحاً.";

  return `<!DOCTYPE html>
<html lang="ar" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(title)}</title>
  <meta name="description" content="${escapeAttr(description)}" />
  <meta name="robots" content="noindex, follow" />
  <link rel="icon" href="/favicon.png" />
  <style>
    :root { --ink:#1a1a1a; --muted:#5c5c56; --brand:#226A56; --brand-dark:#143F35; --bg:#f4f7f5; }
    * { box-sizing: border-box; }
    body {
      margin: 0; min-height: 100vh; display: flex; align-items: center; justify-content: center;
      font-family: "IBM Plex Sans Arabic", "Noto Naskh Arabic", Tahoma, sans-serif;
      background: linear-gradient(160deg, #e8f0ec 0%, var(--bg) 45%, #eef2f0 100%);
      color: var(--ink); padding: 1.5rem;
    }
    .card {
      max-width: 28rem; width: 100%; text-align: center;
      background: #fff; border: 1px solid #d7e3dd; border-radius: 1rem;
      padding: 2rem 1.5rem 1.75rem; box-shadow: 0 10px 30px rgba(20,63,53,.06);
    }
    .brand { display: flex; align-items: center; justify-content: center; gap: .6rem; margin-bottom: 1.1rem; }
    .brand img { width: 40px; height: 40px; border-radius: 8px; }
    .brand span { font-weight: 800; color: var(--brand); font-size: 1.05rem; }
    .code { font-size: 2.6rem; font-weight: 800; color: var(--brand); margin: 0 0 .4rem; letter-spacing: .04em; }
    h1 { font-size: 1.35rem; margin: 0 0 .65rem; }
    p { color: var(--muted); line-height: 1.75; margin: 0 0 1.4rem; font-size: .95rem; }
    .actions { display: flex; flex-wrap: wrap; gap: .65rem; justify-content: center; }
    a.btn {
      display: inline-flex; align-items: center; justify-content: center;
      min-height: 2.6rem; padding: 0 1.1rem; border-radius: .65rem;
      text-decoration: none; font-weight: 700; font-size: .9rem; border: 1px solid var(--brand);
    }
    a.btn-primary { background: var(--brand); color: #fff; }
    a.btn-primary:hover { background: var(--brand-dark); }
    a.btn-outline { background: transparent; color: var(--brand); }
  </style>
</head>
<body>
  <main class="card">
    <div class="brand">
      <img src="/favicon.png" width="40" height="40" alt="" />
      <span>${SITE_NAME}</span>
    </div>
    <p class="code" aria-label="خطأ 404">٤٠٤</p>
    <h1>${escapeHtml(heading)}</h1>
    <p>${escapeHtml(detail)}</p>
    <div class="actions">
      <a class="btn btn-primary" href="/">الرئيسية</a>
      <a class="btn btn-outline" href="/lessons">الدروس</a>
      <a class="btn btn-outline" href="/search">البحث</a>
    </div>
  </main>
</body>
</html>`;
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ").trim();
}

export function sendNotFoundHtml(res, options = {}) {
  const html = buildNotFoundHtml(options);
  if (typeof res.status === "function" && typeof res.send === "function") {
    res.status(404).setHeader("Content-Type", "text/html; charset=utf-8").setHeader("Cache-Control", "public, max-age=60").send(html);
    return;
  }
  res.statusCode = 404;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=60");
  res.end(html);
}

/** هل الطلب يبدو من متصفح يتوقع HTML؟ */
export function wantsHtml(req) {
  const accept = String(req?.headers?.accept || "");
  if (accept.includes("text/html")) return true;
  // بدون Accept صريح (بعض الزواحف) — إن لم يطلب JSON صراحةً نُفضّل HTML
  if (!accept || accept === "*/*") return !String(req?.headers?.["content-type"] || "").includes("json");
  return false;
}
