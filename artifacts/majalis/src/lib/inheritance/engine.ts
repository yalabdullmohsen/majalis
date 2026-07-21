/**
 * محرك حساب المواريث الإسلامية — دوال نقية بلا أي اعتماد على واجهة أو DOM.
 *
 * المنهج: قول جمهور الفقهاء افتراضيًا (راجع FiqhConfig في types.ts لنقاط
 * الخلاف القابلة للإعداد). القواعد المُطبَّقة هنا تغطي فروضًا وتعصيبًا وحجبًا
 * وعولًا وردًّا بالكامل للورثة الأساسيين (الزوجين، الأصول: الأب والأم والأجداد
 * والجدات، الفروع: الأبناء وأبناء الابن، الحواشي: الإخوة بأصنافهم الثلاثة).
 *
 * ما لا يُغطّى بمنطق مُفصَّل: أبناء الإخوة والأعمام وبنوهم وبقية العصبات
 * البعيدة (عصبات الجهات الأبعد) — إذا انتهى توزيع البقية إليهم دون أن يوجد
 * وارث مُغطًّى هنا، يُصدر المحرك تحذيرًا صريحًا بدل افتراض توزيع قد يكون خاطئًا
 * (يوافق قاعدة "ذوو الأرحام" في القيود: إحالة صريحة لمختص لا تخمين).
 *
 * حالات: الحمل، الخنثى المشكل، المفقود، الغرقى والهدمى، المناسخات — لا تُحسَب
 * حسابًا تلقائيًا هنا؛ enforceSpecialCaseGuards ترفض المدخلات المُعلَّمة بها
 * وتُرجع تنبيهًا بإحالتها لمختص، كما يشترط القيد الصريح في الطلب.
 */
import { Fraction } from "./fraction";
import {
  DEFAULT_FIQH_CONFIG,
  InheritanceInputError,
  type CalculationStep,
  type FiqhConfig,
  type HajbEntry,
  type HeirKey,
  type HeirShareResult,
  type HeirsInput,
  type InheritanceResult,
} from "./types";

const ZERO = Fraction.zero();
const HALF = new Fraction(1n, 2n);
const THIRD = new Fraction(1n, 3n);
const TWO_THIRDS = new Fraction(2n, 3n);
const QUARTER = new Fraction(1n, 4n);
const EIGHTH = new Fraction(1n, 8n);
const SIXTH = new Fraction(1n, 6n);

const ALL_HEIR_KEYS: HeirKey[] = [
  "husband", "wife", "father", "mother",
  "paternalGrandfather", "paternalGrandmother", "maternalGrandmother",
  "sons", "daughters", "sonsOfSon", "daughtersOfSon",
  "fullBrothers", "fullSisters", "paternalBrothers", "paternalSisters",
  "maternalBrothers", "maternalSisters",
];

function normalizeHeirs(input: HeirsInput): Record<HeirKey, number> {
  const out = {} as Record<HeirKey, number>;
  for (const key of ALL_HEIR_KEYS) {
    const v = input[key] ?? 0;
    if (!Number.isInteger(v) || v < 0) {
      throw new InheritanceInputError(`عدد الورثة غير صالح للصنف "${key}": يجب أن يكون عددًا صحيحًا غير سالب`);
    }
    out[key] = v;
  }
  if (out.husband > 1) {
    throw new InheritanceInputError("لا يمكن أن يكون هناك أكثر من زوج واحد");
  }
  if (out.wife > 4) {
    throw new InheritanceInputError("لا يمكن أن يزيد عدد الزوجات عن 4");
  }
  if (out.husband > 0 && out.wife > 0) {
    throw new InheritanceInputError("لا يجتمع زوج وزوجة في مسألة واحدة (المتوفى إما ذكر وله زوجة/زوجات، أو أنثى ولها زوج)");
  }
  return out;
}

// ══════════════════════════════════════════════
// الحجب — Hajb
// ══════════════════════════════════════════════

