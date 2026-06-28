import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  fetchHardeningDashboard,
  runFiqhMigration,
  runIncidentRecovery,
  repairAkeRpc,
  type HardeningDashboard,
} from "@/lib/ake-hardening-api";

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section style={{ marginBottom: "1.5rem" }}>
      <h2 style={{ fontSize: "1rem", marginBottom: "0.75rem", color: C.emeraldDeep }}>{title}</h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", minWidth: "100px" }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{label}</div>
      {sub && <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.15rem" }}>{sub}</div>}
    </div>
  );
}

const HEALTH_COLORS: Record<string, string> = {
  healthy: C.emeraldDeep,
  degraded: "#D97706",
  down: "#991B1B",
  unknown: C.inkSoft,
};

export function HardeningDashboardContent() {
  const [data, setData] = useState<HardeningDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchHardeningDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل لوحة التحصين");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const runAction = async (label: string, fn: () => Promise<unknown>) => {
    setActionMsg(`جارٍ ${label}…`);
    try {
      await fn();
      setActionMsg(`${label} — تم`);
      await load();
    } catch (err) {
      setActionMsg(err instanceof Error ? err.message : "فشل");
    }
  };

  if (loading && !data) return <Loading />;
  if (error && !data) {
    return (
      <div style={{ padding: "1.5rem" }}>
        <p style={{ color: "#991B1B" }}>{error}</p>
        <button type="button" onClick={() => void load()}>إعادة المحاولة</button>
      </div>
    );
  }
  if (!data) return null;

  const pub = data.publishing24h || {};
  const pipeline = data.pipeline || { stages: [], avgAiConfidence: 0 };

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1280px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>AKE Production Hardening</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            تشغيل 24/7 · RSS موثوق · RPC · صحة الموصلات · تحليلات · استرداد تلقائي
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <Link href="/admin?section=knowledge-engine" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>AKE</Link>
          <Link href="/admin/platform/monitoring" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>المراقبة</Link>
          <Link href="/admin/platform/autonomous" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>المنصة الذاتية</Link>
          <button type="button" onClick={() => void load()} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>تحديث</button>
          <button type="button" onClick={() => void runAction("استرداد", runIncidentRecovery)} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.375rem", background: C.emerald, color: "white", border: "none" }}>استرداد</button>
          <button type="button" onClick={() => void runAction("ترحيل فقه", () => runFiqhMigration(false))} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.375rem", background: C.panel, border: `1px solid ${C.line}` }}>ترحيل فقه</button>
          <button type="button" onClick={() => void runAction("إصلاح RPC", () => repairAkeRpc(true))} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.375rem", background: C.panel, border: `1px solid ${C.line}` }}>RPC</button>
        </div>
      </div>

      {actionMsg && <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.75rem" }}>{actionMsg}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <StatCard label="حالة النظام" value={data.systemStatus} />
        <StatCard label="RPC" value={data.rpc?.ok ? "✓" : "✗"} sub={data.rpc?.missingRequired?.join(", ") || "سليم"} />
        <StatCard label="موصلات نشطة" value={data.connectors?.active ?? 0} sub={`${data.connectors?.healthy ?? 0} سليم · ${data.connectors?.degraded ?? 0} متدهور`} />
        <StatCard label="منشور 24h" value={Number(pub.items_published ?? 0)} />
        <StatCard label="مرفوض" value={Number(pub.items_rejected ?? 0)} />
        <StatCard label="مكرر" value={Number(pub.items_duplicate ?? 0)} />
        <StatCard label="ثقة AI" value={`${pipeline.avgAiConfidence ?? 0}%`} />
        <StatCard label="طابور" value={data.queueMetrics?.pending ?? 0} sub={`${data.queueMetrics?.failed ?? 0} فاشل`} />
        <StatCard label="فقه منقول" value={data.fiqhMigration?.migrated ?? 0} sub={`${data.fiqhMigration?.failed ?? 0} فشل`} />
      </div>

      <Section title="Pipeline — آخر 24 ساعة">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {(pipeline.stages || []).map((s) => (
            <StatCard key={s.name} label={s.name} value={s.count} />
          ))}
        </div>
      </Section>

      <Section title="صحة الموصلات">
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${C.line}`, textAlign: "right" }}>
                <th style={{ padding: "0.5rem" }}>المصدر</th>
                <th style={{ padding: "0.5rem" }}>الصحة</th>
                <th style={{ padding: "0.5rem" }}>زمن الاستجابة</th>
                <th style={{ padding: "0.5rem" }}>فشل %</th>
                <th style={{ padding: "0.5rem" }}>مكتشف</th>
                <th style={{ padding: "0.5rem" }}>منشور</th>
                <th style={{ padding: "0.5rem" }}>مكرر %</th>
                <th style={{ padding: "0.5rem" }}>ثقة</th>
              </tr>
            </thead>
            <tbody>
              {(data.connectors?.panel || []).slice(0, 20).map((c) => (
                <tr key={c.slug} style={{ borderBottom: `1px solid ${C.line}` }}>
                  <td style={{ padding: "0.5rem" }}>{c.name || c.slug}</td>
                  <td style={{ padding: "0.5rem", color: HEALTH_COLORS[c.health] || C.inkSoft }}>{c.health}</td>
                  <td style={{ padding: "0.5rem" }}>{c.avgResponseMs}ms</td>
                  <td style={{ padding: "0.5rem" }}>{c.failureRatePct}%</td>
                  <td style={{ padding: "0.5rem" }}>{c.itemsDiscovered}</td>
                  <td style={{ padding: "0.5rem" }}>{c.itemsPublished}</td>
                  <td style={{ padding: "0.5rem" }}>{c.duplicatePct}%</td>
                  <td style={{ padding: "0.5rem" }}>{c.trustScore}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <Section title="طابور إعادة المحاولة">
          {(data.retryQueue || []).length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا عناصر</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.8125rem" }}>
              {data.retryQueue.slice(0, 8).map((j) => (
                <li key={String(j.id)} style={{ padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
                  {String(j.job_type)} — {String(j.last_error || "").slice(0, 60)}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="مرفوضات">
          {(data.rejectedQueue || []).length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا عناصر</p>
          ) : (
            <ul style={{ margin: 0, padding: 0, listStyle: "none", fontSize: "0.8125rem" }}>
              {data.rejectedQueue.slice(0, 8).map((r, i) => (
                <li key={String(r.id || i)} style={{ padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
                  {String(r.rejection_reason || r.raw_title || "—").slice(0, 70)}
                </li>
              ))}
            </ul>
          )}
        </Section>

        <Section title="Workers">
          {(data.workers || []).map((w) => (
            <div key={String(w.worker_id)} style={{ fontSize: "0.8125rem", marginBottom: "0.35rem" }}>
              {String(w.worker_id)}: <span style={{ color: HEALTH_COLORS[String(w.status)] || C.inkSoft }}>{String(w.status)}</span>
            </div>
          ))}
        </Section>

        <Section title="RPC Status">
          <p style={{ fontSize: "0.8125rem", margin: "0 0 0.5rem" }}>
            ake_engine_stats: {data.rpc?.engineStatsCallable ? "✓ callable" : "✗"}
          </p>
          {(data.rpc?.missingGrants || []).length > 0 && (
            <p style={{ fontSize: "0.75rem", color: "#991B1B" }}>Grants: {data.rpc.missingGrants.join(", ")}</p>
          )}
        </Section>
      </div>

      {!data.tablesReady && (
        <p style={{ marginTop: "1rem", padding: "0.75rem", background: "#FEF3C7", borderRadius: "0.375rem", fontSize: "0.8125rem" }}>
          جداول v19 غير مطبّقة — اضغط «RPC» أو طبّق scope=ake-v19 في apply-migrations.
        </p>
      )}
    </div>
  );
}

export default function AkeHardeningDashboardPage() {
  return (
    <AdminShell section="knowledge-engine" onSectionChange={() => {}}>
      <HardeningDashboardContent />
    </AdminShell>
  );
}
