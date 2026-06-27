import { arabicMatchAny } from "@/lib/arabic-search";
import { LESSONS_SEED } from "@/lib/lessons-seed";
import { SEED_FAWAID } from "@/lib/fawaid-seed";
import { SEED_QA } from "@/lib/qa-seed";
import { getAllSurahStories } from "@/lib/surah-stories";

export type SuggestedItem = {
  id: string;
  title: string;
  href: string;
  meta: string;
  kind: "lesson" | "qa" | "surah-story" | "faida" | "book";
};

export function getRelatedContent(keywords: string[], category?: string, limit = 5): SuggestedItem[] {
  const terms = [...keywords, category].filter(Boolean) as string[];
  if (terms.length === 0) return [];

  const results: SuggestedItem[] = [];
  const seen = new Set<string>();

  const push = (item: SuggestedItem) => {
    if (seen.has(item.id)) return;
    seen.add(item.id);
    results.push(item);
  };

  for (const lesson of LESSONS_SEED) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([lesson.title, lesson.category, ...(lesson.keywords || [])], terms.join(" "))) continue;
    push({ id: `lesson-${lesson.id}`, title: lesson.title, href: `/lessons/${lesson.id}`, meta: "درس", kind: "lesson" });
  }

  for (const q of SEED_QA) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([q.question, q.answer, q.qa_categories?.name || ""], terms.join(" "))) continue;
    push({
      id: `qa-${q.id}`,
      title: q.question.slice(0, 80),
      href: `/qa?q=${encodeURIComponent(q.question.slice(0, 40))}`,
      meta: "سؤال",
      kind: "qa",
    });
  }

  for (const story of getAllSurahStories()) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([story.name, ...story.mainThemes, ...story.keywords], terms.join(" "))) continue;
    push({
      id: `story-${story.number}`,
      title: story.name,
      href: `/quran/surah-stories/${story.number}`,
      meta: "قصة سورة",
      kind: "surah-story",
    });
  }

  for (const f of SEED_FAWAID) {
    if (results.length >= limit) break;
    if (!arabicMatchAny([f.text, f.category], terms.join(" "))) continue;
    push({
      id: `faida-${f.id}`,
      title: f.text.slice(0, 72),
      href: `/fawaid?q=${encodeURIComponent(terms[0] || "")}`,
      meta: "فائدة",
      kind: "faida",
    });
  }

  push({
    id: "book-search",
    title: `كتب عن ${category || keywords[0] || "العلم"}`,
    href: `/library?q=${encodeURIComponent(category || keywords[0] || "تفسير")}`,
    meta: "مكتبة",
    kind: "book",
  });

  return results.slice(0, limit);
}
