export type FiqhGuideCard = {
  id: string;
  title: string;
  summary: string;
  points?: string[];
  evidence?: string;
  evidenceRef?: string;
  note?: string;
};

export type FiqhGuideTab = {
  id: string;
  label: string;
  intro?: string;
  cards: FiqhGuideCard[];
};

export type FiqhGuideSection = {
  slug: string;
  path: string;
  title: string;
  badge: string;
  subtitle: string;
  seoTitle: string;
  seoDescription: string;
  keywords: string[];
  quizCategoryId: string | string[];
  related: { href: string; label: string }[];
  methodology?: string;
  tabs: FiqhGuideTab[];
};
