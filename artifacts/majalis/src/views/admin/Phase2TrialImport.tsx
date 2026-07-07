import { useState } from "react";
import { adminFetch } from "@/lib/admin-api";

const SITE = "https://majlisilm.com";

type TrialRow = {
  type: string;
  label: string;
  verifyPath: string;
  report: {
    ok: boolean;
    label?: string;
    stats?: {
      read: number;
      imported: number;
      skipped: number;
      failed: number;
      invalid: number;
    };
    validationErrors?: string[];
    importErrors?: string[];
  };
};

type Phase2Result = {
  ok: boolean;
  dryRun?: boolean;
  totals?: {
    read: number;
    imported: number;
    skipped: number;
    failed: number;
    invalid: number;
  };
  reports?: TrialRow[];
  verifyLinks?: Array<{ label: string; path: string; search: string | null }>;
  error?: string;
};

interface Phase2TrialImportProps {
  onDone?: () => void;
}

export function Phase2TrialImport({ onDone }: Phase2TrialImportProps) {
  const [open, setOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<Phase2Result | null>(null);
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    if (running) return;
    setOpen(false);
    setResult(null);
    setError(null);
  };

  const run = async (dryRun: boolean) => {
    setRunning(true);
    setError(null);
    setResult(null);
    try {
      let res = await adminFetch("/api/admin/content-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "phase2-trial", dryRun }),
      });
      if (res.status === 404) {
        res = await adminFetch("/api/cron/bootstrap-database?action=phase2-trial-import", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ dryRun }),
        });
      }
      const json = await res.json();
      if (!res.ok && !json.reports) {
        setError(json.error || `HTTP ${res.status}`);
        return;
      }
      setResult(json as Phase2Result);
      if (json.ok && !dryRun && (json.totals?.imported ?? 0) > 0) onDone?.();
    } catch (e) {
      setError(String((e as Error).message || e));
    } finally {
      setRunning(false);
    }
  };

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="p2t-btn">
        استيراد تجريبي Phase 2
      </button>

      {open && (
        <div className="adm-modal__overlay" onClick={close}>
          <div className="p2t-dialog" onClick={(e) => e.stopPropagation()}>
            <h2 className="p2t-title">استيراد تجريبي Phase 2</h2>
            <p className="p2t-desc">
              يستورد ملفات <code className="p2t-code">data/imports/trial/*.phase2.json</code> إلى Supabase
              (sheikhs → lessons → questions → books).
            </p>

            <div className="p2t-btn-row">
              <button type="button" disabled={running} onClick={() => run(false)} className="p2t-btn">
                {running ? "جارٍ الاستيراد…" : "تنفيذ الاستيراد الحقيقي"}
              </button>
              <button type="button" disabled={running} onClick={() => run(true)} className="p2t-btn p2t-btn--outline">
                معاينة (dry-run)
              </button>
              <button type="button" disabled={running} onClick={close} className="p2t-btn p2t-btn--ghost">
                إغلاق
              </button>
            </div>

            {error && <p className="p2t-error">{error}</p>}

            {result && (
              <div className={`p2t-result${result.ok ? " p2t-result--ok" : " p2t-result--fail"}`}>
                <p className="p2t-result__hd">
                  {result.ok ? "✓ اكتمل بنجاح" : "✗ اكتمل مع أخطاء"}
                  {result.dryRun ? " (معاينة فقط)" : ""}
                </p>
                {result.totals && (
                  <p className="p2t-result__totals">
                    مستورد: {result.totals.imported} · متكرر/متخطى: {result.totals.skipped} · فاشل:{" "}
                    {result.totals.failed} · مرفوض (تحقق): {result.totals.invalid}
                  </p>
                )}

                {(result.reports || []).map((row) => (
                  <div key={row.type} className="p2t-report-row">
                    <strong>{row.label}</strong>
                    <span className="p2t-report__muted">
                      {" "}
                      — استورد {row.report.stats?.imported ?? 0} · تخطى {row.report.stats?.skipped ?? 0} · فشل{" "}
                      {row.report.stats?.failed ?? 0}
                    </span>
                    {[...(row.report.validationErrors || []), ...(row.report.importErrors || [])].map((msg) => (
                      <p key={msg} className="p2t-report__err">• {msg}</p>
                    ))}
                    <a
                      href={`${SITE}${row.verifyPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p2t-verify-link"
                    >
                      فحص {row.label} على الموقع ↗
                    </a>
                  </div>
                ))}

                {result.verifyLinks && result.verifyLinks.length > 0 && (
                  <div className="p2t-verify">
                    <p className="p2t-verify__hd">روابط التحقق:</p>
                    <ul className="p2t-verify__ul">
                      {result.verifyLinks.map((link) => (
                        <li key={link.path}>
                          <a href={`${SITE}${link.path}`} target="_blank" rel="noopener noreferrer" className="p2t-verify__a">
                            {link.label}
                          </a>
                          {link.search && (
                            <>
                              {" · "}
                              <a
                                href={`${SITE}/search?q=${encodeURIComponent(link.search)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p2t-verify__a"
                              >
                                بحث «{link.search}»
                              </a>
                            </>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
