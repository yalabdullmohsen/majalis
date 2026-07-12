/** Checks whether an ID belongs to seed/demo data (no Supabase fetch needed). */
export function isDemoId(id: string): boolean {
  return (
    id.startsWith("demo-") ||
    id.startsWith("seed-") ||
    id.startsWith("fawaid-curated-") ||
    id.startsWith("lib-") ||
    id.startsWith("sheikh-") ||
    id.startsWith("miracle-")
  );
}
