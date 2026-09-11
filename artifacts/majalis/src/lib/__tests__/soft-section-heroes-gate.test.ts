/**
 * بوابة: هيروات أقسام المحتوى = soft-card لا شريط أخضر ممتد.
 * node --import tsx src/lib/__tests__/soft-section-heroes-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const shell = read("src/styles/components/modern-section-shell.css");
for (const hero of [
  ".sw-hero", ".sb-hero", ".as-hero", ".atl-hero", ".sm-hero", ".gl-hero",
  ".ldb-hero", ".myl2-hero", ".lpd2-hero", ".pmp-hero", ".mw-hero", ".srp-hero",
  ".seerah-hero", ".th-hero", ".sh-hero",
  ".sg-hero", ".hj-hero", ".duas-hero", ".ai-hero", ".arkan-hero",
  ".ah-hero", ".jnz-hero", ".hs-hero",
  ".zk-hero", ".tw-hero", ".sy-hero", ".mdb-hero", ".fa-hero", ".hk-hero", ".dq-hero", ".rq-hero", ".is-hero", ".sr-hero", ".mk-hero", ".uq-hero", ".tf-hero", ".fg-hero", ".an-hero",
  ".fiqh-lux-book-hero", ".fq-hero", ".hdl-info-hero", ".ilm-hero", ".qmem-hero", ".ve-hero", ".wn-hero", ".snr-hero",
]) {
  assert.match(shell, new RegExp(hero.replace(".", "\\.")), `modern-section-shell يشمل ${hero}`);
}
assert.match(shell, /--mss-section-hero-bg/, "سطح soft-hero مفعّل");
assert.match(
  shell,
  /\.sw-hero[\s\S]{0,2400}?background-image:\s*none\s*!important/,
  "هيرو الصيام بلا تدرّج خلفية ممتد",
);
assert.match(
  shell,
  /\.sw-hero\s+\.sw-hero__title[\s\S]{0,500}?--mss-on-hero/,
  "عنوان soft-hero بحبر ثابت",
);

const dark = read("src/styles/dark-mode-surfaces.css");
assert.doesNotMatch(
  dark,
  /:where\([^)]*\.sw-hero[^)]*\)\s*\{[^}]*color:\s*var\(--on-dark/,
  "الوضع الداكن لا يفرض نصًا أبيض على .sw-hero soft",
);
for (const h of [".seerah-hero", ".th-hero", ".sh-hero", ".ah-hero", ".jnz-hero", ".hs-hero", ".zk-hero", ".tw-hero", ".sy-hero", ".mdb-hero", ".fa-hero", ".hk-hero", ".dq-hero", ".rq-hero", ".is-hero", ".sr-hero", ".mk-hero", ".uq-hero", ".tf-hero", ".fg-hero", ".an-hero", ".fiqh-lux-book-hero", ".fq-hero", ".hdl-info-hero", ".ilm-hero", ".qmem-hero", ".ve-hero", ".wn-hero", ".snr-hero"]) {
  assert.doesNotMatch(
    dark,
    new RegExp(`:where\\([^)]*\\${h.slice(1)}[^)]*\\)\\s*\\{[^}]*color:\\s*var\\(--on-dark`),
    `الوضع الداكن لا يفرض نصًا أبيض على ${h} soft`,
  );
}

for (const [file, banned] of [
  ["src/styles/pages/sawm.css", /\.sw-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/sahabah.css", /\.sb-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/alamat-saah.css", /\.as-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/adab-talab-ilm.css", /\.atl-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/sitemap.css", /\.sm-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/seerah.css", /\.seerah-hero\s*\{[^}]*(?:linear-gradient|brand-deep)/s],
  ["src/styles/pages/tahara.css", /\.th-hero\s*\{[^}]*(?:linear-gradient|brand-deep)/s],
  ["src/styles/pages/shimael.css", /\.sh-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/salah-guide.css", /\.sg-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/hajj.css", /\.hj-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/duas.css", /\.duas-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/arkan-iman.css", /\.ai-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/arkan-islam.css", /\.arkan-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/asmaa-husna.css", /\.ah-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/janaza.css", /\.jnz-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/hadith-mustalah.css", /\.hs-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/zakat.css", /\.zk-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/tawba.css", /\.tw-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/sunan-yawmiyya.css", /\.sy-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/madhahib.css", /\.mdb-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/fadail-aamal.css", /\.fa-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/hikam-salaf.css", /\.hk-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/duas-quran.css", /\.dq-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/raqaiq.css", /\.rq-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/islam-stats.css", /\.is-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/researches.css", /\.sr-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/malaika.css", /\.mk-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/ulum-quran.css", /\.uq-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/tafsir.css", /\.tf-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/fiqh-guide.css", /\.fg-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/arbaeen-nawawi.css", /\.an-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/fiqh-qawaid.css", /\.fq-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/pages/hadith-design-language.css", /\.hdl-info-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/islamic-landmarks.css", /\.ilm-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/quran-memorization.css", /\.qmem-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/visual-enrichment.css", /\.ve-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/section-makarim-pattern.css", /\.wn-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/visual-layer-contrast-fix.css", /\.fiqh-lux-book-hero\s*\{[^}]*linear-gradient/s],
  ["src/styles/sins-rights.css", /\.snr-hero\s*\{[^}]*linear-gradient/s],
] as const) {
  const css = read(file);
  assert.doesNotMatch(css, banned, `${file}: لا تدرّج أخضر على جذر الهيرو`);
}

console.log("soft-section-heroes-gate.test.ts: ok");
