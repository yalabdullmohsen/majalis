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

// ── 1) فهرس المكتبة الغني — لا يُستبدل بنسخة مختزلة ───────────────────────
// المصدر الحي: library-catalog.ts. المرآة الغنية (verificationStatus/sources/…)
// يُعيد توليدها: npx tsx scripts/regen-library-catalog-json.mjs
// هنا نحدّث فقط الحقول المشتركة إن تغيّرت، بلا حذف إثراء سابق.
{
  const catalogPath = "src/data/library-catalog.json";
  const current = readJson(catalogPath) as Array<Record<string, unknown>>;
  const byId = new Map(current.map((b) => [String(b.id), b]));
  const liveIds = new Set(LIBRARY_CATALOG.map((b) => b.id));
  const missing = LIBRARY_CATALOG.filter((b) => !byId.has(b.id)).map((b) => b.id);
  const orphaned = current.filter((b) => !liveIds.has(String(b.id))).map((b) => String(b.id));
  if (missing.length || orphaned.length) {
    console.error(
      `✗ انحراف فهرس المكتبة (ناقص: ${missing.length} · يتيم: ${orphaned.length}). شغّل: npx tsx scripts/regen-library-catalog-json.mjs`,
    );
    if (CHECK) process.exit(1);
    throw new Error("library-catalog.json غير متزامن مع library-catalog.ts");
  }
  const next = current.map((row) => {
    const live = LIBRARY_CATALOG.find((b) => b.id === row.id);
    if (!live) return row;
    return {
      ...row,
      title: live.title,
      author: live.author,
      category: live.category,
      description: live.description,
      canonicalTitle: live.title,
      slug: live.id,
    };
  });
  writeOrCheck(catalogPath, serialize(next), "فهرس المكتبة (حقول مشتركة فقط)");
}

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

// ── 3) لا تُحقَن مسارات /scholars/:id في seo-routes.json ─────────────────
// generate-seo.mjs يولّدها من SCHOLARS مباشرةً؛ حقنها هنا يكرّر المسار ويفشل البناء.
// إن وُجدت بقايا قديمة من حقن سابق، أزلها للحفاظ على مصدر واحد.
{
  const seoRoutes = readJson("src/lib/seo-routes.json");
  const cleaned = seoRoutes.routes.filter((r: { path: string }) => !/^\/scholars\/[^/]+$/.test(r.path));
  if (cleaned.length !== seoRoutes.routes.length) {
    seoRoutes.routes = cleaned;
    writeOrCheck("src/lib/seo-routes.json", serialize(seoRoutes), "إزالة مسارات علماء مكررة من seo-routes");
  }
}

if (CHECK && drift > 0) {
  console.error(`\n✗ ${drift} مرآة غير متزامنة — شغّل: pnpm run sync:seo-data`);
  process.exit(1);
}
console.log(
  CHECK
    ? "✓ جميع مرايا SEO متزامنة"
    : `✓ تمت المزامنة — ${LIBRARY_CATALOG.length} كتابًا، ${scholarsList.length} عالِمًا (Person SEO) — مسارات العلماء من generate-seo فقط`,
);
