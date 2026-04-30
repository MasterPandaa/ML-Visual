'use client';

import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400, P = 30;
const COLORS = ['#6366f1','#10b981','#f59e0b','#ec4899'];

interface Node {
  id: number;
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  cluster: number;
}

export default function TSNEViz() {
  const initNodes = useCallback(() => {
    const nodes: Node[] = [];
    const numClusters = 4;
    const pointsPerCluster = 30;

    // Define target centers (the "true" low-dim embedding structure t-SNE would find)
    const centers = [
      { x: W*0.25, y: H*0.25 },
      { x: W*0.75, y: H*0.25 },
      { x: W*0.25, y: H*0.75 },
      { x: W*0.75, y: H*0.75 },
    ];

    for (let i = 0; i < numClusters; i++) {
      for (let j = 0; j < pointsPerCluster; j++) {
        // Init perfectly random
        nodes.push({
          id: i * pointsPerCluster + j,
          x: P + Math.random() * (W - 2*P),
          y: P + Math.random() * (H - 2*P),
          // Target slightly scattered around center
          targetX: centers[i].x + (Math.random()-0.5)*80,
          targetY: centers[i].y + (Math.random()-0.5)*80,
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
      
      const noiseLevel = Math.max(0, 10 - iterRef.current/10);
      const moveX = dx * 0.05 + (Math.random()-0.5)*noiseLevel;
      const moveY = dy * 0.05 + (Math.random()-0.5)*noiseLevel;

      return {
        ...n,
        x: n.x + moveX,
        y: n.y + moveY
      };
    }));

    iterRef.current += 1;
    setIteration(iterRef.current);
    
    if (iterRef.current >= 250) {
      setIsPlaying(false);
      return false;
    }
    return true;
  }, []);

  useSimulationLoop(step, speed * 1.0, isPlaying);

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
              opacity={0.8}
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
        extraInfo={iteration > 150 ? '✅ Visualisasi Terbentuk' : 'Mengoptimalkan posisi...'} 
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🌌 Awalnya Acak (Dimensi Tinggi)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Data asli kita mungkin memiliki 100 fitur (100 dimensi) yang tidak bisa digambar di layar. Saat pertama dimulai, titik-titik ditaruh sembarangan di kanvas 2D seolah-olah tidak ada hubungannya.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🧲 Tarik-Menarik Gaya Magnet</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Saat tombol <b>Play</b> ditekan, t-SNE mulai bekerja. Titik yang aslinya mirip (satu warna) akan saling tarik-menarik. Titik yang aslinya berbeda akan saling tolak-menolak menjauh.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🗺️ Terbentuknya Peta Kelompok</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perlahan-lahan dari kekacauan, terbentuklah pulau-pulau kelompok yang indah. Mata kita akhirnya bisa melihat dengan jelas bahwa ada 4 jenis data berbeda dari data rumit tersebut!
          </p>
        </div>
      </div>
    </div>
  );
}
