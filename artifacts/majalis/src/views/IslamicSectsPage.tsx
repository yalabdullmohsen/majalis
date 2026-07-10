import { useEffect, useState } from "react";
import { applyPageSeo } from "@/lib/seo";
import { ShareButtons } from "@/components/ContentActions";

type Sect = {
  id: string;
  name: string;
  fullName: string;
  icon: string;
  category: "مدرسة سنية" | "شيعة" | "مدرسة عقدية" | "فرقة مستقلة" | "فرقة تاريخية";
  era: string;
  origin: string;
  founder: string;
  foundingCause: string;
  keyBeliefs: string[];
  keyBooks: string[];
  keyScholars: string[];
  status: "قائمة" | "تاريخية";
  spread: string;
  quote?: string;
};

const SECTS: Sect[] = [
  {
    id: "ahl-al-sunna",
    name: "أهل السنة والجماعة",
    fullName: "أهل السنة والجماعة (الجماعة)",
    icon: "🌙",
    category: "مدرسة سنية",
    era: "من القرن الأول الهجري",
    origin: "الحجاز / الشام / العراق",
    founder: "التأسيس النبوي — الصحابة الكرام",
    foundingCause: "التمسك بسنة النبي ﷺ وإجماع الصحابة والاتباع لا الابتداع",
    keyBeliefs: [
      "القرآن الكريم كلام الله غير مخلوق",
      "الإيمان قول وعمل واعتقاد، يزيد وينقص",
      "الصحابة عدول لا يُطعن في أحد منهم",
      "رؤية الله في الآخرة حق ثابت بالكتاب والسنة",
      "كرامات الأولياء حق لا تبلغ درجة معجزات الأنبياء",
      "القدر خيره وشره من الله تعالى",
    ],
    keyBooks: [
      "العقيدة الطحاوية — الطحاوي",
      "لمعة الاعتقاد — ابن قدامة",
      "شرح العقيدة الواسطية — ابن تيمية",
    ],
    keyScholars: ["الإمام أحمد بن حنبل", "الطحاوي", "ابن تيمية", "ابن القيم"],
    status: "قائمة",
    spread: "الغالبية العظمى من المسلمين في العالم (نحو 85-90%)",
    quote: "افترقت اليهود على إحدى وسبعين فرقة... وستفترق أمتي على ثلاث وسبعين فرقة كلها في النار إلا واحدة... قالوا: ومَن هي؟ قال: الجماعة — أبو داود والترمذي",
  },
  {
    id: "ashariyya",
    name: "الأشعرية",
    fullName: "أهل السنة — المدرسة الأشعرية",
    icon: "📖",
    category: "مدرسة عقدية",
    era: "القرن الرابع الهجري (ت.324 هـ)",
    origin: "البصرة / بغداد",
    founder: "أبو الحسن الأشعري (260-324 هـ)",
    foundingCause: "مواجهة المعتزلة بالمنطق والبرهان العقلي مع التمسك بالنصوص والتسليم لها",
    keyBeliefs: [
      "تأويل الصفات المتشابهة بما يليق بجلال الله",
      "العقل لا يستقل بمعرفة الحسن والقبح",
      "القرآن الكريم كلام الله غير مخلوق",
      "الكسب: للعبد اكتساب وإرادة والله خالق الأفعال",
      "الرؤية حق لأهل الجنة",
    ],
    keyBooks: [
      "الإبانة عن أصول الديانة — الأشعري",
      "اللمع في الرد على أهل الزيغ — الأشعري",
      "التمهيد — الباقلاني",
      "الإرشاد — الجويني",
    ],
    keyScholars: ["الإمام الغزالي", "إمام الحرمين الجويني", "الفخر الرازي", "الآمدي"],
    status: "قائمة",
    spread: "سائدة في المغرب العربي ومصر والشام وجنوب آسيا وتركيا",
  },
  {
    id: "maturidiyya",
    name: "الماتريدية",
    fullName: "أهل السنة — المدرسة الماتريدية",
    icon: "📚",
    category: "مدرسة عقدية",
    era: "القرن الرابع الهجري (ت.333 هـ)",
    origin: "سمرقند / ما وراء النهر",
    founder: "أبو منصور الماتريدي (238-333 هـ)",
    foundingCause: "تدعيم عقيدة أهل السنة في مواجهة المعتزلة والجهمية في بلاد خراسان",
    keyBeliefs: [
      "تنزيه الله عن التشبيه مع إثبات الصفات اللائقة بجلاله",
      "العقل يعرف وجود الله والحسن والقبح، والشرع يؤكدهما ويفصّلهما",
      "القرآن الكريم كلام الله القديم النفسي",
      "الإيمان لا يزيد ولا ينقص في أصله",
    ],
    keyBooks: [
      "كتاب التوحيد — الماتريدي",
      "تأويلات أهل السنة — الماتريدي",
      "شرح الفقه الأكبر — ملا علي القاري",
    ],
    keyScholars: ["أبو المعين النسفي", "أبو البركات النسفي", "كمال الدين ابن الهمام"],
    status: "قائمة",
    spread: "سائدة في الأحناف في تركيا وآسيا الوسطى وجنوب آسيا",
  },
  {
    id: "shia-ithna",
    name: "الشيعة الاثنا عشرية",
    fullName: "الشيعة الإمامية الاثنا عشرية",
    icon: "🔱",
    category: "شيعة",
    era: "القرن الأول الهجري (بدأت الجذور بعد مقتل الحسين 61 هـ)",
    origin: "الكوفة / العراق",
    founder: "تبلورت رسمياً مع زيد بن علي ثم المذهب الجعفري في عهد الصادق (ت.148 هـ)",
    foundingCause: "الاعتقاد بأن الإمامة حق إلهي لآل البيت النبوي من نسل علي وفاطمة",
    keyBeliefs: [
      "الإمامة من أصول الدين، وهي نص إلهي لا اختيار بشري",
      "اثنا عشر إماماً معصومون من نسل علي بن أبي طالب",
      "الإمام الثاني عشر (المهدي) غائب وسيعود في آخر الزمان",
      "المتعة (زواج مؤقت) جائزة",
      "بعض الروايات تختلف في السنة عن صحيح البخاري ومسلم",
    ],
    keyBooks: [
      "الكافي — الكليني",
      "من لا يحضره الفقيه — الصدوق",
      "نهج البلاغة",
    ],
    keyScholars: ["الشيخ الطوسي", "الشيخ المفيد", "العلامة الحلي", "الخميني"],
    status: "قائمة",
    spread: "إيران (الغالبية)، العراق، لبنان، البحرين، أجزاء من باكستان واليمن",
  },
  {
    id: "zaidiyya",
    name: "الزيدية",
    fullName: "الزيدية — الشيعة الزيدية",
    icon: "⚔️",
    category: "شيعة",
    era: "القرن الثاني الهجري (ثورة زيد 122 هـ)",
    origin: "الكوفة / اليمن",
    founder: "زيد بن علي بن الحسين بن علي (ت. 122 هـ)",
    foundingCause: "رفض السكوت عن الظلم والمطالبة بإمامة العالم المجاهد من آل البيت",
    keyBeliefs: [
      "الإمامة لمن هو من ذرية علي وفاطمة وقام بالسيف ضد الظالمين",
      "الأئمة غير معصومين وعددهم غير محدد",
      "أقرب الفرق الشيعية لأهل السنة في الفقه والعقيدة",
      "يرون صحة خلافة أبي بكر وعمر مع تفضيل علي",
    ],
    keyBooks: [
      "مسند الإمام زيد",
      "البحر الزخار — المهدي لدين الله",
    ],
    keyScholars: ["يحيى بن الحسين (الهادي)", "الناصر للحق الأطروش"],
    status: "قائمة",
    spread: "اليمن (الحوثيون يعتنقون الزيدية) وبعض مناطق قزوين",
  },
  {
    id: "ismaeliyya",
    name: "الإسماعيلية",
    fullName: "الإسماعيلية — الشيعة السبعية",
    icon: "⭐",
    category: "شيعة",
    era: "القرن الثاني الهجري (انشقاق 148 هـ)",
    origin: "المدينة المنورة / مصر / فارس",
    founder: "إسماعيل بن جعفر الصادق (ت. 145 هـ) ومن ناصروا خط إمامته",
    foundingCause: "الاعتقاد بأن الإمامة انتقلت من الصادق إلى إسماعيل ثم ابنه محمد لا إلى موسى الكاظم",
    keyBeliefs: [
      "الإمامة استمرت في نسل إسماعيل وللنصوص ظاهر وباطن",
      "التأويل الباطني للنصوص الشرعية",
      "فروع عدة: الفاطمية والنزارية والمستعلية والدروز",
    ],
    keyBooks: [
      "دعائم الإسلام — النعمان بن محمد",
      "راحة العقل — حميد الدين الكرماني",
    ],
    keyScholars: ["الحاكم النيسابوري (نسبياً)", "الملك المؤيد بالله الفاطمي"],
    status: "قائمة",
    spread: "الهند وباكستان وأفغانستان وأجزاء من إفريقيا وسوريا (فرقة الآغاخانية النزارية)",
  },
  {
    id: "khawarij",
    name: "الخوارج",
    fullName: "الخوارج (أهل الوعيد)",
    icon: "🗡️",
    category: "فرقة تاريخية",
    era: "القرن الأول الهجري (38 هـ — معركة صفين)",
    origin: "الكوفة / حروراء",
    founder: "خرجوا على علي بن أبي طالب بعد قبوله التحكيم في صفين",
    foundingCause: "رفض التحكيم البشري في الخلافة وتكفير من قبله — «لا حكم إلا لله»",
    keyBeliefs: [
      "تكفير مرتكب الكبيرة وخلوده في النار",
      "الخروج على كل إمام ظالم واجب شرعاً",
      "الإيمان لا يتجزأ: ترك الفريضة كفر",
      "الجمهور على إباحة قتالهم وهم أشد الفرق في الغلو",
    ],
    keyBooks: [
      "لا كتب مستقلة لمعظمهم — أُثّر عنهم خطب وشعر",
      "كتاب الملل والنحل (عرض نقدي) — الشهرستاني",
    ],
    keyScholars: [],
    status: "تاريخية",
    spread: "انقرضوا إلا الإباضية التي تتبرأ من لقب «الخوارج» وتُعدّ أعدل فرقهم",
  },
  {
    id: "ibadiyya",
    name: "الإباضية",
    fullName: "الإباضية — أتباع عبد الله بن إباض",
    icon: "🕌",
    category: "فرقة مستقلة",
    era: "القرن الأول الهجري (انشقوا عن الخوارج نحو 65 هـ)",
    origin: "البصرة / عُمان",
    founder: "عبد الله بن إباض التميمي (ت. نحو 86 هـ) وجابر بن زيد",
    foundingCause: "فصل أنفسهم عن غلو الخوارج في التكفير مع الاحتفاظ ببعض أصولهم",
    keyBeliefs: [
      "مرتكب الكبيرة كافر كفر نعمة لا كفر ملة (خلافاً للخوارج)",
      "الإمامة الشورى وللمسلمين خلع إمامهم",
      "يختلفون عن الخوارج في تحريم التقية وإباحة الزواج من المخالفين",
      "الرؤية غير ممكنة لله يوم القيامة",
    ],
    keyBooks: [
      "المصنف — الكِنْدي",
      "بيان الشرع — محمد بن إبراهيم الكِنْدي",
    ],
    keyScholars: ["جابر بن زيد الأزدي", "أبو عبيدة مسلم بن أبي كريمة"],
    status: "قائمة",
    spread: "عُمان (المذهب الرسمي)، وجيوب في زنجبار وتونس والجزائر وليبيا",
  },
  {
    id: "mutazila",
    name: "المعتزلة",
    fullName: "المعتزلة — أصحاب العدل والتوحيد",
    icon: "🔬",
    category: "فرقة تاريخية",
    era: "القرن الثاني الهجري (اعتزال واصل بن عطاء نحو 105 هـ)",
    origin: "البصرة / بغداد",
    founder: "واصل بن عطاء (80-131 هـ) وعمرو بن عبيد",
    foundingCause: "الاعتزال عن مجلس الحسن البصري في مسألة مرتكب الكبيرة — المنزلة بين المنزلتين",
    keyBeliefs: [
      "التوحيد: نفي الصفات القائمة بالذات (الصفات أعيان الذات لا زائدة عليها)",
      "العدل: الله لا يخلق أفعال العباد — للعبد إرادة حقيقية (خلافاً للجبرية)",
      "المنزلة بين المنزلتين: الفاسق لا مؤمن ولا كافر",
      "الوعد والوعيد: الله لا يغفر صاحب الكبيرة التائب (التزاماً بالوعيد)",
      "القرآن مخلوق — أزمة الخلق في عهد المأمون والمعتصم",
    ],
    keyBooks: [
      "المغني — القاضي عبد الجبار",
      "شرح الأصول الخمسة — القاضي عبد الجبار",
      "الكشاف — الزمخشري (في التفسير)",
    ],
    keyScholars: ["النظام", "الجاحظ", "الزمخشري", "القاضي عبد الجبار"],
    status: "تاريخية",
    spread: "انقرضت كفرقة منظمة في القرن السادس الهجري مع انتشار الأشعرية والماتريدية",
    quote: "الإنسان بطبيعته يعرف الحسن والقبح عقلاً — واصل بن عطاء",
  },
  {
    id: "murjia",
    name: "المرجئة",
    fullName: "المرجئة (أهل الإرجاء)",
    icon: "⏸️",
    category: "فرقة تاريخية",
    era: "القرن الأول الهجري (ظهرت في الفتنة الأولى 36-41 هـ)",
    origin: "الكوفة / الشام",
    founder: "نُسب إليهم الذرع بالإرجاء في أهل الكبائر والتوقف في الصحابة",
    foundingCause: "التوقف عن الحكم على أصحاب الكبائر وإرجاء أمرهم إلى الله",
    keyBeliefs: [
      "الإيمان هو المعرفة والتصديق القلبي فحسب، والعمل ليس ركناً فيه",
      "لا يضر مع الإيمان ذنب، ولا ينفع مع الكفر طاعة",
      "التوقف عن الحكم على مرتكب الكبيرة بنار أو بجنة",
    ],
    keyBooks: [],
    keyScholars: ["جهم بن صفوان (غلا حتى أنكر الصفات)", "الحسن بن محمد ابن الحنفية"],
    status: "تاريخية",
    spread: "انقرضت كفرقة مستقلة، وبعض مقولاتها يُحذَّر منها في كتب العقيدة",
  },
  {
    id: "jahmiyya",
    name: "الجهمية",
    fullName: "الجهمية — أتباع جهم بن صفوان",
    icon: "🚫",
    category: "فرقة تاريخية",
    era: "القرن الثاني الهجري (ت. جهم 128 هـ)",
    origin: "ترمذ / خراسان",
    founder: "جهم بن صفوان (ت. 128 هـ)",
    foundingCause: "إفراط في التنزيه أفضى إلى تعطيل الصفات الإلهية ونفيها كلياً",
    keyBeliefs: [
      "نفي جميع صفات الله تعالى تنزيهاً مطلقاً",
      "الإيمان مجرد المعرفة القلبية",
      "الجنة والنار تفنيان بعد دخول أهلهما",
      "الجبر المحض: لا قدرة للعبد أصلاً",
    ],
    keyBooks: [],
    keyScholars: [],
    status: "تاريخية",
    spread: "انقرضت ورُدَّ عليها في كتب العقيدة السنية كالرد على الجهمية للإمام أحمد",
  },
  {
    id: "sufiyya",
    name: "التصوف الإسلامي",
    fullName: "التصوف الإسلامي — الطريقة الصوفية",
    icon: "🌹",
    category: "مدرسة سنية",
    era: "القرن الثاني الهجري (أوائل الزهاد)",
    origin: "البصرة / بغداد / خراسان",
    founder: "نشأ من الزهاد الأوائل كالحسن البصري والفضيل بن عياض",
    foundingCause: "التركيز على الجانب الروحي والتزكوي في الإسلام والزهد في الدنيا",
    keyBeliefs: [
      "التسليك الروحي والتزكية عبر ذكر الله وورد منتظم",
      "التربية على يد شيخ مرشد",
      "الطرق الصوفية (القادرية، النقشبندية، الشاذلية...)",
      "الخلاف في بعض ممارساتهم: المقبول منها الزهد والذكر والمردود الغلو والبدع",
    ],
    keyBooks: [
      "الرسالة القشيرية — القشيري",
      "إحياء علوم الدين — الغزالي",
      "مدارج السالكين — ابن القيم (نقدي توجيهي)",
    ],
    keyScholars: ["الجنيد البغدادي", "الحارث المحاسبي", "ابن عطاء الله السكندري"],
    status: "قائمة",
    spread: "منتشرة في إفريقيا والشام وتركيا والمغرب والهند",
    quote: "التصوف بناؤه على ثلاثة أشياء: التمسك بفقر الله، والإشارة بلسان الاضطرار، وإسقاط التدبير — الجنيد البغدادي",
  },
];

