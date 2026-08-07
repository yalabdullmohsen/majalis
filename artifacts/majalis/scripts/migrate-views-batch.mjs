#!/usr/bin/env node
/**
 * مساعد ترحيل views → pages/<feature>/ (حزم C).
 * الاستخدام:
 *   node scripts/migrate-views-batch.mjs --feature lessons --files LessonsPage,LessonsArchivePage
 * الصفحات > maxLines تُنقل إلى ui/*View مع غلاف رقيق.
 */
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(__dirname, "..");
const repoRoot = path.resolve(appRoot, "../..");

function arg(name, fallback) {
  const i = process.argv.indexOf(`--${name}`);
  return i >= 0 ? process.argv[i + 1] : fallback;
}

const feature = arg("feature");
const filesArg = arg("files", "");
const maxLines = Number(arg("max-lines", "150"));
if (!feature || !filesArg) {
  console.error("Usage: --feature <name> --files A,B,C");
  process.exit(1);
}

const names = filesArg.split(",").map((s) => s.trim()).filter(Boolean);
const pagesDir = path.join(appRoot, "src/pages", feature);
const uiDir = path.join(pagesDir, "ui");
fs.mkdirSync(uiDir, { recursive: true });

const moved = [];
for (const name of names) {
  const src = path.join(appRoot, "src/views", `${name}.tsx`);
  if (!fs.existsSync(src)) {
    console.error("missing", src);
    process.exit(1);
  }
  const lines = fs.readFileSync(src, "utf8").split("\n").length;
  const relSrc = path.relative(repoRoot, src);
  if (lines <= maxLines) {
    const dest = path.join(pagesDir, `${name}.tsx`);
    const relDest = path.relative(repoRoot, dest);
    execSync(`git mv "${relSrc}" "${relDest}"`, { cwd: repoRoot, stdio: "inherit" });
    moved.push({ name, kind: "page", lines });
  } else {
    const viewName = name.replace(/Page$/, "View");
    const dest = path.join(uiDir, `${viewName}.tsx`);
    const relDest = path.relative(repoRoot, dest);
    execSync(`git mv "${relSrc}" "${relDest}"`, { cwd: repoRoot, stdio: "inherit" });
    const thin = path.join(pagesDir, `${name}.tsx`);
    fs.writeFileSync(
      thin,
      `/** صفحة رقيقة — المنطق في ui/${viewName}.tsx */\nexport { default } from "@/pages/${feature}/ui/${viewName}";\n`,
    );
    // fix ../lib relative imports that assumed views/ depth
    let body = fs.readFileSync(dest, "utf8");
    body = body.replace(
      /from (["'])\.\.\/(lib|components|hooks|data|quran|features|shared)\//g,
      "from $1@/$2/",
    );
    fs.writeFileSync(dest, body);
    moved.push({ name, kind: "thin+ui", lines, viewName });
  }
}

console.log(JSON.stringify({ feature, moved }, null, 2));
