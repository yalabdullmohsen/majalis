/**
 * Enterprise security gates — rate-limit wiring, webhook fail-closed, CORS allowlist,
 * submissions error sanitization, migration inventory includes hardening SQL,
 * PostgREST filter escaping, healthz redaction, COOP headers.
 */
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { API_ROUTES } from "../api-dispatch.mjs";
import { MIGRATION_FILES } from "../migration-paths.mjs";
import {
  escapeIlikeWildcards,
  ilikeContains,
  isUuid,
  postgrestOrIlike,
  quotePostgrestFilterValue,
} from "../api/postgrest-escape.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "../..");

function ok(msg) {
  console.log(`  ✓ ${msg}`);
}

console.log("=== enterprise-security-gates ===\n");

const adminRoutes = API_ROUTES.filter((r) => r.prefix.startsWith("/api/admin/"));
assert.ok(adminRoutes.length > 0, "expected admin routes");
for (const r of adminRoutes) {
  assert.ok(r.rateLimit, `admin route missing rateLimit: ${r.prefix}`);
}
ok(`${adminRoutes.length} admin routes have rateLimit`);

const searchFamily = [
  "/api/search",
  "/api/intelligent-search",
  "/api/scholarly-search",
  "/api/knowledge-search",
  "/api/knowledge-recommendations",
  "/api/topic-content",
  "/api/content-relations",
];
for (const prefix of searchFamily) {
  const route = API_ROUTES.find((r) => r.prefix === prefix);
  assert.ok(route?.rateLimit, `${prefix} must have rateLimit`);
}
ok(`${searchFamily.length} search-family routes rate-limited`);

const tg = API_ROUTES.find((r) => r.prefix === "/api/webhook/telegram");
assert.ok(tg?.rateLimit, "/api/webhook/telegram must have rateLimit");
ok("/api/webhook/telegram rate-limited");

const lp = API_ROUTES.find((r) => r.prefix === "/api/learning-path");
assert.ok(lp?.rateLimit, "/api/learning-path must have rateLimit");
ok("/api/learning-path rate-limited");

const telegramSrc = readFileSync(join(root, "lib/api-handlers/webhook/telegram.js"), "utf8");
assert.match(telegramSrc, /webhook_misconfigured/);
assert.match(telegramSrc, /TELEGRAM_WEBHOOK_SECRET/);
assert.match(telegramSrc, /isProductionLikeEnv|VERCEL_ENV/);
ok("telegram webhook fails closed without secret in production-like env");

const searchSrc = readFileSync(join(root, "lib/api-handlers/search.js"), "utf8");
assert.match(searchSrc, /https:\/\/majlisilm\.com/);
assert.match(searchSrc, /https:\/\/www\.majlisilm\.com/);
assert.match(searchSrc, /postgrestOrIlike|ilikeContains/);
assert.doesNotMatch(searchSrc, /title\.ilike\.%\$\{/);
ok("search CORS allowlist + PostgREST filter escaping");

const submissionsSrc = readFileSync(join(root, "lib/api-handlers/submissions.js"), "utf8");
assert.doesNotMatch(submissionsSrc, /error:\s*error\.message/);
assert.match(submissionsSrc, /insert_failed/);
ok("submissions does not echo raw DB error.message");

const healthzSrc = readFileSync(join(root, "lib/api-handlers/healthz.js"), "utf8");
assert.match(healthzSrc, /redactSecretGroups|missingCount/);
assert.doesNotMatch(healthzSrc, /error:\s*err\.message/);
ok("healthz full probe redacts secret names");

const kgSrc = readFileSync(join(root, "lib/api-handlers/knowledge-graph.js"), "utf8");
assert.match(kgSrc, /isUuid/);
ok("knowledge-graph validates UUID node ids");

const sidebarSrc = readFileSync(join(root, "src/components/ui/sidebar.tsx"), "utf8");
assert.match(sidebarSrc, /SameSite=Lax/);
assert.match(sidebarSrc, /Secure/);
ok("sidebar preference cookie sets SameSite + Secure on HTTPS");

const serverSrc = readFileSync(join(root, "server/index.mjs"), "utf8");
assert.match(serverSrc, /Content-Security-Policy/);
assert.match(serverSrc, /Strict-Transport-Security/);
assert.match(serverSrc, /geolocation=\(self\)/);
assert.match(serverSrc, /Cross-Origin-Opener-Policy/);
assert.match(serverSrc, /X-DNS-Prefetch-Control/);
assert.doesNotMatch(serverSrc, /X-XSS-Protection/);
assert.match(serverSrc, /healthzHandler|api-handlers\/healthz/);
ok("Express security headers + shared healthz handler");

const vercel = JSON.parse(readFileSync(join(root, "vercel.json"), "utf8"));
const headerKeys = new Set(
  (vercel.headers || []).flatMap((h) => (h.headers || []).map((x) => x.key)),
);
for (const key of [
  "Content-Security-Policy",
  "Strict-Transport-Security",
  "X-Frame-Options",
  "X-Content-Type-Options",
  "Referrer-Policy",
  "Permissions-Policy",
  "Cross-Origin-Opener-Policy",
]) {
  assert.ok(headerKeys.has(key), `vercel.json missing header ${key}`);
}
ok("vercel.json ships core security headers including COOP");

assert.ok(
  MIGRATION_FILES.includes("platform_hardening_security_v1.sql"),
  "platform_hardening_security_v1.sql must be in MIGRATION_FILES inventory",
);
assert.ok(MIGRATION_FILES.includes("p0_security_definer_grants_v2.sql"));
ok("hardening SQL files listed in migration inventory (docs-only apply)");

// postgrest-escape unit checks
assert.equal(escapeIlikeWildcards("a%b_c"), String.raw`a\%b\_c`);
assert.ok(quotePostgrestFilterValue("a,b").startsWith('"'));
assert.match(postgrestOrIlike("title", "صلاة"), /^title\.ilike\."/);
assert.ok(!postgrestOrIlike("title", "a,b").includes(",a,b"));
assert.ok(ilikeContains("x").startsWith("%") && ilikeContains("x").endsWith("%"));
assert.ok(isUuid("550e8400-e29b-41d4-a716-446655440000"));
assert.ok(!isUuid("not-a-uuid"));
ok("postgrest-escape helpers reject filter injection patterns");

console.log("\nAll enterprise security gates passed.\n");
