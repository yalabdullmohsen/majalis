import { useEffect, useState } from "react";
import { Link } from "wouter";
import {
  applyConsentDataset,
  hasDecidedCookieConsent,
  readCookieConsent,
  writeCookieConsent,
  type CookieConsentState,
} from "@/lib/cookie-consent";
import "@/styles/components/cookie-consent.css";

/**
 * Soft consent banner — necessary cookies always on;
 * analytics opt-in only. Non-blocking for core reading.
 */
export function CookieConsentBanner() {
  const [open, setOpen] = useState(false);
  const [customize, setCustomize] = useState(false);
  const [draft, setDraft] = useState<CookieConsentState>(() => readCookieConsent());

  useEffect(() => {
    applyConsentDataset();
    if (!hasDecidedCookieConsent()) setOpen(true);
  }, []);

  if (!open) return null;

  const acceptAll = () => {
    writeCookieConsent({ preferences: true, analytics: true });
    setOpen(false);
  };

  const necessaryOnly = () => {
    writeCookieConsent({ preferences: true, analytics: false });
    setOpen(false);
  };

  const saveCustom = () => {
    writeCookieConsent({
      preferences: draft.preferences,
      analytics: draft.analytics,
    });
    setOpen(false);
  };

  return (
    <div className="cookie-consent" role="dialog" aria-labelledby="cookie-consent-title" aria-modal="false">
      <div className="cookie-consent__inner">
        <h2 id="cookie-consent-title" className="cookie-consent__title">
          تفضيلات الخصوصية
        </h2>
        <p className="cookie-consent__text">
          نستخدم تخزينًا ضروريًا لتشغيل المنصة (الجلسة والتفضيلات المحلية). التتبع التحليلي اختياري ولا يُفعَّل إلا بموافقتك.{" "}
          <Link href="/privacy-center" className="cookie-consent__link">
            مركز الخصوصية
          </Link>
        </p>

        {customize && (
          <div className="cookie-consent__opts" role="group" aria-label="تخصيص الموافقة">
            <label className="cookie-consent__opt">
              <input type="checkbox" checked disabled />
              <span>ضروري (مطلوب)</span>
            </label>
            <label className="cookie-consent__opt">
              <input
                type="checkbox"
                checked={draft.preferences}
                onChange={(e) => setDraft((d) => ({ ...d, preferences: e.target.checked }))}
              />
              <span>تفضيلات الواجهة المحلية</span>
            </label>
            <label className="cookie-consent__opt">
              <input
                type="checkbox"
                checked={draft.analytics}
                onChange={(e) => setDraft((d) => ({ ...d, analytics: e.target.checked }))}
              />
              <span>تحليلات اختيارية (بدون بيع بيانات)</span>
            </label>
          </div>
        )}

        <div className="cookie-consent__actions">
          {customize ? (
            <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={saveCustom}>
              حفظ اختياراتي
            </button>
          ) : (
            <>
              <button type="button" className="cookie-consent__btn cookie-consent__btn--primary" onClick={acceptAll}>
                قبول الكل
              </button>
              <button type="button" className="cookie-consent__btn" onClick={necessaryOnly}>
                الضروري فقط
              </button>
              <button type="button" className="cookie-consent__btn cookie-consent__btn--ghost" onClick={() => setCustomize(true)}>
                تخصيص
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
