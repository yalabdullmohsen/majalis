import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";

// dist/index.html هو نفس صدفة SPA النهائية التي بنتها Vite (بمراجع الأصول
// المُوسَّمة بهاش صحيحة) — نستبدل وسوم SEO الافتراضية (الرئيسية) فيها بوسوم
// الدرس الفعلي، دون المساس بأي script/link آخر، فيبقى إقلاع التطبيق سليمًا
// تمامًا كصفحات prerender الثابتة القائمة (نفس النمط، وقت الطلب لا البناء).
const DIST_INDEX_PATH = fileURLToPath(new URL("../../dist/index.html", import.meta.url));

const SITE_NAME = "المجلس العلمي";
const SITE_URL = "https://majlisilm.com";
const DEFAULT_IMAGE = `${SITE_URL}/opengraph.jpg`;
const SHEIKH_EMBED = "sheikhs(id, name, city, photo_url)";

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => (
    { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]
  ));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/\n/g, " ").trim();
}

function clamp(text, max = 300) {
  const t = String(text || "").trim();
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

function lessonDescription(row) {
  const parts = [row.description, row.speaker_name && `الشيخ ${row.speaker_name}`, row.mosque, row.city]
    .filter(Boolean);
  return clamp(parts.join(" — ") || `درس شرعي على منصة ${SITE_NAME}`, 300);
}

async function findLesson(idParam) {
  const admin = getSupabaseAdmin();
  // لا نُطابِق هذا بحالة "الدرس غير موجود" — عميل إداري غائب (بيئة مُهيَّأة
  // خطأً) لا يعني أن الدرس نفسه غير موجود، وإلا سيرى الزوّار 404 كاذبة لكل
  // درس حيّ فعليًا. نرميه ليُمسَك في catch الأعلى ويُقدَّم صدفة SPA بدلاً
  // من ذلك (نفس مسار فشل استعلام Supabase الفعلي أدناه).
  if (!admin) throw new Error("lesson-page: Supabase admin client unavailable");

  const byId = await admin
    .from("lessons")
    .select(`*, ${SHEIKH_EMBED}`)
    .eq("id", idParam)
    .eq("status", "approved")
    .maybeSingle();
  if (byId.error) throw byId.error;
  if (byId.data) return byId.data;

  // external_key قد يُخزَّن بـ":" لكن معرّف الرابط يستخدم "-" (بعد التطهير).
  const colonId = idParam.replace(/-/g, ":");
  const byExternalKey = await admin
    .from("lessons")
    .select(`*, ${SHEIKH_EMBED}`)
    .or(`external_key.eq.${idParam},external_key.eq.${colonId}`)
    .eq("status", "approved")
    .maybeSingle();
  if (byExternalKey.error) throw byExternalKey.error;
  return byExternalKey.data || null;
}

function buildLessonHead(row, id) {
  const title = `${escapeHtml(row.title)} | ${SITE_NAME}`;
  const description = escapeAttr(lessonDescription(row));
  const url = `${SITE_URL}/lessons/${encodeURIComponent(id)}`;
  const image = row.sheikh_image_url || row.poster_image_url || DEFAULT_IMAGE;

  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Event",
    name: row.title,
    description: lessonDescription(row),
    url,
    location: row.mosque || row.city ? { "@type": "Place", name: [row.mosque, row.city].filter(Boolean).join("، ") } : undefined,
    performer: row.speaker_name ? { "@type": "Person", name: row.speaker_name } : undefined,
    organizer: { "@type": "Organization", name: SITE_NAME, url: SITE_URL },
  });

  return { title, description, url, image, jsonLd };
}

