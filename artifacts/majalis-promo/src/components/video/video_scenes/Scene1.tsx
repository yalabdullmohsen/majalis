import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene1() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 500),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 2000),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.fadeBlur}
    >
      <div className="relative flex flex-col items-center">
        <motion.div
          className="w-32 h-32 mb-8 rounded-2xl bg-emerald text-parchment flex items-center justify-center text-5xl font-display font-bold shadow-2xl"
          style={{ backgroundColor: 'var(--color-emerald)', color: 'var(--color-parchment)' }}
          initial={{ scale: 0, opacity: 0, rotate: -15 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 20 }}
        >
          م
        </motion.div>
        
        <motion.h1 
          className="text-8xl font-display font-bold text-emerald mb-6 text-center leading-tight drop-shadow-sm"
          style={{ color: 'var(--color-emerald)' }}
        >
          {'مجالس العلم'.split('').map((char, i) => (
            <motion.span
              key={i}
              className="inline-block"
              initial={{ opacity: 0, y: 50 }}
              animate={phase >= 1 ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25, delay: phase >= 1 ? i * 0.1 : 0 }}
            >
              {char}
            </motion.span>
          ))}
        </motion.h1>

        <motion.div
          className="h-[2px] bg-gold w-0 mb-6"
          style={{ backgroundColor: 'var(--color-gold)' }}
          animate={phase >= 2 ? { width: '100px' } : { width: 0 }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />

        <motion.p
          className="text-3xl font-body text-ink/80 text-center max-w-lg leading-relaxed"
          initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
          animate={phase >= 3 ? { opacity: 1, filter: 'blur(0px)', y: 0 } : { opacity: 0, filter: 'blur(10px)', y: 20 }}
          transition={{ duration: 0.8 }}
        >
          منصتك لتعلم العلم الشرعي الموثوق
        </motion.p>
      </div>
    </motion.div>
  );
}
