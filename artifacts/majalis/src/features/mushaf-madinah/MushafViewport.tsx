import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import { getSurahMeta } from "@/lib/quran-api";
import { loadMushafPage, prefetchMushafPage, type MushafPageLayout, type QpcWord } from "@/lib/quran-data/qpc-page-data";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  MUSHAF_PAGE_MIN,
  saveLastPage,
} from "@/lib/quran-last-page";
import { loadReciterId, saveReciterId } from "@/lib/quran-audio";
import { MushafAyahActions } from "./MushafAyahActions";
import { MushafAudioDock } from "./MushafAudioDock";
import { MushafControls } from "./MushafControls";
import { MushafPage } from "./MushafPage";
import { MushafTafsirSheet } from "./MushafTafsirSheet";
import { findMushafPageForAyah, parseVerseKey } from "./mushaf-page-for-ayah";
import { useQpcPageFont } from "./useQpcPageFont";
import "./mushaf-madinah.css";

type Props = {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onExit: () => void;
  onIndex: () => void;
};

const SWIPE_MIN = 48;

/** إطار القراءة: تحميل الصفحة، السحب، الأدوات عند اللمس، تلاوة وتفسير. */
export function MushafViewport({ pageNumber, onPageChange, onExit, onIndex }: Props) {
  const page = clampMushafPage(pageNumber);
  const [layout, setLayout] = useState<MushafPageLayout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chromeOpen, setChromeOpen] = useState(true);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [reciterId, setReciterId] = useState(() => loadReciterId());
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [audioDockOpen, setAudioDockOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);

  const { fontFamily, ready: fontReady } = useQpcPageFont(page);
  const touchRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const hideTimer = useRef<number | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const audio = useMemo(() => getAudioEngine(), []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLayout(null);
    loadMushafPage(page)
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر تحميل الصفحة");
      });
    prefetchMushafPage(page - 1);
    prefetchMushafPage(page + 1);
    void saveLastPage(page);
    return () => {
      cancelled = true;
    };
  }, [page]);

  const bumpChrome = useCallback(() => {
    setChromeOpen(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeOpen(false), 2800);
  }, []);

  useEffect(() => {
    bumpChrome();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [page, bumpChrome]);

  useEffect(() => {
    audio.setReciter(loadReciterId());
    const syncPage = (surah: number, ayah: number) => {
      const targetPage = findMushafPageForAyah(surah, ayah);
      if (targetPage !== pageRef.current) onPageChangeRef.current(targetPage);
    };
    const unSnap = audio.onSnapshot((snap) => {
      setPlayerState(snap.playerState);
      setReciterId(snap.reciterId);
      setAudioError(snap.playerState === "error" ? snap.errorMessage : null);
      if (snap.surah != null && snap.ayah != null) {
        const key = `${snap.surah}:${snap.ayah}`;
        setPlayingVerseKey(key);
        if (snap.playerState === "playing" || snap.playerState === "loading" || snap.playerState === "buffering") {
          setAudioDockOpen(true);
          setActionsOpen(true);
          setSelectedVerseKey(key);
          syncPage(snap.surah, snap.ayah);
        }
      }
      if (snap.playerState === "idle") {
        setPlayingVerseKey(null);
      }
    });
    const unAyah = audio.onAyahChange(({ surah, ayah }) => {
      const key = `${surah}:${ayah}`;
      setPlayingVerseKey(key);
      setSelectedVerseKey(key);
      syncPage(surah, ayah);
    });
    return () => {
      unSnap();
      unAyah();
    };
  }, [audio]);

  const go = useCallback(
    (next: number) => {
      onPageChange(clampMushafPage(next));
    },
    [onPageChange],
  );

  const versePreview = useCallback(
    (verseKey: string): string => {
      if (!layout) return verseKey;
      const words: QpcWord[] = [];
      for (const row of layout.rows) {
        if (row.kind !== "line") continue;
        for (const w of row.words) {
          if (w.verseKey === verseKey && w.charType !== "end") words.push(w);
        }
      }
      words.sort((a, b) => a.position - b.position);
      const text = words.map((w) => w.textQpcHafs || w.textUthmani).join(" ").trim();
      return text || verseKey;
    },
    [layout],
  );

  const onSelectVerse = useCallback(
    (verseKey: string) => {
      if (selectedVerseKey === verseKey && actionsOpen) {
        setActionsOpen(false);
        return;
      }
      setSelectedVerseKey(verseKey);
      setActionsOpen(true);
      setCopyStatus(null);
      setAudioError(null);
      bumpChrome();
    },
    [actionsOpen, bumpChrome, selectedVerseKey],
  );

  const closeActions = useCallback(() => {
    setActionsOpen(false);
  }, []);

  const playSelected = useCallback(async () => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    if (!parsed) return;
    setAudioError(null);
    setAudioDockOpen(true);
    bumpChrome();
    await audio.playAyah(parsed.surah, parsed.ayah, reciterId);
  }, [audio, bumpChrome, reciterId, selectedVerseKey]);

  const togglePlay = useCallback(async () => {
    const key = playingVerseKey ?? selectedVerseKey;
    if (!key) return;
    const parsed = parseVerseKey(key);
    if (!parsed) return;
    await audio.togglePlay(parsed.surah, parsed.ayah);
    bumpChrome();
  }, [audio, bumpChrome, playingVerseKey, selectedVerseKey]);

  const onReciterChange = useCallback(
    async (id: string) => {
      saveReciterId(id);
      audio.setReciter(id);
      setReciterId(id);
      const key = playingVerseKey ?? selectedVerseKey;
      if (!key) return;
      const parsed = parseVerseKey(key);
      if (!parsed) return;
      if (playerState === "playing" || playerState === "paused" || playerState === "buffering") {
        await audio.playAyah(parsed.surah, parsed.ayah, id);
      }
    },
    [audio, playerState, playingVerseKey, selectedVerseKey],
  );

  const onCopy = useCallback(async () => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    const body = versePreview(selectedVerseKey);
    const label = parsed
      ? `${getSurahMeta(parsed.surah).name} ${parsed.ayah}\n${body}`
      : body;
    try {
      await navigator.clipboard.writeText(label);
      setCopyStatus("تم النسخ");
    } catch {
      setCopyStatus("تعذّر النسخ");
    }
  }, [selectedVerseKey, versePreview]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-ayah-hit, .mm-page-edge")) {
      return;
    }
    touchRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".mm-controls, .mm-audio-dock, .mm-ayah-bar, .mm-page-edge")) return;
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) && dt < 800) {
      // RTL: سحب الإصبع يمين→يسار (dx سالب) = الصفحة التالية · يسار→يمين = السابقة
      if (dx < 0) go(page + 1);
      else go(page - 1);
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if ((e.target as HTMLElement).closest(".mm-ayah-hit")) return;
      if (actionsOpen) {
        setActionsOpen(false);
        return;
      }
      setChromeOpen((v) => !v);
      if (!chromeOpen) bumpChrome();
    }
  };

  const verseLabel = useMemo(() => {
    const key = playingVerseKey ?? selectedVerseKey;
    if (!key) return "التلاوة";
    const parsed = parseVerseKey(key);
    if (!parsed) return key;
    return `${getSurahMeta(parsed.surah).name} · ${parsed.ayah}`;
  }, [playingVerseKey, selectedVerseKey]);

  return (
    <div
      className="mm-viewport"
      data-chrome={chromeOpen ? "1" : "0"}
      data-ayah-bar={actionsOpen ? "1" : "0"}
      data-testid="mushaf-viewport"
      dir="rtl"
      onPointerDown={onPointerDown}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        touchRef.current = null;
      }}
    >
      <div className="mm-page-shell">
        {error ? <div className="mm-status">{error}</div> : null}
        {!error && (!layout || !fontReady) ? (
          <div className="mm-status" role="status">
            جاري تحميل الصفحة…
          </div>
        ) : null}
        {layout && fontReady ? (
          <MushafPage
            layout={layout}
            fontFamily={fontFamily}
            selectedVerseKey={selectedVerseKey}
            playingVerseKey={playingVerseKey}
            onSelectVerse={onSelectVerse}
          />
        ) : null}
      </div>

      {/* مناطق قلب الصفحة غير المرئية — لا تتعارض مع كلمات الآية */}
      <button
        type="button"
        className="mm-page-edge mm-page-edge--next"
        aria-label="الصفحة التالية"
        disabled={page >= MUSHAF_PAGE_MAX}
        onClick={() => go(page + 1)}
      />
      <button
        type="button"
        className="mm-page-edge mm-page-edge--prev"
        aria-label="الصفحة السابقة"
        disabled={page <= MUSHAF_PAGE_MIN}
        onClick={() => go(page - 1)}
      />

      <MushafAudioDock
        open={
          !actionsOpen &&
          audioDockOpen &&
          (chromeOpen || playerState === "playing" || playerState === "buffering")
        }
        verseLabel={verseLabel}
        playerState={playerState}
        reciterId={reciterId}
        onTogglePlay={() => void togglePlay()}
        onPrev={() => void audio.skipPrev()}
        onNext={() => void audio.skipNext()}
        onReciterChange={(id) => void onReciterChange(id)}
      />

      <MushafControls
        open={chromeOpen && !actionsOpen}
        pageNumber={page}
        onExit={onExit}
        onIndex={onIndex}
        onPrev={() => go(page - 1)}
        onNext={() => go(page + 1)}
        onGoto={go}
      />

      {actionsOpen && selectedVerseKey ? (
        <MushafAyahActions
          verseKey={selectedVerseKey}
          copyStatus={copyStatus}
          audioError={audioError}
          playerState={playerState}
          reciterId={reciterId}
          onPlay={() => void playSelected()}
          onTogglePlay={() => void togglePlay()}
          onPrev={() => void audio.skipPrev()}
          onNext={() => void audio.skipNext()}
          onTafsir={() => {
            setTafsirOpen(true);
          }}
          onCopy={() => void onCopy()}
          onReciterChange={(id) => void onReciterChange(id)}
          onClose={closeActions}
        />
      ) : null}

      <MushafTafsirSheet
        open={tafsirOpen}
        verseKey={selectedVerseKey}
        ayahText={selectedVerseKey ? versePreview(selectedVerseKey) : ""}
        onClose={() => setTafsirOpen(false)}
      />

      <span className="sr-only" aria-live="polite">
        صفحة {page} من {MUSHAF_PAGE_MAX}
      </span>
      <span hidden data-min={MUSHAF_PAGE_MIN} />
    </div>
  );
}
