import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminModal, Field, textareaSt } from "./AdminModal";
import { DEGREE_LABELS } from "@/lib/scientific-research/constants";

type Paper = {
  id: string;
  title: string;
  author_name: string;
  university?: string;
  degree_type: string;
  status: string;
  views_count?: number;
  downloads_count?: number;
  created_at?: string;
};

export function ScientificResearchSection() {
  const [tab, setTab] = useState<"pending" | "stats">("pending");
  const [papers, setPapers] = useState<Paper[]>([]);
  const [stats, setStats] = useState({ total: 0, published: 0, pending: 0 });
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");
  const [reviewModal, setReviewModal] = useState<Paper | null>(null);
  const [notes, setNotes] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, statsRes] = await Promise.all([
        fetch("/api/scientific-research?action=list_pending", { method: "POST", credentials: "same-origin" }),
        fetch("/api/scientific-research?action=stats", { method: "POST", credentials: "same-origin" }),
      ]);
      const pending = await pendingRes.json();
      const st = await statsRes.json();
      if (pending.ok) setPapers(pending.papers || []);
      if (st.ok) setStats(st.stats);
    } catch {
      setMsg("تعذر تحميل البيانات");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const review = async (paperId: string, new_status: string) => {
    const res = await fetch("/api/scientific-research?action=review", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "same-origin",
      body: JSON.stringify({ paper_id: paperId, new_status, notes }),
    });
    const data = await res.json();
    if (data.ok) {
      setMsg(new_status === "published" ? "تم النشر" : "تم التحديث");
      setReviewModal(null);
      setNotes("");
      load();
    } else {
      setMsg(data.error || "فشل");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap" }}>
        <h2 style={{ margin: 0, flex: 1, color: C.emeraldDeep }}>الأبحاث العلمية</h2>
        <button type="button" className="page-action-btn" onClick={() => setTab("pending")}>المراجعات</button>
        <button type="button" className="page-action-btn" onClick={() => setTab("stats")}>إحصائيات</button>
        <button type="button" className="page-action-btn" onClick={() => void load()}>تحديث</button>
      </div>

      {msg && <p style={{ color: C.emeraldDeep, fontSize: "0.875rem" }}>{msg}</p>}

      {tab === "stats" && (
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1.5rem" }}>
          <Stat label="إجمالي" value={stats.total} />
          <Stat label="منشور" value={stats.published} />
          <Stat label="قيد المراجعة" value={stats.pending} />
        </div>
      )}

      {loading ? (
        <Loading />
      ) : tab === "pending" ? (
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
            <thead>
              <tr style={{ background: C.parchmentDeep }}>
                {["العنوان", "الباحث", "الجامعة", "الدرجة", "الحالة", "إجراءات"].map((h) => (
                  <th key={h} style={{ padding: "0.625rem", textAlign: "right" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {papers.map((p) => (
                <tr key={p.id} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.625rem", maxWidth: 240 }}>{p.title}</td>
                  <td style={{ padding: "0.625rem" }}>{p.author_name}</td>
                  <td style={{ padding: "0.625rem" }}>{p.university || "—"}</td>
                  <td style={{ padding: "0.625rem" }}>{DEGREE_LABELS[p.degree_type as keyof typeof DEGREE_LABELS] || p.degree_type}</td>
                  <td style={{ padding: "0.625rem" }}>{p.status}</td>
                  <td style={{ padding: "0.625rem" }}>
                    <button type="button" onClick={() => setReviewModal(p)}>مراجعة</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {papers.length === 0 && <p style={{ color: C.inkSoft }}>لا توجد أبحاث قيد المراجعة</p>}
        </div>
      ) : null}

      {reviewModal && (
        <AdminModal
          title="مراجعة البحث"
          open={Boolean(reviewModal)}
          onClose={() => setReviewModal(null)}
          onSave={() => review(reviewModal.id, "published")}
        >
          <p><strong>{reviewModal.title}</strong></p>
          <p>{reviewModal.author_name}</p>
          <Field label="ملاحظات">
            <textarea style={textareaSt} value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} />
          </Field>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "1rem", flexWrap: "wrap" }}>
            <button type="button" className="page-action-btn" onClick={() => review(reviewModal.id, "published")}>قبول ونشر</button>
            <button type="button" onClick={() => review(reviewModal.id, "revision_requested")}>طلب تعديل</button>
            <button type="button" onClick={() => review(reviewModal.id, "rejected")}>رفض</button>
            <button type="button" onClick={() => review(reviewModal.id, "hidden")}>إخفاء</button>
          </div>
        </AdminModal>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ padding: "0.85rem 1rem", border: "1px solid var(--majalis-line)", borderRadius: "0.75rem", minWidth: "6rem" }}>
      <div style={{ fontSize: "1.25rem", fontWeight: 800 }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: "var(--majalis-ink-soft)" }}>{label}</div>
    </div>
  );
}

export default ScientificResearchSection;
