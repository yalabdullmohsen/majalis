import { Link } from "wouter";
import { Widget } from "@/components/widgets/Widget";

const s = (path: string, extra = "") =>
  `<svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${path}</svg>`;

/* أيقونة SVG كـ dangerouslySetInnerHTML لتجنب JSX parsing overhead */
const Icon = ({ d }: { d: string }) => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
    stroke="currentColor" strokeWidth="1.6"
    strokeLinecap="round" strokeLinejoin="round"
    aria-hidden="true"
    dangerouslySetInnerHTML={{ __html: d }}
  />
);

const TOPICS: { href: string; icon: string; label: string; desc: string; color: string }[] = [
  {
    href: "/miracles",
    icon: '<circle cx="11" cy="9" r="4"/><path d="M11 13v3"/><path d="M7 16h8"/><path d="M14 6l2-3"/><path d="M8 6 6 3"/>',
    label: "الإعجاز العلمي",
    desc: "آيات كونية مذهلة في القرآن والسنة",
    color: "#0F766E",
  },
  {
    href: "/fawaid",
    icon: '<path d="M11 2a5 5 0 0 1 5 5c0 2.4-1.5 4.5-3.5 5.4V14H9.5v-1.6C7.5 11.5 6 9.4 6 7a5 5 0 0 1 5-5z"/><line x1="9.5" y1="17" x2="12.5" y2="17"/><line x1="10" y1="20" x2="12" y2="20"/>',
    label: "الفوائد العلمية",
    desc: "لآلئ ودرر من كلام العلماء",
    color: "#176B57",
  },
  {
    href: "/raqaiq",
    icon: '<path d="M11 4c-3.5 1.5-5 4-5 6.5a5 5 0 0 0 10 0C16 8 14.5 5.5 11 4z"/><path d="M11 4v6"/><path d="M8.5 8.5 11 10l2.5-1.5"/>',
    label: "الرقائق والزهد",
    desc: "مواعظ تُليِّن القلوب وتصفي النفوس",
    color: "#065F46",
  },
  {
    href: "/stories",
    icon: '<path d="M4 4h6v8H4z"/><path d="M12 4h6v8h-6z"/><line x1="4" y1="16" x2="18" y2="16"/><line x1="7" y1="19" x2="15" y2="19"/>',
    label: "القصص الإسلامية",
    desc: "وقائع وعِبَر من التاريخ الإسلامي",
    color: "#176B57",
  },
  {
    href: "/hikam-salaf",
    icon: '<polygon points="11,2 13.5,7.5 20,7.5 15,11.5 17,18 11,14 5,18 7,11.5 2,7.5 8.5,7.5"/>',
    label: "حكم السلف الصالح",
    desc: "أقوال الأئمة والصحابة الكرام",
    color: "#0F5132",
  },
  {
    href: "/wasaya-nabawiyya",
    icon: '<path d="M5 3h9a2 2 0 0 1 2 2v12a1 1 0 0 1-1 1H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z"/><line x1="7" y1="8" x2="14" y2="8"/><line x1="7" y1="12" x2="14" y2="12"/><line x1="7" y1="16" x2="11" y2="16"/>',
    label: "الوصايا النبوية",
    desc: "كلمات جامعة ومعانٍ عظيمة",
    color: "#0F766E",
  },
  {
    href: "/prophets",
    icon: '<path d="M17 11.5a6.5 6.5 0 1 1-7-7 5.5 5.5 0 0 0 7 7z"/><circle cx="16" cy="5" r="1.2" fill="currentColor" stroke="none"/>',
    label: "قصص الأنبياء",
    desc: "٢٥ نبياً بالمعجزة والدرس",
    color: "#065F46",
  },
  {
    href: "/akhlaq",
    icon: '<path d="M11 19c-5-3.5-8-7-8-10a5 5 0 0 1 8-4 5 5 0 0 1 8 4c0 3-3 6.5-8 10z"/>',
    label: "الأخلاق الإسلامية",
    desc: "مكارم الأخلاق من الوحي",
    color: "#176B57",
  },
  {
    href: "/shamael",
    icon: '<circle cx="11" cy="11" r="4"/><line x1="11" y1="2" x2="11" y2="4"/><line x1="11" y1="18" x2="11" y2="20"/><line x1="2" y1="11" x2="4" y2="11"/><line x1="18" y1="11" x2="20" y2="11"/><line x1="4.9" y1="4.9" x2="6.3" y2="6.3"/><line x1="15.7" y1="15.7" x2="17.1" y2="17.1"/><line x1="4.9" y1="17.1" x2="6.3" y2="15.7"/><line x1="15.7" y1="6.3" x2="17.1" y2="4.9"/>',
    label: "الشمائل المحمدية",
    desc: "صفاته ﷺ خَلقاً وخُلقاً وهَديه",
    color: "#176B57",
  },
  {
    href: "/janna-naar",
    icon: '<path d="M11 2l2 5h5l-4 3 1.5 5.5L11 13l-4.5 2.5L8 10 4 7h5z"/>',
    label: "الجنة والنار",
    desc: "صفة الجنة وأسباب دخولها وأدعية الآخرة",
    color: "#123F36",
  },
  {
    href: "/fadail-aamal",
    icon: '<path d="M8 18V9l3-7 3 7v9"/><path d="M5 18h12"/><path d="M3 18h16"/>',
    label: "فضائل الأعمال",
    desc: "أحاديث صحيحة في ثواب الأعمال",
    color: "#0F5132",
  },
  {
    href: "/adab-talab-ilm",
    icon: '<rect x="3" y="5" width="6" height="10" rx="1"/><rect x="9" y="3" width="6" height="12" rx="1"/><rect x="15" y="6" width="4" height="9" rx="1"/><line x1="3" y1="18" x2="19" y2="18"/>',
    label: "آداب طالب العلم",
    desc: "فضل العلم وآداب الطالب مع شيخه",
    color: "#176B57",
  },
  {
    href: "/amr-bil-maruf",
    icon: '<line x1="11" y1="2" x2="11" y2="20"/><line x1="6" y1="20" x2="16" y2="20"/><line x1="3" y1="7" x2="19" y2="7"/><path d="M3 7 1.5 12a3.2 3.2 0 0 0 3 0L3 7z"/><path d="M19 7l-1.5 5a3.2 3.2 0 0 0 3 0L19 7z"/>',
    label: "الأمر بالمعروف",
    desc: "مراتبه الثلاث وشروطه وأحكامه",
    color: "#176B57",
  },
  {
    href: "/malaika",
    icon: '<path d="M11 3a3 3 0 0 1 3 3v1l3-2-2 4h2l-3 4-2-1v4h-2v-4l-2 1-3-4h2L5 5l3 2V6a3 3 0 0 1 3-3z"/>',
    label: "الملائكة في الإسلام",
    desc: "أسماؤهم ومهامهم وصفاتهم من الوحي",
    color: "#123F36",
  },
  {
    href: "/sahabah",
    icon: '<circle cx="8" cy="7" r="3"/><circle cx="15" cy="7" r="3"/><path d="M1 18c0-3.3 3.1-6 7-6"/><path d="M11 18c0-3.3 2.6-6 6-6"/>',
    label: "أعلام الصحابة",
    desc: "12 صحابياً بالسيرة والإرث والفضل",
    color: "#0F5132",
  },
  {
    href: "/fiqh-qawaid",
    icon: '<rect x="2" y="16" width="18" height="3" rx="1"/><rect x="5" y="10" width="3" height="6"/><rect x="9.5" y="7" width="3" height="9"/><rect x="14" y="12" width="3" height="4"/>',
    label: "القواعد الفقهية الكبرى",
    desc: "القواعد الخمس وفروعها وتطبيقاتها",
    color: "#176B57",
  },
];

void s; // suppress unused warning

const TopicsIcon = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 18 18">
    <polygon points="9,1 11,6.5 17,6.5 12.5,10 14.5,16 9,12.5 3.5,16 5.5,10 1,6.5 7,6.5" fill="#176B57" opacity="0.85"/>
  </svg>
);

export function HomeInterestingTopics() {
  return (
    <Widget
      id="interesting-topics"
      className="hit-section"
      icon={<TopicsIcon />}
      eyebrow="استكشف"
      title="مواضيع مشوّقة"
      moreHref="/fawaid"
      moreLabel="الكل"
      state="ready"
    >
      <div className="hit-grid">
        {TOPICS.map(({ href, icon, label, desc, color }) => (
          <Link
            key={href}
            href={href}
            className="hit-card"
            style={{ "--hit-clr": color } as React.CSSProperties}
          >
            <span className="hit-card__emoji" aria-hidden="true">
              <Icon d={icon} />
            </span>
            <strong className="hit-card__label">{label}</strong>
            <span className="hit-card__desc">{desc}</span>
          </Link>
        ))}
      </div>
    </Widget>
  );
}
