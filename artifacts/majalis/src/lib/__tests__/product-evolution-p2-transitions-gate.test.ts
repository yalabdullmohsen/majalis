/**
 * بوابة المرحلة 2 — Fast Fade للتنقّل، كروم ثابت، بلا انزلاق كبير.
 * node --import tsx src/lib/__tests__/product-evolution-p2-transitions-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const spatial = read("src/lib/spatial-nav.ts");
const push = Number(spatial.match(/push:\s*(\d+)/)?.[1]);
const pop = Number(spatial.match(/pop:\s*(\d+)/)?.[1]);
assert.ok(push >= 120 && push <= 180, `push ${push}`);
assert.ok(pop >= 120 && pop <= 180, `pop ${pop}`);

const native = read("src/styles/components/native-feel.css");
assert.match(native, /Fast Fade|خفوت/, "عقد Fade موثّق في CSS");
assert.doesNotMatch(
  native,
  /mj-route-push-in[\s\S]{0,220}translate3d\([^)]*(1[6-9]|[2-9]\d)px/,
  "push بلا انزلاق كبير",
);

const motion = read("src/components/motion/RouteEnterMotion.tsx");
assert.match(motion, /#main-content|getElementById\("main-content"\)/, "المحتوى فقط يتحرك");
assert.doesNotMatch(motion, /app-top-chrome|bottom-nav/, "لا يحرّك الكروم");

const app = read("src/App.tsx");
assert.match(app, /ChromeNavFallback|app-top-chrome/, "هيكل علوي يبقى");
assert.match(app, /ChromeBottomFallback|bottom-nav/, "تذييل يبقى");

console.log("product-evolution-p2-transitions-gate.test.ts: ok");
