import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getIntelligenceCenter,
  runIntelligenceEngine,
} from "@/lib/lesson-automation-api";
import { SkeletonCardGrid } from "@/components/ui-common";
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
    <div className="acc-stat" style={color ? { "--acc-val-color": color } as React.CSSProperties : undefined}>
      <div className="acc-stat__value">{value}</div>
      <div className="acc-stat__label">{label}</div>
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
      <div className="acc-header">
        <div>
          <h2 className="acc-title">Automation Center، Phase 6</h2>
          <p className="acc-desc">
            Lesson Intelligence Engine، اكتشاف وجمع وتحليل ونشر الدروس من جميع المصادر الرسمية.
          </p>
        </div>
        <div className="acc-nav">
          <button
            type="button"
            disabled={busy}
            onClick={onRun}
            className="acc-run-btn"
          >
            تشغيل المحرك الآن
          </button>
          <Link href="/admin/sources" className="acc-nav-link">المصادر</Link>
          <Link href="/admin/automation/dashboard" className="acc-nav-link">لوحة Phase 5</Link>
          <Link href="/admin/review-center" className="acc-nav-link">مركز المراجعة</Link>
        </div>
      </div>

      {loading ? <SkeletonCardGrid count={6} /> : (
        <>
          <div className="acc-stats-row">
            <StatCard label="المصادر" value={stats?.sourcesCount ?? 0} />
            <StatCard label="نشط" value={stats?.activeSources ?? 0} />
            <StatCard label="مكتشف اليوم" value={stats?.todayDiscovered ?? 0} />
            <StatCard label="منشور اليوم" value={stats?.todayPublished ?? 0} color="#065F46" />
            <StatCard label="مكرر" value={stats?.todayDuplicates ?? 0} />
            <StatCard label="أخطاء" value={stats?.todayErrors ?? 0} color="#991B1B" />
            <StatCard label="صور قيد التحليل" value={stats?.pendingImages ?? 0} color="#1F4D3A" />
            <StatCard label="سرعة (ms)" value={stats?.avgDurationMs ?? "—"} />
          </div>

          <section className="acc-section">
            <h3 className="acc-section-h3">Adapters · Extractors</h3>
            <p className="acc-muted-text">
              {adapters.slice(0, 12).join(" · ")} …
            </p>
            <p className="acc-muted-text acc-muted-text--mb0">
              {extractors.slice(0, 8).join(" · ")} … (+{Math.max(0, extractors.length - 8)} more)
            </p>
          </section>

          <section className="acc-section">
            <h3 className="acc-section-h3">نسبة نجاح المصادر</h3>
            <div className="acc-items-grid">
              {(stats?.sourceSuccessRates || []).slice(0, 8).map((s) => (
                <div key={s.id} className="acc-source-item">
                  <strong>{s.name}</strong> · ثقة {s.trust}% · نجاح {s.successRate != null ? `${s.successRate}%` : "—"} · آخر فحص {formatDt(s.lastScan)}
                  {s.lastError && <span className="acc-source-err"> · {s.lastError.slice(0, 60)}</span>}
                </div>
              ))}
            </div>
          </section>

          <section className="acc-section">
            <h3 className="acc-section-h3">آخر استخراجات</h3>
            <div className="acc-items-grid">
              {(stats?.recentExtractions || []).length === 0 && (
                <p className="acc-empty">لا سجلات، طبّق migration `lesson_intelligence_v6.sql`.</p>
              )}
              {(stats?.recentExtractions || []).map((e, i) => (
                <div key={i} className="acc-extraction-item">
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
    <AdminShell section="lessons" onSectionChange={() => {}}>
      <AutomationCenterContent />
    </AdminShell>
  );
}

export { AutomationCenterContent };
