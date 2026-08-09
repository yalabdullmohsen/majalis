/**
 * بوابة شارة السورة — مرجع ٦٠٠/٦٠١: وردة + فرعان + عقدة بلا pattern.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banner = readFileSync(resolve(__dirname, "../../components/quran/SurahBanner.tsx"), "utf8");

assert.match(banner, /PANEL_MARGIN_PX\s*=\s*6/);
assert.match(banner, /PANEL_FRAC\s*=\s*0\.34/);
assert.match(banner, /scrollWidth/);
assert.match(banner, /data-ornament="wing-ref"/);
assert.equal(/<pattern/.test(banner), false, "ممنوع pattern مكرر");
assert.equal(/skew|rotate\(/.test(banner), false, "لوحة وسطى بلا skew/rotate");
assert.match(banner, /<rect[\s\S]*?rx="3"/, "لوحة مستطيلة قائمة radius 3");
assert.match(banner, /Octofoil/, "وردة ثمانية في الجناح");
assert.match(banner, /SpiralArm/, "فرعان لولبيان");
assert.match(banner, /data-wing-part="knot"/, "عقدة عند حافة اللوحة");
assert.match(banner, /data-wing-part="spiral"/, "مسارات لولبية");
assert.match(banner, /strokeWidth="1\.5"/, "حدود بيضاء 1.5px");
assert.match(banner, /data-wing-motif="rose\+spiral\+spiral\+knot"/);

console.log("mushaf-surah-banner-fit.test.ts: ok");
