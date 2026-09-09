/**
 * بوابة: بطاقات الأقسام/المعجم واضحة في النهاري والليلي.
 * تشغيل: node --import tsx src/lib/__tests__/section-cards-theme-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const theme = read("src/styles/section-cards-theme.css");
const glossary = read("src/styles/pages/glossary.css");
const soft = read("src/styles/soft-cards.css");
const main = read("src/main.tsx");
const glossaryView = read("src/pages/account/ui/IslamicGlossaryView.tsx");
const arkanIman = read("src/styles/pages/arkan-iman.css");
const ulum = read("src/styles/pages/ulum-quran.css");

console.log("=== الربط ===");
assert.match(main, /section-cards-theme\.css/);

console.log("=== لا بطاقة بيضاء صلبة للمعجم ===");
assert.doesNotMatch(glossary, /\.gl-term\s*\{[^}]*background:\s*#fff/i);
assert.doesNotMatch(glossary, /\.gl-page\s*\{[^}]*background:\s*#F8FAFC/i);
assert.match(glossary, /\.gl-term[\s\S]*?--ss-card-bg|--color-surface/);
assert.match(glossary, /--bottom-nav-height/);
assert.match(glossary, /\.gl-term__arabic[\s\S]*?--color-text|--mj-ink/);

console.log("=== طبقة الثيم تغطي العائلات ===");
for (const cls of [
  "gl-term",
  "ai-card",
  "arkan-card",
  "twh-hub-card",
  "uq-fact-item",
  "tawheed-type-card",
  "jn-desc-card",
  "atl-card",
  "hs-card",
  "tf-card",
  "notif-card",
  "fiqh-council-category-card",
]) {
  assert.match(theme, new RegExp(`\\.${cls}`), `theme يشمل .${cls}`);
}
assert.match(theme, /html\.dark[\s\S]*?\.gl-term[\s\S]*?--mj-surface/);
assert.match(theme, /html\.dark[\s\S]*?\.gl-term__arabic[\s\S]*?--mj-ink/);
assert.match(theme, /html\.dark[\s\S]*?\.jn-desc-card[\s\S]*?--mj-surface/);
assert.match(theme, /html\.dark[\s\S]*?\.hs-card[\s\S]*?--mj-surface/);
assert.doesNotMatch(theme, /text-white\/[45]0|opacity:\s*0\.[345]\s*!important/);

console.log("=== soft-card--on-light ليلي ===");
assert.match(soft, /html\.dark\s+\.soft-card--on-light/);

console.log("=== مصادر العقيدة/علوم القرآن بدون #FFFFFF على البطاقة ===");
assert.doesNotMatch(arkanIman, /\.ai-card\s*\{[^}]*background:\s*#FFFFFF/i);
assert.match(arkanIman, /\.ai-card[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(ulum, /\.uq-fact-item[^{]*\{[^}]*#F0F7F4/);
assert.doesNotMatch(ulum, /\.uq-info-box[^{]*\{[^}]*#FFFBEB/);
assert.doesNotMatch(ulum, /\.uq-dalil-box[^{]*\{[^}]*#EEF2FF/);

console.log("=== رأس مصطلح قابل للضغط كزر ===");
assert.match(glossaryView, /<button[\s\S]*?className="gl-term__head"/);

console.log("=== مصادر الجنة/النار وأدب الطلب بلا #fff صلب على البطاقة ===");
const janna = read("src/styles/pages/janna-naar.css");
const atl = read("src/styles/pages/adab-talab-ilm.css");
const hs = read("src/styles/pages/hadith-mustalah.css");
assert.doesNotMatch(janna, /\.jn-desc-card\s*\{[^}]*background:\s*#fff/i);
assert.match(janna, /\.jn-desc-card[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(atl, /\.atl-card\s*\{[^}]*background:\s*#fff/i);
assert.match(atl, /\.atl-card[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(hs, /\.hs-search\s*\{[^}]*background:\s*#FFFFFF/i);
assert.match(hs, /\.hs-search[\s\S]*?--ss-card-bg/);

console.log("=== دليل المعالم/المؤسسات ضمن الثيم ===");
assert.match(theme, /\.ilm-card/);
assert.match(theme, /\.inst-card/);

console.log("=== زكاة / سنن يومية بلا #fff صلب على البطاقة ===");
const zakat = read("src/styles/pages/zakat.css");
const sunan = read("src/styles/pages/sunan-yawmiyya.css");
const arkanIslam = read("src/styles/pages/arkan-islam.css");
assert.doesNotMatch(zakat, /\.zk-card\s*\{[^}]*background:\s*#FFFFFF/i);
assert.match(zakat, /\.zk-card[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(sunan, /\.sy-card\s*\{[^}]*background:\s*#FFFFFF/i);
assert.match(sunan, /\.sy-card[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(arkanIslam, /\.arkan-related__link\s*\{[^}]*background:\s*#FFFFFF/i);
assert.match(arkanIslam, /\.arkan-related__link[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(arkanIslam, /rgba\(124,\s*58,\s*237/);
assert.match(theme, /\.zk-card/);
assert.match(theme, /\.sy-card/);
assert.match(theme, /html\.dark[\s\S]*?\.zk-card[\s\S]*?--mj-surface/);
assert.match(theme, /html\.dark[\s\S]*?\.sy-card[\s\S]*?--mj-surface/);

console.log("=== أعداد المحتوى: اختبارات وأسئلة غير صفرية ===");
const counts = JSON.parse(read("src/data/content-counts.json")) as {
  quizQuestions: number;
  qa: number;
};
assert.ok(counts.quizQuestions > 0, `quizQuestions=${counts.quizQuestions}`);
assert.ok(counts.qa > 0, `qa=${counts.qa}`);

console.log("section-cards-theme-gate.test.ts: ok");