function computeHajb(h: Record<HeirKey, number>): { excluded: Set<HeirKey>; log: HajbEntry[] } {
  const excluded = new Set<HeirKey>();
  const log: HajbEntry[] = [];

  const exclude = (heir: HeirKey, type: "hirman" | "nuqsan", reason: string, by: HeirKey[]) => {
    if (h[heir] <= 0) return;
    excluded.add(heir);
    log.push({ heir, type, reason, excludedBy: by });
  };

  const hasSon = h.sons > 0;
  const hasSonsOfSon = h.sonsOfSon > 0 && !excluded.has("sonsOfSon");
  const hasFather = h.father > 0;
  const hasMother = h.mother > 0;

  // أبناء الابن يُحجبون حرمانًا بوجود الابن
  if (hasSon) exclude("sonsOfSon", "hirman", "الابن يحجب ابن الابن حرمانًا", ["sons"]);
  if (hasSon) exclude("daughtersOfSon", "hirman", "الابن يحجب بنت الابن حرمانًا (لا فرض ولا تعصيب لها معه)", ["sons"]);

  // بنت الابن مع بنتين فأكثر ولا معصِّب من أبناء الابن → محجوبة حرمانًا
  if (!hasSon && h.daughters >= 2 && !hasSonsOfSon) {
    exclude("daughtersOfSon", "hirman", "بنتان فأكثر يحجبان بنت الابن حرمانًا إذا لم يوجد ابن ابن يُعصِّبها", ["daughters"]);
  }

  // الجد الصحيح يُحجب حرمانًا بوجود الأب
  if (hasFather) exclude("paternalGrandfather", "hirman", "الأب يحجب الجد حرمانًا", ["father"]);

  // الجدة لأب تُحجب بالأب وبالأم؛ الجدة لأم تُحجب بالأم فقط
  if (hasFather) exclude("paternalGrandmother", "hirman", "الأب يحجب الجدة لأب حرمانًا", ["father"]);
  if (hasMother) {
    exclude("paternalGrandmother", "hirman", "الأم تحجب الجدة لأب حرمانًا", ["mother"]);
    exclude("maternalGrandmother", "hirman", "الأم تحجب الجدة لأم حرمانًا", ["mother"]);
  }

  const childOrGrandchildPresent = hasSon || h.daughters > 0 || hasSonsOfSon || (h.daughtersOfSon > 0 && !excluded.has("daughtersOfSon"));

  // الإخوة الأشقاء يُحجبون بالأب والابن وابن الابن
  const fullSiblingExcluders: HeirKey[] = [];
  if (hasFather) fullSiblingExcluders.push("father");
  if (hasSon) fullSiblingExcluders.push("sons");
  if (hasSonsOfSon) fullSiblingExcluders.push("sonsOfSon");
  if (fullSiblingExcluders.length) {
    exclude("fullBrothers", "hirman", "يحجب الإخوة الأشقاء: " + fullSiblingExcluders.join("، "), fullSiblingExcluders);
    exclude("fullSisters", "hirman", "يحجب الأخوات الشقيقات: " + fullSiblingExcluders.join("، "), fullSiblingExcluders);
  }

  // الإخوة لأب: يُحجبون بما يحجب الأشقاء، وبوجود أخ شقيق (أي عدد)، وبأختين شقيقتين فأكثر
  const hasFullBrother = h.fullBrothers > 0 && !excluded.has("fullBrothers");
  const paternalSiblingExcluders = [...fullSiblingExcluders];
  if (hasFullBrother) paternalSiblingExcluders.push("fullBrothers");
  if (paternalSiblingExcluders.length) {
    exclude("paternalBrothers", "hirman", "يحجب الإخوة لأب: " + paternalSiblingExcluders.join("، "), paternalSiblingExcluders);
    exclude("paternalSisters", "hirman", "يحجب الأخوات لأب: " + paternalSiblingExcluders.join("، "), paternalSiblingExcluders);
  }

  // الإخوة والأخوات لأم: يُحجبون بالأصل الذكر (أب/جد) وبالفرع مطلقًا (ابن أو بنت أو فرعهم)
  const maternalSiblingExcluders: HeirKey[] = [];
  if (hasFather) maternalSiblingExcluders.push("father");
  if (h.paternalGrandfather > 0 && !excluded.has("paternalGrandfather")) maternalSiblingExcluders.push("paternalGrandfather");
  if (childOrGrandchildPresent) {
    if (hasSon) maternalSiblingExcluders.push("sons");
    if (h.daughters > 0) maternalSiblingExcluders.push("daughters");
    if (hasSonsOfSon) maternalSiblingExcluders.push("sonsOfSon");
    if (h.daughtersOfSon > 0 && !excluded.has("daughtersOfSon")) maternalSiblingExcluders.push("daughtersOfSon");
  }
  if (maternalSiblingExcluders.length) {
    exclude("maternalBrothers", "hirman", "يحجب الإخوة لأم: " + maternalSiblingExcluders.join("، "), maternalSiblingExcluders);
    exclude("maternalSisters", "hirman", "يحجب الأخوات لأم: " + maternalSiblingExcluders.join("، "), maternalSiblingExcluders);
  }

  return { excluded, log };
}

// ══════════════════════════════════════════════
// الفروض الأساسية (قبل التعصيب/العول/الرد)
// ══════════════════════════════════════════════

type FixedAssignment = { heir: HeirKey; count: number; totalShare: Fraction; reason: string };

