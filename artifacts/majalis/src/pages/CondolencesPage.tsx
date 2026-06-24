import { useRef, useState } from "react";

const TEMPLATES = [
  {
    id: "dark_classic",
    name: "الكلاسيكي الداكن",
    bg: "#1a1a2e",
    borderColor: "#d4af37",
    mainText: "#d4af37",
    subText: "#f5f0e8",
    accent: "#d4af37",
    divider: "#d4af37",
  },
  {
    id: "deep_green",
    name: "الأخضر الإسلامي",
    bg: "#0d4a2a",
    borderColor: "#d4af37",
    mainText: "#ffffff",
    subText: "#d4f7e7",
    accent: "#fbbf24",
    divider: "#d4af37",
  },
  {
    id: "white_purple",
    name: "الأبيض الأرجواني",
    bg: "#f8f5ff",
    borderColor: "#6b21a8",
    mainText: "#1e1b4b",
    subText: "#4c1d95",
    accent: "#7c3aed",
    divider: "#6b21a8",
  },
  {
    id: "dark_gray",
    name: "الرمادي الفاخر",
    bg: "#1c1c1c",
    borderColor: "#a0a0a0",
    mainText: "#f5f0e8",
    subText: "#d4af37",
    accent: "#d4af37",
    divider: "#a0a0a0",
  },
];

const defaultData = {
  deceasedName: "الحاج محمد بن عبدالله الفلاني",
  familyName: "عائلة الفلاني الكريمة",
  deathDate: "١٥ محرم ١٤٤٦ هـ",
  condolenceTime: "من بعد صلاة المغرب حتى العشاء",
  condolenceLocation: "ديوانية العائلة — مدينة الكويت",
  prayer: "رحمه الله وأسكنه فسيح جناته",
  phone: "",
};

