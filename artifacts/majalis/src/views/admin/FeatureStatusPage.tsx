import { useCallback, useEffect, useState } from "react";
import { Ban, CheckCircle2, XCircle } from "lucide-react";
import { Link } from "wouter";
import { SkeletonCardGrid } from "@/components/ui-common";
import { adminFetch } from "@/lib/admin-api";
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

type ApiFeature = {
  id: string;
  name: string;
  delivery: string;
  reason?: string | null;
  detail?: string | null;
};

type BootstrapFlags = {
  databaseReady?: boolean;
  migrationsApplied?: boolean;
  seedCompleted?: boolean;
  productionReady?: boolean;
  lastRun?: string | null;
  lastStatus?: string | null;
  lastError?: string | null;
  ownerActions?: Array<{ secret: string; addTo: string; hint: string }>;
};

type HealthPayload = {
  ok: boolean;
  at?: string;
  blockers?: string[];
  bootstrap?: BootstrapFlags;
  bootstrapDetail?: {
    ownerActions?: BootstrapFlags["ownerActions"];
    migrationStatus?: { appliedCount: number; pendingCount: number; pending: string[] };
    counts?: { qa_categories: number | null; sharia_rulings: number | null };
  };
  env?: Record<string, boolean>;
  secretGroups?: Record<string, { ok: boolean; missing: string[] }>;
  services?: {
    database?: {
      ok?: boolean;
      tables?: Record<string, boolean>;
      sharia_rulings_count?: number | null;
      rulings_using_db?: boolean;
      rulings_seed_available?: number;
    };
    assistant?: { ok?: boolean; anthropic?: boolean };
    mke?: { ok?: boolean; error?: string };
    cron?: { ok?: boolean; missing?: string[] };
    supabase?: { ok?: boolean; serviceRole?: boolean };
    automation?: { ok?: boolean };
  };
  tables?: Record<string, boolean>;
  routeChecks?: Record<string, { ok: boolean; status: number }>;
  apiChecks?: Record<string, { ok: boolean; status: number; detail?: unknown }>;
  features?: ApiFeature[];
  error?: string;
};

const DELIVERY_LABEL: Record<string, string> = {
  Production: "Production",
  Ready: "Ready",
  Blocked: "Blocked",
};

function deliveryClass(s: string) {
  if (s === "Production") return "feature-status-badge feature-status-badge--done";
  if (s === "Ready") return "feature-status-badge feature-status-badge--partial";
  return "feature-status-badge feature-status-badge--blocked";
}

