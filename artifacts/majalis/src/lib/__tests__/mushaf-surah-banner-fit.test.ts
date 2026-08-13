/**
 * بوابة شارة السورة — شريط بسيط بلا زخارف (قرار ١٢ أغسطس ٢٠٢٦).
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banner = readFileSync(resolve(__dirname, "../../components/quran/SurahBanner.tsx"), "utf8");
const css = readFileSync(resolve(__dirname, "../../styles/mushaf-v2.css"), "utf8");

assert.match(banner, /data-ornament="simple-strip"/);
assert.match(banner, /mf2-surah-banner__bar/);
assert.match(banner, /scrollWidth/);
assert.match(banner, /0\.92/, "اسم السورة يُصغَّر عند الحاجة");
assert.equal(/PetalMedallion|TwinSpirals|WingMotifs/.test(banner), false, "حذف الزخارف نهائياً");
assert.equal(/data-wing-part|data-wing-mirror|arabesque/i.test(banner), false);
assert.equal(/<svg[\s>]/.test(banner), false, "بلا SVG زخرفي");
assert.equal(/<pattern[\s/]>/.test(banner), false);
assert.match(css, /\.mf2-surah-banner__bar\s*\{/);
assert.match(css, /border:\s*1px\s+solid/);
assert.match(css, /border-radius:\s*3px/);
assert.match(
  css.match(/\.mf2-surah-banner__bar\s*\{[^}]+\}/)?.[0] ?? "",
  /#FAF3E8|mushaf-panel|mushaf-badge-bg/,
  "خلفية عاجية",
);

console.log("mushaf-surah-banner-fit.test.ts: ok");
