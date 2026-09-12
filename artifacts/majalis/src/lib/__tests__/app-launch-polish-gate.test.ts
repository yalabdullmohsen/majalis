/**
 * بوابة صقل الإطلاق: لا فراغ مسار، رجوع عائم فقط، مكوّنات DS ظاهرة.
 * تشغيل: node --import tsx src/lib/__tests__/app-launch-polish-gate.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

const fallback = read("src/components/LazyRouteFallback.tsx");
assert.doesNotMatch(fallback, /return null/, "هيكل المسار لا يفرّغ الشاشة");
assert.doesNotMatch(fallback, /useDeferredLoading/);
assert.match(fallback, /data-route-fallback="1"/);

const routes = read("src/AppRoutes.tsx");
assert.doesNotMatch(routes, /fallback=\{null\}/, "مسارات التطبيق بلا fallback فارغ");
assert.match(routes, /LazyRouteFallback/);

const ds = read("src/components/design-system/index.ts");
assert.match(ds, /RouteFallback/);
assert.match(ds, /AppPage/);
assert.match(ds, /SectionHero/);
assert.match(ds, /ContentDetailReadingShell|SourceBox/);

const miracles = read("src/views/MiraclesPage.tsx");
assert.doesNotMatch(miracles, /AppBackButton/);
assert.doesNotMatch(miracles, /جارٍ التحميل|جاري التحميل/);
assert.match(miracles, /mk-detail-skel/);

const prophets = read("src/views/ProphetStoriesPage.tsx");
assert.doesNotMatch(prophets, /prophet-lux-back/, "قصص الأنبياء بلا رجوع مكرر");

const feature = read("src/components/design-system/FeatureCard.tsx");
assert.match(feature, /usePrefetchRoute/);

const fab = read("src/components/FloatingBackButton.tsx");
assert.match(fab, /return null/);
assert.match(fab, /FLOATING_BACK_DISABLED/);

const app = read("src/App.tsx");
assert.match(app, /FloatingBackButton|GlobalBackButton/);
assert.match(app, /restoreScrollSnapshot/);
assert.match(app, /RouteEnterMotion/);

console.log("app-launch-polish-gate.test.ts: ok");
