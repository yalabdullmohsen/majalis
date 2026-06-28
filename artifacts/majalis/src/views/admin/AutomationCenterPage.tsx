import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getIntelligenceCenter,
  runIntelligenceEngine,
} from "@/lib/lesson-automation-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

type CenterStats = {
  sourcesCount: number;
  activeSources: number;
  todayDiscovered: number;
  todayPublished: number;
  todayDuplicates: number;
  todayErrors: number;
  pendingImages: number;
  avgDurationMs?: number | null;
  sourceSuccessRates?: Array<{
    id: string;
    name: string;
    trust: number;
    successRate: number | null;
    lastScan?: string;
    lastError?: string;
  }>;
  recentExtractions?: Array<{
    source_url: string;
    decision: string;
    confidence_score?: number;
    extractor?: string;
    created_at: string;
  }>;
};

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", minWidth: "110px" }}>
      <div style={{ fontSize: "1.4rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.78rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function formatDt(iso?: string) {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("ar", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return iso.slice(0, 16);
  }
}

function AutomationCenterContent() {
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [stats, setStats] = useState<CenterStats | null>(null);
  const [adapters, setAdapters] = useState<string[]>([]);
  const [extractors, setExtractors] = useState<string[]>([]);

  const load = useCallback(() => {
    setLoading(true);
    getIntelligenceCenter()
      .then((r) => {
        setStats(r.stats as CenterStats);
        setAdapters((r.adapters as string[]) || []);
        setExtractors((r.extractors as string[]) || []);
      })
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRun = async () => {
    setBusy(true);
    try {
      await runIntelligenceEngine();
      load();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>Automation Center — Phase 6</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            Lesson Intelligence Engine — اكتشاف وجمع وتحليل ونشر الدروس من جميع المصادر الرسمية.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem", fontSize: "0.8125rem", flexWrap: "wrap", alignItems: "center" }}>
          <button
            type="button"
            disabled={busy}
            onClick={onRun}
            style={{ padding: "0.4rem 0.75rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontFamily: "inherit", fontWeight: 600 }}
          >
            تشغيل المحرك الآن
          </button>
          <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>المصادر</Link>
          <Link href="/admin/automation/dashboard" style={{ color: C.emeraldDeep }}>لوحة Phase 5</Link>
          <Link href="/admin/review-center" style={{ color: C.emeraldDeep }}>مركز المراجعة</Link>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          <div style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <StatCard label="المصادر" value={stats?.sourcesCount ?? 0} />
            <StatCard label="نشط" value={stats?.activeSources ?? 0} />
            <StatCard label="مكتشف اليوم" value={stats?.todayDiscovered ?? 0} />
            <StatCard label="منشور اليوم" value={stats?.todayPublished ?? 0} color="#065F46" />
            <StatCard label="مكرر" value={stats?.todayDuplicates ?? 0} />
            <StatCard label="أخطاء" value={stats?.todayErrors ?? 0} color="#991B1B" />
            <StatCard label="صور قيد التحليل" value={stats?.pendingImages ?? 0} color="#92400E" />
            <StatCard label="سرعة (ms)" value={stats?.avgDurationMs ?? "—"} />
          </div>

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>Adapters · Extractors</h3>
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0.25rem 0" }}>
              {adapters.slice(0, 12).join(" · ")} …
            </p>
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: 0 }}>
              {extractors.slice(0, 8).join(" · ")} … (+{Math.max(0, extractors.length - 8)} more)
            </p>
          </section>

          <section style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>نسبة نجاح المصادر</h3>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {(stats?.sourceSuccessRates || []).slice(0, 8).map((s) => (
                <div key={s.id} style={{ fontSize: "0.78rem", padding: "0.35rem 0.5rem", background: C.parchmentDeep, borderRadius: "0.25rem" }}>
                  <strong>{s.name}</strong> · ثقة {s.trust}% · نجاح {s.successRate != null ? `${s.successRate}%` : "—"} · آخر فحص {formatDt(s.lastScan)}
                  {s.lastError && <span style={{ color: "#991B1B" }}> · {s.lastError.slice(0, 60)}</span>}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>آخر استخراجات</h3>
            <div style={{ display: "grid", gap: "0.35rem" }}>
              {(stats?.recentExtractions || []).length === 0 && (
                <p style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>لا سجلات — طبّق migration `lesson_intelligence_v6.sql`.</p>
              )}
              {(stats?.recentExtractions || []).map((e, i) => (
                <div key={i} style={{ fontSize: "0.75rem", padding: "0.35rem 0.5rem", background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.25rem" }}>
                  {e.decision} · {Math.round((e.confidence_score ?? 0) * 100)}% · {e.source_url?.slice(0, 50)}
                </div>
              ))}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

export default function AutomationCenterPage() {
  return (
    <AdminShell section="lessons">
      <AutomationCenterContent />
    </AdminShell>
  );
}

export { AutomationCenterContent };
