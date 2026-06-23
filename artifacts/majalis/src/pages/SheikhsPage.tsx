import { useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { getSheikhs, getSupabaseErrorMessage } from "@/lib/supabase";
import { C } from "@/lib/theme";
import { PageHeader, Loading, Empty, ErrorMessage } from "@/components/ui-common";
import SheikhAvatar from "@/components/SheikhAvatar";

export default function SheikhsPage() {
  const [sheikhs, setSheikhs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getSheikhs().then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل قائمة المشايخ."));
      setSheikhs(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل قائمة المشايخ."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    const s = search.trim();
    return sheikhs.filter((sh) => {
      if (verifiedOnly && !sh.is_verified) return false;
      if (!s) return true;
      return (
        sh.name?.includes(s) ||
        sh.ijazah?.includes(s) ||
        sh.city?.includes(s) ||
        (sh.specialties || []).some((sp: string) => sp.includes(s))
      );
    });
  }, [sheikhs, search, verifiedOnly]);

  return (
    <div style={{ maxWidth: "56rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <PageHeader
        eyebrow="نخبة معتمدة"
        title="المشايخ والدعاة"
        subtitle="تعرّف على المشايخ والدعاة المعتمدين، وإجازاتهم وتخصصاتهم ودروسهم."
      />

      {error && <ErrorMessage text={error} onRetry={load} />}

      {/* search + filter */}
      <div style={{ display: "flex", gap: "0.625rem", flexWrap: "wrap", alignItems: "center", marginBottom: "1.5rem" }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="ابحث بالاسم أو التخصص أو المدينة..."
          style={{ flex: "1 1 240px", padding: "0.625rem 0.875rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, fontSize: "0.9rem", fontFamily: "inherit", outline: "none", background: C.panel, color: C.ink }}
        />
        <button
          onClick={() => setVerifiedOnly((v) => !v)}
          style={{ padding: "0.55rem 1rem", borderRadius: "0.5rem", border: `1px solid ${verifiedOnly ? C.emerald : C.line}`, background: verifiedOnly ? C.emerald : C.panel, color: verifiedOnly ? C.parchment : C.inkSoft, cursor: "pointer", fontFamily: "inherit", fontSize: "0.85rem", fontWeight: verifiedOnly ? 700 : 400, whiteSpace: "nowrap" }}
        >
          المعتمدون فقط
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : filtered.length === 0 ? (
        <Empty text={sheikhs.length === 0 ? "لا يوجد مشايخ بعد." : "لا توجد نتائج مطابقة."} />
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1rem" }}>
          {filtered.map((s: any) => (
            <Link key={s.id} href={`/sheikhs/${s.id}`} style={{ textDecoration: "none" }}>
              <div style={{ borderRadius: "0.5rem", border: `1px solid ${C.line}`, padding: "1.5rem", background: C.panel, height: "100%", borderTop: `3px solid ${C.emerald}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.875rem" }}>
                  <SheikhAvatar sheikh={s} size={54} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: C.emeraldDeep, fontSize: "1.0625rem", margin: 0, fontFamily: "Amiri, serif" }}>{s.name}</p>
                    {s.is_verified && (
                      <span style={{ fontSize: "0.7rem", color: C.emeraldDeep, fontWeight: 600 }}>✓ معتمد</span>
                    )}
                  </div>
                </div>
                {(s.specialty || s.specialties?.[0]) && <p style={{ fontSize: "0.8rem", marginBottom: "0.35rem", color: C.brassDeep, fontWeight: 700 }}>{s.specialty || s.specialties?.[0]}</p>}
                {s.ijazah && <p style={{ fontSize: "0.8rem", marginBottom: "0.35rem", color: C.brassDeep }}>{s.ijazah}</p>}
                <p style={{ fontSize: "0.8rem", color: C.inkSoft, margin: 0 }}>
                  {[s.country || s.city, s.lessons_count ? `${s.lessons_count} دروس` : null, s.years_experience ? `${s.years_experience} سنة خبرة` : null].filter(Boolean).join(" · ")}
                </p>
                {s.specialties?.length > 0 && (
                  <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
                    {s.specialties.slice(0, 3).map((sp: string, i: number) => (
                      <span key={i} style={{ fontSize: "0.7rem", padding: "0.12rem 0.55rem", borderRadius: "999px", background: C.parchmentDeep, color: C.ink }}>{sp}</span>
                    ))}
                  </div>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
