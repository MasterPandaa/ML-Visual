'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';
import { generateLinearData, Point2D } from '@/lib/datasets';

const W = 600, H = 400, P = 40;

export default function PCAViz() {
  const [data, setData] = useState<Point2D[]>(() => generateLinearData(100, 0.4, 0.8, 0.2));
  const [showProjection, setShowProjection] = useState(false);

  // Simple PCA implementation for 2D
  const { meanX, meanY, angle, variance1, variance2 } = useMemo(() => {
    const mx = data.reduce((sum, p) => sum + p.x, 0) / data.length;
    const my = data.reduce((sum, p) => sum + p.y, 0) / data.length;
    
    let covXX = 0, covYY = 0, covXY = 0;
    data.forEach(p => {
      const dx = p.x - mx;
      const dy = p.y - my;
      covXX += dx * dx;
      covYY += dy * dy;
      covXY += dx * dy;
    });
    
    // Covariance matrix
    covXX /= data.length;
    covYY /= data.length;
    covXY /= data.length;

    // Calculate eigenvectors (angle of principal component)
    // using formula for 2x2 matrix
    const trace = covXX + covYY;
    const det = covXX * covYY - covXY * covXY;
    
    const lambda1 = trace/2 + Math.sqrt(trace*trace/4 - det);
    const lambda2 = trace/2 - Math.sqrt(trace*trace/4 - det);

    // Eigenvector for lambda1
    let vx = 1, vy = 0;
    if (covXY !== 0) {
      vx = lambda1 - covYY;
      vy = covXY;
    }

    const ang = Math.atan2(vy, vx);
    
    return { meanX: mx, meanY: my, angle: ang, variance1: lambda1, variance2: lambda2 };
  }, [data]);

  const randomize = useCallback(() => {
    setData(generateLinearData(100, Math.random() * 0.8 + 0.1, Math.random() * 2 - 1, Math.random() * 4 - 2));
    setShowProjection(false);
  }, []);

  // Normalization for visual
  const [maxX, minX, maxY, minY] = useMemo(() => {
    const xs = data.map(p => p.x), ys = data.map(p => p.y);
    const absMaxX = Math.max(...xs, 10);
    const absMinX = Math.min(...xs, -10);
    const absMaxY = Math.max(...ys, 10);
    const absMinY = Math.min(...ys, -10);
    
    const rangeX = absMaxX - absMinX;
    const rangeY = absMaxY - absMinY;
    const maxRange = Math.max(rangeX, rangeY);
    
    const midX = (absMaxX + absMinX) / 2;
    const midY = (absMaxY + absMinY) / 2;
    
    return [midX + maxRange/2, midX - maxRange/2, midY + maxRange/2, midY - maxRange/2];
  }, [data]);

  const sx = (x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P);
  const sy = (y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P);

  // Line endpoints for Principal Component 1
  const lineLength = Math.max(maxX - minX, maxY - minY) * 0.8;
  const lineX1 = meanX - Math.cos(angle) * lineLength;
  const lineY1 = meanY - Math.sin(angle) * lineLength;
  const lineX2 = meanX + Math.cos(angle) * lineLength;
  const lineY2 = meanY + Math.sin(angle) * lineLength;

  const totalVar = variance1 + variance2;
  const varPct1 = (variance1 / totalVar * 100).toFixed(1);
  const varPct2 = (variance2 / totalVar * 100).toFixed(1);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <button 
          onClick={() => setShowProjection(!showProjection)} 
          className={`text-xs py-2 px-4 shadow-lg transition-colors rounded-lg font-medium ${showProjection ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-500/20' : 'bg-transparent border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10'}`}
        >
          {showProjection ? "Sembunyikan Proyeksi" : "Terapkan Proyeksi (Reduksi Dimensi)"}
        </button>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Principal Component Line */}
          <line 
            x1={sx(lineX1)} y1={sy(lineY1)} 
            x2={sx(lineX2)} y2={sy(lineY2)} 
            stroke="rgba(168, 85, 247, 0.4)" strokeWidth="3" 
            strokeDasharray="6,6"
          />
          
          <text x={sx(lineX2) - 20} y={sy(lineY2) + 20} fill="#c084fc" fontSize="12" fontWeight="bold">PC1 ({varPct1}%)</text>

          {/* Orthogonal PC2 Line (fainter) */}
          <line 
            x1={sx(meanX - Math.cos(angle + Math.PI/2) * lineLength*0.5)} 
            y1={sy(meanY - Math.sin(angle + Math.PI/2) * lineLength*0.5)} 
            x2={sx(meanX + Math.cos(angle + Math.PI/2) * lineLength*0.5)} 
            y2={sy(meanY + Math.sin(angle + Math.PI/2) * lineLength*0.5)} 
            stroke="rgba(52, 211, 153, 0.2)" strokeWidth="2" 
            strokeDasharray="4,4"
          />

          {/* Projection lines & Points */}
          {data.map((pt, i) => {
            // Project point onto the principal component line
            const dx = pt.x - meanX;
            const dy = pt.y - meanY;
            // Dot product with unit vector
            const projDist = dx * Math.cos(angle) + dy * Math.sin(angle);
            const projX = meanX + projDist * Math.cos(angle);
            const projY = meanY + projDist * Math.sin(angle);

            const displayX = showProjection ? projX : pt.x;
            const displayY = showProjection ? projY : pt.y;

            return (
              <g key={i}>
                {showProjection && (
                  <motion.line 
                    initial={{ x1: sx(pt.x), y1: sy(pt.y), x2: sx(pt.x), y2: sy(pt.y), opacity: 0 }}
                    animate={{ x1: sx(pt.x), y1: sy(pt.y), x2: sx(projX), y2: sy(projY), opacity: 0.3 }}
                    transition={{ duration: 0.8 }}
                    stroke="#a78bfa" strokeWidth="1" strokeDasharray="2,2"
                  />
                )}
                <motion.circle 
                  cx={sx(displayX)} 
                  cy={sy(displayY)} 
                  r={4} 
                  fill="#818cf8" 
                  stroke="#4f46e5" 
                  strokeWidth={1} 
                  opacity={0.8}
                  animate={{ cx: sx(displayX), cy: sy(displayY) }}
                  transition={{ duration: 0.8, type: "spring", bounce: 0.2 }}
                />
              </g>
            );
          })}
          
          {/* Mean point */}
          <circle cx={sx(meanX)} cy={sy(meanY)} r={6} fill="#fbbf24" stroke="#fff" strokeWidth={2} />
        </svg>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">📸 Mencari Sudut Pandang Terbaik</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            PCA mencari garis lurus yang bisa menangkap sebaran data seluas mungkin (Principal Component 1). Ibarat fotografer yang mencari sudut pandang terbaik untuk memotret objek agar bentuknya terlihat paling jelas.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">📉 Memadatkan Dimensi (Proyeksi)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Klik tombol <b>Terapkan Proyeksi</b>. Anda akan melihat data 2D ditarik tegak lurus menjadi 1D di atas garis PC1. Meski ukurannya mengecil, sebagian besar "karakter" asli data tersebut tetap terjaga.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📊 Persentase Informasi (Varians)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Garis ungu putus-putus menunjukkan seberapa banyak informasi yang berhasil dipertahankan ({varPct1}%). Semakin menyebar datanya di sepanjang garis itu, semakin besar persen informasinya.
          </p>
        </div>
      </div>
    </div>
  );
}
