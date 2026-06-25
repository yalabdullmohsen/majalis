import { supabase } from "./supabase";
import { logSupabaseError } from "./supabase-config";
import {
  FIQH_COUNCIL_ALL_SEED,
  FIQH_COUNCIL_ADMIN_ONLY_SEED,
} from "./fiqh-council-seed";
import type { FiqhCouncilItem, FiqhItemStatus } from "./fiqh-council-types";

const TABLE = "fiqh_council_items";
const now = () => new Date().toISOString();

function isMissingTableError(err: unknown) {
  const msg = String((err as { message?: string })?.message || err || "");
  return msg.includes("fiqh_council_items") || msg.includes("does not exist") || msg.includes("42P01");
}

export async function adminGetAllFiqhCouncilItems() {
  const { data, error } = await supabase
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    if (isMissingTableError(error)) {
      return { data: FIQH_COUNCIL_ALL_SEED, error: null, usingSeed: true };
    }
    logSupabaseError("adminGetAllFiqhCouncilItems", error);
    return { data: FIQH_COUNCIL_ALL_SEED, error, usingSeed: true };
  }

  if (!data?.length) {
    return { data: FIQH_COUNCIL_ALL_SEED, error: null, usingSeed: true };
  }
  return { data: data as FiqhCouncilItem[], error: null, usingSeed: false };
}

export async function adminUpsertFiqhCouncilItem(row: Record<string, unknown>) {
  const payload: Record<string, unknown> = {
    ...row,
    updated_at: now(),
  };
  if (payload.status === "published" && !payload.published_at) {
    payload.published_at = now();
  }
  delete payload.id;

  if (row.id && !String(row.id).startsWith("seed-")) {
    return await supabase.from(TABLE).update(payload).eq("id", row.id);
  }

  if (row.slug) {
    const existing = await supabase.from(TABLE).select("id").eq("slug", row.slug).maybeSingle();
    if (existing.data?.id) {
      return await supabase.from(TABLE).update(payload).eq("id", existing.data.id);
    }
  }

  return await supabase.from(TABLE).insert(payload);
}

export async function adminDeleteFiqhCouncilItem(id: string) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن حذف بيانات البذور المحلية" } };
  }
  return await supabase.from(TABLE).delete().eq("id", id);
}

export async function adminSetFiqhCouncilItemStatus(id: string, status: FiqhItemStatus) {
  if (String(id).startsWith("seed-")) {
    return { data: null, error: { message: "لا يمكن تغيير حالة بيانات البذور المحلية" } };
  }
  const payload: Record<string, unknown> = { status, updated_at: now() };
  if (status === "published") payload.published_at = now();
  return await supabase.from(TABLE).update(payload).eq("id", id);
}

export async function adminGetFiqhCouncilItemPreview(slug: string) {
  const { data } = await supabase.from(TABLE).select("*").eq("slug", slug).maybeSingle();
  if (data) return { data: data as FiqhCouncilItem, error: null };
  const seed = FIQH_COUNCIL_ALL_SEED.find((item) => item.slug === slug);
  return { data: seed || null, error: seed ? null : { message: "غير موجود" } };
}

export function getAdminOnlySeedItems() {
  return FIQH_COUNCIL_ADMIN_ONLY_SEED;
}

// Legacy wrappers for fiqh_council_decisions table (kept for other admin sections)
export {
  adminGetAllFiqhDecisions,
  adminUpsertFiqhDecision,
  adminDeleteFiqhDecision,
  adminSetPlatformContentStatus,
} from "./platform-supabase";
