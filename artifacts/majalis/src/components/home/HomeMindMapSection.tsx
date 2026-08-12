import { Link } from "wouter";
import { Map, Waypoints } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import "@/styles/components/home/home-mindmap.css";

const MAPS = [
  {
    href: "/mind-map",
    Icon: Map,
    title: "الخرائط الذهنية",
    desc: "خرائط العلوم الشرعية للدراسة",
    tag: "مركز",
  },
  {
    href: "/quran/revelation-order",
    Icon: Waypoints,
    title: "ترتيب نزول السور",
    desc: "خط زمني للسور حسب النزول",
    tag: "قرآن",
  },
] as const;

/** ودجت الرئيسية — يوجّه إلى مركز الخرائط وأداة النزول، لا إلى قوائم عامة. */
export function HomeMindMapSection() {
  return (
    <Widget
      id="mind-map"
      className="hmm-section"
      eyebrow=""
      title="الخرائط الذهنية"
      moreHref="/mind-map"
      moreLabel="كل الخرائط"
      state="ready"
    >
      <div className="hmm-grid">
        {MAPS.map(({ href, Icon, title, desc, tag }) => (
          <Link key={href} href={href} className="hmm-card">
            <div className="hmm-card__icon" aria-hidden="true">
              <Icon size={24} strokeWidth={1.6} />
            </div>
            <div className="hmm-card__body">
              <span className="hmm-card__tag">{tag}</span>
              <strong className="hmm-card__title">{title}</strong>
              <p className="hmm-card__desc">{desc}</p>
            </div>
            <span className="hmm-card__arrow" aria-hidden="true">‹</span>
          </Link>
        ))}
      </div>
    </Widget>
  );
}
