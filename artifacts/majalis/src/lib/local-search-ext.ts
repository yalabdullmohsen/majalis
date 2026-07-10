import { arabicMatchAny } from "@/lib/arabic-search";
import { searchNawawi } from "@/lib/arbaeen-nawawi-seed";
import { filterOccasions } from "@/lib/islamic-occasions-seed";
import { filterAdhkar } from "@/lib/adhkar-seed";
import { searchSurahStories } from "@/lib/surah-stories";
import { filterIslamicStoriesSeed } from "@/lib/islamic-stories-seed";
import { getSurahList } from "@/lib/quran-api";

export function searchLocalExtensions(query: string) {
  const q = query.trim();
  if (!q) {
    return { occasions: [], nawawi: [], quran: [], adhkar: [], surahStories: [], islamicStories: [] };
  }

  const occasions = filterOccasions(q).map((o) => ({
    id: o.id,
    title: o.name,
    meta: o.summary,
    href: "/occasions",
  }));

  const nawawi = searchNawawi(q).map((h) => ({
    id: String(h.id),
    title: h.title,
    meta: h.source,
    href: "/arbaeen-nawawi",
  }));

  const quran = getSurahList()
    .filter((s) => arabicMatchAny([s.name, String(s.number)], q))
    .slice(0, 8)
    .map((s) => ({
      id: String(s.number),
      title: `سورة ${s.name}`,
      meta: `${s.ayahs} آية`,
      href: `/quran?surah=${s.number}`,
    }));

  const adhkar = filterAdhkar(q)
    .slice(0, 6)
    .map((a) => ({
      id: a.id,
      title: a.text.slice(0, 80) + (a.text.length > 80 ? "..." : ""),
      meta: a.source || a.categoryId,
      href: "/adhkar",
    }));

  const surahStories = searchSurahStories(q)
    .slice(0, 4)
    .map((s) => ({
      id: String(s.number),
      title: `قصة سورة ${s.name}`,
      meta: s.namingReason.slice(0, 60) + "...",
      href: `/surah-stories/${s.number}`,
    }));

  const islamicStories = filterIslamicStoriesSeed({ search: q })
    .slice(0, 4)
    .map((s: { id: number; title: string; era: string; category: string; slug: string }) => ({
      id: String(s.id),
      title: s.title,
      meta: `${s.era} · ${s.category}`,
      href: `/stories/${s.slug}`,
    }));

  return { occasions, nawawi, quran, adhkar, surahStories, islamicStories };
}
