import React from 'react';
import { motion } from 'framer-motion';
import { COLOR_STYLES } from '../constants';
import { BallEntity } from '../types';

interface BallProps {
  ball: BallEntity;
  index: number;
  isSelected: boolean;
}

export const Ball: React.FC<BallProps> = ({ ball, isSelected }) => {
  const styleClass = COLOR_STYLES[ball.color] || 'bg-gray-500';

  return (
    <motion.div
      layoutId={ball.id}
      className={`
        w-full aspect-square rounded-full relative z-10
        ${styleClass}
        border border-black/5
      `}
      style={{ willChange: 'transform' }}
      initial={false}
      animate={{
        y: isSelected ? -35 : 0,
        scale: isSelected ? 1.05 : 1,
      }}
      transition={{
        type: 'tween',
        ease: 'easeOut',
        duration: 0.2,
      }}
    >
      {/* Simplified Highlight */}
      <div className="absolute top-[15%] left-[15%] w-[25%] h-[25%] bg-white/30 rounded-full pointer-events-none" />
    </motion.div>
  );
};