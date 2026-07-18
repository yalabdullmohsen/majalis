import { useEffect, useState } from "react";
import { Link } from "wouter";
import { getCurrentSunnahPeriod, getLocalSunnahPeriod, type SunnahPeriod } from "@/lib/sunnah-by-time";
import { Widget } from "@/components/widgets/Widget";

const SunnahIcon = (
  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 16 16" style={{ marginTop: "0.2rem", flexShrink: 0 }}>
    <polygon points="8,1 10,6 15.5,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0.5,6 6,6" fill="#176B57" opacity="0.7"/>
  </svg>
);

/**
 * مُنقَّح للمرحلة 7 لاستخدام <Widget> الموحّد. فرقان سلوكيان مقصودان، كلاهما
 * للحفاظ على السلوك الأصلي بلا أي فقد بصري:
 * 1. القسم كان دومًا "جاهزًا" فعليًا حتى قبل اكتمال الجلب الشبكي —
 *    getLocalSunnahPeriod() يُرجع حسابًا محليًا فوريًا متزامنًا، فلا توجد حالة
 *    "تحميل/فارغ" حقيقية هنا — بقي state="ready" دائمًا.
 * 2. نص وقت الفترة (period.title) **لم** يُمرَّر عبر خاصية description الافتراضية
 *    لأن <Widget> يعرضها بلا أي class قابل للاستهداف، بينما .home-sunnah-card__period
 *    له تجاوز لون مقصود ودائم الفعالية (لا نادر): `.home-main--v3 .ui-card
 *    .home-sunnah-card__period { color: rgba(255,255,255,0.75) !important; }`
 *    في elite-2026.css — و`home-main--v3` مُطبَّقة دومًا على حاوية الرئيسية
 *    (HomePage.tsx، بلا شرط)، فهذا التجاوز نشط في كل تحميل حقيقي للصفحة، لا
 *    حالة نادرة. استخدام description العام كان سيُفقد هذا اللون فعليًا، فأُبقي
 *    كعنصر مستقل داخل children بنفس الـclass الأصلي.
 * className="ui-card" أُبقي كما هو (كان مطبَّقًا على القسم قبل الهجرة) بدل
 * افتراض تطابق بصري تلقائي مع نمط widget-shell الافتراضي.
 */
export function HomeSunnahByTime() {
  const [period, setPeriod] = useState<SunnahPeriod>(getLocalSunnahPeriod());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getCurrentSunnahPeriod()
      .then((p) => setPeriod(p))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Widget
      id="sunnah-time"
      className="ui-card home-sunnah-card"
      icon={SunnahIcon}
      eyebrow="حسب وقتك"
      title="سنن الوقت الحالي"
      state="ready"
    >
      <p className="home-sunnah-card__period">{loading ? "..." : period.title}</p>
      <ul className="home-sunnah-card__list">
        {period.suggestions.map((item) => (
          <li key={item.href}>
            <Link href={item.href} className="home-sunnah-card__link">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </Widget>
  );
}

export default HomeSunnahByTime;
