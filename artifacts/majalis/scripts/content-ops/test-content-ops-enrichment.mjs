import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  stripLeadingSpaceDuplicates,
  detectTechnicalIssues,
  classifyEnrichmentAction,
} from "../../lib/content-ops/enrichment-audit.mjs";
import { runFullInventory, summarizeInventory } from "../../lib/content-ops/inventory.mjs";
import {
  BRAND,
  isAutoPublishEnabled,
  isProtectedTarget,
  createChangeSet,
  assertChangeSetPublishable,
  createVersionStore,
  shouldRollback,
} from "../../lib/content-ops/index.mjs";

describe("enrichment Path-C auditors", () => {
  it("strips leading-space duplicate sentences only", () => {
    const body =
      "والحكمة جامعة. فقراءة القصة تُرجع القلب إلى التوحيد قبل الغرائب.\n فقراءة القصة تُرجع القلب إلى التوحيد قبل الغرائب.\n## قسم";
    const { text, removed } = stripLeadingSpaceDuplicates(body);
    assert.equal(removed, 1);
    assert.equal(text.includes("\n فقراءة"), false);
    assert.ok(text.includes("فقراءة القصة تُرجع القلب"));
  });

  it("blocks placeholders and classifies protected content", () => {
    const issues = detectTechnicalIssues({
      title: "lorem ipsum draft",
      body: "TODO: content",
      id: "test",
    });
    assert.ok(issues.some((i) => i.code === "placeholder_content"));
    assert.ok(issues.some((i) => i.code === "test_id"));
    const blocked = classifyEnrichmentAction(
      { code: "missing_source", severity: "block" },
      { protectedContent: true },
    );
    assert.equal(blocked.action, "automatically_blocked");
  });

  it("keeps auto-publish disabled and protects quran paths", () => {
    assert.equal(isAutoPublishEnabled(), false);
    assert.equal(isProtectedTarget({ path: "public/data/quran/surah-001.json" }), true);
    assert.equal(BRAND, "سُنّة");
  });
});

describe("inventory + rollback proof", () => {
  it("inventories multiple sections with real counts", () => {
    const inv = runFullInventory({ maxFilesPerSection: 50 });
    const summary = summarizeInventory(inv);
    assert.ok(summary.sectionCount >= 40);
    assert.ok(summary.totalRecords > 0);
    assert.equal(typeof summary.incompleteRecords, "number");
  });

  it("rollback is idempotent and isolates user data", () => {
    const cs = createChangeSet({
      previousVersion: "v0",
      changes: [
        {
          changeId: "c1",
          changeKind: "trim_whitespace",
          path: "x.json",
          before: "a",
          after: "b",
          level: "A",
        },
      ],
    });
    assert.equal(assertChangeSetPublishable(cs).ok, true);
    const store = createVersionStore({
      currentVersion: "v0",
      content: { n: 1 },
      userData: { progress: 9 },
    });
    store.publish(cs, { n: 2 });
    const decision = shouldRollback({ searchBroken: true });
    assert.equal(decision.rollback, true);
    const rb = store.rollback(cs, decision.reason);
    assert.equal(rb.ok, true);
    assert.equal(store.getUserData().progress, 9);
    const rb2 = store.rollback(cs, decision.reason);
    assert.equal(rb2.idempotent, true);
  });
});
