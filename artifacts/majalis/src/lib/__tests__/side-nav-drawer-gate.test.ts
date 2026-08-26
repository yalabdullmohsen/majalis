/**
 * بوابة الدرج: بلا طمس على الواجهة، طبقات siblings، محتوى حساب فقط.
 * تشغيل: node --import tsx src/lib/__tests__/side-nav-drawer-gate.test.ts
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { SIDEBAR_NAV_GROUPS } from "@/lib/sidebar-nav";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (p: string) => readFileSync(resolve(root, p), "utf8");
const stripComments = (css: string) => css.replace(/\/\*[\s\S]*?\*\//g, "");

const drawerTsx = read("src/components/SideNavDrawer.tsx");
const drawerCss = stripComments(read("src/styles/components/sidebar-redesign.css"));
const indexCss = stripComments(read("src/index.css"));
const registrySrc = read("src/components/layout/DrawerFromRegistry.tsx");
const navBar = read("src/components/NavBar.tsx");
const lockSrc = read("src/lib/mobile-nav-body-lock.ts");

assert.match(drawerTsx, /id="drawer-root"/, "portal #drawer-root");
assert.match(drawerTsx, /className="drawer-scrim"/, "طبقة تعتيم مستقلة");
assert.match(drawerTsx, /className="drawer-panel/, "لوحة الدرج");
assert.match(drawerTsx, /createPortal/, "portal إلى body");
assert.match(drawerTsx, /role="dialog"/, "role dialog");
assert.match(drawerTsx, /aria-modal/, "aria-modal");
assert.match(drawerTsx, /Escape/, "Escape يغلق");
assert.match(drawerTsx, /willChange/, "will-change حول الحركة");
assert.doesNotMatch(drawerTsx, /FeaturedSectionsGrid|section-cards/, "بلا بطاقات متدرّجة");
assert.match(registrySrc, /sidebar-item/, "صفوف أيقونة+عنوان");
assert.doesNotMatch(registrySrc, /FeaturedSectionsGrid/, "لا شبكة مميّزة في الدرج");

assert.match(drawerCss, /inset-inline-start:\s*0/, "الدرج من الحافة المنطقية للبداية (يمين في RTL)");
assert.doesNotMatch(drawerCss, /inset-inline-end:\s*0/, "لا تثبيت على inline-end (يسار في RTL)");
assert.doesNotMatch(drawerCss, /(?:^|\n)\s*(?:left|right)\s*:/, "صفر left/right فيزيائية في CSS الدرج");
assert.match(drawerCss, /html\[dir="rtl"\] \.drawer-panel/, "حركة RTL عبر dir لا إشارة يدوية وحدها");
assert.match(drawerCss, /transition:\s*transform 200ms/, "مدة الحركة 200ms");
assert.match(navBar, /touchstart/, "إيماءة فتح من الحافة");
assert.match(drawerCss, /opacity/, "التعتيم على opacity");
assert.doesNotMatch(drawerCss, /transition:[^;]*(width|right|left|filter|box-shadow)/, "لا تحريك width/right/filter");
assert.doesNotMatch(drawerCss, /backdrop-filter:\s*blur/, "لا backdrop-filter على الدرج");
assert.doesNotMatch(drawerCss, /(?<!backdrop-)filter:\s*blur/, "لا filter blur على الدرج");
assert.match(drawerCss, /prefers-reduced-motion:\s*reduce/, "مسار بلا انزلاق");
assert.match(drawerCss, /overscroll-behavior:\s*contain/, "تمرير الدرج محتوَى");

const drawerIndexRules = indexCss.match(/\.mobile-nav-backdrop\s*\{[^}]*\}/g) ?? [];
for (const rule of drawerIndexRules) {
  assert.doesNotMatch(rule, /backdrop-filter:\s*blur/, "mobile-nav-backdrop بلا طمس");
}

assert.match(navBar, /drawerMounted/, "lazy mount بعد أول فتح");
assert.match(
  navBar,
  /aria-controls=\{drawerMounted \? ["']main-navigation-drawer["'] : undefined\}/,
  "aria-controls فقط بعد وجود الدرج في الشجرة",
);
assert.match(lockSrc, /lockedScrollY|scrollY/, "حفظ موضع التمرير");
assert.match(lockSrc, /overflow = "hidden"/, "قفل تمرير body");
assert.match(lockSrc, /scrollTo/, "استعادة التمرير");
assert.match(lockSrc, /#drawer-root/, "لا حذف drawer-root عند التطهير");

const drawerHrefs = SIDEBAR_NAV_GROUPS.flatMap((g) => g.items.map((i) => i.href));
for (const href of ["/mushaf", "/quran-hub", "/lessons", "/fiqh", "/fawaid", "/miracles", "/sections", "/prayer-times", "/qibla", "/tasbih", "/settings"]) {
  assert.ok(drawerHrefs.includes(href), `الدرج يشمل ${href}`);
}
assert.ok(
  drawerHrefs.some((h) => h === "/duas" || h === "/adhkar"),
  "الأذكار في الدرج",
);
assert.match(registrySrc, /متابعة القراءة/, "متابعة القراءة في الدرج");
assert.match(registrySrc, /loadLastPageSync/, "متابعة من التخزين المحلي");
assert.doesNotMatch(registrySrc, /warmStaticQuranicFonts|qpc-page/, "لا تحميل خطوط المصحف من الدرج");
assert.ok(drawerHrefs.length < 40, `عدد صفوف الدرج ${drawerHrefs.length} < 40`);
assert.ok(
  SIDEBAR_NAV_GROUPS.every((g) => g.title && g.accent && g.items.every((i) => i.href && i.label && i.accent)),
  "مجموعات الدرج مكتملة بعناوين وألوان",
);
assert.ok(SIDEBAR_NAV_GROUPS.length >= 3, "الدرج مقسوم إلى مجموعات متعددة");
assert.ok(
  new Set(SIDEBAR_NAV_GROUPS.map((g) => g.accent)).size >= 3,
  "ألوان مجموعات الدرج متمايزة",
);

assert.ok(existsSync(resolve(root, "public/brand/drawer-open-390x844.png")), "لقطة 390×844");
assert.ok(existsSync(resolve(root, "public/brand/drawer-open-390x844-dark.png")), "لقطة الوضع الليلي");

console.log(`side-nav-drawer-gate.test.ts: ok (${drawerHrefs.length} صفوف)`);
