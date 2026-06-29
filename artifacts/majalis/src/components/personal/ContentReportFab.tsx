import { useState } from "react";
import { useLocation } from "wouter";
import { submitContentReport, REPORT_TYPES } from "@/lib/personal-learning";

type Props = {
  contentType?: string;
  contentId?: string;
};

export function ContentReportFab({ contentType = "page", contentId }: Props) {
  const [location] = useLocation();
  const [open, setOpen] = useState(false);
  const [reportType, setReportType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async () => {
    if (!reportType) return;
    setSubmitting(true);
    const ok = await submitContentReport({
      content_type: contentType,
      content_id: contentId,
      report_type: reportType,
      description,
      page_url: typeof window !== "undefined" ? window.location.href : location,
      metadata: { path: location },
    });
    setSubmitting(false);
    if (ok) {
      setOpen(false);
      setReportType("");
      setDescription("");
      alert("شكراً — تم إرسال البلاغ وسيُراجع من الإدارة");
    } else {
      alert("تعذر الإرسال — حاول لاحقاً");
    }
  };

  return (
    <>
      <button
        type="button"
        className="content-report-fab"
        onClick={() => setOpen(true)}
        aria-label="الإبلاغ عن خطأ أو اقتراح"
        title="الإبلاغ عن خطأ أو اقتراح"
      >
        !
      </button>

      {open && (
        <div className="content-report-overlay" role="dialog" aria-label="إبلاغ أو اقتراح">
          <div className="content-report-modal">
            <h3>الإبلاغ عن خطأ أو اقتراح</h3>
            <p className="content-report-path">{location}</p>
            <div className="content-report-types">
              {REPORT_TYPES.map((t) => (
                <button
                  key={t.value}
                  type="button"
                  className={`ds-btn ds-btn--sm ${reportType === t.value ? "ds-btn--primary" : "ds-btn--ghost"}`}
                  onClick={() => setReportType(t.value)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <textarea
              className="ds-input"
              rows={3}
              placeholder="تفاصيل الخطأ أو الاقتراح..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <div className="content-report-actions">
              <button type="button" className="ds-btn ds-btn--ghost" onClick={() => setOpen(false)}>إلغاء</button>
              <button type="button" className="ds-btn ds-btn--primary" disabled={!reportType || submitting} onClick={submit}>
                {submitting ? "جاري الإرسال..." : "إرسال"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
