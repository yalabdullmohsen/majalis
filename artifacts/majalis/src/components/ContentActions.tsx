import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface Props {
  contentType: string;
  contentId: string;
}

const REPORT_TYPES = ["خطأ_علمي", "خطأ_إملائي", "محتوى_غير_لائق", "رابط_مكسور", "أخرى"] as const;

export default function ContentActions({ contentType, contentId }: Props) {
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
    alert("شكراً — تم إرسال البلاغ وسيُراجع قريباً");
  };

  return (
    <div dir="rtl" className="flex flex-wrap items-center gap-3 p-4 bg-[var(--majalis-parchment)] rounded-xl border border-[var(--majalis-line)]">
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => handleRating(star)}
            className={`text-2xl transition-transform hover:scale-110 ${rating >= star ? "text-[var(--majalis-emerald)]" : "text-[var(--majalis-line)]"}`}
          >
            
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleBookmark}
        className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all border
          ${bookmarked ? "bg-[var(--majalis-emerald-muted)] border-[var(--majalis-emerald)] text-[var(--majalis-emerald)]" : "bg-[var(--majalis-panel)] border-[var(--majalis-line)] text-[var(--majalis-ink-soft)] hover:border-[var(--majalis-emerald)]"}`}
      >
        {bookmarked ? "محفوظ" : "احفظ"}
      </button>

      <button
        type="button"
        onClick={() => setShowReport(!showReport)}
        className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium border bg-[var(--majalis-panel)] border-[var(--majalis-line)] text-[var(--majalis-ink-soft)] hover:border-[var(--majalis-danger)] hover:text-[var(--majalis-danger)] transition-all"
      >
        إبلاغ
      </button>

      {showReport && (
        <div className="w-full mt-3 p-4 bg-[var(--majalis-panel)] rounded-xl border border-[var(--majalis-danger)] space-y-3">
          <h4 className="font-medium text-[var(--majalis-ink-soft)]">نوع الخطأ</h4>
          <div className="flex flex-wrap gap-2">
            {REPORT_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setReportType(type)}
                className={`px-3 py-1 rounded-lg text-sm border transition-all
                  ${reportType === type ? "bg-[var(--majalis-danger)] text-white border-[var(--majalis-danger)]" : "border-[var(--majalis-line)] text-[var(--majalis-ink-soft)] hover:border-[var(--majalis-danger)]"}`}
              >
                {type.replace("_", " ")}
              </button>
            ))}
          </div>
          <textarea
            value={reportDesc}
            onChange={(e) => setReportDesc(e.target.value)}
            rows={2}
            placeholder="تفاصيل إضافية (اختياري)..."
            className="w-full border border-[var(--majalis-line)] bg-[var(--majalis-parchment)] text-[var(--majalis-ink)] rounded-lg px-3 py-2 text-sm text-right focus:ring-2 focus:ring-[var(--majalis-danger)] outline-none resize-none"
          />
          <button
            type="button"
            onClick={submitReport}
            disabled={!reportType || submitting}
            className="bg-[var(--majalis-danger,#dc2626)] text-white px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "جاري الإرسال..." : "إرسال البلاغ"}
          </button>
        </div>
      )}
    </div>
  );
}
