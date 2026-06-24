import { useMemo, useRef, useState } from "react";
import html2canvas from "html2canvas";
import { CondolencePreview } from "@/components/condolences/CondolencePreview";
import {
  buildCondolencePlainText,
  CARD_SIZES,
  CONDOLENCE_TEMPLATES,
  defaultCondolenceData,
  type CardSizeKey,
  type CondolenceFormData,
  type CondolenceTemplateId,
} from "@/components/condolences/types";
import { PageHeader } from "@/components/ui-common";

const FORM_FIELDS: { key: keyof CondolenceFormData; label: string; placeholder: string; multiline?: boolean }[] = [
  { key: "deceasedName", label: "اسم المتوفى", placeholder: "مثال: فلان بن فلان" },
  { key: "deathDate", label: "تاريخ الوفاة", placeholder: "مثال: ١٥ محرم ١٤٤٧ هـ" },
  { key: "burialTime", label: "وقت الدفن", placeholder: "مثال: بعد صلاة العصر" },
  { key: "condolenceLocation", label: "مكان العزاء", placeholder: "مثال: مسجد... / منزل..." },
  { key: "extraText", label: "نص إضافي (اختياري)", placeholder: "دعاء أو ملاحظة...", multiline: true },
];

export default function CondolencesPage() {
  const [data, setData] = useState<CondolenceFormData>(defaultCondolenceData);
  const [templateId, setTemplateId] = useState<CondolenceTemplateId>("black_classic");
  const [sizeKey, setSizeKey] = useState<CardSizeKey>("portrait");
  const [downloading, setDownloading] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const cardRef = useRef<HTMLDivElement>(null);

  const size = CARD_SIZES[sizeKey];
  const template = CONDOLENCE_TEMPLATES.find((t) => t.id === templateId)!;

  const previewScale = useMemo(
    () => Math.min(1, 360 / size.width, 480 / size.height),
    [size.width, size.height]
  );

  const update = (field: keyof CondolenceFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setData(defaultCondolenceData);
    setCopyStatus("");
  };

  const copyText = async () => {
    const text = buildCondolencePlainText(data, template.headline);
    try {
      await navigator.clipboard.writeText(text);
      setCopyStatus("تم نسخ النص");
    } catch {
      setCopyStatus("تعذر النسخ — انسخ يدويًا");
    }
    setTimeout(() => setCopyStatus(""), 2500);
  };

  const downloadImage = async () => {
    const el = cardRef.current;
    if (!el) return;
    setDownloading(true);
    const prevTransform = el.style.transform;
    const prevPosition = el.style.position;
    const prevLeft = el.style.left;
    try {
      el.style.transform = "none";
      el.style.position = "fixed";
      el.style.left = "-9999px";
      el.style.top = "0";

      const canvas = await html2canvas(el.firstElementChild as HTMLElement, {
        scale: 1,
        width: size.width,
        height: size.height,
        useCORS: true,
        backgroundColor: "#0a0a0a",
        logging: false,
      });

      const link = document.createElement("a");
      link.download = `تعزية-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } catch (err) {
      console.error("[majalis:condolences] download failed", err);
      alert("تعذر تحميل الصورة. حاول مجددًا.");
    } finally {
      el.style.transform = prevTransform;
      el.style.position = prevPosition;
      el.style.left = prevLeft;
      el.style.top = "";
      setDownloading(false);
    }
  };

  return (
    <div dir="rtl" className="condolences-page">
      <div className="condolences-page__shell">
        <PageHeader
          eyebrow="لوجه الله"
          title="قوالب العزاء وإعلان الوفاة"
          subtitle="صمّم بطاقة تعزية أو إعلان وفاة بخلفية سوداء فاخرة — معاينة فورية وتحميل PNG."
        />

        <div className="condolences-layout">
          <aside className="condolences-panel">
            <section className="condolences-block">
              <h2>اختر القالب</h2>
              <div className="cond-template-grid">
                {CONDOLENCE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    className={templateId === t.id ? "cond-template-btn active" : "cond-template-btn"}
                    onClick={() => setTemplateId(t.id)}
                  >
                    <span className="cond-template-btn__swatch" aria-hidden="true" />
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </section>

            <section className="condolences-block">
              <h2>مقاس الصورة</h2>
              <div className="cond-size-row">
                {(Object.keys(CARD_SIZES) as CardSizeKey[]).map((key) => (
                  <button
                    key={key}
                    type="button"
                    className={sizeKey === key ? "cond-size-btn active" : "cond-size-btn"}
                    onClick={() => setSizeKey(key)}
                  >
                    {CARD_SIZES[key].label}
                  </button>
                ))}
              </div>
            </section>

            <section className="condolences-block">
              <h2>بيانات البطاقة</h2>
              <div className="cond-form">
                {FORM_FIELDS.map(({ key, label, placeholder, multiline }) => (
                  <label key={key} className="cond-field">
                    <span>{label}</span>
                    {multiline ? (
                      <textarea
                        value={data[key]}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={placeholder}
                        rows={3}
                      />
                    ) : (
                      <input
                        value={data[key]}
                        onChange={(e) => update(key, e.target.value)}
                        placeholder={placeholder}
                      />
                    )}
                  </label>
                ))}
              </div>
            </section>

            <div className="cond-actions">
              <button type="button" className="cond-btn cond-btn--primary" onClick={downloadImage} disabled={downloading}>
                {downloading ? "جارٍ التحميل..." : "تحميل الصورة"}
              </button>
              <button type="button" className="cond-btn cond-btn--secondary" onClick={copyText}>
                نسخ النص
              </button>
              <button type="button" className="cond-btn cond-btn--ghost" onClick={resetForm}>
                إعادة ضبط
              </button>
              {copyStatus && <p className="cond-copy-status">{copyStatus}</p>}
            </div>
          </aside>

          <section className="condolences-preview-wrap">
            <h2 className="cond-preview-title">المعاينة المباشرة</h2>
            <div
              className="cond-preview-scaler"
              style={{
                width: size.width * previewScale,
                height: size.height * previewScale,
              }}
            >
              <div
                ref={cardRef}
                className="cond-export-wrap"
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top right",
                }}
              >
                <CondolencePreview
                  data={data}
                  templateId={templateId}
                  width={size.width}
                  height={size.height}
                />
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
