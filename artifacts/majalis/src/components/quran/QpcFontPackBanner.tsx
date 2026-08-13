import { useEffect, useRef, useState } from "react";
import {
  downloadQpcFontPack,
  pagesInWindow,
  QPC_PAGE_COUNT,
  qpcFontLocalUrl,
  readFontPackMeta,
} from "@/lib/qpc-font-pack";
import { isNative } from "@/lib/capacitor-utils";
import "@/styles/components/qpc-font-pack-banner.css";

async function localFontsAvailable(): Promise<boolean> {
  try {
    const res = await fetch(qpcFontLocalUrl(1), { method: "HEAD", cache: "no-store" });
    return res.ok;
  } catch {
    return false;
  }
}

type Props = {
  currentPage: number;
  /**
   * `sheet` — داخل إعدادات القراءة فقط (الافتراضي المطلوب).
   * لا يظهر كشريط علوي فوق الحبر أبدًا.
   */
  variant?: "sheet" | "overlay";
};

/**
 * تقدّم تنزيل خطوط QPC — في شيت الإعدادات فقط.
 * يختفي بعد ١٫٥ ثانية من آخر تفاعل/اكتمال، ولا يتراكب مع الحبر.
 */
export function QpcFontPackBanner({ currentPage, variant = "sheet" }: Props) {
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [label, setLabel] = useState("جاري تجهيز خطوط المصحف…");
  const [busy, setBusy] = useState(false);
  const started = useRef(false);
  const hideTimer = useRef(0);
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  const scheduleHide = (ms = 1500) => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setVisible(false), ms);
  };

  const bumpInteraction = () => {
    setVisible(true);
    scheduleHide(1500);
  };

  useEffect(() => {
    if (variant !== "sheet") return;
    if (started.current) return;
    started.current = true;
    const ac = new AbortController();

    void (async () => {
      const bundled = await localFontsAvailable();
      const meta = readFontPackMeta();
      if (bundled && !isNative) return;
      if (isNative && meta.completed >= QPC_PAGE_COUNT * 0.9) return;
      if (bundled && isNative && meta.completed > 0) return;

      setBusy(true);
      setVisible(true);
      const priority = pagesInWindow(pageRef.current, 2);
      const rest = Array.from({ length: QPC_PAGE_COUNT }, (_, i) => i + 1).filter(
        (p) => !priority.includes(p),
      );
      setLabel("تنزيل خطوط المصحف (WOFF2)…");
      const result = await downloadQpcFontPack({
        pages: [...priority, ...rest],
        concurrency: isNative ? 2 : 4,
        signal: ac.signal,
        onProgress: (p) => {
          setRatio(p.ratio);
          setLabel(`خطوط المصحف ${Math.round(p.ratio * 100)}٪`);
          bumpInteraction();
        },
      });
      setBusy(false);
      if (result.downloaded > 0) {
        setLabel("خطوط المصحف جاهزة للقراءة دون اتصال");
        setRatio(1);
      } else {
        setLabel("تُحمَّل الخطوط عند الحاجة من الشبكة");
      }
      scheduleHide(1500);
    })();

    return () => {
      ac.abort();
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [variant]);

  /* ممنوع الظهور كشريط علوي فوق الصفحة */
  if (variant !== "sheet") return null;
  if (!visible && !busy) {
    return (
      <button
        type="button"
        className="qpc-font-pack qpc-font-pack--sheet qpc-font-pack--idle"
        onClick={() => {
          setVisible(true);
          scheduleHide(1500);
        }}
      >
        تحقق من خطوط المصحف
      </button>
    );
  }

  return (
    <div
      className="qpc-font-pack qpc-font-pack--sheet"
      role="status"
      aria-live="polite"
      data-font-pack-ui="sheet"
      onPointerDown={bumpInteraction}
    >
      <p className="qpc-font-pack__label">{label}</p>
      <div className="qpc-font-pack__track" aria-hidden="true">
        <div className="qpc-font-pack__fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}
