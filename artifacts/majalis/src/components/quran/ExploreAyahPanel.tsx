/**
 * ExploreAyahPanel — الميزة الفريدة لمجالس
 * تعرض كل ما يرتبط بالآية المحددة من محتوى المنصة:
 * دروس، فتاوى، أسئلة، فوائد، قصص أنبياء، الرسم البياني المعرفي.
 *
 * المصدر: intelligentSearch() — نص الآية كاستعلام بحث.
 */
import { useCallback, useEffect, useState } from "react";
import { useLocation } from "wouter";
import { C } from "@/lib/theme";
import {
  intelligentSearch,
  type IntelligentSearchResult,
} from "@/lib/scholarly-intelligence-service";

type Props = {
  surahNum: number;
  ayahNum: number;
  surahName: string;
  ayahText: string;
  onClose: () => void;
};

const KIND_META: Record<string, { label: string; icon: string }> = {
  lesson:        { label: "درس",          icon: "📚" },
  hadith:        { label: "حديث",         icon: "📿" },
  library:       { label: "كتاب",         icon: "📖" },
  fatwa:         { label: "فتوى",         icon: "🕌" },
  fiqh_decision: { label: "قرار فقهي",   icon: "⚖️" },
  fiqh:          { label: "فقه",          icon: "⚖️" },
  ruling:        { label: "حكم شرعي",    icon: "📋" },
  fawaid:        { label: "فائدة",        icon: "💡" },
  qa:            { label: "سؤال",         icon: "❓" },
  miracle:       { label: "إعجاز",        icon: "✨" },
  course:        { label: "دورة",         icon: "🎓" },
  update:        { label: "مستجد",        icon: "🔔" },
  knowledge:     { label: "معرفة",        icon: "🧠" },
  topic:         { label: "موضوع",        icon: "🏷️" },
};

const ORDER: string[] = [
  "lesson", "fatwa", "fiqh_decision", "fiqh", "ruling",
  "hadith", "qa", "fawaid", "library", "miracle", "course",
  "knowledge", "update", "topic",
];

function groupResults(items: IntelligentSearchResult[]): Map<string, IntelligentSearchResult[]> {
  const map = new Map<string, IntelligentSearchResult[]>();
  for (const item of items) {
    const kind = item.kind || "knowledge";
    const list = map.get(kind) ?? [];
    list.push(item);
    map.set(kind, list);
  }
  // Sort by ORDER then by kind
  const sorted = new Map<string, IntelligentSearchResult[]>();
  for (const k of ORDER) {
    if (map.has(k)) sorted.set(k, map.get(k)!);
  }
  for (const [k, v] of map.entries()) {
    if (!sorted.has(k)) sorted.set(k, v);
  }
  return sorted;
}

