/**
 * بطاقات داخلية موحّدة — مصدر واحد لدخول الأقسام والمحتوى والروابط.
 */
export {
  SectionEntryCard,
  HubCard,
  type SectionEntryCardProps,
  type SectionEntryVariant,
  type HubCardProps,
} from "./HubCard";

export {
  ContentCard,
  type ContentCardProps,
} from "@/components/design-system/ContentCard";

export {
  AppCard,
  type AppCardProps,
} from "@/components/design-system/AppCard";

export { ReadingSectionCard as ReadingCard } from "@/components/content/ReadingSectionCard";

import { memo } from "react";
import { SectionEntryCard, type SectionEntryCardProps } from "./HubCard";
import { ContentCard, type ContentCardProps } from "@/components/design-system/ContentCard";
import { cn } from "@/lib/utils";

/** بطاقة موضوع/باب */
export const TopicCard = memo(function TopicCard({
  className,
  ...props
}: ContentCardProps) {
  return (
    <ContentCard
      {...props}
      className={cn("topic-card ss-topic-card soft-card soft-card--on-light", className)}
    />
  );
});

/** رابط داخلي كبطاقة ناعمة قابلة للضغط بالكامل */
export const InternalLinkCard = memo(function InternalLinkCard({
  className,
  variant = "compact",
  ...props
}: SectionEntryCardProps) {
  return (
    <SectionEntryCard
      {...props}
      variant={variant}
      className={cn("internal-link-card ss-internal-link-card", className)}
    />
  );
});
