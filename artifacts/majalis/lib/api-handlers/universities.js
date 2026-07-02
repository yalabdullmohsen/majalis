/**
 * Universities Directory API — /api/universities/*
 *
 * GET  /api/universities              — قائمة مع فلاتر
 * GET  /api/universities/:slug        — تفاصيل جامعة
 * POST /api/universities/compare      — مقارنة (يقبل slugs[])
 * GET  /api/admin/universities        — قائمة للإدارة (كل + غير منشور)
 * POST /api/admin/universities        — إنشاء جامعة
 * PUT  /api/admin/universities/:id    — تعديل جامعة
 * POST /api/admin/universities/:id/programs    — إضافة برنامج
 * PUT  /api/admin/programs/:id                 — تعديل برنامج
 * DELETE /api/admin/programs/:id               — حذف برنامج
 * POST /api/admin/requirements/:programId      — حفظ شروط قبول
 * POST /api/admin/faqs/:universityId           — إضافة سؤال شائع
 * DELETE /api/admin/faqs/:id                   — حذف سؤال شائع
 * GET  /api/admin/reminders           — تذكيرات المراجعة
 * PUT  /api/admin/reminders/:id       — تحديث تذكير
 */

import { sendJson } from "../api/_http.mjs";
import { getSupabaseAdmin, isMissingTableError } from "../../lib/supabase-admin.mjs";

// ── مساعدات ───────────────────────────────────────────────────────────────

function ok(res, data)   { sendJson(res, 200, data); }
function bad(res, msg)   { sendJson(res, 400, { error: msg }); }
function notFound(res)   { sendJson(res, 404, { error: "not_found" }); }
function forbidden(res)  { sendJson(res, 403, { error: "forbidden" }); }
function serverErr(res, e){ sendJson(res, 500, { error: String(e?.message || e) }); }

function extractBearer(req) {
  const h = req.headers?.authorization || "";
  return h.startsWith("Bearer ") ? h.slice(7).trim() : null;
}

async function assertAdmin(req, admin) {
  const token = extractBearer(req);
  if (!token) return null;
  const { data: { user } } = await admin.auth.getUser(token).catch(() => ({ data: { user: null } }));
  if (!user) return null;

  const { data: profile } = await admin
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single()
    .catch(() => ({ data: null }));

  return profile?.is_admin ? user : null;
}

function safeBody(req) {
  return req.body && typeof req.body === "object" ? req.body : {};
}

// ── قراءة الفلاتر ─────────────────────────────────────────────────────────

function buildUniversitiesQuery(admin, q) {
  const {
    country, degree_level, study_mode, has_scholarship,
    study_language, is_verified, search, limit = 50, offset = 0,
  } = q || {};

  let query = admin
    .from("universities")
    .select(`
      id, slug, name_ar, name_en, country, city, logo_url, about,
      website_url, accreditation_status, is_verified, last_updated_at,
      university_programs (
        id, program_name, faculty_department, specialization,
        degree_level, study_language, study_mode, tuition_fees,
        currency, has_scholarship, is_active
      )
    `)
    .eq("is_published", true)
    .order("name_ar", { ascending: true })
    .range(Number(offset), Number(offset) + Number(limit) - 1);

  if (country)        query = query.eq("country", country);
  if (is_verified)    query = query.eq("is_verified", is_verified === "true" || is_verified === true);
  if (search)         query = query.textSearch("ts_search", search, { type: "plain", config: "simple" });

  return query;
}

// ── Handlers ──────────────────────────────────────────────────────────────

