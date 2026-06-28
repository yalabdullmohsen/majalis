/**
 * Migrate fiqh decisions from library_items → fiqh_council_items without data loss.
 */

import { getSupabaseAdmin, isMissingTableError } from "../../supabase-admin.mjs";
import { akeLog } from "../monitoring.mjs";

function slugify(text) {
  return String(text || "")
    .trim()
    .toLowerCase()
    .replace(/[^\u0600-\u06FFa-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 80) || `fiqh-${Date.now()}`;
}

function isFiqhLibraryItem(row) {
  const cat = String(row.category || "").toLowerCase();
  const type = String(row.type || "").toLowerCase();
  const title = String(row.title || "").toLowerCase();
  return (
    cat.includes("فقه") ||
    type.includes("فقه") ||
    title.includes("قرار") ||
    title.includes("مجلس") ||
    row.metadata?.content_kind === "fiqh_decision" ||
    row.external_key?.startsWith("fiqh")
  );
}

function buildFiqhRecordFromLibrary(row) {
  const externalId = row.external_key || row.external_id || `migrated:${row.id}`;
  const title = row.title || "قرار فقهي";
  const slug = `${slugify(title)}-${String(externalId).slice(-8)}`.slice(0, 120);

  return {
    external_id: externalId,
    title,
    slug,
    type: row.metadata?.type || "resolution",
    category: row.category || "القضايا المعاصرة",
    summary: (row.description || "").slice(0, 500),
    content: row.description || row.body || "",
    ruling_text: row.metadata?.ruling_text || row.description || "",
    source_name: row.metadata?.source_name || row.source_name,
    source_url: row.external_url || row.source_url,
    tags: row.metadata?.tags || row.tags || [],
    status: row.status === "approved" ? "published" : "review",
    published_at: row.status === "approved" ? (row.updated_at || row.created_at) : null,
  };
}

export async function migrateFiqhFromLibraryItems(admin = getSupabaseAdmin(), options = {}) {
  const stats = { scanned: 0, migrated: 0, skipped: 0, failed: 0, errors: [] };
  if (!admin) return { ok: false, error: "no_admin", stats };

  const { error: tableErr } = await admin.from("fiqh_council_items").select("id", { head: true, count: "exact" });
  if (tableErr && isMissingTableError(tableErr)) {
    return { ok: false, error: "fiqh_council_items_missing", stats };
  }

  const limit = options.limit || 100;
  const dryRun = options.dryRun === true;

  const { data: libraryRows } = await admin
    .from("library_items")
    .select("*")
    .or("category.ilike.%فقه%,type.ilike.%فقه%")
    .limit(limit);

  const { data: knowledgeRows } = await admin
    .from("knowledge_items")
    .select("external_id, target_table, target_record_id")
    .eq("content_kind", "fiqh_decision")
    .eq("publish_status", "published")
    .limit(limit);

  const knowledgeInLibrary = (knowledgeRows || []).filter((k) => k.target_table === "library_items");
  const externalKeys = new Set(knowledgeInLibrary.map((k) => k.external_id));

  const candidates = [
    ...(libraryRows || []).filter(isFiqhLibraryItem),
  ];

  for (const row of candidates) {
    stats.scanned++;
    const externalId = row.external_key || row.id;

    const { data: existing } = await admin
      .from("fiqh_council_items")
      .select("id")
      .eq("external_id", externalId)
      .maybeSingle();

    if (existing?.id) {
      stats.skipped++;
      await logMigration(admin, { library_item_id: row.id, fiqh_item_id: existing.id, external_id: externalId, status: "skipped" });
      continue;
    }

    const fiqhRecord = buildFiqhRecordFromLibrary(row);

    if (dryRun) {
      stats.migrated++;
      continue;
    }

    try {
      const { data: inserted, error } = await admin
        .from("fiqh_council_items")
        .insert(fiqhRecord)
        .select("id")
        .single();

      if (error) throw error;

      await admin.from("knowledge_items")
        .update({ target_table: "fiqh_council_items", target_record_id: inserted.id })
        .eq("external_id", externalId)
        .eq("target_table", "library_items");

      stats.migrated++;
      await logMigration(admin, {
        library_item_id: row.id,
        fiqh_item_id: inserted.id,
        external_id: externalId,
        status: "migrated",
      });

      akeLog("fiqh-migration", { externalId, fiqhId: inserted.id, action: "migrated" });
    } catch (err) {
      stats.failed++;
      stats.errors.push(`${externalId}: ${err.message}`);
      await logMigration(admin, {
        library_item_id: row.id,
        external_id: externalId,
        status: "failed",
        error_message: err.message,
      });
    }
  }

  for (const extId of externalKeys) {
    if (stats.scanned >= limit) break;
    const { data: libRow } = await admin.from("library_items").select("*").eq("external_key", extId).maybeSingle();
    if (libRow && !candidates.find((c) => c.external_key === extId)) {
      candidates.push(libRow);
    }
  }

  return { ok: stats.failed === 0, stats, dryRun };
}

async function logMigration(admin, entry) {
  try {
    await admin.from("ake_fiqh_migration_log").insert({
      ...entry,
      migrated_at: entry.status === "migrated" ? new Date().toISOString() : null,
    });
  } catch {
    /* table may not exist */
  }
}

export async function getFiqhMigrationStatus(admin = getSupabaseAdmin()) {
  if (!admin) return { ok: false };
  try {
    const [{ count: migrated }, { count: failed }, { count: pending }] = await Promise.all([
      admin.from("ake_fiqh_migration_log").select("id", { count: "exact", head: true }).eq("status", "migrated"),
      admin.from("ake_fiqh_migration_log").select("id", { count: "exact", head: true }).eq("status", "failed"),
      admin.from("ake_fiqh_migration_log").select("id", { count: "exact", head: true }).eq("status", "pending"),
    ]);
    return { ok: true, migrated: migrated || 0, failed: failed || 0, pending: pending || 0 };
  } catch {
    return { ok: false, migrated: 0, failed: 0, pending: 0 };
  }
}
