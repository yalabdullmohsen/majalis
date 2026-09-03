import { useEffect, useRef, useState } from "react";
import { Check, Copy, Flag, Share2, Star } from "lucide-react";
import { Link } from "wouter";
import { absoluteUrl } from "@/lib/site-config";
import { copyShareText } from "@/lib/share-faida";
import { truncateAtWord } from "@/lib/utils";
import {
  buildHadithShareText,
  formatHadithGradeLabel,
  normalizeHadithSource,
  sanitizeHadithDisplay,
  summarizeHadithMatn,
  type HadithRecord,
} from "@/lib/hadith/hadithNormalize";
import { HadithGradeBadge } from "./HadithGradeBadge";

const COLLECTION_LABELS: Record<string, string> = {
  mutafaq: "متفق عليه",
  nawawi40: "الأربعون النووية",
  bukhari: "صحيح البخاري",
  muslim: "صحيح مسلم",
  tirmidhi: "سنن الترمذي",
  abudawud: "سنن أبي داود",
  nasai: "سنن النسائي",
  ibnmajah: "سنن ابن ماجه",
  muwatta: "موطأ مالك",
  riyadh: "رياض الصالحين",
  jawami: "صحيح الجامع",
  silsila: "السلسلة الصحيحة",
  qudsi: "أحاديث قدسية",
  various: "متفرقات مشهورة",
};

function collectionLabel(key: string | null): string {
  if (!key) return "";
  return COLLECTION_LABELS[key] ?? key;
}

function collectionBadgeClass(key: string | null): string {
  if (!key) return "hadith-badge--collection";
  const map: Record<string, string> = {
    mutafaq: "hadith-badge--mutafaq",
    bukhari: "hadith-badge--bukhari",
    muslim: "hadith-badge--muslim",
    nawawi40: "hadith-badge--nawawi",
  };
  return map[key] ?? "hadith-badge--collection";
}

type Props = {
  item: HadithRecord;
  onExpand: (item: HadithRecord) => void;
  detailHref?: string;
};

/** بطاقة حديث — متن مختصر، مصدر، حكم، مشاركة. */
export function HadithCard({ item: h, onExpand, detailHref }: Props) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem("majalis:hadith-saved");
      const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      return ids.includes(h.id);
    } catch {
      return false;
    }
  });
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  const preview = summarizeHadithMatn(h, 200);
  const source = normalizeHadithSource(h.source_name, h.grade);
  const category = sanitizeHadithDisplay(h.chapter) || sanitizeHadithDisplay(h.collection ? collectionLabel(h.collection) : "");
  const reportTopic = h.title || preview.slice(0, 60) || "حديث نبوي شريف";
  const ariaLabel = `قراءة المزيد: ${h.title ?? preview.slice(0, 48)}`;

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const citation = `${preview}\n\n— ${source}${h.hadith_number ? ` ${h.hadith_number}` : ""}\n${formatHadithGradeLabel(h.grade)}`;
    navigator.clipboard.writeText(citation).then(() => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const pageUrl = absoluteUrl(detailHref ?? `/hadith#${h.id}`);
    const text = buildHadithShareText(h, pageUrl);
    try {
      if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
        await navigator.share({ title: "سُنّة", text, url: pageUrl });
        return;
      }
      await copyShareText(text);
    } catch (err) {
      if (!(err instanceof DOMException && err.name === "AbortError")) {
        await copyShareText(text);
      }
    }
  }

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setSaved((s) => {
      const next = !s;
      try {
        const key = "majalis:hadith-saved";
        const raw = localStorage.getItem(key);
        const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
        const set = new Set(ids);
        if (next) set.add(h.id);
        else set.delete(h.id);
        localStorage.setItem(key, JSON.stringify([...set]));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const takhrijShort = h.metadata?.takhrij ? String(h.metadata.takhrij) : null;
  const compRef = h.metadata?.companion as string | undefined;

  return (
    <article
      id={h.id}
      className="hadith-card ui-card"
      data-testid="hadith-card"
    >
      <header className="hadith-card__header">
        <div className="hadith-card__badges">
          {h.collection ? (
            <span className={`hadith-badge ${collectionBadgeClass(h.collection)}`}>
              {collectionLabel(h.collection)}
            </span>
          ) : null}
          {h.hadith_number ? (
            <span className="hadith-badge hadith-badge--num">#{h.hadith_number}</span>
          ) : null}
          {category ? <span className="hadith-badge hadith-badge--topic">{category}</span> : null}
        </div>
        <HadithGradeBadge grade={h.grade} />
      </header>

      {h.title && h.title !== "حديث" ? (
        <h3 className="hadith-card__title">{sanitizeHadithDisplay(h.title)}</h3>
      ) : null}

      <blockquote className="hadith-card__text hadith-card__text--matn">{preview}</blockquote>

      <div className="hadith-card__meta">
        {(h.narrator || compRef) ? (
          <span className="hadith-meta-item">
            <span className="hadith-meta-label">الراوي:</span>{" "}
            {sanitizeHadithDisplay(h.narrator ?? String(compRef ?? ""))}
          </span>
        ) : null}
        {source ? (
          <span className="hadith-meta-item hadith-meta-item--source">
            <span className="hadith-meta-label">المصدر:</span> {source}
          </span>
        ) : (
          <span className="hadith-meta-item hadith-meta-item--incomplete">المصدر: قيد الإكمال</span>
        )}
        {takhrijShort ? (
          <span className="hadith-meta-item hadith-meta-item--takhrij">
            <span className="hadith-meta-label">تخريج:</span>{" "}
            {truncateAtWord(sanitizeHadithDisplay(takhrijShort), 72)}
          </span>
        ) : null}
      </div>

      {h.keywords && h.keywords.length > 0 ? (
        <div className="hadith-card__keywords">
          {h.keywords.slice(0, 4).map((k) => (
            <span key={k} className="hadith-keyword">{k}</span>
          ))}
        </div>
      ) : null}

      <div className="hadith-card__actions">
        <button
          type="button"
          className="hadith-card__read-more"
          onClick={() => onExpand(h)}
          aria-label={ariaLabel}
        >
          قراءة المزيد
        </button>
        <button
          type="button"
          className={`hadith-action-btn ${saved ? "hadith-action-btn--active" : ""}`}
          onClick={handleSave}
          aria-label={saved ? "إزالة من المفضلة" : "حفظ في المفضلة"}
          title={saved ? "محفوظ" : "حفظ"}
        >
          <Star size={16} strokeWidth={2} className={saved ? "icon-star--filled" : undefined} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hadith-action-btn"
          onClick={handleShare}
          aria-label="مشاركة الحديث"
          title="مشاركة"
        >
          <Share2 size={16} strokeWidth={2} aria-hidden="true" />
        </button>
        <button
          type="button"
          className="hadith-action-btn"
          onClick={handleCopy}
          aria-label={copied ? "تم النسخ" : "نسخ المتن"}
          title="نسخ"
        >
          {copied ? <Check size={16} strokeWidth={2} aria-hidden="true" /> : <Copy size={16} strokeWidth={2} aria-hidden="true" />}
        </button>
        <Link
          href={`/contact?topic=${encodeURIComponent(reportTopic)}`}
          className="hadith-action-btn hadith-action-btn--link"
          aria-label="بلاغ عن خطأ في المحتوى"
          title="بلاغ"
        >
          <Flag size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
}
