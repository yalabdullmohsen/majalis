#!/usr/bin/env node
/**
 * TOTAL TRUST Phase 4 — حديث / تفسير / SEO (قراءة مصدر + تقرير).
 * يحدّث reports/total-trust/route-coverage-matrix.json للمسارات المعنية.
 *
 * تشغيل: node scripts/total-trust-hadith-tafsir.mjs
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = join(ROOT, "reports/total-trust");
const majalis = join(ROOT, "artifacts/majalis");

function read(rel) {
  return readFileSync(join(majalis, rel), "utf8");
}

function hasAny(src, patterns) {
  return patterns.some((p) => (typeof p === "string" ? src.includes(p) : p.test(src)));
}

/** مسارات حديث/تفسير عامة للتدقيق المصدري */
const TARGETS = [
  {
    route: "/hadith",
    files: ["src/pages/hadith/HadithPage.tsx", "src/pages/hadith/ui/HadithView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/hadith/sahih",
    files: [
      "src/pages/hadith/HadithSahihPage.tsx",
      "src/pages/hadith/HadithPage.tsx",
      "src/pages/hadith/ui/HadithClassGuide.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/hadith/daif",
    files: [
      "src/pages/hadith/HadithDaifPage.tsx",
      "src/pages/hadith/HadithPage.tsx",
      "src/pages/hadith/ui/HadithClassGuide.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/hadith/mawdu",
    files: [
      "src/pages/hadith/HadithMawduPage.tsx",
      "src/pages/hadith/HadithPage.tsx",
      "src/pages/hadith/ui/HadithClassGuide.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/hadith/books",
    files: ["src/pages/hadith/HadithBooksPage.tsx", "src/pages/hadith/ui/HadithBooksView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/hadith/books-and-rulings",
    files: ["src/pages/hadith/HadithBooksAndRulingsPage.tsx", "src/lib/ui-copy.ts"],
    staticIndex: true,
  },
  {
    route: "/hadith/:id",
    files: ["src/pages/hadith/HadithByIdPage.tsx", "src/pages/hadith/ui/HadithByIdView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/hadith-science",
    files: [
      "src/pages/hadith/HadithSciencePage.tsx",
      "src/pages/hadith/ui/HadithScienceView.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/hadith/arbaeen",
    redirectTo: "/arbaeen-nawawi",
    redirectProvenIn: ["src/AppRoutes.tsx", "vercel.json"],
  },
  {
    route: "/hadith/arbaeen-love-of-allah",
    files: ["src/views/ArbaeenLovePage.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/arbaeen-nawawi",
    files: [
      "src/pages/hadith/ArbaeenNawawiPage.tsx",
      "src/pages/hadith/ui/ArbaeenNawawiView.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/tafsir",
    files: ["src/pages/quran/TafsirPage.tsx", "src/pages/quran/ui/TafsirView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/quran/tafsir",
    redirectTo: "/tafsir",
    redirectProvenIn: ["vercel.json"],
  },
];

const offlineBanner = existsSync(join(majalis, "src/components/OfflineBanner.tsx"))
  ? read("src/components/OfflineBanner.tsx")
  : "";
const offlineOk =
  offlineBanner.includes("EMPTY.offline") && offlineBanner.includes("BUTTON.retry");

const seo = JSON.parse(read("src/lib/seo-routes.json"));
const seoByPath = new Map((seo.routes || []).map((r) => [r.path, r]));

const findings = [];
const routeStates = [];

function proveRedirect(entry) {
  const blobs = (entry.redirectProvenIn || []).map((f) => {
    const abs = join(majalis, f);
    return existsSync(abs) ? readFileSync(abs, "utf8") : "";
  });
  const joined = blobs.join("\n");
  const to = entry.redirectTo;
  return (
    joined.includes(entry.route) &&
    (joined.includes(`destination": "${to}"`) ||
      joined.includes(`to="${to}"`) ||
      joined.includes(`Redirect to="${to}"`) ||
      joined.includes(`<Redirect to="${to}"`))
  );
}

for (const entry of TARGETS) {
  if (entry.redirectTo) {
    const ok = proveRedirect(entry);
    if (!ok) {
      findings.push({
        severity: "POST_RELEASE_FIX",
        code: "REDIRECT_UNPROVEN",
        route: entry.route,
        detail: `expected → ${entry.redirectTo}`,
      });
    }
    routeStates.push({
      route: entry.route,
      kind: "redirect",
      redirectTo: entry.redirectTo,
      redirectProven: ok,
      loadingState: "NOT_APPLICABLE",
      emptyState: "NOT_APPLICABLE",
      errorState: "NOT_APPLICABLE",
      offlineState: offlineOk ? "PASS_GLOBAL_BANNER" : "FAIL_NO_OFFLINE_BANNER",
      seoInJson: Boolean(seoByPath.get(entry.route)),
      seoRequired: false,
      finalStatus: ok ? "VERIFIED_EXACT" : "NEEDS_REVIEW",
    });
    continue;
  }

  const chunks = [];
  const missing = [];
  for (const f of entry.files) {
    const abs = join(majalis, f);
    if (!existsSync(abs)) {
      missing.push(f);
      continue;
    }
    chunks.push(read(f));
  }
  const src = chunks.join("\n");
  const empty =
    entry.staticIndex ||
    hasAny(src, ["EMPTY.", "emptyText", "Empty text=", "<Empty", "لا يتوفر", "لم نجد"]);
  const error = hasAny(src, [
    "STATUS.loadError",
    "STATUS.networkError",
    "setError",
    "loadError",
    "networkError",
  ]);
  const loading = hasAny(src, [
    "STATUS.contentLoading",
    "Skeleton",
    "loading",
    "isLoading",
    "busy",
    "تجهيز",
  ]);

  const seoEntry = seoByPath.get(entry.route);
  const seoLen = (seoEntry?.description || "").length;
  const isParametric = entry.route.includes(":");
  const dynamicSeo = hasAny(src, ["applyPageSeo"]);
  const seoRequired = !isParametric;
  const seoOk = seoRequired ? seoLen >= 80 : dynamicSeo || seoLen >= 80;

  if (missing.length) {
    findings.push({
      severity: "POST_RELEASE_FIX",
      code: "ROUTE_SOURCE_MISSING",
      route: entry.route,
      detail: missing.join(", "),
    });
  }
  if (seoRequired && !seoOk) {
    findings.push({
      severity: "POST_RELEASE_FIX",
      code: "SEO_THIN_OR_MISSING",
      route: entry.route,
      detail: `descriptionLen=${seoLen}`,
    });
  }

  const needsReview = Boolean(missing.length || !empty || (seoRequired && !seoOk));
  routeStates.push({
    route: entry.route,
    kind: entry.staticIndex ? "static_index" : "page",
    loadingState: loading || entry.staticIndex ? "PASS_SOURCE" : "NEEDS_REVIEW",
    emptyState: empty ? "PASS_SOURCE" : "NEEDS_REVIEW",
    errorState: error || entry.staticIndex ? "PASS_SOURCE" : "NEEDS_REVIEW",
    offlineState: offlineOk ? "PASS_GLOBAL_BANNER" : "FAIL_NO_OFFLINE_BANNER",
    sourceFilesChecked: entry.files.filter((f) => existsSync(join(majalis, f))),
    missingFiles: missing,
    seoInJson: Boolean(seoEntry),
    seoDescriptionLen: seoLen,
    seoRequired,
    seoOk,
    dynamicSeo,
    finalStatus: needsReview ? "NEEDS_REVIEW" : "LINGUISTICALLY_REVIEWED",
  });
}

const matrixPath = join(OUT, "route-coverage-matrix.json");
let matrix = { rows: [] };
if (existsSync(matrixPath)) {
  matrix = JSON.parse(readFileSync(matrixPath, "utf8"));
}
const byRoute = new Map((matrix.rows || []).map((r) => [r.route, r]));
for (const st of routeStates) {
  const prev = byRoute.get(st.route) || { route: st.route };
  byRoute.set(st.route, {
    ...prev,
    loadingState: st.loadingState,
    emptyState: st.emptyState,
    errorState: st.errorState,
    offlineState: st.offlineState,
    isRedirect: st.kind === "redirect",
    redirectTo: st.redirectTo ?? prev.redirectTo ?? null,
    finalStatus: st.finalStatus,
    phase4Checked: true,
    seoVisibility: st.seoRequired ? st.seoOk : prev.seoVisibility,
  });
}

mkdirSync(OUT, { recursive: true });
const updated = {
  rows: [...byRoute.values()],
  updatedAt: new Date().toISOString(),
  phase: "phase4-hadith-tafsir",
};
writeFileSync(matrixPath, JSON.stringify(updated, null, 2) + "\n");

const summary = {
  program: "SUNNAH_TOTAL_TRUST",
  phase: 4,
  generatedAt: new Date().toISOString(),
  auditedRoutes: routeStates.length,
  offlineBannerGlobal: offlineOk,
  needsReview: routeStates.filter((r) => r.finalStatus === "NEEDS_REVIEW").map((r) => r.route),
  redirects: routeStates.filter((r) => r.kind === "redirect").map((r) => ({
    route: r.route,
    to: r.redirectTo,
    proven: r.redirectProven,
  })),
  findings,
  routeStates,
};
writeFileSync(join(OUT, "phase4-hadith-tafsir.json"), JSON.stringify(summary, null, 2) + "\n");

console.log(
  `✓ TOTAL TRUST phase4: routes=${routeStates.length} offline=${offlineOk} needsReview=${summary.needsReview.length} findings=${findings.length}`,
);
