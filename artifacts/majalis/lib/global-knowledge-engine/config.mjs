/** Global Knowledge Engine (GKE) — central configuration */

export const GKE_VERSION = "1.1.0";
export const GKE_PHASE = 2;

/** Shadow Mode — no auto-publish until production criteria met */
export const GKE_SHADOW_MODE = true;

/** Minimum reputation for auto-publish (disabled while shadow mode on) */
export const GKE_AUTO_PUBLISH_MIN_REPUTATION = 85;

/** Phased integration — only enabled kinds are acquired */
export const GKE_INTEGRATION_PHASES = [
  { phase_order: 1, content_kind: "lesson", label_ar: "الدروس", enabled: true, shadow_only: true },
  { phase_order: 2, content_kind: "circle", label_ar: "الحلقات", enabled: false, shadow_only: true },
  { phase_order: 3, content_kind: "course", label_ar: "الفرص العلمية", enabled: false, shadow_only: true },
  { phase_order: 4, content_kind: "calendar", label_ar: "التقويم", enabled: false, shadow_only: true },
  { phase_order: 5, content_kind: "library", label_ar: "الكتب", enabled: false, shadow_only: true },
  { phase_order: 6, content_kind: "article", label_ar: "المقالات", enabled: false, shadow_only: true },
  { phase_order: 7, content_kind: "research", label_ar: "الأبحاث", enabled: false, shadow_only: true },
];

/** Pipeline layer identifiers — order matters */
export const GKE_LAYERS = [
  { id: "source_registry", label: "Source Registry", phase: 2 },
  { id: "fetch_engine", label: "Fetch Engine", phase: 3 },
  { id: "parser_engine", label: "Parser Engine", phase: 3 },
  { id: "normalization_engine", label: "Normalization Engine", phase: 3 },
  { id: "ai_classification_engine", label: "AI Classification Engine", phase: 4 },
  { id: "deduplication_engine", label: "Deduplication Engine", phase: 5 },
  { id: "quality_engine", label: "Quality Engine", phase: 4 },
  { id: "review_queue", label: "Review Queue", phase: 4 },
  { id: "cms_dispatcher", label: "Smart CMS", phase: 6 },
  { id: "search_index", label: "Search Index", phase: 7 },
];

/** Minimum quality score (0–100) before auto-publish consideration */
export const GKE_QUALITY_THRESHOLD = 72;

/** Supported fetch connector types (extensible via plugin registry) */
export const GKE_FETCH_TYPES = [
  "rss",
  "xml",
  "json",
  "rest",
  "graphql",
  "html",
  "pdf",
  "docx",
  "csv",
  "excel",
  "zip",
  "instagram",
  "youtube",
  "telegram",
  "sitemap",
  "website",
];

/** CMS content kinds GKE can route to (no cross-section placement) */
export const GKE_CMS_KINDS = [
  "lesson",
  "course",
  "library",
  "article",
  "research",
  "sheikh",
  "fatwa",
  "permanent_committee_fatwa",
  "qa",
  "circle",
  "quran",
  "adhkar",
  "update",
  "fiqh_decision",
  "sharia_ruling",
  "learning_path",
];

/** Delegates to existing stacks — zero duplication */
export const GKE_DELEGATES = {
  source_registry: ["majlis-knowledge-engine/source-registry", "ake_connectors"],
  fetch_engine: ["auto-knowledge-engine/connectors", "cms/connectors", "autonomous-platform/fetch"],
  parser_engine: ["content-pipeline/runner"],
  ai_classification: ["knowledge-engine/ai-analyzer"],
  deduplication: ["auto-knowledge-engine/v2/unified-dedup"],
  quality: ["auto-knowledge-engine/quality-gate", "knowledge-engine/quality"],
  review_queue: ["knowledge_items", "ake_job_queue"],
  cms_dispatcher: ["knowledge-engine/publisher", "cms/content-registry"],
  search_index: ["knowledge-engine/indexer", "scholarly-intelligence/unified-search"],
  orchestration: ["auto-knowledge-engine/continuous-cycle", "majlis-knowledge-engine/orchestrator"],
};
