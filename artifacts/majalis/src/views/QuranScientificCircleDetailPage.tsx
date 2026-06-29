import { useEffect, useMemo, useState } from "react";
import { Link, useRoute } from "wouter";
import {
  CalendarPlus,
  Copy,
  ExternalLink,
  MapPin,
  MessageCircle,
  Share2,
} from "lucide-react";
import { Loading, Empty } from "@/components/ui-common";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { getQuranScientificCircleById } from "@/lib/quran-scientific-circles-service";
import {
  REGISTRATION_LABELS,
  STATUS_LABELS,
  type QuranScientificCircle,
} from "@/lib/quran-scientific-circles-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { usePageView } from "@/hooks/usePageView";

function buildCalendarUrl(circle: QuranScientificCircle) {
  const title = encodeURIComponent(circle.title);
  const details = encodeURIComponent(
    [circle.summary, circle.sheikh_name, circle.venue_name, circle.organizer].filter(Boolean).join("\n"),
  );
  const location = encodeURIComponent(
    [circle.venue_name, circle.region, circle.governorate, circle.country].filter(Boolean).join("، "),
  );
  const start = circle.start_date?.replace(/-/g, "") || "";
  if (start) {
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}&dates=${start}/${start}`;
  }
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&details=${details}&location=${location}`;
}

function DetailRow({ label, value }: { label: string; value?: string | boolean | null }) {
  if (value === undefined || value === null || value === "") return null;
  const display = typeof value === "boolean" ? (value ? "نعم" : "لا") : value;
  return (
    <tr>
      <th>{label}</th>
      <td>{display}</td>
    </tr>
  );
}

function RegistrationBanner({ circle }: { circle: QuranScientificCircle }) {
  const ended =
    circle.status === "completed" ||
    (circle.end_date && Date.parse(circle.end_date) < Date.now());
  const reg = circle.registration_status;

  if (ended) {
    return <div className="qsc-banner qsc-banner--ended">انتهت هذه الحلقة</div>;
  }
  if (reg === "closed" || circle.status === "registration_closed") {
    return <div className="qsc-banner qsc-banner--closed">التسجيل مغلق</div>;
  }
  if (reg === "full") {
    return <div className="qsc-banner qsc-banner--full">اكتمل العدد</div>;
  }
  if (reg === "open" || circle.status === "registration_open") {
    return <div className="qsc-banner qsc-banner--open">التسجيل مفتوح</div>;
  }
  return <div className="qsc-banner qsc-banner--soon">التسجيل قريبًا</div>;
}

