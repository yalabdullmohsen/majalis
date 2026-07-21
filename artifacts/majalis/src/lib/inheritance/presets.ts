/**
 * أمثلة جاهزة لتعليم وتجربة حاسبة المواريث، تغطي حالات شائعة وحالات خاصة
 * مشهورة (العمريتان، المشرَّكة، العول، الرد، مقاسمة الجد). لأغراض تعليمية.
 */
import type { HeirsInput } from "./types";

export type InheritancePreset = {
  id: string;
  title: string;
  description: string;
  heirs: HeirsInput;
};

export const INHERITANCE_PRESETS: InheritancePreset[] = [
  {
    id: "simple-sons-daughters",
    title: "زوجة + ابنان + بنت",
    description: "مثال أساسي على التعصيب: الأبناء والبنات يقتسمون الباقي، للذكر مثل حظ الأنثيين.",
    heirs: { wife: 1, sons: 2, daughters: 1 },
  },
  {
    id: "gharrawayn-husband",
    title: "العمريتان: زوج + أب + أم",
    description: "حالة خاصة مشهورة: للأم ثلث ما يبقى بعد نصيب الزوج، لا ثلث كل التركة.",
    heirs: { husband: 1, father: 1, mother: 1 },
  },
  {
    id: "mushtaraka",
    title: "المشرَّكة (الحمارية): زوج + أم + أخوان لأم + أخوان أشقاء",
    description: "حالة خلافية مشهورة: يُشرَّك الإخوة الأشقاء مع إخوة الأم في الثلث بالتساوي وفق قول الجمهور.",
    heirs: { husband: 1, mother: 1, maternalBrothers: 2, fullBrothers: 2 },
  },
  {
    id: "daughter-parents",
    title: "بنت واحدة + أب + أم",
    description: "البنت تأخذ النصف فرضًا، والأبوان كل واحد السدس، والباقي يعود للأب تعصيبًا.",
    heirs: { daughters: 1, father: 1, mother: 1 },
  },
  {
    id: "wife-daughters-father",
    title: "زوجة + بنتان + أب",
    description: "الزوجة الثمن، البنتان الثلثان، الأب السدس فرضًا والباقي تعصيبًا.",
    heirs: { wife: 1, daughters: 2, father: 1 },
  },
  {
    id: "parents-only",
    title: "أب + أم فقط",
    description: "بلا فرع وارث ولا زوجين: الأم الثلث، والأب الباقي (الثلثان) تعصيبًا.",
    heirs: { father: 1, mother: 1 },
  },
  {
    id: "two-wives-son-daughters",
    title: "زوجتان + ابن + بنتان",
    description: "الزوجتان يقتسمان الثمن، والابن والبنتان يقتسمون الباقي تعصيبًا.",
    heirs: { wife: 2, sons: 1, daughters: 2 },
  },
  {
    id: "awl-husband-two-sisters",
    title: "عَوْل: زوج + أختان شقيقتان",
    description: "مجموع الفروض (النصف + الثلثان) يتجاوز أصل المسألة، فتُعال المسألة وتُخفَّض كل الأنصبة بنفس النسبة.",
    heirs: { husband: 1, fullSisters: 2 },
  },
  {
    id: "two-grandmothers-husband",
    title: "زوج + جدة لأب + جدة لأم",
    description: "السدس يُقسَّم بالتساوي بين الجدتين الوارثتين من نفس الدرجة.",
    heirs: { husband: 1, paternalGrandmother: 1, maternalGrandmother: 1 },
  },
  {
    id: "sons-of-son-daughters-of-son",
    title: "ابن ابن + بنت ابن (بلا ابن ولا بنات)",
    description: "ابن الابن يُعصِّب بنت الابن دائمًا، فيقتسمان الباقي للذكر مثل حظ الأنثيين.",
    heirs: { sonsOfSon: 1, daughtersOfSon: 1 },
  },
  {
    id: "radd-daughter-mother",
    title: "رَدّ: بنت واحدة + أم",
    description: "لا عصبة في هذه المسألة، فيُردّ الفائض بعد الفروض على البنت والأم بنسبة أنصبتهما.",
    heirs: { daughters: 1, mother: 1 },
  },
  {
    id: "grandfather-with-siblings",
    title: "مقاسمة الجد: جد + أخوان شقيقان (بلا أب)",
    description: "حالة خلافية مشهورة: الجد يقاسم الإخوة الأشقاء وفق قول الجمهور (قابلة للتغيير في الإعدادات الفقهية).",
    heirs: { paternalGrandfather: 1, fullBrothers: 2 },
  },
];
