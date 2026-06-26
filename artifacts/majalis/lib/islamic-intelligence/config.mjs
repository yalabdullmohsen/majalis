/**
 * Islamic Intelligence Platform — modular agent registry.
 * Each agent is independently pluggable via AGENTS map.
 */

export const AI_CONSTRAINTS = {
  metadataOnly: true,
  generatesReligiousText: false,
  generatesFatwa: false,
  generatesHadith: false,
  generatesAyah: false,
  requireSourceUrl: true,
  minTrustScore: 60,
  minQualityScore: 70,
};

export const AGENTS = {
  knowledge_auditor: {
    id: "knowledge_auditor",
    label: "AI Knowledge Auditor",
    label_ar: "مدقق المعرفة",
    schedule: "0 6 * * *",
    module: "./auditor.mjs",
    exportFn: "runKnowledgeAuditor",
    description: "Daily full-platform audit — empty pages, broken links, duplicates, stale content",
  },
  content_planner: {
    id: "content_planner",
    label: "AI Content Planner",
    label_ar: "مخطط المحتوى",
    schedule: "0 7 * * 1",
    module: "./planner.mjs",
    exportFn: "runContentPlanner",
    description: "Analyze gaps, search demand, and generate editorial work plans",
  },
  knowledge_discovery: {
    id: "knowledge_discovery",
    label: "AI Knowledge Discovery",
    label_ar: "اكتشاف المعرفة",
    schedule: "30 */6 * * *",
    module: "./discovery.mjs",
    exportFn: "runKnowledgeDiscovery",
    description: "Scan trusted sources for new books, fatwas, decisions, lessons",
  },
  relationship_builder: {
    id: "relationship_builder",
    label: "AI Relationship Builder",
    label_ar: "باني العلاقات",
    schedule: "0 10 * * *",
    module: "./relationships.mjs",
    exportFn: "runRelationshipBuilder",
    description: "Auto-link hadith↔ayah, fatwa↔decision, book↔author, lesson↔sheikh",
  },
  quality_scorer: {
    id: "quality_scorer",
    label: "AI Quality Score",
    label_ar: "مقياس الجودة",
    schedule: "0 8 * * *",
    module: "./quality.mjs",
    exportFn: "runQualityScoring",
    description: "Unified quality index — completeness, source, freshness, linking, classification",
  },
  security_assistant: {
    id: "security_assistant",
    label: "AI Security Assistant",
    label_ar: "مساعد الأمان",
    schedule: "0 2 * * 0",
    module: "./security.mjs",
    exportFn: "runSecurityAssistant",
    description: "Env, logs, DB performance, access anomalies, config review",
  },
  performance_optimizer: {
    id: "performance_optimizer",
    label: "AI Performance Optimizer",
    label_ar: "محسّن الأداء",
    schedule: "0 3 * * 0",
    module: "./performance.mjs",
    exportFn: "runPerformanceOptimizer",
    description: "Slow queries, pages, images, indexes, cache recommendations",
  },
  analytics: {
    id: "analytics",
    label: "AI Analytics",
    label_ar: "التحليلات",
    schedule: "0 */6 * * *",
    module: "./analytics.mjs",
    exportFn: "getIntelligenceAnalytics",
    description: "Top topics, search demand, enrichment needs, content growth",
  },
  weekly_report: {
    id: "weekly_report",
    label: "AI Weekly Report",
    label_ar: "التقرير الأسبوعي",
    schedule: "0 9 * * 1",
    module: "./weekly-report.mjs",
    exportFn: "generateWeeklyReport",
    description: "Weekly summary — new/updated content, reviews, sources, system health",
  },
};

export const AGENT_IDS = Object.keys(AGENTS);

export const HUMAN_REQUIRED = [
  { task: "مراجعة الفتاوى والأحكام الشرعية", reason: "الأحكام تتطلب تحققاً من عالم مختص" },
  { task: "اعتماد مصادر رسمية جديدة", reason: "تقييم الثقة يحتاج قرار إداري" },
  { task: "حل التعارضات العلمية", reason: "الاختلاف الفقهي يحتاج مرجعية معتمدة" },
  { task: "نشر محتوى دون مصدر موثق", reason: "لا يُنشر نص شرعي بلا مستند علمي" },
];

export const PERFORMANCE = {
  maxItemsPerAgent: 100,
  maxDurationMs: 55_000,
  cacheTtlMs: 300_000,
};
