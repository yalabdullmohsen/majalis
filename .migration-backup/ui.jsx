"use client";
// =====================================================================
//  components/ui.jsx — مكوّنات صغيرة مشتركة
// =====================================================================

import { C } from "@/lib/theme";

export function PageHeader({ eyebrow, title, subtitle }) {
  return (
    <div className="mb-6">
      {eyebrow && <p className="text-sm mb-2" style={{ color: C.brassDeep }}>{eyebrow}</p>}
      <h1 className="text-2xl font-bold mb-3" style={{ color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>
        {title}
      </h1>
      {subtitle && <p className="text-sm leading-relaxed" style={{ color: C.inkSoft }}>{subtitle}</p>}
    </div>
  );
}

export function Card({ children }) {
  return (
    <div className="rounded-md border p-5" style={{ borderColor: C.line, background: C.panel }}>
      {children}
    </div>
  );
}

export function Loading() {
  return <p className="text-center py-10" style={{ color: C.inkSoft }}>جارٍ التحميل...</p>;
}

export function Empty({ text }) {
  return <p className="text-center py-10" style={{ color: C.inkSoft }}>{text}</p>;
}

export function Chip({ active, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="text-sm px-3 py-1.5 rounded-md border whitespace-nowrap"
      style={
        active
          ? { background: C.emerald, color: C.parchment, borderColor: C.emerald }
          : { background: C.panel, color: C.inkSoft, borderColor: C.line }
      }
    >
      {children}
    </button>
  );
}
