import { useEffect, useMemo, useRef, useState } from "react";
import {
  listSelectableMuezzins,
  previewAdhan,
  stopAdhan,
  type Muezzin,
} from "@/lib/adhan-audio";
import { ADHAN_PATTERNS, type AdhanPatternId } from "@/lib/adhan-patterns";
import "@/styles/components/muezzin-picker.css";

const STYLE_MOD: Record<string, string> = {
  مكي: "mzp-style--emerald",
  مدني: "mzp-style--blue",
  الأقصى: "mzp-style--purple",
  مصري: "mzp-style--emerald",
  شامي: "mzp-style--blue",
  تركي: "mzp-style--purple",
};

type Props = {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** للفجر: اعرض فقط من لديه أذان تثويب مستقل */
  requireFajr?: boolean;
};

export function MuezzinPicker({ selected, onSelect, onClose, requireFajr = false }: Props) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const selectable = useMemo(
    () => listSelectableMuezzins({ requireFajr }),
    [requireFajr],
  );

  const grouped = useMemo(() => {
    const map = new Map<AdhanPatternId, Muezzin[]>();
    for (const p of ADHAN_PATTERNS) map.set(p.id, []);
    for (const m of selectable) {
      const list = map.get(m.patternId) ?? [];
      list.push(m);
      map.set(m.patternId, list);
    }
    return ADHAN_PATTERNS.map((p) => ({
      pattern: p,
      items: map.get(p.id) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [selectable]);

  useEffect(() => () => {
    stopAdhan();
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
  }, []);

  useEffect(() => {
    const keyHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [onClose]);

  function handlePreview(m: Muezzin) {
    if (previewing === m.id) {
      stopAdhan();
      setPreviewing(null);
      return;
    }
    const audio = previewAdhan(m);
    setPreviewing(m.id);
    audio.addEventListener("ended", () => setPreviewing(null), { once: true });
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(
      () => setPreviewing((p) => (p === m.id ? null : p)),
      16_000,
    );
  }

  function handleSelect(id: string) {
    stopAdhan();
    setPreviewing(null);
    onSelect(id);
    onClose();
  }

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
    <div className="mzp-overlay" onClick={onClose}>
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="mzp-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="mzp-handle-row">
          <div className="mzp-handle" />
        </div>

        <div className="mzp-header">
          <h3 className="mzp-title">
            {requireFajr ? "أذان الفجر (بالتثويب)" : "اختر نمط الأذان"}
          </h3>
          <p className="mzp-subtitle">
            {requireFajr
              ? "يُعرض فقط من لديه «الصلاة خير من النوم» — بلا استبدال بالأذان العام"
              : "اضغط ▶ للمعاينة • النسبة الشخصية لا تُعرض إلا بعد التثبّت"}
          </p>
        </div>

        <div className="mzp-list">
          {grouped.map(({ pattern, items }) => (
            <div key={pattern.id} className="mzp-pattern-group">
              <div className="mzp-pattern-label">{pattern.label}</div>
              {items.map((m) => {
                const isSelected = selected === m.id;
                const isPlaying = previewing === m.id;
                const styleMod = STYLE_MOD[m.style] ?? "";
                const meta = [m.mosque, m.origin].filter(Boolean).join(" · ");
                return (
                  <div
                    key={m.id}
                    className={`mzp-item${isSelected ? " mzp-item--selected" : ""}`}
                    onClick={() => handleSelect(m.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                    aria-label={`اختيار ${m.name}`}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault();
                        handleSelect(m.id);
                      }
                    }}
                  >
                    <div className={`mzp-radio${isSelected ? " mzp-radio--selected" : ""}`}>
                      {isSelected && <span className="mzp-check">✓</span>}
                    </div>

                    <div className="mzp-info">
                      <div className="mzp-name">{m.name}</div>
                      <div className="mzp-origin">
                        {meta}
                        <span className={`mzp-style-badge ${styleMod}`}>{m.style}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePreview(m);
                      }}
                      className={`mzp-preview-btn${isPlaying ? " mzp-preview-btn--playing" : ""}`}
                      aria-label={
                        isPlaying ? "إيقاف معاينة الأذان" : "معاينة الأذان (15 ثانية)"
                      }
                    >
                      {isPlaying ? "⏹" : "▶"}
                    </button>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
