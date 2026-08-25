import { headerAdConfig } from "@/config/header-ad";
import { openPartnershipAdModal } from "@/lib/partnership-ad-bus";
import { PartnerChargeIcon, PartnerWatchIcon } from "@/components/header/PartnerAdIcons";
import "@/styles/components/header-ad-slot.css";

/**
 * كارت إعلان بجانب زر القمر في الهيدر — أيقونات SVG عالية التباين، بلا صور خارجية.
 * النقر → نافذة الشراكة (الإنستقرام من النافذة فقط).
 */
export function HeaderAdSlot() {
  const cfg = headerAdConfig;
  if (!cfg.enabled) return null;

  return (
    <button
      type="button"
      className="header-ad-slot"
      data-header-ad="1"
      aria-label={`${cfg.title} — ${cfg.topBarTapHint}`}
      onClick={() => openPartnershipAdModal()}
    >
      <span className="header-ad-slot__icons" aria-hidden="true">
        <span className="header-ad-slot__icon-chip">
          <PartnerWatchIcon className="header-ad-slot__svg" />
          <span className="header-ad-slot__metric">{cfg.watchMetric}</span>
        </span>
        <span className="header-ad-slot__icon-chip header-ad-slot__icon-chip--charge">
          <PartnerChargeIcon className="header-ad-slot__svg" />
          <span className="header-ad-slot__metric">{cfg.chargePercent}</span>
        </span>
      </span>
      <span className="header-ad-slot__copy">
        <span className="header-ad-slot__title">{cfg.title}</span>
        {cfg.subtitle ? (
          <span className="header-ad-slot__subtitle">{cfg.subtitle}</span>
        ) : null}
      </span>
    </button>
  );
}

/** اسم بديل للمواصفات */
export { HeaderAdSlot as HeaderAdBanner };
export { HeaderAdSlot as TopHeaderAdSlot };
