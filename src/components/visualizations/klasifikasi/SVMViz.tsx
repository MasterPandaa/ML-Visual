'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';

const CLASS_COLORS = ['#fb7185', '#818cf8']; // Red, Blue

export default function SVMViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [tolerance, setTolerance] = useState(50); // Represents C parameter inversely
  const [dataSeed, setDataSeed] = useState(0);

  // Generate linearly separable data with a few points that might cross over
  const data = useMemo(() => {
    const pts: {x: number, y: number, label: number}[] = [];
    
    // Class 0 (Red)
    for (let i = 0; i < 20; i++) {
      pts.push({
        x: 1 + Math.random() * 4 + (dataSeed % 3) * 0.2,
        y: 6 + Math.random() * 3,
        label: 0
      });
    }
    
    // Class 1 (Blue)
    for (let i = 0; i < 20; i++) {
      pts.push({
        x: 5 + Math.random() * 4,
        y: 1 + Math.random() * 4 - (dataSeed % 3) * 0.2,
        label: 1
      });
    }

    // Add a couple of "tricky" points in the middle
    pts.push({ x: 4.5, y: 5.5, label: 0 });
    pts.push({ x: 5.5, y: 4.5, label: 1 });
    
    return pts;
  }, [dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xMax = 10;
  const yMax = 10;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Very simplified SVM boundary calculation for visualization
  const svm = useMemo(() => {
    // The true separating boundary roughly goes diagonally from top-left to bottom-right
    // Equation: y = -x + 10
    // When tolerance is low (strict, high C), margin is narrow
    // When tolerance is high (loose, low C), margin is wide
    
    const slope = 1.2;
    const intercept = 0; 
    
    // Transform tolerance (0-100) to margin width
    const marginWidth = 0.5 + (tolerance / 100) * 2.5;
    
    // For visualization, we will just use a fixed slope that looks good for this synthetic data
    // and adjust the margin lines based on the tolerance slider
    const mainSlope = 1.2;
    const mainIntercept = -1.2;
    
    return {
      slope: mainSlope,
      intercept: mainIntercept,
      margin: marginWidth
    };
  }, [tolerance]);

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Lebar Jalan (Batas Toleransi): <strong className="text-amber-400">{tolerance}%</strong></span>
          </div>
          <input type="range" min={0} max={100} step={1} value={tolerance} onChange={(e) => setTolerance(parseInt(e.target.value))} className="w-full accent-amber-500" />
          <div className="text-[10px] text-[var(--text-muted)] mt-1 flex justify-between">
            <span>Sempit (Kaku)</span>
            <span>Lebar (Lentur)</span>
          </div>
        </div>
      </div>

      <div className="viz-container p-4 overflow-hidden">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            
            {/* Margin Background (The "Road") */}
            <polygon 
              points={`
                ${xScale(0)},${yScale(svm.slope * 0 + svm.intercept + svm.margin)} 
                ${xScale(10)},${yScale(svm.slope * 10 + svm.intercept + svm.margin)} 
                ${xScale(10)},${yScale(svm.slope * 10 + svm.intercept - svm.margin)} 
                ${xScale(0)},${yScale(svm.slope * 0 + svm.intercept - svm.margin)}
              `} 
              fill="rgba(251, 191, 36, 0.15)" stroke="none" 
            />

            {/* Axes */}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />

            {/* Main Decision Boundary */}
            <line 
              x1={xScale(0)} y1={yScale(svm.slope * 0 + svm.intercept)} 
              x2={xScale(10)} y2={yScale(svm.slope * 10 + svm.intercept)} 
              stroke="#fbbf24" strokeWidth={3} 
            />
            
            {/* Upper Margin (Support Vector Line 1) */}
            <line 
              x1={xScale(0)} y1={yScale(svm.slope * 0 + svm.intercept + svm.margin)} 
              x2={xScale(10)} y2={yScale(svm.slope * 10 + svm.intercept + svm.margin)} 
              stroke="#fb7185" strokeWidth={1.5} strokeDasharray="6,4"
            />
            
            {/* Lower Margin (Support Vector Line 2) */}
            <line 
              x1={xScale(0)} y1={yScale(svm.slope * 0 + svm.intercept - svm.margin)} 
              x2={xScale(10)} y2={yScale(svm.slope * 10 + svm.intercept - svm.margin)} 
              stroke="#818cf8" strokeWidth={1.5} strokeDasharray="6,4"
            />

            {/* Data Points */}
            {data.map((p, i) => {
              // Check if point is inside the margin (a support vector / violation)
              const lineY = svm.slope * p.x + svm.intercept;
              const isInsideMargin = Math.abs(p.y - lineY) <= svm.margin;
              
              return (
                <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={isInsideMargin ? 7 : 5} 
                  fill={CLASS_COLORS[p.label]} 
                  stroke={isInsideMargin ? '#fff' : 'rgba(255,255,255,0.2)'} 
                  strokeWidth={isInsideMargin ? 2 : 1} 
                  opacity={isInsideMargin ? 1 : 0.7} 
                  className="transition-all duration-300"
                />
              );
            })}

            {/* Labels */}
            <text x={xScale(2)} y={yScale(8)} fill="#fb7185" fontSize="16" fontWeight="bold" opacity={0.5}>KELAS A</text>
            <text x={xScale(8)} y={yScale(2)} fill="#818cf8" fontSize="16" fontWeight="bold" opacity={0.5}>KELAS B</text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🛣️ Membuat Jalan Terlebar</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Garis tengah kuning adalah pemisah utamanya. Area redup di sekitarnya adalah "jalan/margin". Tujuan utama SVM adalah membuat jalan ini selebar-lebarnya tanpa (seminimal mungkin) menabrak titik merah atau biru.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🚥 Support Vectors (Titik Menyala)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan titik-titik yang menyala terang dengan garis tepi putih. Mereka adalah titik yang berada di batas jalan atau di dalam jalan. Merekalah yang disebut "Support Vectors" yang menopang bentuk jalan. Titik lain yang jauh diabaikan.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">🎛️ Lebar Jalan (Parameter C)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Jika tuas ditarik ke kiri (sempit), SVM sangat kaku dan tidak mau ada titik yang masuk ke jalan (rawan overfit). Jika ditarik ke kanan (lebar), SVM lebih santai membiarkan beberapa titik tersenggol asalkan jalannya lebar (lebih stabil).
          </p>
        </div>
      </div>
    </div>
  );
}
