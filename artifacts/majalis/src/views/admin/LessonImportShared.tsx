import { useState } from "react";
import { C, GOVERNORATES } from "@/lib/theme";
import { FIELD_LABELS, EMPTY_PARSED, type DebugLog, type ParsedLessonFields } from "@/lib/lesson-import-api";

export const CATEGORIES = ["تفسير", "فقه", "عقيدة", "حديث", "سيرة", "تجويد", "أخرى"];
export const VENUE_TYPES = ["مسجد", "مجلس", "ديوان", "مزرعة", "استراحة", "مركز", "جامعة", "أخرى"] as const;
export const WEEK_DAYS = ["السبت", "الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة"] as const;

export const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "0.5rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.line}`,
  fontFamily: "inherit",
  fontSize: "0.875rem",
};

export const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "0.75rem",
  fontWeight: 600,
  color: C.emeraldDeep,
  marginBottom: "0.25rem",
};

export function ConfidenceBadge({ score }: { score: number }) {
  const pct = Math.round(score * 100);
  const color = pct >= 75 ? C.emeraldDeep : pct >= 45 ? "#92400E" : "#991B1B";
  const bg = pct >= 75 ? "#D1FAE5" : pct >= 45 ? "#FEF3C7" : "#FEE2E2";
  return (
    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: bg, color, fontSize: "0.75rem", fontWeight: 600 }}>
      ثقة الاستخراج: {pct}%
    </span>
  );
}

