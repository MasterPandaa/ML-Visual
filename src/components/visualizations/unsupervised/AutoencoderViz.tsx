'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';

const W = 600, H = 400;

interface Node {
  id: string;
  x: number;
  y: number;
  layer: number;
}

interface Signal {
  id: number;
  from: Node;
  to: Node;
  progress: number;
  color: string;
}

export default function AutoencoderViz() {
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Define Network Architecture (Input: 5, Hidden1: 4, Bottleneck: 2, Hidden2: 4, Output: 5)
  const layers = [5, 4, 2, 4, 5];
  const nodes: Node[] = [];
  
  const layerWidth = W / (layers.length + 1);
  layers.forEach((count, lIdx) => {
    const startY = (H - (count - 1) * 60) / 2;
    for (let i = 0; i < count; i++) {
      nodes.push({
        id: `L${lIdx}-N${i}`,
        x: layerWidth * (lIdx + 1),
        y: startY + i * 60,
        layer: lIdx
      });
    }
  });

  const [activeLayer, setActiveLayer] = useState(0);

  // Animation logic
  useEffect(() => {
    if (!isPlaying) {
      setActiveLayer(0);
      return;
    }

    const interval = setInterval(() => {
      setActiveLayer(prev => {
        if (prev >= layers.length) return 0; // Loop back
        return prev + 1;
      });
    }, 400);

    return () => clearInterval(interval);
  }, [isPlaying, layers.length]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button 
          onClick={() => setIsPlaying(!isPlaying)} 
          className={`text-xs py-2 px-4 shadow-lg transition-colors rounded-lg font-medium flex items-center gap-2 ${isPlaying ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20'}`}
        >
          {isPlaying ? '⏸ Jeda Simulasi' : '▶️ Mulai Kompresi'}
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <span className="text-xs text-[var(--text-muted)] font-mono">
          Status: {isPlaying ? (activeLayer <= 2 ? 'Meringkas Data (Encoder)...' : 'Mengembalikan Data (Decoder)...') : 'Menunggu Input'}
        </span>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={0} y={0} width={W} height={H} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Draw Connections */}
          {nodes.map(n1 => 
            nodes.map(n2 => {
              if (n2.layer === n1.layer + 1) {
                const isActive = isPlaying && activeLayer === n1.layer + 1;
                const isPast = isPlaying && activeLayer > n1.layer + 1;
                const isBottleneckPath = n1.layer === 1 && n2.layer === 2;
                const isExpandPath = n1.layer === 2 && n2.layer === 3;
                
                let strokeColor = "rgba(79, 70, 229, 0.1)"; // Default faint
                if (isActive || isPast) {
                   if (n2.layer <= 2) strokeColor = "rgba(168, 85, 247, 0.5)"; // Purple for compress
                   else strokeColor = "rgba(16, 185, 129, 0.5)"; // Green for expand
                }

                return (
                  <motion.line
                    key={`${n1.id}-${n2.id}`}
                    x1={n1.x} y1={n1.y} x2={n2.x} y2={n2.y}
                    stroke={strokeColor}
                    strokeWidth={isActive ? 2.5 : 1}
                    animate={{ strokeWidth: isActive ? 2.5 : 1, stroke: strokeColor }}
                    transition={{ duration: 0.3 }}
                  />
                );
              }
              return null;
            })
          )}

          {/* Draw Nodes */}
          {nodes.map(n => {
            let fillColor = "#1e1e38";
            let strokeColor = "#4f46e5";
            
            if (n.layer === 2) {
              // Bottleneck
              strokeColor = "#f59e0b"; // Amber
              if (activeLayer >= 2 && isPlaying) fillColor = "#f59e0b";
            } else if (n.layer < 2) {
              // Encoder
              if (activeLayer >= n.layer && isPlaying) fillColor = "#a855f7"; // Purple
            } else {
              // Decoder
              if (activeLayer >= n.layer && isPlaying) fillColor = "#10b981"; // Green
            }

            return (
              <g key={n.id}>
                <motion.circle 
                  cx={n.x} cy={n.y} r={10}
                  fill={fillColor} stroke={strokeColor} strokeWidth={2}
                  animate={{ fill: fillColor, scale: activeLayer === n.layer && isPlaying ? 1.3 : 1 }}
                  transition={{ duration: 0.3 }}
                />
              </g>
            );
          })}

          {/* Labels */}
          <text x={layerWidth} y={H - 20} fill="#a855f7" fontSize="14" fontWeight="bold" textAnchor="middle">Input Data</text>
          <text x={layerWidth*3} y={H - 20} fill="#f59e0b" fontSize="14" fontWeight="bold" textAnchor="middle">Bottleneck</text>
          <text x={layerWidth*5} y={H - 20} fill="#10b981" fontSize="14" fontWeight="bold" textAnchor="middle">Reconstructed</text>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🗜️ Encoder (Meringkas)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Lapisan awal (ungu) menerima data utuh yang besar, lalu secara bertahap memerasnya dengan membuang informasi yang kurang penting. Mirip mengecilkan resolusi foto (Zip).
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">💎 Bottleneck (Ruang Laten)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Bagian tengah (kuning) adalah ukuran terkecil dari data. Di sinilah tersimpan "inti" atau "DNA" dari data tersebut dalam bentuk yang sangat padat. Sering digunakan untuk mencari kemiripan data.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🪄 Decoder (Mengembalikan)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Lapisan akhir (hijau) berusaha menebak dan merakit ulang bentuk aslinya hanya berbekal kode DNA padat dari bottleneck. Hasilnya tidak 100% sama, tapi cacatnya (noise) biasanya hilang!
          </p>
        </div>
      </div>
    </div>
  );
}