function computeFixedShares(
  h: Record<HeirKey, number>,
  excluded: Set<HeirKey>,
  steps: CalculationStep[],
  config: FiqhConfig,
): { fixed: FixedAssignment[]; hasDescendant: boolean; hasResidueClaimant: boolean } {
  const fixed: FixedAssignment[] = [];
  const has = (k: HeirKey) => h[k] > 0 && !excluded.has(k);

  const hasSon = has("sons");
  const hasSonsOfSon = has("sonsOfSon");
  const hasDaughters = has("daughters");
  const hasDaughtersOfSon = has("daughtersOfSon");
  const hasDescendant = hasSon || hasSonsOfSon || hasDaughters || hasDaughtersOfSon;
  const numSiblingsForMotherRule =
    (has("fullBrothers") ? h.fullBrothers : 0) +
    (has("fullSisters") ? h.fullSisters : 0) +
    (has("paternalBrothers") ? h.paternalBrothers : 0) +
    (has("paternalSisters") ? h.paternalSisters : 0) +
    (has("maternalBrothers") ? h.maternalBrothers : 0) +
    (has("maternalSisters") ? h.maternalSisters : 0);

  // ── الزوج ──
  if (has("husband")) {
    const share = hasDescendant ? QUARTER : HALF;
    fixed.push({ heir: "husband", count: 1, totalShare: share, reason: hasDescendant ? "الربع لوجود فرع وارث" : "النصف لعدم وجود فرع وارث" });
  }

  // ── الزوجة/الزوجات (الثمن أو الربع يُقسَّم بينهنّ بالتساوي) ──
  if (has("wife")) {
    const share = hasDescendant ? EIGHTH : QUARTER;
    fixed.push({ heir: "wife", count: h.wife, totalShare: share, reason: hasDescendant ? "الثمن لوجود فرع وارث، يُقسَّم بين الزوجات بالتساوي" : "الربع لعدم وجود فرع وارث، يُقسَّم بين الزوجات بالتساوي" });
  }

  // ── الأم: العمريتان (الغرّاوان) حالة خاصة تُعالَج لاحقًا في المحرك الرئيسي ──
  if (has("mother")) {
    const share = (hasDescendant || numSiblingsForMotherRule >= 2) ? SIXTH : THIRD;
    fixed.push({
      heir: "mother", count: 1, totalShare: share,
      reason: hasDescendant ? "السدس لوجود فرع وارث" : numSiblingsForMotherRule >= 2 ? "السدس لوجود اثنين فأكثر من الإخوة/الأخوات" : "الثلث لعدم وجود فرع وارث ولا اثنين من الإخوة",
    });
  }

  // ── الأب: سدس فرضًا مع وجود ابن أو ابن ابن (فرعٍ مذكَّر)، وسدس + الباقي (تعصيبًا)
  //     مع البنات فقط بلا ابن، وكل الباقي تعصيبًا بلا فرع وارث إطلاقًا ──
  if (has("father")) {
    if (hasSon || hasSonsOfSon) {
      fixed.push({ heir: "father", count: 1, totalShare: SIXTH, reason: "السدس فرضًا لوجود ابن أو ابن ابن" });
    } else if (hasDaughters || hasDaughtersOfSon) {
      fixed.push({ heir: "father", count: 1, totalShare: SIXTH, reason: "السدس فرضًا، ويأخذ الباقي تعصيبًا لوجود بنات بلا ابن" });
      // الباقي تعصيبًا يُضاف في مرحلة توزيع البقية
    }
    // بلا أي فرع وارث: الأب عصبة بالكامل — يُعالَج في مرحلة البقية
  }

  // ── الجد الصحيح (إن لم يُحجب بالأب): كالأب في السدس/التعصيب، ما لم يُخالطه إخوة (بحسب config) ──
  if (has("paternalGrandfather")) {
    const grandfatherActsAsResiduaryOnly = numSiblingsForMotherRule === 0
      || config.grandfatherWithSiblings === "grandfatherExcludes";
    if (hasSon || hasSonsOfSon) {
      fixed.push({ heir: "paternalGrandfather", count: 1, totalShare: SIXTH, reason: "السدس فرضًا لوجود ابن أو ابن ابن (الجد كالأب عند عدمه)" });
    } else if (hasDaughters || hasDaughtersOfSon) {
      fixed.push({ heir: "paternalGrandfather", count: 1, totalShare: SIXTH, reason: "السدس فرضًا، ويأخذ الباقي تعصيبًا لوجود بنات بلا ابن (الجد كالأب عند عدمه)" });
    } else if (!grandfatherActsAsResiduaryOnly) {
      // مقاسمة الإخوة — تُعالَج في منطق خاص أدناه (خارج جدول الفروض الثابتة)
    }
  }

  // ── الجدات: السدس يُقسَّم بينهنّ إذا اجتمعت أكثر من واحدة من نفس الدرجة ──
  const grandmothers: HeirKey[] = [];
  if (has("paternalGrandmother")) grandmothers.push("paternalGrandmother");
  if (has("maternalGrandmother")) grandmothers.push("maternalGrandmother");
  if (grandmothers.length === 1) {
    fixed.push({ heir: grandmothers[0], count: 1, totalShare: SIXTH, reason: "السدس فرضًا للجدة الوارثة" });
  } else if (grandmothers.length === 2) {
    for (const g of grandmothers) {
      fixed.push({ heir: g, count: 1, totalShare: SIXTH.div(new Fraction(2n)), reason: "السدس يُقسَّم بالتساوي بين الجدتين الوارثتين" });
    }
  }

  // ── البنات (بلا ابن): النصف لواحدة، الثلثان لاثنتين فأكثر ──
  if (hasDaughters && !hasSon) {
    fixed.push({
      heir: "daughters", count: h.daughters,
      totalShare: h.daughters === 1 ? HALF : TWO_THIRDS,
      reason: h.daughters === 1 ? "النصف لبنت واحدة بلا ابن" : "الثلثان لبنتين فأكثر بلا ابن",
    });
  }

  // ── بنات الابن (بلا ابن ولا بنات حقيقيات كافيات): تُكمِّل الثلثين أو تستقل بالنصف/الثلثين ──
  if (hasDaughtersOfSon && !hasSon && !hasSonsOfSon) {
    if (h.daughters === 0) {
      fixed.push({
        heir: "daughtersOfSon", count: h.daughtersOfSon,
        totalShare: h.daughtersOfSon === 1 ? HALF : TWO_THIRDS,
        reason: h.daughtersOfSon === 1 ? "النصف لبنت ابن واحدة بلا فرع أقرب" : "الثلثان لبنات ابن فأكثر بلا فرع أقرب",
      });
    } else if (h.daughters === 1) {
      fixed.push({ heir: "daughtersOfSon", count: h.daughtersOfSon, totalShare: SIXTH, reason: "السدس تكملةً للثلثين مع بنت واحدة" });
    }
    // إن كانت البنات الحقيقيات اثنتين فأكثر: بنات الابن محجوبات (عولجت في computeHajb)
  }

  // ── الإخوة والأخوات لأم (كلالة): السدس لواحد، الثلث يُقسَّم بالتساوي (لا للذكر مثل حظ الأنثيين) للاثنين فأكثر ──
  const maternalCount = (has("maternalBrothers") ? h.maternalBrothers : 0) + (has("maternalSisters") ? h.maternalSisters : 0);
  if (maternalCount === 1) {
    const heir: HeirKey = has("maternalBrothers") ? "maternalBrothers" : "maternalSisters";
    fixed.push({ heir, count: 1, totalShare: SIXTH, reason: "السدس فرضًا لولد الأم الواحد (ذكرًا كان أو أنثى، كلالة)" });
  } else if (maternalCount >= 2) {
    const b = has("maternalBrothers") ? h.maternalBrothers : 0;
    const s = has("maternalSisters") ? h.maternalSisters : 0;
    const total = b + s;
    if (b > 0) fixed.push({ heir: "maternalBrothers", count: b, totalShare: THIRD.mul(new Fraction(BigInt(b), BigInt(total))), reason: "الثلث يُقسَّم بالتساوي بين أولاد الأم (لا للذكر مثل حظ الأنثيين)" });
    if (s > 0) fixed.push({ heir: "maternalSisters", count: s, totalShare: THIRD.mul(new Fraction(BigInt(s), BigInt(total))), reason: "الثلث يُقسَّم بالتساوي بين أولاد الأم (لا للذكر مثل حظ الأنثيين)" });
  }

  // ── الأخوات الشقيقات (بلا إخوة أشقاء يُعصِّبونهنّ): كالبنات، النصف/الثلثان،
  //     أو عصبة مع البنات إن وُجدت بنات/بنات ابن وارثات ──
  const hasFullBrotherPresent = has("fullBrothers");
  if (has("fullSisters") && !hasFullBrotherPresent) {
    const hasFemaleDescendantFard = (hasDaughters || (hasDaughtersOfSon)) && !hasSon && !hasSonsOfSon;
    if (!hasFemaleDescendantFard) {
      fixed.push({
        heir: "fullSisters", count: h.fullSisters,
        totalShare: h.fullSisters === 1 ? HALF : TWO_THIRDS,
        reason: h.fullSisters === 1 ? "النصف لأخت شقيقة واحدة بلا معصِّب ولا فرع وارث مؤنَّث" : "الثلثان لأختين شقيقتين فأكثر بلا معصِّب ولا فرع وارث مؤنَّث",
      });
    }
    // مع وجود بنات/بنات ابن فقط (بلا ابن): الأخت الشقيقة "عصبة مع الغير" — تُعالَج في مرحلة البقية
  }

  // ── الأخوات لأب (بلا إخوة لأب يُعصِّبونهنّ، وبلا أشقاء): نفس منطق الشقيقات ──
  const hasPaternalBrotherPresent = has("paternalBrothers");
  if (has("paternalSisters") && !hasPaternalBrotherPresent) {
    const hasFemaleDescendantFard = (hasDaughters || hasDaughtersOfSon) && !hasSon && !hasSonsOfSon;
    const fullSistersTookTwoThirds = has("fullSisters") && !hasFullBrotherPresent && h.fullSisters >= 2 && !hasFemaleDescendantFard;
    if (!hasFemaleDescendantFard && !fullSistersTookTwoThirds && !(has("fullSisters") && h.fullSisters === 1 && !hasFullBrotherPresent)) {
      fixed.push({
        heir: "paternalSisters", count: h.paternalSisters,
        totalShare: h.paternalSisters === 1 ? HALF : TWO_THIRDS,
        reason: h.paternalSisters === 1 ? "النصف لأخت لأب واحدة بلا معصِّب" : "الثلثان لأختين لأب فأكثر بلا معصِّب",
      });
    } else if (has("fullSisters") && h.fullSisters === 1 && !hasFullBrotherPresent && !hasFemaleDescendantFard) {
      // أخت شقيقة واحدة أخذت النصف؛ الأخت لأب تكمل السدس (تكملة الثلثين)
      fixed.push({ heir: "paternalSisters", count: h.paternalSisters, totalShare: SIXTH, reason: "السدس تكملةً للثلثين مع أخت شقيقة واحدة آخذة للنصف" });
    }
    // وإلا: محجوبة أو عصبة مع الغير — تُعالَج حسب الحالة
  }

  const hasResidueClaimant =
    hasSon || hasSonsOfSon ||
    has("father") || (has("paternalGrandfather")) ||
    hasFullBrotherPresent || hasPaternalBrotherPresent ||
    (hasDaughters && !hasSon) || // عصبة بالغير محتملة (تُفعَّل لاحقًا بشرط وجود ذكر مساوٍ)
    false;

  return { fixed, hasDescendant, hasResidueClaimant };
}

