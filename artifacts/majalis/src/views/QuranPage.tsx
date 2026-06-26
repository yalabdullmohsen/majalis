"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { PageHeader, Loading } from "@/components/ui-common";
import { useThemePreference } from "@/components/ThemePreferenceProvider";
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import {
  fetchSurahAyahs,
  getCachedSurahAyahs,
  getLastQuranPosition,
  getSurahMeta,
  getSurahList,
  saveQuranPosition,
} from "@/lib/quran-content";
import {
  QURAN_RECITERS,
  getReciterAudioUrl,
  getReciterById,
  getSavedReciterId,
  saveReciterId,
  getAudioPosition,
  saveAudioPosition,
} from "@/lib/quran-reciters";
import {
  TAFSIR_SOURCES,
  fetchTafsirAyahs,
  getSavedTafsirId,
  saveTafsirId,
} from "@/lib/quran-tafsir";

function useQuerySurah(defaultSurah: number) {
  const [surah, setSurah] = useState(defaultSurah);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromUrl = Number(params.get("surah"));
    if (fromUrl >= 1 && fromUrl <= 114) setSurah(fromUrl);
  }, []);
  return [surah, setSurah] as const;
}

export default function QuranPage() {
  const initialSurah = getLastQuranPosition()?.surah || 1;
  const [surah, setSurah] = useQuerySurah(initialSurah);
  const [targetAyah, setTargetAyah] = useState(1);
  const [ayahs, setAyahs] = useState<{ numberInSurah: number; text: string }[]>([]);
  const [tafsirAyahs, setTafsirAyahs] = useState<{ ayah: number; text: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tafsirLoading, setTafsirLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [reciterId, setReciterId] = useState(getSavedReciterId);
  const [tafsirId, setTafsirId] = useState(getSavedTafsirId);
  const [showTafsir, setShowTafsir] = useState(false);
  const [fontScale, setFontScale] = useState(() => {
    if (typeof window === "undefined") return 22;
    return Number(localStorage.getItem("majalis-quran-font-v1") || "22");
  });
  const { resolvedTheme } = useThemePreference();
  const { preferences } = useUserPreferences();
  const audioRef = useRef<HTMLAudioElement>(null);
  const ayahRefs = useRef<Map<number, HTMLParagraphElement>>(new Map());

  const reciter = getReciterById(reciterId) || QURAN_RECITERS[0];
  const tafsirSource = TAFSIR_SOURCES.find((t) => t.id === tafsirId) || TAFSIR_SOURCES[0];
  const isDark = resolvedTheme === "dark";

  const loadSurah = useCallback(async (n: number) => {
    setLoading(true);
    setError("");
    const cached = getCachedSurahAyahs(n);
    if (cached) setAyahs(cached);
    try {
      const data = await fetchSurahAyahs(n);
      setAyahs(data);
      saveQuranPosition(n, targetAyah);
    } catch {
      if (!cached?.length) {
        setAyahs([]);
        setError("تعذر تحميل نص السورة. جرّب التحديث — قد تكون نسخة مخزّنة متاحة بدون إنترنت.");
      }
    } finally {
      setLoading(false);
    }
  }, [targetAyah]);

  useEffect(() => {
    loadSurah(surah);
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
    try {
      localStorage.setItem("majalis-quran-font-v1", String(fontScale));
    } catch {
      /* ignore */
    }
  }, [fontScale]);

  useEffect(() => {
    const el = ayahRefs.current.get(targetAyah);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
  }, [targetAyah, ayahs]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const saved = getAudioPosition(reciterId, surah);
    if (saved > 0) audio.currentTime = saved;
    const onTime = () => saveAudioPosition(reciterId, surah, audio.currentTime);
    audio.addEventListener("timeupdate", onTime);
    return () => audio.removeEventListener("timeupdate", onTime);
  }, [reciterId, surah]);

  const surahs = getSurahList().filter((s) =>
    !search.trim() ||
    s.name.includes(search.trim()) ||
    s.englishName.toLowerCase().includes(search.trim().toLowerCase()) ||
    String(s.number).includes(search.trim()),
  );
  const meta = getSurahMeta(surah);
  const lastPos = getLastQuranPosition();

  return (
    <div className={`page-shell quran-page${isDark ? " quran-page--night" : ""}`}>
      <PageHeader
        eyebrow="القرآن"
        title="المصحف الشريف"
        subtitle="قراءة بالرسم العثماني — تلاوات — تفسير — بحث"
      />

      <nav className="quran-subnav" aria-label="أقسام القرآن">
        <Link href="/quran" className="quran-subnav__link is-active">المصحف</Link>
        <Link href="/quran/tajweed" className="quran-subnav__link">التجويد</Link>
        <Link href="/quran/surah-stories" className="quran-subnav__link">قصص السور</Link>
        <Link href="/quran-live" className="quran-subnav__link">البث المباشر</Link>
        <Link href="/quran-radio" className="quran-subnav__link">الإذاعات</Link>
        <Link href="/daily-wird" className="quran-subnav__link">الورد اليومي</Link>
      </nav>

      <div className="quran-toolbar ui-card">
        <input
          aria-label="بحث عن سورة"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="بحث عن سورة..."
          className="quran-search"
        />
        <select
          aria-label="اختيار السورة"
          value={surah}
          onChange={(e) => setSurah(Number(e.target.value))}
          className="quran-select"
        >
          {surahs.map((s) => (
            <option key={s.number} value={s.number}>
              {s.number}. {s.name}
            </option>
          ))}
        </select>
        <label className="quran-field-inline">
          <span>انتقال للآية</span>
          <input
            type="number"
            min={1}
            max={meta.ayahs}
            value={targetAyah}
            onChange={(e) => setTargetAyah(Math.min(meta.ayahs, Math.max(1, Number(e.target.value) || 1)))}
            className="quran-ayah-jump"
          />
        </label>
        <label className="quran-field-inline">
          <span>حجم الخط</span>
          <input
            type="range"
            min={16}
            max={36}
            value={fontScale}
            onChange={(e) => setFontScale(Number(e.target.value))}
          />
        </label>
        <select
          aria-label="القارئ"
          value={reciterId}
          onChange={(e) => setReciterId(e.target.value)}
          className="quran-select"
        >
          {QURAN_RECITERS.map((r) => (
            <option key={r.id} value={r.id}>{r.name}</option>
          ))}
        </select>
        <button type="button" className="ui-card-btn" onClick={() => setShowTafsir((v) => !v)}>
          {showTafsir ? "إخفاء التفسير" : "عرض التفسير"}
        </button>
      </div>

      {reciter && (
        <div className="quran-reciter-card ui-card">
          <strong>{reciter.name}</strong>
          <p>{reciter.bio}</p>
          <audio
            ref={audioRef}
            controls
            src={getReciterAudioUrl(reciter, surah)}
            className="quran-audio"
            preload="metadata"
          />
        </div>
      )}

      {lastPos && (
        <p className="quran-resume">
          آخر موضع: سورة {lastPos.surah} — آية {lastPos.ayah || 1}
          <button type="button" className="quran-resume-btn" onClick={() => setSurah(lastPos.surah)}>
            استئناف
          </button>
        </p>
      )}

      {loading ? (
        <Loading />
      ) : (
        <article className="quran-reader ui-card">
          <header className="quran-surah-header">
            <div>
              <h2 className="quran-surah-title">{meta.name}</h2>
              <p className="quran-surah-meta">
                {meta.number} · {meta.ayahs} آية · {meta.revelation}
              </p>
            </div>
          </header>

          {showTafsir && (
            <div className="quran-tafsir-panel">
              <div className="quran-tafsir-head">
                <strong>التفسير: {tafsirSource.name}</strong>
                <select value={tafsirId} onChange={(e) => setTafsirId(e.target.value)} className="quran-select">
                  {TAFSIR_SOURCES.map((t) => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>
              </div>
              <p className="quran-source-note">{tafsirSource.description} — {tafsirSource.author}</p>
              {tafsirLoading ? (
                <Loading />
              ) : tafsirSource.apiEdition && tafsirAyahs.length > 0 ? (
                tafsirAyahs.map((t) => (
                  <p key={t.ayah} className="quran-tafsir-ayah">
                    <span className="quran-ayah-num">{t.ayah}</span> {t.text}
                  </p>
                ))
              ) : (
                <div className="quran-link-row">
                  {TAFSIR_SOURCES.filter((t) => t.searchHref).map((t) => (
                    <Link key={t.id} href={t.searchHref!(meta.name)}>
                      {t.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {error ? (
            <div className="quran-error" role="alert">{error}</div>
          ) : (
            <div
              className="quran-ayah-list"
              style={{ fontSize: `${fontScale}px`, lineHeight: preferences.readingSpacing === "ضيق" ? 1.7 : 2.2 }}
            >
              {ayahs.map((a) => {
                const tafsir = tafsirAyahs.find((t) => t.ayah === a.numberInSurah);
                return (
                  <p
                    key={a.numberInSurah}
                    ref={(el) => { if (el) ayahRefs.current.set(a.numberInSurah, el); }}
                    className={`quran-ayah home-ayah-text${a.numberInSurah === targetAyah ? " is-highlighted" : ""}`}
                    onClick={() => {
                      setTargetAyah(a.numberInSurah);
                      saveQuranPosition(surah, a.numberInSurah);
                    }}
                  >
                    <span className="quran-ayah-num">{a.numberInSurah}</span>
                    {a.text}
                    {showTafsir && tafsir && (
                      <span className="quran-inline-tafsir">{tafsir.text}</span>
                    )}
                  </p>
                );
              })}
            </div>
          )}
        </article>
      )}
    </div>
  );
}
