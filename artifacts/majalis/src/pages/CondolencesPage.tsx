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
        <div className="cond-page-inner cond-page-inner--single" style={{ textAlign: "center", padding: "4rem 1rem" }}>
          <h1 className="cond-page-title">قوالب العزاء</h1>
          <p className="cond-page-desc">صفحة التعزية غير متاحة حاليًا.</p>
        </div>
      </main>
    );
  }

  const dims = EXPORT_SIZES.story;

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
      await document.fonts.ready;
      const dataUrl = await htmlToImage.toPng(el, {
        quality: 1,
        pixelRatio: 2,
        width: dims.width,
        height: dims.height,
        backgroundColor: "#080808",
        cacheBust: true,
      });

      const link = document.createElement("a");
      const slug = form.name.trim() || form.familyName.trim() || "بطاقة";
      link.download = `تعزية-${slug}.png`;
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
            بطاقة تعزية رسمية بخط عربي أنيق — جاهزة للطباعة والنشر على واتساب وإنستغرام و X.
          </p>

          <div className="cond-form-fields">
            <Field label="اسم الأسرة أو الجهة">
              <input
                value={form.familyName}
                onChange={(e) => update("familyName", e.target.value)}
                className="cond-input"
                placeholder="مثال: أسرة آل محمد / جمعية خيرية"
                autoComplete="off"
              />
            </Field>

            <Field label="اسم المتوفى">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className="cond-input"
                placeholder="اكتب اسم المتوفى"
                autoComplete="off"
              />
            </Field>

            <Field label="نص إضافي اختياري">
              <textarea
                value={form.extraText}
                onChange={(e) => update("extraText", e.target.value)}
                className="cond-input cond-textarea"
                placeholder="نص اختياري يظهر أسفل الدعاء إن رغبت"
                rows={3}
              />
            </Field>

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

            <p className="cond-export-note">التصدير: PNG · 1080×1350 · دقة عالية (Retina)</p>
          </div>
        </section>

        <section ref={previewPanelRef} className="cond-preview-panel" id="cond-preview-panel">
          <h2 className="cond-preview-title">معاينة مباشرة</h2>
          <CondolenceCard
            form={{ ...form, size: "story" }}
            width={dims.previewW}
            height={dims.previewH}
            preview
          />
        </section>
      </div>

      <div className="cond-bw-export-host" aria-hidden="true">
        <CondolenceCard
          ref={exportRef}
          form={{ ...form, size: "story" }}
          width={dims.width}
          height={dims.height}
        />
      </div>
    </main>
  );
}