export function MissingBadge({ fields }: { fields: string[] }) {
  if (!fields.length) {
    return (
      <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#D1FAE5", color: C.emeraldDeep, fontSize: "0.75rem" }}>
        ✓ البيانات الأساسية مكتملة
      </span>
    );
  }
  return (
    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#FEE2E2", color: "#991B1B", fontSize: "0.75rem" }}>
      ✗ تحتاج مراجعة: {fields.map((f) => FIELD_LABELS[f] || f).join("، ")}
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
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.4rem", marginBottom: "0.75rem" }}>
      {KEY_FIELDS_SHARED.map((field) => {
        const val = String((parsed as Record<string, unknown>)[field] || "").trim();
        const conf = fieldConfidence[field] ?? (val ? 1 : 0);
        const reason = failureReasons[field];
        const isOk = val && conf >= 0.5;
        const isWarn = val && conf < 0.5;
        const isMissing = !val;
        const bg = isOk ? "#D1FAE5" : isWarn ? "#FEF3C7" : "#FEE2E2";
        const color = isOk ? C.emeraldDeep : isWarn ? "#92400E" : "#991B1B";
        const icon = isOk ? "✓" : isWarn ? "⚠" : "✗";
        return (
          <div key={field} style={{ background: bg, border: `1px solid ${color}30`, borderRadius: "0.375rem", padding: "0.35rem 0.6rem" }} title={reason || val || "غير موجود"}>
            <div style={{ fontSize: "0.65rem", color, fontWeight: 700 }}>{icon} {FIELD_LABELS[field] || field}</div>
            <div style={{ fontSize: "0.72rem", color: "#374151", marginTop: "0.15rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {isMissing ? (reason || "لم يُستخرج") : val}
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
    <div style={{ background: "#F1F5F9", border: "1px solid #CBD5E1", borderRadius: "0.5rem", marginBottom: "0.75rem" }}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        style={{ width: "100%", background: "none", border: "none", padding: "0.5rem 0.75rem", textAlign: "right", cursor: "pointer", fontFamily: "inherit", fontSize: "0.8rem", color: "#475569", display: "flex", justifyContent: "space-between" }}
      >
        <span>تفاصيل الاستخراج (Debug) — {log.total_ms ?? 0} ms</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={{ padding: "0.5rem 0.75rem", borderTop: "1px solid #CBD5E1", fontSize: "0.75rem", direction: "ltr" }}>
          {log.stages.map((s, i) => (
            <div key={i} style={{ marginBottom: "0.5rem", padding: "0.4rem", background: s.ok === false ? "#FEE2E2" : "#fff", borderRadius: "0.25rem", border: "1px solid #E2E8F0" }}>
              <strong>{s.stage}</strong>
              {s.ms != null && <span style={{ color: "#64748B", marginRight: "0.5rem" }}>({s.ms}ms)</span>}
              {s.error && <span style={{ color: "#DC2626" }}> ✗ {s.error}</span>}
              {s.fields_found?.length ? <div style={{ color: "#16A34A" }}>✓ {s.fields_found.join(", ")}</div> : null}
              {s.fields_missing?.length ? <div style={{ color: "#DC2626" }}>✗ missing: {s.fields_missing.join(", ")}</div> : null}
              {s.fields_recovered?.length ? <div style={{ color: "#2563EB" }}>↑ recovered: {s.fields_recovered.join(", ")}</div> : null}
              {s.fields_filled?.length ? <div style={{ color: "#7C3AED" }}>DB: {s.fields_filled.join(", ")}</div> : null}
              {s.raw_confidence != null && <div style={{ color: "#64748B" }}>confidence: {Math.round(s.raw_confidence * 100)}%</div>}
            </div>
          ))}
          {log.raw_ocr_text && (
            <details style={{ marginTop: "0.5rem" }}>
              <summary style={{ cursor: "pointer", color: "#475569" }}>raw_ocr_text</summary>
              <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.7rem", marginTop: "0.25rem", direction: "rtl", color: "#1E293B" }}>{log.raw_ocr_text}</pre>
            </details>
          )}
        </div>
      )}
    </div>
  );
}

export function PlatformBadge({ label }: { label: string }) {
  return (
    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#EDE9FE", color: "#5B21B6", fontSize: "0.75rem" }}>
      {label}
    </span>
  );
}

export function DuplicateBadge({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#FFEDD5", color: "#C2410C", fontSize: "0.75rem" }}>
      {message}
    </span>
  );
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
    <div style={{ display: "grid", gap: "0.75rem", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.title}</label>
        <input style={inputStyle} value={parsed.title || ""} disabled={disabled} onChange={(e) => set("title", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.speaker_name}</label>
        <input style={inputStyle} value={parsed.speaker_name || ""} disabled={disabled} onChange={(e) => set("speaker_name", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.gregorian_date}</label>
        <input type="date" style={inputStyle} value={parsed.gregorian_date || parsed.start_date || ""} disabled={disabled} onChange={(e) => { set("gregorian_date", e.target.value); set("start_date", e.target.value); }} />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.day_of_week} (اختر يوماً أو أكثر)</label>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1rem", padding: "0.4rem 0" }}>
          {WEEK_DAYS.map(d => {
            const selected = (parsed.day_of_week || "").split("،").map(x => x.trim()).includes(d);
            return (
              <label key={d} style={{ display: "flex", alignItems: "center", gap: "0.3rem", cursor: disabled ? "default" : "pointer", fontSize: "0.875rem", fontWeight: selected ? 700 : 400, color: selected ? C.emeraldDeep : C.ink }}>
                <input
                  type="checkbox"
                  disabled={disabled}
                  checked={selected}
                  onChange={e => {
                    const cur = (parsed.day_of_week || "").split("،").map(x => x.trim()).filter(Boolean);
                    const next = e.target.checked ? [...cur, d] : cur.filter(x => x !== d);
                    set("day_of_week", next.join("،"));
                  }}
                  style={{ accentColor: C.emerald, width: "1rem", height: "1rem" }}
                />
                {d}
              </label>
            );
          })}
        </div>
        {(parsed.day_of_week || "").includes("،") && (
          <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>
            يتكرر كل: {(parsed.day_of_week || "").split("،").join(" و")}
          </div>
        )}
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.lesson_time}</label>
        <input style={inputStyle} value={parsed.lesson_time || ""} disabled={disabled} onChange={(e) => set("lesson_time", e.target.value)} placeholder="مثل: بعد العشاء" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.venue_type}</label>
        <select style={inputStyle} value={parsed.venue_type || "مسجد"} disabled={disabled} onChange={(e) => set("venue_type", e.target.value)}>
          {VENUE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.mosque}</label>
        <input style={inputStyle} value={parsed.mosque || ""} disabled={disabled} onChange={(e) => set("mosque", e.target.value)} placeholder={parsed.venue_type === "ديوان" ? "ديوان آل فلان" : parsed.venue_type === "مجلس" ? "مجلس الشيخ فلان" : "اسم المكان"} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.region}</label>
        <input style={inputStyle} value={parsed.region || ""} disabled={disabled} onChange={(e) => set("region", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.city}</label>
        <select style={inputStyle} value={parsed.city || "العاصمة"} disabled={disabled} onChange={(e) => set("city", e.target.value)}>
          {GOVERNORATES.map((g) => (
            <option key={g} value={g}>{g}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.country}</label>
        <input style={inputStyle} value={parsed.country || "الكويت"} disabled={disabled} onChange={(e) => set("country", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.category}</label>
        <select style={inputStyle} value={parsed.category || ""} disabled={disabled} onChange={(e) => set("category", e.target.value)}>
          <option value="">—</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.organizer}</label>
        <input style={inputStyle} value={parsed.organizer || ""} disabled={disabled} onChange={(e) => set("organizer", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.cooperative_org}</label>
        <input style={inputStyle} value={parsed.cooperative_org || ""} disabled={disabled} onChange={(e) => set("cooperative_org", e.target.value)} />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.phone}</label>
        <input style={inputStyle} value={parsed.phone || ""} disabled={disabled} onChange={(e) => set("phone", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.live_url}</label>
        <input style={inputStyle} value={parsed.live_url || ""} disabled={disabled} onChange={(e) => set("live_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.registration_url}</label>
        <input style={inputStyle} value={parsed.registration_url || ""} disabled={disabled} onChange={(e) => set("registration_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.maps_url}</label>
        <input style={inputStyle} value={parsed.maps_url || ""} disabled={disabled} onChange={(e) => set("maps_url", e.target.value)} dir="ltr" />
      </div>
      <div>
        <label style={labelStyle}>{FIELD_LABELS.slug}</label>
        <input style={inputStyle} value={parsed.slug || ""} disabled={disabled} onChange={(e) => set("slug", e.target.value)} dir="ltr" />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={Boolean(parsed.has_live_stream)} disabled={disabled} onChange={(e) => set("has_live_stream", e.target.checked)} id="has-live" />
        <label htmlFor="has-live" style={{ ...labelStyle, margin: 0 }}>{FIELD_LABELS.has_live_stream}</label>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <input type="checkbox" checked={Boolean(parsed.has_women_section)} disabled={disabled} onChange={(e) => set("has_women_section", e.target.checked)} id="has-women" />
        <label htmlFor="has-women" style={{ ...labelStyle, margin: 0 }}>{FIELD_LABELS.has_women_section}</label>
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.keywords}</label>
        <input
          style={inputStyle}
          value={(parsed.keywords || []).join("، ")}
          disabled={disabled}
          onChange={(e) => set("keywords", e.target.value.split(/[،,]/).map((s) => s.trim()).filter(Boolean))}
          placeholder="كلمات مفتاحية مفصولة بفاصلة"
        />
      </div>
      <div style={{ gridColumn: "1 / -1" }}>
        <label style={labelStyle}>{FIELD_LABELS.description}</label>
        <textarea
          style={{ ...inputStyle, minHeight: "5rem", resize: "vertical" }}
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
  reExtractLabel = "إعادة استخراج",
}: LessonImportReviewProps) {
  return (
    <>
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
        <ConfidenceBadge score={confidence} />
        <MissingBadge fields={missingFields} />
        {platformLabel && <PlatformBadge label={platformLabel} />}
        <DuplicateBadge message={duplicateMessage} />
        {sheikhHint && (
          <span style={{ padding: "0.25rem 0.625rem", borderRadius: "999px", background: "#DBEAFE", color: "#1D4ED8", fontSize: "0.75rem" }}>
            {sheikhHint}
          </span>
        )}
      </div>

      <FieldStatusGrid parsed={parsed} fieldConfidence={fieldConfidence} failureReasons={failureReasons} />
      {debugLog && <DebugLogPanel log={debugLog} />}

      <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "minmax(240px, 1fr) minmax(280px, 2fr)", marginBottom: "1rem" }}>
        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>المصدر</h3>
          {sourceUrl && (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.75rem", wordBreak: "break-all", color: C.emeraldDeep }}>
              {sourceUrl}
            </a>
          )}
          {imageUrl ? (
            <>
              <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.875rem", color: C.emeraldDeep }}>صورة الإعلان</h3>
              <img src={imageUrl} alt="إعلان الدرس" style={{ width: "100%", borderRadius: "0.375rem", border: `1px solid ${C.line}` }} />
            </>
          ) : (
            <p style={{ color: C.inkSoft, fontSize: "0.875rem", marginTop: "0.75rem" }}>لا توجد صورة مستخرجة من الرابط</p>
          )}
          <h3 style={{ margin: "1rem 0 0.5rem", fontSize: "0.875rem", color: C.emeraldDeep }}>النص المستخرج</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontSize: "0.75rem", maxHeight: "12rem", overflow: "auto", background: C.parchmentDeep, padding: "0.5rem", borderRadius: "0.375rem", margin: 0, direction: "rtl" }}>
            {extractedText || "—"}
          </pre>
          {warnings.length > 0 && (
            <ul style={{ margin: "0.75rem 0 0", paddingInlineStart: "1rem", fontSize: "0.75rem", color: "#92400E" }}>
              {warnings.map((w, i) => (
                <li key={i}>{w.message}</li>
              ))}
            </ul>
          )}
        </section>

        <section style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.625rem", padding: "1rem" }}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>مراجعة وتعديل الحقول</h3>
          <LessonImportForm parsed={parsed} onChange={onParsedChange} disabled={busy} />
        </section>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
        <button type="button" disabled={busy} onClick={onApprove} style={{ padding: "0.5rem 1rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}>
          اعتماد ونشر
        </button>
        <button type="button" disabled={busy} onClick={onSaveDraft} style={{ padding: "0.5rem 1rem", background: C.panel, color: C.emeraldDeep, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
          حفظ كمسودة
        </button>
        {onReExtract && (
          <button type="button" disabled={busy} onClick={onReExtract} style={{ padding: "0.5rem 1rem", background: C.panel, color: C.ink, border: `1px solid ${C.line}`, borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
            {reExtractLabel}
          </button>
        )}
        <button type="button" disabled={busy || !draftId} onClick={onReject} style={{ padding: "0.5rem 1rem", background: "#FEE2E2", color: "#991B1B", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit" }}>
          رفض
        </button>
      </div>
    </>
  );
}

export { EMPTY_PARSED };
