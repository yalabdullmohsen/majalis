import { resolveContentRef } from "@/lib/knowledge-platform/content-resolver";
import type { WidgetDeepLink, WidgetType } from "./types";

const PATHS: Record<WidgetType, string> = {
  next_prayer: "/prayer-times",
  prayer_times: "/prayer-times",
  mushaf_continue: "/mushaf",
  wird_khatma: "/mushaf",
  adhkar: "/adhkar",
  lessons_today: "/lessons",
  learning_continue: "/lessons",
  today_center: "/",
  search_shortcuts: "/search",
  shortcuts: "/",
  lock_screen: "/",
  live_prayer: "/prayer-times",
  live_lesson: "/lessons",
  live_download: "/offline",
};

export function deepLinkForWidgetType(type: WidgetType): WidgetDeepLink {
  return { path: PATHS[type] };
}

export function deepLinkForMushafPage(page: number): WidgetDeepLink {
  const card = resolveContentRef({ kind: "quran_page", id: String(page) }, `صفحة ${page}`);
  return {
    path: card?.href ?? `/mushaf?page=${page}`,
    contentKind: "quran_page",
    contentId: String(page),
  };
}

export function assertDeepLinkSafe(link: WidgetDeepLink): boolean {
  return (
    link.path.startsWith("/") &&
    !link.path.includes("://") &&
    !link.path.includes("..") &&
    !/^(https?:|javascript:|data:)/i.test(link.path)
  );
}
