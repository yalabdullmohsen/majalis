/**
 * شريط تلاوة مصغّر ثابت (56px) فوق شريط التنقّل — توسعة بحركة spring ووضع حفظ.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { ChevronUp, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { AudioEngine, type AudioEngineSnapshot } from "@/core/audio/AudioEngine";
import { getSurahMeta } from "@/lib/quran-api";
import { getReciter } from "@/lib/quran-audio";
import { ayahKeyToPage } from "@/lib/quran-my-bookmarks";
import { toArabicDigits } from "@/lib/utils";
import {
  stopMiniPlayer,
  subscribeMiniPlayer,
} from "@/lib/quran-mini-player";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { useMediaSession } from "@/hooks/useMediaSession";
import {
  HIFZ_PLAYBACK_RATES,
  hifzPrefsToLoopConfig,
  loadHifzPrefs,
  saveHifzPrefs,
  type HifzPrefs,
} from "@/lib/recitation-hifz-prefs";
import "@/styles/components/quran-mini-player.css";

function formatClock(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return "٠:٠٠";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${toArabicDigits(m)}:${toArabicDigits(String(s).padStart(2, "0"))}`;
}

function rateLabel(rate: number): string {
  if (Math.abs(rate - 0.75) < 0.01) return "0.75×";
  if (Math.abs(rate - 1.25) < 0.01) return "1.25×";
  return "1×";
}

const SILENCE_OPTIONS_MS = [0, 500, 1000, 2000, 3000] as const;

export function QuranMiniPlayerBar() {
  const [location, navigate] = useLocation();
  const [visible, setVisible] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [snap, setSnap] = useState<AudioEngineSnapshot>(() =>
    AudioEngine.getInstance().getSnapshot(),
  );
  const [hifz, setHifz] = useState<HifzPrefs>(() => {
    const saved = loadHifzPrefs();
    if (saved) return saved;
    return {
      surah: 1,
      startAyah: 1,
      endAyah: 1,
      repeatCount: 3,
      delayMs: 500,
      playbackRate: 1,
      updatedAt: 0,
    };
  });
  const dragRef = useRef<{ y0: number; expanded0: boolean } | null>(null);
  const immersive = isImmersiveChromePath(location);

  useEffect(() => subscribeMiniPlayer((s) => setVisible(s.visible)), []);

  useEffect(() => {
    const engine = AudioEngine.getInstance();
    return engine.onSnapshot(setSnap);
  }, []);

  useEffect(() => {
    if (!visible) setExpanded(false);
  }, [visible]);

  // مزامنة نموذج الحفظ مع الآية الجارية عند أول ظهور
  useEffect(() => {
    if (!visible || snap.surah == null || snap.ayah == null) return;
    setHifz((prev) => {
      if (prev.updatedAt > 0 && prev.surah === snap.surah) return prev;
      return {
        ...prev,
        surah: snap.surah!,
        startAyah: snap.ayah!,
        endAyah: Math.max(prev.endAyah, snap.ayah!),
      };
    });
  }, [visible, snap.surah, snap.ayah]);

  const surahForSession = snap.surah != null ? getSurahMeta(snap.surah).name : "";
  const playing = snap.playerState === "playing" || snap.playerState === "buffering";
  useMediaSession(
    visible && snap.surah != null && snap.ayah != null
      ? {
          title: `${surahForSession} — آية ${toArabicDigits(snap.ayah)}`,
          artist: getReciter(snap.reciterId).nameAr,
          playing,
          onPlay: () => {
            if (snap.surah != null && snap.ayah != null) {
              void AudioEngine.getInstance().togglePlay(snap.surah, snap.ayah);
            }
          },
          onPause: () => AudioEngine.getInstance().pause(),
          onStop: () => stopMiniPlayer(),
          onNext: () => {
            void AudioEngine.getInstance().skipNext();
          },
          onPrevious: () => {
            void AudioEngine.getInstance().skipPrev();
          },
        }
      : null,
  );

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button, input, select, label")) return;
      dragRef.current = { y0: e.clientY, expanded0: expanded };
      (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
    },
    [expanded],
  );

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    const d = dragRef.current;
    dragRef.current = null;
    if (!d) return;
    const dy = e.clientY - d.y0;
    // سحب لأعلى يوسّع، لأسفل يطوي (إحداثيات الشاشة: أعلى = أصغر Y)
    if (dy < -36) setExpanded(true);
    else if (dy > 36) setExpanded(false);
  }, []);

  const applyHifz = useCallback(() => {
    if (snap.surah == null) return;
    const engine = AudioEngine.getInstance();
    const prefs: HifzPrefs = {
      ...hifz,
      surah: snap.surah,
      updatedAt: Date.now(),
    };
    saveHifzPrefs(prefs);
    setHifz(prefs);
    engine.setPlaybackRate(prefs.playbackRate);
    const cfg = hifzPrefsToLoopConfig(prefs);
    engine.setLoopConfig(prefs.surah, cfg);
    void engine.playAyah(prefs.surah, prefs.startAyah, snap.reciterId);
  }, [hifz, snap.surah, snap.reciterId]);

  const clearHifz = useCallback(() => {
    AudioEngine.getInstance().setLoopConfig(snap.surah ?? 1, null);
  }, [snap.surah]);

  if (!visible) return null;
  if (snap.surah == null || snap.ayah == null) return null;

  const surahName = getSurahMeta(snap.surah).name.replace(/^سُورَةُ\s*/u, "");
  const reciterName = getReciter(snap.reciterId).nameAr;
  const page = ayahKeyToPage(`${snap.surah}:${snap.ayah}`);
  const duration = snap.duration > 0 ? snap.duration : 0;
  const progress = duration > 0 ? Math.min(1, snap.currentTime / duration) : 0;
  const engine = AudioEngine.getInstance();
  const totalAyahs = getSurahMeta(snap.surah).ayahs;
  const loopActive = snap.loopConfig != null;

  return (
    <div
      className={`quran-mini-player${expanded ? " quran-mini-player--expanded" : ""}${immersive ? " quran-mini-player--immersive" : ""}`}
      role="region"
      aria-label="تشغيل التلاوة"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        dragRef.current = null;
      }}
    >
      <div className="quran-mini-player__handle" aria-hidden="true" />

      <div className="quran-mini-player__bar">
        <button
          type="button"
          className="quran-mini-player__meta"
          onClick={() => navigate(`/mushaf/page/${page}?ayah=${snap.surah}:${snap.ayah}`)}
        >
          <strong>{reciterName}</strong>
          <span>
            {surahName} · آية {toArabicDigits(snap.ayah)}
          </span>
        </button>

        <div className="quran-mini-player__controls">
          <button
            type="button"
            className="quran-mini-player__btn"
            aria-label="الآية السابقة"
            onClick={() => void engine.skipPrev()}
          >
            <SkipBack size={18} />
          </button>
          <button
            type="button"
            className="quran-mini-player__toggle"
            aria-label={playing ? "إيقاف مؤقت" : "تشغيل"}
            onClick={() => {
              if (snap.surah != null && snap.ayah != null) {
                void engine.togglePlay(snap.surah, snap.ayah);
              }
            }}
          >
            {playing ? <Pause size={18} /> : <Play size={18} />}
          </button>
          <button
            type="button"
            className="quran-mini-player__btn"
            aria-label="الآية التالية"
            onClick={() => void engine.skipNext()}
          >
            <SkipForward size={18} />
          </button>
          <button
            type="button"
            className="quran-mini-player__rate"
            aria-label={`سرعة التشغيل ${rateLabel(snap.playbackRate)}`}
            onClick={() => engine.cycleMiniPlayerRate()}
          >
            {rateLabel(snap.playbackRate)}
          </button>
        </div>

        <div className="quran-mini-player__seek" aria-hidden={!expanded}>
          <div
            className="quran-mini-player__progress"
            style={{ ["--qmp-progress" as string]: String(progress) }}
          />
        </div>

        <button
          type="button"
          className="quran-mini-player__expand"
          aria-label={expanded ? "تصغير المشغّل" : "توسيع المشغّل"}
          aria-expanded={expanded}
          onClick={() => setExpanded((v) => !v)}
        >
          <ChevronUp size={18} className={expanded ? "is-flipped" : undefined} />
        </button>

        <button
          type="button"
          className="quran-mini-player__close"
          aria-label="إيقاف وإغلاق المشغّل"
          onClick={() => stopMiniPlayer()}
        >
          <X size={18} />
        </button>
      </div>

      {expanded ? (
        <div className="quran-mini-player__sheet">
          <div className="quran-mini-player__sheet-meta">
            <p>
              {formatClock(snap.currentTime)} / {formatClock(duration)}
            </p>
            <input
              type="range"
              className="quran-mini-player__range"
              min={0}
              max={duration || 1}
              step={0.1}
              value={Number.isFinite(snap.currentTime) ? snap.currentTime : 0}
              disabled={duration <= 0}
              aria-label="شريط التقدم"
              onChange={(e) => engine.seek(Number(e.target.value))}
            />
          </div>

          <fieldset className="quran-mini-player__hifz">
            <legend>وضع الحفظ</legend>
            <label>
              من آية
              <input
                type="number"
                min={1}
                max={totalAyahs}
                value={hifz.startAyah}
                onChange={(e) =>
                  setHifz((p) => ({
                    ...p,
                    startAyah: Math.max(1, Math.min(totalAyahs, Number(e.target.value) || 1)),
                  }))
                }
              />
            </label>
            <label>
              إلى آية
              <input
                type="number"
                min={1}
                max={totalAyahs}
                value={hifz.endAyah}
                onChange={(e) =>
                  setHifz((p) => ({
                    ...p,
                    endAyah: Math.max(1, Math.min(totalAyahs, Number(e.target.value) || 1)),
                  }))
                }
              />
            </label>
            <label>
              التكرار
              <select
                value={hifz.repeatCount === 0 ? "inf" : String(hifz.repeatCount)}
                onChange={(e) => {
                  const v = e.target.value;
                  setHifz((p) => ({
                    ...p,
                    repeatCount: v === "inf" ? 0 : Math.max(1, Math.min(20, Number(v) || 1)),
                  }));
                }}
              >
                {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
                  <option key={n} value={n}>
                    {toArabicDigits(n)}
                  </option>
                ))}
                <option value="inf">لا نهائي</option>
              </select>
            </label>
            <label>
              السرعة
              <select
                value={String(hifz.playbackRate)}
                onChange={(e) =>
                  setHifz((p) => ({ ...p, playbackRate: Number(e.target.value) || 1 }))
                }
              >
                {HIFZ_PLAYBACK_RATES.map((r) => (
                  <option key={r} value={r}>
                    {rateLabel(r)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              صمت بين التكرارات
              <select
                value={String(hifz.delayMs)}
                onChange={(e) =>
                  setHifz((p) => ({ ...p, delayMs: Number(e.target.value) || 0 }))
                }
              >
                {SILENCE_OPTIONS_MS.map((ms) => (
                  <option key={ms} value={ms}>
                    {ms === 0 ? "بدون" : `${toArabicDigits(ms / 1000)} ث`}
                  </option>
                ))}
              </select>
            </label>
            <div className="quran-mini-player__hifz-actions">
              <button type="button" className="quran-mini-player__hifz-apply" onClick={applyHifz}>
                بدء التكرار
              </button>
              {loopActive ? (
                <button type="button" className="quran-mini-player__hifz-clear" onClick={clearHifz}>
                  إيقاف التكرار
                </button>
              ) : null}
            </div>
          </fieldset>
        </div>
      ) : null}
    </div>
  );
}
