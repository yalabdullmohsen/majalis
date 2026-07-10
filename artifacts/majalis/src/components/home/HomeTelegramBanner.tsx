import { useState } from "react";
import { Send, X } from "lucide-react";

const LS_KEY = "mj-tg-banner-dismissed";

export function HomeTelegramBanner() {
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(LS_KEY) === "1"; } catch { return false; }
  });

  if (dismissed) return null;

  return (
    <div className="tg-banner" role="complementary" aria-label="قناة تيليجرام">
      <div className="tg-banner__icon" aria-hidden="true">
        <Send size={20} strokeWidth={2} />
      </div>
      <div className="tg-banner__body">
        <p className="tg-banner__title">تابع المستجدات فورًا</p>
        <p className="tg-banner__sub">اشترك في قناة تيليجرام لتصلك دروس وفتاوى ومستجدات المجلس العلمي</p>
      </div>
      <a
        href="https://t.me/majlisilm"
        target="_blank"
        rel="noopener noreferrer"
        className="tg-banner__cta"
        aria-label="اشترك في قناة تيليجرام المجلس العلمي"
      >
        اشترك
      </a>
      <button
        type="button"
        className="tg-banner__dismiss"
        onClick={() => {
          try { localStorage.setItem(LS_KEY, "1"); } catch { /* */ }
          setDismissed(true);
        }}
        aria-label="إغلاق"
      >
        <X size={14} strokeWidth={2.5} aria-hidden="true" />
      </button>
    </div>
  );
}
