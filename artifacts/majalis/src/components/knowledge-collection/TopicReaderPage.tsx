import { CollectionHero } from "./CollectionHero";
import { TopicSourceBlock } from "./TopicSourceBlock";
import { PreviousNextNavigation } from "./PreviousNextNavigation";
import type { DarsItem, DarsSection } from "@/lib/dars-types";
import { Link } from "wouter";

type Props = {
  collectionTitle: string;
  collectionHref: string;
  category: DarsSection;
  topic: DarsItem;
  previous: DarsItem | null;
  next: DarsItem | null;
  topicHref: (topicId: string) => string;
  categoryHref: string;
  sourceLabel?: string;
};

function paragraphs(body: string): string[] {
  return body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

export function TopicReaderPage({
  collectionTitle,
  collectionHref,
  category,
  topic,
  previous,
  next,
  topicHref,
  categoryHref,
  sourceLabel,
}: Props) {
  const body = topic.body?.trim() || topic.summary?.trim() || "";
  const blocks = body ? paragraphs(body) : [];

  return (
    <article className="kc-reader" data-testid="kc-topic-reader">
      <CollectionHero
        eyebrow={category.title}
        title={topic.title}
        crumbs={[
          { label: collectionTitle, href: collectionHref },
          { label: category.title, href: categoryHref },
          { label: topic.title },
        ]}
      />
      <Link href={categoryHref} className="kc-back">
        ← العودة إلى الباب
      </Link>
      <div className="kc-reader__body">
        {blocks.length > 0 ? (
          blocks.map((p, i) => <p key={i}>{p}</p>)
        ) : (
          <p className="kc-empty" role="status">
            لا يتوفر نص تفصيلي لهذا الموضوع بعد.
          </p>
        )}
      </div>
      {topic.summary && topic.body ? (
        <TopicSourceBlock label={sourceLabel ?? "ملخص"} text={topic.summary} />
      ) : null}
      <PreviousNextNavigation
        previous={
          previous
            ? { href: topicHref(previous.id), title: previous.title }
            : null
        }
        next={next ? { href: topicHref(next.id), title: next.title } : null}
      />
    </article>
  );
}
