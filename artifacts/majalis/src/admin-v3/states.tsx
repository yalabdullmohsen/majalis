import type { ReactNode } from "react";

export function AdminV3Loading({ label = "تجهيز…" }: { label?: string }) {
  return (
    <div className="av3-state av3-state--loading" role="status" aria-live="polite" aria-busy="true">
      <p>{label}</p>
    </div>
  );
}

export function AdminV3Empty({
  title = "لا يوجد محتوى هنا بعد",
  body = "سيُبنى هذا المركز في موجة لاحقة. يمكنك فتح اللوحة السابقة إن لزم.",
  action,
}: {
  title?: string;
  body?: string;
  action?: ReactNode;
}) {
  return (
    <div className="av3-state av3-state--empty" role="status">
      <h2 className="av3-state__title">{title}</h2>
      <p className="av3-state__body">{body}</p>
      {action ? <div className="av3-state__action">{action}</div> : null}
    </div>
  );
}

export function AdminV3Offline() {
  return (
    <div className="av3-state av3-state--offline" role="status">
      <h2 className="av3-state__title">أنت غير متصل</h2>
      <p className="av3-state__body">تحقق من الشبكة ثم أعد المحاولة.</p>
    </div>
  );
}

export function AdminV3ErrorState({
  message = "تعذّر عرض هذا الجزء.",
  onRetry,
}: {
  message?: string;
  onRetry?: () => void;
}) {
  return (
    <div className="av3-state av3-state--error" role="alert">
      <h2 className="av3-state__title">حدث خطأ</h2>
      <p className="av3-state__body">{message}</p>
      {onRetry ? (
        <button type="button" className="av3-btn" onClick={onRetry}>
          إعادة المحاولة
        </button>
      ) : null}
    </div>
  );
}
