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
export { HubCard as SectionHubCard } from "@/components/ui/HubCard";
export { UnifiedLessonCard as LessonCard } from "@/components/lessons/UnifiedLessonCard";
export { FloatingBackButton, AppBackButton } from "@/components/FloatingBackButton";
