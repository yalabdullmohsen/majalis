import { useEffect } from "react";
import { applyPageSeo } from "@/lib/seo";
import { IslamicDivider, StarKhatam } from "@/components/IslamicDecorations";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import {
  AMR_BIL_MARUF_LEVELS,
  AMR_BIL_MARUF_CONDITIONS,
  AMR_BIL_MARUF_META,
  MAJOR_MUNKARAAT,
  MAJOR_MAARUF,
} from "@/lib/amr-bil-maruf-seed";

const RANK_COLOR: Record<number, { bg: string; border: string; badge: string }> = {
  1: { bg: "rgba(23,61,53,.08)", border: "#28584D", badge: "#28584D" },
  2: { bg: "#ECFDF5", border: "#10B981", badge: "#059669" },
  3: { bg: "#EFF6FF", border: "#3B82F6", badge: "#1D4ED8" },
};

export default function AmrBilMarufPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/amr-bil-maruf",
      title: "الأمر بالمعروف والنهي عن المنكر | المجلس العلمي",
      description: "مراتب الأمر بالمعروف والنهي عن المنكر الثلاث وشروطها وأحكامها وفق المذاهب الفقهية الأربعة.",
      keywords: ["أمر بالمعروف", "نهي عن المنكر", "مراتب", "شروط", "فقه"],
      jsonLd: [{
        "@context": "https://schema.org",
        "@type": "Article",
        headline: "الأمر بالمعروف والنهي عن المنكر",
        description: "مراتب الأمر بالمعروف والنهي عن المنكر الثلاث وشروطها وأحكامها وفق المذاهب الفقهية الأربعة.",
        url: "https://www.majlisilm.com/amr-bil-maruf",
        inLanguage: "ar",
        publisher: { "@type": "Organization", name: "المجلس العلمي", url: "https://www.majlisilm.com" },
      }],
    });
  }, []);

  return (
    <div className="page-shell narrow" dir="rtl" style={{ paddingBottom: "3rem" }}>
      {/* ═══ الهيدر ═══ */}
      <div style={{
        background: "linear-gradient(160deg, #173D35 0%, #163728 55%, #0e2619 100%)",
        borderRadius: "1rem",
        padding: "2rem 1.5rem",
        marginBottom: "2rem",
        position: "relative",
        overflow: "hidden",
        textAlign: "center",
      }}>
        <div className="home-hero-pattern" aria-hidden="true" style={{ pointerEvents: "none" }} />
        <div style={{ position: "relative" }}>
          <StarKhatam size={52} color="rgba(255,255,255,0.35)" opacity={0.7} />
          <h1 style={{
            color: "#fff",
            fontSize: "clamp(1.4rem, 4vw, 2rem)",
            fontWeight: 800,
            margin: "0.5rem 0 0.25rem",
            letterSpacing: "-0.02em",
          }}>
            الأمر بالمعروف والنهي عن المنكر
          </h1>
          <p style={{ color: "rgba(255,255,255,0.82)", fontSize: "0.92rem", margin: 0, lineHeight: 1.6 }}>
            مراتبه الثلاث، شروطه، وأحكامه في الفقه الإسلامي
          </p>
          <div style={{ marginTop: "1rem", display: "flex", justifyContent: "center" }}>
            <IslamicDivider width={260} color="rgba(255,255,255,0.7)" opacity={0.6} />
          </div>
        </div>
      </div>

      {/* ═══ الآية والحديث الأساسيان ═══ */}
      <section style={{
        background: "var(--msk-canvas, #F7F4ED)",
        border: "1.5px solid #d1e7da",
        borderRadius: "0.75rem",
        padding: "1.4rem 1.5rem",
        marginBottom: "1.75rem",
      }}>
        <p style={{ fontSize: "0.8rem", color: "#5E655F", marginBottom: "0.4rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>
          الأساس الشرعي
        </p>
        <blockquote style={{
          fontSize: "clamp(1rem, 2.5vw, 1.18rem)",
          fontWeight: 700,
          color: "#122019",
          margin: "0 0 0.6rem",
          lineHeight: 1.8,
          borderRight: "3px solid #173D35",
          paddingRight: "1rem",
        }}>
          {AMR_BIL_MARUF_META.quran_basis}
        </blockquote>
        <p style={{ fontSize: "0.8rem", color: "#4B5563", margin: "0 0 1.2rem", paddingRight: "1rem" }}>
          {AMR_BIL_MARUF_META.quran_source}
        </p>
        <blockquote style={{
          fontSize: "0.95rem",
          fontStyle: "italic",
          color: "#68716D",
          margin: "0",
          borderRight: "3px solid #10B981",
          paddingRight: "1rem",
          lineHeight: 1.7,
        }}>
          «{AMR_BIL_MARUF_META.main_hadith}»
        </blockquote>
        <p style={{ fontSize: "0.78rem", color: "#4B5563", marginTop: "0.3rem", paddingRight: "1rem" }}>
          {AMR_BIL_MARUF_META.main_hadith_source}
        </p>
      </section>

      {/* ═══ الحكم العام ═══ */}
      <div style={{
        background: "#F0FDF4",
        border: "1px solid #86EFAC",
        borderRadius: "0.65rem",
        padding: "0.9rem 1.2rem",
        marginBottom: "2rem",
        display: "flex",
        alignItems: "flex-start",
        gap: "0.75rem",
      }}>
        <span style={{ fontSize: "1.4rem", flexShrink: 0 }}>⚖️</span>
        <div>
          <p style={{ fontWeight: 700, color: "#15803D", margin: "0 0 0.2rem", fontSize: "0.88rem" }}>الحكم الشرعي</p>
          <p style={{ margin: 0, fontSize: "0.88rem", color: "#166534", lineHeight: 1.6 }}>
            {AMR_BIL_MARUF_META.ruling}
          </p>
        </div>
      </div>

      {/* ═══ المراتب الثلاث ═══ */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#122019", marginBottom: "1rem" }}>
        المراتب الثلاث
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
        {AMR_BIL_MARUF_LEVELS.map((level) => {
          const clr = RANK_COLOR[level.rank];
          return (
            <article key={level.id} style={{
              border: `1.5px solid ${clr.border}`,
              borderRadius: "0.85rem",
              background: clr.bg,
              overflow: "hidden",
            }}>
              {/* رأس البطاقة */}
              <div style={{
                background: clr.badge,
                padding: "0.75rem 1.2rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem",
              }}>
                <span style={{
                  background: "rgba(255,255,255,0.25)",
                  color: "#fff",
                  borderRadius: "50%",
                  width: 32,
                  height: 32,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "0.95rem",
                  flexShrink: 0,
                }}>
                  {level.rank}
                </span>
                <div>
                  <h3 style={{ margin: 0, color: "#fff", fontWeight: 800, fontSize: "1.05rem", lineHeight: 1.2 }}>
                    {level.title}
                  </h3>
                  <span style={{ fontSize: "0.8rem", color: "rgba(255,255,255,0.85)" }}>
                    {level.is_obligatory ? "فرض عين" : "فرض كفاية"} — {level.who_can_do}
                  </span>
                </div>
              </div>

              <div style={{ padding: "1.2rem" }}>
                <p style={{ margin: "0 0 1rem", color: "#68716D", lineHeight: 1.65, fontSize: "0.9rem" }}>
                  {level.description}
                </p>

                {/* الشروط */}
                <div style={{ marginBottom: "1rem" }}>
                  <p style={{ fontWeight: 700, fontSize: "0.82rem", color: "#68716D", margin: "0 0 0.5rem" }}>الشروط والضوابط</p>
                  <ul style={{ margin: 0, paddingRight: "1.25rem", display: "flex", flexDirection: "column", gap: "0.3rem" }}>
                    {level.conditions.map((c, i) => (
                      <li key={i} style={{ fontSize: "0.83rem", color: "#4B5563", lineHeight: 1.55 }}>{c}</li>
                    ))}
                  </ul>
                </div>

                {/* الأدلة */}
                <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem", marginBottom: "0.9rem" }}>
                  {level.evidence.map((ev, i) => (
                    <div key={i} style={{
                      background: "rgba(255,255,255,0.65)",
                      borderRadius: "0.5rem",
                      padding: "0.6rem 0.85rem",
                      borderRight: `3px solid ${clr.badge}`,
                    }}>
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: 700,
                        color: clr.badge,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                      }}>
                        {ev.type}
                      </span>
                      <p style={{ margin: "0.15rem 0 0.1rem", fontSize: "0.84rem", color: "#1F2937", lineHeight: 1.6, fontWeight: 500 }}>
                        {ev.type === "حديث" ? `«${ev.text}»` : ev.text}
                      </p>
                      <p style={{ margin: 0, fontSize: "0.8rem", color: "#5E655F" }}>{ev.source}</p>
                    </div>
                  ))}
                </div>

                {/* ملاحظة العلماء */}
                <div style={{
                  background: "rgba(255,255,255,0.5)",
                  borderRadius: "0.5rem",
                  padding: "0.65rem 0.9rem",
                  borderRight: `2px dashed ${clr.badge}`,
                }}>
                  <p style={{ margin: 0, fontSize: "0.8rem", color: "#68716D", lineHeight: 1.6, fontStyle: "italic" }}>
                    📚 {level.notes}
                  </p>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* ═══ الشروط العامة ═══ */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#122019", marginBottom: "1rem" }}>
        الشروط العامة للأمر بالمعروف والنهي عن المنكر
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.9rem", marginBottom: "2.5rem" }}>
        {AMR_BIL_MARUF_CONDITIONS.map((cond, i) => (
          <div key={cond.id} style={{
            background: "#fff",
            border: "1px solid #E7E2D8",
            borderRadius: "0.7rem",
            padding: "1rem",
            borderTop: "3px solid #173D35",
          }}>
            <div style={{ display: "flex", gap: "0.6rem", alignItems: "flex-start" }}>
              <span style={{
                background: "#173D35",
                color: "#fff",
                borderRadius: "50%",
                width: 24,
                height: 24,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.7rem",
                fontWeight: 800,
                flexShrink: 0,
                marginTop: "0.1rem",
              }}>
                {i + 1}
              </span>
              <div>
                <h3 style={{ margin: "0 0 0.35rem", fontSize: "0.88rem", fontWeight: 700, color: "#202725", lineHeight: 1.35 }}>
                  {cond.title}
                </h3>
                <p style={{ margin: "0 0 0.5rem", fontSize: "0.8rem", color: "#4B5563", lineHeight: 1.6 }}>
                  {cond.detail}
                </p>
                {cond.scholar_note && (
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "#5E655F", fontStyle: "italic", lineHeight: 1.5 }}>
                    {cond.scholar_note}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ═══ المنكرات والمعروفات ═══ */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#122019", marginBottom: "1rem" }}>
        أمثلة على المنكرات والمعروفات الكبرى
      </h2>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.9rem", marginBottom: "2.5rem" }}>
        <div>
          <div style={{
            background: "#FEF2F2",
            border: "1px solid #FCA5A5",
            borderRadius: "0.7rem",
            padding: "0.85rem 1rem",
            marginBottom: "0.5rem",
          }}>
            <p style={{ fontWeight: 700, color: "#DC2626", margin: "0 0 0.5rem", fontSize: "0.88rem" }}>
              🚫 منكرات تستوجب الإنكار
            </p>
          </div>
          {MAJOR_MUNKARAAT.map((m) => (
            <div key={m.id} style={{
              background: "#FFF1F2",
              border: "1px solid #FECDD3",
              borderRadius: "0.6rem",
              padding: "0.7rem 0.85rem",
              marginBottom: "0.45rem",
            }}>
              <p style={{ fontWeight: 700, fontSize: "0.83rem", color: "#9F1239", margin: "0 0 0.2rem" }}>
                {m.title}
              </p>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#4B5563", lineHeight: 1.55 }}>
                {m.explanation}
              </p>
            </div>
          ))}
        </div>

        <div>
          <div style={{
            background: "#F0FDF4",
            border: "1px solid #86EFAC",
            borderRadius: "0.7rem",
            padding: "0.85rem 1rem",
            marginBottom: "0.5rem",
          }}>
            <p style={{ fontWeight: 700, color: "#15803D", margin: "0 0 0.5rem", fontSize: "0.88rem" }}>
              ✅ معروفات ينبغي الأمر بها
            </p>
          </div>
          {MAJOR_MAARUF.map((m) => (
            <div key={m.id} style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "0.6rem",
              padding: "0.7rem 0.85rem",
              marginBottom: "0.45rem",
            }}>
              <p style={{ fontWeight: 700, fontSize: "0.83rem", color: "#14532D", margin: "0 0 0.2rem" }}>
                {m.title}
              </p>
              <p style={{ margin: 0, fontSize: "0.76rem", color: "#4B5563", lineHeight: 1.55 }}>
                {m.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ═══ أقوال العلماء ═══ */}
      <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#122019", marginBottom: "1rem" }}>
        أقوال العلماء
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem", marginBottom: "2.5rem" }}>
        {AMR_BIL_MARUF_META.scholars_sayings.map((s, i) => (
          <figure key={i} style={{
            margin: 0,
            background: "#F7F4ED",
            border: "1px solid #E7E2D8",
            borderRadius: "0.7rem",
            padding: "1rem 1.2rem",
            borderRight: "3px solid #173D35",
          }}>
            <blockquote style={{
              margin: "0 0 0.5rem",
              fontSize: "0.88rem",
              color: "#1F2937",
              lineHeight: 1.7,
              fontStyle: "italic",
            }}>
              «{s.saying}»
            </blockquote>
            <figcaption style={{ fontSize: "0.76rem", color: "#5E655F", fontWeight: 600 }}>
              {s.scholar} — {s.source}
            </figcaption>
          </figure>
        ))}
      </div>

      {/* ═══ المراجع ═══ */}
      <section style={{
        background: "#F9FAFB",
        border: "1px solid #E7E2D8",
        borderRadius: "0.7rem",
        padding: "1.2rem",
      }}>
        <h3 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#68716D", margin: "0 0 0.75rem" }}>
          📚 المراجع الأساسية
        </h3>
        <ul style={{ margin: 0, paddingRight: "1.25rem", display: "flex", flexDirection: "column", gap: "0.35rem" }}>
          {AMR_BIL_MARUF_META.key_books.map((book, i) => (
            <li key={i} style={{ fontSize: "0.82rem", color: "#4B5563", lineHeight: 1.55 }}>{book}</li>
          ))}
        </ul>
      </section>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId="akhlaq" title="اختبر معلوماتك في الأمر بالمعروف" count={4} />
      </div>
    </div>
  );
}
