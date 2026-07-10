import { useEffect, useState } from "react";
import { Link2, Send } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Props {
  contentType: string;
  contentId: string;
  shareTitle?: string;
  shareUrl?: string;
}

const REPORT_TYPES = ["خطأ_علمي", "خطأ_إملائي", "محتوى_غير_لائق", "رابط_مكسور", "أخرى"] as const;

export function ShareButtons({ title, url }: { title?: string; url?: string }) {
  const [copied, setCopied] = useState(false);
  const shareUrl = url || (typeof window !== "undefined" ? window.location.href : "");
  const shareText = title ? `${title}\n${shareUrl}` : shareUrl;

  const toWhatsApp = () => {
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, "_blank", "noopener");
  };
  const toTelegram = () => {
    window.open(
      `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(title || "")}`,
      "_blank",
      "noopener",
    );
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="share-btns" role="group" aria-label="مشاركة">
      <button type="button" onClick={toWhatsApp} className="share-btn share-btn--wa" aria-label="مشاركة عبر واتساب">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M12 0C5.373 0 0 5.373 0 12c0 2.123.554 4.115 1.524 5.843L.057 23.857a.5.5 0 0 0 .611.612l6.016-1.454A11.933 11.933 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.714a9.682 9.682 0 0 1-4.921-1.342l-.353-.21-3.651.883.9-3.567-.231-.368A9.673 9.673 0 0 1 2.286 12C2.286 6.63 6.63 2.286 12 2.286c5.37 0 9.714 4.344 9.714 9.714 0 5.37-4.344 9.714-9.714 9.714z"/>
        </svg>
        <span>واتساب</span>
      </button>
      <button type="button" onClick={toTelegram} className="share-btn share-btn--tg" aria-label="مشاركة عبر تيليجرام">
        <Send size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>تيليجرام</span>
      </button>
      <button type="button" onClick={copyLink} className="share-btn share-btn--copy" aria-label="نسخ الرابط">
        <Link2 size={14} strokeWidth={1.8} aria-hidden="true" />
        <span>{copied ? "تم النسخ ✓" : "نسخ الرابط"}</span>
      </button>
    </div>
  );
}

export default function ContentActions({ contentType, contentId, shareTitle, shareUrl }: Props) {
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
      alert("يرجى تسجيل الدخول أولاً");
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
      user_id: user?.id,
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
            placeholder="تفاصيل إضافية (اختياري)..."
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
