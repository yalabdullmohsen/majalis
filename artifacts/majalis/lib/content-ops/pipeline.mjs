/**
 * Content Ops pipeline skeleton — P0 stages only execute classification/policy/versioning.
 * Collect / Normalize / Publish are stubs that refuse production publish.
 */
import { loadSafeChangePolicy, gateChangeSet, isAutoPublishEnabled } from "./safe-change-policy.mjs";
import { createChangeSet, assertChangeSetPublishable } from "./versioning.mjs";
import { createVersionStore, shouldRollback } from "./rollback.mjs";
import { listSources } from "./source-registry.mjs";
import { BRAND, SYSTEM_NAME } from "./types.mjs";
import { redactSecrets } from "./security-controls.mjs";

export const PIPELINE_STAGES = Object.freeze([
  "Discover",
  "Collect",
  "Normalize",
  "Deduplicate",
  "Validate",
  "ClassifyRisk",
  "Correct",
  "Test",
  "PublishSafeChanges",
  "VerifyProduction",
  "RollbackOnFailure",
  "Report",
]);

/**
 * Run P0 dry cycle: classify + gate + version + optional simulated publish/rollback.
 * @param {{ changes: object[], simulatePublish?: boolean, verification?: object, store?: ReturnType<typeof createVersionStore> }} opts
 */
export function runP0Cycle(opts = {}) {
  const policy = loadSafeChangePolicy();
  const startedAt = new Date().toISOString();
  const sources = listSources({ enabledOnly: true });
  const changes = opts.changes || [];
  const gate = gateChangeSet(changes, {
    cycleModifiedCount: opts.cycleModifiedCount ?? 0,
  });

  const changeSet = createChangeSet({
    previousVersion: opts.previousVersion || "v0",
    changes: changes.map((c, i) => ({
      ...c,
      level: gate.evaluations[i]?.classification?.level,
      changeId: c.changeId || `chg_${i}`,
    })),
    testResults: opts.testResults || { p0: "pending" },
    sourceDiff: sources.map((s) => s.sourceId),
  });

  const publishability = assertChangeSetPublishable(changeSet);
  const store = opts.store || createVersionStore({
    currentVersion: changeSet.previousVersion,
    content: opts.baselineContent || { label: "baseline" },
    userData: opts.userData || { bookmarks: ["keep-me"] },
  });

  let publishResult = {
    attempted: false,
    published: false,
    reason: "auto_publish_disabled_p0",
  };
  let rollbackResult = null;
  let verification = opts.verification || null;

  // P0: never publish to production even if env flags set unless simulatePublish for tests
  if (opts.simulatePublish === true) {
    if (!gate.publishAllowed && isAutoPublishEnabled()) {
      publishResult = {
        attempted: true,
        published: false,
        reason: "gate_blocked",
        gate,
      };
    } else if (!isAutoPublishEnabled() && opts.forceSimulateLevelAPublish !== true) {
      // Still allow in-memory simulation for rollback tests when forced
      publishResult = {
        attempted: false,
        published: false,
        reason: "auto_publish_disabled_p0",
      };
    }

    if (opts.forceSimulateLevelAPublish === true) {
      const onlyA = gate.evaluations.every(
        (e) => e.classification?.level === "A" || e.decision === "hold_p0",
      );
      const hasC = gate.blockedByProtected;
      if (hasC || !onlyA) {
        publishResult = {
          attempted: true,
          published: false,
          reason: hasC ? "protected_or_c_blocked" : "non_a_changes_present",
        };
      } else if (!publishability.ok) {
        publishResult = {
          attempted: true,
          published: false,
          reason: "changeset_not_publishable",
          errors: publishability.errors,
        };
      } else {
        const nextContent = {
          ...store.getContent(),
          applied: changes.filter((_, i) => gate.evaluations[i]?.classification?.level === "A"),
        };
        const pub = store.publish(changeSet, nextContent);
        publishResult = { attempted: true, published: true, ...pub };
        changeSet.status = "published";
        changeSet.publishResult = publishResult;

        verification = opts.verification || { ok: true };
        const rb = shouldRollback(verification);
        if (rb.rollback) {
          rollbackResult = store.rollback(changeSet, rb.reason);
          changeSet.status = "rolled_back";
        }
      }
    }
  }

  const report = buildDailyReport({
    startedAt,
    sources,
    gate,
    changeSet,
    publishResult,
    rollbackResult,
    verification,
    policy,
  });

  return {
    stages: PIPELINE_STAGES,
    executedThrough: "ClassifyRisk+Policy+Versioning",
    autoPublishEnabled: isAutoPublishEnabled(),
    gate,
    changeSet,
    publishResult,
    rollbackResult,
    report,
    store,
  };
}

function buildDailyReport({
  startedAt,
  sources,
  gate,
  changeSet,
  publishResult,
  rollbackResult,
  verification,
  policy,
}) {
  let dailyStatus = "SUCCESS";
  if (rollbackResult?.ok) dailyStatus = "FAILED AND ROLLED BACK";
  else if (publishResult?.attempted && !publishResult.published) {
    dailyStatus = "FAILED BEFORE PUBLISH";
  } else if (gate.counts.quarantine > 0 || gate.counts.isolate > 0 || gate.counts.reject > 0) {
    dailyStatus = "SUCCESS WITH QUARANTINED CHANGES";
  } else if (!policy.autoPublishEnabled) {
    dailyStatus = "SUCCESS WITH QUARANTINED CHANGES";
  }

  return redactSecrets({
    brand: BRAND,
    system: SYSTEM_NAME,
    dailyStatus,
    startedAt,
    finishedAt: new Date().toISOString(),
    sources: {
      successful: sources.map((s) => s.sourceId),
      failed: [],
      lastUpdated: startedAt,
    },
    changes: {
      collected: gate.evaluations.length,
      languageCorrected: 0,
      factuallyUpdated: 0,
      autoPublished: publishResult?.published ? 1 : 0,
      isolated: gate.counts.isolate,
      rejected: gate.counts.reject,
      quarantined: gate.counts.quarantine + gate.counts.hold_p0,
      archived: 0,
      exactDuplicatesMerged: 0,
    },
    quality: {
      brokenLinks: 0,
      missingImages: 0,
      brokenRelations: 0,
      missingSource: gate.evaluations.filter((e) => e.classification?.status === "needs_source").length,
      staleRecords: 0,
      searchErrors: verification?.searchBroken ? 1 : 0,
    },
    deployment: {
      changeSetId: changeSet.changeSetId,
      previousVersion: changeSet.previousVersion,
      newVersion: changeSet.newVersion,
      testResults: changeSet.testResults,
      postPublishVerification: verification,
      rolledBack: Boolean(rollbackResult?.ok),
    },
    protectedContent: {
      modificationAttempts: gate.counts.reject,
      frozenRecords: gate.evaluations
        .filter((e) => e.classification?.level === "C")
        .map((e) => e.protection?.hits || e.classification?.hits || []),
      freezeReason: "needs_specialist_review",
    },
    p0Note: "النشر التلقائي معطّل حتى اكتمال P0 واختبار التراجع.",
  });
}
