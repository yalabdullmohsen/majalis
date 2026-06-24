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
  swatch: string;
};

const TEMPLATES: Template[] = [
  {
    id: "emerald",
    name: "أخضر المجلس",
    bg: "linear-gradient(145deg, #164E3C 0%, #1F6E54 100%)",
    textColor: "#FAF5EA",
    subColor: "#CFE0D3",
    border: "2px solid rgba(250, 245, 234, 0.35)",
    swatch: "#164E3C",
  },
  {
    id: "parchment",
    name: "عاجي هادئ",
    bg: "linear-gradient(180deg, #FAF5EA 0%, #F0E8D6 100%)",
    textColor: "#164E3C",
    subColor: "#5B5446",
    border: "2px solid #E0D7C4",
    swatch: "#FAF5EA",
  },
  {
    id: "brass",
    name: "ذهبي راقٍ",
    bg: "linear-gradient(135deg, #241F18 0%, #3d3428 100%)",
    textColor: "#B08D2E",
    subColor: "#FAF5EA",
    border: "2px solid #B08D2E",
    swatch: "#241F18",
  },
  {
    id: "clean_white",
    name: "أبيض نظيف",
    bg: "#FFFFFF",
    textColor: "#164E3C",
    subColor: "#5B5446",
    border: "2px solid #1F6E54",
    swatch: "#FFFFFF",
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
  const [showLogo, setShowLogo] = useState(false);
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
      link.download = `بطاقة-المجلس-${Date.now()}.png`;
      link.href = canvas.toDataURL("image/png", 1.0);
      link.click();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div dir="rtl" className="cards-page">
      <div className="cards-page-inner">
        <Link href="/" className="cards-back-link">
          ← المجلس العلمي
        </Link>
        <h1 className="cards-page-title">البطاقات الدعوية</h1>

        <div className="cards-layout">
          <div className="cards-controls">
            <div className="ui-card cards-panel">
              <h2>المحتوى</h2>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={4}
                placeholder="أدخل الاقتباس أو الفائدة..."
                className="cards-textarea"
              />
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                placeholder="المصدر — مثال: رواه البخاري"
                className="cards-input"
              />
            </div>

            <div className="ui-card cards-panel">
              <h2>القالب</h2>
              <div className="cards-template-grid">
                {TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setSelectedTemplate(t)}
                    className={`cards-template-btn${selectedTemplate.id === t.id ? " is-active" : ""}`}
                  >
                    <span className="cards-template-swatch" style={{ background: t.swatch }} />
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="ui-card cards-panel">
              <h2>الحجم</h2>
              <div className="cards-size-row">
                {(Object.keys(SIZE_MAP) as SizeKey[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSize(s)}
                    className={`cards-size-btn${size === s ? " is-active" : ""}`}
                  >
                    {SIZE_MAP[s].label}
                  </button>
                ))}
              </div>
            </div>

            <label className="cond-checkbox">
              <input type="checkbox" checked={showLogo} onChange={(e) => setShowLogo(e.target.checked)} />
              <span>إظهار الشعار على البطاقة</span>
            </label>

            <button type="button" onClick={downloadCard} disabled={isGenerating} className="ui-card-btn cards-download-btn">
              {isGenerating ? "جاري الإنشاء..." : "تحميل البطاقة PNG"}
            </button>
          </div>

          <div className="cards-preview-wrap">
            <h2>المعاينة</h2>
            <div
              className="cards-preview-frame"
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
                  className="cards-export-canvas"
                  style={{
                    width: dimensions.width,
                    height: dimensions.height,
                    background: selectedTemplate.bg,
                    border: selectedTemplate.border,
                  }}
                >
                  <p
                    className="cards-export-quote"
                    style={{
                      fontSize: dimensions.width > 500 ? 34 : 26,
                      color: selectedTemplate.textColor,
                    }}
                  >
                    {quote || "أدخل اقتباسك هنا"}
                  </p>
                  <div
                    className="cards-export-source"
                    style={{
                      color: selectedTemplate.subColor,
                      borderTop: `1px solid ${selectedTemplate.subColor}40`,
                    }}
                  >
                    {source}
                  </div>
                  {showLogo && (
                    <img src="/logo.png" alt="" className="cards-export-logo" aria-hidden="true" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
