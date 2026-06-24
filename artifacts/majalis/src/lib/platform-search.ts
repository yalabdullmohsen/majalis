import { getBooks, getLessonSeries, getMosques, getPlatformLessons } from "./platform-api";

export async function searchPlatformExtras(query: string) {
  const q = query.trim().toLowerCase();
  if (!q) {
    return { books: [], series: [], mosques: [], transcripts: [] as any[] };
  }

  const [books, series, mosques, lessons] = await Promise.all([
    getBooks(),
    getLessonSeries(),
    getMosques(),
    getPlatformLessons(),
  ]);

  const match = (text?: string) => String(text || "").toLowerCase().includes(q);

  return {
    books: books.filter((b) => match(b.title) || match(b.author) || match(b.category)),
    series: series.filter((s) => match(s.title) || match(s.sheikh_name) || match(s.category)),
    mosques: mosques.filter((m) => match(m.name) || match(m.area) || match(m.governorate)),
    transcripts: lessons.filter((l) => match(l.transcript) || match(l.title)),
  };
}
