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
  quranHubSections,
  lessonsHubSections,
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
  const expectedBottom = ["quran", "lessons", "prayer", "fiqh", "sections"];
  if (bottom.map((s) => s.id).join(",") !== expectedBottom.join(",")) {
    fail(`الشريط السفلي المتوقع: ${expectedBottom.join(" · ")}`);
  }
  const bottomLabels = bottom.map((s) => s.navLabel ?? s.label);
  if (bottomLabels[0] !== "مركز القرآن") fail("التبويب الأول يجب أن يكون «مركز القرآن»");
  if (bottomLabels[4] !== "الأقسام") fail("التبويب الخامس يجب أن يكون «الأقسام»");
  if (bottomLabels.some((l) => l === "المزيد" || l === "قرآن")) {
    fail("تسميات قديمة (المزيد/قرآن) ما زالت في الشريط السفلي");
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

    // 9) نص أبيض مربوط بـ variant — ممنوع text-white مفرد
    if (exists("src/components/sections/FeaturedSectionCard.tsx")) {
      const feat = read("src/components/sections/FeaturedSectionCard.tsx");
      const featCss = exists("src/components/sections/section-cards.css")
        ? read("src/components/sections/section-cards.css")
        : "";
      if (/text-white/.test(feat)) {
        fail("FeaturedSectionCard: ممنوع text-white مفرد — اللون داخل .card--featured فقط");
      }
      if (!/card--featured/.test(feat)) {
        fail("FeaturedSectionCard يجب أن يستخدم card--featured");
      }
      if (featCss && !/card--featured[\s\S]{0,800}color:\s*#ffffff/i.test(featCss)) {
        fail("section-cards.css: .card--featured بلا لون نص أبيض مربوط");
      }
      if (
        featCss &&
        !/card--featured[\s\S]{0,700}background-color:\s*var\(--color-primary-dark|card--featured[\s\S]{0,700}background-color:\s*var\(--mj-brand-deep|card--featured[\s\S]{0,700}background-color:\s*#123[fF]2[eE]/i.test(
          featCss,
        )
      ) {
        fail("section-cards.css: .card--featured بلا خلفية أخضر غامق موحّد (فقه)");
      }
      if (featCss && /card--featured[\s\S]{0,500}background-color:\s*#1f7a5a/i.test(featCss)) {
        fail("section-cards.css: .card--featured ما زال يستخدم Teal الفاتح #1f7a5a");
      }
    }

    // 10) aria-label وهدف لمس ≥ 44
    for (const f of ["FeaturedSectionCard.tsx", "SectionCard.tsx", "SectionRow.tsx"]) {
      if (!exists(path.join("src/components/sections", f))) continue;
      const src = read(path.join("src/components/sections", f));
      if (!/aria-label/.test(src)) fail(`${f}: بلا aria-label`);
      if (!/card--|min-h-\[44|min-h-11|section-card|section-row/.test(src)) {
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
      if (f !== "SectionRow.tsx") {
        if (!/section\.label/.test(src) || !/section\.subtitle/.test(src)) {
          fail(`${f}: label و subtitle مطلوبان كعقدتين`);
        }
      }
    }

    // 12) أنماط دلالية موجودة
    if (!exists("src/components/sections/section-cards.css")) {
      fail("section-cards.css مفقود — البطاقات تنهار بلا أنماط دلالية");
    } else {
      const css = read("src/components/sections/section-cards.css");
      if (!/\.card\s*\{/.test(css)) fail("CSS: .card مفقود");
      if (!/\.card--featured/.test(css)) fail("CSS: .card--featured مفقود");
      if (!/\.card--compact/.test(css)) fail("CSS: .card--compact مفقود");
      if (!/border-radius:\s*16px/.test(css)) fail("CSS: border-radius 16px مفقود");
      if (!/min-height:\s*44px/.test(css)) fail("CSS: min-height 44px مفقود");
      if (/flex-direction:\s*column-reverse|flex-wrap:\s*wrap-reverse/.test(css)) {
        fail("CSS: reverse flex ممنوع في بطاقات الأقسام");
      }
    }

    // 13) المزيد/الأقسام: ترتيب المجموعات بلا reverse
    if (exists("src/features/more/MoreHubFromRegistry.tsx")) {
      const hub = read("src/features/more/MoreHubFromRegistry.tsx");
      if (!/SectionLobby|getLobby/.test(hub) && !/SECTION_GROUP_ORDER\.map/.test(hub)) {
        fail("MoreHubFromRegistry: يجب البناء عبر SectionLobby من السجل");
      }
      if (/\.reverse\(|flex-col-reverse|column-reverse/.test(hub)) {
        fail("MoreHubFromRegistry: reverse ممنوع");
      }
      if (!/SectionLobby/.test(hub)) {
        warn("MoreHubFromRegistry: التحويل إلى SectionLobby في دفعة الحذف (1238)");
      }
    }

    // 14) صفر ChevronRight في صفوف الأقسام (إن وُجد شيفرون)
    if (exists("src/components/sections/SectionRow.tsx")) {
      const row = read("src/components/sections/SectionRow.tsx");
      if (/ChevronRight/.test(row)) fail("SectionRow: استخدم ChevronLeft فقط (RTL)");
    }

    // 15) تحويلات الدمج في App
    {
      const appSrc = read("src/App.tsx");
      for (const r of SECTION_MERGE_REDIRECTS) {
        const escaped = r.from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
        const re = new RegExp(
          `path="${escaped}"[\\s\\S]{0,120}Redirect\\s+to="${r.to.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}"`,
        );
        if (!re.test(appSrc)) {
          fail(`تحويل دمج مفقود في App: ${r.from} → ${r.to}`);
        }
      }
    }

    // 16) صفحة الأقسام بلا شيت/إغلاق + صفر text-white في البطاقات
    {
      const bottom = read("src/components/BottomNavBar.tsx");
      if (/MoreBottomSheet/.test(bottom)) fail("BottomNavBar: يجب إزالة شيت المزيد");
      if (/المزيد/.test(bottom)) fail("BottomNavBar: ممنوع ظهور «المزيد»");
      if (!exists("src/pages/account/SectionsPage.tsx")) fail("SectionsPage مفقودة");
      const sectionsPage = read("src/pages/account/SectionsPage.tsx");
      if (/إغلاق|AppBottomSheet|MoreBottomSheet/.test(sectionsPage)) {
        fail("SectionsPage: ممنوع زر إغلاق أو Bottom Sheet");
      }
      const cardsTsx =
        read("src/components/sections/FeaturedSectionCard.tsx") +
        read("src/components/sections/SectionCard.tsx") +
        read("src/components/sections/SectionRow.tsx");
      if (/text-white/.test(cardsTsx)) {
        fail("ممنوع text-white في مكوّنات البطاقات — اللون من الـvariant فقط");
      }
    }

    // 17) صفر ذكر لعدد صفحات المصحف في واجهة مركز القرآن
    {
      const hub = read("src/pages/quran/ui/QuranHubView.tsx");
      if (/٦٠٤|604\s*صفح|صفح[^\n]{0,12}604/.test(hub)) {
        fail("QuranHubView: ممنوع ذكر عدد صفحات المصحف");
      }
      if (!/quranHubSections|getLobby|sections\.registry|section-lobbies/.test(hub)) {
        fail("QuranHubView: يجب البناء من سجل الأقسام");
      }
      if (/QURAN_SECTIONS\s*=/.test(hub)) {
        fail("QuranHubView: مصفوفة يدوية ممنوعة");
      }
      const open = SECTIONS.find((s) => s.id === "open-mushaf");
      if (!open || open.label !== "فتح المصحف") {
        fail("مدخل open-mushaf يجب أن يحمل عنوان «فتح المصحف»");
      }
      if (/٦٠٤|604/.test(open.subtitle + open.label)) {
        fail("بطاقة فتح المصحف: ممنوع ذكر عدد الصفحات");
      }
    }

    // 18) aliases للتسميات القديمة
    {
      const quran = SECTIONS.find((s) => s.id === "quran");
      const sections = SECTIONS.find((s) => s.id === "sections");
      if (!quran?.aliases?.some((a) => a === "قرآن" || a === "القرآن")) {
        fail("quran: aliases يجب أن تتضمن «قرآن»");
      }
      if (!sections?.aliases?.includes("المزيد")) {
        fail("sections: aliases يجب أن تتضمن «المزيد»");
      }
    }

    // 19) hub واحد لكل قسم — صفر تكرار بطاقات بين الهبات
    {
      const hubs = new Set(["quran", "lessons", "sections"]);
      for (const s of SECTIONS) {
        if (!hubs.has(s.hub)) fail(`hub غير صالح: ${s.id}=${s.hub}`);
      }
      const quranIds = SECTIONS.filter((s) => s.status !== "hidden" && s.hub === "quran").map((s) => s.id);
      const lessonsIds = SECTIONS.filter((s) => s.status !== "hidden" && s.hub === "lessons").map((s) => s.id);
      if (!quranIds.includes("open-mushaf") || !quranIds.includes("quran-numbers")) {
        fail("مركز القرآن يجب أن يتضمن فتح المصحف والقرآن في أرقام");
      }
      if (!lessonsIds.includes("quran-circles")) {
        fail("حلقات القرآن يجب أن تكون hub=lessons");
      }
      if (quranIds.includes("quran-circles")) {
        fail("حلقات القرآن لا تُعرض في مركز القرآن");
      }
    }

    // 20) رأس مركز القرآن بلا وصف تسويقي
    {
      const hub = read("src/pages/quran/ui/QuranHubView.tsx");
      if (/اقرأ|استمع|راجع|وابحث|من مصدر واحد/.test(hub)) {
        fail("QuranHubView: ممنوع سطر وصفي تحت العنوان");
      }
      if (!/quran-hub-page__title|title-only|section-lobby__title|SectionLobby/.test(hub)) {
        fail("QuranHubView: عنوان مميّز مطلوب");
      }
      if (!/quranHubSections|getLobby/.test(hub)) {
        fail("QuranHubView: التوزيع عبر hub من السجل");
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
