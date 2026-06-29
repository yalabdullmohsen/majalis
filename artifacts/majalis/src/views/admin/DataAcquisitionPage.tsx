import { useCallback, useEffect, useState, type CSSProperties } from "react";
import { Link } from "wouter";
import {
  getDataAcquisitionDashboard,
  runDataAcquisition,
  runDataAcquisitionSource,
  toggleDataAcquisitionSource,
  seedDataAcquisitionSources,
} from "@/lib/data-acquisition-api";
import { C } from "@/lib/theme";
import { Loading } from "@/components/ui-common";
import { AdminShell } from "@/views/admin/AdminShell";

type Dashboard = Awaited<ReturnType<typeof getDataAcquisitionDashboard>>;

function Stat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div style={{ background: C.panel, border: `1px solid ${C.line}`, borderRadius: "0.5rem", padding: "1rem", minWidth: "100px" }}>
      <div style={{ fontSize: "1.35rem", fontWeight: 700, color: color || C.emeraldDeep }}>{value}</div>
      <div style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: "0.25rem" }}>{label}</div>
    </div>
  );
}

function DataAcquisitionContent() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState<string | null>(null);
  const [msg, setMsg] = useState("");

  const load = useCallback(() => {
    setLoading(true);
    getDataAcquisitionDashboard()
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const trigger = async (action: string, fn: () => Promise<unknown>) => {
    setRunning(action);
    setMsg("");
    try {
      await fn();
      setMsg(`تم: ${action}`);
      load();
    } catch (e) {
      setMsg(`خطأ: ${e instanceof Error ? e.message : "failed"}`);
    } finally {
      setRunning(null);
    }
  };

  if (loading) return <Loading />;

  const s = data?.sources;
  const i = data?.items;

  return (
    <div dir="rtl">
      <h1 style={{ fontSize: "1.25rem", fontWeight: 800, color: C.emeraldDeep, marginBottom: "0.25rem" }}>
        محرك جمع البيانات الآلي
      </h1>
      <p style={{ color: C.inkSoft, fontSize: "0.875rem", marginBottom: "1rem" }}>
        Fetch → Parse → Extract → Normalize → Classify → Dedup → Validate → Score → Review → Publish
        · التخزين: {data?.storage || "—"}
      </p>

      {msg && <p style={{ padding: "0.5rem 1rem", background: "#ecfdf5", borderRadius: "0.5rem", marginBottom: "1rem" }}>{msg}</p>}

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.65rem", marginBottom: "1.25rem" }}>
        <Stat label="المصادر" value={s?.total ?? 0} />
        <Stat label="نشط" value={s?.active ?? 0} />
        <Stat label="مستخرج" value={i?.total ?? 0} />
        <Stat label="منشور" value={i?.published ?? 0} color="#1f6e54" />
        <Stat label="مراجعة" value={data?.reviewQueue ?? 0} color="#b45309" />
        <Stat label="مكرر" value={i?.duplicate ?? 0} color="#6b7280" />
        <Stat label="مرفوض" value={i?.rejected ?? 0} color="#b91c1c" />
        <Stat label="دقة التصنيف" value={`${data?.metrics?.classificationAccuracyPct ?? 0}%`} />
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "1.5rem" }}>
        <button type="button" disabled={!!running} onClick={() => void trigger("hourly", () => runDataAcquisition("hourly"))} style={btn}>
          {running === "hourly" ? "…" : "▶ تشغيل (ساعي)"}
        </button>
        <button type="button" disabled={!!running} onClick={() => void trigger("daily", () => runDataAcquisition("daily"))} style={btn}>
          تشغيل يومي
        </button>
        <button type="button" disabled={!!running} onClick={() => void trigger("seed", () => seedDataAcquisitionSources())} style={btnSec}>
          بذر المصادر
        </button>
      </div>

      <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>المصادر</h2>
      <div style={{ overflowX: "auto", marginBottom: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "#f9fafb" }}>
              {["الاسم", "النوع", "الثقة", "الحالة", "آخر فحص", "مستخرج", "إجراء"].map((h) => (
                <th key={h} style={{ padding: "0.5rem", textAlign: "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {(s?.list || []).slice(0, 30).map((src) => (
              <tr key={src.id || src.slug} style={{ borderBottom: `1px solid ${C.line}` }}>
                <td style={td}>{src.name}</td>
                <td style={td}>{src.source_type}</td>
                <td style={td}>{src.trust_score}%</td>
                <td style={td}>{src.status}</td>
                <td style={td}>{src.last_checked_at ? new Date(src.last_checked_at).toLocaleString("ar-KW") : "—"}</td>
                <td style={td}>{src.items_extracted_total ?? 0}</td>
                <td style={td}>
                  <button type="button" style={linkBtn} onClick={() => void trigger(src.slug, () => runDataAcquisitionSource(src.id || src.slug))}>فحص</button>
                  <button type="button" style={linkBtn} onClick={() => void trigger("toggle", () => toggleDataAcquisitionSource(src.id || src.slug))}>
                    {src.status === "active" ? "إيقاف" : "تفعيل"}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <h2 style={{ fontSize: "1rem", marginBottom: "0.5rem" }}>آخر السجلات</h2>
      <div style={{ fontSize: "0.8125rem", color: C.inkSoft, maxHeight: "200px", overflow: "auto" }}>
        {(data?.recentLogs || []).map((log) => (
          <div key={log.id} style={{ padding: "0.35rem 0", borderBottom: `1px solid ${C.line}` }}>
            [{log.level}] {log.message}
          </div>
        ))}
      </div>

      <p style={{ marginTop: "1rem", fontSize: "0.8125rem" }}>
        <Link href="/admin/content-production" style={{ color: C.emeraldDeep }}>← إنتاج المحتوى</Link>
        {" · "}
        <Link href="/admin/sources" style={{ color: C.emeraldDeep }}>مصادر AKP</Link>
      </p>
    </div>
  );
}

export default function DataAcquisitionPage() {
  return (
    <AdminShell section="dashboard">
      <DataAcquisitionContent />
    </AdminShell>
  );
}

const btn: CSSProperties = { padding: "0.5rem 1rem", background: C.emerald, color: "#fff", border: "none", borderRadius: "0.375rem", cursor: "pointer", fontWeight: 600 };
const btnSec: CSSProperties = { ...btn, background: "#fff", color: C.emerald, border: `1px solid ${C.emerald}` };
const td: CSSProperties = { padding: "0.5rem" };
const linkBtn: CSSProperties = { background: "none", border: "none", color: C.emerald, cursor: "pointer", marginInlineStart: "0.35rem" };
