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
      era: "قبل نوح",
      people: "بابل",
      generationsGap: 7,
      linkNote: "ذرية آدم — عدة أجيال",
      slug: "idris",
      children: [
        {
          id: "nuh",
          name: "نوح",
          era: "أطول الأنبياء دعوةً",
          people: "العراق القديم",
          isUlulAzm: true,
          generationsGap: 3,
          linkNote: "من ذرية إدريس أو آدم",
          slug: "nuh",
          children: [
            {
              id: "ibrahim",
              name: "إبراهيم",
              era: "خليل الله",
              people: "بابل وفلسطين والحجاز",
              isUlulAzm: true,
              generationsGap: 10,
              linkNote: "من ذرية سام بن نوح، عدة أجيال",
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
                  people: "فلسطين وكنعان",
                  slug: "ishaq",
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
                              people: "أرض حوران (الشام)",
                              slug: "ayyub",
                              children: [
                                {
                                  id: "dhul-kifl",
                                  name: "ذو الكفل",
                                  era: "نبي صابر",
                                  people: "الشام أو العراق",
                                  slug: "dhul-kifl",
                                },
                              ],
                            },
                            {
                              id: "dawud",
                              name: "داود",
                              era: "النبي الملك",
                              people: "فلسطين",
                              slug: "dawud",
                              generationsGap: 5,
                              children: [
                                {
                                  id: "sulaiman",
                                  name: "سليمان",
                                  era: "ملك الأنبياء",
                                  people: "فلسطين والشام",
                                  slug: "sulaiman",
                                },
                                {
                                  id: "zakariya",
                                  name: "زكريا",
                                  era: "كافل مريم",
                                  people: "فلسطين",
                                  slug: "zakariya",
                                  generationsGap: 15,
                                  children: [
                                    {
                                      id: "yahya",
                                      name: "يحيى",
                                      era: "شهيد الأنبياء",
                                      people: "فلسطين",
                                      slug: "yahya",
                                    },
                                    {
                                      id: "isa",
                                      name: "عيسى",
                                      era: "روح الله وكلمته",
                                      people: "فلسطين",
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
                              people: "فلسطين",
                              slug: "ilyas",
                              children: [
                                {
                                  id: "alyasa",
                                  name: "اليسع",
                                  era: "خليفة إلياس",
                                  people: "فلسطين",
                                  slug: "alyasa",
                                },
                              ],
                            },
                            {
                              id: "yunus",
                              name: "يونس",
                              era: "صاحب الحوت",
                              people: "نينوى (العراق)",
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
              era: "نبي سدوم",
              people: "الأردن وفلسطين",
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
              linkNote: "من ذرية سام بن نوح",
            },
            {
              id: "salih",
              name: "صالح",
              era: "نبي ثمود",
              people: "الحجر (شمال الحجاز)",
              slug: "salih",
              linkNote: "من ذرية سام بن نوح",
            },
          ],
        },
      ],
    },
    {
      id: "shuaib",
      name: "شعيب",
      era: "خطيب الأنبياء",
      people: "مدين (شمال الحجاز)",
      slug: "shuaib",
      isAncestor: true,
      linkNote: "من ذرية إبراهيم عبر مدين",
    },
  ],
};

/** الأنبياء الـ25 بالترتيب القرآني */
export const QURAN_PROPHETS_ORDER = [
  "adam","idris","nuh","hud","salih","ibrahim","lut","ismail",
  "ishaq","yaqub","yusuf","shuaib","musa","harun","dhul-kifl",
  "ayyub","dawud","sulaiman","ilyas","alyasa","yunus","zakariya",
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
