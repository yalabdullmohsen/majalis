import { C } from "@/lib/theme";

interface AdminModalProps {
  title: string;
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  saving?: boolean;
  children: React.ReactNode;
}

export const inputSt: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", padding: "0.5rem 0.75rem",
  borderRadius: "0.375rem", border: `1px solid ${C.line}`,
  background: C.panel, color: C.ink, fontSize: "0.875rem", fontFamily: "inherit",
  outline: "none",
};
export const selectSt: React.CSSProperties = { ...inputSt, cursor: "pointer" };
export const textareaSt: React.CSSProperties = { ...inputSt, minHeight: "5rem", resize: "vertical" as const };

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: "0.875rem" }}>
      <label style={{ display: "block", fontSize: "0.8125rem", fontWeight: 600, color: C.emeraldDeep, marginBottom: "0.3rem" }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export function FieldRow({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
      {children}
    </div>
  );
}

export function AdminModal({ title, open, onClose, onSave, saving, children }: AdminModalProps) {
  if (!open) return null;
  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(36,31,24,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
      onClick={onClose}
    >
      <div
        style={{ width: "100%", maxWidth: "40rem", background: C.parchment, borderRadius: "0.5rem", border: `1px solid ${C.line}`, maxHeight: "90vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
        onClick={e => e.stopPropagation()}
      >
        <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, fontSize: "1.25rem", lineHeight: 1, padding: "0.25rem 0.5rem" }}>✕</button>
          <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>{title}</h2>
        </div>
        <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
          {children}
        </div>
        <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${C.line}`, display: "flex", gap: "0.625rem", justifyContent: "flex-start", flexShrink: 0 }}>
          <button
            onClick={onSave}
            disabled={saving}
            style={{ padding: "0.5rem 1.5rem", borderRadius: "0.375rem", border: "none", background: saving ? C.sage : C.emerald, color: C.parchment, cursor: saving ? "default" : "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}
          >
            {saving ? "جارٍ الحفظ..." : "حفظ التغييرات"}
          </button>
          <button
            onClick={onClose}
            disabled={saving}
            style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, color: C.inkSoft, cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem" }}
          >
            إلغاء
          </button>
        </div>
      </div>
    </div>
  );
}
