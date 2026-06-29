#!/usr/bin/env node
/**
 * Phase 1B IA & Premium UI verification
 * Run: pnpm --filter @workspace/majalis run verify:ia-premium-ui
 */

import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");

let passed = 0;
let failed = 0;

function assert(cond, msg) {
  if (cond) {
    passed++;
    console.log(`  ✓ ${msg}`);
  } else {
    failed++;
    console.error(`  ✗ ${msg}`);
  }
}

function read(rel) {
  const p = join(ROOT, rel);
  assert(existsSync(p), `file exists: ${rel}`);
  return readFileSync(p, "utf8");
}

console.log("\n=== Phase 1B — IA & Premium UI Verification ===\n");

console.log("Phase 1 — Information Architecture");
const nav = read("src/lib/navigation.ts");
assert(nav.includes("القرآن الكريم"), "Quran IA group");
assert(nav.includes("العلوم الشرعية"), "Sharia sciences group");
assert(nav.includes("التعلّم"), "Learning group");
assert(nav.includes("العبادة اليومية"), "Worship group");
assert(nav.includes("الخدمات"), "Services group");
assert(nav.includes("FOOTER_IA_GROUPS"), "Footer IA aligned");
assert((nav.match(/id: "/g) || []).length >= 5, "5+ nav groups");

console.log("\nPhase 2 — Islamic UI ornaments");
const ornament = read("src/components/islamic/IslamicOrnament.tsx");
assert(ornament.includes("IslamicGeometricPattern"), "geometric pattern SVG");
assert(ornament.includes("IslamicDivider"), "section divider");
assert(existsSync(join(ROOT, "src/styles/islamic-ui.css")), "islamic-ui.css");

console.log("\nPhase 3 — Color refinement");
const ds = read("src/styles/design-system.css");
assert(ds.includes("#f0e9dc") || ds.includes("#F0E9DC"), "darker parchment token");
const idx = read("src/index.css");
assert(idx.includes("#F0E9DC") || idx.includes("#f0e9dc"), "index parchment updated");

console.log("\nPhase 4 — Homepage structure");
const home = read("src/views/HomePage.tsx");
assert(home.includes("HomeFeatureCards"), "quick access section");
assert(home.includes("HomeResearchSection"), "research section");
assert(home.includes("HomeCirclesSection"), "circles section");
assert(home.includes("HomeSheikhsSection"), "sheikhs section");
assert(home.includes("HomePlatformStats"), "stats section");
assert(home.includes("IslamicGeometricPattern"), "hero ornament");

console.log("\nPhase 5 — Unified cards & Lucide icons");
const feature = read("src/components/home/HomeFeatureCards.tsx");
assert(feature.includes("lucide-react"), "Lucide in feature cards");
assert(!feature.includes("emoji"), "no emoji in feature cards");
const library = read("src/components/home/HomeFeaturedLibrary.tsx");
assert(library.includes("BookOpen"), "library uses Lucide not emoji");
assert(!library.includes("📖"), "emoji removed from library");

console.log("\nPhase 6 — Footer & drawer");
const footer = read("src/components/SiteFooter.tsx");
assert(footer.includes("FOOTER_IA_GROUPS"), "footer uses IA groups");
assert(footer.includes("IslamicDivider"), "footer ornament");
const drawer = read("src/components/SideNavDrawer.tsx");
assert(drawer.includes("/question-answer"), "drawer Q&A route");
assert(drawer.includes("/research"), "drawer research route");

console.log("\nPhase 7 — CSS import chain");
const main = read("src/main.tsx");
assert(main.includes("islamic-ui.css"), "islamic-ui imported");

console.log(`\n=== Results: ${passed} passed, ${failed} failed ===\n`);
process.exit(failed > 0 ? 1 : 0);
