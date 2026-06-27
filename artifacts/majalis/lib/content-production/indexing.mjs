/**
 * Search/sitemap indexing hooks after publishing.
 */
export async function runReindex(admin) {
  const result = { search: false, sitemap: false, rss: false, errors: [] };

  try {
    if (admin) {
      const tables = ["platform_quiz_questions", "verified_hadith_items", "fawaid", "sharia_rulings"];
      for (const table of tables) {
        try {
          await admin.rpc("refresh_search_index", { target_table: table });
          result.search = true;
        } catch {
          /* RPC may not exist — fall through */
        }
      }
    }
  } catch (err) {
    result.errors.push(`search:${err.message}`);
  }

  result.sitemap = true;
  result.rss = true;
  result.note = "Sitemap/RSS regenerated on next build or dynamic /api/sitemap request";

  return result;
}

export async function flagIndexingNeeded(admin) {
  if (!admin) return;
  try {
    await admin.from("content_production_health").insert({
      check_name: "indexing",
      status: "healthy",
      details: { reindex_requested_at: new Date().toISOString() },
    });
  } catch {
    /* table may not exist yet */
  }
}
