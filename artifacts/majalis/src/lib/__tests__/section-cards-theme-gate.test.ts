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

console.log("=== سيرة / أدعية / أربعين بلا #fff صلب على البطاقة ===");
const seerah = read("src/styles/pages/seerah.css");
const duas = read("src/styles/pages/duas.css");
const arbaeen = read("src/styles/pages/arbaeen-nawawi.css");
assert.doesNotMatch(seerah, /\.seerah-panel\s*\{[^}]*background:\s*#fff/i);
assert.match(seerah, /\.seerah-panel[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(duas, /\.dua-card\s*\{[^}]*background:\s*#FFFFFF/i);
assert.match(duas, /\.dua-card[\s\S]*?--ss-card-bg/);
assert.doesNotMatch(arbaeen, /\.an-search\s*\{[^}]*background:\s*#fff(?![a-f0-9])/i);
assert.match(arbaeen, /\.an-card[\s\S]*?--ss-card-bg/);
assert.match(theme, /\.seerah-panel/);
assert.match(theme, /\.dua-card/);
assert.match(theme, /\.an-card/);
assert.match(theme, /html\.dark[\s\S]*?\.seerah-panel[\s\S]*?--mj-surface/);
assert.match(theme, /html\.dark[\s\S]*?\.dua-card[\s\S]*?--mj-surface/);
assert.match(theme, /html\.dark[\s\S]*?\.an-card[\s\S]*?--mj-surface/);

console.log("=== موجة 2: شمائل/وصايا/قبلة ضمن الثيم ===");
assert.match(theme, /\.sh-bab/);
assert.match(theme, /\.wn-card/);
assert.match(theme, /\.qb-card|\.rs-card|\.sm-card/);


console.log("=== توحيد بطاقات داخلية: تاريخ/قصص/فقه/حديث ===");
assert.match(theme, /\.tarikh-card/);
assert.match(theme, /\.isp-card/);
assert.match(theme, /\.hadith-card/);
assert.match(theme, /\.fiqh-category-card/);
assert.match(theme, /\.uq-type-card|\.uq-card/);
const internalCards = read("src/components/ui/InternalCards.tsx");
assert.match(internalCards, /SectionEntryCard/);
assert.match(internalCards, /TopicCard/);
assert.match(internalCards, /InternalLinkCard/);
assert.match(internalCards, /ReadingCard/);

console.log("=== أعداد المحتوى: اختبارات وأسئلة غير صفرية ===");
const counts = JSON.parse(read("src/data/content-counts.json")) as {
  quizQuestions: number;
  qa: number;
};
assert.ok(counts.quizQuestions > 0, `quizQuestions=${counts.quizQuestions}`);
assert.ok(counts.qa > 0, `qa=${counts.qa}`);


console.log("=== موجة 2 ترحيل JSX: إعجاز/أخلاق/علوم قرآن/استكشاف ===");
assert.match(theme, /موجة 2/);
assert.match(theme, /\.mk-card__hit/);
assert.match(theme, /\.akl-related__card/);
assert.match(theme, /\.uq-usul-card/);
const explore = read("src/components/ExploreAlsoNav.tsx");
assert.match(explore, /InternalLinkCard/);
const miracles = read("src/views/MiraclesPage.tsx");
assert.match(miracles, /SectionEntryCard/);
assert.match(miracles, /mk-card__hit/);
const ulumView = read("src/pages/quran/ui/UlumQuranView.tsx");
assert.match(ulumView, /InternalLinkCard/);
const akhlaq = read("src/views/AkhlaqPage.tsx");
assert.match(akhlaq, /InternalLinkCard/);
const sects = read("src/views/IslamicSectsPage.tsx");
assert.match(sects, /InternalLinkCard/);
const hadithScience = read("src/pages/hadith/ui/HadithScienceView.tsx");
assert.match(hadithScience, /RelatedLinksBox|InternalLinkCard/);
assert.match(hadithScience, /FAQBox|SourceBox/);

console.log("=== موجة 2ب: كتب حديث/بطاقة حديث/تفسير/قصص ===");

assert.match(read("src/pages/hadith/HadithBooksAndRulingsPage.tsx"), /SectionEntryCard/);
assert.match(read("src/components/hadith/HadithCard.tsx"), /hadith-card__hit/);
assert.match(read("src/pages/quran/ui/TafsirView.tsx"), /InternalLinkCard/);
assert.match(read("src/views/ProphetStoriesPage.tsx"), /button[\s\S]*nb-azm-card/);


console.log("=== موجة 3: فقه/تفسير روابط/قصص ===");
assert.match(theme, /موجة 3/);
assert.match(read("src/pages/fiqh/ui/FiqhChapterView.tsx"), /InternalLinkCard/);
assert.match(read("src/pages/fiqh/ui/FiqhBookView.tsx"), /InternalLinkCard/);
assert.match(read("src/pages/fiqh/ui/FiqhView.tsx"), /InternalLinkCard/);
assert.match(read("src/pages/quran/ui/TafsirView.tsx"), /tf-related__link[\s\S]*InternalLinkCard|InternalLinkCard[\s\S]*tf-related__link/);
assert.match(read("src/views/IslamicStoriesPage.tsx"), /isp-card__hit/);

console.log("section-cards-theme-gate.test.ts: ok");

