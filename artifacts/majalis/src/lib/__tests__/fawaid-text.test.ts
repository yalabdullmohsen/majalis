import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { stripFawaidBoilerplate } from "../fawaid-text";

let passed = 0;
let failed = 0;

function assert(condition: boolean, label: string) {
  if (condition) {
    console.log(`  ✓ ${label}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${label}`);
    failed++;
  }
}

const sample =
  "من قرأ حرفاً من كتاب الله فله به حسنة. — فليُلزم المسلم العمل بما علم والدعوة إليه. وهذا من فوائد التدبر في كتاب الله والعمل بما فيه. كما دلّ عليه الكتاب والسنة.";

const cleaned = stripFawaidBoilerplate(sample);
assert(cleaned === "من قرأ حرفاً من كتاب الله فله به حسنة.", "يزيل الذيل الآلي ويبقي النص الأصلي");
assert(!/فليُلزم المسلم/.test(cleaned), "لا يبقى حشو الوعظ");

const sample2 =
  "من صلى عليّ صلاة صلى الله عليه بها عشراً، وهذا من هدي النبي ﷺ الذي يجب على المسلم معرفته والعمل به.";
const cleaned2 = stripFawaidBoilerplate(sample2);
assert(cleaned2 === "من صلى عليّ صلاة صلى الله عليه بها عشراً", "يزيل ذيل «على المسلم معرفته والعمل به»");

const sample3 =
  "من أنفق نفقة في سبيل الله كُتبت له بسبعمائة ضعف، وهذا أصل يُسترشد به في فهم الأحكام الشرعية وتطبيقها.";
const cleaned3 = stripFawaidBoilerplate(sample3);
assert(cleaned3 === "من أنفق نفقة في سبيل الله كُتبت له بسبعمائة ضعف", "يزيل ذيل «وتطبيقها»");

const sample4 =
  "معرفة أسباب النزول نافعة إذا ثبتت. وهذا يُقرأ بضابط العلم والعمل، مع ترك الغلو والاعتماد على الثابت من النصوص وكلام أهل العلم.";
const cleaned4 = stripFawaidBoilerplate(sample4);
assert(cleaned4 === "معرفة أسباب النزول نافعة إذا ثبتت.", "يزيل ذيل بضابط العلم");

const sample5 =
  "من فقه الوفاء أن حفظ العهد، وأن محبة النبي ﷺ تظهر في الاتباع والتثبّت وترك الاحتفال بما لم يُشرع. وهذه فائدة تعليمية للتذكير والمنهج.";
const cleaned5 = stripFawaidBoilerplate(sample5);
assert(cleaned5 === "من فقه الوفاء أن حفظ العهد", "يزيل جملة محبة النبي وذيل الفائدة التعليمية");

const sample6 =
  "ضبط النية أصل في قبول العمل، وأن العلم النافع يجمع بين صحة الدليل وحسن القصد. وهي فائدة محررة للتذكير والعمل، تقرأ مع مصادرها، ولا تجعل بديلا عن الفتوى.";
const cleaned6 = stripFawaidBoilerplate(sample6);
assert(cleaned6 === "ضبط النية أصل في قبول العمل", "يزيل جملة العلم النافع وذيل وهي فائدة");

const seedPath = join(dirname(fileURLToPath(import.meta.url)), "../fawaid-curated-seed.ts");
const seedSrc = readFileSync(seedPath, "utf8");
assert(!/وهذه فائدة تعليمية/.test(seedSrc), "البذرة بلا ذيل «فائدة تعليمية»");
assert(!/وهي فائدة/.test(seedSrc), "البذرة بلا ذيل «وهي فائدة»");
assert(!/وهذا يُقرأ بضابط العلم|وهذا يقرأ بضابط العلم/.test(seedSrc), "البذرة بلا ذيل «بضابط العلم»");
assert(!/وأن محبة النبي ﷺ (?:تظهر|تُصان)/.test(seedSrc), "البذرة بلا جملة محبة النبي القالبية");
assert(!/وأن العلم(?:\s+النافع)?/.test(seedSrc), "البذرة بلا جملة العلم القالبية");
assert(!/وهذا أصل يُسترشد به في فهم الأحكام الشرعية وتطبيقها/.test(seedSrc), "البذرة بلا ذيل «وتطبيقها»");
assert(!/وهذا من هدي النبي ﷺ الذي يجب على المسلم معرفته والعمل به/.test(seedSrc), "البذرة بلا ذيل «على المسلم معرفته»");

console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
if (failed > 0) process.exit(1);
