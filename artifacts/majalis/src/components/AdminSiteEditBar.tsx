import { useState, useEffect, useRef, useCallback } from "react";
import { Pencil, X, Check, ChevronDown, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

/* ── localStorage helpers ── */
const LS_PREFIX = "site_edit:";

function getOverrides(path: string): Record<string, string> {
  try {
    return JSON.parse(localStorage.getItem(LS_PREFIX + path) || "{}");
  } catch {
    return {};
  }
}

function setOverrides(path: string, data: Record<string, string>) {
  try {
    localStorage.setItem(LS_PREFIX + path, JSON.stringify(data));
  } catch { /* storage full */ }
}

function clearOverrides(path: string) {
  localStorage.removeItem(LS_PREFIX + path);
}

/* ── key for an element ──────────────────────────────────────────────────── */
function elemKey(el: HTMLElement): string {
  const tag = el.tagName.toLowerCase();
  const text = (el.textContent || "").trim().substring(0, 60);
  return `${tag}::${text}`;
}

/* ── apply overrides to DOM ─────────────────────────────────────────────── */
export function applyPageOverrides(path: string) {
  const overrides = getOverrides(path);
  if (!Object.keys(overrides).length) return;

  const SELECTOR =
    "p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th, label, span[data-editable], div[data-editable]";

  document.querySelectorAll<HTMLElement>(SELECTOR).forEach((el) => {
    // Skip elements inside admin UI
    if (el.closest(".ase-overlay, .ase-bar, .aie-overlay")) return;
    const key = elemKey(el);
    if (overrides[key]) {
      const orig = el.getAttribute("data-orig-text");
      if (!orig) el.setAttribute("data-orig-text", el.textContent || "");
      el.textContent = overrides[key];
    }
  });
}

/* ── Edit dialog ──────────────────────────────────────────────────────────── */
type EditDialogProps = {
  el: HTMLElement;
  path: string;
  onDone: () => void;
};

function EditDialog({ el, path, onDone }: EditDialogProps) {
  const [text, setText] = useState((el.getAttribute("data-orig-text") || el.textContent || "").trim());
  const ta = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { ta.current?.focus(); ta.current?.select(); }, []);

  const save = useCallback(() => {
    const newText = text.trim();
    const key = elemKey(el);
    const overrides = getOverrides(path);
    if (newText && newText !== (el.getAttribute("data-orig-text") || el.textContent || "").trim()) {
      overrides[key] = newText;
      setOverrides(path, overrides);
      el.textContent = newText;
    }
    onDone();
  }, [text, el, path, onDone]);

  const reset = useCallback(() => {
    const key = elemKey(el);
    const overrides = getOverrides(path);
    const orig = el.getAttribute("data-orig-text") || el.textContent || "";
    el.textContent = orig;
    delete overrides[key];
    setOverrides(path, overrides);
    onDone();
  }, [el, path, onDone]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onDone();
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") save();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onDone, save]);

  return (
    <div className="ase-overlay" onClick={(e) => { if (e.target === e.currentTarget) onDone(); }}>
      <div className="ase-dialog" dir="rtl">
        <div className="ase-dialog__head">
          <span className="ase-dialog__tag">{el.tagName.toLowerCase()}</span>
          <p className="ase-dialog__title">تعديل النص</p>
          <button className="ase-dialog__close" onClick={onDone} aria-label="إغلاق"><X size={14} /></button>
        </div>
        <textarea
          ref={ta}
          className="ase-dialog__ta"
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={Math.max(3, Math.ceil(text.length / 60))}
        />
        <p className="ase-dialog__hint">Ctrl+Enter للحفظ • Esc للإلغاء</p>
        <div className="ase-dialog__footer">
          <button className="ase-btn ase-btn--ghost" onClick={reset} title="استعادة النص الأصلي">
            <RefreshCw size={13} /> استعادة
          </button>
          <button className="ase-btn ase-btn--primary" onClick={save}>
            <Check size={14} /> حفظ
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Main Component ───────────────────────────────────────────────────────── */
export function AdminSiteEditBar() {
  const { isAdmin } = useAuth();
  const [editMode, setEditMode] = useState(false);
  const [editEl, setEditEl] = useState<HTMLElement | null>(null);
  const [editCount, setEditCount] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const path = window.location.pathname;

  /* apply overrides whenever path changes */
  useEffect(() => {
    if (!isAdmin) return;
    const check = () => applyPageOverrides(path);
    check();
    const ob = new MutationObserver(check);
    ob.observe(document.body, { childList: true, subtree: true });
    const id = setTimeout(check, 800);
    return () => { ob.disconnect(); clearTimeout(id); };
  }, [path, isAdmin]);

  /* refresh override count */
  useEffect(() => {
    if (!isAdmin) return;
    setEditCount(Object.keys(getOverrides(path)).length);
  }, [path, isAdmin, editEl]);

  /* enter / leave edit mode */
  useEffect(() => {
    if (!isAdmin) return;
    if (editMode) {
      document.body.classList.add("site-edit-mode");
    } else {
      document.body.classList.remove("site-edit-mode");
    }
    return () => document.body.classList.remove("site-edit-mode");
  }, [editMode, isAdmin]);

  /* click handler in edit mode */
  useEffect(() => {
    if (!editMode || !isAdmin) return;
    const handler = (e: MouseEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest(".ase-overlay, .ase-bar, .aie-overlay")) return;
      const TARGET = "p, h1, h2, h3, h4, h5, h6, li, blockquote, td, th";
      const matched = el.matches(TARGET) ? el : (el.closest(TARGET) as HTMLElement | null);
      if (!matched) return;
      e.preventDefault();
      e.stopPropagation();
      if (!matched.getAttribute("data-orig-text")) {
        matched.setAttribute("data-orig-text", matched.textContent || "");
      }
      setEditEl(matched);
    };
    document.addEventListener("click", handler, true);
    return () => document.removeEventListener("click", handler, true);
  }, [editMode, isAdmin]);

  const clearAll = useCallback(() => {
    clearOverrides(path);
    setEditCount(0);
    window.location.reload();
  }, [path]);

  if (!isAdmin) return null;

  return (
    <>
      {/* CSS injected inline — self-contained */}
      <style>{`
        /* Edit mode visual */
        body.site-edit-mode p,
        body.site-edit-mode h1,
        body.site-edit-mode h2,
        body.site-edit-mode h3,
        body.site-edit-mode h4,
        body.site-edit-mode h5,
        body.site-edit-mode h6,
        body.site-edit-mode li,
        body.site-edit-mode blockquote,
        body.site-edit-mode td,
        body.site-edit-mode th {
          outline: 1.5px dashed #176B57 !important;
          cursor: text !important;
          border-radius: 2px;
        }
        body.site-edit-mode p:hover,
        body.site-edit-mode h1:hover,
        body.site-edit-mode h2:hover,
        body.site-edit-mode h3:hover,
        body.site-edit-mode h4:hover,
        body.site-edit-mode h5:hover,
        body.site-edit-mode h6:hover,
        body.site-edit-mode li:hover,
        body.site-edit-mode blockquote:hover,
        body.site-edit-mode td:hover,
        body.site-edit-mode th:hover {
          background: rgba(31,77,58,0.06) !important;
          outline-color: #2d7a5a !important;
          outline-width: 2px !important;
        }
        /* Floating bar */
        .ase-bar {
          position: fixed;
          bottom: 90px;
          left: 1rem;
          z-index: 9990;
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          gap: 0.35rem;
          font-family: inherit;
        }
        .ase-bar__toggle {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.55rem 0.9rem;
          border-radius: 999px;
          font-size: 0.8rem;
          font-weight: 700;
          border: none;
          cursor: pointer;
          box-shadow: 0 2px 12px rgba(0,0,0,0.18);
          transition: background 0.2s;
        }
        .ase-bar__toggle--off {
          background: #176B57;
          color: #fff;
        }
        .ase-bar__toggle--on {
          background: #d32f2f;
          color: #fff;
        }
        .ase-bar__toggle--off:hover { background: #2d7a5a; }
        .ase-bar__toggle--on:hover  { background: #b71c1c; }
        .ase-bar__panel {
          background: #fff;
          border: 1px solid #e0e0e0;
          border-radius: 0.75rem;
          padding: 0.6rem 0.75rem;
          box-shadow: 0 4px 16px rgba(0,0,0,0.12);
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-width: 170px;
        }
        .ase-bar__info {
          font-size: 0.75rem;
          color: #555;
          line-height: 1.5;
        }
        .ase-bar__info strong { color: #176B57; }
        .ase-bar__clear {
          font-size: 0.72rem;
          color: #d32f2f;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          text-align: right;
        }
        .ase-bar__clear:hover { text-decoration: underline; }
        /* Edit mode banner */
        .ase-banner {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: 9991;
          background: #176B57;
          color: #fff;
          font-size: 0.82rem;
          text-align: center;
          padding: 0.35rem 1rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-family: inherit;
        }
        .ase-banner__tip { opacity: 0.85; }
        /* Overlay + dialog */
        .ase-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.45);
          z-index: 10001;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .ase-dialog {
          background: #fff;
          border-radius: 1rem;
          padding: 1.25rem;
          width: min(480px, 92vw);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          box-shadow: 0 8px 40px rgba(0,0,0,0.22);
        }
        .ase-dialog__head {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .ase-dialog__tag {
          background: #176B57;
          color: #fff;
          font-size: 0.65rem;
          font-weight: 700;
          padding: 0.2rem 0.5rem;
          border-radius: 999px;
          text-transform: uppercase;
        }
        .ase-dialog__title {
          flex: 1;
          font-weight: 700;
          font-size: 0.92rem;
          color: #1a1a1a;
          margin: 0;
        }
        .ase-dialog__close {
          background: none;
          border: none;
          cursor: pointer;
          color: #666;
          padding: 0.2rem;
          border-radius: 50%;
        }
        .ase-dialog__close:hover { background: #f0f0f0; color: #333; }
        .ase-dialog__ta {
          width: 100%;
          border: 1.5px solid #ccc;
          border-radius: 0.5rem;
          padding: 0.6rem 0.75rem;
          font-size: 0.9rem;
          line-height: 1.6;
          resize: vertical;
          font-family: inherit;
          direction: rtl;
          box-sizing: border-box;
        }
        .ase-dialog__ta:focus { outline: 2px solid #176B57; border-color: #176B57; }
        .ase-dialog__hint {
          font-size: 0.72rem;
          color: #888;
          margin: 0;
          text-align: left;
        }
        .ase-dialog__footer {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-start;
        }
        .ase-btn {
          display: flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          font-size: 0.83rem;
          font-weight: 600;
          cursor: pointer;
          border: none;
          transition: background 0.15s;
          font-family: inherit;
        }
        .ase-btn--primary { background: #176B57; color: #fff; }
        .ase-btn--primary:hover { background: #2d7a5a; }
        .ase-btn--ghost { background: #f5f5f5; color: #333; }
        .ase-btn--ghost:hover { background: #e8e8e8; }
      `}</style>

      {/* Banner when edit mode is on */}
      {editMode && (
        <div className="ase-banner" role="alert">
          <Pencil size={13} />
          <span>وضع التحرير نشط — انقر على أي نص لتعديله</span>
          <span className="ase-banner__tip">| التعديلات محفوظة محلياً في هذا المتصفح</span>
        </div>
      )}

      {/* Floating bar */}
      <div className="ase-bar" dir="rtl" aria-label="أدوات تحرير الموقع للمشرف">
        {expanded && !editMode && (
          <div className="ase-bar__panel">
            <p className="ase-bar__info">
              وضع تحرير الصفحة يتيح لك النقر على أي نص وتعديله مباشرة.<br />
              {editCount > 0 ? (
                <><strong>{editCount} تعديل</strong> محفوظ في هذه الصفحة</>
              ) : "لا توجد تعديلات محفوظة"}
            </p>
            {editCount > 0 && (
              <button className="ase-bar__clear" onClick={clearAll}>
                <RefreshCw size={11} style={{ display: "inline", marginLeft: 3 }} />
                استعادة النصوص الأصلية
              </button>
            )}
          </div>
        )}

        <div style={{ display: "flex", gap: "0.4rem" }}>
          {!editMode && (
            <button
              className="ase-bar__toggle ase-bar__toggle--off"
              onClick={() => { setExpanded((v) => !v); }}
              title="أدوات المشرف"
            >
              <Pencil size={13} />
              مشرف
              <ChevronDown size={12} style={{ transform: expanded ? "rotate(180deg)" : undefined, transition: "transform 0.2s" }} />
            </button>
          )}
          <button
            className={`ase-bar__toggle ${editMode ? "ase-bar__toggle--on" : "ase-bar__toggle--off"}`}
            onClick={() => { setEditMode((v) => !v); setExpanded(false); }}
            title={editMode ? "إيقاف وضع التحرير" : "تفعيل وضع تحرير الصفحة"}
          >
            {editMode ? <><X size={13} /> إيقاف التحرير</> : <><Pencil size={13} /> تحرير الصفحة</>}
          </button>
        </div>
      </div>

      {/* Edit dialog */}
      {editEl && (
        <EditDialog
          el={editEl}
          path={path}
          onDone={() => {
            setEditEl(null);
            setEditCount(Object.keys(getOverrides(path)).length);
          }}
        />
      )}
    </>
  );
}
