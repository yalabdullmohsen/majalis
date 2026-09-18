/**
 * بوابة: أخطاء الوضع الليلي الظاهرة (skip-link + عناوين الأقسام + أزرار الهيدر).
 * تشغيل: node --import tsx src/lib/__tests__/dark-mode-chrome-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const theme = readFileSync(resolve(root, "src/app/styles/theme.css"), "utf8");
const sectionCards = readFileSync(resolve(root, "src/components/sections/section-cards.css"), "utf8");
const lobby = readFileSync(resolve(root, "src/components/lobby/section-lobby.css"), "utf8");
const finalCss = readFileSync(resolve(root, "src/styles/final-release.css"), "utf8");
const nav = readFileSync(resolve(root, "src/components/NavBar.tsx"), "utf8");
const indexCss = readFileSync(resolve(root, "src/index.css"), "utf8");

assert.match(theme, /clip:\s*rect\(0,\s*0,\s*0,\s*0\)/, "skip-link مخفي بـ clip لا transform");
assert.match(theme, /\.skip-link\.mj-skip-link:focus-visible[\s\S]*?clip:\s*auto/, "يظهر عند focus-visible فقط");
assert.doesNotMatch(
  theme.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.skip-link\.mj-skip-link:focus\s*,/,
  "لا إظهار skip-link عند :focus وحده (لمس iOS)",
);
assert.doesNotMatch(
  theme.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.mj-skip-link\s*\{[^}]*transform:\s*translateY\(-200%\)/,
  "لا إخفاء skip-link بـ translateY الذي يظهر فوق الشاشة",
);

assert.match(
  sectionCards,
  /html\[data-theme="dark"\]\s+\.sections-hub__group-title[\s\S]*?color:\s*#e8eeec/,
  "عنوان مجموعة الأقسام واضح ليلاً",
);
assert.match(
  lobby,
  /html\[data-theme="dark"\]\s+\.section-lobby__group-title[\s\S]*?color:\s*#e8eeec/,
);

/* شريط سفلي ليلاً — لا @media تالف ولا لون سطح غامق كنص */
assert.doesNotMatch(
  finalCss,
  /@media\s*\(\s*max-width:\s*56px\s*;/,
  "لا @media تالف يُسقط ألوان الشريط الليلي",
);
assert.match(
  finalCss,
  /@media\s*\(\s*max-width:\s*879px\s*\)\s*\{[\s\S]*?html\[data-theme="dark"\]\s+\.bottom-nav(?:--v2)?\s+\.bottom-nav__tab[\s\S]*?color:\s*var\(--color-text-muted/,
  "تبويبات الشريط السفلي ليلاً بلون نص مقروء",
);
assert.match(
  finalCss,
  /html\[data-theme="dark"\]\s+\.bottom-nav(?:--v2)?\s+\.bottom-nav__tab\.is-active[\s\S]*?color:\s*var\(--mj-accent/,
  "التبويب النشط ليلاً بلون accent لا سطح غامق",
);
assert.match(
  finalCss,
  /html\[data-theme="dark"\]\s+\.top-section-bar__tab[\s\S]*?color:\s*var\(--color-text-muted/,
  "شريط الأقسام العلوي ليلاً مقروء",
);

const themeDarkPrimary = theme.match(
  /\.dark\s*\{[\s\S]*?--color-primary-dark:\s*([^;]+);/,
);
assert.ok(themeDarkPrimary, "تعريف --color-primary-dark في الوضع الليلي");
assert.match(
  themeDarkPrimary[1],
  /--mj-brand-deep/,
  "--color-primary-dark ليلاً = حبر مقروء لا سطح غامق",
);
assert.doesNotMatch(
  themeDarkPrimary[1],
  /deep-surface/,
  "--color-primary-dark ليلاً لا يشير لـ deep-surface",
);

assert.match(nav, /HeaderAdSlot/, "إعلان الهيدر موجود");
assert.doesNotMatch(nav, /header-ad-slot--spacer/, "لا spacer شفاف — الإعلان مدمج");
assert.doesNotMatch(nav, /navbar-v3__ad-row/, "لا صف إعلان منفصل");
assert.doesNotMatch(nav, /MajlisWordmark/, "الشعار ليس في صف الأيقونات (سياسة الإعلان)");

assert.doesNotMatch(
  indexCss.replace(/\/\*[\s\S]*?\*\//g, ""),
  /\.navbar-menu-btn--drawer\s*\{[^}]*background:\s*#fff\b/,
  "زر القائمة بلا خلفية بيضاء صلبة",
);
assert.match(
  finalCss,
  /html\[data-theme="dark"\]\s+\.navbar-menu-btn--drawer[\s\S]*?background:\s*var\(--mj-surface-2/,
);

const adCss = readFileSync(resolve(root, "src/styles/components/header-ad-slot.css"), "utf8");
assert.match(adCss, /border-radius:\s*999px/, "إعلان pill");
assert.match(adCss, /\.navbar-v3__ad-row[\s\S]*?display:\s*none/, "صف الإعلان القديم مخفي");

console.log("dark-mode-chrome-gate.test.ts: ok");
