import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Copy, Share2, BookOpen } from "lucide-react";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  formatTafsirSourceLine,
  getEligibleTextTafsirs,
  resolveRegistryTafsirId,
  type TafsirRegistryEntry,
} from "@/lib/quran-data/tafsir-registry";
import {
  persistTafsirEdition,
  persistTafsirFontScale,
  readStoredTafsirEdition,
  readStoredTafsirFontScale,
  TAFSIR_FONT_SCALES,
  type TafsirFontScale,
} from "@/lib/quran-data/reader-prefs";

type Props = {
  surah: number;
  ayah: number;
  expanded: boolean;
  onCopy: () => void;
  onShare: () => void;
  onExpand: () => void;
  onAvailabilityChange: (available: boolean) => void;
};

export function TafsirTabPanel({
  surah,
  ayah,
  expanded,
  onCopy,
  onShare,
  onExpand,
  onAvailabilityChange,
}: Props) {
  const [editions, setEditions] = useState<TafsirRegistryEntry[]>([]);
  const [editionId, setEditionId] = useState(() => resolveRegistryTafsirId(readStoredTafsirEdition()));
  const [fontScale, setFontScale] = useState<TafsirFontScale>(() => readStoredTafsirFontScale());
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeEntry, setActiveEntry] = useState<TafsirRegistryEntry | null>(null);

  useEffect(() => {
    let cancelled = false;
    void getEligibleTextTafsirs().then((list) => {
      if (!cancelled) setEditions(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!editions.length) {
      setText(null);
      setLoading(false);
      onAvailabilityChange(false);
      return;
    }
    const preferred = editions.some((e) => e.id === editionId)
      ? editionId
      : editions[0]!.id;
    if (preferred !== editionId) setEditionId(preferred);

    const ac = new AbortController();
    setLoading(true);
    void fetchMushafAyahTafsir(surah, ayah, preferred, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        const t = res?.text?.trim() || null;
        setText(t);
        const entry = editions.find((e) => e.id === preferred) ?? null;
        setActiveEntry(entry);
        onAvailabilityChange(Boolean(t));
      })
      .catch(() => {
        if (!ac.signal.aborted) {
          setText(null);
          onAvailabilityChange(false);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted) setLoading(false);
      });
    return () => ac.abort();
  }, [surah, ayah, editionId, editions, onAvailabilityChange]);

  if (!editions.length) return null;
  if (!loading && !text) return null;

  const levelLabel = (level: TafsirRegistryEntry["level"]) => level;

  return (
    <div className="ayah-action-sheet__tafsir" data-testid="tafsir-tab-panel">
      <div className="ayah-action-sheet__tafsir-chips" role="listbox" aria-label="اختيار المفسّر">
        {editions.map((ed) => (
          <button
            key={ed.id}
            type="button"
            role="option"
            aria-selected={editionId === ed.id}
            className={`ayah-action-sheet__tafsir-chip${editionId === ed.id ? " is-active" : ""}`}
            onClick={() => {
              setEditionId(ed.id);
              persistTafsirEdition(ed.id);
            }}
          >
            <span className="ayah-action-sheet__tafsir-chip-label">{ed.name}</span>
            <span className="ayah-action-sheet__tafsir-chip-level">{levelLabel(ed.level)}</span>
          </button>
        ))}
      </div>

      <div className="ayah-action-sheet__tafsir-font" role="group" aria-label="حجم خط التفسير">
        {TAFSIR_FONT_SCALES.map((scale) => (
          <button
            key={scale}
            type="button"
            aria-pressed={fontScale === scale}
            className={`ayah-action-sheet__font-btn${fontScale === scale ? " is-active" : ""}`}
            onClick={() => {
              setFontScale(scale);
              persistTafsirFontScale(scale);
            }}
          >
            {scale === 0.9 ? "أ-" : scale === 1 ? "أ" : scale === 1.15 ? "أ+" : "أ++"}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mm-ayah-bar__status" aria-busy="true">
          جاري تحميل التفسير…
        </p>
      ) : text ? (
        <p
          className="ayah-action-sheet__preview ayah-action-sheet__tafsir-text"
          dir="rtl"
          lang="ar"
          style={{ fontSize: `${fontScale}rem`, lineHeight: 1.65, minHeight: "4.5rem" }}
        >
          {text}
        </p>
      ) : null}

      {activeEntry && text ? (
        <p className="ayah-action-sheet__tafsir-attribution">
          {formatTafsirSourceLine(activeEntry)}{" "}
          <Link href="/sources" className="ayah-action-sheet__sources-link">
            المصادر
          </Link>
        </p>
      ) : null}

      {expanded && text ? (
        <div className="ayah-action-sheet__tafsir-actions" role="group" aria-label="إجراءات التفسير">
          <button type="button" onClick={onCopy}>
            <Copy size={18} aria-hidden="true" />
            <span>نسخ</span>
          </button>
          <button type="button" onClick={onShare}>
            <Share2 size={18} aria-hidden="true" />
            <span>مشاركة</span>
          </button>
          <button type="button" onClick={onExpand}>
            <BookOpen size={18} aria-hidden="true" />
            <span>موسّع</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
