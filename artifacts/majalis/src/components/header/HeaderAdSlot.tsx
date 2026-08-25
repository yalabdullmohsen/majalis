import { type MouseEvent } from "react";
import { Link } from "wouter";
import { headerAdConfig } from "@/config/header-ad";
import { openExternalUrl } from "@/lib/capacitor-utils";
import "@/styles/components/header-ad-slot.css";

function isInternalPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * كبسولة إعلان في منتصف الهيدر — نص فقط، بلا صور/سكربتات خارجية/popup.
 * الشركة → إنستقرام؛ «إعلان شراكة» → /support.
 */
export function HeaderAdSlot() {
  const cfg = headerAdConfig;
  if (!cfg.enabled) return null;

  const onSponsorClick = (e: MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    void openExternalUrl(cfg.sponsorUrl);
  };

  const partnerLabel = cfg.ctaLabel || cfg.badgeLabel;

  return (
    <div className="header-ad-slot" data-header-ad="1">
      <a
        href={cfg.sponsorUrl}
        className="header-ad-slot__sponsor"
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
      </a>
      {isInternalPath(cfg.ctaUrl) ? (
        <Link href={cfg.ctaUrl} className="header-ad-slot__cta" aria-label={partnerLabel}>
          {partnerLabel}
        </Link>
      ) : (
        <a
          href={cfg.ctaUrl}
          className="header-ad-slot__cta"
          aria-label={partnerLabel}
          rel={cfg.ctaUrl.startsWith("mailto:") ? undefined : "noopener noreferrer"}
        >
          {partnerLabel}
        </a>
      )}
    </div>
  );
}

/** اسم بديل للمواصفات */
export { HeaderAdSlot as HeaderAdBanner };
export { HeaderAdSlot as TopHeaderAdSlot };
