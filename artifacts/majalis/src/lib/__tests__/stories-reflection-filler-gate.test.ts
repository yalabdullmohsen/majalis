/**
 * يمنع عودة قالب «تأمل في السياق» في قصص public/data/stories.
 * تشغيل: node --import tsx src/lib/__tests__/stories-reflection-filler-gate.test.ts
 */
import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const storiesDir = join(root, "public/data/stories");
const FILLER = "تأمل في السياق";
const EXTRA_FORBIDDEN = [
  "تُقرأ هذه السيرة",
  "بالتحقق والتأمل ثم تحويل المعنى",
  "مع مراعاة الدليل لا الشهرة",
  "فالعبرة بالامتثال لا بكثرة الذكر",
];
const MIN_WORDS = 200;

let failed = 0;
let checked = 0;

for (const name of readdirSync(storiesDir)) {
  if (!name.endsWith(".json") || name === "manifest.json") continue;
  const raw = readFileSync(join(storiesDir, name), "utf8");
  if (raw.includes(FILLER)) {
    console.error(`  ✗ ${name}: يحتوي «${FILLER}»`);
    failed++;
  }
  for (const phrase of EXTRA_FORBIDDEN) {
    if (raw.includes(phrase)) {
      console.error(`  ✗ ${name}: يحتوي «${phrase}»`);
      failed++;
    }
  }
  const data = JSON.parse(raw) as unknown;
  if (!Array.isArray(data)) continue;
  for (const item of data) {
    if (!item || typeof item !== "object") continue;
    const fc = String((item as { full_content?: string }).full_content || "");
    const words = fc.trim().split(/\s+/).filter(Boolean).length;
    checked++;
    if (words < MIN_WORDS) {
      const id = (item as { slug?: string; id?: string }).slug || (item as { id?: string }).id || "?";
      console.error(`  ✗ ${name} / ${id}: محتوى قصير (${words} كلمة)`);
      failed++;
    }
  }
}

if (failed > 0) {
  console.error(`stories-reflection-filler-gate: FAIL (${failed})`);
  process.exit(1);
}
console.log(`stories-reflection-filler-gate: ok (${checked} قصة)`);
