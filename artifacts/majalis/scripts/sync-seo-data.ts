/**
 * مزامنة مصادر بيانات SEO من المصدر الوحيد (TypeScript) إلى المرايا (JSON) ومسارات
 * الفهرسة، فلا تتباعد المصادر ولا تبقى صفحات كتب/علماء بلا نسخة ثابتة تُعرض
 * للزواحف (وهو ما كان يجعل المسارات غير المُولَّدة ترتد إلى محتوى الصفحة الرئيسية).
 *
 * يُشغَّل تلقائيًا قبل generate:seo في البناء.
 * التحقق فقط (CI): node ... --check  → يفشل إذا كانت المرايا غير متزامنة.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHOLARS } from "../src/lib/scholars-data";
import { LIBRARY_CATALOG } from "../src/lib/library-catalog";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");

function readJson(p: string): any {
  return JSON.parse(readFileSync(resolve(appRoot, p), "utf8"));
}
function serialize(v: unknown): string {
  return JSON.stringify(v, null, 2) + "\n";
}

let drift = 0;
function writeOrCheck(relPath: string, nextContent: string, label: string) {
  const abs = resolve(appRoot, relPath);
  let current = "";
  try {
    current = readFileSync(abs, "utf8");
  } catch {
    /* missing */
  }
  if (current === nextContent) return;
  if (CHECK) {
    drift++;
    console.error(`✗ غير متزامن: ${label} (${relPath})`);
  } else {
    writeFileSync(abs, nextContent, "utf8");
    console.log(`✓ حُدِّث: ${label} (${relPath})`);
  }
}

// حدّ آمن لطول وصف الميتا
function clampDesc(s: string, max = 158): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/[،,\s]+\S*$/, "") + "…";
}

// ── 1) مرآة فهرس المكتبة (كل الكتب) ───────────────────────────────────────
const libraryJson = [...LIBRARY_CATALOG]
  .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
  .map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    category: b.category,
    description: b.description,
  }));
writeOrCheck("src/data/library-catalog.json", serialize(libraryJson), "مرآة فهرس المكتبة");

// ── 2) مرآة قائمة العلماء (كل العلماء) ────────────────────────────────────
const scholarsList = SCHOLARS.map((s) => ({ id: s.id, name: s.name, died: s.died }));
writeOrCheck("src/data/scholars-list.json", serialize(scholarsList), "مرآة قائمة العلماء");

// ── 2ب) بيانات Person للـ prerender (حقول موثّقة فقط، بلا تلفيق) ───────────
const scholarsSeo = SCHOLARS.map((s) => ({
  id: s.id,
  name: s.name,
  fullName: s.fullName,
  bio: s.bio,
  specialty: s.specialty || [],
  region: s.region,
  died: s.died,
  ...(s.madhhab ? { madhhab: s.madhhab } : {}),
  era: s.era,
}));
writeOrCheck("src/data/scholars-seo.json", serialize(scholarsSeo), "بيانات Person للعلماء");

// ── 3) مسارات العلماء داخل seo-routes.json ───────────────────────────────
// ملاحظة: generate-seo.mjs يولّد صفحات العلماء من SCHOLARS مباشرة.
// إدراجها هنا يسبب «مسار مكرر» — نكتفي بمرايا JSON ولا نلمس seo-routes للعلماء.
{
  const seoRoutes = readJson("src/lib/seo-routes.json");
  const scholarPaths = (seoRoutes.routes || []).filter((r: { path?: string }) =>
    /^\/scholars\/[^/]+$/.test(String(r.path || "")),
  );
  if (scholarPaths.length && CHECK) {
    console.warn(
      `⚠ seo-routes.json يحتوي ${scholarPaths.length} مسار عالِم — يُفضَّل إبقاؤها خارج الملف لأن المولّد يولّدها ديناميكياً`,
    );
  }
}

if (CHECK && drift > 0) {
  console.error(`\n✗ ${drift} مرآة غير متزامنة — شغّل: pnpm run sync:seo-data`);
  process.exit(1);
}
console.log(
  CHECK
    ? "✓ جميع مرايا SEO متزامنة"
    : `✓ تمت المزامنة — ${libraryJson.length} كتابًا، ${scholarsList.length} عالِمًا (مرايا JSON فقط؛ مسارات العلماء من المولّد)`,
);
