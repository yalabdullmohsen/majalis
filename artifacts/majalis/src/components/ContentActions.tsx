import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { supabase } from "@/lib/supabase";

interface Props {
  contentType: string;
  contentId: string;
  shareTitle?: string;
  shareUrl?: string;
}

const REPORT_TYPES = ["خطأ_علمي", "خطأ_إملائي", "محتوى_غير_لائق", "رابط_مكسور", "أخرى"] as const;

// أزرار المشاركة أُلغيت في كل أنحاء الموقع بطلب صريح من المالك
// (2026-07-24). يبقى المكوّن مُصدَّرًا بنفس الواجهة كي لا تُكسَر نقاط
// الاستدعاء القائمة (ContentDetailLayout وContentActions نفسه)؛ لا
// يعرض شيئًا الآن.
export function ShareButtons(_props: { title?: string; url?: string }) {
  return null;
}

export default function ContentActions({ contentType, contentId, shareTitle, shareUrl }: Props) {
  const [, navigate] = useLocation();
  const [rating, setRating] = useState(0);
  const [bookmarked, setBookmarked] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [reportType, setReportType] = useState("");
  const [reportDesc, setReportDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const [{ data: ratingRow }, { data: bookmarkRow }] = await Promise.all([
        supabase
          .from("content_ratings")
          .select("rating")
          .eq("user_id", user.id)
          .eq("content_type", contentType)
          .eq("content_id", contentId)
          .maybeSingle(),
        supabase
          .from("bookmarks")
          .select("id")
          .eq("user_id", user.id)
          .eq("content_type", contentType)
          .eq("content_id", contentId)
          .maybeSingle(),
      ]);
      if (ratingRow?.rating) setRating(ratingRow.rating);
      if (bookmarkRow) setBookmarked(true);
    };
    load();
  }, [contentType, contentId]);

  const requireUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(window.location.pathname)}`);
      return null;
    }
    return user;
  };

  const handleRating = async (stars: number) => {
    const user = await requireUser();
    if (!user) return;
    setRating(stars);
    await supabase.from("content_ratings").upsert(
      { user_id: user.id, content_type: contentType, content_id: contentId, rating: stars },
      { onConflict: "user_id,content_type,content_id" }
    );
  };

  const handleBookmark = async () => {
    const user = await requireUser();
    if (!user) return;
    if (bookmarked) {
      await supabase
        .from("bookmarks")
        .delete()
        .match({ user_id: user.id, content_type: contentType, content_id: contentId });
    } else {
      await supabase.from("bookmarks").insert({
        user_id: user.id,
        content_type: contentType,
        content_id: contentId,
      });
    }
    setBookmarked(!bookmarked);
  };

  const submitReport = async () => {
    if (!reportType) return;
    setSubmitting(true);
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from("error_reports").insert({
      reporter_id: user?.id,
      content_type: contentType,
      content_id: contentId,
      report_type: reportType,
      description: reportDesc,
    });
    setShowReport(false);
    setReportType("");
    setReportDesc("");
    setSubmitting(false);
    alert("شكراً، تم إرسال البلاغ وسيُراجع قريباً");
  };

  return (
    <div className="ca-root">
      <ShareButtons title={shareTitle} url={shareUrl} />

      <div className="ca-actions-row">
        <div className="ca-stars" role="group" aria-label="تقييم المحتوى">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => handleRating(star)}
              className={`ca-star${rating >= star ? " ca-star--active" : ""}`}
              aria-label={`تقييم ${star} من 5`}
            >
              ★
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={handleBookmark}
          className={`ca-bookmark-btn${bookmarked ? " ca-bookmark-btn--saved" : ""}`}
        >
          {bookmarked ? "محفوظ ✓" : "احفظ"}
        </button>

        <button
          type="button"
          onClick={() => setShowReport(!showReport)}
          className="ca-report-btn"
        >
          ⚑ إبلاغ عن خطأ
        </button>
      </div>

      {showReport && (
        <div className="ca-report-panel">
          <h4 className="ca-report-title">نوع الخطأ</h4>
          <div className="ca-report-types">
            {REPORT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                className={`ca-report-chip${reportType === type ? " ca-report-chip--active" : ""}`}
              >
                {type.replace(/_/g, " ")}
              </button>
            ))}
          </div>
          <textarea
            value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
            rows={2}
            aria-label="تفاصيل إضافية (اختياري)" placeholder="تفاصيل إضافية (اختياري)..."
            className="ca-report-textarea"
          />
          <button
            type="button"
            onClick={submitReport}
            disabled={!reportType || submitting}
            className="ca-report-submit"
          >
            {submitting ? "جاري الإرسال..." : "إرسال البلاغ"}
          </button>
        </div>
      )}
    </div>
  );
}
