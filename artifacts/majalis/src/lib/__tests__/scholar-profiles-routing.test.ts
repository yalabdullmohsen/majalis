/**
 * توجيه /scholars — مالك/نووي صفحات علماء لا مذاهب/أربعين.
 * npx tsx src/lib/__tests__/scholar-profiles-routing.test.ts
 */
import assert from "node:assert/strict";
import {
  resolveScholarSlug,
  SCHOLAR_GONE_SLUGS,
} from "@/data/scholars-profiles";
import { redirectScholarPath } from "@/lib/scholar-to-history-redirect";

assert.equal(resolveScholarSlug("malik").kind, "profile");
assert.equal(resolveScholarSlug("nawawi").kind, "profile");
assert.equal(redirectScholarPath("malik"), "/scholars/malik");
assert.equal(redirectScholarPath("nawawi"), "/scholars/nawawi");

assert.equal(resolveScholarSlug("imam-malik").kind, "alias");
assert.equal(resolveScholarSlug("imam-malik").slug, "malik");
assert.equal(resolveScholarSlug("al-nawawi").slug, "nawawi");

assert.equal(resolveScholarSlug("ibn-uthaymeen-older").kind, "gone");
assert.equal(redirectScholarPath("ibn-uthaymeen-older"), null);
assert.ok(SCHOLAR_GONE_SLUGS.has("ibn-al-qayyim-alt"));

assert.equal(resolveScholarSlug("not-a-real-scholar-xyz").kind, "missing");
assert.equal(redirectScholarPath("not-a-real-scholar-xyz"), null);

console.log("scholar-profiles-routing: ok");
