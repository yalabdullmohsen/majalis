import { useEffect, useRef, useState, type FormEvent } from "react";
import { CheckCircle2, ClipboardList, Clock, FileText, GraduationCap, Mic2, PartyPopper, Search, Upload, XCircle } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { formatFileSize, type UserSubmission, type SubmissionStatus } from "@/lib/user-submissions-service";
import { Link } from "wouter";
import { ShareButtons } from "@/components/ContentActions";
import { applyPageSeo } from "@/lib/seo";

const STATUS_META: Record<SubmissionStatus, { Icon: LucideIcon; label: string; mod: string }> = {
  pending:  { Icon: Clock,        label: "قيد المراجعة", mod: "msr-status--pending"  },
  approved: { Icon: CheckCircle2, label: "مقبول",         mod: "msr-status--approved" },
  rejected: { Icon: XCircle,      label: "مرفوض",         mod: "msr-status--rejected" },
};

const TYPE_ICON: Record<string, LucideIcon> = { adhan: Mic2, lesson: GraduationCap };
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
    <div className={`msr-card ${sm.mod}`}>
      {/* Status bar */}
      <div className="msr-card__status-bar">
        <span aria-hidden="true"><sm.Icon size={15} strokeWidth={2} /></span>
        <span className="msr-card__status-label">{sm.label}</span>
        <span className="msr-card__date">
          {new Date(sub.created_at).toLocaleDateString("ar-KW", { dateStyle: "medium" })}
        </span>
      </div>

      <div className="msr-card__body">
        {/* Title row */}
        <div className="msr-card__title-row">
          <span className="msr-card__type-icon" aria-hidden="true">{(() => { const I = TYPE_ICON[sub.type] ?? FileText; return <I size={18} strokeWidth={1.6} />; })()}</span>
          <div className="msr-card__info">
            <div className="msr-card__title">{sub.title}</div>
            <div className="msr-card__meta">
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
            className={`msr-card__audio-btn${audioPlaying ? " is-playing" : ""}`}
          >
            {audioPlaying ? "⏹ إيقاف" : "▶ استمع للتسجيل"}
          </button>
        )}

        {/* Reviewer note */}
        {sub.reviewer_note && (
          <div className={`msr-card__reviewer-note msr-card__reviewer-note--${sub.status}`}>
            <strong>ملاحظة الفريق:</strong> {sub.reviewer_note}
          </div>
        )}

        {/* Approved adhan notice */}
        {sub.status === "approved" && sub.type === "adhan" && (
          <div className="msr-card__notice">
            <PartyPopper size={14} className="inline ml-1" />تهانينا! تسجيلك قُبِل وسيُضاف قريباً إلى مكتبة المؤذنين.
          </div>
        )}

        {/* Approved lesson notice */}
        {sub.status === "approved" && sub.type === "lesson" && (
          <div className="msr-card__notice">
            <PartyPopper size={14} className="inline ml-1" />تهانينا! درسك قُبِل وسيُضاف قريباً إلى قسم الدروس.
          </div>
        )}

        {/* Rejected، encourage resubmit */}
        {sub.status === "rejected" && (
          <div className="msr-card__resubmit">
            <Link href="/upload">
              <span className="msr-card__resubmit-link">إعادة الإرسال بعد التعديل ←</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default function MySubmissionsPage() {
  const [email, setEmail]     = useState("");

  useEffect(() => {
    applyPageSeo({
      path: "/my-submissions",
      title: "مقدّماتي | المجلس العلمي",
      description: "تتبع حالة المحتوى الذي أرسلته للمجلس العلمي، قيد المراجعة، مقبول، أو مرفوض.",
      keywords: ["مقدماتي", "تقديم محتوى", "متابعة مقدمة", "المجلس العلمي"],
      robots: "noindex, follow",
    });
  }, []);
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
    <div className="msp-page">
      {/* Header */}
      <div className="msp-header">
        <p className="msp-eyebrow">المساهمات</p>
        <h1 className="msp-title"><ClipboardList size={22} className="inline ml-2" />مساهماتي</h1>
        <p className="msp-subtitle">تتبّع حالة الأذانات والدروس التي أرسلتها للمراجعة.</p>
      </div>

      {/* Search by email */}
      <div className="msp-search-box">
        <p className="msp-search-label"><Search size={13} className="inline ml-1" />ابحث بالبريد الإلكتروني الذي أدخلته عند الإرسال:</p>
        <form onSubmit={handleSearch} className="msp-search-form" role="search" aria-label="البحث عن المساهمات">
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            aria-label="بريدك@مثال.com" placeholder="بريدك@مثال.com"
            className="msp-email-input"
          />
          <button
            type="submit"
            disabled={loading}
            className={`msp-search-btn${loading ? " is-loading" : ""}`}
          >
            {loading ? "..." : "بحث"}
          </button>
        </form>
      </div>

      {/* Error */}
      {err && <div className="msp-error">{err}</div>}

      {/* Stats */}
      {stats && (
        <div className="msp-stats">
          <div className="msp-stat msp-stat--total">
            <div className="msp-stat__val">{stats.total}</div>
            <div className="msp-stat__label">الكل</div>
          </div>
          <div className="msp-stat msp-stat--pending">
            <div className="msp-stat__val">{stats.pending}</div>
            <div className="msp-stat__label"><Clock size={13} strokeWidth={2} aria-hidden="true" /> قيد المراجعة</div>
          </div>
          <div className="msp-stat msp-stat--approved">
            <div className="msp-stat__val">{stats.approved}</div>
            <div className="msp-stat__label"><CheckCircle2 size={13} strokeWidth={2} aria-hidden="true" /> مقبول</div>
          </div>
          <div className="msp-stat msp-stat--rejected">
            <div className="msp-stat__val">{stats.rejected}</div>
            <div className="msp-stat__label"><XCircle size={13} strokeWidth={2} aria-hidden="true" /> مرفوض</div>
          </div>
        </div>
      )}

      {/* Results */}
      {list !== null && list.length === 0 && (
        <div className="msp-empty-state">
          <div className="msp-empty-state__icon" aria-hidden="true"><FileText size={40} strokeWidth={1.3} /></div>
          <p className="msp-empty-state__msg">لا توجد مساهمات مرتبطة بهذا البريد.</p>
          <Link href="/upload">
            <button type="button" className="msp-cta-btn">ارفع أذاناً أو درساً</button>
          </Link>
        </div>
      )}

      {list !== null && list.length > 0 && (
        <div>
          <div className="msp-results-count">{list.length} مساهمة</div>
          {list.map((sub) => <SubmissionRow key={sub.id} sub={sub} />)}
        </div>
      )}

      {/* CTA if no search yet */}
      {list === null && !loading && (
        <div className="msp-cta">
          <div className="msp-cta__text">أو ارفع محتوىً جديداً:</div>
          <Link href="/upload">
            <button type="button" className="msp-cta-btn msp-cta-btn--gradient">
              <Upload size={15} strokeWidth={2} aria-hidden="true" /> رفع أذان أو درس
            </button>
          </Link>
        </div>
      )}
      <div className="twh-share">
        <ShareButtons title="مساهماتي — المجلس العلمي" url="https://www.majlisilm.com/my-submissions" />
      </div>
    </div>
  );
}
