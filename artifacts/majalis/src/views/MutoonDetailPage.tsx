import { Link } from "wouter";
import { PageHeader, Empty } from "@/components/ui-common";
import { getMutoonById } from "@/lib/mutoon";

export default function MutoonDetailPage({ params }: { params: { id: string } }) {
  const mutoon = getMutoonById(params.id);

  if (!mutoon) {
    return (
      <div className="ds-page page-shell narrow">
        <Empty text="المتن غير موجود." />
        <Link href="/mutoon" className="ds-btn ds-btn--ghost">← العودة للمتون</Link>
      </div>
    );
  }

  return (
    <div className="ds-page page-shell narrow">
      <PageHeader eyebrow={mutoon.category} title={mutoon.name} subtitle={mutoon.summary} />

      <article className="detail-panel ui-card">
        <p className="mutoon-detail__author">المؤلف: {mutoon.author}</p>
        <p className="mutoon-detail__level">المستوى: {mutoon.level}</p>

        <section>
          <h2 className="ds-h3">نص المتن</h2>
          <blockquote className="mutoon-excerpt">{mutoon.text_excerpt}</blockquote>
        </section>

        <div className="mutoon-resources">
          {mutoon.audio_url && (
            <a href={mutoon.audio_url} className="ds-btn ds-btn--ghost">شرح صوتي</a>
          )}
          {mutoon.video_url && (
            <a href={mutoon.video_url} className="ds-btn ds-btn--ghost">شرح مرئي</a>
          )}
          {mutoon.pdf_url && (
            <a href={mutoon.pdf_url} className="ds-btn ds-btn--ghost">نسخة PDF</a>
          )}
          {mutoon.has_quiz && (
            <Link href="/learning/quiz" className="ds-btn ds-btn--primary">اختبار المتن</Link>
          )}
        </div>
      </article>

      <Link href="/mutoon" className="ds-btn ds-btn--ghost">← كل المتون</Link>
    </div>
  );
}
