import { useEffect, useState } from "react";
import { Link } from "wouter";
import { applyPageSeo } from "@/lib/seo";
import {
  ArrowLeft, BookMarked, BookOpen, Brain, ChevronLeft,
  Clock, Flame, GraduationCap, Medal, PlayCircle,
  Scroll, Sparkles, Star, Target, Trophy, User,
} from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { useRecentProgress } from "@/hooks/useRecentProgress";
import {
  fetchUserLearningStats,
  fetchUserProgress,
  fetchUserCertificates,
  fetchPersonalLibrary,
  fetchLearningNotes,
  type UserStats,
  type Certificate,
} from "@/lib/digital-learning-service";

/* ── أيقونات المحتوى ────────────────────────────────────────────────────── */
const CONTENT_ICONS: Record<string, React.ComponentType<{ size?: number }>> = {
  lesson:        PlayCircle,
  lesson_detail: PlayCircle,
  course:        BookMarked,
  quran:         BookOpen,
};

/* ── شريط التقدم ────────────────────────────────────────────────────────── */
function ProgressBar({ pct }: { pct: number }) {
  const safe = Math.min(100, Math.max(0, pct));
  return (
    <div className="myl2-bar" role="progressbar" aria-valuenow={safe} aria-valuemin={0} aria-valuemax={100}>
      <div className="myl2-bar__fill" style={{ width: `${safe}%` }} />
    </div>
  );
}

/* ── بطاقة إحصائية ──────────────────────────────────────────────────────── */
function StatCard({
  icon: Icon,
  value,
  label,
  suffix = "",
}: {
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  value: string | number;
  label: string;
  suffix?: string;
}) {
  return (
    <div className="myl2-stat-card">
      <span className="myl2-stat-card__icon" aria-hidden="true">
        <Icon size={18} strokeWidth={1.8} />
      </span>
      <strong className="myl2-stat-card__val">{value}{suffix}</strong>
      <span className="myl2-stat-card__label">{label}</span>
    </div>
  );
}

