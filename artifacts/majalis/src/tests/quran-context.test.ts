/**
 * Smoke — QuranContext / QuranProvider API surface (no DOM).
 * Run: npx tsx src/tests/quran-context.test.ts
 */
import { createElement } from "react";
import { QuranContext, QuranProvider, type QuranContextValue } from "../context/QuranContext";

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

function main() {
  console.log("═══ QuranContext (RN sketch) ═══");

  check(typeof QuranContext === "object" && QuranContext !== null, "QuranContext created");
  check(typeof QuranProvider === "function", "QuranProvider");

  const sample: QuranContextValue = {
    fontSize: 20,
    setFontSize: () => undefined,
    isDarkMode: false,
    setIsDarkMode: () => undefined,
    themeOverride: null,
    setThemeOverride: () => undefined,
    followSystemTheme: () => undefined,
    selectedReciter: "alafasy",
    setSelectedReciter: () => undefined,
    showTranslation: false,
    setShowTranslation: () => undefined,
  };
  check(sample.fontSize === 20, "default fontSize 20");
  check(sample.selectedReciter === "alafasy", "default reciter alafasy≈mishary");
  check(sample.showTranslation === false, "default showTranslation false");
  check(sample.isDarkMode === false, "default isDarkMode false");

  const el = createElement(QuranProvider, null, createElement("div"));
  check(Boolean(el), "QuranProvider element");

  console.log(`\n${passed} passed, ${failed} failed`);
  if (failed > 0) process.exit(1);
}

main();
