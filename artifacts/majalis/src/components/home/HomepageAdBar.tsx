import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { homepageAdConfig } from "@/config/homepage-ad";
import { dismissHomepageAd, isHomepageAdDismissed } from "@/lib/homepage-ad-dismiss";

/**
 * شريط إعلاني/رعاية أعلى الهيدر — الصفحة الرئيسية فقط (يُستدعى من AppShell).
 * بلا popup ولا سكربتات خارجية؛ التحكم عبر homepageAdConfig.
 */
export function HomepageAdBar() {
  const cfg = homepageAdConfig;
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    if (!cfg.enabled) return false;
    if (navigator.webdriver) return false;
    return !isHomepageAdDismissed();
  });

  useEffect(() => {
    void import("@/styles/components/homepage-ad-bar.css");
  }, []);

  useEffect(() => {
    if (!visible) return;
    const root = document.documentElement;
    root.setAttribute("data-home-ad", "1");
    root.style.setProperty("--ad-banner-height", "var(--homepage-ad-bar-h, 48px)");
    return () => {
      root.removeAttribute("data-home-ad");
      root.style.setProperty("--ad-banner-height", "0px");
    };
  }, [visible]);

  if (!cfg.enabled || !visible) return null;

  const close = () => {
    dismissHomepageAd();
    setVisible(false);
  };

  return (
    <aside
      className="homepage-ad-bar"
      aria-label={cfg.label}
      data-sponsor={cfg.sponsorName || undefined}
    >
      <div className="homepage-ad-bar__inner">
        {cfg.image ? (
          <img
            className="homepage-ad-bar__logo"
            src={cfg.image}
            alt={cfg.sponsorName ? `شعار ${cfg.sponsorName}` : ""}
            width={32}
            height={32}
            loading="lazy"
            decoding="async"
          />
        ) : null}

        <span className="homepage-ad-bar__badge">{cfg.label}</span>

        <div className="homepage-ad-bar__copy">
          <p className="homepage-ad-bar__title">{cfg.title}</p>
          <p className="homepage-ad-bar__desc">{cfg.description}</p>
        </div>

        <a href={cfg.ctaUrl} className="homepage-ad-bar__cta">
          {cfg.ctaLabel}
        </a>

        <button
          type="button"
          className="homepage-ad-bar__close"
          onClick={close}
          aria-label="إغلاق شريط الإعلان لمدة 24 ساعة"
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      </div>
    </aside>
  );
}
