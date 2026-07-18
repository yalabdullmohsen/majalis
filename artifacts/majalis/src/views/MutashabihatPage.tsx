import { useEffect, useState, useMemo } from "react";
import { applyPageSeo } from "@/lib/seo";
import { fetchSurahDetail, type Ayah } from "@/lib/quran-api";
import {
  MUTASHABIHAT,
  MUTASHABIHAT_CATEGORIES,
  type MutashabihatPair,
} from "@/lib/mutashabihat-data";
import { ChevronDown, Eye, EyeOff, BookOpen } from "lucide-react";

/* ─── CSS داخلي — يستخدم design-system المتاح ─────────────────── */
const S = {
  page: { padding: "0 0 5rem" },
  hero: {
    padding: "2.5rem 1.25rem 2rem",
    textAlign: "center" as const,
    background: "linear-gradient(160deg, #0d2d22 0%, #173D35 60%, #1a4535 100%)",
  },
  heroIcon: { fontSize: "2.5rem", display: "block", marginBottom: "0.6rem" },
  heroTitle: { fontSize: "clamp(1.4rem,4vw,2.1rem)", fontWeight: 700, color: "#fff", margin: "0 0 0.4rem" },
  heroSub: { fontSize: "0.9rem", color: "rgba(255,255,255,0.65)", maxWidth: "500px", margin: "0 auto" },
  body: { maxWidth: "860px", margin: "0 auto", padding: "1.25rem 1rem" },
};

/* ─── نص الآية المجلوب ─────────────────────────────────────────── */
function AyahText({ surah, ayah: ayahNum, surahName }: { surah: number; ayah: number; surahName: string }) {
  const [text, setText] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    setText(null);
    fetchSurahDetail(surah)
      .then((detail) => {
        const a = detail.ayahs.find((a: Ayah) => a.numberInSurah === ayahNum);
        setText(a?.text ?? "تعذّر تحميل الآية");
      })
      .catch(() => setText("تعذّر التحميل"))
      .finally(() => setLoading(false));
  }, [surah, ayahNum]);

  return (
    <div
      style={{
        fontFamily: '"Amiri Quran","Scheherazade New",serif',
        fontSize: "1.15rem",
        lineHeight: 2.2,
        direction: "rtl",
        padding: "0.75rem 1rem",
        background: "rgba(14,110,82,0.05)",
        borderRight: "3px solid #28584D",
        borderRadius: "0 8px 8px 0",
        color: "var(--ds-text-1,#1a1a1a)",
        marginBottom: "0.5rem",
      }}
    >
      {loading ? (
        <span style={{ color: "#9ca3af", fontSize: "0.85rem" }}>جارٍ تحميل الآية...</span>
      ) : (
        <>
          ﴿{text}﴾
          <span style={{ fontSize: "0.75rem", color: "#6b7280", marginRight: "0.5rem", fontFamily: "inherit" }}>
            — {surahName}: {ayahNum}
          </span>
        </>
      )}
    </div>
  );
}

