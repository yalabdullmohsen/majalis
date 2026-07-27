import { useEffect, useMemo, useRef, useState } from "react";
import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import { AlertTriangle, BookOpen, Star } from "lucide-react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import { truncateAtWord } from "@/lib/utils";
import { AdminQuickEdit } from "@/components/AdminQuickEdit";
import { getVerifiedHadith } from "@/lib/supabase";
import { RequestManager } from "@/lib/request-manager";
import { arabicMatchAny } from "@/lib/arabic-search";
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
import { RelatedKnowledge } from "@/components/RelatedKnowledge";
import { ExploreAlsoNav } from "@/components/ExploreAlsoNav";
import { FilterBottomSheet, FilterToggle } from "@/components/layout/FilterBottomSheet";
import { RecommendationWidget } from "@/components/recommendations/RecommendationWidget";
import { CitationActionBar } from "@/components/citation/CitationActionBar";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { HadithStatsPanel } from "@/components/hadith/HadithStatsPanel";
import { fetchAllHadiths, type CdnHadith } from "@/lib/hadith-cdn-service";
import { fetchSahihaynLocal } from "@/lib/sahihayn-local";
import { getLocalVerifiedHadith } from "@/lib/verified-hadith-local-seed";
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
function mergeHadithRows(remote: HadithItem[], authenticityClass: HadithClass): HadithItem[] {
  const local = getLocalVerifiedHadith(authenticityClass).map((h) => ({
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
};

/** لا نُلوّن درجة مجهولة بلون الصحيح — الدرجة غير المعروفة تبقى محايدة. */
function gradeClass(grade: string | null): string {
  if (!grade) return "hadith-grade--unknown";
  return GRADE_CLASS[grade.trim()] ?? "hadith-grade--unknown";
}

const GRADE_UNKNOWN_LABEL = "الدرجة غير مثبتة في المصدر";

// ─── HadithCard ──────────────────────────────────────────────────────────────

function HadithCard({ h, onExpand }: { h: HadithItem; onExpand: (h: HadithItem) => void }) {
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (copyTimerRef.current) clearTimeout(copyTimerRef.current); }, []);

  const displayMatn = extractDisplayMatn(h.title, h.text);

  function handleCopy(e: React.MouseEvent) {
    e.stopPropagation();
    const content = `${displayMatn}\n\n— ${h.source_name ?? ""}${h.hadith_number ? ` ${h.hadith_number}` : ""}`;
    navigator.clipboard.writeText(content).then(() => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      setCopied(true);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    });
  }

  function handleSave(e: React.MouseEvent) {
    e.stopPropagation();
    setSaved((s) => !s);
  }

  const compRef = h.metadata?.companion as string | undefined;
  const takhrijShort = h.metadata?.takhrij ? String(h.metadata.takhrij) : null;

  return (
    <div
      id={h.id}
      className="hadith-card ui-card"
      onClick={() => onExpand(h)}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onExpand(h)}
      tabIndex={0}
      role="button"
      aria-label={`عرض تفاصيل الحديث: ${h.title ?? displayMatn.slice(0, 40)}`}
    >
      {/* Header */}
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
        {h.grade ? (
          <span className={`hadith-grade ${gradeClass(h.grade)}`}>{h.grade}</span>
        ) : (
          <span className="hadith-grade hadith-grade--unknown">{GRADE_UNKNOWN_LABEL}</span>
        )}
      </header>

      {/* Title */}
      {h.title && h.title !== "حديث" && (
        <h3 className="hadith-card__title">{h.title}</h3>
      )}
      {h.chapter && (
        <p className="hadith-card__chapter">{h.chapter}</p>
      )}

      {/* المتن فقط — بلا سند في العرض الخارجي */}
      <blockquote className="hadith-card__text hadith-card__text--matn">{displayMatn}</blockquote>

      {/* Meta */}
      <div className="hadith-card__meta">
        {(h.narrator || compRef) && (
          <span className="hadith-meta-item">
            <span className="hadith-meta-label">الراوي:</span>{" "}
            {h.narrator ?? compRef}
          </span>
        )}
        {h.source_name && (
          <span className="hadith-meta-item">
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

      {/* Keywords */}
      {h.keywords && h.keywords.length > 0 && (
        <div className="hadith-card__keywords">
          {h.keywords.slice(0, 4).map((k) => (
            <span key={k} className="hadith-keyword">{k}</span>
          ))}
        </div>
      )}

      {/* Actions. onClick لمنع انتشار النقر إلى البطاقة الأم (التي تفتح تفاصيل
          الحديث عند النقر) — لا إجراء فعلي هنا يحتاج مكافئ لوحة مفاتيح؛ كل
          الأزرار الفعلية داخل هذا الصف قابلة للوصول بلوحة المفاتيح أصلًا. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
      <div className="hadith-card__actions" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className={`hadith-action-btn ${saved ? "hadith-action-btn--active" : ""}`}
          title={saved ? "محفوظ" : "حفظ في المفضلة"}
          onClick={handleSave}
          aria-label="حفظ في المفضلة"
        >
          {saved ? <Star size={15} className="icon-star--filled" /> : <Star size={15} />}
        </button>
        <button
          type="button"
          className="hadith-action-btn"
          onClick={handleCopy}
          aria-label="نسخ المتن"
        >
          {copied ? "✓" : "⎘"}
        </button>
        <button
          type="button"
          className="hadith-action-btn"
          onClick={(e) => { e.stopPropagation(); onExpand(h); }}
          aria-label="عرض التفاصيل والتخريج"
        >
          ↗
        </button>
        <ShareButtons
          title={h.title || displayMatn.slice(0, 60) || "حديث نبوي شريف"}
          url="https://www.majlisilm.com/hadith"
        />
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
      ? "عضوية الصحيحين"
      : meta.takhrij_method === "curated+membership"
        ? "عضوية الصحيحين + تخريج منسّق"
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
              <span className={`hadith-grade ${gradeClass(h.grade)}`}>{h.grade}</span>
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
              <span className={`hadith-grade ${gradeClass(h.grade)}`}>{h.grade}</span>
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
          <p><AlertTriangle size={13} className="inline ml-1" />تحقق من صحة الحديث ومصدره قبل النشر أو الاستشهاد به.</p>
        </footer>
      </div>
      <AdminQuickEdit section="qa" />
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
  { id: "العلم", label: "العلم", keys: ["علم","طلب العلم","قرآن","سنة"] },
  { id: "المعاملات", label: "المعاملات", keys: ["حلال","حرام","بينة","ضرر","قضاء"] },
  { id: "الأخوة والاجتماع", label: "الأخوة", keys: ["أخوة","مسلم","اجتماع","هجران","وحدة"] },
];

export const HADITH_CLASS_META: Record<HadithClass, {
  eyebrow: string; title: string; subtitle: string; empty: string; countUnit: string;
}> = {
  sahih: {
    eyebrow: "مرجع الصحيحين",
    title: "الأحاديث الصحيحة",
    subtitle: "مرجع صحيح البخاري (٧٥٨٠) وصحيح مسلم (٧٣٦٠) كاملاً — الصحة بعضوية الصحيحين. البطاقات تعرض المتن فقط؛ السند والتخريج في التفاصيل.",
    empty: "لا توجد أحاديث في هذا التصنيف.",
    countUnit: "حديث",
  },
  daif: {
    eyebrow: "التمييز والتحذير",
    title: "الأحاديث المكذوبة والضعيفة",
    subtitle: "روايات ضعيفة أو مكذوبة النسبة، تُعرض للتمييز والتحذير لا للاحتجاج.",
    empty: "لا تُدرَج في هذا القسم رواية إلا بتخريج منسوب إلى إمام معتمد في التضعيف.",
    countUnit: "حديث مكذوب/ضعيف",
  },
  mawdu: {
    eyebrow: "التحذير والبيان",
    title: "الأحاديث الموضوعة",
    subtitle: "أشهر الموضوعات على النبي ﷺ مع بيان من حكم بالوضع — للتحذير لا للاحتجاج.",
    empty: "لا يُذكر الموضوع إلا مقروناً ببيان وضعه ومَن حكم عليه من الأئمة. والقاعدة: «من حدّث عني بحديث يُرى أنه كذب فهو أحد الكاذبين» — رواه مسلم.",
    countUnit: "حديث موضوع",
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
    setLoading(true);
    RequestManager.run(`hadith:list:${authenticityClass}`, () => getVerifiedHadith({ limit: 500, authenticityClass }))
      .then(async ({ data }) => {
        const curated = mergeHadithRows((data as HadithItem[]) ?? [], authenticityClass);

        if (authenticityClass === "sahih") {
          // مرجع الصحيحين الكامل (محلي أولاً) + البطاقات المنسّقة ذات الشرح
          let bukhari: CdnHadith[] = [];
          let muslim: CdnHadith[] = [];
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

  const displayItems = useMemo(() => {
    let list = items;
    if (activeCollection !== "الكل") {
      list = list.filter((h) => h.collection === activeCollection);
    }
    if (activeCategory !== "الكل") {
      const cat = CATEGORIES.find((c) => c.id === activeCategory);
      if (cat?.keys) {
        list = list.filter((h) =>
          cat.keys!.some((k) =>
            h.keywords?.includes(k) ||
            h.chapter?.includes(k) ||
            h.title?.includes(k) ||
            extractDisplayMatn(h.title, h.text).includes(k) ||
            String(h.metadata?.takhrij ?? "").includes(k)
          )
        );
      }
    }
    if (debouncedNumber.trim()) {
      list = list.filter((h) => hadithNumberMatches(h.hadith_number, debouncedNumber));
    }
    if (debouncedBook.trim()) {
      const bq = normalizeHadithDigits(debouncedBook);
      list = list.filter((h) => {
        const book = h.metadata?.book != null ? String(h.metadata.book) : "";
        const chapterDigits = normalizeHadithDigits(h.chapter || "");
        return (book && (book === bq || book.startsWith(bq))) ||
          (chapterDigits && (chapterDigits === bq || chapterDigits.startsWith(bq)));
      });
    }
    if (debouncedInBook.trim()) {
      const iq = normalizeHadithDigits(debouncedInBook);
      list = list.filter((h) => {
        const inBook = h.metadata?.in_book != null ? String(h.metadata.in_book) : "";
        const arabicNum = h.metadata?.arabic_number != null ? String(h.metadata.arabic_number) : "";
        return hadithNumberMatches(inBook, iq) || hadithNumberMatches(arabicNum, iq);
      });
    }
    if (debouncedSearch.trim()) {
      const q = debouncedSearch.trim();
      list = list.filter((h) => {
        if (searchScope === "matn") {
          return arabicMatchAny([extractDisplayMatn(h.title, h.text), h.title], q);
        }
        if (searchScope === "number") {
          return (
            hadithNumberMatches(h.hadith_number, q) ||
            hadithNumberMatches(String(h.metadata?.book ?? ""), q) ||
            hadithNumberMatches(String(h.metadata?.in_book ?? ""), q) ||
            hadithNumberMatches(String(h.metadata?.arabic_number ?? ""), q)
          );
        }
        if (searchScope === "takhrij") {
          return arabicMatchAny([
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
          ], q);
        }
        return arabicMatchAny([
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
        ], q);
      });
    }
    if (sortMode !== "default") {
      list = [...list].sort((a, b) => compareHadithAccess(a, b, sortMode));
    }
    return list;
  }, [items, activeCollection, activeCategory, debouncedNumber, debouncedBook, debouncedInBook, debouncedSearch, sortMode, searchScope]);

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
        <p className="hadith-filter-label">نطاق البحث (طرق التخريج الحديثة)</p>
        <div className="content-hub-chips" role="group" aria-label="نطاق البحث">
          {([
            ["matn", "المتن فقط"],
            ["full", "سند + متن"],
            ["takhrij", "تخريج وشرح"],
            ["number", "أرقام التخريج"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSearchScope(id)}
              className={searchScope === id ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            >
              {label}
            </button>
          ))}
        </div>
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
        <div className="content-hub-chips" role="group" aria-label="ترتيب الأحاديث">
          {([
            ["number", "حسب الرقم"],
            ["default", "افتراضي"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => setSortMode(id)}
              className={sortMode === id ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">المجموعة / طريق التخريج بالمصدر</p>
        <div className="content-hub-chips" role="tablist" aria-label="تصفية مجموعة الحديث">
          {collections.map((c) => (
            <button
              key={c}
              role="tab"
              type="button"
              onClick={() => setActiveCollection(c)}
              className={activeCollection === c ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
              aria-selected={activeCollection === c}
            >
              {c === "الكل" ? "الكل" : collectionLabel(c)}
            </button>
          ))}
        </div>
      </div>

      <div className="hadith-filter-section">
        <p className="hadith-filter-label">الموضوع</p>
        <div className="content-hub-chips">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setActiveCategory(cat.id)}
              className={activeCategory === cat.id ? "content-hub-chip content-hub-chip--active" : "content-hub-chip"}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  const inner = (
    <>
      {embedded ? (
        <div className="hadith-section-header">
          <span className="hadith-section-eyebrow">{meta.eyebrow}</span>
          <h2 className="hadith-section-title">{meta.title}</h2>
          <p className="hadith-section-subtitle">{meta.subtitle}</p>
        </div>
      ) : (
        <PageHeader eyebrow={meta.eyebrow} title={meta.title} subtitle={meta.subtitle} />
      )}

      <div className="ds-section__head">
        <div className="hadith-stats-row">
          <span className="hadith-stat">
            <strong>{displayItems.length.toLocaleString("ar-EG")}</strong> {meta.countUnit}
          </span>
          {collections.length > 1 && (
            <span className="hadith-stat">
              <strong>{collections.length - 1}</strong> مجموعة
            </span>
          )}
          {(debouncedSearch || debouncedNumber || debouncedBook || debouncedInBook) && (
            <button
              type="button"
              className="hadith-clear-search"
              onClick={() => {
                setSearch("");
                setNumberQuery("");
                setBookQuery("");
                setInBookQuery("");
                setSearchScope("matn");
              }}
            >
              مسح الفلاتر ✕
            </button>
          )}
        </div>
        <FilterToggle expanded={filtersOpen} onClick={() => setFiltersOpen(true)} label="بحث وتصفية" />
      </div>

      <nav className="hadith-class-switch" aria-label="أقسام الحديث">
        <Link href="/hadith/sahih" className={`hadith-class-switch__link${authenticityClass === "sahih" ? " is-active" : ""}`}>الصحيح</Link>
        <Link href="/hadith/mawdu" className={`hadith-class-switch__link${authenticityClass === "mawdu" ? " is-active" : ""}`}>الموضوع</Link>
        <Link href="/hadith/daif" className={`hadith-class-switch__link${authenticityClass === "daif" ? " is-active" : ""}`}>المكذوب</Link>
        <Link href="/hadith/books" className="hadith-class-switch__link hadith-class-switch__link--books">الكتب كاملة</Link>
      </nav>

      {authenticityClass === "sahih" && <HadithStatsPanel compact className="hadith-stats-inline" />}

      <div className="hadith-access-bar" aria-label="بحث حديث مبسّط">
        <div className="hadith-access-bar__row">
          <label className="hadith-access-bar__label" htmlFor={`hadith-num-${authenticityClass}`}>رقم</label>
          <input
            id={`hadith-num-${authenticityClass}`}
            value={numberQuery}
            onChange={(e) => setNumberQuery(e.target.value)}
            inputMode="numeric"
            placeholder="رقم الحديث…"
            className="hadith-access-bar__num"
            aria-label="تصفية برقم الحديث"
          />
          <div className="hadith-access-bar__sort" role="group" aria-label="الترتيب">
            <button type="button" className={sortMode === "number" ? "is-active" : ""} onClick={() => setSortMode("number")}>رقم</button>
            <button type="button" className={sortMode === "default" ? "is-active" : ""} onClick={() => setSortMode("default")}>افتراضي</button>
          </div>
        </div>
        <div className="hadith-access-bar__row hadith-access-bar__row--scope" role="group" aria-label="نطاق البحث">
          <span className="hadith-access-bar__label">بحث</span>
          {([
            ["matn", "متن"],
            ["full", "سند+متن"],
            ["takhrij", "تخريج"],
            ["number", "رقم"],
          ] as const).map(([id, label]) => (
            <button
              key={id}
              type="button"
              className={searchScope === id ? "is-active" : ""}
              onClick={() => setSearchScope(id)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Category chips (quick filter on desktop) */}
      <div className="hadith-quick-cats" role="tablist" aria-label="تصفية موضوع الحديث">
        {CATEGORIES.map((cat) => (
          <Chip
            key={cat.id}
            role="tab"
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
              المرجع الكامل: صحيح البخاري (٧٥٨٠) وصحيح مسلم (٧٣٦٠) — الصحة بعضوية الصحيحين.
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

      <FilterBottomSheet open={filtersOpen} onClose={() => setFiltersOpen(false)} aria-label="بحث وتصفية">
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

      {!embedded && (
        <RelatedKnowledge kind="hadith" title="مواد ذات صلة بالحديث" limit={6} />
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
      title: "الأحاديث النبوية الشريفة | المجلس العلمي",
      description: "مكتبة الأحاديث النبوية: الصحيحان كاملان، مع أقسام الموضوع والمكذوب، ولوحة إحصائيات لعلوم الحديث والتخريج.",
      keywords: ["أحاديث نبوية", "الحديث الشريف", "صحيح البخاري", "صحيح مسلم", "الحديث الموضوع", "مصطلح الحديث"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "أقسام الأحاديث النبوية",
          numberOfItems: 3,
          itemListElement: [
            { "@type": "ListItem", position: 1, name: HADITH_CLASS_META.sahih.title, description: HADITH_CLASS_META.sahih.subtitle, url: "https://www.majlisilm.com/hadith/sahih" },
            { "@type": "ListItem", position: 2, name: HADITH_CLASS_META.mawdu.title, description: HADITH_CLASS_META.mawdu.subtitle, url: "https://www.majlisilm.com/hadith/mawdu" },
            { "@type": "ListItem", position: 3, name: HADITH_CLASS_META.daif.title, description: HADITH_CLASS_META.daif.subtitle, url: "https://www.majlisilm.com/hadith/daif" },
          ],
        },
      ],
    });
  }, []);

  return (
    <div className="page-shell content-hub-page ds-page hadith-page hadith-page--stacked">
      <PageHeader
        eyebrow="السنة النبوية الشريفة"
        title="الأحاديث النبوية"
        subtitle="ثلاثة أقسام مرتّبة: الصحيح ثم الموضوع ثم المكذوب — مع إحصائيات علوم الحديث وبحث حديث مبسّط."
      />
      <HadithStatsPanel />
      <nav className="hadith-class-switch" aria-label="أقسام الحديث">
        <Link href="/hadith/sahih" className="hadith-class-switch__link">الصحيح</Link>
        <Link href="/hadith/mawdu" className="hadith-class-switch__link">الموضوع</Link>
        <Link href="/hadith/daif" className="hadith-class-switch__link">المكذوب</Link>
        <Link href="/hadith/books" className="hadith-class-switch__link hadith-class-switch__link--books">الكتب كاملة</Link>
      </nav>
      <div className="hadith-stacked-sections">
        <HadithSection authenticityClass="sahih" embedded />
        <div className="hadith-section-sep" role="separator" aria-hidden="true" />
        <HadithSection authenticityClass="mawdu" embedded />
        <div className="hadith-section-sep" role="separator" aria-hidden="true" />
        <HadithSection authenticityClass="daif" embedded />
      </div>
      <RecommendationWidget
        context="hadith"
        contentType="hadith"
        limit={4}
        layout="row"
        className="mt-8"
      />

      <div className="hadith-books-banner" dir="rtl">
        <BookOpen size={20} className="hadith-books-banner__icon" aria-hidden="true" />
        <div>
          <strong>الكتب الحديثية الكاملة</strong>
          <p>تصفّح صحيح البخاري (٧٥٨٠) وصحيح مسلم (٧٣٦٠) مع البحث والتصفح بالكتاب والباب.</p>
        </div>
        <Link href="/hadith/books" className="hadith-books-banner__btn">
          تصفّح الكتب ←
        </Link>
      </div>
      <ExploreAlsoNav
        title="استكشف أيضًا"
        links={[
          { href: "/hadith/books", label: "كتب الحديث الكاملة" },
          { href: "/hadith-science", label: "مصطلح الحديث" },
          { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
          { href: "/scholars", label: "العلماء" },
        ]}
      />

      <div className="px-4 pb-6">
        <SectionQuiz
          categoryId="hadith"
          aria-label="اختبر معلوماتك في علوم الحديث"
          count={4}
        />
      </div>
    </div>
  );
}
