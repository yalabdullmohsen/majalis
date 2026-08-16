import { useEffect, useState } from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  MUSHAF_TAFSIR_EDITIONS,
} from "@/lib/quran-data/tafsir-editions";
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

/** شيت تفسير فاتح — الميسّر / السعدي / ابن كثير. */
export function MushafTafsirSheet({ open, verseKey, ayahText = "", onClose }: Props) {
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
    <AppBottomSheet open={open} onClose={onClose} title={title} snap="half" elevated>
      <div className="mm-tafsir" data-testid="mushaf-tafsir-sheet">
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
        <div className="mm-tafsir__editions" role="tablist" aria-label="مصدر التفسير">
          {PRIMARY_EDITIONS.map((ed) => {
            const tab = EDITION_TABS.find((t) => t.id === ed.id);
            return (
              <button
                key={ed.id}
                type="button"
                role="tab"
                aria-selected={editionId === ed.id}
                className={editionId === ed.id ? "is-active" : undefined}
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
    </AppBottomSheet>
  );
}
