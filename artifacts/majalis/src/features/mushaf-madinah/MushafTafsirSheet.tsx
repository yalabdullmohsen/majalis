import { useEffect, useId, useRef, useState } from "react";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  getMushafTafsirEdition,
  loadMushafTafsirEdition,
  MUSHAF_TAFSIR_EDITIONS,
  resolveMushafTafsirEditionId,
  saveMushafTafsirEdition,
} from "@/lib/quran-data/tafsir-editions";
import { QuranSheetShell } from "./quran-sheet";
import { parseVerseKey } from "./mushaf-page-for-ayah";
import "./mushaf-tafsir-sheet.css";

/**
 * مصادر التفسير الفعلية فقط — كل تبويب يجلب نصّه المستقل.
 * لا يُعرض «مختصر/مطول» كقصّ UI؛ الطول يتبع المصدر (ميسر / سعدي / ابن كثير).
 */
const EDITION_TABS: Array<{ id: string; label: string }> = [
  { id: "ar-tafsir-muyassar", label: "الميسر" },
  { id: "ar-tafseer-al-saddi", label: "السعدي" },
  { id: "ar-tafsir-ibn-kathir", label: "ابن كثير" },
];

const PRIMARY_EDITIONS = MUSHAF_TAFSIR_EDITIONS.filter((e) =>
  EDITION_TABS.some((t) => t.id === e.id),
);

function isEditionActive(selected: string, editionId: string, quranComSlug: string): boolean {
  const resolved = resolveMushafTafsirEditionId(selected);
  return (
    selected === editionId ||
    selected === quranComSlug ||
    resolved === resolveMushafTafsirEditionId(editionId) ||
    resolved === resolveMushafTafsirEditionId(quranComSlug)
  );
}

type Props = {
  open: boolean;
  verseKey: string | null;
  ayahText?: string;
  onClose: () => void;
};

