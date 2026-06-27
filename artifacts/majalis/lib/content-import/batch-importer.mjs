import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { dedupeKeyForRow } from "./dedupe.mjs";
import { recordInsertedRows } from "./job-store.mjs";

const BATCH_DELAY_MS = 50;

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function withRetry(fn, retries = 3) {
  let lastErr;
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      const msg = String(err.message || err);
      if (!/fetch|network|timeout|ECONNRESET|503|502/i.test(msg) || i === retries - 1) throw err;
      await sleep(300 * (i + 1));
    }
  }
  throw lastErr;
}

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function slugifyCategory(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w\u0600-\u06FF-]+/g, "")
    .slice(0, 80) || "general";
}

async function ensureQaCategory(admin, name, catByName) {
  const key = normalizeName(name);
  if (!key) return null;
  if (catByName.has(key)) return catByName.get(key);

  const { data: created, error } = await admin
    .from("qa_categories")
    .insert({ name: String(name).trim(), slug: slugifyCategory(name) })
    .select("id")
    .single();

  if (error) {
    const { data: existing } = await admin
      .from("qa_categories")
      .select("id, name")
      .ilike("name", String(name).trim())
      .maybeSingle();
    if (existing?.id) {
      catByName.set(key, existing.id);
      return existing.id;
    }
    throw error;
  }
  catByName.set(key, created.id);
  return created.id;
}

const TABLE_BY_TYPE = {
  lessons: "lessons",
  courses: "lessons",
  sheikhs: "sheikhs",
  books: "library_items",
  articles: "library_items",
  questions: "qa_questions",
  benefits: "fawaid",
  adhkar: "platform_adhkar_items",
  quran_surahs: "platform_quran_surahs",
  quran_topics: "platform_quran_topics",
  rulings: "sharia_rulings",
  categories: "qa_categories",
};

export async function importBatchToSupabase(type, payloads, opts = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    if (opts.dryRun) return { ok: true, imported: payloads.length, skipped: 0, failed: 0, errors: [] };
    throw new Error("supabase_admin_missing");
  }

  switch (type) {
    case "sheikhs":
      return importSheikhs(admin, payloads, opts);
    case "lessons":
    case "courses":
      return importLessons(admin, payloads, opts);
    case "books":
    case "articles":
      return importLibrary(admin, payloads, opts);
    case "questions":
      return importQuestions(admin, payloads, opts);
    case "benefits":
      return importBenefits(admin, payloads, opts);
    case "adhkar":
      return importAdhkar(admin, payloads, opts);
    case "quran_surahs":
      return importQuranSurahs(admin, payloads, opts);
    case "quran_topics":
      return importQuranTopics(admin, payloads, opts);
    case "rulings":
      return importRulings(admin, payloads, opts);
    case "categories":
      return importCategories(admin, payloads, opts);
    default:
      return { ok: false, imported: 0, skipped: 0, failed: payloads.length, errors: [`Unsupported type: ${type}`] };
  }
}

async function trackInserts(jobId, tableName, entries) {
  if (!jobId || !entries.length) return;
  await recordInsertedRows(
    jobId,
    entries.map((e) => ({ jobId, rowIndex: e.i, tableName, recordId: e.id, dedupeKey: e.key })),
  );
}

