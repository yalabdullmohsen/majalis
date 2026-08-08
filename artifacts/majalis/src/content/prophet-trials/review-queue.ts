import type { ProphetTrialReviewQueueItem } from "./types";

/**
 * قائمة مراجعة المالك — قصص/تفاصيل مشهورة بلا شاهد قرآني محكم أو سند صحيح.
 * لا تُعرض للعامة كحقائق قاطعة.
 */
export const PROPHET_TRIALS_REVIEW_QUEUE: ProphetTrialReviewQueueItem[] = [
  {
    id: "rq-ayyub-wife-hair",
    titleAr: "تفاصيل زوجة أيوب وبيع شعرها",
    reasonAr:
      "تفاصيل مطوّلة عن زوجة أيوب (بيع الشعر، خدمة الناس، حوارات مفصّلة) مما اشتهر في الإسرائيليات وكتب القصص بلا سند مرفوع صحيح يعتمد عليه.",
    kind: "israiliyyat",
    relatedTrialId: "ayyub-illness",
    notesAr: "القرآن يثبت الضر والصبر والكشف دون هذه التفاصيل.",
  },
  {
    id: "rq-ayyub-duration",
    titleAr: "تعيين مدة بلاء أيوب (سبع/ثماني عشرة سنة…)",
    reasonAr:
      "أرقام المدد المتداولة في الوعظ ليست من نصّ قرآني صريح ولا من حديث في الصحيحين بدرجة قاطعة؛ تُترك بلا جزم.",
    kind: "popular_unverified",
    relatedTrialId: "ayyub-illness",
  },
  {
    id: "rq-ibrahim-fire-construction",
    titleAr: "تفاصيل بناء النمرود للنار ومنجنيق الإلقاء",
    reasonAr:
      "القرآن يثبت الهمّ بالإحراق ونجاته؛ تفاصيل البناء والمنجنيق والحطب أسابيع من أخبار القصّاص والإسرائيليات.",
    kind: "israiliyyat",
    relatedTrialId: "ibrahim-fire",
  },
  {
    id: "rq-sacrifice-son-identity",
    titleAr: "الجزم باسم الذبيح خارج نصّ الصافات",
    reasonAr:
      "سورة الصافات لا تسمّي الابن في مشهد الذبح؛ الجزم بإسماعيل أو إسحاق مسألة خلافية عند أهل العلم، فلا تُعرض كخبر قطعي في بطاقة الابتلاء.",
    kind: "needs_verification",
    relatedTrialId: "ibrahim-sacrifice",
  },
  {
    id: "rq-yunus-forty-days",
    titleAr: "يونس في بطن الحوت أربعين يوماً",
    reasonAr:
      "تعيين المدة بأربعين يوماً ونحوها مما يُتداول في القصص بلا شاهد قرآني ولا حديث صحيح متفق عليه.",
    kind: "popular_unverified",
    relatedTrialId: "yunus-whale",
  },
  {
    id: "rq-taif-stone-details",
    titleAr: "تفصيل رمي أهل الطائف بالحجارة وإدام الجرح",
    reasonAr:
      "ثبوت شدة يوم العقبة/الطائف في الصحيحين؛ أما مشهد الرمي المفصّل وإدام النعلين ونزف الدم بطول الطريق فمعظمُه من كتب السيرة بلا تخريج صحيح مستقل يكفي للعرض القطعي.",
    kind: "needs_grade",
    relatedTrialId: "muhammad-taif",
    notesAr: "يُكتفى بمعنى الحديث الصحيح دون حشو الإسقاط القصصي.",
  },
  {
    id: "rq-nuh-son-mountain-dialogue",
    titleAr: "حوارات مطوّلة لابن نوح على الجبل",
    reasonAr:
      "القرآن يذكر رفض الابن الركوب وقوله سآوي إلى جبل؛ الزيادات الحوارية والوصفية من الإسرائيليات والقصص.",
    kind: "israiliyyat",
    relatedTrialId: "nuh-flood-salvation",
  },
  {
    id: "rq-yusuf-zulaikha-romance",
    titleAr: "قصص زليخة الرومانسية وتفاصيل الفتنة الزائدة",
    reasonAr:
      "القرآن يكتفي بذكر المراودة والشهادة والقميص؛ الأسماء والتفاصيل الغرامية المتداولة ليست من الوحي المسند.",
    kind: "israiliyyat",
    relatedTrialId: "yusuf-prison",
  },
  {
    id: "rq-yusuf-prison-years",
    titleAr: "تعيين عدد سنيّ سجن يوسف برقم قاطع",
    reasonAr:
      "القرآن يقول «بضع سنين»؛ الجزم بسبع أو اثنتي عشرة من الاستنباط أو الإسرائيليات لا يُدرج كحقيقة قطعية.",
    kind: "popular_unverified",
    relatedTrialId: "yusuf-prison",
  },
  {
    id: "rq-musa-staff-dragon-details",
    titleAr: "تفاصيل تنين عصا موسى الخارجة عن النص",
    reasonAr:
      "القرآن يثبت انقلاب العصا حيّة تسعى؛ أوصاف التنين الضخم وألوانه من حشو القصص لا من آية محكمة.",
    kind: "israiliyyat",
    relatedTrialId: "musa-pharaoh",
  },
];
