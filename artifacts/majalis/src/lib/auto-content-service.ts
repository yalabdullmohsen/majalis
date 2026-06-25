import { supabase } from "@/lib/supabase";
import type {
  AutoImportedContent,
  AutoImportLog,
  TrustedSource,
} from "@/lib/auto-content/auto-content-utils";

export async function adminGetAutoImportedContent(status?: string) {
  let q = supabase
    .from("auto_imported_content")
    .select("*")
    .order("created_at", { ascending: false });

  if (status && status !== "all") {
    q = q.eq("status", status);
  }

  const { data, error } = await q;
  return { data: (data || []) as AutoImportedContent[], error };
}

export async function adminGetTrustedSources() {
  const { data, error } = await supabase
    .from("trusted_sources")
    .select("*")
    .order("name");
  return { data: (data || []) as TrustedSource[], error };
}

export async function adminGetAutoImportLogs(limit = 20) {
  const { data, error } = await supabase
    .from("auto_import_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return { data: (data || []) as AutoImportLog[], error };
}

export async function adminApproveAutoContent(id: string) {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .update({
      status: "published",
      verification_status: "verified",
      published_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  return { data: data as AutoImportedContent | null, error };
}

export async function adminRejectAutoContent(id: string) {
  const { data, error } = await supabase
    .from("auto_imported_content")
    .update({
      status: "rejected",
      verification_status: "rejected",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("*")
    .single();
  return { data: data as AutoImportedContent | null, error };
}

export async function getPublishedAutoContent(limit = 20) {
  const { data, error } = await supabase.rpc("get_published_auto_content", {
    p_limit: limit,
    p_content_type: null,
  });
  return { data: (data || []) as AutoImportedContent[], error };
}

export async function triggerAutoContentSync() {
  const secret = import.meta.env.VITE_CRON_SECRET || "";
  const res = await fetch("/api/cron/auto-content-sync", {
    method: "POST",
    headers: secret ? { Authorization: `Bearer ${secret}` } : {},
  });
  if (!res.ok) {
    const json = await res.json().catch(() => ({}));
    throw new Error(json.error || "فشل المزامنة");
  }
  return res.json();
}
