import { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "wouter";
import { ContentFileImport } from "@/views/admin/ContentFileImport";
import {
  PLATFORM_SECTIONS,
  adminUrlForSection,
  automationCronCount,
  contributionTypesSupported,
  importTypesSupported,
  type PlatformSectionId,
} from "@/lib/cms/platform-registry";
import { getCmsDashboardStats, getRecentContentImportJobs, type CmsDashboardStats } from "@/lib/cms/supabase-cms";
import {
  markNotificationRead,
  refreshActivityNotifications,
  type CmsNotification,
  notificationTypeLabel,
} from "@/lib/cms/cms-notifications";
import { listPendingContributions } from "@/lib/cms/contribution-service";
import { WORKFLOW_STAGE_LABELS } from "@/lib/cms/content-workflow";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "./AdminShell";

const CARD: React.CSSProperties = {
  background: C.panel,
  border: `1px solid ${C.line}`,
  borderRadius: "0.625rem",
  padding: "1rem",
};

const BTN: React.CSSProperties = {
  padding: "0.35rem 0.75rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.emerald}`,
  background: C.panel,
  color: C.emeraldDeep,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.8125rem",
  fontWeight: 600,
  textDecoration: "none",
  display: "inline-block",
};

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ ...CARD, minWidth: "110px", flex: "1 1 110px" }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

