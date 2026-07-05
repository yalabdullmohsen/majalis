import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";

type IslamicStory = {
  id: number;
  slug: string;
  title: string;
  category: string;
  era: string;
  icon: string;
  summary: string;
  full_content: string;
  key_lessons: string[];
  related_figures: string[];
  sources: string[];
  tags: string[];
  is_approved: boolean;
  verified_by: string | null;
  approved_at: string | null;
  created_at: string;
};

const CSS = `
.is-wrap { direction: rtl; font-family: inherit; }
.is-header { margin-bottom: 1.5rem; }
.is-title { font-size: 1.375rem; font-weight: 700; color: #1e293b; margin: 0 0 0.25rem; }
.is-subtitle { font-size: 0.8125rem; color: #64748b; margin: 0; }
.is-stats { display: flex; gap: 0.75rem; margin-top: 1rem; flex-wrap: wrap; }
.is-stat { background: #f1f5f9; border-radius: 0.5rem; padding: 0.45rem 0.85rem; font-size: 0.8125rem; }
.is-stat strong { color: #0f172a; }
.is-stat span { color: #64748b; margin-right: 0.25rem; }
.is-filters { display: flex; gap: 0.5rem; margin-bottom: 1.25rem; flex-wrap: wrap; align-items: center; }
.is-filters input { flex: 1; min-width: 160px; padding: 0.45rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; font-size: 0.8125rem; outline: none; font-family: inherit; direction: rtl; }
.is-filters input:focus { border-color: #94a3b8; }
.is-filters select { padding: 0.45rem 0.75rem; border: 1px solid #e2e8f0; border-radius: 0.375rem; font-size: 0.8125rem; background: #fff; cursor: pointer; font-family: inherit; }
.is-list { display: flex; flex-direction: column; gap: 0.9rem; }
.is-card { background: #fff; border: 1px solid #e2e8f0; border-radius: 0.75rem; overflow: hidden; }
.is-card.approved { border-color: #bbf7d0; }
.is-card-head { display: flex; align-items: center; gap: 0.75rem; padding: 0.875rem 1.1rem; cursor: pointer; background: #f8fafc; border-bottom: 1px solid transparent; transition: background 0.15s; }
.is-card.approved .is-card-head { background: #f0fdf4; }
.is-card-head:hover { background: #f1f5f9; }
.is-card.approved .is-card-head:hover { background: #dcfce7; }
.is-icon { font-size: 1.4rem; }
.is-info { flex: 1; }
.is-name { font-size: 0.975rem; font-weight: 700; color: #1e293b; }
.is-meta { font-size: 0.75rem; color: #64748b; margin-top: 2px; }
.is-badge { font-size: 0.7rem; font-weight: 700; padding: 0.2rem 0.55rem; border-radius: 9999px; letter-spacing: 0.03em; }
.is-badge.pending { background: rgba(14,110,82,0.08); color: #0E6E52; border: 1px solid #fde68a; }
.is-badge.done { background: #dcfce7; color: #166534; border: 1px solid #bbf7d0; }
.is-toggle { font-size: 0.75rem; color: #94a3b8; }
.is-body { padding: 1.1rem 1.25rem; border-top: 1px solid #e2e8f0; }
.is-section-label { font-size: 0.7rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; color: #64748b; margin-bottom: 0.5rem; }
.is-summary { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 0.75rem 1rem; font-size: 0.875rem; line-height: 1.65; color: #334155; margin-bottom: 0.9rem; }
.is-full-toggle { background: none; border: 1px solid #cbd5e1; border-radius: 0.375rem; padding: 0.35rem 0.75rem; font-size: 0.8rem; color: #475569; cursor: pointer; font-family: inherit; margin-bottom: 0.75rem; transition: border-color 0.15s; }
.is-full-toggle:hover { border-color: #94a3b8; color: #1e293b; }
.is-content { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem 1.1rem; font-size: 0.875rem; line-height: 1.7; color: #334155; white-space: pre-wrap; margin-bottom: 0.9rem; max-height: 380px; overflow-y: auto; }
.is-lessons { margin-bottom: 0.9rem; }
.is-lesson-item { display: flex; gap: 0.5rem; align-items: flex-start; font-size: 0.8125rem; color: #334155; margin-bottom: 0.35rem; }
.is-actions { display: flex; gap: 0.6rem; flex-wrap: wrap; }
.is-btn { padding: 0.45rem 1rem; border-radius: 0.375rem; font-size: 0.8125rem; font-weight: 600; cursor: pointer; font-family: inherit; border: none; transition: all 0.15s; }
.is-btn.approve { background: #16a34a; color: #fff; }
.is-btn.approve:hover { background: #15803d; }
.is-btn.revoke { background: #fff; color: #dc2626; border: 1px solid #fca5a5; }
.is-btn.revoke:hover { background: #fef2f2; }
.is-btn.disabled { opacity: 0.45; cursor: not-allowed; }
.is-verified-info { font-size: 0.7375rem; color: #64748b; padding: 0.3rem 0; }
.is-sources { display: flex; flex-direction: column; gap: 0.3rem; margin-bottom: 0.9rem; }
.is-source { font-size: 0.8rem; color: #475569; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.375rem; padding: 0.3rem 0.6rem; }
`;

