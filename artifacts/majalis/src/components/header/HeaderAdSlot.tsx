import { Link } from "wouter";
import { headerAdConfig } from "@/config/header-ad";
import "@/styles/components/header-ad-slot.css";

function isInternalPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

/**
 * كبسولة إعلان في منتصف الهيدر — نص فقط، بلا صور/سكربتات خارجية/popup.
 * العنصر الأساسي بدل عنوان «المجلس العلمي» في كل الصفحات ذات الهيدر العام.
 */
export function HeaderAdSlot() {
  const cfg = headerAdConfig;
  if (!cfg.enabled) return null;

  const label = `${cfg.title}. ${cfg.subtitle} — ${cfg.ctaLabel}`;
  const body = (
    <>
      <span className="header-ad-slot__badge" aria-hidden="true">
        إعلان
      </span>
      <span className="header-ad-slot__copy">
        <span className="header-ad-slot__title">{cfg.title}</span>
        {cfg.subtitle ? (
          <span className="header-ad-slot__subtitle">{cfg.subtitle}</span>
        ) : null}
      </span>
      <span className="header-ad-slot__cta">{cfg.ctaLabel}</span>
    </>
  );

  if (isInternalPath(cfg.ctaUrl)) {
    return (
      <Link
        href={cfg.ctaUrl}
        className="header-ad-slot"
        aria-label={label}
        data-header-ad="1"
      >
        {body}
      </Link>
    );
  }

  return (
    <a
      href={cfg.ctaUrl}
      className="header-ad-slot"
      aria-label={label}
      data-header-ad="1"
      rel={cfg.ctaUrl.startsWith("mailto:") ? undefined : "noopener noreferrer"}
    >
      {body}
    </a>
  );
}

/** اسم بديل للمواصفات */
export { HeaderAdSlot as HeaderAdBanner };
export { HeaderAdSlot as TopHeaderAdSlot };
