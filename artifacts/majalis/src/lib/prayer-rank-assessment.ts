import { aggregateStats, computeMonthlyCommitment } from "@/lib/prayer-tracker/scoring";
import { readPrayerStore } from "@/lib/prayer-tracker/storage";
import {
  ASSESSMENT_QUESTIONS,
  IBN_QAYYIM_RANKS,
  type AssessmentAnswers,
  type IbnQayyimRank,
  type IbnQayyimRankLevel,
} from "./prayer-ibn-qayyim-ranks";

export type AdvisoryResult = {
  suggestedLevel: IbnQayyimRankLevel;
  rank: IbnQayyimRank;
  confidence: "low" | "medium";
  reasons: string[];
  disclaimer: string;
};

const DISCLAIMER =
  "هذا التقدير إرشادي فقط لمحاسبة النفس، وليس حكماً على مرتبتك الحقيقية عند الله. الله أعلم بما في القلوب.";

function clampLevel(n: number): IbnQayyimRankLevel {
  return Math.min(5, Math.max(1, Math.round(n))) as IbnQayyimRankLevel;
}

function scoreFromQuestionnaire(answers: AssessmentAnswers): { score: number; reasons: string[] } {
  let score = 2;
  const reasons: string[] = [];

  for (const q of ASSESSMENT_QUESTIONS) {
    const ans = answers[q.id];
    if (ans == null) continue;
    const boost = q.yesRankBoost ?? 0;
    if ("inverted" in q && q.inverted) {
      if (ans) {
        score -= Math.abs(boost);
        reasons.push("ذكرت أن الشرود يغلب عليك — وهذا مما يُجاهد فيه المصلي");
      } else {
        score += Math.abs(boost) * 0.5;
        reasons.push("تذكر أنك تجاهد الوساوس — وهذا من علامات المجاهدة");
      }
    } else if (ans) {
      score += boost;
      if (q.id === "five_daily") reasons.push("أشرت إلى المحافظة على الصلوات الخمس");
      if (q.id === "first_time") reasons.push("تسعى للصلاة في أول الوقت");
      if (q.id === "meanings") reasons.push("تتدبر معاني القراءة في الصلاة");
      if (q.id === "comfort") reasons.push("تجد في الصلاة راحة للقلب — قريب من مرتبة المحب");
    } else {
      score -= boost * 0.4;
      if (q.id === "five_daily") reasons.push("المحافظة على الخمس أساس الارتقاء — ابن القيم يبدأ بالظاهر");
      if (q.id === "comfort") reasons.push("السعي لجعل الصلاة قرة العين هدف المرتبة العليا");
    }
  }

  return { score, reasons };
}

function scoreFromTracker(): { score: number; reasons: string[] } {
  const store = readPrayerStore();
  if (!Object.keys(store).length) return { score: 0, reasons: [] };

  const stats = aggregateStats(store);
  const commitment = computeMonthlyCommitment(store);
  let score = 1.5;
  const reasons: string[] = [];

  if (commitment >= 80) {
    score += 1.5;
    reasons.push(`التزامك الشهري بالصلوات يقارب ${commitment}% — محافظة ظاهرة`);
  } else if (commitment >= 50) {
    score += 0.8;
    reasons.push(`التزامك الشهري ${commitment}% — في طريق المحافظة`);
  } else if (commitment > 0) {
    reasons.push("سجل المتابعة يظهر مجالاً للمحافظة على الخمس");
  }

  if (stats.totalCongregation > 5) {
    score += 0.5;
    reasons.push("تصلي جماعة — وهذا يعين على الخشوع");
  }

  if (stats.currentStreak >= 7) {
    score += 0.7;
    reasons.push(`استمرار ${stats.currentStreak} يوماً — علامة على المجاهدة`);
  }

  if (stats.totalFirstTime > 3) {
    score += 0.4;
    reasons.push("تحرص على أول الوقت في بعض الصلوات");
  }

  return { score, reasons };
}

export function computeAdvisoryRank(answers: AssessmentAnswers): AdvisoryResult {
  const q = scoreFromQuestionnaire(answers);
  const t = scoreFromTracker();
  const combined = q.score + t.score * 0.6;
  const level = clampLevel(combined);
  const rank = IBN_QAYYIM_RANKS[level - 1];

  const allReasons = [...new Set([...t.reasons, ...q.reasons])].slice(0, 5);
  const hasAnswers = Object.values(answers).some((v) => v != null);
  const hasTracker = t.reasons.length > 0;

  return {
    suggestedLevel: level,
    rank,
    confidence: hasAnswers && hasTracker ? "medium" : "low",
    reasons: allReasons.length
      ? allReasons
      : ["أجب على الأسئلة أو استخدم متابعة الصلوات للحصول على تقدير أدق"],
    disclaimer: DISCLAIMER,
  };
}

export function loadAssessmentAnswers(): AssessmentAnswers {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem("majalis-prayer-assessment-v1") || "{}");
  } catch {
    return {};
  }
}

export function saveAssessmentAnswers(answers: AssessmentAnswers) {
  if (typeof window === "undefined") return;
  localStorage.setItem("majalis-prayer-assessment-v1", JSON.stringify(answers));
}
