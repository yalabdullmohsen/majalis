import {
  lazy,
  memo,
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import { getSurahMeta, savePagePosition } from "@/lib/quran-api";
import {
  getReciter,
  listAyahAudioUrls,
  loadReciterId,
  saveReciterId,
} from "@/lib/quran-audio";
import {
  getCachedMushafPage,
  loadMushafPage,
  prefetchMushafPage,
  type MushafPageLayout,
  type QpcWord,
} from "@/lib/quran-data/qpc-page-data";
import { haptics } from "@/lib/haptics";
import {
  beginPowerSaverSession,
  endPowerSaverSession,
  getPowerSaverState,
  scheduleNonCriticalWork,
} from "@/lib/power-saver-engine";
import { clampMushafPage, MUSHAF_PAGE_MAX } from "@/lib/quran-last-page";
import { useMediaSession } from "@/hooks/useMediaSession";
import { MushafPager } from "./MushafPager";
import {
  setMushafAudioClock,
  useMushafAudioClock,
} from "@/features/mushaf-madinah/mushaf-audio-clock-store";
import { setMushafAyahSyncKeys } from "@/features/mushaf-madinah/mushaf-ayah-sync-store";
import {
  findMushafPageForAyah,
  parseVerseKey,
} from "@/features/mushaf-madinah/mushaf-page-for-ayah";
import { useQpcPageFont } from "@/features/mushaf-madinah/useQpcPageFont";
import { useMushafResourceGate } from "@/features/mushaf-madinah/useMushafResourceGate";
import { prefetchAdjacentPageAudio } from "@/features/mushaf-madinah/prefetch-adjacent-audio";
import { MUSHAF_CHROME_HIDE_MS } from "@/features/mushaf-madinah/layout-bands";
import { MushafPage } from "./MushafPage";
import { MushafControlsLayer, MushafVerseMenu } from "./MushafControlsLayer";
import { useMushafFixedMetrics } from "./useMushafFixedMetrics";
import "./mushaf-reader.css";
/* شيتات التلاوة/البحث/التفسير — فئات مشتركة */
import "@/features/mushaf-madinah/mushaf-madinah.css";

const MushafTafsirSheet = lazy(() =>
  import("@/features/mushaf-madinah/MushafTafsirSheet").then((m) => ({
    default: m.MushafTafsirSheet,
  })),
);
const MushafSearchSheet = lazy(() =>
  import("@/features/mushaf-madinah/MushafSearchSheet").then((m) => ({
    default: m.MushafSearchSheet,
  })),
);
const MushafAudioDock = lazy(() =>
  import("@/features/mushaf-madinah/MushafAudioDock").then((m) => ({
    default: m.MushafAudioDock,
  })),
);

type Props = {
  pageNumber: number;
  onPageChange: (page: number) => void;
  onExit: () => void;
  onIndex: () => void;
};

/**
 * NewMushafReader — واجهة مصحف جديدة من الصفر.
 * البيانات/التلاوة/التفسير من المصادر المعتمدة؛ العرض بصري جديد بالكامل.
 */
export function NewMushafReader({ pageNumber, onPageChange, onExit, onIndex: _onIndex }: Props) {
  const page = clampMushafPage(pageNumber);
  const [layout, setLayout] = useState<MushafPageLayout | null>(() => getCachedMushafPage(page));
  const [error, setError] = useState<string | null>(null);
  const [chromeOpen, setChromeOpen] = useState(false);
  const [gotoOpen, setGotoOpen] = useState(false);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [indexOpen, setIndexOpen] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [reciterId, setReciterId] = useState(() => loadReciterId());
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [audioDockOpen, setAudioDockOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<string | null>(null);

  const { fontFamily, ready: fontReady } = useQpcPageFont(page);
  const { canMountPage, allowOffscreenPrefetch } = useMushafResourceGate(
    fontReady,
    Boolean(layout) && !error,
    page,
  );

  const metricsRootRef = useRef<HTMLDivElement | null>(null);
  useMushafFixedMetrics(metricsRootRef, canMountPage);

  const hideTimer = useRef<number | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  const suppressPageSyncRef = useRef(false);
  const pendingSelectRef = useRef<string | null>(null);
  const actionsOpenRef = useRef(false);
  actionsOpenRef.current = actionsOpen;
  const audio = useMemo(() => getAudioEngine(), []);

  useEffect(() => {
    beginPowerSaverSession();
    void import("@/lib/apply-page-chrome").then(({ applyMushafThemeChrome }) => {
      void applyMushafThemeChrome("paper");
    });
    return () => {
      endPowerSaverSession();
      const resolved =
        document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      void import("@/lib/apply-page-chrome").then(({ reapplyPageChromeFromLocation }) =>
        reapplyPageChromeFromLocation(resolved),
      );
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    setLayout(getCachedMushafPage(page));
    void loadMushafPage(page)
      .then((data) => {
        if (!cancelled) setLayout(data);
      })
      .catch(() => {
        if (!cancelled) setError("تعذّر تحميل الصفحة");
      });
    const saver = getPowerSaverState();
    if (saver.mode !== "aggressive") {
      if (saver.throttleBackground) {
        scheduleNonCriticalWork(() => {
          if (!cancelled) prefetchMushafPage(page + 1);
        });
      } else {
        prefetchMushafPage(page - 1);
        prefetchMushafPage(page + 1);
        scheduleNonCriticalWork(() => {
          if (!cancelled) void prefetchAdjacentPageAudio(page, loadReciterId());
        });
      }
    }
    savePagePosition(page);
    return () => {
      cancelled = true;
    };
  }, [page]);

  useEffect(() => {
    const pending = pendingSelectRef.current;
    pendingSelectRef.current = null;
    if (pending) {
      setSelectedVerseKey(pending);
      setActionsOpen(true);
      setTafsirOpen(false);
      setStatus(null);
      setChromeOpen(false);
      return;
    }
    setSelectedVerseKey(null);
    setActionsOpen(false);
    setTafsirOpen(false);
    setStatus(null);
    suppressPageSyncRef.current = false;
  }, [page]);

  const bumpChrome = useCallback(() => {
    setChromeOpen(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    if (searchOpen || indexOpen) return;
    hideTimer.current = window.setTimeout(() => setChromeOpen(false), MUSHAF_CHROME_HIDE_MS);
  }, [indexOpen, searchOpen]);

  useEffect(() => {
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, []);

  useEffect(() => {
    setMushafAyahSyncKeys(selectedVerseKey, playingVerseKey);
  }, [selectedVerseKey, playingVerseKey]);

  useEffect(() => {
    audio.setReciter(loadReciterId());
    const syncPageIfAllowed = (surah: number, ayah: number) => {
      if (suppressPageSyncRef.current) return;
      if (actionsOpenRef.current) return;
      const targetPage = findMushafPageForAyah(surah, ayah);
      if (targetPage !== pageRef.current) onPageChangeRef.current(targetPage);
    };
    const unSnap = audio.onSnapshot((snap) => {
      setPlayerState((prev) => (prev === snap.playerState ? prev : snap.playerState));
      setReciterId((prev) => (prev === snap.reciterId ? prev : snap.reciterId));
      setMushafAudioClock({
        currentTime: snap.currentTime,
        duration: snap.duration,
        playbackRate: snap.playbackRate,
      });
      if (snap.playerState === "error") {
        setAudioError(snap.errorMessage || "تعذر تشغيل هذه الآية لهذا القارئ");
        setAudioStatus("فشل التحميل");
      } else if (snap.playerState === "loading" || snap.playerState === "buffering") {
        setAudioError(null);
        setAudioStatus("جاري التحميل");
      } else if (snap.playerState === "playing") {
        setAudioError(null);
        setAudioStatus("يعمل الآن");
      } else if (snap.playerState === "paused") {
        setAudioStatus("متوقف");
      } else if (snap.playerState === "idle") {
        setPlayingVerseKey(null);
        setAudioStatus("جاهز");
      }
      if (snap.surah != null && snap.ayah != null) {
        const key = `${snap.surah}:${snap.ayah}`;
        setPlayingVerseKey(key);
        if (
          snap.playerState === "playing" ||
          snap.playerState === "loading" ||
          snap.playerState === "buffering"
        ) {
          setAudioDockOpen(true);
        }
      }
    });
    const unAyah = audio.onAyahChange(({ surah, ayah }) => {
      const key = `${surah}:${ayah}`;
      setPlayingVerseKey(key);
      setSelectedVerseKey(key);
      if (!suppressPageSyncRef.current) syncPageIfAllowed(surah, ayah);
    });
    return () => {
      unSnap();
      unAyah();
    };
  }, [audio]);

  const [pagerSettled, setPagerSettled] = useState(true);

  const go = useCallback(
    (next: number) => {
      suppressPageSyncRef.current = false;
      setPagerSettled(false);
      onPageChange(clampMushafPage(next));
    },
    [onPageChange],
  );

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setPagerSettled(true));
    return () => window.cancelAnimationFrame(id);
  }, [page]);

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
      return words.map((w) => w.textQpcHafs || w.textUthmani).join(" ").trim() || verseKey;
    },
    [layout],
  );

  const clearSelection = useCallback(() => {
    if (playerState === "playing" || playerState === "buffering" || playerState === "loading") {
      return;
    }
    setSelectedVerseKey(null);
  }, [playerState]);

  const onSelectVerse = useCallback(
    (verseKey: string) => {
      if (selectedVerseKey === verseKey && actionsOpen) {
        setActionsOpen(false);
        return;
      }
      if (selectedVerseKey === verseKey && !actionsOpen) {
        clearSelection();
        return;
      }
      haptics.selection();
      setSelectedVerseKey(verseKey);
      setActionsOpen(true);
      setChromeOpen(false);
      setStatus(null);
      setAudioError(null);
    },
    [actionsOpen, clearSelection, selectedVerseKey],
  );

  const closeActions = useCallback(() => setActionsOpen(false), []);

  const playSelected = useCallback(async () => {
    if (!selectedVerseKey) {
      setStatus("اختر آية أولاً");
      return;
    }
    const parsed = parseVerseKey(selectedVerseKey);
    if (!parsed) return;
    const ayahKey = `${parsed.surah}:${parsed.ayah}`;
    setAudioError(null);
    setActionsOpen(false);
    setAudioDockOpen(true);
    bumpChrome();
    suppressPageSyncRef.current = true;

    const same = playingVerseKey === ayahKey;
    if (
      same &&
      (playerState === "playing" || playerState === "paused" || playerState === "buffering")
    ) {
      await audio.togglePlay(parsed.surah, parsed.ayah);
      return;
    }

    listAyahAudioUrls(parsed.surah, parsed.ayah, reciterId);
    setAudioStatus("جاري تحميل التلاوة...");
    setStatus("جاري التلاوة…");
    await audio.playAyah(parsed.surah, parsed.ayah, reciterId);
  }, [audio, bumpChrome, playerState, playingVerseKey, reciterId, selectedVerseKey]);

  const togglePlay = useCallback(async () => {
    const key = selectedVerseKey ?? playingVerseKey;
    if (!key) return;
    const parsed = parseVerseKey(key);
    if (!parsed) return;
    suppressPageSyncRef.current = true;
    await audio.togglePlay(parsed.surah, parsed.ayah);
  }, [audio, playingVerseKey, selectedVerseKey]);

  const onReciterChange = useCallback(
    async (id: string) => {
      saveReciterId(id);
      audio.setReciter(id);
      setReciterId(id);
      const key = selectedVerseKey ?? playingVerseKey;
      if (!key) return;
      const parsed = parseVerseKey(key);
      if (!parsed) return;
      suppressPageSyncRef.current = true;
      if (playerState === "playing" || playerState === "paused" || playerState === "buffering") {
        await audio.playAyah(parsed.surah, parsed.ayah, id);
      }
    },
    [audio, playerState, playingVerseKey, selectedVerseKey],
  );

  const onPlayReciter = useCallback(
    async (id: string) => {
      saveReciterId(id);
      audio.setReciter(id);
      setReciterId(id);
      const key = selectedVerseKey ?? playingVerseKey;
      if (!key) {
        setAudioError("اختر آية أولاً");
        return;
      }
      const parsed = parseVerseKey(key);
      if (!parsed) {
        setAudioError("اختر آية أولاً");
        return;
      }
      setAudioError(null);
      setActionsOpen(false);
      setAudioDockOpen(true);
      suppressPageSyncRef.current = true;
      setAudioStatus("جاري تحميل التلاوة...");
      await audio.playAyah(parsed.surah, parsed.ayah, id);
    },
    [audio, playingVerseKey, selectedVerseKey],
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
      setStatus("تم النسخ");
    } catch {
      setStatus("تعذّر النسخ");
    }
  }, [selectedVerseKey, versePreview]);

  const onBookmark = useCallback(async () => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    const label = parsed
      ? `${getSurahMeta(parsed.surah).name} · آية ${parsed.ayah}`
      : `آية ${selectedVerseKey}`;
    try {
      const { getMyBookmarks, saveBookmarks } = await import("@/lib/quran-my-bookmarks");
      const list = getMyBookmarks().filter((b) => b.ayahKey !== selectedVerseKey);
      await saveBookmarks([
        {
          id: Date.now(),
          ayahKey: selectedVerseKey,
          page,
          label,
          date: new Date().toLocaleDateString("ar"),
        },
        ...list,
      ]);
      haptics.success();
      setStatus("تم حفظ العلامة");
    } catch {
      haptics.error();
      setStatus("تعذّر حفظ العلامة");
    }
  }, [page, selectedVerseKey]);

  const verseLabel = useMemo(() => {
    const key = playingVerseKey ?? selectedVerseKey;
    if (!key) return "التلاوة";
    const parsed = parseVerseKey(key);
    if (!parsed) return key;
    return `${getSurahMeta(parsed.surah).name} · ${parsed.ayah}`;
  }, [playingVerseKey, selectedVerseKey]);

  const mediaPlaying =
    playerState === "playing" || playerState === "buffering" || playerState === "loading";
  const edgesDisabled = actionsOpen || tafsirOpen || searchOpen || indexOpen;
  /* إخفاء الرصيف عند فتح قائمة الآية لتفادي تعارض أزرار التشغيل */
  const audioDockVisible =
    !actionsOpen &&
    audioDockOpen &&
    (chromeOpen ||
      playerState === "playing" ||
      playerState === "buffering" ||
      playerState === "error");

  return (
    <MushafPager
      ref={metricsRootRef}
      page={page}
      onPageChange={go}
      disabled={edgesDisabled}
      onNavigateStart={() => {
        setChromeOpen(false);
        setPagerSettled(false);
      }}
      ignoreSelector=".nm-controls, .nm-verse-menu, .mm-audio-dock, .mm-ayah-bar, .ayah-action-sheet, .mm-search-sheet, input, textarea, select, button"
      onTapEmpty={() => {
        if (actionsOpen) {
          closeActions();
          return;
        }
        if (selectedVerseKey) {
          clearSelection();
          return;
        }
        setChromeOpen((v) => !v);
        if (!chromeOpen) bumpChrome();
      }}
      className="nm-root mm-viewport mushaf-shell"
      data-chrome={chromeOpen ? "1" : "0"}
      data-ayah-bar={actionsOpen ? "1" : "0"}
      data-audio-dock={audioDockVisible ? "1" : "0"}
      data-testid="mushaf-viewport"
      dir="rtl"
      nextPage={
        allowOffscreenPrefetch && page < MUSHAF_PAGE_MAX ? (
          <PrefetchPage pageNumber={page + 1} />
        ) : undefined
      }
      prevPage={
        allowOffscreenPrefetch && page > 1 ? <PrefetchPage pageNumber={page - 1} /> : undefined
      }
      pageSlot={
        <div className="nm-shell mm-page-shell mushaf-page-frame" data-testid="mushaf-page-shell">
          {error ? <div className="nm-status">{error}</div> : null}
          {!error && !canMountPage ? (
            <div
              className="nm-page-placeholder"
              role="status"
              aria-label="سُنّة"
              aria-busy="true"
            />
          ) : null}
          {canMountPage && layout ? (
            <MushafPage
              layout={layout}
              fontFamily={fontFamily}
              displayPageNumber={page}
              onSelectVerse={onSelectVerse}
              selectionEnabled={pagerSettled}
              onPageNumberPress={() => {
                setGotoOpen(true);
                setChromeOpen(false);
                setActionsOpen(false);
              }}
            />
          ) : null}
        </div>
      }
    >
      <h1 className="sr-only">المصحف الشريف</h1>
      <MediaBridge
        active={Boolean(playingVerseKey || playerState === "paused" || mediaPlaying)}
        title={verseLabel}
        artist={getReciter(reciterId).nameAr}
        playing={mediaPlaying}
        onPlay={() => void togglePlay()}
        onPause={() => audio.pause()}
        onStop={() => audio.stop()}
        onNext={() => {
          suppressPageSyncRef.current = false;
          audio.setReciter(reciterId);
          void audio.skipNext();
        }}
        onPrevious={() => {
          suppressPageSyncRef.current = false;
          audio.setReciter(reciterId);
          void audio.skipPrev();
        }}
      />

      <Suspense fallback={null}>
        <MushafAudioDock
          open={audioDockVisible}
          verseLabel={verseLabel}
          playerState={playerState}
          reciterId={reciterId}
          audioError={audioError}
          audioStatus={audioStatus}
          mini={false}
          onMiniChange={() => {}}
          onTogglePlay={() => void togglePlay()}
          onPrev={() => {
            suppressPageSyncRef.current = false;
            audio.setReciter(reciterId);
            void audio.skipPrev();
          }}
          onNext={() => {
            suppressPageSyncRef.current = false;
            audio.setReciter(reciterId);
            void audio.skipNext();
          }}
          onReciterChange={(id) => void onReciterChange(id)}
          onPlayReciter={(id) => void onPlayReciter(id)}
          onSeek={(seconds) => audio.seek(seconds)}
          onSpeed={(rate) => audio.setPlaybackRate(rate)}
          onClose={() => {
            setAudioDockOpen(false);
            void audio.pause();
          }}
        />
      </Suspense>

      <MushafControlsLayer
        chromeOpen={chromeOpen && !actionsOpen && !gotoOpen}
        pageNumber={page}
        gotoOpen={gotoOpen}
        onGotoOpenChange={setGotoOpen}
        onGoto={(n) => {
          go(n);
          setGotoOpen(false);
        }}
        onExit={onExit}
        onIndex={() => {
          setIndexOpen(true);
          setSearchOpen(false);
          setGotoOpen(false);
          bumpChrome();
        }}
        onSearch={() => {
          setSearchOpen(true);
          setIndexOpen(false);
          setGotoOpen(false);
          bumpChrome();
        }}
      />

      {actionsOpen && selectedVerseKey ? (
        <MushafVerseMenu
          verseKey={selectedVerseKey}
          status={status}
          onPlay={() => void playSelected()}
          onTafsir={() => setTafsirOpen(true)}
          onCopy={() => void onCopy()}
          onBookmark={() => void onBookmark()}
          onClose={closeActions}
        />
      ) : null}

      {tafsirOpen ? (
        <Suspense fallback={null}>
          <MushafTafsirSheet
            open={tafsirOpen}
            verseKey={selectedVerseKey}
            ayahText=""
            onClose={() => setTafsirOpen(false)}
          />
        </Suspense>
      ) : null}

      {searchOpen || indexOpen ? (
        <Suspense fallback={null}>
          <MushafSearchSheet
            open={searchOpen || indexOpen}
            mode={indexOpen ? "index" : "search"}
            onClose={() => {
              setSearchOpen(false);
              setIndexOpen(false);
            }}
            onGotoPage={(n, verseKey) => {
              if (verseKey) pendingSelectRef.current = verseKey;
              go(n);
              if (verseKey && n === page) {
                pendingSelectRef.current = null;
                setSelectedVerseKey(verseKey);
                setActionsOpen(true);
                setChromeOpen(false);
              }
            }}
          />
        </Suspense>
      ) : null}
    </MushafPager>
  );
}

