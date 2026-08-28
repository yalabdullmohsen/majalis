import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "wouter";
import { ShareButtons } from "@/components/ContentActions";
import {
  downloadCardImage,
  exportSocialCard,
  type CardExportPreset,
} from "@/lib/card-image-export";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { applyPageSeo } from "@/lib/seo";
import "@/styles/pages/cards.css";

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

const DEFAULT_QUOTE = "إنما الأعمال بالنيات، وإنما لكل امرئ ما نوى";
const DEFAULT_SOURCE = "متفق عليه";

const TEMPLATES: Template[] = [
  {
    id: "classic_black",
    name: "أسود هادئ",
    bg: "linear-gradient(160deg, #0f0f0f 0%, #1a1a1a 100%)",
    textColor: "#ffffff",
    subColor: "#FAF5EA",
    border: "1px solid rgba(250, 245, 234, 0.3)",
    swatch: "#0f0f0f",
  },
  {
    id: "clean_white",
    name: "أبيض نظيف",
    bg: "#ffffff",
    textColor: "#123F2E",
    subColor: "#4D7A64",
    border: "1px solid #123F2E",
    swatch: "#ffffff",
  },
  {
    id: "ivory_deep",
    name: "أخضر الليل",
    bg: "linear-gradient(135deg, #0a1f18 0%, #0d2e24 100%)",
    textColor: "#FAF5EA",
    subColor: "#CFE0D3",
    border: "1px solid rgba(250, 245, 234, 0.35)",
    swatch: "#0a1f18",
  },
  {
    id: "emerald",
    name: "أخضر داكن",
    bg: "linear-gradient(145deg, #0d2e24 0%, #123F2E 100%)",
    textColor: "#FAF5EA",
    subColor: "#CFE0D3",
    border: "1px solid rgba(250, 245, 234, 0.3)",
    swatch: "#123F2E",
  },
];

const SIZE_MAP: Record<SizeKey, { width: number; height: number; label: string }> = {
  square: { width: 600, height: 600, label: "1:1 مربع" },
  story: { width: 400, height: 711, label: "9:16 ستوري" },
  wide: { width: 700, height: 400, label: "16:9 أفقي" },
};

