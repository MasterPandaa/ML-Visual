'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateClusterData, Point2D } from '@/lib/datasets';
import { kmeansSteps, KMeansState, kmeansInit } from '@/lib/algorithms/kmeans';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400, P = 30;
const COLORS = ['#6366f1','#10b981','#f59e0b','#ef4444','#8b5cf6','#ec4899','#06b6d4','#f97316'];

export default function KMeansViz() {
  const [k, setK] = useState(3);
  const [data, setData] = useState<Point2D[]>(() => generateClusterData(80, 3, 2));
  const [state, setState] = useState<KMeansState | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const stepsRef = useRef<Generator<KMeansState> | null>(null);

  const [maxX, minX, maxY, minY] = useMemo(() => {
    const xs = data.map(p => p.x), ys = data.map(p => p.y);
    return [Math.max(...xs, 100)*1.05, Math.min(...xs, 0)*0.95, Math.max(...ys, 100)*1.05, Math.min(...ys, 0)*0.95];
  }, [data]);

  const sx = (x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P);
  const sy = (y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P);

  const randomize = useCallback(() => {
    setData(generateClusterData(60 + Math.floor(Math.random()*40), k, 1.5+Math.random()));
    setState(null); stepsRef.current = null; setIsPlaying(false);
  }, [k]);

  const init = useCallback(() => {
    setState(kmeansInit(data, k));
    stepsRef.current = kmeansSteps(data, k);
    setIsPlaying(false);
  }, [data, k]);

  const step = useCallback((): boolean => {
    if (!stepsRef.current) stepsRef.current = kmeansSteps(data, k);
    const n = stepsRef.current.next();
    if (n.done) { setIsPlaying(false); return false; }
    setState(n.value);
    return !n.value.converged;
  }, [data, k]);

  const reset = useCallback(() => { setState(null); stepsRef.current = null; setIsPlaying(false); }, []);
  useSimulationLoop(step, speed * 1.0, isPlaying);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <button onClick={init} className="btn-primary text-xs py-2 px-4 shadow-lg shadow-indigo-500/20">
          Acak Posisi Pusat (Centroid)
        </button>

        <div className="flex items-center gap-3 flex-1 min-w-[200px] ml-auto">
          <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Jumlah Kelompok (K):</span>
          <input type="range" min={2} max={8} value={k} onChange={e => { 
            const newK = parseInt(e.target.value);
            setK(newK); 
            setState(kmeansInit(data, newK));
            stepsRef.current = null;
            setIsPlaying(false);
          }} className="w-full accent-indigo-500" />
          <span className="text-sm font-bold text-indigo-400 w-4">{k}</span>
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />
          {data.map((pt, i) => {
            const c = state ? COLORS[state.assignments[i] % COLORS.length] : '#4b5563';
            return <motion.circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r={4} fill={c} stroke={`${c}50`} strokeWidth={1.5} animate={{ fill: c }} transition={{ duration: 0.5 }} opacity={0.85} />;
          })}
          {state?.centroids.map((c, ci) => (
            <g key={`c${ci}`}>
              <motion.circle cx={sx(c.x)} cy={sy(c.y)} fill={`${COLORS[ci]}30`} animate={{ cx: sx(c.x), cy: sy(c.y) }} transition={{ duration: 0.5 }}>
                <animate attributeName="r" values="12;18;12" dur="2s" repeatCount="indefinite" />
              </motion.circle>
              <motion.circle cx={sx(c.x)} cy={sy(c.y)} r={6} fill={COLORS[ci]} stroke="white" strokeWidth={1.5} animate={{ cx: sx(c.x), cy: sy(c.y) }} transition={{ duration: 0.5 }} />
            </g>
          ))}
        </svg>
      </div>

      <SimulationControls onPlay={() => { if (!stepsRef.current) stepsRef.current = kmeansSteps(data, k); setIsPlaying(true); }} onPause={() => setIsPlaying(false)} onReset={reset} onStep={step} isPlaying={isPlaying} speed={speed} onSpeedChange={setSpeed} iteration={state?.iteration ?? 0} extraInfo={state?.converged ? '✅ Converged!' : undefined} />

      {state && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
          {state.centroids.map((_, ci) => (
            <div key={ci} className="glass-card p-3 text-center border-t-2" style={{ borderTopColor: COLORS[ci] }}>
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[ci] }} />
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Kelompok {ci+1}</span>
              </div>
              <div className="text-sm font-bold text-white mt-1">
                {state.assignments.filter(a => a === ci).length} titik
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🎯 Inisialisasi Acak</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            K-Means dimulai dengan memilih posisi secara acak untuk K buah "titik pusat" (centroid). Ibarat menaruh bendera ketua kelompok sembarangan di tengah lapangan.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🧲 Mengelompokkan Data</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Setiap titik data akan menghitung jaraknya ke seluruh bendera, lalu bergabung dengan bendera yang terdekat. Inilah saat kelompok terbentuk!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🔄 Menggeser Pusat</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Setelah kelompok terbentuk, posisi bendera digeser tepat ke tengah-tengah kerumunan anggotanya. Proses ini diulang terus (Play) sampai posisinya tidak berubah lagi.
          </p>
        </div>
      </div>
    </div>
  );
}
