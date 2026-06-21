import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';

export function Scene3() {
  const [phase, setPhase] = useState(0);

  useEffect(() => {
    const timers = [
      setTimeout(() => setPhase(1), 300),
      setTimeout(() => setPhase(2), 1200),
      setTimeout(() => setPhase(3), 1800),
    ];
    return () => timers.forEach(t => clearTimeout(t));
  }, []);

  return (
    <motion.div 
      className="absolute inset-0 flex flex-col items-center justify-center z-10"
      {...sceneTransitions.scaleFade}
    >
      <div className="flex gap-16 items-center w-full px-32">
        <motion.div 
          className="flex-1 relative h-[60vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
          initial={{ opacity: 0, scale: 0.8, rotateY: 20, transformPerspective: 1000 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, transformPerspective: 1000 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/mosque.png`}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Mosque"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-emerald/90 to-transparent flex flex-col justify-end p-10">
            <motion.h3 
              className="text-4xl font-display font-bold text-white mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              المشايخ
            </motion.h3>
            <motion.p 
              className="text-xl font-body text-white/90"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 2 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              علماء أفاضل ودروس موثوقة
            </motion.p>
          </div>
        </motion.div>

        <motion.div 
          className="flex-1 relative h-[60vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
          initial={{ opacity: 0, scale: 0.8, rotateY: -20, transformPerspective: 1000 }}
          animate={{ opacity: 1, scale: 1, rotateY: 0, transformPerspective: 1000 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
        >
          <img 
            src={`${import.meta.env.BASE_URL}images/parchment.png`}
            className="absolute inset-0 w-full h-full object-cover"
            alt="Library"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-gold/90 to-transparent flex flex-col justify-end p-10">
            <motion.h3 
              className="text-4xl font-display font-bold text-white mb-3"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6 }}
            >
              المكتبة
            </motion.h3>
            <motion.p 
              className="text-xl font-body text-white/90"
              initial={{ opacity: 0, y: 20 }}
              animate={phase >= 3 ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              متون وكتب علمية متوفرة دائماً
            </motion.p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
