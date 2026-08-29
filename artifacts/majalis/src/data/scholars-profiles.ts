/**
 * صفحات علماء أساسية على /scholars/:slug — محتوى موجز موثّق للعرض والفهرسة.
 * لا يُخلط بمذاهب أو كتب مختصرة (كالأربعين) بدل صفحة العالِم.
 */

export type ScholarProfile = {
  slug: string;
  name: string;
  fullName: string;
  born?: string;
  died: string;
  era: string;
  specialty: string[];
  summary: string;
  methodology?: string;
  works: { title: string; note?: string; href?: string }[];
  sources: string[];
  related: { href: string; label: string }[];
  faq: { q: string; a: string }[];
  aliases?: string[];
};

export const SCHOLAR_PROFILES: ScholarProfile[] = [
  {
    slug: "malik",
    name: "الإمام مالك",
    fullName: "مالك بن أنس بن مالك الأصبحي المدني",
    born: "93 هـ",
    died: "179 هـ",
    era: "التابعون / أتباع التابعين",
    specialty: ["فقه", "حديث", "إمام دار الهجرة"],
    summary:
      "إمام دار الهجرة وصاحب المذهب المالكي. نشأ في المدينة المنورة، وأخذ عن كبار التابعين، واشتهر بعلمه بالسنن وعمل أهل المدينة. روى عنه خلق كثير، ومن أشهر تلاميذه الشافعي.",
    methodology:
      "يقدّم القرآن ثم السنة ثم عمل أهل المدينة وإجماع الصحابة، مع القياس والمصلحة المرسلة وسدّ الذرائع عند الحاجة.",
    works: [
      { title: "الموطأ", note: "من أقدم كتب الحديث الجامعة للأحكام", href: "/hadith" },
    ],
    sources: [
      "الذهبي، سير أعلام النبلاء",
      "ابن عبد البر، الانتقاء في فضائل الأئمة الثلاثة الفقهاء",
      "عياض، ترتيب المدارك",
    ],
    related: [
      { href: "/madhahib", label: "المذاهب الفقهية" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
    ],
    faq: [
      {
        q: "هل صفحة الإمام مالك هي صفحة المذهب المالكي؟",
        a: "لا. هذه ترجمة موجزة للإمام نفسه؛ المذهب المالكي مفصّل في صفحة المذاهب.",
      },
      {
        q: "ما أشهر كتبه؟",
        a: "الموطأ، وهو جامع لأحاديث وأقضية أهل المدينة مع اختياراته الفقهية.",
      },
    ],
    aliases: ["imam-malik"],
  },
  {
    slug: "nawawi",
    name: "الإمام النووي",
    fullName: "يحيى بن شرف النووي الدمشقي",
    born: "631 هـ",
    died: "676 هـ",
    era: "المماليك",
    specialty: ["فقه شافعي", "حديث", "زهد"],
    summary:
      "من كبار فقهاء الشافعية ومحدّثي الشام. اشتهر بالعلم والعمل والزهد، وخدم الصحيحين والأربعين ورياض الصالحين، وشرح مسلم شرحًا معتمدًا.",
    methodology:
      "يجمع بين الرواية والدراية، ويحرّر المذهب الشافعي مع الاعتماد على الدليل والتخريج.",
    works: [
      { title: "الأربعون النووية", note: "مختصر تعليمي في جوامع الكلم", href: "/arbaeen-nawawi" },
      { title: "رياض الصالحين", href: "/hadith" },
      { title: "شرح صحيح مسلم (المنهاج)" },
      { title: "المجموع شرح المهذّب" },
    ],
    sources: [
      "الذهبي، تذكرة الحفاظ",
      "السبكي، طبقات الشافعية الكبرى",
      "السخاوي، المنهل العذب الروي",
    ],
    related: [
      { href: "/arbaeen-nawawi", label: "الأربعون النووية" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
      { href: "/madhahib", label: "المذاهب الفقهية" },
    ],
    faq: [
      {
        q: "هل /scholars/nawawi هي الأربعون النووية؟",
        a: "لا. هذه صفحة الإمام النووي؛ الأربعون النووية كتاب من كتبه وله مسار مستقل.",
      },
      {
        q: "ما أشهر شروحه؟",
        a: "شرح صحيح مسلم المسمّى المنهاج، وهو من المعتمد في شرح مسلم.",
      },
    ],
    aliases: ["al-nawawi", "imam-nawawi"],
  },
  {
    slug: "abu-hanifa",
    name: "أبو حنيفة",
    fullName: "النعمان بن ثابت الكوفي",
    born: "80 هـ",
    died: "150 هـ",
    era: "التابعون",
    specialty: ["فقه", "رأي وقياس", "مؤسس المذهب الحنفي"],
    summary:
      "إمام أهل الرأي في الكوفة وصاحب المذهب الحنفي. عُرف بالدقة في المسائل والفروع، وبتلامذته كأبي يوسف ومحمد بن الحسن.",
    works: [{ title: "الفقه الأكبر (منسوب)", note: "في العقيدة على اختلاف في النسبة" }],
    sources: ["الخطيب البغدادي، تاريخ بغداد", "الموفّق المكي، مناقب أبي حنيفة"],
    related: [
      { href: "/madhahib", label: "المذاهب الفقهية" },
      { href: "/fiqh", label: "الفقه والأحكام" },
    ],
    faq: [
      {
        q: "أين أقرأ المذهب الحنفي؟",
        a: "في صفحة المذاهب الفقهية ضمن سُنّة، مع مصادر المذهب وكتبه.",
      },
    ],
    aliases: ["hanafi", "imam-abu-hanifa"],
  },
  {
    slug: "shafii",
    name: "الإمام الشافعي",
    fullName: "محمد بن إدريس الشافعي المطلبي",
    born: "150 هـ",
    died: "204 هـ",
    era: "أتباع التابعين",
    specialty: ["أصول فقه", "حديث", "مؤسس المذهب الشافعي"],
    summary:
      "جامع بين مدرسة الحديث والرأي، وصاحب الرسالة في أصول الفقه. أخذ عن مالك، وناظر أهل الرأي، وأسّس مذهبًا متوازنًا بين النص والقياس.",
    works: [
      { title: "الرسالة" },
      { title: "الأم" },
    ],
    sources: ["البيهقي، مناقب الشافعي", "ابن أبي حاتم، آداب الشافعي"],
    related: [
      { href: "/madhahib", label: "المذاهب الفقهية" },
      { href: "/fiqh", label: "الفقه والأحكام" },
    ],
    faq: [
      {
        q: "هل صفحة الشافعي هي صفحة المذهب؟",
        a: "لا؛ هذه ترجمته، والمذهب الشافعي في صفحة المذاهب.",
      },
    ],
    aliases: ["shafi", "al-shafi", "al-shafii", "imam-shafi", "imam-shafii"],
  },
  {
    slug: "ahmad",
    name: "أحمد بن حنبل",
    fullName: "أحمد بن محمد بن حنبل الشيباني",
    born: "164 هـ",
    died: "241 هـ",
    era: "أتباع التابعين",
    specialty: ["حديث", "عقيدة", "مؤسس المذهب الحنبلي"],
    summary:
      "إمام أهل السنة في عصره، وصاحب المسند. عُرف بالثبات في المحنة، وبالاتباع الشديد للأثر، وإليه يُنسب المذهب الحنبلي.",
    works: [{ title: "المسند" }, { title: "الزهد" }],
    sources: ["ابن الجوزي، مناقب الإمام أحمد", "الذهبي، سير أعلام النبلاء"],
    related: [
      { href: "/madhahib", label: "المذاهب الفقهية" },
      { href: "/hadith", label: "الحديث وعلومه" },
    ],
    faq: [
      {
        q: "ما أشهر كتبه؟",
        a: "المسند، وهو من أكبر المسانيد الجامعة لرواياته عن الصحابة.",
      },
    ],
    aliases: ["ahmad-ibn-hanbal", "hanbali", "imam-ahmad"],
  },
  {
    slug: "bukhari",
    name: "الإمام البخاري",
    fullName: "محمد بن إسماعيل البخاري",
    born: "194 هـ",
    died: "256 هـ",
    era: "العصر العباسي",
    specialty: ["حديث", "علل", "صحيح البخاري"],
    summary:
      "أمير المؤمنين في الحديث، وصاحب أصحّ كتاب بعد كتاب الله عند جمهور أهل السنة. انتقى صحيحه بشروط دقيقة في الاتصال والعدالة والضبط.",
    works: [{ title: "الجامع الصحيح", href: "/hadith/sahih" }, { title: "التاريخ الكبير" }],
    sources: ["الذهبي، سير أعلام النبلاء", "ابن حجر، هدي الساري"],
    related: [
      { href: "/hadith/sahih", label: "الأحاديث الصحيحة" },
      { href: "/hadith-science", label: "مصطلح الحديث" },
    ],
    faq: [
      {
        q: "لماذا يُقدَّم صحيح البخاري؟",
        a: "لشدة شرطه في الاتصال والعدالة والضبط، واتفاق الأمة على تلقيه بالقبول.",
      },
    ],
    aliases: ["al-bukhari", "imam-bukhari"],
  },
  {
    slug: "muslim",
    name: "الإمام مسلم",
    fullName: "مسلم بن الحجاج النيسابوري",
    born: "206 هـ",
    died: "261 هـ",
    era: "العصر العباسي",
    specialty: ["حديث", "صحيح مسلم"],
    summary:
      "صاحب الصحيح الثاني بعد البخاري. رتّب الأحاديث على الأبواب واهتم بجمع الطرق، وشرطه في الصحة قريب من شرط البخاري مع فروق معلومة عند أهل الفن.",
    works: [{ title: "الجامع الصحيح", href: "/hadith/sahih" }],
    sources: ["الذهبي، سير أعلام النبلاء", "النووي، شرح صحيح مسلم"],
    related: [
      { href: "/hadith/sahih", label: "الأحاديث الصحيحة" },
      { href: "/scholars/nawawi", label: "الإمام النووي" },
    ],
    faq: [
      {
        q: "ما الفرق بين صحيح البخاري وصحيح مسلم؟",
        a: "كلاهما صحيح؛ البخاري أشدّ شرطًا عند الجمهور، ومسلم أحسن ترتيبًا وجمعًا للطرق في مواضع.",
      },
    ],
    aliases: ["imam-muslim", "al-muslim"],
  },
  {
    slug: "ibn-taymiyyah",
    name: "ابن تيمية",
    fullName: "أحمد بن عبد الحليم ابن تيمية الحرّاني",
    born: "661 هـ",
    died: "728 هـ",
    era: "المماليك",
    specialty: ["عقيدة", "فقه", "ردود"],
    summary:
      "شيخ الإسلام، عالم موسوعي في التفسير والحديث والفقه والعقيدة. عُرف بنصرة الدليل ونقد البدع، وله مؤلفات واسعة التأثير.",
    works: [{ title: "درء تعارض العقل والنقل" }, { title: "منهاج السنة" }],
    sources: ["ابن عبد الهادي، العقود الدرية", "الذهبي، ذيل العبر"],
    related: [
      { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
      { href: "/fiqh", label: "الفقه والأحكام" },
    ],
    faq: [
      {
        q: "هل له مذهب مستقل؟",
        a: "حنبلي المذهب في الجملة، مع اجتهادات خاصة يُرجع فيها إلى كتبه وتحقيق أهل العلم.",
      },
    ],
    aliases: ["ibn-taymiya", "sheikh-ul-islam"],
  },
  {
    slug: "ibn-kathir",
    name: "ابن كثير",
    fullName: "إسماعيل بن عمر ابن كثير الدمشقي",
    born: "701 هـ",
    died: "774 هـ",
    era: "المماليك",
    specialty: ["تفسير", "تاريخ", "حديث"],
    summary:
      "تلميذ ابن تيمية، صاحب التفسير المشهور والبداية والنهاية. يجمع بين الرواية والدراية مع عناية بالحديث.",
    works: [
      { title: "تفسير القرآن العظيم", href: "/quran-hub" },
      { title: "البداية والنهاية", href: "/tarikh-islami" },
    ],
    sources: ["ابن حجر، الدرر الكامنة", "الذهبي، تذكرة الحفاظ"],
    related: [
      { href: "/quran-hub", label: "مركز القرآن" },
      { href: "/tarikh-islami", label: "التاريخ الإسلامي" },
    ],
    faq: [
      {
        q: "ما أشهر كتبه؟",
        a: "تفسيره والبداية والنهاية في التاريخ.",
      },
    ],
  },
];

const BY_SLUG = new Map(SCHOLAR_PROFILES.map((p) => [p.slug, p]));
const ALIAS_TO_SLUG = new Map<string, string>();
for (const p of SCHOLAR_PROFILES) {
  for (const a of p.aliases ?? []) ALIAS_TO_SLUG.set(a, p.slug);
}

/** معرّفات قديمة خاطئة أو مكررة — تُعامل كـ 410 Gone لا تحويلًا قريبًا. */
export const SCHOLAR_GONE_SLUGS = new Set([
  "ibn-al-qayyim-alt",
  "ibn-uthaymeen-older",
  "ibn-uthaymin-ext",
  "al-ghazali-junior",
  "amir-al-san'ani",
  "amir-al-san%27ani",
  "al-qurtubi-scholar",
  "ibn-mufli",
  "al-bayhaqi",
  "al-mubarakfuri-2",
  "al-izz-ibn-abdes-salam",
  "ibn-al-mubarak-senior",
  "al-haytami",
  "al-khatib-baghdadi",
  "al-mizzi-2",
  "ibn-juzayy-2",
  "ibn-al-salah",
  "ibn-abi-shayba",
  "fakhr-al-razi",
]);

export function resolveScholarSlug(raw?: string | null): {
  kind: "profile" | "alias" | "gone" | "missing";
  slug?: string;
  profile?: ScholarProfile;
} {
  if (!raw) return { kind: "missing" };
  const key = decodeURIComponent(String(raw).trim()).toLowerCase();
  if (SCHOLAR_GONE_SLUGS.has(key) || SCHOLAR_GONE_SLUGS.has(raw)) {
    return { kind: "gone", slug: key };
  }
  const alias = ALIAS_TO_SLUG.get(key);
  if (alias) return { kind: "alias", slug: alias, profile: BY_SLUG.get(alias) };
  const profile = BY_SLUG.get(key);
  if (profile) return { kind: "profile", slug: key, profile };
  return { kind: "missing", slug: key };
}

export function listScholarProfiles(): ScholarProfile[] {
  return SCHOLAR_PROFILES;
}
