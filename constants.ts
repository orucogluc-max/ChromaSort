import { Difficulty } from './types';

export const BALL_COLORS = [
  '#ff0000', // Bright Red
  '#0088ff', // Azure Blue
  '#00cc00', // Lime Green
  '#ffcc00', // Gold Yellow
  '#9900cc', // Deep Purple
  '#ff00cc', // Hot Pink
  '#00cccc', // Cyan
  '#ff6600', // Orange
  '#708090', // Slate Gray
  '#8b4513', // Saddle Brown
  '#000080', // Navy Blue
  '#2e8b57', // Sea Green
  '#800000', // Maroon (New for max difficulty)
  '#4b0082', // Indigo (New for max difficulty)
];

// Difficulty configuration
export const INITIAL_LEVEL = 1;
export const MAX_UNDO_HISTORY = 5;

// shuffleMultiplier: Level başına eklenen karıştırma sayısı
// chaosTarget: 0-1 arası (0 = tamamen karışık/hiç yan yana aynı renk yok, 1 = düzenli)
export const DIFFICULTY_CONFIGS: Record<Difficulty, { colors: number; shuffleBase: number; shuffleMultiplier: number; label: string; chaosTarget: number }> = {
  EASY: {
    label: 'Easy',
    colors: 4,
    shuffleBase: 50,
    shuffleMultiplier: 10,
    chaosTarget: 0.5 // Biraz düzenli olabilir
  },
  MEDIUM: {
    label: 'Medium',
    colors: 6,
    shuffleBase: 100,
    shuffleMultiplier: 25,
    chaosTarget: 0.3 // Daha karışık
  },
  HARD: {
    label: 'Hard',
    colors: 9,
    shuffleBase: 500, // Çok daha fazla başlangıç karıştırması
    shuffleMultiplier: 100,
    chaosTarget: 0.1 // Neredeyse hiç yan yana aynı renk olmasın
  },
  EXPERT: {
    label: 'Expert',
    colors: 12, // Maksimum renk
    shuffleBase: 2000, // Extreme karıştırma
    shuffleMultiplier: 200,
    chaosTarget: 0.05 // Tamamen kaos (Mümkün olan maksimum karışıklık)
  }
};

// Ultra-glossy "Bubble" styles
export const COLOR_STYLES: Record<string, string> = {
  '#ff0000': 'bg-[radial-gradient(circle_at_30%_30%,_#ff6666,_#cc0000,_#660000)] shadow-[0_0_10px_rgba(255,0,0,0.4)]',
  '#0088ff': 'bg-[radial-gradient(circle_at_30%_30%,_#66b3ff,_#0066cc,_#003366)] shadow-[0_0_10px_rgba(0,136,255,0.4)]',
  '#00cc00': 'bg-[radial-gradient(circle_at_30%_30%,_#66ff66,_#009900,_#004d00)] shadow-[0_0_10px_rgba(0,204,0,0.4)]',
  '#ffcc00': 'bg-[radial-gradient(circle_at_30%_30%,_#ffff66,_#cca300,_#665200)] shadow-[0_0_10px_rgba(255,204,0,0.4)]',
  '#9900cc': 'bg-[radial-gradient(circle_at_30%_30%,_#d966ff,_#8000aa,_#400055)] shadow-[0_0_10px_rgba(153,0,204,0.4)]',
  '#ff00cc': 'bg-[radial-gradient(circle_at_30%_30%,_#ff66e6,_#cc0099,_#66004d)] shadow-[0_0_10px_rgba(255,0,204,0.4)]',
  '#00cccc': 'bg-[radial-gradient(circle_at_30%_30%,_#66ffff,_#009999,_#004d4d)] shadow-[0_0_10px_rgba(0,204,204,0.4)]',
  '#ff6600': 'bg-[radial-gradient(circle_at_30%_30%,_#ff9966,_#cc5200,_#662900)] shadow-[0_0_10px_rgba(255,102,0,0.4)]',
  '#708090': 'bg-[radial-gradient(circle_at_30%_30%,_#b0c4de,_#708090,_#2f4f4f)] shadow-[0_0_10px_rgba(112,128,144,0.4)]',
  '#8b4513': 'bg-[radial-gradient(circle_at_30%_30%,_#cd853f,_#8b4513,_#5e2605)] shadow-[0_0_10px_rgba(139,69,19,0.4)]',
  '#000080': 'bg-[radial-gradient(circle_at_30%_30%,_#4169e1,_#000080,_#000033)] shadow-[0_0_10px_rgba(0,0,128,0.4)]',
  '#2e8b57': 'bg-[radial-gradient(circle_at_30%_30%,_#3cb371,_#2e8b57,_#1b4d3e)] shadow-[0_0_10px_rgba(46,139,87,0.4)]',
  '#800000': 'bg-[radial-gradient(circle_at_30%_30%,_#a52a2a,_#800000,_#4d0000)] shadow-[0_0_10px_rgba(128,0,0,0.4)]',
  '#4b0082': 'bg-[radial-gradient(circle_at_30%_30%,_#8a2be2,_#4b0082,_#2e0057)] shadow-[0_0_10px_rgba(75,0,130,0.4)]',
};