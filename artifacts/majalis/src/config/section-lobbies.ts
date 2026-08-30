/**
 * تشريح لوبيات التبويبات — يُقرأ من سجل الأقسام (+ كتب الفقه المنشورة).
 * الصفحات لا تبني رأسًا أو شبكة يدويًا؛ المصدر هنا فقط.
 */
import {
  BookOpen,
  Building2,
  CircleDot,
  FlaskConical,
  GraduationCap,
  Landmark,
  Scale,
  ScrollText,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  FIQH_CATEGORY_LABELS,
  FIQH_CATEGORY_ORDER,
  FIQH_SUPPORTING_TOPICS,
  fiqhBookCounts,
  publishedBooks,
  type FiqhBookCategory,
} from "@/lib/fiqh-books";
import { formatAbwabCount, formatMasailCount, NOUN_DURUS, NOUN_HALAQAT, NOUN_MUNASABAT, NOUN_MUSABAQAT, type ArabicCountNoun } from "@/lib/arabic-count";
import { totalExternalCompetitions } from "@/config/competitions-hub";
import { QURAN_CIRCLES_SEED } from "@/lib/quran-circles-seed";
import { ISLAMIC_OCCASIONS } from "@/lib/islamic-occasions-seed";
import {
  SECTION_GROUP_META,
  SECTION_GROUP_ORDER,
  getSectionById,
  sectionsByGroup,
  type SectionDef,
} from "@/config/sections.registry";
import type { LobbyId } from "@/config/section-lobby-chrome";

export type { LobbyId } from "@/config/section-lobby-chrome";
export {
  LOBBY_IDS,
  TAB_ROOT_PATHS,
  isTabRootPath,
  LOBBY_SEARCH_FILTER,
} from "@/config/section-lobby-chrome";

export type LobbyItem = Pick<SectionDef, "id" | "label" | "subtitle" | "route" | "icon">;

export type LobbyChip = {
  id: string;
  label: string;
};

export type LobbyGroup = {
  id: string;
  title: string;
  items: LobbyItem[];
};

export type LobbyQuadItem = LobbyItem & {
  count: number;
  noun: ArabicCountNoun;
  accent?: boolean;
};

export type LobbyPrimary = LobbyItem & {
  /** يُحدَّث بعد الرسم بلا قفزة إن تُرك الارتفاع محجوزًا */
  dynamic?: boolean;
};

export type LobbySpec = {
  id: LobbyId;
  title: string;
  path: string;
  primary?: LobbyPrimary;
  chips?: LobbyChip[];
  groups: LobbyGroup[];
  /** اختصارات سريعة — شبكة ٣+٢ في الدروس، ٢×٢ في غيرها */
  quad?: LobbyQuadItem[];
};

function must(id: string): LobbyItem {
  const s = getSectionById(id);
  if (!s) throw new Error(`قسم مفقود في سجل اللوبي: ${id}`);
  return {
    id: s.id,
    label: s.label,
    subtitle: s.subtitle,
    route: s.route,
    icon: s.icon,
  };
}

function item(partial: LobbyItem): LobbyItem {
  return partial;
}

const SUPPORT_ICONS: Record<string, LucideIcon> = {
  usul: ScrollText,
  qawaid: Scale,
  madhahib: GraduationCap,
  nawazil: FlaskConical,
  majami: Building2,
  fatawa: ScrollText,
};

const QURAN_GROUPS: Array<{ id: string; title: string; ids: string[] }> = [
  {
    id: "tilawa-tafsir",
    title: "التلاوة والتفسير",
    ids: [
      "quran-surahs",
      "tafsir",
      "quran-tilawa",
      "quran-figures",
      "quran-asbab",
      "ulum-quran",
      "quran-ulum-terms",
    ],
  },
  {
    id: "tajweed-qiraat",
    title: "التجويد والقراءات",
    ids: ["quran-tajweed", "quran-qiraat", "quran-seven-ahruf"],
  },
  {
    id: "hifz",
    title: "الحفظ والتلاوة",
    ids: ["quran-recitation", "flashcards"],
  },
  {
    id: "numbers",
    title: "القرآن في أرقام",
    ids: ["quran-numbers"],
  },
];

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

export function getLobby(id: LobbyId): LobbySpec {
  if (id === "quran") {
    return {
      id,
      title: "مركز القرآن الكريم",
      path: "/quran-hub",
      primary: { ...must("open-mushaf"), dynamic: true },
      groups: QURAN_GROUPS.map((g) => ({
        id: g.id,
        title: g.title,
        items: g.ids.map(must),
      })),
    };
  }

  if (id === "lessons") {
    return {
      id,
      title: "الدروس",
      path: "/lessons",
      primary: item({
        id: "next-lesson",
        label: "أقرب درس اليوم",
        subtitle: "جدول الدروس والحلقات لهذا اليوم",
        route: "/lessons",
        icon: GraduationCap,
      }),
      chips: [
        { id: "all", label: "الكل" },
        { id: "men", label: "رجالية" },
        { id: "women", label: "نسائية" },
        { id: "courses", label: "دورات" },
      ],
      quad: [
        { ...must("lessons"), count: 0, noun: NOUN_DURUS, accent: true },
        { ...must("quran-circles"), label: "الحلقات", count: QURAN_CIRCLES_SEED.length, noun: NOUN_HALAQAT, accent: true },
        { ...must("competitions"), count: totalExternalCompetitions(), noun: NOUN_MUSABAQAT, accent: true },
        { ...must("hijri-calendar"), label: "التقويم", count: ISLAMIC_OCCASIONS.length, noun: NOUN_MUNASABAT },
        { ...must("lessons-archive"), count: 0, noun: NOUN_DURUS },
      ],
      groups: [],
    };
  }

  if (id === "prayer") {
    return {
      id,
      title: "الصلاة",
      path: "/prayer-times",
      primary: item({
        id: "next-prayer",
        label: "الصلاة القادمة",
        subtitle: "المواقيت والأذان حسب موقعك",
        route: "/prayer-times#mawaqeet",
        icon: CircleDot,
      }),
      groups: [
        {
          id: "times",
          title: "المواقيت",
          items: [
            item({
              id: "prayer-mawaqeet",
              label: "المواقيت",
              subtitle: "مواقيت اليوم والإمساكية",
              route: "/prayer-times#mawaqeet",
              icon: CircleDot,
            }),
          ],
        },
        { id: "adhkar", title: "الأذكار", items: [must("adhkar")] },
        { id: "qibla", title: "القبلة", items: [must("qibla")] },
        { id: "settings", title: "الإعدادات", items: [must("athan-settings")] },
      ],
    };
  }

  if (id === "fiqh") {
    return {
      id,
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

  return {
    id: "sections",
    title: "الأقسام",
    path: "/sections",
    groups: SECTION_GROUP_ORDER.map((group) => {
      const meta = SECTION_GROUP_META[group];
      const items = sectionsByGroup(group, "moreHub").map((s) => ({
        id: s.id,
        label: s.label,
        subtitle: s.subtitle,
        route: s.route,
        icon: s.icon,
      }));
      return { id: group, title: meta.label, items };
    }).filter((g) => g.items.length > 0),
  };
}
