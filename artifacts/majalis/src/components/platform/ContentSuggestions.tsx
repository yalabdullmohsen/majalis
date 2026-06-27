"use client";

import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getRelatedContent, type SuggestedItem } from "@/lib/content-suggestions";

type Props = {
  keywords: string[];
  category?: string;
  title?: string;
};

export function ContentSuggestions({ keywords, category, title = "محتوى مرتبط" }: Props) {
  const [items, setItems] = useState<SuggestedItem[]>([]);

  useEffect(() => {
    setItems(getRelatedContent(keywords, category, 5));
  }, [keywords.join("|"), category]);

  if (items.length === 0) return null;

  return (
    <section className="platform-suggestions" aria-label={title}>
      <h3 className="platform-section-title">{title}</h3>
      <div className="platform-suggestions__grid">
        {items.map((item) => (
          <Link key={item.id} href={item.href} className="platform-suggestion-card">
            <span className="platform-suggestion-card__meta">{item.meta}</span>
            <strong>{item.title}</strong>
          </Link>
        ))}
      </div>
    </section>
  );
}

export default ContentSuggestions;
