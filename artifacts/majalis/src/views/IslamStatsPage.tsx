import { useEffect, useState } from "react";
import { BarChart3, Globe, Heart, Star, TrendingUp, Users } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";
import "@/styles/elite-2026.css";

/* ══════════════════════════════════════════════════════════════════
   §241، الإسلام في أرقام  (.is-*)
   ══════════════════════════════════════════════════════════════════ */

type TabId = "global" | "quran" | "history" | "science";

const TABS: { id: TabId; label: string; icon: typeof Globe }[] = [
  { id: "global",  label: "الإسلام في العالم",   icon: Globe },
  { id: "quran",   label: "القرآن الكريم",        icon: Star },
  { id: "history", label: "الحضارة الإسلامية",   icon: TrendingUp },
  { id: "science", label: "الإعجاز العلمي",       icon: BarChart3 },
];

interface StatCard {
  value: string;
  label: string;
  sub?: string;
  color?: string;
}

interface BarItem {
  label: string;
  value: number;
  max: number;
  unit: string;
  color: string;
}

interface TimelineItem {
  year: string;
  event: string;
  note?: string;
}

interface ScienceCard {
  topic: string;
  ayah: string;
  ref: string;
  discovery: string;
  discoveryYear: string;
}

const GLOBAL_STATS: StatCard[] = [
  { value: "١.٩ مليار", label: "مسلم في العالم", sub: "٢٤٪ من سكان الأرض", color: "#1F4D3A" },
  { value: "٢٠٥٠", label: "أكبر ديانة متوقعة", sub: "وفق تقديرات مركز بيو", color: "#1a5a7a" },
  { value: "٤٩", label: "دولة ذات أغلبية مسلمة", sub: "من أصل ١٩٥ دولة في العالم", color: "#7B3E0C" },
  { value: "٣٨٠٠", label: "لغة ينطق بها المسلمون", sub: "الإسلام يتجاوز الحدود اللغوية", color: "#312E81" },
  { value: "٢٢٠٠+", label: "مسجد في ألمانيا", sub: "مثال على انتشار الإسلام في أوروبا", color: "#065F46" },
  { value: "١ مليون+", label: "حاج سنوياً", sub: "أكبر تجمع سنوي منظم في العالم", color: "#9B1C1C" },
];

const POPULATION_BARS: BarItem[] = [
  { label: "إندونيسيا", value: 231, max: 270, unit: "م", color: "#1F4D3A" },
  { label: "باكستان",   value: 212, max: 270, unit: "م", color: "#1a5a7a" },
  { label: "بنغلاديش",  value: 153, max: 270, unit: "م", color: "#7B3E0C" },
  { label: "نيجيريا",   value: 99,  max: 270, unit: "م", color: "#312E81" },
  { label: "مصر",       value: 87,  max: 270, unit: "م", color: "#065F46" },
  { label: "إيران",      value: 83,  max: 270, unit: "م", color: "#9B1C1C" },
  { label: "تركيا",     value: 75,  max: 270, unit: "م", color: "#4A2008" },
  { label: "المغرب",    value: 36,  max: 270, unit: "م", color: "#1E3A5F" },
];

const QURAN_STATS: StatCard[] = [
  { value: "١١٤",  label: "سورة",        sub: "منها ٨٦ مكية و٢٨ مدنية", color: "#1F4D3A" },
  { value: "٦٢٣٦", label: "آية",          sub: "في الرواية الأكثر شيوعاً", color: "#1a5a7a" },
  { value: "٣٠",   label: "جزءاً",        sub: "موزعة على ٦٠ حزباً", color: "#7B3E0C" },
  { value: "٧٧٤٣٩", label: "كلمة",       sub: "في المصحف الشريف", color: "#312E81" },
  { value: "٣٢٣٦٧١", label: "حرف",       sub: "المجموع الكلي للحروف", color: "#065F46" },
  { value: "٢٣",   label: "سنة للنزول",  sub: "بدأ في رمضان ٦١٠م", color: "#9B1C1C" },
  { value: "٥",    label: "حفاظ في عهده ﷺ أشهرهم", sub: "عثمان، علي، ابن مسعود، زيد، أبيّ", color: "#4A2008" },
  { value: "١",    label: "مصدر للتشريع", sub: "أولاً وقبل كل شيء", color: "#1E3A5F" },
];

const HISTORY_TIMELINE: TimelineItem[] = [
  { year: "٦١٠ م", event: "بدء نزول الوحي على النبي محمد ﷺ في غار حراء" },
  { year: "٦٢٢ م", event: "الهجرة النبوية، بداية التقويم الهجري" },
  { year: "٦٣٢ م", event: "وفاة النبي ﷺ وحفظ القرآن مكتوباً في عهد أبي بكر" },
  { year: "٧٥٠ م", event: "امتداد الدولة الإسلامية من الصين حتى إسبانيا" },
  { year: "٨٣٠ م", event: "تأسيس بيت الحكمة في بغداد، عصر الترجمة والعلم" },
  { year: "١٠٠٠ م", event: "ابن سينا يؤلف القانون في الطب، مرجع الطب لـ ٦٠٠ سنة" },
  { year: "١٢٥٨ م", event: "سقوط بغداد، وبقاء القرآن محفوظاً في الصدور" },
  { year: "١٤٥٣ م", event: "فتح القسطنطينية على يد محمد الفاتح" },
  { year: "٢٠٢٤ م", event: "الإسلام الدين الأسرع نمواً في العالم لعقود متتالية", note: "وفق مركز بيو للأبحاث" },
];

