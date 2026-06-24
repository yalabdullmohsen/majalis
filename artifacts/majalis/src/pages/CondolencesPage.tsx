import { useEffect, useMemo, useState, type ChangeEvent, type FormEvent } from "react";
import { C } from "@/lib/theme";

type TemplateId = "classic" | "white" | "ornamental" | "formal" | "modern" | "martyrs";

type CondolenceCard = {
  id: string;
  phrase: string;
  deceasedName: string;
  hijriDate: string;
  gregorianDate: string;
  familyName: string;
  burialPlace: string;
  dua: string;
  templateId: TemplateId;
  logoDataUrl?: string;
  createdAt: string;
};

const STORAGE_KEY = "majalis-condolences-archive";

const PHRASES = [
  "إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ",
  "البقاء لله",
  "عظم الله أجركم وأحسن عزاءكم",
];

const DEFAULT_DUA = "نسأل الله له الرحمة والمغفرة وأن يسكنه فسيح جناته.";

const TEMPLATES: Record<TemplateId, { name: string; desc: string; className: string; accent: string; dark: boolean }> = {
  classic: { name: "كلاسيكي أسود ذهبي", desc: "خلفية داكنة وتفاصيل ذهبية هادئة.", className: "condolence-template-classic", accent: "#C8A84D", dark: true },
  white: { name: "أبيض بسيط", desc: "مساحات بيضاء وخطوط ناعمة.", className: "condolence-template-white", accent: "#1F6E54", dark: false },
  ornamental: { name: "إسلامي بزخارف عربية", desc: "زخارف هندسية عربية وإطار فاخر.", className: "condolence-template-ornamental", accent: "#B08D2E", dark: true },
  formal: { name: "رسمي للمؤسسات", desc: "تصميم منضبط يصلح للجهات الرسمية.", className: "condolence-template-formal", accent: "#1F2937", dark: false },
  modern: { name: "حديث بخلفية هادئة", desc: "درجات هادئة وتدرجات لطيفة.", className: "condolence-template-modern", accent: "#315B61", dark: false },
  martyrs: { name: "للشهداء والعلماء والدعاة", desc: "تصميم وقور بعناصر تكريم ودعاء.", className: "condolence-template-martyrs", accent: "#7C2D12", dark: false },
};

const INITIAL_CARD: CondolenceCard = {
  id: "",
  phrase: PHRASES[0],
  deceasedName: "محمد عبدالله المطيري",
  hijriDate: "1448/02/15 هـ",
  gregorianDate: "2026/08/30 م",
  familyName: "",
  burialPlace: "",
  dua: DEFAULT_DUA,
  templateId: "classic",
  createdAt: "",
};

function createId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function withIdentity(card: CondolenceCard): CondolenceCard {
  return {
    ...card,
    id: card.id || createId(),
    createdAt: card.createdAt || new Date().toISOString(),
  };
}

function readArchive(): CondolenceCard[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

function writeArchive(cards: CondolenceCard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cards.slice(0, 30)));
}

function encodeCard(card: CondolenceCard) {
  const bytes = new TextEncoder().encode(JSON.stringify(card));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeCard(value: string): CondolenceCard | null {
  try {
    const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
    const binary = atob(padded);
    const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes));
  } catch {
    return null;
  }
}

function getSharedCardFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const encoded = params.get("card");
  return encoded ? decodeCard(encoded) : null;
}

function publicCardUrl(card: CondolenceCard) {
  const url = new URL(window.location.href);
  url.pathname = `${import.meta.env.BASE_URL.replace(/\/$/, "")}/condolences`.replace(/\/+/g, "/");
  url.search = `?card=${encodeCard(card)}`;
  url.hash = "";
  return url.toString();
}

function escapeXml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function wrapWords(value: string, maxLength: number) {
  const words = value.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  words.forEach((word) => {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxLength && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  });
  if (current) lines.push(current);
  return lines.slice(0, 4);
}

