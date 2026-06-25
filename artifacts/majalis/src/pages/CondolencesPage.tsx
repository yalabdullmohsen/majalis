import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import {
  CondolenceCard,
  defaultCondolenceForm,
  EXPORT_SIZES,
  type CondolenceForm,
} from "@/components/condolences/CondolenceCard";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="cond-form-field">
      <span className="cond-form-label">{label}</span>
      {children}
    </label>
  );
}

export default function CondolencesPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CondolenceForm>(defaultCondolenceForm);
  const [downloading, setDownloading] = useState(false);

  const dims = EXPORT_SIZES[form.size];

  const update = <K extends keyof CondolenceForm>(key: K, value: CondolenceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => setForm(defaultCondolenceForm);

  const downloadImage = async () => {
    const el = exportRef.current ?? cardRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(el, {
        quality: 1,
        pixelRatio: 1,
        width: dims.width,
        height: dims.height,
        backgroundColor: "#000000",
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
            اكتب البيانات ثم حمّل البطاقة للمشاركة — بدون حقوق أو شعار افتراضي.
          </p>

          <div className="cond-form-fields">
            <Field label="الاسم">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="cond-input"
                placeholder="اسم المتوفى"
              />
            </Field>

            <Field label="التاريخ">
              <input
                value={form.deathDate}
                onChange={(e) => update("deathDate", e.target.value)}
                className="cond-input"
                placeholder="مثال: الثلاثاء 2026/6/23"
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
                placeholder="مثال: نسأل الله له الرحمة والمغفرة"
              />
            </Field>

            <Field label="المقاس">
              <select
                value={form.size}
                onChange={(e) => update("size", e.target.value as CondolenceForm["size"])}
                className="cond-input"
              >
                <option value="square">مربع 1080×1080 — واتساب</option>
                <option value="story">طولي 1080×1350 — إنستغرام</option>
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

            <div className="template-action-row">
              <button type="button" onClick={resetForm} className="ui-card-btn template-btn template-btn--ghost">
                إعادة ضبط
              </button>
              <button
                type="button"
                onClick={downloadImage}
                disabled={downloading}
                className="ui-card-btn template-btn template-btn--primary"
              >
                {downloading ? "جارٍ التحميل..." : "تحميل الصورة"}
              </button>
            </div>
          </div>
        </section>

        <section className="cond-preview-panel">
          <h2 className="cond-preview-title">معاينة</h2>
          <CondolenceCard
            ref={cardRef}
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
