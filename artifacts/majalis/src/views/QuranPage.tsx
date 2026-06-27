"use client";

import { useEffect, useMemo, useState } from "react";
import { PageHeader, Loading } from "@/components/ui-common";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { SurahInfoCard } from "@/components/quran/SurahInfoCard";
import { QuranToolbar } from "@/components/quran/QuranToolbar";
import { ReciterPicker } from "@/components/quran/ReciterPicker";
import { QuranAudioPlayer } from "@/components/quran/QuranAudioPlayer";
import { TafsirSection } from "@/components/quran/TafsirSection";
import { AyahList } from "@/components/quran/AyahList";
import { QuranNav } from "@/components/quran/QuranNav";
import { useQuranSurah } from "@/hooks/useQuranSurah";
import { useQuranPreferences } from "@/hooks/useQuranPreferences";
import { useQuranAudio } from "@/hooks/useQuranAudio";
import {
  fetchTafsirAyahs,
  getSavedTafsirId,
  saveTafsirId,
  TAFSIR_SOURCES,
} from "@/lib/quran-tafsir";
import { getSurahList, saveQuranPosition } from "@/lib/quran-content";
import "@/styles/quran-v2.css";

export default function QuranPage() {
  const {
    surah, setSurah, meta, targetAyah, setAyah, ayahs, loading, error, stats, lastPos, prevSurah, nextSurah,
  } = useQuranSurah();
  const { prefs, setPref } = useQuranPreferences();
  const audio = useQuranAudio(surah, targetAyah);
  const { resolvedTheme } = useThemePreference();

  const [tafsirId, setTafsirId] = useState(getSavedTafsirId);
  const [tafsirAyahs, setTafsirAyahs] = useState<{ ayah: number; text: string }[]>([]);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [surahSearch, setSurahSearch] = useState("");

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

  const filteredSurahs = useMemo(() => {
    const q = surahSearch.trim();
    if (!q) return null;
    return getSurahList().filter(
      (s) => s.name.includes(q) || s.englishName.toLowerCase().includes(q.toLowerCase()) || String(s.number).includes(q),
    );
  }, [surahSearch]);

  return (
    <div className={`page-shell quran-v2${isNight ? " quran-v2--night" : ""}`}>
      {/* 1. Header */}
      <PageHeader
        eyebrow="القرآن الكريم"
        title="المصحف الشريف"
        subtitle="قراءة · تلاوة · تفسير — تجربة قرآنية احترافية"
      />
      <QuranSubnav />

      {/* Surah quick pick when searching */}
      {filteredSurahs && surahSearch.trim() && (
        <div className="quran-v2-surah-pick ui-card">
          {filteredSurahs.slice(0, 8).map((s) => (
            <button key={s.number} type="button" onClick={() => { setSurah(s.number); setSurahSearch(""); }}>
              {s.number}. {s.name}
            </button>
          ))}
        </div>
      )}

      {/* 2. Surah name + 3. Info card */}
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

      {/* 4. Reading toolbar */}
      <QuranToolbar
        surahSearch={surahSearch}
        onSurahSearch={setSurahSearch}
        onJumpAyah={setAyah}
        maxAyah={meta.ayahs}
        targetAyah={targetAyah}
      />

      {/* 5. Reciter + 7. Audio player */}
      <QuranAudioPlayer
        audio={audio}
        onPrevSurah={prevSurah ? () => setSurah(prevSurah) : undefined}
        onNextSurah={nextSurah ? () => setSurah(nextSurah) : undefined}
      />
      <ReciterPicker
        reciters={audio.reciters}
        selectedId={audio.reciterId}
        onSelect={audio.setReciterId}
        open={audio.pickerOpen}
        onClose={() => audio.setPickerOpen(false)}
      />

      {/* 8. Navigation */}
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
          {/* 6. Tafsir */}
          <TafsirSection
            selectedId={tafsirId}
            onSelect={setTafsirId}
            tafsirAyahs={tafsirAyahs}
            loading={tafsirLoading}
            surahName={meta.name}
          />

          {/* 9. Ayahs */}
          <AyahList
            ayahs={ayahs}
            prefs={prefs}
            targetAyah={targetAyah}
            onSelectAyah={(n) => {
              setAyah(n);
              saveQuranPosition(surah, n);
            }}
            tafsirByAyah={tafsirMap}
            onPlayFromAyah={audio.playFromAyah}
            surahName={meta.name}
          />
        </>
      )}
    </div>
  );
}
