import { useEffect, useState } from "react";
import { Instagram } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { headerAdConfig } from "@/config/header-ad";
import { openExternalUrl } from "@/lib/capacitor-utils";
import {
  closePartnershipAdModal,
  subscribePartnershipAdModal,
} from "@/lib/partnership-ad-bus";
import { PartnerChargeIcon, PartnerWatchIcon } from "@/components/header/PartnerAdIcons";
import "@/styles/components/partnership-ad-modal.css";

export function PartnershipAdModal() {
  const cfg = headerAdConfig;
  const [open, setOpen] = useState(false);

  useEffect(() => subscribePartnershipAdModal(setOpen), []);

  if (!cfg.enabled) return null;

  const onInstagram = () => {
    void openExternalUrl(cfg.sponsorUrl);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) closePartnershipAdModal();
      }}
    >
      <DialogContent
        className="partnership-ad-modal"
        aria-describedby="partnership-ad-modal-desc"
      >
        <DialogHeader className="partnership-ad-modal__header">
          <span className="partnership-ad-modal__badge">{cfg.badgeLabel}</span>
          <DialogTitle className="partnership-ad-modal__title">{cfg.modalTitle}</DialogTitle>
          <DialogDescription id="partnership-ad-modal-desc" className="partnership-ad-modal__desc">
            {cfg.modalBody}
          </DialogDescription>
        </DialogHeader>

        <div className="partnership-ad-modal__highlights" aria-hidden="true">
          <div className="partnership-ad-modal__highlight">
            <PartnerWatchIcon className="partnership-ad-modal__icon" />
            <span className="partnership-ad-modal__highlight-label">{cfg.watchHighlight}</span>
          </div>
          <div className="partnership-ad-modal__highlight">
          <PartnerChargeIcon className="partnership-ad-modal__icon" />
            <span className="partnership-ad-modal__highlight-label">{cfg.chargeHighlight}</span>
          </div>
        </div>

        <DialogFooter className="partnership-ad-modal__footer">
          <a
            href={cfg.sponsorUrl}
            className="partnership-ad-modal__instagram"
            target="_blank"
            rel="noopener noreferrer"
            aria-label={cfg.sponsorAriaLabel}
            onClick={(e) => {
              e.preventDefault();
              onInstagram();
            }}
          >
            <Instagram size={18} strokeWidth={1.8} aria-hidden="true" />
            <span>{cfg.instagramLabel}</span>
            <span className="partnership-ad-modal__handle">{cfg.instagramHandle}</span>
          </a>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
