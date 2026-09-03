import { useEffect, useState } from "react";
import { Link } from "wouter";
import { AdminRouteGuard } from "@/components/AdminRouteGuard";
import { adminFetch } from "@/lib/admin-api";

type StatusPayload = {
  ok?: boolean;
  at?: string;
  productionUrl?: string;
  version?: { commit?: string; shortCommit?: string; builtAt?: string };
  healthz?: { status?: number; ok?: boolean };
  readyz?: { status?: number; ok?: boolean };
  search?: { ok?: boolean; terms?: Array<{ term: string; ok: boolean; total: number }> };
  sitemap?: { ok?: boolean; status?: number };
  pwa?: { manifestOk?: boolean; status?: number };
  errors24h?: { count?: number | null; source?: string };
  lastProductionAudit?: { ok?: boolean; at?: string; failures?: string[] };
};

function StatusRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <tr>
      <th scope="row">{label}</th>
      <td>{value}</td>
      <td>{ok === undefined ? "—" : ok ? "✓" : "✗"}</td>
    </tr>
  );
}

function InternalStatusView() {
  const [data, setData] = useState<StatusPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = "حالة المنصة — داخلي";
    let robots = document.querySelector('meta[name="robots"]');
    if (!robots) {
      robots = document.createElement("meta");
      robots.setAttribute("name", "robots");
      document.head.appendChild(robots);
    }
    robots.setAttribute("content", "noindex, nofollow");
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await adminFetch("/api/internal/status");
        const json = (await res.json()) as StatusPayload;
        if (!cancelled) setData(json);
      } catch (err) {
        if (!cancelled) setError(String(err instanceof Error ? err.message : err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="login-page" role="status">
        <div className="login-card">
          <p className="ds-empty">جارٍ تحميل حالة المنصة…</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="login-page">
        <div className="login-card login-card--denied">
          <h1 className="access-denied__title">تعذّر تحميل الحالة</h1>
          <p className="access-denied__body">{error}</p>
          <Link href="/admin" className="login-back-link">
            العودة للوحة التحكم
          </Link>
        </div>
      </div>
    );
  }

  const version = data?.version;
  const audit = data?.lastProductionAudit;

  return (
    <main className="page-shell page-shell--narrow" dir="rtl" lang="ar" data-nosnippet>
      <header className="page-shell__head">
        <h1 className="page-shell__title">حالة المنصة (داخلي)</h1>
        <p className="page-shell__lead">
          ملخص مراقبة الإنتاج — noindex — آخر تحديث: {data?.at || "—"}
        </p>
      </header>

      <table className="ds-table" aria-label="حالة المنصة">
        <tbody>
          <StatusRow
            label="آخر نسخة"
            value={version?.shortCommit || version?.commit || "—"}
            ok={Boolean(version?.commit)}
          />
          <StatusRow label="وقت البناء" value={version?.builtAt || "—"} />
          <StatusRow
            label="healthz"
            value={String(data?.healthz?.status ?? "—")}
            ok={data?.healthz?.ok}
          />
          <StatusRow
            label="readyz"
            value={String(data?.readyz?.status ?? "—")}
            ok={data?.readyz?.ok}
          />
          <StatusRow
            label="آخر production audit"
            value={audit?.at || "لم يُشغَّل بعد"}
            ok={audit?.ok}
          />
          <StatusRow
            label="أخطاء 24 ساعة"
            value={
              data?.errors24h?.count != null
                ? String(data.errors24h.count)
                : `غير متاح (${data?.errors24h?.source || "?"})`
            }
          />
          <StatusRow label="حالة البحث" value={data?.search?.ok ? "سليم" : "فشل"} ok={data?.search?.ok} />
          <StatusRow label="حالة sitemap" value={String(data?.sitemap?.status ?? "—")} ok={data?.sitemap?.ok} />
          <StatusRow label="حالة PWA" value={data?.pwa?.manifestOk ? "manifest OK" : "تحقق"} ok={data?.pwa?.manifestOk} />
        </tbody>
      </table>

      {audit?.failures?.length ? (
        <section className="ui-card" aria-label="فشل audit">
          <h2 className="ui-card__title">فشل آخر audit</h2>
          <ul>
            {audit.failures.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {data?.search?.terms?.length ? (
        <section className="ui-card" aria-label="كلمات البحث">
          <h2 className="ui-card__title">كلمات البحث الأساسية</h2>
          <ul>
            {data.search.terms.map((t) => (
              <li key={t.term}>
                {t.term}: {t.total} {t.ok ? "✓" : "✗"}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <p className="page-shell__foot">
        <Link href="/admin/feature-status">لوحة الميزات</Link>
        {" · "}
        <Link href="/admin">لوحة التحكم</Link>
      </p>
    </main>
  );
}

export default function InternalStatusPage() {
  return (
    <AdminRouteGuard>
      <InternalStatusView />
    </AdminRouteGuard>
  );
}
