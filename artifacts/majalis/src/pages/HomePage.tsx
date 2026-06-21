import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { C } from "@/lib/theme";
import { getLessons, getSheikhs, getApprovedFawaid, getLibrary, getMiracles, getQaQuestions } from "@/lib/supabase";

const FEATURES = [
  { href: "/lessons", icon: "📚", title: "الدروس والدورات", desc: "دروس علمية شرعية موثّقة ومعتمدة" },
  { href: "/sheikhs", icon: "👳", title: "المشايخ والدعاة", desc: "نخبة من المشايخ المعتمدين" },
  { href: "/library", icon: "🏛", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات ومقالات" },
  { href: "/miracles", icon: "🌌", title: "الإعجاز العلمي", desc: "مقالات موثّقة من الكتاب والسنة" },
  { href: "/qa", icon: "❓", title: "الأسئلة والأجوبة", desc: "أجوبة علمية مدعّمة بالأدلة" },
  { href: "/fawaid", icon: "💎", title: "الفوائد", desc: "فوائد دينية مختارة ومراجَعة" },
];

const VALUES = [
  { icon: "✓", title: "محتوى موثّق", desc: "كل مادة مدعّمة بالدليل والمرجع" },
  { icon: "✦", title: "مشايخ معتمدون", desc: "إجازات علمية وتخصصات دقيقة" },
  { icon: "♡", title: "وصول مجاني", desc: "العلم الشرعي متاح للجميع" },
];

function BrassRule() {
  return <div style={{ height: 1, background: C.brass, opacity: 0.35, margin: "0" }} />;
}

function SectionHead({ title, href }: { title: string; href?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "1rem" }}>
      <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", margin: 0 }}>{title}</h2>
      {href && <Link href={href} style={{ fontSize: "0.8125rem", color: C.brassDeep, textDecoration: "none", fontWeight: 600 }}>عرض الكل ←</Link>}
    </div>
  );
}

