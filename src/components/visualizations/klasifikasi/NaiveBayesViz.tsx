'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { Shuffle } from 'lucide-react';

const CLASS_COLORS = ['#3b82f6', '#ef4444']; // Blue (Normal), Red (Spam)

export default function NaiveBayesViz({ width = 800, height = 450 }: { width?: number; height?: number }) {
  const margin = { top: 40, right: 40, bottom: 60, left: 60 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const [dataSeed, setDataSeed] = useState(0);

  const data = useMemo(() => {
    const pts: {x: number, y: number, label: number}[] = [];
    
    // Class 0 (Blue/Normal): Clustered around (3, 3) with some spread
    for (let i = 0; i < 30; i++) {
      pts.push({
        x: Math.max(0, Math.min(10, 3 + (Math.random() + Math.random() - 1) * 2)),
        y: Math.max(0, Math.min(10, 3 + (Math.random() + Math.random() - 1) * 2)),
        label: 0
      });
    }
    
    // Class 1 (Red/Spam): Clustered around (7, 7) with some spread
    for (let i = 0; i < 30; i++) {
      pts.push({
        x: Math.max(0, Math.min(10, 7 + (Math.random() + Math.random() - 1) * 2.5)),
        y: Math.max(0, Math.min(10, 7 + (Math.random() + Math.random() - 1) * 2.5)),
        label: 1
      });
    }
    
    return pts;
  }, [dataSeed]);

  const randomizeData = useCallback(() => setDataSeed(prev => prev + 1), []);

  const xMax = 10;
  const yMax = 10;
  const xScale = (x: number) => (x / xMax) * innerWidth;
  const yScale = (y: number) => innerHeight - (y / yMax) * innerHeight;

  // Calculate Naive Bayes Parameters (assuming Gaussian, independent features)
  const nbModel = useMemo(() => {
    const stats = [0, 1].map(label => {
      const classData = data.filter(d => d.label === label);
      const n = classData.length;
      const meanX = classData.reduce((sum, d) => sum + d.x, 0) / n;
      const meanY = classData.reduce((sum, d) => sum + d.y, 0) / n;
      
      const varX = classData.reduce((sum, d) => sum + Math.pow(d.x - meanX, 2), 0) / n || 0.1;
      const varY = classData.reduce((sum, d) => sum + Math.pow(d.y - meanY, 2), 0) / n || 0.1;
      
      return { meanX, meanY, varX, varY, prior: n / data.length };
    });
    return stats;
  }, [data]);

  // Generate probability background grid
  const probField = useMemo(() => {
    const points: {x: number, y: number, isRed: boolean, opacity: number}[] = [];
    
    const gaussian = (x: number, mean: number, variance: number) => {
      return (1 / Math.sqrt(2 * Math.PI * variance)) * Math.exp(-Math.pow(x - mean, 2) / (2 * variance));
    };

    for (let i = 0; i <= 20; i++) {
      for (let j = 0; j <= 20; j++) {
        const x = i * 0.5;
        const y = j * 0.5;
        
        // P(Class) * P(X|Class) * P(Y|Class)  [Naive Assumption: X and Y are independent]
        const pBlue = nbModel[0].prior * gaussian(x, nbModel[0].meanX, nbModel[0].varX) * gaussian(y, nbModel[0].meanY, nbModel[0].varY);
        const pRed = nbModel[1].prior * gaussian(x, nbModel[1].meanX, nbModel[1].varX) * gaussian(y, nbModel[1].meanY, nbModel[1].varY);
        
        const sum = pBlue + pRed;
        const probRed = sum > 0 ? pRed / sum : 0.5;
        
        // Only draw if there's a strong leaning, otherwise it's neutral
        if (Math.abs(probRed - 0.5) > 0.1) {
          points.push({ 
            x, y, 
            isRed: probRed > 0.5, 
            opacity: Math.min(0.4, Math.abs(probRed - 0.5) * 0.8) 
          });
        }
      }
    }
    return points;
  }, [nbModel]);

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomizeData} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <div className="flex items-center gap-4 text-xs font-medium">
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> <span>Email Normal (Biru)</span></div>
          <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> <span>Email Spam (Merah)</span></div>
        </div>
      </div>

      <div className="viz-container p-4 overflow-hidden relative">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto relative z-10" style={{ maxHeight: 420 }}>
          <g transform={`translate(${margin.left},${margin.top})`}>
            
            {/* Probability Field Background */}
            {probField.map((pt, i) => (
               <rect key={i} 
                 x={xScale(pt.x) - innerWidth/40} 
                 y={yScale(pt.y) - innerHeight/40} 
                 width={innerWidth/20} 
                 height={innerHeight/20} 
                 fill={pt.isRed ? '#ef4444' : '#3b82f6'}
                 opacity={pt.opacity} 
               />
            ))}

            {/* Axes */}
            <line x1={0} y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            <line x1={0} y1={0} x2={0} y2={innerHeight} stroke="var(--border-color)" strokeWidth={1.5} />
            
            <text x={innerWidth / 2} y={innerHeight + 40} textAnchor="middle" fill="var(--text-muted)" fontSize="12">Penggunaan Kata "Hadiah" / "Gratis"</text>
            <text x={-40} y={innerHeight / 2} textAnchor="middle" transform={`rotate(-90, -40, ${innerHeight / 2})`} fill="var(--text-muted)" fontSize="12">Jumlah Tanda Seru (!!!)</text>

            {/* Independent Distributions (The "Naive" part visualization) */}
            <ellipse cx={xScale(nbModel[0].meanX)} cy={yScale(nbModel[0].meanY)} rx={innerWidth * Math.sqrt(nbModel[0].varX)/xMax * 2} ry={innerHeight * Math.sqrt(nbModel[0].varY)/yMax * 2} fill="none" stroke="#3b82f6" strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />
            <ellipse cx={xScale(nbModel[1].meanX)} cy={yScale(nbModel[1].meanY)} rx={innerWidth * Math.sqrt(nbModel[1].varX)/xMax * 2} ry={innerHeight * Math.sqrt(nbModel[1].varY)/yMax * 2} fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="4,4" opacity={0.6} />

            {/* Data Points */}
            {data.map((p, i) => (
              <circle key={i} cx={xScale(p.x)} cy={yScale(p.y)} r={5} 
                fill={CLASS_COLORS[p.label]} 
                stroke="rgba(255,255,255,0.8)" 
                strokeWidth={1.5} opacity={0.9} 
              />
            ))}
          </g>
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-blue-500">
          <h4 className="text-sm font-bold text-blue-300 mb-2">📊 Menghitung Peluang</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Daripada menarik garis pemisah yang rumit, model ini murni menghitung peluang. "Berapa persen peluang ini Spam jika banyak kata 'Hadiah'?". Lihat lingkaran putus-putus, itu adalah peta peluang dari data masa lalu.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-red-500">
          <h4 className="text-sm font-bold text-red-300 mb-2">🙈 Sifat "Naif" (Polos)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Disebut "Naif" karena model ini menganggap kata "Hadiah" dan "Tanda seru" itu kejadian yang sama sekali tidak berhubungan (berdiri sendiri). Lingkarannya selalu tegak lurus sempurna, tidak pernah miring.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">⚡ Super Cepat</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Karena kepolosannya yang mengabaikan hubungan antar fitur, proses perhitungannya menjadi sangat ringan dan kilat layaknya hanya mengalikan angka sederhana. Sangat cocok untuk menyaring jutaan email per detik.
          </p>
        </div>
      </div>
    </div>
  );
}
