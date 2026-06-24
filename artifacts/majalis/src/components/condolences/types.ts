export type CondolenceFormData = {
  deceasedName: string;
  deathDate: string;
  burialTime: string;
  condolenceLocation: string;
  extraText: string;
};

export const defaultCondolenceData: CondolenceFormData = {
  deceasedName: "",
  deathDate: "",
  burialTime: "",
  condolenceLocation: "",
  extraText: "",
};

export type CondolenceTemplateId =
  | "black_classic"
  | "circle_ornament"
  | "large_arabic"
  | "official_death"
  | "baqiya_lillah"
  | "bashshir_sabireen";

export type CardSizeKey = "portrait" | "square";

export const CARD_SIZES: Record<
  CardSizeKey,
  { width: number; height: number; label: string }
> = {
  portrait: { width: 1080, height: 1350, label: "1080 × 1350 (جوال)" },
  square: { width: 1080, height: 1080, label: "1080 × 1080 (مربع)" },
};

export type CondolenceTemplateMeta = {
  id: CondolenceTemplateId;
  name: string;
  headline: string;
};

export const CONDOLENCE_TEMPLATES: CondolenceTemplateMeta[] = [
  { id: "black_classic", name: "أسود كلاسيكي", headline: "إنا لله وإنا إليه راجعون" },
  { id: "circle_ornament", name: "زخرفة دائرية", headline: "إنا لله وإنا إليه راجعون" },
  { id: "large_arabic", name: "خط عربي كبير", headline: "إنا لله وإنا إليه راجعون" },
  { id: "official_death", name: "إعلان وفاة رسمي", headline: "إعلان وفاة" },
  { id: "baqiya_lillah", name: "البقاء لله", headline: "البقاء لله" },
  { id: "bashshir_sabireen", name: "وبشر الصابرين", headline: "وبشر الصابرين" },
];

export type CondolencePreviewProps = {
  data: CondolenceFormData;
  templateId: CondolenceTemplateId;
  width: number;
  height: number;
  id?: string;
};

export function buildCondolencePlainText(
  data: CondolenceFormData,
  headline: string
): string {
  const lines = [headline, ""];
  if (data.deceasedName) {
    lines.push(`انتقل إلى رحمة الله: ${data.deceasedName}`);
  }
  if (data.deathDate) lines.push(`تاريخ الوفاة: ${data.deathDate}`);
  if (data.burialTime) lines.push(`وقت الدفن: ${data.burialTime}`);
  if (data.condolenceLocation) lines.push(`مكان العزاء: ${data.condolenceLocation}`);
  if (data.extraText) {
    lines.push("");
    lines.push(data.extraText);
  }
  lines.push("");
  lines.push("إنا لله وإنا إليه راجعون");
  return lines.filter((l, i, arr) => !(l === "" && arr[i + 1] === "")).join("\n");
}
