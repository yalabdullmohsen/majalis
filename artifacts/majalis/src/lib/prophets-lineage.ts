/**
 * شجرة نسب الأنبياء — بيانات تاريخية موثّقة
 * المصادر: البداية والنهاية (ابن كثير)، الكامل في التاريخ (ابن الأثير)
 * ⚠️ هذه بيانات تاريخية/أكاديمية لا نصوص دينية
 */

export interface LineageNode {
  id: string;
  name: string;
  /** عزير، ذو الكفل — نبي ليس من الـ25 المذكورين صراحةً */
  isAncestor?: boolean;
  /** العقبة الزمنية أو الترتيب */
  era?: string;
  /** الشعب أو المكان */
  people?: string;
  /** أبناء مباشرون في الشجرة */
  children?: LineageNode[];
  /** ملاحظة على الصلة بالسابق */
  linkNote?: string;
  /** عدد الأجيال المحذوفة بين هذا العقدة والسابقة (0 = مباشر) */
  generationsGap?: number;
  /** هل هو من أولي العزم الخمسة */
  isUlulAzm?: boolean;
  /** slug لصفحة تفاصيله */
  slug?: string;
  /** رمز الأيقونة في الشجرة */
  symbol?: string;
}

/**
 * الشجرة الكاملة من آدم إلى محمد ﷺ
 * مع الفروع الجانبية للأنبياء الـ25 المذكورين في القرآن الكريم
 */
