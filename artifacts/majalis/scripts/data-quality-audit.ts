/**
 * فحص جودة بيانات المنصة كاملة — تقرير + بوابة CI.
 * يفحص المصادر الحيّة (TypeScript) لا المرايا فقط:
 *   الكتب، العلماء، المشايخ، الدروس — بحثًا عن:
 *   تكرار (id / عنوان+مؤلف / اسم مُطبّع)، slugs متضاربة أو لا تطابق الاسم،
 *   سجلات بلا وصف/مؤلف/مصدر، عناوين/أوصاف ميتا مكررة، مسارات علماء بلا ملف.
 *
 * الاستخدام:
 *   npx tsx scripts/data-quality-audit.ts            # تقرير
 *   npx tsx scripts/data-quality-audit.ts --ci       # يفشل عند وجود خطأ حرج
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { SCHOLARS } from "../src/lib/scholars-data";
import { LIBRARY_CATALOG } from "../src/lib/library-catalog";
import { SHEIKHS_SEED } from "../src/lib/sheikhs-seed";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const CI = process.argv.includes("--ci");

function normAr(a: string): string {
  return String(a || "")
    .replace(/[ً-ْ]/g, "")
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[«»"'.،,\-—:()]/g, "")
    .replace(/(الإمام|الشيخ|الحافظ|الدكتور|العلامة)\s*/g, "")
    .replace(/^ال/, "")
    .replace(/\s+/g, "")
    .trim();
}
function dupsBy<T>(items: T[], keyFn: (x: T) => string): Map<string, T[]> {
  const g = new Map<string, T[]>();
  for (const it of items) {
    const k = keyFn(it);
    if (!k) continue;
    (g.get(k) ?? g.set(k, []).get(k)!).push(it);
  }
  return new Map([...g.entries()].filter(([, v]) => v.length > 1));
}

type Issue = { critical: boolean; area: string; msg: string };
const issues: Issue[] = [];
const add = (critical: boolean, area: string, msg: string) => issues.push({ critical, area, msg });

// ── الكتب ────────────────────────────────────────────────────────────────
{
  const ids = LIBRARY_CATALOG.map((b) => b.id);
  for (const [id, v] of dupsBy(LIBRARY_CATALOG, (b) => b.id)) add(true, "كتب", `id مكرر «${id}» ×${v.length}`);
  for (const [k, v] of dupsBy(LIBRARY_CATALOG, (b) => `${normAr(b.title)}::${normAr(b.author)}`))
    add(true, "كتب", `كتاب مكرر (عنوان+مؤلف): ${v.map((b) => b.id).join(", ")}`);
  for (const b of LIBRARY_CATALOG) {
    if (!b.description || b.description.trim().length < 15) add(true, "كتب", `«${b.id}» بلا وصف كافٍ`);
    if (!b.author || !b.author.trim()) add(true, "كتب", `«${b.id}» بلا مؤلف`);
    if (!/^book-[a-z0-9-]+$/.test(b.id)) add(false, "كتب", `slug غير قياسي «${b.id}»`);
    if (/-copy|-old|-new|-alt|-\d+$/.test(b.id)) add(false, "كتب", `slug يحمل لاحقة مؤقتة «${b.id}»`);
  }
  void ids;
}

