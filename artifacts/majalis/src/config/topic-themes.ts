/**
 * سمات لونية لصفحات المواضيع — تدرّجات داكنة (سطوع منخفض) حتى يبقى النص الأبيض مقروءاً.
 * التلوين محصور في اللافتة والحدّ الجانبي والشريحة النشطة.
 */

export type TopicThemeId =
  | "aqeedah"
  | "jannah"
  | "nar"
  | "malaika"
  | "quran"
  | "hadith"
  | "fiqh"
  | "seerah"
  | "tazkiyah";

export type TopicTheme = {
  id: TopicThemeId;
  labelAr: string;
  heroFrom: string;
  heroTo: string;
  accent: string;
  onHero: string;
  onHeroMuted: string;
  onHeroAccent: string;
  /** أزواج للتوثيق: [fg, bg] يُحسب تباينها في الاختبار */
  contrastPairs: Array<{ fg: string; bg: string; role: "title" | "body" | "eyebrow" }>;
};

/** كل التدرّجات ≤ ~30% سطوع تقريبي — قور شرعي لا فاقع */
export const TOPIC_THEMES: Record<TopicThemeId, TopicTheme> = {
  aqeedah: {
    id: "aqeedah",
    labelAr: "العقيدة والتوحيد",
    heroFrom: "#0F3D2E",
    heroTo: "#123F2E",
    accent: "#1F7A5A",
    onHero: "#FFFFFF",
    onHeroMuted: "#E8EEEC",
    onHeroAccent: "#E8D5A3",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0F3D2E", role: "title" },
      { fg: "#E8EEEC", bg: "#0F3D2E", role: "body" },
      { fg: "#E8D5A3", bg: "#0F3D2E", role: "eyebrow" },
    ],
  },
  jannah: {
    id: "jannah",
    labelAr: "الجنة · أدعية الآخرة",
    heroFrom: "#0A3328",
    heroTo: "#145C45",
    accent: "#1F7A5A",
    onHero: "#FFFFFF",
    onHeroMuted: "#E8EEEC",
    onHeroAccent: "#D4E8DC",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0A3328", role: "title" },
      { fg: "#E8EEEC", bg: "#0A3328", role: "body" },
      { fg: "#D4E8DC", bg: "#0A3328", role: "eyebrow" },
    ],
  },
  nar: {
    id: "nar",
    labelAr: "النار · جهنم",
    heroFrom: "#4A1515",
    heroTo: "#6B1E1E",
    accent: "#9B3A3A",
    onHero: "#FFFFFF",
    onHeroMuted: "#F0E4E4",
    onHeroAccent: "#E8C4C4",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#4A1515", role: "title" },
      { fg: "#F0E4E4", bg: "#4A1515", role: "body" },
      { fg: "#E8C4C4", bg: "#4A1515", role: "eyebrow" },
    ],
  },
  malaika: {
    id: "malaika",
    labelAr: "الملائكة · الغيبيات",
    heroFrom: "#152238",
    heroTo: "#1E3352",
    accent: "#3D5A80",
    onHero: "#FFFFFF",
    onHeroMuted: "#E4EAF2",
    onHeroAccent: "#C5D4E8",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#152238", role: "title" },
      { fg: "#E4EAF2", bg: "#152238", role: "body" },
      { fg: "#C5D4E8", bg: "#152238", role: "eyebrow" },
    ],
  },
  quran: {
    id: "quran",
    labelAr: "القرآن وعلومه",
    heroFrom: "#0E2F2C",
    heroTo: "#164A44",
    accent: "#2A7A6E",
    onHero: "#FFFFFF",
    onHeroMuted: "#E4EEEC",
    onHeroAccent: "#C8E0DA",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0E2F2C", role: "title" },
      { fg: "#E4EEEC", bg: "#0E2F2C", role: "body" },
      { fg: "#C8E0DA", bg: "#0E2F2C", role: "eyebrow" },
    ],
  },
  hadith: {
    id: "hadith",
    labelAr: "الحديث وعلومه",
    heroFrom: "#2A2E18",
    heroTo: "#3D4324",
    accent: "#6B7340",
    onHero: "#FFFFFF",
    onHeroMuted: "#EEF0E4",
    onHeroAccent: "#D8DCB8",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#2A2E18", role: "title" },
      { fg: "#EEF0E4", bg: "#2A2E18", role: "body" },
      { fg: "#D8DCB8", bg: "#2A2E18", role: "eyebrow" },
    ],
  },
  fiqh: {
    id: "fiqh",
    labelAr: "الفقه",
    heroFrom: "#1A1F3A",
    heroTo: "#252B4A",
    accent: "#4A5590",
    onHero: "#FFFFFF",
    onHeroMuted: "#E6E8F2",
    onHeroAccent: "#C4CAE0",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#1A1F3A", role: "title" },
      { fg: "#E6E8F2", bg: "#1A1F3A", role: "body" },
      { fg: "#C4CAE0", bg: "#1A1F3A", role: "eyebrow" },
    ],
  },
  seerah: {
    id: "seerah",
    labelAr: "السيرة والتاريخ",
    heroFrom: "#3A2818",
    heroTo: "#4E3620",
    accent: "#8B6914",
    onHero: "#FFFFFF",
    onHeroMuted: "#F2EAE0",
    onHeroAccent: "#E0D0B0",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#3A2818", role: "title" },
      { fg: "#F2EAE0", bg: "#3A2818", role: "body" },
      { fg: "#E0D0B0", bg: "#3A2818", role: "eyebrow" },
    ],
  },
  tazkiyah: {
    id: "tazkiyah",
    labelAr: "الأخلاق والتزكية",
    heroFrom: "#2A1A38",
    heroTo: "#3A2550",
    accent: "#6B4A8A",
    onHero: "#FFFFFF",
    onHeroMuted: "#EEE6F4",
    onHeroAccent: "#D4C4E0",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#2A1A38", role: "title" },
      { fg: "#EEE6F4", bg: "#2A1A38", role: "body" },
      { fg: "#D4C4E0", bg: "#2A1A38", role: "eyebrow" },
    ],
  },
};

export function getTopicTheme(id: TopicThemeId | string): TopicTheme {
  return TOPIC_THEMES[id as TopicThemeId] ?? TOPIC_THEMES.aqeedah;
}

/** متغيّرات CSS تُحقَن على اللافتة */
export function topicThemeCssVars(theme: TopicTheme): Record<string, string> {
  return {
    "--topic-hero-from": theme.heroFrom,
    "--topic-hero-to": theme.heroTo,
    "--topic-accent": theme.accent,
    "--topic-on-hero": theme.onHero,
    "--topic-on-hero-muted": theme.onHeroMuted,
    "--topic-on-hero-accent": theme.onHeroAccent,
  };
}
