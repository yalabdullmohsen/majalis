import { SCORING } from "./constants";
import { getAllSinJeemQuestions } from "./questions-bank";
import { filterUnseenQuestions, setCategoryTotals } from "./player-history";
import type {
  Difficulty,
  GameSession,
  LifelineType,
  MatchConfig,
  MatchResult,
  RoundRecord,
  SinJeemQuestion,
  TeamSide,
  TeamStats,
} from "./types";

function uid(): string {
  return `sj-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function emptyLifelines(): Record<LifelineType, boolean> {
  return {
    fifty_fifty: true,
    swap: true,
    freeze: true,
    consult: true,
    remove_one: true,
  };
}

function emptyTeam(side: TeamSide, name: string): TeamStats {
  return { side, name, score: 0, correct: 0, wrong: 0, skipped: 0, totalTimeMs: 0, lifelinesUsed: [] };
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickQuestions(config: MatchConfig, pool?: SinJeemQuestion[]): SinJeemQuestion[] {
  let questions = pool ? [...pool] : getAllSinJeemQuestions();

  if (config.categorySlugs.length > 0) {
    questions = questions.filter((q) => config.categorySlugs.includes(q.category_slug || ""));
    const totals: Record<string, number> = {};
    for (const slug of config.categorySlugs) {
      totals[slug] = questions.filter((q) => q.category_slug === slug).length;
    }
    setCategoryTotals(totals);
  }

  questions = filterUnseenQuestions(questions, config.categorySlugs);

  if (config.difficulty !== "متوسط") {
    const filtered = questions.filter((q) => q.difficulty === config.difficulty);
    if (filtered.length >= config.questionCount) questions = filtered;
  }

  const used = new Set<string>();
  const picked: SinJeemQuestion[] = [];
  const shuffled = shuffle(questions);

  for (const q of shuffled) {
    if (picked.length >= config.questionCount) break;
    if (used.has(q.question)) continue;
    used.add(q.question);
    picked.push(q);
  }

  while (picked.length < config.questionCount && shuffled.length > 0) {
    picked.push(shuffled[picked.length % shuffled.length]);
    if (picked.length >= config.questionCount) break;
  }

  return picked.slice(0, config.questionCount);
}

export function createSession(config: MatchConfig, pool?: SinJeemQuestion[]): GameSession {
  let questions = pickQuestions(config, pool);
  if (questions.length === 0) {
    questions = pickQuestions(
      { ...config, categorySlugs: [], difficulty: "متوسط" },
      pool ?? getAllSinJeemQuestions(),
    );
  }
  const teamAName = config.mode === "solo" ? "أنت" : config.teamAName;
  const teamBName = config.mode === "solo" ? "" : config.teamBName;

  return {
    id: uid(),
    config,
    questions,
    currentIndex: 0,
    activeSide: "a",
    phase: "playing",
    timerStartedAt: Date.now(),
    timerFrozen: false,
    rounds: [],
    teamA: emptyTeam("a", teamAName),
    teamB: emptyTeam("b", teamBName),
    lifelinesA: emptyLifelines(),
    lifelinesB: emptyLifelines(),
    hiddenOptions: [],
    startedAt: Date.now(),
  };
}

export function getCurrentQuestion(session: GameSession): SinJeemQuestion | null {
  return session.questions[session.currentIndex] ?? null;
}

export function getRemainingSeconds(session: GameSession): number {
  if (!session.timerStartedAt || session.timerFrozen) {
    return session.config.timerSeconds;
  }
  const elapsed = Math.floor((Date.now() - session.timerStartedAt) / 1000);
  return Math.max(0, session.config.timerSeconds - elapsed);
}

export function isTimerExpired(session: GameSession): boolean {
  return getRemainingSeconds(session) <= 0;
}

export function calcPoints(
  config: MatchConfig,
  isCorrect: boolean,
  responseMs: number,
): number {
  if (!isCorrect) return config.penaltyWrong ? SCORING.wrong : 0;
  let pts = config.pointsPerCorrect;
  if (responseMs > 0 && responseMs <= SCORING.speedThresholdMs) {
    pts += config.speedBonus;
  }
  return pts;
}

export function submitAnswer(
  session: GameSession,
  selectedIndex: number | null,
  lifeline?: LifelineType,
): GameSession {
  const question = getCurrentQuestion(session);
  if (!question || session.phase !== "playing") return session;

  const responseMs = session.timerStartedAt ? Date.now() - session.timerStartedAt : 0;
  const correctIdx = question.correct_index ?? 0;
  const isCorrect = selectedIndex !== null && selectedIndex === correctIdx;
  const points = selectedIndex === null ? 0 : calcPoints(session.config, isCorrect, responseMs);

  const round: RoundRecord = {
    questionId: question.id,
    side: session.activeSide,
    selectedIndex,
    isCorrect: selectedIndex === null ? null : isCorrect,
    points,
    responseMs,
    lifeline,
    revealed: true,
  };

  const next = { ...session, phase: "reveal" as const, rounds: [...session.rounds, round] };
  const teamKey = session.activeSide === "a" ? "teamA" : "teamB";
  const team = { ...next[teamKey] };

  if (selectedIndex === null) {
    team.skipped += 1;
  } else if (isCorrect) {
    team.correct += 1;
    team.score += points;
  } else {
    team.wrong += 1;
    team.score += points;
  }
  team.totalTimeMs += responseMs;
  if (lifeline) team.lifelinesUsed = [...team.lifelinesUsed, lifeline];

  next[teamKey] = team;
  return next;
}

export function timeoutQuestion(session: GameSession): GameSession {
  return submitAnswer(session, null);
}

export function nextQuestion(session: GameSession): GameSession {
  const nextIndex = session.currentIndex + 1;
  if (nextIndex >= session.questions.length) {
    return { ...session, phase: "finished", finishedAt: Date.now() };
  }

  const flipSide = session.config.mode !== "solo";
  const activeSide: TeamSide =
    flipSide && session.config.mode === "team_vs_team"
      ? session.activeSide === "a"
        ? "b"
        : "a"
      : "a";

  return {
    ...session,
    currentIndex: nextIndex,
    activeSide,
    phase: "playing",
    timerStartedAt: Date.now(),
    timerFrozen: false,
    hiddenOptions: [],
  };
}

export function useLifeline(session: GameSession, type: LifelineType): GameSession {
  const key = session.activeSide === "a" ? "lifelinesA" : "lifelinesB";
  const lifelines = session[key];
  if (!lifelines[type]) return session;

  const updated = { ...lifelines, [type]: false };
  let next: GameSession = { ...session, [key]: updated };

  if (type === "fifty_fifty") {
    const q = getCurrentQuestion(next);
    if (q?.options) {
      const wrong = q.options
        .map((_, i) => i)
        .filter((i) => i !== (q.correct_index ?? 0));
      const hide = shuffle(wrong).slice(0, 2);
      next = { ...next, hiddenOptions: hide };
    }
  } else if (type === "freeze") {
    next = { ...next, timerFrozen: true };
  } else if (type === "swap") {
    const current = getCurrentQuestion(next);
    const replacement = pickQuestions(
      { ...next.config, questionCount: 1 },
      getAllSinJeemQuestions().filter((x) => x.id !== current?.id),
    )[0];
    if (replacement && current) {
      const questions = [...next.questions];
      questions[next.currentIndex] = replacement;
      next = { ...next, questions };
    }
  } else if (type === "remove_one") {
    const current = getCurrentQuestion(next);
    if (current?.options) {
      const wrong = current.options
        .map((_, i) => i)
        .filter((i) => i !== (current.correct_index ?? 0) && !next.hiddenOptions.includes(i));
      if (wrong.length) {
        next = { ...next, hiddenOptions: [...next.hiddenOptions, wrong[0]] };
      }
    }
  }

  return next;
}

export function getMatchResult(session: GameSession): MatchResult {
  const { teamA, teamB, config } = session;
  let winner: MatchResult["winner"] = "draw";
  let winnerName = "تعادل";

  if (config.mode === "solo") {
    winner = "solo";
    winnerName = teamA.name;
  } else if (teamA.score > teamB.score) {
    winner = "a";
    winnerName = teamA.name;
  } else if (teamB.score > teamA.score) {
    winner = "b";
    winnerName = teamB.name;
  }

  return {
    winner,
    winnerName,
    teamA,
    teamB,
    durationMs: (session.finishedAt || Date.now()) - session.startedAt,
    totalQuestions: session.questions.length,
  };
}

export function quickConfig(): MatchConfig {
  return {
    mode: "quick",
    teamAName: "الفريق أ",
    teamBName: "الفريق ب",
    playersPerTeam: 2,
    roundCount: 1,
    questionCount: 5,
    difficulty: "متوسط",
    timerSeconds: 20,
    pointsPerCorrect: 10,
    speedBonus: 5,
    penaltyWrong: false,
    categorySlugs: [],
  };
}

export function dailyConfig(): MatchConfig {
  const day = new Date().toISOString().slice(0, 10);
  const seed = day.split("-").reduce((a, b) => a + Number(b), 0);
  const difficulties: Difficulty[] = ["سهل", "متوسط", "متقدم"];
  return {
    mode: "daily",
    teamAName: "تحدي اليوم",
    teamBName: "",
    playersPerTeam: 1,
    roundCount: 1,
    questionCount: 7,
    difficulty: difficulties[seed % difficulties.length],
    timerSeconds: 30,
    pointsPerCorrect: 10,
    speedBonus: 5,
    penaltyWrong: false,
    categorySlugs: [],
  };
}
