import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AlertTriangle, Check, Copy, Flag, Share2, Star } from "lucide-react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { truncateAtWord } from "@/lib/utils";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { getVerifiedHadith } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { normalizeArabic } from "@/lib/arabic-search";
import {
  compareHadithAccess,
  extractDisplayMatn,
  hadithCorpusKey,
  hadithNumberMatches,
  normalizeHadithDigits,
  splitHadithNarration,
  type HadithSearchScope,
  type HadithSortMode,
} from "@/lib/hadith-access";
import { PageHeader, SkeletonCardGrid, Empty, Chip } from "@/components/ui-common";
import { SectionTemplatePage } from "@/components/topic/TopicPage";
import { HubCard } from "@/components/ui/HubCard";
import { ExclusiveChoiceGroup } from "@/components/ui/ExclusiveChoiceGroup";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { RecommendationWidget } from "@/components/recommendations/RecommendationWidget";
import { CitationActionBar } from "@/components/citation/CitationActionBar";
import { IsnadAttributionBar } from "@/components/IsnadAttributionBar";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { fetchAllHadiths, type CdnHadith } from "@/lib/hadith-cdn-service";
import { fetchSahihaynLocal } from "@/lib/sahihayn-local";
import { loadLocalVerifiedHadith } from "@/lib/verified-hadith-local-seed";
import { useReadingScrollMemory } from "@/hooks/useReadingScrollMemory";
import { resolveScholarWorkLink } from "@/lib/scholar-library-links";
import "@/styles/components/hadith-badge.css";
import "@/styles/pages/hadith.css";

// ─── Types ────────────────────────────────────────────────────────────────────

type HadithItem = {
  id: string;
  title: string | null;
  text: string;
  narrator: string | null;
  source_name: string | null;
  grade: string | null;
  collection: string | null;
  chapter: string | null;
  explanation: string | null;
  keywords: string[] | null;
  hadith_number: string | null;
  metadata: Record<string, string | number | boolean | null> | null;
  created_at: string;
};

export type HadithClass = "sahih" | "daif" | "mawdu";

/** دمج صفوف القاعدة مع البذرة المحلية (الحي يفوز عند تعارض المعرّف). */
async function mergeHadithRows(remote: HadithItem[], authenticityClass: HadithClass): Promise<HadithItem[]> {
  const local = (await loadLocalVerifiedHadith(authenticityClass)).map((h) => ({
    id: h.id,
    title: h.title,
    text: h.text,
    narrator: h.narrator,
    source_name: h.source_name,
    grade: h.grade,
    collection: h.collection,
    chapter: h.chapter,
    explanation: h.explanation,
    keywords: h.keywords,
    hadith_number: h.hadith_number,
    metadata: h.metadata,
    created_at: h.created_at,
  }));
  const byId = new Map<string, HadithItem>();
  for (const row of local) byId.set(row.id, row);
  for (const row of remote) byId.set(row.id, row);
  return Array.from(byId.values());
}

function cdnToHadithItems(
  hadiths: CdnHadith[],
  collection: string,
  sourceName: string,
  opts?: { grade?: string | null },
): HadithItem[] {
  return hadiths.map((h) => ({
    id: `cdn-${collection}-${h.hadithnumber}`,
    title: null,
    text: h.text,
    narrator: null,
    source_name: sourceName,
    // الصحيحان: الصحة بعضوية الكتاب لا بدرجة ملفّقة لكل سند من الـCDN.
    grade: opts?.grade ?? null,
    collection,
    chapter: h.chapter ?? (h.book != null ? `الكتاب ${h.book}` : null),
    explanation: null,
    keywords: null,
    hadith_number: String(h.hadithnumber),
    metadata: {
      authenticity: "sahih-by-collection",
      takhrij: `${sourceName} — الحديث ${h.hadithnumber}${h.book != null ? ` · الكتاب ${h.book}` : ""}${h.inBook != null ? ` · داخله ${h.inBook}` : ""}`,
      book: h.book ?? null,
      in_book: h.inBook ?? null,
      arabic_number: h.arabicNumber ?? null,
      takhrij_method: "membership",
    },
    created_at: new Date().toISOString(),
  }));
}

/**
 * يُلصق شروح/تخريج البذرة المنسّقة على صفوف الصحيحين بنفس (المجموعة+الرقم)
 * بدل إظهار بطاقتين مكررتين؛ ويُبقي ما ليس له مقابل في المرجع.
 */