// ══════════════════════════════════════════════
// المحرك الرئيسي
// ══════════════════════════════════════════════

export function calculateInheritance(
  heirsInput: HeirsInput,
  fiqhConfig: FiqhConfig = DEFAULT_FIQH_CONFIG,
): InheritanceResult {
  const h = normalizeHeirs(heirsInput);
  const totalHeirs = ALL_HEIR_KEYS.reduce((sum, k) => sum + h[k], 0);
  const steps: CalculationStep[] = [];
  const warnings: string[] = [];

  if (totalHeirs === 0) {
    warnings.push("لا يوجد أي وارث من الورثة المُدخَلين. إن لم يوجد صاحب فرض أو عصبة أو ذو رحم معروف، تؤول التركة لبيت المال — راجع مختصًا شرعيًا/قانونيًا.");
    return {
      originalBase: 1n, awlBase: null, radd: false, shares: [], hajbLog: [], steps, warnings,
      netEstate: ZERO,
    };
  }

  const { excluded, log: hajbLog } = computeHajb(h);
  steps.push({ title: "الحجب", detail: hajbLog.length ? `حُجب ${hajbLog.length} صنفًا من الورثة، راجع سجلّ الحجب للتفاصيل.` : "لا يوجد وارث محجوب في هذه المسألة." });

  const { fixed, hasDescendant } = computeFixedShares(h, excluded, steps, fiqhConfig);

  // ── العمريتان (الغرّاوان): زوج أو زوجة + أب + أم، ولا فرع وارث ولا إخوة ──
  const spouseKey: HeirKey | null = h.husband > 0 ? "husband" : h.wife > 0 ? "wife" : null;
  const numSiblingsPresent = ALL_HEIR_KEYS
    .filter((k) => k.toLowerCase().includes("brother") || k.toLowerCase().includes("sister"))
    .reduce((s, k) => s + (excluded.has(k) ? 0 : h[k]), 0);
  const isGharrawayn = spouseKey !== null && h.father > 0 && h.mother > 0 && !hasDescendant && numSiblingsPresent === 0;
  if (isGharrawayn) {
    const motherEntry = fixed.find((f) => f.heir === "mother");
    if (motherEntry) {
      const spouseShare = spouseKey === "husband" ? HALF : QUARTER;
      const remainder = new Fraction(1n).sub(spouseShare);
      motherEntry.totalShare = remainder.mul(THIRD);
      motherEntry.reason = "مسألة العمريتين (الغرّاوان): للأم ثلث الباقي بعد فرض الزوج/الزوجة، لا ثلث كل التركة";
      steps.push({ title: "حالة خاصة: العمريتان", detail: "زوج/زوجة + أب + أم بلا فرع وارث ولا إخوة — للأم ثلث ما يبقى بعد نصيب الزوجية، والباقي كله للأب." });
    }
  }

  // ── مقاسمة الجد مع الإخوة (إن لم يُحجب الجد ولم يوجد أب، ووُجد إخوة، ووفق config) ──
  if (h.paternalGrandfather > 0 && !excluded.has("paternalGrandfather") && h.father === 0) {
    const siblingCount =
      (excluded.has("fullBrothers") ? 0 : h.fullBrothers) +
      (excluded.has("fullSisters") ? 0 : h.fullSisters) +
      (excluded.has("paternalBrothers") ? 0 : h.paternalBrothers) +
      (excluded.has("paternalSisters") ? 0 : h.paternalSisters);
    if (siblingCount > 0 && fiqhConfig.grandfatherWithSiblings === "grandfatherExcludes") {
      // الجد يُسقِط الإخوة كليًا (مذهب أبي بكر/ابن عباس المُفعَّل عبر الإعداد)
      for (const k of ["fullBrothers", "fullSisters", "paternalBrothers", "paternalSisters"] as HeirKey[]) {
        excluded.add(k);
      }
      hajbLog.push({ heir: "fullBrothers", type: "hirman", reason: "الجدّ يُسقط الإخوة والأخوات (حسب الإعداد الفقهي المختار)", excludedBy: ["paternalGrandfather"] });
      steps.push({ title: "الجد مع الإخوة", detail: "بحسب الإعداد الفقهي الحالي، الجدّ يحجب جميع الإخوة والأخوات حجب حرمان (لا مقاسمة)." });
    } else if (siblingCount > 0) {
      steps.push({ title: "الجد مع الإخوة", detail: "الجد يقاسم الإخوة والأخوات الأشقاء/لأب (وفق قول الجمهور) — تُطبَّق المقاسمة ضمن توزيع الباقي." });
    }
  }

  // ── المشرَّكة (الحمارية): زوج + أم + إخوة/أخوات لأم (٢ فأكثر) + إخوة/أخوات
  //     أشقاء، بلا أب ولا جد ولا فرع وارث. حسابيًا: 1/2 + 1/6 + 1/3 = 1 بالضبط،
  //     فلا يبقى شيء للإخوة الأشقاء رغم كونهم أقوى عصبةً من إخوة الأم — وهي
  //     معضلة مشهورة. حكم الجمهور (الأثر عن عمر رضي الله عنه): يُشرَّك الإخوة
  //     الأشقاء مع إخوة الأم في الثلث نفسه بالتساوي للرأس (كأنهم جميعًا إخوة
  //     لأمّ)، بدل حرمانهم كليًا. يمكن تعطيل هذا عبر FiqhConfig. ──
  const maternalSiblingCountForMushtaraka =
    (h.maternalBrothers > 0 && !excluded.has("maternalBrothers") ? h.maternalBrothers : 0) +
    (h.maternalSisters > 0 && !excluded.has("maternalSisters") ? h.maternalSisters : 0);
  const fullSiblingCountForMushtaraka =
    (h.fullBrothers > 0 && !excluded.has("fullBrothers") ? h.fullBrothers : 0) +
    (h.fullSisters > 0 && !excluded.has("fullSisters") ? h.fullSisters : 0);
  const isMushtaraka =
    h.husband > 0 && h.father === 0 &&
    (h.paternalGrandfather === 0 || excluded.has("paternalGrandfather")) &&
    !hasDescendant &&
    h.mother > 0 && !excluded.has("mother") &&
    maternalSiblingCountForMushtaraka >= 2 &&
    fullSiblingCountForMushtaraka >= 1;

  if (isMushtaraka && fiqhConfig.mushtarakaShareWithMaternalSiblings) {
    const totalHeads = maternalSiblingCountForMushtaraka + fullSiblingCountForMushtaraka;
    // أزل الفروض المنفصلة لإخوة الأم من fixed، وأعِد توزيع الثلث على الجميع بالتساوي للرأس
    for (const key of ["maternalBrothers", "maternalSisters"] as HeirKey[]) {
      const idx = fixed.findIndex((f) => f.heir === key);
      if (idx >= 0) fixed.splice(idx, 1);
    }
    const perHead = THIRD.div(new Fraction(BigInt(totalHeads)));
    const pushShared = (key: HeirKey, count: number) => {
      if (count <= 0) return;
      fixed.push({
        heir: key, count,
        totalShare: perHead.mul(new Fraction(BigInt(count))),
        reason: "مسألة المشرَّكة (الحمارية): يُشرَّك مع إخوة الأم في الثلث بالتساوي للرأس (حكم الجمهور)",
      });
    };
    pushShared("maternalBrothers", h.maternalBrothers > 0 && !excluded.has("maternalBrothers") ? h.maternalBrothers : 0);
    pushShared("maternalSisters", h.maternalSisters > 0 && !excluded.has("maternalSisters") ? h.maternalSisters : 0);
    pushShared("fullBrothers", h.fullBrothers > 0 && !excluded.has("fullBrothers") ? h.fullBrothers : 0);
    pushShared("fullSisters", h.fullSisters > 0 && !excluded.has("fullSisters") ? h.fullSisters : 0);
    // أزل فرض الأخت الشقيقة المنفصل إن كان أُضيف سابقًا (استُبدل بنصيب المشرَّكة أعلاه)
    steps.push({ title: "حالة خاصة: المشرَّكة (الحمارية)", detail: "زوج + أم + إخوة لأم (٢ فأكثر) + إخوة أشقاء بلا أب ولا جد: يُشرَّك الإخوة الأشقاء مع إخوة الأم في ثلث التركة بالتساوي، بدل حرمانهم كليًا (حكم الجمهور، قابل للتعطيل في الإعداد الفقهي)." });
  } else if (isMushtaraka) {
    steps.push({ title: "حالة خاصة: المشرَّكة (الحمارية)", detail: "بحسب الإعداد الفقهي الحالي، لا يُشرَّك الإخوة الأشقاء مع إخوة الأم؛ يُطبَّق القياس المجرَّد (فلا يبقى للإخوة الأشقاء شيء في هذه الصورة تحديدًا)." });
  }

  // ── مجموع الفروض الثابتة ──
  let fixedSum = ZERO;
  for (const f of fixed) fixedSum = fixedSum.add(f.totalShare);

  // ── تحديد أصحاب البقية (التعصيب) ──
  const residuaryClaimants: { heir: HeirKey; count: number; weight: number }[] = [];
  const hasSon = h.sons > 0 && !excluded.has("sons");
  const hasSonsOfSon = h.sonsOfSon > 0 && !excluded.has("sonsOfSon");
  const hasDaughters = h.daughters > 0 && !excluded.has("daughters");
  const hasDaughtersOfSon = h.daughtersOfSon > 0 && !excluded.has("daughtersOfSon");
  const hasFullBrother = h.fullBrothers > 0 && !excluded.has("fullBrothers");
  const hasFullSister = h.fullSisters > 0 && !excluded.has("fullSisters");
  const hasPaternalBrother = h.paternalBrothers > 0 && !excluded.has("paternalBrothers");
  const hasPaternalSister = h.paternalSisters > 0 && !excluded.has("paternalSisters");

  if (hasSon) {
    residuaryClaimants.push({ heir: "sons", count: h.sons, weight: 2 });
    if (hasDaughters) residuaryClaimants.push({ heir: "daughters", count: h.daughters, weight: 1 });
    // البنات أصبحن عصبة بالغير: أزل فرضهنّ الثابت إن كان أُضيف سابقًا
    const idx = fixed.findIndex((f) => f.heir === "daughters");
    if (idx >= 0) { fixedSum = fixedSum.sub(fixed[idx].totalShare); fixed.splice(idx, 1); }
  } else if (hasSonsOfSon) {
    residuaryClaimants.push({ heir: "sonsOfSon", count: h.sonsOfSon, weight: 2 });
    // ابن الابن يُعصِّب بنت الابن دائمًا (سواء وُجدت بنات حقيقيات أم لا) — لا تُحجب معه أبدًا.
    if (hasDaughtersOfSon) {
      residuaryClaimants.push({ heir: "daughtersOfSon", count: h.daughtersOfSon, weight: 1 });
      const idx = fixed.findIndex((f) => f.heir === "daughtersOfSon");
      if (idx >= 0) { fixedSum = fixedSum.sub(fixed[idx].totalShare); fixed.splice(idx, 1); }
    }
  } else if (hasDaughters || hasDaughtersOfSon) {
    // أخت شقيقة/لأب "عصبة مع الغير" مع بنات/بنات ابن بلا ابن
    if (hasFullSister) {
      residuaryClaimants.push({ heir: "fullSisters", count: h.fullSisters, weight: 1 });
      const idx = fixed.findIndex((f) => f.heir === "fullSisters");
      if (idx >= 0) { fixedSum = fixedSum.sub(fixed[idx].totalShare); fixed.splice(idx, 1); }
      steps.push({ title: "تعصيب مع الغير", detail: "الأخت الشقيقة أصبحت عصبة مع البنت/بنت الابن (تُعصِّبها البنات لا محجوبة ولا صاحبة فرض مستقل)." });
    } else if (hasPaternalSister && !hasFullSister) {
      residuaryClaimants.push({ heir: "paternalSisters", count: h.paternalSisters, weight: 1 });
      const idx = fixed.findIndex((f) => f.heir === "paternalSisters");
      if (idx >= 0) { fixedSum = fixedSum.sub(fixed[idx].totalShare); fixed.splice(idx, 1); }
    }
  }

  if (residuaryClaimants.length === 0) {
    if (h.father > 0 && !excluded.has("father") && !hasDescendant) {
      residuaryClaimants.push({ heir: "father", count: 1, weight: 1 });
    } else if (h.father > 0 && !excluded.has("father") && (hasDaughters || hasDaughtersOfSon) && !hasSon && !hasSonsOfSon) {
      // الأب أخذ سدسًا فرضًا، ويأخذ الباقي أيضًا (مذكور في computeFixedShares) — أضِفه كمُطالِب بالبقية
      residuaryClaimants.push({ heir: "father", count: 1, weight: 1 });
    } else if (h.paternalGrandfather > 0 && !excluded.has("paternalGrandfather") && h.father === 0) {
      const siblingCount = (hasFullBrother ? h.fullBrothers : 0) + (hasFullSister ? h.fullSisters : 0) + (hasPaternalBrother ? h.paternalBrothers : 0) + (hasPaternalSister ? h.paternalSisters : 0);
      if (siblingCount === 0 || fiqhConfig.grandfatherWithSiblings === "grandfatherExcludes") {
        residuaryClaimants.push({ heir: "paternalGrandfather", count: 1, weight: 1 });
      } else {
        // مقاسمة: الجد كأخ شقيق (أو لأب إن لم يوجد شقيق) في القسمة
        if (hasFullBrother || hasFullSister) {
          residuaryClaimants.push({ heir: "paternalGrandfather", count: 1, weight: 2 });
          if (hasFullBrother) residuaryClaimants.push({ heir: "fullBrothers", count: h.fullBrothers, weight: 2 });
          if (hasFullSister) residuaryClaimants.push({ heir: "fullSisters", count: h.fullSisters, weight: 1 });
        } else {
          residuaryClaimants.push({ heir: "paternalGrandfather", count: 1, weight: 2 });
          if (hasPaternalBrother) residuaryClaimants.push({ heir: "paternalBrothers", count: h.paternalBrothers, weight: 2 });
          if (hasPaternalSister) residuaryClaimants.push({ heir: "paternalSisters", count: h.paternalSisters, weight: 1 });
        }
      }
    } else if ((hasFullBrother || hasFullSister) && !(isMushtaraka && fiqhConfig.mushtarakaShareWithMaternalSiblings)) {
      if (hasFullBrother) residuaryClaimants.push({ heir: "fullBrothers", count: h.fullBrothers, weight: 2 });
      if (hasFullSister) residuaryClaimants.push({ heir: "fullSisters", count: h.fullSisters, weight: 1 });
    } else if (hasPaternalBrother || hasPaternalSister) {
      if (hasPaternalBrother) residuaryClaimants.push({ heir: "paternalBrothers", count: h.paternalBrothers, weight: 2 });
      if (hasPaternalSister) residuaryClaimants.push({ heir: "paternalSisters", count: h.paternalSisters, weight: 1 });
    }
  }

  // إزالة الفرض الثابت لمن أصبح عصبة (الأب/الجد يحتفظان بسدسهما + الباقي، فلا يُزالان من fixed)

  const totalWeight = residuaryClaimants.reduce((s, c) => s + c.count * c.weight, 0);
  const remainder = new Fraction(1n).sub(fixedSum);

  let radd = false;
  let awlBase: bigint | null = null;

  const shares: HeirShareResult[] = [];

  if (fixedSum.greaterThan(new Fraction(1n))) {
    // ── عول: مجموع الفروض يتجاوز الأصل — يُرفَع الأصل (المقام المشترك) ليستوعب الكل،
    //     وتُنسَب كل الأنصبة إليه (تُخفَّض جميعًا بنفس النسبة) ──
    steps.push({ title: "العول", detail: `مجموع الفروض (${fixedSum.toString()}) يتجاوز أصل المسألة — تُعال المسألة فيُقسَّم كل نصيب على المجموع الفعلي بدل الواحد الصحيح.` });
    for (const f of fixed) {
      const adjusted = f.totalShare.div(fixedSum);
      shares.push({ heir: f.heir, count: f.count, basis: "fixed", totalShare: adjusted, perPersonShare: adjusted.div(new Fraction(BigInt(f.count))), reason: f.reason });
    }
    awlBase = fixedSum.den;
  } else if (totalWeight > 0) {
    // ── توزيع البقية على العصبة ──
    for (const f of fixed) {
      shares.push({ heir: f.heir, count: f.count, basis: "fixed", totalShare: f.totalShare, perPersonShare: f.totalShare.div(new Fraction(BigInt(f.count))), reason: f.reason });
    }
    for (const c of residuaryClaimants) {
      const share = remainder.mul(new Fraction(BigInt(c.count * c.weight), BigInt(totalWeight)));
      const basis = (c.heir === "daughters" || c.heir === "daughtersOfSon" || c.heir === "fullSisters" || c.heir === "paternalSisters") && c.weight === 1 && residuaryClaimants.some((x) => x !== c)
        ? "asaba-with-daughters"
        : "asaba";
      shares.push({
        heir: c.heir, count: c.count, basis,
        totalShare: share, perPersonShare: share.div(new Fraction(BigInt(c.count))),
        reason: "تعصيبًا (الباقي بعد أصحاب الفروض)",
      });
    }
  } else if (!remainder.isZero() && remainder.isPositive()) {
    // ── لا عصبة: يبقى فائض بلا مُستحِق من أصحاب الفروض أنفسهم → رد أو ذوو أرحام ──
    const raddEligible = fixed.filter((f) => fiqhConfig.raddToSpouse || (f.heir !== "husband" && f.heir !== "wife"));
    const raddSum = raddEligible.reduce((s, f) => s.add(f.totalShare), ZERO);
    if (raddEligible.length > 0 && raddSum.isPositive()) {
      radd = true;
      steps.push({ title: "الرد", detail: "بقي جزء من التركة بعد الفروض بلا عصبة تستحقّه — يُرَدّ على أصحاب الفروض (غير الزوجين، ما لم يُفعَّل ردّ الزوجين في الإعداد) بنسبة أنصبتهم." });
      for (const f of fixed) {
        const eligible = fiqhConfig.raddToSpouse || (f.heir !== "husband" && f.heir !== "wife");
        const extra = eligible ? remainder.mul(f.totalShare).div(raddSum) : ZERO;
        const total = f.totalShare.add(extra);
        shares.push({ heir: f.heir, count: f.count, basis: eligible && extra.isPositive() ? "radd" : "fixed", totalShare: total, perPersonShare: total.div(new Fraction(BigInt(f.count))), reason: f.reason + (eligible && extra.isPositive() ? " + نصيب من الرد" : "") });
      }
    } else {
      warnings.push("توجد بقية من التركة بلا عصبة معروفة ولا صاحب فرض يُرَدّ عليه ضمن الورثة المُدخَلين — تؤول لذوي الأرحام أو بيت المال بحسب الحالة؛ يلزم مراجعة مختص شرعي/قانوني لتحديد ذلك بدقة.");
      for (const f of fixed) {
        shares.push({ heir: f.heir, count: f.count, basis: "fixed", totalShare: f.totalShare, perPersonShare: f.totalShare.div(new Fraction(BigInt(f.count))), reason: f.reason });
      }
    }
  } else {
    for (const f of fixed) {
      shares.push({ heir: f.heir, count: f.count, basis: "fixed", totalShare: f.totalShare, perPersonShare: f.totalShare.div(new Fraction(BigInt(f.count))), reason: f.reason });
    }
  }

  if (fixed.length === 0 && residuaryClaimants.length === 0) {
    warnings.push("لا يوجد بين الورثة المُدخَلين صاحب فرض معروف ولا عصبة — راجع بيانات المسألة، أو أنها تحتاج توريث ذوي الأرحام (يتطلب مختصًا).");
  }

  // أصل المسألة (المقام المشترك لكل الفروض الأصلية قبل العول/التصحيح)
  let base = 1n;
  for (const f of fixed) {
    const g = (a: bigint, b: bigint): bigint => (b === 0n ? a : g(b, a % b));
    base = (base * f.totalShare.den) / g(base, f.totalShare.den);
  }
  if (base < 1n) base = 1n;

  // أصل المسألة بعد العول: نُعيد التعبير عن مجموع الفروض بمقامه الحقيقي (الأصل)
  // بدل مقامه بعد تبسيط Fraction التلقائي (الذي قد يُخفي الأصل الحقيقي).
  if (awlBase !== null && base > 0n) {
    const scaleFactor = base / fixedSum.den;
    awlBase = fixedSum.num * (scaleFactor === 0n ? 1n : scaleFactor);
  }

  // دمج الأنصبة: قد يظهر الوارث نفسه بأكثر من قيد (فرض + تعصيب معًا، كالأب مع
  // البنات) — نُدمِجها في قيد واحد بنصيب إجمالي صحيح كي لا يظهر الوارث مرتين.
  const mergedShares: HeirShareResult[] = [];
  for (const s of shares) {
    const existing = mergedShares.find((m) => m.heir === s.heir);
    if (existing) {
      existing.totalShare = existing.totalShare.add(s.totalShare);
      existing.perPersonShare = existing.totalShare.div(new Fraction(BigInt(existing.count)));
      existing.reason = `${existing.reason}؛ و${s.reason}`;
      if (s.basis === "asaba" || s.basis === "asaba-with-daughters") existing.basis = s.basis;
    } else {
      mergedShares.push({ ...s });
    }
  }

  return {
    originalBase: base,
    awlBase,
    radd,
    shares: mergedShares,
    hajbLog,
    steps,
    warnings,
    netEstate: ZERO, // تُحسَب في طبقة التركة (estate.ts) لا هنا
  };
}
