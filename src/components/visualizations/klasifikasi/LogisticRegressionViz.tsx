'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';
import { motion } from 'framer-motion';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const CLASS_COLORS = ['#fb7185', '#818cf8']; // Red for 0, Blue for 1

export default function LogisticRegressionViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [dataSeed, setDataSeed] = useState(0);

  const data = useMemo(() => {
    return generateClassificationData(40, 'linear', dataSeed);
  }, [dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xScale = (x: number) => (x / 100) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / 100) * innerHeight;

  // Very simplified logistic regression (using a mocked line based on data mean separation for visualization)
  const line = useMemo(() => {
    let sumX0 = 0, sumY0 = 0, count0 = 0;
    let sumX1 = 0, sumY1 = 0, count1 = 0;
    data.forEach(p => {
      if (p.label === 0) { sumX0 += p.x; sumY0 += p.y; count0++; }
      else { sumX1 += p.x; sumY1 += p.y; count1++; }
    });
    
    const mean0 = { x: sumX0 / count0, y: sumY0 / count0 };
    const mean1 = { x: sumX1 / count1, y: sumY1 / count1 };
    
    // Perpendicular to the line connecting means
    const dx = mean1.x - mean0.x;
    const dy = mean1.y - mean0.y;
    const midX = (mean0.x + mean1.x) / 2;
    const midY = (mean0.y + mean1.y) / 2;
    
    const slope = -dx / dy;
    const intercept = midY - slope * midX;
    
    return { slope, intercept, midX, midY, dx, dy };
  }, [data]);

  // Generate probability background grid (Sigmoid curve field)
  const probField = useMemo(() => {
    const points: {x: number, y: number, prob: number}[] = [];
    for (let i = 0; i <= 10; i++) {
      for (let j = 0; j <= 10; j++) {
        const x = i * 10;
        const y = j * 10;
        
        // Distance to the decision boundary line
        // Line equation: slope*x - y + intercept = 0
        // Distance = (slope*x - y + intercept) / sqrt(slope^2 + (-1)^2)
        const dist = (line.slope * x - y + line.intercept) / Math.sqrt(line.slope*line.slope + 1);
        
        // Check which side of the line the blue mean is on to ensure correct sign
        const blueSideVal = line.slope * line.midX - line.midY + line.intercept;
        const actualBlueSide = Math.sign(line.dx * line.slope - line.dy); 
        
        // Use sigmoid function to map distance to 0-1 probability
        // Scaling factor controls how sharp the transition is
        const z = dist * Math.sign(blueSideVal) * 0.15; 
        const prob = 1 / (1 + Math.exp(-z));
        
        points.push({ x, y, prob });
      }
    }
    return points;
  }, [line]);

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-400"></span> <span>Kelas A (0%)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-400"></span> <span>Kelas B (100%)</span></div>
          <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-4 ml-2">
            <span className="w-4 h-0.5 bg-white"></span> <span>Batas Pemisah (50%)</span>
          </div>
        </div>
      </div>

      <div className="viz-container p-4 overflow-hidden relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto relative z-10" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            
            {/* Probability Field Background */}
            {probField.map((pt, i) => {
              // Interpolate color between Rose (0) and Indigo (1)
              const r = Math.round(251 * (1 - pt.prob) + 129 * pt.prob);
              const g = Math.round(113 * (1 - pt.prob) + 140 * pt.prob);
              const b = Math.round(133 * (1 - pt.prob) + 248 * pt.prob);
              
              return (
                <rect key={i} 
                  x={xScale(pt.x) - innerWidth/20} 
                  y={yScale(pt.y) - innerHeight/20} 
                  width={innerWidth/10} 
                  height={innerHeight/10} 
                  fill={`rgba(${r},${g},${b},0.3)`} 
                />
              );
            })}

            {/* Axes */}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />

            {/* Decision Boundary Line (50% probability) */}
            <line 
              x1={0} y1={yScale(line.intercept)} 
              x2={innerWidth} y2={yScale(line.slope * 100 + line.intercept)} 
              stroke="white" strokeWidth={3} 
              className="drop-shadow-md"
            />

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={6} 
                fill={CLASS_COLORS[p.label]} 
                stroke="rgba(255,255,255,0.8)" 
                strokeWidth={1.5} opacity={1} 
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🎯 Menggambar Batas Pagar</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Berbeda dengan regresi biasa yang menebak angka, Logistic Regression mencari garis putih terbaik untuk "memagari" atau memisahkan kelompok merah (Kelas A) dan kelompok biru (Kelas B).
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🌊 Zona Peluang (Sigmoid)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan gradasi warna latarnya. Garis putih adalah area 50% ragu-ragu. Semakin jauh titik bergerak ke area biru pekat, model semakin 100% yakin itu adalah Kelas B. Begitu pula sebaliknya untuk merah.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🚥 Bukan Sekadar Ya/Tidak</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ia tidak hanya menjawab "Ini Biru", tapi menjawab "Saya 95% yakin ini Biru". Itulah mengapa model ini sangat disukai di dunia nyata (seperti deteksi penyakit atau deteksi penipuan).
          </p>
        </div>
      </div>
    </div>
  );
}
