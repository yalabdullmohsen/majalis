/**
 * ScholarlyTrustBadge — شارة التوثيق العلمي
 * تُعرض أسفل المحتوى الشرعي لإظهار بيانات المصدر والتحقق.
 * إذا كانت البيانات غير متوفرة، تُعرض عبارة واضحة.
 */
import { BookOpen, Calendar, CheckCircle2, Clock, User, XCircle } from "lucide-react";
import { Link } from "wouter";
import { ContentReportButton } from "@/components/ContentReportButton";

export type TrustData = {
  author?: string | null;
  mufti?: string | null;
  source?: string | null;
  book?: string | null;
  volume?: string | null;
  page?: string | null;
  hadithGrade?: string | null;
  hadithNumber?: string | null;
  reviewer?: string | null;
  verifiedBy?: string | null;
  isApproved?: boolean | null;
  publishedAt?: string | null;
  updatedAt?: string | null;
  contentType?: "نقل" | "تلخيص" | "شرح" | "فتوى" | "بحث" | "مقال" | "درس" | string | null;
  madhab?: string | null;
  hasKhilaf?: boolean | null;
  sourceUrl?: string | null;
  methodologyPath?: string;
  reportContentType?: string;
  reportContentId?: string | number;
};

type Props = {
  data?: TrustData | null;
  compact?: boolean;
};

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null | undefined }) {
  if (!value) return null;
  return (
    <div className="stb-row" dir="rtl">
      <span className="stb-row__icon" aria-hidden="true">{icon}</span>
      <span className="stb-row__label">{label}:</span>
      <span className="stb-row__value">{value}</span>
    </div>
  );
}

function formatDate(d: string | null | undefined): string | null {
  if (!d) return null;
  try { return new Date(d).toLocaleDateString("ar-SA", { year: "numeric", month: "long", day: "numeric" }); }
  catch { return d; }
}

export function ScholarlyTrustBadge({ data, compact = false }: Props) {
  if (!data) {
    return (
      <aside className="stb-wrap stb-wrap--empty" dir="rtl" aria-label="بيانات التوثيق">
        <p className="stb-missing">
          <XCircle size={13} aria-hidden="true" className="stb-missing__icon" />
          لم تُضف بيانات التوثيق بعد
        </p>
        <Link href="/methodology" className="stb-methodology-link">تعرف على منهجيتنا العلمية</Link>
      </aside>
    );
  }

  const hasAnyData = data.author || data.mufti || data.source || data.book ||
    data.reviewer || data.verifiedBy || data.contentType || data.madhab;

  if (!hasAnyData) {
    return (
      <aside className="stb-wrap stb-wrap--empty" dir="rtl" aria-label="بيانات التوثيق">
        <p className="stb-missing">
          <XCircle size={13} aria-hidden="true" className="stb-missing__icon" />
          لم تُضف بيانات التوثيق بعد
        </p>
        <Link href="/methodology" className="stb-methodology-link">تعرف على منهجيتنا العلمية</Link>
      </aside>
    );
  }

  const authorLabel = data.contentType === "فتوى" ? "المفتي" : "المؤلف / المرجع";
  const personName  = data.mufti || data.author;
  const bookRef     = [data.book, data.volume && `ج${data.volume}`, data.page && `ص${data.page}`].filter(Boolean).join(" ");

  return (
    <aside className={`stb-wrap${compact ? " stb-wrap--compact" : ""}`} dir="rtl" aria-label="بيانات التوثيق العلمي">
      <div className="stb-header">
        {data.isApproved ? (
          <span className="stb-verified"><CheckCircle2 size={13} aria-hidden="true" /> محتوى موثّق</span>
        ) : (
          <span className="stb-pending"><Clock size={13} aria-hidden="true" /> قيد المراجعة</span>
        )}
        {data.contentType && <span className="stb-type">{data.contentType}</span>}
        {data.madhab && <span className="stb-madhab">{data.madhab}</span>}
      </div>

      <div className="stb-grid">
        <Row icon={<User size={12} />} label={authorLabel} value={personName} />
        <Row icon={<BookOpen size={12} />} label="المصدر" value={data.source} />
        {bookRef && <Row icon={<BookOpen size={12} />} label="الكتاب" value={bookRef} />}
        {data.hadithNumber && (
          <Row
            icon={<BookOpen size={12} />}
            label="رقم الحديث"
            value={`${data.hadithNumber}${data.hadithGrade ? ` — ${data.hadithGrade}` : ""}`}
          />
        )}
        <Row icon={<User size={12} />} label="المراجع الشرعي" value={data.verifiedBy || data.reviewer} />
        <Row icon={<Calendar size={12} />} label="تاريخ النشر" value={formatDate(data.publishedAt)} />
        {data.updatedAt && data.updatedAt !== data.publishedAt && (
          <Row icon={<Clock size={12} />} label="آخر تحديث" value={formatDate(data.updatedAt)} />
        )}
      </div>

      {data.hasKhilaf && (
        <p className="stb-khilaf">⚠ توجد أقوال فقهية أخرى في هذه المسألة</p>
      )}

      <div className="stb-footer">
        {data.sourceUrl && (
          <a href={data.sourceUrl} target="_blank" rel="noopener noreferrer" className="stb-source-link">
            المصدر الأصلي ↗
          </a>
        )}
        <Link href={data.methodologyPath || "/methodology"} className="stb-methodology-link">
          منهجيتنا العلمية
        </Link>
        {data.reportContentType && data.reportContentId != null && (
          <ContentReportButton
            contentType={data.reportContentType}
            contentId={data.reportContentId}
          />
        )}
      </div>
    </aside>
  );
}
