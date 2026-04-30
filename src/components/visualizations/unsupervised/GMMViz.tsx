'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateClusterData, Point2D } from '@/lib/datasets';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400, P = 30;
const COLORS = ['#818cf8', '#34d399', '#fbbf24', '#fb7185', '#a78bfa'];

interface Gaussian {
  x: number;
  y: number;
  varX: number;
  varY: number;
  color: string;
}

interface GMMState {
  gaussians: Gaussian[];
  points: { p: Point2D; weights: number[] }[];
  iteration: number;
  converged: boolean;
}

const distSq = (a: {x:number, y:number}, b: {x:number, y:number}) => (a.x - b.x)**2 + (a.y - b.y)**2;

export default function GMMViz() {
  const [k, setK] = useState(3);
  const [data, setData] = useState<Point2D[]>(() => generateClusterData(80, 3, 2.5));
  
  const initGMM = useCallback((d: Point2D[], numK: number): GMMState => {
    // Randomly pick k points as initial means
    const shuffled = [...d].sort(() => 0.5 - Math.random());
    const gaussians: Gaussian[] = Array.from({length: numK}).map((_, i) => ({
      x: shuffled[i].x,
      y: shuffled[i].y,
      varX: 200, // Initial wide variance
      varY: 200,
      color: COLORS[i % COLORS.length]
    }));

    return {
      gaussians,
      points: d.map(p => ({ p, weights: new Array(numK).fill(1/numK) })),
      iteration: 0,
      converged: false
    };
  }, []);

  const [state, setState] = useState<GMMState>(() => initGMM(data, k));
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const generatorRef = useRef<Generator<GMMState> | null>(null);

  const [maxX, minX, maxY, minY] = useMemo(() => {
    const xs = data.map(p => p.x), ys = data.map(p => p.y);
    return [Math.max(...xs, 100)*1.05, Math.min(...xs, 0)*0.95, Math.max(...ys, 100)*1.05, Math.min(...ys, 0)*0.95];
  }, [data]);

  const sx = (x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P);
  const sy = (y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P);
  const sDistX = (dx: number) => dx / (maxX - minX) * (W - 2*P);
  const sDistY = (dy: number) => dy / (maxY - minY) * (H - 2*P);

  const randomize = useCallback(() => {
    const newData = generateClusterData(80 + Math.floor(Math.random()*40), k, 1.5 + Math.random());
    setData(newData);
    setState(initGMM(newData, k));
    generatorRef.current = null;
    setIsPlaying(false);
  }, [k, initGMM]);

  const reset = useCallback(() => {
    setState(initGMM(data, k));
    generatorRef.current = null;
    setIsPlaying(false);
  }, [data, k, initGMM]);

  function* gmmSteps(): Generator<GMMState> {
    let currentState = state;
    let prevMeans = currentState.gaussians.map(g => ({x: g.x, y: g.y}));
    
    while (!currentState.converged && currentState.iteration < 50) {
      // E-Step: Calculate soft assignments
      const newPoints = currentState.points.map(pt => {
        let weights = currentState.gaussians.map(g => {
          // Simplified Gaussian PDF proportional
          const expX = Math.exp(-((pt.p.x - g.x)**2) / (2 * g.varX));
          const expY = Math.exp(-((pt.p.y - g.y)**2) / (2 * g.varY));
          return (1 / Math.sqrt(g.varX * g.varY)) * expX * expY;
        });
        
        const sumW = weights.reduce((a, b) => a + b, 0);
        if (sumW > 0) {
          weights = weights.map(w => w / sumW);
        } else {
          weights = weights.map(() => 1/k);
        }
        return { ...pt, weights };
      });

      yield { ...currentState, points: newPoints, iteration: currentState.iteration + 0.5 };

      // M-Step: Update means and variances
      const newGaussians = currentState.gaussians.map((g, i) => {
        let sumW = 0;
        let sumX = 0, sumY = 0;
        
        newPoints.forEach(pt => {
          sumW += pt.weights[i];
          sumX += pt.weights[i] * pt.p.x;
          sumY += pt.weights[i] * pt.p.y;
        });

        const newX = sumW > 0 ? sumX / sumW : g.x;
        const newY = sumW > 0 ? sumY / sumW : g.y;

        let sumVarX = 0, sumVarY = 0;
        newPoints.forEach(pt => {
          sumVarX += pt.weights[i] * ((pt.p.x - newX)**2);
          sumVarY += pt.weights[i] * ((pt.p.y - newY)**2);
        });

        const newVarX = Math.max(10, sumW > 0 ? sumVarX / sumW : g.varX);
        const newVarY = Math.max(10, sumW > 0 ? sumVarY / sumW : g.varY);

        return { ...g, x: newX, y: newY, varX: newVarX, varY: newVarY };
      });

      const maxShift = Math.max(...newGaussians.map((g, i) => distSq(g, prevMeans[i])));
      const converged = maxShift < 0.1;
      
      prevMeans = newGaussians.map(g => ({x: g.x, y: g.y}));
      currentState = { gaussians: newGaussians, points: newPoints, iteration: Math.floor(currentState.iteration) + 1, converged };
      
      yield currentState;
    }
  }

  const step = useCallback((): boolean => {
    if (!generatorRef.current) generatorRef.current = gmmSteps();
    const n = generatorRef.current.next();
    if (n.done) { setIsPlaying(false); return false; }
    setState(n.value);
    return !n.value.converged;
  }, [state]);

  useSimulationLoop(step, speed * 1.6, isPlaying);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Distribusi (K):</span>
          <input type="range" min={2} max={5} value={k} onChange={e => { 
            const newK = parseInt(e.target.value);
            setK(newK); 
            setState(initGMM(data, newK));
            generatorRef.current = null;
            setIsPlaying(false);
          }} className="w-24 accent-indigo-500" />
          <span className="text-sm font-bold text-indigo-400 w-4">{k}</span>
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Draw Gaussians (Ellipses) */}
          {state.gaussians.map((g, i) => {
            const rx = sDistX(Math.sqrt(g.varX) * 2); // 2 std deviations
            const ry = sDistY(Math.sqrt(g.varY) * 2);
            
            return (
              <motion.ellipse 
                key={`ellipse-${i}`}
                cx={sx(g.x)} cy={sy(g.y)}
                rx={rx} ry={ry}
                fill={`${g.color}15`}
                stroke={g.color} strokeWidth={2} strokeDasharray="5,5"
                animate={{ cx: sx(g.x), cy: sy(g.y), rx: Math.max(1, rx), ry: Math.max(1, ry) }}
                transition={{ duration: 0.5 }}
              />
            );
          })}

          {/* Draw Points */}
          {state.points.map((pt, i) => {
            // Find dominant cluster for color
            let maxW = -1;
            let maxC = 0;
            pt.weights.forEach((w, wi) => { if(w > maxW) { maxW = w; maxC = wi; } });
            
            return (
              <motion.circle 
                key={`pt-${i}`}
                cx={sx(pt.p.x)} cy={sy(pt.p.y)} r={4}
                fill={COLORS[maxC]} stroke="#ffffff" strokeWidth={0.5}
                opacity={0.3 + 0.7 * maxW} // Opacity based on confidence
                animate={{ fill: COLORS[maxC], opacity: 0.3 + 0.7 * maxW }}
                transition={{ duration: 0.5 }}
              />
            );
          })}

          {/* Gaussian Centers */}
          {state.gaussians.map((g, i) => (
             <motion.path
              key={`center-${i}`}
              d={`M ${sx(g.x)-5} ${sy(g.y)-5} L ${sx(g.x)+5} ${sy(g.y)+5} M ${sx(g.x)+5} ${sy(g.y)-5} L ${sx(g.x)-5} ${sy(g.y)+5}`}
              stroke={g.color} strokeWidth={3}
              animate={{ translateX: sx(g.x) - sx(g.x), translateY: sy(g.y) - sy(g.y) }} // dummy to force trigger if needed, or just standard anim
            />
          ))}
        </svg>
      </div>

      <SimulationControls 
        onPlay={() => { if (!generatorRef.current) generatorRef.current = gmmSteps(); setIsPlaying(true); }} 
        onPause={() => setIsPlaying(false)} 
        onReset={reset} 
        onStep={step} 
        isPlaying={isPlaying} 
        speed={speed} 
        onSpeedChange={setSpeed} 
        iteration={Math.floor(state.iteration)} 
        extraInfo={state.converged ? `✅ Konvergen!` : (state.iteration % 1 === 0.5 ? 'E-Step: Evaluasi Probabilitas' : 'M-Step: Menyesuaikan Lonceng')} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🔔 Distribusi Lonceng (Oval)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Berbeda dengan K-Means yang membagi wilayah secara kaku (bulat/garis lurus), GMM menggunakan bentuk oval yang fleksibel. Lingkaran putus-putus menggambarkan bentuk lonceng probabilitasnya.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">E-Step (Evaluasi)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Setiap titik dihitung persentase kecocokannya dengan semua lonceng probabilitas yang ada. Titik yang abu-abu/transparan berarti dia bingung dan berada di perbatasan dua lonceng (Soft Clustering).
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">M-Step (Maksimasi)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Lonceng probabilitas (pusat, lebar, dan tingginya) kemudian digeser dan disesuaikan ukurannya untuk memeluk sebanyak mungkin titik-titik yang memiliki warna/probabilitas terkuat dengannya.
          </p>
        </div>
      </div>
    </div>
  );
}
