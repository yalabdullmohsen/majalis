export type CondolenceTemplateId = "official" | "death-announcement";

export const CONDOLENCE_TEMPLATES: { id: CondolenceTemplateId; label: string; description: string }[] = [
  {
    id: "official",
    label: "تعزية رسمية",
    description: "بسم الله، آية، نص تعزية، ودعاء — للمؤسسات والأسر",
  },
  {
    id: "death-announcement",
    label: "إعلان وفاة رسمي",
    description: "إعلان وفاة أسود — بيانات الدفن والعزاء والاتصال",
  },
];

export const EXPORT_SIZES = {
  square: { width: 1080, height: 1080, previewW: 400, previewH: 400 },
  story: { width: 1080, height: 1350, previewW: 432, previewH: 540 },
} as const;

export const THULUTH_FONT = '"Cairo", sans-serif';

export const BODY_FONT = '"Cairo", sans-serif';

export function fitFontSize(
  text: string,
  base: number,
  min: number,
  softMax: number,
  hardMax: number,
): number {
  const len = text.trim().length;
  if (len <= softMax) return base;
  if (len >= hardMax) return min;
  const ratio = (len - softMax) / (hardMax - softMax);
  return Math.round(base - (base - min) * ratio);
}

export function placeholder(value: string, fallback: string): string {
  const v = value.trim();
  return v || fallback;
}

export type DeathAnnouncementGender = "male" | "female";

export type DeathAnnouncementForm = {
  gender: DeathAnnouncementGender;
  name: string;
  day: string;
  prayer: string;
  cemetery: string;
  condolenceAddress: string;
  phone: string;
  extraDua: string;
};

export const defaultDeathAnnouncementForm: DeathAnnouncementForm = {
  gender: "male",
  name: "",
  day: "",
  prayer: "",
  cemetery: "",
  condolenceAddress: "",
  phone: "",
  extraDua: "",
};
