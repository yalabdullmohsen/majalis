/**
 * مزامنة مصادر بيانات SEO من المصدر الوحيد (TypeScript) إلى المرايا (JSON) ومسارات
 * الفهرسة.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ISLAMIC_HISTORY_ITEMS } from "../src/data/islamic-history";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appRoot = resolve(__dirname, "..");
const CHECK = process.argv.includes("--check");

function readJson(p: string): unknown {
  return JSON.parse(readFileSync(resolve(appRoot, p), "utf8"));
}
function serialize(v: unknown): string {
  return JSON.stringify(v, null, 2) + "\n";
}

let drift = 0;
function writeOrCheck(relPath: string, nextContent: string, label: string) {
  const abs = resolve(appRoot, relPath);
  let current = "";
  try {
    current = readFileSync(abs, "utf8");
  } catch {
    /* missing */
  }
  if (current === nextContent) return;
  if (CHECK) {
    drift++;
    console.error(`✗ غير متزامن: ${label} (${relPath})`);
  } else {
    writeFileSync(abs, nextContent, "utf8");
    console.log(`✓ حُدِّث: ${label} (${relPath})`);
  }
}

function clampDesc(s: string, max = 158): string {
  const t = s.replace(/\s+/g, " ").trim();
  if (t.length <= max) return t;
  return t.slice(0, max - 1).replace(/[،,\s]+\S*$/, "") + "…";
}

const seoRoutes = readJson("src/lib/seo-routes.json") as { routes: Array<{ path: string }> };
const nonHistoryDetailRoutes = seoRoutes.routes.filter(
  (r) => !/^\/scholars\/[^/]+$/.test(r.path) && !/^\/tarikh-islami\/[^/]+$/.test(r.path),
);
const idxAfter = nonHistoryDetailRoutes.findIndex((r) => r.path === "/tarikh-islami");
const historyRoutes = ISLAMIC_HISTORY_ITEMS.map((item) => ({
  path: `/tarikh-islami/${item.id}`,
  title: `${item.title} — التاريخ الإسلامي | سُنّة`,
  description: clampDesc(item.summary),
  keywords: [item.title, item.era, "التاريخ الإسلامي", "سُنّة"].slice(0, 6),
  sitemap: true,
  changefreq: "monthly",
  priority: 0.75,
}));
const nextRoutes =
  idxAfter >= 0
    ? [
        ...nonHistoryDetailRoutes.slice(0, idxAfter + 1),
        ...historyRoutes,
        ...nonHistoryDetailRoutes.slice(idxAfter + 1),
      ]
    : [...nonHistoryDetailRoutes, ...historyRoutes];
seoRoutes.routes = nextRoutes;
writeOrCheck("src/lib/seo-routes.json", serialize(seoRoutes), "مسارات فهرسة التاريخ الإسلامي");

if (CHECK && drift > 0) {
  console.error(`\n✗ ${drift} مرآة غير متزامنة — شغّل: pnpm run sync:seo-data`);
  process.exit(1);
}
console.log(
  CHECK
    ? "✓ جميع مرايا SEO متزامنة"
    : `✓ تمت المزامنة — ${historyRoutes.length} عنصر تاريخ`,
);
