'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, Leaf, BarChart3, Zap, Target } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 300, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

interface LGBStage {
  axis: 'x' | 'y';
  threshold: number;
  leftLabel: number;
  rightLabel: number;
  leafError: number;
  isLeafWise: boolean; // true = expanded from worst leaf
}

function buildLGBSequence(data: LabeledPoint2D[], numStages: number) {
  const stages: LGBStage[] = [];
  const scores: number[][] = data.map(() => [0, 0]);
  const lr = 0.3;

  // Track regions (leaf-wise)
  interface LGBRegion { minX: number; maxX: number; minY: number; maxY: number; error: number; }
  let regions: LGBRegion[] = [{ minX: 0, maxX: 100, minY: 0, maxY: 100, error: 1 }];

  for (let s = 0; s < numStages; s++) {
    // Find worst leaf (highest error) - LEAF-WISE strategy
    const regionErrors = regions.map(r => {
      const pts = data.filter(p => p.x >= r.minX && p.x <= r.maxX && p.y >= r.minY && p.y <= r.maxY);
      if (pts.length === 0) return 0;
      const misclassified = pts.filter((p, _) => {
        const idx = data.indexOf(p);
        return (scores[idx][0] > scores[idx][1] ? 0 : 1) !== p.label;
      }).length;
      return misclassified / pts.length;
    });

    const worstIdx = regionErrors.indexOf(Math.max(...regionErrors));
    const worstRegion = regions[worstIdx];

    // Split worst region
    const ptsInRegion = data.filter(p => p.x >= worstRegion.minX && p.x <= worstRegion.maxX && p.y >= worstRegion.minY && p.y <= worstRegion.maxY);
    if (ptsInRegion.length < 2) break;

    let bestStage: LGBStage | null = null;
    let bestCorrect = -Infinity;

    for (let attempt = 0; attempt < 20; attempt++) {
      const axis = Math.random() > 0.5 ? 'x' : 'y';
      const vals = ptsInRegion.map(p => axis === 'x' ? p.x : p.y);
      const min = Math.min(...vals), max = Math.max(...vals);
      if (max <= min) continue;
      const threshold = min + Math.random() * (max - min);

      const left = ptsInRegion.filter(p => (axis === 'x' ? p.x : p.y) <= threshold);
      const right = ptsInRegion.filter(p => (axis === 'x' ? p.x : p.y) > threshold);

      const getMode = (pts: LabeledPoint2D[]) => {
        if (pts.length === 0) return 0;
        const counts: Record<number, number> = {};
        pts.forEach(p => { counts[p.label] = (counts[p.label] || 0) + 1; });
        return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
      };

      const leftLabel = getMode(left);
      const rightLabel = getMode(right);

      const tempScores = scores.map((sc, i) => {
        const p = data[i];
        if (p.x < worstRegion.minX || p.x > worstRegion.maxX || p.y < worstRegion.minY || p.y > worstRegion.maxY) return sc;
        const pred = (axis === 'x' ? p.x : p.y) <= threshold ? leftLabel : rightLabel;
        return [sc[0] + (pred === 0 ? lr : 0), sc[1] + (pred === 1 ? lr : 0)];
      });
      const correct = data.filter((pt, i) => (tempScores[i][0] > tempScores[i][1] ? 0 : 1) === pt.label).length;

      if (correct > bestCorrect) {
        bestCorrect = correct;
        bestStage = { axis, threshold, leftLabel, rightLabel, leafError: regionErrors[worstIdx], isLeafWise: true };
      }
    }

    if (!bestStage) break;
    stages.push(bestStage);

    // Update scores
    data.forEach((p, i) => {
      if (p.x < worstRegion.minX || p.x > worstRegion.maxX || p.y < worstRegion.minY || p.y > worstRegion.maxY) return;
      const pred = (bestStage!.axis === 'x' ? p.x : p.y) <= bestStage!.threshold ? bestStage!.leftLabel : bestStage!.rightLabel;
      scores[i][pred] += lr;
    });

    // Split region
    const newRegions = regions.filter((_, idx) => idx !== worstIdx);
    if (bestStage.axis === 'x') {
      newRegions.push({ ...worstRegion, maxX: bestStage.threshold, error: 0 });
      newRegions.push({ ...worstRegion, minX: bestStage.threshold, error: 0 });
    } else {
      newRegions.push({ ...worstRegion, maxY: bestStage.threshold, error: 0 });
      newRegions.push({ ...worstRegion, minY: bestStage.threshold, error: 0 });
    }
    regions = newRegions;
  }

  return { stages, finalScores: scores };
}

const NUM_STAGES = 6;

