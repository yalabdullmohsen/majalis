/**
 * عنوان قسم موحّد لقصص الأنبياء — رمز صغير + عنوان + فاصل دقيق.
 */
import type { ReactNode } from "react";

type Props = {
  title: string;
  icon?: ReactNode;
  id?: string;
};

export function ProphetStorySectionHeader({ title, icon, id }: Props) {
  return (
    <div className="prophet-section-lux__header" data-component="ProphetStorySectionHeader">
      {icon ? <span className="prophet-section-lux__icon" aria-hidden="true">{icon}</span> : null}
      <h2 className="prophet-section-lux__title" id={id}>
        {title}
      </h2>
      <span className="prophet-section-lux__rule" aria-hidden="true" />
    </div>
  );
}
