import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title: string;
  text?: string;
  url?: string;
  className?: string;
  label?: string;
  size?: "sm" | "md";
}

export function ShareButton({
  title,
  text,
  url,
  className = "",
  label = "مشاركة",
  size = "md",
}: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const shareUrl = url ?? window.location.href;
  const shareText = text ?? title;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: shareText, url: shareUrl });
        return;
      } catch {
        /* cancelled or not supported */
      }
    }
    try {
      await navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard not available */
    }
  };

  const sizeCls = size === "sm" ? "share-btn--sm" : "";

  return (
    <button
      type="button"
      onClick={handleShare}
      className={`share-btn ${sizeCls} ${className}`.trim()}
      aria-label={`مشاركة: ${title}`}
      title={label}
    >
      {copied ? (
        <Check size={size === "sm" ? 14 : 16} strokeWidth={2} aria-hidden="true" />
      ) : (
        <Share2 size={size === "sm" ? 14 : 16} strokeWidth={1.8} aria-hidden="true" />
      )}
      <span>{copied ? "تم النسخ" : label}</span>
    </button>
  );
}
