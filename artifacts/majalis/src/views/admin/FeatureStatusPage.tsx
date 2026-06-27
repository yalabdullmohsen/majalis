import { useCallback, useEffect, useState } from "react";
import { Link } from "wouter";
import { Loading } from "@/components/ui-common";
import registry from "../../../data/feature-registry.json";

type FeatureRow = {
  id: string;
  name: string;
  phase?: number;
  pr?: number;
  branch?: string;
  routes?: string[];
  usesMock?: boolean;
  migrations?: string[];
  requiredSecrets?: string[];
};

type HealthPayload = {
  ok: boolean;
  env?: Record<string, boolean>;
  tables?: Record<string, string>;
  routeChecks?: Record<string, { ok: boolean; status: number }>;
  apiChecks?: Record<string, { ok: boolean; status: number; detail?: unknown }>;
  bundleMarker?: {
    hasQuranV2?: boolean;
    hasLessonsV2?: boolean;
    hasQaV2?: boolean;
    hasMousou3a?: boolean;
    hasQuranStoriesLabel?: boolean;
    vercelPr?: string | null;
  };
  error?: string;
};

const STATUS_LABEL: Record<string, string> = {
  done: "منفذة",
  partial: "جزئية",
  blocked: "محجوبة",
  mock: "Mock فقط",
  missing: "غير موجودة",
};

function statusClass(s: string) {
  if (s === "done") return "feature-status-badge feature-status-badge--done";
  if (s === "partial") return "feature-status-badge feature-status-badge--partial";
  if (s === "blocked") return "feature-status-badge feature-status-badge--blocked";
  if (s === "mock") return "feature-status-badge feature-status-badge--mock";
  return "feature-status-badge feature-status-badge--missing";
}

function inferStatus(f: FeatureRow, health: HealthPayload | null): { key: string; label: string; notes: string[] } {
  const notes: string[] = [];
  const bm = health?.bundleMarker;

  if (f.id === "quran-v2") {
    if (bm?.hasQuranV2) return { key: "done", label: STATUS_LABEL.done, notes: ["bundle يحتوي quran-v2"] };
    notes.push("Production bundle لا يحتوي quran-v2 — PR #72 غير مدمج");
    return { key: "partial", label: STATUS_LABEL.partial, notes };
  }
  if (f.id === "lessons-v2") {
    if (bm?.hasLessonsV2) return { key: "done", label: STATUS_LABEL.done, notes: [] };
    notes.push("Production bundle لا يحتوي lessons-page-v2");
    return { key: "partial", label: STATUS_LABEL.partial, notes };
  }
  if (f.id === "qa-taxonomy") {
    if (bm?.hasQaV2) return { key: "done", label: STATUS_LABEL.done, notes: [] };
    notes.push("Production bundle لا يحتوي qa-page-v2");
    return { key: "partial", label: STATUS_LABEL.partial, notes };
  }
  if (f.id === "quran-stories") {
    if (bm?.hasMousou3a) notes.push("Production ما زال يعرض «موسوعة»");
    if (bm?.hasQuranStoriesLabel) return { key: "done", label: STATUS_LABEL.done, notes };
    return { key: "partial", label: STATUS_LABEL.partial, notes };
  }
  if (f.id === "assistant") {
    const post = health?.apiChecks?.assistantPost;
    if (post && !post.ok) notes.push(`POST /api/assistant → HTTP ${post.status}`);
    if (post?.ok) return { key: "done", label: STATUS_LABEL.done, notes };
    return { key: "blocked", label: "لا تعمل", notes };
  }
  if (f.id === "instagram-graph") {
    const missing = (f.requiredSecrets || []).filter((k) => !health?.env?.[k]);
    if (missing.length) {
      notes.push(`Secrets ناقصة: ${missing.join(", ")}`);
      return { key: "blocked", label: "تحتاج Secret", notes };
    }
  }
  if (f.usesMock) {
    notes.push("تعتمد على seed/mock عند غياب Supabase");
    return { key: "mock", label: STATUS_LABEL.mock, notes };
  }
  const routeOk = (f.routes || []).every((r) => health?.routeChecks?.[r]?.ok !== false);
  if (routeOk) return { key: "done", label: STATUS_LABEL.done, notes };
  return { key: "partial", label: STATUS_LABEL.partial, notes: ["Route غير متاح على Production"] };
}

