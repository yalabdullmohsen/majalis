/** @deprecated Local staged files removed — all imports go to Supabase. */
export function importToStaged(_rootDir, type, rows, opts = {}) {
  if (opts.dryRun) {
    return { added: rows.length, skipped: 0, total: rows.length, stagedPath: null };
  }
  throw new Error(
    `Staged import for "${type}" is disabled on Production. Use Supabase tables (platform_adhkar_items, platform_quran_surahs, platform_quran_topics).`,
  );
}
