'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';

const CLASS_COLORS = ['#fb7185', '#818cf8']; // Red, Blue

export default function QDAViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [dataSeed, setDataSeed] = useState(0);

  const data = useMemo(() => {
    // For QDA, we want two classes with different covariance (shapes)
    const pts: {x: number, y: number, label: number}[] = [];
    
    // Class 0 (Red): Tight cluster in center
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = Math.random() * 15 + (dataSeed % 2);
      pts.push({
        x: 50 + Math.cos(angle) * r,
        y: 50 + Math.sin(angle) * r,
        label: 0
      });
    }
    
    // Class 1 (Blue): Spread out or outer ring
    for (let i = 0; i < 40; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 35 + Math.random() * 15 - (dataSeed % 2);
      pts.push({
        x: 50 + Math.cos(angle) * r,
        y: 50 + Math.sin(angle) * r,
        label: 1
      });
    }
    
    return pts;
  }, [dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xMax = 100;
  const yMax = 100;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // QDA Decision Boundary (Circle in this case)
  const boundaryRadius = 28;

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-400"></span> <span>Kelas A (Kecil/Padat)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-400"></span> <span>Kelas B (Luas/Menyebar)</span></div>
        </div>
      </div>

      <div className="viz-container p-4 overflow-hidden relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Background for Class B */}
            <rect x="0" y="0" width={innerWidth} height={innerHeight} fill="rgba(129, 140, 248, 0.05)" rx="8" />
            
            {/* Background for Class A (Decision region) */}
            <circle cx={xScale(50)} cy={yScale(50)} r={xScale(boundaryRadius)} fill="rgba(251, 113, 133, 0.1)" stroke="white" strokeWidth={2} strokeDasharray="5,5" />

            {/* Axes */}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />

            {/* Labels */}
            <text x={xScale(50)} y={yScale(50)} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" opacity={0.6}>Zona A</text>
            <text x={xScale(85)} y={yScale(85)} textAnchor="middle" fill="white" fontSize="12" fontWeight="bold" opacity={0.6}>Zona B</text>

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} 
                fill={CLASS_COLORS[p.label]} 
                opacity={0.8} 
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">🌀 Batas Melengkung</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Berbeda dengan LDA yang kaku dengan garis lurus, QDA jauh lebih lentur. Ia bisa membuat batas berbentuk lingkaran, elips, atau kurva lainnya untuk memisahkan data yang bentuk penyebarannya berbeda.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">📏 Menangani Variansi</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            QDA sangat hebat jika satu kelompok data berkumpul sangat padat di tengah, sementara kelompok lainnya menyebar luas di sekelilingnya. Ia memahami bahwa tiap kelompok punya "gaya sebar" yang unik.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">💡 Kapan Digunakan?</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Gunakan QDA jika Anda merasa garis lurus saja tidak cukup untuk memisahkan kelompok data yang kompleks. Namun hati-hati, karena saking lenturnya, model ini bisa jadi terlalu sensitif (overfit).
          </p>
        </div>
      </div>
    </div>
  );
}
