/**
 * بوابة: أزرار التنقل/العمليات متجاوبة بلا قص عربي (دخول خاصة).
 * node --import tsx src/lib/__tests__/responsive-nav-buttons-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, "");

const indexCss = strip(read("src/index.css"));
const finalCss = strip(read("src/styles/final-release.css"));
const nav = read("src/components/NavBar.tsx");

assert.match(nav, /navbar-mobile-login__label/, "تسمية دخول موجودة في NavBar");
assert.match(nav, />دخول</, "نص دخول ظاهر في الجوال/اللوحية");

assert.doesNotMatch(
  indexCss,
  /\.navbar-login--mobile\s*\{[^}]*max-width:\s*[0-9.]+rem/s,
  "لا max-width ثابت يقصّ دخول",
);
assert.doesNotMatch(
  indexCss,
  /\.navbar-login--mobile\s*\{[^}]*text-overflow:\s*ellipsis/s,
  "لا ellipsis على دخول",
);
assert.doesNotMatch(
  indexCss,
  /\.navbar-menu-btn,\s*\.navbar-logout\s*\{[^}]*(?<![-\w])width:\s*[0-9.]+rem/s,
  "لا عرض ثابت لأزرار قائمة/خروج النصية في media",
);

assert.match(
  finalCss,
  /\.navbar-v3\s+\.navbar-mobile-login:has\(\.navbar-mobile-login__label\)\s*\{[^}]*width:\s*auto\s*!important/s,
  "دخول مرن يهزم عرض 44px",
);
assert.match(
  finalCss,
  /\.navbar-v3\s+\.navbar-mobile-login__label\s*\{[^}]*display:\s*inline\s*!important/s,
  "تسمية دخول ظاهرة",
);
assert.doesNotMatch(
  finalCss,
  /\.navbar-menu-btn__label,\s*\.navbar-mobile-login__label\s*\{\s*display:\s*none/,
  "لا إخفاء مشترك لتسمية دخول مع القائمة",
);
assert.match(
  finalCss,
  /\.navbar-menu-btn__label\s*\{\s*display:\s*none/,
  "إخفاء تسمية القائمة فقط على الجوال",
);

assert.match(finalCss, /\.navbar-menu-btn[^}]*min-height:\s*44px/s, "لمس ≥44 للقائمة");

console.log("responsive-nav-buttons-gate.test.ts: ok");
