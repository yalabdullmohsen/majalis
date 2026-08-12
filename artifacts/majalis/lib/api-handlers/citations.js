/**
 * Citations API — /api/citations/*  و  /api/user/citations/*
 *
 * POST /api/citations/create               — إنشاء اقتباس جديد
 * GET  /api/citations/format               — توليد نص التوثيق الأكاديمي ?id=&style=
 * GET  /api/citations/:slug                — اقتباس عبر الرابط المباشر
 * GET  /api/citations/:slug/qrcode         — QR Code كصورة PNG (data URL)
 * GET  /api/citations/:slug/image          — بطاقة اقتباس SVG
 * POST /api/citations/:id/save             — حفظ في مكتبة المستخدم (يتطلب مصادقة)
 * GET  /api/user/citations                 — مكتبة اقتباسات المستخدم ?folder=&search=&favorite=
 * POST /api/user/citations/folders         — إنشاء مجلد
 * POST /api/user/citations/export          — تصدير ?format=markdown|pdf
 */

import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { createClient } from "@supabase/supabase-js";
import QRCode from "qrcode";

// ── ثوابت ────────────────────────────────────────────────────────────────────

const MAX_QUOTE_LENGTH = 500;
const PLATFORM_URL = "https://www.majlisilm.com";

const VALID_STYLES = new Set(["default", "apa", "mla", "chicago", "turabian"]);
const ACADEMIC_TYPES = new Set(["article", "research"]);

// ── مساعدات ──────────────────────────────────────────────────────────────────

function isMissingTable(err) {
  if (!err) return false;
  const msg = String(err.message || "").toLowerCase();
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    msg.includes("does not exist") ||
    msg.includes("could not find")
  );
}

/** استخراج جزء من مسار URL بعد مقطع معين */
function pathPart(pathname, after) {
  const parts = pathname.split("/").filter(Boolean);
  const idx = parts.indexOf(after);
  return idx !== -1 && idx + 1 < parts.length ? parts[idx + 1] : null;
}

