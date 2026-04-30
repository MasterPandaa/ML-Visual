'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateClusterData, Point2D } from '@/lib/datasets';
import { Shuffle, MousePointer2 } from 'lucide-react';

const W = 600, H = 400, P = 30;

export default function OneClassSVMViz() {
  const [data, setData] = useState<Point2D[]>(() => generateClusterData(60, 1, 1.2));
  const [nu, setNu] = useState(50); // 1 to 100 representing tightness
  const [testPoints, setTestPoints] = useState<{p: Point2D, isNormal: boolean}[]>([]);

  const [maxX, minX, maxY, minY] = useMemo(() => {
    return [100, 0, 100, 0];
  }, []);

  const sx = (x: number) => P + ((x - minX) / (maxX - minX)) * (W - 2*P);
  const sy = (y: number) => H - P - ((y - minY) / (maxY - minY)) * (H - 2*P);
  const rx = (svgX: number) => minX + ((svgX - P) / (W - 2*P)) * (maxX - minX);
  const ry = (svgY: number) => minY + ((H - P - svgY) / (H - 2*P)) * (maxY - minY);

  const randomize = useCallback(() => {
    setData(generateClusterData(60, 1, 1.2));
    setTestPoints([]);
  }, []);

  // Simple kernel density estimation for RBF-like boundary
  const scorePoint = useCallback((px: number, py: number, tightness: number) => {
    let score = 0;
    const gamma = tightness / 500; // rough mapping
    for (const d of data) {
      const distSq = (px - d.x)**2 + (py - d.y)**2;
      score += Math.exp(-gamma * distSq);
    }
    return score / data.length;
  }, [data]);

  // Determine threshold based on nu
  // Nu roughly represents the fraction of outliers we allow in the training set
  // Higher nu = tighter boundary = higher threshold
  const threshold = useMemo(() => {
    const scores = data.map(d => scorePoint(d.x, d.y, nu)).sort((a, b) => a - b);
    // if nu=50 (meaning 50% slider), maybe we just pick a reasonable percentile
    const p = Math.max(0, Math.min(100, 100 - nu)); 
    const idx = Math.floor((p / 100) * scores.length);
    return scores[Math.min(scores.length - 1, idx)] * 0.8; // slightly relaxed for visual appeal
  }, [data, nu, scorePoint]);

  const handleCanvasClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    // Maintain aspect ratio calculation based on viewBox
    const clickX = (e.clientX - rect.left) * (W / rect.width);
    const clickY = (e.clientY - rect.top) * (H / rect.height);
    
    // Convert to data coordinates
    const px = rx(clickX);
    const py = ry(clickY);

    if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
      const score = scorePoint(px, py, nu);
      setTestPoints([...testPoints, { p: { x: px, y: py }, isNormal: score >= threshold }]);
    }
  };

  // Generate SVG path for the boundary contour using Marching Squares (simplified as just drawing a dense grid of points for visual)
  // Actually, drawing a grid of small rects is easier for React than marching squares
  const gridSize = 15;
  const gridCells = useMemo(() => {
    const cells = [];
    for (let i = 0; i <= W; i += gridSize) {
      for (let j = 0; j <= H; j += gridSize) {
        const px = rx(i);
        const py = ry(j);
        if (px >= minX && px <= maxX && py >= minY && py <= maxY) {
          const score = scorePoint(px, py, nu);
          if (score >= threshold) {
            cells.push({ x: i, y: j, score });
          }
        }
      }
    }
    return cells;
  }, [data, nu, threshold, scorePoint]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <button onClick={() => setTestPoints([])} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          Bersihkan Titik Uji
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex items-center gap-3">
          <span className="text-xs font-medium text-[var(--text-secondary)] whitespace-nowrap">Ketatnya Pagar (Nu/Gamma):</span>
          <input type="range" min={10} max={90} value={nu} onChange={e => setNu(parseInt(e.target.value))} className="w-32 accent-indigo-500" />
        </div>
      </div>

      <div className="viz-container p-4">
        <svg 
          viewBox={`0 0 ${W} ${H}`} 
          className="w-full h-auto cursor-crosshair" 
          style={{ maxHeight: 420 }}
          onClick={handleCanvasClick}
        >
          <rect x={0} y={0} width={W} height={H} fill="rgba(10,10,26,0.5)" rx="8" />
          
          {/* Boundary Area */}
          <g opacity={0.15}>
            {gridCells.map((c, i) => (
              <rect key={i} x={c.x - gridSize/2} y={c.y - gridSize/2} width={gridSize} height={gridSize} fill="#10b981" />
            ))}
          </g>

          {/* Normal Training Data */}
          {data.map((pt, i) => (
            <circle 
              key={`train-${i}`}
              cx={sx(pt.x)} cy={sy(pt.y)} r={4}
              fill="#10b981" stroke="#059669" strokeWidth={1}
            />
          ))}

          {/* Test Points */}
          {testPoints.map((tp, i) => (
            <motion.g key={`test-${i}`} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring" }}>
              <circle 
                cx={sx(tp.p.x)} cy={sy(tp.p.y)} r={6}
                fill={tp.isNormal ? '#34d399' : '#f43f5e'} 
                stroke="#fff" strokeWidth={2}
              />
              <text 
                x={sx(tp.p.x)} 
                y={sy(tp.p.y) - 10} 
                fill={tp.isNormal ? '#34d399' : '#f43f5e'} 
                fontSize="10" 
                fontWeight="bold" 
                textAnchor="middle"
              >
                {tp.isNormal ? 'Normal' : 'Anomali'}
              </text>
            </motion.g>
          ))}
        </svg>
      </div>

      <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-300 rounded-lg text-sm font-medium border border-indigo-500/20 mb-6">
        <MousePointer2 className="w-4 h-4" /> Klik di mana saja pada kanvas untuk menguji apakah titik baru tersebut Normal atau Anomali!
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🟢 Belajar dari yang Normal</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Berbeda dengan klasifikasi biasa yang butuh 2 kelompok (misal: Anjing vs Kucing), One-Class SVM hanya diajari 1 kelompok saja: kelompok "Normal" (titik hijau).
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🚧 Membangun Pagar Batas</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Model ini otomatis menggambar pagar pelindung gaib (area hijau redup) yang membungkus rapat seluruh data normal. Anda bisa mengatur seberapa <b>ketat</b> pagar ini membungkus dengan slider di atas.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">🚨 Mendeteksi Orang Asing</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Klik area gelap di luar pagar! Semua titik baru yang jatuh di luar batas pagar tersebut akan langsung ditangkap dan dicap sebagai <b>Anomali</b> (merah).
          </p>
        </div>
      </div>
    </div>
  );
}
