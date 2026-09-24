/**
 * بطاقة Discover للمشاهد — صورة + بيانات من الكتالوج دون تعديل المحتوى.
 */
import { Link } from "wouter";
import { MapPin } from "lucide-react";
import type { IslamicLandmark } from "@/lib/islamic-landmarks-data";
import { DirectoryMedia } from "@/components/directory/DirectoryMedia";
import { CardTitle, Caption, SupportingText } from "@/components/design-system/text";

type Props = {
  landmark: IslamicLandmark;
  variant?: "grid" | "featured";
};

export function LandmarkDiscoverCard({ landmark, variant = "grid" }: Props) {
  const href = `/islamic-landmarks/${landmark.id}`;
  return (
    <Link
      href={href}
      className={`ilm-card soft-card soft-card--on-light mj-pressable${variant === "featured" ? " ilm-card--featured" : ""}`}
      aria-label={`تفاصيل ${landmark.name}`}
      data-landmark-id={landmark.id}
    >
      <div className="ilm-card__img">
        <DirectoryMedia
          src={landmark.imageUrl}
          alt={landmark.name}
          fallbackLabel={landmark.city}
          ratio={variant === "featured" ? "4 / 3" : "16 / 10"}
        />
        <span className="ilm-badge ilm-badge--type ilm-card__img-badge">{landmark.type}</span>
      </div>
      <div className="ilm-card__body">
        <CardTitle className="ilm-card__name">{landmark.name}</CardTitle>
        <Caption className="ilm-card__location">
          <MapPin size={12} strokeWidth={2} aria-hidden />
          {landmark.city}، {landmark.country}
        </Caption>
        <span className="ilm-badge ilm-badge--era">{landmark.era}</span>
        <SupportingText className="ilm-card__desc">{landmark.description}</SupportingText>
        {landmark.builtYear ? (
          <Caption className="ilm-card__meta">تأسيس / بناء: {landmark.builtYear}</Caption>
        ) : null}
      </div>
    </Link>
  );
}
