"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/mushaf.css";

const PDF_URL = "/quran.pdf";
const PAGE_KEY = "mj-mushaf-page-v2";

function lsGet(key: string, fallback: number): number {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: number) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

function Star({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
      <path
        d="M16 2 L18.5 10 L26 8 L23 15.5 L30 16 L23 16.5 L26 24 L18.5 22 L16 30 L13.5 22 L6 24 L9 16.5 L2 16 L9 15.5 L6 8 L13.5 10 Z"
        fill="none" stroke="rgba(106,181,142,0.7)" strokeWidth="1" strokeLinejoin="round"
      />
    </svg>
  );
}

export default function QuranPage() {
  const [page, setPage]         = useState(() => lsGet(PAGE_KEY, 1));
  const [total, setTotal]       = useState(604);
  const [pdfDoc, setPdfDoc]     = useState<any>(null);
  const [rendering, setRendering] = useState(true);
  const [loadErr, setLoadErr]   = useState(false);
  const [showUI, setShowUI]     = useState(true);
  const [showJump, setShowJump] = useState(false);
  const [jumpVal, setJumpVal]   = useState("");

  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const frameRef     = useRef<HTMLDivElement>(null);
  const renderTask   = useRef<any>(null);
  const uiTimer      = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart   = useRef<{ x: number; y: number } | null>(null);

  // ── تحميل PDF.js والملف ──────────────────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    const cdnUrl = "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs";

    (async () => {
      try {
        const lib: any = await import(/* @vite-ignore */ cdnUrl);
        lib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

        const doc = await lib.getDocument(PDF_URL).promise;
        if (cancelled) return;
        setTotal(doc.numPages);
        setPdfDoc(doc);          // ← state يُشغّل re-render وrenderPage
      } catch (err) {
        console.error("PDF load error:", err);
        if (!cancelled) setLoadErr(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // ── رسم الصفحة ───────────────────────────────────────────────────────────────
  const renderPage = useCallback(async (doc: any, pageNum: number) => {
    if (!doc || !canvasRef.current || !frameRef.current) return;

    // إلغاء أي render سابق
    if (renderTask.current) {
      try { renderTask.current.cancel(); } catch { /* ignore */ }
      renderTask.current = null;
    }

    setRendering(true);
    try {
      const pdfPage = await doc.getPage(pageNum);
      const canvas  = canvasRef.current;
      const frame   = frameRef.current;
      const dpr     = Math.min(window.devicePixelRatio || 1, 2);

      const vp0    = pdfPage.getViewport({ scale: 1 });
      const scaleW = (frame.clientWidth  * dpr) / vp0.width;
      const scaleH = (frame.clientHeight * dpr) / vp0.height;
      const scale  = Math.min(scaleW, scaleH) * 0.94; // هامش بسيط للإطار
      const vp     = pdfPage.getViewport({ scale });

      canvas.width  = vp.width;
      canvas.height = vp.height;
      canvas.style.width  = `${vp.width  / dpr}px`;
      canvas.style.height = `${vp.height / dpr}px`;

      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#F8F3E6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const task = pdfPage.render({ canvasContext: ctx, viewport: vp });
      renderTask.current = task;
      await task.promise;
      renderTask.current = null;
      setRendering(false);
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") {
        setRendering(false);
      }
    }
  }, []);

  // يُشغَّل عند تغيّر الـ PDF أو الصفحة
  useEffect(() => {
    if (pdfDoc) renderPage(pdfDoc, page);
  }, [pdfDoc, page, renderPage]);

  // ── مؤقت إخفاء الـ UI ────────────────────────────────────────────────────────
  const resetTimer = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setShowUI(true);
    uiTimer.current = setTimeout(() => setShowUI(false), 3500);
  }, []);

  useEffect(() => {
    resetTimer();
    return () => { if (uiTimer.current) clearTimeout(uiTimer.current); };
  }, [page, resetTimer]);

  // ── لوحة المفاتيح ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if      (e.key === "ArrowLeft")  goTo(page + 1);
      else if (e.key === "ArrowRight") goTo(page - 1);
      else if (e.key === "Escape")     window.history.back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, total]); // goTo is inline and stable

  const goTo = (n: number) => {
    const p = Math.max(1, Math.min(total, n));
    setPage(p);
    lsSet(PAGE_KEY, p);
    resetTimer();
  };

  // ── سحب باللمس ───────────────────────────────────────────────────────────────
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    touchStart.current = null;
    if (dy > 70 || Math.abs(dx) < 40) { resetTimer(); return; }
    goTo(dx < 0 ? page + 1 : page - 1);
  };

  const submitJump = () => {
    const n = parseInt(jumpVal, 10);
    if (!isNaN(n)) goTo(n);
    setShowJump(false);
    setJumpVal("");
  };

  return (
    <div className="mshf-shell" dir="rtl">

      {/* ── شريط علوي ── */}
      <header className={`mshf-bar mshf-bar--top${showUI ? " mshf-bar--show" : ""}`}>
        <button className="mshf-chrome-btn" onClick={() => window.history.back()}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          رجوع
        </button>
        <div className="mshf-bar__center">
          <Star className="mshf-star" />
          <span className="mshf-bar__title">المصحف الشريف</span>
          <Star className="mshf-star" />
        </div>
        <button className="mshf-chrome-btn" onClick={() => { setShowJump(true); setJumpVal(String(page)); resetTimer(); }}>
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          انتقال
        </button>
      </header>

      {/* ── منطقة الـ canvas ── */}
      <div
        ref={frameRef}
        className="mshf-frame"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={resetTimer}
      >
        {/* تحميل */}
        {rendering && !loadErr && (
          <div className="mshf-skeleton">
            <div className="mshf-spinner" />
            <span>{pdfDoc ? "جاري الرسم…" : "جاري تحميل المصحف…"}</span>
          </div>
        )}

        {/* خطأ */}
        {loadErr && (
          <div className="mshf-error">
            <span className="mshf-error__icon">⚠️</span>
            <p>تعذّر تحميل المصحف</p>
            <p className="mshf-error__sub">تحقق من اتصالك بالإنترنت</p>
            <button onClick={() => window.location.reload()} className="mshf-retry">إعادة المحاولة</button>
          </div>
        )}

        {/* الصفحة */}
        {!loadErr && (
          <div className="mshf-page-wrap">
            <Star className="mshf-corner mshf-corner--tl" />
            <Star className="mshf-corner mshf-corner--tr" />
            <Star className="mshf-corner mshf-corner--bl" />
            <Star className="mshf-corner mshf-corner--br" />
            <canvas
              ref={canvasRef}
              className={`mshf-canvas${!rendering ? " mshf-canvas--loaded" : ""}`}
              aria-label={`صفحة ${page} من المصحف الشريف`}
            />
          </div>
        )}
      </div>

      {/* ── شريط سفلي ── */}
      <footer className={`mshf-bar mshf-bar--bot${showUI ? " mshf-bar--show" : ""}`}>
        <button className="mshf-nav-btn" onClick={() => goTo(page - 1)} disabled={page <= 1}>
          ‹ السابقة
        </button>
        <button
          className="mshf-page-badge"
          onClick={() => { setShowJump(true); setJumpVal(String(page)); resetTimer(); }}
        >
          {page} <span className="mshf-page-badge__of">/ {total}</span>
        </button>
        <button className="mshf-nav-btn" onClick={() => goTo(page + 1)} disabled={page >= total}>
          التالية ›
        </button>
      </footer>

      {/* ── مربع الانتقال ── */}
      {showJump && (
        <div className="mshf-jump-overlay" onClick={() => setShowJump(false)}>
          <div className="mshf-jump-box" onClick={e => e.stopPropagation()}>
            <p className="mshf-jump-label">انتقل إلى صفحة (١ – {total})</p>
            <input
              autoFocus
              type="number"
              min={1}
              max={total}
              value={jumpVal}
              onChange={e => setJumpVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitJump()}
              className="mshf-jump-input"
            />
            <div className="mshf-jump-actions">
              <button className="mshf-jump-cancel" onClick={() => setShowJump(false)}>إلغاء</button>
              <button className="mshf-jump-go" onClick={submitJump}>انتقال</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
