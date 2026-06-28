/**
 * Vercel-safe bulk import — memory only, Supabase/Postgres transactions, no filesystem.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getPgClient } from "../database.mjs";
import { dedupeKeyForRow } from "./dedupe.mjs";
import { hashKey } from "./dedupe.mjs";
import { resolveImportBatchSize } from "./batch-size.mjs";

const DEFAULT_BATCH_SIZE = 500;
const MAX_VALIDATION_ERRORS = 200;

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9\u0600-\u06FF-]+/g, "")
    .slice(0, 80) || "general";
}

function chunk(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function resolveBatchSize(rowCount) {
  return resolveImportBatchSize(rowCount || 0) || DEFAULT_BATCH_SIZE;
}

async function withTransaction(fn) {
  let clientInfo;
  try {
    clientInfo = await getPgClient();
  } catch {
    return { ok: false, via: "supabase_only", result: await fn(null) };
  }

  const { client } = clientInfo;
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return { ok: true, via: "postgres_transaction", result };
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    throw err;
  } finally {
    await client.end().catch(() => {});
  }
}

async function pgUpsertBatch(client, table, rows, conflictColumn) {
  if (!rows.length) return;
  const cols = Object.keys(rows[0]);
  const quotedCols = cols.map((c) => `"${c}"`);
  const values = [];
  const placeholders = rows.map((row, ri) => {
    const ph = cols.map((c, ci) => {
      values.push(row[c] ?? null);
      return `$${ri * cols.length + ci + 1}`;
    });
    return `(${ph.join(", ")})`;
  });
  const updates = cols
    .filter((c) => c !== conflictColumn)
    .map((c) => `"${c}" = EXCLUDED."${c}"`)
    .join(", ");
  const sql = `INSERT INTO ${table} (${quotedCols.join(", ")}) VALUES ${placeholders.join(", ")}
    ON CONFLICT ("${conflictColumn}") DO UPDATE SET ${updates}`;
  await client.query(sql, values);
}

export async function bulkImportToSupabase(type, payloads, opts = {}) {
  const onProgress = opts.onProgress || (() => {});
  const dryRun = Boolean(opts.dryRun);
  const admin = getSupabaseAdmin();

  if (!admin && !dryRun) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      failed: payloads.length,
      errors: ["SUPABASE_SERVICE_ROLE_KEY required for import"],
    };
  }

  const importer = IMPORTERS[type];
  if (!importer) {
    return { ok: false, imported: 0, skipped: 0, failed: payloads.length, errors: [`Unsupported type: ${type}`] };
  }

  if (dryRun) {
    onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
    return { ok: true, imported: payloads.length, skipped: 0, failed: 0, errors: [] };
  }

  const batchSize = resolveImportBatchSize(payloads.length);
  const usePerBatchTx = payloads.length >= 1000;

  if (usePerBatchTx) {
    return importInBatches(type, payloads, { admin, importer, onProgress, batchSize, continueOnBatchFailure: true });
  }

  try {
    const wrapped = await withTransaction(async (pgClient) => {
      return importer({ admin, pgClient, payloads, onProgress, dryRun });
    });
    if (wrapped.via === "postgres_transaction") return wrapped.result;
    return wrapped.result;
  } catch (err) {
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      failed: payloads.length,
      errors: [err.message || String(err)],
      rolledBack: true,
    };
  }
}

const IMPORTERS = {
  sheikhs: importSheikhs,
  lessons: (ctx) => importLessons(ctx, false),
  courses: (ctx) => importLessons(ctx, true),
  books: (ctx) => importLibrary(ctx, "books"),
  articles: (ctx) => importLibrary(ctx, "articles"),
  questions: importQuestions,
  benefits: importBenefits,
  adhkar: importAdhkar,
  rulings: importRulings,
  hadith: importHadith,
  stories: importStories,
};

async function importInBatches(type, payloads, opts) {
  const { admin, importer, onProgress, batchSize, continueOnBatchFailure } = opts;
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [], batchFailures: 0 };
  const batches = chunk(payloads, batchSize);
  let processed = 0;

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    try {
      const wrapped = await withTransaction(async (pgClient) => {
        return importer({ admin, pgClient, payloads: batch, onProgress: () => {}, dryRun: false });
      });
      const partial = wrapped.result || wrapped;
      report.imported += partial.imported ?? 0;
      report.skipped += partial.skipped ?? 0;
      report.failed += partial.failed ?? 0;
      if (partial.errors?.length) report.errors.push(...partial.errors.slice(0, 3));
      if (partial.ok === false) report.ok = false;
    } catch (err) {
      report.batchFailures += 1;
      report.failed += batch.length;
      report.errors.push(`دفعة ${i + 1}/${batches.length}: ${err.message || err}`);
      report.ok = false;
      if (!continueOnBatchFailure) break;
    }
    processed += batch.length;
    onProgress({
      processed,
      total: payloads.length,
      pct: Math.round((processed / payloads.length) * 100),
      batch: i + 1,
      totalBatches: batches.length,
    });
  }

  return report;
}

async function importSheikhs({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const { data: existing } = await admin.from("sheikhs").select("id, name");
  const byName = new Map((existing || []).map((s) => [normalizeName(s.name), s]));

  const toInsert = [];
  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    if (byName.has(normalizeName(row.name))) {
      report.skipped++;
    } else {
      toInsert.push(row);
      byName.set(normalizeName(row.name), { name: row.name });
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "sheikhs", batch, "id");
    } else {
      const { error } = await admin.from("sheikhs").insert(batch);
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function importLessons({ admin, pgClient, payloads, onProgress }, isCourse) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const [{ data: lessons }, { data: sheikhs }] = await Promise.all([
    admin.from("lessons").select("id, external_key, title, speaker_name, mosque, day_of_week, lesson_time"),
    admin.from("sheikhs").select("id, name"),
  ]);

  const byKey = new Set();
  for (const l of lessons || []) {
    byKey.add(
      dedupeKeyForRow("lessons", {
        external_key: l.external_key,
        title: l.title,
        speaker_name: l.speaker_name,
        mosque: l.mosque,
        day_of_week: l.day_of_week,
        lesson_time: l.lesson_time,
      }),
    );
  }

  const sheikhByName = new Map((sheikhs || []).map((s) => [normalizeName(s.name), s.id]));
  const toInsert = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const { sheikh_name, ...rest } = raw;
    const payload = { ...rest, is_course: isCourse, activity_type: isCourse ? "دورة" : rest.activity_type || "درس" };
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
    } else {
      toInsert.push(payload);
      byKey.add(dedupe);
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "lessons", batch, "external_key");
    } else {
      const { error } = await admin.from("lessons").upsert(batch, { onConflict: "external_key" });
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function importLibrary({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const { data: existing } = await admin.from("library_items").select("id, title, external_url");
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("books", r)));
  const toInsert = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const key = dedupeKeyForRow("books", row);
    if (seen.has(key)) report.skipped++;
    else {
      toInsert.push(row);
      seen.add(key);
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "library_items", batch, "id");
    } else {
      const { error } = await admin.from("library_items").insert(batch);
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function importQuestions({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const [{ data: questions }, { data: categories }] = await Promise.all([
    admin.from("qa_questions").select("id, question"),
    admin.from("qa_categories").select("id, name, slug"),
  ]);

  const seen = new Set((questions || []).map((q) => dedupeKeyForRow("questions", q)));
  const catByName = new Map((categories || []).map((c) => [normalizeName(c.name), c.id]));
  const catBySlug = new Map((categories || []).map((c) => [c.slug, c.id]));
  const toInsert = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const { category_name, confidence: _c, ...rest } = raw;
    const payload = { ...rest };

    const catKey = normalizeName(category_name || raw.category);
    if (catKey) {
      let catId = catByName.get(catKey);
      if (!catId && category_name) {
        const slug = slugify(category_name);
        catId = catBySlug.get(slug);
        if (!catId) {
          const { data: created, error } = await admin
            .from("qa_categories")
            .insert({ name: String(category_name).trim(), slug })
            .select("id, slug")
            .single();
          if (error) throw new Error(error.message);
          catId = created.id;
          catByName.set(catKey, catId);
          catBySlug.set(created.slug, catId);
        }
      }
      if (catId) payload.category_id = catId;
    }

    const key = dedupeKeyForRow("questions", payload);
    if (seen.has(key)) report.skipped++;
    else {
      toInsert.push(payload);
      seen.add(key);
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "qa_questions", batch, "id");
    } else {
      const { error } = await admin.from("qa_questions").insert(batch);
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function fetchAllTableRows(admin, table, columns, pageSize = 1000) {
  const rows = [];
  let from = 0;
  for (;;) {
    const { data, error } = await admin.from(table).select(columns).range(from, from + pageSize - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    if (!data?.length) break;
    rows.push(...data);
    if (data.length < pageSize) break;
    from += pageSize;
  }
  return rows;
}

async function importBenefits({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const existing = await fetchAllTableRows(admin, "fawaid", "id, text");
  const seen = new Set(existing.map((r) => dedupeKeyForRow("benefits", r)));
  const toInsert = [];

  for (let i = 0; i < payloads.length; i++) {
    const row = payloads[i];
    const key = dedupeKeyForRow("benefits", row);
    if (seen.has(key)) report.skipped++;
    else {
      toInsert.push(row);
      seen.add(key);
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "fawaid", batch, "id");
    } else {
      const { error } = await admin.from("fawaid").insert(batch);
      if (error) throw new Error(`fawaid insert failed: ${error.message} (code: ${error.code || "unknown"})`);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

const ADHKAR_CATEGORY_MAP = {
  صباح: "adh-morning",
  "أذكار الصباح": "adh-morning",
  morning: "adh-morning",
  مساء: "adh-evening",
  evening: "adh-evening",
  نوم: "adh-sleep",
  sleep: "adh-sleep",
};

function mapAdhkarCategoryId(raw) {
  const key = normalizeName(raw);
  for (const [k, id] of Object.entries(ADHKAR_CATEGORY_MAP)) {
    if (normalizeName(k) === key) return id;
  }
  if (String(raw || "").startsWith("adh-")) return raw;
  return `adh-${slugify(raw || "misc")}`;
}

async function importAdhkar({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const categoriesEnsured = new Set();
  const items = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const categoryId = raw.category_id || mapAdhkarCategoryId(raw.category || raw.categoryId);
    if (!categoriesEnsured.has(categoryId)) {
      const { error: catErr } = await admin.from("verified_adhkar_categories").upsert(
        {
          id: categoryId,
          slug: categoryId.replace(/^adh-/, ""),
          name: raw.category || categoryId,
          verification_status: "verified",
          trust_level: 90,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (catErr) throw new Error(catErr.message);
      categoriesEnsured.add(categoryId);
    }

    items.push({
      id: raw.id || `adh-import-${hashKey([raw.text, categoryId])}`,
      category_id: categoryId,
      text: raw.text,
      repeat_count: Number(raw.count ?? raw.repeat_count) || 1,
      narrator: raw.narrator || null,
      source_name: raw.source || raw.source_name || null,
      grade: raw.grade || null,
      reference: raw.reference || null,
      keywords: Array.isArray(raw.keywords) ? raw.keywords : [],
      verification_status: "verified",
      trust_level: 90,
      updated_at: new Date().toISOString(),
    });

    if ((i + 1) % 500 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(items, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "verified_adhkar_items", batch, "id");
    } else {
      const { error } = await admin.from("verified_adhkar_items").upsert(batch, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
    onProgress({ processed: report.imported, total: payloads.length });
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function importRulings({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };

  for (const batch of chunk(payloads, resolveBatchSize(payloads.length))) {
    const rows = batch.map((raw) => ({
      external_key: raw.external_key || hashKey([raw.title, raw.category]),
      title: raw.title,
      summary: raw.summary ?? null,
      body: raw.body || raw.summary || raw.title,
      category: raw.category || "فقه عام",
      subcategory: raw.subcategory ?? null,
      keywords: raw.keywords ?? [],
      evidence: raw.evidence ?? [],
      references: raw.references ?? [],
      status: raw.status || "approved",
      verification_status: raw.verification_status || "approved",
      importance_score: raw.importance_score ?? 50,
      published_at: raw.published_at || new Date().toISOString(),
    }));

    if (pgClient) {
      await pgUpsertBatch(pgClient, "sharia_rulings", rows, "external_key");
    } else {
      const { error } = await admin.from("sharia_rulings").upsert(rows, { onConflict: "external_key" });
      if (error) throw new Error(error.message);
    }
    report.imported += rows.length;
    onProgress({ processed: report.imported, total: payloads.length });
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function importHadith({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const existing = await fetchAllTableRows(admin, "verified_hadith_items", "id, text, source_name");
  const seen = new Set(existing.map((r) => dedupeKeyForRow("hadith", r)));
  const toInsert = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const row = {
      id: raw.id || `hadith-import-${hashKey([raw.text, raw.source || raw.source_name])}`,
      text: raw.text,
      source_name: raw.source || raw.source_name,
      narrator: raw.narrator || null,
      grade: raw.grade || null,
      reference: raw.reference || null,
      verification_status: "verified",
      trust_level: 90,
      updated_at: new Date().toISOString(),
    };
    const key = dedupeKeyForRow("hadith", row);
    if (seen.has(key)) report.skipped++;
    else {
      toInsert.push(row);
      seen.add(key);
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "verified_hadith_items", batch, "id");
    } else {
      const { error } = await admin.from("verified_hadith_items").upsert(batch, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

async function importStories({ admin, pgClient, payloads, onProgress }) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const existing = await fetchAllTableRows(admin, "akp_stories", "id, title");
  const seen = new Set(existing.map((r) => dedupeKeyForRow("stories", r)));
  const toInsert = [];

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const row = {
      id: raw.id || `story-import-${hashKey([raw.title, raw.summary || raw.body])}`,
      title: raw.title,
      body: raw.summary || raw.body || raw.content || raw.title,
      summary: raw.summary || null,
      category: raw.category || "قصص",
      source_name: raw.source || null,
      verification_status: "verified",
      trust_level: 90,
      updated_at: new Date().toISOString(),
    };
    const key = dedupeKeyForRow("stories", row);
    if (seen.has(key)) report.skipped++;
    else {
      toInsert.push(row);
      seen.add(key);
    }
    if ((i + 1) % 100 === 0) onProgress({ processed: i + 1, total: payloads.length });
  }

  for (const batch of chunk(toInsert, resolveBatchSize(payloads.length))) {
    if (pgClient) {
      await pgUpsertBatch(pgClient, "akp_stories", batch, "id");
    } else {
      const { error } = await admin.from("akp_stories").upsert(batch, { onConflict: "id" });
      if (error) throw new Error(error.message);
    }
    report.imported += batch.length;
  }

  onProgress({ processed: payloads.length, total: payloads.length, pct: 100 });
  return report;
}

export { DEFAULT_BATCH_SIZE as BATCH_SIZE, MAX_VALIDATION_ERRORS };
