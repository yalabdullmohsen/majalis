import { BRAND } from "@/shared/config/brand";
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
  | "usul"
  | "seerah"
  | "history"
  | "prophets"
  | "adhkar"
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
    accent: BRAND.colorDay,
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
    accent: BRAND.colorDay,
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
    heroFrom: "#0C2A24",
    heroTo: "#163F36",
    accent: "#2A7A6E",
    onHero: "#FFFFFF",
    onHeroMuted: "#E4EEEC",
    onHeroAccent: "#E8D5A3",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0C2A24", role: "title" },
      { fg: "#E4EEEC", bg: "#0C2A24", role: "body" },
      { fg: "#E8D5A3", bg: "#0C2A24", role: "eyebrow" },
    ],
  },
  hadith: {
    id: "hadith",
    labelAr: "الحديث وعلومه",
    heroFrom: "#0A3328",
    heroTo: "#0E5540",
    accent: "#0E7A5F",
    onHero: "#FFFFFF",
    onHeroMuted: "#E4F0EA",
    onHeroAccent: "#B8E0D0",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0A3328", role: "title" },
      { fg: "#E4F0EA", bg: "#0A3328", role: "body" },
      { fg: "#B8E0D0", bg: "#0A3328", role: "eyebrow" },
    ],
  },
  fiqh: {
    id: "fiqh",
    labelAr: "الفقه",
    heroFrom: "#0B2E22",
    heroTo: "#134A36",
    accent: "#1F6B4A",
    onHero: "#FFFFFF",
    onHeroMuted: "#E4EEE8",
    onHeroAccent: "#E8D5A3",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0B2E22", role: "title" },
      { fg: "#E4EEE8", bg: "#0B2E22", role: "body" },
      { fg: "#E8D5A3", bg: "#0B2E22", role: "eyebrow" },
    ],
  },
  usul: {
    id: "usul",
    labelAr: "أصول الفقه",
    heroFrom: "#2A2A18",
    heroTo: "#3D3A22",
    accent: "#8B7A3A",
    onHero: "#FFFFFF",
    onHeroMuted: "#F0EDE0",
    onHeroAccent: "#E8D5A3",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#2A2A18", role: "title" },
      { fg: "#F0EDE0", bg: "#2A2A18", role: "body" },
      { fg: "#E8D5A3", bg: "#2A2A18", role: "eyebrow" },
    ],
  },
  seerah: {
    id: "seerah",
    labelAr: "السيرة النبوية",
    heroFrom: "#3A2818",
    heroTo: "#4E3620",
    accent: "#A67C3A",
    onHero: "#FFFFFF",
    onHeroMuted: "#F2EAE0",
    onHeroAccent: "#E0D0B0",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#3A2818", role: "title" },
      { fg: "#F2EAE0", bg: "#3A2818", role: "body" },
      { fg: "#E0D0B0", bg: "#3A2818", role: "eyebrow" },
    ],
  },
  history: {
    id: "history",
    labelAr: "التاريخ الإسلامي",
    heroFrom: "#2C2A1C",
    heroTo: "#3F3A28",
    accent: "#7A6B3A",
    onHero: "#FFFFFF",
    onHeroMuted: "#F0EBE0",
    onHeroAccent: "#D8CFA8",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#2C2A1C", role: "title" },
      { fg: "#F0EBE0", bg: "#2C2A1C", role: "body" },
      { fg: "#D8CFA8", bg: "#2C2A1C", role: "eyebrow" },
    ],
  },
  prophets: {
    id: "prophets",
    labelAr: "قصص الأنبياء",
    heroFrom: "#0E3334",
    heroTo: "#164A48",
    accent: "#1A8A7A",
    onHero: "#FFFFFF",
    onHeroMuted: "#E4F0EE",
    onHeroAccent: "#B8E0D8",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#0E3334", role: "title" },
      { fg: "#E4F0EE", bg: "#0E3334", role: "body" },
      { fg: "#B8E0D8", bg: "#0E3334", role: "eyebrow" },
    ],
  },
  adhkar: {
    id: "adhkar",
    labelAr: "الأذكار",
    heroFrom: "#14352E",
    heroTo: "#1E4A40",
    accent: "#3A9A7A",
    onHero: "#FFFFFF",
    onHeroMuted: "#E6F2EC",
    onHeroAccent: "#C5E8D8",
    contrastPairs: [
      { fg: "#FFFFFF", bg: "#14352E", role: "title" },
      { fg: "#E6F2EC", bg: "#14352E", role: "body" },
      { fg: "#C5E8D8", bg: "#14352E", role: "eyebrow" },
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
    "--section-accent": theme.accent,
    "--topic-on-hero": theme.onHero,
    "--topic-on-hero-muted": theme.onHeroMuted,
    "--topic-on-hero-accent": theme.onHeroAccent,
  };
}
