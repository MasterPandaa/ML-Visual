'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Eye, Shuffle } from 'lucide-react';

interface Point { x: number; y: number; }

export default function BayesianRegressionViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [dataCount, setDataCount] = useState(15);
  const [dataSeed, setDataSeed] = useState(0);

  const data = useMemo(() => {
    const pts: Point[] = [];
    const slope = 1.2 + (dataSeed % 3) * 0.2;
    const intercept = 3 + (dataSeed % 2) * 2;
    
    // We only generate data in the middle range to show high uncertainty at the edges
    for (let i = 0; i < dataCount; i++) {
      const x = 3 + Math.random() * 4; // data between x=3 and x=7
      pts.push({ x, y: slope * x + intercept + (Math.random() - 0.5) * 4 });
    }
    return pts;
  }, [dataCount, dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xMax = 10;
  const yMax = 20;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Calculate simple linear regression for the mean line
  const meanLine = useMemo(() => {
    if (data.length === 0) return { slope: 1, intercept: 5 };
    const n = data.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    data.forEach(p => { sumX += p.x; sumY += p.y; sumXY += p.x * p.y; sumXX += p.x * p.x; });
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX) || 0;
    const intercept = (sumY - slope * sumX) / n || 0;
    return { slope, intercept };
  }, [data]);

  // Calculate uncertainty (standard deviation)
  // Uncertainty is lowest at the mean of X, and grows quadratically as we move away from mean of X.
  // It also scales inversely with dataCount.
  const meanX = data.length > 0 ? data.reduce((s, p) => s + p.x, 0) / data.length : 5;
  const baseUncertainty = 5 / Math.sqrt(dataCount); 

  const getUncertainty = (x: number) => {
    const distToMean = Math.abs(x - meanX);
    return baseUncertainty + (distToMean * distToMean * 0.05 * (20 / dataCount));
  };

  // Generate path for the shaded uncertainty region
  const uncertaintyPath = useMemo(() => {
    const upperPoints: string[] = [];
    const lowerPoints: string[] = [];
    
    for (let x = 0; x <= xMax; x += 0.5) {
      const yMean = meanLine.slope * x + meanLine.intercept;
      const unc = getUncertainty(x);
      
      upperPoints.push(`${xScale(x)},${yScale(yMean + unc)}`);
      lowerPoints.unshift(`${xScale(x)},${yScale(yMean - unc)}`);
    }
    
    return [...upperPoints, ...lowerPoints].join(' ');
  }, [meanLine, baseUncertainty, meanX, xScale, yScale, getUncertainty]);

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Jumlah Titik Data: <strong className="text-purple-400">{dataCount}</strong></span>
          </div>
          <input type="range" min={3} max={50} step={1} value={dataCount} onChange={(e) => setDataCount(parseInt(e.target.value))} className="w-full accent-purple-500" />
          <div className="text-[10px] text-[var(--text-muted)] mt-1">
            Geser ke kanan untuk menambah data. Lihat bagaimana area bayangan (ketidakpastian) menyusut.
          </div>
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid & Axes */}
            {Array.from({ length: 11 }, (_, i) => (
              <g key={i}>
                <line x1={xScale(i)} y1={0} x2={xScale(i)} y2={innerHeight} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
                <line x1={0} y1={yScale(i * 2)} x2={innerWidth} y2={yScale(i * 2)} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
              </g>
            ))}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <text x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle" fill="var(--text-muted)" fontSize="12">X (Sumbu Pengamatan)</text>
            <text x={-40} y={innerHeight / 2} textAnchor="middle" transform={`rotate(-90, -40, ${innerHeight / 2})`} fill="var(--text-muted)" fontSize="12">Y (Nilai Prediksi)</text>

            {/* Uncertainty Shading */}
            <polygon points={uncertaintyPath} fill="rgba(192, 132, 252, 0.2)" stroke="none" />
            
            {/* Uncertainty Bounds lines */}
            <polyline points={uncertaintyPath.split(' ').slice(0, 21).join(' ')} fill="none" stroke="rgba(192, 132, 252, 0.5)" strokeWidth={1} strokeDasharray="4,4" />
            <polyline points={uncertaintyPath.split(' ').slice(21).join(' ')} fill="none" stroke="rgba(192, 132, 252, 0.5)" strokeWidth={1} strokeDasharray="4,4" />

            {/* Mean Line */}
            <line 
              x1={0} y1={yScale(meanLine.intercept)} 
              x2={innerWidth} y2={yScale(meanLine.slope * xMax + meanLine.intercept)} 
              stroke="#c084fc" strokeWidth={3} 
            />

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} fill="#818cf8" stroke="rgba(99,102,241,0.3)" strokeWidth={2} opacity={0.8} />
            ))}

            {/* Labels */}
            <g transform={`translate(${innerWidth - 120}, 20)`}>
               <rect x={0} y={0} width={100} height={20} fill="rgba(192, 132, 252, 0.2)" />
               <text x={50} y={14} textAnchor="middle" fill="var(--text-primary)" fontSize="10" fontWeight="bold">Area Keraguan</text>
            </g>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🔮 Bukan Sekadar Tebakan</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Regresi biasa hanya memberi satu garis jawaban pasti. Bayesian Regression jujur tentang keraguannya: ia memberi satu tebakan terbaik (garis tengah) beserta 'Area Keraguan' (bayangan ungu).
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">📈 Makin Sedikit Data, Makin Ragu</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan saat Anda mengurangi jumlah data (geser tuas ke kiri), bayangan ungunya melebar. Ibarat peramal cuaca: jika datanya sedikit, tebakannya punya margin error yang sangat besar.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🔭 Keraguan di Area Gelap</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan ujung kiri (X=0) dan ujung kanan (X=10). Karena tidak ada titik data di sana, model menjadi sangat ragu, sehingga bayangannya sangat lebar bak terompet. Ia hanya yakin di area yang banyak data (tengah).
          </p>
        </div>
      </div>
    </div>
  );
}
