"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Loading } from "@/components/ui-common";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { SurahInfoCard } from "@/components/quran/SurahInfoCard";
import { TafsirSection } from "@/components/quran/TafsirSection";
import { AyahList } from "@/components/quran/AyahList";
import { QuranNav } from "@/components/quran/QuranNav";
import { useQuranSurah } from "@/hooks/useQuranSurah";
import { useQuranPreferences } from "@/hooks/useQuranPreferences";
import {
  fetchTafsirAyahs,
  getSavedTafsirId,
  saveTafsirId,
  TAFSIR_SOURCES,
} from "@/lib/quran-tafsir";
import { saveQuranPosition } from "@/lib/quran-content";
import "@/styles/quran-v2.css";

export default function QuranTafsirPage() {
  const {
    surah, setSurah, meta, targetAyah, setAyah, ayahs, loading, error, stats, lastPos, prevSurah, nextSurah,
  } = useQuranSurah();
  const { prefs } = useQuranPreferences();
  const { resolvedTheme } = useThemePreference();

  const [tafsirId, setTafsirId] = useState(getSavedTafsirId);
  const [tafsirAyahs, setTafsirAyahs] = useState<{ ayah: number; text: string }[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);

  const tafsirSource = TAFSIR_SOURCES.find((t) => t.id === tafsirId) || TAFSIR_SOURCES[0];
  const isNight = prefs.nightMode || resolvedTheme === "dark";

  useEffect(() => {
    saveTafsirId(tafsirId);
  }, [tafsirId]);

  useEffect(() => {
    if (!tafsirSource.apiEdition) {
      setTafsirAyahs([]);
      return;
    }
    setTafsirLoading(true);
    fetchTafsirAyahs(surah, tafsirSource.apiEdition)
      .then(setTafsirAyahs)
      .catch(() => setTafsirAyahs([]))
      .finally(() => setTafsirLoading(false));
  }, [surah, tafsirId, tafsirSource.apiEdition]);

  const tafsirMap = useMemo(() => {
    const m = new Map<number, string>();
    for (const t of tafsirAyahs) m.set(t.ayah, t.text);
    return m;
  }, [tafsirAyahs]);

  return (
    <div className={`page-shell quran-v2${isNight ? " quran-v2--night" : ""}`}>
      <PageHeader
        eyebrow="القرآن الكريم"
        title="التفسير"
        subtitle="تفسير الآيات مع القراءة النصية"
      />
      <QuranSubnav active="tafsir" />

      <header className="quran-v2-surah-title-block">
        <h2 className="quran-v2-surah-title">{meta.name}</h2>
        <p className="quran-v2-surah-subtitle">{meta.englishName} · {meta.ayahs} آية</p>
      </header>

      <SurahInfoCard
        meta={meta}
        stats={stats}
        lastPos={lastPos}
        onResume={lastPos ? () => setSurah(lastPos.surah) : undefined}
      />

      <QuranNav
        surah={surah}
        onPrev={() => prevSurah && setSurah(prevSurah)}
        onNext={() => nextSurah && setSurah(nextSurah)}
        onSelectSurah={setSurah}
      />

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="quran-v2-error" role="alert">{error}</div>
      ) : (
        <>
          <TafsirSection
            selectedId={tafsirId}
            onSelect={setTafsirId}
            tafsirAyahs={tafsirAyahs}
            loading={tafsirLoading}
            surahName={meta.name}
          />

          <AyahList
            ayahs={ayahs}
            prefs={prefs}
            targetAyah={targetAyah}
            onSelectAyah={(n) => {
              setAyah(n);
              saveQuranPosition(surah, n);
            }}
            tafsirByAyah={tafsirMap}
            surah={surah}
            surahName={meta.name}
          />
        </>
      )}
    </div>
  );
}
