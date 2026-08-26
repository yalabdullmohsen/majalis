import { useMemo, useState } from "react";
import { Check, Copy, Share2 } from "lucide-react";
import {
  buildFaidaShareText,
  copyShareText,
  resolveShareUrl,
  whatsappShareUrl,
} from "@/lib/share-faida";
import { openExternalUrl } from "@/lib/capacitor-utils";
import "@/styles/components/share-faida.css";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

/** مشاركة مضغوطة — للأذكار والسيرة وغيرها داخل البطاقات. */
export function ShareButton({
  title,
  text,
  url,
  className = "",
  label,
  size = "md",
}: ShareButtonProps) {
  const shareUrl = useMemo(() => resolveShareUrl(url), [url]);
  const shareText = useMemo(
    () =>
      text?.trim()
        ? `فائدة من المجلس العلمي:\n${text.trim()}\n${shareUrl}`
        : buildFaidaShareText(title, shareUrl),
    [title, text, shareUrl],
  );
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleNative = async () => {
    setBusy(true);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "المجلس العلمي", text: shareText, url: shareUrl });
      } else {
        const ok = await copyShareText(shareText);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }
      }
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        const ok = await copyShareText(shareText);
        if (ok) {
          setCopied(true);
          window.setTimeout(() => setCopied(false), 2000);
        }
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
    <div
      className={`share-faida share-faida--inline share-faida--${size} ${className}`.trim()}
      dir="rtl"
    >
      <div className="share-faida__actions">
        <button
          type="button"
          className="share-faida__btn share-faida__btn--primary"
          onClick={handleNative}
          disabled={busy}
          aria-label="مشاركة"
        >
          <Share2 size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden="true" />
          {label ?? "مشاركة"}
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
            <Check size={14} strokeWidth={2.2} aria-hidden="true" />
          ) : (
            <Copy size={14} strokeWidth={2} aria-hidden="true" />
          )}
          {copied ? "تم" : "نسخ"}
        </button>
      </div>
    </div>
  );
}
