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

console.log(`\n=== النتيجة: ${passed} نجح / ${failed} فشل ===\n`);
if (failed > 0) process.exit(1);
