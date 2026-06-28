import type { ReactNode } from "react";
import { Link } from "wouter";
import { Breadcrumbs } from "./Breadcrumbs";

type Props = {
  breadcrumbs: { label: string; href?: string }[];
  title: string;
  subtitle?: string;
  meta?: string;
  tags?: string[];
  body?: string;
  children?: ReactNode;
  related?: ReactNode;
  sourceUrls?: string[];
  copyText?: string;
  shareUrl?: string;
};

function ShareCopyBar({ copyText, shareUrl, title }: { copyText?: string; shareUrl?: string; title: string }) {
  const handleCopy = async () => {
    if (!copyText) return;
    try {
      await navigator.clipboard.writeText(copyText);
    } catch {
      /* ignore */
    }
  };

  const handleShare = async () => {
    const url = shareUrl || (typeof window !== "undefined" ? window.location.href : "");
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        /* fall through */
      }
    }
    if (url) await navigator.clipboard.writeText(url);
  };

  if (!copyText && !shareUrl) return null;

  return (
    <div className="content-detail-actions">
      {copyText && (
        <button type="button" onClick={handleCopy} className="content-detail-action-btn">
          نسخ
        </button>
      )}
      <button type="button" onClick={handleShare} className="content-detail-action-btn">
        مشاركة
      </button>
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
  copyText,
  shareUrl,
}: Props) {
  return (
    <div className="page-shell narrow content-detail-page">
      <Breadcrumbs items={breadcrumbs} />

      <header className="content-detail-header">
        {meta && <p className="content-detail-meta">{meta}</p>}
        <h1 className="content-detail-title">{title}</h1>
        {subtitle && <p className="content-detail-subtitle">{subtitle}</p>}
        {tags && tags.length > 0 && (
          <div className="content-hub-chips content-detail-tags">
            {tags.map((tag) => (
              <span key={tag} className="content-hub-chip">{tag}</span>
            ))}
          </div>
        )}
        {copyText && (
          <ShareCopyBar copyText={copyText} shareUrl={shareUrl} title={title} />
        )}
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
        <section className="content-detail-sources ui-card">
          <h2>المراجع الأصلية</h2>
          <ul>
            {sourceUrls.map((url, i) => (
              <li key={i}>
                <a href={url} target="_blank" rel="noopener noreferrer">{url}</a>
              </li>
            ))}
          </ul>
        </section>
      )}

      {related && (
        <section className="content-detail-related">
          <h2>محتوى ذو صلة</h2>
          {related}
        </section>
      )}
    </div>
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
    <Link href={href} style={{ textDecoration: "none" }}>
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
  if (items.length === 0) return null;
  return (
    <div className="page-card-grid">
      {items.map((item) => (
        <PlatformContentCard key={item.href} href={item.href} title={item.title} meta={item.meta} />
      ))}
    </div>
  );
}
