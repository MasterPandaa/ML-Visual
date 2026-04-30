'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Layers, Search, Maximize2, Zap } from 'lucide-react';

const GRID_SIZE = 8;
const KERNEL_SIZE = 3;

// A simple 8x8 representation of a digit "4"
const INPUT_IMAGE = [
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 1, 1, 0, 0, 0, 0],
  [0, 1, 0, 1, 0, 0, 0, 0],
  [1, 0, 0, 1, 0, 0, 0, 0],
  [1, 1, 1, 1, 1, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 1, 0, 0, 0, 0],
  [0, 0, 0, 0, 0, 0, 0, 0],
];

// Horizontal Edge Detection Kernel
const KERNEL = [
  [-1, -1, -1],
  [ 2,  2,  2],
  [-1, -1, -1],
];

export default function CNNViz() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);
  
  const totalSteps = (GRID_SIZE - KERNEL_SIZE + 1) * (GRID_SIZE - KERNEL_SIZE + 1);
  
  const currentPos = useMemo(() => {
    const row = Math.floor(step / (GRID_SIZE - KERNEL_SIZE + 1));
    const col = step % (GRID_SIZE - KERNEL_SIZE + 1);
    return { row, col };
  }, [step]);

  const outputGrid = useMemo(() => {
    const grid: number[][] = [];
    const size = GRID_SIZE - KERNEL_SIZE + 1;
    for (let r = 0; r < size; r++) {
      grid[r] = [];
      for (let c = 0; c < size; c++) {
        const stepIdx = r * size + c;
        if (stepIdx < step) {
          // Calculate convolution value
          let sum = 0;
          for (let kr = 0; kr < KERNEL_SIZE; kr++) {
            for (let kc = 0; kc < KERNEL_SIZE; kc++) {
              sum += INPUT_IMAGE[r + kr][c + kc] * KERNEL[kr][kc];
            }
          }
          grid[r][c] = sum;
        } else {
          grid[r][c] = 0;
        }
      }
    }
    return grid;
  }, [step]);

  const nextStep = useCallback((): boolean => {
    if (step >= totalSteps - 1) {
      setIsPlaying(false);
      return false;
    }
    setStep(s => s + 1);
    return true;
  }, [step, totalSteps]);

  useSimulationLoop(nextStep, speed * 2, isPlaying);

  const reset = () => {
    setStep(0);
    setIsPlaying(false);
  };

  return (
    <div className="space-y-8 pb-10">
      {/* Header Info */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <div className="flex items-center gap-2 mb-2 text-indigo-400">
            <Search className="w-4 h-4" />
            <h4 className="text-sm font-bold">Convolution</h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Filter (Kernel) berjalan di atas gambar untuk mendeteksi pola tertentu seperti garis atau sudut.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <div className="flex items-center gap-2 mb-2 text-purple-400">
            <Layers className="w-4 h-4" />
            <h4 className="text-sm font-bold">Feature Map</h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Hasil dari pemindaian filter. Nilai tinggi (terang) menunjukkan pola yang ditemukan.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <div className="flex items-center gap-2 mb-2 text-amber-400">
            <Zap className="w-4 h-4" />
            <h4 className="text-sm font-bold">Feature Extraction</h4>
          </div>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Semakin banyak filter, semakin banyak fitur yang bisa dipelajari komputer dari sebuah gambar.
          </p>
        </div>
      </div>

      {/* Main Visualization */}
      <div className="viz-container p-6 flex flex-col lg:flex-row items-center justify-center gap-12 bg-black/40 backdrop-blur-sm border-indigo-500/10">
        
        {/* Input Image Side */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest mb-4">Input Layer (8x8)</span>
          <div className="relative grid grid-cols-8 gap-1 p-2 bg-indigo-500/5 rounded-lg border border-indigo-500/20 shadow-2xl shadow-indigo-500/5">
            {INPUT_IMAGE.map((row, r) => 
              row.map((val, c) => (
                <div key={`${r}-${c}`} 
                  className={`w-8 h-8 rounded-sm flex items-center justify-center text-[10px] transition-all duration-300 ${
                    val > 0 ? 'bg-indigo-500 text-white shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-white/5 text-white/20'
                  }`}
                >
                  {val}
                </div>
              ))
            )}
            
            {/* The Kernel (Scanning Box) */}
            <motion.div 
              className="absolute border-2 border-amber-400 bg-amber-400/20 z-10 rounded-sm pointer-events-none box-content"
              animate={{ 
                left: 8 + currentPos.col * 36, 
                top: 8 + currentPos.row * 36,
                width: KERNEL_SIZE * 36 - 4,
                height: KERNEL_SIZE * 36 - 4
              }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
            >
              <div className="absolute -top-6 left-0 right-0 text-center">
                <span className="text-[8px] font-bold text-amber-400 bg-black/80 px-1 py-0.5 rounded">Kernel 3x3</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Transition Arrows */}
        <div className="hidden lg:flex flex-col items-center gap-2 text-white/20">
          <motion.div animate={{ x: [0, 10, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <Maximize2 className="w-8 h-8 rotate-45" />
          </motion.div>
          <span className="text-[8px] font-mono">Conv 3x3</span>
        </div>

        {/* Feature Map Side */}
        <div className="flex flex-col items-center">
          <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-4">Feature Map (6x6)</span>
          <div className="grid grid-cols-6 gap-1 p-2 bg-purple-500/5 rounded-lg border border-purple-500/20 shadow-2xl shadow-purple-500/5">
            {outputGrid.map((row, r) => 
              row.map((val, c) => {
                const isCurrent = currentPos.row === r && currentPos.col === c;
                const isProcessed = (r * 6 + c) < step;
                return (
                  <motion.div key={`${r}-${c}`} 
                    initial={false}
                    animate={{ 
                      scale: isCurrent ? 1.2 : 1,
                      backgroundColor: isProcessed ? `rgba(192, 132, 252, ${Math.min(1, Math.abs(val)/2 + 0.1)})` : 'rgba(255,255,255,0.05)'
                    }}
                    className={`w-10 h-10 rounded-sm flex items-center justify-center text-[10px] font-mono border ${
                      isCurrent ? 'border-amber-400 z-10 shadow-lg shadow-amber-500/50' : 'border-transparent'
                    }`}
                  >
                    {isProcessed ? val : ''}
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      <SimulationControls 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onReset={reset} 
        onStep={nextStep} 
        isPlaying={isPlaying} 
        speed={speed} 
        onSpeedChange={setSpeed} 
        iteration={step + 1}
        maxIteration={totalSteps}
        extraInfo={step >= totalSteps - 1 ? '✅ Feature Extraction Selesai!' : 'Memindai pola...'} 
      />

      {/* Explanation Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-400" /> Bagaimana Cara Kerjanya?
          </h4>
          <div className="space-y-3">
            <p className="text-xs text-[var(--text-muted)] leading-relaxed">
              Bayangkan filter (Kernel) sebagai sebuah "kacamata khusus" yang hanya mencari bentuk tertentu. 
              Komputer melakukan perkalian matematika antara nilai gambar dengan nilai di filter tersebut.
            </p>
            <div className="p-3 bg-black/40 rounded-lg border border-white/5 font-mono text-[10px]">
              <span className="text-indigo-300">Sum =</span> Σ (Gambar × Filter)
            </div>
          </div>
        </div>
        <div className="glass-card p-6">
          <h4 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-purple-400" /> Kenapa Feature Map Lebih Kecil?
          </h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Karena filter berukuran 3x3, kita tidak bisa memusatkannya di pinggiran gambar tanpa keluar dari batas (kecuali menggunakan *Padding*). 
            Itulah kenapa gambar yang awalnya 8x8 menyusut menjadi 6x6.
          </p>
        </div>
      </div>
    </div>
  );
}
