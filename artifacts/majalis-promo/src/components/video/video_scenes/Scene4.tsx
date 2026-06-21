import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { sceneTransitions } from '@/lib/video/animations';
import { SceneIntroBanner, CalloutTag } from '../SectionCallout';

export function Scene4() {
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
      className="absolute inset-0 flex flex-col items-center justify-center z-10 px-32"
      {...sceneTransitions.clipPolygon}
    >
      {/* Scene intro banner */}
      <SceneIntroBanner
        label="الفوائد"
        subtitle="اقتباسات علمية من قلب مجتمع الطلاب"
        color="brass"
        delay={0.1}
      />

      <div className="relative w-full flex flex-col items-center mt-16">
        {/* Floating annotation callouts */}
        {phase >= 3 && (
          <>
            <motion.div
              style={{ position: 'absolute', top: -36, right: '8%', zIndex: 20 }}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.1 }}
            >
              <CalloutTag label="شارك فائدة" color="emerald" delay={0} arrowDir="down" />
            </motion.div>

            <motion.div
              style={{ position: 'absolute', top: -36, left: '8%', zIndex: 20 }}
              initial={{ opacity: 0, y: 10, scale: 0.8 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 420, damping: 22, delay: 0.25 }}
            >
              <CalloutTag label="مراجعة المشايخ" color="brass" delay={0} arrowDir="down" />
            </motion.div>
          </>
        )}

        <motion.div
          className="relative bg-white/60 backdrop-blur-xl p-16 rounded-[40px] shadow-2xl border border-white/50 max-w-4xl text-center w-full"
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

          {/* Approval badge that appears at phase 3 */}
          {phase >= 3 && (
            <motion.div
              style={{
                position: 'absolute',
                bottom: 20,
                right: 20,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                backgroundColor: 'rgba(31,110,84,0.1)',
                border: '1.5px solid rgba(31,110,84,0.25)',
                borderRadius: 100,
                padding: '6px 16px',
                direction: 'rtl',
              }}
              initial={{ opacity: 0, scale: 0.7 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: 'spring', stiffness: 460, damping: 22, delay: 0.1 }}
            >
              <motion.div
                style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#1F6E54' }}
                animate={{ scale: [1, 1.5, 1], opacity: [1, 0.4, 1] }}
                transition={{ duration: 1.8, repeat: Infinity }}
              />
              <span style={{ fontFamily: "'Almarai', sans-serif", fontSize: 13, fontWeight: 700, color: '#1F6E54' }}>
                موثّق ومراجَع
              </span>
            </motion.div>
          )}
        </motion.div>
      </div>
    </motion.div>
  );
}
