'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { AlertTriangle, Shuffle } from 'lucide-react';

interface DataPoint { x: number; y: number; }

export default function PolynomialRegressionViz({ width = 800, height = 500 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [degree, setDegree] = useState(1);
  const [dataSeed, setDataSeed] = useState(0);

  // Generate parabolic data: y = 0.5x² - 3x + 10 + noise
  const data = useMemo<DataPoint[]>(() => {
    const points: DataPoint[] = [];
    // We add some variation based on dataSeed to make it look different
    const a = 0.4 + Math.random() * 0.2;
    const b = -2 - Math.random() * 2;
    const c = 8 + Math.random() * 4;
    
    for (let i = 0; i < 30; i++) {
      const x = i * 0.35;
      const noise = (Math.random() - 0.5) * 6;
      points.push({ x, y: a * x * x + b * x + c + noise });
    }
    return points;
  }, [dataSeed]);

  const randomizeData = useCallback(() => {
    setDataSeed(prev => prev + 1);
  }, []);

  const coefficients = useMemo(() => {
    const k = degree + 1;
    
    // Build proper gram matrix
    const g: number[][] = Array.from({ length: k }, () => Array(k).fill(0));
    const r: number[] = Array(k).fill(0);
    for (let i = 0; i < k; i++) {
      for (let j = 0; j < k; j++) {
        g[i][j] = data.reduce((sum, p) => sum + Math.pow(p.x, i + j), 0);
      }
      r[i] = data.reduce((sum, p) => sum + p.y * Math.pow(p.x, i), 0);
    }
    
    // Solve using Gaussian elimination
    const solve = (A: number[][], b: number[]) => {
      const n = A.length;
      for (let i = 0; i < n; i++) {
        let max = i;
        for (let j = i + 1; j < n; j++) if (Math.abs(A[j][i]) > Math.abs(A[max][i])) max = j;
        [A[i], A[max]] = [A[max], A[i]]; [b[i], b[max]] = [b[max], b[i]];
        for (let j = i + 1; j < n; j++) {
          const factor = A[j][i] / A[i][i];
          for (let k = i; k < n; k++) A[j][k] -= factor * A[i][k];
          b[j] -= factor * b[i];
        }
      }
      const x = new Array(n).fill(0);
      for (let i = n - 1; i >= 0; i--) {
        x[i] = b[i];
        for (let j = i + 1; j < n; j++) x[i] -= A[i][j] * x[j];
        if (Math.abs(A[i][i]) < 1e-10) x[i] = 0; // handle singularity
        else x[i] /= A[i][i];
      }
      return x;
    };
    
    return solve(g.map(row => [...row]), [...r]);
  }, [data, degree]);

  const predict = (x: number) => coefficients.reduce((sum, c, i) => sum + c * Math.pow(x, i), 0);

  const xMax = 12;
  const yMax = 25;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Generate smooth curve points
  const curvePoints = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= xMax; x += 0.1) {
      pts.push(`${xScale(x)},${yScale(predict(x))}`);
    }
    return pts.join(' ');
  }, [coefficients, xScale, yScale]);

  const isOverfit = degree >= 4;
  const isUnderfit = degree === 1;

  const lineColor = isOverfit ? '#ef4444' : isUnderfit ? '#f59e0b' : '#10b981';

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center justify-between mb-4 gap-4">
        {isOverfit && (
          <div className="flex items-center gap-2 px-3 py-1 bg-red-500/20 text-red-400 rounded-full text-sm font-semibold border border-red-500/30 animate-pulse ml-auto">
            <AlertTriangle size={16} /> Overfitting!
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button
          onClick={randomizeData}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0"
        >
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <label className="text-sm font-medium text-[var(--text-secondary)]">Derajat Polynomial:</label>
        <input type="range" min={1} max={6} step={1} value={degree}
          onChange={(e) => setDegree(parseInt(e.target.value))}
          className="w-48 accent-indigo-500" />
        <span className="text-2xl font-bold text-indigo-400 w-8">{degree}</span>
        <div className="ml-auto text-xs text-[var(--text-muted)] max-w-xs">
          {isUnderfit && "Derajat 1 terlalu kaku (Underfit). Seperti mencoba membungkus bola dengan papan lurus."}
          {degree === 2 && "Derajat 2 sangat pas untuk pola data melengkung ini (Good Fit)!"}
          {degree === 3 && "Derajat 3 masih lumayan bagus, meski mulai sedikit berlebihan."}
          {isOverfit && "Garis terlalu lentur dan justru 'menghafal' titik-titik acak (Overfit). Berbahaya untuk tebakan baru."}
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid & Axes */}
            {Array.from({ length: 13 }, (_, i) => (
              <g key={i}>
                <line x1={xScale(i)} y1={0} x2={xScale(i)} y2={innerHeight} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
                <line x1={0} y1={yScale(i * 2)} x2={innerWidth} y2={yScale(i * 2)} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
              </g>
            ))}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <text x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle" fill="var(--text-muted)" fontSize="12" fontFamily="Inter">X</text>
            <text x={-40} y={innerHeight / 2} textAnchor="middle" transform={`rotate(-90, -40, ${innerHeight / 2})`} fill="var(--text-muted)" fontSize="12" fontFamily="Inter">Y</text>

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} fill="#818cf8" stroke="rgba(99,102,241,0.3)" strokeWidth={2} opacity={0.8} />
            ))}

            {/* Polynomial Curve */}
            <polyline points={curvePoints} fill="none" stroke={lineColor} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
            
            {/* Degree Label */}
            <g transform={`translate(${innerWidth - 100}, 30)`}>
              <rect x={-10} y={-20} width={120} height={30} rx={6} fill="var(--bg-card)" stroke="var(--border-color)" />
              <text x={50} y={0} textAnchor="middle" fill="var(--text-primary)" fontSize="14" fontWeight="bold">
                Derajat {degree}
              </text>
            </g>
          </g>
        </svg>
      </div>

      <div className="flex flex-wrap gap-4 mt-4 mb-6 text-sm font-medium">
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> <span className="text-[var(--text-muted)]">Underfit</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-emerald-500"></span> <span className="text-[var(--text-muted)]">Good Fit</span></div>
        <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> <span className="text-[var(--text-muted)]">Overfit</span></div>
      </div>

      {/* 🎓 Educational Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">📈 Derajat (Kelenturan Garis)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Menentukan seberapa lentur garis kita. Derajat 1 berarti kaku (garis lurus), derajat 2 bisa melengkung sekali layaknya parabola. Semakin besar angkanya, garis semakin bebas meliuk-liuk mengikuti pola.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-red-500">
          <h4 className="text-sm font-bold text-red-300 mb-2">⚠️ Overfitting (Menghafal Membabi Buta)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Terjadi ketika garis terlalu lentur hingga mencoba 'memeluk' setiap titik data satu per satu, termasuk data yang salah/error. Akibatnya, tebakannya justru akan berantakan untuk data-data baru.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🔢 Mengakali Data</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Sebenarnya ini tetaplah regresi linear biasa! Triknya adalah kita membuat 'data palsu' yang dipangkatkan (seperti X jadi X², X³) agar garis lurus tersebut seolah-olah terlihat melengkung.
          </p>
        </div>
      </div>
    </div>
  );
}
