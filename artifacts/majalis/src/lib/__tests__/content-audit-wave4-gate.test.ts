/**
 * بوابة موجة تدقيق المحتوى ٤: شروح حكم فريدة + عمق القصص ≥200 كلمة.
 * node --import tsx src/lib/__tests__/content-audit-wave4-gate.test.ts
 */
import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

function wordCount(s: string): number {
  return String(s || "")
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

const hikamSrc = readFileSync(resolve(root, "src/views/HikamSalafPage.tsx"), "utf8");
const marker = "const HIKAM: Hikma[] = [";
const start = hikamSrc.indexOf(marker);
const end = hikamSrc.indexOf("\n];", start);
assert.ok(start >= 0 && end > start, "مصفوفة HIKAM");
const body = hikamSrc.slice(start + marker.length, end);
const ids = [...body.matchAll(/id:\s*"([^"]+)"/g)].map((m) => m[1]);
const expls = [...body.matchAll(/explanation:\s*"((?:\\.|[^"\\])*)"/g)].map((m) => m[1]);
assert.equal(ids.length, expls.length, "كل حكمة لها شرح");
assert.ok(ids.length >= 150, `حكم ≥150 (الآن ${ids.length})`);
assert.equal(new Set(expls).size, expls.length, "شروح الحكم فريدة بلا قوالب مكررة حرفياً");
assert.equal(
  expls.filter((e) => /تربية قلبية: تُقرّب العبد إلى معرفة ربه/.test(e)).length,
  0,
  "لا يبقى قالب «تربية قلبية» القديم",
);

const storiesDir = resolve(root, "public/data/stories");
let stories = 0;
let under200 = 0;
for (const name of readdirSync(storiesDir).filter((f) => f.endsWith(".json") && f !== "manifest.json")) {
  const arr = JSON.parse(readFileSync(resolve(storiesDir, name), "utf8")) as Array<{
    full_content?: string;
  }>;
  for (const s of arr) {
    stories++;
    if (wordCount(String(s.full_content || "")) < 200) under200++;
  }
}
assert.ok(stories >= 450, `قصص ≥450 (الآن ${stories})`);
assert.equal(under200, 0, `لا قصص دون 200 كلمة (ناقص: ${under200})`);

let dupLessonBlock = 0;
for (const name of readdirSync(storiesDir).filter((f) => f.endsWith(".json") && f !== "manifest.json")) {
  const arr = JSON.parse(readFileSync(resolve(storiesDir, name), "utf8")) as Array<{
    full_content?: string;
  }>;
  for (const s of arr) {
    if (String(s.full_content || "").includes("**دروس مستفادة من القصة:**")) dupLessonBlock++;
  }
}
assert.equal(dupLessonBlock, 0, "لا تكرار لدروس الواجهة داخل full_content");

console.log(`content-audit-wave4-gate.test.ts: ok (hikam=${ids.length}, stories=${stories})`);