/** توليد slug عشوائي فريد (8 أحرف) */
function randomSlug() {
  const chars = "abcdefghijkmnpqrstuvwxyz23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

/** استخراج JWT من Authorization header */
function extractBearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

/** إنشاء supabase client للمستخدم باستخدام JWT */
function userClient(token) {
  const url = process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const anon = process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  return createClient(url, anon, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** التحقق من هوية المستخدم عبر JWT */
async function requireUser(req) {
  const token = extractBearer(req);
  if (!token) return { user: null, client: null, error: "مطلوب تسجيل الدخول" };
  const client = userClient(token);
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) return { user: null, client: null, error: "جلسة غير صالحة" };
  return { user, client, error: null };
}

// ── توليد نص التوثيق الأكاديمي ──────────────────────────────────────────────

function formatCitationText(source, style = "default") {
  const { title_ar, author_name, book_name, volume, page_number, publish_year, publisher } = source;
  if (style === "default" || !ACADEMIC_TYPES.has(source.content_type)) {
    const parts = [
      author_name && `${author_name}،`,
      title_ar,
      book_name && `في: ${book_name}`,
      volume && `ج${volume}`,
      page_number && `ص${page_number}`,
    ].filter(Boolean);
    return parts.join(" ");
  }
  const year = publish_year ? `(${publish_year})` : "";
  if (style === "apa") {
    return `${author_name || ""} ${year}. ${title_ar}. ${publisher || ""}${page_number ? `: ص${page_number}` : ""}`.trim();
  }
  if (style === "mla") {
    return `${author_name || ""}. "${title_ar}." ${book_name || ""}${volume ? `، ج${volume}` : ""}${page_number ? `، ص${page_number}` : ""}. ${publish_year || ""}`.trim();
  }
  if (style === "chicago") {
    return `${author_name || ""}. ${title_ar}. ${publisher || ""}${publish_year ? `، ${publish_year}` : ""}${page_number ? `، ص${page_number}` : ""}`.trim();
  }
  if (style === "turabian") {
    return `${author_name || ""}. "${title_ar}"${book_name ? `. ${book_name}` : ""}${publish_year ? ` (${publish_year})` : ""}${page_number ? `: ${page_number}` : ""}`.trim();
  }
  return title_ar;
}

// ── توليد بطاقة SVG ──────────────────────────────────────────────────────────

function buildCitationSvg(citation, source, isDark = false) {
  const bg = isDark ? "#1a1a2e" : "#fffdf7";
  const textColor = isDark ? "#f0e6d3" : "#1a1205";
  const mutedColor = isDark ? "#9ca3af" : "#6b7280";
  const accentColor = "#065f46";
  const borderColor = isDark ? "#374151" : "#d4b896";

  const quote = (citation.quoted_text || "").slice(0, 200);
  const sourceRef = formatCitationText(source);
  const platformLink = `${PLATFORM_URL}/c/${citation.deep_link_slug}`;

  // تقسيم النص للعرض داخل SVG
  const words = quote.split(" ");
  const lines = [];
  let current = "";
  for (const w of words) {
    if ((current + " " + w).length > 40) {
      if (current) lines.push(current);
      current = w;
    } else {
      current = current ? current + " " + w : w;
    }
  }
  if (current) lines.push(current);
  const quoteLines = lines.slice(0, 6);

  const lineHeight = 32;
  const quoteBlockH = quoteLines.length * lineHeight + 16;
  const totalH = quoteBlockH + 140;
  const W = 600;

  const quoteTextEls = quoteLines
    .map((line, i) => `<text x="300" y="${80 + i * lineHeight}" text-anchor="middle" font-size="18" fill="${textColor}" font-family="'Times New Roman', Times, serif">${escSvg(line)}</text>`)
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${totalH}" viewBox="0 0 ${W} ${totalH}" direction="rtl">
  <rect width="${W}" height="${totalH}" fill="${bg}" rx="16"/>
  <rect x="12" y="12" width="${W - 24}" height="${totalH - 24}" fill="none" stroke="${borderColor}" stroke-width="1.5" rx="12"/>
  <!-- شعار مجالس -->
  <text x="300" y="40" text-anchor="middle" font-size="15" fill="${accentColor}" font-family="'Times New Roman', Times, serif" font-weight="bold">مجالس — منصة العلم الشرعي</text>
  <!-- خط فاصل -->
  <line x1="80" y1="52" x2="${W - 80}" y2="52" stroke="${accentColor}" stroke-width="1" opacity="0.4"/>
  <!-- علامة الاقتباس -->
  <text x="530" y="88" font-size="52" fill="${accentColor}" opacity="0.18" font-family="'Times New Roman', Times, serif">&ldquo;</text>
  <!-- نص الاقتباس -->
  ${quoteTextEls}
  <!-- خط فاصل -->
  <line x1="80" y1="${quoteBlockH + 68}" x2="${W - 80}" y2="${quoteBlockH + 68}" stroke="${borderColor}" stroke-width="1"/>
  <!-- المصدر -->
  <text x="300" y="${quoteBlockH + 90}" text-anchor="middle" font-size="13" fill="${accentColor}" font-family="'Times New Roman', Times, serif" font-weight="bold">${escSvg(source.title_ar || "")}</text>
  <text x="300" y="${quoteBlockH + 112}" text-anchor="middle" font-size="11" fill="${mutedColor}" font-family="'Times New Roman', Times, serif">${escSvg(sourceRef)}</text>
  <!-- الرابط -->
  <text x="300" y="${quoteBlockH + 132}" text-anchor="middle" font-size="10" fill="${mutedColor}" font-family="monospace">${escSvg(platformLink)}</text>
</svg>`;
}

function escSvg(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// ── توليد نص التصدير Markdown ─────────────────────────────────────────────

function buildMarkdown(saved, citations) {
  const lines = [
    "# اقتباساتي المحفوظة — مجالس\n",
    `_تاريخ التصدير: ${new Date().toLocaleDateString("ar-SA")}_\n`,
    "---\n",
  ];
  for (const item of saved) {
    const cit = citations.find((c) => c.id === item.citation_id);
    if (!cit) continue;
    const src = cit.source;
    lines.push(`## ${src?.title_ar || "اقتباس"}`);
    lines.push(`\n> ${item.citation?.quoted_text || ""}\n`);
    if (src) {
      lines.push(`**المصدر:** ${formatCitationText(src)}`);
      if (src.source_url) lines.push(`**الرابط:** ${src.source_url}`);
    }
    lines.push(`**رابط الاقتباس:** ${PLATFORM_URL}/c/${cit.deep_link_slug}`);
    if (item.personal_note) lines.push(`**ملاحظتي:** ${item.personal_note}`);
    lines.push("\n---\n");
  }
  return lines.join("\n");
}

// ── معالجات الـ API ───────────────────────────────────────────────────────────

async function createCitation(req, res) {
  let body = req.body;
  if (!body) {
    let raw = "";
    await new Promise((resolve) => {
      req.on("data", (c) => { raw += c; });
      req.on("end", resolve);
    });
    try { body = JSON.parse(raw); } catch { body = {}; }
  }

  const { source_id, quoted_text, text_start_offset, text_end_offset, citation_style } = body || {};

  if (!source_id || !quoted_text) {
    return sendJson(res, 400, { ok: false, error: "source_id وquoted_text مطلوبان" });
  }
  if (quoted_text.length > MAX_QUOTE_LENGTH) {
    return sendJson(res, 400, { ok: false, error: `النص المقتبس يجب ألا يتجاوز ${MAX_QUOTE_LENGTH} حرفًا` });
  }
  if (citation_style && !VALID_STYLES.has(citation_style)) {
    return sendJson(res, 400, { ok: false, error: "أسلوب توثيق غير صالح" });
  }

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  // التحقق من is_approved
  const { data: src, error: srcErr } = await admin
    .from("citation_sources")
    .select("id, is_approved, content_type")
    .eq("id", source_id)
    .maybeSingle();

  if (srcErr || !src) {
    if (isMissingTable(srcErr)) return sendJson(res, 503, { ok: false, error: "الجداول غير مهيأة بعد" });
    return sendJson(res, 404, { ok: false, error: "مصدر التوثيق غير موجود" });
  }
  if (!src.is_approved) {
    return sendJson(res, 403, { ok: false, error: "لا يمكن الاقتباس من محتوى قيد المراجعة — يجب أن يكون المصدر معتمدًا أولًا" });
  }

  // استخراج المستخدم (اختياري)
  let userId = null;
  const token = extractBearer(req);
  if (token) {
    const uc = userClient(token);
    const { data: { user } } = await uc.auth.getUser().catch(() => ({ data: { user: null } }));
    userId = user?.id || null;
  }

  // توليد slug فريد
  let slug = randomSlug();
  for (let i = 0; i < 10; i++) {
    const { data: existing } = await admin.from("citations").select("id").eq("deep_link_slug", slug).maybeSingle();
    if (!existing) break;
    slug = randomSlug();
  }

  const { data: cit, error: citErr } = await admin
    .from("citations")
    .insert({
      source_id,
      quoted_text: quoted_text.trim(),
      text_start_offset: text_start_offset ?? null,
      text_end_offset: text_end_offset ?? null,
      deep_link_slug: slug,
      citation_style: citation_style || null,
      created_by_user_id: userId,
    })
    .select()
    .single();

  if (citErr) return sendJson(res, 500, { ok: false, error: citErr.message });

  return sendJson(res, 201, {
    ok: true,
    citation: cit,
    share_url: `${PLATFORM_URL}/c/${slug}`,
  });
}

async function getCitationBySlug(req, res, slug) {
  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const { data, error } = await admin
    .from("citations")
    .select(`
      id, quoted_text, text_start_offset, text_end_offset, deep_link_slug,
      citation_style, created_at,
      source:source_id (
        id, content_type, title_ar, author_name, book_name, volume,
        page_number, publisher, publish_year, source_url, reference_id
      )
    `)
    .eq("deep_link_slug", slug)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) return sendJson(res, 503, { ok: false, error: "الجداول غير مهيأة" });
    return sendJson(res, 500, { ok: false, error: error.message });
  }
  if (!data) return sendJson(res, 404, { ok: false, error: "الاقتباس غير موجود" });

  return sendJson(res, 200, { ok: true, citation: data });
}