/* ─── بطاقة المتشابهة ──────────────────────────────────────────── */
function MutashabihatCard({ pair }: { pair: MutashabihatPair }) {
  const [open, setOpen] = useState(false);
  const [showHint, setShowHint] = useState(false);

  return (
    <div
      style={{
        borderRadius: "14px",
        border: "1.5px solid var(--ds-border,#e5e7eb)",
        background: "var(--ds-surface,#fff)",
        marginBottom: "0.85rem",
        overflow: "hidden",
        transition: "box-shadow 0.2s",
        boxShadow: open ? "0 6px 24px rgba(14,110,82,0.1)" : "none",
      }}
    >
      {/* رأس البطاقة */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        style={{
          width: "100%",
          padding: "1rem 1.25rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "0.75rem",
          background: "none",
          border: "none",
          cursor: "pointer",
          textAlign: "right",
          fontFamily: "inherit",
        }}
      >
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", gap: "0.5rem", alignItems: "center", flexWrap: "wrap", marginBottom: "0.25rem" }}>
            <span
              style={{
                padding: "0.15rem 0.5rem",
                borderRadius: "6px",
                background: "rgba(14,110,82,0.1)",
                color: "#28584D",
                fontSize: "0.7rem",
                fontWeight: 700,
              }}
            >
              {pair.category}
            </span>
            <span style={{ fontSize: "0.72rem", color: "#9ca3af" }}>
              {pair.refs.length} آية
            </span>
          </div>
          <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "var(--ds-text-1,#1a1a1a)", margin: 0 }}>
            {pair.title}
          </h3>
          <p style={{ fontSize: "0.8rem", color: "#6b7280", margin: "0.2rem 0 0", lineHeight: 1.5 }}>
            {pair.description}
          </p>
        </div>
        <span style={{ color: "#6b7280", flexShrink: 0 }}>
          <ChevronDown size={18} style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform 0.2s" }} />
        </span>
      </button>

      {/* جسم البطاقة */}
      {open && (
        <div style={{ padding: "0 1.25rem 1.25rem", borderTop: "1px solid var(--ds-border,#e5e7eb)" }}>
          {/* الآيات */}
          <div style={{ marginTop: "1rem" }}>
            {pair.refs.map((ref, i) => (
              <div key={i} style={{ marginBottom: "0.75rem" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#28584D", marginBottom: "0.3rem" }}>
                  سورة {ref.surahName} — الآية {ref.ayah}
                </div>
                <AyahText surah={ref.surah} ayah={ref.ayah} surahName={ref.surahName} />
              </div>
            ))}
          </div>

          {/* التلميح */}
          {pair.hint && (
            <div style={{ marginTop: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setShowHint((s) => !s)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.4rem 0.75rem",
                  borderRadius: "8px",
                  border: "1.5px solid var(--ds-border,#e5e7eb)",
                  background: "none",
                  cursor: "pointer",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  color: "#6b7280",
                  fontFamily: "inherit",
                }}
              >
                {showHint ? <EyeOff size={14} /> : <Eye size={14} />}
                {showHint ? "إخفاء التلميح" : "عرض تلميح الاختلاف"}
              </button>
              {showHint && (
                <div
                  style={{
                    marginTop: "0.5rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: "rgba(91,33,182,0.06)",
                    border: "1px solid rgba(91,33,182,0.15)",
                    fontSize: "0.85rem",
                    color: "#5B21B6",
                    lineHeight: 1.6,
                  }}
                >
                  💡 {pair.hint}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ─── الصفحة الرئيسية ──────────────────────────────────────────── */
export default function MutashabihatPage() {
  const [activeCategory, setActiveCategory] = useState<string>("الكل");
  const [search, setSearch] = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/mutashabihat",
      title: "الآيات المتشابهات في القرآن | المجلس العلمي",
      description:
        "نظام متخصص لدراسة الآيات المتشابهات في القرآن الكريم مع نصوص الآيات وتلميحات الاختلاف الدقيق.",
      keywords: ["الآيات المتشابهات", "متشابه القرآن", "حفظ القرآن", "تلاوة القرآن"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "WebPage",
        name: "الآيات المتشابهات في القرآن",
        description: "نظام متخصص لدراسة الآيات المتشابهات في القرآن الكريم.",
        url: "https://www.majlisilm.com/mutashabihat",
        inLanguage: "ar",
        publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
        about: { "@type": "Book", name: "القرآن الكريم", inLanguage: "ar" },
      }],
    });
  }, []);

  const filtered = useMemo(() => {
    let list = activeCategory === "الكل"
      ? MUTASHABIHAT
      : MUTASHABIHAT.filter((p) => p.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (p) =>
          p.title.includes(q) ||
          p.description.includes(q) ||
          p.refs.some((r) => r.surahName.includes(q))
      );
    }
    return list;
  }, [activeCategory, search]);

  return (
    <div style={S.page}>
      {/* Hero */}
      <div style={S.hero}>
        <span style={S.heroIcon}>📜</span>
        <h1 style={S.heroTitle}>الآيات المتشابهات في القرآن الكريم</h1>
        <p style={S.heroSub}>
          دراسة الآيات المتشابهة لفظًا مع بيان وجوه الاختلاف الدقيق بينها
          — مساعدة على الإتقان والحفظ الصحيح
        </p>
      </div>

      <div style={S.body}>
        {/* مصدر علمي */}
        <div
          style={{
            padding: "0.75rem 1rem",
            borderRadius: "10px",
            background: "rgba(14,110,82,0.06)",
            border: "1px solid rgba(14,110,82,0.15)",
            fontSize: "0.8rem",
            color: "#0F5132",
            marginBottom: "1.25rem",
            display: "flex",
            gap: "0.5rem",
            alignItems: "flex-start",
          }}
        >
          <BookOpen size={15} style={{ flexShrink: 0, marginTop: "2px" }} />
          <span>
            <strong>المصادر العلمية:</strong> درة التنزيل للخطيب الإسكافي، البرهان في متشابه القرآن للسخاوي، ملاك التأويل للغرناطي. نصوص الآيات من api.alquran.cloud (المصحف العثماني، رواية حفص).
          </span>
        </div>

        {/* فلتر الأصناف */}
        <div
          style={{
            display: "flex",
            gap: "0.35rem",
            flexWrap: "wrap",
            marginBottom: "1rem",
          }}
          role="tablist"
          aria-label="تصنيف الآيات المتشابهات"
        >
          {["الكل", ...MUTASHABIHAT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={activeCategory === cat}
              onClick={() => setActiveCategory(cat)}
              style={{
                padding: "0.35rem 0.75rem",
                borderRadius: "20px",
                border: "1.5px solid",
                borderColor: activeCategory === cat ? "#28584D" : "var(--ds-border,#e5e7eb)",
                background: activeCategory === cat ? "#28584D" : "transparent",
                color: activeCategory === cat ? "#fff" : "var(--ds-text-2,#6b7280)",
                fontSize: "0.8rem",
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "inherit",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* بحث */}
        <input
          type="search"
          placeholder="ابحث بالعنوان أو اسم السورة..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{
            width: "100%",
            padding: "0.5rem 0.85rem",
            borderRadius: "10px",
            border: "1.5px solid var(--ds-border,#e5e7eb)",
            background: "var(--ds-surface,#fff)",
            color: "var(--ds-text-1,#1a1a1a)",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            marginBottom: "1.25rem",
            boxSizing: "border-box",
          }}
          aria-label="البحث في الآيات المتشابهات"
        />

        {/* عدد النتائج */}
        <p style={{ fontSize: "0.8rem", color: "#6b7280", marginBottom: "0.75rem" }}>
          {filtered.length} {filtered.length === 1 ? "مجموعة" : "مجموعات"} متشابهة
        </p>

        {/* القائمة */}
        {filtered.length === 0 ? (
          <p style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>
            لا توجد نتائج تطابق البحث
          </p>
        ) : (
          filtered.map((pair) => (
            <MutashabihatCard key={pair.id} pair={pair} />
          ))
        )}
      </div>
    </div>
  );
}
