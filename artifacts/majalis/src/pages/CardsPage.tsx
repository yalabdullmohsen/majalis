import { useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import html2canvas from "html2canvas";

type SizeKey = "square" | "story" | "wide";

type Template = {
  id: string;
  name: string;
  bg: string;
  textColor: string;
  subColor: string;
  border: string;
  font: string;
  swatch: string;
};

const TEMPLATES: Template[] = [
  {
    id: "dark_gold",
    name: "الكلاسيكي الذهبي",
    bg: "linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)",
    textColor: "#d4af37",
    subColor: "#f5f0e8",
    border: "2px solid #d4af37",
    font: "Scheherazade New",
    swatch: "#1a1a2e",
  },
  {
    id: "green_islamic",
    name: "الأخضر الإسلامي",
    bg: "linear-gradient(135deg, #0d4a2a 0%, #1a6b3a 100%)",
    textColor: "#ffffff",
    subColor: "#d4f7e7",
    border: "2px solid rgba(212,175,55,0.5)",
    font: "Scheherazade New",
    swatch: "#0d4a2a",
  },
  {
    id: "white_elegant",
    name: "الأبيض الأنيق",
    bg: "#ffffff",
    textColor: "#1e1b4b",
    subColor: "#4c1d95",
    border: "3px solid #4c1d95",
    font: "Scheherazade New",
    swatch: "#ffffff",
  },
  {
    id: "amber_warm",
    name: "العنبري الدافئ",
    bg: "linear-gradient(135deg, #451a03 0%, #7c2d12 100%)",
    textColor: "#fef3c7",
    subColor: "#fde68a",
    border: "2px solid #f59e0b",
    font: "Scheherazade New",
    swatch: "#451a03",
  },
];

const SIZE_MAP: Record<SizeKey, { width: number; height: number; label: string }> = {
  square: { width: 600, height: 600, label: "1:1 مربع" },
  story: { width: 400, height: 711, label: "9:16 ستوري" },
  wide: { width: 700, height: 400, label: "16:9 أفقي" },
};

export default function CardsPage() {
  const [quote, setQuote] = useState("إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى");
  const [source, setSource] = useState("متفق عليه");
  const [selectedTemplate, setSelectedTemplate] = useState(TEMPLATES[0]);
  const [size, setSize] = useState<SizeKey>("square");
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const dimensions = SIZE_MAP[size];

  const previewScale = useMemo(
    () => Math.min(1, 400 / dimensions.width, 520 / dimensions.height),
    [dimensions.width, dimensions.height]
  );

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(cardRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement("a");
      link.download = `بطاقة-مجالس-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div dir="rtl" className="min-h-screen bg-[#FAF5EA] py-8">
      <div className="mx-auto max-w-6xl px-4">
        <Link href="/" className="text-sm font-bold text-[#164E3C] hover:underline">
          ← المجلس العلمي
        </Link>
        <h1 className="mt-2 mb-8 text-3xl font-bold text-[#164E3C]">🎨 البطاقات الدعوية</h1>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="space-y-4 rounded-2xl border border-[#E0D7C4] bg-white p-6 shadow-sm">
              <h2 className="text-lg font-bold text-[#241F18]">✏️ المحتوى</h2>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={4}
                placeholder="أدخل الاقتباس أو الفائدة..."
                className="w-full resize-none rounded-xl border border-[#E0D7C4] px-4 py-3 text-right text-xl leading-relaxed outline-none focus:ring-2 focus:ring-[#1F6E54]"
                style={{ fontFamily: "'Scheherazade New', serif" }}
              />
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="المصدر — مثال: رواه البخاري"
                className="w-full rounded-xl border border-[#E0D7C4] px-4 py-3 text-right outline-none focus:ring-2 focus:ring-[#1F6E54]"
              />
            </div>

            <div className="rounded-2xl border border-[#E0D7C4] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#241F18]">🎨 القالب</h2>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t)}
                    className={`rounded-xl border-2 p-3 text-sm font-medium transition-all ${
                      selectedTemplate.id === t.id
                        ? "border-[#1F6E54] bg-[#CFE0D3]/50"
                        : "border-[#E0D7C4] hover:border-[#1F6E54]/40"
                    }`}
                  >
                    <span
                      className="mb-2 block h-8 w-full rounded-md border border-black/10"
                      style={{ background: t.swatch }}
                    />
                    <span className={selectedTemplate.id === t.id ? "text-[#164E3C]" : "text-[#5B5446]"}>
                      {t.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-[#E0D7C4] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold text-[#241F18]">📐 الحجم</h2>
              <div className="flex gap-2">
                {(Object.keys(SIZE_MAP) as SizeKey[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-all ${
                      size === s
                        ? "border-[#1F6E54] bg-[#1F6E54] text-white"
                        : "border-[#E0D7C4] text-[#5B5446] hover:bg-[#F0E8D6]"
                    }`}
                  >
                    {SIZE_MAP[s].label}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={downloadCard}
              disabled={isGenerating}
              className="w-full rounded-xl bg-[#1F6E54] py-4 text-lg font-bold text-white transition-all hover:bg-[#164E3C] disabled:opacity-50"
            >
              {isGenerating ? "⏳ جاري الإنشاء..." : "⬇️ تحميل البطاقة PNG"}
            </button>
          </div>

          <div className="flex flex-col items-center">
            <h2 className="mb-4 self-start text-lg font-bold text-[#241F18]">👁️ المعاينة</h2>
            <div
              className="overflow-hidden rounded-2xl shadow-2xl"
              style={{
                width: dimensions.width * previewScale,
                height: dimensions.height * previewScale,
              }}
            >
              <div
                style={{
                  transform: `scale(${previewScale})`,
                  transformOrigin: "top right",
                  width: dimensions.width,
                  height: dimensions.height,
                }}
              >
                <div
                  ref={cardRef}
                  style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    background: selectedTemplate.bg,
                    border: selectedTemplate.border,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: 48,
                    position: "relative",
                    direction: "rtl",
                    boxSizing: "border-box",
                  }}
                >
                  <div style={{ color: selectedTemplate.textColor, opacity: 0.3, fontSize: 32, marginBottom: 24 }}>
                    ✦ ✧ ✦
                  </div>
                  <p
                    style={{
                      fontFamily: "'Scheherazade New', serif",
                      fontSize: dimensions.width > 500 ? 36 : 28,
                      color: selectedTemplate.textColor,
                      textAlign: "center",
                      lineHeight: 1.8,
                      fontWeight: 700,
                      marginBottom: 32,
                    }}
                  >
                    {quote || "أدخل اقتباسك هنا"}
                  </p>
                  <div
                    style={{
                      color: selectedTemplate.subColor,
                      fontSize: 18,
                      textAlign: "center",
                      paddingTop: 16,
                      borderTop: `1px solid ${selectedTemplate.subColor}40`,
                      width: "60%",
                    }}
                  >
                    — {source}
                  </div>
                  <div
                    style={{
                      position: "absolute",
                      bottom: 24,
                      left: "50%",
                      transform: "translateX(-50%)",
                      color: selectedTemplate.subColor,
                      opacity: 0.6,
                      fontSize: 14,
                      fontFamily: "'Scheherazade New', serif",
                    }}
                  >
                    المجلس العلمي
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
