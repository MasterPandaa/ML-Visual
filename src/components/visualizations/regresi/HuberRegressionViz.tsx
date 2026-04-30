'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';

interface Point { x: number; y: number; isOutlier?: boolean; }

export default function HuberRegressionViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [outlierY, setOutlierY] = useState(25); // Slidable outlier
  const [dataSeed, setDataSeed] = useState(0);

  const data = useMemo(() => {
    const pts: Point[] = [];
    const trueSlope = 1.2;
    const trueIntercept = 3;
    
    // Normal points
    for (let i = 0; i < 15; i++) {
      const x = 1 + Math.random() * 8; 
      pts.push({ x, y: trueSlope * x + trueIntercept + (Math.random() - 0.5) * 2 });
    }
    
    // The slidable outlier
    pts.push({ x: 8, y: outlierY, isOutlier: true });
    
    return pts;
  }, [dataSeed, outlierY]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xMax = 10;
  const yMax = 30;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Simple OLS
  const ols = useMemo(() => {
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;
    return { slope, intercept };
  }, [data]);

  // Very simplified Huber regression (Iteratively Reweighted Least Squares heuristic for visualization)
  const huber = useMemo(() => {
    let wSlope = ols.slope;
    let wIntercept = ols.intercept;
    const epsilon = 1.35; // Standard Huber epsilon
    
    // IRLS iterations
    for (let iter = 0; iter < 10; iter++) {
      let sumW = 0, sumWX = 0, sumWY = 0, sumWXY = 0, sumWXX = 0;
      
      data.forEach(p => {
        const residual = Math.abs(p.y - (wSlope * p.x + wIntercept));
        // Huber weight: 1 if small error, epsilon/|e| if large error
        const weight = residual <= epsilon ? 1 : epsilon / residual;
        
        sumW += weight;
        sumWX += weight * p.x;
        sumWY += weight * p.y;
        sumWXY += weight * p.x * p.y;
        sumWXX += weight * p.x * p.x;
      });
      
      // Update with weighted formulas
      const denom = (sumW * sumWXX - sumWX * sumWX);
      if (denom === 0) break;
      wSlope = (sumW * sumWXY - sumWX * sumWY) / denom;
      wIntercept = (sumWY - wSlope * sumWX) / sumW;
    }
    
    return { slope: wSlope, intercept: wIntercept };
  }, [data, ols]);

  // Calculate error bounds for visualization to show what Huber considers "normal" vs "outlier"
  // Roughly bounded by epsilon from the Huber line
  const epsilonBound = 1.35 * 1.5; // Scaled for visual effect

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Posisi Data Nyeleneh (Outlier): <strong className="text-rose-400">Y={outlierY}</strong></span>
          </div>
          <input type="range" min={0} max={30} step={1} value={outlierY} onChange={(e) => setOutlierY(parseInt(e.target.value))} className="w-full accent-rose-500" />
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Geser untuk melihat bagaimana garis kuning (Regresi Biasa) tertarik, sedangkan garis hijau (Huber) tetap stabil.
          </div>
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Axes */}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            
            {/* Huber Safe Zone */}
            <polygon 
              points={`
                0,${yScale(huber.intercept + epsilonBound)} 
                ${innerWidth},${yScale(huber.slope * xMax + huber.intercept + epsilonBound)} 
                ${innerWidth},${yScale(huber.slope * xMax + huber.intercept - epsilonBound)} 
                0,${yScale(huber.intercept - epsilonBound)}
              `} 
              fill="rgba(16, 185, 129, 0.1)" stroke="none" 
            />

            {/* OLS Line */}
            <line 
              x1={0} y1={yScale(ols.intercept)} 
              x2={innerWidth} y2={yScale(ols.slope * xMax + ols.intercept)} 
              stroke="#fbbf24" strokeWidth={2} strokeDasharray="6,4"
            />
            <text x={innerWidth - 20} y={yScale(ols.slope * xMax + ols.intercept) - 10} fill="#fbbf24" fontSize="12" fontWeight="bold">Regresi Biasa</text>

            {/* Huber Line */}
            <line 
              x1={0} y1={yScale(huber.intercept)} 
              x2={innerWidth} y2={yScale(huber.slope * xMax + huber.intercept)} 
              stroke="#10b981" strokeWidth={3} 
            />
            <text x={innerWidth - 20} y={yScale(huber.slope * xMax + huber.intercept) + 20} fill="#10b981" fontSize="12" fontWeight="bold">Huber</text>

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={p.isOutlier ? 8 : 5} 
                fill={p.isOutlier ? '#f43f5e' : '#818cf8'} 
                stroke={p.isOutlier ? '#fff' : 'none'} 
                strokeWidth={p.isOutlier ? 2 : 0} opacity={0.9} 
                className={p.isOutlier ? 'transition-all duration-300' : ''}
              />
            ))}
            
            {/* Highlight the outlier */}
            <g transform={`translate(${xScale(8)}, ${yScale(outlierY)})`} className="transition-all duration-300">
               <text x={0} y={-15} textAnchor="middle" fill="#f43f5e" fontSize="12" fontWeight="bold">Outlier</text>
            </g>

            {/* Hubber Zone Label */}
            <text x={20} y={yScale(huber.intercept + epsilonBound) - 10} fill="rgba(16, 185, 129, 0.8)" fontSize="10">Batas Toleransi (Epsilon)</text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🛡️ Sang Wasit Adil</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan garis hijau (Huber). Ia dengan cerdas mengabaikan titik merah yang "nyeleneh" (outlier) dan tetap fokus pada kelompok data yang mayoritas, sehingga hasil tebakannya tidak kacau.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">⚠️ Kelemahan Regresi Biasa</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Coba geser titik merah naik turun. Garis putus-putus kuning (Regresi Biasa) akan sangat mudah ditarik mengikuti titik merah tersebut karena ia berusaha "menyenangkan semua orang".
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">🚥 Batas Toleransi</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Huber memiliki semacam "batas wajar" (area hijau tipis). Jika ada data yang jauh keluar dari batas ini, ia tidak akan membiarkan data tersebut merusak hasil perhitungan garis utama.
          </p>
        </div>
      </div>
    </div>
  );
}
