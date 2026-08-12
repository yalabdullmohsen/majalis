import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useVideoPlayer } from '@/lib/video';
import { Scene1 } from './video_scenes/Scene1';
import { Scene2 } from './video_scenes/Scene2';
import { Scene3 } from './video_scenes/Scene3';
import { Scene4 } from './video_scenes/Scene4';
import { Scene5 } from './video_scenes/Scene5';

export const SCENE_DURATIONS: Record<string, number> = {
  intro: 4000,
  lessons: 4500,
  sheikhs_library: 4500,
  fawaid: 4000,
  outro: 4000,
};

const SCENE_COMPONENTS: Record<string, React.ComponentType> = {
  intro: Scene1,
  lessons: Scene2,
  sheikhs_library: Scene3,
  fawaid: Scene4,
  outro: Scene5,
};

const bgPos = [
  { x: '0%', y: '0%', scale: 1 },
  { x: '-5%', y: '-5%', scale: 1.1 },
  { x: '-10%', y: '5%', scale: 1.15 },
  { x: '5%', y: '10%', scale: 1.05 },
  { x: '0%', y: '0%', scale: 1 },
];

export default function VideoTemplate({
  durations = SCENE_DURATIONS,
  loop = true,
  onSceneChange,
}: {
  durations?: Record<string, number>;
  loop?: boolean;
  onSceneChange?: (sceneKey: string) => void;
} = {}) {
  const { currentScene, currentSceneKey } = useVideoPlayer({ durations, loop });

  useEffect(() => {
    onSceneChange?.(currentSceneKey);
  }, [currentSceneKey, onSceneChange]);

  const baseSceneKey = currentSceneKey.replace(/_r[12]$/, '') as keyof typeof SCENE_DURATIONS;
  const sceneIndex = Object.keys(SCENE_DURATIONS).indexOf(baseSceneKey);
  const SceneComponent = SCENE_COMPONENTS[baseSceneKey];

  return (
    <div className="relative w-full h-screen overflow-hidden bg-[#FAF5EA] font-body text-[#241F18]">
      {/* Persistent Background Layer */}
      <div className="absolute inset-0 z-0">
        <motion.div
          className="absolute inset-[-20%] opacity-10"
          style={{
            backgroundImage: `url(${import.meta.env.BASE_URL}images/pattern.png)`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
          animate={bgPos[sceneIndex] ?? bgPos[0]}
          transition={{ duration: 4.5, ease: [0.25, 0.1, 0.25, 1] }}
        />
        <div className="absolute inset-0 bg-[#FAF5EA]/80" />
      </div>

      {/* Decorative Accents */}
      <motion.div
        className="absolute w-[800px] h-[800px] rounded-full blur-[120px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, #CFE0D3, transparent)' }}
        animate={{
          x: ['-20%', '40%', '80%', '20%', '-20%'][sceneIndex],
          y: ['-20%', '10%', '-30%', '50%', '-20%'][sceneIndex],
          opacity: [0.4, 0.6, 0.5, 0.7, 0.4][sceneIndex],
        }}
        transition={{ duration: 4.5, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute w-[600px] h-[600px] rounded-full blur-[100px] pointer-events-none z-0"
        style={{ background: 'radial-gradient(circle, #B08D2E, transparent)' }}
        animate={{
          x: ['60%', '-10%', '10%', '70%', '60%'][sceneIndex],
          y: ['60%', '80%', '20%', '-10%', '60%'][sceneIndex],
          opacity: [0.15, 0.25, 0.2, 0.3, 0.15][sceneIndex],
        }}
        transition={{ duration: 4.5, ease: 'easeInOut' }}
      />

      {/* Scene Content */}
      <AnimatePresence mode="popLayout">
        {SceneComponent && <SceneComponent key={currentSceneKey} />}
      </AnimatePresence>
    </div>
  );
}
