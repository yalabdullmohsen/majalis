/**
 * Seed sharia_rulings from public JSON chunks — one-time import, not runtime fallback.
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "./supabase-admin.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, "../public/data/rulings-encyclopedia");
const PUBLIC_DATA_PATH = "/data/rulings-encyclopedia";

function resolvePublicBaseUrl() {
  if (process.env.MAJALIS_PRODUCTION_URL) {
    return process.env.MAJALIS_PRODUCTION_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_ENV === "production") {
    return "https://majlisilm.com";
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/^https?:\/\//, "")}`;
  }
  return "https://majlisilm.com";
}

function loadSeedItemsFromFilesystem() {
  const manifestPath = join(DATA_DIR, "manifest.json");
  if (!existsSync(manifestPath)) {
    return null;
  }
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  const items = [];
  for (const chunk of manifest.chunks || []) {
    const chunkPath = join(DATA_DIR, chunk.file);
    if (!existsSync(chunkPath)) continue;
    const rows = JSON.parse(readFileSync(chunkPath, "utf8"));
    if (Array.isArray(rows)) items.push(...rows);
  }
  return { items, total: items.length, manifestVersion: manifest.version, source: "filesystem" };
}

async function fetchJson(url) {
  const res = await fetch(url, { headers: { accept: "application/json" } });
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  return res.json();
}

function chunkPublicUrl(baseUrl, chunkFile) {
  const parts = chunkFile.split("/").map((part) => encodeURIComponent(part));
  return `${baseUrl}${PUBLIC_DATA_PATH}/${parts.join("/")}`;
}

async function loadSeedItemsFromHttp(baseUrl = resolvePublicBaseUrl()) {
  const manifestUrl = `${baseUrl}${PUBLIC_DATA_PATH}/manifest.json`;
  const manifest = await fetchJson(manifestUrl);
  const items = [];
  for (const chunk of manifest.chunks || []) {
    const chunkUrl = chunkPublicUrl(baseUrl, chunk.file);
    try {
      const rows = await fetchJson(chunkUrl);
      if (Array.isArray(rows)) items.push(...rows);
    } catch {
      // Skip missing chunk files; continue with partial seed.
    }
  }
  return {
    items,
    total: items.length,
    manifestVersion: manifest.version,
    source: "http",
    baseUrl,
  };
}

async function loadSeedItems(options = {}) {
  const local = loadSeedItemsFromFilesystem();
  if (local?.items?.length) {
    return local;
  }

  try {
    const remote = await loadSeedItemsFromHttp(options.baseUrl);
    if (remote.items.length > 0) {
      return remote;
    }
    return { items: [], total: 0, error: "no_seed_items", source: remote.source };
  } catch (error) {
    return {
      items: [],
      total: 0,
      error: local ? "no_seed_items" : error.message || "manifest.json not found",
    };
  }
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
    // اكتُشف 2026-07-18: sharia_rulings.verification_status مقيَّد بـCHECK
    // constraint حي يقبل فقط 'draft'|'pending'|'approved'|'rejected'|
    // 'archived' — بينما generate-rulings-encyclopedia.mjs يُصدِّر
    // 'pending_review' (لكل حكم بلا reviewed_by، أي الأغلبية) لكل الأحكام
    // بلا استثناء. تحقَّقتُ بمحاولة إدراج فعلية: الإدراج يفشل بمخالفة
    // القيد — كان سيُسقِط seedRulingsFromFilesystem() (cron أسبوعي حقيقي
    // في production) صامتاً لأي حكم غير مراجَع بشرياً، أي معظم موسوعة
    // الأحكام. 'pending' هو أقرب قيمة صالحة بنفس المعنى.
    verification_status:
      item.verification_status === "pending_review" ? "pending" : item.verification_status || "approved",
    status: "approved",
    published_at: item.published_at || item.created_at || new Date().toISOString(),
  };
}

export async function seedRulingsFromFilesystem(options = {}) {
  const { items, total, error, manifestVersion, source } = await loadSeedItems(options);
  if (error) return { ok: false, error };
  if (items.length === 0) return { ok: false, error: "no_seed_items" };

  if (options.dryRun) {
    return { ok: true, dryRun: true, total, manifestVersion, source };
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
    source,
  };
}

export function getSeedItemCount() {
  return loadSeedItemsFromFilesystem()?.total ?? 0;
}

export async function getSeedItemCountAsync(options = {}) {
  const loaded = await loadSeedItems(options);
  return loaded.total ?? 0;
}