// ── العلماء ──────────────────────────────────────────────────────────────
{
  for (const [id, v] of dupsBy(SCHOLARS, (s) => s.id)) add(true, "علماء", `id مكرر «${id}» ×${v.length}`);
  for (const [k, v] of dupsBy(SCHOLARS, (s) => normAr(s.name)))
    add(true, "علماء", `عالِم مكرر بالاسم: ${v.map((s) => s.id).join(", ")}`);
  const FORBIDDEN = /(^|-)(alt|old|older|copy|new|tmp|temp)(-|$)|-\d+$/;
  for (const s of SCHOLARS) {
    if (!s.bio || s.bio.trim().length < 20) add(true, "علماء", `«${s.id}» بلا سيرة كافية`);
    if (!s.died || !s.died.trim()) add(true, "علماء", `«${s.id}» بلا تاريخ وفاة`);
    if (!s.key_works || s.key_works.length === 0) add(false, "علماء", `«${s.id}» بلا مؤلفات`);
    if (FORBIDDEN.test(s.id)) add(true, "علماء", `slug مؤقت/خاطئ «${s.id}» (${s.name})`);
    if (!/^[a-z0-9-]+$/.test(s.id)) add(true, "علماء", `slug يحوي محارف غير صالحة «${s.id}» (فراغ/فاصلة/رمز)`);
  }
}

// ── المشايخ ──────────────────────────────────────────────────────────────
{
  for (const [id, v] of dupsBy(SHEIKHS_SEED, (s) => s.id)) add(true, "مشايخ", `id مكرر «${id}» ×${v.length}`);
  for (const [k, v] of dupsBy(SHEIKHS_SEED, (s) => normAr(s.name)))
    add(true, "مشايخ", `مشيخة مكررة بالاسم: ${v.map((s) => s.id).join(", ")}`);
}

// ── مسارات SEO: ميتا مكررة + مسارات علماء بلا ملف ────────────────────────
{
  const routes = JSON.parse(readFileSync(resolve(appRoot, "src/lib/seo-routes.json"), "utf8")).routes;
  const scholarIds = new Set(SCHOLARS.map((s) => s.id));
  for (const r of routes) {
    const m = r.path.match(/^\/scholars\/([^/]+)$/);
    if (m && !scholarIds.has(m[1])) add(true, "فهرسة", `مسار عالِم بلا ملف بيانات «${r.path}»`);
  }
  for (const [t, v] of dupsBy(routes.filter((r: any) => r.sitemap !== false), (r: any) => r.title))
    add(false, "فهرسة", `عنوان ميتا مكرر «${t}» ×${(v as any[]).length}`);
  for (const [d, v] of dupsBy(
    routes.filter((r: any) => r.sitemap !== false && r.description),
    (r: any) => r.description,
  ))
    add(false, "فهرسة", `وصف ميتا مكرر ×${(v as any[]).length}: «${String(d).slice(0, 40)}…»`);
}

// ── التقرير ──────────────────────────────────────────────────────────────
const critical = issues.filter((i) => i.critical);
const warnings = issues.filter((i) => !i.critical);
const byArea = (list: Issue[]) => {
  const g: Record<string, number> = {};
  for (const i of list) g[i.area] = (g[i.area] || 0) + 1;
  return g;
};

console.log("\n════════ تقرير جودة البيانات ════════");
console.log(`الكتب: ${LIBRARY_CATALOG.length} | العلماء: ${SCHOLARS.length} | المشايخ: ${SHEIKHS_SEED.length}`);
console.log(`\nأخطاء حرجة: ${critical.length}`, byArea(critical));
console.log(`تحذيرات: ${warnings.length}`, byArea(warnings));
if (critical.length) {
  console.log("\n— الأخطاء الحرجة —");
  for (const i of critical) console.log(`  ✗ [${i.area}] ${i.msg}`);
}
if (warnings.length) {
  console.log("\n— التحذيرات —");
  for (const i of warnings.slice(0, 40)) console.log(`  ⚠ [${i.area}] ${i.msg}`);
  if (warnings.length > 40) console.log(`  … و${warnings.length - 40} تحذيرًا آخر`);
}
console.log("\n═══════════════════════════════════════");
if (CI && critical.length > 0) {
  console.error(`\n✗ فشل CI: ${critical.length} خطأ حرج في جودة البيانات`);
  process.exit(1);
}
console.log(critical.length === 0 ? "✓ لا أخطاء حرجة" : `✗ ${critical.length} خطأ حرج`);
