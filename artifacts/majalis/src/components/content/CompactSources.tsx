import { useState } from "react";
import "@/styles/components/compact-sources.css";

export type CompactSourceItem = {
  /** السطر المختصر الظاهر افتراضيًا (كتاب — باب / مؤلف — كتاب) */
  summary: string;
  /** النص الكامل عند التوسيع — إن اختلف عن المختصر */
  detail?: string;
};

const DETAIL_THRESHOLD = 72;

function needsExpand(summary: string, detail?: string): boolean {
  const full = (detail || summary).trim();
  return full.length > DETAIL_THRESHOLD || Boolean(detail && detail.trim() !== summary.trim());
}

/**
 * عرض هادئ ومختصر للمصادر — أصغر من المتن، دون حذف المحتوى.
 */
export function CompactSources({
  title = "المصادر",
  items,
  className = "",
}: {
  title?: string;
  items: CompactSourceItem[];
  className?: string;
}) {
  if (!items.length) return null;
  return (
    <section className={`compact-sources ${className}`.trim()} aria-label={title}>
      <h2 className="compact-sources__title">{title}</h2>
      <ul className="compact-sources__list">
        {items.map((item, i) => (
          <CompactSourceRow key={`${item.summary}-${i}`} item={item} />
        ))}
      </ul>
    </section>
  );
}

function CompactSourceRow({ item }: { item: CompactSourceItem }) {
  const [open, setOpen] = useState(false);
  const expand = needsExpand(item.summary, item.detail);
  const full = (item.detail || item.summary).trim();

  return (
    <li className="compact-sources__item">
      <span className="compact-sources__text">{open && expand ? full : item.summary}</span>
      {expand ? (
        <button
          type="button"
          className="compact-sources__more"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? "إخفاء التفاصيل" : "عرض التفاصيل"}
        </button>
      ) : null}
    </li>
  );
}

/** يختصر نص مصدر طويل إلى «جزء أ — جزء ب» إن وُجدت فواصل شائعة. */
export function summarizeSourceLine(raw: string): CompactSourceItem {
  const text = String(raw || "").trim();
  if (!text) return { summary: "" };
  const parts = text.split(/\s*[—–\-·|]\s*/).map((p) => p.trim()).filter(Boolean);
  if (parts.length >= 2) {
    const summary = `${parts[0]} — ${parts[1]}`;
    return summary === text ? { summary } : { summary, detail: text };
  }
  if (text.length > DETAIL_THRESHOLD) {
    return { summary: `${text.slice(0, DETAIL_THRESHOLD - 1)}…`, detail: text };
  }
  return { summary: text };
}
