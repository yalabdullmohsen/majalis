#!/usr/bin/env node
/**
 * اختبار حوكمة المحتوى — يمنع عودة الادعاءات الكاذبة.
 *
 * المبدأ: لا تُعرض كلمة «موثّق» أو «معتمد» أو «مراجَع» إلا على محتوى راجعه إنسان
 * مُسمّى وله مصدر خارجي. وكل ما عدا ذلك «قيد المراجعة».
 *
 * يفشل الاختبار إذا:
 *   ١) وُجد سجل في بيانات الأحكام بحالة approved/verified بلا reviewed_by.
 *   ٢) اعتمدت شارة توثيق على شرط لا يتضمن مراجِعًا بشريًا (reviewed_by وما يقابله).
 *   ٣) وُجد Math.random() في أي سكربت توليد محتوى.
 *   ٤) وُجد is_verified: true بلا sources في sheikhs-seed.
 *
 * التشغيل: node scripts/test-content-governance.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");

const failures = [];
const warnings = [];
let checks = 0;

function fail(test, message) {
  failures.push(`${test}: ${message}`);
}
function pass(test, message) {
  checks += 1;
  console.log(`  ✓ ${test} — ${message}`);
}
function warn(message) {
  warnings.push(message);
}
function read(rel) {
  const abs = path.resolve(ROOT, rel);
  return fs.existsSync(abs) ? fs.readFileSync(abs, "utf8") : null;
}

// ───────────────────────────────────────────────────────────────────────────
// ١) بيانات الأحكام: لا approved/verified بلا reviewed_by
// ───────────────────────────────────────────────────────────────────────────
const APPROVED_STATES = new Set(["approved", "verified", "published"]);

function checkRulingsData() {
  const TEST = "rulings-data";
  const chunksDir = path.resolve(ROOT, "public/data/rulings-encyclopedia/chunks");
  const records = [];

  if (fs.existsSync(chunksDir)) {
    for (const file of fs.readdirSync(chunksDir).filter((f) => f.endsWith(".json"))) {
      const items = JSON.parse(fs.readFileSync(path.resolve(chunksDir, file), "utf8"));
      for (const item of items) records.push({ source: `chunks/${file}`, item });
    }
  } else {
    warn("لم يُعثر على public/data/rulings-encyclopedia/chunks — شغّل: node scripts/generate-rulings-encyclopedia.mjs");
  }

  // البذرة المولَّدة (تُستورد في التطبيق مباشرة)
  const seedSrc = read("src/lib/rulings-encyclopedia-seed.generated.ts");
  if (seedSrc) {
    const match = seedSrc.match(/=\s*(\[[\s\S]*\])\s*as unknown as ShariaRulingExtended\[\];/);
    if (match) {
      for (const item of JSON.parse(match[1])) {
        records.push({ source: "rulings-encyclopedia-seed.generated.ts", item });
      }
    }
  }

  if (records.length === 0) {
    fail(TEST, "لا توجد بيانات أحكام لفحصها — تحقّق من مسار البيانات");
    return;
  }

  const violations = records.filter(({ item }) => {
    const states = [item.status, item.verification_status].filter(Boolean);
    const claimsApproval = states.some((s) => APPROVED_STATES.has(String(s)));
    return claimsApproval && !item.reviewed_by;
  });

  if (violations.length > 0) {
    const sample = violations.slice(0, 5).map((v) => `${v.source} → ${v.item.external_key || v.item.id}`);
    fail(
      TEST,
      `${violations.length} سجلاً موسومًا approved/verified بلا reviewed_by. أمثلة:\n      ${sample.join("\n      ")}`,
    );
    return;
  }

  pass(TEST, `${records.length} سجلًا — لا اعتماد بلا مراجِع بشري`);

  // فحص إضافي: لا عدّادات تفاعل ملفّقة في البيانات المولَّدة
  const fabricated = records.filter(({ item }) => (item.view_count || 0) > 0 || (item.search_count || 0) > 0);
  if (fabricated.length > 0) {
    fail("rulings-counters", `${fabricated.length} سجلاً يحمل view_count/search_count غير صفري في بيانات مولَّدة (أرقام تفاعل ملفّقة)`);
  } else {
    pass("rulings-counters", "عدّادات المشاهدة/البحث تبدأ من صفر");
  }
}

// ───────────────────────────────────────────────────────────────────────────
// ٢) شارات التوثيق: كل ادّعاء توثيق مشروط بمراجِع بشري
// ───────────────────────────────────────────────────────────────────────────
/** عبارات تدّعي التوثيق/الاعتماد — لا تُعرض إلا بشرط مراجِع بشري. */
const CLAIM_RE = /محتوى موثّق|محتوى موثق|موثق من المصدر الرسمي|موثّق من المصدر الرسمي|>\s*معتمد\s*</;
/** رموز تدل على أن الشرط يتضمّن مراجِعًا بشريًا أو مصدرًا خارجيًا مُثبتًا. */
const REVIEWER_RE = /reviewed_by|reviewedAt|reviewed_at|verifiedBy|verified_by|approved_by|sources\?\./;

