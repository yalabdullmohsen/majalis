import { Link } from "wouter";
import { Map, Network } from "lucide-react";
import { Widget } from "@/components/widgets/Widget";
import "@/styles/components/home/home-mindmap.css";

const MAPS = [
  {
    href: "/knowledge-graph",
    Icon: Network,
    title: "استكشف المعرفة",
    desc: "شبكة دلالية تربط العلوم والمفاهيم والعلماء والكتب",
    tag: "بوابة",
  },
  {
    href: "/mind-map",
    Icon: Map,
    title: "الخرائط الذهنية",
    desc: "خرائط تفاعلية للعقيدة والفقه والحديث وسائر العلوم",
    tag: "تفاعلي",
  },
] as const;

export function HomeMindMapSection() {
  return (
    <Widget
      id="mind-map"
      className="hmm-section"
      eyebrow="التعلم المرئي"
      title="استكشف المعرفة"
      moreHref="/knowledge-graph"
      moreLabel="افتح الشبكة"
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