function mergeCorpusWithCurated(corpus: HadithItem[], curated: HadithItem[]): HadithItem[] {
  const byKey = new Map<string, HadithItem>();
  for (const row of curated) {
    const key = hadithCorpusKey(row.collection, row.hadith_number);
    if (key) byKey.set(key, row);
  }
  const used = new Set<string>();
  const out = corpus.map((row) => {
    const key = hadithCorpusKey(row.collection, row.hadith_number);
    if (!key) return row;
    const c = byKey.get(key);
    if (!c) return row;
    used.add(key);
    return {
      ...row,
      title: c.title || row.title,
      narrator: c.narrator || row.narrator,
      explanation: c.explanation || row.explanation,
      keywords: c.keywords?.length ? c.keywords : row.keywords,
      grade: c.grade || row.grade,
      metadata: {
        ...(row.metadata ?? {}),
        ...(c.metadata ?? {}),
        takhrij:
          (c.metadata?.takhrij as string | undefined) ||
          c.source_name ||
          (row.metadata?.takhrij as string | undefined) ||
          null,
        takhrij_method: (c.metadata?.takhrij_method as string | undefined) || "curated+membership",
        muhaddith: (c.metadata?.muhaddith as string | undefined) || null,
      },
    };
  });
  for (const row of curated) {
    const key = hadithCorpusKey(row.collection, row.hadith_number);
    if (key && used.has(key)) continue;
    // لا تُضَف بطاقات فهرسة مكررة لنفس رقم البخاري/مسلم بلا دمج
    if (key) continue;
    out.push(row);
  }
  return out;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────


const COLLECTION_LABELS: Record<string, string> = {
  mutafaq:  "متفق عليه",
  nawawi40: "الأربعون النووية",
  bukhari:  "صحيح البخاري",
  muslim:   "صحيح مسلم",
  tirmidhi: "سنن الترمذي",
  abudawud: "سنن أبي داود",
  nasai:    "سنن النسائي",
  ibnmajah: "سنن ابن ماجه",
  muwatta:  "موطأ مالك",
  riyadh:   "رياض الصالحين",
  jawami:   "صحيح الجامع",
  silsila:  "السلسلة الصحيحة",
  qudsi:    "أحاديث قدسية",
  various:  "متفرقات مشهورة",
};

const COLLECTION_ORDER: Record<string, number> = {
  mutafaq: 0, bukhari: 1, muslim: 2, nawawi40: 3,
  tirmidhi: 4, abudawud: 5, nasai: 6, ibnmajah: 7,
  muwatta: 8, riyadh: 9, jawami: 10, silsila: 11,
  qudsi: 12, various: 13,
};

function collectionLabel(key: string | null): string {
  if (!key) return "";
  return COLLECTION_LABELS[key] ?? key;
}

function collectionBadgeClass(key: string | null): string {
  if (!key) return "hadith-badge--collection";
  const map: Record<string, string> = {
    mutafaq:  "hadith-badge--mutafaq",
    bukhari:  "hadith-badge--bukhari",
    muslim:   "hadith-badge--muslim",
    nawawi40: "hadith-badge--nawawi",
    tirmidhi: "hadith-badge--tirmidhi",
    abudawud: "hadith-badge--abudawud",
    nasai:    "hadith-badge--nasai",
    ibnmajah: "hadith-badge--ibnmajah",
  };
  return map[key] ?? "hadith-badge--collection";
}

const GRADE_CLASS: Record<string, string> = {
  صحيح: "hadith-grade--sahih",
  "حسن صحيح": "hadith-grade--hasan-sahih",
  حسن: "hadith-grade--hasan",
  ضعيف: "hadith-grade--daif",
  موضوع: "hadith-grade--mawdu",
};

/** يطابق الدرجات المركّبة («ضعيف — …»، «موضوع — …») دون تلفيق لون الصحيح. */
function gradeClass(grade: string | null): string {
  if (!grade) return "hadith-grade--unknown";
  const g = grade.trim();
  if (GRADE_CLASS[g]) return GRADE_CLASS[g];
  if (/موضوع|باطل|مكذوب|لا\s*أصل/i.test(g)) return "hadith-grade--mawdu";
  if (/ضعيف/.test(g)) return "hadith-grade--daif";
  if (/حسن\s*صحيح/.test(g)) return "hadith-grade--hasan-sahih";
  if (/^حسن\b/.test(g) || /\bحسن\b/.test(g)) return "hadith-grade--hasan";
  if (/^صحيح\b/.test(g) || g === "صحيح") return "hadith-grade--sahih";
  return "hadith-grade--unknown";
}

const GRADE_UNKNOWN_LABEL = "الدرجة غير مثبتة في المصدر";

/** نص شارة الدرجة للعرض — هادئ ولا يطغى على المتن. */
function gradeDisplayLabel(grade: string | null): string {
  if (!grade) return GRADE_UNKNOWN_LABEL;
  const g = grade.trim();
  if (/موضوع|باطل|مكذوب|لا\s*أصل/i.test(g)) {
    return /لا\s*ي?صح/.test(g) ? g : "موضوع — لا يصح";
  }
  if (/^ضعيف\b/.test(g) && g.length <= 24) return g;
  if (g === "ضعيف") return "ضعيف";
  return g;
}

// ─── HadithCard ──────────────────────────────────────────────────────────────

function HadithCard({ h, onExpand }: { h: HadithItem; onExpand: (h: HadithItem) => void }) {
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

  const displayMatn = extractDisplayMatn(h.title, h.text);
  const citation = `${displayMatn}\n\n— ${h.source_name ?? ""}${h.hadith_number ? ` ${h.hadith_number}` : ""}`;
  const reportTopic = h.title || displayMatn.slice(0, 60) || "حديث نبوي شريف";

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    navigator.clipboard.writeText(citation).then(() => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleShare(e: React.MouseEvent) {
    e.stopPropagation();
    const payload = { title: h.title || "حديث نبوي شريف", text: citation, url: "https://majlisilm.com/hadith" };
    if (typeof navigator !== "undefined" && typeof navigator.share === "function") {
      void navigator.share(payload).catch(() => {
        void navigator.clipboard.writeText(citation);
      });
      return;
    }
    void navigator.clipboard.writeText(citation);
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
        /* تجاهل فشل التخزين المحلي */
      }
      return next;
    });
  }

  const compRef = h.metadata?.companion as string | undefined;
  const takhrijShort = h.metadata?.takhrij ? String(h.metadata.takhrij) : null;
  const gradeCls = gradeClass(h.grade);

  return (
    <div
      id={h.id}
      className="hadith-card ui-card"
      onClick={() => onExpand(h)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onExpand(h);
        }
      }}
      tabIndex={0}
      role="button"
      aria-label={`عرض تفاصيل الحديث: ${h.title ?? displayMatn.slice(0, 40)}`}
    >
      <header className="hadith-card__header">
        <div className="hadith-card__badges">
          {h.collection && (
            <span className={`hadith-badge ${collectionBadgeClass(h.collection)}`}>
              {collectionLabel(h.collection)}
            </span>
          )}
          {h.hadith_number && (
            <span className="hadith-badge hadith-badge--num">#{h.hadith_number}</span>
          )}
        </div>
        <span className={`hadith-grade ${gradeCls}`} title={h.grade ?? undefined}>
          {gradeDisplayLabel(h.grade)}
        </span>
      </header>

      {h.title && h.title !== "حديث" && (
        <h3 className="hadith-card__title">{h.title}</h3>
      )}
      {h.chapter && (
        <p className="hadith-card__chapter">{h.chapter}</p>
      )}

      <blockquote className="hadith-card__text hadith-card__text--matn">{displayMatn}</blockquote>

      <div className="hadith-card__meta">
        {(h.narrator || compRef) && (
          <span className="hadith-meta-item">
            <span className="hadith-meta-label">الراوي:</span>{" "}
            {h.narrator ?? compRef}
          </span>
        )}
        {h.source_name && (
          <span className="hadith-meta-item hadith-meta-item--source">
            <span className="hadith-meta-label">المصدر:</span>{" "}
            {h.source_name}
          </span>
        )}
        {takhrijShort && (
          <span className="hadith-meta-item hadith-meta-item--takhrij">
            <span className="hadith-meta-label">تخريج:</span>{" "}
            {truncateAtWord(takhrijShort, 72)}
          </span>
        )}
      </div>

      {h.keywords && h.keywords.length > 0 && (
        <div className="hadith-card__keywords">
          {h.keywords.slice(0, 4).map((k) => (
            <span key={k} className="hadith-keyword">{k}</span>
          ))}
        </div>
      )}

      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="hadith-card__actions" onClick={(e) => e.stopPropagation()}>
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
          onClick={(e) => e.stopPropagation()}
        >
          <Flag size={16} strokeWidth={2} aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

