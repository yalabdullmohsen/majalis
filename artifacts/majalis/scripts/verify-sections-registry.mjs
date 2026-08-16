#!/usr/bin/env node
/**
 * بوابات سجل الأقسام (SSOT) — تمنع عودة العشوائية في التنقّل.
 * التشغيل: node --import tsx scripts/verify-sections-registry.mjs
 *
 * القواعد 1–3 دائماً صارمة.
 * 4–10: صارمة عند توفّر الملفات؛ وإلا تُسجَّل كمرحلة لاحقة بلا فشل (PR1).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const errors = [];
const warnings = [];

function fail(msg) {
  errors.push(msg);
}
function warn(msg) {
  warnings.push(msg);
}

function read(rel) {
  return fs.readFileSync(path.join(ROOT, rel), "utf8");
}

function exists(rel) {
  return fs.existsSync(path.join(ROOT, rel));
}

const {
  SECTIONS,
  SECTION_GROUP_ORDER,
  SECTION_GROUP_META,
  SECTION_MERGE_REDIRECTS,
  featuredSections,
  bottomNavSections,
  sectionsForSurface,
} = await import("../src/config/sections.registry.ts");

const SPACING = new Set([8, 12, 16, 24]);

// ── 1) تكرار id / route / label ──────────────────────────────
{
  const ids = new Map();
  const routes = new Map();
  const labels = new Map();
  for (const s of SECTIONS) {
    ids.set(s.id, (ids.get(s.id) || 0) + 1);
    routes.set(s.route, (routes.get(s.route) || 0) + 1);
    labels.set(s.label, (labels.get(s.label) || 0) + 1);
  }
  for (const [k, c] of ids) if (c > 1) fail(`تكرار id: ${k}`);
  for (const [k, c] of routes) if (c > 1) fail(`تكرار route: ${k}`);
  for (const [k, c] of labels) if (c > 1) fail(`تكرار label: ${k}`);
}

// ── 2) تكرار أيقونة ──────────────────────────────────────────
{
  const icons = new Map();
  for (const s of SECTIONS) {
    const key = s.icon;
    icons.set(key, (icons.get(key) || []).concat(s.id));
  }
  for (const [, ids] of icons) {
    if (ids.length > 1) fail(`تكرار أيقونة بين: ${ids.join(", ")}`);
  }
}

// ── 3) subtitle إلزامي ≤ ٤٥ حرفاً ────────────────────────────
{
  for (const s of SECTIONS) {
    if (!s.subtitle || !String(s.subtitle).trim()) {
      fail(`بلا subtitle: ${s.id}`);
      continue;
    }
    const len = [...s.subtitle].length;
    if (len > 45) fail(`subtitle > 45 (${len}): ${s.id} — «${s.subtitle}»`);
  }
}

// هيكل ثابت
{
  if (SECTION_GROUP_ORDER.length !== 7) {
    fail(`عدد المجموعات يجب أن يكون 7 وليس ${SECTION_GROUP_ORDER.length}`);
  }
  if (SECTION_GROUP_ORDER[SECTION_GROUP_ORDER.length - 1] !== "account") {
    fail("مجموعة الحساب والإعدادات يجب أن تكون الأخيرة");
  }
  const featured = featuredSections();
  if (featured.length !== 6) {
    fail(`الأبواب المميّزة يجب أن تكون 6 وليس ${featured.length}`);
  }
  const bottom = bottomNavSections();
  const expectedBottom = ["home", "quran", "prayer", "lessons", "more"];
  if (bottom.map((s) => s.id).join(",") !== expectedBottom.join(",")) {
    fail(`الشريط السفلي المتوقع: ${expectedBottom.join(" · ")}`);
  }
  for (const g of SECTION_GROUP_ORDER) {
    if (!SECTION_GROUP_META[g]) fail(`SECTION_GROUP_META ناقص: ${g}`);
  }
}

// ── 4) مسار في الراوتر بلا مدخل / مدخل بلا مسار ───────────────
{
  const appSrc = read("src/App.tsx");
  const appPaths = new Set([...appSrc.matchAll(/path="(\/[^"]*)"/g)].map((m) => m[1]));
  const missingInApp = SECTIONS.filter((s) => s.status === "live" && !appPaths.has(s.route));
  for (const s of missingInApp) {
    fail(`مدخل بسجل بلا مسار في App: ${s.id} → ${s.route}`);
  }
  for (const r of SECTION_MERGE_REDIRECTS) {
    const target = SECTIONS.find((s) => s.route === r.to);
    if (!target) warn(`هدف دمج بلا قسم في السجل: ${r.from} → ${r.to}`);
  }
}

// ── 5) تنقّل يدوي خارج السجل + منع أيقونات/مصفوفات يدوية ─────
{
  const navSurfaces = [
    "src/features/more/MoreHubFromRegistry.tsx",
    "src/features/more/moreSections.ts",
    "src/pages/account/MorePage.tsx",
    "src/components/MoreBottomSheet.tsx",
    "src/components/layout/DrawerFromRegistry.tsx",
    "src/lib/sidebar-nav.ts",
  ];

  const lucideValueImport =
    /import\s*\{[^}]*\}\s*from\s*["']lucide-react["']/;
  const manualNavArray =
    /\{\s*id:\s*["'][^"']+["']\s*,\s*label:\s*["'][^"']+["'][\s\S]{0,120}Icon:\s*[A-Z]/;

  for (const f of navSurfaces) {
    if (!exists(f)) continue;
    const src = read(f);
    if (!src.includes("sections.registry") && !f.endsWith("MorePage.tsx") && !f.endsWith("MoreBottomSheet.tsx")) {
      // MorePage/Sheet يستوردان MoreHubFromRegistry الذي يستورد السجل
      if (!src.includes("MoreHubFromRegistry") && !src.includes("DrawerFromRegistry")) {
        fail(`${f}: يجب أن يستورد سجل الأقسام أو مكوّناً مبنياً عليه`);
      }
    }
    if (lucideValueImport.test(src)) {
      fail(`${f}: ممنوع استيراد أيقونات lucide مباشرة — الأيقونة من السجل فقط`);
    }
    if (manualNavArray.test(src)) {
      fail(`${f}: مصفوفة تنقّل يدوية مكتشفة — المصدر الوحيد هو السجل`);
    }
  }

  // كتالوج الخدمات: يجب الاشتقاق من السجل؛ أيقونات الجلسة فقط مسموحة
  if (exists("src/lib/services-center-nav.ts")) {
    const src = read("src/lib/services-center-nav.ts");
    if (!src.includes("sections.registry")) {
      fail("services-center-nav.ts: يجب أن يستورد سجل الأقسام");
    }
    if (!src.includes("SECTION_GROUP_ORDER") || !src.includes("sectionsByGroup")) {
      fail("services-center-nav.ts: يجب بناء المجموعات عبر SECTION_GROUP_ORDER + sectionsByGroup");
    }
    const m = src.match(/import\s*\{([^}]*)\}\s*from\s*["']lucide-react["']/);
    if (m) {
      const names = m[1]
        .split(",")
        .map((s) => s.trim().split(/\s+as\s+/)[0])
        .filter(Boolean);
      const allowed = new Set(["LogOut", "Share2", "Star"]);
      const bad = names.filter((n) => !allowed.has(n));
      if (bad.length) {
        fail(`services-center-nav.ts: أيقونات lucide غير مسموحة للأقسام: ${bad.join(", ")}`);
      }
    }
    if (/href:\s*["']\/tasbih["']/.test(src) || /href:\s*["']\/memorize["']/.test(src)) {
      fail("services-center-nav.ts: ما زال يحوي عناصر تنقّل يدوية بمسارات ثابتة");
    }
  }

  // الدرج: أقسام من السجل؛ أيقونات الجلسة/الكروم مسموحة
  if (exists("src/components/SideNavDrawer.tsx")) {
    const src = read("src/components/SideNavDrawer.tsx");
    if (!src.includes("DrawerFromRegistry") && !src.includes("sections.registry")) {
      fail("SideNavDrawer.tsx: يجب أن يستخدم DrawerFromRegistry أو السجل");
    }
  }
}

// ── 6) ترتيب المزيد = ترتيب الدرج ────────────────────────────
{
  const more = sectionsForSurface("moreHub").map((s) => s.id);
  const drawer = sectionsForSurface("drawer").map((s) => s.id);
  const moreSet = new Set(more);
  const drawerOnly = drawer.filter((id) => moreSet.has(id));
  const moreShared = more.filter((id) => drawer.includes(id));
  if (drawerOnly.join(",") !== moreShared.join(",")) {
    fail("اختلاف ترتيب العناصر المشتركة بين moreHub والـ drawer");
  }
}

// ── 7–10) مكوّنات sections/ عند وجودها ───────────────────────
{
  const sectionsDir = path.join(ROOT, "src/components/sections");
  if (!fs.existsSync(sectionsDir)) {
    warn("مكوّنات sections/ غير موجودة بعد — بوابات 7–10 في PR2/PR6");
  } else {
    const files = fs.readdirSync(sectionsDir).filter((f) => f.endsWith(".tsx"));
    const allowed = new Set([
      "FeaturedSectionCard.tsx",
      "SectionCard.tsx",
      "SectionRow.tsx",
      "SectionsGrids.tsx",
      "index.ts",
      "index.tsx",
    ]);
    for (const f of files) {
      if (!allowed.has(f) && !f.endsWith(".test.tsx")) {
        fail(`نمط بطاقة غير مسموح: ${f} (المسموح: Featured / Card / Row فقط)`);
      }
    }

    let allSrc = "";
    for (const f of files) {
      allSrc += read(path.join("src/components/sections", f));
    }

    // 7) تدرّج أخضر خارج featured
    if (
      /from-primary|bg-gradient.*primary|gradient.*green/i.test(allSrc) &&
      !/FeaturedSectionCard/.test(allSrc)
    ) {
      fail("تدرّج أخضر خارج FeaturedSectionCard");
    }
    const cardSrc = exists("src/components/sections/SectionCard.tsx")
      ? read("src/components/sections/SectionCard.tsx")
      : "";
    const rowSrc = exists("src/components/sections/SectionRow.tsx")
      ? read("src/components/sections/SectionRow.tsx")
      : "";
    if (/bg-gradient|from-\[#|from-primary/.test(cardSrc + rowSrc)) {
      fail("بطاقة/صف غير مميّز يستخدم تدرّجاً أخضر");
    }

    // 8) تباعد خارج السلم
    const spacingHits = allSrc.matchAll(
      /(?:gap|p|px|py|pt|pb|pl|pr|m|mx|my|mt|mb|ml|mr|space-[xy])-\[(\d+)px\]/g,
    );
    for (const m of spacingHits) {
      const n = Number(m[1]);
      if (!SPACING.has(n)) fail(`تباعد خارج السلم 8/12/16/24: ${m[0]}`);
    }

    // 9) نص أبيض فوق أخضر في Featured (CSS دلالية أو text-white)
    if (exists("src/components/sections/FeaturedSectionCard.tsx")) {
      const feat = read("src/components/sections/FeaturedSectionCard.tsx");
      const featCss = exists("src/components/sections/section-cards.css")
        ? read("src/components/sections/section-cards.css")
        : "";
      if (/text-black|text-foreground|text-muted|text-gray|text-zinc/.test(feat)) {
        fail("نص غير أبيض فوق بطاقة Featured الخضراء");
      }
      if (!/text-white|section-card--featured/.test(feat)) {
        fail("FeaturedSectionCard يجب أن يضع نصًا أبيض / صنف featured");
      }
      if (featCss && !/\.section-card--featured[\s\S]{0,400}color:\s*#fff|color:\s*#ffffff|color:\s*var\(--on-brand/i.test(featCss)) {
        fail("section-cards.css: بطاقة featured بلا لون نص أبيض");
      }
    }

    // 10) aria-label وهدف لمس ≥ 44
    for (const f of ["FeaturedSectionCard.tsx", "SectionCard.tsx", "SectionRow.tsx"]) {
      if (!exists(path.join("src/components/sections", f))) continue;
      const src = read(path.join("src/components/sections", f));
      if (!/aria-label/.test(src)) fail(`${f}: بلا aria-label`);
      if (
        !/min-h-\[44|min-h-11|h-11|size-11|min-h-\[2\.75rem\]|section-card|section-row/.test(src)
      ) {
        fail(`${f}: هدف لمس يُفترض ≥ 44px`);
      }
    }

    // 11) فصل label/subtitle — ممنوع دمج نصّي في عقدة واحدة
    for (const f of ["FeaturedSectionCard.tsx", "SectionCard.tsx", "SectionRow.tsx"]) {
      if (!exists(path.join("src/components/sections", f))) continue;
      const src = read(path.join("src/components/sections", f));
      if (/\{section\.label\}\s*\{section\.subtitle\}/.test(src)) {
        fail(`${f}: label و subtitle ملتصقان في JSX`);
      }
      if (/`\$\{[^}]*label[^}]*\}\$\{[^}]*subtitle/.test(src) && !/aria-label/.test(src.slice(0, src.indexOf("`")))) {
        // aria مسموح؛ دمج العرض ممنوع
      }
      if (!/section\.(label|subtitle)/.test(src) && f !== "SectionRow.tsx") {
        fail(`${f}: يجب عرض label/subtitle منفصليْن`);
      }
      if (f !== "SectionRow.tsx") {
        if (!/section\.label/.test(src) || !/section\.subtitle/.test(src)) {
          fail(`${f}: label و subtitle مطلوبان كعقدتين`);
        }
      }
    }

    // 12) أنماط دلالية موجودة (لا اعتماد على Tailwind utility وحدها)
    if (!exists("src/components/sections/section-cards.css")) {
      fail("section-cards.css مفقود — البطاقات تنهار بلا أنماط دلالية");
    } else {
      const css = read("src/components/sections/section-cards.css");
      if (!/\.section-card\s*\{/.test(css)) fail("CSS: .section-card مفقود");
      if (!/\.section-card--featured\s*\{/.test(css)) fail("CSS: .section-card--featured مفقود");
      if (!/\.section-row\s*\{/.test(css)) fail("CSS: .section-row مفقود");
      if (!/border-radius:\s*16px/.test(css)) fail("CSS: border-radius 16px مفقود");
      if (!/min-height:\s*44px/.test(css)) fail("CSS: min-height 44px مفقود");
      if (/flex-direction:\s*column-reverse|flex-wrap:\s*wrap-reverse/.test(css)) {
        fail("CSS: reverse flex ممنوع في بطاقات الأقسام");
      }
    }

    // 13) المزيد: ترتيب المجموعات بلا reverse + مكوّنات البطاقات
    if (exists("src/features/more/MoreHubFromRegistry.tsx")) {
      const hub = read("src/features/more/MoreHubFromRegistry.tsx");
      if (!/SECTION_GROUP_ORDER\.map/.test(hub)) {
        fail("MoreHubFromRegistry: يجب البناء عبر SECTION_GROUP_ORDER.map");
      }
      if (/\.reverse\(|flex-col-reverse|column-reverse/.test(hub)) {
        fail("MoreHubFromRegistry: reverse ممنوع");
      }
      if (!/FeaturedSectionsGrid/.test(hub) || !/SectionsCardGrid/.test(hub)) {
        fail("MoreHubFromRegistry: يجب استخدام شبكات البطاقات الموحّدة");
      }
      if (!/more-hub__group-title/.test(hub)) {
        fail("MoreHubFromRegistry: عنوان المجموعة بصنف more-hub__group-title");
      }
    }

    // 14) صفر ChevronRight في صفوف الأقسام
    if (exists("src/components/sections/SectionRow.tsx")) {
      const row = read("src/components/sections/SectionRow.tsx");
      if (/ChevronRight/.test(row)) fail("SectionRow: استخدم ChevronLeft فقط (RTL)");
      if (!/ChevronLeft/.test(row)) fail("SectionRow: ChevronLeft مطلوب");
    }

    // 15) تحويلات الدمج في App
    {
      const appSrc = read("src/App.tsx");
      for (const r of SECTION_MERGE_REDIRECTS) {
        const escaped = r.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(`path="${escaped}"[\\s\\S]{0,120}Redirect\\s+to="${r.to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`);
        if (!re.test(appSrc)) {
          fail(`تحويل دمج مفقود في App: ${r.from} → ${r.to}`);
        }
      }
    }
  }
}

// ── تقرير ────────────────────────────────────────────────────
if (warnings.length) {
  console.log("verify-sections-registry: warnings");
  for (const w of warnings) console.log("  ·", w);
}

if (errors.length) {
  console.error("verify-sections-registry: FAILED");
  for (const e of errors) console.error("  ✗", e);
  process.exit(1);
}

console.log(
  `verify-sections-registry: OK (${SECTIONS.length} sections · ${featuredSections().length} featured · ${SECTION_GROUP_ORDER.length} groups)`,
);
