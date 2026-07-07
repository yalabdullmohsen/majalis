"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import "@/styles/mushaf.css";

const PDF_URL = "/quran.pdf";
const PAGE_KEY = "mj-mushaf-page-v2";
const TOTAL = 604;

function ls(key: string, fallback: number): number {
  try { const v = localStorage.getItem(key); return v ? JSON.parse(v) : fallback; }
  catch { return fallback; }
}
function lsSet(key: string, val: number) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch { /* ignore */ }
}

// ─── نجمة هندسية إسلامية ─────────────────────────────────────────────────────
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

// ─── صفحة المصحف ──────────────────────────────────────────────────────────────
export default function QuranPage() {
  const [page, setPage]           = useState(() => ls(PAGE_KEY, 1));
  const [totalPages, setTotal]    = useState(TOTAL);
  const [rendering, setRendering] = useState(true);
  const [loadErr, setLoadErr]     = useState(false);
  const [showUI, setShowUI]       = useState(true);
  const [inputVal, setInputVal]   = useState("");
  const [showInput, setShowInput] = useState(false);

  const canvasRef   = useRef<HTMLCanvasElement>(null);
  const pdfRef      = useRef<any>(null);
  const renderTask  = useRef<any>(null);
  const uiTimer     = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStart  = useRef<{ x: number; y: number } | null>(null);

  // تحميل PDF.js + الملف مرة واحدة
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore — dynamic CDN import
        const pdfjsLib: any = await import(
          /* @vite-ignore */
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.min.mjs" as string
        );
        pdfjsLib.GlobalWorkerOptions.workerSrc =
          "https://cdn.jsdelivr.net/npm/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

        const pdf = await pdfjsLib.getDocument(PDF_URL).promise;
        if (cancelled) return;
        pdfRef.current = pdf;
        setTotal(pdf.numPages);
      } catch {
        if (!cancelled) setLoadErr(true);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // رسم الصفحة على الـ canvas
  const renderPage = useCallback(async (num: number) => {
    if (!pdfRef.current || !canvasRef.current) return;
    if (renderTask.current) { renderTask.current.cancel(); renderTask.current = null; }

    setRendering(true);
    try {
      const pdfPage = await pdfRef.current.getPage(num);
      const canvas  = canvasRef.current;
      const dpr     = window.devicePixelRatio || 1;
      const vp0     = pdfPage.getViewport({ scale: 1 });

      // احسب scale ليملأ الشاشة
      const scaleW  = (canvas.parentElement!.clientWidth  * dpr) / vp0.width;
      const scaleH  = (canvas.parentElement!.clientHeight * dpr) / vp0.height;
      const scale   = Math.min(scaleW, scaleH);
      const vp      = pdfPage.getViewport({ scale });

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
      setRendering(false);
    } catch (e: any) {
      if (e?.name !== "RenderingCancelledException") setRendering(false);
    }
  }, []);

  useEffect(() => {
    if (pdfRef.current) renderPage(page);
  }, [page, renderPage]);

  // استأنف الرسم حين يتحمل الـ PDF
  useEffect(() => {
    if (!pdfRef.current || loadErr) return;
    renderPage(page);
  }, [pdfRef.current]);

  // مؤقت إخفاء الـ UI
  const resetTimer = useCallback(() => {
    if (uiTimer.current) clearTimeout(uiTimer.current);
    setShowUI(true);
    uiTimer.current = setTimeout(() => setShowUI(false), 3500);
  }, []);

  useEffect(() => { resetTimer(); return () => { if (uiTimer.current) clearTimeout(uiTimer.current); }; }, [page]);

  // لوحة المفاتيح
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowRight" && page > 1)           goTo(page - 1);
      else if (e.key === "ArrowLeft" && page < totalPages) goTo(page + 1);
      else if (e.key === "Escape") window.history.back();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [page, totalPages]);

  const goTo = (n: number) => {
    const p = Math.max(1, Math.min(totalPages, n));
    setPage(p);
    lsSet(PAGE_KEY, p);
    resetTimer();
  };

  // سحب باللمس
  const onTouchStart = (e: React.TouchEvent) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };
  const onTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = Math.abs(e.changedTouches[0].clientY - touchStart.current.y);
    touchStart.current = null;
    if (dy > 70 || Math.abs(dx) < 40) { resetTimer(); return; }
    if (dx < 0) goTo(page + 1);
    else         goTo(page - 1);
  };

  const handleTap = () => { resetTimer(); };

  const submitInput = () => {
    const n = parseInt(inputVal, 10);
    if (!isNaN(n)) goTo(n);
    setShowInput(false);
    setInputVal("");
  };

  return (
    <div className="mshf-shell" dir="rtl">

      {/* ── header ── */}
      <header className={`mshf-bar mshf-bar--top${showUI ? " mshf-bar--show" : ""}`}>
        <button className="mshf-chrome-btn" onClick={() => window.history.back()} aria-label="رجوع">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6"/>
          </svg>
          رجوع
        </button>

        <div className="mshf-bar__center">
          <Star className="mshf-star" />
          <span className="mshf-bar__title">المصحف الشريف</span>
          <Star className="mshf-star" />
        </div>

        <button
          className="mshf-chrome-btn"
          onClick={() => { setShowInput(true); setInputVal(String(page)); resetTimer(); }}
          aria-label="انتقال لصفحة"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          انتقال
        </button>
      </header>

      {/* ── canvas frame ── */}
      <div
        className="mshf-frame"
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
        onClick={handleTap}
      >
        {/* skeleton */}
        {rendering && !loadErr && (
          <div className="mshf-skeleton">
            <div className="mshf-spinner" />
            <span>جاري التحميل…</span>
          </div>
        )}

        {/* خطأ */}
        {loadErr && (
          <div className="mshf-error">
            <span className="mshf-error__icon">⚠️</span>
            <p>تعذّر تحميل المصحف</p>
            <button onClick={() => window.location.reload()} className="mshf-retry">إعادة المحاولة</button>
          </div>
        )}

        {/* الإطار الذهبي */}
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

      {/* ── footer ── */}
      <footer className={`mshf-bar mshf-bar--bot${showUI ? " mshf-bar--show" : ""}`}>
        <button
          className="mshf-nav-btn"
          onClick={() => goTo(page - 1)}
          disabled={page <= 1}
          aria-label="الصفحة السابقة"
        >
          السابقة
        </button>

        <button
          className="mshf-page-badge"
          onClick={() => { setShowInput(true); setInputVal(String(page)); resetTimer(); }}
          aria-label="رقم الصفحة"
        >
          {page} <span className="mshf-page-badge__of">/ {totalPages}</span>
        </button>

        <button
          className="mshf-nav-btn"
          onClick={() => goTo(page + 1)}
          disabled={page >= totalPages}
          aria-label="الصفحة التالية"
        >
          التالية
        </button>
      </footer>

      {/* ── مربع الانتقال ── */}
      {showInput && (
        <div className="mshf-jump-overlay" onClick={() => setShowInput(false)}>
          <div className="mshf-jump-box" onClick={e => e.stopPropagation()}>
            <p className="mshf-jump-label">انتقل إلى صفحة (1 – {totalPages})</p>
            <input
              autoFocus
              type="number"
              min={1}
              max={totalPages}
              value={inputVal}
              onChange={e => setInputVal(e.target.value)}
              onKeyDown={e => e.key === "Enter" && submitInput()}
              className="mshf-jump-input"
            />
            <div className="mshf-jump-actions">
              <button className="mshf-jump-cancel" onClick={() => setShowInput(false)}>إلغاء</button>
              <button className="mshf-jump-go" onClick={submitInput}>انتقال</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
