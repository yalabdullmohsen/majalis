/**
 * Phase 9 — expanded unit / regression coverage for shared domain helpers.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ok, err, type AppResult } from "../../shared/architecture.ts";
import {
  normalizeArabic,
  toWesternDigits,
  normalizedIncludes,
  clearNormalizeArabicCache,
} from "../../shared/arabic-normalize.ts";
import { sanitizeLogFields } from "../structured-logger.ts";

function unwrapOk<T>(result: AppResult<T>): T {
  assert.equal(result.ok, true);
  if (!result.ok) throw new Error("unreachable");
  return result.value;
}

{
  const success = ok({ id: 1 });
  assert.equal(unwrapOk(success).id, 1);
  const failure = err("missing");
  assert.equal(failure.ok, false);
  if (!failure.ok) assert.equal(failure.error, "missing");
}

{
  clearNormalizeArabicCache();
  assert.equal(toWesternDigits("١٢٣"), "123");
  const a = normalizeArabic("الْحَمْدُ");
  const b = normalizeArabic("الحمد");
  assert.equal(a, b);
  assert.equal(normalizedIncludes("بسم الله الرحمن الرحيم", "الرحمن"), true);
  assert.equal(normalizedIncludes("بسم الله", "غير"), false);
}

{
  const cleaned = sanitizeLogFields({
    route: "/lessons",
    Authorization: "Bearer secret-token",
    api_key: "abc",
    count: 3,
  });
  assert.equal(cleaned?.route, "/lessons");
  assert.equal(cleaned?.Authorization, "[redacted]");
  assert.equal(cleaned?.api_key, "[redacted]");
  assert.equal(cleaned?.count, 3);
}

{
  const root = join(dirname(fileURLToPath(import.meta.url)), "../../..");
  const vercel = readFileSync(join(root, "vercel.json"), "utf8");
  const server = readFileSync(join(root, "server/index.mjs"), "utf8");
  const prefixes = [
    "/rulings",
    "/fiqh-council",
    "/academic-research",
    "/updates/auto",
    "/fiqh",
    "/quran-engine",
  ];
  for (const p of prefixes) {
    assert.match(server, new RegExp(`"${p.replace(/\//g, "\\/")}"`), `SPA_PREFIXES missing ${p}`);
    assert.match(vercel, new RegExp(p.replace(/\//g, "\\/")), `vercel rewrite missing ${p}`);
  }
}

console.log("phase9-testing: ok");
