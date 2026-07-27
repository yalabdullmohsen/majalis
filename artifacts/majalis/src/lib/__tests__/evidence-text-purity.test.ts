/**
 * نقاء نصوص الآيات والأحاديث في صفحات الأقسام/الأركان.
 * يمنع عودة حقن الحشو الآلي داخل حقول الدليل.
 * تشغيل: npx tsx src/lib/__tests__/evidence-text-purity.test.ts
 */
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const viewsDir = resolve(__dirname, "../../views");

const FORBIDDEN = [
  "محتوى تعليمي معتمد",
  "مرجع تربوي شرعي",
  "من أصول العقيدة الإسلامية على منهج السلف",
  "يُقرأ ضمن مسار العقيدة للمبتدئ",
  "يُستحضر في التعليم",
  "من أدلة أركان الإسلام؛",
  "من أدلة أركان الإسلام يُستحضر",
];

const TRAILING_DOTS = /\.{5,}/;

let passed = 0;
let failed = 0;
function assert(cond: boolean, msg: string) {
  if (cond) { passed++; console.log(`  ✓ ${msg}`); }
  else { failed++; console.error(`  ✗ ${msg}`); }
}

/** يستخرج قيم text داخل كتل dalilQuran / dalilHadith / hadith / ayah */
function extractEvidenceTexts(src: string): string[] {
  const out: string[] = [];
  const blockRe = /\b(?:dalilQuran|dalilHadith)\s*:\s*\[([\s\S]*?)\]/g;
  let bm: RegExpExecArray | null;
  while ((bm = blockRe.exec(src))) {
    const textRe = /\btext\s*:\s*"((?:\\.|[^"\\])*)"/g;
    let tm: RegExpExecArray | null;
    while ((tm = textRe.exec(bm[1]))) out.push(tm[1]);
  }
  const ayahRe = /\bayah\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let am: RegExpExecArray | null;
  while ((am = ayahRe.exec(src))) out.push(am[1]);
  const hadithTextRe = /\bhadith\s*:\s*\{[\s\S]*?\btext\s*:\s*"((?:\\.|[^"\\])*)"/g;
  let hm: RegExpExecArray | null;
  while ((hm = hadithTextRe.exec(src))) out.push(hm[1]);
  return out;
}

const priority = ["ArkanIslamPage.tsx", "ArkanImanPage.tsx", "TawhidPage.tsx", "FiqhPage.tsx"];
const files = [
  ...priority.map((f) => join(viewsDir, f)),
  ...readdirSync(viewsDir).filter((f) => f.endsWith(".tsx") && !priority.includes(f)).map((f) => join(viewsDir, f)),
];

console.log("\n=== نقاء أدلة الأركان/العقيدة ===");
{
  for (const file of priority.map((f) => join(viewsDir, f))) {
    const src = readFileSync(file, "utf8");
    const name = file.split("/").pop()!;
    const texts = extractEvidenceTexts(src);
    assert(texts.length > 0 || name === "FiqhPage.tsx", `${name}: وُجدت حقول أدلة أو الصفحة بلا أدلة نصية (الفقه)`);
    for (const t of texts) {
      for (const frag of FORBIDDEN) {
        assert(!t.includes(frag), `${name}: لا يحتوي دليل على «${frag}»`);
      }
      assert(!TRAILING_DOTS.test(t), `${name}: لا نقاط حشو في نص الدليل`);
    }
  }
}

console.log("\n=== أوصاف أقسام الفقه/العقيدة ≤ 140 وبدون حشو ===");
{
  for (const name of ["TawhidPage.tsx", "FiqhPage.tsx"]) {
    const src = readFileSync(join(viewsDir, name), "utf8");
    const descRe = /\bdesc\s*:\s*"((?:\\.|[^"\\])*)"/g;
    let m: RegExpExecArray | null;
    let count = 0;
    while ((m = descRe.exec(src))) {
      count++;
      const d = m[1];
      assert(d.length <= 140, `${name}: وصف ≤140 (فعلي ${d.length}): ${d.slice(0, 40)}…`);
      for (const frag of FORBIDDEN) {
        assert(!d.includes(frag), `${name}: وصف بلا حشو «${frag}»`);
      }
      assert(!TRAILING_DOTS.test(d), `${name}: وصف بلا نقاط حشو`);
    }
    assert(count > 5, `${name}: وُجدت أوصاف كافية (${count})`);
  }
}

console.log("\n=== مسح شامل سريع ضد الحشو في حقول text للأدلة ===");
{
  let contaminated = 0;
  for (const file of files) {
    const src = readFileSync(file, "utf8");
    for (const t of extractEvidenceTexts(src)) {
      if (FORBIDDEN.some((f) => t.includes(f)) || TRAILING_DOTS.test(t)) {
        contaminated++;
        console.error(`  ✗ تلوث في ${file.split("/").pop()}: ${t.slice(0, 60)}…`);
      }
    }
  }
  assert(contaminated === 0, `لا تلوث في أي حقل دليل عبر views (مُلوَّث: ${contaminated})`);
}

console.log(`\n${"─".repeat(40)}`);
console.log(`النتائج: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
