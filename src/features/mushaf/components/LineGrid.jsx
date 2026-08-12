/**
 * src/features/mushaf/components/LineGrid.jsx
 * 
 * نظام الأسطر — 15 سطر متساوية الارتفاع
 * 
 * البناء:
 * - كل سطر: خانة بارتفاع ثابت
 * - baseline: محسوب من الشبكة لا من المحتوى
 * - padding رأسي: يسمح بالتشكيل (فوقاني + سفلي)
 * - scaleX: للتمدد الأفقي فقط [0.94, 1.06]
 */

import React from 'react';
import { MUSHAF_CONFIG } from '../data/quran-pages';

/**
 * @component LineGrid
 * @param {Array} lines - مصفوفة من الأسطر { words, verseNumber }
 * @param {number} inkBlockHeight - ارتفاع كتلة الحبر (unit)
 * @param {number} lineHeight - ارتفاع السطر الواحد (unit)
 */
export const LineGrid = ({ 
  lines = [], 
  inkBlockHeight = 1200,
  lineHeight = null, // سيُحسب من inkBlockHeight / 15 أو من MUSHAF_CONFIG
  maxLinesPerPage = 15,
}) => {
  // حساب ارتفاع السطر من كتلة الحبر
  const computedLineHeight = lineHeight || (inkBlockHeight / maxLinesPerPage);
  
  // padding رأسي داخل الخانة (يسمح بالتشكيل)
  const verticalPaddingTop = 4;    // unit
  const verticalPaddingBottom = 4; // unit
  const baselineOffset = 6;        // unit من أعلى الخانة
  
  return (
    <div
      className="line-grid"
      style={{
        position: 'relative',
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column-reverse', // مرينة: يمكن تغييره حسب RTL
        direction: 'rtl',
      }}
    >
      {lines.map((line, index) => (
        <LineBox
          key={index}
          lineNumber={index}
          words={line.words}
          verseNumber={line.verseNumber}
          lineHeight={computedLineHeight}
          verticalPaddingTop={verticalPaddingTop}
          verticalPaddingBottom={verticalPaddingBottom}
          baselineOffset={baselineOffset}
        />
      ))}

      {/* خانات فارغة لاكمال الـ 15 سطر */}
      {lines.length < maxLinesPerPage && (
        Array.from({ length: maxLinesPerPage - lines.length }).map((_, idx) => (
          <LineBox
            key={`empty-${idx}`}
            lineNumber={lines.length + idx}
            words={[]}
            verseNumber={null}
            lineHeight={computedLineHeight}
            verticalPaddingTop={verticalPaddingTop}
            verticalPaddingBottom={verticalPaddingBottom}
            baselineOffset={baselineOffset}
          />
        ))
      )}
    </div>
  );
};

/**
 * @component LineBox
 * @description خانة سطر واحدة بارتفاع ثابت
 * 
 * المسؤوليات:
 * 1. ارتفاع محدد وثابت
 * 2. محاذاة baseline من الشبكة
 * 3. تمدد أفقي بـ scaleX (بدون word-spacing)
 * 4. padding رأسي يكفي التشكيل
 */