export function UnifiedCmsHubSection() {
  const { showSuccess } = useAdminShell();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<CmsDashboardStats | null>(null);
  const [notifications, setNotifications] = useState<CmsNotification[]>([]);
  const [pendingContributions, setPendingContributions] = useState(0);
  const [recentJobs, setRecentJobs] = useState<Awaited<ReturnType<typeof getRecentContentImportJobs>>>([]);
  const [filter, setFilter] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [s, n, c, j] = await Promise.all([
        getCmsDashboardStats(),
        refreshActivityNotifications(),
        listPendingContributions(20),
        getRecentContentImportJobs(8),
      ]);
      setStats(s);
      setNotifications(n);
      setPendingContributions(c.length);
      setRecentJobs(j);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const filteredSections = useMemo(() => {
    const q = filter.trim();
    if (!q) return PLATFORM_SECTIONS;
    return PLATFORM_SECTIONS.filter((s) => s.label.includes(q) || s.id.includes(q));
  }, [filter]);

  const onMarkRead = async (id: string) => {
    await markNotificationRead(id);
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    showSuccess("تم تعليم التنبيه كمقروء");
  };

  if (loading) return <Loading />;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1.25rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>منصة إدارة المحتوى الذكية</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem", lineHeight: 1.7 }}>
            قنوات موحدة: إدخال يدوي · استيراد جماعي · أتمتة 24/7 · مساهمات المستخدمين — مع مراجعة وجودة وتكرار موحد.
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "center" }}>
          <ContentFileImport onDone={load} />
          <Link href="/admin/automation/review" style={{ ...BTN, background: "#FFEDD5", borderColor: "#C2410C", color: "#C2410C" }}>
            مركز المراجعة
          </Link>
          <Link href="/admin/automation" style={BTN}>
            لوحة الأتمتة
          </Link>
          <Link href="/contribute" style={{ ...BTN, background: "#DBEAFE", borderColor: "#1D4ED8", color: "#1D4ED8" }}>
            بوابة المساهمة
          </Link>
        </div>
      </div>

      {/* Ops dashboard */}
      <section style={{ display: "flex", gap: "0.65rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <StatBox label="عناصر CMS" value={stats?.indexTotal ?? "—"} />
        <StatBox label="مهام استيراد" value={stats?.contentImportJobsTotal ?? 0} />
        <StatBox label="بانتظار المراجعة" value={pendingContributions} color="#92400E" />
        <StatBox label="مفاتيح dedup" value={stats?.duplicateKeys ?? 0} />
        <StatBox label="سجلات اليوم" value={stats?.auditLogsToday ?? 0} />
        <StatBox label="تنبيهات" value={unreadCount} color={unreadCount ? "#991B1B" : C.emeraldDeep} />
        <StatBox label="Cron Jobs" value={automationCronCount()} />
        <StatBox label="مصادر استيراد" value={importTypesSupported().length} />
      </section>

      {/* Workflow pipeline legend */}
      <section style={{ ...CARD, marginBottom: "1.25rem" }}>
        <h3 style={{ margin: "0 0 0.5rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>سير العمل الموحد</h3>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem", fontSize: "0.75rem" }}>
          {(["draft", "automated_validation", "duplicate_detection", "ai_classification", "human_review", "published"] as const).map(
            (stage, i) => (
              <span key={stage} style={{ display: "flex", alignItems: "center", gap: "0.25rem" }}>
                {i > 0 && <span style={{ color: C.inkSoft }}>→</span>}
                <span style={{ background: C.parchmentDeep, padding: "0.2rem 0.5rem", borderRadius: "0.25rem" }}>
                  {WORKFLOW_STAGE_LABELS[stage]}
                </span>
              </span>
            ),
          )}
        </div>
      </section>

      <div style={{ display: "grid", gap: "1.25rem", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
        {/* Notifications */}
        <section style={CARD}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>
            التنبيهات {unreadCount > 0 && <span style={{ color: "#991B1B" }}>({unreadCount})</span>}
          </h3>
          {notifications.length === 0 && (
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا تنبيهات جديدة</p>
          )}
          <div style={{ display: "grid", gap: "0.5rem", maxHeight: "280px", overflowY: "auto" }}>
            {notifications.slice(0, 12).map((n) => (
              <div
                key={n.id}
                style={{
                  padding: "0.5rem 0.65rem",
                  borderRadius: "0.375rem",
                  background: n.read ? C.parchmentDeep : "#FEF3C7",
                  fontSize: "0.8125rem",
                }}
              >
                <div style={{ fontWeight: 600, color: C.emeraldDeep }}>
                  {notificationTypeLabel(n.type)} — {n.title}
                </div>
                <div style={{ color: C.inkSoft, marginTop: "0.15rem" }}>{n.message}</div>
                {!n.read && (
                  <button type="button" onClick={() => void onMarkRead(n.id)} style={{ ...BTN, marginTop: "0.35rem", fontSize: "0.75rem" }}>
                    تعليم كمقروء
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Recent imports */}
        <section style={CARD}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>آخر عمليات الاستيراد</h3>
          {recentJobs.length === 0 && (
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا مهام استيراد بعد</p>
          )}
          {recentJobs.map((j) => (
            <div key={j.id} style={{ fontSize: "0.8125rem", padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
              <strong>{j.type}</strong> · {j.status} · استورد {j.imported}/{j.total_rows}
              {j.filename && <span style={{ color: C.inkSoft }}> — {j.filename}</span>}
            </div>
          ))}
        </section>

        {/* Contribution types */}
        <section style={CARD}>
          <h3 style={{ margin: "0 0 0.75rem", fontSize: "0.9375rem", color: C.emeraldDeep }}>مساهمات المستخدمين</h3>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginBottom: "0.5rem" }}>
            {contributionTypesSupported().length} نوع مساهمة — كلها تمر بقائمة المراجعة قبل النشر.
          </p>
          <Link href="/contribute" style={{ ...BTN, background: C.emerald, color: C.parchment, border: "none" }}>
            فتح بوابة المساهمة
          </Link>
        </section>
      </div>

      {/* Content sections grid */}
      <section style={{ marginTop: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
          <h3 style={{ margin: 0, fontSize: "0.9375rem", color: C.emeraldDeep }}>جميع أقسام المحتوى ({PLATFORM_SECTIONS.length})</h3>
          <input
            type="search"
            placeholder="بحث في الأقسام…"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ padding: "0.4rem 0.65rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, fontFamily: "inherit", fontSize: "0.8125rem" }}
          />
        </div>
        <div style={{ display: "grid", gap: "0.65rem", gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {filteredSections.map((section) => (
            <SectionCard key={section.id} id={section.id} count={stats?.indexByKind[section.cmsKind || ""]} section={section} />
          ))}
        </div>
      </section>
    </div>
  );
}

function SectionCard({
  id,
  section,
  count,
}: {
  id: PlatformSectionId;
  section: (typeof PLATFORM_SECTIONS)[number];
  count?: number;
}) {
  const channels = section.channels.map((c) => {
    switch (c) {
      case "manual":
        return "يدوي";
      case "bulk_import":
        return "استيراد";
      case "automation":
        return "أتمتة";
      case "user_contribution":
        return "مساهمة";
      default:
        return c;
    }
  });

  return (
    <div style={{ ...CARD, display: "flex", flexDirection: "column", gap: "0.5rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
        <strong style={{ color: C.emeraldDeep, fontSize: "0.9375rem" }}>{section.label}</strong>
        {count != null && count > 0 && (
          <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{count}</span>
        )}
      </div>
      <div style={{ fontSize: "0.7rem", color: C.inkSoft }}>{channels.join(" · ")}</div>
      <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
        <Link href={adminUrlForSection(id)} style={BTN}>
          إدارة
        </Link>
        {section.importType && (
          <span style={{ fontSize: "0.7rem", color: C.inkSoft, alignSelf: "center" }}>
            import: {section.importType}
          </span>
        )}
      </div>
    </div>
  );
}
