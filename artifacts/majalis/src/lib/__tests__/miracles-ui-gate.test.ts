/**
 * بوابة — واجهة الإعجاز العلمي: مساران (قرآن/سنة) بلا فلاتر، ومصادر هادئة.
 * Run: node --import tsx src/lib/__tests__/miracles-ui-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const page = read("src/views/MiraclesPage.tsx");
const fab = read("src/components/FloatingBackButton.tsx");
const share = read("src/components/ShareFaida.tsx");
const section = read("src/components/common/SectionShareActions.tsx");
const routes = read("src/AppRoutes.tsx");
const registry = read("src/config/sections.registry.ts");

assert.match(page, /mk-hub-lanes/);
assert.match(page, /mk-topic-grid/);
assert.match(page, /mk-topic-card/);
assert.match(page, /InformationCard/);
const miraclesUi = read("src/lib/miracles-ui.ts");
assert.match(miraclesUi, /الكون والفضاء/);
assert.match(miraclesUi, /title: "الإنسان"/);
assert.match(page, /MIRACLE_TOPIC_HUB/);
assert.match(page, /الإنسان/);
assert.match(page, /countMiraclesByTopic|MIRACLE_TOPIC_HUB/);
assert.match(page, /mk-lane-card/);
assert.doesNotMatch(page, /mk-hero__note/);
assert.match(page, /\/miracles\/quran/);
assert.match(page, /\/miracles\/sunnah/);
assert.match(page, /\/miracles\/topic\//);
assert.match(page, /اقرأ التفصيل/);
assert.match(page, /إظهار المصادر/);
assert.match(page, /المعنى الشرعي أولًا/);
assert.match(page, /وجه التأمل العلمي/);
assert.match(page, /حدود الاستدلال/);
assert.match(page, /المصادر والمراجع/);
assert.match(page, /مواد ذات صلة/);
assert.match(page, /ShareButtons/);
assert.match(page, /SectionEntryCard/, "بطاقات المسار موحّدة");
assert.match(page, /ReadingSectionCard/, "تفاصيل داخل كتل قراءة");
assert.match(page, /prefetchRoute/, "تسخين تفاصيل الموضوع");
assert.match(page, /mk-detail-skel/, "هيكل تفصيل بدل فراغ");
assert.doesNotMatch(page, /AppBackButton/, "الرجوع عبر العائم العام فقط");
assert.doesNotMatch(page, /mk-inline-back/, "بلا رجوع مكرر داخل الصفحة");
assert.doesNotMatch(page, /جارٍ التحميل|جاري التحميل/, "بلا نص تحميل قديم");
assert.doesNotMatch(page, /activeTab/);
assert.doesNotMatch(page, /onTabChange/);
assert.doesNotMatch(page, /mk-chip/);
assert.doesNotMatch(page, /SourceTypeFilter/);
assert.doesNotMatch(page, /FilterBottomSheet/);
assert.doesNotMatch(page, /RelatedKnowledge/);
assert.doesNotMatch(page, /GeometricPattern/);
assert.doesNotMatch(page, /tabs=\{\[/);

assert.match(routes, /\/miracles\/quran/);
assert.match(routes, /\/miracles\/sunnah/);
assert.match(routes, /\/miracles\/topic\/:slug/);

assert.match(registry, /id:\s*"miracles"[\s\S]*?label:\s*"الإعجاز العلمي"/);
assert.doesNotMatch(
  registry,
  /id:\s*"miracles"[\s\S]*?label:\s*"الإعجاز العلمي في القرآن والسنة"/,
);

const css = read("src/styles/pages/miracles.css");
assert.match(css, /\.mk-lane-card/);
assert.match(css, /\.miracle-ayah__text/);
assert.match(css, /\.miracle-explain__label/);
assert.match(css, /\.mk-sources-quiet/);
assert.match(css, /mk-fab-clearance/);
assert.doesNotMatch(css, /\.mk-chip\s*\{/);
assert.doesNotMatch(css, /\.mk-hub-split\s*\{/);

assert.doesNotMatch(fab, /if \(deepScroll\) return null/);
assert.doesNotMatch(fab, /ChevronUp/);
assert.match(fab, /variant="floating"/);

assert.match(share, /variant === "icons"/);
assert.match(share, /share-faida--icons/);
assert.match(section, /data-section-share-actions/);
assert.match(section, /ShareFaida/);

console.log("miracles-ui-gate: ok");
