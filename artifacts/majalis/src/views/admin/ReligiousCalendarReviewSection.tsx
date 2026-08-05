import { useMemo, useState } from "react";
import {
  ALL_VERIFIED_RELIGIOUS_RECORDS,
  ReligiousContentValidator,
  contentKindLabel,
  type ReviewStatus,
  type VerifiedReligiousRecord,
} from "@/lib/religious-content";
import "@/styles/components/home/home-learning-seasons.css";

const STORAGE_KEY = "majalis-religious-calendar-review-v1";

type OverrideMap = Record<
  string,
  { reviewStatus: ReviewStatus; note?: string; updatedAt: string }
>;

function loadOverrides(): OverrideMap {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as OverrideMap) : {};
  } catch {
    return {};
  }
}

function saveOverrides(map: OverrideMap) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

function applyOverride(record: VerifiedReligiousRecord, overrides: OverrideMap): VerifiedReligiousRecord {
  const o = overrides[record.id];
  if (!o) return record;
  return { ...record, reviewStatus: o.reviewStatus };
}

export function ReligiousCalendarReviewSection() {
  const [overrides, setOverrides] = useState<OverrideMap>(() =>
    typeof window !== "undefined" ? loadOverrides() : {},
  );
  const [filter, setFilter] = useState<"all" | ReviewStatus | "invalid">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const rows = useMemo(() => {
    return ALL_VERIFIED_RELIGIOUS_RECORDS.map((r) => {
      const merged = applyOverride(r, overrides);
      const validation = ReligiousContentValidator.validate(merged);
      return { record: merged, validation, base: r };
    });
  }, [overrides]);

  const filtered = rows.filter(({ record, validation }) => {
    if (filter === "all") return true;
    if (filter === "invalid") return !validation.publishable;
    return record.reviewStatus === filter;
  });

  const selected = filtered.find((r) => r.record.id === selectedId) ?? filtered[0] ?? null;

  const setStatus = (id: string, reviewStatus: ReviewStatus, note?: string) => {
    const next = {
      ...overrides,
      [id]: { reviewStatus, note, updatedAt: new Date().toISOString() },
    };
    setOverrides(next);
    saveOverrides(next);
  };

  return (
    <div className="admin-section" dir="rtl">
      <header className="admin-section__head">
        <h2>مراجعة المحتوى الشرعي والتقويمي</h2>
        <p>
          لا يُنشر محتوى هجري أو مناسبة أو اقتراح موسم إلا بعد اجتياز التحقق والمراجعة.
          الذكاء الاصطناعي إن وُجد يقتصر على إعادة الصياغة دون اختراع روابط تاريخية.
        </p>
      </header>

      <div className="admin-toolbar" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
        {(["all", "approved", "needs_review", "draft", "rejected", "invalid"] as const).map((f) => (
          <button
            key={f}
            type="button"
            className={`admin-chip${filter === f ? " is-active" : ""}`}
            onClick={() => setFilter(f)}
          >
            {f === "all" ? "الكل" : f === "invalid" ? "رافضها المتحقّق" : f}
          </button>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "minmax(220px, 1fr) minmax(0, 2fr)", gap: "1rem" }}>
        <ul style={{ listStyle: "none", margin: 0, padding: 0, maxHeight: "70vh", overflow: "auto" }}>
          {filtered.map(({ record, validation }) => (
            <li key={record.id}>
              <button
                type="button"
                onClick={() => setSelectedId(record.id)}
                style={{
                  width: "100%",
                  textAlign: "right",
                  padding: "0.65rem 0.75rem",
                  marginBottom: "0.35rem",
                  border: "1px solid var(--color-border, #e5e7eb)",
                  borderRadius: "0.5rem",
                  background: selected?.record.id === record.id ? "color-mix(in srgb, var(--mj-brand-deep) 8%, white)" : "white",
                  cursor: "pointer",
                }}
              >
                <strong>{record.eventName}</strong>
                <div style={{ fontSize: "0.75rem", color: "#6B7280" }}>
                  {record.reviewStatus} · {validation.publishable ? "قابل للنشر" : "محجوب"}
                </div>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <article
            className="ui-card"
            style={{ padding: "1rem", border: "1px solid var(--color-border, #e5e7eb)", borderRadius: "0.75rem" }}
          >
            <h3 style={{ marginTop: 0 }}>{selected.record.eventName}</h3>
            <p>
              <span className={`religious-kind-badge religious-kind-badge--${selected.record.contentKind}`}>
                {contentKindLabel(selected.record.contentKind)}
              </span>
            </p>
            <p><strong>النص الحالي:</strong> {selected.record.verifiedDescription}</p>
            <p><strong>المصدر:</strong> {selected.record.sourceName}</p>
            <p><strong>الدليل:</strong> {selected.record.evidence}</p>
            <p><strong>درجة الثقة:</strong> {selected.record.confidenceLevel}</p>
            <p><strong>حالة المراجعة:</strong> {selected.record.reviewStatus}</p>
            <p><strong>الشهر/اليوم:</strong> {selected.record.hijriMonth ?? "—"} / {selected.record.hijriDay ?? "—"}</p>
            <p><strong>سبب الاقتراح / التحفظ:</strong> {selected.record.caveat || "—"}</p>
            <p><strong>راجعه:</strong> {selected.record.reviewedBy} · {selected.record.lastReviewedAt}</p>
            {overrides[selected.record.id]?.updatedAt ? (
              <p><strong>آخر تعديل مراجعة:</strong> {overrides[selected.record.id].updatedAt}</p>
            ) : null}

            {!selected.validation.publishable && (
              <div style={{ background: "#FEF2F2", padding: "0.75rem", borderRadius: "0.5rem" }}>
                <strong>أسباب الرفض من المتحقّق:</strong>
                <ul>
                  {selected.validation.rejections.map((r) => (
                    <li key={`${r.rule}-${r.reason}`}>{r.rule}: {r.reason}</li>
                  ))}
                </ul>
              </div>
            )}

            <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
              <button type="button" className="ds-btn ds-btn--primary" onClick={() => setStatus(selected.record.id, "approved")}>
                قبول
              </button>
              <button type="button" className="ds-btn" onClick={() => setStatus(selected.record.id, "rejected", "رفض تحريري")}>
                رفض
              </button>
              <button type="button" className="ds-btn" onClick={() => setStatus(selected.record.id, "needs_review")}>
                إعادة للمراجعة
              </button>
            </div>
          </article>
        ) : (
          <p>لا سجلات في هذا المرشّح.</p>
        )}
      </div>
    </div>
  );
}

export default ReligiousCalendarReviewSection;
