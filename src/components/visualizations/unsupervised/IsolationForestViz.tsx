'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClusterData, Point2D } from '@/lib/datasets';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle, MousePointer2, RotateCcw } from 'lucide-react';

const W = 600, H = 400, P = 30;

interface Split {
  axis: 'x' | 'y';
  val: number;
  min: number;
  max: number;
  otherMin: number;
  otherMax: number;
}

interface Region {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}

interface IFState {
  targetId: number | null;
  splits: Split[];
  activeRegion: Region;
  isolated: boolean;
}

export default function IsolationForestViz() {
  const [data, setData] = useState<Point2D[]>(() => {
    const base = generateClusterData(50, 1, 1.5);
    // add outliers
    return [...base, {x: 10, y: 10}, {x: 90, y: 80}, {x: 85, y: 15}];
  });

  const [state, setState] = useState<IFState>({
    targetId: null,
    splits: [],
    activeRegion: { minX: 0, maxX: 100, minY: 0, maxY: 100 },
    isolated: false
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const generatorRef = useRef<Generator<IFState> | null>(null);

  const [maxX, minX, maxY, minY] = useMemo(() => {
    return [105, -5, 105, -5];
  }, []);

  const sx = (x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P);
  const sy = (y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P);

  const randomize = useCallback(() => {
    const base = generateClusterData(50, 1, 1.5);
    const outliers = Array.from({length: 3}).map(() => ({ x: Math.random()*100, y: Math.random()*100 }));
    setData([...base, ...outliers]);
    setState({ targetId: null, splits: [], activeRegion: { minX: 0, maxX: 100, minY: 0, maxY: 100 }, isolated: false });
    generatorRef.current = null;
    setIsPlaying(false);
  }, []);

  const selectTarget = (idx: number) => {
    setState({ targetId: idx, splits: [], activeRegion: { minX: 0, maxX: 100, minY: 0, maxY: 100 }, isolated: false });
    generatorRef.current = null;
    setIsPlaying(false);
  };

  const reset = useCallback(() => {
    if (state.targetId === null) return;
    setState({ targetId: state.targetId, splits: [], activeRegion: { minX: 0, maxX: 100, minY: 0, maxY: 100 }, isolated: false });
    generatorRef.current = null;
    setIsPlaying(false);
  }, [state.targetId]);

  function* splitSteps(tId: number): Generator<IFState> {
    const targetPt = data[tId];
    let currentRegion = { minX: -5, maxX: 105, minY: -5, maxY: 105 };
    const splits: Split[] = [];

    const getPointsInRegion = (reg: Region) => 
      data.filter(p => p.x >= reg.minX && p.x <= reg.maxX && p.y >= reg.minY && p.y <= reg.maxY);

    while (getPointsInRegion(currentRegion).length > 1) {
      const axis = Math.random() > 0.5 ? 'x' : 'y';
      const pts = getPointsInRegion(currentRegion);
      const vals = pts.map(p => axis === 'x' ? p.x : p.y);
      const dMin = Math.min(...vals);
      const dMax = Math.max(...vals);

      if (dMax <= dMin) break;
      const splitVal = dMin + Math.random() * (dMax - dMin);
      
      splits.push({
        axis,
        val: splitVal,
        min: axis === 'x' ? currentRegion.minY : currentRegion.minX,
        max: axis === 'x' ? currentRegion.maxY : currentRegion.maxX,
        otherMin: axis === 'x' ? currentRegion.minX : currentRegion.minY,
        otherMax: axis === 'x' ? currentRegion.maxX : currentRegion.maxY,
      });

      const targetVal = axis === 'x' ? targetPt.x : targetPt.y;
      if (targetVal < splitVal) {
        if (axis === 'x') currentRegion.maxX = splitVal;
        else currentRegion.maxY = splitVal;
      } else {
        if (axis === 'x') currentRegion.minX = splitVal;
        else currentRegion.minY = splitVal;
      }

      yield { 
        targetId: tId, 
        splits: [...splits], 
        activeRegion: { ...currentRegion }, 
        isolated: getPointsInRegion(currentRegion).length <= 1 
      };
    }
  }

  const step = useCallback((): boolean => {
    if (state.targetId === null) return false;
    if (!generatorRef.current) generatorRef.current = splitSteps(state.targetId);
    const n = generatorRef.current.next();
    if (n.done) { setIsPlaying(false); return false; }
    setState(n.value);
    return !n.value.isolated;
  }, [state.targetId, data]);

  useSimulationLoop(step, speed * 1.6, isPlaying);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <button 
          onClick={() => {
            setState({ targetId: null, splits: [], activeRegion: { minX: -5, maxX: 105, minY: -5, maxY: 105 }, isolated: false });
            generatorRef.current = null;
            setIsPlaying(false);
          }} 
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0"
          disabled={state.targetId === null || state.splits.length === 0}
        >
          <RotateCcw className="w-3 h-3" /> Ganti Titik
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/20">
          <MousePointer2 className="w-3 h-3" /> Klik salah satu titik untuk mengisolasinya!
        </div>

        {state.targetId !== null && (
          <div className="ml-auto flex flex-wrap items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Sisa Titik se-Kotak:</span>
              <span className="font-bold text-indigo-400">
                {data.filter(pt => pt.x >= state.activeRegion.minX && pt.x <= state.activeRegion.maxX && pt.y >= state.activeRegion.minY && pt.y <= state.activeRegion.maxY).length}
              </span>
            </div>
            <div className="h-4 w-px bg-[var(--border-color)] hidden sm:block"></div>
            <div className="flex items-center gap-2">
              <span className="text-[var(--text-muted)]">Jumlah Tebasan:</span>
              <span className={`font-bold ${state.isolated ? (state.splits.length < 5 ? 'text-rose-400' : 'text-emerald-400') : 'text-white'}`}>
                {state.splits.length} {state.isolated && (state.splits.length < 5 ? '(Anomali/Aneh)' : '(Normal)')}
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Active Region Highlight */}
          {state.targetId !== null && state.splits.length > 0 && (
            <motion.rect
              fill="rgba(99, 102, 241, 0.15)"
              stroke="#6366f1"
              strokeWidth={2}
              strokeDasharray="4,4"
              animate={{ 
                x: sx(state.activeRegion.minX), 
                y: sy(state.activeRegion.maxY), 
                width: sx(state.activeRegion.maxX) - sx(state.activeRegion.minX), 
                height: sy(state.activeRegion.minY) - sy(state.activeRegion.maxY) 
              }}
              transition={{ duration: 0.3 }}
            />
          )}

          {/* Splits */}
          <AnimatePresence>
            {state.splits.map((split, i) => {
              const isLast = i === state.splits.length - 1;
              return (
                <motion.line 
                  key={`split-${i}`}
                  x1={split.axis === 'x' ? sx(split.val) : sx(split.min)}
                  y1={split.axis === 'x' ? sy(split.max) : sy(split.val)}
                  x2={split.axis === 'x' ? sx(split.val) : sx(split.max)}
                  y2={split.axis === 'x' ? sy(split.min) : sy(split.val)}
                  stroke={isLast ? "#f43f5e" : "#8b5cf6"}
                  strokeWidth={isLast ? 3 : 1.5}
                  strokeDasharray={isLast ? "none" : "4,4"}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: isLast ? 1 : 0.4, scale: 1 }}
                  transition={{ duration: 0.3 }}
                />
              );
            })}
          </AnimatePresence>

          {/* Points */}
          {data.map((pt, i) => {
            const isTarget = i === state.targetId;
            const inActiveRegion = state.targetId === null || 
              (pt.x >= state.activeRegion.minX && pt.x <= state.activeRegion.maxX && 
               pt.y >= state.activeRegion.minY && pt.y <= state.activeRegion.maxY);
            
            return (
              <motion.circle 
                key={`pt-${i}`}
                cx={sx(pt.x)} cy={sy(pt.y)} r={isTarget ? 6 : (inActiveRegion ? 4 : 3)}
                fill={isTarget ? '#fbbf24' : (inActiveRegion ? '#10b981' : '#4b5563')} 
                stroke={isTarget ? '#fff' : (inActiveRegion ? '#059669' : '#374151')} 
                strokeWidth={isTarget ? 2 : 1}
                opacity={state.targetId === null ? 1 : (isTarget ? 1 : (inActiveRegion ? 0.8 : 0.15))}
                onClick={() => selectTarget(i)}
                className={`transition-all ${state.targetId === null ? 'cursor-pointer hover:stroke-white hover:stroke-[2px]' : ''}`}
                animate={{ r: isTarget ? [6, 8, 6] : (inActiveRegion ? 4 : 3) }}
                transition={{ repeat: isTarget ? Infinity : 0, duration: 1 }}
              />
            );
          })}
        </svg>
      </div>

      <SimulationControls 
        onPlay={() => { if (state.targetId === null) return; if (!generatorRef.current) generatorRef.current = splitSteps(state.targetId); setIsPlaying(true); }} 
        onPause={() => setIsPlaying(false)} 
        onReset={reset} 
        onStep={step} 
        isPlaying={isPlaying} 
        speed={speed} 
        onSpeedChange={setSpeed} 
        iteration={state.splits.length} 
        extraInfo={state.isolated ? '✅ Target Terisolasi Sendirian!' : (state.targetId !== null ? 'Memotong area secara acak...' : 'Pilih titik dulu!')} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🪓 Pemotongan Acak</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Pilih satu titik. Model akan menebas wilayah data secara acak (garis putus-putus ungu) berulang kali hingga titik target tersebut berada sendirian di dalam sebuah kotak.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">👽 Data Aneh (Anomali)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Coba klik titik yang jauh dari keramaian! Karena ia menyendiri, ia akan sangat cepat terkurung hanya dengan 1 atau 2 kali tebasan. Path length (jumlah belahan) sangat pendek.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">👨‍👩‍👧‍👦 Data Normal</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Sebaliknya, jika Anda memilih titik di tengah kerumunan yang padat, model harus menebas berkali-kali untuk bisa mengisolasinya sendirian. Path length-nya sangat panjang.
          </p>
        </div>
      </div>
    </div>
  );
}
