/**
 * حارس خصائص CSS الفيزيائية في صفحات عامة مُحوَّلة إلى logical.
 * تشغيل: npx tsx src/lib/__tests__/views-logical-css-guard.test.ts
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const appRoot = join(here, "../../..");

/** ملفات يجب ألا تحتوي خصائص فيزيائية شائعة بعد التحويل */
const CONVERTED_PATHS = [
  "src/styles/pages/surah-index.css",
  "src/views/TarikhIslamiPage.tsx",
  "src/pages/hadith/SunnahStudiesPage.tsx",
  "src/views/SujoodSahwPage.tsx",
  "src/views/AmradQalbiyyaPage.tsx",
  "src/views/MethodologyPage.tsx",
  "src/views/SinsAndRightsDetailPage.tsx",
  "src/views/MindMapPage.tsx",
  "src/views/TarikhIslamiDetailPage.tsx",
  "src/views/MutashabihatPage.tsx",
] as const;

const INLINE_PHYSICAL =
  /\b(?:margin|padding|border)(?:Left|Right)\b|textAlign:\s*["'](?:left|right)["']/;
const CLASS_PHYSICAL = /\bborder-[lr]-\d/;
const CSS_PHYSICAL =
  /\b(?:margin|padding)-(?:left|right)\s*:|(?:^|[^-])border-(?:left|right)\s*:|text-align:\s*(?:left|right)\b/;

for (const rel of CONVERTED_PATHS) {
  const src = readFileSync(join(appRoot, rel), "utf8");
  assert.doesNotMatch(
    src,
    INLINE_PHYSICAL,
    `${rel}: inline style still uses physical margin/padding/border or textAlign left/right`,
  );
  assert.doesNotMatch(
    src,
    CLASS_PHYSICAL,
    `${rel}: className still uses border-l-* or border-r-* (use border-s-* / border-e-*)`,
  );
  if (rel.endsWith(".css")) {
    assert.doesNotMatch(
      src,
      CSS_PHYSICAL,
      `${rel}: CSS still uses physical margin/padding/border or text-align left/right`,
    );
  }
}

// فهرس السور: حشوة متوازنة على المحور المنطقي
{
  const css = readFileSync(join(appRoot, "src/styles/pages/surah-index.css"), "utf8");
  assert.match(
    css,
    /\.surah-index-row\s*\{[^}]*padding-inline:\s*0\.15rem;/s,
    "surah-index row padding-inline should be symmetric (no edge stick)",
  );
}

console.log(`views-logical-css-guard: ${CONVERTED_PATHS.length} paths OK`);
