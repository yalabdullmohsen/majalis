/** بيانات بطاقة التعزية — عدّل القيم الافتراضية حسب الحاجة */
export type CondolenceData = {
  deceasedName: string;
  familyName: string;
  deathDate: string;
  condolenceTime: string;
  condolenceLocation: string;
  prayer: string;
};

export const defaultCondolenceData: CondolenceData = {
  deceasedName: "الحاج محمد بن عبدالله الفلاني",
  familyName: "عائلة الفلاني الكريمة",
  deathDate: "١٥ محرم ١٤٤٦ هـ",
  condolenceTime: "من بعد صلاة المغرب حتى العشاء",
  condolenceLocation: "ديوانية العائلة — مدينة الكويت",
  prayer: "رحمه الله وأسكنه فسيح جناته",
};

export type CondolenceCardProps = {
  data: CondolenceData;
  id?: string;
};
