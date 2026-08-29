import type { HistoryCategory } from "./types";

export type HistoryEraMeta = {
  id: HistoryCategory;
  title: string;
  /** مدى زمني مختصر للعرض */
  period: string;
  /** عاصمة أو مركز بارز إن وُجد */
  center?: string;
  /** جملة واحدة توضّح هوية العصر */
  blurb: string;
  /** لون تمييز خفيف (hex) للشريط التفاعلي */
  accent: string;
};

/**
 * بطاقات الدول والعصور في الخط الزمني التفاعلي —
 * مرتّبة من قبل البعثة إلى يومنا (نفس HISTORY_CATEGORY_ORDER).
 */
export const HISTORY_ERA_META: Record<HistoryCategory, HistoryEraMeta> = {
  seerah: {
    id: "seerah",
    title: "قبل البعثة والسيرة",
    period: "قبل 610م — 11هـ",
    center: "مكة · المدينة",
    blurb: "سياق ما قبل الوحي، ثم بوابة إلى السيرة النبوية المفصّلة.",
    accent: "#135034",
  },
  rashidun: {
    id: "rashidun",
    title: "الخلفاء الراشدون",
    period: "11–40هـ",
    center: "المدينة · الكوفة",
    blurb: "خلافة على منهاج النبوة: جمع القرآن والفتوحات والفتن بضوابط أهل السنة.",
    accent: "#1a6b45",
  },
  umayyad: {
    id: "umayyad",
    title: "الدولة الأموية",
    period: "41–132هـ",
    center: "دمشق",
    blurb: "اتساع الدولة وتعريب الدواوين وفتح الأندلس — مع تمحيص ما وقع من فتن.",
    accent: "#8a6a32",
  },
  abbasid: {
    id: "abbasid",
    title: "الدولة العباسية",
    period: "132–656هـ",
    center: "بغداد",
    blurb: "عصر التدوين والترجمة وازدهار العلوم، ثم الضعف حتى سقوط بغداد.",
    accent: "#785e38",
  },
  andalus: {
    id: "andalus",
    title: "الأندلس",
    period: "92–897هـ",
    center: "قرطبة · غرناطة",
    blurb: "ثمانية قرون من الفتح إلى سقوط غرناطة — علم وعمران ثم تشرذم.",
    accent: "#5c6b3a",
  },
  "seljuk-ayyubid": {
    id: "seljuk-ayyubid",
    title: "السلاجقة والأيوبيون",
    period: "ق 5–7هـ",
    center: "دمشق · القاهرة",
    blurb: "مقاومة الصليبيين، نظام المدارس، وحطين وتحرير القدس.",
    accent: "#3d6b5c",
  },
  mamluk: {
    id: "mamluk",
    title: "دولة المماليك",
    period: "648–923هـ",
    center: "القاهرة",
    blurb: "عين جالوت وصد المغول، ثم توحيد الجبهة في الشام ومصر.",
    accent: "#2f5c6b",
  },
  ottoman: {
    id: "ottoman",
    title: "الدولة العثمانية",
    period: "699–1342هـ",
    center: "إسطنبول",
    blurb: "من التأسيس إلى فتح القسطنطينية، ثم الامتداد فالضعف حتى إلغاء الخلافة.",
    accent: "#4a5c38",
  },
  civilization: {
    id: "civilization",
    title: "الحضارة الإسلامية",
    period: "عبر العصور",
    blurb: "مؤسسات العلم والوقف والقضاء والطب والعمران — خيط حضاري موازٍ للدول.",
    accent: "#6b5a32",
  },
  modern: {
    id: "modern",
    title: "إلى يومنا هذا",
    period: "ق 13هـ — اليوم",
    blurb: "الاستعمار والاستقلال وواقع الأمة المعاصر مع سنن التاريخ الثابتة.",
    accent: "#135034",
  },
};
