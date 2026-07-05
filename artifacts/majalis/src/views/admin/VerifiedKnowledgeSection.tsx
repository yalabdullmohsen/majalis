import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "@/views/admin/AdminShell";
import {
  bootstrapVerifiedKnowledge,
  fetchVerifiedKnowledgeDashboard,
  runVerifiedKnowledgeCycle,
  type QualityGap,
  type QualityReport,
  type VerifiedKnowledgeDashboard,
} from "@/lib/verified-knowledge-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

function gapLabel(reason: string) {
  if (reason === "empty_section") return "قسم فارغ";
  if (reason === "unverified_content") return "محتوى غير موثّق";
  return reason;
}

function priorityColor(priority: QualityGap["priority"]) {
  if (priority === "high") return "#991B1B";
  if (priority === "medium") return "#0E6E52";
  return C.inkSoft;
}

export function VerifiedKnowledgeSection() {
  const { showSuccess, showError } = useAdminShell();
  const [data, setData] = useState<VerifiedKnowledgeDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [bootstrapping, setBootstrapping] = useState(false);

  const report = data?.report as QualityReport | undefined;
  const sources = data?.sources;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchVerifiedKnowledgeDashboard();
      setData(result);
    } catch {
      showError("تعذر تحميل لوحة المعرفة الموثقة.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async (checkLinks = false) => {
    setRunning(true);
    try {
      await runVerifiedKnowledgeCycle({ checkLinks, persistVerification: true });
      showSuccess("اكتملت دورة الاستيراد والتحقق.");
      await load();
    } catch {
      showError("فشلت دورة المعرفة الموثقة.");
    } finally {
      setRunning(false);
    }
  };

  const handleBootstrap = async () => {
    setBootstrapping(true);
    try {
      await bootstrapVerifiedKnowledge({ persistProvenance: true });
      showSuccess("اكتملت تهيئة الأذكار والأحاديث.");
      await load();
    } catch {
      showError("فشلت تهيئة المحتوى الموثق.");
    } finally {
      setBootstrapping(false);
    }
  };

  if (loading && !data) return <Loading />;

  const totals = report?.totals ?? {};
  const gaps = report?.gaps ?? [];
  const sections = report?.sections ?? {};

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", gap: "1rem", flexWrap: "wrap" }}>
        <div>
          <h2 style={{ margin: 0, color: C.emeraldDeep }}>قاعدة المعرفة الموثقة</h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.875rem", color: C.inkSoft }}>
            استيراد ذكي — مصادر رسمية — نشر تلقائي عند ثقة ≥ 90%
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            disabled={running}
            onClick={() => handleRun(false)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: "none", background: C.emerald, color: "#fff", cursor: "pointer" }}
          >
            {running ? "جاري التشغيل…" : "تشغيل الدورة"}
          </button>
          <button
            type="button"
            disabled={running}
            onClick={() => handleRun(true)}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}
          >
            دورة + فحص روابط
          </button>
          <button
            type="button"
            disabled={bootstrapping}
            onClick={handleBootstrap}
            style={{ padding: "0.5rem 1rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, cursor: "pointer" }}
          >
            {bootstrapping ? "جاري التهيئة…" : "تهيئة الأذكار/الأحاديث"}
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
        <StatCard label="المصادر" value={sources?.total ?? totals.sources_total ?? 0} sub={`${sources?.active ?? totals.sources_active ?? 0} نشط`} />
        <StatCard label="أذكار موثّقة" value={totals.verified_adhkar ?? 0} />
        <StatCard label="أحاديث موثّقة" value={totals.verified_hadith ?? 0} />
        <StatCard label="سجل المصادر" value={totals.provenance_verified ?? 0} />
        <StatCard label="فجوات" value={totals.gaps_count ?? gaps.length} />
        <StatCard label="Seed corpus" value={totals.seed_corpus_total ?? 0} />
      </div>

      {(report?.recommendations?.length ?? 0) > 0 && (
        <div style={{ marginBottom: "1.5rem", padding: "0.75rem 1rem", borderRadius: "0.5rem", background: "rgba(14,110,82,0.08)", border: "1px solid #F59E0B" }}>
          <p style={{ margin: 0, fontWeight: 600, color: "#0E6E52" }}>توصيات</p>
          <ul style={{ margin: "0.5rem 0 0", paddingRight: "1.25rem", color: "#78350F", fontSize: "0.875rem" }}>
            {report?.recommendations?.map((rec) => (
              <li key={rec}>{rec}</li>
            ))}
          </ul>
        </div>
      )}

      <h3 style={{ color: C.emeraldDeep }}>فجوات المحتوى</h3>
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "right", background: C.panel }}>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>القسم</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>السبب</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>الأولوية</th>
            </tr>
          </thead>
          <tbody>
            {gaps.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ padding: "0.75rem", textAlign: "center", color: C.inkSoft }}>
                  لا توجد فجوات — جميع الأقسام تحتوي على محتوى
                </td>
              </tr>
            ) : (
              gaps.map((gap) => (
                <tr key={`${gap.section}-${gap.reason}`}>
                  <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{gap.section}</td>
                  <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{gapLabel(gap.reason)}</td>
                  <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, color: priorityColor(gap.priority) }}>{gap.priority}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: C.emeraldDeep }}>جودة الأقسام</h3>
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "right", background: C.panel }}>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>القسم</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>Seed</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>DB</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>موثّق</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(sections).map(([key, stats]) => (
              <tr key={key}>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{key}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>
                  {stats.seed ?? stats.seed_items ?? stats.seed_categories ?? "—"}
                </td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{stats.db?.total ?? 0}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, color: C.emeraldDeep }}>{stats.db?.verified ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h3 style={{ color: C.emeraldDeep }}>سجل المصادر الرسمية</h3>
      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.875rem" }}>
          <thead>
            <tr style={{ textAlign: "right", background: C.panel }}>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>المصدر</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>النوع</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>الثقة</th>
              <th style={{ padding: "0.5rem", borderBottom: `2px solid ${C.line}` }}>الحالة</th>
            </tr>
          </thead>
          <tbody>
            {(sources?.sources ?? []).slice(0, 30).map((src) => (
              <tr key={src.slug}>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{src.name_ar ?? src.name}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{src.import_method ?? src.source_type}</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}` }}>{src.trust_level}%</td>
                <td style={{ padding: "0.5rem", borderBottom: `1px solid ${C.line}`, color: src.is_active ? C.emeraldDeep : C.inkSoft }}>
                  {src.is_active ? "نشط" : "معطّل"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
