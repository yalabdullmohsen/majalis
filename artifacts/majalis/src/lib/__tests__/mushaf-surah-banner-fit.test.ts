/**
 * بوابة شارة السورة — زخرفة إسلامية خفيفة + لوحة وسطى.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banner = readFileSync(resolve(__dirname, "../../components/quran/SurahBanner.tsx"), "utf8");
const css = readFileSync(resolve(__dirname, "../../styles/mushaf-v2.css"), "utf8");

assert.match(banner, /data-ornament="islamic-light"/);
assert.match(banner, /SideOrnament/);
assert.match(banner, /GeoStar/);
assert.match(banner, /data-panel-width-pct="38"/);
assert.match(banner, /<svg[\s>]/);
assert.match(banner, /scrollWidth/);
assert.match(banner, /0\.92/, "اسم السورة يُصغَّر عند الحاجة");
assert.equal(/data-ornament="simple-strip"/.test(banner), false);
assert.equal(/data-ornament="wing-refined"/.test(banner), false);
assert.match(css, /\.mf2-surah-banner__svg\s*\{/);
assert.match(
  css.match(/\.mf2-surah-banner__svg\s*\{[^}]+\}/)?.[0] ?? "",
  /display:\s*block/,
  "SVG الشارة ظاهر",
);

console.log("mushaf-surah-banner-fit.test.ts: ok");
