/**
 * بوابة شارة السورة البسيطة — اسم + خطّان ذهبيان · data-ornament=none · بلا جناح.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banner = readFileSync(resolve(__dirname, "../../components/quran/SurahBanner.tsx"), "utf8");

assert.match(banner, /data-ornament="none"/);
assert.match(banner, /data-banner-style="minimal-rule"/);
assert.match(banner, /mf2-surah-banner--minimal/);
assert.match(banner, /mf2-surah-banner__rule/);
assert.match(banner, /mf2-surah-banner__name/);
assert.equal(/<pattern[\s/]>/.test(banner), false, "ممنوع وسم pattern");
assert.equal(/PetalMedallion|TwinSpirals|data-wing-part|wing-refined|Arabesque/.test(banner), false);
assert.equal(/<svg[\s>]/.test(banner), false, "شارة بلا SVG زخرفي");
assert.match(banner, /0\.78|MUSHAF_TYPESCALE\.surahBannerName/, "اسم السورة بنسبة السلّم");

console.log("mushaf-surah-banner-fit.test.ts: ok");