const HISTORY_ACHIEVEMENTS: StatCard[] = [
  { value: "٨٠٠+", label: "طبيب وعالم مسلم", sub: "في العصور الوسطى أسهموا في الطب والعلوم", color: "#1F4D3A" },
  { value: "٤٠٠+", label: "كتاب لابن سينا", sub: "شاملة للطب والفلسفة والفلك", color: "#1a5a7a" },
  { value: "١٢٠٠+", label: "لفظ عربي في الإنجليزية", sub: "مثل: algebra, alcohol, coffee, sugar", color: "#7B3E0C" },
  { value: "٦٠٠ سنة", label: "القانون مرجعاً طبياً", sub: "كتاب ابن سينا في جامعات أوروبا", color: "#312E81" },
];

const SCIENCE_CARDS: ScienceCard[] = [
  {
    topic: "توسّع الكون",
    ayah: "وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ",
    ref: "سورة الذاريات: ٤٧",
    discovery: "اكتشاف توسع الكون على يد إدوين هابل",
    discoveryYear: "١٩٢٩ م",
  },
  {
    topic: "الحاجز بين البحرين",
    ayah: "مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ، بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ",
    ref: "سورة الرحمن: ١٩-٢٠",
    discovery: "اكتشاف علم أوقيانوغرافيا الحاجز المائي بين البحار",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "دورة الماء في الطبيعة",
    ayah: "أَلَمْ تَرَ أَنَّ اللَّهَ يُزْجِي سَحَابًا ثُمَّ يُؤَلِّفُ بَيْنَهُ ثُمَّ يَجْعَلُهُ رُكَامًا فَتَرَى الْوَدْقَ يَخْرُجُ مِنْ خِلَالِهِ",
    ref: "سورة النور: ٤٣",
    discovery: "الفهم العلمي الكامل لدورة الماء وتكوّن السحب",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "مراحل خلق الإنسان",
    ayah: "وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ، ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَّكِينٍ",
    ref: "سورة المؤمنون: ١٢-١٣",
    discovery: "علم الأجنة الحديث وتفاصيل مراحل تطور الجنين",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "حرارة الشمس وضوءها",
    ayah: "وَجَعَلَ الشَّمْسَ سِرَاجًا",
    ref: "سورة نوح: ١٦",
    discovery: "الفرق بين الجرم الضوئي (سراج) والجرم العاكس (نور للقمر)",
    discoveryYear: "القرن العشرين",
  },
  {
    topic: "غشاء الأصابع",
    ayah: "بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ",
    ref: "سورة القيامة: ٤",
    discovery: "تميز بصمات الأصابع واستخدامها في التعريف البشري",
    discoveryYear: "١٨٨٠ م",
  },
];

function AnimatedBar({ item, delay }: { item: BarItem; delay: number }) {
  const [width, setWidth] = useState(0);
  const pct = (item.value / item.max) * 100;

  useEffect(() => {
    const t = setTimeout(() => setWidth(pct), delay);
    return () => clearTimeout(t);
  }, [pct, delay]);

  return (
    <div className="is-bar">
      <div className="is-bar__label">{item.label}</div>
      <div className="is-bar__track">
        <div
          className="is-bar__fill"
          style={{ "--is-bar-w": `${width}%`, "--is-bar-color": item.color } as { [k: string]: string }}
        />
      </div>
      <div className="is-bar__val">{item.value}{item.unit}</div>
    </div>
  );
}

