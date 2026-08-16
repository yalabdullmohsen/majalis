import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { getAudioEngine, type PlayerState } from "@/core/audio/AudioEngine";
import { getSurahMeta } from "@/lib/quran-api";
import { listAyahAudioUrls, loadReciterId, saveReciterId } from "@/lib/quran-audio";
import { loadMushafPage, prefetchMushafPage, type MushafPageLayout, type QpcWord } from "@/lib/quran-data/qpc-page-data";
import {
  clampMushafPage,
  MUSHAF_PAGE_MAX,
  saveLastPage,
} from "@/lib/quran-last-page";
import { AyahActionSheet } from "./AyahActionSheet";
import { MushafAudioDock } from "./MushafAudioDock";
import { MushafControls } from "./MushafControls";
import { MushafPage } from "./MushafPage";
import { MushafPager, SWIPE_MIN_PX } from "./MushafPager";
import { MushafSearchSheet } from "./MushafSearchSheet";
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

type MushafTheme = "paper" | "night";

const THEME_KEY = "majlisilm.mushaf.theme";

function loadTheme(): MushafTheme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    if (v === "night" || v === "paper") return v;
  } catch {
    /* ignore */
  }
  return "paper";
}

function mushafAudioLog(
  event: "load" | "play" | "error" | "pause",
  payload: Record<string, unknown>,
): void {
  if (!import.meta.env.DEV) return;
  console.info("[mushaf-audio]", event, payload);
}

/**
 * VerifiedMushafReader — غلاف المصحف الموثّق:
 * صفحة بعرض آمن كامل، ملاءمة خط QPC بلا قص، قلب صفحة RTL، أدوات آية خارج النص.
 */
