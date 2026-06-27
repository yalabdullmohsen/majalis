/**
 * Seed sharia_rulings from public JSON chunks — one-time import, not runtime fallback.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "./supabase-admin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../public/data/rulings-encyclopedia");

function loadSeedItems() {
  const manifestPath = join(DATA_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    return { items: [], total: 0, error: "manifest.json not found" };
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const items = [];
  for (const chunk of manifest.chunks || []) {
    const chunkPath = join(DATA_DIR, chunk.file);
    if (!existsSync(chunkPath)) continue;
    const rows = JSON.parse(readFileSync(chunkPath, "utf8"));
    if (Array.isArray(rows)) items.push(...rows);
  }
  return { items, total: items.length, manifestVersion: manifest.version };
}

function toDbRow(item) {
  return {
    external_key: item.external_key || item.slug || item.id,
    title: item.title,
    summary: item.summary ?? null,
    body: item.body || item.summary || item.title,
    category: item.category || "فقه عام",
    subcategory: item.subcategory ?? null,
    subcategories: item.subcategories ?? [],
    keywords: item.keywords ?? [],
    evidence: item.evidence ?? [],
    references: item.references ?? [],
    quran_evidence: item.quran_evidence ?? [],
    sunnah_evidence: item.sunnah_evidence ?? [],
    scholar_opinions: item.scholar_opinions ?? [],
    prevailing_view: item.prevailing_view ?? null,
    hadith_grade: item.hadith_grade ?? null,
    benefits: item.benefits ?? [],
    importance_score: item.importance_score ?? 50,
    popularity_score: item.popularity_score ?? 0,
    search_count: item.search_count ?? 0,
    verification_status: item.verification_status || "approved",
    status: "approved",
    published_at: item.published_at || item.created_at || new Date().toISOString(),
  };
}

export async function seedRulingsFromFilesystem(options = {}) {
  const { items, total, error, manifestVersion } = loadSeedItems();
  if (error) return { ok: false, error };
  if (items.length === 0) return { ok: false, error: "no_seed_items" };

  if (options.dryRun) {
    return { ok: true, dryRun: true, total, manifestVersion };
  }

  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY required for seed" };
  }

  const batchSize = 50;
  let inserted = 0;
  let skipped = 0;
  const errors = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize).map(toDbRow);
    const { error: upsertErr, data } = await admin
      .from("sharia_rulings")
      .upsert(batch, { onConflict: "external_key", ignoreDuplicates: false })
      .select("id");

    if (upsertErr) {
      errors.push(upsertErr.message);
      skipped += batch.length;
    } else {
      inserted += data?.length ?? batch.length;
    }
  }

  return {
    ok: errors.length === 0,
    total,
    inserted,
    skipped,
    errors: errors.slice(0, 5),
    manifestVersion,
  };
}

export function getSeedItemCount() {
  return loadSeedItems().total;
}
