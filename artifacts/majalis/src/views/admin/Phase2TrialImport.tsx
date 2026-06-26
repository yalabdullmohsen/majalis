import { useState } from "react";
import { adminFetch } from "@/lib/admin-api";
import { C } from "@/lib/theme";

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

const BTN: React.CSSProperties = {
  padding: "0.5rem 1.1rem",
  borderRadius: "0.375rem",
  border: `1px solid ${C.emeraldDeep}`,
  background: C.emeraldDeep,
  color: C.parchment,
  cursor: "pointer",
  fontFamily: "inherit",
  fontSize: "0.875rem",
  fontWeight: 600,
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
      <button type="button" onClick={() => setOpen(true)} style={BTN}>
        استيراد تجريبي Phase 2
      </button>

      {open && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(36,31,24,0.6)",
            zIndex: 1000,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "1rem",
          }}
          onClick={close}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "40rem",
              maxHeight: "92vh",
              overflowY: "auto",
              background: C.parchment,
              borderRadius: "0.5rem",
              border: `1px solid ${C.line}`,
              padding: "1.25rem",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ margin: "0 0 0.5rem", fontSize: "1.0625rem", color: C.emeraldDeep }}>
              استيراد تجريبي Phase 2
            </h2>
            <p style={{ margin: "0 0 1rem", fontSize: "0.85rem", color: C.inkSoft, lineHeight: 1.8 }}>
              يستورد ملفات <code style={{ direction: "ltr" }}>data/imports/trial/*.phase2.json</code> إلى Supabase
              (sheikhs → lessons → questions → books).
            </p>

            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
              <button type="button" disabled={running} onClick={() => run(false)} style={BTN}>
                {running ? "جارٍ الاستيراد…" : "تنفيذ الاستيراد الحقيقي"}
              </button>
              <button
                type="button"
                disabled={running}
                onClick={() => run(true)}
                style={{ ...BTN, background: C.panel, color: C.emeraldDeep, border: `1px solid ${C.emerald}` }}
              >
                معاينة (dry-run)
              </button>
              <button
                type="button"
                disabled={running}
                onClick={close}
                style={{ ...BTN, background: C.panel, color: C.inkSoft, border: `1px solid ${C.line}` }}
              >
                إغلاق
              </button>
            </div>

            {error && (
              <p style={{ color: "#92400E", fontSize: "0.875rem", margin: "0 0 0.75rem" }}>{error}</p>
            )}

            {result && (
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "0.375rem",
                  background: result.ok ? "#D1FAE5" : "#FEF3C7",
                  border: `1px solid ${C.line}`,
                  fontSize: "0.875rem",
                }}
              >
                <p style={{ margin: 0, fontWeight: 700 }}>
                  {result.ok ? "✓ اكتمل بنجاح" : "✗ اكتمل مع أخطاء"}
                  {result.dryRun ? " (معاينة فقط)" : ""}
                </p>
                {result.totals && (
                  <p style={{ margin: "0.5rem 0 0" }}>
                    مستورد: {result.totals.imported} · متكرر/متخطى: {result.totals.skipped} · فاشل:{" "}
                    {result.totals.failed} · مرفوض (تحقق): {result.totals.invalid}
                  </p>
                )}

                {(result.reports || []).map((row) => (
                  <div key={row.type} style={{ marginTop: "0.75rem", paddingTop: "0.75rem", borderTop: `1px solid ${C.line}` }}>
                    <strong>{row.label}</strong>
                    <span style={{ color: C.inkSoft, fontSize: "0.8125rem" }}>
                      {" "}
                      — استورد {row.report.stats?.imported ?? 0} · تخطى {row.report.stats?.skipped ?? 0} · فشل{" "}
                      {row.report.stats?.failed ?? 0}
                    </span>
                    {[...(row.report.validationErrors || []), ...(row.report.importErrors || [])].map((msg) => (
                      <p key={msg} style={{ margin: "0.25rem 0 0", color: "#92400E", fontSize: "0.8125rem" }}>
                        • {msg}
                      </p>
                    ))}
                    <a
                      href={`${SITE}${row.verifyPath}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ display: "inline-block", marginTop: "0.35rem", fontSize: "0.8125rem", color: C.emeraldDeep }}
                    >
                      فحص {row.label} على الموقع ↗
                    </a>
                  </div>
                ))}

                {result.verifyLinks && result.verifyLinks.length > 0 && (
                  <div style={{ marginTop: "0.875rem" }}>
                    <p style={{ margin: "0 0 0.35rem", fontWeight: 600 }}>روابط التحقق:</p>
                    <ul style={{ margin: 0, paddingInlineStart: "1.1rem", lineHeight: 1.9 }}>
                      {result.verifyLinks.map((link) => (
                        <li key={link.path}>
                          <a href={`${SITE}${link.path}`} target="_blank" rel="noopener noreferrer" style={{ color: C.emeraldDeep }}>
                            {link.label}
                          </a>
                          {link.search && (
                            <>
                              {" · "}
                              <a
                                href={`${SITE}/search?q=${encodeURIComponent(link.search)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                style={{ color: C.emeraldDeep }}
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
