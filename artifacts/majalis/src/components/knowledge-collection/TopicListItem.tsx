import { Link } from "wouter";
import type { DarsItem } from "@/lib/dars-types";

type Props = {
  topic: DarsItem;
  href: string;
};

export function TopicListItem({ topic, href }: Props) {
  return (
    <Link href={href} className="kc-topic-item" data-testid="kc-topic-item">
      <h2 className="kc-topic-item__title">{topic.title}</h2>
      {topic.summary ? <p className="kc-topic-item__summary">{topic.summary}</p> : null}
    </Link>
  );
}