export default function FeatureStatusPage() {
  const [health, setHealth] = useState<HealthPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [activating, setActivating] = useState(false);
  const [activateResult, setActivateResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await adminFetch("/api/admin/feature-health");
      const json = (await res.json()) as HealthPayload;
      if (!res.ok && !json.bootstrap) throw new Error(json.error || `HTTP ${res.status}`);
      setHealth(json);
    } catch (err) {
      setError(err instanceof Error ? err.message : "تعذر تحميل حالة الميزات");
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const runBootstrap = useCallback(async () => {
    setActivating(true);
    setActivateResult(null);
    try {
      const res = await adminFetch("/api/admin/platform-bootstrap?action=run");
      const json = await res.json();
      setActivateResult(JSON.stringify(json, null, 2));
      await load();
    } catch (err) {
      setActivateResult(err instanceof Error ? err.message : "فشل Self Bootstrap");
    } finally {
      setActivating(false);
    }
  }, [load]);

  const runActivation = useCallback(async (action: string) => {
    setActivating(true);
    setActivateResult(null);
    try {
      const res = await adminFetch(`/api/admin/production-activate?action=${action}`);
      const json = await res.json();
      setActivateResult(JSON.stringify(json, null, 2));
      await load();
    } catch (err) {
      setActivateResult(err instanceof Error ? err.message : "فشل التفعيل");
    } finally {
      setActivating(false);
    }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  const features = registry.features as FeatureRow[];
  const apiFeatures = health?.features ?? [];
  const featureById = Object.fromEntries(apiFeatures.map((f) => [f.id, f]));

  return (
    <div className="page-shell admin-feature-status-page">
      <header className="admin-feature-status__head ui-card">
        <div>
          <p className="admin-feature-status__eyebrow">Production Activation</p>
          <h1>حالة المنصة، Platform Health</h1>
          <p className="admin-feature-status__intro">
            Release Gate يعتمد على فحوصات حقيقية: جداول DB، Secrets، APIs، Cron، MKE، والأتمتة.
          </p>
        </div>
        <div className="admin-feature-status__actions">
          <button type="button" className="ui-card-btn" onClick={load} disabled={loading}>
            {loading ? "جاري الفحص…" : "إعادة الفحص"}
          </button>
          <button
            type="button"
            className="ui-card-btn ui-card-btn--primary"
            onClick={runBootstrap}
            disabled={activating}
          >
            {activating ? "جاري التهيئة…" : "Self Bootstrap كامل"}
          </button>
          <button
            type="button"
            className="ui-card-btn"
            onClick={() => runActivation("migrate")}
            disabled={activating}
          >
            Activation Migrations فقط
          </button>
          <Link href="/admin" className="ui-card-btn ui-card-btn--ghost">
            لوحة التحكم
          </Link>
        </div>
      </header>

      {error && (
        <div className="ui-card admin-feature-status__error" role="alert">
          {error}
          <p>تأكد من تسجيل الدخول كمسؤول.</p>
        </div>
      )}

      {loading && !health ? (
        <SkeletonCardGrid count={6} />
      ) : (
        <>
          <section className="ui-card admin-feature-status__bootstrap">
            <h2>Self Bootstrap</h2>
            <div className="admin-feature-status__bootstrap-grid">
              {(
                [
                  ["databaseReady", "Database Ready"],
                  ["migrationsApplied", "Migrations Applied"],
                  ["seedCompleted", "Seed Completed"],
                  ["productionReady", "Production Ready"],
                ] as const
              ).map(([key, label]) => {
                const ok = health?.bootstrap?.[key] === true;
                return (
                  <div key={key} className={`admin-bootstrap-flag${ok ? " admin-bootstrap-flag--ok" : ""}`}>
                    {ok ? <CheckCircle2 size={15} className="text-green-600" /> : <Ban size={15} className="text-red-500" />}
                    <span>{label}</span>
                  </div>
                );
              })}
            </div>
            {health?.bootstrap?.lastError && (
              <p className="admin-feature-status__error" role="alert">
                آخر خطأ: {health.bootstrap.lastError}
              </p>
            )}
            {(health?.bootstrap?.ownerActions?.length || health?.bootstrapDetail?.ownerActions?.length) ? (
              <div className="admin-bootstrap-owner-actions">
                <h3>مطلوب من مالك المشروع (Secrets)</h3>
                <ul>
                  {(health.bootstrap?.ownerActions || health.bootstrapDetail?.ownerActions || []).map((a) => (
                    <li key={a.secret}>
                      <code>{a.secret}</code>، {a.hint}
                      <br />
                      <small>{a.addTo}</small>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {health?.bootstrapDetail?.migrationStatus && (
              <p className="fsp-meta-note">
                Migrations: {health.bootstrapDetail.migrationStatus.appliedCount} applied,{" "}
                {health.bootstrapDetail.migrationStatus.pendingCount} pending
              </p>
            )}
          </section>

          <section className="ui-card admin-feature-status__deploy">
            <h2>Release Gate، {health?.ok ? <><CheckCircle2 size={16} className="inline text-green-600 ml-1" />Operational</> : <><Ban size={16} className="inline text-red-500 ml-1" />BLOCKED</>}</h2>
            {health?.at && <p>آخر فحص: {health.at}</p>}
            {health?.blockers?.length ? (
              <ul>
                {health.blockers.map((b) => (
                  <li key={b}><Ban size={13} className="inline text-red-500 ml-1" />{b}</li>
                ))}
              </ul>
            ) : (
              <p>لا توجد عوائق، جميع الفحوصات الأساسية ناجحة.</p>
            )}
          </section>

          {health?.secretGroups && (
            <section className="ui-card admin-feature-status__env">
              <h2>Secrets Groups</h2>
              <div className="admin-feature-status__env-grid">
                {Object.entries(health.secretGroups).map(([group, g]) => (
                  <span key={group} className={g.ok ? "env-ok" : "env-missing"}>
                    {g.ok ? "✓" : "✗"} {group}
                    {!g.ok && g.missing.length > 0 ? ` (${g.missing.join(", ")})` : ""}
                  </span>
                ))}
              </div>
            </section>
          )}

          {health?.services && (
            <section className="ui-card admin-feature-status__deploy">
              <h2>Services</h2>
              <ul>
                <li>Database: {health.services.database?.ok ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}</li>
                <li>
                  sharia_rulings: {health.services.database?.rulings_using_db ? <><CheckCircle2 size={13} className="inline text-green-600 ml-1" />DB</> : <XCircle size={13} className="inline text-red-500 ml-1" />} (
                  {health.services.database?.sharia_rulings_count ?? 0} rows, seed:{" "}
                  {health.services.database?.rulings_seed_available ?? 0})
                </li>
                <li>Supabase service role: {health.services.supabase?.serviceRole ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}</li>
                <li>Cron secrets: {health.services.cron?.ok ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}</li>
                <li>Assistant (Anthropic): {health.services.assistant?.anthropic ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}</li>
                <li>MKE: {health.services.mke?.ok ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}</li>
                <li>Automation: {health.services.automation?.ok ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}</li>
              </ul>
              {health.services.database?.tables && (
                <details>
                  <summary>Activation tables</summary>
                  <div className="admin-feature-status__env-grid">
                    {Object.entries(health.services.database.tables)
                      .filter(([t]) => !t.includes("__detail"))
                      .map(([t, ok]) => (
                      <span key={t} className={ok ? "env-ok" : "env-missing"}>
                        {ok ? "✓" : "✗"} {t}
                      </span>
                    ))}
                  </div>
                </details>
              )}
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
                    <th>الحالة</th>
                    <th>السبب</th>
                    <th>اختبار</th>
                  </tr>
                </thead>
                <tbody>
                  {features.map((f) => {
                    const api = featureById[f.id];
                    const delivery = api?.delivery || "Blocked";
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
                            <a key={r} href={`https://majlisilm.com${r}`} target="_blank" rel="noreferrer">
                              {r}
                            </a>
                          ))}
                        </td>
                        <td>{f.usesMock ? "نعم" : "لا"}</td>
                        <td>
                          <span className={deliveryClass(delivery)}>
                            {DELIVERY_LABEL[delivery] || delivery}
                          </span>
                        </td>
                        <td className="admin-feature-status__notes">
                          {api?.reason && (
                            <div>
                              {api.reason}: {api.detail}
                            </div>
                          )}
                        </td>
                        <td>
                          {f.routes?.[0] && (
                            <a
                              href={`https://majlisilm.com${f.routes[0]}`}
                              target="_blank" rel="noopener noreferrer"
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
                    {v.ok ? <CheckCircle2 size={13} className="inline text-green-600 ml-1" /> : <XCircle size={13} className="inline text-red-500 ml-1" />}{k}، HTTP {v.status}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {activateResult && (
            <section className="ui-card">
              <h2>نتيجة التفعيل</h2>
              <pre className="fsp-result-pre">{activateResult}</pre>
            </section>
          )}
        </>
      )}

      <p className="admin-feature-status__cli">
        CLI: <code>pnpm run verify:production-complete</code>
      </p>
    </div>
  );
}
