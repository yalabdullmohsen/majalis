/**
 * Open Platform — adhkar/dua seed loader (no DB required).
 */

import { readFileSync, existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let adhkarCache = null;

export function loadAdhkarFromSeed(type = "adhkar") {
  if (adhkarCache) return type === "dua" ? adhkarCache.filter((i) => i.category === "distress" || i.category === "dua") : adhkarCache;

  const seedPath = path.resolve(__dirname, "../../src/lib/adhkar-seed.ts");
  if (!existsSync(seedPath)) {
    adhkarCache = getFallbackAdhkar();
    return type === "dua" ? adhkarCache.filter((i) => i.category === "dua") : adhkarCache;
  }

  try {
    const raw = readFileSync(seedPath, "utf8");
    const matches = [...raw.matchAll(/\{\s*id:\s*"([^"]+)"[^}]*text:\s*"([^"]+)"[^}]*category:\s*"([^"]+)"/g)];
    adhkarCache = matches.map((m, i) => ({
      id: m[1] || `adhkar-${i}`,
      text: m[2],
      title: m[2].slice(0, 60),
      category: m[3],
      slug: m[1],
    }));
    if (!adhkarCache.length) adhkarCache = getFallbackAdhkar();
  } catch {
    adhkarCache = getFallbackAdhkar();
  }

  return type === "dua" ? adhkarCache.filter((i) => i.category === "dua" || i.category === "distress") : adhkarCache;
}

function getFallbackAdhkar() {
  return [
    { id: "adhkar-1", text: "سبحان الله", title: "سبحان الله", category: "morning", slug: "adhkar-1" },
    { id: "adhkar-2", text: "الحمد لله", title: "الحمد لله", category: "morning", slug: "adhkar-2" },
    { id: "dua-1", text: "ربنا آتنا في الدنيا حسنة", title: "دعاء الحسنتين", category: "dua", slug: "dua-1" },
  ];
}
