/**
 * بوابة أداء/UX الجوال: View Transitions + AppImage + مدد قصيرة + مفضلة متفائلة.
 * node --import tsx src/lib/__tests__/frontend-perf-mobile-ux-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");

assert.ok(existsSync(resolve(root, "src/lib/view-transition-nav.ts")));
assert.ok(existsSync(resolve(root, "src/components/motion/ViewTransitionNav.tsx")));
assert.ok(existsSync(resolve(root, "src/components/media/AppImage.tsx")));

const vt = read("src/lib/view-transition-nav.ts");
assert.match(vt, /startViewTransition/);
assert.match(vt, /isImmersiveChromePath/);
assert.match(vt, /150/);

const route = read("src/components/motion/RouteEnterMotion.tsx");
assert.match(route, /consumeSkipCssRouteMotion/);
assert.match(route, /isImmersiveChromePath\(from\)/);

const spatial = read("src/lib/spatial-nav.ts");
assert.match(spatial, /push:\s*160/);
assert.match(spatial, /modal:\s*180/);
assert.doesNotMatch(spatial, /push:\s*340/);

const native = read("src/styles/components/native-feel.css");
assert.match(native, /view-transition/);
assert.match(native, /\.mj-cv-auto/);
assert.match(native, /animation-duration:\s*150ms/);
assert.match(native, /mj-route-push-in 160ms/);

const app = read("src/App.tsx");
assert.match(app, /ViewTransitionNav/);

const fav = read("src/components/FavoriteButton.tsx");
assert.match(fav, /setBookmarked\(!prev\)/);
assert.match(fav, /تعذّر الحفظ/);
assert.match(fav, /triggerHaptic/);

const img = read("src/components/media/AppImage.tsx");
assert.match(img, /fetchPriority/);
assert.match(img, /decoding="async"/);
assert.match(img, /mj-smooth-image__skel/);
assert.doesNotMatch(img, /from ["']next\/image["']/);

const press = read("src/components/motion/Pressable.tsx");
assert.match(press, /mj-touch-target/);
assert.match(press, /triggerHaptic/);

const cap = read("src/lib/capacitor-utils.ts");
assert.match(cap, /light:\s*8/);

console.log("frontend-perf-mobile-ux-gate.test.ts: ok");
