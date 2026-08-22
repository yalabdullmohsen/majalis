import { useEffect, useState } from "react";
import { ArrowRight, Bookmark, Copy, Share2 } from "lucide-react";
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
  onBookmark: () => void;
  onExpand: () => void;
  onAvailabilityChange: (available: boolean) => void;
};

function levelLabel(level: TafsirRegistryEntry["level"]): string {
  if (level === "مبتدئ") return "مختصر";
  if (level === "متوسط") return "متوسط";
  return "مطول";
}

function fontLabel(scale: TafsirFontScale): string {
  if (scale === 0.9) return "صغير";
  if (scale === 1) return "وسط";
  if (scale === 1.15) return "كبير";
  return "أكبر";
}

export function TafsirTabPanel({
  surah,
  ayah,
  expanded,
  onCopy,
  onShare,
  onBookmark,
  onExpand: _onExpand,
  onAvailabilityChange,
}: Props) {
  const [editions, setEditions] = useState<TafsirRegistryEntry[]>([]);
  const [editionId, setEditionId] = useState(() => readStoredTafsirEdition());
  const [fontScale, setFontScale] = useState<TafsirFontScale>(() => readStoredTafsirFontScale());
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<"list" | "text">("list");

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
    if (view !== "text" || !editions.length) {
      if (!editions.length) onAvailabilityChange(false);
      return;
    }
    const preferred = editions.some((e) => e.id === editionId)
      ? editionId
      : editions[0]!.id;
    const ac = new AbortController();
    setLoading(true);
    void fetchMushafAyahTafsir(surah, ayah, preferred, ac.signal)
      .then((res) => {
        if (ac.signal.aborted) return;
        const t = res?.text?.trim() || null;
        setText(t);
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
  }, [surah, ayah, editionId, editions, view, onAvailabilityChange]);

  if (!editions.length) {
    return (
      <p className="mm-ayah-bar__status">لا يوجد تفسير متاح لهذه الآية حاليًا</p>
    );
  }

  if (view === "list") {
    return (
      <div className="ayah-action-sheet__tafsir" data-testid="tafsir-tab-panel">
        <ul className="ayah-action-sheet__tafsir-cards" aria-label="التفاسير المتاحة">
          {editions.map((ed) => (
            <li key={ed.id}>
              <button
                type="button"
                className="ayah-action-sheet__tafsir-card"
                onClick={() => {
                  setEditionId(ed.id);
                  persistTafsirEdition(ed.id);
                  setView("text");
                }}
              >
                <span className="ayah-action-sheet__tafsir-card-name">{ed.name}</span>
                <span className="ayah-action-sheet__tafsir-chip-level">{levelLabel(ed.level)}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  const active = editions.find((e) => e.id === editionId) ?? editions[0]!;

  return (
    <div className="ayah-action-sheet__tafsir" data-testid="tafsir-tab-panel">
      <button
        type="button"
        className="ayah-action-sheet__tafsir-back"
        onClick={() => {
          setView("list");
          setText(null);
        }}
      >
        <ArrowRight size={16} aria-hidden="true" />
        العودة للتفاسير
      </button>
      <p className="ayah-action-sheet__tafsir-chip-label">{active.name}</p>
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
            {fontLabel(scale)}
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
          style={{ fontSize: `${Math.max(1, fontScale)}rem`, lineHeight: 1.75, minHeight: "4.5rem" }}
        >
          {text}
        </p>
      ) : (
        <p className="mm-ayah-bar__status">تعذّر جلب التفسير من المصدر المعتمد.</p>
      )}
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
          <button type="button" onClick={onBookmark}>
            <Bookmark size={18} aria-hidden="true" />
            <span>إشارة</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
