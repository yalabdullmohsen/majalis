/**
 * بوابة تجاوز اسم السورة — منطق الملاءمة داخل اللوحة الوسطى.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const banner = readFileSync(resolve(__dirname, "../../components/quran/SurahBanner.tsx"), "utf8");

assert.match(banner, /PANEL_MARGIN_PX\s*=\s*6/);
assert.match(banner, /scrollWidth/);
assert.match(banner, /panelW\s*\*\s*0\.32|0\.32/);
assert.match(banner, /data-ornament="solid"/);
assert.equal(/skew|rotate\(/.test(banner), false, "لوحة وسطى بلا skew/rotate");
assert.match(banner, /<rect[\s\S]*?rx="3"/, "لوحة مستطيلة قائمة");
assert.equal(/WingArabesque|Octofoil/.test(banner), false);

console.log("mushaf-surah-banner-fit.test.ts: ok");
