/**
 * لوحة الترديد والتعليم — صمت بعد المقرئ ليردّ الطالب.
 */
import { GraduationCap } from "lucide-react";
import type { TeachRepeatConfig } from "@/lib/teach-repeat-controller";

type Props = {
  config: TeachRepeatConfig;
  phase: "idle" | "teacher" | "student-pause";
  onChange: (patch: Partial<TeachRepeatConfig>) => void;
  onSkipPause?: () => void;
};

const PAUSE_PRESETS = [
  { label: "٢ ث", value: 2000 },
  { label: "٤ ث", value: 4000 },
  { label: "٦ ث", value: 6000 },
  { label: "١٠ ث", value: 10000 },
] as const;

export function ReciteRepeatPanel({ config, phase, onChange, onSkipPause }: Props) {
  return (
    <div className="rrp-panel">
      <div className="rrp-panel__head">
        <GraduationCap size={15} aria-hidden="true" />
        <strong>الترديد والتعليم</strong>
        {config.enabled && <span className="rrp-panel__badge">نشط</span>}
      </div>

      <button
        type="button"
        className={`rrp-toggle${config.enabled ? " is-active" : ""}`}
        aria-pressed={config.enabled}
        onClick={() => onChange({ enabled: !config.enabled })}
      >
        {config.enabled ? "إيقاف وضع الترديد" : "تفعيل: المقرئ ثم صمت الطالب"}
      </button>

      {config.enabled && (
        <>
          <div className="rrp-row" role="group" aria-label="مدة صمت الطالب">
            {PAUSE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={`rrp-chip${config.studentPauseMs === p.value ? " is-active" : ""}`}
                onClick={() => onChange({ studentPauseMs: p.value })}
              >
                {p.label}
              </button>
            ))}
          </div>

          <label className="rrp-check">
            <input
              type="checkbox"
              checked={config.replayTeacher}
              onChange={(e) => onChange({ replayTeacher: e.target.checked })}
            />
            إعادة تلاوة المقرئ بعد ترديد الطالب
          </label>

          {phase === "student-pause" && (
            <div className="rrp-pause-banner" role="status">
              <span>دورك الآن — ردّد الآية</span>
              {onSkipPause && (
                <button type="button" className="rrp-chip is-active" onClick={onSkipPause}>
                  سمّعتُ ←
                </button>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default ReciteRepeatPanel;
