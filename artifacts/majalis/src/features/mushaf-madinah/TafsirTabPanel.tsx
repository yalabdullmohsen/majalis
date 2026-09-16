import { memo, useEffect, useMemo, useRef, useState } from "react";
import { Bookmark, Copy, Share2 } from "lucide-react";
import { fetchMushafAyahTafsir } from "@/lib/quran-data/fetch-ayah-content";
import {
  getEligibleTextTafsirs,
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
  onShareImage?: () => void;
  onBookmark: () => void;
  onExpand: () => void;
  onAvailabilityChange: (available: boolean) => void;
};

/** مصادر حقيقية فقط — الطول يتبع المصدر لا قصّ UI. */
const PRIMARY_SOURCE_IDS = ["muyassar", "saadi", "ibn-kathir"] as const;
const SOURCE_LABELS: Record<(typeof PRIMARY_SOURCE_IDS)[number], string> = {
  muyassar: "الميسر",
  saadi: "السعدي",
  "ibn-kathir": "ابن كثير",
};

function fontLabel(scale: TafsirFontScale): string {
  if (scale === 0.9) return "صغير";
  if (scale === 1) return "عادي";
  if (scale === 1.15) return "كبير";
  return "أكبر";
}

function stepFontScale(current: TafsirFontScale, dir: -1 | 1): TafsirFontScale {
  const idx = TAFSIR_FONT_SCALES.indexOf(current);
  const next = Math.max(0, Math.min(TAFSIR_FONT_SCALES.length - 1, idx + dir));
  return TAFSIR_FONT_SCALES[next] ?? current;
}

export const TafsirTabPanel = memo(function TafsirTabPanel({
  surah,
  ayah,
  expanded,
  onCopy,
  onShare,
  onShareImage,
  onBookmark,
  onExpand: _onExpand,
  onAvailabilityChange,
}: Props) {
  const [editions, setEditions] = useState<TafsirRegistryEntry[]>([]);
  const [editionId, setEditionId] = useState(() => readStoredTafsirEdition());
  const [fontScale, setFontScale] = useState<TafsirFontScale>(() => readStoredTafsirFontScale());
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fetchGenRef = useRef(0);

  const primaryEditions = useMemo(
    () =>
      PRIMARY_SOURCE_IDS.map((id) => editions.find((e) => e.id === id)).filter(
        (e): e is TafsirRegistryEntry => Boolean(e),
      ),
    [editions],
  );

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
    setText(null);
  }, [surah, ayah]);

  useEffect(() => {
    if (!primaryEditions.length) {
      onAvailabilityChange(false);
      return;
    }
    const active =
      primaryEditions.find((e) => e.id === editionId) ?? primaryEditions[0];
    if (!active) {
      setText(null);
      onAvailabilityChange(false);
      return;
    }
    if (active.id !== editionId) {
      setEditionId(active.id);
      persistTafsirEdition(active.id);
    }
    const gen = ++fetchGenRef.current;
    const ac = new AbortController();
    setLoading(true);
    void fetchMushafAyahTafsir(surah, ayah, active.id, ac.signal)
      .then((res) => {
        if (ac.signal.aborted || gen !== fetchGenRef.current) return;
        const t = res?.text?.trim() || null;
        setText(t);
        onAvailabilityChange(Boolean(t));
      })
      .catch(() => {
        if (!ac.signal.aborted && gen === fetchGenRef.current) {
          setText(null);
          onAvailabilityChange(false);
        }
      })
      .finally(() => {
        if (!ac.signal.aborted && gen === fetchGenRef.current) setLoading(false);
      });
    return () => ac.abort();
  }, [surah, ayah, editionId, primaryEditions, onAvailabilityChange]);

  const selectEdition = (id: string) => {
    if (id === editionId) return;
    setEditionId(id);
    persistTafsirEdition(id);
  };

  if (!primaryEditions.length) {
    return <p className="mm-ayah-bar__status">لا تفسير متاح لهذه الآية في المصدر المعتمد حاليًا.</p>;
  }

  const active = primaryEditions.find((e) => e.id === editionId) ?? primaryEditions[0];

  return (
    <div className="ayah-action-sheet__tafsir" data-testid="tafsir-tab-panel">
      <div className="ayah-action-sheet__tafsir-toolbar">
        <div
          className="mm-search-sheet__tafsir-sources quran-tabbar"
          role="tablist"
          aria-label="مصدر التفسير"
        >
          {primaryEditions.map((ed) => {
            const selected = ed.id === active?.id;
            const label =
              SOURCE_LABELS[ed.id as (typeof PRIMARY_SOURCE_IDS)[number]] ?? ed.name;
            return (
              <button
                key={ed.id}
                type="button"
                role="tab"
                className={`quran-tab quran-btn--segment${selected ? " is-active" : ""}`}
                aria-selected={selected}
                onClick={() => selectEdition(ed.id)}
              >
                {label}
              </button>
            );
          })}
        </div>
        <div className="ayah-action-sheet__tafsir-font quran-font-stepper" role="group" aria-label="حجم خط التفسير">
          <button
            type="button"
            className="ayah-action-sheet__font-btn quran-font-stepper__btn quran-btn"
            aria-label="تصغير خط التفسير"
            disabled={fontScale === TAFSIR_FONT_SCALES[0]}
            onClick={() => {
              const next = stepFontScale(fontScale, -1);
              setFontScale(next);
              persistTafsirFontScale(next);
            }}
          >
            أ−
          </button>
          <span className="ayah-action-sheet__font-label quran-font-stepper__label" aria-live="polite">
            {fontLabel(fontScale)}
          </span>
          <button
            type="button"
            className="ayah-action-sheet__font-btn quran-font-stepper__btn quran-btn"
            aria-label="تكبير خط التفسير"
            disabled={fontScale === TAFSIR_FONT_SCALES[TAFSIR_FONT_SCALES.length - 1]}
            onClick={() => {
              const next = stepFontScale(fontScale, 1);
              setFontScale(next);
              persistTafsirFontScale(next);
            }}
          >
            أ+
          </button>
        </div>
      </div>
      {active ? (
        <p className="ayah-action-sheet__tafsir-chip-label">{active.name}</p>
      ) : null}
      <div className="ayah-action-sheet__tafsir-scroll">
        {loading ? (
          <p className="mm-ayah-bar__status" aria-busy="true">
            تجهيز التفسير…
          </p>
        ) : text ? (
          <p
            className="ayah-action-sheet__tafsir-text"
            dir="rtl"
            lang="ar"
            style={{ fontSize: `${Math.max(1.05, fontScale * 1.05)}rem`, lineHeight: 1.8 }}
          >
            {text}
          </p>
        ) : (
          <p className="mm-ayah-bar__status">تعذّر جلب التفسير</p>
        )}
      </div>
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
          {onShareImage ? (
            <button type="button" onClick={onShareImage}>
              <Share2 size={18} aria-hidden="true" />
              <span>بطاقة</span>
            </button>
          ) : null}
          <button type="button" onClick={onBookmark}>
            <Bookmark size={18} aria-hidden="true" />
            <span>إشارة</span>
          </button>
        </div>
      ) : null}
    </div>
  );
});
