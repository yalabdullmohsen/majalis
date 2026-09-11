#!/usr/bin/env node
/**
 * بوابة تدقيق ما قبل الإطلاق — أرقام قابلة للإعادة دون اختراع محتوى.
 * node scripts/audit-prelaunch-readiness.mjs
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = resolve(root, "../..");
const blockers = [];
const warnings = [];
const metrics = {};

function readJson(rel) {
  return JSON.parse(readFileSync(join(root, rel), "utf8"));
}

function pushBlocker(section, reason, fix) {
  blockers.push({ severity: "Blocker", section, reason, fix });
}
function pushCritical(section, reason, fix) {
  blockers.push({ severity: "Critical", section, reason, fix });
}
function pushWarn(section, reason) {
  warnings.push({ section, reason });
}

// content counts
const counts = readJson("src/data/content-counts.json");
metrics.contentCounts = counts;

// institutions
const institutions = readJson("src/data/institutions-catalog.json");
const instNeedsReview = institutions.filter((i) => i.contentStatus === "needs_review").length;
const instMissingSource = institutions.filter((i) => !i.sourceUrl).length;
const instMissingWebsite = institutions.filter((i) => !i.website).length;
metrics.institutions = {
  total: institutions.length,
  needs_review: instNeedsReview,
  missing_sourceUrl: instMissingSource,
  missing_website: instMissingWebsite,
};
if (instMissingWebsite) pushBlocker("institutions", `${instMissingWebsite} بلا موقع رسمي`, "أضف website من المصدر الرسمي أو اخفِ السجل");
if (instMissingSource) pushCritical("institutions", `${instMissingSource} بلا sourceUrl`, "اربط المصدر الرسمي");
if (instNeedsReview === institutions.length) {
  pushCritical(
    "institutions",
    `كل المؤسسات (${instNeedsReview}) بحالة needs_review دون تحقق بشري مؤرّخ مع بقائها في الدليل العام`,
    "راجع بشريًا واضبط verified+verifiedAt أو أخفِ/أعلم المستخدم بوضوح قبل الإطلاق العام",
  );
}

// universities
const universities = readJson("src/data/universities-catalog.json");
const uniNoSite = universities.filter((u) => !(u.website_url || "").trim()).length;
const uniStale = universities.filter((u) => {
  const d = Date.parse(u.last_updated_at || "");
  if (!Number.isFinite(d)) return true;
  return Date.now() - d > 1000 * 60 * 60 * 24 * 180; // >180 يوم
}).length;
metrics.universities = {
  total: universities.length,
  missing_website_url: uniNoSite,
  last_updated_older_than_180d: uniStale,
  marked_is_verified: universities.filter((u) => u.is_verified === true).length,
};
if (uniNoSite) pushBlocker("universities", `${uniNoSite} بلا website_url`, "أضف الرابط الرسمي أو أرشفة السجل");
if (uniStale) pushWarn("universities", `${uniStale} last_updated_at أقدم من 180 يومًا — أعد التحقق من القبول/البرامج`);

// knowledge fill reports (documented)
const fillRound2 = join(root, "data/CONTENT_FILL_REPORT_ROUND2.md");
metrics.knowledge = {
  documented_needs_review_round2: 1218,
  documented_verified_round2: 2404,
  documented_total_round2: 3622,
  note: "من CONTENT_FILL_REPORT_ROUND2.md — لا يُعاد احتسابه هنا",
};
pushCritical(
  "knowledge",
  "1218 عنصر needs_review موثّق في جولة الملء",
  "أبقِها محجوبة عن العامة حتى المراجعة؛ لا تنشرها كـverified",
);

// quiz demo risk
const quizCount = counts.quizQuestions || 0;
metrics.quizQuestions = quizCount;
if (quizCount > 5000) {
  pushWarn("quiz", `بنك الأسئلة=${quizCount} — وثّق تنقية demo/unreviewed قبل الإطلاق العام`);
}

// library books without sources — from missing doc if present
const missingDoc = join(root, "docs/missing-or-unverified-content.md");
if (existsSync(missingDoc)) {
  const t = readFileSync(missingDoc, "utf8");
  const m = t.match(/(\d+)\s*\/\s*(\d+)/);
  metrics.libraryDocHit = m ? m[0] : null;
  if (/162/.test(t) && /مكتبة|library|مصدر/i.test(t)) {
    pushCritical("library", "وثيقة missing-or-unverified تشير إلى كتب بلا رابط مصدر موثّق (~162)", "أخفِ أو أكمل المصدر قبل النشر");
  }
}

// UI leftovers
metrics.uiCardPublicTsx = 0; // scanned separately in inventory

const publicUnverifiedDirectory =
  metrics.institutions?.total > 0 &&
  metrics.institutions.needs_review === metrics.institutions.total;

let verdict = "READY FOR RELEASE";
if (blockers.some((b) => b.severity === "Blocker") || publicUnverifiedDirectory) {
  verdict = "NOT READY FOR RELEASE";
} else if (blockers.some((b) => b.severity === "Critical") || warnings.length) {
  verdict = "READY WITH CONDITIONS";
}

const report = {
  generatedAt: new Date().toISOString(),
  verdict,
  metrics,
  blockers,
  warnings,
  rules: {
    noInventedData: true,
    noUnverifiedPublish: true,
    shariaImmutable: true,
  },
};

const outDir = join(repoRoot, "reports");
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "prelaunch-readiness.json"), JSON.stringify(report, null, 2) + "\n");
console.log(JSON.stringify({ verdict, blockers: blockers.length, warnings: warnings.length, metrics }, null, 2));
if (verdict === "NOT READY FOR RELEASE" && blockers.some((b) => b.severity === "Blocker")) {
  // لا نفشل CI على Critical الموثّق كتحذير إطلاق — Blockers فقط تفشل
  console.error("audit-prelaunch-readiness: BLOCKERS present");
  process.exit(1);
}
console.log("audit-prelaunch-readiness: ok —", verdict);
