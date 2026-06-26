import { useCallback, useState } from "react";

type DailyContentActionsProps = {
  title: string;
  text: string;
  source?: string;
  storageKey: string;
};

export function DailyContentActions({ title, text, source, storageKey }: DailyContentActionsProps) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`majalis-save-${storageKey}`) === "1";
  });
  const [fav, setFav] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(`majalis-fav-${storageKey}`) === "1";
  });

  const fullText = [text, source ? `\n\n— ${source}` : ""].join("");

  const onCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [fullText]);

  const onShare = useCallback(async () => {
    const payload = { title, text: fullText };
    if (navigator.share) {
      try {
        await navigator.share(payload);
        return;
      } catch {
        /* fall through */
      }
    }
    await onCopy();
  }, [title, fullText, onCopy]);

  const toggle = (key: "save" | "fav", setter: (v: boolean) => void) => {
    const storageId = key === "save" ? `majalis-save-${storageKey}` : `majalis-fav-${storageKey}`;
    const next = !(key === "save" ? saved : fav);
    setter(next);
    if (next) localStorage.setItem(storageId, "1");
    else localStorage.removeItem(storageId);
  };

  return (
    <div className="daily-content-actions" role="toolbar" aria-label="إجراءات المحتوى">
      <button type="button" className="daily-action-btn" onClick={onShare}>
        مشاركة
      </button>
      <button type="button" className="daily-action-btn" onClick={onCopy}>
        {copied ? "تم النسخ" : "نسخ"}
      </button>
      <button
        type="button"
        className={`daily-action-btn${saved ? " is-active" : ""}`}
        onClick={() => toggle("save", setSaved)}
        aria-pressed={saved}
      >
        {saved ? "محفوظ" : "حفظ"}
      </button>
      <button
        type="button"
        className={`daily-action-btn${fav ? " is-active" : ""}`}
        onClick={() => toggle("fav", setFav)}
        aria-pressed={fav}
      >
        {fav ? "في المفضلة" : "مفضلة"}
      </button>
    </div>
  );
}

export default DailyContentActions;