function svgText(lines: string[], x: number, startY: number, fontSize: number, fill: string, weight = 400, lineGap = 1.45) {
  return lines.map((line, index) => (
    `<text x="${x}" y="${startY + index * fontSize * lineGap}" text-anchor="middle" direction="rtl" unicode-bidi="plaintext" font-family="Amiri, Georgia, serif" font-size="${fontSize}" font-weight="${weight}" fill="${fill}">${escapeXml(line)}</text>`
  )).join("");
}

function svgBackground(template: TemplateId) {
  switch (template) {
    case "white":
      return { bg: "#FDFBF5", fg: "#1E2A24", muted: "#6B6254", frame: "#D8CBA9", extra: '<circle cx="700" cy="250" r="150" fill="#F2E8CF" opacity="0.45" />' };
    case "ornamental":
      return { bg: "#102820", fg: "#FAF5EA", muted: "#D7C99B", frame: "#B08D2E", extra: '<path d="M160 160h1080v1480H160z" fill="none" stroke="#B08D2E" stroke-width="8"/><path d="M230 230h940v1340H230z" fill="none" stroke="#B08D2E" stroke-width="2" stroke-dasharray="14 18"/>' };
    case "formal":
      return { bg: "#F7F7F3", fg: "#111827", muted: "#4B5563", frame: "#111827", extra: '<rect x="130" y="130" width="1140" height="1540" fill="none" stroke="#111827" stroke-width="3"/><rect x="170" y="170" width="1060" height="1460" fill="none" stroke="#C9C9C0" stroke-width="2"/>' };
    case "modern":
      return { bg: "#EEF4F2", fg: "#183A3D", muted: "#536866", frame: "#87A39D", extra: '<circle cx="180" cy="200" r="260" fill="#D9E8E3"/><circle cx="1210" cy="1580" r="310" fill="#D7E1DE"/>' };
    case "martyrs":
      return { bg: "#FFF8ED", fg: "#3B1F12", muted: "#7C4A2D", frame: "#7C2D12", extra: '<path d="M700 170c86 80 158 140 250 178-92 38-164 98-250 178-86-80-158-140-250-178 92-38 164-98 250-178z" fill="#F5E6C8" opacity="0.75"/>' };
    default:
      return { bg: "#111111", fg: "#FAF5EA", muted: "#D7C99B", frame: "#C8A84D", extra: '<rect x="140" y="140" width="1120" height="1520" fill="none" stroke="#C8A84D" stroke-width="5"/><rect x="185" y="185" width="1030" height="1430" fill="none" stroke="#C8A84D" stroke-width="1.5"/>' };
  }
}

function buildCardSvg(card: CondolenceCard) {
  const style = svgBackground(card.templateId);
  const familyLine = card.familyName ? `أسرة ${card.familyName}` : "";
  const placeLine = card.burialPlace ? `مكان الدفن أو العزاء: ${card.burialPlace}` : "";
  const duaLines = wrapWords(card.dua || DEFAULT_DUA, 32);
  const logo = card.logoDataUrl ? `<image href="${card.logoDataUrl}" x="600" y="235" width="200" height="120" preserveAspectRatio="xMidYMid meet" />` : "";

  return `
<svg xmlns="http://www.w3.org/2000/svg" width="1400" height="1800" viewBox="0 0 1400 1800">
  <rect width="1400" height="1800" fill="${style.bg}" />
  ${style.extra}
  ${logo}
  ${svgText([card.phrase], 700, card.logoDataUrl ? 430 : 340, 58, style.frame, 700)}
  ${svgText(["انتقل إلى رحمة الله تعالى"], 700, 545, 42, style.muted)}
  ${svgText(["المرحوم"], 700, 685, 38, style.muted, 700)}
  ${svgText(wrapWords(card.deceasedName || "اسم المتوفى", 24), 700, 790, 74, style.fg, 700, 1.25)}
  ${familyLine ? svgText([familyLine], 700, 965, 38, style.muted, 700) : ""}
  ${svgText(["تاريخ الوفاة"], 700, 1120, 34, style.muted, 700)}
  ${svgText([card.hijriDate, card.gregorianDate].filter(Boolean), 700, 1200, 44, style.fg, 700, 1.38)}
  ${placeLine ? svgText(wrapWords(placeLine, 36), 700, 1370, 32, style.muted) : ""}
  ${svgText(duaLines, 700, placeLine ? 1490 : 1425, 42, style.fg, 400, 1.45)}
</svg>`;
}

