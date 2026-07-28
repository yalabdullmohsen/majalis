/**
 * بطاقة معنى الكلمة (غريب/ترجمة) عند الضغط المطوّل.
 */
import { X } from "lucide-react";
import type { WordSense } from "@/lib/gharib-lite";

type Props = {
  sense: WordSense | null;
  onClose: () => void;
};

export function WordSenseSheet({ sense, onClose }: Props) {
  if (!sense) return null;
  return (
    <div className="wss-overlay" onClick={onClose} role="presentation">
      <div className="wss-sheet" role="dialog" aria-modal="true" aria-label="معنى الكلمة" onClick={(e) => e.stopPropagation()}>
        <div className="wss-sheet__head">
          <strong dir="rtl">{sense.arabic}</strong>
          <button type="button" onClick={onClose} aria-label="إغلاق"><X size={16} aria-hidden="true" /></button>
        </div>
        {sense.transliteration && <p className="wss-sheet__tr">{sense.transliteration}</p>}
        <p className="wss-sheet__meaning" dir="auto">{sense.meaning}</p>
        <p className="wss-sheet__src">مصدر المعنى: ترجمة كلمة quran-v2 · مخزّن محليًا للوصول دون اتصال</p>
      </div>
    </div>
  );
}

export default WordSenseSheet;
