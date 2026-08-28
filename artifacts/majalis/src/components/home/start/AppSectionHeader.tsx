import type { ReactNode } from "react";

type Props = {
  title: string;
  action?: ReactNode;
  className?: string;
};

export function AppSectionHeader({ title, action, className }: Props) {
  return (
    <header className={["mj-app-section-header", className].filter(Boolean).join(" ")}>
      <h2 className="mj-app-section-header__title">{title}</h2>
      {action ? <div className="mj-app-section-header__action">{action}</div> : null}
    </header>
  );
}