async function handleList(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  try {
    const { data, error, count } = await buildUniversitiesQuery(admin, req.query);
    if (error) {
      if (isMissingTableError(error)) return ok(res, { items: [], total: 0, seed_needed: true });
      return serverErr(res, error);
    }

    // فلترة برامج بعد الجلب (لأن Supabase لا يدعم nested filtering مع range)
    const { degree_level, study_mode, has_scholarship, study_language } = req.query || {};

    let items = (data || []).map((u) => {
      let programs = (u.university_programs || []).filter((p) => p.is_active);
      if (degree_level)    programs = programs.filter((p) => p.degree_level === degree_level);
      if (study_mode)      programs = programs.filter((p) => p.study_mode === study_mode);
      if (study_language)  programs = programs.filter((p) => p.study_language === study_language);
      if (has_scholarship === "true") programs = programs.filter((p) => p.has_scholarship);
      return { ...u, university_programs: programs };
    });

    // استبعاد الجامعات التي لا تملك برامج مطابقة عند تصفية البرامج
    if (degree_level || study_mode || study_language || has_scholarship === "true") {
      items = items.filter((u) => u.university_programs.length > 0);
    }

    ok(res, { items, total: count || items.length });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleDetail(req, res, slug) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  try {
    const { data, error } = await admin
      .from("universities")
      .select(`
        *,
        university_programs (
          *,
          admission_requirements (*)
        ),
        university_faqs (id, question, answer, order_index)
      `)
      .eq("slug", slug)
      .eq("is_published", true)
      .single();

    if (error || !data) return notFound(res);

    // ترتيب الأسئلة الشائعة
    if (data.university_faqs) {
      data.university_faqs.sort((a, b) => a.order_index - b.order_index);
    }

    ok(res, { university: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleCompare(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const { slugs } = safeBody(req);
  if (!Array.isArray(slugs) || slugs.length < 2 || slugs.length > 4) {
    return bad(res, "slugs must be array of 2-4 items");
  }

  try {
    const { data, error } = await admin
      .from("universities")
      .select(`
        *,
        university_programs (
          *,
          admission_requirements (*)
        )
      `)
      .in("slug", slugs)
      .eq("is_published", true);

    if (error) return serverErr(res, error);
    ok(res, { universities: data || [] });
  } catch (e) {
    serverErr(res, e);
  }
}

// ── Admin handlers ─────────────────────────────────────────────────────────

async function handleAdminList(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  try {
    const { data, error } = await admin
      .from("universities")
      .select(`*, university_programs(id, program_name, degree_level, is_active)`)
      .order("name_ar", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return ok(res, { items: [], seed_needed: true });
      return serverErr(res, error);
    }
    ok(res, { items: data || [] });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminCreate(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const body = safeBody(req);
  const {
    slug, name_ar, name_en, country, city, logo_url = "", about = "",
    website_url = "", social_links = {}, accreditation_status = "unknown",
    is_verified = false, is_published = true,
  } = body;

  if (!slug || !name_ar || !country) return bad(res, "slug, name_ar, country required");

  try {
    const { data, error } = await admin
      .from("universities")
      .insert({
        slug, name_ar, name_en, country, city, logo_url, about,
        website_url, social_links, accreditation_status, is_verified, is_published,
        last_reviewed_by: adminUser.email || adminUser.id,
        last_updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { university: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminUpdate(req, res, id) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const body = safeBody(req);
  const updates = {
    ...body,
    last_reviewed_by: adminUser.email || adminUser.id,
    last_updated_at:  new Date().toISOString(),
  };
  delete updates.id;
  delete updates.created_at;

  try {
    const { data, error } = await admin
      .from("universities")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { university: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminAddProgram(req, res, universityId) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const body = safeBody(req);
  const {
    program_name, faculty_department = "", specialization = "",
    degree_level, study_language = "العربية", study_mode = "حضوري",
    duration = "", tuition_fees = null, currency = "SAR",
    has_scholarship = false, scholarship_details = "",
  } = body;

  if (!program_name || !degree_level) return bad(res, "program_name, degree_level required");

  try {
    const { data, error } = await admin
      .from("university_programs")
      .insert({
        university_id: universityId, program_name, faculty_department,
        specialization, degree_level, study_language, study_mode,
        duration, tuition_fees, currency, has_scholarship, scholarship_details,
      })
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { program: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminUpdateProgram(req, res, id) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const body = safeBody(req);
  const updates = { ...body };
  delete updates.id;
  delete updates.university_id;
  delete updates.created_at;

  try {
    const { data, error } = await admin
      .from("university_programs")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { program: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminDeleteProgram(req, res, id) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  try {
    const { error } = await admin.from("university_programs").delete().eq("id", id);
    if (error) return serverErr(res, error);
    ok(res, { deleted: true });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminSaveRequirements(req, res, programId) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const {
    requirements = [], required_documents = [],
    application_steps = [], application_deadline = "",
    application_url = "", notes = "",
  } = safeBody(req);

  try {
    const { data, error } = await admin
      .from("admission_requirements")
      .upsert({
        program_id: programId,
        requirements, required_documents, application_steps,
        application_deadline, application_url, notes,
        updated_at: new Date().toISOString(),
      }, { onConflict: "program_id" })
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { requirements: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminAddFaq(req, res, universityId) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const { question, answer, order_index = 0 } = safeBody(req);
  if (!question || !answer) return bad(res, "question, answer required");

  try {
    const { data, error } = await admin
      .from("university_faqs")
      .insert({ university_id: universityId, question, answer, order_index })
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { faq: data });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminDeleteFaq(req, res, id) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  try {
    const { error } = await admin.from("university_faqs").delete().eq("id", id);
    if (error) return serverErr(res, error);
    ok(res, { deleted: true });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminReminders(req, res) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  try {
    const { data, error } = await admin
      .from("review_reminders")
      .select(`
        *,
        universities(id, slug, name_ar, name_en, website_url),
        university_programs(id, program_name, degree_level)
      `)
      .eq("status", "pending")
      .order("due_date", { ascending: true });

    if (error) {
      if (isMissingTableError(error)) return ok(res, { reminders: [] });
      return serverErr(res, error);
    }
    ok(res, { reminders: data || [] });
  } catch (e) {
    serverErr(res, e);
  }
}

async function handleAdminUpdateReminder(req, res, id) {
  const admin = getSupabaseAdmin();
  if (!admin) return serverErr(res, "no supabase admin");

  const adminUser = await assertAdmin(req, admin);
  if (!adminUser) return forbidden(res);

  const { status, notes } = safeBody(req);
  if (!status) return bad(res, "status required");

  try {
    const { data, error } = await admin
      .from("review_reminders")
      .update({
        status,
        notes: notes || "",
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.email || adminUser.id,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return serverErr(res, error);
    ok(res, { reminder: data });
  } catch (e) {
    serverErr(res, e);
  }
}

// ── Router ────────────────────────────────────────────────────────────────

export default async function universitiesHandler(req, res, action) {
  const method = req.method?.toUpperCase() || "GET";

  switch (action) {
    case "list":          return handleList(req, res);
    case "detail":        return handleDetail(req, res, req.params?.slug || req.query?.slug);
    case "compare":       return handleCompare(req, res);
    case "admin-list":    return handleAdminList(req, res);
    case "admin-create":  return handleAdminCreate(req, res);
    case "admin-update":  return handleAdminUpdate(req, res, req.params?.id);
    case "admin-program-add":    return handleAdminAddProgram(req, res, req.params?.universityId);
    case "admin-program-update": return handleAdminUpdateProgram(req, res, req.params?.id);
    case "admin-program-delete": return handleAdminDeleteProgram(req, res, req.params?.id);
    case "admin-requirements":   return handleAdminSaveRequirements(req, res, req.params?.programId);
    case "admin-faq-add":    return handleAdminAddFaq(req, res, req.params?.universityId);
    case "admin-faq-delete": return handleAdminDeleteFaq(req, res, req.params?.id);
    case "admin-reminders":  return handleAdminReminders(req, res);
    case "admin-reminder-update": return handleAdminUpdateReminder(req, res, req.params?.id);
    default:
      sendJson(res, 404, { error: "unknown action" });
  }
}
