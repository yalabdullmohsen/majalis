import { useEffect } from "react";
import { Link } from "wouter";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { PageHero } from "@/components/ui/PageHero";
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
    <div className="quran-hub-page" dir="rtl">
      <PageHero
        title={title}
        description={description}
        actions={
          <ShareButtons title={`${title} — المجلس العلمي`} url={`https://www.majlisilm.com${path}`} />
        }
      />

      <section className="quran-hub-sections" aria-label={title}>
        <div className="quran-hub-grid">
          {cards.map(({ href, title: cardTitle, desc, Icon }) => (
            <Link key={`${href}:${cardTitle}`} href={href} className="quran-hub-card">
              <div className="quran-hub-card__header qhc-accent--deep">
                <span className="quran-hub-card__icon" aria-hidden="true">
                  <Icon size={22} strokeWidth={1.6} />
                </span>
              </div>
              <div className="quran-hub-card__body">
                <strong className="quran-hub-card__title">{cardTitle}</strong>
                <p className="quran-hub-card__desc">{desc}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {cards.length === 0 ? (
        <p className="quran-hub-empty" role="status">لا يوجد محتوى معروض في هذا القسم حالياً.</p>
      ) : null}
    </div>
  );
}
