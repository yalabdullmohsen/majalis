/**
 * بوابة شارة السورة — ميدالية كثيفة + شبكة أرابيسك بلا pattern.
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
assert.match(banner, /data-ornament="wing-dense"/);
assert.match(banner, /data-wing-density-target="22-38"/);
assert.equal(/<pattern[\s/]/i.test(banner), false, "ممنوع وسم pattern مكرر");
assert.equal(/skew|rotate\(/.test(banner), false, "لوحة وسطى بلا skew/rotate");
assert.match(banner, /rx="4"/, "إطار خارجي radius 4");
assert.match(banner, /PetalMedallion|medallion/, "ميدالية بتلات في الجناح");
assert.match(banner, /ArabesqueMesh|data-wing-part="mesh"/, "شبكة أرابيسك تملأ الجناح");
assert.match(banner, /data-wing-part="knot"/, "عقدة عند حافة اللوحة");
assert.match(banner, /strokeWidth="1\.5"/, "حدود بيضاء/ذهبية 1.5px");
assert.match(banner, /0\.425|85%|٠\.٨٥|قطر/, "قطر الميدالية ≈٨٥٪ من ارتفاع الجناح");

console.log("mushaf-surah-banner-fit.test.ts: ok");