export default function CondolencesPage() {
  const [data, setData] = useState(defaultData);
  const [tmpl, setTmpl] = useState(TEMPLATES[0]);
  const [printing, setPrinting] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const update = (field: string, val: string) =>
    setData((prev) => ({ ...prev, [field]: val }));

  const handlePrint = () => {
    setPrinting(true);
    setTimeout(() => {
      window.print();
      setPrinting(false);
    }, 300);
  };

  const fields = [
    { key: "deceasedName", label: "اسم المتوفى" },
    { key: "familyName", label: "العائلة المُعزَّاة" },
    { key: "deathDate", label: "تاريخ الوفاة" },
    { key: "condolenceTime", label: "وقت العزاء" },
    { key: "condolenceLocation", label: "مكان العزاء" },
    { key: "prayer", label: "الدعاء" },
    { key: "phone", label: "رقم التواصل (اختياري)" },
  ];

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #print-card, #print-card * { visibility: visible !important; }
          #print-card {
            position: fixed !important;
            inset: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            border: none !important;
            border-radius: 0 !important;
          }
        }
      `}</style>

      <div dir="rtl" className="min-h-screen bg-[#f4f1eb] py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1
              className="text-4xl font-bold text-[#1a1a2e]"
              style={{ fontFamily: "Scheherazade New, serif" }}
            >
              🤲 تصاميم بطاقات التعزية
            </h1>
            <p className="text-gray-600 mt-2">
              أربعة قوالب عربية إسلامية — معاينة مباشرة وطباعة فورية
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            <div className="space-y-5 no-print">
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
                <h2 className="font-bold text-gray-700 mb-3 text-lg">🎨 اختر القالب</h2>
                <div className="grid grid-cols-2 gap-3">
                  {TEMPLATES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setTmpl(t)}
                      style={{
                        backgroundColor: t.bg,
                        borderColor: tmpl.id === t.id ? "#16a34a" : t.borderColor,
                      }}
                      className={`p-3 rounded-xl border-2 text-sm font-bold transition-all
                        ${tmpl.id === t.id ? "ring-2 ring-green-500 ring-offset-2" : "opacity-80 hover:opacity-100"}`}
                    >
                      <span style={{ color: t.mainText, fontFamily: "Scheherazade New, serif" }}>
                        {t.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5 space-y-3">
                <h2 className="font-bold text-gray-700 text-lg mb-1">📝 بيانات التعزية</h2>
                {fields.map(({ key, label }) => (
                  <div key={key}>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">{label}</label>
                    <input
                      value={(data as Record<string, string>)[key]}
                      onChange={(e) => update(key, e.target.value)}
                      className="w-full border border-gray-300 rounded-xl px-4 py-2.5 text-right text-base
                        focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                      style={{ fontFamily: "Scheherazade New, serif" }}
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handlePrint}
                disabled={printing}
                className="w-full bg-[#1a1a2e] text-[#d4af37] py-4 rounded-2xl font-bold text-xl
                  hover:bg-[#16213e] disabled:opacity-60 transition-all shadow-lg border border-[#d4af37]"
                style={{ fontFamily: "Scheherazade New, serif" }}
              >
                {printing ? "⏳ جاري التحضير..." : "🖨️ طباعة البطاقة"}
              </button>

              <p className="text-center text-gray-400 text-sm">
                عند الطباعة اختر &quot;حفظ كـ PDF&quot; لحفظ البطاقة
              </p>
            </div>

            <div>
              <h2 className="font-bold text-gray-700 text-lg mb-4 no-print">👁️ المعاينة المباشرة</h2>

              <div
                id="print-card"
                ref={cardRef}
                dir="rtl"
                style={{
                  backgroundColor: tmpl.bg,
                  border: `3px solid ${tmpl.borderColor}`,
                  fontFamily: "Scheherazade New, serif",
                  minHeight: "560px",
                  position: "relative",
                  overflow: "hidden",
                }}
                className="rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-5"
              >
                <svg style={{ position: "absolute", top: 12, right: 12, color: tmpl.borderColor, opacity: 0.6 }} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                  <path d="M2 2 L16 2 L2 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <svg style={{ position: "absolute", top: 12, left: 12, color: tmpl.borderColor, opacity: 0.6 }} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                  <path d="M38 2 L24 2 L38 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <svg style={{ position: "absolute", bottom: 12, right: 12, color: tmpl.borderColor, opacity: 0.6 }} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                  <path d="M2 38 L16 38 L2 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>
                <svg style={{ position: "absolute", bottom: 12, left: 12, color: tmpl.borderColor, opacity: 0.6 }} width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden>
                  <path d="M38 38 L24 38 L38 24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                </svg>

                <div style={{ color: tmpl.mainText, fontSize: "2rem", fontWeight: 700, textAlign: "center", lineHeight: 1.8, marginTop: 16 }}>
                  إنا لله وإنا إليه راجعون
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "80%" }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: tmpl.divider, opacity: 0.4 }} />
                  <span style={{ color: tmpl.accent, fontSize: "1.1rem" }}>✦ ✧ ✦</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: tmpl.divider, opacity: 0.4 }} />
                </div>

                <div style={{ textAlign: "center" }}>
                  <p style={{ color: tmpl.subText, fontSize: "1rem", opacity: 0.8, marginBottom: 6 }}>
                    انتقل إلى رحمة الله تعالى
                  </p>
                  <p style={{ color: tmpl.mainText, fontSize: "1.8rem", fontWeight: 700 }}>
                    {data.deceasedName}
                  </p>
                  <p style={{ color: tmpl.subText, fontSize: "1.1rem", marginTop: 4, opacity: 0.85 }}>
                    {data.deathDate}
                  </p>
                </div>

                <div style={{
                  border: `1px solid ${tmpl.divider}`,
                  borderRadius: 12,
                  padding: "10px 24px",
                  textAlign: "center",
                }}>
                  <p style={{ color: tmpl.accent, fontSize: "1.15rem", fontStyle: "italic" }}>
                    {data.prayer}
                  </p>
                </div>

                {(data.condolenceTime || data.condolenceLocation) && (
                  <div style={{
                    backgroundColor: `${tmpl.borderColor}18`,
                    border: `1px solid ${tmpl.borderColor}40`,
                    borderRadius: 12,
                    padding: "12px 24px",
                    textAlign: "center",
                    width: "90%",
                  }}>
                    <p style={{ color: tmpl.subText, fontSize: "0.85rem", opacity: 0.7, marginBottom: 6 }}>
                      موعد ومكان العزاء
                    </p>
                    {data.condolenceTime && (
                      <p style={{ color: tmpl.mainText, fontSize: "1.05rem", fontWeight: 600 }}>
                        🕌 {data.condolenceTime}
                      </p>
                    )}
                    {data.condolenceLocation && (
                      <p style={{ color: tmpl.mainText, fontSize: "1.05rem", marginTop: 4 }}>
                        📍 {data.condolenceLocation}
                      </p>
                    )}
                    {data.phone && (
                      <p style={{ color: tmpl.accent, fontSize: "1rem", marginTop: 6, direction: "ltr" }}>
                        📞 {data.phone}
                      </p>
                    )}
                  </div>
                )}

                <p style={{ color: tmpl.subText, fontSize: "1rem", textAlign: "center", opacity: 0.85 }}>
                  تتقدم <strong style={{ color: tmpl.mainText }}>{data.familyName}</strong> بخالص العزاء والمواساة
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: 12, width: "80%" }}>
                  <div style={{ flex: 1, height: 1, backgroundColor: tmpl.divider, opacity: 0.4 }} />
                  <span style={{ color: tmpl.accent, fontSize: "1.1rem" }}>✦ ✧ ✦</span>
                  <div style={{ flex: 1, height: 1, backgroundColor: tmpl.divider, opacity: 0.4 }} />
                </div>

                <p style={{ color: tmpl.subText, fontSize: "0.8rem", opacity: 0.45, marginBottom: 8 }}>
                  مجالس العلم — majlisilm.com
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
