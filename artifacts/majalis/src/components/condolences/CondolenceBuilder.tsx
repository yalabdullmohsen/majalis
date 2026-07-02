import { useEffect, useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import {
  TEMPLATES,
  FONTS,
  PALETTES,
  PHRASE_CATEGORIES,
  GOOGLE_FONTS_URL,
  defaultBuilderForm,
  type BuilderForm,
  type ImageFilter,
} from "@/lib/condolence-builder";
import { CondolenceCardPreview, CARD_W, CARD_H } from "./CondolenceCardPreview";

const PREVIEW_W = 360;
const PREVIEW_SCALE = PREVIEW_W / CARD_W;
const PREVIEW_H = Math.round(CARD_H * PREVIEW_SCALE);

// ─── Accordion ───────────────────────────────────────────────────────────────

function Accordion({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`cb-accordion${open ? " cb-accordion--open" : ""}`}>
      <button type="button" className="cb-accordion__header" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span>{title}</span>
        <span className="cb-accordion__arrow">{open ? "▲" : "▼"}</span>
      </button>
      {open && <div className="cb-accordion__body">{children}</div>}
    </div>
  );
}

// ─── CondolenceBuilder ───────────────────────────────────────────────────────

export function CondolenceBuilder() {
  const [form, setForm] = useState<BuilderForm>(defaultBuilderForm);
  const [downloading, setDownloading] = useState(false);
  const [selectedCat, setSelectedCat] = useState(0);
  const exportRef = useRef<HTMLDivElement>(null);

  // Load Google Fonts once
  useEffect(() => {
    if (!document.querySelector("#cb-gfonts")) {
      const link = document.createElement("link");
      link.id = "cb-gfonts";
      link.rel = "stylesheet";
      link.href = GOOGLE_FONTS_URL;
      document.head.appendChild(link);
    }
  }, []);

  function set<K extends keyof BuilderForm>(key: K, value: BuilderForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function resetForm() {
    setForm(defaultBuilderForm);
  }

  async function downloadPng() {
    const el = exportRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      await document.fonts.ready;
      const dataUrl = await htmlToImage.toPng(el, {
        quality: 1,
        pixelRatio: 1,
        width: CARD_W,
        height: CARD_H,
        cacheBust: true,
      });
      const a = document.createElement("a");
      a.download = `تعزية-${form.name || "بطاقة"}.png`;
      a.href = dataUrl;
      a.click();
    } catch {
      alert("تعذّر تحميل الصورة. حاول مجدداً.");
    } finally {
      setDownloading(false);
    }
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      set("imageDataUrl", ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  }

  const IMAGE_FILTERS: { id: ImageFilter; label: string }[] = [
    { id: "none", label: "بدون" },
    { id: "bw", label: "أبيض وأسود" },
    { id: "sepia", label: "سيبيا" },
    { id: "warm", label: "دافئ" },
  ];

  return (
    <div className="cb-root" dir="rtl">
      <div className="cb-layout">
        {/* ─── Sidebar ─── */}
        <aside className="cb-sidebar">

          {/* Template */}
          <Accordion title="القالب" defaultOpen>
            <div className="cb-template-grid">
              {TEMPLATES.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`cb-template-chip${form.templateId === t.id ? " cb-template-chip--active" : ""}`}
                  style={{ background: t.bgColor, color: t.textColor, borderColor: form.templateId === t.id ? t.accentColor : "transparent" }}
                  onClick={() => set("templateId", t.id)}
                  title={t.description}
                >
                  <span className="cb-template-chip__dot" style={{ background: t.accentColor }} />
                  <span className="cb-template-chip__label">{t.label}</span>
                </button>
              ))}
            </div>
          </Accordion>

          {/* Text */}
          <Accordion title="النص">
            <div className="cb-fields">
              <label className="cb-field">
                <span>اسم المتوفى</span>
                <input
                  type="text"
                  className="cb-input"
                  value={form.name}
                  onChange={(e) => set("name", e.target.value)}
                  placeholder="اكتب الاسم كاملاً"
                  autoComplete="off"
                />
              </label>

              <label className="cb-field">
                <span>اسم الأسرة / الجهة</span>
                <input
                  type="text"
                  className="cb-input"
                  value={form.familyName}
                  onChange={(e) => set("familyName", e.target.value)}
                  placeholder="مثال: أسرة آل محمد"
                  autoComplete="off"
                />
              </label>

              <label className="cb-field">
                <span>التاريخ</span>
                <input
                  type="text"
                  className="cb-input"
                  value={form.date}
                  onChange={(e) => set("date", e.target.value)}
                  placeholder="مثال: الثلاثاء 1 يناير 2025"
                  autoComplete="off"
                />
              </label>

              <label className="cb-field">
                <span>نص إضافي (اختياري)</span>
                <textarea
                  className="cb-input cb-textarea"
                  value={form.extraText}
                  onChange={(e) => set("extraText", e.target.value)}
                  placeholder="نص ظاهر أسفل العبارة"
                  rows={3}
                />
              </label>

              {/* Phrase picker */}
              <div className="cb-field">
                <span className="cb-label">عبارة العزاء</span>
                <div className="cb-cat-tabs">
                  {PHRASE_CATEGORIES.map((cat, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`cb-cat-tab${selectedCat === i ? " cb-cat-tab--active" : ""}`}
                      onClick={() => setSelectedCat(i)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <div className="cb-phrase-list">
                  {PHRASE_CATEGORIES[selectedCat]?.phrases.map((ph) => (
                    <button
                      key={ph}
                      type="button"
                      className={`cb-phrase-item${form.phrase === ph ? " cb-phrase-item--active" : ""}`}
                      onClick={() => set("phrase", ph)}
                    >
                      {ph}
                    </button>
                  ))}
                </div>
                <label className="cb-field" style={{ marginTop: 10 }}>
                  <span>أو اكتب عبارتك</span>
                  <textarea
                    className="cb-input cb-textarea"
                    value={form.phrase}
                    onChange={(e) => set("phrase", e.target.value)}
                    rows={3}
                  />
                </label>
              </div>
            </div>
          </Accordion>

          {/* Font */}
          <Accordion title="الخط">
            <div className="cb-font-grid">
              {FONTS.map((f) => (
                <button
                  key={f.id}
                  type="button"
                  className={`cb-font-chip${form.fontId === f.id ? " cb-font-chip--active" : ""}`}
                  style={{ fontFamily: f.css }}
                  onClick={() => set("fontId", f.id)}
                  title={f.label}
                >
                  <span className="cb-font-chip__preview">بسم الله</span>
                  <span className="cb-font-chip__name">{f.label}</span>
                </button>
              ))}
            </div>
            <div className="cb-fields" style={{ marginTop: 16 }}>
              <label className="cb-field">
                <span>حجم العنوان: {form.headingSize}px</span>
                <input
                  type="range"
                  min={24}
                  max={44}
                  value={form.headingSize}
                  onChange={(e) => set("headingSize", Number(e.target.value))}
                  className="cb-range"
                />
              </label>
              <label className="cb-field">
                <span>حجم النص: {form.bodySize}px</span>
                <input
                  type="range"
                  min={14}
                  max={30}
                  value={form.bodySize}
                  onChange={(e) => set("bodySize", Number(e.target.value))}
                  className="cb-range"
                />
              </label>
            </div>
          </Accordion>

          {/* Colors */}
          <Accordion title="الألوان">
            <div className="cb-palette-grid">
              {PALETTES.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`cb-palette-chip${form.paletteId === p.id ? " cb-palette-chip--active" : ""}`}
                  onClick={() => set("paletteId", p.id)}
                  title={p.label}
                >
                  <div className="cb-palette-chip__swatches">
                    <div style={{ background: p.primary }} />
                    <div style={{ background: p.secondary }} />
                    <div style={{ background: p.accent }} />
                    <div style={{ background: p.background }} />
                  </div>
                  <span className="cb-palette-chip__name">{p.label}</span>
                </button>
              ))}
            </div>
          </Accordion>

          {/* Image */}
          <Accordion title="الصورة">
            <div className="cb-fields">
              <label className="cb-field">
                <span>رفع صورة (اختياري)</span>
                <input type="file" accept="image/*" onChange={handleImageUpload} className="cb-file-input" />
              </label>

              {form.imageDataUrl && (
                <>
                  <div className="cb-img-thumb-row">
                    <img src={form.imageDataUrl} alt="الصورة المختارة" className="cb-img-thumb" />
                    <button type="button" className="cb-img-remove" onClick={() => set("imageDataUrl", null)}>
                      ✕ إزالة
                    </button>
                  </div>

                  <div className="cb-field">
                    <span>فلتر الصورة</span>
                    <div className="cb-filter-row">
                      {IMAGE_FILTERS.map((fi) => (
                        <button
                          key={fi.id}
                          type="button"
                          className={`cb-filter-btn${form.imageFilter === fi.id ? " cb-filter-btn--active" : ""}`}
                          onClick={() => set("imageFilter", fi.id)}
                        >
                          {fi.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <label className="cb-field">
                    <span>السطوع: {Math.round(form.imageBrightness * 100)}%</span>
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={Math.round(form.imageBrightness * 100)}
                      onChange={(e) => set("imageBrightness", Number(e.target.value) / 100)}
                      className="cb-range"
                    />
                  </label>
                </>
              )}
            </div>
          </Accordion>

          {/* Action buttons */}
          <div className="cb-actions">
            <button
              type="button"
              className="cb-btn cb-btn--primary"
              onClick={downloadPng}
              disabled={downloading}
            >
              {downloading ? "جارٍ التحميل…" : "⬇ تحميل PNG"}
            </button>
            <button type="button" className="cb-btn cb-btn--ghost" onClick={resetForm}>
              إعادة ضبط
            </button>
          </div>
          <p className="cb-export-note">التصدير: PNG · 1080×1350 · دقة عالية</p>
        </aside>

        {/* ─── Preview ─── */}
        <div className="cb-preview-col">
          <div className="cb-preview-sticky">
            <h3 className="cb-preview-title">معاينة مباشرة</h3>
            <div
              className="cb-preview-frame"
              style={{ width: PREVIEW_W, height: PREVIEW_H }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top right",
                  width: CARD_W,
                  height: CARD_H,
                  pointerEvents: "none",
                }}
              >
                <CondolenceCardPreview form={form} />
              </div>
            </div>

            {/* Mobile download */}
            <button
              type="button"
              className="cb-btn cb-btn--primary cb-btn--mobile-dl"
              onClick={downloadPng}
              disabled={downloading}
            >
              {downloading ? "جارٍ التحميل…" : "⬇ تحميل الصورة"}
            </button>
          </div>
        </div>
      </div>

      {/* ─── Hidden full-res export ─── */}
      <div
        className="cb-export-host"
        aria-hidden="true"
        style={{ position: "fixed", top: "-99999px", left: "-99999px", width: CARD_W, height: CARD_H, overflow: "hidden" }}
      >
        <CondolenceCardPreview ref={exportRef} form={form} isExport />
      </div>
    </div>
  );
}
