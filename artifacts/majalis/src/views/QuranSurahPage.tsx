"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { QuranSubnav } from "@/components/quran/QuranSubnav";
import { VirtualAyahList } from "@/components/quran/VirtualAyahList";
import { AyahRow } from "@/components/quran/AyahRow";
import { TafsirTabs } from "@/components/quran/TafsirTabs";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import {
  fetchSurahAyahs,
  getCachedSurahAyahs,
  getLastQuranPosition,
  getSurahMeta,
  saveQuranPosition,
} from "@/lib/quran-content";
import { getAdjacentSurah, getSurahCardInfo } from "@/lib/quran-index";
import {
  QURAN_RECITERS,
  getReciterAudioUrl,
  getReciterById,
  getSavedReciterId,
  saveReciterId,
} from "@/lib/quran-reciters";
import {
  TAFSIR_SOURCES,
  fetchTafsirAyahs,
  getSavedTafsirId,
  saveTafsirId,
} from "@/lib/quran-tafsir";

function useSurahFromPath(defaultSurah: number) {
  const [location] = useLocation();
  const match = location.match(/\/quran\/surah\/(\d+)/);
  const fromPath = match ? Number(match[1]) : defaultSurah;
  return fromPath >= 1 && fromPath <= 114 ? fromPath : 1;
}

function useAyahFromQuery(defaultAyah: number) {
  const [ayah, setAyah] = useState(defaultAyah);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Number(params.get("ayah"));
    if (fromUrl >= 1) setAyah(fromUrl);
  }, []);
  return [ayah, setAyah] as const;
}

type Props = {
  surahNumber?: number;
};

