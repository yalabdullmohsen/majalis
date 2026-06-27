import type { YesNoCategory, YesNoQuestion } from "./yes-no-game-seed";
import { YES_NO_QUESTIONS, filterYesNoQuestions } from "./yes-no-game-seed";

export type SinJeemMode = "solo" | "team";

export type TeamSide = {
  name: string;
  color: string;
};

export type MatchConfig = {
  mode: SinJeemMode;
  category: YesNoCategory | "all";
  roundSize: number;
  timerSec: number;
  teams: [TeamSide, TeamSide];
};

export type MatchProgress = {
  config: MatchConfig;
  questionIds: string[];
  index: number;
  scores: [number, number];
  activeTeam: 0 | 1;
  correct: number;
  wrong: number;
  skipped: number;
  startedAt: number;
  finishedAt?: number;
};

export const DEFAULT_TEAMS: [TeamSide, TeamSide] = [
  { name: "الفريق الأول", color: "#1F6E54" },
  { name: "الفريق الثاني", color: "#B08D2E" },
];

export function buildQuestionDeck(category: YesNoCategory | "all", size = 10): string[] {
  const pool = filterYesNoQuestions(category, "");
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(size, shuffled.length)).map((q) => q.id);
}

export function createMatch(config: MatchConfig): MatchProgress {
  return {
    config,
    questionIds: buildQuestionDeck(config.category, config.roundSize),
    index: 0,
    scores: [0, 0],
    activeTeam: 0,
    correct: 0,
    wrong: 0,
    skipped: 0,
    startedAt: Date.now(),
  };
}

export function getQuestionById(id: string): YesNoQuestion | undefined {
  return YES_NO_QUESTIONS.find((q) => q.id === id);
}

export function scoreAnswer(
  match: MatchProgress,
  teamIndex: 0 | 1,
  isCorrect: boolean,
  points = 1,
): MatchProgress {
  const scores: [number, number] = [...match.scores] as [number, number];
  if (isCorrect) scores[teamIndex] += points;
  return {
    ...match,
    scores,
    correct: match.correct + (isCorrect ? 1 : 0),
    wrong: match.wrong + (isCorrect ? 0 : 1),
    activeTeam: teamIndex === 0 ? 1 : 0,
  };
}

export function skipQuestion(match: MatchProgress, penalty = 1): MatchProgress {
  const scores: [number, number] = [...match.scores] as [number, number];
  scores[match.activeTeam] = Math.max(0, scores[match.activeTeam] - penalty);
  return {
    ...match,
    skipped: match.skipped + 1,
    activeTeam: match.activeTeam === 0 ? 1 : 0,
  };
}

export function advanceQuestion(match: MatchProgress): MatchProgress {
  const nextIndex = match.index + 1;
  if (nextIndex >= match.questionIds.length) {
    return { ...match, index: nextIndex, finishedAt: Date.now() };
  }
  return { ...match, index: nextIndex };
}

export function getWinner(match: MatchProgress): 0 | 1 | "tie" | null {
  if (!match.finishedAt && match.index < match.questionIds.length) return null;
  if (match.scores[0] === match.scores[1]) return "tie";
  return match.scores[0] > match.scores[1] ? 0 : 1;
}

export function matchStats(match: MatchProgress) {
  const elapsedMs = (match.finishedAt ?? Date.now()) - match.startedAt;
  const total = match.correct + match.wrong + match.skipped;
  const pct = total ? Math.round((match.correct / total) * 100) : 0;
  return { elapsedMs, total, pct };
}
