/**
 * بوابة: هيرو الأقسام بطاقة سطح — بلا شريط أخضر ممتد بعرض الصفحة.
 * node --import tsx src/lib/__tests__/section-hub-card-heroes-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const shell = read("src/styles/components/modern-section-shell.css");
assert.ok(shell.includes("--mss-section-hero-bg"), "رمز خلفية هيرو بطاقة");
assert.match(shell, /border-inline-start:\s*4px\s+solid/, "لكنة علامة جانبية");
assert.ok(
  shell.includes(".page-hero-mj--bleed:not(.home-page-hero):not(.m2030-hero)") &&
    /background-image:\s*none/.test(shell),
  "PageHero الداخلي بلا تدرّج ممتد",
);
assert.match(shell, /\.fqh-hub-hero[\s\S]*?max-width:\s*min\(56rem/, "فقه بطاقة محدودة العرض");
assert.ok(
  shell.includes(".th-hero") && shell.includes(".tf-hero") && shell.includes(".zk-hero"),
  "هيروهات الأقسام الشائعة مغطاة",
);

const pageHero = read("src/styles/components/page-hero.css");
assert.ok(
  pageHero.includes(".page-hero-mj--bleed:not(.home-page-hero)") &&
    pageHero.includes("var(--mss-radius-hero"),
  "page-hero بطاقة بزوايا",
);
assert.ok(
  pageHero.includes(".page-hero-mj--bleed:not(.home-page-hero)") &&
    /background-image:\s*none/.test(pageHero),
  "page-hero بلا تدرّج أخضر",
);
assert.match(
  pageHero,
  /--mss-hero-gradient|--mss-hero-from|--mss-section-hero-bg/,
  "page-hero يشارك رموز mss",
);

const fiqh = read("src/styles/pages/fiqh-hub.css");
assert.match(fiqh, /border-inline-start:\s*4px\s+solid/, "فقه: لكنة بطاقة");
assert.match(
  fiqh,
  /\.fqh-hub-hero__title[\s\S]{0,200}(--color-text|--mj-ink)/,
  "عنوان الفقه بلون نص السطح",
);

const unify = read("src/styles/visual-identity-unify.css");
assert.match(
  unify,
  /\.fqh-hub-hero[\s\S]*?background-image:\s*none/,
  "توحيد الهوية يفرض بطاقة",
);

const knowledge = read("src/styles/pages/knowledge.css");
assert.ok(
  knowledge.includes(".knowledge-article") && knowledge.includes("border-inline-start: 4px"),
  "مقال المعرفة بطاقة لا شريط أخضر صلب",
);
assert.doesNotMatch(
  knowledge,
  /\.knowledge-article\s*\{[^}]*background:\s*var\(--surface-brand-solid/,
  "لا خلفية brand-solid ممتدة لمقال المعرفة",
);

console.log("section-hub-card-heroes-gate.test.ts: ok");
