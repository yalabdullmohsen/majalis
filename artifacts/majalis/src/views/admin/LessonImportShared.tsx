import { useState } from "react";
import { GOVERNORATES } from "@/lib/theme";
import { FIELD_LABELS, EMPTY_PARSED, type DebugLog, type ParsedLessonFields } from "@/lib/lesson-import-api";

export const CATEGORIES = ["\u062a\u0641\u0633\u064a\u0631", "\u0641\u0642\u0647", "\u0639\u0642\u064a\u062f\u0629", "\u062d\u062f\u064a\u062b", "\u0633\u064a\u0631\u0629", "\u062a\u062c\u0648\u064a\u062f", "\u0623\u062e\u0631\u0649"];
export const VENUE_TYPES = ["\u0645\u0633\u062c\u062f", "\u0645\u062c\u0644\u0633", "\u062f\u064a\u0648\u0627\u0646", "\u0645\u0632\u0631\u0639\u0629", "\u0627\u0633\u062a\u0631\u0627\u062d\u0629", "\u0645\u0631\u0643\u0632", "\u062c\u0627\u0645\u0639\u0629", "\u0623\u062e\u0631\u0649"] as const;
export const WEEK_DAYS = ["\u0627\u0644\u0633\u0628\u062a", "\u0627\u0644\u0623\u062d\u062f", "\u0627\u0644\u0627\u062b\u0646\u064a\u0646", "\u0627\u0644\u062b\u0644\u0627\u062b\u0627\u0621", "\u0627\u0644\u0623\u0631\u0628\u0639\u0627\u0621", "\u0627\u0644\u062e\u0645\u064a\u0633", "\u0627\u0644\u062c\u0645\u0639\u0629"] as const;

export const inputStyle: React.CSSProperties = {};
export const labelStyle: React.CSSProperties = {};

export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const bg = pct >= 75 ? "#D1FAE5" : pct >= 45 ? "rgba(14,110,82,0.08)" : "#FEE2E2";
  const color = pct >= 75 ? "var(--majalis-emerald-deep)" : pct >= 45 ? "#0E6E52" : "#991B1B";
  return (
    <span
      className="lis-conf-badge"
      style={{ "--lis-cb-bg": bg, "--lis-cb-color": color } as React.CSSProperties}
    >
      \u062b\u0642\u0629 \u0627\u0644\u0627\u0633\u062a\u062e\u0631\u0627\u062c: {pct}%
    </span>
  );
}

export function MissingBadge({ fields }: { fields: string[] }) {
  if (!fields.length) {
    return (
      <span
        className="lis-missing-badge"
        style={{ "--lis-mb-bg": "#D1FAE5", "--lis-mb-color": "var(--majalis-emerald-deep)" } as React.CSSProperties}
      >
        \u2713 \u0627\u0644\u0628\u064a\u0627\u0646\u0627\u062a \u0627\u0644\u0623\u0633\u0627\u0633\u064a\u0629 \u0645\u0643\u062a\u0645\u0644\u0629
      </span>
    );
  }
  return (
    <span
      className="lis-missing-badge"
      style={{ "--lis-mb-bg": "#FEE2E2", "--lis-mb-color": "#991B1B" } as React.CSSProperties}
    >
      \u2717 \u062a\u062d\u062a\u0627\u062c \u0645\u0631\u0627\u062c\u0639\u0629: {fields.map((f) => FIELD_LABELS[f] || f).join("\u060c ")}
    </span>
  );
}

const KEY_FIELDS_SHARED = ["title", "speaker_name", "day_of_week", "lesson_time", "mosque", "city"] as const;

