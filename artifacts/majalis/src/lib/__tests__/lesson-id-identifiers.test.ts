/**
 * UUID vs slug identifier helpers.
 */
import assert from "node:assert/strict";
import { isUuid, normalizeSlug, classifyIdentifier } from "../identifiers/lesson-id.ts";

assert.equal(isUuid("c74030fe-fdb9-4bce-8585-48b12a2ab902"), true);
assert.equal(isUuid("kuwait-lessons-c74030fefdb99bce588548b12a2ab902"), false);
assert.equal(classifyIdentifier("anwar-women-fiqh"), "slug");
assert.equal(classifyIdentifier("kw-rasid-alsolayhim-tasiliyya-0"), "slug");
assert.equal(classifyIdentifier("../etc/passwd"), "invalid");
assert.equal(normalizeSlug("  Anwar  Women "), "anwar-women");
assert.equal(classifyIdentifier("c74030fe-fdb9-4bce-8585-48b12a2ab902"), "uuid");

console.log("lesson-id-identifiers: ok");
