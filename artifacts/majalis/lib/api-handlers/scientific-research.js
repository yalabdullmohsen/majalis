import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin } from "../../lib/supabase-admin.mjs";
import { createRateLimiter } from "../../lib/rate-limit.mjs";
import { requireAdminAccess } from "../../lib/admin-auth.mjs";
import { slugifyTitle, checkDuplicateTitle, checkDuplicateHash } from "../../lib/scientific-research/upload.mjs";
import { enrichResearchPaper, findSimilarPapers } from "../../lib/scientific-research/ai-enrich.mjs";
import { validatePaperQuality } from "../../lib/scientific-research/quality.mjs";
import { RESEARCH_SEED_PAPERS } from "../../lib/scientific-research/seed-data.mjs";

const uploadRateLimit = createRateLimiter({ windowMs: 3600_000, max: 5, keyPrefix: "research-upload" });
const viewRateLimit = createRateLimiter({ windowMs: 60_000, max: 120, keyPrefix: "research-view" });

function ipHash(req) {
  const ip = req.headers["x-forwarded-for"]?.split(",")[0]?.trim() || req.socket?.remoteAddress || "unknown";
  return Buffer.from(ip).toString("base64url").slice(0, 16);
}

async function listPapers(req, res) {
  const q = req.query || {};
  const admin = getSupabaseAdmin();

  const sort = q.sort || "newest";
  const limit = Math.min(Number(q.limit) || 24, 100);
  const offset = Number(q.offset) || 0;

  if (admin) {
    let query = admin.from("research_papers").select("*", { count: "exact" }).eq("status", "published");

    if (q.category && q.category !== "latest" && q.category !== "all") {
      if (["phd", "masters", "bachelors"].includes(q.category)) query = query.eq("degree_type", q.category);
      else query = query.eq("category_slug", q.category);
    }
    if (q.degree && q.degree !== "all") query = query.eq("degree_type", q.degree);
    if (q.university) query = query.ilike("university", `%${q.university}%`);
    if (q.country) query = query.eq("country", q.country);
    if (q.year) query = query.eq("publication_year", Number(q.year));
    if (q.language) query = query.eq("language", q.language);

    const sortCol =
      sort === "views" ? "views_count" :
      sort === "downloads" ? "downloads_count" :
      sort === "rating" ? "rating_avg" :
      sort === "saves" ? "saves_count" : "published_at";

    const { data, count, error } = await query.order(sortCol, { ascending: false }).range(offset, offset + limit - 1);
    if (!error && data?.length) {
      sendJson(res, 200, { ok: true, papers: data, total: count, source: "database" });
      return;
    }
  }

  sendJson(res, 200, {
    ok: true,
    papers: RESEARCH_SEED_PAPERS.filter((p) => p.status === "published").slice(offset, offset + limit),
    total: RESEARCH_SEED_PAPERS.length,
    source: "seed",
  });
}

async function getPaper(req, res) {
  const slug = req.query?.slug || req.body?.slug;
  if (!slug) {
    sendJson(res, 400, { ok: false, error: "slug_required" });
    return;
  }

  const admin = getSupabaseAdmin();
  if (admin) {
    const { data } = await admin.from("research_papers").select("*").eq("slug", slug).maybeSingle();
    if (data) {
      const similar = findSimilarPapers(data, RESEARCH_SEED_PAPERS, 4);
      sendJson(res, 200, { ok: true, paper: data, similar, source: "database" });
      return;
    }
  }

  const seed = RESEARCH_SEED_PAPERS.find((p) => p.slug === slug);
  if (!seed) {
    sendJson(res, 404, { ok: false, error: "not_found" });
    return;
  }
  const similar = findSimilarPapers(seed, RESEARCH_SEED_PAPERS, 4);
  sendJson(res, 200, { ok: true, paper: seed, similar, source: "seed" });
}

async function recordView(req, res) {
  const ip = ipHash(req);
  if (!viewRateLimit(`view:${ip}`)) {
    sendJson(res, 429, { ok: false, error: "rate_limited" });
    return;
  }

  const paperId = req.body?.paper_id || req.query?.paper_id;
  const slug = req.body?.slug || req.query?.slug;
  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 200, { ok: true, skipped: true });
    return;
  }

  let id = paperId;
  if (!id && slug) {
    const { data } = await admin.from("research_papers").select("id, views_count").eq("slug", slug).maybeSingle();
    id = data?.id;
    if (data) {
      await admin.from("research_papers").update({ views_count: (data.views_count || 0) + 1, last_viewed_at: new Date().toISOString() }).eq("id", id);
    }
  }

  if (id) {
    await admin.from("research_views").insert({ paper_id: id, ip_hash: ip });
  }
  sendJson(res, 200, { ok: true });
}

async function recordDownload(req, res) {
  const paperId = req.body?.paper_id;
  const admin = getSupabaseAdmin();
  if (!admin || !paperId) {
    sendJson(res, 200, { ok: true, skipped: true });
    return;
  }

  const { data } = await admin.from("research_papers").select("downloads_count").eq("id", paperId).maybeSingle();
  if (data) {
    await admin.from("research_papers").update({ downloads_count: (data.downloads_count || 0) + 1 }).eq("id", paperId);
    await admin.from("research_downloads").insert({ paper_id: paperId, ip_hash: ipHash(req) });
  }
  sendJson(res, 200, { ok: true });
}

