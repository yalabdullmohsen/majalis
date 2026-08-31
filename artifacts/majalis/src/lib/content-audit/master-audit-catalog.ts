/**
 * فهرس بوابات تدقيق المحتوى — ستة أبعاد ثابتة.
 * أي بوابة جديدة تُسجَّل هنا ثم تُغطّى في content-audit-master-gate.
 */
export type ContentAuditDimension =
  | "ترتيب"
  | "هندسة"
  | "تحسين"
  | "تنظيف"
  | "تدقيق"
  | "تصحيح";

export type ContentAuditGate = {
  id: string;
  dimension: ContentAuditDimension;
  /** مسار نسبي من جذر artifacts/majalis */
  path: string;
  kind: "node-tsx" | "node" | "pnpm";
  /** أمر pnpm إن كان kind=pnpm */
  script?: string;
};

/** البوابات الإلزامية لكل بُعد — لا تُحذف دون بديل. */
export const CONTENT_AUDIT_GATES: ContentAuditGate[] = [
  // ترتيب — بنية الأقسام والمسارات
  {
    id: "sections-registry",
    dimension: "ترتيب",
    path: "src/lib/__tests__/content-audit-sections-registry-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "site-sections-final",
    dimension: "ترتيب",
    path: "src/lib/__tests__/site-sections-final-structure.test.ts",
    kind: "node-tsx",
  },
  // هندسة — مخطط وروابط وعمق كتالوج
  {
    id: "content-schema",
    dimension: "هندسة",
    path: "scripts/content-gates/test-content-schema.mjs",
    kind: "node",
  },
  {
    id: "content-links",
    dimension: "هندسة",
    path: "scripts/content-gates/test-content-links.mjs",
    kind: "node",
  },
  {
    id: "corpus-depth",
    dimension: "هندسة",
    path: "src/lib/__tests__/content-audit-corpus-depth-gate.test.ts",
    kind: "node-tsx",
  },
  // تحسين — جودة وعمق وموجات
  {
    id: "content-quality",
    dimension: "تحسين",
    path: "scripts/content-gates/test-content-quality.mjs",
    kind: "node",
  },
  {
    id: "content-depth",
    dimension: "تحسين",
    path: "src/lib/__tests__/content-depth-audit-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "wave4",
    dimension: "تحسين",
    path: "src/lib/__tests__/content-audit-wave4-gate.test.ts",
    kind: "node-tsx",
  },
  // تنظيف — تكرار وهوية محظورة
  {
    id: "content-dupes",
    dimension: "تنظيف",
    path: "scripts/content-gates/test-content-dupes.mjs",
    kind: "node",
  },
  {
    id: "char-integrity",
    dimension: "تنظيف",
    path: "src/lib/__tests__/content-audit-char-integrity-gate.test.ts",
    kind: "node-tsx",
  },
  // تدقيق — نصوص شرعية
  {
    id: "content-ayah",
    dimension: "تدقيق",
    path: "scripts/content-gates/test-content-ayah.mjs",
    kind: "node",
  },
  {
    id: "content-hadith",
    dimension: "تدقيق",
    path: "scripts/content-gates/test-content-hadith.mjs",
    kind: "node",
  },
  {
    id: "dawah-affinity",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-dawah-affinity-gate.test.ts",
    kind: "node-tsx",
  },
  // تصحيح — لغة وهوية ومصادر
  {
    id: "content-lang",
    dimension: "تصحيح",
    path: "scripts/content-gates/test-content-lang.mjs",
    kind: "node",
  },
  {
    id: "pre-launch",
    dimension: "تصحيح",
    path: "src/lib/__tests__/pre-launch-content-audit.test.ts",
    kind: "node-tsx",
  },
  {
    id: "framed-chrome",
    dimension: "تصحيح",
    path: "src/lib/__tests__/framed-chrome-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "lesson-unified-card",
    dimension: "تصحيح",
    path: "src/lib/__tests__/lesson-unified-card-layout-gate.test.ts",
    kind: "node-tsx",
  },
];

export const CONTENT_AUDIT_DIMENSIONS: ContentAuditDimension[] = [
  "ترتيب",
  "هندسة",
  "تحسين",
  "تنظيف",
  "تدقيق",
  "تصحيح",
];
