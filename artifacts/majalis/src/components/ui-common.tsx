import { C } from "@/lib/theme";

export function PageHeader({ eyebrow, title, subtitle }: { eyebrow?: string; title: string; subtitle?: string }) {
  return (
    <div style={{ marginBottom: "1.5rem" }}>
      {eyebrow && <p style={{ fontSize: "0.875rem", marginBottom: "0.5rem", color: C.brassDeep }}>{eyebrow}</p>}
      <h1 style={{ fontSize: "1.5rem", fontWeight: 700, marginBottom: "0.75rem", color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>
        {title}
      </h1>
      {subtitle && <p style={{ fontSize: "0.875rem", lineHeight: "1.75", color: C.inkSoft }}>{subtitle}</p>}
    </div>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ borderRadius: "0.375rem", border: `1px solid ${C.line}`, padding: "1.25rem", background: C.panel }}>
      {children}
    </div>
  );
}

export function Loading() {
  return <p style={{ textAlign: "center", padding: "2.5rem 0", color: C.inkSoft }}>جارٍ التحميل...</p>;
}

export function Empty({ text }: { text: string }) {
  return <p style={{ textAlign: "center", padding: "2.5rem 0", color: C.inkSoft }}>{text}</p>;
}

export function Chip({ active, children, onClick }: { active?: boolean; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={
        active
          ? { fontSize: "0.875rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.emerald}`, background: C.emerald, color: C.parchment, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }
          : { fontSize: "0.875rem", padding: "0.375rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, color: C.inkSoft, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }
      }
    >
      {children}
    </button>
  );
}
