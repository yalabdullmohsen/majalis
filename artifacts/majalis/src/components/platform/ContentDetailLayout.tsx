import { type ReactNode } from "react";
import { Link } from "wouter";
import { Breadcrumbs } from "./Breadcrumbs";
import { AdminInlineEdit, type InlineEditContentType } from "@/components/AdminInlineEdit";
import { ReadingProgressBar } from "@/components/ReadingProgressBar";
import { Clock } from "lucide-react";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { PageShell } from "@/components/layout/PageShell";
import { dedupeLinksByHref } from "@/lib/link-dedupe";
import { CompactSources } from "@/components/content/CompactSources";

function estimateReadMinutes(text?: string): number | null {
  if (!text || text.length < 200) return null;
  const words = text.trim().split(/\s+/).length;
  return Math.max(1, Math.round(words / 180));
}

type Props = {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  subtitle?: ReactNode;
  meta?: string;
  tags?: string[];
  body?: string;
  children?: ReactNode;
  related?: ReactNode;
  sourceUrls?: string[];
  copyText?: string;
  quizSectionId?: string;
  shareUrl?: string;
  /** لتفعيل زر التعديل المباشر — نوع المحتوى ومعرفه */
  adminEdit?: { contentType: InlineEditContentType; contentId: string | number; initialData?: Record<string, unknown> };
};

function HeaderActionsBar({
  adminEdit,
}: {
  adminEdit?: Props["adminEdit"];
}) {
  if (!adminEdit) return null;

  return (
    <div className="content-detail-actions">
      <AdminInlineEdit
        contentType={adminEdit.contentType}
        contentId={adminEdit.contentId}
        initialData={adminEdit.initialData}
        className="content-detail-action-btn"
      />
    </div>
  );
}

export function ContentDetailLayout({
  breadcrumbs,
  title,
  subtitle,
  meta,
  tags,
  body,
  children,
  related,
  sourceUrls,
  copyText: _copyText,
  quizSectionId,
  shareUrl,
  adminEdit,
}: Props) {
  void _copyText;
  return (
    <PageShell variant="narrow" density="medium" className="content-detail-page">
      <ReadingProgressBar />
      <Breadcrumbs items={breadcrumbs} />

      <header className="content-detail-header">
        <div className="content-detail-header-top">
          {meta && <p className="content-detail-meta">{meta}</p>}
          {estimateReadMinutes(body) && (
            <span className="content-detail-readtime" aria-label={`وقت القراءة المتوقع: ${estimateReadMinutes(body)} دقيقة`}>
              <Clock size={13} strokeWidth={2} aria-hidden="true" />
              {estimateReadMinutes(body)} د
            </span>
          )}
        </div>
        <h1 className="content-detail-title">{title}</h1>
        {subtitle != null && subtitle !== "" && (
          <p className="content-detail-subtitle">{subtitle}</p>
        )}
        {tags && tags.length > 0 && (
          <div className="content-hub-chips content-detail-tags">
            {tags.map((tag) => (
              <span key={tag} className="content-hub-chip">{tag}</span>
            ))}
          </div>
        )}
        <HeaderActionsBar adminEdit={adminEdit} />
      </header>

      {body && (
        <article className="content-detail-body">
          <div className="highlighted-card__highlight">
            {body.split("\n").map((line, i) => {
            const trimmed = line.trim();
            if (!trimmed) return <br key={i} />;
            if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
              return <h2 key={i} className="content-detail-heading">{trimmed.slice(2, -2)}</h2>;
            }
            return <p key={i}>{trimmed}</p>;
          })}
          </div>
        </article>
      )}

      {children}

      {sourceUrls && sourceUrls.length > 0 && (
        <CompactSources
          title="المراجع الأصلية"
          items={sourceUrls.map((url) => {
            let summary: string;
            try {
              const u = new URL(url);
              summary = u.hostname.replace(/^www\./, "") + (u.pathname !== "/" ? u.pathname.slice(0, 28) : "");
            } catch {
              summary = url.length > 48 ? `${url.slice(0, 47)}…` : url;
            }
            return { summary, detail: url };
          })}
        />
      )}

      <ShareButtons
        title={title}
        url={shareUrl || (typeof window !== "undefined" ? window.location.href : undefined)}
      />

      {related && (
        <section className="content-detail-related">
          <h2>محتوى ذو صلة</h2>
          {related}
        </section>
      )}

      <div className="px-4 pb-6 mt-4">
        {quizSectionId ? <SectionQuiz sectionId={quizSectionId} title="اختبر معلوماتك" count={4} /> : null}
      </div>
    </PageShell>
  );
}

type CardProps = {
  href: string;
  title: string;
  meta?: string;
  tag?: string;
  summary?: string;
};

export function PlatformContentCard({ href, title, meta, tag, summary }: CardProps) {
  return (
    <Link href={href} className="platform-card-link">
      <article className="page-card platform-content-card">
        <div className="page-card-header">
          <p>{title}</p>
          {tag && <span className="page-tag">{tag}</span>}
        </div>
        {meta && <p className="page-meta">{meta}</p>}
        {summary && <p className="page-desc">{summary}</p>}
      </article>
    </Link>
  );
}

export function RelatedLinks({ items }: { items: { href: string; title: string; meta?: string }[] }) {
  const unique = dedupeLinksByHref(items.map((item) => ({ href: item.href, title: item.title, meta: item.meta })));
  if (unique.length === 0) return null;
  return (
    <div className="page-card-grid">
      {unique.map((item) => (
        <PlatformContentCard key={item.href} href={item.href} title={item.title!} meta={item.meta} />
      ))}
    </div>
  );
}