// ─── HadithDetailModal ────────────────────────────────────────────────────────

function HadithDetailModal({ h, onClose }: { h: HadithItem; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [showIsnad, setShowIsnad] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { matn, isnad, hasIsnad } = splitHadithNarration(h.text);
  const displayMatn = matn || extractDisplayMatn(h.title, h.text);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  function handleCopyMatn() {
    const content = `${h.title ? h.title + "\n" : ""}${displayMatn}\n\n— ${h.source_name ?? ""}${h.hadith_number ? ` ${h.hadith_number}` : ""}`;
    navigator.clipboard.writeText(content).then(() => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleCopyFull() {
    const content = `${h.title ? h.title + "\n" : ""}${h.text}\n\n— ${h.narrator ?? ""} | ${h.source_name ?? ""}`;
    navigator.clipboard.writeText(content).then(() => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopiedFull(true);
      copyTimerRef.current = setTimeout(() => setCopiedFull(false), 2000);
    });
  }

  const meta = h.metadata ?? {};
  const takhrijText = meta.takhrij ? String(meta.takhrij) : h.source_name;
  const methodLabel =
    meta.takhrij_method === "membership"
      ? "من الصحيحين"
      : meta.takhrij_method === "curated+membership"
        ? "من الصحيحين · مع تخريج"
        : meta.muhaddith
          ? `تخريج منسوب (${String(meta.muhaddith)})`
          : "تخريج مرجعي";

  return (
    // نقر الخلفية للإغلاق مصحوب بمعالج Escape فعلي (أعلاه) وزر إغلاق ظاهر —
    // مساران بديلان كاملان بلوحة المفاتيح.
    /* eslint-disable jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */
    <div
      className="hadith-modal-overlay"
      ref={overlayRef}
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
      role="dialog"
      aria-modal="true"
      aria-label="تفاصيل الحديث"
    >
      <div className="hadith-modal">
        <div className="hadith-modal__head">
          <div className="hadith-modal__badges">
            {h.collection && (
              <span className="hadith-badge hadith-badge--collection">
                {collectionLabel(h.collection)}
              </span>
            )}
            {h.hadith_number && (
              <span className="hadith-badge hadith-badge--num">حديث #{h.hadith_number}</span>
            )}
            {h.grade ? (
              <span className={`hadith-grade ${gradeClass(h.grade)}`} title={h.grade}>
                {gradeDisplayLabel(h.grade)}
              </span>
            ) : (
              <span className="hadith-grade hadith-grade--unknown">{GRADE_UNKNOWN_LABEL}</span>
            )}
          </div>
          <button
            type="button"
            className="hadith-modal__close"
            onClick={onClose}
            aria-label="إغلاق"
          >
            ✕
          </button>
        </div>

        {h.title && h.title !== "حديث" && (
          <h2 className="hadith-modal__title">{h.title}</h2>
        )}
        {h.chapter && <p className="hadith-modal__chapter">{h.chapter}</p>}

        <section className="hadith-modal__matn-block" aria-label="متن الحديث">
          <h3 className="hadith-modal__section-label">المتن</h3>
          <blockquote className="hadith-modal__text hadith-modal__text--matn">{displayMatn}</blockquote>
        </section>

        {hasIsnad && isnad && (
          <section className="hadith-modal__isnad-block" aria-label="سند الحديث">
            <button
              type="button"
              className="hadith-modal__isnad-toggle"
              aria-expanded={showIsnad}
              onClick={() => setShowIsnad((v) => !v)}
            >
              {showIsnad ? "إخفاء السند" : "عرض السند"}
            </button>
            {showIsnad && (
              <p className="hadith-modal__isnad">{isnad}</p>
            )}
          </section>
        )}

        <div className="hadith-modal__meta-grid">
          {(h.narrator || meta.companion) && (
            <div className="hadith-modal__meta-item">
              <strong>الراوي</strong>
              <span>{h.narrator ?? String(meta.companion ?? "")}</span>
            </div>
          )}
          {meta.companion && h.narrator !== meta.companion && (
            <div className="hadith-modal__meta-item">
              <strong>الصحابي</strong>
              <span>{String(meta.companion)}</span>
            </div>
          )}
          {h.source_name && (
            <div className="hadith-modal__meta-item">
              <strong>المصدر</strong>
              <span>
                {(() => {
                  const link = resolveScholarWorkLink(h.source_name);
                  return link.href ? <Link href={link.href}>{h.source_name}</Link> : h.source_name;
                })()}
              </span>
            </div>
          )}
          {takhrijText && (
            <div className="hadith-modal__meta-item">
              <strong>التخريج</strong>
              <span>
                {(() => {
                  const raw = String(takhrijText);
                  const link = resolveScholarWorkLink(raw);
                  return link.href ? <Link href={link.href}>{raw}</Link> : raw;
                })()}
              </span>
            </div>
          )}
          <div className="hadith-modal__meta-item">
            <strong>طريقة التخريج</strong>
            <span>{methodLabel}</span>
          </div>
          {meta.book != null && (
            <div className="hadith-modal__meta-item">
              <strong>رقم الكتاب</strong>
              <span>{String(meta.book)}</span>
            </div>
          )}
          {meta.in_book != null && (
            <div className="hadith-modal__meta-item">
              <strong>رقمه داخل الكتاب</strong>
              <span>{String(meta.in_book)}</span>
            </div>
          )}
          {meta.arabic_number != null && (
            <div className="hadith-modal__meta-item">
              <strong>الرقم في الطبعة العربية</strong>
              <span>{String(meta.arabic_number)}</span>
            </div>
          )}
          <div className="hadith-modal__meta-item">
            <strong>درجة الحديث</strong>
            {h.grade ? (
              <span className={`hadith-grade ${gradeClass(h.grade)}`} title={h.grade}>
                {gradeDisplayLabel(h.grade)}
              </span>
            ) : (
              <span className="hadith-grade hadith-grade--unknown">{GRADE_UNKNOWN_LABEL}</span>
            )}
          </div>
          {h.chapter && (
            <div className="hadith-modal__meta-item">
              <strong>الباب</strong>
              <span>{h.chapter}</span>
            </div>
          )}
        </div>

        {h.explanation && (
          <section className="hadith-modal__explanation">
            <h3>الشرح والفائدة</h3>
            <p>{h.explanation}</p>
          </section>
        )}

        {h.keywords && h.keywords.length > 0 && (
          <div className="hadith-modal__keywords">
            <strong>الكلمات المفتاحية:</strong>
            <div className="hadith-keywords-row">
              {h.keywords.map((k) => (
                <span key={k} className="hadith-keyword">{k}</span>
              ))}
            </div>
          </div>
        )}

        <div className="hadith-modal__actions">
          <button
            type="button"
            className="hadith-modal-btn"
            onClick={handleCopyMatn}
          >
            {copied ? "✓ تم نسخ المتن" : "⎘ نسخ المتن"}
          </button>
          <button
            type="button"
            className="hadith-modal-btn hadith-modal-btn--ghost"
            onClick={handleCopyFull}
          >
            {copiedFull ? "✓ تم نسخ السند+المتن" : "⎘ نسخ كاملاً (سند+متن)"}
          </button>
        </div>

        <IsnadAttributionBar
          className="hadith-modal__isnad"
          data={{
            source: h.source_name,
            grade: h.grade,
            narrator: h.narrator,
            reference: h.hadith_number ? String(h.hadith_number) : takhrijText ? String(takhrijText) : null,
            needsReview: !h.source_name || !h.grade,
            reportContentType: "hadith",
            reportContentId: h.id,
          }}
        />

        <CitationActionBar
          source={{
            id: h.id,
            content_type: "hadith",
            reference_id: h.hadith_number ? String(h.hadith_number) : null,
            title_ar: h.title ?? truncateAtWord(displayMatn, 60),
            author_name: h.narrator ?? null,
            book_name: h.source_name ?? null,
            is_approved: true,
          }}
          compact
          className="hadith-modal__citation"
        />

        <footer className="hadith-modal__footer">
          <p><AlertTriangle size={13} className="inline ms-1" />تحقق من صحة الحديث ومصدره قبل النشر أو الاستشهاد به.</p>
        </footer>
      </div>
      <AdminQuickEdit section="hadith" />
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "الكل", label: "الكل" },
  { id: "العقيدة والإيمان", label: "العقيدة والإيمان", keys: ["إيمان","توحيد","عقيدة","قدر","توكل"] },
  { id: "العبادات", label: "العبادات", keys: ["صلاة","زكاة","صوم","حج","طهارة","تلاوة","قرآن"] },
  { id: "الأخلاق", label: "الأخلاق", keys: ["أخلاق","خلق","حياء","غضب","صبر","رحمة","إحسان"] },
  { id: "الزهد والرقائق", label: "الزهد والرقائق", keys: ["زهد","دنيا","آخرة","رقائق","توبة"] },
  { id: "متفرقات", label: "متفرقات", keys: ["علم","طلب العلم","حلال","حرام","أخوة","مسلم"] },
];

export const HADITH_CLASS_META: Record<HadithClass, {
  eyebrow: string; title: string; subtitle: string; empty: string; countUnit: string; notice?: string;
}> = {
  sahih: {
    eyebrow: "الحديث وعلومه",
    title: "الأحاديث الصحيحة",
    subtitle: "متون من الصحيحين مع المصدر والتخريج عند التوسّع.",
    empty: "لا توجد أحاديث في هذا التصنيف.",
    countUnit: "حديث",
  },
  daif: {
    eyebrow: "الحديث وعلومه",
    title: "الأحاديث الضعيفة",
    subtitle: "للتخريج والتمييز — لا للاحتجاج في العقائد والأحكام.",
    empty: "لا تُدرَج رواية إلا بتخريج ودرجة منسوبَين.",
    countUnit: "حديث",
    notice: "لا يُحتج بالحديث الضعيف في العقائد والأحكام، ويُعرض هنا للتخريج والتمييز.",
  },
  mawdu: {
    eyebrow: "الحديث وعلومه",
    title: "الأحاديث الموضوعة",
    subtitle: "للتحذير والبيان — لا تُنسب إلى النبي ﷺ.",
    empty: "لا يُذكر الموضوع إلا مع بيان من حكم بوضعه.",
    countUnit: "حديث موضوع",
    notice: "لا يُنسب الموضوع إلى النبي ﷺ إلا مع بيان وضعه؛ يُعرض للتحذير والبيان لا للاحتجاج.",
  },
};

export function HadithSection({ authenticityClass = "sahih", embedded = false }: { authenticityClass?: HadithClass; embedded?: boolean }) {
  const meta = HADITH_CLASS_META[authenticityClass];
  const [items, setItems] = useState<HadithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("الكل");
  const [activeCollection, setActiveCollection] = useState("الكل");
  const [expandedHadith, setExpandedHadith] = useState<HadithItem | null>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [numberQuery, setNumberQuery] = useState("");
  const [sortMode, setSortMode] = useState<HadithSortMode>(
    authenticityClass === "sahih" ? "number" : "default",
  );
  const [searchScope, setSearchScope] = useState<HadithSearchScope>("matn");
  const [bookQuery, setBookQuery] = useState("");
  const [inBookQuery, setInBookQuery] = useState("");
  const debouncedSearch = useDebouncedValue(search);
  const debouncedNumber = useDebouncedValue(numberQuery);
  const debouncedBook = useDebouncedValue(bookQuery);
  const debouncedInBook = useDebouncedValue(inBookQuery);
  const PAGE_SIZE = authenticityClass === "sahih" ? 40 : 200;

  useEffect(() => {
    setPage(1);
  }, [authenticityClass, activeCollection, activeCategory, debouncedSearch, debouncedNumber, debouncedBook, debouncedInBook, sortMode, searchScope]);

  useEffect(() => {
    setNumberQuery("");
    setBookQuery("");
    setInBookQuery("");
    setSearchScope("matn");
    setSortMode(authenticityClass === "sahih" ? "number" : "default");
  }, [authenticityClass]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const q = new URLSearchParams(window.location.search).get("q");
    if (q) setSearch(q);
  }, [authenticityClass]);

  useEffect(() => {
    setLoading(true);
    RequestManager.run(`hadith:list:${authenticityClass}`, () => getVerifiedHadith({ limit: 500, authenticityClass }))
      .then(async ({ data }) => {
        const curated = await mergeHadithRows((data as HadithItem[]) ?? [], authenticityClass);

        if (authenticityClass === "sahih") {
          // مرجع الصحيحين الكامل (محلي أولاً) + البطاقات المنسّقة ذات الشرح
          let bukhari: CdnHadith[];
          let muslim: CdnHadith[];
          try {
            const local = await fetchSahihaynLocal("both");
            bukhari = local.bukhari;
            muslim = local.muslim;
          } catch {
            const [b, m] = await Promise.all([
              fetchAllHadiths("ara-bukhari"),
              fetchAllHadiths("ara-muslim"),
            ]);
            bukhari = b;
            muslim = m;
          }
          const corpus = [
            ...cdnToHadithItems(bukhari, "bukhari", "صحيح البخاري", { grade: "صحيح" }),
            ...cdnToHadithItems(muslim, "muslim", "صحيح مسلم", { grade: "صحيح" }),
          ];
          setItems(mergeCorpusWithCurated(corpus, curated));
          return;
        }

        if (curated.length > 0) {
          setItems(curated);
          return;
        }
        setItems([]);
      })
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }, [authenticityClass]);

  // روابط عميقة عبر #id من البحث/التوصيات
  useEffect(() => {
    if (loading) return;
    const hashId = decodeURIComponent(window.location.hash.replace(/^#/, ""));
    if (!hashId) return;
    const match = items.find((h) => h.id === hashId);
    if (match) setExpandedHadith(match);
    const timer = window.setTimeout(() => {
      document.getElementById(hashId)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 100);
    return () => window.clearTimeout(timer);
  }, [loading, items]);

  const collections = useMemo(() => {
    const set = new Set<string>();
    items.forEach((h) => { if (h.collection) set.add(h.collection); });
    const sorted = Array.from(set).sort(
      (a, b) => (COLLECTION_ORDER[a] ?? 99) - (COLLECTION_ORDER[b] ?? 99)
    );
    return ["الكل", ...sorted];
  }, [items]);

  /** فهرس مطبّع يُبنى مرة عند تحميل القائمة — لا تطبيع عربي في كل ضغطة. */
  const searchIndex = useMemo(() => {
    return items.map((h) => {
      const matn = normalizeArabic([extractDisplayMatn(h.title, h.text), h.title].filter(Boolean).join(" "));
      const takhrij = normalizeArabic([
        h.source_name,
        h.explanation,
        String(h.metadata?.takhrij ?? ""),
        String(h.metadata?.muhaddith ?? ""),
        String(h.metadata?.takhrij_method ?? ""),
        h.grade,
        h.chapter,
        h.hadith_number,
        h.collection ? collectionLabel(h.collection) : "",
        h.metadata?.book != null ? `الكتاب ${h.metadata.book}` : "",
        h.metadata?.in_book != null ? `داخله ${h.metadata.in_book}` : "",
      ].filter(Boolean).join(" "));
      const full = normalizeArabic([
        h.text,
        extractDisplayMatn(h.title, h.text),
        h.title,
        h.narrator,
        h.source_name,
        h.explanation,
        h.chapter,
        h.hadith_number,
        String(h.metadata?.takhrij ?? ""),
        ...(h.keywords ?? []),
      ].filter(Boolean).join(" "));
      const categoryHay = normalizeArabic([
        ...(h.keywords ?? []),
        h.chapter,
        h.title,
        extractDisplayMatn(h.title, h.text),
        h.text,
        String(h.metadata?.takhrij ?? ""),
        h.explanation,
      ].filter(Boolean).join(" "));
      return { id: h.id, matn, takhrij, full, categoryHay, item: h };
    });
  }, [items]);

  const displayItems = useMemo(() => {
    let rows = searchIndex;
    if (activeCollection !== "الكل") {
      rows = rows.filter((r) => r.item.collection === activeCollection);
    }
    if (activeCategory !== "الكل") {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (cat?.keys) {
        const keys = cat.keys.map((k) => normalizeArabic(k)).filter(Boolean);
        rows = rows.filter((r) => keys.some((k) => r.categoryHay.includes(k)));
      }
    }
    if (debouncedNumber.trim()) {
      rows = rows.filter((r) => hadithNumberMatches(r.item.hadith_number, debouncedNumber));
    }
    if (debouncedBook.trim()) {
      const bq = normalizeHadithDigits(debouncedBook);
      rows = rows.filter((r) => {
        const h = r.item;
        const book = h.metadata?.book != null ? String(h.metadata.book) : "";
        const chapterDigits = normalizeHadithDigits(h.chapter || "");
        return (book && (book === bq || book.startsWith(bq))) ||
          (chapterDigits && (chapterDigits === bq || chapterDigits.startsWith(bq)));
      });
    }
    if (debouncedInBook.trim()) {
      const iq = normalizeHadithDigits(debouncedInBook);
      rows = rows.filter((r) => {
        const h = r.item;
        const inBook = h.metadata?.in_book != null ? String(h.metadata.in_book) : "";
        const arabicNum = h.metadata?.arabic_number != null ? String(h.metadata.arabic_number) : "";
        return hadithNumberMatches(inBook, iq) || hadithNumberMatches(arabicNum, iq);
      });
    }
    if (debouncedSearch.trim()) {
      const q = normalizeArabic(debouncedSearch.trim());
      if (q) {
        rows = rows.filter((r) => {
          const h = r.item;
          if (searchScope === "matn") return r.matn.includes(q);
          if (searchScope === "number") {
            return (
              hadithNumberMatches(h.hadith_number, debouncedSearch) ||
              hadithNumberMatches(String(h.metadata?.book ?? ""), debouncedSearch) ||
              hadithNumberMatches(String(h.metadata?.in_book ?? ""), debouncedSearch) ||
              hadithNumberMatches(String(h.metadata?.arabic_number ?? ""), debouncedSearch)
            );
          }
          if (searchScope === "takhrij") return r.takhrij.includes(q);
          return r.full.includes(q);
        });
      }
    }
    let list = rows.map((r) => r.item);
    if (sortMode !== "default") {
      list = [...list].sort((a, b) => compareHadithAccess(a, b, sortMode));
    }
    return list;
  }, [searchIndex, activeCollection, activeCategory, debouncedNumber, debouncedBook, debouncedInBook, debouncedSearch, sortMode, searchScope]);

  const totalPages = Math.max(1, Math.ceil(displayItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = useMemo(
    () => displayItems.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE),
    [displayItems, safePage, PAGE_SIZE],
  );

  const filtersPanel = (
    <div className="hadith-filters-panel">
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="ابحث بالمتن أو التخريج أو الرقم…"
        className="page-search-input full content-hub-search"
        aria-label="بحث نصي في الأحاديث"
      />

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">نطاق البحث</p>
        <ExclusiveChoiceGroup
          ariaLabel="نطاق البحث"
          value={searchScope}
          onChange={(id) => setSearchScope(id as HadithSearchScope)}
          items={[
            { id: "matn", label: "المتن فقط" },
            { id: "full", label: "سند + متن" },
            { id: "takhrij", label: "تخريج وشرح" },
            { id: "number", label: "أرقام التخريج" },
          ]}
        />
      </div>

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">رقم الحديث (في الكتاب)</p>
        <input
          value={numberQuery}
          onChange={(e) => setNumberQuery(e.target.value)}
          inputMode="numeric"
          placeholder="مثال: 1 أو ١٢٣"
          className="page-search-input full content-hub-search"
          aria-label="الانتقال برقم الحديث"
        />
      </div>

      {authenticityClass === "sahih" && (
        <>
          <div className="hadith-filter-section">
            <p className="hadith-filter-label">رقم الكتاب</p>
            <input
              value={bookQuery}
              onChange={(e) => setBookQuery(e.target.value)}
              inputMode="numeric"
              placeholder="مثال: 2"
              className="page-search-input full content-hub-search"
              aria-label="تصفية برقم الكتاب"
            />
          </div>
          <div className="hadith-filter-section">
            <p className="hadith-filter-label">رقم الحديث داخل الكتاب / الرقم العربي</p>
            <input
              value={inBookQuery}
              onChange={(e) => setInBookQuery(e.target.value)}
              inputMode="numeric"
              placeholder="مثال: 15"
              className="page-search-input full content-hub-search"
              aria-label="تصفية برقم الحديث داخل الكتاب"
            />
          </div>
        </>
      )}

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">الترتيب</p>
        <ExclusiveChoiceGroup
          ariaLabel="ترتيب الأحاديث"
          value={sortMode}
          onChange={(id) => setSortMode(id as HadithSortMode)}
          items={[
            { id: "number", label: "حسب الرقم" },
            { id: "default", label: "افتراضي" },
          ]}
        />
      </div>

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">المجموعة / طريق التخريج بالمصدر</p>
        <ExclusiveChoiceGroup
          ariaLabel="تصفية مجموعة الحديث"
          value={activeCollection}
          onChange={setActiveCollection}
          items={collections.map((c) => ({
            id: c,
            label: c === "الكل" ? "الكل" : collectionLabel(c),
          }))}
        />
      </div>

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">الموضوع</p>
        <ExclusiveChoiceGroup
          ariaLabel="تصفية موضوع الحديث"
          value={activeCategory}
          onChange={setActiveCategory}
          items={CATEGORIES.map((cat) => ({ id: cat.id, label: cat.label }))}
        />
      </div>

      <div className="hadith-filter-section">
        <button
          type="button"
          className="hadith-clear-search"
          onClick={() => {
            setSearch("");
            setNumberQuery("");
            setBookQuery("");
            setInBookQuery("");
            setSearchScope("matn");
            setActiveCollection("الكل");
            setActiveCategory("الكل");
            setSortMode(authenticityClass === "sahih" ? "number" : "default");
          }}
        >
          إعادة الضبط
        </button>
      </div>
    </div>
  );

  const inner = (
    <>
      {!embedded && (
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} showBack={false} />
      )}

      {!embedded && meta.notice && (
        <p className="hadith-scientific-notice" role="note">
          <AlertTriangle size={16} aria-hidden="true" />
          <span>{meta.notice}</span>
        </p>
      )}

      {!embedded && (
        <nav className="hadith-class-switch" aria-label="أقسام الحديث">
          <Link href="/hadith" className="hadith-class-switch__link">المركز</Link>
          <Link href="/hadith/sahih" className={`hadith-class-switch__link${authenticityClass === "sahih" ? " is-active" : ""}`}>الصحيح</Link>
          <Link href="/hadith/daif" className={`hadith-class-switch__link${authenticityClass === "daif" ? " is-active" : ""}`}>الضعيف</Link>
          <Link href="/hadith/mawdu" className={`hadith-class-switch__link${authenticityClass === "mawdu" ? " is-active" : ""}`}>الموضوع</Link>
          <Link href="/hadith/books" className="hadith-class-switch__link hadith-class-switch__link--books">الكتب</Link>
        </nav>
      )}

      <div className="hadith-toolbar">
        <label className="hadith-toolbar__search" htmlFor={`hadith-q-${authenticityClass}`}>
          <span className="sr-only">بحث في متن الحديث أو المصدر</span>
          <input
            id={`hadith-q-${authenticityClass}`}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث في متن الحديث أو المصدر..."
            className="hadith-toolbar__input"
            aria-label="بحث في متن الحديث أو المصدر"
          />
        </label>
        <FilterToggle expanded={filtersOpen} onClick={() => setFiltersOpen(true)} label="تصفية" />
      </div>

      <div className="ds-section__head hadith-toolbar__meta">
        <div className="hadith-stats-row">
          <span className="hadith-stat">
            <strong>{displayItems.length.toLocaleString("ar-EG")}</strong> {meta.countUnit}
          </span>
          {collections.length > 1 && (
            <span className="hadith-stat">
              <strong>{collections.length - 1}</strong> مجموعة
            </span>
          )}
          {(debouncedSearch || debouncedNumber || debouncedBook || debouncedInBook || activeCategory !== "الكل") && (
            <button
              type="button"
              className="hadith-clear-search"
              onClick={() => {
                setSearch("");
                setNumberQuery("");
                setBookQuery("");
                setInBookQuery("");
                setSearchScope("matn");
                setActiveCategory("الكل");
                setActiveCollection("الكل");
              }}
            >
              مسح التصفية
            </button>
          )}
        </div>
      </div>

      <div className="hadith-quick-cats" role="radiogroup" aria-label="تصفية موضوع الحديث">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            role="radio"
            active={activeCategory === cat.id}
            className="hadith-quick-cat"
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.label}
          </Chip>
        ))}
      </div>

      {loading ? (
        <SkeletonCardGrid count={8} />
      ) : displayItems.length === 0 ? (
        <Empty
          text={
            debouncedSearch.trim()
              ? `لا توجد أحاديث مطابقة لـ «${debouncedSearch.trim()}».`
              : meta.empty
          }
        />
      ) : (
        <>
          {authenticityClass === "sahih" && (
            <p className="hadith-source-note" role="note">
              صحيح البخاري ومسلم — المتن في القائمة، والسند في التفاصيل.
              العرض الخارجي للمتون فقط؛ السند والتخريج في التفاصيل.{" "}
              <Link href="/hadith/books">تصفح بالأبواب</Link>
            </p>
          )}
          <div className="hadith-grid">
            {pagedItems.map((h) => (
              <HadithCard key={h.id} h={h} onExpand={setExpandedHadith} />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="hadith-pagination" role="navigation" aria-label="صفحات الأحاديث">
              <button
                type="button"
                className="hadith-pagination__btn"
                disabled={safePage <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                السابق
              </button>
              <span className="hadith-pagination__info">
                صفحة {safePage.toLocaleString("ar-EG")} من {totalPages.toLocaleString("ar-EG")}
              </span>
              <button
                type="button"
                className="hadith-pagination__btn"
                disabled={safePage >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                التالي
              </button>
            </div>
          )}
        </>
      )}

      {!embedded && (
        <aside className="ds-filters-panel ds-filters-panel--desktop">
          <div className="ds-filters-panel__head">
            <h2>بحث وتصفية</h2>
          </div>
          {filtersPanel}
        </aside>
      )}

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} title="بحث وتصفية">
        {filtersPanel}
      </FilterBottomSheet>

      {expandedHadith && (
        <HadithDetailModal
          h={expandedHadith}
          onClose={() => setExpandedHadith(null)}
        />
      )}

      {!embedded && !loading && displayItems.length > 0 && (
        <RecommendationWidget
          context="hadith"
          contentType="hadith"
          limit={4}
          layout="row"
          className="mt-8"
        />
      )}

    </>
  );

  if (embedded) {
    return <section className="hadith-embedded-section">{inner}</section>;
  }

  return (
    <div className="page-shell content-hub-page ds-page hadith-page">
      {inner}
    </div>
  );
}

export default function HadithPage() {
  useReadingScrollMemory("hadith");
  useEffect(() => {
    applyPageSeo({
      path: "/hadith",
      title: "الحديث وعلومه | المجلس العلمي",
      description: "تصفح الأحاديث ودرجاتها وكتب الحديث ومصطلحاته بطريقة منظمة.",
      keywords: ["أحاديث نبوية", "الحديث الشريف", "صحيح البخاري", "صحيح مسلم", "الحديث الضعيف", "مصطلح الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام الحديث وعلومه",
          numberOfItems: 6,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: "الأحاديث الصحيحة", url: "https://majlisilm.com/hadith/sahih" },
            { "@type": "ListItem", position: 2, name: "الأحاديث الضعيفة", url: "https://majlisilm.com/hadith/daif" },
            { "@type": "ListItem", position: 3, name: "الأحاديث الموضوعة", url: "https://majlisilm.com/hadith/mawdu" },
            { "@type": "ListItem", position: 4, name: "كتب الحديث", url: "https://majlisilm.com/hadith/books" },
            { "@type": "ListItem", position: 5, name: "مصطلح الحديث", url: "https://majlisilm.com/hadith-science" },
            { "@type": "ListItem", position: 6, name: "الأربعون النووية", url: "https://majlisilm.com/arbaeen-nawawi" },
          ],
        },
      ],
    });
  }, []);

  const hubCards = [
    { href: "/hadith/sahih", title: "الأحاديث الصحيحة", desc: "متون الصحيحين مع المصدر والتخريج", tone: "sahih" },
    { href: "/hadith/daif", title: "الأحاديث الضعيفة", desc: "للتخريج والتمييز لا للاحتجاج", tone: "daif" },
    { href: "/hadith/mawdu", title: "الأحاديث الموضوعة", desc: "للتحذير والبيان", tone: "mawdu" },
    { href: "/hadith/books", title: "كتب الحديث", desc: "البخاري ومسلم بالأبواب", tone: "books" },
    { href: "/hadith-science", title: "مصطلح الحديث", desc: "درجات الحديث ومباحث المصطلح", tone: "science" },
    { href: "/arbaeen-nawawi", title: "الأربعون النووية", desc: "أربعون حديثًا مع الشرح", tone: "arbaeen" },
  ] as const;

  return (
    <SectionTemplatePage
      route="/hadith"
      eyebrow="علوم الحديث النبوي"
      title="الحديث وعلومه"
      subtitle="تصفح الأحاديث ودرجاتها وكتب الحديث ومصطلحاته بطريقة منظمة."
      groupTitle="أقسام الحديث وعلومه"
    >
      <div className="hadith-page hadith-page--hub">
        <div className="hub-card-grid">
          {hubCards.map((c) => (
            <HubCard
              key={c.href}
              href={c.href}
              title={c.title}
              description={c.desc}
            />
          ))}
        </div>
        <ExploreAlsoNav
          title="استكشف أيضًا"
          links={[
            { href: "/memorize", label: "بطاقات الحفظ" },
            { href: "/scholars", label: "أعلام وتراجم" },
            { href: "/quiz", label: "سين جيم" },
          ]}
        />
        <SectionQuiz sectionId="hadith" aria-label="اختبر معلوماتك في علوم الحديث" count={4} />
      </div>
    </SectionTemplatePage>
  );
}
