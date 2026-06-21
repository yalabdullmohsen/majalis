import { useEffect, useState } from "react";
import { Link } from "wouter";
import { C } from "@/lib/theme";
import { getLessons, getSheikhs, getApprovedFawaid } from "@/lib/supabase";

export default function HomePage() {
  const [lessons, setLessons] = useState<any[]>([]);
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [fawaid, setFawaid] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      getLessons(),
      getSheikhs(),
      getApprovedFawaid(),
    ]).then(([l, s, f]) => {
      setLessons((l.data || []).slice(0, 3));
      setSheikhs((s.data || []).slice(0, 3));
      setFawaid((f.data || []).slice(0, 2));
      setLoading(false);
    });
  }, []);

  return (
    <div style={{ maxWidth: "72rem", margin: "0 auto", padding: "2.5rem 1rem 4rem" }}>
      {/* Hero */}
      <div style={{ textAlign: "center", marginBottom: "3rem", padding: "3rem 1rem", borderRadius: "0.5rem", background: C.parchmentDeep, border: `1px solid ${C.line}` }}>
        <p style={{ fontSize: "0.875rem", color: C.brassDeep, marginBottom: "0.5rem" }}>المنصة العلمية الشرعية</p>
        <h1 style={{ fontSize: "2.25rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif", marginBottom: "1rem" }}>
          مجالس
        </h1>
        <p style={{ fontSize: "1rem", color: C.inkSoft, maxWidth: "36rem", margin: "0 auto 1.5rem", lineHeight: "1.75" }}>
          الدروس والدورات والمشايخ والمكتبة العلمية والإعجاز العلمي في مكان واحد
        </p>
        <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center", flexWrap: "wrap" }}>
          <Link href="/lessons" style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", background: C.emerald, color: C.parchment, textDecoration: "none", fontWeight: 700, fontSize: "0.875rem" }}>
            استعرض الدروس
          </Link>
          <Link href="/sheikhs" style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, color: C.inkSoft, textDecoration: "none", fontSize: "0.875rem" }}>
            المشايخ والدعاة
          </Link>
        </div>
      </div>

      {/* Features */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "3rem" }}>
        {[
          { href: "/lessons", icon: "📚", title: "الدروس والدورات", desc: "دروس علمية شرعية موثّقة ومعتمدة" },
          { href: "/sheikhs", icon: "👳", title: "المشايخ والدعاة", desc: "نخبة من المشايخ المعتمدين" },
          { href: "/library", icon: "🏛", title: "المكتبة العلمية", desc: "كتب ومتون وتفريغات ومقالات" },
          { href: "/miracles", icon: "🌌", title: "الإعجاز العلمي", desc: "مقالات موثّقة من الكتاب والسنة" },
          { href: "/fawaid", icon: "💎", title: "الفوائد", desc: "فوائد دينية مختارة ومراجَعة" },
        ].map((f) => (
          <Link key={f.href} href={f.href} style={{ textDecoration: "none" }}>
            <div style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer", height: "100%" }}>
              <div style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>{f.icon}</div>
              <p style={{ fontWeight: 700, color: C.emeraldDeep, marginBottom: "0.25rem", fontSize: "0.9375rem" }}>{f.title}</p>
              <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>{f.desc}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent lessons */}
      {!loading && lessons.length > 0 && (
        <div style={{ marginBottom: "2.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>آخر الدروس</h2>
            <Link href="/lessons" style={{ fontSize: "0.75rem", color: C.brassDeep, textDecoration: "none" }}>عرض الكل</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {lessons.map((l: any) => (
              <div key={l.id} style={{ padding: "1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel }}>
                <p style={{ fontWeight: 700, color: C.ink, marginBottom: "0.25rem", fontSize: "0.9375rem" }}>{l.title}</p>
                <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>{l.sheikhs?.name} · {l.city}</p>
                {l.category && <span style={{ fontSize: "0.75rem", padding: "0.125rem 0.5rem", borderRadius: "0.25rem", background: C.sage, color: C.emeraldDeep, marginTop: "0.5rem", display: "inline-block" }}>{l.category}</span>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fawaid */}
      {!loading && fawaid.length > 0 && (
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep, fontFamily: "Amiri, serif" }}>من الفوائد</h2>
            <Link href="/fawaid" style={{ fontSize: "0.75rem", color: C.brassDeep, textDecoration: "none" }}>عرض الكل</Link>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "0.75rem" }}>
            {fawaid.map((f: any) => (
              <div key={f.id} style={{ padding: "1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.parchmentDeep }}>
                <p style={{ fontSize: "0.9375rem", color: C.ink, lineHeight: "1.75" }}>
                  <span style={{ color: C.brassDeep, marginLeft: "0.25rem" }}>❝</span>
                  {f.text}
                  <span style={{ color: C.brassDeep, marginRight: "0.25rem" }}>❞</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
