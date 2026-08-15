import { useCallback, useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import { getSurahMeta } from "@/lib/quran-api";
import {
  addBookmark,
  isBookmarked,
  removeBookmark,
} from "@/lib/quran-personal";
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
  const [bookmarked, setBookmarked] = useState(false);
  const [reciterId, setReciterId] = useState(() => loadReciterId());
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [audioDockOpen, setAudioDockOpen] = useState(false);

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
      if (snap.surah != null && snap.ayah != null) {
        const key = `${snap.surah}:${snap.ayah}`;
        setPlayingVerseKey(key);
        if (snap.playerState === "playing" || snap.playerState === "loading" || snap.playerState === "buffering") {
          setAudioDockOpen(true);
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

  useEffect(() => {
    if (!selectedVerseKey) {
      setBookmarked(false);
      return;
    }
    const parsed = parseVerseKey(selectedVerseKey);
    if (!parsed) return;
    setBookmarked(isBookmarked(parsed.surah, parsed.ayah));
  }, [selectedVerseKey]);

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
      setSelectedVerseKey(verseKey);
      setActionsOpen(true);
      setCopyStatus(null);
      bumpChrome();
    },
    [bumpChrome],
  );

  const closeActions = useCallback(() => {
    setActionsOpen(false);
  }, []);

  const playSelected = useCallback(async () => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    if (!parsed) return;
    setActionsOpen(false);
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

  const onShare = useCallback(async () => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    const body = versePreview(selectedVerseKey);
    const title = parsed ? `${getSurahMeta(parsed.surah).name} ${parsed.ayah}` : selectedVerseKey;
    const text = `${title}\n${body}`;
    try {
      if (navigator.share) {
        await navigator.share({ title, text });
      } else {
        await navigator.clipboard.writeText(text);
        setCopyStatus("تم نسخ النص للمشاركة");
      }
    } catch {
      /* إلغاء المشاركة */
    }
  }, [selectedVerseKey, versePreview]);

  const onToggleBookmark = useCallback(() => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    if (!parsed) return;
    const text = versePreview(selectedVerseKey);
    if (isBookmarked(parsed.surah, parsed.ayah)) {
      removeBookmark(parsed.surah, parsed.ayah);
      setBookmarked(false);
    } else {
      addBookmark({
        surahNum: parsed.surah,
        ayahNum: parsed.ayah,
        surahName: getSurahMeta(parsed.surah).name,
        text,
      });
      setBookmarked(true);
    }
  }, [selectedVerseKey, versePreview]);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".mm-controls, .mm-audio-dock, .mm-ayah-sheet, .mm-ayah-hit")) {
      return;
    }
    touchRef.current = { x: e.clientX, y: e.clientY, t: Date.now() };
  };

  const onPointerUp = (e: ReactPointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest(".mm-controls, .mm-audio-dock, .mm-ayah-sheet")) return;
    const start = touchRef.current;
    touchRef.current = null;
    if (!start) return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const dt = Date.now() - start.t;
    if (Math.abs(dx) >= SWIPE_MIN && Math.abs(dx) > Math.abs(dy) && dt < 800) {
      // سحب لليسار (dx سالب) = الصفحة التالية · لليمين = السابقة
      if (dx < 0) go(page + 1);
      else go(page - 1);
      return;
    }
    if (Math.abs(dx) < 12 && Math.abs(dy) < 12) {
      if ((e.target as HTMLElement).closest(".mm-ayah-hit")) return;
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

      <MushafAudioDock
        open={audioDockOpen && (chromeOpen || playerState === "playing" || playerState === "buffering")}
        verseLabel={verseLabel}
        playerState={playerState}
        reciterId={reciterId}
        onTogglePlay={() => void togglePlay()}
        onPrev={() => void audio.skipPrev()}
        onNext={() => void audio.skipNext()}
        onReciterChange={(id) => void onReciterChange(id)}
      />

      <MushafControls
        open={chromeOpen}
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
          previewText={versePreview(selectedVerseKey)}
          bookmarked={bookmarked}
          copyStatus={copyStatus}
          onPlay={() => void playSelected()}
          onTafsir={() => {
            setActionsOpen(false);
            setTafsirOpen(true);
          }}
          onCopy={() => void onCopy()}
          onShare={() => void onShare()}
          onToggleBookmark={onToggleBookmark}
          onClose={closeActions}
        />
      ) : null}

      <MushafTafsirSheet
        open={tafsirOpen}
        verseKey={selectedVerseKey}
        onClose={() => setTafsirOpen(false)}
      />

      <span className="sr-only" aria-live="polite">
        صفحة {page} من {MUSHAF_PAGE_MAX}
      </span>
      <span hidden data-min={MUSHAF_PAGE_MIN} />
    </div>
  );
}
