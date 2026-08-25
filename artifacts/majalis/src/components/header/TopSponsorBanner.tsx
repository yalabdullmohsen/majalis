/**
 * شريط راعٍ/إعلان أعلى الهيدر — يظهر في الويب والتطبيق الأصلي.
 * بلا صور خارجية ولا سكربتات طرف ثالث؛ المصدر: headerAdConfig.
 */
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { headerAdConfig } from "@/config/header-ad";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import "@/styles/components/top-sponsor-banner.css";

function isInternalPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

export function TopSponsorBanner() {
  const [location] = useLocation();
  const cfg = headerAdConfig;
  // لا نخفي الشريط في فحوص الأتمتة: بوابة التباين تحتاج العنصر في DOM؛
  // المحتوى طرف أول ثابت وليس سكربت إعلان.
  const show =
    cfg.enabled &&
    (cfg.placement === "top" || cfg.placement === "both") &&
    !isImmersiveChromePath(location);

  useEffect(() => {
    const root = document.documentElement;
    if (!show) {
      root.removeAttribute("data-top-sponsor");
      root.style.setProperty("--ad-banner-height", "0px");
      return;
    }
    root.setAttribute("data-top-sponsor", "1");
    root.style.setProperty("--ad-banner-height", "var(--top-sponsor-content-h, 40px)");
    return () => {
      root.removeAttribute("data-top-sponsor");
      root.style.setProperty("--ad-banner-height", "0px");
    };
  }, [show]);

  if (!show) return null;

  const label = `${cfg.title}. ${cfg.subtitle} — ${cfg.ctaLabel}`;
  const body = (
    <>
      <span className="top-sponsor-banner__badge" aria-hidden="true">
        {cfg.badgeLabel}
      </span>
      <span className="top-sponsor-banner__copy">
        <span className="top-sponsor-banner__title">{cfg.title}</span>
        {cfg.subtitle ? (
          <span className="top-sponsor-banner__subtitle">{cfg.subtitle}</span>
        ) : null}
      </span>
      <span className="top-sponsor-banner__cta">{cfg.ctaLabel}</span>
    </>
  );

  const className = "top-sponsor-banner__link";

  return (
    <aside className="top-sponsor-banner" aria-label={cfg.title} data-top-sponsor-banner="1">
      <div className="top-sponsor-banner__inner">
        {isInternalPath(cfg.ctaUrl) ? (
          <Link href={cfg.ctaUrl} className={className} aria-label={label}>
            {body}
          </Link>
        ) : (
          <a
            href={cfg.ctaUrl}
            className={className}
            aria-label={label}
            rel={cfg.ctaUrl.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          >
            {body}
          </a>
        )}
      </div>
    </aside>
  );
}
