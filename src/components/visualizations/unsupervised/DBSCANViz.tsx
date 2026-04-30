'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClusterData, Point2D } from '@/lib/datasets';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400, P = 30;
const COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#f97316'];
const NOISE_COLOR = '#4b5563';

interface DBSCANPoint extends Point2D {
  id: number;
  label: number | 'noise' | 'unvisited';
  type: 'core' | 'border' | 'noise' | 'unknown';
}

interface DBSCANState {
  points: DBSCANPoint[];
  currentPointId: number | null;
  neighbors: number[];
  iteration: number;
  converged: boolean;
  activeCluster: number;
}

function initDBSCAN(data: Point2D[]): DBSCANState {
  return {
    points: data.map((p, i) => ({ ...p, id: i, label: 'unvisited', type: 'unknown' })),
    currentPointId: null,
    neighbors: [],
    iteration: 0,
    converged: false,
    activeCluster: 0
  };
}

// Distance helper
const dist = (a: Point2D, b: Point2D) => Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);

export default function DBSCANViz() {
  const [eps, setEps] = useState(8);
  const [minPts, setMinPts] = useState(4);
  const [data, setData] = useState<Point2D[]>(() => generateClusterData(100, 4, 1.5));
  
  const [state, setState] = useState<DBSCANState>(() => initDBSCAN(data));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const generatorRef = useRef<Generator<DBSCANState> | null>(null);

  // Normalization
  const [maxX, minX, maxY, minY] = useMemo(() => {
    const xs = data.map(p => p.x), ys = data.map(p => p.y);
    return [Math.max(...xs, 100)*1.05, Math.min(...xs, 0)*0.95, Math.max(...ys, 100)*1.05, Math.min(...ys, 0)*0.95];
  }, [data]);

  const sx = (x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P);
  const sy = (y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P);

  const randomize = useCallback(() => {
    // Generate data with some noise
    const baseData = generateClusterData(80, 3, 1.5);
    const noiseData = Array.from({length: 20}).map(() => ({ x: Math.random()*100, y: Math.random()*100 }));
    const newData = [...baseData, ...noiseData];
    setData(newData);
    setState(initDBSCAN(newData));
    generatorRef.current = null;
    setIsPlaying(false);
  }, []);

  const reset = useCallback(() => {
    setState(initDBSCAN(data));
    generatorRef.current = null;
    setIsPlaying(false);
  }, [data]);

  // Generator function for DBSCAN steps
  function* dbscanSteps(): Generator<DBSCANState> {
    const pts = [...state.points];
    let clusterId = 0;
    let iter = 0;

    for (let i = 0; i < pts.length; i++) {
      if (pts[i].label !== 'unvisited') continue;

      // Yield before expanding
      yield { points: [...pts], currentPointId: i, neighbors: [], iteration: ++iter, converged: false, activeCluster: clusterId };

      const getNeighbors = (ptId: number) => {
        return pts.filter((p) => dist(pts[ptId], p) <= eps).map(p => p.id);
      };

      let neighbors = getNeighbors(i);
      
      if (neighbors.length < minPts) {
        pts[i].label = 'noise';
        pts[i].type = 'noise';
        yield { points: [...pts], currentPointId: i, neighbors, iteration: ++iter, converged: false, activeCluster: clusterId };
      } else {
        pts[i].label = clusterId;
        pts[i].type = 'core';
        yield { points: [...pts], currentPointId: i, neighbors, iteration: ++iter, converged: false, activeCluster: clusterId };
        
        const seedSet = [...neighbors];
        
        while (seedSet.length > 0) {
          const currentP = seedSet.shift()!;
          if (currentP === i) continue; // skip self
          
          if (pts[currentP].label === 'noise') {
            pts[currentP].label = clusterId;
            pts[currentP].type = 'border';
          }
          
          if (pts[currentP].label !== 'unvisited') continue;
          
          pts[currentP].label = clusterId;
          
          const currentNeighbors = getNeighbors(currentP);
          if (currentNeighbors.length >= minPts) {
            pts[currentP].type = 'core';
            for (const n of currentNeighbors) {
              if (pts[n].label === 'unvisited') {
                seedSet.push(n);
              }
            }
          } else {
            pts[currentP].type = 'border';
          }
          yield { points: [...pts], currentPointId: currentP, neighbors: currentNeighbors, iteration: ++iter, converged: false, activeCluster: clusterId };
        }
        clusterId++;
      }
    }
    
    yield { points: [...pts], currentPointId: null, neighbors: [], iteration: ++iter, converged: true, activeCluster: clusterId };
  }

  const step = useCallback((): boolean => {
    if (!generatorRef.current) generatorRef.current = dbscanSteps();
    const n = generatorRef.current.next();
    if (n.done) { setIsPlaying(false); return false; }
    setState(n.value);
    return !n.value.converged;
  }, [state, eps, minPts]);

  useSimulationLoop(step, speed * 0.5, isPlaying);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-x-8 gap-y-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <div className="flex items-center gap-4">
          <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
            <Shuffle className="w-3 h-3" /> Data Baru
          </button>
          <div className="h-6 w-px bg-[var(--border-color)] hidden sm:block"></div>
        </div>
        
        <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Radius Jarak (Eps):</span>
            <input type="range" min={3} max={15} step={1} value={eps} onChange={e => { setEps(parseInt(e.target.value)); reset(); }} className="w-24 accent-indigo-500" />
            <span className="text-sm font-bold text-indigo-400 w-4">{eps}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Minimum Titik (MinPts):</span>
            <input type="range" min={2} max={10} step={1} value={minPts} onChange={e => { setMinPts(parseInt(e.target.value)); reset(); }} className="w-24 accent-indigo-500" />
            <span className="text-sm font-bold text-indigo-400 w-4">{minPts}</span>
          </div>
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Draw Eps Radius for active point */}
          <AnimatePresence>
            {state.currentPointId !== null && (
              <motion.circle 
                cx={sx(state.points[state.currentPointId].x)} 
                cy={sy(state.points[state.currentPointId].y)} 
                initial={{ r: 0, opacity: 0 }}
                animate={{ r: eps * ((W-2*P)/(maxX-minX)), opacity: 0.15 }}
                exit={{ opacity: 0 }}
                fill="#8b5cf6" 
                stroke="#a78bfa" 
                strokeWidth={1} 
              />
            )}
          </AnimatePresence>

          {/* Lines to neighbors */}
          {state.currentPointId !== null && state.neighbors.map(nid => {
            const currentPoint = state.points[state.currentPointId as number];
            return (
              <line 
                key={`line-${state.currentPointId}-${nid}`}
                x1={sx(currentPoint.x)}
                y1={sy(currentPoint.y)}
                x2={sx(state.points[nid].x)}
                y2={sy(state.points[nid].y)}
                stroke="rgba(168, 85, 247, 0.4)"
                strokeWidth={1.5}
              />
            );
          })}

          {state.points.map((pt) => {
            const isUnvisited = pt.label === 'unvisited';
            const isNoise = pt.label === 'noise';
            let fillColor = '#4b5563'; // unvisited/unknown
            let strokeColor = '#374151';

            if (isNoise) {
              fillColor = 'transparent';
              strokeColor = '#ef4444';
            } else if (!isUnvisited && typeof pt.label === 'number') {
              fillColor = COLORS[pt.label % COLORS.length];
              strokeColor = '#ffffff';
            }

            const isActive = pt.id === state.currentPointId;
            const r = isActive ? 7 : (pt.type === 'core' ? 5 : (pt.type === 'border' ? 3 : 4));

            return (
              <motion.circle 
                key={pt.id} 
                cx={sx(pt.x)} 
                cy={sy(pt.y)} 
                r={r} 
                fill={fillColor} 
                stroke={isActive ? '#fbbf24' : strokeColor} 
                strokeWidth={isActive || pt.type === 'core' ? 2 : 1} 
                animate={{ fill: fillColor, r }} 
                transition={{ duration: 0.3 }} 
                opacity={isUnvisited ? 0.4 : (isNoise ? 0.6 : 1)} 
              />
            );
          })}
        </svg>
      </div>

      <SimulationControls 
        onPlay={() => { if (!generatorRef.current) generatorRef.current = dbscanSteps(); setIsPlaying(true); }} 
        onPause={() => setIsPlaying(false)} 
        onReset={reset} 
        onStep={step} 
        isPlaying={isPlaying} 
        speed={speed} 
        onSpeedChange={setSpeed} 
        iteration={state.iteration} 
        extraInfo={state.converged ? `✅ Selesai: ${state.activeCluster} Kelompok Ditemukan` : undefined} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🔍 Memindai Jarak Radius (Eps)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Animasi berjalan dengan memindai setiap titik. Lingkaran ungu menunjukkan radius <b>Eps</b>. Jika di dalam radius tersebut terdapat cukup banyak teman, maka terbentuklah kelompok baru!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">👥 Teman Minimal (MinPts)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Titik hanya bisa menjadi "Titik Inti" (ukuran lebih besar) jika ia punya jumlah tetangga sama dengan atau lebih dari <b>MinPts</b>. Jika tidak, ia hanya menempel sebagai titik perbatasan.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">🚫 Mengabaikan Anomali (Noise)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Titik yang berada di luar radius kelompok mana pun (lingkaran merah kosong) akan dianggap sebagai <i>Noise</i> (sampah). Ini membuat DBSCAN sangat hebat mengabaikan data aneh.
          </p>
        </div>
      </div>
    </div>
  );
}
