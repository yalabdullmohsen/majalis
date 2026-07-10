import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { SkeletonCardGrid, Empty } from "@/components/ui-common";
import { ContentDetailLayout } from "@/components/platform/ContentDetailLayout";
import { FiqhTrustBox } from "@/components/fiqh-council/FiqhTrustBox";
import {
  getFiqhSessionBySlug,
  unavailableLabel,
  groupSessionItems,
} from "@/lib/fiqh-council-sessions-service";
import {
  FIQH_ITEM_TYPE_LABELS,
  FIQH_SESSION_STATUS_LABELS,
  FIQH_VERIFICATION_STATUS_LABELS,
  fiqhItemHref,
  fiqhSessionHref,
  type FiqhCouncilSession,
} from "@/lib/fiqh-council-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";

export default function FiqhCouncilSessionDetailPage({ params }: { params: { slug: string } }) {
  const [session, setSession] = useState<FiqhCouncilSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    getFiqhSessionBySlug(params.slug)
      .then(({ data }) => setSession(data))
      .finally(() => setLoading(false));
  }, [params.slug]);

  useEffect(() => {
    if (!session) return;
    const path = fiqhSessionHref(session.slug);
    const robots = session.publish_status === "published" && session.verification_status === "verified"
      ? "index, follow"
      : "noindex, nofollow";

    applyPageSeo({
      path,
      title: `${session.session_title} | المجمع الفقهي، المجلس العلمي`,
      description: `جلسة ${session.session_number || ""}، ${FIQH_SESSION_STATUS_LABELS[session.status]}`,
      canonicalPath: path,
      robots,
      ogType: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Event",
          name: session.session_title,
          startDate: session.start_date,
          endDate: session.end_date,
          location: session.location && session.location !== "غير متوفر"
            ? { "@type": "Place", name: session.location }
            : undefined,
          url: `https://majlisilm.com${path}`,
        },
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: "البيانات الحية", path: "/fiqh-council/live" },
          { name: session.session_title, path },
        ]),
      ],
    });
  }, [session]);

  if (loading) return <SkeletonCardGrid />;
  if (!session) return <Empty text="الجلسة غير موجودة أو غير منشورة." />;

  const grouped = groupSessionItems(session.items);
  const copyText = [
    session.session_title,
    session.session_number ? `الجلسة: ${session.session_number}` : "",
    session.start_date ? `التاريخ: ${session.start_date}` : "",
    session.official_source_url ? `المصدر: ${session.official_source_url}` : "",
    typeof window !== "undefined" ? `رابط المنصة: ${window.location.href}` : "",
  ].filter(Boolean).join(" | ");

  const renderList = (title: string, list: typeof session.items) => {
    if (!list?.length) return null;
    return (
      <section className="content-detail-evidence ui-card">
        <h2>{title}</h2>
        <ul className="fiqh-issue-linked-list">
          {list.map((item) => (
            <li key={item.id}>
              <Link href={fiqhItemHref(item.slug)}>{item.title}</Link>
              <span className="fiqh-issue-item-meta">{FIQH_ITEM_TYPE_LABELS[item.type]}</span>
            </li>
          ))}
        </ul>
      </section>
    );
  };

  return (
    <div className="page-shell narrow fiqh-council-page">
      <FiqhCouncilSubnav />

      <ContentDetailLayout
        breadcrumbs={[
          { label: "الرئيسية", href: "/" },
          { label: "المجمع الفقهي", href: "/fiqh-council" },
          { label: "البيانات الحية", href: "/fiqh-council/live" },
          { label: session.session_title },
        ]}
        title={session.session_title}
        subtitle={`${FIQH_SESSION_STATUS_LABELS[session.status]} · ${FIQH_VERIFICATION_STATUS_LABELS[session.verification_status]}`}
        meta={[session.session_number && `الجلسة ${session.session_number}`, session.start_date].filter(Boolean).join(" · ")}
        body={session.agenda || ""}
        copyText={copyText}
        shareUrl={typeof window !== "undefined" ? window.location.href : undefined}
      >
        <section className="content-detail-evidence ui-card fiqh-detail-info-table">
          <h2>بيانات الجلسة</h2>
          <table className="fiqh-info-table">
            <tbody>
              <tr><th>رقم الجلسة</th><td>{session.session_number || "غير متوفر"}</td></tr>
              <tr><th>التاريخ</th><td>{unavailableLabel(session.start_date)}</td></tr>
              <tr><th>المكان</th><td>{unavailableLabel(session.location)}</td></tr>
              <tr><th>الدولة</th><td>{unavailableLabel(session.country)}</td></tr>
              <tr><th>المدينة</th><td>{unavailableLabel(session.city)}</td></tr>
              <tr><th>الحالة</th><td>{FIQH_SESSION_STATUS_LABELS[session.status]}</td></tr>
            </tbody>
          </table>
        </section>

        {session.topics && session.topics.length > 0 && (
          <section className="content-detail-evidence ui-card">
            <h2>الموضوعات المطروحة</h2>
            <ul>{session.topics.map((t) => <li key={t}>{t}</li>)}</ul>
          </section>
        )}

        <FiqhTrustBox
          sourceName="المجمع الفقهي الإسلامي"
          sourceUrl={session.official_source_url}
          updatedAt={session.updated_at}
          verificationStatus={session.verification_status}
        />

        {renderList("القرارات الصادرة", grouped.resolutions)}
        {renderList("التوصيات", grouped.recommendations)}
        {renderList("الفتاوى الجماعية", grouped.fatwas)}
        {renderList("البحوث", grouped.research)}

        {session.official_document_url && (
          <p>
            <a href={session.official_document_url} target="_blank" rel="noopener noreferrer">
              الوثيقة الرسمية (PDF)
            </a>
          </p>
        )}
      </ContentDetailLayout>
    </div>
  );
}
