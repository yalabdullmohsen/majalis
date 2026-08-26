/**
 * بوابة موجة تدقيق المحتوى ٣: شروح الأسئلة الحية + مصادر حكم السلف.
 * node --import tsx src/lib/__tests__/content-audit-wave3-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

type QuizQuestion = {
  id?: string;
  answer?: string;
  explanation?: string;
  status?: string;
  documentation_status?: string;
  editorial_review_status?: string;
  reference?: string;
};

function isLiveQuizQuestion(q: QuizQuestion): boolean {
  const id = String(q.id || "");
  if (/^demo[-_]/i.test(id) || id.includes("demo-")) return false;
  if (q.status === "draft" || q.status === "needs_review") return false;
  if (q.editorial_review_status === "needs_review" || q.editorial_review_status === "rejected") {
    return false;
  }
  if (q.documentation_status === "unsourced" && !q.reference) return false;
  return true;
}

const quizDir = resolve(root, "public/data/quiz");
let live = 0;
let liveMissingExplanation = 0;
for (const name of readdirSync(quizDir).filter((f) => f.endsWith(".json") && f !== "manifest.json")) {
  const raw = JSON.parse(readFileSync(resolve(quizDir, name), "utf8")) as QuizQuestion[] | { questions?: QuizQuestion[] };
  const arr = Array.isArray(raw) ? raw : raw.questions || [];
  for (const q of arr) {
    if (!isLiveQuizQuestion(q)) continue;
    live++;
    if (!String(q.explanation || "").trim()) liveMissingExplanation++;
  }
}
assert.ok(live >= 2000, `أسئلة حية ≥2000 (الآن ${live})`);
assert.equal(liveMissingExplanation, 0, `لا أسئلة حية بلا explanation (ناقص: ${liveMissingExplanation})`);

const hikamSrc = readFileSync(resolve(root, "src/views/HikamSalafPage.tsx"), "utf8");
const start = hikamSrc.indexOf("const HIKAM: Hikma[] = [");
const end = hikamSrc.indexOf("\n];", start);
assert.ok(start >= 0 && end > start, "مصفوفة HIKAM موجودة");
const body = hikamSrc.slice(start, end);
const blocks = body.split(/\n {2}\{/).slice(1);
assert.ok(blocks.length >= 150, `حكم ≥150 (الآن ${blocks.length})`);
let missingSource = 0;
for (const b of blocks) {
  if (!/source:\s*"/.test(b)) missingSource++;
}
assert.equal(missingSource, 0, `كل الحكم بمصدر (ناقص: ${missingSource})`);
assert.match(hikamSrc, /الترمذي: ٢٣٢٠/);

console.log(`content-audit-wave3-gate.test.ts: ok (live=${live}, hikam=${blocks.length})`);
