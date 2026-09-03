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
  {
    id: "b044-affinity",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b044-affinity-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b045-dawah-mustalah",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b045-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b046-sahabah",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b046-sahabah-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b047-history-glossary",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b047-history-glossary-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b048-mamluk-glossary",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b048-mamluk-glossary-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b049-andalus-ottoman-glossary",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b049-andalus-ottoman-glossary-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b050-quran-people",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b050-quran-people-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b051-fiqh-filler",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b051-fiqh-filler-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b052-tafsir-knowledge",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b052-tafsir-knowledge-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b053-prophets-knowledge",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b053-prophets-knowledge-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b054-nations-knowledge",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b054-nations-knowledge-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b055-discover-islam",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b055-discover-islam-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b056-intro-history",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b056-intro-history-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b057-lesson-filler",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b057-lesson-filler-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b058-courses-registry",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b058-courses-registry-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b059-coverage-matrix",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b059-coverage-matrix-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b064-maqasid-arabic-fiqh",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b064-maqasid-arabic-fiqh-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b065-dalail-non-hissiyya",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b065-dalail-non-hissiyya-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b066-fiqh-thin-doors",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b066-fiqh-thin-doors-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b067-muamalat-fihris",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b067-muamalat-fihris-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b068-daman-shufa-salam",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b068-daman-shufa-salam-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b069-full-fiqh-fihris",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b069-full-fiqh-fihris-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b070-queue-to-content",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b070-queue-to-content-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b071-sunnah-iman-bodies",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b071-sunnah-iman-bodies-gate.test.ts",
    kind: "node-tsx",
  },
  {
    id: "b072-tazkiya-bodies",
    dimension: "تدقيق",
    path: "src/lib/__tests__/content-audit-b072-tazkiya-bodies-gate.test.ts",
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
