/**
 * نظام مكوّنات واجهة سُنّة — بطاقات وأزرار ونص دلالي.
 * SectionCard / LessonCard / FloatingBack موجودة مسبقًا وتُعاد تصديرها هنا.
 */
export { AppCard, type AppCardProps } from "./AppCard";
export { SunnahCardV2, type SunnahCardV2Props } from "./SunnahCardV2";
export { FeatureCard, type FeatureCardProps } from "./FeatureCard";
export { ContentCard, type ContentCardProps } from "./ContentCard";
export { ActionButton, type ActionButtonProps } from "./ActionButton";
export { PrimaryButton, SecondaryButton, IconButton } from "./Buttons";
export { SettingsList, type SettingsListRow } from "./SettingsList";

export {
  SsText,
  ScreenTitle,
  SectionTitle,
  CardTitle,
  BodyText,
  ScriptureText,
  ExplanationText,
  SupportingText,
  LabelText,
  LabelText as SsLabel,
  Caption,
  type SsTextProps,
  type SsTextTone,
} from "./text";

export { SectionCard } from "@/components/sections/SectionCard";
export { FeaturedSectionCard } from "@/components/sections/FeaturedSectionCard";
/** بطاقة شبكة الأقسام — نفس نظام الحواف/الألوان عبر soft-card */
export { SectionEntryCard, HubCard as SectionHubCard, HubCard as NavigationCard } from "@/components/ui/HubCard";
export type { SectionEntryCardProps, SectionEntryVariant } from "@/components/ui/HubCard";
export { UnifiedLessonCard as LessonCard } from "@/components/lessons/UnifiedLessonCard";
export { FloatingBackButton, AppBackButton } from "@/components/FloatingBackButton";
export { LazyRouteFallback as RouteFallback, LazyRouteFallback } from "@/components/LazyRouteFallback";
export { EmptyState, Empty as NoticeEmpty } from "@/components/ui-common";
export { TopicPage as AppPage, SectionTemplatePage } from "@/components/topic/TopicPage";
export { SectionHero } from "@/components/topic/SectionHero";
export {
  ScreenShell,
  GridScreen,
  ListScreen,
  ReaderScreen,
  ScriptureScreen,
  PlayerScreen,
  DetailScreen,
  DashboardScreen,
  UtilityScreen,
  type ScreenShellProps,
  type ScreenShellStatus,
} from "./screens";

export {
  SS_SCREEN_PATTERNS,
  SS_SCREEN_PATTERN_META,
  SS_SCREEN_ROUTE_PATTERN,
  isSsScreenPattern,
  type SsScreenPattern,
  type SsScreenDensity,
  type SsScreenColumns,
} from "@/lib/ssunnah-screen-patterns";

export {
  GeometricMotif,
  GeometricDivider,
  IconMedallion,
  HeaderOrnament,
  type GeometricMotifProps,
  type GeometricDividerProps,
  type IconMedallionProps,
  type HeaderOrnamentProps,
} from "./geometry";

/** رؤوس موحّدة — CompactSectionHeader هو SectionHeader في SVL PR-3 */
export {
  CompactSectionHeader,
  SectionIntroHeader,
  SectionHeader,
  type CompactSectionStat,
} from "@/components/ui/CompactSectionHeader";
export {
  SvlSectionHeader,
  type SvlSectionHeaderProps,
} from "./headers/SvlSectionHeader";

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

export {
  SS_TYPE,
  SS_COLOR,
  SS_SPACE,
  SS_RADIUS,
  SS_TEXT_ROLES,
  type SsTextRole,
} from "@/lib/ssunnah-theme";