import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Empty, ErrorMessage, Loading } from "@/components/ui-common";
import { C, QA_DISCLAIMER, QA_REVIEW_LABELS, QA_RULING_COLORS } from "@/lib/theme";
import { getQaQuestionById, getSupabaseErrorMessage } from "@/lib/supabase";

export default function QaDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getQaQuestionById(params.id).then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل السؤال."));
      setItem(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل السؤال."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="لم يُعثر على السؤال." />;

  const rulingColors = item.ruling_type ? (QA_RULING_COLORS[item.ruling_type] || { bg: C.parchmentDeep, text: C.inkSoft }) : null;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <Link href="/qa" style={{ color: C.brassDeep, fontSize: "0.875rem", display: "inline-block", marginBottom: "1.25rem" }}>← العودة إلى الأسئلة والأجوبة</Link>
      {error && <ErrorMessage text={error} onRetry={load} />}
      <article style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.75rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
          {item.qa_categories?.name && <span style={{ padding: "0.15rem 0.65rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, fontSize: "0.75rem", fontWeight: 700 }}>{item.qa_categories.name}</span>}
          {rulingColors && <span style={{ padding: "0.15rem 0.65rem", borderRadius: "999px", background: rulingColors.bg, color: rulingColors.text, fontSize: "0.75rem", fontWeight: 700 }}>{item.ruling_type}</span>}
          {item.review_status && <span style={{ padding: "0.15rem 0.65rem", borderRadius: "999px", background: C.parchmentDeep, color: C.brassDeep, fontSize: "0.75rem", fontWeight: 700 }}>{QA_REVIEW_LABELS[item.review_status] || item.review_status}</span>}
        </div>
        <h1 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "1.8rem", lineHeight: 1.5 }}>{item.question}</h1>
        <p style={{ color: C.ink, lineHeight: 2, whiteSpace: "pre-wrap" }}>{item.answer}</p>
        {item.evidence && (
          <div style={{ padding: "1rem", borderRadius: "0.5rem", background: C.parchmentDeep, borderRight: `3px solid ${C.emerald}`, marginTop: "1rem" }}>
            <p style={{ margin: "0 0 0.35rem", color: C.emeraldDeep, fontWeight: 700, fontSize: "0.85rem" }}>الدليل الشرعي</p>
            <p style={{ margin: 0, color: C.ink, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{item.evidence}</p>
          </div>
        )}
        {item.reference && <p style={{ color: C.inkSoft, fontSize: "0.875rem", marginTop: "1rem" }}><strong>المرجع:</strong> {item.reference}</p>}
      </article>
      <p style={{ marginTop: "1rem", padding: "0.9rem 1rem", borderRadius: "0.5rem", border: `1px solid ${C.brass}`, background: "#FBF3DE", color: C.brassDeep, fontSize: "0.82rem", lineHeight: 1.8 }}>
        {QA_DISCLAIMER}
      </p>
    </div>
  );
}
