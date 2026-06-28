import { useEffect, useMemo, useState } from "react";
import { adminGetAllContactMessages, adminUpdateContactMessage } from "@/lib/platform-supabase";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminSectionToolbar } from "./AdminSectionToolbar";
import { useAdminShell } from "./AdminShell";

const STATUS_LABELS: Record<string, string> = {
  new: "جديد",
  read: "مقروء",
  in_progress: "قيد المعالجة",
  resolved: "تم الحل",
  archived: "مؤرشف",
};

export function ContactMessagesSection() {
  const { showSuccess, showError } = useAdminShell();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");

  const load = () => {
    setLoading(true);
    adminGetAllContactMessages()
      .then(({ data }) => setItems(data))
      .finally(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    if (statusFilter === "all") return items;
    return items.filter((i) => i.status === statusFilter);
  }, [items, statusFilter]);

  const updateStatus = async (id: string, status: string) => {
    const patch: Record<string, unknown> = { status };
    if (status === "resolved") patch.resolved_at = new Date().toISOString();
    const { error } = await adminUpdateContactMessage(id, patch);
    if (error) return showError(error.message);
    showSuccess("تم التحديث");
    load();
  };

  return (
    <div>
      <AdminSectionToolbar title={`رسائل التواصل (${filtered.length})`} />
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value)}
        style={{ marginBottom: "1rem", padding: "0.5rem" }}
      >
        <option value="all">كل الرسائل</option>
        {Object.entries(STATUS_LABELS).map(([k, v]) => (
          <option key={k} value={k}>{v}</option>
        ))}
      </select>
      {loading ? <Loading /> : filtered.length === 0 ? (
        <p style={{ color: C.inkSoft }}>لا توجد رسائل.</p>
      ) : filtered.map((item) => (
        <div key={item.id} style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.375rem", padding: "1rem", marginBottom: "0.75rem" }}>
          <strong>{item.subject}</strong> — {item.name} ({item.email})
          <p style={{ margin: "0.5rem 0", fontSize: "0.875rem" }}>{item.message}</p>
          <div style={{ fontSize: "0.75rem", color: C.inkSoft }}>
            {STATUS_LABELS[item.status] || item.status} · {item.category} · {new Date(item.created_at).toLocaleString("ar-KW")}
          </div>
          <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
            {item.status === "new" && <button onClick={() => updateStatus(item.id, "read")} style={{ fontSize: "0.75rem" }}>تعليم كمقروء</button>}
            {item.status !== "in_progress" && item.status !== "resolved" && <button onClick={() => updateStatus(item.id, "in_progress")} style={{ fontSize: "0.75rem" }}>قيد المعالجة</button>}
            {item.status !== "resolved" && <button onClick={() => updateStatus(item.id, "resolved")} style={{ fontSize: "0.75rem" }}>تم الحل</button>}
            <button onClick={() => updateStatus(item.id, "archived")} style={{ fontSize: "0.75rem" }}>أرشفة</button>
          </div>
        </div>
      ))}
    </div>
  );
}
