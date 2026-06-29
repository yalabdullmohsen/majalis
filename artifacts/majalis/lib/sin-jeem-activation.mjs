/**
 * Server-side activation status resolver for سؤال وجواب.
 * Single source of truth for health, counts, and data source.
 */
import { getSupabaseAdmin } from "./supabase-admin.mjs";
import { getProductionQuestionBank, getCategorySeedList } from "./question-answer-bank.mjs";

const MISSING_TABLE_CODES = new Set(["PGRST205", "42P01"]);

function isMissingTable(error) {
  return error && (MISSING_TABLE_CODES.has(error.code) || /Could not find/i.test(error.message || ""));
}

/**
 * @returns {Promise<{
 *   health: 'READY' | 'DEGRADED' | 'FALLBACK' | 'OFFLINE',
 *   dataSource: 'supabase' | 'bank_file' | 'seed_file',
 *   apiReachable: boolean,
 *   databaseReady: boolean,
 *   questionsReady: boolean,
 *   categoriesReady: boolean,
 *   gameReady: boolean,
 *   leaderboardReady: boolean,
 *   questionCount: number,
 *   categoryCount: number,
 *   playerCount: number,
 *   matchCount: number,
 * }>}
 */
export async function resolveActivationStatus() {
  const bank = getProductionQuestionBank();
  const seedCategories = getCategorySeedList();

  let dataSource = "bank_file";
  let questionCount = bank.length;
  let categoryCount = seedCategories.length;
  let databaseReady = false;
  let leaderboardReady = false;

  const admin = getSupabaseAdmin();
  if (admin) {
    try {
      const [catRes, qRes, lbRes] = await Promise.all([
        admin.from("sin_jeem_categories").select("*", { count: "exact", head: true }).eq("status", "published"),
        admin.from("sin_jeem_questions").select("*", { count: "exact", head: true }).eq("status", "published"),
        admin.from("sin_jeem_leaderboard_entries").select("id").limit(1),
      ]);

      const tablesExist = !isMissingTable(catRes.error) && !isMissingTable(qRes.error);
      const dbQuestionCount = qRes.count ?? 0;
      const dbCategoryCount = catRes.count ?? 0;

      if (tablesExist && dbQuestionCount > 0) {
        dataSource = "supabase";
        questionCount = dbQuestionCount;
        categoryCount = dbCategoryCount > 0 ? dbCategoryCount : seedCategories.length;
        databaseReady = true;
      }

      leaderboardReady = !isMissingTable(lbRes.error) && !lbRes.error;
    } catch {
      /* keep bank_file fallback counts */
    }
  }

  const questionsReady = questionCount > 0;
  const categoriesReady = categoryCount > 0;
  const gameReady = questionsReady && categoriesReady;
  const apiReachable = true;

  let health = "OFFLINE";
  if (gameReady) {
    health = dataSource === "supabase" ? "READY" : "FALLBACK";
  }

  return {
    health,
    dataSource,
    apiReachable,
    databaseReady,
    questionsReady,
    categoriesReady,
    gameReady,
    leaderboardReady,
    questionCount,
    categoryCount,
    playerCount: 0,
    matchCount: 0,
  };
}
