export type BadgeCategory =
  | "streak"
  | "lessons"
  | "library"
  | "tasbih"
  | "path"
  | "content";

export type BadgeDef = {
  key: string;
  titleAr: string;
  descAr: string;
  icon: string;
  category: BadgeCategory;
  /** Returns true when the badge should be awarded */
  condition: (stats: BadgeCheckStats) => boolean;
};

export type BadgeCheckStats = {
  streakDays: number;
  completedLessons: number;
  booksRead: number;
  tasbihLifetime: number;
  savedItems: number;          // bookmarks count
  pathsCompleted: string[];    // path slugs
  achievementsEarned: string[]; // already-earned keys (to skip re-check)
};

export const BADGE_DEFS: BadgeDef[] = [
  // ── الأيام المتواصلة ─────────────────────────────────────────────
  {
    key: "streak_7",
    titleAr: "ثابت الخطى",
    descAr: "7 أيام متواصلة من النشاط",
    icon: "Flame",
    category: "streak",
    condition: (s) => s.streakDays >= 7,
  },
  {
    key: "streak_30",
    titleAr: "المواظب",
    descAr: "30 يومًا متواصلة",
    icon: "Moon",
    category: "streak",
    condition: (s) => s.streakDays >= 30,
  },
  {
    key: "streak_100",
    titleAr: "ذو الهمة العالية",
    descAr: "100 يوم متواصل من النشاط",
    icon: "Star",
    category: "streak",
    condition: (s) => s.streakDays >= 100,
  },

  // ── الدروس ───────────────────────────────────────────────────────
  {
    key: "first_lesson",
    titleAr: "الخطوة الأولى",
    descAr: "أكملت درسك الأول",
    icon: "BookOpen",
    category: "lessons",
    condition: (s) => s.completedLessons >= 1,
  },
  {
    key: "lessons_5",
    titleAr: "طالب مجتهد",
    descAr: "أكملت 5 دروس",
    icon: "Library",
    category: "lessons",
    condition: (s) => s.completedLessons >= 5,
  },
  {
    key: "lessons_20",
    titleAr: "راسخ في الطلب",
    descAr: "أكملت 20 درسًا",
    icon: "GraduationCap",
    category: "lessons",
    condition: (s) => s.completedLessons >= 20,
  },

  // ── المكتبة ──────────────────────────────────────────────────────
  {
    key: "first_book",
    titleAr: "القارئ",
    descAr: "أنهيت كتابك الأول",
    icon: "BookMarked",
    category: "library",
    condition: (s) => s.booksRead >= 1,
  },
  {
    key: "books_3",
    titleAr: "المطالع",
    descAr: "قرأت 3 كتب",
    icon: "Library",
    category: "library",
    condition: (s) => s.booksRead >= 3,
  },

  // ── التسبيح ──────────────────────────────────────────────────────
  {
    key: "tasbih_1k",
    titleAr: "ذاكر الله",
    descAr: "1,000 تسبيحة",
    icon: "Repeat2",
    category: "tasbih",
    condition: (s) => s.tasbihLifetime >= 1_000,
  },
  {
    key: "tasbih_10k",
    titleAr: "كثير الذكر",
    descAr: "10,000 تسبيحة",
    icon: "Sparkles",
    category: "tasbih",
    condition: (s) => s.tasbihLifetime >= 10_000,
  },

  // ── المسارات الشرعية ─────────────────────────────────────────────
  {
    key: "path_arbaeen",
    titleAr: "حافظ الأربعين",
    descAr: "أتممت مسار الأربعين النووية",
    icon: "Leaf",
    category: "path",
    condition: (s) => s.pathsCompleted.some((p) => p.includes("arbaeen") || p.includes("nawawi")),
  },
  {
    key: "path_aqida",
    titleAr: "راسخ العقيدة",
    descAr: "أتممت مسارًا في العقيدة",
    icon: "Landmark",
    category: "path",
    condition: (s) => s.pathsCompleted.some((p) => p.includes("aqida") || p.includes("عقيدة")),
  },
  {
    key: "path_fiqh",
    titleAr: "الفقيه المبتدئ",
    descAr: "أتممت مسارًا في الفقه",
    icon: "Scale",
    category: "path",
    condition: (s) => s.pathsCompleted.some((p) => p.includes("fiqh") || p.includes("فقه")),
  },

  // ── المحتوى المحفوظ ──────────────────────────────────────────────
  {
    key: "first_save",
    titleAr: "جامع الفوائد",
    descAr: "حفظت أول محتوى",
    icon: "Bookmark",
    category: "content",
    condition: (s) => s.savedItems >= 1,
  },
  {
    key: "saves_10",
    titleAr: "محبّ المعرفة",
    descAr: "حفظت 10 محتويات",
    icon: "Gem",
    category: "content",
    condition: (s) => s.savedItems >= 10,
  },
];

export const BADGE_MAP = new Map(BADGE_DEFS.map((b) => [b.key, b]));

export type UserLevel = {
  level: number;
  titleAr: string;
  color: string;
  xp: number;
  nextLevelXp: number;
};

const LEVEL_THRESHOLDS = [0, 500, 1_500, 3_000, 6_000] as const;
const LEVEL_DEFS = [
  { titleAr: "طالب مبتدئ",    color: "#6b7280" },
  { titleAr: "طالب علم",       color: "#1a6b52" },
  { titleAr: "حافظ",           color: "#0e7490" },
  { titleAr: "طالب جاد",       color: "#7c3aed" },
  { titleAr: "مجاز",           color: "#1F4D3A" },
] as const;

export type XpSources = {
  completedLessons: number;
  booksRead: number;
  streakDays: number;
  tasbihLifetime: number;
  savedItems: number;
  badgesEarned: number;
};

export function computeXp(s: XpSources): number {
  return (
    s.completedLessons * 100 +
    s.booksRead * 200 +
    Math.min(s.streakDays, 365) * 10 +
    Math.floor(s.tasbihLifetime / 100) * 2 +
    s.savedItems * 5 +
    s.badgesEarned * 50
  );
}

export function computeUserLevel(xp: number): UserLevel {
  let level = 0;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i;
    else break;
  }
  return {
    level: level + 1,
    titleAr: LEVEL_DEFS[level].titleAr,
    color: LEVEL_DEFS[level].color,
    xp,
    nextLevelXp: LEVEL_THRESHOLDS[Math.min(level + 1, LEVEL_THRESHOLDS.length - 1)],
  };
}