async function getQrCode(req, res, slug) {
  const url = `${PLATFORM_URL}/c/${slug}`;
  try {
    const dataUrl = await QRCode.toDataURL(url, {
      width: 256,
      margin: 2,
      color: { dark: "#065f46", light: "#fffdf7" },
    });
    const base64 = dataUrl.replace(/^data:image\/png;base64,/, "");
    const buf = Buffer.from(base64, "base64");
    res.setHeader("Content-Type", "image/png");
    res.setHeader("Cache-Control", "public, max-age=86400");
    res.end(buf);
  } catch {
    return sendJson(res, 500, { ok: false, error: "فشل توليد QR Code" });
  }
}

async function getCitationImage(req, res, slug) {
  const isDark = req.query?.dark === "1";
  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const { data, error } = await admin
    .from("citations")
    .select(`
      id, quoted_text, deep_link_slug,
      source:source_id (title_ar, author_name, book_name, volume, page_number, content_type, source_url)
    `)
    .eq("deep_link_slug", slug)
    .maybeSingle();

  if (error || !data) return sendJson(res, 404, { ok: false, error: "الاقتباس غير موجود" });

  const svg = buildCitationSvg(data, data.source || {}, isDark);
  res.setHeader("Content-Type", "image/svg+xml; charset=utf-8");
  res.setHeader("Cache-Control", "public, max-age=3600");
  res.end(svg);
}

