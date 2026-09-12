/**
 * Change-set versioning — content deployment separate from user data (P0).
 */
import { createHash, randomUUID } from "node:crypto";
import { BRAND, SYSTEM_NAME } from "./types.mjs";

/**
 * @param {object} input
 * @param {string} [input.previousVersion]
 * @param {Array<object>} input.changes
 * @param {object} [input.testResults]
 * @param {string} [input.databaseMigrationId]
 */
export function createChangeSet(input) {
  const changeSetId = `cs_${randomUUID().replace(/-/g, "").slice(0, 16)}`;
  const previousVersion = input.previousVersion || "v0";
  const contentDiff = buildContentDiff(input.changes || []);
  const fingerprint = hashPayload({
    previousVersion,
    contentDiff,
    brand: BRAND,
  });
  const newVersion = `v_${fingerprint.slice(0, 12)}`;

  return {
    changeSetId,
    system: SYSTEM_NAME,
    brand: BRAND,
    previousVersion,
    newVersion,
    databaseMigrationId: input.databaseMigrationId ?? null,
    contentDiff,
    sourceDiff: input.sourceDiff || [],
    testResults: input.testResults || null,
    publishResult: null,
    rollbackReference: {
      changeSetId,
      restoreVersion: previousVersion,
      contentSnapshotId: `snap_${previousVersion}_${fingerprint.slice(0, 8)}`,
      userDataIsolated: true,
      idempotent: true,
    },
    createdAt: new Date().toISOString(),
    status: "generated",
  };
}

function buildContentDiff(changes) {
  return changes.map((c) => ({
    changeId: c.changeId || null,
    changeKind: c.changeKind || c.kind || null,
    path: c.path || null,
    field: c.field || null,
    before: c.before ?? null,
    after: c.after ?? null,
    level: c.level || null,
  }));
}

function hashPayload(obj) {
  return createHash("sha256").update(JSON.stringify(obj)).digest("hex");
}

/**
 * Validate change set has required rollback metadata before any publish attempt.
 */
export function assertChangeSetPublishable(changeSet) {
  const errors = [];
  if (!changeSet?.changeSetId) errors.push("missing_changeSetId");
  if (!changeSet?.previousVersion) errors.push("missing_previousVersion");
  if (!changeSet?.newVersion) errors.push("missing_newVersion");
  if (!changeSet?.rollbackReference?.restoreVersion) {
    errors.push("missing_rollbackReference");
  }
  if (!changeSet?.contentDiff || changeSet.contentDiff.length === 0) {
    errors.push("empty_contentDiff");
  }
  if (changeSet?.rollbackReference?.userDataIsolated !== true) {
    errors.push("user_data_not_isolated");
  }
  return { ok: errors.length === 0, errors };
}
