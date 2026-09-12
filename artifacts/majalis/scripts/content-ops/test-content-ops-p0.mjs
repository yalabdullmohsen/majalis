/**
 * Content Ops P0 — unit tests (node:test).
 * Covers: language-safe A, quotes/names, protected C, events-ish A archive,
 * dedupe policy, publish gates A/B/C, rollback, data integrity hooks.
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  BRAND,
  listSources,
  isSourceApproved,
  isForbiddenSourceClass,
  rankSources,
  isProtectedTarget,
  rejectProtectedModification,
  classifyRisk,
  evaluateChange,
  gateChangeSet,
  isAutoPublishEnabled,
  createChangeSet,
  assertChangeSetPublishable,
  createVersionStore,
  shouldRollback,
  validateFetchUrl,
  sanitizeEditorialHtml,
  redactSecrets,
  assertServiceScope,
  runP0Cycle,
  PIPELINE_STAGES,
} from "../../lib/content-ops/index.mjs";

describe("Content Ops P0 — brand & registries", () => {
  it("uses سُنّة brand constant", () => {
    assert.equal(BRAND, "سُنّة");
  });

  it("loads enabled sources and rejects unknown", () => {
    const enabled = listSources({ enabledOnly: true });
    assert.ok(enabled.length >= 1);
    assert.equal(isSourceApproved("sunnah-official-site"), true);
    assert.equal(isSourceApproved("no-such-source"), false);
    assert.equal(isSourceApproved("alquran-cloud"), false); // disabled readonly
  });

  it("marks forbidden source classes", () => {
    assert.equal(isForbiddenSourceClass("forums"), true);
    assert.equal(isForbiddenSourceClass("official_direct"), false);
  });

  it("ranks official above secondary", () => {
    const ranked = rankSources([
      { sourceType: "trusted_secondary", trustLevel: 80 },
      { sourceType: "official_direct", trustLevel: 100 },
    ]);
    assert.equal(ranked[0].sourceType, "official_direct");
  });
});

describe("Protected content", () => {
  it("detects quran path", () => {
    assert.equal(
      isProtectedTarget({ path: "public/data/quran/surah-001.json" }),
      true,
    );
  });

  it("detects hadith table / content type", () => {
    assert.equal(isProtectedTarget({ table: "verified_hadith_items" }), true);
    assert.equal(isProtectedTarget({ contentType: "hadith" }), true);
  });

  it("rejects modification attempts", () => {
    const r = rejectProtectedModification({
      path: "public/data/quran/surah-002.json",
      field: "ayah_text",
    });
    assert.equal(r.rejected, true);
    assert.equal(r.status, "needs_specialist_review");
  });

  it("allows non-protected UI path", () => {
    assert.equal(
      isProtectedTarget({ path: "src/components/NavBar.tsx", field: "label" }),
      false,
    );
  });
});

describe("Risk classification A/B/C", () => {
  it("classifies safe UI whitespace as A", () => {
    const r = classifyRisk({
      changeKind: "trim_whitespace",
      path: "src/i18n/ui-ar.json",
      field: "button_save",
      before: "  حفظ  ",
      after: "حفظ",
      highConfidence: true,
      reversible: true,
    });
    assert.equal(r.level, "A");
    assert.equal(r.mayAutoPublish, true);
  });

  it("does not treat quotes as A", () => {
    const r = classifyRisk({
      changeKind: "clear_spelling_non_sacred",
      isQuote: true,
      before: "قال العالم...",
      after: "قال العالِم...",
      highConfidence: true,
    });
    assert.equal(r.level, "B");
    assert.equal(r.mayAutoPublish, false);
  });

  it("does not auto-change person names", () => {
    const r = classifyRisk({
      changeKind: "clear_spelling_non_sacred",
      isPersonName: true,
      highConfidence: true,
    });
    assert.equal(r.level, "B");
  });

  it("forces C on mushaf / hadith kinds", () => {
    assert.equal(classifyRisk({ changeKind: "quran_text" }).level, "C");
    assert.equal(classifyRisk({ changeKind: "hadith_matn" }).level, "C");
    assert.equal(classifyRisk({ changeKind: "fiqh_ruling" }).level, "C");
  });

  it("isolates broad editorial as B", () => {
    const r = classifyRisk({
      changeKind: "broad_editorial_rewrite",
      highConfidence: true,
    });
    assert.equal(r.level, "B");
    assert.equal(r.mayAutoPublish, false);
  });

  it("downgrades A on source conflict", () => {
    const r = classifyRisk({
      changeKind: "archive_event_with_clear_end_date",
      highConfidence: true,
      hasSourceConflict: true,
    });
    assert.equal(r.level, "B");
  });
});

describe("Safe change policy / publish gate", () => {
  it("keeps auto-publish disabled in P0", () => {
    assert.equal(isAutoPublishEnabled(), false);
  });

  it("holds level A (no production publish)", () => {
    const e = evaluateChange({
      changeKind: "tech_metadata_fix",
      highConfidence: true,
      reversible: true,
      path: "src/lib/site-meta.ts",
    });
    assert.equal(e.classification.level, "A");
    assert.equal(e.publish, false);
    assert.equal(e.decision, "hold_p0");
  });

  it("isolates level B", () => {
    const e = evaluateChange({
      changeKind: "institution_blurb_update",
      highConfidence: true,
    });
    assert.equal(e.decision, "isolate");
    assert.equal(e.publish, false);
  });

  it("rejects level C", () => {
    const e = evaluateChange({
      changeKind: "takhrij",
      path: "public/data/hadith/bukhari.json",
    });
    assert.equal(e.decision, "reject");
    assert.equal(e.publish, false);
  });

  it("quarantines when daily limit exceeded", () => {
    const e = evaluateChange(
      {
        changeKind: "trim_whitespace",
        highConfidence: true,
        reversible: true,
      },
      { cycleModifiedCount: 50 },
    );
    assert.equal(e.decision, "quarantine");
    assert.equal(e.publish, false);
  });

  it("gates mixed change set — no publish", () => {
    const g = gateChangeSet([
      { changeKind: "trim_whitespace", highConfidence: true, reversible: true },
      { changeKind: "hadith_matn" },
    ]);
    assert.equal(g.publishAllowed, false);
    assert.equal(g.blockedByProtected, true);
  });
});

describe("Versioning & rollback", () => {
  it("creates change set with rollback reference", () => {
    const cs = createChangeSet({
      previousVersion: "v0",
      changes: [{ changeKind: "trim_whitespace", before: "a  ", after: "a" }],
    });
    const check = assertChangeSetPublishable(cs);
    assert.equal(check.ok, true);
    assert.equal(cs.rollbackReference.userDataIsolated, true);
    assert.ok(cs.changeSetId.startsWith("cs_"));
  });

  it("rejects empty diff", () => {
    const cs = createChangeSet({ previousVersion: "v0", changes: [] });
    assert.equal(assertChangeSetPublishable(cs).ok, false);
  });

  it("rolls back idempotently without touching user data", () => {
    const store = createVersionStore({
      currentVersion: "v0",
      content: { title: "قديم" },
      userData: { progress: 42 },
    });
    const cs = createChangeSet({
      previousVersion: "v0",
      changes: [{ changeKind: "ui_label_non_semantic", before: "قديم", after: "جديد" }],
    });
    store.publish(cs, { title: "جديد" });
    assert.equal(store.getContent().title, "جديد");

    const rb1 = store.rollback(cs, "search_broken");
    assert.equal(rb1.ok, true);
    assert.equal(rb1.idempotent, false);
    assert.equal(store.getContent().title, "قديم");
    assert.equal(store.getUserData().progress, 42);

    const rb2 = store.rollback(cs, "search_broken");
    assert.equal(rb2.idempotent, true);
    assert.equal(store.getUserData().progress, 42);
  });

  it("shouldRollback triggers on protected content / search", () => {
    assert.equal(shouldRollback({ ok: true }).rollback, false);
    assert.equal(shouldRollback({ searchBroken: true }).rollback, true);
    assert.equal(shouldRollback({ protectedContentAffected: true }).rollback, true);
  });
});

describe("Security controls", () => {
  it("blocks SSRF and non-allowlisted hosts", () => {
    assert.equal(validateFetchUrl("http://127.0.0.1/x").ok, false);
    assert.equal(validateFetchUrl("https://evil.example/x").ok, false);
    assert.equal(validateFetchUrl("https://www.awqaf.gov.kw/events").ok, true);
    assert.equal(validateFetchUrl("https://evil.com/payload.exe").ok, false);
  });

  it("sanitizes unsafe HTML", () => {
    const s = sanitizeEditorialHtml(`<p>مرحبا</p><script>alert(1)</script><img onerror=alert(1) src=x>`);
    assert.equal(s.includes("script"), false);
    assert.equal(s.includes("onerror"), false);
  });

  it("redacts secrets", () => {
    const r = redactSecrets({ token: "abc", note: "Bearer eyJhbGciOi.x.y" });
    assert.equal(r.token, "[REDACTED]");
    assert.match(r.note, /REDACTED/);
  });

  it("forbids user write scopes", () => {
    assert.equal(assertServiceScope(["content_read"]).ok, true);
    assert.equal(assertServiceScope(["user_write"]).ok, false);
  });
});

describe("Pipeline P0 cycle", () => {
  it("exposes full stage list but does not auto-publish", () => {
    assert.ok(PIPELINE_STAGES.includes("PublishSafeChanges"));
    const result = runP0Cycle({
      changes: [
        {
          changeKind: "trim_whitespace",
          highConfidence: true,
          reversible: true,
          before: "  سُنّة  ",
          after: "سُنّة",
        },
        { changeKind: "quran_text", path: "public/data/quran/surah-001.json" },
      ],
    });
    assert.equal(result.autoPublishEnabled, false);
    assert.equal(result.publishResult.published, false);
    assert.equal(result.report.brand, "سُنّة");
    assert.ok(result.report.changes.rejected >= 1);
    assert.match(result.report.dailyStatus, /SUCCESS|QUARANTINED|FAILED/);
  });

  it("simulated A publish then rollback on search failure", () => {
    const result = runP0Cycle({
      changes: [
        {
          changeKind: "cache_temp_cleanup",
          highConfidence: true,
          reversible: true,
        },
      ],
      simulatePublish: true,
      forceSimulateLevelAPublish: true,
      verification: { searchBroken: true },
      userData: { bookmarks: ["x"] },
    });
    assert.equal(result.publishResult.published, true);
    assert.equal(result.rollbackResult.ok, true);
    assert.equal(result.store.getUserData().bookmarks[0], "x");
    assert.equal(result.report.deployment.rolledBack, true);
  });

  it("refuses simulated publish when C present", () => {
    const result = runP0Cycle({
      changes: [
        { changeKind: "trim_whitespace", highConfidence: true, reversible: true },
        { contentType: "hadith", changeKind: "clear_spelling_non_sacred" },
      ],
      simulatePublish: true,
      forceSimulateLevelAPublish: true,
    });
    assert.equal(result.publishResult.published, false);
  });
});
