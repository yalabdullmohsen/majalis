"use client";

import { useState, useEffect, useCallback } from "react";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { supabase } from "@/lib/supabase";
import { isSupabaseConfigured } from "@/lib/supabase-config";

// ─────────────────── Types ───────────────────────────────────────────────────
type Category = "الكل" | "صحابة" | "فتوحات" | "تاريخ";
type Era = "الكل" | "نبوي" | "راشدي" | "أموي" | "عباسي" | "عثماني" | "حديث";

interface IslamicStory {
  id: number;
  slug: string;
  title: string;
  category: "صحابة" | "فتوحات" | "تاريخ";
  era: string;
  summary: string;
  full_content: string;
  key_lessons: string[];
  related_figures: string[];
  sources: string[];
  tags: string[];
  icon: string;
  is_approved: boolean;
}

// ─────────────────── Palette — Emerald Identity ──────────────────────────────
const GOLD = "#BEC7C3";
const DARK_BG = "#18362A";
const CARD_BG = "#153025";
const ACCENT_GREEN = "#1E4A37";
const ACCENT_PURPLE = "#2A3E50";

const CATEGORY_COLORS: Record<string, string> = {
  صحابة: "#97A59F",
  فتوحات: "#7A9090",
  تاريخ: "#6B8888",
};

const ERA_LABELS: Era[] = ["الكل", "نبوي", "راشدي", "أموي", "عباسي", "عثماني", "حديث"];
const CATEGORY_LABELS: Category[] = ["الكل", "صحابة", "فتوحات", "تاريخ"];

// ─────────────────── SVG Helpers ─────────────────────────────────────────────
function IslamicStar({ size = 28, color = GOLD, opacity = 0.8 }: { size?: number; color?: string; opacity?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ opacity }} aria-hidden="true">
      <polygon points="50,5 61,35 93,35 67,57 78,88 50,68 22,88 33,57 7,35 39,35" fill={color} />
    </svg>
  );
}

