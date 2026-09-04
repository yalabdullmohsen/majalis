import { useMemo, useState } from "react";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { ExploreAlsoNav, type ExploreAlsoLink } from "@/components/ExploreAlsoNav";
import type { DarsSection } from "@/lib/dars-types";
import { arabicMatchAny } from "@/lib/arabic-search";
import { toArabicDigits } from "@/lib/utils";
import "@/styles/pages/section-hub.css";

/** ألوان هادئة ومتنوّعة للبطاقات — بلا ألوان debug الصارخة */
const CARD_ACCENTS = [
  "#1F6B56", // أخضر الهوية
  "#3F6F5A", // زيتي
  "#0E7490", // زمردي/سماوي هادئ
  "#2563A8", // أزرق هادئ
  "#8A6A2F", // ذهبي خفيف
  "#7A3E52", // عنابي هادئ
  "#5B4B8A", // بنفسجي علمي خفيف
  "#2F6B4A", // أخضر ثانٍ
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
          <p className="section-hub__intro-text">{intro}</p>
          <ul className="section-hub__stats" aria-label="إحصاءات القسم">
            <li className="section-hub__stat">
              <span className="section-hub__stat-value">{toArabicDigits(sections.length)}</span>
              <span className="section-hub__stat-label">{statsLabels?.doors ?? "بابًا"}</span>
            </li>
            <li className="section-hub__stat">
              <span className="section-hub__stat-value">{toArabicDigits(totalLessons)}</span>
              <span className="section-hub__stat-label">{statsLabels?.topics ?? "موضوعًا"}</span>
            </li>
            <li className="section-hub__stat">
              <span className="section-hub__stat-value" style={{ fontSize: "0.95rem" }}>
                {levelLabel}
              </span>
              <span className="section-hub__stat-label">المستوى</span>
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
          <p className="section-hub__empty" role="status">
            لا نتائج مطابقة — جرّب كلمات أخرى أو اختر بابًا من الفلاتر.
          </p>
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
                  <span className="section-hub__card-kicker">الباب {toArabicDigits(idx + 1)}</span>
                  <h3 className="section-hub__card-title">{sec.title}</h3>
                  <p className="section-hub__card-meta">
                    {toArabicDigits(sec.lessons.length)} موضوعًا
                  </p>
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
                          <h4 className="section-hub__topic-title">{lesson.title}</h4>
                          {lesson.summary ? (
                            <p className="section-hub__topic-summary">{lesson.summary}</p>
                          ) : null}
                          {lesson.body ? (
                            <p className="section-hub__topic-body">{lesson.body}</p>
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
  if (raw && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(raw.trim())) {
    // تجنّب ألوان debug الصارخة السابقة (أزرق/بنفسجي/أحمر فاقع)
    const banned = new Set(["#1d4ed8", "#7c3aed", "#be123c", "#0284c7", "#16a34a", "#b45309"]);
    if (!banned.has(raw.trim().toLowerCase())) return raw.trim();
  }
  return CARD_ACCENTS[idx % CARD_ACCENTS.length]!;
}
