#!/usr/bin/env node
/**
 * يجمع عبارات أحكام مطلقة من بذور المحتوى إلى قائمة مراجعة بشرية (لا يُعدّل النصوص).
 * لا يفشل البناء — تقرير فقط.
 */
import { readFile, writeFile, readdir, mkdir } from "node:fs/promises";
import { resolve, dirname, join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const ROOTS = ["src/lib", "src/data"];
const EXT = new Set([".ts", ".tsx", ".json"]);
const PAT =
  /(موث[ّق]ق(?:ة|ًا|اً)?|متفق عليه|أعظم|أفضل|أصح|مجدد العصر|بالإجماع|لا خلاف)/;

async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (/__tests__|node_modules/.test(e.name)) continue;
      yield* walk(full);
    } else if (EXT.has(extname(e.name))) yield full;
  }
}

const hits = [];
for (const root of ROOTS) {
  for await (const file of walk(resolve(appRoot, root))) {
    if (/rulings-encyclopedia-seed\.generated/.test(file)) continue; // ضخم مولَّد
    const text = await readFile(file, "utf8");
    text.split("\n").forEach((line, i) => {
      if (!PAT.test(line)) return;
      if (/^\s*(\/\/|\*|\/\*)/.test(line)) return;
      hits.push({
        file: file.replace(appRoot + "/", ""),
        line: i + 1,
        snippet: line.trim().slice(0, 160),
      });
    });
  }
}

await mkdir(resolve(appRoot, "reports"), { recursive: true });
const out = {
  generatedAt: new Date().toISOString().slice(0, 10),
  totalHits: hits.length,
  note: "للتراجع البشري — لا يعني كل تطابق خطأً (قد يكون نقلًا عن عالم أو حديثًا ثابتًا).",
  sample: hits.slice(0, 200),
};
await writeFile(
  resolve(appRoot, "reports/absolute-claims-scan.json"),
  JSON.stringify(out, null, 2) + "\n",
);

const md = [
  "# مسح العبارات المطلقة (آلي)",
  "",
  `تاريخ: ${out.generatedAt}`,
  `إجمالي التطابقات (بدون الموسوعة المولَّدة): **${hits.length}**`,
  "",
  "عيّنة (أول 80) — راجع قبل أي تعديل نصي:",
  "",
  ...hits.slice(0, 80).map((h) => `- \`${h.file}:${h.line}\` — ${h.snippet}`),
  "",
  "الملف الكامل: `reports/absolute-claims-scan.json`",
].join("\n");
await writeFile(resolve(appRoot, "reports/absolute-claims-scan.md"), md + "\n");
console.log(`✓ مسح العبارات المطلقة: ${hits.length} تطابقًا → reports/absolute-claims-scan.*`);