export default function QuranSurahPage({ surahNumber: propSurah }: Props) {
  const initialSurah = getLastQuranPosition()?.surah ?? 1;
  const fromPath = useSurahFromPath(initialSurah);
  const surah = propSurah ?? fromPath;
  const [targetAyah, setTargetAyah] = useAyahFromQuery(1);
  const [ayahs, setAyahs] = useState<{ numberInSurah: number; text: string }[]>([]);
  const [tafsirAyahs, setTafsirAyahs] = useState<{ ayah: number; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [error, setError] = useState("");
  const [reciterId, setReciterId] = useState(getSavedReciterId);
  const [tafsirId, setTafsirId] = useState(getSavedTafsirId);
  const [showTafsir, setShowTafsir] = useState(false);
  const { resolvedTheme } = useThemePreference();
  const { preferences } = useUserPreferences();

  const reciter = getReciterById(reciterId) || QURAN_RECITERS[0];
  const tafsirSource = TAFSIR_SOURCES.find((t) => t.id === tafsirId) || TAFSIR_SOURCES[0];
  const meta = getSurahMeta(surah);
  const cardInfo = getSurahCardInfo(surah);
  const isDark = resolvedTheme === "dark";
  const fontScale = Number(preferences.quranFontScale || "22");
  const lineHeight = preferences.readingSpacing === "ضيق" ? 1.75 : 2.15;

  const loadSurah = useCallback(async (n: number) => {
    setLoading(true);
    setError("");
    const cached = getCachedSurahAyahs(n);
    if (cached) setAyahs(cached);
    try {
      const data = await fetchSurahAyahs(n);
      setAyahs(data);
    } catch {
      if (!cached?.length) {
        setAyahs([]);
        setError("تعذر تحميل نص السورة.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurah(surah);
    window.history.replaceState(null, "", `/quran/surah/${surah}${targetAyah > 1 ? `?ayah=${targetAyah}` : ""}`);
  }, [surah, loadSurah]);

  useEffect(() => {
    if (!showTafsir || !tafsirSource.apiEdition) {
      setTafsirAyahs([]);
      return;
    }
    setTafsirLoading(true);
    fetchTafsirAyahs(surah, tafsirSource.apiEdition)
      .then(setTafsirAyahs)
      .catch(() => setTafsirAyahs([]))
      .finally(() => setTafsirLoading(false));
  }, [surah, showTafsir, tafsirSource.apiEdition]);

  useEffect(() => {
    saveReciterId(reciterId);
  }, [reciterId]);

  useEffect(() => {
    saveTafsirId(tafsirId);
  }, [tafsirId]);

  useEffect(() => {
    saveQuranPosition(surah, targetAyah);
  }, [surah, targetAyah]);

  const prevSurah = getAdjacentSurah(surah, -1);
  const nextSurah = getAdjacentSurah(surah, 1);

  const tafsirMap = useMemo(() => {
    const m = new Map<number, string>();
    tafsirAyahs.forEach((t) => m.set(t.ayah, t.text));
    return m;
  }, [tafsirAyahs]);

  return (
    <div className={`page-shell quran-page quran-surah-page${isDark ? " quran-page--night" : ""}`}>
      <PageHeader eyebrow="القرآن" title={meta.name} subtitle={`${meta.ayahs} آية · ${meta.revelation} · جزء ${cardInfo.juz}`} />

      <QuranSubnav active="surah" />

      <div className="quran-toolbar ui-card">
        <Link href="/quran" className="ui-card-btn">← فهرس السور</Link>
        {prevSurah && <Link href={`/quran/surah/${prevSurah}`} className="ui-card-btn">السابقة</Link>}
        {nextSurah && <Link href={`/quran/surah/${nextSurah}`} className="ui-card-btn">التالية</Link>}
        <label className="quran-field-inline">
          <span>آية</span>
          <input
            type="number"
            min={1}
            max={meta.ayahs}
            value={targetAyah}
            onChange={(e) => setTargetAyah(Math.min(meta.ayahs, Math.max(1, Number(e.target.value) || 1)))}
            className="quran-ayah-jump"
          />
        </label>
        <select aria-label="القارئ" value={reciterId} onChange={(e) => setReciterId(e.target.value)} className="quran-select">
          {QURAN_RECITERS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button type="button" className="ui-card-btn" onClick={() => setShowTafsir((v) => !v)}>
          {showTafsir ? "إخفاء التفسير" : "التفسير"}
        </button>
      </div>

      {reciter && (
        <div className="quran-reciter-card ui-card">
          <audio controls src={getReciterAudioUrl(reciter, surah)} className="quran-audio" preload="metadata" />
        </div>
      )}

      {showTafsir && (
        <div className="quran-tafsir-panel ui-card">
          <TafsirTabs activeId={tafsirId} onChange={setTafsirId} />
          <p className="quran-source-note">{tafsirSource.description}</p>
          {tafsirLoading ? (
            <Loading />
          ) : !tafsirSource.apiEdition ? (
            <Link href={tafsirSource.searchHref?.(meta.name) || `/search/تفسير ${meta.name}`} className="ui-card-btn">
              بحث في {tafsirSource.name}
            </Link>
          ) : null}
        </div>
      )}

      {loading ? (
        <Loading />
      ) : error ? (
        <div className="quran-error" role="alert">{error}</div>
      ) : (
        <article className="quran-reader ui-card" style={{ fontSize: `${fontScale}px`, lineHeight }}>
          <VirtualAyahList
            count={ayahs.length}
            estimateHeight={showTafsir ? 120 : 88}
            renderRow={(index) => {
              const a = ayahs[index];
              if (!a) return null;
              return (
                <AyahRow
                  key={a.numberInSurah}
                  surah={surah}
                  surahName={meta.name}
                  ayah={a.numberInSurah}
                  text={a.text}
                  tafsir={tafsirMap.get(a.numberInSurah)}
                  highlighted={a.numberInSurah === targetAyah}
                  showTafsir={showTafsir}
                  onSelect={(n) => setTargetAyah(n)}
                />
              );
            }}
          />
        </article>
      )}
    </div>
  );
}

export function QuranSurahRoute() {
  const [location] = useLocation();
  const match = location.match(/\/quran\/surah\/(\d+)/);
  const surah = Number(match?.[1]) || 1;
  return <QuranSurahPage surahNumber={surah} />;
}