export default function QuranScientificCircleDetailPage() {
  const [, params] = useRoute("/quran-scientific-circles/:id");
  const circleId = params?.id || "";
  const [item, setItem] = useState<QuranScientificCircle | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    getQuranScientificCircleById(circleId)
      .then(({ data }) => setItem(data || null))
      .finally(() => setLoading(false));
  }, [circleId]);

  usePageView("quran-scientific-circles", circleId);

  useEffect(() => {
    if (!item) return;
    const path = `/quran-scientific-circles/${item.id}`;
    applyPageSeo({
      path,
      title: `${item.title} | الحلقات القرآنية والعلمية — المجلس العلمي`,
      description: item.summary || item.description || item.title,
      keywords: [...(item.keywords || []), item.circle_type || "", "حلقات قرآنية", item.country || ""],
      ogType: "website",
      canonicalPath: path,
      image: item.poster_image_url,
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Course",
          name: item.title,
          description: item.summary,
          provider: { "@type": "Organization", name: item.organizer || "المجلس العلمي" },
          inLanguage: "ar",
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "الحلقات القرآنية والعلمية", path: "/quran-scientific-circles" },
          { name: item.title, path },
        ]),
      ],
    });
  }, [item]);

  const whatsappHref = useMemo(() => {
    if (item?.whatsapp_url) return item.whatsapp_url;
    if (item?.contact_phone) {
      const digits = item.contact_phone.replace(/\D/g, "");
      return `https://wa.me/${digits}`;
    }
    return null;
  }, [item]);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    if (!item) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: item.title, url });
        return;
      } catch {
        /* fall through */
      }
    }
    await handleCopyLink();
  };

  if (loading) return <Loading />;
  if (!item) return <Empty text="الحلقة غير موجودة." />;

  const copyText = [
    item.title,
    item.summary,
    item.sheikh_name && `الشيخ: ${item.sheikh_name}`,
    item.organizer && `الجهة: ${item.organizer}`,
    item.lesson_time && `الوقت: ${item.lesson_time}`,
    item.contact_phone && `التواصل: ${item.contact_phone}`,
    window.location.href,
  ]
    .filter(Boolean)
    .join("\n");

  return (
    <ContentDetailLayout
      breadcrumbs={[
        { label: "الرئيسية", href: "/" },
        { label: "الحلقات القرآنية والعلمية", href: "/quran-scientific-circles" },
        { label: item.title },
      ]}
      title={item.title}
      subtitle={item.summary}
      meta={[item.circle_type, item.country, item.governorate, STATUS_LABELS[item.status]].filter(Boolean).join(" · ")}
      tags={item.keywords}
      body={item.description}
      copyText={copyText}
      reportContentId={item.id}
    >
      <RegistrationBanner circle={item} />

      {item.poster_image_url && (
        <figure className="qsc-detail-poster">
          <img src={item.poster_image_url} alt={`إعلان ${item.title}`} loading="lazy" />
        </figure>
      )}

      <section className="ui-card qsc-detail-table-wrap">
        <h2>بيانات الحلقة</h2>
        <table className="qsc-detail-table">
          <tbody>
            <DetailRow label="النوع" value={item.circle_type} />
            <DetailRow label="الدولة" value={item.country} />
            <DetailRow label="المحافظة" value={item.governorate} />
            <DetailRow label="المنطقة" value={item.region} />
            <DetailRow label="المسجد / المركز" value={item.venue_name} />
            <DetailRow label="الجهة المنظمة" value={item.organizer} />
            <DetailRow label="الشيخ / المعلم" value={item.sheikh_name} />
            <DetailRow label="المشرف" value={item.supervisor_name} />
            <DetailRow label="الفئة المستهدفة" value={item.target_audience} />
            <DetailRow label="الجنس" value={item.gender_access} />
            <DetailRow label="المستوى" value={item.level} />
            <DetailRow label="الأيام" value={item.days?.join("، ")} />
            <DetailRow label="تاريخ البداية" value={item.start_date} />
            <DetailRow label="الوقت" value={item.lesson_time} />
            <DetailRow label="مدة البرنامج" value={item.duration_text} />
            <DetailRow label="بث مباشر" value={item.has_live} />
            <DetailRow label="حضور" value={item.has_attendance} />
            <DetailRow label="عن بُعد" value={item.is_online} />
            <DetailRow label="شهادة" value={item.has_certificate} />
            <DetailRow label="إجازة" value={item.has_ijazah} />
            <DetailRow label="اختبار" value={item.has_exam} />
            <DetailRow label="مجاني" value={item.is_free} />
            <DetailRow label="حالة التسجيل" value={item.registration_status ? REGISTRATION_LABELS[item.registration_status] : undefined} />
            <DetailRow label="آخر تحديث" value={item.updated_at ? new Date(item.updated_at).toLocaleDateString("ar-KW") : undefined} />
          </tbody>
        </table>
      </section>

      {item.requirements && (
        <section className="ui-card content-detail-section">
          <h2>المتطلبات</h2>
          <p>{item.requirements}</p>
        </section>
      )}

      {item.registration_method && (
        <section className="ui-card content-detail-section">
          <h2>طريقة التسجيل</h2>
          <p>{item.registration_method}</p>
        </section>
      )}

      {item.notes && (
        <section className="ui-card content-detail-section">
          <h2>ملاحظات</h2>
          <p style={{ whiteSpace: "pre-line" }}>{item.notes}</p>
        </section>
      )}

      <div className="qsc-detail-actions">
        {item.registration_url && (
          <a href={item.registration_url} target="_blank" rel="noopener noreferrer" className="qsc-action-btn qsc-action-btn--primary">
            <ExternalLink size={16} aria-hidden /> التسجيل
          </a>
        )}
        {whatsappHref && (
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="qsc-action-btn">
            <MessageCircle size={16} aria-hidden /> واتساب
          </a>
        )}
        {item.contact_phone && (
          <a href={`tel:${item.contact_phone}`} className="qsc-action-btn">
            {item.contact_phone}
          </a>
        )}
        {item.map_url && (
          <a href={item.map_url} target="_blank" rel="noopener noreferrer" className="qsc-action-btn">
            <MapPin size={16} aria-hidden /> الخريطة
          </a>
        )}
        <a href={buildCalendarUrl(item)} target="_blank" rel="noopener noreferrer" className="qsc-action-btn">
          <CalendarPlus size={16} aria-hidden /> إضافة للتقويم
        </a>
        <button type="button" onClick={handleCopyLink} className="qsc-action-btn">
          <Copy size={16} aria-hidden /> {copied ? "تم النسخ" : "نسخ الرابط"}
        </button>
        <button type="button" onClick={handleShare} className="qsc-action-btn">
          <Share2 size={16} aria-hidden /> مشاركة
        </button>
      </div>

      <p className="qsc-detail-back">
        <Link href="/quran-scientific-circles">← العودة إلى الحلقات</Link>
      </p>

      <RelatedKnowledge kind="circle" recordId={item.id} query={item.title} title="محتوى ذو صلة" limit={8} />
    </ContentDetailLayout>
  );
}