export default function LightGBMViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(60, 'circle'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('circle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  const { stages, finalScores } = useMemo(() => buildLGBSequence(data, NUM_STAGES), [data]);
  const totalSteps = stages.length + 2;

  const nextStep = useCallback((): boolean => {
    if (step >= totalSteps - 1) { setIsPlaying(false); return false; }
    setStep(s => s + 1);
    return true;
  }, [step, totalSteps]);

  const reset = useCallback(() => { setStep(0); setIsPlaying(false); }, []);
  const randomize = useCallback(() => {
    setData(generateClassificationData(60, dataType));
    setStep(0); setIsPlaying(false);
  }, [dataType]);

  useSimulationLoop(nextStep, speed * 0.3, isPlaying);

  const sx = (x: number) => P + (x / 100) * (W - 2 * P);
  const sy = (y: number) => H - P - (y / 100) * (H - 2 * P);

  const activeStage = step >= 1 && step <= stages.length ? step - 1 : -1;

  const finalPredictions = useMemo(() => {
    if (step < totalSteps - 1) return null;
    return data.map((_, i) => finalScores[i][0] > finalScores[i][1] ? 0 : 1);
  }, [step, totalSteps, data, finalScores]);

  // Histogram bins visualization data
  const histogramBins = useMemo(() => {
    const bins = Array(10).fill(0);
    data.forEach(p => {
      const binIdx = Math.min(Math.floor(p.x / 10), 9);
      bins[binIdx]++;
    });
    const maxBin = Math.max(...bins);
    return bins.map(b => b / maxBin);
  }, [data]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4 mb-6 bg-[var(--bg-secondary)] border border-[var(--border-color)] p-4 rounded-xl">
        <button onClick={randomize} className="btn-secondary flex items-center gap-2 text-xs py-2 px-3 shrink-0">
          <Shuffle className="w-3 h-3" /> Data Baru
        </button>
        <div className="h-6 w-px bg-[var(--border-color)] mx-2 hidden sm:block"></div>
        <select value={dataType} onChange={e => { const t = e.target.value as any; setDataType(t); setData(generateClassificationData(60, t)); setStep(0); }}
          className="px-3 py-1.5 rounded-lg border border-[var(--border-color)] bg-[var(--bg-card)] text-[var(--text-primary)] text-xs">
          <option value="circle">Pola Melingkar</option>
          <option value="xor">Pola Silang (XOR)</option>
          <option value="linear">Pola Linear</option>
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '🌿 LightGBM: Hanya membelah daun dengan error TERBESAR (Leaf-Wise)'}
            {activeStage >= 0 && `🍂 Sesi ${activeStage + 1}: Membelah area dengan error terbesar (${(stages[activeStage].leafError * 100).toFixed(0)}%)`}
            {step === totalSteps - 1 && '⚡ Prediksi akhir — lebih efisien karena hanya fokus area terburuk!'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Decision boundaries — show accumulation */}
            {stages.map((s, i) => {
              if (step < i + 1) return null;
              const isActive = activeStage === i;
              const color = isActive ? '#38bdf8' : '#0ea5e9';
              if (s.axis === 'x') {
                return <motion.line key={`split-${i}`} x1={sx(s.threshold)} y1={sy(100)} x2={sx(s.threshold)} y2={sy(0)}
                  stroke={color} strokeWidth={isActive ? 3 : 1.5} strokeDasharray={isActive ? "none" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : 0.3 }} />;
              } else {
                return <motion.line key={`split-${i}`} x1={sx(0)} y1={sy(s.threshold)} x2={sx(100)} y2={sy(s.threshold)}
                  stroke={color} strokeWidth={isActive ? 3 : 1.5} strokeDasharray={isActive ? "none" : "3,3"}
                  initial={{ opacity: 0 }} animate={{ opacity: isActive ? 1 : 0.3 }} />;
              }
            })}

            {data.map((pt, i) => {
              const finalPred = finalPredictions ? finalPredictions[i] : null;
              const fillColor = finalPred !== null ? CLASS_COLORS[finalPred] : CLASS_COLORS[pt.label];
              const isWrong = finalPred !== null && finalPred !== pt.label;
              return (
                <motion.circle key={i} cx={sx(pt.x)} cy={sy(pt.y)} r={4}
                  fill={fillColor}
                  stroke={isWrong ? '#ef4444' : `${CLASS_COLORS[pt.label]}50`}
                  strokeWidth={isWrong ? 2 : 0.5} opacity={0.85} />
              );
            })}
          </svg>
        </div>

        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Leaf className="w-4 h-4 text-sky-400" /> LightGBM: Ringan & Cepat
          </div>

          {/* Histogram binning visual */}
          <div className="p-3 rounded-xl border border-sky-500/30 bg-sky-500/5">
            <div className="flex items-center gap-2 mb-2">
              <BarChart3 className="w-4 h-4 text-sky-400" />
              <span className="text-xs font-bold text-sky-300">Histogram Binning (Penyederhanaan)</span>
            </div>
            <div className="flex items-end gap-0.5 h-10">
              {histogramBins.map((h, i) => (
                <motion.div key={i} className="flex-1 bg-gradient-to-t from-sky-600 to-sky-400 rounded-t-sm"
                  initial={{ height: 0 }}
                  animate={{ height: `${h * 100}%` }}
                  transition={{ duration: 0.3, delay: i * 0.05 }} />
              ))}
            </div>
            <p className="text-[8px] text-slate-500 mt-1">Data angka dikelompokkan jadi "bin" agar lebih cepat diproses</p>
          </div>

          {/* Leaf-wise explanation */}
          <div className="p-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5">
            <div className="flex items-center gap-2 mb-1">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span className="text-xs font-bold text-emerald-300">Leaf-Wise vs Level-Wise</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20">
                <div className="font-bold text-emerald-300 mb-1">✅ Leaf-Wise (LightGBM)</div>
                <div className="text-slate-400">Hanya perbaiki daun <b>terburuk</b> — lebih efisien!</div>
              </div>
              <div className="p-2 rounded bg-slate-500/10 border border-slate-500/20">
                <div className="font-bold text-slate-300 mb-1">Level-Wise (Biasa)</div>
                <div className="text-slate-400">Perbaiki semua daun di satu level — boros energi.</div>
              </div>
            </div>
          </div>

          {stages.map((stage, i) => {
            const isActive = activeStage === i;
            const isPast = step > i + 1;
            const isVisible = step >= i + 1;
            return (
              <motion.div key={i}
                initial={{ opacity: 0.3 }}
                animate={{ opacity: isVisible ? 1 : 0.3, scale: isActive ? 1.02 : 1 }}
                className={`p-2 rounded-lg border transition-all text-[10px] ${
                  isActive ? 'border-sky-500 bg-sky-500/10' : isPast ? 'border-emerald-500/20 bg-[var(--bg-card)]' : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}>
                <div className="flex items-center gap-2">
                  <Leaf className={`w-3 h-3 ${isActive ? 'text-sky-400' : isPast ? 'text-emerald-400' : 'text-slate-600'}`} />
                  <span className={`font-bold ${isActive ? 'text-sky-300' : isPast ? 'text-emerald-300' : 'text-slate-500'}`}>
                    Belah {i + 1}
                  </span>
                  {isPast && <span className="text-emerald-400 ml-auto">✓</span>}
                  {isActive && <span className="text-[9px] text-rose-400 ml-auto animate-pulse">● Error area: {(stage.leafError * 100).toFixed(0)}%</span>}
                </div>
              </motion.div>
            );
          })}

          <AnimatePresence>
            {step >= totalSteps - 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 mt-1">
                <div className="flex items-center gap-2">
                  <Zap className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">LightGBM Selesai!</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  {finalPredictions && (() => {
                    const correct = data.filter((pt, i) => finalPredictions[i] === pt.label).length;
                    return `Akurasi: ${(correct / data.length * 100).toFixed(1)}% — Super ringan & cepat!`;
                  })()}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <SimulationControls
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onReset={reset}
        onStep={nextStep}
        isPlaying={isPlaying}
        speed={speed}
        onSpeedChange={setSpeed}
        iteration={step}
        maxIteration={totalSteps - 1}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
        <div className="glass-card p-4 border-l-4 border-sky-500">
          <h4 className="text-sm font-bold text-sky-300 mb-2">🌿 Leaf-Wise Growth</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Ibarat <b>dokter yang langsung mengobati luka terbesar</b> terlebih dahulu, bukan memeriksa semua luka kecil satu per satu. 
            LightGBM hanya membelah <b>daun dengan error terbesar</b>, jadi lebih efisien dan hasilnya lebih cepat akurat.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📊 Histogram Binning</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Lihat grafik batang di panel kanan! Data angka yang kontinu <b>dikelompokkan ke kotak-kotak (bin)</b>.
            Ibarat menyortir uang koin ke dalam toples — tidak perlu menghitung satu per satu, cukup lihat toples mana yang paling berat.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🚀 Mengapa "Light"?</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            "Light" berarti ringan! Dengan <b>Histogram Binning + Leaf-Wise + GOSS</b> (membuang data yang sudah benar),
            LightGBM bisa memproses <b>jutaan data</b> tanpa memakan banyak memori. Cocok untuk dataset raksasa.
          </p>
        </div>
      </div>
    </div>
  );
}
