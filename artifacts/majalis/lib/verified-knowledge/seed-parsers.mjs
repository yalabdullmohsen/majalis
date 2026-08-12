/**
 * Shared parsers for adhkar/hadith seed TypeScript files.
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MAJALIS_ROOT = path.resolve(__dirname, "../..");

export function parseAdhkarFromSeedFile() {
  const p = path.join(MAJALIS_ROOT, "src/lib/adhkar-seed.ts");
  if (!fs.existsSync(p)) return { categories: [], items: [] };

  const text = fs.readFileSync(p, "utf8");
  const categories = [];
  const catRegex = /\{\s*id:\s*"([^"]+)",\s*name:\s*"([^"]+)",\s*slug:\s*"([^"]+)",\s*description:\s*"([^"]*)"/g;
  let m;
  while ((m = catRegex.exec(text)) !== null) {
    categories.push({ id: m[1], name: m[2], slug: m[3], description: m[4] });
  }

  const items = [];
  const blockRegex = /\{\s*id:\s*"([^"]+)",\s*categoryId:\s*"([^"]+)",\s*text:\s*"((?:\\.|[^"\\])*)",\s*count:\s*(\d+),([\s\S]*?)\}/g;
  while ((m = blockRegex.exec(text)) !== null) {
    const tail = m[5];
    const pick = (key) => tail.match(new RegExp(`${key}:\\s*"((?:\\\\.|[^"\\\\])*)"`))?.[1]?.replace(/\\"/g, '"');
    items.push({
      id: m[1],
      category_id: m[2],
      text: m[3].replace(/\\"/g, '"'),
      repeat_count: Number(m[4]),
      narrator: pick("narrator"),
      source_name: pick("source"),
      grade: pick("grade"),
      reference: pick("reference"),
      source_url: "https://hisn.alim.net",
      keywords: [],
    });
  }

  const kwRegex = /keywords:\s*\[([^\]]*)\]/g;
  let i = 0;
  let kwMatch;
  while ((kwMatch = kwRegex.exec(text)) !== null && i < items.length) {
    items[i].keywords = [...kwMatch[1].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
    i += 1;
  }

  return { categories, items };
}

export function parseArbaeenFromSeedFile() {
  const p = path.join(MAJALIS_ROOT, "src/lib/arbaeen-nawawi-seed.ts");
  if (!fs.existsSync(p)) return [];

  const text = fs.readFileSync(p, "utf8");
  const items = [];
  const blockRegex = /\{\s*"id":\s*(\d+),[\s\S]*?"title":\s*"((?:\\.|[^"\\])*)",[\s\S]*?"text":\s*"((?:\\.|[^"\\])*)",[\s\S]*?"source":\s*"((?:\\.|[^"\\])*)"/g;
  let m;
  while ((m = blockRegex.exec(text)) !== null) {
    items.push({
      id: `arbaeen-${m[1]}`,
      collection: "الأربعون النووية",
      hadith_number: String(m[1]),
      title: m[2].replace(/\\"/g, '"'),
      text: m[3].replace(/\\"/g, '"'),
      narrator: "—",
      source_name: m[4].replace(/\\"/g, '"'),
      source_url: "https://sunnah.com/nawawi40",
      grade: "صحيح/حسن",
      chapter: "الأربعون النووية",
      keywords: ["حديث", "نووي", "أربعين"],
    });
  }
  return items;
}
