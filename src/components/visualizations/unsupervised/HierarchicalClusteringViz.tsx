'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { generateClusterData, Point2D } from '@/lib/datasets';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400, P = 30;

interface Cluster {
  id: number;
  points: Point2D[];
  centroid: Point2D;
  color: string;
  radius: number;
}

interface HCState {
  clusters: Cluster[];
  links: { p1: Point2D; p2: Point2D; c1: number; c2: number }[];
  iteration: number;
  converged: boolean;
}

const COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899','#8b5cf6','#06b6d4','#f97316', '#ef4444', '#14b8a6', '#84cc16'];

const dist = (a: Point2D, b: Point2D) => Math.sqrt((a.x - b.x)**2 + (a.y - b.y)**2);

export default function HierarchicalClusteringViz() {
  const [data, setData] = useState<Point2D[]>(() => generateClusterData(40, 3, 2));
  
  const initHC = useCallback((d: Point2D[]): HCState => {
    return {
      clusters: d.map((p, i) => ({
        id: i,
        points: [p],
        centroid: { ...p },
        color: COLORS[i % COLORS.length],
        radius: 8
      })),
      links: [],
      iteration: 0,
      converged: false
    };
  }, []);

  const [state, setState] = useState<HCState>(() => initHC(data));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const generatorRef = useRef<Generator<HCState> | null>(null);

  const [maxX, minX, maxY, minY] = useMemo(() => {
    const xs = data.map(p => p.x), ys = data.map(p => p.y);
    return [Math.max(...xs, 100)*1.05, Math.min(...xs, 0)*0.95, Math.max(...ys, 100)*1.05, Math.min(...ys, 0)*0.95];
  }, [data]);

  const sx = useCallback((x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P), [minX, maxX]);
  const sy = useCallback((y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P), [minY, maxY]);

  const randomize = useCallback(() => {
    const newData = generateClusterData(35 + Math.floor(Math.random()*15), 3, 1.5);
    setData(newData);
    setState(initHC(newData));
    generatorRef.current = null;
    setIsPlaying(false);
  }, [initHC]);

  const reset = useCallback(() => {
    setState(initHC(data));
    generatorRef.current = null;
    setIsPlaying(false);
  }, [data, initHC]);

  function* hcSteps(): Generator<HCState> {
    let currentClusters = [...state.clusters];
    const links = [...state.links];
    let iter = 0;

    while (currentClusters.length > 1) {
      let minDist = Infinity;
      let mergeA = 0;
      let mergeB = 1;

      // Find closest pair (using centroid linkage for simplicity/visualization)
      for (let i = 0; i < currentClusters.length; i++) {
        for (let j = i + 1; j < currentClusters.length; j++) {
          const d = dist(currentClusters[i].centroid, currentClusters[j].centroid);
          if (d < minDist) {
            minDist = d;
            mergeA = i;
            mergeB = j;
          }
        }
      }

      const cA = currentClusters[mergeA];
      const cB = currentClusters[mergeB];

      links.push({
        p1: cA.centroid,
        p2: cB.centroid,
        c1: cA.id,
        c2: cB.id
      });

      const newPoints = [...cA.points, ...cB.points];
      const newCentroid = {
        x: newPoints.reduce((sum, p) => sum + p.x, 0) / newPoints.length,
        y: newPoints.reduce((sum, p) => sum + p.y, 0) / newPoints.length,
      };

      const sNewCentroid = { x: sx(newCentroid.x), y: sy(newCentroid.y) };
      const dists = newPoints.map(p => {
        const dx = sx(p.x) - sNewCentroid.x;
        const dy = sy(p.y) - sNewCentroid.y;
        return Math.sqrt(dx*dx + dy*dy);
      });
      const maxDist = dists.length > 0 ? Math.max(...dists) : 0;

      const newCluster: Cluster = {
        id: cA.id, 
        points: newPoints,
        centroid: newCentroid,
        color: cA.points.length >= cB.points.length ? cA.color : cB.color,
        radius: Math.max(8, maxDist + 12)
      };

      currentClusters = currentClusters.filter((_, idx) => idx !== mergeA && idx !== mergeB);
      currentClusters.push(newCluster);

      yield { clusters: currentClusters, links: [...links], iteration: ++iter, converged: currentClusters.length === 1 };
    }
  }

  const step = useCallback((): boolean => {
    if (!generatorRef.current) generatorRef.current = hcSteps();
    const n = generatorRef.current.next();
    if (n.done) { setIsPlaying(false); return false; }
    setState(n.value);
    return !n.value.converged;
  }, [state]);

  useSimulationLoop(step, speed * 1.0, isPlaying);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Draw Links/Dendrogram branches */}
          {state.links.map((l, i) => (
            <motion.line 
              key={`link-${i}`}
              x1={sx(l.p1.x)} y1={sy(l.p1.y)}
              x2={sx(l.p2.x)} y2={sy(l.p2.y)}
              stroke="rgba(168, 85, 247, 0.4)" strokeWidth={2}
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.3 }}
            />
          ))}

          {/* Draw Points colored by current cluster */}
          {state.clusters.map(c => 
            c.points.map((pt, i) => (
              <motion.circle 
                key={`pt-${c.id}-${i}`}
                cx={sx(pt.x)} cy={sy(pt.y)} r={5}
                fill={c.color} stroke="#ffffff" strokeWidth={1}
                animate={{ fill: c.color }}
                transition={{ duration: 0.3 }}
              />
            ))
          )}

          {/* Draw Centroids */}
          {state.clusters.map(c => (
            <motion.circle 
              key={`c-${c.id}`}
              cx={sx(c.centroid.x)} cy={sy(c.centroid.y)} r={c.radius || 10}
              fill="transparent" stroke={c.color} strokeWidth={2} strokeDasharray="3,3"
              animate={{ cx: sx(c.centroid.x), cy: sy(c.centroid.y), r: c.radius || 10 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
            />
          ))}
        </svg>
      </div>

      <SimulationControls 
        onPlay={() => { if (!generatorRef.current) generatorRef.current = hcSteps(); setIsPlaying(true); }} 
        onPause={() => setIsPlaying(false)} 
        onReset={reset} 
        onStep={step} 
        isPlaying={isPlaying} 
        speed={speed} 
        onSpeedChange={setSpeed} 
        iteration={state.iteration} 
        extraInfo={state.converged ? `Selesai: Tergabung menjadi 1 kelompok utama` : `Sisa Kelompok: ${state.clusters.length}`} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🌱 Mulai dari Individu</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Pada awalnya, setiap titik data dianggap sebagai satu kelompok mandiri (memiliki warna sendiri). Ibarat setiap orang berdiri sendiri tanpa teman.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🤝 Mencari Jarak Terdekat</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Pada setiap langkah (iterasi), model mencari dua kelompok yang posisinya paling berdekatan dan menggabungkan mereka. Muncul garis penghubung yang menyatukan mereka!
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🌳 Menyatu Menjadi Pohon (Dendrogram)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Proses penggabungan ini diulang terus-menerus (dari bawah ke atas / Agglomerative) sampai akhirnya seluruh data bergabung membentuk satu kelompok raksasa.
          </p>
        </div>
      </div>
    </div>
  );
}
