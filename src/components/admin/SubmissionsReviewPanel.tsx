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
      style={{
        display: "flex", alignItems: "center", gap: "0.3rem",
        padding: "0.3rem 0.65rem",
        borderRadius: "0.4rem",
        border: "none",
        background: playing ? "#ef4444" : "#134a3a",
        color: "#fff",
        fontSize: "0.75rem",
        fontWeight: 600,
        cursor: "pointer",
        fontFamily: "inherit",
      }}
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
    <div style={{
      background: "#fff",
      borderRadius: "1rem",
      border: `1.5px solid ${sub.status === "pending" ? "#e5e7eb" : sc.border}`,
      marginBottom: "0.875rem",
      overflow: "hidden",
    }}>
      {/* Header */}
      <div
        style={{
          display: "flex", alignItems: "flex-start", gap: "0.75rem",
          padding: "0.875rem 1rem",
          cursor: "pointer",
          background: sub.status !== "pending" ? sc.bg : "#fff",
        }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Icon */}
        <div style={{
          width: 40, height: 40, borderRadius: "0.5rem",
          background: "#f3f4f6",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: "1.25rem", flexShrink: 0,
        }}>
          {TYPE_ICON[sub.type]}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
            <span style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>
              {sub.title}
            </span>
            <span style={{
              padding: "0.15rem 0.5rem", borderRadius: "999px",
              fontSize: "0.68rem", fontWeight: 600,
              background: sc.bg, color: sc.text, border: `1px solid ${sc.border}`,
            }}>
              {STATUS_LABEL[sub.status]}
            </span>
          </div>

          <div style={{ fontSize: "0.75rem", color: "#6b7280", marginTop: "0.2rem" }}>
            👤 {sub.submitter_name}
            {sub.submitter_email && ` · ${sub.submitter_email}`}
            {" · "}
            {sub.type === "adhan" ? "أذان" : "درس"}
            {" · "}
            {new Date(sub.created_at).toLocaleDateString("ar-KW")}
          </div>

          {/* Quick meta */}
          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginTop: "0.3rem" }}>
            {sub.file_name && (
              <span style={metaChip}>📎 {sub.file_name} ({formatFileSize(sub.file_size_kb)})</span>
            )}
            {meta.country && <span style={metaChip}>📍 {String(meta.country)}</span>}
            {meta.muezzin_style && <span style={metaChip}>{String(meta.muezzin_style)}</span>}
            {meta.sheikh && <span style={metaChip}>🎓 {String(meta.sheikh)}</span>}
            {meta.topic && <span style={metaChip}>{String(meta.topic)}</span>}
          </div>
        </div>

        <span style={{ color: "#9ca3af", fontSize: "0.8rem", flexShrink: 0 }}>
          {expanded ? "▲" : "▼"}
        </span>
      </div>

      {/* Expanded */}
      {expanded && (
        <div style={{ padding: "0 1rem 1rem", borderTop: "1px solid #f3f4f6" }}>
          {/* Description */}
          {sub.description && (
            <div style={{ marginTop: "0.875rem" }}>
              <div style={{ fontSize: "0.75rem", color: "#9ca3af", fontWeight: 600, marginBottom: "0.35rem" }}>الوصف</div>
              <p style={{ fontSize: "0.85rem", color: "#374151", lineHeight: 1.6, margin: 0 }}>{sub.description}</p>
            </div>
          )}

          {/* Audio player */}
          {sub.file_url && isAudio && (
            <div style={{ marginTop: "0.875rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
              <AudioPreview url={sub.file_url} />
              <a
                href={sub.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: "0.75rem", color: "#134a3a", fontWeight: 600 }}
              >
                ⬇️ تحميل الملف
              </a>
            </div>
          )}

          {/* Video/file link */}
          {sub.file_url && !isAudio && (
            <div style={{ marginTop: "0.875rem" }}>
              <a
                href={sub.file_url}
                target="_blank"
                rel="noopener noreferrer"
                style={linkStyle}
              >
                📂 عرض / تحميل الملف
              </a>
            </div>
          )}

          {/* Source URL */}
          {meta.source_url && (
            <div style={{ marginTop: "0.5rem" }}>
              <a href={String(meta.source_url)} target="_blank" rel="noopener noreferrer" style={linkStyle}>
                🔗 رابط المصدر
              </a>
            </div>
          )}

          {/* Previous reviewer note */}
          {sub.reviewer_note && (
            <div style={{ marginTop: "0.875rem", padding: "0.6rem 0.875rem", background: "#f8fafc", borderRadius: "0.5rem", fontSize: "0.8rem", color: "#374151" }}>
              <strong>ملاحظة المشرف السابقة:</strong> {sub.reviewer_note}
            </div>
          )}

          {/* Publish to muezzin library — for approved adhans */}
          {sub.status === "approved" && sub.type === "adhan" && (
            <div style={{ marginTop: "1rem", padding: "0.875rem", background: "#f0fdf4", borderRadius: "0.75rem", border: "1px solid #bbf7d0" }}>
              <div style={{ fontSize: "0.78rem", color: "#065f46", fontWeight: 600, marginBottom: "0.5rem" }}>
                🎙️ نشر في مكتبة المؤذنين
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "0.625rem" }}>
                سيُضاف هذا التسجيل كمؤذن جديد في المكتبة ويظهر للمستخدمين.
              </div>
              {published ? (
                <div style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 700 }}>✅ تم النشر في المكتبة!</div>
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
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: publishing ? "#9ca3af" : "#134a3a",
                    color: "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: publishing ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {publishing ? "جارٍ النشر..." : "🚀 نشر في مكتبة المؤذنين"}
                </button>
              )}
              {publishError && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#991b1b" }}>{publishError}</div>
              )}
            </div>
          )}

          {/* Publish approved lesson as draft */}
          {sub.status === "approved" && sub.type === "lesson" && (
            <div style={{ marginTop: "1rem", padding: "0.875rem", background: "#eff6ff", borderRadius: "0.75rem", border: "1px solid #bfdbfe" }}>
              <div style={{ fontSize: "0.78rem", color: "#1d4ed8", fontWeight: 600, marginBottom: "0.4rem" }}>
                📚 إضافة للدروس كمسودة
              </div>
              <div style={{ fontSize: "0.72rem", color: "#6b7280", marginBottom: "0.5rem" }}>
                سيُضاف الدرس في قسم الدروس بصفة مسودة — يمكن نشره لاحقاً.
              </div>
              {published ? (
                <div style={{ fontSize: "0.8rem", color: "#065f46", fontWeight: 700 }}>✅ تمت إضافته كمسودة!</div>
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
                  style={{
                    padding: "0.45rem 1rem",
                    borderRadius: "0.5rem",
                    border: "none",
                    background: publishing ? "#9ca3af" : "#1d4ed8",
                    color: "#fff",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    cursor: publishing ? "not-allowed" : "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  {publishing ? "جارٍ الإضافة..." : "📝 إضافة كمسودة"}
                </button>
              )}
              {publishError && (
                <div style={{ marginTop: "0.5rem", fontSize: "0.75rem", color: "#991b1b" }}>{publishError}</div>
              )}
            </div>
          )}

          {/* Review actions — only for pending */}
          {sub.status === "pending" && (
            <div style={{ marginTop: "1rem", display: "flex", flexDirection: "column", gap: "0.625rem" }}>
              <label style={{ fontSize: "0.78rem", fontWeight: 600, color: "#374151" }}>
                ملاحظة للمستخدم (اختياري):
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                  placeholder="سبب القبول أو الرفض..."
                  style={{
                    marginTop: "0.35rem",
                    width: "100%",
                    padding: "0.5rem 0.75rem",
                    borderRadius: "0.5rem",
                    border: "1.5px solid #e5e7eb",
                    fontFamily: "inherit",
                    fontSize: "0.82rem",
                    direction: "rtl",
                    boxSizing: "border-box",
                    resize: "vertical",
                  }}
                />
              </label>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handle("approved")}
                  style={{ ...actionBtn, background: "#134a3a" }}
                >
                  {loading ? "..." : "✅ قبول"}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => handle("rejected")}
                  style={{ ...actionBtn, background: "#dc2626" }}
                >
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
    <div style={{ direction: "rtl", padding: "1.5rem 0" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
        <div>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 800, color: "#111827", margin: "0 0 0.2rem" }}>
            📋 طلبات رفع المحتوى
          </h2>
          {pending > 0 && (
            <div style={{ fontSize: "0.78rem", color: "#0369A1", fontWeight: 600 }}>
              ⏳ {pending} طلب بانتظار المراجعة
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={load}
          style={{ padding: "0.4rem 0.875rem", borderRadius: "0.5rem", border: "1.5px solid #e5e7eb", background: "#fff", fontSize: "0.8rem", cursor: "pointer", fontFamily: "inherit", color: "#374151" }}
        >
          🔄 تحديث
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[
            { label: "الكل",    val: stats.total,    bg: "#f3f4f6", color: "#374151" },
            { label: "⏳ معلق", val: stats.pending,  bg: "#F0F9FF", color: "#0369A1" },
            { label: "✅ قبول", val: stats.approved, bg: "#f0fdf4", color: "#065f46" },
            { label: "❌ رفض",  val: stats.rejected, bg: "#fef2f2", color: "#991b1b" },
            { label: "🎙️ أذان / 📚 درس", val: `${stats.adhan}/${stats.lesson}`, bg: "#eff6ff", color: "#1d4ed8" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: "0.75rem", padding: "0.625rem 0.5rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.25rem", fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: "0.6rem", color: s.color, fontWeight: 600, marginTop: "0.1rem" }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.25rem", flexWrap: "wrap" }}>
        {(["all", "pending", "approved", "rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFStatus(s)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: "1.5px solid",
              borderColor: filterStatus === s ? "#134a3a" : "#e5e7eb",
              background: filterStatus === s ? "#134a3a" : "#fff",
              color: filterStatus === s ? "#fff" : "#374151",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {{ all: "الكل", pending: "⏳ قيد المراجعة", approved: "✅ مقبول", rejected: "❌ مرفوض" }[s]}
          </button>
        ))}
        <div style={{ width: 1, background: "#e5e7eb", margin: "0 0.25rem" }} />
        {(["all", "adhan", "lesson"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setFType(t)}
            style={{
              padding: "0.35rem 0.75rem",
              borderRadius: "999px",
              border: "1.5px solid",
              borderColor: filterType === t ? "#7c3aed" : "#e5e7eb",
              background: filterType === t ? "#7c3aed" : "#fff",
              color: filterType === t ? "#fff" : "#374151",
              fontSize: "0.78rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
            }}
          >
            {{ all: "كل الأنواع", adhan: "🎙️ أذان", lesson: "📚 درس" }[t]}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "2rem", color: "#9ca3af" }}>جارٍ التحميل...</div>
      ) : error ? (
        <div style={{ padding: "1rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "0.6rem", color: "#991b1b", fontSize: "0.85rem" }}>
          {error}
        </div>
      ) : list.length === 0 ? (
        <div style={{ textAlign: "center", padding: "3rem", color: "#9ca3af" }}>
          لا توجد طلبات بهذا التصفية
        </div>
      ) : (
        list.map((sub) => (
          <SubmissionCard key={sub.id} sub={sub} onReview={handleReview} />
        ))
      )}
    </div>
  );
}

const metaChip: React.CSSProperties = {
  padding: "0.15rem 0.45rem",
  borderRadius: "0.4rem",
  fontSize: "0.68rem",
  background: "#f3f4f6",
  color: "#374151",
  border: "1px solid #e5e7eb",
};

const actionBtn: React.CSSProperties = {
  flex: 1,
  padding: "0.55rem",
  borderRadius: "0.6rem",
  border: "none",
  color: "#fff",
  fontSize: "0.85rem",
  fontWeight: 700,
  cursor: "pointer",
  fontFamily: "inherit",
};

const linkStyle: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#134a3a",
  fontWeight: 600,
  textDecoration: "underline",
};
