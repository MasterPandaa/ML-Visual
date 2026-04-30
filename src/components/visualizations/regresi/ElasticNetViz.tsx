'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Layers, Shuffle } from 'lucide-react';

interface Feature { name: string; trueCoef: number; color: string; }

export default function ElasticNetViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 60, right: 40, bottom: 80, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [alpha, setAlpha] = useState(0.5);
  const [l1Ratio, setL1Ratio] = useState(0.5); // 0 = Ridge, 1 = Lasso
  const [dataSeed, setDataSeed] = useState(0);

  const features: Feature[] = useMemo(() => {
    return [
      { name: 'Fitur Utama A', trueCoef: 3.8 + (Math.random() - 0.5) * 1.5, color: '#818cf8' },
      { name: 'Fitur Utama B', trueCoef: -2.5 - Math.random() * 1.0, color: '#c084fc' },
      { name: 'Fitur Lemah 1', trueCoef: 0.9 + (Math.random() - 0.5) * 0.4, color: '#fbbf24' },
      { name: 'Fitur Lemah 2', trueCoef: -0.7 - Math.random() * 0.3, color: '#f87171' },
      { name: 'Korelasi Tinggi', trueCoef: 3.6 + (Math.random() - 0.5) * 1.0, color: '#34d399' },
    ];
  }, [dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const currentCoefs = useMemo(() => {
    return features.map(f => {
      const sign = Math.sign(f.trueCoef);
      const magnitude = Math.abs(f.trueCoef);
      
      // Simplified Elastic Net shrinkage
      // L1 penalty reduces magnitude by a constant
      // L2 penalty divides magnitude
      const l1Penalty = alpha * l1Ratio * 2;
      const l2Penalty = alpha * (1 - l1Ratio) * 3;
      
      let newMag = magnitude;
      
      // Apply L2
      newMag = newMag / (1 + l2Penalty);
      
      // Apply L1
      newMag = Math.max(0, newMag - l1Penalty);
      
      return sign * newMag;
    });
  }, [alpha, l1Ratio, features]);

  const eliminated = features.filter((_, i) => currentCoefs[i] === 0);

  const maxCoef = 4.5;
  const barWidth = innerWidth / features.length * 0.6;
  const barSpacing = innerWidth / features.length;

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Kekuatan Hukuman (Alpha): <strong className="text-indigo-400">{alpha.toFixed(2)}</strong></span>
          </div>
          <input type="range" min={0} max={2} step={0.05} value={alpha} onChange={(e) => setAlpha(parseFloat(e.target.value))} className="w-full accent-indigo-500" />
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Keseimbangan (L1 Ratio): <strong className="text-teal-400">{l1Ratio.toFixed(2)}</strong></span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={l1Ratio} onChange={(e) => setL1Ratio(parseFloat(e.target.value))} className="w-full accent-teal-500" />
          <div className="flex justify-between text-[10px] text-[var(--text-muted)]">
            <span>0 (Ridge/L2)</span>
            <span>1 (Lasso/L1)</span>
          </div>
        </div>
      </div>

      {eliminated.length > 0 && (
        <div className="mb-4 px-3 py-2 bg-teal-500/20 text-teal-400 rounded-lg text-sm font-semibold border border-teal-500/30 w-fit">
          {eliminated.length} fitur dieliminasi
        </div>
      )}

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            <line x1={0} y1={innerHeight / 2} x2={innerWidth} y2={innerHeight / 2} stroke="var(--border-color)" strokeWidth={2} strokeDasharray="4,4" />
            <text x={innerWidth + 10} y={innerHeight / 2 + 4} fill="var(--text-muted)" fontSize="12">0</text>

            {features.map((f, i) => {
              const coef = currentCoefs[i];
              const barHeight = (Math.abs(coef) / maxCoef) * (innerHeight / 2 - 10);
              const x = i * barSpacing + (barSpacing - barWidth) / 2;
              const y = coef >= 0 ? innerHeight / 2 - barHeight : innerHeight / 2;
              const isZero = coef === 0;

              return (
                <g key={f.name}>
                  <rect x={x} y={y} width={barWidth} height={barHeight || 2} rx={4} fill={isZero ? 'var(--border-color)' : f.color} opacity={isZero ? 0.4 : 0.9} className="transition-all duration-300" />
                  <text x={x + barWidth / 2} y={coef >= 0 ? y - 10 : y + barHeight + 20} textAnchor="middle" fontSize="14" fontWeight="bold" fill={isZero ? 'var(--text-muted)' : 'var(--text-primary)'} textDecoration={isZero ? 'line-through' : 'none'}>
                    {coef.toFixed(2)}
                  </text>
                  <text x={x + barWidth / 2} y={innerHeight + 25} textAnchor="middle" fill="var(--text-secondary)" fontSize="12" fontWeight="500">{f.name}</text>
                  {isZero && <text x={x + barWidth / 2} y={innerHeight + 45} textAnchor="middle" fill="#f87171" fontSize="12" fontWeight="bold">DICORET</text>}
                </g>
              );
            })}
            <text x={-15} y={10} textAnchor="end" fill="var(--text-muted)" fontSize="12">+{maxCoef}</text>
            <text x={-15} y={innerHeight - 5} textAnchor="end" fill="var(--text-muted)" fontSize="12">-{maxCoef}</text>
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">⚖️ Keseimbangan Terbaik</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat manajer yang bisa menyeimbangkan kinerja tim. Jika L1 Ratio ditarik penuh ke 1, ia menjadi Lasso yang kejam mencoret. Jika ditarik ke 0, ia menjadi Ridge yang hanya mengecilkan nilai.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-teal-500">
          <h4 className="text-sm font-bold text-teal-300 mb-2">🤝 Menangani Korelasi</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Kehebatan utama Elastic Net adalah menangani fitur yang mirip (korelasi tinggi). Lasso biasanya akan membuang salah satu secara acak, tapi Elastic Net mempertahankannya bersama-sama secara adil.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🎛️ Dua Tuas Kendali</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Dengan kombinasi Alpha (seberapa keras hukumannya) dan L1 Ratio (seberapa kejam seleksinya), kita punya kontrol penuh untuk membentuk model regresi yang paling pas untuk data rumit.
          </p>
        </div>
      </div>
    </div>
  );
}
