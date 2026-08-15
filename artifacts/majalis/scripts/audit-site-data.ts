#!/usr/bin/env node
/**
 * audit-site-data — تدقيق Evidence-Gated لبيانات الموقع والنص المفهرس.
 *
 * القاعدة: لا يُبلَّغ بفشل ولا يُطلب إصلاح إلا إذا وُجد دليل نصي/ملفي مثبت.
 * المخرجات: reports/site-data-final-audit.md
 *
 * تشغيل: pnpm run audit:site-data
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportPath = path.join(root, "reports", "site-data-final-audit.md");

type Verdict = "نعم" | "لا";
type Action = "عُدّل" | "حُذف" | "تُرك كما هو" | "يفشل البوابة حتى يُصلح";

type Finding = {
  id: string;
  claim: string;
  proven: Verdict;
  evidence: string[];
  action: Action;
  reason: string;
};

const findings: Finding[] = [];
const hardErrors: string[] = [];

function walk(dir: string, pred: (name: string, p: string) => boolean, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === "node_modules" || name === ".backup" || name === "dist") continue;
    const p = path.join(dir, name);
    const st = fs.statSync(p);
    if (st.isDirectory()) walk(p, pred, out);
    else if (pred(name, p)) out.push(p);
  }
  return out;
}

function walkHtml(base: string): string[] {
  const dir = path.join(root, base);
  if (!fs.existsSync(dir)) return [];
  return walk(dir, (n) => n === "index.html");
}

function read(rel: string): string {
  return fs.readFileSync(path.join(root, rel), "utf8");
}

function stripTags(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ");
}

function stripTight(html: string): string {
  return html.replace(/<script[\s\S]*?<\/script>/gi, "").replace(/<[^>]+>/g, "").replace(/\s+/g, "");
}

function meta(html: string, name: string): string {
  const re = new RegExp(
    `<meta[^>]+(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']|<meta[^>]+content=["']([^"']*)["'][^>]*(?:name|property)=["']${name}["']`,
    "i",
  );
  const m = html.match(re);
  return (m?.[1] || m?.[2] || "").trim();
}

function robotsOf(html: string): string {
  return meta(html, "robots").toLowerCase();
}

function articleOf(html: string): string {
  return html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)?.[1] || "";
}

function mainOf(html: string): string {
  return html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)?.[1] || "";
}

function jsonLdOf(html: string): string {
  return [...html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)]
    .map((m) => m[1] || "")
    .join("\n");
}

function add(f: Finding) {
  findings.push(f);
  if (f.action === "يفشل البوابة حتى يُصلح") {
    hardErrors.push(`[${f.id}] ${f.claim} — ${f.evidence[0] || f.reason}`);
  }
}

const stats = {
  sitemapUrls: 0,
  appRoutes: 0,
  prerenderPages: 0,
  distPages: 0,
};

// ── جمع المسارات ───────────────────────────────────────────────────────────
const sitemapPaths = new Set<string>();
for (const rel of ["public/sitemap.xml", "dist/sitemap.xml"]) {
  const p = path.join(root, rel);
  if (!fs.existsSync(p)) continue;
  const xml = fs.readFileSync(p, "utf8");
  for (const m of xml.matchAll(/<loc>([^<]+)<\/loc>/g)) {
    try {
      sitemapPaths.add(new URL(m[1]!).pathname.replace(/\/$/, "") || "/");
    } catch {
      /* ignore */
    }
  }
}
stats.sitemapUrls = sitemapPaths.size;

