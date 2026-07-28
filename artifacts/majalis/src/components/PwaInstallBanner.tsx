import { useEffect, useState } from "react";

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "mj-pwa-install-dismissed-v1";

/**
 * Soft install banner for Chromium browsers that fire beforeinstallprompt.
 * iOS users already get Add-to-Home-Screen guidance via apple-mobile meta.
 * Styles load via dynamic import so they stay out of critical CSS budget.
 */
export function PwaInstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    void import("@/styles/components/mobile-pwa.css");
  }, []);

  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISS_KEY) === "1") return;
    } catch { /* ignore */ }

    const standalone =
      window.matchMedia("(display-mode: standalone)").matches ||
      // iOS Safari
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (standalone) return;

    const onBip = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
      setVisible(true);
    };
    window.addEventListener("beforeinstallprompt", onBip);
    return () => window.removeEventListener("beforeinstallprompt", onBip);
  }, []);

  if (!visible || !deferred) return null;

  const dismiss = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, "1"); } catch { /* ignore */ }
  };

  const install = async () => {
    await deferred.prompt();
    try {
      const choice = await deferred.userChoice;
      if (choice.outcome === "accepted") dismiss();
      else setVisible(false);
    } catch {
      setVisible(false);
    }
  };

  return (
    <div className="pwa-soft-banner" role="dialog" aria-label="تثبيت التطبيق">
      <div className="pwa-soft-banner__text">
        <strong>ثبّت المجلس العلمي</strong>
        <span>تجربة أسرع كتطبيق على جهازك</span>
      </div>
      <button type="button" className="pwa-soft-banner__btn" onClick={() => void install()}>
        تثبيت
      </button>
      <button type="button" className="pwa-soft-banner__dismiss" onClick={dismiss} aria-label="إغلاق">
        ×
      </button>
    </div>
  );
}

export default PwaInstallBanner;
