import { useState } from "react";
import { Bookmark, Share2 } from "lucide-react";
import { Link } from "wouter";
import { truncateAtWord } from "@/lib/utils";
import {
  normalizeHadithSource,
  sanitizeHadithDisplay,
  summarizeHadithMatn,
  type HadithRecord,
} from "@/lib/hadith/hadithNormalize";
import {
  formatHadithId,
  isHadithBookCode,
  parseHadithId,
  type HadithBookCode,
} from "@/lib/hadith-corpus/ids";
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

const COLLECTION_TO_BOOK: Record<string, HadithBookCode> = {
  bukhari: "bukhari",
  muslim: "muslim",
  tirmidhi: "tirmidhi",
  abudawud: "abudawud",
  nasai: "nasai",
  ibnmajah: "ibnmajah",
  muwatta: "malik",
};

function collectionLabel(key: string | null): string {
  if (!key) return "";
  return COLLECTION_LABELS[key] ?? key;
}

/** رابط تفاصيل ثابت إن وُجد معرّف كتاب:رقم قابل للتحليل */
export function resolveHadithDetailHref(item: HadithRecord): string | null {
  if (parseHadithId(item.id)) return `/hadith/${item.id}`;
  const num = Number(item.hadith_number);
  if (!Number.isFinite(num) || num < 1) return null;
  const col = item.collection?.toLowerCase() ?? "";
  const book = COLLECTION_TO_BOOK[col] ?? (isHadithBookCode(col) ? col : null);
  if (!book) return null;
  return `/hadith/${formatHadithId(book, num)}`;
}

type Props = {
  item: HadithRecord;
  onExpand: (item: HadithRecord) => void;
  detailHref?: string;
};

/**
 * بطاقة حديث — Hadith Design Language:
 * رأس (كتاب + رقم + حكم) · متن بارز · بيانات · تذييل إجراءات.
 */
export function HadithCard({ item: h, onExpand, detailHref }: Props) {
  const [saved, setSaved] = useState(() => {
    try {
      const raw = localStorage.getItem("majalis:hadith-saved");
      const ids: string[] = raw ? (JSON.parse(raw) as string[]) : [];
      return ids.includes(h.id);
    } catch {
      return false;
    }
  });

  const preview = summarizeHadithMatn(h, 220);
  const source = normalizeHadithSource(h.source_name, h.grade);
  const bookName =
    sanitizeHadithDisplay(h.collection ? collectionLabel(h.collection) : "") ||
    sanitizeHadithDisplay(h.source_name) ||
    "حديث نبوي";
  const takhrijShort = h.metadata?.takhrij ? String(h.metadata.takhrij) : null;
  const compRef = h.metadata?.companion as string | undefined;
  const narrator = sanitizeHadithDisplay(h.narrator ?? String(compRef ?? ""));
  const href = detailHref ?? resolveHadithDetailHref(h);
  const ariaLabel = `قراءة المزيد: ${h.title ?? preview.slice(0, 48)}`;

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
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

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    const text = `${preview}\n— ${bookName}${h.hadith_number ? ` #${h.hadith_number}` : ""}${h.grade ? ` · ${h.grade}` : ""}`;
    void (async () => {
      try {
        if (navigator.share) {
          await navigator.share({ text, title: bookName });
          return;
        }
      } catch {
        /* fall through */
      }
      try {
        await navigator.clipboard?.writeText(text);
      } catch {
        /* ignore */
      }
    })();
  }

  const body = (
    <>
      <header className="hdl-card__header">
        <div className="hdl-card__book">
          <span className="hdl-card__book-name">{bookName}</span>
          {h.hadith_number ? (
            <span className="hdl-card__num">#{h.hadith_number}</span>
          ) : null}
        </div>
        <HadithGradeBadge grade={h.grade} />
      </header>

      {h.title && h.title !== "حديث" ? (
        <h3 className="hadith-card__title hdl-role--category">{sanitizeHadithDisplay(h.title)}</h3>
      ) : null}

      <blockquote className="hadith-card__text hadith-card__text--matn hdl-card__matn hdl-role--matn">
        {preview}
      </blockquote>

      <div className="hadith-card__meta hdl-card__meta" data-hdl="meta">
        {narrator ? (
          <div className="hdl-card__meta-row">
            <span className="hdl-card__meta-label">الراوي</span>
            <span className="hdl-role--narrator">{narrator}</span>
          </div>
        ) : null}
        {source ? (
          <div className="hdl-card__meta-row">
            <span className="hdl-card__meta-label">المصدر</span>
            <span className="hdl-role--source">{source}</span>
          </div>
        ) : (
          <div className="hdl-card__meta-row">
            <span className="hdl-card__meta-label">المصدر</span>
            <span className="hadith-meta-item--incomplete">قيد الإكمال</span>
          </div>
        )}
        {takhrijShort ? (
          <div className="hdl-card__meta-row">
            <span className="hdl-card__meta-label">التخريج</span>
            <span className="hdl-role--takhrij">
              {truncateAtWord(sanitizeHadithDisplay(takhrijShort), 72)}
            </span>
          </div>
        ) : null}
      </div>
    </>
  );

  return (
    <article
      id={h.id}
      className="hadith-card soft-card soft-card--on-light hadith-card--pressable hdl-card"
      data-testid="hadith-card"
      data-hdl="card"
    >
      {href ? (
        <Link href={href} className="hadith-card__hit hdl-card__hit" aria-label={ariaLabel}>
          {body}
        </Link>
      ) : (
        <button
          type="button"
          className="hadith-card__hit hdl-card__hit"
          aria-label={ariaLabel}
          onClick={() => onExpand(h)}
        >
          {body}
        </button>
      )}

      <footer className="hdl-card__footer">
        <div className="hdl-card__footer-actions">
          <button
            type="button"
            className={`hadith-action-btn ${saved ? "hadith-action-btn--active" : ""}`}
            onClick={handleSave}
            aria-label={saved ? "إزالة من المحفوظات" : "حفظ"}
            title={saved ? "محفوظ" : "حفظ"}
          >
            <Bookmark
              size={16}
              strokeWidth={2}
              fill={saved ? "currentColor" : "none"}
              aria-hidden="true"
            />
          </button>
          <button
            type="button"
            className="hadith-action-btn"
            onClick={handleShare}
            aria-label="مشاركة"
            title="مشاركة"
          >
            <Share2 size={16} strokeWidth={2} aria-hidden="true" />
          </button>
        </div>
        {href ? (
          <Link href={href} className="hdl-card__cta">
            قراءة المزيد
          </Link>
        ) : (
          <button type="button" className="hdl-card__cta" onClick={() => onExpand(h)}>
            قراءة المزيد
          </button>
        )}
      </footer>
    </article>
  );
}
