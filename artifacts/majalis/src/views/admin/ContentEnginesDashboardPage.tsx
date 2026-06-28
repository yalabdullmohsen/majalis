import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import {
  getContentEnginesDashboard,
  runContentEngine,
  runAllContentEngines,
  runContentEnginesBackfill,
  retryFailedContentEngines,
  type ContentEnginesDashboard,
  type ContentEngineConfig,
} from "@/lib/content-engines-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

function StatCard({ label, value, color }: { label: string; value: number | string; color?: string }) {
  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${C.line}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        minWidth: "100px",
      }}
    >
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function EngineCard({
  engine,
  onRun,
  running,
}: {
  engine: ContentEngineConfig;
  onRun: (id: string) => void;
  running: string | null;
}) {
  const lastRun = engine.lastRun;
  const healthColor =
    engine.health_score >= 80 ? C.emeraldDeep : engine.health_score >= 50 ? "#b8860b" : "#c0392b";

  return (
    <div
      style={{
        background: C.panel,
        border: `1px solid ${engine.enabled ? C.line : "#ddd"}`,
        borderRadius: "0.5rem",
        padding: "1rem",
        opacity: engine.enabled ? 1 : 0.65,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
        <div>
          <div style={{ fontWeight: 600, color: C.emeraldDeep }}>{engine.label_ar}</div>
          <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.2rem" }}>{engine.id}</div>
        </div>
        <span
          style={{
            fontSize: "0.75rem",
            padding: "0.15rem 0.5rem",
            borderRadius: "999px",
            background: engine.enabled ? "#e8f5e9" : "#f5f5f5",
            color: engine.enabled ? C.emeraldDeep : C.inkSoft,
          }}
        >
          {engine.enabled ? "مفعّل" : "معطّل"}
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem", marginTop: "0.75rem", fontSize: "0.75rem" }}>
        <div>
          <div style={{ color: C.inkSoft }}>الصحة</div>
          <div style={{ fontWeight: 600, color: healthColor }}>{engine.health_score ?? "—"}</div>
        </div>
        <div>
          <div style={{ color: C.inkSoft }}>آخر تشغيل</div>
          <div>{engine.last_run_at ? new Date(engine.last_run_at).toLocaleString("ar-KW") : "—"}</div>
        </div>
        <div>
          <div style={{ color: C.inkSoft }}>نُشر</div>
          <div style={{ fontWeight: 600 }}>{lastRun?.items_published ?? "—"}</div>
        </div>
      </div>

      {lastRun && (
        <div style={{ fontSize: "0.7rem", color: C.inkSoft, marginTop: "0.5rem" }}>
          جُلب: {lastRun.items_fetched} | حُلل: {lastRun.items_parsed} | مكرر: {lastRun.items_duplicate} | مرفوض:{" "}
          {lastRun.items_rejected} | مراجعة: {lastRun.items_review}
        </div>
      )}

      {engine.last_error && (
        <div style={{ fontSize: "0.7rem", color: "#c0392b", marginTop: "0.35rem" }}>{engine.last_error.slice(0, 120)}</div>
      )}

      <button
        type="button"
        disabled={running !== null || !engine.enabled}
        onClick={() => onRun(engine.id)}
        style={{
          marginTop: "0.75rem",
          padding: "0.35rem 0.75rem",
          fontSize: "0.8125rem",
          background: C.emeraldDeep,
          color: "#fff",
          border: "none",
          borderRadius: "0.35rem",
          cursor: running ? "wait" : "pointer",
          opacity: running === engine.id ? 0.7 : 1,
        }}
      >
        {running === engine.id ? "جاري..." : "تشغيل"}
      </button>
    </div>
  );
}

function ContentEnginesDashboardContent() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ContentEnginesDashboard | null>(null);
  const [running, setRunning] = useState<string | null>(null);
  const [globalRunning, setGlobalRunning] = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    getContentEnginesDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, [load]);

  const runEngine = async (engineId: string) => {
    setRunning(engineId);
    try {
      await runContentEngine(engineId);
      load();
    } finally {
      setRunning(null);
    }
  };

  const runAll = async () => {
    setGlobalRunning(true);
    try {
      await runAllContentEngines();
      load();
    } finally {
      setGlobalRunning(false);
    }
  };

  const backfill = async () => {
    setGlobalRunning(true);
    try {
      await runContentEnginesBackfill();
      load();
    } finally {
      setGlobalRunning(false);
    }
  };

  const retryFailed = async () => {
    setGlobalRunning(true);
    try {
      await retryFailedContentEngines();
      load();
    } finally {
      setGlobalRunning(false);
    }
  };

  const v = data?.verification;
  const totals = data?.stats?.totals;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", marginBottom: "1rem" }}>
        <div>
          <h2 style={{ margin: "0 0 0.35rem", color: C.emeraldDeep }}>محركات المحتوى الذاتية — Phase 7</h2>
          <p style={{ margin: 0, color: C.inkSoft, fontSize: "0.875rem" }}>
            Fetch → Parse → Normalize → Validate → Dedup → AI → Quality → Publish/Review → Index → SEO → Recommend
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", alignItems: "flex-start" }}>
          <Link href="/admin/automation/review" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>
            مركز المراجعة
          </Link>
          <Link href="/admin?section=knowledge-engine" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>
            AKE
          </Link>
          <Link href="/admin/content-production" style={{ color: C.emeraldDeep, fontSize: "0.8125rem" }}>
            إنتاج المحتوى
          </Link>
        </div>
      </div>

      <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
        <button
          type="button"
          disabled={globalRunning}
          onClick={runAll}
          style={{ padding: "0.5rem 1rem", background: C.emeraldDeep, color: "#fff", border: "none", borderRadius: "0.35rem", cursor: "pointer" }}
        >
          {globalRunning ? "جاري..." : "تشغيل الكل"}
        </button>
        <button
          type="button"
          disabled={globalRunning}
          onClick={backfill}
          style={{ padding: "0.5rem 1rem", background: "#2c5282", color: "#fff", border: "none", borderRadius: "0.35rem", cursor: "pointer" }}
        >
          تعبئة الشهر الحالي
        </button>
        <button
          type="button"
          disabled={globalRunning}
          onClick={retryFailed}
          style={{ padding: "0.5rem 1rem", background: C.panel, color: C.emeraldDeep, border: `1px solid ${C.line}`, borderRadius: "0.35rem", cursor: "pointer" }}
        >
          إعادة المحاولات الفاشلة
        </button>
        <Link href="/admin/automation/review">
          <span
            style={{
              display: "inline-block",
              padding: "0.5rem 1rem",
              background: C.panel,
              color: C.emeraldDeep,
              border: `1px solid ${C.line}`,
              borderRadius: "0.35rem",
              fontSize: "0.875rem",
            }}
          >
            فتح مركز المراجعة ({data?.stats?.review_pending ?? 0})
          </span>
        </Link>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
            <StatCard label="مصادر نشطة" value={v?.activeSources ?? "—"} />
            <StatCard label="جُلب" value={v?.fetched ?? 0} />
            <StatCard label="حُلل" value={v?.parsed ?? 0} />
            <StatCard label="ثري" value={v?.enriched ?? 0} />
            <StatCard label="مكرر" value={v?.duplicates ?? 0} color="#888" />
            <StatCard label="مرفوض" value={v?.rejected ?? 0} color="#c0392b" />
            <StatCard label="مراجعة" value={v?.reviewPending ?? 0} color="#b8860b" />
            <StatCard label="نُشر" value={v?.published ?? 0} />
            <StatCard label="فوائد" value={totals?.published_benefits ?? v?.publishedBenefits ?? 0} />
            <StatCard label="أسئلة" value={totals?.published_questions ?? v?.publishedQuestions ?? 0} />
            <StatCard label="ملاحظات" value={totals?.lesson_notes ?? v?.lessonNotes ?? 0} />
            <StatCard label="توصيات" value={totals?.recommendations ?? v?.recommendationLinks ?? 0} />
          </div>

          <h3 style={{ color: C.emeraldDeep, marginBottom: "0.75rem" }}>المحركات ({data?.stats?.engines?.length ?? 0})</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: "0.75rem",
            }}
          >
            {(data?.stats?.engines || []).map((engine) => (
              <EngineCard key={engine.id} engine={engine} onRun={runEngine} running={running} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function ContentEnginesDashboardPage() {
  return (
    <AdminShell title="محركات المحتوى">
      <ContentEnginesDashboardContent />
    </AdminShell>
  );
}

export function ContentEnginesSection() {
  return <ContentEnginesDashboardContent />;
}
