import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import {
  fetchSurahList,
  fetchSurahDetail,
  savePosition,
  loadPosition,
  type SurahSummary,
  type SurahDetail,
} from "@/lib/quran-api";

function parseSurahFromUrl(): number {
  if (typeof window === "undefined") return 1;
  const n = Number(new URLSearchParams(window.location.search).get("surah"));
  return n >= 1 && n <= 114 ? n : loadPosition()?.surah ?? 1;
}

function parseAyahFromUrl(): number {
  if (typeof window === "undefined") return 1;
  const n = Number(new URLSearchParams(window.location.search).get("ayah"));
  return n >= 1 ? n : loadPosition()?.ayah ?? 1;
}

export function useQuranReader() {
  const [, setLocation] = useLocation();

  const [surahList, setSurahList] = useState<SurahSummary[]>([]);
  const [surahNum, setSurahNum] = useState<number>(parseSurahFromUrl);
  const [detail, setDetail] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [targetAyah, setTargetAyah] = useState<number>(parseAyahFromUrl);

  // load surah list once
  useEffect(() => {
    fetchSurahList()
      .then(setSurahList)
      .catch(() => { /* list loads silently */ });
  }, []);

  const syncUrl = useCallback((s: number, ayah?: number) => {
    const p = new URLSearchParams();
    p.set("surah", String(s));
    if (ayah && ayah > 1) p.set("ayah", String(ayah));
    setLocation(`/quran?${p.toString()}`, { replace: true });
  }, [setLocation]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchSurahDetail(surahNum)
      .then((d) => { if (!cancelled) { setDetail(d); setLoading(false); } })
      .catch(() => {
        if (!cancelled) {
          setError("تعذّر تحميل نص السورة. تحقق من الاتصال وأعد المحاولة.");
          setDetail(null);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [surahNum]);

  const goToSurah = useCallback((n: number, ayah = 1) => {
    const clamped = Math.min(114, Math.max(1, n));
    setSurahNum(clamped);
    setTargetAyah(ayah);
    syncUrl(clamped, ayah);
  }, [syncUrl]);

  const goToAyah = useCallback((ayah: number) => {
    const max = detail?.numberOfAyahs ?? 1;
    const clamped = Math.min(max, Math.max(1, ayah));
    setTargetAyah(clamped);
    savePosition(surahNum, clamped);
    syncUrl(surahNum, clamped);
  }, [detail, surahNum, syncUrl]);

  const summary = surahList.find((s) => s.number === surahNum) ?? null;

  return {
    surahList,
    surahNum,
    summary,
    detail,
    loading,
    error,
    targetAyah,
    goToSurah,
    goToAyah,
    lastPos: loadPosition(),
    prevSurah: surahNum > 1 ? surahNum - 1 : null,
    nextSurah: surahNum < 114 ? surahNum + 1 : null,
  };
}
