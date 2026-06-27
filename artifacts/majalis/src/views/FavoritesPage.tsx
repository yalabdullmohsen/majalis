"use client";

import { useEffect, useMemo, useState } from "react";
import { Link, useSearch } from "wouter";
import { PageHeader } from "@/components/ui-common";
import {
  FAVORITE_TYPE_LABELS,
  readFavorites,
  updateFavoriteNote,
  type FavoriteType,
  type LocalFavorite,
} from "@/lib/local-favorites";

const ALL_TYPES = Object.keys(FAVORITE_TYPE_LABELS) as FavoriteType[];

export default function FavoritesPage() {
  const search = useSearch();
  const params = useMemo(() => new URLSearchParams(search.startsWith("?") ? search : `?${search}`), [search]);
  const initialType = params.get("type") as FavoriteType | null;
  const [filter, setFilter] = useState<FavoriteType | "all">(initialType && ALL_TYPES.includes(initialType) ? initialType : "all");
  const [items, setItems] = useState<LocalFavorite[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [noteDraft, setNoteDraft] = useState("");

  const refresh = () => setItems(readFavorites());

  useEffect(() => {
    refresh();
    window.addEventListener("majalis-favorites-updated", refresh);
    return () => window.removeEventListener("majalis-favorites-updated", refresh);
  }, []);

  const filtered = filter === "all" ? items : items.filter((i) => i.type === filter);

  const startEdit = (item: LocalFavorite) => {
    setEditingId(`${item.type}:${item.id}`);
    setNoteDraft(item.note || "");
  };

  const saveNote = (item: LocalFavorite) => {
    updateFavoriteNote(item.type, item.id, noteDraft);
    setEditingId(null);
    refresh();
  };

  return (
    <div className="platform-page favorites-page">
      <PageHeader
        eyebrow="محفوظاتك"
        title="المفضلة"
        subtitle="آيات، أسئلة، دروس، كتب، قصص سور، وفوائد — في مكان واحد"
      />

      <div className="favorites-filters" role="tablist">
        <button type="button" className={filter === "all" ? "active" : ""} onClick={() => setFilter("all")}>
          الكل ({items.length})
        </button>
        {ALL_TYPES.map((type) => {
          const count = items.filter((i) => i.type === type).length;
          return (
            <button
              key={type}
              type="button"
              className={filter === type ? "active" : ""}
              onClick={() => setFilter(type)}
            >
              {FAVORITE_TYPE_LABELS[type]} ({count})
            </button>
          );
        })}
      </div>

      {filtered.length === 0 ? (
        <div className="platform-empty">
          <p>لا توجد عناصر محفوظة في هذا القسم.</p>
          <Link href="/discover" className="platform-link-btn">اكتشف محتوى</Link>
        </div>
      ) : (
        <ul className="favorites-list">
          {filtered.map((item) => {
            const key = `${item.type}:${item.id}`;
            const editing = editingId === key;
            return (
              <li key={key} className="favorites-item">
                <div className="favorites-item__head">
                  <span className="favorites-item__type">{FAVORITE_TYPE_LABELS[item.type]}</span>
                  <Link href={item.href} className="favorites-item__title">{item.title}</Link>
                  {item.meta && <small>{item.meta}</small>}
                </div>
                {editing ? (
                  <div className="favorites-item__note-edit">
                    <textarea value={noteDraft} onChange={(e) => setNoteDraft(e.target.value)} rows={2} placeholder="ملاحظة..." />
                    <button type="button" className="page-action-btn page-action-btn--compact" onClick={() => saveNote(item)}>حفظ</button>
                    <button type="button" className="page-action-btn page-action-btn--secondary page-action-btn--compact" onClick={() => setEditingId(null)}>إلغاء</button>
                  </div>
                ) : (
                  <div className="favorites-item__foot">
                    {item.note && <p className="favorites-item__note">{item.note}</p>}
                    <button type="button" className="favorites-item__edit" onClick={() => startEdit(item)}>
                      {item.note ? "تعديل الملاحظة" : "إضافة ملاحظة"}
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
