#!/usr/bin/env node
/**
 * التدقيق النهائي لبيانات النشر — يمنع التضليل دون إخفاء الصفحات الناقصة.
 *
 * يفشل عند:
 * - partial يدّعي التوثيق بلا مصدر
 * - pending_review يُعرض كمعتمد
 * - قائمة فارغة تدّعي الاكتمال
 * - أرقام تسويقية في الرئيسية/التحديثات لا تطابق البيانات
 * - «موثقة بالأدلة» بلا evidence
 * - مادة فقهية بلا مصدر تُعرض كمرجع نهائي
 * - blocked داخل sitemap
 * - مسارات hub مؤكدة بلا prerender/محتوى
 *
 * التشغيل: pnpm run audit:final-publication-data
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reportsDir = path.join(root, "reports");

type Finding = {
  severity: "critical" | "high" | "medium" | "info";
  check: string;
  entity_id: string;
  detail: string;
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

function prerenderExists(routePath: string) {
  const rel = routePath.replace(/^\//, "");
  return exists(path.join(root, "seo-prerender", rel, "index.html"));
}

function prerenderHtml(routePath: string) {
  const rel = routePath.replace(/^\//, "");
  const file = path.join(root, "seo-prerender", rel, "index.html");
  if (!exists(file)) return null;
  return read(file);
}

async function main() {
  const {
    textClaimsVerification,
    classifyRuling,
    classifyLibraryBook,
    classifyFiqhMaterial,
    canIncludeInSitemap,
    mayClaimVerified,
  } = await imp<{
    textClaimsVerification: (t: string) => boolean;
    classifyRuling: (r: unknown) => string;
    classifyLibraryBook: (b: unknown) => string;
    classifyFiqhMaterial: (i: unknown) => string;
    canIncludeInSitemap: (s: string) => boolean;
    mayClaimVerified: (c: Record<string, unknown>) => boolean;
  }>("src/lib/publish-policy.ts");

  const { LIBRARY_CATALOG, libraryHasReadableSource } = await imp<{
    LIBRARY_CATALOG: Array<{ id: string; title: string; description?: string; external_url?: string }>;
    libraryHasReadableSource: (b: { external_url?: string }) => boolean;
  }>("src/lib/library-catalog.ts");

  const { SCHOLARS } = await imp<{ SCHOLARS: unknown[] }>("src/lib/scholars-data.ts");
  const { RULINGS_ENCYCLOPEDIA_SEED } = await imp<{
    RULINGS_ENCYCLOPEDIA_SEED: Array<Record<string, unknown>>;
  }>("src/lib/rulings-encyclopedia-seed.generated.ts");
  const { isPubliclyPublishedRuling, isPubliclyVisibleRuling } = await imp<{
    isPubliclyPublishedRuling: (r: unknown) => boolean;
    isPubliclyVisibleRuling: (r: unknown) => boolean;
  }>("src/lib/rulings-publication-gate.ts");

  const { FIQH_COUNCIL_PUBLISHED_SEED } = await imp<{
    FIQH_COUNCIL_PUBLISHED_SEED: Array<Record<string, unknown>>;
  }>("src/lib/fiqh-council-seed.ts");
  const { FIQH_ISSUES_PUBLISHED_SEED } = await imp<{
    FIQH_ISSUES_PUBLISHED_SEED: Array<Record<string, unknown>>;
  }>("src/lib/fiqh-issues-seed.ts");
  const { DEMO_QUIZ_QUESTIONS } = await imp<{ DEMO_QUIZ_QUESTIONS: unknown[] }>("src/lib/quiz-seed.ts");
  const { SEED_QA } = await imp<{ SEED_QA: unknown[] }>("src/lib/qa-seed.ts");
  const { ANNUAL_COURSES_SEED } = await imp<{ ANNUAL_COURSES_SEED: unknown[] }>(
    "src/lib/annual-courses-seed.ts",
  );
  const contentCounts = JSON.parse(read(path.join(root, "src/data/content-counts.json")));

  const sitemap = exists(path.join(root, "public/sitemap.xml"))
    ? read(path.join(root, "public/sitemap.xml"))
    : "";

  const sections: Record<
    string,
    { records: number; published: number; partial: number; pending_review: number; incomplete: number; blocked: number }
  > = {};

  function ensureSection(name: string) {
    if (!sections[name]) {
      sections[name] = {
        records: 0,
        published: 0,
        partial: 0,
        pending_review: 0,
        incomplete: 0,
        blocked: 0,
      };
    }
    return sections[name];
  }

  // ── أرقام تسويقية محظورة ──────────────────────────────────────────────
  const staleNums = [
    { re: /117\s*كتاب/, label: "117 كتاباً", actual: LIBRARY_CATALOG.length },
    { re: /96\s*عالم/, label: "96 عالماً", actual: SCHOLARS.length },
    { re: /108\s*فتوى/, label: "108 فتوى", actual: FIQH_COUNCIL_PUBLISHED_SEED.length },
    { re: /950\s*سؤال/, label: "950 سؤالاً", actual: DEMO_QUIZ_QUESTIONS.length },
  ];
  for (const rel of [
    "src/lib/updates-seed.ts",
    "lib/updates-ios-fallback.mjs",
    "src/pages/account/ui/HomeView.tsx",
    "src/lib/navigation.ts",
  ]) {
    const p = path.join(root, rel);
    if (!exists(p)) continue;
    const text = read(p);
    for (const m of staleNums) {
      if (m.re.test(text) && m.actual !== Number(String(text.match(m.re)?.[0]?.match(/\d+/)?.[0]))) {
        add({
          severity: "critical",
          check: "stale_home_marketing_number",
          entity_id: rel,
          detail: `${m.label} في النص بينما الفعلي=${m.actual}`,
        });
      }
    }
  }

  // content-counts drift vs home usage
  if (Number(contentCounts.books) !== LIBRARY_CATALOG.length) {
    add({
      severity: "critical",
      check: "content_counts_books_drift",
      entity_id: "books",
      detail: `counts=${contentCounts.books} ≠ catalog=${LIBRARY_CATALOG.length}`,
    });
  }
  if (Number(contentCounts.scholars) !== SCHOLARS.length) {
    add({
      severity: "critical",
      check: "content_counts_scholars_drift",
      entity_id: "scholars",
      detail: `counts=${contentCounts.scholars} ≠ scholars=${SCHOLARS.length}`,
    });
  }

  // ── hub routes must resolve ───────────────────────────────────────────
  const hubRoutes = [
    "/",
    "/lessons",
    "/quran-hub",
    "/quran/surah-stories",
    "/adhkar",
    "/duas",
    "/hadith",
    "/library",
    "/scholars",
    "/prophets",
    "/fiqh",
    "/rulings",
    "/fiqh-council",
    "/fiqh-council/issues",
    "/quiz",
    "/fawaid",
    "/topics",
    "/sins-and-rights",
    "/islamic-glossary",
    "/knowledge-graph",
    "/search",
  ];
  for (const route of hubRoutes) {
    const html = prerenderHtml(route === "/" ? "" : route);
    if (!html && route !== "/search") {
      // search may be SPA-only
      if (!prerenderExists(route) && route !== "/") {
        add({
          severity: "high",
          check: "hub_missing_prerender",
          entity_id: route,
          detail: "مسار hub بلا prerender — تحقق من generate:seo",
        });
      }
    }
    if (html) {
      if (/Cache miss|Application error|Cannot GET/i.test(html)) {
        add({
          severity: "critical",
          check: "hub_cache_miss",
          entity_id: route,
          detail: "prerender يحتوي خطأ Cache miss/Application error",
        });
      }
      if (textClaimsVerification(html) && /قيد الإكمال|قيد المراجعة|للتعلّم والاطلاع/.test(html) === false) {
        // hub claiming verification without softening
        if (/موثقة بالأدلة|جميع العلاقات.*موثقة|مكتبة علمية شاملة للأحكام، موثقة/.test(html)) {
          add({
            severity: "critical",
            check: "hub_verification_overclaim",
            entity_id: route,
            detail: "hub يدّعي توثيقًا بلا تنبيه قيد الإكمال/المراجعة",
          });
        }
      }
    }
  }

  // /qa must redirect in App (no standalone false page)
  const app = read(path.join(root, "src/App.tsx"));
  if (!app.includes('path="/qa"><Redirect to="/quiz"')) {
    add({
      severity: "critical",
      check: "qa_missing_redirect",
      entity_id: "/qa",
      detail: "/qa يجب أن يحوّل إلى /quiz",
    });
  }
  if (sitemap.includes("/qa<") || /loc>[^<]*\/qa</.test(sitemap)) {
    add({
      severity: "critical",
      check: "qa_in_sitemap",
      entity_id: "/qa",
      detail: "/qa لا يجوز في sitemap كمسار مستقل",
    });
  }

  // quiz empty must not claim موثقة
  const quizPage = read(path.join(root, "src/pages/account/QuizPage.tsx"));
  if ((DEMO_QUIZ_QUESTIONS.length === 0 || SEED_QA.length === 0) && /موثقة بالأدلة/.test(quizPage)) {
    add({
      severity: "critical",
      check: "empty_qa_verification_claim",
      entity_id: "/quiz",
      detail: "صفحة أسئلة فارغة تدّعي موثقة بالأدلة",
    });
  }

  // ── rulings ───────────────────────────────────────────────────────────
  const secR = ensureSection("rulings");
  for (const r of RULINGS_ENCYCLOPEDIA_SEED) {
    secR.records += 1;
    const st = classifyRuling(r);
    if (st in secR) (secR as Record<string, number>)[st] += 1;
    const id = String(r.external_key || r.id || "");
    if (st === "blocked" && sitemap.includes(`/rulings/${id}`)) {
      add({
        severity: "critical",
        check: "blocked_ruling_in_sitemap",
        entity_id: id,
        detail: "حكم blocked داخل sitemap",
      });
    }
    if (st === "pending_review") {
      const html = prerenderHtml(`/rulings/${id}`);
      if (html) {
        if (/reviewStatus":\s*"reviewed"|\"reviewStatus\":\"reviewed\"/i.test(html)) {
          add({
            severity: "critical",
            check: "pending_marked_reviewed",
            entity_id: id,
            detail: "pending_review مع structured data reviewed",
          });
        }
        if (/مادة معتمدة|حكم معتمد نهائي|موثقة بالأدلة/.test(html) && !/قيد المراجعة/.test(html)) {
          add({
            severity: "critical",
            check: "pending_presented_as_approved",
            entity_id: id,
            detail: "pending_review يُعرض كمعتمد بلا تنبيه",
          });
        }
      }
    }
  }
  // child-custody specific
  const custody = prerenderHtml("/rulings/ruling-child-custody");
  if (custody) {
    if (!/قيد المراجعة/.test(custody)) {
      add({
        severity: "critical",
        check: "custody_missing_review_notice",
        entity_id: "ruling-child-custody",
        detail: "صفحة الحضانة بلا تنبيه مراجعة شرعية في prerender",
      });
    }
    if (/reviewStatus.: .reviewed|معتمد نهائي/.test(custody)) {
      add({
        severity: "critical",
        check: "custody_claims_final",
        entity_id: "ruling-child-custody",
        detail: "صفحة الحضانة تدّعي اعتمادًا نهائيًا",
      });
    }
  }

  // ── library ───────────────────────────────────────────────────────────
  const secL = ensureSection("library");
  for (const b of LIBRARY_CATALOG) {
    secL.records += 1;
    const st = classifyLibraryBook(b);
    if (st in secL) (secL as Record<string, number>)[st] += 1;
    if (st !== "published" && !libraryHasReadableSource(b)) {
      const html = prerenderHtml(`/library/${b.id}`);
      if (html && textClaimsVerification(html.match(/name="description" content="([^"]*)"/)?.[1] || "")) {
        const desc = html.match(/name="description" content="([^"]*)"/)?.[1] || "";
        if (!/قيد الإ/.test(desc) && mayClaimVerified({ external_url: b.external_url }) === false) {
          if (/موثقة بالأدلة|مادة معتمدة/.test(desc)) {
            add({
              severity: "critical",
              check: "sourceless_book_claim",
              entity_id: b.id,
              detail: "كتاب بلا مصدر يدّعي توثيقًا في الميتا",
            });
          }
        }
      }
    }
  }

  // ── fiqh council items ────────────────────────────────────────────────
  const secF = ensureSection("fiqh-council");
  for (const item of FIQH_COUNCIL_PUBLISHED_SEED) {
    secF.records += 1;
    const st = classifyFiqhMaterial(item);
    if (st in secF) (secF as Record<string, number>)[st] += 1;
    const slug = String(item.slug || item.id);
    const hasSource = Boolean(String(item.source_url || item.source_name || "").trim());
    const claimText = `${item.title || ""} ${item.summary || ""}`;
    if (!hasSource && textClaimsVerification(claimText)) {
      add({
        severity: "critical",
        check: "fiqh_claim_without_source",
        entity_id: slug,
        detail: "مادة مجمع تدّعي توثيقًا بلا مصدر",
      });
    }
    if (st === "partial" || st === "incomplete") {
      const pageSrc = read(path.join(root, "src/views/FiqhCouncilItemDetailPage.tsx"));
      if (!/PublishStatusBanner/.test(pageSrc)) {
        add({
          severity: "critical",
          check: "fiqh_missing_status_banner",
          entity_id: "FiqhCouncilItemDetailPage",
          detail: "صفحة التفصيل بلا PublishStatusBanner",
        });
      }
    }
  }

  // specific items must not overclaim
  for (const slug of ["items-encrypted-digital-currencies", "items-smart-contracts"]) {
    const item = FIQH_COUNCIL_PUBLISHED_SEED.find((i) => i.slug === slug);
    if (!item) {
      add({
        severity: "high",
        check: "fiqh_item_missing",
        entity_id: slug,
        detail: "السجل غير موجود في البذرة",
      });
      continue;
    }
    const st = classifyFiqhMaterial(item);
    if (st === "published" && /لم يصدر حكم قاطع|تأجيل البت/.test(String(item.ruling_text || item.content || ""))) {
      add({
        severity: "critical",
        check: "fiqh_deferred_as_published",
        entity_id: slug,
        detail: "مادة مؤجَّلة الحكم صُنّفت published بدل partial",
      });
    }
  }

  // issues
  const secI = ensureSection("fiqh-council-issues");
  for (const issue of FIQH_ISSUES_PUBLISHED_SEED) {
    secI.records += 1;
    const st = classifyFiqhMaterial(issue);
    if (st in secI) (secI as Record<string, number>)[st] += 1;
  }

  // scholars / courses / quiz
  ensureSection("scholars").records = SCHOLARS.length;
  ensureSection("scholars").published = SCHOLARS.length;
  ensureSection("courses").records = ANNUAL_COURSES_SEED.length;
  ensureSection("courses").published = ANNUAL_COURSES_SEED.length;
  ensureSection("quiz").records = DEMO_QUIZ_QUESTIONS.length;
  if (DEMO_QUIZ_QUESTIONS.length === 0) ensureSection("quiz").incomplete = 1;
  ensureSection("qa").records = SEED_QA.length;
  if (SEED_QA.length === 0) ensureSection("qa").partial = 1;

  // copy guards in critical SPA files
  const copyFiles = [
    "src/pages/fiqh/ui/RulingsView.tsx",
    "src/pages/account/QuizPage.tsx",
    "src/views/KnowledgeGraphPage.tsx",
    "src/views/FiqhCouncilIssuesPage.tsx",
  ];
  for (const rel of copyFiles) {
    const text = read(path.join(root, rel));
    if (/موثقة بالأدلة|جميع العلاقات المعروضة موثقة/.test(text)) {
      add({
        severity: "critical",
        check: "spa_verification_overclaim",
        entity_id: rel,
        detail: "واجهة SPA ما زالت تدّعي توثيقًا مضللاً",
      });
    }
    if (/محتوى معتمد في منهج/.test(text)) {
      add({
        severity: "critical",
        check: "spa_approved_content_claim",
        entity_id: rel,
        detail: "ما زال «محتوى معتمد في منهج» في الواجهة",
      });
    }
  }

  // blocked policy sanity
  if (canIncludeInSitemap("blocked")) {
    add({
      severity: "critical",
      check: "policy_blocked_in_sitemap",
      entity_id: "publish-policy",
      detail: "canIncludeInSitemap(blocked) يجب أن يكون false",
    });
  }

  const summary = {
    total: findings.length,
    critical: findings.filter((f) => f.severity === "critical").length,
    high: findings.filter((f) => f.severity === "high").length,
    medium: findings.filter((f) => f.severity === "medium").length,
    info: findings.filter((f) => f.severity === "info").length,
  };

  const counts = {
    books: LIBRARY_CATALOG.length,
    booksWithSource: LIBRARY_CATALOG.filter((b) => libraryHasReadableSource(b)).length,
    scholars: SCHOLARS.length,
    rulingsTotal: RULINGS_ENCYCLOPEDIA_SEED.length,
    rulingsApproved: RULINGS_ENCYCLOPEDIA_SEED.filter((r) => isPubliclyPublishedRuling(r)).length,
    rulingsVisible: RULINGS_ENCYCLOPEDIA_SEED.filter((r) => isPubliclyVisibleRuling(r)).length,
    fiqhItems: FIQH_COUNCIL_PUBLISHED_SEED.length,
    fiqhIssues: FIQH_ISSUES_PUBLISHED_SEED.length,
    courses: ANNUAL_COURSES_SEED.length,
    quiz: DEMO_QUIZ_QUESTIONS.length,
    qa: SEED_QA.length,
    contentCounts,
  };

  const publishable = summary.critical === 0;

  fs.mkdirSync(reportsDir, { recursive: true });
  fs.writeFileSync(
    path.join(reportsDir, "final-publication-data-audit.json"),
    JSON.stringify({ at: new Date().toISOString(), publishable, summary, counts, sections, findings }, null, 2),
    "utf8",
  );

  console.log("Final publication data audit");
  console.log(JSON.stringify({ publishable, summary, counts: {
    books: counts.books,
    scholars: counts.scholars,
    rulingsVisible: counts.rulingsVisible,
    courses: counts.courses,
    quiz: counts.quiz,
  } }, null, 2));
  for (const f of findings.filter((x) => x.severity === "critical" || x.severity === "high").slice(0, 40)) {
    console.log(`  - [${f.severity}] ${f.check}: ${f.entity_id} — ${f.detail}`);
  }
  if (summary.critical > 0) process.exitCode = 1;
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
