/**
 * Idempotent platform seed — upsert only, skip when data already present.
 */

import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { countTableRows } from "./table-probe.mjs";
import { seedRulingsFromFilesystem } from "./rulings-db-seed.mjs";
import { promoteAllBootstrapOwners } from "./owner-promotion.mjs";

/** Canonical QA categories (matches qa_categories_fix_v1.sql) */
const QA_CATEGORY_SEED = [
  { name: "العقيدة", slug: "aqeedah", description: "التوحيد والإيمان", sort_order: 1 },
  { name: "الفقه", slug: "fiqh", description: "أحكام فقهية عامة", sort_order: 2 },
  { name: "الطهارة", slug: "taharah", description: "الوضوء والغسل", sort_order: 3 },
  { name: "الصلاة", slug: "salah", description: "أحكام الصلاة", sort_order: 4 },
  { name: "الزكاة", slug: "zakat", description: "أحكام الزكاة", sort_order: 5 },
  { name: "الصيام", slug: "sawm", description: "رمضان والصيام", sort_order: 6 },
  { name: "الحج", slug: "hajj", description: "الحج والعمرة", sort_order: 7 },
  { name: "السيرة", slug: "seerah", description: "السيرة النبوية", sort_order: 8 },
  { name: "الأنبياء", slug: "anbiya", description: "قصص الأنبياء والمرسلين", sort_order: 9 },
  { name: "الصحابة", slug: "sahabah", description: "سيرة الصحابة", sort_order: 10 },
  { name: "التابعون", slug: "tabiin", description: "التابعون وأتباعهم", sort_order: 11 },
  { name: "الحديث", slug: "hadith", description: "مصطلح الحديث والسنة", sort_order: 12 },
  { name: "التفسير", slug: "tafsir", description: "تفسير القرآن", sort_order: 13 },
  { name: "علوم القرآن", slug: "quran", description: "التلاوة وعلوم القرآن", sort_order: 14 },
  { name: "الآداب", slug: "adab", description: "آداب شرعية", sort_order: 15 },
  { name: "الأذكار", slug: "adhkar", description: "الأذكار والأدعية", sort_order: 16 },
  { name: "الأسرة", slug: "family", description: "الزواج والتربية", sort_order: 17 },
  { name: "المرأة", slug: "women", description: "أحكام المرأة", sort_order: 18 },
  { name: "المعاملات", slug: "muamalat", description: "بيع ومعاملات", sort_order: 19 },
  { name: "الأحكام", slug: "rulings", description: "حلال وحرام", sort_order: 20 },
  { name: "التاريخ الإسلامي", slug: "history", description: "تاريخ الأمة", sort_order: 21 },
  { name: "متفرقات", slug: "misc", description: "أسئلة عامة", sort_order: 99 },
];

export async function seedQaCategoriesIfNeeded() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY required for seed" };
  }

  const existing = await countTableRows("qa_categories");
  if (existing === null) {
    return { ok: false, error: "qa_categories table not accessible" };
  }
  if (existing >= QA_CATEGORY_SEED.length) {
    return { ok: true, skipped: true, reason: "already_seeded", count: existing };
  }

  const { error } = await admin.from("qa_categories").upsert(QA_CATEGORY_SEED, { onConflict: "slug" });
  if (error) return { ok: false, error: error.message };

  const after = await countTableRows("qa_categories");
  return { ok: true, inserted: after - existing, count: after };
}

export async function seedRulingsIfNeeded(options = {}) {
  const count = await countTableRows("sharia_rulings");
  if (count === null) {
    return { ok: false, error: "sharia_rulings table not accessible" };
  }
  if (count > 0) {
    return { ok: true, skipped: true, reason: "already_seeded", count };
  }
  return seedRulingsFromFilesystem(options);
}

export async function seedRulingCategoriesIfNeeded() {
  const admin = getSupabaseAdmin();
  if (!admin) return { ok: false, error: "no_admin" };

  const tableCount = await countTableRows("sharia_ruling_categories");
  if (tableCount === null) {
    return { ok: true, skipped: true, reason: "table_missing" };
  }
  if (tableCount > 0) {
    return { ok: true, skipped: true, reason: "already_seeded", count: tableCount };
  }

  const rulingCount = await countTableRows("sharia_rulings");
  if (!rulingCount) {
    return { ok: true, skipped: true, reason: "no_rulings_yet" };
  }

  const { data: rows, error: selErr } = await admin.from("sharia_rulings").select("category").limit(5000);
  if (selErr) return { ok: false, error: selErr.message };

  const categories = [...new Set((rows || []).map((r) => r.category).filter(Boolean))];
  if (!categories.length) return { ok: true, skipped: true, reason: "no_categories_in_rulings" };

  const payload = categories.map((name, i) => ({
    name,
    slug: name.replace(/\s+/g, "-").slice(0, 80),
    sort_order: i + 1,
  }));

  const { error } = await admin
    .from("sharia_ruling_categories")
    .upsert(payload, { onConflict: "slug", ignoreDuplicates: true });
  if (error) return { ok: false, error: error.message };

  return { ok: true, inserted: payload.length };
}

export async function seedOwnersIfNeeded() {
  const admin = getSupabaseAdmin();
  if (!admin) {
    return { ok: false, error: "SUPABASE_SERVICE_ROLE_KEY required for owner bootstrap" };
  }
  return promoteAllBootstrapOwners(admin, { assignedBy: "platform-bootstrap" });
}

export async function runPlatformSeed(options = {}) {
  const results = {};
  results.qaCategories = await seedQaCategoriesIfNeeded();
  if (!results.qaCategories.ok) return { ok: false, step: "seed_categories", results };

  results.rulings = await seedRulingsIfNeeded({ dryRun: options.dryRun });
  if (!results.rulings.ok) return { ok: false, step: "seed_rulings", results };

  results.rulingCategories = await seedRulingCategoriesIfNeeded();
  if (!results.rulingCategories.ok) return { ok: false, step: "seed_ruling_categories", results };

  if (options.seedOwners !== false) {
    results.owners = await seedOwnersIfNeeded();
    if (!results.owners.ok) return { ok: false, step: "seed_owners", results };
  }

  const failed = Object.values(results).some((r) => r && r.ok === false);
  return { ok: !failed, results };
}
