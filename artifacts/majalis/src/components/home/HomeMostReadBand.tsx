/**
 * الأكثر قراءة + اقتراح اليوم — من الصفحات الأخيرة محليًا + اقتراح يومي ثابت.
 */
import { Link } from "wouter";
import { getRecentPages } from "@/lib/recent-pages";
import { getDayIndex } from "@/lib/daily-content";
import { toArabicDigits } from "@/lib/utils";

const FALLBACK_POPULAR = [
  { href: "/mushaf", title: "المصحف" },
  { href: "/adhkar", title: "الأذكار" },
  { href: "/lessons", title: "الدروس" },
  { href: "/prophets", title: "قصص الأنبياء" },
  { href: "/fiqh", title: "الفقه" },
  { href: "/quiz", title: "سين جيم" },
] as const;

const TODAY_SUGGESTIONS = [
  { href: "/mushaf", title: "اقرأ صفحة من المصحف", desc: "ثبّت وردك من القرآن اليوم" },
  { href: "/adhkar/morning", title: "أذكار الصباح", desc: "تابع أذكارك بعدد التكرار" },
  { href: "/lessons", title: "درس علمي قريب", desc: "تصفّح دروس اليوم والقادمة" },
  { href: "/prophets", title: "قصة نبي", desc: "من قصص الأنبياء في القرآن" },
  { href: "/daily-wird", title: "الورد اليومي", desc: "أكمل صفحاتك المقررة" },
  { href: "/quiz", title: "سؤال سين جيم", desc: "اختبر معلوماتك بلعبة قصيرة" },
] as const;

function looksLikeRoutePath(value: string): boolean {
  const v = value.trim();
  if (!v) return true;
  if (v.includes("/") || v.includes("?")) return true;
  if (/^[a-z0-9_-]+$/i.test(v) && /[a-z]/i.test(v)) return true;
  return false;
}

export function HomeMostReadBand() {
  const recent = getRecentPages(12);
  const popular =
    recent.length >= 3
      ? recent
          .slice(0, 8)
          .map((p) => ({
            href: p.href,
            title: looksLikeRoutePath(p.label) ? "" : p.label,
          }))
          .filter((p) => Boolean(p.title))
          .slice(0, 6)
      : [];
  const displayPopular =
    popular.length >= 3 ? popular : FALLBACK_POPULAR.map((p) => ({ ...p }));

  const suggestion = TODAY_SUGGESTIONS[getDayIndex() % TODAY_SUGGESTIONS.length]!;

  return (
    <>
      <section className="m2030-band" aria-label="الأكثر قراءة">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">الأكثر قراءة</h2>
          <span className="m2030-band__link" aria-hidden="true">
            {toArabicDigits(displayPopular.length)} عناصر
          </span>
        </div>
        <div className="home-most-read">
          {displayPopular.map((item) => (
            <Link key={item.href} href={item.href} className="home-most-read__item mj-card mj-card--link">
              {item.title}
            </Link>
          ))}
        </div>
        <p className="home-most-read__note" role="note">
          القائمة تعكس تصفّحك المحلي على هذا الجهاز؛ لا تُعرض كإحصاء عام للمنصة.
        </p>
      </section>

      <section className="m2030-band m2030-band--sage" aria-label="اقتراح اليوم">
        <div className="m2030-band__head">
          <h2 className="m2030-band__title">اقتراح اليوم</h2>
        </div>
        <Link href={suggestion.href} className="home-today-suggest mj-card mj-card--link mj-card--raised">
          <strong className="home-today-suggest__title">{suggestion.title}</strong>
          <span className="home-today-suggest__desc">{suggestion.desc}</span>
        </Link>
      </section>
    </>
  );
}
