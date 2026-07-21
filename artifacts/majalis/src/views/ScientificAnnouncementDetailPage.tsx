import { useEffect } from "react";
import { Link } from "wouter";
import { Empty } from "@/components/ui-common";
import {
  buildShareText,
  formatAnnouncementDate,
  getLocationLabel,
  getScientificAnnouncementById,
} from "@/lib/scientific-announcements";
import { applyPageSeo } from "@/lib/seo";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";

function safeHref(url?: string): string | undefined {
  if (!url) return undefined;
  try {
    const { protocol } = new URL(url);
    return protocol === "https:" || protocol === "http:" ? url : undefined;
  } catch { return undefined; }
}

function DetailRow({ label, value }: { label: string; value?: string }) {
  if (!value || value === "غير محدد") return null;
  return (
    <div className="sci-ann-detail__row">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}

export default function ScientificAnnouncementDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const item = getScientificAnnouncementById(params.id);

  useEffect(() => {
    if (!item) {
      applyPageSeo({
        path: `/scientific-announcements/${params.id}`,
        title: "الإعلان غير موجود | المجلس العلمي",
        description: "لم يُعثر على هذا الإعلان العلمي.",
        robots: "noindex, follow",
        jsonLd: [],
      });
      return;
    }
    applyPageSeo({
      path: `/scientific-announcements/${params.id}`,
      title: `${item.announcementTitle} | المجلس العلمي`,
      description: `${item.announcementTitle}، تفاصيل الإعلان العلمي والمؤتمرات والدورات الإسلامية.`,
      keywords: ["إعلانات علمية", "مؤتمرات إسلامية", "دورات علمية", "فعاليات شرعية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Event",
          name: item.announcementTitle,
          url: `https://www.majlisilm.com/scientific-announcements/${params.id}`,
          description: `${item.announcementTitle} — تفاصيل الحدث العلمي`,
          organizer: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
        },
      ],
    });
  }, [item, params.id]);

  // نصّ النسخ ورابط الصفحة: يُمرَّران الآن إلى ContentDetailLayout بدل زرّي
  // "مشاركة"/"نسخ التفاصيل" المخصَّصين سابقًا (navigator.share يدويًا مع
  // احتياط نسخ). ShareButtons المشتركة (المستخدَمة في 14+ صفحة أخرى) تدعم
  // navigator.share فعليًا أيضًا (زر سناب شات)، فلا فقد وظيفي — والفائدة
  // الحقيقية: أزرار المشاركة/النسخ في هذه الصفحة لم يكن لها أي تنسيق CSS
  // مخصَّص إطلاقًا (لا قاعدة واحدة لـ.sci-ann-btn في أي ملف أنماط)، فكانت
  // تظهر كأزرار متصفح افتراضية بلا تصميم — القالب الموحّد يمنحها تصميمًا
  // حقيقيًا فعليًا مجانًا.
  const shareText = item ? buildShareText(item) : "";
  const pageUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}${(import.meta.env.BASE_URL || "/").replace(/\/$/, "")}/scientific-announcements/${params.id}`
      : "";

  if (!item) {
    return (
      <div className="page-shell narrow">
        <Empty text="لم يُعثر على الإعلان." />
        <Link href="/lessons" className="sci-ann-detail__back">
          العودة إلى الدروس
        </Link>
      </div>
    );
  }

  const place = getLocationLabel(item);
  const schedule =
    item.kind === "weekly"
      ? `كل ${item.recurrenceDay || item.day || "—"}`
      : item.date
        ? formatAnnouncementDate(item)
        : item.day || "غير محدد";

  const mapQuery = [place, item.region, item.governorate]
    .filter((v) => v && v !== "غير محدد")
    .join("، ");
  const mapEmbedUrl = mapQuery
    ? `https://maps.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`
    : undefined;

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الدروس", href: "/lessons#scientific-announcements" },
        { label: item.lessonTitle },
      ]}
      title={item.lessonTitle}
      subtitle={item.sheikh}
      meta={item.announcementTitle}
      tags={item.tags}
      copyText={shareText}
      shareUrl={pageUrl}
    >
      {item.posterImage && (
        <figure className="sci-ann-detail__poster">
          <img src={item.posterImage} alt={item.lessonTitle} loading="lazy" decoding="async" width="800" height="600" />
        </figure>
      )}

      <article className="sci-ann-detail">
        {(item.bookTitle || item.bookAuthor) && (
          <section className="sci-ann-detail__block">
            <h2>المتن أو الكتاب</h2>
            {item.bookTitle && <p>{item.bookTitle}</p>}
            {item.bookAuthor && <p className="sci-ann-detail__muted">{item.bookAuthor}</p>}
          </section>
        )}

        <dl className="sci-ann-detail__meta">
          <DetailRow label="اليوم" value={item.day} />
          <DetailRow label="الموعد" value={schedule} />
          <DetailRow label="الوقت" value={item.time} />
          <DetailRow label="المسجد أو المكان" value={place !== "غير محدد" ? place : undefined} />
          <DetailRow label="المنطقة" value={item.region} />
          <DetailRow label="المحافظة" value={item.governorate} />
          <DetailRow label="الجهة المنظمة" value={item.organizer} />
          <DetailRow label="التواصل" value={item.contactPhone} />
          <DetailRow label="حساب التواصل" value={item.socialHandle} />
        </dl>

        {mapEmbedUrl && place !== "غير محدد" && (
          <section className="sci-ann-detail__block">
            <h2>الموقع على الخريطة</h2>
            {item.mapUrl && (
              <a href={safeHref(item.mapUrl)} target="_blank" rel="noopener noreferrer" className="sci-ann-btn sci-ann-btn--secondary">
                فتح في Google Maps
              </a>
            )}
            {!item.mapUrl && (
              <p className="sci-ann-detail__muted">
                خريطة تقريبية، راجع العنوان في التفاصيل للتأكد.
              </p>
            )}
            <div className="sci-ann-detail__map">
              <iframe
                title={`خريطة ${place}`}
                src={mapEmbedUrl}
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                allowFullScreen
              />
            </div>
          </section>
        )}

        {(item.registrationUrl || item.liveUrl || item.websiteUrl || item.broadcastLinks?.length) && (
          <section className="sci-ann-detail__block">
            <h2>روابط البث والتسجيل</h2>
            <div className="sci-ann-detail__links">
              {safeHref(item.registrationUrl) && (
                <a href={safeHref(item.registrationUrl)} target="_blank" rel="noopener noreferrer" className="sci-ann-btn sci-ann-btn--primary">
                  التسجيل
                </a>
              )}
              {safeHref(item.liveUrl) && (
                <a href={safeHref(item.liveUrl)} target="_blank" rel="noopener noreferrer" className="sci-ann-btn sci-ann-btn--secondary">
                  البث المباشر
                </a>
              )}
              {safeHref(item.websiteUrl) && (
                <a href={safeHref(item.websiteUrl)} target="_blank" rel="noopener noreferrer" className="sci-ann-btn sci-ann-btn--secondary">
                  الموقع
                </a>
              )}
              {item.broadcastLinks?.filter((link) => safeHref(link.url)).map((link) => (
                <a
                  key={link.url}
                  href={safeHref(link.url)}
                  target="_blank" rel="noopener noreferrer"
                  className="sci-ann-btn sci-ann-btn--secondary"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </section>
        )}

        {(item.notes?.length ?? 0) > 0 && (
          <section className="sci-ann-detail__block">
            <h2>ملاحظات الحضور</h2>
            <ul className="sci-ann-detail__notes">
              {(item.notes ?? []).map((note: string) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </section>
        )}

        {/* الوسوم (tags) والمشاركة/النسخ: انتقلا إلى الخصائص tags/copyText/
            shareUrl أعلاه — يعرضهما القالب الموحّد عبر content-hub-chip
            وShareButtons الحقيقيَّين بدل عناصر بلا أي تنسيق CSS مخصَّص.
            SectionQuiz المستقل حُذف من هنا أيضًا — ContentDetailLayout يعرض
            واحدًا مُدمَجًا بالفعل في نهايته (نفس ما تعتمد عليه كل الصفحات
            الأخرى المهاجَرة إليه، بلا استدعاء مكرَّر)؛ وجود الاثنين معًا كان
            يُظهر قسمي "اختبر معلوماتك" متتاليين فعليًا — عطل تكرار حقيقي
            اكتُشف بمراجعة اللقطة البصرية بعد الهجرة، لا افتراضًا. */}
      </article>
    </ContentDetailLayout>
  );
}
