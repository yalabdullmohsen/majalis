#!/usr/bin/env node
/**
 * content:fix — إصلاحات آمنة فقط → reports/content-fix-log.json
 */
import fs from "node:fs";
import path from "node:path";
import {
  ROOT,
  SCAN_DIRS,
  walkFiles,
  readText,
  writeText,
  loadDictionaries,
  applyTermFixes,
  isTestOrGateFile,
} from "./lib/content-qa-core.mjs";

const dicts = loadDictionaries();
const dictionaries = [dicts.arabic, dicts.islamic];
const files = walkFiles(SCAN_DIRS);
const changed = [];
let filesTouched = 0;
let totalEdits = 0;

for (const rel of files) {
  if (isTestOrGateFile(rel)) continue;
  if (/^src\/locales\/(?!ar\b)/.test(rel)) continue;
  let text;
  try {
    text = readText(rel);
  } catch {
    continue;
  }
  const { text: next, count, applied } = applyTermFixes(text, dictionaries, rel);
  if (count > 0 && next !== text) {
    writeText(rel, next);
    filesTouched += 1;
    totalEdits += count;
    changed.push({
      file: rel,
      edits: count,
      kinds: applied.map((a) => `${a.from}→${a.to}×${a.n}`),
    });
  }
}

const logPath = path.join(ROOT, "reports/content-fix-log.json");
let previous = { filesTouched: 0, totalEdits: 0, changed: [] };
if (fs.existsSync(logPath)) {
  try {
    previous = JSON.parse(fs.readFileSync(logPath, "utf8"));
  } catch {
    /* ignore */
  }
}

const log = {
  generatedAt: new Date().toISOString(),
  filesTouched,
  totalEdits,
  changed,
  cumulative: {
    note: "يجمع تشغيلات content:fix المتتالية في الجلسة إن وُجد سجل سابق غير فارغ",
    filesTouched: (previous.cumulative?.filesTouched ?? previous.filesTouched ?? 0) + filesTouched,
    totalEdits: (previous.cumulative?.totalEdits ?? previous.totalEdits ?? 0) + totalEdits,
    changed: [...(previous.cumulative?.changed ?? previous.changed ?? []), ...changed].slice(-500),
  },
};
fs.mkdirSync(path.join(ROOT, "reports"), { recursive: true });
fs.writeFileSync(logPath, JSON.stringify(log, null, 2), "utf8");

const reportTouched = log.cumulative.filesTouched || filesTouched;
const reportEdits = log.cumulative.totalEdits || totalEdits;
const reportChanged = (log.cumulative.changed || changed).slice(-500);

console.log(
  JSON.stringify(
    {
      ok: true,
      filesTouched,
      totalEdits,
      cumulativeFilesTouched: reportTouched,
      cumulativeTotalEdits: reportEdits,
      log: "reports/content-fix-log.json",
      sample: changed.slice(0, 30),
    },
    null,
    2,
  ),
);
