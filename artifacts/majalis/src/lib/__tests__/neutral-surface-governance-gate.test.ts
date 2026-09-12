/**
 * بوابة حوكمة الأسطح + دورة تحميل الفوائد + إلغاء الرجوع العائم.
 * تشغيل: node --import tsx src/lib/__tests__/neutral-surface-governance-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

const green = read("src/styles/green-surface-system.css");
const tokens = read("src/styles/design-tokens.css");
const fawaid = read("src/pages/account/ui/FawaidView.tsx");
const supabase = read("src/lib/supabase.ts");
const demo = read("src/lib/demo-content.ts");
const floating = read("src/components/FloatingBackButton.tsx");
const prophets = read("src/styles/pages/prophet-stories.css");

assert.match(tokens, /--surface-feature:\s*var\(--surface-content\)/, "feature محايد");
assert.match(green, /\.gs-surface--feature/, "feature opt-in فقط");
assert.match(green, /opacity:\s*0\s*!important/, "إزالة لمعات زخرفية");

assert.match(prophets, /\.prophet-lux-card__star\s*\{\s*display:\s*none/, "إخفاء نجمة الزخرفة");
assert.match(prophets, /background-image:\s*none/, "بطاقة نبي بلا لمعة");

assert.match(floating, /FLOATING_BACK_DISABLED/, "العائم ملغى");
assert.match(demo, /ensureFawaidLoaded/, "بذرة فوائد قابلة للتحميل المنفصل");
assert.match(demo, /getFawaidSeedCached/, "كاش بذرة متزامن");
assert.match(fawaid, /ensureFawaidLoaded/, "فوائد: رسم فوري من البذرة");
assert.match(fawaid, /sunnah\.fawaid\.list/, "كاش جلسة للفوائد");
assert.doesNotMatch(fawaid, /setLoading\(true\)/, "لا إعادة هيكل كامل عند الدخول");
assert.doesNotMatch(fawaid, /Date\.now\(\)/, "خلط ثابت بلا Date.now على كل hydrate");

const getFn = supabase.match(/export async function getApprovedFawaid\(\) \{[\s\S]*?\nexport async function/);
assert.ok(getFn, "getApprovedFawaid موجودة");
assert.match(getFn![0], /Promise\.all/, "بذرة وشبكة بالتوازي");
assert.doesNotMatch(getFn![0], /await loadSeedData\(/, "بلا انتظار محمّل البذور الكامل أولًا");
assert.match(getFn![0], /ensureFawaidLoaded/, "بذرة فوائد فقط");

console.log("neutral-surface-governance-gate.test.ts: ok");
