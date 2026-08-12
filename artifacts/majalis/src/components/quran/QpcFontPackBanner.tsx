import { useEffect, useRef, useState } from "react";
import {
  downloadQpcFontPack,
  pagesInWindow,
  QPC_PAGE_COUNT,
  qpcFontLocalUrl,
  readFontPackMeta,
} from "@/lib/qpc-font-pack";
import { isNative } from "@/lib/capacitor-utils";
import { toArabicDigits } from "@/lib/utils";
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
 * مؤشّر تنزيل خطوط QPC — أسفل يمين، غير معيق، أرقام عربية.
 * يختفي عند الاكتمال ولا يغطي رأس الصفحة أبدًا.
 */
export function QpcFontPackBanner({ currentPage }: { currentPage: number }) {
  const [visible, setVisible] = useState(false);
  const [ratio, setRatio] = useState(0);
  const started = useRef(false);
  const pageRef = useRef(currentPage);
  pageRef.current = currentPage;

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const ac = new AbortController();

    void (async () => {
      const bundled = await localFontsAvailable();
      const meta = readFontPackMeta();
      if (bundled && !isNative) return;
      if (isNative && meta.completed >= QPC_PAGE_COUNT * 0.9) return;
      if (bundled && isNative && meta.completed > 0) return;

      setVisible(true);
      /* أولوية: الجزء ١ (١–٢٠) والجزء ٣٠ (٥٨٢–٦٠٤) + جوار الصفحة الحالية */
      const part1 = Array.from({ length: 20 }, (_, i) => i + 1);
      const part30 = Array.from({ length: 23 }, (_, i) => 582 + i);
      const near = pagesInWindow(pageRef.current, 2);
      const priority = [...new Set([...near, ...part1, ...part30])];
      const rest = Array.from({ length: QPC_PAGE_COUNT }, (_, i) => i + 1).filter(
        (p) => !priority.includes(p),
      );
      const result = await downloadQpcFontPack({
        pages: [...priority, ...rest],
        concurrency: isNative ? 2 : 4,
        signal: ac.signal,
        onProgress: (p) => {
          setRatio(p.ratio);
        },
      });
      if (result.downloaded > 0) {
        setRatio(1);
        window.setTimeout(() => setVisible(false), 1200);
      } else {
        window.setTimeout(() => setVisible(false), 1800);
      }
    })();

    return () => ac.abort();
  }, []);

  if (!visible) return null;

  const pct = Math.round(ratio * 100);

  return (
    <div
      className="qpc-font-pack qpc-font-pack--corner"
      role="status"
      aria-live="polite"
      aria-label={`تنزيل خطوط المصحف ${toArabicDigits(pct)} بالمئة`}
      data-font-progress="corner"
    >
      <span className="qpc-font-pack__pct">{toArabicDigits(pct)}٪</span>
    </div>
  );
}
