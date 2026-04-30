'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400, P = 30;
// Using a gradient of colors to show related clusters
const COLORS = ['#3b82f6', '#0ea5e9', '#f59e0b', '#ef4444'];

interface Node {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  cluster: number;
}

export default function UMAPViz() {
  const initNodes = useCallback(() => {
    const nodes: Node[] = [];
    const numClusters = 4;
    const pointsPerCluster = 30;

    // Define target centers (the "true" low-dim embedding structure)
    // For UMAP, we simulate that cluster 0 & 1 are related (close globally), and 2 & 3 are related
    const centers = [
      { x: W*0.3, y: H*0.4 },  // Blue
      { x: W*0.3, y: H*0.6 },  // Light Blue (close to Blue)
      { x: W*0.7, y: H*0.3 },  // Orange
      { x: W*0.75, y: H*0.6 }, // Red (close to Orange)
    ];

    for (let i = 0; i < numClusters; i++) {
      for (let j = 0; j < pointsPerCluster; j++) {
        nodes.push({
          id: i * pointsPerCluster + j,
          x: P + Math.random() * (W - 2*P),
          y: P + Math.random() * (H - 2*P),
          targetX: centers[i].x + (Math.random()-0.5)*70,
          targetY: centers[i].y + (Math.random()-0.5)*70,
          cluster: i
        });
      }
    }
    return nodes;
  }, []);

  const [nodes, setNodes] = useState<Node[]>(() => initNodes());
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [iteration, setIteration] = useState(0);
  const iterRef = useRef(0);

  const randomize = useCallback(() => {
    setNodes(initNodes());
    setIteration(0);
    iterRef.current = 0;
    setIsPlaying(false);
  }, [initNodes]);

  const reset = useCallback(() => {
    setNodes(initNodes());
    setIteration(0);
    iterRef.current = 0;
    setIsPlaying(false);
  }, [initNodes]);

  const step = useCallback((): boolean => {
    setNodes(prev => prev.map(n => {
      const dx = n.targetX - n.x;
      const dy = n.targetY - n.y;
      
      const moveX = dx * 0.08 + (Math.random()-0.5)*2;
      const moveY = dy * 0.08 + (Math.random()-0.5)*2;

      return {
        ...n,
        x: n.x + moveX,
        y: n.y + moveY
      };
    }));

    iterRef.current += 1;
    setIteration(iterRef.current);
    
    if (iterRef.current >= 150) {
      setIsPlaying(false);
      return false;
    }
    return true;
  }, []);

  useSimulationLoop(step, speed * 1.4, isPlaying);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Acak Ulang
        </button>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={0} y={0} width={W} height={H} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {nodes.map(n => (
            <circle 
              key={n.id}
              cx={n.x} cy={n.y} r={4}
              fill={COLORS[n.cluster]} stroke="#ffffff" strokeWidth={0.5}
              opacity={0.85}
            />
          ))}
        </svg>
      </div>

      <SimulationControls 
        onPlay={() => setIsPlaying(true)} 
        onPause={() => setIsPlaying(false)} 
        onReset={reset} 
        onStep={step} 
        isPlaying={isPlaying} 
        speed={speed} 
        onSpeedChange={setSpeed} 
        iteration={iteration} 
        extraInfo={iteration > 80 ? '✅ UMAP Konvergen Lebih Cepat!' : 'Memetakan topologi...'} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">⚡ Jauh Lebih Cepat</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Secara matematika, UMAP menggunakan pendekatan jaringan (graf) dan rumus yang lebih ringan. Hasilnya, titik-titik bergerak ke tempat seharusnya dengan jauh lebih cepat dibanding t-SNE.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🔭 Menjaga Gambaran Besar</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan pulau Biru Tua dan Biru Muda! UMAP tahu bahwa secara global mereka agak mirip, jadi UMAP menaruh kedua pulau tersebut berdekatan. t-SNE seringkali mengabaikan hubungan jarak jauh ini.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🧬 Sangat Cocok Untuk Biologi</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Karena kecepatan dan kemampuannya menjaga gambaran besar, UMAP saat ini menjadi standar emas dunia untuk memetakan jutaan data sel biologi dan genetik.
          </p>
        </div>
      </div>
    </div>
  );
}
