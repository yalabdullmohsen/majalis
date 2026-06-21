import { useEffect, useState } from "react";
import { getQaQuestions, getQaCategories } from "@/lib/supabase";
import { C, QA_RULING_COLORS, QA_REVIEW_LABELS, QA_DISCLAIMER } from "@/lib/theme";
import { PageHeader, Loading, Empty } from "@/components/ui-common";

function Disclaimer() {
  return (
    <div
      style={{
        display: "flex",
        gap: "0.625rem",
        alignItems: "flex-start",
        padding: "0.875rem 1rem",
        borderRadius: "0.5rem",
        border: `1px solid ${C.brass}`,
        background: "#FBF3DE",
        marginBottom: "1.75rem",
      }}
    >
      <span style={{ fontSize: "1.1rem", flexShrink: 0, lineHeight: 1.4 }}>⚠️</span>
      <p style={{ margin: 0, fontSize: "0.8125rem", color: C.brassDeep, lineHeight: "1.7", fontWeight: 600 }}>
        {QA_DISCLAIMER}
      </p>
    </div>
  );
}

function RulingBadge({ ruling }: { ruling: string }) {
  const c = QA_RULING_COLORS[ruling] || { bg: C.parchmentDeep, text: C.inkSoft };
  return (
    <span style={{ padding: "0.125rem 0.625rem", borderRadius: "999px", background: c.bg, color: c.text, fontSize: "0.75rem", fontWeight: 700, whiteSpace: "nowrap" }}>
      {ruling}
    </span>
  );
}

function ReviewBadge({ status }: { status: string }) {
  const approved = status === "approved";
  return (
    <span
      style={{
        padding: "0.125rem 0.625rem",
        borderRadius: "999px",
        background: approved ? "#D1FAE5" : "#FEF3C7",
        color: approved ? "#065F46" : "#92400E",
        fontSize: "0.6875rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      {approved ? "✓ " : "↻ "}{QA_REVIEW_LABELS[status] || status}
    </span>
  );
}

export default function QaPage() {
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [categoryId, setCategoryId] = useState("all");
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  useEffect(() => {
    getQaCategories().then(({ data }) => setCategories(data));
  }, []);

  useEffect(() => {
    setLoading(true);
    getQaQuestions({ categoryId, search }).then(({ data }) => {
      setItems(data);
      setLoading(false);
    });
  }, [categoryId, search]);

  const chips = [{ id: "all", name: "الكل" }, ...categories];

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="المجلس العلمي"
        title="الأسئلة والأجوبة الدينية"
        subtitle="مجموعة من الأسئلة والأجوبة العلمية المدعّمة بالأدلة الشرعية والمراجع، مرتّبة حسب التصنيف."
      />

      <Disclaimer />

      {/* البحث */}
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث في الأسئلة والأجوبة..."
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "0.625rem 0.875rem",
          borderRadius: "0.5rem",
          border: `1px solid ${C.line}`,
          fontSize: "0.875rem",
          fontFamily: "inherit",
          outline: "none",
          marginBottom: "1rem",
          background: C.panel,
          color: C.ink,
        }}
      />

      {/* التصنيفات */}
      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.75rem" }}>
        {chips.map((cat) => {
          const active = categoryId === cat.id;
          return (
            <button
              key={cat.id}
              onClick={() => setCategoryId(cat.id)}
              style={{
                fontSize: "0.8125rem",
                padding: "0.375rem 0.875rem",
                borderRadius: "999px",
                border: `1px solid ${active ? C.emerald : C.line}`,
                background: active ? C.emerald : C.panel,
                color: active ? C.parchment : C.inkSoft,
                cursor: "pointer",
                fontFamily: "inherit",
                fontWeight: active ? 700 : 400,
                whiteSpace: "nowrap",
              }}
            >
              {cat.name}
            </button>
          );
        })}
      </div>

      {loading ? (
        <Loading />
      ) : items.length === 0 ? (
        <Empty text="لا توجد أسئلة في هذا التصنيف بعد." />
      ) : (
        <div style={{ display: "grid", gap: "0.75rem" }}>
          {items.map((q: any) => {
            const open = openId === q.id;
            const catName = q.qa_categories?.name;
            return (
              <div
                key={q.id}
                style={{ borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, overflow: "hidden" }}
              >
                {/* رأس السؤال */}
                <button
                  onClick={() => setOpenId(open ? null : q.id)}
                  style={{
                    width: "100%",
                    display: "flex",
                    alignItems: "flex-start",
                    gap: "0.75rem",
                    padding: "1rem 1.25rem",
                    background: open ? C.parchmentDeep : "transparent",
                    border: "none",
                    cursor: "pointer",
                    textAlign: "right",
                    fontFamily: "inherit",
                  }}
                >
                  <span style={{ color: C.brassDeep, fontSize: "1.1rem", flexShrink: 0, transform: open ? "rotate(90deg)" : "none", transition: "transform 0.15s" }}>
                    ◂
                  </span>
                  <span style={{ flex: 1 }}>
                    <span style={{ display: "block", fontSize: "0.9375rem", fontWeight: 700, color: C.ink, lineHeight: "1.7" }}>
                      {q.question}
                    </span>
                    <span style={{ display: "flex", gap: "0.375rem", flexWrap: "wrap", marginTop: "0.5rem", alignItems: "center" }}>
                      {catName && (
                        <span style={{ fontSize: "0.6875rem", color: C.emeraldDeep, background: C.sage, padding: "0.1rem 0.5rem", borderRadius: "999px", fontWeight: 600 }}>
                          {catName}
                        </span>
                      )}
                      {q.ruling_type && <RulingBadge ruling={q.ruling_type} />}
                      <ReviewBadge status={q.review_status} />
                    </span>
                  </span>
                </button>

                {/* تفاصيل الجواب */}
                {open && (
                  <div style={{ padding: "0 1.25rem 1.25rem", borderTop: `1px solid ${C.line}` }}>
                    <p style={{ fontSize: "0.9375rem", color: C.ink, lineHeight: "1.9", margin: "1rem 0 0", whiteSpace: "pre-wrap" }}>
                      {q.answer}
                    </p>

                    {q.evidence && (
                      <div style={{ marginTop: "1rem", padding: "0.875rem 1rem", borderRadius: "0.5rem", background: C.parchmentDeep, borderRight: `3px solid ${C.emerald}` }}>
                        <p style={{ margin: "0 0 0.375rem", fontSize: "0.75rem", fontWeight: 700, color: C.emeraldDeep }}>الدليل الشرعي</p>
                        <p style={{ margin: 0, fontSize: "0.875rem", color: C.ink, lineHeight: "1.8", whiteSpace: "pre-wrap" }}>{q.evidence}</p>
                      </div>
                    )}

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.875rem" }}>
                      {q.reference ? (
                        <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>
                          <span style={{ fontWeight: 700 }}>المرجع:</span> {q.reference}
                        </p>
                      ) : <span />}
                      <p style={{ margin: 0, fontSize: "0.6875rem", color: C.inkSoft }}>
                        {new Date(q.created_at).toLocaleDateString("ar-KW")}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