const PrefetchPage = memo(function PrefetchPage({ pageNumber }: { pageNumber: number }) {
  const [layout, setLayout] = useState<MushafPageLayout | null>(() =>
    getCachedMushafPage(pageNumber),
  );
  const { fontFamily, ready } = useQpcPageFont(pageNumber);

  useEffect(() => {
    let cancelled = false;
    void loadMushafPage(pageNumber).then((data) => {
      if (!cancelled) setLayout(data);
    });
    return () => {
      cancelled = true;
    };
  }, [pageNumber]);

  if (!ready || !layout) {
    return <div className="nm-page-placeholder" aria-hidden="true" />;
  }
  return (
    <MushafPage
      layout={layout}
      fontFamily={fontFamily}
      displayPageNumber={pageNumber}
      selectionEnabled={false}
    />
  );
});

function MediaBridge({
  active,
  title,
  artist,
  playing,
  onPlay,
  onPause,
  onStop,
  onNext,
  onPrevious,
}: {
  active: boolean;
  title: string;
  artist: string;
  playing: boolean;
  onPlay: () => void;
  onPause: () => void;
  onStop: () => void;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const clock = useMushafAudioClock();
  useMediaSession(
    active
      ? {
          title,
          artist,
          album: "تلاوة القرآن — سُنّة",
          playing,
          position: clock.currentTime,
          duration: clock.duration,
          playbackRate: clock.playbackRate,
          onPlay,
          onPause,
          onStop,
          onNext,
          onPrevious,
        }
      : null,
  );
  return null;
}

export { NewMushafReader as MushafViewport };
