import { usePageView } from "@/hooks/usePageView";
import { Link } from "wouter";

const SEERAH_CHAPTERS = [
  {
    id: "birth-lineage",
    title: "مولده ونسبه ﷺ",
    icon: "🌙",
    color: "#0d9488",
    desc: "نسبه الشريف، مولده الكريم في مكة المكرمة، أهله ورضاعته",
    topics: ["نسبه ﷺ", "مولده وإرضاعه", "طفولته ويتمه", "حلف الفضول"],
  },
  {
    id: "pre-prophethood",
    title: "قبل البعثة",
    icon: "📜",
    color: "#0369a1",
    desc: "حياته ﷺ قبل الوحي، صفاته وخُلقه، زواجه من خديجة رضي الله عنها",
    topics: ["شبابه وأمانته", "زواجه من خديجة", "بناء الكعبة", "تحنّثه في غار حراء"],
  },
  {
    id: "early-dawah",
    title: "البعثة والدعوة السرية",
    icon: "✨",
    color: "#7c3aed",
    desc: "نزول الوحي الأول، الإسلام الأول، الدعوة السرية في مكة المكرمة",
    topics: ["نزول الوحي", "أوائل المسلمين", "الدعوة في السر", "الهجرة إلى الحبشة"],
  },
  {
    id: "open-dawah",
    title: "الجهر بالدعوة والهجرة",
    icon: "🌟",
    color: "#b45309",
    desc: "الجهر بالإسلام، الإيذاء والابتلاء، هجرة النبي ﷺ إلى المدينة",
    topics: ["الجهر بالدعوة", "الحصار في الشعب", "عام الحزن", "الهجرة إلى المدينة", "غزوة بدر"],
  },
  {
    id: "ghazawat",
    title: "الغزوات والمعاهدات",
    icon: "⚔️",
    color: "#dc2626",
    desc: "الغزوات الكبرى، المعاهدات والمواثيق، فتح مكة المكرمة",
    topics: ["غزوة بدر", "غزوة أُحد", "غزوة الأحزاب", "صلح الحديبية", "فتح مكة"],
  },
  {
    id: "farewell-death",
    title: "حجة الوداع ووفاته ﷺ",
    icon: "🕌",
    color: "#059669",
    desc: "حجة الوداع وخطبتها العظيمة، وفاته ﷺ ودفنه بالمدينة المنورة",
    topics: ["حجة الوداع", "خطبة الوداع", "مرضه ﷺ", "وفاته ودفنه ﷺ"],
  },
];

export default function SeerahPage() {
  usePageView("seerah", null);

  return (
    <div dir="rtl" className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">

      {/* Hero */}
      <div
        className="relative overflow-hidden"
        style={{ background: "linear-gradient(135deg, #064e3b 0%, #065f46 50%, #0d9488 100%)" }}
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none select-none flex items-center justify-center">
          <div className="text-[16rem] leading-none text-white font-arabic">☪</div>
        </div>
        <div className="relative max-w-4xl mx-auto px-4 py-14 text-center text-white">
          <div className="inline-flex items-center gap-2 bg-white/10 text-emerald-100 text-sm px-4 py-1.5 rounded-full mb-4">
            <span>📖</span>
            <span>سيرة النبي ﷺ</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold mb-4 leading-tight">
            السيرة النبوية
          </h1>
          <p className="text-emerald-100 text-base max-w-xl mx-auto leading-relaxed">
            حياة النبي محمد ﷺ كاملةً — من مولده الشريف إلى وفاته ﷺ<br />
            <span className="text-sm opacity-75">المحتوى الشرعي التفصيلي قادم من مصادر موثقة</span>
          </p>
        </div>
      </div>

      {/* مقدمة */}
      <div className="max-w-4xl mx-auto px-4 mt-8">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-5 mb-8">
          <p className="text-emerald-800 dark:text-emerald-300 text-sm leading-relaxed">
            <strong>💡 عن هذا القسم:</strong> يُقدّم هذا القسم السيرة النبوية الشريفة وفق منهج علمي موثق،
            استناداً إلى كتب السيرة المعتمدة كسيرة ابن هشام والبداية والنهاية وزاد المعاد.
            المحتوى التفصيلي يُضاف تدريجياً من مصادر علمية معتمدة.
          </p>
        </div>

        {/* أقسام السيرة */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">مراحل السيرة النبوية</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {SEERAH_CHAPTERS.map((chapter, idx) => (
            <div
              key={chapter.id}
              className="bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl overflow-hidden hover:shadow-lg transition-all"
            >
              {/* رأس البطاقة */}
              <div
                className="px-5 py-4 flex items-center gap-3"
                style={{ background: `${chapter.color}15`, borderBottom: `2px solid ${chapter.color}30` }}
              >
                <span
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
                  style={{ background: `${chapter.color}20` }}
                >
                  {chapter.icon}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: `${chapter.color}20`, color: chapter.color }}
                    >
                      {idx + 1}
                    </span>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">{chapter.title}</h3>
                  </div>
                </div>
              </div>

              {/* محتوى البطاقة */}
              <div className="px-5 py-4">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">{chapter.desc}</p>
                <div className="flex flex-wrap gap-1.5">
                  {chapter.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2.5 py-1 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-100 dark:border-gray-600"
                    >
                      {topic}
                    </span>
                  ))}
                </div>

                {/* حالة: قادم */}
                <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400 flex-shrink-0"></span>
                  <span>المحتوى التفصيلي قادم قريباً</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* مصادر مقترحة */}
        <div className="mt-10 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-2xl p-6">
          <h2 className="font-bold text-gray-900 dark:text-white text-base mb-4">📚 مصادر السيرة المعتمدة</h2>
          <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
            {[
              "السيرة النبوية — ابن هشام",
              "البداية والنهاية — ابن كثير",
              "زاد المعاد في هدي خير العباد — ابن قيم الجوزية",
              "الرحيق المختوم — صفي الرحمن المباركفوري",
              "السيرة النبوية الصحيحة — أكرم ضياء العمري",
            ].map((src) => (
              <li key={src} className="flex items-center gap-2">
                <span className="text-emerald-500">•</span>
                {src}
              </li>
            ))}
          </ul>
        </div>

        {/* روابط ذات صلة */}
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { href: "/stories",  label: "القصص الإسلامية",   icon: "📖" },
            { href: "/prophets", label: "قصص الأنبياء",       icon: "✨" },
            { href: "/hadith",   label: "الأحاديث النبوية",   icon: "📜" },
          ].map((link) => (
            <Link key={link.href} href={link.href}>
              <div className="flex items-center gap-3 p-4 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer">
                <span className="text-xl">{link.icon}</span>
                <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{link.label}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
