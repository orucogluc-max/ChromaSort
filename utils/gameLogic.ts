import { BallEntity, TubeData, TUBE_CAPACITY, Difficulty } from '../types';
import { BALL_COLORS, DIFFICULTY_CONFIGS } from '../constants';

// Helper to deep clone tubes
export const cloneTubes = (tubes: TubeData[]): TubeData[] => {
  return tubes.map((tube) => [...tube]);
};

// Check if a move is valid (PLAYER RULES: Strict Color Matching)
export const isValidMove = (source: TubeData, target: TubeData): boolean => {
  // Rule 1: Source must have a ball
  if (source.length === 0) return false;

  // Rule 2: Target must not be full
  if (target.length >= TUBE_CAPACITY) return false;

  // Rule 3: Target empty OR top colors match
  if (target.length === 0) return true;
  
  const sourceBall = source[source.length - 1];
  const targetBall = target[target.length - 1];
  
  return sourceBall.color === targetBall.color;
};

// Check win condition
export const checkWin = (tubes: TubeData[]): boolean => {
  return tubes.every((tube) => {
    // Empty tube is OK
    if (tube.length === 0) return true;
    // Full tube of same color is OK
    if (tube.length !== TUBE_CAPACITY) return false;
    
    const firstColor = tube[0].color;
    return tube.every((ball) => ball.color === firstColor);
  });
};

// Procedural Level Generator
export const generateLevel = (level: number, difficulty: Difficulty): TubeData[] => {
  const config = DIFFICULTY_CONFIGS[difficulty];
  
  let numColors = config.colors;
  numColors = Math.min(numColors, BALL_COLORS.length);
  const activeColors = BALL_COLORS.slice(0, numColors);

  // Constants for empty tubes.
  // We strictly reserve the last N tubes to be empty at the end.
  const numEmptyTubes = 2; 

  let tubes: TubeData[] = [];

  // 1. Initialize with SOLVED stacks (Color Tubes)
  for (let i = 0; i < numColors; i++) {
    const tube: BallEntity[] = [];
    for (let j = 0; j < TUBE_CAPACITY; j++) {
      tube.push({
        id: `${activeColors[i]}-${i}-${j}`, // Unique ID
        color: activeColors[i]
      });
    }
    tubes.push(tube);
  }

  // 2. Add Empty Tubes
  for (let i = 0; i < numEmptyTubes; i++) {
    tubes.push([]);
  }

  // 3. CHAOS SHUFFLE
  // We perform moves that are NOT restricted by color matching.
  // This allows us to place Red on Blue, creating the puzzle state.
  
  const totalMoves = config.shuffleBase + (level * config.shuffleMultiplier);
  let movesPerformed = 0;
  let lastMove = { from: -1, to: -1 };

  while (movesPerformed < totalMoves) {
    const possibleMoves: { from: number; to: number; score: number }[] = [];

    for (let i = 0; i < tubes.length; i++) {
      if (tubes[i].length === 0) continue; // Cannot move from empty
      
      for (let j = 0; j < tubes.length; j++) {
        if (i === j) continue;
        if (tubes[j].length >= TUBE_CAPACITY) continue; // Target full
        
        // Prevent immediate backtracking (A->B then B->A)
        if (i === lastMove.to && j === lastMove.from) continue;

        // --- HEURISTIC SCORING ---
        // We want to create "Heterogeneity" (Mixed colors).
        
        const sourceBall = tubes[i][tubes[i].length - 1];
        const targetBall = tubes[j].length > 0 ? tubes[j][tubes[j].length - 1] : null;
        
        let score = Math.random() * 10; // Base randomness

        if (!targetBall) {
            // Moving to empty tube.
            // Neutral. Good for spreading, but we want to fill tubes eventually.
            score += 5; 
        } else if (sourceBall.color !== targetBall.color) {
            // CRITICAL: Moving onto a DIFFERENT color.
            // This is the core of the puzzle difficulty.
            score += 25; 
        } else {
            // Moving onto SAME color.
            // This effectively "solves" a piece. We want to AVOID this during shuffle.
            score -= 50; 
        }
        
        possibleMoves.push({ from: i, to: j, score });
      }
    }
    
    // If no moves (unlikely), break
    if (possibleMoves.length === 0) break;

    // Sort by score desc
    possibleMoves.sort((a, b) => b.score - a.score);

    // Select from top candidates to maintain quality chaos while allowing some variance
    // Taking the top 4 moves ensures we almost always pick a "Diff Color" move if available.
    const candidates = possibleMoves.slice(0, 4); 
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    
    // Execute Move
    const ball = tubes[selected.from].pop()!;
    tubes[selected.to].push(ball);
    
    lastMove = { from: selected.from, to: selected.to };
    movesPerformed++;
  }

  // 4. CONSOLIDATION PHASE
  // To ensure the game looks like a "Hard" puzzle, we try to ensure the
  // "Color Tubes" (indices 0..N) are FULL and "Empty Tubes" (indices N..end) are EMPTY.
  // This creates the "Wall of Colors" effect.
  
  const firstEmptyIndex = numColors; // The boundary between Color Tubes and Helper Tubes
  const maxConsolidationMoves = 200;

  for (let m = 0; m < maxConsolidationMoves; m++) {
      // A. Find a ball in the Helper Zone (that shouldn't be there)
      let sourceIndex = -1;
      // Search from end to start (prefer clearing last tubes first)
      for (let i = tubes.length - 1; i >= firstEmptyIndex; i--) {
          if (tubes[i].length > 0) {
              sourceIndex = i;
              break;
          }
      }

      // If no balls in helper zone, we are done!
      if (sourceIndex === -1) break;

      // B. Find a valid spot in the Color Zone
      // We prioritize spots that maintain chaos (different colors).
      let bestTarget = -1;
      let bestScore = -Infinity;

      const sourceBall = tubes[sourceIndex][tubes[sourceIndex].length - 1];

      for (let i = 0; i < firstEmptyIndex; i++) {
          if (tubes[i].length < TUBE_CAPACITY) {
              const targetBall = tubes[i].length > 0 ? tubes[i][tubes[i].length - 1] : null;
              
              let score = Math.random() * 5;
              
              if (!targetBall) {
                  score += 0; // Empty target in color zone? Rare, but ok.
              } else if (targetBall.color !== sourceBall.color) {
                  score += 20; // Good, mix it up
              } else {
                  score -= 20; // Bad, don't stack same colors if we can avoid it
              }

              if (score > bestScore) {
                  bestScore = score;
                  bestTarget = i;
              }
          }
      }

      if (bestTarget !== -1) {
          const ball = tubes[sourceIndex].pop()!;
          tubes[bestTarget].push(ball);
      } else {
          // If we can't move the ball back to the color zone (e.g. all full), 
          // we are forced to leave it. This happens if math is off, but shouldn't with correct counts.
          break;
      }
  }

  return tubes;
};