/** شيت تفسير تعليمي — مصادر حقيقية، منع استجابة قديمة، واجهة مضغوطة. */
export function MushafTafsirSheet({ open, verseKey, ayahText = "", onClose }: Props) {
  const titleId = useId();
  const [editionId, setEditionId] = useState(() => {
    const loaded = loadMushafTafsirEdition();
    return getMushafTafsirEdition(loaded)?.id ?? "ar-tafsir-muyassar";
  });
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [snap, setSnap] = useState<"half" | "full">("half");

  const parsed = verseKey ? parseVerseKey(verseKey) : null;
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = "تفسير الآية";
  const reference = parsed ? `سورة ${surahName}، الآية ${parsed.ayah}` : "";
  const technicalRef = parsed ? `${parsed.surah}:${parsed.ayah}` : "";
  const activeEditionLabel =
    EDITION_TABS.find((t) => isEditionActive(editionId, t.id, t.id))?.label ?? "التفسير";

  /** يمنع استجابة قديمة من استبدال اختيار أحدث عند التبديل السريع */
  const fetchGenRef = useRef(0);
  const activeEditionRef = useRef(editionId);
  activeEditionRef.current = editionId;
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

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
      setLoading(false);
      return;
    }
    const gen = ++fetchGenRef.current;
    const requestedEdition = editionId;
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setText(null);
    fetchMushafAyahTafsir(parsed.surah, parsed.ayah, requestedEdition, ac.signal)
      .then((res) => {
        if (ac.signal.aborted || gen !== fetchGenRef.current) return;
        if (activeEditionRef.current !== requestedEdition) return;
        if (!mountedRef.current) return;
        if (!res?.text) {
          setError("لم يتوفر تفسير لهذه الآية حاليًا");
          setText(null);
        } else {
          setText(res.text);
          setError(null);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted && gen === fetchGenRef.current && mountedRef.current) {
          setError("تعذر تحميل هذا التفسير");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted && gen === fetchGenRef.current && mountedRef.current) {
          setLoading(false);
        }
      });
    return () => {
      ac.abort();
    };
  }, [open, parsed?.surah, parsed?.ayah, editionId]);

  const selectEdition = (id: string) => {
    if (isEditionActive(editionId, id, id)) return;
    setEditionId(id);
    saveMushafTafsirEdition(id);
  };

  const retry = () => {
    if (!parsed) return;
    setError(null);
    setLoading(true);
    setText(null);
    const gen = ++fetchGenRef.current;
    const requestedEdition = editionId;
    const ac = new AbortController();
    fetchMushafAyahTafsir(parsed.surah, parsed.ayah, requestedEdition, ac.signal)
      .then((res) => {
        if (gen !== fetchGenRef.current || !mountedRef.current) return;
        if (!res?.text) {
          setError("لم يتوفر تفسير لهذه الآية حاليًا");
          setText(null);
        } else {
          setText(res.text);
          setError(null);
        }
      })
      .catch(() => {
        if (gen === fetchGenRef.current && mountedRef.current) setError("تعذر تحميل هذا التفسير");
      })
      .finally(() => {
        if (gen === fetchGenRef.current && mountedRef.current) setLoading(false);
      });
  };

  return (
    <QuranSheetShell
      open={open}
      ariaLabel="تفسير الآية"
      title={title}
      titleId={titleId}
      onClose={onClose}
      snap={snap}
      testId="mushaf-tafsir-sheet"
      className="mm-tafsir-sheet"
      panelClassName="mm-tafsir-sheet__panel"
      closeAriaLabel="إغلاق التفسير وإلغاء تحديد الآية"
      onDragEnd={(dy) => {
        if (dy < -48) setSnap("full");
        else if (dy > 72) {
          if (snap === "full") setSnap("half");
          else onClose();
        }
      }}
    >
      <div className="mm-tafsir quran-sheet__body" data-testid="mushaf-tafsir-root">
        {parsed ? (
          <header className="mm-tafsir__meta mm-tafsir__sheet-head" data-testid="mushaf-tafsir-header">
            <p className="mm-tafsir__sheet-kicker">تفسير الآية</p>
            <p className="mm-tafsir__ref-line" data-testid="mushaf-tafsir-reference">
              {reference}
            </p>
            {technicalRef ? (
              <p className="mm-tafsir__meta-ref" data-testid="mushaf-tafsir-ref">
                {technicalRef}
              </p>
            ) : null}
          </header>
        ) : null}

        {parsed && ayahText ? (
          <p
            className="mm-tafsir__ayah mm-tafsir__ayah-preview"
            dir="rtl"
            lang="ar"
            data-testid="mushaf-tafsir-ayah"
          >
            {ayahText}
          </p>
        ) : null}

        <div className="mm-tafsir__toolbar" role="group" aria-label="مصدر التفسير">
          <div
            className="mm-tafsir__editions"
            role="tablist"
            aria-label="مصدر التفسير"
            data-testid="mushaf-tafsir-editions"
          >
            {PRIMARY_EDITIONS.map((ed) => {
              const tab = EDITION_TABS.find((t) => t.id === ed.id);
              const active = isEditionActive(editionId, ed.id, ed.quranComSlug);
              return (
                <button
                  key={ed.id}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  className={`mm-tafsir__ed-btn${active ? " is-active" : ""}`}
                  data-testid={`mushaf-tafsir-edition-${resolveMushafTafsirEditionId(ed.id)}`}
                  onClick={() => selectEdition(ed.id)}
                >
                  {tab?.label ?? ed.label}
                </button>
              );
            })}
          </div>
        </div>

        {loading ? (
          <div className="mm-tafsir__skeleton" aria-busy="true" aria-label="بانتظار نص التفسير">
            <div className="mm-tafsir__skeleton-line" />
            <div className="mm-tafsir__skeleton-line" />
            <div className="mm-tafsir__skeleton-line" />
          </div>
        ) : null}

        {!loading && error ? (
          <div className="mm-tafsir__status mm-tafsir__status--err">
            <p>{error}</p>
            <button
              type="button"
              className="mm-tafsir__retry"
              data-testid="mushaf-tafsir-retry"
              onClick={retry}
            >
              إعادة المحاولة
            </button>
          </div>
        ) : null}

        {!loading && text ? (
          <>
            <div className="mm-tafsir__body" dir="rtl" lang="ar" data-testid="mushaf-tafsir-body">
              {text}
            </div>
            <p className="mm-tafsir__source-meta" data-testid="mushaf-tafsir-source-meta">
              المصدر: {activeEditionLabel}
            </p>
          </>
        ) : null}
      </div>
    </QuranSheetShell>
  );
}
