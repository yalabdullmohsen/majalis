import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { RequireAuth } from "@/components/personal/RequireAuth";
import { Loading, PageHeader, Empty } from "@/components/ui-common";
import {
  fetchLibraryFolders,
  fetchLibraryItems,
  createLibraryFolder,
  moveLibraryItem,
  removeFromLibrary,
  LIBRARY_TYPE_LABELS,
  CONTENT_ROUTE_MAP,
  type LibraryFolder,
  type LibraryItem,
} from "@/lib/personal-learning";

function itemHref(item: LibraryItem): string {
  if (item.content_url) return item.content_url;
  const fn = CONTENT_ROUTE_MAP[item.content_type];
  return fn ? fn(item.content_id) : "#";
}

export default function MyLibraryPage() {
  const [folders, setFolders] = useState<LibraryFolder[]>([]);
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [activeFolder, setActiveFolder] = useState<string | "all">("all");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [newFolder, setNewFolder] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");

  const load = useCallback(async () => {
    setLoading(true);
    const [f, all] = await Promise.all([
      fetchLibraryFolders(),
      fetchLibraryItems(activeFolder === "all" ? undefined : activeFolder),
    ]);
    setFolders(f);
    setItems(all);
    setLoading(false);
  }, [activeFolder]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== "all") list = list.filter((i) => i.content_type === typeFilter);
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((it) =>
      [it.title, it.note, it.content_type, it.content_id, JSON.stringify(it.metadata || "")]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [items, query, typeFilter]);

  const types = useMemo(() => [...new Set(items.map((i) => i.content_type))], [items]);

  const handleCreateFolder = async () => {
    if (!newFolder.trim()) return;
    await createLibraryFolder(newFolder.trim());
    setNewFolder("");
    load();
  };

  const handleMove = async (itemId: string, folderId: string) => {
    await moveLibraryItem(itemId, folderId || null);
    load();
  };

  const handleRemove = async (item: LibraryItem) => {
    if (!confirm("إزالة من المكتبة؟")) return;
    await removeFromLibrary(item.content_type, item.content_id);
    load();
  };

  return (
    <RequireAuth>
      <div className="page-shell personal-page" dir="rtl">
        <PageHeader
          eyebrow="مساحتي العلمية"
          title="مكتبتي العلمية"
          subtitle="احفظ الدروس والكتب والمتون والأبحاث — نظّمها في مجلداتك الخاصة"
        />

        <div className="personal-hub-links">
          <Link href="/my-profile" className="ds-btn ds-btn--ghost ds-btn--sm">ملفي العلمي</Link>
          <Link href="/my-learning-plan" className="ds-btn ds-btn--ghost ds-btn--sm">خطة طلب العلم</Link>
          <Link href="/my-learning" className="ds-btn ds-btn--ghost ds-btn--sm">لوحتي التعليمية</Link>
        </div>

        <div className="personal-library-layout">
          <aside className="personal-library-sidebar">
            <button
              type="button"
              className={`personal-folder-btn${activeFolder === "all" ? " active" : ""}`}
              onClick={() => setActiveFolder("all")}
            >
              الكل ({items.length})
            </button>
            {folders.map((f) => (
              <button
                key={f.id}
                type="button"
                className={`personal-folder-btn${activeFolder === f.id ? " active" : ""}`}
                onClick={() => setActiveFolder(f.id)}
              >
                {f.icon && <span>{f.icon}</span>} {f.name}
              </button>
            ))}
            <div className="personal-new-folder">
              <input
                className="ds-input"
                placeholder="مجلد جديد..."
                value={newFolder}
                onChange={(e) => setNewFolder(e.target.value)}
              />
              <button type="button" className="ds-btn ds-btn--primary ds-btn--sm" onClick={handleCreateFolder}>+</button>
            </div>
          </aside>

          <main className="personal-library-main">
            <div className="personal-library-toolbar">
              <input
                type="search"
                className="ds-input"
                placeholder="بحث في مكتبتي..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
              <select className="ds-input" value={typeFilter} onChange={(e) => setTypeFilter(e.target.value)}>
                <option value="all">كل الأنواع</option>
                {types.map((t) => (
                  <option key={t} value={t}>{LIBRARY_TYPE_LABELS[t] || t}</option>
                ))}
              </select>
            </div>

            {loading ? (
              <Loading />
            ) : filtered.length === 0 ? (
              <Empty text={query ? "لا توجد نتائج في مكتبتك." : "لم تحفظ محتوى بعد — استخدم «حفظ في مكتبتي» من أي صفحة."} />
            ) : (
              <div className="personal-library-grid">
                {filtered.map((item) => (
                  <article key={item.id} className="personal-library-card">
                    <span className="personal-library-type">{LIBRARY_TYPE_LABELS[item.content_type] || item.content_type}</span>
                    <Link href={itemHref(item)} className="personal-library-title">
                      {item.title || item.content_id}
                    </Link>
                    {item.note && <p className="personal-library-note">{item.note}</p>}
                    <div className="personal-library-card-actions">
                      <select
                        className="ds-input ds-input--sm"
                        value={item.folder_id || ""}
                        onChange={(e) => handleMove(item.id, e.target.value)}
                      >
                        <option value="">بدون مجلد</option>
                        {folders.map((f) => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <button type="button" className="ds-btn ds-btn--ghost ds-btn--sm" onClick={() => handleRemove(item)}>حذف</button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </main>
        </div>
      </div>
    </RequireAuth>
  );
}
