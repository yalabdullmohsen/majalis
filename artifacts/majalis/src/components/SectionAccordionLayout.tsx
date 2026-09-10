import { useMemo, useState } from "react";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { ExploreAlsoNav, type ExploreAlsoLink } from "@/components/ExploreAlsoNav";
import type { DarsSection } from "@/lib/dars-types";
import { arabicMatchAny } from "@/lib/arabic-search";
import { toArabicDigits } from "@/lib/utils";
import {
  BodyText,
  CardTitle,
  SupportingText,
  Caption,
  LabelText,
  ExplanationText,
} from "@/components/design-system/text";
import "@/styles/pages/section-hub.css";

/** ألوان بطاقات من رموز الهوية — بلا هكس نصّي عشوائي */
const CARD_ACCENTS = [
  "var(--ss-color-brand)",
  "var(--ss-color-brand-deep)",
  "var(--mj-brand)",
  "var(--color-brand)",
  "var(--color-secondary)",
  "var(--color-accent)",
  "var(--mj-brand-deep)",
  "var(--ss-color-brand)",
] as const;

type Props = {
  eyebrow: string;
  title: string;
  sections: DarsSection[];
  subtitle?: string;
  description?: string;
  /** مسار القسم — يفعّل SectionHero / قالب الأقسام الموحّد */
  route: string;
  relatedLinks?: ExploreAlsoLink[];
  relatedTitle?: string;
  /** تسميات الإحصاءات الاختيارية */
  statsLabels?: { doors?: string; topics?: string; level?: string };
};

