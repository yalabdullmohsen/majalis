import { useEffect, useState } from "react";

interface BulkImportProps {
  title: string;
  template: any[];
  hint?: string;
  importRow: (row: any) => Promise<any>;
  onDone: () => void;
}

export function BulkImport({ title, template, hint, importRow, onDone }: BulkImportProps) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [result, setResult] = useState<{ ok: number; fail: number; errors: string[] } | null>(null);

  const reset = () => { setText(""); setRunning(false); setProgress({ done: 0, total: 0 }); setResult(null); };
  const close = () => { setOpen(false); reset(); };
  const fillTemplate = () => setText(JSON.stringify(template, null, 2));

  useEffect(() => {
    if (!open) return;
    const keyHandler = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    document.addEventListener("keydown", keyHandler);
    return () => document.removeEventListener("keydown", keyHandler);
  }, [open, close]);

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
      <button type="button" onClick={() => setOpen(true)} className="blk-trigger-btn">⇪ استيراد جماعي</button>

      {open && (
        // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
        // مساران بديلان كاملان بلوحة المفاتيح.
        // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions
        <div className="adm-modal__overlay" onClick={close}>
          {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
          <div className="blk-dialog" onClick={e => e.stopPropagation()}>
            <div className="blk-header">
              <button type="button" onClick={close} className="blk-close" aria-label="إغلاق">×</button>
              <h2 className="blk-title">{title}</h2>
            </div>

            <div className="blk-body">
              <p className="blk-desc">
                الصق قائمة بصيغة <strong>JSON</strong> (مصفوفة من العناصر) لإضافة عدة سجلات دفعة واحدة. كل عنصر يصبح سجلًا جديدًا.
                {hint ? ` ${hint}` : ""}
              </p>
              <div className="blk-tool-row">
                <button type="button" onClick={fillTemplate} className="blk-tmpl-btn">إدراج نموذج جاهز</button>
                <button type="button" onClick={() => setText("")} className="blk-clear-btn">مسح</button>
              </div>
              <textarea
                className="blk-mono-textarea"
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={JSON.stringify(template, null, 2)}
                spellCheck={false}
                disabled={running}
              />

              {running && (
                <div className="blk-progress">
                  <div className="blk-progress__track">
                    <div
                      className="blk-progress__fill"
                      style={{ "--blk-pct": `${progress.total ? (progress.done / progress.total) * 100 : 0}%` } as React.CSSProperties}
                    />
                  </div>
                  <p className="blk-progress__text">جارٍ الاستيراد… {progress.done} / {progress.total}</p>
                </div>
              )}

              {result && (
                <div className={`blk-result${result.fail > 0 ? " blk-result--fail" : " blk-result--ok"}`}>
                  <p className="blk-result__text">
                    تم استيراد {result.ok} سجلًا بنجاح{result.fail > 0 ? ` · فشل ${result.fail}` : ""}
                  </p>
                  {result.errors.length > 0 && (
                    <ul className="blk-result__errors">
                      {result.errors.map((er, i) => <li key={i} className="blk-result__err-item">{er}</li>)}
                    </ul>
                  )}
                </div>
              )}
            </div>

            <div className="blk-footer">
              <button type="button" onClick={run} disabled={running || !text.trim()} className="blk-run-btn">
                {running ? "جارٍ الاستيراد…" : "بدء الاستيراد"}
              </button>
              <button type="button" onClick={close} disabled={running} className="blk-cancel-btn">
                {result ? "إغلاق" : "إلغاء"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
