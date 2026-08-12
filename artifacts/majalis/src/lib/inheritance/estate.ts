/**
 * حساب صافي التركة القابل للتوزيع على الورثة، بالترتيب الشرعي الملزم:
 * مؤن التجهيز ← الديون ← الوصية الصحيحة (بحدّ الثلث ما لم يُجِز الورثة) ← الباقي للورثة.
 */
import { Fraction } from "./fraction";
import type { EstateInput } from "./types";

export type EstateBreakdown = {
  grossEstate: number;
  funeralCosts: number;
  debts: number;
  afterDebts: number;
  bequestRequested: number;
  bequestCap: number;
  bequestPaid: number;
  bequestCapped: boolean;
  netForHeirs: number;
  netForHeirsFraction: Fraction;
  warnings: string[];
};

export function computeEstateBreakdown(input: EstateInput): EstateBreakdown {
  const warnings: string[] = [];
  const grossEstate = input.assets.reduce((s, a) => s + a.value, 0);

  if (grossEstate < 0) throw new Error("قيمة التركة الإجمالية لا يمكن أن تكون سالبة");
  if (input.debts < 0 || input.funeralCosts < 0 || input.bequest < 0) {
    throw new Error("الديون ومؤن التجهيز والوصية يجب أن تكون قيمًا غير سالبة");
  }

  const afterFuneral = Math.max(0, grossEstate - input.funeralCosts);
  if (input.funeralCosts > grossEstate) {
    warnings.push("مؤن التجهيز تتجاوز إجمالي التركة — لا يتبقّى شيء للديون أو الورثة.");
  }

  const afterDebts = Math.max(0, afterFuneral - input.debts);
  if (input.debts > afterFuneral) {
    warnings.push("الديون تستغرق التركة بالكامل بعد مؤن التجهيز — لا وصية ولا ميراث حتى تُسدَّد الديون.");
  }

  const bequestCap = afterDebts / 3;
  const bequestCapped = input.bequest > bequestCap && !input.bequestApprovedByHeirs;
  const bequestPaid = input.bequestApprovedByHeirs
    ? Math.min(input.bequest, afterDebts)
    : Math.min(input.bequest, bequestCap);

  if (bequestCapped) {
    warnings.push(`الوصية (${input.bequest}) تتجاوز ثلث ما بقي بعد الديون (${bequestCap.toFixed(2)}) — نُفِّذت في حدود الثلث فقط. تُنفَّذ كاملة فقط إن أجازها جميع الورثة صراحة.`);
  }

  const netForHeirs = Math.max(0, afterDebts - bequestPaid);

  return {
    grossEstate,
    funeralCosts: Math.min(input.funeralCosts, grossEstate),
    debts: Math.min(input.debts, afterFuneral),
    afterDebts,
    bequestRequested: input.bequest,
    bequestCap,
    bequestPaid,
    bequestCapped,
    netForHeirs,
    netForHeirsFraction: decimalToFraction(netForHeirs),
    warnings,
  };
}

/** تحويل عدد عشري (قيمة نقدية) لكسر دقيق بمقام 10^6 — يكفي لأي عملة بدقة سنتات/فلوس. */
function decimalToFraction(value: number): Fraction {
  const scale = 1_000_000n;
  const scaled = BigInt(Math.round(value * 1_000_000));
  return new Fraction(scaled, scale);
}
