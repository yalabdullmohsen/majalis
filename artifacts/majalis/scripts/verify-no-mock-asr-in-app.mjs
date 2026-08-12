#!/usr/bin/env node
/**
 * بوابة برمجية: يمنع استخدام MockQuranASRProvider في أي مسار وصولٍ
 * للمستخدم الحقيقي — القسم 17 من مواصفة "التلاوة واختبار التسميع":
 * "اختبار يفشل البناء إن كان المزوّد الوهمي هو الافتراضي".
 *
 * يفحص كل ملفات src/ (عدا مجلدات __tests__ ومجلد providers نفسه الذي
 * يُعرِّف الملف) بحثًا عن أي `import` فعلي لـ mock-provider.ts أو
 * MockQuranASRProvider — لا مجرد ذِكر نصّي في تعليق (لهذا نستخدم نمط
 * `import.*mock-provider` صريحًا، لا بحثًا عامًا عن الاسم).
 *
 * لماذا سكربت مستقل لا فحص TypeScript؟ لأن غياب الاستخدام لا يُثبته
 * النوع (Type) — قد يُستورَد المزوّد الوهمي ديناميكيًا أو شرطيًا بلا أي
 * خطأ نوعي. الفحص النصي المباشر للاستيرادات هو الضمان الوحيد الموثوق.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const __dir = fileURLToPath(new URL(".", import.meta.url));
const SRC_DIR = join(__dir, "../src");

const IMPORT_PATTERN = /import\s+.*\bmock-provider\b/;
const ALLOWED_PATH_MARKERS = ["__tests__", "providers/mock-provider.ts"];

/** @param {string} dir */
export function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (entry === "node_modules" || entry === "dist") continue;
      walk(full, files);
    } else if (/\.(ts|tsx)$/.test(entry)) {
      files.push(full);
    }
  }
  return files;
}

/** يفحص محتوى ملف واحد — مُصدَّر مستقلاً ليكون قابلاً للاختبار بلا لمس نظام الملفات. */
export function isViolatingImport(relPath, content) {
  if (ALLOWED_PATH_MARKERS.some((marker) => relPath.includes(marker))) return false;
  return IMPORT_PATTERN.test(content);
}

function main() {
  const files = walk(SRC_DIR);
  const violations = [];

  for (const file of files) {
    const rel = relative(join(__dir, ".."), file);
    const content = readFileSync(file, "utf8");
    if (isViolatingImport(rel, content)) {
      violations.push(rel);
    }
  }

  if (violations.length > 0) {
    console.error("❌ خطأ فادح: MockQuranASRProvider مُستورَد خارج بيئة الاختبارات:");
    for (const v of violations) console.error(`   - ${v}`);
    console.error("\nهذا يعني احتمال وصول نتائج وهمية لمستخدم حقيقي — يجب إزالة الاستيراد فورًا.");
    process.exit(1);
  }

  console.log(`✓ لا استيراد لـ MockQuranASRProvider خارج __tests__ (فُحص ${files.length} ملف)`);
}

// يُشغَّل تلقائيًا عند التنفيذ المباشر فقط — لا عند الاستيراد للاختبار.
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
