#!/usr/bin/env node
/**
 * بوابة تدقيق محتوى الموقع — فهرس المسارات + فحوصات جودة البيانات.
 * تشغيل: pnpm run audit:content  (أو tsx scripts/audit-site-content.ts)
 *
 * يفشل عند:
 * - بريد قديم / مدح مطلق ممنوع / تقييمات وهمية في بيانات الأذان
 * - كتب/علماء حساسون بلا caution
 * - TopicPage بلا noindex عند الفراغ أو مسار /topic/ الخاطئ
 * - أحكام بلا verification_status/status
 * - عبارات حشو قصص الأنبياء
 * - (إن وُجد dist) صفحات prerender تبدو Home fallback
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const errors: string[] = [];
const warnings: string[] = [];
const fail = (m: string) => errors.push(m);
const warn = (m: string) => warnings.push(m);

function walk(dir: string, pred: (name: string, p: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === "dist" || name === ".backup") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(name, p)) out.push(p);
  }
  return out;
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

// ── 1) فهرس المسارات من App.tsx ──────────────────────────────────────────
const appSrc = read("src/App.tsx");
const routePaths = [...appSrc.matchAll(/path=["'`]([^"'`]+)["'`]/g)].map((m) => m[1]!);
if (routePaths.length < 80) fail(`عدد المسارات المستخرجة من App.tsx قليل: ${routePaths.length}`);
const has = (p: string) => routePaths.some((r) => r === p || r.startsWith(p));
for (const need of ["/mushaf", "/rulings/:id", "/topics/:slug", "/fiqh-council", "/scholars", "/hadith", "/adhkar"]) {
  if (!routePaths.some((r) => r.includes(need.replace(/:.*/, "")) || r === need)) {
    warn(`مسار متوقع غير ظاهر صراحة: ${need}`);
  }
}

// ── 2) بريد ──────────────────────────────────────────────────────────────
const SKIP_EMAIL = /audit-site-content|audit-site-data|audit-content-quality|audit-contact-email|audit-rendered-content|strip-lesson-filler|content-dedupe-roles|site-data-final-audit|rendered-content-audit/;
const FORBIDDEN_EMAIL = [/info@majlisilm\.com/i, /yalabdullmohsen1@gmail\.com/i];
for (const file of walk(root, (n) => /\.(tsx?|jsx?|mjs|json|html|md|css|sql)$/i.test(n))) {
  if (SKIP_EMAIL.test(file)) continue;
  if (file.includes(`${path.sep}reports${path.sep}`)) continue;
  const text = fs.readFileSync(file, "utf8");
  for (const re of FORBIDDEN_EMAIL) {
    if (re.test(text)) fail(`بريد قديم في ${path.relative(root, file)}`);
  }
}
if (!/Majlisilm\.app@gmail\.com/i.test(read("site.config.json"))) {
  fail("site.config.json يجب أن يستخدم Majlisilm.app@gmail.com");
}

// ── 3) عبارات ممنوعة + مدح مطلق في بيانات حيّة ───────────────────────────
const FORBIDDEN_PHRASES = [
  "فيلسوف الإسلام الأكبر",
  "الأزهر الشريف",
  "مآذن الأزهر",
  "تُربط سيرته بمقاصد القرآن",
  "ويُستفاد من قصته في بناء الإيمان والأخلاق",
  "أعظم شروح صحيح البخاري وأكملها",
  "من أعظم علماء الإسلام؛",
];
const contentScan = walk(path.join(root, "src"), (n, p) => {
  if (!/\.(ts|tsx|json)$/.test(n)) return false;
  if (p.includes("__tests__")) return false;
  return true;
});
for (const file of contentScan) {
  const text = fs.readFileSync(file, "utf8");
  const rel = path.relative(root, file);
  for (const phrase of FORBIDDEN_PHRASES) {
    if (text.includes(phrase)) fail(`${rel}: عبارة ممنوعة: ${phrase}`);
  }
}

// ── 4) تقييمات وهمية في الأذان ───────────────────────────────────────────
const adhan = read("src/lib/adhan-audio.ts");
if (/totalRatings\s*:/.test(adhan) || /followers\s*:/.test(adhan)) {
  fail("adhan-audio.ts: أزل rating/totalRatings/followers غير الموثّقة");
}
if (/295\s*000|ألف تقييم|من أصل\s*5/.test(adhan)) {
  fail("adhan-audio.ts: أرقام تقييمات وهمية");
}

