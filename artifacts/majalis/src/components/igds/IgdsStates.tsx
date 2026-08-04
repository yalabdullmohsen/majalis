import { IgdsButton } from "./IgdsButton";

export function IgdsLoadingState({ label = "جاري التحميل…" }: { label?: string }) {
  return (
    <div className="igds-state" role="status" aria-live="polite" aria-busy="true">
      <IgdsSkeleton lines={3} />
      <p className="igds-state__desc">{label}</p>
    </div>
  );
}

export function IgdsEmptyState({
  title = "لا يوجد محتوى",
  description = "لا توجد عناصر للعرض حالياً.",
  actionLabel,
  actionHref,
}: {
  title?: string;
  description?: string;
  actionLabel?: string;
  actionHref?: string;
}) {
  return (
    <div className="igds-state" role="status">
      <h2 className="igds-state__title">{title}</h2>
      <p className="igds-state__desc">{description}</p>
      {actionLabel && actionHref ? (
        <IgdsButton href={actionHref} variant="secondary">
          {actionLabel}
        </IgdsButton>
      ) : null}
    </div>
  );
}

export function IgdsErrorState({
  title = "تعذّر التحميل",
  description = "حدث خطأ أثناء جلب البيانات. حاول مرة أخرى.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="igds-state" role="alert">
      <h2 className="igds-state__title">{title}</h2>
      <p className="igds-state__desc">{description}</p>
      {onRetry ? (
        <IgdsButton type="button" variant="primary" onClick={onRetry}>
          إعادة المحاولة
        </IgdsButton>
      ) : null}
    </div>
  );
}

export function IgdsSkeleton({ lines = 3, hero }: { lines?: number; hero?: boolean }) {
  return (
    <div className="igds-skeleton" aria-hidden="true">
      {hero ? <div className="igds-skeleton__line igds-skeleton__line--lg" /> : null}
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="igds-skeleton__line"
          style={{ width: `${90 - i * 12}%` }}
        />
      ))}
    </div>
  );
}
