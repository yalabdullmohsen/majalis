import { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import {
  fetchSurahAyahs,
  getCachedSurahAyahs,
  getLastQuranPosition,
  getSurahMeta,
  saveQuranPosition,
  type SurahMeta,
} from "@/lib/quran-content";

export type AyahRow = { numberInSurah: number; text: string };

function readSurahFromUrl(): number {
  if (typeof window === "undefined") return 1;
  const n = Number(new URLSearchParams(window.location.search).get("surah"));
  return n >= 1 && n <= 114 ? n : getLastQuranPosition()?.surah || 1;
}

function readAyahFromUrl(max: number): number {
  if (typeof window === "undefined") return 1;
  const n = Number(new URLSearchParams(window.location.search).get("ayah"));
  return n >= 1 && n <= max ? n : getLastQuranPosition()?.ayah || 1;
}

export function estimateSurahStats(ayahs: AyahRow[]) {
  const text = ayahs.map((a) => a.text).join(" ");
  const words = text.split(/\s+/).filter(Boolean).length;
  const letters = text.replace(/\s/g, "").length;
  const readingMinutes = Math.max(1, Math.round(words / 130));
  return { words, letters, readingMinutes };
}

export function useQuranSurah() {
  const [, setLocation] = useLocation();
  const [surah, setSurahState] = useState(readSurahFromUrl);
  const meta = useMemo(() => getSurahMeta(surah), [surah]);
  const [targetAyah, setTargetAyah] = useState(() => readAyahFromUrl(meta.ayahs));
  const [ayahs, setAyahs] = useState<AyahRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const syncUrl = useCallback((s: number, ayah?: number) => {
    const params = new URLSearchParams();
    params.set("surah", String(s));
    if (ayah && ayah > 1) params.set("ayah", String(ayah));
    setLocation(`/quran?${params.toString()}`, { replace: true });
  }, [setLocation]);

  const setSurah = useCallback((n: number) => {
    const clamped = Math.min(114, Math.max(1, n));
    setSurahState(clamped);
    setTargetAyah(1);
    syncUrl(clamped);
  }, [syncUrl]);

  const setAyah = useCallback((n: number) => {
    const clamped = Math.min(meta.ayahs, Math.max(1, n));
    setTargetAyah(clamped);
    saveQuranPosition(surah, clamped);
    syncUrl(surah, clamped);
  }, [meta.ayahs, surah, syncUrl]);

  const loadSurah = useCallback(async (n: number) => {
    setLoading(true);
    setError("");
    const cached = getCachedSurahAyahs(n);
    if (cached?.length) setAyahs(cached);
    try {
      const data = await fetchSurahAyahs(n);
      setAyahs(data);
    } catch {
      if (!cached?.length) {
        setAyahs([]);
        setError("تعذر تحميل نص السورة. تحقق من الاتصال أو جرّب لاحقاً.");
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSurah(surah);
  }, [surah, loadSurah]);

  useEffect(() => {
    const onPop = () => {
      setSurahState(readSurahFromUrl());
      setTargetAyah(readAyahFromUrl(meta.ayahs));
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, [meta.ayahs]);

  const stats = useMemo(() => estimateSurahStats(ayahs), [ayahs]);
  const lastPos = getLastQuranPosition();

  return {
    surah,
    setSurah,
    meta: meta as SurahMeta,
    targetAyah,
    setAyah,
    ayahs,
    loading,
    error,
    stats,
    lastPos,
    prevSurah: surah > 1 ? surah - 1 : null,
    nextSurah: surah < 114 ? surah + 1 : null,
  };
}
