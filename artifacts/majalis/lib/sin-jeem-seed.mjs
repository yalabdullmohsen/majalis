/**
 * Seed Sin Jeem categories + questions into Supabase (service role or pg).
 */
import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { getPgClient } from "./database.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

export const CATEGORY_SEED = [
  { slug: "quran", name_ar: "القرآن الكريم", icon: "📖", sort_order: 1 },
  { slug: "tafsir", name_ar: "التفسير", icon: "📜", parent_slug: "quran", sort_order: 2 },
  { slug: "quran-sciences", name_ar: "علوم القرآن", icon: "🔬", parent_slug: "quran", sort_order: 3 },
  { slug: "tajweed", name_ar: "التجويد", icon: "🎵", sort_order: 10 },
  { slug: "aqeeda", name_ar: "العقيدة", icon: "☪️", sort_order: 20 },
  { slug: "hadith", name_ar: "الحديث", icon: "📿", sort_order: 30 },
  { slug: "hadith-sciences", name_ar: "مصطلح الحديث", icon: "🔍", parent_slug: "hadith", sort_order: 31 },
  { slug: "seera", name_ar: "السيرة النبوية", icon: "🕌", sort_order: 40 },
  { slug: "prophets", name_ar: "قصص الأنبياء", icon: "🌟", sort_order: 50 },
  { slug: "sahaba", name_ar: "الصحابة", icon: "⭐", sort_order: 60 },
  { slug: "um-muminin", name_ar: "أمهات المؤمنين", icon: "👩", parent_slug: "sahaba", sort_order: 61 },
  { slug: "tabiin", name_ar: "التابعون", icon: "📜", sort_order: 65 },
  { slug: "scholars", name_ar: "العلماء", icon: "🎓", sort_order: 68 },
  { slug: "fiqh", name_ar: "الفقه", icon: "⚖️", sort_order: 70 },
  { slug: "usool-fiqh", name_ar: "أصول الفقه", icon: "📐", sort_order: 80 },
  { slug: "fiqh-rules", name_ar: "القواعد الفقهية", icon: "📋", parent_slug: "fiqh", sort_order: 81 },
  { slug: "faraid", name_ar: "الفرائض", icon: "🧮", parent_slug: "fiqh", sort_order: 82 },
  { slug: "arabic", name_ar: "اللغة العربية", icon: "✍️", sort_order: 90 },
  { slug: "dua", name_ar: "الأدعية", icon: "🤲", sort_order: 100 },
  { slug: "morning-adhkar", name_ar: "الأذكار", icon: "🌅", parent_slug: "dua", sort_order: 101 },
  { slug: "islamic-history", name_ar: "التاريخ الإسلامي", icon: "🏛️", sort_order: 120 },
  { slug: "kuwait-islamic", name_ar: "الكويت الإسلامية", icon: "🇰🇼", sort_order: 130 },
  { slug: "mosques", name_ar: "المساجد", icon: "🕌", sort_order: 135 },
  { slug: "mutoon", name_ar: "المتون العلمية", icon: "📚", sort_order: 136 },
  { slug: "scientific-miracles", name_ar: "الإعجاز العلمي", icon: "🔬", sort_order: 137 },
  { slug: "islamic-puzzles", name_ar: "الألغاز الإسلامية", icon: "🧩", sort_order: 140 },
  // Subcategory slugs used as category_slug in question bank
  { slug: "maki-madani", name_ar: "مكي ومدني", icon: "📖", parent_slug: "quran", sort_order: 4 },
  { slug: "nawawi-40", name_ar: "الأربعون النووية", icon: "📿", parent_slug: "hadith", sort_order: 32 },
  { slug: "nuh", name_ar: "نوح", icon: "🌊", parent_slug: "prophets", sort_order: 51 },
  { slug: "ibrahim", name_ar: "إبراهيم", icon: "🕋", parent_slug: "prophets", sort_order: 52 },
  { slug: "musa", name_ar: "موسى", icon: "📜", parent_slug: "prophets", sort_order: 53 },
  { slug: "isa", name_ar: "عيسى", icon: "✨", parent_slug: "prophets", sort_order: 54 },
  { slug: "muhammad", name_ar: "محمد ﷺ", icon: "🕌", parent_slug: "prophets", sort_order: 55 },
  { slug: "khulafa-rashidun", name_ar: "الخلفاء الراشدون", icon: "⭐", parent_slug: "sahaba", sort_order: 62 },
  { slug: "ghazwat", name_ar: "الغزوات", icon: "⚔️", parent_slug: "seera", sort_order: 41 },
  { slug: "salah", name_ar: "الصلاة", icon: "🕌", parent_slug: "fiqh", sort_order: 71 },
  { slug: "tahara", name_ar: "الطهارة", icon: "💧", parent_slug: "fiqh", sort_order: 72 },
  { slug: "siyam", name_ar: "الصيام", icon: "🌙", parent_slug: "fiqh", sort_order: 73 },
  { slug: "andalus", name_ar: "الأندلس", icon: "🏰", parent_slug: "islamic-history", sort_order: 121 },
  { slug: "quran-puzzles", name_ar: "ألغاز قرآنية", icon: "🧩", parent_slug: "islamic-puzzles", sort_order: 141 },
  { slug: "fiqh-puzzles", name_ar: "ألغاز فقهية", icon: "🧩", parent_slug: "islamic-puzzles", sort_order: 142 },
  { slug: "bukhari", name_ar: "صحيح البخاري", icon: "📗", parent_slug: "hadith", sort_order: 33 },
  { slug: "riyadh-salihin", name_ar: "رياض الصالحين", icon: "📘", parent_slug: "hadith", sort_order: 34 },
];