export default function HomePage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [library, setLibrary] = useState<any[]>([]);
  const [miracles, setMiracles] = useState<any[]>([]);
  const [qa, setQa] = useState<any[]>([]);
  const [term, setTerm] = useState("");
  const [, navigate] = useLocation();

  useEffect(() => {
    Promise.all([getLessons(), getSheikhs(), getApprovedFawaid(), getLibrary(), getMiracles(), getQaQuestions()]).then(
      ([l, s, f, lib, m, q]) => {
        setLessons((l.data || []).slice(0, 3));
        setSheikhs((s.data || []).slice(0, 4));
        setFawaid((f.data || []).slice(0, 3));
        setLibrary((lib.data || []).slice(0, 4));
        setMiracles((m.data || []).slice(0, 3));
        setQa((q.data || []).slice(0, 3));
      }
    );
  }, []);

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const q = term.trim();
    if (q) navigate(`/search/${encodeURIComponent(q)}`);
  };

  return (
    <div>
      {/* ── Hero ─────────────────────────────────────────── */}
      <div style={{ background: C.emeraldDeep, color: C.parchment, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: `repeating-linear-gradient(45deg, ${C.parchment} 0, ${C.parchment} 1px, transparent 1px, transparent 22px)` }} />
        <div style={{ maxWidth: "60rem", margin: "0 auto", padding: "4.5rem 1.25rem 4rem", textAlign: "center", position: "relative" }}>
          <p style={{ fontSize: "0.875rem", color: C.brass, letterSpacing: "0.08em", marginBottom: "0.75rem", fontWeight: 600 }}>
            المنصة العلمية الشرعية
          </p>
          <h1 style={{ fontSize: "3.25rem", fontWeight: 700, fontFamily: "Amiri, serif", margin: "0 0 1rem", lineHeight: 1.15 }}>
            مجالس
          </h1>
          <div style={{ width: "3rem", height: 2, background: C.brass, margin: "0 auto 1.25rem" }} />
          <p style={{ fontSize: "1.0625rem", color: "#E8E0CE", maxWidth: "34rem", margin: "0 auto 1.75rem", lineHeight: 1.85 }}>
            الدروس والدورات والمشايخ والمكتبة العلمية والإعجاز العلمي والفوائد — مجتمعةً في مكانٍ واحد، موثّقة ومعتمدة.
          </p>

          {/* search */}
          <form onSubmit={submitSearch} style={{ maxWidth: "30rem", margin: "0 auto 1.5rem", display: "flex", gap: "0.5rem" }}>
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="ابحث في الدروس والمشايخ والمكتبة..."
              style={{ flex: 1, padding: "0.75rem 1rem", borderRadius: "0.5rem", border: "none", fontSize: "0.9rem", fontFamily: "inherit", outline: "none", color: C.ink, background: C.parchment }}
            />
            <button type="submit" style={{ padding: "0.75rem 1.25rem", borderRadius: "0.5rem", background: C.brass, color: C.ink, border: "none", cursor: "pointer", fontWeight: 700, fontFamily: "inherit", fontSize: "0.9rem", whiteSpace: "nowrap" }}>
              بحث
            </button>
          </form>

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/lessons" style={{ padding: "0.6rem 1.5rem", borderRadius: "0.5rem", background: C.parchment, color: C.emeraldDeep, textDecoration: "none", fontWeight: 700, fontSize: "0.9rem" }}>
              استعرض الدروس
            </Link>
            <Link href="/about" style={{ padding: "0.6rem 1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.brass}`, color: C.parchment, textDecoration: "none", fontSize: "0.9rem" }}>
              عن المنصة
            </Link>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "3rem 1rem 4rem" }}>
        {/* ── Features ──────────────────────────────────── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "3.5rem" }}>
          {FEATURES.map((f) => (
            <Link key={f.href} href={f.href} style={{ textDecoration: "none" }}>
              <div style={{ padding: "1.5rem 1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer", height: "100%", transition: "border-color 0.15s", borderTop: `3px solid ${C.emerald}` }}>
                <div style={{ fontSize: "1.75rem", marginBottom: "0.625rem" }}>{f.icon}</div>
                <p style={{ fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.35rem", fontSize: "1rem", fontFamily: "Amiri, serif" }}>{f.title}</p>
                <p style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
              </div>
            </Link>
          ))}
        </div>

        {/* ── Recent lessons ────────────────────────────── */}
        {lessons.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHead title="آخر الدروس" href="/lessons" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {lessons.map((l: any) => (
                <Link key={l.id} href="/lessons" style={{ textDecoration: "none" }}>
                  <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, height: "100%" }}>
                    <p style={{ fontWeight: 700, color: C.ink, marginBottom: "0.4rem", fontSize: "1rem", lineHeight: 1.5 }}>{l.title}</p>
                    <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 0.6rem" }}>{l.sheikhs?.name}{l.city ? ` · ${l.city}` : ""}</p>
                    {l.category && <span style={{ fontSize: "0.75rem", padding: "0.15rem 0.6rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, display: "inline-block" }}>{l.category}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Sheikhs preview ───────────────────────────── */}
        {sheikhs.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHead title="من المشايخ والدعاة" href="/sheikhs" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
              {sheikhs.map((s: any) => (
                <Link key={s.id} href={`/sheikhs/${s.id}`} style={{ textDecoration: "none" }}>
                  <div style={{ padding: "1.5rem 1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, textAlign: "center", height: "100%" }}>
                    <div style={{ width: "3.25rem", height: "3.25rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 0.75rem", fontSize: "1.25rem", fontWeight: 700, fontFamily: "Amiri, serif" }}>
                      {s.name?.charAt(0) || "؟"}
                    </div>
                    <p style={{ fontWeight: 700, color: C.emeraldDeep, margin: "0 0 0.25rem", fontSize: "0.95rem" }}>{s.name}</p>
                    {s.city && <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: 0 }}>{s.city}</p>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Library preview ───────────────────────────── */}
        {library.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHead title="من المكتبة" href="/library" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))", gap: "1rem" }}>
              {library.map((it: any) => (
                <Link key={it.id} href="/library" style={{ textDecoration: "none" }}>
                  <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, height: "100%", borderRight: `3px solid ${C.brass}` }}>
                    <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 0.35rem", fontSize: "0.95rem", lineHeight: 1.5 }}>{it.title}</p>
                    {it.type && <span style={{ fontSize: "0.7rem", color: C.brassDeep }}>{it.type}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Q&A preview ───────────────────────────────── */}
        {qa.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHead title="من الأسئلة والأجوبة" href="/qa" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {qa.map((x: any) => (
                <Link key={x.id} href="/qa" style={{ textDecoration: "none" }}>
                  <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, height: "100%", borderTop: `3px solid ${C.emerald}` }}>
                    <p style={{ fontWeight: 700, color: C.ink, margin: "0 0 0.4rem", fontSize: "0.95rem", lineHeight: 1.6 }}>{x.question}</p>
                    {x.qa_categories?.name && <span style={{ fontSize: "0.72rem", padding: "0.15rem 0.6rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, display: "inline-block" }}>{x.qa_categories.name}</span>}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Miracles preview ──────────────────────────── */}
        {miracles.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHead title="من الإعجاز العلمي" href="/miracles" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {miracles.map((m: any) => (
                <Link key={m.id} href="/miracles" style={{ textDecoration: "none" }}>
                  <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, height: "100%", borderRight: `3px solid ${C.brass}` }}>
                    <div style={{ display: "flex", gap: "0.4rem", marginBottom: "0.5rem", flexWrap: "wrap" }}>
                      {m.source_type && <span style={{ fontSize: "0.7rem", padding: "0.12rem 0.55rem", borderRadius: "999px", background: C.emerald, color: C.parchment }}>{m.source_type}</span>}
                      {m.category && <span style={{ fontSize: "0.7rem", padding: "0.12rem 0.55rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep }}>{m.category}</span>}
                    </div>
                    <p style={{ fontWeight: 700, color: C.ink, margin: 0, fontSize: "0.95rem", lineHeight: 1.6 }}>{m.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Fawaid ────────────────────────────────────── */}
        {fawaid.length > 0 && (
          <div style={{ marginBottom: "3rem" }}>
            <SectionHead title="من الفوائد" href="/fawaid" />
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1rem" }}>
              {fawaid.map((f: any) => (
                <div key={f.id} style={{ padding: "1.5rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.parchmentDeep }}>
                  <p style={{ fontSize: "1rem", color: C.ink, lineHeight: 1.9, margin: 0, fontFamily: "Amiri, serif" }}>
                    <span style={{ color: C.brassDeep, marginLeft: "0.25rem", fontSize: "1.25rem" }}>❝</span>
                    {f.text}
                    <span style={{ color: C.brassDeep, marginRight: "0.25rem", fontSize: "1.25rem" }}>❞</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Values strip ──────────────────────────────── */}
        <BrassRule />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem", padding: "2.5rem 0 0.5rem" }}>
          {VALUES.map((v) => (
            <div key={v.title} style={{ textAlign: "center" }}>
              <div style={{ fontSize: "1.5rem", color: C.brass, marginBottom: "0.5rem" }}>{v.icon}</div>
              <p style={{ fontWeight: 700, color: C.emeraldDeep, margin: "0 0 0.35rem", fontSize: "1rem", fontFamily: "Amiri, serif" }}>{v.title}</p>
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: 0, lineHeight: 1.6 }}>{v.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
