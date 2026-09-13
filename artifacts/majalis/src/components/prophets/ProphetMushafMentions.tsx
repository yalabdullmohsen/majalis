import { BookOpen } from "lucide-react";
import { getSurahMeta } from "@/lib/quran-api";
import { toArabicDigits } from "@/lib/utils";
import {
  QuranNavigationService,
  type QuranNavigationSource,
} from "@/lib/quran-navigation";
import type { ProphetMushafMention } from "@/lib/prophet-mushaf-mentions";

type Props = {
  prophetSlug: string;
  mentions: readonly ProphetMushafMention[];
  navigationSource?: QuranNavigationSource;
};

/**
 * بطاقات «مواضع الذكر في المصحف» — بيانات منظَّمة + فتح عبر الخدمة المركزية.
 */
export function ProphetMushafMentions({
  prophetSlug,
  mentions,
  navigationSource = "prophets-stories",
}: Props) {
  if (!mentions.length) return null;

  return (
    <section
      className="prophet-section-lux prophet-section-lux--reveal"
      data-ps-section="mushaf-mentions"
      aria-labelledby="prophet-mushaf-mentions-title"
    >
      <div className="prophet-section-lux__header">
        <BookOpen size={22} aria-hidden="true" />
        <h2 id="prophet-mushaf-mentions-title" className="prophet-section-lux__title">
          مواضع الذكر في المصحف
        </h2>
      </div>
      <p className="prophet-section-lux__text prophet-mushaf-mentions__lead">
        اضغط البطاقة لفتح الآية في المصحف مع تحديد هادئ — بلا تفسير ولا تلاوة تلقائية.
      </p>
      <div className="prophet-mushaf-mentions">
        {mentions.map((m) => {
          const surahName = getSurahMeta(m.surahId)?.name ?? String(m.surahId);
          const label = `سورة ${surahName}، الآية ${toArabicDigits(m.ayahId)}، فتح في المصحف`;
          return (
            <button
              key={`${m.surahId}:${m.ayahId}`}
              type="button"
              className="prophet-mushaf-mention-card"
              aria-label={label}
              onClick={() => {
                QuranNavigationService.openAyah(
                  {
                    surahId: m.surahId,
                    ayahId: m.ayahId,
                    navigationSource,
                    sourceSectionId: "mushaf-mentions",
                    sourceContentId: prophetSlug,
                    sourceRoute:
                      typeof window !== "undefined"
                        ? `${window.location.pathname}${window.location.search}`
                        : `/prophets/${prophetSlug}`,
                  },
                  {
                    returnContext: {
                      sourceRoute:
                        typeof window !== "undefined"
                          ? `${window.location.pathname}${window.location.search}`
                          : `/prophets/${prophetSlug}`,
                      sourceSectionId: "mushaf-mentions",
                      sourceContentId: prophetSlug,
                      scrollY: typeof window !== "undefined" ? window.scrollY : undefined,
                      expandedCardId: `${m.surahId}:${m.ayahId}`,
                    },
                  },
                );
              }}
            >
              <span className="prophet-mushaf-mention-card__main">
                <span className="prophet-mushaf-mention-card__title">
                  سورة {surahName}، الآية {toArabicDigits(m.ayahId)}
                </span>
                {m.noteAr ? (
                  <span className="prophet-mushaf-mention-card__note">{m.noteAr}</span>
                ) : null}
                <span className="prophet-mushaf-mention-card__cta">فتح في المصحف</span>
              </span>
              <span className="prophet-mushaf-mention-card__icon" aria-hidden="true">
                <BookOpen size={18} />
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
