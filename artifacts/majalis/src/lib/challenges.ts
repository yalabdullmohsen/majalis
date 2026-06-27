export type ChallengeId =
  | "daily-surah-story"
  | "daily-hadith"
  | "ten-qa"
  | "tafsir-page"
  | "daily-lesson";

export type ChallengeDef = {
  id: ChallengeId;
  title: string;
  description: string;
  target: number;
  statKey?: string;
};

export type ChallengeProgress = {
  date: string;
  completed: Partial<Record<ChallengeId, number>>;
};

const STORAGE_KEY = "majalis-challenges-v1";

export const CHALLENGES: ChallengeDef[] = [
  { id: "daily-surah-story", title: "قصة سورة يومياً", description: "اقرأ قصة سورة واحدة", target: 1 },
  { id: "daily-hadith", title: "حديث يومي", description: "اطّلع على حديث اليوم", target: 1 },
  { id: "ten-qa", title: "عشرة أسئلة", description: "أجب عن 10 أسئلة شرعية", target: 10 },
  { id: "tafsir-page", title: "صفحة تفسير", description: "اقرأ صفحة من التفسير", target: 1 },
  { id: "daily-lesson", title: "درس يومي", description: "شاهد درساً علمياً", target: 1 },
];

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function readChallengeProgress(): ChallengeProgress {
  if (typeof window === "undefined") return { date: todayKey(), completed: {} };
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (!raw || raw.date !== todayKey()) return { date: todayKey(), completed: {} };
    return raw;
  } catch {
    return { date: todayKey(), completed: {} };
  }
}

function writeProgress(progress: ChallengeProgress) {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  window.dispatchEvent(new CustomEvent("majalis-challenges-updated"));
}

export function incrementChallenge(id: ChallengeId, amount = 1) {
  const progress = readChallengeProgress();
  progress.completed[id] = Math.min(
    (progress.completed[id] || 0) + amount,
    CHALLENGES.find((c) => c.id === id)?.target ?? 99,
  );
  writeProgress(progress);
}

export function getChallengeStatus(id: ChallengeId) {
  const def = CHALLENGES.find((c) => c.id === id)!;
  const progress = readChallengeProgress();
  const current = progress.completed[id] || 0;
  return {
    ...def,
    current,
    percent: Math.min(100, Math.round((current / def.target) * 100)),
    done: current >= def.target,
  };
}

export function getAllChallengeStatuses() {
  return CHALLENGES.map((c) => getChallengeStatus(c.id));
}
