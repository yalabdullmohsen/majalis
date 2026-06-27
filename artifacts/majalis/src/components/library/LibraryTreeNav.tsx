"use client";

import { useState } from "react";
import { Link } from "wouter";
import type { LibraryChapter, LibrarySection } from "@/lib/library/types";

type Props = {
  sections: LibrarySection[];
  activeChapterId: string;
  bookSlug: string;
  onSelect: (chapterId: string) => void;
};

function ChapterNode({
  node,
  depth,
  activeChapterId,
  bookSlug,
  onSelect,
}: {
  node: LibraryChapter;
  depth: number;
  activeChapterId: string;
  bookSlug: string;
  onSelect: (id: string) => void;
}) {
  const [open, setOpen] = useState(depth === 0);
  const hasChildren = Boolean(node.children?.length);
  const isActive = node.id === activeChapterId;

  return (
    <li className="lib-tree__item">
      <div className="lib-tree__row" style={{ paddingRight: `${depth * 0.65}rem` }}>
        {hasChildren ? (
          <button type="button" className="lib-tree__toggle" onClick={() => setOpen((v) => !v)} aria-expanded={open}>
            {open ? "−" : "+"}
          </button>
        ) : (
          <span className="lib-tree__spacer" aria-hidden="true" />
        )}
        <Link
          href={`/library/${bookSlug}/${node.id}`}
          className={`lib-tree__link${isActive ? " is-active" : ""}${node.placeholder ? " is-placeholder" : ""}`}
          onClick={() => onSelect(node.id)}
        >
          {node.title}
        </Link>
      </div>
      {hasChildren && open && (
        <ul className="lib-tree__children">
          {node.children!.map((child) => (
            <ChapterNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeChapterId={activeChapterId}
              bookSlug={bookSlug}
              onSelect={onSelect}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

export function LibraryTreeNav({ sections, activeChapterId, bookSlug, onSelect }: Props) {
  return (
    <nav className="lib-tree" aria-label="فهرس الكتاب">
      {sections.map((sec) => (
        <div key={sec.id} className="lib-tree__section">
          <p className="lib-tree__section-title">{sec.title}</p>
          <ul className="lib-tree__list">
            {sec.chapters.map((ch) => (
              <ChapterNode
                key={ch.id}
                node={ch}
                depth={0}
                activeChapterId={activeChapterId}
                bookSlug={bookSlug}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export default LibraryTreeNav;
