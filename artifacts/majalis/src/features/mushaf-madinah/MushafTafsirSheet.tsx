import { useEffect, useId, useState } from "react";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  MUSHAF_TAFSIR_EDITIONS,
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

type Props = {
  open: boolean;
  verseKey: string | null;
  ayahText?: string;
  onClose: () => void;
};

/** شيت تفسير فاتح — الميسّر / السعدي / ابن كثير (QuranSettingsSheet shell). */
export function MushafTafsirSheet({ open, verseKey, ayahText = "", onClose }: Props) {
  const titleId = useId();
  const [editionId, setEditionId] = useState(DEFAULT_MUSHAF_TAFSIR_EDITION);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = verseKey ? parseVerseKey(verseKey) : null;
  const surahName = parsed ? getSurahMeta(parsed.surah).name : "";
  const title = parsed ? `تفسير ${surahName} · ${parsed.ayah}` : "التفسير";

  useEffect(() => {
    if (!open || !parsed) {
      setText(null);
      setError(null);
      return;
    }
    const ac = new AbortController();
    setLoading(true);
    setError(null);
    setText(null);
    fetchMushafAyahTafsir(parsed.surah, parsed.ayah, editionId, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        if (!res?.text) {
          setError("لا يوجد تفسير لهذه الآية حاليًا");
          setText(null);
        } else {
          setText(res.text);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setError("لا يوجد تفسير لهذه الآية حاليًا");
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [open, parsed?.surah, parsed?.ayah, editionId]);

  return (
    <QuranSheetShell
      open={open}
      ariaLabel="التفسير"
      title={title}
      titleId={titleId}
      onClose={onClose}
      snap="half"
      testId="mushaf-tafsir-sheet"
      panelClassName="mm-tafsir-sheet__panel"
    >
      <div className="mm-tafsir quran-sheet__body">
        {parsed ? (
          <header className="mm-tafsir__meta">
            <p className="mm-tafsir__meta-label">
              {surahName} · آية {parsed.ayah}
            </p>
            {ayahText ? (
              <p className="mm-tafsir__ayah" dir="rtl" lang="ar">
                {ayahText}
              </p>
            ) : null}
          </header>
        ) : null}
        <div className="mm-tafsir__editions quran-tabbar" role="tablist" aria-label="مصدر التفسير">
          {PRIMARY_EDITIONS.map((ed) => {
            const tab = EDITION_TABS.find((t) => t.id === ed.id);
            const active = editionId === ed.id;
            return (
              <button
                key={ed.id}
                type="button"
                role="tab"
                aria-selected={active}
                className={`quran-tab quran-btn--segment${active ? " is-active" : ""}`}
                onClick={() => setEditionId(ed.id)}
              >
                {tab?.label ?? ed.label}
              </button>
            );
          })}
        </div>
        {loading ? <p className="mm-tafsir__status">جاري تحميل التفسير…</p> : null}
        {!loading && error ? <p className="mm-tafsir__status mm-tafsir__status--err">{error}</p> : null}
        {!loading && text ? (
          <div className="mm-tafsir__body" dir="rtl" lang="ar">
            {text}
          </div>
        ) : null}
      </div>
    </QuranSheetShell>
  );
}
