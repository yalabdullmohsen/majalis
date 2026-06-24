import { useRef, useState } from "react";
import { Link } from "wouter";
import html2canvas from "html2canvas";

type CondolenceTemplate = {
  id: string;
  name: string;
  bg: string;
  border: string;
  mainColor: string;
  subColor: string;
  accent: string;
};

type CondolenceFormData = {
  deceasedName: string;
  familyName: string;
  deathDate: string;
  condolenceTime: string;
  condolenceLocation: string;
  prayer: string;
  phone: string;
};

const CONDOLENCE_TEMPLATES: CondolenceTemplate[] = [
  {
    id: "dark_classic",
    name: "الكلاسيكي الداكن",
    bg: "#1a1a2e",
    border: "#d4af37",
    mainColor: "#d4af37",
    subColor: "#f5f0e8",
    accent: "#d4af37",
  },
  {
    id: "deep_green",
    name: "الأخضر الإسلامي",
    bg: "#0d4a2a",
    border: "#d4af37",
    mainColor: "#ffffff",
    subColor: "#d4f7e7",
    accent: "#fbbf24",
  },
  {
    id: "white_purple",
    name: "الأبيض الأرجواني",
    bg: "#ffffff",
    border: "#6b21a8",
    mainColor: "#1e1b4b",
    subColor: "#4c1d95",
    accent: "#7c3aed",
  },
  {
    id: "dark_gray",
    name: "الرمادي الدمشقي",
    bg: "#1a1a1a",
    border: "#9ca3af",
    mainColor: "#f5f0e8",
    subColor: "#d4af37",
    accent: "#9ca3af",
  },
];

const defaultData: CondolenceFormData = {
  deceasedName: "الحاج محمد بن عبدالله الفلاني",
  familyName: "عائلة الفلاني الكريمة",
  deathDate: "١٥ محرم ١٤٤٦ هـ",
  condolenceTime: "من بعد صلاة المغرب حتى العشاء",
  condolenceLocation: "ديوانية العائلة — مدينة الكويت",
  prayer: "رحمه الله وأسكنه فسيح جناته",
  phone: "",
};

const FORM_FIELDS: Array<{ field: keyof CondolenceFormData; label: string; placeholder: string }> = [
  { field: "deceasedName", label: "اسم الفقيد", placeholder: "الحاج محمد بن عبدالله" },
  { field: "familyName", label: "العائلة المعزّاة", placeholder: "عائلة الفلاني الكريمة" },
  { field: "deathDate", label: "تاريخ الوفاة", placeholder: "١٥ محرم ١٤٤٦ هـ" },
  { field: "condolenceTime", label: "وقت العزاء", placeholder: "من بعد المغرب حتى العشاء" },
  { field: "condolenceLocation", label: "مكان العزاء", placeholder: "ديوانية العائلة" },
  { field: "prayer", label: "الدعاء", placeholder: "رحمه الله وأسكنه فسيح جناته" },
  { field: "phone", label: "رقم التواصل (اختياري)", placeholder: "+965 XXXX XXXX" },
];

const CARD_WIDTH = 600;
const CARD_MIN_HEIGHT = 750;
const PREVIEW_SCALE = 0.6;

