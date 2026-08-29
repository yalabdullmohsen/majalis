/**
 * مشغّل تحفيظ A-B — يعرض آيات السورة مع تظليل الآية الجارية
 * ويربط بـ AudioEngine + ayah-loop-controller (بلا تكرار منطق التشغيل).
 */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Pause, Play, Repeat, RotateCcw, Sliders } from "lucide-react";
import { AudioEngine, type AudioEngineSnapshot } from "@/core/audio/AudioEngine";
import { fetchSurahDetail, getSurahMeta, type Ayah } from "@/lib/quran-api";
import { getReciter, loadReciterId } from "@/lib/quran-audio";
import {
  HIFZ_PLAYBACK_RATES,
  hifzPrefsToLoopConfig,
  loadHifzPrefs,
  saveHifzPrefs,
  type HifzPrefs,
} from "@/lib/recitation-hifz-prefs";
import { toArabicDigits } from "@/lib/utils";
import { useMediaSession } from "@/hooks/useMediaSession";
import "@/styles/components/hifz-audio-loop-player.css";

const SILENCE_MS = [0, 1000, 2000, 3000, 5000] as const;

export type HifzAudioLoopPlayerProps = {
  surah: number;
  reciterId?: string;
};

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${String(s).padStart(2, "0")}`;
}

function defaultHifz(surah: number, total: number): HifzPrefs {
  const saved = loadHifzPrefs();
  if (saved && saved.surah === surah) return saved;
  return {
    surah,
    startAyah: 1,
    endAyah: Math.min(total, 7),
    repeatCount: 0,
    delayMs: 2000,
    playbackRate: 1,
    updatedAt: 0,
  };
}

export function HifzAudioLoopPlayer({ surah, reciterId }: HifzAudioLoopPlayerProps) {
  const engine = useMemo(() => AudioEngine.getInstance(), []);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loadingAyahs, setLoadingAyahs] = useState(true);
  const [snap, setSnap] = useState<AudioEngineSnapshot>(() => engine.getSnapshot());
  const [hifz, setHifz] = useState<HifzPrefs>(() =>
    defaultHifz(surah, getSurahMeta(surah).ayahs),
  );
  const [loopUiActive, setLoopUiActive] = useState(() => loadHifzPrefs()?.surah === surah);
  const verseRefs = useRef<Map<number, HTMLButtonElement>>(new Map());

  const meta = getSurahMeta(surah);
  const reciter = getReciter(reciterId ?? snap.reciterId ?? loadReciterId());
  const surahTitle = meta.name.replace(/^سُورَةُ\s*/u, "");
  const playing =
    snap.playerState === "playing" ||
    snap.playerState === "buffering" ||
    snap.playerState === "loading";
  const loopEngineActive = snap.loopConfig != null && snap.surah === surah;
  const isWaitingLoop =
    loopEngineActive && snap.playerState === "paused" && !playing && snap.duration > 0;

  useEffect(() => {
    let cancelled = false;
    setLoadingAyahs(true);
    void fetchSurahDetail(surah)
      .then((detail) => {
        if (cancelled) return;
        setAyahs(detail.ayahs);
        setHifz(() => defaultHifz(surah, detail.ayahs.length));
      })
      .finally(() => {
        if (!cancelled) setLoadingAyahs(false);
      });
    return () => {
      cancelled = true;
    };
  }, [surah]);

  useEffect(() => engine.onSnapshot(setSnap), [engine]);

  useEffect(() => {
    if (snap.loopConfig && snap.surah === surah) setLoopUiActive(true);
  }, [snap.loopConfig, snap.surah, surah]);

  useEffect(() => {
    const ayah = snap.ayah;
    if (ayah == null || snap.surah !== surah) return;
    const el = verseRefs.current.get(ayah);
    el?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [snap.ayah, snap.surah, surah]);

  useMediaSession(
    snap.surah === surah && snap.ayah != null
      ? {
          title: `${surahTitle} — آية ${toArabicDigits(snap.ayah)}`,
          artist: reciter.nameAr,
          album: "تحفيظ — سُنّة",
          playing,
          position: snap.currentTime,
          duration: snap.duration,
          playbackRate: snap.playbackRate,
        }
      : null,
  );

  const applyLoop = useCallback(
    (prefs: HifzPrefs) => {
      const cfg = hifzPrefsToLoopConfig(prefs);
      engine.setPlaybackRate(prefs.playbackRate);
      engine.setLoopConfig(surah, cfg);
      saveHifzPrefs(prefs);
      void engine.playAyah(surah, prefs.startAyah, reciter.id);
    },
    [engine, reciter.id, surah],
  );

  const toggleLoop = useCallback(() => {
    if (loopUiActive) {
      engine.setLoopConfig(surah, null);
      setLoopUiActive(false);
      return;
    }
    const prefs = { ...hifz, surah, updatedAt: Date.now() };
    setLoopUiActive(true);
    applyLoop(prefs);
  }, [applyLoop, engine, hifz, loopUiActive, surah]);

  const jumpToAyah = useCallback(
    (ayahNum: number) => {
      void engine.playAyah(surah, ayahNum, reciter.id);
    },
    [engine, reciter.id, surah],
  );

  const togglePlay = useCallback(() => {
    const ayah = snap.ayah ?? hifz.startAyah;
    void engine.togglePlay(surah, ayah);
  }, [engine, hifz.startAyah, snap.ayah, surah]);

  const restartFromStart = useCallback(() => {
    void engine.playAyah(surah, hifz.startAyah, reciter.id);
  }, [engine, hifz.startAyah, reciter.id, surah]);

  const setRate = useCallback(
    (rate: number) => {
      setHifz((p) => ({ ...p, playbackRate: rate }));
      engine.setPlaybackRate(rate);
    },
    [engine],
  );

  const updateHifzField = useCallback(
    (patch: Partial<HifzPrefs>) => {
      setHifz((p) => {
        const next = { ...p, ...patch, surah, updatedAt: Date.now() };
        if (loopUiActive) applyLoop(next);
        return next;
      });
    },
    [applyLoop, loopUiActive, surah],
  );

  if (loadingAyahs) {
    return <div className="hifz-loop hifz-loop__loading">جاري تحميل الآيات…</div>;
  }

  if (!ayahs.length) {
    return <div className="hifz-loop hifz-loop__empty">تعذّر تحميل نص السورة.</div>;
  }

  const totalAyahs = ayahs.length;

  return (
    <div className="hifz-loop" data-testid="hifz-audio-loop-player">
      <header className="hifz-loop__header surface-brand">
        <h2 className="hifz-loop__title">{surahTitle}</h2>
        <p className="hifz-loop__reciter">{reciter.nameAr}</p>
      </header>

      <div className="hifz-loop__verses" aria-label="آيات السورة">
        {ayahs.map((ayah) => {
          const num = ayah.numberInSurah;
          const isActive = snap.surah === surah && snap.ayah === num;
          const inRange =
            loopUiActive && num >= hifz.startAyah && num <= Math.max(hifz.startAyah, hifz.endAyah);

          return (
            <button
              key={ayah.number}
              type="button"
              ref={(el) => {
                if (el) verseRefs.current.set(num, el);
                else verseRefs.current.delete(num);
              }}
              className={`hifz-loop__verse${isActive ? " hifz-loop__verse--active" : ""}${inRange ? " hifz-loop__verse--in-range" : ""}`}
              onClick={() => jumpToAyah(num)}
            >
              <p className="hifz-loop__verse-text">{ayah.text}</p>
              <span className="hifz-loop__verse-num">﴿{toArabicDigits(num)}﴾</span>
            </button>
          );
        })}
      </div>

      <div className="hifz-loop__controls">
        <div className="hifz-loop__loop-panel">
          <div className="hifz-loop__loop-row">
            <button
              type="button"
              className={`hifz-loop__loop-toggle${loopUiActive ? " hifz-loop__loop-toggle--on" : ""}`}
              onClick={toggleLoop}
              aria-pressed={loopUiActive}
            >
              <Repeat size={16} aria-hidden="true" />
              <span>تكرار التحفيظ (A-B)</span>
            </button>
            {isWaitingLoop ? (
              <span className="hifz-loop__wait">⏱️ فترة صمت للترديد…</span>
            ) : null}
          </div>

          {loopUiActive ? (
            <div className="hifz-loop__loop-fields">
              <label>
                من آية
                <select
                  value={hifz.startAyah}
                  onChange={(e) =>
                    updateHifzField({
                      startAyah: Math.max(1, Math.min(totalAyahs, Number(e.target.value) || 1)),
                    })
                  }
                >
                  {ayahs.map((a) => (
                    <option key={a.numberInSurah} value={a.numberInSurah}>
                      {toArabicDigits(a.numberInSurah)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                إلى آية
                <select
                  value={hifz.endAyah}
                  onChange={(e) =>
                    updateHifzField({
                      endAyah: Math.max(hifz.startAyah, Math.min(totalAyahs, Number(e.target.value) || 1)),
                    })
                  }
                >
                  {ayahs.map((a) => (
                    <option key={a.numberInSurah} value={a.numberInSurah}>
                      {toArabicDigits(a.numberInSurah)}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                فترة الصمت
                <select
                  value={hifz.delayMs}
                  onChange={(e) => updateHifzField({ delayMs: Number(e.target.value) || 0 })}
                >
                  {SILENCE_MS.map((ms) => (
                    <option key={ms} value={ms}>
                      {ms === 0 ? "بدون" : `${toArabicDigits(ms / 1000)} ث`}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>

        <div className="hifz-loop__transport">
          <div className="hifz-loop__rates" role="group" aria-label="سرعة التشغيل">
            <Sliders size={14} aria-hidden="true" />
            {HIFZ_PLAYBACK_RATES.map((rate) => (
              <button
                key={rate}
                type="button"
                className={`hifz-loop__rate${Math.abs(snap.playbackRate - rate) < 0.01 ? " hifz-loop__rate--active" : ""}`}
                onClick={() => setRate(rate)}
              >
                {rate}×
              </button>
            ))}
          </div>

          <div className="hifz-loop__play-group">
            <button
              type="button"
              className="hifz-loop__icon-btn"
              onClick={restartFromStart}
              title="إعادة من بداية النطاق"
            >
              <RotateCcw size={20} aria-hidden="true" />
            </button>
            <button
              type="button"
              className="hifz-loop__play"
              onClick={togglePlay}
              aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
            >
              {playing ? <Pause size={24} aria-hidden="true" /> : <Play size={24} aria-hidden="true" />}
            </button>
          </div>

          <div className="hifz-loop__clock" aria-live="polite">
            {formatClock(snap.currentTime)} / {formatClock(snap.duration)}
          </div>
        </div>
      </div>
    </div>
  );
}
