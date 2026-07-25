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

// ── 3) مسارات فهرسة العلماء داخل seo-routes.json (وصف فريد لكل عالِم) ──────
const seoRoutes = readJson("src/lib/seo-routes.json");
const nonScholarRoutes = seoRoutes.routes.filter(
  (r: any) => !/^\/scholars\/[^/]+$/.test(r.path),
);
// موضع إدراج مسارات العلماء: مباشرة بعد فهرس /scholars إن وُجد، وإلا في النهاية
const idxAfter = nonScholarRoutes.findIndex((r: any) => r.path === "/scholars");
const scholarRoutes = SCHOLARS.map((s) => {
  const works = (s.key_works || []).slice(0, 3);
  const worksText = works.length ? ` من مؤلفاته: ${works.join("، ")}.` : "";
  const description = clampDesc(`${s.bio}${worksText}`);
  const keywords = [
    s.name,
    ...(s.specialty || []),
    ...(s.madhhab ? [`المذهب ${s.madhhab}`] : []),
    "المجلس العلمي",
  ].slice(0, 6);
  return {
    path: `/scholars/${s.id}`,
    title: `${s.name} — سيرته ومؤلفاته | المجلس العلمي`,
    description,
    keywords,
    sitemap: true,
    changefreq: "monthly",
    priority: 0.75,
  };
});
const nextRoutes =
  idxAfter >= 0
    ? [
        ...nonScholarRoutes.slice(0, idxAfter + 1),
        ...scholarRoutes,
        ...nonScholarRoutes.slice(idxAfter + 1),
      ]
    : [...nonScholarRoutes, ...scholarRoutes];
seoRoutes.routes = nextRoutes;
writeOrCheck("src/lib/seo-routes.json", serialize(seoRoutes), "مسارات فهرسة العلماء");

if (CHECK && drift > 0) {
  console.error(`\n✗ ${drift} مرآة غير متزامنة — شغّل: pnpm run sync:seo-data`);
  process.exit(1);
}
console.log(
  CHECK
    ? "✓ جميع مرايا SEO متزامنة"
    : `✓ تمت المزامنة — ${libraryJson.length} كتابًا، ${scholarsList.length} عالِمًا (${scholarRoutes.length} مسارًا)`,
);
