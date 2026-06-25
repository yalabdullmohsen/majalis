import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import {
  CondolenceCard,
  EXPORT_SIZES,
  type CondolenceForm,
} from "@/components/condolences/CondolenceCard";
import { getCondolenceDefaults, isCondolencesEnabled } from "@/lib/site-settings";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="cond-form-field">
      <span className="cond-form-label">{label}</span>
      {children}
    </label>
  );
}

export default function CondolencesPage() {
  const previewPanelRef = useRef<HTMLElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CondolenceForm>(() => getCondolenceDefaults());
  const [downloading, setDownloading] = useState(false);

  if (!isCondolencesEnabled()) {
    return (
      <main dir="rtl" className="cond-page">
        <div className="cond-page-inner" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h1 className="cond-page-title">قوالب العزاء</h1>
          <p className="cond-page-desc">صفحة التعزية غير متاحة حاليًا.</p>
        </div>
      </main>
    );
  }

  const dims = EXPORT_SIZES[form.size];

  const update = <K extends keyof CondolenceForm>(key: K, value: CondolenceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(getCondolenceDefaults());

  const scrollToPreview = () => {
    previewPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const downloadImage = async () => {
    const el = exportRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(el, {
        quality: 1,
        pixelRatio: 1,
        width: dims.width,
        height: dims.height,
        backgroundColor: "#0a0a0a",
        cacheBust: true,
      });

      const link = document.createElement("a");
      link.download = `تعزية-${form.name.trim() || "بطاقة"}.png`;
      link.href = dataUrl;
      link.click();
    } catch {
      alert("تعذر تحميل الصورة. حاول مجددًا.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main dir="rtl" className="cond-page">
      <div className="cond-page-inner">
        <section className="ui-card cond-form-panel">
          <h1 className="cond-page-title">قوالب العزاء</h1>
          <p className="cond-page-desc">
            بطاقة تعزية رسمية بخلفية سوداء — جاهزة للمشاركة على واتساب وإنستغرام.
          </p>

          <div className="cond-form-fields">
            <Field label="اسم المتوفى">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="cond-input"
                placeholder="اكتب اسم المتوفى"
              />
            </Field>

            <Field label="اليوم">
              <input
                value={form.day}
                onChange={(e) => update("day", e.target.value)}
                className="cond-input"
                placeholder="مثال: الثلاثاء"
              />
            </Field>

            <Field label="التاريخ">
              <input
                value={form.deathDate}
                onChange={(e) => update("deathDate", e.target.value)}
                className="cond-input"
                placeholder="مثال: 2026/6/23"
              />
            </Field>

            <Field label="وقت الدفن">
              <input
                value={form.burialTime}
                onChange={(e) => update("burialTime", e.target.value)}
                className="cond-input"
                placeholder="مثال: بعد صلاة العشاء"
              />
            </Field>

            <Field label="مكان العزاء">
              <input
                value={form.condolencePlace}
                onChange={(e) => update("condolencePlace", e.target.value)}
                className="cond-input"
                placeholder="مثال: العزاء بالمقبرة"
              />
            </Field>

            <Field label="نص إضافي اختياري">
              <textarea
                value={form.extraText}
                onChange={(e) => update("extraText", e.target.value)}
                className="cond-input cond-textarea"
                placeholder="نص اختياري إن رغبت"
                rows={3}
              />
            </Field>

            <Field label="المقاس">
              <select
                value={form.size}
                onChange={(e) => update("size", e.target.value as CondolenceForm["size"])}
                className="cond-input"
              >
                <option value="story">طولي 1080×1350 — إنستغرام / واتساب</option>
                <option value="square">مربع 1080×1080 — واتساب</option>
              </select>
            </Field>

            <label className="cond-checkbox">
              <input
                type="checkbox"
                checked={form.showLogo}
                onChange={(e) => update("showLogo", e.target.checked)}
              />
              <span>إظهار الشعار (اختياري)</span>
            </label>

            <div className="template-action-row template-action-row--three">
              <button type="button" onClick={scrollToPreview} className="ui-card-btn template-btn template-btn--ghost">
                معاينة
              </button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={downloading}
                className="ui-card-btn template-btn template-btn--primary"
              >
                {downloading ? "جارٍ التحميل..." : "تحميل الصورة"}
              </button>
              <button type="button" onClick={resetForm} className="ui-card-btn template-btn template-btn--ghost">
                إعادة ضبط
              </button>
            </div>
          </div>
        </section>

        <section ref={previewPanelRef} className="cond-preview-panel" id="cond-preview-panel">
          <h2 className="cond-preview-title">معاينة</h2>
          <CondolenceCard
            form={form}
            width={dims.previewW}
            height={dims.previewH}
            preview
          />
        </section>
      </div>

      <div className="cond-bw-export-host" aria-hidden="true">
        <CondolenceCard
          ref={exportRef}
          form={form}
          width={dims.width}
          height={dims.height}
        />
      </div>
    </main>
  );
}