async function saveCitation(req, res, citationId) {
  const { user, client, error: authErr } = await requireUser(req);
  if (authErr) return sendJson(res, 401, { ok: false, error: authErr });

  let body = req.body || {};
  if (!body.citation_id && !citationId) {
    return sendJson(res, 400, { ok: false, error: "citation_id مطلوب" });
  }
  const cid = citationId || body.citation_id;
  const { folder_id = null, personal_note = null } = body;

  // التحقق من أن الاقتباس موجود
  const admin = getSupabaseAdmin();
  const { data: cit } = await admin.from("citations").select("id").eq("id", cid).maybeSingle();
  if (!cit) return sendJson(res, 404, { ok: false, error: "الاقتباس غير موجود" });

  const { data, error } = await client
    .from("user_saved_citations")
    .upsert(
      { user_id: user.id, citation_id: cid, folder_id, personal_note },
      { onConflict: "user_id,citation_id", ignoreDuplicates: false }
    )
    .select()
    .single();

  if (error) return sendJson(res, 500, { ok: false, error: error.message });

  // زيادة عداد الاستخدام
  await client
    .from("user_saved_citations")
    .update({ usage_count: (data.usage_count || 0) + 1 })
    .eq("id", data.id);

  return sendJson(res, 200, { ok: true, saved: data });
}

async function getUserCitations(req, res) {
  const { user, client, error: authErr } = await requireUser(req);
  if (authErr) return sendJson(res, 401, { ok: false, error: authErr });

  const q = req.query || {};
  const folder = q.folder || null;
  const search = q.search || null;
  const favorite = q.favorite === "true";
  const sortBy = q.sort || "saved_at";

  let query = client
    .from("user_saved_citations")
    .select(`
      id, folder_id, personal_note, is_favorite, usage_count, saved_at,
      citation:citation_id (
        id, quoted_text, deep_link_slug, created_at,
        source:source_id (id, content_type, title_ar, author_name, book_name, volume, page_number, source_url)
      )
    `)
    .eq("user_id", user.id);

  if (folder) query = query.eq("folder_id", folder);
  if (favorite) query = query.eq("is_favorite", true);
  if (search) query = query.ilike("personal_note", `%${search}%`);

  const orderMap = {
    saved_at: "saved_at",
    usage_count: "usage_count",
    is_favorite: "is_favorite",
  };
  const orderCol = orderMap[sortBy] || "saved_at";
  query = query.order(orderCol, { ascending: false }).limit(100);

  const { data, error } = await query;
  if (error) return sendJson(res, 500, { ok: false, error: error.message });

  // جلب المجلدات
  const { data: folders } = await client
    .from("citation_folders")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: true });

  return sendJson(res, 200, { ok: true, saved: data || [], folders: folders || [] });
}

async function createFolder(req, res) {
  const { user, client, error: authErr } = await requireUser(req);
  if (authErr) return sendJson(res, 401, { ok: false, error: authErr });

  const { folder_name, color = "#065f46" } = req.body || {};
  if (!folder_name?.trim()) return sendJson(res, 400, { ok: false, error: "اسم المجلد مطلوب" });

  const { data, error } = await client
    .from("citation_folders")
    .insert({ user_id: user.id, folder_name: folder_name.trim(), color })
    .select()
    .single();

  if (error) return sendJson(res, 500, { ok: false, error: error.message });
  return sendJson(res, 201, { ok: true, folder: data });
}

