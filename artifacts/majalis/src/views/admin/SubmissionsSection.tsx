import { useCallback, useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";
import { SubmissionsReviewPanel } from "@/components/admin/SubmissionsReviewPanel";

type ContentType = "درس" | "فائدة" | "معلومة" | "سؤال لعبة" | "فكرة";

type Submission = {
  id: string;
  type: ContentType;
  title: string;
  content: string;
  author: string;
  status: "pending" | "approved" | "rejected";
  meta?: Record<string, string> | null;
  created_at: string;
};

const TYPE_COLORS: Record<ContentType, { bg: string; color: string }> = {
  "درس":       { bg: "#dbeafe", color: "#1d4ed8" },
  "فائدة":     { bg: "#d1fae5", color: "#065f46" },
  "معلومة":    { bg: "#E6EDE9", color: "#173D35" },
  "سؤال لعبة": { bg: "#f3e8ff", color: "#7c3aed" },
  "فكرة":      { bg: "#ffe4e6", color: "#9f1239" },
};

export function SubmissionsSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"pending" | "approved" | "rejected">("pending");
  const [acting, setActing] = useState<string | null>(null);

  const load = useCallback(async (status: "pending" | "approved" | "rejected") => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/submissions?status=${status}`, { credentials: "include" });
      const json = await res.json();
      setItems(json.ok ? json.data : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(filter); }, [load, filter]);

  const act = async (id: string, action: "approve" | "reject") => {
    setActing(id);
    try {
      const res = await fetch("/api/admin/submissions", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, action }),
      });
      const json = await res.json();
      if (json.ok) {
        showSuccess(json.message || "تم.");
        void load(filter);
      } else {
        showError(json.message || json.error || "فشلت العملية.");
      }
    } catch {
      showError("خطأ في الاتصال.");
    } finally {
      setActing(null);
    }
  };

  return (
    <div>
      <div className="sub-header">
        <h2 className="sub-title">مقترحات المحتوى</h2>
        <div className="sub-filter-row">
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={`sub-filter-btn${filter === s ? " sub-filter-btn--active" : ""}`}
            >
              {s === "pending" ? "معلّق" : s === "approved" ? "موافق عليه" : "مرفوض"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p className="sub-loading">جارٍ التحميل...</p>}

      {!loading && items.length === 0 && (
        <p className="sub-empty">
          لا توجد {filter === "pending" ? "مقترحات معلّقة" : "سجلات"}.
        </p>
      )}

      <div className="sub-list">
        {items.map((item) => {
          const typeColor = TYPE_COLORS[item.type as ContentType] ?? { bg: "#f3f4f6", color: "#68716D" };
          const isActing = acting === item.id;
          return (
            <div key={item.id} className="sub-card">
              <div className="sub-card__row">
                <div className="sub-card__body">
                  <div className="sub-card__tags">
                    <span
                      className="sub-type-badge"
                      style={{ "--sub-type-bg": typeColor.bg, "--sub-type-color": typeColor.color } as React.CSSProperties}
                    >
                      {item.type}
                    </span>
                  </div>
                  <p className="sub-card__title">{item.title}</p>
                  <p className="sub-card__content">
                    {(() => { const content = item.content ?? ""; return content.length > 300 ? `${content.slice(0, 300)}...` : content; })()}
                  </p>
                  <p className="sub-card__meta">
                    {item.author ? `بقلم: ${item.author} · ` : ""}
                    {new Date(item.created_at).toLocaleDateString("ar-KW", { dateStyle: "medium" })}
                  </p>
                </div>

                {filter === "pending" && (
                  <div className="sub-action-col">
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => act(item.id, "approve")}
                      className={`sub-approve-btn${isActing ? " sub-approve-btn--acting" : ""}`}
                    >
                      موافقة
                    </button>
                    <button
                      type="button"
                      disabled={isActing}
                      onClick={() => act(item.id, "reject")}
                      className={`sub-reject-btn${isActing ? " sub-reject-btn--acting" : ""}`}
                    >
                      رفض
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <div className="sub-divider">
        <SubmissionsReviewPanel />
      </div>
    </div>
  );
}
