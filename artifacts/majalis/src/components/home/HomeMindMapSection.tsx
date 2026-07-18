import { Link } from "wouter";
import { Map, Network } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";

const MAPS = [
  {
    href: "/mind-map",
    Icon: Map,
    title: "الخرائط الذهنية",
    desc: "نظّم معلوماتك الإسلامية مرئياً، ابنِ خرائط للعقيدة والفقه والحديث",
    tag: "تفاعلي",
  },
  {
    href: "/knowledge-graph",
    Icon: Network,
    title: "شبكة المعرفة",
    desc: "استكشف العلاقات والروابط بين المفاهيم الإسلامية برسم بياني",
    tag: "مرئي",
  },
];

export function HomeMindMapSection() {
  return (
    <Widget
      id="mind-map"
      className="hmm-section"
      eyebrow="التعلم المرئي"
      title="الخرائط الذهنية"
      moreHref="/mind-map"
      moreLabel="افتح الخرائط"
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
            <span className="hmm-card__arrow" aria-hidden="true">←</span>
          </Link>
        ))}
      </div>
    </Widget>
  );
}
