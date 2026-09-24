/**
 * بطاقة Discover للمؤسسات — نفس لغة المشاهد (ilm-card) دون تعديل المحتوى العلمي.
 */
import { Globe, MapPin } from "lucide-react";
import type { Institution } from "@/data/institutions-catalog";
import { DirectoryMedia } from "@/components/directory/DirectoryMedia";
import { CardTitle, Caption, SupportingText } from "@/components/design-system/text";

const TYPE_LABELS: Record<Institution["type"], string> = {
  mosque: "مسجد",
  center: "مركز",
  university: "جامعة",
  library: "مكتبة",
};

type Props = {
  institution: Institution;
  variant?: "grid" | "featured";
};

export function InstitutionDiscoverCard({ institution, variant = "grid" }: Props) {
  const typeLabel = TYPE_LABELS[institution.type];
  return (
    <article
      id={variant === "grid" ? institution.id : undefined}
      className={`ilm-card inst-card soft-card soft-card--on-light mj-pressable${
        variant === "featured" ? " ilm-card--featured" : ""
      }`}
      data-institution-id={institution.id}
      data-testid="inst-discover-card"
    >
      <div className="ilm-card__img">
        <DirectoryMedia
          alt={institution.name}
          fallbackLabel={institution.city}
          ratio={variant === "featured" ? "4 / 3" : "16 / 10"}
        />
        <span className="ilm-badge ilm-badge--type ilm-card__img-badge">{typeLabel}</span>
      </div>
      <div className="ilm-card__body">
        <CardTitle className="ilm-card__name">{institution.name}</CardTitle>
        <Caption className="ilm-card__location">
          <MapPin size={12} strokeWidth={2} aria-hidden />
          {institution.city}، {institution.country}
        </Caption>
        {institution.contentStatus === "needs_review" && !institution.website ? (
          <span className="ilm-badge ilm-badge--era">تعريف موجز</span>
        ) : null}
        <SupportingText className="ilm-card__desc">{institution.description}</SupportingText>
        <div className="inst-card__links">
          {institution.website ? (
            <a
              href={institution.website}
              className="inst-card__link inst-card__link--web"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Globe size={13} strokeWidth={1.8} aria-hidden /> الموقع الرسمي
            </a>
          ) : null}
          {institution.mapQuery ? (
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(institution.mapQuery)}`}
              className="inst-card__link inst-card__link--map"
              target="_blank"
              rel="noopener noreferrer"
            >
              <MapPin size={13} strokeWidth={1.8} aria-hidden /> الموقع على الخريطة
            </a>
          ) : null}
        </div>
      </div>
    </article>
  );
}
