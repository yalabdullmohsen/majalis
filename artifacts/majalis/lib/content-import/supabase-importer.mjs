import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { dedupeKeyForRow } from "./dedupe.mjs";

function normalizeName(name) {
  return String(name || "").trim().toLowerCase();
}

/**
 * @param {import("@supabase/supabase-js").SupabaseClient | null} admin
 * @param {string} type
 * @param {Array<Record<string, unknown>>} payloads
 * @param {{ dryRun?: boolean }} opts
 */
export async function importToSupabase(admin, type, payloads, opts = {}) {
  if (!admin) {
    if (opts.dryRun) {
      return {
        ok: true,
        imported: payloads.length,
        skipped: 0,
        failed: 0,
        errors: [],
      };
    }
    return {
      ok: false,
      imported: 0,
      skipped: 0,
      failed: payloads.length,
      errors: ["Supabase غير مهيأ — أضف VITE_SUPABASE_URL و SUPABASE_SERVICE_ROLE_KEY"],
    };
  }

  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };

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
    default:
      report.ok = false;
      report.errors.push(`نوع Supabase غير مدعوم: ${type}`);
      return report;
  }
}

async function importSheikhs(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const { data: existing } = await admin.from("sheikhs").select("id, name");
  const byName = new Map((existing || []).map((s) => [normalizeName(s.name), s]));

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
    const { error } = await admin.from("sheikhs").insert(row);
    if (error) {
      report.failed++;
      report.errors.push(`السطر ${i + 1}: ${error.message}`);
    } else {
      report.imported++;
      byName.set(key, { name: row.name });
    }
  }
  return report;
}

async function importLessons(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const [{ data: lessons }, { data: sheikhs }] = await Promise.all([
    admin.from("lessons").select("id, external_key, title, speaker_name, mosque, day_of_week, lesson_time"),
    admin.from("sheikhs").select("id, name"),
  ]);

  const byKey = new Set();
  for (const l of lessons || []) {
    byKey.add(dedupeKeyForRow("lessons", {
      external_key: l.external_key,
      title: l.title,
      speaker_name: l.speaker_name,
      mosque: l.mosque,
      day_of_week: l.day_of_week,
      lesson_time: l.lesson_time,
    }));
  }

  const sheikhByName = new Map((sheikhs || []).map((s) => [normalizeName(s.name), s.id]));

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

    const { error } = await admin.from("lessons").insert(payload);
    if (error) {
      report.failed++;
      report.errors.push(`السطر ${i + 1}: ${error.message}`);
    } else {
      report.imported++;
      byKey.add(dedupe);
    }
  }
  return report;
}

async function importLibrary(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const { data: existing } = await admin.from("library_items").select("id, title, external_url");
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("books", r)));

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
    const { error } = await admin.from("library_items").insert(row);
    if (error) {
      report.failed++;
      report.errors.push(`السطر ${i + 1}: ${error.message}`);
    } else {
      report.imported++;
      seen.add(key);
    }
  }
  return report;
}

async function importQuestions(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const [{ data: questions }, { data: categories }] = await Promise.all([
    admin.from("qa_questions").select("id, question"),
    admin.from("qa_categories").select("id, name"),
  ]);

  const seen = new Set((questions || []).map((q) => dedupeKeyForRow("questions", q)));
  const catByName = new Map((categories || []).map((c) => [normalizeName(c.name), c.id]));

  for (let i = 0; i < payloads.length; i++) {
    const raw = payloads[i];
    const { category_name, confidence, ...rest } = raw;
    const payload = { ...rest };
    if (category_name) {
      payload.category_id = catByName.get(normalizeName(category_name)) || null;
    }

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

    const { error } = await admin.from("qa_questions").insert(payload);
    if (error) {
      report.failed++;
      report.errors.push(`السطر ${i + 1}: ${error.message}`);
    } else {
      report.imported++;
      seen.add(key);
    }
  }
  return report;
}

async function importBenefits(admin, payloads, opts) {
  const report = { ok: true, imported: 0, skipped: 0, failed: 0, errors: [] };
  const { data: existing } = await admin.from("fawaid").select("id, text");
  const seen = new Set((existing || []).map((r) => dedupeKeyForRow("benefits", r)));

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
    const { error } = await admin.from("fawaid").insert(row);
    if (error) {
      report.failed++;
      report.errors.push(`السطر ${i + 1}: ${error.message}`);
    } else {
      report.imported++;
      seen.add(key);
    }
  }
  return report;
}

export { getSupabaseAdmin };
