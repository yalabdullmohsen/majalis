/**
 * شريط راعٍ/إعلان أعلى الهيدر — يظهر في الويب والتطبيق الأصلي.
 * الضغط على الشركة → نافذة الشراكة؛ «إعلان شراكة» → /support.
 */
import { useEffect } from "react";
import { Link, useLocation } from "wouter";
import { headerAdConfig, TOP_SPONSOR_STATUS } from "@/config/header-ad";
import { applyPageChromeDom } from "@/lib/apply-page-chrome";
import { isImmersiveChromePath } from "@/lib/immersive-chrome";
import { openPartnershipAdModal } from "@/lib/partnership-ad-bus";
import "@/styles/components/top-sponsor-banner.css";

function isInternalPath(url: string): boolean {
  return url.startsWith("/") && !url.startsWith("//");
}

function resolveTheme(): "light" | "dark" {
  const root = document.documentElement;
  if (root.dataset.theme === "dark" || root.classList.contains("theme-dark")) {
    return "dark";
  }
  return "light";
}

function syncSponsorStatusBar() {
  const theme = resolveTheme();
  const status = TOP_SPONSOR_STATUS[theme];
  applyPageChromeDom(
    {
      statusBarColor: status.hex,
      statusBarColorHex: status.hex,
      statusBarStyle: status.style,
    },
    "top-sponsor",
  );
  void import("@capacitor/core").then(({ Capacitor }) => {
    if (!Capacitor.isNativePlatform()) return;
    void import("@capacitor/status-bar").then(({ StatusBar, Style }) => {
      const style = status.style === "dark" ? Style.Dark : Style.Light;
      void StatusBar.setStyle({ style });
      void StatusBar.setBackgroundColor({ color: status.hex }).catch(() => undefined);
    });
  });
}

export function TopSponsorBanner() {
  const [location] = useLocation();
  const cfg = headerAdConfig;
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
    root.style.setProperty("--ad-banner-height", "var(--top-sponsor-content-h, 48px)");
    syncSponsorStatusBar();

    const onTheme = () => syncSponsorStatusBar();
    window.addEventListener("mj-theme-change", onTheme);
    const mo = new MutationObserver(onTheme);
    mo.observe(root, { attributes: true, attributeFilter: ["data-theme", "class"] });

    return () => {
      root.removeAttribute("data-top-sponsor");
      root.style.setProperty("--ad-banner-height", "0px");
      window.removeEventListener("mj-theme-change", onTheme);
      mo.disconnect();
    };
  }, [show]);

  if (!show) return null;

  const partnerBody = (
    <span className="top-sponsor-banner__partner-label">{cfg.ctaLabel || cfg.badgeLabel}</span>
  );

  return (
    <aside
      className="top-sponsor-banner"
      aria-label={cfg.title}
      data-top-sponsor-banner="1"
    >
      <div className="top-sponsor-banner__inner">
        <button
          type="button"
          className="top-sponsor-banner__sponsor"
          aria-label={`${cfg.title} — ${cfg.topBarTapHint}`}
          onClick={() => openPartnershipAdModal()}
        >
          <span className="top-sponsor-banner__copy">
            <span className="top-sponsor-banner__title">{cfg.title}</span>
            {cfg.subtitle ? (
              <span className="top-sponsor-banner__subtitle">
                {cfg.subtitle}
                <span className="top-sponsor-banner__tap-hint" aria-hidden="true">
                  {" · "}
                  {cfg.topBarTapHint}
                </span>
              </span>
            ) : null}
          </span>
        </button>

        {isInternalPath(cfg.ctaUrl) ? (
          <Link
            href={cfg.ctaUrl}
            className="top-sponsor-banner__partner"
            aria-label={cfg.ctaLabel || cfg.badgeLabel}
          >
            {partnerBody}
          </Link>
        ) : (
          <a
            href={cfg.ctaUrl}
            className="top-sponsor-banner__partner"
            aria-label={cfg.ctaLabel || cfg.badgeLabel}
            rel={cfg.ctaUrl.startsWith("mailto:") ? undefined : "noopener noreferrer"}
          >
            {partnerBody}
          </a>
        )}
      </div>
    </aside>
  );
}