export function VerifiedMushafReader({ pageNumber, onPageChange, onExit, onIndex }: Props) {
  const page = clampMushafPage(pageNumber);
  const [layout, setLayout] = useState<MushafPageLayout | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chromeOpen, setChromeOpen] = useState(true);
  const [selectedVerseKey, setSelectedVerseKey] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [tafsirOpen, setTafsirOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [reciterId, setReciterId] = useState(() => loadReciterId());
  const [playerState, setPlayerState] = useState<PlayerState>("idle");
  const [playingVerseKey, setPlayingVerseKey] = useState<string | null>(null);
  const [audioDockOpen, setAudioDockOpen] = useState(false);
  const [audioError, setAudioError] = useState<string | null>(null);
  const [audioStatus, setAudioStatus] = useState<string | null>(null);
  const [theme, setTheme] = useState<MushafTheme>(() => loadTheme());

  const { fontFamily, ready: fontReady } = useQpcPageFont(page);
  const hideTimer = useRef<number | null>(null);
  const pageRef = useRef(page);
  pageRef.current = page;
  const onPageChangeRef = useRef(onPageChange);
  onPageChangeRef.current = onPageChange;
  /** يمنع قلب الصفحة أثناء تشغيل آية مختارة يدويًا */
  const suppressPageSyncRef = useRef(false);
  const actionsOpenRef = useRef(false);
  actionsOpenRef.current = actionsOpen;
  const audio = useMemo(() => getAudioEngine(), []);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

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

  /** عند تغيير الصفحة: امسح التحديد والشريط */
  useEffect(() => {
    setSelectedVerseKey(null);
    setActionsOpen(false);
    setTafsirOpen(false);
    setCopyStatus(null);
    setAudioStatus(null);
    suppressPageSyncRef.current = false;
  }, [page]);

  const bumpChrome = useCallback(() => {
    setChromeOpen(true);
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setChromeOpen(false), 2500);
  }, []);

  useEffect(() => {
    bumpChrome();
    return () => {
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [page, bumpChrome]);

  useEffect(() => {
    audio.setReciter(loadReciterId());
    const syncPageIfAllowed = (surah: number, ayah: number) => {
      if (suppressPageSyncRef.current) return;
      if (actionsOpenRef.current) return;
      const targetPage = findMushafPageForAyah(surah, ayah);
      if (targetPage !== pageRef.current) onPageChangeRef.current(targetPage);
    };
    const unSnap = audio.onSnapshot((snap) => {
      setPlayerState(snap.playerState);
      setReciterId(snap.reciterId);
      if (snap.playerState === "error") {
        const msg = snap.errorMessage || "تعذر تحميل التلاوة، أعد المحاولة";
        setAudioError(msg);
        setAudioStatus(null);
        mushafAudioLog("error", {
          reciterId: snap.reciterId,
          ayahKey: snap.surah != null && snap.ayah != null ? `${snap.surah}:${snap.ayah}` : null,
          message: msg,
        });
      } else if (snap.playerState === "loading" || snap.playerState === "buffering") {
        setAudioError(null);
        setAudioStatus("جاري تحميل التلاوة...");
      } else if (snap.playerState === "playing") {
        setAudioError(null);
        setAudioStatus("يتم تشغيل التلاوة");
        mushafAudioLog("play", {
          reciterId: snap.reciterId,
          ayahKey: snap.surah != null && snap.ayah != null ? `${snap.surah}:${snap.ayah}` : null,
        });
      } else if (snap.playerState === "paused") {
        setAudioStatus(null);
        mushafAudioLog("pause", {
          reciterId: snap.reciterId,
          ayahKey: snap.surah != null && snap.ayah != null ? `${snap.surah}:${snap.ayah}` : null,
        });
      } else if (snap.playerState === "idle") {
        setPlayingVerseKey(null);
        setAudioStatus(null);
      }
      if (snap.surah != null && snap.ayah != null) {
        const key = `${snap.surah}:${snap.ayah}`;
        setPlayingVerseKey(key);
        if (snap.playerState === "playing" || snap.playerState === "loading" || snap.playerState === "buffering") {
          setAudioDockOpen(true);
        }
      }
    });
    const unAyah = audio.onAyahChange(({ surah, ayah }) => {
      const key = `${surah}:${ayah}`;
      setPlayingVerseKey(key);
      if (!suppressPageSyncRef.current && !actionsOpenRef.current) {
        setSelectedVerseKey(key);
        syncPageIfAllowed(surah, ayah);
      }
    });
    return () => {
      unSnap();
      unAyah();
    };
  }, [audio]);

  const go = useCallback(
    (next: number) => {
      suppressPageSyncRef.current = false;
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
      setAudioStatus(null);
      bumpChrome();
    },
    [actionsOpen, bumpChrome, selectedVerseKey],
  );

  const closeActions = useCallback(() => {
    setActionsOpen(false);
  }, []);

  const playSelected = useCallback(async () => {
    if (!selectedVerseKey) {
      setAudioError("اختر آية أولاً");
      setAudioStatus(null);
      return;
    }
    const parsed = parseVerseKey(selectedVerseKey);
    if (!parsed) {
      setAudioError("اختر آية أولاً");
      return;
    }
    const ayahKey = `${parsed.surah}:${parsed.ayah}`;
    setAudioError(null);
    setAudioDockOpen(true);
    bumpChrome();
    suppressPageSyncRef.current = true;

    const sameAyahLoaded = playingVerseKey === ayahKey;
    if (
      sameAyahLoaded &&
      (playerState === "playing" || playerState === "paused" || playerState === "buffering")
    ) {
      await audio.togglePlay(parsed.surah, parsed.ayah);
      return;
    }

    const urls = listAyahAudioUrls(parsed.surah, parsed.ayah, reciterId);
    mushafAudioLog("load", {
      reciterId,
      ayahKey,
      audioUrl: urls[0] ?? null,
    });
    setAudioStatus("جاري تحميل التلاوة...");
    await audio.playAyah(parsed.surah, parsed.ayah, reciterId);
  }, [audio, bumpChrome, playerState, playingVerseKey, reciterId, selectedVerseKey]);

  const togglePlay = useCallback(async () => {
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
    suppressPageSyncRef.current = true;
    await audio.togglePlay(parsed.surah, parsed.ayah);
    bumpChrome();
  }, [audio, bumpChrome, playingVerseKey, selectedVerseKey]);

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
      const urls = listAyahAudioUrls(parsed.surah, parsed.ayah, id);
      mushafAudioLog("load", {
        reciterId: id,
        ayahKey: key,
        audioUrl: urls[0] ?? null,
        reason: "reciter-change",
      });
      if (playerState === "playing" || playerState === "paused" || playerState === "buffering") {
        setAudioStatus("جاري تحميل التلاوة...");
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
    const text = parsed
      ? `${getSurahMeta(parsed.surah).name} ${parsed.ayah}\n${body}`
      : body;
    const url = `${window.location.origin}/mushaf?page=${page}`;
    try {
      if (typeof navigator.share === "function") {
        await navigator.share({ title: "المصحف — المجلس العلمي", text, url });
        setCopyStatus("تمت المشاركة");
        return;
      }
      await navigator.clipboard.writeText(`${text}\n${url}`);
      setCopyStatus("تم نسخ الآية لل مشاركة");
    } catch {
      setCopyStatus("تعذّرت المشاركة");
    }
  }, [page, selectedVerseKey, versePreview]);

  const onBookmark = useCallback(async () => {
    if (!selectedVerseKey) return;
    const parsed = parseVerseKey(selectedVerseKey);
    const label = parsed
      ? `${getSurahMeta(parsed.surah).name} · آية ${parsed.ayah}`
      : `آية ${selectedVerseKey}`;
    try {
      const { getMyBookmarks, saveBookmarks } = await import("@/lib/quran-my-bookmarks");
      const list = getMyBookmarks().filter((b) => b.ayahKey !== selectedVerseKey);
      const next = {
        id: Date.now(),
        ayahKey: selectedVerseKey,
        page,
        label,
        date: new Date().toLocaleDateString("ar"),
      };
      await saveBookmarks([next, ...list]);
      setCopyStatus("تم حفظ العلامة");
    } catch {
      setCopyStatus("تعذّر حفظ العلامة");
    }
  }, [page, selectedVerseKey]);

  /** إخفاء شريط الآية عند تمرير المصحف — يعود لوضع القراءة النظيف */
  useEffect(() => {
    if (!actionsOpen) return;
    const shell = document.querySelector<HTMLElement>(".mm-viewport .mm-page-shell");
    if (!shell) return;
    let lastY = shell.scrollTop;
    const onScroll = () => {
      if (Math.abs(shell.scrollTop - lastY) < 8) return;
      lastY = shell.scrollTop;
      setActionsOpen(false);
    };
    shell.addEventListener("scroll", onScroll, { passive: true });
    return () => shell.removeEventListener("scroll", onScroll);
  }, [actionsOpen]);

  const verseLabel = useMemo(() => {
    const key = playingVerseKey ?? selectedVerseKey;
    if (!key) return "التلاوة";
    const parsed = parseVerseKey(key);
    if (!parsed) return key;
    return `${getSurahMeta(parsed.surah).name} · ${parsed.ayah}`;
  }, [playingVerseKey, selectedVerseKey]);

  const edgesDisabled = actionsOpen || tafsirOpen || searchOpen;

  return (
    <MushafPager
      page={page}
      onPageChange={go}
      disabled={edgesDisabled}
      onTapEmpty={() => {
        if (actionsOpen) {
          setActionsOpen(false);
          return;
        }
        setChromeOpen((v) => !v);
        if (!chromeOpen) bumpChrome();
      }}
      className="mm-viewport mushaf-shell"
      data-chrome={chromeOpen ? "1" : "0"}
      data-ayah-bar={actionsOpen ? "1" : "0"}
      data-mushaf-theme={theme}
      data-testid="mushaf-viewport"
      dir="rtl"
    >
      <div className="mm-page-shell mushaf-page-frame" data-testid="mushaf-page-shell">
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
        open={
          !actionsOpen &&
          audioDockOpen &&
          (chromeOpen || playerState === "playing" || playerState === "buffering" || playerState === "error")
        }
        verseLabel={verseLabel}
        playerState={playerState}
        reciterId={reciterId}
        audioError={audioError}
        onTogglePlay={() => void togglePlay()}
        onPrev={() => {
          suppressPageSyncRef.current = false;
          void audio.skipPrev();
        }}
        onNext={() => {
          suppressPageSyncRef.current = false;
          void audio.skipNext();
        }}
        onReciterChange={(id) => void onReciterChange(id)}
      />

      <MushafControls
        open={chromeOpen && !actionsOpen}
        exitAlwaysVisible
        pageNumber={page}
        onExit={onExit}
        onIndex={onIndex}
        onPrev={() => go(page - 1)}
        onNext={() => go(page + 1)}
        onGoto={go}
        onSearch={() => setSearchOpen(true)}
        onToggleTheme={() => setTheme((t) => (t === "paper" ? "night" : "paper"))}
        themeLabel={theme === "paper" ? "المصحف الورقي" : "ليلي هادئ"}
      />

      {actionsOpen && selectedVerseKey ? (
        <AyahActionSheet
          verseKey={selectedVerseKey}
          ayahPreview={versePreview(selectedVerseKey)}
          copyStatus={copyStatus}
          audioError={audioError}
          audioStatus={audioStatus}
          playerState={playerState}
          reciterId={reciterId}
          onPlay={() => void playSelected()}
          onTogglePlay={() => void togglePlay()}
          onPrevAyah={() => {
            suppressPageSyncRef.current = false;
            void audio.skipPrev();
          }}
          onNextAyah={() => {
            suppressPageSyncRef.current = false;
            void audio.skipNext();
          }}
          onTafsir={() => {
            setTafsirOpen(true);
          }}
          onCopy={() => void onCopy()}
          onShare={() => void onShare()}
          onBookmark={() => void onBookmark()}
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

      <MushafSearchSheet
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        onGotoPage={(n, verseKey) => {
          go(n);
          if (verseKey) {
            setSelectedVerseKey(verseKey);
            setActionsOpen(true);
          }
        }}
      />

      <span className="sr-only" aria-live="polite">
        صفحة {page} من {MUSHAF_PAGE_MAX}
      </span>
      <span hidden data-min={1} data-swipe-min={SWIPE_MIN_PX} />
    </MushafPager>
  );
}

/** توافق المسار والبوابات */
export { VerifiedMushafReader as MushafViewport };