function OrnamentalDivider({ color = GOLD }: { color?: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "8px 0", opacity: 0.5 }}>
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to right, transparent, ${color})` }} />
      <IslamicStar size={14} color={color} />
      <div style={{ flex: 1, height: 1, background: `linear-gradient(to left, transparent, ${color})` }} />
      <AdminQuickEdit section="islamic-stories" />
    </div>
  );
}

// ─────────────────── Story Card ───────────────────────────────────────────────
function StoryCard({ story, onSelect }: { story: IslamicStory; onSelect: () => void }) {
  const [hovered, setHovered] = useState(false);
  const catColor = CATEGORY_COLORS[story.category] || GOLD;

  return (
    <article
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onKeyDown={e => e.key === "Enter" && onSelect()}
      tabIndex={0}
      role="button"
      aria-label={`اقرأ قصة: ${story.title}`}
      style={{
        background: hovered
          ? `linear-gradient(145deg, ${catColor}18, ${CARD_BG})`
          : CARD_BG,
        border: `1px solid ${hovered ? catColor : catColor + "44"}`,
        borderRadius: 12,
        padding: "20px 18px",
        cursor: "pointer",
        transition: "all 0.2s ease",
        transform: hovered ? "translateY(-2px)" : "none",
        boxShadow: hovered ? `0 8px 24px ${catColor}22` : "none",
        display: "flex",
        flexDirection: "column",
        gap: 10,
        textAlign: "right",
        direction: "rtl",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 28 }}>{story.icon}</div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: 6, marginBottom: 6, flexWrap: "wrap" }}>
            <span style={{
              background: catColor + "33",
              color: catColor,
              border: `1px solid ${catColor}55`,
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 11,
              fontWeight: 700,
            }}>{story.category}</span>
            <span style={{
              background: "#ffffff11",
              color: "#aaa",
              borderRadius: 20,
              padding: "2px 10px",
              fontSize: 11,
            }}>{story.era}</span>
          </div>
          <h3 style={{ color: "#fff", fontSize: 14, fontWeight: 700, margin: 0, lineHeight: 1.4 }}>
            {story.title}
          </h3>
        </div>
      </div>

      <OrnamentalDivider color={catColor} />

      <p style={{ color: "#ccc", fontSize: 13, lineHeight: 1.6, margin: 0, flex: 1 }}>
        {story.summary.slice(0, 120)}…
      </p>

      {/* Tags */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
        {story.tags.slice(0, 3).map(tag => (
          <span key={tag} style={{
            background: "#ffffff0a",
            color: "var(--majalis-ink-soft, #C9C5B8)",
            borderRadius: 20,
            padding: "2px 8px",
            fontSize: 10,
          }}>#{tag}</span>
        ))}
      </div>

      <div style={{
        color: catColor,
        fontSize: 12,
        fontWeight: 600,
        display: "flex",
        alignItems: "center",
        gap: 4,
        marginTop: 4,
      }}>
        <span>اقرأ القصة</span>
        <span>←</span>
      </div>
    </article>
  );
}

// ─────────────────── Story Detail ────────────────────────────────────────────
function StoryDetail({ story, onBack }: { story: IslamicStory; onBack: () => void }) {
  const catColor = CATEGORY_COLORS[story.category] || GOLD;

  useEffect(() => { window.scrollTo({ top: 0, behavior: "smooth" }); }, [story.slug]);

  return (
    <div style={{ maxWidth: 820, margin: "0 auto", padding: "0 16px 40px", direction: "rtl", textAlign: "right" }}>
      {/* Back */}
      <button
        onClick={onBack}
        style={{
          background: "none",
          border: `1px solid ${catColor}55`,
          color: catColor,
          borderRadius: 8,
          padding: "8px 18px",
          cursor: "pointer",
          fontSize: 14,
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        ← العودة إلى القصص
      </button>

      {/* Hero */}
      <div style={{
        background: `linear-gradient(135deg, ${catColor}22, ${DARK_BG})`,
        border: `1px solid ${catColor}44`,
        borderRadius: 16,
        padding: "32px 28px",
        marginBottom: 28,
      }}>
        <div style={{ display: "flex", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{
            background: catColor + "33",
            color: catColor,
            border: `1px solid ${catColor}55`,
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 13,
            fontWeight: 700,
          }}>{story.category}</span>
          <span style={{
            background: "#ffffff11",
            color: "#aaa",
            borderRadius: 20,
            padding: "4px 14px",
            fontSize: 13,
          }}>{story.era}</span>
        </div>
        <div style={{ fontSize: 42, marginBottom: 12 }}>{story.icon}</div>
        <h1 style={{ color: "#fff", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 800, margin: "0 0 12px" }}>
          {story.title}
        </h1>
        <p style={{ color: "#ccc", fontSize: 15, lineHeight: 1.7, margin: 0 }}>{story.summary}</p>
      </div>

      {/* Full Content */}
      <section style={{
        background: CARD_BG,
        border: `1px solid ${catColor}33`,
        borderRadius: 12,
        padding: "28px 24px",
        marginBottom: 20,
      }}>
        <h2 style={{ color: catColor, fontSize: 16, fontWeight: 700, marginBottom: 16 }}>📖 تفاصيل القصة</h2>
        <div style={{ color: "#ddd", fontSize: 15, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>
          {story.full_content}
        </div>
      </section>

      {/* Key Lessons */}
      {story.key_lessons.length > 0 && (
        <section style={{
          background: `${ACCENT_GREEN}22`,
          border: `1px solid ${ACCENT_GREEN}44`,
          borderRadius: 12,
          padding: "24px 20px",
          marginBottom: 20,
        }}>
          <h2 style={{ color: "#4ADE80", fontSize: 16, fontWeight: 700, marginBottom: 16 }}>💡 الدروس المستفادة</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: "none", display: "flex", flexDirection: "column", gap: 10 }}>
            {story.key_lessons.map((lesson, i) => (
              <li key={i} style={{
                display: "flex",
                gap: 10,
                color: "#ccc",
                fontSize: 14,
                lineHeight: 1.6,
                alignItems: "flex-start",
              }}>
                <IslamicStar size={16} color="#4ADE80" />
                <span>{lesson}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        {/* Related Figures */}
        {story.related_figures.length > 0 && (
          <section style={{
            background: `${ACCENT_PURPLE}22`,
            border: `1px solid ${ACCENT_PURPLE}44`,
            borderRadius: 12,
            padding: "20px 18px",
          }}>
            <h2 style={{ color: "#A78BFA", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>👥 الشخصيات</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {story.related_figures.map((fig, i) => (
                <span key={i} style={{ color: "#bbb", fontSize: 13 }}>• {fig}</span>
              ))}
            </div>
          </section>
        )}

        {/* Sources */}
        {story.sources.length > 0 && (
          <section style={{
            background: "#B8860B22",
            border: "1px solid #B8860B44",
            borderRadius: 12,
            padding: "20px 18px",
          }}>
            <h2 style={{ color: GOLD, fontSize: 14, fontWeight: 700, marginBottom: 12 }}>📚 المصادر</h2>
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {story.sources.map((src, i) => (
                <span key={i} style={{ color: "#bbb", fontSize: 12 }}>• {src}</span>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Tags */}
      {story.tags.length > 0 && (
        <div style={{ marginTop: 20, display: "flex", flexWrap: "wrap", gap: 8 }}>
          {story.tags.map(tag => (
            <span key={tag} style={{
              background: "#ffffff0a",
              color: "var(--majalis-ink-soft, #C9C5B8)",
              border: "1px solid #ffffff11",
              borderRadius: 20,
              padding: "4px 12px",
              fontSize: 12,
            }}>#{tag}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─────────────────── Loading State ───────────────────────────────────────────
function LoadingGrid() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(280px,1fr))", gap: 16 }}>
      {[...Array(6)].map((_, i) => (
        <div key={i} style={{
          background: CARD_BG,
          borderRadius: 12,
          padding: 20,
          height: 200,
          animation: "pulse 1.5s ease-in-out infinite",
          opacity: 0.6,
        }} />
      ))}
    </div>
  );
}

// ─────────────────── Main Page ───────────────────────────────────────────────
export default function IslamicStoriesPage() {
  const [stories, setStories] = useState<IslamicStory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [category, setCategory] = useState<Category>("الكل");
  const [era, setEra] = useState<Era>("الكل");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!isSupabaseConfigured()) {
      setError("قاعدة البيانات غير مُهيأة.");
      setLoading(false);
      return;
    }
    supabase
      .from("islamic_stories")
      .select("*")
      .eq("is_approved", true)
      .order("category")
      .order("era")
      .then(({ data, error: err }) => {
        if (err) { setError("تعذّر تحميل القصص."); }
        else { setStories((data || []) as IslamicStory[]); }
        setLoading(false);
      });
  }, []);

  const filtered = stories.filter(s => {
    if (category !== "الكل" && s.category !== category) return false;
    if (era !== "الكل" && s.era !== era) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        s.title.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const selectedStory = selectedSlug ? stories.find(s => s.slug === selectedSlug) : null;

  const counts = {
    صحابة: stories.filter(s => s.category === "صحابة").length,
    فتوحات: stories.filter(s => s.category === "فتوحات").length,
    تاريخ: stories.filter(s => s.category === "تاريخ").length,
  };

  if (selectedStory) {
    return (
      <div style={{ minHeight: "100vh", background: DARK_BG, paddingTop: 32 }}>
        <StoryDetail story={selectedStory} onBack={() => setSelectedSlug(null)} />
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: DARK_BG, direction: "rtl", textAlign: "right" }}>
      <style>{`
        @keyframes pulse { 0%,100%{opacity:0.6} 50%{opacity:0.3} }
        .isp-filter-btn { background: none; border: 1px solid #333; color: #aaa; border-radius: 20px; padding: 6px 16px; cursor: pointer; font-size: 13px; transition: all 0.2s; font-family: inherit; }
        .isp-filter-btn:hover { border-color: #888; color: #fff; }
        .isp-filter-btn.active { background: var(--ac); border-color: var(--ac); color: #fff; font-weight: 700; }
        .isp-search { width: 100%; background: #162035; border: 1px solid #333; border-radius: 10px; padding: 10px 16px; color: #fff; font-size: 14px; font-family: inherit; outline: none; transition: border 0.2s; direction: rtl; }
        .isp-search:focus { border-color: ${GOLD}88; }
        .isp-search::placeholder { color: #666; }
      `}</style>

      {/* Hero */}
      <div style={{
        backgroundColor: DARK_BG,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Cpath d='M50,4 L57.27,32.45 L82.53,17.47 L67.55,42.73 L96,50 L67.55,57.27 L82.53,82.53 L57.27,67.55 L50,96 L42.73,67.55 L17.47,82.53 L32.45,57.27 L4,50 L32.45,42.73 L17.47,17.47 L42.73,32.45 Z' fill='none' stroke='%23FFFFFF' stroke-opacity='0.055' stroke-width='1.1'/%3E%3Ccircle cx='50' cy='50' r='1.4' fill='%23FFFFFF' fill-opacity='0.08'/%3E%3C/svg%3E")`,
        backgroundSize: "100px 100px",
        padding: "48px 20px 40px",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}>
        <div style={{ position: "absolute", top: -20, left: "50%", transform: "translateX(-50%)", opacity: 0.05, pointerEvents: "none" }}>
          <IslamicStar size={300} color={GOLD} />
        </div>
        <div style={{ position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, marginBottom: 20 }}>
            <IslamicStar size={22} color={GOLD} opacity={0.5} />
            <IslamicStar size={30} color={GOLD} />
            <IslamicStar size={22} color={GOLD} opacity={0.5} />
          </div>
          <h1 style={{
            color: "#fff",
            fontSize: "clamp(26px, 5vw, 42px)",
            fontWeight: 900,
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}>القصص الإسلامية</h1>
          <div style={{
            color: GOLD,
            fontSize: "clamp(13px, 2vw, 16px)",
            fontWeight: 400,
            marginBottom: 20,
          }}>صحابة الكرام · الفتوحات الإسلامية · التاريخ الحضاري</div>

          {/* Stats */}
          <div style={{ display: "flex", justifyContent: "center", gap: 24, flexWrap: "wrap" }}>
            {(["صحابة", "فتوحات", "تاريخ"] as const).map(cat => (
              <div key={cat} style={{
                background: `${CATEGORY_COLORS[cat]}22`,
                border: `1px solid ${CATEGORY_COLORS[cat]}44`,
                borderRadius: 10,
                padding: "8px 20px",
                color: CATEGORY_COLORS[cat],
                fontSize: 13,
                fontWeight: 700,
              }}>
                {cat} · {counts[cat]}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "24px 16px" }}>
        {/* Search */}
        <div style={{ marginBottom: 18 }}>
          <input
            className="isp-search"
            placeholder="🔍 ابحث في القصص…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Category Filter */}
        <div style={{ marginBottom: 14 }}>
          <div style={{ color: "var(--majalis-ink-muted, #9BA3B5)", fontSize: 11, marginBottom: 8 }}>التصنيف</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {CATEGORY_LABELS.map(cat => (
              <button
                key={cat}
                className={`isp-filter-btn${category === cat ? " active" : ""}`}
                style={{ "--ac": cat === "الكل" ? GOLD : CATEGORY_COLORS[cat] } as React.CSSProperties}
                onClick={() => setCategory(cat)}
              >{cat}</button>
            ))}
          </div>
        </div>

        {/* Era Filter */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ color: "var(--majalis-ink-muted, #9BA3B5)", fontSize: 11, marginBottom: 8 }}>الحقبة الزمنية</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            {ERA_LABELS.map(e => (
              <button
                key={e}
                className={`isp-filter-btn${era === e ? " active" : ""}`}
                style={{ "--ac": GOLD } as React.CSSProperties}
                onClick={() => setEra(e)}
              >{e}</button>
            ))}
          </div>
        </div>

        {/* Results count */}
        {!loading && (
          <div style={{ color: "var(--majalis-ink-muted, #9BA3B5)", fontSize: 13, marginBottom: 16 }}>
            {filtered.length} قصة
            {search && ` — نتائج البحث عن "${search}"`}
          </div>
        )}

        {/* Content */}
        {loading ? (
          <LoadingGrid />
        ) : error ? (
          <div style={{
            textAlign: "center",
            padding: 48,
            color: "#ff6b6b",
            background: "#ff6b6b11",
            borderRadius: 12,
            border: "1px solid #ff6b6b33",
          }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>⚠️</div>
            <div>{error}</div>
          </div>
        ) : stories.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: 60,
            color: "var(--majalis-ink-muted, #9BA3B5)",
          }}>
            <IslamicStar size={48} color={GOLD} opacity={0.3} />
            <div style={{ marginTop: 16, fontSize: 15 }}>لا توجد قصص معتمدة بعد.</div>
            <div style={{ fontSize: 13, marginTop: 8, color: "var(--majalis-ink-soft, #C9C5B8)" }}>يمكن اعتماد القصص من لوحة التحكم.</div>
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: "center", padding: 48, color: "var(--majalis-ink-muted, #9BA3B5)" }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔍</div>
            <div>لا توجد نتائج للبحث أو الفلتر المحدد.</div>
          </div>
        ) : (
          <div style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}>
            {filtered.map(story => (
              <StoryCard
                key={story.slug}
                story={story}
                onSelect={() => setSelectedSlug(story.slug)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
