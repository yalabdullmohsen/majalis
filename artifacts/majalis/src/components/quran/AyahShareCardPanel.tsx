/**
 * لوحة مشاركة بطاقة الآية — اختيار خلفية وترجمة/تفسير وصيغة التصدير.
 */
import { useState } from "react";
import { Share2, Download } from "lucide-react";
import {
  SHARE_CARD_THEMES,
  shareAyahAsImage,
  generateAyahImage,
  type ShareCardTheme,
} from "@/lib/share-ayah";

type Props = {
  text: string;
  surahName: string;
  ayahNum: number;
  surahNum: number;
  translationText?: string | null;
  tafsirSnippet?: string | null;
};

export function AyahShareCardPanel({
  text,
  surahName,
  ayahNum,
  surahNum,
  translationText,
  tafsirSnippet,
}: Props) {
  const [theme, setTheme] = useState<ShareCardTheme>("emerald-gradient");
  const [include, setInclude] = useState<"none" | "translation" | "tafsir">("none");
  const [format, setFormat] = useState<"png" | "webp">("png");
  const [busy, setBusy] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const subtitle =
    include === "translation" ? translationText
      : include === "tafsir" ? tafsirSnippet
        : null;

  const runShare = async () => {
    setBusy(true);
    try {
      await shareAyahAsImage({ text, surahName, ayahNum, surahNum, theme, subtitle, format });
    } finally {
      setBusy(false);
    }
  };

  const runPreview = async () => {
    setBusy(true);
    try {
      const url = await generateAyahImage({ text, surahName, ayahNum, surahNum, theme, subtitle, format });
      setPreview(url);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="asc-panel">
      <div className="asc-panel__head">
        <Share2 size={14} aria-hidden="true" />
        <strong>بطاقة مشاركة</strong>
      </div>
      <div className="asc-row" role="listbox" aria-label="خلفية البطاقة">
        {SHARE_CARD_THEMES.map((t) => (
          <button
            key={t.id}
            type="button"
            role="option"
            aria-selected={theme === t.id}
            className={`asc-chip${theme === t.id ? " is-active" : ""}`}
            onClick={() => setTheme(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="asc-row">
        <button type="button" className={`asc-chip${include === "none" ? " is-active" : ""}`} onClick={() => setInclude("none")}>آية فقط</button>
        <button
          type="button"
          className={`asc-chip${include === "translation" ? " is-active" : ""}`}
          onClick={() => setInclude("translation")}
          disabled={!translationText}
        >
          + ترجمة
        </button>
        <button
          type="button"
          className={`asc-chip${include === "tafsir" ? " is-active" : ""}`}
          onClick={() => setInclude("tafsir")}
          disabled={!tafsirSnippet}
        >
          + تفسير
        </button>
      </div>
      <div className="asc-row">
        <button type="button" className={`asc-chip${format === "png" ? " is-active" : ""}`} onClick={() => setFormat("png")}>PNG</button>
        <button type="button" className={`asc-chip${format === "webp" ? " is-active" : ""}`} onClick={() => setFormat("webp")}>WebP</button>
      </div>
      <div className="asc-actions">
        <button type="button" className="asc-btn asc-btn--primary" onClick={runShare} disabled={busy}>
          <Share2 size={14} aria-hidden="true" />
          {busy ? "جارٍ…" : "مشاركة / تصدير"}
        </button>
        <button type="button" className="asc-btn" onClick={runPreview} disabled={busy}>
          <Download size={14} aria-hidden="true" />
          معاينة
        </button>
      </div>
      {preview && (
        <img src={preview} alt="معاينة بطاقة الآية" className="asc-preview" />
      )}
    </div>
  );
}

export default AyahShareCardPanel;
