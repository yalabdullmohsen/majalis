import { useEffect } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import "@/styles/pages/quran-hub.css";

export type HubCard = {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
};

type Props = {
  path: string;
  title: string;
  description: string;
  cards: HubCard[];
};

/** صفحة تجميع أقسام مدمجة — بطاقات داخلية دون تغيير المحتوى الأصلي. */
export default function MergedSectionHubPage({ path, title, description, cards }: Props) {
  useEffect(() => {
    applyPageSeo({
      path,
      title: `${title} | المجلس العلمي`,
      description,
      keywords: [title, "المجلس العلمي"],
    });
  }, [path, title, description]);

  return (
    <div className="qh-page" dir="rtl">
      <header className="qh-hero">
        <h1 className="qh-hero__title">{title}</h1>
        <p className="qh-hero__desc">{description}</p>
        <ShareButtons title={`${title} — المجلس العلمي`} url={`https://www.majlisilm.com${path}`} />
      </header>

      <section className="qh-grid" aria-label={title}>
        {cards.map(({ href, title: cardTitle, desc, Icon }) => (
          <Link key={`${href}:${cardTitle}`} href={href} className="qh-card">
            <span className="qh-card__icon" aria-hidden="true">
              <Icon size={22} strokeWidth={1.6} />
            </span>
            <strong className="qh-card__title">{cardTitle}</strong>
            <p className="qh-card__desc">{desc}</p>
          </Link>
        ))}
      </section>

      {cards.length === 0 ? (
        <p className="qh-empty" role="status">لا يوجد محتوى معروض في هذا القسم حالياً.</p>
      ) : null}
    </div>
  );
}
