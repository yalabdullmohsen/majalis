"use client";

import { useCallback, useEffect, useState } from "react";
import { useAdminShell } from "@/views/admin/AdminShell";

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
  "معلومة":    { bg: "#fef9c3", color: "#854d0e" },
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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 700, margin: 0 }}>مقترحات المحتوى</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {(["pending", "approved", "rejected"] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              style={{
                padding: "0.375rem 0.875rem",
                borderRadius: "0.375rem",
                border: `1px solid ${filter === s ? "#C9A84C" : "#e5e7eb"}`,
                background: filter === s ? "#fffbeb" : "#fff",
                color: filter === s ? "#92400e" : "#6b7280",
                fontWeight: filter === s ? 700 : 400,
                cursor: "pointer",
                fontFamily: "inherit",
                fontSize: "0.8125rem",
              }}
            >
              {s === "pending" ? "معلّق" : s === "approved" ? "موافق عليه" : "مرفوض"}
            </button>
          ))}
        </div>
      </div>

      {loading && <p style={{ color: "#9ca3af" }}>جارٍ التحميل...</p>}

      {!loading && items.length === 0 && (
        <p style={{ color: "#9ca3af", padding: "2rem", textAlign: "center" }}>
          لا توجد {filter === "pending" ? "مقترحات معلّقة" : "سجلات"}.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: "0.875rem" }}>
        {items.map((item) => (
          <div
            key={item.id}
            style={{
              padding: "1rem 1.25rem",
              background: "#fff",
              borderRadius: "0.5rem",
              border: "1px solid #e5e7eb",
              boxShadow: "0 1px 3px rgba(0,0,0,.05)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.5rem",
                      borderRadius: "0.25rem",
                      ...(TYPE_COLORS[item.type as ContentType] ?? { bg: "#f3f4f6", color: "#374151" }),
                      background: (TYPE_COLORS[item.type as ContentType] ?? { bg: "#f3f4f6" }).bg,
                      color: (TYPE_COLORS[item.type as ContentType] ?? { color: "#374151" }).color,
                    }}
                  >
                    {item.type}
                  </span>
                </div>
                <p style={{ fontWeight: 600, margin: "0 0 0.25rem", color: "#0D1B2A", wordBreak: "break-word" }}>
                  {item.title}
                </p>
                <p style={{ color: "#6b7280", fontSize: "0.85rem", margin: "0 0 0.5rem", whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
                  {item.content.length > 300 ? `${item.content.slice(0, 300)}...` : item.content}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#9ca3af", margin: 0 }}>
                  {item.author ? `بقلم: ${item.author} · ` : ""}
                  {new Date(item.created_at).toLocaleDateString("ar-KW", { dateStyle: "medium" })}
                </p>
              </div>

              {filter === "pending" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", flexShrink: 0 }}>
                  <button
                    type="button"
                    disabled={acting === item.id}
                    onClick={() => act(item.id, "approve")}
                    style={{
                      padding: "0.4rem 0.875rem",
                      background: "#16a34a",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: acting === item.id ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: acting === item.id ? 0.6 : 1,
                    }}
                  >
                    موافقة
                  </button>
                  <button
                    type="button"
                    disabled={acting === item.id}
                    onClick={() => act(item.id, "reject")}
                    style={{
                      padding: "0.4rem 0.875rem",
                      background: "#dc2626",
                      color: "#fff",
                      border: "none",
                      borderRadius: "0.375rem",
                      fontSize: "0.8125rem",
                      fontWeight: 600,
                      cursor: acting === item.id ? "not-allowed" : "pointer",
                      fontFamily: "inherit",
                      opacity: acting === item.id ? 0.6 : 1,
                    }}
                  >
                    رفض
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
