/**
 * Idempotent content rollback — never mutates user data (P0).
 */

/**
 * In-memory store for P0 tests / dry-run. Production wiring comes in P2.
 */
export function createVersionStore(initial = {}) {
  const versions = new Map();
  let current = initial.currentVersion || "v0";
  versions.set(current, {
    version: current,
    content: structuredClone(initial.content || {}),
    createdAt: new Date().toISOString(),
  });
  const userData = structuredClone(initial.userData || {});
  const history = [];

  return {
    getCurrentVersion() {
      return current;
    },
    getContent() {
      return structuredClone(versions.get(current).content);
    },
    getUserData() {
      return structuredClone(userData);
    },
    publish(changeSet, nextContent) {
      const v = changeSet.newVersion;
      if (versions.has(v)) {
        // idempotent re-publish of same version
        current = v;
        history.push({ op: "publish_idempotent", version: v, at: new Date().toISOString() });
        return { ok: true, version: v, idempotent: true };
      }
      versions.set(v, {
        version: v,
        content: structuredClone(nextContent),
        changeSetId: changeSet.changeSetId,
        previousVersion: changeSet.previousVersion,
        createdAt: new Date().toISOString(),
      });
      current = v;
      history.push({
        op: "publish",
        version: v,
        changeSetId: changeSet.changeSetId,
        at: new Date().toISOString(),
      });
      return { ok: true, version: v, idempotent: false };
    },
    /**
     * Rollback to restoreVersion from rollbackReference. Idempotent.
     */
    rollback(changeSet, reason = "post_publish_failure") {
      const restore = changeSet?.rollbackReference?.restoreVersion;
      if (!restore) {
        return { ok: false, error: "missing_restore_version" };
      }
      if (!versions.has(restore)) {
        return { ok: false, error: "restore_version_missing", restore };
      }
      const already = current === restore;
      current = restore;
      history.push({
        op: already ? "rollback_idempotent" : "rollback",
        version: restore,
        fromChangeSetId: changeSet.changeSetId,
        reason,
        at: new Date().toISOString(),
        userDataUntouched: true,
      });
      return {
        ok: true,
        version: restore,
        idempotent: already,
        userDataUntouched: true,
        content: structuredClone(versions.get(restore).content),
      };
    },
    getHistory() {
      return history.slice();
    },
  };
}

/**
 * Decide if post-publish verification should trigger rollback.
 */
export function shouldRollback(verification) {
  if (!verification) return { rollback: true, reason: "missing_verification" };
  const triggers = [
    ["basicRouteFailed", "basic_route_failed"],
    ["errorRateSpike", "error_rate_spike"],
    ["publishedContentMissing", "published_content_missing"],
    ["searchBroken", "search_broken"],
    ["testDataVisible", "test_data_visible"],
    ["dataIntegrityIssue", "data_integrity_issue"],
    ["appCannotReadVersion", "app_cannot_read_version"],
    ["protectedContentAffected", "protected_content_affected"],
  ];
  for (const [key, reason] of triggers) {
    if (verification[key] === true) return { rollback: true, reason };
  }
  if (verification.ok === false) {
    return { rollback: true, reason: verification.reason || "verification_failed" };
  }
  return { rollback: false };
}
