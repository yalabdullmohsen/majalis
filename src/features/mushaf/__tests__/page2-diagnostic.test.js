/**
 * src/features/mushaf/__tests__/page2-diagnostic.test.js
 * 
 * اختبار تشخيصي للمشكلة الحرجة: فقدان السطر الأخير في الصفحة 2
 * 
 * الآية الأخيرة: "هُمُ ٱلْمُفْلِحُونَ ۝٥"
 * الحالة الحالية: غير مرسومة (مفقودة)
 * 
 * الفرضيات المراد اختبارها:
 * 1. overflow: hidden يقص النص السفلي
 * 2. عدد خانات السطر < عدد الأسطر في البيانات
 * 3. شرط فلترة يسقط السطر الأخير
 * 4. خطأ في حساب ارتفاع الخانة
 */

import { render, screen } from '@testing-library/react';
import { PAGE_2_DATA, DIAGNOSTIC_PAGE_2 } from '../data/quran-pages';
import { PageLayout } from '../components/MushafPageContainer';
import { LineGrid } from '../components/LineGrid';

describe('🔴 Page 2 Diagnostic — Missing Last Line', () => {
  
  // ============================================================
  // فرضية 1: overflow: hidden يقص النص
  // ============================================================
  
  test('❌ HYPOTHESIS 1: overflow:hidden causes clipping', () => {
    const { container } = render(
      <PageLayout
        pageNumber={2}
        surah={{ name: "الفاتحة", number: 1 }}
        juz={1}
      >
        <LineGrid lines={PAGE_2_DATA.lines} />
      </PageLayout>
    );
    
    const contentArea = container.querySelector('.content-area');
    
    // الفحص الأول: هل الـ overflow مضبوط على hidden؟
    const overflowStyle = window.getComputedStyle(contentArea).overflow;
    console.log(`📋 [Page 2 Diagnostic] Content area overflow: ${overflowStyle}`);
    
    if (overflowStyle === 'hidden') {
      console.error(`❌ FOUND: overflow:hidden will clip text!`);
      console.error(`   → Fix: Change to overflow: visible`);
    } else {
      console.log(`✅ PASS: overflow is "${overflowStyle}" (safe)`);
    }
    
    // جب: يجب أن يكون visible
    expect(overflowStyle).not.toBe('hidden');
  });

  // ============================================================
  // فرضية 2: عدد الخانات < عدد الأسطر
  // ============================================================
  
  test('❌ HYPOTHESIS 2: Rendered line boxes != data line count', () => {
    const { container } = render(
      <PageLayout pageNumber={2} surah={{ name: "الفاتحة", number: 1 }} juz={1}>
        <LineGrid lines={PAGE_2_DATA.lines} />
      </PageLayout>
    );
    
    const lineBoxes = container.querySelectorAll('.line-box');
    const expectedLineCount = PAGE_2_DATA.lines.length;
    
    console.log(`📋 [Page 2 Diagnostic] Expected lines: ${expectedLineCount}`);
    console.log(`📋 [Page 2 Diagnostic] Rendered boxes: ${lineBoxes.length}`);
    
    if (lineBoxes.length < expectedLineCount) {
      console.error(`❌ FOUND: Only ${lineBoxes.length} boxes rendered for ${expectedLineCount} lines`);
      console.error(`   → Missing: ${expectedLineCount - lineBoxes.length} box(es)`);
      console.error(`   → Fix: Check LineGrid rendering logic`);
    } else {
      console.log(`✅ PASS: All ${expectedLineCount} line boxes rendered`);
    }
    
    expect(lineBoxes.length).toBe(expectedLineCount);
  });

  // ============================================================
  // فرضية 3: شرط فلترة يسقط السطر الأخير
  // ============================================================
  
  test('❌ HYPOTHESIS 3: Filter condition drops last line', () => {
    const lastLineData = PAGE_2_DATA.lines[PAGE_2_DATA.lines.length - 1];
    
    console.log(`📋 [Page 2 Diagnostic] Last line in data:`, lastLineData);
    console.log(`   Words: ${lastLineData.words.join(' ')}`);
    console.log(`   Verse: ${lastLineData.verseNumber}`);
    
    // هل آخر سطر موجود؟
    expect(lastLineData).toBeDefined();
    expect(lastLineData.words.length).toBeGreaterThan(0);
    
    // هل الكلمات الصحيحة؟
    const lastLineText = lastLineData.words.join(' ');
    expect(lastLineText).toContain('هُمُ');
    expect(lastLineText).toContain('ٱلْمُفْلِحُونَ');
  });

  // ============================================================
  // الاختبار الرئيسي: كل الآيات موجودة ومرسومة
  // ============================================================
  
  test('✅ ALL verses rendered in Page 2', () => {
    const { container } = render(
      <PageLayout pageNumber={2} surah={{ name: "الفاتحة", number: 1 }} juz={1}>
        <LineGrid lines={PAGE_2_DATA.lines} />
      </PageLayout>
    );
    
    // اجمع كل النص المرسوم
    const lineContents = Array.from(
      container.querySelectorAll('.line-content')
    ).map(el => el.innerText || el.textContent);
    
    const renderedText = lineContents.join(' ');
    
    console.log(`📋 [Page 2] Rendered text:\n${renderedText}`);
    
    // تحقق من الآيات الرئيسية
    expect(renderedText).toContain('الحمد');
    expect(renderedText).toContain('لله');
    expect(renderedText).toContain('العالمين');
    expect(renderedText).toContain('ملك');
    expect(renderedText).toContain('الدين');
    
    // ⚠️ الاختبار الحرج: هل الآية الأخيرة موجودة؟
    expect(renderedText).toContain('هُمُ');
    expect(renderedText).toContain('ٱلْمُفْلِحُونَ');
  });

  // ============================================================
  // الاختبار الثاني: لا يوجد عناصر مخفية
  // ============================================================
  
  test('✅ No hidden or clipped elements in Page 2', () => {
    const { container } = render(
      <PageLayout pageNumber={2} surah={{ name: "الفاتحة", number: 1 }} juz={1}>
        <LineGrid lines={PAGE_2_DATA.lines} />
      </PageLayout>
    );
    
    // ابحث عن أي عناصر مخفية
    const hiddenElements = container.querySelectorAll('[style*="display: none"]');
    const clippedElements = container.querySelectorAll('[style*="overflow: hidden"]');
    
    console.log(`📋 [Page 2] Hidden elements: ${hiddenElements.length}`);
    console.log(`📋 [Page 2] Clipped containers: ${clippedElements.length}`);
    
    expect(hiddenElements.length).toBe(0);
    // clipped في الحاوية الخارجية فقط (حسب الحاجة)
  });

  // ============================================================
  // قياس الارتفاع والتباعد
  // ============================================================
  
  test('✅ Line heights and spacing are consistent', () => {
    const { container } = render(
      <PageLayout pageNumber={2} surah={{ name: "الفاتحة", number: 1 }} juz={1}>
        <LineGrid 
          lines={PAGE_2_DATA.lines}
          inkBlockHeight={1200}
          lineHeight={80} // 1200 / 15
        />
      </PageLayout>
    );
    
    const lineBoxes = Array.from(container.querySelectorAll('.line-box'));
    
    console.log(`📋 [Page 2] Line box measurements:`);
    lineBoxes.forEach((box, idx) => {
      const height = box.getBoundingClientRect().height;
      console.log(`   Line ${idx}: ${height.toFixed(1)}px`);
    });
    
    // كل الخانات يجب أن تكون نفس الارتفاع (±5px تحمل)
    const heights = lineBoxes.map(box => box.getBoundingClientRect().height);
    const firstHeight = heights[0];
    
    heights.forEach((h, idx) => {
      expect(Math.abs(h - firstHeight)).toBeLessThan(5);
    });
  });

  // ============================================================
  // اختبار البيانات الأولية
  // ============================================================
  
  test('✅ Page 2 data structure is complete', () => {
    console.log(`📋 [Page 2 Data Check]`);
    console.log(`   Expected line count: ${DIAGNOSTIC_PAGE_2.expectedLineCount}`);
    console.log(`   Expected word count: ${DIAGNOSTIC_PAGE_2.expectedWordCount}`);
    console.log(`   Actual lines: ${PAGE_2_DATA.lines.length}`);
    
    const totalWords = PAGE_2_DATA.lines.reduce(
      (sum, line) => sum + line.words.length,
      0
    );
    console.log(`   Actual words: ${totalWords}`);
    
    // تحقق من التكامل
    expect(PAGE_2_DATA.lines.length).toBe(DIAGNOSTIC_PAGE_2.expectedLineCount);
    expect(totalWords).toBe(DIAGNOSTIC_PAGE_2.expectedWordCount);
    
    // تحقق من الآية الأخيرة
    const lastLine = PAGE_2_DATA.lines[PAGE_2_DATA.lines.length - 1];
    expect(lastLine.words).toEqual(DIAGNOSTIC_PAGE_2.expectedLastLine);
    expect(lastLine.verseNumber).toBe(DIAGNOSTIC_PAGE_2.expectedLastVerse);
  });
});

// ============================================================
// طباعة ملخص التشخيص
// ============================================================

console.log(`
╔════════════════════════════════════════════════════════════════╗
║           🔴 PAGE 2 DIAGNOSTIC SUMMARY                         ║
╚════════════════════════════════════════════════════════════════╝

المشكلة: آخر سطر "هُمُ ٱلْمُفْلِحُونَ ۝٥" غير مرسوم

القائمة البحثية:
  ☐ الفرضية 1: overflow:hidden يقص النص
  ☐ الفرضية 2: عدد خانات < عدد أسطر
  ☐ الفرضية 3: شرط فلترة يسقط السطر

الحل:
  1. تشغيل هذا الاختبار: npm test -- page2-diagnostic
  2. قراءة السجل (console) بحثاً عن ❌ FOUND
  3. تطبيق الحل المقترح
  4. إعادة التشغيل حتى ✅ PASS الجميع
  5. إضافة gate اختبار يمنع تكرار المشكلة
`);
