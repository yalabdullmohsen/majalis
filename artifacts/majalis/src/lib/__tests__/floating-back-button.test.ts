/**
 * بوابة: شريط رجوع ثابت حديث؛ السهم العائم الدائري ملغى.
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
assert.match(fab, /variant="bar"/);
assert.match(fab, /AppBackButton/);
assert.match(fab, /autoHideFloating=\{false\}/, "الشريط لا يُخفى على /profile والإعدادات");
assert.match(fab, /path === "\/"|hideOnHome/, "إخفاء على الرئيسية فقط");
assert.doesNotMatch(fab, /ChevronUp/);

const backCss = read("src/styles/knowledge-experience.css");
assert.match(backCss, /\.app-back-btn--bar\.fixed-back-bar/, "شريط ثابت");
assert.match(backCss, /right:\s*max\(0\.75rem,\s*var\(--inset-right/, "أسفل يمين فعليًا");

const appBack = read("src/components/common/AppBackButton.tsx");
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

console.log("floating-back-button.test.ts: ok (fixed back bar)");
