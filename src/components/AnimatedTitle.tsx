import { useState, useCallback, type FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import birdImg from '../assets/bird.jpg';

const RAINBOW_COLORS = [
  '#ef4444', // red
  '#f97316', // orange
  '#eab308', // yellow
  '#22c55e', // green
  '#3b82f6', // blue
  '#4f46e5', // indigo
  '#a855f7', // violet
];

const getRandomColor = () => RAINBOW_COLORS[Math.floor(Math.random() * RAINBOW_COLORS.length)];

export const AnimatedTitle: FC = () => {
  const [clickedColors, setClickedColors] = useState<Record<number, string>>({});
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [currentHoverColor, setCurrentHoverColor] = useState<string>('');
  const [resettingIndices, setResettingIndices] = useState<Set<number>>(new Set());
  const [sparkleKey, setSparkleKey] = useState(0);

  const handleMouseEnter = (index: number) => {
    setHoveredIndex(index);
    setCurrentHoverColor(getRandomColor());
  };

  const handleMouseLeave = () => {
    setHoveredIndex(null);
  };

  const handleClick = (index: number) => {
    setClickedColors((prev) => ({
      ...prev,
      [index]: currentHoverColor || getRandomColor(),
    }));
  };

  const handleReset = useCallback(() => {
    const coloredIndices = Object.keys(clickedColors).map(Number).sort((a, b) => a - b);
    if (coloredIndices.length === 0 || resettingIndices.size > 0) return;

    setResettingIndices(new Set(coloredIndices));
    setSparkleKey((k) => k + 1);

    // Staggered: each letter flashes and resets with a delay
    coloredIndices.forEach((index, i) => {
      setTimeout(() => {
        setClickedColors((prev) => {
          const next = { ...prev };
          delete next[index];
          return next;
        });
      }, i * 120 + 200);
    });

    // Clear resetting state after all animations finish
    setTimeout(() => {
      setResettingIndices(new Set());
    }, coloredIndices.length * 120 + 600);
  }, [clickedColors, resettingIndices.size]);

  const renderWord = (word: string, startIndex: number, staggerBaseDelay?: number) => {
    return word.split('').map((char, i) => {
      const globalIndex = startIndex + i;
      const isHovered = hoveredIndex === globalIndex;
      const clickedColor = clickedColors[globalIndex];
      const activeColor = (isHovered ? currentHoverColor : clickedColor) || undefined;

      const isResetting = resettingIndices.has(globalIndex);
      const resetOrder = isResetting ? [...resettingIndices].indexOf(globalIndex) : 0;
      const resetDelaySec = resetOrder * 0.12;

      // Staggered animation props for 'Trials' entrance
      const animationProps = staggerBaseDelay !== undefined ? {
        initial: { y: 30, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.4, delay: staggerBaseDelay + (i * 0.08), ease: "easeOut" as const }
      } : {};

      return (
        <motion.span
          key={globalIndex}
          onMouseEnter={() => handleMouseEnter(globalIndex)}
          onMouseLeave={handleMouseLeave}
          onClick={() => handleClick(globalIndex)}
          className="relative inline-block mx-1 cursor-pointer"
          style={{
            transition: 'color 0.3s ease, text-shadow 0.3s ease',
            ...(activeColor
              ? {
                  color: activeColor,
                  textShadow: `0 0 20px ${activeColor}, 0 0 10px ${activeColor}`,
                }
              : {}),
          }}
          {...animationProps}
        >
          {char}

          {/* Sparkle burst reset effect */}
          <AnimatePresence>
            {isResetting && (
              <SparkleFlash
                key={`flash-${sparkleKey}-${globalIndex}`}
                delay={resetDelaySec}
                color={clickedColor || '#ffffff'}
              />
            )}
          </AnimatePresence>
        </motion.span>
      );
    });
  };

  return (
    <div className="relative">
      {/* Bird icon — acts as reset button */}
      <div
        className="absolute -top-10 right-[10%] w-14 h-14 flex items-center justify-center cursor-pointer hover:scale-110 active:scale-95 transition-transform z-20"
        onClick={handleReset}
        title="Reset Colors"
      >
        <img
          alt="Wing Trials Bird"
          className="w-full h-full object-contain drop-shadow-lg pixelated rounded-full"
          style={{ mixBlendMode: 'multiply' }}
          src={birdImg}
        />
      </div>

      <h1 className="text-white text-6xl md:text-8xl lg:text-9xl font-extrabold logo-3d italic text-center w-full leading-none select-none">
        <motion.div
          initial={{ y: -200, opacity: 0 }}
          animate={{
            y: [-250, 20, -10, 0],
            rotate: [0, -10, 8, -4, 0],
            opacity: [0, 1, 1, 1]
          }}
          transition={{ duration: 0.9, ease: "easeInOut" }}
          className="block"
        >
          {renderWord("Wing", 0)}
        </motion.div>

        <div className="block mt-2">
          {renderWord("Trials", 4, 0.8)}
        </div>
      </h1>
    </div>
  );
};

/* ─── Sparkle Flash Component ────────────────────────────────────────── */
/* A bright flash + burst of tiny sparkle particles that plays once,
   contained visually around the letter without clipping its 3D shadow. */

interface SparkleFlashProps {
  delay: number;
  color: string;
}

const SparkleFlash: FC<SparkleFlashProps> = ({ delay, color }) => {
  // 8 tiny spark particles burst outward from center
  const sparks = Array.from({ length: 8 }, (_, i) => {
    const angle = (i / 8) * 2 * Math.PI;
    const distance = 14 + Math.random() * 10; // px
    const tx = Math.cos(angle) * distance;
    const ty = Math.sin(angle) * distance;
    const size = 2 + Math.random() * 2;
    return { tx, ty, size, extraDelay: Math.random() * 0.06 };
  });

  return (
    <>
      {/* Central white flash glow */}
      <motion.div
        initial={{ opacity: 0, scale: 0.3 }}
        animate={{ opacity: [0, 1, 0.8, 0], scale: [0.3, 1.3, 1, 0] }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.45, delay, ease: "easeOut" as const }}
        style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          width: '80%',
          height: '80%',
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, ${color}88 0%, transparent 70%)`,
          borderRadius: '50%',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />
      {/* Spark particles bursting outward */}
      {sparks.map((spark, si) => (
        <motion.div
          key={si}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 1, 0],
            x: [0, spark.tx * 0.6, spark.tx],
            y: [0, spark.ty * 0.6, spark.ty],
            scale: [0, 1.5, 0],
          }}
          exit={{ opacity: 0 }}
          transition={{
            duration: 0.4,
            delay: delay + 0.05 + spark.extraDelay,
            ease: "easeOut" as const,
          }}
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: `${spark.size}px`,
            height: `${spark.size}px`,
            marginTop: `-${spark.size / 2}px`,
            marginLeft: `-${spark.size / 2}px`,
            background: '#fff',
            borderRadius: '50%',
            boxShadow: `0 0 ${spark.size + 3}px ${spark.size}px rgba(255,255,230,0.8)`,
            pointerEvents: 'none',
            zIndex: 6,
          }}
        />
      ))}
    </>
  );
};
