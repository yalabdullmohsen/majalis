#!/usr/bin/env node
// أمر استعلام لعرض عناصر المحتوى الموسومة needs_post_review (اجتهاد/شك بعد النشر التلقائي).
// التشغيل: node scripts/review-queue.mjs [--json] [--limit N]
// المصدر: artifacts/majalis/data/needs-post-review.jsonl (سطر JSON واحد لكل عنصر، الأحدث آخر السطور).

import { readFileSync, existsSync, readdirSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_PATH = path.resolve(__dirname, "../data/needs-post-review.jsonl");
/* ملفات يومية لكل نافذة عمل تحت data/needs-post-review/ — أُضيفت 2026-07-25
   لأن الإلحاق المتزامن من نافذتين في ملفٍ واحد كان يُفشل دمج الإصدار بتعارضٍ
   لا معنى له. كل نافذة تكتب ملفها، والقارئ يجمعها كلها هنا. */
const LOG_DIR = path.resolve(__dirname, "../data/needs-post-review");
function readAllLogLines() {
  const files = [];
  if (existsSync(LOG_PATH)) files.push(LOG_PATH);
  if (existsSync(LOG_DIR)) {
    for (const f of readdirSync(LOG_DIR).sort()) {
      if (f.endsWith(".jsonl")) files.push(path.join(LOG_DIR, f));
    }
  }
  return files.flatMap((f) => readFileSync(f, "utf8").split("\n").filter((l) => l.trim()));
}

const args = process.argv.slice(2);
const asJson = args.includes("--json");
const limitIdx = args.indexOf("--limit");
const limit = limitIdx !== -1 ? parseInt(args[limitIdx + 1], 10) : 50;

const lines = readAllLogLines().map((l) => l.trim()).filter(Boolean);
if (lines.length === 0) {
  console.log("لا عناصر بانتظار المراجعة.");
  process.exit(0);
}
const items = [];
for (const line of lines) {
  try {
    items.push(JSON.parse(line));
  } catch {
    // سطر تالف — يُتجاهَل بصمت هنا، يظهر في --json كخطأ تحليل إن أُريد لاحقاً
  }
}

items.sort((a, b) => (b.timestamp || "").localeCompare(a.timestamp || ""));
const shown = items.slice(0, limit);

if (asJson) {
  console.log(JSON.stringify(shown, null, 2));
  process.exit(0);
}

console.log(`عناصر بانتظار المراجعة البشرية (needs_post_review): ${items.length} إجمالاً، عرض أحدث ${shown.length}\n`);
for (const it of shown) {
  console.log(`[${it.timestamp || "?"}] (${it.cycle || "?"}) ${it.file || "?"} — ${it.identifier || "?"}`);
  console.log(`  السبب: ${it.reason || "—"}`);
  console.log("");
}
console.log("لإزالة عنصر من الطابور بعد المراجعة اليدوية: احذف سطره من data/needs-post-review.jsonl مباشرة.");
