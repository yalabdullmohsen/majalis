import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Check, Search } from "lucide-react";
import { AppBottomSheet } from "@/components/ui/AppBottomSheet";
import {
  ensureValidReciterPreference,
  getSelectableReciters,
  type ReciterSelectMode,
} from "@/lib/quran-audio";
import {
  MUSHAF_TAFSIR_EDITIONS,
  type MushafTafsirEdition,
} from "@/features/mushaf/tafsir-editions";
import { tolerantIncludes } from "@/features/search/tolerant-match";
import "@/styles/components/reciter-picker-sheet.css";

export type MushafReaderOptionsSection = "tafsir" | "reciters" | "tafsir-audio";

type TafsirAudioOption = {
  id: string;
  label: string;
  description: string;
};

type Props = {
  open: boolean;
  onClose: () => void;
  /** قسم يُمرَّر للتمرير عند الفتح */
  focusSection?: MushafReaderOptionsSection;
  tafsirEditionId?: string;
  onSelectTafsir?: (id: string) => void;
  reciterId?: string;
  onSelectReciter?: (id: string) => void;
  reciterMode?: ReciterSelectMode;
  tafsirAudioOptions?: TafsirAudioOption[];
  tafsirAudioId?: string | null;
  onSelectTafsirAudio?: (id: string) => void;
  tafsirAudioLoading?: boolean;
  tafsirAudioError?: boolean;
  onRetryTafsirAudio?: () => void;
};

type Row = {
  id: string;
  name: string;
  description: string;
  active: boolean;
  onPick: () => void;
};

function sectionFontScale(S: number) {
  return Math.max(11, Math.round(S * 0.42));
}

/**
 * شيت موحّد: التفسير · القرّاء · التلاوة الصوتية (تفسير صوتي).
 * بحث متسامح · المختار مثبت أعلى كل قسم · تطبيق فوري · إغلاق سفلي.
 */
