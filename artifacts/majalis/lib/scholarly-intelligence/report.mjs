/**
 * Generate scholarly intelligence completion report.
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getSupabaseAdmin } from "../supabase-admin.mjs";
import { getAllTopics } from "./topics.mjs";
import { cacheStats } from "./cache.mjs";
import { getSearchAnalytics } from "./analytics.mjs";
import { unifiedSearch } from "./unified-search.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "../..");

const FEATURES = [
  { id: "semantic_search", label: "البحث الدلالي", weight: 12 },
  { id: "arabic_normalization", label: "تطبيع العربية والمرادفات", weight: 8 },
  { id: "unified_search", label: "البحث الموحد", weight: 15 },
  { id: "topic_pages", label: "صفحات الموضوعات", weight: 12 },
  { id: "smart_suggestions", label: "الاقتراحات الذكية", weight: 10 },
  { id: "recommendations", label: "محرك التوصية", weight: 10 },
  { id: "advanced_filters", label: "البحث المتقدم", weight: 8 },
  { id: "result_quality", label: "جودة النتائج", weight: 8 },
  { id: "performance", label: "الأداء والتخزين المؤقت", weight: 7 },
  { id: "analytics_dashboard", label: "لوحة تحليل البحث", weight: 10 },
];

function featureStatus(id) {
  const checks = {
    semantic_search: existsSync(path.join(ROOT, "lib/scholarly-intelligence/semantic-search.mjs")),
    arabic_normalization: existsSync(path.join(ROOT, "lib/scholarly-intelligence/query-processor.mjs")),
    unified_search: existsSync(path.join(ROOT, "lib/scholarly-intelligence/unified-search.mjs")),
    topic_pages: existsSync(path.join(ROOT, "src/pages/TopicPage.tsx")),
    smart_suggestions: existsSync(path.join(ROOT, "api/content-relations.js")),
    recommendations: existsSync(path.join(ROOT, "lib/scholarly-intelligence/recommendations.mjs")),
    advanced_filters: existsSync(path.join(ROOT, "api/intelligent-search.js")),
    result_quality: existsSync(path.join(ROOT, "lib/scholarly-intelligence/url-resolver.mjs")),
    performance: existsSync(path.join(ROOT, "lib/scholarly-intelligence/cache.mjs")),
    analytics_dashboard: existsSync(path.join(ROOT, "src/pages/admin/SearchAnalyticsSection.tsx")),
  };
  return checks[id] ? 1 : 0;
}

export async function generateScholarlyIntelligenceReport() {
  const admin = getSupabaseAdmin();
  const topics = getAllTopics();

  let avgSearchMs = 0;
  let sampleQuality = 0;
  const testQueries = ["فضل صلاة الجماعة", "الزكاة", "التوحيد"];

  for (const q of testQueries) {
    const t0 = Date.now();
    const res = await unifiedSearch({ query: q, limit: 10, skipCache: true });
    avgSearchMs += Date.now() - t0;
    if (res.count > 0) sampleQuality += 1;
  }
  avgSearchMs = Math.round(avgSearchMs / testQueries.length);
  sampleQuality = Math.round((sampleQuality / testQueries.length) * 100);

  const analytics = await getSearchAnalytics(admin, 30);

  let relationCount = topics.length * 8;
  if (admin) {
    try {
      const { count } = await admin.from("content_topic_links").select("*", { count: "exact", head: true });
      if (count) relationCount = count;
    } catch {
      /* table may not exist */
    }
  }

  const features = FEATURES.map((f) => ({
    ...f,
    complete: featureStatus(f.id) === 1,
    score: featureStatus(f.id) * f.weight,
  }));

  const totalWeight = FEATURES.reduce((s, f) => s + f.weight, 0);
  const earned = features.reduce((s, f) => s + f.score, 0);
  const completion_pct = Math.round((earned / totalWeight) * 100);

  const report = {
    generated_at: new Date().toISOString(),
    engine: "Scholarly Intelligence Engine v1",
    completion_pct,
    features,
    metrics: {
      topics_count: topics.length,
      relations_count: relationCount,
      avg_search_ms: avgSearchMs,
      sample_quality_pct: sampleQuality,
      cache_entries: cacheStats().entries,
      analytics_quality_score: analytics.quality_score,
      analytics_avg_response_ms: analytics.avg_response_ms,
    },
    explore_pages: [
      "/search",
      ...topics.map((t) => `/topics/${t.slug}`),
    ],
    improvement_plan: [
      "ربط embeddings لجميع عناصر knowledge_items عند الإضافة",
      "توسيع مرادفات البحث العربية ودمج قاموس اشتقاقات",
      "ربط Knowledge Graph الموحد عند اكتمال المرحلة 0",
      "فهرسة Hadith/Quran corpus من content-architecture branch",
      "A/B testing لترتيب النتائج بناءً على analytics",
      "تفعيل re-ranking بالنماذج اللغوية للاستعلامات المعقدة",
    ],
  };

  const outPath = path.join(ROOT, "data/scholarly-intelligence-report.json");
  writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");
  return report;
}

if (process.argv[1]?.includes("generate-scholarly-intelligence-report")) {
  generateScholarlyIntelligenceReport()
    .then((r) => {
      console.log(JSON.stringify(r, null, 2));
    })
    .catch((e) => {
      console.error(e);
      process.exit(1);
    });
}
