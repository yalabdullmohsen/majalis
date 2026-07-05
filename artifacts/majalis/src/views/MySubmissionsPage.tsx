import { useEffect, useRef, useState, type FormEvent } from "react";
import { supabase } from "@/lib/supabase";
import { formatFileSize, type UserSubmission, type SubmissionStatus } from "@/lib/user-submissions-service";
import { Link } from "wouter";

const STATUS_META: Record<SubmissionStatus, { icon: string; label: string; bg: string; color: string; border: string }> = {
  pending:  { icon: "⏳", label: "قيد المراجعة",  bg: "#F0F9FF", color: "#0369A1", border: "#A7F3D0" },
  approved: { icon: "✅", label: "مقبول",          bg: "#f0fdf4", color: "#065f46", border: "#86efac" },
  rejected: { icon: "❌", label: "مرفوض",          bg: "#fef2f2", color: "#991b1b", border: "#fca5a5" },
};

const TYPE_ICON: Record<string, string> = { adhan: "🎙️", lesson: "📚" };
const TYPE_LABEL: Record<string, string> = { adhan: "أذان",   lesson: "درس" };

function SubmissionRow({ sub }: { sub: UserSubmission }) {
  const sm = STATUS_META[sub.status];
  const [audioPlaying, setAudioPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => { audioRef.current?.pause(); }, []);

  function toggleAudio() {
    if (!sub.file_url || !sub.file_mime?.startsWith("audio")) return;
    if (audioPlaying) {
      audioRef.current?.pause();
      setAudioPlaying(false);
    } else {
      const audio = new Audio(sub.file_url);
      audio.addEventListener("ended", () => setAudioPlaying(false), { once: true });
      audio.play().catch(() => {});
      audioRef.current = audio;
      setAudioPlaying(true);
    }
  }

  return (
    <div style={{
      background: "#fff",
      borderRadius: "1rem",
      border: `1.5px solid ${sm.border}`,
      overflow: "hidden",
      marginBottom: "0.875rem",
    }}>
      {/* Status bar */}
      <div style={{ background: sm.bg, padding: "0.5rem 1rem", display: "flex", alignItems: "center", gap: "0.4rem", borderBottom: `1px solid ${sm.border}` }}>
        <span>{sm.icon}</span>
        <span style={{ fontSize: "0.78rem", fontWeight: 700, color: sm.color }}>{sm.label}</span>
        <span style={{ marginRight: "auto", fontSize: "0.72rem", color: "#9ca3af" }}>
          {new Date(sub.created_at).toLocaleDateString("ar-KW", { dateStyle: "medium" })}
        </span>
      </div>

      <div style={{ padding: "0.875rem 1rem" }}>
        {/* Title row */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "flex-start", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.25rem" }}>{TYPE_ICON[sub.type] ?? "📄"}</span>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#111827" }}>{sub.title}</div>
            <div style={{ fontSize: "0.72rem", color: "#6b7280", marginTop: "0.15rem" }}>
              {TYPE_LABEL[sub.type] ?? sub.type}
              {sub.file_name && ` · ${sub.file_name} (${formatFileSize(sub.file_size_kb)})`}
            </div>
          </div>
        </div>

        {/* Audio preview */}
        {sub.file_url && sub.file_mime?.startsWith("audio") && (
          <button
            type="button"
            onClick={toggleAudio}
            style={{
              display: "inline-flex", alignItems: "center", gap: "0.3rem",
              padding: "0.3rem 0.65rem",
              borderRadius: "0.4rem",
              border: "none",
              background: audioPlaying ? "#ef4444" : "#134a3a",
              color: "#fff",
              fontSize: "0.75rem",
              fontWeight: 600,
              cursor: "pointer",
              fontFamily: "inherit",
              marginBottom: "0.5rem",
            }}
          >
            {audioPlaying ? "⏹ إيقاف" : "▶ استمع للتسجيل"}
          </button>
        )}

        {/* Reviewer note */}
        {sub.reviewer_note && (
          <div style={{
            padding: "0.6rem 0.875rem",
            background: sub.status === "approved" ? "#f0fdf4" : "#fef2f2",
            borderRadius: "0.5rem",
            fontSize: "0.82rem",
            color: sub.status === "approved" ? "#065f46" : "#991b1b",
            marginTop: "0.5rem",
          }}>
            <strong>ملاحظة الفريق:</strong> {sub.reviewer_note}
          </div>
        )}

        {/* Approved adhan notice */}
        {sub.status === "approved" && sub.type === "adhan" && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#065f46", fontWeight: 600 }}>
            🎉 تهانينا! تسجيلك قُبِل وسيُضاف قريباً إلى مكتبة المؤذنين.
          </div>
        )}

        {/* Approved lesson notice */}
        {sub.status === "approved" && sub.type === "lesson" && (
          <div style={{ marginTop: "0.5rem", fontSize: "0.78rem", color: "#065f46", fontWeight: 600 }}>
            🎉 تهانينا! درسك قُبِل وسيُضاف قريباً إلى قسم الدروس.
          </div>
        )}

        {/* Rejected — encourage resubmit */}
        {sub.status === "rejected" && (
          <div style={{ marginTop: "0.75rem" }}>
            <Link href="/upload">
              <span style={{ fontSize: "0.78rem", color: "#134a3a", fontWeight: 600, textDecoration: "underline", cursor: "pointer" }}>
                إعادة الإرسال بعد التعديل ←
              </span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MySubmissionsPage() {
  const [email, setEmail]     = useState("");
  const [list, setList]       = useState<UserSubmission[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr]         = useState("");

  async function handleSearch(e: FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    setErr("");
    setList(null);

    try {
      const { data, error } = await supabase
        .from("user_submissions")
        .select("*")
        .eq("submitter_email", email.trim().toLowerCase())
        .order("created_at", { ascending: false })
        .limit(30);

      if (error) throw error;
      setList((data ?? []) as UserSubmission[]);
    } catch (e: unknown) {
      setErr(e instanceof Error ? e.message : "خطأ في البحث");
    } finally {
      setLoading(false);
    }
  }

  const stats = list
    ? {
        total:    list.length,
        pending:  list.filter((s) => s.status === "pending").length,
        approved: list.filter((s) => s.status === "approved").length,
        rejected: list.filter((s) => s.status === "rejected").length,
      }
    : null;

  return (
    <div style={{ direction: "rtl", maxWidth: 620, margin: "0 auto", padding: "1.25rem 1rem 5rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.75rem", color: "#134a3a", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", margin: "0 0 0.25rem" }}>
          المساهمات
        </p>
        <h1 style={{ fontSize: "1.4rem", fontWeight: 800, color: "#111827", margin: "0 0 0.35rem" }}>
          📋 مساهماتي
        </h1>
        <p style={{ fontSize: "0.82rem", color: "#6b7280", margin: 0 }}>
          تتبّع حالة الأذانات والدروس التي أرسلتها للمراجعة.
        </p>
      </div>

      {/* Search by email */}
      <div style={{ background: "#fff", borderRadius: "1rem", border: "1.5px solid #e5e7eb", padding: "1.25rem", marginBottom: "1.5rem" }}>
        <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#374151", margin: "0 0 0.875rem" }}>
          🔍 ابحث بالبريد الإلكتروني الذي أدخلته عند الإرسال:
        </p>
        <form onSubmit={handleSearch} style={{ display: "flex", gap: "0.5rem" }}>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="example@email.com"
            style={{
              flex: 1,
              padding: "0.65rem 0.875rem",
              borderRadius: "0.6rem",
              border: "1.5px solid #e5e7eb",
              fontSize: "0.875rem",
              fontFamily: "inherit",
              direction: "ltr",
              outline: "none",
            }}
          />
          <button
            type="submit"
            disabled={loading}
            style={{
              padding: "0.65rem 1.25rem",
              borderRadius: "0.6rem",
              border: "none",
              background: loading ? "#9ca3af" : "#134a3a",
              color: "#fff",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              fontFamily: "inherit",
              flexShrink: 0,
            }}
          >
            {loading ? "..." : "بحث"}
          </button>
        </form>
      </div>

      {/* Error */}
      {err && (
        <div style={{ padding: "0.75rem 1rem", background: "#fef2f2", border: "1px solid #fca5a5", borderRadius: "0.6rem", color: "#991b1b", fontSize: "0.85rem", marginBottom: "1rem" }}>
          {err}
        </div>
      )}

      {/* Stats */}
      {stats && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.5rem", marginBottom: "1.25rem" }}>
          {[
            { label: "الكل",          val: stats.total,    bg: "#f3f4f6", color: "#374151" },
            { label: "⏳ قيد المراجعة", val: stats.pending,  bg: "#F0F9FF", color: "#0369A1" },
            { label: "✅ مقبول",       val: stats.approved, bg: "#f0fdf4", color: "#065f46" },
            { label: "❌ مرفوض",       val: stats.rejected, bg: "#fef2f2", color: "#991b1b" },
          ].map((s) => (
            <div key={s.label} style={{ background: s.bg, borderRadius: "0.75rem", padding: "0.75rem", textAlign: "center" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: "0.65rem", color: s.color, marginTop: "0.1rem", fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Results */}
      {list !== null && list.length === 0 && (
        <div style={{ textAlign: "center", padding: "3rem 1rem" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>📭</div>
          <p style={{ color: "#9ca3af", fontSize: "0.9rem" }}>لا توجد مساهمات مرتبطة بهذا البريد.</p>
          <Link href="/upload">
            <button type="button" style={{
              marginTop: "0.75rem",
              padding: "0.6rem 1.5rem",
              borderRadius: "0.6rem",
              border: "none",
              background: "#134a3a",
              color: "#fff",
              fontFamily: "inherit",
              fontSize: "0.875rem",
              fontWeight: 600,
              cursor: "pointer",
            }}>
              ارفع أذاناً أو درساً
            </button>
          </Link>
        </div>
      )}

      {list !== null && list.length > 0 && (
        <div>
          <div style={{ fontSize: "0.78rem", color: "#6b7280", marginBottom: "0.875rem" }}>
            {list.length} مساهمة
          </div>
          {list.map((sub) => <SubmissionRow key={sub.id} sub={sub} />)}
        </div>
      )}

      {/* CTA if no search yet */}
      {list === null && !loading && (
        <div style={{ textAlign: "center", padding: "1rem" }}>
          <div style={{ fontSize: "0.82rem", color: "#9ca3af", marginBottom: "1rem" }}>
            أو ارفع محتوىً جديداً:
          </div>
          <Link href="/upload">
            <button type="button" style={{
              padding: "0.7rem 2rem",
              borderRadius: "0.875rem",
              border: "none",
              background: "linear-gradient(135deg, #134a3a, #0c3020)",
              color: "#fff",
              fontSize: "0.9rem",
              fontWeight: 700,
              cursor: "pointer",
              fontFamily: "inherit",
            }}>
              📤 رفع أذان أو درس
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
