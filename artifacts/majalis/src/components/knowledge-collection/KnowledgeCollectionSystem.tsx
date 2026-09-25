import { useMemo, useState } from "react";
import { Link, useLocation } from "wouter";
import type { DarsSection } from "@/lib/dars-types";
import { arabicMatchAny } from "@/lib/arabic-search";
import { EMPTY } from "@/lib/ui-copy";
import { ExploreAlsoNav, type ExploreAlsoLink } from "@/components/ExploreAlsoNav";
import { CollectionHero, CollectionStats } from "./CollectionHero";
import { CategoryCard } from "./CategoryCard";
import { TopicListItem } from "./TopicListItem";
import { TopicReaderPage } from "./TopicReaderPage";
import "@/styles/pages/knowledge-collection.css";
import "@/styles/prophets-semantic-tokens.css";

type Props = {
  eyebrow: string;
  title: string;
  sections: DarsSection[];
  subtitle?: string;
  description?: string;
  /** المسار الأساسي للمجموعة مثل /iman-topics */
  route: string;
  relatedLinks?: ExploreAlsoLink[];
  relatedTitle?: string;
  statsLabels?: { doors?: string; topics?: string; level?: string };
};

function parseCollectionPath(location: string, baseRoute: string): {
  categoryId: string | null;
  topicId: string | null;
} {
  const base = baseRoute.replace(/\/$/, "");
  if (location === base || location === `${base}/`) {
    return { categoryId: null, topicId: null };
  }
  if (!location.startsWith(`${base}/`)) {
    return { categoryId: null, topicId: null };
  }
  const rest = location.slice(base.length + 1).split("/").filter(Boolean);
  return {
    categoryId: rest[0] ?? null,
    topicId: rest[1] ?? null,
  };
}

/**
 * نظام المجموعات المعرفية L1–L4:
 * Collection → Category (قائمة مواضيع) → Topic Reader (صفحة كاملة).
 * بلا نافذة منبثقة أو ورقة سفلية للمواضيع — القراءة في صفحة كاملة.
 */
