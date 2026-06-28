import { dirname, join } from "node:path";
import { runContentImport } from "./engine.mjs";
import { ensureContentImportSchema } from "./ensure-schema.mjs";
import { isProductionContentMode } from "../cms/production-mode.mjs";

/** @typedef {{ type: string, file: string, label: string, verifyPath: string }} TrialSpec */

/** @type {TrialSpec[]} */
export const PHASE2_TRIAL_SPECS = [
  {
    type: "sheikhs",
    file: "data/imports/trial/sheikhs.phase2.json",
    label: "المشايخ",
    verifyPath: "/sheikhs",
  },
  {
    type: "lessons",
    file: "data/imports/trial/lessons.phase2.json",
    label: "الدروس",
    verifyPath: "/lessons",
  },
  {
    type: "questions",
    file: "data/imports/trial/questions.phase2.json",
    label: "الأسئلة",
    verifyPath: "/qa",
  },
  {
    type: "books",
    file: "data/imports/trial/books.phase2.json",
    label: "المكتبة",
    verifyPath: "/library",
  },
];

/**
 * Run all Phase 2 trial imports in dependency order.
 * @param {string} rootDir
 * @param {{ dryRun?: boolean }} opts
 */
export async function runPhase2TrialImport(rootDir, opts = {}) {
  if (isProductionContentMode() && !opts.dryRun && !opts.forceDev) {
    return {
      ok: false,
      blocked: true,
      error: "phase2_trial_blocked_in_production",
      message: "Phase 2 trial import is disabled in production — use real content imports only",
      totals: { read: 0, imported: 0, skipped: 0, failed: 0, invalid: 0 },
      reports: [],
      verifyLinks: [],
    };
  }
  if (!opts.dryRun) {
    const schema = await ensureContentImportSchema();
    if (!schema.ok) {
      return {
        ok: false,
        dryRun: false,
        schemaError: schema.error,
        totals: { read: 0, imported: 0, skipped: 0, failed: 0, invalid: 0 },
        reports: [],
        verifyLinks: [],
      };
    }
  }

  const reports = [];

  for (const spec of PHASE2_TRIAL_SPECS) {
    const report = await runContentImport({
      rootDir,
      type: spec.type,
      filePath: join(rootDir, spec.file),
      dryRun: Boolean(opts.dryRun),
    });
    reports.push({ ...spec, report });
  }

  const totals = reports.reduce(
    (acc, row) => {
      acc.read += row.report.stats?.read ?? 0;
      acc.imported += row.report.stats?.imported ?? 0;
      acc.skipped += row.report.stats?.skipped ?? 0;
      acc.failed += row.report.stats?.failed ?? 0;
      acc.invalid += row.report.stats?.invalid ?? 0;
      return acc;
    },
    { read: 0, imported: 0, skipped: 0, failed: 0, invalid: 0 },
  );

  const ok = reports.every((row) => row.report.ok);

  return {
    ok,
    dryRun: Boolean(opts.dryRun),
    totals,
    reports,
    verifyLinks: [
      { label: "الدروس", path: "/lessons", search: "Phase 2" },
      { label: "الأسئلة", path: "/qa", search: "Phase2" },
      { label: "المكتبة", path: "/library", search: "Phase2" },
      { label: "البحث", path: "/search", search: "Phase2" },
      { label: "الرئيسية", path: "/", search: null },
    ],
  };
}
