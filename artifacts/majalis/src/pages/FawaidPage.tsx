import { useEffect, useState } from "react";
import { getApprovedFawaid, submitFawaid } from "@/lib/supabase";
import { DEMO_FAWAID, demoNoticeText } from "@/lib/demo-content";
import { canSubmitForm } from "@/lib/form-rate-limit";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, DemoNotice } from "@/components/ui-common";
import { useAuth } from "@/components/AuthProvider";
import ContentActions from "@/components/ContentActions";
import { isDemoId } from "@/lib/demo-content";

export default function FawaidPage() {
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingDemo, setUsingDemo] = useState(false);
  const [text, setText] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const { user, isLoggedIn } = useAuth() as any;

  const loadFawaid = async () => {
    setLoading(true);
    try {
      const { data, usingSeed } = await getApprovedFawaid();
      setFawaid(data);
      setUsingDemo(Boolean(usingSeed));
    } catch {
      setFawaid(DEMO_FAWAID);
      setUsingDemo(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFawaid();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    if (!canSubmitForm("fawaid-submit", 8000)) {
      setSubmitError("يرجى الانتظار قليلًا قبل إرسال فائدة أخرى.");
      return;
    }
    setSubmitError("");
    setSubmitting(true);
    try {
      const { error: insertError } = await submitFawaid(user.id, text, authorName || user?.profile?.full_name || "");
      if (insertError) throw insertError;
      setSubmitted(true);
      setText("");
      setAuthorName("");
    } catch {
      setSubmitError("تعذر إرسال الفائدة. حاول مجددًا.");
    } finally {
      setSubmitting(false);
    }
  };

  const displayed = fawaid;

  return (
    <div className="page-shell narrow">
      <PageHeader
        eyebrow="اقتباسات مختارة"
        title="الفوائد"
        subtitle="فوائد دينية مختارة ومراجَعة من قِبل الفريق."
      />

      {usingDemo && <DemoNotice text={demoNoticeText("الفوائد")} />}

      {loading ? <Loading /> : displayed.length === 0 ? (
        <Empty text="لا توجد فوائد بعد." />
      ) : (
        <div style={{ display: "grid", gap: "0.75rem", marginBottom: "2.5rem" }}>
          {displayed.map((f: any) => (
            <div key={f.id} style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.parchmentDeep }}>
              <p style={{ fontSize: "0.9375rem", color: C.ink, lineHeight: "1.75" }}>
                <span style={{ color: C.brassDeep, fontSize: "1.25rem", marginLeft: "0.25rem" }}>❝</span>
                {f.text}
                <span style={{ color: C.brassDeep, fontSize: "1.25rem", marginRight: "0.25rem" }}>❞</span>
              </p>
              {f.author_name && <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.5rem", textAlign: "left" }}>— {f.author_name}</p>}
              {!isDemoId(f.id) && (
                <div style={{ marginTop: "0.75rem" }}>
                  <ContentActions contentType="benefit" contentId={f.id} />
                </div>
              )}
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
              {submitError && (
                <p style={{ color: "#b91c1c", fontSize: "0.875rem", marginBottom: "0.75rem" }} role="alert">{submitError}</p>
              )}
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
