#!/usr/bin/env node
/** إعادة تنقية نصوص التفسير المجمَّعة — حذف وسوم HTML ومراجع الحواشي */
import { readdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const DATA = resolve(root, "public/data/tafsir");

function stripTags(html) {
  return String(html ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\s*\d+-\d+\s*>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

const reg = JSON.parse(await readFile(resolve(DATA, "tafsir-registry.json"), "utf8"));
for (const t of reg.tafsirs.filter((x) => x.bundled)) {
  const dir = resolve(DATA, t.id);
  for (const f of (await readdir(dir)).filter((x) => x.endsWith(".json"))) {
    const path = resolve(dir, f);
    const j = JSON.parse(await readFile(path, "utf8"));
    for (const [k, v] of Object.entries(j.ayahs ?? {})) {
      j.ayahs[k] = stripTags(v);
    }
    await writeFile(path, JSON.stringify(j), "utf8");
  }
  console.log("sanitized", t.id);
}
