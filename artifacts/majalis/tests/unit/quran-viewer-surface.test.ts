/**
 * Smoke checks for QuranViewer module surface (no DOM).
 * Run: npx tsx tests/unit/quran-viewer-surface.test.ts
 */
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let passed = 0;
let failed = 0;

function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const root = resolve(import.meta.dirname, "../..");
const viewer = readFileSync(resolve(root, "src/components/QuranViewer.tsx"), "utf8");
const page = readFileSync(resolve(root, "src/views/QuranViewerPage.tsx"), "utf8");
const app = readFileSync(resolve(root, "src/App.tsx"), "utf8");
const ctx = readFileSync(resolve(root, "src/core/quran/QuranEngineContext.ts"), "utf8");

console.log("═══ QuranViewer surface ═══");
check(viewer.includes("useQuranEngineCore"), "uses QuranEngineContext hook");
check(viewer.includes("activePage"), "reads activePage");
check(viewer.includes("updateReadingProgress"), "persists via updateReadingProgress");
check(viewer.includes("MushafPageV2"), "renders Madani MushafPageV2");
check(viewer.includes("onTouchStart") && viewer.includes("onTouchEnd"), "native swipe handlers");
check(viewer.includes("onAyahSelect") && viewer.includes("onAyahPress"), "ayah tap → callback");
check(viewer.includes("prefetchMushafPage"), "lazy/prefetch neighbors");
check(viewer.includes("PageCurlStage"), "transform page transition");
check(page.includes("QuranViewer"), "page wrapper mounts QuranViewer");
check(app.includes("/quran-viewer"), "App route registered");
check(ctx.includes("goToAyah") && ctx.includes("activePage"), "context exposes goToAyah + activePage");

console.log(`\nالنتيجة: ${passed} نجح، ${failed} فشل`);
if (failed > 0) process.exit(1);