/** الملفات التي تعرض شارات توثيق للمحتوى العام. */
const BADGE_FILES = [
  "src/components/ScholarlyTrustBadge.tsx",
  "src/components/fiqh-council/FiqhVerifiedBadge.tsx",
  "src/components/seo/SheikhsPageClient.tsx",
];

function checkTrustBadges() {
  const TEST = "trust-badges";
  let ok = true;

  for (const rel of BADGE_FILES) {
    const src = read(rel);
    if (!src) {
      fail(TEST, `ملف الشارة مفقود: ${rel}`);
      ok = false;
      continue;
    }
    if (!CLAIM_RE.test(src)) continue; // لا ادّعاء توثيق في هذا الملف

    if (!REVIEWER_RE.test(src)) {
      fail(TEST, `${rel} يعرض شارة توثيق دون أي شرط على مراجِع بشري (reviewed_by / approved_by / sources)`);
      ok = false;
    }
  }

  // ScholarlyTrustBadge: يُمنع ربط «محتوى موثّق» بـ isApproved وحده.
  const stb = read("src/components/ScholarlyTrustBadge.tsx");
  if (stb) {
    if (/isApproved\s*\?[\s\S]{0,240}?محتوى موثّق/.test(stb)) {
      fail(TEST, "ScholarlyTrustBadge: «محتوى موثّق» معلّقة على isApproved وحدها — يلزم reviewedBy + reviewedAt + مصدر خارجي");
      ok = false;
    }
    if (!/reviewedAt/.test(stb) || !/hasExternalSource/.test(stb)) {
      fail(TEST, "ScholarlyTrustBadge: شرط التوثيق يجب أن يتضمن reviewedAt ومصدرًا خارجيًا (hasExternalSource)");
      ok = false;
    }
    if (!/ai_generated/.test(stb)) {
      fail(TEST, "ScholarlyTrustBadge: لا يوجد وسم للمحتوى المولَّد آليًا (provenance = ai_generated)");
      ok = false;
    }
  }

  // SheikhsPageClient: شارة «معتمد» مشروطة بوجود مصادر.
  const spc = read("src/components/seo/SheikhsPageClient.tsx");
  if (spc) {
    const badLine = spc
      .split("\n")
      .find((line) => /is_verified\s*&&/.test(line) && !/sources/.test(line));
    if (badLine) {
      fail(TEST, `SheikhsPageClient: شارة «معتمد» تعتمد على is_verified وحده:\n      ${badLine.trim()}`);
      ok = false;
    }
  }

  if (ok) pass(TEST, `${BADGE_FILES.length} ملفات شارات — كل ادّعاء توثيق مشروط بمراجِع/مصدر`);
}

// ───────────────────────────────────────────────────────────────────────────
// ٣) لا Math.random() في سكربتات توليد المحتوى
// ───────────────────────────────────────────────────────────────────────────
function contentGeneratorFiles() {
  const out = [];
  const scriptsDir = path.resolve(ROOT, "scripts");
  if (fs.existsSync(scriptsDir)) {
    for (const f of fs.readdirSync(scriptsDir)) {
      if (/^(generate|seed|import|build)-.*\.(mjs|js)$/.test(f)) out.push(`scripts/${f}`);
    }
  }
  const autoDir = path.resolve(ROOT, "lib/auto-content");
  if (fs.existsSync(autoDir)) {
    for (const f of fs.readdirSync(autoDir)) {
      if (f.endsWith(".mjs")) out.push(`lib/auto-content/${f}`);
    }
  }
  return out;
}