export default function CondolencesPage() {
  const [data, setData] = useState(defaultData);
  const [selectedTemplate, setSelectedTemplate] = useState(CONDOLENCE_TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const update = (field: keyof CondolenceFormData, value: string) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true });
      const link = document.createElement("a");
      link.download = `تعزية-${data.deceasedName}-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  const t = selectedTemplate;

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAF5EA] py-8">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/" className="text-sm font-bold text-[#164E3C] hover:underline">
          ← مجالس العلم
        </Link>
        <h1 className="mt-2 text-3xl font-bold text-[#164E3C]">🤲 بطاقات التعزية الإسلامية</h1>
        <p className="mb-8 text-[#5B5446]">إنا لله وإنا إليه راجعون — أنشئ بطاقة تعزية احترافية</p>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="rounded-2xl border border-[#E0D7C4] bg-white p-5 shadow-sm">
              <h2 className="mb-3 font-bold text-[#241F18]">🎨 القالب</h2>
              <div className="grid grid-cols-2 gap-2">
                {CONDOLENCE_TEMPLATES.map((tmpl) => (
                  <button
                    key={tmpl.id}
                    type="button"
                    onClick={() => setSelectedTemplate(tmpl)}
                    className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                      selectedTemplate.id === tmpl.id
                        ? "border-[#1F6E54] ring-2 ring-[#CFE0D3]"
                        : "border-[#E0D7C4]"
                    }`}
                    style={{ backgroundColor: tmpl.bg }}
                  >
                    <span style={{ color: tmpl.mainColor }}>{tmpl.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 rounded-2xl border border-[#E0D7C4] bg-white p-5 shadow-sm">
              <h2 className="mb-1 font-bold text-[#241F18]">📝 البيانات</h2>
              {FORM_FIELDS.map(({ field, label, placeholder }) => (
                <div key={field}>
                  <label className="mb-1 block text-xs font-medium text-[#5B5446]">{label}</label>
                  <input
                    value={data[field]}
                    onChange={(e) => update(field, e.target.value)}
                    placeholder={placeholder}
                    className="w-full rounded-lg border border-[#E0D7C4] px-3 py-2 text-right text-sm outline-none focus:ring-2 focus:ring-[#1F6E54]"
                    style={{ fontFamily: "'Scheherazade New', serif" }}
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={downloadCard}
              disabled={isGenerating}
              className="w-full rounded-xl bg-[#164E3C] py-4 text-lg font-bold text-white transition-all hover:bg-[#0f352b] disabled:opacity-50"
            >
              {isGenerating ? "⏳ جاري الإنشاء..." : "⬇️ تحميل بطاقة التعزية"}
            </button>
          </div>

          <div>
            <h2 className="mb-4 text-lg font-bold text-[#241F18]">👁️ المعاينة</h2>
            <div
              className="flex justify-center overflow-hidden rounded-2xl shadow-2xl"
              style={{
                width: CARD_WIDTH * PREVIEW_SCALE,
                minHeight: CARD_MIN_HEIGHT * PREVIEW_SCALE,
              }}
            >
              <div
                style={{
                  transform: `scale(${PREVIEW_SCALE})`,
                  transformOrigin: "top center",
                  width: CARD_WIDTH,
                }}
              >
                <div
                  ref={cardRef}
                  style={{
                    width: CARD_WIDTH,
                    minHeight: CARD_MIN_HEIGHT,
                    backgroundColor: t.bg,
                    border: `2px solid ${t.border}`,
                    padding: "48px 40px",
                    direction: "rtl",
                    fontFamily: "'Scheherazade New', serif",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    gap: 20,
                    boxSizing: "border-box",
                  }}
                >
                  <div
                    style={{
                      color: t.mainColor,
                      fontSize: 42,
                      fontWeight: 700,
                      textAlign: "center",
                      lineHeight: 1.7,
                    }}
                  >
                    إنا لله وإنا إليه راجعون
                  </div>

                  <div style={{ color: t.accent, opacity: 0.6, fontSize: 24 }}>✦ ✧ ✦</div>

                  <div style={{ textAlign: "center" }}>
                    <div style={{ color: t.subColor, fontSize: 18, opacity: 0.8 }}>انتقل إلى رحمة الله</div>
                    <div style={{ color: t.mainColor, fontSize: 36, fontWeight: 700, marginTop: 8 }}>
                      {data.deceasedName}
                    </div>
                    <div style={{ color: t.subColor, fontSize: 20, marginTop: 4, opacity: 0.8 }}>
                      {data.deathDate}
                    </div>
                  </div>

                  <div style={{ width: "70%", height: 1, backgroundColor: t.border, opacity: 0.4 }} />

                  <div style={{ color: t.accent, fontSize: 22, textAlign: "center", fontStyle: "italic" }}>
                    {data.prayer}
                  </div>

                  {(data.condolenceTime || data.condolenceLocation) && (
                    <div
                      style={{
                        border: `1px solid ${t.border}`,
                        borderRadius: 12,
                        padding: "16px 24px",
                        textAlign: "center",
                        width: "90%",
                      }}
                    >
                      <div style={{ color: t.subColor, fontSize: 18, opacity: 0.8, marginBottom: 8 }}>
                        موعد ومكان العزاء
                      </div>
                      {data.condolenceTime && (
                        <div style={{ color: t.mainColor, fontSize: 20 }}>{data.condolenceTime}</div>
                      )}
                      {data.condolenceLocation && (
                        <div style={{ color: t.mainColor, fontSize: 20, marginTop: 4 }}>{data.condolenceLocation}</div>
                      )}
                      {data.phone && (
                        <div style={{ color: t.accent, fontSize: 18, marginTop: 8 }}>{data.phone}</div>
                      )}
                    </div>
                  )}

                  <div style={{ color: t.subColor, fontSize: 20, textAlign: "center", opacity: 0.9 }}>
                    تتقدم {data.familyName} بخالص العزاء والمواساة
                  </div>

                  <div style={{ color: t.subColor, opacity: 0.4, fontSize: 14, marginTop: "auto" }}>
                    مجالس العلم
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
