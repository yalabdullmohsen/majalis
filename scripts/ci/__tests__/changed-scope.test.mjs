/**
 * اختبار وحدة لـ changed-scope
 * node --test scripts/ci/__tests__/changed-scope.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import { classifyPath, classifyScopes } from "../changed-scope.mjs";

test("classifies mushaf / content / ui / admin-ish", () => {
  assert.equal(classifyPath("artifacts/majalis/src/features/mushaf/Page.tsx"), "quran_mushaf");
  assert.equal(classifyPath("artifacts/majalis/public/data/knowledge/prophets/adam.json"), "content_data");
  assert.equal(classifyPath("artifacts/majalis/src/styles/pages/prayer-times.css"), "ui_layout");
  assert.equal(classifyPath(".github/workflows/ci.yml"), "ci_config");
  assert.equal(classifyPath("artifacts/majalis/ios/App/App.xcodeproj/project.pbxproj"), "ios_capacitor");
});

test("content-only PR does not require mushaf scope flag", () => {
  const r = classifyScopes(["artifacts/majalis/public/data/knowledge/prophets/nuh.json"]);
  assert.equal(r.outputs.scope_need_mushaf, "false");
  assert.equal(r.outputs.scope_need_data_audit, "true");
  assert.ok(r.scopes.includes("content/data"));
});

test("ui css requires color contrast scope", () => {
  const r = classifyScopes(["artifacts/majalis/src/styles/pages/home.css"]);
  assert.equal(r.outputs.scope_need_color_contrast, "true");
  assert.equal(r.outputs.scope_need_mushaf, "false");
  assert.equal(r.checks.ui, true);
});

test("docs-only skips visual/lighthouse checks", () => {
  const r = classifyScopes(["docs/CI_THROUGHPUT.md", "README.md"]);
  assert.equal(r.docsOnly, true);
  assert.equal(r.outputs.scope_docs_only, "true");
  assert.equal(r.checks.visual, false);
  assert.equal(r.checks.build, false);
});

test("pwa path triggers pwa checks only", () => {
  const r = classifyScopes(["artifacts/majalis/public/sw.js"]);
  assert.equal(r.checks.pwa, true);
});
