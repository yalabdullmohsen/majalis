import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import {
  buildFaidaShareText,
  copyShareText,
  nativeShareFaida,
  resolveShareUrl,
  whatsappShareUrl,
} from "@/lib/share-faida";
import { openExternalUrl } from "@/lib/capacitor-utils";
import "@/styles/components/share-faida.css";

type Props = {
  title: string;
  url?: string;
  className?: string;
};

/**
 * زر مشاركة موحّد — Web Share API · واتساب · نسخ الرابط.
 */
export function ShareFaida({ title, url, className = "" }: Props) {
  const shareUrl = useMemo(() => resolveShareUrl(url), [url]);
  const shareText = useMemo(() => buildFaidaShareText(title, shareUrl), [title, shareUrl]);
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleNative = async () => {
    setBusy(true);
    try {
      const result = await nativeShareFaida(title, shareUrl);
      if (result === "copied") {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      }
    } finally {
      setBusy(false);
    }
  };

  const handleCopy = async () => {
    const ok = await copyShareText(shareText);
    if (ok) {
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWhatsApp = () => {
    void openExternalUrl(whatsappShareUrl(shareText));
  };

  return (
    <div className={`share-faida ${className}`.trim()} dir="rtl">
      <p className="share-faida__label">شارك الفائدة</p>
      <div className="share-faida__actions">
        <button
          type="button"
          className="share-faida__btn share-faida__btn--primary"
          onClick={handleNative}
          disabled={busy}
          aria-label="مشاركة الصفحة"
        >
          <Share2 size={16} strokeWidth={2} aria-hidden="true" />
          مشاركة
        </button>
        <button
          type="button"
          className="share-faida__btn"
          onClick={handleWhatsApp}
          aria-label="مشاركة عبر واتساب"
        >
          واتساب
        </button>
        <button
          type="button"
          className="share-faida__btn"
          onClick={handleCopy}
          aria-label={copied ? "تم نسخ الرابط" : "نسخ الرابط"}
        >
          {copied ? (
            <Check size={15} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Copy size={15} strokeWidth={2} aria-hidden="true" />
          )}
          {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
      </div>
    </div>
  );
}
