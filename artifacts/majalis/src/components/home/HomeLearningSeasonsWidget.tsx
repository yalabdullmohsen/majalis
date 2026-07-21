import { Lightbulb } from "lucide-react";
import { Link } from "wouter";

// Approximate Gregorian dates for Islamic seasons (1448 هـ)
type Season = {
  id: string;
  name: string;
  arabicName: string;
  startDate: Date;
  endDate?: Date;
  description: string;
  suggestion: string;
  href: string;
  color: string;
};

function getSeasons(): Season[] {
  return [
    {
      id: "muharram-1448",
      name: "Muharram",
      arabicName: "محرم",
      startDate: new Date("2026-07-01"),
      endDate: new Date("2026-07-29"),
      description: "رأس السنة الهجرية 1448هـ — شهر الله المحرم",
      suggestion: "تجديد النية واستحضار نعمة الهجرة",
      href: "/raqaiq",
      color: "#173D35",
    },
    {
      id: "rabi-awwal-1448",
      name: "Rabi al-Awwal",
      arabicName: "ربيع الأول",
      startDate: new Date("2026-09-25"),
      endDate: new Date("2026-10-24"),
      description: "ربيع الأول 1448هـ — ذكرى مولد النبي ﷺ",
      suggestion: "قراءة السيرة النبوية والشمائل المحمدية",
      href: "/shamael",
      color: "#173D35",
    },
    {
      id: "rajab-1448",
      name: "Rajab",
      arabicName: "رجب",
      startDate: new Date("2026-12-30"),
      endDate: new Date("2027-01-28"),
      description: "شهر رجب، من الأشهر الحرم",
      suggestion: "أكثر من الاستغفار وقراءة القرآن",
      href: "/adhkar",
      color: "#1e4d8a",
    },
    {
      id: "shaban-1448",
      name: "Shaban",
      arabicName: "شعبان",
      startDate: new Date("2027-01-29"),
      endDate: new Date("2027-02-27"),
      description: "شهر شعبان، تُرفع فيه الأعمال",
      suggestion: "استعد لرمضان بمراجعة القرآن",
      href: "/quran-hub",
      color: "#7c3aed",
    },
    {
      id: "ramadan-1448",
      name: "Ramadan",
      arabicName: "رمضان",
      startDate: new Date("2027-02-28"),
      endDate: new Date("2027-03-29"),
      description: "شهر رمضان المبارك 1448هـ",
      suggestion: "خطة تعلّم رمضانية مكثّفة",
      href: "/learning-plan",
      color: "var(--majalis-emerald-deep, #173D35)",
    },
    {
      id: "dhul-hijja-1448",
      name: "Dhul Hijja",
      arabicName: "عشر ذي الحجة",
      startDate: new Date("2027-05-18"),
      endDate: new Date("2027-05-27"),
      description: "أفضل أيام الدنيا، العشر الأول من ذي الحجة 1448هـ",
      suggestion: "مراجعة أعمال اليوم العظيمة",
      href: "/adhkar",
      color: "var(--majalis-emerald, #173D35)",
    },
  ];
}

function daysUntil(date: Date): number {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function isActive(season: Season): boolean {
  const now = new Date();
  return now >= season.startDate && (!season.endDate || now <= season.endDate);
}

export function HomeLearningSeasonsWidget() {
  const seasons = getSeasons();
  const now = new Date();

  // Find current active season, or the next upcoming one
  const active = seasons.find((s) => isActive(s));
  const upcoming = seasons
    .filter((s) => s.startDate > now)
    .sort((a, b) => a.startDate.getTime() - b.startDate.getTime())
    .slice(0, 3);

  const featured = active ?? upcoming[0];
  if (!featured) return null;

  const days = daysUntil(featured.startDate);
  const isNow = isActive(featured);

  return (
    <section className="lsw-section ds-section">
      <div className="ds-section__head">
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20">
            <polygon points="10,1 12.5,7 19,7 14,11 16,18 10,14 4,18 6,11 1,7 7.5,7" fill="none" stroke="#173D35" strokeWidth="1.3"/>
            <circle cx="10" cy="10" r="3" fill="none" stroke="#173D35" strokeWidth="0.9"/>
          </svg>
          <h2 className="ds-section__title">مواسم التعلّم</h2>
        </div>
        <span className="lsw-badge">تقريبي</span>
      </div>

      {/* Featured season card */}
      <div className={`lsw-featured lsw--${featured.id}`} style={{ position: "relative", overflow: "hidden" }}>
        <svg aria-hidden="true" style={{ position: "absolute", top: "-15px", left: "-15px", opacity: 0.07, pointerEvents: "none" }} width="100" height="100" viewBox="0 0 100 100">
          <polygon points="50,5 62,35 92,35 68,55 78,85 50,65 22,85 32,55 8,35 38,35" fill="white"/>
          <circle cx="50" cy="50" r="18" fill="none" stroke="white" strokeWidth="1.5"/>
        </svg>
        <div className="lsw-featured__header">
          <div>
            <span className="lsw-featured__name">
              {featured.arabicName}
            </span>
            <p className="lsw-featured__desc">{featured.description}</p>
          </div>
          <div className="lsw-featured__countdown">
            {isNow ? (
              <span className="lsw-featured__now">
                الآن
              </span>
            ) : (
              <span className="lsw-featured__days">
                <strong>{days}</strong>
                <span>يوم</span>
              </span>
            )}
          </div>
        </div>
        <p className="lsw-featured__suggestion">
          <Lightbulb size={14} className="inline ml-1" /><strong>اقتراح:</strong> {featured.suggestion}
        </p>
        <Link href={featured.href} className="lsw-featured__cta">
          ابدأ الآن ←
        </Link>
      </div>

      {/* Upcoming mini list */}
      {upcoming.length > 1 && (
        <div className="lsw-mini-list">
          {upcoming.slice(active ? 0 : 1).map((s) => {
            const d = daysUntil(s.startDate);
            return (
              <div key={s.id} className={`lsw-mini-item lsw--${s.id}`}>
                <span className="lsw-mini-item__dot" />
                <span className="lsw-mini-item__name">{s.arabicName}</span>
                <span className="lsw-mini-item__days">{d} يوم</span>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
