/**
 * src/features/mushaf/components/SurahBanner.jsx
 * 
 * الشارة — عنوان السورة المزخرف
 * 
 * المواصفات:
 * - عرض: 100% عمود الحبر (940 unit)
 * - ارتفاع: 120 unit
 * - موضع: Y = 150 unit من أعلى الصفحة
 * - ملف SVG ثابت: surah-banner.svg
 * - اسم السورة: نص عثماني مشكّل مركزي
 */

import React, { useEffect, useState } from 'react';
import surahBannerSvg from '../assets/surah-banner.svg';

/**
 * @component SurahBanner
 * @param {Object} surah - { name: string, number: number, ayahCount: number }
 * @param {number} width - العرض (unit) — يجب أن يكون 940
 * @param {number} height - الارتفاع (unit) — يجب أن يكون 120
 */
export const SurahBanner = ({ 
  surah,
  width = 940, 
  height = 120,
  className = '' 
}) => {
  const [svgContent, setSvgContent] = useState(null);

  // تحميل محتوى SVG (اختياري: للديناميكيك التحديث فقط)
  useEffect(() => {
    // في النسخة الثابتة: نستخدم img أو embed
    // لا نولد SVG برمجياً
  }, [surah]);

  return (
    <div
      className={`surah-banner ${className}`}
      style={{
        // الأبعاد الثابتة
        width: width,
        height: height,
        
        // الموضع (نسبي)
        position: 'relative',
        margin: '0 auto',
        
        // خلفية الصورة
        backgroundImage: `url(${surahBannerSvg})`,
        backgroundSize: 'contain',
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'center',
        
        // تأثيرات (اختياري)
        filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))',
      }}
    >
      {/* اسم السورة — يُرسم فوق SVG */}
      <SurahNameOverlay surah={surah} />
    </div>
  );
};

/**
 * @component SurahNameOverlay
 * طبقة النص فوق الخلفية
 */
const SurahNameOverlay = ({ surah }) => {
  if (!surah) return null;

  return (
    <div
      className="surah-name-overlay"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        
        direction: 'rtl',
      }}
    >
      {/* اسم السورة الرئيسي */}
      <div
        className="surah-name-main"
        style={{
          fontSize: 32,
          fontFamily: "'qpc-v2', serif",
          fontWeight: 'bold',
          color: '#1A1A1A',
          textAlign: 'center',
          lineHeight: 1.2,
        }}
      >
        {surah.name}
      </div>

      {/* عدد الآيات (اختياري) */}
      {surah.ayahCount && (
        <div
          className="surah-ayah-count"
          style={{
            fontSize: 12,
            color: '#B8860B',
            marginTop: 4,
            fontStyle: 'italic',
          }}
        >
          آياتها: {surah.ayahCount}
        </div>
      )}
    </div>
  );
};

/**
 * النسخة المبسطة: HTML مباشر (للأداء)
 */
export const SurahBannerSimple = ({ surah, width = 940, height = 120 }) => {
  return (
    <div
      className="surah-banner-simple"
      style={{
        width: width,
        height: height,
        backgroundColor: '#FFF8DC',
        border: `2px solid #D4AF37`,
        borderRadius: 4,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        direction: 'rtl',
      }}
    >
      {/* الزهرة اليسرى */}
      <svg width="30" height="30" viewBox="0 0 20 20" style={{ position: 'absolute', left: 30 }}>
        <circle cx="10" cy="10" r="6" fill="#D4AF37"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x = 10 + 8 * Math.cos(rad);
          const y = 10 + 8 * Math.sin(rad);
          return <circle key={angle} cx={x} cy={y} r="3" fill="#D4AF37" opacity="0.7"/>;
        })}
      </svg>

      {/* النص المركزي */}
      <h2
        style={{
          margin: 0,
          fontSize: 32,
          fontFamily: "'qpc-v2', serif",
          color: '#1A1A1A',
          textAlign: 'center',
          fontWeight: 'bold',
        }}
      >
        {surah?.name || 'السورة'}
      </h2>

      {/* الزهرة اليمنى */}
      <svg width="30" height="30" viewBox="0 0 20 20" style={{ position: 'absolute', right: 30 }}>
        <circle cx="10" cy="10" r="6" fill="#D4AF37"/>
        {[0, 45, 90, 135, 180, 225, 270, 315].map(angle => {
          const rad = (angle * Math.PI) / 180;
          const x = 10 + 8 * Math.cos(rad);
          const y = 10 + 8 * Math.sin(rad);
          return <circle key={angle} cx={x} cy={y} r="3" fill="#D4AF37" opacity="0.7"/>;
        })}
      </svg>
    </div>
  );
};

export default SurahBanner;
