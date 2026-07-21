import { useCallback, useEffect, useRef, useState } from "react";
import { toPng } from "html-to-image";

type Props = {
  text: string;
  source?: string;
  category?: string;
  onClose: () => void;
};

export function FaidaImageCardModal({ text, source, category, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<"idle" | "generating" | "done" | "error">("idle");

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleDownload = useCallback(async () => {
    if (!cardRef.current) return;
    setStatus("generating");
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const link = document.createElement("a");
      link.download = `فائدة-المجلس-العلمي.png`;
      link.href = dataUrl;
      link.click();
      setStatus("done");
    } catch {
      setStatus("error");
    }
  }, []);

  const handleShare = useCallback(async () => {
    if (!cardRef.current) return;
    setStatus("generating");
    try {
      const dataUrl = await toPng(cardRef.current, { pixelRatio: 3, cacheBust: true });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], "فائدة.png", { type: "image/png" });
      if (navigator.canShare?.({ files: [file] })) {
        await navigator.share({ files: [file], title: "فائدة من المجلس العلمي" });
        setStatus("idle");
      } else {
        const link = document.createElement("a");
        link.download = "فائدة-المجلس-العلمي.png";
        link.href = dataUrl;
        link.click();
        setStatus("done");
      }
    } catch {
      setStatus("error");
    }
  }, []);

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    <div
      className="fic-backdrop"
      role="dialog"
      aria-modal="true"
      aria-label="بطاقة مشاركة الفائدة"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      dir="rtl"
    >
      <div className="fic-shell">
        <button type="button" className="fic-close" onClick={onClose} aria-label="إغلاق">✕</button>

        {/* البطاقة المُصدَرة كصورة */}
        <div
          ref={cardRef}
          className="fic-card"
          style={{ fontFamily: "'IBM Plex Sans Arabic', 'Noto Sans Arabic', system-ui, sans-serif" }}
        >
          <div className="fic-card__inner">
            <div className="fic-card__top">
              <span className="fic-card__logo">✦ المجلس العلمي</span>
              {category && <span className="fic-card__cat">{category}</span>}
            </div>

            <p className="fic-card__text">{text}</p>

            {source && (
              <p className="fic-card__source">— {source}</p>
            )}

            <div className="fic-card__footer">
              <span>majlisilm.com</span>
            </div>
          </div>
        </div>

        <div className="fic-actions">
          <button
            type="button"
            className="fic-btn fic-btn--primary"
            onClick={handleShare}
            disabled={status === "generating"}
          >
            {status === "generating" ? "جارٍ التحضير…" : "مشاركة كصورة"}
          </button>
          <button
            type="button"
            className="fic-btn fic-btn--secondary"
            onClick={handleDownload}
            disabled={status === "generating"}
          >
            تنزيل PNG
          </button>
        </div>

        {status === "done" && (
          <p className="fic-hint fic-hint--ok">تم الحفظ بنجاح ✓</p>
        )}
        {status === "error" && (
          <p className="fic-hint fic-hint--err">تعذّر توليد الصورة. حاول مرة أخرى.</p>
        )}
      </div>
    </div>
  );
}
