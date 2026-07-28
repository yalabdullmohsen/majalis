/**
 * لوحة تحكّم التكرار والحفظ — تربط setLoopConfig الموجود في useAyahPlayer.
 */
import { useState } from "react";
import { Repeat, EyeOff, Eye, Play } from "lucide-react";
import type { AyahLoopConfig } from "@/lib/ayah-loop-controller";

type Props = {
  currentAyah: number;
  totalAyahs: number;
  /** أول/آخر آية في الصفحة الحالية ضمن السورة النشطة (اختياري) */
  pageRange?: { start: number; end: number } | null;
  loopConfig: AyahLoopConfig | null;
  onSetLoop: (cfg: Partial<AyahLoopConfig> & { startAyah: number; infinite?: boolean } | null) => void;
  onPlayFrom: (ayah: number) => void;
  hideVerseTest: boolean;
  onToggleHideVerse: () => void;
};

const REPEAT_PRESETS = [
  { label: "٣×", value: 3 },
  { label: "٥×", value: 5 },
  { label: "٧×", value: 7 },
  { label: "∞", value: 0 },
] as const;

const DELAY_PRESETS = [
  { label: "بلا توقف", value: 0 },
  { label: "٢ ث", value: 2000 },
  { label: "٥ ث", value: 5000 },
  { label: "١٠ ث", value: 10000 },
] as const;

export function MemorizationLoopPanel({
  currentAyah,
  totalAyahs,
  pageRange,
  loopConfig,
  onSetLoop,
  onPlayFrom,
  hideVerseTest,
  onToggleHideVerse,
}: Props) {
  const [mode, setMode] = useState<"ayah" | "range" | "page">("ayah");
  const [startAyah, setStartAyah] = useState(currentAyah);
  const [endAyah, setEndAyah] = useState(Math.min(totalAyahs, currentAyah + 2));
  const [repeatCount, setRepeatCount] = useState(3);
  const [delayMs, setDelayMs] = useState(2000);

  const apply = () => {
    let start = startAyah;
    let end = endAyah;
    if (mode === "ayah") {
      start = currentAyah;
      end = currentAyah;
    } else if (mode === "page" && pageRange) {
      start = pageRange.start;
      end = pageRange.end;
    }
    onSetLoop({
      startAyah: start,
      endAyah: end,
      repeatCount: repeatCount === 0 ? 0 : repeatCount,
      infinite: repeatCount === 0,
      delayMs,
    });
    onPlayFrom(start);
  };

  const clear = () => onSetLoop(null);

  const active = Boolean(loopConfig);

  return (
    <div className="mlp-panel">
      <div className="mlp-panel__head">
        <Repeat size={15} aria-hidden="true" />
        <strong>تكرار الحفظ</strong>
        {active && (
          <span className="mlp-panel__badge">
            {loopConfig!.startAyah}
            {loopConfig!.endAyah !== loopConfig!.startAyah ? `–${loopConfig!.endAyah}` : ""}
            {" · "}
            {!Number.isFinite(loopConfig!.repeatCount) ? "∞" : `${loopConfig!.repeatCount}×`}
          </span>
        )}
      </div>

      <div className="mlp-row" role="tablist" aria-label="نطاق التكرار">
        {(
          [
            { id: "ayah" as const, label: "آية واحدة" },
            { id: "range" as const, label: "نطاق" },
            { id: "page" as const, label: "الصفحة", disabled: !pageRange },
          ]
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            role="tab"
            disabled={m.disabled}
            className={`mlp-chip${mode === m.id ? " is-active" : ""}`}
            onClick={() => setMode(m.id)}
          >
            {m.label}
          </button>
        ))}
      </div>

      {mode === "range" && (
        <div className="mlp-range">
          <label>
            من
            <input
              type="number"
              min={1}
              max={totalAyahs}
              value={startAyah}
              onChange={(e) => setStartAyah(Number(e.target.value) || 1)}
            />
          </label>
          <label>
            إلى
            <input
              type="number"
              min={1}
              max={totalAyahs}
              value={endAyah}
              onChange={(e) => setEndAyah(Number(e.target.value) || 1)}
            />
          </label>
        </div>
      )}

      <div className="mlp-row" aria-label="عدد التكرار">
        {REPEAT_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`mlp-chip${repeatCount === p.value ? " is-active" : ""}`}
            onClick={() => setRepeatCount(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mlp-row" aria-label="فاصل صامت">
        {DELAY_PRESETS.map((p) => (
          <button
            key={p.label}
            type="button"
            className={`mlp-chip${delayMs === p.value ? " is-active" : ""}`}
            onClick={() => setDelayMs(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      <div className="mlp-actions">
        <button type="button" className="mlp-btn mlp-btn--primary" onClick={apply}>
          <Play size={14} aria-hidden="true" />
          ابدأ التكرار
        </button>
        {active && (
          <button type="button" className="mlp-btn" onClick={clear}>
            إيقاف التكرار
          </button>
        )}
        <button
          type="button"
          className={`mlp-btn${hideVerseTest ? " is-active" : ""}`}
          onClick={onToggleHideVerse}
          aria-pressed={hideVerseTest}
        >
          {hideVerseTest ? <Eye size={14} aria-hidden="true" /> : <EyeOff size={14} aria-hidden="true" />}
          {hideVerseTest ? "إظهار النص" : "وضع الاختبار"}
        </button>
      </div>
      <p className="mlp-hint">
        وضع الاختبار يخفي نص الآيات حتى النقر عليها — مناسب لاختبار الحفظ مع فاصل صامت للتسميع.
      </p>
    </div>
  );
}

export default MemorizationLoopPanel;
