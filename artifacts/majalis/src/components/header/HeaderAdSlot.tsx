import { headerAdConfig } from "@/config/header-ad";
import "@/styles/components/header-ad-slot.css";

/**
 * كبسولة إعلان في منتصف الهيدر — نص فقط، بلا صور/سكربتات خارجية/popup.
 * يُعرض بدل وردمارك «المجلس العلمي» عندما shouldShowHeaderAd = true.
 */
export function HeaderAdSlot() {
  const cfg = headerAdConfig;
  if (!cfg.enabled) return null;

  return (
    <a
      href={cfg.ctaUrl}
      className="header-ad-slot"
      aria-label={`${cfg.title} — ${cfg.ctaLabel}`}
      data-header-ad="1"
    >
      <span className="header-ad-slot__title">{cfg.title}</span>
      <span className="header-ad-slot__cta">{cfg.ctaLabel}</span>
    </a>
  );
}
