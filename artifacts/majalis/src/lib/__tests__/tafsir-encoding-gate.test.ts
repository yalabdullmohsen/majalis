/**
 * بوابة: ترميز التفسير — لا HTML عالق ولا نص فارغ.
 */
import assert from "node:assert/strict";
import { readdir, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const REGISTRY = resolve(root, "public/data/tafsir/tafsir-registry.json");
const DATA_DIR = resolve(root, "public/data/tafsir");

const HTML_TAG = /<[^>]+>/;
const MOJIBAKE = /[\uFFFD]|Ã.|â€/;

const registry = JSON.parse(await readFile(REGISTRY, "utf8")) as {
  tafsirs: Array<{ id: string; bundled?: boolean }>;
};

let checked = 0;
let bad = 0;

for (const t of registry.tafsirs.filter((x) => x.bundled)) {
  const dir = resolve(DATA_DIR, t.id);
  const files = (await readdir(dir)).filter((f) => f.endsWith(".json"));
  for (const f of files) {
    const j = JSON.parse(await readFile(resolve(dir, f), "utf8")) as { ayahs?: Record<string, string> };
    for (const [ayah, text] of Object.entries(j.ayahs ?? {})) {
      checked += 1;
      const s = String(text);
      if (!s.trim()) {
        bad += 1;
        console.error(`${t.id} ${f} ayah ${ayah}: empty`);
        continue;
      }
      if (HTML_TAG.test(s)) {
        bad += 1;
        console.error(`${t.id} ${f} ayah ${ayah}: HTML tag`);
      }
      if (MOJIBAKE.test(s)) {
        bad += 1;
        console.error(`${t.id} ${f} ayah ${ayah}: mojibake`);
      }
    }
  }
}

assert.ok(checked > 0, "لم يُفحص أي آية");
assert.equal(bad, 0, `${bad} آية فاشلة من ${checked}`);
console.log(`tafsir-encoding-gate: ok (${checked} ayahs)`);
