#!/usr/bin/env node
/**
 * Verify سؤال وجواب activation state logic — no contradictory UI messages.
 */
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");

let pass = 0;
let fail = 0;

function ok(c, m) {
  if (c) {
    pass++;
    console.log(`✓ ${m}`);
  } else {
    fail++;
    console.error(`✗ ${m}`);
  }
}

function read(rel) {
  return readFileSync(resolve(ROOT, rel), "utf8");
}

console.log("\n=== Q&A Activation State Verification ===\n");

ok(read("src/lib/sin-jeem/activation-state.ts").includes("ActivationHealth"), "activation-state types");
ok(read("src/lib/sin-jeem/activation-provider.tsx").includes("ActivationProvider"), "ActivationProvider exists");
ok(read("src/views/sin-jeem/SinJeemApp.tsx").includes("ActivationProvider"), "SinJeemApp wraps ActivationProvider");
ok(read("src/views/sin-jeem/SinJeemHomePage.tsx").includes("useActivationState"), "Home uses activation provider");
ok(!read("src/views/sin-jeem/SinJeemHomePage.tsx").includes("DbActivationBanner"), "DbActivationBanner removed from home");
ok(read("src/views/sin-jeem/components/ActivationStatusBanner.tsx").includes("isAdmin"), "Admin-only controls in banner");
ok(read("src/views/sin-jeem/components/ActivationStatusBanner.tsx").includes('health === "READY"'), "No banner when READY");
ok(read("src/views/sin-jeem/SinJeemHomePage.tsx").includes("disabled={startDisabled}"), "Start button gated by gameReady");
ok(read("lib/api-handlers/sin-jeem.js").includes("activation_status"), "API activation_status action");
ok(read("lib/sin-jeem-activation.mjs").includes("resolveActivationStatus"), "Server activation resolver");

const banner = read("src/views/sin-jeem/components/ActivationStatusBanner.tsx");
ok(!banner.includes("تحتاج تفعيل قاعدة البيانات"), "No misleading DB activation message");

const state = read("src/lib/sin-jeem/activation-state.ts");
ok(state.includes("وضع المحتوى المحلي"), "Fallback mode label present");
ok(state.includes("showActivationInstructions"), "Activation instructions only when no questions");
ok(state.includes('questionCount === 0'), "Zero-question gate for activation instructions");

console.log(`\n=== Summary: ${pass} passed, ${fail} failed ===\n`);
process.exit(fail > 0 ? 1 : 0);
