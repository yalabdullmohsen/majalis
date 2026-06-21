import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene4() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-32"
      {...sceneTransitions.clipPolygon}
    >
      <motion.div
        className="text-gold text-2xl font-body mb-6 font-bold tracking-wider"
        style={{ color: 'var(--color-gold)' }}
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        الفوائد
      </motion.div>

      <motion.div
        className="relative bg-white/60 backdrop-blur-xl p-16 rounded-[40px] shadow-2xl border border-white/50 max-w-4xl text-center"
        initial={{ opacity: 0, scale: 0.95, y: 30 }}
        animate={phase >= 1 ? { opacity: 1, scale: 1, y: 0 } : { opacity: 0, scale: 0.95, y: 30 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      >
        <div className="absolute top-8 right-8 text-gold opacity-20 text-8xl font-display leading-none">"</div>
        <div className="absolute bottom-8 left-8 text-gold opacity-20 text-8xl font-display leading-none rotate-180">"</div>
        
        <motion.h2 
          className="text-5xl font-display font-bold text-emerald leading-tight mb-8 drop-shadow-sm"
          style={{ color: 'var(--color-emerald)', lineHeight: '1.4' }}
        >
          "العلم صيد والكتابة قيده<br/>قيد صيودك بالحبال الواثقة"
        </motion.h2>

        <motion.p
          className="text-2xl font-body text-ink/70"
          initial={{ opacity: 0 }}
          animate={phase >= 2 ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 1 }}
        >
          شارك الفوائد والاقتباسات مع مجتمع طلبة العلم
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
