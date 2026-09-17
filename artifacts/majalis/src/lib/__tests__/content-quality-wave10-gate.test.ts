import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const read = (rel: string) => readFileSync(resolve(root, rel), "utf8");

console.log("=== seerah hash deep-link ===");
{
  const src = read("src/views/SeerahPage.tsx");
  assert.match(src, /location\.hash/);
  assert.match(src, /replaceState/);
  assert.match(src, /id=\{phase\.id\}/);
}

console.log("=== prophets no identical generic triad sections ===");
{
  const src = read("src/views/ProphetStoriesPage.tsx");
  assert.doesNotMatch(src, /data-ps-section="established-sunnah"/);
  assert.doesNotMatch(src, /data-ps-section="uncertain"/);
  assert.match(src, /data-ps-section="quran-loci"|mainSurahs/);
}

console.log("=== tarikh no mass مفصلي badge ===");
{
  const src = read("src/views/TarikhIslamiPage.tsx");
  assert.doesNotMatch(src, /مفصلي/);
}

console.log("=== seerah dark event text ===");
{
  const css = read("src/styles/pages/seerah.css");
  assert.match(css, /seerah-timeline__item/);
}

console.log("content-quality-wave10-gate: ok");
