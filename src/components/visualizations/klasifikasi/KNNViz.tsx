'use client';

import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { generateClassificationData, relabelPoints, LabeledPoint2D } from '@/lib/datasets';
import { knnPredict, KNNResult } from '@/lib/algorithms/knn';
import { Shuffle, MousePointer2 } from 'lucide-react';

const W = 600, H = 400, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

export default function KNNViz() {
  const [k, setK] = useState(5);
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(150, 'linear'));
  const [queryPoint, setQueryPoint] = useState<{ x: number; y: number } | null>(null);
  const [result, setResult] = useState<KNNResult | null>(null);
  const [dataType, setDataType] = useState<'linear'|'xor'|'circle'>('linear');

  const sx = (x: number) => P + (x / 100) * (W - 2*P);
  const sy = (y: number) => H - P - (y / 100) * (H - 2*P);
  const invX = (px: number) => ((px - P) / (W - 2*P)) * 100;
  const invY = (py: number) => ((H - P - py) / (H - 2*P)) * 100;

  const handleClick = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const scaleFactorX = W / rect.width;
    const scaleFactorY = H / rect.height;
    const px = (e.clientX - rect.left) * scaleFactorX;
    const py = (e.clientY - rect.top) * scaleFactorY;
    const x = invX(px);
    const y = invY(py);
    if (x < 0 || x > 100 || y < 0 || y > 100) return;
    const pt = { x, y };
    setQueryPoint(pt);
    setResult(knnPredict(data, pt, k));
  };

  const randomize = () => {
    const d = generateClassificationData(150, dataType);
    setData(d); setQueryPoint(null); setResult(null);
  };

  const maxDist = result ? Math.max(...result.neighbors.map(n => n.distance)) : 0;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        
        <div className="flex flex-col gap-2 flex-1 min-w-[150px]">
          <span className="text-xs text-[var(--text-secondary)]">Bentuk Data:</span>
          <select value={dataType} onChange={e => { 
            const newType = e.target.value as 'linear'|'xor'|'circle';
            setDataType(newType);
            const d = relabelPoints(data, newType);
            setData(d);
            if (queryPoint) {
              setResult(knnPredict(d, queryPoint, k));
            }
          }}
            className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs">
            <option value="linear">Garis Lurus (Linear)</option>
            <option value="xor">Silang (XOR)</option>
            <option value="circle">Melingkar (Circle)</option>
          </select>
        </div>

        <div className="flex flex-col gap-2 flex-1 min-w-[200px]">
          <div className="flex justify-between text-xs">
            <span className="text-[var(--text-secondary)]">Jumlah Tetangga (K): <strong className="text-indigo-400">{k}</strong></span>
          </div>
          <input type="range" min={1} max={15} step={2} value={k} onChange={e => {
            const nk = parseInt(e.target.value); setK(nk);
            if (queryPoint) setResult(knnPredict(data, queryPoint, nk));
          }} className="w-full accent-indigo-500" />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 bg-indigo-500/10 text-indigo-300 rounded-lg text-xs font-medium border border-indigo-500/20 w-full md:w-auto mt-2 md:mt-0">
          <MousePointer2 className="w-3 h-3" /> Klik di area hitam untuk menebak titik baru
        </div>
      </div>

      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto cursor-crosshair" style={{ maxHeight: 420 }} onClick={handleClick}>
          <rect x={P} y={P} width={W-2*P} height={H-2*P} fill="rgba(10,10,26,0.5)" rx="8" />

          {/* K-radius circle */}
          {queryPoint && result && (
            <motion.circle cx={sx(queryPoint.x)} cy={sy(queryPoint.y)}
              r={0} fill="none" stroke="rgba(168,85,247,0.3)" strokeWidth={1.5} strokeDasharray="4,4"
              animate={{ r: maxDist * ((W-2*P)/100) * 0.7 }} transition={{ duration: 0.5 }} />
          )}

          {/* Neighbor connections */}
          {queryPoint && result?.neighbors.map((n, i) => (
            <motion.line key={`line-${i}`} x1={sx(queryPoint.x)} y1={sy(queryPoint.y)}
              x2={sx(n.point.x)} y2={sy(n.point.y)}
              stroke={CLASS_COLORS[n.point.label]} strokeWidth={1.5} opacity={0.4}
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 0.3, delay: i*0.05 }} />
          ))}

          {/* Data points */}
          {data.map((pt, i) => {
            const isNeighbor = result?.neighbors.some(n => n.point === pt);
            return (
              <circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r={isNeighbor ? 6 : 4}
                fill={CLASS_COLORS[pt.label]} stroke={isNeighbor ? 'white' : `${CLASS_COLORS[pt.label]}50`}
                strokeWidth={isNeighbor ? 2 : 1} opacity={isNeighbor ? 1 : 0.7} />
            );
          })}

          {/* Query point */}
          {queryPoint && (
            <g>
              <motion.circle cx={sx(queryPoint.x)} cy={sy(queryPoint.y)} r={20}
                fill={`${CLASS_COLORS[result?.predictedLabel ?? 0]}20`}
                animate={{ r: [18,22,18] }} transition={{ duration: 1.5, repeat: Infinity }} />
              <circle cx={sx(queryPoint.x)} cy={sy(queryPoint.y)} r={8}
                fill={CLASS_COLORS[result?.predictedLabel ?? 0]} stroke="white" strokeWidth={2.5} />
              <text x={sx(queryPoint.x)} y={sy(queryPoint.y)+3} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">?</text>
            </g>
          )}
        </svg>
      </div>

      {result && (
        <div className="grid grid-cols-3 gap-3 mt-4">
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Hasil Tebakan (Mayoritas)</div>
            <div className="text-sm font-bold" style={{ color: CLASS_COLORS[result.predictedLabel] }}>
              Warna Kelas {result.predictedLabel}
            </div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Jumlah Tetangga (K)</div>
            <div className="text-sm font-bold text-white">{k} Orang</div>
          </div>
          <div className="glass-card p-3 text-center">
            <div className="text-xs text-[var(--text-muted)] mb-1">Jarak Radius Terjauh</div>
            <div className="text-sm font-bold text-amber-400">{maxDist.toFixed(2)}</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">🤝 Konsep Bertanya ke Tetangga</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            KNN adalah model paling "malas" namun cerdas. Ia tidak membuat rumus rumit. Saat ada titik baru (tanda tanya), ia hanya melihat siapa tetangga-tetangga terdekatnya di peta.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">🗳️ Voting Mayoritas (Nilai K)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Nilai 'K' adalah berapa banyak tetangga yang ikut voting. Jika K=5, ia akan menarik lingkaran melingkupi 5 titik terdekat. Apapun warna mayoritas dari 5 titik tersebut, maka titik baru akan ikut warna tersebut.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📐 Memahami Bentuk Data</h4>
          <div className="space-y-3 text-xs text-[var(--text-muted)] leading-relaxed">
            <p>
              <b className="text-amber-200">1. Terpisah Rapi (Lurus)</b><br/>
              Ibarat dua desa yang dipisah oleh sebuah sungai. Sangat mudah ditebak Anda warga desa mana.
            </p>
            <p>
              <b className="text-amber-200">2. Selang-seling (XOR)</b><br/>
              Ibarat blok perumahan yang dicat selang-seling. KNN tetap akurat karena ia tidak membuat "pagar", ia hanya melihat siapa tetangga persis di sebelahnya.
            </p>
            <p>
              <b className="text-amber-200">3. Mengepung (Melingkar)</b><br/>
              Ibarat sebuah danau yang dikelilingi hutan. Model bersumbu lurus pasti bingung, tapi bagi KNN ini sangat mudah dipahami!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