export function MushafReaderOptionsSheet({
  open,
  onClose,
  focusSection = "reciters",
  tafsirEditionId,
  onSelectTafsir,
  reciterId,
  onSelectReciter,
  reciterMode = "ayah",
  tafsirAudioOptions = [],
  tafsirAudioId = null,
  onSelectTafsirAudio,
  tafsirAudioLoading = false,
  tafsirAudioError = false,
  onRetryTafsirAudio,
}: Props) {
  const [query, setQuery] = useState("");
  const listRef = useRef<HTMLDivElement>(null);
  const S = 24;
  const descPx = sectionFontScale(S);

  const reciters = getSelectableReciters(reciterMode);

  const match = (hay: string) => {
    const q = query.trim();
    if (!q) return true;
    return tolerantIncludes(hay, q) || hay.includes(q);
  };

  const tafsirRows: Row[] = useMemo(() => {
    if (!onSelectTafsir) return [];
    return MUSHAF_TAFSIR_EDITIONS.filter((ed) =>
      match(`${ed.label} ${ed.author} ${ed.level}`),
    ).map((ed: MushafTafsirEdition) => ({
      id: ed.id,
      name: ed.label,
      description: `${ed.author} · ${ed.level}`,
      active: ed.id === tafsirEditionId,
      onPick: () => onSelectTafsir(ed.id),
    }));
  }, [onSelectTafsir, tafsirEditionId, query]);

  const reciterRows: Row[] = useMemo(() => {
    if (!onSelectReciter || !reciterId) return [];
    return reciters
      .filter((r) => match(`${r.nameAr} ${r.riwaya} ${r.id}`))
      .map((r) => ({
        id: r.id,
        name: r.nameAr,
        description: `${r.riwaya} · ${r.qualityLabel}`,
        active: r.id === reciterId,
        onPick: () => {
          onSelectReciter(r.id);
          void ensureValidReciterPreference();
        },
      }));
  }, [onSelectReciter, reciterId, reciters, query]);

  const audioRows: Row[] = useMemo(() => {
    if (!onSelectTafsirAudio) return [];
    return tafsirAudioOptions
      .filter((o) => match(`${o.label} ${o.description}`))
      .map((o) => ({
        id: o.id,
        name: o.label,
        description: o.description,
        active: o.id === tafsirAudioId,
        onPick: () => onSelectTafsirAudio(o.id),
      }));
  }, [onSelectTafsirAudio, tafsirAudioId, tafsirAudioOptions, query]);

  const pinActive = (rows: Row[]) => {
    const active = rows.filter((r) => r.active);
    const rest = rows.filter((r) => !r.active);
    return [...active, ...rest];
  };

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => {
      const sel =
        listRef.current?.querySelector<HTMLElement>(
          `[data-section="${focusSection}"] .mros-item.is-active`,
        ) || listRef.current?.querySelector<HTMLElement>(`.mros-item.is-active`);
      sel?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }, 80);
    return () => window.clearTimeout(id);
  }, [open, focusSection, tafsirEditionId, reciterId, tafsirAudioId]);

  const renderSection = (
    key: MushafReaderOptionsSection,
    title: string,
    rows: Row[],
    empty: ReactNode,
  ) => (
    <section className="mros-section" data-section={key} aria-label={title}>
      <h3 className="mros-section__title">{title}</h3>
      {rows.length === 0 ? (
        empty
      ) : (
        <ul className="mros-list" role="listbox" aria-label={title}>
          {pinActive(rows).map((row) => (
            <li key={row.id}>
              <button
                type="button"
                role="option"
                aria-selected={row.active}
                className={`mros-item${row.active ? " is-active" : ""}`}
                onClick={() => {
                  row.onPick();
                }}
              >
                <span className="mros-item__text">
                  <span className="mros-item__name">{row.name}</span>
                  <span className="mros-item__desc" style={{ fontSize: `${descPx}px` }}>
                    {row.description}
                  </span>
                  {row.active ? (
                    <span className="mros-item__badge">المختار حالياً</span>
                  ) : null}
                </span>
                {row.active ? (
                  <Check size={18} aria-hidden="true" className="mros-item__check" />
                ) : (
                  <span className="mros-item__check-slot" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <AppBottomSheet
      open={open}
      onClose={() => {
        setQuery("");
        onClose();
      }}
      title="التفسير والقرّاء"
      snap="full"
      elevated
      className="reciter-picker-sheet mros-sheet"
      closeLabel="إغلاق"
    >
      <label className="reciter-picker-sheet__search mros-search">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث في التفسير أو القرّاء…"
          enterKeyHint="search"
          autoComplete="off"
          aria-label="بحث في قائمة التفسير والقرّاء"
        />
      </label>

      <div className="mros-body" ref={listRef}>
        {onSelectTafsir
          ? renderSection(
              "tafsir",
              "التفسير",
              tafsirRows,
              <p className="mros-empty" role="status">
                لا نتائج مطابقة في التفاسير.
              </p>,
            )
          : null}

        {onSelectReciter
          ? renderSection(
              "reciters",
              "القرّاء",
              reciterRows,
              <p className="mros-empty" role="status">
                لا نتائج مطابقة في القرّاء.
              </p>,
            )
          : null}

        {onSelectTafsirAudio || tafsirAudioLoading || tafsirAudioError
          ? renderSection(
              "tafsir-audio",
              "التلاوة الصوتية",
              audioRows,
              tafsirAudioLoading ? (
                <div className="mros-skel" aria-label="تجهيز المحتوى" aria-busy="true">
                  <span />
                  <span />
                  <span />
                </div>
              ) : tafsirAudioError ? (
                <div className="mros-empty mros-empty--error" role="alert">
                  <p>تعذّر تحميل كتالوج التفسير الصوتي.</p>
                  {onRetryTafsirAudio ? (
                    <button type="button" className="mros-retry" onClick={onRetryTafsirAudio}>
                      إعادة المحاولة
                    </button>
                  ) : null}
                </div>
              ) : (
                <p className="mros-empty" role="status">
                  لا يتوفر تفسير صوتي في الكتالوج حالياً
                  {query.trim() ? " مطابقاً للبحث" : ""}.
                </p>
              ),
            )
          : null}
      </div>
    </AppBottomSheet>
  );
}

/** توافق خلفي مع الاسم السابق */
export function ReciterPickerSheet(
  props: Omit<Props, "onSelectReciter" | "reciterId"> & {
    reciterId: string;
    onSelect: (id: string) => void;
    mode?: ReciterSelectMode;
  },
) {
  const { onSelect, mode, ...rest } = props;
  return (
    <MushafReaderOptionsSheet
      {...rest}
      focusSection="reciters"
      onSelectReciter={onSelect}
      reciterMode={mode}
    />
  );
}
