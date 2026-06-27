import type { QuranReciter } from "@/lib/quran-reciters";

type Props = {
  reciters: QuranReciter[];
  selectedId: string;
  onSelect: (id: string) => void;
  open: boolean;
  onClose: () => void;
};

export function ReciterPicker({ reciters, selectedId, onSelect, open, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="quran-v2-sheet-backdrop" onClick={onClose} role="presentation">
      <div
        className="quran-v2-sheet"
        role="dialog"
        aria-modal="true"
        aria-label="اختيار القارئ"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="quran-v2-sheet__head">
          <h3>اختر القارئ</h3>
          <button type="button" className="quran-v2-sheet__close" onClick={onClose} aria-label="إغلاق">×</button>
        </header>
        <div className="quran-v2-reciter-grid">
          {reciters.map((r) => {
            const active = r.id === selectedId;
            return (
              <button
                key={r.id}
                type="button"
                className={`quran-v2-reciter-card${active ? " is-active" : ""}`}
                onClick={() => { onSelect(r.id); onClose(); }}
              >
                <div className="quran-v2-reciter-card__avatar" aria-hidden>{r.name.slice(0, 2)}</div>
                <div className="quran-v2-reciter-card__body">
                  <strong>{r.name}</strong>
                  <span>{r.qualities[0]?.label || "جودة عالية"} · {r.qualities[0]?.bitrate || "128 kbps"}</span>
                  <span className="quran-v2-reciter-card__meta">مصحف كامل · mp3quran</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
