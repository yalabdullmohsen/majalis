import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Empty, ErrorMessage, Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { getMiracleById, getSupabaseErrorMessage } from "@/lib/supabase";

export default function MiracleDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getMiracleById(params.id).then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل مقال الإعجاز."));
      setItem(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل مقال الإعجاز."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="لم يُعثر على مقال الإعجاز." />;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <Link href="/miracles" style={{ color: C.brassDeep, fontSize: "0.875rem", display: "inline-block", marginBottom: "1.25rem" }}>← العودة إلى الإعجاز العلمي</Link>
      {error && <ErrorMessage text={error} onRetry={load} />}
      <article style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.75rem", padding: "1.5rem" }}>
        <div style={{ display: "flex", gap: "0.45rem", flexWrap: "wrap", marginBottom: "0.8rem" }}>
          {item.source_type && <span style={{ padding: "0.15rem 0.65rem", borderRadius: "999px", background: C.emerald, color: C.parchment, fontSize: "0.75rem", fontWeight: 700 }}>{item.source_type}</span>}
          {item.category && <span style={{ padding: "0.15rem 0.65rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, fontSize: "0.75rem", fontWeight: 700 }}>{item.category}</span>}
        </div>
        <h1 style={{ margin: "0 0 1rem", color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "2rem", lineHeight: 1.35 }}>{item.title}</h1>
        {item.reference && (
          <div style={{ padding: "1rem", borderRadius: "0.5rem", background: C.parchmentDeep, borderRight: `3px solid ${C.brass}`, marginBottom: "1rem" }}>
            <p style={{ margin: 0, color: C.brassDeep, lineHeight: 1.9 }}>{item.reference}</p>
          </div>
        )}
        {item.body && <p style={{ color: C.ink, lineHeight: 2, whiteSpace: "pre-wrap" }}>{item.body}</p>}
        {item.scholarly_source && <p style={{ color: C.inkSoft, fontSize: "0.875rem", marginTop: "1rem" }}><strong>المرجع العلمي:</strong> {item.scholarly_source}</p>}
        {item.media_url && <a href={item.media_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", marginTop: "1rem", color: C.emeraldDeep, fontWeight: 700 }}>فتح الوسائط</a>}
      </article>
    </div>
  );
}
