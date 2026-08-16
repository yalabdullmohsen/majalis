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

// ── 5) تنقّل يدوي خارج السجل (بعد تبنّي الأسطح) ───────────────
{
  const markers = [
    "src/features/more/MoreHubFromRegistry.tsx",
    "src/components/layout/DrawerFromRegistry.tsx",
  ];
  const adopted = markers.some((m) => exists(m));
  if (!adopted) {
    warn("فحص التنقّل اليدوي مؤجّل حتى تبنّي المزيد/الدرج من السجل (PR3–4)");
  } else {
    const navFiles = [
      "src/features/more/moreSections.ts",
      "src/lib/services-center-nav.ts",
    ];
    for (const f of navFiles) {
      if (!exists(f)) continue;
      const src = read(f);
      if (!src.includes("sections.registry")) {
        fail(`${f}: يجب أن يستورد سجل الأقسام`);
      }
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

    // 9) نص غير أبيض فوق أخضر في Featured
    if (exists("src/components/sections/FeaturedSectionCard.tsx")) {
      const feat = read("src/components/sections/FeaturedSectionCard.tsx");
      if (/text-black|text-foreground|text-muted|text-gray|text-zinc/.test(feat)) {
        fail("نص غير أبيض فوق بطاقة Featured الخضراء");
      }
      if (!/text-white/.test(feat)) {
        fail("FeaturedSectionCard يجب أن يستخدم text-white");
      }
    }

    // 10) aria-label وهدف لمس
    for (const f of ["FeaturedSectionCard.tsx", "SectionCard.tsx", "SectionRow.tsx"]) {
      if (!exists(path.join("src/components/sections", f))) continue;
      const src = read(path.join("src/components/sections", f));
      if (!/aria-label/.test(src)) fail(`${f}: بلا aria-label`);
      if (!/min-h-\[44|min-h-11|h-11|size-11|min-h-\[2\.75rem\]/.test(src)) {
        fail(`${f}: هدف لمس يُفترض ≥ 44px`);
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
