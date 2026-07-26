/**
 * فحص سلامة الرسم المعرفي الموحّد — يُشغَّل عبر:
 * node --import tsx scripts/test-entity-graph.mjs
 * أو ضمن بوابة البناء عند التوفر.
 */
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

// Vite/TS path aliases غير متاحة هنا — نستدعي البناء عبر tsx dynamic import من src
const mod = await import(path.join(root, "src/lib/entity-graph/index.ts"));

const { getEntityGraph, graphStats, searchEntityGraph, resolveRouteEntity, resetEntityGraphCache } = mod;

resetEntityGraphCache();
const stats = graphStats();
const graph = getEntityGraph();

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error("FAIL:", msg);
    failed += 1;
  } else {
    console.log("OK:", msg);
  }
}

assert(stats.nodes > 100, `nodes > 100 (got ${stats.nodes})`);
assert(stats.edges > 200, `edges > 200 (got ${stats.edges})`);

const bukhari = graph.byHref.get("/library/book-bukhari");
assert(!!bukhari, "book-bukhari indexed");
const abuHanifa = graph.byHref.get("/scholars/abu-hanifa");
assert(!!abuHanifa, "abu-hanifa indexed");

const adamCtx = resolveRouteEntity("/prophets/adam");
assert(!!adamCtx.entity, "adam entity resolved");
assert(adamCtx.breadcrumbs.length >= 2, "adam breadcrumbs");
assert(!!adamCtx.next, "adam has next prophet");
assert(adamCtx.sections.length >= 1, "adam has connection sections");

const hits = searchEntityGraph("البخاري", 10);
assert(hits.some((h) => h.href.includes("bukhari") || h.title.includes("بخاري")), "search finds bukhari");
assert(hits.some((h) => h.reason === "neighbor" || h.kind === "scholar" || h.kind === "book"), "search returns related kinds");

const broken = [];
for (const node of graph.nodes.values()) {
  if (!node.href.startsWith("/")) broken.push(node.id);
}
assert(broken.length === 0, `all hrefs absolute paths (bad: ${broken.slice(0, 3)})`);

if (failed) {
  console.error(`\n${failed} assertion(s) failed`);
  process.exit(1);
}
console.log(`\nEntity graph OK — ${stats.nodes} nodes, ${stats.edges} edges`);