async function submitPaper(req, res) {
  const ip = ipHash(req);
  if (!uploadRateLimit(`upload:${ip}`)) {
    sendJson(res, 429, { ok: false, error: "upload_rate_limited" });
    return;
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    sendJson(res, 503, { ok: false, error: "database_unavailable" });
    return;
  }

  const payload = req.body || {};
  const quality = validatePaperQuality(payload);
  if (!quality.ok) {
    sendJson(res, 400, { ok: false, error: "validation_failed", issues: quality.issues });
    return;
  }

  if (await checkDuplicateTitle(admin, payload.title)) {
    sendJson(res, 409, { ok: false, error: "duplicate_title" });
    return;
  }

  const slug = slugifyTitle(payload.title);
  const enrich = await enrichResearchPaper(payload);

  const row = {
    slug,
    title: payload.title.trim(),
    author_name: payload.author_name.trim(),
    author_email: payload.author_email?.trim(),
    university: payload.university?.trim(),
    faculty: payload.faculty?.trim(),
    department: payload.department?.trim(),
    degree_type: payload.degree_type || "academic",
    supervisor_name: payload.supervisor_name?.trim(),
    defense_date: payload.defense_date || null,
    specialization: payload.specialization?.trim(),
    category_slug: payload.category_slug || enrich.ai_category,
    keywords: payload.keywords || enrich.ai_keywords,
    abstract_full: payload.abstract_full?.trim(),
    abstract_short: enrich.ai_summary_short,
    copyright_type: payload.copyright_type || "all_rights_reserved",
    copyright_terms: payload.copyright_terms,
    language: payload.language || "ar",
    country: payload.country || "الكويت",
    pdf_url: payload.pdf_url,
    cover_url: payload.cover_url || "/images/research/default-cover.svg",
    publication_year: payload.publication_year || new Date().getFullYear(),
    page_count: payload.page_count,
    ai_summary_short: enrich.ai_summary_short,
    ai_summary_medium: enrich.ai_summary_medium,
    ai_keywords: enrich.ai_keywords,
    ai_category: enrich.ai_category,
    ai_topics: enrich.ai_topics,
    status: "pending_review",
    canonical_url: `https://www.majlisilm.com/research/${slug}`,
  };

  const { data, error } = await admin.from("research_papers").insert(row).select("id, slug").single();
  if (error) {
    sendJson(res, 500, { ok: false, error: error.message });
    return;
  }

  sendJson(res, 201, { ok: true, paper: data, message: "تم استلام البحث وسيُراجع من الإدارة" });
}

async function adminAction(req, res) {
  const auth = await requireAdminAccess(req, res, sendJson, { permission: "content.edit" });
  if (!auth?.ok) return;

  const admin = getSupabaseAdmin();
  const action = req.query?.action || req.body?.action;

  if (action === "list_pending") {
    const { data } = await admin.from("research_papers").select("*").in("status", ["pending_review", "revision_requested"]).order("created_at", { ascending: false });
    sendJson(res, 200, { ok: true, papers: data || [] });
    return;
  }

  if (action === "review") {
    const { paper_id, new_status, notes } = req.body || {};
    const { data: prev } = await admin.from("research_papers").select("status").eq("id", paper_id).maybeSingle();
    await admin.from("research_papers").update({
      status: new_status,
      review_notes: notes,
      published_at: new_status === "published" ? new Date().toISOString() : null,
      updated_at: new Date().toISOString(),
    }).eq("id", paper_id);
    await admin.from("research_reviews").insert({
      paper_id,
      reviewer_id: auth.userId,
      action: new_status === "published" ? "approve" : new_status === "rejected" ? "reject" : "edit",
      notes,
      previous_status: prev?.status,
      new_status,
    });
    sendJson(res, 200, { ok: true });
    return;
  }

  if (action === "stats") {
    const { count: total } = await admin.from("research_papers").select("*", { count: "exact", head: true });
    const { count: published } = await admin.from("research_papers").select("*", { count: "exact", head: true }).eq("status", "published");
    const { count: pending } = await admin.from("research_papers").select("*", { count: "exact", head: true }).eq("status", "pending_review");
    sendJson(res, 200, { ok: true, stats: { total: total || 0, published: published || 0, pending: pending || 0 } });
    return;
  }

  sendJson(res, 400, { ok: false, error: "unknown_action" });
}

export default async function handler(req, res) {
  const action = req.query?.action || req.body?.action || "list";

  try {
    if (action === "list") return listPapers(req, res);
    if (action === "get") return getPaper(req, res);
    if (action === "view") return recordView(req, res);
    if (action === "download") return recordDownload(req, res);
    if (action === "submit") return submitPaper(req, res);
    if (action.startsWith("admin_") || ["list_pending", "review", "stats"].includes(action)) return adminAction(req, res);
    sendJson(res, 400, { ok: false, error: "unknown_action" });
  } catch (err) {
    sendJson(res, 500, { ok: false, error: err.message || "server_error" });
  }
}
