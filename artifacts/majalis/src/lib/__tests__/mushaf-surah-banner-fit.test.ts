/**
 * بوابة شارة السورة — ميدالية + فرعان لولبيان · مرآة تامة · سُمك ١٫٢ · كثافة ٢٠–٣٠٪.
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
assert.match(banner, /data-ornament="wing-refined"/);
assert.match(banner, /data-wing-density-target="20-30"/);
assert.equal(/<pattern[\s/]>/.test(banner), false, "ممنوع وسم pattern مكرر");
assert.equal(/skew|rotate\(/.test(banner), false, "لوحة وسطى بلا skew/rotate");
assert.match(banner, /FRAME_RADIUS\s*=\s*3|rx=\{FRAME_RADIUS\}/, "إطار radius 3");
assert.match(banner, /rx="0"/, "لوحة وسطى زوايا مستقيمة");
assert.match(banner, /PetalMedallion|medallion/, "ميدالية بتلات في الجناح");
assert.match(banner, /TwinSpirals|data-wing-part="spiral"/, "فرعان لولبيان");
assert.doesNotMatch(banner, /ArabesqueMesh|data-wing-part="mesh"/);
assert.doesNotMatch(banner, /data-wing-part="knot"/);
assert.match(banner, /scale\(-1,\s*1\)/, "مرآة الجناح الأيمن");
assert.match(banner, /STROKE\s*=\s*1\.2/, "سُمك لفّ موحّد ١٫٢px");
assert.match(banner, /OUTER_STROKE\s*=\s*2/);
assert.match(banner, /INNER_STROKE\s*=\s*1/);
assert.match(banner, /FRAME_GAP\s*=\s*4/);
assert.match(banner, /0\.78/, "اسم السورة يُصغَّر عند الحاجة");

console.log("mushaf-surah-banner-fit.test.ts: ok");
