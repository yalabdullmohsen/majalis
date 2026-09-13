import { useEffect, useId, useRef, useState } from "react";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  loadMushafTafsirEdition,
  MUSHAF_TAFSIR_EDITIONS,
  saveMushafTafsirEdition,
} from "@/lib/quran-data/tafsir-editions";
import { QuranSheetShell } from "./quran-sheet";
import { parseVerseKey } from "./mushaf-page-for-ayah";

const EDITION_TABS: Array<{ id: string; label: string }> = [
  { id: "ar-tafsir-muyassar", label: "الميسر" },
  { id: "ar-tafseer-al-saddi", label: "السعدي" },
  { id: "ar-tafsir-ibn-kathir", label: "ابن كثير" },
];

const PRIMARY_EDITIONS = MUSHAF_TAFSIR_EDITIONS.filter((e) =>
  EDITION_TABS.some((t) => t.id === e.id),
);

const BRIEF_CHARS = 520;
const DEPTH_PREF_KEY = "majlisilm.mushaf.tafsir-depth";

type Depth = "brief" | "full";

function loadDepth(): Depth {
  try {
    return localStorage.getItem(DEPTH_PREF_KEY) === "full" ? "full" : "brief";
  } catch {
    return "brief";
  }
}

function saveDepth(d: Depth) {
  try {
    localStorage.setItem(DEPTH_PREF_KEY, d);
  } catch {
    /* ignore */
  }
}

type Props = {
  open: boolean;
  verseKey: string | null;
  ayahText?: string;
  onClose: () => void;
};

/** شيت تفسير — مختصر/مطول، يحفظ آخر اختيار، سحب للأعلى. */
export function MushafTafsirSheet({ open, verseKey, ayahText = "", onClose }: Props) {
  const titleId = useId();
  const [editionId, setEditionId] = useState(loadMushafTafsirEdition);
  const [depth, setDepth] = useState<Depth>(loadDepth);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<"half" | "full">("half");

  const parsed = verseKey ? parseVerseKey(verseKey) : null;
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed
    ? `سورة ${surahName}، الآية ${parsed.ayah}`
    : "التفسير";
  const technicalRef = parsed ? `${parsed.surah}:${parsed.ayah}` : "";
  const fetchGenRef = useRef(0);

  useEffect(() => {
    if (!open) {
      setSnap("half");
      return;
    }
  }, [open]);

  useEffect(() => {
    if (!open || !parsed) {
      setText(null);
      setError(null);
      return;
    }
    const gen = ++fetchGenRef.current;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setText(null);
    fetchMushafAyahTafsir(parsed.surah, parsed.ayah, editionId, ac.signal)
      .then((res) => {
        if (ac.signal.aborted || gen !== fetchGenRef.current) return;
        if (!res?.text) {
          setError("لم يتوفر تفسير لهذه الآية حاليًا");
          setText(null);
        } else {
          setText(res.text);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted && gen === fetchGenRef.current) {
          setError("لم يتوفر تفسير لهذه الآية حاليًا");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted && gen === fetchGenRef.current) setLoading(false);
      });
    return () => {
      ac.abort();
      /* إبطال أي استجابة متأخرة بعد الإغلاق/تغيير الآية */
      fetchGenRef.current += 1;
    };
  }, [open, parsed?.surah, parsed?.ayah, editionId]);

  const selectEdition = (id: string) => {
    setEditionId(id);
    saveMushafTafsirEdition(id);
  };

  const selectDepth = (d: Depth) => {
    setDepth(d);
    saveDepth(d);
    if (d === "full") setSnap("full");
  };

  const displayText =
    text && depth === "brief" && text.length > BRIEF_CHARS
      ? `${text.slice(0, BRIEF_CHARS).trim()}…`
      : text;

  return (
    <QuranSheetShell
      open={open}
      ariaLabel="التفسير"
      title={title}
      titleId={titleId}
      onClose={onClose}
      snap={snap}
      testId="mushaf-tafsir-sheet"
      panelClassName="mm-tafsir-sheet__panel"
      onDragEnd={(dy) => {
        if (dy < -48) setSnap("full");
        else if (dy > 72) {
          if (snap === "full") setSnap("half");
          else onClose();
        }
      }}
    >
      <div className="mm-tafsir quran-sheet__body">
        {parsed ? (
          <header className="mm-tafsir__meta">
            <p className="mm-tafsir__meta-label">
              سورة {surahName}، الآية {parsed.ayah}
            </p>
            {technicalRef ? (
              <p className="mm-tafsir__meta-ref" aria-hidden="true">
                {technicalRef}
              </p>
            ) : null}
            {ayahText ? (
              <p className="mm-tafsir__ayah" dir="rtl" lang="ar">
                {ayahText}
              </p>
            ) : null}
          </header>
        ) : null}

        <div className="mm-tafsir__toolbar" role="group" aria-label="خيارات التفسير">
          <div className="mm-tafsir__depth" role="tablist" aria-label="طول التفسير">
            <button
              type="button"
              role="tab"
              aria-selected={depth === "brief"}
              className={`mm-tafsir__depth-btn${depth === "brief" ? " is-active" : ""}`}
              data-testid="mushaf-tafsir-depth-brief"
              onClick={() => selectDepth("brief")}
            >
              مختصر
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={depth === "full"}
              className={`mm-tafsir__depth-btn${depth === "full" ? " is-active" : ""}`}
              data-testid="mushaf-tafsir-depth-full"
              onClick={() => selectDepth("full")}
            >
              مطول
            </button>
          </div>
          <div className="mm-tafsir__editions" role="tablist" aria-label="مصدر التفسير">
            {PRIMARY_EDITIONS.map((ed) => {
              const tab = EDITION_TABS.find((t) => t.id === ed.id);
              const active = editionId === ed.id || editionId === ed.quranComSlug;
              return (
                <button
                  key={ed.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`mm-tafsir__ed-btn${active ? " is-active" : ""}`}
                  onClick={() => selectEdition(ed.id)}
                >
                  {tab?.label ?? ed.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? <p className="mm-tafsir__status">تجهيز التفسير…</p> : null}
        {!loading && error ? <p className="mm-tafsir__status mm-tafsir__status--err">{error}</p> : null}
        {!loading && displayText ? (
          <div className="mm-tafsir__body" dir="rtl" lang="ar">
            {displayText}
            {depth === "brief" && text && text.length > BRIEF_CHARS ? (
              <button
                type="button"
                className="mm-tafsir__more"
                onClick={() => selectDepth("full")}
              >
                عرض المطول
              </button>
            ) : null}
          </div>
        ) : null}
      </div>
    </QuranSheetShell>
  );
}