export function SectionAccordionLayout({
  eyebrow,
  title,
  sections,
  subtitle,
  description,
  route,
  relatedLinks,
  relatedTitle,
  statsLabels,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [filterId, setFilterId] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [draft, setDraft] = useState("");

  const totalLessons = sections.reduce((s, sec) => s + sec.lessons.length, 0);
  const levelLabel = statsLabels?.level ?? "تدرّج ميسر";

  const filtered = useMemo(() => {
    const q = search.trim();
    return sections
      .filter((sec) => filterId === "all" || sec.id === filterId)
      .map((sec) => {
        if (!q) return sec;
        const lessons = sec.lessons.filter((lesson) =>
          arabicMatchAny(
            [lesson.title, lesson.summary ?? "", lesson.body ?? "", sec.title],
            q,
          ),
        );
        return { ...sec, lessons };
      })
      .filter((sec) => sec.lessons.length > 0 || (!q && (filterId === "all" || filterId === sec.id)));
  }, [sections, filterId, search]);

  const resolvedSubtitle =
    subtitle ??
    `مسار ميسر — ${toArabicDigits(sections.length)} أبواب · ${toArabicDigits(totalLessons)} موضوعًا`;

  const intro =
    description ??
    "فهرس دراسي مرتّب للطلبة، ببطاقات واضحة وفلاتر موحّدة — دون عناصر تجريبية أو أرقام عشوائية.";

  return (
    <SectionTemplatePage
      route={route}
      eyebrow={eyebrow}
      title={title}
      subtitle={resolvedSubtitle}
      groupTitle={`أبواب ${title}`}
    >
      <div className="section-hub" dir="rtl">
        <section className="section-hub__intro" aria-label="تعريف القسم">
          <ExplanationText className="section-hub__intro-text">{intro}</ExplanationText>
          <ul className="section-hub__stats" aria-label="إحصاءات القسم">
            <li className="section-hub__stat">
              <LabelText className="section-hub__stat-value">{toArabicDigits(sections.length)}</LabelText>
              <Caption className="section-hub__stat-label">{statsLabels?.doors ?? "بابًا"}</Caption>
            </li>
            <li className="section-hub__stat">
              <LabelText className="section-hub__stat-value">{toArabicDigits(totalLessons)}</LabelText>
              <Caption className="section-hub__stat-label">{statsLabels?.topics ?? "موضوعًا"}</Caption>
            </li>
            <li className="section-hub__stat">
              <LabelText className="section-hub__stat-value">{levelLabel}</LabelText>
              <Caption className="section-hub__stat-label">المستوى</Caption>
            </li>
          </ul>
        </section>

        <div className="section-hub__toolbar">
          <form
            className="section-hub__search"
            onSubmit={(e) => {
              e.preventDefault();
              setSearch(draft);
            }}
          >
            <input
              type="search"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="ابحث داخل هذا القسم…"
              aria-label="بحث داخل القسم"
              enterKeyHint="search"
              autoComplete="off"
              dir="rtl"
            />
            <button type="submit" className="section-hub__search-btn">
              بحث
            </button>
          </form>
          <div className="section-hub__chips" role="toolbar" aria-label="فلاتر الأبواب">
            <button
              type="button"
              className={`section-hub__chip${filterId === "all" ? " is-active" : ""}`}
              onClick={() => setFilterId("all")}
            >
              الكل
            </button>
            {sections.map((sec) => (
              <button
                key={sec.id}
                type="button"
                className={`section-hub__chip${filterId === sec.id ? " is-active" : ""}`}
                onClick={() => {
                  setFilterId(sec.id);
                  setOpenId(sec.id);
                }}
              >
                {sec.title}
              </button>
            ))}
          </div>
        </div>

        {filtered.length === 0 ? (
          <BodyText className="section-hub__empty" role="status">
            لا نتائج مطابقة — جرّب كلمات أخرى أو اختر بابًا من الفلاتر.
          </BodyText>
        ) : (
          <div className="section-hub__grid">
            {filtered.map((sec, idx) => {
              const open = openId === sec.id;
              const accent = resolveAccent(sec.color, idx);
              return (
                <article
                  key={sec.id}
                  className={`section-hub__card${open ? " is-open" : ""}`}
                  style={{ ["--card-accent" as string]: accent }}
                >
                  <Caption className="section-hub__card-kicker">الباب {toArabicDigits(idx + 1)}</Caption>
                  <CardTitle className="section-hub__card-title">{sec.title}</CardTitle>
                  <SupportingText className="section-hub__card-meta">
                    {toArabicDigits(sec.lessons.length)} موضوعًا
                  </SupportingText>
                  <div className="section-hub__card-actions">
                    <button
                      type="button"
                      className="section-hub__cta"
                      aria-expanded={open}
                      onClick={() => setOpenId(open ? null : sec.id)}
                    >
                      {open ? "إخفاء الموضوعات" : "ابدأ الباب"}
                    </button>
                    {!open && (
                      <button
                        type="button"
                        className="section-hub__cta section-hub__cta--ghost"
                        onClick={() => setOpenId(sec.id)}
                      >
                        عرض الموضوعات
                      </button>
                    )}
                  </div>

                  {open && (
                    <ul className="section-hub__topics">
                      {sec.lessons.map((lesson) => (
                        <li key={lesson.id} className="section-hub__topic">
                          <CardTitle as="h4" className="section-hub__topic-title">
                            {lesson.title}
                          </CardTitle>
                          {lesson.summary ? (
                            <SupportingText className="section-hub__topic-summary">
                              {lesson.summary}
                            </SupportingText>
                          ) : null}
                          {lesson.body ? (
                            <BodyText className="section-hub__topic-body">{lesson.body}</BodyText>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  )}
                </article>
              );
            })}
          </div>
        )}

        <div className="section-hub__end" role="separator" aria-label="نهاية محتوى القسم">
          نهاية محتوى القسم
        </div>

        {relatedLinks && relatedLinks.length > 0 ? (
          <div className="section-hub__related">
            <ExploreAlsoNav title={relatedTitle ?? "روابط ذات صلة"} links={relatedLinks} />
          </div>
        ) : null}
      </div>
    </SectionTemplatePage>
  );
}

function resolveAccent(raw: string | undefined, idx: number): string {
  // المحتوى قد يحمل لونًا قديمًا — نتجاهله ونستخدم رموز الهوية فقط
  void raw;
  return CARD_ACCENTS[idx % CARD_ACCENTS.length]!;
}
