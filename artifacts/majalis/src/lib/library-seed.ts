/**
 * مكتبة علمية — كتب ومراجع موثقة
 */
export type LibrarySeedItem = {
  id: string;
  title: string;
  type: string;
  category: string;
  description: string;
  external_url?: string;
  status?: "approved";
};

export const LIBRARY_SEED: LibrarySeedItem[] = [
  { id: "lib-001", title: "صحيح البخاري", type: "كتاب", category: "حديث", description: "أصح كتاب بعد القرآن؛ جمع أحاديث النبي ﷺ بأعلى معايير الجرح والتعديل.", external_url: "https://sunnah.com/bukhari", status: "approved" },
  { id: "lib-002", title: "صحيح مسلم", type: "كتاب", category: "حديث", description: "ثاني أصح كتب الحديث؛ مرتب حسب الأبواب الفقهية.", external_url: "https://sunnah.com/muslim", status: "approved" },
  { id: "lib-003", title: "تفسير ابن كثير", type: "كتاب", category: "تفسير", description: "تفسير بالمأثور؛ يعتمد على الآيات والأحاديث الصحيحة.", status: "approved" },
  { id: "lib-004", title: "رياض الصالحين", type: "كتاب", category: "حديث", description: "مختارات من الأحاديث في الأخلاق والآداب.", status: "approved" },
  { id: "lib-005", title: "السيرة النبوية — ابن هشام", type: "كتاب", category: "سيرة", description: "من أشهر كتب السيرة؛ اعتمد على سيرة ابن إسحاق.", status: "approved" },
  { id: "lib-006", title: "بلوغ المرام", type: "كتاب", category: "حديث", description: "جمع أحاديث الأحكام مع بيان درجة كل حديث.", status: "approved" },
  { id: "lib-007", title: "المنتقى — ابن الجوزي", type: "كتاب", category: "فقه", description: "مختصر في الفقه الحنبلي.", status: "approved" },
  { id: "lib-008", title: "زاد المعاد", type: "كتاب", category: "سيرة", description: "طب النبوي في السيرة والفقه والآداب.", status: "approved" },
  { id: "lib-009", title: "العقيدة الواسطية", type: "كتاب", category: "عقيدة", description: "عقيدة أهل السنة والجماعة باختصار ووضوح.", status: "approved" },
  { id: "lib-010", title: "حصن المسلم", type: "كتاب", category: "أذكار", description: "جمع أذكار النبي ﷺ من الكتاب والسنة.", status: "approved" },
  { id: "lib-011", title: "الأذكار — النووي", type: "كتاب", category: "أذكار", description: "موسوعة الأذكار والأدعية المأثورة.", status: "approved" },
  { id: "lib-012", title: "فقه السنة", type: "كتاب", category: "فقه", description: "فقه مقارن مبسّط للعبادات والمعاملات.", status: "approved" },
  { id: "lib-013", title: "الموطأ — مالك", type: "كتاب", category: "حديث", description: "أقدم كتاب حديث وصل إلينا؛ رواية مالك.", status: "approved" },
  { id: "lib-014", title: "جامع العلوم والحكم", type: "كتاب", category: "حديث", description: "شرح الأربعين النووية مع فوائد عقدية وفقهية.", status: "approved" },
  { id: "lib-015", title: "اللؤلؤ والمرجان", type: "كتاب", category: "حديث", description: "متفق عليه من البخاري ومسلم.", status: "approved" },
  { id: "lib-016", title: "العقيدة الطحاوية — شرح مختصر", type: "ملخص", category: "عقيدة", description: "ملخص منظم لأهم مسائل العقيدة في متن الطحاوية.", status: "approved" },
  { id: "lib-017", title: "متن الآجرومية", type: "متن", category: "لغة", description: "متن كلاسيكي في النحو العربي مع شرح مبسّط.", status: "approved" },
  { id: "lib-018", title: "تفريغ: أصول طلب العلم", type: "تفريغ", category: "تأصيل", description: "تفريغ درس علمي عن آداب طلب العلم ومراتبه.", status: "approved" },
];
