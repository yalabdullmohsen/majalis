/**
 * Versioning — wraps scholarly-verification storage + global refs.
 */

import { recordRevision, saveVersionSnapshot, getLatestVersionNumber } from "../scholarly-verification/storage.mjs";
import { parseGlobalRef } from "./ids.mjs";

export async function recordContentChange(admin, { refId, item, changeReason, changeSource, changedFields, actorId }) {
  const parsed = parseGlobalRef(refId);
  if (!parsed) return { ok: false, error: "invalid_ref" };

  const versionNumber = admin
    ? await getLatestVersionNumber(parsed.content_kind, parsed.record_id, admin).catch(() => 1)
    : 1;

  const nextVersion = (versionNumber || 0) + 1;

  const revisionResult = await recordRevision(
    {
      content_type: parsed.content_kind,
      content_id: parsed.record_id,
      revision_number: nextVersion,
      change_reason: changeReason || "content_update",
      change_source: changeSource || "system",
      changed_fields: changedFields || [],
      diff_summary: `Version ${nextVersion}`,
      actor_id: actorId,
    },
    admin,
  );

  const snapshotResult = await saveVersionSnapshot(
    {
      content_type: parsed.content_kind,
      content_id: parsed.record_id,
      version_number: nextVersion,
      snapshot_data: item,
      change_reason: changeReason,
    },
    admin,
  );

  if (admin) {
    try {
      await admin
        .from("global_content_refs")
        .update({ version_number: nextVersion, updated_at: new Date().toISOString() })
        .eq("ref_id", refId);
    } catch {
      /* ignore */
    }
  }

  return {
    ok: revisionResult.ok && snapshotResult.ok,
    version_number: nextVersion,
    revision: revisionResult,
    snapshot: snapshotResult,
  };
}

export async function getVersionHistory(admin, refId) {
  const parsed = parseGlobalRef(refId);
  if (!parsed) return { revisions: [], snapshots: [] };

  if (!admin) return { revisions: [], snapshots: [] };

  try {
    const [{ data: revisions }, { data: snapshots }] = await Promise.all([
      admin
        .from("content_revision_log")
        .select("*")
        .eq("content_type", parsed.content_kind)
        .eq("content_id", parsed.record_id)
        .order("revision_number", { ascending: false }),
      admin
        .from("content_version_snapshots")
        .select("*")
        .eq("content_type", parsed.content_kind)
        .eq("content_id", parsed.record_id)
        .order("version_number", { ascending: false }),
    ]);

    return {
      revisions: revisions || [],
      snapshots: snapshots || [],
      current_version: snapshots?.[0]?.version_number || 1,
      first_version: snapshots?.[snapshots.length - 1]?.version_number || 1,
    };
  } catch {
    return { revisions: [], snapshots: [] };
  }
}

export function diffVersions(v1, v2) {
  const changes = [];
  if (!v1 || !v2) return changes;

  for (const key of Object.keys({ ...v1, ...v2 })) {
    if (JSON.stringify(v1[key]) !== JSON.stringify(v2[key])) {
      changes.push({ field: key, from: v1[key], to: v2[key] });
    }
  }

  return changes;
}
