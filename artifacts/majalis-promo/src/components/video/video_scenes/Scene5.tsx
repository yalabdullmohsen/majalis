import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene5() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 600),
      setTimeout(() => setPhase(2), 1500),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.zoomThrough}
    >
      <motion.div
        className="w-40 h-40 mb-10 rounded-[32px] bg-emerald text-parchment flex items-center justify-center text-7xl font-display font-bold shadow-2xl"
        style={{ backgroundColor: 'var(--color-emerald)', color: 'var(--color-parchment)' }}
        initial={{ scale: 0, opacity: 0, rotate: 45 }}
        animate={{ scale: 1, opacity: 1, rotate: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      >
        م
      </motion.div>

      <motion.h1 
        className="text-8xl font-display font-bold text-emerald mb-4 drop-shadow-sm"
        style={{ color: 'var(--color-emerald)' }}
      >
        {'مجالس'.split('').map((char, i) => (
          <motion.span
            key={i}
            className="inline-block"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={phase >= 1 ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.5 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25, delay: phase >= 1 ? i * 0.1 : 0 }}
          >
            {char}
          </motion.span>
        ))}
      </motion.h1>

      <motion.p
        className="text-3xl font-body text-ink/70"
        initial={{ opacity: 0, y: 20 }}
        animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
        transition={{ duration: 0.8 }}
      >
        حمّل التطبيق الآن وابدأ رحلتك العلمية
      </motion.p>
    </motion.div>
  );
}
