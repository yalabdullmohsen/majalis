import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { IgdsCard, IgdsEmptyState, IgdsPageHeader } from "@/components/igds";
import "@/styles/igds/components.css";
import "@/styles/igds/core-pages.css";

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

/** صفحة تجميع أقسام مدمجة — غلاف IGDS دون تغيير المحتوى الأصلي. */
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
    <div className="igds-page" dir="rtl">
      <div className="igds-page__hero igds-geo-wash">
        <div className="igds-container">
          <IgdsPageHeader title={title} description={description} />
          <ShareButtons title={`${title} — المجلس العلمي`} url={`https://www.majlisilm.com${path}`} />
        </div>
      </div>

      <div className="igds-container igds-page__body">
        {cards.length === 0 ? (
          <IgdsEmptyState title="لا يوجد محتوى" description="لا يوجد محتوى معروض في هذا القسم حالياً." />
        ) : (
          <section className="igds-grid-auto" aria-label={title}>
            {cards.map(({ href, title: cardTitle, desc, Icon }) => (
              <IgdsCard key={`${href}:${cardTitle}`} href={href} title={cardTitle} description={desc}>
                <span className="igds-page__card-icon" aria-hidden="true">
                  <Icon size={20} strokeWidth={1.7} />
                </span>
              </IgdsCard>
            ))}
          </section>
        )}
      </div>
    </div>
  );
}
