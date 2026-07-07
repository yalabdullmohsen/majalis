import { useCallback, useEffect, useRef, useState } from "react";
import {
  listSubmissions,
  reviewSubmission,
  publishAdhanToLibrary,
  publishLessonAsDraft,
  getSubmissionStats,
  formatFileSize,
  type UserSubmission,
  type SubmissionStatus,
  type SubmissionType,
  type SubmissionStats,
} from "@/lib/user-submissions-service";

const STATUS_LABEL: Record<SubmissionStatus, string> = {
  pending:  "⏳ قيد المراجعة",
  approved: "✅ مقبول",
  rejected: "❌ مرفوض",
};

const STATUS_COLOR: Record<SubmissionStatus, { bg: string; text: string; border: string }> = {
  pending:  { bg: "#F0F9FF", text: "#0369A1", border: "#BAE6FD" },
  approved: { bg: "#f0fdf4", text: "#065f46", border: "#86efac" },
  rejected: { bg: "#fef2f2", text: "#991b1b", border: "#fca5a5" },
};

const TYPE_ICON: Record<SubmissionType, string> = {
  adhan:  "🎙️",
  lesson: "📚",
};

function AudioPreview({ url }: { url: string }) {
  const [playing, setPlaying] = useState(false);
  const ref = useRef<HTMLAudioElement | null>(null);

  function toggle() {
    if (!ref.current) {
      ref.current = new Audio(url);
      ref.current.addEventListener("ended", () => setPlaying(false));
    }
    if (playing) {
      ref.current.pause();
      ref.current.currentTime = 0;
      setPlaying(false);
    } else {
      ref.current.play().catch(() => {});
      setPlaying(true);
    }
  }

  useEffect(() => () => { ref.current?.pause(); }, []);

  return (
    <button
      type="button"
      onClick={toggle}
      className="srp-audio-btn"
      style={{ "--srp-audio-bg": playing ? "#ef4444" : "#134a3a" } as React.CSSProperties}
    >
      {playing ? "⏹ إيقاف" : "▶ استمع"}
    </button>
  );
}

