/**
 * لا عبارات تأجيل/placeholder في كتالوج الفقه وواجهاته.
 * التشغيل: pnpm exec tsx src/lib/__tests__/fiqh-no-forbidden-placeholders.test.ts
 */
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "../../..");

const FORBIDDEN = [
  "pending_review",
  "reviewStatus",
  "مؤجل",
  "قيد الإضافة",
  "قريبًا",
  "قريبا",
  "سيتم لاحقًا",
  "سيتم لاحقا",
  "TODO",
  "FIXME",
  "Placeholder",
  "Lorem ipsum",
  "lorem ipsum",
] as const;

let passed = 0;
let failed = 0;
function assert(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

console.log("\n=== no forbidden placeholders ===");

const files = [
  "content/fiqh/books.json",
  "content/fiqh/book-aliases.json",
  "src/pages/fiqh/ui/FiqhView.tsx",
  "src/pages/fiqh/ui/FiqhBookView.tsx",
  "src/pages/fiqh/ui/FiqhChapterView.tsx",
  "src/lib/fiqh-books.ts",
];

for (const rel of files) {
  const text = readFileSync(resolve(appRoot, rel), "utf8");
  for (const bad of FORBIDDEN) {
    assert(!text.includes(bad), `${rel} بلا «${bad}»`);
  }
}

console.log(`\nالنتيجة: ${passed} نجاح / ${failed} فشل`);
if (failed > 0) process.exit(1);
