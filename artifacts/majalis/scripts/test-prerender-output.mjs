#!/usr/bin/env node

import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

const dist = resolve(import.meta.dirname, "..", "dist");
const cases = [
  ["lessons/index.html", "الدروس الشرعية"],
  ["quran/index.html", "القرآن الكريم"],
  ["library/index.html", "المكتبة"],
  ["fiqh-council/index.html", "المجمع الفقهي"],
];

for (const [path, expected] of cases) {
  const html = await readFile(resolve(dist, path), "utf8");
  if (!html.includes(expected)) throw new Error(`${path} is missing route-specific content: ${expected}`);
  if (!html.includes('id="root"') || !html.includes("/assets/")) {
    throw new Error(`${path} is not a hydratable production document`);
  }
}

const lessonRoot = await readFile(resolve(dist, "lessons/index.html"), "utf8");
const homeRoot = await readFile(resolve(dist, "index.html"), "utf8");
if (lessonRoot === homeRoot) throw new Error("detail/list route fell back to the home document");

console.log(`Prerender regression: ${cases.length} route documents passed`);
