import { useRef, useState } from "react";
import * as htmlToImage from "html-to-image";
import {
  CondolenceCard,
  type CondolenceForm,
} from "@/components/condolences/CondolenceCard";
import {
  DeathAnnouncementCard,
  defaultDeathAnnouncementForm,
  type DeathAnnouncementForm,
} from "@/components/condolences/DeathAnnouncementCard";
import { CondolenceBuilder } from "@/components/condolences/CondolenceBuilder";
import {
  CONDOLENCE_TEMPLATES,
  EXPORT_SIZES,
  type CondolenceTemplateId,
} from "@/lib/condolence-shared";
import { getCondolenceDefaults, isCondolencesEnabled } from "@/lib/site-settings";

type PageTab = "official" | "builder";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="cond-form-field">
      <span className="cond-form-label">{label}</span>
      {children}
    </label>
  );
}

function GenderOption({
  value,
  checked,
  label,
  onChange,
}: {
  value: "male" | "female";
  checked: boolean;
  label: string;
  onChange: (v: "male" | "female") => void;
}) {
  return (
    <label className={`cond-gender-option${checked ? " cond-gender-option--active" : ""}`}>
      <input
        type="radio"
        name="deceased-gender"
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
      />
      <span>{label}</span>
    </label>
  );
}

export default function CondolencesPage() {
  const previewPanelRef = useRef<HTMLElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [pageTab, setPageTab] = useState<PageTab>("official");
  const [templateId, setTemplateId] = useState<CondolenceTemplateId>("official");
  const [officialForm, setOfficialForm] = useState<CondolenceForm>(() => getCondolenceDefaults());
  const [deathForm, setDeathForm] = useState<DeathAnnouncementForm>(defaultDeathAnnouncementForm);
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
  const isDeath = templateId === "death-announcement";

  const updateOfficial = <K extends keyof CondolenceForm>(key: K, value: CondolenceForm[K]) => {
    setOfficialForm((prev) => ({ ...prev, [key]: value }));
  };

  const updateDeath = <K extends keyof DeathAnnouncementForm>(key: K, value: DeathAnnouncementForm[K]) => {
    setDeathForm((prev) => ({ ...prev, [key]: value }));
  };

  const resetForm = () => {
    if (isDeath) {
      setDeathForm(defaultDeathAnnouncementForm);
    } else {
      setOfficialForm(getCondolenceDefaults());
    }
  };

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
      const slug = isDeath
        ? deathForm.name.trim() || "إعلان"
        : officialForm.name.trim() || officialForm.familyName.trim() || "بطاقة";
      link.download = isDeath ? `إعلان-وفاة-${slug}.png` : `تعزية-${slug}.png`;
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
      {/* ─── Page-level tab bar ─── */}
      <div className="cond-page-tabs" style={{ display: "flex", gap: 8, padding: "0 1rem 1rem", maxWidth: 1200, margin: "0 auto" }}>
        <button
          type="button"
          className={`cond-template-picker__btn${pageTab === "official" ? " cond-template-picker__btn--active" : ""}`}
          onClick={() => setPageTab("official")}
          style={{ flex: 1 }}
        >
          <strong>القوالب الجاهزة</strong>
          <span>بطاقة تعزية رسمية وإعلان وفاة</span>
        </button>
        <button
          type="button"
          className={`cond-template-picker__btn${pageTab === "builder" ? " cond-template-picker__btn--active" : ""}`}
          onClick={() => setPageTab("builder")}
          style={{ flex: 1 }}
        >
          <strong>باني البطاقة المتقدم</strong>
          <span>8 قوالب · 8 خطوط · صور وألوان</span>
        </button>
      </div>

      {/* ─── Builder tab ─── */}
      {pageTab === "builder" && (
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 1rem" }}>
          <CondolenceBuilder />
        </div>
      )}

      {/* ─── Official templates tab ─── */}
      {pageTab === "official" && (
      <div className="cond-page-inner">
        <section className="ui-card cond-form-panel">
          <h1 className="cond-page-title">قوالب العزاء</h1>
          <p className="cond-page-desc">
            اختر القالب، عبّئ البيانات، وحمّل صورة جاهزة للمشاركة على واتساب وإنستغرام.
          </p>

          <div className="cond-template-picker" role="tablist" aria-label="اختيار القالب">
            {CONDOLENCE_TEMPLATES.map((t) => (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={templateId === t.id}
                className={`cond-template-picker__btn${templateId === t.id ? " cond-template-picker__btn--active" : ""}`}
                onClick={() => setTemplateId(t.id)}
              >
                <strong>{t.label}</strong>
                <span>{t.description}</span>
              </button>
            ))}
          </div>

          <div className="cond-form-fields">
            {isDeath ? (
              <>
                <fieldset className="cond-gender-fieldset">
                  <legend className="cond-form-label">الجنس</legend>
                  <div className="cond-gender-row">
                    <GenderOption
                      value="male"
                      checked={deathForm.gender === "male"}
                      label="ذكر"
                      onChange={(v) => updateDeath("gender", v)}
                    />
                    <GenderOption
                      value="female"
                      checked={deathForm.gender === "female"}
                      label="أنثى"
                      onChange={(v) => updateDeath("gender", v)}
                    />
                  </div>
                </fieldset>

                <Field label={deathForm.gender === "male" ? "اسم المتوفى" : "اسم المتوفاة"}>
                  <input
                    value={deathForm.name}
                    onChange={(e) => updateDeath("name", e.target.value)}
                    className="cond-input"
                    placeholder="اكتب الاسم كاملًا"
                    autoComplete="off"
                  />
                </Field>

                <Field label="اليوم">
                  <input
                    value={deathForm.day}
                    onChange={(e) => updateDeath("day", e.target.value)}
                    className="cond-input"
                    placeholder="مثال: الخميس"
                    autoComplete="off"
                  />
                </Field>

                <Field label="الصلاة">
                  <input
                    value={deathForm.prayer}
                    onChange={(e) => updateDeath("prayer", e.target.value)}
                    className="cond-input"
                    placeholder="مثال: العشاء، العصر، المغرب"
                    autoComplete="off"
                  />
                </Field>

                <Field label="اسم المقبرة">
                  <input
                    value={deathForm.cemetery}
                    onChange={(e) => updateDeath("cemetery", e.target.value)}
                    className="cond-input"
                    placeholder="مثال: الصليبيخات، صبحان، الجهراء"
                    autoComplete="off"
                  />
                </Field>

                <Field label="عنوان العزاء">
                  <input
                    value={deathForm.condolenceAddress}
                    onChange={(e) => updateDeath("condolenceAddress", e.target.value)}
                    className="cond-input"
                    placeholder="مثال: منزل العائلة — منطقة …"
                    autoComplete="off"
                  />
                </Field>

                <Field label="رقم الهاتف">
                  <input
                    value={deathForm.phone}
                    onChange={(e) => updateDeath("phone", e.target.value)}
                    className="cond-input"
                    placeholder="مثال: 99999999"
                    inputMode="tel"
                    autoComplete="off"
                    dir="ltr"
                    style={{ textAlign: "left" }}
                  />
                </Field>

                <Field label="دعاء إضافي اختياري">
                  <textarea
                    value={deathForm.extraDua}
                    onChange={(e) => updateDeath("extraDua", e.target.value)}
                    className="cond-input cond-textarea"
                    placeholder="يظهر أسفل البطاقة إن رغبت"
                    rows={3}
                  />
                </Field>
              </>
            ) : (
              <>
                <Field label="اسم الأسرة أو الجهة">
                  <input
                    value={officialForm.familyName}
                    onChange={(e) => updateOfficial("familyName", e.target.value)}
                    className="cond-input"
                    placeholder="مثال: أسرة آل محمد / جمعية خيرية"
                    autoComplete="off"
                  />
                </Field>

                <Field label="اسم المتوفى">
                  <input
                    value={officialForm.name}
                    onChange={(e) => updateOfficial("name", e.target.value)}
                    className="cond-input"
                    placeholder="اكتب اسم المتوفى"
                    autoComplete="off"
                  />
                </Field>

                <Field label="نص إضافي اختياري">
                  <textarea
                    value={officialForm.extraText}
                    onChange={(e) => updateOfficial("extraText", e.target.value)}
                    className="cond-input cond-textarea"
                    placeholder="نص اختياري يظهر أسفل الدعاء إن رغبت"
                    rows={3}
                  />
                </Field>
              </>
            )}

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
          {isDeath ? (
            <DeathAnnouncementCard form={deathForm} width={dims.previewW} height={dims.previewH} preview />
          ) : (
            <CondolenceCard form={{ ...officialForm, size: "story" }} width={dims.previewW} height={dims.previewH} preview />
          )}
        </section>
      </div>
      )} {/* end official tab */}

      {pageTab === "official" && (
        <div className="cond-bw-export-host" aria-hidden="true">
          {isDeath ? (
            <DeathAnnouncementCard ref={exportRef} form={deathForm} width={dims.width} height={dims.height} />
          ) : (
            <CondolenceCard ref={exportRef} form={{ ...officialForm, size: "story" }} width={dims.width} height={dims.height} />
          )}
        </div>
      )}
    </main>
  );
}
