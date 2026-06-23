import { useEffect, useState } from "react";
import { getApprovedFawaid, submitFawaid, getSupabaseErrorMessage } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, ErrorMessage } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";

export default function FawaidPage() {
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const { user, isLoggedIn } = useAuth() as any;

  const load = () => {
    setLoading(true);
    setError("");
    getApprovedFawaid().then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل الفوائد."));
      setFawaid(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل الفوائد."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    setError("");
    setSubmitting(true);
    const { error } = await submitFawaid(user.id, text, authorName || user?.profile?.full_name || "");
    setSubmitting(false);
    if (error) {
      setError(getSupabaseErrorMessage(error, "تعذّر إرسال الفائدة."));
      return;
    }
    setSubmitted(true);
    setText("");
    setAuthorName("");
  };

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="اقتباسات مختارة"
        title="الفوائد"
        subtitle="فوائد دينية مختارة ومراجَعة من قِبل الفريق."
      />

      {error && <ErrorMessage text={error} onRetry={load} />}

      {loading ? <Loading /> : fawaid.length === 0 ? <Empty text="لا توجد فوائد بعد." /> : (
        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {fawaid.map((f: any) => (
            <div id={`fawaid-${f.id}`} key={f.id} style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.parchmentDeep }}>
              <p style={{ fontSize: "0.9375rem", color: C.ink, lineHeight: "1.75" }}>
                <span style={{ color: C.brassDeep, fontSize: "1.25rem", marginLeft: "0.25rem" }}>❝</span>
                {f.text}
                <span style={{ color: C.brassDeep, fontSize: "1.25rem", marginRight: "0.25rem" }}>❞</span>
              </p>
              {f.author_name && <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem", textAlign: "left" }}>— {f.author_name}</p>}
            </div>
          ))}
        </div>
      )}

      {isLoggedIn && (
        <div style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
          <h2 style={{ fontSize: "1rem", fontWeight: 700, color: C.emeraldDeep, marginBottom: "1rem" }}>أرسل فائدة</h2>
          {submitted ? (
            <p style={{ color: C.emeraldDeep, fontSize: "0.875rem" }}>شكرًا! سيتم مراجعة الفائدة قبل نشرها.</p>
          ) : (
            <form onSubmit={handleSubmit}>
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="اكتب الفائدة هنا..."
                rows={4}
                style={{ width: "100%", padding: "0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontSize: "0.875rem", fontFamily: "inherit", resize: "none", outline: "none", marginBottom: "0.75rem", background: C.parchment, color: C.ink }}
              />
              <input
                value={authorName}
                onChange={(e) => setAuthorName(e.target.value)}
                placeholder="اسم الكاتب (اختياري)"
                style={{ width: "100%", padding: "0.5rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontSize: "0.875rem", fontFamily: "inherit", outline: "none", marginBottom: "0.75rem", background: C.parchment, color: C.ink }}
              />
              <button
                type="submit"
                disabled={submitting || !text.trim()}
                style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, border: "none", cursor: "pointer", fontSize: "0.875rem", fontFamily: "inherit", opacity: submitting || !text.trim() ? 0.6 : 1 }}
              >
                {submitting ? "جارٍ الإرسال..." : "إرسال الفائدة"}
              </button>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
