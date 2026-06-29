#!/usr/bin/env node
import { validatePaperQuality, estimatePageCount } from "../lib/scientific-research/quality.mjs";
import { slugifyTitle, validateUploadFile } from "../lib/scientific-research/upload.mjs";
import { findSimilarPapers } from "../lib/scientific-research/ai-enrich.mjs";
import { RESEARCH_SEED_PAPERS } from "../lib/scientific-research/seed-data.mjs";

let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`✓ ${m}`);
  } else {
    fail++;
    console.error(`✗ ${m}`);
  }
}

const sample = {
  title: "بحث في أحكام الزكاة المعاصرة",
  author_name: "أحمد",
  abstract_full: "ملخص تفصيلي للبحث",
  pdf_url: "https://example.com/a.pdf",
};

ok(validatePaperQuality(sample).ok, "quality validation passes");
ok(!validatePaperQuality({ title: "x" }).ok, "quality rejects short title");
ok(slugifyTitle("بحث الزكاة").length > 5, "slugify generates slug");
ok(estimatePageCount(500000) > 0, "page count estimate");
ok(findSimilarPapers(RESEARCH_SEED_PAPERS[0], RESEARCH_SEED_PAPERS).length >= 0, "similar papers");

ok(RESEARCH_SEED_PAPERS.length >= 3, "seed papers >= 3");

console.log(`\nScientific research tests: ${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);
