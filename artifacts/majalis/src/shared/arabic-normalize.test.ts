/**
 * arabic-normalize.test.ts
 * اختبارات وحدة التطبيع العربي المشتركة (20+ حالة)
 *
 * تشغيل: node --experimental-vm-modules node_modules/.bin/vitest run src/shared/arabic-normalize.test.ts
 */

import { describe, it, expect } from "vitest";
import { normalizeArabic, normalizedIncludes, normalizedMatchAny } from "./arabic-normalize";

// ─── اختبارات normalizeArabic ────────────────────────────────────────────────

describe("normalizeArabic — الحالات الأساسية", () => {
  it("1. أذكار/اذكار — توحيد الألف", () => {
    expect(normalizeArabic("أذكار")).toBe(normalizeArabic("اذكار"));
  });

  it("2. الرحمن/الرَّحْمَٰن — إزالة التشكيل الكامل مع ألف خنجرية", () => {
    expect(normalizeArabic("الرَّحْمَٰن")).toBe(normalizeArabic("الرحمان"));
  });

  it("3. صلاة/صلاه — ة → ه", () => {
    expect(normalizeArabic("صلاة")).toBe(normalizeArabic("صلاه"));
  });

  it("4. يحيى/يحيي — ى → ي", () => {
    expect(normalizeArabic("يحيى")).toBe(normalizeArabic("يحيي"));
  });

  it("5. قرآن/قران — إزالة تشكيل + توحيد آ → ا", () => {
    expect(normalizeArabic("قرآن")).toBe(normalizeArabic("قران"));
  });

  it("6. إزالة الكشيدة ـ", () => {
    expect(normalizeArabic("الله")).toBe(normalizeArabic("اللـه"));
  });

  it("7. نص فارغ يعيد سلسلة فارغة", () => {
    expect(normalizeArabic("")).toBe("");
    expect(normalizeArabic(null as unknown as string)).toBe("");
    expect(normalizeArabic(undefined as unknown as string)).toBe("");
  });

  it("8. إزالة التنوين (تنوين ضم/فتح/كسر)", () => {
    expect(normalizeArabic("كِتَابٌ")).toBe(normalizeArabic("كتاب"));
  });

  it("9. ؤ → و", () => {
    expect(normalizeArabic("رؤية")).toBe(normalizeArabic("روية"));
  });

  it("10. ئ → ي", () => {
    expect(normalizeArabic("بئر")).toBe(normalizeArabic("بير"));
  });

  it("11. إزالة الشدّة وتوحيد المتشابه", () => {
    expect(normalizeArabic("الشَّمْس")).toBe(normalizeArabic("الشمس"));
  });

  it("12. إزالة المدّ القرآني (مدّ واجب متصل)", () => {
    // آية مع علامات مدّ (U+0653)
    const withMadd = "وَٱلسَّمَآءِ";
    const withoutMadd = "والسماء";
    expect(normalizeArabic(withMadd)).toBe(normalizeArabic(withoutMadd));
  });

  it("13. علامات الوقف القرآنية تُزال", () => {
    // ۖ = U+06D6 علامة وقف
    const withStop = "لَا تَحْزَنْ ۖ إِنَّ ٱللَّهَ مَعَنَا";
    const withoutStop = "لا تحزن إن الله معنا";
    expect(normalizeArabic(withStop)).toBe(normalizeArabic(withoutStop));
  });

  it("14. أسماء الله الحسنى — الرحيم بالتشكيل = الرحيم بدونه", () => {
    expect(normalizeArabic("ٱلرَّحِيمُ")).toBe(normalizeArabic("الرحيم"));
  });

  it("15. بسملة كاملة تُطبَّع صحيحاً", () => {
    const bismillah = "بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ";
    const simple = "بسم الله الرحمان الرحيم";
    expect(normalizeArabic(bismillah)).toBe(normalizeArabic(simple));
  });

  it("16. توحيد المسافات المتعددة", () => {
    expect(normalizeArabic("الله   أكبر")).toBe("الله اكبر");
  });

  it("17. إزالة علامات الترقيم الفاصلة", () => {
    expect(normalizeArabic("قال، رحمه الله:")).toBe(normalizeArabic("قال رحمه الله"));
  });

  it("18. إبراهيم/ابراهيم — توحيد الألف", () => {
    expect(normalizeArabic("إبراهيم")).toBe(normalizeArabic("ابراهيم"));
  });

  it("19. مؤمن/مومن — ؤ → و", () => {
    expect(normalizeArabic("مؤمن")).toBe(normalizeArabic("مومن"));
  });

  it("20. نصوص مختلطة عربي+أرقام — الأرقام تبقى", () => {
    const result = normalizeArabic("سورة 2 آية 255");
    expect(result).toContain("2");
    expect(result).toContain("255");
  });

  it("21. ألف مدّ (آ) → ا", () => {
    expect(normalizeArabic("آمين")).toBe(normalizeArabic("امين"));
  });

  it("22. ألف وصل (ٱ) → ا", () => {
    expect(normalizeArabic("ٱللَّه")).toBe(normalizeArabic("الله"));
  });

  it("23. اذكار الصباح = أذكار الصباح (سيناريو البحث)", () => {
    expect(normalizeArabic("اذكار الصباح")).toBe(normalizeArabic("أذكار الصباح"));
  });

  it("24. صلاه = صلاة (سيناريو البحث)", () => {
    expect(normalizeArabic("صلاه")).toBe(normalizeArabic("صلاة"));
  });
});

// ─── اختبارات normalizedIncludes ─────────────────────────────────────────────

describe("normalizedIncludes", () => {
  it("يجد الكلمة بتشكيل مختلف", () => {
    expect(
      normalizedIncludes("أذكار الصباح والمساء", "اذكار الصباح")
    ).toBe(true);
  });

  it("يجد الرحمن في نص مشكّل", () => {
    expect(
      normalizedIncludes("بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ", "الرحمان")
    ).toBe(true);
  });

  it("يعيد true لاستعلام فارغ", () => {
    expect(normalizedIncludes("أي نص", "")).toBe(true);
  });

  it("يعيد false لـ null haystack", () => {
    expect(normalizedIncludes(null, "بحث")).toBe(false);
  });

  it("يجد صلاة في نص يحوي صلاه", () => {
    expect(normalizedIncludes("يتحدث عن الصلاه", "صلاة")).toBe(true);
  });
});

// ─── اختبارات normalizedMatchAny ─────────────────────────────────────────────

describe("normalizedMatchAny", () => {
  it("يطابق في أي حقل من المصفوفة", () => {
    expect(
      normalizedMatchAny(["درس في الفقه", "الشيخ أحمد", null], "فقه")
    ).toBe(true);
  });

  it("يعيد false إذا لم يجد في أي حقل", () => {
    expect(
      normalizedMatchAny(["علم النحو", "الصرف"], "التفسير")
    ).toBe(false);
  });

  it("يتجاهل null وundefined في المصفوفة", () => {
    expect(
      normalizedMatchAny([null, undefined, "الزكاة"], "الزكاه")
    ).toBe(true);
  });
});
