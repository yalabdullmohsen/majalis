import { useEffect, useState } from "react";
import { Link } from "wouter";
import SheikhAvatar from "@/components/SheikhAvatar";
import { Empty, ErrorMessage, Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import { getLibraryItemById, getSupabaseErrorMessage } from "@/lib/supabase";

export default function LibraryDetailPage({ params }: { params: { id: string } }) {
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = () => {
    setLoading(true);
    setError("");
    getLibraryItemById(params.id).then(({ data, error }) => {
      if (error) setError(getSupabaseErrorMessage(error, "تعذّر تحميل المادة العلمية."));
      setItem(data);
      setLoading(false);
    }).catch((err) => {
      setError(getSupabaseErrorMessage(err, "تعذّر تحميل المادة العلمية."));
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, [params.id]);

  if (loading) return <Loading />;
  if (!item) return <Empty text="لم يُعثر على المادة العلمية." />;

  return (
    <div style={{ maxWidth: "48rem", margin: "0 auto", padding: "2.5rem 1.25rem 4rem" }}>
      <Link href="/library" style={{ color: C.brassDeep, fontSize: "0.875rem", display: "inline-block", marginBottom: "1.25rem" }}>← العودة إلى المكتبة</Link>
      {error && <ErrorMessage text={error} onRetry={load} />}
      <article style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.75rem", padding: "1.5rem" }}>
        {item.cover_url && <img src={item.cover_url} alt="" style={{ width: "min(100%, 18rem)", display: "block", margin: "0 auto 1.25rem", borderRadius: "0.75rem", boxShadow: "0 18px 45px rgba(36,31,24,0.16)" }} />}
        <span style={{ display: "inline-flex", padding: "0.18rem 0.7rem", borderRadius: "999px", background: C.sage, color: C.emeraldDeep, fontSize: "0.78rem", fontWeight: 700 }}>{item.type}</span>
        <h1 style={{ margin: "0.85rem 0 0.5rem", color: C.emeraldDeep, fontFamily: "Amiri, serif", fontSize: "2rem", lineHeight: 1.35 }}>{item.title}</h1>
        {(item.author_name || item.sheikhs?.name) && <p style={{ color: C.emeraldDeep, margin: "0 0 0.4rem", fontWeight: 700 }}>المؤلف: {item.author_name || item.sheikhs?.name}</p>}
        {item.category && <p style={{ color: C.brassDeep, margin: "0 0 1rem", fontSize: "0.875rem" }}>{item.category}</p>}
        {item.sheikhs && (
          <Link href={`/sheikhs/${item.sheikh_id}`} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.8rem", borderRadius: "0.5rem", background: C.parchment, marginBottom: "1rem" }}>
            <SheikhAvatar sheikh={item.sheikhs} size={48} />
            <span style={{ color: C.emeraldDeep, fontWeight: 700 }}>{item.sheikhs.name}</span>
          </Link>
        )}
        {item.description && <p style={{ color: C.ink, lineHeight: 1.9, whiteSpace: "pre-wrap" }}>{item.description}</p>}
        {(item.file_url || item.external_url) && (
          <a href={item.file_url || item.external_url} target="_blank" rel="noreferrer" style={{ display: "inline-flex", marginTop: "1rem", padding: "0.65rem 1.1rem", borderRadius: "0.5rem", background: C.emerald, color: C.parchment, fontWeight: 700 }}>
            فتح المادة
          </a>
        )}
      </article>
    </div>
  );
}
