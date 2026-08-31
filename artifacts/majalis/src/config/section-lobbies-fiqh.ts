/**
 * لوبي الفقه فقط — يستورد fiqh-books الثقيل بعيدًا عن لوبيات القرآن/الدروس/المزيد.
 */
import { BookOpen, Building2, FlaskConical, GraduationCap, Landmark, Scale, ScrollText } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  FIQH_CATEGORY_LABELS,
  FIQH_CATEGORY_ORDER,
  FIQH_SUPPORTING_TOPICS,
  fiqhBookCounts,
  publishedBooks,
  type FiqhBookCategory,
} from "@/lib/fiqh-books";
import { formatAbwabCount, formatMasailCount } from "@/lib/arabic-count";
import { getSectionById } from "@/config/sections.registry";
import type { LobbyItem, LobbySpec } from "@/config/section-lobbies";

const SUPPORT_ICONS: Record<string, LucideIcon> = {
  usul: ScrollText,
  qawaid: Scale,
  madhahib: GraduationCap,
  nawazil: FlaskConical,
  majami: Building2,
  fatawa: ScrollText,
};

function item(partial: LobbyItem): LobbyItem {
  return partial;
}

function fiqhBookItems(cat: FiqhBookCategory): LobbyItem[] {
  return publishedBooks()
    .filter((b) => b.category === cat)
    .map((b) => {
      const counts = fiqhBookCounts(b);
      return item({
        id: `fiqh-book-${b.id}`,
        label: b.title,
        subtitle: `${formatAbwabCount(counts.chapters)} · ${formatMasailCount(counts.lessons)}`,
        route: `/fiqh/books/${b.id}`,
        icon: BookOpen,
      });
    });
}

function fiqhSupportingItems(): LobbyItem[] {
  return FIQH_SUPPORTING_TOPICS.map((t) => {
    if (t.id === "usul") {
      const usul = getSectionById("usul-fiqh");
      if (usul) {
        return {
          id: usul.id,
          label: usul.label,
          subtitle: usul.subtitle,
          route: usul.route,
          icon: usul.icon,
        };
      }
    }
    return item({
      id: `fiqh-support-${t.id}`,
      label: t.title,
      subtitle: t.desc.slice(0, 45),
      route: t.href,
      icon: SUPPORT_ICONS[t.id] ?? Landmark,
    });
  });
}

export function getFiqhLobby(): LobbySpec {
  return {
    id: "fiqh",
    title: "الفقه",
    path: "/fiqh",
    chips: FIQH_CATEGORY_ORDER.map((cat) => ({
      id: cat,
      label: FIQH_CATEGORY_LABELS[cat],
    })),
    groups: [
      ...FIQH_CATEGORY_ORDER.map((cat) => ({
        id: cat,
        title: FIQH_CATEGORY_LABELS[cat],
        items: fiqhBookItems(cat),
      })),
      {
        id: "supporting",
        title: "المباحث المساندة",
        items: fiqhSupportingItems(),
      },
    ],
  };
}
