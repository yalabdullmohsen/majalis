/**
 * بوابة رئيسية: تغطية أبعاد تدقيق المحتوى الستة + منع نصوص ناقصة ظاهرة.
 * تشغيل: node --import tsx src/lib/__tests__/content-audit-master-gate.test.ts
 *
 * الأبعاد: ترتيب · هندسة · تحسين · تنظيف · تدقيق · تصحيح
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  CONTENT_AUDIT_DIMENSIONS,
  CONTENT_AUDIT_GATES,
} from "../content-audit/master-audit-catalog";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

for (const dim of CONTENT_AUDIT_DIMENSIONS) {
  const gates = CONTENT_AUDIT_GATES.filter((g) => g.dimension === dim);
  assert.ok(gates.length >= 2, `البُعد «${dim}» يحتاج ≥2 بوابات (الآن ${gates.length})`);
}

const seen = new Set<string>();
for (const g of CONTENT_AUDIT_GATES) {
  assert.equal(seen.has(g.id), false, `معرّف بوابة مكرر: ${g.id}`);
  seen.add(g.id);
  const abs = resolve(root, g.path);
  assert.ok(existsSync(abs), `ملف البوابة مفقود: ${g.path}`);
}

const pkg = JSON.parse(read("package.json")) as { scripts?: Record<string, string> };
const scripts = pkg.scripts || {};
assert.match(String(scripts["test:content-audit-gates"] || ""), /content-audit/, "سلسلة content-audit-gates");
assert.match(String(scripts["test:content-audit-master"] || ""), /content-audit-master-gate/, "أمر master مسجّل");
assert.match(String(scripts["test:framed-chrome"] || ""), /framed-chrome-gate/, "أمر الإطار مسجّل");
assert.match(String(scripts["test:ci-unit"] || ""), /test:content-audit-master/, "ci-unit يشغّل master");
assert.match(String(scripts["test:ci-unit"] || ""), /test:lesson-unified-card/, "ci-unit يشغّل بطاقة الدرس");

/** نصوص ممنوعة في صفحات مفهرسة / بذور حية — مُركَّبة حتى لا تُلتقط كظهور حرفي في ملف البوابة */
const FORBIDDEN = [
  ["المصدر", "قيد", "الإضافة"].join(" "),
  ["قيد", "الإضافة"].join(" "),
  ["info@", "majlisilm", ".com"].join(""),
  ["المجلس", "العلمي"].join(" "),
];

const scanRoots = [
  resolve(root, "src/data"),
  resolve(root, "src/lib"),
  resolve(root, "public/data"),
];
const skipDir = new Set(["node_modules", "dist", "__tests__", "migrations", "backup", "backups"]);

function walk(dir: string, out: string[] = []): string[] {
  if (!existsSync(dir)) return out;
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith(".")) continue;
    const p = resolve(dir, ent.name);
    if (ent.isDirectory()) {
      if (skipDir.has(ent.name) || /backup|deleted|sample|trial|import/i.test(ent.name)) continue;
      walk(p, out);
    } else if (/\.(ts|tsx|json|md)$/.test(ent.name) && !ent.name.includes(".test.")) {
      out.push(p);
    }
  }
  return out;
}

const files = scanRoots.flatMap((d) => walk(d));
assert.ok(files.length > 50, `ملفات مسح المحتوى ≥50 (الآن ${files.length})`);

const hits: string[] = [];
for (const file of files) {
  const text = readFileSync(file, "utf8");
  // استثناء كتالوج الأسماء المحظورة نفسه
  if (file.endsWith("site.config.json") || file.includes("site-config")) continue;
  if (file.includes("forbidden") || file.includes("identity")) continue;
  if (file.includes("__tests__")) continue;
  for (const phrase of FORBIDDEN) {
    if (text.includes(phrase)) {
      hits.push(`${file.replace(root + "/", "")}: ${phrase}`);
    }
  }
}

assert.equal(hits.length, 0, `نصوص ناقصة/هوية قديمة في المحتوى:\n${hits.slice(0, 20).join("\n")}`);

console.log(
  `content-audit-master-gate: ok — ${CONTENT_AUDIT_GATES.length} بوابة عبر ${CONTENT_AUDIT_DIMENSIONS.length} أبعاد · مسح ${files.length} ملفًا`,
);
