import { Link } from "wouter";
import { GitBranch, Map, Network } from "lucide-react";

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
  {
    href: "/learning-path",
    Icon: GitBranch,
    title: "خارطة طالب العلم",
    desc: "مسارك التعليمي من المبتدئ إلى المتقدم خطوة بخطوة",
    tag: "منهجي",
  },
];

export function HomeMindMapSection() {
  return (
    <section className="home-section hmm-section" aria-labelledby="hmm-heading">
      <div className="home-section-head">
        <div>
          <p className="home-eyebrow">التعلم المرئي</p>
          <h2 id="hmm-heading">الخرائط الذهنية</h2>
        </div>
        <Link href="/mind-map" className="home-section-link">افتح الخرائط</Link>
      </div>

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
    </section>
  );
}
