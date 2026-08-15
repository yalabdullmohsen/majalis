import { useEffect, useState } from "react";
import { CHUNK_RECOVERING_EVENT } from "@/lib/chunk-recovery";
import "@/styles/components/chunk-recovery-toast.css";

/**
 * مؤشر خفيف أثناء استعادة chunks بعد نشر — لا يجمّد الواجهة برسالة خطأ صلبة.
 */
export function ChunkRecoveryToast() {
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    const onRecover = (ev: Event) => {
      const detail = (ev as CustomEvent<{ message?: string }>).detail;
      setMessage(detail?.message || "تم تحديث المنصة، جاري تحسين العرض…");
    };
    window.addEventListener(CHUNK_RECOVERING_EVENT, onRecover);
    return () => window.removeEventListener(CHUNK_RECOVERING_EVENT, onRecover);
  }, []);

  if (!message) return null;

  return (
    <div
      className="chunk-recovery-toast"
      role="status"
      aria-live="polite"
      dir="rtl"
    >
      <span className="chunk-recovery-toast__dot" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
