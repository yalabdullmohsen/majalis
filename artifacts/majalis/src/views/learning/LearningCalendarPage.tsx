import { useEffect, useState } from "react";
import { Link } from "wouter";
import { format } from "date-fns";
import { arSA } from "date-fns/locale";
import { BookOpen, GraduationCap, Mic, Calendar, MapPin, CheckCircle2 } from "lucide-react";
import { PageHeader, SkeletonCardGrid } from "@/components/ui-common";
import { ShareButtons } from "@/components/ContentActions";
import { SectionQuiz } from "@/components/ui/SectionQuiz";
import { fetchLearningCalendar, subscribeLearningEvent } from "@/lib/digital-learning-service";
import { applyPageSeo } from "@/lib/seo";

type CalendarEvent = {
  id: string;
  title: string;
  event_type: string;
  starts_at: string;
  location?: string;
};

const TYPE_META: Record<string, { label: string; Icon: React.ComponentType<{ size?: number; strokeWidth?: number; "aria-hidden"?: boolean }> }> = {
  lesson:     { label: "درس",      Icon: BookOpen      },
  course:     { label: "دورة",     Icon: GraduationCap },
  lecture:    { label: "محاضرة",   Icon: Mic           },
  conference: { label: "مؤتمر",    Icon: Mic           },
  occasion:   { label: "مناسبة",   Icon: Calendar      },
};
const DEFAULT_META = { label: "حدث", Icon: Calendar };

export default function LearningCalendarPage() {
  const [events,       setEvents]       = useState<CalendarEvent[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [subscribedIds, setSubscribedIds] = useState<Set<string>>(new Set());
  const [pendingId,    setPendingId]    = useState<string | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/learning/calendar",
      title: "تقويم الدروس والدورات | المجلس العلمي",
      description: "تقويم الأحداث والدروس والدورات الإسلامية القادمة، اشترك وتابع المواعيد العلمية.",
      keywords: ["تقويم دروس", "دورات إسلامية", "مواعيد علمية", "أحداث شرعية", "دورات قرآنية"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebPage",
          name: "تقويم الدروس والدورات الإسلامية",
          url: "https://majlisilm.com/learning/calendar",
          description: "تقويم الأحداث والدروس والدورات الإسلامية القادمة مع مواعيدها",
          about: { "@type": "Thing", name: "الأحداث والدروس العلمية الإسلامية" },
        },
      ],
    });
  }, []);

  useEffect(() => {
    fetchLearningCalendar()
      .then(setEvents)
      .finally(() => setLoading(false));
  }, []);

  const handleSubscribe = async (eventId: string) => {
    if (subscribedIds.has(eventId) || pendingId === eventId) return;
    setPendingId(eventId);
    try {
      await subscribeLearningEvent(eventId);
      setSubscribedIds((prev) => new Set(prev).add(eventId));
    } finally {
      setPendingId(null);
    }
  };

  if (loading) return <SkeletonCardGrid count={6} />;

  return (
    <div className="page-shell narrow" dir="rtl">
      <PageHeader title="التقويم العلمي" subtitle="الدروس والدورات والمناسبات القادمة" />

      {events.length === 0 ? (
        <div className="lcp2-empty">
          <Calendar size={48} strokeWidth={1.2} className="lcp2-empty__icon" aria-hidden="true" />
          <p className="lcp2-empty__msg">لا توجد أحداث قادمة حالياً، تابع لاحقاً.</p>
        </div>
      ) : (
        <div className="lcp2-grid">
          {events.map((ev) => {
            const date      = new Date(ev.starts_at);
            const dayNum    = format(date, "d");
            const monthName = format(date, "MMM", { locale: arSA });
            const fullDate  = format(date, "EEEE d MMMM yyyy", { locale: arSA });
            const timeStr   = format(date, "HH:mm");
            const meta      = TYPE_META[ev.event_type] ?? DEFAULT_META;
            const { Icon }  = meta;
            const subscribed = subscribedIds.has(ev.id);
            const pending    = pendingId === ev.id;

            return (
              <article key={ev.id} className="lcp2-event">
                {/* جانب التاريخ */}
                <div className="lcp2-event__date-box" aria-hidden="true">
                  <span className="lcp2-event__day">{dayNum}</span>
                  <span className="lcp2-event__month">{monthName}</span>
                </div>

                {/* محتوى البطاقة */}
                <div className="lcp2-event__body">
                  <div className="lcp2-event__top">
                    <span className="lcp2-event__type-badge">
                      <Icon size={12} strokeWidth={1.8} aria-hidden />
                      {meta.label}
                    </span>
                  </div>

                  <h3 className="lcp2-event__title">{ev.title}</h3>

                  <div className="lcp2-event__meta">
                    <span className="lcp2-event__time">
                      <Calendar size={11} aria-hidden="true" /> {fullDate} — {timeStr}
                    </span>
                    {ev.location && (
                      <span className="lcp2-event__location">
                        <MapPin size={11} aria-hidden="true" /> {ev.location}
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSubscribe(ev.id)}
                    disabled={subscribed || pending}
                    className={`lcp2-subscribe-btn${subscribed ? " lcp2-subscribe-btn--done" : ""}`}
                    aria-label={subscribed ? "تمت الإضافة للتقويم" : "أضف للتقويم"}
                  >
                    {subscribed ? (
                      <>
                        <CheckCircle2 size={13} aria-hidden="true" />
                        تمت الإضافة
                      </>
                    ) : pending ? (
                      "جاري الإضافة…"
                    ) : (
                      <>
                        <Calendar size={13} aria-hidden="true" />
                        أضف للتقويم
                      </>
                    )}
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <p className="lcp2-footer-link">
        <Link href="/calendar">تقويم الدروس الكامل</Link>
      </p>
      <div className="twh-share">
        <ShareButtons title="تقويم الدروس الشرعية — المجلس العلمي" url="https://majlisilm.com/learning/calendar" />
      </div>
      <div className="px-4 pb-6 mt-4">
        <SectionQuiz categoryId={["hadith", "fiqh"]} title="اختبر معلوماتك في الحديث والفقه" count={4} />
      </div>
    </div>
  );
}
