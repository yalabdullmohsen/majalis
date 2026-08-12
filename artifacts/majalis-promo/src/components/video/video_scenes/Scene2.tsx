import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { SceneIntroBanner, CalloutTag } from '../SectionCallout';

export function Scene2() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 400),
      setTimeout(() => setPhase(2), 1000),
      setTimeout(() => setPhase(3), 1600),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  const lessons = [
    { title: 'شرح كتاب التوحيد', subtitle: 'الشيخ صالح آل الشيخ', tag: 'عقيدة' },
    { title: 'تفسير ابن كثير', subtitle: 'الشيخ عبد الرزاق البدر', tag: 'تفسير' },
    { title: 'عمدة الأحكام', subtitle: 'الشيخ عبد السلام الشويعر', tag: 'فقه' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-32 z-10"
      {...sceneTransitions.slideLeft}
    >
      {/* Section intro banner */}
      <SceneIntroBanner
        label="الدروس"
        subtitle="دروس علمية منهجية مرتبة بعناية"
        color="emerald"
        delay={0.1}
      />

      <div className="w-1/2 pr-16 mt-10">
        <motion.h2 
          className="text-6xl font-display font-bold text-emerald mb-8 leading-tight drop-shadow-sm"
          style={{ color: 'var(--color-emerald)' }}
        >
          {'مجالس العلم'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 40 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: phase >= 1 ? i * 0.05 : 0 }}
            >
              {char === ' ' ? '\u00A0' : char}
            </motion.span>
          ))}
        </motion.h2>

        <motion.p
          className="text-2xl font-body text-ink/80 leading-relaxed"
          initial={{ opacity: 0, filter: 'blur(10px)' }}
          animate={phase >= 2 ? { opacity: 1, filter: 'blur(0px)' } : { opacity: 0, filter: 'blur(10px)' }}
          transition={{ duration: 0.8 }}
        >
          تصفح وسجل في الدروس العلمية المنهجية لطلب العلم على بصيرة.
        </motion.p>
      </div>

      <div className="w-1/2 flex flex-col gap-6 relative mt-10">
        {lessons.map((lesson, i) => (
          <motion.div
            key={i}
            className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald/10 flex items-center relative overflow-visible"
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={phase >= 3 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: phase >= 3 ? i * 0.2 : 0 }}
          >
            <div className="w-12 h-12 rounded-full bg-sage/30 flex items-center justify-center mr-6 shrink-0 ml-6" style={{ backgroundColor: 'var(--color-sage)' }}>
              <div className="w-4 h-4 rounded-full bg-emerald" style={{ backgroundColor: 'var(--color-emerald)' }} />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-display font-bold text-ink mb-1">{lesson.title}</h3>
              <p className="text-xl font-body text-ink/60">{lesson.subtitle}</p>
            </div>
            {/* Per-card callout tag */}
            {phase >= 3 && (
              <motion.div
                style={{ position: 'absolute', top: -14, left: 16 }}
                initial={{ opacity: 0, y: 6, scale: 0.8 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{
                  type: 'spring',
                  stiffness: 450,
                  damping: 22,
                  delay: i * 0.2 + 0.3,
                }}
              >
                <div
                  style={{
                    backgroundColor: '#1F6E54',
                    color: '#fff',
                    borderRadius: 100,
                    padding: '3px 12px',
                    fontFamily: "'Amiri', serif",
                    fontSize: 13,
                    fontWeight: 700,
                    boxShadow: '0 2px 10px #1F6E5440',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {lesson.tag}
                </div>
              </motion.div>
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
