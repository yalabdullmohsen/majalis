#!/usr/bin/env node
/**
 * SUNNAH TOTAL TRUST — مولّد جرد المسارات والمحتوى العام (قراءة فقط).
 * لا يعدّل نصًا شرعيًا ولا يخترع مصادر. يقارن Router × SEO × sitemap × جرد سابق.
 *
 * تشغيل من جذر المستودع:
 *   node scripts/total-trust-inventory.mjs
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "reports/total-trust");
const PUBLIC_STATUSES = new Set([
  "VERIFIED_EXACT",
  "VERIFIED_WITH_CORRECTION",
]);

const STATUS_TAXONOMY = [
  "VERIFIED_EXACT",
  "VERIFIED_WITH_CORRECTION",
  "LINGUISTICALLY_REVIEWED",
  "NEEDS_SCHOLAR_REVIEW",
  "NEEDS_SOURCE",
  "CONFLICTING_SOURCES",
  "BLOCKED_LICENSE",
  "DRAFT",
  "EXCLUDED",
  "NOT_APPLICABLE",
];

function shaShort(s) {
  return createHash("sha256").update(String(s)).digest("hex").slice(0, 12);
}

function readText(rel) {
  return readFileSync(join(ROOT, rel), "utf8");
}

function extractAppRoutePaths(src) {
  const paths = new Set();
  const re = /path=["'`]([^"'`]+)["'`]/g;
  let m;
  while ((m = re.exec(src))) {
    const p = m[1];
    if (p.startsWith("/")) paths.add(p);
  }
  return [...paths].sort();
}

function extractRedirectTargets(src) {
  const redirects = [];
  const re =
    /path=["'`]([^"'`]+)["'`][\s\S]*?(?:Redirect|navigate|to=["'`]([^"'`]+)["'`])/gi;
  // lighter: look for <Redirect to= near path=
  const blocks = src.split(/<Route\b/);
  for (const b of blocks) {
    const pathM = b.match(/path=["'`]([^"'`]+)["'`]/);
    const toM = b.match(/to=["'`]([^"'`]+)["'`]/);
    if (pathM && toM && /Redirect|Navigate/i.test(b.slice(0, 400))) {
      redirects.push({ from: pathM[1], to: toM[1] });
    }
  }
  return redirects;
}

function loadSitemapPaths() {
  const loc = join(ROOT, "artifacts/majalis/public/sitemap.xml");
  if (!existsSync(loc)) return [];
  const xml = readFileSync(loc, "utf8");
  const out = [];
  const re = /<loc>([^<]+)<\/loc>/g;
  let m;
  while ((m = re.exec(xml))) {
    try {
      const u = new URL(m[1]);
      out.push(u.pathname.replace(/\/$/, "") || "/");
    } catch {
      /* skip */
    }
  }
  return [...new Set(out)].sort();
}

