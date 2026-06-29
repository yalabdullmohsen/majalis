import { arabicMatchAny } from "@/lib/arabic-search";
import { searchNawawi } from "@/lib/arbaeen-nawawi-seed";
import { filterOccasions } from "@/lib/islamic-occasions-seed";
import { getSurahList } from "@/lib/quran-content";
import { PC_FATWA_SEED } from "@/lib/permanent-committee/seed";

export function searchLocalExtensions(query: string) {
  const q = query.trim();
  if (!q) {
    return { occasions: [], nawawi: [], quran: [], permanentCommittee: [] };
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

  const permanentCommittee = PC_FATWA_SEED.filter((f) =>
    arabicMatchAny([f.title, f.question, f.answer, f.category, ...(f.keywords || [])], q),
  )
    .slice(0, 8)
    .map((f) => ({
      id: f.id,
      title: f.title || f.question,
      meta: `اللجنة الدائمة · ${f.category}`,
      href: `/permanent-committee/${f.id}`,
    }));

  return { occasions, nawawi, quran, permanentCommittee };
}
