import { useEffect, useMemo, useState } from "react";
import { Award, BookOpen, BookText, Bookmark, Flame, GraduationCap, Leaf, Medal, RotateCw } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/components/AuthProvider";
import { PageHeader } from "@/components/ui-common";
import {
  getUserProfileStats,
  checkAndAwardBadges,
  getResumeItems,
  deleteResumeItem,
  type ProfileStats,
  type ResumeItem,
} from "@/lib/user-profile-service";
import { BADGE_DEFS, BADGE_MAP } from "@/lib/user-badges";
import { applyPageSeo } from "@/lib/seo";

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  sub,
  Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  Icon: LucideIcon;
}) {
  return (
    <div className="profile-stat-card">
      <span className="profile-stat-card__icon" aria-hidden="true"><Icon size={20} strokeWidth={1.6} /></span>
      <strong className="profile-stat-card__value">{value}</strong>
      <span className="profile-stat-card__label">{label}</span>
      {sub && <span className="profile-stat-card__sub">{sub}</span>}
    </div>
  );
}

// ─── Level bar ───────────────────────────────────────────────────────────────

function LevelBar({ stats }: { stats: ProfileStats }) {
  const { level } = stats;
  const pct =
    level.nextLevelXp > 0
      ? Math.min(100, Math.round((level.xp / level.nextLevelXp) * 100))
      : 100;

  return (
    <div className="profile-level-bar" style={{ "--level-color": level.color } as React.CSSProperties}>
      <div className="profile-level-bar__head">
        <span className="profile-level-bar__title">{level.titleAr}</span>
        <span className="profile-level-bar__xp">
          {level.xp.toLocaleString("ar-KW")} / {level.nextLevelXp.toLocaleString("ar-KW")} XP
        </span>
      </div>
      <div className="profile-level-bar__track">
        <div
          className="profile-level-bar__fill"
          style={{ "--level-pct": `${pct}%` } as React.CSSProperties}
        />
      </div>
      <div className="profile-level-bar__meta">
        <span>المستوى {level.level}</span>
        <span>{pct}٪</span>
      </div>
    </div>
  );
}

// ─── Badge grid ──────────────────────────────────────────────────────────────

