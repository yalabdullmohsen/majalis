import { readActivity } from "./user-activity";

export type AchievementDef = {
  id: string;
  title: string;
  description: string;
  icon: string;
};

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first-surah", title: "أول سورة", description: "قرأت أول سورة في المصحف", icon: "📖" },
  { id: "ten-stories", title: "عشر قصص", description: "أنهيت 10 قصص سور", icon: "📚" },
  { id: "fifty-lessons", title: "خمسون درساً", description: "شاهدت 50 درساً علمياً", icon: "🎓" },
  { id: "hundred-qa", title: "مائة سؤال", description: "اطّلعت على 100 سؤال شرعي", icon: "❓" },
  { id: "week-streak", title: "أسبوع متواصل", description: "سبعة أيام متتالية في المجلس", icon: "🔥" },
  { id: "all-stories", title: "خاتم القصص", description: "اطّلعت على 30 قصة سورة", icon: "🌙" },
  { id: "aqeedah-qa", title: "عقيدة متقنة", description: "اطّلعت على 20 سؤالاً في العقيدة", icon: "✨" },
  { id: "sin-jeem-pro", title: "سين وجيم", description: "لعبت 10 جولات سين وجيم", icon: "🎯" },
  { id: "searcher", title: "باحث", description: "استخدمت البحث 25 مرة", icon: "🔍" },
  { id: "favorites-collector", title: "جامع", description: "حفظت 10 عناصر في المفضلة", icon: "⭐" },
];

export function getUnlockedAchievements(favoriteCount = 0): AchievementDef[] {
  const { stats, streakDays } = readActivity();
  const unlocked: AchievementDef[] = [];

  const check = (id: string, condition: boolean) => {
    if (condition) {
      const def = ACHIEVEMENTS.find((a) => a.id === id);
      if (def) unlocked.push(def);
    }
  };

  check("first-surah", stats.quranSessions >= 1);
  check("ten-stories", stats.surahStoriesRead >= 10);
  check("fifty-lessons", stats.lessonsWatched >= 50);
  check("hundred-qa", stats.qaAnswered >= 100);
  check("week-streak", streakDays >= 7);
  check("all-stories", stats.surahStoriesRead >= 30);
  check("aqeedah-qa", stats.qaAnswered >= 20);
  check("sin-jeem-pro", stats.sinJeemGames >= 10);
  check("searcher", stats.searchCount >= 25);
  check("favorites-collector", favoriteCount >= 10);

  return unlocked;
}

export function getAchievementProgress(): { unlocked: number; total: number } {
  const unlocked = getUnlockedAchievements().length;
  return { unlocked, total: ACHIEVEMENTS.length };
}
