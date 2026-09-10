/**
 * نظام مكوّنات واجهة سُنّة — بطاقات وأزرار موحّدة.
 * SectionCard / LessonCard / FloatingBack موجودة مسبقًا وتُعاد تصديرها هنا.
 */
export { AppCard, type AppCardProps } from "./AppCard";
export { FeatureCard, type FeatureCardProps } from "./FeatureCard";
export { ContentCard, type ContentCardProps } from "./ContentCard";
export { ActionButton, type ActionButtonProps } from "./ActionButton";
export { PrimaryButton, SecondaryButton, IconButton } from "./Buttons";

export { SectionCard } from "@/components/sections/SectionCard";
export { FeaturedSectionCard } from "@/components/sections/FeaturedSectionCard";
/** بطاقة شبكة الأقسام — نفس نظام الحواف/الألوان عبر soft-card */
export { SectionEntryCard, HubCard as SectionHubCard } from "@/components/ui/HubCard";
export type { SectionEntryCardProps, SectionEntryVariant } from "@/components/ui/HubCard";
export { UnifiedLessonCard as LessonCard } from "@/components/lessons/UnifiedLessonCard";
export { FloatingBackButton, AppBackButton } from "@/components/FloatingBackButton";
export { LazyRouteFallback as RouteFallback, LazyRouteFallback } from "@/components/LazyRouteFallback";
export { TopicPage as AppPage, SectionTemplatePage } from "@/components/topic/TopicPage";
export { SectionHero } from "@/components/topic/SectionHero";
export {
  ContentSection,
  DefinitionBox,
  EvidenceBox,
  SourceBox,
  RelatedLinksBox,
  FAQBox,
  QuotePanel,
  ContentDetailReadingShell,
} from "@/components/content/ContentReading";

export {
  TopicCard,
  InternalLinkCard,
  ReadingCard,
} from "@/components/ui/InternalCards";
