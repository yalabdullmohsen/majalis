import { useEffect, useRef, useState } from "react";
import {
  FIQH_CITATION_FORMAT_LABELS,
  formatFiqhCitationByFormat,
  downloadCitationTxt,
  type FiqhCitationFormat,
} from "@/lib/fiqh-citation";
import type { FiqhCouncilItem } from "@/lib/fiqh-council-types";

type Props = {
  item: FiqhCouncilItem;
  className?: string;
};

export function FiqhCitationMenu({ item, className = "" }: Props) {
  const [format, setFormat] = useState<FiqhCitationFormat>("research");
  const [copied, setCopied] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(formatFiqhCitationByFormat(item, format));
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  };

  return (
    <div className={`fiqh-citation-menu ${className}`.trim()}>
      <select
        value={format}
        onChange={(e) => setFormat(e.target.value as FiqhCitationFormat)}
        className="fiqh-citation-format-select"
        aria-label="صيغة الاستشهاد"
      >
        {(Object.keys(FIQH_CITATION_FORMAT_LABELS) as FiqhCitationFormat[]).map((f) => (
          <option key={f} value={f}>{FIQH_CITATION_FORMAT_LABELS[f]}</option>
        ))}
      </select>
      <button type="button" onClick={handleCopy} className="content-detail-action-btn">
        {copied ? "تم النسخ" : "نسخ الاستشهاد"}
      </button>
      <button
        type="button"
        onClick={() => downloadCitationTxt(item, format)}
        className="content-detail-action-btn"
      >
        تحميل الاستشهاد
      </button>
    </div>
  );
}

/** @deprecated استخدم FiqhCitationMenu */
export function FiqhCitationButton({ item, className }: Props) {
  return <FiqhCitationMenu item={item} className={className} />;
}
