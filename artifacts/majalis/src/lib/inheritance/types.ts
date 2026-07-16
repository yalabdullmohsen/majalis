/**
 * أنواع بيانات محرك المواريث. هذا الملف بلا أي اعتماد على React أو DOM — دوال
 * ونماذج بيانات نقية فقط، قابلة للاستخدام من أي طبقة (واجهة، اختبارات، سكربتات).
 */
import type { Fraction } from "./fraction";

/** مفاتيح الورثة المُغطّاة صراحةً بمنطق كامل (فروض + تعصيب + حجب). */
export type HeirKey =
  | "husband"
  | "wife"
  | "father"
  | "mother"
  | "paternalGrandfather"
  | "paternalGrandmother"
  | "maternalGrandmother"
  | "sons"
  | "daughters"
  | "sonsOfSon"
  | "daughtersOfSon"
  | "fullBrothers"
  | "fullSisters"
  | "paternalBrothers"
  | "paternalSisters"
  | "maternalBrothers"
  | "maternalSisters";

/** عدد كل صنف وارث. الأزواج تُعامَل كعدد (1 لزوج، حتى 4 لزوجات). البقية أعداد. */
export type HeirsInput = Partial<Record<HeirKey, number>>;

export type Gender = "male" | "female";

export type DeceasedInfo = {
  gender: Gender;
  /** هل كان متزوجًا وقت الوفاة (يُحدِّد أهلية وارث الزوج/الزوجة) */
  wasMarried: boolean;
};

export type Asset = {
  id: string;
  label: string;
  /** قيمة الأصل بعملة موحّدة بعد التحويل (تُدار في طبقة العرض) */
  value: number;
};

export type EstateInput = {
  assets: Asset[];
  debts: number;
  /** مؤن التجهيز (تكفين ودفن) — تُخصَم أولاً قبل الديون */
  funeralCosts: number;
  /** الوصية (قبل تطبيق حد الثلث) */
  bequest: number;
  /** هل أجاز الورثة وصية تتجاوز الثلث أو لوارث؟ */
  bequestApprovedByHeirs: boolean;
};

/** نقاط الخلاف الفقهي المشهورة القابلة للإعداد — المنهج الافتراضي هو قول الجمهور. */
export type FiqhConfig = {
  /**
   * الجد مع الإخوة الأشقاء/لأب: يُعامَل الجد كأخ (مقاسمة) وفق قول أكثر الصحابة
   * والأئمة الأربعة تقريبًا (خيار "muqasama" الافتراضي)، أو يُسقِط الجد
   * الإخوة كليًا وفق قول أبي بكر وابن عباس وهو مذهب أبي حنيفة (خيار "grandfatherExcludes").
   */
  grandfatherWithSiblings: "muqasama" | "grandfatherExcludes";
  /** الرد على أحد الزوجين: الجمهور لا يردّون على الزوجين (افتراضي)؛ بعض المتأخرين يُجيزونه. */
  raddToSpouse: boolean;
  /** مذهب الشركة/المشرَّكة (الحمارية): الجمهور يُشرِّكون الإخوة لأم مع الأشقاء في الثلث. */
  mushtarakaShareWithMaternalSiblings: boolean;
};

export const DEFAULT_FIQH_CONFIG: FiqhConfig = {
  grandfatherWithSiblings: "muqasama",
  raddToSpouse: false,
  mushtarakaShareWithMaternalSiblings: true,
};

export type ShareBasis = "fixed" | "asaba" | "asaba-with-daughters" | "radd" | "dhawil-arham";

export type HeirShareResult = {
  heir: HeirKey;
  count: number;
  /** الأفراد المُستبعَدون بالحجب لا يظهرون هنا إطلاقًا؛ بل في hajbLog */
  basis: ShareBasis;
  /** كسر السهم الإجمالي لهذا الصنف (لكل الأفراد فيه مجتمعين) */
  totalShare: Fraction;
  /** كسر نصيب الفرد الواحد (totalShare / count) */
  perPersonShare: Fraction;
  /** سبب الاستحقاق (نص عربي) */
  reason: string;
};

export type HajbEntry = {
  heir: HeirKey;
  /** حجب حرمان (كامل) أو نقصان (من فرض أعلى لأدنى) */
  type: "hirman" | "nuqsan";
  reason: string;
  excludedBy: HeirKey[];
};

export type CalculationStep = {
  title: string;
  detail: string;
};

export type InheritanceResult = {
  /** أصل المسألة قبل العول/التصحيح */
  originalBase: bigint;
  /** أصل المسألة بعد العول إن وقع (نفس originalBase إن لم يقع عول) */
  awlBase: bigint | null;
  /** هل وقع رد؟ (نصيب أصحاب الفروض أقل من الأصل ولا عصبة) */
  radd: boolean;
  shares: HeirShareResult[];
  hajbLog: HajbEntry[];
  steps: CalculationStep[];
  /** تحذيرات: لا عصبة ولا فروض كاملة، ذوو أرحام، حالات خاصة تحتاج مختصًا */
  warnings: string[];
  /** المبلغ الصافي القابل للتوزيع بعد التجهيز والديون والوصية */
  netEstate: Fraction;
};

export type SpecialCaseFlag =
  | "pregnancy" // حمل
  | "khuntha" // خنثى مشكل
  | "missing" // مفقود
  | "simultaneous-death" // غرقى وهدمى
  | "munasakhat"; // مناسخات

export class InheritanceInputError extends Error {}
