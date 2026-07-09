import { useEffect, useMemo, useState } from "react";
import { Search, Star, BookOpen, Heart } from "lucide-react";
import { applyPageSeo } from "@/lib/seo";

/* ─── بيانات الأسماء الحسنى ─── */
type AsmaaEntry = {
  num: number;
  arabic: string;
  transliteration: string;
  meaning: string;
  reference: string;
  benefit: string;
  category: string;
};

const CATEGORIES = ["الكل", "الجلال", "الجمال", "الرحمة", "القدرة", "العلم", "الخلق", "العدل"];

const ASMAA: AsmaaEntry[] = [
  { num:1,  arabic:"الله",       transliteration:"Allah",         meaning:"الاسم الجامع لجميع صفات الألوهية",              reference:"﴿هُوَ اللَّهُ الَّذِي لَا إِلَٰهَ إِلَّا هُوَ﴾ الحشر:22", benefit:"ذكره يجمع كل خير",                              category:"الجلال" },
  { num:2,  arabic:"الرحمن",    transliteration:"Ar-Rahman",     meaning:"واسع الرحمة لجميع الخلق",                        reference:"﴿الرَّحْمَٰنُ عَلَى الْعَرْشِ اسْتَوَىٰ﴾ طه:5",          benefit:"من أكثر من ذكره لان قلبه رحيماً",               category:"الرحمة" },
  { num:3,  arabic:"الرحيم",    transliteration:"Ar-Raheem",     meaning:"خاصّ الرحمة بالمؤمنين",                          reference:"﴿وَكَانَ بِالْمُؤْمِنِينَ رَحِيمًا﴾ الأحزاب:43",        benefit:"يفتح أبواب الرحمة الخاصة",                       category:"الرحمة" },
  { num:4,  arabic:"الملك",     transliteration:"Al-Malik",      meaning:"المالك الحقيقي لكل شيء",                        reference:"﴿الْمَلِكُ الْقُدُّوسُ السَّلَامُ﴾ الحشر:23",           benefit:"قراءته بعد الفجر تُغني عن الفقر",               category:"الجلال" },
  { num:5,  arabic:"القدوس",    transliteration:"Al-Quddus",     meaning:"المنزّه عن كل عيب ونقص",                         reference:"﴿الْمَلِكُ الْقُدُّوسُ السَّلَامُ﴾ الحشر:23",           benefit:"يطهّر القلب من الأدران",                         category:"الجلال" },
  { num:6,  arabic:"السلام",    transliteration:"As-Salam",      meaning:"ذو السلامة من كل نقص",                           reference:"﴿الْمَلِكُ الْقُدُّوسُ السَّلَامُ الْمُؤْمِنُ﴾ الحشر:23",benefit:"من ذكره يمنح الطمأنينة والسكينة",               category:"الجمال" },
  { num:7,  arabic:"المؤمن",    transliteration:"Al-Mu'min",     meaning:"المصدق عباده، المؤمِّن من خوفه",                 reference:"﴿الْمُؤْمِنُ الْمُهَيْمِنُ﴾ الحشر:23",                benefit:"يثبّت الإيمان في القلب",                         category:"الجمال" },
  { num:8,  arabic:"المهيمن",   transliteration:"Al-Muhaymin",   meaning:"الرقيب الشاهد على كل شيء",                       reference:"﴿الْمُهَيْمِنُ الْعَزِيزُ الْجَبَّارُ﴾ الحشر:23",      benefit:"يورث الأمانة والحفظ",                            category:"الجلال" },
  { num:9,  arabic:"العزيز",    transliteration:"Al-Aziz",       meaning:"الغالب الذي لا يُغلب",                           reference:"﴿إِنَّ اللَّهَ عَزِيزٌ حَكِيمٌ﴾ البقرة:228",           benefit:"من ذكره تأتيه العزة من الله",                    category:"القدرة" },
  { num:10, arabic:"الجبار",    transliteration:"Al-Jabbar",     meaning:"القاهر الذي يجبر الكسر",                         reference:"﴿الْعَزِيزُ الْجَبَّارُ الْمُتَكَبِّرُ﴾ الحشر:23",     benefit:"يشفي الكسر ويجبر الخاطر",                       category:"القدرة" },
  { num:11, arabic:"المتكبر",   transliteration:"Al-Mutakabbir", meaning:"المتعظّم الذي له الكبرياء",                       reference:"﴿الْجَبَّارُ الْمُتَكَبِّرُ﴾ الحشر:23",               benefit:"يكبر عن الذل ويعز أمام الظالمين",               category:"الجلال" },
  { num:12, arabic:"الخالق",    transliteration:"Al-Khaliq",     meaning:"المُبدع الموجد من العدم",                        reference:"﴿هُوَ اللَّهُ الْخَالِقُ الْبَارِئُ﴾ الحشر:24",        benefit:"يجدد الهمة ويوسع آفاق التفكير",                 category:"الخلق" },
  { num:13, arabic:"البارئ",    transliteration:"Al-Bari'",      meaning:"الخالق المميّز بين الخلق",                        reference:"﴿الْخَالِقُ الْبَارِئُ الْمُصَوِّرُ﴾ الحشر:24",        benefit:"يُصلح الأحوال ويُفرّق الحق من الباطل",          category:"الخلق" },
  { num:14, arabic:"المصوّر",   transliteration:"Al-Musawwir",   meaning:"واهب الصور والأشكال",                             reference:"﴿الْبَارِئُ الْمُصَوِّرُ﴾ الحشر:24",                  benefit:"يمنح الجمال الحقيقي في الخلق",                  category:"الخلق" },
  { num:15, arabic:"الغفار",    transliteration:"Al-Ghaffar",    meaning:"كثير المغفرة والعفو",                             reference:"﴿إِنَّنِي أَنَا اللَّهُ لَا إِلَٰهَ إِلَّا أَنَا فَاعْبُدْنِي﴾ طه:14",benefit:"يكثر الاستغفار ليفتح أبواب الرحمة",     category:"الرحمة" },
  { num:16, arabic:"القهار",    transliteration:"Al-Qahhar",     meaning:"الغالب لكل شيء بالقهر والقدرة",                  reference:"﴿وَهُوَ الْوَاحِدُ الْقَهَّارُ﴾ الرعد:16",            benefit:"يكسر الجبابرة وينصر المظلوم",                   category:"القدرة" },
  { num:17, arabic:"الوهاب",    transliteration:"Al-Wahhab",     meaning:"كثير العطاء بلا منّة",                            reference:"﴿رَبَّنَا لَا تُزِغْ قُلُوبَنَا وَهَبْ لَنَا﴾ آل عمران:8",benefit:"يُكثر العطاء والنعم",                          category:"الرحمة" },
  { num:18, arabic:"الرزاق",    transliteration:"Ar-Razzaq",     meaning:"الضامن لأرزاق جميع الخلق",                       reference:"﴿إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ﴾ الذاريات:58",benefit:"يوسّع الرزق ويبارك في المعيشة",              category:"الرحمة" },
  { num:19, arabic:"الفتّاح",   transliteration:"Al-Fattah",     meaning:"فاتح أبواب الخير والرحمة",                        reference:"﴿فَفَتَحْنَا أَبْوَابَ السَّمَاءِ﴾ القمر:11",           benefit:"يفتح المغلق من الأبواب",                        category:"الجمال" },
  { num:20, arabic:"العليم",    transliteration:"Al-Alim",       meaning:"المحيط علمه بكل شيء",                            reference:"﴿وَاللَّهُ بِكُلِّ شَيْءٍ عَلِيمٌ﴾ البقرة:282",        benefit:"يطلب منه العلم النافع",                          category:"العلم" },
  { num:21, arabic:"القابض",    transliteration:"Al-Qabid",      meaning:"القابض الأرزاق بحكمة",                            reference:"﴿وَاللَّهُ يَقْبِضُ وَيَبْسُطُ﴾ البقرة:245",           benefit:"التسليم والرضا بقضاء الله",                     category:"القدرة" },
  { num:22, arabic:"الباسط",    transliteration:"Al-Basit",      meaning:"الموسّع للأرزاق والخيرات",                        reference:"﴿وَيَبْسُطُ وَإِلَيْهِ تُرْجَعُونَ﴾ البقرة:245",       benefit:"يبسط الرزق ويوسّع الحال",                       category:"الرحمة" },
  { num:23, arabic:"الخافض",    transliteration:"Al-Khafid",     meaning:"الخافض للمتجبرين والطغاة",                        reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يُذلّ الجبابرة",                                 category:"العدل" },
  { num:24, arabic:"الرافع",    transliteration:"Ar-Rafi'",      meaning:"رافع درجات المؤمنين",                             reference:"﴿يَرْفَعِ اللَّهُ الَّذِينَ آمَنُوا﴾ المجادلة:11",     benefit:"يرفع المؤمن درجات",                             category:"الرحمة" },
  { num:25, arabic:"المعزّ",    transliteration:"Al-Mu'izz",     meaning:"معطي العزة لمن يشاء",                             reference:"﴿تُعِزُّ مَنْ تَشَاءُ وَتُذِلُّ مَنْ تَشَاءُ﴾ آل عمران:26",benefit:"يطلب منه العز الحقيقي",                      category:"القدرة" },
  { num:26, arabic:"المذلّ",    transliteration:"Al-Mudhill",    meaning:"مذلّ الجبابرة والطغاة",                           reference:"﴿وَتُذِلُّ مَنْ تَشَاءُ﴾ آل عمران:26",               benefit:"الحذر من الغرور والتكبر",                       category:"العدل" },
  { num:27, arabic:"السميع",    transliteration:"As-Sami'",      meaning:"المحيط سمعه بكل ما يقال",                        reference:"﴿إِنَّهُ هُوَ السَّمِيعُ الْعَلِيمُ﴾ الأنفال:17",      benefit:"يعلم بدعائك ويسمعه",                            category:"العلم" },
  { num:28, arabic:"البصير",    transliteration:"Al-Basir",      meaning:"المحيط بصره بكل ما يُرى",                         reference:"﴿وَاللَّهُ بَصِيرٌ بِمَا يَعْمَلُونَ﴾ الحشر:18",      benefit:"يدفع عن نفسه التهاون بالأعمال",                category:"العلم" },
  { num:29, arabic:"الحكم",     transliteration:"Al-Hakam",      meaning:"الحاكم الذي لا يُردّ حكمه",                      reference:"﴿أَلَيْسَ اللَّهُ بِأَحْكَمِ الْحَاكِمِينَ﴾ التين:8",  benefit:"يحتكم إليه في كل خلاف",                        category:"العدل" },
  { num:30, arabic:"العدل",     transliteration:"Al-Adl",        meaning:"العادل في أحكامه وقضائه",                        reference:"﴿وَتَمَّتْ كَلِمَتُ رَبِّكَ صِدْقًا وَعَدْلًا﴾ الأنعام:115",benefit:"يعدل في حياته ويطلب العدل",                 category:"العدل" },
  { num:31, arabic:"اللطيف",    transliteration:"Al-Latif",      meaning:"الخبير ببواطن الأمور",                            reference:"﴿اللَّهُ لَطِيفٌ بِعِبَادِهِ﴾ الشورى:19",             benefit:"يُيسّر الأمور بلطف خفي",                        category:"الجمال" },
  { num:32, arabic:"الخبير",    transliteration:"Al-Khabir",     meaning:"العالم بدقائق الأمور",                            reference:"﴿إِنَّهُ خَبِيرٌ بِمَا تَعْمَلُونَ﴾ الحشر:18",        benefit:"يوقن بأن الله يعلم ما يخفيه",                  category:"العلم" },
  { num:33, arabic:"الحليم",    transliteration:"Al-Halim",      meaning:"الصابر المتأني الذي لا يعجل",                    reference:"﴿إِنَّ اللَّهَ غَفُورٌ حَلِيمٌ﴾ البقرة:225",          benefit:"يتحلى بالصبر والحلم",                           category:"الجمال" },
  { num:34, arabic:"العظيم",    transliteration:"Al-Azim",       meaning:"ذو العظمة الكاملة",                               reference:"﴿وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾ البقرة:255",            benefit:"يُعظّم الله في قلبه",                           category:"الجلال" },
  { num:35, arabic:"الغفور",    transliteration:"Al-Ghafur",     meaning:"الساتر للذنوب الغافر لها",                        reference:"﴿إِنَّ اللَّهَ غَفُورٌ رَحِيمٌ﴾ البقرة:173",          benefit:"كثرة الاستغفار تجلب الرحمة",                    category:"الرحمة" },
  { num:36, arabic:"الشكور",    transliteration:"Ash-Shakur",    meaning:"المثيب على القليل من الطاعة",                     reference:"﴿إِنَّ اللَّهَ شَاكِرٌ عَلِيمٌ﴾ البقرة:158",          benefit:"يشكر الله على كل نعمة",                         category:"الجمال" },
  { num:37, arabic:"العليّ",    transliteration:"Al-Ali",        meaning:"المتعالي فوق كل شيء",                            reference:"﴿وَهُوَ الْعَلِيُّ الْعَظِيمُ﴾ البقرة:255",            benefit:"يرفع همته إلى الأعلى",                          category:"الجلال" },
  { num:38, arabic:"الكبير",    transliteration:"Al-Kabir",      meaning:"الكبير في ذاته وصفاته",                           reference:"﴿عَالِمُ الْغَيْبِ وَالشَّهَادَةِ الْكَبِيرُ﴾ الرعد:9", benefit:"يستحضر عظمة الله في كل حال",                  category:"الجلال" },
  { num:39, arabic:"الحفيظ",    transliteration:"Al-Hafiz",      meaning:"الحافظ لكل شيء من الضياع",                       reference:"﴿إِنَّ رَبِّي عَلَىٰ كُلِّ شَيْءٍ حَفِيظٌ﴾ هود:57",   benefit:"يطلب منه الحفظ من الشرور",                     category:"القدرة" },
  { num:40, arabic:"المقيت",    transliteration:"Al-Muqit",      meaning:"المقتدر الحافظ المقوّت",                          reference:"﴿وَكَانَ اللَّهُ عَلَىٰ كُلِّ شَيْءٍ مُقِيتًا﴾ النساء:85",benefit:"يمد الجسد بالقوة المعنوية",                  category:"القدرة" },
  { num:41, arabic:"الحسيب",    transliteration:"Al-Hasib",      meaning:"الكافي الحاسب لأعمال العباد",                     reference:"﴿إِنَّ اللَّهَ كَانَ عَلَىٰ كُلِّ شَيْءٍ حَسِيبًا﴾ النساء:86",benefit:"يُحاسب نفسه قبل أن يُحاسَب",              category:"العدل" },
  { num:42, arabic:"الجليل",    transliteration:"Al-Jalil",      meaning:"ذو الجلال والعظمة",                               reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يهابه الخلق ويجلّه في القلب",                   category:"الجلال" },
  { num:43, arabic:"الكريم",    transliteration:"Al-Karim",      meaning:"الكثير العطاء الجزيل الإكرام",                   reference:"﴿يَا أَيُّهَا الْإِنسَانُ مَا غَرَّكَ بِرَبِّكَ الْكَرِيمِ﴾ الانفطار:6",benefit:"يسخو ويكرم تأدباً مع الله",         category:"الجمال" },
  { num:44, arabic:"الرقيب",    transliteration:"Ar-Raqib",      meaning:"المطلع على كل شيء",                               reference:"﴿وَكَانَ اللَّهُ عَلَىٰ كُلِّ شَيْءٍ رَقِيبًا﴾ الأحزاب:52",benefit:"يراقب أعماله علناً وسراً",                 category:"العلم" },
  { num:45, arabic:"المجيب",    transliteration:"Al-Mujib",      meaning:"المجيب لدعاء عباده",                              reference:"﴿إِنَّ رَبِّي قَرِيبٌ مُجِيبٌ﴾ هود:61",              benefit:"يوقن بإجابة الدعاء",                            category:"الرحمة" },
  { num:46, arabic:"الواسع",    transliteration:"Al-Wasi'",      meaning:"الواسع في العلم والرحمة",                         reference:"﴿إِنَّ اللَّهَ وَاسِعٌ عَلِيمٌ﴾ البقرة:115",          benefit:"يتسع قلبه بالأمل في الله",                      category:"الرحمة" },
  { num:47, arabic:"الحكيم",    transliteration:"Al-Hakim",      meaning:"ذو الحكمة البالغة في الخلق",                      reference:"﴿وَهُوَ الْعَزِيزُ الْحَكِيمُ﴾ إبراهيم:4",            benefit:"يتعلم الحكمة من سنة الله",                      category:"العلم" },
  { num:48, arabic:"الودود",    transliteration:"Al-Wadud",      meaning:"المحب لعباده المؤمنين",                           reference:"﴿إِنَّ رَبِّي رَحِيمٌ وَدُودٌ﴾ هود:90",              benefit:"يُحبّه الله وتُحبّه قلوب الخلق",               category:"الجمال" },
  { num:49, arabic:"المجيد",    transliteration:"Al-Majid",      meaning:"ذو المجد والشرف العظيم",                          reference:"﴿إِنَّهُ حَمِيدٌ مَجِيدٌ﴾ هود:73",                  benefit:"يرفع الهمة للأعمال الجليلة",                   category:"الجلال" },
  { num:50, arabic:"الباعث",    transliteration:"Al-Ba'ith",     meaning:"الباعث للخلق يوم القيامة",                        reference:"﴿ثُمَّ إِنَّكُمْ يَوْمَ الْقِيَامَةِ تُبْعَثُونَ﴾ المؤمنون:16",benefit:"يستعد للبعث والحساب",                   category:"القدرة" },
  { num:51, arabic:"الشهيد",    transliteration:"Ash-Shahid",    meaning:"الشاهد على كل شيء",                               reference:"﴿إِنَّ اللَّهَ كَانَ عَلَىٰ كُلِّ شَيْءٍ شَهِيدًا﴾ النساء:33",benefit:"يحضر الشهادة في قلبه",                    category:"العلم" },
  { num:52, arabic:"الحق",      transliteration:"Al-Haq",        meaning:"ذو الحقيقة الثابتة الدائمة",                     reference:"﴿فَذَٰلِكُمُ اللَّهُ رَبُّكُمُ الْحَقُّ﴾ يونس:32",    benefit:"يتمسك بالحق في قوله وفعله",                    category:"الجلال" },
  { num:53, arabic:"الوكيل",    transliteration:"Al-Wakil",      meaning:"المتولي أمور عباده",                              reference:"﴿وَكَفَىٰ بِاللَّهِ وَكِيلًا﴾ النساء:81",             benefit:"يتوكل على الله في أموره",                       category:"القدرة" },
  { num:54, arabic:"القوي",     transliteration:"Al-Qawi",       meaning:"الكامل القوة الذي لا يُغلب",                     reference:"﴿إِنَّ اللَّهَ قَوِيٌّ عَزِيزٌ﴾ الحج:74",             benefit:"يستمد القوة من الله",                           category:"القدرة" },
  { num:55, arabic:"المتين",    transliteration:"Al-Matin",      meaning:"الشديد القوة الراسخ",                             reference:"﴿إِنَّ اللَّهَ هُوَ الرَّزَّاقُ ذُو الْقُوَّةِ الْمَتِينُ﴾ الذاريات:58",benefit:"يثبت في المحن ويصبر",             category:"القدرة" },
  { num:56, arabic:"الوليّ",    transliteration:"Al-Wali",       meaning:"ناصر المؤمنين ومتولي أمورهم",                    reference:"﴿وَاللَّهُ وَلِيُّ الْمُؤْمِنِينَ﴾ آل عمران:68",       benefit:"يطلب ولاية الله وحمايته",                      category:"الرحمة" },
  { num:57, arabic:"الحميد",    transliteration:"Al-Hamid",      meaning:"المستحق للحمد والثناء",                           reference:"﴿إِنَّ اللَّهَ لَغَنِيٌّ حَمِيدٌ﴾ لقمان:26",           benefit:"يحمد الله في كل حال",                          category:"الجمال" },
  { num:58, arabic:"المُحصي",   transliteration:"Al-Muhsi",      meaning:"العالم بكل شيء على التفصيل",                     reference:"﴿وَأَحْصَىٰ كُلَّ شَيْءٍ عَدَدًا﴾ الجن:28",           benefit:"يدقق في أعماله ويتقن",                         category:"العلم" },
  { num:59, arabic:"المبدئ",    transliteration:"Al-Mubdi'",     meaning:"المبتدئ للخلق من غير مثال",                      reference:"﴿إِنَّهُ هُوَ يُبْدِئُ وَيُعِيدُ﴾ البروج:13",         benefit:"يجدد العزيمة ويبتكر",                           category:"الخلق" },
  { num:60, arabic:"المعيد",    transliteration:"Al-Mu'id",      meaning:"المعيد للخلق بعد فنائه",                          reference:"﴿وَهُوَ الَّذِي يَبْدَأُ الْخَلْقَ ثُمَّ يُعِيدُهُ﴾ الروم:27",benefit:"يؤمن بالبعث والنشور",                    category:"القدرة" },
  { num:61, arabic:"المُحيي",   transliteration:"Al-Muhyi",      meaning:"واهب الحياة لكل حي",                             reference:"﴿إِنَّ الَّذِي أَحْيَاهَا لَمُحْيِي الْمَوْتَىٰ﴾ فصلت:39",benefit:"يطلب منه حياة القلب",                      category:"القدرة" },
  { num:62, arabic:"المميت",    transliteration:"Al-Mumit",      meaning:"خالق الموت ومسبّبه",                              reference:"﴿الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ﴾ الملك:2",      benefit:"يستعد للموت بالعمل الصالح",                    category:"القدرة" },
  { num:63, arabic:"الحيّ",     transliteration:"Al-Hayy",       meaning:"الحي الدائم الذي لا يموت",                        reference:"﴿اللَّهُ لَا إِلَٰهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ﴾ البقرة:255",benefit:"يستمد منه الحياة الروحية",             category:"الجلال" },
  { num:64, arabic:"القيّوم",   transliteration:"Al-Qayyum",     meaning:"القائم بنفسه المقيم لغيره",                       reference:"﴿الْحَيُّ الْقَيُّومُ﴾ البقرة:255",                   benefit:"يقوم بواجباته اتكالاً على الله",               category:"الجلال" },
  { num:65, arabic:"الواجد",    transliteration:"Al-Wajid",      meaning:"الذي لا يعوزه شيء",                              reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يطلب منه الغنى بالكفاية",                       category:"الجمال" },
  { num:66, arabic:"الماجد",    transliteration:"Al-Majid",      meaning:"الكثير الخير الواسع الجود",                       reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يتخلق بالجود والكرم",                           category:"الجمال" },
  { num:67, arabic:"الواحد",    transliteration:"Al-Wahid",      meaning:"المنفرد بالذات والصفات",                          reference:"﴿وَإِلَٰهُكُمْ إِلَٰهٌ وَاحِدٌ﴾ البقرة:163",          benefit:"يوحّد الله توحيداً كاملاً",                     category:"الجلال" },
  { num:68, arabic:"الأحد",     transliteration:"Al-Ahad",       meaning:"المتوحد بالكمال الذي لا ثاني له",                reference:"﴿قُلْ هُوَ اللَّهُ أَحَدٌ﴾ الإخلاص:1",              benefit:"ترسّخ العقيدة الصحيحة في القلب",               category:"الجلال" },
  { num:69, arabic:"الصمد",     transliteration:"As-Samad",      meaning:"المقصود في كل الحاجات",                           reference:"﴿اللَّهُ الصَّمَدُ﴾ الإخلاص:2",                     benefit:"يصمد ويصبر ويلجأ لله",                         category:"الجلال" },
  { num:70, arabic:"القادر",    transliteration:"Al-Qadir",      meaning:"الكامل القدرة على كل شيء",                       reference:"﴿إِنَّ اللَّهَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ﴾ البقرة:20",benefit:"لا يستحيل عليه شيء تطلبه",                  category:"القدرة" },
  { num:71, arabic:"المقتدر",   transliteration:"Al-Muqtadir",   meaning:"النافذ القدرة المُحكم",                           reference:"﴿عِنْدَ مَلِيكٍ مُقْتَدِرٍ﴾ القمر:55",               benefit:"يثق بأن الله يُغير الأحوال",                    category:"القدرة" },
  { num:72, arabic:"المقدّم",   transliteration:"Al-Muqaddim",   meaning:"المقدِّم ما يشاء من خلقه",                        reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يقدم الخير والطاعة",                            category:"العدل" },
  { num:73, arabic:"المؤخّر",   transliteration:"Al-Mu'akhkhir", meaning:"المؤخِّر ما يشاء",                                reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يعلم أن لكل أمر وقته المناسب",                  category:"العدل" },
  { num:74, arabic:"الأول",     transliteration:"Al-Awwal",      meaning:"السابق لكل شيء بلا ابتداء",                      reference:"﴿هُوَ الْأَوَّلُ وَالْآخِرُ﴾ الحديد:3",              benefit:"يعلم أن الله كان قبل كل شيء",                  category:"الجلال" },
  { num:75, arabic:"الآخر",     transliteration:"Al-Akhir",      meaning:"الباقي بعد فناء كل شيء",                         reference:"﴿وَالْآخِرُ وَالظَّاهِرُ وَالْبَاطِنُ﴾ الحديد:3",     benefit:"يوقن بوحدانية الباقي سبحانه",                  category:"الجلال" },
  { num:76, arabic:"الظاهر",    transliteration:"Az-Zahir",      meaning:"الظاهر بآياته وأدلته",                            reference:"﴿الظَّاهِرُ وَالْبَاطِنُ﴾ الحديد:3",                 benefit:"يتأمل آيات الله الكونية",                       category:"الجلال" },
  { num:77, arabic:"الباطن",    transliteration:"Al-Batin",      meaning:"المحتجب عن الأبصار",                             reference:"﴿وَالْبَاطِنُ وَهُوَ بِكُلِّ شَيْءٍ عَلِيمٌ﴾ الحديد:3",benefit:"يعلم أن الله يعلم سره",                      category:"الجلال" },
  { num:78, arabic:"الوالي",    transliteration:"Al-Wali",       meaning:"المتولي أمور الخلق",                              reference:"﴿اللَّهُ وَلِيُّ الَّذِينَ آمَنُوا﴾ البقرة:257",       benefit:"يطلب ولايته وحفظه",                            category:"الرحمة" },
  { num:79, arabic:"المتعالي",  transliteration:"Al-Muta'ali",   meaning:"المتنزّه عن كل نقص",                              reference:"﴿عَالِمُ الْغَيْبِ وَالشَّهَادَةِ الْكَبِيرُ الْمُتَعَالِ﴾ الرعد:9",benefit:"يرفع نفسه عن الذنوب",              category:"الجلال" },
  { num:80, arabic:"البَرّ",    transliteration:"Al-Barr",       meaning:"المحسن البر بعباده",                              reference:"﴿إِنَّهُ هُوَ الْبَرُّ الرَّحِيمُ﴾ الطور:28",          benefit:"يتبرر من الذنوب بالعمل الصالح",                category:"الرحمة" },
  { num:81, arabic:"التواب",    transliteration:"At-Tawwab",     meaning:"كثير القبول للتوبة",                              reference:"﴿إِنَّ اللَّهَ هُوَ التَّوَّابُ الرَّحِيمُ﴾ التوبة:118",benefit:"يتوب كثيراً ويعود لربه",                     category:"الرحمة" },
  { num:82, arabic:"المنتقم",   transliteration:"Al-Muntaqim",   meaning:"المنتقم من المجرمين",                             reference:"﴿إِنَّا مِنَ الْمُجْرِمِينَ مُنتَقِمُونَ﴾ السجدة:22",  benefit:"يحذر الظلم خوفاً من انتقام الله",              category:"العدل" },
  { num:83, arabic:"العفو",     transliteration:"Al-Afuw",       meaning:"العافي عن عباده المذنبين",                        reference:"﴿إِنَّ اللَّهَ كَانَ عَفُوًّا غَفُورًا﴾ النساء:43",   benefit:"يعفو عمن أساء إليه",                           category:"الرحمة" },
  { num:84, arabic:"الرؤوف",    transliteration:"Ar-Ra'uf",      meaning:"بالغ الرأفة والرحمة",                             reference:"﴿إِنَّ اللَّهَ بِالنَّاسِ لَرَءُوفٌ رَحِيمٌ﴾ البقرة:143",benefit:"يتعامل مع الناس بالرفق",                    category:"الرحمة" },
  { num:85, arabic:"مالك الملك",transliteration:"Malik al-Mulk", meaning:"مالك الملك الحقيقي",                              reference:"﴿قُلِ اللَّهُمَّ مَالِكَ الْمُلْكِ﴾ آل عمران:26",      benefit:"يعلم أن الملك لله وحده",                       category:"الجلال" },
  { num:86, arabic:"ذو الجلال والإكرام", transliteration:"Dhul-Jalal", meaning:"ذو العظمة والإكرام لعباده",               reference:"﴿تَبَارَكَ اسْمُ رَبِّكَ ذِي الْجَلَالِ وَالْإِكْرَامِ﴾ الرحمن:78",benefit:"يكثر من هذا الذكر",                   category:"الجلال" },
  { num:87, arabic:"المقسط",    transliteration:"Al-Muqsit",     meaning:"العادل في قضائه",                                 reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يعدل في حكمه",                                 category:"العدل" },
  { num:88, arabic:"الجامع",    transliteration:"Al-Jami'",      meaning:"الجامع للخلق يوم القيامة",                        reference:"﴿رَبَّنَا إِنَّكَ جَامِعُ النَّاسِ﴾ آل عمران:9",      benefit:"يجمع شتات قلبه",                               category:"القدرة" },
  { num:89, arabic:"الغني",     transliteration:"Al-Ghani",      meaning:"الغني عن جميع خلقه",                             reference:"﴿وَاللَّهُ الْغَنِيُّ وَأَنتُمُ الْفُقَرَاءُ﴾ محمد:38",benefit:"يستغني بالله عن غيره",                       category:"الجلال" },
  { num:90, arabic:"المغني",    transliteration:"Al-Mughni",     meaning:"المُغني لعباده عن الحاجة",                        reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يطلب منه الغنى والقناعة",                       category:"الرحمة" },
  { num:91, arabic:"المانع",    transliteration:"Al-Mani'",      meaning:"المانع ما يشاء بحكمته",                           reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يعلم أن ما مُنع هو خير",                        category:"العدل" },
  { num:92, arabic:"الضار",     transliteration:"Ad-Darr",       meaning:"خالق الضر لمن يشاء بحكمة",                       reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يحذر الأذى ويستعيذ بالله",                     category:"القدرة" },
  { num:93, arabic:"النافع",    transliteration:"An-Nafi'",      meaning:"خالق النفع ومُسبّبه",                             reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يطلب النفع من الله وحده",                       category:"الرحمة" },
  { num:94, arabic:"النور",     transliteration:"An-Nur",        meaning:"نور السماوات والأرض",                             reference:"﴿اللَّهُ نُورُ السَّمَاوَاتِ وَالْأَرْضِ﴾ النور:35",  benefit:"يطلب النور في قلبه وعمله",                     category:"الجمال" },
  { num:95, arabic:"الهادي",    transliteration:"Al-Hadi",       meaning:"الهادي من يشاء إلى الصراط",                      reference:"﴿وَإِنَّ اللَّهَ لَهَادِ الَّذِينَ آمَنُوا﴾ الحج:54", benefit:"يطلب الهداية في الصلاة",                       category:"الرحمة" },
  { num:96, arabic:"البديع",    transliteration:"Al-Badi'",      meaning:"مبتدع الأشياء بلا مثال",                         reference:"﴿بَدِيعُ السَّمَاوَاتِ وَالْأَرْضِ﴾ البقرة:117",      benefit:"يتأمل بديع صنع الله",                          category:"الخلق" },
  { num:97, arabic:"الباقي",    transliteration:"Al-Baqi",       meaning:"الدائم الذي لا ينتهي",                           reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يعلم أن الباقي لله وحده",                       category:"الجلال" },
  { num:98, arabic:"الوارث",    transliteration:"Al-Warith",     meaning:"الباقي بعد فناء الخلق",                          reference:"﴿وَإِنَّا لَنَحْنُ نُحْيِي وَنُمِيتُ وَنَحْنُ الْوَارِثُونَ﴾ الحجر:23",benefit:"يزهد في الفانيات",              category:"الجلال" },
  { num:99, arabic:"الرشيد",    transliteration:"Ar-Rashid",     meaning:"الموصل للخلق مقاصدهم",                            reference:"الحديث: تسعة وتسعون اسماً",                       benefit:"يطلب الرشاد في كل أمر",                         category:"العلم" },
];

/* ─── الصفحة ─── */
export default function AsmaaHusnaPage() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("الكل");
  const [selected, setSelected] = useState<AsmaaEntry | null>(null);
  const [favs, setFavs] = useState<Set<number>>(() => {
    try { return new Set(JSON.parse(localStorage.getItem("ah-favs") || "[]")); }
    catch { return new Set(); }
  });

  useEffect(() => {
    applyPageSeo({
      path: "/asma-husna",
      title: "الأسماء الحسنى — أسماء الله التسعة والتسعون | مجالس",
      description: "أسماء الله الحسنى التسعة والتسعون — كل اسم بمعناه وآيته ومنفعته وذكره.",
      keywords: ["أسماء الله الحسنى", "الله", "الرحمن", "الرحيم", "الأسماء الحسنى", "99 اسم"],
    });
  }, []);

  const toggleFav = (num: number) => {
    setFavs((prev) => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num); else next.add(num);
      localStorage.setItem("ah-favs", JSON.stringify([...next]));
      return next;
    });
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ASMAA.filter((a) => {
      const matchCat = category === "الكل" || a.category === category;
      const matchQ = !q || a.arabic.includes(q) || a.transliteration.toLowerCase().includes(q) || a.meaning.includes(q);
      return matchCat && matchQ;
    });
  }, [search, category]);

  return (
    <div className="page-shell ah-page">
      {/* ═══ Hero ═══ */}
      <div className="ah-hero">
        <div className="ah-hero__bismillah">بسم الله الرحمن الرحيم</div>
        <h1 className="ah-hero__title">الأسماء الحسنى</h1>
        <p className="ah-hero__sub">
          قال ﷺ: «إِنَّ لِلَّهِ تِسْعَةً وَتِسْعِينَ اسْمًا مِائَةً إِلَّا وَاحِدًا مَنْ أَحْصَاهَا دَخَلَ الْجَنَّةَ»
          <span className="ah-hero__source">متفق عليه</span>
        </p>
        <div className="ah-hero__stats">
          <span>99 اسماً</span>
          <span className="ah-hero__dot">·</span>
          <span>{filtered.length} ظاهر</span>
          <span className="ah-hero__dot">·</span>
          <span>{favs.size} محفوظ</span>
        </div>
      </div>

      {/* ═══ فلاتر ═══ */}
      <div className="ah-controls">
        <div className="ah-search-wrap">
          <Search size={16} className="ah-search-icon" aria-hidden="true" />
          <input
            className="ah-search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="ابحث عن اسم..."
            aria-label="بحث في الأسماء الحسنى"
          />
        </div>
        <div className="ah-cat-chips">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`ah-cat-chip${category === c ? " ah-cat-chip--active" : ""}`}
              onClick={() => setCategory(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* ═══ شبكة الأسماء ═══ */}
      {filtered.length === 0 ? (
        <p className="ah-empty">لا يوجد اسم مطابق للبحث.</p>
      ) : (
        <div className="ah-grid">
          {filtered.map((a) => (
            <button
              key={a.num}
              type="button"
              className="ah-card"
              onClick={() => setSelected(a)}
              aria-label={`${a.arabic} — ${a.meaning}`}
            >
              <span className="ah-card__num">{a.num}</span>
              <span className="ah-card__name">{a.arabic}</span>
              <span className="ah-card__trans">{a.transliteration}</span>
              <span className="ah-card__meaning">{a.meaning.slice(0, 35)}{a.meaning.length > 35 ? "…" : ""}</span>
              <button
                type="button"
                className={`ah-card__fav${favs.has(a.num) ? " ah-card__fav--active" : ""}`}
                onClick={(e) => { e.stopPropagation(); toggleFav(a.num); }}
                aria-label={favs.has(a.num) ? "إزالة من المحفوظات" : "إضافة للمحفوظات"}
              >
                <Heart size={13} strokeWidth={2} />
              </button>
            </button>
          ))}
        </div>
      )}

      {/* ═══ نافذة التفاصيل ═══ */}
      {selected && (
        <div
          className="ah-modal-backdrop"
          onClick={() => setSelected(null)}
          role="presentation"
        >
          <div
            className="ah-modal"
            role="dialog"
            aria-modal="true"
            aria-label={selected.arabic}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="ah-modal__head">
              <span className="ah-modal__num">{selected.num}</span>
              <h2 className="ah-modal__name">{selected.arabic}</h2>
              <span className="ah-modal__trans">{selected.transliteration}</span>
              <button
                type="button"
                className={`ah-modal__fav${favs.has(selected.num) ? " ah-modal__fav--active" : ""}`}
                onClick={() => toggleFav(selected.num)}
                aria-label="تفضيل"
              >
                <Heart size={18} />
              </button>
            </div>

            <div className="ah-modal__section">
              <span className="ah-modal__label"><BookOpen size={13} /> المعنى</span>
              <p className="ah-modal__text">{selected.meaning}</p>
            </div>

            <div className="ah-modal__section">
              <span className="ah-modal__label"><Star size={13} /> الدليل</span>
              <p className="ah-modal__text ah-modal__text--quran">{selected.reference}</p>
            </div>

            <div className="ah-modal__section">
              <span className="ah-modal__label">الفائدة والعمل</span>
              <p className="ah-modal__text">{selected.benefit}</p>
            </div>

            <div className="ah-modal__cat-badge">{selected.category}</div>

            <button
              type="button"
              className="ah-modal__close"
              onClick={() => setSelected(null)}
            >
              إغلاق
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
