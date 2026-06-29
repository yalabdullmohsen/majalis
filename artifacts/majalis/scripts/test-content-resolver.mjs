#!/usr/bin/env node
/**
 * Unit tests for content ID normalization, URL building, and resolver logic.
 * Usage: node scripts/test-content-resolver.mjs
 */

function normalizeRouteParam(raw) {
  if (!raw) return "";
  let value = String(raw).trim();
  for (let i = 0; i < 3; i += 1) {
    try {
      const decoded = decodeURIComponent(value);
      if (decoded === value) break;
      value = decoded;
    } catch {
      break;
    }
  }
  return value.replace(/\/+$/, "");
}

function encodeRouteSegment(id) {
  const normalized = normalizeRouteParam(id);
  if (!normalized) return "";
  return encodeURIComponent(normalized);
}

function expandContentIdentifiers(raw) {
  const normalized = normalizeRouteParam(raw);
  if (!normalized) return [];
  const candidates = new Set([normalized, String(raw || "").trim()]);
  try {
    candidates.add(encodeURIComponent(normalized));
  } catch {
    /* ignore */
  }
  if (normalized.includes(":")) {
    const colonIdx = normalized.indexOf(":");
    const prefix = normalized.slice(0, colonIdx);
    const suffix = normalized.slice(colonIdx + 1);
    if (suffix) {
      candidates.add(suffix);
      candidates.add(`${prefix}:${suffix}`);
    }
  }
  return [...candidates].filter(Boolean);
}

function matchesContentIdentifier(recordId, rawParam) {
  const id = String(recordId || "").trim();
  if (!id) return false;
  return expandContentIdentifiers(rawParam).some((candidate) => candidate === id);
}

function buildLessonUrl(lesson) {
  const id = normalizeRouteParam(lesson.external_key || lesson.id);
  const encoded = encodeRouteSegment(id);
  return encoded ? `/lessons/${encoded}` : "/lessons";
}

let failed = 0;

function assert(condition, message) {
  if (!condition) {
    console.error(`✗ ${message}`);
    failed += 1;
  } else {
    console.log(`✓ ${message}`);
  }
}

const colonId = "kuwait-lessons:7b923f5b0be018325687e73a1d9abc";
const encodedColon = encodeURIComponent(colonId);

assert(normalizeRouteParam(encodedColon) === colonId, "decode encoded colon id");
assert(expandContentIdentifiers(encodedColon).includes(colonId), "expand encoded colon id");
assert(buildLessonUrl({ id: colonId }) === `/lessons/${encodedColon}`, "buildLessonUrl encodes colon");
assert(matchesContentIdentifier(colonId, encodedColon), "matches encoded to raw colon id");
assert(buildLessonUrl({ id: "kw-salem-0" }) === "/lessons/kw-salem-0", "build kw legacy url");
assert(normalizeRouteParam("  abc  ") === "abc", "trim route param");

if (failed) {
  console.error(`\n${failed} assertion(s) failed.`);
  process.exit(1);
}

console.log("\nAll content resolver unit tests passed.");
