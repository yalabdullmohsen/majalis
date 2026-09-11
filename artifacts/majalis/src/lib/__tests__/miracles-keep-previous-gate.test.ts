/**
 * بوابة: الإعجاز العلمي يعرض البذرة فورًا ويبقيها أثناء إعادة الجلب.
 * node --import tsx src/lib/__tests__/miracles-keep-previous-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/views/MiraclesPage.tsx");
assert.match(page, /filterMiraclesSeed\(\{\s*sourceType\s*\}\)/, "بذرة المسار فور الدخول");
assert.match(page, /loading\s*&&\s*items\.length\s*===\s*0/, "هيكل فقط بلا عناصر");
assert.doesNotMatch(
  page,
  /\(msg\)\s*=>\s*\{\s*setError\(msg\);\s*setItems\(\[\]\)/,
  "لا تفرّغ القائمة عند فشل إعادة الجلب",
);
assert.match(page, /keepContentWhileLoading/, "AsyncDataView يحتفظ بالمحتوى");
assert.match(page, /contentBusy=\{loading && items\.length > 0\}/, "aria-busy أثناء التحديث");

const asyncView = read("src/components/AsyncDataView.tsx");
assert.match(asyncView, /keepContentWhileLoading/, "دعم keepContent في AsyncDataView");
assert.match(
  asyncView,
  /\(status === "loading" \|\| status === "retrying"\) && !keepContentWhileLoading/,
  "لا هيكل كامل عند keepContent",
);

const polish = read("src/styles/sections-calm-polish.css");
/* الرجوع العائم مطلوب لبوابة section-back-button على /miracles — لا تُخفِه فوق TopicPage */
assert.doesNotMatch(
  polish,
  /body:has\(\.topic-page\)[\s\S]{0,180}?display:\s*none/,
  "لا إخفاء CSS للعائم فوق TopicPage",
);

const appBack = read("src/components/common/AppBackButton.tsx");
assert.doesNotMatch(
  appBack,
  /startsWith\("\/miracles"\)/,
  "AppBackButton لا يستثني /miracles من العائم",
);

const shell = read("src/styles/components/modern-section-shell.css");
assert.match(shell, /--mss-section-hero-bg/, "هيرو بطاقة سطح");
assert.match(shell, /\.topic-page__hero[\s\S]*?background-image:\s*none/, "بلا تدرّج ممتد");

console.log("miracles-keep-previous-gate.test.ts: ok");
