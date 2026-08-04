import type { ReactNode } from "react";

type Props = {
  title: string;
  meta?: ReactNode;
  as?: "h2" | "h3";
};

export function IgdsSectionHeader({ title, meta, as: Tag = "h2" }: Props) {
  return (
    <div className="igds-section-header">
      <Tag className="igds-section-header__title">{title}</Tag>
      {meta ? <div className="igds-section-header__meta">{meta}</div> : null}
    </div>
  );
}
