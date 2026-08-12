import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  applyConsentDataset,
  hasDecidedCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";
import "@/styles/components/cookie-consent.css";

/**
 * شريط خصوصية خفيف غير حاجب — الضروري يعمل افتراضيًا،
 * والتحليلات تبقى اختيارية عبر مركز الخصوصية.
 */
export function CookieConsentBanner() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    applyConsentDataset();
    if (!hasDecidedCookieConsent()) setOpen(true);
  }, []);

  if (!open) return null;

  const continueNecessary = () => {
    writeCookieConsent({ preferences: true, analytics: false });
    setOpen(false);
  };

  return (
    <aside
      className="cookie-consent cookie-consent--subtle"
      role="region"
      aria-labelledby="cookie-consent-title"
    >
      <div className="cookie-consent__inner">
        <p id="cookie-consent-title" className="cookie-consent__text cookie-consent__text--compact">
          نستخدم تخزينًا ضروريًا للتشغيل. التحليلات اختيارية.{" "}
          <Link href="/privacy-center" className="cookie-consent__link" onClick={continueNecessary}>
            مركز الخصوصية
          </Link>
        </p>
        <div className="cookie-consent__actions cookie-consent__actions--compact">
          <button
            type="button"
            className="cookie-consent__btn cookie-consent__btn--primary"
            onClick={continueNecessary}
          >
            متابعة
          </button>
        </div>
      </div>
    </aside>
  );
}
