"use client";

import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";

type Props = {
  title: string;
  subtitle?: string;
  url?: string;
  open: boolean;
  onClose: () => void;
};

export function ShareCardModal({ title, subtitle, url, open, onClose }: Props) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const downloadImage = async () => {
    if (!cardRef.current || busy) return;
    setBusy(true);
    try {
      const dataUrl = await htmlToImage.toPng(cardRef.current, { pixelRatio: 2 });
      const link = document.createElement("a");
      link.download = "majalis-share.png";
      link.href = dataUrl;
      link.click();
    } finally {
      setBusy(false);
    }
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      alert("تم نسخ الرابط");
    } catch {
      alert(shareUrl);
    }
  };

  const nativeShare = async () => {
    if (navigator.share) {
      await navigator.share({ title, text: subtitle, url: shareUrl });
    } else {
      copyLink();
    }
  };

  return (
    <div className="share-modal-backdrop" role="dialog" aria-modal="true" aria-label="مشاركة المحتوى">
      <div className="share-modal">
        <button type="button" className="share-modal__close" onClick={onClose} aria-label="إغلاق">
          ×
        </button>
        <div ref={cardRef} className="share-card">
          <img src="/logo.png" alt="" className="share-card__logo" width={56} height={56} />
          <p className="share-card__brand">المجلس العلمي</p>
          <h2 className="share-card__title">{title}</h2>
          {subtitle && <p className="share-card__subtitle">{subtitle}</p>}
          <p className="share-card__url">{shareUrl.replace(/^https?:\/\//, "")}</p>
          <div className="share-card__qr" aria-hidden="true">
            <img
              src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(shareUrl)}`}
              alt=""
              width={96}
              height={96}
            />
          </div>
        </div>
        <div className="share-modal__actions">
          <button type="button" className="page-action-btn" onClick={nativeShare}>
            مشاركة
          </button>
          <button type="button" className="page-action-btn page-action-btn--secondary" onClick={copyLink}>
            نسخ الرابط
          </button>
          <button type="button" className="page-action-btn page-action-btn--secondary" onClick={downloadImage} disabled={busy}>
            {busy ? "جارٍ..." : "تحميل صورة"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShareCardModal;
