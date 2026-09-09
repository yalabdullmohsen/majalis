import { useId, type ReactNode } from "react";
import "@/styles/components/reading-section-card.css";

export type ReadingSectionVariant =
  | "default"
  | "summary"
  | "lessons"
  | "sources"
  | "related";

type ReadingSectionCardProps = {
  title: string;
  children: ReactNode;
  variant?: ReadingSectionVariant;
  className?: string;
  as?: "section" | "div";
};

/**
 * بطاقة قسم قراءة — إطار هادئ للنصوص الطويلة دون تغيير المحتوى.
 */
export function ReadingSectionCard({
  title,
  children,
  variant = "default",
  className = "",
  as: Tag = "section",
}: ReadingSectionCardProps) {
  const uid = useId();
  const titleId = `rsc-title-${uid.replace(/:/g, "")}`;
  return (
    <Tag
      className={`rsc rsc--${variant}${className ? ` ${className}` : ""}`}
      aria-labelledby={titleId}
    >
      <h2 id={titleId} className="rsc__title">
        {title}
      </h2>
      <div className="rsc__body">{children}</div>
    </Tag>
  );
}

type ReadingProseProps = {
  text: string;
  className?: string;
};

/** فقرة/نص طويل مع الحفاظ على فواصل الأسطر في البيانات. */
export function ReadingProse({ text, className = "" }: ReadingProseProps) {
  return (
    <p className={`rsc__prose${className ? ` ${className}` : ""}`}>{text}</p>
  );
}

type ReadingBulletListProps = {
  items: string[];
  className?: string;
};

export function ReadingBulletList({ items, className = "" }: ReadingBulletListProps) {
  if (!items.length) return null;
  return (
    <ul className={`rsc-list${className ? ` ${className}` : ""}`}>
      {items.map((item) => (
        <li key={item} className="rsc-list__item">
          {item}
        </li>
      ))}
    </ul>
  );
}