export default function FeatureStatusPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/feature-health");
      const json = (await res.json()) as HealthPayload;
      if (!res.ok) throw new Error(json.error || `HTTP ${res.status}`);
      setHealth(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل حالة الميزات");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const features = registry.features as FeatureRow[];

  return (
    <div className="page-shell admin-feature-status-page">
      <header className="admin-feature-status__head ui-card">
        <div>
          <p className="admin-feature-status__eyebrow">Principal Engineer Audit</p>
          <h1>حالة الميزات — Feature Status</h1>
          <p className="admin-feature-status__intro">
            لا تُعتبر الميزة منفذة إلا إذا: موجودة في الكود، مدمجة في main، منشورة على Production، وتعمل من الواجهة.
          </p>
        </div>
        <div className="admin-feature-status__actions">
          <button type="button" className="ui-card-btn" onClick={load} disabled={loading}>
            {loading ? "جاري الفحص…" : "إعادة الاختبار"}
          </button>
          <Link href="/admin" className="ui-card-btn ui-card-btn--ghost">
            لوحة التحكم
          </Link>
        </div>
      </header>

      {error && (
        <div className="ui-card admin-feature-status__error" role="alert">
          {error}
          <p>تأكد من تسجيل الدخول كمسؤول ووجود ADMIN_API_SECRET على الخادم.</p>
        </div>
      )}

      {loading && !health ? (
        <Loading />
      ) : (
        <>
          {health?.bundleMarker && (
            <section className="ui-card admin-feature-status__deploy">
              <h2>Production Bundle</h2>
              <ul>
                <li>quran-v2: {health.bundleMarker.hasQuranV2 ? "✅" : "❌"}</li>
                <li>lessons-v2: {health.bundleMarker.hasLessonsV2 ? "✅" : "❌"}</li>
                <li>qa-v2: {health.bundleMarker.hasQaV2 ? "✅" : "❌"}</li>
                <li>«موسوعة» في قصص القرآن: {health.bundleMarker.hasMousou3a ? "⚠️ نعم" : "✅ لا"}</li>
                {health.bundleMarker.vercelPr && (
                  <li>Vercel PR deploy: #{health.bundleMarker.vercelPr}</li>
                )}
              </ul>
            </section>
          )}

          {health?.env && (
            <section className="ui-card admin-feature-status__env">
              <h2>Health Check — Secrets (موجود/ناقص فقط)</h2>
              <div className="admin-feature-status__env-grid">
                {Object.entries(health.env).map(([key, ok]) => (
                  <span key={key} className={ok ? "env-ok" : "env-missing"}>
                    {ok ? "✓" : "✗"} {key}
                  </span>
                ))}
              </div>
            </section>
          )}

          <section className="ui-card admin-feature-status__table-wrap">
            <h2>سجل الميزات ({features.length})</h2>
            <div className="admin-feature-status__table-scroll">
              <table className="admin-feature-status__table">
                <thead>
                  <tr>
                    <th>الميزة</th>
                    <th>PR</th>
                    <th>Route</th>
                    <th>Mock</th>
                    <th>Migration</th>
                    <th>الحالة</th>
                    <th>ملاحظات</th>
                    <th>اختبار</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f) => {
                    const st = inferStatus(f, health);
                    return (
                      <tr key={f.id}>
                        <td>
                          <strong>{f.name}</strong>
                          <br />
                          <code>{f.id}</code>
                        </td>
                        <td>{f.pr ? `#${f.pr}` : "—"}</td>
                        <td>
                          {(f.routes || []).map((r) => (
                            <a key={r} href={`https://www.majlisilm.com${r}`} target="_blank" rel="noreferrer">
                              {r}
                            </a>
                          ))}
                        </td>
                        <td>{f.usesMock ? "نعم" : "لا"}</td>
                        <td>{f.migrations?.length ? f.migrations.join(", ") : "—"}</td>
                        <td>
                          <span className={statusClass(st.key)}>{st.label}</span>
                        </td>
                        <td className="admin-feature-status__notes">
                          {st.notes.map((n) => (
                            <div key={n}>{n}</div>
                          ))}
                        </td>
                        <td>
                          {f.routes?.[0] && (
                            <a
                              href={`https://www.majlisilm.com${f.routes[0]}`}
                              target="_blank"
                              rel="noreferrer"
                              className="ui-card-btn ui-card-btn--compact"
                            >
                              فتح
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {health?.apiChecks && (
            <section className="ui-card admin-feature-status__api">
              <h2>API Probes (Production)</h2>
              <ul>
                {Object.entries(health.apiChecks).map(([k, v]) => (
                  <li key={k}>
                    {v.ok ? "✅" : "❌"} {k} — HTTP {v.status}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </>
      )}

      <p className="admin-feature-status__cli">
        CLI: <code>pnpm run verify:features --production</code>
      </p>
    </div>
  );
}
