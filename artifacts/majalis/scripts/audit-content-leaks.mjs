#!/usr/bin/env node
/**
 * يفشل عند تسرب تعليمات مطوّر أو مولد محتوى إلى حقول ظاهرة للمستخدم
 * (bio / description / title / summary في مصادر البيانات).
 */
import { readFile, readdir } from "node:fs/promises";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const LEAK = /مُثرى مسبقاً|مثرى مسبقاً|يربط شبكة|المُثراة سابقاً|أضف لاحقاً|قيد التعبئة|lorem ipsum|TODO:|FIXME:|placeholder text|موجود مسبقًا في الكتالوج|WebFetch/i;

const ROOTS = ["src/lib", "src/data"];
const EXT = new Set([".ts", ".tsx", ".json"]);

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "__tests__" || e.name === "node_modules") continue;
      yield* walk(full);
    } else if (EXT.has(extname(e.name))) yield full;
  }
}

const hits = [];
for (const root of ROOTS) {
  for await (const file of walk(resolve(appRoot, root))) {
    const text = await readFile(file, "utf8");
    // تجاهل تعليقات السكربتات التقنية داخل ملفات الخدمات غير المعروضة
    if (/fiqh-council-service|quiz-seed\.ts$|lesson-import/.test(file) && !/bio:|description:/.test(text.slice(0, 200))) {
      /* still scan; filter line-level below */
    }
    text.split("\n").forEach((line, i) => {
      if (!LEAK.test(line)) return;
      // تعليقات كود داخلية فقط — تُسمح إن لم تكن في حقل محتوى
      const isComment = /^\s*(\/\/|\*|\/\*)/.test(line);
      const isContentField = /bio:|description:|summary:|title:|hint:|"bio"|"description"/.test(line);
      if (isComment && !isContentField) return;
      // حقول sources قديمة نُظِّفت؛ أي WebFetch متبقٍّ خطأ
      hits.push(`${file.replace(appRoot + "/", "")}:${i + 1}`);
    });
  }
}

if (hits.length) {
  console.error(`✗ تسربات محتوى: ${hits.length}\n`);
  hits.slice(0, 40).forEach((h) => console.error("  " + h));
  if (hits.length > 40) console.error(`  … و${hits.length - 40} أخرى`);
  process.exit(1);
}
console.log("✓ لا تسربات مطوّر ظاهرة في حقول المحتوى المفحوصة.");