const LineBox = ({
  lineNumber,
  words,
  verseNumber,
  lineHeight,
  verticalPaddingTop,
  verticalPaddingBottom,
  baselineOffset,
}) => {
  // حساب عامل التمدد من عدد الكلمات
  // (سيُحسب من خوارزمية تحديد الكثافة المثالية)
  const scaleXValue = calculateScaleX(words, lineNumber);

  return (
    <div
      className="line-box"
      style={{
        // حجم الخانة (ثابت)
        height: lineHeight,
        width: '100%',
        
        // لا overflow — يسمح بالتمدد الطبيعي
        overflow: 'visible',
        
        // محاذاة وسط
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        
        // padding لتجنب قص التشكيل
        paddingTop: verticalPaddingTop,
        paddingBottom: verticalPaddingBottom,
        
        // debugging (اختياري)
        // border: '1px solid #ddd',
        position: 'relative',
      }}
    >
      {/* الخط الفعلي */}
      <div
        className="line-content"
        style={{
          // تمدد أفقي فقط
          transform: scaleXValue !== 1 ? `scaleX(${scaleXValue})` : undefined,
          transformOrigin: 'center',
          
          // نص عثماني
          fontFamily: 'qpc-v2, serif',
          fontSize: 'inherit', // يجب أن يُمرّر من الأعلى
          lineHeight: 1, // لا تغيير إضافي
          whiteSpace: 'nowrap', // لا كسر أسطر
          direction: 'rtl',
          
          // لا word-spacing, letter-spacing, text-align-justify
          wordSpacing: 'normal',
          letterSpacing: 'normal',
          textAlign: 'center',
        }}
      >
        {words.map((word, idx) => (
          <span
            key={idx}
            style={{
              // كل كلمة: نص عثماني وحسب
              display: 'inline',
              whiteSpace: 'nowrap',
            }}
          >
            {word}
            {idx < words.length - 1 && ' '} {/* فاصل */}
          </span>
        ))}
      </div>

      {/* علامة الآية (إن وجدت) */}
      {verseNumber && (
        <VerseMarker
          verseNumber={verseNumber}
          positioned="right"
        />
      )}
    </div>
  );
};

/**
 * @component VerseMarker
 * @description ميدالية الآية (دائرة ذهبية برقم)
 */
const VerseMarker = ({ verseNumber, positioned = 'right' }) => {
  const markerSize = 24; // unit (سيُحدّث من المرجع)
  
  return (
    <svg
      className="verse-marker"
      width={markerSize}
      height={markerSize}
      viewBox={`0 0 ${markerSize} ${markerSize}`}
      style={{
        position: 'absolute',
        [positioned]: -8,
        top: '50%',
        transform: 'translateY(-50%)',
        zIndex: 10,
      }}
    >
      {/* دائرة ذهبية مملوءة */}
      <circle
        cx={markerSize / 2}
        cy={markerSize / 2}
        r={markerSize / 2 - 1}
        fill="#D4AF37"
        stroke="none"
      />
      
      {/* رقم الآية (عربي) */}
      <text
        x={markerSize / 2}
        y={markerSize / 2 + 2}
        textAnchor="middle"
        dominantBaseline="central"
        fontSize={Math.floor(markerSize * 0.6)}
        fill="white"
        fontWeight="bold"
        fontFamily="Arial, sans-serif"
      >
        {arabicNumber(verseNumber)}
      </text>
    </svg>
  );
};

/**
 * تحويل الأرقام إلى أرقام عربية
 */
const arabicNumber = (num) => {
  const arabicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return String(num)
    .split('')
    .map(digit => arabicDigits[parseInt(digit)] || digit)
    .join('');
};

/**
 * حساب عامل التمدد الأفقي
 * 
 * المبدأ:
 * - عد الكلمات وطول السطر
 * - احسب نسبة الملء المثالية (90-95%)
 * - أخرج scaleX ضمن [0.94, 1.06]
 * 
 * ⚠️ لا تستخدم word-spacing أو letter-spacing
 */
const calculateScaleX = (words, lineNumber) => {
  if (!words || words.length === 0) return 1;
  
  // تقدير بسيط: عدد الكلمات
  const wordCount = words.length;
  
  // قيمة قاعدية (سيُحسب من الخط الفعلي)
  const averageWordWidth = 45; // unit (تقريبي)
  const estimatedLineWidth = wordCount * averageWordWidth;
  
  // عرض السطر المتاح (1000 - 2×30 = 940)
  const availableWidth = 940;
  
  // نسبة الملء المثالية: 92%
  const targetFillRatio = 0.92;
  const scaleX = (availableWidth * targetFillRatio) / estimatedLineWidth;
  
  // تحديد النطاق
  const MIN_SCALE = 0.94;
  const MAX_SCALE = 1.06;
  return Math.max(MIN_SCALE, Math.min(MAX_SCALE, scaleX));
};

export default LineGrid;
