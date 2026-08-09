import { useEffect, useMemo, useRef, useState } from "react";
import {
  listSelectableMuezzins,
  previewAdhan,
  stopAdhan,
  type Muezzin,
} from "@/lib/adhan-audio";
import { ADHAN_PATTERNS, type AdhanPatternId } from "@/lib/adhan-patterns";
import "@/styles/components/muezzin-picker.css";

type Props = {
  selected: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** للفجر: اعرض فقط من لديه أذان تثويب مستقل */
  requireFajr?: boolean;
};

export function MuezzinPicker({ selected, onSelect, onClose, requireFajr = false }: Props) {
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [query, setQuery] = useState("");
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const selectable = useMemo(
    () => listSelectableMuezzins({ requireFajr }),
    [requireFajr],
  );

  const filtered = useMemo(() => {
    const q = query.trim();
    if (!q) return selectable;
    return selectable.filter((m) =>
      [m.name, m.mosque, m.origin, m.style].filter(Boolean).join(" ").includes(q),
    );
  }, [selectable, query]);

  const grouped = useMemo(() => {
    const map = new Map<AdhanPatternId, Muezzin[]>();
    for (const p of ADHAN_PATTERNS) map.set(p.id, []);
    for (const m of filtered) {
      const list = map.get(m.patternId) ?? [];
      list.push(m);
      map.set(m.patternId, list);
    }
    return ADHAN_PATTERNS.map((p) => ({
      pattern: p,
      items: map.get(p.id) ?? [],
    })).filter((g) => g.items.length > 0);
  }, [filtered]);

  function clearPreviewTimers() {
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    previewTimerRef.current = null;
    progressTimerRef.current = null;
  }

  useEffect(() => () => {
    stopAdhan();
    clearPreviewTimers();
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
      clearPreviewTimers();
      setPreviewing(null);
      setProgress(0);
      audioRef.current = null;
      return;
    }
    clearPreviewTimers();
    const audio = previewAdhan(m);
    audioRef.current = audio;
    setPreviewing(m.id);
    setProgress(0);
    const started = Date.now();
    const durationMs = 15_000;
    progressTimerRef.current = setInterval(() => {
      const pct = Math.min(100, ((Date.now() - started) / durationMs) * 100);
      setProgress(pct);
    }, 120);
    audio.addEventListener("ended", () => {
      clearPreviewTimers();
      setPreviewing(null);
      setProgress(0);
    }, { once: true });
    previewTimerRef.current = setTimeout(() => {
      setPreviewing((p) => (p === m.id ? null : p));
      setProgress(0);
      clearPreviewTimers();
    }, durationMs);
  }

  function handleSelect(id: string) {
    stopAdhan();
    clearPreviewTimers();
    setPreviewing(null);
    setProgress(0);
    onSelect(id);
    onClose();
  }

  return (
    <div
      className="mzp-overlay"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="mzp-sheet"
        role="dialog"
        aria-modal="true"
        aria-label={requireFajr ? "أذان الفجر بالتثويب" : "اختر نمط الأذان"}
      >
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
              : "اضغط زر التشغيل للمعاينة، ثم اختر النمط المناسب"}
          </p>
          <label className="mzp-search">
            <span className="mzp-search__sr">بحث عن مؤذن</span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث بالاسم أو المسجد أو النمط…"
              className="mzp-search__input"
              autoComplete="off"
            />
          </label>
          {previewing ? (
            <div className="mzp-progress" aria-hidden="true">
              <div className="mzp-progress__bar" style={{ width: `${progress}%` }} />
            </div>
          ) : null}
        </div>

        <div className="mzp-list">
          {grouped.length === 0 ? (
            <p className="mzp-empty">لا نتائج مطابقة للبحث.</p>
          ) : (
            grouped.map(({ pattern, items }) => (
              <div key={pattern.id} className="mzp-pattern-group">
                <div className="mzp-pattern-label">{pattern.label}</div>
                {items.map((m) => {
                  const isSelected = selected === m.id;
                  const isPlaying = previewing === m.id;
                  const meta = [m.mosque, m.origin].filter(Boolean).join(" · ");
                  return (
                    <div
                      key={m.id}
                      className={`mzp-item${isSelected ? " mzp-item--selected" : ""}`}
                    >
                      <button
                        type="button"
                        onClick={() => handlePreview(m)}
                        className={`mzp-preview-btn rounded-full icon-only${isPlaying ? " mzp-preview-btn--playing" : ""}`}
                        aria-label={
                          isPlaying ? "إيقاف معاينة الأذان" : "معاينة الأذان (15 ثانية)"
                        }
                      >
                        {isPlaying ? "⏹" : "▶"}
                      </button>

                      <button
                        type="button"
                        className="mzp-info"
                        onClick={() => handleSelect(m.id)}
                        aria-pressed={isSelected}
                        aria-label={`اختيار ${m.name}`}
                      >
                        <span className="mzp-name">{m.name}</span>
                        <span className="mzp-origin">
                          {meta ? `${meta} · ` : ""}
                          <span className="mzp-style-badge">{m.style}</span>
                        </span>
                      </button>

                      <button
                        type="button"
                        className={`mzp-radio${isSelected ? " mzp-radio--selected" : ""}`}
                        onClick={() => handleSelect(m.id)}
                        aria-label={isSelected ? `مختار: ${m.name}` : `اختيار ${m.name}`}
                        aria-pressed={isSelected}
                      >
                        {isSelected ? <span className="mzp-check">✓</span> : null}
                      </button>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className="mzp-footer">
          <button type="button" className="mzp-close" onClick={onClose}>
            إغلاق
          </button>
        </div>
      </div>
    </div>
  );
}
