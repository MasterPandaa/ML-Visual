'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shield, Shuffle } from 'lucide-react';

export default function RidgeRegressionViz({ width = 800, height = 500 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 200, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [lambda, setLambda] = useState(0);
  const [dataSeed, setDataSeed] = useState(0);

  // Data: mostly linear + 3 strong outliers
  const cleanData = useMemo(() => {
    const pts = [];
    const slope = 1.5 + Math.random() * 1;
    const intercept = 3 + Math.random() * 4;
    for (let i = 0; i < 30; i++) {
      const x = Math.random() * 8;
      pts.push({ x, y: slope * x + intercept + (Math.random() - 0.5) * 4 });
    }
    // Outliers
    pts.push(
      { x: 8 + Math.random() * 2, y: 25 + Math.random() * 5 }, 
      { x: 8.5 + Math.random() * 2, y: 28 + Math.random() * 4 }, 
      { x: 9 + Math.random() * 2, y: 24 + Math.random() * 6 }
    );
    return pts;
  }, [dataSeed]);

  const randomizeData = useCallback(() => {
    setDataSeed(prev => prev + 1);
  }, []);

  // Calculate OLS (lambda=0)
  const calcRegression = (data: typeof cleanData, regLambda: number) => {
    const n = data.length;
    let sumX = 0, sumY = 0;
    data.forEach(p => {
      sumX += p.x; sumY += p.y;
    });
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    let sxy = 0, sxx = 0;
    data.forEach(p => { 
      sxy += (p.x - meanX) * (p.y - meanY); 
      sxx += (p.x - meanX) ** 2; 
    });
    
    const slope = sxy / (sxx + regLambda);
    const intercept = meanY - slope * meanX;
    return { slope, intercept };
  };

  const ols = calcRegression(cleanData, 0);
  const ridge = calcRegression(cleanData, lambda);

  const xMax = 12;
  const yMax = 35;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button
          onClick={randomizeData}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0"
        >
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <label className="text-sm font-medium text-[var(--text-secondary)]">Lambda (α):</label>
        <input type="range" min={0} max={100} step={1} value={lambda}
          onChange={(e) => setLambda(parseInt(e.target.value))}
          className="w-56 accent-emerald-500" />
        <span className="text-xl font-bold text-emerald-400 w-12">{lambda}</span>
        <div className="ml-auto text-xs text-[var(--text-muted)]">
          {lambda === 0 ? "Lambda 0: Sama persis dengan regresi biasa (sangat mudah tertipu outlier/data aneh)." : 
           lambda < 30 ? "Rem ringan: Garis mulai sedikit mengabaikan tarikan dari data yang aneh." :
           lambda < 70 ? "Rem sedang: Garis menjadi jauh lebih stabil dan masuk akal." :
           "Rem penuh: Garis terlalu mendatar karena model terlalu takut membuat tebakan ekstrem (Underfit)."}
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid */}
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i}>
                <line x1={xScale(i)} y1={0} x2={xScale(i)} y2={innerHeight} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
                <line x1={0} y1={yScale(i * 3)} x2={innerWidth} y2={yScale(i * 3)} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
              </g>
            ))}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />

            {/* Data Points - clean vs outlier */}
            {cleanData.map((p, i) => {
              const isOutlier = i >= 30;
              return (
                <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={isOutlier ? 6 : 4}
                  fill={isOutlier ? '#ef4444' : '#818cf8'} stroke="rgba(99,102,241,0.3)" strokeWidth={2} opacity={0.85}>
                  {isOutlier && <title>Outlier: data anomali</title>}
                </circle>
              );
            })}

            {/* OLS Line (always visible, dashed) */}
            <line x1={0} y1={yScale(ols.intercept)} x2={innerWidth} y2={yScale(ols.slope * xMax + ols.intercept)}
              stroke="#818cf8" strokeWidth={2} strokeDasharray="8,4" opacity={0.6} />
            
            {/* Ridge Line */}
            <line x1={0} y1={yScale(ridge.intercept)} x2={innerWidth} y2={yScale(ridge.slope * xMax + ridge.intercept)}
              stroke="#10b981" strokeWidth={3} strokeLinecap="round" />

            {/* Equations */}
            <g transform={`translate(${innerWidth + 20}, 40)`}>
              <rect x={0} y={0} width={160} height={70} rx={8} fill="var(--bg-card)" stroke="#818cf8" strokeOpacity={0.4} />
              <text x={80} y={25} textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold">OLS (Tanpa Regulerisasi)</text>
              <text x={80} y={50} textAnchor="middle" fill="#818cf8" fontSize="14" fontFamily="monospace" fontWeight="bold">
                y = {ols.slope.toFixed(2)}x + {ols.intercept.toFixed(2)}
              </text>
            </g>

            <g transform={`translate(${innerWidth + 20}, 130)`}>
              <rect x={0} y={0} width={160} height={70} rx={8} fill="var(--bg-card)" stroke="#10b981" strokeOpacity={0.4} />
              <text x={80} y={25} textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold">Ridge (L2 Regulerisasi)</text>
              <text x={80} y={50} textAnchor="middle" fill="#10b981" fontSize="14" fontFamily="monospace" fontWeight="bold">
                y = {ridge.slope.toFixed(2)}x + {ridge.intercept.toFixed(2)}
              </text>
            </g>

            {/* Shrinkage Visualization */}
            <g transform={`translate(${innerWidth + 20}, 230)`}>
              <text x={80} y={0} textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontWeight="bold">Efek Shrinkage (Bobot)</text>
              <line x1={20} y1={30} x2={140} y2={30} stroke="var(--border-color)" strokeWidth={1.5} />
              {/* OLS weight marker */}
              <circle cx={20 + Math.abs(ols.slope) * 40} cy={30} r={6} fill="#818cf8" opacity={0.6} />
              {/* Ridge weight marker */}
              <circle cx={20 + Math.abs(ridge.slope) * 40} cy={30} r={8} fill="#10b981" />
              <text x={80} y={55} textAnchor="middle" fill="var(--text-secondary)" fontSize="12">
                Slope: {ols.slope.toFixed(2)} → {ridge.slope.toFixed(2)}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 mb-6 text-sm font-medium">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-400 opacity-60"></span> <span className="text-[var(--text-muted)]">OLS (terpengaruh outlier)</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-[var(--text-muted)]">Ridge (lebih stabil)</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> <span className="text-[var(--text-muted)]">Outlier (Anomali)</span></div>
      </div>

      {/* 🎓 Educational Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">⚖️ L2 Regularization (Si Pengerem)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ridge bertindak seperti guru yang menegur murid jika terlalu yakin. Jika garis menebak dengan angka kemiringan yang terlalu ekstrem, Ridge akan menarik pinalti besar agar angkanya ditekan menjadi lebih kecil dan aman.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🎛️ Lambda (Kekuatan Rem)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Semakin besar digeser ke kanan, semakin keras "rem" ditarik. Jika terlalu keras (Lambda sangat tinggi), model malah jadi terlalu takut menebak dan garisnya mendatar sama sekali.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-red-500">
          <h4 className="text-sm font-bold text-red-300 mb-2">🛡️ Tahan Banting (Outlier)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan titik-titik merah yang letaknya 'nyeleneh'. Tanpa Ridge, garis akan tertarik ke arah mereka. Dengan Ridge, garis lebih stabil mempertahankan bentuk aslinya tanpa mudah terpengaruh titik nakal.
          </p>
        </div>
      </div>
    </div>
  );
}
