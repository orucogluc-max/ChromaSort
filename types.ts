export interface BallEntity {
  id: string; // Unique ID for Framer Motion layoutId
  color: string;
}

export type TubeData = BallEntity[];

export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT';

export interface GameState {
  tubes: TubeData[];
  selectedTubeIndex: number | null;
  history: TubeData[][]; // Array of tube configurations
  level: number;
  isAnimating: boolean;
  gameWon: boolean;
}

export const TUBE_CAPACITY = 4;