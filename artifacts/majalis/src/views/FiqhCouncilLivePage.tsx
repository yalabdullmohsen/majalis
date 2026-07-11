import { useEffect, useState } from "react";
import { Link } from "wouter";
import { FiqhCouncilSubnav } from "./FiqhCouncilPage";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { PlatformContentCard } from "@/components/platform/ContentDetailLayout";
import { FiqhTrustBox } from "@/components/fiqh-council/FiqhTrustBox";
import { getFiqhLiveData, unavailableLabel } from "@/lib/fiqh-council-sessions-service";
import {
  FIQH_SESSION_STATUS_LABELS,
  FIQH_VERIFICATION_STATUS_LABELS,
  fiqhItemHref,
  fiqhSessionHref,
  type FiqhLiveData,
} from "@/lib/fiqh-council-types";
import { applyPageSeo } from "@/lib/seo";
import { breadcrumbJsonLd } from "@/lib/seo-structured-data";
import { SectionQuiz } from "@/components/ui/SectionQuiz";

function SessionBlock({
  title,
  session,
}: {
  title: string;
  session: FiqhLiveData["last_session"];
}) {
  if (!session) {
    return (
      <section className="fiqh-live-block ui-card">
        <h2>{title}</h2>
        <p className="fiqh-live-unavailable">لم تُنشر بيانات موثقة بعد.</p>
      </section>
    );
  }

  return (
    <section className="fiqh-live-block ui-card">
      <h2>{title}</h2>
      <dl className="fiqh-live-meta">
        <div><dt>العنوان</dt><dd>{session.session_title}</dd></div>
        <div><dt>رقم الجلسة</dt><dd>{session.session_number || "غير متوفر"}</dd></div>
        <div><dt>التاريخ</dt><dd>{unavailableLabel(session.start_date)}</dd></div>
        <div><dt>المكان</dt><dd>{unavailableLabel(session.location)}</dd></div>
        <div><dt>الحالة</dt><dd>{FIQH_SESSION_STATUS_LABELS[session.status]}</dd></div>
        <div><dt>التوثيق</dt><dd>{FIQH_VERIFICATION_STATUS_LABELS[session.verification_status]}</dd></div>
      </dl>
      {session.topics && session.topics.length > 0 && (
        <div className="fiqh-live-topics">
          <strong>الموضوعات:</strong>
          <ul>{session.topics.map((t) => <li key={t}>{t}</li>)}</ul>
        </div>
      )}
      {session.agenda && <p><strong>جدول الأعمال:</strong> {session.agenda}</p>}
      <Link href={fiqhSessionHref(session.slug)} className="fiqh-council-section-link">
        تفاصيل الجلسة
      </Link>
    </section>
  );
}

export default function FiqhCouncilLivePage() {
  const [live, setLive] = useState<FiqhLiveData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/fiqh-council/live",
      title: "البيانات الحية | المجمع الفقهي، المجلس العلمي",
      description: "آخر جلسات المجمع الفقهي والقرارات والتوصيات والفتاوى الموثقة، بيانات حية من مصادر رسمية.",
      keywords: ["المجمع الفقهي", "جلسات", "قرارات", "بيانات حية"],
      jsonLd: [
        breadcrumbJsonLd([
          { name: "الرئيسية", path: "/" },
          { name: "المجمع الفقهي", path: "/fiqh-council" },
          { name: "البيانات الحية", path: "/fiqh-council/live" },
        ]),
      ],
    });
  }, []);

  useEffect(() => {
    getFiqhLiveData().then(({ data }) => setLive(data)).finally(() => setLoading(false));
  }, []);

  if (loading) return <SkeletonCardGrid />;

  const data = live || {
    last_session: null,
    upcoming_session: null,
    latest_resolutions: [],
    latest_recommendations: [],
    latest_fatwas: [],
  };

  return (
    <div className="page-shell narrow content-hub-page fiqh-council-page fiqh-live-page">
      <PageHeader
        eyebrow="بيانات حية"
        title="البيانات الحية للمجمع الفقهي"
        subtitle="آخر الجلسات والقرارات والتوصيات، من مصادر موثقة فقط، دون اختلاق."
      />

      <FiqhCouncilSubnav />

      <div className="fiqh-live-grid">
        <SessionBlock title="آخر جلسة منعقدة" session={data.last_session} />
        <SessionBlock title="الجلسة القادمة" session={data.upcoming_session} />
      </div>

      <FiqhTrustBox
        sourceName="المجمع الفقهي الإسلامي"
        sourceUrl={data.last_session?.official_source_url}
        updatedAt={data.last_session?.updated_at}
        verificationStatus={data.last_session?.verification_status || "unavailable"}
      />

      {(
        [
          { title: "آخر القرارات", items: data.latest_resolutions },
          { title: "آخر التوصيات", items: data.latest_recommendations },
          { title: "آخر الفتاوى الجماعية", items: data.latest_fatwas },
        ] as const
      ).map((block) => (
        <section key={block.title} className="fiqh-council-section">
          <h2 className="fiqh-council-section-title">{block.title}</h2>
          {block.items.length === 0 ? (
            <p className="fiqh-live-unavailable">لم تُنشر بيانات موثقة بعد.</p>
          ) : (
            <div className="page-card-grid">
              {block.items.map((item) => (
                <PlatformContentCard
                  key={item.slug}
                  href={fiqhItemHref(item.slug)}
                  title={item.title}
                  meta={item.category}
                  summary={item.session_date}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      <div className="twh-share">
        <ShareButtons title="جلسات المجمع الفقهي الحية — المجلس العلمي" url="https://majlisilm.com/fiqh-council/live" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="fiqh" title="اختبر معلوماتك في الفقه الإسلامي" count={4} />
      </div>
    </div>
  );
}
