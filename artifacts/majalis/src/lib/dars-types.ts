/** أنواع فهرس الدروس الأكورديون — ملف رفيع بلا بيانات. */
export type DarsItem = { id: string; title: string; summary?: string; body?: string };
export type DarsSection = {
  id: string;
  num: string;
  title: string;
  icon: string;
  color: string;
  lessons: DarsItem[];
};
