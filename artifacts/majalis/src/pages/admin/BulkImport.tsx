import { useState } from "react";
import { C } from "@/lib/theme";

interface BulkImportProps {
  title: string;
  template: any[];
  hint?: string;
  importRow: (row: any) => Promise<any>;
  onDone: () => void;
}

const BTN_IMPORT: React.CSSProperties = {
  padding: "0.5rem 1.1rem", borderRadius: "0.375rem",
  border: `1px solid ${C.emerald}`, background: C.panel, color: C.emeraldDeep,
  cursor: "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600,
};

const monoTextarea: React.CSSProperties = {
  width: "100%", boxSizing: "border-box", minHeight: "16rem", resize: "vertical",
  padding: "0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`,
  background: "#fffdf8", color: C.ink, fontSize: "0.8125rem", lineHeight: 1.6,
  fontFamily: "ui-monospace, 'SF Mono', Menlo, monospace", direction: "ltr", textAlign: "left",
  outline: "none",
};

export function BulkImport({ title, template, hint, importRow, onDone }: BulkImportProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);

  const reset = () => { setText(""); setRunning(false); setProgress({ done: 0, total: 0 }); setResult(null); };
  const close = () => { setOpen(false); reset(); };
  const fillTemplate = () => setText(JSON.stringify(template, null, 2));

  const run = async () => {
    let rows: any[];
    try {
      const parsed = JSON.parse(text);
      rows = Array.isArray(parsed) ? parsed : [parsed];
    } catch (e: any) {
      setResult({ ok: 0, fail: 0, errors: [`صيغة JSON غير صحيحة: ${e.message}`] });
      return;
    }
    if (rows.length === 0) {
      setResult({ ok: 0, fail: 0, errors: ["لا توجد عناصر للاستيراد"] });
      return;
    }
    setRunning(true);
    setResult(null);
    setProgress({ done: 0, total: rows.length });
    let ok = 0, fail = 0;
    const errors: string[] = [];
    for (let i = 0; i < rows.length; i++) {
      try {
        const res = await importRow(rows[i]);
        if (res && res.error) { fail++; errors.push(`السطر ${i + 1}: ${res.error.message}`); }
        else ok++;
      } catch (e: any) {
        fail++; errors.push(`السطر ${i + 1}: ${e?.message || e}`);
      }
      setProgress({ done: i + 1, total: rows.length });
    }
    setRunning(false);
    setResult({ ok, fail, errors });
    if (ok > 0) onDone();
  };

  return (
    <>
      <button onClick={() => setOpen(true)} style={BTN_IMPORT}>⇪ استيراد جماعي</button>

      {open && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(36,31,24,0.6)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}
          onClick={close}
        >
          <div
            style={{ width: "100%", maxWidth: "44rem", background: C.parchment, borderRadius: "0.5rem", border: `1px solid ${C.line}`, maxHeight: "92vh", display: "flex", flexDirection: "column", boxShadow: "0 8px 32px rgba(0,0,0,0.2)" }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ padding: "1rem 1.25rem", borderBottom: `1px solid ${C.line}`, display: "flex", justifyContent: "space-between", alignItems: "center", flexShrink: 0 }}>
              <button onClick={close} style={{ background: "none", border: "none", cursor: "pointer", color: C.inkSoft, fontSize: "1.25rem", lineHeight: 1, padding: "0.25rem 0.5rem" }}>✕</button>
              <h2 style={{ margin: 0, fontSize: "1.0625rem", fontWeight: 700, color: C.emeraldDeep }}>{title}</h2>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "1.25rem" }}>
              <p style={{ margin: "0 0 0.5rem", fontSize: "0.85rem", color: C.inkSoft, lineHeight: 1.8 }}>
                الصق قائمة بصيغة <strong>JSON</strong> (مصفوفة من العناصر) لإضافة عدة سجلات دفعة واحدة. كل عنصر يصبح سجلًا جديدًا.
                {hint ? ` ${hint}` : ""}
              </p>
              <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.625rem", flexWrap: "wrap" }}>
                <button onClick={fillTemplate} style={{ ...BTN_IMPORT, fontSize: "0.8125rem", padding: "0.3rem 0.75rem" }}>
                  إدراج نموذج جاهز
                </button>
                <button onClick={() => setText("")} style={{ fontSize: "0.8125rem", padding: "0.3rem 0.75rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, color: C.inkSoft, cursor: "pointer", fontFamily: "inherit" }}>
                  مسح
                </button>
              </div>
              <textarea
                style={monoTextarea}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={JSON.stringify(template, null, 2)}
                spellCheck={false}
                disabled={running}
              />

              {running && (
                <div style={{ marginTop: "0.875rem" }}>
                  <div style={{ height: "0.5rem", borderRadius: "999px", background: C.parchmentDeep, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${progress.total ? (progress.done / progress.total) * 100 : 0}%`, background: C.emerald, transition: "width 0.15s" }} />
                  </div>
                  <p style={{ margin: "0.375rem 0 0", fontSize: "0.8125rem", color: C.inkSoft }}>جارٍ الاستيراد… {progress.done} / {progress.total}</p>
                </div>
              )}

              {result && (
                <div style={{ marginTop: "0.875rem", padding: "0.875rem 1rem", borderRadius: "0.375rem", background: result.fail > 0 ? "#FEF3C7" : "#D1FAE5", border: `1px solid ${C.line}` }}>
                  <p style={{ margin: 0, fontSize: "0.875rem", fontWeight: 600, color: result.fail > 0 ? "#92400E" : C.emeraldDeep }}>
                    تم استيراد {result.ok} سجلًا بنجاح{result.fail > 0 ? ` · فشل ${result.fail}` : ""}
                  </p>
                  {result.errors.length > 0 && (
                    <ul style={{ margin: "0.5rem 0 0", paddingInlineStart: "1.1rem", fontSize: "0.8125rem", color: "#92400E", maxHeight: "8rem", overflowY: "auto" }}>
                      {result.errors.map((er, i) => <li key={i} style={{ marginBottom: "0.2rem" }}>{er}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div style={{ padding: "0.875rem 1.25rem", borderTop: `1px solid ${C.line}`, display: "flex", gap: "0.625rem", justifyContent: "flex-start", flexShrink: 0 }}>
              <button
                onClick={run}
                disabled={running || !text.trim()}
                style={{ padding: "0.5rem 1.5rem", borderRadius: "0.375rem", border: "none", background: running || !text.trim() ? C.sage : C.emerald, color: C.parchment, cursor: running || !text.trim() ? "default" : "pointer", fontFamily: "inherit", fontSize: "0.875rem", fontWeight: 600 }}
              >
                {running ? "جارٍ الاستيراد…" : "بدء الاستيراد"}
              </button>
              <button onClick={close} disabled={running} style={{ padding: "0.5rem 1.25rem", borderRadius: "0.375rem", border: `1px solid ${C.line}`, background: C.panel, color: C.inkSoft, cursor: running ? "default" : "pointer", fontFamily: "inherit", fontSize: "0.875rem" }}>
                {result ? "إغلاق" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