function Skeleton() {
  return (
    <div style={{ padding: "1rem" }}>
      {[1, 2, 3].map((i) => (
        <div key={i} style={{ display: "flex", gap: "0.75rem", marginBottom: "0.75rem" }}>
          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#e5e3dd", flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ height: "0.85rem", background: "#e5e3dd", borderRadius: "4px", marginBottom: "0.3rem", width: `${60 + i * 10}%` }} />
            <div style={{ height: "0.7rem", background: "#f0ede8", borderRadius: "4px", width: `${40 + i * 8}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}

export function ExploreAyahPanel({ ayahNum, surahName, ayahText, onClose }: Props) {
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [, navigate] = useLocation();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // نستخدم أول 60 حرفاً من نص الآية كاستعلام بحث لتجنب طول الاستعلام
      const queryText = ayahText.replace(/[ً-ٟـ]/g, "").slice(0, 60).trim();
      const res = await intelligentSearch(queryText, { limit: 30 });
      setResults(
        (res.results ?? []).filter(
          (r) => !r.kind?.startsWith("quran") && r.href,
        ),
      );
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, [ayahText]);

  useEffect(() => { load(); }, [load]);

  const groups = groupResults(results);
  const total = results.length;

  const handleSelect = (href: string) => {
    onClose();
    navigate(href);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9000,
          background: "rgba(0,0,0,0.45)",
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={`استكشاف آية ${ayahNum} من سورة ${surahName}`}
        style={{
          position: "fixed",
          bottom: 0,
          right: 0,
          left: 0,
          zIndex: 9001,
          background: "var(--majalis-parchment, #faf9f6)",
          borderRadius: "1.25rem 1.25rem 0 0",
          boxShadow: "0 -12px 40px rgba(0,0,0,0.2)",
          maxHeight: "80dvh",
          display: "flex",
          flexDirection: "column",
          direction: "rtl",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
      >
        {/* Handle */}
        <div
          aria-hidden="true"
          style={{
            width: "40px", height: "4px",
            borderRadius: "2px",
            background: "#c9c6c0",
            margin: "0.75rem auto 0",
            flexShrink: 0,
          }}
        />

        {/* Header */}
        <div style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          padding: "0.75rem 1rem 0.5rem",
          flexShrink: 0,
          borderBottom: `1px solid ${C.line}`,
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "1rem", fontWeight: 700, color: C.emeraldDeep }}>
              🔗 استكشف الآية
            </h2>
            <p style={{ margin: "0.2rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>
              سورة {surahName} · الآية {ayahNum}
              {!loading && ` · ${total} مصدر مرتبط`}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="إغلاق"
            style={{
              border: "none", background: "none", cursor: "pointer",
              fontSize: "1rem", color: C.inkSoft, minWidth: "44px", minHeight: "44px",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            ✕
          </button>
        </div>

        {/* Ayah preview */}
        <div style={{
          padding: "0.5rem 1rem",
          background: C.parchmentDeep,
          borderBottom: `1px solid ${C.line}`,
          flexShrink: 0,
        }}>
          <p
            dir="rtl"
            lang="ar"
            style={{
              margin: 0,
              fontSize: "1.05rem",
              fontFamily: '"Amiri Quran", "KFGQPC Uthmanic Script", "Scheherazade New", serif',
              lineHeight: 1.9,
              color: "var(--majalis-ink, #2c2412)",
              overflow: "hidden",
              display: "-webkit-box",
              WebkitLineClamp: 3,
              WebkitBoxOrient: "vertical",
            }}
          >
            {ayahText}
          </p>
        </div>

        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", WebkitOverflowScrolling: "touch" }}>
          {loading && <Skeleton />}

          {!loading && total === 0 && (
            <div style={{ padding: "2rem 1rem", textAlign: "center", color: C.inkSoft }}>
              <p style={{ fontSize: "1.5rem", margin: "0 0 0.5rem" }}>🔍</p>
              <p style={{ margin: 0, fontSize: "0.9rem" }}>
                لا يوجد محتوى مرتبط بهذه الآية حالياً في المنصة.
              </p>
            </div>
          )}

          {!loading && total > 0 && (
            <div style={{ padding: "0.5rem 0" }}>
              {Array.from(groups.entries()).map(([kind, items]) => {
                const meta = KIND_META[kind] ?? { label: kind, icon: "📄" };
                return (
                  <section key={kind} style={{ marginBottom: "0.25rem" }}>
                    {/* Section header */}
                    <div style={{
                      padding: "0.4rem 1rem",
                      background: C.parchmentDeep,
                      borderTop: `1px solid ${C.line}`,
                      borderBottom: `1px solid ${C.line}`,
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                    }}>
                      <span style={{ fontSize: "0.85rem" }}>{meta.icon}</span>
                      <span style={{ fontSize: "0.73rem", fontWeight: 700, color: C.inkSoft, letterSpacing: "0.04em" }}>
                        {meta.label}
                      </span>
                      <span style={{
                        fontSize: "0.68rem",
                        background: C.sage,
                        color: C.emeraldDeep,
                        padding: "0.05rem 0.4rem",
                        borderRadius: "999px",
                        fontWeight: 700,
                      }}>
                        {items.length}
                      </span>
                    </div>

                    {/* Items */}
                    {items.slice(0, 4).map((item, i) => (
                      <button
                        key={item.id ?? i}
                        type="button"
                        onClick={() => handleSelect(item.href)}
                        style={{
                          display: "flex",
                          alignItems: "flex-start",
                          gap: "0.6rem",
                          width: "100%",
                          padding: "0.65rem 1rem",
                          background: "none",
                          border: "none",
                          borderBottom: `1px solid ${C.line}`,
                          cursor: "pointer",
                          textAlign: "right",
                          minHeight: "44px",
                        }}
                        onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = C.sage; }}
                        onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                      >
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{
                            margin: "0 0 0.15rem",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--majalis-ink, #2c2412)",
                            lineHeight: 1.4,
                            overflow: "hidden",
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                          }}>
                            {item.title}
                          </p>
                          {item.source_name && (
                            <p style={{ margin: 0, fontSize: "0.72rem", color: C.inkSoft }}>
                              {item.source_name}
                            </p>
                          )}
                        </div>
                        <span style={{ flexShrink: 0, color: C.inkSoft, fontSize: "0.9rem", marginTop: "0.1rem" }}>←</span>
                      </button>
                    ))}
                  </section>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer — KG link */}
        <div style={{
          padding: "0.5rem 1rem",
          borderTop: `1px solid ${C.line}`,
          flexShrink: 0,
          display: "flex",
          justifyContent: "flex-end",
        }}>
          <button
            type="button"
            onClick={() => handleSelect("/knowledge-graph")}
            style={{
              fontSize: "0.78rem",
              color: C.emeraldDeep,
              background: "none",
              border: "none",
              cursor: "pointer",
              fontWeight: 700,
              fontFamily: "inherit",
              minHeight: "44px",
            }}
          >
            الرسم البياني المعرفي ←
          </button>
        </div>
      </div>
    </>
  );
}