// يستبدل وسوم SEO الافتراضية (الرئيسية) الموجودة فعليًا في dist/index.html
// بوسوم الدرس — استبدال نصي مستهدَف على قيم معروفة ثابتة، لا تحليل DOM.
function injectLessonHead(html, head) {
  return html
    .replace(/<title>[^<]*<\/title>/, `<title>${head.title}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, `<meta name="description" content="${head.description}" />`)
    .replace(/<link rel="canonical" href="[^"]*" \/>/, `<link rel="canonical" href="${head.url}" />`)
    .replace(/<meta property="og:title" content="[^"]*" \/>/, `<meta property="og:title" content="${head.title}" />`)
    .replace(/<meta property="og:description" content="[^"]*" \/>/, `<meta property="og:description" content="${head.description}" />`)
    .replace(/<meta property="og:type" content="[^"]*" \/>/, `<meta property="og:type" content="article" />`)
    .replace(/<meta property="og:url" content="[^"]*" \/>/, `<meta property="og:url" content="${head.url}" />`)
    .replace(/<meta property="og:image" content="[^"]*" \/>/, `<meta property="og:image" content="${escapeAttr(head.image)}" />`)
    .replace(/<meta name="twitter:title" content="[^"]*" \/>/, `<meta name="twitter:title" content="${head.title}" />`)
    .replace(/<meta name="twitter:description" content="[^"]*" \/>/, `<meta name="twitter:description" content="${head.description}" />`)
    .replace(/<meta name="twitter:image" content="[^"]*" \/>/, `<meta name="twitter:image" content="${escapeAttr(head.image)}" />`)
    .replace("</head>", `<script type="application/ld+json">${head.jsonLd}</script>\n  </head>`);
}

function notFoundHtml() {
  return `<!DOCTYPE html>
<html lang="ar" dir="rtl"><head><meta charset="UTF-8" />
<title>الدرس غير موجود | ${SITE_NAME}</title>
<meta name="robots" content="noindex" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head><body style="font-family:system-ui;text-align:center;padding:4rem 1rem">
<h1>هذا الدرس غير متاح</h1>
<p>ربما أُزيل أو انتهى، أو أن الرابط غير صحيح.</p>
<a href="/lessons">تصفّح الدروس</a>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  // req.url هنا هو /api/lessons/<id> (بعد إعادة الكتابة في vercel.json من
  // /lessons/:id العام) — نفس نمط /sitemap.xml → /api/sitemap.
  const idParam = decodeURIComponent(String(req.url || "").replace(/^\/api\/lessons\//, "").split(/[?#]/)[0]);

  if (!idParam) {
    res.statusCode = 404;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(notFoundHtml());
    return;
  }

  // /lessons/current — إعادة توجيه مباشرة من الحافة، كانت سابقًا Redirect
  // من جهة العميل فقط داخل SPA.
  if (idParam === "current") {
    res.statusCode = 302;
    res.setHeader("Location", "/lessons");
    res.end();
    return;
  }

  try {
    const lesson = await findLesson(idParam);
    if (!lesson) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "public, max-age=60, s-maxage=60");
      res.end(notFoundHtml());
      return;
    }

    const shell = await readFile(DIST_INDEX_PATH, "utf8");
    const head = buildLessonHead(lesson, idParam);
    const html = injectLessonHead(shell, head);

    res.statusCode = 200;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    // محتوى حيّ من Supabase قد يتغيّر (تعديل إداري) — كاش قصير، لا طويل الأمد
    // كالأصول الثابتة.
    res.setHeader("Cache-Control", "public, max-age=300, s-maxage=300, stale-while-revalidate=3600");
    res.end(html);
  } catch (err) {
    console.error("[lesson-page]", err);
    // فشل السيرفر (Supabase معطّل مؤقتًا وغيره) يجب ألا يمنع الزائر من رؤية
    // الصفحة إطلاقًا — نُسلِّم صدفة SPA العامة فيتولى العميل الجلب من جديد،
    // بدل صفحة خطأ فارغة.
    try {
      const shell = await readFile(DIST_INDEX_PATH, "utf8");
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/html; charset=utf-8");
      res.setHeader("Cache-Control", "no-store");
      res.end(shell);
    } catch {
      res.statusCode = 500;
      res.end("تعذّر تحميل الصفحة.");
    }
  }
}