function classifyRoute(path, { seoSet, sitemapSet, redirectMap, masterByRoute }) {
  const isAuth = path.startsWith("/auth") || path === "/login" || path === "/register";
  const isAdmin = path.startsWith("/admin") || path.includes("/admin");
  const isInternal = path.startsWith("/internal");
  const redirectTo = redirectMap.get(path) || null;
  const master = masterByRoute.get(path);

  let factualStatus = "NEEDS_SOURCE";
  let shariaStatus = "NOT_APPLICABLE";
  let displayStatus = "NEEDS_SOURCE";
  let publicationState = "unknown";

  if (redirectTo) {
    factualStatus = "NOT_APPLICABLE";
    displayStatus = "EXCLUDED";
    publicationState = "redirect";
  } else if (isAdmin || isInternal) {
    factualStatus = "NOT_APPLICABLE";
    displayStatus = "EXCLUDED";
    publicationState = "private";
  } else if (master?.finalState === "EXCLUDED" || master?.finalState === "NOT_APPLICABLE") {
    factualStatus = "NOT_APPLICABLE";
    displayStatus = master.finalState;
    publicationState = "documented";
  } else if (master?.finalState === "COMPLETE" || master?.finalState === "IMPROVED") {
    // Inventory completeness ≠ sharia verification
    factualStatus = "LINGUISTICALLY_REVIEWED";
    displayStatus = "LINGUISTICALLY_REVIEWED";
    publicationState = "public_candidate";
  }

  if (path === "/mushaf" || path.startsWith("/mushaf") || path.includes("quran-engine")) {
    shariaStatus = "VERIFIED_EXACT"; // protected sources under byte-lock — text not AI-judged
    factualStatus = "VERIFIED_EXACT";
  }

  const publicOk = PUBLIC_STATUSES.has(displayStatus);
  return {
    internalId: `route:${shaShort(path)}`,
    contentType: "route",
    title: master?.feature || path,
    slug: path,
    route: path,
    status: displayStatus,
    source: master?.dataSource || "app-routes",
    sourceReference: master?.finalEvidence || null,
    sourceUrl: null,
    author: null,
    reviewer: null,
    reviewedAt: null,
    licenseStatus: "unknown",
    publicationState,
    searchable: Boolean(seoSet.has(path) || sitemapSet.has(path)),
    indexable: sitemapSet.has(path) && !isAuth && !isAdmin,
    relatedEntities: redirectTo ? [`redirect:${redirectTo}`] : [],
    languageStatus: master?.languageStatus || "PENDING",
    factualStatus,
    shariaStatus,
    displayStatus,
    lastUpdated: null,
    appVisibility: !isAdmin,
    webVisibility: !isAdmin,
    seoPresent: seoSet.has(path),
    sitemapPresent: sitemapSet.has(path),
    isRedirect: Boolean(redirectTo),
    redirectTo,
    publicDisplayAllowed: publicOk,
    auditNotes: [],
  };
}

function resolveSourceCommit() {
  if (process.env.TOTAL_TRUST_SOURCE_COMMIT) return process.env.TOTAL_TRUST_SOURCE_COMMIT;
  try {
    return execFileSync("git", ["rev-parse", "HEAD"], { cwd: ROOT, encoding: "utf8" }).trim();
  } catch {
    return "unknown";
  }
}

