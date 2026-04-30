'use client';

import { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { generateLinearData, Point2D } from '@/lib/datasets';
import { linearRegressionNormal, computeMSE, gradientDescentSteps, LinearRegressionState } from '@/lib/algorithms/linearRegression';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { Shuffle } from 'lucide-react';

const WIDTH = 600;
const HEIGHT = 400;
const PADDING = 50;

function scaleX(x: number, maxX: number): number {
  return PADDING + (x / maxX) * (WIDTH - 2 * PADDING);
}
function scaleY(y: number, maxY: number): number {
  return HEIGHT - PADDING - (y / maxY) * (HEIGHT - 2 * PADDING);
}

export default function LinearRegressionViz() {
  const [data, setData] = useState<Point2D[]>(() => generateLinearData(40, 0.5, 1.5, 2));
  const [showResiduals, setShowResiduals] = useState(true);
  const [mode, setMode] = useState<'normal' | 'gradient'>('gradient');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [gdState, setGdState] = useState<LinearRegressionState | null>(null);
  const stepsRef = useRef<Generator<LinearRegressionState> | null>(null);
  const [hoverPoint, setHoverPoint] = useState<number | null>(null);

  const normalResult = useMemo(() => linearRegressionNormal(data), [data]);
  const maxX = useMemo(() => Math.max(...data.map(p => p.x)) * 1.1, [data]);
  const maxY = useMemo(() => Math.max(...data.map(p => p.y)) * 1.1, [data]);

  const currentSlope = mode === 'normal' ? normalResult.slope : (gdState?.slope ?? 0);
  const currentIntercept = mode === 'normal' ? normalResult.intercept : (gdState?.intercept ?? 0);
  const currentMSE = useMemo(
    () => computeMSE(data, currentSlope, currentIntercept),
    [data, currentSlope, currentIntercept]
  );

  const randomizeData = useCallback(() => {
    const slope = 0.5 + Math.random() * 2;
    const intercept = Math.random() * 5;
    const noise = 0.2 + Math.random() * 0.8;
    setData(generateLinearData(40, noise, slope, intercept));
    setGdState(null);
    stepsRef.current = null;
    setIsPlaying(false);
  }, []);

  const resetGD = useCallback(() => {
    stepsRef.current = gradientDescentSteps(data, 0.002, 200);
    setGdState(null);
    setIsPlaying(false);
  }, [data]);

  const stepGD = useCallback((): boolean => {
    if (!stepsRef.current) {
      stepsRef.current = gradientDescentSteps(data, 0.002, 200);
    }
    const next = stepsRef.current.next();
    if (next.done) {
      setIsPlaying(false);
      return false;
    }
    setGdState(next.value);
    return !next.value.converged;
  }, [data]);

  useSimulationLoop(stepGD, speed, isPlaying && mode === 'gradient');

  // Line points
  const lineX1 = 0;
  const lineX2 = maxX;
  const lineY1 = currentSlope * lineX1 + currentIntercept;
  const lineY2 = currentSlope * lineX2 + currentIntercept;

  return (
    <div className="w-full glass-card p-6">
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <button
          onClick={randomizeData}
          className="btn-secondary flex items-center gap-2 text-xs py-2 px-3"
        >
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="flex gap-1 p-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)]">
          <button
            onClick={() => { setMode('normal'); setIsPlaying(false); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'normal' ? 'bg-indigo-500/20 text-indigo-300' : 'text-[var(--text-muted)]'
            }`}
          >
            Normal Equation
          </button>
          <button
            onClick={() => { setMode('gradient'); resetGD(); }}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              mode === 'gradient' ? 'bg-indigo-500/20 text-indigo-300' : 'text-[var(--text-muted)]'
            }`}
          >
            Gradient Descent
          </button>
        </div>
        <label className="flex items-center gap-2 text-xs text-[var(--text-muted)] cursor-pointer">
          <input
            type="checkbox"
            checked={showResiduals}
            onChange={(e) => setShowResiduals(e.target.checked)}
            className="accent-indigo-500"
          />
          Tampilkan Residual
        </label>
      </div>

      {/* SVG Visualization */}
      <div className="viz-container p-4">
        <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto" style={{ maxHeight: 420 }}>
          {/* Grid lines */}
          {Array.from({ length: 6 }).map((_, i) => {
            const x = PADDING + (i / 5) * (WIDTH - 2 * PADDING);
            const y = PADDING + (i / 5) * (HEIGHT - 2 * PADDING);
            return (
              <g key={i}>
                <line x1={x} y1={PADDING} x2={x} y2={HEIGHT - PADDING} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
                <line x1={PADDING} y1={y} x2={WIDTH - PADDING} y2={y} stroke="rgba(99,102,241,0.08)" strokeWidth={1} />
              </g>
            );
          })}

          {/* Axes */}
          <line x1={PADDING} y1={HEIGHT - PADDING} x2={WIDTH - PADDING} y2={HEIGHT - PADDING} stroke="var(--border-color)" strokeWidth={1.5} />
          <line x1={PADDING} y1={PADDING} x2={PADDING} y2={HEIGHT - PADDING} stroke="var(--border-color)" strokeWidth={1.5} />

          {/* Residual lines */}
          {showResiduals && data.map((point, i) => {
            const predicted = currentSlope * point.x + currentIntercept;
            return (
              <line
                key={`res-${i}`}
                x1={scaleX(point.x, maxX)}
                y1={scaleY(point.y, maxY)}
                x2={scaleX(point.x, maxX)}
                y2={scaleY(predicted, maxY)}
                stroke="rgba(251,113,133,0.4)"
                strokeWidth={1}
                strokeDasharray="3,3"
              />
            );
          })}

          {/* Regression line */}
          <motion.line
            x1={scaleX(lineX1, maxX)}
            y1={scaleY(lineY1, maxY)}
            x2={scaleX(lineX2, maxX)}
            y2={scaleY(lineY2, maxY)}
            stroke="url(#lineGrad)"
            strokeWidth={2.5}
            strokeLinecap="round"
            animate={{
              x1: scaleX(lineX1, maxX),
              y1: scaleY(lineY1, maxY),
              x2: scaleX(lineX2, maxX),
              y2: scaleY(lineY2, maxY),
            }}
            transition={{ duration: 0.3 }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="lineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#818cf8" />
              <stop offset="100%" stopColor="#c084fc" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Data points */}
          {data.map((point, i) => (
            <g key={`pt-${i}`}>
              <circle
                cx={scaleX(point.x, maxX)}
                cy={scaleY(point.y, maxY)}
                r={hoverPoint === i ? 6 : 4}
                fill={hoverPoint === i ? '#c084fc' : '#818cf8'}
                stroke="rgba(99,102,241,0.3)"
                strokeWidth={hoverPoint === i ? 3 : 1}
                style={{ cursor: 'pointer', transition: 'all 0.2s' }}
                filter={hoverPoint === i ? 'url(#glow)' : undefined}
                onMouseEnter={() => setHoverPoint(i)}
                onMouseLeave={() => setHoverPoint(null)}
              />
              {hoverPoint === i && (
                <text
                  x={scaleX(point.x, maxX) + 10}
                  y={scaleY(point.y, maxY) - 10}
                  fill="var(--text-primary)"
                  fontSize="11"
                  fontFamily="JetBrains Mono, monospace"
                >
                  ({point.x.toFixed(1)}, {point.y.toFixed(1)})
                </text>
              )}
            </g>
          ))}

          {/* Axis labels */}
          <text x={WIDTH / 2} y={HEIGHT - 10} fill="var(--text-muted)" fontSize="12" textAnchor="middle" fontFamily="Inter">X</text>
          <text x={15} y={HEIGHT / 2} fill="var(--text-muted)" fontSize="12" textAnchor="middle" fontFamily="Inter" transform={`rotate(-90, 15, ${HEIGHT / 2})`}>Y</text>
        </svg>
      </div>

      {/* Controls */}
      {mode === 'gradient' && (
        <SimulationControls
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onReset={resetGD}
          onStep={stepGD}
          isPlaying={isPlaying}
          speed={speed}
          onSpeedChange={setSpeed}
          iteration={gdState?.iteration ?? 0}
          maxIteration={200}
          extraInfo={`MSE: ${currentMSE.toFixed(4)}`}
        />
      )}

      {/* Info panel */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Slope (m)</div>
          <div className="text-sm font-mono font-semibold text-white">{currentSlope.toFixed(4)}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Intercept (b)</div>
          <div className="text-sm font-mono font-semibold text-white">{currentIntercept.toFixed(4)}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">MSE</div>
          <div className="text-sm font-mono font-semibold text-amber-400">{currentMSE.toFixed(4)}</div>
        </div>
        <div className="glass-card p-3 text-center">
          <div className="text-xs text-[var(--text-muted)] mb-1">Data Points</div>
          <div className="text-sm font-mono font-semibold text-white">{data.length}</div>
        </div>
      </div>

      {/* 🎓 Educational Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-indigo-500">
          <h4 className="text-sm font-bold text-indigo-300 mb-2">📐 Slope (Kemiringan)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat tingkat tanjakan jalan. Angka positif berarti jalan menanjak (jika X bertambah, Y ikut bertambah). Semakin besar angkanya, semakin drastis perubahannya.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-purple-500">
          <h4 className="text-sm font-bold text-purple-300 mb-2">📍 Intercept (Titik Awal)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat "biaya pendaftaran". Ini adalah nilai atau posisi awal (Y) bahkan ketika fitur (X) belum memberikan pengaruh apa-apa atau bernilai nol.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📊 MSE (Skor Kesalahan)</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Skor seberapa meleset tebakan garis kita. Semakin kecil angkanya, semakin akurat garis tersebut memeluk titik-titik data.
          </p>
        </div>
      </div>
    </div>
  );
}
