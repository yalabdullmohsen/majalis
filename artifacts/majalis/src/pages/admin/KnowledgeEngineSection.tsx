import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { useAdminShell } from "@/pages/admin/AdminShell";
import {
  fetchKnowledgeStats,
  runKnowledgePipelineManual,
  type KnowledgePipelineStats,
} from "@/lib/knowledge-engine-service";

function StatCard({ label, value, sub }: { label: string; value: string | number; sub?: string }) {
  return (
    <div style={{ padding: "1rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
      <p style={{ margin: 0, fontSize: "0.75rem", color: C.inkSoft }}>{label}</p>
      <p style={{ margin: "0.25rem 0 0", fontSize: "1.5rem", fontWeight: 700, color: C.emeraldDeep }}>{value}</p>
      {sub && <p style={{ margin: "0.25rem 0 0", fontSize: "0.75rem", color: C.inkSoft }}>{sub}</p>}
    </div>
  );
}

function SectionBar({ label, count, max }: { label: string; count: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((count / max) * 100)) : 0;
  return (
    <div style={{ marginBottom: "0.75rem" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.25rem" }}>
        <span>{label}</span>
        <span style={{ color: C.inkSoft }}>{count} ({pct}%)</span>
      </div>
      <div style={{ height: "6px", borderRadius: "3px", background: C.parchmentDeep }}>
        <div style={{ width: `${pct}%`, height: "100%", borderRadius: "3px", background: C.emerald }} />
      </div>
    </div>
  );
}

export function KnowledgeEngineSection() {
  const { showSuccess, showError } = useAdminShell();
  const [stats, setStats] = useState<KnowledgePipelineStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [usingSeed, setUsingSeed] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const result = await fetchKnowledgeStats(7);
      setStats(result.stats);
      setUsingSeed(Boolean(result.usingSeed));
    } catch {
      showError("تعذر تحميل إحصائيات محرك المعرفة.");
    } finally {
      setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    load();
  }, [load]);

  const handleRun = async () => {
    setRunning(true);
    try {
      const result = await runKnowledgePipelineManual({ maxItems: 30 });
      showSuccess(
        `اكتمل التشغيل: ${result.pipeline?.analyzed ?? 0} محلّلة، ${result.pipeline?.published ?? 0} منشورة، ${result.pipeline?.review ?? 0} للمراجعة`,
      );
      await load();
    } catch {
      showError("فشل تشغيل محرك المعرفة.");
    } finally {
      setRunning(false);
    }
  };

  const sections = stats?.section_completion || {};
  const sectionMax = Math.max(...Object.values(sections).map(Number), 1);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <div>
          <h2 style={{ margin: 0, fontSize: "1.125rem", fontWeight: 700, color: C.emeraldDeep }}>
            محرك المعرفة الذكي
          </h2>
          <p style={{ margin: "0.25rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>
            Crawler → AI Analysis → Quality → Publish — مصادر رسمية فقط
          </p>
        </div>
        <button
          type="button"
          onClick={handleRun}
          disabled={running}
          style={{
            padding: "0.5rem 1.25rem",
            borderRadius: "0.375rem",
            background: C.emerald,
            color: "white",
            border: "none",
            cursor: running ? "wait" : "pointer",
            opacity: running ? 0.7 : 1,
          }}
        >
          {running ? "جارٍ التشغيل..." : "▶ تشغيل Pipeline"}
        </button>
      </div>

      {usingSeed && (
        <div style={{ padding: "0.75rem 1rem", marginBottom: "1rem", borderRadius: "0.375rem", background: "#FEF3C7", border: "1px solid #F59E0B", fontSize: "0.8125rem", color: "#92400E" }}>
          ⚠️ جداول knowledge_engine_v12 غير موجودة بعد — نفّذ migration في Supabase SQL Editor.
        </div>
      )}

      {loading ? (
        <Loading />
      ) : (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <StatCard label="مصادر نشطة" value={stats?.sources_active ?? 8} sub={`من ${stats?.sources_total ?? 8}`} />
            <StatCard label="جديد اليوم" value={stats?.items_today ?? 0} />
            <StatCard label="منشور اليوم" value={stats?.items_published_today ?? 0} />
            <StatCard label="قيد المراجعة" value={stats?.items_review ?? 0} />
            <StatCard label="مرفوض" value={stats?.items_rejected ?? 0} />
            <StatCard label="مكرر" value={stats?.items_duplicate ?? 0} />
            <StatCard label="جودة متوسطة" value={`${stats?.avg_quality ?? 0}%`} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
            <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep }}>
                اكتمال الأقسام
              </h3>
              <SectionBar label="دروس" count={sections.lessons ?? 0} max={sectionMax} />
              <SectionBar label="مكتبة" count={sections.library ?? 0} max={sectionMax} />
              <SectionBar label="فوائد" count={sections.fawaid ?? 0} max={sectionMax} />
              <SectionBar label="إعجاز علمي" count={sections.miracles ?? 0} max={sectionMax} />
              <SectionBar label="أسئلة" count={sections.qa ?? 0} max={sectionMax} />
              <SectionBar label="فتاوى" count={sections.fatwas ?? 0} max={sectionMax} />
              <SectionBar label="مجمع فقهي" count={sections.fiqh ?? 0} max={sectionMax} />
              <SectionBar label="محرك المعرفة" count={sections.knowledge_published ?? 0} max={sectionMax} />
            </div>

            <div style={{ padding: "1.25rem", borderRadius: "0.5rem", border: `1px solid ${C.line}`, background: C.panel }}>
              <h3 style={{ margin: "0 0 1rem", fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep }}>
                أهم التصنيفات (7 أيام)
              </h3>
              {(stats?.top_categories || []).length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا بيانات بعد — شغّل Pipeline.</p>
              ) : (
                (stats?.top_categories || []).map((c) => (
                  <div key={c.category} style={{ display: "flex", justifyContent: "space-between", padding: "0.375rem 0", borderBottom: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                    <span>{c.category}</span>
                    <span style={{ color: C.emeraldDeep, fontWeight: 600 }}>{c.cnt}</span>
                  </div>
                ))
              )}

              <h3 style={{ margin: "1.25rem 0 0.75rem", fontSize: "0.9375rem", fontWeight: 700, color: C.emeraldDeep }}>
                آخر التشغيلات
              </h3>
              {(stats?.runs_recent || []).length === 0 ? (
                <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>لا تشغيلات مسجّلة.</p>
              ) : (
                (stats?.runs_recent as Array<Record<string, unknown>>).slice(0, 5).map((r) => (
                  <div key={String(r.id)} style={{ fontSize: "0.75rem", color: C.inkSoft, padding: "0.25rem 0" }}>
                    {String(r.status)} — {String(r.fetched_count ?? 0)} مجلبة، {String(r.published_count ?? 0)} منشورة
                  </div>
                ))
              )}
            </div>
          </div>

          <div style={{ marginTop: "1.25rem", padding: "1rem", borderRadius: "0.375rem", background: C.parchmentDeep, fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.7 }}>
            <strong style={{ color: C.emeraldDeep }}>سياسة المحتوى:</strong> الذكاء الاصطناعي لا يُنشئ أحاديث ولا فتاوى ولا أحكاماً.
            يقتصر على استخراج البيانات الوصفية من المصادر الرسمية. أي مادة دون الحد الأدنى من الجودة تبقى في «قيد المراجعة».
          </div>
        </>
      )}
    </div>
  );
}
