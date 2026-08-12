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

/**
 * تنزيل خلفي لخطوط QPC عند الحاجة.
 * شريط/مؤشر التشخيص: تطوير فقط (أو ?fontDebug=1) — ممنوع في إنتاج الويب.
 */
function fontProgressUiAllowed(): boolean {
  if (import.meta.env.DEV) return true;
  try {
    return new URLSearchParams(window.location.search).get("fontDebug") === "1";
  } catch {
    return false;
  }
}

export function QpcFontPackBanner({ currentPage }: { currentPage: number }) {
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const [label, setLabel] = useState("جاري تجهيز خطوط المصحف…");
  const started = useRef(false);
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;
  const showUi = fontProgressUiAllowed();

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ac = new AbortController();

    void (async () => {
      const bundled = await localFontsAvailable();
      const meta = readFontPackMeta();
      /* ويب مع خطوط في الحزمة: لا تنزيل إجبار — التحميل الكسول يكفي */
      if (bundled && !isNative) return;
      /* أصلي بعد اكتمال الكاش: لا إعادة تنزيل */
      if (isNative && meta.completed >= QPC_PAGE_COUNT * 0.9) return;
      /* أصلي وما زالت الخطوط في الحزمة: لا تنزيل كامل */
      if (bundled && isNative && meta.completed > 0) return;

      if (showUi) setVisible(true);
      const priority = pagesInWindow(pageRef.current, 2);
      const rest = Array.from({ length: QPC_PAGE_COUNT }, (_, i) => i + 1).filter(
        (p) => !priority.includes(p),
      );
      if (showUi) setLabel("تنزيل خطوط المصحف (WOFF2)…");
      const result = await downloadQpcFontPack({
        pages: [...priority, ...rest],
        concurrency: isNative ? 2 : 4,
        signal: ac.signal,
        onProgress: (p) => {
          if (!showUi) return;
          setRatio(p.ratio);
          setLabel(`خطوط المصحف ${Math.round(p.ratio * 100)}٪`);
        },
      });
      if (!showUi) return;
      if (result.downloaded > 0) {
        setLabel("خطوط المصحف جاهزة للقراءة دون اتصال");
        setRatio(1);
        window.setTimeout(() => setVisible(false), 1800);
      } else {
        setLabel("تُحمَّل الخطوط عند الحاجة من الشبكة");
        window.setTimeout(() => setVisible(false), 2400);
      }
    })();

    return () => ac.abort();
  }, [showUi]);

  if (!visible || !showUi) return null;

  return (
    <div className="qpc-font-pack" role="status" aria-live="polite">
      <p className="qpc-font-pack__label">{label}</p>
      <div className="qpc-font-pack__track" aria-hidden="true">
        <div className="qpc-font-pack__fill" style={{ width: `${Math.round(ratio * 100)}%` }} />
      </div>
    </div>
  );
}
