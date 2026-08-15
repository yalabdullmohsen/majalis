#!/usr/bin/env node
/**
 * تدقيق شامل لبيانات الموقع — خريطة + اكتمال + فهرسة.
 * يكتب:
 *   reports/full-site-data-map.json
 *   reports/full-site-data-audit.md
 *   (ويُعاد استخدامهما في التقرير النهائي)
 *
 * لا يعدّل الملفات. يخرج غير صفري عند critical.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsDir = path.join(root, "reports");

type Severity = "critical" | "high" | "medium" | "low" | "info";
type Finding = {
  section: string;
  severity: Severity;
  check: string;
  entity_id: string;
  detail: string;
  evidence: string;
  indexing_only?: boolean;
};

const findings: Finding[] = [];

function add(f: Finding) {
  findings.push(f);
}

function exists(p: string) {
  try {
    fs.accessSync(p);
    return true;
  } catch {
    return false;
  }
}

function read(p: string) {
  return fs.readFileSync(p, "utf8");
}

async function imp<T>(rel: string): Promise<T> {
  return (await import(pathToFileURL(path.join(root, rel)).href)) as T;
}

function prerenderMeta(routePath: string) {
  const rel = routePath.replace(/^\//, "") || "";
  const file = path.join(root, "seo-prerender", rel, "index.html");
  if (!exists(file)) return null;
  const html = read(file);
  const robots = (html.match(/name="robots" content="([^"]+)"/) || [])[1] || "missing";
  const title = (html.match(/<title>([^<]+)/) || [])[1] || "";
  const main = (html.match(/<main[\s\S]*?<\/main>/) || [""])[0];
  const text = main.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const metaDesc = (html.match(/name="description" content="([^"]*)"/) || [])[1] || "";
  return {
    robots,
    title,
    textLen: text.length,
    textSlice: text.slice(0, 180),
    fullText: text,
    metaDesc,
    html,
    file: path.relative(root, file),
  };
}

async function main() {
  const sitemapPath = path.join(root, "public/sitemap.xml");
  const sitemap = exists(sitemapPath) ? read(sitemapPath) : "";
  const contentCounts = JSON.parse(read(path.join(root, "src/data/content-counts.json")));

  const { LIBRARY_CATALOG, libraryHasReadableSource } = await imp<{
    LIBRARY_CATALOG: Array<{ id: string; title: string; external_url?: string; description?: string }>;
    libraryHasReadableSource: (b: { external_url?: string }) => boolean;
  }>("src/lib/library-catalog.ts");

  const { SCHOLARS } = await imp<{
    SCHOLARS: Array<{ id: string; name: string; era: string; bio: string; verificationStatus: string; roleType?: string }>;
  }>("src/lib/scholars-data.ts");

  const { PROPHETS } = await imp<{
    PROPHETS: Array<{ slug: string; arabicName: string; briefBio: string; keyAttributes?: string[] }>;
  }>("src/lib/prophets-data.ts");

  const { RULINGS_ENCYCLOPEDIA_SEED } = await imp<{
    RULINGS_ENCYCLOPEDIA_SEED: Array<{
      id: string;
      external_key?: string;
      status?: string;
      verification_status?: string;
      title?: string;
      body?: string;
    }>;
  }>("src/lib/rulings-encyclopedia-seed.generated.ts");

  const { isPubliclyPublishedRuling, isPubliclyVisibleRuling } = await imp<{
    isPubliclyPublishedRuling: (r: unknown) => boolean;
    isPubliclyVisibleRuling: (r: unknown) => boolean;
  }>("src/lib/rulings-publication-gate.ts");

  const { classifyRuling, classifyLibraryBook, textClaimsVerification } = await imp<{
    classifyRuling: (r: unknown) => string;
    classifyLibraryBook: (b: unknown) => string;
    textClaimsVerification: (t: string) => boolean;
  }>("src/lib/publish-policy.ts");

  const { FIQH_COUNCIL_PUBLISHED_SEED, FIQH_COUNCIL_ALL_SEED } = await imp<{
    FIQH_COUNCIL_PUBLISHED_SEED: Array<Record<string, unknown>>;
    FIQH_COUNCIL_ALL_SEED: Array<Record<string, unknown>>;
  }>("src/lib/fiqh-council-seed.ts");

  const { isVerifiedPublicItem, isPublicIssue } = await imp<{
    isVerifiedPublicItem: (i: Record<string, unknown>) => boolean;
    isPublicIssue: (i: Record<string, unknown>) => boolean;
  }>("src/lib/fiqh-council-trust.ts");

  const { FIQH_ISSUES_PUBLISHED_SEED } = await imp<{
    FIQH_ISSUES_PUBLISHED_SEED: Array<Record<string, unknown>>;
  }>("src/lib/fiqh-issues-seed.ts");

  const { SEED_QA } = await imp<{ SEED_QA: unknown[] }>("src/lib/qa-seed.ts");
  const { DEMO_QUIZ_QUESTIONS } = await imp<{ DEMO_QUIZ_QUESTIONS: unknown[] }>("src/lib/quiz-seed.ts");
  const { ADHKAR_ITEMS } = await imp<{ ADHKAR_ITEMS: unknown[] }>("src/lib/adhkar-seed.ts");
  const { ANNUAL_COURSES_SEED } = await imp<{ ANNUAL_COURSES_SEED: unknown[] }>(
    "src/lib/annual-courses-seed.ts",
  );

  let surahStoriesCount = 0;
  try {
    const { SURAH_STORIES } = await imp<{ SURAH_STORIES: unknown[] }>("src/lib/surah-stories.ts");
    surahStoriesCount = SURAH_STORIES.length;
  } catch {
    surahStoriesCount = -1;
  }

  const pubRulings = RULINGS_ENCYCLOPEDIA_SEED.filter((r) => isPubliclyPublishedRuling(r));
  const visibleRulings = RULINGS_ENCYCLOPEDIA_SEED.filter((r) => isPubliclyVisibleRuling(r));
  const pendingRulings = RULINGS_ENCYCLOPEDIA_SEED.filter((r) => {
    const v = String(r.verification_status || "").toLowerCase();
    return v === "pending_review" || v === "needs_review" || v === "pending";
  });
  const blockedRulings = RULINGS_ENCYCLOPEDIA_SEED.filter((r) => classifyRuling(r) === "blocked");
  const pubFiqh = FIQH_COUNCIL_PUBLISHED_SEED.filter((i) => isVerifiedPublicItem(i));
  const pubIssues = FIQH_ISSUES_PUBLISHED_SEED.filter((i) => isPublicIssue(i));
  const booksWithSource = LIBRARY_CATALOG.filter((b) => libraryHasReadableSource(b));
  const booksNeedsSource = LIBRARY_CATALOG.filter((b) => !libraryHasReadableSource(b));

  const sections = {
    home: { kind: "static_hub", dataSource: "seo-routes + HomeView", recordCount: 1 },
    lessons: { kind: "seed", dataSource: "lessons-seed", recordCount: null as number | null },
    quran: { kind: "hub", dataSource: "quran-hub + mushaf assets", recordCount: null },
    "quran/surah-stories": { kind: "seed", dataSource: "surah-stories.ts", recordCount: surahStoriesCount },
    adhkar: { kind: "seed", dataSource: "adhkar-seed", recordCount: ADHKAR_ITEMS.length },
    dua: { kind: "hub", dataSource: "duas routes (/duas)", recordCount: null },
    hadith: { kind: "hub+json", dataSource: "public/data/hadith + verified-hadith-local-seed", recordCount: null },
    "hadith/sahih": { kind: "json", dataSource: "public/data/hadith/{bukhari,muslim}.json", recordCount: null },
    "hadith/daif": { kind: "seed", dataSource: "verified-hadith fill daif", recordCount: null },
    "hadith/mawdu": { kind: "seed", dataSource: "verified-hadith fill mawdu", recordCount: null },
    library: { kind: "catalog", dataSource: "library-catalog.ts", recordCount: LIBRARY_CATALOG.length },
    scholars: { kind: "catalog", dataSource: "scholars-data.ts", recordCount: SCHOLARS.length },
    prophets: { kind: "seed", dataSource: "prophets-data.ts", recordCount: PROPHETS.length },
    fiqh: { kind: "hub", dataSource: "fiqh pages + topics", recordCount: null },
    rulings: {
      kind: "encyclopedia",
      dataSource: "rulings-encyclopedia-seed + publication gate",
      recordCount: RULINGS_ENCYCLOPEDIA_SEED.length,
      publicCount: pubRulings.length,
      pendingCount: pendingRulings.length,
    },
    fatwa: { kind: "redirect/alias", dataSource: "/fatwa → /fiqh|/rulings (ملغى كقسم مستقل)", recordCount: 0 },
    "fiqh-council": {
      kind: "seed",
      dataSource: "fiqh-council-seed",
      recordCount: FIQH_COUNCIL_ALL_SEED.length,
      publicCount: pubFiqh.length,
    },
    qa: { kind: "redirect", dataSource: "/qa → /quiz · SEED_QA", recordCount: SEED_QA.length },
    topics: { kind: "seed", dataSource: "topics data via generate-seo", recordCount: null },
    "sins-and-rights": { kind: "seed", dataSource: "sins-rights seed", recordCount: null },
    "islamic-glossary": { kind: "seed", dataSource: "glossary seed", recordCount: null },
    prayer: { kind: "tool", dataSource: "/prayer-times (مواقيت)", recordCount: null },
    search: { kind: "tool", dataSource: "SearchView · noindex", recordCount: null },
    "knowledge-graph": { kind: "live/supabase", dataSource: "KnowledgeGraphPage + kn APIs", recordCount: null },
  } as Record<string, Record<string, unknown>>;

  // دروس
  try {
    const { LESSONS_SEED } = await imp<{ LESSONS_SEED: unknown[] }>("src/lib/lessons-seed.ts");
    sections.lessons.recordCount = LESSONS_SEED.length;
  } catch {
    /* optional */
  }

  const hubPaths = [
    "/",
    "/lessons",
    "/quran-hub",
    "/quran/surah-stories",
    "/adhkar",
    "/duas",
    "/hadith",
    "/hadith/sahih",
    "/hadith/daif",
    "/hadith/mawdu",
    "/library",
    "/scholars",
    "/prophets",
    "/fiqh",
    "/rulings",
    "/fiqh-council",
    "/fiqh-council/issues",
    "/quiz",
    "/topics",
    "/sins-and-rights",
    "/islamic-glossary",
    "/prayer-times",
    "/search",
    "/knowledge-graph",
    "/ulum-quran",
  ];

  const routeMap: Array<Record<string, unknown>> = [];
  for (const p of hubPaths) {
    const meta = prerenderMeta(p === "/" ? "" : p.replace(/^\//, ""));
    const inSitemap =
      p === "/"
        ? /<loc>https:\/\/majlisilm\.com\/?<\/loc>/.test(sitemap)
        : sitemap.includes(`<loc>https://majlisilm.com${p}</loc>`);
    const indexable = meta ? /^(index)/.test(meta.robots) : null;
    routeMap.push({
      path: p,
      hasPrerender: Boolean(meta),
      robots: meta?.robots ?? null,
      inSitemap,
      textLen: meta?.textLen ?? 0,
      indexable,
    });

    if (meta && indexable && meta.textLen < 80) {
      const hasIncompleteNotice = /قيد الإكمال|قيد الإعداد|قيد المراجعة/.test(
        meta.textSlice + meta.title,
      );
      add({
        section: p,
        severity: hasIncompleteNotice ? "info" : "high",
        check: "thin_indexed_hub",
        entity_id: p,
        detail: hasIncompleteNotice
          ? `صفحة hub مفهرسة بنص قصير مع تنبيه قيد الإكمال (${meta.textLen} حرفاً)`
          : `صفحة hub مفهرسة بنص شبه فارغ بلا تنبيه (${meta.textLen} حرفاً)`,
        evidence: meta.file,
      });
    }
    if (meta && !indexable && inSitemap) {
      add({
        section: p,
        severity: "critical",
        check: "noindex_in_sitemap",
        entity_id: p,
        detail: "robots=noindex لكن المسار في sitemap",
        evidence: "public/sitemap.xml + prerender",
      });
    }
  }

  // ── أحكام blocked في sitemap فقط (partial/pending مسموح) ──────────────
  for (const r of blockedRulings) {
    const id = r.external_key || r.id;
    if (sitemap.includes(`/rulings/${id}`)) {
      add({
        section: "rulings",
        severity: "critical",
        check: "blocked_in_sitemap",
        entity_id: String(id),
        detail: "حكم blocked داخل sitemap",
        evidence: "classifyRuling + sitemap",
      });
    }
  }

  // ── كتب بلا مصدر: تنبيه معلومة فقط (مسموح index/sitemap مع partial) ──
  for (const b of booksNeedsSource) {
    const status = classifyLibraryBook(b);
    const meta = prerenderMeta(`library/${b.id}`);
    if (!meta) continue;
    const scan = `${meta.metaDesc}\n${meta.title}\n${meta.fullText}`;
    // ادعاء توثيق المنصة في الميتا فقط (لا وصف تاريخي للكتاب الكلاسيكي)
    if (textClaimsVerification(meta.metaDesc) && status !== "published" && !/قيد الإ/.test(meta.metaDesc)) {
      add({
        section: "library",
        severity: "critical",
        check: "sourceless_verification_claim",
        entity_id: b.id,
        detail: "كتاب بلا مصدر يدّعي توثيقًا في meta description بلا تنبيه",
        evidence: meta.file,
      });
    }
    if (status !== "published" && !/قيد الإكمال|قيد الإضافة|قيد الإ/.test(scan)) {
      add({
        section: "library",
        severity: "high",
        check: "sourceless_missing_notice",
        entity_id: b.id,
        detail: "كتاب بلا مصدر بلا تنبيه قيد الإكمال في prerender",
        evidence: meta.file,
      });
    }
  }

  // ── hub أحكام: ممنوع ادعاء موسوعة معتمدة بلا اعتماد ───────────────────
  const rulingsHub = prerenderMeta("rulings");
  if (rulingsHub) {
    if (/موسوعة.*معتمد|موثقة بالأدلة|مكتبة علمية شاملة/.test(rulingsHub.textSlice) && !/قيد الإكمال|قيد المراجعة/.test(rulingsHub.textSlice)) {
      add({
        section: "rulings",
        severity: "critical",
        check: "rulings_hub_overclaim",
        entity_id: "/rulings",
        detail: "نص hub يدّعي اكتمالًا/توثيقًا بلا تنبيه قيد الإكمال",
        evidence: rulingsHub.file,
      });
    }
  }

  // ── knowledge-graph: ممنوع ادعاء توثيق شامل ───────────────────────────
  const kg = prerenderMeta("knowledge-graph");
  if (kg && /جميع العلاقات.*موثقة|مصدر معتمد/.test(kg.textSlice) && !/قيد الإكمال/.test(kg.textSlice)) {
    add({
      section: "knowledge-graph",
      severity: "critical",
      check: "kg_verification_overclaim",
      entity_id: "/knowledge-graph",
      detail: "خريطة المعرفة تدّعي توثيق كل العلاقات",
      evidence: kg.file,
    });
  }

  // ── quiz/qa: ممنوع «موثقة بالأدلة» عند فراغ المحتوى ───────────────────
  const quiz = prerenderMeta("quiz");
  if (DEMO_QUIZ_QUESTIONS.length === 0 && quiz && /موثقة بالأدلة/.test(quiz.textSlice + quiz.title)) {
    add({
      section: "quiz",
      severity: "critical",
      check: "empty_quiz_verification_claim",
      entity_id: "/quiz",
      detail: "صفحة أسئلة فارغة تدّعي أنها موثقة بالأدلة",
      evidence: quiz.file,
    });
  }

  // ── ذو الكفل: لا جزم عليه السلام في العنوان ───────────────────────────
  const dhul = prerenderMeta("prophets/dhul-kifl");
  if (dhul && /عليه السلام/.test(dhul.title) && !/خلاف|دون جزم|ذكر قرآني/.test(dhul.title)) {
    add({
      section: "prophets",
      severity: "high",
      check: "dhul_kifl_assertive_title",
      entity_id: "dhul-kifl",
      detail: "عنوان الصفحة يجزم بـ«عليه السلام» رغم الخلاف في النبوة المذكور في النبذة",
      evidence: dhul.file,
    });
  }

  // ── أرقام تسويقية ─────────────────────────────────────────────────────
  const marketing = [
    { re: /117\s*كتاب/, label: "117 كتاباً", actual: LIBRARY_CATALOG.length },
    { re: /96\s*عالم/, label: "96 عالماً", actual: SCHOLARS.length },
    { re: /108\s*فتوى/, label: "108 فتوى", actual: pubFiqh.length },
    { re: /950\s*سؤال/, label: "950 سؤالاً", actual: DEMO_QUIZ_QUESTIONS.length },
  ];
  for (const rel of [
    "src/lib/updates-seed.ts",
    "lib/updates-ios-fallback.mjs",
    "src/lib/navigation.ts",
    "src/pages/account/ui/HomeView.tsx",
  ]) {
    const p = path.join(root, rel);
    if (!exists(p)) continue;
    const text = read(p);
    for (const m of marketing) {
      if (m.re.test(text) && m.actual !== Number(String(text.match(m.re)?.[0]?.match(/\d+/)?.[0]))) {
        add({
          section: "counts",
          severity: "medium",
          check: "stale_marketing_number",
          entity_id: rel,
          detail: `${m.label} في النص بينما الفعلي=${m.actual}`,
          evidence: rel,
        });
      }
    }
  }

  // content-counts drift
  if (Number(contentCounts.books) !== LIBRARY_CATALOG.length) {
    add({
      section: "counts",
      severity: "high",
      check: "content_counts_drift",
      entity_id: "books",
      detail: `content-counts.books=${contentCounts.books} ≠ ${LIBRARY_CATALOG.length}`,
      evidence: "content-counts.json",
    });
  }
  if (Number(contentCounts.scholars) !== SCHOLARS.length) {
    add({
      section: "counts",
      severity: "high",
      check: "content_counts_drift",
      entity_id: "scholars",
      detail: `content-counts.scholars=${contentCounts.scholars} ≠ ${SCHOLARS.length}`,
      evidence: "content-counts.json",
    });
  }

  // fiqh thin published — معلومة/عالية إن ادّعت توثيقًا؛ ليست critical للإخفاء
  for (const item of FIQH_COUNCIL_ALL_SEED) {
    if (String(item.status) !== "published") continue;
    const summary = String(item.summary || "").trim();
    const ruling = String(item.ruling_text || item.content || "").trim();
    if (summary.length < 40 && ruling.length < 80) {
      const slug = String(item.slug || item.id);
      const claim =
        textClaimsVerification(summary) ||
        textClaimsVerification(ruling) ||
        textClaimsVerification(String(item.title || ""));
      add({
        section: "fiqh-council",
        severity: claim ? "critical" : "medium",
        check: claim ? "thin_fiqh_verification_claim" : "thin_fiqh_item",
        entity_id: slug,
        detail: claim
          ? "مادة مجمع رقيقة تدّعي توثيقًا"
          : "مادة مجمع منشورة بنص رقيق — يُتوقع تنبيه قيد الإكمال",
        evidence: "fiqh-council-seed",
      });
    }
  }

  const map = {
    at: new Date().toISOString(),
    contentCounts,
    sections,
    counts: {
      books: LIBRARY_CATALOG.length,
      booksWithSource: booksWithSource.length,
      booksNeedsSource: booksNeedsSource.length,
      scholars: SCHOLARS.length,
      prophets: PROPHETS.length,
      rulingsTotal: RULINGS_ENCYCLOPEDIA_SEED.length,
      rulingsPublic: pubRulings.length,
      rulingsVisible: visibleRulings.length,
      rulingsPending: pendingRulings.length,
      rulingsBlocked: blockedRulings.length,
      fiqhPublic: pubFiqh.length,
      fiqhIssuesPublic: pubIssues.length,
      qa: SEED_QA.length,
      quiz: DEMO_QUIZ_QUESTIONS.length,
      adhkar: ADHKAR_ITEMS.length,
      courses: ANNUAL_COURSES_SEED.length,
      surahStories: surahStoriesCount,
      sitemapUrls: (sitemap.match(/<loc>/g) || []).length,
    },
    hubs: routeMap,
  };

  const summary = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    low: findings.filter((f) => f.severity === "low").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "full-site-data-map.json"),
    JSON.stringify(map, null, 2),
    "utf8",
  );

  const md = [
    "# تدقيق بيانات الموقع الكامل",
    "",
    `التاريخ: ${map.at}`,
    "",
    "## أعداد",
    "",
    "```json",
    JSON.stringify(map.counts, null, 2),
    "```",
    "",
    "## الأقسام",
    "",
    ...Object.entries(sections).map(
      ([k, v]) =>
        `- **${k}**: مصدر=\`${v.dataSource}\` · سجلات=${v.recordCount ?? "—"}` +
        (v.publicCount != null ? ` · عامة=${v.publicCount}` : "") +
        (v.pendingCount != null ? ` · pending=${v.pendingCount}` : ""),
    ),
    "",
    "## نتائج",
    "",
    `- critical: ${summary.critical}`,
    `- high: ${summary.high}`,
    `- medium: ${summary.medium}`,
    `- إجمالي: ${summary.total}`,
    "",
    "## Findings",
    "",
    ...findings
      .filter((f) => f.severity === "critical" || f.severity === "high")
      .map(
        (f) =>
          `- **[${f.severity}]** \`${f.check}\` · ${f.section}/${f.entity_id}: ${f.detail}` +
          (f.indexing_only ? " _(ظهر في الفهرسة ولم يثبت في الكود الحالي)_" : ""),
      ),
    "",
  ];
  fs.writeFileSync(path.join(reportsDir, "full-site-data-audit.md"), md.join("\n"), "utf8");
  fs.writeFileSync(
    path.join(reportsDir, "full-site-data-audit.json"),
    JSON.stringify({ summary, findings }, null, 2),
    "utf8",
  );

  console.log("Full-site data audit");
  console.log(JSON.stringify(summary, null, 2));
  console.log("→ reports/full-site-data-map.json");
  console.log("→ reports/full-site-data-audit.md");
  if (summary.critical > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
