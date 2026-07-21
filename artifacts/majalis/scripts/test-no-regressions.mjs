#!/usr/bin/env node
/**
 * اختبار انحدار دائم يُشغَّل ضمن سلسلة pnpm run build (يفشل البناء إن رسب) —
 * فحص ثابت على dist/ الفعلي، بلا حاجة لمتصفح أو خادم حي، فيبقى سريعًا
 * ومناسبًا للتشغيل التلقائي على كل push (نفس نمط test-dynamic-404-safety.mjs).
 *
 * يحرس ثلاثة انحدارات حقيقية وقعت واكتُشفت وأُصلحت هذه الجلسة:
 *
 * 1. "اختبارًا آليًا يمنع عودة مشكلة أن يعرض مسار داخلي محتوى الصفحة
 *    الرئيسية" — طلب صريح من المالك. يفحص عنوان <title> لكل صفحة
 *    مُصيَّرة مسبقًا (prerender) — أي مسار غير "/" يحمل عنوان الرئيسية
 *    نفسه حرفيًا هو انحدار حقيقي.
 * 2. بقايا قسم "الفتاوى" المحذوف (2026-07-17) — لا ينبغي أن يظهر مسار
 *    /fatwa كصفحة حقيقية بعد الآن (يجب أن يكون إعادة توجيه فقط).
 * 3. بقايا بيانات جامعة الأزهر المحذوفة (2026-07-17) من صفحات المعالم
 *    والمؤسسات المُصيَّرة مسبقًا.
 *
 * التشغيل بعد pnpm run build: node scripts/test-no-regressions.mjs
 */
import { existsSync, readdirSync, readFileSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const distDir = resolve(appRoot, "dist");

if (!existsSync(distDir)) {
  console.error("❌ dist/ غير موجود — شغّل pnpm run build أولًا.");
  process.exit(1);
}

function findIndexFiles(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === "assets" || entry.name === "data" || entry.name === "images") continue;
      findIndexFiles(full, out);
    } else if (entry.name === "index.html") {
      out.push(full);
    }
  }
  return out;
}

const indexFiles = findIndexFiles(distDir);
const failures = [];

function routeOf(file) {
  const rel = file.slice(distDir.length, -"/index.html".length);
  return rel === "" ? "/" : rel;
}
function titleOf(text) {
  const m = text.match(/<title>([^<]*)<\/title>/);
  return m ? m[1] : null;
}

const homeFile = indexFiles.find((f) => routeOf(f) === "/");
if (!homeFile) {
  failures.push("لا يوجد dist/index.html — لا يمكن مقارنة عنوان الرئيسية.");
} else {
  const homeTitle = titleOf(readFileSync(homeFile, "utf8"));
  for (const f of indexFiles) {
    const route = routeOf(f);
    if (route === "/") continue;
    const t = titleOf(readFileSync(f, "utf8"));
    if (t && homeTitle && t === homeTitle) {
      failures.push(`تسرّب محتوى الرئيسية: المسار ${route} يحمل عنوان الرئيسية نفسه حرفيًا ("${t}").`);
    }
  }
}

// ── بقايا قسم الفتاوى المحذوف ──────────────────────────────────────────────
const fatwaFile = indexFiles.find((f) => routeOf(f) === "/fatwa");
if (fatwaFile) {
  const text = readFileSync(fatwaFile, "utf8");
  // إعادة توجيه SPA لا تُنتج prerender حقيقيًا لهذا المسار عادة؛ إن وُجد ملف
  // ومحتواه عنوان صفحة "فتوى" حقيقي (لا صفحة الفقه التي يُعاد التوجيه إليها) فهذا انحدار.
  if (/الفتاوى الشرعية|مركز الفتاوى/u.test(text)) {
    failures.push("مسار /fatwa ما زال يُصيَّر كصفحة فتاوى حقيقية بعد حذف القسم — تحقّق من إعادة التوجيه.");
  }
}

// ── بقايا بيانات جامعة الأزهر المحذوفة ──────────────────────────────────────
const AZHAR_CHECK_ROUTES = ["/universities", "/institutions"];
for (const route of AZHAR_CHECK_ROUTES) {
  const f = indexFiles.find((x) => routeOf(x) === route);
  if (f && readFileSync(f, "utf8").includes("الأزهر")) {
    failures.push(`مسار ${route} المُصيَّر مسبقًا ما زال يذكر "الأزهر" رغم حذفه من البيانات.`);
  }
}

console.log(`فُحص: ${indexFiles.length} صفحة مُصيَّرة مسبقًا.`);

if (failures.length) {
  console.error(`\n❌ فشل اختبار الانحدار (${failures.length}):`);
  for (const f of failures) console.error(`   ${f}`);
  process.exit(1);
}

console.log("✓ لا تسرّب لمحتوى الرئيسية، ولا بقايا فتاوى أو أزهر محذوفة.");