export function KnowledgeCollectionSystem({
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
  const [location] = useLocation();
  const { categoryId, topicId } = parseCollectionPath(location, route);
  const [draft, setDraft] = useState("");
  const [search, setSearch] = useState("");

  const totalTopics = sections.reduce((n, s) => n + s.lessons.length, 0);
  const category = categoryId
    ? sections.find((s) => s.id === categoryId) ?? null
    : null;
  const topic =
    category && topicId
      ? category.lessons.find((l) => l.id === topicId) ?? null
      : null;

  const filteredCategories = useMemo(() => {
    const q = search.trim();
    if (!q) return sections;
    return sections
      .map((sec) => {
        const lessons = sec.lessons.filter((lesson) =>
          arabicMatchAny(
            [lesson.title, lesson.summary ?? "", lesson.body ?? "", sec.title],
            q,
          ),
        );
        const sectionHit = arabicMatchAny([sec.title], q);
        return sectionHit ? sec : { ...sec, lessons };
      })
      .filter((sec) => sec.lessons.length > 0 || arabicMatchAny([sec.title], q));
  }, [sections, search]);

  const filteredTopics = useMemo(() => {
    if (!category) return [];
    const q = search.trim();
    if (!q) return category.lessons;
    return category.lessons.filter((lesson) =>
      arabicMatchAny([lesson.title, lesson.summary ?? "", lesson.body ?? ""], q),
    );
  }, [category, search]);

  const categoryHref = (id: string) => `${route}/${id}`;
  const topicHref = (catId: string, id: string) => `${route}/${catId}/${id}`;

  /* L4 — Topic Reader */
  if (category && topic) {
    const idx = category.lessons.findIndex((l) => l.id === topic.id);
    const previous = idx > 0 ? category.lessons[idx - 1]! : null;
    const next =
      idx >= 0 && idx < category.lessons.length - 1
        ? category.lessons[idx + 1]!
        : null;
    return (
      <div className="kc-root" data-kc-level="reader" dir="rtl">
        <TopicReaderPage
          collectionTitle={title}
          collectionHref={route}
          category={category}
          topic={topic}
          previous={previous}
          next={next}
          categoryHref={categoryHref(category.id)}
          topicHref={(id) => topicHref(category.id, id)}
        />
        {relatedLinks && relatedLinks.length > 0 ? (
          <ExploreAlsoNav title={relatedTitle} links={relatedLinks} />
        ) : null}
      </div>
    );
  }

  /* L2/L3 — Category + Topic List */
  if (categoryId) {
    if (!category) {
      return (
        <div className="kc-root" dir="rtl">
          <p className="kc-empty" role="alert">
            الباب غير موجود.
          </p>
          <Link href={route} className="kc-back">
            ← العودة إلى المجموعة
          </Link>
        </div>
      );
    }
    return (
      <div className="kc-root" data-kc-level="category" dir="rtl">
        <CollectionHero
          eyebrow={eyebrow}
          title={category.title}
          lead={subtitle ?? description}
          crumbs={[
            { label: title, href: route },
            { label: category.title },
          ]}
        />
        <Link href={route} className="kc-back">
          ← كل الأبواب
        </Link>
        <form
          className="kc-search"
          onSubmit={(e) => {
            e.preventDefault();
            setSearch(draft);
          }}
        >
          <input
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="ابحث في موضوعات هذا الباب…"
            aria-label="بحث في الموضوعات"
            enterKeyHint="search"
            autoComplete="off"
            dir="rtl"
          />
          <button type="submit">بحث</button>
        </form>
        {filteredTopics.length === 0 ? (
          <p className="kc-empty" role="status">
            {EMPTY.search}
          </p>
        ) : (
          <ul className="kc-topic-list">
            {filteredTopics.map((t) => (
              <li key={t.id}>
                <TopicListItem topic={t} href={topicHref(category.id, t.id)} />
              </li>
            ))}
          </ul>
        )}
      </div>
    );
  }

  /* L1 — Collection */
  return (
    <div className="kc-root" data-kc-level="collection" data-testid="kc-collection" dir="rtl">
      <CollectionHero
        eyebrow={eyebrow}
        title={title}
        lead={
          description ??
          subtitle ??
          "مجموعة معرفية مرتّبة بأبواب واضحة — اختر بابًا ثم اقرأ الموضوع في صفحة كاملة."
        }
      />
      <CollectionStats
        doors={sections.length}
        topics={totalTopics}
        levelLabel={statsLabels?.level}
        doorsLabel={statsLabels?.doors}
        topicsLabel={statsLabels?.topics}
      />
      <form
        className="kc-search"
        onSubmit={(e) => {
          e.preventDefault();
          setSearch(draft);
        }}
      >
        <input
          type="search"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="ابحث في الأبواب والموضوعات…"
          aria-label="بحث داخل المجموعة"
          enterKeyHint="search"
          autoComplete="off"
          dir="rtl"
        />
        <button type="submit">بحث</button>
      </form>
      {filteredCategories.length === 0 ? (
        <p className="kc-empty" role="status">
          {EMPTY.search}
        </p>
      ) : (
        <div className="kc-category-grid">
          {filteredCategories.map((sec, idx) => (
            <CategoryCard
              key={sec.id}
              section={sec}
              index={idx}
              href={categoryHref(sec.id)}
            />
          ))}
        </div>
      )}
      {relatedLinks && relatedLinks.length > 0 ? (
        <ExploreAlsoNav title={relatedTitle} links={relatedLinks} />
      ) : null}
    </div>
  );
}

/** توافق خلفي — الاسم القديم يشير إلى النظام الجديد */
export { KnowledgeCollectionSystem as SectionAccordionLayout };
