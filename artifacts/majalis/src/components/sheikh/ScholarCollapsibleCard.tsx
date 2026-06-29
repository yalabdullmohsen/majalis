import { useState, type ReactNode } from "react";

type Props = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
  id?: string;
};

export function ScholarCollapsibleCard({ title, count, defaultOpen = false, children, id }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className="scholar-collapse-card" id={id}>
      <button
        type="button"
        className="scholar-collapse-header"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span className="scholar-collapse-title">
          {title}
          {count != null && count > 0 && <span className="scholar-collapse-count">({count})</span>}
        </span>
        <span className="scholar-collapse-chevron" aria-hidden>
          {open ? "▲" : "▼"}
        </span>
      </button>
      {open && <div className="scholar-collapse-body">{children}</div>}
    </section>
  );
}
