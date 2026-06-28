import type { Difficulty, LifelineType, MatchConfig } from "./types";

export const GAME_TITLE = "سين وجيم";
export const GAME_SUBTITLE = "تحدي المجلس العلمي";

export const DIFFICULTIES: Difficulty[] = ["مبتدئ", "سهل", "متوسط", "متقدم", "خبير"];

export const TIMER_OPTIONS = [20, 30, 45, 60] as const;

export const DEFAULT_CONFIG: MatchConfig = {
  mode: "team_vs_team",
  teamAName: "الفريق الأول",
  teamBName: "الفريق الثاني",
  playersPerTeam: 2,
  roundCount: 1,
  questionCount: 10,
  difficulty: "متوسط",
  timerSeconds: 30,
  pointsPerCorrect: 10,
  speedBonus: 5,
  penaltyWrong: false,
  categorySlugs: [],
};

export const LIFELINES: { type: LifelineType; label: string; icon: string }[] = [
  { type: "fifty_fifty", label: "50%", icon: "½" },
  { type: "swap", label: "تغيير السؤال", icon: "↻" },
  { type: "freeze", label: "إيقاف الوقت", icon: "⏸" },
  { type: "consult", label: "استشارة الفريق", icon: "👥" },
  { type: "remove_one", label: "إزالة إجابة", icon: "✕" },
];

export const TEAM_COLORS = {
  a: { primary: "#1F6E54", glow: "rgba(31,110,84,0.35)", label: "الفريق أ" },
  b: { primary: "#B08D2E", glow: "rgba(176,141,46,0.35)", label: "الفريق ب" },
};

export const SCORING = {
  correct: 10,
  speedBonus: 5,
  speedThresholdMs: 8000,
  wrong: -2,
  skip: 0,
};

export const MODE_CARDS = [
  {
    mode: "team_vs_team" as const,
    title: "فريق ضد فريق",
    desc: "Team A vs Team B — التنافس الكلاسيكي",
    icon: "⚔️",
    gradient: "linear-gradient(135deg, #1F6E54 0%, #2d8a6a 100%)",
  },
  {
    mode: "player_vs_player" as const,
    title: "لاعب ضد لاعب",
    desc: "تحدي مباشر بين لاعبين",
    icon: "🎯",
    gradient: "linear-gradient(135deg, #B08D2E 0%, #d4af37 100%)",
  },
  {
    mode: "solo" as const,
    title: "لعب فردي",
    desc: "اختبر معلوماتك وطوّر مهاراتك",
    icon: "🧠",
    gradient: "linear-gradient(135deg, #4a6741 0%, #6b8f71 100%)",
  },
  {
    mode: "daily" as const,
    title: "تحدي يومي",
    desc: "أسئلة جديدة كل يوم",
    icon: "📅",
    gradient: "linear-gradient(135deg, #7c3aed 0%, #a78bfa 100%)",
  },
  {
    mode: "tournament" as const,
    title: "بطولة",
    desc: "ربع نهائي → نصف → نهائي",
    icon: "🏆",
    gradient: "linear-gradient(135deg, #dc2626 0%, #f97316 100%)",
  },
  {
    mode: "quick" as const,
    title: "لعبة سريعة",
    desc: "5 أسئلة — ابدأ فوراً",
    icon: "⚡",
    gradient: "linear-gradient(135deg, #0891b2 0%, #06b6d4 100%)",
  },
];