async function exportCitations(req, res) {
  const { user, client, error: authErr } = await requireUser(req);
  if (authErr) return sendJson(res, 401, { ok: false, error: authErr });

  const format = req.query?.format || "markdown";
  const { ids } = req.body || {};

  let query = client
    .from("user_saved_citations")
    .select(`
      id, personal_note, citation_id,
      citation:citation_id (
        id, quoted_text, deep_link_slug,
        source:source_id (title_ar, author_name, book_name, volume, page_number, content_type, source_url)
      )
    `)
    .eq("user_id", user.id);

  if (ids?.length) query = query.in("citation_id", ids);

  const { data: saved, error } = await query.order("saved_at", { ascending: false });
  if (error) return sendJson(res, 500, { ok: false, error: error.message });

  if (format === "markdown") {
    const md = buildMarkdown(saved || [], (saved || []).map((s) => s.citation).filter(Boolean));
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="citations.md"');
    res.end(md);
    return;
  }

  // JSON للطباعة/PDF من جانب العميل
  return sendJson(res, 200, { ok: true, format, saved: saved || [] });
}

async function formatCitation(req, res) {
  const q = req.query || {};
  const { id, style = "default" } = q;
  if (!id) return sendJson(res, 400, { ok: false, error: "id مطلوب" });
  if (!VALID_STYLES.has(style)) return sendJson(res, 400, { ok: false, error: "أسلوب توثيق غير صالح" });

  const admin = getSupabaseAdmin();
  if (!admin) return sendJson(res, 503, { ok: false, error: "الخدمة غير متاحة" });

  const { data: src, error } = await admin
    .from("citation_sources")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error || !src) return sendJson(res, 404, { ok: false, error: "المصدر غير موجود" });

  if (!ACADEMIC_TYPES.has(src.content_type) && style !== "default") {
    return sendJson(res, 400, { ok: false, error: "أسلوب التوثيق الأكاديمي متاح فقط لأنواع article وresearch" });
  }

  return sendJson(res, 200, {
    ok: true,
    formatted: formatCitationText(src, style),
    style,
  });
}

// ── المُوزِّع الرئيسي ─────────────────────────────────────────────────────────

export default async function citationsHandler(req, res) {
  const method = req.method || "GET";
  const url = new URL(req.url || "/", `http://localhost`);
  const pathname = url.pathname;
  req.query = Object.fromEntries(url.searchParams.entries());

  // POST /api/citations/create
  if (method === "POST" && pathname.endsWith("/citations/create")) {
    return createCitation(req, res);
  }

  // GET /api/citations/format
  if (method === "GET" && pathname.endsWith("/citations/format")) {
    return formatCitation(req, res);
  }

  // GET /api/user/citations
  if (method === "GET" && pathname.includes("/user/citations") && !pathname.includes("/user/citations/")) {
    return getUserCitations(req, res);
  }

  // POST /api/user/citations/folders
  if (method === "POST" && pathname.endsWith("/user/citations/folders")) {
    return createFolder(req, res);
  }

  // POST /api/user/citations/export
  if (method === "POST" && pathname.endsWith("/user/citations/export")) {
    return exportCitations(req, res);
  }

  // روابط الـ slug
  const citParts = pathname.split("/").filter(Boolean);
  const citIdx = citParts.indexOf("citations");
  if (citIdx !== -1 && citParts[citIdx + 1]) {
    const slug = citParts[citIdx + 1];
    const sub = citParts[citIdx + 2];

    // GET /api/citations/:slug/qrcode
    if (method === "GET" && sub === "qrcode") {
      return getQrCode(req, res, slug);
    }

    // GET /api/citations/:slug/image
    if (method === "GET" && sub === "image") {
      return getCitationImage(req, res, slug);
    }

    // POST /api/citations/:id/save
    if (method === "POST" && sub === "save") {
      return saveCitation(req, res, slug);
    }

    // GET /api/citations/:slug
    if (method === "GET" && !sub) {
      return getCitationBySlug(req, res, slug);
    }
  }

  return sendJson(res, 404, { ok: false, error: "المسار غير موجود" });
}
