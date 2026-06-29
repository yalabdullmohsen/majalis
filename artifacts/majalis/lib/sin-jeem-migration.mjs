/**
 * Sin Jeem migration + verification helpers.
 */
import { readFileSync } from "node:fs";
import { applyMigrations } from "./db-migrate.mjs";
import { getPgClient } from "./database.mjs";
import { migrationFilePath } from "./migration-paths.mjs";

export const SIN_JEEM_TABLES = [
  "sin_jeem_categories",
  "sin_jeem_subcategories",
  "sin_jeem_questions",
  "sin_jeem_players",
  "sin_jeem_teams",
  "sin_jeem_matches",
  "sin_jeem_rounds",
  "sin_jeem_answers",
  "sin_jeem_scores",
  "sin_jeem_achievements",
  "sin_jeem_player_achievements",
  "sin_jeem_daily_challenges",
  "sin_jeem_tournaments",
  "sin_jeem_question_history",
  "sin_jeem_question_reports",
  "sin_jeem_ai_generations",
  "sin_jeem_leaderboard_entries",
  "sin_jeem_question_audit",
  "sin_jeem_player_profiles",
  "sin_jeem_player_question_stats",
  "sin_jeem_category_mastery",
];

export const SIN_JEEM_FKS = [
  { table: "sin_jeem_subcategories", column: "category_id", ref: "sin_jeem_categories" },
  { table: "sin_jeem_questions", column: "category_id", ref: "sin_jeem_categories" },
  { table: "sin_jeem_rounds", column: "match_id", ref: "sin_jeem_matches" },
  { table: "sin_jeem_answers", column: "round_id", ref: "sin_jeem_rounds" },
  { table: "sin_jeem_leaderboard_entries", column: "match_id", ref: "sin_jeem_matches" },
];

export async function applySinJeemMigration(options = {}) {
  const result = await applyMigrations({
    files: ["sin_jeem_v1.sql", "sin_jeem_v1_2_types.sql", "sin_jeem_v2_progress.sql"],
    continueOnError: false,
    trackApplied: true,
    force: options.force === true,
  });
  const verify = await verifySinJeemSchema();
  return { ...result, verify };
}

export async function verifySinJeemSchema() {
  let client;
  try {
    client = await getPgClient();
  } catch (err) {
    return { ok: false, error: err.message || "DATABASE_URL not configured" };
  }
  if (!client) {
    return { ok: false, error: "DATABASE_URL not configured" };
  }

  try {
    const tables = {};
    for (const t of SIN_JEEM_TABLES) {
      const { rows } = await client.query(
        `SELECT EXISTS (
          SELECT 1 FROM information_schema.tables
          WHERE table_schema = 'public' AND table_name = $1
        ) AS ok`,
        [t],
      );
      tables[t] = rows[0]?.ok === true;
    }

    const fks = {};
    for (const fk of SIN_JEEM_FKS) {
      const { rows } = await client.query(
        `SELECT COUNT(*)::int AS c FROM information_schema.table_constraints tc
         JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
         JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
         WHERE tc.constraint_type = 'FOREIGN KEY'
           AND tc.table_name = $1 AND kcu.column_name = $2 AND ccu.table_name = $3`,
        [fk.table, fk.column, fk.ref],
      );
      fks[`${fk.table}.${fk.column}`] = (rows[0]?.c || 0) > 0;
    }

    const { rows: idxRows } = await client.query(
      `SELECT indexname FROM pg_indexes
       WHERE schemaname = 'public' AND tablename LIKE 'sin_jeem_%'`,
    );
    const indexes = idxRows.map((r) => r.indexname);

    const missing = SIN_JEEM_TABLES.filter((t) => !tables[t]);
    const missingFks = Object.entries(fks).filter(([, v]) => !v).map(([k]) => k);

    return {
      ok: missing.length === 0,
      tables,
      fks,
      indexes,
      missing,
      missingFks,
      tableCount: Object.values(tables).filter(Boolean).length,
    };
  } finally {
    await client.end?.();
  }
}

export function loadSinJeemSql() {
  return readFileSync(migrationFilePath("sin_jeem_v1.sql"), "utf8");
}

/** Idempotency: re-run migration twice should succeed */
export async function verifySinJeemIdempotent() {
  const first = await applySinJeemMigration();
  const second = await applySinJeemMigration();
  return {
    ok: first.ok && second.ok,
    first: first.verify,
    second: second.verify,
  };
}
