import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { LayoutGroup, motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Undo2, Play, Trophy, Home, Plus, Settings, Volume2, VolumeX, Grid, Lock, ChevronLeft, Pause, X, FlaskConical, BarChart3, Smartphone, Menu, Check, Star, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

import { TubeData, Difficulty } from './types';
import { generateLevel, isValidMove, cloneTubes, checkWin } from './utils/gameLogic';
import { Tube } from './components/Tube';
import { INITIAL_LEVEL, MAX_UNDO_HISTORY, DIFFICULTY_CONFIGS } from './constants';
import { audioManager } from './utils/audio';

type AppState = 'start' | 'playing' | 'levels';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('start');
  const [level, setLevel] = useState<number>(INITIAL_LEVEL);
  
  // Persist max level progress
  const [maxLevel, setMaxLevel] = useState<number>(() => {
    try {
      return parseInt(localStorage.getItem('chromasort_max_level') || '1');
    } catch {
      return 1;
    }
  });

  // Difficulty State
  const [difficulty, setDifficulty] = useState<Difficulty>(() => {
    try {
      return (localStorage.getItem('chromasort_difficulty') as Difficulty) || 'MEDIUM';
    } catch {
      return 'MEDIUM';
    }
  });

  const [tubes, setTubes] = useState<TubeData[]>([]);
  const [history, setHistory] = useState<TubeData[][]>([]);
  const [selectedTubeIndex, setSelectedTubeIndex] = useState<number | null>(null);
  const [gameWon, setGameWon] = useState<boolean>(false);
  const [shakingTubeIndex, setShakingTubeIndex] = useState<number | null>(null);
  
  // Extra Tube Logic (Limited to 1)
  const [extraTubeUsed, setExtraTubeUsed] = useState<boolean>(false);
  
  const [showSettings, setShowSettings] = useState<boolean>(false);

  // Scroll ref for roadmap
  const roadmapContainerRef = useRef<HTMLDivElement>(null);
  
  // Settings State
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chromasort_sound') !== 'false';
    } catch {
      return true;
    }
  });

  const [vibrationEnabled, setVibrationEnabled] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chromasort_vibration') !== 'false';
    } catch {
      return true;
    }
  });

  useEffect(() => {
    audioManager.toggle(soundEnabled);
    localStorage.setItem('chromasort_sound', soundEnabled.toString());
  }, [soundEnabled]);

  useEffect(() => {
    localStorage.setItem('chromasort_vibration', vibrationEnabled.toString());
  }, [vibrationEnabled]);

  const vibrate = (pattern: number | number[]) => {
    if (vibrationEnabled && navigator.vibrate) {
      navigator.vibrate(pattern);
    }
  };

  const initLevel = useCallback((lvl: number, diff: Difficulty) => {
    const newTubes = generateLevel(lvl, diff);
    setTubes(newTubes);
    setHistory([]);
    setSelectedTubeIndex(null);
    setGameWon(false);
    setShakingTubeIndex(null);
    setExtraTubeUsed(false);
  }, []);

  useEffect(() => {
    if (appState === 'playing') {
      initLevel(level, difficulty);
    }
  }, [level, difficulty, appState, initLevel]);

  useEffect(() => {
    localStorage.setItem('chromasort_difficulty', difficulty);
  }, [difficulty]);

  useEffect(() => {
    if (gameWon) {
      audioManager.playWin();
      if (level >= maxLevel) {
        const nextMax = level + 1;
        setMaxLevel(nextMax);
        localStorage.setItem('chromasort_max_level', nextMax.toString());
      }
      vibrate([100, 50, 100]);
      
      const fireConfetti = () => {
         confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      };
      fireConfetti();
    }
  }, [gameWon, level, maxLevel]);

  // Roadmap Auto-Scroll Logic
  useEffect(() => {
    if (appState === 'levels' && roadmapContainerRef.current) {
        // Find the current level node or the max level node
        const maxLevelNode = document.getElementById(`level-node-${maxLevel}`);
        if (maxLevelNode) {
            setTimeout(() => {
                maxLevelNode.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        }
    }
  }, [appState, maxLevel]);

  const triggerShake = (index: number) => {
    setShakingTubeIndex(index);
    audioManager.playError();
    vibrate(50);
    setTimeout(() => setShakingTubeIndex(null), 400);
  };

  const handleTubeTap = (index: number) => {
    if (gameWon) return;

    if (selectedTubeIndex === null) {
      if (tubes[index].length > 0) {
        setSelectedTubeIndex(index);
        audioManager.playPop();
        vibrate(10);
      } else {
        triggerShake(index);
      }
      return;
    }

    if (selectedTubeIndex === index) {
      setSelectedTubeIndex(null);
      return;
    }

    const sourceTube = tubes[selectedTubeIndex];
    const targetTube = tubes[index];

    if (isValidMove(sourceTube, targetTube)) {
      performMove(selectedTubeIndex, index);
      audioManager.playPlop();
      vibrate(20);
    } else {
      if (tubes[index].length > 0) {
          const sourceBall = sourceTube[sourceTube.length - 1];
          const targetBall = targetTube[targetTube.length - 1];
          if (targetBall && sourceBall.color !== targetBall.color) {
             setSelectedTubeIndex(index);
             audioManager.playPop();
             return;
          }
      }
      triggerShake(selectedTubeIndex);
    }
  };

  const performMove = (fromIndex: number, toIndex: number) => {
    const newTubes = cloneTubes(tubes);
    const movingBall = newTubes[fromIndex].pop();

    if (movingBall) {
      const newHistory = [...history, cloneTubes(tubes)];
      if (newHistory.length > MAX_UNDO_HISTORY) {
        newHistory.shift();
      }
      setHistory(newHistory);
      newTubes[toIndex].push(movingBall);
      setTubes(newTubes);
      setSelectedTubeIndex(null);

      if (checkWin(newTubes)) {
        setGameWon(true);
      }
    }
  };

  const handleUndo = () => {
    if (history.length === 0 || gameWon) return;
    const previousState = history[history.length - 1];
    setTubes(previousState);
    setHistory(history.slice(0, -1));
    setSelectedTubeIndex(null);
    audioManager.playPop();
  };

  const executeAddTube = () => {
    const newTubes = cloneTubes(tubes);
    newTubes.push([]);
    setTubes(newTubes);
    setExtraTubeUsed(true); 
    audioManager.playWin(); 
  };

  const handleAddTubeClick = () => {
    if (gameWon) return;
    if (extraTubeUsed) {
        audioManager.playError();
        vibrate(50);
        return;
    }
    executeAddTube();
  };

  const handleRestart = () => {
    initLevel(level, difficulty);
  };

  const nextLevel = () => {
    setLevel((l) => l + 1);
  };
  
  const goHome = () => {
    setAppState('start');
    setGameWon(false);
  };

  const startGame = () => {
    audioManager.playPop();
    setLevel(maxLevel);
    setAppState('playing');
  }

  const selectLevel = (lvl: number) => {
    if (lvl > maxLevel) return;
    audioManager.playPop();
    setLevel(lvl);
    setAppState('playing');
  }

  const toggleSound = () => {
    setSoundEnabled(prev => !prev);
  }

  const toggleVibration = () => {
    setVibrationEnabled(prev => {
        const newVal = !prev;
        if (newVal && navigator.vibrate) navigator.vibrate(50);
        return newVal;
    });
  }

  const changeDifficulty = (diff: Difficulty) => {
    setDifficulty(diff);
    audioManager.playPop();
  }

  // --- Simplified Roadmap Generation ---
  const roadmapData = useMemo(() => {
    const levelsToShow = Math.min(100, maxLevel + 10); 
    const ITEM_HEIGHT = 100; 
    const AMPLITUDE = 60; 
    const points: { x: number; y: number; level: number }[] = [];
    
    for (let i = 0; i < levelsToShow; i++) {
        const x = Math.sin(i * 0.8) * AMPLITUDE; 
        const y = i * ITEM_HEIGHT;
        points.push({ x, y, level: i + 1 });
    }

    return { points, totalHeight: levelsToShow * ITEM_HEIGHT };
  }, [maxLevel]);


  return (
    <div className="min-h-screen flex flex-col font-sans relative select-none">
      
      <AnimatePresence mode="wait">
        
        {/* --- START SCREEN --- */}
        {appState === 'start' && (
          <motion.div 
            key="start-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6"
          >
            {/* Glass Card Container */}
            <div className="bg-white/10 border border-white/20 rounded-[2.5rem] p-8 w-full max-w-sm shadow-xl">
                
                {/* Header */}
                <div className="flex justify-between items-start mb-10">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-md">
                        <FlaskConical className="text-white" size={24} />
                    </div>
                    <button 
                      onClick={() => setShowSettings(true)}
                      className="p-3 rounded-full hover:bg-white/10 transition-colors text-white/80"
                    >
                      <Settings size={24} />
                    </button>
                </div>

                <div className="mb-12">
                    <h1 className="text-5xl text-white tracking-wider mb-2 drop-shadow-md font-titan leading-tight">
                        Chroma<br/>Sort
                    </h1>
                    <p className="text-indigo-200 text-sm font-bold tracking-widest uppercase opacity-80">
                        Modern Puzzle Challenge
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-4">
                    <motion.button
                        onClick={startGame}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-2xl bg-white text-indigo-900 font-black text-xl shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3 font-titan tracking-wide"
                    >
                        <Play fill="currentColor" size={24} />
                        PLAY NOW
                    </motion.button>
                    
                    <motion.button
                        onClick={() => setAppState('levels')}
                        whileTap={{ scale: 0.98 }}
                        className="w-full py-4 rounded-2xl bg-indigo-900/40 border border-white/10 text-white font-bold text-lg hover:bg-indigo-900/60 transition-colors flex items-center justify-center gap-3 tracking-wide"
                    >
                        <Sparkles size={20} />
                        ROADMAP
                    </motion.button>
                </div>

                {/* Difficulty Pill */}
                <div className="mt-8 p-1.5 bg-black/20 rounded-xl flex">
                     {(Object.keys(DIFFICULTY_CONFIGS) as Difficulty[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => changeDifficulty(key)}
                        className={`
                          flex-1 py-2 rounded-lg text-[10px] font-bold transition-all uppercase tracking-wider
                          ${difficulty === key 
                            ? 'bg-white text-indigo-900 shadow-sm' 
                            : 'text-white/60 hover:text-white'}
                        `}
                      >
                        {DIFFICULTY_CONFIGS[key].label}
                      </button>
                    ))}
                </div>
            </div>
          </motion.div>
        )}

        {/* --- ROADMAP / LEVELS SCREEN --- */}
        {appState === 'levels' && (
           <motion.div 
            key="level-select"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="absolute inset-0 z-30 bg-[#0f1020] flex flex-col"
          >
             {/* Sticky Header */}
             <div className="absolute top-0 left-0 right-0 p-6 pt-8 z-10 bg-gradient-to-b from-[#0f1020] via-[#0f1020]/95 to-transparent">
                 <div className="flex items-center gap-4">
                    <button 
                        onClick={goHome} 
                        className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-white border border-white/5"
                    >
                        <ChevronLeft size={28} />
                    </button>
                    <div>
                        <h2 className="text-3xl font-titan text-white tracking-wide flex items-center gap-2">
                            Roadmap <Sparkles size={24} className="text-yellow-400" fill="currentColor"/>
                        </h2>
                    </div>
                 </div>
             </div>

             {/* Scrollable Map Area */}
             <div 
                ref={roadmapContainerRef}
                className="flex-1 overflow-y-auto overflow-x-hidden relative scroll-smooth"
             >
                <div 
                    className="w-full relative mx-auto max-w-md pt-40 pb-40"
                    style={{ height: roadmapData.totalHeight + 300 }}
                >
                    {/* Simple Path - Core */}
                    <svg 
                        className="absolute top-[170px] left-0 w-full h-full pointer-events-none z-0"
                        style={{ overflow: 'visible' }}
                    >
                        <path 
                            d={`M ${roadmapData.points.map(p => `${p.x} ${p.y}`).join(' L ')}`} 
                            fill="none" 
                            stroke="#6366f1" 
                            strokeWidth="2"
                            strokeOpacity="0.2"
                            strokeDasharray="4 4"
                            transform="translate(50%, 0)"
                        />
                    </svg>
                    
                    {/* Level Nodes */}
                    {roadmapData.points.map((point, i) => {
                        const isUnlocked = point.level <= maxLevel;
                        const isCurrent = point.level === maxLevel;
                        const isCompleted = point.level < maxLevel;
                        
                        return (
                            <motion.div
                                key={point.level}
                                id={`level-node-${point.level}`}
                                className="absolute flex flex-col items-center justify-center w-20 h-20 -ml-10 -mt-10"
                                style={{ 
                                    left: `calc(50% + ${point.x}px)`, 
                                    top: point.y + 170,
                                    willChange: 'transform'
                                }}
                            >
                                {/* Rotating Ring for Current Level */}
                                {isCurrent && (
                                    <div className="absolute inset-0 rounded-full border-2 border-indigo-400 border-dashed animate-[spin_10s_linear_infinite] opacity-50 scale-125"></div>
                                )}
                                
                                <button
                                    onClick={() => selectLevel(point.level)}
                                    disabled={!isUnlocked}
                                    className={`
                                        relative rounded-2xl flex items-center justify-center text-lg
                                        transition-all duration-300 shadow-xl z-10
                                        ${isCurrent 
                                            ? 'w-16 h-16 bg-white text-indigo-900 border-4 border-indigo-500 scale-110' 
                                            : isCompleted
                                                ? 'w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-2 border-indigo-300'
                                                : 'w-12 h-12 bg-white/5 backdrop-blur-sm text-white/30 border border-white/10 cursor-not-allowed'}
                                    `}
                                >
                                    {isCompleted ? (
                                        <div className="flex flex-col items-center">
                                            <Star size={20} fill="#fbbf24" className="text-yellow-400 drop-shadow-md" />
                                        </div>
                                    ) : !isUnlocked ? (
                                        <Lock size={16} />
                                    ) : (
                                        <span className="text-xl drop-shadow-sm font-titan pt-1">{point.level}</span>
                                    )}
                                    
                                    {/* Glass Shine Effect */}
                                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/40 to-transparent opacity-50 pointer-events-none"></div>
                                </button>
                                
                                {/* Label for current level */}
                                {isCurrent && (
                                    <motion.div 
                                        initial={{ y: 5, opacity: 0 }}
                                        animate={{ y: 0, opacity: 1 }}
                                        className="absolute -bottom-10 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-lg border border-white/20"
                                    >
                                        Playing
                                    </motion.div>
                                )}
                                
                                {!isUnlocked && (
                                    <span className="absolute -bottom-6 text-white/20 text-xs font-bold font-mono">
                                        {point.level.toString().padStart(2, '0')}
                                    </span>
                                )}

                                {isCompleted && (
                                    <div className="absolute -bottom-6 text-indigo-300 text-[10px] font-bold">
                                        DONE
                                    </div>
                                )}
                            </motion.div>
                        )
                    })}
                </div>
             </div>
          </motion.div>
        )}

        {/* --- GAMEPLAY --- */}
        {appState === 'playing' && (
          <motion.div 
            key="game-interface"
            className="absolute inset-0 flex flex-col items-center justify-between" 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            
            {/* Elegant Top Header */}
            <header className="relative w-full max-w-3xl mx-auto px-6 py-8 flex justify-between items-start z-20">
              
              {/* Top Left: Settings */}
              <button 
                onClick={() => setShowSettings(true)}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-transform hover:scale-105"
              >
                <Settings size={20} />
              </button>

              {/* Center: Level Indicator */}
              <div className="flex flex-col items-center justify-center pt-2">
                 <span className="text-[10px] font-bold text-white/60 tracking-[0.2em] uppercase mb-1">
                    Level
                 </span>
                 <span className="text-5xl text-white drop-shadow-md leading-none font-titan">
                    {level}
                 </span>
                 <div className="mt-2 px-3 py-1 bg-white/10 rounded-full border border-white/5">
                    <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-wider">
                       {DIFFICULTY_CONFIGS[difficulty].label}
                    </span>
                 </div>
              </div>

              {/* Top Right: Exit */}
              <button 
                onClick={goHome}
                className="w-12 h-12 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white transition-transform hover:scale-105"
              >
                <Home size={20} />
              </button>
            </header>

            <div className="flex-1 w-full max-w-5xl flex items-center justify-center px-4 relative z-10 pb-20">
               <div className="flex flex-wrap justify-center items-end gap-x-4 gap-y-16 sm:gap-x-8">
                <LayoutGroup>
                  <AnimatePresence>
                    {tubes.map((tube, index) => (
                      <Tube
                        key={index}
                        tube={tube}
                        tubeIndex={index}
                        isSelected={selectedTubeIndex === index}
                        isShaking={shakingTubeIndex === index}
                        onTap={handleTubeTap}
                        isGameWon={gameWon}
                      />
                    ))}
                  </AnimatePresence>
                </LayoutGroup>
              </div>
            </div>

            {/* Floating Bottom Dock - Minimalist Pill */}
            <div className="absolute bottom-8 left-0 right-0 flex justify-center z-20 px-6">
                <div className="bg-black/40 border border-white/10 rounded-full px-8 py-3 flex items-center gap-8 shadow-xl">
                    <button 
                        onClick={handleRestart}
                        className="flex flex-col items-center gap-1 text-white/60 hover:text-white transition-colors hover:scale-110 active:scale-95"
                        title="Restart"
                    >
                        <RotateCcw size={24} strokeWidth={2.5} />
                    </button>

                    <button 
                        onClick={handleUndo}
                        disabled={history.length === 0}
                        className={`
                            flex flex-col items-center gap-1 transition-all
                            ${history.length === 0 ? 'text-white/20 scale-95' : 'text-white hover:scale-110 active:scale-95'}
                        `}
                        title="Undo"
                    >
                        <Undo2 size={28} strokeWidth={2.5} />
                    </button>

                    <button 
                        onClick={handleAddTubeClick}
                        className={`
                            flex flex-col items-center gap-1 transition-all
                            ${extraTubeUsed 
                                ? 'text-white/30 cursor-not-allowed' 
                                : 'text-emerald-400 hover:text-emerald-300 hover:scale-110 active:scale-95 drop-shadow-[0_0_8px_rgba(52,211,153,0.5)]'}
                        `}
                        title="Add Tube"
                    >
                         {extraTubeUsed ? <Lock size={24} strokeWidth={2.5} /> : <Plus size={28} strokeWidth={3} />}
                    </button>
                </div>
            </div>
            
          </motion.div>
        )}

        {/* --- SETTINGS MODAL --- */}
        {showSettings && (
            <div className="absolute inset-0 z-50 flex items-center justify-center p-6 bg-black/60">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-slate-900 border border-white/10 rounded-3xl p-6 w-full max-w-xs shadow-xl"
                >
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl text-white font-titan tracking-wide">Settings</h3>
                        <button onClick={() => setShowSettings(false)} className="p-2 bg-white/10 rounded-full text-white">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <button onClick={toggleSound} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="text-white font-bold">Sound Effects</span>
                            {soundEnabled ? <Volume2 className="text-green-400" /> : <VolumeX className="text-red-400" />}
                        </button>
                        <button onClick={toggleVibration} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl">
                            <span className="text-white font-bold">Vibration</span>
                            {vibrationEnabled ? <Smartphone className="text-green-400" /> : <Smartphone className="text-slate-500" />}
                        </button>
                    </div>
                </motion.div>
            </div>
        )}

        {/* --- LEVEL COMPLETE MODAL --- */}
        {gameWon && (
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }}
                className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-6"
            >
                <motion.div 
                    initial={{ scale: 0.8, y: 20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="bg-white rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-xl"
                >
                    <div className="w-20 h-20 bg-yellow-400 rounded-full mx-auto mb-6 flex items-center justify-center shadow-lg text-yellow-900">
                        <Trophy size={40} fill="currentColor" />
                    </div>
                    
                    <h2 className="text-4xl text-slate-900 mb-2 font-titan">Awesome!</h2>
                    <p className="text-slate-500 font-bold mb-8">Level {level} Complete</p>
                    
                    <button 
                        onClick={nextLevel}
                        className="w-full py-4 bg-slate-900 text-white text-xl shadow-xl hover:scale-105 transition-transform font-titan tracking-wide rounded-2xl"
                    >
                        Next Level
                    </button>
                </motion.div>
            </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default App;