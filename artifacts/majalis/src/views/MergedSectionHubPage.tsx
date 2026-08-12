import { useEffect } from "react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { PageHero } from "@/components/ui/PageHero";
import { HubCard } from "@/components/ui/HubCard";
import "@/styles/pages/quran-hub.css";

export type HubCardItem = {
  href: string;
  title: string;
  desc: string;
  Icon: LucideIcon;
};

type Props = {
  path: string;
  title: string;
  description: string;
  cards: HubCardItem[];
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
        <div className="hub-card-grid">
          {cards.map(({ href, title: cardTitle, desc, Icon }) => (
            <HubCard
              key={`${href}:${cardTitle}`}
              href={href}
              title={cardTitle}
              description={desc}
              Icon={Icon}
            />
          ))}
        </div>
      </section>

      {cards.length === 0 ? (
        <p className="quran-hub-empty" role="status">لا يوجد محتوى معروض في هذا القسم حالياً.</p>
      ) : null}
    </div>
  );
}
