"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/mushaf.css";

const PDF_URL  = "/quran.pdf";
const PAGE_KEY = "mj-mushaf-page-v2";
const TOTAL    = 600;

function lsGet(k: string, fb: number) {
  try { const v = localStorage.getItem(k); return v ? +JSON.parse(v) : fb; } catch { return fb; }
}
function lsSet(k: string, v: number) {
  try { localStorage.setItem(k, String(v)); } catch { /* ignore */ }
}

function Star({ cls }: { cls?: string }) {
  return (
    <svg className={cls} viewBox="0 0 32 32" aria-hidden="true">
      <path d="M16 2 L18.5 10 L26 8 L23 15.5 L30 16 L23 16.5 L26 24 L18.5 22 L16 30 L13.5 22 L6 24 L9 16.5 L2 16 L9 15.5 L6 8 L13.5 10 Z"
        fill="none" stroke="rgba(106,181,142,0.65)" strokeWidth="1" strokeLinejoin="round" />
    </svg>
  );
}

export default function QuranPage() {
  const [page, setPage]           = useState(() => Math.min(lsGet(PAGE_KEY, 1), TOTAL));
  const [pdfDoc, setPdfDoc]       = useState<any>(null);
  const [rendering, setRendering] = useState(true);
  const [loadErr, setLoadErr]     = useState(false);
  const [uiOn, setUiOn]           = useState(true);
  // تحرير رقم الصفحة مباشرة في الـ footer
  const [editingPage, setEditingPage] = useState(false);
  const [editVal, setEditVal]     = useState("");

  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const frameRef   = useRef<HTMLDivElement>(null);
  const taskRef    = useRef<any>(null);
  const uiTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchRef   = useRef<{ x: number; y: number } | null>(null);
  const pageInputRef = useRef<HTMLInputElement>(null);

  /* ── تحميل PDF.js ── */
  useEffect(() => {
    let dead = false;
    const url = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";
    (async () => {
      try {
        const lib: any = await import(/* @vite-ignore */ url);
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";
        const doc = await lib.getDocument(PDF_URL).promise;
        if (!dead) setPdfDoc(doc);
      } catch (e) {
        console.error(e);
        if (!dead) setLoadErr(true);
      }
    })();
    return () => { dead = true; };
  }, []);

  /* ── رسم الصفحة ── */
  const draw = useCallback(async (doc: any, p: number) => {
    if (!doc || !canvasRef.current || !frameRef.current) return;
    if (taskRef.current) { try { taskRef.current.cancel(); } catch { /* ignore */ } taskRef.current = null; }
    setRendering(true);
    try {
      const pg  = await doc.getPage(p);
      const cvs = canvasRef.current;
      const fr  = frameRef.current;
      const dpr = Math.min(window.devicePixelRatio || 1, 3);
      const vp0 = pg.getViewport({ scale: 1 });
      const sc  = Math.min((fr.clientWidth * dpr) / vp0.width, (fr.clientHeight * dpr) / vp0.height) * 0.97;
      const vp  = pg.getViewport({ scale: sc });
      cvs.width  = vp.width;
      cvs.height = vp.height;
      cvs.style.width  = `${vp.width  / dpr}px`;
      cvs.style.height = `${vp.height / dpr}px`;
      const ctx = cvs.getContext("2d")!;
      ctx.fillStyle = "#F9F3E8";
      ctx.fillRect(0, 0, cvs.width, cvs.height);
      const t = pg.render({ canvasContext: ctx, viewport: vp });
      taskRef.current = t;
      await t.promise;
      taskRef.current = null;
      setRendering(false);
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") setRendering(false);
    }
  }, []);

  useEffect(() => { if (pdfDoc) draw(pdfDoc, page); }, [pdfDoc, page, draw]);

  /* ── مؤقت الـ UI ── */
  const bump = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setUiOn(true);
    uiTimer.current = setTimeout(() => setUiOn(false), 3200);
  }, []);

  useEffect(() => { bump(); return () => { if (uiTimer.current) clearTimeout(uiTimer.current); }; }, [page, bump]);

  /* ── لوحة المفاتيح ── */
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (editingPage) return;
      if (e.key === "ArrowLeft")  go(page + 1);
      else if (e.key === "ArrowRight") go(page - 1);
      else if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, editingPage]);

  const go = (n: number) => {
    const p = Math.max(1, Math.min(TOTAL, n));
    setPage(p); lsSet(PAGE_KEY, p); bump();
  };

  /* ── اللمس ── */
  const onTS = (e: React.TouchEvent) => {
    touchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTE = (e: React.TouchEvent) => {
    if (!touchRef.current) return;
    const dx = e.changedTouches[0].clientX - touchRef.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchRef.current.y);
    touchRef.current = null;
    if (dy > 60 || Math.abs(dx) < 35) { bump(); return; }
    go(dx < 0 ? page + 1 : page - 1);
  };

  /* النقر على مناطق الصفحة */
  const onFrameClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (editingPage) return;
    const { clientX, currentTarget } = e;
    const w = currentTarget.clientWidth;
    const zone = clientX / w;
    if (zone < 0.35)      go(page + 1);   // يسار → التالية (RTL)
    else if (zone > 0.65) go(page - 1);   // يمين → السابقة
    else bump();                           // وسط → يُظهر الـ UI
  };

  /* تحرير رقم الصفحة */
  const startEdit = () => {
    setEditingPage(true);
    setEditVal(String(page));
    bump();
    setTimeout(() => pageInputRef.current?.select(), 30);
  };
  const commitEdit = () => {
    const n = parseInt(editVal, 10);
    if (!isNaN(n)) go(n);
    setEditingPage(false);
  };

  return (
    <div className="mshf-shell" dir="rtl">

      {/* ══ شريط علوي ══ */}
      <header className={`mshf-top${uiOn ? " on" : ""}`}>
        <button className="mshf-back" onClick={() => window.history.back()} aria-label="رجوع">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>
        <div className="mshf-title-wrap">
          <Star cls="mshf-star" />
          <span className="mshf-title">المصحف الشريف</span>
          <Star cls="mshf-star" />
        </div>
        <div className="mshf-top__right" />
      </header>

      {/* ══ منطقة الصفحة ══ */}
      <div
        ref={frameRef}
        className="mshf-frame"
        onTouchStart={onTS}
        onTouchEnd={onTE}
        onClick={onFrameClick}
      >
        {/* تحميل */}
        {rendering && !loadErr && (
          <div className="mshf-loading">
            <div className="mshf-spinner" />
            <span>{pdfDoc ? "جاري الرسم…" : "جاري تحميل المصحف…"}</span>
          </div>
        )}

        {/* خطأ */}
        {loadErr && (
          <div className="mshf-err">
            <div className="mshf-err__icon">⚠</div>
            <p>تعذّر تحميل المصحف</p>
            <button onClick={() => window.location.reload()} className="mshf-err__btn">إعادة المحاولة</button>
          </div>
        )}

        {/* canvas + إطار */}
        {!loadErr && (
          <div className="mshf-wrap">
            <Star cls="mshf-c mshf-c--tl" />
            <Star cls="mshf-c mshf-c--tr" />
            <Star cls="mshf-c mshf-c--bl" />
            <Star cls="mshf-c mshf-c--br" />
            <canvas
              ref={canvasRef}
              className={`mshf-canvas${!rendering ? " ready" : ""}`}
              aria-label={`صفحة ${page}`}
            />
          </div>
        )}

        {/* مناطق النقر (شفافة فوق الصورة) */}
        {!loadErr && !rendering && (
          <>
            <div className="mshf-tap mshf-tap--next" onClick={e => { e.stopPropagation(); go(page + 1); }} aria-label="التالية" />
            <div className="mshf-tap mshf-tap--prev" onClick={e => { e.stopPropagation(); go(page - 1); }} aria-label="السابقة" />
          </>
        )}
      </div>

      {/* ══ شريط سفلي ══ */}
      <footer className={`mshf-bot${uiOn ? " on" : ""}`}>
        <button className="mshf-nav" onClick={() => go(page - 1)} disabled={page <= 1}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M15 18l-6-6 6-6"/>
          </svg>
        </button>

        {/* رقم الصفحة — قابل للتحرير */}
        <div className="mshf-pgnum">
          {editingPage ? (
            <input
              ref={pageInputRef}
              className="mshf-pgnum__input"
              type="number"
              min={1}
              max={TOTAL}
              value={editVal}
              onChange={e => setEditVal(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={e => { if (e.key === "Enter") commitEdit(); if (e.key === "Escape") setEditingPage(false); }}
              onClick={e => e.stopPropagation()}
            />
          ) : (
            <button className="mshf-pgnum__btn" onClick={e => { e.stopPropagation(); startEdit(); }}>
              <span className="mshf-pgnum__cur">{page}</span>
              <span className="mshf-pgnum__sep">/</span>
              <span className="mshf-pgnum__tot">{TOTAL}</span>
            </button>
          )}
        </div>

        <button className="mshf-nav" onClick={() => go(page + 1)} disabled={page >= TOTAL}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </button>
      </footer>
    </div>
  );
}
