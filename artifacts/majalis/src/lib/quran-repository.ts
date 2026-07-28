/**
 * Web port of Flutter `QuranRepository` — sample ayah + tafsir pairs.
 * Replace with JSON / API fetch in production without changing UI contracts.
 */

export type QuranVerseRecord = {
  verse: string;
  tafsir: string;
};

export const SAMPLE_VERSES_DATA: readonly QuranVerseRecord[] = [
  {
    verse: "بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ",
    tafsir:
      "أبتدئ قراءتي باسم الله مستعيناً به، الرَّحْمَنِ الذي وسعت رحمته كل شيء، الرَّحِيمِ بالمؤمنين.",
  },
  {
    verse: "الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ",
    tafsir: "الثناء والحمد لله وحده مالك جميع الخلائق والخلق، مربيهم بنعمه.",
  },
  {
    verse: "الرَّحْمَٰنِ الرَّحِيمِ",
    tafsir: "ثناء ثانٍ على الله تعالى بصفة الرحمة المباشرة الشاملة.",
  },
  {
    verse: "مَالِكِ يَوْمِ الدِّينِ",
    tafsir: "هو سبحانه المالك الوحيد والجامع للناس في يوم الجزاء والحساب.",
  },
  {
    verse: "إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ",
    tafsir: "نخصك وحدك بالعبادة، ولا نطلب المعونة والمدد إلا منك.",
  },
  {
    verse: "اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ",
    tafsir: "وِفْقْنا ودُلَّنا وثبّتنا على الطريق الواضح وهو الإسلام.",
  },
  {
    verse:
      "صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ",
    tafsir:
      "طريق النبيين والصديقين والشهداء، لا طريق المغضوب عليهم ولا الضالين.",
  },
] as const;

export const QuranRepository = {
  sampleVersesData: SAMPLE_VERSES_DATA,
  getVerses(): readonly QuranVerseRecord[] {
    return SAMPLE_VERSES_DATA;
  },
  getVerseTexts(): readonly string[] {
    return SAMPLE_VERSES_DATA.map((r) => r.verse);
  },
  getTafsir(index: number): string | null {
    return SAMPLE_VERSES_DATA[index]?.tafsir ?? null;
  },
} as const;