export function FieldStatusGrid({
  parsed,
  fieldConfidence,
  failureReasons,
}: {
  parsed: ParsedLessonFields;
  fieldConfidence: Record<string, number>;
  failureReasons: Record<string, string>;
}) {
  return (
    <div className="lis-field-grid">
      {KEY_FIELDS_SHARED.map((field) => {
        const val = String((parsed as Record<string, unknown>)[field] || "").trim();
        const conf = fieldConfidence[field] ?? (val ? 1 : 0);
        const reason = failureReasons[field];
        const isOk = val && conf >= 0.5;
        const isWarn = val && conf < 0.5;
        const isMissing = !val;
        const bg = isOk ? "#D1FAE5" : isWarn ? "rgba(14,110,82,0.08)" : "#FEE2E2";
        const color = isOk ? "var(--majalis-emerald-deep)" : isWarn ? "#0E6E52" : "#991B1B";
        const icon = isOk ? "\u2713" : isWarn ? "\u26a0" : "\u2717";
        return (
          <div
            key={field}
            className="lis-field-cell"
            style={{ "--lis-fc-bg": bg, "--lis-fc-border": color + "30", "--lis-fc-color": color } as React.CSSProperties}
            title={reason || val || "\u063a\u064a\u0631 \u0645\u0648\u062c\u0648\u062f"}
          >
            <div className="lis-field-icon">{icon} {FIELD_LABELS[field] || field}</div>
            <div className="lis-field-value">
              {isMissing ? (reason || "\u0644\u0645 \u064a\u064f\u0633\u062a\u062e\u0631\u062c") : val}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function DebugLogPanel({ log }: { log: DebugLog }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="lis-debug-panel">
      <button type="button" onClick={() => setOpen((o) => !o)} className="lis-debug-btn">
        <span>\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0627\u0633\u062a\u062e\u0631\u0627\u062c (Debug) \u2014 {log.total_ms ?? 0} ms</span>
        <span>{open ? "\u25b2" : "\u25bc"}</span>
      </button>
      {open && (
        <div className="lis-debug-content">
          {log.stages.map((s, i) => (
            <div
              key={i}
              className="lis-debug-stage"
              style={{ "--lis-ds-bg": s.ok === false ? "#FEE2E2" : "#fff" } as React.CSSProperties}
            >
              <strong>{s.stage}</strong>
              {s.ms != null && <span className="lis-debug-ms">({s.ms}ms)</span>}
              {s.error && <span className="lis-debug-err"> \u2717 {s.error}</span>}
              {s.fields_found?.length ? <div className="lis-debug-found">\u2713 {s.fields_found.join(", ")}</div> : null}
              {s.fields_missing?.length ? <div className="lis-debug-missing">\u2717 missing: {s.fields_missing.join(", ")}</div> : null}
              {s.fields_recovered?.length ? <div className="lis-debug-recovered">\u2191 recovered: {s.fields_recovered.join(", ")}</div> : null}
              {s.fields_filled?.length ? <div className="lis-debug-filled">DB: {s.fields_filled.join(", ")}</div> : null}
              {s.raw_confidence != null && <div className="lis-debug-conf">confidence: {Math.round(s.raw_confidence * 100)}%</div>}
            </div>
          ))}
          {log.raw_ocr_text && (
            <details className="lis-debug-ocr lis-debug-ocr--mt">
              <summary>raw_ocr_text</summary>
              <pre>{log.raw_ocr_text}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function PlatformBadge({ label }: { label: string }) {
  return <span className="lis-platform-badge">{label}</span>;
}

export function DuplicateBadge({ message }: { message?: string }) {
  if (!message) return null;
  return <span className="lis-duplicate-badge">{message}</span>;
}

export function LessonImportForm({
  parsed,
  onChange,
  disabled,
}: {
  parsed: ParsedLessonFields;
  onChange: (next: ParsedLessonFields) => void;
  disabled?: boolean;
}) {
  const set = (key: keyof ParsedLessonFields, value: unknown) => {
    onChange({ ...parsed, [key]: value });
  };

  return (
    <div className="lis-form-grid">
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.title}</label>
        <input className="lis-input" value={parsed.title || ""} disabled={disabled} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.speaker_name}</label>
        <input className="lis-input" value={parsed.speaker_name || ""} disabled={disabled} onChange={(e) => set("speaker_name", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.gregorian_date}</label>
        <input type="date" className="lis-input" value={parsed.gregorian_date || parsed.start_date || ""} disabled={disabled} onChange={(e) => { set("gregorian_date", e.target.value); set("start_date", e.target.value); }} />
      </div>
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.day_of_week} (\u0627\u062e\u062a\u0631 \u064a\u0648\u0645\u064b\u0627 \u0623\u0648 \u0623\u0643\u062b\u0631)</label>
        <div className="lis-days-row">
          {WEEK_DAYS.map(d => {
            const selected = (parsed.day_of_week || "").split("\u060c").map(x => x.trim()).includes(d);
            return (
              <label
                key={d}
                className={`lis-day-label${disabled ? " lis-day-label--disabled" : ""}`}
                style={{
                  "--lis-dl-fw": selected ? 700 : 400,
                  "--lis-dl-color": selected ? "var(--majalis-emerald-deep)" : "inherit",
                } as React.CSSProperties}
              >
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected}
                  onChange={e => {
                    const cur = (parsed.day_of_week || "").split("\u060c").map(x => x.trim()).filter(Boolean);
                    const next = e.target.checked ? [...cur, d] : cur.filter(x => x !== d);
                    set("day_of_week", next.join("\u060c"));
                  }}
                  className="lis-day-checkbox"
                />
                {d}
              </label>
            );
          })}
        </div>
        {(parsed.day_of_week || "").includes("\u060c") && (
          <div className="lis-days-note">
            \u064a\u062a\u0643\u0631\u0631 \u0643\u0644: {(parsed.day_of_week || "").split("\u060c").join(" \u0648")}
          </div>
        )}
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.lesson_time}</label>
        <input className="lis-input" value={parsed.lesson_time || ""} disabled={disabled} onChange={(e) => set("lesson_time", e.target.value)} placeholder="\u0645\u062b\u0644: \u0628\u0639\u062f \u0627\u0644\u0639\u0634\u0627\u0621" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.venue_type}</label>
        <select className="lis-select" value={parsed.venue_type || "\u0645\u0633\u062c\u062f"} disabled={disabled} onChange={(e) => set("venue_type", e.target.value)}>
          {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.mosque}</label>
        <input className="lis-input" value={parsed.mosque || ""} disabled={disabled} onChange={(e) => set("mosque", e.target.value)} placeholder={parsed.venue_type === "\u062f\u064a\u0648\u0627\u0646" ? "\u062f\u064a\u0648\u0627\u0646 \u0622\u0644 \u0641\u0644\u0627\u0646" : parsed.venue_type === "\u0645\u062c\u0644\u0633" ? "\u0645\u062c\u0644\u0633 \u0627\u0644\u0634\u064a\u062e \u0641\u0644\u0627\u0646" : "\u0627\u0633\u0645 \u0627\u0644\u0645\u0643\u0627\u0646"} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.region}</label>
        <input className="lis-input" value={parsed.region || ""} disabled={disabled} onChange={(e) => set("region", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.city}</label>
        <select className="lis-select" value={parsed.city || "\u0627\u0644\u0639\u0627\u0635\u0645\u0629"} disabled={disabled} onChange={(e) => set("city", e.target.value)}>
          {GOVERNORATES.map((g) => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.country}</label>
        <input className="lis-input" value={parsed.country || "\u0627\u0644\u0643\u0648\u064a\u062a"} disabled={disabled} onChange={(e) => set("country", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.category}</label>
        <select className="lis-select" value={parsed.category || ""} disabled={disabled} onChange={(e) => set("category", e.target.value)}>
          <option value="">\u2014</option>
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.organizer}</label>
        <input className="lis-input" value={parsed.organizer || ""} disabled={disabled} onChange={(e) => set("organizer", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.cooperative_org}</label>
        <input className="lis-input" value={parsed.cooperative_org || ""} disabled={disabled} onChange={(e) => set("cooperative_org", e.target.value)} />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.phone}</label>
        <input className="lis-input" value={parsed.phone || ""} disabled={disabled} onChange={(e) => set("phone", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.live_url}</label>
        <input className="lis-input" value={parsed.live_url || ""} disabled={disabled} onChange={(e) => set("live_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.registration_url}</label>
        <input className="lis-input" value={parsed.registration_url || ""} disabled={disabled} onChange={(e) => set("registration_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.maps_url}</label>
        <input className="lis-input" value={parsed.maps_url || ""} disabled={disabled} onChange={(e) => set("maps_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label className="lis-label">{FIELD_LABELS.slug}</label>
        <input className="lis-input" value={parsed.slug || ""} disabled={disabled} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
      </div>
      <div className="lis-checkbox-row">
        <input type="checkbox" checked={Boolean(parsed.has_live_stream)} disabled={disabled} onChange={(e) => set("has_live_stream", e.target.checked)} id="has-live" />
        <label htmlFor="has-live" className="lis-label lis-label--inline">{FIELD_LABELS.has_live_stream}</label>
      </div>
      <div className="lis-checkbox-row">
        <input type="checkbox" checked={Boolean(parsed.has_women_section)} disabled={disabled} onChange={(e) => set("has_women_section", e.target.checked)} id="has-women" />
        <label htmlFor="has-women" className="lis-label lis-label--inline">{FIELD_LABELS.has_women_section}</label>
      </div>
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.keywords}</label>
        <input
          className="lis-input"
          value={(parsed.keywords || []).join("\u060c ")}
          disabled={disabled}
          onChange={(e) => set("keywords", e.target.value.split(/[\u060c,]/).map((s) => s.trim()).filter(Boolean))}
          placeholder="\u0643\u0644\u0645\u0627\u062a \u0645\u0641\u062a\u0627\u062d\u064a\u0629 \u0645\u0641\u0635\u0648\u0644\u0629 \u0628\u0641\u0627\u0635\u0644\u0629"
        />
      </div>
      <div className="lis-full-col">
        <label className="lis-label">{FIELD_LABELS.description}</label>
        <textarea
          className="lis-textarea"
          value={parsed.description || ""}
          disabled={disabled}
          onChange={(e) => set("description", e.target.value)}
        />
      </div>
    </div>
  );
}

export type LessonImportReviewProps = {
  parsed: ParsedLessonFields;
  onParsedChange: (next: ParsedLessonFields) => void;
  busy: boolean;
  draftId: string | null;
  imageUrl: string | null;
  sourceUrl?: string | null;
  extractedText: string;
  confidence: number;
  missingFields: string[];
  warnings: { field: string; message: string }[];
  sheikhHint: string;
  platformLabel?: string;
  duplicateMessage?: string;
  fieldConfidence?: Record<string, number>;
  failureReasons?: Record<string, string>;
  debugLog?: DebugLog | null;
  onApprove: () => void;
  onSaveDraft: () => void;
  onReject: () => void;
  onReExtract?: () => void;
  reExtractLabel?: string;
};

export function LessonImportReviewPanel({
  parsed,
  onParsedChange,
  busy,
  draftId,
  imageUrl,
  sourceUrl,
  extractedText,
  confidence,
  missingFields,
  warnings,
  sheikhHint,
  platformLabel,
  duplicateMessage,
  fieldConfidence = {},
  failureReasons = {},
  debugLog,
  onApprove,
  onSaveDraft,
  onReject,
  onReExtract,
  reExtractLabel = "\u0625\u0639\u0627\u062f\u0629 \u0627\u0633\u062a\u062e\u0631\u0627\u062c",
}: LessonImportReviewProps) {
  return (
    <>
      <div className="lis-badges-row">
        <ConfidenceBadge score={confidence} />
        <MissingBadge fields={missingFields} />
        {platformLabel && <PlatformBadge label={platformLabel} />}
        <DuplicateBadge message={duplicateMessage} />
        {sheikhHint && <span className="lis-hint-badge">{sheikhHint}</span>}
      </div>

      <FieldStatusGrid parsed={parsed} fieldConfidence={fieldConfidence} failureReasons={failureReasons} />
      {debugLog && <DebugLogPanel log={debugLog} />}

      <div className="lis-review-grid">
        <section className="lis-panel">
          <h3 className="lis-panel-h3">\u0627\u0644\u0645\u0635\u062f\u0631</h3>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="lis-source-link">
              {sourceUrl}
            </a>
          )}
          {imageUrl ? (
            <>
              <h3 className="lis-panel-h3--sm">\u0635\u0648\u0631\u0629 \u0627\u0644\u0625\u0639\u0644\u0627\u0646</h3>
              <img src={imageUrl} alt="\u0625\u0639\u0644\u0627\u0646 \u0627\u0644\u062f\u0631\u0633" className="lis-preview-img" />
            </>
          ) : (
            <p className="lis-no-image">\u0644\u0627 \u062a\u0648\u062c\u062f \u0635\u0648\u0631\u0629 \u0645\u0633\u062a\u062e\u0631\u062c\u0629 \u0645\u0646 \u0627\u0644\u0631\u0627\u0628\u0637</p>
          )}
          <h3 className="lis-panel-h3--sm">\u0627\u0644\u0646\u0635 \u0627\u0644\u0645\u0633\u062a\u062e\u0631\u062c</h3>
          <pre className="lis-ocr-pre">{extractedText || "\u2014"}</pre>
          {warnings.length > 0 && (
            <ul className="lis-warnings">
              {warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          )}
        </section>

        <section className="lis-panel">
          <h3 className="lis-panel-h3">\u0645\u0631\u0627\u062c\u0639\u0629 \u0648\u062a\u0639\u062f\u064a\u0644 \u0627\u0644\u062d\u0642\u0648\u0644</h3>
          <LessonImportForm parsed={parsed} onChange={onParsedChange} disabled={busy} />
        </section>
      </div>

      <div className="lis-review-actions">
        <button type="button" disabled={busy} onClick={onApprove} className="lis-approve-btn">
          \u0627\u0639\u062a\u0645\u0627\u062f \u0648\u0646\u0634\u0631
        </button>
        <button type="button" disabled={busy} onClick={onSaveDraft} className="lis-draft-btn">
          \u062d\u0641\u0638 \u0643\u0645\u0633\u0648\u062f\u0629
        </button>
        {onReExtract && (
          <button type="button" disabled={busy} onClick={onReExtract} className="lis-extract-btn">
            {reExtractLabel}
          </button>
        )}
        <button type="button" disabled={busy || !draftId} onClick={onReject} className="lis-reject-btn">
          \u0631\u0641\u0636
        </button>
      </div>
    </>
  );
}

export { EMPTY_PARSED };