function SubmissionCard({ sub, onReview }: {
  sub: UserSubmission;
  onReview: (id: string, status: "approved" | "rejected", note: string) => Promise<void>;
}) {
  const [note, setNote]           = useState("");
  const [loading, setLoading]     = useState(false);
  const [expanded, setExpanded]   = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [published, setPublished]   = useState(false);
  const [publishError, setPublishError] = useState("");
  const sc = STATUS_COLOR[sub.status];

  async function handle(status: "approved" | "rejected") {
    setLoading(true);
    await onReview(sub.id, status, note);
    setLoading(false);
  }

  const meta = (sub.meta ?? {}) as Record<string, string | number | undefined>;
  const isAudio = sub.file_mime?.startsWith("audio");

  return (
    <div
      className="srp-card"
      style={{ "--srp-card-border": sub.status === "pending" ? "#e5e7eb" : sc.border } as React.CSSProperties}
    >
      {/* Header */}
      <div
        className="srp-card-header"
        style={{ "--srp-card-header-bg": sub.status !== "pending" ? sc.bg : "#fff" } as React.CSSProperties}
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="srp-card-icon">{TYPE_ICON[sub.type]}</div>

        <div className="srp-card-body">
          <div className="srp-card-title-row">
            <span className="srp-card-title">{sub.title}</span>
            <span
              className="srp-card-status-badge"
              style={{
                "--srp-badge-bg":     sc.bg,
                "--srp-badge-text":   sc.text,
                "--srp-badge-border": sc.border,
              } as React.CSSProperties}
            >
              {STATUS_LABEL[sub.status]}
            </span>
          </div>

          <div className="srp-card-meta-row">
            👤 {sub.submitter_name}
            {sub.submitter_email && ` · ${sub.submitter_email}`}
            {" · "}
            {sub.type === "adhan" ? "أذان" : "درس"}
            {" · "}
            {new Date(sub.created_at).toLocaleDateString("ar-KW")}
          </div>

          <div className="srp-card-chips">
            {sub.file_name && (
              <span className="srp-meta-chip">📎 {sub.file_name} ({formatFileSize(sub.file_size_kb)})</span>
            )}
            {meta.country && <span className="srp-meta-chip">📍 {String(meta.country)}</span>}
            {meta.muezzin_style && <span className="srp-meta-chip">{String(meta.muezzin_style)}</span>}
            {meta.sheikh && <span className="srp-meta-chip">🎓 {String(meta.sheikh)}</span>}
            {meta.topic && <span className="srp-meta-chip">{String(meta.topic)}</span>}
          </div>
        </div>

        <span className="srp-card-toggle">{expanded ? "▲" : "▼"}</span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div className="srp-card-detail">
          {sub.description && (
            <div className="srp-detail-desc">
              <div className="srp-detail-desc-label">الوصف</div>
              <p className="srp-detail-desc-text">{sub.description}</p>
            </div>
          )}

          {sub.file_url && isAudio && (
            <div className="srp-audio-row">
              <AudioPreview url={sub.file_url} />
              <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="srp-link">
                ⬇️ تحميل الملف
              </a>
            </div>
          )}

          {sub.file_url && !isAudio && (
            <div className="srp-detail-file">
              <a href={sub.file_url} target="_blank" rel="noopener noreferrer" className="srp-link">
                📂 عرض / تحميل الملف
              </a>
            </div>
          )}

          {meta.source_url && (
            <div className="srp-detail-source">
              <a href={String(meta.source_url)} target="_blank" rel="noopener noreferrer" className="srp-link">
                🔗 رابط المصدر
              </a>
            </div>
          )}

          {sub.reviewer_note && (
            <div className="srp-reviewer-note">
              <strong>ملاحظة المشرف السابقة:</strong> {sub.reviewer_note}
            </div>
          )}

          {/* Publish to muezzin library */}
          {sub.status === "approved" && sub.type === "adhan" && (
            <div className="srp-publish-box srp-publish-box--adhan">
              <div className="srp-publish-title srp-publish-title--adhan">🎙️ نشر في مكتبة المؤذنين</div>
              <div className="srp-publish-desc">سيُضاف هذا التسجيل كمؤذن جديد في المكتبة ويظهر للمستخدمين.</div>
              {published ? (
                <div className="srp-publish-success srp-publish-success--adhan">✅ تم النشر في المكتبة!</div>
              ) : (
                <button
                  type="button"
                  disabled={publishing}
                  onClick={async () => {
                    setPublishing(true);
                    setPublishError("");
                    try {
                      const res = await publishAdhanToLibrary(sub);
                      if (res.ok) setPublished(true);
                      else setPublishError(res.error || "فشل النشر في المكتبة.");
                    } catch (e) {
                      setPublishError(e instanceof Error ? e.message : "فشل النشر في المكتبة.");
                    } finally {
                      setPublishing(false);
                    }
                  }}
                  className="srp-publish-btn"
                  style={{ "--srp-pub-bg": publishing ? "#9ca3af" : "#134a3a", "--srp-pub-cursor": publishing ? "not-allowed" : "pointer" } as React.CSSProperties}
                >
                  {publishing ? "جارٍ النشر..." : "🚀 نشر في مكتبة المؤذنين"}
                </button>
              )}
              {publishError && <div className="srp-publish-error">{publishError}</div>}
            </div>
          )}

          {/* Publish as lesson draft */}
          {sub.status === "approved" && sub.type === "lesson" && (
            <div className="srp-publish-box srp-publish-box--lesson">
              <div className="srp-publish-title srp-publish-title--lesson">📚 إضافة للدروس كمسودة</div>
              <div className="srp-publish-desc">سيُضاف الدرس في قسم الدروس بصفة مسودة — يمكن نشره لاحقاً.</div>
              {published ? (
                <div className="srp-publish-success srp-publish-success--lesson">✅ تمت إضافته كمسودة!</div>
              ) : (
                <button
                  type="button"
                  disabled={publishing}
                  onClick={async () => {
                    setPublishing(true);
                    setPublishError("");
                    try {
                      const res = await publishLessonAsDraft(sub);
                      if (res.ok) setPublished(true);
                      else setPublishError(res.error || "فشلت الإضافة كمسودة.");
                    } catch (e) {
                      setPublishError(e instanceof Error ? e.message : "فشلت الإضافة كمسودة.");
                    } finally {
                      setPublishing(false);
                    }
                  }}
                  className="srp-publish-btn"
                  style={{ "--srp-pub-bg": publishing ? "#9ca3af" : "#1d4ed8", "--srp-pub-cursor": publishing ? "not-allowed" : "pointer" } as React.CSSProperties}
                >
                  {publishing ? "جارٍ الإضافة..." : "📝 إضافة كمسودة"}
                </button>
              )}
              {publishError && <div className="srp-publish-error">{publishError}</div>}
            </div>
          )}

          {/* Review actions */}
          {sub.status === "pending" && (
            <div className="srp-review-actions">
              <label className="srp-review-label">
                ملاحظة للمستخدم (اختياري):
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="سبب القبول أو الرفض..."
                  className="srp-review-textarea"
                />
              </label>
              <div className="srp-review-btns">
                <button type="button" disabled={loading} onClick={() => handle("approved")} className="srp-action-btn srp-action-btn--approve">
                  {loading ? "..." : "✅ قبول"}
                </button>
                <button type="button" disabled={loading} onClick={() => handle("rejected")} className="srp-action-btn srp-action-btn--reject">
                  {loading ? "..." : "❌ رفض"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Main Panel ───────────────────────────────────────────────────────────────
export function SubmissionsReviewPanel() {
  const [list, setList]           = useState<UserSubmission[]>([]);
  const [filterStatus, setFStatus] = useState<SubmissionStatus | "all">("pending");
  const [filterType, setFType]     = useState<SubmissionType | "all">("all");
  const [loading, setLoading]      = useState(true);
  const [error, setError]          = useState("");
  const [stats, setStats]          = useState<SubmissionStats | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [data, s] = await Promise.all([
        listSubmissions({ status: filterStatus, type: filterType }),
        getSubmissionStats(),
      ]);
      setList(data);
      setStats(s);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "خطأ في التحميل");
    } finally {
      setLoading(false);
    }
  }, [filterStatus, filterType]);

  useEffect(() => { load(); }, [load]);

  async function handleReview(id: string, status: "approved" | "rejected", note: string) {
    await reviewSubmission(id, status, note);
    await load();
  }

  const pending = list.filter((s) => s.status === "pending").length;

  return (
    <div className="srp-root">
      {/* Header */}
      <div className="srp-header">
        <div>
          <h2 className="srp-header-title">📋 طلبات رفع المحتوى</h2>
          {pending > 0 && (
            <div className="srp-header-pending">⏳ {pending} طلب بانتظار المراجعة</div>
          )}
        </div>
        <button type="button" onClick={load} className="srp-refresh-btn">🔄 تحديث</button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="srp-stats-grid">
          {[
            { label: "الكل",    val: stats.total,    bg: "#f3f4f6", color: "#374151" },
            { label: "⏳ معلق", val: stats.pending,  bg: "#F0F9FF", color: "#0369A1" },
            { label: "✅ قبول", val: stats.approved, bg: "#f0fdf4", color: "#065f46" },
            { label: "❌ رفض",  val: stats.rejected, bg: "#fef2f2", color: "#991b1b" },
            { label: "🎙️ أذان / 📚 درس", val: `${stats.adhan}/${stats.lesson}`, bg: "#eff6ff", color: "#1d4ed8" },
          ].map((s) => (
            <div
              key={s.label}
              className="srp-stat-card"
              style={{ "--srp-stat-bg": s.bg, "--srp-stat-color": s.color } as React.CSSProperties}
            >
              <div className="srp-stat-val">{s.val}</div>
              <div className="srp-stat-label">{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="srp-filters">
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFStatus(s)}
            className="srp-filter-btn"
            style={{
              "--srp-filter-border": filterStatus === s ? "#134a3a" : "#e5e7eb",
              "--srp-filter-bg":     filterStatus === s ? "#134a3a" : "#fff",
              "--srp-filter-color":  filterStatus === s ? "#fff" : "#374151",
            } as React.CSSProperties}
          >
            {{ all: "الكل", pending: "⏳ قيد المراجعة", approved: "✅ مقبول", rejected: "❌ مرفوض" }[s]}
          </button>
        ))}
        <div className="srp-filter-divider" />
        {(["all", "adhan", "lesson"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFType(t)}
            className="srp-filter-btn"
            style={{
              "--srp-filter-border": filterType === t ? "#7c3aed" : "#e5e7eb",
              "--srp-filter-bg":     filterType === t ? "#7c3aed" : "#fff",
              "--srp-filter-color":  filterType === t ? "#fff" : "#374151",
            } as React.CSSProperties}
          >
            {{ all: "كل الأنواع", adhan: "🎙️ أذان", lesson: "📚 درس" }[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="srp-state srp-state--loading">جارٍ التحميل...</div>
      ) : error ? (
        <div className="srp-state srp-state--error">{error}</div>
      ) : list.length === 0 ? (
        <div className="srp-state srp-state--empty">لا توجد طلبات بهذا التصفية</div>
      ) : (
        list.map((sub) => (
          <SubmissionCard key={sub.id} sub={sub} onReview={handleReview} />
        ))
      )}
    </div>
  );
}
