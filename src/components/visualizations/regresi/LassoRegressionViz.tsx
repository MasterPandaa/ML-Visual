'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Scissors, Shuffle } from 'lucide-react';

interface Feature { name: string; trueCoef: number; color: string; }

export default function LassoRegressionViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 60, right: 40, bottom: 80, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [lambda, setLambda] = useState(0);
  const [dataSeed, setDataSeed] = useState(0);

  // 5 fitur dengan koefisien berbeda
  const features: Feature[] = useMemo(() => {
    // Generate slight variations based on dataSeed, but keep the signs and relative magnitudes similar so the logic holds.
    return [
      { name: 'Luas Rumah', trueCoef: 3.5 + (Math.random() - 0.5) * 1.5, color: '#818cf8' },
      { name: 'Jarak ke Kota', trueCoef: -2.0 - Math.random() * 1.0, color: '#c084fc' },
      { name: 'Umur Bangunan', trueCoef: 0.8 + (Math.random() - 0.5) * 0.4, color: '#fbbf24' },  // akan dihapus duluan
      { name: 'Jumlah Kamar', trueCoef: 2.2 + (Math.random() - 0.5) * 1.0, color: '#34d399' },
      { name: 'Tingkat Kebisingan', trueCoef: -0.5 - Math.random() * 0.3, color: '#f87171' }, // akan dihapus
    ];
  }, [dataSeed]);

  const randomizeData = useCallback(() => {
    setDataSeed(prev => prev + 1);
  }, []);

  // Lasso: soft thresholding
  // Simplified: coef_lasso = sign(trueCoef) * max(0, |trueCoef| - lambda)
  const currentCoefs = useMemo(() => {
    return features.map(f => {
      const sign = Math.sign(f.trueCoef);
      const magnitude = Math.abs(f.trueCoef);
      const lassoMag = Math.max(0, magnitude - lambda);
      return sign * lassoMag;
    });
  }, [lambda, features]);

  const eliminated = features.filter((_, i) => currentCoefs[i] === 0);

  const maxCoef = 4;
  const barWidth = innerWidth / features.length * 0.6;
  const barSpacing = innerWidth / features.length;

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
        <input type="range" min={0} max={2.5} step={0.1} value={lambda}
          onChange={(e) => setLambda(parseFloat(e.target.value))}
          className="w-64 accent-amber-500" />
        <span className="text-xl font-bold text-amber-400 w-12">{lambda.toFixed(1)}</span>
        <div className="ml-auto text-xs text-[var(--text-muted)] max-w-xs">
          Lasso bisa melakukan <strong className="text-amber-400">bersih-bersih otomatis</strong>. Saat tuas ditarik (Lambda naik), informasi yang dianggap kurang penting akan disensor (nilainya dinolkan).
        </div>
      </div>

      {eliminated.length > 0 && (
        <div className="mb-4 px-3 py-2 bg-amber-500/20 text-amber-400 rounded-lg text-sm font-semibold border border-amber-500/30 w-fit">
          {eliminated.length} fitur dihapus: {eliminated.map(f => f.name).join(', ')}
        </div>
      )}

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Zero line */}
            <line x1={0} y1={innerHeight / 2} x2={innerWidth} y2={innerHeight / 2} 
              stroke="var(--border-color)" strokeWidth={2} strokeDasharray="4,4" />
            <text x={innerWidth + 10} y={innerHeight / 2 + 4} fill="var(--text-muted)" fontSize="12">0</text>

            {/* Bars */}
            {features.map((f, i) => {
              const coef = currentCoefs[i];
              const barHeight = (Math.abs(coef) / maxCoef) * (innerHeight / 2 - 10);
              const x = i * barSpacing + (barSpacing - barWidth) / 2;
              const y = coef >= 0 ? innerHeight / 2 - barHeight : innerHeight / 2;
              const isZero = coef === 0;

              return (
                <g key={f.name}>
                  {/* Bar */}
                  <rect x={x} y={y} width={barWidth} height={barHeight || 2} rx={4}
                    fill={isZero ? 'var(--border-color)' : f.color} opacity={isZero ? 0.4 : 0.9}
                    className="transition-all duration-300" />
                  
                  {/* Value label */}
                  <text x={x + barWidth / 2} y={coef >= 0 ? y - 10 : y + barHeight + 20} 
                    textAnchor="middle" fontSize="14" fontWeight="bold"
                    fill={isZero ? 'var(--text-muted)' : 'var(--text-primary)'}
                    textDecoration={isZero ? 'line-through' : 'none'}>
                    {coef.toFixed(2)}
                  </text>

                  {/* Feature name */}
                  <text x={x + barWidth / 2} y={innerHeight + 25} textAnchor="middle" 
                    fill="var(--text-secondary)" fontSize="12" fontWeight="500">
                    {f.name}
                  </text>
                  {isZero && (
                    <text x={x + barWidth / 2} y={innerHeight + 45} textAnchor="middle" 
                      fill="#f87171" fontSize="12" fontWeight="bold">DIHAPUS</text>
                  )}
                </g>
              );
            })}

            {/* Y Axis labels */}
            <text x={-15} y={10} textAnchor="end" fill="var(--text-muted)" fontSize="12">+{maxCoef}</text>
            <text x={-15} y={innerHeight - 5} textAnchor="end" fill="var(--text-muted)" fontSize="12">-{maxCoef}</text>
          </g>
        </svg>
      </div>

      {/* 🎓 Educational Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">✂️ L1 Regularization (Si Penyensor)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Berbeda dengan Ridge yang hanya mengecilkan nilai, Lasso adalah editor yang kejam. Jika ada informasi yang dianggap 'kurang greget', Lasso akan langsung mencoretnya menjadi tepat 0.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">🎯 Memilih yang Penting Saja</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Karena kemampuannya mencoret, Lasso secara otomatis memilah mana informasi yang berguna dan mana yang sampah. Ibarat detektif yang membuang petunjuk palsu.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">✨ Simpel dan Ringan</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Model yang menyisakan sedikit fitur aktif (karena banyak yang sudah dicoret jadi nol) sangat disukai. Selain lebih ringan saat dihitung komputer, tebakannya pun lebih mudah dijelaskan ke manusia.
          </p>
        </div>
      </div>
    </div>
  );
}
