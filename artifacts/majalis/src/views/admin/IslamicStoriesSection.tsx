import { useEffect, useState } from "react";
import { BookOpen, Library } from "lucide-react";
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
      <div className="iss-empty">
        جاري التحميل…
      </div>
    );
  }

  return (
    <>
      <div className="is-wrap">
        <div className="is-header">
          <h2 className="is-title"><BookOpen size={20} className="inline ml-2" />القصص الإسلامية — مراجعة واعتماد</h2>
          <p className="is-subtitle">
            جميع القصص محفوظة بـ is_approved = false — اعتمادك قرارك وحدك.
            لا تُنشر قصة للمستخدمين قبل موافقتك.
          </p>
          <div className="is-stats">
            <div className="is-stat"><strong>{stories.length}</strong><span>إجمالي</span></div>
            <div className="is-stat"><strong className="text-approved">{approved}</strong><span>معتمد</span></div>
            <div className="is-stat"><strong className="text-emerald">{pending}</strong><span>قيد المراجعة</span></div>
            <div className="is-stat">صحابة: <strong>{catApproved("صحابة")}/{catCount("صحابة")}</strong></div>
            <div className="is-stat">فتوحات: <strong>{catApproved("فتوحات")}/{catCount("فتوحات")}</strong></div>
            <div className="is-stat">تاريخ: <strong>{catApproved("تاريخ")}/{catCount("تاريخ")}</strong></div>
          </div>
        </div>

        {/* Filters */}
        <div className="is-filters">
          <input
            placeholder="بحث في العنوان أو التصنيف…"
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
            <div className="iss-empty">
              لا توجد نتائج
            </div>
          ) : filtered.map(story => {
            const isExpanded = expanded.has(story.id);
            const isFullShown = showFull.has(story.id);
            const isWorking = working.has(story.id);

            return (
              <div key={story.id} className={`is-card${story.is_approved ? " approved" : ""}`}>
                {/* Header */}
                <div
                  className="is-card-head"
                  onClick={() => toggleExpand(story.id)}
                  role="button"
                  tabIndex={0}
                  aria-expanded={isExpanded}
                  aria-label={`${isExpanded ? "طي" : "توسيع"} قصة ${story.title}`}
                  onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && toggleExpand(story.id)}
                >
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
                            <div key={i} className="is-source"><Library size={11} className="inline ml-0.5" />{src}</div>
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
