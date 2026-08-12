/**
 * src/features/mushaf/components/MushafPageContainer.jsx
 * 
 * الحاوية الرئيسية للصفحة — تطبيق نظام الإحداثيات الثابت
 * 
 * المبدأ: تحجيم موحد بمعامل k = min(availW/1000, availH/1618)
 * لا يوجد أي حساب ديناميكي للأحجام داخل شجرة الصفحة
 */

import React, { useEffect, useState } from 'react';
import { MUSHAF_CONFIG } from '../data/quran-pages';

/**
 * @component MushafPageContainer
 * @description الحاوية الخارجية الوحيدة التي تحسب معامل التحجيم
 */
export const MushafPageContainer = ({ children, className = '' }) => {
  const [scale, setScale] = useState(1);
  const [containerRef, setContainerRef] = useState(null);

  useEffect(() => {
    const calculateScale = () => {
      if (!containerRef) return;

      const rect = containerRef.getBoundingClientRect();
      const availableWidth = rect.width;
      const availableHeight = rect.height;

      // صيغة التحجيم: أصغر النسبتين
      const k = Math.min(
        availableWidth / MUSHAF_CONFIG.LOGICAL_WIDTH,
        availableHeight / MUSHAF_CONFIG.LOGICAL_HEIGHT
      );

      setScale(k);
    };

    // حساب المرة الأولى
    calculateScale();

    // حساب عند تغيير حجم النافذة (debounce)
    let timeout;
    const handleResize = () => {
      clearTimeout(timeout);
      timeout = setTimeout(calculateScale, 100);
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeout);
    };
  }, [containerRef]);

  return (
    <div
      ref={setContainerRef}
      className={`mushaf-page-container ${className}`}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'flex-start',
        padding: '16px',
        minHeight: '100vh',
        backgroundColor: '#f5f5f5',
        // لا نستخدم هنا إلا الحسابات الضرورية جداً
      }}
    >
      <div
        className="mushaf-page-inner"
        style={{
          // ✅ الحسابات المسموحة فقط:
          width: `${MUSHAF_CONFIG.LOGICAL_WIDTH}px`,
          height: `${MUSHAF_CONFIG.LOGICAL_HEIGHT}px`,
          // ✅ التحجيم الموحد:
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          // الثابت من الآن فصاعداً
          transition: 'transform 0.1s ease-out',
          backgroundColor: '#F5EAD8', // عاجي من المرجع
          position: 'relative',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
        }}
      >
        {children}
      </div>
    </div>
  );
};

/**
 * @component PageLayout
 * @description البنية الداخلية للصفحة (رأس + محتوى + ذيل)
 * 
 * ⚠️ ممنوع:
 * - أي حساب لـ font-size بناءً على containerWidth
 * - أي media query
 * - أي vw/vh وحدة
 */
export const PageLayout = ({ 
  pageNumber,
  surah, 
  juz, 
  hazbDescription,
  children // محتوى الصفحة (الأسطر)
}) => {
  // ثوابت من MUSHAF_SPEC (سيُحدثّ بعد القياس)
  const HEADER_HEIGHT = 60;      // unit
  const FOOTER_HEIGHT = 80;      // unit
  const CONTENT_TOP_MARGIN = 40; // unit
  const SIDE_MARGIN = 30;        // unit

  // حساب منطقة الحبر (ink block)
  const inkBlockHeight = 
    MUSHAF_CONFIG.LOGICAL_HEIGHT - 
    HEADER_HEIGHT - 
    FOOTER_HEIGHT - 
    CONTENT_TOP_MARGIN - 
    40; // spacing

  return (
    <div
      className="page-layout"
      style={{
        width: MUSHAF_CONFIG.LOGICAL_WIDTH,
        height: MUSHAF_CONFIG.LOGICAL_HEIGHT,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* الرأس */}
      <PageHeader 
        pageNumber={pageNumber}
        surah={surah}
        juz={juz}
      />

      {/* منطقة المحتوى (الحبر) */}
      <div
        className="content-area"
        style={{
          flex: 1,
          marginTop: CONTENT_TOP_MARGIN,
          marginLeft: SIDE_MARGIN,
          marginRight: SIDE_MARGIN,
          marginBottom: 40,
          height: inkBlockHeight,
          position: 'relative',
          // ⚠️ overflow: hidden سيُسبب قص النص!
          // ✅ overflow: visible (الخيار الآمن)
          overflow: 'visible',
          // display: 'flex';
          // flexDirection: 'column';
        }}
      >
        {children}
      </div>

      {/* الذيل */}
      <PageFooter 
        pageNumber={pageNumber}
        hazbDescription={hazbDescription}
      />
    </div>
  );
};

/**
 * @component PageHeader
 */
const PageHeader = ({ pageNumber, surah, juz }) => {
  return (
    <div
      className="page-header"
      style={{
        height: 60,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingLeft: 30,
        paddingRight: 30,
        fontSize: 14,
        color: '#B8860B', // ذهبي باهت
        fontFamily: 'qpc-v2, serif',
        direction: 'rtl',
      }}
    >
      <span>{surah?.name || '—'}</span>
      <span>الجزء {juz}</span>
    </div>
  );
};

/**
 * @component PageFooter
 */
const PageFooter = ({ pageNumber, hazbDescription }) => {
  return (
    <div
      className="page-footer"
      style={{
        height: 80,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        paddingBottom: 20,
        fontSize: 12,
        color: '#333',
        fontFamily: 'qpc-v2, serif',
        direction: 'rtl',
      }}
    >
      {/* خرطوش رقم الصفحة */}
      <div
        style={{
          fontSize: 20,
          fontWeight: 'bold',
          margin: '0 0 8px 0',
        }}
      >
        ۝ {String(pageNumber).padStart(3, '٠')} ۝
      </div>
      
      {/* وصف الحزب (إن وجد) */}
      {hazbDescription && (
        <div style={{ fontSize: 10 }}>
          {hazbDescription}
        </div>
      )}
    </div>
  );
};

export default MushafPageContainer;
