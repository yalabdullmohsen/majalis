import { fetchSurahDetail } from "@/lib/quran-api";
import { buildReferenceWords, buildReferenceWordsForRange } from "./quran-reference-words";
import { getSegmentsForJuz, getSegmentsForPage, loadPageJuzIndex } from "./page-juz-lookup";
import type { ReferenceWord } from "./types";
import type { RecitationSetupConfig } from "./recitation-setup-types";

export async function loadReferenceWordsForSetup(config: RecitationSetupConfig): Promise<ReferenceWord[]> {
  if (config.scope === "page" || config.scope === "juz") {
    const index = await loadPageJuzIndex();
    const segments =
      config.scope === "page"
        ? getSegmentsForPage(index, config.pageNumber)
        : getSegmentsForJuz(index, config.juzNumber);
    if (segments.length === 0) {
      throw new Error(
        config.scope === "page"
          ? "رقم صفحة غير صالح ضمن نطاق المصحف."
          : "رقم جزء غير صالح (يجب أن يكون بين 1 و30).",
      );
    }
    const surahAyahs = await Promise.all(
      segments.map(async (seg) => {
        const detail = await fetchSurahDetail(seg.surah);
        const ayahs = detail.ayahs.filter(
          (a) => a.numberInSurah >= seg.ayahFrom && a.numberInSurah <= seg.ayahTo,
        );
        return { surahNumber: seg.surah, ayahs };
      }),
    );
    return buildReferenceWordsForRange(surahAyahs);
  }

  const detail = await fetchSurahDetail(config.surahNumber);
  const ayahs =
    config.scope === "ayah"
      ? detail.ayahs.filter(
          (a) => a.numberInSurah >= config.ayahFrom && a.numberInSurah <= config.ayahTo,
        )
      : detail.ayahs;
  if (ayahs.length === 0) throw new Error("نطاق الآيات فارغ — تحقّق من الأرقام.");
  return buildReferenceWords(config.surahNumber, ayahs);
}
