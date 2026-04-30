'use client';

import { useState, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shuffle, AlertTriangle, Scale, Target } from 'lucide-react';
import SimulationControls, { useSimulationLoop } from '../SimulationControls';
import { generateClassificationData, LabeledPoint2D } from '@/lib/datasets';

const W = 600, H = 300, P = 30;
const CLASS_COLORS = ['#818cf8', '#fb7185', '#34d399', '#fbbf24'];

interface WeakLearner {
  axis: 'x' | 'y';
  threshold: number;
  leftLabel: number;
  rightLabel: number;
  error: number;
  alpha: number;
}

function buildAdaBoostSequence(data: LabeledPoint2D[], numRounds: number) {
  const n = data.length;
  let weights = new Array(n).fill(1 / n);
  const learners: WeakLearner[] = [];
  const weightHistory: number[][] = [weights.slice()];

  for (let round = 0; round < numRounds; round++) {
    // Find best stump considering weights
    let bestStump: WeakLearner | null = null;
    let bestError = Infinity;

    for (let attempt = 0; attempt < 20; attempt++) {
      const axis = Math.random() > 0.5 ? 'x' : 'y';
      const vals = data.map(p => axis === 'x' ? p.x : p.y);
      const min = Math.min(...vals), max = Math.max(...vals);
      const threshold = min + Math.random() * (max - min);

      const left = data.filter(p => (axis === 'x' ? p.x : p.y) <= threshold);
      const right = data.filter(p => (axis === 'x' ? p.x : p.y) > threshold);

      const getWeightedMode = (pts: LabeledPoint2D[]) => {
        if (pts.length === 0) return 0;
        const counts: Record<number, number> = {};
        pts.forEach(p => {
          const idx = data.indexOf(p);
          counts[p.label] = (counts[p.label] || 0) + weights[idx];
        });
        return parseInt(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
      };

      const leftLabel = getWeightedMode(left);
      const rightLabel = getWeightedMode(right);

      let error = 0;
      data.forEach((p, i) => {
        const pred = (axis === 'x' ? p.x : p.y) <= threshold ? leftLabel : rightLabel;
        if (pred !== p.label) error += weights[i];
      });

      if (error < bestError) {
        bestError = error;
        bestStump = { axis, threshold, leftLabel, rightLabel, error, alpha: 0 };
      }
    }

    if (!bestStump || bestStump.error >= 0.5) break;

    const alpha = 0.5 * Math.log((1 - bestStump.error) / Math.max(bestStump.error, 1e-10));
    bestStump.alpha = alpha;
    learners.push(bestStump);

    // Update weights
    const newWeights = weights.map((w, i) => {
      const pred = (bestStump!.axis === 'x' ? data[i].x : data[i].y) <= bestStump!.threshold ? bestStump!.leftLabel : bestStump!.rightLabel;
      const correct = pred === data[i].label;
      return w * Math.exp(correct ? -alpha : alpha);
    });
    const sumW = newWeights.reduce((a, b) => a + b, 0);
    weights = newWeights.map(w => w / sumW);
    weightHistory.push(weights.slice());
  }

  return { learners, weightHistory };
}

const NUM_ROUNDS = 4;

export default function AdaBoostViz() {
  const [data, setData] = useState<LabeledPoint2D[]>(() => generateClassificationData(60, 'circle'));
  const [dataType, setDataType] = useState<'xor' | 'linear' | 'circle'>('circle');
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [step, setStep] = useState(0);

  const { learners, weightHistory } = useMemo(() => buildAdaBoostSequence(data, NUM_ROUNDS), [data]);
  const totalSteps = learners.length + 2; // 0=init, 1..N=rounds, N+1=final

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

  const activeRound = step >= 1 && step <= learners.length ? step - 1 : -1;
  const currentWeights = step === 0 ? weightHistory[0] : (step <= learners.length ? weightHistory[step] : weightHistory[weightHistory.length - 1]);
  const maxWeight = currentWeights ? Math.max(...currentWeights) : 1;

  // Final combined prediction
  const finalPredictions = useMemo(() => {
    if (step < totalSteps - 1) return null;
    return data.map(pt => {
      const scores: Record<number, number> = {};
      learners.forEach(l => {
        const pred = (l.axis === 'x' ? pt.x : pt.y) <= l.threshold ? l.leftLabel : l.rightLabel;
        scores[pred] = (scores[pred] || 0) + l.alpha;
      });
      return parseInt(Object.entries(scores).sort((a, b) => b[1] - a[1])[0][0]);
    });
  }, [step, totalSteps, data, learners]);

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
        {/* Scatter Plot with weighted points */}
        <div className="lg:col-span-3 viz-container p-4">
          <div className="text-xs text-center text-[var(--text-muted)] mb-2">
            {step === 0 && '⚖️ Semua titik dimulai dengan bobot yang sama (ukuran sama rata)'}
            {activeRound >= 0 && `📝 Sesi ${activeRound + 1}: Titik yang SALAH ditebak membesar (bobotnya naik!)`}
            {step === totalSteps - 1 && '🎯 Gabungan berbobot dari semua sesi — akurasi meningkat!'}
          </div>
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto" style={{ maxHeight: 340 }}>
            <rect x={P} y={P} width={W - 2 * P} height={H - 2 * P} fill="rgba(10,10,26,0.5)" rx="8" />

            {/* Decision boundary for active round */}
            <AnimatePresence>
              {activeRound >= 0 && (() => {
                const l = learners[activeRound];
                if (l.axis === 'x') {
                  return <motion.line key={`split-${activeRound}`} x1={sx(l.threshold)} y1={sy(100)} x2={sx(l.threshold)} y2={sy(0)}
                    stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6,4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />;
                } else {
                  return <motion.line key={`split-${activeRound}`} x1={sx(0)} y1={sy(l.threshold)} x2={sx(100)} y2={sy(l.threshold)}
                    stroke="#fbbf24" strokeWidth={2.5} strokeDasharray="6,4"
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />;
                }
              })()}
            </AnimatePresence>

            {/* Data points — size based on weight */}
            {data.map((pt, i) => {
              const weight = currentWeights ? currentWeights[i] : 1 / data.length;
              const normalizedSize = 2 + (weight / maxWeight) * 8;
              const finalPred = finalPredictions ? finalPredictions[i] : null;
              const fillColor = finalPred !== null ? CLASS_COLORS[finalPred] : CLASS_COLORS[pt.label];
              const isWrong = finalPred !== null && finalPred !== pt.label;

              // Check if misclassified by current learner
              let misclassifiedNow = false;
              if (activeRound >= 0) {
                const l = learners[activeRound];
                const pred = (l.axis === 'x' ? pt.x : pt.y) <= l.threshold ? l.leftLabel : l.rightLabel;
                misclassifiedNow = pred !== pt.label;
              }

              return (
                <motion.circle key={i} cx={sx(pt.x)} cy={sy(pt.y)}
                  fill={fillColor}
                  stroke={isWrong ? '#ef4444' : (misclassifiedNow ? '#fbbf24' : `${CLASS_COLORS[pt.label]}50`)}
                  strokeWidth={isWrong || misclassifiedNow ? 2 : 0.5}
                  animate={{ r: finalPred !== null ? 4 : normalizedSize }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  opacity={0.85}
                />
              );
            })}
          </svg>
        </div>

        {/* Rounds Panel */}
        <div className="lg:col-span-2 flex flex-col gap-2">
          <div className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
            <Scale className="w-4 h-4 text-amber-400" /> Sesi Belajar Berurutan
          </div>
          {learners.map((learner, i) => {
            const isActive = activeRound === i;
            const isPast = step > i + 1;
            const isVisible = step >= i + 1;
            return (
              <motion.div key={i}
                initial={{ opacity: 0.3 }}
                animate={{
                  opacity: isVisible ? 1 : 0.3,
                  scale: isActive ? 1.02 : 1,
                }}
                className={`p-3 rounded-xl border-2 transition-all ${
                  isActive ? 'border-amber-500 bg-amber-500/10 shadow-[0_0_15px_rgba(245,158,11,0.15)]'
                    : isPast ? 'border-emerald-500/30 bg-[var(--bg-card)]'
                    : 'border-[var(--border-color)] bg-[var(--bg-card)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className={`w-4 h-4 ${isActive ? 'text-amber-400' : (isPast ? 'text-emerald-400' : 'text-slate-600')}`} />
                  <span className={`text-xs font-bold ${isActive ? 'text-amber-300' : (isPast ? 'text-emerald-300' : 'text-slate-500')}`}>
                    Sesi {i + 1}
                  </span>
                  {isPast && <span className="text-[10px] text-emerald-400 ml-auto">✓</span>}
                  {isActive && <span className="text-[10px] text-amber-400 ml-auto animate-pulse">● Fokus kesalahan</span>}
                </div>
                {isVisible && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}
                    className="text-[10px] text-[var(--text-muted)] leading-relaxed space-y-0.5">
                    <div>Batas: <span className="text-white font-mono">{learner.axis.toUpperCase()} = {learner.threshold.toFixed(1)}</span></div>
                    <div>Error: <span className="text-rose-400 font-mono">{(learner.error * 100).toFixed(1)}%</span> | 
                      Pengaruh (α): <span className="text-amber-300 font-mono">{learner.alpha.toFixed(2)}</span></div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px]">Kekuatan suara:</span>
                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                        <motion.div className="h-full bg-amber-400 rounded-full" initial={{ width: 0 }}
                          animate={{ width: `${Math.min(learner.alpha / 2 * 100, 100)}%` }} transition={{ duration: 0.5 }} />
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}

          {/* Final combined result */}
          <AnimatePresence>
            {step >= totalSteps - 1 && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="p-3 rounded-xl border-2 border-emerald-500 bg-emerald-500/10 mt-1">
                <div className="flex items-center gap-2">
                  <Target className="w-5 h-5 text-emerald-400" />
                  <span className="text-sm font-black text-white">Gabungan Berbobot</span>
                </div>
                <div className="text-[10px] text-[var(--text-muted)] mt-1">
                  {finalPredictions && (() => {
                    const correct = data.filter((pt, i) => finalPredictions[i] === pt.label).length;
                    return `Akurasi gabungan: ${(correct / data.length * 100).toFixed(1)}% — Sesi dengan error rendah punya suara lebih kuat!`;
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
        <div className="glass-card p-4 border-l-4 border-rose-500">
          <h4 className="text-sm font-bold text-rose-300 mb-2">⚖️ Bobot Berubah = Ukuran Berubah</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Perhatikan ukuran titik! Di awal semua <b>sama besar</b>. Setelah sesi belajar, titik yang <b>salah ditebak membesar</b> — 
            artinya sesi berikutnya akan <b>lebih fokus</b> mempelajari titik-titik sulit ini. Ibarat guru yang memberi soal remedial khusus untuk materi yang belum dikuasai.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-amber-500">
          <h4 className="text-sm font-bold text-amber-300 mb-2">📊 Pengaruh (Alpha) = Kekuatan Suara</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            Setiap sesi belajar mendapat <b>kekuatan suara (α)</b> berdasarkan seberapa akuratnya. 
            Sesi yang pintar (error rendah) punya <b>suara lebih besar</b> saat voting akhir. Sesi yang banyak salah, suaranya dikecilkan.
          </p>
        </div>
        <div className="glass-card p-4 border-l-4 border-emerald-500">
          <h4 className="text-sm font-bold text-emerald-300 mb-2">🎯 Adaptif = Semakin Pintar</h4>
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            "Ada" dalam AdaBoost berarti <b>Adaptif</b>. Model ini <b>beradaptasi</b> dengan mempelajari kelemahannya sendiri. 
            Setiap sesi baru memperbaiki kesalahan sesi sebelumnya, sehingga gabungannya jauh lebih akurat dari satu model tunggal.
          </p>
        </div>
      </div>
    </div>
  );
}
