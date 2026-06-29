import type { LeaderboardEntry } from "./types";
import { getMergedQuestionCount } from "./questions-bank";
import { SIN_JEEM_CATEGORIES } from "./categories-seed";

/** Unified health states for سؤال وجواب activation */
export type ActivationHealth = "READY" | "DEGRADED" | "FALLBACK" | "OFFLINE";

export type ActivationDataSource = "supabase" | "bank_file" | "seed_file" | "local" | "none";

export interface ActivationSnapshot {
  health: ActivationHealth;
  loading: boolean;
  error?: string;

  dataSource: ActivationDataSource;
  apiReachable: boolean;
  databaseReady: boolean;
  questionsReady: boolean;
  categoriesReady: boolean;
  gameReady: boolean;
  leaderboardReady: boolean;
  gameInitialized: boolean;

  questionCount: number;
  categoryCount: number;
  playerCount: number;
  matchCount: number;

  leaders: LeaderboardEntry[];

  /** Only true when questionCount === 0 — show activation instructions */
  showActivationInstructions: boolean;
  statusTitle: string | null;
  statusMessage: string | null;
  startDisabledReason: string | null;
}

export const INITIAL_ACTIVATION: ActivationSnapshot = {
  health: "OFFLINE",
  loading: true,
  dataSource: "none",
  apiReachable: false,
  databaseReady: false,
  questionsReady: false,
  categoriesReady: false,
  gameReady: false,
  leaderboardReady: false,
  gameInitialized: false,
  questionCount: 0,
  categoryCount: 0,
  playerCount: 0,
  matchCount: 0,
  leaders: [],
  showActivationInstructions: false,
  statusTitle: null,
  statusMessage: null,
  startDisabledReason: "جاري تحميل الأسئلة…",
};

const HEALTH_LABELS: Record<ActivationHealth, string> = {
  READY: "جاهز",
  DEGRADED: "يعمل جزئياً",
  FALLBACK: "وضع المحتوى المحلي",
  OFFLINE: "غير متاح",
};

export function healthLabel(health: ActivationHealth): string {
  return HEALTH_LABELS[health];
}

interface RawStatusPayload {
  health?: ActivationHealth;
  dataSource?: ActivationDataSource;
  apiReachable?: boolean;
  databaseReady?: boolean;
  questionsReady?: boolean;
  categoriesReady?: boolean;
  gameReady?: boolean;
  leaderboardReady?: boolean;
  questionCount?: number;
  categoryCount?: number;
  playerCount?: number;
  matchCount?: number;
  players?: LeaderboardEntry[];
}

function deriveFromCounts(input: {
  questionCount: number;
  categoryCount: number;
  dataSource: ActivationDataSource;
  apiReachable: boolean;
  databaseReady: boolean;
  leaderboardReady: boolean;
  leaders: LeaderboardEntry[];
  matchCount: number;
  playerCount: number;
  gameInitialized: boolean;
}): Omit<ActivationSnapshot, "loading" | "error"> {
  const {
    questionCount,
    categoryCount,
    dataSource,
    apiReachable,
    databaseReady,
    leaderboardReady,
    leaders,
    matchCount,
    playerCount,
    gameInitialized,
  } = input;

  const questionsReady = questionCount > 0;
  const categoriesReady = categoryCount > 0;
  const gameReady = questionsReady && categoriesReady;

  let health: ActivationHealth = "OFFLINE";
  if (gameReady) {
    if (dataSource === "supabase" && databaseReady) {
      health = "READY";
    } else if (!apiReachable) {
      health = "DEGRADED";
    } else {
      health = "FALLBACK";
    }
  } else if (questionsReady || categoriesReady) {
    health = "DEGRADED";
  }

  const showActivationInstructions = questionCount === 0;

  let statusTitle: string | null = null;
  let statusMessage: string | null = null;

  if (showActivationInstructions) {
    statusTitle = "يتطلب تفعيل بنك الأسئلة";
    statusMessage =
      "لا توجد أسئلة متاحة للعب حالياً. يُرجى تفعيل بنك الأسئلة في قاعدة البيانات أو التحقق من الاتصال.";
  } else if (health === "FALLBACK") {
    statusTitle = "وضع المحتوى المحلي";
    statusMessage =
      "اللعبة جاهزة للعب من بنك الأسئلة المدمج. سيتم مزامنة النتائج ولوحة الشرف عند تفعيل قاعدة البيانات.";
  } else if (health === "DEGRADED") {
    statusTitle = "اتصال محدود";
    statusMessage = "تعمل اللعبة من المحتوى المحلي. بعض الخدمات (مثل المزامنة) قد لا تكون متاحة.";
  }
  // READY: no banner

  let startDisabledReason: string | null = null;
  if (!gameReady) {
    if (!questionsReady) startDisabledReason = "لا توجد أسئلة محمّلة";
    else if (!categoriesReady) startDisabledReason = "لا توجد فئات محمّلة";
    else startDisabledReason = "اللعبة غير جاهزة";
  } else if (!gameInitialized && gameReady) {
    // gameInitialized is always true once provider mounts — engine uses local bank
    startDisabledReason = null;
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
    gameInitialized,
    questionCount,
    categoryCount,
    playerCount,
    matchCount,
    leaders,
    showActivationInstructions,
    statusTitle,
    statusMessage,
    startDisabledReason,
  };
}

function resolveLocalFallback(): Omit<ActivationSnapshot, "loading" | "error"> {
  return deriveFromCounts({
    questionCount: getMergedQuestionCount(),
    categoryCount: SIN_JEEM_CATEGORIES.length,
    dataSource: "local",
    apiReachable: false,
    databaseReady: false,
    leaderboardReady: false,
    leaders: [],
    matchCount: 0,
    playerCount: 0,
    gameInitialized: true,
  });
}

export async function fetchActivationSnapshot(): Promise<ActivationSnapshot> {
  try {
    const res = await fetch("/api/question-answer?action=activation_status", {
      credentials: "same-origin",
    });

    if (!res.ok) {
      throw new Error(`activation_status HTTP ${res.status}`);
    }

    const payload = (await res.json()) as { ok?: boolean } & RawStatusPayload;
    if (!payload.ok) {
      throw new Error("activation_status not ok");
    }

    const derived = deriveFromCounts({
      questionCount: payload.questionCount ?? 0,
      categoryCount: payload.categoryCount ?? 0,
      dataSource: payload.dataSource ?? "none",
      apiReachable: payload.apiReachable ?? true,
      databaseReady: payload.databaseReady ?? false,
      leaderboardReady: payload.leaderboardReady ?? false,
      leaders: payload.players ?? [],
      matchCount: payload.matchCount ?? 0,
      playerCount: payload.playerCount ?? 0,
      gameInitialized: true,
    });

    return { ...derived, loading: false };
  } catch {
    try {
      const local = resolveLocalFallback();
      const health: ActivationHealth =
        local.gameReady && !local.apiReachable ? "DEGRADED" : local.health;
      return {
        ...local,
        health,
        loading: false,
        apiReachable: false,
        error: "api_unreachable",
      };
    } catch {
      return {
        ...INITIAL_ACTIVATION,
        loading: false,
        error: "offline",
        showActivationInstructions: true,
        statusTitle: "غير متصل",
        statusMessage: "تعذّر تحميل حالة اللعبة. تحقق من الاتصال وحاول مجدداً.",
        startDisabledReason: "تعذّر تحميل الأسئلة",
      };
    }
  }
}
