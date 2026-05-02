import React from 'react';
import { motion } from 'framer-motion';
import { TubeData, TUBE_CAPACITY } from '../types';
import { Ball } from './Ball';

interface TubeProps {
  tube: TubeData;
  tubeIndex: number;
  isSelected: boolean;
  isShaking: boolean;
  onTap: (index: number) => void;
  isGameWon: boolean;
}

export const Tube: React.FC<TubeProps> = ({ tube, tubeIndex, isSelected, isShaking, onTap, isGameWon }) => {
  // Determine if this tube is "complete" (full and same color)
  const isComplete =
    tube.length === TUBE_CAPACITY &&
    tube.every((b) => b.color === tube[0].color);

  return (
    // Reduced height from h-52/h-64 to h-48/h-56 to make it look like it fits exactly 4 balls
    <div className="relative flex justify-center h-48 sm:h-56">
      {/* Main Tube Container */}
      <motion.div
        onClick={() => onTap(tubeIndex)}
        animate={isShaking ? { x: [0, -4, 4, -4, 4, 0] } : { x: 0 }}
        transition={{ duration: 0.3 }}
        style={{ willChange: 'transform' }}
        className={`
          relative flex flex-col-reverse items-center justify-start 
          w-[3.5rem] sm:w-[4rem] h-full
          cursor-pointer select-none
        `}
      >
        {/* --- SIMPLIFIED GLASS TUBE --- */}
        <div className={`
          absolute inset-0 z-0
          rounded-b-[2rem] rounded-t-[1rem]
          border-x-[1px] border-b-[2px] border-t-0
          
          /* Simplified background */
          bg-white/5
          
          /* Dynamic Selection/State Styles */
          ${isSelected 
             ? 'border-white/40 bg-white/10' 
             : 'border-white/10'}
             
          ${isComplete && isGameWon 
             ? 'border-emerald-400/40' 
             : ''}
        `}>
           {/* Simple Specular Highlight */}
           <div className="absolute left-[15%] top-4 bottom-8 w-[10%] bg-white/5 rounded-full pointer-events-none"></div>

           {/* Tube Opening (Rim) */}
           <div className={`
             absolute -top-[5px] left-[-1px] right-[-1px] h-[12px]
             rounded-[50%] 
             border-[1px]
             bg-white/5
             ${isSelected ? 'border-white/40' : 'border-white/10'}
             ${isComplete && isGameWon ? 'border-emerald-400/50' : ''}
           `}></div>
        </div>

        {/* Balls Container */}
        <div className="w-full h-full flex flex-col-reverse justify-start px-1.5 sm:px-2 pb-3 pt-3 gap-1 z-10">
          {tube.map((ball, index) => {
            const isTopBall = index === tube.length - 1;
            const isBallSelected = isSelected && isTopBall;

            return (
              <Ball
                key={ball.id}
                ball={ball}
                index={index}
                isSelected={isBallSelected}
              />
            );
          })}
        </div>
        
        {/* Completed Indicator */}
        {isComplete && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute -top-10 left-0 right-0 flex justify-center z-20"
          >
             <div className="bg-emerald-500/20 p-1.5 rounded-full backdrop-blur-md border border-emerald-500/50 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
             </div>
          </motion.div>
        )}
      </motion.div>
    </div>
  );
};