import { useEffect, useState } from "react";
import type { EarnedBadge } from "@/lib/user-profile-service";

type Props = {
  badges: EarnedBadge[];
  onDismiss: () => void;
};

export function AchievementToast({ badges, onDismiss }: Props) {
  const [visible, setVisible] = useState(false);
  const badge = badges[0];

  useEffect(() => {
    const show = requestAnimationFrame(() => setVisible(true));
    const hide = setTimeout(() => {
      setVisible(false);
      setTimeout(onDismiss, 350);
    }, 4500);
    return () => {
      cancelAnimationFrame(show);
      clearTimeout(hide);
    };
  }, [onDismiss]);

  if (!badge) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`at-toast${visible ? " at-toast--visible" : ""}`}
    >
      <span className="at-icon">{badge.icon}</span>
      <div className="at-body">
        <p className="at-label">إنجاز جديد</p>
        <p className="at-title">{badge.titleAr}</p>
        {badge.descAr && <p className="at-desc">{badge.descAr}</p>}
        {badges.length > 1 && (
          <p className="at-more">+{badges.length - 1} إنجازات أخرى</p>
        )}
      </div>
      <button
        type="button"
        onClick={() => { setVisible(false); setTimeout(onDismiss, 350); }}
        aria-label="إغلاق"
        className="at-close"
      >
        ×
      </button>
    </div>
  );
}
