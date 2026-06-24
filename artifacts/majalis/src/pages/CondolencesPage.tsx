import { useState } from "react";
import { Link } from "wouter";
import { CondolenceCard1 } from "@/components/condolences/CondolenceCard1";
import { CondolenceCard2 } from "@/components/condolences/CondolenceCard2";
import { CondolenceCard3 } from "@/components/condolences/CondolenceCard3";
import { CondolenceCard4 } from "@/components/condolences/CondolenceCard4";
import { defaultCondolenceData, type CondolenceData } from "@/components/condolences/types";

/** تعريف التصاميم الأربعة المتاحة */
const DESIGNS = [
  { id: "design-1", title: "الكلاسيكي الداكن", Card: CondolenceCard1 },
  { id: "design-2", title: "الأبيض الأرجواني", Card: CondolenceCard2 },
  { id: "design-3", title: "الرمادي الدمشقي", Card: CondolenceCard3 },
  { id: "design-4", title: "الخضراء الإسلامية", Card: CondolenceCard4 },
] as const;

type DesignId = (typeof DESIGNS)[number]["id"];

/** فتح نافذة طباعة لبطاقة واحدة */
function printCard(cardId: string) {
  document.body.classList.add(`print-${cardId}`);
  window.print();
  window.setTimeout(() => {
    document.body.classList.remove(`print-${cardId}`);
  }, 600);
}

export default function CondolencesPage() {
  const [data, setData] = useState<CondolenceData>(defaultCondolenceData);

  const update = (key: keyof CondolenceData, value: string) => {
    setData((current) => ({ ...current, [key]: value }));
  };

  const handlePrint = (designId: DesignId) => {
    printCard(designId);
  };

  return (
    <div dir="rtl" className="condolences-studio min-h-screen bg-[#FAF5EA] text-[#241F18]">
      {/* رأس الصفحة — جزء من موقع مجالس العلم */}
      <header className="condolences-studio-header border-b border-[#E0D7C4] bg-white/80 backdrop-blur-sm no-print">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-4">
          <div>
            <Link href="/" className="text-sm font-bold text-[#164E3C] hover:underline">
              ← مجالس العلم
            </Link>
            <h1 className="mt-1 font-['Scheherazade_New','Amiri',serif] text-2xl font-bold text-[#164E3C]">
              تصاميم بطاقات التعزية
            </h1>
            <p className="text-sm text-[#5B5446]">أربعة قوالب عربية إسلامية — معاينة مباشرة وطباعة فورية</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-8">
        {/* حقول الإدخال — معاينة حية */}
        <section className="no-print mb-10 rounded-2xl border border-[#E0D7C4] bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-bold text-[#164E3C]">بيانات التعزية</h2>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#5B5446]">اسم المتوفى</span>
              <input
                className="rounded-lg border border-[#E0D7C4] px-3 py-2 outline-none focus:border-[#1F6E54]"
                value={data.deceasedName}
                onChange={(e) => update("deceasedName", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#5B5446]">اسم العائلة المُعزَّاة</span>
              <input
                className="rounded-lg border border-[#E0D7C4] px-3 py-2 outline-none focus:border-[#1F6E54]"
                value={data.familyName}
                onChange={(e) => update("familyName", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#5B5446]">تاريخ الوفاة</span>
              <input
                className="rounded-lg border border-[#E0D7C4] px-3 py-2 outline-none focus:border-[#1F6E54]"
                value={data.deathDate}
                onChange={(e) => update("deathDate", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-[#5B5446]">وقت العزاء</span>
              <input
                className="rounded-lg border border-[#E0D7C4] px-3 py-2 outline-none focus:border-[#1F6E54]"
                value={data.condolenceTime}
                onChange={(e) => update("condolenceTime", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-semibold text-[#5B5446]">مكان العزاء</span>
              <input
                className="rounded-lg border border-[#E0D7C4] px-3 py-2 outline-none focus:border-[#1F6E54]"
                value={data.condolenceLocation}
                onChange={(e) => update("condolenceLocation", e.target.value)}
              />
            </label>
            <label className="flex flex-col gap-1 text-sm md:col-span-2">
              <span className="font-semibold text-[#5B5446]">دعاء قصير</span>
              <textarea
                className="rounded-lg border border-[#E0D7C4] px-3 py-2 outline-none focus:border-[#1F6E54]"
                rows={2}
                value={data.prayer}
                onChange={(e) => update("prayer", e.target.value)}
              />
            </label>
          </div>
        </section>

        {/* شبكة التصاميم — عمودان على سطح المكتب */}
        <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {DESIGNS.map(({ id, title, Card }) => (
            <div
              key={id}
              className="condolence-design-wrap rounded-2xl border border-[#E0D7C4] bg-[#F0E8D6]/40 p-4"
              data-design={id}
            >
              <div className="no-print mb-3 flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-bold text-[#164E3C]">{title}</h3>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="rounded-lg bg-[#1F6E54] px-3 py-1.5 text-sm font-bold text-white hover:bg-[#164E3C]"
                    onClick={() => handlePrint(id)}
                  >
                    طباعة
                  </button>
                  <button
                    type="button"
                    className="rounded-lg border border-[#1F6E54] px-3 py-1.5 text-sm font-bold text-[#164E3C] hover:bg-[#CFE0D3]"
                    onClick={() => handlePrint(id)}
                  >
                    نسخ التصميم
                  </button>
                </div>
              </div>
              <Card data={data} id={id} />
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}
