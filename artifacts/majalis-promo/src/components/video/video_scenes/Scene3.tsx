import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { SceneIntroBanner, SectionCallout } from '../SectionCallout';

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
      {/* Scene intro banner */}
      <SceneIntroBanner
        label="المشايخ والمكتبة"
        subtitle="علماء موثوقون ومصادر علمية أصيلة"
        color="emerald"
        delay={0.05}
      />

      <div className="flex gap-16 items-center w-full px-32 mt-16">
        {/* المشايخ panel */}
        <motion.div 
          className="flex-1 relative h-[55vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
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

          {/* Callout badge for المشايخ */}
          {phase >= 2 && (
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <SectionCallout
                label="علماء موثّقون"
                color="emerald"
                delay={0.1}
                size="sm"
              />
            </div>
          )}

          {/* Stats callout tag */}
          {phase >= 2 && (
            <motion.div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                backgroundColor: 'rgba(255,255,255,0.92)',
                backdropFilter: 'blur(12px)',
                borderRadius: 12,
                padding: '8px 14px',
                direction: 'rtl',
                boxShadow: '0 4px 20px rgba(31,110,84,0.18)',
                border: '1px solid rgba(31,110,84,0.15)',
              }}
              initial={{ opacity: 0, scale: 0.75, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 400, damping: 24, delay: 0.3 }}
            >
              <div style={{ fontFamily: "'Amiri', serif", fontSize: 22, fontWeight: 700, color: '#1F6E54', lineHeight: 1 }}>+٢٠</div>
              <div style={{ fontFamily: "'Almarai', sans-serif", fontSize: 11, color: '#1F6E5499', marginTop: 2 }}>شيخاً مُعتمداً</div>
            </motion.div>
          )}
        </motion.div>

        {/* المكتبة panel */}
        <motion.div 
          className="flex-1 relative h-[55vh] rounded-3xl overflow-hidden shadow-2xl border-4 border-white"
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

          {/* Callout badge for المكتبة */}
          {phase >= 3 && (
            <div style={{ position: 'absolute', top: 16, right: 16 }}>
              <SectionCallout
                label="مصادر أصيلة"
                color="brass"
                delay={0.05}
                size="sm"
              />
            </div>
          )}

          {/* Content type tags */}
          {phase >= 3 && (
            <motion.div
              style={{
                position: 'absolute',
                top: 16,
                left: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                direction: 'rtl',
              }}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', stiffness: 350, damping: 24, delay: 0.2 }}
            >
              {['متون', 'كتب', 'رسائل'].map((tag, i) => (
                <motion.div
                  key={tag}
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    backdropFilter: 'blur(10px)',
                    borderRadius: 8,
                    padding: '4px 12px',
                    fontFamily: "'Amiri', serif",
                    fontSize: 13,
                    fontWeight: 700,
                    color: '#B08D2E',
                    border: '1px solid rgba(176,141,46,0.2)',
                    boxShadow: '0 2px 10px rgba(176,141,46,0.15)',
                    whiteSpace: 'nowrap',
                  }}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.2 + i * 0.12, type: 'spring', stiffness: 400, damping: 24 }}
                >
                  {tag}
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
