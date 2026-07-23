import { useEffect } from "react";
import { Link } from "wouter";
import {
  BookOpen, Repeat2, Users, Moon, Droplets, Heart, Smile, Star,
  Puzzle, ListChecks, Trophy, ChevronLeft,
  type LucideIcon,
} from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

type KidsCard = { href: string; title: string; desc: string; Icon: LucideIcon };

/* بطاقات قسم الأطفال — كل بطاقة تربط بنظام/محتوى معتمد قائم فعليًا في
   المنصة (لا صفحات أو بيانات جديدة مكرَّرة)؛ التصفية المناسبة للأطفال
   (تبسيط، لا مسائل خلافية) تتم داخل كل صفحة وجهة بحسب طبيعة محتواها —
   جميعها محتوى تعليمي أساسي غير خلافي أصلاً (قرآن، سيرة، أذكار، آداب). */
const KIDS_CARDS: KidsCard[] = [
  { href: "/quran-hub",              title: "تعلّم القرآن للصغار",     desc: "استمع واقرأ وابدأ رحلتك مع القرآن الكريم", Icon: BookOpen },
  { href: "/quran-memorization",     title: "قصار السور والحفظ",       desc: "احفظ قصار السور تدريجيًا مع المراجعة الذكية", Icon: Repeat2 },
  { href: "/prophets",               title: "قصص الأنبياء",            desc: "قصص الأنبياء عليهم السلام بأسلوب مبسّط", Icon: Users },
  { href: "/seerah",                 title: "السيرة النبوية",          desc: "حياة النبي ﷺ من المولد إلى الوفاة", Icon: Moon },
  { href: "/salah-guide",            title: "تعلّم الصلاة والوضوء",    desc: "خطوات الوضوء والصلاة بالترتيب", Icon: Droplets },
  { href: "/adhkar",                 title: "الأذكار والأدعية",        desc: "أذكار الصباح والمساء وأدعية يومية", Icon: Heart },
  { href: "/akhlaq",                 title: "الأخلاق والآداب",         desc: "آداب إسلامية للتعامل مع الآخرين", Icon: Smile },
  { href: "/tawhid",                 title: "العقيدة المبسطة",         desc: "أساسيات الإيمان بأسلوب ميسَّر", Icon: Star },
  { href: "/quiz",                   title: "أسئلة واختبارات ممتعة",   desc: "اختبر معلوماتك بأسئلة شيّقة", Icon: Puzzle },
  { href: "/daily-wird",             title: "خطة يومية صغيرة",         desc: "وردك اليومي من القرآن، خطوة بخطوة", Icon: ListChecks },
  { href: "/stats",                  title: "إنجازاتي وتقدمي",         desc: "تابع تقدمك وشاراتك التي حصلت عليها", Icon: Trophy },
];

export default function KidsPage() {
  useEffect(() => {
    applyPageSeo({
      path: "/kids",
      title: "قسم الأطفال | المجلس العلمي",
      description: "ركن آمن وبسيط للأطفال: تعلّم القرآن والسيرة والأذكار والأخلاق الإسلامية بأسلوب ميسَّر وجذاب.",
      keywords: ["الأطفال", "تعليم الأطفال", "قصص الأنبياء للأطفال", "تعليم القرآن للأطفال"],
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "قسم الأطفال",
          description: "محتوى إسلامي تعليمي ميسَّر للأطفال",
          numberOfItems: KIDS_CARDS.length,
          itemListElement: KIDS_CARDS.map((c, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: c.title,
            description: c.desc,
            url: `https://www.majlisilm.com${c.href}`,
          })),
        },
      ],
    });
  }, []);

  return (
    <div className="kids-hub-page" dir="rtl">
      <section className="kids-hub-intro">
        <Star size={30} className="kids-hub-intro__icon" aria-hidden="true" />
        <h1 className="kids-hub-intro__title">ركن الأطفال</h1>
        <p className="kids-hub-intro__sub">
          تعلّم ممتع وآمن لديننا الحنيف — بلا فتاوى معقّدة، بلا روابط خارجية
        </p>
      </section>

      <section className="kids-hub-grid" aria-label="أقسام ركن الأطفال">
        {KIDS_CARDS.map((c) => (
          <Link key={c.href} href={c.href} className="kids-hub-card ui-card">
            <div className="kids-hub-card__icon" aria-hidden="true">
              <c.Icon size={24} strokeWidth={1.8} />
            </div>
            <div className="kids-hub-card__body">
              <h2 className="kids-hub-card__title">{c.title}</h2>
              <p className="kids-hub-card__desc">{c.desc}</p>
            </div>
            <ChevronLeft size={18} className="kids-hub-card__chevron" aria-hidden="true" />
          </Link>
        ))}
      </section>
    </div>
  );
}
