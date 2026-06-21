import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

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
    { title: 'شرح كتاب التوحيد', subtitle: 'الشيخ صالح آل الشيخ' },
    { title: 'تفسير ابن كثير', subtitle: 'الشيخ عبد الرزاق البدر' },
    { title: 'عمدة الأحكام', subtitle: 'الشيخ عبد السلام الشويعر' },
  ];

  return (
    <motion.div 
      className="absolute inset-0 flex items-center justify-between px-32 z-10"
      {...sceneTransitions.slideLeft}
    >
      <div className="w-1/2 pr-16">
        <motion.div
          className="text-gold text-2xl font-body mb-4 font-bold tracking-wider"
          style={{ color: 'var(--color-gold)' }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          الدروس
        </motion.div>
        
        <motion.h2 
          className="text-6xl font-display font-bold text-emerald mb-8 leading-tight drop-shadow-sm"
          style={{ color: 'var(--color-emerald)' }}
        >
          {'مجالس علمية'.split('').map((char, i) => (
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

      <div className="w-1/2 flex flex-col gap-6 relative">
        {lessons.map((lesson, i) => (
          <motion.div
            key={i}
            className="bg-white rounded-2xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-emerald/10 flex items-center"
            initial={{ opacity: 0, x: -50, scale: 0.9 }}
            animate={phase >= 3 ? { opacity: 1, x: 0, scale: 1 } : { opacity: 0, x: -50, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25, delay: phase >= 3 ? i * 0.2 : 0 }}
          >
            <div className="w-12 h-12 rounded-full bg-sage/30 flex items-center justify-center mr-6 shrink-0 ml-6" style={{ backgroundColor: 'var(--color-sage)' }}>
              <div className="w-4 h-4 rounded-full bg-emerald" style={{ backgroundColor: 'var(--color-emerald)' }} />
            </div>
            <div>
              <h3 className="text-2xl font-display font-bold text-ink mb-1">{lesson.title}</h3>
              <p className="text-xl font-body text-ink/60">{lesson.subtitle}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
