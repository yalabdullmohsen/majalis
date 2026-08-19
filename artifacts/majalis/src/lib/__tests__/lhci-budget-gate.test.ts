/**
 * بوابة: LHCI إلزامي في CI بعتبات انحدار واقعية.
 * تشغيل: node --import tsx src/lib/__tests__/lhci-budget-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const repo = resolve(root, "../..");
const rc = readFileSync(resolve(root, "lighthouserc.cjs"), "utf8");
const budget = readFileSync(resolve(root, "budget.json"), "utf8");
const vite = readFileSync(resolve(root, "vite.config.ts"), "utf8");
const pkg = readFileSync(resolve(root, "package.json"), "utf8");
const ci = readFileSync(resolve(repo, ".github/workflows/ci.yml"), "utf8");

assert.match(rc, /LHCI_URL/, "عنوان القياس قابل للضبط");
assert.match(rc, /formFactor:\s*"mobile"/, "قياس جوال");
assert.match(rc, /numberOfRuns:\s*3/, "٣ تشغيلات");
assert.match(rc, /throttlingMethod:\s*"simulate"/, "simulate كـ PSI");
assert.match(rc, /rttMs:\s*150/, "PSI RTT 150ms");
assert.match(rc, /throughputKbps:\s*1638\.4/, "PSI throughput Slow 4G");
assert.match(rc, /cpuSlowdownMultiplier:\s*4/, "PSI CPU ×4");
assert.match(rc, /"warn"[\s\S]*minScore:\s*0\.75/, "أداء 0.75 تحذير — ليس 0.99 حلماً");
assert.doesNotMatch(rc, /minScore:\s*0\.99/, "لا عتبة أداء حلم 0.99 تُفشل أو تُضلّل");
assert.match(rc, /categories:accessibility[\s\S]*minScore:\s*1/, "a11y = 1 خطأ");
assert.match(rc, /categories:best-practices[\s\S]*minScore:\s*1/, "BP = 1 خطأ");
assert.match(rc, /categories:seo[\s\S]*minScore:\s*1/, "SEO = 1 خطأ");
assert.match(
  rc,
  /largest-contentful-paint[\s\S]*maxNumericValue:\s*6000/,
  "LCP ≤6000ms خطأ — تثبيت فحص 12؛ يُخفَّض بعد perf/lcp-static-shell-v2",
);
assert.doesNotMatch(
  rc,
  /largest-contentful-paint[\s\S]*maxNumericValue:\s*8000/,
  "لا LCP 8000 — فحص 12 أثبت 5.7ث",
);
assert.match(rc, /total-blocking-time[\s\S]*maxNumericValue:\s*400/, "TBT ≤400ms خطأ — فحص 12 (330)");
assert.doesNotMatch(
  rc,
  /total-blocking-time[\s\S]*maxNumericValue:\s*850/,
  "عتبة TBT 850 أوسع من الواقع بعد فحص 12",
);
assert.match(
  rc,
  /first-contentful-paint[\s\S]*maxNumericValue:\s*2200/,
  "FCP ≤2200ms خطأ — فحص 12 (2000)",
);
assert.match(
  rc,
  /speed-index[\s\S]*maxNumericValue:\s*2500/,
  "SI ≤2500ms خطأ — فحص 12 (2000)",
);
assert.match(
  rc,
  /cumulative-layout-shift[\s\S]*maxNumericValue:\s*0\.02/,
  "CLS ≤0.020 خطأ — فحص 12 (0.006) مع هامش",
);
assert.doesNotMatch(rc, /maxNumericValue:\s*0\.048/, "لا CLS 0.048 — فحص 12 عند 0.006");
assert.match(rc, /"dom-size"[\s\S]*maxNumericValue:\s*1200/, "DOM ≤1200 خطأ");
assert.match(
  rc,
  /render-blocking-resources[\s\S]*maxNumericValue:\s*200/,
  "حظر عرض ≤200ms خطأ — فحص 12 PASSED",
);
assert.match(rc, /"unused-css-rules"/, "تأكيد unused-css خام (warn؛ numericValue بالمللي ثانية)");
assert.match(rc, /"unused-javascript"/, "تأكيد unused-js خام (warn؛ numericValue بالمللي ثانية)");
assert.match(rc, /"forced-reflow-insight"/, "تأكيد إعادة التدفق الإلزامية (warn حتى الإصلاح)");
assert.doesNotMatch(rc, /budgetFile/, "ميزانية الموارد ليست خطأ دمج في هذه الدفعة");
assert.match(budget, /"budget":\s*150/, "JS موثّق ≤150KiB (غير ملزم بعد)");
assert.match(vite, /sourcemap:\s*"hidden"/, "sourcemap مخفي");
assert.match(pkg, /strip:sourcemaps/, "حذف الخرائط بعد البناء");
assert.match(pkg, /"lighthouse:ci"/, "أمر قياس");
assert.match(pkg, /@lhci\/cli@0\.15\./, "إصدار LHCI منشور على npm");

assert.match(ci, /name: LHCI home \(mobile\)/, "وظيفة LHCI في ci.yml");
assert.match(ci, /lhci-home/, "معرّف الوظيفة lhci-home");
assert.match(
  ci,
  /name: Verify build[\s\S]*- lhci-home/,
  "Verify build ينتظر LHCI — الفحص إلزامي لا اختياري",
);
assert.match(
  ci,
  /check_req "lhci-home" "\$NEED_BUILD"/,
  "Verify build يفشل إن فشل LHCI عند وجود بناء",
);

console.log("lhci-budget-gate.test.ts: ok");
