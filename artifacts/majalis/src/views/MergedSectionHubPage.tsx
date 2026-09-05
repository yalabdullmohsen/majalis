import { useEffect, useMemo } from "react";
import type { LucideIcon } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { HubCard } from "@/components/ui/HubCard";
import { sectionTemplateChrome } from "@/config/section-template";
import "@/components/sections/section-cards.css";

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
  eyebrow?: string;
  quote?: { text: string; ref: string };
};

/** صفحة تجميع أقسام — تشريح العقيدة التسعة من SectionTemplatePage. */
export default function MergedSectionHubPage({ path, title, description, cards, eyebrow, quote }: Props) {
  useEffect(() => {
    applyPageSeo({
      path,
      title: `${title} | سُنّة`,
      description,
      keywords: [title, "سُنّة"],
    });
  }, [path, title, description]);

  const chrome = useMemo(
    () =>
      sectionTemplateChrome(path, {
        title,
        subtitle: description,
        eyebrow: eyebrow ?? title,
        quote,
        groupTitle: `أقسام ${title}`,
      }),
    [path, title, description, eyebrow, quote],
  );

  return (
    <SectionTemplatePage
      route={path}
      title={chrome.title}
      subtitle={chrome.subtitle}
      eyebrow={chrome.eyebrow}
      quote={chrome.quote}
      groupTitle={chrome.groupTitle}
    >
      <div className="hub-card-grid">
        {cards.map((c) => (
          <HubCard
            key={`${c.href}::${c.title}`}
            href={c.href}
            title={c.title}
            description={c.desc}
            Icon={c.Icon}
          />
        ))}
      </div>
      <ShareButtons title={`${title} — سُنّة`} url={`https://www.ssunnah.com${path}`} />
    </SectionTemplatePage>
  );
}
