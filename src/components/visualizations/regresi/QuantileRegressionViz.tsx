'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';

interface Point { x: number; y: number; }

export default function QuantileRegressionViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [quantile, setQuantile] = useState(50); // 10 to 90
  const [dataSeed, setDataSeed] = useState(0);

  // Generate data with heteroscedasticity (variance increases with x)
  const data = useMemo(() => {
    const pts: Point[] = [];
    const slope = 1.0;
    const intercept = 2;
    
    for (let i = 0; i < 40; i++) {
      const x = 1 + Math.random() * 8; // x from 1 to 9
      // variance gets larger as x gets larger
      const noise = (Math.random() - 0.5) * (x * 1.5 + 1);
      pts.push({ x, y: slope * x + intercept + noise });
    }
    return pts;
  }, [dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xMax = 10;
  const yMax = 25;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Very simplified quantile regression estimation (heuristic approach for visualization)
  const calculateQuantileLine = (q: number) => {
    // We sort points by X, split into buckets, find quantiles in buckets, then do linear fit.
    // For a smooth visualization, we just use a heuristic line that passes correctly
    // Since true quantile regression requires linear programming, we mock the slopes.
    
    // Sort by y to find the overall offset
    const sortedY = [...data].sort((a, b) => a.y - b.y);
    if (sortedY.length === 0) return { slope: 1, intercept: 2 };
    
    // Base slope
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; });
    const n = data.length;
    const baseSlope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 1;
    
    // Because noise variance increases with X, the spread is wider at high X.
    // So slope is steeper for high quantiles, flatter for low quantiles.
    const slopeOffset = ((q - 50) / 100) * 1.2; 
    const finalSlope = baseSlope + slopeOffset;
    
    // Find intercept such that exactly q% of points are below the line
    let bestIntercept = 0;
    let minDiff = 100;
    
    for (let inc = -10; inc < 10; inc += 0.2) {
      let belowCount = 0;
      data.forEach(p => {
        if (p.y <= finalSlope * p.x + inc) belowCount++;
      });
      const pctBelow = (belowCount / n) * 100;
      if (Math.abs(pctBelow - q) < minDiff) {
        minDiff = Math.abs(pctBelow - q);
        bestIntercept = inc;
      }
    }
    
    return { slope: finalSlope, intercept: bestIntercept };
  };

  const currentLine = useMemo(() => calculateQuantileLine(quantile), [quantile, data]);
  
  // Static lines for reference
  const line10 = useMemo(() => calculateQuantileLine(10), [data]);
  const line50 = useMemo(() => calculateQuantileLine(50), [data]);
  const line90 = useMemo(() => calculateQuantileLine(90), [data]);

  // Color logic
  const getLineColor = (q: number) => {
    if (q < 30) return '#3b82f6'; // blue
    if (q > 70) return '#ef4444'; // red
    return '#10b981'; // emerald for median
  };

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Target Persentil (Quantile): <strong style={{ color: getLineColor(quantile) }}>{quantile}%</strong></span>
          </div>
          <input type="range" min={10} max={90} step={10} value={quantile} onChange={(e) => setQuantile(parseInt(e.target.value))} 
            className="w-full" style={{ accentColor: getLineColor(quantile) }} />
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Garis membagi data: {quantile}% di bawah garis, {100-quantile}% di atas garis.
          </div>
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Axes */}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            
            {/* Background Reference Lines */}
            <line x1={0} y1={yScale(line10.intercept)} x2={innerWidth} y2={yScale(line10.slope * xMax + line10.intercept)} stroke="#3b82f6" strokeWidth={1.5} opacity={0.3} strokeDasharray="4,4" />
            <text x={innerWidth + 5} y={yScale(line10.slope * xMax + line10.intercept)} fill="#3b82f6" fontSize="10" opacity={0.5}>Q10</text>
            
            <line x1={0} y1={yScale(line50.intercept)} x2={innerWidth} y2={yScale(line50.slope * xMax + line50.intercept)} stroke="#10b981" strokeWidth={1.5} opacity={0.3} strokeDasharray="4,4" />
            <text x={innerWidth + 5} y={yScale(line50.slope * xMax + line50.intercept)} fill="#10b981" fontSize="10" opacity={0.5}>Q50</text>
            
            <line x1={0} y1={yScale(line90.intercept)} x2={innerWidth} y2={yScale(line90.slope * xMax + line90.intercept)} stroke="#ef4444" strokeWidth={1.5} opacity={0.3} strokeDasharray="4,4" />
            <text x={innerWidth + 5} y={yScale(line90.slope * xMax + line90.intercept)} fill="#ef4444" fontSize="10" opacity={0.5}>Q90</text>

            {/* Data Points */}
            {data.map((p, i) => {
              const isBelow = p.y <= currentLine.slope * p.x + currentLine.intercept;
              return (
                <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} 
                  fill={isBelow ? getLineColor(quantile) : 'transparent'} 
                  stroke={isBelow ? 'none' : 'rgba(255,255,255,0.4)'} 
                  strokeWidth={1.5} opacity={0.8} />
              );
            })}

            {/* Current Highlighted Line */}
            <line 
              x1={0} y1={yScale(currentLine.intercept)} 
              x2={innerWidth} y2={yScale(currentLine.slope * xMax + currentLine.intercept)} 
              stroke={getLineColor(quantile)} strokeWidth={3} 
            />
            <text x={innerWidth + 10} y={yScale(currentLine.slope * xMax + currentLine.intercept) + 4} fill={getLineColor(quantile)} fontSize="14" fontWeight="bold">
              Q{quantile}
            </text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-blue-500">
          <h4 className="text-sm font-bold text-blue-300 mb-2">🎯 Membagi Kelas Secara Adil</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Regresi biasa (garis tengah) hanya peduli pada nilai rata-rata. Quantile Regression peduli pada batasan. Jika Anda mengatur tuas ke 10%, garis akan turun dan hanya 10% titik terendah yang berada di bawah garis.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🚥 Titik Berwarna</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan titik data. Titik yang terisi warna berarti nilainya "jatuh di bawah batasan" yang Anda buat. Semakin besar persentil yang Anda pilih, semakin banyak titik yang masuk kriteria tersebut.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-red-500">
          <h4 className="text-sm font-bold text-red-300 mb-2">💡 Kapan Digunakan?</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Sangat berguna saat Anda ingin tahu yang "terburuk" atau "terbaik". Misalnya: Mencari tahu gaji paling murah (10% terbawah) untuk sebuah profesi, bukan cuma peduli gaji rata-ratanya saja.
          </p>
        </div>
      </div>
    </div>
  );
}