// ── 5) TopicPage ─────────────────────────────────────────────────────────
const topicPage = read("src/views/TopicPage.tsx");
if (!/noindex/.test(topicPage)) fail("TopicPage: يلزم noindex عند الفراغ");
if (/\/topic\/\$\{/.test(topicPage) && !/\/topics\/\$\{/.test(topicPage)) {
  fail("TopicPage: استخدم /topics/ وليس /topic/");
}
if (/الموضوع غير موجود/.test(topicPage)) {
  fail('TopicPage: لا تستخدم عبارة "الموضوع غير موجود" المفهرسة دون noindex');
}

// ── 6) Home fallback guards ──────────────────────────────────────────────
const rulingDetail = read("src/pages/fiqh/ui/RulingDetailView.tsx");
if (!/NotFound/.test(rulingDetail)) fail("RulingDetailView: يلزم NotFound عند غياب الحكم");
if (!/قيد المراجعة العلمية/.test(rulingDetail)) {
  fail("RulingDetailView: يلزم تنبيه قيد المراجعة العلمية");
}
const fiqhIssue = read("src/views/FiqhCouncilIssueDetailPage.tsx");
if (!/noindex/.test(fiqhIssue)) fail("FiqhCouncilIssueDetailPage: يلزم noindex عند الغياب");
if (!/Empty|NotFound/.test(fiqhIssue)) fail("FiqhCouncilIssueDetailPage: يلزم Empty/NotFound لا Home");

// ── 7) مكتبة + علماء حساسون ──────────────────────────────────────────────
const { LIBRARY_CATALOG } = await import(pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href);
const NEED_CAUTION = [/إحياء علوم الدين/, /مفاتيح الغيب/, /الشفا بتعريف/, /السيرة الحلبية|إنسان العيون/];
for (const book of LIBRARY_CATALOG as Array<{ id: string; title: string; caution?: string; contentStatus?: string }>) {
  if (!book.title?.trim()) fail(`كتاب بلا عنوان: ${book.id}`);
  if (NEED_CAUTION.some((re) => re.test(book.title))) {
    if (!book.caution || !book.contentStatus) fail(`مكتبة: «${book.title}» يحتاج contentStatus + caution`);
  }
}

const { SCHOLARS, SCHOLAR_CAUTION_NOTE } = await import(
  pathToFileURL(path.join(root, "src/lib/scholars-data.ts")).href
);
const SENSITIVE = ["ghazali", "ibn-rushd", "fakhr-razi", "qadi-iyad"];
for (const id of SENSITIVE) {
  const s = (SCHOLARS as Array<{ id: string; caution?: string; contentStatus?: string }>).find((x) => x.id === id);
  if (!s) {
    fail(`عالم حساس مفقود: ${id}`);
    continue;
  }
  if (!s.caution || !s.contentStatus) fail(`عالم ${id}: يلزم contentStatus + caution`);
}
if (!SCHOLAR_CAUTION_NOTE || !/يُستفاد منه في بابه/.test(String(SCHOLAR_CAUTION_NOTE))) {
  fail("SCHOLAR_CAUTION_NOTE مفقود أو ضعيف");
}

// ── 8) أحكام: وجود حالة مراجعة ───────────────────────────────────────────
const rulingsSeed = read("src/lib/rulings-encyclopedia-seed.generated.ts");
if (!/verification_status/.test(rulingsSeed)) fail("rulings seed بلا verification_status");
if (!/pending_review/.test(rulingsSeed)) warn("rulings seed: لا يظهر pending_review (تحقق يدويًا)");

// ── 9) حديث: تحذيرات الواجهة ─────────────────────────────────────────────
const hadithView = read("src/pages/hadith/ui/HadithView.tsx");
if (!/لا يُحتج بالحديث الضعيف/.test(hadithView)) fail("HadithView: يلزم تحذير عن الضعيف");
if (!/لا يُنسب الموضوع/.test(hadithView) && !/بيان وضعه/.test(hadithView)) {
  fail("HadithView: يلزم تحذير عن الموضوع");
}

// ── 10) الأنبياء: بلا حشو آلي ────────────────────────────────────────────
const { PROPHETS } = await import(pathToFileURL(path.join(root, "src/lib/prophets-data.ts")).href);
if ((PROPHETS as unknown[]).length !== 25) fail(`عدد الأنبياء ${(PROPHETS as unknown[]).length} ≠ 25`);

// ── 11) dist prerender Home-fallback (اختياري) ───────────────────────────
const dist = path.join(root, "dist");
let prerenderChecked = 0;
if (fs.existsSync(path.join(dist, "index.html"))) {
  const homeHtml = fs.readFileSync(path.join(dist, "index.html"), "utf8");
  const homeTitle = homeHtml.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
  const sampleDirs = ["rulings", "topics", "fiqh-council", "scholars", "prophets", "library"];
  for (const dir of sampleDirs) {
    const abs = path.join(dist, dir);
    if (!fs.existsSync(abs)) continue;
    const stack = [abs];
    while (stack.length) {
      const cur = stack.pop()!;
      for (const name of fs.readdirSync(cur)) {
        const p = path.join(cur, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) stack.push(p);
        else if (name === "index.html") {
          prerenderChecked++;
          const html = fs.readFileSync(p, "utf8");
          const title = html.match(/<title>([^<]*)<\/title>/i)?.[1] ?? "";
          const robots = html.match(/name=["']robots["'][^>]*content=["']([^"']+)/i)?.[1] ?? "";
          const looksHome =
            title === homeTitle &&
            html.includes('og:url" content="https://majlisilm.com/"') === false &&
            /المجالس العلمية|منصّة المجلس/.test(html.slice(0, 2500)) &&
            title.length > 0 &&
            !/غير موجود|غير متاح|404|قيد المراجعة|موسوعة|تفسير|عالم/.test(title);
          // إشارة أقوى: عنوان الصفحة = عنوان الرئيسية تمامًا مع مسار فرعي
          if (title === homeTitle && !robots.includes("noindex")) {
            const rel = path.relative(dist, p);
            if (!rel.startsWith("index.html")) {
              fail(`Home fallback محتمل في prerender: ${rel} (title مطابق للرئيسية بلا noindex)`);
            }
          }
          void looksHome;
        }
      }
    }
  }
} else {
  warn("dist غير موجود — تُخطّى فحوصات prerender (شغّل build ثم أعد التدقيق)");
}

if (warnings.length) console.log(`تحذيرات (${warnings.length}):\n- ${warnings.join("\n- ")}\n`);
console.log(
  JSON.stringify(
    {
      routesExtracted: routePaths.length,
      prerenderChecked,
      errors: errors.length,
      warnings: warnings.length,
    },
    null,
    2,
  ),
);

if (errors.length) {
  console.error(`audit:site-content FAILED (${errors.length})\n- ${errors.join("\n- ")}`);
  process.exit(1);
}
console.log("audit:site-content OK");