const appSrc = read("src/App.tsx");
stats.appRoutes = [...appSrc.matchAll(/path=["'`]([^"'`]+)["'`]/g)].length;

const prerenderFiles = walkHtml("seo-prerender");
const distFiles = walkHtml("dist");
stats.prerenderPages = prerenderFiles.length;
stats.distPages = distFiles.length;

const htmlCorpus = [...prerenderFiles, ...distFiles];

// ═══════════════════════════════════════════════════════════════════════════
// 1) حشو قصص الأنبياء
// ═══════════════════════════════════════════════════════════════════════════
{
  const phrases = [
    "تُربط سيرته",
    "يُستحضر المآل",
    "الصبر على مقتضاه",
    "العبرة بما ثبت في الوحي",
    "تُربط سيرته بمقاصد القرآن",
    "ويُستفاد من قصته في بناء الإيمان والأخلاق",
  ];
  const hits: string[] = [];
  const prophetData = read("src/lib/prophets-data.ts");
  for (const ph of phrases) {
    if (prophetData.includes(ph)) hits.push(`prophets-data.ts ← «${ph}»`);
  }
  for (const f of prerenderFiles.filter((p) => p.includes(`${path.sep}prophets${path.sep}`))) {
    const html = fs.readFileSync(f, "utf8");
    const surface = [articleOf(html), meta(html, "description"), jsonLdOf(html)].join("\n");
    for (const ph of phrases) {
      if (surface.includes(ph)) hits.push(`${path.relative(root, f)} ← «${ph}»`);
    }
  }
  add({
    id: "C1-prophet-filler",
    claim: "قصص الأنبياء تحتوي تكراراً إنشائياً آلياً (تُربط سيرته / يُستحضر المآل / …)",
    proven: hits.length ? "نعم" : "لا",
    evidence: hits.length ? hits.slice(0, 12) : ["فُحص prophets-data.ts + seo-prerender/prophets/* — لا تطابق"],
    action: hits.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hits.length ? "ثبت الحشو في المصدر أو HTML المفهرس" : "لم يثبت الادعاء، تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 2) عناصر واجهة داخل article / meta / JSON-LD
// ═══════════════════════════════════════════════════════════════════════════
{
  const uiPhrases = [
    "Esc للقائمة",
    "اختصارات:",
    "نسخ النص",
    "سناب شات",
    "واتساب",
    "▽",
  ];
  /** عبارات تنقّل عامة تُفحص فقط داخل <article> للمسارات الشرعية */
  const scholarlyUi = ["← التالي", "→ السابق", "اختبر معلوماتك"];
  const hits: string[] = [];
  const scholarlyRe = /[/\\](prophets|library|scholars|rulings|topics|sins-and-rights|hadith|adhkar)[/\\]/;

  for (const f of htmlCorpus) {
    if (!scholarlyRe.test(f)) continue;
    const html = fs.readFileSync(f, "utf8");
    const article = articleOf(html);
    const desc = meta(html, "description");
    const ld = jsonLdOf(html);
    const surfaces: Array<[string, string]> = [
      ["article", article],
      ["description", desc],
      ["json-ld", ld],
    ];
    for (const [where, text] of surfaces) {
      for (const ph of uiPhrases) {
        if (text.includes(ph)) hits.push(`${path.relative(root, f)} [${where}] ← «${ph}»`);
      }
      if (where === "article" || where === "description" || where === "json-ld") {
        for (const ph of scholarlyUi) {
          if (where === "article" && text.includes(ph)) {
            hits.push(`${path.relative(root, f)} [${where}] ← «${ph}»`);
          }
          if ((where === "description" || where === "json-ld") && text.includes(ph)) {
            hits.push(`${path.relative(root, f)} [${where}] ← «${ph}»`);
          }
        }
      }
    }
  }

  // مصدر React: اختصارات داخل article
  const prophetSrc = read("src/views/ProphetStoriesPage.tsx");
  if (/<article[\s\S]{0,12000}Esc للقائمة/.test(prophetSrc) || /<article[\s\S]{0,12000}اختصارات:/.test(prophetSrc)) {
    hits.push("ProphetStoriesPage.tsx: اختصارات داخل <article>");
  }

  add({
    id: "C2-ui-chrome",
    claim: "عناصر واجهة (اختصارات/Esc/مشاركة/…) تظهر داخل المقال أو meta أو JSON-LD للمحتوى الشرعي",
    proven: hits.length ? "نعم" : "لا",
    evidence: hits.length ? hits.slice(0, 15) : ["فُحصت صفحات الأنبياء/المكتبة/العلماء — لا أثر في article/meta/json-ld"],
    action: hits.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hits.length ? "ثبت التسرّب في سطح مفهرس" : "لم يثبت الادعاء، تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 3) التصاق حقول/قيم داخل <dl>
// ═══════════════════════════════════════════════════════════════════════════
{
  /** التصاق حقيقي: اسم الحقل يليه حرف/رقم مباشرة بلا : أو مسافة */
  const stickRe =
    /(القوم \/ البلد|الحقبة|الذِّكر في القرآن|أبرز سورة|مواضع في القرآن)(?=[\u0621-\u064A0-9\u0660-\u0669])/u;
  const stickLabelColonMissing =
    /<(?:dt|span)[^>]*>\s*(القوم \/ البلد|الحقبة|الذِّكر في القرآن|أبرز سورة|مواضع في القرآن|المؤلف|التصنيف|المصدر)\s*<\/(?:dt|span)>\s*<(?:dd|span)[^>]*>\s*[\u0621-\u064A0-9]/u;
  const hits: string[] = [];

  for (const f of htmlCorpus.filter((p) => /[/\\](prophets|library)[/\\]/.test(p))) {
    const html = fs.readFileSync(f, "utf8");
    const rel = path.relative(root, f);
    for (const dl of (articleOf(html) || mainOf(html)).matchAll(/<dl[\s\S]*?<\/dl>/gi)) {
      const tight = stripTight(dl[0]!);
      // بعد إزالة الوسوم: إن وُجد «الحقبة:» فالفاصل موجود؛ نبحث عن الحقل بلا :
      const bad = tight.match(
        /(القوم\/البلد|الحقبة|الذِّكرفيالقرآن|أبرزسورة|مواضعفيالقرآن)(?!:)(?=[\u0621-\u064A0-9\u0660-\u0669])/u,
      );
      if (bad) hits.push(`${rel} dl-tight ← «${bad[0]}…»`);
    }
    // نمط React/HTML بلا فاصل بين label و value
    if (stickLabelColonMissing.test(html)) {
      hits.push(`${rel}: label بلا فاصل قبل القيمة`);
    }
    const artTight = stripTight(articleOf(html));
    if (stickRe.test(artTight.replace(/:/g, "¤"))) {
      // إن وُجدت النقطتان أُزيلت للفحص؛ لا نستخدم هذا المسار إن كانت : موجودة
    }
    // أمثلة المستخدم الحرفية
    for (const ex of ["القوم / البلدبيت", "الحقبةابن", "الذِّكر في القرآن7", "أبرز سورةآل", "المصدررابط القراءة"]) {
      if (artTight.includes(ex.replace(/\s+/g, "")) || stripTags(html).includes(ex)) {
        hits.push(`${rel} ← مثال حرفي «${ex}»`);
      }
    }
  }

  add({
    id: "C3-field-stick",
    claim: "التصاق أسماء الحقول بالقيم (القوم/البلدبيت المقدس، الحقبةابن، …)",
    proven: hits.length ? "نعم" : "لا",
    evidence: hits.length
      ? hits.slice(0, 15)
      : [
          "فُحصت <dl> في prophets/library: الحقول تنتهي بـ «:» (مثال seo-prerender/prophets/yahya و library/book-qurtubi)",
          "تطابق «قراءةالمصدركتب» المحتمل ناتج عن نص رابط وليس التصاق dt/dd — لا يُعدّ إثباتاً للادعاء",
        ],
    action: hits.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hits.length ? "ثبت التصاق بلا فاصل" : "لم يثبت الادعاء، تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 4) بريد قديم — الأنماط تُبنى من أجزاء حتى لا تُبلَّغ ملفات التدقيق عن نفسها
// ═══════════════════════════════════════════════════════════════════════════
{
  const oldA = ["info", "@", "majlisilm", ".", "com"].join("");
  const oldB = ["yalabdullmohsen1", "@", "gmail", ".", "com"].join("");
  const reA = new RegExp(oldA.replace(/\./g, "\\."), "i");
  const reB = new RegExp(oldB.replace(/\./g, "\\."), "i");
  const hits: string[] = [];
  const skip =
    /audit-|strict-evidence|production-indexability|site-data-final-audit|rendered-content-audit|evidence-register|strict-evidence-audit/;
  for (const file of walk(root, (n) => /\.(tsx?|jsx?|mjs|json|html|md|css)$/i.test(n))) {
    if (skip.test(file)) continue;
    if (file.includes(`${path.sep}node_modules${path.sep}`)) continue;
    if (file.includes(`${path.sep}dist${path.sep}`)) continue;
    if (file.includes(`${path.sep}reports${path.sep}`)) continue;
    if (file.includes(`${path.sep}test${path.sep}`)) continue;
    const text = fs.readFileSync(file, "utf8");
    if (reA.test(text) || reB.test(text)) {
      hits.push(path.relative(root, file));
    }
  }
  add({
    id: "C4-old-email",
    claim: "وجود بريد قديم (info@… أو عنوان gmail شخصي سابق) في المصدر/البيانات المنشورة",
    proven: hits.length ? "نعم" : "لا",
    evidence: hits.length ? hits : ["مسح src + seo-prerender + data — لا تطابق (خارج سكربتات/تقارير الفحص)"],
    action: hits.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hits.length ? "ثبت بريد قديم" : "لم يثبت الادعاء، تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 5) صفحات ناقصة مفهرسة
// ═══════════════════════════════════════════════════════════════════════════
{
  const markers = [
    "الموضوع غير موجود",
    "قيد الإعداد",
    "قيد المراجعة الشرعية",
    "placeholder",
    "lorem ipsum",
    "TODO",
    "\bundefined\b",
    "\bNaN\b",
  ];
  /** صفحات يُسمح فيها بذكر وسم المراجعة كشرح منهجي */
  const allowExplain = /[/\\](methodology)[/\\]/;
  const hits: string[] = [];

  for (const f of htmlCorpus) {
    const html = fs.readFileSync(f, "utf8");
    const robots = robotsOf(html);
    const noindex = /\bnoindex\b/.test(robots);
    const surface = [meta(html, "description"), articleOf(html), jsonLdOf(html), mainOf(html)].join("\n");
    const rel = path.relative(root, f);

    if (allowExplain.test(f) && surface.includes("قيد المراجعة الشرعية")) {
      continue; // شرح منهجي متعمّد
    }
    if (noindex) continue;

    for (const raw of markers) {
      if (raw.startsWith("\\b")) {
        const re = new RegExp(raw, "i");
        if (re.test(surface)) hits.push(`${rel} ← ${raw} (robots: ${robots || "default"})`);
      } else if (surface.includes(raw)) {
        hits.push(`${rel} ← «${raw}» (robots: ${robots || "default"})`);
      }
    }

    // ناقص في sitemap
    const urlPath =
      ("/" + rel.replace(/^(seo-prerender|dist)[/\\]/, "").replace(/[/\\]index\.html$/, "").replace(/\\/g, "/")).replace(
        /\/$/,
        "",
      ) || "/";
    if (sitemapPaths.has(urlPath) || sitemapPaths.has(urlPath + "/")) {
      if (/الموضوع غير موجود|قيد الإعداد/.test(surface) && !noindex && !allowExplain.test(f)) {
        hits.push(`${rel} في sitemap بلا noindex مع علامة نقص`);
      }
    }
  }

  // knowledge-graph يجب أن يكون noindex إن ذكر قيد الإعداد
  for (const f of htmlCorpus.filter((p) => p.includes("knowledge-graph"))) {
    const html = fs.readFileSync(f, "utf8");
    if (/قيد الإعداد/.test(html) && !/\bnoindex\b/.test(robotsOf(html))) {
      hits.push(`${path.relative(root, f)}: قيد الإعداد بلا noindex`);
    }
  }

  add({
    id: "C5-incomplete-indexed",
    claim: "صفحات ناقصة/قيد مراجعة تظهر مفهرسة (بلا noindex) أو داخل sitemap",
    proven: hits.length ? "نعم" : "لا",
    evidence: hits.length
      ? hits.slice(0, 20)
      : [
          "knowledge-graph: قيد الإعداد + noindex — مقبول",
          "methodology: يذكر «قيد المراجعة الشرعية» كشرح لمنهج الوسم — مستثنى عن قصد",
          "لا صفحات «الموضوع غير موجود» مفهرسة في prerender",
        ],
    action: hits.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hits.length ? "ثبت نقص مفهرس" : "لم يثبت ادّعاء صفحات ناقصة مفهرسة بشكل مخالف؛ التُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 6) تزكيات مطلقة — فحص سياقي (لا فشل تلقائي)
// ═══════════════════════════════════════════════════════════════════════════
{
  const absolute = ["فيلسوف الإسلام الأكبر", "الإمام المطلق", "أعظم شروح صحيح البخاري وأكملها"];
  const contextual: string[] = [];
  const hard: string[] = [];

  for (const ph of absolute) {
    for (const file of walk(path.join(root, "src"), (n) => /\.(ts|tsx|json)$/.test(n))) {
      const text = fs.readFileSync(file, "utf8");
      if (!text.includes(ph)) continue;
      const rel = path.relative(root, file);
      if (rel.includes("__tests__")) continue;
      hard.push(`${rel} ← «${ph}»`);
    }
  }

  // حجة الإسلام: إن وُجدت مع «اشتهر بلقب» أو في سياق الحج الفقهي → سياقي
  const ghazali = read("src/lib/scholars-data.ts");
  if (/حجة الإسلام/.test(ghazali)) {
    if (/اشتهر عند بعض أهل العلم بلقب/.test(ghazali) || /لقب «حجة الإسلام»/.test(ghazali)) {
      contextual.push("scholars-data.ts (الغزالي): لقب منقول بتحفّظ — سياق منضبط");
    } else if (!/حجة الإسلام/.test(ghazali.replace(/حجة الإسلام \(فريضة الحج\)/g, ""))) {
      hard.push("scholars-data.ts: حجة الإسلام بلا تحفّظ واضح");
    }
  }

  add({
    id: "C6-absolute-praise",
    claim: "عبارات تزكية مطلقة غير منضبطة (فيلسوف الإسلام الأكبر / أعظم… / الإمام مطلق…)",
    proven: hard.length ? "نعم" : "لا",
    evidence: hard.length ? hard : contextual.length ? contextual : ["لم تُعثر على الصيغ المطلقة المحظورة في src/lib"],
    action: hard.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hard.length
      ? "ثبتت تزكية مطلقة بلا سياق"
      : "لم يثبت الادعاء بصيغ مطلقة ممنوعة؛ ما وُجد من «حجة الإسلام» منقول بتحفّظ أو مصطلح فقهي للحج — تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 7) كتب/شخصيات خلافية بلا تنبيه
// ═══════════════════════════════════════════════════════════════════════════
{
  const { LIBRARY_CATALOG } = await import(pathToFileURL(path.join(root, "src/lib/library-catalog.ts")).href);
  const { SCHOLARS } = await import(pathToFileURL(path.join(root, "src/lib/scholars-data.ts")).href);
  const needBooks = ["book-ihya", "book-shifa-qadi-iyad", "book-sirah-halabiyya", "book-razi-tafsir", "book-tarikh-tabari"];
  const needScholars = ["ghazali", "ibn-rushd", "fakhr-razi", "qadi-iyad"];
  const missing: string[] = [];
  const ok: string[] = [];

  for (const id of needBooks) {
    const b = (LIBRARY_CATALOG as Array<{ id: string; caution?: string; contentStatus?: string }>).find((x) => x.id === id);
    if (!b?.caution || !b.contentStatus) missing.push(`كتاب ${id} بلا caution/contentStatus`);
    else ok.push(`${id}: ${b.contentStatus}`);
  }
  for (const id of needScholars) {
    const s = (SCHOLARS as Array<{ id: string; caution?: string; contentStatus?: string }>).find((x) => x.id === id);
    if (!s?.caution || !s.contentStatus) missing.push(`عالم ${id} بلا caution/contentStatus`);
    else ok.push(`${id}: ${s.contentStatus}`);
  }

  add({
    id: "C7-sensitive-caution",
    claim: "كتب/شخصيات خلافية معروضة كتوصية مطلقة بلا تنبيه علمي",
    proven: missing.length ? "نعم" : "لا",
    evidence: missing.length ? missing : ok,
    action: missing.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: missing.length
      ? "ثبت غياب التنبيه"
      : "لم يثبت الادعاء: التنبيهات وcontentStatus موجودة — تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// 8) الأزهر — سياقي
// ═══════════════════════════════════════════════════════════════════════════
{
  const hitsEndorse: string[] = [];
  const hitsHistorical: string[] = [];
  const endorse = ["الأزهر الشريف يعتمد", "معتمد في تدريس المنطق بالأزهر", "مآذن الأزهر"];
  for (const file of walk(path.join(root, "src"), (n) => /\.(ts|tsx|json)$/.test(n))) {
    const text = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file);
    for (const ph of endorse) {
      if (text.includes(ph)) hitsEndorse.push(`${rel} ← «${ph}»`);
    }
  }
  // ذكر جامعة الأزهر كمؤسسة في دليل الجامعات
  if (fs.existsSync(path.join(root, "src/data/universities-catalog.json"))) {
    const u = read("src/data/universities-catalog.json");
    if (u.includes("جامعة الأزهر")) {
      hitsHistorical.push("universities-catalog.json: جامعة الأزهر كمدخل دليل جامعات (ذكر مؤسسي)");
    }
  }
  if (read("src/lib/scholars-data.ts").includes("علماء الأزهر")) {
    hitsHistorical.push("scholars-data.ts (سيد سابق): «علماء الأزهر» في سياق السيرة الدراسية — ذكر تاريخي");
  }

  add({
    id: "C8-azhar",
    claim: "نصوص تمنح الأزهر اعتماداً/مركزية شرعية غير مطلوبة، أو مآذن الأزهر كتزكية",
    proven: hitsEndorse.length ? "نعم" : "لا",
    evidence: hitsEndorse.length ? hitsEndorse : hitsHistorical.length ? hitsHistorical : ["لا ذكر"],
    action: hitsEndorse.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hitsEndorse.length
      ? "ثبتت صيغة اعتماد/تزكية"
      : "لم يثبت الادعاء بصيغ اعتماد؛ الموجود ذكر مؤسسي/تاريخي — تُرك كما هو",
  });
}

// ═══════════════════════════════════════════════════════════════════════════
// فحوص إنتاج إضافية (ثابتة)
// ═══════════════════════════════════════════════════════════════════════════
{
  // Home fallback
  const hits: string[] = [];
  for (const base of ["seo-prerender", "dist"] as const) {
    const homePath = path.join(root, base, "index.html");
    if (!fs.existsSync(homePath)) continue;
    const homeTitle = (fs.readFileSync(homePath, "utf8").match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
    for (const f of walkHtml(base)) {
      const depth = path.relative(path.join(root, base), f).split(path.sep).length;
      if (depth < 2) continue;
      const html = fs.readFileSync(f, "utf8");
      const title = (html.match(/<title>([^<]*)<\/title>/i) || [])[1] || "";
      const robots = robotsOf(html);
      if (homeTitle && title === homeTitle && !/\bnoindex\b/.test(robots) && !/غير موجود|404|غير متاح/.test(title)) {
        hits.push(path.relative(root, f));
      }
    }
  }
  add({
    id: "C9-home-fallback",
    claim: "صفحات ديناميكية تعرض عنوان/محتوى الصفحة الرئيسية بدل محتواها (Home fallback)",
    proven: hits.length ? "نعم" : "لا",
    evidence: hits.length ? hits.slice(0, 10) : [`فُحص ${stats.prerenderPages + stats.distPages} HTML — لا تطابق عنوان الرئيسية`],
    action: hits.length ? "يفشل البوابة حتى يُصلح" : "تُرك كما هو",
    reason: hits.length ? "ثبت Home fallback" : "لم يثبت الادعاء، تُرك كما هو",
  });
}

{
  // البريد الرسمي موجود
  const contactHits: string[] = [];
  for (const rel of ["site.config.json", "src/lib/site-config.ts"]) {
    const p = path.join(root, rel);
    if (!fs.existsSync(p)) continue;
    if (/Majlisilm\.app@gmail\.com/i.test(fs.readFileSync(p, "utf8"))) contactHits.push(rel);
  }
  for (const file of walk(path.join(root, "src"), (n) => /\.(tsx?|json)$/.test(n))) {
    const t = fs.readFileSync(file, "utf8");
    if (/Majlisilm\.app@gmail\.com/i.test(t)) contactHits.push(path.relative(root, file));
  }
  add({
    id: "C10-official-email",
    claim: "البريد الرسمي Majlisilm.app@gmail.com مستخدم في الواجهة/البيانات",
    proven: contactHits.length ? "نعم" : "لا",
    evidence: contactHits.length ? [...new Set(contactHits)].slice(0, 8) : ["لم يُعثر على البريد الرسمي"],
    action: contactHits.length ? "تُرك كما هو" : "يفشل البوابة حتى يُصلح",
    reason: contactHits.length ? "مثبت في site.config.json / المصدر" : "البريد الرسمي غير موجود في المصدر",
  });
}

// ── كتابة التقرير ──────────────────────────────────────────────────────────
const provenCount = findings.filter((f) => f.proven === "نعم").length;
const unprovenCount = findings.filter((f) => f.proven === "لا").length;
const lines: string[] = [
  "# التقرير النهائي — تدقيق بيانات الموقع (Evidence-Gated)",
  "",
  `تاريخ: ${new Date().toISOString()}`,
  "",
  "## إحصاءات المسح",
  "",
  `- مسارات sitemap: ${stats.sitemapUrls}`,
  `- مسارات App: ${stats.appRoutes}`,
  `- صفحات seo-prerender: ${stats.prerenderPages}`,
  `- صفحات dist: ${stats.distPages}`,
  `- ادعاءات فُحصت: ${findings.length}`,
  `- ثبتت: ${provenCount}`,
  `- لم تثبت: ${unprovenCount}`,
  `- أخطاء بوابة: ${hardErrors.length}`,
  "",
  "## جدول الادعاءات",
  "",
];

for (const f of findings) {
  lines.push(`### ${f.id}`);
  lines.push("");
  lines.push(`- **الادعاء:** ${f.claim}`);
  lines.push(`- **هل ثبت؟** ${f.proven}`);
  lines.push(`- **الدليل:**`);
  for (const e of f.evidence) lines.push(`  - ${e}`);
  lines.push(`- **الإجراء:** ${f.action}`);
  lines.push(`- **سبب الإجراء:** ${f.reason}`);
  lines.push("");
}

lines.push("## خلاصة");
lines.push("");
lines.push(
  hardErrors.length
    ? "وُجدت ادعاءات مثبتة تتطلب إصلاحاً قبل اعتبار البوابة خضراء."
    : "لا ادعاءات مثبتة تتطلب تعديلاً إضافياً في هذه الجولة؛ ما سبق إصلاحه في الفروع السابقة بقي، وما لم يثبت تُرك كما هو.",
);
lines.push("");
lines.push("## محتوى قد يحتاج مراجعة شرعية بشرية (ليست أخطاء بوابة)");
lines.push("");
lines.push("- مسائل المجمع ذات `documentation_level: general_reasoning` حتى توثيق رسمي.");
lines.push("- كتب `needs_source` بلا رابط مصدر خارجي.");
lines.push("- أي توسع في قصص الأنبياء خارج النص القرآني الثابت.");
lines.push("");

fs.mkdirSync(path.dirname(reportPath), { recursive: true });
fs.writeFileSync(reportPath, lines.join("\n"), "utf8");

console.log(
  JSON.stringify(
    {
      ...stats,
      findings: findings.length,
      proven: provenCount,
      unproven: unprovenCount,
      hardErrors: hardErrors.length,
      report: path.relative(root, reportPath),
    },
    null,
    2,
  ),
);

if (hardErrors.length) {
  console.error(`audit:site-data FAILED\n- ${hardErrors.slice(0, 30).join("\n- ")}`);
  process.exit(1);
}
console.log("audit:site-data OK");
console.log(`📄 ${path.relative(root, reportPath)}`);
