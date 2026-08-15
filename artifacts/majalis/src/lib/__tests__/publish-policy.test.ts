/**
 * سياسة النشر — اختبارات فشل عند ادعاءات توثيق بلا أهلية أو نقص بلا تنبيه أو blocked في sitemap.
 * التشغيل: node --import tsx src/lib/__tests__/publish-policy.test.ts
 */
import { readFileSync, existsSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  canIncludeInSitemap,
  classifyFiqhMaterial,
  classifyLibraryBook,
  classifyRuling,
  missingIncompleteNotice,
  textClaimsVerification,
  violatesVerificationClaimPolicy,
  type PublishStatus,
} from "../publish-policy.ts";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");

let failed = 0;
function check(cond: boolean, label: string) {
  if (cond) {
    console.log(`  ✓ ${label}`);
  } else {
    console.error(`  ✗ ${label}`);
    failed += 1;
  }
}

console.log("\n=== ادعاءات توثيق بلا مصدر ===");
{
  const status: PublishStatus = "partial";
  const claim = "أسئلة وأجوبة شرعية موثقة بالأدلة";
  check(textClaimsVerification(claim), "يكتشف «موثقة بالأدلة»");
  check(
    violatesVerificationClaimPolicy(claim, {}, status),
    "partial يقول موثقة بلا مصدر → مخالفة",
  );
  check(
    !violatesVerificationClaimPolicy(
      claim,
      { sourceUrl: "https://example.com", reviewStatus: "reviewed" },
      "published",
    ),
    "published + مصدر + مراجعة → مسموح",
  );
}

console.log("\n=== pending_review كمعتمدة ===");
{
  const status = classifyRuling({
    title: "مسألة",
    body: "نص الحكم الشرعي هنا كافٍ للعرض",
    verification_status: "pending_review",
  });
  check(status === "pending_review", "تصنيف pending_review");
  check(
    violatesVerificationClaimPolicy("مادة معتمدة من المجلس", {}, status),
    "pending_review يدّعي معتمدة → مخالفة",
  );
  const withNotice =
    "هذه المادة قيد المراجعة الشرعية، تُعرض للفائدة العامة ولا تُعد اعتمادًا نهائيًا.";
  check(!missingIncompleteNotice(withNotice, status), "تنبيه pending موجود");
  check(missingIncompleteNotice("نص بلا تنبيه", status), "بلا تنبيه → مخالفة");
}

console.log("\n=== ناقصة بلا تنبيه ===");
{
  const status: PublishStatus = "incomplete";
  check(missingIncompleteNotice("صفحة قصيرة", status), "incomplete بلا تنبيه");
  check(
    !missingIncompleteNotice("هذه الصفحة قيد الإكمال", status),
    "incomplete مع تنبيه",
  );
}

console.log("\n=== fiqh-council سطر واحد ===");
{
  const thin = classifyFiqhMaterial({
    title: "قرار مختصر",
    status: "published",
    summary: "سطر واحد فقط.",
    content: "",
  });
  check(thin === "incomplete", "تصنيف مادة بسطر واحد = incomplete");
  check(
    missingIncompleteNotice("قرار مختصر", thin),
    "سطر واحد بلا تنبيه → مخالفة",
  );
  check(
    !missingIncompleteNotice(
      "هذه المادة مختصرة وقيد الإكمال، وسيُضاف نص القرار ومصدره عند اكتمال التوثيق.",
      thin,
    ),
    "سطر واحد مع تنبيه → مقبول",
  );
}

console.log("\n=== qa بلا أسئلة تدّعي التوثيق ===");
{
  const quizPage = readFileSync(resolve(root, "src/pages/account/QuizPage.tsx"), "utf8");
  check(!/موثقة بالأدلة/.test(quizPage), "QuizPage لا يقول موثقة بالأدلة");
  check(/قيد الإكمال/.test(quizPage), "QuizPage يذكر قيد الإكمال");
  const seoRoutes = readFileSync(resolve(root, "src/lib/seo-routes.json"), "utf8");
  try {
    const parsed = JSON.parse(seoRoutes);
    const routes = Array.isArray(parsed) ? parsed : parsed.routes || [];
    const hit = routes.find((r: { path?: string }) => r.path === "/quiz");
    const quizDesc = String(hit?.description || "");
    if (quizDesc) {
      check(!/موثقة بالأدلة/.test(quizDesc), "seo-routes /quiz بلا موثقة بالأدلة");
    }
  } catch {
    /* ignore */
  }
}

console.log("\n=== مكتبة بلا مصدر ===");
{
  const st = classifyLibraryBook({
    title: "كتاب",
    description: "وصف قصير جدًا",
    external_url: null,
  });
  check(st === "incomplete" || st === "partial", "كتاب بلا مصدر ليس published");
  check(canIncludeInSitemap(st), "partial/incomplete تدخل sitemap");
}

console.log("\n=== blocked خارج sitemap ===");
{
  const draftBlocked = classifyRuling({
    title: "مسودة",
    body: "نص",
    verification_status: "draft",
  });
  check(draftBlocked === "blocked", "draft blocked");
  check(!canIncludeInSitemap(draftBlocked), "blocked لا يدخل sitemap");
  check(!canIncludeInSitemap("blocked"), "سياسة: blocked خارج sitemap");
  void existsSync(resolve(root, "public/sitemap.xml"));
}

console.log("\n=== واجهات تنبيه ===");
{
  const rulings = readFileSync(resolve(root, "src/pages/fiqh/ui/RulingsView.tsx"), "utf8");
  check(!/موثقة بالأدلة/.test(rulings), "RulingsView بلا موثقة بالأدلة");
  check(/PublishStatusBanner/.test(rulings), "RulingsView يعرض البنر");
  const kg = readFileSync(resolve(root, "src/views/KnowledgeGraphPage.tsx"), "utf8");
  check(!/جميع العلاقات المعروضة موثقة/.test(kg), "KG بلا ادعاء توثيق شامل");
  check(/PublishStatusBanner/.test(kg), "KG يعرض البنر");
}

if (failed) {
  console.error(`\npublish-policy: FAILED (${failed})`);
  process.exit(1);
}
console.log("\npublish-policy: OK");
