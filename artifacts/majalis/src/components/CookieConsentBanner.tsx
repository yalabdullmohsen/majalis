import { useEffect } from "react";
import {
  applyConsentDataset,
  hasDecidedCookieConsent,
  writeCookieConsent,
} from "@/lib/cookie-consent";
import {
  hasSeenStorageNotice,
  markStorageNoticeSeen,
} from "@/lib/onboarding-state";

/**
 * لا بانر خصوصية عند التشغيل الأول — التخزين الضروري يعمل افتراضيًا،
 * وإدارة التحليلات متاحة من مركز الخصوصية في الإعدادات.
 * نُسجّل «شوهد» مرة واحدة بصمت حتى لا يتكرر أي شريط بعد reload.
 */
export function CookieConsentBanner() {
  useEffect(() => {
    applyConsentDataset();
    if (hasSeenStorageNotice()) return;
    markStorageNoticeSeen();
    if (!hasDecidedCookieConsent()) {
      writeCookieConsent({ preferences: true, analytics: false });
    }
  }, []);

  return null;
}
