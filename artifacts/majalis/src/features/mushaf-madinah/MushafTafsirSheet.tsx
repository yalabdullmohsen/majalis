import { useEffect, useState } from "react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import { getSurahMeta } from "@/lib/quran-api";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  DEFAULT_MUSHAF_TAFSIR_EDITION,
  MUSHAF_TAFSIR_EDITIONS,
} from "@/lib/quran-data/tafsir-editions";
import { parseVerseKey } from "./mushaf-page-for-ayah";

const PRIMARY_EDITIONS = MUSHAF_TAFSIR_EDITIONS.filter((e) =>
  ["ar-tafsir-muyassar", "ar-tafsir-ibn-kathir", "ar-tafseer-al-saddi"].includes(e.id),
);

type Props = {
  open: boolean;
  verseKey: string | null;
  onClose: () => void;
};

/** شيت تفسير الآية — الميسّر / ابن كثير / السعدي. */
export function MushafTafsirSheet({ open, verseKey, onClose }: Props) {
  const [editionId, setEditionId] = useState(DEFAULT_MUSHAF_TAFSIR_EDITION);
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const parsed = verseKey ? parseVerseKey(verseKey) : null;
  const title = parsed
    ? `تفسير ${getSurahMeta(parsed.surah).name} · ${parsed.ayah}`
    : "التفسير";

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
          setError("تعذّر جلب التفسير لهذه الآية. تحقّق من الاتصال ثم أعد المحاولة.");
          setText(null);
        } else {
          setText(res.text);
        }
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setError("تعذّر جلب التفسير. حاول لاحقًا.");
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
        <div className="mm-tafsir__editions" role="tablist" aria-label="مصدر التفسير">
          {PRIMARY_EDITIONS.map((ed) => (
            <button
              key={ed.id}
              type="button"
              role="tab"
              aria-selected={editionId === ed.id}
              className={editionId === ed.id ? "is-active" : undefined}
              onClick={() => setEditionId(ed.id)}
            >
              {ed.label.replace(/^تفسير\s*/, "").replace(/^التفسير\s*/, "")}
            </button>
          ))}
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
