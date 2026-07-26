#!/usr/bin/env node
/**
 * يصدّر DEMO_QUIZ_QUESTIONS إلى public/data/quiz-questions.json
 * ليُحمَّل عبر fetch بدل حزمة JS بـ1MB+.
 */
import { writeFile, mkdir } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const { DEMO_QUIZ_QUESTIONS } = await import(
  pathToFileURL(resolve(appRoot, "src/lib/quiz-seed.ts")).href
);

const outDir = resolve(appRoot, "public/data");
await mkdir(outDir, { recursive: true });
const payload = {
  generatedAt: new Date().toISOString().slice(0, 10),
  count: DEMO_QUIZ_QUESTIONS.length,
  questions: DEMO_QUIZ_QUESTIONS,
};
await writeFile(
  resolve(outDir, "quiz-questions.json"),
  JSON.stringify(payload),
  "utf8",
);
console.log(`✓ صُدِّر public/data/quiz-questions.json (${payload.count} سؤالًا)`);
