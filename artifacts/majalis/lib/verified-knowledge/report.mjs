/**
 * Daily quality report for Verified Knowledge Platform.
 */

import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getVerifiedSourcesDashboard } from "./source-registry.mjs";
import { countSeedItemsByType } from "../scholarly-verification/seed-scanner.mjs";
import { parseAdhkarFromSeedFile, parseArbaeenFromSeedFile } from "./seed-parsers.mjs";

const SECTION_KEYS = [
  "lessons",
  "lectures",
  "courses",
  "scholars",
  "sheikhs",
  "books",
  "library",
  "fatwa",
  "qa",
  "adhkar",
  "hadith",
  "articles",
  "miracles",
  "occasions",
  "terms",
  "audio",
  "video",
];

async function countTable(admin, table, statusField = "verification_status") {
  if (!admin) return { total: 0, verified: 0 };
  try {
    const { count: total } = await admin.from(table).select("*", { count: "exact", head: true }).is("deleted_at", null);
    const { count: verified } = await admin
      .from(table)
      .select("*", { count: "exact", head: true })
      .eq(statusField, "verified")
      .is("deleted_at", null);
    return { total: total ?? 0, verified: verified ?? 0 };
  } catch {
    return { total: 0, verified: 0 };
  }
}

export async function generateKnowledgeQualityReport(admin) {
  admin = admin ?? getSupabaseAdmin();
  const seedCounts = countSeedItemsByType();
  const adhkarSeed = parseAdhkarFromSeedFile();
  const hadithSeed = parseArbaeenFromSeedFile();
  const sources = await getVerifiedSourcesDashboard(admin);

  const sections = {};
  const gaps = [];

  sections.adhkar = {
    seed_categories: adhkarSeed.categories.length,
    seed_items: adhkarSeed.items.length,
    db: await countTable(admin, "verified_adhkar_items"),
  };
  sections.hadith = {
    seed_items: hadithSeed.length,
    db: await countTable(admin, "verified_hadith_items"),
  };
  sections.provenance = await countTable(admin, "content_provenance");
  sections.global_refs = await countTable(admin, "global_content_refs", "verification_status");
  sections.auto_content = await countTable(admin, "auto_imported_content", "status");
  sections.seed_corpus = seedCounts.by_type;

  for (const key of SECTION_KEYS) {
    if (!sections[key]) {
      sections[key] = { seed: seedCounts.by_type[key] ?? 0, db: { total: 0, verified: 0 } };
    }
    const dbTotal = sections[key].db?.total ?? 0;
    const seedTotal = sections[key].seed ?? sections[key].seed_items ?? 0;
    if (dbTotal === 0 && seedTotal === 0) {
      gaps.push({ section: key, reason: "empty_section", priority: "high" });
    } else if (dbTotal > 0 && (sections[key].db?.verified ?? 0) === 0) {
      gaps.push({ section: key, reason: "unverified_content", priority: "medium" });
    }
  }

  const totals = {
    sources_total: sources.total,
    sources_active: sources.active,
    seed_corpus_total: seedCounts.total,
    gaps_count: gaps.length,
    verified_adhkar: sections.adhkar.db.verified,
    verified_hadith: sections.hadith.db.verified,
    provenance_verified: sections.provenance.verified,
  };

  const recommendations = [];
  if (gaps.length > 0) {
    recommendations.push("تشغيل محرك الاستيراد الموثق لملء الأقسام الفارغة");
  }
  if (sources.active < sources.total) {
    recommendations.push("تفعيل المصادر الرسمية المعطّلة بعد التحقق من RSS/API");
  }
  if (sections.provenance.verified < sections.provenance.total * 0.5) {
    recommendations.push("رفع نسبة التوثيق عبر مراجعة طابور needs_review");
  }

  const report = {
    ok: true,
    at: new Date().toISOString(),
    report_date: new Date().toISOString().slice(0, 10),
    sections,
    totals,
    gaps,
    recommendations,
    sources,
  };

  if (admin) {
    try {
      await admin.from("knowledge_quality_reports").upsert(
        {
          report_date: report.report_date,
          report_type: "daily",
          sections,
          totals,
          gaps,
          recommendations,
        },
        { onConflict: "report_date,report_type" },
      );
    } catch {
      /* table may not exist yet */
    }
  }

  return report;
}

export async function getLatestQualityReport(admin) {
  admin = admin ?? getSupabaseAdmin();
  if (!admin) return generateKnowledgeQualityReport(null);
  try {
    const { data } = await admin
      .from("knowledge_quality_reports")
      .select("*")
      .order("report_date", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) return { ok: true, ...data };
  } catch {
    /* fall through */
  }
  return generateKnowledgeQualityReport(admin);
}