async function importSheikhs(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.sheikhs;
  const { data: existing } = await withRetry(() => admin.from("sheikhs").select("id, name"));
  const byName = new Map((existing || []).map((s) => [normalizeName(s.name), s]));

  const inserted = [];
  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const key = normalizeName(row.name);
    if (byName.has(key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from("sheikhs").insert(row).select("id").single());
      if (error) throw error;
      report.imported++;
      byName.set(key, { id: data.id, name: row.name });
      inserted.push({ i, id: data.id, key: dedupeKeyForRow("sheikhs", row) });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importLessons(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.lessons;
  const [{ data: lessons }, { data: sheikhs }] = await Promise.all([
    withRetry(() => admin.from("lessons").select("id, external_key, title, speaker_name, mosque, day_of_week, lesson_time")),
    withRetry(() => admin.from("sheikhs").select("id, name")),
  ]);

  const byKey = new Set();
  for (const l of lessons || []) {
    byKey.add(dedupeKeyForRow("lessons", l));
  }
  const sheikhByName = new Map((sheikhs || []).map((s) => [normalizeName(s.name), s.id]));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const { sheikh_name, ...rest } = raw;
    const payload = { ...rest };
    delete payload.sheikh_name;
    const sheikhName = raw.speaker_name || sheikh_name;
    if (sheikhName) {
      const id = sheikhByName.get(normalizeName(sheikhName));
      if (id) payload.sheikh_id = id;
      payload.speaker_name = sheikhName;
    }
    const dedupe = dedupeKeyForRow("lessons", { ...payload, speaker_name: sheikhName });
    if (byKey.has(dedupe)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      byKey.add(dedupe);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from("lessons").insert(payload).select("id").single());
      if (error) throw error;
      report.imported++;
      byKey.add(dedupe);
      inserted.push({ i, id: data.id, key: dedupe });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importLibrary(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.books;
  const { data: existing } = await withRetry(() => admin.from("library_items").select("id, title, external_url"));
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("books", r)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const key = dedupeKeyForRow("books", row);
    if (seen.has(key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      seen.add(key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from("library_items").insert(row).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(key);
      inserted.push({ i, id: data.id, key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importQuestions(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.questions;
  const [{ data: questions }, { data: categories }] = await Promise.all([
    withRetry(() => admin.from("qa_questions").select("id, question")),
    withRetry(() => admin.from("qa_categories").select("id, name")),
  ]);
  const seen = new Set((questions || []).map((q) => dedupeKeyForRow("questions", q)));
  const catByName = new Map((categories || []).map((c) => [normalizeName(c.name), c.id]));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const { category_name, confidence: _c, ...rest } = raw;
    const payload = { ...rest };
    if (category_name) payload.category_id = await ensureQaCategory(admin, category_name, catByName);
    const key = dedupeKeyForRow("questions", payload);
    if (seen.has(key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      seen.add(key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from("qa_questions").insert(payload).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(key);
      inserted.push({ i, id: data.id, key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importBenefits(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.benefits;
  const { data: existing } = await withRetry(() => admin.from("fawaid").select("id, text"));
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("benefits", r)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const key = dedupeKeyForRow("benefits", row);
    if (seen.has(key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      seen.add(key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from("fawaid").insert(row).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(key);
      inserted.push({ i, id: data.id, key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importAdhkar(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.adhkar;
  const { data: existing } = await withRetry(() => admin.from(table).select("id, text, category_id"));
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("adhkar", r)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const payload = {
      id: row.id,
      category_id: row.categoryId || row.category_id,
      text: row.text,
      count: row.count,
      source: row.source,
      narrator: row.narrator,
      grade: row.grade,
      reference: row.reference,
      keywords: row.keywords || [],
      external_key: dedupeKeyForRow("adhkar", row),
      status: "approved",
    };
    const key = payload.external_key;
    if (seen.has(key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      seen.add(key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from(table).upsert(payload, { onConflict: "id" }).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(key);
      inserted.push({ i, id: data.id, key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importQuranSurahs(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.quran_surahs;
  const { data: existing } = await withRetry(() => admin.from(table).select("id, number"));
  const seen = new Set((existing || []).map((r) => String(r.number)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    if (seen.has(String(row.number))) {
      report.skipped++;
      continue;
    }
    const payload = {
      number: row.number,
      name: row.name,
      english_name: row.englishName || row.english_name,
      ayahs: row.ayahs,
      revelation: row.revelation,
      summary: row.summary,
      themes: row.themes || [],
      external_key: `surah-${row.number}`,
      status: "approved",
    };
    if (opts.dryRun) {
      report.imported++;
      seen.add(String(row.number));
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from(table).insert(payload).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(String(row.number));
      inserted.push({ i, id: data.id, key: `surah-${row.number}` });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importQuranTopics(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.quran_topics;
  const { data: existing } = await withRetry(() => admin.from(table).select("id, title"));
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("quran_topics", r)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const payload = {
      id: row.id,
      title: row.title,
      summary: row.summary,
      category: row.category,
      surah_refs: row.surahRefs || row.surah_refs || [],
      keywords: row.keywords || [],
      external_key: dedupeKeyForRow("quran_topics", row),
      status: "approved",
    };
    if (seen.has(payload.external_key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      seen.add(payload.external_key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from(table).upsert(payload, { onConflict: "id" }).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(payload.external_key);
      inserted.push({ i, id: data.id, key: payload.external_key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importRulings(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.rulings;
  const { data: existing } = await withRetry(() => admin.from("sharia_rulings").select("id, external_key, title"));
  const seen = new Set((existing || []).map((r) => r.external_key || dedupeKeyForRow("rulings", r)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const payload = {
      external_key: row.external_key || dedupeKeyForRow("rulings", row),
      title: row.title,
      summary: row.summary || null,
      body: row.body || row.summary || row.title,
      category: row.category,
      subcategory: row.subcategory || null,
      keywords: row.keywords || [],
      importance_score: row.importance_score ?? 50,
      status: row.status || "approved",
      verification_status: "approved",
    };
    if (seen.has(payload.external_key)) {
      report.skipped++;
      continue;
    }
    if (opts.dryRun) {
      report.imported++;
      seen.add(payload.external_key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() =>
        admin.from("sharia_rulings").insert(payload).select("id").single(),
      );
      if (error) throw error;
      report.imported++;
      seen.add(payload.external_key);
      inserted.push({ i, id: data.id, key: payload.external_key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

async function importCategories(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const table = TABLE_BY_TYPE.categories;
  const { data: existing } = await withRetry(() => admin.from("qa_categories").select("id, slug, name"));
  const seen = new Set((existing || []).map((r) => normalizeName(r.slug || r.name)));
  const inserted = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const slug = row.slug || slugifyCategory(row.name);
    const key = normalizeName(slug);
    if (seen.has(key)) {
      report.skipped++;
      continue;
    }
    const payload = {
      name: row.name,
      slug,
      description: row.description || null,
      sort_order: row.sort_order != null ? Number(row.sort_order) : null,
      icon: row.icon || null,
    };
    if (opts.dryRun) {
      report.imported++;
      seen.add(key);
      continue;
    }
    try {
      const { data, error } = await withRetry(() => admin.from("qa_categories").insert(payload).select("id").single());
      if (error) throw error;
      report.imported++;
      seen.add(key);
      inserted.push({ i, id: data.id, key });
    } catch (err) {
      report.failed++;
      report.errors.push(`Row ${i + 1}: ${err.message}`);
      report.ok = false;
      break;
    }
  }
  await trackInserts(opts.jobId, table, inserted);
  return report;
}

export { TABLE_BY_TYPE };