function checkNoRandomData() {
  const TEST = "no-fabricated-data";
  const files = contentGeneratorFiles();
  const hits = [];

  for (const rel of files) {
    const src = read(rel);
    if (!src) continue;
    src.split("\n").forEach((line, i) => {
      if (line.includes("Math.random(") && !line.trim().startsWith("//") && !line.trim().startsWith("*")) {
        hits.push(`${rel}:${i + 1} → ${line.trim()}`);
      }
    });
  }

  if (hits.length > 0) {
    fail(TEST, `Math.random() في سكربتات توليد المحتوى (بيانات ملفّقة):\n      ${hits.join("\n      ")}`);
    return;
  }
  pass(TEST, `${files.length} سكربت توليد — لا Math.random()`);
}

// ───────────────────────────────────────────────────────────────────────────
// ٤) sheikhs-seed: لا is_verified: true بلا sources
// ───────────────────────────────────────────────────────────────────────────
function checkSheikhsSeed() {
  const TEST = "sheikhs-seed";
  const rel = "src/lib/sheikhs-seed.ts";
  const src = read(rel);
  if (!src) {
    fail(TEST, `${rel} مفقود`);
    return;
  }

  // كل سجل يبدأ بـ id: — نفصل السجلات ونفحص كلًا منها.
  const records = src.split(/\n\s{2}\{\n/).slice(1);
  const violations = [];
  let verified = 0;

  for (const rec of records) {
    if (!/is_verified:\s*true/.test(rec)) continue;
    verified += 1;
    const sources = rec.match(/sources:\s*\[([\s\S]*?)\]/);
    const hasSources = Boolean(sources && sources[1].trim().length > 0);
    const hasReviewer = /reviewed_by:\s*["'`]\s*\S/.test(rec);
    if (!hasSources || !hasReviewer) {
      const name = (rec.match(/name:\s*"([^"]+)"/) || [])[1] || "(بلا اسم)";
      violations.push(`${name} — ${!hasSources ? "بلا sources" : ""}${!hasSources && !hasReviewer ? " و" : ""}${!hasReviewer ? "بلا reviewed_by" : ""}`);
    }
  }

  if (violations.length > 0) {
    fail(
      TEST,
      `${violations.length} عالمًا موسومًا is_verified: true بلا مصدر/مراجِع:\n      ${violations.slice(0, 5).join("\n      ")}`,
    );
    return;
  }
  pass(TEST, `${records.length} سجلًا — ${verified} موثّق بمصادر، لا اعتماد بلا مصدر`);
}

// ───────────────────────────────────────────────────────────────────────────
// ٥) لا نشر تلقائي للمحتوى الشرعي
// ───────────────────────────────────────────────────────────────────────────
function checkNoAutoPublish() {
  const TEST = "no-auto-publish";
  const rel = "lib/auto-content/auto-content-sync.mjs";
  const src = read(rel);
  if (!src) {
    fail(TEST, `${rel} مفقود`);
    return;
  }
  if (/record\.status\s*=\s*["']published["']/.test(src)) {
    fail(TEST, `${rel}: يضبط status = "published" آليًا — لا نشر بلا مراجعة بشرية`);
    return;
  }
  if (/record\.verification_status\s*=\s*["']verified["']/.test(src)) {
    fail(TEST, `${rel}: يضبط verification_status = "verified" آليًا — التوثيق لا يكون إلا بمراجعة بشرية`);
    return;
  }
  if (!/provenance/.test(src)) {
    fail(TEST, `${rel}: لا يضبط حقل provenance للمواد التي مرّت على نموذج لغوي`);
    return;
  }
  pass(TEST, "خط الاستيراد الآلي يحفظ كل مادة قيد المراجعة ويسم المولَّد آليًا");
}

// ───────────────────────────────────────────────────────────────────────────
console.log("\n اختبار حوكمة المحتوى — المجلس العلمي\n");

checkRulingsData();
checkTrustBadges();
checkNoRandomData();
checkSheikhsSeed();
checkNoAutoPublish();

for (const w of warnings) console.log(`  ⚠ ${w}`);

if (failures.length > 0) {
  console.error(`\n ✗ فشل ${failures.length} فحص حوكمة:\n`);
  for (const f of failures) console.error(`  ✗ ${f}`);
  console.error("");
  process.exit(1);
}

console.log(`\n ✓ اجتاز ${checks} فحص حوكمة\n`);