export default function CardsPage() {
  const [quote, setQuote] = useState(DEFAULT_QUOTE);

  useEffect(() => {
    applyPageSeo({
      path: "/cards",
      title: "بطاقات الاقتباسات الإسلامية | سُنّة",
      description: "أنشئ بطاقات اقتباسات إسلامية جميلة قابلة للمشاركة، اختر القالب والحجم وصدّر بجودة عالية. محتوى معتمد في منهج سُنّة",
      keywords: ["بطاقات إسلامية", "اقتباسات إسلامية", "بطاقات دينية", "صور إسلامية", "بطاقات قرآنية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "صانع البطاقات الإسلامية",
          url: "https://majlisilm.com/cards",
          description: "أنشئ بطاقات اقتباسات إسلامية جميلة قابلة للمشاركة؛ محتوى معتمد في منهج سُنّة",
          applicationCategory: "ReligiousApplication",
          operatingSystem: "Web",
          inLanguage: "ar",
          provider: { "@type": "Organization", name: "سُنّة", url: "https://majlisilm.com" },
        },
      ],
    });
  }, []);
  const [source, setSource] = useState(DEFAULT_SOURCE);
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

  const resetForm = () => {
    setQuote(DEFAULT_QUOTE);
    setSource(DEFAULT_SOURCE);
    setSelectedTemplate(TEMPLATES[0]);
    setSize("square");
    setShowLogo(false);
  };

  const exportPreset = ((): CardExportPreset => {
    if (size === "story") return "story";
    if (size === "wide") return "wide";
    return "feed";
  })();

  const downloadCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      const pixelRatio = exportPreset === "story" ? 4 : 3;
      await downloadCardImage(cardRef.current, `بطاقة-${Date.now()}.png`, pixelRatio);
    } finally {
      setIsGenerating(false);
    }
  };

  const shareCard = async () => {
    if (!cardRef.current) return;
    setIsGenerating(true);
    try {
      await exportSocialCard(cardRef.current, exportPreset, {
        fileName: `بطاقة-${Date.now()}.png`,
        title: "بطاقة سُنّة",
        text: `${quote}\n— ${source}`,
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div dir="rtl" className="cards-page">
      <div className="cards-page-inner">
        <Link href="/" className="cards-back-link">
          سُنّة
        </Link>
        <h1 className="cards-page-title">البطاقات الدعوية</h1>
        <p className="cond-page-desc">صمّم بطاقة للمشاركة على واتساب وإنستغرام، بدون حقوق أو شعار افتراضي.</p>

        <div className="cards-layout">
          <div className="cards-controls">
            <div className="ui-card cards-panel">
              <h2>المحتوى</h2>
              <textarea
                value={quote}
                onChange={(e) => setQuote(e.target.value)}
                rows={4}
                aria-label="أدخل الاقتباس أو الفائدة" placeholder="أدخل الاقتباس أو الفائدة..."
                className="cards-textarea"
              />
              <input
                value={source}
                onChange={(e) => setSource(e.target.value)}
                aria-label="المصدر، مثال: رواه البخاري" placeholder="المصدر، مثال: رواه البخاري"
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
                    <span className="cards-template-swatch" style={{ "--swatch-bg": t.swatch } as React.CSSProperties} />
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
              <span>إظهار الشعار (اختياري)</span>
            </label>

            <div className="template-action-row">
              <button type="button" className="ui-card-btn template-btn template-btn--ghost" onClick={resetForm}>
                إعادة ضبط
              </button>
              <button type="button" onClick={() => void shareCard()} disabled={isGenerating} className="ui-card-btn template-btn template-btn--ghost">
                {isGenerating ? "جاري الإنشاء..." : "مشاركة"}
              </button>
              <button type="button" onClick={() => void downloadCard()} disabled={isGenerating} className="ui-card-btn template-btn template-btn--primary">
                {isGenerating ? "جاري الإنشاء..." : "تحميل الصورة"}
              </button>
            </div>
          </div>

          <div className="cards-preview-wrap">
            <h2>معاينة</h2>
            <div
              className="cards-preview-frame"
              style={{
                "--cpf-w": `${dimensions.width * previewScale}px`,
                "--cpf-h": `${dimensions.height * previewScale}px`,
                "--cpf-scale": previewScale,
                "--cpf-cw": `${dimensions.width}px`,
                "--cpf-ch": `${dimensions.height}px`,
                "--card-bg": selectedTemplate.bg,
                "--card-border": selectedTemplate.border,
                "--card-text": selectedTemplate.textColor,
                "--card-sub": selectedTemplate.subColor,
                "--card-quote-fs": `${dimensions.width > 500 ? 34 : 26}px`,
              } as React.CSSProperties}
            >
              <div className="cards-export-scaler">
                <div
                  ref={cardRef}
                  className="cards-export-canvas"
                >
                  <p className="cards-export-quote">
                    {quote || "أدخل اقتباسك هنا"}
                  </p>
                  <div className="cards-export-source">
                    {source}
                  </div>
                  {showLogo && (
                    <img src="/logo.png" alt="" className="cards-export-logo" aria-hidden="true" loading="eager" decoding="sync" width="512" height="512" />
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <RelatedKnowledge kind="fawaid" query="فوائد دعوية" title="فوائد ومواد ذات صلة" limit={6} />
      <div className="twh-share">
        <ShareButtons title="البطاقات الدعوية — سُنّة" url="https://majlisilm.com/cards" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz sectionId="adhkar" title="اختبر معلوماتك في الأخلاق والعقيدة" count={4} />
      </div>
    </div>
  );
}
