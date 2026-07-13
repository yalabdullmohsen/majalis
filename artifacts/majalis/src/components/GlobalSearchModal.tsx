import { useEffect, useRef, useState, useCallback } from "react";
import { useLocation } from "wouter";
import {
  intelligentSearch,
  type IntelligentSearchResult,
} from "@/lib/scholarly-intelligence-service";

const KIND_LABELS: Record<string, { label: string; icon: string }> = {
  lesson:   { label: "درس",      icon: "📚" },
  hadith:   { label: "حديث",     icon: "📿" },
  library:  { label: "كتاب",     icon: "📖" },
  fatwa:    { label: "فتوى",     icon: "🕌" },
  fiqh:     { label: "فقه",      icon: "⚖️" },
  ruling:   { label: "حكم",      icon: "📋" },
  fawaid:   { label: "فائدة",    icon: "💡" },
  qa:       { label: "سؤال",     icon: "❓" },
  quran:    { label: "قرآن",     icon: "📗" },
  course:   { label: "دورة",     icon: "🎓" },
  miracle:  { label: "إعجاز",    icon: "✨" },
  article:  { label: "مقال",     icon: "📰" },
  topic:    { label: "موضوع",    icon: "🏷️" },
};

const QUICK_LINKS = [
  { href: "/quran-studies", label: "الدراسات القرآنية", icon: "📗" },
  { href: "/adhkar",  label: "الأذكار",          icon: "📿" },
  { href: "/lessons", label: "الدروس",           icon: "📚" },
  { href: "/hadith",  label: "الأحاديث",         icon: "🔍" },
  { href: "/fatwa",   label: "الفتاوى",          icon: "🕌" },
  { href: "/assistant", label: "المساعد العلمي", icon: "🤖" },
];

type Props = { onClose: () => void };

export function GlobalSearchModal({ onClose }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<IntelligentSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [, navigate] = useLocation();
  const inputRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!query.trim()) { setResults([]); return; }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await intelligentSearch(query.trim(), { limit: 12 });
        setResults(res.results ?? []);
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [query]);

  const handleSelect = useCallback((href: string) => {
    onClose();
    navigate(href);
  }, [onClose, navigate]);

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") onClose();
  };

  const meta = KIND_LABELS;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="البحث الشامل"
      style={{
        position: "fixed", inset: 0, zIndex: 10000,
        background: "rgba(0,0,0,0.55)",
        display: "flex", alignItems: "flex-start", justifyContent: "center",
        paddingTop: "clamp(3rem, 10vh, 6rem)",
        direction: "rtl",
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: "min(94vw, 42rem)",
          background: "#fff",
          borderRadius: "1rem",
          boxShadow: "0 24px 64px rgba(0,0,0,0.3)",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div style={{ display: "flex", alignItems: "center", padding: "0.75rem 1rem", borderBottom: "1px solid #e5e1d9", gap: "0.6rem" }}>
          <span style={{ fontSize: "1.1rem", color: "#a0978b" }}>🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKey}
            placeholder="ابحث في التطبيق — أحاديث، دروس، كتب، فتاوى..."
            style={{
              flex: 1, border: "none", outline: "none",
              fontSize: "1rem", background: "transparent",
              color: "#2c2412", direction: "rtl",
            }}
            aria-label="بحث"
          />
          {loading && <span style={{ fontSize: "0.8rem", color: "#a0978b" }}>جارٍ…</span>}
          <kbd
            onClick={onClose}
            style={{
              cursor: "pointer", padding: "0.15rem 0.45rem",
              border: "1px solid #d1ccc4", borderRadius: "0.3rem",
              fontSize: "0.72rem", color: "#a0978b", background: "#faf9f7",
            }}
          >
            Esc
          </kbd>
        </div>

        {/* Results */}
        <div style={{ maxHeight: "min(60vh, 26rem)", overflowY: "auto" }}>
          {query.trim() === "" && (
            <div style={{ padding: "1rem" }}>
              <p style={{ margin: "0 0 0.6rem", fontSize: "0.75rem", color: "#a0978b", fontWeight: 600 }}>روابط سريعة</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {QUICK_LINKS.map((l) => (
                  <button
                    key={l.href}
                    type="button"
                    onClick={() => handleSelect(l.href)}
                    style={{
                      display: "flex", alignItems: "center", gap: "0.35rem",
                      padding: "0.35rem 0.8rem", borderRadius: "2rem",
                      background: "#f5f3ef", border: "1px solid #e5e1d9",
                      fontSize: "0.82rem", cursor: "pointer", color: "#2c2412",
                    }}
                  >
                    <span>{l.icon}</span> {l.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {query.trim() !== "" && results.length === 0 && !loading && (
            <div style={{ padding: "2rem", textAlign: "center", color: "#a0978b" }}>
              <p style={{ margin: 0 }}>لا نتائج لـ «{query}»</p>
              <p style={{ margin: "0.5rem 0 0", fontSize: "0.82rem" }}>
                جرّب <a href={`/search/${encodeURIComponent(query)}`} onClick={() => onClose()} style={{ color: "#1a5c35" }}>البحث المتقدم</a>
              </p>
            </div>
          )}

          {results.length > 0 && (
            <ul style={{ listStyle: "none", margin: 0, padding: "0.5rem 0" }}>
              {results.map((r, i) => {
                const m = meta[r.kind] ?? { label: r.kind, icon: "📄" };
                return (
                  <li key={r.id ?? i}>
                    <button
                      type="button"
                      onClick={() => handleSelect(r.href)}
                      style={{
                        display: "flex", alignItems: "flex-start", gap: "0.65rem",
                        width: "100%", padding: "0.65rem 1rem", textAlign: "right",
                        background: "none", border: "none", cursor: "pointer",
                        borderBottom: "1px solid #f0ede8",
                      }}
                      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "#f5f3ef"; }}
                      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.background = "none"; }}
                    >
                      <span style={{ fontSize: "1.1rem", lineHeight: 1, flexShrink: 0, marginTop: "0.1rem" }}>{m.icon}</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ margin: "0 0 0.15rem", fontSize: "0.9rem", fontWeight: 700, color: "#2c2412", lineHeight: 1.4 }}>
                          {r.title}
                        </p>
                        {r.summary && (
                          <p style={{ margin: 0, fontSize: "0.78rem", color: "#78716c", lineHeight: 1.5, overflow: "hidden", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical" }}>
                            {r.summary}
                          </p>
                        )}
                      </div>
                      <span style={{ flexShrink: 0, padding: "0.15rem 0.45rem", background: "#f0ede8", borderRadius: "0.3rem", fontSize: "0.7rem", color: "#78716c", whiteSpace: "nowrap", marginTop: "0.1rem" }}>
                        {m.label}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: "0.5rem 1rem", borderTop: "1px solid #f0ede8", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span style={{ fontSize: "0.72rem", color: "#b5afa8" }}>⌘K للفتح • Esc للإغلاق</span>
          {query.trim() && (
            <button
              type="button"
              onClick={() => { onClose(); navigate(`/search/${encodeURIComponent(query.trim())}`); }}
              style={{ fontSize: "0.78rem", color: "#1a5c35", background: "none", border: "none", cursor: "pointer", fontWeight: 600 }}
            >
              بحث متقدم ←
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
