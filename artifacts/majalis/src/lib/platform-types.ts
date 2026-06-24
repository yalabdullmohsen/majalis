export type Mosque = {
  id: string;
  name: string;
  governorate: string;
  area?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  google_maps_url?: string;
  image_url?: string;
};

export type Book = {
  id: string;
  title: string;
  author?: string;
  category?: string;
  pdf_url?: string;
  cover_url?: string;
  description?: string;
};

export type LessonSeries = {
  id: string;
  title: string;
  description?: string;
  category: string;
  sheikh_id?: string;
  sheikh_name?: string;
  book_id?: string;
  total_lessons: number;
  completed_lessons: number;
};

export type PlatformLesson = {
  id: string;
  title: string;
  description?: string;
  category?: string;
  sheikh_id?: string;
  sheikh_name?: string;
  sheikh_image?: string;
  mosque_id?: string;
  mosque_name?: string;
  governorate?: string;
  area?: string;
  day?: string;
  start_time?: string;
  end_time?: string;
  start_date?: string;
  end_date?: string;
  is_recurring?: boolean;
  recurrence_text?: string;
  has_women_place?: boolean;
  live_url?: string;
  book_url?: string;
  audio_url?: string;
  video_url?: string;
  transcript?: string;
  google_maps_url?: string;
  status?: string;
};

export type DailyContent = {
  id: string;
  type: "hadith" | "ayah" | "lesson";
  title?: string;
  content: string;
  source?: string;
  explanation?: string;
};

export type FavoriteItem = {
  id: string;
  item_type: "lesson" | "book" | "sheikh" | "series" | "mosque";
  item_id: string;
  created_at?: string;
  label?: string;
  href?: string;
};

export type SearchResultItem = {
  id: string;
  type: string;
  typeLabel: string;
  title: string;
  excerpt?: string;
  sheikhName?: string;
  href: string;
};

export const SERIES_CATEGORIES = ["العقيدة", "الفقه", "التفسير", "الحديث", "السيرة"] as const;

export const QA_CATEGORIES = [
  "العقيدة",
  "الصلاة",
  "الزكاة",
  "الصيام",
  "الحج",
  "الأسرة",
  "المعاملات",
] as const;