const CATEGORIES = ["الكل", "مدرسة سنية", "شيعة", "مدرسة عقدية", "فرقة مستقلة", "فرقة تاريخية"];
const STATUS_FILTER = ["الكل", "قائمة", "تاريخية"];

const CATEGORY_COLOR: Record<string, string> = {
  "مدرسة سنية": "#1F4D3A",
  "شيعة": "#2D5A8E",
  "مدرسة عقدية": "#4A6741",
  "فرقة مستقلة": "#7B5E3A",
  "فرقة تاريخية": "#666",
};

export default function IslamicSectsPage() {
  const [category, setCategory] = useState("الكل");
  const [statusF, setStatusF] = useState("الكل");
  const [selected, setSelected] = useState<Sect | null>(null);

  useEffect(() => {
    applyPageSeo({
      path: "/islamic-sects",
      title: "الفرق الإسلامية — نشأتها وعقائدها | مجالس",
      description: "موسوعة علمية تاريخية في الفرق والمذاهب الإسلامية: نشأة كل فرقة وأصولها العقدية وأبرز علمائها وكتبها وانتشارها",
      keywords: ["فرق إسلامية", "مذاهب", "أهل السنة", "الشيعة", "المعتزلة", "الخوارج", "تاريخ الإسلام"],
    });
  }, []);

  const filtered = SECTS.filter((s) => {
    const catOk = category === "الكل" || s.category === category;
    const stOk = statusF === "الكل" || s.status === statusF;
    return catOk && stOk;
  });

  return (
    <div className="page-container" dir="rtl">
      {/* Hero */}
      <div
        className="page-hero"
        style={{ background: "linear-gradient(135deg, #1F4D3A 0%, #2d7a5a 100%)" }}
      >
        <div className="page-hero-content">
          <div className="page-hero-icon" style={{ fontSize: "3rem" }}>🕌</div>
          <h1 className="page-hero-title">الفرق الإسلامية</h1>
          <p className="page-hero-desc">
            موسوعة علمية تاريخية في الفرق والمذاهب الإسلامية — نشأتها وعقائدها وأبرز علمائها وكتبها
          </p>
          <div style={{ marginTop: "1rem", display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" }}>
            <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.4rem 1rem", borderRadius: "999px" }}>
              {SECTS.length} فرقة ومدرسة
            </span>
            <span className="badge" style={{ background: "rgba(255,255,255,0.2)", color: "#fff", padding: "0.4rem 1rem", borderRadius: "999px" }}>
              {SECTS.filter((s) => s.status === "قائمة").length} قائمة •{" "}
              {SECTS.filter((s) => s.status === "تاريخية").length} تاريخية
            </span>
          </div>
          <div style={{ marginTop: "1rem" }}>
            <ShareButtons title="الفرق الإسلامية — مجالس" />
          </div>
        </div>
      </div>

      {/* Notice */}
      <div
        style={{
          background: "#fff8e1",
          border: "1px solid #f0c040",
          borderRadius: "0.75rem",
          padding: "1rem 1.25rem",
          margin: "1.5rem auto",
          maxWidth: "760px",
          fontSize: "0.92rem",
          color: "#5a4300",
          lineHeight: "1.7",
        }}
      >
        <strong>ملاحظة منهجية:</strong> هذه الصفحة استعراض علمي تاريخي وفق ما دوّنه العلماء في كتب الملل والنحل والفرق، ولا تمثل فتوى شرعية. الحكم التفصيلي على الفرق يُرجع فيه إلى علماء أهل السنة المعتمدين.
      </div>

      {/* Filters */}
      <div style={{ maxWidth: "900px", margin: "0 auto 1.5rem", padding: "0 1rem" }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.75rem" }}>
          {CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              style={{
                padding: "0.4rem 0.9rem",
                borderRadius: "999px",
                border: "1px solid",
                fontSize: "0.85rem",
                cursor: "pointer",
                background: category === c ? "#1F4D3A" : "transparent",
                color: category === c ? "#fff" : "#1F4D3A",
                borderColor: "#1F4D3A",
                fontFamily: "inherit",
              }}
            >
              {c}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {STATUS_FILTER.map((s) => (
            <button
              key={s}
              onClick={() => setStatusF(s)}
              style={{
                padding: "0.35rem 0.8rem",
                borderRadius: "999px",
                border: "1px solid",
                fontSize: "0.82rem",
                cursor: "pointer",
                background: statusF === s ? "#2d7a5a" : "transparent",
                color: statusF === s ? "#fff" : "#2d7a5a",
                borderColor: "#2d7a5a",
                fontFamily: "inherit",
              }}
            >
              {s === "الكل" ? "الكل" : s === "قائمة" ? "✅ قائمة" : "📜 تاريخية"}
            </button>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 1rem 3rem",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
          gap: "1.25rem",
        }}
      >
        {filtered.map((sect) => (
          <div
            key={sect.id}
            onClick={() => setSelected(selected?.id === sect.id ? null : sect)}
            style={{
              background: "#fff",
              borderRadius: "1rem",
              padding: "1.25rem",
              boxShadow: selected?.id === sect.id ? "0 0 0 3px #1F4D3A" : "0 2px 8px rgba(0,0,0,0.08)",
              cursor: "pointer",
              transition: "box-shadow 0.2s, transform 0.15s",
              border: `2px solid ${selected?.id === sect.id ? "#1F4D3A" : "transparent"}`,
            }}
          >
            {/* Header */}
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
              <span style={{ fontSize: "2rem" }}>{sect.icon}</span>
              <div>
                <div style={{ fontWeight: "700", fontSize: "1rem", color: "#1F4D3A" }}>{sect.name}</div>
                <div style={{ fontSize: "0.78rem", color: "#888" }}>{sect.era}</div>
              </div>
            </div>

            {/* Category badge */}
            <span
              style={{
                display: "inline-block",
                fontSize: "0.75rem",
                padding: "0.2rem 0.7rem",
                borderRadius: "999px",
                background: CATEGORY_COLOR[sect.category] + "20",
                color: CATEGORY_COLOR[sect.category],
                border: `1px solid ${CATEGORY_COLOR[sect.category]}40`,
                marginBottom: "0.65rem",
              }}
            >
              {sect.category}
            </span>

            <div style={{ fontSize: "0.83rem", color: "#555", lineHeight: "1.6", marginBottom: "0.75rem" }}>
              {sect.foundingCause}
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span
                style={{
                  fontSize: "0.75rem",
                  padding: "0.2rem 0.6rem",
                  borderRadius: "999px",
                  background: sect.status === "قائمة" ? "#e8f5e9" : "#f5f5f5",
                  color: sect.status === "قائمة" ? "#1F4D3A" : "#888",
                  fontWeight: "600",
                }}
              >
                {sect.status === "قائمة" ? "✅ قائمة" : "📜 تاريخية"}
              </span>
              <span style={{ fontSize: "0.75rem", color: "#1F4D3A" }}>
                {selected?.id === sect.id ? "▲ إغلاق" : "▼ التفاصيل"}
              </span>
            </div>

            {/* Expanded detail */}
            {selected?.id === sect.id && (
              <div
                style={{
                  marginTop: "1rem",
                  borderTop: "1px solid #e5e5e5",
                  paddingTop: "1rem",
                }}
              >
                <div style={{ fontSize: "0.82rem", color: "#444", lineHeight: "1.8" }}>
                  <p><strong>الاسم الكامل:</strong> {sect.fullName}</p>
                  <p><strong>المؤسس:</strong> {sect.founder}</p>
                  <p><strong>المنشأ:</strong> {sect.origin}</p>
                  {sect.spread && <p><strong>الانتشار:</strong> {sect.spread}</p>}

                  <div style={{ marginTop: "0.75rem" }}>
                    <strong>أبرز المعتقدات:</strong>
                    <ul style={{ paddingRight: "1.2rem", marginTop: "0.4rem" }}>
                      {sect.keyBeliefs.map((b, i) => (
                        <li key={i} style={{ marginBottom: "0.25rem" }}>{b}</li>
                      ))}
                    </ul>
                  </div>

                  {sect.keyBooks.length > 0 && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <strong>أبرز الكتب:</strong>
                      <ul style={{ paddingRight: "1.2rem", marginTop: "0.4rem" }}>
                        {sect.keyBooks.map((b, i) => (
                          <li key={i} style={{ marginBottom: "0.2rem" }}>{b}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {sect.keyScholars.length > 0 && (
                    <div style={{ marginTop: "0.75rem" }}>
                      <strong>أبرز العلماء:</strong>{" "}
                      <span style={{ color: "#555" }}>{sect.keyScholars.join("، ")}</span>
                    </div>
                  )}

                  {sect.quote && (
                    <blockquote
                      style={{
                        marginTop: "0.9rem",
                        borderRight: "3px solid #1F4D3A",
                        paddingRight: "0.75rem",
                        color: "#444",
                        fontStyle: "italic",
                        lineHeight: "1.7",
                      }}
                    >
                      {sect.quote}
                    </blockquote>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
