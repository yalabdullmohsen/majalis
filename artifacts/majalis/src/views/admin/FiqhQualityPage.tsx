import { useCallback, useEffect, useState } from "react";
import { AdminShell, useAdminShell } from "@/views/admin/AdminShell";
import { Loading } from "@/components/ui-common";
import { FiqhAdminSubnav } from "@/components/fiqh-council/FiqhAdminSubnav";
import {
  adminGetFiqhQualityStats,
  adminGetFiqhReviewLogs,
  adminGetFiqhSyncJobs,
  adminTriggerFiqhLinkCheck,
} from "@/lib/fiqh-council-supabase";
import type { FiqhQualityStats, FiqhReviewLog } from "@/lib/fiqh-council-types";
import { C } from "@/lib/theme";

function StatCard({ label, value, tone }: { label: string; value: number | string; tone?: string }) {
  return (
    <div className={`fiqh-quality-stat ui-card ${tone || ""}`.trim()}>
      <span className="fiqh-quality-stat-value">{value}</span>
      <span className="fiqh-quality-stat-label">{label}</span>
    </div>
  );
}

function QualityContent() {
  const { showSuccess, showError } = useAdminShell();
  const [stats, setStats] = useState<FiqhQualityStats | null>(null);
  const [logs, setLogs] = useState<FiqhReviewLog[]>([]);
  const [lastSync, setLastSync] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [checkingLinks, setCheckingLinks] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes, jobsRes] = await Promise.all([
        adminGetFiqhQualityStats(),
        adminGetFiqhReviewLogs(undefined, 15),
        adminGetFiqhSyncJobs(5),
      ]);
      setStats(statsRes.data);
      setLogs(logsRes.data || []);
      const lastJob = jobsRes.data?.[0];
      setLastSync(lastJob?.finished_at || lastJob?.started_at || statsRes.data?.last_sync_at || null);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleLinkCheck = async () => {
    setCheckingLinks(true);
    const result = await adminTriggerFiqhLinkCheck();
    setCheckingLinks(false);
    if (result.ok) {
      showSuccess(`تم فحص ${result.result?.checked || 0} رابط — معطل: ${result.result?.broken || 0}`);
      await load();
    } else {
      showError(result.error || "فشل فحص الروابط");
    }
  };

  if (loading) return <Loading />;

  const s = stats || {
    published_count: 0,
    needs_review_count: 0,
    missing_source_count: 0,
    missing_category_count: 0,
    broken_links_count: 0,
    duplicate_pending_count: 0,
    avg_completion_score: 0,
  };

  return (
    <div className="fiqh-admin-page">
      <FiqhAdminSubnav active="/admin/fiqh-quality" />
      <header className="fiqh-admin-page-header">
        <h1>جودة بيانات المجمع الفقهي</h1>
        <p>مؤشرات جودة المحتوى وآخر عمليات المراجعة والمزامنة.</p>
      </header>

      <div className="fiqh-quality-grid">
        <StatCard label="مواد منشورة" value={s.published_count} />
        <StatCard label="بانتظار المراجعة" value={s.needs_review_count} tone="fiqh-quality-stat--warn" />
        <StatCard label="ناقصة المصدر" value={s.missing_source_count} tone="fiqh-quality-stat--warn" />
        <StatCard label="ناقصة التصنيف" value={s.missing_category_count} />
        <StatCard label="روابط معطلة" value={s.broken_links_count} tone="fiqh-quality-stat--error" />
        <StatCard label="تكرار محتمل" value={s.duplicate_pending_count} />
        <StatCard label="متوسط الاكتمال" value={`${s.avg_completion_score}%`} />
      </div>

      <div className="fiqh-quality-meta ui-card">
        <p><strong>آخر مزامنة:</strong> {lastSync ? new Date(lastSync).toLocaleString("ar") : "غير متوفر"}</p>
        <p><strong>آخر مراجعة:</strong> {s.last_review_at ? new Date(s.last_review_at).toLocaleString("ar") : "غير متوفر"}</p>
        <button type="button" onClick={handleLinkCheck} disabled={checkingLinks}>
          {checkingLinks ? "جارٍ فحص الروابط..." : "فحص روابط المصادر الآن"}
        </button>
      </div>

      <section className="fiqh-quality-logs ui-card">
        <h2>آخر عمليات المراجعة</h2>
        {logs.length === 0 ? (
          <p style={{ color: C.inkSoft }}>لا توجد سجلات مراجعة بعد.</p>
        ) : (
          <ul className="fiqh-quality-log-list">
            {logs.map((log) => (
              <li key={log.id}>
                <strong>{log.action}</strong>
                {log.from_status && log.to_status && <> · {log.from_status} → {log.to_status}</>}
                {log.actor_email && <> · {log.actor_email}</>}
                {log.created_at && <> · {new Date(log.created_at).toLocaleString("ar")}</>}
                {log.notes && <span style={{ color: C.inkSoft }}> — {log.notes}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

export default function FiqhQualityPage() {
  return (
    <AdminShell section="fiqh-council" onSectionChange={() => {}}>
      <QualityContent />
    </AdminShell>
  );
}
