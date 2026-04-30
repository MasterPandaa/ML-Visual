'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const CLASS_COLORS = ['#fb7185', '#818cf8']; // Red, Blue

export default function LDAViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 60, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [dataSeed, setDataSeed] = useState(0);

  const data = useMemo(() => {
    // For LDA, we want two classes with same covariance but different means
    const pts: LabeledPoint2D[] = [];
    const n = 30;
    
    // Class 0 (Red)
    for (let i = 0; i < n; i++) {
      pts.push({
        x: 20 + Math.random() * 30 + (dataSeed % 5),
        y: 60 + Math.random() * 30,
        label: 0
      });
    }
    
    // Class 1 (Blue)
    for (let i = 0; i < n; i++) {
      pts.push({
        x: 50 + Math.random() * 30,
        y: 20 + Math.random() * 30 - (dataSeed % 5),
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

  // Calculate means for visualization
  const means = useMemo(() => {
    const m0 = { x: 0, y: 0, count: 0 };
    const m1 = { x: 0, y: 0, count: 0 };
    data.forEach(p => {
      if (p.label === 0) { m0.x += p.x; m0.y += p.y; m0.count++; }
      else { m1.x += p.x; m1.y += p.y; m1.count++; }
    });
    return [
      { x: m0.x / m0.count, y: m0.y / m0.count },
      { x: m1.x / m1.count, y: m1.y / m1.count }
    ];
  }, [data]);

  // Decision boundary for LDA (Perpendicular bisector of the line between means, simplified)
  const boundary = useMemo(() => {
    const midX = (means[0].x + means[1].x) / 2;
    const midY = (means[0].y + means[1].y) / 2;
    const dx = means[1].x - means[0].x;
    const dy = means[1].y - means[0].y;
    
    const slope = -dx / dy;
    const intercept = midY - slope * midX;
    
    return { slope, intercept };
  }, [means]);

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-rose-400"></span> <span>Kelas A</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-indigo-400"></span> <span>Kelas B</span></div>
          <div className="flex items-center gap-2 border-l border-[var(--border-color)] pl-4 ml-2">
            <span className="w-4 h-0.5 bg-white border-t border-dashed"></span> <span>Garis Proyeksi</span>
          </div>
        </div>
      </div>

      <div className="viz-container p-4 overflow-hidden relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Grid */}
            <rect x="0" y="0" width={innerWidth} height={innerHeight} fill="rgba(255,255,255,0.02)" rx="8" />

            {/* Decision Boundary Line */}
            <line 
              x1={0} y1={yScale(boundary.intercept)} 
              x2={innerWidth} y2={yScale(boundary.slope * 100 + boundary.intercept)} 
              stroke="white" strokeWidth={2} strokeDasharray="5,5" opacity={0.8}
            />

            {/* Line connecting means */}
            <line 
              x1={xScale(means[0].x)} y1={yScale(means[0].y)} 
              x2={xScale(means[1].x)} y2={yScale(means[1].y)} 
              stroke="rgba(255,255,255,0.2)" strokeWidth={1} strokeDasharray="2,2"
            />

            {/* Mean Points */}
            <circle cx={xScale(means[0].x)} cy={yScale(means[0].y)} r={8} fill={CLASS_COLORS[0]} stroke="white" strokeWidth={2} />
            <circle cx={xScale(means[1].x)} cy={yScale(means[1].y)} r={8} fill={CLASS_COLORS[1]} stroke="white" strokeWidth={2} />
            <text x={xScale(means[0].x)} y={yScale(means[0].y) - 15} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Rata-rata A</text>
            <text x={xScale(means[1].x)} y={yScale(means[1].y) + 25} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">Rata-rata B</text>

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} 
                fill={CLASS_COLORS[p.label]} 
                opacity={0.7} 
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🔦 Menyorot Perbedaan</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            LDA bekerja dengan cara mencari "sudut pandang" terbaik untuk melihat data. Ibarat menggunakan senter untuk memproyeksikan bayangan dua kelompok agar terlihat sejauh mungkin satu sama lain.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">⚖️ Jarak vs Kerapian</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Model ini berusaha memaksimalkan jarak antara rata-rata (titik besar) tiap kelompok, sekaligus memastikan tiap kelompok tetap berkumpul rapi (variansi kecil) di areanya masing-masing.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">📏 Batas Garis Lurus</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Karena sifatnya yang "Linear", batas pemisah yang dihasilkan selalu berupa garis lurus. Ini sangat efektif jika kedua kelompok data memiliki bentuk penyebaran (variansi) yang mirip.
          </p>
        </div>
      </div>
    </div>
  );
}
