import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import {
  getAcquisitionDashboard,
  initAcquisition,
  runShadowSync,
  syncGkeSources,
  type AcquisitionDashboard,
} from "@/lib/data-acquisition-api";

function StatCard({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel, minWidth: "100px" }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.25rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.2rem 0 0", fontSize: "0.72rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

function SourceRow({ source }: { source: Record<string, unknown> }) {
  return (
    <div style={{ padding: "0.65rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.85rem" }}>
      <strong>{String(source.name)}</strong>
      <span style={{ color: C.inkSoft, marginInlineStart: "0.5rem" }}>
        {String(source.reputation_score ?? source.trust_score)} · {String(source.items_imported ?? 0)} عنصر
      </span>
    </div>
  );
}

export default function DataAcquisitionDashboardPage() {
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<AcquisitionDashboard | null>(null);
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    getAcquisitionDashboard()
      .then(setDash)
      .catch(() => setDash(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleInit = async () => {
    setRunning(true);
    setMessage(null);
    try {
      await syncGkeSources();
      await initAcquisition();
      setMessage("تمت مزامنة المصادر الموثوقة");
      load();
    } catch {
      setMessage("فشلت المزامنة");
    } finally {
      setRunning(false);
    }
  };

  const handleShadowSync = async (slug: string) => {
    setRunning(true);
    try {
      const r = await runShadowSync(slug);
      setMessage(r.ok ? `Shadow sync: ${slug} — ${r.fetched} عنصر` : `فشل: ${slug}`);
      load();
    } finally {
      setRunning(false);
    }
  };

  if (loading) return <Loading />;

  const m = dash?.metrics;
  const shadow = dash?.shadow_mode;

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", padding: "1.5rem 1rem" }}>
      <div style={{ marginBottom: "1.25rem" }}>
        <h1 style={{ margin: "0 0 0.35rem", fontSize: "1.35rem", color: C.emeraldDeep }}>
          Data Acquisition — جلب البيانات
        </h1>
        <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.9rem" }}>
          Trusted Knowledge Network · Shadow Mode {shadow?.enabled ? "مفعّل" : "معطّل"}
        </p>
      </div>

      <div
        style={{
          padding: "0.85rem 1rem",
          marginBottom: "1rem",
          borderRadius: "0.5rem",
          background: "#FEF3C7",
          border: "1px solid #F59E0B",
          fontSize: "0.88rem",
        }}
      >
        <strong>Shadow Mode:</strong> {shadow?.description} — لا نشر تلقائي حتى اكتمال اختبار أسبوعين.
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.25rem" }}>
        <button type="button" disabled={running} onClick={handleInit} style={{ padding: "0.5rem 1rem", borderRadius: "0.4rem", border: "none", background: C.emerald, color: C.parchment, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
          مزامنة المصادر
        </button>
        <Link href="/admin/knowledge-engine" style={{ padding: "0.5rem 1rem", color: C.emeraldDeep, fontWeight: 700 }}>
          GKE Architecture
        </Link>
        <Link href="/admin/ake" style={{ padding: "0.5rem 1rem", color: C.emeraldDeep, fontWeight: 700 }}>
          AKE
        </Link>
      </div>

      {message && <p style={{ fontSize: "0.85rem", color: C.emeraldDeep, marginBottom: "1rem" }}>{message}</p>}

      {m && (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1.5rem" }}>
          <StatCard label="المصادر" value={m.total_sources} sub={`${m.active_sources} نشط`} />
          <StatCard label="Success Rate" value={`${m.success_rate}%`} />
          <StatCard label="Duplicate Rate" value={`${m.duplicate_rate}%`} color={m.duplicate_rate > 10 ? "#991B1B" : C.emeraldDeep} />
          <StatCard label="Validation Rate" value={`${m.validation_rate}%`} />
          <StatCard label="Avg Processing" value={`${m.avg_processing_ms}ms`} />
          <StatCard label="Review Queue" value={m.queue_size} />
          <StatCard label="مستورد" value={m.total_imported} sub={`${m.total_accepted} مقبول · ${m.total_rejected} مرفوض`} />
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <section className="ui-card" style={{ padding: "1rem" }}>
          <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>أفضل المصادر</h2>
          {(dash?.best_sources || []).map((s) => (
            <SourceRow key={String(s.slug)} source={s} />
          ))}
        </section>
        <section className="ui-card" style={{ padding: "1rem" }}>
          <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>أقل المصادر جودة</h2>
          {(dash?.worst_sources || []).map((s) => (
            <SourceRow key={String(s.slug)} source={s} />
          ))}
        </section>
        <section className="ui-card" style={{ padding: "1rem" }}>
          <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>الأكثر نشاطاً</h2>
          {(dash?.most_active || []).map((s) => (
            <div key={String(s.slug)} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0", borderBottom: `1px solid ${C.line}` }}>
              <SourceRow source={s} />
              {Boolean(s.is_active) && (
                <button type="button" disabled={running} onClick={() => handleShadowSync(String(s.slug))} style={{ fontSize: "0.75rem", padding: "0.25rem 0.5rem", cursor: "pointer" }}>
                  Shadow sync
                </button>
              )}
            </div>
          ))}
        </section>
      </div>

      <section className="ui-card" style={{ padding: "1rem", marginBottom: "1rem" }}>
        <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>مراحل التكامل</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {(dash?.integration_phases || []).map((p) => (
            <span
              key={p.content_kind}
              style={{
                padding: "0.35rem 0.65rem",
                borderRadius: "0.35rem",
                fontSize: "0.8rem",
                background: p.enabled ? "#D1FAE5" : "#F3F4F6",
                color: p.enabled ? C.emeraldDeep : C.inkSoft,
              }}
            >
              {p.label_ar} {p.enabled ? "✓" : "—"}
            </span>
          ))}
        </div>
      </section>

      {(dash?.recent_shadow_items?.length ?? 0) > 0 && (
        <section className="ui-card" style={{ padding: "1rem" }}>
          <h2 style={{ fontSize: "1rem", color: C.emeraldDeep, marginTop: 0 }}>عناصر Shadow الأخيرة</h2>
          {dash!.recent_shadow_items.slice(0, 10).map((item) => (
            <div key={String(item.id || item.external_key)} style={{ padding: "0.45rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.85rem" }}>
              <strong>{String(item.title)}</strong>
              <span style={{ color: C.inkSoft, marginInlineStart: "0.5rem" }}>{String(item.status)} · {String(item.content_kind)}</span>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