async function downloadCardImage(card: CondolenceCard) {
  const svg = buildCardSvg(card);
  const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const image = new Image();
  image.decoding = "async";
  image.src = url;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1800;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("تعذر إنشاء الصورة.");
  context.drawImage(image, 0, 0);
  URL.revokeObjectURL(url);
  const imageBlob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => result ? resolve(result) : reject(new Error("تعذر تحميل الصورة.")), "image/png", 1);
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(imageBlob);
  link.download = `تعزية-${(card.deceasedName || "بطاقة").replace(/\s+/g, "-")}.png`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function cardText(card: CondolenceCard) {
  return [
    card.phrase,
    "",
    "انتقل إلى رحمة الله تعالى",
    "المرحوم",
    card.deceasedName,
    card.familyName ? `أسرة ${card.familyName}` : "",
    card.hijriDate || card.gregorianDate ? "تاريخ الوفاة" : "",
    card.hijriDate,
    card.gregorianDate,
    card.burialPlace ? `مكان الدفن أو العزاء: ${card.burialPlace}` : "",
    card.dua || DEFAULT_DUA,
  ].filter(Boolean).join("\n");
}

export default function CondolencesPage() {
  const [card, setCard] = useState<CondolenceCard>(() => withIdentity(getSharedCardFromUrl() || INITIAL_CARD));
  const [archive, setArchive] = useState<CondolenceCard[]>([]);
  const [successMessage, setSuccessMessage] = useState("");
  const template = TEMPLATES[card.templateId];

  useEffect(() => {
    setArchive(readArchive());
  }, []);

  const shareUrl = useMemo(() => publicCardUrl(withIdentity(card)), [card]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    window.setTimeout(() => setSuccessMessage(""), 2200);
  };

  const update = (key: keyof CondolenceCard, value: string) => {
    setCard((current) => withIdentity({ ...current, [key]: value }));
  };

  const saveToArchive = () => {
    const nextCard = withIdentity(card);
    const nextArchive = [nextCard, ...archive.filter((item) => item.id !== nextCard.id)];
    writeArchive(nextArchive);
    setArchive(nextArchive);
    setCard(nextCard);
    showSuccess("تم حفظ التعزية في الأرشيف.");
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    showSuccess("تم نسخ الرابط الخاص.");
  };

  const shareWhatsApp = () => {
    const text = `${cardText(card)}\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
  };

  const handleLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => update("logoDataUrl", String(reader.result || ""));
    reader.readAsDataURL(file);
  };

  const submit = (event: FormEvent) => {
    event.preventDefault();
    saveToArchive();
  };

  return (
    <div className="condolence-page">
      <section className="condolence-hero">
        <p className="condolence-eyebrow">قسم التعازي والوفيات</p>
        <h1>بطاقات تعزية جاهزة خلال ثوانٍ</h1>
        <p>اختر تصميمًا هادئًا، املأ بيانات المتوفى، ثم احفظ البطاقة أو شاركها مباشرة عبر واتساب أو حمّلها كصورة عالية الجودة.</p>
      </section>

      <div className="condolence-layout">
        <form onSubmit={submit} className="condolence-panel">
          <h2>بيانات التعزية</h2>
          <label>
            عبارة التعزية
            <select value={card.phrase} onChange={(event) => update("phrase", event.target.value)}>
              {PHRASES.map((phrase) => <option key={phrase} value={phrase}>{phrase}</option>)}
            </select>
          </label>
          <label>
            اسم المتوفى
            <input value={card.deceasedName} onChange={(event) => update("deceasedName", event.target.value)} placeholder="مثال: محمد عبدالله المطيري" required />
          </label>
          <div className="condolence-two">
            <label>
              تاريخ الوفاة الهجري
              <input value={card.hijriDate} onChange={(event) => update("hijriDate", event.target.value)} placeholder="1448/02/15 هـ" />
            </label>
            <label>
              تاريخ الوفاة الميلادي
              <input value={card.gregorianDate} onChange={(event) => update("gregorianDate", event.target.value)} placeholder="2026/08/30 م" />
            </label>
          </div>
          <label>
            اسم العائلة أو القبيلة (اختياري)
            <input value={card.familyName} onChange={(event) => update("familyName", event.target.value)} placeholder="مثال: عائلة المطيري" />
          </label>
          <label>
            مكان الدفن أو العزاء (اختياري)
            <input value={card.burialPlace} onChange={(event) => update("burialPlace", event.target.value)} placeholder="المقبرة أو ديوان العزاء" />
          </label>
          <label>
            دعاء للميت (اختياري)
            <textarea value={card.dua} onChange={(event) => update("dua", event.target.value)} rows={3} placeholder={DEFAULT_DUA} />
          </label>
          <label>
            شعار الجهة أو الأسرة (اختياري)
            <input type="file" accept="image/*" onChange={handleLogo} />
          </label>

          <h3>أنواع القوالب</h3>
          <div className="condolence-template-grid">
            {Object.entries(TEMPLATES).map(([id, item]) => (
              <button key={id} type="button" className={card.templateId === id ? "active" : ""} onClick={() => update("templateId", id)}>
                <strong>{item.name}</strong>
                <span>{item.desc}</span>
              </button>
            ))}
          </div>

          <div className="condolence-actions">
            <button type="submit">حفظ في الأرشيف</button>
            <button type="button" onClick={copyLink}>إنشاء رابط خاص</button>
            <button type="button" onClick={shareWhatsApp}>مشاركة واتساب</button>
            <button type="button" onClick={async () => { await downloadCardImage(withIdentity(card)); showSuccess("تم تحميل صورة التعزية بنجاح."); }}>تحميل صورة عالية الجودة</button>
          </div>
          {successMessage && <p className="condolence-success" role="status">{successMessage}</p>}
        </form>

        <aside className="condolence-preview-wrap">
          <div className={`condolence-card ${template.className}`}>
            {card.logoDataUrl && <img src={card.logoDataUrl} alt="شعار التعزية" />}
            <p className="condolence-card-phrase">{card.phrase}</p>
            <p className="condolence-card-small">انتقل إلى رحمة الله تعالى</p>
            <p className="condolence-card-label">المرحوم</p>
            <h2>{card.deceasedName || "اسم المتوفى"}</h2>
            {card.familyName && <p className="condolence-card-family">أسرة {card.familyName}</p>}
            <p className="condolence-card-label">تاريخ الوفاة</p>
            <p>{card.hijriDate}</p>
            <p>{card.gregorianDate}</p>
            {card.burialPlace && <p className="condolence-card-place">مكان الدفن أو العزاء: {card.burialPlace}</p>}
            <p className="condolence-card-dua">{card.dua || DEFAULT_DUA}</p>
          </div>

          <div className="condolence-archive">
            <h2>أرشيف التعازي</h2>
            {archive.length === 0 ? (
              <p>لم تحفظ أي تعزية بعد.</p>
            ) : (
              archive.map((item) => (
                <button key={item.id} type="button" onClick={() => setCard(item)}>
                  <strong>{item.deceasedName}</strong>
                  <span>{new Date(item.createdAt).toLocaleDateString("ar")}</span>
                </button>
              ))
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
