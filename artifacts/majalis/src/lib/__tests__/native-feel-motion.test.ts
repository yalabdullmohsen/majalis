/**
 * بوابة إحساس أصلي: لمس فوري + سحب حافة + بلا framer-motion.
 * node --import tsx src/lib/__tests__/native-feel-motion.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

assert.ok(existsSync(resolve(root, "src/styles/components/native-feel.css")));
assert.ok(existsSync(resolve(root, "src/components/motion/EdgeSwipeBack.tsx")));
assert.ok(existsSync(resolve(root, "src/components/motion/SmoothImage.tsx")));
assert.ok(existsSync(resolve(root, "src/components/motion/Pressable.tsx")));

const pkg = read("package.json");
assert.equal(/framer-motion/.test(pkg), false, "لا اعتماد framer-motion الثقيل");

const instant = read("src/styles/components/instant-interaction.css");
assert.match(instant, /touch-action:\s*manipulation/);

const native = read("src/styles/components/native-feel.css");
assert.match(native, /mj-route-enter/);
assert.match(native, /mj-route-push/);
assert.match(native, /mj-route-pop/);
assert.match(native, /mj-smooth-image/);
assert.match(native, /cubic-bezier\(0\.22/);
assert.match(native, /mj-chrome-stable/);

const app = read("src/App.tsx");
assert.match(app, /EdgeSwipeBack/);
assert.match(app, /RouteEnterMotion/);

assert.ok(existsSync(resolve(root, "src/lib/spatial-nav.ts")));

const main = read("src/main.tsx");
assert.match(main, /native-feel\.css/);

const sheet = read("src/components/ui/AppBottomSheet.tsx");
assert.match(sheet, /onHandlePointerDown/);
assert.match(sheet, /app-sheet__head/);

console.log("native-feel-motion.test.ts: ok");
