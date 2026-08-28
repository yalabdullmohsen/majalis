import { memo, useEffect, useMemo, useState } from "react";
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

type Depth = "brief" | "extended";

const BRIEF_IDS = ["saadi", "muyassar", "baghawi"] as const;
const EXTENDED_IDS = ["ibn-kathir", "tabari"] as const;

function editionDepth(ed: TafsirRegistryEntry): Depth {
  if ((EXTENDED_IDS as readonly string[]).includes(ed.id) || ed.level === "متقدم") return "extended";
  if ((BRIEF_IDS as readonly string[]).includes(ed.id) || ed.level === "مبتدئ") return "brief";
  if (ed.id === "ibn-kathir") return "extended";
  return ed.level === "متوسط" ? "brief" : "extended";
}

function depthLabel(depth: Depth): string {
  return depth === "brief" ? "مختصر" : "مطول";
}

function pickEdition(editions: TafsirRegistryEntry[], depth: Depth, preferredId?: string): TafsirRegistryEntry | undefined {
  const pool = editions.filter((e) => editionDepth(e) === depth);
  if (preferredId) {
    const hit = pool.find((e) => e.id === preferredId);
    if (hit) return hit;
  }
  const order = depth === "brief" ? BRIEF_IDS : EXTENDED_IDS;
  for (const id of order) {
    const hit = pool.find((e) => e.id === id);
    if (hit) return hit;
  }
  return pool[0];
}

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
  const [depth, setDepth] = useState<Depth>("brief");
  const [editionId, setEditionId] = useState(() => readStoredTafsirEdition());
  const [fontScale, setFontScale] = useState<TafsirFontScale>(() => readStoredTafsirFontScale());
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const briefEdition = useMemo(() => pickEdition(editions, "brief"), [editions]);
  const extendedEdition = useMemo(() => pickEdition(editions, "extended"), [editions]);

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
    setDepth("brief");
    setText(null);
  }, [surah, ayah]);

  useEffect(() => {
    if (!editions.length) {
      onAvailabilityChange(false);
      return;
    }
    const active = pickEdition(editions, depth, editionId);
    if (!active) {
      setText(null);
      onAvailabilityChange(false);
      return;
    }
    if (active.id !== editionId) {
      setEditionId(active.id);
      persistTafsirEdition(active.id);
    }
    const ac = new AbortController();
    setLoading(true);
    void fetchMushafAyahTafsir(surah, ayah, active.id, ac.signal)
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
  }, [surah, ayah, depth, editionId, editions, onAvailabilityChange]);

  const switchDepth = (next: Depth) => {
    const nextEd = pickEdition(editions, next);
    if (!nextEd) return;
    setDepth(next);
    setEditionId(nextEd.id);
    persistTafsirEdition(nextEd.id);
    setText(null);
  };

  if (!editions.length) {
    return (
      <p className="mm-ayah-bar__status">لا يوجد تفسير متاح لهذه الآية حاليًا</p>
    );
  }

  const active = pickEdition(editions, depth, editionId) ?? briefEdition ?? extendedEdition;

  return (
    <div className="ayah-action-sheet__tafsir" data-testid="tafsir-tab-panel">
      <div className="ayah-action-sheet__tafsir-toolbar">
        <div className="mm-search-sheet__tafsir-depth quran-tabbar" role="tablist" aria-label="عمق التفسير">
          <button
            type="button"
            role="tab"
            className={`quran-tab quran-btn--segment${depth === "brief" ? " is-active" : ""}`}
            aria-selected={depth === "brief"}
            disabled={!briefEdition}
            onClick={() => switchDepth("brief")}
          >
            مختصر
          </button>
          <button
            type="button"
            role="tab"
            className={`quran-tab quran-btn--segment${depth === "extended" ? " is-active" : ""}`}
            aria-selected={depth === "extended"}
            disabled={!extendedEdition}
            onClick={() => switchDepth("extended")}
          >
            مطول
          </button>
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
        <p className="ayah-action-sheet__tafsir-chip-label">
          {active.name}
          <span className="ayah-action-sheet__tafsir-chip-level">{depthLabel(depth)}</span>
        </p>
      ) : null}
      <div className="ayah-action-sheet__tafsir-scroll">
        {loading ? (
          <p className="mm-ayah-bar__status" aria-busy="true">
            جاري تحميل التفسير…
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
          <p className="mm-ayah-bar__status">لا يوجد تفسير متاح لهذه الآية حاليًا</p>
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
