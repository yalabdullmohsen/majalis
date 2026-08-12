/**
 * Global Scholarly Reference IDs — majalis:{kind}:{id}
 */

import crypto from "node:crypto";

export function buildGlobalRef(contentKind, recordId, externalKey) {
  const id = externalKey || recordId || crypto.randomUUID();
  const safeKind = String(contentKind || "content").toLowerCase().replace(/[^a-z0-9_-]/g, "-");
  const safeId = String(id).replace(/[^a-zA-Z0-9_-]/g, "-").slice(0, 120);
  return `majalis:${safeKind}:${safeId}`;
}

export function parseGlobalRef(refId) {
  const parts = String(refId || "").split(":");
  if (parts.length < 3 || parts[0] !== "majalis") return null;
  return {
    ref_id: refId,
    content_kind: parts[1],
    record_id: parts.slice(2).join(":"),
  };
}

export function identityFromItem(item) {
  const kind = item.content_kind || item.content_type || item.kind || "content";
  const recordId = item.id || item.content_id || item.record_id;
  const externalKey = item.external_key || item.slug;
  const refId = buildGlobalRef(kind, recordId, externalKey);

  return {
    ref_id: refId,
    content_kind: kind,
    record_id: String(recordId || ""),
    external_key: externalKey || null,
    title: item.title || item.ai_title || item.question || item.text || item.name,
    author: item.author || item.author_name || item.ai_scholar || item.speaker_name,
    publisher: item.publisher || item.source_name || item.entity_name,
    verifier: item.verifier || null,
    references: item.references || item.source_url ? [{ url: item.source_url, name: item.source_name }] : [],
    verification_status: item.verification_status || "needs_review",
    documentation_level: item.documentation_level || "partial",
    version_number: item.version_number || item.version || 1,
    status: item.status || "active",
    created_at: item.created_at || new Date().toISOString(),
    updated_at: item.updated_at || item.last_updated || new Date().toISOString(),
    last_reviewed_at: item.last_reviewed_at || null,
  };
}

export async function resolveGlobalRef(admin, refId) {
  if (!admin) {
    const parsed = parseGlobalRef(refId);
    return parsed ? { ...parsed, source: "local" } : null;
  }

  try {
    const { data } = await admin.from("global_content_refs").select("*").eq("ref_id", refId).maybeSingle();
    if (data) return { ...data, source: "supabase" };
  } catch {
    /* fallback */
  }

  const parsed = parseGlobalRef(refId);
  return parsed ? { ...parsed, source: "parsed" } : null;
}

export async function registerGlobalRef(admin, item) {
  const identity = identityFromItem(item);

  if (admin) {
    try {
      const { data, error } = await admin
        .from("global_content_refs")
        .upsert(
          {
            ...identity,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "ref_id" },
        )
        .select()
        .single();
      if (!error && data) return { ok: true, ref: data, source: "supabase" };
    } catch {
      /* fallback */
    }
  }

  return { ok: true, ref: identity, source: "local" };
}

export async function getRefVersionHistory(admin, refId) {
  if (!admin) return [];

  const parsed = parseGlobalRef(refId);
  if (!parsed) return [];

  try {
    const { data: revisions } = await admin
      .from("content_revision_log")
      .select("*")
      .eq("content_type", parsed.content_kind)
      .eq("content_id", parsed.record_id)
      .order("revision_number", { ascending: false });

    const { data: snapshots } = await admin
      .from("content_version_snapshots")
      .select("*")
      .eq("content_type", parsed.content_kind)
      .eq("content_id", parsed.record_id)
      .order("version_number", { ascending: false });

    return {
      revisions: revisions || [],
      snapshots: snapshots || [],
    };
  } catch {
    return { revisions: [], snapshots: [] };
  }
}
