import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";
import { IgdsButton } from "./IgdsButton";

type Props = {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  actions?: ReactNode;
};

export function IgdsPageHeader({
  title,
  description,
  backHref,
  backLabel = "رجوع",
  actions,
}: Props) {
  return (
    <header className="igds-page-header">
      <div className="igds-page-header__row">
        {backHref ? (
          <IgdsButton href={backHref} variant="ghost" iconOnly className="igds-page-header__back" aria-label={backLabel}>
            <ArrowRight size={18} strokeWidth={1.8} aria-hidden="true" />
          </IgdsButton>
        ) : null}
        <div className="igds-stack igds-page-header__copy">
          <h1 className="igds-page-header__title">{title}</h1>
          {description ? <p className="igds-page-header__desc">{description}</p> : null}
        </div>
        {actions}
      </div>
    </header>
  );
}