/* ── الصفحة الرئيسية ────────────────────────────────────────────────────── */
export default function MyLearningPage() {
  const { user } = useAuth();
  const { items: resumeItems, loading: resumeLoading } = useRecentProgress(3);

  const [stats,        setStats]        = useState<UserStats | null>(null);
  const [enrollments,  setEnrollments]  = useState<Record<string, { progress_pct?: number }> | null>(null);
  const [certificates, setCertificates] = useState<Certificate[]>([]);
  const [library,      setLibrary]      = useState<Array<{ title: string; content_url?: string; content_id?: string }>>([]);
  const [notes,        setNotes]        = useState<Array<{ title?: string; body?: string }>>([]);
  const [loading,      setLoading]      = useState(true);

  useEffect(() => {
    applyPageSeo({
      path: "/my-learning",
      title: "حسابي | المجلس العلمي",
      description: "لوحتي التعليمية الشخصية — تقدمي في طلب العلم وإنجازاتي ومكتبتي الشخصية",
      keywords: ["حسابي", "تقدم التعلم", "شهادات إسلامية"],
      robots: "noindex, follow",
    });
  }, []);

  useEffect(() => {
    Promise.all([
      fetchUserLearningStats(),
      fetchUserProgress(),
      fetchUserCertificates(),
      fetchPersonalLibrary(),
      fetchLearningNotes(),
    ])
      .then(([s, p, c, l, n]) => {
        setStats(s ?? null);
        setEnrollments((p as { enrollments?: Record<string, { progress_pct?: number }> })?.enrollments ?? null);
        setCertificates(c ?? []);
        setLibrary(l ?? []);
        setNotes(n ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  /* اسم العرض */
  const rawProfile = user?.profile as Record<string, unknown> | null | undefined;
  const displayName =
    (rawProfile?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "المستخدم";
  const initial = displayName.charAt(0);

  const enrollmentList = enrollments ? Object.entries(enrollments) : [];

  return (
    <div className="myl2-page" dir="rtl">

      {/* ══════════ Hero ══════════ */}
      <header className="myl2-hero">
        <div className="myl2-hero__top">
          <div className="myl2-hero__avatar" aria-hidden="true">{initial}</div>

          <div className="myl2-hero__info">
            <h1 className="myl2-hero__name">{displayName}</h1>
            {user?.email && <p className="myl2-hero__email">{user.email}</p>}
            <div className="myl2-hero__tags">
              <span className="myl2-badge myl2-badge--level">طالب علم</span>
              {stats && stats.completion_pct > 0 && (
                <span className="myl2-badge myl2-badge--fire">
                  <Flame size={11} aria-hidden="true" />
                  {stats.completion_pct}% إنجاز
                </span>
              )}
            </div>
          </div>

          <Link href="/settings" className="myl2-hero__gear" aria-label="إعدادات الحساب">
            <User size={16} aria-hidden="true" />
          </Link>
        </div>

        {/* أرقام سريعة */}
        {stats && (
          <div className="myl2-hero__nums" aria-label="إحصائيات سريعة">
            {([
              { val: stats.completed_lessons,  lbl: "درس" },
              { val: stats.completed_paths,    lbl: "مسار" },
              { val: stats.books_read,         lbl: "كتاب" },
              { val: stats.achievements_count, lbl: "إنجاز" },
            ] as const).map(({ val, lbl }, i, arr) => (
              <span key={lbl} className="myl2-qstat">
                <strong className="myl2-qstat__n">{val}</strong>
                <span className="myl2-qstat__l">{lbl}</span>
                {i < arr.length - 1 && <span className="myl2-qstat__sep" aria-hidden="true" />}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ══════════ Body ══════════ */}
      <div className="myl2-body">

        {/* أكمل من حيث توقفت */}
        {(resumeLoading || resumeItems.length > 0) && (
          <section className="myl2-card" aria-labelledby="myl2-resume-hd">
            <div className="myl2-card__head">
              <h2 className="myl2-card__title" id="myl2-resume-hd">
                <PlayCircle size={16} aria-hidden="true" />
                أكمل من حيث توقفت
              </h2>
            </div>

            {resumeLoading ? (
              <div className="myl2-skeletons">
                <div className="myl2-skel" aria-hidden="true" />
                <div className="myl2-skel" aria-hidden="true" />
              </div>
            ) : (
              <div className="myl2-resume-list">
                {resumeItems.map((item) => {
                  const Icon = CONTENT_ICONS[item.content_type] ?? BookOpen;
                  return (
                    <Link key={item.id} href={item.content_url ?? "#"} className="myl2-resume-item">
                      <span className="myl2-resume-item__icon"><Icon size={17} /></span>
                      <div className="myl2-resume-item__body">
                        <p className="myl2-resume-item__title">{item.content_title ?? "محتوى"}</p>
                        <ProgressBar pct={item.progress_pct} />
                        <p className="myl2-resume-item__pct">{item.progress_pct}% مكتمل</p>
                      </div>
                      <ChevronLeft size={14} className="myl2-resume-item__arrow" aria-hidden="true" />
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* الإحصائيات */}
        {stats && (
          <section className="myl2-card" aria-labelledby="myl2-stats-hd">
            <div className="myl2-card__head">
              <h2 className="myl2-card__title" id="myl2-stats-hd">
                <Star size={16} aria-hidden="true" />
                إحصائياتي
              </h2>
            </div>
            <div className="myl2-stats-grid">
              <StatCard icon={GraduationCap} value={stats.completed_lessons} label="دروس مكتملة" />
              <StatCard icon={Target}        value={stats.completed_paths}    label="مسارات" />
              <StatCard icon={BookOpen}      value={stats.books_read}         label="كتب محفوظة" />
              <StatCard icon={Brain}         value={stats.quiz_attempts}      label="اختبارات" />
              <StatCard icon={Medal}         value={stats.achievements_count} label="إنجازات" />
              <StatCard icon={Flame}         value={stats.completion_pct}     label="نسبة الإنجاز" suffix="%" />
            </div>
          </section>
        )}

        {/* مساراتي */}
        <section className="myl2-card" aria-labelledby="myl2-paths-hd">
          <div className="myl2-card__head">
            <h2 className="myl2-card__title" id="myl2-paths-hd">
              <Target size={16} aria-hidden="true" />
              مساراتي
            </h2>
            <Link href="/learning/paths" className="myl2-card__more">
              المسارات <ArrowLeft size={12} aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="myl2-skeletons">
              <div className="myl2-skel" aria-hidden="true" />
              <div className="myl2-skel" aria-hidden="true" />
            </div>
          ) : enrollmentList.length > 0 ? (
            <div className="myl2-paths-list">
              {enrollmentList.map(([slug, e]) => (
                <Link key={slug} href={`/learning/paths/${slug}`} className="myl2-path-item">
                  <div className="myl2-path-item__row">
                    <span className="myl2-path-item__name">{slug}</span>
                    <span className="myl2-path-item__pct">{e.progress_pct ?? 0}%</span>
                  </div>
                  <ProgressBar pct={e.progress_pct ?? 0} />
                </Link>
              ))}
            </div>
          ) : (
            <div className="myl2-empty">
              <GraduationCap size={34} strokeWidth={1} aria-hidden="true" />
              <p>لم تسجّل في مسار بعد</p>
              <Link href="/learning/paths" className="myl2-empty__cta">ابدأ مساراً</Link>
            </div>
          )}
        </section>

        {/* الشهادات */}
        {!loading && certificates.length > 0 && (
          <section className="myl2-card" aria-labelledby="myl2-certs-hd">
            <div className="myl2-card__head">
              <h2 className="myl2-card__title" id="myl2-certs-hd">
                <Trophy size={16} aria-hidden="true" />
                شهاداتي
              </h2>
            </div>
            <div className="myl2-certs-list">
              {certificates.map((c) => (
                <div key={c.certificate_code} className="myl2-cert-item">
                  <div className="myl2-cert-item__icon" aria-hidden="true">
                    <Trophy size={19} strokeWidth={1.5} />
                  </div>
                  <div>
                    <p className="myl2-cert-item__title">{c.title}</p>
                    <p className="myl2-cert-item__meta">
                      {c.certificate_code}
                      {" · "}
                      {new Date(c.issued_at).toLocaleDateString("ar-KW")}
                      {c.score_pct != null ? ` · ${c.score_pct}%` : ""}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* الإنجازات */}
        {stats && (stats.achievements?.length ?? 0) > 0 && (
          <section className="myl2-card" aria-labelledby="myl2-ach-hd">
            <div className="myl2-card__head">
              <h2 className="myl2-card__title" id="myl2-ach-hd">
                <Medal size={16} aria-hidden="true" />
                الإنجازات
              </h2>
            </div>
            <div className="myl2-badges-wrap">
              {stats.achievements.map((a) => (
                <span
                  key={a.key}
                  className="myl2-ach-badge"
                  title={new Date(a.earned_at).toLocaleDateString("ar-KW")}
                >
                  ✦ {a.title}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* المكتبة الشخصية */}
        <section className="myl2-card" aria-labelledby="myl2-lib-hd">
          <div className="myl2-card__head">
            <h2 className="myl2-card__title" id="myl2-lib-hd">
              <BookMarked size={16} aria-hidden="true" />
              مكتبتي الشخصية
            </h2>
            <Link href="/library" className="myl2-card__more">
              المكتبة <ArrowLeft size={12} aria-hidden="true" />
            </Link>
          </div>

          {loading ? (
            <div className="myl2-skeletons">
              {[0, 1, 2].map((i) => (
                <div key={i} className="myl2-skel myl2-skel--sm" aria-hidden="true" />
              ))}
            </div>
          ) : library.length > 0 ? (
            <div className="myl2-lib-grid">
              {library.slice(0, 6).map((item, i) => (
                <Link
                  key={i}
                  href={item.content_url ?? (item.content_id ? `/library/${item.content_id}` : "/library")}
                  className="myl2-lib-item"
                >
                  <BookOpen size={13} aria-hidden="true" className="myl2-lib-item__icon" />
                  <span className="myl2-lib-item__title">{item.title}</span>
                </Link>
              ))}
            </div>
          ) : (
            <div className="myl2-empty">
              <BookOpen size={32} strokeWidth={1} aria-hidden="true" />
              <p>مكتبتك فارغة حتى الآن</p>
              <Link href="/library" className="myl2-empty__cta">تصفح المكتبة</Link>
            </div>
          )}
        </section>

        {/* الملاحظات */}
        {!loading && notes.length > 0 && (
          <section className="myl2-card" aria-labelledby="myl2-notes-hd">
            <div className="myl2-card__head">
              <h2 className="myl2-card__title" id="myl2-notes-hd">
                <Scroll size={16} aria-hidden="true" />
                ملاحظاتي
              </h2>
            </div>
            <ul className="myl2-notes-list" aria-label="ملاحظاتي">
              {notes.slice(0, 5).map((n, i) => (
                <li key={i} className="myl2-note-item">
                  <Clock size={11} aria-hidden="true" />
                  <span>{n.title ?? n.body?.slice(0, 80) ?? ""}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* إجراءات سريعة */}
        <nav className="myl2-card myl2-actions" aria-label="روابط سريعة">
          <Link href="/lessons"  className="myl2-btn myl2-btn--primary">
            <GraduationCap size={14} aria-hidden="true" /> الدروس
          </Link>
          <Link href="/quran-hub" className="myl2-btn">
            <BookOpen size={14} aria-hidden="true" /> القرآن
          </Link>
          <Link href="/library"  className="myl2-btn">
            <BookMarked size={14} aria-hidden="true" /> المكتبة
          </Link>
          <Link href="/search"   className="myl2-btn">
            <Sparkles size={14} aria-hidden="true" /> البحث الشامل
          </Link>
        </nav>

      </div>
    </div>
  );
}
