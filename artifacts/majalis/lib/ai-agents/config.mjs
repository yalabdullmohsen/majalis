/**
 * AI Agents Platform — 6 independent agents for content lifecycle automation.
 * Each agent logs to governance_audit_log. No religious content published without verified source.
 */

export const AGENTS = {
  content_discovery: {
    id: "content_discovery",
    label: "Content Discovery Agent",
    label_ar: "وكيل اكتشاف المحتوى",
    description: "Fetches new content from trusted official sources",
    permission: "import",
  },
  source_verification: {
    id: "source_verification",
    label: "Source Verification Agent",
    label_ar: "وكيل التحقق من المصدر",
    description: "Verifies source URL, link integrity, and trust level",
    permission: "review.scientific",
  },
  knowledge_processing: {
    id: "knowledge_processing",
    label: "Knowledge Processing Agent",
    label_ar: "وكيل معالجة المعرفة",
    description: "Summarizes, classifies, extracts tags, links content",
    permission: "content.edit",
  },
  quality_assurance: {
    id: "quality_assurance",
    label: "Quality Assurance Agent",
    label_ar: "وكيل ضمان الجودة",
    description: "Checks duplicates, gaps, links, errors, images",
    permission: "review.editorial",
  },
  publishing: {
    id: "publishing",
    label: "Publishing Agent",
    label_ar: "وكيل النشر",
    description: "Publishes only verified content that passed all gates",
    permission: "publish",
  },
  monitoring: {
    id: "monitoring",
    label: "Monitoring Agent",
    label_ar: "وكيل المراقبة",
    description: "Monitors cron jobs, errors, performance, system health",
    permission: "audit.read",
  },
};

export const AGENT_IDS = Object.keys(AGENTS);

export const MIN_TRUST_FOR_PUBLISH = 85;
export const MIN_QUALITY_FOR_PUBLISH = 65;

/** Pipeline order — each stage must pass before next */
export const AGENT_PIPELINE = [
  "content_discovery",
  "source_verification",
  "knowledge_processing",
  "quality_assurance",
  "publishing",
  "monitoring",
];