function BadgeGrid({ earned }: { earned: Set<string> }) {
  const CATEGORY_LABELS: Record<string, string> = {
    streak: "الأيام المتواصلة",
    lessons: "الدروس",
    library: "المكتبة",
    tasbih: "الذكر والتسبيح",
    path: "المسارات الشرعية",
    content: "المحتوى المحفوظ",
  };

  const byCategory = BADGE_DEFS.reduce<Record<string, typeof BADGE_DEFS>>((acc, b) => {
    (acc[b.category] ??= []).push(b);
    return acc;
  }, {});

  return (
    <div className="profile-badges">
      {Object.entries(byCategory).map(([cat, defs]) => (
        <div key={cat} className="profile-badges__group">
          <h3 className="profile-badges__group-title">{CATEGORY_LABELS[cat] ?? cat}</h3>
          <div className="profile-badges__row">
            {defs.map((def) => {
              const isEarned = earned.has(def.key);
              return (
                <div
                  key={def.key}
                  className={`profile-badge${isEarned ? " profile-badge--earned" : ""}`}
                  title={`${def.titleAr} — ${def.descAr}`}
                >
                  <span className="profile-badge__icon">{def.icon}</span>
                  <span className="profile-badge__title">{def.titleAr}</span>
                  {!isEarned && (
                    <span className="profile-badge__locked">{def.descAr}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Resume list ─────────────────────────────────────────────────────────────

const TYPE_LABEL: Record<string, string> = {
  lesson: "درس",
  book: "كتاب",
  article: "مقال",
  path: "مسار",
  hadith: "حديث",
  fatwa: "فتوى",
};

function ResumeList({
  items,
  userId,
  onDelete,
}: {
  items: ResumeItem[];
  userId: string;
  onDelete: (type: string, id: string) => void;
}) {
  if (items.length === 0) return null;

  return (
    <section className="profile-resume">
      <h2 className="profile-section-title">📍 تابع من حيث توقفت</h2>
      <div className="profile-resume__list">
        {items.map((item) => (
          <div key={`${item.content_type}-${item.content_id}`} className="profile-resume__item">
            <span className="profile-resume__icon">{item.thumbnail_icon || "📄"}</span>
            <div className="profile-resume__body">
              <Link href={item.content_url} className="profile-resume__title">
                {item.content_title}
              </Link>
              <div className="profile-resume__meta">
                <span className="profile-resume__type">
                  {TYPE_LABEL[item.content_type] ?? item.content_type}
                </span>
                {item.position?.section && (
                  <span className="profile-resume__section">{item.position.section}</span>
                )}
              </div>
              {typeof item.position?.pct === "number" && (
                <div className="profile-resume__track">
                  <div
                    className="profile-resume__fill"
                    style={{ "--resume-pct": `${item.position.pct}%` } as React.CSSProperties}
                  />
                </div>
              )}
            </div>
            {typeof item.position?.pct === "number" && (
              <span className="profile-resume__pct">{item.position.pct}٪</span>
            )}
            <button
              type="button"
              className="profile-resume__del"
              title="إزالة"
              onClick={() => {
                deleteResumeItem(userId, item.content_type, item.content_id);
                onDelete(item.content_type, item.content_id);
              }}
            >
              ✕
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}

// ─── New badges flash ─────────────────────────────────────────────────────────

function NewBadgesFlash({ keys }: { keys: string[] }) {
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 5000);
    return () => clearTimeout(t);
  }, []);
  if (!visible || keys.length === 0) return null;

  return (
    <div className="profile-new-badges" role="status" aria-live="polite">
      {keys.map((key) => {
        const def = BADGE_MAP.get(key);
        if (!def) return null;
        return (
          <div key={key} className="profile-new-badge">
            <span>{def.icon}</span>
            <span>أحرزت شارة جديدة: <strong>{def.titleAr}</strong></span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function UserStatsPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<ProfileStats | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/my-profile",
      title: "إحصائياتي | المجلس العلمي",
      description: "إحصائياتي وشاراتي وسجل تعلمي في المجلس العلمي — تابع تقدمك في رحلتك العلمية.",
      keywords: ["إحصائيات", "شارات", "نشاط المستخدم", "تقدم علمي", "المجلس العلمي"],
      robots: "noindex, follow",
    });
  }, []);
  const [resumeItems, setResumeItems] = useState<ResumeItem[]>([]);
  const [newBadges, setNewBadges] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const earnedSet = useMemo(
    () => new Set(stats?.earnedBadges.map((b) => b.key) ?? []),
    [stats],
  );

  useEffect(() => {
    if (!isLoggedIn || !user?.id) {
      setLoading(false);
      return;
    }
    const uid = user.id;

    Promise.all([getUserProfileStats(uid), getResumeItems(uid)])
      .then(async ([profileStats, resume]) => {
        setStats(profileStats);
        setResumeItems(resume);
        // Check for new badges silently after stats load
        const newKeys = await checkAndAwardBadges(uid, profileStats);
        if (newKeys.length > 0) {
          setNewBadges(newKeys);
          // Refresh earned badges list
          setStats((prev) =>
            prev
              ? {
                  ...prev,
                  earnedBadges: [
                    ...prev.earnedBadges,
                    ...newKeys.map((k) => {
                      const def = BADGE_MAP.get(k)!;
                      return {
                        key: k,
                        titleAr: def.titleAr,
                        descAr: def.descAr,
                        icon: def.icon,
                        category: def.category,
                        earned_at: new Date().toISOString(),
                      };
                    }),
                  ],
                }
              : prev,
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isLoggedIn, user?.id]);

  // ── Guards ────────────────────────────────────────────────────────
  if (authLoading || loading) {
    return (
      <div className="page-shell narrow" dir="rtl">
        <div className="profile-loading">
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
          <span className="profile-loading__dot" />
        </div>
      </div>
    );
  }

  if (!isLoggedIn) {
    return (
      <div className="page-shell narrow usp-login-prompt" dir="rtl">
        <div className="usp-login-icon">🔐</div>
        <p className="usp-login-msg">سجّل الدخول لعرض ملفك الشخصي وإنجازاتك.</p>
        <Link href="/login?next=/profile" className="ui-card-btn">
          تسجيل الدخول
        </Link>
      </div>
    );
  }

  const displayName =
    user?.profile?.full_name || user?.email?.split("@")[0] || "المستخدم";

  return (
    <div className="page-shell narrow profile-page" dir="rtl">
      <NewBadgesFlash keys={newBadges} />

      <PageHeader
        eyebrow="ملفك الشخصي"
        title={`أهلاً، ${displayName}`}
        subtitle="إنجازاتك ومستواك وتقدمك في تطبيق المجالس."
      />

      {/* ── بطاقة الهوية ── */}
      {stats && (
        <div className="profile-identity ui-card" style={{ "--level-color": stats.level.color } as React.CSSProperties}>
          <div className="profile-identity__left">
            <div className="profile-identity__avatar">
              {displayName.slice(0, 1)}
            </div>
            <div>
              <div className="profile-identity__name">{displayName}</div>
              <div className="profile-identity__level-badge">
                {stats.level.titleAr}
              </div>
            </div>
          </div>
          <div className="profile-identity__streak">
            <span className="profile-identity__streak-num">{stats.streakDays}</span>
            <span className="profile-identity__streak-label"><Flame size={14} strokeWidth={2} aria-hidden="true" /> يوم متواصل</span>
          </div>
        </div>
      )}

      {/* ── شريط المستوى ── */}
      {stats && <LevelBar stats={stats} />}

      {/* ── شبكة الإحصاءات ── */}
      {stats && (
        <section className="profile-stats-section">
          <h2 className="profile-section-title">إحصاءاتك</h2>
          <div className="profile-stats-grid">
            <StatCard Icon={Flame}         label="أيام متواصلة" value={stats.streakDays} />
            <StatCard Icon={GraduationCap} label="دروس مكتملة" value={stats.completedLessons} />
            <StatCard Icon={BookText}      label="كتب مقروءة" value={stats.booksRead} />
            <StatCard
              Icon={RotateCw}
              label="تسبيحات اليوم"
              value={stats.tasbihToday.toLocaleString("ar-KW")}
              sub={`${stats.tasbihLifetime.toLocaleString("ar-KW")} إجمالي`}
            />
            <StatCard Icon={Bookmark} label="محفوظات" value={stats.savedItems} />
            <StatCard Icon={Award}    label="شارات محرزة" value={stats.earnedBadges.length} sub={`من ${BADGE_DEFS.length}`} />
          </div>
        </section>
      )}

      {/* ── الاستئناف ── */}
      {user?.id && resumeItems.length > 0 && (
        <ResumeList
          items={resumeItems}
          userId={user.id}
          onDelete={(type, id) =>
            setResumeItems((prev) =>
              prev.filter((i) => !(i.content_type === type && i.content_id === id)),
            )
          }
        />
      )}

      {/* ── لوحة الشارات ── */}
      {stats && (
        <section className="profile-badges-section">
          <h2 className="profile-section-title"><Medal size={18} strokeWidth={1.8} aria-hidden="true" /> الإنجازات والشارات</h2>
          <p className="profile-badges-hint">
            {stats.earnedBadges.length} من {BADGE_DEFS.length} شارة محرزة
          </p>
          <BadgeGrid earned={earnedSet} />
        </section>
      )}

      {/* ── روابط سريعة ── */}
      <nav className="profile-quick-links" aria-label="روابط الملف">
        <Link href="/lessons" className="profile-quick-link"><GraduationCap size={15} strokeWidth={1.8} aria-hidden="true" /> الدروس</Link>
        <Link href="/library" className="profile-quick-link"><BookOpen size={15} strokeWidth={1.8} aria-hidden="true" /> المكتبة</Link>
        <Link href="/tasbih" className="profile-quick-link"><RotateCw size={15} strokeWidth={1.8} aria-hidden="true" /> التسبيح</Link>
        <Link href="/adhkar" className="profile-quick-link"><Leaf size={15} strokeWidth={1.8} aria-hidden="true" /> الأذكار</Link>
      </nav>
    </div>
  );
}
