export type GameMode =
  | "team_vs_team"
  | "player_vs_player"
  | "solo"
  | "daily"
  | "tournament"
  | "quick";

export type Difficulty = "مبتدئ" | "سهل" | "متوسط" | "متقدم" | "خبير";

export type QuestionType =
  | "multiple_choice"
  | "true_false"
  | "complete_verse"
  | "complete_hadith"
  | "who_said"
  | "order_events"
  | "match"
  | "image_choice"
  | "mosque_choice"
  | "companion_choice"
  | "scholar_choice"
  | "battle_choice"
  | "first_last"
  | "count"
  | "ruling"
  | "pillar"
  | "condition"
  | "wajib"
  | "sunnah";

export type LifelineType = "fifty_fifty" | "swap" | "freeze" | "consult" | "remove_one";

export type TeamSide = "a" | "b";

export interface SinJeemCategory {
  id: string;
  slug: string;
  name_ar: string;
  icon?: string;
  parent_slug?: string | null;
  sort_order: number;
}

export interface SinJeemQuestion {
  id: string;
  category_id?: string | null;
  subcategory_id?: string | null;
  category_slug?: string;
  category_name?: string;
  question_type: QuestionType;
  question: string;
  options?: string[] | null;
  correct_index?: number | null;
  correct_answer?: string | null;
  explanation?: string | null;
  difficulty: Difficulty;
  keywords?: string[];
  image_url?: string | null;
  points?: number;
}

export interface MatchConfig {
  mode: GameMode;
  teamAName: string;
  teamBName: string;
  playersPerTeam: number;
  roundCount: number;
  questionCount: number;
  difficulty: Difficulty;
  timerSeconds: number;
  pointsPerCorrect: number;
  speedBonus: number;
  penaltyWrong: boolean;
  categorySlugs: string[];
}

export interface TeamStats {
  side: TeamSide;
  name: string;
  score: number;
  correct: number;
  wrong: number;
  skipped: number;
  totalTimeMs: number;
  lifelinesUsed: LifelineType[];
}

export interface RoundRecord {
  questionId: string;
  side: TeamSide;
  selectedIndex: number | null;
  isCorrect: boolean | null;
  points: number;
  responseMs: number;
  lifeline?: LifelineType;
  revealed: boolean;
}

export interface GameSession {
  id: string;
  config: MatchConfig;
  questions: SinJeemQuestion[];
  currentIndex: number;
  activeSide: TeamSide;
  phase: "setup" | "playing" | "reveal" | "finished";
  timerStartedAt: number | null;
  timerFrozen: boolean;
  rounds: RoundRecord[];
  teamA: TeamStats;
  teamB: TeamStats;
  lifelinesA: Record<LifelineType, boolean>;
  lifelinesB: Record<LifelineType, boolean>;
  hiddenOptions: number[];
  startedAt: number;
  finishedAt?: number;
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  games: number;
  wins: number;
  rank: number;
}

export interface GameStats {
  questionCount: number;
  categoryCount: number;
  playerCount: number;
  matchCount: number;
}

export interface MatchResult {
  winner: TeamSide | "draw" | "solo";
  winnerName: string;
  teamA: TeamStats;
  teamB: TeamStats;
  durationMs: number;
  totalQuestions: number;
}
