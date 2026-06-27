/**
 * Verified adhkar from Supabase — merged with local seed in adhkar-service.
 */
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured, logSupabaseError } from "@/lib/supabase-config";
import { timedQueryFn } from "@/lib/query-client";
import type { AdhkarItem } from "@/lib/adhkar-seed";

type VerifiedAdhkarRow = {
  id: string;
  category_id: string;
  text: string;
  repeat_count: number;
  narrator: string | null;
  source_name: string | null;
  grade: string | null;
  reference: string | null;
  keywords: string[] | null;
  verification_status: string | null;
};

function mapRow(row: VerifiedAdhkarRow): AdhkarItem {
  return {
    id: row.id,
    categoryId: row.category_id,
    text: row.text,
    count: row.repeat_count ?? 1,
    narrator: row.narrator ?? undefined,
    source: row.source_name ?? undefined,
    grade: row.grade ?? undefined,
    reference: row.reference ?? undefined,
    keywords: Array.isArray(row.keywords) ? row.keywords : [],
  };
}

export async function fetchVerifiedAdhkarItems(): Promise<AdhkarItem[]> {
  if (!isSupabaseConfigured()) return [];

  return timedQueryFn("adhkar:verified", async () => {
    const { data, error } = await supabase
      .from("verified_adhkar_items")
      .select(
        "id, category_id, text, repeat_count, narrator, source_name, grade, reference, keywords, verification_status",
      )
      .is("deleted_at", null)
      .neq("verification_status", "rejected")
      .order("updated_at", { ascending: false });

    if (error) {
      logSupabaseError("fetchVerifiedAdhkarItems", error);
      return [];
    }

    return (data as VerifiedAdhkarRow[] | null)?.map(mapRow) ?? [];
  });
}

export async function countVerifiedAdhkarItems(): Promise<number | null> {
  if (!isSupabaseConfigured()) return null;

  const { count, error } = await supabase
    .from("verified_adhkar_items")
    .select("*", { count: "exact", head: true })
    .is("deleted_at", null);

  if (error) {
    if (error.code !== "PGRST205") logSupabaseError("countVerifiedAdhkarItems", error);
    return null;
  }
  return count ?? 0;
}
