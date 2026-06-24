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
    <label className="block">
      <span className="mb-2 block text-sm text-white/70">{label}</span>
      {children}
    </label>
  );
}

const inputClass =
  "w-full rounded-xl border border-white/15 bg-black px-4 py-3 text-white outline-none focus:border-white/40";

export default function CondolencesPage() {
  const cardRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const [form, setForm] = useState<CondolenceForm>(defaultCondolenceForm);
  const [downloading, setDownloading] = useState(false);

  const dims = EXPORT_SIZES[form.size];

  const update = <K extends keyof CondolenceForm>(key: K, value: CondolenceForm[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

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
    } catch (err) {
      console.error("[majalis:condolences] PNG export failed", err);
      alert("تعذر تحميل الصورة. حاول مجددًا.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <main dir="rtl" className="min-h-screen bg-neutral-950 px-4 py-8 text-white">
      <div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[380px_1fr]">
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <h1 className="mb-2 text-2xl font-bold">قوالب العزاء</h1>
          <p className="mb-6 text-sm text-white/60">
            اكتب البيانات ثم حمّل البطاقة بدون شعار أو حقوق.
          </p>

          <div className="space-y-4">
            <Field label="اسم المتوفى">
              <input
                value={form.name}
                onChange={(e) => update("name", e.target.value)}
                className={inputClass}
                placeholder="مثال: عبدالله فالح بن خضير المطيري"
              />
            </Field>

            <Field label="تاريخ الوفاة">
              <input
                value={form.deathDate}
                onChange={(e) => update("deathDate", e.target.value)}
                className={inputClass}
                placeholder="مثال: الثلاثاء 2026/6/23"
              />
            </Field>

            <Field label="وقت الدفن">
              <input
                value={form.burialTime}
                onChange={(e) => update("burialTime", e.target.value)}
                className={inputClass}
                placeholder="مثال: بعد صلاة العشاء"
              />
            </Field>

            <Field label="مكان العزاء">
              <input
                value={form.condolencePlace}
                onChange={(e) => update("condolencePlace", e.target.value)}
                className={inputClass}
                placeholder="مثال: العزاء بالمقبرة"
              />
            </Field>

            <Field label="نص إضافي اختياري">
              <textarea
                value={form.extraText}
                onChange={(e) => update("extraText", e.target.value)}
                className={`${inputClass} min-h-24 resize-none`}
                placeholder="مثال: نسأل الله له الرحمة والمغفرة"
              />
            </Field>

            <Field label="المقاس">
              <select
                value={form.size}
                onChange={(e) => update("size", e.target.value as CondolenceForm["size"])}
                className={inputClass}
              >
                <option value="square">مربع 1080×1080</option>
                <option value="story">طولي 1080×1350</option>
              </select>
            </Field>

            <button
              type="button"
              onClick={downloadImage}
              disabled={downloading}
              className="w-full rounded-xl bg-white py-3 font-bold text-black hover:bg-white/90 disabled:opacity-60"
            >
              {downloading ? "جارٍ التحميل..." : "تحميل الصورة PNG"}
            </button>
          </div>
        </section>

        <section className="flex items-center justify-center overflow-auto py-2">
          <CondolenceCard
            ref={cardRef}
            form={form}
            width={dims.previewW}
            height={dims.previewH}
            preview
          />
        </section>
      </div>

      {/* بطاقة التصدير بالمقاس الكامل — مخفية عن العرض */}
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