export const PROPHETS_LINEAGE: LineageNode = {
  id: "adam",
  name: "آدم",
  era: "أول الخليقة",
  people: "الجنة ثم الأرض",
  isUlulAzm: false,
  slug: "adam",
  symbol: "👤",
  children: [
    {
      id: "idris",
      name: "إدريس",
      era: "يُذكر قبل نوح في سياق التاريخ دون ترتيب قطعي من الوحي",
      people: "يُذكر في بعض كتب التاريخ بلا ثبوت قطعي للمكان",
      generationsGap: 7,
      linkNote: "ذرية آدم — عدة أجيال؛ موضع قومه لم يُسمَّ في الوحي",
      slug: "idris",
      children: [
        {
          id: "nuh",
          name: "نوح",
          era: "أطول الأنبياء دعوةً",
          people: "يُذكر في كتب التاريخ (العراق أو ما حوله) بلا جزم من الوحي",
          isUlulAzm: true,
          generationsGap: 3,
          linkNote: "من ذرية إدريس أو آدم",
          slug: "nuh",
          children: [
            {
              id: "ibrahim",
              name: "إبراهيم",
              era: "خليل الله",
              people: "العراق القديم ثم الشام والحجاز (موضع النشأة يُذكر بلا جزم باسم «بابل»)",
              isUlulAzm: true,
              generationsGap: 10,
              linkNote: "يُذكر في كتب التاريخ أنه من ذرية سام بن نوح عبر أجيال — بلا نص قرآني يفصّل النسب",
              slug: "ibrahim",
              children: [
                {
                  id: "ismail",
                  name: "إسماعيل",
                  era: "بنى الكعبة مع أبيه",
                  people: "مكة المكرمة",
                  slug: "ismail",
                  linkNote: "ابن إبراهيم من هاجر",
                  children: [
                    {
                      id: "muhammad-lineage",
                      name: "النسب إلى محمد ﷺ",
                      era: "عدنان → معد → نزار → مضر → كنانة → قريش → هاشم",
                      isAncestor: true,
                      generationsGap: 40,
                      linkNote: "نحو 40 جيلاً موثقة",
                      children: [
                        {
                          id: "muhammad",
                          name: "محمد ﷺ",
                          era: "خاتم الأنبياء والمرسلين",
                          people: "مكة المكرمة",
                          isUlulAzm: true,
                          slug: "muhammad",
                          symbol: "☽",
                        },
                      ],
                    },
                  ],
                },
                {
                  id: "ishaq",
                  name: "إسحاق",
                  era: "النبي المبشَّر به",
                  people: "يُذكر في كتب التاريخ (بلاد الشام) بلا جزم من الوحي",
                  slug: "is-haq",
                  linkNote: "ابن إبراهيم من سارة",
                  children: [
                    {
                      id: "yaqub",
                      name: "يعقوب",
                      era: "إسرائيل",
                      people: "كنعان",
                      slug: "yaqub",
                      children: [
                        {
                          id: "yusuf",
                          name: "يوسف",
                          era: "عزيز مصر",
                          people: "مصر",
                          slug: "yusuf",
                        },
                        {
                          id: "bani-israel-branch",
                          name: "بنو إسرائيل",
                          isAncestor: true,
                          generationsGap: 3,
                          children: [
                            {
                              id: "musa",
                              name: "موسى",
                              era: "كليم الله",
                              people: "مصر وسيناء",
                              isUlulAzm: true,
                              slug: "musa",
                              children: [
                                {
                                  id: "harun",
                                  name: "هارون",
                                  era: "أخو موسى",
                                  people: "مصر وسيناء",
                                  slug: "harun",
                                },
                              ],
                            },
                            {
                              id: "ayyub",
                              name: "أيوب",
                              era: "الصابر الشاكر",
                              people: "يُذكر في بعض كتب التاريخ (حوران/الشام) بلا ثبوت قطعي",
                              slug: "ayyub",
                              children: [
                                {
                                  id: "dhul-kifl",
                                  name: "ذو الكفل",
                                  era: "غير محدد يقيناً",
                                  people: "الشام أو العراق (غير مؤكد)",
                                  slug: "dhul-kifl",
                                  linkNote: "ترتيبه هنا تقريبي حسب بعض كتب التاريخ، ولم يثبت زمنه أو نسبه بدقة؛ واختُلف أيضاً هل هو نبي أم رجل صالح.",
                                },
                              ],
                            },
                            {
                              id: "dawud",
                              name: "داود",
                              era: "النبي الملك",
                              people: "يُذكر مكان دعوته في كتب التاريخ (بلاد الشام) بلا جزم من الوحي",
                              slug: "dawud",
                              generationsGap: 5,
                              children: [
                                {
                                  id: "sulayman",
                                  name: "سليمان",
                                  era: "ملك الأنبياء",
                                  people: "غير محدد بنص صريح",
                                  slug: "sulayman",
                                },
                                {
                                  id: "zakariyya",
                                  name: "زكريا",
                                  era: "كافل مريم",
                                  people: "غير محدد بنص صريح",
                                  slug: "zakariyya",
                                  generationsGap: 15,
                                  children: [
                                    {
                                      id: "yahya",
                                      name: "يحيى",
                                      era: "نبي من الصالحين",
                                      people: "غير محدد بنص صريح",
                                      slug: "yahya",
                                    },
                                    {
                                      id: "isa",
                                      name: "عيسى",
                                      era: "عبد الله ورسوله — كلمة الله وروح منه",
                                      people: "غير محدد بنص صريح",
                                      isUlulAzm: true,
                                      slug: "isa",
                                      linkNote: "من ذرية داود عبر مريم ابنة عمران",
                                    },
                                  ],
                                },
                              ],
                            },
                            {
                              id: "ilyas",
                              name: "إلياس",
                              era: "نبي بني إسرائيل",
                              people: "يُذكر مكان دعوته في كتب التاريخ بلا جزم من الوحي",
                              slug: "ilyas",
                              children: [
                                {
                                  id: "al-yasa",
                                  name: "اليسع",
                                  era: "من أنبياء بني إسرائيل",
                                  people: "غير محدد بنص صحيح صريح",
                                  slug: "al-yasa",
                                  linkNote: "يُذكر في بعض كتب التفسير والتاريخ أنه خلف إلياس، ولم يثبت تفصيل ذلك بنص صحيح صريح.",
                                },
                              ],
                            },
                            {
                              id: "yunus",
                              name: "يونس",
                              era: "صاحب الحوت",
                              people: "قرية قوم يونس — لم تُعيَّن في الوحي",
                              slug: "yunus",
                            },
                          ],
                        },
                      ],
                    },
                  ],
                },
              ],
            },
            {
              id: "lut",
              name: "لوط",
              era: "نبي القرية الظالمة",
              people: "يُذكر موضع قومه في كتب التفسير والتاريخ بلا جزم قطعي من الوحي",
              slug: "lut",
              linkNote: "ابن أخي إبراهيم، معاصر له",
            },
            {
              id: "hud",
              name: "هود",
              era: "نبي عاد",
              people: "الأحقاف (جنوب الجزيرة)",
              slug: "hud",
              generationsGap: 5,
              linkNote: "يُذكر في كتب التاريخ من ذرية سام بن نوح — بلا نص قرآني يفصّل النسب",
            },
            {
              id: "salih",
              name: "صالح",
              era: "نبي ثمود",
              people: "الحجر (شمال الحجاز)",
              slug: "salih",
              linkNote: "يُذكر في كتب التاريخ من ذرية سام بن نوح — بلا نص قرآني يفصّل النسب",
            },
          ],
        },
      ],
    },
    {
      id: "shuayb",
      name: "شعيب",
      era: "خطيب الأنبياء",
      people: "مدين (شمال الحجاز)",
      slug: "shuayb",
      isAncestor: true,
      linkNote: "من ذرية إبراهيم عبر مدين",
    },
  ],
};

/** الأنبياء الـ25 بالترتيب القرآني (slugs رسمية) */
export const QURAN_PROPHETS_ORDER = [
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail",
  "is-haq","yaqub","yusuf","shuayb","musa","harun","dhul-kifl",
  "ayyub","dawud","sulayman","ilyas","al-yasa","yunus","zakariyya",
  "yahya","isa","muhammad",
];

/** البحث عن عقدة في الشجرة */
export function findNode(tree: LineageNode, id: string): LineageNode | null {
  if (tree.id === id) return tree;
  for (const child of tree.children ?? []) {
    const found = findNode(child, id);
    if (found) return found;
  }
  return null;
}
