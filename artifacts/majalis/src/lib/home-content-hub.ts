/**
 * محور المحتوى البارز في الرئيسية — أعلى قيمة سردية.
 */
import type { LucideIcon } from "lucide-react";
import { BookOpen, Landmark, Users } from "lucide-react";
import { seoNavLabel } from "@/lib/seo-nav-labels";

export type ContentHubCard = {
  href: string;
  Icon: LucideIcon;
  title: string;
  subtitle: string;
  /** مسار الـ chunk للتحميل المسبق عند النية */
  preload?: () => Promise<unknown>;
};

export const HOME_CONTENT_HUB: ContentHubCard[] = [
  {
    href: "/prophets",
    Icon: BookOpen,
    title: seoNavLabel("/prophets", "قصص الأنبياء"),
    subtitle: "من آدم إلى محمد ﷺ — قصص وعِبَر من القرآن",
    preload: () => import("@/views/ProphetStoriesPage"),
  },
  {
    href: "/quran/people",
    Icon: Users,
    title: seoNavLabel("/quran/people", "الذين ذكروا في القرآن"),
    subtitle: "أسماء صريحة في القرآن مع مواضع الآيات والعِبَر",
    preload: () => import("@/pages/quran/QuranPeoplePage"),
  },
  {
    href: "/nations",
    Icon: Landmark,
    title: seoNavLabel("/nations", "الأمم السابقة"),
    subtitle: "أقوام ذُكروا في القرآن: دعوتهم وعاقبتهم والعِبَر",
    preload: () => import("@/views/NationsPage"),
  },
];
