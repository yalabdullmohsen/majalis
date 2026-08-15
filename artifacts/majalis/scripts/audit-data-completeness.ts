#!/usr/bin/env node
/**
 * تدقيق اكتمال البيانات — DATA COMPLETENESS
 * يقرأ مصادر البيانات + sitemap/prerender عند توفرها.
 * لا يعدّل الملفات؛ يخرج تقارير JSON/MD وخروج غير صفري عند critical.
 *
 * التشغيل: pnpm run audit:data-completeness
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsDir = path.join(root, "reports");

type Severity = "critical" | "high" | "medium" | "low" | "info";
type Finding = {
  check: string;
  severity: Severity;
  entity_type: string;
  entity_id: string;
  detail: string;
  evidence: string;
  auto_fix_allowed: boolean;
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

function readText(p: string) {
  return fs.readFileSync(p, "utf8");
}

async function importLib<T>(rel: string): Promise<T> {
  const href = pathToFileURL(path.join(root, rel)).href;
  return (await import(href)) as T;
}

function thinSentence(text: string): boolean {
  const t = text.replace(/\s+/g, " ").trim();
  if (t.length < 40) return true;
  if (/^(بحث|قرار|فتوى|توصية)\s+من\s+/.test(t) && t.length < 80) return true;
  return false;
}

async function main() {
  const {
    LIBRARY_CATALOG,
    libraryHasReadableSource,
  } = await importLib<{
    LIBRARY_CATALOG: Array<{
      id: string;
      title: string;
      description?: string;
      external_url?: string;
      author?: string;
    }>;
    libraryHasReadableSource: (b: { external_url?: string }) => boolean;
  }>("src/lib/library-catalog.ts");

  const { SCHOLARS, resolveScholarCautionLevel, resolveScholarRoleType } = await importLib<{
    SCHOLARS: Array<{
      id: string;
      name: string;
      era: string;
      bio: string;
      specialty: string[];
      key_works: string[];
      verificationStatus: string;
      roleType?: string;
      cautionLevel?: string;
    }>;
    resolveScholarCautionLevel: (s: unknown) => string;
    resolveScholarRoleType: (s: unknown) => string;
  }>("src/lib/scholars-data.ts");

  const {
    FIQH_COUNCIL_ALL_SEED,
    FIQH_COUNCIL_PUBLISHED_SEED,
  } = await importLib<{
    FIQH_COUNCIL_ALL_SEED: Array<Record<string, unknown>>;
    FIQH_COUNCIL_PUBLISHED_SEED: Array<Record<string, unknown>>;
  }>("src/lib/fiqh-council-seed.ts");

  const { isVerifiedPublicItem, isPublicIssue } = await importLib<{
    isVerifiedPublicItem: (i: Record<string, unknown>) => boolean;
    isPublicIssue: (i: Record<string, unknown>) => boolean;
  }>("src/lib/fiqh-council-trust.ts");

  const { FIQH_ISSUES_PUBLISHED_SEED } = await importLib<{
    FIQH_ISSUES_PUBLISHED_SEED: Array<Record<string, unknown>>;
  }>("src/lib/fiqh-issues-seed.ts");

  const { RULINGS_ENCYCLOPEDIA_SEED } = await importLib<{
    RULINGS_ENCYCLOPEDIA_SEED: Array<{
      id: string;
      external_key?: string;
      slug?: string;
      title?: string;
      status?: string;
      verification_status?: string;
      body?: string;
      summary?: string;
    }>;
  }>("src/lib/rulings-encyclopedia-seed.generated.ts");

  const { isPubliclyPublishedRuling } = await importLib<{
    isPubliclyPublishedRuling: (r: unknown) => boolean;
  }>("src/lib/rulings-publication-gate.ts");

  const { SEED_QA } = await importLib<{ SEED_QA: unknown[] }>("src/lib/qa-seed.ts");
  const { DEMO_QUIZ_QUESTIONS } = await importLib<{ DEMO_QUIZ_QUESTIONS: unknown[] }>(
    "src/lib/quiz-seed.ts",
  );
  const { resolveScholarWorkLink } = await importLib<{
    resolveScholarWorkLink: (
      w: string,
      name?: string,
    ) => { label: string; href: string | null; bookId: string | null };
  }>("src/lib/scholar-library-links.ts");

  const contentCounts = JSON.parse(
    readText(path.join(root, "src/data/content-counts.json")),
  ) as Record<string, number | string>;

  const sitemapPath = path.join(root, "public/sitemap.xml");
  const sitemap = exists(sitemapPath) ? readText(sitemapPath) : "";

  const counts = {
    books: LIBRARY_CATALOG.length,
    booksWithSource: LIBRARY_CATALOG.filter((b) => libraryHasReadableSource(b)).length,
    booksNeedsSource: LIBRARY_CATALOG.filter((b) => !libraryHasReadableSource(b)).length,
    scholars: SCHOLARS.length,
    scholarsPending: SCHOLARS.filter((s) => s.verificationStatus === "pending_review").length,
    scholarsGenericEra: SCHOLARS.filter((s) => s.era === "العلماء الكبار").length,
    fatwaPublic: FIQH_COUNCIL_PUBLISHED_SEED.filter((i) => isVerifiedPublicItem(i)).length,
    fiqhAll: FIQH_COUNCIL_ALL_SEED.length,
    fiqhIssuesPublic: FIQH_ISSUES_PUBLISHED_SEED.filter((i) => isPublicIssue(i)).length,
    rulingsTotal: RULINGS_ENCYCLOPEDIA_SEED.length,
    rulingsPublic: RULINGS_ENCYCLOPEDIA_SEED.filter((r) => isPubliclyPublishedRuling(r)).length,
    rulingsPending: RULINGS_ENCYCLOPEDIA_SEED.filter((r) => {
      const v = String(r.verification_status || "").toLowerCase();
      const s = String(r.status || "").toLowerCase();
      return (
        v === "pending_review" ||
        v === "needs_review" ||
        v === "pending" ||
        s === "pending_review" ||
        s === "needs_review"
      );
    }).length,
    qa: SEED_QA.length,
    quiz: DEMO_QUIZ_QUESTIONS.length,
  };

  // ── 1) pending في sitemap ─────────────────────────────────────────────
  for (const r of RULINGS_ENCYCLOPEDIA_SEED) {
    if (isPubliclyPublishedRuling(r)) continue;
    const pathId = r.external_key || r.slug || r.id;
    const loc = `/rulings/${pathId}`;
    if (sitemap.includes(loc)) {
      add({
        check: "pending_in_sitemap",
        severity: "critical",
        entity_type: "ruling",
        entity_id: String(pathId),
        detail: "حكم pending/غير منشور موجود في sitemap",
        evidence: "public/sitemap.xml + rulings-encyclopedia-seed",
        auto_fix_allowed: true,
      });
    }
  }

  // ── 2) كتب بلا مصدر في sitemap أو robots=index ────────────────────────
  for (const b of LIBRARY_CATALOG) {
    if (libraryHasReadableSource(b)) continue;
    const loc = `/library/${b.id}`;
    if (sitemap.includes(`<loc>https://majlisilm.com${loc}</loc>`)) {
      add({
        check: "sourceless_book_in_sitemap",
        severity: "critical",
        entity_type: "library",
        entity_id: b.id,
        detail: "كتاب بلا external_url داخل sitemap",
        evidence: "library-catalog + public/sitemap.xml",
        auto_fix_allowed: true,
      });
    }
    const prerender = path.join(root, "seo-prerender/library", b.id, "index.html");
    if (exists(prerender)) {
      const html = readText(prerender);
      if (/name="robots" content="index/.test(html)) {
        add({
          check: "sourceless_book_indexable",
          severity: "critical",
          entity_type: "library",
          entity_id: b.id,
          detail: "كتاب بلا مصدر بقيمة robots=index في prerender",
          evidence: `seo-prerender/library/${b.id}/index.html`,
          auto_fix_allowed: true,
        });
      }
    }
  }

  // ── 3) عناصر المجمع الفقهي الناقصة ───────────────────────────────────
  for (const item of FIQH_COUNCIL_ALL_SEED) {
    const slug = String(item.slug || item.id || "");
    const title = String(item.title || "");
    const summary = String(item.summary || "");
    const ruling = String(item.ruling_text || item.content || "");
    const sourceUrl = String(item.source_url || "");
    const sourceRef = String(item.source_reference || item.source_name || "");
    const status = String(item.status || "");
    const bodyThin = thinSentence(summary) && thinSentence(ruling);

    if (status === "published" && bodyThin) {
      add({
        check: "fiqh_thin_published",
        severity: "high",
        entity_type: "fiqh_council",
        entity_id: slug,
        detail: `منشور بمحتوى رقيق: «${(summary || ruling || title).slice(0, 60)}»`,
        evidence: "fiqh-council-seed",
        auto_fix_allowed: false,
      });
    }
    if (status === "published" && !sourceUrl && !sourceRef) {
      add({
        check: "fiqh_missing_source",
        severity: "high",
        entity_type: "fiqh_council",
        entity_id: slug,
        detail: "منشور بلا source_url ولا source_name",
        evidence: "fiqh-council-seed",
        auto_fix_allowed: false,
      });
    }
    if (isVerifiedPublicItem(item) && bodyThin) {
      add({
        check: "fiqh_public_thin",
        severity: "critical",
        entity_type: "fiqh_council",
        entity_id: slug,
        detail: "عنصر عام موثّق لكن نصه شبه فارغ",
        evidence: "isVerifiedPublicItem + seed",
        auto_fix_allowed: true,
      });
    }
  }

  // ── 4) صفحات فارغة معلنة ──────────────────────────────────────────────
  if (counts.qa === 0) {
    add({
      check: "empty_qa_seed",
      severity: "info",
      entity_type: "qa",
      entity_id: "/qa",
      detail: "SEED_QA فارغ؛ المسار /qa يحوّل إلى /quiz — لا فهرسة مستقلة مطلوبة",
      evidence: "qa-seed + App.tsx Redirect",
      auto_fix_allowed: false,
    });
  }

  if (Number(contentCounts.quizQuestions) !== counts.quiz) {
    add({
      check: "count_mismatch_quiz",
      severity: "high",
      entity_type: "counts",
      entity_id: "quizQuestions",
      detail: `content-counts.quizQuestions=${contentCounts.quizQuestions} ≠ DEMO_QUIZ=${counts.quiz}`,
      evidence: "content-counts.json + quiz-seed",
      auto_fix_allowed: true,
    });
  }

  for (const [key, expected] of [
    ["books", counts.books],
    ["scholars", counts.scholars],
    ["rulings", counts.rulingsTotal],
  ] as const) {
    if (Number(contentCounts[key]) !== expected) {
      add({
        check: "count_mismatch",
        severity: "high",
        entity_type: "counts",
        entity_id: key,
        detail: `content-counts.${key}=${contentCounts[key]} ≠ actual=${expected}`,
        evidence: "content-counts.json",
        auto_fix_allowed: true,
      });
    }
  }

  // أرقام تسويقية شائعة في النصوص
  const marketingSnippets = [
    { re: /117\s*كتاب/, label: "117 كتاباً" },
    { re: /96\s*عالم/, label: "96 عالماً" },
    { re: /108\s*فتوى/, label: "108 فتوى" },
    { re: /950\s*سؤال/, label: "950 سؤالاً" },
  ];
  const scanFiles = [
    "src/lib/updates-seed.ts",
    "lib/updates-ios-fallback.mjs",
    "src/lib/navigation.ts",
    "src/pages/account/ui/HomeView.tsx",
  ];
  for (const rel of scanFiles) {
    const p = path.join(root, rel);
    if (!exists(p)) continue;
    const text = readText(p);
    for (const m of marketingSnippets) {
      if (m.re.test(text)) {
        add({
          check: "stale_marketing_count",
          severity: "medium",
          entity_type: "copy",
          entity_id: rel,
          detail: `رقم تسويقي غير مربوط بالعداد: ${m.label}`,
          evidence: rel,
          auto_fix_allowed: true,
        });
      }
    }
  }

  // ── 5) تكرار bio/summary في prerender العلماء ─────────────────────────
  for (const s of SCHOLARS) {
    const prerender = path.join(root, "seo-prerender/scholars", s.id, "index.html");
    if (!exists(prerender)) continue;
    const html = readText(prerender);
    const paras = [...html.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/g)].map((m) =>
      m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim(),
    );
    const long = paras.filter((p) => p.length > 60 && !p.startsWith("©"));
    const seen = new Map<string, number>();
    for (const p of long) {
      seen.set(p, (seen.get(p) || 0) + 1);
    }
    for (const [p, n] of seen) {
      if (n > 1) {
        add({
          check: "duplicate_bio_paragraph",
          severity: "medium",
          entity_type: "scholar",
          entity_id: s.id,
          detail: `فقرة مكررة ${n}× في prerender: «${p.slice(0, 70)}…»`,
          evidence: `seo-prerender/scholars/${s.id}/index.html`,
          auto_fix_allowed: true,
        });
      }
    }
  }

  // ── 6) علماء بلا تصنيف دقيق ───────────────────────────────────────────
  for (const s of SCHOLARS) {
    const role = resolveScholarRoleType(s);
    const caution = resolveScholarCautionLevel(s);
    if (s.era === "العلماء الكبار" && !s.roleType) {
      add({
        check: "scholar_generic_era",
        severity: "low",
        entity_type: "scholar",
        entity_id: s.id,
        detail: `era=العلماء الكبار دون roleType صريح (المشتق: ${role})`,
        evidence: "scholars-data.ts",
        auto_fix_allowed: false,
      });
    }
    if (
      (role === "philosopher" || role === "historian" || role === "public_figure") &&
      caution === "none"
    ) {
      add({
        check: "scholar_caution_mismatch",
        severity: "medium",
        entity_type: "scholar",
        entity_id: s.id,
        detail: `دور ${role} مع cautionLevel=none`,
        evidence: "scholars-data.ts",
        auto_fix_allowed: true,
      });
    }
  }

  // ── 7) ذكر الأزهر الترويجي ────────────────────────────────────────────
  const azharPromo =
    /(اعتماد\s*الأزهر|تزكية\s*الأزهر|علماء\s*الأزهر\s*المعتمد|المرجع\s*الأزهري)/;
  for (const s of SCHOLARS) {
    if (azharPromo.test(s.bio)) {
      add({
        check: "azhar_promotional",
        severity: "medium",
        entity_type: "scholar",
        entity_id: s.id,
        detail: "ذكر أزهري بصيغة اعتماد/تزكية",
        evidence: "scholars-data.ts bio",
        auto_fix_allowed: false,
      });
    }
  }

  // ── 8) روابط مكسورة: sitemap → كتالوج ─────────────────────────────────
  if (sitemap) {
    const libLocs = [...sitemap.matchAll(/https:\/\/majlisilm\.com\/library\/(book-[a-z0-9-]+)/g)].map(
      (m) => m[1],
    );
    const bookIds = new Set(LIBRARY_CATALOG.map((b) => b.id));
    for (const id of new Set(libLocs)) {
      if (!bookIds.has(id)) {
        add({
          check: "broken_library_sitemap_link",
          severity: "critical",
          entity_type: "library",
          entity_id: id,
          detail: "مسار مكتبة في sitemap بلا سجل كتالوج",
          evidence: "sitemap.xml",
          auto_fix_allowed: true,
        });
      }
    }
    const schLocs = [...sitemap.matchAll(/https:\/\/majlisilm\.com\/scholars\/([a-z0-9-]+)/g)].map(
      (m) => m[1],
    );
    const scholarIds = new Set(SCHOLARS.map((s) => s.id));
    for (const id of new Set(schLocs)) {
      if (!scholarIds.has(id)) {
        add({
          check: "broken_scholar_sitemap_link",
          severity: "critical",
          entity_type: "scholar",
          entity_id: id,
          detail: "مسار عالم في sitemap بلا سجل",
          evidence: "sitemap.xml",
          auto_fix_allowed: true,
        });
      }
    }
  }

  // related / works — روابط تشير لمعرّف غير موجود (عند وجود href)
  let workLinks = 0;
  let workLinked = 0;
  for (const s of SCHOLARS) {
    for (const w of s.key_works || []) {
      workLinks += 1;
      const link = resolveScholarWorkLink(w, s.name);
      if (link.href && link.bookId && !LIBRARY_CATALOG.some((b) => b.id === link.bookId)) {
        add({
          check: "broken_scholar_work_ref",
          severity: "high",
          entity_type: "scholar_work",
          entity_id: `${s.id}::${link.bookId}`,
          detail: `عمل العالم يشير لكتاب مفقود: ${w}`,
          evidence: "scholar-library-links",
          auto_fix_allowed: true,
        });
      }
      if (link.href) workLinked += 1;
    }
  }

  // duplicated slugs / titles
  const bookTitles = new Map<string, string[]>();
  for (const b of LIBRARY_CATALOG) {
    const k = b.title.trim();
    if (!bookTitles.has(k)) bookTitles.set(k, []);
    bookTitles.get(k)!.push(b.id);
  }
  for (const [title, ids] of bookTitles) {
    if (ids.length > 1) {
      add({
        check: "duplicated_book_title",
        severity: "medium",
        entity_type: "library",
        entity_id: ids.join(","),
        detail: `عنوان مكرر: ${title}`,
        evidence: "library-catalog",
        auto_fix_allowed: false,
      });
    }
  }

  const scholarNames = new Map<string, string[]>();
  for (const s of SCHOLARS) {
    const k = s.name.trim();
    if (!scholarNames.has(k)) scholarNames.set(k, []);
    scholarNames.get(k)!.push(s.id);
  }
  for (const [name, ids] of scholarNames) {
    if (ids.length > 1) {
      add({
        check: "duplicated_scholar_name",
        severity: "medium",
        entity_type: "scholar",
        entity_id: ids.join(","),
        detail: `اسم مكرر: ${name}`,
        evidence: "scholars-data",
        auto_fix_allowed: false,
      });
    }
  }

  // reviewStatus/indexability mismatch — pending يجب ألا يكون index
  // (نُغطّي عبر sitemap أعلاه؛ نضيف info عن البوابة)
  add({
    check: "rulings_publication_gate",
    severity: "info",
    entity_type: "ruling",
    entity_id: "gate",
    detail: `أحكام عامة=${counts.rulingsPublic} · قيد مراجعة=${counts.rulingsPending} · بوابة isPubliclyPublishedRuling فعّالة`,
    evidence: "rulings-publication-gate.ts",
    auto_fix_allowed: false,
  });

  const summary = {
    at: new Date().toISOString(),
    counts,
    contentCounts,
    workLinks,
    workLinked,
    findings: {
      total: findings.length,
      critical: findings.filter((f) => f.severity === "critical").length,
      high: findings.filter((f) => f.severity === "high").length,
      medium: findings.filter((f) => f.severity === "medium").length,
      low: findings.filter((f) => f.severity === "low").length,
      info: findings.filter((f) => f.severity === "info").length,
    },
  };

  fs.mkdirSync(reportsDir, { recursive: true });
  const jsonPath = path.join(reportsDir, "data-completeness-audit.json");
  const mdPath = path.join(reportsDir, "data-completeness-audit.md");
  fs.writeFileSync(jsonPath, JSON.stringify({ summary, findings }, null, 2), "utf8");

  const md = [
    "# تدقيق اكتمال البيانات",
    "",
    `التاريخ: ${summary.at}`,
    "",
    "## الأعداد",
    "",
    `- كتب: ${counts.books} (بمصدر: ${counts.booksWithSource} · بلا مصدر: ${counts.booksNeedsSource})`,
    `- علماء: ${counts.scholars} (pending: ${counts.scholarsPending} · era كبار بلا roleType صريح: يُراجع في findings)`,
    `- أحكام: ${counts.rulingsTotal} (عامة: ${counts.rulingsPublic} · pending: ${counts.rulingsPending})`,
    `- مجمع فقهي منشور موثّق: ${counts.fatwaPublic}`,
    `- مسائل فقهية عامة: ${counts.fiqhIssuesPublic}`,
    `- QA seed: ${counts.qa} · Quiz: ${counts.quiz}`,
    "",
    "## ملخص النتائج",
    "",
    `- إجمالي: ${summary.findings.total}`,
    `- critical: ${summary.findings.critical}`,
    `- high: ${summary.findings.high}`,
    `- medium: ${summary.findings.medium}`,
    `- low: ${summary.findings.low}`,
    `- info: ${summary.findings.info}`,
    "",
    "## التفاصيل",
    "",
  ];
  for (const f of findings.filter((x) => x.severity !== "info" && x.severity !== "low").slice(0, 200)) {
    md.push(
      `- **[${f.severity}]** \`${f.check}\` · ${f.entity_type}/${f.entity_id}: ${f.detail} _(دليل: ${f.evidence})_`,
    );
  }
  md.push("");
  fs.writeFileSync(mdPath, md.join("\n"), "utf8");

  console.log("Data completeness audit");
  console.log(JSON.stringify(summary.findings, null, 2));
  console.log(`→ ${path.relative(root, jsonPath)}`);
  console.log(`→ ${path.relative(root, mdPath)}`);

  if (summary.findings.critical > 0) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
