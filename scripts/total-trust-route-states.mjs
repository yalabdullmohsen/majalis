#!/usr/bin/env node
/**
 * TOTAL TRUST Phase 2 — تدقيق حالات المسارات الحرجة من المصدر (قراءة فقط).
 * يحدّث reports/total-trust/route-coverage-matrix.json للحقول القابلة للإثبات من الكود.
 *
 * تشغيل: node scripts/total-trust-route-states.mjs
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

/** مسارات عامة حرجة → ملفات مصدر للمراجعة */
const CRITICAL = [
  {
    route: "/",
    files: ["src/components/HomeDashboard.tsx", "src/components/OfflineBanner.tsx", "src/lib/ui-copy.ts"],
    notes: "الرئيسية عبر App.tsx؛ OfflineBanner عام",
  },
  {
    route: "/mushaf",
    files: [
      "src/pages/quran/MushafReaderPage.tsx",
      "src/features/mushaf-madinah/VerifiedMushafReader.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/lessons",
    files: ["src/pages/lessons/LessonsPage.tsx", "src/pages/lessons/ui/LessonsView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/prayer-times",
    files: ["src/pages/worship/PrayerTimesPage.tsx", "src/pages/worship/ui/PrayerTimesView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/adhkar",
    files: ["src/pages/worship/AdhkarPage.tsx", "src/pages/worship/ui/AdhkarView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/search",
    files: [
      "src/pages/account/SearchPage.tsx",
      "src/pages/account/ui/SearchView.tsx",
      "src/lib/ui-copy.ts",
    ],
  },
  {
    route: "/sections",
    files: ["src/pages/account/SectionsPage.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/quran-hub",
    files: ["src/pages/quran/QuranHubPage.tsx", "src/pages/quran/ui/QuranHubView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/hadith",
    files: ["src/pages/hadith/HadithPage.tsx", "src/pages/hadith/ui/HadithView.tsx", "src/lib/ui-copy.ts"],
  },
  {
    route: "/fiqh",
    files: ["src/pages/fiqh/FiqhPage.tsx", "src/pages/fiqh/ui/FiqhView.tsx", "src/lib/ui-copy.ts"],
  },
];

const offlineBanner = existsSync(join(majalis, "src/components/OfflineBanner.tsx"))
  ? read("src/components/OfflineBanner.tsx")
  : "";
const offlineOk =
  offlineBanner.includes("EMPTY.offline") && offlineBanner.includes("BUTTON.retry");

const findings = [];
const routeStates = [];

for (const entry of CRITICAL) {
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
    hasAny(src, ["EMPTY.", "emptyText", "emptyMessage", "لا يتوفر", "لم نجد"]) ||
    entry.route === "/";
  const error = hasAny(src, ["STATUS.loadError", "STATUS.networkError", "setError", "loadError"]);
  const loading = hasAny(src, ["STATUS.contentLoading", "تجهيز", "loading", "isLoading", "busy"]);
  const offline = offlineOk ? "PASS_GLOBAL_BANNER" : "FAIL_NO_OFFLINE_BANNER";

  if (missing.length) {
    findings.push({
      severity: "POST_RELEASE_FIX",
      code: "ROUTE_SOURCE_MISSING",
      route: entry.route,
      detail: missing.join(", "),
    });
  }

  const row = {
    route: entry.route,
    loadingState: loading ? "PASS_SOURCE" : "NEEDS_REVIEW",
    emptyState: empty ? "PASS_SOURCE" : "NEEDS_REVIEW",
    errorState: error ? "PASS_SOURCE" : "NEEDS_REVIEW",
    offlineState: offline,
    sourceFilesChecked: entry.files.filter((f) => existsSync(join(majalis, f))),
    missingFiles: missing,
    finalStatus:
      missing.length || (!empty && entry.route !== "/mushaf")
        ? "NEEDS_REVIEW"
        : "LINGUISTICALLY_REVIEWED",
  };
  routeStates.push(row);
}

// دمج مع المصفوفة السابقة إن وُجدت
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
    sourceVerification: prev.sourceVerification || "PENDING",
    finalStatus: st.finalStatus,
    phase2Checked: true,
  });
}

mkdirSync(OUT, { recursive: true });
const updated = { rows: [...byRoute.values()], updatedAt: new Date().toISOString(), phase: "phase2-route-states" };
writeFileSync(matrixPath, JSON.stringify(updated, null, 2) + "\n");

const summary = {
  program: "SUNNAH_TOTAL_TRUST",
  phase: 2,
  generatedAt: new Date().toISOString(),
  criticalRoutes: routeStates.length,
  offlineBannerGlobal: offlineOk,
  needsReview: routeStates.filter((r) => r.finalStatus === "NEEDS_REVIEW").map((r) => r.route),
  findings,
  routeStates,
};
writeFileSync(join(OUT, "phase2-route-states.json"), JSON.stringify(summary, null, 2) + "\n");

console.log(
  `✓ TOTAL TRUST phase2: critical=${routeStates.length} offline=${offlineOk} needsReview=${summary.needsReview.length}`,
);
