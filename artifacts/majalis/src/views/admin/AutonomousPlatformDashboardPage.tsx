import { useCallback, useEffect, useState, type ReactNode } from "react";
import { Link } from "wouter";
import { AdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { C } from "@/lib/theme";
import {
  fetchAutonomousDashboard,
  generateAutonomousReport,
  runAutonomousCycle,
  type AutonomousDashboard,
} from "@/lib/ake-autonomous-api";

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

export function AutonomousPlatformContent() {
  const [data, setData] = useState<AutonomousDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [running, setRunning] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fetchAutonomousDashboard());
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل لوحة المنصة الذاتية");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    const id = window.setInterval(() => void load(), 60_000);
    return () => window.clearInterval(id);
  }, [load]);

  const handleRun = async () => {
    setRunning(true);
    try {
      await runAutonomousCycle(true);
      await load();
    } finally {
      setRunning(false);
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

  return (
    <div style={{ padding: "1.5rem", maxWidth: "1200px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h1 style={{ margin: 0, color: C.emeraldDeep }}>المنصة الذاتية — AKE Autonomous</h1>
          <p style={{ margin: "0.35rem 0 0", color: C.inkSoft, fontSize: "0.875rem" }}>
            اكتشاف · تحقق · إثراء · تصنيف · نشر · مراقبة — بدون تدخل يدوي
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <Link href="/admin?section=knowledge-engine" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>AKE</Link>
          <Link href="/admin/platform/monitoring" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>المراقبة</Link>
          <Link href="/admin/content-engines" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>Content Engines</Link>
          <button type="button" onClick={() => void load()} style={{ padding: "0.4rem 0.8rem", border: `1px solid ${C.line}`, borderRadius: "0.375rem", background: C.panel }}>تحديث</button>
          <button type="button" disabled={running} onClick={() => void handleRun()} style={{ padding: "0.4rem 0.8rem", borderRadius: "0.375rem", background: C.emerald, color: "white", border: "none" }}>
            {running ? "جارٍ التشغيل…" : "▶ دورة كاملة"}
          </button>
        </div>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <StatCard label="حالة النظام" value={data.systemStatus} />
        <StatCard label="Queue" value={data.queue.pending} sub={`مراجعة: ${data.queue.review}`} />
        <StatCard label="مصادر نشطة" value={data.connectors.active} sub={`${data.connectors.healthy} سليم`} />
        <StatCard label="دروس (24س)" value={pub.lessons ?? 0} />
        <StatCard label="فوائد (24س)" value={pub.benefits ?? 0} />
        <StatCard label="أسئلة (24س)" value={pub.questions ?? 0} />
        <StatCard label="مرفوض (24س)" value={data.rejections24h?.length ?? 0} />
      </div>

      <Section title="أنواع المحتوى المدعومة">
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {Object.entries(data.contentTypes || {}).map(([kind, meta]) => (
            <span key={kind} style={{ padding: "0.25rem 0.6rem", borderRadius: "999px", background: C.parchmentDeep, fontSize: "0.75rem", border: `1px solid ${C.line}` }}>
              {meta.label} ({kind})
            </span>
          ))}
        </div>
      </Section>

      <Section title="مراحل Pipeline">
        <div style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.8 }}>
          {(data.pipelineStages || []).join(" → ")}
        </div>
      </Section>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
        <Section title="أسباب الرفض (24س)">
          {(data.topRejectionReasons || []).length === 0 ? (
            <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا رفض مسجّل.</p>
          ) : (
            data.topRejectionReasons.map((r) => (
              <div key={r.reason} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>{r.reason}: {r.count}</div>
            ))
          )}
        </Section>

        <Section title="آخر المرفوضات">
          {(data.rejections24h || []).slice(0, 6).map((r) => (
            <div key={String(r.id)} style={{ fontSize: "0.75rem", padding: "0.25rem 0", borderBottom: `1px solid ${C.line}` }}>
              {String(r.rejection_reason || r.error_code)} — {String(r.pipeline_stage)}
            </div>
          ))}
        </Section>
      </div>

      <Section title="تقارير">
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.75rem" }}>
          {(["hourly", "daily", "weekly", "monthly"] as const).map((t) => (
            <button key={t} type="button" onClick={() => void generateAutonomousReport(t, true).then(() => load())} style={{ padding: "0.35rem 0.7rem", fontSize: "0.75rem", border: `1px solid ${C.line}`, borderRadius: "0.25rem", background: C.panel }}>
              {t}
            </button>
          ))}
        </div>
        {(data.hourlyReports || []).slice(0, 5).map((r) => (
          <div key={String(r.id)} style={{ fontSize: "0.8125rem", padding: "0.25rem 0" }}>
            {String(r.report_type)} {String(r.period_key)}
          </div>
        ))}
      </Section>
    </div>
  );
}

export default function AutonomousPlatformDashboardPage() {
  return (
    <AdminShell section="knowledge-engine" onSectionChange={() => {}}>
      <AutonomousPlatformContent />
    </AdminShell>
  );
}
