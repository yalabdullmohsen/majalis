import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import {
  canonicalizeLessonPublicId,
  lessonExternalKeyCandidates,
} from "../lesson-id-aliases.mjs";
import { buildNotFoundHtml } from "../not-found-html.mjs";

// dist/index.html هو نفس صدفة SPA النهائية التي بنتها Vite (بمراجع الأصول
// المُوسَّمة بهاش صحيحة) — نستبدل وسوم SEO الافتراضية (الرئيسية) فيها بوسوم
// الدرس الفعلي، دون المساس بأي script/link آخر، فيبقى إقلاع التطبيق سليمًا
// تمامًا كصفحات prerender الثابتة القائمة (نفس النمط، وقت الطلب لا البناء).
const DIST_INDEX_PATH = fileURLToPath(new URL("../../dist/index.html", import.meta.url));
const SEED_SNAPSHOT_PATH = fileURLToPath(
  new URL("../../scripts/lessons-seed.snapshot.json", import.meta.url),
);

let seedSnapshotCache = null;

async function loadSeedSnapshot() {
  if (seedSnapshotCache) return seedSnapshotCache;
  try {
    const raw = await readFile(SEED_SNAPSHOT_PATH, "utf8");
    seedSnapshotCache = JSON.parse(raw);
  } catch {
    seedSnapshotCache = [];
  }
  return seedSnapshotCache;
}

function findInSeedSnapshot(idParam) {
  const wanted = new Set(lessonExternalKeyCandidates(idParam));
  wanted.add(canonicalizeLessonPublicId(idParam));
  return (seedSnapshotCache || []).find(
    (row) => wanted.has(row.id) || wanted.has(row.external_key),
  ) || null;
}

/** يستخرج معرّف الدرس من req.url أو من ترويسة المسار الأصلي بعد إعادة الكتابة. */
function extractLessonIdParam(req) {
  const candidates = [
    req?.url,
    req?.headers?.["x-vercel-original-path"],
    req?.headers?.["x-invoke-path"],
    req?.headers?.["x-forwarded-uri"],
  ]
    .filter(Boolean)
    .map((s) => String(s).split(/[?#]/)[0]);

  for (const path of candidates) {
    const m = path.match(/^\/(?:api\/)?lessons\/([^/]+)\/?$/);
    if (m?.[1]) return decodeURIComponent(m[1]);
  }
  return "";
}

const SITE_NAME = "المجلس العلمي";
const SITE_URL = "https://majlisilm.com";
const DEFAULT_IMAGE = `${SITE_URL}/brand/official-og.png?v=20260825`;
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


function stripSpeakerHonorific(name) {
  let value = String(name || "").trim();
  if (!value) return "";
  value = value.replace(/^(?:الشيخة?|الدكتور(?:ة)?|الأستاذ(?:ة)?|القارئ)\s*[:：]\s*/u, "").trim();
  for (let i = 0; i < 4; i++) {
    const next = value
      .replace(/^(?:فضيلة|معالي|العلامة|الشيخ(?:ة)?(?:\s+الدكتور(?:ة)?|\s+د\.?)?|الدكتور(?:ة)?|د\.)\s+/iu, "")
      .trim();
    if (next === value) break;
    value = next;
  }
  return value.replace(/\s+/g, " ").trim();
}

function formatSpeakerLabel(name) {
  const core = stripSpeakerHonorific(name);
  if (!core) return "";
  return `المحاضر: ${core}`;
}

function lessonDescription(row) {
  const parts = [row.description, row.speaker_name && formatSpeakerLabel(row.speaker_name), row.mosque, row.city]
    .filter(Boolean);
  return clamp(parts.join(" — ") || `درس شرعي على منصة ${SITE_NAME}`, 300);
}

async function findLesson(idParam) {
  const canonical = canonicalizeLessonPublicId(idParam);
  const lookupIds = [...new Set([idParam, canonical].filter(Boolean))];

  const admin = getSupabaseAdmin();
  if (admin) {
    for (const lookId of lookupIds) {
      const byId = await admin
        .from("lessons")
        .select(`*, ${SHEIKH_EMBED}`)
        .eq("id", lookId)
        .eq("status", "approved")
        .maybeSingle();
      if (byId.error) throw byId.error;
      if (byId.data) return byId.data;

      const keys = lessonExternalKeyCandidates(lookId);
      const orFilter = keys.map((k) => `external_key.eq.${k}`).join(",");
      const byExternalKey = await admin
        .from("lessons")
        .select(`*, ${SHEIKH_EMBED}`)
        .or(orFilter)
        .eq("status", "approved")
        .maybeSingle();
      if (byExternalKey.error) throw byExternalKey.error;
      if (byExternalKey.data) return byExternalKey.data;
    }
  }

  // احتياطي البذرة المعتمدة — نفس مصدر بطاقات الواجهة (لا اختراع محتوى).
  await loadSeedSnapshot();
  for (const lookId of lookupIds) {
    const seed = findInSeedSnapshot(lookId);
    if (seed && (!seed.status || seed.status === "approved")) return seed;
  }
  return null;
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
  return buildNotFoundHtml({
    title: `الدرس غير موجود | ${SITE_NAME}`,
    description: "هذا الدرس غير متاح. ربما أُزيل أو انتهى، أو أن الرابط غير صحيح.",
    heading: "هذا الدرس غير متاح",
    detail: "ربما أُزيل أو انتهى، أو أن الرابط غير صحيح. يمكنك تصفّح الدروس أو البحث.",
  });
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.statusCode = 405;
    res.end("Method Not Allowed");
    return;
  }

  const idParam = extractLessonIdParam(req);

  if (!idParam || idParam === "lessons" || idParam.includes("/")) {
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

  // بصمات kuwait-lessons-* → المعرّف الكانوني (301) حتى لا تبقى روابط يتيمة.
  const canonical = canonicalizeLessonPublicId(idParam);
  if (canonical && canonical !== idParam) {
    res.statusCode = 301;
    res.setHeader("Location", `/lessons/${encodeURIComponent(canonical)}`);
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
    // ممنوع fallback للصفحة الرئيسية — 503 HTML واضح حتى لا يُفسَر الخطأ كـ SPA.
    res.statusCode = 503;
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(buildNotFoundHtml({
      title: `تعذّر تحميل الدرس | ${SITE_NAME}`,
      description: "تعذّر تحميل بيانات الدرس مؤقتًا. أعد المحاولة أو تصفّح قائمة الدروس.",
      heading: "تعذّر تحميل الدرس",
      detail: "قد يكون المصدر غير متاح مؤقتًا. جرّب مجددًا بعد لحظات أو ارجع إلى فهرس الدروس.",
    }));
  }
}
