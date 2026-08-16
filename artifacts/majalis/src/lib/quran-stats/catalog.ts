/**
 * بطاقات «القرآن في أرقام» — مصادر معتمدة فقط (مجمع الملك فهد · الداني · السيوطي · ناظمة الزهر).
 * لا تُستورد أرقام من مواقع الإعجاز العددي.
 */
import type { QuranComputedStats, QuranStat } from "./types";
import { FORBIDDEN_STAT_SOURCES } from "./types";

export function buildQuranStatsCatalog(computed: QuranComputedStats): QuranStat[] {
  const m = computed.methodology.arabic;
  const t = computed.totals;
  const e = computed.extremes;

  const catalog: QuranStat[] = [
    {
      id: "surahs",
      label: "عدد السور",
      value: 114,
      kind: "agreed",
      source: "مجمع الملك فهد لطباعة المصحف الشريف — مصحف المدينة برواية حفص عن عاصم",
    },
    {
      id: "ajza",
      label: "عدد الأجزاء",
      value: 30,
      kind: "agreed",
      source: "تقسيم مصحف المدينة (مجمع الملك فهد) إلى ثلاثين جزءًا متداولًا",
    },
    {
      id: "ahzab",
      label: "عدد الأحزاب",
      value: 60,
      kind: "agreed",
      source: "تقسيم مصحف المدينة: كل جزء حزبان = ستون حزبًا",
    },
    {
      id: "arbā",
      label: "أرباع الأحزاب",
      value: 240,
      kind: "agreed",
      source: "تقسيم مصحف المدينة: كل حزب أربعة أرباع = ٢٤٠ ربعًا",
    },
    {
      id: "ayat-kufi",
      label: "عدد الآيات — العدّ الكوفي",
      value: 6236,
      kind: "by-school",
      source:
        "البيان في عدّ آي القرآن لأبي عمرو الداني؛ ومصحف المدينة برواية حفص على العدّ الكوفي (مجمع الملك فهد)",
      note:
        "٦٢٣٦ على العدّ الكوفي (عدّ مصحف المدينة برواية حفص). لمدارس العدّ الأخرى (المدني الأول والثاني، المكي، البصري، الشامي) أعداد مختلفة؛ والخلاف في مواضع الفواصل لا في زيادة نصّ أو نقصه.",
    },
    {
      id: "words-disputed",
      label: "عدد الكلمات — أقوال العلماء",
      value: "مختلف فيه",
      kind: "disputed",
      source: "الإتقان في علوم القرآن للسيوطي؛ والبيان للداني — مع اختلاف تعريف «الكلمة»",
      note:
        "لا يُعرض رقم واحد قاطعًا. سبب الخلاف: احتساب الحروف المقطّعة في فواتح السور كلمةً أو حروفًا، وهمزات الوصل وأحرف المدّ، وعدّ البسملات، واختلاف تعريف الكلمة عند اللغويين.",
      variants: [
        {
          value: "≈ ٧٧٬٤٣٩",
          attribution: "قول مشهور يُنسب إلى بعض المتأخرين في عدّ كلمات الرسم",
          source: "الإتقان للسيوطي — باب عدد كلمات القرآن وحروفه (مع نقل الخلاف)",
        },
        {
          value: "≈ ٧٧٬٧٠١",
          attribution: "قول آخر في بعض روايات العدّ",
          source: "الإتقان للسيوطي — سرد الأقوال في عدد الكلمات",
        },
        {
          value: "يختلف بحسب المنهج",
          attribution: "محقّقو علوم القرآن",
          source: "البيان للداني وما تبعه من شروح ناظمة الزهر — الخلاف منهجي لا نصّي",
        },
      ],
    },
    {
      id: "letters-disputed",
      label: "عدد الحروف — أقوال العلماء",
      value: "مختلف فيه",
      kind: "disputed",
      source: "الإتقان للسيوطي؛ ناظمة الزهر وشروحها",
      note:
        "الخلاف في عدّ الحروف المقطّعة، وهمزة الوصل، وأحرف المدّ، وعلامات الرسم، دون مساس بثبوت النص.",
      variants: [
        {
          value: "≈ ٣٢١٬٠٠٠",
          attribution: "أحد الأقوال المنقولة في الإتقان",
          source: "الإتقان في علوم القرآن — باب عدد الحروف",
        },
        {
          value: "≈ ٣٢٣٬٠١٥",
          attribution: "قول آخر منقول في كتب العدّ",
          source: "الإتقان للسيوطي — سرد الأقوال",
        },
        {
          value: "يختلف بالمنهج",
          attribution: "شروح ناظمة الزهر",
          source: "ناظمة الزهر وشروحها في عدّ الآي والحروف",
        },
      ],
    },
    {
      id: "pages-madinah",
      label: "صفحات مصحف المدينة",
      value: 604,
      kind: "agreed",
      source: "مصحف المدينة النبوية الصادر عن مجمع الملك فهد لطباعة المصحف الشريف",
      note: "إحصاء طباعي لمصحف المدينة، لا يُعرض في بطاقة «فتح المصحف» التسويقية.",
    },
    {
      id: "sajda",
      label: "مواضع سجود التلاوة",
      value: "١٥ (وفي بعضها خلاف)",
      kind: "disputed",
      source: "كتب الفقه وعلوم القرآن؛ ومواضع السجدة في مصحف المدينة",
      note:
        "المشهور خمسة عشر موضعًا، ومنها خلاف في سجدة ص والثانية في الحج. البيانات المحلية للمشروع ترصد علامات سجدة في النص.",
      variants: [
        {
          value: "١٥",
          attribution: "المشهور عند جمهور أهل العلم",
          source: "مصحف المدينة — مواضع السجدة المعلَّمة",
        },
        {
          value: "خلاف في ص / الحج",
          attribution: "خلاف فقهي معروف",
          source: "كتب الفقه في سجود التلاوة",
        },
      ],
    },
    {
      id: "classification",
      label: "السبع الطوال والمئون والمثاني والمفصّل",
      value: "تصنيف روائي",
      kind: "agreed",
      source: "كتب علوم القرآن (الإتقان للسيوطي) في تقسيم السور",
      note:
        "الطوال والمئون والمثاني والمفصّل تقسيم اصطلاحي مروي في كتب علوم القرآن، مع اختلاف يسير في حدود المفصّل.",
    },
    {
      id: "makki-madani-count",
      label: "السور المكية والمدنية (المشهور)",
      value: `${t.meccanSurahs} مكية · ${t.medinanSurahs} مدنية`,
      kind: "computed",
      source: "تصنيف revelationType في public/data/quran (نص المصحف في المشروع)",
      method: m,
      note: "التصنيف بحسب بيانات المشروع؛ وفي بعض السور خلاف مشهور بين أهل العلم.",
    },
    {
      id: "computed-words",
      label: "كلمات النص (حساب آلي)",
      value: t.words,
      kind: "computed",
      source: "نص المصحف العثماني في public/data/quran — mushaf=1",
      method: m,
    },
    {
      id: "computed-letters",
      label: "الحروف الهجائية بعد التجريد (حساب آلي)",
      value: t.letters,
      kind: "computed",
      source: "نص المصحف العثماني في public/data/quran — mushaf=1",
      method: m,
    },
    {
      id: "longest-surah",
      label: "أطول سورة بعدد الآيات",
      value: `${e.longestSurah.name.replace(/^سُورَةُ\s*/u, "")} (${e.longestSurah.ayahs})`,
      kind: "computed",
      source: "public/data/quran/surah-*.json",
      method: m,
    },
    {
      id: "shortest-surah",
      label: "أقصر سورة بعدد الآيات",
      value: `${e.shortestSurah.name.replace(/^سُورَةُ\s*/u, "")} (${e.shortestSurah.ayahs})`,
      kind: "computed",
      source: "public/data/quran/surah-*.json",
      method: m,
    },
    {
      id: "longest-ayah",
      label: "أطول آية (حروف مجرّدة)",
      value: `${e.longestAyah.surah}:${e.longestAyah.ayah} (${e.longestAyah.len} حرفًا)`,
      kind: "computed",
      source: "public/data/quran/surah-*.json",
      method: m,
    },
    {
      id: "shortest-ayah",
      label: "أقصر آية (حروف مجرّدة)",
      value: `${e.shortestAyah.surah}:${e.shortestAyah.ayah} (${e.shortestAyah.len} حرفًا)`,
      kind: "computed",
      source: "public/data/quran/surah-*.json",
      method: m,
    },
  ];

  return catalog;
}

export function assertQuranStatsCatalog(stats: QuranStat[]): void {
  for (const s of stats) {
    if (!s.source?.trim()) throw new Error(`QuranStat بلا مصدر: ${s.id}`);
    if (s.kind === "disputed" && (s.variants?.length ?? 0) < 2) {
      throw new Error(`disputed بلا variants كافية: ${s.id}`);
    }
    if (s.id === "ayat-kufi" && !/كوف/u.test(String(s.label) + (s.note ?? ""))) {
      throw new Error("٦٢٣٦ يجب أن تُوسم بالعدّ الكوفي");
    }
    const blob = [s.source, s.note, ...(s.variants ?? []).flatMap((v) => [v.source, v.attribution])]
      .join("\n")
      .toLowerCase();
    for (const bad of FORBIDDEN_STAT_SOURCES) {
      if (blob.includes(bad.toLowerCase())) {
        throw new Error(`مصدر ممنوع في ${s.id}: ${bad}`);
      }
    }
  }
}