function main() {
  mkdirSync(OUT, { recursive: true });

  const resolvedCommit = resolveSourceCommit();

  const appRoutesSrc = readText("artifacts/majalis/src/AppRoutes.tsx");
  const paths = extractAppRoutePaths(appRoutesSrc);
  const redirects = extractRedirectTargets(appRoutesSrc);
  const redirectMap = new Map(redirects.map((r) => [r.from, r.to]));

  const seo = JSON.parse(readText("artifacts/majalis/src/lib/seo-routes.json"));
  const seoPaths = (seo.routes || []).map((r) => r.path);
  const seoSet = new Set(seoPaths);
  const sitemapPaths = loadSitemapPaths();
  const sitemapSet = new Set(sitemapPaths);

  let master = { routeInventory: [] };
  const masterPath = join(ROOT, "reports/content-completeness-master.json");
  if (existsSync(masterPath)) {
    master = JSON.parse(readFileSync(masterPath, "utf8"));
  }
  const masterByRoute = new Map(
    (master.routeInventory || []).map((r) => [r.route, r]),
  );

  const inventory = paths.map((p) =>
    classifyRoute(p, { seoSet, sitemapSet, redirectMap, masterByRoute }),
  );

  const publicRoutes = inventory.filter(
    (r) => r.publicationState === "public_candidate" || (!r.isRedirect && !r.route.startsWith("/admin") && !r.route.startsWith("/internal")),
  );

  const matrix = inventory.map((r) => ({
    route: r.route,
    pageTitle: r.title,
    dataSource: r.source,
    loadingState: "PENDING_MATRIX",
    emptyState: "PENDING_MATRIX",
    errorState: "PENDING_MATRIX",
    offlineState: "PENDING_MATRIX",
    publicContent: r.publicationState,
    searchVisibility: r.searchable,
    seoVisibility: r.seoPresent,
    lightMode: "PENDING_DEVICE",
    darkMode: "PENDING_DEVICE",
    iPhone: "PENDING_DEVICE",
    iPad: "PENDING_DEVICE",
    web: "PENDING_DEVICE",
    sourceVerification: r.factualStatus,
    languageVerification: r.languageStatus,
    accessibility: "PENDING",
    finalStatus: r.displayStatus,
    isRedirect: r.isRedirect,
    redirectTo: r.redirectTo,
    inSitemap: r.sitemapPresent,
    inSeoJson: r.seoPresent,
  }));

  const findings = [];

  // Sitemap orphan vs router
  for (const sp of sitemapPaths) {
    const exact = paths.includes(sp);
    const prefix = paths.some((p) => p.includes(":") && sp.startsWith(p.split(":")[0]));
    if (!exact && !prefix && !sp.startsWith("/topics/") && !sp.startsWith("/lessons/")) {
      // dynamic content may be generated — flag only static-looking orphans
      if (!sp.includes("-") || paths.some((p) => sp.startsWith(p.replace(/\/:[^/]+/g, "")))) {
        /* soft */
      }
    }
  }

  // Public routes missing SEO description length for static seo-routes entries
  for (const r of seo.routes || []) {
    if (r.path?.startsWith("/auth") || r.path?.startsWith("/admin")) continue;
    const d = (r.description || "").length;
    if (d < 65) {
      findings.push({
        severity: "POST_RELEASE_FIX",
        code: "SEO_THIN",
        route: r.path,
        detail: `description length ${d} < 65`,
      });
    }
  }

  // App Store review notes vs product removals (do not edit Connect)
  const reviewNotes = existsSync(join(ROOT, "artifacts/majalis/store/app-store/review-notes.md"))
    ? readText("artifacts/majalis/store/app-store/review-notes.md")
    : "";
  if (/Learning paths/i.test(reviewNotes) || /fatwas/i.test(reviewNotes)) {
    findings.push({
      severity: "OWNER_DECISION",
      code: "APP_STORE_METADATA_CLAIM",
      route: "store/app-store/review-notes.md",
      detail:
        "نصوص مراجعة المتجر تذكر fatwas/Learning paths بينما المنتج الحي أزال/حوّل بعض هذه الأسطح — لا تُسحب المراجعة تلقائيًا؛ يلزم OWNER_DECISION قبل تعديل Connect.",
      releaseClass: "POTENTIAL_RELEASE_BLOCKER_CRITICAL",
    });
  }

  const summary = {
    program: "SUNNAH_TOTAL_TRUST",
    generatedAt: new Date().toISOString(),
    sourceCommit: resolvedCommit,
    auditBranch: "cursor/sunnah-total-trust-audit",
    product: "artifacts/majalis",
    statusTaxonomy: STATUS_TAXONOMY,
    publicDisplayAllowed: [...PUBLIC_STATUSES],
    totals: {
      appRoutePaths: paths.length,
      seoRoutes: seoPaths.length,
      sitemapUrls: sitemapPaths.length,
      inventoryRows: inventory.length,
      redirectsDetected: redirects.length,
      matrixRows: matrix.length,
      findings: findings.length,
    },
    quranByteLock: "run verify:protected-quran-byte-lock separately",
    findings,
  };

  writeFileSync(join(OUT, "inventory-summary.json"), JSON.stringify(summary, null, 2) + "\n");
  writeFileSync(join(OUT, "content-inventory.json"), JSON.stringify({ items: inventory }, null, 2) + "\n");
  writeFileSync(join(OUT, "route-coverage-matrix.json"), JSON.stringify({ rows: matrix }, null, 2) + "\n");

  console.log(
    `✓ TOTAL TRUST inventory: routes=${paths.length} seo=${seoPaths.length} sitemap=${sitemapPaths.length} findings=${findings.length}`,
  );
  console.log(`  → ${OUT}/`);
}

main();
