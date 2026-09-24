/**
 * صفحة تفاصيل معلم إسلامي — عرض كامل دون تعديل المحتوى الشرعي.
 */
import { useEffect, useMemo } from "react";
import { Link, useParams } from "wouter";
import { ExternalLink, MapPin, Maximize2 } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import {
  getLandmarkById,
  landmarkMapsUrl,
  ISLAMIC_LANDMARKS,
} from "@/lib/islamic-landmarks-data";
import { AppPage, PageHeaderV2, DetailSection, ActionButton } from "@/components/design-system";
import { DirectoryMedia } from "@/components/directory/DirectoryMedia";
import { LandmarkDiscoverCard } from "@/components/landmarks/LandmarkDiscoverCard";
import { UtilityScreen } from "@/components/design-system/screens";
import { BodyText, Caption, SectionTitle } from "@/components/design-system/text";
import { EMPTY } from "@/lib/ui-copy";
import "@/styles/islamic-landmarks.css";
import "@/styles/components/directory-media.css";

export default function IslamicLandmarkDetailPage() {
  const params = useParams<{ id?: string }>();
  const id = (params.id || "").trim();
  const landmark = useMemo(() => (id ? getLandmarkById(id) : undefined), [id]);

  useEffect(() => {
    if (!landmark) return;
    applyPageSeo({
      path: `/islamic-landmarks/${landmark.id}`,
      title: `${landmark.name} | المشاهد الإسلامية | سُنّة`,
      description: landmark.description.slice(0, 160),
      keywords: [landmark.name, landmark.city, landmark.country, ...landmark.tags],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Place",
          name: landmark.name,
          description: landmark.description,
          geo: {
            "@type": "GeoCoordinates",
            latitude: landmark.lat,
            longitude: landmark.lng,
          },
          address: {
            "@type": "PostalAddress",
            addressLocality: landmark.city,
            addressCountry: landmark.country,
          },
        },
      ],
    });
  }, [landmark]);

  const related = useMemo(() => {
    if (!landmark) return [];
    return ISLAMIC_LANDMARKS.filter(
      (lm) => lm.id !== landmark.id && (lm.country === landmark.country || lm.type === landmark.type),
    ).slice(0, 4);
  }, [landmark]);

  if (!landmark) {
    return (
      <UtilityScreen compose="mark">
        <AppPage
          themeId="history"
          sectionRoute="/islamic-landmarks"
          title="الموقع غير موجود"
          breadcrumb={[
            { label: "الرئيسية", href: "/" },
            { label: "الدليل الإسلامي", href: "/islamic-directory" },
            { label: "المشاهد الإسلامية", href: "/islamic-landmarks" },
            { label: "غير موجود" },
          ]}
        >
          <p className="ilm-empty">{EMPTY.search}</p>
          <Link href="/islamic-landmarks" className="ilm-cta">
            العودة للمشاهد
          </Link>
        </AppPage>
      </UtilityScreen>
    );
  }

  const mapsUrl = landmarkMapsUrl(landmark);

  return (
    <UtilityScreen compose="mark">
      <AppPage
        themeId="history"
        sectionRoute="/islamic-landmarks"
        title={landmark.name}
        subtitle={`${landmark.city}، ${landmark.country}`}
        breadcrumb={[
          { label: "الرئيسية", href: "/" },
          { label: "الدليل الإسلامي", href: "/islamic-directory" },
          { label: "المشاهد الإسلامية", href: "/islamic-landmarks" },
          { label: landmark.name },
        ]}
      >
        <article className="ilm-detail" data-testid="ilm-detail" data-landmark-id={landmark.id}>
          <PageHeaderV2
            eyebrow={landmark.type}
            title={landmark.name}
            description={`${landmark.city}، ${landmark.country} · ${landmark.era}`}
            actions={
              <div className="ilm-detail__actions">
                <Link href="/islamic-landmarks/map" className="ilm-cta ilm-cta--secondary">
                  <Maximize2 size={15} aria-hidden />
                  المستكشف
                </Link>
                <a
                  href={mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ilm-cta"
                >
                  <MapPin size={15} aria-hidden />
                  خرائط Google
                  <ExternalLink size={13} aria-hidden />
                </a>
              </div>
            }
          />

          <div className="ilm-detail__hero-media">
            <DirectoryMedia
              src={landmark.imageUrl}
              alt={landmark.name}
              fallbackLabel={landmark.city}
              ratio="21 / 9"
            />
          </div>

          <div className="ilm-detail__badges">
            <span className="ilm-badge ilm-badge--type">{landmark.type}</span>
            <span className="ilm-badge ilm-badge--era">{landmark.era}</span>
          </div>

          {landmark.builtYear ? (
            <DetailSection title="تاريخ البناء">
              <BodyText>{landmark.builtYear}</BodyText>
            </DetailSection>
          ) : null}

          <DetailSection title="وصف الموقع">
            <BodyText>{landmark.description}</BodyText>
          </DetailSection>

          <DetailSection title="الأهمية الإسلامية">
            <BodyText>{landmark.significance}</BodyText>
          </DetailSection>

          {(landmark.capacity || landmark.area) && (
            <div className="ilm-detail__meta">
              {landmark.capacity ? (
                <div className="ilm-detail__meta-item">
                  <Caption className="ilm-detail__meta-label">الطاقة الاستيعابية</Caption>
                  <BodyText className="ilm-detail__meta-val">{landmark.capacity}</BodyText>
                </div>
              ) : null}
              {landmark.area ? (
                <div className="ilm-detail__meta-item">
                  <Caption className="ilm-detail__meta-label">المساحة</Caption>
                  <BodyText className="ilm-detail__meta-val">{landmark.area}</BodyText>
                </div>
              ) : null}
            </div>
          )}

          {landmark.tags.length > 0 ? (
            <DetailSection title="الكلمات المفتاحية">
              <div className="ilm-card__tags">
                {landmark.tags.map((tag) => (
                  <span key={tag} className="ilm-tag">
                    {tag}
                  </span>
                ))}
              </div>
            </DetailSection>
          ) : null}

          <div className="ilm-detail__footer-cta">
            <ActionButton href="/islamic-landmarks" variant="secondary">
              العودة للاستكشاف
            </ActionButton>
          </div>

          {related.length > 0 ? (
            <section className="ilm-related" aria-labelledby="ilm-related-title">
              <SectionTitle id="ilm-related-title" className="ilm-section__title">
                مواقع ذات صلة
              </SectionTitle>
              <div className="ilm-grid ilm-grid--related">
                {related.map((lm) => (
                  <LandmarkDiscoverCard key={lm.id} landmark={lm} />
                ))}
              </div>
            </section>
          ) : null}
        </article>
      </AppPage>
    </UtilityScreen>
  );
}