export function IslamicStoriesSection() {
  const { user } = useAuth();
  const [stories, setStories] = useState<IslamicStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Set<number>>(new Set());
  const [showFull, setShowFull] = useState<Set<number>>(new Set());
  const [working, setWorking] = useState<Set<number>>(new Set());
  const [filterCategory, setFilterCategory] = useState("الكل");
  const [filterStatus, setFilterStatus] = useState("الكل");
  const [search, setSearch] = useState(() => { const p = new URLSearchParams(window.location.search); return p.get("q") || ""; });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("islamic_stories")
      .select("*")
      .order("category")
      .order("era")
      .order("id");
    setStories((data || []) as IslamicStory[]);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const toggleExpand = (id: number) =>
    setExpanded(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const toggleFull = (id: number) =>
    setShowFull(prev => { const n = new Set(prev); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const setApproval = async (story: IslamicStory, approve: boolean) => {
    if (working.has(story.id)) return;
    setWorking(prev => new Set(prev).add(story.id));
    const { error } = await supabase
      .from("islamic_stories")
      .update({
        is_approved: approve,
        verified_by: approve ? (user?.email || "admin") : null,
        approved_at: approve ? new Date().toISOString() : null,
      })
      .eq("id", story.id);
    if (!error) {
      setStories(prev =>
        prev.map(s => s.id === story.id
          ? { ...s, is_approved: approve, verified_by: approve ? (user?.email || "admin") : null }
          : s
        )
      );
    }
    setWorking(prev => { const n = new Set(prev); n.delete(story.id); return n; });
  };

  const filtered = stories.filter(s => {
    if (filterCategory !== "الكل" && s.category !== filterCategory) return false;
    if (filterStatus === "معتمد" && !s.is_approved) return false;
    if (filterStatus === "قيد المراجعة" && s.is_approved) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return s.title.toLowerCase().includes(q) || s.category.includes(q) || s.era.includes(q);
    }
    return true;
  });

  const approved = stories.filter(s => s.is_approved).length;
  const pending = stories.length - approved;

  const catCount = (cat: string) => stories.filter(s => s.category === cat).length;
  const catApproved = (cat: string) => stories.filter(s => s.category === cat && s.is_approved).length;

  if (loading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", direction: "rtl" }}>
        جاري التحميل…
      </div>
    );
  }

  return (
    <>
      <style>{CSS}</style>
      <div className="is-wrap">
        <div className="is-header">
          <h2 className="is-title">📖 القصص الإسلامية — مراجعة واعتماد</h2>
          <p className="is-subtitle">
            جميع القصص محفوظة بـ is_approved = false — اعتمادك قرارك وحدك.
            لا تُنشر قصة للمستخدمين قبل موافقتك.
          </p>
          <div className="is-stats">
            <div className="is-stat"><strong>{stories.length}</strong><span>إجمالي</span></div>
            <div className="is-stat"><strong style={{ color: "#16a34a" }}>{approved}</strong><span>معتمد</span></div>
            <div className="is-stat"><strong style={{ color: "#0E6E52" }}>{pending}</strong><span>قيد المراجعة</span></div>
            <div className="is-stat">صحابة: <strong>{catApproved("صحابة")}/{catCount("صحابة")}</strong></div>
            <div className="is-stat">فتوحات: <strong>{catApproved("فتوحات")}/{catCount("فتوحات")}</strong></div>
            <div className="is-stat">تاريخ: <strong>{catApproved("تاريخ")}/{catCount("تاريخ")}</strong></div>
          </div>
        </div>

        {/* Filters */}
        <div className="is-filters">
          <input
            placeholder="🔍 بحث في العنوان أو التصنيف…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
            <option>الكل</option>
            <option>صحابة</option>
            <option>فتوحات</option>
            <option>تاريخ</option>
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
            <option>الكل</option>
            <option>معتمد</option>
            <option>قيد المراجعة</option>
          </select>
        </div>

        {/* Stories List */}
        <div className="is-list">
          {filtered.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#64748b" }}>
              لا توجد نتائج
            </div>
          ) : filtered.map(story => {
            const isExpanded = expanded.has(story.id);
            const isFullShown = showFull.has(story.id);
            const isWorking = working.has(story.id);

            return (
              <div key={story.id} className={`is-card${story.is_approved ? " approved" : ""}`}>
                {/* Header */}
                <div className="is-card-head" onClick={() => toggleExpand(story.id)}>
                  <span className="is-icon">{story.icon}</span>
                  <div className="is-info">
                    <div className="is-name">{story.title}</div>
                    <div className="is-meta">
                      {story.category} · {story.era} · {story.slug}
                    </div>
                  </div>
                  <span className={`is-badge ${story.is_approved ? "done" : "pending"}`}>
                    {story.is_approved ? "✓ معتمد" : "⏳ مراجعة"}
                  </span>
                  <span className="is-toggle">{isExpanded ? "▲" : "▼"}</span>
                </div>

                {/* Body */}
                {isExpanded && (
                  <div className="is-body">
                    {/* Summary */}
                    <div className="is-section-label">الملخص</div>
                    <div className="is-summary">{story.summary}</div>

                    {/* Full content */}
                    <button className="is-full-toggle" onClick={() => toggleFull(story.id)}>
                      {isFullShown ? "▲ إخفاء التفاصيل الكاملة" : "▼ عرض التفاصيل الكاملة"}
                    </button>
                    {isFullShown && (
                      <div className="is-content">{story.full_content}</div>
                    )}

                    {/* Key Lessons */}
                    {story.key_lessons.length > 0 && (
                      <>
                        <div className="is-section-label">الدروس المستفادة</div>
                        <div className="is-lessons">
                          {story.key_lessons.map((lesson, i) => (
                            <div key={i} className="is-lesson-item">
                              <span>•</span><span>{lesson}</span>
                            </div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Sources */}
                    {story.sources.length > 0 && (
                      <>
                        <div className="is-section-label">المصادر</div>
                        <div className="is-sources">
                          {story.sources.map((src, i) => (
                            <div key={i} className="is-source">📚 {src}</div>
                          ))}
                        </div>
                      </>
                    )}

                    {/* Approval info */}
                    {story.is_approved && story.verified_by && (
                      <div className="is-verified-info">
                        ✓ اعتمد بواسطة: {story.verified_by}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="is-actions">
                      {!story.is_approved ? (
                        <button
                          className={`is-btn approve${isWorking ? " disabled" : ""}`}
                          onClick={() => setApproval(story, true)}
                          disabled={isWorking}
                        >
                          {isWorking ? "جاري…" : "✓ اعتماد النشر"}
                        </button>
                      ) : (
                        <button
                          className={`is-btn revoke${isWorking ? " disabled" : ""}`}
                          onClick={() => setApproval(story, false)}
                          disabled={isWorking}
                        >
                          {isWorking ? "جاري…" : "✗ سحب الاعتماد"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
