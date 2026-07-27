/**
 * اختبار فهرس الحرف/الرقم وفصل المتن عن السند.
 * تشغيل: pnpm exec tsx src/lib/__tests__/hadith-access.test.ts
 */
import assert from "node:assert/strict";
import { normalizeArabic } from "../../shared/arabic-normalize";
import {
  extractDisplayMatn,
  hadithCorpusKey,
  hadithIndexLetter,
  hadithMatchesLetter,
  hadithNumberMatches,
  normalizeHadithDigits,
  splitHadithNarration,
} from "../hadith-access";

assert.equal(normalizeHadithDigits("١٢٣"), "123");
assert.equal(normalizeHadithDigits("حديث #٤٢"), "42");
assert.equal(hadithNumberMatches("7563", "٧٥٦٣"), true);
assert.equal(hadithNumberMatches("100", "10"), true);
assert.equal(hadithNumberMatches("100", "101"), false);

assert.equal(hadithIndexLetter("حب الوطن من الإيمان", null), "ح");
assert.equal(hadithIndexLetter("اطلبوا العلم ولو بالصين", "نص"), "ا");
assert.equal(
  hadithIndexLetter(null, 'قال رسول الله صلى الله عليه وسلم: "إنما الأعمال بالنيات"'),
  "ا",
);
assert.equal(hadithMatchesLetter("الصلاة عماد الدين", null, "ص"), true);
assert.equal(hadithMatchesLetter("نية المؤمن", "نص عن الإيمان", "ز"), false);

const bukhari1 =
  "حَدَّثَنَا الْحُمَيْدِيُّ عَبْدُ اللَّهِ بْنُ الزُّبَيْرِ ، قَالَ : حَدَّثَنَا سُفْيَانُ ، قَالَ : حَدَّثَنَا يَحْيَى بْنُ سَعِيدٍ الْأَنْصَارِيُّ ، قَالَ : أَخْبَرَنِي مُحَمَّدُ بْنُ إِبْرَاهِيمَ التَّيْمِيُّ ، أَنَّهُ سَمِعَ عَلْقَمَةَ بْنَ وَقَّاصٍ اللَّيْثِيَّ ، يَقُولُ : سَمِعْتُ عُمَرَ بْنَ الْخَطَّابِ رَضِيَ اللَّهُ عَنْهُ عَلَى الْمِنْبَرِ، قَالَ : سَمِعْتُ رَسُولَ اللَّهِ صَلَّى اللَّهُ عَلَيْهِ وَسَلَّمَ، يَقُولُ : \" إِنَّمَا الْأَعْمَالُ بِالنِّيَّاتِ، وَإِنَّمَا لِكُلِّ امْرِئٍ مَا نَوَى\"";

const parts1 = splitHadithNarration(bukhari1);
assert.equal(parts1.hasIsnad, true);
assert.match(normalizeArabic(parts1.matn), /الاعمال/);
assert.equal(normalizeArabic(parts1.matn).includes("حدثنا"), false);
assert.match(normalizeArabic(parts1.isnad), /حدثنا/);

const withMarks =
  "حَدَّثَنَا إِسْمَاعِيلُ، قَالَ حَدَّثَنِي مَالِكٌ، عَنْ هِشَامٍ، عَنْ أَبِيهِ، عَنْ عَبْدِ اللَّهِ، قَالَ سَمِعْتُ رَسُولَ اللَّهِ صلى الله عليه وسلم يَقُولُ ‏ \"‏ إِنَّ اللَّهَ لاَ يَقْبِضُ الْعِلْمَ انْتِزَاعًا ‏\"‏";
const parts2 = splitHadithNarration(withMarks);
assert.equal(parts2.hasIsnad, true);
assert.match(normalizeArabic(parts2.matn), /العلم/);
assert.equal(normalizeArabic(extractDisplayMatn(null, withMarks)).startsWith("حدثنا"), false);

const narrative =
  "حَدَّثَنَا عَمْرُو بْنُ خَالِدٍ، قَالَ حَدَّثَنَا زُهَيْرٌ، قَالَ حَدَّثَنَا أَبُو إِسْحَاقَ، عَنِ الْبَرَاءِ، أَنَّ النَّبِيَّ صلى الله عليه وسلم كَانَ أَوَّلَ مَا قَدِمَ الْمَدِينَةَ نَزَلَ عَلَى أَجْدَادِهِ";
const partsNarr = splitHadithNarration(narrative);
assert.equal(partsNarr.hasIsnad, true);
assert.match(normalizeArabic(partsNarr.matn), /النبي|المدينه|نزل/);
assert.equal(normalizeArabic(partsNarr.matn).startsWith("حدثنا"), false);

assert.equal(hadithCorpusKey("bukhari", "١"), "bukhari|1");
assert.equal(hadithCorpusKey("various", "1"), null);

const matnOnly = "إنما الأعمال بالنيات.";
const parts3 = splitHadithNarration(matnOnly);
assert.equal(parts3.hasIsnad, false);
assert.equal(normalizeArabic(parts3.matn).includes("الاعمال"), true);

console.log("hadith-access.test.ts: ok");
