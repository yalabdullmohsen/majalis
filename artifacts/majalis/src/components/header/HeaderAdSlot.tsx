import { type MouseEvent } from "react";
import { headerAdConfig } from "@/config/header-ad";
import { openExternalUrl } from "@/lib/capacitor-utils";
import "@/styles/components/header-ad-slot.css";

/**
 * Banner إعلان شراكة داخل الهيدر فقط — رابط الشراكات في صفحة التواصل.
 */
export function HeaderAdSlot() {
  const cfg = headerAdConfig;
  if (!cfg.enabled) return null;

  const onSponsorClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    void openExternalUrl(cfg.sponsorUrl);
  };

  return (
    <div className="header-ad-slot" data-header-ad="1">
      <a
        href={cfg.sponsorUrl}
        className="header-ad-slot__banner"
        aria-label={cfg.sponsorAriaLabel}
        target="_blank"
        rel="noopener noreferrer"
        onClick={onSponsorClick}
      >
        <span className="header-ad-slot__copy">
          <span className="header-ad-slot__title">{cfg.title}</span>
          {cfg.subtitle ? (
            <span className="header-ad-slot__subtitle">{cfg.subtitle}</span>
          ) : null}
        </span>
        <span className="header-ad-slot__badge">{cfg.badgeLabel}</span>
      </a>
    </div>
  );
}

export { HeaderAdSlot as HeaderAdBanner };
export { HeaderAdSlot as TopHeaderAdSlot };
