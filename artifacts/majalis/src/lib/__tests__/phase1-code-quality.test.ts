/**
 * Phase 1 code-quality invariants: year helper, official-source predicate, cycle removal.
 */
import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import {
  FIQH_YEAR_WINDOW,
  fiqhYearFilterOptions,
} from "../fiqh-year-options.ts";
import { isOfficialSourceVerified } from "../fiqh-official-source.ts";
import {
  QURAN_APP_FONT_DEFAULT,
  QURAN_APP_FONT_MAX,
  QURAN_APP_FONT_MIN,
} from "../quran-app-constants.ts";

const here = dirname(fileURLToPath(import.meta.url));
const libDir = join(here, "..");

// Fiqh year helper
{
  const years = fiqhYearFilterOptions(2030);
  assert.equal(years[0], "الكل");
  assert.equal(years.length, FIQH_YEAR_WINDOW + 1);
  assert.equal(years[1], "2030");
  assert.equal(years[years.length - 1], String(2030 - (FIQH_YEAR_WINDOW - 1)));
}

// Official source predicate
{
  assert.equal(
    isOfficialSourceVerified({
      source_name: "مرجع موثّق",
      source_url: "https://example.com/x",
      confidence_level: "source_verified",
    }),
    true,
  );
  assert.equal(
    isOfficialSourceVerified({
      source_name: "مرجع موثّق",
      source_url: "https://example.com/x",
      confidence_level: "draft",
    }),
    false,
  );
}

// Quran font constants stay within immersive bounds
{
  assert.ok(QURAN_APP_FONT_MIN < QURAN_APP_FONT_DEFAULT);
  assert.ok(QURAN_APP_FONT_DEFAULT < QURAN_APP_FONT_MAX);
}

// Council product modules must stay deleted (no reintroduction cycle)
assert.equal(existsSync(join(libDir, "fiqh-council-trust.ts")), false);
assert.equal(existsSync(join(libDir, "fiqh-verification-service.ts")), false);
assert.equal(existsSync(join(libDir, "fiqh-council-seed.ts")), false);

{
  const storage = readFileSync(join(libDir, "majlis-local-storage-service.ts"), "utf8");
  assert.match(storage, /from ["']@\/lib\/quran-app-constants["']/);
  assert.match(storage, /import type \{ QuranAppController \} from ["']@\/lib\/quran-app-controller["']/);
  assert.doesNotMatch(
    storage,
    /import \{[^}]*QURAN_APP_FONT_(?:MIN|MAX|DEFAULT)[^}]*\} from ["']@\/lib\/quran-app-controller["']/,
  );
}
{
  const audit = readFileSync(join(libDir, "cms/audit-log.ts"), "utf8");
  assert.match(audit, /supabase-bootstrap/);
  assert.doesNotMatch(audit, /from ["']@\/lib\/supabase["']/);
}
{
  const explore = readFileSync(join(libDir, "explore-links.ts"), "utf8");
  assert.match(explore, /explore-link-types/);
  assert.doesNotMatch(explore, /ExploreAlsoNav/);
}

console.log("phase1-code-quality: ok");
