/**
 * حوكمة نصية لسياسة تسريع الوكيل.
 * تمنع الدوران والاستكشاف المكرر وتخفيف البوابات وPR المتسلسل.
 * تشغيل: node --test scripts/__tests__/agent-throughput-policy.test.mjs
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { test } from "node:test";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const read = (rel) => readFileSync(resolve(root, rel), "utf8");

const PIPELINE =
  /Targeted Read\s*→\s*Plan\s*→\s*Patch\s*→\s*Focused Test\s*→\s*Full Verify/;

test("ملفات سياسة التسريع موجودة", () => {
  for (const rel of [
    "docs/AGENT_THROUGHPUT.md",
    "docs/CI_THROUGHPUT.md",
    "docs/REPO_INDEX.md",
    "AGENTS.md",
    ".cursor/rules/majlisilm-agent-throughput.mdc",
    ".cursor/rules/majlisilm-ci-safe.mdc",
  ]) {
    assert.equal(existsSync(resolve(root, rel)), true, `مفقود: ${rel}`);
  }
});

test("المسار الإلزامي موحّد في AGENTS + AGENT_THROUGHPUT + قاعدة Cursor", () => {
  assert.match(read("AGENTS.md"), PIPELINE);
  assert.match(read("docs/AGENT_THROUGHPUT.md"), PIPELINE);
  assert.match(read(".cursor/rules/majlisilm-agent-throughput.mdc"), PIPELINE);
});

test("يمنع patch تخميني قبل قراءة الملف كاملًا", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  assert.match(throughput, /كاملًا.*قبل تعديله|قبل تعديله.*كاملًا|ممنوع patch من مقتطف/);
  assert.match(rule, /كاملًا قبل تعديله|قبل تعديله/);
  assert.match(throughput, /ممنوع patch تقريبي|ممنوع patch من مقتطف|ممنوع.*تخمين/);
});

test("يمنع إعادة الاستكشاف الشامل بعد تحديد النطاق", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const agents = read("AGENTS.md");
  assert.match(throughput, /ممنوع بحث عام|لا تُعِد استكشاف|ممنوع إعادة `rg`/);
  assert.match(agents, /لا استكشاف شامل بعد تحديد النطاق/);
});

test("يمنع تعديل بوابة جودة لتلائم تنفيذًا فاشلًا دون إثبات", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  assert.match(
    throughput,
    /gate\/threshold\/baseline\/snapshot|gate\/threshold\/baseline/,
  );
  assert.match(throughput, /لا[\s*]*تعدّل gate|تعدّل gate\/threshold|ممنوع تعديل gate/i);
  assert.match(
    throughput,
    /دليل قابل لإعادة الإنتاج|دليل عقد|دليل قابل لإعادة الإنتاج/,
  );
  assert.match(throughput, /مساوٍ أو أشد|جودة ≥|معيار الجودة مساو/);
  assert.match(ciSafe, /gate\/threshold\/baseline\/snapshot/);
  assert.match(rule, /ممنوع تعديل gate/);
  assert.doesNotMatch(throughput, /continue-on-error[\s\S]{0,40}مسموح لإخفاء/);
});

test("يفرض Focused Test قبل Full Verify ويمنع تكرار verify:ci بلا تغيير", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const agents = read("AGENTS.md");
  assert.match(throughput, /Focused Test/);
  assert.match(throughput, /ممنوع `verify:ci` بعد كل تعديل صغير/);
  assert.match(throughput, /verify:ci` \*\*مرة واحدة\*\*|مرة واحدة/);
  assert.match(
    throughput,
    /أعد `verify:ci` فقط إذا تغيّرت ملفات|أعده فقط إذا تغيّرت ملفات/,
  );
  assert.match(rule, /ممنوع `verify:ci` بعد كل تعديل صغير/);
  assert.match(agents, /اختبارات مستهدفة.*قبل `verify:ci`|verify:preflight` قبل `verify:ci`/);
});

test("يمنع PR متسلسل للمهمة نفسها", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const agents = read("AGENTS.md");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  assert.match(throughput, /PR واحد لكل مهمة/);
  assert.match(agents, /PR واحد لكل مهمة/);
  assert.match(ciSafe, /PR واحد بهدف واحد/);
  assert.match(throughput, /follow-up|مطلب مستقل/);
});

test("يعرّف شروط توقف تمنع الدوران وإعادة المحاولة غير المحدودة", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  assert.match(throughput, /مرة واحدة فقط/);
  assert.match(throughput, /توقّف|توقف/);
  assert.match(throughput, /شروط التوقف/);
  assert.match(rule, /فشلين|توقّف/);
  assert.match(throughput, /تخفيف بوابة جودة/);
});

test("REPO_INDEX وCI_THROUGHPUT يشيران لسياسة التسريع دون إضعاف CI", () => {
  const index = read("docs/REPO_INDEX.md");
  const ci = read("docs/CI_THROUGHPUT.md");
  assert.match(index, /AGENT_THROUGHPUT/);
  assert.match(index, /majlisilm-agent-throughput\.mdc/);
  assert.match(index, /Finalization Freeze|IMPLEMENTATION_FROZEN|verify:preflight/);
  assert.match(ci, /Focused Test.*verify:ci` مرة واحدة|verify:preflight.*verify:ci/);
  assert.match(ci, /AGENT_THROUGHPUT/);
  assert.match(ci, /Finalization Freeze|IMPLEMENTATION_FROZEN/);
  assert.doesNotMatch(ci, /تخفيف بوابة.*مسموح بلا دليل/);
});

test("الحوكمة مربوطة بـ test:safe-auto-merge وverify:ci", () => {
  const pkg = JSON.parse(read("package.json"));
  assert.match(pkg.scripts["test:safe-auto-merge"], /agent-throughput-policy\.test\.mjs/);
  assert.equal(pkg.scripts["verify:ci"], "node scripts/verify-ci.mjs");
  assert.equal(pkg.scripts["verify:preflight"], "node scripts/verify-preflight.mjs");
  assert.match(pkg.scripts["verify:ci-fast"], /verify:preflight/);
  assert.match(read("scripts/verify-ci.mjs"), /test:safe-auto-merge/);
  assert.equal(existsSync(resolve(root, "scripts/verify-preflight.mjs")), true);
});

test("Finalization Freeze: مراحل ومصدر إلزامي + IMPLEMENTATION_FROZEN", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const agents = read("AGENTS.md");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  assert.match(throughput, /Finalization Freeze Protocol/);
  assert.match(throughput, /IMPLEMENTATION_FROZEN/);
  assert.match(throughput, /Discovery/);
  assert.match(throughput, /Implementation/);
  assert.match(throughput, /Focused Verification/);
  assert.match(throughput, /Final Verification/);
  assert.match(throughput, /Delivery/);
  assert.match(rule, /IMPLEMENTATION_FROZEN/);
  assert.match(rule, /Finalization Freeze|Discovery/);
  assert.match(agents, /Finalization Freeze Protocol|IMPLEMENTATION_FROZEN/);
  assert.match(ciSafe, /IMPLEMENTATION_FROZEN|Finalization Freeze/);
});

test("يمنع البحث العام بعد IMPLEMENTATION_FROZEN", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  assert.match(throughput, /بعد الإعلان يُمنع[\s\S]{0,200}البحث العام|ممنوع[\s\S]{0,80}البحث العام/);
  assert.match(throughput, /Search Budget/);
  assert.match(throughput, /ممنوع البحث الشامل/);
  assert.match(rule, /ممنوع:[\s\S]{0,80}بحث عام|بحث عام/);
  assert.match(rule, /استعلام موجَّه واحد/);
});

test("يمنع توسيع Scope Manifest خلال التحقق", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  assert.match(throughput, /Scope Manifest/);
  assert.match(throughput, /يُجمَّد.*Manifest|بعد أول Patch[\s\S]{0,80}يُجمَّد/);
  assert.match(throughput, /تعديل ملفات خارج Scope Manifest/);
  assert.match(throughput, /منع توسيع النطاق/);
  assert.match(rule, /Scope Manifest/);
  assert.match(rule, /ملفات خارج الـManifest|خارج الـManifest/);
});

test("يمنع إصلاح الفشل السابق أو غير المرتبط (Failure Ownership B)", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  assert.match(throughput, /Failure Ownership/);
  assert.match(throughput, /Pre-existing|سابق\/غير مرتبط|B\. Pre-existing/);
  assert.match(throughput, /لا تصلحه/);
  assert.match(throughput, /origin\/main/);
  assert.match(throughput, /follow-up مستقل|سجّله follow-up/);
  assert.match(rule, /سابق\/غير مرتبط|Pre-existing|صنف B/);
  assert.match(ciSafe, /صنف B|سابق\/غير مرتبط/);
});

test("verify:ci لا يتكرر دون تغيير diff وpreflight يسبقه", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const agents = read("AGENTS.md");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  assert.match(throughput, /verify:preflight/);
  assert.match(throughput, /لا يُشغَّل `verify:ci` إلا بعد نجاح preflight/);
  assert.match(throughput, /مرة واحدة فقط إذا لم يتغير/);
  assert.match(rule, /verify:preflight/);
  assert.match(rule, /أعده فقط إذا تغيّر diff/);
  assert.match(agents, /verify:preflight.*verify:ci|verify:preflight/);
  assert.match(ciSafe, /verify:preflight/);
  assert.match(ciSafe, /لا يُشغَّل `verify:ci` إلا بعد نجاح/);
});

test("الفشل المستقل الثاني يتحول إلى follow-up وPatch Budget محدودة", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  assert.match(throughput, /Patch Budget/);
  assert.match(throughput, /فشل مستقل ثانٍ/);
  assert.match(throughput, /follow-up/);
  assert.match(throughput, /دورة تصحيح نهائية واحدة/);
  assert.match(rule, /فشل مستقل ثانٍ/);
  assert.match(rule, /دورة تصحيح نهائية واحدة/);
});

test("يمنع بدء Queued قبل إغلاق المهمة الحالية", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const agents = read("AGENTS.md");
  assert.match(throughput, /Queue Discipline/);
  assert.match(throughput, /لا تبدأ مهمة Queued|بدء عمل من قائمة Queued/);
  assert.match(throughput, /SUCCESS|BLOCKED_WITH_EVIDENCE/);
  assert.match(rule, /Queued/);
  assert.match(rule, /SUCCESS|BLOCKED_WITH_EVIDENCE/);
  assert.match(agents, /Queued/);
});

test("لا يعتبر العملية الطويلة معلقة لمجرد غياب stdout", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  assert.match(throughput, /غياب stdout/);
  assert.match(throughput, /لا تقتل العملية بمدة ثابتة|لا تقتل بمدة ثابتة/);
  assert.match(rule, /غياب stdout/);
  assert.match(ciSafe, /غياب stdout/);
});

test("بعد نجاح verify:ci ينتقل مباشرة إلى Delivery بلا تحليل إضافي", () => {
  const throughput = read("docs/AGENT_THROUGHPUT.md");
  const rule = read(".cursor/rules/majlisilm-agent-throughput.mdc");
  const ciSafe = read(".cursor/rules/majlisilm-ci-safe.mdc");
  assert.match(throughput, /Delivery \(بعد نجاح verify:ci\)|Delivery/);
  assert.match(throughput, /لا تعاود تحليل المشروع/);
  assert.match(rule, /انتقل فورًا إلى PR|Delivery/);
  assert.match(rule, /لا تحليل مشروع|لا.*تحسينات إضافية/);
  assert.match(ciSafe, /انتقل فورًا إلى Delivery/);
});