export default function IslamStatsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("global");

  useEffect(() => {
    applyPageSeo({
      path: "/islam-stats",
      title: "الإسلام في أرقام | المجلس العلمي",
      description: "إحصاءات وأرقام مثيرة عن الإسلام في العالم: المسلمون، القرآن، الحضارة الإسلامية، والإعجاز العلمي.",
      keywords: ["الإسلام في أرقام", "إحصاءات المسلمين", "الإعجاز القرآني", "الحضارة الإسلامية"],
    });
  }, []);

  return (
    <div className="is-page" dir="rtl">
      {/* ══ Hero ══ */}
      <section className="is-hero">
        <div className="is-hero__inner">
          <div className="is-hero__badge">
            <Globe size={13} aria-hidden="true" />
            <span>إنفوجرافيك تفاعلي</span>
          </div>
          <h1 className="is-hero__title">الإسلام في أرقام</h1>
          <p className="is-hero__sub">
            حقائق وإحصاءات موثقة عن الإسلام، من انتشاره في العالم إلى إعجاز القرآن وإسهامات الحضارة الإسلامية
          </p>
          <div className="is-hero__kpis">
            <div className="is-kpi"><Users size={22} aria-hidden="true" /><span>١.٩ مليار مسلم</span></div>
            <div className="is-kpi"><Star size={22} aria-hidden="true" /><span>٦٢٣٦ آية قرآنية</span></div>
            <div className="is-kpi"><Heart size={22} aria-hidden="true" /><span>١٤٠٠+ سنة حضارة</span></div>
          </div>
        </div>
      </section>

      <div className="is-container">
        {/* ══ التبويبات ══ */}
        <div className="is-tabs" role="tablist">
          {TABS.map(t => (
            <button
              key={t.id}
              type="button"
              role="tab"
              className={`is-tab${activeTab === t.id ? " is-tab--active" : ""}`}
              onClick={() => setActiveTab(t.id)}
              aria-selected={activeTab === t.id}
            >
              <t.icon size={15} aria-hidden="true" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>

        {/* ── الإسلام في العالم ── */}
        {activeTab === "global" && (
          <div className="is-section">
            <div className="is-stats-grid">
              {GLOBAL_STATS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>

            <div className="is-section-title">
              <Users size={16} aria-hidden="true" />
              <h2>أكبر الدول الإسلامية سكاناً (مليون نسمة)</h2>
            </div>
            <div className="is-bars">
              {POPULATION_BARS.map((item, i) => (
                <AnimatedBar key={item.label} item={item} delay={i * 80} />
              ))}
            </div>

            <div className="is-note">
              📊 المصدر: تقرير مركز بيو للأبحاث، «مستقبل الأديان العالمية ٢٠٢٣»
            </div>
          </div>
        )}

        {/* ── القرآن الكريم ── */}
        {activeTab === "quran" && (
          <div className="is-section">
            <div className="is-quran-highlight">
              <p className="is-quran-highlight__text">
                إِنَّا نَحْنُ نَزَّلْنَا الذِّكْرَ وَإِنَّا لَهُ لَحَافِظُونَ
              </p>
              <p className="is-quran-highlight__ref">سورة الحجر: ٩</p>
            </div>
            <div className="is-stats-grid">
              {QURAN_STATS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>
            <div className="is-note">
              📖 الإحصاءات وفق رواية حفص عن عاصم، المعتمدة في معظم البلدان الإسلامية
            </div>
          </div>
        )}

        {/* ── الحضارة الإسلامية ── */}
        {activeTab === "history" && (
          <div className="is-section">
            <div className="is-stats-grid">
              {HISTORY_ACHIEVEMENTS.map((s, i) => (
                <div key={i} className="is-stat-card" style={{ "--is-card-color": s.color } as { [k: string]: string }}>
                  <span className="is-stat-card__val">{s.value}</span>
                  <span className="is-stat-card__lbl">{s.label}</span>
                  {s.sub && <span className="is-stat-card__sub">{s.sub}</span>}
                </div>
              ))}
            </div>

            <div className="is-section-title">
              <TrendingUp size={16} aria-hidden="true" />
              <h2>خط زمني للحضارة الإسلامية</h2>
            </div>
            <div className="is-timeline">
              {HISTORY_TIMELINE.map((item, i) => (
                <div key={i} className="is-timeline-item">
                  <div className="is-timeline-item__year">{item.year}</div>
                  <div className="is-timeline-item__dot" aria-hidden="true" />
                  <div className="is-timeline-item__content">
                    <p className="is-timeline-item__event">{item.event}</p>
                    {item.note && <p className="is-timeline-item__note">{item.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── الإعجاز العلمي ── */}
        {activeTab === "science" && (
          <div className="is-section">
            <div className="is-science-intro">
              <BarChart3 size={20} aria-hidden="true" />
              <p>
                الإعجاز العلمي في القرآن الكريم: آيات تحمل دلالات علمية اكتشفها العلم الحديث بعد قرون من نزول القرآن.
              </p>
            </div>
            <div className="is-science-grid">
              {SCIENCE_CARDS.map((card, i) => (
                <div key={i} className="is-science-card">
                  <div className="is-science-card__topic">{card.topic}</div>
                  <p className="is-science-card__ayah" lang="ar">
                    ﴿{card.ayah}﴾
                  </p>
                  <p className="is-science-card__ref">{card.ref}</p>
                  <div className="is-science-card__discovery">
                    <span className="is-science-card__disc-label">الاكتشاف العلمي</span>
                    <span className="is-science-card__disc-text">{card.discovery}</span>
                    <span className="is-science-card__disc-year">{card.discoveryYear}</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="is-note">
              ⚠️ تنبيه: الإعجاز العلمي يُقدَّم للاستدلال لا للتفسير، التفسير العلمي للقرآن يشترط شروطاً وضوابط علمية صارمة
            </div>
          </div>
        )}
      </div>

      <div className="twh-share">
        <ShareButtons title="الإسلام في أرقام — المجلس العلمي" url="https://majlisilm.com/islam-stats" />
      </div>
    </div>
  );
}
