/**
 * بوابة: Back FAB موحّد أسفل يمين؛ السهم العائم الدائري العلوي ملغى.
 * تشغيل: node --import tsx src/lib/__tests__/floating-back-button.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /FLOATING_BACK_DISABLED/);
assert.match(fab, /GlobalBackControlHost/);
assert.match(fab, /FIXED_BACK_BAR_ENABLED/);
assert.match(fab, /UNIFIED_BACK_FAB_ENABLED/);
assert.match(fab, /variant="bar"/);
assert.match(fab, /AppBackButton/);
assert.match(fab, /autoHideFloating=\{false\}/, "الشريط لا يُخفى على /profile والإعدادات العامة");
assert.match(fab, /path === "\/"|hideOnHome/, "إخفاء على الرئيسية");
assert.match(fab, /isImmersiveChromePath|hideOnMushaf/, "إخفاء على المصحف");
assert.match(fab, /adhan-settings|hideOnAdhanSettings/, "إخفاء على إعدادات الأذان — هيدر داخلي");
assert.match(fab, /hideBack/, "إخفاء موحّد");
assert.doesNotMatch(fab, /ChevronUp/);
assert.match(fab, /BACK_FAB_SCROLL_SHOW_PX|data-visible/, "يظهر بعد التمرير");
assert.match(fab, /data-edge="bottom"|data-global-back-edge/, "أسفل يمين");

const calm = read("src/styles/sections-calm-polish.css");
assert.match(calm, /\.ads-toolbar[\s\S]{0,80}?app-back-btn--inline/, "رجوع هيدر إعدادات الأذان ظاهر");
assert.match(calm, /\.scroll-to-top[\s\S]{0,200}?stt-label|\.stt-label/, "زر الصعود يحمل تسمية واضحة");

const scroll = read("src/components/ScrollToTop.tsx");
assert.match(scroll, /ArrowUp|إلى الأعلى/);
assert.match(scroll, /scrollY\s*>\s*\d+/);
assert.doesNotMatch(scroll, /useReadingProgress|stt-ring/);

const backCss = read("src/styles/knowledge-experience.css");
assert.match(backCss, /\.app-back-btn--bar\.fixed-back-bar/, "شريط ثابت");
assert.match(backCss, /right:\s*max\(0\.75rem,\s*var\(--inset-right/, "يمين فعليًا");
assert.match(backCss, /bottom:\s*var\(\s*--global-back-bottom/, "أسفل فوق الشريط السفلي");
assert.doesNotMatch(
  backCss,
  /\.app-back-btn--bar\.fixed-back-bar[\s\S]{0,500}?top:\s*var\(--global-back-top/,
  "لا تثبيت أعلى يمين",
);
assert.match(backCss, /inset-inline-end:\s*unset/, "لا منطق RTL يقلب الزر لليسار");
assert.match(backCss, /html\.chrome-immersive[\s\S]{0,220}?display:\s*none/, "إخفاء CSS في المصحف");
assert.match(backCss, /data-visible="1"|data-global-back-visible/, "ظهور بعد التمرير");
assert.match(
  backCss,
  /data-section-back[\s\S]{0,280}?display:\s*none|app-back-btn--lobby[\s\S]{0,200}?display:\s*none/,
  "إخفاء FAB عند الرجوع المدمج",
);
assert.match(backCss, /\.app-back-btn--bar\.fixed-back-bar\s*>\s*span[\s\S]{0,80}?display:\s*none/, "FAB أيقونة فقط");

const appBack = read("src/components/common/AppBackButton.tsx");
assert.match(appBack, /isImmersiveChromePath/, "إخفاء المصحف في AppBackButton");
assert.match(
  appBack,
  /variant === "floating" \|\| variant === "bar"[\s\S]{0,120}?isImmersiveChromePath/,
  "إخفاء المصحف بلا شرط autoHideFloating",
);

assert.match(appBack, /goBackOrFallback|goBackOrFallback/);
assert.match(appBack, /fallbackHref/);
assert.match(appBack, /onPointerDown/);
assert.doesNotMatch(appBack, /window\.setTimeout|setTimeout\s*\(/);

const legacy = read("src/components/GlobalBackButton.tsx");
assert.match(legacy, /FloatingBackButton/);

const app = `${read("src/App.tsx")}\n${read("src/AppRoutes.tsx")}`;
assert.match(app, /FloatingBackButton|GlobalBackButton/);

const hero = read("src/components/topic/SectionHero.tsx");
assert.match(hero, /AppBackButton|section-hero__back|goBackOrFallback/, "هيرو القسم يعرض رجوعًا هيدريًا");
assert.match(hero, /showBack|withBack/);

const lobby = read("src/components/lobby/SectionLobby.tsx");
assert.match(lobby, /AppBackButton|data-section-back/, "اللوبي يعرض رجوعًا هيدريًا");
assert.match(lobby, /data-section-back/);

console.log("floating-back-button.test.ts: ok (unified bottom back fab)");