function contentHash(text) {
  return createHash("sha256").update(String(text || "").trim()).digest("hex").slice(0, 32);
}

function loadBank() {
  const path = join(ROOT, "data/sin-jeem/questions-bank.json");
  return JSON.parse(readFileSync(path, "utf8"));
}

export async function seedSinJeemCategories(admin) {
  const slugToId = {};
  for (const cat of CATEGORY_SEED) {
    const { data: existing } = await admin
      .from("sin_jeem_categories")
      .select("id")
      .eq("slug", cat.slug)
      .maybeSingle();

    if (existing?.id) {
      slugToId[cat.slug] = existing.id;
      continue;
    }

    const { data, error } = await admin
      .from("sin_jeem_categories")
      .insert({
        slug: cat.slug,
        name_ar: cat.name_ar,
        icon: cat.icon,
        parent_slug: cat.parent_slug || null,
        sort_order: cat.sort_order,
        status: "published",
      })
      .select("id")
      .single();

    if (error) throw new Error(`category ${cat.slug}: ${error.message}`);
    slugToId[cat.slug] = data.id;
  }
  return slugToId;
}

export async function seedSinJeemQuestions(admin, options = {}) {
  const bank = options.questions || loadBank();
  const slugToId = options.slugToId || (await seedSinJeemCategories(admin));
  const dryRun = options.dryRun === true;
  const batchSize = options.batchSize || 50;

  const { count: existingCount } = await admin
    .from("sin_jeem_questions")
    .select("*", { count: "exact", head: true });

  if (existingCount && existingCount >= bank.length && !options.force) {
    return { ok: true, skipped: true, reason: "already_seeded", count: existingCount };
  }

  const { data: existingRows } = await admin.from("sin_jeem_questions").select("content_hash, question");
  const existingHashes = new Set((existingRows || []).map((r) => r.content_hash || contentHash(r.question)));

  let inserted = 0;
  let skipped = 0;
  const batch = [];

  for (const q of bank) {
    const hash = contentHash(q.question);
    if (existingHashes.has(hash)) {
      skipped++;
      continue;
    }
    existingHashes.add(hash);

    batch.push({
      category_id: slugToId[q.category_slug] || null,
      subcategory_slug: q.subcategory_slug || null,
      question_type: q.question_type || "multiple_choice",
      question: q.question,
      options: q.options || [],
      correct_index: q.correct_index ?? 0,
      correct_answer: q.correct_answer || null,
      explanation: q.explanation || null,
      difficulty: q.difficulty || "متوسط",
      keywords: q.keywords || [],
      image_url: q.image_url || null,
      audio_url: q.audio_url || null,
      video_url: q.video_url || null,
      points: q.points || 10,
      status: "published",
      review_status: "approved",
      source: q.source || null,
      content_hash: hash,
    });

    if (batch.length >= batchSize) {
      if (!dryRun) {
        const { error } = await admin.from("sin_jeem_questions").insert(batch);
        if (error) throw new Error(`batch insert: ${error.message}`);
      }
      inserted += batch.length;
      batch.length = 0;
    }
  }

  if (batch.length) {
    if (!dryRun) {
      const { error } = await admin.from("sin_jeem_questions").insert(batch);
      if (error) throw new Error(`final batch: ${error.message}`);
    }
    inserted += batch.length;
  }

  return { ok: true, inserted, skipped, dryRun, total: bank.length };
}

export async function runSinJeemSeed(options = {}) {
  const admin = getSupabaseAdmin();
  if (!admin) {
    const clientInfo = await getPgClient();
    if (!clientInfo?.client) {
      return {
        ok: false,
        error: "SUPABASE_SERVICE_ROLE_KEY or DATABASE_URL required for seeding",
      };
    }
    return { ok: false, error: "Direct pg seed not implemented — set SUPABASE_SERVICE_ROLE_KEY" };
  }

  try {
    const slugToId = await seedSinJeemCategories(admin);
    const seed = await seedSinJeemQuestions(admin, { ...options, slugToId });
    return { ok: true, categories: Object.keys(slugToId).length, seed };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}
