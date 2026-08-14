#!/usr/bin/env node
/**
 * تدقيق تكاملي للمعرفة:
 * - تطابق المانيفست مع الجرد الحي
 * - فريدة المعرّفات / أجسام غير فارغة
 * - verified بدون أدلة أو مصادر ناقصة
 *
 * إشارات الإسرائيليات المنهجية تُرصد في generate-content-audit-report (ناعم)
 * ولا تُفشل البوابة لأن ذكر «الإسرائيليات» للتحذير مشروع.
 */
import fs from "node:fs";
import path from "node:path";
import { KNOWLEDGE, loadKnowledgeItems, sectionOf, fail, ok } from "./lib.mjs";

const items = loadKnowledgeItems();
const issues = [];
const ids = new Map();
const bySec = Object.create(null);

for (const it of items) {
  const sec = sectionOf(it);
  if (!bySec[sec]) bySec[sec] = { all: 0, verified: 0, needs_review: 0 };
  bySec[sec].all++;
  if (it.review_status === "verified") bySec[sec].verified++;
  else if (it.review_status === "needs_review") bySec[sec].needs_review++;
  else issues.push(`${it.id}: review_status مفقود/غير معروف`);

  if (ids.has(it.id)) issues.push(`معرّف مكرر: ${it.id} (${it.__file} و ${ids.get(it.id)})`);
  else ids.set(it.id, it.__file);

  if (!String(it.body || "").trim()) issues.push(`${it.id}: جسم فارغ`);
  if (!Array.isArray(it.tags)) issues.push(`${it.id}: tags ليست مصفوفة`);
  if (!Array.isArray(it.related)) issues.push(`${it.id}: related ليست مصفوفة`);

  if (it.review_status === "verified") {
    if (!Array.isArray(it.evidences) || it.evidences.length === 0) {
      issues.push(`${it.id}: verified بلا evidences`);
    }
    if (!Array.isArray(it.sources) || it.sources.length === 0) {
      issues.push(`${it.id}: verified بلا sources`);
    }
    for (const s of it.sources || []) {
      if (!String(s?.book || "").trim() || !String(s?.author || "").trim()) {
        issues.push(`${it.id}: مصدر ناقص book/author`);
        break;
      }
    }
  }
}

const manifestPath = path.join(KNOWLEDGE, "manifest.json");
if (!fs.existsSync(manifestPath)) {
  issues.push("manifest.json مفقود");
} else {
  const man = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
  const totals = man.totals || {};
  const liveAll = items.length;
  const liveV = items.filter((i) => i.review_status === "verified").length;
  const liveN = items.filter((i) => i.review_status === "needs_review").length;
  if (totals.all !== liveAll) issues.push(`manifest.totals.all=${totals.all} ≠ الحي ${liveAll}`);
  if (totals.verified !== liveV) issues.push(`manifest.totals.verified=${totals.verified} ≠ الحي ${liveV}`);
  if (totals.needs_review !== liveN) {
    issues.push(`manifest.totals.needs_review=${totals.needs_review} ≠ الحي ${liveN}`);
  }
  const map = {
    quiz: "quiz",
    prophets: "prophets",
    nations: "nations",
    people: "quran-people",
    tafsir: "tafsir",
    discover: "discover-islam",
  };
  for (const [k, sec] of Object.entries(map)) {
    if (typeof totals[k] === "number" && bySec[sec] && totals[k] !== bySec[sec].all) {
      issues.push(`manifest.totals.${k}=${totals[k]} ≠ ${sec}.all=${bySec[sec].all}`);
    }
  }
}

if (issues.length) fail(`test:content-audit — ${issues.length} مخالفة`, issues);
ok(
  `test:content-audit — ${items.length} عنصرًا · verified=${items.filter((i) => i.review_status === "verified").length} · needs_review=${items.filter((i) => i.review_status === "needs_review").length}`,
);
